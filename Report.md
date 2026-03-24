# 批量建立计划参数问题调查报告

## 调查目标
排查“批量建立计划项目”链路中是否存在参数缺失、参数错误、场景映射偏差、请求裁剪异常、测试盲区或历史回归窗口，并形成可直接指导后续修复的证据报告。

## 调查范围
- `src/optimizer/keyword-plan-api/request-builder-preview.js`
- `src/optimizer/keyword-plan-api/component-config.js`
- `src/optimizer/keyword-plan-api/create-and-suggest.js`
- `src/optimizer/keyword-plan-api/search-and-draft.js`
- `src/optimizer/keyword-plan-api/scene-spec.js`
- `src/optimizer/keyword-plan-api/wizard-open-and-create.js`
- `tests/` 中与 keyword-plan-api、批量建计划、营销目标、商品绑定、场景设置相关的回归测试
- Git 历史中 2026-02-18 至 2026-03-22 的相关提交

## 调查方法
- 主线程交叉阅读关键链路，核对参数从 UI 草稿到最终 payload 的流转。
- 并行启动 6 个子代理，分别覆盖：
  - UI/向导/组件配置入口
  - `normalizePlans` 默认兜底
  - `marketingGoal` / `sceneSettings` / `submitEndpoint` 解析
  - payload 构造与 capability prune
  - 测试覆盖与缺口
  - Git 历史与回归窗口
- 运行本地只读验证：
  - `node --test tests/keyword-create-repair-item-binding-guard.test.mjs tests/site-scene-item-binding.test.mjs tests/site-scene-submit-mode.test.mjs tests/keyword-edit-request-scene-settings-sync.test.mjs tests/matrix-plan-config.test.mjs`

## 执行摘要
当前问题不像是单一“某个参数没传上去”，而是三类机制叠加导致的系统性风险：

1. 参数缺失会被默认值回退掩盖。
2. plan 级缺参会被静默过滤或被 request 级字段吞并。
3. payload 在构造后还会被按场景白名单、template/capability 再次删改。

因此，用户感知到的“批量建立计划参数缺失/错误”，很可能表现为以下几种症状：
- 少建了几条计划
- 建出来的计划营销目标不对
- 多条计划绑定到了同一个商品
- 某些场景字段在最终提交时消失
- 线索推广看起来能建，但参数不是预期来源

## 当前参数来源链路
### 1. UI/向导如何生成 plan
`buildRequestFromWizard` 会为每个启用策略和每个绑定商品生成 `plan`，并写入以下关键字段：
- `sceneName`、`planName`、`item`、`bidMode`、`keywords`、`keywordDefaults`、`keywordSource`：`src/optimizer/keyword-plan-api/request-builder-preview.js:194-209`
- `marketingGoal`：`src/optimizer/keyword-plan-api/request-builder-preview.js:211-213`
- `sceneSettings`：`src/optimizer/keyword-plan-api/request-builder-preview.js:214-216`
- `budget`：`src/optimizer/keyword-plan-api/request-builder-preview.js:217-225`
- `campaignOverride`：`src/optimizer/keyword-plan-api/request-builder-preview.js:226-240`

### 2. UI 如何把单 plan 改造成可提交 request
`buildSceneRequestsFromWizard` 会把每个 `plan` 的 `sceneSettings` 归一到 request 级 `sceneSettings`，并删除 `plan.sceneName` 和 `plan.sceneSettings`：
- 归一与删字段：`src/optimizer/keyword-plan-api/request-builder-preview.js:391-397`
- 每条 scene request 最终仍然是 `plans: [plan]`，即一条 request 对应一条 plan：`src/optimizer/keyword-plan-api/request-builder-preview.js:460-474`
- request 级 `marketingGoal` 取值优先级为 `sceneSettings -> plan.marketingGoal -> fallbackGoal`：`src/optimizer/keyword-plan-api/request-builder-preview.js:434-468`

