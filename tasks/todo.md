# TODO - 2026-03-22 万能查数双面板样式调整

## 需求规格
- 目标模块：万能查数弹窗（`src/main-assistant/magic-report.js`）
- 目标改动：将“万能查数 / 人群对比看板”两面板切换器改成参考图中的分段样式。
- 布局要求：切换器放到弹窗头部最上方。
- 行为要求：保持现有 tab 切换能力与默认视图持久化能力不变。
- 兼容要求：不破坏已有回归测试对默认图标和切换逻辑的断言。

## 执行计划（含校验）
- [x] 1. 定位现有 tab DOM/CSS 与事件绑定实现。
  - 摘要：确认 `createPopup` 中 tab 位于 header 底部，样式定义在同文件 style 文本内。
- [x] 2. 调整 DOM 顺序，把 tab 切换器上移到 header 顶部。
  - 摘要：`am-magic-view-tabs` 已移至 `.am-magic-header` 第一行，视觉位于最上方。
- [x] 3. 重写 tab 容器/按钮样式为分段风格，并确保默认图标能力仍可用。
  - 摘要：切换器改为浅灰容器 + 白色激活胶囊；默认图标保留并在 hover/focus/default 时显示。
- [x] 4. 运行构建与关键测试验证改动可用。
  - 摘要：`node scripts/build.mjs`、`node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"`、`node --test tests/magic-report-crowd-matrix.test.mjs` 全部通过；并使用 chrome-devtools MCP 在 `one.alimama.com` 真实页面验证 tab 位于顶部且样式生效。
- [x] 5. 结果复盘与风险记录。
  - 摘要：本次仅调整 DOM 顺序与样式，不改 tab 行为逻辑；默认视图图标能力仍保留（hover/focus/default 显示）。

## 结果复盘
- 目标达成：万能查数双面板切换已改为灰底分段样式，且在弹窗最上方。
- 影响范围：`src/main-assistant/magic-report.js`（源实现）及构建产物（根 userscript + dist）。
- 回归状态：构建、语法、关键回归测试、真实页面 MCP 验证均通过。
- 风险说明：默认视图星标改为弱显式（非 hover/focus 时隐藏），如需常驻展示可再调整视觉权重。

---

# TODO - 2026-03-22 万能查数头部层级与质感微调（用户修正）

## 需求规格
- 目标模块：万能查数弹窗头部（`src/main-assistant/magic-report.js`）
- 用户修正1：`#am-magic-report-popup > div.am-magic-header > div.am-magic-header-main` 需要放在最上面。
- 用户修正2：`#am-magic-view-tabs` 字号过大，需要调小。
- 用户修正3：tab 灰色底与当前整体风格一致，使用更轻的透明质感。

## 执行计划（含校验）
- [x] 1. 明确修正点并制定最小改动方案。
  - 摘要：仅调整 header 子元素顺序与 tabs 视觉参数，不改行为逻辑。
- [x] 2. 调整 header DOM 顺序，确保 `am-magic-header-main` 位于最上层。
  - 摘要：header 子节点顺序调整为 `am-magic-header-main -> am-magic-view-tabs -> am-quick-prompts`。
- [x] 3. 收敛 tabs 字号与尺寸，更新灰底为半透明玻璃质感。
  - 摘要：active tab 字号降至 `13px`，容器改为半透明灰色渐变 + 轻边框 + blur 背景。
- [x] 4. 构建与关键回归验证，确认功能无回归。
  - 摘要：`node scripts/build.mjs`、`node --test tests/magic-report-crowd-matrix.test.mjs` 全通过；chrome-devtools MCP 实页确认 header-main 在顶部、tabs 字号与质感生效。
- [x] 5. 追加结果复盘与风险说明。
  - 摘要：本次仍为纯 UI 微调，不涉及逻辑与接口，回归风险低。

## 结果复盘
- 交付结果：`am-magic-header-main` 已回到最上方；`am-magic-view-tabs` 字号变小，且灰底改为透明质感。
- 影响范围：`src/main-assistant/magic-report.js` 与构建产物（`dist`、根 userscript）。
- 风险说明：透明度与 blur 受页面渲染环境影响会有轻微视觉差异，但功能行为不受影响。

---

# TODO - 2026-03-22 人群计划信息与 tabs 同行对齐（用户修正）

## 需求规格
- 目标：将 `#am-crowd-matrix-campaign` 放到 `#am-magic-view-tabs` 右侧。
- 视觉：与 tabs 保持统一的半透明质感风格。
- 行为：不改变看板加载逻辑；仅在人群看板视图展示计划信息。

## 执行计划（含校验）
- [x] 1. 定位结构与样式改造点，确认最小改动路径。
  - 摘要：将 campaign 节点从 `.am-magic-content-matrix` 移至 header 内，与 tabs 组成同一行容器。
- [x] 2. 调整 DOM 结构并更新样式，实现“tabs 左 + campaign 右”。
  - 摘要：新增 `.am-magic-view-meta` 容器；tabs 与 campaign 同行，campaign 右对齐并统一玻璃灰风格。
- [x] 3. 更新视图切换展示逻辑，保证 query 视图隐藏 campaign 信息。
  - 摘要：`switchMagicView` 新增 `matrixCampaignEl` 显隐控制（matrix 显示，query 隐藏）。
