# Lessons

## 2026-03-23 用户修正：每轮修复都要继续 3+ AGENTS 并行
- 问题：连续“继续”修复场景里，如果只做单线程修复，容易遗漏并行排查与风险复核。
- 纠偏规则：每完成一个修复点后，立即继续建立不少于 3 个 AGENTS 分工（失败根因、最小补丁、回归风险）并行推进。
- 输出规则：阶段更新中明确写出“继续建立不少于 3 个 AGENTS 去高效修复”，形成可核对执行痕迹。

## 2026-03-23 测试提取边界不可绑定远端 marker
- 问题：`mergeGoalWarnings` 测试用 `const validate =` 作为截取终点，helper 重构插入后导致函数源码切片污染并触发语法错误。
- 纠偏规则：源码切片测试优先使用“紧邻下一个定义”作为终点，避免跨越多段 helper；必要时加双 marker 兜底。
- 验证规则：切片函数执行前先验证 `typeof fn === 'function'`，并覆盖一个边界输入，防止仅靠静态正则误报。

## 2026-03-23 早退分支必须保持结果结构一致
- 问题：`createPlansBatch` 多个早退分支只返回最小计数字段，缺少 runtime/策略开关/submitEndpoint 等上下文，导致排障信息不对齐。
- 纠偏规则：在业务允许的前提下，早退分支统一返回公共字段：`runtime`、`marketingGoal`、`goalWarnings`、`submitEndpoint`、`fallbackPolicy/conflictPolicy/stopScope`、`strictGoalMatch/allowFuzzyGoalMatch`、`rawResponses`。
- 测试规则：为每类早退路径保留独立契约测试（本轮为 `keyword-create-early-return-shape.test.mjs`），避免仅靠单分支测试覆盖。
- failure 规则：`failures[*]` 默认维持统一五字段（`planName/item/marketingGoal/submitEndpoint/error`），禁止仅返回 `error`。

## 2026-03-22 用户修正：万能查数头部层级与视觉收敛
- 问题：首次实现把 `am-magic-view-tabs` 提到 header 最顶层，未满足用户对 `am-magic-header-main` 顶部优先级的明确要求。
- 纠偏规则：当用户给出精确选择器级别的布局要求时，优先按该 DOM 层级执行，不做主观“更优”重排。
- 视觉规则：分段控件改版时先控制字号与体积，默认优先 12-13px，再根据反馈放大，避免一次性改到 15px+。
- 风格规则：若页面已有玻璃/半透明语义，新增灰色容器优先使用半透明渐变 + 轻边框 + 内阴影，避免实色块割裂。

## 2026-03-22 用户修正：跨区域搬迁信息条到 header
- 问题：将 `am-crowd-matrix-campaign` 位置迁移后，若不补视图显隐控制，会在 query 视图显示无关信息。
- 纠偏规则：任何“从内容区搬到头部/全局区”的节点，必须同步梳理 `switch*View` 显隐逻辑，而不只改 DOM/CSS。
- 布局规则：header 左右分布信息时，统一使用同一视觉语义（同类渐变、边框、阴影），并为右侧长文本加 `ellipsis` 兜底。

## 2026-03-22 用户修正：右侧 vs 紧接语义
- 问题：用户说“放右边”时，后续又明确“不是右侧，而是接着”；说明需求是“紧邻”而非“右对齐”。
- 纠偏规则：当文案含糊出现“右边”时，优先确认是“右对齐”还是“右侧紧邻”；若无确认，先采用紧邻布局，避免 `margin-left: auto`。

## 2026-03-22 用户修正：插件滚动穿透页面
- 问题：插件内滚动容器触底后，wheel 事件继续传递导致原网页滚动，影响操作稳定性。
- 纠偏规则：对跨页面悬浮插件，默认同时加两层保护：`overscroll-behavior: contain` + wheel 捕获守卫兜底。
- 验证规则：必须在真实页面复现“滚到底继续滚”场景并确认页面不再位移，而不是只看代码。

## 2026-03-22 用户修正：按指定 selector 精确对齐样式
- 问题：当用户指定“按某个具体按钮样式”时，只做近似会被判定不符合预期。
- 纠偏规则：优先抓取目标 selector 的计算样式，再逐项对齐；至少覆盖 `background/border/radius/font/padding/shadow/display/gap`。
- 注意事项：若视图切换逻辑写了内联 `style.display`，会覆盖 CSS `display`，需要同步修正。

## 2026-03-22 用户修正：背景需与 corner 同源 + 元素下对齐
- 问题：用户要求 tabs 背景必须与 `am-crowd-matrix-corner` 完全同源，且 campaign 与 tabs 需要下边缘对齐。
- 纠偏规则：遇到“用下面这个一样的背景设置”时，直接复用目标渐变值，不做近似色替换。
- 布局规则：同一行组件若被要求“下对齐”，优先在父容器使用 `align-items: flex-end`，并用实页几何值（如 `bottom`）验证。