### 3. createPlansBatch 如何继续重写请求
`createPlansBatch` 进入后会再次做 request 级 `marketingGoal`、`submitEndpoint`、`goalForcedCampaignOverride`、runtime 补丁和 sceneSettings 映射：
- request 级 `marketingGoal` / `submitEndpoint` 回写：`src/optimizer/keyword-plan-api/create-and-suggest.js:162-223`, `src/optimizer/keyword-plan-api/create-and-suggest.js:480-504`
- `sceneSettings -> sceneForcedCampaignOverride`：`src/optimizer/keyword-plan-api/create-and-suggest.js:577-586`
- plan 级 `marketingGoal` / `submitEndpoint` 再次回写：`src/optimizer/keyword-plan-api/create-and-suggest.js:669-719`

### 4. 最终 payload 如何生成
最终 payload 由 `buildSolutionFromPlan` 组装，并在函数内部经历：
- runtime/template 选择：`src/optimizer/keyword-plan-api/search-and-draft.js:3650-3718`
- 商品绑定与 `itemIdList` 写入：`src/optimizer/keyword-plan-api/search-and-draft.js:3777-3783`, `src/optimizer/keyword-plan-api/search-and-draft.js:3872-3875`
- override 合并：`src/optimizer/keyword-plan-api/search-and-draft.js:2292-2331`, `src/optimizer/keyword-plan-api/search-and-draft.js:3867-3868`
- 按场景做二次删改/prune：`src/optimizer/keyword-plan-api/search-and-draft.js:3895-3900`, `src/optimizer/keyword-plan-api/search-and-draft.js:4174-4341`

## 核心发现

### P0. `marketingGoal` 缺失或错误时会被静默回退，且会回写 request 与 plan
**证据**
- 缺失时回退默认目标：`src/optimizer/keyword-plan-api/scene-spec.js:3760-3769`
- 未命中时回退默认目标：`src/optimizer/keyword-plan-api/scene-spec.js:3795-3801`
- 当场景 goal spec 缺失时，还会回退到 `runtime.storeData` 或 fallback 字段：`src/optimizer/keyword-plan-api/scene-spec.js:3735-3757`
- request 级会直接把 `resolvedMarketingGoal` 写回 `normalizedRequest.marketingGoal`，并顺带固化 `submitEndpoint`：`src/optimizer/keyword-plan-api/create-and-suggest.js:173-182`
- plan 级又会再次把 `resolvedMarketingGoal` 写回 `plan.marketingGoal`：`src/optimizer/keyword-plan-api/create-and-suggest.js:669-719`

**风险判断**
- 用户传错目标、漏传目标、目标识别失败，不会先失败，而会被修成默认目标继续跑。
- 批量创建时，这种“自动纠错”会扩散到每个 plan。
- 结果是“计划建出来了，但目标不对”，定位时很容易误以为上游参数没有问题。

### P0. 模糊目标匹配过宽，而且不记为 fallback
**证据**
- exact/key 匹配：`src/optimizer/keyword-plan-api/scene-spec.js:3772-3782`
- fuzzy 匹配：`src/optimizer/keyword-plan-api/scene-spec.js:3784-3792`
- fuzzy 命中后 `goalFallbackUsed: false`，也不新增 warning：同段代码

**风险判断**
- “接近但错误”的 `marketingGoal` 会被当成正确值处理。
- 从结果对象看，它既不是 fallback，也不一定被显式警告，误导性高于默认回退。

### P0. `normalizePlans` 会静默吞掉 plan 级缺商品问题
**证据**
- 只识别 `plan.item` 和 `plan.itemId`，不识别 `plan.materialId`：`src/optimizer/keyword-plan-api/search-and-draft.js:2266-2274`
- 如果 `request.itemId/request.materialId` 存在，会把同一个商品回填到每个缺商品的 plan：`src/optimizer/keyword-plan-api/search-and-draft.js:2229-2230`, `src/optimizer/keyword-plan-api/search-and-draft.js:2274-2280`
- 最终没有商品的 plan 会被 `filter` 掉，而不是进入失败明细：`src/optimizer/keyword-plan-api/search-and-draft.js:2286-2289`
- `requiresItem=true` 且既无 `plans` 又无 `preferredItems` 时，直接返回空数组：`src/optimizer/keyword-plan-api/search-and-draft.js:2231-2235`