- [x] 4. 运行构建与回归，并做 chrome-devtools MCP 实页验证。
  - 摘要：`node scripts/build.mjs`、`node --check "阿里妈妈多合一助手.js"`、`node --test tests/magic-report-crowd-matrix.test.mjs` 全通过；MCP 实页确认 campaign 在 tabs 右侧且样式统一。
- [x] 5. 记录复盘和 lessons。
  - 摘要：补充“跨区域信息搬迁需同步显隐逻辑”的规则，防止 query 视图信息污染。

## 结果复盘
- 交付结果：`#am-crowd-matrix-campaign` 已移至 tabs 右侧，样式与 tabs 统一为半透明灰质感。
- 行为结果：query 视图隐藏 campaign 信息，matrix 视图显示且持续更新计划名/计划ID/商品ID。
- 风险说明：header 一行信息密度提高，极窄窗口下 campaign 文案会走省略号（已加截断）。

### 追加修正（用户反馈：需要“紧接 tabs”，非右贴边）
- 调整内容：移除 `#am-crowd-matrix-campaign` 的 `margin-left: auto;`，保持与 tabs 仅留容器 `gap` 间距。
- 验证结果：chrome-devtools MCP 实页测得 tabs 与 campaign 间距约 `10px`，符合“紧接”要求。

---

# TODO - 2026-03-22 插件滚动防穿透（用户修正）

## 需求规格
- 目标：插件内部滚动到顶/到底时，不要继续带动原网页滚动。
- 范围：主面板、万能查数弹窗、护航弹窗、并发日志弹窗、运行日志区等插件容器。
- 要求：优先最小侵入；不改变现有滚动行为，只阻断向页面链式滚动。

## 执行计划（含校验）
- [x] 1. 定位插件内滚动容器与现有样式/事件绑定点。
  - 摘要：主入口在 `src/main-assistant/ui.js`，多个区域 `overflow:auto` 但未统一防滚动穿透。
- [x] 2. 增加统一 wheel 链路守卫（捕获阶段）作为行为兜底。
  - 摘要：新增 `bindPluginScrollChainGuard + shouldBlockPluginWheel`，当插件内部无可继续滚动容器时阻断事件冒泡到页面。
- [x] 3. 为关键滚动容器补充 `overscroll-behavior: contain`。
  - 摘要：对主插件根容器、护航弹窗、并发日志体、日志区补充 CSS 防链式滚动。
- [x] 4. 构建+测试+实页验证滚动到底不再联动页面。
  - 摘要：`node scripts/build.mjs`、`node --check "阿里妈妈多合一助手.js"`、`node --test tests/logger-api.test.mjs tests/magic-report-crowd-matrix.test.mjs` 全通过；chrome-devtools MCP 实页验证 `#am-log-content` 触底滚轮 `defaultPrevented=true`，中段滚轮 `defaultPrevented=false`，符合预期。
- [x] 5. 复盘与 lessons 更新。
  - 摘要：补充“滚动防穿透默认双层保护 + 实页验证”的团队规则。

## 结果复盘
- 交付结果：插件内部滚动容器触底/触顶后不再连带滚动原网页；容器内部可滚动时仍保持正常滚动体验。
- 技术策略：`overscroll-behavior: contain`（样式层）+ `wheel capture guard`（行为兜底层）。
- 风险说明：旧浏览器对 `overscroll-behavior` 支持不完全时，仍由 wheel 守卫保证核心行为。

### 追加修正（用户反馈：按 period 第4个按钮样式）
- 调整内容：`#am-crowd-matrix-campaign` 按 `#am-crowd-matrix-global-legend > .am-crowd-matrix-legend-group-period > button:nth-child(4)` 逐项对齐（背景、边框、圆角、字号、内边距、阴影、布局）；并修正 matrix 视图展示逻辑为清空内联 `display`，避免覆盖 CSS 的 `display:flex`。
- 校验结果：chrome-devtools MCP 实页比对，target 与 campaign 的关键计算样式一致。

---

# TODO - 2026-03-22 tabs 背景同源与 campaign 下对齐（用户修正）

## 需求规格
- 目标1：`#am-magic-view-tabs` 的背景与 `#am-crowd-matrix-grid > div > div.am-crowd-matrix-cell.am-crowd-matrix-header.am-crowd-matrix-corner` 保持一致。
- 目标2：`#am-crowd-matrix-campaign` 与 `#am-magic-view-tabs` 下边缘对齐。

## 执行计划（含校验）
- [x] 1. 对齐 tabs 背景到 corner 的同款渐变值。
  - 摘要：tabs 容器背景统一为 `linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(245, 250, 255, 0.85))`。
- [x] 2. 调整 tabs+campaign 容器纵向对齐方式。
  - 摘要：`.am-magic-view-meta` 使用 `align-items: flex-end`，确保两者底部同一基线。
- [x] 3. 构建与回归校验。
  - 摘要：`node scripts/build.mjs`、`node --test tests/magic-report-crowd-matrix.test.mjs` 通过。
- [x] 4. chrome-devtools MCP 实页校验计算样式与几何对齐。
  - 摘要：`tabsBackgroundImage` 与 `cornerBackgroundImage` 相同；`tabsBottom=95`、`campaignBottom=95`，`bottomAligned=true`。

## 结果复盘
- 交付结果：tabs 背景已与 corner 背景同源，campaign 与 tabs 已下对齐。
- 风险说明：该修正仅涉及样式参数和 flex 对齐，不影响视图切换与数据逻辑。
