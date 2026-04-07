# 批量建计划问题调查笔记

## 范围
- `src/optimizer/keyword-plan-api/component-config.js`
- `src/optimizer/keyword-plan-api/search-and-draft.js`
- `src/optimizer/keyword-plan-api/scene-spec.js`
- `src/optimizer/keyword-plan-api/runtime.js`
- `tests/*keyword*plan*`, `tests/*create*repair*`, 以及相关批量建计划测试

## 初步观察
- `component-config.js` 的 `buildDefaultPlanByScene` 只保证 `planName`，对要求商品的场景仅写入空的 `itemId`；关键词场景仅放一个空关键词占位。
- `search-and-draft.js` 的 `normalizePlans` 会大量做 request 级回填，并在 `requiresItem` 场景下直接过滤掉无商品 plan，这意味着“参数缺失”可能被吞成“计划数变少”而不是显式报错。
- `scene-spec.js` 的 `resolveGoalSpecForScene` 在 `marketingGoal` 缺失或未命中时会自动回退默认目标，并生成 warning；若调用方未展示 warning，真实问题会被隐藏。
- `buildSolutionFromPlan` 后段对部分场景强制补 `planId/planTemplateId/packageTemplateId/orderInfo`，也会按模板/能力做字段删除，存在“用户传了但被覆盖/删掉”的风险。

## 待验证问题
- 批量请求中每个 `plan` 是否应该强制带独立 `marketingGoal` / `sceneSettings`，还是设计上依赖 request 级字段。
- `normalizePlans` 对 `preferredItems` 的顺序填充是否会导致批量商品与计划错配。
- capability prune 是否会误删某些场景在创建接口上必需、但模板未返回的字段。
- 测试是否只覆盖“能创建”，未覆盖“参数被默认值静默替换”。

## 子代理汇总结论
- 目标解析链路存在过强容错：`marketingGoal` 缺失/未命中时会回退默认目标，并回写 request 与 plan；模糊匹配命中不记 fallback。
- `normalizePlans` 存在静默吞参：`plan.materialId` 不被识别；缺商品 plan 会被过滤掉；`request.itemId/materialId` 会把多 plan 回填成同一商品。
- payload 构造存在构造后再删/再覆盖：关键词自定义白名单裁剪、非关键词模板 capability prune、`itemIdList` 二次重写、线索推广硬编码 `planId/planTemplateId/packageTemplateId`。
- 测试以源码正则契约为主，缺少 `createPlansBatch/normalizePlans/buildSolutionFromPlan` 的行为级多计划隔离测试和 payload 快照测试。
- Git 历史显示高风险引入窗口集中在 2026-02-18 ~ 2026-02-19 的“场景隔离、API-only、目标推导、同场景分组”重写。

## 当前主线程判断
- 当前最像用户感知“参数缺失/错误”的并非单点 bug，而是三类组合效应：
  1. 参数缺失被默认值回退掩盖。
  2. plan 级缺商品/缺字段被静默过滤或 request 级字段吞并。
  3. payload 在构造后被场景白名单/capability/template prune 再次删改。
- 如果症状是“少建计划、建出来目标不对、商品绑错、某些场景字段消失”，上述三类可直接解释。