**风险判断**
- 会出现“本来请求了 N 条，最后只建了 M 条”的现象。
- 会出现“多条计划全绑成同一个商品”的现象。
- 这类问题不会被准确标记为 plan 级失败，而会被吞成数量减少。

### P1. `planCount` 与 plan 自动扩展行为容易和用户预期不一致
**证据**
- 只有在“没有 `request.plans`、没有 `preferredItems`、且 `requiresItem=false`”时，`planCount` 才生效：`src/optimizer/keyword-plan-api/search-and-draft.js:2231-2242`
- 一旦有 `preferredItems`，最终 plan 数量直接等于 `preferredItems.length`，忽略 `planCount`：`src/optimizer/keyword-plan-api/search-and-draft.js:2244-2250`

**风险判断**
- 用户如果以为 `planCount` 是批量建计划的强约束，实际并不是。
- 这会解释“为什么设置了 planCount，但实际创建数量不对”。

### P1. payload 构造后仍会被场景白名单和 capability/template prune 再删改
**证据**
- 关键词自定义场景只允许固定字段进入，其他字段会在白名单裁剪中丢弃：`src/optimizer/keyword-plan-api/search-and-draft.js:1172-1214`, `src/optimizer/keyword-plan-api/search-and-draft.js:1335-1359`
- 非词包链路还会用正则广泛删除“词包/卡位/趋势/流量金卡”等字段：`src/optimizer/keyword-plan-api/search-and-draft.js:1129-1169`, `src/optimizer/keyword-plan-api/search-and-draft.js:3895-3900`
- `itemIdList` 会在 override 之后再次被强制重写或删除：`src/optimizer/keyword-plan-api/search-and-draft.js:3777-3783`, `src/optimizer/keyword-plan-api/search-and-draft.js:3867-3875`
- template 不匹配时会直接丢掉 `solutionTemplate`，进入保守删字段分支：`src/optimizer/keyword-plan-api/search-and-draft.js:3692-3717`, `src/optimizer/keyword-plan-api/search-and-draft.js:4316-4350`
- 即使有模板，也会把模板里不存在、又没被识别为显式字段的参数删掉：`src/optimizer/keyword-plan-api/search-and-draft.js:4316-4341`

**风险判断**
- “我明明传了，但最终 payload 里没了”在这里是代码预期行为。
- 关键词场景尤其容易因为白名单没跟上而出现“新增参数被静默裁掉”。
- 非关键词场景尤其依赖 runtime template 与 bizCode 的准确性，一旦拿错模板，会被 prune 成缺参 payload。

### P1. 线索推广用硬编码默认值补齐 `planId/planTemplateId/packageTemplateId`，会掩盖真实缺参来源
**证据**
- `planId` 回退 `runtimeForScene.storeData.planId || 308`：`src/optimizer/keyword-plan-api/search-and-draft.js:4269-4273`
- `packageTemplateId` 回退 `74`：`src/optimizer/keyword-plan-api/search-and-draft.js:4275-4276`
- `orderInfo` 会被整体补结构，并默认 `name/planName='自定义方案包'`：`src/optimizer/keyword-plan-api/search-and-draft.js:4291-4313`

**风险判断**
- 这不会直接让创建失败，但会把“上游没传”伪装成“下游有默认值”。
- 如果平台约束变化，`308/74` 这类硬编码会直接变成错误参数来源。

### P1. 结果对象对 plan 级 warning 的暴露不完整
**证据**
- `planGoalWarnings` 只用于 `emitProgress`，不写回最终 `result.goalWarnings`：`src/optimizer/keyword-plan-api/create-and-suggest.js:668-728`
- 最终 `result.goalWarnings` 只取 request 级 `mergedRequest.__goalResolution.goalWarnings`：`src/optimizer/keyword-plan-api/create-and-suggest.js:1229-1233`

**风险判断**
- 某个具体 plan 的目标回退 warning 很可能出现在进度事件里，但不会稳定出现在最终结果中。
- 这会降低批量场景下定位单条异常 plan 的能力。

### P1. 测试没有覆盖行为级多计划隔离与最终 payload 快照
**证据**
- 现有测试大多是 bundle 正则契约测试，例如：
  - `tests/keyword-create-repair-item-binding-guard.test.mjs:5`
  - `tests/keyword-scene-settings-sync.test.mjs:5`
  - `tests/keyword-custom-settings-sync.test.mjs:5`
  - `tests/site-scene-submit-mode.test.mjs:168-205`
- 已覆盖重点：商品兜底、部分 sceneSettings 同步、部分 capability prune、提交模式控制
- 明显缺口：
  - `planCount` / `planNamePrefix` 自动扩展
  - `planId` / `planTemplateId` 请求构造
  - 多计划 request/common/plan 覆盖优先级
  - 最终 payload 快照验证
  - 非法或缺失 `marketingGoal` 的 warning / fallback 行为

**风险判断**
- 当前测试更擅长发现“代码块没了”，不擅长发现“运行时组合后参数错了”。
- 这与当前问题类型高度重合。

## 症状到疑点映射
| 用户症状 | 最优先怀疑点 |
| --- | --- |
| 少建几条计划 | `normalizePlans` 过滤缺商品 plan，见 `search-and-draft.js:2286-2289` |
| 多条计划绑定成同一个商品 | request 级 `itemId/materialId` 批量回填，见 `search-and-draft.js:2274-2280` |
| 营销目标不对 | `marketingGoal` 默认回退或 fuzzy 匹配，见 `scene-spec.js:3760-3801` |
| 某些场景字段提交时消失 | `buildSolutionFromPlan` 的白名单/capability prune，见 `search-and-draft.js:3895-4350` |
| 线索推广看起来能建但参数来源可疑 | `planId/planTemplateId/packageTemplateId` 硬编码回退，见 `search-and-draft.js:4269-4313` |

## 历史回归窗口
### 高风险时间窗
- **2026-02-18 至 2026-02-19**

### 最可疑提交
1. `af1c1a3` `fix: isolate same-scene strategy settings per plan submit`
   - 风险点：场景设置持久化、同场景分组、`delete nextPlan.sceneSettings`、request/common/plan 覆盖规则重写
2. `859f7fc` `fix(keyword-plan-api): enforce api-only scene path round 2`
   - 风险点：API-only 模式下短路 `syncSceneRuntime/applySceneSpec/strictSceneRuntimeMatch`
3. `97a9d1c` `fix(wizard): normalize strategy goals on scene switch and preserve keyword goal editing`
   - 风险点：`marketingGoal` 多来源推导与自动回退
4. `c591f1c` `fix: isolate scene switching to current edited plan`
   - 风险点：多 strategy 混场景时的 sceneName/参数错配
5. `edde912` `fix: 货品全站推广同步批量提交并关闭冲突处理`
   - 风险点：货品全站推广场景下的批量提交 request shape 变化

### 历史信号
- `d6555a7` 明确修过“编辑计划关键词设置与提交一致性”，说明此前这条链路已有真实回归。
- `586ca0d` 只是放宽测试断言，不是根因，但降低了后续回归被测试捕获的概率。

## 本地验证结果
### 已执行命令
```bash
node --test tests/keyword-create-repair-item-binding-guard.test.mjs \
  tests/site-scene-item-binding.test.mjs \
  tests/site-scene-submit-mode.test.mjs \
  tests/keyword-edit-request-scene-settings-sync.test.mjs \
  tests/matrix-plan-config.test.mjs
```

### 结果
- 41 个测试全部通过。
- 结论不是“链路没问题”，而是“现有测试没有直接覆盖这次怀疑的行为级问题”。

## 最终判断
这条链路当前存在“参数问题被吞掉或被改写后继续提交”的明确风险，且风险是结构性的，不是单点偶发：

1. `marketingGoal` 会被自动回退并回写。
2. `normalizePlans` 会静默过滤 plan，并可能把多 plan 绑到同一商品。
3. `buildSolutionFromPlan` 会在 merge 之后继续删改字段。
4. 线索推广的 `planId/planTemplateId/packageTemplateId` 默认值会掩盖真实缺参来源。
5. 现有测试缺少行为级隔离验证，无法证明批量多计划在最终 payload 上是正确的。

## 建议修复顺序
1. 先给 `createPlansBatch` / `normalizePlans` 增加行为级测试：
   - 多 plan、不同 `itemId`、不同 `marketingGoal`、不同 `sceneSettings`
   - 断言最终每条 payload 不串值、不静默丢条
2. 把 `planGoalWarnings` 纳入最终结果，而不是只走 `emitProgress`
3. 给 `normalizePlans` 明确处理 `plan.materialId`，并对被过滤的 plan 输出失败明细
4. 为 `marketingGoal` 缺失/非法值补“严格模式”或至少补显式 warning/summary
5. 为 `buildSolutionFromPlan` 增加 payload snapshot 测试，覆盖：
   - 关键词白名单裁剪
   - 非关键词 template/capability prune
   - `itemIdList` 二次重写
   - 线索推广 `planId/planTemplateId/orderInfo`
6. 若问题集中在货品全站推广，优先回溯 `edde912` 的场景化提交分支

## 修复闭环更新（2026-03-23）

| 发现 | 当前状态 | 修复证据 |
| --- | --- | --- |
| P0 `marketingGoal` 静默回退扩散 | 已修复（默认策略） | `strictGoalMatch` 默认开启；request/plan 级 fallback 会提前失败返回，避免静默继续提交（`src/optimizer/keyword-plan-api/create-and-suggest.js`） |
| P0 fuzzy 匹配过宽 | 已修复 | fuzzy 仅在显式 `allowFuzzyGoalMatch=true` 时启用；多候选改为回退默认目标并输出 warning（`src/optimizer/keyword-plan-api/scene-spec.js`） |
| P0 `normalizePlans` 静默吞 plan/错绑商品 | 已修复 | 支持 `plan.materialId`；多计划禁止共享 request 级商品批量回填；drop plan 进入失败明细（`src/optimizer/keyword-plan-api/search-and-draft.js` + `create-and-suggest.js`） |
| P1 `planCount` 语义偏差 | 已修复 | 自动建计划场景下将 `planCount` 作为 preferredItems 上限；补回归测试 |
| P1 payload 二次 prune 难观测 | 已修复（当前范围） | 已补显式字段保留与 optional prune 运行时测试，并补早退结构/失败明细契约测试，关键链路可观测性已闭环 |
| P1 线索推广硬编码模板 ID | 已修复 | 移除 `308/74` 硬编码兜底，改为三元组单来源解析 + 缺参 fail-fast（`src/optimizer/keyword-plan-api/search-and-draft.js`） |
| P1 plan 级 warning 未进入最终结果 | 已修复 | request+plan warning 合并为 `mergedGoalWarnings` 并写入最终 `result.goalWarnings`（`src/optimizer/keyword-plan-api/create-and-suggest.js`） |
| P1 测试偏源码正则 | 已修复（关键路径） | 已新增 `createPlansBatch` strict 分支可执行 runtime harness（含 `allowFuzzyGoalMatch` 归一化与多计划隔离断言）+ 早退结构回归；核心回归点已从“仅正则”升级为可执行校验 |

## 交付状态
- 已完成：调查、证据收集、子代理并行分析、业务修复、构建验证、回归测试扩充、`Report.md` 闭环更新
- 已执行业务逻辑修复：是（`create-and-suggest.js`、`scene-spec.js`、`search-and-draft.js`）
- 当前结论：`Report` 核心发现对应修复已全部落地并通过当前目标测试集验证；后续仅建议按版本节奏继续增强深层集成测试，不影响本轮闭环结论
