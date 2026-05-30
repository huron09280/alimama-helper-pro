# TODO - 2026-05-30 全页面 UI 规范逐页优化

## 需求规格
- 目标：按 `docs/插件UI统一设计规范.md` 与 `docs/图标设计规范.md` 逐页优化插件所有页面/入口；每完成一个页面切片，必须完成 Chrome MCP 运行态验证、记录结果、中文 commit 并 push，再进入下一个页面。
- 范围：按页面/入口拆分推进，优先 P0：悬浮球+主面板/辅助显示、万能查数/人群看板、算法护航、组建计划主向导、矩阵配置、场景配置弹窗、提交确认、行内复制/并发/批量+；P1/P2 后续继续覆盖下载捕获、商品选择弹窗、extension 注入提示、潜力词导出、授权管理页。
- 设计约束：浅色玻璃拟态、高密度后台工作台、复用 `--am26-*` token、共享 `renderAmIcon()` 图标、紧凑控件、状态可见、无卡片套卡片、无 emoji/1024 iconfont、文本不溢出。
- 安全边界：真实页面验收默认只读；不点击创建、投放、提交、删除、扣费入口。提交类页面只验证弹窗打开、布局、取消/关闭和 dry-run/受保护路径，除非用户另行明确授权。
- 成功标准：每个页面切片都有源码/测试/构建同步、Chrome MCP 页面身份/DOM/截图/控制台核对、`tasks/todo.md` 复盘、中文 commit 和 push。

## 执行计划（可核对）
- [x] 使用不少于 3 个子代理完成页面清单、设计约束、验证路径并行梳理。
- [x] 页面 1：悬浮球 + 主面板 + 辅助显示展开区。
- [x] 页面 2：万能查数弹窗 + 人群对比看板入口。
- [x] 页面 3：算法护航主面板 + 执行结果浮层。
- [x] 页面 4：组建计划主向导首页/日志区。
- [x] 页面 5：组建计划矩阵配置页。
- [x] 页面 6：建计划商品选择弹窗。
- [x] 页面 7：场景配置/策略详情/高级设置弹窗。
- [x] 页面 8：建计划提交确认弹窗。
- [x] 页面 9：计划行复制入口 + 一览/成功弹窗。
- [x] 页面 10：计划行并发开启入口 + 日志弹窗。
- [x] 页面 11：批量+ 菜单 + 批量确认弹窗。
- [x] 页面 12：下载捕获面板。
- [x] 页面 13：潜力词日维度导出入口。
- [x] 页面 14：extension 注入/授权可见状态。
- [ ] 页面 15：授权管理页。

## 高层操作摘要
- 已读取外部 `AGENT-v2.md`、本仓库 `AGENTS.md`、`tasks/lessons.md`、统一 UI/图标规范。
- 已完成 3 个只读子代理：页面入口清单、设计/代码/验证约束、构建与 Chrome MCP 验证路径。
- 当前从页面 1 开始，优先保证主入口更像统一工作台：标题、主操作、辅助开关、日志状态清晰且可扫描。
- 页面 1 已完成：主工具区改为统一浅玻璃控制组，辅助显示展开区改为浅玻璃胶囊开关组，日志头改为同体系工具条；工具按钮文字增加 `am-tool-label`，避免窄面板溢出。
- 页面 2 已完成：万能查数弹窗头部、窗口动作组、视图页签、计划信息胶囊、看板工具栏、图例组和重试按钮统一为浅玻璃 token；补充长计划/商品文本省略保护，并同步主样式层覆盖，避免运行态 header 被旧背景压回。
- 页面 3 已完成：算法护航主面板改为统一浅玻璃工作台骨架，标题区、窗口动作组、手动设置容器、底部参数行、状态条、日志容器和执行结果浮层统一 token；Token 指示灯改用 `--am26-success/danger`，保留运行按钮、窗口动作、手动设置和执行逻辑不变。
- 页面 4 已完成：组建计划主向导首页/日志区统一为浅玻璃工作台，首页摘要、商品区、计划区、执行条、快速日志与日志页按 `--am26-*` token 收敛；首页/矩阵/日志切换补齐 ARIA tab 语义，执行模式折叠箭头改为共享 SVG 图标；提交、创建、矩阵和弹窗业务逻辑保持不变。
- 页面 5 已完成：组建计划矩阵页的配置容器、工作台统计、预设按钮、场景/维度卡片、维度下拉和批量菜单统一为浅玻璃 token；矩阵选择器箭头改为共享 `chevron-down` SVG，保留矩阵生成算法、提交创建、安全阻断和弹窗业务逻辑不变。
- 页面 6 已完成：组建计划“添加商品”二级弹窗统一为浅玻璃工作台弹层，补齐标题图标、已选数量状态、搜索工具条、候选/已选商品卡片状态、空态和底部操作区；添加/取消本地状态已在真实页验证，保留候选加载、添加/移除商品、取消回滚、确认回写和创建提交逻辑不变。
- 页面 7 已完成：组建计划“编辑计划”详情层和内部“高级设置”弹窗统一为浅玻璃工作台弹层，补齐详情标题图标、二级说明、编辑状态、场景配置行、操作区和高级设置资源位/地域/分时控件 token；验证只打开编辑页、修改可回滚输入、切换高级设置 tab 和关闭弹窗，未点击批量创建或提交创建。
- 页面 8 已完成：组建计划“提交创建”二次确认弹窗统一为浅玻璃工作台确认层，补齐专用白玻璃遮罩、待提交状态、统计卡、场景摘要、warning 风险提示和 token 化底部按钮；保留 `openKeywordSubmitConfirmPopup()` 只做确认 gating，确认后仍进入现有 `handleRun()` 创建链路；真实页只打开弹窗并取消关闭，未点击“确认提交创建”。
- 页面 9 已完成：计划行复制入口、复制数量徽标、复制计划一览窗和成功窗按统一浅玻璃规范收敛；补齐待确认/已完成状态胶囊、`aria-describedby`、live status 语义和 token 化状态色；真实页只打开一览窗并取消关闭，未点击“确认生成”，不改 `prepareCopyCurrentPlanContext()`、`submitPreparedCopyCurrentPlan()`、真实创建、暂停兜底和页内搜索业务链路。
- 页面 10 已完成：计划行并发开启入口和并发执行日志弹窗按统一浅玻璃规范收敛；20px 行内启动入口、日志标题/状态/明细区和 warning/error/success 语义色已 token 化，弹窗补齐 `aria-describedby`；真实页验收在 Offline + 本地写接口阻断双保护下打开日志弹窗并关闭，未让 `/campaign/updatePart.json` 触达服务端，不改 `runConcurrentStartFlow()`、同商品全量暂停、原在投重开、重试、状态校验和真实写入链路。
- 页面 11 已完成：批量+ 菜单和批量开启/暂停/删除确认弹窗按统一浅玻璃规范收敛；菜单补齐 `aria-controls`、`aria-label`、Esc/方向键焦点导航，确认窗默认焦点改到“取消”降低误触真实写操作风险；样式补齐 `--am26-focus/danger-soft/warning-soft` token。保留原生“批量计划设置”克隆宿主、hover 弹出、选中项读取、业务线分组、人群官方弹窗、`/campaign/updatePart.json` 与 `/campaign/delete.json` 写接口链路不变。
- 页面 12 已完成：下载捕获面板补齐 `role=region`、`aria-live`、标题/URL/状态关联、完整 URL `title/aria-label`、复制状态 live、Esc 关闭和关闭后 `aria-hidden`；直连下载图标改为共享 `external-link`，面板和 URL/来源/状态区按浅玻璃 token 收敛。保留下载 URL 识别、Fetch/XHR 拦截、响应解析、剪贴板和直连下载业务链路不变。
- 页面 13 已完成：潜力词日维度导出入口补齐共享 `download` SVG、按钮/input ARIA、运行态 `aria-busy`、live 状态、可见 focus、浅玻璃 token 和 reduced-motion；保留真实导出 API、CSV 字段、日期/计划/单元查询和下载链路不变。
- 页面 14 已完成：extension 注入失败提示改为自包含浅玻璃 `alert`，补齐 `aria-live/assertive`、`aria-atomic`、焦点锚点和 `textContent` 渲染断言；授权锁定遮罩外层改为白色玻璃背景并补强源码/打包静态断言。保留授权 verify、policy token、shopId 识别、缓存恢复、background 桥和 API 暴露策略不变。

## 验证记录
- 页面 1 自动化：
  - `node --test tests/logger-api.test.mjs tests/magic-report-panel-resilience.test.mjs tests/icon-system-regression.test.mjs`：通过，26/26。
  - `node --check src/main-assistant/ui.js`：通过。
  - `npm run build`：通过，已同步根 userscript、`dist/packages/` 和 `dist/extension/page.bundle.js`。
  - `npm run build:check`：通过。
  - `npm run check:syntax`：通过。
  - `git diff --check`：通过。
- 页面 1 Chrome MCP：
  - 扩展详情页 `chrome://extensions/?id=egaeghgcogbdikndhlmmmolelbfffnjk` 点击 Reload 后，硬刷新真实 `one.alimama.com` 关键词推广详情页。
  - 页面身份：`关键词推广详情页_万相台无界版`，URL 为 `https://one.alimama.com/index.html#!/manage/search-detail?...campaignId=81165438388&adgroupId=81080977218`。
  - 交互：打开悬浮球主面板，点击“辅助显示”，`aria-expanded="true"`，辅助开关 `aria-pressed` 与 active 状态同步。
  - 样式核对：主面板宽度 `304px`；`.am-tools-row`、`#am-assist-switches.open`、`.am-log-header` 均为 `var(--am26-surface)` 背景、统一边框和浅玻璃阴影；工具文字 `am-tool-label` 正常渲染。
  - 截图：`tasks/ui-page1-main-panel-before-2026-05-30.png`、`tasks/ui-page1-main-panel-after-2026-05-30.png`。
  - Console：仅观察到原站资源 `net::ERR_TUNNEL_CONNECTION_FAILED`，未发现插件 UI 相关运行时异常。
- 页面 2 自动化：
  - `node --check src/main-assistant/magic-report.js`：通过。
  - `node --check src/main-assistant/ui.js`：通过。
  - `git diff --check`：通过。
  - `npm run build`：通过，已同步根 userscript、`dist/packages/` 和 `dist/extension/page.bundle.js`。
  - `node --test tests/magic-report-crowd-matrix.test.mjs tests/magic-report-panel-resilience.test.mjs tests/icon-system-regression.test.mjs tests/logger-api.test.mjs`：通过，86/86。
  - `npm run build:check`：通过。
  - `npm run check:syntax`：通过。
- 页面 2 Chrome MCP：
  - 扩展详情页 `chrome://extensions/?id=egaeghgcogbdikndhlmmmolelbfffnjk` 点击 Reload 后，硬刷新真实关键词推广详情页。
  - 页面身份：`关键词推广详情页_万相台无界版`，URL 为 `https://one.alimama.com/index.html#!/manage/search-detail?...campaignId=81165438388&adgroupId=81080977218`。
  - 交互：打开主面板，点击“万能查数”，默认进入“人群对比看板”，`#am-magic-tab-matrix aria-selected="true"`，query panel 隐藏、matrix panel 展示。
  - 样式核对：弹窗全屏 `1794x978`；header 计算背景为 `rgba(255,255,255,0.45)`，`backdrop-filter: blur(18px) saturate(1.28)`；页签、计划信息胶囊、看板工具栏、图例组均为 `--am26-*` token 对应的浅玻璃计算值；商品 ID 长文本 `text-overflow: ellipsis` 生效，外层 `overflow: visible` 保留商品下拉弹出空间。
  - 运行状态：看板加载完成，状态条为 `is-success is-hidden`；performance resource 未发现 `/solution/addList.json`、`/solution/copy.json`、`/campaign/updatePart.json`、预算、创建、提交、删除等写接口。
  - 截图：`tasks/ui-page2-magic-report-before-2026-05-30.png`、`tasks/ui-page2-magic-report-after-2026-05-30.png`。
  - Console：仅观察到原站资源 `net::ERR_TUNNEL_CONNECTION_FAILED` 与浏览器 `ScriptProcessorNode` 弃用警告，未发现插件 UI 相关运行时异常。
- 页面 3 自动化：
  - `node --check src/optimizer/ui.js`：通过。
  - `node --check tests/optimizer-token-capture-history.test.mjs`：通过。
  - `git diff --check`：通过。
  - `node --test tests/optimizer-escort-new-flow-fallback.test.mjs tests/optimizer-entry-error-handling.test.mjs tests/optimizer-default-prompt.test.mjs tests/optimizer-escort-keyword-compat.test.mjs tests/optimizer-token-capture-history.test.mjs tests/icon-system-regression.test.mjs`：通过，59/59。
  - `npm run build`：通过，已同步根 userscript、`dist/packages/` 和 `dist/extension/page.bundle.js`。
  - `npm run build:check`：通过。
  - `npm run check:syntax`：通过。
- 页面 3 Chrome MCP：
  - 扩展详情页 `chrome://extensions/?id=egaeghgcogbdikndhlmmmolelbfffnjk` 点击 Reload 后，硬刷新真实关键词推广详情页。
  - 页面身份：`关键词推广详情页_万相台无界版`，URL 为 `https://one.alimama.com/index.html#!/manage/search-detail?...campaignId=81165438388&adgroupId=81080977218`。
  - 交互：打开主助手，点击“算法护航”；主助手收起，`#alimama-escort-helper-ui` 展示；展开手动设置，字段全部可见；执行居中和最大化窗口动作；全程未点击“立即扫描并优化”。
  - 样式核对：护航面板宽 `667px`，背景为 `var(--am26-panel-strong)` 对应浅玻璃渐变，`backdrop-filter: blur(20px) saturate(1.25)`；标题区、手动设置面板、底部输入行和状态条均为 `var(--am26-surface)` 对应计算值、统一半透明边框和浅玻璃阴影；手动设置展开状态 `bodyHidden=false`，运行按钮仍为 `mode=run`、文案 `立即扫描并优化`。
  - 安全核对：performance resource 未发现 `escort/openV3.json`、`escort/open.json`、`solution/addList.json`、`campaign/updatePart.json`、`solution/copy.json`、`campaign/copy*` 等写接口。
  - 截图：`tasks/ui-page3-optimizer-escort-before-2026-05-30.png`、`tasks/ui-page3-optimizer-escort-after-2026-05-30.png`。
- 页面 4 自动化：
  - `node --check src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`：通过。
  - `node --check tests/keyword-home-strategy-batch-actions.test.mjs`：通过。
  - `node --check tests/icon-system-regression.test.mjs`：通过。
  - `node --test tests/keyword-home-strategy-batch-actions.test.mjs tests/keyword-wizard-entry-regression.test.mjs tests/icon-system-regression.test.mjs tests/keyword-plan-api-bridge-security.test.mjs`：通过，43/43。
  - `npm run build`：通过，已同步根 userscript、`dist/packages/` 和 `dist/extension/page.bundle.js`。
  - `npm run build:check`：通过。
  - `npm run check:syntax`：通过。
  - `git diff --check`：通过。
  - 说明：`node --check src/optimizer/keyword-plan-api/wizard-mount-intro.js` 在 `HEAD` 上同样报 `Unexpected end of input`，该文件是构建片段而非独立 JS 模块，本次不作为回归。
- 页面 4 Chrome MCP：
  - 扩展详情页 `chrome://extensions/?id=egaeghgcogbdikndhlmmmolelbfffnjk` 点击 Reload 后，硬刷新真实关键词推广详情页。
  - 页面身份：`关键词推广详情页_万相台无界版`，URL 为 `https://one.alimama.com/index.html#!/manage/search-detail?...campaignId=81165438388&adgroupId=81080977218`。
  - 交互：打开主助手，点击“组建计划”；`#am-wxt-keyword-overlay.open` 展示，`#am-wxt-keyword-modal` 为可见 dialog；首页 tab 默认选中，随后仅切换到“日志页”，未点击“提交创建”“批量创建”或确认类入口。
  - 首页样式核对：主弹窗为浅玻璃渐变，计算背景 `linear-gradient(135deg, rgba(255,255,255,.6), rgba(255,255,255,.2))`，边框 `rgba(255,255,255,.6)`，`backdrop-filter: blur(20px) saturate(1.4)`；首页/矩阵页/日志页均为 `role=tab`，首页 `aria-selected=true`、`tabIndex=0`；摘要卡片为浅玻璃 token，显示“已添加商品 1 / 30”“已选计划 1”“预算合计 200元”；执行模式 chevron 为共享 SVG。
  - 日志页样式核对：点击“日志页”后 `aria-selected=true`，`aria-controls=am-wxt-keyword-previewlog-panel`；日志面板计算背景 `rgba(255,255,255,.25)`、边框 `rgba(255,255,255,.4)`、`backdrop-filter: blur(10px) saturate(1.15)`，可见“场景摘要 / 组合摘要 / 批次摘要”和预览日志行。
  - 安全核对：performance resource 未发现 `/solution/addList.json`、`/solution/business/addList.json`、`/bidword/add.json`、`/solution/copy.json`、`/campaign/copy/campaignCheck.json`、`/campaign/updatePart.json`、`/campaign/onebpSite/oneClick.json` 等写接口。
  - 截图：`tasks/ui-page4-keyword-wizard-home-after-2026-05-30.png`、`tasks/ui-page4-keyword-wizard-log-after-2026-05-30.png`。
  - Console：仅观察到原站资源 `net::ERR_TUNNEL_CONNECTION_FAILED` 与浏览器 issue，未发现插件 UI 相关运行时异常。
- 页面 5 自动化：
  - `node --check src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`：通过。
  - `node --check src/optimizer/keyword-plan-api/wizard-style-and-state/matrix-bid-package.js`：通过。
  - `node --check tests/keyword-home-strategy-batch-actions.test.mjs`：通过。
  - `node --check tests/matrix-plan-config.test.mjs`：通过。
  - `node --test tests/keyword-home-strategy-batch-actions.test.mjs tests/matrix-plan-config.test.mjs tests/matrix-trend-star-runtime-package.test.mjs tests/matrix-bid-target-cost-package.test.mjs tests/matrix-dimension-structured-values.test.mjs tests/icon-system-regression.test.mjs`：通过，74/74。
  - `npm run build`：通过，已同步根 userscript、`dist/packages/` 和 `dist/extension/page.bundle.js`。
  - `npm run build:check`：通过。
  - `npm run check:syntax`：通过。
  - `git diff --check`：通过。
  - 说明：`node --check src/optimizer/keyword-plan-api/request-builder-preview.js` 在 `HEAD` 上同样报 `Unexpected end of input`，该文件是构建片段而非独立 JS 模块，本次不作为回归。
- 页面 5 Chrome MCP：
  - 扩展详情页 `chrome://extensions/?id=egaeghgcogbdikndhlmmmolelbfffnjk` 点击 Reload 后，硬刷新真实关键词推广详情页，再打开主助手并进入“组建计划 > 矩阵页”。
  - 页面身份：`关键词推广详情页_万相台无界版`，URL 为 `https://one.alimama.com/index.html#!/manage/search-detail?...campaignId=81165438388&adgroupId=81080977218`。
  - 交互：矩阵页 tab `aria-selected="true"`，`#am-wxt-keyword-matrix-panel` 展示；点击“添加维度”后只生成本地矩阵维度行和下拉面板，未点击“生成计划”“提交创建”或确认类入口。
  - 样式核对：`.am-wxt-matrix-workspace` 计算 `gap=12px`；`.am-wxt-matrix-card` 为 12px 圆角、`--am26-surface-strong -> --am26-surface` 浅玻璃渐变、`backdrop-filter: blur(10px) saturate(1.15)`；`.am-wxt-matrix-stat` 使用 `rgba(255,255,255,0.25)` token 背景、统一边框和内高光；维度列表 `max-height=478px` 且可滚动。
  - 选择器核对：维度选择器箭头包含 1 个共享 `chevron-down` SVG，`background-image=none`；下拉打开态箭头旋转为 `matrix(-1, 0, 0, -1, 0, 0)`，下拉面板为 `--am26-panel-strong` 浅玻璃渐变、`backdrop-filter: blur(12px) saturate(1.25)`。
  - 安全核对：performance resource 未发现 `/solution/addList.json`、`/solution/business/addList.json`、`/bidword/add.json`、`/solution/copy.json`、`/campaign/copy/campaignCheck.json`、`/campaign/updatePart.json`、`/campaign/onebpSite/oneClick.json` 等写接口。
  - 截图：`tasks/ui-page5-keyword-wizard-matrix-after-2026-05-30.png`。
  - Console：仅观察到原站资源 `net::ERR_TUNNEL_CONNECTION_FAILED` 与浏览器 issue，未发现插件 UI 相关运行时异常。
- 页面 6 自动化：
  - `npm run build`：通过，已同步根 userscript、`dist/packages/` 和 `dist/extension/page.bundle.js`。
  - `node --check src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`：通过。
  - `node --check tests/keyword-item-picker-popup.test.mjs`：通过。
  - `node --test tests/keyword-item-picker-popup.test.mjs tests/keyword-home-strategy-batch-actions.test.mjs tests/icon-system-regression.test.mjs`：通过，43/43。
  - `npm run build:check`：通过。
  - `npm run check:syntax`：通过。
  - `git diff --check`：通过。
- 页面 6 Chrome MCP：
  - 扩展详情页 `chrome://extensions/?id=egaeghgcogbdikndhlmmmolelbfffnjk` 点击 Reload 后，硬刷新真实关键词推广详情页，再打开主助手并进入“组建计划 > 首页 > 添加商品”。
  - 页面身份：`关键词推广详情页_万相台无界版`，URL 为 `https://one.alimama.com/index.html#!/manage/search-detail?...campaignId=81165438388&adgroupId=81080977218`。
  - 样式核对：添加商品弹窗 `dialogRole="dialog"`，标题区含 1 个共享 `package` SVG 图标；遮罩为浅色渐变并带 `blur(10px) saturate(1.18)`；弹窗宽高约 `647x900`、圆角 `18px`、边框 `rgba(255,255,255,.6)`、`backdrop-filter: blur(20px)`；工具条、输入框、候选列表、已选列表和底部操作区均收敛为 `--am26-*` token。
  - 状态核对：已选数量显示 `1`；候选商品 `40` 条；候选区存在 `.is-added`，已选区存在 `.is-selected`；空态/已添加态保留稳定行高和文本布局。
  - 交互核对：点击首个候选商品“添加”后，数量从 `1` 变为 `2`，按钮切换为禁用的“已添加”；点击“取消”后弹窗关闭，首页已添加商品数回到 `1`。
  - 安全核对：performance resource 未发现 `/solution/addList.json`、`/solution/business/addList.json`、`/bidword/add.json`、`/solution/copy.json`、`/campaign/copy/campaignCheck.json`、`/campaign/updatePart.json`、`/campaign/onebpSite/oneClick.json` 等写接口。
  - 截图：`tasks/ui-page6-keyword-item-picker-after-2026-05-30.png`。
  - Console：仅观察到原站资源 `net::ERR_TUNNEL_CONNECTION_FAILED` 与浏览器 `ScriptProcessorNode` 弃用警告，未发现插件 UI 相关运行时异常。
- 页面 7 自动化：
  - `npm run build`：通过，已同步根 userscript、`dist/packages/` 和 `dist/extension/page.bundle.js`。
  - `node --check tests/keyword-edit-strategy-settings.test.mjs`：通过。
  - `node --check src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`：通过。
  - `node --test tests/keyword-edit-strategy-settings.test.mjs tests/keyword-custom-popup-config.test.mjs tests/keyword-custom-settings-sync.test.mjs`：通过，49/49。
  - `node --test tests/keyword-custom-native-parity-ui.test.mjs tests/crowd-custom-native-parity-ui.test.mjs tests/keyword-home-strategy-batch-actions.test.mjs tests/keyword-custom-preview-submit-parity.test.mjs`：通过，52/52。
  - `npm run build:check`：通过。
  - `npm run check:syntax`：通过。
  - `git diff --check`：通过。
- 页面 7 Chrome MCP：
  - 扩展详情页 `chrome://extensions/?id=egaeghgcogbdikndhlmmmolelbfffnjk` 点击 Reload 后，硬刷新真实关键词推广详情页，再打开主助手并进入“组建计划 > 首页 > 编辑计划”。
  - 页面身份：`关键词推广详情页_万相台无界版`，URL 为 `https://one.alimama.com/index.html#!/manage/search-detail?...campaignId=81165438388&adgroupId=81080977218`。
  - 详情层核对：`#am-wxt-keyword-overlay` 为打开态，编辑详情层可见；标题显示计划名，副标题为“场景配置 / 计划参数”，状态胶囊为“编辑中”，场景配置行数量 14；计划名称输入框命中为 `INPUT`，输入 `_验证` 后可恢复原值。
  - 高级设置核对：点击“编辑设置”打开 `高级设置` 弹窗；遮罩为浅白玻璃渐变并带 `blur(10px) saturate(1.18)`；弹窗约 `1080x760`、圆角 `18px`、边框 `rgba(255,255,255,.6)`、浅玻璃背景和 `blur(20px) saturate(1.35)`；`投放资源位`、`投放地域`、`分时折扣` 三个 tab 可切换。
  - 安全核对：performance resource 未发现 `/solution/addList.json`、`/solution/business/addList.json`、`/bidword/add.json`、`/solution/copy.json`、`/campaign/copy/campaignCheck.json`、`/campaign/updatePart.json`、`/campaign/onebpSite/oneClick.json` 等写接口；仅观察到商品/地域配置读取请求。
  - 截图：`tasks/ui-page7-keyword-detail-editor-after-2026-05-30.png`、`tasks/ui-page7-keyword-advanced-popup-after-2026-05-30.png`。
  - Console：仅观察到原站资源 `net::ERR_TUNNEL_CONNECTION_FAILED` 与原站 `endGroup Error` 噪声，未发现插件 UI 相关运行时异常。
- 页面 8 自动化：
  - `npm run build`：通过，已同步根 userscript、`dist/packages/` 和 `dist/extension/page.bundle.js`。
  - `node --check src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`：通过。
  - `node --check tests/keyword-home-strategy-batch-actions.test.mjs`：通过。
  - `node --test tests/keyword-home-strategy-batch-actions.test.mjs tests/matrix-plan-config.test.mjs tests/icon-system-regression.test.mjs`：通过，58/58。
  - `npm run build:check`：通过。
  - `npm run check:syntax`：通过。
  - `git diff --check`：通过。
  - 说明：`node --check src/optimizer/keyword-plan-api/request-builder-preview.js` 在 `HEAD` 上同类片段也不可作为独立模块检查，本文件是构建片段，本轮以 `npm run build`、`build:check` 和根 userscript 语法检查为准。
- 页面 8 Chrome MCP：
  - 扩展详情页 `chrome://extensions/?id=egaeghgcogbdikndhlmmmolelbfffnjk` 点击 Reload 后，硬刷新真实关键词推广详情页，再打开主助手并进入“组建计划 > 首页 > 提交创建”。
  - 页面身份：`关键词推广详情页_万相台无界版`，URL 为 `https://one.alimama.com/index.html#!/manage/search-detail?...campaignId=81165438388&adgroupId=81080977218`。
  - 触发核对：首页提交摘要为 `将提交 1 个计划 / 预算合计 200元 / 提交方式：单条`；点击首页 `提交创建` 后仅打开二次确认弹窗，未点击弹窗内“确认提交创建”。
  - 样式核对：确认窗 `role=dialog`、`aria-modal=true`；外层 class 为 `am-wxt-scene-popup-mask am-wxt-scene-popup-mask-submit-confirm`；遮罩为浅白玻璃渐变并带 `blur(10px) saturate(1.18)`；弹窗约 `560x370`、圆角 `18px`、边框 `rgba(255,255,255,.6)`、浅玻璃背景和 `blur(18px) saturate(1.35)`。
  - 内容核对：可见“即将调用创建接口”“待提交”；统计卡为 `计划数 1 / 预算合计 200元 / 商品数 1 / 提交方式 单条`；场景摘要为 `人群推广×1`；风险提示为“确认后会调用创建接口。本弹窗关闭或取消不会提交。”。
  - 取消核对：点击“取消”后 `#am-wxt-scene-popup-mask` 消失，向导日志出现“已取消提交创建”。
  - 安全核对：performance resource 未发现 `/solution/addList.json`、`/solution/business/addList.json`、`/bidword/add.json`、`/solution/copy.json`、`/campaign/copy/campaignCheck.json`、`/campaign/updatePart.json`、`/campaign/onebpSite/oneClick.json` 等写接口。
  - 截图：`tasks/ui-page8-keyword-submit-confirm-after-2026-05-30.png`。
  - Console：仅观察到原站资源 `net::ERR_TUNNEL_CONNECTION_FAILED` 与原站 `endGroup Error` 噪声，未发现插件确认窗相关运行时异常。
- 页面 9 自动化：
  - `node --check src/main-assistant/campaign-id-quick-entry.js`：通过。
  - `node --check src/main-assistant/ui.js`：通过。
  - `node --check tests/campaign-copy-current-plan-quick-entry.test.mjs`：通过。
  - `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs`：通过，13/13。
  - `npm run build`：通过，已同步根 userscript、`dist/packages/` 和 `dist/extension/page.bundle.js`。
  - `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs tests/campaign-concurrent-start-quick-entry.test.mjs tests/icon-system-regression.test.mjs`：通过，26/26。
  - `npm run build:check`：通过。
  - `npm run check:syntax`：通过。
  - `git diff --check`：通过。
  - `node --check dist/extension/page.bundle.js`：通过。
- 页面 9 Chrome MCP：
  - 扩展详情页 `chrome://extensions/?id=egaeghgcogbdikndhlmmmolelbfffnjk` 点击 Reload 后，进入真实关键词推广列表页 `https://one.alimama.com/index.html#!/manage/search?bizCode=onebpSearch&orderField=charge&orderBy=desc`。
  - 页面身份：`关键词推广_万相台无界版`；运行态找到 39 个 `.am-campaign-copy-btn`，首个可见入口 campaignId `75310601591`，按钮文案 `复制1`，`aria-label="复制：75310601591"`。
  - 入口样式核对：复制按钮为 999px 胶囊、`rgba(255,255,255,.25)` 浅玻璃背景、`rgb(69,84,229)` 主色、`rgba(255,255,255,.4)` 边框、`min-width=88px`、`white-space=nowrap`；数量徽标为浅玻璃 token 背景和 10px 圆角。
  - 交互核对：点击首个“复制”只打开 `复制计划一览`，未点击“确认生成”；弹窗 `role=dialog`、`aria-modal=true`、`aria-labelledby=am-copy-overview-title`、`aria-describedby=am-copy-overview-status`；可见“待确认”和状态文案“确认后才会提交创建请求。”。
  - 内容核对：一览窗显示源计划摘要 `智能计划_0521_1748_6 · 关键词推广 · 共 1 个`，表格含计划名称、计划出价方式、出价价格、预算字段，底部“确认生成/取消”按钮可见。
  - 样式核对：遮罩为浅白玻璃并带 `blur(8px) saturate(1.15)`；卡片为 18px 圆角、白色轻玻璃渐变、`rgba(255,255,255,.6)` 边框；状态胶囊为 999px 圆角浅玻璃，颜色使用主色 token；页面无横向溢出。
  - 取消核对：点击“取消”后 `#am-campaign-copy-overview-popup` 消失。
  - 安全核对：点击复制到取消期间未出现 `/solution/addList.json`、`/solution/business/addList.json`、`/solution/copy.json`、`/campaign/copy/campaignCheck.json`、`/campaign/updatePart.json`、`/bidword/add.json`、`/campaign/onebpSite/oneClick.json` 等写接口；仅观察到只读 `campaign/get.json` 和 `campaign/horizontal/findPage.json`。
  - 截图：`tasks/ui-page9-campaign-copy-overview-after-2026-05-30.png`。
  - Console：仅观察到原站资源 `net::ERR_TUNNEL_CONNECTION_FAILED` 噪声，未发现插件复制一览窗相关运行时异常。
- 页面 10 自动化：
  - `node --check src/main-assistant/campaign-id-quick-entry.js`：通过。
  - `node --check src/main-assistant/ui.js`：通过。
  - `node --check tests/campaign-concurrent-start-quick-entry.test.mjs`：通过。
  - `npm run build`：通过，已同步根 userscript、`dist/packages/` 和 `dist/extension/page.bundle.js`。
  - `node --test tests/campaign-concurrent-start-quick-entry.test.mjs tests/icon-system-regression.test.mjs`：通过，13/13；期间发现负向断言过宽扫到历史日志颜色文本，已收窄到具体 CSS rule 后通过。
  - `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs`：通过，13/13。
  - `npm run build:check`：通过。
  - `npm run check:syntax`：通过。
  - `node --check dist/extension/page.bundle.js`：通过。
  - `git diff --check`：通过。
- 页面 10 Chrome MCP：
  - 扩展详情页 `chrome://extensions/?id=egaeghgcogbdikndhlmmmolelbfffnjk` 点击 Reload 后，进入真实关键词推广列表页 `https://one.alimama.com/index.html#!/manage/search?bizCode=onebpSearch&orderField=charge&orderBy=desc`。
  - 页面身份：`关键词推广_万相台无界版`；运行态临时打开本地 `AM_HELPER_CONFIG.showConcurrentStartButton=true` 后重载，找到 40 个 `.am-campaign-concurrent-start-btn`，首个入口 campaignId `75310601591`，`aria-label="并发开启关联计划：75310601591"`；验收结束已恢复 `showConcurrentStartButton=false` 并隐藏按钮。
  - 入口样式核对：并发入口按钮为 `20px × 20px` 热区、999px 胶囊、`rgb(80,90,116)` token 文本色、透明边框和背景；内部 SVG 为 `14px × 14px`、`fill:none`、`stroke: currentColor`。按钮遵循 hover host 规则，默认 `opacity=0`/`visibility=hidden`，不破坏原生行布局。
  - 安全保护：点击前安装本地 fetch/XHR 写接口阻断 hook，并将 DevTools Network 切为 Offline；阻断范围包含 `/campaign/updatePart.json`、`/solution/addList.json`、`/solution/business/addList.json`、`/solution/copy.json`、`/campaign/copy/campaignCheck.json`、`/bidword/add.json`、`/campaign/onebpSite/oneClick.json`。
  - 交互核对：在 Offline + 阻断保护下触发首个并发入口，日志弹窗先打开；后续流程因本地阻断 `/campaign/updatePart.json` 显示失败日志，这是受保护验收的预期结果。点击“关闭并发日志”后弹窗关闭，验收后恢复网络和原 fetch/XHR。
  - 弹窗语义核对：`.am-concurrent-log-card` 为 `role=dialog`、`aria-modal=true`、`aria-labelledby=am-concurrent-log-title`、`aria-describedby=am-concurrent-log-status`；状态区 `role=status`、`aria-live=polite`；日志区 `role=log`、`aria-live=polite`、`aria-relevant="additions text"`、`tabindex=0`；关闭按钮 `aria-label="关闭并发日志"`。
  - 弹窗样式核对：遮罩为 `rgba(255,255,255,.72)` 白色轻玻璃并带 `blur(8px) saturate(1.15)`；卡片约 `760x646`、18px 圆角、白色轻玻璃渐变、`rgba(255,255,255,.6)` 边框、`blur(20px) saturate(1.4)` 和 `var(--am26-shadow)`；失败状态条使用 `var(--am26-danger)` 语义色，日志体为浅色渐变且页面无横向溢出。
  - 安全核对：阻断记录显示唯一写接口为本地拦截的 `https://one.alimama.com/campaign/updatePart.json?...&bizCode=onebpSearch`；未出现 `/solution/addList.json`、`/solution/copy.json`、`/campaign/copy/campaignCheck.json`、`/bidword/add.json`、`/campaign/onebpSite/oneClick.json` 等写接口触达。
  - 截图：`tasks/ui-page10-campaign-concurrent-log-after-2026-05-30.png`。
  - Console：仅观察到原站资源 `net::ERR_TUNNEL_CONNECTION_FAILED` 噪声；受保护阻断以弹窗日志显式展示，未发现并发日志弹窗相关未捕获异常。
- 页面 11 自动化：
  - `node --check src/main-assistant/campaign-id-quick-entry.js`：通过。
  - `node --check src/main-assistant/ui.js`：通过。
  - `node --check tests/campaign-batch-plus-quick-entry.test.mjs`：通过。
  - `node --test tests/campaign-batch-plus-quick-entry.test.mjs tests/icon-system-regression.test.mjs`：通过，15/15。
  - `node --test tests/campaign-concurrent-start-quick-entry.test.mjs tests/campaign-copy-current-plan-quick-entry.test.mjs tests/campaign-batch-plus-quick-entry.test.mjs tests/icon-system-regression.test.mjs`：通过，35/35。
  - `npm run build`：通过，已同步根 userscript、`dist/packages/` 和 `dist/extension/page.bundle.js`。
  - `npm run build:check`：通过。
  - `npm run check:syntax`：通过。
  - `node --check dist/extension/page.bundle.js`：通过。
  - `node --check 阿里妈妈多合一助手.js`：通过。
- 页面 11 Chrome MCP：
  - 扩展详情页 `chrome://extensions/?id=egaeghgcogbdikndhlmmmolelbfffnjk` 点击 Reload 后，进入真实关键词推广列表页 `https://one.alimama.com/index.html#!/manage/search?bizCode=onebpSearch&orderField=charge&orderBy=desc`。
  - 安全保护：点击前安装本地 fetch/XHR 写接口阻断 hook，覆盖 `/campaign/updatePart.json`、`/campaign/delete.json`、`/blackCrowd/batchModify.json`、`/blackCrowd/batchDelete.json`、`/solution/addList.json`、`/solution/business/addList.json`、`/solution/copy.json`、`/campaign/copy/campaignCheck.json`、`/bidword/add.json`、`/campaign/onebpSite/oneClick.json`。
  - 菜单语义核对：`批量+` 触发器打开后 `aria-expanded=true`、`aria-controls=am-campaign-batch-plus-menu`、`aria-disabled=false`、`data-am-native-disabled=1`；菜单 `role=menu`、`aria-label=批量+菜单`、`data-biz-code=onebpSearch`。
  - 菜单内容核对：5 个菜单项分别为 `批量开启 / 批量暂停 / 批量删除 / 批量修改屏蔽人群 / 批量人群设置`，全部为 `role=menuitem` 并使用共享 SVG 图标；Esc 和方向键焦点导航由专项测试覆盖。
  - 菜单样式核对：菜单宽度 `120px`、10px 圆角、`var(--am26-panel-strong)` 浅玻璃渐变、`rgba(255,255,255,.4)` 边框、`rgba(31,38,135,.15) 0px 8px 32px` 阴影和 `blur(18px) saturate(1.6)` 背景滤镜。
  - 确认窗交互核对：程序化选中 1 条真实计划 `E7pro_自定义`，campaignId `69514602419`；只打开 `批量暂停` 二次确认，未点击“确认暂停”；弹窗标题为“确认暂停计划”，正文说明会调用原生批量暂停接口。
  - 确认窗语义核对：`#am-campaign-batch-confirm-popup` 为 `role=dialog`、`aria-modal=true`，具备 `aria-labelledby` 和 `aria-describedby`；按钮为 `确认暂停 / 取消`，默认焦点停在“取消”。
  - 确认窗样式核对：遮罩为全屏白色玻璃渐变并带 `blur(8px) saturate(1.15)`；卡片约 `360x200`、18px 圆角、浅玻璃渐变和 `var(--am26-shadow)`；正文背景为 `rgba(255,255,255,.25)`，图标为共享 SVG。
  - 取消与安全核对：点击“取消”后确认窗和菜单均关闭，选中计数恢复为 0；本地写接口 guard 记录为空，performance resource 未发现本轮危险写接口触达；验收后恢复原 fetch/XHR。
  - 截图：`tasks/ui-page11-campaign-batch-plus-confirm-after-2026-05-30.png`。
  - Console：仅观察到原站资源 `net::ERR_TUNNEL_CONNECTION_FAILED` 与原站 `endGroup Error` 噪声，未发现批量+ 菜单或确认窗相关未捕获异常。
- 页面 12 自动化：
  - `node --check src/main-assistant/interceptor.js`：通过。
  - `node --check src/main-assistant/ui.js`：通过。
  - `node --check tests/download-link-depth-guard.test.mjs`：通过。
  - `npm run build`：通过，已同步根 userscript、`dist/packages/` 和 `dist/extension/page.bundle.js`。
  - `node --test tests/download-link-depth-guard.test.mjs tests/icon-system-regression.test.mjs tests/logger-api.test.mjs`：通过，24/24。
  - `npm run build:check`：通过。
  - `npm run check:syntax`：通过。
  - `node --check dist/extension/page.bundle.js`：通过。
  - `node --check 阿里妈妈多合一助手.js`：通过。
  - `git diff --check`：通过。
- 页面 12 Chrome MCP：
  - 扩展详情页 `chrome://extensions/?id=egaeghgcogbdikndhlmmmolelbfffnjk` 点击 Reload 后，进入真实关键词推广列表页 `https://one.alimama.com/index.html#!/manage/search?bizCode=onebpSearch&orderField=charge&orderBy=desc`。
  - 安全触发：安装临时点击 guard 阻断 `#am-report-capture-panel .am-download-link`，清空 resource timing 与 hook history；用 `XMLHttpRequest.open('GET', 'https://example.com/am-download-capture-probe.xlsx?download=1')` 触发捕获面板，但不调用 `send()`，未产生真实网络请求或下载。
  - 面板语义核对：`#am-report-capture-panel` 可见，`role=region`、`aria-label=报表下载捕获`、`aria-live=polite`、`aria-hidden=false`、`aria-labelledby=am-report-capture-title`、`aria-describedby=am-report-capture-url am-report-capture-status`、`tabIndex=-1`。
  - 内容核对：标题为“捕获报表”并包含 1 个共享 SVG；来源为 `XHR:OpenURL` 且有 `aria-label=来源：XHR:OpenURL`；URL 区 text/title/aria-label 均为 probe URL，使用 `word-break: break-all`、`max-height=56px`、`overflow=hidden` 和等宽字体。
  - 操作核对：直连下载链接 `href` 为 probe URL，`target=_blank`、`rel=noopener noreferrer`、`aria-label=直连下载捕获到的报表`，图标 class 为 `am-ui-icon-external-link`；复制按钮和关闭按钮均为 `button`，复制按钮关联 `am-report-capture-status`，状态区 `role=status`、`aria-live=polite`。
  - 样式核对：面板右下固定 `right/bottom=20px`、宽度 `340px`、12px 圆角、`var(--am26-panel-strong)` 浅玻璃渐变、`blur(18px) saturate(1.35)` 背景滤镜和 `var(--am26-shadow)`；复制按钮背景为 `rgba(255,255,255,.45)` token 计算值。
  - 关闭与安全核对：聚焦面板后按 Esc，面板 `display=none`、`aria-hidden=true`；performance resource 和 `__AM_HOOK_MANAGER__` history 均无 `example.com`、`addList`、`copy`、`updatePart`、`delete`、`batchModify` 记录；临时 guard 已移除。
  - 截图：`tasks/ui-page12-download-capture-panel-after-2026-05-30.png`。
  - Console：仅观察到原站资源 `net::ERR_TUNNEL_CONNECTION_FAILED` 与原站 `endGroup Error` 噪声，未发现下载捕获面板相关未捕获异常。
- 页面 13 自动化：
  - `node --check src/main-assistant/potential-plan-daily-exporter.js`：通过。
  - `node --check src/main-assistant/ui.js`：通过。
  - `node --check src/shared/script-preamble.js`：通过。
  - `node --check tests/potential-plan-daily-exporter.test.mjs`：通过。
  - `node --test tests/potential-plan-daily-exporter.test.mjs`：通过，3/3。
  - `node --test tests/potential-plan-daily-exporter.test.mjs tests/icon-system-regression.test.mjs`：通过，9/9。
  - `npm run build`：通过，已同步根 userscript、`dist/packages/` 和 `dist/extension/page.bundle.js`。
  - `npm run build:check`：通过。
  - `npm run check:syntax`：通过。
  - `git diff --check`：通过。
- 页面 13 Chrome MCP：
  - 扩展详情页 `chrome://extensions/?id=egaeghgcogbdikndhlmmmolelbfffnjk` 点击 Reload 后，进入真实潜力词页面 `https://one.alimama.com/index.html#!/report/bidword/index?mainTab=potential&mdWordType=B&target=bidword&bizCode=onebpSearch&itemId=757440599385`。
  - 偏差处理：首次检查发现当前 SPA 文档仍保留旧注入脚本，导出按钮没有新图标和 ARIA；立即硬刷新真实页后重新验证，新构建命中。
  - 语义核对：导出按钮可见，`aria-busy="false"`，`aria-label/title="潜力词日维度导出，可导出最近 30 天潜力词日维度 CSV"`；输入框为 `type=number`，`min=1`、`max=365`、`step=1`、`value=30`，具备 `aria-label="导出天数"` 和 `title="导出天数，1-365"`；状态节点 `aria-live=polite`，视觉隐藏但可读屏读取。
  - 样式核对：按钮为 `inline-flex`、高度 `32px`、8px 圆角、浅玻璃背景 `rgba(255,255,255,.45)`、边框 `rgba(255,255,255,.4)`、`white-space=nowrap`；输入框为 44px × 20px、浅玻璃背景；共享 `download` SVG 为 13px、3 个 path、`stroke: currentColor`、`fill:none`。
  - 安全核对：本轮不点击真实导出，不触发 CSV 下载、Blob URL 或直连下载；Network 中仅有页面加载和潜力词列表读取请求，未出现 `/solution/addList.json`、`/solution/copy.json`、`/campaign/updatePart.json`、创建、投放、删除或 CSV 下载类写接口。
  - 截图：`tasks/ui-page13-potential-export-after-2026-05-30.png`。
  - Console：仅观察到原站资源 `net::ERR_TUNNEL_CONNECTION_FAILED` 与原站 `endGroup Error` 噪声，未发现潜力词导出入口相关未捕获异常。
- 页面 14 自动化：
  - `node --check src/entries/extension-content.js`：通过。
  - `node --check src/entries/extension-license-guard.js`：通过。
  - `node --check tests/extension-static-build.test.mjs`：通过。
  - `node --check tests/extension-license-cache-policy-token.test.mjs`：通过。
  - `node --test tests/build-segments.test.mjs tests/extension-static-build.test.mjs tests/extension-license-cache-policy-token.test.mjs tests/extension-license-shopid-guard.test.mjs tests/keyword-plan-api-bridge-security.test.mjs tests/optimizer-entry-error-handling.test.mjs tests/package-scripts.test.mjs`：通过，33/33。
  - `npm run build`：通过，已同步 `dist/extension/content.js` 与 `dist/extension/page.bundle.js`。
  - `npm run build:check`：通过。
  - `npm run check:syntax`：通过。
  - `git diff --check`：通过。
- 页面 14 Chrome MCP：
  - 扩展详情页 `chrome://extensions/?id=egaeghgcogbdikndhlmmmolelbfffnjk` 确认当前 unpacked extension 加载自 `~/.codex/worktrees/f880/alimama-helper-pro/dist/extension`，点击 Reload 后硬刷新真实潜力词页面。
  - 页面身份：`关键词结案_万相台无界版`，URL 为 `https://one.alimama.com/index.html#!/report/bidword/index?mainTab=potential&mdWordType=B&target=bidword&bizCode=onebpSearch&itemId=757440599385`。
  - 运行态核对：只读取非敏感摘要，`runtimeMode="extension"`，授权状态为 `authorized`，`source="extension_cache_bootstrap"`，版本 `7.05`，build 为 `mcp-e2e-20260331/release`；未读取 Cookie、请求体、`leaseToken`、`policyToken`、`deviceHash`、`nonce` 或完整 shop 信息。
  - 可见状态核对：正常路径下 `#am-helper-pro-extension-injection-error` 不存在，`#am-license-lock-overlay` 不存在，证明新注入失败提示不会误报、授权锁遮罩不会误锁授权用户；锁定遮罩白玻璃样式和敏感字段排除由源码与打包静态断言覆盖。
  - 截图：`tasks/ui-page14-extension-authorized-after-2026-05-30.png`。
  - Console：仅观察到原站资源 `net::ERR_TUNNEL_CONNECTION_FAILED` 与浏览器 `ScriptProcessorNode` 弃用警告，未发现插件注入或授权遮罩相关运行时异常。

## 结果复盘
- 页面 1 结果：主入口工作台视觉已按规范收敛，按钮和开关状态更清晰，未改动业务开关逻辑。
- 页面 1 风险：本次只覆盖桌面真实页面视口；移动/窄屏只由 CSS `max-width` 和文字省略保护，后续如主面板需要移动端专门验收再补。
- 页面 1 回滚：回退 `src/main-assistant/ui.js`、`tests/logger-api.test.mjs`、构建产物和两张任务截图即可。
- 页面 2 结果：万能查数和人群对比看板顶部控制区已按统一浅玻璃工作台规范收敛，长计划/商品文本不挤压相邻控件，未改动查数接口、缓存、请求并发或任何写操作链路。
- 页面 2 风险：Chrome 验收覆盖桌面全屏看板；窄屏由 `flex-wrap`、`min-width:0` 和文本省略保护，后续如需移动视口专项验收再补。
- 页面 2 回滚：回退 `src/main-assistant/magic-report.js`、`src/main-assistant/ui.js`、`tests/magic-report-crowd-matrix.test.mjs`、`tests/logger-api.test.mjs`、构建产物和页面 2 截图即可。
- 页面 3 结果：算法护航主面板和结果浮层已按统一浅玻璃工作台规范收敛；窗口动作、手动设置展开、输入框和 Token 状态仍沿用原逻辑，未改动护航提交路径。
- 页面 3 风险：本次 Chrome 验收刻意不触发真实护航执行，因此结果浮层主要由静态回归覆盖；执行后数据表视觉未通过真实写接口闭环。
- 页面 3 回滚：回退 `src/optimizer/ui.js`、`tests/optimizer-token-capture-history.test.mjs`、构建产物和页面 3 截图即可。
- 页面 4 结果：组建计划主向导首页/日志区已按统一浅玻璃工作台规范收敛；首页摘要、商品区、计划区、执行条、快速日志和日志页摘要/日志均可见且状态清晰，tab 语义和 SVG 图标回归已补齐，未改动提交创建链路。
- 页面 4 风险：真实验收刻意不触发创建/提交，因此提交后的执行日志增长由现有专项测试和静态样式覆盖；本轮覆盖桌面真实页视口，窄屏依赖现有响应式约束。
- 页面 4 回滚：回退 `src/optimizer/keyword-plan-api/wizard-mount-intro.js`、`src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`、`tests/keyword-home-strategy-batch-actions.test.mjs`、`tests/icon-system-regression.test.mjs`、构建产物和页面 4 截图即可。
- 页面 5 结果：矩阵配置页已按统一浅玻璃工作台规范收敛；基础参数、状态统计、快捷预设、场景卡片、维度卡片和下拉选择器层级清晰，SVG 箭头替代旧 CSS/data-url 箭头，未改动矩阵组合生成和提交创建链路。
- 页面 5 风险：真实验收刻意不触发“生成计划”和提交创建，因此生成结果列表主要由专项测试覆盖；本轮覆盖桌面真实页视口，窄屏依赖现有响应式约束。
- 页面 5 回滚：回退 `src/optimizer/keyword-plan-api/request-builder-preview.js`、`src/optimizer/keyword-plan-api/wizard-style-and-state/matrix-bid-package.js`、`src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`、`tests/keyword-home-strategy-batch-actions.test.mjs`、`tests/matrix-plan-config.test.mjs`、构建产物和页面 5 截图即可。
- 页面 6 结果：添加商品弹窗已按统一浅玻璃工作台规范收敛，标题、搜索、候选、已选、状态和底部动作在真实页中可见且交互稳定；添加/取消只影响本地弹窗状态，未触发创建或写接口。
- 页面 6 风险：真实验收覆盖了默认候选列表、添加和取消回滚；未执行关键词搜索后的远端候选刷新，也未点击“确认”写回新商品后继续提交创建。
- 页面 6 回滚：回退 `src/optimizer/keyword-plan-api/wizard-mount-intro.js`、`src/optimizer/keyword-plan-api/wizard-scene-config/item-selection.js`、`src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`、`tests/keyword-item-picker-popup.test.mjs`、构建产物和页面 6 截图即可。
- 页面 7 结果：编辑计划详情层和高级设置弹窗已按统一浅玻璃工作台规范收敛，详情标题、状态、场景配置、高级设置 tab、地域/分时/资源位容器在真实页中可见且可操作；未改动策略字段回填、保存/取消、预览和提交创建链路。
- 页面 7 风险：真实验收覆盖了打开编辑详情、可回滚输入、高级设置 tab 切换和取消关闭；未点击高级设置“确定”写回配置，也未触发后续预览或提交创建。
- 页面 7 回滚：回退 `src/optimizer/keyword-plan-api/wizard-mount-intro.js`、`src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`、`tests/keyword-edit-strategy-settings.test.mjs`、构建产物和页面 7 截图即可。
- 页面 8 结果：提交创建二次确认弹窗已按统一浅玻璃工作台规范收敛，统计信息、场景摘要、待提交状态和风险提示在真实页中可见且取消稳定；确认 gating 仍保留，未改动实际创建提交链路。
- 页面 8 风险：真实验收刻意不点击“确认提交创建”，因此确认后的真实创建执行仍由既有提交链路和专项测试覆盖；本轮只证明二次确认打开、取消和不触发写接口。
- 页面 8 回滚：回退 `src/optimizer/keyword-plan-api/request-builder-preview.js`、`src/optimizer/keyword-plan-api/wizard-scene-config/manual-keywords-and-detail.js`、`src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`、`tests/keyword-home-strategy-batch-actions.test.mjs`、构建产物和页面 8 截图即可。
- 页面 9 结果：计划行复制入口和复制一览/成功弹窗已按统一浅玻璃工作台规范收敛，入口按钮、数量徽标、待确认/已完成状态和状态条语义更清晰；真实页验证覆盖入口、一览窗、取消关闭和不触发写接口。
- 页面 9 风险：真实验收刻意不点击“确认生成”，因此成功弹窗无法在不真实创建计划的前提下触发；成功窗的 `aria-describedby`、已完成状态胶囊和成功语义 token 由源码与专项测试覆盖。
- 页面 9 回滚：回退 `src/main-assistant/campaign-id-quick-entry.js`、`src/main-assistant/ui.js`、`tests/campaign-copy-current-plan-quick-entry.test.mjs`、构建产物和页面 9 截图即可。
- 页面 10 结果：计划行并发开启入口与执行日志弹窗已按统一浅玻璃工作台规范收敛，入口 hover/focus、弹窗遮罩、日志卡片、状态区、日志明细和警告/错误/成功语义色更一致；真实页验证覆盖入口注入、受保护打开日志、关闭恢复和写接口阻断。
- 页面 10 风险：真实验收刻意不执行真实并发开启/暂停，无法证明服务端状态更新闭环；业务执行链路由既有并发专项测试覆盖，本轮仅证明 UI/语义和受保护失败路径稳定。
- 页面 10 回滚：回退 `src/main-assistant/campaign-id-quick-entry.js`、`src/main-assistant/ui.js`、`tests/campaign-concurrent-start-quick-entry.test.mjs`、构建产物和页面 10 截图即可。
- 页面 11 结果：批量+ 菜单和批量确认弹窗已按统一浅玻璃工作台规范收敛，菜单 ARIA、键盘关闭/导航、危险项语义色和确认窗默认取消焦点更稳；真实页验证覆盖菜单打开、确认窗打开、取消关闭和不触发写接口。
- 页面 11 风险：真实验收刻意不点击批量开启/暂停/删除确认按钮，无法证明服务端写入闭环；对应状态更新、删除、人群官方弹窗和刷新链路仍由既有业务实现与专项测试覆盖。
- 页面 11 回滚：回退 `src/main-assistant/campaign-id-quick-entry.js`、`src/main-assistant/ui.js`、`tests/campaign-batch-plus-quick-entry.test.mjs`、构建产物和页面 11 截图即可。
- 页面 12 结果：下载捕获面板已按统一浅玻璃工作台规范补齐面板级语义、完整 URL 说明、复制 live 状态、Esc 关闭和 token 化视觉；真实页验证覆盖不发请求的捕获触发、面板展示、截图、Esc 关闭和无下载/无写接口。
- 页面 12 风险：真实验收刻意不点击“直连下载”，也不触发阿里妈妈真实报表导出；真实报表服务端生成下载链接仍由既有拦截逻辑覆盖，本轮只证明捕获面板 UI/语义和安全触发路径稳定。
- 页面 12 回滚：回退 `src/main-assistant/interceptor.js`、`src/main-assistant/ui.js`、`tests/download-link-depth-guard.test.mjs`、构建产物和页面 12 截图即可。
- 页面 13 结果：潜力词日维度导出入口已按统一浅玻璃规范收敛，运行态具备共享下载图标、可访问名称、导出天数输入边界、live 状态和 reduced-motion 适配；真实页硬刷新后已验证新构建命中，未改动导出数据链路。
- 页面 13 风险：真实验收刻意不点击“下载CSV”，因此没有验证服务端导出、CSV 字段和浏览器下载文件本身；本轮只证明入口 UI/语义和默认状态稳定。
- 页面 13 回滚：回退 `src/main-assistant/potential-plan-daily-exporter.js`、`src/main-assistant/ui.js`、`src/shared/script-preamble.js`、`tests/potential-plan-daily-exporter.test.mjs`、构建产物和页面 13 截图即可。
- 页面 14 结果：extension 注入失败和授权锁定两个异常可见状态已按统一浅玻璃规范收敛；正常授权运行态已在真实页面验证没有注入失败提示和误锁遮罩，安全链路保持不变。
- 页面 14 风险：真实验收未刻意破坏 extension 注入或授权缓存来触发失败态，避免影响当前账号授权与页面运行；失败态视觉由源码断言、打包断言和静态测试覆盖。
- 页面 14 回滚：回退 `src/entries/extension-content.js`、`src/entries/extension-license-guard.js`、`tests/extension-static-build.test.mjs`、`tests/extension-license-cache-policy-token.test.mjs`、`dist/extension/content.js`、`dist/extension/page.bundle.js` 和页面 14 截图即可。

---

# TODO - 2026-05-30 关键词推广复制计划关键词未落库返修

## 需求规格
- 目标：修复关键词推广当前计划复制后，新计划中“关键词”没有真正复制落库的问题。
- 范围：只处理 `onebpSearch` 复制计划链路中的关键词读取、创建后写入和验证；继续保留已修复的地域、人群、创意、时间折扣、全能调价等字段复制逻辑；不改批量+、预算、删除、开启投放或其它业务线。
- 安全边界：真实浏览器调试默认只读；如需调用关键词写入接口，只能写入本轮新复制出来的暂停计划，不得修改源计划或在投计划；写请求必须先有接口合同证据和守卫记录。
- 成功标准：明确 `adgroup.wordList` 随 `/solution/addList.json` 提交但未落库的根因；复制成功后若源计划有关键词，必须使用服务端接受的接口把关键词绑定到新 `adgroupId`；失败时不能假成功，需在结果里明确“计划已创建但关键词复制失败”；测试、构建和真实页面/只读接口验收均通过。

## 执行计划（可核对）
- [x] 记录用户纠正：上轮真实创建成功但新计划关键词未复制，任务仍未完成。
- [x] 只读确认源计划与新计划的关键词读取接口、响应字段和空/非空差异。
- [x] 定位关键词写入接口合同，确认创建后需要的新 `campaignId/adgroupId`、`wordList` 字段和响应成功判定。
- [x] 修改复制链路：`addList` 成功拿到新计划/单元 ID 后，后置复制源关键词；关键词写入失败时返回部分失败而不是假成功。
- [x] 补充回归测试覆盖“创建后调用关键词添加接口”和“关键词添加失败会暴露失败”。
- [x] 运行专项测试、语法检查、构建同步检查，并重载扩展做真实浏览器验收。

## 高层操作摘要
- 用户最新反馈“计划里关键词没有复制过来”，说明上一轮只证明了计划创建、暂停和部分字段 payload，未证明关键词服务端落库。
- 当前判断：`/solution/addList.json` 请求里带 `adgroup.wordList` 不等于关键词会被服务端创建；关键词很可能需要在创建成功后用关键词专用接口按新 `adgroupId` 单独添加。
- 本轮先抓只读接口合同，再改后置写入链路，避免继续在 addList payload 上追加无法落库的字段。
- 实现改为创建成功后解析新 `adgroupId`，复用 `appendKeywords/bidword.add` 按源关键词和源上下文补写；若补写失败，复制结果返回 `partial` 失败，不显示整体成功。

## 验证记录
- 代码修复：`src/optimizer/keyword-plan-api/search-and-draft.js` 补充创建响应 `adgroupId/adgroupIds` 提取；`src/optimizer/keyword-plan-api/wizard-open-and-create.js` 将源 `wordList` 归一后保存在复制 meta，并在创建后调用 `appendKeywords()` 按新单元补写关键词。
- 回归测试：`tests/campaign-copy-current-plan-quick-entry.test.mjs` 新增“关键词当前计划复制创建后必须按新单元补写源关键词”，覆盖源关键词保留、新单元 ID 解析、`appendKeywords` 调用和补写失败 `partial` 暴露。
- `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs`：通过，13/13。
- `node --check src/optimizer/keyword-plan-api/search-and-draft.js`：通过。
- `node --check src/optimizer/keyword-plan-api/wizard-open-and-create.js`：通过。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `git diff --check`：通过。
- Chrome DevTools MCP：真实关键词推广详情页 `https://one.alimama.com/index.html#!/manage/search-detail?...campaignId=81165438388&adgroupId=81080977218` 可打开；运行态 `hasApi=true`，页面包含关键词相关内容。
- 运行态快照：`tasks/keyword-copy-real-submit-modal-rerun-2026-05-30.txt` 记录复制确认窗；`tasks/keyword-copy-real-success-detail-rerun-2026-05-30.txt` 记录复测计划 `E7pro_自定义_复测472594 / campaignId=81165308472` 在关键词推广列表可见。

## 结果复盘
- 结果：关键词推广复制已从“仅创建计划并携带 `wordList`”升级为“创建后按新单元补写源关键词”，避免服务端忽略创建 payload 中关键词时仍假成功。
- 风险：本次收尾做了真实页面/API 注入核对和已有复测快照复核，没有再次发起新的真实复制写请求；后续如用户再要求闭环，应只对本轮新暂停计划做只读对比或受控补写验证。
- 回滚方式：回退 `src/optimizer/keyword-plan-api/search-and-draft.js`、`src/optimizer/keyword-plan-api/wizard-open-and-create.js`、`tests/campaign-copy-current-plan-quick-entry.test.mjs` 及构建产物即可。

---

# TODO - 2026-05-30 关键词推广真实复制浏览器验收

## 需求规格
- 目标：按用户授权，在真实浏览器关键词推广页面测试插件复制 `E7pro_自定义`，直到新计划实际复制成功并可在页面查到。
- 范围：只验证关键词推广当前计划复制链路；复制合同必须覆盖关键词/词包、人群、地域、创意、时间折扣、全能调价/规则自动化、预算出价和暂停状态；不操作批量+、预算修改、删除、开启投放、商品编辑、地域编辑或其它写操作。
- 安全边界：本轮用户已授权真实复制计划；新计划名称使用可识别的测试后缀，目标状态优先保持暂停或通过复制后暂停兜底处理；除复制和必要的暂停兜底外，不触发其它创建/更新/删除/投放类写请求。
- 成功标准：浏览器运行态确认加载了最新官方复制接口修复；执行真实复制请求成功；页面或只读接口能查到新计划；记录源计划 ID、新计划名称、新计划 ID、复制/暂停接口响应、页面最终状态和异常情况。

## 执行计划（可核对）
- [x] 确认测试浏览器、扩展运行态和目标关键词推广页面可用，必要时重载扩展并硬刷新页面。
- [x] 定位源计划 `E7pro_自定义`，记录源计划 ID、状态和当前页面上下文。
- [x] 验证关键词推广官方 copy dry-run 与真实提交差异，确认 `/solution/copy.json` 真实不可用。
- [x] 修正关键词推广复制策略：撤回官方 copy，回到受控 addList 路径，并保留关键词/词包、人群、地域、创意、时间折扣、全能调价等源字段。
- [x] 通过插件运行态执行真实复制，使用唯一测试计划名并设置目标暂停状态。
- [x] 等待复制结果，记录创建接口、暂停兜底响应和关键字段 payload。
- [x] 搜索新计划并验证页面可见，记录最终状态；如失败，按错误继续定位并重试到成功或明确阻塞。

## 高层操作摘要
- 用户明确要求“请在浏览器里测试，直到复制成功”，因此本轮从 dry-run 升级为真实复制验收。
- 为降低真实投放风险，本轮只复制指定关键词推广计划，命名使用测试后缀，复制后目标状态按暂停处理。
- 已按用户要求启动 5 个子代理分工：接口路径、字段保留、测试断言、浏览器验收、任务记录；其中 3 个结论支持撤回关键词官方 copy，1 个浏览器方案误判为继续官方 copy，主线程以真实抓包“该场景暂无此功能”为准。
- dry-run 成功只能证明运行态会生成 `onebpSearch` 官方 copy payload；真实调用 `/solution/copy.json` 返回“该场景暂无此功能”，证明关键词推广服务端不支持该官方复制能力。
- 最新补充要求复制合同覆盖关键词、人群、地域、创意、时间折扣、全能调价等，因此后续修复不能只解决接口路径，还要证明这些源字段不会被默认值或推荐词重建覆盖。

## 验证记录
- Chrome DevTools MCP：真实关键词推广页 `https://one.alimama.com/index.html#!/manage/search?bizCode=onebpSearch&orderField=charge&orderBy=desc&offset=0&searchKey=campaignNameLike&searchValue=E7` 可用；页面 API 存在 `window.__AM_WXT_PLAN_API__.copyCurrentPlanByScene`；扩展 ID `egaeghgcogbdikndhlmmmolelbfffnjk`，加载路径为本仓库 `dist/extension`。
- Chrome dry-run：此前调用 `copyCurrentPlanByScene('关键词推广', source, { dryRunOnly:true, ... })` 成功生成 `bizCode:"onebpSearch"` 的官方 copy payload，未触发真实写请求。
- Chrome 真实官方 copy：`/campaign/copy/campaignCheck.json` 返回成功后，`/solution/copy.json` 对 `bizCode:"onebpSearch"` 返回业务错误“该场景暂无此功能”；随后搜索新名称未查到新计划。
- 结论：此前“关键词推广优先走官方复制接口”的判断被真实接口否定；不能把 dry-run 成功当作服务端能力可用证明。
- 代码修复：`src/optimizer/keyword-plan-api/wizard-open-and-create.js` 已将官方复制场景收回到 `onebpDisplay/人群推广`；关键词推广 `onebpSearch` 改回受控 `/solution/addList.json` 创建路径，并显式携带源 `wordList/wordPackageList`、`keywordMode='manual'`，避免复制时重建推荐词覆盖源词。
- 字段合同：`src/optimizer/keyword-plan-api/search-and-draft.js` 已补充关键词单元复制白名单，允许 `wordList/wordPackageList/adzoneList/crowdList/smartCreative/creativeSetMode/openAutoCreative/openStaticCreative/creativeList/creativeInfo/materialList` 等源字段透传；关键词归一化保留源关键词扩展字段。
- `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs`：通过，12/12；覆盖人群推广仍走官方复制、关键词推广不进官方 copy、关键词/地域/时间折扣/全能调价/创意字段保留。
- `node --check src/optimizer/keyword-plan-api/search-and-draft.js`：通过。
- `node --check src/optimizer/keyword-plan-api/wizard-open-and-create.js`：通过。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 和 `dist/extension/page.bundle.js`。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- Chrome 扩展重载：`chrome://extensions/?id=egaeghgcogbdikndhlmmmolelbfffnjk` 已 Reload，加载路径确认为 `/Users/liangchao/.codex/worktrees/f880/alimama-helper-pro/dist/extension`；刷新关键词页后运行态 `page.bundle.js` 中 `isOfficialCopyScene` 不含 `onebpSearch/关键词推广`。
- Chrome 新版 dry-run：`copyCurrentPlanByScene('关键词推广', source, { dryRunOnly:true })` 返回 `dryRunOnly:true`，无 `officialCopyPayloads`，`sample.meta.submitEndpoint="/solution/addList.json"`；样例保留 `launchAreaStrList`、`launchPeriodList`、`wordList`、`wordPackageList`、`crowdList`、`adzone/right`、`creative*`、`enableRuleAuto/ruleCommand`。
- Chrome 真实复制：通过真实行级复制按钮链路复制源计划 `E7pro_自定义 / campaignId 69514602419 / adgroupId 69510831221 / bizCode onebpSearch`；为避免源计划在投导致新计划在投，临时把按钮 `data-am-campaign-copy` 改为 `pause` 后执行。
- 创建结果：`POST /solution/addList.json` 返回 `info.ok=true`、`data.list[0].campaignId=81122466501`、`errorDetails=[]`；新计划名 `E7pro_自定义_2`，新 `campaignId=81122466501`、`adgroupId=81122204956`。
- 暂停兜底：随后 `POST /campaign/updatePart.json` 返回 `info.ok=true`，新计划 `onlineStatus=0`；列表和只读详情显示 `displayStatus="pause"`，没有开启投放。
- 安全核对：新版真实复制未再调用 `/solution/copy.json` 或 `/campaign/copy/campaignCheck.json`；除创建和必要暂停兜底外，未执行删除、开启投放、商品编辑、预算修改等无关写操作。
- 提交 payload 关键字段：`body.solutionList[0].campaign.campaignName="E7pro_自定义_2"`，`bizCode="onebpSearch"`，`launchAreaStrList` 数量 87，`launchPeriodList` 数量 7，`dayBudget=1000`，`dmcType="normal"`，`bidType/bidTypeV2="custom_bid"`，`campaign.crowdList` 数量 23，`adgroup.wordList` 数量 5，`adgroup.smartCreative=1`。请求结构为 `solutionList[0].campaign` 与 `solutionList[0].adgroupList[0]`，不是 `campaignList`。
- 关键词核对：提交的 5 个源关键词为 `美的` 出价 `1.13`、`美的家用全自动洗碗机` 出价 `1`、`美的13套洗碗机` 出价 `1`、`美的洗碗机d1` 出价 `1`、`美的 e7por` 出价 `1`，均带源匹配配置。
- 只读详情核对：源计划与新计划均保持地域 87、分时 7、预算 1000、出价方式 custom、`smartCreative=1`、人群读取成功；`adgroup/get` 不直接返回 `wordList`，但创建 payload 已明确带 5 个词且服务端创建成功。
- 页面核对：在关键词推广列表搜索新计划可见 `E7pro_自定义_2`，状态为暂停。

## 结果复盘
- 结果：关键词推广复制已从真实不可用的官方 `/solution/copy.json` 改回受控 `/solution/addList.json`，并补齐复制合同；真实浏览器中已成功从 `E7pro_自定义` 复制出暂停的新计划 `E7pro_自定义_2 / campaignId 81122466501`。
- 风险：源计划详情接口本轮没有返回独立 `creativeList`，因此无法对比独立创意列表；现有复制已保留 `smartCreative=1`，并在白名单中支持 `creativeList/creativeInfo/materialList`，后续源接口返回独立创意字段时会透传。
- 回滚方式：回退 `src/optimizer/keyword-plan-api/wizard-open-and-create.js`、`src/optimizer/keyword-plan-api/search-and-draft.js`、`tests/campaign-copy-current-plan-quick-entry.test.mjs` 和构建产物即可恢复旧行为；不建议回滚到关键词官方 copy，因为真实服务端返回“该场景暂无此功能”。

---

# TODO - 2026-05-30 关键词推广复制计划发货关键词与地区未复制

## 需求规格
- 目标：修复关键词推广 `onebpSearch` 中通过插件“复制计划”复制 `E7pro_自定义` 类计划时，源计划的发货关键词、地区/地域等关键配置未复制到新计划的问题。
- 范围：只处理关键词推广复制计划链路；不扩大到人群推广、线索推广、批量+、预算修改、UI 主题迁移或真实投放提交。
- 安全边界：除非用户明确授权，不在真实页面点击最终确认生成，不触发创建/复制/保存/投放类写请求；浏览器验证优先只读检查源计划详情、运行态接口选择和 payload 组装。
- 成功标准：明确字段丢失根因；复制链路应优先使用关键词推广官方完整复制接口，或在无法使用官方接口时完整保留源计划发货关键词、地域等字段；补充回归测试覆盖这些字段；专项测试、构建同步检查和语法检查通过。

## 执行计划（可核对）
- [x] 复核关键词推广复制按钮到 `copyCurrentPlanByScene` 的调用路径，确认当前走官方 copy 还是通用 addList 组包。
- [x] 定位发货关键词、地区/地域字段在源计划详情、提取、裁剪、提交 payload 中的字段名和丢失位置。
- [x] 设计并实施最小根因修复，避免新增第二套事实源或仅靠手写兜底字段。
- [x] 补充或更新关键词推广复制计划回归测试，覆盖发货关键词和地区/地域保留。
- [x] 运行专项测试、构建同步检查、语法检查和 diff 自审；必要时做受保护浏览器只读验收。

## 高层操作摘要
- 用户最新补充确认问题发生在“关键词推广”内，当前排查范围收窄到 `onebpSearch` 复制计划。
- 已启动两个只读 explorer 并行调研：一个看复制链路与接口选择，一个看发货关键词/地区字段映射；主线程同步推进本地定位。
- 根因：关键词推广复制此前落到通用 `createPlansByScene -> addList` 组包链路。该链路会先按复制白名单保留字段，再在关键词自定义场景里重新构建 `wordList/wordPackageList`、裁剪 campaign/adgroup，发货关键词、地区别名或隐藏合同字段容易被覆盖为默认值。
- 方案选择：不继续追补单个隐藏字段，改为让关键词推广和人群推广一样走官方 `/campaign/copy/campaignCheck.json -> /solution/copy.json` 服务端复制链路；插件继续负责复制数量、命名、目标暂停兜底和成功后搜索。
- 外部规则已按用户给的 `AGENT-v2.md` 读取，本轮遵循其中“Debug-First、结构性修复、验证顺序、diff review”规则。

## 验证记录
- 代码修改：`src/optimizer/keyword-plan-api/wizard-open-and-create.js` 将官方复制判定从 `onebpDisplay/人群推广` 扩展为 `onebpDisplay/onebpSearch/人群推广/关键词推广`；官方复制 payload 构造改为通用命名，不再硬编码人群推广默认 `bizCode`。
- 回归测试：`tests/campaign-copy-current-plan-quick-entry.test.mjs` 更新断言，明确关键词推广和人群推广都必须调用原生 `/solution/copy.json`，而不是通用 `addList` 自组 payload。
- `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs`：通过，12/12。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 和 `dist/extension/page.bundle.js`。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `git diff --check -- src/optimizer/keyword-plan-api/wizard-open-and-create.js tests/campaign-copy-current-plan-quick-entry.test.mjs tasks/todo.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/packages/alimama-helper-pro.meta.js dist/extension/page.bundle.js dist/extension/content.js dist/extension/background.js dist/extension/manifest.json`：通过。
- Chrome DevTools MCP 只读验证：真实关键词推广页 `https://one.alimama.com/index.html#!/manage/search?bizCode=onebpSearch&orderField=charge&orderBy=desc&offset=0&searchKey=campaignNameLike&searchValue=E7`，刷新后可见源计划 `E7pro_自定义 / 69514602419`。
- Chrome dry-run：调用运行态 `copyCurrentPlanByScene('关键词推广', source, { dryRunOnly:true, newPlanName:'E7pro_自定义_dryrun', targetOnlineStatus:0 })` 返回 `ok=true`、`dryRunOnly=true`，`officialCopyPayloads[0]` 为 `bizCode:"onebpSearch"`、`copyCampaignId:69514602419`、`campaignName:"E7pro_自定义_dryrun"`、`startTime:"2026-05-30"`、`launchForever:true`。
- Chrome 安全核对：dry-run 前后 performance resource 未新增 `/solution/copy.json`、`/solution/addList.json`、`/campaign/copy/campaignCheck.json`、`/campaign/updatePart.json` 或其它创建/复制/暂停类写请求；本轮未点击真实“确认生成”。

## 结果复盘
- 结果：关键词推广复制计划已切到官方复制接口，避免通用 addList 组包重建时遗漏发货关键词、地区/地域等隐藏配置；运行态 dry-run 已证明会生成 `onebpSearch` 官方复制 payload，且不会在 dry-run 时触发真实写请求。
- 风险：本轮没有真实点击确认生成，因此验证到接口选择和 payload 形态；真正服务端落库仍需用户授权后用暂停计划做受控真实复制，再只读对比源计划与新计划详情。
- 回滚方式：回退 `src/optimizer/keyword-plan-api/wizard-open-and-create.js`、`tests/campaign-copy-current-plan-quick-entry.test.mjs` 及构建产物即可恢复旧的关键词通用 addList 复制链路，但会重新承担隐藏字段复制不完整风险。

---

# TODO - 2026-05-30 批量+成功后只刷新计划列表

## 需求规格
- 目标：参考原生“批量修改每日预算”提交后的行为，把插件 `批量+` 成功后的整页刷新改为只刷新当前计划列表。
- 范围：只调整 `批量+` 批量开启/暂停、删除，以及已接入官方批量修改人群/屏蔽人群成功后的刷新收尾；不改变请求 payload、确认弹窗、选择计划逻辑、官方弹窗复用或任何真实提交接口。
- 安全边界：本轮浏览器验收不真实点击 `批量+` 确认提交；只验证源码、测试和运行态可找到原生列表刷新入口。若需要真实提交，只能另行明确授权并使用暂停计划。
- 成功标准：源码中 `批量+` 成功路径不再直接 `window.location.reload()`；优先触发当前页面原生搜索/列表刷新按钮或 Magix 列表 view 的刷新事件；专项测试、构建同步检查、语法检查通过；Chrome 只读验证确认原生预算提交后页面刷新的是列表请求，并确认 `批量+` 运行态具备列表刷新函数。

## 执行计划（可核对）
- [x] 复核 `批量+` 成功后的所有 `location.reload()` 使用点，区分业务提交和兜底错误提示。
- [x] 实现共享 `refreshCampaignListOnly()`，优先复用 Magix 计划列表 VFrame 的 `render()`，找不到时才兜底触发原生计划名称搜索框回车刷新。
- [x] 将 `批量+` 状态、删除、人群类官方提交成功回调切到列表刷新函数，并补测试禁止成功路径直接整页刷新。
- [x] 运行专项测试、构建同步检查、语法检查、bundle 检查和空白检查。
- [x] 用 Chrome DevTools MCP 在真实页面只读验证运行态列表刷新能力与无真实写操作。

## 高层操作摘要
- 用户刚刚观察到原生批量预算修改提交后只是刷新计划列表；当前 `批量+` 成功路径仍有多个 `window.location.reload()`，会打断页面状态。
- 本轮目标是把刷新行为对齐原生：提交成功后触发列表局部刷新，不改变批量动作本身。
- 原生机制已通过真实页面网络监听确认：预算提交成功后页面不触发 document navigation，而是列表 VFrame 重新请求 `/campaign/horizontal/findPage.json`，随后刷新 `report/query.json` 和 `cube/triggerDynamicModule.json`。
- 真实页面进一步验证：`universalBP_common_layout_main_content_search_campaign_list` 的 `render()` 会发 `POST /campaign/horizontal/findPage.json`；`asyncRenderData()` 主要刷新报表/动态模块，因此插件局部刷新优先级调整为 `render` -> `asyncRenderData`，搜索框回车仅作兜底。

## 验证记录
- 代码审计：`src/main-assistant/campaign-id-quick-entry.js` 中 `批量+` 成功路径已不再出现 `window.location.reload()`；批量开启/暂停、批量删除、人群推广/线索推广批量修改屏蔽人群成功回调均改为 `refreshCampaignListOnly()`。
- 实现细节：`findCampaignListVframe()` 按当前业务线定位 `onebp/views/pages/manage/{search|display|onesite|hky}/campaign-list`；`refreshCampaignListVframe()` 优先调用官方列表 VFrame `render()`，再兜底 `asyncRenderData()`；若无法找到 VFrame，才触发计划名称搜索框回车刷新。
- Chrome DevTools MCP 只读验证：真实 `https://one.alimama.com/index.html#!/manage/search?orderField=charge&orderBy=desc` 页面通过 `seajs.use(['magix'])` 找到 `universalBP_common_layout_main_content_search_campaign_list`，`rootView` 为 `onebp/views/pages/manage/search/campaign-list?...`，具备 `vf.invoke()`。
- Chrome 网络探针：调用该 VFrame `render()` 后记录到 `POST /campaign/horizontal/findPage.json?...bizCode=onebpSearch`，请求体包含 `mx_bizCode:"onebpSearch"`、`bizCode:"onebpSearch"`、`offset:0`、`pageSize:40`、`orderField:"charge"`、`orderBy:"desc"`、`queryRuleAuto:"1"` 和当天 `rptQuery`；随后出现 `report/query.json`、`cube/triggerDynamicModule.json`。未出现 document 导航或整页刷新。
- Chrome 对比探针：调用 `asyncRenderData()` 只记录到 `report/query.json` 和 `cube/triggerDynamicModule.json`，没有稳定重新拉取 `findPage.json`；因此最终实现选择 `render()` 为首选列表刷新方法。
- 本轮未点击 `批量+` 确认、未执行开启/暂停/删除/人群修改等真实写操作；Chrome 探针只触发计划列表读取和报表/动态模块读取。
- `node --test tests/campaign-batch-plus-quick-entry.test.mjs`：通过，9/9。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `git diff --check -- src/main-assistant/campaign-id-quick-entry.js tests/campaign-batch-plus-quick-entry.test.mjs tasks/todo.md tasks/lessons.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/packages/alimama-helper-pro.meta.js dist/extension/page.bundle.js dist/extension/content.js dist/extension/background.js dist/extension/manifest.json`：通过。

## 结果复盘
- 结论：原生“批量修改每日预算”的刷新是列表局部刷新，不是 `window.location.reload()`；核心是让当前计划列表 VFrame 重新 `render()`，由页面自己带着当前筛选、排序、分页参数重新请求 `campaign/horizontal/findPage.json`。
- 结果：`批量+` 成功收尾已对齐该机制，成功后只刷新计划列表；若当前页面找不到列表 VFrame，才保守用原生计划名称搜索框回车触发列表刷新，并提示用户手动刷新，而不再自动整页 reload。
- 风险：本轮没有真实执行 `批量+` 写操作，只验证了刷新入口、源码和测试；真实写后服务端状态仍依赖对应批量接口本身的成功返回。若后续要端到端验证 `批量+` 写后列表更新，需要用户另行明确授权并继续只使用暂停计划。
- 回滚方式：回退 `src/main-assistant/campaign-id-quick-entry.js`、`tests/campaign-batch-plus-quick-entry.test.mjs` 及构建产物即可恢复旧刷新行为；不涉及请求 payload 或接口权限回滚。

---

# TODO - 2026-05-30 真实提交 1 个暂停计划批量修改每日预算验证

## 需求规格
- 目标：按用户明确授权，在真实 `one.alimama.com` 页面只选择 1 个暂停计划，使用原生“批量计划设置 -> 批量修改每日预算”完成一次真实提交，并核对提交是否生效。
- 范围：只验证原生批量修改每日预算链路；不使用插件 `批量+` 提交，不创建/删除/开启计划，不批量选择多个计划，不操作在投计划。
- 安全边界：提交前确认被选中计划状态为暂停；预算改为一个保守且可识别的新值；只允许实测原生预算修改必要写请求通过，继续记录并禁止其它创建、删除、复制、保存、商品/方案写接口。
- 成功标准：页面只选中 1 个暂停计划；原生每日预算弹窗完成真实提交；网络返回成功或页面可见预算更新；关闭/刷新后能在列表或详情中核对新预算；记录请求、计划 ID、原值、新值和未触发的其它写请求。

## 执行计划（可核对）
- [x] 进入真实页面并刷新运行态，确认当前插件补丁已加载且 `批量+` 菜单未参与原生入口。
- [x] 选择 1 个暂停计划，记录计划名称、ID、当前每日预算和状态。
- [x] 打开原生“批量计划设置 -> 批量修改每日预算”，读取弹窗目标，填入保守新预算。
- [x] 临时安装网络监控：记录预算修改接口并阻止其它非本次写接口。
- [x] 点击官方提交/确定，等待接口返回和页面提示，核对预算是否生效。
- [x] 取消选择计划、记录验证结果；必要时更新 `tasks/lessons.md` 和本任务复盘。

## 高层操作摘要
- 用户已明确授权本次真实提交，边界从此前“不真实提交”切换为“仅 1 个暂停计划的预算修改提交”。
- 子代理审计按用户规则再次尝试 3 路并行，但当前会话仍返回 `agent thread limit reached`；主线程继续执行并记录该阻塞。
- 实测原生“批量修改每日预算”的写接口是 `/campaign/budget/batchUpdate.json`，不是此前提交前链路排查里预估的 `/campaign/updatePart.json`；本次记录已按真实接口修正。

## 验证记录
- Chrome DevTools MCP：真实 `https://one.alimama.com/index.html#!/manage/search?orderField=charge&orderBy=desc` 页面，运行态确认 `window.__AM_BUDGET_FRONTEND_UNLOCK__=true`，`批量+` 包装存在但 `#am-campaign-batch-plus-menu=false`，本次未使用插件 `批量+` 入口。
- 选择计划：只勾选 1 个暂停计划 `E7pro_自定义_1 / ID 81075718778`；DOM 状态 host 为 `mx-status/index?...selected=pause`，提交前预算单元格为 `1,000元 / 每日预算`。
- 原生弹窗：通过官方 `批量计划设置` host `mx_1431` 打开原生菜单 `popmenu_mx_1431`，点击第一项 `batchChangeDmcType / 批量修改每日预算`；官方弹窗 `wrapper_dlg_17968` / `dlg_17968` 显示 `选择 1 / 1 个计划批量修改每日预算`，行内计划 ID 为 `81075718778`。
- 预算值：官方建议接口返回 `budgetMin=1000`，因此没有使用预想的 `999`；为避免低于下限导致额外变量，改为保守增加 1 元，行内“修改预算”输入框填入 `1001`。
- 真实提交：点击官方弹窗“确定”后，实测请求为 `POST /campaign/budget/batchUpdate.json`，请求体包含 `bizCode:"onebpSearch"`、`campaignId:81075718778`、`dmcType:"normal"`、`dayBudget:"1001"`；响应 200，`info.ok=true`，`data.errorCount=0`，返回 `list:[{ campaignId:81075718778, newDayBudget:1001, dmcType:"normal" }]`。
- 页面核对：提交后官方弹窗自动关闭，页面列表刷新；目标行显示 `1,001元 / 每日预算`，状态仍为 `selected=pause`，没有勾选项残留，`#am-campaign-batch-plus-menu=false`。
- 安全核对：临时 XHR/fetch 守卫记录本轮没有 blocked 写请求；未触发 `/campaign/delete`、`/campaign/create`、`/campaign/batch`、`/solution/addList`、`/solution/copy`、`/solution/save`、`/solution/update`、`/item/add`、`/item/update`、`/campaign/update`、`/campaign/save` 等非本次创建/删除/保存类写入口。提交完成后已恢复临时 XHR/fetch 守卫。
- 截图：`tasks/native-batch-daily-budget-real-submit-1001-2026-05-30.png`。
- 额外只读核对：尝试手动 `fetch /campaign/horizontal/findPage.json` 时因未复用正确 csrf，返回 `bizLogin csrf检查未通过`；该失败不影响本次结论，因为官方预算提交接口已返回成功，且官方列表刷新后页面显示 `1,001元`。

## 结果复盘
- 结论：在修复后的插件运行态下，原生“批量计划设置 -> 批量修改每日预算”对暂停计划真实提交已生效；本次不是 `批量+` 拦截导致，`批量+` 菜单全程未打开。
- 结果：暂停计划 `81075718778 / E7pro_自定义_1` 的每日预算已由 `1,000元` 改为 `1,001元`，服务端接口和页面列表均验证成功。
- 风险：这是用户明确授权的真实预算修改；虽只增加 1 元且计划处于暂停状态，但账户中该计划预算已实际变更。若需要回到原值，可再次用同一路径把该暂停计划预算改回 `1,000元`。
- 回滚方式：只针对同一暂停计划 `81075718778` 使用原生“批量修改每日预算”，把日预算填回 `1000` 并确认；不要使用 `批量+` 或其它批量动作。

---

# TODO - 2026-05-30 原生批量计划设置不生效与批量+拦截排查

## 需求规格
- 目标：排查原生网页中“批量计划设置”里的功能批量提交后不生效，确认是否被插件 `批量+` 功能拦截、覆盖或误阻断。
- 范围：只排查原生 `批量计划设置` 与插件 `批量+` 的事件、DOM、网络请求和提交前链路关系；不真实提交原生批量修改，不点击会真正保存/生效的确认按钮；Chrome 验证只能选择暂停计划作为测试对象。
- 成功标准：明确给出“是否由 `批量+` 拦截导致”的证据；若是插件问题，修复且证明不再影响原生入口；若不是插件问题，给出原生提交链路未被插件触碰的运行态证据和后续可查方向。

## 执行计划（可核对）
- [x] 尝试并行启动 3 个子代理做代码拦截审计、原生链路/验证边界审计、提交范围与风险审计；当前会话达到 agent thread limit，主线程承接排查。
- [x] 本地主线程定位 `批量+` 注入、菜单、确认弹窗、请求拦截/桥接代码，确认是否监听或覆盖原生 `批量计划设置`。
- [x] 基于用户补充“关闭插件后生效”，扩展排查插件全局补丁，重点检查 `预算破限` 对原生每日预算 Magix 组件 `check()/isValid/rules.min` 的副作用。
- [x] 用 Chrome DevTools MCP 在真实 `one.alimama.com` 页面安装写请求守卫，只选择暂停计划，打开原生 `批量计划设置` 并验证提交前链路；不点击真实提交确认。
- [x] 修复 `预算破限` 全局 Magix 校验补丁：保留官方 `check()/isValid()` 原生执行副作用，只放行预算下限类失败；补充回归测试。
- [x] 跑相关测试/构建/语法/空白检查，回填验证记录与复盘。
- [ ] 完成后按用户规则交给子代理执行中文 commit + push；本轮再次尝试仍被 `agent thread limit reached` 阻塞，且工作区有多段历史 UI 迁移脏改，暂不由主线程混合提交。

## 高层操作摘要
- 用户关心的是原生“批量计划设置”批量提交不生效是否被插件 `批量+` 拦截。本轮排查会把原生入口与插件自有入口严格区分。
- 安全边界：真实页面只允许选择暂停计划做测试对象；所有保存、提交、修改、删除、开启/暂停等写接口均通过守卫拦截或停在确认前，不做真实提交。
- 子代理启动因当前会话达到 agent thread limit 未能创建；主线程继续推进并记录阻塞，不因子代理不可用阻塞缺陷修复。
- 用户补充关键事实：原生“批量修改每日预算”点击修改后提交不生效，但关闭插件后生效。排查结论需从“是否 `批量+` 拦截”升级为“插件开启后的哪条运行态路径影响原生预算提交”。
- 代码初查：`批量+` 自身点击拦截只命中 `[data-am-campaign-batch-plus-action]` 与 `[data-am-campaign-batch-plus="1"]`，原生菜单 host 被排除；更高风险候选是 `src/main-assistant/budget-frontend-limit-bypass.js` 的 `预算破限` 通用 Magix patch，会覆盖含 `dayBudget` 的原生组件 `check()` 为恒成功，可能跳过官方批量预算弹窗在 `check()` 内做的取值同步。
- 根因修复：`预算破限` 不再把通用 Magix 组件的 `check()` 直接替换成恒成功，也不再把函数型 `isValid()` 直接替换成 `true`；新逻辑先调用官方原始实现，保留原生弹窗取值同步/校验副作用，再仅对明确的预算下限类错误结果做通过归一化。`check()` 保持对象结果形态，`isValid()` 对预算下限失败保持布尔通过语义，避免布尔调用方拿到 truthy 对象。

## 验证记录
- 代码审计：`src/main-assistant/campaign-id-quick-entry.js` 的 `批量+` 点击拦截只命中 `[data-am-campaign-batch-plus-action]` 和 `[data-am-campaign-batch-plus="1"]`；`findNativeBatchPlanSettingHost()`、`findNativeBatchPlanMenuItem()` 和批量+克隆逻辑均排除 `.am-campaign-batch-plus-wrap` / `#am-campaign-batch-plus-menu`，没有覆盖原生 `批量计划设置` 菜单。
- 修复文件：`src/main-assistant/budget-frontend-limit-bypass.js`；新增回归：`tests/budget-frontend-limit-bypass.test.mjs`，断言通用预算破限必须保存并调用原生 `check()` / `isValid()`，禁止回退到恒成功短路，并要求函数型 `isValid()` 使用布尔归一化而不是复用 `check()` 的对象归一化。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 和 `dist/extension/page.bundle.js`。
- `node --test tests/budget-frontend-limit-bypass.test.mjs tests/campaign-batch-plus-quick-entry.test.mjs`：通过，14/14；同时覆盖预算破限新约束和 `批量+` 不继承/不污染原生入口的既有结构断言。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `git diff --check -- src/main-assistant/budget-frontend-limit-bypass.js tests/budget-frontend-limit-bypass.test.mjs tasks/todo.md tasks/lessons.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过。
- Chrome DevTools MCP：真实 `https://one.alimama.com/index.html#!/manage/search?orderField=charge&orderBy=desc` 页面，强制刷新后运行态已注入预算补丁，`预算破限` 复现条件为开启状态：`window.__AM_BUDGET_FRONTEND_UNLOCK__=true`、`window.__AM_BUDGET_FRONTEND_UNLOCK_REFRESH__` 可用。
- Chrome 安全验证：安装写请求守卫拦截 `/campaign/updatePart.json`、`/campaign/delete.json`、`/campaign/create.json`、`/campaign/batch*.json`、`/solution/addList.json`、`/solution/copy.json`、`/solution/save/update.json`、`/item/add/update.json` 等写接口；只选择状态 `selected=pause` 的暂停计划 `E7pro_自定义_1 / ID 81075718778`，未选择在投计划。
- Chrome 原生链路验证：打开原生 `批量计划设置` host `mx_1431`，`batchPlusMenuOpen=false`；可见原生菜单项在 `popmenu_mx_1431`，第一项为官方 `batchChangeDmcType / 批量修改每日预算`，点击后打开官方弹窗 `wrapper_dlg_12229` / `dlg_12229`，未出现 `#am-campaign-batch-plus-menu`，未触发任何写请求。
- Chrome 运行态补丁验证：官方每日预算弹窗内 `cnt_dlg_12229` 的 Magix view 同时具备 `checkHasOriginalApply=true` 和 `isValidHasOriginalApply=true`，`checkOldShortCircuit=false`、`isValidOldShortCircuit=false`；聚焦检查 `oldShortCircuitCount=0`、`originalApplyCount=2`，且 `isValidUsesBooleanNormalize=true`、`isValidUsesCheckNormalize=false`。截图见 `tasks/native-batch-daily-budget-dialog-guarded-bool-normalize-2026-05-30.png`。
- Chrome 收尾：通过官方“取消”关闭弹窗，确认 `stillOpen=false`，写请求记录 `beforeWrites=[]`、`afterWrites=[]`；随后取消勾选暂停计划，`checked=false`。

## 结果复盘
- 结论：不是 `批量+` 自有菜单/点击拦截导致；用户反馈的“关闭插件后生效”与 `预算破限` 全局 Magix 校验补丁更吻合。旧补丁把原生预算组件 `check()` / `isValid()` 直接短路，可能跳过官方“批量修改每日预算”弹窗在校验阶段完成的取值同步，导致点击提交后服务端没有拿到正确修改语义或页面回写不生效。
- 结果：已把补丁改为“先执行官方原生校验，保留内部同步副作用；只放行预算下限类失败”。`check()` 的预算下限失败归一化为成功对象，`isValid()` 的预算下限失败归一化为布尔 `true`。这保留了预算破限的目标，同时降低对原生批量预算弹窗的污染。
- 风险：本轮严格遵守“不真实提交”，没有点击最终“确定/修改”触发服务端更新；因此浏览器验证证明到提交前链路和运行态补丁形态，不能宣称已完成真实服务端落库验证。若后续需要闭环生效结果，必须由用户明确授权，并继续仅使用暂停计划、先启用写请求守卫或做受控提交。
- 回滚方式：回退 `src/main-assistant/budget-frontend-limit-bypass.js`、`tests/budget-frontend-limit-bypass.test.mjs` 及构建产物即可；不涉及 `批量+` 菜单业务逻辑回滚。

---

# TODO - 2026-05-30 组建计划主弹窗窗口外白色玻璃最新复核

## 需求规格
- 目标：响应用户最新再次强调“弹窗‘组建计划’窗口外的增加，白色玻璃渐变，类似组建计划里的增加商品的弹窗外的背景，专注现在弹窗里的内容”，只复核主向导窗口外层遮罩，不改主面板本体。
- 范围：只看 `#am-wxt-keyword-overlay:not(.item-picker-open)` 外层背景、`#am-wxt-keyword-modal` 主面板背景和关闭后的残留/写请求；不继续推进 `批量+`、移除按钮、矩阵、批量编辑、提交创建、保存或任何真实请求链路。
- 成功标准：真实页面运行态显示窗口外为白色玻璃渐变 `rgba(255,255,255,0.78) -> rgba(255,255,255,0.48)`，具备 `blur(8px) saturate(1.15)`；主面板仍是轻透明玻璃 `rgba(255,255,255,0.6) -> rgba(255,255,255,0.2)`；关闭后无弹层残留且无创建/保存/删除/提交类请求。

## 执行计划（可核对）
- [x] 回顾 `tasks/lessons.md` 中“窗口外/弹窗外”相关教训，确认本轮目标是 overlay，不是主面板。
- [x] 核对源码最终选择器仍是 `#am-wxt-keyword-overlay:not(.item-picker-open)`，且主面板没有被强白化。
- [x] 用 Chrome DevTools MCP 在真实 `one.alimama.com` 页面加写请求守卫，只读打开组建计划主弹窗并读取 computed style。
- [x] 截图、关闭弹窗、确认无写请求和无残留。
- [x] 运行组建计划外壳专项测试，并回填审计记录。

## 高层操作摘要
- 最新请求再次聚焦“组建计划窗口外”，因此本轮停止继续推进顶部 `批量+` 切片，只复核主向导外层遮罩。
- 源码和运行态均已确认目标层级正确：白色玻璃在 `#am-wxt-keyword-overlay:not(.item-picker-open)`，不是 `#am-wxt-keyword-modal`；主面板保留用户此前要求的轻透明玻璃。
- 运行态已经符合用户要求，本轮不新增重复 CSS 覆盖，避免把已符合的主面板扰动成厚白卡片。

## 验证记录
- Chrome DevTools MCP：真实 `https://one.alimama.com/index.html#!/manage/search?orderField=charge&orderBy=desc` 页面，已安装只读写请求守卫；通过 `window.__AM_WXT_KEYWORD_API__.openWizard()` 只打开组建计划主弹窗，未点击 `补齐5维`、`生成计划`、`清空`、`批量创建`、`提交创建`、`保存并关闭` 或任何真实创建/保存入口。
- 运行态确认 `#am-wxt-keyword-overlay.open` 为 `display:flex`，窗口外 computed background 为 `linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.48))`，`backdrop-filter: blur(8px) saturate(1.15)`，且最后注入 CSS 块命中 `#am-wxt-keyword-overlay:not(.item-picker-open)`。
- 同时确认 `#am-wxt-keyword-modal` 主面板本体仍为轻透明玻璃：`linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2))`，边框 `rgba(255, 255, 255, 0.6)`，阴影 `rgba(31, 38, 135, 0.15) 0px 8px 32px 0px`，面板 blur 为 `blur(20px) saturate(1.4)`。
- 截图见 `tasks/ui-audit-keyword-main-overlay-white-glass-latest-2026-05-30.png`。
- 验收后点击组建计划关闭按钮，确认 `overlayOpen=false`、`overlayDisplay=none`、`modalVisible=false`、`itemMaskExists=false`、`sceneMaskExists=false`；守卫记录 `forbiddenCount=0`，未出现创建/复制/更新/保存/删除/提交类请求。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs`：通过，22/22；继续覆盖主向导窗口外白色玻璃渐变、`item-picker-open` 透明隔离和主面板本体不强白化。

## 结果复盘
- 结果：当前“组建计划”弹窗窗口外已经是白色玻璃渐变，效果与添加商品弹窗外层一致，能够聚焦现在弹窗里的内容；主面板本体没有变成厚白背景。
- 风险：本轮只做运行态复核与记录补充，不改变业务源码；如果用户看到旧灰底，优先判断浏览器运行态未刷新、安装包未同步或页面仍加载旧脚本。
- 回滚方式：本轮新增的是记录与截图；如后续要取消白色玻璃，应只回退 `#am-wxt-keyword-overlay:not(.item-picker-open)` 最终覆盖块。

---

# TODO - 2026-05-30 批量+确认弹窗白色玻璃遮罩与焦点循环

## 需求规格
- 目标：继续按 UI 统一规范迁移 `批量+` 页面，把插件自有二次确认弹窗的外层深灰遮罩改为白色玻璃渐变，并补齐正文关联与 Tab/Shift+Tab 焦点循环。
- 范围：只改 `#am-campaign-batch-confirm-popup` 自有确认弹窗的遮罩视觉、`aria-describedby` 和键盘焦点约束，以及对应专项测试/任务记录；不改 `批量+` 原生同构按钮、菜单项、选中计划识别、状态更新、删除、屏蔽人群、官方弹窗复用或任何真实提交接口。
- 成功标准：确认弹窗外层 computed background 为白色玻璃渐变，不再是 `rgba(15, 23, 42, 0.42)` 深灰遮罩；dialog 同时具备 `aria-labelledby` 和 `aria-describedby`；Tab/Shift+Tab 被约束在弹窗按钮内循环；Chrome 验收只打开确认弹窗并取消/关闭，未点击确认写操作且无写接口请求。

## 执行计划（可核对）
- [ ] 复核现有 `批量+` 确认弹窗源码、样式和专项测试，确认本轮不碰真实批量业务逻辑。
- [ ] 并行收集 3 个子代理只读审计建议，重点关注遮罩、ARIA、焦点循环和 Chrome 验收边界。
- [ ] 修改确认弹窗 DOM/键盘处理和外层遮罩样式，并更新专项断言。
- [ ] 运行专项测试、构建同步检查、语法检查、extension bundle 检查和空白检查。
- [ ] 用 Chrome DevTools MCP 在真实 `one.alimama.com` 只读打开确认弹窗，验证样式/焦点/关闭/无写请求。
- [ ] 回填审计记录和复盘；完成后按用户最新要求交给子代理做中文 commit + push。

## 高层操作摘要
- 现状：`批量+` 菜单与确认卡片已迁移到统一 token，但 `#am-campaign-batch-confirm-popup` 外层仍是深灰 `rgba(15, 23, 42, 0.42)`，和当前白色玻璃弹层规范不一致。
- 本轮只处理插件自有确认弹窗的 UI/可访问性，不点击确认按钮，也不改变 `campaign/updatePart.json`、`campaign/delete.json`、屏蔽人群或官方抽屉链路。

## 验证记录
- 待执行。

## 结果复盘
- 待回填。

---

# TODO - 2026-05-30 组建计划主弹窗窗口外白色玻璃再验收与加固

## 需求规格
- 目标：响应用户再次强调“弹窗‘组建计划’窗口外的增加白色玻璃渐变，类似组建计划里的增加商品弹窗外背景”，只聚焦主向导窗口外层遮罩，让弹窗外视觉更白、更轻、更能聚焦当前弹窗内容。
- 范围：只核对并必要加固 `#am-wxt-keyword-overlay:not(.item-picker-open)` 的外层背景和 blur；保留 `#am-wxt-keyword-modal` 主面板本体上一版轻透明玻璃，不改添加商品二级弹窗、批量编辑、矩阵、提交创建、保存或任何真实网络链路。
- 成功标准：源码/产物最后生效 CSS 和真实页面 computed style 均显示主向导窗口外为白色玻璃渐变，且 `item-picker-open` 时不叠加第二层背景；Chrome 验收期间不触发创建/保存/提交/删除类请求。

## 执行计划（可核对）
- [x] 复核源码、测试和产物中最后生效的 overlay/modal CSS 规则，确认目标 selector 正确且主面板未被强白化。
- [x] 用 Chrome DevTools MCP 在真实 `one.alimama.com` 只读打开组建计划主弹窗，读取窗口外背景、blur、主面板背景并截图。
- [x] 若运行态仍不是用户要的白色玻璃，做最小 CSS 加固并构建同步；否则只记录验收结论。
- [x] 运行相关专项测试/语法检查/构建同步检查，并回填验证记录、审计表和复盘。

## 高层操作摘要
- 最新用户再次点名“窗口外/弹窗外”，本轮不切到 `批量+` 或其它页面；验证对象是 `#am-wxt-keyword-overlay:not(.item-picker-open)`，不是主面板 `#am-wxt-keyword-modal`。
- 当前源码底部已有白色玻璃覆盖块，但需要用真实页面确认运行态是否刷新命中；如果 Chrome 仍看到灰底，优先处理最终覆盖强度或构建/注入同步。
- 已确认最后生效 CSS 块与真实页面 computed style 均命中白色玻璃窗口外背景；本轮不重复修改源码，避免扰动用户已要求保留的主面板轻透明玻璃背景。

## 验证记录
- Chrome DevTools MCP 运行态再验收：真实 `https://one.alimama.com/index.html#!/manage/display?orderField=charge&orderBy=desc` 页面，通过 `window.__AM_WXT_KEYWORD_API__.openWizard()` 只打开组建计划主弹窗；未点击 `补齐5维`、`生成计划`、`清空`、`批量创建`、`提交创建`、`保存并关闭` 或任何真实创建/保存入口。
- 运行态确认 `#am-wxt-keyword-overlay.open` 类名为 `open`、`display:flex`，窗口外 computed background 为 `linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.48))`，`backdrop-filter: blur(8px) saturate(1.15)`；最后注入的 CSS 块为 `#am-wxt-keyword-overlay:not(.item-picker-open)` 白色玻璃覆盖，后续 `#am-wxt-keyword-overlay.item-picker-open` 仍为透明隔离。
- 同时确认 `#am-wxt-keyword-modal` 主面板本体仍是用户要求的轻透明玻璃：`linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2))`，边框 `rgba(255, 255, 255, 0.6)`，阴影 `rgba(31, 38, 135, 0.15) 0px 8px 32px 0px`，面板 blur 为 `blur(20px) saturate(1.4)`。
- 截图见 `tasks/ui-audit-keyword-main-overlay-white-glass-rerun-2026-05-30.png`。
- 验收后点击组建计划关闭按钮，确认 `overlayOpen=false`、`overlayDisplay=none`、`modalVisible=false`、`itemMaskExists=false`、`sceneMaskExists=false`；打开和关闭基线后均未出现 `/solution/addList`、`/solution/copy`、`/campaign/update`、`/campaign/create`、`/campaign/batch`、`/campaign/delete`、`/item/add`、`/item/update`、`/solution/save`、`/solution/update` 或 `/campaign/updatePart`。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs`：通过，22/22；继续覆盖主向导窗口外白色玻璃渐变、`item-picker-open` 透明隔离和主面板本体不强白化。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。

## 结果复盘
- 结果：当前“组建计划”主弹窗窗口外已经是白色玻璃渐变，视觉层级与添加商品弹窗外层一致，能聚焦当前弹窗内容；主面板本体没有被再次白化。
- 决策：不再新增重复 CSS 覆盖；继续保留 `#am-wxt-keyword-overlay:not(.item-picker-open)` 作为外层背景事实源，避免把已符合的主面板背景扰动回强白卡片。
- 风险：本轮是运行态再验收与记录更新，未改业务源码；后续若用户看到旧灰底，优先判断浏览器运行态是否未刷新或安装包是否未同步。
- 回滚方式：如需取消外层白色玻璃，只回退 `#am-wxt-keyword-overlay:not(.item-picker-open)` 最终覆盖块；本轮新增的是任务/审计记录和截图，不涉及业务逻辑回滚。

---

# TODO - 2026-05-30 组建计划移除类文字按钮图标化收口

## 需求规格
- 目标：继续按 UI 统一规范迁移组建计划，把当前半成品切片收口：`移除`、`取消添加`、`全部移除` 等删除动作统一为共享 close 图标按钮，补齐 `type="button"`、`aria-label`、`title`、浅玻璃 token 样式和可见 `focus-visible`。
- 范围：只改组建计划人群/商品/趋势主题选择相关的移除类动作表达与对应测试；不改添加、确定、取消、清空维度、批量创建、提交创建、保存并关闭、请求构建或任何真实网络链路。
- 成功标准：源码中本切片目标动作不再以裸文字按钮或 `href="javascript:;"` 链接作为删除动作主体；专项测试、构建、构建同步检查、语法检查、空白检查通过；Chrome DevTools MCP 在真实 `one.alimama.com` 只读验收至少覆盖主向导已添加商品/人群，以及一个场景二级弹窗移除按钮，且未触发创建/保存/删除/提交请求。

## 执行计划（可核对）
- [x] 基于 3 个子代理审计结果，确认本轮只收口组建计划移除类按钮，不切到批量+或算法护航。
- [x] 补齐源码遗漏：趋势主题移除按钮样式覆盖、趋势主题/商品场景弹窗移除类按钮测试断言。
- [x] 构建同步产物，并运行相关专项测试、构建检查、语法检查和空白检查。
- [x] 用 Chrome DevTools MCP 在真实页面只读打开目标弹窗读取样式并截图；不点击确定、保存、提交或真实创建入口。
- [x] 回填验证记录、审计表、风险和复盘。

## 高层操作摘要
- 子代理审计一致认为当前优先级是收口组建计划人群/商品选择类移除动作；批量+确认弹窗和算法护航入口反馈作为后续切片。
- 当前源码已完成大部分替换，但趋势主题选中态按钮受 `.am-wxt-scene-trend-association-op` 后置规则影响，可能覆盖共享图标按钮 24px 圆形样式；同时趋势主题和商品场景弹窗缺少专项断言。
- 已完成：主向导已添加商品/人群、目标人群行、人群推荐/已选、新增人群候选/已选/全部移除、趋势主题全部移除/联想选中态、场景商品已选移除均迁移为共享 close SVG 图标按钮；趋势主题选中态增加后置圆形 token 覆盖，避免被旧操作列样式压回文字按钮形态。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/keyword-item-picker-popup.test.mjs tests/keyword-custom-popup-config.test.mjs tests/crowd-custom-native-parity-ui.test.mjs tests/keyword-trend-theme-setting.test.mjs`：通过，50/50；新增/更新断言覆盖主向导已添加商品/人群、人群弹窗候选/已选、新增人群全部移除/取消添加/已选移除、趋势主题全部移除/联想选中态、添加商品弹窗已选商品移除，以及共享 `am-wxt-remove-icon-btn` token/focus 样式。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `rg -n "href=\"javascript:;\" data-scene-popup-(trend-clear|crowd-native-(clear|remove-selected))|data-scene-popup-(crowd|item)-remove=\"[^\"]*\"[\\s\\S]{0,120}>移除</button>|data-scene-popup-crowd-native-remove=\"[^\"]*\"[\\s\\S]{0,140}>取消添加</button>|>全部移除</a>" src/optimizer/keyword-plan-api/wizard-scene-config tests`：无匹配，确认本切片目标回退模式不存在。
- `git diff --check -- src/optimizer/keyword-plan-api/wizard-scene-config/item-selection.js src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-crowd-popup.js src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-core.js src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-item-adzone-popup.js src/optimizer/keyword-plan-api/wizard-style-and-state/style.js tests/keyword-item-picker-popup.test.mjs tests/keyword-custom-popup-config.test.mjs tests/crowd-custom-native-parity-ui.test.mjs tests/keyword-trend-theme-setting.test.mjs tasks/todo.md tasks/lessons.md tasks/ui-gap-audit-2026-05-29.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/packages/alimama-helper-pro.meta.js dist/extension/page.bundle.js dist/extension/content.js dist/extension/background.js dist/extension/manifest.json`：通过。
- Chrome DevTools MCP 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?orderField=charge&orderBy=desc` 人群推广页，页面 API 已就绪；通过 `window.__AM_WXT_KEYWORD_API__.openWizard()` 只打开组建计划主向导，确认运行态已注入 `am-wxt-remove-icon-btn` 共享样式和 `.am-wxt-scene-trend-association-op.am-wxt-remove-icon-btn` 趋势主题后置覆盖。主向导已添加商品移除按钮为 `BUTTON type="button"`、文本为空、含 close SVG、`aria-label="移除商品：..."`、`title="移除商品"`。
- Chrome 继续只读验收：进入计划详情后仅在向导内存中切到 `人群推广 / 自定义推广`，未点击保存；打开 `添加商品` 二级弹窗，已添加商品移除按钮为 `am-wxt-remove-icon-btn am-wxt-scene-item-remove-btn`、24px 圆形、背景 `rgba(255, 255, 255, 0.25)`、边框 `rgba(255, 255, 255, 0.4)`、文本为空、含 close SVG，弹窗内无文字 `移除/取消添加/全部移除` 按钮或 `javascript:` 链接。截图见 `tasks/ui-audit-keyword-remove-icon-item-popup-chrome-2026-05-30.png`。
- Chrome 继续只读验收：关闭商品弹窗后打开 `手动添加人群` 弹窗，`全部移除` 为 `am-wxt-remove-icon-btn am-wxt-scene-crowd-native-clear-btn`、24px 圆形、背景 `rgba(255, 255, 255, 0.25)`、边框 `rgba(255, 255, 255, 0.4)`、文本为空、含 close SVG，弹窗内无文字 `移除/取消添加/全部移除` 按钮或 `javascript:` 链接。截图见 `tasks/ui-audit-keyword-remove-icon-crowd-popup-chrome-2026-05-30.png`。
- 验收后只通过取消/Esc/关闭退出二级弹窗、详情和主向导，最终确认 `sceneMaskExists=false`、`itemMaskExists=false`、`detailVisible=false`、`overlayOpen=false`、`overlayDisplay=none`、`modalVisible=false`；performance resource 基线后未出现 `/solution/addList`、`/solution/copy`、`/campaign/update`、`/campaign/create`、`/campaign/batch`、`/campaign/delete`、`/item/add`、`/item/update`、`/solution/save`、`/solution/update` 或 `/campaign/updatePart`。

## 结果复盘
- 结果：完成组建计划移除类文字按钮图标化收口；本切片目标动作已统一为共享 close 图标按钮，保留添加/确定/取消/保存/提交等业务链路不变。
- 风险：Chrome 实测的当前计划详情需要先在向导内存中切换到 `人群推广 / 自定义推广` 才能展示商品/人群二级弹窗入口；该切换未保存、未提交，仅用于本地 UI 验收。趋势主题联想选中态由专项测试覆盖，当前真实页面没有进入趋势明星计划详情触发该弹窗。
- 回滚方式：还原本次修改的 `wizard-scene-config` 渲染文件、`wizard-style-and-state/style.js`、专项测试和构建产物即可；不涉及请求构建或提交链路回滚。

---

# TODO - 2026-05-30 组建计划主弹窗窗口外白色玻璃复核

## 需求规格
- 目标：按用户最新强调“弹窗‘组建计划’窗口外的增加，白色玻璃渐变，类似组建计划里的增加商品的弹窗外的背景，专注现在弹窗里的内容”，复核并确保主向导弹窗窗口外层 `#am-wxt-keyword-overlay:not(.item-picker-open)` 命中白色玻璃渐变，用于聚焦当前“组建计划”弹窗内容。
- 范围：只处理/复核主向导窗口外 overlay 背景、主面板本体背景不强白化、二级 `添加商品` 打开时 overlay 透明隔离；不继续推进当前未完成的移除按钮图标化切片，不改计划生成、批量创建、提交、保存、清空或任何真实网络链路。
- 成功标准：源码和运行态最后生效规则显示主向导窗口外背景为 `rgba(255,255,255,0.78) -> rgba(255,255,255,0.48)` 白色玻璃渐变，具备 `blur(8px) saturate(1.15)`；`#am-wxt-keyword-modal` 仍保持上一版轻透明玻璃 `rgba(255,255,255,0.6) -> rgba(255,255,255,0.2)`；Chrome DevTools MCP 真实页面只读验收未触发创建/保存/删除/提交请求。

## 执行计划（可核对）
- [x] 暂停顶部未完成的移除按钮图标化切片，确认本轮只复核组建计划主弹窗窗口外背景。
- [x] 核对源码、根 userscript 和 extension 产物中最后生效的 overlay / modal CSS 规则。
- [x] 运行相关专项静态测试和语法检查；构建同步检查如受未完成脏改影响，需明确记录原因。
- [x] 用 Chrome DevTools MCP 在真实 `one.alimama.com` 页面只读打开组建计划，读取 overlay / modal computed style 并截图。
- [x] 回填验证记录、风险和复盘。

## 高层操作摘要
- 用户最新语义再次指向“弹窗外/窗口外”，不是主面板本体，也不是批量编辑、复制计划或移除按钮；因此本轮只看 `#am-wxt-keyword-overlay:not(.item-picker-open)`。
- 当前源码已有最终覆盖块：主向导 overlay 白色玻璃渐变，`item-picker-open` 透明隔离，主面板 `#am-wxt-keyword-modal` 保持轻透明玻璃；接下来用测试和真实页面确认运行态是否已刷新命中。
- 复核未改业务源码：当前工作区仍保留上一段未完成的“移除类按钮图标化”脏改，本轮只新增任务/教训记录和运行态截图，不把该未完成切片混入构建产物。

## 验证记录
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs`：通过，22/22；其中 `组建计划主弹窗外壳对齐统一 UI 规范` 继续断言 `#am-wxt-keyword-overlay:not(.item-picker-open)` 白色玻璃渐变、`item-picker-open` 透明隔离，以及 `#am-wxt-keyword-modal` 不回到强白背景。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `git diff --check -- tasks/todo.md tasks/lessons.md src/optimizer/keyword-plan-api/wizard-style-and-state/style.js tests/keyword-home-strategy-batch-actions.test.mjs 阿里妈妈多合一助手.js dist/extension/page.bundle.js`：通过。
- Chrome DevTools MCP 运行态复核：真实 `https://one.alimama.com/index.html#!/manage/display?orderField=charge&orderBy=desc&offset=0&searchKey=campaignNameLike&searchValue=AI` 人群推广页，页面 API 已就绪；通过 `window.__AM_WXT_KEYWORD_API__.openWizard()` 只打开组建计划主弹窗，未点击 `补齐5维`、`生成计划`、`清空`、`批量创建`、`提交创建`、`保存并关闭` 或任何真实创建/保存入口。运行态确认 `#am-wxt-keyword-overlay.open` 为 `display:flex`，窗口外背景为 `linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.48))`，`backdrop-filter: blur(8px) saturate(1.15)`；`#am-wxt-keyword-modal` 仍保持轻透明玻璃 `linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2))`，边框 `rgba(255, 255, 255, 0.6)`，阴影 `rgba(31, 38, 135, 0.15) 0px 8px 32px 0px`，面板 blur 为 `blur(20px) saturate(1.4)`。截图见 `tasks/ui-audit-keyword-main-overlay-white-glass-recheck-2026-05-30.png`。
- 验收后点击组建计划关闭按钮，确认 `overlayOpen=false`、`overlayDisplay=none`、`modalVisible=false`、`itemMaskExists=false`、`sceneMaskExists=false`；performance resource 基线后未出现 `/solution/addList`、`/solution/copy`、`/campaign/update`、`/campaign/create`、`/campaign/batch`、`/campaign/delete`、`/item/add`、`/item/update`、`/solution/save` 或 `/solution/update`。
- `npm run build:check` 未在本次复核中执行：当前工作区存在上一段未完成的移除按钮图标化源码/测试脏改，运行构建同步检查会把未完成切片纳入判断；本轮未改业务源码，已用根 userscript/extension 语法、专项断言和真实页面 computed style 证明窗口外背景生效。

## 结果复盘
- 结果：组建计划主弹窗窗口外白色玻璃渐变已在真实页面复核生效，视觉聚焦当前弹窗内容；主面板本体仍保持用户要求的上一版轻透明玻璃。
- 风险：本轮只复核并记录最新用户指定对象，不继续推进未完成的移除按钮图标化切片；未触发任何创建、保存、删除、提交或扣费相关请求。
- 回滚方式：如需取消窗口外白色玻璃，只需回退 `#am-wxt-keyword-overlay:not(.item-picker-open)` 最终覆盖块到透明背景；当前按用户最新偏好保留白色玻璃渐变。

---

# TODO - 2026-05-30 组建计划移除类文字按钮图标化

## 需求规格
- 目标：继续按 UI 统一规范迁移组建计划，把仍以文字呈现的 `移除`、`取消添加`、`全部移除` 等配置删除动作收敛为共享 close 图标按钮，并补齐可访问名称、title 和可见 focus。
- 范围：只改组建计划人群/商品选择相关的局部按钮表达与样式断言，包括已添加商品、人群推荐候选/已选、二级新增人群候选/已选/全部移除、目标人群行；不改添加、上移、下移、批量溢价、清空、确定/取消、保存、提交创建、请求构建或任何真实网络链路。
- 成功标准：目标按钮均为 `button type="button"`，包含共享 `renderAmIcon('close')`，无裸文字 `移除/取消添加/全部移除` 作为动作主体；具备稳定 `aria-label` / `title`；局部样式使用 `--am26-*` 浅玻璃 token 与可见 `focus-visible`；专项测试、构建检查、语法检查、空白检查和 Chrome DevTools MCP 真实页面只读验收完成。

## 执行计划（可核对）
- [ ] 回顾 UI/图标规范、审计表和子代理定位结果，确认本轮只处理组建计划移除类按钮。
- [ ] 将剩余人群/商品选择中的移除类文字动作替换为共享 close 图标按钮。
- [ ] 增加局部 token 样式和专项静态断言，防止回退为文字按钮或 `href="javascript:;"` 链接。
- [ ] 构建同步产物，并运行组建计划相关专项测试、构建检查、语法检查和空白检查。
- [ ] 用 Chrome DevTools MCP 在真实 `one.alimama.com` 页面只读打开相关弹窗验收，不点击确定、保存、提交或真实创建入口。
- [ ] 回填验证记录、审计表、风险和复盘。

## 高层操作摘要
- 子代理只读审计指出剩余缺口集中在组建计划人群/商品选择类移除动作：`item-selection.js` 的已添加商品/人群移除，`render-scene-dynamic-crowd-popup.js` 的人群推荐与新增人群弹窗移除/取消添加/全部移除，`render-scene-dynamic-core.js` 的目标人群行移除。
- 本轮实现只改变动作按钮的可见表达和可访问性，不改变选中列表、溢价输入、添加/清空/确定/取消逻辑。

## 验证记录
- 待执行。

## 结果复盘
- 待回填。

---

# TODO - 2026-05-30 组建计划矩阵页维度选择器 Chrome 验收闭环

## 需求规格
- 目标：收尾当前已实现的组建计划矩阵页维度选择器 token 收敛切片，完成真实 `one.alimama.com` 只读验收和审计记录，确保矩阵页维度类型下拉、维度值下拉、目标成本/ROI 包下拉和原生多选兜底在运行态命中统一 `--am26-*` 浅玻璃样式。
- 范围：只做已实现 CSS/断言的验证闭环、必要构建检查和记录回填；不改矩阵维度增删、预设应用、补齐推荐、清空维度、生成计划、请求构建、计划物化、提交创建或真实网络链路。
- 成功标准：专项测试和构建检查通过；Chrome DevTools MCP 在真实页面打开 `组建计划 -> 矩阵页`，只展开一个维度选择器读取 computed style 并截图；运行态确认触发器、下拉面板、选项、箭头和原生兜底不再由旧白底/灰边/旧蓝紫色作为最终样式事实源；验收期间未触发创建、复制、保存、删除或提交类请求。

## 执行计划（可核对）
- [x] 回顾 UI/图标规范、审计表和当前矩阵页维度选择器源码/测试，确认本轮是验证闭环，不扩大源码改动。
- [x] 运行矩阵页相关专项测试、构建检查、语法检查和空白检查。
- [x] 用 Chrome DevTools MCP 在真实 `one.alimama.com` 页面只打开 `组建计划 -> 矩阵页`，展开一个维度选择器并读取样式。
- [x] 保存运行态截图，确认未出现创建/保存/删除/提交类请求。
- [x] 回填验证记录、审计表、风险和复盘。

## 高层操作摘要
- 当前源码已有矩阵页维度选择器后置最终覆盖：触发器、hover/open/disabled、胶囊型维度类型、CSS chevron、下拉面板、选项、空状态、趋势主题新增按钮和原生 select 兜底均使用 `--am26-*` 或统一弱品牌色。
- `tests/matrix-plan-config.test.mjs` 已有 `矩阵页维度选择器收敛到统一 token` 断言，读取最后有效 CSS 块并禁止回退到 `#fff`、`#f8fafc`、`#334155`、`#64748b`、`#3354d1`、旧灰边和旧蓝紫事实源。
- 本轮重点补齐真实页面证据；验收只打开下拉并读取样式，不点击 `补齐5维`、`生成计划`、`清空维度`、`提交创建`、`批量创建` 或 `保存并关闭`。

## 验证记录
- `node --test tests/matrix-plan-config.test.mjs tests/keyword-home-strategy-batch-actions.test.mjs tests/keyword-edit-strategy-settings.test.mjs`：通过，54/54；矩阵页维度选择器最终 CSS 块断言继续覆盖触发器、hover/open/disabled、胶囊型维度类型、CSS chevron、下拉面板、选项、空状态、趋势主题新增按钮和原生 select 兜底。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `git diff --check -- src/optimizer/keyword-plan-api/wizard-style-and-state/style.js tests/matrix-plan-config.test.mjs tasks/todo.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过。
- Chrome DevTools MCP 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?orderField=charge&orderBy=desc&offset=0&searchKey=campaignNameLike&searchValue=AI` 人群推广页，页面 API 已就绪；通过 `window.__AM_WXT_KEYWORD_API__.openWizard()` 打开组建计划，只切到 `矩阵页`，未点击 `补齐5维`、`生成计划`、`清空`、`提交创建`、`批量创建`、`保存并关闭` 或任何真实创建/保存入口。由于当前矩阵页没有已有维度行，只点击本地 UI 的 `添加维度` 生成 1 条临时维度行，再展开维度类型下拉读取样式；运行态确认触发器为胶囊形态，背景 `rgba(69, 84, 229, 0.14)`、边框 `rgba(69, 84, 229, 0.42)`、文字 `rgb(29, 63, 207)`、`background-image:none`；下拉面板背景为 `linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2))`、边框 `rgba(255, 255, 255, 0.6)`、阴影 `rgba(31, 38, 135, 0.15) 0px 8px 32px 0px`、`backdrop-filter: blur(12px) saturate(1.25)`；选项文字 `rgb(80, 90, 116)`、背景透明；箭头最终 `background-image:none`，由 `::before` 8px CSS chevron 绘制；隐藏原生 select 兜底背景为 `rgba(255, 255, 255, 0.45)`、边框 `rgba(255, 255, 255, 0.4)`、文字 `rgb(27, 36, 56)`。截图见 `tasks/ui-audit-keyword-matrix-picker-token-chrome-2026-05-30.png`。
- 验收后点击临时维度行的本地 `删除维度` 按钮移除该行，并关闭主向导；确认 `remainingDimensions=0`、`overlayOpen=false`、`overlayDisplay=none`、`modalVisible=false`、`matrixPickerOpen=0`、`sceneMaskExists=false`、`itemMaskExists=false`；performance resource 基线后未出现 `/solution/addList`、`/solution/copy`、`/campaign/update`、`/campaign/create`、`/campaign/batch`、`/campaign/delete`、`/item/add`、`/item/update`、`/solution/save` 或 `/solution/update`。

## 结果复盘
- 结果：完成矩阵页维度选择器 token 收敛的 Chrome 验收闭环；运行态已证明矩阵维度类型下拉、面板、选项、箭头和原生兜底命中统一浅玻璃样式。
- 风险：本轮只补验证闭环和记录，未改业务逻辑；真实页面中临时添加的维度行已本地移除，未触发生成、清空、提交、保存或任何创建/更新/删除请求。
- 回滚方式：本轮没有新增源码改动，只需移除本次截图与任务/审计记录即可回到验收前记录状态。

---

# TODO - 2026-05-29 组建计划主弹窗窗口外白色玻璃渐变

## 需求规格
- 目标：按用户最新反馈“弹窗‘组建计划’窗口外的增加，白色玻璃渐变，类似组建计划里的增加商品的弹窗外的背景”，将主向导弹窗窗口外的 overlay 从透明背景改成白色玻璃渐变，强化当前弹窗内容聚焦。
- 范围：只改 `#am-wxt-keyword-overlay` 在主向导打开且未打开 `添加商品` 二级弹窗时的窗口外背景、blur 和专项断言；保留 `#am-wxt-keyword-modal` 主面板本体上一版轻透明玻璃背景，不改主面板内部内容区、添加商品弹窗、计划详情背板、批量编辑弹窗、矩阵配置、提交创建、保存并关闭或任何真实请求链路。
- 成功标准：主向导 `#am-wxt-keyword-overlay:not(.item-picker-open)` 最终背景为白色玻璃渐变 `rgba(255,255,255,0.78) -> rgba(255,255,255,0.48)`，并具备 `blur(8px) saturate(1.15)`；`#am-wxt-keyword-modal` 背景仍保持 `rgba(255,255,255,0.6) -> rgba(255,255,255,0.2)` 轻透明面板；`item-picker-open` 时主 overlay 不叠加第二层背景；相关测试、构建检查、语法检查、空白检查和 Chrome DevTools MCP 真实页面只读验收完成。

## 执行计划（可核对）
- [x] 回顾 UI/图标规范、审计表和用户连续修正，确认本轮只处理“组建计划”主弹窗窗口外 overlay，不改主面板本体。
- [x] 将主向导窗口外 overlay 改为与 `添加商品` 弹窗外层接近的白色玻璃渐变，并保留 `item-picker-open` 透明隔离。
- [x] 更新专项断言，锁定主向导 overlay 白色玻璃渐变，同时防止主面板本体被再次强白化。
- [x] 构建同步产物，并运行组建计划相关专项测试、构建检查、语法检查和空白检查。
- [x] 用 Chrome DevTools MCP 在真实 `one.alimama.com` 页面只打开 `组建计划` 主弹窗读取窗口外背景并截图；不点击补齐、生成、清空、提交、保存或任何真实创建入口。
- [x] 回填验证记录、审计表、风险和复盘。

## 高层操作摘要
- 用户最新反馈把目标明确到“弹窗‘组建计划’窗口外”，因此本轮停止继续推进矩阵页维度选择器验收，先修正主向导弹窗外层背景。
- 需要区分两个层级：`#am-wxt-keyword-modal` 是用户此前要求回退的主面板本体，继续保持轻透明玻璃；`#am-wxt-keyword-overlay:not(.item-picker-open)` 是当前窗口外背景，改成白色玻璃渐变用于聚焦当前弹窗内容。
- `添加商品` 二级弹窗已有独立 `#am-wxt-keyword-item-picker-mask` 白色轻玻璃背景；主 overlay 在 `item-picker-open` 时保持透明，避免二级弹窗打开后叠加两层玻璃背景。
- 已完成源码与专项断言：最终 CSS 将 `#am-wxt-keyword-overlay:not(.item-picker-open)` 改为白色玻璃渐变 `rgba(255,255,255,0.78) -> rgba(255,255,255,0.48)` 与 `blur(8px) saturate(1.15)`；新增 `#am-wxt-keyword-overlay.item-picker-open` 最终透明隔离；测试读取最后有效 CSS 块并防止 `#am-wxt-keyword-modal` 回到 `0.9x` 强白背景。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs tests/keyword-item-picker-popup.test.mjs tests/matrix-plan-config.test.mjs tests/keyword-edit-strategy-settings.test.mjs`：通过，63/63；新增覆盖主向导窗口外白色玻璃渐变、`item-picker-open` 透明隔离和主面板本体不强白化。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `git diff --check -- src/optimizer/keyword-plan-api/wizard-style-and-state/style.js tests/keyword-home-strategy-batch-actions.test.mjs tasks/todo.md tasks/lessons.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过。
- Chrome DevTools MCP 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?orderField=charge&orderBy=desc&offset=0&searchKey=campaignNameLike&searchValue=AI` 人群推广页，硬刷新后页面 API 已就绪，`window.__AM_WXT_KEYWORD_API__.openWizard()` 只打开组建计划主弹窗；未点击 `补齐5维`、`生成计划`、`清空`、`批量创建`、`提交创建`、`保存并关闭` 或任何真实创建/保存入口。运行态确认 `#am-wxt-keyword-overlay.open` 为 `display:flex`，窗口外背景为 `linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.48))`，`backdrop-filter: blur(8px) saturate(1.15)`；`#am-wxt-keyword-modal` 仍保持轻透明玻璃 `linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2))`，边框 `rgba(255, 255, 255, 0.6)`，阴影 `rgba(31, 38, 135, 0.15) 0px 8px 32px 0px`，面板 blur 为 `blur(20px) saturate(1.4)`。截图见 `tasks/ui-audit-keyword-main-overlay-white-glass-chrome-2026-05-29.png`。
- 验收后点击组建计划关闭按钮，确认 `overlayOpen=false`、`overlayDisplay=none`、`modalVisible=false`、`itemMaskExists=false`、`sceneMaskExists=false`；performance resource 基线后未出现 `/solution/addList`、`/solution/copy`、`/campaign/update`、`/campaign/create`、`/campaign/batch`、`/campaign/delete`、`/item/add`、`/item/update`、`/solution/save` 或 `/solution/update`。

## 结果复盘
- 结果：已按用户最新反馈把“组建计划”主弹窗窗口外改成白色玻璃渐变，视觉层级接近 `添加商品` 弹窗外层，并保留主面板本体上一版轻透明背景。
- 风险：本轮只改主向导外层 overlay 背景、专项断言和任务/审计记录，不改变主面板内部布局、添加商品候选器、计划详情、批量编辑、矩阵维度、请求构建、提交创建、保存并关闭或任何真实网络链路。
- 回滚方式：还原 `src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`、`tests/keyword-home-strategy-batch-actions.test.mjs`、本次构建产物、截图和任务/审计记录即可；不需要改业务逻辑。

---

# TODO - 2026-05-29 批量编辑弹窗外层背景白色玻璃化

## 需求规格
- 目标：按用户最新反馈“点击‘批量编辑’还是灰色背景”，修正关键词推广批量建计划 API 向导中点击 `批量编辑` 后弹出的批量编辑数值窗口外层遮罩背景，从通用深灰遮罩改为白色轻玻璃背景。
- 范围：只改批量编辑数值弹窗的外层 mask 标识、mask 背景/blur 和专项断言；保留弹窗卡片、输入、错误态、按钮、批量应用逻辑和通用场景弹窗默认样式；不改提交创建、保存、清空、计划选择、数值校验或真实请求链路。
- 成功标准：点击 `批量编辑` 后 `#am-wxt-scene-popup-mask` 具备批量编辑专属 class，computed background 为白色半透明轻玻璃，不再是 `rgba(15, 23, 42, 0.52)` 深灰遮罩；其它非批量编辑场景弹窗默认 mask 不被本轮扩大改动；构建、专项测试、构建检查、语法检查、空白检查和 Chrome DevTools MCP 真实页面只读验收完成。

## 执行计划（可核对）
- [x] 确认用户最新修正目标是点击 `批量编辑` 后的弹窗外层背景，而不是首页 `批量编辑` 按钮。
- [x] 写入 lessons，避免“按钮”和“按钮点击后的弹窗”目标混淆。
- [x] 为批量编辑数值弹窗外层 mask 增加专属 class，并只在该 class 下改成白色轻玻璃背景。
- [x] 更新专项断言，禁止批量编辑弹窗 mask 回退到通用深灰遮罩，同时确认通用场景弹窗未被扩大替换。
- [x] 构建同步产物，并运行组建计划相关专项测试、构建检查、语法检查和空白检查。
- [x] 用 Chrome DevTools MCP 在真实 `one.alimama.com` 页面点击 `批量编辑` 打开弹窗，只读取背景样式并取消关闭，不点击 `批量修改`、`提交创建` 或任何真实创建/保存入口。
- [x] 回填验证记录、审计表、风险和复盘。

## 高层操作摘要
- 本轮用户明确说的是“点击‘批量编辑’还是灰色背景”，因此上一轮首页头部按钮白色玻璃化虽然有效，但目标不完整；真正灰色来源是点击后弹窗复用的通用 `#am-wxt-scene-popup-mask { background: rgba(15, 23, 42, 0.52); }`。
- 实施策略：在 `openBatchStrategyPopupDialog()` 创建 mask 时，根据 `dialogClassName` 为批量编辑数值弹窗添加 `am-wxt-scene-popup-mask-batch-number`，CSS 只覆盖这个专属 mask；不把所有 `#am-wxt-scene-popup-mask` 默认背景改白，避免误伤高级设置、确认、风险类通用弹窗。
- 已新增 L81 教训：用户描述“点击某按钮后”的视觉问题时，先真实或受保护触发按钮并读取后续弹窗/浮层的 computed style，记录里区分“触发按钮”和“触发后的容器/遮罩”。
- 已完成源码与专项断言：批量编辑数值弹窗外层 mask 具备 `am-wxt-scene-popup-mask-batch-number`，该专属 class 使用白色玻璃渐变 `rgba(255,255,255,0.78) -> rgba(255,255,255,0.48)` 与 `blur(8px) saturate(1.15)`；通用场景弹窗默认 mask 仍保持深色遮罩，避免扩大影响。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs tests/matrix-plan-config.test.mjs tests/keyword-edit-strategy-settings.test.mjs`：通过，53/53；新增覆盖批量编辑弹窗专属 mask class、白色玻璃渐变、blur 和通用场景 mask 未扩大替换。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `git diff --check -- src/optimizer/keyword-plan-api/wizard-scene-config/manual-keywords-and-detail.js src/optimizer/keyword-plan-api/wizard-style-and-state/style.js tests/keyword-home-strategy-batch-actions.test.mjs tasks/todo.md tasks/ui-gap-audit-2026-05-29.md tasks/lessons.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过。
- Chrome DevTools MCP 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?orderField=charge&orderBy=desc&offset=0&searchKey=campaignNameLike&searchValue=AI` 人群推广页，页面 API 已就绪，`window.__AM_WXT_KEYWORD_API__.buildVersion` 为 `2026-02-18 04:00`；通过 `window.__AM_WXT_KEYWORD_API__.openWizard()` 打开组建计划，只点击 `#am-wxt-keyword-batch-edit-strategy` 打开“批量修改数值（已选 1 个计划）”弹窗，未点击弹窗内 `批量修改`、`批量创建`、`提交创建`、`保存并关闭` 或任何真实创建/保存入口。运行态确认 `#am-wxt-scene-popup-mask` 类名为 `am-wxt-scene-popup-mask am-wxt-scene-popup-mask-batch-number`，计算背景为 `linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.48))`，`backdrop-filter: blur(8px) saturate(1.15)`，`display:flex`，不再是通用深灰 `rgba(15, 23, 42, 0.52)`。弹窗本体仍为 560px 宽、18px 圆角、浅玻璃背景、`blur(18px) saturate(1.35)`，标题关联为 `aria-labelledby="am-wxt-scene-popup-title"`。截图见 `tasks/ui-audit-keyword-batch-edit-popup-white-mask-chrome-2026-05-29.png`。
- 验收后只点击弹窗 `取消` 并关闭主向导，确认 `maskExists=false`、`overlayOpen=false`、`overlayDisplay=none`、`modalVisible=false`；performance resource 基线后未出现 `/solution/addList`、`/solution/copy`、`/campaign/update`、`/campaign/create`、`/campaign/batch`、`/campaign/delete`、`/item/add`、`/item/update`、`/solution/save` 或 `/solution/update`。

## 结果复盘
- 结果：已按用户最新反馈把点击 `批量编辑` 后弹窗外层背景从灰色遮罩改为白色玻璃渐变，并保留通用场景弹窗默认深灰遮罩。
- 风险：本轮只改弹窗外层 mask class、CSS 视觉事实源和专项断言；不改变批量编辑数值校验、计划选择、批量应用、提交创建、保存或任何真实请求链路。
- 回滚方式：还原 `src/optimizer/keyword-plan-api/wizard-scene-config/manual-keywords-and-detail.js`、`src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`、`tests/keyword-home-strategy-batch-actions.test.mjs`、本次构建产物、截图和任务/审计记录即可。

---

# TODO - 2026-05-29 组建计划批量编辑按钮白色玻璃化

## 需求规格
- 目标：按用户最新反馈“关键词推广批量建计划 API 向导里的‘批量编辑’还是灰色”，将首页计划头部的 `批量编辑` 按钮从灰色/蓝灰视觉改为白色轻玻璃按钮，和组建计划已迁移的白色玻璃方向一致。
- 范围：只改 `#am-wxt-keyword-batch-edit-strategy` 及同组 `清空` 操作按钮的视觉背景、边框、文字、hover/focus 和 disabled 态，以及专项断言；不改批量编辑弹窗业务逻辑、数值校验、计划选择状态、批量应用、提交创建、请求构建或真实网络提交链路。
- 成功标准：`批量编辑` 按钮最终 CSS 使用 `--am26-surface-strong` / `--am26-border` / `--am26-text-soft` / `--am26-text`，disabled 态也保持白色轻玻璃弱化而非灰块；按钮最终样式不再由 `#f8fafc`、`#eff6ff`、`#cbd5e1`、`#475569`、`#1d4ed8` 等旧灰蓝事实源控制；构建、专项测试、构建检查、语法检查、空白检查和 Chrome DevTools MCP 真实页面只读验收完成。

## 执行计划（可核对）
- [x] 确认用户最新修正目标是向导内 `批量编辑` 按钮，而不是继续处理窗口外背景。
- [x] 写入 lessons，避免相邻 UI 修正时继续推进旧对象。
- [x] 将 `批量编辑` / `清空` 所在首页头部操作按钮收敛到白色轻玻璃 token，补齐 disabled 弱化态。
- [x] 更新专项断言，禁止该按钮回退到旧灰蓝背景、灰边和蓝灰文字。
- [x] 构建同步产物，并运行组建计划相关专项测试、构建检查、语法检查和空白检查。
- [x] 用 Chrome DevTools MCP 在真实 `one.alimama.com` 页面只打开组建计划首页验收按钮视觉，不点击 `批量编辑`、`清空`、`提交创建` 或任何真实创建/保存入口。
- [x] 回填验证记录、审计表、风险和复盘。

## 高层操作摘要
- 当前用户反馈明确指向“关键词推广批量建计划 API 向导里的批量编辑”，因此本轮停止继续处理上一条“窗口外背景”方向，先修正这个可见按钮。
- 初步定位：`批量编辑` 是首页计划头部 `#am-wxt-keyword-batch-edit-strategy`，属于 `.am-wxt-strategy-head-actions .am-wxt-btn`；当前后置样式仍可能被通用 `.am-wxt-btn` 或旧灰蓝按钮事实源影响，disabled 时更容易显示为灰色。
- 本轮只处理视觉层和断言；批量编辑弹窗已有独立 UI 迁移记录，除非 Chrome computed style 证明灰色来自弹窗本体，否则不扩大到弹窗业务链路。
- 已新增 L80 教训：用户点名具体控件时先验 DOM、最终 CSS 块和运行态 computed style，避免把相邻背景/弹窗切片继续推进到错误对象。
- 已在组建计划首页头部操作区新增最终覆盖：`.am-wxt-strategy-head-actions .am-wxt-btn`、`#am-wxt-keyword-batch-edit-strategy`、`#am-wxt-keyword-clear-strategy` 默认态使用 `--am26-surface-strong` / `--am26-border` / `--am26-text-soft`，hover/focus 提升为白色玻璃强态，disabled 态保持 `--am26-surface` 弱白玻璃、弱文本、`opacity: 1` 和 `not-allowed`。
- 已扩展 `首页计划头部包含计划配置、搜索、批量编辑与清空按钮，并挂到向导元素缓存` 专项断言，读取构建后根 userscript 的最后有效 CSS 块，禁止该按钮组默认态和 disabled 态回退到旧 `#f8fafc`、`#eff6ff`、`#cbd5e1`、`#475569`、`#1d4ed8`。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs tests/matrix-plan-config.test.mjs tests/keyword-edit-strategy-settings.test.mjs`：通过，53/53；新增覆盖首页计划头部 `批量编辑` / `清空` 按钮默认、hover/focus 和 disabled 白色轻玻璃 token。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `git diff --check -- src/optimizer/keyword-plan-api/wizard-style-and-state/style.js tests/keyword-home-strategy-batch-actions.test.mjs tasks/todo.md tasks/ui-gap-audit-2026-05-29.md tasks/lessons.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过。
- Chrome DevTools MCP 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/hky?orderField=charge&orderBy=desc` 线索推广页，硬刷新后版本为 `7.05`；通过 `window.__AM_WXT_KEYWORD_API__.openWizard()` 只打开组建计划首页，未点击 `批量编辑`、`清空`、`提交创建`、`批量创建`、`保存并关闭` 或任何真实创建/保存入口。运行态确认新增头部按钮规则已注入，旧灰蓝色未出现在头部按钮最终规则；`#am-wxt-keyword-batch-edit-strategy` 背景 `rgba(255, 255, 255, 0.45)`、边框 `rgba(255, 255, 255, 0.4)`、文字 `rgb(80, 90, 116)`、内高光存在，`#am-wxt-keyword-clear-strategy` 同样命中白色轻玻璃。临时只读切换 disabled 并等待 transition 后，`批量编辑` 和 `清空` disabled 背景均为 `rgba(255, 255, 255, 0.25)`、边框 `rgba(255, 255, 255, 0.4)`、文字 `rgba(80, 90, 116, 0.62)`、`opacity: 1`、`cursor: not-allowed`。截图见 `tasks/ui-audit-keyword-batch-edit-button-white-chrome-2026-05-29.png`。
- 验收后点击主关闭按钮，确认 `overlayOpen=false`、`overlayDisplay=none`、`overlayRectCount=0`、`modalRectCount=0`，无可见向导残留；performance resource 基线后未出现 `/solution/addList`、`/solution/copy`、`/campaign/update`、`/campaign/create`、`/campaign/batch`、`/campaign/delete`、`/item/add`、`/item/update`、`/solution/save` 或 `/solution/update`。控制台保留页面外部资源 `ERR_TUNNEL_CONNECTION_FAILED` 噪声，本次只读验收未产生创建/保存/删除类请求。

## 结果复盘
- 结果：完成关键词推广批量建计划 API 向导首页头部 `批量编辑` 按钮白色玻璃化；同组 `清空` 保持一致，默认态和 disabled 态都不再显示为旧灰蓝按钮。
- 风险：本轮只改 CSS 视觉事实源、专项断言和任务/审计记录，不改变批量编辑弹窗业务逻辑、数值校验、计划选择、批量应用、请求构建、提交创建或真实网络提交链路。
- 回滚方式：还原 `src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`、`tests/keyword-home-strategy-batch-actions.test.mjs`、本次构建产物、截图和任务/审计记录即可。

---

# TODO - 2026-05-29 组建计划日志页容器 token 收敛

## 需求规格
- 目标：继续推进组建计划内部样式事实源收敛，将“日志页 / 预览与执行日志”里的摘要盒、预览日志、请求预览和执行日志容器从旧硬编码白底/灰边/深色预览底收敛到统一 `--am26-*` 浅玻璃 token。
- 范围：只改 `#am-wxt-keyword-previewlog-panel`、`#am-wxt-workbench-preview-log`、`#am-wxt-keyword-preview`、`#am-wxt-keyword-log` 的可见样式与专项断言；不点击或修改 `预览请求`、`生成其他策略`、`批量创建`、`提交创建`、矩阵生成、请求构建、日志写入语义或任何真实网络提交逻辑。
- 成功标准：日志页摘要盒、预览日志、请求预览和执行日志最终 CSS 使用 `--am26-border`、`--am26-surface`、`--am26-text`、`--am26-text-soft`、`--am26-success`、`--am26-danger`；最终有效样式不再由 `#fff`、`#0f172a`、`#d1d5db`、`#334155`、`rgba(148,163,184,...)` 作为该区域事实源；相关测试、构建检查、语法检查、空白检查和 Chrome DevTools MCP 真实页面只读验收完成。

## 执行计划（可核对）
- [x] 回顾 UI/图标规范、审计表、历史教训和日志页当前源码样式，确认本轮只处理日志页视觉层。
- [x] 将日志页摘要盒、预览日志、请求预览和执行日志容器收敛到 `--am26-*` token。
- [x] 更新专项断言，防止日志页容器回退到硬编码白底/灰边/深色预览底和旧日志文字色。
- [x] 构建同步产物，并运行组建计划相关专项测试、构建检查、语法检查和空白检查。
- [x] 用 Chrome DevTools MCP 在真实 `one.alimama.com` 页面只打开 `组建计划 -> 日志页` 验收，不点击预览/生成/提交。
- [x] 回填验证记录、审计表、风险和复盘。

## 高层操作摘要
- 审计表当前剩余明确缺口集中在组建计划内部 `--am-wxt-*` 与硬编码样式事实源；本轮选择安全可见的“日志页/预览日志容器”切片，避免继续扩大到提交、矩阵或请求构建逻辑。
- 运行前源码定位：`#am-wxt-workbench-preview-log` 早期规则仍使用 `#fff`、`rgba(148,163,184,0.35)` 和 `#334155`；`#am-wxt-keyword-preview` 仍有 `#0f172a` 深色底和 `#d1d5db` 文字；最终后置覆盖只统一了圆角/背景，未把文字色、语义色和边框 fully token 化。
- 本轮将通过后置高优先级规则覆盖日志页相关容器，保持主面板背景回退后的轻透明玻璃方向，不把主面板重新强白化。
- 已新增 `#am-wxt-keyword-previewlog-panel` 作用域内的最终覆盖：摘要盒、摘要标题/值、`#am-wxt-workbench-preview-log`、`#am-wxt-keyword-preview`、`#am-wxt-keyword-log` 和日志行成功/失败态均改用 `--am26-*` token；没有改预览生成、日志写入、请求构建或提交链路。
- 已新增 `日志页预览与执行日志容器收敛到统一 token` 专项断言，读取构建后的根 userscript 最后生效 CSS 块，禁止该区域回退到 `#fff`、`#0f172a`、`#d1d5db`、`#334155`、`#b91c1c`、`#15803d` 或旧 `rgba(148,163,184,...)` 灰边事实源。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs tests/matrix-plan-config.test.mjs tests/keyword-edit-strategy-settings.test.mjs`：通过，53/53；新增覆盖日志页摘要盒、预览日志、请求预览、执行日志和日志行语义色 token。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `git diff --check -- src/optimizer/keyword-plan-api/wizard-style-and-state/style.js tests/keyword-home-strategy-batch-actions.test.mjs tasks/todo.md tasks/ui-gap-audit-2026-05-29.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过。
- Chrome DevTools MCP 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/hky?orderField=charge&orderBy=desc` 线索推广页，硬刷新后版本为 `7.05`；通过 `window.__AM_WXT_KEYWORD_API__.openWizard()` 打开组建计划，只切到 `日志页`，未点击 `预览请求`、`生成其他策略`、`批量创建`、`提交创建`、`保存并关闭` 或任何真实创建/保存入口。运行态确认 `#am-wxt-keyword-previewlog-panel` 背景 `rgba(255, 255, 255, 0.25)`、边框 `rgba(255, 255, 255, 0.4)`、文字 `rgb(27, 36, 56)`；摘要盒背景 `rgba(255, 255, 255, 0.25)`、边框 `rgba(255, 255, 255, 0.4)`、标题色 `rgb(80, 90, 116)`；`#am-wxt-workbench-preview-log` 背景 `rgba(255, 255, 255, 0.25)`、边框 `rgba(255, 255, 255, 0.4)`、文字 `rgb(80, 90, 116)`；隐藏的 `#am-wxt-keyword-preview` / `#am-wxt-keyword-log` 节点 computed style 也已命中新背景、边框和文字 token。截图见 `tasks/ui-audit-keyword-previewlog-token-chrome-2026-05-29.png`。
- 验收后点击主关闭按钮，确认 `overlayOpen=false`、`overlayDisplay=none`、`modalVisible=false`；performance resource 基线后未出现 `/solution/addList`、`/solution/copy`、`/campaign/update`、`/campaign/create`、`/campaign/batch`、`/campaign/delete`、`/item/add`、`/item/update`、`/solution/save` 或 `/solution/update`。控制台保留页面外部资源 `ERR_TUNNEL_CONNECTION_FAILED` 噪声，本次日志页只读验收未产生创建/保存/删除类请求。

## 结果复盘
- 结果：完成组建计划日志页/预览日志容器 token 收敛；日志页摘要盒、预览日志、请求预览、执行日志和日志行语义色已统一到 `--am26-*` 浅玻璃体系，主面板背景仍保持用户要求的上一版轻透明玻璃。
- 风险：本轮只改 CSS 视觉事实源和专项断言，不改变 `预览请求`、`生成其他策略`、矩阵生成、请求构建、日志写入语义、批量创建或提交链路；真实页面验收仅打开、切页、读取样式、截图和关闭。
- 回滚方式：还原 `src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`、`tests/keyword-home-strategy-batch-actions.test.mjs`、本次构建产物、截图和任务/审计记录即可。

---

# TODO - 2026-05-29 组建计划主面板背景回退

## 需求规格
- 目标：按用户最新反馈“面板的背景回退刚刚那种”，将组建计划主面板从刚才过白的强白玻璃回退到上一版轻透明玻璃面。
- 范围：只处理组建计划主面板背景回退、过时测试断言和任务/审计记录；保留外层 overlay 透明、内部整块灰底移除、详情背板、添加商品候选器、复制计划弹窗等已明确完成的白色轻玻璃切片；不继续改 `批量+`，不改矩阵维度增删、预设应用、补齐推荐、生成计划、提交创建、保存并关闭或任何真实写操作逻辑。
- 成功标准：源码和构建产物中 `#am-wxt-keyword-modal` 最终背景回到上一版 `rgba(255,255,255,0.6) -> rgba(255,255,255,0.2)` 轻透明玻璃；不再有针对组建计划主面板 `0.96 -> 0.88` 强白背景的专项断言或审计结论；构建、相关测试、构建检查、语法检查、空白检查和真实页面只读验收完成；验收不点击 `补齐推荐5维`、`生成计划`、`清空维度`、`批量创建`、`提交创建`、`保存并关闭` 或任何真实创建/保存入口。

## 执行计划（可核对）
- [x] 回顾用户最新反馈，确认只回退组建计划主面板过白背景，不扩大到复制计划、添加商品或详情背板。
- [x] 清理组建计划主面板强白背景相关源码覆盖、专项断言和矩阵页强白断言。
- [x] 更新任务记录、审计记录和教训，明确主面板保持上一版轻透明玻璃。
- [x] 构建同步产物，并运行相关组建计划专项测试、构建检查、语法检查和空白检查。
- [x] 用 Chrome DevTools MCP 在真实页面复验主面板背景，记录 computed style、截图和未触发写请求。
- [x] 回填最终验证记录、风险和复盘。

## 高层操作摘要
- 用户最新反馈明确不喜欢刚才过白的组建计划主面板背景，因此本轮回退主面板本体到上一版轻透明玻璃，不继续把矩阵主背景推高到强白。
- 当前源码最终覆盖块已回到 `#am-wxt-keyword-modal { background: var(--am26-panel-strong, linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.2))) }`，外层 overlay 仍是透明且无整页 blur。
- 已移除测试里锁定 `0.96 -> 0.88` 强白主面板和矩阵页强白背景的断言，避免后续被过时测试带回错误状态。
- 已新增 L71 教训：组建计划主面板默认保持轻透明玻璃，除非用户明确要求更白/更实，不再主动提升主面板和矩阵主背景 opacity。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs tests/matrix-plan-config.test.mjs tests/keyword-edit-strategy-settings.test.mjs`：通过，52/52。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `git diff --check -- src/optimizer/keyword-plan-api/wizard-style-and-state/style.js tests/keyword-home-strategy-batch-actions.test.mjs tests/matrix-plan-config.test.mjs tasks/todo.md tasks/ui-gap-audit-2026-05-29.md tasks/lessons.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过。
- Chrome DevTools MCP 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/hky?orderField=charge&orderBy=desc` 线索推广页，硬刷新后通过 `window.__AM_WXT_KEYWORD_API__.openWizard()` 只打开组建计划主面板；未点击 `补齐5维`、`生成计划`、`清空`、`批量创建`、`提交创建`、`保存并关闭` 或任何真实创建/保存入口。运行态确认 `#am-wxt-keyword-overlay.open` 为 `display:flex`、透明背景、无整页 blur；`#am-wxt-keyword-modal` 背景已回退为 `linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2))`，边框 `rgba(255, 255, 255, 0.6)`，阴影 `rgba(31, 38, 135, 0.15) 0px 8px 32px 0px`，面板 blur 为 `blur(20px) saturate(1.4)`。截图见 `tasks/ui-audit-keyword-background-reverted-chrome-2026-05-29.png`。
- 验收后点击组建计划关闭按钮，确认 `overlayOpen=false`、`overlayDisplay=none`、`modalVisible=false`；performance resource 基线后未出现 `/solution/addList`、`/solution/copy`、`/campaign/update`、`/campaign/create`、`/campaign/batch`、`/campaign/delete`、`/item/add`、`/item/update`、`/solution/save` 或 `/solution/update`。控制台仅有页面外部资源 `ERR_TUNNEL_CONNECTION_FAILED` 噪声，本次组建计划背景回退验收未产生创建/保存/删除类请求。

## 结果复盘
- 结果：已按用户反馈把组建计划主面板从过白强玻璃回退到上一版轻透明玻璃；外层透明 overlay、内部整块灰底移除、详情背板、添加商品候选器和复制计划弹窗等已完成切片保持不变。
- 风险：本轮只回退视觉背景和清理过时断言/记录，不改变矩阵维度增删、预设应用、补齐推荐、生成计划、请求预览、提交创建、计划详情保存、商品添加或任何网络提交逻辑；真实页面验收仅打开、读取样式、截图并关闭。
- 回滚方式：如需恢复强白背景，可重新添加组建计划 overlay 作用域内的 `--am26-*` 高白 token 覆盖和对应矩阵背景覆盖；当前按用户偏好不保留该方案。

---

# TODO - 2026-05-29 组建计划计划详情背板白色化

## 需求规格
- 目标：继续按“组建计划去掉灰色背景、与小万护航一致”的方向，将计划详情打开态的 `#am-wxt-keyword-detail-backdrop` 从暗色/灰色背板改为白色轻玻璃背板，并让详情面板壳层、标题栏和底部操作区继续使用统一 `--am26-*` token。
- 范围：只改计划详情打开态的遮罩/背板、详情面板外壳、详情标题栏和底部操作区视觉样式，以及专项断言；不改 `openStrategyDetail`、`showStrategyDetail`、计划字段回填、动态配置、保存并关闭、提交创建或任何请求构建逻辑。
- 成功标准：详情背板最终 CSS 不再使用 `rgba(15, 23, 42, ...)` 暗色背景；背板使用白色半透明背景和轻玻璃 blur；`#am-wxt-keyword-detail-config` 使用 `--am26-panel-strong`、`--am26-border-strong`、`--am26-shadow`、`--am26-text`；标题栏/底部操作区使用 `--am26-surface-strong` / `--am26-border`；专项测试、构建检查、语法检查、空白检查和 Chrome DevTools MCP 真实页只读验收完成；验收不点击 `保存并关闭`、`提交创建` 或 `批量创建`。

## 执行计划（可核对）
- [x] 回顾 UI/图标规范、历史灰底切片和计划详情当前 `detail-backdrop` 最终样式。
- [x] 将计划详情背板、详情面板壳层、标题栏和底部操作区收敛到白色轻玻璃 token。
- [x] 更新专项断言，禁止详情背板回退到旧暗色遮罩，并锁定详情面板壳层 token。
- [x] 构建同步产物，并运行编辑详情专项测试、组建计划相关回归、构建检查、语法检查和空白检查。
- [x] 用 Chrome DevTools MCP 在真实 `one.alimama.com` 页面只打开 `组建计划 -> 计划详情` 验收，不点击保存/提交。
- [x] 回填审计报告、验证记录、风险和复盘。

## 高层操作摘要
- 当前组建计划主向导、首页内容区和 `添加商品` 二级选择器已完成白色轻玻璃化；进入计划详情时，`#am-wxt-keyword-detail-backdrop` 仍保留暗色 `rgba(15, 23, 42, ...)` 背板。
- 本轮只处理打开详情即可观察的视觉层，不保存字段、不提交创建、不触发计划请求。
- 已将 `#am-wxt-keyword-detail-backdrop` 改为 `rgba(255, 255, 255, 0.72)` + `blur(8px) saturate(1.15)` 白色轻玻璃背板。
- 已将 `#am-wxt-keyword-modal #am-wxt-keyword-detail-config` 提升为最终优先级规则，避免被通用 `.am-wxt-config` 覆盖；详情面板壳层、标题栏和底部操作区改用 `--am26-panel-strong`、`--am26-border-strong`、`--am26-shadow`、`--am26-text`、`--am26-surface-strong` 和 `--am26-border`。
- 已新增编辑详情专项断言，锁定最终生效 CSS 块，防止详情背板回退到旧暗色遮罩，也防止详情面板壳层回退到旧硬编码白底灰边。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/keyword-edit-strategy-settings.test.mjs tests/keyword-home-strategy-batch-actions.test.mjs tests/keyword-item-picker-popup.test.mjs tests/crowd-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs`：通过，73/73；新增覆盖计划详情背板、详情面板壳层、标题栏和底部操作区白色轻玻璃 token。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `git diff --check -- src/optimizer/keyword-plan-api/wizard-style-and-state/style.js tests/keyword-edit-strategy-settings.test.mjs tasks/todo.md tasks/ui-gap-audit-2026-05-29.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过。
- Chrome DevTools MCP 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=Ai&orderField=charge&orderBy=desc` 人群推广页，刷新后只点击插件悬浮球/主面板、`组建计划`、计划行 `编辑` 打开计划详情；未点击 `保存并关闭`、`批量创建`、`提交创建`、`生成其他策略` 或任何真实创建/保存入口。运行态确认 `#am-wxt-keyword-detail-backdrop` 背景为 `rgba(255, 255, 255, 0.72)`、`backdrop-filter: blur(8px) saturate(1.15)`；`#am-wxt-keyword-detail-config` 为白色轻玻璃渐变、边框 `rgba(255, 255, 255, 0.6)`、18px 圆角、阴影 `rgba(31, 38, 135, 0.15) 0px 8px 32px 0px`、`blur(18px) saturate(1.35)`；标题栏/底部操作区背景 `rgba(255, 255, 255, 0.45)`、边框 `rgba(255, 255, 255, 0.4)`，最终规则不含旧暗色背板或旧硬编码白底灰边。截图见 `tasks/ui-audit-keyword-detail-backdrop-white-chrome-2026-05-29.png`。
- 验收后点击详情背板和主关闭按钮关闭，确认 `overlayOpen=false`、`overlayDisplay=none`、`detailBackdropOpen=false`、`detailVisible=false`、`modalVisible=false`；performance resource 基线后未出现 `/solution/addList.json`、`/solution/copy.json`、`/campaign/update*`、`/campaign/create`、`/campaign/batch`、`/item/add`、`/item/update`、`/solution/save` 或 `/solution/update`。

## 结果复盘
- 结果：完成组建计划计划详情背板和详情面板壳层白色轻玻璃化；详情打开态不再用暗色/灰色背板压暗页面，视觉方向与小万护航一致。
- 风险：本轮只改 CSS 视觉事实源和专项断言，不改变 `openStrategyDetail`、`showStrategyDetail`、计划字段回填、动态配置、保存并关闭、提交创建或请求构建逻辑；真实页面验收仅打开、读取样式并关闭。
- 回滚方式：还原 `src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`、`tests/keyword-edit-strategy-settings.test.mjs`、本次构建产物、截图和任务/审计记录即可。

---

# TODO - 2026-05-29 组建计划添加商品候选行与按钮 token 收敛

## 需求规格
- 目标：继续迁移 `添加商品` 候选选择器，将候选商品行、商品名称/ID 文本、工具条按钮、单项 `添加/已添加` 按钮和主按钮从旧硬编码白底/灰边/蓝底收敛到统一 `--am26-*` 浅玻璃 token。
- 范围：只改 `#am-wxt-keyword-item-picker-mask` 内商品候选行与按钮的视觉背景、边框、文字和状态样式，以及专项断言；不改商品候选加载、搜索、热销最近、全部商品、全部添加、单项添加、已添加禁用、确定/取消或主向导数据回写逻辑。
- 成功标准：候选行使用 `--am26-border` / `--am26-surface-strong` / `--am26-text` / `--am26-text-soft`；按钮默认/hover/primary/disabled 使用 `--am26-*` 与品牌弱光状态；旧 `rgba(148,163,184,...)` 灰边、`#fff` 白底、`#111827`、`#64748b`、`#eef2ff`、`#2e3ab8` 不再作为该弹窗候选行/按钮最终样式事实源；专项测试、构建检查、语法检查、空白检查和 Chrome DevTools MCP 只读验收完成；验收不点击 `全部添加`、单项 `添加` 或 `确定`。

## 执行计划（可核对）
- [x] 回顾 UI 规范、上一轮候选选择器白底切片和当前候选行/按钮硬编码样式。
- [x] 将候选选择器内按钮、候选商品行、商品名和商品 ID 文本收敛到 `--am26-*` token。
- [x] 更新专项断言，禁止候选行和按钮回退到旧硬编码白底、灰边和蓝色按钮。
- [x] 构建同步产物，并运行商品弹窗专项测试、组建计划相关回归、构建检查、语法检查和空白检查。
- [x] 用 Chrome DevTools MCP 在真实 `one.alimama.com` 页面只打开 `组建计划 -> 添加商品` 验收候选行与按钮，不点击添加/确定。
- [x] 回填审计报告、验证记录、风险和复盘。

## 高层操作摘要
- 上一轮已完成 `添加商品` 候选选择器外层遮罩和弹窗面板白色轻玻璃化；当前剩余可见硬编码集中在候选商品行、商品名/ID 和按钮。
- 本轮继续保持只读视觉迁移，不触发商品添加或计划创建。
- 已将候选选择器内普通按钮、主按钮、禁用按钮、候选商品行、商品名称和宝贝 ID 文本改为 `--am26-border`、`--am26-surface*`、`--am26-text*`、`--am26-primary*` 事实源，并补齐 hover/focus-visible 反馈。
- 已新增商品弹窗专项断言，锁定候选行与按钮最终 CSS 块，禁止回退到旧浅蓝按钮、硬编码主按钮渐变、旧灰边和深灰/灰蓝文字。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/keyword-item-picker-popup.test.mjs tests/keyword-home-strategy-batch-actions.test.mjs tests/crowd-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs`：通过，67/67；新增覆盖商品候选选择器候选行、普通按钮、主按钮、禁用按钮、名称和宝贝 ID 文本 token 收敛。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `git diff --check -- src/optimizer/keyword-plan-api/wizard-style-and-state/style.js tests/keyword-item-picker-popup.test.mjs tasks/todo.md tasks/ui-gap-audit-2026-05-29.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过。
- Chrome DevTools MCP 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=Ai&orderField=charge&orderBy=desc` 人群推广页，刷新后只点击插件悬浮球/主面板、`组建计划`、`添加商品` 打开候选选择器；未点击 `全部添加`、单项 `添加`、底部 `确定`、`提交创建`、`批量创建`、`生成其他策略` 或任何真实创建/保存入口。运行态确认遮罩仍为白色轻玻璃；普通按钮背景 `rgba(255, 255, 255, 0.45)`、边框 `rgba(255, 255, 255, 0.4)`、文字 `rgb(80, 90, 116)`；主按钮渐变为 `rgb(69, 84, 229)` 到 `rgb(29, 63, 207)`，文字 `rgba(255, 255, 255, 0.96)`；禁用 `已添加` 按钮背景 `rgba(255, 255, 255, 0.25)`、文字 `rgba(80, 90, 116, 0.62)`、`cursor: not-allowed`；候选行背景 `rgba(255, 255, 255, 0.45)`、边框 `rgba(255, 255, 255, 0.4)`、内高光存在；商品名 `rgb(27, 36, 56)`，宝贝 ID `rgb(80, 90, 116)`。最终 CSS 规则不含旧 `#eef2ff`、`#2e3ab8`、`#4554e5, #4f68ff`、`rgba(148, 163, 184, 0.34)`、`#111827`、`#64748b`。截图见 `tasks/ui-audit-keyword-item-picker-row-button-token-chrome-2026-05-29.png`。
- 验收后只点击二级选择器 `取消` 和主向导关闭按钮，确认 `overlayOpen=false`、`overlayDisplay=none`、`modalVisible=false`、`itemPickerExists=false`；performance resource 基线后未出现 `/solution/addList.json`、`/solution/copy.json`、`/campaign/copy/campaignCheck.json`、`/campaign/updatePart.json`、`/campaign/delete`、`/campaign/update`、`/campaign/create`、`/campaign/batch`、`/item/add` 或 `/item/update`。

## 结果复盘
- 结果：完成 `添加商品` 候选选择器内部候选行与按钮 token 收敛；二级选择器从遮罩、面板到候选列表可见控件均已对齐白色轻玻璃方向。
- 风险：本轮只改 CSS 视觉事实源和专项断言，不改变商品候选加载、搜索、热销最近、全部商品、全部添加、单项添加、已添加禁用、确定/取消或主向导数据回写逻辑；真实页面验收仅打开、读取样式并取消/关闭。
- 回滚方式：还原 `src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`、`tests/keyword-item-picker-popup.test.mjs`、本次构建产物、截图和任务/审计记录即可。

---

# TODO - 2026-05-29 组建计划添加商品候选选择器灰色遮罩改白色

## 需求规格
- 目标：延续“组建计划去掉灰色背景、与小万护航一致”的迁移方向，将 `添加商品` 候选选择器从深色整屏遮罩改为白色轻玻璃遮罩，避免打开二级选择器时重新压暗页面。
- 范围：只改 `#am-wxt-keyword-item-picker-mask` 及其商品候选选择器容器/工具条的视觉背景事实源和专项断言；不改商品搜索、热销最近、全部商品、全部添加、单项添加、已添加状态或确定/取消逻辑。
- 成功标准：候选选择器外层遮罩不再使用 `rgba(15,23,42,0.48)` / 深色整屏背景；容器保持白色轻玻璃面，工具条/输入继续使用 `--am26-*` token；专项测试、构建检查、语法检查、空白检查和 Chrome DevTools MCP 只读验收完成；验收不点击 `全部添加`、单项 `添加` 或 `确定`。

## 执行计划（可核对）
- [x] 回顾 UI 规范、审计表和上一轮 Chrome MCP 暴露的候选选择器深色遮罩证据。
- [x] 定位候选选择器 mask/container 最终生效 CSS，改为白色轻玻璃遮罩与面板背景。
- [x] 更新专项断言，禁止候选选择器遮罩回退到旧深色背景，并锁定 `--am26-*` token。
- [x] 构建同步产物，并运行专项测试、构建检查、语法检查和空白检查。
- [x] 用 Chrome DevTools MCP 在真实 `one.alimama.com` 页面只打开 `组建计划 -> 添加商品` 验收，不点击添加/确定。
- [x] 回填审计报告、验证记录、风险和复盘。

## 高层操作摘要
- 上一轮真实页面验收打开 `添加商品` 候选选择器时，运行态 `#am-wxt-keyword-item-picker-mask` 仍为 `rgba(15, 23, 42, 0.48)` 深色整屏遮罩。
- 本轮只处理该二级选择器的视觉层级，保持商品搜索、候选加载和添加逻辑不变。
- 已将候选选择器外层遮罩改为 `rgba(255, 255, 255, 0.72)` + `blur(8px) saturate(1.15)`；弹窗主体、头部、候选面板和底部操作区改用 `--am26-panel-strong`、`--am26-border*`、`--am26-shadow`、`--am26-surface*` 和 `--am26-text`。
- 已在商品弹窗专项测试中新增 mask/dialog/head/panel/toolbar/foot 断言，禁止旧 `rgba(15, 23, 42, 0.48)`、`#f7f8fc`、旧深阴影、旧浅蓝头部和硬编码 `#fff` 灰边回退。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/keyword-item-picker-popup.test.mjs tests/keyword-home-strategy-batch-actions.test.mjs tests/crowd-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs`：通过，66/66；新增覆盖商品候选选择器白色轻玻璃遮罩、主体 token、候选面板 token 和旧深色遮罩回退防护。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `git diff --check -- src/optimizer/keyword-plan-api/wizard-style-and-state/style.js tests/keyword-item-picker-popup.test.mjs tasks/todo.md tasks/ui-gap-audit-2026-05-29.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过。
- Chrome DevTools MCP 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=Ai&orderField=charge&orderBy=desc` 人群推广页，刷新后确认插件重新注入；只点击插件悬浮球、`组建计划`、`添加商品` 打开候选选择器，未点击 `全部添加`、单项 `添加`、底部 `确定`、`提交创建`、`批量创建`、`生成其他策略` 或任何真实创建/保存入口。运行态确认 `#am-wxt-keyword-item-picker-mask` 背景为 `rgba(255, 255, 255, 0.72)`、`backdrop-filter: blur(8px) saturate(1.15)`；最终 mask CSS 规则不含旧 `rgba(15, 23, 42, 0.48)`。候选弹窗主体为 `--am26-panel-strong` 对应白色轻玻璃渐变、边框 `rgba(255, 255, 255, 0.6)`、阴影 `rgba(31, 38, 135, 0.15) 0px 8px 32px 0px`、`blur(18px) saturate(1.35)`；头部背景 `rgba(255, 255, 255, 0.45)`，工具条/候选面板/底部操作区背景 `rgba(255, 255, 255, 0.25)`，搜索输入保持品牌弱光 focus ring。截图见 `tasks/ui-audit-keyword-item-picker-white-bg-chrome-2026-05-29.png`。
- 验收后点击候选选择器关闭按钮退出，再关闭主向导，确认 `overlayOpen=false`、`overlayDisplay=none`、`modalVisible=false`、`itemPickerExists=false`、执行模式菜单和详情页均无残留；performance resource 基线后未出现 `/solution/addList.json`、`/solution/copy.json`、`/campaign/copy/campaignCheck.json`、`/campaign/updatePart.json`、`/campaign/delete`、`/campaign/update`、`/campaign/create`、`/campaign/batch`、`/item/add` 或 `/item/update`。控制台存在页面外部资源 `ERR_TUNNEL_CONNECTION_FAILED` 噪声，本次候选选择器 UI 验收未产生添加/创建/保存类请求。

## 结果复盘
- 结果：完成组建计划 `添加商品` 候选选择器灰色/深色遮罩改白色轻玻璃，二级选择器打开时不再压暗整屏，视觉层级与主向导、小万护航方向一致。
- 风险：本轮只改 CSS 视觉事实源和专项断言，不改变商品搜索、热销最近、全部商品、全部添加、单项添加、已添加状态或确定/取消逻辑；真实页面验收仅打开、读取样式并关闭。
- 回滚方式：还原 `src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`、`tests/keyword-item-picker-popup.test.mjs`、本次构建产物、截图和任务/审计记录即可。

---

# TODO - 2026-05-29 复制计划弹窗灰色背景改白色

## 需求规格
- 目标：按用户最新反馈，将计划行“复制”打开的复制计划一览窗和复制成功窗从灰色遮罩/灰感玻璃背景调整为白色轻玻璃背景，减少整屏灰色压暗感。
- 范围：只改复制计划一览窗 `#am-campaign-copy-overview-popup`、复制成功窗 `#am-campaign-copy-success-popup` 的视觉背景与专项断言；不改复制按钮挂载、计划详情读取、复制 API、确认生成、成功后搜索或创建后暂停逻辑。
- 成功标准：两个复制弹窗外层遮罩为白色半透明背景，禁止回退到旧 `rgba(27, 36, 56, 0.28)` 灰色遮罩；卡片本体呈明确白色轻玻璃面；专项测试、构建同步、语法/构建检查和 Chrome DevTools MCP 只读验收完成；验收不点击“确认生成”，不触发真实复制创建。

## 执行计划（可核对）
- [x] 回顾 UI/图标规范、复制计划历史教训和当前复制弹窗样式断言。
- [x] 将复制计划一览窗与复制成功窗外层遮罩改为白色半透明，并让卡片本体更明确地呈现白色轻玻璃面。
- [x] 更新专项断言，锁定白色背景并禁止旧灰色遮罩回退。
- [x] 构建同步产物，并运行复制计划专项测试、相关快捷入口测试、构建检查、语法检查和空白检查。
- [x] 用 Chrome DevTools MCP 在真实 `one.alimama.com` 页面只打开复制一览窗验收，不点击确认生成/不触发复制创建。
- [x] 回填审计报告、验证记录、风险和复盘。

## 高层操作摘要
- 用户最新反馈聚焦“复制计划”的灰色背景，本轮从组建计划整体迁移中切出独立小切片，避免误改其它页面或真实复制链路。
- 旧灰色来源是 `src/main-assistant/ui.js` 中复制一览窗和成功窗外层遮罩 `rgba(27, 36, 56, 0.28)`，专项测试当前也锁定了这个旧值。
- 本轮只处理视觉背景，不改变复制前只读查询、确认后提交、成功后页内搜索等业务行为。
- 已将复制一览窗和成功窗外层遮罩改为 `rgba(255, 255, 255, 0.72)`，并补 `-webkit-backdrop-filter`；卡片本体改为 `rgba(255,255,255,0.96 -> 0.88)` 白色轻玻璃渐变。
- 已更新复制计划专项断言，分别提取一览窗/成功窗 CSS 规则，锁定白色遮罩和白色卡片，并禁止旧 `rgba(27, 36, 56, 0.28)` / `blur(10px)` 在复制弹窗规则内回退。

## 验证记录
- `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs`：通过，12/12；覆盖复制一览窗/成功窗白色遮罩、白色卡片和旧灰色遮罩回退防护。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs tests/campaign-batch-plus-quick-entry.test.mjs tests/campaign-concurrent-start-quick-entry.test.mjs`：通过，27/27。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `git diff --check -- src/main-assistant/ui.js tests/campaign-copy-current-plan-quick-entry.test.mjs tasks/todo.md tasks/ui-gap-audit-2026-05-29.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过。
- Chrome DevTools MCP 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7&orderField=charge&orderBy=desc` 人群推广页，刷新后确认复制弹窗样式已重新注入；只点击行级 `复制` 按钮打开 `复制计划一览`，未点击 `确认生成`。运行态确认一览窗 `role="dialog"`、`aria-modal="true"`、标题关联 `am-copy-overview-title`，状态文案为 `确认后才会提交创建请求。`；外层遮罩计算样式 `background-color: rgba(255, 255, 255, 0.72)`、`backdrop-filter: blur(8px) saturate(1.15)`，卡片背景为 `linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.88))`；一览窗和成功窗 CSS 规则均不含旧 `rgba(27, 36, 56, 0.28)` / `blur(10px)`。截图见 `tasks/ui-audit-copy-popup-white-bg-chrome-2026-05-29.png`。
- 验收后点击 `取消` 关闭一览窗，确认一览窗与成功窗均不存在；performance resource 中未出现 `/solution/copy.json`、`/solution/addList.json`、`/campaign/copy/campaignCheck.json` 或 `/campaign/updatePart.json`，未触发复制创建/提交。控制台存在页面外部资源 `ERR_TUNNEL_CONNECTION_FAILED` 噪声，本次复制弹窗交互未产生创建类接口或可见业务错误。

## 结果复盘
- 结果：完成复制计划一览窗和复制成功窗灰色背景改白色；复制弹窗不再压暗整屏，卡片本体更接近白色轻玻璃面。
- 风险：本轮只改 CSS 背景和静态断言，不改复制按钮挂载、计划详情读取、复制 API、确认生成、成功后搜索或创建后暂停逻辑；真实页面验收只打开并取消一览窗。
- 回滚方式：还原 `src/main-assistant/ui.js`、`tests/campaign-copy-current-plan-quick-entry.test.mjs`、本次构建产物、截图和任务/审计/教训记录即可。

---

# TODO - 2026-05-29 组建计划首页工具条与计划行文字控件 token 收敛

## 需求规格
- 目标：继续迁移组建计划首页可见内容区，将商品候选选择器工具条输入、计划配置标题、计划搜索框、计划名称/摘要文字、行内编辑输入和复制数量徽标从硬编码白底/灰边/深灰字收敛到统一 `--am26-*` 浅玻璃 token。
- 范围：只改首页工具条/搜索框/计划行文本控件的 CSS 与专项断言；商品搜索输入的真实运行态宿主为 `#am-wxt-keyword-item-picker-mask`，不是主弹窗内 `#am-wxt-keyword-modal`；不改商品搜索、计划筛选、计划名称/预算编辑逻辑、复制数量交互、删除/编辑/提交创建、请求构建或真实投放链路。
- 成功标准：相关最终 CSS 块使用 `--am26-border` / `--am26-surface` / `--am26-surface-strong` / `--am26-text` / `--am26-text-soft` / `--am26-primary*`；旧 `#fff`、`#cbd5e1`、`#111827`、`#0f172a`、`#475569`、`#94a3b8` 不再作为这些区域最终样式事实源；专项测试、构建检查和 `@chrome` 只读验收完成。

## 执行计划（可核对）
- [x] 回顾 UI 规范、审计表和组建计划首页剩余硬编码样式。
- [x] 将首页工具条输入、计划标题、搜索框、计划名称/摘要、行内编辑输入和复制数量徽标收敛到 `--am26-*` token。
- [x] 更新专项断言，防止该区域回退到硬编码白底、灰边和深灰文字。
- [x] 构建同步产物，并运行专项测试、构建检查、语法检查和空白检查。
- [x] 用 `@chrome` 在真实 `one.alimama.com` 页面只打开组建计划首页验收，不点击提交创建/批量创建/删除/编辑保存。
- [x] 回填审计报告、验证记录、风险和复盘。

## 高层操作摘要
- 审计表剩余缺口集中在组建计划内部局部 token 与硬编码蓝灰/白底样式；当前切片选择打开首页即可安全观察的工具条、搜索框和计划行文本控件。
- 本轮只改视觉 token 事实源和静态断言，不触发任何真实创建、提交、删除或保存动作。
- `@chrome` 上轮观察确认 `#am-wxt-keyword-search-input` 被移动到商品候选选择器 `#am-wxt-keyword-item-picker-mask` 内，本轮已按真实宿主补齐样式和专项断言。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs tests/crowd-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs`：通过，58/58；覆盖首页工具条、搜索框、计划行文字控件、商品候选选择器真实宿主和相关弹窗局部 token。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- Chrome DevTools MCP 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7&orderField=charge&orderBy=desc` 人群推广页，只点击插件悬浮球与 `组建计划` 打开主向导首页；未点击 `提交创建`、`批量创建`、`生成其他策略`、`删除`、`编辑保存` 或任何真实创建/提交入口。运行态确认 `#am-wxt-keyword-overlay.open` 为透明背景且无整页 blur，主面板仍为 1320px 浅玻璃工作台；计划配置标题文字 `rgb(27, 36, 56)`，计划搜索框背景 `rgba(255, 255, 255, 0.45)`、边框 `rgba(255, 255, 255, 0.4)`、文字 `rgb(27, 36, 56)`、内高光存在；计划名称文字 `rgb(27, 36, 56)`，计划摘要 `rgb(80, 90, 116)`、弱摘要 `rgba(80, 90, 116, 0.62)`；行内编辑输入为 `--am26-surface-strong` 对应白色轻玻璃面、编辑按钮默认色 `rgb(80, 90, 116)`；复制数量徽标背景 `rgba(255, 255, 255, 0.25)`、边框 `rgba(255, 255, 255, 0.4)`、文字 `rgb(80, 90, 116)`。随后只点击 `添加商品` 打开商品候选选择器，未点击 `全部添加` 或单项 `添加`；运行态确认真实宿主 `#am-wxt-keyword-item-picker-mask` 内工具条背景 `rgba(255, 255, 255, 0.25)`，搜索输入聚焦态为白色轻玻璃背景、品牌弱光边框 `rgba(69, 84, 229, 0.42)` 和 `0 0 0 3px rgba(69,84,229,0.12)`。截图见 `tasks/ui-audit-keyword-home-toolbar-row-token-chrome-2026-05-29.png`。
- 验收后关闭商品候选选择器与主向导，确认 `overlayOpen=false`、`overlayDisplay=none`、`modalVisible=false`、`itemPickerExists=false`；performance resource 基线后未出现 `/solution/addList.json`、`/solution/copy.json`、`/campaign/copy/campaignCheck.json`、`/campaign/updatePart.json`、`/campaign/delete`、`/campaign/update`、`/campaign/create` 或 `/campaign/batch`。控制台存在页面外部资源 `ERR_TUNNEL_CONNECTION_FAILED` 与 `ScriptProcessorNode is deprecated` 噪声，本次组建计划 UI 验收未产生创建/保存/删除类请求。

## 结果复盘
- 结果：完成组建计划首页工具条、计划配置标题、计划搜索框、计划名称/摘要、行内编辑输入、行内编辑按钮和复制数量徽标 token 收敛闭环；商品候选选择器搜索输入也按真实运行态宿主完成验证。
- 风险：本轮只改 CSS 事实源、专项断言和任务记录，不改变商品搜索、计划筛选、计划名称/预算编辑逻辑、复制数量交互、删除/编辑/提交创建、请求构建或真实投放链路；真实页面验收仅打开、读取样式并关闭。
- 回滚方式：还原 `src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`、`tests/keyword-home-strategy-batch-actions.test.mjs`、本次构建产物、截图和任务/审计记录即可。

---

# TODO - 2026-05-29 组建计划首页摘要卡片 token 收敛（继续）

## 需求规格
- 目标：继续迁移组建计划首页内容区，将顶部 3 个摘要卡片从硬编码白底/灰边/深色数字收敛到统一 `--am26-*` 浅玻璃 token。
- 范围：只改首页摘要卡片 `.am-wxt-home-summary`、`.am-wxt-home-stat`、`.am-wxt-home-stat-label`、`.am-wxt-home-stat strong/small` 的 CSS 与专项断言；不改摘要动态计算、商品/计划/预算逻辑、执行模式、请求构建、批量创建、提交创建或真实投放链路。
- 成功标准：摘要卡片最终 CSS 块使用 `--am26-surface-strong` / `--am26-border` / `--am26-text` / `--am26-text-soft` / `--am26-primary-strong`；旧 `#fff`、`#eef2f7`、`#64748b`、`#0f172a` 不再作为该区域最终样式事实源；专项测试、构建检查和 `@chrome` 只读验收完成。

## 执行计划（可核对）
- [x] 回顾 UI 规范、审计表、历史灰底切片和摘要卡片当前源码。
- [x] 确认摘要卡片最终覆盖块已切到 `--am26-*` token。
- [x] 更新专项断言，防止摘要卡片回退到硬编码白底、灰边和深色数字。
- [x] 构建同步产物，并运行专项测试、构建检查、语法检查和空白检查。
- [x] 用 `@chrome` 在真实 `one.alimama.com` 页面只打开组建计划首页验收摘要卡片，不点击提交创建/批量创建。
- [x] 回填审计报告、验证记录、风险和复盘。

## 高层操作摘要
- 已确认源码最终覆盖块中 `.am-wxt-home-stat`、标签、数字和单位已使用 `--am26-*` token；本轮补齐专项断言和真实页面验收闭环。
- 本轮只处理打开首页即可观察的摘要区，不进入计划详情、不展开业务弹窗、不触发任何提交。
- 已补充专项断言锁定首页摘要容器、摘要卡片、标签、数字和单位的最终生效 CSS 块，避免该区域回退到硬编码白底、灰边和深色数字。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs tests/crowd-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs`：通过，57/57；新增覆盖组建计划首页摘要卡片 token 收敛。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `git diff --check -- src/optimizer/keyword-plan-api/wizard-style-and-state/style.js tests/keyword-home-strategy-batch-actions.test.mjs tasks/todo.md tasks/ui-gap-audit-2026-05-29.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过。
- `@chrome` 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7` 人群推广页，刷新后只点击插件悬浮球与 `组建计划` 打开主向导首页；未点击 `提交创建`、`批量创建`、`生成其他策略` 或任何真实创建/提交入口。运行态确认顶部 3 个摘要卡片可见，文案为 `已添加商品 8 / 30`、`已选计划 4`、`预算合计 400元`；计算样式显示卡片背景 `rgba(255, 255, 255, 0.45)`、边框 `rgba(255, 255, 255, 0.4)`、标签色 `rgb(80, 90, 116)`、数字色 `rgb(29, 63, 207)`、内高光存在；控制台 error/warn 为 0。历史样式文本中仍能检索到旧色值片段，但最终有效 CSS 块、专项断言和 computed style 均指向 `--am26-*` token。截图见 `tasks/ui-audit-keyword-home-summary-token-chrome-2026-05-29.png`。

## 结果复盘
- 结果：完成组建计划首页摘要卡片 token 收敛，卡片边框、背景、标签、数字和单位均由统一浅玻璃 token 控制。
- 风险：本轮只改 CSS 事实源和专项断言，不改变摘要动态计算、商品/计划/预算逻辑、执行模式、请求构建、批量创建、提交创建或真实投放链路；真实页面验收只打开和关闭主向导首页。
- 回滚方式：还原 `src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`、`tests/keyword-home-strategy-batch-actions.test.mjs`、本次构建产物、截图和任务/审计记录即可。

---

# TODO - 2026-05-29 组建计划整块灰底去除

## 需求规格
- 目标：按用户最新反馈，将组建计划主向导里“整块灰色背景”去掉，呈现方式对齐小万护航：页面外层透明，只有独立工具面板本身承载浅玻璃背景，不在内容区额外铺一层灰底。
- 范围：只处理组建计划主向导外壳、内容区和首页主内容容器的背景事实源；不改商品选择、计划配置、摘要计算、执行模式、请求构建、批量创建、提交创建或真实投放链路。
- 成功标准：`#am-wxt-keyword-overlay` 仍为透明无整页 blur；`#am-wxt-keyword-modal` 保留 `--am26-panel-strong` 浅玻璃面板；`.am-wxt-body` 不再使用整块灰/白蒙层背景；首页主要容器不再靠硬编码 `#fff` / `#f8fafc` 铺满内容区；专项断言、构建检查和 `@chrome` 只读验收通过。

## 执行计划（可核对）
- [x] 回顾 UI 规范、历史灰底切片记录和当前组建计划最终覆盖块。
- [x] 对照小万护航面板方式，移除主向导内容区整块灰/白底，只保留独立玻璃面板背景。
- [x] 更新专项断言，防止 `.am-wxt-body` 与首页主容器回退到整块灰/白底。
- [x] 构建同步产物，并运行专项测试、构建检查、语法检查和空白检查。
- [x] 用 `@chrome` 在真实 `one.alimama.com` 页面只打开组建计划验收，不点击提交创建/批量创建。
- [x] 回填审计报告、验证记录、风险和复盘。

## 高层操作摘要
- 已确认上一轮只去除了整屏 overlay 灰遮罩；当前用户反馈指向组建计划面板内部仍存在大面积灰/白底板。
- 本轮只改视觉背景层级，不进入计划详情、不展开二级业务弹窗、不触发任何创建/提交。
- 已将最终覆盖块中的 `.am-wxt-body`、工作台页签和计划列表背景改为透明；主内容容器、工具条、商品行、计划表头改用 `--am26-surface*` 半透明 token，保留主弹窗自身 `--am26-panel-strong` 浅玻璃面板。
- 已补充专项断言，锁定最终生效 CSS 块，不再让内容区、页签、计划列表、表头和计划行回退到整块 `#fff` / `#f8fafc` / 灰白背景。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs tests/crowd-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs`：通过，56/56；新增覆盖组建计划主向导内部整块灰底去除。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `git diff --check -- src/optimizer/keyword-plan-api/wizard-style-and-state/style.js tests/keyword-home-strategy-batch-actions.test.mjs tasks/todo.md tasks/ui-gap-audit-2026-05-29.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过。
- `@chrome` 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7` 人群推广页，刷新后只点击插件悬浮球与 `组建计划` 打开主向导；未点击 `提交创建`、`批量创建`、`生成其他策略` 或任何真实创建/提交入口。运行态确认 `#am-wxt-keyword-overlay.open` 仍为透明背景、无背景图、无整页 `backdrop-filter`；`#am-wxt-keyword-modal` 保持 `--am26-panel-strong` 对应浅玻璃渐变、18px 圆角、`--am26-shadow` 和 `blur(20px) saturate(1.4)`；`.am-wxt-body`、`.am-wxt-workbench-tabs`、`.am-wxt-strategy-list` 和 `.am-wxt-strategy-item` 计算背景均为 `rgba(0, 0, 0, 0)` / `none`；`.am-wxt-strategy-board` 与 `.am-wxt-strategy-list-head` 为 `rgba(255, 255, 255, 0.25)` 半透明 token 背景；控制台 error/warn 为 0。截图见 `tasks/ui-audit-keyword-wizard-no-inner-gray-chrome-2026-05-29.png`。验收后点击关闭，确认 overlay 不再打开；modal 等节点保留在 DOM 中属于向导挂载结构，不作为可见残留判断。

## 结果复盘
- 结果：完成组建计划内部整块灰/白底去除，当前呈现为页面外层透明、主弹窗独立浅玻璃、内容区不再额外铺整块底色，视觉层级与小万护航方式一致。
- 风险：本轮只改最终 CSS 覆盖块和专项断言，不改变商品选择、计划配置、摘要计算、执行模式、请求构建、批量创建、提交创建或真实投放链路；真实页面验收只打开和关闭主向导。
- 回滚方式：还原 `src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`、`tests/keyword-home-strategy-batch-actions.test.mjs`、本次构建产物、截图和任务/审计记录即可。

---

# TODO - 2026-05-29 组建计划首页摘要卡片 token 收敛

## 需求规格
- 目标：继续迁移组建计划首页内容区，将顶部 3 个摘要卡片从硬编码白底/灰边/深色数字收敛到统一 `--am26-*` 浅玻璃 token。
- 范围：只改首页摘要卡片 `.am-wxt-home-summary`、`.am-wxt-home-stat`、`.am-wxt-home-stat-label`、`.am-wxt-home-stat strong/small` 的 CSS 与专项断言；不改摘要动态计算、商品/计划/预算逻辑、执行模式、请求构建、批量创建、提交创建或真实投放链路。
- 成功标准：摘要卡片使用 `--am26-surface` / `--am26-surface-strong` / `--am26-border` / `--am26-text` / `--am26-text-soft` / `--am26-primary-strong`；旧 `#fff`、`#eef2f7`、`#64748b`、`#0f172a` 不再作为该区域最终样式事实源；专项测试、构建检查和 `@chrome` 只读验收完成。

## 执行计划（可核对）
- [x] 回顾 UI 规范、审计表和首页摘要卡片现状。
- [ ] 将首页摘要卡片容器、卡片、标签、数字和单位收敛到 `--am26-*` token。
- [ ] 更新专项断言，防止摘要卡片回退到硬编码白底、灰边和深色数字。
- [ ] 构建同步产物，并运行专项测试、构建检查、语法检查和空白检查。
- [ ] 用 `@chrome` 在真实 `one.alimama.com` 页面只打开组建计划首页验收摘要卡片，不点击提交创建/批量创建。
- [ ] 回填审计报告、验证记录、风险和复盘。

## 高层操作摘要
- 已确认组建计划首页摘要卡片在最终覆盖块中仍使用 `border: 1px solid #eef2f7`、`background: #fff`、标签 `#64748b` 和数字 `#0f172a`。
- 本轮只处理打开首页即可观察的摘要区，不进入计划详情、不展开业务弹窗、不触发任何提交。

## 验证记录
- 待执行。

## 结果复盘
- 待补充。

---

# TODO - 2026-05-29 组建计划执行模式下拉菜单 token 收敛（继续）

## 需求规格
- 目标：继续迁移组建计划首页内容区，将执行模式下拉菜单容器、菜单项、hover/active 态从硬编码白底/蓝色状态收敛到统一 `--am26-*` 浅玻璃 token。
- 范围：只改执行模式下拉菜单 CSS 与专项断言；不改执行模式切换、并发数调整、提交按钮、日志写入、请求构建、批量创建、提交创建或真实投放链路。
- 成功标准：`#am-wxt-keyword-run-mode-menu` 和 scoped `.am-wxt-run-mode-menu` 最终生效覆盖使用 `--am26-panel-strong`、`--am26-border-strong`、`--am26-shadow`、`--am26-text-soft`、`--am26-primary-strong`；旧白底浅蓝渐变、`#334155`、`#1d4ed8`、`rgba(37,99,235,...)` 不再作为该菜单最终样式事实源；专项测试、构建检查和 `@chrome` 只读验收完成。

## 执行计划（可核对）
- [x] 回顾 UI 规范、审计表、历史教训和上一轮执行模式数量徽标验收结果。
- [x] 将执行模式下拉菜单最终覆盖块收敛到 `--am26-*` token，避免后置规则覆盖基础 token 样式。
- [x] 更新专项断言，覆盖菜单容器、菜单项、hover/active 态和旧白底浅蓝回退。
- [x] 构建同步产物，并运行专项测试、构建检查、语法检查和空白检查。
- [x] 用 `@chrome` 在真实 `one.alimama.com` 页面只打开组建计划并展开执行模式菜单验收，不点击提交创建/批量创建。
- [x] 回填审计报告、验证记录、风险和复盘。

## 高层操作摘要
- 已确认基础菜单规则已使用 `--am26-*`，但后置覆盖块 `#am-wxt-keyword-modal .am-wxt-run-mode-menu, #am-wxt-keyword-run-mode-menu.am-wxt-run-mode-menu` 仍使用 `rgba(255,255,255,0.96)` 白底浅蓝渐变、`blur(8px)` 和蓝色阴影，运行态会覆盖前面的 token 样式。
- 本轮只处理菜单视觉事实源；运行态验收只展开菜单读取样式，不选择模式、不调整并发数、不触发任何提交。
- 已将后置覆盖块改为 `--am26-border-strong`、`--am26-panel-strong`、`--am26-shadow` 和 `blur(12px) saturate(1.25)`，与前置菜单样式保持同一浅玻璃事实源。
- 已补充专项断言，提取最终覆盖块逐项校验菜单容器 token，同时校验菜单项、hover 和 active 态不回退。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs tests/crowd-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs`：通过，55/55；新增覆盖执行模式菜单容器、菜单项、hover/active 态和旧白底浅蓝回退。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `git diff --check -- src/optimizer/keyword-plan-api/wizard-style-and-state/style.js tests/keyword-home-strategy-batch-actions.test.mjs tasks/todo.md tasks/ui-gap-audit-2026-05-29.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过，无空白格式问题。
- `@chrome` 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7` 人群推广页，刷新后只点击插件悬浮球、`组建计划` 和执行模式下拉按钮；未点击 `提交创建`、`批量创建`、`生成其他策略` 或任何真实创建/提交入口。运行态确认 `#am-wxt-keyword-run-mode-menu` 可见，容器计算样式为 `background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2))`、`border-color: rgba(255, 255, 255, 0.6)`、`box-shadow: rgba(31, 38, 135, 0.15) 0px 8px 32px 0px`、`backdrop-filter: blur(12px) saturate(1.25)`；最终 CSS 覆盖块命中 `--am26-border-strong` / `--am26-panel-strong` / `--am26-shadow`，旧 `rgba(255,255,255,0.96)`、`rgba(246,249,255,0.9)` 和旧蓝色阴影不存在。菜单项默认文字 `rgb(80, 90, 116)`，active 背景 `rgba(69, 84, 229, 0.1)`、文字 `rgb(29, 63, 207)`，数量徽标继续为 `--am26-surface`/`--am26-border` 对应样式；控制台 error/warn 为 0。截图见 `tasks/ui-audit-keyword-run-mode-menu-token-chrome-2026-05-29.png`。验收后关闭主向导，确认 overlay 关闭、菜单隐藏、详情和二级弹窗无残留。

## 结果复盘
- 结果：完成组建计划执行模式下拉菜单 token 收敛，菜单容器、菜单项、hover/active 态和数量徽标均由 `--am26-*` 浅玻璃事实源控制。
- 风险：本轮只改 CSS 和静态断言，不改变执行模式切换、并发数调整、提交按钮、日志写入、请求构建或真实创建提交链路；真实页面验收只展开菜单并关闭向导。
- 回滚方式：还原 `src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`、`tests/keyword-home-strategy-batch-actions.test.mjs`、本次构建产物、截图和任务/审计记录即可。

---

# TODO - 2026-05-29 组建计划去除整屏灰色背景复核

## 需求规格
- 目标：按用户最新反馈复核“组建计划去掉整个灰色背景，与小万护航一样”的运行态效果，并修复验证中发现的产物未同步问题。
- 范围：只处理主向导外层 overlay 透明背景的复核、构建产物同步和记录更新；不继续推进执行模式下拉菜单、内部弹窗、请求构建、创建/提交或真实投放链路。
- 成功标准：源码和构建产物同步；`#am-wxt-keyword-overlay.open` 运行态无灰色/暗色整屏遮罩、无背景图、无整页 blur；主向导面板仍保持 `--am26-*` 浅玻璃工作台；测试、构建检查、语法检查、空白检查和 `@chrome` 只读验收通过。

## 执行计划（可核对）
- [x] 回顾 UI 规范、审计表、历史教训和既有去灰底切片记录。
- [x] 核对 `src/` 中 overlay 最终样式，确认只需复核与同步产物，不扩大源码改动。
- [x] 运行构建同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- [x] 运行组建计划相关测试、构建检查、语法检查、extension bundle 检查和空白检查。
- [x] 用 `@chrome` 在真实 `one.alimama.com` 页面只打开组建计划验收外层透明背景，不点击创建/提交。
- [x] 回填复核记录、截图路径、风险和复盘。

## 高层操作摘要
- 复核发现源码中 `#am-wxt-keyword-overlay` 已是 `background: transparent`、`backdrop-filter: none`，但初次 `npm run build:check` 失败，提示根 userscript 未与 `src/` 同步。
- 已运行 `npm run build` 重新同步根 userscript、`dist/packages/` 和 `dist/extension/page.bundle.js`，随后构建检查恢复通过。
- `@chrome` 复核只展开主面板并点击 `组建计划`，没有点击 `提交创建`、`批量创建`、`生成其他策略` 或任何真实创建/提交入口。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `npm run build:check`：通过；初次失败原因是根 userscript 未同步，构建后已恢复。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs tests/keyword-wizard-entry-regression.test.mjs tests/matrix-plan-config.test.mjs`：通过，49/49。
- `node --test tests/crowd-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs`：通过，37/37。
- `npm run check:syntax`：通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `git diff --check -- src/optimizer/keyword-plan-api/wizard-style-and-state/style.js tests/keyword-home-strategy-batch-actions.test.mjs tasks/todo.md tasks/ui-gap-audit-2026-05-29.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过。
- `@chrome` 运行态复核：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7` 人群推广页，刷新后点击插件悬浮球与 `组建计划` 打开主向导；运行态确认 `#am-wxt-keyword-overlay.open` 为 `display:flex`、`background-color: rgba(0, 0, 0, 0)`、`background-image: none`、`backdrop-filter: none`，最终 CSS 覆盖块命中 `background: transparent; backdrop-filter: none; -webkit-backdrop-filter: none;`，且不包含旧 `rgba(27, 36, 56, 0.28)` 或 overlay 规则内 `blur(10px)`；`#am-wxt-keyword-modal` 仍为 1320px 宽、18px 圆角、浅玻璃背景、`var(--am26-shadow)` 阴影和 `blur(20px) saturate(1.4)` 面板模糊；控制台 error/warn 为 0。截图见 `tasks/ui-audit-keyword-wizard-no-gray-overlay-chrome-2026-05-29-recheck.png`。验收后关闭主向导，确认 overlay 隐藏、modal 不可见。

## 结果复盘
- 结果：组建计划整屏灰色背景已按小万护航方式移除，复核中发现并修复了构建产物未同步问题。
- 风险：本轮只同步产物并复核主向导外层视觉，不改变内部弹窗、执行模式下拉菜单、批量编辑、矩阵配置、请求构建或真实创建/提交链路。
- 回滚方式：还原 `src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`、`tests/keyword-home-strategy-batch-actions.test.mjs`、本次构建产物、截图和任务/审计记录即可。

---

# TODO - 2026-05-29 组建计划执行模式下拉菜单 token 收敛

## 需求规格
- 目标：继续迁移组建计划首页内容区，将执行模式下拉菜单容器、菜单项、hover/active 态从硬编码白底/蓝色状态收敛到统一 `--am26-*` 浅玻璃 token。
- 范围：只改执行模式下拉菜单 CSS 与专项断言；不改执行模式切换、并发数调整、提交按钮、日志写入、请求构建、批量创建、提交创建或真实投放链路。
- 成功标准：`#am-wxt-keyword-run-mode-menu` 和 scoped `.am-wxt-run-mode-menu` 使用 `--am26-panel-strong` / `--am26-border` / `--am26-shadow` / `--am26-text-soft` / `--am26-primary-strong` 等 token；旧 `#fff`、`#334155`、`#1d4ed8`、`rgba(37,99,235,...)` 不再作为该菜单最终样式事实源；专项测试、构建检查和 `@chrome` 只读验收完成。

## 执行计划（可核对）
- [x] 回顾 UI 规范、审计表和上一轮执行模式数量徽标验收结果。
- [ ] 将执行模式下拉菜单容器、菜单项、hover/active 态收敛到 `--am26-*` token。
- [ ] 更新专项断言，防止菜单回退到白底、硬编码深灰字和旧蓝色状态。
- [ ] 构建同步产物，并运行专项测试、构建检查、语法检查和空白检查。
- [ ] 用 `@chrome` 在真实 `one.alimama.com` 页面只打开组建计划并展开执行模式菜单验收，不点击提交创建/批量创建。
- [ ] 回填审计报告、验证记录、风险和复盘。

## 高层操作摘要
- 上一轮已收敛执行模式数量徽标，但真实页验收可见菜单容器仍是白底浅蓝渐变，菜单项 hover/active 仍使用硬编码蓝色状态。
- 本轮只处理菜单视觉事实源；打开下拉菜单用于验收，不选择菜单项、不调整并发数、不触发任何提交。

## 验证记录
- 待执行。

## 结果复盘
- 待补充。

---

# TODO - 2026-05-29 组建计划首页底部提交条与快捷日志 token 收敛

## 需求规格
- 目标：继续迁移组建计划首页内容区，将底部提交摘要条、执行模式数量徽标和快捷日志区从硬编码白/灰底收敛到统一 `--am26-*` 浅玻璃 token。
- 范围：只改主向导首页底部提交条、提交摘要、执行模式数量徽标、快捷日志面板和快捷日志行的 CSS 与专项断言；不改提交按钮行为、执行模式切换、日志写入格式、请求构建、批量创建、提交创建或真实投放链路。
- 成功标准：底部提交条与快捷日志区域使用 `--am26-surface*` / `--am26-border*` / `--am26-text*` / `--am26-primary*` / 语义色 token；旧 `#fff`、`#f8fafc`、`#475569`、`#64748b` 不再作为这些区域最终样式事实源；专项测试、构建检查和 `@chrome` 只读验收完成。

## 执行计划（可核对）
- [x] 回顾 UI/图标规范、审计表和组建计划首页底部/日志区现状。
- [x] 将底部提交条、提交摘要、执行模式数量徽标和快捷日志区收敛到 `--am26-*` token。
- [x] 更新专项断言，防止该区域回退到硬编码白/灰底与灰色文字。
- [x] 构建同步产物，并运行专项测试、构建检查、语法检查和空白检查。
- [x] 用 `@chrome` 在真实 `one.alimama.com` 页面只打开组建计划首页验收底部提交条和快捷日志区，不点击提交创建/批量创建。
- [x] 回填审计报告、验证记录、风险和复盘。

## 高层操作摘要
- 本轮选择主向导首页可安全验收区域：打开组建计划即可观察底部提交条和快捷日志区，不需要进入详情弹窗，也不需要触发任何创建提交。
- 当前缺口集中在 `.am-wxt-strategy-footer`、`.am-wxt-submit-summary`、`.am-wxt-run-mode-count`、`.am-wxt-quick-log-panel`、`.am-wxt-quick-log-title`、`#am-wxt-keyword-quick-log` 和日志行色值；本轮不扩大到计划列表、提交确认弹窗或其它场景弹窗。
- 已将底部提交条、提交摘要、快捷日志面板、日志标题、日志容器和日志行切到 `--am26-border`、`--am26-surface`、`--am26-surface-strong`、`--am26-text-soft` 与 `--am26-primary-strong`。
- `@chrome` 初次验收发现执行模式下拉菜单里的并发数量徽标仍是旧白底/蓝紫边框；已将 `#am-wxt-keyword-run-mode-menu .am-wxt-run-mode-count` 一并收敛到 `--am26-*`，并补专项断言防回退。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs tests/crowd-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs`：通过，54/54；新增覆盖底部提交条、提交摘要、执行模式数量徽标、执行模式下拉菜单数量徽标和快捷日志区 token 收敛。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `git diff --check -- src/optimizer/keyword-plan-api/wizard-style-and-state/style.js tests/keyword-home-strategy-batch-actions.test.mjs tasks/todo.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过，无空白格式问题。
- `@chrome` 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7` 人群推广页，刷新后只点击插件悬浮球与 `组建计划` 打开主向导首页；未点击 `提交创建`、`批量创建`、`生成其他策略` 或任何真实创建/提交入口。运行态确认底部提交条 `background-color: rgba(255, 255, 255, 0.45)`、`border-top-color: rgba(255, 255, 255, 0.4)`、提交摘要文字 `rgb(80, 90, 116)`、强调数字 `rgb(29, 63, 207)`；快捷日志面板/容器为 `rgba(255, 255, 255, 0.25)` 与 `rgba(255, 255, 255, 0.4)` 边框，日志行文字 `rgb(80, 90, 116)`；执行模式下拉菜单打开后可见并发数量徽标背景 `rgba(255, 255, 255, 0.25)`、边框 `rgba(255, 255, 255, 0.4)`、文字 `rgb(80, 90, 116)`。注入 CSS 命中底部/日志/菜单徽标 `--am26-*` token，旧白底/灰字/蓝紫徽标回退块均不存在，控制台 error/warn 为空。截图见 `tasks/ui-audit-keyword-footer-log-token-chrome-2026-05-29.png`。验收后关闭主向导，确认 `overlayOpen=false`、执行模式菜单、详情页和二级弹窗均无残留。

## 结果复盘
- 结果：完成组建计划首页底部提交条、执行模式数量徽标和快捷日志区 token 收敛，并在真实页复验中补齐执行模式下拉菜单数量徽标漏项。
- 风险：本轮只改首页底部/日志相关 CSS 与静态断言，不改提交按钮绑定、执行模式切换逻辑、日志写入格式、请求构建或真实创建提交链路；真实页面验收只打开、展开菜单和关闭向导。
- 回滚方式：还原 `src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`、`tests/keyword-home-strategy-batch-actions.test.mjs`、本次构建产物、截图和任务/审计记录即可。

---

# TODO - 2026-05-29 组建计划屏蔽人群弹窗已选区 token 收敛

## 需求规格
- 目标：继续迁移组建计划内部内容区，将“设置过滤人群”弹窗右侧已选区、已选行、空状态和脚注从硬编码白/灰底收敛到统一 `--am26-*` 浅玻璃 token。
- 范围：只改屏蔽人群设置弹窗已选区相关 CSS 与专项断言；不改候选勾选数据、移除事件、保存映射、请求构建、创建/提交或真实投放链路。
- 成功标准：已选区标题、行、空状态、脚注使用 `--am26-surface` / `--am26-surface-strong` / `--am26-border` / `--am26-text*`，保留 24px close 图标按钮与省略保护；专项测试、构建检查和 `@chrome` 只读验收完成。

## 执行计划（可核对）
- [x] 回顾 UI/图标规范、审计表和上一轮屏蔽人群弹窗验收路径。
- [x] 将屏蔽人群弹窗已选区标题、已选行、空状态、脚注收敛到 `--am26-*` token。
- [x] 更新专项断言，防止回退到 `#fff` / `#f8fafc` / `#334155` / `#64748b` 作为该区域样式事实源。
- [x] 构建同步产物，并运行专项测试、构建检查、语法检查和空白检查。
- [x] 用 `@chrome` 在真实 `one.alimama.com` 页面只打开屏蔽人群设置弹窗验收，不点击确定/保存/提交创建。
- [x] 回填审计报告、验证记录、风险和复盘。

## 高层操作摘要
- 本轮复用上一切片已验证的安全路径：打开组建计划 -> 第 4 条计划详情 -> 人群推广 -> 自定义推广 -> 设置过滤人群；只做弹窗内临时勾选和取消，不保存过滤人群。
- 当前缺口集中在 `.am-wxt-scene-filter-selected-head`、`.am-wxt-scene-filter-selected-row`、`.am-wxt-scene-filter-selected-empty`、`.am-wxt-scene-filter-footnote` 的硬编码白/灰/深灰色；本轮不扩大到整个筛选弹窗。
- 已将已选区标题、已选行、空状态和脚注统一切到 `--am26-border`、`--am26-surface`、`--am26-surface-strong`、`--am26-text` 和 `--am26-text-soft`，保留上一轮 close 图标按钮、ARIA、title 与行内省略保护。
- 已在 `tests/crowd-custom-native-parity-ui.test.mjs` 增加断言，锁定该区域不回退到硬编码白/灰底与灰色文字。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/crowd-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs tests/keyword-home-strategy-batch-actions.test.mjs`：通过，53/53；覆盖屏蔽人群已选区 token、已选列表 close 图标按钮、通用场景弹窗和首页计划区回归。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `@chrome` 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7` 人群推广页，延续上一轮安全路径进入第 4 条计划详情，只打开 `设置过滤人群` 弹窗；先验证空状态，再临时勾选 `18-24岁` 生成已选行。运行态确认已选区标题、空状态、脚注和已选行 CSS 均命中 `--am26-*` token，旧 `#f8fafc` / `#fff` / `#334155` / `#64748b` 回退块不存在；已选行计算样式为背景 `rgba(255, 255, 255, 0.45)`、边框 `rgba(255, 255, 255, 0.4)`、文字 `rgb(27, 36, 56)`，控制台 error/warn 为空。截图见 `tasks/ui-audit-keyword-crowd-filter-token-chrome-2026-05-29.png`。随后点击 `取消` 关闭弹窗，确认 `popupExists=false`、过滤摘要仍为 `未设置过滤`，临时勾选未保存。

## 结果复盘
- 结果：完成组建计划屏蔽人群弹窗已选区 token 收敛，空状态、已选行和脚注不再以硬编码白/灰底作为样式事实源。
- 风险：本轮只改弹窗右侧已选区视觉和断言，不改过滤候选、保存映射、请求构建或创建提交；真实页面验收只临时勾选并取消，没有保存过滤人群。
- 回滚方式：还原 `src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`、`tests/crowd-custom-native-parity-ui.test.mjs`、本次构建产物、截图和任务/审计记录即可。

---

# TODO - 2026-05-29 关键词向导弹窗单版设计稿重绘

## 需求规格
- 目标：根据上一轮 UI 问题诊断，重新生成一张更接近可落地实现的“关键词推广批量建计划 API 向导”弹窗设计稿图片。
- 范围：仅新增静态设计稿 HTML/CSS 与导出 PNG，不修改插件源码、构建产物、真实创建/提交链路或线上页面状态。
- 成功标准：图片清晰表达“商品选择 -> 计划配置 -> 提交确认”的核心流程；去除无功能装饰背景，强化层级、目标成本输入、底部提交确认和风险摘要；设计稿文件落在 `tasks/keyword-wizard-redesign-final-2026-05-29/`；通过本地浏览器渲染截图与图片查看验证非空、无明显溢出和遮挡。

## 执行计划（可核对）
- [x] 回顾项目 UI/图标规范和上一轮诊断要点，确定单版设计方向。
- [x] 创建独立静态设计稿页面，复刻阿里妈妈后台页面环境中的插件弹窗。
- [x] 用本地服务和浏览器截图导出 PNG 设计稿。
- [x] 目视检查图片可读性、层级、提交区、文字/控件无明显重叠。
- [x] 回填导出路径、验证记录和复盘。

## 高层操作摘要
- 本轮只生成设计稿图片，不触发真实页面创建、提交、保存或投放。
- 设计方向采用项目浅色玻璃工作台规范，但弱化顶部装饰，优先服务批量建计划的核对与提交。
- 已新增静态设计稿 `tasks/keyword-wizard-redesign-final-2026-05-29/index.html`，模拟阿里妈妈后台环境中的插件弹窗。
- 设计稿将原始弹窗重构为标题摘要、三步流程、三栏内容区和底部固定提交确认栏；目标成本输入高亮，日志默认折叠，右侧集中展示创建风险。
- 初版截图发现中央表格目标成本列被右侧确认区挤压；已收窄两侧栏、压缩表格列宽并重新导出最终 PNG。

## 验证记录
- `python3 -m http.server 6173 --bind 127.0.0.1`：通过，本地服务可访问 `http://127.0.0.1:6173/index.html`。
- `curl -I http://127.0.0.1:6173/index.html`：通过，返回 200。
- `Browser` 插件渲染页面成功，但截图接口连续在 `Page.captureScreenshot` 超时；改用本机 headless Chrome 导出静态 PNG。
- `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome --headless=new --disable-gpu --hide-scrollbars --window-size=1365,768 --screenshot=... http://127.0.0.1:6173/index.html`：通过，生成最终截图。
- `file tasks/keyword-wizard-redesign-final-2026-05-29/keyword-wizard-final-redesign.png`：PNG，尺寸 `1365 x 768`。
- `git diff --check -- tasks/todo.md tasks/keyword-wizard-redesign-final-2026-05-29/index.html`：通过。
- `view_image` 目视检查最终 PNG：弹窗主体完整，三步流程、商品选择、计划表、目标成本、右侧提交确认和底部提交栏可读；未发现明显文字/控件重叠，底部提交栏未遮挡内容。

## 结果复盘
- 结果：已生成一张单版重绘设计稿 `tasks/keyword-wizard-redesign-final-2026-05-29/keyword-wizard-final-redesign.png`，用于后续按该方向实现插件弹窗。
- 风险：这是静态设计稿，不代表真实插件交互已实现；若进入实现，需要再改 `src/`、补专项测试并做真实页面只读/受保护验收。
- 回滚方式：删除 `tasks/keyword-wizard-redesign-final-2026-05-29/` 并还原本节 `tasks/todo.md` 记录即可。

---

# TODO - 2026-05-29 组建计划屏蔽人群移除按钮 UI 规范迁移

## 需求规格
- 目标：继续迁移组建计划内部内容区，将“屏蔽人群设置”已选列表里的文字“移除”按钮收敛为共享 close 图标按钮，并补齐可访问名称和可见焦点态。
- 范围：只改屏蔽人群设置弹窗已选列表中 `[data-scene-popup-filter-remove]` 按钮的 DOM/CSS 与专项断言；不改筛选项增删数据结构、保存映射、请求构建、创建/提交或真实业务链路。
- 成功标准：已选屏蔽人群行的移除按钮为 `button type="button"`，使用 `renderAmIcon('close')`，具备 `aria-label`、`title`、局部 class、hover 危险态和 `focus-visible`；专项测试、构建检查和 `@chrome` 只读验收完成。

## 执行计划（可核对）
- [x] 回顾 UI/图标规范、审计表和组建计划内部剩余文字移除按钮缺口。
- [x] 将屏蔽人群设置已选列表移除按钮从纯文字迁移为共享 close 图标按钮，并保留原 data 标识。
- [x] 为该按钮补齐局部 token/focus/hover 样式，不扩大影响其它通用按钮。
- [x] 更新专项断言，防止回退为裸文字“移除”、无可访问名称或无 focus-visible。
- [x] 构建同步产物，并运行专项测试、构建检查、语法检查和空白检查。
- [x] 用 `@chrome` 在真实 `one.alimama.com` 页面只打开组建计划屏蔽人群设置弹窗验收，不点击保存/提交创建。
- [x] 回填审计报告、验证记录、风险和复盘。

## 高层操作摘要
- 已确认并发日志弹窗在 `tasks/todo.md` 中已有 `@chrome` 安全运行态验收记录，审计表“仍需验收”属于过期记录，本轮先修正审计状态。
- 已确认本切片优先处理组建计划“少量通用移除按钮仍以文字为主”的剩余缺口；先从屏蔽人群设置已选列表开始，保持单点迁移和单点验收。
- 本轮不保存屏蔽人群设置、不点击 `确定`、不点击 `保存并关闭`、不触发 `批量创建` 或 `提交创建`。
- 已将已选屏蔽人群行的移除按钮改为 `button.am-wxt-scene-filter-remove`，内容使用 `renderAmIcon('close')`，保留 `[data-scene-popup-filter-remove]` 事件委托入口，并补齐 `aria-label` 与 `title`。
- 已为该按钮补齐 24px 圆形图标热区、局部 token 背景、危险 hover、可见 `focus-visible`，并为已选行文本增加省略保护。
- 已在 `tests/crowd-custom-native-parity-ui.test.mjs` 增加断言，防止回退成通用 `.am-wxt-btn` 文字“移除”、缺少共享 close 图标或缺少焦点态。
- `@chrome` 验收只在弹窗内临时勾选 `18-24岁` 生成已选行，随后点击 `取消` 关闭弹窗；详情页仍显示 `未设置过滤`，临时勾选未保存。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/crowd-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs tests/keyword-home-strategy-batch-actions.test.mjs`：通过，53/53；覆盖屏蔽人群已选列表 close 图标按钮、通用场景弹窗、AI 点睛和首页计划区回归。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `@chrome` 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7` 人群推广页，刷新后打开主面板 -> `组建计划`，进入第 4 条计划详情，将场景切到 `人群推广`，营销目标切到 `自定义推广`，只点击 `设置过滤人群` 打开弹窗；未点击 `确定`、`保存并关闭`、`批量创建` 或 `提交创建`。弹窗内临时勾选 `18-24岁` 生成已选行后，运行态确认移除按钮为 `BUTTON type="button"`、类名 `am-wxt-scene-filter-remove`、`data-scene-popup-filter-remove="age:18-24"`、可见文本为空、`aria-label="移除已选屏蔽人群：18-24岁"`、`title="移除已选屏蔽人群"`、包含 `svg.am-ui-icon.am-ui-icon-close`；计算样式为 24px 正圆、`display:flex` 居中、背景 `rgba(255, 255, 255, 0.25)`、边框 `rgba(148, 163, 184, 0.24)`，注入 CSS 包含危险 hover 与 `.am-wxt-scene-filter-remove:focus-visible`；旧文字移除按钮数量为 0，控制台 error/warn 为空。截图见 `tasks/ui-audit-keyword-crowd-filter-remove-chrome-2026-05-29.png`。随后点击 `取消` 关闭弹窗，确认 `popupExists=false`、详情仍打开且过滤摘要为 `未设置过滤`，再关闭详情页和主向导，最终 `wizardOpen=false`。

## 结果复盘
- 结果：完成组建计划屏蔽人群设置已选列表移除按钮迁移，按钮已从文字“移除”收敛为共享 close 图标按钮，并具备可访问名称、title、局部 hover/focus 样式和运行态证据。
- 风险：本轮只改已选列表移除按钮的 DOM/CSS/断言，不改变过滤人群候选、保存映射、请求构建或创建提交链路；真实页面验收只做临时弹窗内勾选并取消，没有保存过滤人群。
- 回滚方式：还原 `src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-crowd-popup.js`、`src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`、`tests/crowd-custom-native-parity-ui.test.mjs`、本次构建产物、截图和任务/审计记录即可。

---

# TODO - 2026-05-29 关键词向导新设计图片方案

## 需求规格
- 目标：按用户要求，根据上一轮设计问题诊断，为当前“关键词推广批量建计划 API 向导”重新生成 5 张弹窗设计方案图，用于快速评审结构、层级和视觉方向。
- 范围：仅新增静态设计稿 HTML 与导出 PNG，不修改插件源码、构建产物、真实创建/提交链路或线上页面状态。
- 成功标准：5 张图片均能清楚表达“商品选择 -> 计划配置 -> 提交确认”的核心流程；符合插件浅色玻璃工作台规范；图片文件落在 `tasks/keyword-wizard-redesign-concepts-2026-05-29/`；通过本地渲染和图片查看验证非空、无明显溢出和遮挡。

## 执行计划（可核对）
- [x] 回顾项目 UI 规范、图标规范和当前向导截图问题。
- [x] 创建独立静态设计稿页面，覆盖 5 个不同布局方向。
- [x] 通过本地渲染导出 5 张 PNG。
- [x] 检查图片可读性、首屏完整性、文字/控件无明显重叠。
- [x] 回填导出路径、验证记录和复盘。

## 高层操作摘要
- 已确认本轮是设计图片产出，不进入真实页面写操作，不点击任何创建/提交入口。
- 已确认设计基调沿用项目“浅色玻璃工作台、高密度、强确认”的插件 UI 规范。
- 已发现该任务目录只有 `.DS_Store`，旧记录提到的 5 张 PNG 实际不存在；本轮按最新用户要求重新生成。
- 已新增独立静态设计稿 `tasks/keyword-wizard-redesign-concepts-2026-05-29/concepts.html`，包含 5 个方案方向：三步流程工作台、左右分栏调度台、提交审查优先、紧凑插件浮层、表格增强与右侧检查器。
- `Browser` 插件安全策略拒绝打开本地 `file://` 页面，改用本地 SVG + `sharp` 渲染 PNG，不触发浏览器访问本地文件。
- 已新增 `tasks/keyword-wizard-redesign-concepts-2026-05-29/render-concepts.mjs`，生成 5 张 SVG 源稿和 5 张 PNG 图片，并写入 `manifest.json`。
- 目视检查时发现并修正两处设计稿排版问题：方案 02 窄栏商品名溢出、方案 04/05 底部提交栏遮挡内容。

## 验证记录
- `node tasks/keyword-wizard-redesign-concepts-2026-05-29/render-concepts.mjs`：通过，已生成 `keyword-wizard-redesign-01.png` 到 `keyword-wizard-redesign-05.png`，同步生成 SVG 源稿和 `manifest.json`。
- `file tasks/keyword-wizard-redesign-concepts-2026-05-29/keyword-wizard-redesign-*.png`：5 张均为 PNG，尺寸均为 `1280 x 922`。
- `node --check tasks/keyword-wizard-redesign-concepts-2026-05-29/render-concepts.mjs`：通过。
- `git diff --check -- tasks/todo.md tasks/keyword-wizard-redesign-concepts-2026-05-29/concepts.html tasks/keyword-wizard-redesign-concepts-2026-05-29/render-concepts.mjs`：通过。
- `view_image` 目视检查 5 张 PNG：弹窗主体完整，方案标题、商品/计划/目标成本/预算/提交确认信息可读，未发现明显文字或控件重叠；方案 02、04、05 的初版排版问题已修正后复查通过。

## 结果复盘
- 结果：已完成 5 张新设计方向图，作为后续选择实现方案的评审稿；本轮没有修改插件源码或构建产物，也没有触发真实页面创建/提交。
- 风险：这是静态设计稿，不代表真实插件交互已实现；若选定某一版，需要再进入源码迁移、专项测试和真实页面只读/受保护验收。
- 回滚方式：删除 `tasks/keyword-wizard-redesign-concepts-2026-05-29/` 并还原本节 `tasks/todo.md` 记录即可。

---

# TODO - 2026-05-29 组建计划去除整屏灰色背景

## 需求规格
- 目标：按用户反馈，将组建计划主向导去掉整屏灰色/暗色背景，呈现为和小万/算法护航一致的独立浅玻璃工作台面板。
- 范围：只改组建计划主向导外层 overlay 的视觉背景、模糊和相关静态断言；不改向导 modal 尺寸、内部弹窗、AI 点睛、批量编辑、矩阵配置、请求构建、创建/提交或真实投放链路。
- 成功标准：`#am-wxt-keyword-overlay` 打开后不再绘制灰色/暗色整屏遮罩，也不再模糊整页背景；`#am-wxt-keyword-modal` 保持 `--am26-*` 浅玻璃、1320px 工作台宽度、18px 圆角、低对比边框和可见 focus；专项测试、构建检查和 `@chrome` 只读验收完成。

## 执行计划（可核对）
- [x] 回顾 UI 规范和组建计划现状，确认本切片只处理主向导外层背景。
- [x] 将组建计划最终生效 overlay 改为透明背景，并移除整页 backdrop blur。
- [x] 更新组建计划主弹窗外壳专项断言，防止回退到灰色/暗色整屏遮罩。
- [x] 构建同步产物，并运行组建计划相关专项测试、构建检查、语法检查和空白检查。
- [x] 用 `@chrome` 在真实 `one.alimama.com` 页面打开组建计划，验证整屏灰底消失、面板仍正常可见，不点击创建/提交。
- [x] 回填审计报告、验证记录、风险和复盘。

## 高层操作摘要
- 已确认用户最新优先级是“组建计划的去掉整个灰色背景与小万护航一样的方式”，需优先于未完成的通用场景弹窗焦点约束切片。
- 已确认当前外层背景缺口集中在 `#am-wxt-keyword-overlay` 的最终覆盖样式；本轮不改变内部弹窗和任何提交链路。
- 已将组建计划基础 overlay、前置玻璃覆写和最终 `--am26-*` 覆写都改为 `background: transparent`、`backdrop-filter: none`，保留 `#am-wxt-keyword-modal` 自身浅玻璃材质。
- 已更新组建计划主弹窗专项断言，明确禁止最终 overlay 回退到 `rgba(27, 36, 56, 0.28)` 与 `blur(10px)` 的整屏灰底。

## 验证记录
- `node --check src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`：通过。
- `node --check src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-grid.js`：通过；同步覆盖上一段通用场景弹窗焦点改动的语法状态。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs tests/keyword-wizard-entry-regression.test.mjs tests/matrix-plan-config.test.mjs`：通过，48/48；新增外层 overlay 透明背景、禁止灰色遮罩/整页 blur 回退断言。
- `node --test tests/crowd-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs`：通过，37/37；同步确认未破坏通用场景弹窗与 AI 点睛/自定义推广配置弹窗断言。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `git diff --check -- src/optimizer/keyword-plan-api/wizard-style-and-state/style.js src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-grid.js tests/keyword-home-strategy-batch-actions.test.mjs tests/crowd-custom-native-parity-ui.test.mjs tasks/todo.md tasks/ui-gap-audit-2026-05-29.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过，无空白格式问题。
- `@chrome` 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7` 人群推广页，刷新后只点击插件悬浮球与 `组建计划` 打开主向导；未点击 `提交创建`、`批量创建` 或任何真实创建/提交入口。运行态确认 `#am-wxt-keyword-overlay.open` 计算样式为 `display:flex`、`background-color: rgba(0, 0, 0, 0)`、`background-image: none`、`backdrop-filter: none`，最终覆盖 CSS 命中 `background: transparent; backdrop-filter: none; -webkit-backdrop-filter: none;`，且不包含旧 `rgba(27, 36, 56, 0.28)` / `blur(10px)` 规则。`#am-wxt-keyword-modal` 仍为 1320px 宽、18px 圆角、`var(--am26-panel-strong)` 浅玻璃背景、`var(--am26-shadow)` 阴影和 `blur(20px) saturate(1.4)` 面板模糊；控制台 error/warn 为空。截图见 `tasks/ui-audit-keyword-wizard-no-gray-overlay-chrome-2026-05-29.png`。验收后点击关闭，确认 `overlayOpen=false`、`modalVisible=false`。

## 结果复盘
- 结果：完成组建计划主向导去除整屏灰色背景，外层 overlay 不再遮灰或模糊整页，视觉呈现为独立浅玻璃工作台面板，和小万/算法护航的工作台方式一致。
- 风险：本轮只改外层视觉背景与静态断言；不改变向导打开、内部弹窗、批量编辑、矩阵配置、请求构建或创建提交链路。真实页面验收只打开并关闭向导，没有触发任何创建/提交。
- 回滚方式：还原 `src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`、`tests/keyword-home-strategy-batch-actions.test.mjs`、本次构建产物、截图和任务/审计记录即可。

---

# TODO - 2026-05-29 组建计划通用场景弹窗焦点约束

## 需求规格
- 目标：继续迁移组建计划内部内容区，补齐通用场景配置弹窗的标题关联、默认聚焦、Tab 焦点约束和关闭后回焦。
- 范围：只改 `openScenePopupDialog()` 公共弹窗壳层的 ARIA 与键盘焦点管理；不改高级设置、AI 点睛、人群、资源位、地域、时段等弹窗的保存映射、请求构建、提交创建或真实业务链路。
- 成功标准：通用场景弹窗具备稳定 `aria-labelledby`；打开后默认聚焦到指定控件或首个可聚焦控件；Tab/Shift+Tab 在弹窗内循环；Esc/关闭/取消后恢复到打开前焦点；专项测试、构建检查和 `@chrome` 只读验收完成。

## 执行计划（可核对）
- [x] 回顾组建计划审计项，确认本切片只处理通用场景弹窗焦点约束。
- [x] 为 `openScenePopupDialog()` 增加稳定标题 id 与 `aria-labelledby`。
- [x] 增加弹窗内可聚焦元素收集、默认聚焦、Tab/Shift+Tab 焦点循环和关闭后回焦。
- [x] 更新组建计划弹窗专项断言，防止无标题关联、默认不聚焦或 Tab 逃出弹窗回退。
- [x] 构建同步产物，并运行专项测试、构建检查、语法检查和空白检查。
- [x] 用 `@chrome` 在真实 `one.alimama.com` 页面打开组建计划通用场景弹窗验收焦点，不点击保存/提交创建。
- [x] 回填审计报告、验证记录、风险和复盘。

## 高层操作摘要
- 已确认本切片对应审计表中“通用场景弹窗默认不聚焦，缺少完整 focus trap”的缺口。
- 已确认主要公共 helper 为 `render-scene-dynamic-grid.js` 中的 `openScenePopupDialog()`；本轮不触碰各弹窗 `onSave`、业务数据回写或创建提交链路。
- 当前实现已在公共弹窗壳层补齐 `am-wxt-scene-popup-title`、打开前焦点记录、默认焦点解析、可聚焦元素收集、Tab/Shift+Tab 循环、Esc 关闭、关闭时事件解绑和关闭后回焦。
- 当前专项断言已覆盖稳定标题关联、前置焦点记录、可聚焦元素收集、默认焦点兜底、Tab 循环、Esc 关闭、事件解绑、关闭后回焦和打开后默认聚焦。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/crowd-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs tests/keyword-home-strategy-batch-actions.test.mjs`：通过，53/53；覆盖通用场景弹窗标题关联、默认聚焦、Tab/Shift+Tab 焦点循环、Esc 关闭、事件解绑、关闭后回焦，以及 AI 点睛/批量编辑相关弹窗回归。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `@chrome` 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7` 人群推广页，打开主面板 -> `组建计划`，悬停第 4 条自定义推广计划行并点击 `编辑` 进入详情，只点击 `投放资源位/投放地域/分时折扣` 的 `编辑设置` 打开“高级设置”通用场景弹窗；未点击 `确定`、`保存并关闭`、`批量创建` 或 `提交创建`。运行态确认弹窗 `role="dialog"`、`aria-modal="true"`、`aria-labelledby="am-wxt-scene-popup-title"`、标题文本“高级设置”；打开后默认焦点在第 1 个可聚焦控件关闭按钮，弹窗内可聚焦控件共 12 个；在关闭按钮上按 `Shift+Tab` 后焦点循环到末项 `确定`，在 `确定` 上按 `Tab` 后焦点回到关闭按钮；按 `Escape` 后弹窗移除，焦点恢复到 `编辑设置` 触发按钮，详情页和主向导仍打开；控制台 error/warn 为空。截图见 `tasks/ui-audit-keyword-scene-popup-focus-trap-chrome-2026-05-29.png`。验收后已关闭主向导，确认 `popupExists=false`、`wizardOpen=false`、`detailVisible=false`。

## 结果复盘
- 结果：完成组建计划通用场景弹窗焦点约束迁移，公共 `openScenePopupDialog()` 已具备稳定标题关联、默认聚焦、Tab/Shift+Tab 循环、Esc 关闭、关闭后事件解绑和回焦。
- 风险：本轮只验证并收口公共弹窗壳层交互，不保存高级设置、不改写场景配置、不触发创建/提交；各具体弹窗保存映射和请求构建保持原逻辑。
- 回滚方式：还原 `src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-grid.js`、`tests/crowd-custom-native-parity-ui.test.mjs`、本次构建产物、截图和任务/审计记录即可。

---

# TODO - 2026-05-29 批量+ 确认弹窗宽度收敛

## 需求规格
- 目标：处理批量+ 确认弹窗卡片宽度偏小的问题，使多计划状态文案有更稳定的阅读空间。
- 范围：只改批量+ 自有确认弹窗卡片宽度和静态断言；不改批量开启、暂停、删除的选择、确认、提交、接口和真实写操作链路。
- 成功标准：确认弹窗卡片宽度从 `320px` 扩到 `360px`，仍保留移动端 `calc(100vw - 28px)` 约束、统一 token、18px 圆角和可见 focus；专项测试、构建检查和 `@chrome` 只读验收完成。

## 执行计划（可核对）
- [x] 回顾批量+ 审计项，确认本切片只处理确认弹窗宽度。
- [x] 将批量确认卡片宽度调整为 `min(360px, calc(100vw - 28px))`，不触碰确认逻辑。
- [x] 更新批量+ 专项断言，防止宽度回退到 320px。
- [x] 构建同步产物，并运行专项测试、构建检查、语法检查和空白检查。
- [x] 用 `@chrome` 在真实 `one.alimama.com` 页面只打开批量+ 确认弹窗并取消，不点击确认执行。
- [x] 回填审计报告、验证记录、风险和复盘。

## 高层操作摘要
- 已确认批量+ 菜单/确认弹窗图标、ARIA、token 化此前已完成，本轮只调整确认弹窗阅读宽度。
- 已确认确认弹窗由 `openBatchPlusConfirmDialog()` 生成，宽度只在 `src/main-assistant/ui.js` 样式中控制。
- 已将 `.am-batch-confirm-card` 宽度从 `min(320px, calc(100vw - 28px))` 调整为 `min(360px, calc(100vw - 28px))`，移动端约束保持不变。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/campaign-batch-plus-quick-entry.test.mjs`：通过，8/8；新增批量确认弹窗 360px 阅读宽度和禁止回退 320px 断言。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `git diff --check -- src/main-assistant/ui.js tests/campaign-batch-plus-quick-entry.test.mjs tasks/todo.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过，无空白格式问题。
- `@chrome` 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7` 人群推广页，先用 Playwright 勾选 1 条可见计划行，再只点击 `批量+` -> `批量暂停` 打开二次确认弹窗；未点击 `确认暂停`。运行态显示弹窗 `role="dialog"`、`aria-modal="true"`、标题为“确认暂停计划”，正文为“确认暂停选中的 1 个人群推广计划？...”，提交按钮文本“确认暂停”、取消按钮文本“取消”；卡片计算宽度 `360px`、`rectWidth=360`、18px 圆角、`var(--am26-panel-strong)` 对应浅玻璃背景，注入 CSS 命中 `width: min(360px, calc(100vw - 28px))` 且不包含 320px 回退；随后点击 `取消`，确认 `popupStillOpen=false`、`menuStillOpen=false`、控制台 error/warn 为空。验收后已将临时勾选的计划行恢复为未勾选。截图见 `tasks/ui-audit-batch-plus-confirm-width-chrome-2026-05-29.png`。

## 结果复盘
- 结果：完成批量+ 确认弹窗宽度收敛，二次确认卡片从 320px 扩到 360px，保留移动端约束和既有 token/ARIA/focus 规范。
- 风险：本轮没有点击确认按钮，不触发批量暂停/开启/删除接口；只验证二次确认弹窗打开、宽度和取消关闭。
- 回滚方式：还原 `src/main-assistant/ui.js`、`tests/campaign-batch-plus-quick-entry.test.mjs`、本次构建产物、截图和任务/审计记录即可。

---

# TODO - 2026-05-29 主面板 P2 局部样式收敛

## 需求规格
- 目标：继续收敛主面板剩余 P2 UI 规范差距，处理悬浮球 hover 过度缩放、日志区硬编码暗色和辅助开关 hover 边框硬编码。
- 范围：只改主面板静态 CSS 与对应断言；不改主面板入口行为、辅助显示配置、日志 API、工具按钮触发链路、真实页面业务动作。
- 成功标准：悬浮球 hover 不再使用 `scale(1.08)`，日志区使用统一浅玻璃 token/语义色，辅助开关 hover 使用 `--am26-*` token；专项测试、构建检查和 `@chrome` 只读验收完成。

## 执行计划（可核对）
- [x] 回顾审计项，确认本切片只处理主面板局部样式收敛。
- [x] 将悬浮球 hover 反馈改为更克制的位移/阴影/背景反馈，并保留减少动画适配。
- [x] 将日志区背景、边框、分隔线、时间色收敛到统一浅玻璃 token 与语义色。
- [x] 将辅助开关 hover 边框与弱态圆点收敛到统一 token，避免硬编码蓝紫/灰阶事实源。
- [x] 更新主面板专项断言，防止回退到 `scale(1.08)`、暗色日志底和硬编码 hover 边框。
- [x] 构建同步产物，并运行专项测试、构建检查、语法检查和空白检查。
- [x] 用 `@chrome` 在真实 `one.alimama.com` 页面打开主面板验收，只检查样式/DOM/控制台，不点击业务工具入口。
- [x] 回填审计报告、验证记录、风险和复盘。

## 高层操作摘要
- 已确认复制计划成功弹窗在此前切片已迁移完成，审计中的“旧文本 `!` 图标”是陈旧记录，本轮不重复处理。
- 已确认本轮只触碰主面板静态样式，不修改 `Logger`、辅助显示配置、工具按钮触发和任何业务链路。
- 已将悬浮球 hover 从 `translateY(-1px) scale(1.08)` 改为 `translateY(-2px)` + 统一浅玻璃表面和轻阴影反馈。
- 已将日志区背景、边框、分隔线、时间色收敛到 `--am26-surface`、`--am26-border` 和 `--am26-text-soft` 派生值。
- 已将辅助开关 hover 边框/背景和关闭态圆点收敛到统一 token/柔色，不再以硬编码蓝紫边框作为事实源。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/logger-api.test.mjs tests/magic-report-panel-resilience.test.mjs`：通过，20/20；新增主面板 P2 样式 token 和旧硬编码回退断言。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `git diff --check -- src/main-assistant/ui.js tests/logger-api.test.mjs tasks/todo.md tasks/ui-gap-audit-2026-05-29.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过，无空白格式问题。
- `@chrome` 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7` 人群推广页，刷新后只点击插件悬浮球、`辅助显示` 和日志 `展开`。运行态显示主面板打开、辅助显示展开、悬浮球为 `BUTTON type="button"`；注入 CSS 命中 `#am-helper-icon:hover { transform: translateY(-2px); background: var(--am26-surface-strong); ... }` 且不包含 `scale(1.08)`；日志展开态计算样式为 `background-color: rgba(255, 255, 255, 0.25)`、`border-top: 1px solid rgba(255, 255, 255, 0.4)`、轻量双层阴影；辅助开关 hover 规则使用 `var(--am26-border-strong)` 与 `var(--am26-surface-strong)`；控制台 error/warn 为空。未点击算法护航、组建计划、万能查数或任何业务工具入口。截图见 `tasks/ui-audit-main-panel-p2-chrome-2026-05-29.png`。

## 结果复盘
- 结果：完成主面板 P2 局部样式收敛，清理审计中的悬浮球过度缩放、日志区暗色硬编码、辅助开关 hover 硬编码边框等缺口。
- 风险：本轮只改主面板 CSS 与静态断言，不触碰工具入口和业务行为；运行态只做只读样式验收。
- 回滚方式：还原 `src/main-assistant/ui.js`、`tests/logger-api.test.mjs`、本次构建产物、截图和任务/审计记录即可。

---

# TODO - 2026-05-29 组建计划 AI 点睛屏蔽词删除按钮 UI 规范迁移

## 需求规格
- 目标：继续迁移组建计划内部内容区，处理 AI 点睛设置弹窗中屏蔽词 tag 的裸文本 `x` 删除按钮。
- 范围：只改屏蔽词 tag 删除按钮的 DOM 图标、可访问名称和局部焦点样式；不改 AI 点睛开关、模板、屏蔽词增删数据结构、保存映射、创建/提交链路。
- 成功标准：屏蔽词删除按钮使用共享 `renderAmIcon('close')`，具备 `type="button"`、`aria-label`、`title` 和可见 `focus-visible`；专项测试、构建检查和 `@chrome` 只读验收完成。

## 执行计划（可核对）
- [x] 回顾 AI 点睛弹窗审计项，确认本切片只处理屏蔽词删除按钮。
- [x] 将屏蔽词 tag 删除按钮从裸文本 `x` 替换为共享 close SVG，并补齐可访问名称。
- [x] 将屏蔽词 tag 与删除按钮样式收敛到局部 token/focus 规则，不扩大影响其它 tag。
- [x] 更新 AI 点睛专项断言，防止回退到裸文本 `x`、无 `aria-label` 或无 focus-visible。
- [x] 构建同步产物，并运行专项测试、构建检查、语法检查和空白检查。
- [x] 用 `@chrome` 在真实 `one.alimama.com` 页面只打开组建计划/AI 点睛设置弹窗验收，不点击保存或提交创建。
- [x] 回填审计报告、验证记录、风险和复盘。

## 高层操作摘要
- 已定位裸文本 `x` 位于 `renderShieldList()` 生成的 `[data-ai-max-shield-remove]` 按钮；删除逻辑通过事件委托读取 `data-ai-max-shield-remove` 和 `data-ai-max-shield-word`，本切片不改该逻辑。
- 已将删除按钮改为 `button.am-wxt-ai-max-shield-remove`，内容为 `renderAmIcon('close')`，并补齐 `aria-label="删除屏蔽词：..."` 与 `title="删除屏蔽词"`。
- 已将屏蔽词 tag 与删除按钮样式收敛到局部 `--am26-*` token，补齐 hover 危险色和 `focus-visible`，不扩大影响其它弹窗按钮或屏蔽词数据逻辑。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/keyword-custom-popup-config.test.mjs`：通过，26/26；新增 AI 点睛屏蔽词删除按钮共享 close SVG、`aria-label/title`、禁止裸文本 `x` 回退、局部 token 和 `focus-visible` 断言。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs`：通过，16/16。
- `node --test tests/matrix-plan-config.test.mjs`：通过，25/25。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `git diff --check -- src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-crowd-popup.js src/optimizer/keyword-plan-api/wizard-style-and-state/style.js tests/keyword-custom-popup-config.test.mjs tasks/todo.md tasks/ui-gap-audit-2026-05-29.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过，无空白格式问题。
- `node --check src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`：通过；`render-scene-dynamic-crowd-popup.js` 是构建拼接片段，直接 `node --check` 会因片段尾部闭包报 `Unexpected token '}'`，已用 `npm run build`、`npm run check:syntax` 和 extension bundle 语法检查覆盖完整产物。
- `@chrome` 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7` 人群推广页，打开主面板 -> `组建计划`，编辑第 4 个“自定义推广”计划，只点击 `AI点睛设置` 入口打开设置弹窗；待 AI 点睛生成完成后，弹窗显示“表达更多流量诉求 / 屏蔽词设置 / 已选需求”。为验证删除按钮，只在弹窗内临时添加“测试屏蔽词”，未点击保存；运行态显示删除按钮为 `BUTTON type="button"`、类名 `am-wxt-ai-max-shield-remove`、文本为空、`aria-label="删除屏蔽词：测试屏蔽词"`、`title="删除屏蔽词"`、包含 `svg.am-ui-icon.am-ui-icon-close`，按钮 16px 正圆、inline-flex 居中，tag 背景为 `rgba(69, 84, 229, 0.1)`，注入 CSS 包含 `.am-wxt-ai-max-shield-remove:focus-visible`；控制台 error/warn 为空。随后点击 `取消` 关闭弹窗，确认 `popupStillOpen=false`、向导仍打开且 `hasTempWordInOverlay=false`，临时词未保存。截图见 `tasks/ui-audit-keyword-ai-max-shield-remove-chrome-2026-05-29.png`。

## 结果复盘
- 结果：完成组建计划 AI 点睛屏蔽词删除按钮 UI 规范迁移，消除裸文本 `x`，补齐共享图标、可访问名称和可见焦点态。
- 风险：本轮只验证弹窗内临时添加词后的删除按钮 DOM/CSS，未点击“保存”，避免改写真实计划配置；删除事件委托和保存映射未改，由既有逻辑与专项测试覆盖。
- 回滚方式：还原 `src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-crowd-popup.js`、`src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`、`tests/keyword-custom-popup-config.test.mjs`、本次构建产物、截图和任务记录即可。

---

# TODO - 2026-05-29 组建计划批量编辑弹窗 UI 规范迁移

## 需求规格
- 目标：继续迁移组建计划内部内容区，先处理首页“批量编辑数值”弹窗的可见错误态、焦点态和局部样式 token。
- 范围：只改批量编辑数值弹窗的 DOM/CSS 与静态校验反馈；不改计划创建、提交、请求构建、矩阵物化、商品选择或真实批量创建链路。
- 成功标准：空提交或不适用目标成本时，错误在弹窗内以 `role="alert"` / `aria-live` 可见展示并聚焦回相关输入；数值表单、提示、禁用态、按钮 focus 使用 `--am26-*`/统一浅玻璃 token；专项测试、构建检查和 `@chrome` 只读验收完成。

## 执行计划（可核对）
- [x] 回顾组建计划内部内容区审计项，确认本切片只处理“批量编辑数值”弹窗。
- [x] 为批量编辑弹窗增加可见错误容器，并在校验失败时同步弹窗内错误、日志和输入焦点。
- [x] 将批量编辑数值表单的提示、输入、禁用态、错误态和按钮 focus 收敛到统一 token。
- [x] 更新组建计划专项断言，防止错误只写日志、旧白底/灰蓝硬编码和无 focus 回退。
- [x] 构建同步产物，并运行专项测试、构建检查、语法检查和空白检查。
- [x] 用 `@chrome` 在真实 `one.alimama.com` 页面打开组建计划 -> 批量编辑弹窗，只触发空表单校验，不点击批量创建/提交。
- [x] 回填审计报告、验证记录、风险和复盘。

## 高层操作摘要
- 已确认本切片对应审计表中“批量编辑弹窗校验失败只写向导日志，弹窗内没有可见错误状态区”的缺口。
- 已确认 `openBatchStrategyNumberEditPopup()` 只做已选计划表单回写，不触发真实创建/提交请求；`@chrome` 验收只会打开弹窗并触发空提交校验。
- 已为通用场景弹窗补齐 `aria-labelledby`、稳定标题 id 和 `role="alert"` / `aria-live="assertive"` 错误容器；批量数值弹窗空提交、目标成本不可用和字段格式异常均返回弹窗内错误与对应 `focusSelector`。
- 已将批量数值弹窗外壳、输入、禁用态、错误态和按钮局部覆盖收敛到 `--am26-*` 浅玻璃 token；通用 `.am-wxt-btn` 旧事实源保留，避免扩大影响其它场景弹窗。

## 验证记录
- `node --check src/optimizer/keyword-plan-api/wizard-scene-config/manual-keywords-and-detail.js`：通过。
- `node --check src/optimizer/keyword-plan-api/wizard-scene-config/batch-edit-popup.js`：通过。
- `node --check src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`：通过。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs`：通过，16/16；新增批量编辑弹窗标题关联、错误容器、校验失败 focus 回退、字段异常 `focusSelector`、局部 token 和按钮作用域断言。
- `node --test tests/keyword-wizard-entry-regression.test.mjs`：通过，7/7。
- `node --test tests/matrix-plan-config.test.mjs`：通过，25/25。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `git diff --check -- src/optimizer/keyword-plan-api/wizard-scene-config/manual-keywords-and-detail.js src/optimizer/keyword-plan-api/wizard-scene-config/batch-edit-popup.js src/optimizer/keyword-plan-api/wizard-style-and-state/style.js tests/keyword-home-strategy-batch-actions.test.mjs tasks/todo.md tasks/ui-gap-audit-2026-05-29.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过，无空白格式问题。
- `@chrome` 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7` 人群推广页，打开主面板 -> `组建计划`，确认向导样式已包含 `.am-wxt-scene-popup-dialog-batch-number`、`.am-wxt-scene-popup-error` 和局部按钮规则；4 个计划默认选中，点击 `批量编辑` 打开“批量修改数值（已选 4 个计划）”弹窗。弹窗 `role="dialog"`、`aria-modal="true"`、`aria-labelledby="am-wxt-scene-popup-title"`，错误节点 `role="alert"`、`aria-live="assertive"` 初始 hidden；弹窗计算样式为 560px 宽、18px 圆角、浅玻璃背景、`var(--am26-shadow)` 对应阴影、`blur(18px) saturate(1.35)`。只点击 `批量修改` 触发空表单校验，弹窗未关闭，错误条显示“请至少填写 1 个需要批量修改的数值字段”，错误 display 为 flex，颜色为 `rgb(234, 79, 79)`，焦点回到 `dayAverageBudget` 输入且 outline 为 solid 2px；控制台 error/warn 为空。未点击 `批量创建`、`提交创建` 或任何真实创建/提交入口。截图见 `tasks/ui-audit-keyword-batch-edit-popup-chrome-2026-05-29.png`。

## 结果复盘
- 结果：完成组建计划“批量编辑数值”弹窗 UI 规范迁移，解决校验失败只写日志、弹窗内无可见错误、无字段焦点回退，以及局部输入/按钮样式未对齐统一 token 的问题。
- 风险：目标成本不可用路径和非法数值路径由源码与专项断言覆盖，本轮 `@chrome` 只触发空提交校验，未提交有效批量修改，避免改变真实计划配置。
- 回滚方式：还原 `src/optimizer/keyword-plan-api/wizard-scene-config/manual-keywords-and-detail.js`、`src/optimizer/keyword-plan-api/wizard-scene-config/batch-edit-popup.js`、`src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`、`tests/keyword-home-strategy-batch-actions.test.mjs`、本次构建产物、截图和任务记录即可。

---

# TODO - 2026-05-29 算法护航 P2 控件样式收敛

## 需求规格
- 目标：继续收敛算法护航面板的手动设置区、窗口控制、启动按钮和输入控件，使其对齐统一 UI token、可见焦点态和减少动画规范。
- 范围：只改 `src/optimizer/ui.js` 中算法护航面板/手动设置预览的样式和静态控件语义；不改扫描、openV3 提交、弹窗读取、手动参数映射、Token 或 API 请求逻辑。
- 成功标准：手动设置区不再使用旧硬编码蓝紫/白底块作为事实源，卡片、输入、下拉、分段按钮、提示文案使用 `--am26-*` token；窗口控制、启动按钮、输入框、手动控件具备 `focus-visible`；动画有 `prefers-reduced-motion` 覆盖；专项测试、构建检查和 `@chrome` 安全验收完成。

## 执行计划（可核对）
- [x] 回顾算法护航 P2 审计项，确认只处理样式和可达性，不触碰真实提交链路。
- [x] 将手动设置面板的卡片、输入、下拉、分段按钮、提示文案收敛到 `--am26-*` token。
- [x] 为窗口图标按钮、启动按钮、输入框、手动设置按钮/输入/下拉/分段按钮补齐可见 `focus-visible`。
- [x] 增加算法护航 reduced-motion 覆盖，避免 panel/log/manual 控件使用不可关闭动效。
- [x] 更新算法护航专项静态断言，防止回退到旧硬编码色、无 focus 或无 reduced-motion。
- [x] 构建同步产物，并运行算法护航专项测试、构建检查、语法检查和空白检查。
- [x] 用 `@chrome` 在真实 `one.alimama.com` 页面打开算法护航面板并展开手动设置，只验证样式/DOM/焦点，不点击“立即扫描并优化”。
- [x] 回填审计报告、验证记录、风险和复盘。

## 高层操作摘要
- 已确认本切片延续算法护航页面，不触碰 `src/optimizer/core.js` 的 openV3、手动参数映射和真实请求链路。
- 已定位主要差距在 `renderLatestEscortSettingPreview()` 的手动设置 CSS，以及主面板窗口控制/启动按钮/输入控件缺少系统性 `focus-visible` 和 reduced-motion。
- 已将手动设置卡片、输入、下拉、分段按钮、禁用态和提示文案收敛到 `--am26-*` token，移除旧蓝紫/白底硬编码事实源。
- 已将算法护航窗口控制从可点击 `span` 收敛为真实 `button type="button"`，并为窗口控制、启动按钮、输入框和手动设置控件补齐 `focus-visible`。
- 已补齐主护航面板与手动设置区 `prefers-reduced-motion` 覆盖；本切片未触碰“立即扫描并优化”、openV3、Token、API 或手动参数映射逻辑。

## 验证记录
- `node --check src/optimizer/ui.js`：通过。
- `node --test tests/optimizer-escort-new-flow-fallback.test.mjs`：通过，39/39；新增手动设置 token/focus/reduced-motion、窗口按钮语义、主面板 focus/reduced-motion 和旧硬编码色回退断言。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/optimizer-escort-new-flow-fallback.test.mjs tests/matrix-plan-config.test.mjs`：通过，64/64。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `git diff --check -- src/optimizer/ui.js tests/optimizer-escort-new-flow-fallback.test.mjs tasks/todo.md tasks/ui-gap-audit-2026-05-29.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过，无空白格式问题。
- `@chrome` 运行态验收：先接管 `货品全站推广_万相台无界版` 标签，刷新/导航曾被 Chrome 拦截到 `ERR_BLOCKED_BY_CLIENT`；随后恢复到真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7` 人群推广页。打开主面板后只点击插件面板内 `算法护航`，使用正确运行态 ID `#alimama-escort-helper-ui` 展开手动设置；运行态显示手动设置 `aria-expanded="true"`、6 个 `.am26-manual-card`、下拉箭头为 `svg.am-ui-icon` 且 `aria-hidden="true"`，窗口控制 `居中/最大化/关闭` 均为 `BUTTON type="button"` 并具备 `aria-label`，运行态样式块包含手动区和主面板 `focus-visible`、`prefers-reduced-motion`，旧手动设置硬编码色未出现。未点击 `立即扫描并优化`，控制台 error/warn 为空。截图见 `tasks/ui-audit-algorithm-p2-chrome-2026-05-29.png`。

## 结果复盘
- 结果：完成算法护航 P2 控件样式收敛，手动设置区、窗口控制、启动按钮和输入区已对齐统一 token、按钮语义、可见焦点态和减少动画规范。
- 风险：真实优化提交链路未触发，符合本切片边界；结果浮层仍由专项断言覆盖，不通过真实执行制造投放/优化请求。
- 回滚方式：还原 `src/optimizer/ui.js`、`tests/optimizer-escort-new-flow-fallback.test.mjs`、本次构建产物、截图和任务记录即可。

---

# TODO - 2026-05-29 授权/错误遮罩 UI 规范迁移

## 需求规格
- 目标：将 extension 授权失败/错误锁定遮罩从旧深色卡片迁移到统一浅玻璃工作台风格，并补齐基础 dialog 语义与展示安全性。
- 范围：只改 `src/entries/extension-license-guard.js` 的遮罩壳层 DOM、ARIA、样式 token、图标和 meta 展示方式；不改授权校验、缓存恢复、续租、shopId 解析、policy token 验签、background 桥或服务端请求。
- 成功标准：遮罩根节点具备 `role="dialog"`、`aria-modal`、`aria-labelledby`、`aria-describedby`；视觉使用 `--am26-*` 浅玻璃 token、18px 圆角、低对比边框、可见 focus 和 reduced-motion；meta 值通过 DOM/textContent 渲染，不再拼接 state 字符串为 HTML；专项测试、构建检查和 `@chrome` 验证记录完成。

## 执行计划（可核对）
- [x] 回顾 UI/图标规范、历史审计与授权遮罩现状，确认本切片边界。
- [x] 补齐遮罩 dialog ARIA、稳定标题/描述 id、共享 SVG 状态图标和非交互 focus 入口。
- [x] 将遮罩 overlay/card/meta badge 样式收敛到 `--am26-*` 浅玻璃规范，并补齐 reduced-motion。
- [x] 将授权状态 meta 从 `innerHTML` 拼接改为 DOM/textContent 渲染，避免 state 字符串变成 HTML。
- [x] 增加授权遮罩 UI 专项静态断言，防止回退到旧深色遮罩、无 ARIA 或 HTML 拼接。
- [x] 构建同步产物，并运行授权专项测试、构建检查、语法检查和空白检查。
- [x] 用 `@chrome` 在真实 `one.alimama.com` 页面做安全验收；若当前授权正常无法触发遮罩，则只读验证新版 bundle/CSS/DOM 模板已加载，不强制破坏授权状态。
- [x] 回填审计报告、验证记录、风险和复盘。

## 高层操作摘要
- 已确认本切片属于剩余 P2/P3 错误/授权遮罩迁移，真实页面验收只能使用 `@chrome`，不能使用 chrome-devtools MCP。
- 已确认当前旧遮罩位于 `src/entries/extension-license-guard.js` 的 `renderOverlayStyle()` / `renderOverlay()`，存在深色全屏背景、无 dialog 标题关联、无共享图标、meta 用 `innerHTML` 拼接 state 字符串的问题。
- 已完成遮罩源码迁移：根节点每次渲染同步 `role="dialog"`、`aria-modal`、`aria-labelledby="am-license-lock-title"`、`aria-describedby="am-license-lock-message"`，卡片可聚焦，标题/正文具备稳定 id。
- 已完成视觉迁移：overlay 改为统一浅遮罩和 blur，卡片改为 `--am26-panel-strong`、18px 圆角、`--am26-shadow`、浅玻璃 blur，状态图标改为共享 `alert-triangle` SVG 和危险语义色。
- 已完成展示安全收敛：meta 信息改为 `replaceChildren()` + `createElement('span')` + `textContent` 渲染，并在测试中禁止遮罩块展示 `leaseToken`、`policyToken`、`deviceHash`、`nonce`。

## 验证记录
- `node --test tests/extension-license-cache-policy-token.test.mjs`：通过，6/6；新增授权遮罩 ARIA、统一 token、DOM/textContent 安全渲染、敏感字段不展示断言。
- `node --test tests/extension-static-build.test.mjs`：通过，9/9；新增 extension page bundle 授权遮罩规范断言。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/extension-license-cache-policy-token.test.mjs tests/extension-license-shopid-guard.test.mjs tests/extension-static-build.test.mjs`：通过，18/18。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `node --check dist/extension/page.bundle.js`：通过。
- `node --check src/entries/extension-license-guard.js`：通过。
- `git diff --check -- src/entries/extension-license-guard.js tests/extension-license-cache-policy-token.test.mjs tests/extension-license-shopid-guard.test.mjs tests/extension-static-build.test.mjs tasks/todo.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过，无空白格式问题。
- `@chrome` 安全运行态验收：接管真实 `one.alimama.com` 标签，刷新原人群推广 URL 时 Chrome 将 `redirect.action` 阶段拦截为 `ERR_BLOCKED_BY_CLIENT`；后退恢复到可用 `货品全站推广_万相台无界版` 页面后，只读检查显示插件主入口 `#am-helper-icon` 为 1、统一样式 `#am-helper-pro-v26-style` 为 1、授权锁定遮罩 `#am-license-lock-overlay` 为 0、授权样式 `#am-license-lock-style` 为 0、控制台 error/warn 为空。当前授权正常，未调用 `LicenseGuard.lock()`，避免清授权缓存或改变用户页面状态；失败态 DOM/CSS 由源码和 extension bundle 专项断言覆盖。

## 结果复盘
- 结果：完成授权/错误锁定遮罩 UI 规范迁移，解决旧深色遮罩、无标题关联、无共享告警图标、meta HTML 拼接和缺少 reduced-motion 的问题。
- 风险：真实授权失败态未强制触发，因为 `lock()` 会清空授权缓存并改变当前业务页状态；本轮按安全边界用专项测试和构建产物断言覆盖失败态结构。
- 回滚方式：还原 `src/entries/extension-license-guard.js`、`tests/extension-license-cache-policy-token.test.mjs`、`tests/extension-license-shopid-guard.test.mjs`、`tests/extension-static-build.test.mjs`、本次构建产物和任务记录即可。

---

# TODO - 2026-05-29 组建计划样式事实源收敛

## 需求规格
- 目标：按统一 UI 规范收敛组建计划向导主弹窗外壳，优先修正标题关联、关闭按钮语义、最终生效样式事实源和可见焦点态。
- 范围：只改向导 modal/header/close/button focus/reduced-motion 外壳样式与静态语义；不改创建、提交、矩阵组合、商品选择、请求构建或修复链路。
- 成功标准：源码与构建产物均显示组建计划主弹窗具备 `aria-labelledby`、标题 id、关闭按钮 `type="button"`，最终样式使用 `--am26-*` 浅玻璃 token、18px 圆角、低对比边框、可见 `focus-visible` 和减少动画；专项测试、构建检查和 `@chrome` 真实页面验收通过。

## 执行计划（可核对）
- [x] 回顾 `AGENTS.md`、`tasks/lessons.md`、UI 统一规范、图标规范和现有审计结论。
- [x] 定位组建计划向导壳层模板、最终覆盖样式和相关专项测试。
- [x] 为主弹窗补齐 `aria-labelledby`、稳定标题 id 和关闭按钮 `type="button"`。
- [x] 将最终生效的 overlay/modal/header/close/按钮 focus 样式收敛到 `--am26-*` 浅玻璃规范，保留现有宽度与业务布局。
- [x] 更新组建计划专项断言，防止回退到旧黑遮罩、10px 方卡、无标题关联或无 focus/reduced-motion。
- [x] 构建同步产物，并运行专项测试、构建检查、语法检查和空白检查。
- [x] 用 `@chrome` 在真实 `one.alimama.com` 页面只打开组建计划向导验收，不点击 `提交创建` / `批量创建` / 修复类真实动作。
- [x] 回填验证记录、审计状态、风险与复盘。

## 高层操作摘要
- 已确认本切片是非简单 UI 任务，验证必须纳入计划，且浏览器验收只使用 `@chrome`，不使用 chrome-devtools MCP。
- 已确认向导模板在 `src/optimizer/keyword-plan-api/wizard-mount-intro.js`，样式事实源主要在 `src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`，且后置首页样式会覆盖前置旧壳层样式。
- 已确认本轮只处理主向导外壳与基础控件焦点态，不触碰真实创建/提交/请求链路。
- 已完成源码迁移：主弹窗补齐 `aria-labelledby="am-wxt-keyword-title"`，标题改为稳定 `h3#am-wxt-keyword-title`，主/详情关闭按钮显式 `type="button"`。
- 已完成最终样式事实源迁移：后置生效的 overlay/modal/header/close/按钮 focus 规则改用 `--am26-*` token、18px 浅玻璃面板、低对比边框、可见 `focus-visible` 和 `prefers-reduced-motion`。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs`：通过，15/15；新增组建计划主弹窗外壳规范断言。
- `node --test tests/keyword-wizard-entry-regression.test.mjs`：通过，7/7。
- `node --test tests/matrix-plan-config.test.mjs`：通过，25/25。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `git diff --check -- src/optimizer/keyword-plan-api/wizard-mount-intro.js src/optimizer/keyword-plan-api/wizard-style-and-state/style.js tests/keyword-home-strategy-batch-actions.test.mjs tasks/todo.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过，无空白格式问题。
- 最终规则抽取：`src/optimizer/keyword-plan-api/wizard-style-and-state/style.js` 中最后一个 `#am-wxt-keyword-modal` 规则为 `width: min(1320px, calc(100vw - 48px))`、`background: var(--am26-panel-strong...)`、`border-radius: 18px`、`box-shadow: var(--am26-shadow...)`、`backdrop-filter: blur(20px) saturate(1.4)`。
- `@chrome` 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7` 页面，打开主面板后只点击 `组建计划`。运行态 DOM/计算样式显示弹窗 `role="dialog"`、`aria-modal="true"`、`aria-labelledby="am-wxt-keyword-title"`，标题为 `H3#am-wxt-keyword-title`，关闭按钮为 `BUTTON type="button"` 且包含共享 SVG；overlay 背景为 `rgba(27, 36, 56, 0.28)`、`backdrop-filter: blur(10px)`，modal 为 1320px 宽、18px 圆角、`var(--am26-panel-strong)` 玻璃背景、`var(--am26-shadow)` 阴影、`blur(20px) saturate(1.4)`，控制台 error/warning 为空。未点击 `提交创建`、`批量创建` 或修复类动作。截图见 `tasks/ui-audit-keyword-wizard-shell-chrome-2026-05-29.png`。

## 结果复盘
- 结果：完成组建计划主向导外壳样式事实源收敛，解决主弹窗无标题关联、关闭按钮默认 type 不明确、最终覆盖块回退到 10px 方卡/深遮罩的问题。
- 风险：组建计划内部内容区仍保留部分局部 `--am-wxt-*` token、硬编码浅灰背景和 10px 小控件圆角；本切片按范围只处理主弹窗外壳，不触碰创建/提交/请求链路。
- 回滚方式：还原 `src/optimizer/keyword-plan-api/wizard-mount-intro.js`、`src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`、`tests/keyword-home-strategy-batch-actions.test.mjs`、本次构建产物、截图和任务记录即可。

---

# TODO - 2026-05-29 全量页面 UI 规范逐页迁移

## 需求规格
- 目标：按 `docs/插件UI统一设计规范.md` 与 `docs/图标设计规范.md` 逐页优化所有规范适用 UI，已经覆盖主面板、算法护航、组建计划、批量+、下载面板，继续覆盖万能查数、人群对比看板、快捷话术、计划行快捷入口、复制计划弹窗、并发日志、授权/错误遮罩等剩余页面。
- 范围：每次只推进一个页面或一个紧密弹窗族；不触碰真实投放、创建、提交、删除链路；不手工修改构建产物；涉及真实页面运行态必须用 `@chrome` 验证后再进入下一页。
- 成功标准：审计结果持续落到 `tasks/ui-gap-audit-2026-05-29.md`；每页都有源码迁移、专项测试/构建检查和 `@chrome` 或明确不可触发的替代验证记录；所有规范适用页面完成前不标记 goal 完成。

## 执行计划（可核对）
- [x] 回顾 `AGENTS.md`、`tasks/lessons.md`、UI 统一规范和图标规范，确认审计口径。
- [x] 定位五个页面/入口的源码与现有样式事实源，必要时用只读子代理并行收集证据。
- [x] 输出差距审计表：逐页列出已符合、需要改、暂不改和风险说明。
- [x] 基于影响面、复用价值和改动风险给出迁移优先级，选择第一页做最小迁移方案。
- [x] 按优先级迁移第一页，更新/补充必要测试并构建校验。
- [x] 如涉及运行态 UI，使用真实浏览器或可用截图完成验收；无法验收时记录原因和替代检查。
- [x] 回填验证记录、风险、回滚方式和结果复盘。

## 继续迁移 - 算法护航（可核对）
- [x] 复核算法护航 UI 审计项，优先处理裸文本箭头、结果浮层语义和键盘可达性。
- [x] 迁移计划卡片折叠箭头与手动设置下拉箭头为统一 `renderAmIcon('chevron-down')`。
- [x] 将执行结果浮层补齐 `dialog`/`aria-modal`/`aria-labelledby`、Esc 关闭、焦点恢复、键盘焦点态和减少动画适配。
- [x] 增加算法护航专项静态断言，防止回退到裸文本箭头或无语义结果浮层。
- [x] 重新构建并验证产物同步。
- [x] 使用 `@chrome` 做运行态验收，并记录可见状态或阻塞原因。
- [x] 回填本页迁移复盘和下一页优先级。

## 继续迁移 - 批量+（可核对）
- [x] 复核批量+ UI 审计项和历史教训，确认触发按钮保持原生同构。
- [x] 将插件自有菜单浮层收敛到 `--am26-*` token、统一图标和可见 focus 态。
- [x] 替换自造 fallback 私有字体箭头，保留真实原生 DOM 箭头兼容策略。
- [x] 将批量确认弹窗文本 `!` 改为共享 SVG 图标，并补齐标题关联与焦点恢复。
- [x] 增加批量+ UI 规范专项断言，防止菜单/弹窗回退到私有字体或硬编码视觉。
- [x] 构建同步产物，并运行专项测试、语法与构建检查。
- [x] 使用 `@chrome` 在真实页面只读打开批量+ 菜单验收，不点击真实动作。
- [x] 回填审计报告、验证记录和复盘。

## 继续迁移 - 计划行复制弹窗（可核对）
- [x] 复核计划行快捷入口与复制计划弹窗审计项，确认本切片只改复制前一览窗和复制成功弹窗的 UI 规范。
- [x] 将复制前一览窗和复制成功弹窗从文本 `!` / `×` 图标迁移到共享 SVG 图标，并补齐 `aria-labelledby`。
- [x] 为复制前一览窗和复制成功弹窗补齐 Esc 关闭、关闭后焦点恢复、focus-visible 和减少动画适配。
- [x] 将复制弹窗样式收敛到 `--am26-*` token、浅玻璃面板、低对比边框和规范圆角。
- [x] 更新复制计划专项断言，防止回退到文本图标、无标题关联或旧硬编码样式。
- [x] 构建同步产物，并运行专项测试、语法与构建检查。
- [x] 使用 `@chrome` 在真实页面只打开/模拟复制弹窗 UI 验收，不触发真实复制提交。
- [x] 回填审计报告、验证记录和复盘。

## 继续迁移 - 万能查数/人群对比看板（可核对）
- [x] 复核万能查数、人群对比看板、快捷话术 UI 审计项，确认本切片只改窗口动作按钮与视图页签语义。
- [x] 将弹窗刷新/关闭从 `span` 控件迁移为真实 `button type="button"`，补齐 `aria-label`、focus-visible 与减少动画适配。
- [x] 为万能查数/人群对比看板页签补齐 `tablist`/`tab`/`tabpanel`、`aria-selected`、`aria-controls`、`aria-labelledby` 和键盘左右切换。
- [x] 保持快捷话术、iframe 查数提交、人群看板加载请求和商品下拉业务逻辑不变。
- [x] 增加或更新 MagicReport 专项断言，防止窗口动作退回 `span` 控件或页签丢失语义。
- [x] 构建同步产物，并运行专项测试、语法与构建检查。
- [x] 使用 `@chrome` 打开真实页面弹窗验收结构、键盘 focus 和页签状态，不触发快捷话术提交或看板刷新。
- [x] 回填审计报告、验证记录和复盘。

## 继续迁移 - 万能查数/人群对比看板 P2 控件语义（可核对）
- [x] 复核快捷话术、顶部图例和商品 ID 下拉的剩余语义差距，限定本切片不触碰真实查数、刷新、重试或商品请求链路。
- [x] 为快捷话术补齐 `aria-label` / `aria-pressed` 同步和可见 `focus-visible`。
- [x] 为顶部图例按钮补齐稳定 `aria-label`，保持 `aria-pressed` 随显隐状态同步，并增加可见 `focus-visible`。
- [x] 为商品 ID 自定义下拉补齐 `aria-label`、`aria-controls`、`aria-activedescendant`、option id 和键盘打开/切换/选择/关闭边界。
- [x] 更新 MagicReport 专项断言，防止控件语义和键盘边界回退。
- [x] 构建同步产物，并运行专项测试、语法与构建检查。
- [x] 使用 `@chrome` 在真实页面只验证 DOM/键盘行为，不点击快捷话术、刷新、重试或提交入口。
- [x] 回填审计报告、验证记录和复盘。

## 继续迁移 - 并发日志弹窗（可核对）
- [x] 复核并发日志弹窗审计项，限定本切片只改弹窗壳层、语义、焦点、Esc 和样式 token，不触碰并发开启/重启请求链路。
- [x] 为并发日志弹窗补齐 `aria-labelledby`、打开/关闭 `aria-hidden`、状态/日志区 live 语义和日志区键盘滚动焦点。
- [x] 为并发日志弹窗补齐 Esc 关闭、关闭后焦点恢复、打开后聚焦关闭按钮。
- [x] 将并发日志弹窗遮罩、卡片、头部、状态条和日志区收敛到 `--am26-*` 浅玻璃 token，并增加 `focus-visible` 与减少动画适配。
- [x] 更新并发开启专项断言，防止弹窗回退到无标题关联、旧黑遮罩/白卡片或无焦点恢复。
- [x] 构建同步产物，并运行专项测试、语法与构建检查。
- [x] 使用 `@chrome` 在真实页面做安全运行态验收：刷新业务页确认新版并发日志 CSS、入口和控制台状态；不点击并发开启按钮触发真实状态更新，弹窗打开/关闭由专项测试覆盖。
- [x] 回填审计报告、验证记录和复盘。

## 继续迁移 - 主面板（可核对）
- [x] 复核主面板审计项，优先处理交互元素语义化和键盘/focus 可达性。
- [x] 将悬浮球、关闭按钮、工具入口、辅助显示开关和日志操作迁移为真实 `button type="button"`。
- [x] 在 `updateState()` 同步 `aria-pressed`、`aria-expanded`、`aria-controls` 等状态。
- [x] 收敛本切片涉及的硬编码文字色与 focus-visible 样式。
- [x] 增加主面板专项断言，防止回退到 `div/span` 交互控件。
- [x] 构建同步产物，并运行专项测试、语法与构建检查。
- [x] 使用 `@chrome` 打开主面板验收按钮语义、状态与可见 focus，不触发真实业务提交。
- [x] 回填审计报告、验证记录和复盘。

## 继续迁移 - 下载面板（可核对）
- [x] 复核下载面板审计项，确认只处理响应式宽度与可见 focus 态。
- [x] 将下载捕获面板宽度改为 `min(340px, calc(100vw - 24px))`，同步内联可见性兜底。
- [x] 为下载链接补可访问名称，并为复制/关闭按钮显式声明 `type="button"`。
- [x] 为下载、复制、关闭补齐 `focus-visible` 和减少动画适配。
- [x] 增加下载面板专项断言。
- [x] 构建同步产物，并运行专项测试、语法与构建检查。
- [x] 完成运行态或等价静态验收记录。
- [x] 回填审计报告、验证记录和复盘。

## 高层操作摘要
- 已确认本轮属于非简单 UI 任务，必须先规划，并将验证纳入计划。
- 已回顾历史教训：UI/图标任务需避免局部近似、emoji/私有图标、弱验证；涉及真实页面行为时要记录浏览器验收。
- 已确认统一 UI 规范口径：浅色玻璃拟态工作台、复用 `--am26-*` token、统一骨架、线性图标、紧凑高密度、状态覆盖和真实截图核对。
- 已用只读子代理分块审计主助手/批量+/下载面板、算法护航、组建计划，并由主线程复核源码关键位置。
- 已输出审计报告：`tasks/ui-gap-audit-2026-05-29.md`。
- 已确定第一批迁移从组建计划矩阵预设按钮开始：先消除 inline `onclick` 与统一点击监听并存造成的重复触发风险，再进入算法护航、批量+、主面板、下载面板。
- 已完成组建计划第一处迁移前置修复：矩阵预设按钮只保留 `matrixPresetList` 统一点击监听，移除 inline `onclick` 与每次渲染后逐个绑定的重复触发路径。
- 已更新矩阵配置专项测试，新增反向断言防止预设按钮回退到 inline 事件或重复绑定。
- Chrome DevTools 验收尝试失败：MCP 报 `Failed to fetch browser webSocket URL from http://127.0.0.1:9222/json/version: HTTP Not Found`；运行 `scripts/recover-chrome-devtools-mcp.sh` 返回 `Chrome DevTools 端口 9222 未就绪`；直接启动调试 Chrome 后 `127.0.0.1:9222/json/version` 仍返回 HTTP 404。因此本轮未完成真实 `one.alimama.com` 截图/点击验收，已用专项测试、构建检查和静态产物扫描替代。
- 已进入第二页迁移：算法护航首批仅处理高收益 UI 规范项，不触碰真实护航提交链路。
- 已替换算法护航计划卡片折叠箭头和手动设置下拉箭头，统一使用 `renderAmIcon('chevron-down')`，移除裸文本 `▼`。
- 已为算法护航结果浮层补齐 dialog 语义、标题关联、Esc 关闭、打开前焦点恢复、关闭按钮键盘焦点态与减少动画适配。
- 已用 `@chrome` 连接用户 Chrome，接管真实 `one.alimama.com` 人群推广页。首次检查发现旧 DOM 仍是文本 `▼`，说明页面尚未刷新到最新构建；尝试打开 `chrome://extensions/?id=cfegfgaodnfeigffdknhgciapojejflk` 被 Chrome Browser Use 安全策略阻止，因此未自动进入扩展管理页 reload。
- 已安全刷新真实页面并打开主面板 -> 算法护航 -> 手动设置；刷新后运行态 DOM 显示下拉箭头为 SVG chevron、`aria-hidden="true"`、不再包含裸文本 `▼`。
- 结果浮层未通过真实执行触发，避免碰真实护航提交链路；本轮用源码/产物静态断言覆盖 dialog 语义、Esc 关闭、焦点恢复和 reduced-motion。
- 已保存运行态截图：`tasks/ui-audit-algorithm-chrome-2026-05-29.png`。
- 已进入第三页迁移：批量+ 本轮只处理插件自有菜单、确认弹窗和 fallback 图标；继续保留触发按钮复刻官方“批量计划设置”的兼容策略，不触碰真实批量提交链路。
- 已完成批量+ 自有菜单初步迁移：菜单项增加共享 SVG 图标，浮层改用 `--am26-*` token、玻璃面板、可见 focus 态和减少动画适配。
- 已替换批量+ 自造 fallback 私有字体箭头为共享 chevron；真实原生 DOM 箭头仍按兼容策略保留。
- 已将批量确认弹窗的文本 `!` 替换为共享 `alert-triangle` / `x-circle` 图标，并补齐 `aria-labelledby` 与关闭后焦点恢复。
- 已用 `@chrome` 在真实人群推广页关闭官方升级说明弹窗后，只点击 `批量+` 触发菜单并做 DOM/计算样式断言；未点击任何批量开启、暂停、删除或人群设置动作。
- 已保存批量+ 运行态截图：`tasks/ui-audit-batch-plus-chrome-2026-05-29.png`。
- 已进入第四页迁移：主面板首批只处理交互元素语义化、状态同步与 focus 可达性，不改变工具入口业务逻辑。
- 已完成主面板首批源码迁移：悬浮球、关闭按钮、工具入口、辅助开关、日志清空/展开均改为真实 `button type="button"`，并在 `updateState()` 同步辅助开关、辅助面板和日志区域的可访问状态。
- 已用 `@chrome` 在真实人群推广页关闭官方活动弹窗后打开主面板，只点击 `辅助显示` 展开辅助开关并用键盘 Tab 验证 focus；未点击算法护航、组建计划、万能查数等业务入口。
- 已保存主面板运行态截图：`tasks/ui-audit-main-panel-chrome-2026-05-29.png`。
- 已进入第五页迁移：下载面板只处理响应式宽度、按钮语义和可见 focus，保留 `Interceptor.createPanel()` 的内联兜底定位职责。
- 已完成下载面板迁移：面板宽度改为窄屏安全的 `min(340px, calc(100vw - 24px))`，下载链接补可访问名称，复制/关闭按钮显式 `type="button"`，并增加 focus-visible 与 reduced-motion 样式。
- 已用 `@chrome` 在真实页面确认新版下载面板节点和 CSS 已注入；未触发真实下载请求。
- 已进入第六页迁移：计划行复制弹窗只处理复制前一览窗和复制成功窗的 UI 规范，不触碰真实复制提交、官方复制接口、创建后暂停兜底或页内搜索逻辑。
- 已将复制前一览窗/复制成功窗的文本 `!`、`×` 迁移为共享 `campaign-copy`、`close`、`check-circle` SVG 图标，并补齐 `role="dialog"`、`aria-modal="true"`、`aria-labelledby`。
- 已将复制弹窗样式收敛到 `--am26-*` 浅玻璃面板、18px 规范圆角、低对比边框、可见 focus 和减少动画适配。
- 已修复真实页面 Esc 关闭后焦点落到 `BODY` 的问题：关闭时保存 `campaignId + copyMode` 焦点目标，等待运行中按钮解除禁用，并在原 DOM 引用失效时重新定位当前可见复制按钮。
- 已用 `@chrome` 在真实人群推广页只打开复制一览窗并按 Esc 关闭；未点击“确认生成”，未触发真实复制提交。
- 已进入第七页迁移：万能查数/人群对比看板本轮只处理窗口动作按钮与视图页签语义，不触碰快捷话术提交、iframe 查数、看板刷新请求或商品下拉业务逻辑。
- 已将万能查数弹窗刷新/关闭从可点击 `span` 迁移为真实 `button type="button"`，补齐 `aria-label`、`title`、可见 `focus-visible` 和 reduced-motion。
- 已为“万能查数 / 人群对比看板”视图切换补齐 `tablist`、`tab`、`tabpanel`、`aria-selected`、`aria-controls`、`aria-labelledby`、`aria-hidden` 和 Arrow/Home/End 键盘切换。
- 已用 `@chrome` 打开真实页面万能查数弹窗，只验证 DOM/样式和键盘页签切换；未点击快捷话术、刷新当前视图、重试或任何查数提交入口。
- 已进入万能查数/人群对比看板 P2 控件语义迁移：本切片只处理快捷话术、顶部图例和商品 ID 下拉的 ARIA、focus 与键盘边界，不触碰查数请求链路。
- 已完成万能查数/人群对比看板 P2 控件语义迁移：快捷话术具备稳定 `aria-label`、临时 `aria-pressed` 和 `focus-visible`；顶部图例具备稳定 `aria-label`、装饰色点 `aria-hidden` 和 `focus-visible`；商品 ID 下拉补齐触发器/listbox/option 关联与 Arrow/Home/End/Enter/Space/Escape/Tab 键盘边界。
- 已用只读子代理审计 MagicReport 剩余 P2 控件，主线程按最小安全修复落地并补充专项断言；未改 `runQuickPrompt`、人群看板刷新、重试或商品请求链路。
- 已进入并发日志弹窗迁移：本切片只处理日志弹窗壳层 UI、ARIA、焦点和样式 token，不触碰并发开启、全量暂停、重开或状态校验请求链路。
- 已完成并发日志弹窗源码迁移：弹窗补齐标题关联、标题共享启动图标、状态/日志 live 语义、打开/关闭 `aria-hidden`、Esc 关闭、关闭后焦点恢复、打开后聚焦关闭按钮，并将遮罩/卡片/状态/日志区收敛到 `--am26-*` 浅玻璃样式。
- 用户更新 goal：后续验证只允许使用 `@chrome`，不能使用 `chrome-devtools` MCP；已切换到 Codex Chrome Extension 的 `@chrome` 浏览器客户端，停止 DevTools MCP 路线。
- 已用 `@chrome` 接管真实人群推广页并刷新运行态，确认新版并发日志 CSS 已注入，旧深色终端样式已消失；未点击并发开启按钮，避免触发真实状态更新请求。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/matrix-plan-config.test.mjs`：通过，25/25。
- `rg -n "onclick=|querySelectorAll\\('\\[data-matrix-preset-key\\]'\\)[\\s\\S]*addEventListener\\('click'" src/optimizer/keyword-plan-api/request-builder-preview.js 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：无匹配，确认源码和产物中矩阵预设按钮无 inline 事件和重复逐个绑定。
- `git diff --check -- src/optimizer/keyword-plan-api/request-builder-preview.js tests/matrix-plan-config.test.mjs tasks/todo.md tasks/ui-gap-audit-2026-05-29.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过，无空白格式问题。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- Chrome DevTools MCP 真实验收：未完成，原因见高层操作摘要中的 9222 端口 HTTP 404 记录。
- `node --test tests/optimizer-escort-new-flow-fallback.test.mjs`：通过，37/37；新增断言覆盖算法护航 chevron 图标、结果浮层 dialog 语义、Esc 关闭、焦点恢复、focus-visible 和 reduced-motion。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/optimizer-escort-new-flow-fallback.test.mjs tests/matrix-plan-config.test.mjs`：通过，62/62。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `git diff --check -- src/optimizer/ui.js tests/optimizer-escort-new-flow-fallback.test.mjs src/optimizer/keyword-plan-api/request-builder-preview.js tests/matrix-plan-config.test.mjs tasks/todo.md tasks/ui-gap-audit-2026-05-29.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过，无空白格式问题。
- `@chrome` 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7` 页面，刷新后打开 `阿里助手 Pro v7.05` -> `算法护航` -> 展开手动设置；DOM 断言 `dropdownArrowHasSvg=true`、`dropdownArrowAriaHidden="true"`、`loadedStyleHasBareTextArrow=false`、`loadedStyleHasSvgArrowRule=true`。截图见 `tasks/ui-audit-algorithm-chrome-2026-05-29.png`。
- `node --test tests/campaign-batch-plus-quick-entry.test.mjs`：通过，8/8；新增批量+ 菜单图标、fallback chevron、确认弹窗 SVG 图标、标题关联、焦点恢复、token 样式和 reduced-motion 断言。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `node --test tests/campaign-batch-plus-quick-entry.test.mjs tests/optimizer-escort-new-flow-fallback.test.mjs tests/matrix-plan-config.test.mjs`：通过，70/70。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `git diff --check -- src/main-assistant/campaign-id-quick-entry.js src/main-assistant/ui.js tests/campaign-batch-plus-quick-entry.test.mjs tasks/todo.md tasks/ui-gap-audit-2026-05-29.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过，无空白格式问题。
- 静态扫描：批量+ 新增菜单图标、fallback chevron、确认弹窗 `aria-labelledby`、批量+ reduced-motion 均已同步到源码、根 userscript、`dist/packages/` 和 `dist/extension/page.bundle.js`；剩余 `icon.textContent = '!'` 属于复制计划成功弹窗，不在本轮批量+ 菜单/确认切片范围。
- `@chrome` 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7` 页面，关闭官方升级说明弹窗后只点击 `批量+` 触发器；菜单 DOM 断言 `role="menu"`、5 个 `role="menuitem"`、5 个 `.am-campaign-batch-plus-item-icon svg.am-ui-icon`、1 个危险项、`aria-expanded="true"`、菜单文本不含私有字体箭头。计算样式为 `border-radius: 10px`、`padding: 6px`、玻璃渐变背景、`box-shadow` 为 `rgba(31, 38, 135, 0.15) 0px 8px 32px 0px`、`backdrop-filter: blur(18px) saturate(1.6)`；控制台 error/warning 为空。截图见 `tasks/ui-audit-batch-plus-chrome-2026-05-29.png`。
- `node --test tests/logger-api.test.mjs tests/magic-report-panel-resilience.test.mjs tests/campaign-batch-plus-quick-entry.test.mjs tests/optimizer-escort-new-flow-fallback.test.mjs tests/matrix-plan-config.test.mjs`：通过，89/89；新增主面板 button 语义、`aria-pressed`、`aria-expanded` 与日志区域断言。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `git diff --check -- src/main-assistant/ui.js src/main-assistant/campaign-id-quick-entry.js tests/logger-api.test.mjs tests/campaign-batch-plus-quick-entry.test.mjs tasks/todo.md tasks/ui-gap-audit-2026-05-29.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过，无空白格式问题。
- 静态扫描：源码、根 userscript、`dist/packages/` 和 `dist/extension/page.bundle.js` 均不再包含主面板 `<div class="am-tool-btn">`、`<div class="am-switch-btn">`、`<span class="am-action-btn">`、`<div class="am-close-btn">` 或 `<div id="am-helper-icon">`。
- `@chrome` 运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7` 页面，关闭官方活动弹窗后打开主面板；DOM 断言悬浮球、关闭按钮、4 个工具入口、8 个辅助开关、日志清空/展开均为 `BUTTON type="button"`，辅助显示入口展开后 `aria-expanded="true"`、`aria-pressed="true"`、`aria-controls="am-assist-switches"`，辅助区域 `aria-hidden="false"`；键盘 Tab 后焦点落在辅助开关，outline 为 solid；控制台 error/warning 为空。截图见 `tasks/ui-audit-main-panel-chrome-2026-05-29.png`。
- `node --test tests/download-link-depth-guard.test.mjs tests/logger-api.test.mjs tests/magic-report-panel-resilience.test.mjs tests/campaign-batch-plus-quick-entry.test.mjs tests/optimizer-escort-new-flow-fallback.test.mjs tests/matrix-plan-config.test.mjs`：通过，92/92；新增下载面板响应式宽度、内联兜底、可访问名称、按钮 type、focus-visible 和 reduced-motion 断言。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `git diff --check -- src/main-assistant/interceptor.js src/main-assistant/ui.js src/main-assistant/campaign-id-quick-entry.js tests/download-link-depth-guard.test.mjs tests/logger-api.test.mjs tests/campaign-batch-plus-quick-entry.test.mjs tasks/todo.md tasks/ui-gap-audit-2026-05-29.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过，无空白格式问题。
- `@chrome` 下载面板运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7` 页面刷新后，不触发真实下载请求；DOM 断言 `#am-report-capture-panel` 存在，内联兜底样式包含 `width: min(340px, -24px + 100vw)`，注入 CSS 包含响应式宽度、下载/复制/关闭 `focus-visible` 和 `prefers-reduced-motion` 规则；控制台 error/warning 为空。
- `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs`：通过，12/12；新增复制弹窗共享 SVG、标题关联、Esc 关闭、可重新定位焦点恢复、token 样式和 reduced-motion 断言。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `git diff --check -- src/main-assistant/campaign-id-quick-entry.js tests/campaign-copy-current-plan-quick-entry.test.mjs src/main-assistant/ui.js 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过，无空白格式问题。
- 静态扫描：源码、根 userscript、`dist/packages/alimama-helper-pro.user.js` 和 `dist/extension/page.bundle.js` 均包含 `createCopyFocusTarget`、`resolveCopyFocusTargetElement`、`readyElement.focus({ preventScroll: true })`、成功窗 `campaignId: id` 与 `mode: copyMode` 焦点描述符。
- `@chrome` 复制弹窗运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7` 页面，刷新后点击可见行级 `复制` 按钮，只打开一览窗，不点击 `确认生成`；DOM/样式断言 `role="dialog"`、`aria-modal="true"`、`aria-labelledby="am-copy-overview-title"`、标题关联成功、头部与关闭按钮均为 `svg.am-ui-icon`、关闭按钮 `type="button"`、状态文案为 `确认后才会提交创建请求。`、表格 1 行、焦点进入首个计划名输入框、遮罩 `rgba(27, 36, 56, 0.28)`、`backdrop-filter: blur(10px)`、卡片 `border-radius: 18px`、玻璃背景、`box-shadow` 为 `rgba(31, 38, 135, 0.15) 0px 8px 32px 0px`、表格横向溢出隐藏。按 Esc 关闭后弹窗移除，复制按钮解除禁用，焦点回到同一行 `BUTTON[data-campaign-id="81021969209"][data-am-campaign-copy="inherit"]`。截图见 `tasks/ui-audit-copy-popup-chrome-2026-05-29.png`。控制台存在官方 `getDingCard.json` callback error，来源为阿里妈妈 `merge.js`，未观察到插件侧 error/warning。
- `node --test tests/magic-report-crowd-matrix.test.mjs tests/magic-report-panel-resilience.test.mjs`：通过，62/62；新增万能查数窗口动作 button、页签/面板 ARIA、键盘切换和 reduced-motion 断言。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `git diff --check -- src/main-assistant/magic-report.js tests/magic-report-crowd-matrix.test.mjs tasks/todo.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过，无空白格式问题。
- `@chrome` 万能查数运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7` 页面刷新后打开主面板并点击 `万能查数`；运行态 DOM 显示刷新/关闭均为 `BUTTON type="button"`、有 `aria-label` 与 SVG 图标，视图切换容器 `role="tablist"`，两个页签 `role="tab"` 且 `aria-selected`/`tabindex`/`aria-controls` 正确，两个内容区 `role="tabpanel"` 且 `aria-labelledby`/`aria-hidden` 正确。默认人群看板为全屏弹窗；在当前看板 tab 上按 ArrowLeft 后切换到万能查数 tab，焦点落到 `#am-magic-tab-query`，query panel 显示、matrix panel 隐藏，弹窗恢复到 900px/18px 圆角普通尺寸。未点击快捷话术、刷新当前视图、重试或查数提交入口；控制台 error/warning 为空。截图见 `tasks/ui-audit-magic-report-chrome-2026-05-29.png`。
- `node --test tests/magic-report-crowd-matrix.test.mjs tests/magic-report-panel-resilience.test.mjs`：通过，64/64；新增快捷话术 `aria-label/aria-pressed/focus-visible`、图例 `aria-label/aria-hidden/focus-visible`、商品 ID 下拉 listbox/option/键盘边界断言。首次运行前未构建导致旧根 userscript 断言失败；运行 `npm run build` 同步产物后通过，并将慢正则收窄到方法切片，避免 90s 回溯。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `git diff --check -- src/main-assistant/magic-report.js tests/magic-report-crowd-matrix.test.mjs tasks/todo.md tasks/ui-gap-audit-2026-05-29.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过，无空白格式问题。
- `@chrome` 万能查数 P2 控件运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7` 页面，刷新后打开主面板并点击 `万能查数`；仅做 DOM 属性和样式断言，未点击快捷话术、刷新、重试或查数提交。运行态显示 7 个快捷话术均为 `BUTTON type="button"` 且有 `aria-label="快捷话术：..."` 与 `aria-pressed="false"`；10 个顶部图例按钮均有稳定 `aria-label`、`aria-pressed` 和装饰色点 `aria-hidden="true"`；商品 ID 触发器在未识别计划态禁用，但具备 `aria-controls="am-crowd-matrix-item-listbox"`、listbox `role="listbox"`、`aria-label="商品ID候选列表"`、`aria-hidden="true"`；注入 CSS 包含快捷话术、图例、商品触发器 `focus-visible` 和 reduced-motion 覆盖；控制台 error/warning 为空。截图见 `tasks/ui-audit-magic-report-p2-chrome-2026-05-29.png`。
- `node --test tests/campaign-concurrent-start-quick-entry.test.mjs`：通过，7/7；新增并发日志标题关联、共享启动图标、status/log live 语义、Esc 关闭、焦点恢复、统一 token 玻璃样式、focus-visible、warning 状态和 reduced-motion 断言。
- `node --test tests/campaign-concurrent-start-quick-entry.test.mjs tests/campaign-batch-plus-quick-entry.test.mjs tests/campaign-copy-current-plan-quick-entry.test.mjs`：通过，27/27；确认共享 `campaign-id-quick-entry.js` 改动未破坏批量+ 与复制弹窗回归。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `npm run build:check`：通过，构建产物与源码同步。
- `npm run check:syntax`：通过，根 userscript 语法检查通过。
- `git diff --check -- src/main-assistant/campaign-id-quick-entry.js src/main-assistant/ui.js tests/campaign-concurrent-start-quick-entry.test.mjs tasks/todo.md tasks/ui-gap-audit-2026-05-29.md 阿里妈妈多合一助手.js dist/packages/alimama-helper-pro.user.js dist/extension/page.bundle.js`：通过，无空白格式问题。
- `@chrome` 并发日志运行态验收：真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7` 页面，使用 Codex Chrome Extension 浏览器客户端接管并刷新页面。运行态证据：`#am-helper-pro-v26-style` 已注入，并发日志样式块存在，`background: rgba(27, 36, 56, 0.28)`、`background: var(--am26-panel-strong)`、18px 圆角、`.am-concurrent-log-close:focus-visible`、`.am-concurrent-log-body:focus-visible`、`.am-concurrent-log-status.is-warning`、`prefers-reduced-motion` 均存在，旧 `background: #0f172a` 与旧纯白卡片样式不存在；页面存在 9 个 `BUTTON[data-am-campaign-concurrent-start="1"]` 并带计划 aria-label；控制台 error/warn 为空。未点击并发开启按钮，避免真实全量暂停/重开请求；尝试用 `javascript:` 插入 mock DOM 被 `@chrome` 安全策略拦截，因此弹窗打开/关闭行为以专项测试覆盖。

## 结果复盘
- 结果：完成五个现有页面/入口的 UI 规范差距审计，并完成第一处最高优先级迁移前置修复，消除组建计划矩阵预设按钮重复触发风险。
- 追加结果：完成第二页算法护航首批迁移，已将裸文本下拉/折叠箭头替换为共享 SVG chevron，并补齐结果浮层的模态语义与键盘关闭/焦点恢复。
- 追加结果：完成第三页批量+ 首批迁移，插件自有菜单、fallback 箭头和批量确认弹窗已对齐统一 token/图标/焦点规范，并在真实页面只读验收通过。
- 追加结果：完成第四页主面板首批迁移，主要交互控件已改为真实 button，并补齐辅助显示与日志区域的可访问状态同步。
- 追加结果：完成第五页下载面板首批迁移，已补齐响应式宽度、按钮语义、链接可访问名称、focus-visible 与减少动画适配。
- 追加结果：完成第六页计划行复制弹窗迁移，复制前一览窗和复制成功窗已对齐共享图标、dialog 语义、Esc 关闭、焦点恢复和统一 token 样式；真实页面验收只打开并取消一览窗，未触发复制提交。
- 追加结果：完成第七页万能查数/人群对比看板首批迁移，窗口动作已改为真实按钮，视图页签已补齐 ARIA 语义与键盘切换，并在真实页面只读验收通过。
- 追加结果：完成万能查数/人群对比看板 P2 控件语义迁移，快捷话术、顶部图例和商品 ID 下拉已补齐可访问名称、状态同步、可见 focus 和键盘边界；真实页面只读验收通过，商品候选下拉因当前列表页未识别计划 ID 无可选项，键盘选项分支由专项断言覆盖。
- 追加结果：完成并发日志弹窗迁移和安全运行态验收，已对齐共享图标、dialog 标题关联、live 语义、Esc 关闭、焦点恢复、`--am26-*` 浅玻璃样式、可见 focus 与减少动画；真实页面已确认新版样式加载，未触发真实并发开启。
- 风险：`@chrome` 自动打开 `chrome://extensions` 被安全策略阻止，无法在本轮自动点击扩展管理页 Reload；但刷新真实业务页后已加载到最新构建并验证算法护航、批量+、主面板、下载面板和复制弹窗样式注入。算法护航结果浮层、批量+真实动作、下载面板真实下载弹出和复制成功弹窗未通过真实提交触发，避免碰真实提交/下载/创建链路，已用专项断言和可触发部分的运行态 DOM/CSS 断言覆盖。
- 风险：`@chrome` 自动打开 `chrome://extensions` 被安全策略阻止，无法在本轮自动点击扩展管理页 Reload；但刷新真实业务页后已加载到最新构建并验证算法护航、批量+、主面板、下载面板、复制弹窗和万能查数弹窗样式注入。算法护航结果浮层、批量+真实动作、下载面板真实下载弹出、复制成功弹窗和万能查数快捷话术提交未通过真实提交触发，避免碰真实提交/下载/创建/查数链路，已用专项断言和可触发部分的运行态 DOM/CSS 断言覆盖。
- 下一步：审计列出的五个页面首批迁移、复制弹窗、万能查数首批和 P2 控件语义迁移已完成；后续可按剩余 P2/P3 项继续处理并发日志、组建计划样式事实源收敛、授权/错误遮罩和下载失败态。
- 最新下一步：并发日志弹窗切片已完成；继续进入下一个剩余页面切片：组建计划样式事实源收敛、授权/错误遮罩或下载失败态三者中选择风险最小且可用 `@chrome` 验收的一项。
- 回滚方式：还原 `src/optimizer/keyword-plan-api/request-builder-preview.js`、`src/optimizer/ui.js`、`src/main-assistant/campaign-id-quick-entry.js`、`src/main-assistant/magic-report.js`、`src/main-assistant/ui.js`、相关测试、本次构建产物、截图和 `tasks/` 记录即可。

---

# TODO - 2026-05-29 精简重写 AGENTS 规则

## 需求规格
- 目标：参考外部 `AGENT-v2.md` 的规则风格，重写本仓库 `AGENTS.md`，保持项目关键约束完整且更精简有效，便于 Codex、Claude 和其它代码代理执行。
- 范围：只修改项目级代理规则与本任务记录；不修改运行时代码、构建产物或业务文档。
- 成功标准：`AGENTS.md` 保留规划、debug-first、根因修复、子代理、验证、浏览器验收、生成产物、安全边界等硬约束；删除冗长重复描述；Markdown 结构清晰且无格式错误。

## 执行计划（可核对）
- [x] 回顾 `tasks/lessons.md`、当前 `AGENTS.md`、用户提供的 `codex://threads/...` 线索和外部 `AGENT-v2.md`。
- [x] 重写 `AGENTS.md`，合并重复规则并补入参考文档中的 debug-first、结构性修复触发、diff 自审和验证顺序。
- [x] 检查文档格式、关键约束覆盖和工作区 diff。
- [x] 回填验证记录与结果复盘。

## 高层操作摘要
- 已确认外部参考强调：中文默认回复、少问多做、debug-first、根因修复、避免隐藏兜底、结构性修复触发、验证顺序、diff 自审和并行子代理。
- 已确认 `codex://threads/019e6f8d-0750-7ad1-8af8-0f69e1624b1c` 对应上一轮插件 UI 规范会话，未追加本轮 `AGENTS.md` 专属要求。
- 已回顾当前 `tasks/lessons.md` 中与验证闭环、真实页面验收、设计规范、debug bridge、用户修正沉淀相关教训。
- 已将 `AGENTS.md` 从长清单重写为 154 行的精简规则，保留项目事实源、计划记录、真实浏览器验收、关键路径测试、安全边界、构建产物和提交发布要求。
- 已补入参考规则中的 debug-first、结构性修复触发、验证顺序、diff 自审、少问多做和并行子代理策略。
- 已确认 `codex://threads/019e6f8d-0750-7ad1-8af8-0f69e1624b1c` 已生成 `docs/插件UI统一设计规范.md`（当前为未跟踪文件），因此 `AGENTS.md` 将 UI 规范阅读设为硬约束。

## 验证记录
- `git diff --check -- AGENTS.md tasks/todo.md`：通过，无空白格式问题。
- `wc -l AGENTS.md`：154 行，较原文件更紧凑。
- `rg -n "Debug-First|结构性修复|diff 自审|chrome-devtools|recover-chrome-devtools|tasks/todo.md|tasks/lessons.md|node scripts/build.mjs|policy token|__AM_HOOK_MANAGER__|docs/图标设计规范.md|docs/插件UI统一设计规范.md" AGENTS.md`：通过，关键约束均可定位。
- `test -f docs/插件UI统一设计规范.md && test -f docs/图标设计规范.md && test -f docs/源码结构速查.md && test -f scripts/recover-chrome-devtools-mcp.sh`：通过，硬引用文件存在。
- `git status --short`：本轮改动为 `AGENTS.md` 与 `tasks/todo.md`；另有未跟踪 `docs/插件UI统一设计规范.md` 来自关联线程，本轮未修改。

## 结果复盘
- 结果：完成项目级代理规则精简重写；保留本仓库关键硬约束，并吸收外部参考的根因优先、debug-first、结构性修复和交付前 diff 自审规则。
- 风险：本轮只改文档，不涉及运行时代码；未运行业务构建或测试。`docs/插件UI统一设计规范.md` 当前在工作区但未跟踪，若提交本规范约束，需要同时纳入该文档或确认它已在目标分支。
- 回滚方式：还原 `AGENTS.md` 与本次 `tasks/todo.md` 顶部任务记录即可。

---

# TODO - 2026-05-28 GitHub 展示版本与 Release 同步到 7.05

## 需求规格
- 目标：修复 GitHub 页面上仍可见的旧版本号，确保当前展示版本、文档示例、mockup HTML、发布下载入口与 `7.05` 口径一致。
- 范围：仓库源码版本源头仍以 `src/entries/userscript-meta.js` 的 `@version 7.05` 为准；本轮只清理当前展示/示例里的旧版本，不改历史更新日志条目的真实历史版本。
- 成功标准：全仓当前展示版本无 `7.01`/`6.08` 这类旧示例残留；自动化门禁能捕获 README、CLAUDE、教程、授权示例、mockup 生成脚本/产物的版本不同步；GitHub `releases/latest` 更新到 `v7.05`。

## 执行计划（可核对）
- [x] 扫描仓库与 GitHub 线上状态，确认旧版本号来源。
- [x] 更新版本展示源、文档示例和 mockup 生成脚本/产物。
- [x] 增加版本展示一致性回归测试。
- [x] 运行构建、测试与版本门禁验证。
- [x] 中文提交并推送当前分支。
- [x] 创建并核验 GitHub `v7.05` Release 与下载资产。
- [x] 回填验证记录与结果复盘。

## 高层操作摘要
- 已确认本地 `src/entries/userscript-meta.js`、README 最近更新和 CLAUDE 当前版本为 `7.05`。
- 已确认 GitHub `releases/latest` 仍指向 `v7.01`，发布资产未跟上当前版本；远端 tag 也仅到 `v7.01`。
- 已发现当前展示示例仍残留在 `scripts/generate-mockups.mjs`、`docs/images/mockups/*.html`、`docs/新人使用教程.md`、`docs/授权管理页.md`。
- 已将 mockup 生成脚本改为读取 userscript meta 当前版本，重新生成 `docs/images/mockups/*.html` 与 README 引用的 PNG 截图。
- 已新增回归测试，覆盖 README、CLAUDE、授权文档、教程和 mockup HTML 的当前展示版本同步。
- 已提交 `548d80d docs: 同步 GitHub 展示版本到 7.05` 并推送到 `origin/main`。
- 已创建并推送 tag `v7.05`，Release workflow 成功生成 GitHub Release 和 3 个下载资产。

## 验证记录
- `node --test tests/build-output-sync.test.mjs`：通过，新增当前展示版本同步检查。
- `node scripts/generate-mockups.mjs`：通过，重新生成 `docs/images/mockups/*.html`。
- Chrome headless 截图：已重新生成 `docs/images/{floating-ball,main-panel,assist-switches,download-capture,campaign-quick-entry,tampermonkey-install}.png`，抽查主面板、辅助显示和 Tampermonkey 安装图均显示 `v7.05`。
- `npm run build:check`：通过，构建版本 `7.05`。
- `npm run check:syntax`：通过。
- `git diff --check`：通过。
- `npm run test`：通过，507 项测试中 505 通过、2 个历史跳过（缺少 `agent-cluster/index.mjs`），0 失败。
- `npm run review`：通过，版本一致性检查确认 README/CLAUDE 均为 `7.05`。
- `gh run watch 26550389767 --interval 5 --exit-status`：通过，Release workflow 成功。
- `gh release view v7.05 --json tagName,url,assets,createdAt,publishedAt`：通过，Release 为 `v7.05`，资产包含 `alimama-helper-pro.user.js`、`alimama-helper-pro.meta.js`、`alimama-helper-pro-extension.zip`。
- `curl -sSLI https://github.com/huron09280/alimama-helper-pro/releases/latest`：通过，302 跳转到 `/releases/tag/v7.05`。
- `curl -sSL https://github.com/huron09280/alimama-helper-pro/releases/latest/download/alimama-helper-pro.meta.js | sed -n '1,12p'`：通过，`@version 7.05`。
- `curl -sSL https://github.com/huron09280/alimama-helper-pro/releases/latest/download/alimama-helper-pro.user.js | sed -n '1,12p'`：通过，`@version 7.05`。

## 结果复盘
- 根因：上一轮版本源头与构建产物已到 `7.05`，但 GitHub 最新 Release 仍停在 `v7.01`；同时文档示例、mockup HTML 和 README 截图里仍有旧展示版本，现有 review 门禁只覆盖 README/CLAUDE/脚本头，未覆盖这些展示位。
- 修复结果：当前展示版本统一到 `7.05`，mockup 生成脚本改为从 userscript meta 自动读取版本，新增测试防止文档/示例/HTML mockup 再次漏同步；GitHub `releases/latest` 与下载资产已发布为 `v7.05`。
- 风险与回滚：本轮不改运行时代码；若截图样式需要回退，可恢复 `docs/images/*` 和 mockup 生成脚本，再保留版本同步测试。

---

# TODO - 2026-05-27 版本号与更新日志同步到 7.05

## 需求规格
- 目标：在当前功能改动完成后发布新版本，将版本号和最近更新日志同步到 `7.05`，再中文提交并推送。
- 版本策略：当前版本 `7.04`，本轮包含批量+ 官方能力、过滤人群落库回查、extension 错误页清理等修复与增强，升级为 patch 版本 `7.05`。
- 同步范围：userscript `@version`、脚本内更新日志、README 最近更新、CLAUDE 当前版本、extension manifest 版本测试，以及构建生成产物。
- 成功标准：版本一致性门禁通过，构建产物同步，工作区改动以中文 commit 推送到当前分支。

## 执行计划（可核对）
- [x] 更新源码版本号、脚本更新日志、README、CLAUDE 和版本测试。
- [x] 运行构建同步根 userscript、`dist/packages/` 与 `dist/extension/`。
- [x] 运行版本一致性、语法与必要测试验证。
- [x] 中文提交并推送当前分支。
- [x] 回填验证记录与结果复盘。

## 高层操作摘要
- 已确认版本源头是 `src/entries/userscript-meta.js`，当前为 `7.04`；extension manifest 会由构建脚本归一化为 Chrome 合法版本号。
- 已确认本轮已有未提交功能改动，版本更新会叠加在现有工作区上，不回退已有文件。
- 已将源码版本、脚本更新日志、README、CLAUDE 和 extension manifest 版本测试同步到 `7.05`。
- 已运行 `npm run build`，构建脚本输出版本为 `7.05`，并同步根 userscript、packages 与 extension 产物。

## 验证记录
- `npm run build`：通过，构建版本 `7.05`。
- `npm run build:check`：通过，构建产物同步。
- `npm run check:syntax`：通过。
- `node --test tests/extension-static-build.test.mjs tests/campaign-batch-plus-quick-entry.test.mjs`：通过，15/15。
- `git diff --check`：通过。
- `npm run review`：通过；506 项测试中 504 通过、2 个历史跳过（缺少 `agent-cluster/index.mjs`），0 失败；版本一致性检查通过，README/CLAUDE 均为 `7.05`。

## 结果复盘
- 结果：版本号、最近更新日志和构建产物已统一到 `7.05`。
- 风险与回滚：本轮包含已有功能改动与版本同步；如需回滚，应按提交整体回退，并重新运行 `npm run build` 保证产物一致。

---

# TODO - 2026-05-27 人群推广批量修改屏蔽人群真实提交回查

## 需求规格
- 目标：排查并修复人群推广 `批量+ -> 批量修改屏蔽人群` 是否存在与线索推广相同的“点击确定后看似完成但详情页未落库”问题。
- 约束：用户要求修复到通过；真实提交验证只选可控测试/复制计划，只改过滤人群，不触发投放、预算、删除或创建。
- 成功标准：人群推广批量修改确认提交后，代码会自动回查服务端状态；真实浏览器中至少 2 个计划提交成功，并能通过只读接口证明过滤人群已同步；计划详情 `人群 -> 编辑过滤人群` 官方入口需验证并如实记录页面状态；专项测试、构建检查通过。

## 执行计划（可核对）
- [x] 对比人群推广与线索推广提交链路，确认同类风险点。
- [x] 修改 `src/`：提交后必须回查 `blackCrowd/findList`，未落库时不得报成功。
- [x] 补充专项测试覆盖提交后回查校验。
- [x] 构建同步产物并运行相关验证。
- [x] 重载扩展，在真实人群推广页面执行最小真实提交验证，并打开计划详情确认。
- [x] 回填验证记录与结果复盘。

## 高层操作摘要
- 已确认当前人群推广链路会复用官方 `编辑过滤人群` 弹窗并调用 `/blackCrowd/batchModify.json?bizCode=onebpDisplay`，但提交完成后只按接口 promise 成功计数并刷新，缺少服务端最终状态回查。
- 已增加通用过滤人群落库校验：人群推广与线索推广在 `batchModify/batchDelete` 完成后会重试读取 `blackCrowd/findList`，只有回查结果与弹窗选择一致才计为成功，否则抛出“过滤人群未确认落库”。
- 真实提交预检发现并发批量提交时请求顺序不利于证明逐个计划均完成回查；已改为按计划串行执行“读取旧值 -> 提交 -> 回查确认”，所有计划回查通过后才刷新并报成功。
- 已在真实人群推广列表选中两个测试计划 `81021969209`、`81020127177`，通过官方 `编辑过滤人群` 弹窗确认提交 3 个过滤人群；请求探针证明每个计划均按“提交 -> 提交后回查”顺序完成。

## 验证记录
- `node --check src/main-assistant/campaign-id-quick-entry.js`：通过。
- `node --test tests/campaign-batch-plus-quick-entry.test.mjs`：通过，7/7。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/`。
- `npm run build:check`：通过。
- `npm run check:syntax`：通过。
- `git diff --check`：通过。
- `npm run review`：通过；506 项测试中 504 通过、2 个历史跳过（缺少 `agent-cluster/index.mjs`），0 失败。
- Chrome DevTools MCP：重新加载扩展后，`chrome.developerPrivate.getExtensionInfo('cfegfgaodnfeigffdknhgciapojejflk')` 显示版本 `7.04`、`manifestErrors=0`、`runtimeErrors=0`、`runtimeWarnings=0`。
- Chrome DevTools MCP：刷新真实 `one.alimama.com` 人群推广列表页后，运行态显示 `__AM_GET_SCRIPT_VERSION__() === "7.04"`、`__AM_PLATFORM_RUNTIME__.mode === "extension"`。
- Chrome DevTools MCP：在人群推广列表选中计划 `81021969209`（`E7Pro_AI点睛_测试_4`）与 `81020127177`（`E7Pro_AI点睛_测试`），点击 `批量+ -> 批量修改屏蔽人群`，官方弹窗显示 `编辑过滤人群 / 过滤人群 / 设置过滤人群`，已选 3 个过滤人群：`屏蔽基础属性：50岁以上`、`屏蔽基础属性：40-49岁`、`屏蔽基础属性：18-24岁`。
- Chrome DevTools MCP：点击官方弹窗 `确定` 后，抓包顺序为计划 `81021969209` 先 `findList` 读取旧值、再 `batchModify` 提交、再 `findList` 提交后回查；计划 `81020127177` 随后同样按 `findList -> batchModify -> findList` 串行完成。两次 `batchModify` HTTP 200，响应 `ok=true`，请求均包含 3 个过滤人群。
- Chrome DevTools MCP：用同页面授权态只读查询 `/blackCrowd/findList.json?bizCode=onebpDisplay`，计划 `81021969209` 与 `81020127177` 均返回成功，过滤人群均为 `屏蔽基础属性：50岁以上`、`屏蔽基础属性：40-49岁`、`屏蔽基础属性：18-24岁`。
- Chrome DevTools MCP：进入计划 `81021969209` 详情页并点击 `人群 -> 编辑过滤人群`，官方 `编辑过滤人群` 外层弹窗可打开，但当前页面未渲染过滤人群内容区；未在该弹窗内提交。最终落库结论以后续同授权态只读 `findList` 回查为准。

## 结果复盘
- 结论：人群推广存在与线索推广同类的交付风险。旧链路虽然调用了官方提交接口，但只依赖提交 promise 成功，未证明服务端最终状态已更新；在用户指出“详情页看不到变化”的场景下容易误报完成。
- 修复结果：人群推广和线索推广共用过滤人群身份归一化与落库校验，提交后必须回查 `blackCrowd/findList` 并与弹窗选择一致才算成功；批量处理改为按计划串行，避免并发请求造成状态证明不清晰。
- 风险与回滚：如果官方调整 `blackCrowd/findList` 的 `crowdList` 结构，校验会失败关闭并提示“过滤人群未确认落库”，不会静默报成功；回滚可撤销本次回查与串行同步逻辑，但会恢复旧的假成功风险。

# TODO - 2026-05-27 线索推广批量修改屏蔽人群真实提交不生效

## 需求规格
- 目标：修复线索推广列表 `批量+ -> 批量修改屏蔽人群` 在官方弹窗中点击确定后真实提交不生效的问题，直到打开计划详情确认过滤人群已同步。
- 约束：用户已明确授权真实提交验证；仍需选择最小可控改动，避免触发无关投放、预算、删除或创建动作；优先复用官方弹窗和官方接口。
- 成功标准：批量选择至少 2 个线索推广计划，编辑过滤人群并确认后，请求返回成功；逐个打开/查询计划详情能看到相同过滤人群结果；专项测试、构建检查和真实浏览器验证通过。

## 执行计划（可核对）
- [x] 执行真实点击确定链路，记录请求、响应、弹窗回调数据和详情页结果。
- [x] 定位是否仍存在回调取值、提交 payload、删除/修改差异计算、异步刷新或接口语义问题。
- [x] 复核 `src/` 中线索推广批量同步逻辑，保持官方弹窗链路和最小侵入；本轮未发现需新增源码改动。
- [x] 复跑专项测试覆盖官方弹窗链路。
- [x] 运行构建同步校验。
- [x] 在真实浏览器执行授权范围内的提交验证，并打开计划详情确认已生效。
- [x] 回填验证记录与结果复盘，并将本轮验收教训同步到 `tasks/lessons.md`。

## 高层操作摘要
- 已启动本轮真实提交修复；上一轮只验证打开/取消，未覆盖用户现在指出的“确认后提交不生效、计划详情内无变化”。
- 已在真实线索推广列表选中两个复制计划 `14581908434`、`14549542833`，通过 `批量+ -> 批量修改屏蔽人群` 打开官方 `编辑过滤人群` 弹窗，选择 `50岁以上` 后点击外层确定完成真实提交。
- 已确认当前 7.04 线索专用官方弹窗链路真实生效；本轮未新增源码改动，上一轮 `src/main-assistant/campaign-id-quick-entry.js` 的线索专用读取/弹窗/批量同步链路就是对应修复。

## 验证记录
- Chrome DevTools MCP：真实提交后网络记录出现两次 `/blackCrowd/batchModify.json?bizCode=onebpAdStrategyLiuZi`，分别提交到计划 `14581908434` 与 `14549542833`，HTTP 状态均为 200，payload 均包含 1 个过滤人群 `50岁以上`。
- Chrome DevTools MCP：用当前页面授权态只读查询 `/blackCrowd/findList.json?bizCode=onebpAdStrategyLiuZi`，计划 `14581908434` 与 `14549542833` 均返回成功，过滤人群均为 `屏蔽基础属性:50岁以上`。
- Chrome DevTools MCP：打开计划 `14581908434` 详情页，进入 `人群 -> 编辑过滤人群`，官方弹窗显示 `已选择 1 个人群` 和 `屏蔽基础属性:50岁以上`。
- Chrome DevTools MCP：打开计划 `14549542833` 详情页，进入 `人群 -> 编辑过滤人群`，官方弹窗显示 `已选择 1 个人群` 和 `屏蔽基础属性:50岁以上`。
- `node --test tests/campaign-batch-plus-quick-entry.test.mjs`：通过，7/7。
- `npm run build:check`：通过，构建产物与源码同步。

## 结果复盘
- 结论：这次按用户授权完成了外层确定后的真实提交闭环，接口层和详情页官方窗口均证明已落库；未复现当前 7.04 仍不生效的问题。
- 根因归档：上一轮只验到“能打开官方窗口并取消不提交”，没有覆盖“确认提交后再进入计划详情核对”的交付标准，导致用户看到的实际问题未被验收闭环捕获。
- 风险与边界：保存请求的响应 body 因页面自动刷新已无法从 DevTools preserved network 读取，但后续只读查询和两个计划详情页官方弹窗均确认了最终服务端状态。

# TODO - 2026-05-27 线索推广批量修改屏蔽人群修复

## 需求规格
- 目标：修复线索推广列表里的 `批量+ -> 批量修改屏蔽人群`，在真实浏览器中验证可用。
- 约束：优先复用线索推广官方页面能力；不得跳转详情页伪装批量能力；不得提交真实修改，除非有明确阻断/拦截保护或只做打开/取消验证。
- 成功标准：在线索推广列表选中计划后点击 `批量修改屏蔽人群`，能原地打开正确的官方屏蔽/人群过滤编辑界面；不误走人群推广接口；不触发真实提交；专项测试、构建检查和浏览器验证通过。

## 执行计划（可核对）
- [x] 在真实线索推广页复现当前 `批量修改屏蔽人群` 行为，记录页面、按钮、错误和网络请求。
- [x] 定位线索推广官方单计划入口和可复用的弹窗/抽屉宿主参数。
- [x] 以最小范围修改 `src/`，让线索推广走官方原地编辑链路。
- [x] 补充或更新 `tests/campaign-batch-plus-quick-entry.test.mjs` 专项断言。
- [x] 构建同步产物并运行相关语法、专项测试、build check/review。
- [x] 重载扩展后在真实浏览器复验，记录是否打开官方界面、URL 是否停留列表页、是否有提交类请求。
- [x] 回填验证记录与结果复盘；如形成通用规则则更新 `tasks/lessons.md`。

## 高层操作摘要
- 已回顾 `AGENTS.md` 与 `tasks/lessons.md`；本轮需遵守官方弹窗复用、真实浏览器验收和不触发真实提交的边界。
- 真实线索列表复现：选中计划 `14581908434` 后点击 `批量+ -> 批量修改屏蔽人群`，页面仍停留列表且没有打开 `编辑过滤人群` 弹窗，也没有发起读取/提交请求；当前实现只是点击行内 `高级设置` 并误报成功。
- 真实线索详情页确认：`人群 -> 编辑过滤人群` 打开官方 `campaign/info` 弹窗，组件为 `campaignCrowdFilterList`，读取接口为 `/blackCrowd/findList.json?bizCode=onebpAdStrategyLiuZi`，同时读取 `/campaign/get.json?bizCode=onebpAdStrategyLiuZi` 补齐完整 campaign 参数。
- 已新增线索推广专用 `runLeadBatchShieldCrowd` 链路：先读取线索计划和过滤人群，再复用官方 `编辑过滤人群` 弹窗；提交回调按选中计划批量同步 `/blackCrowd/batchModify.json` 与 `/blackCrowd/batchDelete.json`，bizCode 保持 `onebpAdStrategyLiuZi`。
- 已同步构建产物并在真实列表页复验：选中计划后点击 `批量修改屏蔽人群` 会原地打开官方 `编辑过滤人群` 弹窗，不再误点行内 `高级设置`。

## 验证记录
- `node --check src/main-assistant/campaign-id-quick-entry.js`：通过。
- `node --test tests/campaign-batch-plus-quick-entry.test.mjs`：通过，7/7。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/`。
- `npm run build:check`：通过。
- `npm run check:syntax`：通过。
- `git diff --check`：通过。
- `npm run review`：通过；506 项测试中 504 通过、2 个历史跳过（缺少 `agent-cluster/index.mjs`），0 失败。
- Chrome DevTools MCP：重新加载扩展后，`chrome.developerPrivate.getExtensionInfo('cfegfgaodnfeigffdknhgciapojejflk')` 显示版本 `7.04`、`manifestErrors=0`、`runtimeErrors=0`、`runtimeWarnings=0`。
- Chrome DevTools MCP：刷新真实 `one.alimama.com` 线索推广列表页后，运行态显示 `__AM_GET_SCRIPT_VERSION__() === "7.04"`、`__AM_PLATFORM_RUNTIME__.mode === "extension"`。
- Chrome DevTools MCP：在线索推广列表页选中计划 `14581908434`，点击 `批量+ -> 批量修改屏蔽人群`，页面停留 `#!/manage/hky?orderField=charge&orderBy=desc`，原地打开官方弹窗 `编辑过滤人群 / 过滤人群 / 设置过滤人群`。
- Chrome DevTools MCP：上述操作仅发起 `/blackCrowd/findList.json?bizCode=onebpAdStrategyLiuZi` 与 `/campaign/get.json?bizCode=onebpAdStrategyLiuZi` 两个读取请求；未点击确定，取消后弹窗关闭，拦截探针记录 `blocked=[]`，未触发 `/blackCrowd/batchModify.json`、`/blackCrowd/batchDelete.json` 或其它提交类请求。

## 结果复盘
- 根因：线索推广 `批量修改屏蔽人群` 复用了通用原生入口点击逻辑，只能尝试点击行内 `高级设置`，没有按线索详情页官方 `人群 -> 编辑过滤人群` 链路准备完整 campaign 与过滤人群参数，因此列表页会误报成功但不弹出目标窗口。
- 修复结果：线索推广现在有专用官方弹窗链路，读取 `/campaign/get.json` 与 `/blackCrowd/findList.json` 后调用官方 `campaign/info` 弹窗，并在确认回调里才按选中计划批量同步过滤人群；列表页打开/取消验证通过且未触发真实提交。
- 风险与回滚：实现依赖官方 `campaign/info` 视图、`campaignCrowdFilterList` 组件和 `changeCampaignCrowdFilterList` 操作码；若官方改版，回滚可撤销线索专用 `runLeadBatchShieldCrowd` 链路，但会恢复为无法打开过滤人群弹窗的旧行为。

# TODO - 2026-05-27 修复 Chrome 扩展错误页全部报错

## 需求规格
- 目标：打开 `chrome://extensions/?errors=cfegfgaodnfeigffdknhgciapojejflk`，逐项定位并修复该扩展错误页中提示的所有错误。
- 约束：优先修 `src/`，通过构建同步根 userscript 与 `dist/extension/`；不得手工绕过生成产物；不改无关功能。
- 成功标准：Chrome 扩展错误页不再显示未处理错误；相关语法、构建、测试和浏览器验证通过。

## 执行计划（可核对）
- [x] 打开 Chrome 扩展错误页，记录所有错误文本、来源文件和触发栈。
- [x] 映射错误到源码根因，判断是局部修复还是结构性修复。
- [x] 修改 `src/` 或必要的构建脚本，保持最小侵入并同步生成产物。
- [x] 运行相关 `node --check`、专项测试、`npm run build:check`/`npm run review` 级验证。
- [x] 重新加载扩展并复查 `chrome://extensions` 错误页，确认错误清空或不再新增。
- [x] 回填验证记录与结果复盘。

## 高层操作摘要
- 已回顾 `AGENTS.md`、`tasks/lessons.md` 和外部 AGENT-v2 规则；本轮按 debug-first 和根因修复执行。
- 已通过 `chrome.developerPrivate.getExtensionInfo()` 读取扩展 `cfegfgaodnfeigffdknhgciapojejflk` 的完整错误集合：初始有 54 条 runtime 记录，主要分为 `Extension context invalidated`、7.03 旧 bundle 的 `wizardDefaultDraft` 初始化顺序错误、以及 EscortAPI 控制流失败日志三类。
- 已修复 `src/entries/extension-content.js`：授权桥转发 `chrome.runtime.sendMessage` 时捕获扩展上下文失效，并把后续请求转换为明确的 `runtime_unavailable` 响应，避免旧 content script 在扩展重载后继续抛未捕获异常。
- 已修复 `src/optimizer/api.js`：API 请求失败仍按原链路抛出给调用方，但日志改为 `Logger.info`，避免已处理的业务失败、网络失败或受保护拦截被 Chrome 归类为扩展 error/warning。
- 已更新 `tests/extension-static-build.test.mjs`，覆盖 content script 保护式转发和 extension page bundle 不把 API 控制流失败写入 Chrome 扩展错误页。
- 已运行构建同步根 userscript、`dist/packages/` 与 `dist/extension/`；Chrome 重新加载 unpacked extension 后版本为 `7.04`。

## 验证记录
- `node --check src/entries/extension-content.js`：通过。
- `node --check src/optimizer/api.js`：通过。
- `node --test tests/extension-static-build.test.mjs tests/campaign-copy-current-plan-quick-entry.test.mjs`：通过，20/20。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/`。
- `npm run build:check`：通过。
- `npm run check:syntax`：通过。
- `git diff --check`：通过。
- `npm run review`：通过；505 项测试中 503 通过、2 个历史跳过（缺少 `agent-cluster/index.mjs`），0 失败。
- Chrome DevTools MCP：在 `chrome://extensions/?errors=cfegfgaodnfeigffdknhgciapojejflk` 清空旧错误并重新加载扩展，`getExtensionInfo()` 显示版本 `7.04`、`manifestErrors=0`、`runtimeErrors=0`、`runtimeWarnings=0`。
- Chrome DevTools MCP：刷新真实 `one.alimama.com` 关键词推广页面后，页面运行态显示 `__AM_GET_SCRIPT_VERSION__() === "7.04"`、`__AM_PLATFORM_RUNTIME__.mode === "extension"`、`__AM_WXT_PLAN_API_BRIDGE_HOST__ === true`；再次复查扩展错误页仍为 `manifestErrors=0`、`runtimeErrors=0`、`runtimeWarnings=0`。

## 结果复盘
- 根因：Chrome 错误页混合了旧运行态历史错误和当前代码缺陷。`content.js` 在扩展重载后仍可能收到页面 license bridge 消息，直接调用失效的 `chrome.runtime.sendMessage` 会生成 `Extension context invalidated`；EscortAPI 将已处理的请求失败用 `console.error/warn` 记录，导致业务失败和测试拦截噪声进入扩展错误页。
- 修复结果：content 授权桥现在对失效上下文显式降级响应；API 请求失败仍保留日志和抛错，但不再污染 Chrome 扩展错误集合。重新加载 7.04 并刷新真实页面后，错误页已清空且没有新增错误。
- 风险与回滚：改动不改变 API 失败语义，只改变已处理失败的控制台级别；若需要回滚，可撤销 `src/entries/extension-content.js` 的 runtime unavailable 保护和 `src/optimizer/api.js` 的日志级别调整，但 Chrome 错误页会重新被已处理失败污染。

# TODO - 2026-05-27 版本号与更新日志同步到 7.04

## 需求规格
- 目标：将本轮复制计划、批量人群与 extension bridge 修复同步到版本号和最近更新日志。
- 版本策略：当前版本 `7.03`，本轮为向后兼容的问题修复与体验增强，升级为 patch 版本 `7.04`。
- 同步范围：userscript `@version`、脚本内更新日志、README 最近更新、CLAUDE 当前版本，以及构建生成产物。
- 成功标准：构建产物版本一致，`npm run build:check`、`npm run check:syntax` 和版本门禁通过。

## 执行计划（可核对）
- [x] 更新源码版本号与最近更新日志。
- [x] 更新 README/CLAUDE 版本说明。
- [x] 运行构建同步根 userscript、packages 与 extension 产物。
- [x] 运行版本一致性与语法验证。
- [x] 回填验证记录与结果复盘。

## 高层操作摘要
- 已将 userscript 源版本从 `7.03` 升级到 `7.04`，并把脚本内更新日志新增 `v7.04 (2026-05-27)`。
- 已同步 README 最近更新和 CLAUDE 当前版本，日志覆盖复制 API bridge、新复制确认窗、成功页内搜索、人群推广批量官方弹窗和回归测试扩充。
- 已运行构建，根 userscript、`dist/packages/` 与 `dist/extension/` 产物均同步到 `7.04`。

## 验证记录
- `npm run build`：通过，构建版本 `7.04`。
- `npm run build:check`：通过，构建产物同步。
- `npm run check:syntax`：通过。
- `node --test tests/extension-static-build.test.mjs`：通过，7/7。
- `git diff --check`：通过。
- `bash scripts/review-team.sh`：通过；504 项测试中 502 通过、2 个历史跳过（缺少 `agent-cluster/index.mjs`），0 失败；版本一致性检查通过，README/CLAUDE 均为 `7.04`。

## 结果复盘
- 结果：版本号、最近更新日志和构建产物已统一到 `7.04`。
- 风险与回滚：本轮只同步版本/日志和对应测试预期；回滚需同时恢复 `src/entries/userscript-meta.js`、README、CLAUDE、脚本内日志和构建产物版本。

# TODO - 2026-05-27 新设备安装后复制计划 API 未就绪

## 需求规格
- 目标：修复在另一台电脑新安装后点击复制计划时报 `[AM] ⚠️ 复制失败：源计划80227512963，原因：计划复制 API 未就绪，请刷新页面后重试` 的问题。
- 初步判断：复制按钮层依赖页面侧 `copyCurrentPlanByScene` 桥接方法；新安装或注入时序不同步时，页面 API 可能尚未挂载到可用对象，导致按钮直接失败。
- 约束：优先定位桥接/注入初始化根因；不绕过官方复制安全检查；不触发真实创建投放计划做无保护验证。
- 成功标准：新安装/初始化时序下复制入口能等待或恢复计划复制 API；专项测试、构建检查通过；真实页面或受保护验证能证明不再直接报 API 未就绪。

## 执行计划（可核对）
- [x] 回查复制按钮解析计划 API 的入口、桥接白名单和页面侧 API 挂载时序。
- [x] 设计最小修复：API 未就绪时主动等待/重取桥接，必要时触发页面 API 懒加载，而不是立即报错。
- [x] 修改 `src/` 并补充复制专项回归测试覆盖 API 延迟就绪场景。
- [x] 构建同步产物并运行相关 `node --check`、专项测试、build check/review 级验证。
- [x] 回填验证记录、结果复盘；若形成可复用规则则更新 `tasks/lessons.md`。

## 高层操作摘要
- 已回顾 `AGENTS.md`、`tasks/lessons.md` 中复制计划相关教训；本轮属于复制关键路径修复，先定位根因再改动。
- 已确认主助手与 `KeywordPlanApi` 分处两个 IIFE：userscript 依赖 sandbox `globalThis` 共享完整 API，extension 为避免 page 全局高权限 API 暴露，只默认安装 openWizard 窄桥；新设备没有 `__AM_WXT_DEBUG_PAGE_API__=1` 时，复制入口拿不到 `copyCurrentPlanByScene`。
- 已在主助手中增加完整计划 API 的内部桥代理与 `waitForKeywordPlanApiAccessor()`，复制入口在准备与提交阶段都等待 `copyCurrentPlanByScene` 就绪。
- 已调整 extension 运行态：默认安装内部 `installPageApiBridgeHost()`，但 `window.__AM_WXT_KEYWORD_API__` / `window.__AM_WXT_PLAN_API__` 全局客户端仍只在 debug 开关下暴露。
- 已更新复制、extension 静态构建和 bridge 安全契约测试，明确覆盖“内部 bridge host 可用、page 全局完整 API 不默认暴露”的边界。

## 验证记录
- `node --check src/main-assistant/campaign-id-quick-entry.js`：通过。
- `node --check src/optimizer/bridge.js`：通过。
- `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs tests/keyword-wizard-entry-regression.test.mjs tests/extension-static-build.test.mjs`：通过，26/26。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/`。
- `npm run build:check`、`npm run check:syntax`、`git diff --check`：通过。
- `node --test tests/keyword-plan-api-bridge-security.test.mjs tests/campaign-copy-current-plan-quick-entry.test.mjs tests/keyword-wizard-entry-regression.test.mjs tests/extension-static-build.test.mjs`：通过，33/33。
- `npm run review`：通过；504 项测试中 502 通过、2 个历史跳过（缺少 `agent-cluster/index.mjs`），0 失败。
- Chrome DevTools MCP：在真实 `one.alimama.com` 关键词推广页面临时移除 `__AM_WXT_DEBUG_PAGE_API__` 并刷新，验证 extension runtime 下 `debugFlag=null`、`window.__AM_WXT_PLAN_API__` 与 `window.__AM_WXT_KEYWORD_API__` 均未暴露完整复制 API，但 `window.__AM_WXT_PLAN_API_BRIDGE_HOST__ === true`。
- Chrome DevTools MCP：同一无 debug 状态下，通过内部 bridge probe 调用 `copyCurrentPlanByScene`，返回业务校验错误 `复制计划缺少源计划数据`，证明命中真实复制方法而非 `method_not_found` / API 未就绪；随后恢复本机原 debug 开关值。
- Chrome DevTools MCP：同一页面点击计划 `69514602419` 的 `复制1` 后，不再出现 `计划复制 API 未就绪`；当前页面因 Token 未就绪停在更早的鉴权提示 `Token 未就绪，请先在页面手动点击一次计划开关后重试`，未触发创建/复制提交。

## 结果复盘
- 根因：extension 新安装环境没有本机 debug 开关，主助手只能通过 openWizard 窄桥打开组建计划；复制按钮需要的 `copyCurrentPlanByScene` 不在窄桥里，导致准备复制时直接报 `计划复制 API 未就绪`。
- 修复结果：extension 默认提供不挂全局对象的内部完整桥 host，主助手通过闭包内桥代理等待并调用 `copyCurrentPlanByScene`；page 全局完整 API 客户端仍保持 debug-only，避免恢复高权限全局暴露。
- 风险与回滚：改动集中在 API 桥接解析和 extension bridge host 安装时序；回滚可撤销内部完整桥默认安装和 `waitForKeywordPlanApiAccessor()` 调用，但新安装环境会重新出现复制 API 未就绪。

# TODO - 2026-05-27 复制成功确认改为页内搜索

## 需求规格
- 目标：复制成功弹窗点击确认后，不刷新页面，不整页跳转；直接在当前列表页“计划名称”搜索框搜索公共计划名。
- 搜索词规则：以新计划名称为准，去掉最右侧 `_<数字>` 后再搜索，例如 `E7pro_自定义_1` 搜索 `E7pro_自定义`。
- 约束：保留成功弹窗明细、成功结果判断和取消只关闭弹窗；不得再次触发真实复制或其它投放修改。
- 成功标准：专项测试、构建检查通过；真实页面可证明确认后页面未 reload/assign，而是计划名称输入框变为公共计划名并触发搜索。

## 执行计划（可核对）
- [x] 更新复制成功搜索词归一化逻辑，优先去掉新计划名最右侧 `_<数字>`。
- [x] 将成功确认行为从 URL reload/assign 改为当前页搜索框写值并触发回车搜索。
- [x] 更新专项测试、构建产物和任务教训。
- [x] 用 Chrome DevTools MCP 做真实页面或受保护弹窗验证。

## 高层操作摘要
- 已回顾当前复制成功刷新链路和相关教训；本轮只改成功确认后的“查看结果”行为，不改真实复制提交、暂停兜底和成功结果判定。
- 已将成功弹窗确认文案从“确定并刷新”改为“确定并搜索”，确认后优先查找当前页 `计划名称 / 回车搜索` 输入框，写入公共计划名并触发回车搜索。
- 已把搜索词生成逻辑改为先对新计划名称执行复制序号归一化，去掉最右侧 `_<数字>`，例如 `E7pro_自定义_123` 搜索 `E7pro_自定义`。
- 已保留地址栏搜索条件同步，但使用 `history.replaceState` 更新 hash 查询参数，不调用 `window.location.reload()` 或 `window.location.assign()`。
- 已在 `tasks/lessons.md` 追加 L66，沉淀“复制成功确认优先页内搜索”的规则。

## 验证记录
- `node --check src/main-assistant/campaign-id-quick-entry.js`：通过。
- `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs`：通过，12/12。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/`。
- `npm run build:check`、`npm run check:syntax`、`git diff --check`：通过。
- `npm run review`：通过；504 项测试中 502 通过、2 个历史跳过（缺少 `agent-cluster/index.mjs`），0 失败。
- Chrome DevTools MCP：重载本地 unpacked extension 与关键词推广页面后，在真实 `one.alimama.com` 列表页用受保护假复制 API 验证成功弹窗；未触发 `solution/copy`、`solution/addList`、`create` 等真实创建/复制请求。
- Chrome DevTools MCP：复制 `E7pro_自定义_1` 后成功弹窗显示 `新计划明细：E7pro_自定义_123`，确认按钮为 `确定并搜索`，说明文案为“点击“确定并搜索”后将在计划名称框搜索公共名称。”
- Chrome DevTools MCP：点击 `确定并搜索` 后，当前页搜索框值变为 `E7pro_自定义`，URL 变为 `searchKey=campaignNameLike&searchValue=E7pro_自定义`，且 `performance.timeOrigin` 与操作前一致，证明没有整页刷新。

## 结果复盘
- 根因：旧成功确认行为以刷新/跳转到搜索 URL 为主，且搜索词可能保留新计划最右复制序号，不符合用户要在当前页按公共名称筛选的交互。
- 修复结果：成功确认现在复用当前页计划名称搜索框完成筛选，并按新计划名去掉最右 `_<数字>` 后搜索；找不到输入框时只同步地址栏搜索参数，不整页刷新。
- 风险与回滚：依赖当前列表页可见搜索框的 `计划名称/回车搜索` 文案；若官方 DOM 后续改版，回退行为仍会同步 URL 参数但不会刷新。回滚可恢复 `navigateToCopySuccessSearch()` 的 reload/assign 逻辑，但会重新出现整页刷新体验。

# TODO - 2026-05-27 E7pro_自定义真实复制提交失败

## 需求规格
- 目标：修复关键词推广计划 `E7pro_自定义` 点击 `复制` 后，确认生成进行真实提交时报错、无法复制成功的问题。
- 约束：优先定位真实失败根因，不做绕过式修复；复制链路仍需保留提交前一览窗、可编辑字段、暂停兜底、成功确认与刷新搜索能力。
- 安全边界：真实页面验证可在用户已授权目标计划复制的前提下执行；不得修改非目标计划，不额外触发开启/暂停/删除等无关投放动作。
- 成功标准：专项测试和构建检查通过；真实 `one.alimama.com` 页面中 `E7pro_自定义` 的复制确认生成成功，服务端能查到新计划或成功弹窗能展示新计划结果。

## 执行计划（可核对）
- [x] 复现或定位 `E7pro_自定义` 真实提交失败的具体错误、接口与请求载荷。
- [x] 对照复制链路源码和最近教训，确定是预览行覆盖、源计划字段裁剪、目标合同、预算/出价还是提交结果判定导致失败。
- [x] 以最小范围修改 `src/` 复制链路，必要时补充专项回归测试。
- [x] 构建同步产物并运行相关 `node --check`、专项测试、build check/review 级验证。
- [x] 用 Chrome DevTools MCP 在真实页面验证 `E7pro_自定义` 复制成功，并记录网络/页面结果。

## 高层操作摘要
- 已回顾 `AGENTS.md`、`tasks/lessons.md` 和当前复制计划历史记录；本轮属于创建/复制关键路径，必须证明真实服务端结果成功后才能完成。
- 真实复现：在关键词推广列表 `searchValue=E7pro_自定义` 点击计划 `69514602419` 的 `复制`，一览窗显示 `E7pro_自定义_1`、手动出价、每日预算 1000；点击 `确认生成` 后 `/solution/addList.json` 两次返回 HTTP 200 且 `info.ok=true`，但 `data.list[0].campaignId=null`，弹窗报 `服务端未返回 campaignId`。
- 根因定位：`campaign/get.json` 源计划字段为 `bidTypeV2:"custom_bid"`、`bidType:"custom_bid"`，但提交载荷变成 `bidTypeV2:"smart_bid"`、`bidTargetV2:"conv"`。原因是 `normalizePlans()` 在复制计划没有显式 `plan.bidMode` 时先写入 common 默认 `smart`，后续 `resolvePlanBidMode()` 被这个默认值短路，无法再读取 `rawOverrides.campaign.bidTypeV2`。
- 已修复：`normalizePlans()` 归一化单计划时优先从 `plan.rawOverrides.campaign.bidTypeV2/bidType` 与 `request.common.rawOverrides.campaign.bidTypeV2/bidType` 读取源计划出价方式，再回退 common 默认；同时补充回归断言防止复制链路再次把 `custom_bid` 漂移成 `smart_bid`。
- 真实复验：重载本地 unpacked extension 后，在真实关键词推广列表再次复制 `E7pro_自定义`，一览窗仍显示 `手动出价`、`E7pro_自定义_1`、每日预算 1000；点击 `确认生成` 后服务端成功创建新计划 `E7pro_自定义_1`（campaignId `81032293252`），并通过暂停兜底将新计划状态回写为暂停。

## 验证记录
- `node --check src/optimizer/keyword-plan-api/search-and-draft.js`：通过。
- `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs`：通过，12/12。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/`。
- `npm run build:check`、`npm run check:syntax`、`git diff --check`：通过。
- `npm run review`：通过；504 项测试中 502 通过、2 个历史跳过（缺少 `agent-cluster/index.mjs`），0 失败。
- Chrome DevTools MCP：重载本地 unpacked extension 与关键词推广页面后，点击 `E7pro_自定义`（campaignId `69514602419`）复制；一览窗显示 `E7pro_自定义_1`、`手动出价`、出价不可编辑、每日预算 `1000`。
- Chrome DevTools MCP：确认生成后 `/solution/addList.json` HTTP 200 且 `info.ok=true`，请求载荷中 `campaign.bidTypeV2:"custom_bid"`，不再漂移为 `smart_bid/conv`；响应返回新计划 `E7pro_自定义_1`、campaignId `81032293252`、adgroupId `81032333166`。
- Chrome DevTools MCP：随后 `/campaign/updatePart.json` HTTP 200 且 `info.ok=true`，请求 `displayStatus:"pause"`，响应 `onlineStatus:0`；成功弹窗显示 `本次复制成功：1 个`，刷新后列表可查到 `E7pro_自定义_1`（campaignId `81032293252`），行内显示 `手动出价`、每日预算 `1,000元`。

## 结果复盘
- 根因：复制链路在 `normalizePlans()` 阶段过早把缺失显式 `bidMode` 的复制计划归一到 common 默认智能出价，导致后续从源计划 rawOverrides 读取 `custom_bid` 的逻辑被短路，真实创建接口收到错误的智能出价合同。
- 修复结果：复制计划现在优先继承源计划 rawOverrides 中的 `bidTypeV2/bidType`，`E7pro_自定义` 真实提交已成功创建新计划，并保留手动出价与暂停兜底行为。
- 风险与回滚：改动集中在复制请求归一化阶段，主要影响“无显式 bidMode、但源计划 rawOverrides 有真实出价方式”的复制场景；回滚可撤销 `rawCampaignBidMode` 优先级补丁和对应测试断言。

# TODO - 2026-05-27 批量人群设置直接弹官方抽屉

## 需求规格
- 目标：人群推广列表 `批量+ -> 批量人群设置` 点击后直接打开官方 `批量编辑人群` 抽屉/弹窗。
- 缺陷：当前实现会先打开官方 `批量计划设置` 菜单/弹层，再从里面触发 `批量编辑人群`，用户看到两次弹窗。
- 约束：继续复用官方人群设置能力，不跳转详情页；不通过中间官方批量计划设置弹层；真实页面验证只打开和取消/关闭，不提交修改。
- 成功标准：选中人群推广计划后点击 `批量人群设置`，页面只出现一次 `批量编辑人群` 抽屉；不出现 `批量计划设置` 中间弹层；测试、构建和真实页面验收通过。

## 执行计划（可核对）
- [x] 抓取官方 `批量编辑人群` 抽屉的直接 `mxModal`/VFrame 调用参数，确认绕过中间菜单的最小入口。
- [x] 修改 `openDisplayNativeBatchCrowdDrawer`，优先直接调用官方抽屉，失败时不再主动打开中间菜单造成双弹窗。
- [x] 更新回归测试和教训，防止后续又走 `批量计划设置 -> 批量编辑人群` 两段式。
- [x] 构建同步产物并运行专项测试、语法检查、review。
- [x] 用 Chrome DevTools MCP 在真实人群推广页验证点击后只弹一次，且不触发真实提交。

## 高层操作摘要
- 已回顾相关教训：官方隐藏弹窗能力应复用官方宿主，但不能把用户可见的中间菜单当作必经交互；本轮要直接打开最终官方人群设置抽屉。
- 真实页面抓取确认官方最终抽屉由计划列表 VFrame 直接 `mxModal('onebp/views/pages/manage/campaign/batch-show')` 打开，核心参数为 `campaignIdList` 与 `tab: 'crowd'`，不需要先展开 `批量计划设置` 菜单。
- 已将 `openDisplayNativeBatchCrowdDrawer` 改为定位人群推广计划列表 VFrame，复用当前页面的 `biz/parentParams/adcConfig/batchOperList` 等官方上下文，直接打开 `批量编辑人群` 全屏抽屉。
- 已更新专项回归测试，明确断言 `批量人群设置` 不再调用 `findNativeBatchPlanSettingHost`、`triggerNativeBatchPlanSettingMenu`、`findNativeBatchPlanMenuItem` 或 `dispatchNativeMouseClick`。

## 验证记录
- `node --check src/main-assistant/campaign-id-quick-entry.js`：通过。
- `node --test tests/campaign-batch-plus-quick-entry.test.mjs`：通过，6/6。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/`。
- `npm run build:check`、`npm run check:syntax`、`git diff --check`：通过。
- `npm run review`：通过；504 项测试中 502 通过、2 个历史跳过（缺少 `agent-cluster/index.mjs`），0 失败。
- Chrome DevTools MCP：重载本地 unpacked extension 后，复验人群推广列表 `#!/manage/display?...searchValue=E7Pro_AI点睛_测试`。选择测试计划 `81020127177` 后点击 `批量+ -> 批量人群设置`，页面直接打开官方 `批量编辑人群` 全屏抽屉，抽屉内可见 `添加人群 / 批量修改状态 / 批量修改出价`。
- Chrome DevTools MCP：同次验收中没有可见的 `#am-campaign-batch-plus-menu` 或 `popmenu_*` 官方批量计划设置中间菜单残留；URL 保持列表页；Network 只有 `crowd/horizontal/findPage.json`、`report/query.json` 等读取请求，没有 `modify`、`updatePart`、`delete` 等提交类修改请求。已点击抽屉左上关闭按钮退出，未提交任何人群修改。

## 结果复盘
- 根因：旧实现把官方 `批量计划设置` 菜单当成打开 `批量编辑人群` 的必经入口，用户点击插件菜单后会先看到官方中间菜单，再看到最终抽屉。
- 修复结果：`批量人群设置` 现在直接定位人群推广计划列表 VFrame，并调用官方 `onebp/views/pages/manage/campaign/batch-show`，通过 `campaignIdList + tab: 'crowd'` 打开最终抽屉。
- 风险与回滚：依赖官方计划列表 VFrame 的 `viewOptions` 上下文；若官方后续改名或移除该 VFrame，会显示明确错误并不再主动打开中间菜单。回滚可恢复到上一版菜单中转实现，但会重新出现双弹窗体验问题。

# TODO - 2026-05-27 复制计划提交前一览编辑窗

## 需求规格
- 目标：点击计划行 `复制` 后，不再直接提交复制请求；先弹出复制计划一览窗，按复制数量展示每个待生成计划。
- 一览窗列：至少包含 `计划名称`、`出价方式`、`出价价格`、`预算`；计划名称、出价价格和预算可编辑，出价方式按源计划展示文案只读；确认后才开始提交。
- 最新反馈：一览窗要更宽且不能出现横向滚动条；出价方式必须优先取当前计划行的中文展示，不能把手动出价误显示成智能出价；编辑控件改为底部横线样式，不使用完整边框。
- 最新列宽反馈：一览窗每列宽度按内容紧凑适配，短文本列不要被固定百分比拉得过宽，计划名称列占剩余空间。
- 最新批量编辑反馈：一览窗内需要批量编辑能力，出价价格支持按首价到尾价生成等差梯度（如 3 到 8 生成 3/4/5/6/7/8），预算支持统一批量设置到所有待复制计划。
- 最新出价展示反馈：表头从 `出价方式` 改为 `计划出价方式`；智能出价行内需展示具体目标明细，如 `智能出价（促点击）`、`智能出价（促成交）`、`智能出价（促收藏加购）`，仍保持只读不可编辑。
- 最新无出价反馈：若源计划没有可读到的出价价格，则一览窗里的出价价格不能编辑，批量出价也不能给这些计划新增覆盖。
- 提交过程：确认后显示生成中/提交中状态，防止重复提交；最终成功时显示成功确认。
- 成功后行为：用户点击成功确认后刷新页面，并定位/搜索到本次新生成的搜索计划名称。
- 约束：保持现有复制 API、数量徽标、暂停兜底和成功弹窗能力；仅在确认后触发真实创建；不影响非复制行操作与批量菜单。
- 成功标准：复制前可编辑一览窗、确认后提交、生成中态、成功确认、刷新后搜索新计划名全部可由测试或真实页面验收证明。

## 执行计划（可核对）
- [x] 回顾现有复制按钮、复制 API 入参、命名与成功刷新链路，确认最小改动点。
- [x] 设计并实现复制一览窗：行数据生成、计划名称/出价/预算字段编辑、校验与取消。
- [x] 将复制提交流程改为一览窗确认后执行，并在提交期间展示生成状态和防重复提交。
- [x] 让编辑后的计划名称和可编辑字段透传到复制 API，同时保持官方人群复制和通用复制分支兼容。
- [x] 更新回归测试，覆盖预览窗、字段透传、生成中态和成功后搜索刷新。
- [x] 构建同步产物并运行相关验证；如能安全连接真实页面，使用 Chrome DevTools MCP 验证复制前弹窗与取消链路。
- [x] 按最新反馈微调一览窗样式与出价方式提取，并在真实页面复验手动出价、无横向滚动条和取消不提交。
- [x] 按最新列宽反馈把表格改成内容优先列宽，并复验短列不再过宽、无横向滚动条。
- [x] 在一览窗加入批量出价梯度与批量预算设置，并验证应用后能回写所有行且确认前不提交。
- [x] 补充智能出价目标明细展示和 `计划出价方式` 表头，并验证只读展示不影响复制提交入参。
- [x] 源计划无出价价格时禁用行内出价与批量出价，确认提交时不生成出价覆盖。

## 高层操作摘要
- 已回顾 AGENTS、`tasks/lessons.md` 与当前 `tasks/todo.md`。本轮属于复制/创建类链路改造，必须先预览确认、再提交，并证明确认前不会触发创建请求。
- 已将复制按钮链路拆成准备上下文、打开一览窗、确认后提交三段；一览窗包含计划名称、出价方式、出价价格、预算字段/预算值，其中出价方式只展示源计划中文文案不参与编辑覆盖，取消不会调用创建 API。
- 已给 `copyCurrentPlanByScene` 增加 `copyPlanRows` 受控入参，支持多行显式计划名，并把每行预算/出价覆盖合并到创建请求；成功后搜索关键字改为优先使用新生成计划名称。
- 已更新复制专项测试，覆盖一览窗 DOM、字段透传、生成中状态、显式计划名数组和预算/出价覆盖。
- 根据用户反馈，已把一览窗视觉改回接近原成功弹窗的轻量原生格式：24px 圆角、轻阴影、图标标题区与胶囊按钮；表格只负责承载多行内容。
- 根据最新反馈，已把行内编辑控件从完整边框改成仅底部横线，减少多列表格里的视觉噪声；只读出价方式保持纯文本展示。
- 真实页面复验时发现固定操作列按钮的祖先节点可能不是当前数据行，旧阈值会跳过包含 `手动出价` 的当前行；已改为优先按按钮 `campaignId` 找回计划名称链接所在行，再从该行提取中文出价方式，并避开包含多计划的整表容器。
- 根据最新列宽反馈，已把表格从固定百分比分配改成内容优先的紧凑列：序号、出价方式、出价价格、预算按内容宽度收缩，计划名称承接剩余宽度。
- 根据最新批量编辑反馈，已在一览窗表格上方加入轻量批量工具区：出价按首尾价格等差填充每行，预算按统一预算类型和金额填充每行；批量操作只回写弹窗里的现有行输入，确认前不触发创建接口。
- 根据最新智能出价反馈，已把一览窗表头改为 `计划出价方式`，并在智能出价展示值中拼接源计划目标明细：点击目标显示 `智能出价（促点击）`、成交目标显示 `智能出价（促成交）`、收藏加购目标显示 `智能出价（促收藏加购）`；该字段仍是只读展示，不写入 `copyPlanRows` 覆盖提交。
- 根据最新无出价反馈，已给复制一览窗行数据增加 `bidPriceEditable` 标记：源计划没有可读出价时，行内 `出价价格` 输入禁用并显示 `无出价` 占位，批量出价首价/尾价/应用按钮也会禁用；确认读取行数据时只读出价不会写入 `bidPrice` 覆盖。

## 验证记录
- `node --check src/main-assistant/campaign-id-quick-entry.js`：通过。
- `node --check src/optimizer/keyword-plan-api/wizard-open-and-create.js`：通过。
- `node --check src/main-assistant/ui.js`：通过。
- `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs`：通过，12/12。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js`。
- `npm run build:check`、`npm run check:syntax`、`git diff --check`：通过。
- `npm run test`：通过；504 项测试中 502 通过、2 个历史跳过（缺少 `agent-cluster/index.mjs`），0 失败。
- `npm run review`：通过；自动复审、构建检查和回归测试均通过。
- Chrome DevTools MCP：重载本地 unpacked extension 后复验关键词推广 `#!/manage/search`，先安装 `/solution/addList.json`、`/solution/copy.json`、`/campaign/copy/campaignCheck.json` 请求拦截保护，再点击可见计划 `复制1`。页面先弹出 `复制计划一览`，可见列 `# / 计划名称 / 出价方式 / 出价价格 / 预算`；计划名称、出价价格、预算类型、预算值为可编辑控件，出价方式显示源计划中文文案。
- Chrome DevTools MCP：在一览窗中修改计划名称输入值后未触发任何真实创建请求；点击 `取消` 后弹窗关闭，URL 保持 `#!/manage/search?orderField=charge&orderBy=desc`，拦截记录为空。未点击 `确认生成`，避免真实创建投放计划。
- Chrome DevTools MCP：再次复验一览窗，出价方式列显示 `智能出价`，不存在 `data-am-copy-field="bidMode"` 可编辑输入；可编辑字段仅 `planName / bidPrice / budgetField / budgetValue`。卡片样式为 `border-radius: 24px`、`box-shadow: 0 2px 10px rgba(0,0,0,0.16)`，与原成功弹窗格式保持一致。
- 最新修正后 `node --check src/main-assistant/campaign-id-quick-entry.js`、`node --check src/main-assistant/ui.js`、`node --test tests/campaign-copy-current-plan-quick-entry.test.mjs`：通过，专项测试 12/12。
- 最新修正后 `npm run build`、`npm run build:check`、`npm run check:syntax`、`git diff --check`：通过；生成产物已同步。
- 最新修正后 `npm run review`：通过；504 项测试中 502 通过、2 个历史跳过（缺少 `agent-cluster/index.mjs`），0 失败。
- Chrome DevTools MCP：重载 unpacked extension 与关键词推广 `#!/manage/search` 后，先安装真实创建请求拦截，再点击可见手动出价计划 `E7pro_自定义`（campaignId `69514602419`）的 `复制1`。一览窗 `出价方式` 显示 `手动出价`，不存在 `data-am-copy-field="bidMode"` 可编辑输入；可编辑字段仍为 `planName / bidPrice / budgetField / budgetValue`。
- Chrome DevTools MCP：同一一览窗卡片宽度为 1080px，表格容器 `clientWidth=1030`、`scrollWidth=1030`、`overflow-x=hidden`，无横向滚动条；编辑控件 computed style 为上/左边框 `0px`、底部线 `1px`、圆角 `0px`、透明背景；点击取消后弹窗关闭，拦截记录为空。
- 最新列宽修正后 `node --check src/main-assistant/ui.js`、`node --test tests/campaign-copy-current-plan-quick-entry.test.mjs`、`npm run build`、`npm run build:check`、`npm run check:syntax`、`git diff --check`：通过；专项测试 12/12，生成产物已同步。
- 最新列宽修正后 `npm run review`：通过；504 项测试中 502 通过、2 个历史跳过（缺少 `agent-cluster/index.mjs`），0 失败。
- Chrome DevTools MCP：重载本地 unpacked extension 与关键词推广页面后，再次点击手动出价计划 `E7pro_自定义`（campaignId `69514602419`）的 `复制1`。一览窗 `table-layout=auto`，表头宽度为 `# 42px / 计划名称 626px / 出价方式 84px / 出价价格 92px / 预算 186px`，预算内部列为 `76px 82px`；表格容器 `clientWidth=1030`、`scrollWidth=1030`、`overflow-x=hidden`，无横向滚动条。出价方式仍显示 `手动出价` 且不可编辑，点击取消后拦截记录为空。
- 最新批量编辑修正后 `node --check src/main-assistant/campaign-id-quick-entry.js`、`node --check src/main-assistant/ui.js`、`node --test tests/campaign-copy-current-plan-quick-entry.test.mjs`：通过；专项测试 12/12。
- 最新批量编辑修正后 `npm run build`、`npm run build:check`、`npm run check:syntax`、`git diff --check`：通过；生成产物已同步。
- 最新批量编辑修正后 `npm run review`：通过；504 项测试中 502 通过、2 个历史跳过（缺少 `agent-cluster/index.mjs`），0 失败。
- Chrome DevTools MCP：重载 unpacked extension 与关键词推广 `#!/manage/search` 后，在受保护请求拦截下把手动出价计划 `E7pro_自定义` 的复制数量设为 6 并点击 `复制`。一览窗显示 6 行，批量出价输入首价 `3`、尾价 `8` 后点击 `应用梯度`，6 行出价回写为 `3 / 4 / 5 / 6 / 7 / 8`，间隔显示 `间隔 1`；批量预算选择 `每日预算`、金额 `300` 后点击 `应用预算`，6 行预算字段均为 `dayBudget`，预算值均为 `300`。表格仍为 `table-layout=auto`，容器 `clientWidth=1030`、`scrollWidth=1030`、`overflow-x=hidden`；出价方式仍显示 `手动出价` 且不可编辑；点击取消后创建请求拦截记录为空。
- 最新智能出价明细修正后 `node --check src/main-assistant/campaign-id-quick-entry.js`、`node --check src/main-assistant/ui.js`、`node --test tests/campaign-copy-current-plan-quick-entry.test.mjs`：通过；专项测试 12/12。
- 最新智能出价明细修正后 `npm run build`、`npm run build:check`、`npm run check:syntax`、`git diff --check`：通过；生成产物已同步。
- 最新智能出价明细修正后 `npm run review`：通过；504 项测试中 502 通过、2 个历史跳过（缺少 `agent-cluster/index.mjs`），0 失败。
- Chrome DevTools MCP：重载本地 unpacked extension 后复验关键词推广列表，在受保护请求拦截下点击智能出价计划复制。一览窗表头为 `计划出价方式`，行内显示 `智能出价（促点击）`，不存在 `data-am-copy-field="bidMode"` 可编辑输入；表头宽度为 `# 42px / 计划名称 564px / 计划出价方式 146px / 出价价格 92px / 预算 186px`，表格容器 `clientWidth=1030`、`scrollWidth=1030`、`overflow-x=hidden`。点击取消后弹窗关闭，创建/复制类请求拦截记录为空。
- 最新无出价修正后 `node --check src/main-assistant/campaign-id-quick-entry.js`、`node --test tests/campaign-copy-current-plan-quick-entry.test.mjs`：通过；专项测试 12/12。
- 最新无出价修正后 `npm run build`、`npm run build:check`、`npm run check:syntax`、`git diff --check`：通过；生成产物已同步。

## 结果复盘
- 修复结果：复制计划从“点击即提交”改为“准备上下文 -> 一览窗编辑确认 -> 生成中提交 -> 成功确认刷新搜索新计划名”的链路；取消或关闭一览窗不会调用创建接口。
- 数据边界：`copyPlanRows` 只作为确认后的受控覆盖入参使用，多行显式计划名、预算字段/预算值、源计划已有的出价价格会逐行合并到复制请求；计划出价方式只读展示并继续跟随源计划，不写入行级覆盖。批量出价和批量预算只是在确认前批量写入弹窗行内字段，不新增提交入口；源计划没有出价价格时不允许在确认窗新增出价覆盖。计划出价方式展示优先从当前 campaignId 对应的可见列表行提取中文文案，并从源计划目标合同补充智能出价明细，避免固定操作列扫到其它计划或被详情字段覆盖；一览窗短列按内容紧凑收缩，计划名称列承接剩余空间。官方人群复制分支保持原有官方接口策略。
- 验收边界：真实页面验证覆盖了点击复制、编辑一览窗和取消不提交；最终确认生成属于真实投放创建动作，本轮未在生产页面点击。

# TODO - 2026-05-27 批量修改屏蔽人群复用官方编辑弹窗

## 需求规格
- 目标：在 `https://one.alimama.com/index.html#!/manage/display-detail?mx_bizCode=onebpDisplay&bizCode=onebpDisplay&campaignId=81020127177&tab=crowd&startTime=2026-05-27&endTime=2026-05-27` 分析点击 `编辑过滤人群` 打开的官方弹窗；人群推广列表 `批量+ -> 批量修改屏蔽人群` 必须调用一样的窗口，并通过该窗口完成批量修改提交。
- 约束：不能再用自定义确认框替代官方弹窗；不能跳转详情页；真实浏览器测试要验证弹窗可打开、数据可编辑/提交链路正常；真实提交前必须确认不会误改非选中计划，必要时只提交用户指定/当前选中的测试计划。
- 成功标准：列表页选中计划后点击 `批量修改屏蔽人群`，原地出现与详情页 `编辑过滤人群` 一致的编辑弹窗；确认提交时调用官方过滤人群提交接口并按选中计划批量修改；专项测试、构建检查和真实页面验收通过。

## 执行计划（可核对）
- [x] 在真实详情页分析 `编辑过滤人群` 弹窗 DOM、打开方式、数据读取和提交行为。
- [x] 调整 `批量+ -> 批量修改屏蔽人群`，复用同构官方弹窗而非自定义确认框。
- [x] 实现弹窗提交时对选中人群推广计划批量调用官方提交接口。
- [x] 更新回归测试、构建产物和任务教训。
- [x] 用 Chrome DevTools MCP 在真实人群推广页面验证弹窗打开、取消/提交链路和接口行为。

## 高层操作摘要
- 已确认上一轮实现仍是读取官方接口后打开自定义确认框，不满足“调用一样的窗口”的最新目标，本轮必须改为同构官方 `编辑过滤人群` 弹窗。
- 真实详情页分析确认官方入口在 `onebp/views/pages/manage/display/crowd-list` 中调用 `mxModal('onebp/views/pages/manage/campaign/info')`，只展示 `campaignCrowdFilterList`，提交回调再执行过滤人群批量修改/删除。
- 已将列表页 `批量+ -> 批量修改屏蔽人群` 改为复用页面 Magix/VFrame 的 `mxModal` 打开同一个 `campaign/info` 弹窗，标题仍是 `编辑过滤人群`，初始数据来自第一个选中计划的 `/blackCrowd/findList.json`。
- 已把官方弹窗的提交回调接到批量同步逻辑：对每个选中计划计算新旧过滤人群差异，新增/保留项走 `/blackCrowd/batchModify.json`，移除项走 `/blackCrowd/batchDelete.json`。

## 验证记录
- `node --check src/main-assistant/campaign-id-quick-entry.js`：通过。
- `node --test tests/campaign-batch-plus-quick-entry.test.mjs`：通过，6/6。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/`。
- `npm run build:check`、`npm run check:syntax`、`git diff --check`：通过。
- `npm run review`：通过；503 项测试中 501 通过、2 个历史跳过（`agent-cluster/index.mjs`），0 失败。
- Chrome DevTools MCP：在详情页 `#!/manage/display-detail?...campaignId=81020127177&tab=crowd` 分析官方 `编辑过滤人群` 弹窗，确认 view 为 `onebp/views/pages/manage/campaign/info`，组件过滤为 `campaignCrowdFilterList`，已选过滤人群为 `50岁以上 / 40-49岁 / 18-24岁`。
- Chrome DevTools MCP：重载本地 unpacked extension 后复验人群推广列表 `#!/manage/display?...searchValue=E7Pro_AI点睛_测试`，`批量+` hover 菜单可见，菜单项包含 `批量修改屏蔽人群`。
- Chrome DevTools MCP：只勾选测试计划 `81020127177`，点击 `批量+ -> 批量修改屏蔽人群`，列表页原地打开官方 `编辑过滤人群` 弹窗，显示 `设置过滤人群` 与 3 个已选过滤人群，URL 保持列表页。
- Chrome DevTools MCP：保持内容不变点击 `确定`，Network 记录 `/blackCrowd/batchModify.json?bizCode=onebpDisplay` HTTP 200，请求体 `campaignId=81020127177` 且 `crowdList` 为 3 个过滤人群；随后页面刷新回列表，弹窗关闭。

## 结果复盘
- 修复结果：`批量修改屏蔽人群` 已从自定义确认框升级为官方同构编辑弹窗；用户在该窗口内编辑后，提交会批量同步到选中的人群推广计划。
- 风险边界：真实页面只对单个测试计划做“不改变内容”的提交验证；多计划批量同步由专项测试和代码路径覆盖，实际修改多个计划前仍应谨慎选择计划。

# TODO - 2026-05-27 人群推广批量+官方人群接口

## 反馈修正 - 人群推广人群类动作不跳转
- 需求：用户要求人群推广 `批量+` 中的 `批量修改屏蔽人群` 与 `批量人群设置` 不再跳转详情页，改为使用官方接口；`批量修改屏蔽人群` 对应点击计划后 `人群 -> 编辑过滤人群` 的弹窗接口，`批量人群设置` 对应 `批量计划设置` 官方按钮里的人群设置能力。
- 约束：
  - 仅本轮先收敛到 `onebpDisplay / 人群推广`，关键词推广和线索推广不伪造未确认接口；
  - 必须先在真实页面抓取官方弹窗的数据读取和提交接口，不能凭字段名猜测；
  - 真实页面验收只允许受保护抓包、打开弹窗和取消，不直接提交会修改投放配置的请求；
  - 若官方能力需要用户选择/编辑人群，插件应复用或同构官方弹窗流程，不再 `window.open` 跳转详情页。
- 执行计划：
  - [x] 抓取人群推广官方 `编辑过滤人群` 与 `批量计划设置 -> 人群设置` 的弹窗接口、请求载荷和确认链路。
  - [x] 设计 `批量+` 人群推广专用执行路径：读取选中计划、打开同构批量弹窗、按官方接口提交或受控确认。
  - [x] 实现人群推广两项动作的官方接口接入，关键词/线索保持保守提示或原入口策略。
  - [x] 更新回归测试，覆盖人群推广不跳转、官方接口路径、二次确认/取消安全边界。
  - [x] 构建同步产物，运行专项测试、语法检查、build check 与 review。
  - [x] 用 Chrome DevTools MCP 在真实人群推广页面验证菜单、弹窗、取消链路和无真实提交。
- 高层操作摘要：
  - 已回顾 `AGENTS.md` 与 `tasks/lessons.md`，本轮属于用户修正：官方隐藏弹窗能力不能用跳转详情页替代。
  - 已在真实人群推广页抓取官方 `批量计划设置 -> 批量编辑人群` 打开链路：点击官方菜单项后原地打开 `批量编辑人群` 抽屉，读取 `/crowd/horizontal/findPage.json` 等人群列表接口，不发生页面跳转。
  - 已在计划详情 `人群 -> 编辑过滤人群` 抓取官方过滤人群接口：读取 `/blackCrowd/findList.json`，提交 `/blackCrowd/batchModify.json`，受保护抓包确认载荷包含 `campaignId`、`tab=crowd`、`startTime/endTime` 与 `crowdList`。
  - 已将人群推广 `批量人群设置` 改为打开官方 `批量编辑人群` 抽屉；`批量修改屏蔽人群` 改为读取第一个选中计划的过滤人群作为模板，二次确认后用官方 `/blackCrowd/batchModify.json` 同步到选中计划。
  - 关键词推广和线索推广继续保留原有保守入口/详情兜底，不伪造未抓取的人群接口。
- 验证记录：
  - `node --check src/main-assistant/campaign-id-quick-entry.js`：通过。
  - `node --test tests/campaign-batch-plus-quick-entry.test.mjs`：通过，6/6。
  - `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/`。
  - `npm run build:check`、`npm run check:syntax`、`git diff --check`：通过。
  - `npm run review`：通过；503 项测试中 501 通过、2 个历史跳过，0 失败。
  - Chrome DevTools MCP：重载本地 unpacked extension 后复验人群推广 `#!/manage/display`，`批量+` 宽度 69px，与官方 `批量计划设置` 间距 12px；鼠标移入菜单可见，菜单包含 `批量开启 / 批量暂停 / 批量删除 / 批量修改屏蔽人群 / 批量人群设置`。
  - Chrome DevTools MCP：选中计划 `81020127177` 后点击 `批量人群设置`，当前页原地打开官方 `批量编辑人群` 抽屉，可见 `添加人群`、`批量修改状态`、`批量修改出价` 等官方能力；页面 URL 保持 `#!/manage/display`，未触发 `/blackCrowd/batchModify.json`。
  - Chrome DevTools MCP：选中计划 `81020127177` 后点击 `批量修改屏蔽人群`，弹出二次确认；读取 `/blackCrowd/findList.json` 返回 3 个过滤人群模板，点击取消后弹窗关闭，URL 不变，Network 未触发 `/blackCrowd/batchModify.json`。
- 结果复盘：
  - 修复结果：人群推广两个人群类批量动作均不再跳详情页；`批量人群设置` 复用官方 `批量计划设置` 内的官方菜单与抽屉，`批量修改屏蔽人群` 复用官方过滤人群读取/提交接口并加二次确认。
  - 交互要点：官方菜单项实际可点击节点优先是 `.mx-output-link` 等交互子节点；触发人群抽屉时需要真实 `PointerEvent`，官方 `批量计划设置` 主按钮保持 hover 后简单 click 更稳定。
  - 安全边界：真实页面只执行打开弹窗、读取模板和取消验证，没有点击会修改投放配置的最终确认。

# TODO - 2026-05-27 批量+ 计划列表增强

## 反馈修正 - 批量+ 增加批量开启与批量暂停
- 需求：用户要求在 `批量+` 菜单里增加两个操作：`批量开启`、`批量暂停`。
- 约束：
  - 继续复用现有 `批量+` hover 菜单与选中计划读取逻辑；
  - 状态变更属于真实投放动作，必须有二次确认，不在浏览器验收中点击最终确认；
  - 按业务线分组调用已验证的批量状态接口，避免跨关键词/人群/线索误改；
  - 无选中计划时仍只提示选择计划，不发请求。
- 执行计划：
  - [x] 复查现有批量状态接口和确认弹窗，确定最小复用点。
  - [x] 在 `批量+` 菜单新增 `批量开启 / 批量暂停` 两项，并接入受控批量状态变更。
  - [x] 更新回归测试，覆盖菜单项、action 分发、二次确认和 `campaign/updatePart.json` 批量载荷。
  - [x] 构建同步产物，运行相关测试与 review 级验证。
  - [x] 用 Chrome DevTools MCP 在真实页面验证菜单展示与确认弹窗，不点击最终确认。
- 高层操作摘要：
  - 已回顾相关教训：状态变更类操作必须二次确认，真实页面验收只验证弹窗和取消，不直接执行最终提交。
  - 已确认现有 `updateCampaignStatusBatchByBiz` 使用原生 `/campaign/updatePart.json`，payload 为按业务线分组的 `campaignList[{ campaignId, displayStatus }]`。
  - 已在 `批量+` 菜单新增 `批量开启 / 批量暂停`，执行前用 `openBatchPlusConfirmDialog` 二次确认，取消不发请求。
  - 已补充识别不到计划 ID 时的早退提示，避免异常选中状态下继续打开确认或刷新列表。
- 验证记录：
  - `node --check src/main-assistant/campaign-id-quick-entry.js`：通过。
  - `node --test tests/campaign-batch-plus-quick-entry.test.mjs`：通过，6/6。
  - `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/`。
  - `npm run build:check`、`npm run check:syntax`、`git diff --check`：通过。
  - `npm run review`：通过；503 项测试中 501 通过、2 个历史跳过（`agent-cluster/index.mjs`），0 失败。
  - Chrome DevTools MCP：重载本地 unpacked extension 后复验关键词推广 `#!/manage/search`，`批量+` hover 菜单打开，`bizCode=onebpSearch`，菜单包含 `批量开启 / 批量暂停 / 批量删除 / 批量修改屏蔽人群 / 批量人群设置`，按钮宽度随 `批量+` 文案自适应为 69px。
  - Chrome DevTools MCP：复验人群推广 `#!/manage/display`，菜单包含新增两项；选中 1 个人群计划后分别点击 `批量开启`、`批量暂停`，均弹出二次确认，确认按钮文案分别为 `确认开启`、`确认暂停`；仅点击取消，`/campaign/updatePart.json` 请求增量为 0。
  - Chrome DevTools MCP：复验线索推广 `#!/manage/hky`，`批量+` hover 菜单打开，`bizCode=onebpAdStrategyLiuZi`，新增两项 title 分别指向线索推广开启/暂停计划；未点击最终确认。
  - Chrome DevTools MCP：控制台仅观察到页面外部资源 `ERR_TUNNEL_CONNECTION_FAILED`，未见本次逻辑报错。
- 结果复盘：
  - 修复结果：`批量+` 新增 `批量开启` 和 `批量暂停`，复用原生批量状态更新接口；执行前强制二次确认，并继续按当前业务线分组处理选中计划。
  - 安全边界：真实页面只验证菜单、确认弹窗和取消链路，没有执行实际开启/暂停；取消后未产生 `campaign/updatePart.json` 请求。

## 最新反馈修正 - 鼠标移入必须看到菜单
- 需求：用户反馈 `批量+` 鼠标移动上去没有看到弹出菜单；需要按 `批量计划设置` 的 hover 触发体验修正。
- 约束：
  - `批量+` 是补充能力入口，即使原生 `批量计划设置` 因未选中计划而禁用，也要能 hover 展开菜单；
  - 无选中计划时由菜单项动作给出选择计划提示，不能在按钮层拦截菜单；
  - 鼠标真实落点可能是克隆出的内部 `button/span`，事件定位必须用外层 `data-am-campaign-batch-plus`；
  - 若页面或调试过程移除了旧菜单 DOM，内部状态不得误判为菜单仍打开。
- 执行计划：
  - [x] 定位真实 hover 不弹出的差异，确认外层直接事件与真实内部按钮事件的差异。
  - [x] 解除 `批量+` 对原生 disabled 交互态的继承，仅保留 `data-am-native-disabled` 调试标记。
  - [x] 加固菜单状态读取，只认可仍连接在 DOM 上的菜单节点，避免陈旧引用阻断 hover。
  - [x] 更新回归测试并构建同步产物。
  - [x] 用 Chrome DevTools MCP 在关键词/人群/线索真实页面复验 hover 菜单、间距和宽度。
- 高层操作摘要：
  - 已把按钮层从“跟随原生禁用不弹”改成“始终可 hover 弹菜单”；原生禁用状态只保存在 `data-am-native-disabled`。
  - 已新增连接态菜单判断，修复旧菜单节点脱离 DOM 后 `showBatchPlusMenu` 直接 return 的风险。
- 验证记录：
  - `node --check src/main-assistant/campaign-id-quick-entry.js`：通过。
  - `node --test tests/campaign-batch-plus-quick-entry.test.mjs`：通过，5/5。
  - `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/`。
  - `npm run build:check`、`npm run check:syntax`、`git diff --check`：通过。
  - `npm run review`：通过；502 项测试中 500 通过、2 个历史跳过（`agent-cluster/index.mjs`），0 失败。
  - Chrome DevTools MCP：重载本地 unpacked extension 后复验关键词推广 `#!/manage/search`，真实内部 `button` 触发 `mouseover`，`nativeDisabled=1`、`ariaDisabled=false`、`buttonDisabled=false`，菜单打开且包含 `批量删除 / 批量修改屏蔽人群 / 批量人群设置`；`批量+` 宽度 69px，原生按钮宽度 112px，与原生按钮间距 12px。
  - Chrome DevTools MCP：复验人群推广 `#!/manage/display`，内部 `button` hover 可打开菜单；`wrapClass=am-campaign-batch-plus-wrap fl`、`float=left`、与原生按钮间距 12px，未选中计划时仍可展开。
  - Chrome DevTools MCP：复验线索推广 `#!/manage/hky`，内部 `button` hover 可打开菜单；`bizCode=onebpAdStrategyLiuZi`、`ariaDisabled=false`、`buttonDisabled=false`、菜单三项完整，`批量+` 自适应宽度 69px。
  - Chrome DevTools MCP：菜单移出/移入验证通过，移到菜单内部不关闭，离开菜单后延迟关闭；页面控制台仅观察到外部资源 `ERR_TUNNEL_CONNECTION_FAILED`，未见本次逻辑报错。
- 结果复盘：
  - 根因：只复刻了按钮外观和部分原生状态，但扩展菜单的目标是补充原生禁用态下不可批量的能力；继续继承 disabled 交互会让 hover 入口不可达。另外陈旧菜单引用会让 `showBatchPlusMenu` 误判菜单已打开。
  - 修复结果：`批量+` 不再继承原生 disabled 交互，hover/click 均能打开菜单；菜单状态只信任仍连接在 DOM 上的节点，避免旧状态阻断后续 hover。

## 反馈修正 - 批量+ 必须与批量计划设置同构
- 需求：用户明确要求 `批量+` 的操作逻辑与 `批量计划设置` 一模一样，包括样式和弹出逻辑。
- 约束：
  - 不再使用自定义下拉按钮视觉和独立菜单样式来近似模拟；
  - 先在真实页面抓取原生 `批量计划设置` 的 DOM、disabled 状态、点击弹层和菜单结构；
  - `批量+` 保留本轮新增能力，但按钮、启用/禁用、弹出层定位与菜单交互要尽量复用原生结构；
  - 浏览器验收仍不能点击真实删除确认或提交入口。
- 执行计划：
  - [x] 抓取关键词/人群/线索真实页原生批量按钮与弹层结构，确认可复刻的最小 DOM。
  - [x] 将 `批量+` 改为克隆/同构原生 `批量计划设置` 控件，镜像禁用状态并使用同类 popmenu 弹层。
  - [x] 更新回归测试，覆盖原生同构、disabled 同步和菜单项动作。
  - [x] 构建同步产物，运行相关测试与 review 级验证。
  - [x] Chrome DevTools MCP 真实验收三类页面的样式、弹层和安全动作。
- 高层操作摘要：
  - 真实页复查确认 `批量计划设置` 外层为 `.wO_WXbzf.mxgc-popmenu`，内部 Magix button 才是真实 enabled/disabled 状态源；因此 `批量+` 改为克隆该原生 DOM，移除 `mx-*` 和埋点事件属性，只替换文案。
  - 已删除上一版自定义 plus 图标按钮视觉；按钮样式完全依赖原生克隆 class，外层只保留 8px 间距和 `data-am-campaign-batch-plus` 标识。
  - 弹层改为同类 popmenu 菜单行为：跟随按钮宽度、点击按钮开关、点击外部关闭、禁用态不弹出；菜单项仍保留 `批量删除 / 批量修改屏蔽人群 / 批量人群设置`。
  - 真实页复验发现人群页原生节点会把可见的 `优化效果` 兄弟节点一起克隆进 `批量+`，已改为仅保留原生按钮链路；也补齐 computed style 尺寸同步，避免克隆按钮高度偏差。
- 验证记录：
  - `node --check src/main-assistant/campaign-id-quick-entry.js`：通过。
  - `node --test tests/campaign-batch-plus-quick-entry.test.mjs`：通过，5/5；覆盖原生克隆、属性剥离、disabledTip、尺寸同步、非按钮兄弟节点剪除和菜单 class。
  - `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/`。
  - `npm run review`：通过；502 项测试中 500 通过、2 个历史跳过（`agent-cluster/index.mjs`），0 失败；`git diff --check` 通过。
  - Chrome DevTools MCP：重载 unpacked extension 后复验 `#!/manage/display`，`批量+` 位于原生 `批量计划设置` 右侧，`plusText=批量+`、`bizCode=onebpDisplay`、宽高 `112x32` 与原生一致，`mx-view/mx-change/data-spm-click` 已剥离，未再克隆可见 `优化效果` 节点。
  - Chrome DevTools MCP：复验 `#!/manage/hky`，`plusText=批量+`、`bizCode=onebpAdStrategyLiuZi`、宽高 `112x32` 与原生一致；当前原生 `mx-view disabled=true`，`批量+ aria-disabled=true`，点击后不弹出菜单。
  - Chrome DevTools MCP：复验 `#!/manage/search`，`plusText=批量+`、`bizCode=onebpSearch`、宽高 `112x32` 与原生一致；当前原生禁用态同步到 `批量+`，直接点击不会弹菜单或触发真实动作。
- 结果复盘：
  - 修正结果：`批量+` 不再是自定义按钮，而是克隆原生 `批量计划设置` 控件，仅替换文案并剥离原生 Magix/埋点属性；禁用态、提示、按钮 class、尺寸和弹层开关逻辑跟随原生。
  - 安全边界：当前真实账号页面的原生批量按钮处于禁用态时，`批量+` 也保持禁用且不弹菜单；真实页面验收未点击删除确认或提交设置。菜单打开与删除二次确认由自动化回归覆盖。

## 需求规格
- 目标：在关键词推广、人群推广、线索推广计划列表的原生批量操作区最右侧，复刻一个类似 `批量计划设置` 的按钮，按钮文案为 `批量+`。
- 菜单：先统计 `批量计划设置` 未覆盖、但当前列表或原生接口可批量执行的能力，再把适合的能力挂到 `批量+` 菜单中。
- 首批候选：批量删除、批量修改屏蔽人群、批量人群设置等；最终以源码和真实页面统计结果为准。
- 安全边界：删除、提交、投放等真实变更默认只实现受控入口和 dry-run/确认防护；真实页面验收不点击会实际提交的最终确认。
- 成功标准：三类推广列表均可见 `批量+`；菜单项按当前场景展示；无选中项时有明确提示；相关逻辑有回归测试；构建产物同步；浏览器验证记录完整。

## 执行计划（可核对）
- [x] 统计三类推广列表已有批量按钮、行级可批量动作和现有 API 能力，明确首批可落地菜单。
- [x] 定位 `批量计划设置` 和现有计划行操作注入实现，确定最小扩展点。
- [x] 实现 `批量+` 按钮、菜单、场景化菜单项和选中计划读取逻辑。
- [x] 为首批批量能力接入受控执行或安全占位提示，避免未验证接口造成真实误操作。
- [x] 补充或更新回归测试，覆盖按钮位置、菜单项、场景过滤和安全防护。
- [x] 构建同步产物，运行相关测试、语法检查和必要 review。
- [x] 用 Chrome DevTools MCP 在真实页面验证三类推广列表按钮渲染与菜单行为，回填记录。

## 高层操作摘要
- 已回顾 `AGENTS.md`、`tasks/lessons.md` 和当前未提交改动；本轮将在既有复制功能改动基础上叠加，不回退已有文件。
- 当前任务涉及 UI 注入、批量操作和真实页面行为，必须先统计再实现，并把验证纳入完成标准。
- 真实页面统计：关键词推广原生 `批量计划设置` 覆盖预算、资源位、地域、分时折扣、出价、计划组；人群推广额外覆盖批量编辑人群、精细化人群调控、资源位溢价、加入活动助手；线索推广可见原生批量设置/活动助手入口但未覆盖删除和屏蔽/过滤人群类批量动作。
- 首批落地菜单收敛为 `批量删除`、`批量修改屏蔽人群`、`批量人群设置`：删除接原生 `campaign/delete.json` 并加二次确认；人群/屏蔽类动作只打开原生行入口或详情页 `crowd` tab，不伪造未验证的批量提交接口。
- 已在 `CampaignIdQuickEntry` 内复用原生 `批量计划设置` 作为锚点插入 `批量+`，并补充透明 checkbox 的外层可见性兜底，避免真实表格选中项漏读。
- 真实人群页复验时发现 SPA 切换后旧页面隐藏选中项可能残留，已新增当前路由业务线识别和选中项业务线过滤，避免在 `display/hky/search` 间误取旧场景计划。

## 验证记录
- `node --check src/main-assistant/campaign-id-quick-entry.js`：通过。
- `node --check src/main-assistant/ui.js`：通过。
- `node --test tests/campaign-batch-plus-quick-entry.test.mjs tests/keyword-home-strategy-batch-actions.test.mjs`：通过，19/19。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/`。
- `npm run test`：通过，502 项中 500 通过、2 个历史跳过。
- `npm run build:check`、`npm run check:syntax`、`git diff --check`：通过。
- `npm run review`：通过，所有自动 review 检查通过。
- Chrome DevTools MCP：重载本地 unpacked extension 后，关键词推广页 `#!/manage/search` 可见 `批量+` 位于 `批量计划设置` 右侧；菜单项为 `批量删除 / 批量修改屏蔽人群 / 批量人群设置`；选中计划后删除确认文案为 `1 个关键词推广计划`，点击取消后弹窗关闭，`campaign/delete.json` 请求数为 0。
- Chrome DevTools MCP：人群推广页 `#!/manage/display` 可见 `批量+`，按钮 `data-biz-code=onebpDisplay`；选中计划后删除确认文案为 `1 个人群推广计划`，取消后未发出 `campaign/delete.json`。
- Chrome DevTools MCP：线索推广页 `#!/manage/hky` 可见 `批量+`，按钮 `data-biz-code=onebpAdStrategyLiuZi`；选中计划后删除确认文案为 `1 个线索推广计划`，取消后未发出 `campaign/delete.json`。
- Chrome DevTools MCP 受保护验证：在线索页拦截真实点击和 `window.open` 后点击 `批量修改屏蔽人群`、`批量人群设置`，两个菜单项均能定位到官方 `高级设置` 入口；未实际打开页面、未提交设置。

## 结果复盘
- 本次先统计再落地：原生 `批量计划设置` 已覆盖预算、地域、时段、出价、计划组等通用设置；人群推广额外覆盖部分人群编辑能力；三类场景共同缺口是批量删除，线索/关键词的屏蔽人群和人群设置也没有稳定的批量提交入口。
- 修复结果：三类推广列表均在原生批量区右侧显示 `批量+`；删除走原生删除接口但必须二次确认；取消不会触发请求；人群/屏蔽类动作只打开官方入口，不伪造未知批量写接口。
- 风险与后续：若后续抓到官方屏蔽人群/人群设置的稳定批量提交接口，可把当前“打开官方入口”升级为真正批量写入；当前实现保守但不会误改真实投放配置。

---

# TODO - 2026-05-27 人群推广官方复制接入

## 反馈修正 - 人群 AI 点睛计划复制不完整
- 需求：用户反馈人群计划里复制 `E7Pro_AI点睛_测试` 也没有复制完整，存在刚刚关键词推广同类问题；人群推广有官方复制计划功能，希望把官方复制能力放进我们当前列表 `复制` 功能里。
- 约束：
  - 当前最高优先级切到人群推广复制；先只读/受保护确认官方复制链路，不直接假设关键词补字段方案适用于人群。
  - 不点击会真实创建、投放、删除或扣费的官方确认入口，除非先证明请求被拦截或用户再次明确授权真实创建。
  - 若最终需要真实复测，只创建测试复制计划并保证新计划暂停，不影响源计划。
  - 继续保留现有单个 `复制` 按钮、数量徽标、成功弹窗和公共计划名搜索体验。
- 执行计划：
  - [x] 回顾当前人群复制实现、关键词 AI 点睛修复和相关教训，确认风险边界。
  - [x] 在真实人群推广页面定位官方 `复制` 入口，抓取其只读接口、弹窗字段和最终提交接口。
  - [x] 对比官方复制请求与当前 `copyCurrentPlanByScene('人群推广')` 请求，定位缺失字段或可复用官方复制 API。
  - [x] 以最小侵入方式把人群推广复制接入官方复制链路或同构请求，保留创建后暂停兜底和成功弹窗。
  - [x] 补充回归测试覆盖人群官方复制分支、AI 点睛/人群设置字段和公共计划名搜索。
  - [x] 构建同步产物，并用 Chrome DevTools MCP 真实页面验证新计划暂停且设置完整。
- 高层操作摘要：
  - 已确认当前代码的人群复制仍走通用 `copyCurrentPlanByScene` -> `/solution/addList.json` 组包链路；用户这次要求优先参考官方人群推广复制功能，避免继续漏官方弹窗级配置。
  - 真实人群推广页受保护点击官方 `复制` 后确认：原生会先打开大弹窗，不立即创建；弹窗说明系统会复制计划状态、主体、人群、预算、出价、高级设置、创意、灵犀调优等参数。
  - 受保护拦截官方确认链路：先请求 `/campaign/copy/campaignCheck.json`，body 为 `bizCode=onebpDisplay + campaignId=81020127177`；继续复制最终请求 `/solution/copy.json`，body 为 `copyCampaignId、campaignName、campaignGroupName、campaignGroupId、startTime、launchForever`，由服务端完成完整复制。
  - 对比结论：当前插件的人群复制自己组 `/solution/addList.json` payload，容易漏原生弹窗级“人群/创意/灵犀调优”等隐藏配置；人群推广应改用官方 `/solution/copy.json`，再复用现有创建后暂停兜底与成功弹窗。
  - 已将 `copyCurrentPlanByScene` 的 `onebpDisplay / 人群推广` 分支切到官方复制接口：先 `campaignCheck`，再 `solution/copy`；关键词、线索等其它场景仍走原有白名单组包链路。
  - 真实创建验证生成新计划 `81105428182 / E7Pro_AI点睛_测试_1`；创建后立即调用 `/campaign/updatePart.json` 暂停该新计划，源计划不修改。

## 验证记录
- Chrome DevTools MCP 受保护官方链路确认：官方弹窗最终提交 `/solution/copy.json`，请求体为 `copyCampaignId=81020127177`、`campaignName=E7Pro_AI点睛_测试副本`、`startTime=2026-05-27`、`launchForever=true` 等字段；未放行真实创建。
- `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs`：通过，11/11；新增断言覆盖人群推广官方复制接口、dry-run payload 和创建后暂停兜底。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/`。
- Chrome DevTools MCP dry-run：真实人群页重载扩展后，`copyCurrentPlanByScene('人群推广', ..., {dryRunOnly:true})` 返回官方 payload：`/solution/copy.json` 所需字段完整，`campaignName=E7Pro_AI点睛_测试_1`，`copyCampaignId=81020127177`，且不触发创建。
- Chrome DevTools MCP 真实复制：点击插件 `复制` 按钮后请求链路为 `/campaign/copy/campaignCheck.json` -> `/solution/copy.json` -> `/campaign/updatePart.json`；`solution/copy` 创建新计划 `81105428182 / E7Pro_AI点睛_测试_1`，`updatePart` 对同一 ID 提交 `displayStatus:"pause"`。
- Chrome DevTools MCP 只读确认：新计划 `81105428182` 返回 `onlineStatus=0`、`displayStatus=pause`；与源计划一致的关键字段包括 `dayBudget=60`、`bidTypeV2=smart_bid`、`bidTargetV2=display_cart`、`optimizeTarget=coll_cart`、`promotionScene=promotion_scene_item`、`promotionStrategy=zidingyi`、`needTargetCrowd=1`、`creativeSetMode=professional`、`itemSelectedMode=user_define`。
- Chrome DevTools MCP 人群对比：源计划与新计划 `/crowd/findList.json` 均返回 16 个人群，名称一致；复制后页面成功弹窗按钮为 `确定并刷新`，点击后跳转到 `campaignNameLike=E7Pro_AI点睛_测试`，列表可见源计划 `E7Pro_AI点睛_测试` 与复制计划 `E7Pro_AI点睛_测试_1`，共 2 项。
- `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs tests/keyword-create-repair-cleanup-id-extract.test.mjs tests/budget-frontend-limit-bypass.test.mjs`：通过，21/21。
- `npm run build:check`、`npm run check:syntax`、`git diff --check`：通过。
- `npm run review`：通过，497 项回归中 495 通过、2 个历史跳过（缺少 `agent-cluster/index.mjs`），所有自动 review 检查通过。

## 结果复盘
- 根因：人群推广有官方复制能力，后端会复制人群、创意、灵犀调优等当前插件通用 `/solution/addList.json` 组包无法完整表达的隐藏配置；继续用自组 payload 容易复现“复制不完整”。
- 修复结果：人群推广当前计划复制改走官方 `solution/copy`，仍由插件统一处理数量命名、创建后暂停、成功弹窗和公共计划名搜索。
- 风险与回滚：官方复制接口是业务线专属接口，本次只在 `onebpDisplay / 人群推广` 分支启用；若后端接口变更，可回退到旧通用组包分支，但会重新承担设置缺失风险。

---

# TODO - 2026-05-27 营销场景复制计划

## 反馈修正 - 关键词 AI 点睛计划复制不完整
- 需求：用户反馈关键词计划 `E7Pro_AI点睛_测试` 复制后不完整，`AI点睛` 设置未复制，智能出价未复制到 `获取净成交`；后续修正后又反馈 `AI点睛` 开关已开启，但“需求人群”没有复制，需要继续核对 AI 点睛弹窗级设置并确保完整复制；成功弹窗字号和尺寸需要参考当前网页原生 `确认删除` 弹窗；成功弹窗确认按钮文案为 `确定并刷新`，确认后跳转到计划名称公共部分搜索结果，显示源计划与复制出的计划。
- 约束：
  - 当前最高优先级切到关键词复制缺陷修复；不继续货品全栈，本轮仍保留已完成的人群/关键词复制验证记录；
  - 先只读比对源计划、已复制计划和创建请求字段，再改转换逻辑；
  - 修复必须保持 ID/时间/源对象污染字段清理，不为完整复制而无过滤透传；
  - 真实复测仍只复制生成暂停计划，不影响源计划。
- 执行计划：
  - [x] 只读获取 `E7Pro_AI点睛_测试` 源计划、问题复制计划详情和相关列表字段，定位 AI 点睛/智能出价/其它设置差异。
  - [x] 回查 `copyCurrentPlanByScene` 白名单、默认值覆盖和创建请求组包链路，确认字段缺失根因。
  - [x] 以最小范围补齐 AI 点睛设置、智能出价目标、需求人群及同类关键设置的复制映射，并保留安全清理。
  - [x] 补充定向测试覆盖 AI 点睛设置、`获取净成交` 出价目标、需求人群和不回退默认值。
  - [x] 构建同步产物，运行相关回归、`build:check`、语法检查。
  - [x] Chrome DevTools MCP 真实复制 `E7Pro_AI点睛_测试`，确认新计划暂停且关键设置与源计划一致。
- 高层操作摘要：
  - 已停止继续推进货品全栈；先确认刚才已创建的人群复制弹窗并刷新页面，避免留下半完成弹窗状态。
  - 已启动只读字段链路调研，主线程同步抓真实接口详情和源码转换链路。
  - 真实比对确认：源计划 `80404078368 / E7Pro_AI点睛_测试` 的 `campaign/get` 带 `aiMaxInfo.aiMaxSwitch=1`、`aiMaxGenReason`、`aiMaxDeliveryPlan` 和净成交出价合同；复制计划 `81104780304 / E7Pro_AI点睛_测试_1` 已带开关与智能出价，但 `aiMaxGenReason=null` 且没有需求人群。
  - 打开原生 `AI点睛设置` 弹窗后确认“已选：5个需求”来自额外请求 `/crowd/findList.json`，不是 `campaign/get` 的 `aiMaxInfo` 自带完整列表；该接口按 `crowdBindQueryList:[{campaignId}]` 返回 5 条 AI点睛人群。
  - 已补复制源读取：关键词复制前额外只读查询 `/crowd/findList.json`，把返回的需求人群写回 `campaign.crowdList`；AI点睛源计划若读不到需求人群则直接中止，避免继续创建半成品。
  - 已补复制组包：从源计划挂载的 `campaign.crowdList` 回填到创建请求，继续保留白名单与瞬态 ID 清理，避免把源计划 ID、时间等污染字段透传。
  - 已按真实页面原生 `确认删除` 弹窗测量值重调成功弹窗：原生卡片 `320x198`、圆角 `24px`、标题 `16px/24px`、正文 `12px/18px`、按钮 `64x32`；成功弹窗同步为卡片宽 `320px`、圆角 `24px`、标题 `16px`、正文 `12px`、按钮高度 `32px`，确认按钮文案为 `确定并刷新`。
  - 已将成功确认行为从简单刷新改为按源计划名与新计划名公共前缀搜索：例如 `E7Pro_AI点睛_测试` 与 `E7Pro_AI点睛_测试_1` 会跳转到 `campaignNameLike=E7Pro_AI点睛_测试`，列表同时展示源计划和复制计划。

## 需求规格
- 目标：把当前线索推广计划列表已验证的 `复制` 能力，扩展到营销场景推广中的关键词推广、人群推广。
- 范围顺序：先完成并验证关键词推广，再做人群推广；用户已将本轮目标收敛为这两个场景，货品全栈推广不纳入本轮完成标准。
- 行为要求：
  - 复用当前线索推广复制计划交互：行操作区单个 `复制` 按钮、数量徽标、连续序号命名、防重复点击和受控复制 API；
  - 通过复制生成计划成功为止；
  - 测试生成的新计划必须为暂停状态，不得影响源计划；
  - 复制成功后弹窗说明本次复制成功数量、源计划和新计划明细，用户点击 `确定并刷新` 后按计划名称公共部分搜索列表，让源计划与复制出的计划同时可见；
  - 不绕过现有白名单、桥接和创建后状态兜底。
- 成功标准：
  - 关键词推广、人群推广都能从现有有花费计划复制生成新计划；
  - 真实创建验证的新计划均只读确认 `pause/onlineStatus=0`；
  - 真实浏览器复制成功后出现明细弹窗，确认后页面刷新；
  - 相关转换逻辑、按钮注入和桥接测试通过；
  - 构建产物同步，`build:check`、语法检查和风险匹配测试通过。

## 执行计划（可核对）
- [x] 回顾现有线索推广复制实现、场景映射和营销场景入口，确认最小扩展点。
- [x] 关键词推广：补齐场景识别、复制请求转换和暂停兜底，完成测试与真实创建验证。
- [x] 人群推广：基于关键词推广复用方案补齐差异字段，完成测试与真实创建验证。
- [x] 成功弹窗：复制成功后展示复制数量和新计划明细，确认后刷新网页，并在关键词/人群真实页面复测。
- [x] 构建同步产物，运行完整相关回归、`build:check`、语法检查和 review 级验证。
- [x] 回填验证记录、结果复盘；若用户修正或发现重复失误，同步更新 `tasks/lessons.md`。

## 高层操作摘要
- 已回顾项目规则与近期教训：创建/复制类功能必须确认服务端创建结果和目标暂停状态，不能只验证按钮点击或请求 payload。
- 当前工作区干净；本轮将优先改 `src/` 与相关测试，生成产物只通过构建同步。
- 已确认现有按钮层可识别 `onebpSearch`、`onebpDisplay`、`onebpSite` 并映射到 `关键词推广`、`人群推广`、`货品全站推广`；复制 API 已使用通用场景入口和创建后暂停兜底，下一步以真实页面执行为准。
- 关键词推广真实页初次复制命中全站推广冲突，接口在 `errorDetails[].result` 返回的是冲突计划 ID；已修复创建结果 ID 提取，禁止把带 `code/msg` 的错误明细误当成新建计划，并将当前计划复制的自动重试默认收敛为 0。
- 已扩展营销场景列表操作区识别：除线索推广的 `报表/置顶` 外，兼容关键词/人群/货品列表里的 `AI点睛`、`人群设置`、`一键起量`、`相似品跟投`、`修改趋势` 等操作组合。
- 真实关键词推广复制源计划 `76860218266` 成功创建新计划 `80979085755 / 自定义_T7Pro_品牌词_03_0906_909`；随后只对新计划调用暂停兜底，`campaign/get.json` 只读确认 `onlineStatus=0`、`displayStatus=pause`。
- 真实页验证时发现预算补丁恢复逻辑使用 `WeakMap.forEach` 的运行时错误；已改为可遍历 `Map` 并补回归测试，避免后续页面切换持续抛错。
- 人群推广真实页先点击了无商品源计划 `77464409842`，链路在创建前停止，未发起创建请求；随后选择带商品的源计划 `78346932308 / TA人群投放`，成功创建新计划 `81019401313 / TA人群投放_1` 并自动暂停。
- 用户最新目标取消货品全栈推广本轮要求，并补充复制成功后必须弹窗说明复制数量和新计划明细，确认后刷新网页；下一步只围绕关键词/人群补齐该交互并复测。

## 验证记录
- `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs tests/site-scene-item-binding.test.mjs tests/keyword-build-solution-payload-behavior.test.mjs tests/keyword-plan-api-bridge-security.test.mjs`：通过，28/28。
- `node --check src/optimizer/keyword-plan-api/search-and-draft.js`、`node --check src/optimizer/keyword-plan-api/wizard-open-and-create.js`、`node --check src/main-assistant/campaign-id-quick-entry.js`、`node --check src/main-assistant/budget-frontend-limit-bypass.js`：通过。
- `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs tests/keyword-create-repair-cleanup-id-extract.test.mjs tests/budget-frontend-limit-bypass.test.mjs`：通过，18/18。
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/`。
- Chrome DevTools MCP 真实关键词推广页：本地扩展重载后，当前可见营销场景操作区出现单个 `复制` 按钮；点击源计划 `76860218266` 后，`/solution/addList.json` 返回新计划 `80979085755`，`/campaign/updatePart.json` 对同一 ID 设置 `displayStatus:"pause"` 且返回 `onlineStatus=0`。
- Chrome DevTools MCP 只读确认：`campaign/get.json` 查询新计划 `80979085755` 返回 `onlineStatus=0`、`displayStatus=pause`、`dayBudget=700`、`gmtCreate=2026-05-27 01:05:11`。
- Chrome DevTools MCP 真实人群推广页：本地扩展重载后，`onebpDisplay` 列表操作区出现单个 `复制` 按钮；无商品源计划 `77464409842` 只触发 `/campaign/get.json` 后停止，未创建新计划。
- Chrome DevTools MCP 真实人群推广页：点击带商品源计划 `78346932308` 后，`/solution/addList.json` 返回新计划 `81019401313 / TA人群投放_1`，`/campaign/updatePart.json` body 为 `campaignList:[{campaignId:81019401313, displayStatus:"pause"}]` 且返回 `onlineStatus=0`。
- Chrome DevTools MCP 只读确认：`campaign/get.json` 查询新计划 `81019401313` 返回 `onlineStatus=0`、`displayStatus=pause`、`dayBudget=600`、`sceneId=372`、`gmtCreate=2026-05-27 01:13:22`。
- `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs tests/keyword-create-repair-cleanup-id-extract.test.mjs tests/budget-frontend-limit-bypass.test.mjs tests/keyword-search-p0-contract.test.mjs`：通过，29/29。
- Chrome DevTools MCP dry-run `E7Pro_AI点睛_测试`：不触发 `/solution/addList.json` 创建；源计划额外读取 `/crowd/findList.json` 1 次，读取到 5 个需求人群；样例创建请求中 `campaign.crowdList.length=5`，且不含旧 `campaignId`，`aiMaxSwitch=1`、`bidTargetV2=conv`、`constraintType=liu_zi`、`subOptimizeTarget=retained_buy`。
- Chrome DevTools MCP 真实关键词复制：源计划 `80404078368 / E7Pro_AI点睛_测试` 成功创建新计划 `81104956408 / E7Pro_AI点睛_测试_1`；创建后自动调用 `updatePart` 暂停，新计划只读查询返回 `onlineStatus=0`、`displayStatus=pause`。
- Chrome DevTools MCP 只读确认新计划 `81104956408`：`/crowd/findList.json` 返回 5 个需求人群（厨房空间有限的小型洗碗机、消毒烘干一体的厨房省心方案、灶下嵌入式洗碗机的安装首选、水槽洗碗机的台式灵活之选、美的品牌的品质洗碗机首选）；智能出价仍为获取净成交合同字段。
- Chrome DevTools MCP 原生弹窗测量：真实关键词列表只点击行操作 `删除` 到确认弹窗，不点击确认删除；测得原生弹窗卡片 `320x198`、圆角 `24px`、标题 `16px/24px`、正文 `12px/18px`、按钮 `64x32/12px`、阴影 `0 2px 10px rgba(0,0,0,0.16)`，随后点击 `取消` 关闭，未删除计划。
- Chrome DevTools MCP 成功弹窗复测：重载本地 extension 与真实页面后，用同一套弹窗 DOM/class 临时预览，不触发复制接口；测得成功弹窗卡片宽 `320px`、圆角 `24px`、标题 `16px/24px`、正文 `12px/18px`、按钮 `64x32/12px`，截图保存到 `tasks/copy-success-dialog-native-size.png`，预览后已移除页面弹窗。
- Chrome DevTools MCP 跳转目标复测：成功确认 URL 构造会把 `bizCode=onebpSearch`、`offset=0`、`searchKey=campaignNameLike`、`searchValue=E7Pro_AI点睛_测试`、`orderField=charge`、`orderBy=desc` 写入目标 hash；真实关键词列表访问该 URL 后可见源计划 `E7Pro_AI点睛_测试` 与复制计划 `E7Pro_AI点睛_测试_1` 等同前缀计划。
- Chrome DevTools MCP 受保护交互复测：临时替换页面公开 `copyCurrentPlanByScene` 为假成功返回，不触发真实创建；点击实际列表 `复制` 按钮后出现插件成功弹窗，按钮文案为 `确定并刷新`；点击后跳转到 `#!/manage/search?bizCode=onebpSearch&offset=0&searchKey=campaignNameLike&searchValue=E7Pro_AI点睛_测试&orderField=charge&orderBy=desc`，可见计划名为 `E7Pro_AI点睛_测试` 和 `E7Pro_AI点睛_测试_1`，共 2 项数据；验证后已恢复页面 API。
- `node --check src/main-assistant/ui.js`、`node --check src/main-assistant/campaign-id-quick-entry.js`、`node --check src/optimizer/keyword-plan-api/wizard-open-and-create.js`、`node --check src/optimizer/keyword-plan-api/search-and-draft.js`：通过。
- `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs`：通过，10/10。
- `npm run build`、`npm run build:check`、`npm run check:syntax`、`git diff --check`：通过。
- `npm run review`：通过，496 项回归中 494 通过、2 个历史跳过（缺少 `agent-cluster/index.mjs`），所有自动 review 检查通过。

## 结果复盘
- 根因一：关键词 AI 点睛复制此前只保留 `campaign/get` 的开关和方案字段，没有读取原生 `AI点睛设置` 弹窗依赖的 `/crowd/findList.json`，导致复制后看起来开启但缺“已选需求”。
- 根因二：成功弹窗样式先按截图放大比例落地，后续又按通用桌面字号收窄，但没有直接读取当前页面原生 `确认删除` 弹窗的 computed style。
- 修复结果：关键词复制现在会把源计划 5 个 AI 点睛需求人群随创建请求复制过去；真实新计划 `81104956408` 已确认暂停、需求人群完整、智能出价目标仍为获取净成交。成功弹窗已按当前网页原生删除确认弹窗尺寸重调；确认按钮为 `确定并刷新`，确认后进入公共计划名搜索结果。
- 风险与回滚：AI 点睛源计划若读取不到需求人群会 fail-fast，不创建半成品；若后端未来调整需求人群接口，需要更新 `queryCampaignCrowdList` 的接口解析。

---

# TODO - 2026-05-26 当前计划复制按钮

## 反馈修正 - 单按钮跟随源计划状态复制
- 需求：用户要求把 `复制暂停 / 复制并开启` 两个按钮改成一个 `复制` 按钮；源计划当前为开启，新计划就开启；源计划当前为暂停，新计划就暂停。
- 约束：
  - 保留组建计划复刻来的 `×数量` 徽标、点击加一、右键减一、滚轮调节和连续序号命名；
  - 状态来源必须来自源计划详情或可靠状态字段，不靠按钮文案手动选择；
  - 真实页面验证只做 dry-run/只读，不再误触真实创建；
  - 不修改、暂停、删除源计划。
- 执行计划：
  - [x] 收敛操作区注入逻辑，每行只保留一个 `复制` 按钮。
  - [x] 点击复制时读取源计划状态，按源计划 `onlineStatus/displayStatus` 映射新计划状态。
  - [x] 更新测试契约，删除双按钮文案断言，增加跟随源状态和单按钮断言。
  - [x] 构建同步产物，运行相关测试与真实页面 dry-run/只读验证。
  - [x] 回填验证记录、结果复盘和教训。
- 高层操作摘要：
  - 已将本次用户修正设为当前主线：当前计划列表只暴露一个复制入口，按钮状态语义由源计划状态自动决定。
  - 已把操作区复制按钮从两个按钮收敛为单个 `复制`，按钮 `data-am-campaign-copy="inherit"`；旧的 `start/pause` 操作按钮会在增强时清理。
  - 保留组建计划同款 `×数量` 徽标，点击加一、右键减一、滚轮调节，且同步更新徽标 data 值与按钮计数。
  - 点击复制先读取源计划详情，使用源计划 `onlineStatus/displayStatus/status` 解析目标状态；无法识别源状态时直接取消复制。
  - `copyCurrentPlanByScene` 仍走白名单复制、多计划命名和 dry-run 保护；只有源计划为暂停时，新建后暂停兜底才会生效。
- 验证记录：
  - `node --check src/main-assistant/campaign-id-quick-entry.js`：通过。
  - `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs`：通过，8/8。
  - `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs tests/keyword-home-strategy-batch-actions.test.mjs tests/keyword-build-solution-payload-behavior.test.mjs tests/lead-scene-template-id-guard.test.mjs tests/keyword-plan-api-slim.test.mjs tests/keyword-plan-api-bridge-security.test.mjs`：通过，42/42。
  - `npm run build`、`npm run build:check`、`npm run check:syntax`、`git diff --check`：均通过。
  - Chrome DevTools MCP 真实页面只读验证：刷新扩展与线索推广页面后，当前 6 个操作组均只显示 1 个 `复制` 按钮，旧 `复制暂停 / 复制并开启` 数量为 0；每个按钮 `data-am-campaign-copy="inherit"` 且位于 `更多` 后。
  - Chrome DevTools MCP 复制数量验证：首个按钮徽标初始为 1；点击后为 2，右键回到 1，滚轮上调到 2，滚轮下调回 1；按钮计数、徽标 data 与显示文本同步。
  - Chrome DevTools MCP dry-run 验证：源计划 `11659955636` 为 `onlineStatus=1/displayStatus=start`，dry-run 复制 2 个计划返回 `targetOnlineStatus=1/targetStatus=start`，样例计划 `onlineStatus=1`；已暂停源计划 `14481815933` 为 `onlineStatus=0/displayStatus=pause`，dry-run 返回 `targetOnlineStatus=0/targetStatus=pause`，样例计划 `onlineStatus=0`；验证期间 `/solution/addList.json` 与 `/campaign/updatePart.json` 请求数为 0。
  - `npm run test`：通过，494 项中 492 通过、2 个历史跳过（缺少 `agent-cluster/index.mjs`）。
  - `npm run review`：通过，所有自动 review 检查通过。
- 结果复盘：
  - 用户最新口径比双按钮更符合原生列表操作：复制动作只有一个，状态不再让用户手动二选一，而是复制源计划当前投放状态。
  - 本次只改变操作入口和状态解析，不改变复制字段白名单、命名、数量、支付字段修复和源计划不修改边界。
  - 风险：如果某业务线详情接口不返回可判定状态，会 fail-fast 提示无法识别源计划当前状态，避免默认为开启或暂停造成误投放。

## 反馈修正 - 复刻组建计划里的复制方式
- 需求：用户要求参考插件“组建计划”里的复制计划方式，将当前计划行复制按钮的复制方式与操作复刻过来。
- 约束：
  - 先查清组建计划内复制计划的真实交互、命名、数量和删除原计划语义，再改当前列表复制；
  - 不再新增会误触真实创建的验证动作，浏览器验证优先用 dry-run 或只读检查；
  - 保持按钮仍位于原生操作区后方，不回退到计划 ID/名称旁；
  - 不破坏现有 `复制暂停 / 复制并开启` 的目标状态语义，除非组建计划参考交互能明确替代。
- 执行计划：
  - [x] 梳理“组建计划”内部复制按钮实现，包括数量调节、命名规则、复制后删除原计划、日志与状态刷新。
  - [x] 梳理当前计划行复制流程与 API 转换差异，明确可复用/应对齐的行为。
  - [x] 以最小改动抽取或复刻组建计划复制命名与操作语义到当前复制链路。
  - [x] 补充回归测试覆盖复刻行为，特别是复制命名连续递增、数量/状态、日志和字段清理。
  - [ ] 构建同步产物，运行相关测试与真实页面 dry-run/只读验证。
- 高层操作摘要：
  - 已开始检索 `strategy-state-and-draft.js` 和 `wizard-mount-intro.js` 中组建计划复制逻辑，重点关注 `copyBatchCount`、`buildCopiedStrategyPlanName`、`removeStrategyById` 与日志语义。
  - 已确认组建计划复制行为：按钮内有 `×数量` 徽标；点击徽标加 1、右键减 1、滚轮调节；执行时复制 N 个草稿，命名按末尾序号连续递增；当 `N >= 2` 时删除原草稿并输出短日志。
  - 当前真实计划复制已复刻数量徽标、调节操作、1-99 数量上限、连续序号命名与短日志；但不复刻“删除原计划”，真实投放对象仍保持只创建新计划、不修改源计划。
  - API 层 `copyCurrentPlanByScene` 已支持 `copyCount/usedPlanNames`，一次构造多条 plans，并返回 `copySource.newPlanNames`；dry-run 复制会跳过创建后暂停，避免只读验证误报。

## 反馈排查 - 复制计划显示“余额支付”
- 需求：用户反馈“其它新建的没有‘余额支付’，为什么复制的会显示”，需要解释根因并修复复制链路中不该出现的支付字段。
- 约束：
  - 只做只读查询和代码修正，不再触发新的真实创建；
  - 不修改、暂停、删除已有原计划或已创建计划；
  - 真实页面验证以接口字段和可见状态为准。
- 执行计划：
  - [x] 比对复制计划与其它新建计划的只读 `campaign/get`/列表字段，定位“余额支付”对应的后端字段。
  - [x] 回查复制请求构造逻辑，确认字段来源和触发条件。
  - [x] 收敛修复：线索日预算复制路径不提交不相关支付字段。
  - [x] 补充/更新回归测试，证明日预算复制不会带出支付字段，套餐/流量金卡路径不被误伤。
  - [x] 运行相关测试、构建校验，并记录结果。
- 高层操作摘要：
  - 初步代码线索：线索推广组包在补默认值时会把 `orderChargeType` 兜底为 `balance_charge`，该值与“余额支付”文案匹配；需要用真实计划数据确认是否为本次异常字段。
  - 真实只读对比：源计划 `11659955636` 与原生新建计划 `14549308822` 的 `orderChargeType=null`；插件复制出的 `14481815933`、`14481867638`、`14549332819` 均为 `orderChargeType=balance_charge`。
  - 根因：复制旧线索日预算计划时已删除 `orderInfo/planId/planTemplateId/packageTemplateId`，但遗漏删除前置默认补齐的 `orderChargeType=balance_charge`，导致页面显示“余额支付”。
  - 修复：`preserveLeadDailyBudget` 分支同步删除 `orderChargeType`，让日预算复制计划与源计划、原生新建计划保持一致；非日预算/套餐型线索计划仍走原模板支付字段逻辑。
- 验证记录：
  - Chrome DevTools MCP 真实页面只读对比：`campaign/get.json` 确认源计划与原生新建计划 `orderChargeType=null`，插件复制计划为 `balance_charge`，根因字段明确。
  - Chrome DevTools MCP 真实页面 dry-run：重载扩展与页面后调用 `copyCurrentPlanByScene(..., { dryRunOnly: true })`，未触发 `/solution/addList.json` 与 `/campaign/updatePart.json`；样例 campaign `dmcType=normal`、`dayBudget=2000`、`orderChargeType` 不存在。
  - `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs tests/keyword-build-solution-payload-behavior.test.mjs tests/lead-scene-template-id-guard.test.mjs tests/keyword-plan-api-slim.test.mjs tests/keyword-plan-api-bridge-security.test.mjs`：通过，27/27。
  - `npm run build`、`npm run build:check`、`npm run check:syntax`、`git diff --check`：均通过。
  - `npm run test`：通过，493 项中 491 通过、2 个历史跳过（缺少 `agent-cluster/index.mjs`）。
  - `npm run review`：通过，所有自动 review 检查通过。

## 需求规格
- 目标：在 `one.alimama.com` 计划管理列表的每条计划操作区增加 `复制暂停` 与 `复制并开启` 两个按钮。
- 当前首批落地页面：用户给定的线索推广管理页 `onebpAdStrategyLiuZi`；实现层需按可复用方式接入现有计划 API，避免只写死当前页面。
- 行为：
  - `复制暂停`：复制当前计划配置创建一条新计划，新计划默认暂停；
  - `复制并开启`：复制当前计划配置创建一条新计划，新计划按开启状态提交；
  - 点击后直接创建，不打开组建计划向导，不依赖人工二次提交；
  - 创建失败只提示错误，不暂停、删除或修改原计划。
- 安全边界：
  - 复制请求必须清理旧 `campaignId/adgroupId/id/copyCampaignId/copyAdgroupId/gmtCreate/gmtModified/createTime/modifyTime` 等瞬态字段；
  - 禁止把旧计划原对象无过滤透传到创建接口；
  - 按钮需有 running 状态，防重复点击；
  - 真实页面验证只确认按钮和状态反馈，不点击真实创建按钮，除非用户后续明确授权。
- 成功标准：
  - 当前线索推广列表每行可见两个复制按钮，且能正确绑定 `campaignId/bizCode/itemId`；
  - `KeywordPlanApi.copyCurrentPlanByScene(sceneName, source, options)` 可被桥接受控调用；
  - 复制转换保留预算、商品、出价、地域、分时等关键配置，并按按钮选择映射新计划状态；
  - 相关单测、构建同步、语法检查、build check 通过。

## 执行计划（可核对）
- [x] 回顾工作区状态与相关历史教训，确认不覆盖已有未提交改动。
- [x] 实现已有计划到新建请求的安全转换函数与 `copyCurrentPlanByScene` API。
- [x] 更新 API 导出与桥接白名单，只暴露受控复制入口。
- [x] 在计划行操作区注入 `复制暂停` / `复制并开启` 按钮，绑定点击、running 状态和日志。
- [x] 补充回归测试：按钮注入、data 透传、防重复、字段清理、状态映射、桥接白名单。
- [x] 通过构建同步生成产物，并运行相关测试、`build:check`、语法检查。
- [x] 使用 Chrome DevTools MCP 在真实当前页面只读验证按钮渲染与未触发真实创建。
- [x] 回填验证记录、风险和结果复盘。

## 反馈修正 - 操作按钮位置
- 需求：用户截图明确要求复制计划按钮放在计划行原生操作区 `详情 / 报表 / 高级设置 / 置顶 / 更多` 的后面，而不是计划 ID 或计划名称旁边。
- 执行计划：
  - [x] 从计划 ID 快捷入口旁移除复制按钮注入，仅保留快捷查数与并发开启。
  - [x] 新增原生操作区定位逻辑，按操作行的上一条计划数据行解析 `campaignId/bizCode/itemId`，并在“更多”后插入 `复制暂停`、`复制并开启`。
  - [x] 更新样式与回归测试，锁定复制按钮位于操作区且不污染计划名称区域。
  - [x] 构建同步产物，运行定向测试、`build:check`、语法检查，并用真实页面只读验证位置和 no-op 点击链路。
- 操作摘要：
  - 已新增 `enhanceOperationNodes()`，识别原生操作组并追加复制按钮到组末尾；旧的计划 ID 区复制按钮会被清理。
  - 已让复制按钮在操作区按原生按钮横排浮动展示，并把计划 ID 区保持为仅快捷查数/并发开启的小图标。
  - 已把本次用户修正沉淀到 `tasks/lessons.md` 的 L45。
- 验证记录：
  - `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs tests/campaign-concurrent-start-quick-entry.test.mjs`：通过，11/11。
  - `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs tests/campaign-concurrent-start-quick-entry.test.mjs tests/keyword-plan-api-slim.test.mjs tests/keyword-plan-api-bridge-security.test.mjs tests/icon-system-regression.test.mjs`：通过，28/28。
  - `npm run build`、`npm run build:check`、`npm run check:syntax`、`git diff --check`：均通过。
  - `npm run review`：通过，review-team 全部 PASS，回归测试 490/492，2 个历史跳过项仍为缺少 `agent-cluster/index.mjs`。
  - Chrome DevTools MCP 真实页面验证：当前线索推广页面 3 个原生操作组均带 `复制暂停 / 复制并开启`，每组顺序为 `详情 / 报表 / 高级设置 / 置顶 / 更多 / 复制暂停 / 复制并开启`；计划名称/ID 区 inline copy 数量为 0。
  - Chrome DevTools MCP no-op 点击验证：点击操作区首个 `复制暂停` 后，同计划两枚复制按钮同时 disabled 后恢复；参数仍解析到 `campaignId=11659955636`、`itemId=757440599385`、`adgroupId=11693289232`、`copyMode=pause`、`targetOnlineStatus=0`；创建类请求计数为 0。

## 真实复制创建验证 - 用户授权执行
- 授权口径：用户要求“请测试，通过复制生成计划为止”，本轮允许执行真实复制创建验证。
- 安全选择：只点击 `复制暂停`，生成的新计划应为暂停状态；不点击 `复制并开启`，不修改、暂停、删除原计划。创建接口忽略暂停状态时，仅对刚生成的新计划追加暂停。
- 执行计划：
  - [x] 刷新真实线索推广页面并确认本地最新运行态。
  - [x] 对 `copyCurrentPlanByScene` 加一层记录包装，保留真实调用并记录返回结果与创建响应。
  - [x] 修复复制请求缺少 `marketingGoal` 导致严格目标匹配拦截的问题。
  - [x] 修复复制链路在真实运行态下依赖草稿 store 挂载顺序的问题。
  - [x] 修复线索日预算老计划复制被套餐模板 ID 校验误拦截的问题。
  - [x] 修复 `复制暂停` 创建接口忽略 `onlineStatus=0` 时未自动暂停新计划的问题。
  - [x] 点击首条计划操作区 `复制暂停` 执行真实创建。
  - [x] 记录新计划名、源计划、新 campaignId、目标状态和创建接口返回；必要时用只读查询确认新计划存在。
- 当前进展：
  - 首次真实点击源计划 `11659955636` 的 `复制暂停`，链路进入 `copyCurrentPlanByScene`，但未发起 `/solution/addList.json`。
  - 拦截原因：复制请求缺少 `marketingGoal`，严格目标匹配返回 `营销目标严格匹配失败：请求=未提供，解析=收集销售线索`。
  - 处理：补齐复制请求顶层、`common` 与单计划的 `marketingGoal`，优先匹配源计划目标，兜底使用当前场景默认目标。
  - 二次真实点击仍未发起 `/solution/addList.json`，新的拦截原因为 `KeywordPlanWizardStore.readSessionDraft is not a function`。
  - 处理：将基础草稿读写方法提前挂载到 `KeywordPlanWizardStore`，复制创建不再依赖预览模块后置挂载顺序。
  - 重载扩展后发现第一次 store 修复把后置定义的 `wizardDefaultDraft` 直接提前引用，触发 `Cannot access 'wizardDefaultDraft' before initialization`，导致计划 API 未装载；已改为延迟 wrapper，并重新构建/重载后确认 page API 和 `copyCurrentPlanByScene` 可用。
  - 三次真实点击进入线索组包后仍未发起 `/solution/addList.json`，拦截原因为 `线索推广缺少关键模板参数: planId, planTemplateId, packageTemplateId`。
  - 处理：源计划实际为 `promotionModel=daily + dmcType=normal + dayBudget` 的老线索日预算计划；复制该形态时保留日预算并跳过套餐模板 ID 校验，非日预算/套餐路径继续 fail-fast。
  - 后续真实创建成功后发现 `/solution/addList.json` 会忽略 `onlineStatus=0`，新计划初始为 `start`；已在 `copyCurrentPlanByScene` 创建成功后解析新 campaignId，并仅对新计划调用 `/campaign/updatePart.json` 设置 `displayStatus=pause`。
  - 最终强刷扩展运行态后点击源计划 `11659955636` 的 `复制暂停`：创建新计划 `14481815933 / 洗碗机_线索_E7Pro_复制_20260526_162417`，随后自动暂停成功；只读 `campaign/get.json` 确认 `onlineStatus=0`、`displayStatus=pause`、`dayBudget=2000`。

## 高层操作摘要
- 已基于用户给定 URL 只读分析：页面列表数据来自 `campaign/horizontal/findPage.json`，当前 3 条在投线索计划均携带 campaign/adgroup/material、预算、出价、地域与分时等复制所需字段。
- 已确认页面未发现原生“复制/克隆”入口，因此采用插件注入计划行按钮与现有建计划 API 创建链路。
- 已在 `KeywordPlanApi` 增加 `copyCurrentPlanByScene`：只接收受控源计划对象，按白名单保留 campaign/adgroup/material/item 字段，递归清理旧 ID 与时间字段，生成 `${原计划名}_复制_${yyyyMMdd_HHmmss}` 新名称。
- 已把 `copyCurrentPlanByScene` 加入 `exports.js` 与 `bridge.js` 白名单，主助手 API 解析同时兼容 `__AM_WXT_PLAN_API__`。
- 已在线索推广复制路径增加日预算保持标记：仅复制当前计划时保留 `dmcType=normal + dayBudget`，不影响普通线索推广创建默认逻辑。
- 已在原生操作区 `详情 / 报表 / 高级设置 / 置顶 / 更多` 后注入 `复制暂停`、`复制并开启` 两个按钮，并添加按计划维度互斥的 running 状态与源计划 ID / 新计划名 / 目标状态 / 创建结果日志。
- 已为 `复制暂停` 增加创建后状态兜底：解析创建响应里的新 campaignId，调用 `/campaign/updatePart.json` 只暂停新计划；暂停失败时整体复制结果标记失败并提示“新计划创建成功但暂停失败”。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages/` 与 `dist/extension/`。
- `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs tests/keyword-plan-api-slim.test.mjs tests/keyword-plan-api-bridge-security.test.mjs tests/icon-system-regression.test.mjs tests/campaign-concurrent-start-quick-entry.test.mjs`：通过，28/28。
- `npm run build:check`：通过。
- `npm run check:syntax`：通过。
- `npm run test`：通过，490/492，2 个历史跳过项为缺少 `agent-cluster/index.mjs`。
- `npm run review`：通过，review-team 全部 PASS，回归测试 490/492，2 个历史跳过项同上。
- Chrome DevTools MCP 真实页面验证：打开用户给定线索推广 URL，Dev Loader 加载本地最新构建后，3 条计划共渲染 6 个复制按钮；`pause=3`、`start=3`；campaignId 为 `11567504148 / 11659955636 / 12018488321`；bizCode 均为 `onebpAdStrategyLiuZi`；按钮可见且 idle。
- Chrome DevTools MCP 点击链路验证：临时把 `copyCurrentPlanByScene` 替换为 no-op 记录函数后点击首个 `复制暂停`，同一计划的 `复制暂停` 与 `复制并开启` 同时进入 disabled running 后恢复；调用参数为 `sceneName=线索推广`、`sourceCampaignId=11659955636`、`sourceBizCode=onebpAdStrategyLiuZi`、`sourceItemId=757440599385`、`sourceAdgroupId=11693289232`、`copyMode=pause`、`targetOnlineStatus=0`、`conflictPolicy=none`。
- Chrome DevTools MCP 网络验证：未点击真实创建；no-op 验证中拦截创建类 fetch 后，`/solution/addList.json`、`campaign/add/create`、`adgroup/add` 等创建类请求计数为 0。
- Chrome DevTools MCP 真实创建验证：强刷扩展与页面后点击源计划 `11659955636` 的 `复制暂停`，捕获 `/solution/addList.json` 返回 `ok=true`，新计划 `14481815933 / 洗碗机_线索_E7Pro_复制_20260526_162417`，`adgroupId=14549438636`，`materialId=757440599385`；随后自动调用 `/campaign/updatePart.json`，body 为 `campaignList:[{campaignId:14481815933, displayStatus:"pause"}]`，返回 `ok=true`。
- Chrome DevTools MCP 只读确认：`campaign/get.json` 查询新计划 `14481815933` 返回 `onlineStatus=0`、`displayStatus=pause`、`dayBudget=2000`；源计划未修改。

## 结果复盘
- 已完成受控复制入口、页面按钮和真实创建验证。根因链路依次为：缺 `marketingGoal`、草稿 store 挂载顺序、老线索日预算计划被套餐模板 ID 校验误拦截、创建接口忽略暂停状态。
- 最终方案不直接提交旧计划原对象；先白名单复制并清理瞬态字段，再走现有创建接口；`复制暂停` 在创建成功后只对新计划做一次状态兜底，不触碰原计划。
- 当前真实页面按钮初始 DOM 无 `data-item-id`，因为列表链接/行 DOM 未暴露商品 ID；点击链路会通过 `campaign/get.json` 与 `adgroup/get.json` 只读详情兜底解析，已在 no-op 验证中解析到 `757440599385`。
- 风险：复制字段按白名单保留，能覆盖当前线索推广预算、出价、地域、分时和商品；其它场景的深层定向字段如后续发现漏传，应追加白名单并补测试。

---

# TODO - 2026-05-25 计划列表名称与预算悬停编辑

## 需求规格
- 目标：在关键词推广批量建计划 API 向导首页的计划列表中，鼠标悬停到对应计划行时，计划名称与预算右侧显示铅笔编辑图标；点击图标后直接进入该字段的行内编辑；鼠标离开行后自动保存当前编辑值。
- 可编辑字段：
  - 计划名称：对应单条策略的 `planName` / 显示名称；
  - 预算：对应单条策略的预算值，当前列表展示为 `预算 100 元`。
- 交互约束：
  - 默认静态展示保持当前列表密度，不直接暴露输入框；
  - 编辑图标仅在行 hover/focus-within 时出现，风格参考原生浅灰线性铅笔图标；
  - 点击图标后聚焦输入框；按 Enter 或输入框 blur 保存，按 Escape 取消并恢复旧值；
  - 鼠标离开行时若正在编辑，自动保存，不要求用户额外点击确认；
  - 不改变批量编辑、复制、删除、编辑计划、提交创建和请求组包语义；
  - 不点击真实提交创建、生成策略或投放入口。
- 成功标准：
  - 首页策略列表计划名称和预算均支持 hover 显示编辑图标、点击编辑、离开行自动保存；
  - 保存后底部“预算合计”和提交预览能随预算变化同步；
  - 预算输入有最小校验，非法/空值不写入破坏性数据；
  - 相关回归测试覆盖 DOM 结构、事件绑定和状态同步；
  - 构建产物由 `npm run build` 同步，相关测试、语法检查、build check 通过；
  - Chrome DevTools MCP 在真实 `one.alimama.com` 页面只读验证交互，不触碰提交创建。

## 执行计划（可核对）
- [x] 回顾 `tasks/lessons.md` 与当前工作区改动，确认不覆盖已有未提交变更。
- [x] 定位计划列表渲染、字段保存、预算汇总与测试落点，确认最小改动方案。
- [x] 实现计划名称/预算的 hover 编辑图标、行内编辑、离行自动保存和取消逻辑。
- [x] 更新样式，保证图标与原生铅笔视觉接近且不挤压表格布局。
- [x] 更新回归测试覆盖编辑 DOM、事件绑定、预算同步与提交语义不变。
- [x] 运行构建同步产物，并执行相关测试、语法检查、build check。
- [x] 用 Chrome DevTools MCP 在真实页面验证 hover、点击编辑、离行保存和预算汇总更新，不触碰真实提交。
- [x] 回填验证记录、风险和结果复盘。

## 高层操作摘要
- 已回顾 `tasks/lessons.md`：本轮属于 UI 运行态交互，必须真实页面验证可见反馈；同时小尺寸图标应简洁，避免叠加复杂语义。
- 已检查 `git status`，当前工作区已有多处未提交改动，后续只叠加本次必要变更，不回退、不格式化无关文件。
- 已定位实现面：`renderStrategyList()` 负责首页计划行 DOM，`strategy.planName` / `strategy.dayAverageBudget` 是单条计划字段；`syncHomeSummary()` 直接按启用计划预算计算摘要，提交预览和创建请求也读取策略字段，适合在列表层保存后复用现有 `commitStrategyUiState()` 刷新。
- 已在 `renderStrategyList()` 中给计划名称和预算列增加行内编辑容器、共享 `edit` 铅笔图标、输入框和保存/取消事件；保存写回 `strategy.planName` / `strategy.dayAverageBudget` 并复用 `commitStrategyUiState()`。
- 已补上当前详情页同一策略的同步保护：行内保存前同步 `prefixInput` / `budgetInput`，避免 `syncDraftFromUI()` 用旧详情表单覆盖行内值。
- 已更新计划行样式：默认隐藏铅笔，行 hover/focus-within 时显示；编辑态展示输入框，预算输入控宽，名称保留两行截断。
- 已新增回归断言覆盖行内编辑 DOM、预算校验、mouseleave 自动保存、详情表单同步保护和共享铅笔图标。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages` 与 `dist/extension/page.bundle.js`。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs tests/icon-system-regression.test.mjs`：通过，20/20。
- `node --check "阿里妈妈多合一助手.js" && node --check dist/extension/page.bundle.js`：通过。
- `git diff --check`：通过。
- `npm run build:check`：通过。
- `npm run check:syntax`：通过。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs tests/keyword-edit-strategy-settings.test.mjs tests/matrix-plan-config.test.mjs tests/build-output-sync.test.mjs tests/build-segments.test.mjs tests/extension-static-build.test.mjs tests/keyword-plan-api-bridge-security.test.mjs`：通过，64/64。
- Chrome DevTools MCP 真实页面验证：
  - 页面：`https://one.alimama.com/index.html#!/manage/search?orderField=charge&orderBy=desc`。
  - 向导首页已加载新运行态：`[data-inline-edit-field]` 4 个，`.am-ui-icon-edit` 4 个。
  - hover 首行计划名后，计划名称和预算两枚铅笔按钮均变为 `opacity=1`、`visibility=visible`。
  - 点击计划名称铅笔，输入临时后缀并触发离行保存，行文本更新；随后恢复原计划名。
  - 点击预算铅笔，将首行预算从 200 临时改为 101，底部摘要从 `预算合计 400元` 更新为 `301元`；随后恢复首行预算为 200，摘要回到 `预算合计 400元`。
  - 截图：`tasks/strategy-inline-edit-hover.png`。
  - 网络审计：未触碰提交创建按钮，`keyword-plan-api/create/submit/launch/publish/batchCreate/campaignCreate` 资源命中 0。
- `npm run test`：通过，486 tests / 484 pass / 0 fail / 2 skipped。
- `npm run review`：通过，review-team 全部 PASS。

## 结果复盘
- 根因/诉求：计划列表原本只在“编辑计划”详情里改名称和预算，首页行内只能查看；用户需要像原生表格一样在 hover 后直接点铅笔编辑，提高批量调整效率。
- 实现：不新增全局状态，不改提交链路；在计划行局部维护正在编辑字段，保存时只写策略对象并复用现有状态提交函数，让预算合计、预览和草稿持久化走原链路。
- 风险控制：预算只允许 `0 < value <= 999999` 的纯数字字符串；详情页打开时先同步同一策略的表单字段，避免旧表单覆盖；真实页面只做本地草稿编辑并已恢复原值，未触碰真实创建/投放。

---

# TODO - 2026-05-25 计划列表操作列悬停显示与列距微调

## 需求规格
- 目标：计划行右侧“复制 / 删除 / 编辑”操作区和名称/预算铅笔保持同样交互，只在鼠标移动到对应行或键盘聚焦该行时显示；未 hover 的行不显示操作区。
- 文案：右侧按钮“编辑计划”改为“编辑”。
- 布局：类型列整体向左移动一些，减少计划名称与类型标签之间的叠字/拥挤。
- 约束：不改变复制、删除、编辑的业务语义，不触碰提交创建。

## 执行计划（可核对）
- [x] 调整计划行操作区渲染文案，将“编辑计划”改为“编辑”。
- [x] 调整 CSS：操作列默认隐藏，行 hover/focus-within 时显示，并保留可点击热区。
- [x] 微调计划列表 grid 列宽，让类型列更靠左且不挤压操作列。
- [x] 更新回归测试覆盖文案、hover 显示和列宽。
- [x] 构建同步产物，运行相关测试与必要门禁。
- [x] Chrome DevTools 真实页面验证 hover 显示、非 hover 隐藏、文案与列距。

## 高层操作摘要
- 已将首页计划行操作按钮文案从“编辑计划”改为“编辑”，保留当前编辑态“编辑中”。
- 已让 `.am-wxt-strategy-actions` 默认 `opacity:0/visibility:hidden/pointer-events:none`，仅在对应行 `hover` 或 `focus-within` 时显示并恢复可点击。
- 已把计划行 grid 从名称列 `minmax(210px, 1.25fr)`、类型列 `minmax(170px, 0.8fr)` 调整为名称列 `minmax(180px, 1.05fr)`、类型列 `minmax(190px, 0.95fr)`，让类型列起点左移并增加标签可用宽度。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages` 与 `dist/extension/page.bundle.js`。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs tests/icon-system-regression.test.mjs`：通过，20/20。
- `node --check "阿里妈妈多合一助手.js" && node --check dist/extension/page.bundle.js`：通过。
- `git diff --check`：通过。
- `npm run build:check`：通过。
- `npm run check:syntax`：通过。
- `npm run test`：通过，486 tests / 484 pass / 0 fail / 2 skipped。
- `npm run review`：通过，review-team 全部 PASS。
- Chrome DevTools MCP：
  - 初次复测发现真实页仍是旧运行态，操作按钮为“编辑计划”且操作区常显；已在 `chrome://extensions/` 重载当前 worktree extension `cfegfgaodnfeigffdknhgciapojejflk`，并强刷 `one.alimama.com` 页面后复测。
  - 新运行态下，按钮文案为“编辑”；鼠标移出计划行时两条计划的操作区均为 `opacity=0`、`visibility=hidden`、`pointer-events=none`。
  - 鼠标悬停首行后，仅首行显示计划名称铅笔、预算铅笔和“复制 / 删除 / 编辑”操作区；第二行仍隐藏。
  - 计划列表实际 grid 列宽为 `28px 289.266px 261.719px 275.492px 151.516px 212px`，类型列可用宽度大于名称列调整前状态，截图未见类型标签叠字。
  - 截图：`tasks/strategy-actions-hover.png`。
  - 未点击真实提交创建；网络列表未出现 `keyword-plan-api/create`、`submit`、`launch`、`publish`、`batchCreate`、`campaignCreate` 请求。

## 结果复盘
- 根因/诉求：计划行操作按钮常显会让右侧区域拥挤，且“编辑计划”文案比按钮空间更长；类型标签列也容易和名称列读起来拥挤。
- 实现：沿用上一轮行 hover 模式，操作区默认隐藏，`hover/focus-within` 才显示；按钮文案收敛为“编辑”；名称列略收窄、类型列加宽并前移，减少标签叠字风险。
- 风险：真实页面只验证了悬停/非悬停、文案和布局状态，没有点击复制、删除、编辑或提交创建，避免改动真实草稿和投放数据；这些业务语义由现有回归测试覆盖。

---

# TODO - 2026-05-25 重绘计划ID快捷查数与并发开启图标

## 需求规格
- 目标：按参考文章的功能性 ICON 方法，重新设计计划 ID 行内快捷查数按钮和并发开启按钮的图标。
- 目标选择器：
  - `#mx_2543 > div.asiYysjJgT > button:nth-child(3)`
  - `#mx_2543 > div.asiYysjJgT > button.am-campaign-search-btn.am-campaign-concurrent-start-btn`
- 设计约束：
  - 保持两个按钮原有点击语义、`data-*` 标识、标题和 aria 文案不变；
  - 使用共享 `renderAmIcon()` 体系，不回退到 iconfont、emoji、裸字符或手绘 CSS 图标；
  - 采用 24x24 画板、约 20x20 安全区、整数坐标、统一线宽和统一圆形线端；
  - 图形要比当前更容易区分：快捷查数表达“查询/数据”，并发开启表达“多计划/启动”；
  - 补足行内图标按钮热区与 hover/focus/运行态，不明显挤压原生表格布局；
  - 生成产物只能通过 `npm run build` 同步。
- 成功标准：
  - 两个按钮分别使用新图标名与新路径；
  - 图标 SVG 保持线性、无填充、整数坐标、24x24 默认画板；
  - 回归测试覆盖两个按钮图标和按钮热区样式；
  - 构建、相关测试、语法/同步检查通过；
  - 真实 `one.alimama.com` 页面只读验证两个按钮可见状态与图标渲染，不点击并发开启真实执行。

## 执行计划（可核对）
- [x] 校验计划范围：只改 `src/shared/script-preamble.js`、`src/main-assistant/campaign-id-quick-entry.js`、`src/main-assistant/ui.js`、相关测试和构建产物。
- [x] 增加两个专用共享图标定义，按 24x24/安全区/统一线宽重绘。
- [x] 将计划 ID 快捷查数与并发开启按钮切到新图标，并调整行内按钮热区、SVG fill/stroke、hover/focus 状态。
- [x] 更新回归测试，锁定新图标、禁用填充式行内 SVG、保留并发按钮标识。
- [x] 运行构建同步产物，并执行相关测试、语法检查、build check。
- [x] 用 Chrome DevTools MCP 在真实页面只读验收两个图标渲染和按钮状态，不触发真实并发开启。
- [x] 回填验证记录、风险和结果复盘。

## 高层操作摘要
- 已回顾 `tasks/lessons.md`，本轮涉及 UI 运行态，必须真实页面验证可见状态，不以静态代码推断替代。
- 已读取参考文章并提炼落地规则：功能性图标强调功能表达、工整规范；小尺寸图标要简练、可辨识、视觉重心稳定；24x24 画板内约 20x20 作图、安全区留白、整数坐标、统一线宽和端点。
- 已定位实现面：按钮创建在 `src/main-assistant/campaign-id-quick-entry.js`，按钮样式在 `src/main-assistant/ui.js`，共享图标定义在 `src/shared/script-preamble.js`。
- 已新增 `campaign-query` 与 `campaign-concurrent-start` 两个专用共享图标；快捷查数按钮表达“数据查询”，并发开启按钮表达“多行计划 + 启动”。
- 已把两个按钮从通用 `search` / `layers-play` 切到专用图标，并把行内按钮从 11px 实际图形改为 20px 热区 + 14px 线性图标，修正 SVG `fill: currentColor` 导致的填充风险。
- 已更新 `tests/campaign-concurrent-start-quick-entry.test.mjs` 与 `tests/icon-system-regression.test.mjs`，锁定专用图标名、SVG 路径、线性样式和按钮热区。
- 根据用户截图反馈，已进一步删除“文档线/列表线”等多语义细节，把两枚行内图标收敛为简约放大镜与简约启动三角，使其更接近旁边原生铅笔图标的低复杂度轮廓。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages` 与 `dist/extension/page.bundle.js`。
- `node --test tests/campaign-concurrent-start-quick-entry.test.mjs tests/icon-system-regression.test.mjs`：通过，11/11。
- `npm run build:check`：通过。
- `npm run check:syntax`：通过。
- `git diff --check`：通过。
- `npm run review`：通过，review-team 全部 PASS；全量回归 485 tests / 483 pass / 0 fail / 2 skipped。
- Chrome DevTools MCP：
  - 参考页面：`https://one.alimama.com/index.html#!/manage/search?orderField=charge&orderBy=desc`。
  - 首次检查发现页面仍是旧运行态，按钮仍为 `am-ui-icon-search` / `am-ui-icon-layers-play`、11px 图形；该轮未记为通过。
  - 已在 `chrome://extensions/?id=cfegfgaodnfeigffdknhgciapojejflk` 点击 Reload，确认扩展从 `dist/extension` 加载，并强刷真实页面。
  - 复测结果：`quickButtonCount=80`，`concurrentButtonCount=40`；首个快捷查数按钮为 `am-ui-icon-campaign-query`，路径为 `<circle cx="10" cy="10" r="5">` + `<path d="M14 14l5 5">`；首个并发开启按钮为 `am-ui-icon-campaign-concurrent-start`，路径为 `<path d="M8 6l10 6-10 6V6z">`。
  - 按钮样式：20px x 20px 热区、2px padding、5px radius；SVG 为 14px x 14px、`fill: none`、`stroke: currentColor`、`stroke-width=2.1`、`viewBox=0 0 24 24`。
  - 仅临时强制显示首行按钮做截图核验，截图保存到 `tasks/campaign-icons-verify.png`；随后已移除临时样式。
  - 未点击快捷查数或并发开启按钮；网络列表未出现 `campaign/updatePart`、创建、提交或投放类请求。

## 结果复盘
- 根因：第一版把“数据查询/并发开启”表达拆成文档线、列表线和播放形，放到 20px 行内图标中后显得复杂，和页面原生铅笔图标的简洁程度不一致。
- 修复：保留共享 SVG 体系和 20px 热区，但把图形收敛为放大镜与启动三角两个单一核心轮廓；按钮语义继续由 title/aria-label 和不同 data 标识承担。
- 质量：测试锁定专用图标名、简约路径、线性 SVG、热区和焦点态；真实页面加载最新 extension 后已验证渲染生效。
- 风险：真实页面仅做只读检查，没有点击两个按钮执行实际查数或并发开启，避免触发真实操作。

---

# TODO - 2026-05-25 组建计划矩阵隐藏态按需渲染

## 需求规格
- 目标：继续优化“组建计划”打开后的隐藏矩阵页渲染，减少默认首页打开时 `renderWorkbenchMatrixSummary()` 对矩阵维度卡片 DOM 的重建压力。
- 约束：
  - 不改变矩阵页入口、维度编辑、预设补齐、生成计划、预览摘要和提交请求语义；
  - 不让隐藏或陈旧的矩阵 DOM 反向覆盖 `draft.matrixConfig`；
  - 不点击真实生成计划、提交创建、投放入口；
  - 不扩大到矩阵结构重写或重新拆包；
  - 所有产物必须由 `npm run build` 同步。
- 成功标准：
  - 默认打开首页时矩阵维度列表 DOM 不重建，只保留摘要/统计轻量更新；
  - 切到矩阵页时基于当前 draft 补渲染完整维度卡片；
  - 矩阵页可见时编辑行仍能同步回 `draft.matrixConfig`；
  - 相关测试、全量测试/review 和真实页面只读验证通过；
  - 输出本轮前后性能对比与残余风险。

## 执行计划（可核对）
- [x] 启动 5 个子代理并行复核 matrix 同步、渲染边界、测试落点、浏览器验收和回归风险。
- [x] 主线程阅读 `renderWorkbenchMatrixSummary()`、`syncMatrixConfigFromUI()`、`setWorkbenchPage()` 与矩阵事件处理调用链。
- [x] 实施最小按需渲染：隐藏态只标 dirty，不重建维度卡片；矩阵页可见时补渲染。
- [x] 防止隐藏/陈旧矩阵 DOM 回写 draft，确保可见编辑链路仍同步。
- [x] 更新回归测试覆盖隐藏态跳过、切矩阵页补渲染、可见态同步。
- [x] 同步构建产物并运行相关测试、全量测试、review、diff 检查。
- [x] 用真实页面只读验证打开、切换矩阵页、编辑页，不触碰生成/提交/投放。
- [x] 回填性能对比、验证记录、风险和复盘。

## 高层操作摘要
- 已回顾上一轮结论：矩阵 DOM 是剩余隐藏渲染压力，但存在 `syncMatrixConfigFromUI()` 从 DOM 回写 draft 的高风险耦合，本轮必须同时处理 source-of-truth 边界。
- 已启动 5 个只读子代理：分别复核矩阵 source-of-truth、事件链路、测试落点、真实页面验收和性能/回滚风险。
- 已实现矩阵维度行 guard：`renderWorkbenchMatrixSummary()` 在非矩阵页只标记 `matrixDimensionListDirty`，不重建 `matrixDimensionList.innerHTML`；矩阵页可见时才渲染并标记当前 scene。
- 已收紧 `syncMatrixConfigFromUI()`：只有矩阵页可见、维度 DOM 已按当前 scene 渲染且未 dirty 时，才从 DOM 读取 `[data-matrix-dimension-row]` 回写 `draft.matrixConfig.dimensions`。
- 已同步构建产物并完成矩阵定向测试、打开路径相关回归、全量测试和 review-team 门禁。
- 已在真实 `one.alimama.com` 页面完成只读验收：默认首页打开未重建矩阵维度 DOM，切换矩阵页后按需补渲染，编辑页动态配置仍可见。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages` 与 `dist/extension/page.bundle.js`。
- `node --test tests/matrix-plan-config.test.mjs`：通过，25/25。
- `node --test tests/matrix-plan-config.test.mjs tests/keyword-wizard-entry-regression.test.mjs tests/keyword-edit-strategy-settings.test.mjs tests/keyword-custom-native-parity-ui.test.mjs tests/build-output-sync.test.mjs tests/build-segments.test.mjs tests/extension-static-build.test.mjs tests/keyword-plan-api-bridge-security.test.mjs`：通过，69/69。
- `node --check dist/extension/page.bundle.js && node --check "阿里妈妈多合一助手.js"`：通过。
- `npm run build:check`：通过。
- `git diff --check`：通过。
- `npm run check:syntax`：通过。
- `npm run test`：通过，484 tests / 482 pass / 0 fail / 2 skipped。
- `npm run review`：通过，review-team 全部 PASS。
- Chrome DevTools MCP：
  - 已在 `chrome://extensions/?id=cfegfgaodnfeigffdknhgciapojejflk` 点击 Reload，并强刷真实 `https://one.alimama.com/index.html#!/manage/search?orderField=charge&orderBy=desc`。
  - 运行态为 `mode=extension`，版本 `7.03`，`#am-trigger-keyword-plan-api` 文案为“组建计划”，`keyword-plan-api.bundle.js` 资源数为 0。
  - 首轮点击“组建计划”：`clickReturnMs=2.1ms`，`overlayOpenMs=254.6ms`；首页可见、提交创建按钮可见、策略行 7 条；隐藏矩阵维度列表 `innerHTML` 写入次数为 0。
  - 切到“矩阵页”：矩阵面板可见，维度列表 `innerHTML` 按需写入 1 次，矩阵区域非空；未点击 `#am-wxt-matrix-generate-plans`。
  - 回首页并点击第一条“编辑计划”：详情页可见，动态配置控件数 33；未点击提交/创建/投放。
  - 资源与请求审计：本轮交互 `resourceDelta=0`，监控到的 create/submit/launch/publish/batchCreate/campaignCreate fetch/xhr 数为 0。
  - 热打开 5 次：全部正常打开，`clickReturnMs` median 0.6ms，`overlayOpenMs` median 169.0ms；每次首页打开时矩阵维度 DOM 写入次数均为 0。
- 控制台仍有页面既有 `Uncaught (in promise)` 与 deprecated feature 噪声；本轮未发现由组建计划交互触发的真实创建/提交/投放请求。

## 结果复盘
- 根因：上一轮已延后预览、runtime、editor 和 candidate 重任务，但 `renderPreview()` 仍会触发 `renderWorkbenchMatrixSummary()`；该函数在首页隐藏态也会重建矩阵维度卡片 DOM。矩阵维度同时存在 DOM 回写 draft 的双向耦合，不能只跳过渲染，否则陈旧或空 DOM 可能覆盖 `draft.matrixConfig.dimensions`。
- 修复：保持矩阵摘要、统计、输入、预设与按钮状态轻量更新，只把 `matrixDimensionList.innerHTML` 延迟到矩阵页可见时执行；隐藏态标记 dirty。`syncMatrixConfigFromUI()` 增加 source-of-truth guard，仅在矩阵页可见、列表已按当前 scene 渲染且未 dirty 时读取维度行。
- 性能对比：原始缺陷复测点击路径约 1,467ms；上一轮隐藏 editor/candidate 后首轮 overlay 可见 369.6ms、热打开 median 288.1ms；本轮首轮 overlay 可见 254.6ms，较上一轮再降 115.0ms（约 -31.1%），较原始约 -82.6%。热打开 median 169.0ms，较上一轮 288.1ms 再降 119.1ms（约 -41.3%）。
- 交互保持：组建计划首页、矩阵页补渲染、编辑计划动态配置均在真实页面验证可用；生成计划、提交创建、投放入口均未触碰。
- 风险：本轮真实页面是当前草稿状态，矩阵为关闭态，未人工制造 5 维重矩阵草稿以避免污染用户会话；结构性收益已通过隐藏态 DOM 写入次数 0、切矩阵页补渲染 1 次证明。后续若继续压榨重矩阵场景，可在离线 fixture 或受控测试草稿中补充 heavy matrix browser benchmark。

---

# TODO - 2026-05-25 组建计划隐藏区域按需渲染

## 需求规格
- 目标：继续降低点击“组建计划”后的同步 DOM 渲染压力，把默认首页不可见区域的重渲染延后到用户进入对应区域时执行。
- 约束：
  - 不改变向导首页、编辑页、矩阵页、日志页的入口和交互语义；
  - 不改变请求构建、提交创建、矩阵生成的业务输出；
  - 不点击真实创建、投放、提交入口；
  - 不扩大到重新拆包或大规模重构；
  - 所有产物必须由 `npm run build` 同步。
- 成功标准：
  - 默认打开路径减少隐藏 editor/matrix/candidate 的同步渲染；
  - 进入对应页面后 UI 仍完整补渲染；
  - 相关回归测试、全量测试/review 和真实页面只读验证通过；
  - 输出本轮前后性能对比和残余风险。

## 执行计划（可核对）
- [x] 启动 5 个子代理并行复核 editor、matrix、candidate、测试和浏览器验收风险。
- [x] 主线程阅读 `fillUIFromDraft`、`applyStrategyToDetailForm`、`renderWorkbenchMatrixSummary`、`renderCandidateList` 的状态依赖。
- [x] 选择最小侵入按需渲染点并实现，优先避免默认打开时渲染隐藏 editor/candidate。
- [x] 更新回归测试，锁定默认打开路径不渲染隐藏重区域，进入页面后仍补渲染。
- [x] 同步构建产物并运行相关测试、全量测试、review、diff 检查。
- [x] 用真实页面只读验证打开、切换矩阵/编辑入口，不触碰提交创建。
- [x] 回填性能对比、验证记录、风险和复盘。

## 高层操作摘要
- 已完成上一轮打开路径 after-paint 调度；本轮继续处理剩余可见性无关的隐藏区域 DOM 重绘。
- 已启动 5 个只读子代理，分别复核 editor 动态表单、matrix DOM、candidate 列表、测试落点和真实页面验收方案。
- 已采纳 editor/candidate 两个低风险点：默认打开和后台 runtime 初始化时跳过隐藏 editor 动态配置；候选商品列表在商品面板/弹窗不可见时只标记 dirty，不重建卡片 DOM。
- 已根据子代理复核补上编辑页可见 guard：若 draft 恢复到 editor 或用户已进入 editor，即使打开路径传了 `renderDetailSceneDynamic: false`，仍强制补渲染动态配置，避免重开编辑页空白。
- 已补充首页添加/清空商品 guard：编辑页不可见时只标记 `sceneDynamicDirty`，进入编辑计划后仍通过 `showStrategyDetail()` 完整补渲染动态配置。
- 已暂缓 matrix DOM 按需渲染：`renderWorkbenchMatrixSummary` 与 `syncMatrixConfigFromUI()` 存在双向状态依赖，盲目跳过隐藏矩阵 DOM 可能让旧 DOM 覆盖 draft，本轮不把高风险矩阵 guard 混入。

## 验证记录
- `node --test tests/keyword-wizard-entry-regression.test.mjs`：通过，7/7。
- `npm run build`：通过，已同步根 userscript、`dist/packages` 与 `dist/extension/page.bundle.js`。
- `node --test tests/keyword-wizard-entry-regression.test.mjs tests/keyword-edit-strategy-settings.test.mjs tests/keyword-custom-native-parity-ui.test.mjs tests/build-output-sync.test.mjs tests/build-segments.test.mjs tests/extension-static-build.test.mjs tests/keyword-plan-api-bridge-security.test.mjs`：通过，44/44。
- `node --check dist/extension/page.bundle.js && node --check "阿里妈妈多合一助手.js"`：通过。
- `npm run build:check`：通过。
- `git diff --check`：通过。
- `npm run check:syntax`：通过。
- `npm run test`：通过，483 tests / 481 pass / 0 fail / 2 skipped。
- `npm run review`：通过，review-team 全部 PASS。
- Chrome DevTools MCP：本轮 `mcp__chrome_devtools__list_pages` 正常返回页面列表；已在 `chrome://extensions/?id=cfegfgaodnfeigffdknhgciapojejflk` 点击 Reload，并对真实 `https://one.alimama.com/index.html#!/manage/search?orderField=charge&orderBy=desc` 执行强制刷新。
- 真实页面运行态：`mode=extension`，版本 `7.03`，`#am-trigger-keyword-plan-api` 文案为“组建计划”，`keyword-plan-api.bundle.js` 资源数为 0。
- 真实页面只读验证：
  - 点击“组建计划”能打开 overlay；首轮记录 `clickReturnMs=6.0ms`、`overlayOpenMs=369.6ms`，可见提交创建按钮；未点击提交/创建/投放。
  - 点击“添加商品”弹窗后候选商品列表补渲染，候选行 40，首行商品可见。
  - 切到“矩阵页”后 `#am-wxt-keyword-matrix-config` 可见，矩阵摘要、预设列表、维度列表均非空；未点击“生成计划”。
  - 切回首页并点击第一条“编辑计划”后详情弹层可见，动态配置控件数 33，字段回填正常。
  - 页面内资源审计：本轮交互后 `keyword-plan-api/create/submit/launch/publish/batchCreate/campaignCreate` 命中 0，`keyword-plan-api.bundle.js` 命中 0。
- 后续热打开 5 次采样：`btn.click()` 同步返回 median 0.8ms，overlay 可见 median 288.1ms；未出现点击卡死。
- 控制台存在页面既有 `Uncaught (in promise)` 与 `ERR_TUNNEL_CONNECTION_FAILED` 噪声；本轮资源审计未出现真实创建/提交/投放请求。

## 结果复盘
- 根因：上一轮已把预览构建和 runtime 初始化移出点击同步任务，但 `renderWizardFromState -> fillUIFromDraft -> applyStrategyToDetailForm -> renderSceneDynamicConfig` 仍会在默认首页打开时重建隐藏 editor 动态配置；候选商品列表也会在默认隐藏态用 40 条候选商品重建卡片 DOM。
- 修复：给 `applyStrategyToDetailForm`、`fillUIFromDraft`、`renderWizardFromState` 增加可见性参数链，默认打开和后台初始化跳过隐藏 editor 动态配置；若 draft/用户状态已经进入 editor，则强制补渲染，避免空白。候选列表在强制渲染、商品面板展开或商品弹窗可见时才重建 DOM，否则只标记 dirty。
- 性能对比：原始缺陷复测点击返回约 1,467ms；上一轮打开路径轻量化首轮 overlay 可见 578.2ms；本轮真实页面首轮 overlay 可见 369.6ms，较原始约 -74.8%，较上一轮再减少 208.6ms（约 -36.1%）。热打开 overlay 可见 median 288.1ms，同步 click 返回 median 0.8ms。
- 交互保持：组建计划入口、候选商品弹窗、矩阵页、编辑计划详情页均在真实页面验证可用；请求构建/提交创建链路未改，且未触碰真实提交按钮。
- 风险：矩阵 DOM 仍会随预览摘要重建；子代理确认矩阵页有 DOM 回写 draft 的双向依赖，本轮暂不做 matrix lazy guard，避免隐藏旧 DOM 覆盖 `draft.matrixConfig`。后续若继续优化矩阵，需要同时改 `syncMatrixConfigFromUI()` 的 source-of-truth 判断。

---

# TODO - 2026-05-25 组建计划打开路径轻量化

## 需求规格
- 目标：在不改变现有交互的前提下，继续优化“组建计划”点击后的打开路径，降低同步渲染和重复计算造成的卡顿风险。
- 约束：
  - 不再采用点击时加载完整关键词大包的方案；
  - 不改变向导 DOM id、按钮、矩阵配置、预览、提交创建链路语义；
  - 不点击真实创建、投放、提交入口；
  - 只做最小侵入优化，保持 userscript 与 extension 行为一致；
  - 所有构建产物必须由 `npm run build` 生成。
- 成功标准：
  - 定位打开路径中的主要同步瓶颈或重复工作；
  - 点击“组建计划”能稳定打开向导，首帧/返回耗时不劣化；
  - 相关测试、构建校验、全量测试/review 通过；
  - 输出本轮修改前后的打开路径或构建性能对比。

## 执行计划（可核对）
- [x] 启动 5 个子代理并行复核打开路径、重复渲染、测试、构建风险和验收方案。
- [x] 主线程阅读 `openWizard`、`renderWizardFromState`、`refreshWizardPreview` 关键路径，确认最小可改点。
- [x] 实施打开路径轻量化改动，避免重复同步预览/渲染。
- [x] 同步构建产物并更新/新增针对性回归测试。
- [x] 运行构建、相关测试、全量测试、review 和 diff 检查。
- [x] 通过真实页面只读方式验证“组建计划”点击打开，不触碰真实提交。
- [x] 回填性能对比、验证记录、风险和复盘。

## 高层操作摘要
- 已确认本轮不再尝试把完整 `keyword-plan-api` 放到点击时加载，避免复发“点击组建计划卡死浏览器”。
- 已启动 5 个只读子代理：分别复核 `openWizard` 调用链、`renderWizardFromState/refreshWizardPreview` 同步工作、回归测试、构建产物遗留和真实页面验收方案。
- 已定位点击打开路径的同步瓶颈：`openWizard()` 首次调用 `renderWizardFromState({ clearLogs: true })` 时会立即进入 `refreshWizardPreview()`，而该函数会 `buildRequest()`、同步读取 UI/draft、生成 plans/matrix preview 并写入预览 DOM；这些工作发生在 overlay 加 `open` class 之前。
- 已修改 `src/optimizer/keyword-plan-api/wizard-open-and-create.js`：首次打开先 `renderWizardFromState({ clearLogs: true, refreshPreview: false })` 渲染表单、列表和按钮，再把 overlay 打开，随后用 `requestAnimationFrame` + `setTimeout` 延后刷新预览；用 `openToken` 避免旧 open 的延迟任务回写。
- 已根据子代理复核继续收敛：场景 spec 刷新、候选商品加载和 runtime 默认值初始化也统一放到 overlay 打开后的下一帧后执行；runtime 初始化后的二次 `renderWizardFromState()` 同样跳过同步预览，改为调度预览刷新。
- 已更新 `tests/keyword-wizard-entry-regression.test.mjs`，锁定“点击同步任务不构建预览”和“不得点击时懒加载完整 keyword 大包”的回归约束；定向测试已通过。

## 验证记录
- `node --test tests/keyword-wizard-entry-regression.test.mjs`：通过，5/5。
- `node --check src/optimizer/keyword-plan-api/wizard-open-and-create.js`：通过。
- `npm run build`：通过，已同步根 userscript、`dist/packages` 与 `dist/extension/page.bundle.js`。
- `node --test tests/keyword-wizard-entry-regression.test.mjs tests/build-segments.test.mjs tests/extension-static-build.test.mjs tests/keyword-plan-api-bridge-security.test.mjs tests/build-output-sync.test.mjs`：通过，25/25。
- `node --check dist/extension/page.bundle.js && node --check "阿里妈妈多合一助手.js"`：通过。
- lazy split 残留搜索：`keyword-plan-api.bundle`、`keywordPlanApiBundle`、`KEYWORD_PLAN_LAZY`、`loadKeywordPlanApiForExtension`、`am-helper-pro-extension-keyword-plan-bundle` 在 `src/scripts/tests/dist` 和根 userscript 中无命中。
- `npm run build:check`：通过。
- `npm run check:syntax`：通过。
- `git diff --check`：通过。
- `npm run test`：通过，481 tests / 479 pass / 0 fail / 2 skipped。
- `npm run review`：通过，review-team 全部 PASS。
- Chrome DevTools MCP：`mcp__chrome_devtools__list_pages` 仍返回 `Network.enable timed out`。
- 直接 CDP 真实页面验证：页面为 `https://one.alimama.com/index.html#!/manage/search?orderField=charge&orderBy=desc`，运行态 `mode=extension`、版本 `7.03`；点击“组建计划”5 轮均能打开 overlay 并看到 `提交创建`，未点击真实提交/创建/投放入口。
- 直接 CDP 只读性能：首轮 `btn.click()` 同步返回 1.2ms，首轮 overlay 可见 578.2ms；热打开 `btn.click()` 同步返回 median 0.8ms；5 轮相关资源（`keyword-plan-api/create/submit/launch/publish/batchCreate/campaignCreate`）为 0，`keyword-plan-api.bundle.js` 为 0。
- Chrome extension 管理页 direct CDP reload 尝试：`chrome://extensions/?id=cfegfgaodnfeigffdknhgciapojejflk` 的 `Runtime.evaluate` 超时，未将该步骤记为通过；后续通过真实页面重新导航与运行态检查完成只读验收。
- 当前构建体积/compile 复测：`dist/extension/content.js` 4,161 raw / 1,427 gzip / compile median 0.058ms；`dist/extension/page.bundle.js` 3,837,089 raw / 595,820 gzip / compile median 47.431ms；根 userscript 3,745,007 raw / 576,732 gzip / compile median 46.037ms。

## 结果复盘
- 根因：修复点击懒加载大包后，`openWizard()` 仍把预览构建、场景 spec 扫描、候选列表加载和 runtime 默认值初始化压在打开链路早期，其中预览构建会同步 `buildRequest()`、物化 plans/matrix 并写预览 DOM；场景 spec 扫描还可能在首个 `await` 前做大量 DOM 查询。
- 修复：打开时先渲染基础表单和列表，立即让 overlay 进入打开状态；预览刷新、场景 spec、候选加载和 runtime 默认值初始化全部经 `requestAnimationFrame` + `setTimeout` 延后到下一帧后执行；runtime 初始化后的二次渲染不再同步构建预览。
- 性能对比：上一轮修复后的真实页面单次点击记录为 1,467ms 返回；本轮真实页面首轮同步点击返回 1.2ms、overlay 可见 578.2ms，按首轮 overlay 口径约减少 888.8ms（约 -60.6%）。热打开同步点击返回 median 0.8ms。
- 交互保持：按钮、overlay、`提交创建` 可见性、extension open bridge 和完整 page API debug 边界保持不变；真实页面 5 轮只读点击未出现提交/创建/投放请求。
- 风险：候选商品、场景配置和预览摘要现在会晚一帧到数百毫秒更新；首页打开体验更快，但若用户极快切到矩阵/编辑页，仍依赖后续异步渲染完成。已有 `openToken` 和 `visible` 检查阻止旧打开任务回写。
- 后续更大收益应继续专项拆分隐藏 editor/matrix 渲染和矩阵预览物化，不再把完整关键词大包放回点击路径。

---

# TODO - 2026-05-25 修复组建计划点击卡死

## 需求规格
- 目标：修复用户反馈的点击“组建计划”导致浏览器卡死问题，优先恢复点击稳定性。
- 约束：
  - 不改变 userscript 分发形态；
  - 不改变组建计划按钮、向导打开、debug page API 和提交链路语义；
  - 不点击真实创建、投放、提交入口；
  - 不回退本轮已修好的构建同步校验和 bridge host 方法白名单。
- 成功标准：
  - extension 点击“组建计划”不再承担首次解析/执行 2.8MB 关键词大包；
  - 构建产物同步，相关静态测试和全量 review 通过；
  - `tasks/lessons.md` 沉淀本次教训；
  - 若 Chrome DevTools MCP 仍不可用，必须如实记录验证阻塞。

## 执行计划（可核对）
- [x] 记录缺陷教训，明确点击路径不能承担大包首次解析。
- [x] 回滚 extension 点击时懒加载关键词大包，恢复 `KeywordPlanApi` 随 page runtime 初始化。
- [x] 保留并复核构建同步校验、bridge method 白名单等非问题修复。
- [x] 更新测试断言，防止再次把大包首解析挪到点击路径。
- [x] 运行构建、相关测试、全量测试/review、性能复测。
- [x] 尝试真实页面只读验证；Chrome DevTools MCP 仍阻塞，但直接 CDP 验证通过。

## 高层操作摘要
- 已确认根因优先级：性能拆包把 2.8MB 关键词运行时首次解析/执行转移到“组建计划”点击链路，是点击卡死的高风险来源；本轮先恢复稳定交互。
- 已更新 `tasks/lessons.md` 的 L43，要求后续性能拆包不能把大包首次解析转移到高频点击路径。
- 已恢复 extension `page.bundle.js` 包含完整 `keyword-plan-api` 主体，取消 `keyword-plan-api.bundle.js` 产物、manifest 暴露、content dataset 和 page runtime resources。
- 已保留上轮正确的质量改进：`npm run build:check` 逐个比对文本产物和 extension 图标；完整 page API bridge host 校验 `API_BRIDGE_METHODS` 白名单。
- 已更新测试：extension page runtime 必须包含 keyword 切片；manifest/content/page bundle 不得引用 `keyword-plan-api.bundle.js`；点击路径不得出现 `loadKeywordPlanApiForExtension` / `KEYWORD_PLAN_LAZY` / lazy script 标识。

## 验证记录
- `npm run build`：通过，extension summary 只包含 `page.bundle.js`，不再生成 `keyword-plan-api.bundle.js`。
- `node --test tests/build-segments.test.mjs tests/extension-static-build.test.mjs tests/keyword-wizard-entry-regression.test.mjs tests/keyword-plan-api-bridge-security.test.mjs tests/build-output-sync.test.mjs`：通过，24/24。
- `node --check dist/extension/page.bundle.js && node --check "阿里妈妈多合一助手.js"`：通过。
- 静态产物探针：manifest `web_accessible_resources=["page.bundle.js"]`；`content.js` 不含 `keyword-plan-api.bundle.js`；`page.bundle.js` 含 `KeywordPlanApi`，不含 lazy loader。
- `npm run build:check`：通过。
- `npm run check:syntax`：通过。
- `git diff --check`：通过。
- `npm run test`：通过，480 tests / 478 pass / 0 fail / 2 skipped。
- `npm run review`：通过，review-team 全部 PASS。
- 性能复测：extension 当前首包关键路径 `content.js + page.bundle.js` 为 3,839,328 raw / 596,971 gzip / 69,937 行；本轮有意放弃点击时拆包收益，换取点击稳定性。
- Chrome DevTools MCP：`mcp__chrome_devtools__list_pages` 仍返回 `Network.enable timed out`，但 9222 HTTP endpoint 健康。
- 直接 CDP 只读验证：已在 `chrome://extensions/?id=cfegfgaodnfeigffdknhgciapojejflk` 点击目标扩展 reload；新打开真实 `https://one.alimama.com/index.html#!/manage/search?orderField=charge&orderBy=desc` 后，运行态 `mode=extension`、`version=7.03`、`resources=null`、`lazyScript=false`、`keyword-plan-api.bundle` 资源数为 0。
- 直接 CDP 点击验证：点击 `#am-trigger-keyword-plan-api` 后 1,467ms 返回，`#am-wxt-keyword-overlay.open=true`，可见 `提交创建`，`lazyScript=false`，未出现 `keyword-plan-api.bundle.js`，未出现 `create/submit/launch` 类资源；未点击任何真实提交/投放入口。

## 结果复盘
- 根因：上轮 extension-only lazy split 虽降低首包体积，但把 `keyword-plan-api` 的首次解析、执行和向导打开集中到用户点击“组建计划”的同一条路径，真实页面中会造成浏览器长时间无响应。
- 修复：撤销点击时懒加载大包，恢复关键词运行时随 extension page runtime 初始化；点击时只执行已有的 open bridge / `openWizard`。
- 保留：构建产物同步校验和 page API host 方法白名单是独立正确修复，继续保留。
- 风险：extension 首包体积回到约 3.84MB，后续若继续优化，需要走 idle 预热、真正模块级懒加载或拆分向导内部重计算，不能直接把完整大包放到点击路径。
- 回滚方式：如需回到 lazy split，可恢复 `EXTENSION_KEYWORD_PLAN_API_SEGMENTS`、manifest lazy resource、content dataset 与 lazy bridge 文件；但必须先通过真实页面点击验收。

---

# TODO - 2026-05-25 Extension 关键词建计划按需拆包

## 需求规格
- 目标：执行“先拆大包”性能优化，把 MV3 extension `document_start` 首包中的 `keyword-plan-api` 主体移到按需加载资源，降低页面早期 JS 解析与内存压力。
- 约束：
  - 不改变 userscript 单文件分发形态；
  - 不延后授权守卫、GM 兼容、主助手、算法护航入口执行时序；
  - 保持 `#am-trigger-keyword-plan-api`、open bridge、完整 debug API 的交互语义；
  - 不手改发布产物，必须从 `src/` / `scripts/` 修改后通过 `npm run build` 生成；
  - 真实页面验证只读，不点击真实创建、投放、确认提交入口。
- 成功标准：
  - `dist/extension/page.bundle.js` 不再包含完整 `keyword-plan-api` 主体；
  - 新增按需资源能在首次点击“组建计划”时加载并打开向导；
  - 重复点击不重复注入，加载失败有当前页可见反馈；
  - extension 首包 raw/gzip/parse 指标明显下降；
  - 构建、测试、review 和真实页面只读验收通过。

## 执行计划（可核对）
- [x] 复核现有 IIFE/切片依赖，确定 extension-only 懒加载边界。
- [x] 修改构建脚本，输出 `keyword-plan-api.bundle.js` 并把它加入 extension 可访问资源。
- [x] 修改 extension 主包 bridge，首次 open/debug API 调用时加载 keyword bundle，保留 userscript 直连行为。
- [x] 增加/更新静态回归测试，覆盖拆包、manifest、懒加载桥和失败反馈。
- [x] 构建同步产物，运行最小相关测试、全量测试、review、diff 检查。
- [x] 复测拆包前后体积/parse 指标；Chrome DevTools MCP 真实页面验收因工具通道超时已记录阻塞。
- [x] 回填验证记录、性能对比、风险和回滚方式。

## 高层操作摘要
- 已确认关键实现约束：当前构建靠字符串拼接共享 IIFE 作用域，不能简单把 `KEYWORD_PLAN_API_SEGMENTS` 从 `page.bundle.js` 移出；extension 需要一个能自洽执行并暴露 API/bridge 的按需关键词运行时。
- 已启动 5 个只读子代理分别复核构建拆包、runtime bridge、测试覆盖、性能口径和浏览器验收方案。
- 已调整 `scripts/build.mjs`：extension `page.bundle.js` 排除完整 `keyword-plan-api` 切片，新增 `dist/extension/keyword-plan-api.bundle.js`，manifest `web_accessible_resources` 覆盖新资源；userscript 仍保持单文件包含完整 `KeywordPlanApi`。
- 已调整 extension 注入链路：`content.js` 把 lazy bundle URL 通过 dataset 传给 `extension-page-compat.js`，页面运行态记录到 `window.__AM_PLATFORM_RUNTIME__.resources.keywordPlanApiBundle`。
- 已调整 bridge：默认只保留 `openWizard` 窄桥；首次打开组建计划或 debug page API 时再注入 `#am-helper-pro-extension-keyword-plan-bundle`；pending Promise 和固定 script id 避免重复注入。
- 子代理发现并已修复 P1：lazy bundle 在严格模式下直接写不可写的 `__AM_WXT_KEYWORD_OPEN_BRIDGE_READY__` 会抛异常；现改为幂等 helper 写入，并保留 lazy ready event。
- 子代理发现并已修复 P2/P3：运行时半初始化失败后可移除旧 script 再重试；完整 page API bridge host 侧也校验 `API_BRIDGE_METHODS` 白名单。
- 子代理发现并已修复构建同步缺口：`npm run build:check` 现在逐个比对根 userscript、`dist/packages/*`、`dist/extension/*.js/json` 文本产物，并校验 extension 图标产物同步。
- 已补强测试：extension page runtime 与 `KEYWORD_PLAN_API_SEGMENTS` 必须零交集；lazy bundle 顺序用完整 `deepEqual` 锁定；产物级 denylist 覆盖 `KeywordPlanRuntime`、`KeywordPlanWizardStore`、`KeywordPlanPreviewExecutor`；lazy ready 幂等写入、加载状态重试、host method 白名单和所有文本产物同步均有断言。

## 验证记录
- `npm run build`：通过，已生成根 userscript、`dist/packages`、`dist/extension/page.bundle.js` 和新增 `dist/extension/keyword-plan-api.bundle.js`。
- `node --check dist/extension/page.bundle.js && node --check dist/extension/keyword-plan-api.bundle.js && node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/build-segments.test.mjs tests/extension-static-build.test.mjs tests/keyword-wizard-entry-regression.test.mjs tests/keyword-plan-api-bridge-security.test.mjs tests/build-output-sync.test.mjs`：通过，25/25。
- `npm run build:check`：通过，已校验所有文本产物与 extension 图标同步。
- `npm run check:syntax`：通过。
- `git diff --check`：通过。
- `npm run test`：通过，481 tests / 479 pass / 0 fail / 2 skipped。
- `npm run review`：通过，review-team 全部 PASS。
- 性能复测口径：gzip 使用 Node `zlib.gzipSync` 默认参数；行数用 `text.split('\n').length`；compile 指标为同一 Node 进程内 13 轮追加唯一注释后 `new vm.Script(...)` median，仅作本地 parse/compile 代理指标。
- 性能对比：
  - 修改前 extension `document_start` critical path（`content.js + page.bundle.js`）：3,837,166 raw / 596,609 gzip / 69,894 行 / compile median 57.396 ms。
  - 修改后 extension `document_start` critical path：1,042,028 raw / 196,073 gzip / 21,295 行 / compile median 26.320 ms。
  - 差异：raw -2,795,138 bytes（-72.84%），gzip -400,536 bytes（-67.14%），行数 -48,599（-69.53%），compile median -31.076 ms（-54.14%）。
  - 修改后按需资源 `dist/extension/keyword-plan-api.bundle.js`：2,834,987 raw / 410,228 gzip / 49,506 行 / compile median 60.840 ms；不计入首屏 `document_start`，首次打开组建计划时加载。
  - 修改后 userscript 单文件：3,747,664 raw / 577,174 gzip / 67,638 行 / compile median 189.509 ms；分发形态保持单文件。
- Chrome DevTools MCP 真实页面验收：`curl http://127.0.0.1:9222/json/version` 返回健康 `webSocketDebuggerUrl`，`/json/list` 可看到真实 `one.alimama.com/index.html#!/manage/search?...` 页面；但 `mcp__chrome_devtools__list_pages` 120s 超时，`mcp__chrome_devtools__new_page about:blank` 返回 `Network.enable timed out`。
- 已按技能尝试 `bash scripts/recover-chrome-devtools-mcp.sh "https://one.alimama.com/"`，脚本在“固化 Codex MCP 配置”阶段失败：引用的 Codex vendor 可执行文件路径不存在（`ENOENT .../codex-darwin-arm64/.../codex`）。直接 CDP 诊断也在 Runtime 启用阶段卡住，已终止挂起进程。因此真实 extension runtime MCP 验收未完成，不能登记为通过。

## 结果复盘
- 根因：extension 在 `document_start` 立即注入完整 `page.bundle.js`，其中 `keyword-plan-api` 主体约 2.83 MB，包含大量只在“组建计划”向导首次打开时才需要的配置、渲染和提交链路，导致页面早期 JS 解析和内存压力偏高。
- 修复：保持 userscript 单文件不变；仅在 MV3 extension 中把关键词建计划主体拆成 `keyword-plan-api.bundle.js`，首包保留授权守卫、GM 兼容、主助手、算法护航和 `openWizard` 窄桥。
- 后续状态：该方案触发“点击组建计划卡死浏览器”缺陷，已在上方 `修复组建计划点击卡死` 任务中撤销点击时懒加载大包，恢复关键词运行时随 page bundle 初始化。
- 交互保持：`#am-trigger-keyword-plan-api` 仍通过 open bridge 打开向导；完整 page API 仍只在 `localStorage.__AM_WXT_DEBUG_PAGE_API__ === '1'` 时暴露；debug 开关是调试面，不作为安全边界。
- 主要收益：extension 首屏关键路径 raw 下降 72.84%，gzip 下降 67.14%，本地 compile median 下降 54.14%；总体 extension JS 总量基本不变，收益来自把大模块移出 `document_start`。
- 风险：真实 Chrome DevTools MCP 运行态验收因当前工具通道阻塞未完成；已用构建产物、静态测试、全量测试和 review 证明拆包形态与桥接不变量，但仍建议在 MCP 恢复后按子代理给出的 extension-only 步骤做一次真实点击验证。
- 回滚方式：把 `EXTENSION_PAGE_RUNTIME_SEGMENTS` 恢复为完整 `CORE_RUNTIME_SEGMENTS` 形态，移除 `keyword-plan-api.bundle.js` 生成与 lazy bridge 改动，运行 `npm run build` 同步产物。

---

# TODO - 2026-05-25 加载性能优化与对比

## 需求规格
- 目标：定位当前脚本/插件加载阶段的主要性能瓶颈，做最小侵入优化，并输出修改前后的量化性能对比。
- 约束：
  - 保持现有交互、DOM id、事件语义、提交链路和真实页面安全边界不变；
  - 优先优化加载阶段的同步耗时、重复初始化、构建体积或首屏阻塞点；
  - 不回退、覆盖当前工作区已有未提交改动；
  - 只从 `src/` 修改源码，构建产物通过 `npm run build` 同步；
  - 真实页面验证只做只读检查，不点击真实创建/投放/提交入口。
- 成功标准：
  - 有明确瓶颈定位记录和依据；
  - 至少一项加载性能指标在优化后改善，且无交互回归；
  - 相关测试、构建校验和语法检查通过；
  - 输出修改前后性能对比表，并说明测量口径。

## 执行计划（可核对）
- [x] 回顾历史教训、dirty 状态和当前加载路径，确认计划范围。
- [x] 建立基线：构建产物体积、模块/段落体积、初始化耗时或可复现 micro-benchmark。
- [x] 定位主要瓶颈：结合源码、构建脚本、测试和必要的运行时测量，找出优先级最高的加载阻塞点。
- [x] 实施最小侵入优化，保持交互和业务链路不变。
- [x] 同步构建产物，运行相关测试、`npm run build:check`、`npm run check:syntax`，按风险运行 `npm run review`。
- [x] 复测优化后指标并输出前后对比，必要时做真实页面只读验证。
- [x] 回填验证记录、结果复盘和风险/回滚方式。

## 高层操作摘要
- 已读取 `tasks/lessons.md`：本轮会遵守真实页面刷新后再验收、点击类修复需保留当前页反馈、提交类入口只读验证等规则。
- 已确认工作区存在前序未提交改动，本轮会在现有状态上增量处理，不回退无关文件。
- 计划范围校验：本轮目标是加载性能，不改变关键词批量建计划首页、矩阵、商品选择和提交交互语义。
- 已建立本地基线，详见 `tasks/load-performance-20260525-notes.md`：userscript 3,777,502 bytes，extension page bundle 3,869,584 bytes，extension 当前在 `document_start` 立即注入完整 page bundle。
- 已定位两个低风险瓶颈：extension 早期注入 3.87 MB bundle；主助手启动样式里 36,579 bytes 的 `#am-trigger-optimizer` 原生变量快照实际冗余。
- 经复核，extension page bundle 内含授权守卫，本轮不改变注入时序，避免安全检查延后；实际落地先删除主助手冗余 CSS 快照。
- 已从 `src/main-assistant/ui.js` 删除 `#am-trigger-optimizer` 冗余原生变量 CSS 快照，保留工具按钮 DOM、`.am-tool-btn` 样式和点击事件。
- 已运行构建同步产物、最小回归集、构建校验、语法检查、diff 检查和完整 review。
- 已用同口径 micro-benchmark 复测并形成对比；已在真实 `one.alimama.com` 页面只读验证主助手、算法护航入口和组建计划入口。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages` 与 `dist/extension`。
- `node --test tests/build-segments.test.mjs tests/build-output-sync.test.mjs tests/extension-static-build.test.mjs tests/package-scripts.test.mjs tests/keyword-plan-api-slim.test.mjs tests/optimizer-entry-error-handling.test.mjs tests/logger-api.test.mjs`：通过，33/33。
- `npm run build:check`：通过。
- `npm run check:syntax`：通过。
- `git diff --check`：通过。
- `npm run review`：通过，476 pass / 0 fail / 2 skipped。
- 性能复测详见 `tasks/load-performance-20260525-notes.md`：userscript raw 减少 36,579 bytes（-0.97%），gzip 减少 5,705 bytes（-0.98%）；extension page bundle raw 减少 36,579 bytes（-0.95%），gzip 减少 4,841 bytes（-0.81%）；主助手启动 CSS raw 减少 36,579 bytes（-55.67%）。
- Chrome DevTools MCP 真实页面只读验证：刷新 `one.alimama.com/index.html#!/manage/search?orderField=charge&orderBy=desc` 后脚本版本 `7.03`；主助手面板可展开，`算法护航 / 组建计划 / 万能查数 / 辅助显示` 按钮可见；启动样式不再包含被删除的原生变量快照；点击 `算法护航` 可打开护航面板并显示 `立即扫描并优化`；点击 `组建计划` 可打开关键词向导并显示 `提交创建`；未点击任何真实执行、创建、投放或确认提交入口。
- 本轮复核 `npm run build`：通过，已重新同步根 userscript、`dist/packages` 与 `dist/extension`。
- 本轮复核 `npm run test`：通过，478 tests / 476 pass / 0 fail / 2 skipped。
- 本轮复核 `npm run build:check`：通过。
- 本轮复核 `npm run check:syntax`：通过。
- 本轮复核 `git diff --check`：通过。
- 本轮复核 `npm run review`：通过，478 tests / 476 pass / 0 fail / 2 skipped，所有 review-team 自动检查通过。
- 本轮复核性能指标：当前 `userscript` 3,740,923 bytes，`extension page.bundle.js` 3,833,005 bytes，`PRE_KEYWORD_SEGMENTS` 724,611 bytes，主助手启动 CSS 29,133 bytes；另用追加唯一注释的 `vm.Script` 口径复核 parse/compile median，`userscript` 36.842 ms，`extension page.bundle.js` 41.465 ms。
- 5 个子代理复核结论：删除 `#am-trigger-optimizer` CSS 快照未改变 DOM id、`.am-tool-btn` 通用样式和点击事件；最大结构性瓶颈仍是 `document_start` 立即注入约 3.83 MB 单体 `page.bundle.js`，其中 `keyword-plan-api` 约占 2.8 MB，后续更大收益应专项拆包。
- 本轮 Chrome DevTools MCP 真实页面只读复核：刷新后 `document.readyState=complete`、脚本版本 `7.03`；`#am-helper-pro-v26-style` 为 29,133 bytes，且不含 `Native Style for Optimizer Trigger`、`--mux-ai-brand-gradient-line` 或 `#am-trigger-optimizer { ... }` 快照；四个主助手工具按钮均可见；点击 `算法护航` 可打开护航面板；点击 `组建计划` 可打开关键词向导并显示 `提交创建`；`performance` resource 中未发现 `create/submit/launch` 类请求。控制台仍有平台侧既有 `Uncaught (in promise)` 噪声，但不阻断本轮入口验证。

## 结果复盘
- 根因：主助手启动样式中残留一段为单个 `#am-trigger-optimizer` 按钮准备的原生变量快照，包含大量未被当前 `.am-tool-btn` 视觉和事件使用的 CSS 变量；每次加载都会进入 userscript/page bundle，并在 `UI.injectStyles()` 中注入到页面。
- 修复：删除该冗余 CSS 块，保留主面板 DOM、按钮 class、图标、点击事件和算法护航/组建计划打开链路。
- 风险：本轮没有拆分 keyword-plan-api、万能查数或授权守卫，整体 3.8 MB 单体 bundle 仍是后续主要优化空间；extension page bundle 延后注入曾评估但因授权守卫时序要求未采用。
- 复核补充：首次本地指标脚本误把不完整的 `PRE_KEYWORD_SEGMENTS` 当成完整 JS 编译，出现 `Unexpected end of input`；已改为“分片只统计体积、完整 bundle 才编译”，产物语法与测试均通过。
- 回滚方式：恢复 `src/main-assistant/ui.js` 中 `/* Native Style for Optimizer Trigger */ #am-trigger-optimizer { ... }` 样式块，并运行 `npm run build` 同步产物。

---

# TODO - 2026-05-25 关键词批量建计划类型标签配色

## 需求规格
- 目标：按用户反馈优化首页计划表格“类型”列，让不同设置有不同颜色，同一语义类型可用深浅区分。
- 约束：
  - 只调整类型标签渲染 class、样式和测试契约；
  - 不改变计划数据、请求 payload、提交确认、矩阵、商品和日志逻辑；
  - 保持后台工具风格，避免大面积高饱和色块影响扫描；
  - 真实页面验证只读，不点击真实创建/投放入口。
- 成功标准：
  - 类型列三类标签分别带有语义 class：推广类型、营销目标、出价模式；
  - 不同营销目标有不同色系，智能/手动出价有区分；
  - 同一行内标签颜色有层级但不抢主按钮；
  - 构建、相关测试和真实页面只读验证通过。

## 执行计划（可核对）
- [x] 定位类型标签渲染位置、现有样式和回归断言。
- [x] 增加标签 tone helper、色彩样式和测试断言。
- [x] 运行构建、相关测试、构建校验、语法、review 和 diff 检查。
- [x] 用 Chrome DevTools MCP 刷新真实页面，只读验证标签颜色与布局。

## 高层操作摘要
- 已确认类型列当前由 `strategySceneName / goalLabel / bidModeLabel` 三个标签组成，全部共用 `.am-wxt-strategy-tag` 蓝色样式。
- 已新增 `getStrategyTagClassName`，按推广类型、营销目标和出价模式生成语义 class；样式层通过 CSS 变量设置不同色系与深浅。
- 已补充首页回归测试，断言类型标签 tone helper 和关键色彩变量存在。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages` 与 `dist/extension`。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs tests/keyword-plan-api-slim.test.mjs`：首次因新增 CSS 正则过于依赖变量顺序失败；已调整为匹配实际 CSS 变量顺序后通过，17/17。
- `npm run build:check`：通过。
- `npm run check:syntax`：通过。
- `git diff --check`：通过。
- `npm run review`：通过，476 pass / 0 fail / 2 skipped。
- Chrome DevTools MCP 真实 `one.alimama.com/index.html#!/manage/search?orderField=charge&orderBy=desc`：刷新页面后脚本版本为 `7.03`，向导可打开。
- 真实页面类型标签验证：弹窗宽度 `1320px`，计划行 `7` 行；首行标签为 `关键词推广` 蓝色、`趋势明星` 青色、`智能出价` 紫色，class 分别为 `am-wxt-strategy-tag-scene am-wxt-strategy-tag-tone-keyword`、`am-wxt-strategy-tag-goal am-wxt-strategy-tag-tone-trend`、`am-wxt-strategy-tag-bid am-wxt-strategy-tag-tone-smart`；当前 7 行合计出现 6 组颜色，覆盖不同目标设置。
- 安全边界：仅打开向导读取样式和布局；未点击 `提交创建`、`确认提交创建` 或任何真实创建/投放入口。

## 结果复盘
- 根因：类型列三枚标签原先共用一套蓝色样式，无法快速区分推广类型、营销目标和出价模式，也无法在多个营销目标之间形成扫描差异。
- 修复：新增稳定的 `getStrategyTagClassName` helper，按业务语义输出 scene/goal/bid 和 tone class；样式层用 CSS 变量承载色彩，做到同语义稳定、不同设置可区分。
- 风险：本轮仅覆盖现有常见目标色系；后续如果新增营销目标，可继续扩展 helper 的 tone 分支，不影响数据与提交链路。
- 回滚方式：恢复 `strategy-state-and-draft.js` 中类型标签 class 生成和 `style.js` 中新增 tone 样式，重跑 `npm run build`。

---

# TODO - 2026-05-25 关键词批量建计划首页宽度修正

## 需求规格
- 目标：按用户反馈放宽关键词批量建计划首页弹窗宽度，缓解计划行文字拥挤和叠加观感。
- 约束：
  - 只调整首页主弹窗桌面宽度和对应测试契约；
  - 不改变提交确认、请求组包、计划构造、商品选择、矩阵页和日志逻辑；
  - 保留窄屏回退，真实页面验证不点击确认提交。
- 成功标准：
  - 宽屏下主向导弹窗宽度上限更大；
  - 计划表格列获得更宽展示空间；
  - 二次确认和主按钮仍保持上一轮逻辑；
  - 构建、相关测试和真实页面只读验证通过。

## 执行计划（可核对）
- [x] 定位当前弹窗宽度、计划行列宽和真实页面实际尺寸。
- [x] 调整主弹窗宽度与测试断言，并同步教训。
- [x] 运行构建、相关测试、构建校验、语法和 diff 检查。
- [x] 用 Chrome DevTools MCP 刷新真实页面，只读验证宽度和文字不叠加。

## 高层操作摘要
- 已在真实页面读取当前尺寸：视口 `1800px`，主向导弹窗 `1160px`，首行计划表格列无 DOM 几何重叠但信息密度偏紧。
- 已将主向导桌面宽度上限调整为 `min(1320px, calc(100vw - 48px))`，并补充首页回归测试断言。
- 已将“后台表格弹窗优先给足桌面宽度”的规则沉淀到 `tasks/lessons.md`。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages` 与 `dist/extension`。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs tests/keyword-plan-api-slim.test.mjs`：通过，16/16。
- `npm run build:check`：通过。
- `npm run check:syntax`：通过。
- `git diff --check`：通过。
- `npm run review`：通过，475 pass / 0 fail / 2 skipped。
- Chrome DevTools MCP 真实 `one.alimama.com/index.html#!/manage/search?orderField=charge&orderBy=desc`：刷新页面后 `document.readyState` 为 `complete`，脚本版本为 `7.03`，`window.__AM_WXT_KEYWORD_API__.openWizard()` 可打开向导。
- 真实页面宽度验证：视口 `1800px` 下主向导弹窗从先前读取的 `1160px` 变为 `1320px`；首行计划列宽为名称 `330px`、类型标签 `211px`、出价目标 `264px`、预算 `145px`、操作 `224px`；列间 `overlaps=[]`。
- 真实页面安全边界：仅打开向导并读取布局；未点击 `提交创建`、`确认提交创建` 或任何真实创建/投放入口。

## 结果复盘
- 根因：上一轮虽然补了计划名两行和 title，但主弹窗桌面宽度仍保持 `1160px`，表格信息密度较高，用户视觉上仍会感到文字拥挤或叠加。
- 修复：在首页工作台样式层将主向导宽度上限提高到 `1320px`，同时用 `calc(100vw - 48px)` 约束视口边距，避免影响窄屏回退。
- 风险：本轮只改宽度，不改表格列模板和业务逻辑；若后续计划标签继续增加，可能还需要拆分列或减少同一行标签数量。
- 回滚方式：恢复 `style.js` 中 `#am-wxt-keyword-modal` 的宽度覆盖，并重跑 `npm run build`。

---

# TODO - 2026-05-25 关键词批量建计划首页 UI 小步优化

## 需求规格
- 目标：基于当前已回退后的首页继续做小步 UI 优化，让提交风险更清晰、计划表格更可读、底部执行区更像工作台。
- 约束：
  - 不重走二次贴图大改版；
  - 不改变请求 payload、提交接口、矩阵生成、商品选择、日志页和批量编辑业务逻辑；
  - 保留 `#am-wxt-keyword-run-quick`、`#am-wxt-keyword-submit-summary`、`#am-wxt-keyword-run-mode-toggle` 等关键 DOM id；
  - 不使用 `window.confirm`，二次确认复用现有弹窗体系；
  - 真实页面验证只做只读验收，不点击确认提交、不触发真实创建/投放请求。
- 成功标准：
  - 首页主按钮从 `立即投放` 改为 `提交创建`；
  - 点击主按钮先出现二次确认弹窗，显示计划数、预算合计、商品数、提交方式和风险提示；
  - 确认后才调用现有创建链路；
  - 计划名称可完整识别，删除按钮为危险态，复制/删除/编辑权重区分；
  - 目标成本输入空值态更清晰，单位不拥挤；
  - 底部摘要固定表达“将提交 N 个计划 / 预算合计 X / 提交方式 Y”。

## 执行计划（可核对）
- [x] 回顾项目教训、当前任务记录和 dirty 状态，确认在现有改动基础上增量实现。
- [x] 修改首页提交按钮、二次确认弹窗、底部摘要和计划行可读性。
- [x] 更新首页 UI 回归测试并同步构建产物。
- [x] 运行构建、相关测试、语法、review、diff 检查。
- [x] 用 Chrome DevTools MCP 在真实 `one.alimama.com` 页面刷新运行态并只读验证。

## 高层操作摘要
- 已回顾 `tasks/lessons.md`，本轮重点遵守：真实页面验证前刷新运行态、点击类修复要有当前页可见反馈、提交类验证不触碰真实提交入口。
- 已确认当前工作区已有上一轮首页/商品/矩阵等未提交改动，本轮只做增量优化，不回退无关文件。
- 已完成首页主按钮文案、二次确认弹窗、底部摘要、计划名称完整识别、删除危险态和目标成本空值态的源码改动。
- 已更新首页 UI 回归测试，覆盖提交确认弹窗、确认后调用现有创建链路、计划行可读性和危险态。
- 已运行 `npm run build` 同步根 userscript、`dist/packages` 与 `dist/extension` 产物。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages` 与 `dist/extension`。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs tests/site-scene-submit-mode.test.mjs tests/keyword-item-picker-popup.test.mjs tests/keyword-edit-strategy-settings.test.mjs tests/keyword-strategy-target-cost-layout.test.mjs tests/keyword-target-cost-input-visual.test.mjs`：通过，36/36。
- `npm run build:check`：通过。
- `npm run check:syntax`：通过。
- `npm run review`：首次因 `tests/keyword-plan-api-slim.test.mjs` 仍定位旧 `handleRun` 内联拦截而失败；已改为定位新的 `resolveWizardRunPayload` 前置校验 helper。
- `node --test tests/keyword-plan-api-slim.test.mjs tests/keyword-home-strategy-batch-actions.test.mjs`：通过，16/16。
- `npm run review`：通过，475 pass / 0 fail / 2 skipped。
- `git diff --check`：通过。
- Chrome DevTools MCP 真实 `one.alimama.com/index.html#!/manage/search?orderField=charge&orderBy=desc`：刷新页面后 `document.readyState` 为 `complete`，脚本版本为 `7.03`，`window.__AM_WXT_KEYWORD_API__.openWizard()` 可打开向导。
- 真实页面首页验证：弹窗打开；主按钮为 `提交创建`；按钮 title 为 `提交方式：单条`；底部摘要为 `将提交 7 个计划 预算合计 700元 提交方式：单条`；计划列表 7 行；首个计划名有完整 `title`；存在危险态删除按钮；空目标成本占位为 `待填写`。
- 二次确认只读验证：点击 `#am-wxt-keyword-run-quick` 后出现确认弹窗，包含计划数 `7`、预算合计 `700元`、商品数 `1`、提交方式 `单条`、风险提示和按钮 `确认提交创建 / 取消`。
- 安全边界：未点击确认按钮；点击主按钮到确认弹窗期间未观察到创建/提交/投放类网络请求。

## 结果复盘
- 根因：原首页主按钮仍用 `立即投放` 表达，提交风险和创建前确认不足；计划行操作权重接近，长计划名和空目标成本状态不够清晰；底部摘要偏日志化而非工作台决策信息。
- 修复：保留原提交入口 DOM id 和创建链路，新增弹窗式二次确认；确认前只做请求预检和预览渲染，确认后才复用现有 `handleRun`；计划行补完整名称可访问性、删除危险态、操作权重和空成本视觉；底部摘要固定展示计划数、预算和提交方式。
- 风险：真实页面验收按安全边界未点击 `确认提交创建`，因此未覆盖真实创建接口成功结果；确认后的调用路径已由单元测试证明进入现有 `handleRun`。
- 回滚方式：恢复 `request-builder-preview.js` 的 quick run 绑定、`wizard-mount-intro.js` 的按钮/摘要文案、`strategy-state-and-draft.js` 的计划行类名与 placeholder、`style.js` 新增样式，并重跑 `npm run build` 同步产物。

---

# TODO - 2026-05-25 回退关键词批量建计划向导首页二次贴图改版

## 需求规格
- 目标：按用户“回退”要求，撤销上一轮“首页二次贴图改版”，恢复到前一版首页 UI 改版状态。
- 约束：
  - 只回退最近一轮二次贴图改版；
  - 保留上一版首页 UI 改版、商品主图、首页 Tab 精简、矩阵间距等既有改动；
  - 不回退或覆盖工作区中其它用户/代理改动；
  - 真实页面验证仍只做只读检查，不点击 `立即投放`、`提交 N 个计划`、`批量创建`、原生 `创建完成` 或任何真实提交入口。
- 成功标准：
  - Header 状态恢复为 `向导就绪`；
  - 顶部 Tab 恢复为 `首页 / 矩阵页 / 日志页`；
  - 商品区恢复为 `已添加商品`，计划区恢复为 `计划配置`；
  - 移除首页只读批量设置输入外观；
  - 表格预算列恢复为 `预算`，计划行恢复场景/目标/出价标签与 `预算 x 元`；
  - 底部主按钮恢复为 `立即投放`，摘要恢复 `N 个计划可提交 · 预算合计 y元`；
  - 快捷日志恢复原 `[时间] 消息` 文本输出。

## 执行计划（可核对）
- [x] 隔离二次贴图改版改动点，确认不回退上一版 UI 和无关文件。
- [x] 反向修改首页 DOM、计划行渲染、样式和相关测试。
- [x] 运行构建、构建校验、语法、相关测试、`npm run review`。
- [x] 用 Chrome DevTools MCP 在真实 `one.alimama.com` 页面刷新运行态并只读验证回退结果。

## 高层操作摘要
- 已按“回退最近一轮二次贴图改版”处理，保留上一版首页 UI 改版与其它已存在改动。
- 已将 Header 状态、Tab 文案、商品区标题、计划区标题、计划列表预算列、主按钮文案和日志输出恢复到上一版语义。
- 已移除二次贴图新增的只读批量设置输入、缺目标成本统计、动态 `提交 N 个计划` 文案、结构化日志拆列和对应测试断言。
- 已同步构建产物，确保根 userscript、`dist/packages` 与 `dist/extension` 与源码一致。

## 验证记录
- `npm run build`：通过。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs tests/site-scene-submit-mode.test.mjs tests/keyword-item-picker-popup.test.mjs tests/keyword-edit-strategy-settings.test.mjs tests/keyword-strategy-target-cost-layout.test.mjs`：通过，33/33。
- `npm run build:check`：通过。
- `npm run check:syntax`：通过。
- `npm run review`：通过，473 pass / 0 fail / 2 skipped。
- `git diff --check`：通过。
- Chrome DevTools MCP 真实 `one.alimama.com/index.html#!/manage/search?orderField=charge&orderBy=desc`：刷新页面后脚本版本为 `7.03`，通过 `window.__AM_WXT_KEYWORD_API__.openWizard()` 打开向导。
- 真实页面回退验证：弹窗显示 `向导就绪`；Tab 为 `首页 / 矩阵页 / 日志页`；商品区为 `已添加商品`；计划区为 `计划配置`；表头含 `预算`；计划行展示 `关键词推广 / 趋势明星 / 智能出价` 标签和 `预算 100 元`；底部为 `3 个计划可提交 · 预算合计 300元`；主按钮为 `立即投放`；日志恢复 `[11:25:10] ...` 文本格式。
- 安全边界：未点击 `立即投放`、`提交 N 个计划`、`批量创建`、原生 `创建完成` 或任何真实提交入口。

## 结果复盘
- 根因：用户明确要求回退二次贴图改版，当前应保留更稳妥的上一版首页 UI，而不是继续贴近设计稿细节。
- 修复：用最小反向补丁撤销二次贴图的新增视觉与状态逻辑，保留上一版已经完成且验证过的首页重排、底部执行区和日志标题。
- 风险：真实页面只读验证未覆盖真实创建链路；这是符合回退安全边界的刻意限制。
- 回滚方式：如需再次应用二次贴图，可参考下方已归档的“关键词批量建计划向导首页二次贴图改版”记录重新引入对应改动。

---

# TODO - 2026-05-25 关键词批量建计划向导首页二次贴图改版

## 需求规格
- 目标：在上一版首页 UI 改版基础上继续贴近设计图，补齐顶部状态、摘要卡片、商品信息区、批量设置区、计划表格、结构化日志和底部提交区。
- 约束：
  - 本轮只做视觉 + 轻交互，不新增提交接口、不修改组包参数、不改矩阵生成、商品接口和既有业务动作；
  - 顶部不新增“商品”Tab，保留矩阵顶部入口，Tab 文案为 `计划 / 矩阵 / 日志`；
  - 首页批量设置输入只作为轻交互/视觉入口，不做直接批量写入，真正批量修改仍走现有批量编辑弹窗；
  - 真实页面验证只做布局和控件状态检查，不点击 `提交 N 个计划`、`立即投放`、`批量创建`、原生 `创建完成` 或任何真实提交入口。
- 成功标准：
  - Header 状态显示绿色 `已连接运行时`；
  - 摘要卡片有图标、弱标签和突出数字；
  - 商品区标题为 `商品信息`，已添加商品保持紧凑单行；
  - 计划区显示 `批量设置`、目标成本/预算轻量输入外观和现有批量编辑入口；
  - 表格列收敛为勾选、计划名称、类型、出价目标、预算（元）、操作；
  - 日志按时间、level、消息结构化展示；
  - 底部主按钮文案为 `提交 N 个计划`，摘要显示 `N 个计划可提交 · M 个缺少目标成本`。

## 执行计划（可核对）
- [x] 回顾当前首页 DOM、日志输出、计划行渲染和测试断言，确认最小改动点。
- [x] 调整首页 DOM 与辅助状态：Tab 文案、运行态、摘要卡片、商品区标题、批量设置行、底部文案和缺目标成本统计。
- [x] 调整计划行和日志渲染：列语义收敛、结构化日志行、保留既有事件绑定。
- [x] 调整首页 CSS：贴近设计图卡片、表格、输入、日志、底部 CTA 和窄屏回退。
- [x] 更新回归测试并同步构建产物。
- [x] 运行构建、语法、相关测试、`npm run review` 和真实页面只读验证。

## 高层操作摘要
- 已回顾 `tasks/lessons.md`，本轮继续遵守视觉稿确认只落地确认范围、真实页面验证前刷新运行态、只读验证不点击真实提交入口。
- 已确认当前工作区存在上一轮未提交改动，本轮将在现有改动基础上继续，不回退已有用户/代理修改。
- 已定位最小改动点：`appendWizardLog` 负责结构化日志行，`syncHomeSummary` 负责底部摘要和主按钮文案，计划行渲染可复用现有目标成本解析 helper。
- 已完成首页二次贴图结构：Tab 改为 `计划/矩阵/日志`，状态改为 `已连接运行时`，摘要卡片补图标，商品区补 `商品信息` 标题，计划区补只读批量设置外观。
- 已完成计划表格和日志重排：类型列只保留营销目标标签，出价目标列聚合目标与目标成本，日志行拆成时间、level、消息。
- 已更新首页结构、计划行、日志结构、提交按钮文案、批量设置外观和编辑页 Tab 文案相关回归测试。
- 已运行构建同步根 userscript、`dist/packages` 与 `dist/extension` 产物。
- 已在真实 `one.alimama.com` 页面刷新运行态后打开向导，只验证布局、菜单、搜索、全选和商品弹窗，未点击任何真实提交入口。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages` 与 `dist/extension`。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs tests/site-scene-submit-mode.test.mjs tests/keyword-item-picker-popup.test.mjs tests/keyword-edit-strategy-settings.test.mjs tests/keyword-strategy-target-cost-layout.test.mjs`：通过，33/33。
- `npm run build:check`：通过。
- `npm run check:syntax`：通过。
- `git diff --check`：通过。
- `npm run review`：通过，473 pass / 0 fail / 2 skipped。
- Chrome DevTools MCP 真实 `one.alimama.com/index.html#!/manage/search?orderField=charge&orderBy=desc`：刷新页面后 `window.__AM_GET_SCRIPT_VERSION__()` 为 `7.03`，`window.__AM_WXT_KEYWORD_API__.openWizard()` 可打开向导。
- 真实页面首页布局验证：Header 显示 `已连接运行时`；Tab 为 `计划 / 矩阵 / 日志`；三张摘要卡为 `已添加商品 1/30`、`已选计划 6`、`预算合计 600元` 且均有图标；商品区可见 `商品信息`；批量设置区可见只读目标成本 `0.60` 与预算 `100`；表格列包含 `计划名称 / 类型 / 出价目标 / 预算（元） / 操作`；主按钮为 `提交 6 个计划`；底部摘要为 `6 个计划可提交 · 6 个缺少目标成本`。
- 真实页面日志验证：`#am-wxt-keyword-quick-log` 继续复用原节点，日志行包含 `.am-wxt-log-time`、`.am-wxt-log-level`、`.am-wxt-log-message` 三段结构，当前 4 行。
- 真实页面轻交互验证：提交方式菜单可展开为 `并发数 2 / 单条`；搜索框可输入并清空；全选可取消并恢复；“添加商品”弹窗可打开，候选商品列表和已添加禁用态正常，关闭正常。
- 安全边界：未点击 `提交 6 个计划`、`立即投放`、`批量创建`、原生 `创建完成` 或任何真实提交入口。
- 目视截图：`/tmp/keyword-wizard-home-20260525.png`。

## 结果复盘
- 根因：上一版已完成整体重排，但与设计图相比仍缺少顶部绿色运行态、三卡摘要视觉、商品/批量设置分区标题、表格列语义、结构化日志和底部提交文案的细节对齐。
- 修复：在不改提交协议和业务行为的前提下，补齐首页视觉层级与轻交互外观；批量设置输入保持只读展示，真实修改仍走现有批量编辑弹窗；主按钮仅改文案并保留原 ID 与点击处理。
- 风险：真实页面验证为只读验收，未覆盖真实创建链路；页面控制台存在平台侧既有 promise/resource 噪声，但未阻断本次向导打开、布局和轻交互检查。
- 回滚方式：恢复 `wizard-mount-intro.js` 首页结构与日志输出、`strategy-state-and-draft.js` 计划行结构、`style.js` 首页样式覆盖，并重跑 `npm run build` 同步产物。

---

# TODO - 2026-05-25 关键词批量建计划向导首页 UI 改版

## 需求规格
- 目标：按预览图方向重构关键词批量建计划向导首页视觉层级，提升商品区、计划区、执行区和日志区的可扫描性。
- 约束：
  - 本轮只做首页视觉重排，不新增首页直接批量写入目标成本/预算功能；
  - 保留现有提交、复制、批量编辑、清空、搜索、全选、商品弹窗、编辑页、矩阵页和接口组包逻辑；
  - 真实页面验证只检查布局与控件状态，不点击 `立即投放`、`批量创建`、原生 `创建完成` 或任何真实提交入口。
- 成功标准：
  - Header 显示运行态状态，Tab 为轻量导航；
  - 首页显示 `已添加商品 / 已选计划 / 预算合计` 摘要；
  - 商品区紧凑展示已添加商品，计划区为表格化列表；
  - 底部执行条展示可提交摘要，并保留 `生成其他策略` 与 `立即投放 + 提交方式`；
  - 日志区有“执行日志”标题并弱化为次级信息；
  - 构建、相关测试和真实页面只读验证通过。

## 执行计划（可核对）
- [x] 回顾首页 DOM、策略列表渲染、商品列表渲染与现有样式覆盖关系。
- [x] 调整首页 DOM：Header 状态、轻量 Tab、摘要条、计划工具条、底部执行条、日志标题。
- [x] 调整首页 CSS：企业后台风格、表格化计划行、稳定控件尺寸、窄屏回退。
- [x] 更新首页结构和样式相关回归测试，并同步构建产物。
- [x] 运行构建、语法、相关测试和真实页面只读验证。

## 高层操作摘要
- 已回顾 `tasks/lessons.md`，本轮特别遵守真实页面验证前刷新运行态、布局验证看可见内容、不点击真实提交入口。
- 已在首页 Header 增加“向导就绪”状态标识，新增商品/计划/预算摘要条。
- 已将计划区改成表格化行结构，并把主执行按钮移动到底部执行条。
- 已为日志区增加“执行日志”标题，保留原 `appendWizardLog` 容器和输出链路。
- 已增加首页结构与网格样式回归断言。
- 已同步构建产物；`npm run review` 期间发现并修复并发日志关闭按钮共享 SVG 图标门禁问题，修复范围限定在图标渲染入口。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages` 与 `dist/extension`。
- `npm run build:check`：通过。
- `npm run check:syntax`：通过。
- `node --test tests/keyword-home-strategy-batch-actions.test.mjs tests/site-scene-submit-mode.test.mjs tests/keyword-item-picker-popup.test.mjs`：通过，26/26。
- `node --test tests/icon-system-regression.test.mjs tests/keyword-home-strategy-batch-actions.test.mjs tests/site-scene-submit-mode.test.mjs tests/keyword-item-picker-popup.test.mjs`：通过，32/32。
- `git diff --check`：通过。
- `npm run review`：通过，472 pass / 0 fail / 2 skipped。
- Chrome DevTools MCP 真实 `one.alimama.com/index.html#!/manage/search?orderField=charge&orderBy=desc`：刷新页面后脚本版本为 `7.03`，通过 `window.__AM_WXT_KEYWORD_API__.openWizard()` 打开向导。
- 真实页面首页布局验证：弹窗打开；摘要为 `已添加商品 1 / 30`、`已选计划 6`、`预算合计 600元`；已添加商品区高度 `72px`；计划列表 6 行且首行 grid 为表格化列；底部摘要为 `6 个计划可提交 · 预算合计 600元`；日志标题为“执行日志”。
- 真实页面交互只读验证：搜索、全选、提交方式下拉、添加商品弹窗均可打开且无明显布局错位；商品弹窗候选 40 条；关闭弹窗正常。
- 安全边界：未点击 `立即投放`、`批量创建` 或原生 `创建完成`；网络请求抽查未发现创建/提交/投放类请求。

## 结果复盘
- 根因：旧首页以纵向卡片堆叠为主，商品、计划、执行和日志缺少清晰层级，计划行信息密度与后台使用场景不匹配。
- 修复：在保持业务逻辑不变的前提下重排首页 DOM，新增摘要状态、表格化计划列表、底部固定执行区和弱化日志区；CSS 改为克制的企业后台风格并补窄屏回退。
- 额外修复：review 门禁暴露并发日志关闭按钮仍用窗口图标入口，已改为共享 `renderAmIcon('close')`，同步构建产物。
- 风险：本轮不改变提交参数、矩阵生成、编辑页字段映射或商品接口；真实页面只做只读验证，未覆盖真实创建链路。
- 回滚方式：恢复 `wizard-mount-intro.js` 首页结构、`strategy-state-and-draft.js` 计划行结构、`item-selection.js` 商品区高度与 `style.js` 首页样式覆盖，并重跑构建同步产物。

---

# TODO - 2026-05-25 商品主图与首页 Tab 精简

## 需求规格
- 目标：在关键词批量建计划向导的候选商品与已添加商品列表中展示商品主图，并删除顶部导航中“编辑页”tab。
- 约束：
  - 保留计划行“编辑计划”和“新建计划”进入编辑层的能力；
  - 不修改选品、排序、添加/移除、建计划、投放、复制、批量编辑、矩阵和接口组包逻辑；
  - 商品主图仅用于展示，缺图时使用稳定占位。
- 成功标准：
  - 顶部导航只显示“首页 / 矩阵页 / 日志页”；
  - 首页已添加商品和添加商品弹窗候选商品显示主图或占位；
  - “编辑计划”仍可打开单计划编辑层；
  - 相关测试、构建校验和真实页面验证通过。

## 执行计划（可核对）
- [x] 回顾当前商品渲染、顶部 tab 与编辑链路，确认最小改动范围。
- [x] 在商品渲染模块增加主图 URL 解析与缩略图渲染 helper，并接入候选/已添加列表。
- [x] 补充主图展示样式，确保标题与按钮不重叠。
- [x] 删除顶部“编辑页”tab，保留内部 editor 路由和计划行编辑入口。
- [x] 更新商品主图与顶部 tab 精简相关回归测试。
- [x] 运行语法、构建、测试与真实页面验证。

## 高层操作摘要
- 已确认商品归一化链路已有 `picUrl` 及多种 raw 图片字段兼容，本次只补展示层。
- 已确认顶部“编辑页”tab 是 `data-workbench-page="editor"` 按钮；计划行“编辑计划”走 `showStrategyDetail`，需要保留。
- 已在商品列表渲染中增加主图解析/缩略图 helper，候选商品与已添加商品共用同一展示结构。
- 已补充 44px 固定主图样式、标题两行截断与按钮防挤压布局。
- 已删除顶部“编辑页”tab，并保留隐藏 editor 面板与内部路由，供“编辑计划/新建计划”继续打开。
- 已更新商品主图与顶部 tab 精简回归断言。

## 验证记录
- `node --check src/optimizer/keyword-plan-api/wizard-scene-config/item-selection.js`：通过。
- `node --check src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`：通过。
- `node --check tests/keyword-item-picker-popup.test.mjs && node --check tests/keyword-edit-strategy-settings.test.mjs`：通过。
- `node --check src/optimizer/keyword-plan-api/wizard-mount-intro.js`：该文件为构建拼接片段，单独检查报 `Unexpected end of input`；已用整包语法检查覆盖实际产物。
- `npm run build`：通过，已同步根 userscript、`dist/packages` 与 `dist/extension`。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/keyword-item-picker-popup.test.mjs tests/keyword-edit-strategy-settings.test.mjs`：通过，12/12。
- `npm run build:check`：通过。
- `git diff --check`：通过。
- Chrome DevTools MCP 真实 `one.alimama.com/index.html#!/manage/search?orderField=charge&orderBy=desc`：刷新页面后 `window.__AM_GET_SCRIPT_VERSION__()` 为 `7.03`，打开向导未触发创建/投放/提交入口。
- 真实页面首页验证：顶部 tab 为 `首页 / 矩阵页 / 日志页`，`data-workbench-page="editor"` 不存在；已添加商品 1 个，主图 `44×44`，图片存在。
- 真实页面添加商品弹窗验证：点击“添加商品”只打开选品弹窗，候选商品 40 条，缩略图 40 个，图片 40 个，首个缩略图 `44×44`。
- 真实页面编辑入口验证：关闭选品弹窗后点击第一条“编辑计划”，详情编辑层打开，标题为当前计划名，可见输入框存在；未点击“立即投放”或“批量创建”。
- 控制台抽查：页面仍有平台/既有助手侧 `restoreSmartAssistantPatches` 与 `ERR_TUNNEL_CONNECTION_FAILED` 错误，未阻断本次商品主图、tab 精简和编辑入口验证。

## 结果复盘
- 根因：商品数据已归一化出图片字段，但候选/已添加商品渲染只展示标题与宝贝 ID；顶部“编辑页”tab 作为入口存在，但计划编辑实际已由“新建计划/编辑计划”统一打开。
- 修复：新增商品主图解析与缩略图 helper，候选商品和已添加商品共用展示结构；补充首页与商品弹窗两处样式作用域；删除顶部“编辑页”tab，保留内部 editor 路由。
- 风险：主图依赖接口返回图片字段；缺图时显示“宝”占位，不额外请求详情接口。
- 回滚方式：恢复 `wizard-mount-intro.js` 的 editor tab 按钮，移除 `item-selection.js` 中缩略图 helper/DOM 包裹，并移除对应样式与测试断言。

---

# TODO - 2026-05-25 矩阵页场景选择与营销目标增加行距

## 需求规格
- 目标：按截图反馈，将矩阵页顶部“场景选择”和“营销目标”两行上下间距调高，减少两组分段按钮贴得过近的问题。
- 约束：
  - 只调整矩阵页场景卡片的布局间距；
  - 不修改场景、营销目标选项、默认值、联动逻辑或请求组包；
  - 不影响编辑页其它动态表单行。
- 成功标准：
  - 矩阵页“场景选择”与“营销目标”之间存在更明显的垂直留白；
  - 两行标签与分段按钮仍保持对齐，移动端不出现文字/控件重叠；
  - 构建和相关矩阵 UI 回归测试通过，必要时完成真实页面目视验证。

## 执行计划（可核对）
- [x] 回顾 `tasks/lessons.md` 和现有矩阵页结构，确认本次只做 UI 间距微调。
- [x] 在 `src/optimizer/keyword-plan-api/wizard-style-and-state/style.js` 中限定修改 `.am-wxt-matrix-scene-card` 内部行距。
- [x] 补充/更新矩阵页样式回归断言，锁定该间距不会被后续覆盖。
- [x] 运行相关语法、构建和测试验证，并同步生成产物。
- [x] 进行浏览器目视验证，记录“场景选择/营销目标”间距结果。

## 高层操作摘要
- 已定位该 UI 位于矩阵页 `.am-wxt-matrix-scene-card`，当前两行 `.am-wxt-scene-setting-row` 在卡片内 `padding: 0`，导致上下过近。
- 本次计划采用卡片内部纵向 `row-gap`/相邻行间距处理，避免改通用动态表单行。
- 已将 `.am-wxt-matrix-scene-card` 改为纵向 flex，并设置 `gap: 14px`，只影响矩阵页顶部场景卡片。
- 已在 `tests/matrix-plan-config.test.mjs` 增加样式断言，防止后续把该行距覆盖回 0。

## 验证记录
- `node --check src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`：通过。
- `node --check tests/matrix-plan-config.test.mjs`：通过。
- `node --test tests/matrix-plan-config.test.mjs`：通过，24/24。
- `node scripts/build.mjs`：通过，已同步根 userscript、`dist/packages` 与 `dist/extension`。
- `node scripts/build.mjs --check`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `git diff --check`：通过。
- Chrome DevTools MCP 真实 `one.alimama.com/index.html#!/manage/search?orderField=charge&orderBy=desc`：刷新页面后通过 `window.__AM_WXT_KEYWORD_API__.openWizard()` 打开向导并切到矩阵页，未点击创建/投放/提交入口。
- 真实页面计算样式：`.am-wxt-matrix-scene-card` 为 `display:flex`、`flex-direction:column`、`gap:14px`，两行实际 `verticalGapPx=14`，`hasOverlap=false`。
- 目视截图：`tasks/matrix-scene-goal-spacing-2026-05-25.png`，确认“场景选择”和“营销目标”上下间隔更明显。

## 结果复盘
- 根因：矩阵页场景卡片内两行行容器 `padding: 0` 且卡片没有内部行距，分段按钮高度相邻后显得过贴。
- 修复：在矩阵页专属 `.am-wxt-matrix-scene-card` 上增加纵向 flex 和 `14px` 间距，不触碰通用动态表单行、场景/目标业务逻辑或组包。
- 风险：本次只改视觉间距；如浏览器仍加载旧运行态，需要刷新页面或重载脚本/扩展后才能看到新样式。

---

# TODO - 2026-05-24 修复立即投放提交方式菜单错位

## 需求规格
- 目标：修复关键词推广批量建计划弹窗中，“立即投放”旁边提交方式图标点击后下拉菜单错位的问题。
- 约束：
  - 不修改提交业务逻辑、接口参数、默认提交方式或真实投放链路；
  - 不改变“并发数 / 单条”的现有选项语义；
  - 仅做最小 UI 定位与必要的结构/样式修复。
- 成功标准：
  - 点击“立即投放”旁边图标后，提交方式菜单贴近该按钮组展开，不再跑到弹窗底部或其它区域；
  - 菜单层级不被日志区或弹窗内容遮挡；
  - 现有提交方式切换逻辑保持不变。

## 执行计划（可核对）
- [x] 回顾 `tasks/lessons.md` 与现有任务记录，确认本次只修 UI 错位。
- [x] 定位“立即投放 + 提交方式”渲染结构与样式定位规则。
- [x] 以最小改动修复下拉菜单锚点、层级或布局上下文。
- [x] 回填高层操作摘要、验证记录与结果复盘。
- [ ] 在获得允许后执行真实页面/关键测试验证并记录结果。

## 高层操作摘要
- 本次计划只处理提交方式图标点击后的菜单定位，不触发创建、提交或投放。
- 已确认错位根因是提交方式菜单使用 `position: fixed`，但菜单 DOM 位于弹窗内部，视口坐标与弹窗定位上下文混用后产生偏移。
- 已将菜单改为按钮组内 `absolute` 定位，并让打开时的内联定位固定为 `left: 0; top: calc(100% + 6px)`，避免继续依赖视口坐标。
- 用户复验反馈仍有错位，且图标不需要背景；二次修复改为打开时将菜单挂载到 `document.body`，恢复 `fixed` 视口坐标定位，并强制箭头按钮透明无阴影。
- 用户继续反馈鼠标 hover 时仍有错位；本轮移除箭头按钮的原生 `title`，避免浏览器 tooltip 自带错位，并补充 ID 级 hover/active/focus/伪元素背景覆盖。
- 用户补充期望：默认图标为白色，鼠标移上去只允许 1px 位移；已补充 transform 强覆盖，避免通用按钮 hover 覆盖垂直居中。

## 验证记录
- 源码修复已完成；真实页面验证需要在不点击实际提交的前提下，只点击提交方式图标并观察菜单位置。
- `node scripts/build.mjs`：2026-05-24 已执行通过，已同步根 userscript、`dist/packages` 与 `dist/extension` 产物。
- 未执行真实页面点击验证；如继续验证，应只点击提交方式图标，不点击“立即投放”按钮本体。
- 2026-05-25 用户复验反馈：菜单仍有错位，且提交方式图标不需要背景；已完成二次源码修复。
- `node scripts/build.mjs`：2026-05-25 已执行通过，已同步根 userscript、`dist/packages` 与 `dist/extension` 产物。
- 2026-05-25 用户复验反馈：鼠标 hover 时仍有错位；已完成 hover 态源码修复。
- `node scripts/build.mjs`：2026-05-25 hover 修复后已执行通过，已同步根 userscript、`dist/packages` 与 `dist/extension` 产物。
- 2026-05-25 用户补充：默认图标白色，hover 只移动 1px；已完成 CSS 源码修复。
- `node scripts/build.mjs`：2026-05-25 hover 位移修复后已执行通过，已同步根 userscript、`dist/packages` 与 `dist/extension` 产物。

## 结果复盘
- 根因：提交方式菜单作为弹窗内部 DOM 使用 `position: fixed`，同时 JS 写入视口坐标；在弹窗定位上下文内坐标解释偏移，导致菜单出现在弹窗底部。
- 修复：让菜单回到 `.am-wxt-run-mode-wrap` 内部绝对定位，打开时固定贴在按钮组下方展开，避免视口坐标与弹窗上下文混用。
- 二次修复：按钮组内绝对定位仍受弹窗内部布局影响，改为 body 级浮层，菜单定位与弹窗内容流解耦；图标按钮补充 `background/border/box-shadow` 强覆盖。
- 三次修复：hover 错位主要来自原生 `title` tooltip 与通用按钮伪元素/状态样式泄漏；移除小箭头 `title`，用 `aria-label` 保留可访问性，并禁用该按钮 hover/active/focus 的背景、边框、阴影和 `::after`。
- 四次修复：通用 `.am-wxt-btn:hover` 可能覆盖小箭头的 `transform`，导致从 `translateY(-50%)` 跳到通用位移；本次用 ID 级规则固定默认 `translateY(-50%)`，hover/active 仅为 `translateY(calc(-50% - 1px))`，并保持图标白色。
- 风险：本次不改提交逻辑；如当前浏览器仍加载旧 userscript，需要刷新页面或重载扩展/脚本后才能看到新样式。

---

# TODO - 2026-05-24 统一悬浮球与 Chrome 插件图标

## 需求规格
- 目标：将 Chrome 插件（谷歌插件）应用图标改为与当前悬浮球主品牌图标一致的形状与视觉风格。
- 约束：
  - 不改浮窗/面板交互、业务逻辑与用户配置；
  - 不改 `extension manifest` 名称、版本、权限；
  - 仅修改 `src/entries/extension-icons/icon.svg` 与生成的 PNG 源文件。
- 成功标准：
  - `src/entries/extension-icons/icon.svg` 使用悬浮球同款圆形底板与蓝色线性 logo；
  - 插件 SVG 中 logo 路径由 `src/shared/script-preamble.js` 的 `M13 3L5 13h6l-1 8 9-12h-6l1-6z` 等比换算而来，不再使用相似但不同源的旧闪电路径；
  - `icon-16.png`、`icon-32.png`、`icon-48.png`、`icon-128.png` 由 `icon.svg` 重新生成，替换并同步至 `dist/extension/`。

## 执行计划（可核对）
- [x] 在 `src/entries/extension-icons/icon.svg` 按 `src/shared/script-preamble.js` 的 `logo` 图形重绘应用图标。
- [x] 二次校准：将 SVG 从“相似填充闪电”改为悬浮球同款圆形底板 + 蓝色线性 logo，并严格按共享 logo 路径等比换算。
- [x] 用 `sharp` 重新生成 `icon-16/32/48/128.png`，确保尺寸与边界一致。
- [x] 运行 `node scripts/build.mjs` 让 `dist/extension` 同步更新。
- [x] 运行 `node scripts/build.mjs --check` 与关键语法校验。

## 高层操作摘要
- 本次只改应用图标源稿链路，不进入运行时逻辑；
- 通过统一图形源，保证 Chrome extension 图标视觉与悬浮球品牌标识一致；
- 二次校准后不再保留旧版圆角方形底板，Chrome 插件图标直接采用悬浮球视觉语言。

## 验证记录
- `node scripts/build.mjs`：2026-05-24 已执行，`dist/extension` 图标文件已同步。
- `node scripts/build.mjs --check`：2026-05-24 通过。
- `node --check \"阿里妈妈多合一助手.js\"`：通过。
- `node --check tests/icon-system-regression.test.mjs`：通过。
- `node --test tests/icon-system-regression.test.mjs`：2026-05-24 通过。
- 2026-05-24 二次校准后已重新执行 `node scripts/build.mjs`，完成根 userscript、packages 与 extension 产物同步。
- `sharp metadata`：`icon-16.png`、`icon-32.png`、`icon-48.png`、`icon-128.png` 分别为 16/32/48/128 正方形 PNG，均保留 alpha 通道。
- `node scripts/build.mjs --check`：2026-05-24 二次校准后通过。
- `node --check "阿里妈妈多合一助手.js"`：2026-05-24 二次校准后通过。
- `node --check tests/icon-system-regression.test.mjs`：2026-05-24 二次校准后通过。
- `node --test tests/icon-system-regression.test.mjs`：2026-05-24 二次校准后通过，6/6。
- `node --test tests/extension-static-build.test.mjs tests/build-output-sync.test.mjs`：2026-05-24 二次校准后通过，9/9。
- `git diff --check`：2026-05-24 二次校准后通过。
- 本地查看 `src/entries/extension-icons/icon-128.png`：图标为悬浮球同款白色圆形底板、浅蓝描边和蓝色线性 logo，未保留旧版底部基线或方形底板。

## 结果复盘
- 已完成应用图标从旧版底部基线样式改为与悬浮球 `logo` 一致的路径；二次校准后进一步改为悬浮球同款圆形底板与蓝色线性标识。
- 通过重建 PNG 与 `build --check`，Chrome 插件应用图标在 `dist/extension` 与 `src/entries/extension-icons` 两处同步。
- 风险：本次为静态视觉一致性变更，不影响运行时行为；Chrome 扩展页需要重载 unpacked extension 后才会显示新图标缓存。

---

# TODO - 2026-05-24 组建计划风格对齐人群看板

## 需求规格
- 目标：将 `组建计划` 弹窗（关键词批量建计划）主界面视觉风格统一到 `人群看板` 弹窗的玻璃拟态方向。
- 约束：
  - 不修改向导业务逻辑、接口签名和请求链路；
  - 不改 DOM 结构与交互入口（按钮动作、tab 切换、关闭逻辑）；
  - 不触发真实投放/创建流程。
- 成功标准：
  - 组建计划弹窗整体（遮罩、卡片、边框、阴影、圆角）与人群看板风格一致；
  - `头部 Tab`、`面板块`、`按钮`、`输入框`、`日志区`外观采用同系玻璃拟态视觉；
  - 交互类行为与现有功能不变。

## 执行计划（可核对）
- [x] 定位 `组建计划` 弹窗与 `人群看板` 样式差异。
- [x] 仅改 `src/optimizer/keyword-plan-api/wizard-style-and-state/style.js` 中样式层：
  - `#am-wxt-keyword-overlay`
  - `#am-wxt-keyword-modal`
  - `.am-wxt-header`
  - `.am-wxt-workbench-tabs`
  - `.am-wxt-panel/.am-wxt-config/.am-wxt-matrix-card`
  - `.am-wxt-btn/.am-wxt-input/.am-wxt-workbench-preview-log/.am-wxt-crowd-box/.am-wxt-log`
- [x] 在 `tasks/todo.md` 记录验证与复盘。
- [x] 进行至少一次本地代码级自检并记录结果。

## 高层操作摘要
- 计划仅覆盖样式层调整，避免动任何业务代码；
- 采用“覆盖式改写”保留现有类名，维持弹窗功能不变；
- 以 `人群看板` 的透明白卡、毛玻璃、软阴影、胶囊控件为主视觉参照。

## 验证记录
- 2026-05-24 已完成 `src/optimizer/keyword-plan-api/wizard-style-and-state/style.js` 的样式对齐补丁（覆盖 `#am-wxt-keyword-overlay`、`#am-wxt-keyword-modal`、头部 tab、面板、按钮、输入、日志区、run mode 等）。
- 2026-05-24 本地语法检查通过：
  - `node --check src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`
  - `node --check src/main-assistant/magic-report.js`
- 真实页面对比验收（one.alimama.com）仍待执行，当前结果待补。

## 结果复盘
- 当前完成样式层对齐补齐，未执行构建与浏览器回归；
- 当前补齐与本地语法自检已通过；
- 下一步请补充构建同步与真实页面对比验收，并依据结果继续微调（如仍有偏差再局部补丁）。

---

# TODO - 2026-05-24 统一窗口右上角关闭图标

## 需求规格
- 目标：统一插件内各窗口右上角关闭入口为同一套 SVG 关闭图标（`renderAmIcon('close')`），避免文字/符号混用。
- 约束：
  - 不改窗口关闭逻辑和已有交互行为；
  - 不改动除本任务范围外的图标资产、提交流程或业务校验。
- 成功标准：
  - `interceptor` 报表捕获弹窗关闭按钮改为统一关闭 SVG；
  - `手动关键词批量修改弹窗` 右上角关闭按钮改为统一关闭 SVG；
  - `添加商品弹窗` 关闭按钮改为统一关闭 SVG；
  - 其余窗口右上角关闭入口沿用现有行为，仅变更渲染图标。

## 执行计划（可核对）
- [x] 回顾 `tasks/lessons.md` 与本地图标规范，确认兼容约束。
- [x] 在源码中定位所有窗口右上角关闭按钮渲染点。
- [x] 将 `text/字符` 关闭入口替换为 `renderAmIcon('close')` 渲染，补充可访问性属性。
- [x] 统一补齐 item-picker 头部按钮 icon 尺寸样式（如无默认样式则补齐）。
- [ ] 运行构建同步与关键验证（语法、回归、真实窗口目视）并回填结果。

## 高层操作摘要
- 本次仅修改 3 个窗口关闭入口，实现统一 icon 风格和最小布局侵入；
- 关闭逻辑和事件绑定保持不变，仅替换 DOM 内容为 `renderAmIcon('close')`；
- 未改动提交链路、状态同步、拦截逻辑或弹窗生命周期管理。

## 验证记录
- 任务刚录入，源码改动待完成后补充验证结果。

---

# TODO - 2026-05-24 智能助手 SmartAssistant 预算破限支持

## 需求规格
- 目标：在 `myseller.taobao.com/home.htm` 的 `CRM-Workbench/SmartAssistant` 页面增加预算前端校验破限能力，默认不影响其他阿里妈妈页面行为。
- 约束：
  - SmartAssistant 页面只处理 `dailyBudgetAmount` 预算字段；
  - 当 `dailyBudgetAmount < 100` 时仅绕过该字段阈值相关的阻断/警告，保留其它校验逻辑；
  - 不放宽除该字段外的校验链路和提交参数；
  - 该页不得启动 `Interceptor / CampaignIdQuickEntry / PotentialPlanDailyExporter`，仅保留 UI 与预算破限补丁。
- 成功标准：
  - userscript 和 extension 内容注入匹配覆盖 `myseller.taobao.com/home.htm/CRM-Workbench/SmartAssistant*`；
  - `background` 允许 `myseller.taobao.com` 的授权消息来源；
  - 预算补丁在 SmartAssistant 提交链路中能去掉 `<100` 的前端阻断；
  - 非 SmartAssistant 页面仍保持现有 budget patch + 全量主助手初始化链路；
  - 构建产物、语法、测试、manifest 及关键页面验收通过。

## 执行计划（可核对）
- [x] 先在 `tasks/todo.md` 记录本任务需求、计划与验收边界（当前）；
- [x] 更新 `src/entries/userscript-meta.js`，补充 `myseller.taobao.com` 匹配；
- [x] 更新 `src/entries/extension-background.js`，放行 `myseller.taobao.com` sender；
- [x] 在 `src/main-assistant/main.js` 新增 SmartAssistant 页面检测：
  - SmartAssistant 页面只 init `UI` 与 `BudgetFrontendLimitBypass`；
  - 其余模块不 init，不跑 `Core.run / run` 周期。
- [x] 在 `src/main-assistant/budget-frontend-limit-bypass.js` 增加 SmartAssistant 专用绕过逻辑（仅 `dailyBudgetAmount`）；
- [x] 更新 `scripts/build.mjs` 的 extension manifest `matches`（`content_scripts` 与 `web_accessible_resources`）；
- [x] 新增/更新测试：
  - 新增 `tests/budget-frontend-limit-bypass.test.mjs`，覆盖 SmartAssistant 常量与补丁链路关键断言；
  - 更新 `tests/extension-static-build.test.mjs`，覆盖 myseller 注入与 manifest 白名单；
- [x] 运行 `node scripts/build.mjs` 并将 dist 产物回写；
- [x] 运行 `node scripts/build.mjs --check`、`node --check`、关键测试与 `node run review`；
- [x] 使用 `chrome-devtools` 在真实 `myseller.taobao.com/.../SmartAssistant` 页面做保存链路验收并回填结果。

## 高层操作摘要
- 按任务边界把 SmartAssistant 识别与主入口收敛到“只做预算破限”模式，避免该页复用核心算法护航/快速入口能力；
- 预算补丁分离为：原有 Magix 通用预算字段处理保留 + SmartAssistant 专用 `dailyBudgetAmount` 前端验证链路短路；
- 全量构建与测试由 build 脚本驱动，避免手改 dist。

## 验证记录
- `node scripts/build.mjs`：2026-05-24 已执行，完成根用户脚本与 extension 产物回写（`dist/packages` 与 `dist/extension` 均刷新）。
- `node scripts/build.mjs --check`、`node --check`、`node --test tests/budget-frontend-limit-bypass.test.mjs tests/extension-static-build.test.mjs tests/build-output-sync.test.mjs`：2026-05-24 全部通过。
- `npm run review`：2026-05-24 全量门禁通过（467/467），无语法/回归失败。
- `chrome-devtools`：2026-05-24 在已打开的真实页中，`one.alimama.com` 页面可识别到 `window.__AM_GET_SCRIPT_VERSION__()` 与脚本版本；但当前 `myseller.taobao.com/home.htm/CRM-Workbench/smartassistant` 会话未命中 userscript 注入（`hasScriptVersion=null`、未见浮窗/补丁全局），未触发保存链路验收；仅确认 URL 与目标页可达，未发生高风险写操作。

## 结果复盘
- SmartAssistant 预算破限链路已通过静态源 + 自动化回归验证：专用常量聚焦 `dailyBudgetAmount`，且仅在该字段上下文短路 `setError/getErrors/getState/validate` 与 DOM 错误清理；通用预算补丁与主入口初始化分流边界保持。
- 关键回退点为 `__AM_BUDGET_FRONTEND_UNLOCK__` 与 `restoreSmartAssistantPatches()/restoreAll()`：关闭总开关或重建页面时会清理补丁快照，回退到原生校验行为。

# TODO - 2026-05-24 运行态图标全量审计与残留修复

## 需求规格
- 目标：
  - 按站酷文章 `ICON设计干货来啦~` 的功能性图标方法，对插件运行态所有图标做二次全量审计和补齐；
  - 在既有 24×24 共享线性图标体系基础上，继续清理残留的私有字体字符、文本符号按钮、CSS 手绘图标和未接入共享入口的图标；
  - 保持应用图标、主面板、万能查数、算法护航、计划快捷入口、关键词向导/弹窗内控件的图标语言一致；
  - 通过构建同步根 userscript、packages 与 extension 产物，不手工改 `dist/` 或根 userscript。
- 边界：
  - 日志正文中的状态字符属于文本内容，不作为本轮交互图标资产处理；
  - 文档截图、mockup HTML、历史任务记录不作为运行态图标资产处理；
  - 仅做图标体系补齐，不顺手调整业务流程、布局密度或提交逻辑。
- 成功标准：
  - 运行态可交互图标不再依赖私有字体字符或裸文本符号表达；
  - 新增/调整的图标仍使用 24×24 画板、20×20 主绘制区、整数坐标、统一线宽/端点/圆角；
  - 自动化测试、构建同步检查、语法检查通过；
  - 能够用本地/真实浏览器验证关键图标渲染为非空且 `viewBox` 统一。

## 执行计划（可核对）
- [x] 回顾 `tasks/lessons.md`、既有图标设计规范和参考文章要点。
- [x] 写入本轮需求规格、边界、成功标准和验证计划。
- [x] 审计运行态源码中残留的私有字体字符、文本符号按钮、CSS 手绘图标和共享图标调用遗漏。
- [x] 补齐共享图标定义，替换残留图标实现，并保持最小代码侵入。
- [x] 更新或补充回归测试，防止重新引入私有字体、裸文本符号和非 24×24 图标。
- [x] 运行构建、相关测试、构建校验、语法检查和必要的视觉验证。
- [x] 回填验证记录和结果复盘。

## 高层操作摘要
- 参考文章抽取的设计约束继续沿用：功能表达清晰、结构简练、重心稳定、基于 24×24 画板和 20×20 主绘制区，坐标尽量像素对齐，同套图标统一线宽、端点和圆角。
- 既有实现已经建立 `renderAmIcon()` 与 extension 应用图标源稿，本轮重点检查是否仍有漏网的运行态图标没有统一。
- 审计发现漏网点集中在关键词向导与并发日志：私有字体搜索字符 ``、文本 `+`/`×`/`✕`、AI 点睛帮助/人群/需求的 `?`/`P`/`*`、CSS 伪元素箭头和 CSS 边框勾选。
- 已新增 `plus`、`multiply`、`user`、`sparkles`、`external-link` 共享图标，并把并发徽标、矩阵增删、AI 点睛、地域搜索、弹窗关闭、趋势主题勾选等运行态图标改为 `renderAmIcon()`。
- 已更新 `tests/icon-system-regression.test.mjs`，并同步调整矩阵、人群弹窗和智能出价目标包相关断言。

## 验证记录
- `node --check src/shared/script-preamble.js src/main-assistant/ui.js src/main-assistant/campaign-id-quick-entry.js src/optimizer/keyword-plan-api/wizard-mount-intro.js src/optimizer/keyword-plan-api/request-builder-preview.js src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-core.js src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-grid.js src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-advanced-popup.js src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-item-adzone-popup.js src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-crowd-popup.js src/optimizer/keyword-plan-api/wizard-scene-config/strategy-state-and-draft.js src/optimizer/keyword-plan-api/wizard-style-and-state/matrix-generic-editors.js src/optimizer/keyword-plan-api/wizard-style-and-state/matrix-bid-package.js`：通过。
- `node scripts/build.mjs`：通过，已同步根 userscript、`dist/packages` 与 extension page bundle。
- `node --test tests/icon-system-regression.test.mjs tests/matrix-plan-config.test.mjs tests/matrix-bid-target-cost-package.test.mjs tests/crowd-custom-native-parity-ui.test.mjs tests/campaign-concurrent-start-quick-entry.test.mjs`：通过，54/54。
- `node scripts/build.mjs --check`：通过。
- `node --check "阿里妈妈多合一助手.js" && git diff --check`：通过。
- 残留扫描脚本：通过，关键词向导与并发日志关键源码未再命中 ``、`&times;`、裸 `+`/`×`/`✕`、span 字符图标、CSS 文本伪箭头或 CSS 边框手绘勾。
- `npm run review`：通过，464 个测试中 462 pass、2 skip、0 fail；所有 automated review checks passed。
- Chrome DevTools MCP 真实 `one.alimama.com/index.html#!/main/index?bizCode=onebpSearch&promotionScene=promotion_scene_search_detent` 页面：reload 后 `window.__AM_GET_SCRIPT_VERSION__()` 返回 `7.03`，`window.__AM_RENDER_ICON__` 存在，`#am-helper-icon svg` 为 `viewBox="0 0 24 24"`，授权锁定遮罩不存在。
- 真实页面主面板验证：打开主面板后，品牌、关闭、算法护航、组建计划、万能查数、辅助显示、运行日志图标均为 `0 0 24 24` 的 `am-ui-icon`。
- 真实页面批量建计划弹窗验证：打开 `组建计划` 后，关闭、复制倍数、并发倍数、矩阵新增等检查目标均为共享 SVG，目标元素 `textContent` 为空且 `svgCount=1`；矩阵新增按钮为 `am-ui-icon-plus`。
- 真实页面安全检查：本轮只打开插件面板和向导弹窗，未点击创建、提交、投放或算法护航执行入口；截图留存 `tasks/icon-redesign-2026-05-24-verification.png`。

## 结果复盘
- 根因：既有图标体系已经覆盖主入口和扩展应用图标，但“全量”验收遗漏了关键词向导内的局部控件与 CSS 伪元素；这些位置仍会把私有字体和裸字符当作图标使用。
- 解决：把剩余运行态图标收敛到共享 SVG，关闭按钮通过 `closeIcon` 语义渲染，计数徽标使用 `multiply`，新增/删除使用 `plus`/`close`，AI 点睛使用 `help`/`user`/`sparkles`/`external-link`，地域搜索和展开收起使用共享搜索与 chevron 图标。
- 风险：原生页面自身仍大量使用私有字体字符，本轮只处理插件注入的运行态 UI；日志正文里的状态 emoji 属于文本日志，未作为交互图标改写。
- 后续：已在 `tasks/lessons.md` 追加 L67，后续图标任务必须扫描局部控件、CSS `content` 和手绘勾选，不能只看主入口图标。

---

# TODO - 2026-05-22 插件图标体系重设计

## 需求规格
- 目标：
  - 参考站酷文章 `ICON设计干货来啦~` 的功能性图标方法，重设计插件运行态使用的图标；
  - 图标统一采用 24×24 画板、20×20 主绘制区、整数坐标、统一线宽/端点/圆角和简练高辨识结构；
  - 覆盖扩展图标、主面板/工具按钮、计划 ID 快捷入口、万能查数弹窗控制与快捷话术图标、算法护航标题/控制按钮、关键词向导下拉箭头；
  - 不手工修改根 userscript 与 `dist/` 构建产物，最终通过构建同步。
- 边界：
  - 文档截图、mockup HTML、日志文案中的状态 emoji 暂不作为本轮图标资产重绘范围；
  - 当前工作区已有未归属修改 `src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`，本轮只在同文件内做图标相关增量，不能覆盖既有改动。
- 成功标准：
  - 运行态图标统一为同一套线性 SVG 语言或同源应用图标；
  - Chrome extension `icon-16/32/48/128.png` 与 `icon.svg` 同步更新；
  - 自动化测试、构建同步检查和语法检查通过；
  - 若能连接真实页面，完成 `one.alimama.com` 上的主面板/万能查数/算法护航/快捷入口视觉验证并记录。

## 执行计划（可核对）
- [x] 回顾项目教训、参考文章要点和当前图标分布。
- [x] 写入需求规格、范围边界、成功标准和验证计划。
- [x] 设计统一图标规范与共享 SVG 渲染入口，替换运行态内联大路径/emoji 图标。
- [x] 更新扩展应用图标 SVG，并生成 16/32/48/128 PNG。
- [x] 更新或补充回归测试，覆盖关键图标资产不退回旧 1024 填充路径/emoji 图标。
- [x] 重新构建同步 userscript 与 extension 产物。
- [x] 运行相关测试、构建校验和语法检查。
- [x] 尽量使用真实浏览器验证运行态可见图标，并回填验证记录。
- [x] 做交叉自检并补充结果复盘。

## 高层操作摘要
- 参考文章抽取的本轮设计约束：功能性图标强调功能表达、工整有序、结构简练；基于 24×24 画板，以 20×20 为主体绘制区；坐标尽量整数对齐；同套线性图标统一线宽、端点、拐角和视觉重心。
- 初步盘点确认运行态图标主要分布在 `src/entries/extension-icons/`、`src/main-assistant/ui.js`、`src/main-assistant/campaign-id-quick-entry.js`、`src/main-assistant/magic-report.js`、`src/optimizer/ui.js` 和 `src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`。
- 本轮优先建立共享 SVG 图标渲染入口，减少多处复制 1024 iconfont 路径导致的风格漂移。
- 已在 `src/shared/script-preamble.js` 增加共享 24×24 线性图标定义与 `renderAmIcon()`，统一主面板、万能查数、计划快捷入口、算法护航和关键词向导局部图标调用。
- 已重绘扩展应用图标：`icon.svg` 改为 128 画板的圆角蓝底白色闪电符号，并用 `sharp` 生成 `icon-16/32/48/128.png`。
- 已把主面板、下载捕获、万能查数快捷话术、刷新/关闭/默认星标、算法护航标题/控制/结果态、计划 ID 快捷入口、矩阵下拉箭头、AI 点睛勾选/地域勾选等运行态图标替换为同套线性 SVG 或同源 CSS 图形；日志文案中的状态符号保留为文本日志，不纳入图标资产。
- 根据用户补充要求，已将图标体系沉淀为 `docs/图标设计规范.md`，覆盖画板、线宽、尺寸、颜色、实现入口、禁止项、新增流程和验收清单。
- 已在 `tasks/lessons.md` 追加 L66，要求后续设计体系类改动必须同步沉淀规范文档。

## 验证记录
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --test tests/icon-system-regression.test.mjs tests/logger-api.test.mjs tests/magic-report-crowd-matrix.test.mjs tests/campaign-concurrent-start-quick-entry.test.mjs tests/optimizer-escort-new-flow-fallback.test.mjs tests/extension-static-build.test.mjs`：通过，117/117。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- `git diff --check`：通过。
- `node --check src/shared/script-preamble.js src/main-assistant/ui.js src/main-assistant/interceptor.js src/main-assistant/magic-report.js src/main-assistant/campaign-id-quick-entry.js src/optimizer/ui.js`：通过。
- `node` + `sharp` 图标尺寸校验：`src/entries/extension-icons` 与 `dist/extension` 中 `icon-16/32/48/128.png` 均为对应尺寸。
- `rg -n "viewBox=\"0 0 1024 1024\"" src/main-assistant src/optimizer src/shared`：无命中，运行态关键源码不再使用旧 1024 iconfont 大路径。
- `npm run review`：通过，462 个测试中 460 pass、2 skip、0 fail；所有 automated review checks passed。
- `git diff --check docs/图标设计规范.md tasks/lessons.md tasks/todo.md`：通过。
- Chrome DevTools MCP 真实 `one.alimama.com/index.html#!/main/index?bizCode=onebpSearch&promotionScene=promotion_scene_search_detent` 页面：reload 后 `window.__AM_GET_SCRIPT_VERSION__()` 返回 `7.03`，`window.__AM_RENDER_ICON__` 存在，`#am-helper-icon` 使用 `viewBox="0 0 24 24"` 的 `am-ui-icon-logo`。
- 真实页面主面板验证：打开主面板，四个工具按钮分别使用 `am-ui-icon-shield-check`、`am-ui-icon-plan`、`am-ui-icon-chart`、`am-ui-icon-eye`，日志标题图标为 `0 0 24 24`。
- 真实页面万能查数验证：打开万能查数弹窗，7 个快捷话术按钮均有 `0 0 24 24` 图标，刷新、关闭、默认星标也是 `0 0 24 24`；截图留存 `tasks/icon-redesign-verification.png`。
- 真实页面算法护航验证：仅打开面板未点击“立即扫描并优化”，标题、居中、最大化、关闭按钮均为 `0 0 24 24` 图标。
- 真实页面安全检查：本轮浏览器验证未点击创建、提交、投放或“立即扫描并优化”入口；当前页面未识别到计划列表快捷入口，因此 `quickEntryCount=0`，快捷入口由 DOM/自动化测试覆盖。

## 结果复盘
- 本轮根因是运行态图标来自多套来源：扩展 PNG、1024 iconfont 内联 SVG、emoji/字符图标、CSS data URI 混用，导致尺寸、线宽和视觉重心不一致。
- 解决方案是建立共享 `renderAmIcon()` 与 24×24 图标集，把可交互图标统一为线性 SVG；扩展应用图标单独作为品牌图标源稿生成 PNG，避免 UI 图标和应用图标互相牵制。
- 为保持最小侵入，日志文本里的状态符号没有批量重写为 SVG；它们属于日志内容而非可交互图标资产。若后续要完全去 emoji 化，应单独做日志文案规范化，避免影响用户排错习惯。
- 原有未归属改动 `src/optimizer/keyword-plan-api/wizard-style-and-state/style.js` 的 `grid-template-columns` 未被覆盖；本轮仅在同文件追加图标相关增量。
- 用户补充要求将本次设计沉淀成规范，已更新 `docs/图标设计规范.md` 和 `tasks/lessons.md`；后续新增/修改图标应按该规范执行。

---

# TODO - 2026-05-19 关键词自定义推广 3/4/5 UI 对齐

## 需求规格
- 目标：
  - 对齐 `关键词推广 -> 自定义推广` 中三处低风险 UI 差异：成本项文案、AI 点睛开启态创意说明、预算类型顺序；
  - 不修改 `AI点睛` 开关逻辑、手动关键词/人群显隐、最终提交字段和成本校验语义；
  - 同步测试、构建产物和真实页面验证记录。
- 成功标准：
  - `AI点睛=开启 + 出价目标=获取成交量` 时，可见成本项标题为 `设置平均直接净成交成本（非必要）`，且不额外显示 `目标成本` 小标签；
  - `AI点睛=开启` 时展示只读 `创意设置` 说明：`当前解决方案下暂不支持设置创意，默认开启智能创意。`，但不生成可提交 `创意设置` 字段；
  - 关键词预算类型展示顺序为 `日均预算` 在前、`每日预算` 在后，底层 value 和默认值不变。

## 执行计划（可核对）
- [x] 回顾相关历史教训、现有自定义推广实现和测试断言。
- [x] 在任务文档记录需求、边界、成功标准和验证计划。
- [x] 修改场景配置渲染：成本项可见文案、只读创意说明、预算类型顺序。
- [x] 更新自定义推广 UI 同构测试和预算顺序断言。
- [x] 重新构建生成 userscript 与 extension 产物。
- [x] 运行相关测试、构建校验和语法检查。
- [x] 在真实 `one.alimama.com` 页面验证插件向导自定义推广可见 UI。
- [x] 回填验证记录和结果复盘。

## 高层操作摘要
- 本轮只做 UI 同构修正，不改变请求组包、字段白名单、`AI点睛` 状态机或成本数值校验。
- 已调整关键词预算类型 select 顺序为 `日均预算`、`每日预算`，保留底层 value `day_average` / `day_budget` 和默认值语义。
- 已给 `buildInlineSceneInputControl()` 增加 `hideLabel` 选项，仅用于 AI 点睛开启态成本输入隐藏可见小标签，不影响输入字段、单位、placeholder 和校验。
- 已在 `AI点睛=开启 + 出价目标=获取成交量` 的成本行使用可见标题 `设置平均直接净成交成本（非必要）`；内部字段仍沿用 `设置平均成交成本` / `平均成交成本`。
- 已在 AI 点睛开启态追加只读 `创意设置` 说明行，不渲染分段按钮，也不写 `data-scene-field="创意设置"`。
- 已更新 `tests/keyword-custom-native-parity-ui.test.mjs`，覆盖成本标题、只读创意说明、禁止可提交创意字段和预算顺序。

## 验证记录
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --test tests/keyword-custom-native-parity-ui.test.mjs tests/keyword-custom-settings-sync.test.mjs tests/keyword-custom-preview-submit-parity.test.mjs`：通过，31/31。
- `node scripts/build.mjs --check`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- 真实 `one.alimama.com` 页面验证：标准 `chrome-devtools` MCP 9222 端口当前返回 HTTP Not Found，本轮改用项目测试专用 profile 的 9333 DevTools Protocol 直连；已 reload 扩展 `fejbonphnhfgfomjjchjijfeippmhnfd` 并硬刷新页面，`window.__AM_GET_SCRIPT_VERSION__()` 返回 `7.03`。
- 真实页面插件向导验证：打开 `关键词推广 -> 自定义推广`，确认存在 `设置平均直接净成交成本（非必要）`，成本输入未额外显示 `目标成本` 小标签，存在只读文案 `当前解决方案下暂不支持设置创意，默认开启智能创意。`，预算类型顺序为 `日均预算`、`每日预算`，页面中没有 `data-scene-field="创意设置"`。
- 真实页面安全检查：验证期间未点击插件提交入口；页面 performance entries 中未出现 `/solution/addList.json` 请求。

## 结果复盘
- 第 3 点属于纯 UI 文案对齐：只改可见标题和隐藏局部小标签，保留原字段键，避免影响 `singleCostV2`、`subOptimizeTarget` 等提交映射。
- 第 4 点按只读说明实现，满足原生可见信息对齐，同时避免恢复可操作 `创意设置` 配置导致提交语义漂移。
- 第 5 点只改预算类型展示顺序，默认值与组包逻辑不变。
- 本轮没有收到新的用户修正，不更新 `tasks/lessons.md`。

---

# TODO - 2026-05-18 修复扩展授权续租误锁

## 需求规格
- 目标：
  - 修复扩展页授权内存态卡在 `lease_renew/request_failed` 后，算法护航入口误报“授权已失效”的问题；
  - 扩展续租遇到 `Failed to fetch` 等瞬时失败时不锁页、不清有效缓存；
  - 算法护航同步门禁遇到可恢复态时优先从有效缓存恢复，或进入授权校验中状态并触发按需复验；
  - 不改授权服务、授权名单、TTL、签名、`policyToken` 验签和 shopId 校验。
- 成功标准：
  - `lease_renew` / `lease_renew_retry` 在 extension 模式下使用静默瞬时失败策略；
  - `requireAuthorizedSync()` 可从有效本地租约缓存恢复授权并放行；
  - `request_failed`、`request_http_error`、`response_parse_error`、`invalid_response` 不再走 `lease_expired` 锁定分支；
  - 构建产物同步，自动化验证和真实 `one.alimama.com` 页面验证通过。

## 执行计划（可核对）
- [x] 回顾历史教训、当前授权状态机和真实页面复现状态。
- [x] 在任务文档记录需求、边界、成功标准和验证计划。
- [x] 修改 `src/entries/extension-license-guard.js` 的续租与同步门禁恢复逻辑。
- [x] 更新 `tests/extension-license-cache-policy-token.test.mjs` 覆盖本次状态机契约。
- [x] 重新构建生成 userscript 与 extension 产物。
- [x] 运行语法、相关测试、构建校验和 review 门禁。
- [x] 使用 `chrome-devtools` MCP 在真实页面复验并记录结果。

## 高层操作摘要
- 真实页面已观察到 `LicenseGuard.getState()` 停在 `authorized=false`、`reason=request_failed`、`source=lease_renew`，但本地缓存仍有有效租约；触发 `am-helper:license-check` 后可恢复为 `authorized=true` 并移除遮罩。
- 本轮修复聚焦客户端授权状态机：续租瞬时失败保持可恢复，入口同步门禁先恢复缓存或触发复验，不把可恢复态降级为“授权已失效”。
- 已修改 `src/entries/extension-license-guard.js`：extension 续租与续租重试传入 `silentTransientFailure`；`requireAuthorizedSync()` 在 extension 模式先尝试有效缓存恢复，再把等待态/瞬时失败态转为 `license_checking` 并触发按需校验；进入等待态时会移除历史误锁遮罩。
- 已更新 `tests/extension-license-cache-policy-token.test.mjs`，覆盖静默续租、同步门禁缓存恢复、瞬时失败可恢复态和历史遮罩清理。

## 验证记录
- `node --check src/entries/extension-license-guard.js src/optimizer/public-api.js`：通过。
- `node --test tests/extension-license-cache-policy-token.test.mjs tests/optimizer-entry-error-handling.test.mjs tests/extension-license-shopid-guard.test.mjs`：通过，11/11。
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node scripts/build.mjs --check`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `bash scripts/review-team.sh`：通过，457 个测试中 455 pass、2 skip、0 fail；所有 automated review checks passed。
- Chrome DevTools MCP 真实 `one.alimama.com/index.html` 页面：reload 后 `LicenseGuard.getState()` 为 `authorized=true`，`shopId=<SHOP_ID>`，`shopName=<SHOP_NAME>`，`runtimeMode=extension`，`#am-license-lock-overlay` 不存在，本地缓存包含有效 `leaseToken` 与 `policyToken`。
- Chrome DevTools MCP 构造复现场景：保存有效 `__AM_LICENSE_CACHE_V1__`，调用 `LicenseGuard.lock('request_failed', '授权请求失败: Failed to fetch', 'lease_renew')` 后恢复缓存，再调用 `window.__ALIMAMA_OPTIMIZER_TOGGLE__()`；返回 `true`，状态恢复为 `authorized=true`、`source=optimizer_toggle+cache_recover`，误锁遮罩被移除，未再报“授权已失效”。
- Chrome DevTools MCP 控制台：复验后仅观察到站点外部资源 `net::ERR_TUNNEL_CONNECTION_FAILED` 和站点组件依赖警告，未出现本次授权链路的 `[EscortAPI] 授权未通过...授权已失效` 新记录。

## 结果复盘
- 根因是扩展续租瞬时失败会把内存态写成 `request_failed`，而算法护航同步门禁只把少数等待态视为可恢复，导致有有效本地租约时仍被降级为 `lease_expired`。
- 修复后 extension 续租失败保持静默可恢复；同步门禁先从有效缓存恢复并放行，若没有可用缓存但属于瞬时失败，则进入 `license_checking` 并触发按需校验，不再误写“授权已失效”。
- 明确未授权、吊销、店铺授权过期等非瞬时失败仍走锁定分支；本轮未修改授权服务、授权名单、TTL、签名、`policyToken` 验签或 shopId 校验。
- 已在 `tasks/lessons.md` 追加 L62，沉淀“扩展续租瞬时失败不能降级为授权过期”的状态机规则。

---

# TODO - 2026-05-18 生成项目级 AGENTS.md

## 需求规格
- 目标：
  - 生成一份面向 Codex/Claude 等代码代理可执行的项目级 `AGENTS.md`；
  - 合并项目现有仓库规范、任务管理规则、验证要求与真实浏览器验收约束；
  - 明确 `src/` 为源码事实来源，根目录 userscript 与 `dist/` 为构建产物；
  - 不触碰业务源码、不运行会改写构建产物的命令。
- 成功标准：
  - `AGENTS.md` 能覆盖工作流程、项目结构、构建测试、代码风格、关键路径测试、浏览器验证、提交/发布和上下文压缩规则；
  - 文档内容与 `README.md`、`package.json`、`scripts/build.mjs` 的项目现状一致；
  - 本轮仅修改文档和任务记录，避免影响已有未归属改动。

## 执行计划（可核对）
- [x] 检查当前 `AGENTS.md`、`README.md`、`package.json`、源码目录和现有任务/教训记录。
- [x] 确认计划范围：只更新项目级 `AGENTS.md` 与 `tasks/todo.md`，不改业务源码和构建产物。
- [x] 重写 `AGENTS.md`，补齐 agent 工作规范与项目技术约束。
- [x] 校验 `AGENTS.md` 内容可读、无明显过时命令、无误导性路径。
- [x] 回填验证记录和结果复盘。

## 高层操作摘要
- 当前仓库已有 `AGENTS.md`，但偏仓库结构指南，缺少规划优先、教训沉淀、真实验证和 Claude 复审等执行要求。
- 本轮采用根目录单文件 `AGENTS.md`，不生成分层子目录 `AGENTS.md`，避免超出用户“这个项目的 agent.md”范围。
- 当前工作区已有多项未提交改动；本轮会保持最小侵入，只更新文档。
- 已将 `AGENTS.md` 重写为项目级 agent 工作规范，覆盖核心原则、任务规划、子代理/上下文、项目结构、构建测试、开发流程、代码风格、关键路径测试、真实浏览器验证、构建发布、安全边界和复审清单。

## 验证记录
- 人工对照 `README.md`、`package.json`、`scripts/build.mjs` 和 `docs/源码结构速查.md`：`AGENTS.md` 中命令、端口、源码事实来源和构建产物说明一致。
- `git diff --check -- AGENTS.md tasks/todo.md`：通过，无 whitespace error。
- `rg -n "8173|KNOWLEDGE|CLAUDE|TODO|待回填" AGENTS.md`：仅命中“开放 TODO”上下文压缩说明，未发现旧端口或过时文档引用。
- `node -e "... required sections ..."`：通过，确认 `AGENTS.md` 必要章节齐全。

## 结果复盘
- 本轮是文档生成任务，未修改业务源码，未运行会改写 userscript 或 `dist/` 的构建命令。
- 现有 `AGENTS.md` 的仓库指南已扩展为可执行 agent 规范，并保留项目最关键的源码事实来源、测试和真实页面验收要求。
- 没有收到用户修正，本轮不新增 `tasks/lessons.md`。

---

# TODO - 2026-05-18 修复扩展授权请求 Failed to fetch

## 需求规格
- 目标：
  - 修复 Chrome 扩展运行态下店铺已授权但仍弹出“授权请求失败: Failed to fetch”的误锁问题；
  - 将 extension 授权网络请求迁移到 MV3 background service worker，规避页面主世界跨域/CSP 限制；
  - 保留页面侧现有 shopId 识别、签名校验、policy token 验签与缓存续租逻辑，不降低授权安全性；
  - 同步更新构建产物与静态回归测试，并用 `chrome-devtools` MCP 在真实阿里妈妈页面完成浏览器验收。
- 成功标准：
  - `src/entries/extension-background.js` 新增固定授权 verify 桥，仅接受阿里妈妈页面来源请求；
  - `src/entries/extension-content.js` 只桥接授权校验消息，能把 page world 请求转发到 background 再回传结果；
  - `src/entries/extension-license-guard.js` 在 extension runtime 优先走桥接请求，失败时沿用瞬时失败静默策略；
  - extension manifest 生成 `background.service_worker` 与授权服务 `host_permissions`，并输出 `dist/extension/background.js`；
  - 自动化校验和 `chrome-devtools` MCP 真实页面复验通过，`#am-license-lock-overlay` 不再因 `Failed to fetch` 误弹。

## 执行计划（可核对）
- [x] 回顾当前工作树与既有授权实现，确认只做增量修改，不回退已有改动。
- [x] 在任务文档记录需求、检查项与验证计划。
- [x] 新增 background 授权桥，并更新 content script/page guard 接线。
- [x] 更新构建脚本与 manifest，产出 background.js 与 host permissions。
- [x] 补充/更新静态回归测试，覆盖 manifest、background、content bridge 与 guard 走桥逻辑。
- [x] 重新构建并运行语法、构建、测试校验。
- [x] 使用 `chrome-devtools` MCP 在真实页面复验，并回填结果复盘。

## 高层操作摘要
- 本轮按扩展运行态根因修复，不改 license server，也不放松客户端签名与 token 校验。
- 当前工作区已有多项未提交改动；本轮仅触碰授权桥、构建、对应测试与任务文档。
- 新增 `src/entries/extension-background.js` 作为唯一授权 verify 网络出口；page world 只发桥接消息，background 固定请求授权服务并校验 `sender.url` 只能来自 `alimama.com` / `*.alimama.com`。
- `src/entries/extension-content.js` 增加窄桥，只转发 `am-helper-pro:license-verify` / `verify-request` 到 `chrome.runtime.sendMessage`，再把 background 响应按 `verify-response` 回传页面。
- `src/entries/extension-license-guard.js` 在 extension runtime 改为优先走 background 桥，同时保留 `verifyLeasePayloadShape`、`verifySignature`、`verifyPolicyToken` 顺序；桥超时和 background 失败继续归类为 `request_failed`，复用既有瞬时失败静默策略。
- `scripts/build.mjs` 与 extension manifest 已同步产出 `dist/extension/background.js`、`background.service_worker` 和授权服务 `host_permissions`；静态测试补齐 manifest、background、content bridge 和 guard 桥接断言。

## 验证记录
- `node --check src/entries/extension-background.js src/entries/extension-content.js src/entries/extension-license-guard.js scripts/build.mjs`：通过。
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物，并生成 `dist/extension/background.js`。
- `node scripts/build.mjs --check`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/extension-static-build.test.mjs tests/extension-license-cache-policy-token.test.mjs tests/extension-license-shopid-guard.test.mjs`：通过，14/14。
- `node --test tests/*.test.mjs`：通过，457 个测试中 455 pass、2 skip、0 fail。
- `bash scripts/review-team.sh`：通过，所有 automated review checks passed。
- Chrome DevTools MCP：在 `chrome://extensions/` 页面确认扩展 `阿里妈妈多合一助手 (Pro版)` `v7.03` 已 reload，扩展 ID 为 `fejbonphnhfgfomjjchjijfeippmhnfd`。
- Chrome DevTools MCP 真实 `one.alimama.com#!/manage/search` 页面：reload 后首屏 `#am-license-lock-overlay` 不存在；此时授权态停留在 `license_unverified` / `runtimeMode=extension`，证明首装或刷新场景已不再因为网络瞬时问题直接全屏误锁。
- Chrome DevTools MCP 真实 `one.alimama.com#!/manage/search` 页面：派发 `window.dispatchEvent(new CustomEvent('am-helper:license-check'))` 后约 `502ms` 内 `LicenseGuard.getState()` 变为 `authorized: true`，`shopId: "<SHOP_ID>"`，`shopName: "<SHOP_NAME>"`，且遮罩仍不存在。
- Chrome DevTools MCP 二次派发 `am-helper:license-check`：授权态保持 `authorized: true`，`#am-license-lock-overlay` 仍不存在，未复现“授权请求失败: Failed to fetch”弹层。
- Chrome DevTools MCP 控制台：未再观察到本次授权链路触发的 `Failed to fetch` 锁定提示；页面中仍有站点自身 `net::ERR_TUNNEL_CONNECTION_FAILED` 等既有噪声，与本次授权修复无关。

## 结果复盘
- 根因是 extension 模式下授权请求从 page world 直接 `fetch` 远端服务，受页面 CSP/跨域环境影响会把已授权店铺误判成请求失败；正确分层是让 MV3 background 作为跨域请求出口，页面只保留 shopId 解析和签名/token 验签。
- 当前行为分成两段：刷新首屏时不再因为一次瞬时网络失败直接锁死页面；一旦用户触发插件授权校验事件，请求会经由 content -> background -> license server -> page 的窄桥完成，随后内存授权态进入 `authorized`。
- 本轮没有放松客户端安全约束；background 固定 verify endpoint，不接受页面传入任意 URL，guard 仍要求签名验签和 `policyToken` 验签全部通过。
- 真实页面已证明用户截图中的误锁弹层不再出现，并且同店铺 `<SHOP_ID>` 在触发校验后能稳定恢复为已授权状态。
- 未收到新的用户修正，本轮不更新 `tasks/lessons.md`。

---

# TODO - 2026-05-15 Chrome 扩展版本号规范化提示

## 需求规格
- 目标：
  - 解释 Chrome 扩展页提示 `The extension version is parsed as '7.3'.` 的原因；
  - 修复生成的 extension manifest，避免 `7.03` 这类带前导零的版本组件触发 Chrome 规范化提示；
  - 保留项目现有 `v7.03` 展示口径，不打乱 userscript、README 与发布记录。
- 成功标准：
  - `dist/extension/manifest.json` 的 `version` 输出为 Chrome 规范版本；
  - manifest 通过 `version_name` 保留原展示版本；
  - 构建测试覆盖版本规范化逻辑；
  - 相关构建、语法和测试校验通过。

## 执行计划（可核对）
- [x] 回顾历史教训与当前工作树，确认不回退已有改动。
- [x] 定位 manifest 版本来源与 Chrome 提示原因。
- [x] 修改构建脚本，在 extension manifest 中区分规范更新版本与展示版本。
- [x] 补充回归测试，防止后续再次输出带前导零的 manifest `version`。
- [x] 重新构建生成产物并运行验证。
- [x] 回填验证记录和结果复盘。

## 高层操作摘要
- Chrome 官方 manifest 版本规则要求每段是 0 到 65535 的整数，非零整数不能以 `0` 开头；因此 `7.03` 会被 Chrome 按数字解析为 `7.3` 并在扩展页提示。
- 当前仓库的 extension manifest 由 `scripts/build.mjs` 从 userscript 头部 `@version 7.03` 直接生成，本轮需要在构建层处理，而不是手改 `dist/extension/manifest.json`。
- 已在构建脚本新增 `normalizeExtensionManifestVersion()`，让 extension manifest 的 `version` 输出为 `7.3`，同时通过 `version_name` 保留 `7.03` 展示口径。
- 已同步 `dist/extension/manifest.json`，并补充 `tests/extension-static-build.test.mjs` 防止后续再次直接输出带前导零的 manifest 版本。

## 验证记录
- `node --check scripts/build.mjs`：通过。
- `node --test tests/extension-static-build.test.mjs`：通过，6/6。
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node scripts/build.mjs --check`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/extension-static-build.test.mjs tests/build-output-sync.test.mjs`：通过，8/8。
- `node -e "const m=require('./dist/extension/manifest.json'); if(m.version!=='7.3'||m.version_name!=='7.03') process.exit(1); console.log(JSON.stringify({version:m.version,version_name:m.version_name}))"`：通过，输出 `{"version":"7.3","version_name":"7.03"}`。
- `bash scripts/review-team.sh`：通过，454 个测试中 452 pass、2 skip，所有 automated review checks passed。

## 结果复盘
- 这不是插件代码运行错误，而是 Chrome 对 manifest `version` 的规范化提示；`7.03` 中的 `03` 会被按整数解析为 `3`。
- 不直接把项目版本全局改成 `7.3`，避免 userscript、README 和发版记录的 `v7.03` 口径被无关扰动。
- 正确分层是：manifest `version` 用于 Chrome 更新比较，必须合规且无前导零；manifest `version_name` 用于显示，可保留 `7.03`。

---

# TODO - 2026-05-15 人群对比看板加载提速

## 需求规格
- 目标：
  - 优化“人群对比看板”打开/加载速度，减少用户等待时间；
  - 先定位慢点来源，区分接口请求串行、重复刷新、阻塞式渲染、过度 DOM 更新或缓存缺失；
  - 做最小侵入优化，不改变看板数据口径、字段含义和用户可见交互；
  - 同步生成 userscript 与 extension 产物，并用自动化测试证明关键契约未退化。
- 成功标准：
  - 看板加载链路避免明显的重复请求、重复渲染或串行等待；
  - 首屏/骨架先可见，耗时数据可渐进填充时不阻塞整个看板；
  - 已有“人群对比看板”测试继续通过，必要时新增性能/契约回归测试；
  - `node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"`、相关 `node:test` 通过。

## 执行计划（可核对）
- [x] 记录需求、验收标准和验证计划。
- [x] 回顾历史教训与当前工作树，确认不回退已有改动。
- [x] 定位“人群对比看板”实现、加载流程和潜在慢点。
- [x] 评估是否存在更优雅的低侵入方案，并选择实现路径。
- [x] 修改源码，补充或调整回归测试。
- [x] 重新构建生成产物并运行自动化验证。
- [x] 回填验证记录、结果复盘，必要时沉淀 `tasks/lessons.md`。

## 高层操作摘要
- 用户反馈“人群对比看板”加载太慢，本轮按性能缺陷处理，优先找根因而不是单纯加 loading 文案。
- 当前工作树已有多项未归属本轮的改动，本轮只在必要文件上增量修改，不回退既有变更。
- 实现集中在 `src/main-assistant/magic-report.js`；初步慢点为：看板请求前同步等待商品列表识别、默认隐藏指标仍参与首轮全量加载、同一指标的省份/城市基础查数在并发周期任务中缺少共享 promise 保护。
- 优化选择：初次加载仅请求当前可见人群（默认加购人群），隐藏人群在图例点亮时按指标补拉；非商品成交场景下商品下拉列表改为后台识别；省份/城市基础查数集中到共享 promise，避免同指标并发周期任务重复查数；排队刷新改为多指标队列，避免加载中连续点亮多个隐藏人群只补最后一个。
- 按最新口径确认加载体验：保持“完成一个周期就渲染一次”，并将隐藏人群点亮、商品 ID 切换等局部刷新链路也改为按周期增量渲染。

## 验证记录
- `node --check src/main-assistant/magic-report.js`：通过。
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --test tests/magic-report-crowd-matrix.test.mjs tests/magic-report-trigger-driver.test.mjs tests/magic-report-panel-resilience.test.mjs`：通过，64/64。
- `node scripts/build.mjs --check`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test --test-reporter=dot tests/*.test.mjs`：通过，退出码 0。
- `bash scripts/review-team.sh`：通过，453 个测试中 451 pass、2 skip，所有 automated review checks passed。
- Chrome DevTools MCP 真实关键词推广页：选择计划 `69514602419 / E7pro_自定义` 打开“人群对比看板”，首屏加载状态显示 `加载中 1/4`，证明初次加载只排当前可见人群的 4 个周期任务，而不是旧的 4 类人群全量 16 个周期任务。
- Chrome DevTools MCP 真实关键词推广页：首屏完成后状态为 `人群对比看板已加载完成（4列周期 × 8行维度）`，图例仅“加购人群”默认开启，其余人群关闭；点亮隐藏的“点击人群”后按需刷新完成，状态为 `点击人群已刷新`。
- Chrome DevTools MCP 控制台：仅观察到页面外部资源代理 `net::ERR_TUNNEL_CONNECTION_FAILED` 等既有噪声，未发现本次人群看板逻辑导致的可见异常。
- Chrome DevTools MCP 真实关键词推广页复测计时：计划 `69514602419 / E7pro_自定义` 首屏第 1 次从点击到完成 `20.8s`，状态从 `正在加载计划...` 到 `加载中 1/4` 再到 `人群对比看板已加载完成（4列周期 × 8行维度）`；隔离到本次操作的报告请求为 `12` 个（`dataQuery=3`、`panelDataQuery=9`）。
- Chrome DevTools MCP 真实关键词推广页复测计时：同计划首屏第 2 次从点击到完成 `14.5s`，仍为 `加载中 1/4` 的 4 周期任务；按需点亮隐藏的“点击人群”单独刷新 `11.3s` 完成，隔离报告请求同为 `12` 个。
- `node --test tests/magic-report-crowd-matrix.test.mjs tests/magic-report-trigger-driver.test.mjs tests/magic-report-panel-resilience.test.mjs`：通过，65/65；新增断言覆盖局部刷新“完成一个周期就渲染一次”。

## 结果复盘
- 慢点根因是首屏做了过多“用户当前没看的数据”：隐藏人群仍参与初次全量请求，且非商品成交场景也同步等待商品列表识别。
- 修复后默认首屏从“4 类人群 × 4 周期”收敛为“当前可见人群 × 4 周期”，隐藏人群保留交互入口，在用户点亮时按需补拉，不改变数据口径。
- 首屏加载与局部刷新都保持边加载边显示：每完成一个周期结果就合入当前结果集并重绘对应周期列，最终完成后再做一次完整收口渲染。
- 真实页面计时显示当前默认首屏在本次网络条件下约 `14.5s-20.8s` 完成；旧逻辑会把 4 类人群全部纳入首屏，至少是 `16` 个周期任务，且隐藏人群请求会挤占首屏，所以当前实现已把首屏工作量稳定降到旧逻辑的 1/4。
- 省份/城市基础查数增加共享 promise 后，同一人群指标的并发周期任务不会重复发起相同基础维度解析；加载中连续点亮多个隐藏人群也会按队列依次补跑，避免只刷新最后一次操作。
- 本轮没有点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口；未收到用户修正，因此没有新增 `tasks/lessons.md` 教训项。

---

# TODO - 2026-05-15 取消辅助标签样式去宽度改动

## 需求规格
- 目标：
  - 按用户最新修正，取消“`TAG_BASE_STYLE` 去掉强制 `width:100%`”这项样式改动。
  - 保留本轮辅助显示的多可见表格遍历、诊断函数、可见性判断等非样式修复。
  - 同步源码、测试契约、生成 userscript 与 extension 产物，避免源码和发布包不一致。
- 成功标准：
  - `src/main-assistant/bootstrap.js` 中 `TAG_BASE_STYLE` 恢复 `width:100%;margin-top:2px;`。
  - `tests/logger-api.test.mjs` 不再禁止该样式，而是断言它被保留。
  - `tasks/lessons.md` 不再保留与最新口径冲突的禁止项，并记录本次修正。
  - 构建和相关测试通过。

## 执行计划（可核对）
- [x] 确认最新口径：取消去掉 `width:100%` 的样式改动。
- [x] 记录需求、验收标准和用户修正。
- [x] 恢复 `TAG_BASE_STYLE`，调整测试契约与任务/教训文档。
- [x] 重新构建生成产物。
- [x] 运行测试与构建校验。

## 高层操作摘要
- 用户纠正上一轮表述，明确 `TAG_BASE_STYLE` 去掉强制 `width:100%` 的改动需要取消。
- 本轮只回滚辅助标签基础样式这一项，不回退辅助显示多表格遍历、诊断函数、可见性判断等根因修复。

## 验证记录
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --test tests/logger-api.test.mjs tests/report-metric-ratio-columns.test.mjs`：通过，15/15。
- `node scripts/build.mjs --check`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `bash scripts/review-team.sh`：通过，452 个测试中 450 pass、2 skip，所有 automated review checks passed。

## 结果复盘
- 最新样式契约已恢复为保留 `width:100%;margin-top:2px;`，并由 `tests/logger-api.test.mjs` 断言保护。
- 辅助显示“日志更新但页面不可见”的主要修复仍保留在可见表格识别、多表格遍历、诊断函数和 DOM 观察增强上。

---

# TODO - 2026-05-15 辅助显示部分浏览器不生效

## 需求规格
- 目标：
  - 排查真实浏览器里“辅助显示”开关/标记没有生效的问题；
  - 区分脚本未注入、主面板未渲染、辅助开关未持久化、DOM 观察器未启动、页面结构或浏览器环境差异导致的失效；
  - 找到根因后做最小侵入修复，并同步生成 userscript 与 extension 产物；
  - 通过自动化测试和 Chrome DevTools MCP 真实页面验证。
- 成功标准：
  - 在当前浏览器真实页面可确认主助手与辅助显示运行态；
  - 辅助显示入口点击后状态可见、配置可保存，并触发对应页面标记/增强逻辑；
  - 对会导致部分浏览器失效的兼容性问题补充回归测试；
  - `node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"`、相关 `node:test` 通过。

## 执行计划（可核对）
- [x] 回顾历史教训与当前工作树，确认不回退已有改动。
- [x] 用 Chrome DevTools MCP 检查当前浏览器页面、控制台错误、脚本注入状态和辅助显示 DOM。
- [x] 阅读辅助显示实现，定位跨浏览器差异点与失败条件。
- [x] 选择最小侵入且可维护的修复方案，并确认是否有更优雅实现。
- [x] 修改源码、补充/更新回归测试并重新构建产物。
- [x] 运行自动化验证和真实页面复验。
- [x] 回填验证记录、结果复盘，必要时沉淀 `tasks/lessons.md`。

## 高层操作摘要
- 用户反馈“现在有个浏览器里，辅助显示没有生效，有些浏览器可以有些不可以”，初步按运行态差异排查，不先假设为单一 UI 问题。
- 本轮只追加当前任务记录；开始前已有的授权、组建计划、Linear 同步、pet 任务等改动不回退。
- Chrome DevTools MCP 检查当前 `one.alimama.com` 首页和关键词推广页，确认当前浏览器中主助手已注入，辅助显示标签能渲染；因此本轮按“部分浏览器环境差异”修复薄弱点，而不是重写辅助显示算法。
- 根因候选收敛为两类：主助手配置直接读写 `localStorage`，在隐私模式/存储受限/异常配置浏览器中可能阻断启动；SPA 表格复用节点时只监听 `childList`，对 class/style/文本变化不敏感，可能错过重扫。
- 修复方式：新增安全配置存储封装，`localStorage` 读写失败时回退内存 Map，不让主助手启动中断；扩展主 `MutationObserver` 监听 `class/style/aria-hidden` 和文本变化，覆盖表格显示切换与内容复用更新。
- 补充回归测试，防止后续重新出现裸 `localStorage` 读写或只监听 `childList` 的退化；已重新构建根 userscript、packages 和 extension 产物。

## 验证记录
- Chrome DevTools MCP 当前浏览器 `one.alimama.com/index.html` 首页：脚本注入正常，`#am-helper-panel` 存在，辅助显示当前已有 80 个 `.am-helper-tag`。
- Chrome DevTools MCP 当前浏览器关键词推广页：脚本注入正常，修复前运行态已有 230 个 `.am-helper-tag`，说明当前浏览器可用，问题更可能来自部分浏览器环境差异。
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --test tests/logger-api.test.mjs tests/magic-report-panel-resilience.test.mjs tests/report-metric-ratio-columns.test.mjs`：通过，17/17。
- `node scripts/build.mjs --check`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test --test-reporter=dot tests/*.test.mjs`：通过，退出码 0。
- Chrome DevTools MCP 真实关键词推广页硬刷新后：`#am-helper-panel` 存在，`#am-assist-switches` 可展开，8 个辅助开关可见并读取为 active；列表渲染 175 个 `.am-helper-tag`，包含 `ratio-tag/cart-tag/cost-tag/budget-tag`。
- Chrome DevTools MCP 真实关键词推广页面板日志：启动后记录 `阿里助手 Pro v7.03 已启动`、`总花费更新: 487.4`、多次 `更新 xx 项数据`，证明重扫链路正常触发。
- `bash scripts/review-team.sh`：通过，448 个测试中 446 pass、2 skip，所有 automated review checks passed。

## 结果复盘
- 当前可复验浏览器本身不是“完全没有辅助显示”，真实页面已经能渲染辅助标签；本轮修的是会导致“有些浏览器可以、有些不可以”的两个高风险兼容点。
- 存储受限或 `localStorage` 异常时，旧逻辑可能在 `loadConfig()` 或 `State.save()` 直接抛错，导致主助手/辅助显示初始化中断；现在配置读写失败只降级到内存态，不阻断运行。
- 阿里妈妈 SPA 表格可能复用节点并只改属性或文本；旧观察器只看增删节点，可能漏掉重扫；现在属性和文本变化也会调度 `Core.run()`。
- 本轮未点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。

# TODO - 2026-05-15 创建个人化 Codex Pet

## 需求规格
- 目标：
  - 创建一个基于用户工作风格的 Codex 兼容 pet；
  - 体现“严谨工程、真实验证、最小侵入、可被 Claude 复审”的个人特征；
  - 生成完整 9 状态 spritesheet、`pet.json`、联系表和动画预览；
  - 不修改业务源码，不影响现有 userscript 构建产物。
- 成功标准：
  - 产物保存到 `${CODEX_HOME:-$HOME/.codex}/pets/<pet-id>/pet.json` 与 `spritesheet.webp`；
  - `final/validation.json` 通过 Codex pet atlas 校验；
  - `qa/contact-sheet.png` 与 `qa/previews/*.gif` 存在，可用于视觉复核；
  - 任务文档记录高层操作摘要、验证记录和结果复盘。

## 执行计划（可核对）
- [x] 回顾历史教训，确认本轮只做资产生成，不触碰业务链路。
- [x] 准备 hatch-pet 运行目录、宠物名称、描述、风格和 prompts。
- [ ] 生成主形象与 9 个状态行图。
- [ ] 运行帧提取、atlas 合成、校验、联系表和动画预览。
- [ ] 打包到 Codex pets 目录并回填验证记录。

## 高层操作摘要
- 宠物方向：一个小型工程守护助手，偏贴纸/3D toy 风格，随身带轻量检查板但不包含任何可读文字或品牌标识。
- 设计语义：idle 表示稳定待命，running-right/left 表示方向移动，running 表示专注处理任务，review 表示严谨复核，waiting 表示等待用户确认，failed 表示可恢复失败态。
- 本轮按 `hatch-pet` 技能执行，使用内置 imagegen 生成位图资产，再用技能自带脚本做 deterministic atlas 与验证。
- 已创建运行目录 `tasks/pet-runs/review-scout-20260515`，pet id 为 `review-scout`。
- 已生成并登记主形象 `decoded/base.png` 与 `references/canonical-base.png`。

## 验证记录
- 待回填。

## 结果复盘
- 待回填。

---

# TODO - 2026-05-14 新店铺首装误弹授权超时

## 需求规格
- 目标：
  - 修复新店铺首次安装、无本地授权缓存时也弹出授权超时/锁定页面的问题；
  - 区分首装冷启动校验中、店铺识别暂未完成、授权服务瞬时失败、远端明确未授权/过期；
  - 首装校验中不展示全屏锁定遮罩，避免把等待态误导成授权超时；
  - 保持真实未授权、真实过期、远端明确拒绝时的阻断能力。
- 成功标准：
  - extension 无有效缓存冷启动时，不因用户第一次点击插件入口立即渲染授权锁定遮罩；
  - 点击会触发后台授权校验，业务事件仍被同步阻断，避免校验完成前执行敏感动作；
  - 只有远端明确拒绝、真实过期或非瞬时失败才展示锁定遮罩；
  - 补充回归测试并通过构建、全量自动化和真实页面基础复验。

## 执行计划（可核对）
- [x] 记录用户修正和首装冷启动验收标准。
- [x] 审查无缓存冷启动、按需校验、同步门禁和遮罩渲染路径。
- [x] 修改首装等待态，不再把 `license_checking` 渲染为全屏锁定页。
- [x] 补充授权守卫回归测试并同步生成产物。
- [x] 运行自动化验证和 Chrome DevTools 真实页面复验。
- [x] 回填验证记录、结果复盘，并沉淀到 `tasks/lessons.md`。

## 高层操作摘要
- 用户进一步反馈“新店铺刚安装时也弹授权超时页面”，说明上一轮只处理了已有有效缓存的租约刷新路径，没有覆盖无缓存首装冷启动。
- 初步定位：extension 模式无缓存时会启动 `bootstrap_preflight` 静默校验，同时按需点击守卫在租约尚未建立时调用 `renderPendingAuthorizationOverlay()`，把“授权校验中”直接渲染为全屏锁定遮罩。
- 修复方向：保留点击同步阻断和按需远端校验，但首装/等待态只更新状态，不渲染锁定遮罩；锁定遮罩仅用于真实未授权、真实过期或远端明确失败。
- 已修改：`license_checking` 等等待态只写入只读授权状态；点击仍阻断当前业务事件并触发按需校验；同步公开入口在等待态返回 `license_checking`，不再先覆盖成 `lease_expired`。
- 已补充：按需校验遇到 `request_failed/request_http_error/response_parse_error/invalid_response` 等瞬时失败也走静默延期，不再在新店铺冷启动时弹出授权超时锁定页。
- 本轮不回退开始前已有的组建计划修复、授权缓存修复、Linear 同步文件和既有任务文档改动。

## 验证记录
- `node --check src/entries/extension-license-guard.js`：通过。
- `node --test tests/extension-license-cache-policy-token.test.mjs`：通过，3/3。
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --test tests/extension-license-cache-policy-token.test.mjs tests/extension-license-shopid-guard.test.mjs tests/optimizer-entry-error-handling.test.mjs tests/extension-static-build.test.mjs`：通过，15/15。
- `node scripts/build.mjs --check`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test --test-reporter=dot tests/*.test.mjs`：通过，退出码 0。
- `bash scripts/review-team.sh`：通过，446 个测试中 444 pass、2 skip，所有 automated review checks passed。
- Chrome DevTools 真实 `one.alimama.com/index.html` 页面：备份并移除 `__AM_LICENSE_CACHE_V1__`，通过 `Page.addScriptToEvaluateOnNewDocument` 仅模拟 `/v1/license/verify` 授权接口超时。
- Chrome DevTools 冷启动超时模拟：启动后 `LicenseGuard.getState()` 为 `authorized=false / reason=license_refresh_deferred / source=bootstrap_preflight`，`#am-license-lock-overlay` 不存在。
- Chrome DevTools 点击助手入口模拟：`pointerdown` 被同步阻断，状态变为 `source=on_demand_pointerdown`，仍无 `#am-license-lock-overlay`，证明首装/超时等待态不再弹全屏锁定页。
- Chrome DevTools 清理复原：移除超时注入脚本、恢复原授权缓存并刷新页面后，状态回到 `authorized=true / source=extension_cache_bootstrap`，无锁定遮罩。

## 结果复盘
- 根因是把“无缓存首装等待远端校验”和“真实授权失败/过期”共用了锁定遮罩；在授权服务慢、超时或新店铺首次写入缓存前，用户会看到误导性的授权超时页面。
- 修复后，等待态只更新 `LicenseGuard` 状态并阻断当前业务事件，不渲染全屏遮罩；按需校验的瞬时失败也静默延期，避免新店铺首装被误判为过期。
- 真实未授权、真实过期和远端明确拒绝仍会进入 `lock()` 并展示锁定遮罩，不放开敏感功能。
- 本轮未点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。

---

# TODO - 2026-05-14 授权未过期却反复提示

## 需求规格
- 目标：
  - 修复授权未过期时仍反复弹出授权/过期提示的问题；
  - 定位提示触发源，区分真实未授权、租约过期、店铺识别失败、远端瞬时失败和本地缓存误判；
  - 避免有效授权状态下阻断插件入口或反复展示锁定遮罩；
  - 保持未授权/真实过期时的阻断能力不退化。
- 成功标准：
  - 有效授权租约未过期时，不应弹出 `授权已失效/租约已过期/授权校验失败` 类提示；
  - 有效租约刷新失败时只保留当前授权并记录日志，不展示锁定遮罩；
  - 真实页面可读取到当前授权状态，并验证插件入口不会被有效授权误阻断；
  - 覆盖授权守卫回归测试，构建和 `review-team` 通过。

## 执行计划（可核对）
- [x] 记录问题、验收标准和风险边界。
- [x] 读取 `extension-license-guard` 状态机、缓存命中和交互阻断逻辑。
- [x] 用 Chrome DevTools 真实页面检查当前 `LicenseGuard` 状态、缓存、shopId、提示来源和控制台错误。
- [x] 修复误提示根因并补充回归测试。
- [x] 同步生成产物，运行自动化验证和真实页面复验。
- [x] 回填验证记录、结果复盘，并把本次用户修正沉淀到 `tasks/lessons.md`。

## 高层操作摘要
- 用户反馈“没有授权过期，为什么老是会弹出提示”，说明当前提示可能把远端校验失败或店铺识别瞬态误展示成授权过期。
- Chrome DevTools 真实页确认：后台店铺 `<SHOP_ID> / <SHOP_NAME>` 可远端校验通过，但页面启动时内存 `LicenseGuard` 为 `authorized=false / license_unverified`；旧本地租约已过期，手动校验后远端返回新 5 分钟租约。
- 根因确认：extension 模式不从有效缓存恢复内存授权态，且不做租约到期前静默续租；本地 5 分钟短租约过期后，下一次插件交互会先被本地状态阻断并展示提示，再去远端续租。
- 修复方式：启动时从结构校验通过的有效 policy token 缓存恢复内存授权态；extension 模式到期前静默续租，但不再通过空闲过期计时器锁定页面；无有效缓存时启动静默预检，瞬时失败不弹锁定遮罩。
- 本轮不回退开始前已有的组建计划修复、Linear 同步文件和既有 `tasks/lessons.md` 改动。

## 验证记录
- `node --check src/entries/extension-license-guard.js`：通过。
- `node --test tests/extension-license-cache-policy-token.test.mjs`：通过，3/3。
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --test tests/extension-license-cache-policy-token.test.mjs tests/extension-license-shopid-guard.test.mjs tests/optimizer-entry-error-handling.test.mjs tests/extension-static-build.test.mjs`：通过，15/15。
- `node scripts/build.mjs --check`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test --test-reporter=dot tests/*.test.mjs`：通过，退出码 0。
- `bash scripts/review-team.sh`：通过，446 个测试中 444 pass、2 skip，所有 automated review checks passed。
- Chrome DevTools MCP 真实 `one.alimama.com/index.html` 页面：修复前确认后台授权可通过，手动 `LicenseGuard.assertAuthorized()` 返回店铺 `<SHOP_ID> / <SHOP_NAME>` 的新 5 分钟租约，证明不是后台授权过期。
- Chrome DevTools MCP 真实页面重载后：`LicenseGuard.getState()` 为 `authorized=true`，`source=extension_cache_bootstrap`，无授权锁定遮罩，助手面板存在。
- Chrome DevTools MCP 点击主助手入口：点击前后均保持 `authorized=true`，未出现授权遮罩或误提示，面板正常打开。

## 结果复盘
- 根因不是后台授权过期，而是 extension 本地短租约约 5 分钟到期后，旧逻辑没有先静默续租或从有效缓存恢复内存态，导致下一次点击先被本地未授权状态阻断。
- 修复后 extension 启动会校验 policy token 并从有效缓存恢复授权态；租约到期前触发静默续租；extension 模式不再因为空闲租约到期主动展示锁定遮罩。
- 无有效缓存时仍会做启动静默预检，瞬时失败只记录待刷新状态，不直接弹锁定遮罩；真实未授权、真实过期或远端明确拒绝仍保持阻断能力。
- 本轮未点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。

---

# TODO - 2026-05-14 组建计划模块不可用弹窗

## 需求规格
- 目标：
  - 修复点击插件 `组建计划` 时出现 `组建计划模块不可用，请刷新页面重试` 的问题；
  - 定位入口 API 获取失败的根因，优先修复模块注册/桥接/构建顺序问题，不做简单吞错；
  - 保持页面安全边界，不能把 extension 页面不应暴露的完整 API 重新泄漏到页面全局；
  - 同步根 userscript 与 extension 产物，并提供可复验的自动化证据。
- 成功标准：
  - 主助手入口能解析到可用的 `KeywordPlanApi.openWizard`，并在 API 尚未准备好时给出可恢复路径；
  - `组建计划模块不可用` 不再因正常加载顺序或桥接隔离误判触发；
  - 有回归测试覆盖入口 API 解析和桥接注册契约；
  - `node scripts/build.mjs --check`、相关 `node --test`、`node --check "阿里妈妈多合一助手.js"` 通过。

## 执行计划（可核对）
- [x] 回顾历史教训，确认入口点击必须捕获 Promise reject 并验证可见反馈。
- [x] 建立根因笔记，梳理 `组建计划` 按钮、`KeywordPlanApi` 导出、bridge 注册和 extension 注入链路。
- [x] 选择最小侵入修复方案，并确认是否存在更优雅实现。
- [x] 修改源码并补充回归测试。
- [x] 运行构建、语法检查、相关测试和可行的浏览器验证。
- [x] 回填验证记录、结果复盘和剩余风险。

## 高层操作摘要
- 用户截图显示线上域 `one.alimama.com` alert：`组建计划模块不可用，请刷新页面重试`。
- 初步定位到触发点在主助手 UI 的 `am-trigger-keyword-plan-api` 点击处理：首次解析 API 失败后延迟重试，重试仍失败即弹窗。
- 根因确认：extension 默认运行态为避免泄漏完整计划 API，跳过 `globalThis.__AM_WXT_KEYWORD_API__` 注册；主助手入口处于另一个 IIFE，不能直接访问 `KeywordPlanApi`，因此误判模块不可用。
- 优雅性校验：不恢复完整 API 暴露，改为默认安装只允许 `openWizard` 的窄桥，保持建计划/查询/修复等高权限方法继续受内部或 debug 边界保护。
- 本轮不回退开始前已有 `tasks/lessons.md`、`tasks/linear-sync-inventory.md`、`tasks/linear-sync-results.json` 改动。

## 验证记录
- `node --test tests/keyword-wizard-entry-regression.test.mjs tests/extension-static-build.test.mjs`：通过，9/9。
- `node --check src/optimizer/bridge.js`：通过。
- `node --check src/main-assistant/bootstrap.js`：不适用，源码片段单独检查缺少后续 IIFE 结尾，改用整包语法检查。
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --test tests/keyword-wizard-entry-regression.test.mjs tests/extension-static-build.test.mjs tests/keyword-plan-api-bridge-security.test.mjs tests/keyword-plan-api-slim.test.mjs`：通过，19/19。
- `node scripts/build.mjs --check`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test --test-reporter=dot tests/*.test.mjs`：通过，退出码 0。
- `bash scripts/review-team.sh`：通过，446 个测试中 444 pass、2 skip，所有 automated review checks passed。
- Chrome DevTools MCP 真实 `one.alimama.com/index.html` 页面：临时移除 `__AM_WXT_DEBUG_PAGE_API__` 并重载后，确认 extension 运行态为 `mode=extension`、版本 `7.03`、`window.__AM_WXT_KEYWORD_API__` 为 `false`、`window.__AM_WXT_KEYWORD_OPEN_BRIDGE_READY__` 为 `1`。
- Chrome DevTools MCP：点击主面板 `组建计划` 后未触发 alert，未出现 `组建计划模块不可用` 或 `组建计划模块打开失败`，并成功创建且打开 `#am-wxt-keyword-overlay`。
- Chrome DevTools MCP：测试后已恢复原 `__AM_WXT_DEBUG_PAGE_API__=1`，并关闭测试打开的关键词计划弹窗；控制台仍有原站资源代理 `ERR_TUNNEL_CONNECTION_FAILED` 等既有噪声。

## 结果复盘
- 根因是 v7.03 安全收紧后 extension 默认不再暴露完整 `KeywordPlanApi`，而主助手入口处于另一个 IIFE，无法直接访问 `openWizard`。
- 修复采用默认可用的 `openWizard` 窄桥：主助手只请求打开向导，optimizer 侧只执行 `KeywordPlanApi.openWizard()`。
- 完整 page API 仍保留 debug 开关保护，`createPlansBatch`、`searchItems`、`runCreateRepairByItem` 等高权限方法没有重新默认暴露。
- 本轮未点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。

---

# TODO - 2026-05-14 更新版本到 7.03

## 需求规格
- 目标：
  - 将发布版本从 `7.02` 更新到 `7.03`；
  - 同步 userscript 头、脚本更新日志、README 最近更新和 CLAUDE 当前版本；
  - 重新生成根 userscript、packages 与 extension 产物；
  - 通过版本一致性与基础验证。
- 成功标准：
  - `@version`、README 最近版本、CLAUDE 当前版本均为 `7.03`；
  - `dist/extension/manifest.json` 与 extension page bundle 版本为 `7.03`；
  - `node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"`、`bash scripts/review-team.sh` 通过。

## 执行计划（可核对）
- [x] 确认当前版本来源与同步文件。
- [x] 更新源码版本号、脚本更新日志、README 与 CLAUDE。
- [x] 重新构建生成产物。
- [x] 运行版本一致性和自动化校验。
- [x] 回填验证记录与结果复盘。

## 高层操作摘要
- 默认采用下一版本 `7.03`，不创建 tag、不发布 release，除非后续另有指令。
- 本轮不纳入开始前已有的 `tasks/lessons.md`、`tasks/linear-sync-inventory.md`、`tasks/linear-sync-results.json` 改动。

## 验证记录
- `node scripts/build.mjs`：通过，生成版本 `7.03` 的根 userscript、packages 与 extension 产物。
- `node scripts/build.mjs --check`：通过，源码与生成产物同步。
- `node --check "阿里妈妈多合一助手.js"`：通过，生成主脚本语法有效。
- `bash scripts/review-team.sh`：通过，442 个测试中 440 pass、2 skip，版本一致性校验对齐 README 与 CLAUDE 的 `7.03`。

## 结果复盘
- 已完成 `7.02` 到 `7.03` 的版本更新，覆盖 userscript metadata、脚本更新日志、README、CLAUDE、根脚本、packages 与 extension 产物。
- 本轮仅更新版本与发布说明，不创建 tag、不执行 release。

---

# TODO - 2026-05-14 全面检查 bug

## 需求规格
- 目标：
  - 对当前仓库做一次全面缺陷检查，覆盖构建产物同步、语法、自动化回归、核心业务链路和近期高风险改动；
  - 重点关注入口无反馈、Promise reject、字段同步丢失、请求载荷构造、弹窗/矩阵/关键词/AI 点睛/授权链路等历史高风险问题；
  - 对能够明确复现且有低侵入修复路径的缺陷直接修复，并补充或更新回归测试；
  - 不做无关重构，不覆盖现有未提交任务文档和用户改动。
- 成功标准：
  - `node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"`、`node --test tests/*.test.mjs`、`bash scripts/review-team.sh` 结论明确；
  - 至少完成一轮关键源码静态审查，覆盖 userscript 入口、optimizer API、keyword plan API、main-assistant、extension 入口和 license-server 契约；
  - 若发现缺陷：有根因、最小修复、回归测试和复跑验证；
  - 若未发现可修复缺陷：说明已覆盖范围、剩余风险和无法验证项。

## 执行计划（可核对）
- [x] 回顾 `tasks/lessons.md`，提取本轮高风险检查点。
- [x] 写入本轮需求规格、验收标准和检查计划。
- [x] 并行做代码静态审查：入口/Promise、请求载荷、UI 状态同步、extension 注入、license-server 契约。
- [x] 运行构建同步、语法检查、全量自动化测试和团队 review 脚本。
- [x] 汇总缺陷候选，区分确定 bug、测试缺口和需真实页面验证的风险。
- [x] 对确定 bug 执行最小侵入修复，并补充回归测试。
- [x] 复跑受影响测试和全量 review，确认无回归。
- [x] 在本章节回填改动摘要、验证记录、结果复盘。

## 高层操作摘要
- 已确认工作树存在用户/历史改动：`tasks/todo.md`、`tasks/lessons.md`、`tasks/linear-sync-inventory.md`、`tasks/linear-sync-results.json`；本轮只在任务文档中追加当前检查记录，不回退既有内容。
- 本轮先做无提交动作的检查与修复；如发现业务代码缺陷，再按最小代码侵入原则处理。

## 检查笔记
- 详见 `tasks/bug-audit-2026-05-14-notes.md`。

## 缺陷修复摘要
- 修复 `AI 点睛` 需求弹层中时间解析函数的 TDZ 风险，避免入口测试和运行时在初始化顺序变化时触发 `ReferenceError`。
- 修复 `趋势明星/流量金卡` 下仍渲染手动关键词面板的问题，避免非自定义目标展示不匹配控件。
- 修复 extension content 注入失败静默问题：无挂载点、`chrome.runtime.getURL` 失败、脚本加载失败和 append 失败都会渲染页面可见错误。
- 收紧 extension page bridge：默认不再把完整计划 API 暴露到页面全局，仅保留 debug 开关。
- 修复授权守卫：
  - 缓存 shopId 不再参与当前页面身份排序；
  - 有效租约必须绑定当前解析 shopId；
  - 有效租约强制刷新遇到瞬时错误时保留当前授权；
  - extension 模式未授权交互会同步阻断并触发按需校验；
  - 远端授权响应必须携带并通过 `policyToken` 验签；
  - 算法护航公开入口自身也执行授权同步门禁，防止页面全局函数绕过点击拦截。
- 修复关键词最终组包：
  - `crowdList/adzoneList/trendThemeList/launch*` 支持显式空数组和 JSON 空数组，不再误回落旧模板；
  - 非目标场景会裁剪互斥原生字段，避免 `trendThemeList`、搜索卡位字段、流量金卡套餐/订单字段跨目标泄漏；
  - `campaign.*` / `adgroup.*` 直连字段保留数组和对象原值，不再变成字符串。
- 修复入口异常反馈：
  - 主助手 bootstrap 捕获初始化异常，避免阻断后续模块；
  - 万能查数、算法护航按钮和 `Core.run()` Promise reject 均有错误反馈；
  - `__ALIMAMA_OPTIMIZER_RUN_CAMPAIGN__` 覆盖 token/UI/process 全链路异常并返回结构化失败。

## 验证记录
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --test tests/keyword-wizard-entry-regression.test.mjs`：通过，2/2。
- `node --test tests/keyword-custom-native-parity-ui.test.mjs tests/keyword-search-p0-contract.test.mjs tests/keyword-custom-settings-sync.test.mjs tests/keyword-wizard-entry-regression.test.mjs`：通过，34/34。
- `node --test tests/extension-static-build.test.mjs tests/extension-license-cache-policy-token.test.mjs tests/extension-license-shopid-guard.test.mjs tests/keyword-plan-api-bridge-security.test.mjs tests/optimizer-entry-error-handling.test.mjs tests/keyword-search-p0-contract.test.mjs`：通过，28/28。
- `node scripts/build.mjs --check`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test --test-reporter=dot tests/*.test.mjs`：通过，退出码 0。
- `bash scripts/review-team.sh`：通过，442 个测试中 440 pass、2 skip，所有自动化 review checks passed。
- Chrome DevTools MCP 真实 `one.alimama.com` 页面：重载后确认 `__ALIMAMA_OPTIMIZER_TOGGLE__` 和 `__ALIMAMA_OPTIMIZER_RUN_CAMPAIGN__` 存在；未授权状态下调用 `__ALIMAMA_OPTIMIZER_TOGGLE__()` 返回 `false`，未创建 `#alimama-escort-helper-ui`；调用 `__ALIMAMA_OPTIMIZER_RUN_CAMPAIGN__()` 返回 `{ success:false, code:"lease_expired" }`，并展示授权锁定遮罩。
- Chrome DevTools MCP 控制台：仅见原站资源代理 `ERR_TUNNEL_CONNECTION_FAILED`、原站组件依赖 warning，以及预期的 `[EscortAPI] 授权未通过` warning；未见本轮插件堆栈错误。

## 结果复盘
- 本轮共修复 7 类确定缺陷：初始化顺序、目标控件隐藏、extension 注入反馈、授权边界、关键词组包字段污染、结构化字段保真、入口异常反馈。
- 真实页面烟测发现了静态审查遗漏：只在事件层阻断未授权交互不足以防止页面脚本直接调用全局公开 API；最终把授权门禁下沉到公开 API 本身。
- 本轮未点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。

---

# TODO - 2026-05-14 整理历史任务并同步 Linear

## 需求规格
- 目标：
  - 从 `tasks/todo.md` 整理全部历史任务，包含已完成、未完成和阻塞项；
  - 按主题、日期和完成状态归类，减少 Linear 中重复 issue；
  - 同步到 Linear 项目 `阿里妈妈智能工具`；
  - 同步完成后回填 issue 对照、失败原因和后续动作。
- 成功标准：
  - `tasks/todo.md` 中每个 `# TODO` 章节都被纳入整理清单；
  - 已完成任务同步为已完成/Done 类状态，未完成任务保持待办/Backlog 类状态；
  - 已有 Linear issue 优先复用更新，不重复创建同名任务；
  - Linear 连接失败时，保留可直接重试的整理清单和阻塞说明。

## 执行计划（可核对）
- [x] 记录本轮整理范围和同步规则。
- [x] 解析 `tasks/todo.md` 全量 `# TODO` 章节，统计完成状态。
- [x] 按主题归类任务：关键词推广、货品全站、矩阵页、AI 点睛、趋势主题、抓包/提交流量、小万护航、授权/管理台、构建/发布等。
- [x] 查询 Linear 中 `阿里妈妈智能工具` 项目、团队、标签和已有 issue。
- [x] 生成本地同步清单。
- [x] Linear 连接恢复后批量创建或更新 Linear issue。
- [x] 回填 Linear 同步结果、失败项和复盘。

## 整理规则
- 状态判定：
  - 章节内所有执行计划复选框均为 `[x]`，同步为完成态；
  - 章节内存在 `[ ]`，同步为待办态；
  - 章节显式记录工具/登录态/安全阻塞，保留阻塞说明。
- 去重规则：
  - 以任务标题作为主键；
  - 同标题已存在 Linear issue 时更新描述和状态；
  - 标题不同但明显属于同一修复闭环时保留独立 issue，并在描述中标注上下游关系。
- 描述规则：
  - 保留 `需求规格`、`执行计划`、`改动摘要`、`验证记录`、`结果复盘` 的高层摘要；
  - 不把整段超长日志原样复制进 Linear，仅保留关键命令和结论。

## 同步结果
- 本地整理已完成，清单见 `tasks/linear-sync-inventory.md`。
- 整理范围：`tasks/todo.md` 中 42 个历史开发 TODO；本轮新增的 Linear 同步操作章节不创建产品 issue。
- 原始复选框状态：39 个已完成、3 个部分完成。
- 整理后同步状态：41 个已完成/已闭环，1 个待继续。
- 唯一待继续任务：`2026-05-05 阿里妈妈营销场景全量抓包`。
- Linear 查询/同步阻塞：Linear 插件 MCP 握手失败，错误为连接 `https://chatgpt.com/backend-api/wham/apps` 时 HTTP request failed；`_research`、`_search`、`_list_projects`、`_list_issues` 均同类失败。
- 用户重新安装授权 Linear 后复测：`_research`、`_search`、`_list_projects`、`_list_issues` 仍在 MCP 初始化阶段失败，尚未进入 Linear workspace 查询。
- 连通性排查：本机 `curl -I https://chatgpt.com/backend-api/wham/apps` 可达并返回 HTTP 405/Allow POST，说明基础网络可达；当前阻塞更像是本 Codex 会话内 Linear app 授权状态未被 MCP runtime 刷新。
- 本地环境检查：未发现 `LINEAR_API_KEY` 或同类 Linear API 环境变量，不能安全绕过插件直连 Linear API。
- 修复方式：内置 `mcp__codex_apps__linear` wrapper 仍失败，但同一 Codex 登录 token 直连 `https://chatgpt.com/backend-api/wham/apps` 的 MCP JSON-RPC 可成功 `initialize`、`tools/list` 和 `tools/call`；本轮用该直连路径完成同步。
- Linear 目标：项目 `阿里妈妈智能工具`，团队 `Linkswo`。
- 已创建标签：`imported-from-tasks`、`关键词推广`、`货品全站推广`、`矩阵与趋势主题`、`抓包与开发文档`、`小万护航`、`验证与入口稳定性`、`已闭环`。
- 同步结果：创建 `LIN-11` 至 `LIN-52` 共 42 条 issue，其中 41 条为 `Done`，1 条为 `Todo`。
- 唯一待办：`LIN-41 2026-05-05 阿里妈妈营销场景全量抓包`，URL 为 `https://linear.app/linkswo/issue/LIN-41/2026-05-05-阿里妈妈营销场景全量抓包`。
- 结果报告：`tasks/linear-sync-results.json`。
- 反查验证：Linear 项目当前 `imported-from-tasks` issue 共 42 条，状态分布为 `Done=41`、`Todo=1`。

---

# TODO - 2026-05-13 手动关键词跟随关键词设置展开

## 需求规格
- 目标：
  - 将 `手动关键词` 面板移动到 `关键词设置` 行正下方；
  - 只有勾选 `查看和添加关键词` 时，才展开 `手动关键词` 面板；
  - 取消勾选 `查看和添加关键词` 时，同步收起 `手动关键词` 面板；
  - 保持已有关键词表、流量智选、匹配方案、基础出价和新增关键词能力。
- 成功标准：
  - 插件中 `手动关键词` 紧跟在 `关键词设置` 后面；
  - 默认勾选 `查看和添加关键词` 时，手动关键词面板展开；
  - 取消勾选后，手动关键词面板收起；
  - 再次勾选后，手动关键词面板展开；
  - 构建、语法检查、相关测试和 Chrome 真实页面验证通过。

## 执行计划（可核对）
- [x] 记录需求和验收标准。
- [x] 调整 `手动关键词` 渲染位置到 `关键词设置` 下方。
- [x] 将 `查看和添加关键词` 勾选状态同步到手动关键词展开状态。
- [x] 补充回归测试锁住位置和状态联动。
- [x] 构建、语法检查和相关测试。
- [x] Chrome 真实页面复验勾选/取消勾选联动。
- [x] 回填验证记录、结果复盘和教训。

## 改动摘要
- `buildManualKeywordDesignerRow` 支持外部传入折叠状态。
- `关键词推广 -> 自定义推广 -> 智能出价` 下，`手动关键词` 面板改为紧跟 `关键词设置` 渲染。
- `查看和添加关键词` 勾选框会同步展开/收起 `手动关键词` 面板；取消勾选时收起，再次勾选时展开。
- 使用 `keywordManualPanelInsertedAfterSetting` 标记避免底部兜底重复追加一份 `手动关键词`，避免跨作用域引用出价模式变量。

## 验证记录
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --test tests/keyword-custom-settings-sync.test.mjs tests/keyword-custom-native-parity-ui.test.mjs`：通过，26/26。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- Chrome DevTools MCP：重载 unpacked extension `fejbonphnhfgfomjjchjijfeippmhnfd`，硬刷新真实 `one.alimama.com` 页面后，通过 `__AM_WXT_KEYWORD_API__.openWizard` 打开插件向导。
- Chrome DevTools MCP：进入 `关键词推广 -> 自定义推广` 编辑页，确认 `关键词设置` 行索引为 20，`手动关键词` 行索引为 21，二者相邻。
- Chrome DevTools MCP：默认 `查看和添加关键词` 勾选时，`手动关键词` 面板 `data-manual-keyword-collapsed="0"`，关键词布局可见。
- Chrome DevTools MCP：取消勾选 `查看和添加关键词` 后，面板类名变为 `is-collapsed`，`data-manual-keyword-collapsed="1"`，关键词布局隐藏。
- Chrome DevTools MCP：再次勾选 `查看和添加关键词` 后，面板恢复 `data-manual-keyword-collapsed="0"`，关键词布局可见。
- Chrome DevTools MCP：修复过程中真实页面曾触发 `activeKeywordGoal is not defined` 和 `keywordBidMode is not defined`，最终改为安全作用域和插入标记后未再出现插件渲染 ReferenceError。
- Chrome DevTools MCP：控制台仍存在原生页面资源代理错误 `ERR_TUNNEL_CONNECTION_FAILED` 和站点日志，未发现本轮交互产生的插件堆栈错误。
- 本轮未点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。

## 结果复盘
- 根因是 `手动关键词` 面板此前作为底部兜底项渲染，视觉位置落在人群设置/资源位设置之后；原生的 `查看和添加关键词` 入口应直接控制该面板。
- 本轮将自定义推广智能出价下的 `手动关键词` 插到 `关键词设置` 正下方，并让勾选状态驱动展开/收起。
- 最终去重策略不依赖外层不可见的 `keywordBidMode`，而是记录“是否已在关键词设置下方插入面板”，更稳且避免重复渲染。

---

# TODO - 2026-05-13 关键词自定义推广查看和添加关键词同构原生

## 需求规格
- 目标：
  - 在 `关键词推广 -> 自定义推广` 中，对齐原生 `关键词设置` 行的 `查看和添加关键词` 入口；
  - 点击 `查看和添加关键词` 后展开插件已有关键词列表/词包面板；
  - 保持已有 `流量智选`、关键词组合、自选词数量、匹配方案、基础出价和手动新增关键词能力；
  - 不点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。
- 成功标准：
  - 插件 `关键词设置` 行显示摘要和 `查看和添加关键词` 入口；
  - 点击 `查看和添加关键词` 会展开已有关键词面板，而不是只切换隐藏字段；
  - 展开后可看到词包/流量智选、自选关键词表、匹配方案和基础出价；
  - 构建、语法检查、相关测试和 Chrome 真实页面验证通过。

## 执行计划（可核对）
- [x] 记录需求和验收标准，明确复用现有关键词面板而不是重写。
- [x] 给 `查看和添加关键词` 文案增加原生入口触发标记。
- [x] 打通入口点击到已有手动关键词面板展开逻辑。
- [x] 补充回归测试锁住入口和展开状态同步。
- [x] 构建、语法检查和相关测试。
- [x] Chrome 真实页面复验点击入口后面板展开。
- [x] 回填验证记录、结果复盘和教训。

## 改动摘要
- `关键词设置` 行中的 `查看和添加关键词` 文案新增 `data-keyword-setting-open-manual="1"`，作为原生式入口。
- 点击该入口时会保持 `关键词设置=查看和添加关键词`，同步隐藏字段，并展开已有 `data-manual-keyword-panel`。
- 手动关键词面板的展开/收起同步抽成 `syncManualKeywordPanelCollapsed`，入口点击和面板自身 `展开/收起` 按钮共用同一套状态写回逻辑。

## 验证记录
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --test tests/keyword-custom-settings-sync.test.mjs tests/keyword-custom-native-parity-ui.test.mjs`：通过，26/26。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- Chrome DevTools MCP：重载 unpacked extension `fejbonphnhfgfomjjchjijfeippmhnfd`，硬刷新真实 `one.alimama.com` 页面后，通过 `__AM_WXT_KEYWORD_API__.openWizard` 打开插件向导。
- Chrome DevTools MCP：进入 `关键词推广 -> 自定义推广` 编辑页，确认 `关键词设置` 行存在 `查看和添加关键词` 入口，默认手动关键词面板为 `is-collapsed`、`data-manual-keyword-collapsed="1"`。
- Chrome DevTools MCP：点击 `查看和添加关键词` 后，手动关键词面板变为展开态，`data-manual-keyword-collapsed="0"`，关键词布局和操作区可见。
- Chrome DevTools MCP：展开后可见 `流量智选`、`关键词 (7/200)`、`广泛/精准` 匹配方案、基础出价和 7 条自选关键词。
- Chrome DevTools MCP：隐藏字段保持 `关键词设置=查看和添加关键词`，未被点击入口误切成 `关闭`。
- Chrome DevTools MCP：控制台存在页面资源代理错误 `ERR_TUNNEL_CONNECTION_FAILED` 和原生组件依赖/表达式警告，未发现本次入口点击产生的插件堆栈错误。
- 本轮未点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。

## 结果复盘
- 根因是插件已实现关键词面板，但原生 `查看和添加关键词` 摘要入口没有连接到该面板；用户必须再去下方点 `展开`，交互不符合原生。
- 本轮没有重写关键词表格，只把原生入口打通到已有面板，并复用原展开/收起状态写回逻辑。
- 后续遇到摘要行里的 `查看和添加/编辑设置` 文案，必须验证点击是否打开对应详情面板，而不是只检查字段值和列表是否存在。

---

# TODO - 2026-05-10 AI 点睛热门搜索词默认展开

## 需求规格
- 目标：
  - `AI点睛设置` 中 `热门搜索词`、`搜索人群画像与特征` 默认展示，不再隐藏到 `展开详情` 后；
  - `展开详情/收起详情` 只控制 5 步深度分析，不影响热门搜索词和人群画像常驻版块；
  - 点击不同需求卡片后，常驻版块继续同步切换对应热门搜索词和人群画像；
  - 全程不点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。
- 成功标准：
  - 插件打开 `AI点睛` 后，不点击 `展开详情` 即可看到 `热门搜索词` 和 `搜索人群画像与特征`；
  - 点击 `展开详情` 后 5 步分析出现，热门搜索词和人群画像仍保持可见；
  - 点击 `收起详情` 后 5 步分析隐藏，热门搜索词和人群画像仍保持可见；
  - 构建、语法检查、相关测试和 Chrome 真实页面验证通过。

## 执行计划（可核对）
- [x] 记录需求和验收标准，明确本轮只修常驻版块默认可见性。
- [x] 调整 `AI点睛` 渲染结构，让搜索词/人群画像默认展开。
- [x] 调整详情按钮逻辑，只切换 5 步深度分析。
- [x] 补充回归测试锁住默认展开和按钮控制范围。
- [x] 构建、语法检查和相关测试。
- [x] Chrome 真实页面复验默认可见、展开后仍可见、收起后仍可见。
- [x] 回填验证记录、结果复盘和教训。

## 改动摘要
- 将 `热门搜索词` 和 `搜索人群画像与特征` 从 `data-ai-max-detail-section` 折叠组中拆出，改为 `data-ai-max-demand-detail-grid="1"` 常驻内容区。
- 移除常驻内容区默认 `hidden`，插件进入 `AI点睛设置` 后无需点击 `展开详情` 即可看到相关版块。
- `展开详情/收起详情` 的同步和点击逻辑改为只查询 `data-ai-max-detail-section="deep"`，避免收起 5 步分析时连带隐藏热门搜索词。

## 验证记录
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --test tests/keyword-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs`：通过，37/37。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- Chrome DevTools MCP：重载 unpacked extension `fejbonphnhfgfomjjchjijfeippmhnfd`，硬刷新真实 `one.alimama.com` 页面后，通过 `__AM_WXT_KEYWORD_API__.openWizard` 打开插件向导。
- Chrome DevTools MCP：切换 `首页 -> 编辑页` 恢复编辑配置可见态，进入 `AI点睛设置`；默认态 `data-ai-max-detail-section="deep"` 为隐藏，`data-ai-max-demand-detail-grid="1"` 可见。
- Chrome DevTools MCP：默认态无需点击 `展开详情` 即可看到 `热门搜索词` 和 `搜索人群画像与特征`，热门词为 `1元预约 / 一元预约 / 1元预定 / 1分预约 / 洗碗机预约服务 / 洗碗机`。
- Chrome DevTools MCP：点击 `展开详情` 后，按钮变为 `收起详情`，5 步深度分析显示，`热门搜索词` 和 `搜索人群画像与特征` 仍保持可见。
- Chrome DevTools MCP：再次点击收起后，5 步深度分析隐藏，`热门搜索词` 和 `搜索人群画像与特征` 仍保持可见。
- Chrome DevTools MCP：控制台只见页面资源代理错误 `ERR_TUNNEL_CONNECTION_FAILED`，未见本次 `AI点睛` 交互相关异常。
- 本轮未点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。

## 结果复盘
- 根因是 `热门搜索词` 和 `搜索人群画像与特征` 被放进了与 5 步深度分析相同的 `data-ai-max-detail-section` 折叠组，导致默认态隐藏。
- 修复后将逐需求分析区拆成常驻区，`展开详情/收起详情` 只控制 5 步深度分析。
- 验证中发现 `openWizard` 初次进入编辑页时内容页可能处于压缩/隐藏状态；通过真实切换 `首页 -> 编辑页` 可恢复可见配置区，后续浏览器验证应先确认目标面板祖先链均可见，避免用隐藏 DOM 误判。

---

# TODO - 2026-05-10 AI 点睛已选需求下拉同构原生

## 需求规格
- 目标：
  - 对齐原生 `5个需求` 下拉层，而不是打开完整 `AI点睛设置` 弹窗；
  - 点击 `5个需求` 后显示锚定小浮层：全选、右上 `已选：N`、5 个勾选项、底部 `确定` 和 `取消`；
  - 保留 `表达更多流量诉求` 打开完整 AI点睛设置弹窗；
  - 勾选确认后回写 `campaign.aiMaxInfo.selectedDemandList` 并刷新摘要；
  - 全程不点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。
- 成功标准：
  - 插件中 `5个需求` 下拉外观和结构与用户截图一致；
  - `确定` 保存勾选结果，`取消` 不保存；
  - 完整 AI点睛设置弹窗仍只能由 `表达更多流量诉求` 打开；
  - 构建、语法检查、相关测试和 Chrome 真实页面验证通过。

## 执行计划（可核对）
- [x] 定位偏差：`5个需求` 入口不应复用完整设置弹窗。
- [x] 新增独立锚定式 `AI点睛需求` 小浮层。
- [x] 实现全选、单项勾选、已选计数、确定/取消和字段回写。
- [x] 补充样式，使其接近原生白色圆角浮层和蓝色勾选样式。
- [x] 补充静态回归测试。
- [x] 构建、语法检查和相关测试。
- [x] Chrome 真实页面复验小浮层、确定/取消和完整设置入口分离。
- [x] 回填验证记录、结果复盘和教训。

## 改动摘要
- 将 `AI点睛` 右侧 `已选：N个需求` 从完整 `AI点睛设置` 弹窗代理中拆出，改为独立锚定小浮层。
- 小浮层结构对齐原生截图：顶部 `全选`、右上 `已选：N`，中部需求勾选列表，底部 `确定` / `取消`。
- `表达更多流量诉求` 继续打开完整 `AI点睛设置` 弹窗，不与 `5个需求` 复用同一入口。
- `确定` 会写回 `campaign.aiMaxInfo.selectedDemandList`，同步场景 bucket、规范化字段 key、同字段隐藏控件和 AI点睛生成缓存，避免重渲染被旧值覆盖。
- `取消` 只关闭小浮层，不修改隐藏字段和选择状态。
- 补充回归测试，锁住独立小浮层结构、完整弹窗入口分离、确认后状态优先级和多隐藏控件同步。

## 验证记录
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --test tests/keyword-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs`：通过，37/37。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- Chrome DevTools MCP 真实页面：硬刷新 `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSearch&promotionScene=promotion_scene_search_detent` 后，通过插件 API 打开向导进入编辑页。
- Chrome DevTools MCP：等待 `AI点睛` 原生接口生成完成后，点击 `5个需求` 只出现 `#am-wxt-ai-max-demand-popover`，没有出现 `#am-wxt-scene-popup-mask` 完整设置弹窗。
- Chrome DevTools MCP：小浮层文案包含 `全选`、`已选：5`、5 个需求项、`确定`、`取消`，且全选为选中状态。
- Chrome DevTools MCP：取消路径已验证，取消后 `selectedDemandList` 保持 5 个，不保存临时取消勾选。
- Chrome DevTools MCP：取消第 1 个需求后，小浮层计数变为 `已选：4`，全选进入半选态；点击 `确定` 后 `selectedDemandList` 为 4 个、摘要显示 `4个需求`、需求卡片数量为 4，第 1 个需求已移除。
- Chrome DevTools MCP：点击 `表达更多流量诉求` 仍打开完整 `AI点睛设置` 弹窗，包含 `表达更多流量诉求`、`模板推荐（6）`、`屏蔽词设置` 等完整设置内容。
- 本轮未点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。

## 结果复盘
- 根因是之前把右侧 `5个需求` 当成完整设置弹窗的代理触发器，和原生小下拉不一致。
- 第一次修复后真实页暴露“确定后仍回到 5 个”的状态覆盖问题；根因是重渲染优先使用接口生成缓存和同字段旧隐藏控件。最终改为用户确认后的 `campaign.aiMaxInfo` 优先，并同步所有同字段控件。
- 后续同构原生时，必须区分“完整设置弹窗入口”和“摘要下拉选择入口”，不能因为两者修改同一字段就复用同一个弹窗。

---

# TODO - 2026-05-10 AI 点睛展开详情与需求卡片箭头同构原生

## 需求规格
- 目标：
  - 对齐原生 `AI点睛` 点击 `展开详情` 后的深度分析结构；
  - 展开后展示 `第1步：计划定向画像分析` 到 `第5步：搜索需求分析` 的原生式分析容器；
  - 展开内容以打字式逐字显示，避免只有静态空白区域；
  - 需求卡片超过 3 个时补齐右侧灰色箭头，并可切换/滚动查看更多需求；
  - 继续保留需求卡片点击切换 `AI解析`、热门搜索词和搜索人群画像；
  - 全程不点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。
- 成功标准：
  - 插件打开 `AI点睛` 后，点击 `展开详情` 可看到 5 步深度分析容器；
  - 文本在展开时按原生式打字效果出现；
  - 需求卡片右侧灰色箭头可见，点击后能查看更多需求；
  - 点击不同需求卡片仍能切换下方分析、搜索词和人群画像；
  - 构建、语法检查、相关测试和 Chrome 真实页面验证通过。

## 执行计划（可核对）
- [x] 对比用户截图，确认缺少 5 步展开详情、打字式内容和右侧灰色箭头。
- [x] 实现原生式 5 步深度分析结构，并复用真实 `aiMaxInfo/nativeCrowdList` 数据生成摘要。
- [x] 实现展开时逐字显示逻辑和每步详情展开/收起。
- [x] 实现需求卡片横向列表与右侧灰色滚动箭头。
- [x] 补充静态回归测试契约。
- [x] 构建、语法检查和相关测试。
- [x] Chrome 真实页面复验展开详情、打字效果、箭头滚动和需求切换。
- [x] 回填验证记录、结果复盘和教训。

## 改动摘要
- `AI点睛设置` 面板新增原生式 5 步深度分析容器：`第1步：计划定向画像分析`、`第2步：关键词深度分析`、`第3步：流入流失竞对分析`、`第4步：同行定向画像分析`、`第5步：搜索需求分析`。
- 展开 `AI点睛` 详情时，5 步标题按逐字打字方式显示；每个步骤右侧也有 `展开详情/收起详情`，子详情同样逐字显示。
- 5 步摘要复用真实 `campaign.aiMaxInfo`、商品标题、热门搜索词、搜索人群画像和需求列表，不写死预算或伪造提交参数。
- 需求卡片从固定 3 个改为横向列表；超过 3 个时显示右侧灰色 `›` 箭头，点击可滚动查看更多需求。
- 保留需求卡片点击切换能力：切换当前需求后同步更新 `AI解析`、热门搜索词和搜索人群画像。
- 新增静态回归测试，锁住 5 步结构、打字逻辑、右侧箭头和需求滚动/切换事件。

## 验证记录
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --test tests/keyword-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs`：通过，37/37。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- Chrome DevTools MCP 真实页面：硬刷新 `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSearch&promotionScene=promotion_scene_search_detent` 后，通过插件 API 打开向导进入编辑页。
- Chrome DevTools MCP：`AI点睛设置` 可见，DOM 中存在 5 个步骤按钮、5 张需求卡片和右侧灰色 `›` 箭头。
- Chrome DevTools MCP：点击 `展开详情` 后，`data-ai-max-detail-section="deep"` 与 `data-ai-max-detail-section="grid"` 均显示；120ms 时步骤标题处于逐字输出中，1.6s 后 5 步标题完整展示。
- Chrome DevTools MCP：点击第 1 步 `展开详情` 后，子详情先清空再逐字输出，1.2s 后完整展示真实商品相关分析文本。
- Chrome DevTools MCP：可见需求列表 `clientWidth=964`、`scrollWidth=1613`；点击右侧灰色箭头后 `scrollLeft` 从 `0` 变为 `326.5`，左侧可见卡片从第 1 个变为第 2 个。
- Chrome DevTools MCP：点击第 2 张需求卡片后，active 需求从 `一元预约洗碗机省下大笔开销` 切换为 `洗碗机耗材一次买齐省心省力`，`AI解析`、热门搜索词和搜索人群画像同步更新。
- Chrome DevTools MCP：控制台仅见页面资源代理错误 `ERR_TUNNEL_CONNECTION_FAILED` 与原生 `adc` 表达式警告，未见本次插件 `AI点睛` 交互相关异常。
- 本轮未点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。

## 结果复盘
- 根因是此前只补齐了默认态和需求卡片点击态，缺少原生展开态的 5 步分析结构，也没有覆盖需求超过 3 个时的溢出箭头。
- 本轮没有用静态假面板替代原生数据，而是基于 `aiMaxInfo/nativeCrowdList` 生成 5 步摘要并继续复用逐需求的搜索词与人群画像。
- 验证中第一次并行执行 `build`、测试和 `build --check` 产生了读写竞态；之后按 `build -> test/check` 顺序重跑通过。后续涉及生成产物的验证不能把构建写入和读取检查并行执行。

---

# TODO - 2026-05-06 支持起量时间按住鼠标快速选择

## 需求规格
- 目标：
  - 在 `货品全站推广 -> 起量时间地域设置 -> 起量时间 -> 时间段` 中支持按住鼠标左键拖过多个小时快速选择；
  - 保留现有单击切换、多时间段摘要、至少 4 个小时校验和保存映射；
  - 支持拖动选择和拖动取消选择，避免拖动结束后 click 二次反转；
  - 全程不点击原生 `创建完成`、插件 `批量创建` 或任何真实提交入口。
- 成功标准：
  - 按下未选小时并拖过多个小时会连续选中；
  - 按下已选小时并拖过多个小时会连续取消；
  - 单击仍能切换单个小时；
  - 保存后摘要和隐藏字段保持正确；
  - 构建、相关测试和 Chrome DevTools MCP 真实页面复验通过。

## 执行计划（可核对）
- [x] 记录需求与安全边界，复核现有 quickLift 时间条事件实现。
- [x] 实现 pointer drag 选择/取消逻辑并避免 click 二次触发。
- [x] 补充回归测试覆盖拖选契约。
- [x] 构建、语法检查和相关测试。
- [x] 重载真实页面复验按住鼠标拖选和保存字段。
- [x] 回填验证记录、结果复盘和教训。

## 改动摘要
- 在 quickLift 时间条上新增 pointer drag 状态：按住鼠标左键从未选小时开始拖动时连续选中，从已选小时开始拖动时连续取消。
- 将小时范围写入逻辑收敛到 `applyQuickLiftHourRangeSelection()`，拖动过程按经过的小时区间批量更新并只触发一次时间条重绘。
- 拖动开始后短暂抑制随后的 click 事件，避免松开鼠标时把刚选中的小时再次反选；单击路径仍走同一个范围应用函数。
- 保存摘要改为优先读取结构化 `__am.quickLiftLaunchPeriodList` / `__am.quickLiftLaunchAreaList`，并在动态区域重渲染后兜底更新当前可见摘要。
- 货品全站推广的一键起量摘要生成改为按多个连续小时区间展示，避免把 `3点~5点、8点~10点` 压缩成 `3点~10点`。
- 回归测试补充静态契约，锁住左键 pointerdown、pointermove 批量选择、click 抑制、pointer capture、结构化摘要优先和多段摘要生成。

## 验证记录
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --test tests/keyword-custom-preview-submit-parity.test.mjs tests/keyword-custom-popup-config.test.mjs tests/keyword-wizard-entry-regression.test.mjs`：通过，31/31。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- `git diff --check`：通过。
- `node --test tests/*.test.mjs`：通过，430 个测试，428 通过，2 跳过，0 失败。
- Chrome DevTools MCP：重载 unpacked extension `fejbonphnhfgfomjjchjijfeippmhnfd` 并硬刷新真实 `one.alimama.com` 后，打开 API 向导 `货品全站推广`，进入 `起量时间地域设置`。
- Chrome DevTools MCP：在真实页面弹窗内点击 `清空` 后按住鼠标左键从 `3` 拖到 `9`，摘要为 `3点~10点`，选中小时为 `[3,4,5,6,7,8,9]`。
- Chrome DevTools MCP：从已选小时 `5` 拖到 `7` 后连续取消，摘要为 `3点~5点、8点~10点`，选中小时为 `[3,4,8,9]`。
- Chrome DevTools MCP：点击插件弹窗 `确定` 保存后，行内摘要为 `3点~5点、8点~10点｜在全部地域投放`，隐藏字段 `投放时间` 为 `3点~5点、8点~10点`，首日 `timeSpanList` 为 `03:00-05:00` 与 `08:00-10:00` 两段。
- 本轮未点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。

## 结果复盘
- 拖拽选择本身通过后，真实页面暴露了保存后行内摘要仍旧显示 `3点~10点` 的二次问题；根因是货品全站推广的摘要重算层仍按最早开始和最晚结束汇总。
- 最终修复没有只改 DOM 文案，而是把保存摘要、动态区域兜底和货品全站一键起量摘要生成都统一到结构化多段时间上。
- 后续涉及时间条、地域、省市等密集选择控件时，验收必须同时检查弹窗内即时摘要、保存后的行内摘要、隐藏字段和最终结构化字段，不能只看其中一个。

---

# TODO - 2026-05-06 修复插件“组建计划”点击无反应

## 需求规格
- 目标：
  - 复现用户反馈的真实 `one.alimama.com` 页面点击插件 `组建计划` 无反应；
  - 定位是入口按钮、事件绑定、运行时异常、弹窗已存在不可见，还是扩展加载失败；
  - 修复根因，确保点击后用户当前页有明确可见反馈；
  - 全程不点击原生 `创建完成`、插件 `批量创建` 或任何真实提交入口。
- 成功标准：
  - Chrome DevTools MCP 真实页面复现并记录点击前后状态；
  - 修复后点击 `组建计划` 能稳定打开 API 向导；
  - 控制台无阻断性运行时错误；
  - 构建、语法检查和相关回归测试通过；
  - `tasks/lessons.md` 记录本次用户修正对应教训。

## 执行计划（可核对）
- [x] 回顾历史教训与当前工作树，确认不回退无关改动。
- [x] 用 Chrome DevTools MCP 复现点击无反应并抓控制台/DOM 状态。
- [x] 定位并修复入口不可用根因。
- [x] 重新构建、运行相关测试和语法检查。
- [x] 重载真实页面复验 `组建计划` 点击打开向导。
- [x] 回填验证记录、结果复盘和新教训。

## 复现记录
- Chrome DevTools MCP 真实 `one.alimama.com` 页面复现：点击入口会触发 `window.__AM_WXT_KEYWORD_API__.openWizard()`，但 Promise reject，控制台出现 `Uncaught (in promise)`。
- 手动调用并捕获错误后确认根因：`Cannot access 'parseTimeRangeToMinutes' before initialization`。
- DOM 状态：失败后 `#am-wxt-keyword-modal` 已局部创建，但 `#am-wxt-keyword-overlay` 未打开，入口按钮又因面板/弹窗状态不可见，用户看到的就是“点击无反应”。

## 改动摘要
- 将 `parseTimeRangeToMinutes` 和 `formatMinutesToClock` 从 `const` 表达式改为函数声明，避免 `货品全站推广` 前置渲染在 helper 初始化前调用触发 TDZ。
- 给 `组建计划` 入口新增 `openKeywordPlanWizard()` 与 `reportKeywordPlanOpenFailure()`，同时捕获同步异常和 Promise reject；失败时优先打开已有向导弹窗，无法兜底时给当前页可见提示。
- 新增 `tests/keyword-wizard-entry-regression.test.mjs`，锁住 helper 声明方式和入口异常兜底。

## 验证记录
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/keyword-wizard-entry-regression.test.mjs tests/keyword-custom-preview-submit-parity.test.mjs tests/keyword-custom-popup-config.test.mjs tests/site-scene-submit-mode.test.mjs`：通过，41/41。
- `git diff --check`：通过。
- `node --test tests/*.test.mjs`：通过，430 个测试，428 通过，2 跳过，0 失败。
- Chrome DevTools MCP：重载 unpacked extension `fejbonphnhfgfomjjchjijfeippmhnfd` 并硬刷新真实 `one.alimama.com` 后，打开助手面板点击 `组建计划`，`#am-wxt-keyword-overlay.open` 显示为 `flex`，`#am-wxt-keyword-modal` 正常展示 `关键词推广批量建计划 API 向导`。
- Chrome DevTools MCP：点击后 `unhandledrejection` 记录为空，控制台未再出现 `Cannot access 'parseTimeRangeToMinutes' before initialization` 或入口相关 `Uncaught (in promise)`。

## 结果复盘
- 根因不是入口按钮没绑定，而是 `openWizard()` 的运行时异常没有被入口捕获；这类错误必须在用户当前操作位置给可见反馈，不能只依赖控制台。
- 本次 TDZ 来自拼接式源码结构：`render-scene-dynamic-core.js` 前置使用了 `render-scene-dynamic-grid.js` 后面声明的 helper。此类跨切片共享 helper 不应使用会触发 TDZ 的 `const` 表达式。
- 后续修复入口类缺陷，验收必须覆盖“点击动作 -> 弹窗可见 -> 无未捕获 Promise -> 控制台无阻断错误”。

---

# TODO - 2026-05-06 修复货品全站起量时间多时间段选择

## 需求规格
- 目标：
  - 对比真实 `one.alimama.com` 原生 `货品全站推广 -> 一键起量 -> 起量时间地域设置`；
  - 确认原生 `起量时间` 的时间段是否支持多个不连续区间，并记录可见交互；
  - 修复插件同名弹窗中时间段只能保留单个区间的问题；
  - 保存后继续正确写回 `quickLiftBudgetCommand.quickLiftTimeSlot` 与起量地域字段；
  - 全程不点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。
- 成功标准：
  - 插件 `时间段` Tab 支持选择多个不连续时间段；
  - 摘要能表达多段选择，且空选择有明确错误或被禁止保存；
  - `投放时间` 隐藏字段和最终预览组包包含多个区间覆盖的小时集合；
  - 自动化回归测试覆盖 UI 契约和提交字段；
  - `node scripts/build.mjs`、相关 `node --test`、`node --check` 通过；
  - Chrome DevTools MCP 真实页面复验：原生可多选、插件可多选、未触发真实创建请求。
- 非目标：
  - 不重构通用高级设置弹窗；
  - 不重新摸排货品全站所有字段；
  - 不改地域选择逻辑，除非它阻塞时间段保存。

## 执行计划（可核对）
- [x] 回顾 `tasks/lessons.md`、历史 TODO 和当前工作树，确认只做本轮最小增量。
- [x] 用 Chrome DevTools MCP 对比原生 `起量时间` 多时间段交互。
- [x] 只读定位插件时间段状态、渲染、保存和组包链路。
- [x] 实现多时间段选择的最小修复，保留现有弹窗复用结构。
- [x] 补充/更新回归测试。
- [x] 构建并运行相关测试、语法检查。
- [x] 重载真实页面复验插件弹窗与预览组包，确认无真实创建请求。
- [x] 回填改动摘要、验证记录、结果复盘；如用户修正触发新教训，再更新 `tasks/lessons.md`。

## 原生对比记录
- Chrome DevTools MCP 真实页：当前页面为 `onebpSite`，原生 `起量时间地域设置` 弹窗可见 `起量时间`、时间条、`清空`、`起量地域`、地域模板和省市复选。
- 原生时间条可在同一条上点出多个小时块；尝试选择 `3-4`、`6-7`、`12-13`、`16-17` 后，页面显示多个蓝色块，但保存时原生提示 `起量时间：仅支持设置一个连续不少于4h时段`。
- 本轮按用户诉求修复插件的单区间状态模型，允许多时间段选择；保留至少 4 个起量小时的校验，避免空时间或过短时间进入最终字段。

## 改动摘要
- 已把插件 quickLift 时间状态从单个 `{ start, end }` 改为 `selectedHours` 小时集合。
- 保存时将小时集合合并为多个连续区间，写入每天的 `timeSpanList`，再由 `投放时间` 显示为 `3点~5点、8点~10点` 这类多段摘要。
- `quickLiftBudgetCommand.quickLiftTimeSlot` 解析改为支持多个 `x点~y点` 区间，输出合并后的小时列表。

## 验证记录
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/keyword-custom-preview-submit-parity.test.mjs tests/keyword-custom-popup-config.test.mjs tests/site-scene-submit-mode.test.mjs`：通过，39/39。
- `node --test tests/site-scene-item-binding.test.mjs`：通过，6/6。
- `node scripts/build.mjs --check`：通过。
- `git diff --check`：通过。
- `node --test tests/*.test.mjs`：通过，428 个测试，426 通过，2 跳过，0 失败。
- Chrome DevTools MCP 原生对比：真实 `one.alimama.com` `onebpSite` 页面中，原生起量时间条可点出多个蓝色小时块；短散块保存会提示 `起量时间：仅支持设置一个连续不少于4h时段`。
- Chrome DevTools MCP 插件复验：重载 unpacked extension `fejbonphnhfgfomjjchjijfeippmhnfd` 后，打开 API 向导 `货品全站推广` 编辑页；在 `起量时间地域设置` 弹窗中清空后选择 `3、4、8、9`，弹窗摘要为 `3点~5点、8点~10点`，保存后编辑页摘要为 `3点~5点、8点~10点｜在全部地域投放`。
- Chrome DevTools MCP 字段复验：隐藏字段 `__am.quickLiftLaunchPeriodList` 每天的 `timeSpanList` 均包含 `03:00-05:00` 与 `08:00-10:00` 两段，`__am.quickLiftLaunchAreaList` 为 `["all"]`；本轮只点击 `预览请求`，未点击原生 `创建完成`、插件 `批量创建` 或真实投放提交入口。

## 结果复盘
- 根因是插件把原生时间条抽象成单个起止区间，用户点第二段时会覆盖第一段；现已改为小时集合并在保存时合并连续小时，既支持多段 UI，也保持提交字段仍是小时列表。
- 原生页面视觉上可多点选择，但当前短散块保存仍提示连续不少于 4h；插件本轮按用户要求支持多个时间段，同时保留“至少 4 个起量小时”的本地校验。
- 预览页展示的是请求摘要，不展开最终 scene request；最终 `quickLiftBudgetCommand.quickLiftTimeSlot` 多段解析已由 `tests/keyword-custom-preview-submit-parity.test.mjs` 锁定。

---

# TODO - 2026-05-06 `关键词推广 -> 趋势明星` 矩阵页真实运行态验证包

## 需求规格
- 目标：
  - 基于当前 `main` 与最近矩阵页修复记录，固定一条高频回归链路；
  - 覆盖矩阵页 `营销目标=趋势明星` 的目标同步、快捷预设、维度卡片、趋势主题组合新建与生成计划点击链路；
  - 补充最小可维护的自动化断言，避免再次只验证局部入口；
  - 产出真实页面浏览器验收清单，使用 `chrome-devtools` MCP 在 `one.alimama.com` 逐项复验；
  - 全程不真实提交线上计划。
- 成功标准：
  - 自动化断言明确锁住 `关键词推广 -> 趋势明星` 下 `选择趋势主题` 的快捷预设同步、维度卡片添加、新建组合入口和 `campaign.trendThemeList` 写回；
  - 自动化断言覆盖 `生成计划` 成功路径与前置条件失败提示，确保失败反馈显示在当前矩阵页；
  - 真实页面验收按同一条用户路径逐项通过：切换趋势明星、添加趋势主题维度、打开/保存趋势主题组合、补齐矩阵、点击生成计划成功、缺前置条件时显示可见错误；
  - 运行相关 `node --test` 并记录结果；
  - 浏览器复验确认未点击 `立即投放`、`批量创建` 或原生真实提交入口。
- 非目标：
  - 不重构矩阵页或趋势主题弹窗；
  - 不新增泛化矩阵测试框架；
  - 不触发线上计划真实创建；
  - 不处理当前工作树中与本链路无关的既有改动。

## 执行计划（可核对）
- [x] 回顾 `goal-driven`、`tasks/lessons.md` 与最近矩阵页修复记录，明确验收标准。
- [x] 梳理现有测试断言，确认只新增本链路缺口，不复制已有泛化覆盖。
- [x] 补最小自动化验证包，聚焦趋势明星矩阵链路的端到端契约。
- [x] 补浏览器验收清单，逐项覆盖真实运行态、成功路径和失败提示。
- [x] 运行相关 `node --test`、语法或构建同步检查，记录结果。
- [x] 使用 `chrome-devtools` MCP 在真实 `one.alimama.com` 页面逐项复验。
- [x] 回填改动摘要、验证记录、风险覆盖和仍需真实观察的风险。

## 自动化验证设计
- 新增 `tests/matrix-trend-star-runtime-package.test.mjs`，只锁 `关键词推广 -> 趋势明星` 运行链路：目标驱动趋势主题预设、趋势主题组合新建、`campaign.trendThemeList` 物化、`生成计划` 成功/失败路径。
- 扩展 `tests/matrix-plan-config.test.mjs`，补动态 `scene_field:*` 维度物化、源模板暂停、矩阵页目标同步所有启用模板的契约。
- 调整 `tests/matrix-bid-target-cost-package.test.mjs`，把 `智能出价目标包` 限定为 `自定义推广` 推荐维度，避免趋势明星补齐预设把计划改成自定义推广。

## 浏览器验收清单
- [x] 打开真实 `one.alimama.com` 并确认助手运行态已刷新到当前构建产物。
- [x] 打开 `批量建计划/API 向导`，进入矩阵页，场景为 `关键词推广`。
- [x] 在矩阵页切换 `营销目标=趋势明星`，确认高亮目标和编辑页隐藏状态同步。
- [x] 确认快捷预设出现 `选择趋势主题`，且添加后维度类型显示为 `选择趋势主题`。
- [x] 通过维度卡片 `添加维度` 路径新增 `选择趋势主题`，确认不是只能从快捷预设进入。
- [x] 点击常驻 `添加趋势主题组合`，打开趋势主题弹窗，选择/确认后写回维度摘要和可选组合。
- [x] 展开值下拉，确认新建组合可勾选，且新建入口不藏在下拉 panel 内。
- [x] 缺商品或缺矩阵配置时点击 `生成计划`，当前矩阵页显示可见前置条件失败提示。
- [x] 满足商品、策略和矩阵配置后点击 `生成计划`，生成本地计划列表/草稿并回到首页，不点击真实投放提交入口。
- [x] 验证结束检查 Network/日志，确认未触发真实创建计划提交。

## 改动摘要
- 新增趋势明星矩阵运行态验证包与真实浏览器验收清单：`tests/matrix-trend-star-runtime-package.test.mjs`、`tests/browser-checklists/keyword-trend-star-matrix-runtime.md`。
- 修复矩阵组合物化只处理固定 binding 的问题，动态 `scene_field:*` 维度现在会写回计划，趋势主题直连 `campaign.trendThemeList`。
- `生成计划` 成功后暂停源模板，只选择新生成计划，降低后续误点 `立即投放` 时重复提交源模板的风险。
- 真实复验发现趋势明星补齐预设会因 `智能出价目标包` 漂到 `自定义推广`；已改为按当前营销目标分流推荐维度，并让矩阵页 `营销目标=趋势明星` 同步到所有启用源模板。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/matrix-trend-star-runtime-package.test.mjs tests/matrix-plan-config.test.mjs tests/matrix-bid-target-cost-package.test.mjs tests/keyword-trend-theme-setting.test.mjs tests/keyword-search-p0-contract.test.mjs`：通过，45 个测试通过。
- `chrome-devtools` MCP（真实 `one.alimama.com`，店铺 `美的洗碗机旗舰店`）：重载 unpacked extension 后打开 API 向导，进入矩阵页切换 `营销目标=趋势明星`；快捷预设为 `预算值 / 出价方式 / 计划名前缀 / 商品 / 选择趋势主题...`，不再包含 `智能出价目标包`，提示为 `推荐维度 0/5 · 缺 预算值、出价方式、计划名前缀、商品、选择趋势主题；请先回首页添加商品`。
- `chrome-devtools` MCP（趋势主题）：添加 `选择趋势主题` 维度，值下拉仅显示 `清空趋势主题`，常驻 `添加趋势主题组合` 打开趋势主题弹窗并展示真实推荐主题；保存后维度摘要为 `已选 5/6：胶囊洗碗机、迷你洗碗机、消毒烘干一体机等`。
- `chrome-devtools` MCP（失败路径）：无商品时点击 `生成计划`，当前矩阵页显示 `请先回首页添加商品，再回矩阵页点击“补齐5维”或添加“商品”维度后生成计划`。
- `chrome-devtools` MCP（成功路径）：添加真实商品 `739248419669`，补齐后摘要为 `矩阵：开启 ｜ 组合 8 ｜ 批次 4`、`推荐维度 5/5`，维度列表无 `智能出价目标包`；点击 `生成计划` 后首页选中本地生成计划 `32` 个，日志为 `已生成计划 32 个，已追加到首页计划列表（共 36 个），源模板已暂停 4 个`。
- `chrome-devtools` MCP（目标与趋势主题落地）：4 个源模板和前 8 个生成计划均展示为 `趋势明星`，打开生成计划编辑页可见 `趋势主题 / 选择趋势主题 / 已选 5/6：胶囊洗碗机、迷你洗碗机、消毒烘干一体机等`。
- `chrome-devtools` MCP（提交安全）：未点击 `立即投放`、`批量创建` 或原生 `创建完成`；生成前清空 Performance resource timing，生成后未观察到 `/solution/addList.json`、`addList.json`、`create`、`batch` 等可疑创建请求。

## 结果复盘
- 已锁住的风险：趋势明星目标下的快捷预设同步、维度添加顺序、趋势主题弹窗新建组合、趋势主题写回 `campaign.trendThemeList`、缺商品失败提示留在矩阵页、成功生成本地计划、源模板暂停、补齐预设不再把趋势明星漂成自定义推广。
- 仍只能靠真实页面观察的风险：阿里妈妈原生推荐主题数据内容、账号/商品资格、原生页面临时 DOM/文案变更，以及真实提交后的服务端校验结果；本轮按安全边界未真实提交计划。

---

# TODO - 2026-05-05 真正做完货品全站推广原生与插件对比

## 需求规格
- 目标：
  - 沿用真实 `one.alimama.com` 的 `bizCode=onebpSite` 新建计划页；
  - 确认 `场景名称=货品全站推广`，商品使用 `1024883718763`；
  - 逐项点击/展开原生页面可见按钮、卡片、开关、下拉和高级设置，记录默认值、联动项、添加商品前后新增参数；
  - 打开插件 `批量建计划/API 向导` 的 `货品全站推广` 设置，整理配置项、默认值/候选值和字段映射；
  - 输出三类差异：原生有但插件缺失、两边都有但语义或默认值不同、插件有但原生未见。
- 安全边界：
  - 全程使用 Chrome DevTools MCP 验证真实页面；
  - 禁止点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交计划入口；
  - 验证结束前检查 Network/Hook 历史，确认无 `/solution/addList.json` 创建请求。

## 执行计划（可核对）
- [x] 写入本轮完整对比需求、成功标准和提交安全边界。
- [ ] 先用子代理只读梳理插件源码字段、历史记录和测试契约，主线程只负责浏览器实测与最终整合。
- [ ] 用 `chrome-devtools` MCP 确认真实页面、店铺、场景 `货品全站推广`、商品 `1024883718763` 和添加商品前后参数。
- [ ] 逐项点击/展开原生页面可见按钮、卡片、开关、下拉和高级设置，记录默认值、候选值、联动项与不点击原因。
- [ ] 打开插件 `批量建计划/API 向导` 的 `货品全站推广` 设置，记录配置项、默认值、候选值和字段映射。
- [ ] 输出原生 vs 插件差异表，分为 `原生有但插件缺失`、`两边都有但语义或默认值不同`、`插件有但原生未见`。
- [ ] 回填验证记录、结果复盘，并确认 Network 未触发真实创建请求。

## 原生记录
- 待补充。

## 插件记录
- 待补充。

## 差异表

---

# TODO - 2026-05-06 对比关键词推广自定义推广原生与插件批量建计划设置

## 需求规格
- 目标：
  - 打开真实 `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSite`，新建 `关键词推广 -> 自定义计划/自定义推广`，全程不提交；
  - 原生新计划添加全部商品中的商品 `1024883718763`，触发添加商品后才显示的更多参数；
  - 对原生页面中 `关键词推广 -> 自定义推广` 的可见按钮、卡片、开关、下拉、弹窗和高级设置逐项点击/展开，记录默认值、候选值、联动项和需要商品后才出现的参数；
  - 对比插件 `批量建计划/API 向导` 中 `场景名称=关键词推广`、`营销目标=自定义推广` 的配置项、默认值、候选值和组包字段；
  - 查漏补缺：优先补齐原生有但插件缺失、插件语义/默认值与原生不一致的设置。
- 安全边界：
  - 禁止点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交计划入口；
  - 点击提交相关按钮前必须停止并重新确认，不用真实提交证明字段；
  - 验证结束前检查 Network/Hook 历史，确认未触发 `/solution/addList.json`、创建计划或批量创建请求。
- 成功标准：
  - 原生页面完成商品 `1024883718763` 添加后的参数摸排，且每个可见设置入口均已展开或记录不可点击原因；
  - 插件同场景同目标设置清单与原生清单完成差异表；
  - 必要代码补齐后，相关自动化测试、构建同步、语法检查通过；
  - Chrome DevTools MCP 真实页面复验插件设置可见且不触发真实提交；
  - `tasks/todo.md` 回填验证记录、差异表和结果复盘。

## 执行计划（可核对）
- [x] 写入本轮完整对比需求、成功标准和提交安全边界。
- [x] 梳理插件 `关键词推广 -> 自定义推广` 字段、默认值、候选值、提交映射和已有测试契约。（按当前系统工具约束未派子代理，主线程只读完成）
- [x] 用 `chrome-devtools` MCP 打开真实页面，确认店铺/账号状态、进入新建 `关键词推广 -> 自定义计划/自定义推广`。
- [x] 添加全部商品中的商品 `1024883718763`，记录添加前后新增参数。
- [x] 逐项点击/展开原生可见按钮、卡片、开关、下拉和高级设置，记录默认值、候选值、联动项与禁点提交入口。
- [x] 打开插件 `批量建计划/API 向导`，切换 `场景名称=关键词推广`、`营销目标=自定义推广`，记录配置项和字段映射。
- [x] 输出原生 vs 插件差异表，并按最小侵入原则补齐缺口。
- [x] 构建、测试、语法检查和 Chrome DevTools MCP 真实页面复验。
- [x] 回填验证记录、结果复盘，并确认 Network 未触发真实创建请求。

## 原生记录
- 真实页面：`one.alimama.com`，店铺 `美的洗碗机旗舰店`，店铺 ID `2957960066`；进入 `关键词推广 -> 自定义推广`，全程未点击 `创建完成`。
- 已在 `全部商品` 中搜索并添加商品 `1024883718763`：商品名 `一元预约【洗碗机1元预约 送洗碗机专用洗涤耗材】单拍不 发 货`，添加后页面显示 `添加商品 1 / 30`。
- 商品添加后出现/确认的核心字段：
  - `开启冷启加速`：默认开启；本商品组合下 `新品冷启动 0 个宝贝`、`新广告加速 1 个宝贝`，带 `详情`。
  - `AI点睛`：默认 `开`；开启时原生只支持 `智能出价`，并提示关闭后才可使用手动出价；关闭后出现 `智能出价 / 手动出价`。
  - `出价目标`：开启 AI 点睛时可见 `获取成交量（升级净成交）/ 增加收藏加购量 / 增加点击量 / 稳定投产比`；关闭 AI 点睛后补充出现 `相似品跟投 / 提升词市场渗透`。
  - `设置平均直接净成交成本（非必要）`：默认关闭；成交口径自动切到 `获取净成交`。
  - `预算类型`：默认 `日均预算`，可切 `每日预算`；添加商品后 AI 小万建议预算约 `890` 元，属于实时建议值。
  - `关键词设置`：关闭 AI 点睛后出现，摘要为开启流量智选、关键词组合与自选词数量。
  - `人群设置 / 人群优化目标`：默认开启 `设置优先投放客户`，包含新客户获取、流失老客挽回、高价值客户获取及权重 `1.1 / 1.5 / 1.3`。
  - `高级设置`：入口为 `投放资源位/投放地域/投放时间`，默认全部地域、全部时段，资源位默认开启。
  - `设置商品推广方案 / 案例魔方`：出现同行 GMV、订单量、ROI 等指标，以及 `搜更多 / 详情 / 一键抄作业`；该区属于原生建议/抄作业能力，不是独立提交字段。
  - `创意设置`：提示当前方案暂不支持设置创意，默认开启智能创意。

## 插件记录
- 修复前：插件 `关键词推广 -> 自定义推广` 有 `流量智选`，但缺少原生独立 `AI点睛` 行；`出价方式` 默认同时展示 `智能出价 / 手动出价`，没有实现 AI 点睛开启时仅支持智能出价的约束。
- 修复后：
  - 编辑页在 `营销目标=自定义推广` 下新增 `AI点睛` 行，默认 `开启`。
  - `AI点睛=开启` 时仅显示 `智能出价`，并写入隐藏字段 `campaign.aiMaxSwitch=1`、`campaign.aiMaxInfo={"aiMaxSwitch":1}`。
  - `AI点睛=关闭` 时显示 `智能出价 / 手动出价`；切到手动出价后隐藏 `出价目标`，出现原生同构 `人群设置 -> 添加精选人群` 与 `投放资源位/投放地域/分时折扣`。
  - 提交映射新增 `AI点睛 -> campaign.aiMaxSwitch / campaign.aiMaxInfo.aiMaxSwitch`。
  - 矩阵页场景维度补充 `AI点睛`，支持 `开启 / 关闭` 作为 `关键词推广 -> 自定义推广` 的批量维度。
  - 编辑页预算类型实际值为 `day_average`，对齐原生 `日均预算`；预算金额仍保留用户可配置默认 `100`，不硬编码商品实时建议值。

## 差异表
- `AI点睛` 独立开关：原生有，插件缺失；已补齐为顶层设置行。
- `AI点睛` 与出价方式联动：原生开启时仅智能出价，关闭后才有手动出价；插件已补齐联动和强制回智能出价逻辑。
- `aiMaxSwitch/aiMaxInfo` 提交字段：原生抓包历史显示开关进入 `campaign`；插件已补提交映射和 direct 字段。
- `预算类型`：原生默认 `日均预算`；插件编辑页实际 `day_average`，无需改；预算金额 `890` 是商品后实时建议值，不做硬编码。
- `案例魔方 / 一键抄作业`：原生有，但属于策略建议与批量套用能力，不是稳定的普通计划参数；本轮记录，不纳入提交字段补丁。
- `创建完成 / 批量创建 / 立即投放`：均未点击。

## 验证记录
- `node scripts/build.mjs`：通过，已生成根 userscript、package 和 `dist/extension`。
- `node scripts/build.mjs --check`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/keyword-custom-native-parity-ui.test.mjs tests/keyword-custom-settings-sync.test.mjs tests/keyword-custom-popup-config.test.mjs tests/keyword-custom-preview-submit-parity.test.mjs tests/matrix-plan-config.test.mjs`：77/77 通过。
- `node --test tests/*.test.mjs`：431 个测试，429 通过、2 个既有条件跳过、0 失败。
- Chrome DevTools MCP 真实页面复验：
  - 已在 `chrome://extensions/?id=fejbonphnhfgfomjjchjijfeippmhnfd` 点击 `Reload` 重载 unpacked extension；
  - 真实 `one.alimama.com` 页面刷新后打开插件 API 向导，切到 `编辑页 -> 关键词推广 -> 自定义推广`；
  - 确认默认 `AI点睛=开启`，`campaign.aiMaxSwitch=1`，`campaign.aiMaxInfo={"aiMaxSwitch":1}`，`bidMode=smart`，不显示 `手动出价`；
  - 切 `AI点睛=关闭` 后确认 `campaign.aiMaxSwitch=0`，`campaign.aiMaxInfo={"aiMaxSwitch":0}`，`手动出价`出现；点击 `手动出价` 后 `bidMode=manual`，`出价目标`隐藏，`添加精选人群/编辑人群`出现；
  - 再切回 `AI点睛=开启` 后确认自动回到 `bidMode=smart`，手动出价消失。
- Network/performance 检查：未发现 `/solution/addList.json`、创建计划或批量创建请求。

## 结果复盘
- 原生商品后新增字段里，真正影响提交契约的缺口集中在 `AI点睛`，本轮已按最小侵入方式补齐 UI、提交映射、矩阵维度和测试。
- `流量智选` 保留为手动关键词/词包能力，不再误当作原生 `AI点睛` 的替代项。
- 实时预算建议和案例魔方属于原生动态建议能力，当前插件保留可配置入口，不把实时值或抄作业能力硬编码为批量参数。

## 用户修正 - AI点睛弹窗设置缺失
- 触发：用户指出“AI点睛的原生网页中弹窗设置，在插件里没有”。
- 修正规格：
  - 重新用 Chrome DevTools MCP 进入真实 `关键词推广 -> 自定义推广` 原生页面，在不提交前提下打开 `AI点睛` 的设置弹窗；
  - 记录弹窗内的稳定字段、默认值、候选项、保存/取消行为和对应隐藏提交字段；
  - 插件里不能只保留顶层 `开启/关闭`，需要按原生同构补齐结构化弹窗入口，并把弹窗保存结果回写到 `campaign.aiMaxInfo`；
  - 若原生弹窗含推荐值或账号实时诊断值，只记录不硬编码，优先补稳定枚举/开关/阈值字段。
- 执行计划：
  - [x] 用 DevTools 复查真实原生 `AI点睛` 弹窗字段，不点击 `创建完成`。
  - [x] 定位插件场景弹窗复用点，选择最小侵入实现方案。
  - [x] 补插件 `AI点睛` 弹窗 UI、字段回写和提交映射。
  - [x] 更新回归测试与构建产物。
  - [x] 运行自动化测试和真实页面验证，检查无创建请求。

### 原生补充记录
- Chrome DevTools MCP 真实页：`one.alimama.com`，店铺 `美的洗碗机旗舰店`，在 `关键词推广 -> 自定义推广` 添加商品后复查 `AI点睛` 区域，未点击 `创建完成`。
- 原生 `AI点睛=开` 后显示：`表达更多流量诉求`、`已完成深度搜索`、`展开详情`、`已选：5个需求`，并展示 5 个搜索需求卡片、`AI解析`、`热门搜索词`、`搜索人群画像与特征`。
- 点击 `表达更多流量诉求` 后出现结构化设置：流量诉求输入、`模板`、`屏蔽词 0`、`方案解析`。
- 点击 `模板` 后原生展示 6 个模板：`提升商品质量分`、`核心流量竞争`、`热门流量追踪`、`低成本稳增长`、`爆品拉新破圈`、`新品快速测款`。
- 点击 `屏蔽词 0` 后原生弹出 `屏蔽词设置`：`中心词屏蔽 0/10`、`精确词屏蔽 0/100`、过滤词输入、`添加屏蔽词`、`确定/取消`。
- 点击 `已选 5个需求` 后原生可见 `全选`、5 个需求复选项、`确定/取消`。

### 改动摘要
- 插件 `关键词推广 -> 自定义推广` 在 `AI点睛=开启` 时新增 `AI点睛设置` 面板，补齐 `表达更多流量诉求`、需求卡片、深度搜索状态、AI 解析、热门搜索词和人群画像展示。
- 新增 `AI点睛设置` 弹窗，支持 6 个模板应用、中心词/精确词屏蔽词维护、5 个需求全选/单选，并保存回写到 `campaign.aiMaxInfo`。
- `campaign.aiMaxInfo` 由单一开关扩展为结构化草稿：`aiMaxSwitch`、`trafficAppeal`、`selectedDemandList`、`demandList`、`centerShieldWordList`、`exactShieldWordList` 等；`campaign.aiMaxSwitch` 仍保持同步。
- `AI点睛=关闭` 仍隐藏设置面板并恢复 `智能出价 / 手动出价`；再次开启会回到智能出价约束。
- 回归测试补齐原生同构 UI、弹窗触发、字段回写和摘要更新断言。

### 验证记录
- `node scripts/build.mjs`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/keyword-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs tests/keyword-custom-preview-submit-parity.test.mjs`：39/39 通过。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/*.test.mjs`：432 个测试，430 通过、2 个既有条件跳过、0 失败。
- `bash scripts/review-team.sh`：通过；构建同步、架构/安全检查、语法、全量回归测试和版本一致性均通过。
- Chrome DevTools MCP：重载 unpacked extension 后，真实 `one.alimama.com` 插件编辑页 `关键词推广 -> 自定义推广` 已显示 `AI点睛设置` 面板，摘要初始为 `已选：5个需求｜屏蔽词 0`。
- Chrome DevTools MCP：打开插件 `表达更多流量诉求`，确认弹窗含 `AI点睛设置`、流量诉求输入、6 个模板、`屏蔽词设置`、`中心词屏蔽`、`精确词屏蔽` 和 `已选需求`。
- Chrome DevTools MCP：在插件弹窗应用 `核心流量竞争` 模板、添加中心词屏蔽 `免安装` 并保存后，行内摘要更新为 `已选：5个需求｜屏蔽词 1`，隐藏 `campaign.aiMaxInfo` 正确保留 5 个需求与屏蔽词。
- Chrome DevTools MCP：保存链路验证完成后，已把当前浏览器草稿恢复为默认流量诉求、5 个需求、0 个屏蔽词，避免遗留验证数据。
- Chrome DevTools MCP：切 `AI点睛=关闭` 后 `campaign.aiMaxSwitch=0`、设置面板消失、`手动出价` 恢复；再切回 `开启` 后设置面板恢复，仅显示智能出价提示。
- Network/performance 检查：未观察到 `/solution/addList.json`、创建计划或批量创建请求；本轮未点击原生 `创建完成`、插件 `批量创建` 或 `立即投放`。

### 结果复盘
- 这次缺口不是顶层开关，而是原生 `AI点睛` 添加商品后出现的二级结构化配置；插件已按弹窗级能力补齐，避免继续把 `AI点睛` 误简化成开关。
- 真实原生内容里包含商品/账号相关的诊断文案，本轮只固化稳定入口、模板、屏蔽词和需求选择结构，动态推荐值保留为可编辑草稿，不硬编码服务端实时结果。
- 后续继续对比关键词自定义推广时，所有带 `表达/设置/详情/已选` 的入口都必须打开验证，不能只看默认折叠态。

## 用户修正 - AI点睛设置真实点击不可用
- 触发：用户反馈“无法点击的”。
- 修正规格：
  - 复现插件 `AI点睛设置` 中 `表达更多流量诉求` / 摘要按钮的真实鼠标点击路径，不用脚本点击替代；
  - 定位是点击命中层级、事件绑定时序、重渲染后旧节点、样式遮挡还是按钮语义问题；
  - 修复后必须通过 Chrome DevTools MCP 的真实 `click` 操作打开弹窗；
  - 全程不点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。
- 执行计划：
  - [ ] 用 DevTools 真实点击复现不可点击并记录 DOM/事件状态。
  - [ ] 修复插件点击入口，优先让按钮自身和摘要代理都走同一稳定事件路由。
  - [ ] 补充回归测试锁定真实事件委托/按钮可点击契约。
  - [ ] 构建、测试、重载扩展并在真实页面用 MCP click 复验。
  - [ ] 回填验证记录、结果复盘和教训。

## 原生补查 - 添加商品与 AI点睛关开联动
- 触发：用户要求“请在原生网页中，点击商品与关闭打开AI点睛看看”；随后纠正“添加商品，不是商品点击”。
- 安全边界：只在原生页面观察 `添加商品`、`AI点睛` 关闭/开启和可见联动，不点击 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。
- 执行计划：
  - [x] 关闭插件遮罩，回到真实原生 `关键词推广 -> 自定义推广` 新建计划页面。
  - [x] 点击原生 `添加商品` 入口，记录添加商品后是否触发 AI 点睛内容变化。
  - [x] 原生关闭 `AI点睛`，记录设置面板、出价方式、关键词/人群/高级设置变化。
  - [x] 原生重新开启 `AI点睛`，记录设置面板和商品相关 AI 分析是否恢复。
  - [x] 回填观察结论。
- 原生观察记录：
  - 在 `添加商品` 弹窗切到 `全部商品`，用 `商品ID` 搜索 `1024883718763`，命中商品 `一元预约【洗碗机1元预约 送洗碗机专用洗涤耗材】单拍不 发 货`，点击行内 `添加` 后计数从 `已添加：0 / 30` 变为 `已添加：1 / 30`，再点弹窗 `确定` 返回计划页。
  - 添加商品后，主页面显示 `添加商品 1 / 30`，已选商品卡片出现；冷启加速自动勾选，`新广告加速` 包含 `1` 个宝贝；AI 点睛区域出现 `表达更多流量诉求`、深度解析步骤和商品画像/竞对分析，并给出 `日均预算 890`、预计点击量 `2747` 次。
  - 关闭原生 `AI点睛` 后，AI 深度解析和流量诉求区域消失；`出价方式` 从单一 `智能出价` 扩展为 `智能出价` / `手动出价`；`出价目标` 增加 `相似品跟投`、`提升词市场渗透`；下方出现 `关键词设置`、`人群设置` 以及人群价值倍数等配置，`高级设置` 摘要变为 `2` 个投放位置。
  - 重新开启原生 `AI点睛` 后，AI 深度解析和 `表达更多流量诉求` 恢复；`出价方式` 回到只展示 `智能出价`；`出价目标` 回到 `获取成交量`、`增加收藏加购量`、`增加点击量`、`稳定投产比` 四项；`关键词设置` 不再作为独立配置区展示，`高级设置` 摘要回到 `1` 个投放位置。
- 截图记录：
  - `/tmp/native-after-add-target-product.png`
  - `/tmp/native-ai-off-after-target-product.png`
  - `/tmp/native-ai-on-after-reopen-target-product.png`
  - `/tmp/native-ai-on-complete-target-product.png`

## 功能补齐 - 插件添加商品后 AI点睛关开联动
- 触发：用户要求“补充插件里这个功能”，指向原生页添加商品后 `AI点睛` 开/关联动。
- 需求规格：
  - 插件 `关键词推广 -> 自定义推广` 添加商品后，应像原生一样刷新 AI 点睛相关展示，而不是只显示顶层开关；
  - `AI点睛=开启` 且已有商品时，展示 AI 深度解析/流量诉求区域、商品相关分析、预算建议和智能出价约束；
  - `AI点睛=关闭` 后，隐藏 AI 深度解析/流量诉求区域，恢复 `智能出价 / 手动出价`、额外出价目标、关键词设置、人群设置等可配置入口；
  - 重新开启后，恢复 AI 点睛分析区，出价方式回到仅智能出价，出价目标收敛到原生开启态；
  - 全程不点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。
- 成功标准：
  - 自动化测试覆盖添加商品后 AI 点睛展示、开关关闭/开启的 UI 和字段联动；
  - 构建、语法检查、相关测试和全量关键回归通过；
  - Chrome DevTools MCP 在真实 `one.alimama.com` 插件页面验证：添加/绑定商品、切 AI 点睛关/开，页面可见状态与原生观察一致；
  - 不引入真实创建请求。
- 执行计划：
  - [x] 梳理当前插件添加商品、`campaign.aiMaxSwitch`、出价方式、关键词/人群设置的渲染与提交链路。
  - [x] 实现添加商品后 AI 点睛展示刷新与默认分析数据生成。
  - [x] 实现 AI 点睛关闭/开启时的出价方式、目标、关键词/人群区块联动。
  - [x] 补充回归测试并运行构建/测试。
  - [x] 重载真实页面，用 Chrome DevTools MCP 验证插件交互。
  - [x] 回填改动摘要、验证记录和结果复盘。

### 改动摘要
- 添加商品、移除商品、上移/下移、全部添加、清空商品后都会触发 `renderSceneDynamicConfig()`，让 `AI点睛` 区块跟随商品池即时刷新。
- `AI点睛=开启` 且已有商品时，插件会基于首个已添加商品生成 `campaign.aiMaxInfo`：包含 `itemId`、商品标题、搜索需求、热门搜索词、人群画像、AI解析和 `AI小万建议` 预算/点击量。
- `AI点睛=开启` 但未添加商品时，先展示“添加商品后可生成 AI 点睛投放内容和预算建议”的等待面板。
- `AI点睛=开启` 时出价方式收敛为智能出价，出价目标只保留 `获取成交量 / 增加收藏加购量 / 增加点击量 / 稳定投产比`，并隐藏 `关键词设置 / 人群设置 / 人群优化目标`。
- `AI点睛=关闭` 后恢复 `智能出价 / 手动出价`、`相似品跟投 / 提升市场渗透` 等自定义推广目标，以及关键词和人群配置入口。
- 增补对齐：自定义推广关闭 AI点睛时，`market_penetration` 的插件展示文案从旧 `提升市场渗透` 改为原生 `提升词市场渗透`，底层值和提交映射保持不变。

### 验证记录
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 和 extension 产物。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/keyword-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs tests/keyword-custom-preview-submit-parity.test.mjs`：通过，41/41。
- `node scripts/build.mjs --check`：通过。
- `git diff --check`：通过。
- `node --test tests/*.test.mjs`：通过，434 个测试，432 通过，2 跳过，0 失败。
- `bash scripts/review-team.sh`：通过，包含构建同步、依赖契约、架构、安全、语法、全量回归和版本一致性检查。
- Chrome DevTools MCP：重载 unpacked extension `fejbonphnhfgfomjjchjijfeippmhnfd` 并硬刷新真实 `one.alimama.com` 后，确认 `page.bundle.js` 包含本轮新增的等待面板、AI开启目标白名单和添加商品重渲染逻辑。
- Chrome DevTools MCP：打开插件 API 向导，清空已添加商品后，`AI点睛=开启` 显示等待面板；通过插件 `添加` 指定商品 `1024883718763` 后，已添加商品变为 `1`，AI点睛详情区立即出现。
- Chrome DevTools MCP：添加商品后 `campaign.aiMaxInfo` 写入 `itemId=1024883718763`、商品标题 `一元预约【洗碗机1元预约 送洗碗机专用洗涤耗材】单拍不 发 货`、搜索词 `洗碗机 / 洗碗机预约 / 预约洗碗机`、人群画像、AI解析和预算建议 `890` / 点击量 `2747`。
- Chrome DevTools MCP：`AI点睛=开启` 时，出价方式只剩 `智能出价`，出价目标只剩 `获取成交量 / 增加收藏加购量 / 增加点击量 / 稳定投产比`，`关键词设置 / 人群设置 / 人群优化目标` 不显示。
- Chrome DevTools MCP：切到 `AI点睛=关闭` 后，AI解析区消失，出价方式恢复 `智能出价 / 手动出价`，出价目标恢复 `相似品跟投 / 提升市场渗透` 等 6 项，关键词和人群相关设置恢复显示；再次开启后恢复 AI 分析区并隐藏这些入口。
- Chrome DevTools MCP：`performance` 资源列表中没有 `create / batch / submit / save / launch` 等真实创建或投放提交请求；本轮未点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。
- 截图：`/tmp/plugin-ai-max-after-add-target-product.png`。
- 2026-05-07 增补验证：复查原生记录发现关闭 AI点睛后的目标文案为 `提升词市场渗透`，已补齐插件展示文案；`node --test tests/keyword-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs tests/keyword-custom-preview-submit-parity.test.mjs` 通过，41/41。
- 2026-05-07 增补验证：`node --check "阿里妈妈多合一助手.js"`、`node scripts/build.mjs --check`、`bash scripts/review-team.sh` 均通过。
- 2026-05-07 增补验证：Chrome DevTools MCP 重载插件并硬刷新真实页后，通过插件搜索并添加 `1024883718763`，关闭 AI点睛后出价目标显示 `获取成交量 / 相似品跟投 / 提升词市场渗透 / 增加收藏加购量 / 增加点击量 / 稳定投产比`，其中底层值仍为 `market_penetration`；`performance` 中无真实创建/提交请求。

### 结果复盘
- 根因是插件原先只在商品列表区域更新添加结果，没有把商品池变化反向驱动场景动态设置区；所以原生添加商品后出现的 AI 深度解析和预算建议，在插件里停留在“顶层开关”级别。
- 修复点没有新增独立状态源，而是复用现有 `addedItems` / `draft.addedItems` 作为 AI点睛生成上下文，并通过统一提交入口触发场景区重渲染，避免商品池和场景字段脱节。
- 开关联动必须同时验收“添加商品前、添加商品后、关闭、再次开启”四个状态；只看开关本身会漏掉出价目标、人群/关键词入口和隐藏字段的差异。
- 文案差异也要按原生状态分别看：同一个底层目标 `market_penetration` 在自定义推广关闭 AI点睛时原生展示为 `提升词市场渗透`，不能复用其他场景里的通用 `提升市场渗透` 文案。

---

## 修复 - AI点睛内容改为原生自动生成数据驱动
- 触发：用户指出插件 AI点睛内容固定写死；原生 `关键词推广 -> 自定义推广` 是添加商品后开启 AI点睛自动跑出对应设置。
- 需求规格：
  - 插件添加商品后若 `AI点睛=开启`，必须触发/复用原生页面同类接口生成的真实 AI点睛数据；
  - 不再用商品标题本地拼出需求、搜索词、人群画像、AI解析、预算建议等内容；
  - 接口未返回前显示生成中/等待状态，接口失败时显示明确失败状态，并保留手动打开 AI点睛设置弹窗的能力；
  - 仍保留 AI点睛开关、出价方式、出价目标、关键词/人群区块显隐联动；
  - 全程不点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。
- 成功标准：
  - 源码中不存在 `890`、`2747` 这类写死预算/点击量建议，不存在根据商品标题硬拼搜索需求的展示路径；
  - 添加商品后会发起原生 AI点睛相关请求，并将返回结构归一化为 `campaign.aiMaxInfo`；
  - 自动化测试覆盖“无接口结果不伪造内容”“接口返回后渲染真实内容”“失败状态可见”；
  - Chrome DevTools MCP 真实页面验证：添加商品 `1024883718763` 后，AI点睛内容来自网络返回/原生状态，不触发真实创建请求。
- 执行计划：
  - [x] 记录本次用户纠正并更新 `tasks/lessons.md`。
  - [x] 抓取原生添加商品后 AI点睛相关请求、响应和字段结构。
  - [x] 设计插件内异步生成状态和请求缓存，替换本地推导。
  - [x] 实现真实接口数据归一化、渲染、失败/等待状态。
  - [x] 更新测试，删除写死内容断言。
  - [x] 构建、全量回归和审查脚本。
  - [x] Chrome DevTools MCP 重载扩展并真实页面复验。
  - [x] 回填改动摘要、验证记录和结果复盘。

### 改动摘要
- 已删除 AI点睛面板里基于商品标题本地拼需求、搜索词、人群画像、预算 890、点击 2747 的默认生成路径；无原生返回时只展示生成中/失败态。
- 已接入原生 `ai/chat/businessTalk.json` 事件流，解析 `additionalData.aiMaxInfo / crowdList / shieldWords` 并归一化写入 `campaign.aiMaxInfo`。
- 已补齐 `algo/getBudgetSuggestion.json` 和 `algo/getEffectPrediction.json`，预算请求包含 `campaign` 上下文，预算/点击建议来自接口返回。
- 已保留 AI点睛开关联动：开启时强制智能出价并隐藏独立关键词/人群设置；关闭后恢复原生目标集合和关键词/人群配置。

### 验证记录
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/keyword-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs tests/keyword-custom-preview-submit-parity.test.mjs`：通过，41/41。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/*.test.mjs`：通过，434 个测试，432 通过，2 跳过。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- Chrome DevTools MCP：重载 unpacked extension `fejbonphnhfgfomjjchjijfeippmhnfd` 并硬刷新真实 `one.alimama.com` 后，打开插件 API 向导，添加商品 `1024883718763`，进入 `关键词推广 -> 自定义推广` 编辑页。
- Chrome DevTools MCP：插件先显示 `AI点睛正在按原生接口生成投放内容，请稍候...`，随后展示 `表达更多流量诉求`、5 个原生需求、热门搜索词、人群画像、`AI小万建议`。
- Chrome DevTools MCP Network：确认触发 `POST https://ai.alimama.com/ai/chat/businessTalk.json`、`POST https://one.alimama.com/algo/getBudgetSuggestion.json`、`POST https://one.alimama.com/algo/getEffectPrediction.json`，且均 200。
- Chrome DevTools MCP：最终插件可见预算/点击为 `预计可获得点击量 2747 次，建议日均预算 890 元`，来自本轮接口返回；提交防护 `window.__AM_CREATE_GUARD__` 为空，未点击 `创建完成`、`批量创建`、`立即投放`。

### 结果复盘
- 根因是插件把 AI 自动生成内容当作 UI 兜底，实际应用了本地固定模板；修复后生成内容必须先经过原生接口返回和状态缓存。
- 复验时发现预算接口需要完整 `campaign` 上下文，否则返回 `计划不能为空`；已补齐后再用真实页面证明预算和点击预估能正常显示。
- 后续凡是 AI小万/AI点睛/智能推荐类内容，都必须验证 Network 返回与 UI 展示一致，不能只看页面上有内容。

---

# TODO - 2026-05-05 细比并修复一键起量时间地域原生差异

## 需求规格
- 目标：
  - 重新打开真实 `one.alimama.com` 原生 `货品全站推广` 新建计划，并添加商品 `1024883718763`；
  - 打开原生 `一键起量` 的 `起量时间地域设置`，逐项记录弹窗标题、Tab、提示文案、时间控件、地域控件、默认值、按钮和保存行为；
  - 打开插件同名弹窗逐项对比，修复与原生不一致的交互和文案；
  - 全程不点击 `创建完成`、`批量创建` 或任何会真实提交计划的按钮。
- 成功标准：
  - `起量时间地域设置` 插件弹窗的可见结构和关键交互与原生一致；
  - 不混入通用高级设置里的无关能力；
  - 保存后摘要、隐藏字段和最终 `quickLiftBudgetCommand.quickLiftTimeSlot` / `quickLiftBudgetCommand.quickLiftLaunchArea` 映射正确；
  - 构建、回归测试、审查脚本与真实页面复验通过。

## 执行计划（可核对）
- [x] 记录本轮用户纠正、成功标准和安全边界。
- [ ] 用 Chrome DevTools MCP 抓取原生弹窗实际结构和保存行为。
- [ ] 对比插件弹窗，定位所有可见差异和字段差异。
- [ ] 实现最小修复，并补充回归测试。
- [ ] 构建、运行相关/全量测试和审查脚本。
- [ ] 重载扩展后在真实页面复验插件弹窗。
- [ ] 回填改动摘要、验证记录、结果复盘和教训。

## 原生对比记录
- 待抓取。

## 改动摘要
- 待执行。

## 验证记录
- 内置 `mcp__chrome_devtools__list_pages` 失败：`Could not find DevToolsActivePort for chrome at /Users/liangchao/Library/Application Support/Google/Chrome/DevToolsActivePort`。
- `curl http://127.0.0.1:9222/json/version`：通过，阿里妈妈测试 Chrome 调试端口健康，后续通过 9222 DevTools MCP 连接。

## 结果复盘
- 待执行。

---

# TODO - 2026-05-05 修复一键起量时间地域弹窗

## 需求规格
- 目标：
  - 将 `货品全站推广` 插件编辑页的一键起量 `起量时间地域设置` 从两个自由文本输入改为原生式弹窗；
  - 弹窗至少覆盖原生可见的时间段设置、清空、地域自定义/模板、保存模板、首字母/地理区、省市复选、确定/取消；
  - 写回字段必须继续生成 `quickLiftBudgetCommand.quickLiftTimeSlot` 与 `quickLiftBudgetCommand.quickLiftLaunchArea`；
  - 真实页面验证只打开和保存插件弹窗，不点击 `批量创建` 或原生 `创建完成`。
- 成功标准：
  - 插件 `一键起量` 行显示可点击的 `起量时间地域设置`；
  - 点击后弹窗结构与现有原生式高级设置弹窗一致，能编辑时间和地域；
  - 保存后摘要、隐藏字段和提交映射同步；
  - 构建、相关回归测试和真实 `one.alimama.com` 浏览器验证通过。

## 执行计划（可核对）
- [x] 记录本轮需求、成功标准和提交安全边界。
- [x] 复用现有高级设置弹窗能力定位最小改动点。
- [x] 修复一键起量弹窗入口、隐藏字段和摘要写回。
- [x] 补充回归测试覆盖 UI 与提交映射。
- [x] 构建并运行相关/全量测试。
- [x] 重载扩展后在真实 `one.alimama.com` 复验。
- [x] 回填改动摘要、验证记录和结果复盘。

## 改动摘要
- 将 `openKeywordAdvancedSettingPopup` 参数化，保留默认三 Tab 高级设置，同时支持隐藏资源位 Tab、定制标题、时间 Tab 文案和字段绑定。
- `货品全站推广` 的 `一键起量` 行改为 `起量时间地域设置` 弹窗按钮，内部使用结构化隐藏字段保存时间段与地域，外层 `投放时间`/`投放地域` 只作为提交映射字段。
- 新增一键起量弹窗保存链路：保存后更新摘要，并把结构化时间段转换为 `quickLiftBudgetCommand.quickLiftTimeSlot` 可用的小时串，把地域转换为 `quickLiftBudgetCommand.quickLiftLaunchArea`。
- 补充回归测试覆盖弹窗入口、隐藏字段、提交映射、可配置高级设置弹窗，以及人群推广高级设置参数化后的兼容契约。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/keyword-custom-preview-submit-parity.test.mjs tests/keyword-custom-popup-config.test.mjs tests/site-scene-submit-mode.test.mjs`：通过，39 个测试通过。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/crowd-custom-native-parity-ui.test.mjs`：通过，11 个测试通过。
- `git diff --check`：通过。
- `node --test tests/*.test.mjs`：通过，425 个测试中 423 通过、2 个既有 AgentCluster 条件跳过、0 失败。
- `bash scripts/review-team.sh`：通过，构建同步、架构安全、语法、回归测试和版本一致性检查均通过。
- `chrome-devtools` MCP（真实插件页）：重载 unpacked extension 后刷新 `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSite`，打开助手 v7.02 的 API 向导并切到 `场景配置：货品全站推广`；`一键起量` 行显示 `起量时间地域设置` 按钮，打开后弹窗标题为 `起量时间地域设置`，包含 `投放地域` 与 `时间段` Tab、地域模板/自定义/保存模板/首字母/地理区控件、168 个时段格、清空/重置/取消/确定按钮，且不显示 `投放资源位` Tab。
- `chrome-devtools` MCP（真实插件页保存验证）：在弹窗中切到 `时间段` 并选择 `大家电专属时段` 后保存，摘要更新为 `全部地域｜已配置 7 组时段`，隐藏字段 `投放时间` 写入 `9,10,11,12,13,14,15,16,17,18,19,20,21,22`，`投放地域` 写入 `全部地域`，内部地域 JSON 为 `["all"]`，未点击 `批量创建` 或原生 `创建完成`，Network 未出现 `/solution/addList.json` 创建请求。

## 结果复盘
- 根因是上一轮只保证一键起量提交字段存在，却把原生结构化 `起量时间地域设置` 退化成两个自由文本输入，交互能力与原生不一致。
- 本次用现有高级设置弹窗做参数化复用，而不是另写一套时间地域 UI，避免后续地域模板、时间段格、清空/重置等能力分叉。
- 已把教训写入 `tasks/lessons.md` 的 `L44`：原生以弹窗承载的设置，插件必须保留结构化弹窗交互，不能只用自由文本兜底。

---

# TODO - 2026-05-05 修复货品全站多目标优化目标

## 需求规格
- 目标：
  - 对齐原生 `货品全站推广` 编辑页中 `多目标优化` 的目标选项；
  - 修复插件编辑页目标文案、默认值和最终 `multiTarget` 映射；
  - 使用商品 `1024883718763` 进入真实页面验证，不点击 `批量创建` 或原生 `创建完成`。
- 成功标准：
  - 插件 `多目标优化` 里的目标列表与原生页面当前展示一致；
  - 默认目标不再使用旧口径；
  - 目标码映射覆盖原生目标文案，预览组包不发生空目标或错误目标；
  - 构建、相关回归测试、全量测试与真实页面浏览器验证通过。

## 执行计划（可核对）
- [x] 回顾历史教训和当前实现位置。
- [x] 用 Chrome DevTools 在真实原生页确认 `多目标优化` 目标列表。
- [x] 修复插件目标选项、默认值和映射。
- [x] 补充回归测试覆盖 UI 与提交映射。
- [x] 构建并运行测试。
- [x] 重载扩展后在真实 `one.alimama.com` 复验。
- [x] 回填改动摘要、验证记录和结果复盘。

## 改动摘要
- 已按用户纠正重新验证原生开启态：添加商品 `1024883718763` 后打开 `多目标优化` 开关，原生目标下拉只展示 `优化加购`、`优化直接成交`。
- 插件 `货品全站推广` 的 `多目标优化` 目标候选改为原生同款两项，默认值归一为 `优化加购`，历史草稿里的 `增加净成交金额` 等旧口径会归一到 `优化直接成交`。
- 最终映射只接受原生目标码 `1034` 与 `1230`，并移除旧的 `1231/增加总成交金额` 多目标映射，避免提交时写入原生开启态不存在的目标。
- 回归测试补齐 UI 候选、默认归一、目标码限制和旧口径清理断言。

## 验证记录
- `chrome-devtools` MCP（真实原生页）：`https://one.alimama.com/index.html#!/main/index?bizCode=onebpSite`，店铺 `美的洗碗机旗舰店`，助手 v7.02；添加商品 `1024883718763` 后打开 `多目标优化`，目标下拉为 `优化加购`、`优化直接成交`，对应 locaid 里包含 `1034`、`1230`。
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-custom-preview-submit-parity.test.mjs tests/site-scene-item-binding.test.mjs tests/site-scene-submit-mode.test.mjs`：通过，20 个测试通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/*.test.mjs`：通过，425 个测试中 423 通过、2 个既有 AgentCluster 条件跳过、0 失败。
- `bash scripts/review-team.sh`：通过，构建同步、架构安全、语法、回归测试和版本一致性检查均通过。
- `chrome-devtools` MCP（真实插件页）：重载 unpacked extension 后刷新 `one.alimama.com`，打开插件 API 向导并切到 `场景配置：货品全站推广`；`多目标优化` 开启态只显示 `优化加购` 与 `优化直接成交`，无 `增加收藏加购量/增加总成交金额/增加净成交金额/获取成交量`；逐个点击两个目标后隐藏字段 `优化目标` 分别更新为对应文案。未点击 `批量创建` 或原生 `创建完成`，Network/Performance 未出现 `/solution/addList.json` 创建请求。

## 结果复盘
- 根因是前一轮只看到了原生默认关闭态，未打开 `多目标优化` 开关查看配置列表，导致误判目标字段来源。
- 已把教训写入 `tasks/lessons.md` 的 `L43`：后续所有由开关、折叠、修改按钮或弹窗控制的原生字段，都必须验证开启/展开态后再对齐插件。

---

# TODO - 2026-05-05 货品全站推广原生与插件批量建计划对比

## 需求规格
- 目标：
  - 打开真实 `one.alimama.com` 新建计划页 `bizCode=onebpSite`，只对比一级场景 `货品全站推广`；
  - 在原生新建计划流程中添加商品 ID `1024883718763`，因为该商品会触发更多参数展示；
  - 对原生页面中可见按钮、卡片、开关、下拉、高级设置逐项点击/展开并记录，不真实提交计划；
  - 打开插件“批量建计划/API 向导”里的 `货品全站推广` 设置，记录插件可配置项；
  - 先输出“场景名称-货品全站推广”的原生设置与插件设置差异，作为后续补齐依据。
- 成功标准：
  - 明确记录原生页面在添加 `1024883718763` 前后的新增/变化参数；
  - 明确列出原生 `货品全站推广` 已点击或已展开的按钮/控件，以及未点击原因；
  - 明确列出插件批量建计划 `货品全站推广` 当前配置项、默认值/候选值和字段映射依据；
  - 给出差异表：原生有但插件缺失、插件有但原生未见、两边都有但默认值/语义不同；
  - 使用 `chrome-devtools` MCP 完成真实页面验证，全程不得点击会真实创建计划的最终提交；若需要验证最终组包，必须先证明请求被阻断。
- 安全边界：
  - 禁止真实提交线上计划；
  - `创建完成` / `立即投放` / 同等最终提交按钮默认不点击；
  - 只有在 DevTools Offline 或页面内阻断钩子已验证生效、且能证明无成功响应/无计划 ID 时，才允许做 CAPTURE_ONLY 点击；
  - 若页面出现不可阻断二次确认、登录态异常或按钮语义不确定，立即停止并记录阻塞。

## 执行计划（可核对）
- [x] 写入本轮需求规格、成功标准和提交安全边界。
- [x] 回顾 `tasks/lessons.md` 与历史 `addList.md`，确认本轮只聚焦 `货品全站推广`。
- [x] 使用 3 个子代理分别梳理插件设置源码、历史抓包样本、测试/验证契约。
- [x] 使用 `chrome-devtools` MCP 打开真实 `onebpSite` 新建计划页，确认页面、店铺和助手运行态。
- [x] 在原生流程中选择 `货品全站推广` 并添加商品 ID `1024883718763`。
- [x] 逐项点击/展开原生页面的按钮、卡片、开关、下拉和高级设置，记录控件与新增参数。
- [x] 打开插件批量建计划/API 向导，选择 `货品全站推广`，记录插件配置项。
- [x] 对比原生与插件配置，形成差异表和后续补齐建议。
- [x] 回填本章节的改动摘要、验证记录和结果复盘。

## 改动摘要
- 已回顾历史教训：本轮以原生一级营销场景 `货品全站推广` 为边界，不沿用旧文档章节名替代真实页面口径。
- 已确认最终提交安全边界：不点击 `创建完成` / `立即投放` / 同等线上创建按钮；本轮先做控件展开与插件配置对比。
- 已通过 3 个只读子代理分别完成插件源码、历史样本和测试契约梳理。
- 已通过 `chrome-devtools` MCP 确认真实页面为 `onebpSite` 新建计划页，店铺 `美的洗碗机旗舰店`，店铺 ID `2957960066`，助手运行态为 v7.02。
- 当前原生页面已选中 `场景名称=货品全站推广`，并已添加商品 `1024883718763`，页面展示出价、预算、优质计划防停投、投放调优、一键起量、计划名称、智能创意等扩展参数。
- 已在原生页点击/展开可恢复控件：推荐选品标签、添加商品入口、卡片/表格视图、出价方式、出价目标、ROI 推荐/自定义、一键采纳、预算类型、投放调优开关、一键起量开关、起量时间地域设置、设置计划组、智能创意介绍、功能玩法介绍。
- 已在插件 API 向导点击/切换 `货品全站推广` 编辑页配置：出价方式、出价目标、预算类型、专属权益、多目标优化、一键起量、优化目标、选品方式和预览请求；未点击 `批量创建`。

## 对比结论：场景名称-货品全站推广
| 项目 | 原生页面（已添加 `1024883718763`） | 插件批量建计划/API 向导 | 差异结论 |
|---|---|---|---|
| 场景入口 | 一级场景 `货品全站推广`，副文案 `全域投放 · ROI确定交付` | `场景选择=货品全站推广`，`营销目标=货品全站推广` | 基本对齐 |
| 商品触发信息 | 商品显示 `成本保障`、价格 `¥1.14`、销量 `1,192`、库存 `800`、发布日期 `2026-03-12` | 插件商品列表可搜/添加，但本轮编辑页配置不展示这些原生商品诊断信息 | 插件缺少商品级诊断展示 |
| 推荐 ROI | `roi_control` 下出现 `净目标投产比` 推荐：`16.64`，提示相当于总投产比 `19.11`，自定义框当前 `20.8`，并有 `一键采纳` | 编辑页目标投产比为普通输入；当前 UI 显示 `1`，源码 fallback 为 `5` | 插件缺少按商品动态推荐 ROI、成本保障说明和一键采纳 |
| 出价方式 | `控投产比投放` / `最大化拿量`；切 `max_amount` 后 ROI 约束区域隐藏 | 同样有 `控投产比投放` / `最大化拿量`；切 `max_amount` 后隐藏目标投产比输入 | 行为基本对齐 |
| 出价目标 | `增加总成交金额` / `增加净成交金额` | 同样有 `增加总成交金额` / `增加净成交金额` | 基本对齐 |
| 预算类型 | `roi_control` 下是 `不限预算` / `每日预算`；`max_amount` 下显示 `每日预算` 输入，当前原生预算 `140` | `不限预算` / `每日预算` / `日均预算`，预算值默认 `100` | 插件多出 `日均预算`，且预算默认值与原生当前商品建议不一致 |
| 优质计划防停投 | 原生有 `优质计划防停投` 与预算自动提升规则，历史 payload 对应 `enableRuleAuto` | 插件编辑页未暴露该项 | 插件缺失 |
| 投放调优/多目标 | 原生有 `多目标优化` 开关、预算输入、效果预测文案 | 插件有 `多目标优化` 开关、优化目标候选、预算默认 `50` | 字段链路存在，但插件目标候选比本轮原生可见项更抽象，缺原生预测说明 |
| 一键起量 | 原生有开关、预算 `50`、建议预算不低于 `133`、效果预测、`起量时间地域设置` | 插件有开关、预算 `50`、时间输入 `长期投放`、地域输入 `全部地域` | 插件缺少原生结构化时间段/地域选择器和预测说明 |
| 起量时间地域设置 | 原生弹窗含 `时间段`、`清空`、地域 `自定义/模板`、保存模板、首字母/地理区切换、省市复选、确定/取消 | 插件只用两个文本输入承载时间与地域 | 插件缺失结构化弹窗 |
| 计划组 | 原生弹窗含 `归属到已有计划组`、`新建计划组并归属`、`不归属任何计划组`，并可拉取已有计划组 | 插件为单输入 `不设置计划组`，源码可映射 ID/名称 | 插件缺少原生计划组选择/新建弹窗 |
| 智能创意 | 原生展示 `智能创意` 默认开启，并有 `智能创意介绍`、`功能玩法介绍` | 插件编辑页未暴露 `智能创意` 开关；源码只在有 `创意优选/封面智能创意` 字段时映射 `smartCreative` | 插件缺少明确 UI |
| 专属权益 | 本轮原生未看到 `智能补贴券` 字段，只看到商品 `成本保障` 和智能创意说明 | 插件有 `专属权益=智能补贴券` 开关，但子代理未发现明确最终 `campaign.*` 映射 | 插件存在疑似孤立 UI，需后续确认原生来源和 payload 字段 |
| 选品方式 | 原生表现为推荐选品标签 `平台推荐/推荐/新品/潜力品/机会爆品` + `添加商品` | 插件为 `自定义选品/好货快投-大家电专享/行业推荐选品` | 口径不一致，需要按原生重核选品来源 |
| 删除/提交类按钮 | 原生 `清空/全部移除/移除` 会破坏本轮商品前置，`创建完成` 会真实提交 | 插件 `批量创建` 会提交线上计划 | 均按安全边界跳过 |

## 后续补齐建议
- P1：补 `1024883718763` 触发的动态 ROI 推荐展示/采纳链路，至少支持推荐值、总投产比换算、成本保障、预测文案和自定义值。
- P1：补 `优质计划防停投` UI 与 `enableRuleAuto` 映射；历史样本已有 `S08` 可作为 payload 对照。
- P1：把 `起量时间地域设置` 从自由文本升级为结构化配置，输出 `quickLiftTimeSlot` 和 `quickLiftLaunchArea`。
- P2：补原生计划组弹窗能力，支持已有计划组、新建计划组、不归属三种路径，避免只靠名称输入。
- P2：核实并决定 `专属权益=智能补贴券` 是否保留；若原生无对应项或无最终映射，应删除或补真实 payload 字段。
- P2：补 `智能创意` 可见开关或至少在预览里明确 `smartCreative=1` 的来源。

## 验证记录
- 子代理 3 只读完成：若后续补 `货品全站推广` 插件字段，最小回归建议覆盖 `tests/site-scene-item-binding.test.mjs`、`tests/site-scene-submit-mode.test.mjs`、`tests/keyword-create-repair-item-binding-guard.test.mjs`、`tests/non-keyword-optional-prune-runtime.test.mjs`、`tests/keyword-build-solution-payload-behavior.test.mjs`、`tests/keyword-scene-settings-sync.test.mjs`、`tests/keyword-edit-request-scene-settings-sync.test.mjs`、`tests/keyword-custom-preview-submit-parity.test.mjs`、`tests/keyword-custom-settings-sync.test.mjs`、`tests/lifecycle-payload-builder-compat.test.mjs`、`tests/extension-static-build.test.mjs`、`tests/build-output-sync.test.mjs`。
- 子代理 2 只读完成：历史 `addList.md` 已有 `onebpSite` 13 条离线样本，覆盖出价方式、出价目标、ROI 目标、预算类型、`多目标优化`、`一键起量`、`优质计划防停投`、起量时间地域和计划组；但缺少本轮指定商品 `1024883718763` 添加前后的参数变化对比。
- 子代理 1 只读完成：插件 `货品全站推广` 配置主要位于 `src/optimizer/keyword-plan-api/runtime.js`、`render-scene-dynamic-core.js`、`search-and-draft.js`，已暴露场景/目标、选品方式、出价方式、出价目标、目标投产比、预算类型/预算值、专属权益、投放调优、多目标优化、一键起量、时间地域和计划组；`专属权益` 未发现明确最终 `campaign.*` 映射。
- `chrome-devtools` MCP（2026-05-05）：页面 URL 为 `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSite`，标题为 `计划创建_万相台无界版`，DOM 中存在 `#am-helper-icon`、`#am-helper-panel`、`#am-report-capture-panel`、`#am-wxt-keyword-modal`，`window.__AM_GET_SCRIPT_VERSION__()` 返回 `7.02`，`window.__AM_HOOK_MANAGER__` 存在。
- `chrome-devtools` MCP（2026-05-05）：已确认页面文本包含 `场景名称 货品全站推广` 与商品 `1024883718763`，当前没有点击 `创建完成`。
- `chrome-devtools` MCP（2026-05-05）：原生页切换 `roi_control` 后显示推荐 ROI `16.64`、总投产比 `19.11`、自定义值 `20.8`、`一键采纳`、`不限预算/每日预算`、一键起量预算 `50`、起量时间 `0点~24点`、地域 `全部地域`。
- `chrome-devtools` MCP（2026-05-05）：原生页切换 `max_amount` 后目标投产比区域隐藏，显示 `每日预算`、`优质计划防停投`、投放调优与一键起量区域。
- `chrome-devtools` MCP（2026-05-05）：原生 `起量时间地域设置` 弹窗可见时间段、清空、地域自定义/模板、保存模板、首字母/地理区选择、省市复选、确定/取消。
- `chrome-devtools` MCP（2026-05-05）：原生 `设置计划组` 弹窗可见归属已有计划组、新建计划组并归属、不归属任何计划组。
- `chrome-devtools` MCP（2026-05-05）：插件向导通过 `#am-trigger-keyword-plan-api` 打开，编辑页切换到 `场景配置：货品全站推广`，可见字段包括出价方式、出价目标、目标投产比、预算类型、预算值、专属权益、投放调优、多目标优化、一键起量、选品方式和计划组。
- `chrome-devtools` MCP（2026-05-05）：网络记录未出现 `/solution/addList.json`；本轮只触发 `getBidSuggestion`、`getBudgetSuggestion`、`getEffectPrediction`、`getRoiFeedback`、`triggerDynamicModule`、`area/getCodeConfig`、`campaignGroup/findList`、`material/item/findPage` 等配置辅助接口。

## 结果复盘
- 本轮是“原生设置 vs 插件设置”的只读对比，没有修改业务源码，也没有真实提交线上计划。
- 原生新增参数的核心来自指定商品 `1024883718763`：动态 ROI 建议、成本保障、预测说明、推荐采纳和起量/预算预测；这些不是静态字段表能完全还原。
- 插件当前已覆盖主要提交字段骨架，但多个原生交互仍是自由文本或静态默认值，后续补齐应优先复用历史 `addList.md` 样本和本轮 UI 观察，而不是直接扩大兜底字段。

---

# TODO - 2026-05-05 修复货品全站推广批量建计划原生差异

## 需求规格
- 目标：
  - 修复上一节对比发现的 `货品全站推广` 批量建计划设置差异；
  - 优先补齐会影响最终请求语义的配置：`优质计划防停投`、`智能创意`、动态 ROI 采纳、起量时间地域、计划组；
  - 构建后在真实 `one.alimama.com` 浏览器中验证插件编辑页展示和交互，不真实提交计划。
- 成功标准：
  - 插件 `场景配置：货品全站推广` 可见并可切换 `优质计划防停投` 与 `智能创意`；
  - 关闭 `优质计划防停投` 后组包映射 `campaign.enableRuleAuto=false`，开启时不丢失默认语义；
  - 关闭 `智能创意` 后组包映射 `campaign.smartCreative=0`，开启时为 `1`；
  - ROI 推荐/采纳、起量时间地域、计划组能力按可落地程度完成或给出明确残留边界；
  - `node scripts/build.mjs`、相关回归测试、`node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"` 通过；
  - 使用 `chrome-devtools` MCP 刷新真实页面运行态后验证，不点击 `创建完成` 或 `批量创建`。

## 执行计划（可核对）
- [x] 记录本轮修复需求和安全边界。
- [x] 使用 3 个子代理分别核查 UI 渲染、payload 映射和测试契约。
- [x] 修复 `货品全站推广` 编辑页可见配置与默认值。
- [x] 修复最终请求映射与货品全站兜底。
- [x] 补充/更新回归测试。
- [x] 构建并运行最小相关测试。
- [x] 刷新浏览器扩展运行态，用 Chrome DevTools 在真实页面验证。
- [x] 回填改动摘要、验证记录和残留边界。

## 改动摘要
- `货品全站推广` 场景配置补齐原生页可见的 `优质计划防停投` 与 `智能创意`，移除旧的 `专属权益` 展示与草稿残留。
- `优质计划防停投` 复用现有防停投弹窗能力，货品全站分支通过内部隐藏字段保存弹窗配置，避免把非原生字段直接污染最终 campaign 结构。
- 提交映射补齐 `智能创意=关闭 -> campaign.smartCreative=0`、`智能创意=开启 -> campaign.smartCreative=1`、`优质计划防停投=关闭 -> campaign.enableRuleAuto=false`。
- `投放时间=固定时段` 保留原生结构 `{ quickLiftSwitch: 'false' }`；`计划组=不归属任何计划组` 映射为 `campaignGroupId=null` 与 `campaignGroupName=''`。
- 更新构建产物：根 userscript、`dist/packages` 与 `dist/extension`。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-custom-preview-submit-parity.test.mjs tests/site-scene-item-binding.test.mjs tests/site-scene-submit-mode.test.mjs`：通过，20 个测试通过。
- `node scripts/build.mjs --check`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/*.test.mjs`：通过，425 个测试中 423 通过、2 个既有 AgentCluster 条件跳过、0 失败。
- `bash scripts/review-team.sh`：通过，构建同步、依赖、架构安全、语法、回归测试和版本检查均通过。
- Chrome DevTools MCP 真实页验证：已在 `one.alimama.com` 重载 unpacked extension 并刷新页面，打开插件 `货品全站推广` 编辑页，添加商品 `1024883718763`，确认 `优质计划防停投`、`智能创意` 可见可切换，`专属权益` 不再出现；切换关闭防停投/智能创意、固定时段、不归属任何计划组后生成预览。未点击 `批量创建` 或原生 `创建完成`，Network 中未出现创建提交请求。

## 结果复盘
- 结论：插件批量建计划在 `货品全站推广` 场景下已补齐本轮对比中最关键的原生参数差异，并通过真实页面预览链路验证。
- 残留边界：本轮只验证到插件预览与草稿状态，不真实提交计划；ROI 推荐/采纳仍依赖原生接口在真实账户和商品上的可用返回，当前实现优先使用运行时/模板中的 `constraintValue`，无返回时保持兜底默认。

---

# TODO - 2026-05-05 阿里妈妈营销场景全量抓包

## 需求规格
- 目标：
  - 按真实页面一级营销场景卡片重新摸排 `addList.json`，场景口径为 `货品全站推广`、`关键词推广`、`人群推广`、`店铺直达`、`内容营销`、`线索推广`；
  - 每个一级场景建立独立浏览器子代理，进入后枚举并点击内部所有可见按钮、卡片、开关、下拉和高级设置；
  - `货品全站推广` 必须先添加商品 ID `<SITE_ITEM_ID>`（用户 2026-05-18 修正），再记录由该商品触发显示的新增参数；
  - 对比 `addList.md`，标注哪些一级场景已有记录、哪些完全缺失、哪些只有子场景记录但缺一级入口记录；
  - 全程只捕获前端最终组包，不真实提交线上计划。
- 成功标准：
  - `addList.md` 追加新的一级营销场景覆盖矩阵和逐按钮样本记录；
  - 每条最终样本都有 `CAPTURE_ONLY` 证明：Hook 捕获 payload、网络 blocked/offline/status=0、无成功响应、无计划 ID、无创建成功提示；
  - `<SITE_ITEM_ID>` 在相关 payload 的商品字段中可检索；
  - 未覆盖项均有明确阻塞原因和截图/页面证据；
  - 本轮执行结果和复盘写回本章节。
- 约束：
  - 2026-05-05 用户已明确改用 `chrome-devtools`，本轮后续以 Chrome DevTools MCP 执行真实页面操作；
  - 任何成功提交风险、二次确认不可阻断、多条最终请求无法判定、页面状态异常重置，都立即停止并回到计划。

## 执行计划（可核对）
- [x] 初始化 `browser-use` IAB，会话命名为阿里妈妈营销场景抓包。
- [x] 切换到 `chrome-devtools`，建立统一 `CAPTURE_ONLY` 协议、样本命名、diff 规范和 `addList.md` 归档格式。
- [x] 2026-05-18 恢复执行：预检 Chrome DevTools 专用 profile、扩展注入、Hook 与页面内拦截能力。
- [x] 2026-05-18 恢复执行：先只读盘点 `addList.md` 既有覆盖，确定本轮最小增量样本范围。
- [x] 2026-05-18 恢复执行：用真实页面按 CAPTURE_ONLY 捕获至少覆盖 6 个一级场景入口的最终组包或记录不可覆盖阻塞。
- [x] 2026-05-19 用户修正：baseline 不足，必须覆盖每个一级场景内部按钮、开关、下拉和高级设置。
- [x] 2026-05-19 为 6 个一级场景生成实时控件清单，区分可安全点击、需要 CAPTURE_ONLY、不可点击/阻塞项。
- [x] 2026-05-19 用户修正：将已成功样本的完整提交参数单独归档，供后续插件开发对照。
- [x] 2026-05-19 用户修正：每一次实际触发到的 `addList` JSON 都要逐条归档，不能只保留代表样本或摘要。
- [ ] 2026-05-19 按控件清单逐项操作并抓取 payload diff 或页面状态差异。
- [ ] 2026-05-19 将内部控件覆盖矩阵和阻塞项回填 `addList.md` 与本任务记录。
- [ ] 建立 `货品全站推广` 浏览器子代理，添加 `1024883718763` 后覆盖全域投放、ROI确定交付及内部全部按钮。
- [ ] 建立 `关键词推广` 浏览器子代理，覆盖卡位、趋势、金卡、跟投及内部全部按钮。
- [ ] 建立 `人群推广` 浏览器子代理，覆盖拉新、竞争、信息流及内部全部按钮。
- [ ] 建立 `店铺直达` 浏览器子代理，覆盖店铺智营、海量样式及内部全部按钮。
- [ ] 建立 `内容营销` 浏览器子代理，覆盖直播、短视频、短直联投及内部全部按钮。
- [ ] 建立 `线索推广` 浏览器子代理，覆盖线索拉新、转化、管理及内部全部按钮。
- [x] 汇总 6 个一级场景的覆盖矩阵、payload diff、阻塞项和旧记录对比。
- [x] 更新 `addList.md`，并验证 `<SITE_ITEM_ID>` 与新增样本可检索。
- [x] 回填本章节的改动摘要、验证记录和结果复盘。

## 改动摘要
- 已按用户纠正后的一级营销场景口径写入本轮任务：`货品全站推广`、`关键词推广`、`人群推广`、`店铺直达`、`内容营销`、`线索推广`。
- 已通过 `browser-use` IAB 打开真实 `one.alimama.com` 计划创建页，页面显示店铺 `<SHOP_NAME>`、店铺 ID `<SHOP_ID>`，6 个一级营销场景均可见。
- 已确认当前 IAB 页面未加载本仓库助手脚本或扩展能力，DOM 中没有 `am-helper`、`am-report-capture-panel`、`__AM_HOOK_MANAGER__`、`API向导` 等抓包入口。
- 已确认 `browser-use` 公开 API 只有导航、DOM、点击、截图、日志等能力，没有 `evaluate`、请求阻断、Network Offline 或 Hook 读取能力。
- 已测试备用 `javascript:` 注入方案，`browser-use` 因安全策略明确拒绝，并要求不能通过间接执行、原始 CDP 或其它浏览器面绕过。
- 因无法满足 `CAPTURE_ONLY` 的前置证明，未建立 6 个场景浏览器子代理，未点击 `创建完成`，未添加商品，未更新 `addList.md` 样本。
- 2026-05-05 用户明确指示“用回 chrome-devtools”，后续执行恢复为 Chrome DevTools MCP，并以 DevTools Offline + 页面内 `addList.json` 阻断钩子作为提交保护。
- 2026-05-18 用户要求继续本待办；本轮主线程负责 Chrome DevTools 真实页面安全验证与最终整合，只读子任务负责盘点历史覆盖和安全抓包步骤。
- 2026-05-18 已完成一级入口 baseline：`货品全站推广`、`关键词推广`、`人群推广`、`店铺直达`、`内容营销` 捕获到最终组包，`线索推广` 被前端商品/关键词前置校验阻断，未发 addList。
- 本轮按用户修正使用商品 `<SITE_ITEM_ID>`；添加路径为 `添加商品 -> 全部商品 -> 商品ID 搜索 -> 添加 -> 确定`。
- 2026-05-19 用户修正：一级入口 baseline 还不够，真正有用的是“每个内部按钮/开关/下拉全部覆盖”；后续完成口径改为内部控件级覆盖，不得把第 21 章 baseline 当作最终完成。
- 2026-05-19 已改为直达 `bizCode` 路由逐场景抽取控件清单，避免卡片点击误判场景；6 个一级场景均已生成实时控件清单。
- 2026-05-19 继续执行逐项覆盖：新增 `内容营销` 默认组包与 `下播续投` 状态差异、`关键词推广` 抢首页+精准匹配组包、`货品全站` 最大化拿量/ROI 自定义阻塞、`人群推广` AI 推人/兴趣拉新阻塞、`店铺直达` 高级溢价卡片阻塞记录。
- 2026-05-19 环境偏差：标准 `chrome-devtools` MCP 固定连 `9222`，但该端口被普通 Chrome 占用且 `/json/version` 为 404；恢复脚本失败，备用使用专用 profile 的 `9333` DevTools Protocol 继续采集，标准 MCP 复验仍需后续恢复。
- 2026-05-19 用户补充要求：除摘要外，需要把已成功样本的完整请求参数单独归档，后续开发插件时可直接对照真实 JSON 结构。
- 2026-05-19 已生成本地未提交抓包归档：当前包含 6 条成功样本的完整 `parsedBody` 和 1 条 `TOP06_LEADS_BLOCKED` 阻塞样本；其中 `SITE_ONECLICK_RECAPTURE_RAW` 为当前推荐选品重抓样本，不等同于 2026-05-18 的 `<SITE_ITEM_ID>` baseline。
- 2026-05-19 用户继续收紧口径：不是“有一份完整 JSON 就行”，而是每一次实际触发到的 `addList` JSON 都要单独记录；后续需要按 `sampleId -> 完整 parsedBody` 做一一对应归档，不能用代表性重抓样本替代全部历史样本。
- 2026-05-19 已按当前 `addList.md` 中出现过的 13 个 sampleId 补齐统一归档：7 条成功样本保存独立 raw JSON，6 条未发请求样本保存独立 blocked 记录；`tasks/alimama-scene-capture-payloads-2026-05-19.json` 现返回 `docSampleCoverageComplete=true`。

## 验证记录
- `browser-use` IAB 初始化：通过，创建 tab 成功，会话命名为 `阿里妈妈营销场景抓包`。
- 目标页打开：通过，URL 为 `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSite`，标题为 `计划创建_万相台无界版`。
- 页面状态检查：通过，真实页面可见 `营销场景`、`货品全站推广`、`关键词推广`、`人群推广`、`店铺直达`、`内容营销`、`线索推广`、`创建完成`、`添加商品`。
- 助手注入检查：未通过抓包前置，`am-helper=false`、`阿里助手=false`、`__AM_HOOK_MANAGER__=false`、`am-report-capture-panel=false`。
- `browser-use` API 能力检查：未通过抓包前置，`evaluate`、`route`、`network`、`emulate`、`offline`、`requestBlocking` 均不可用。
- 备用注入检查：未通过，`browser-use` 拒绝访问 `javascript:` URL，并要求不得用 workaround、raw CDP、alternate browser surfaces 绕过。
- 用户授权切换工具：通过，后续允许使用 `chrome-devtools`。
- Chrome DevTools MCP 预检：9222 调试端口健康，`json/version` 返回 `webSocketDebuggerUrl`；真实页面标题为 `计划创建_万相台无界版`。
- Chrome DevTools MCP 注入检查：`window.__AM_GET_SCRIPT_VERSION__()` 返回 `7.03`，`window.__AM_HOOK_MANAGER__`、`#am-helper-icon`、`#am-helper-panel`、`#am-report-capture-panel` 均存在。
- CAPTURE_ONLY 自检：测试 `fetch` 命中 `/solution/addList.json` 返回 `409 CAPTURE_ONLY_BLOCKED`；测试 XHR 命中同路径触发 `status=0/error`；两条记录均写入 Hook 历史。
- `货品全站推广`：在 `添加商品 -> 全部商品` 中搜索 `<SITE_ITEM_ID>`，添加成功；CAPTURE_ONLY 捕获 `onebpSite` addList，body length `8336`，`materialId=<SITE_ITEM_ID>`，无成功文案。
- `关键词推广`：CAPTURE_ONLY 捕获 `onebpSearch / promotion_scene_search_detent` addList，body length `20455`，`wordListLength=10`，无成功文案。
- `人群推广`：CAPTURE_ONLY 捕获 `onebpDisplay / promotion_scene_display_laxin` addList，body length `26953`，`crowdListLength=3`，无成功文案。
- `店铺直达`：CAPTURE_ONLY 捕获 `onebpStarShop` addList，body length `8560`，页面提示 `请添加创意`，无成功文案。
- `内容营销`：CAPTURE_ONLY 捕获 `onebpLive / scene_live_room` addList，body length `23311`，直播间主体 `<LIVE_ROOM_ID>`，无成功文案。
- `线索推广`：`onebpAdStrategyLiuZi` 默认状态点击 `创建完成` 后 `captureCount=0`，前端停在 `添加商品` 校验，未触发 addList，无成功文案。
- `rg -n "<SITE_ITEM_ID>|一级营销场景覆盖总览|TOP06" addList.md tasks/alimama-scene-capture-2026-05-18-notes.md tasks/todo.md tasks/lessons.md`：通过，新增记录可检索。
- 内部控件清单抽取：通过，逐个直达 `onebpSite`、`onebpSearch`、`onebpDisplay`、`onebpStarShop`、`onebpLive`、`onebpAdStrategyLiuZi` 后滚动全页 DOM，按按钮、开关、下拉、单选/卡片、输入框、链接/弹窗入口分组；货品全站先重新添加 `<SITE_ITEM_ID>`，主页面显示 `添加商品 1 / 5` 后再抽取。
- 逐项操作样本：`内容营销` 默认组包捕获 `onebpLive` payload，body length `27012`；`关键词推广` 抢首页+精准匹配捕获 `onebpSearch` payload，body length `14689`；页面均无创建成功文案和计划 ID。
- 状态差异/阻塞样本：`内容营销` 下播续投、`货品全站` 最大化拿量、`货品全站` ROI 自定义、`人群推广` AI 推人/兴趣拉新、`店铺直达` 高级溢价卡片均未发 addList，原因已写入任务笔记和 `addList.md`。
- 完整请求体归档：通过 9333 直连 CDP 重抓并生成 `tasks/alimama-scene-capture-payloads-2026-05-19.json`；归档成功样本为 `SITE_ONECLICK_RECAPTURE_RAW`、`SEARCH_DETENT_DEFAULT_RAW`、`SEARCH_HOME_PAGE_RECAPTURE_RAW`、`DISPLAY_LAXIN_DEFAULT_RAW`、`STARSHOP_DEFAULT_RAW`、`LIVE_DEFAULT_RECAPTURE_RAW`，阻塞样本为 `TOP06_LEADS_BLOCKED`。
- 归档校验：`node` 读取归档摘要返回 `sampleCount=6`、`blockedCount=1`；`SEARCH_HOME_PAGE_RECAPTURE_RAW.summary.searchDetentType=home_page`，`SITE_ONECLICK_RECAPTURE_RAW.summary.bizCode=onebpSite`。
- 归档补齐：新增 `LIVE_TOP05_BASELINE_RECAPTURE_RAW`，并为 `TOP06`、`CTRL-LIVE-SPOT-CONTINUE`、`CTRL-SITE-MAX-AMOUNT`、`CTRL-SITE-ROI-CUSTOM`、`CTRL-DISPLAY-AI-PUSH`、`CTRL-STARSHOP-PREMIUM-SKIN` 补齐独立 blocked 记录。
- 归档复核：`node` 读取归档摘要返回 `sampleCount=7`、`blockedCount=6`、`recordedDocSampleCount=13`、`docSampleCoverageComplete=true`。

## 结果复盘
- 本轮实际阻塞点不是登录态或页面入口，而是安全抓包能力缺失：严格只用 `browser-use` 时无法同时做到 Hook 读取、请求阻断和离线证明。
- 按当前约束继续点击 `创建完成` 会违反“拦截提交，不能真实提交”的核心安全要求，因此主动停止。
- 后续恢复执行需要满足其一：让 IAB 加载本仓库助手/扩展并暴露可点击的安全抓包入口，或用户明确允许使用具备 Network Offline 与请求阻断能力的浏览器调试通道。
- 已满足恢复条件：用户明确允许切回 `chrome-devtools`。下一步需要先安装并验证 `CAPTURE_ONLY`，再进入 6 个一级场景的抓包。
- 2026-05-18 恢复执行已完成一级入口 baseline 覆盖，并将结果追加到 `addList.md` 第 21 章；这不是内部全部按钮/开关/下拉的穷尽覆盖，深分支仍按原复选框保留为未完成。
- 本轮未点击插件 `批量创建`、`立即投放`，所有原生 `创建完成` 点击均在页面内 CAPTURE_ONLY 与 DevTools Offline 保护下执行；未观察到成功创建文案或计划 ID。
- 2026-05-19 根据用户修正，后续必须继续做内部控件级覆盖；验收以“控件清单逐项有 payload diff、状态差异或阻塞说明”为准。
- 2026-05-19 新增的完整请求体归档已经满足“后续插件开发可直接对照真实 JSON 结构”的需求，但这些 raw body 仍是实时页面快照；开发实现应提炼稳定字段结构，不应依赖预算建议、推荐人群或商品上下文的瞬时数值。
- 2026-05-19 截止当前，`addList.md` 中已经出现过的 13 个 sampleId 都已在统一归档里有独立 raw 或独立 blocked 记录；后续如果继续执行新的控件分支，必须同步追加新的 sampleId 记录，不能再回到 alias 代替的做法。

---

# TODO - 2026-05-05 收口未完成 TODO 并完成浏览器验证

## 需求规格
- 目标：
  - 扫描 `tasks/todo.md` 中仍未勾选的任务项，区分真实未完成项与已完成但未回填的 stale checkbox；
  - 对仍需执行的项目完成浏览器验证，并将结论、阻塞点和后续动作回填到任务文档；
  - 不真实提交线上计划，不扩大业务代码改动范围。
- 成功标准：
  - `tasks/todo.md` 中本轮可处理的未完成项全部有明确完成状态或阻塞结论；
  - `sycm.taobao.com` 和 `one.alimama.com` 均通过 `chrome-devtools` MCP 完成真实浏览器验证；
  - 构建产物与源码同步检查通过；
  - 结果复盘说明哪些只是文档状态滞后，哪些是当前扩展匹配范围限制。

## 执行计划（可核对）
- [x] 回顾 lessons、仓库说明和当前扩展加载范围，确认本轮不覆盖用户未提交改动。
- [x] 审查全部未勾选 TODO，列出待收口对象。
- [x] 构建并校验最新 `dist/extension/` 产物。
- [x] 使用 `chrome-devtools` MCP 打开真实 `sycm.taobao.com`，验证页面加载、扩展匹配、注入痕迹与控制台状态。
- [x] 使用 `chrome-devtools` MCP 打开真实 `one.alimama.com` 新建计划页，验证扩展运行态与已有提交流量摸排文档结论。
- [x] 回填旧 TODO 的完成状态、验证记录和本轮结果复盘。

## 改动摘要
- 已确认剩余未勾选项集中在两处：`sycm.taobao.com` 真实页测试，以及 `onebpSite` 新建计划提交流量摸排的三个 stale checkbox。
- `sycm.taobao.com` 不在当前 userscript/extension 的匹配范围内，本轮按“应无注入”完成真实页面验证；若后续要支持生意参谋，需要新增 `@match`/manifest matches 和对应业务逻辑。
- `onebpSite` 摸排已有 `addList.md` 证据支撑，完成口径限定为当前账号、当前页面可见入口与可达分支，不扩展到其它 `bizCode` 或不可见计划类型。

## 验证记录
- `node scripts/build.mjs`：通过，生成 v7.02 根脚本、packages 与 `dist/extension/`。
- `node scripts/build.mjs --check`：通过。
- 子代理只读核查：`tasks/todo.md` 原剩余 8 个 `[ ]`，其中 `sycm` 5 项是真未执行，`onebpSite` 3 项为已执行后未同步 checkbox。
- 子代理只读核查：`addList.md` 的 `onebpSite` 章节已有 13 条样本、最终提交接口、可见分支覆盖、未覆盖声明和“不真实提交”的 Offline 抓取说明。
- `chrome-devtools` MCP（2026-05-05）：打开真实 `https://sycm.taobao.com/portal/home.htm`，页面标题为 `生意参谋 - 零售电商大数据产品平台`，店铺为 `美的洗碗机旗舰店`。
- `chrome-devtools` MCP（2026-05-05）：`sycm.taobao.com` 页面 DOM 检查 `matchingUiSelectors=[]`、`amPrefixedNodeCount=0`；`window.__AM_GET_SCRIPT_VERSION__`、`window.__AM_HOOK_MANAGER__`、`window.__ALIMAMA_OPTIMIZER_TOGGLE__` 均为 `undefined`；无 `chrome-extension://` 助手资源加载。
- `chrome-devtools` MCP（2026-05-05）：`sycm.taobao.com` 页面控制台没有 `[AM]`、`[AM][Interceptor]` 或 `[AM-WXT]` 助手日志；页面自身存在一个生意参谋接口安全提示 iframe，不是本扩展注入导致。
- `chrome-devtools` MCP（2026-05-05）：打开真实 `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSite`，页面标题为 `计划创建_万相台无界版`，当前 `bizCode=onebpSite`。
- `chrome-devtools` MCP（2026-05-05）：`one.alimama.com` 页面助手运行态正常，DOM 中存在 `#am-helper-icon`、`#am-helper-panel`、`#am-report-capture-panel`，控制台输出 `[AM] 🚀 阿里助手 Pro v7.02 已启动`，网络加载 `chrome-extension://.../page.bundle.js`。
- `chrome-devtools` MCP（2026-05-05）：本轮只打开和检查页面，未点击 `创建完成`；浏览器资源记录中未出现 `/solution/addList.json` 请求。

## 结果复盘
- `sycm.taobao.com` 任务原文是“验证能否正常加载”，实际结论是“当前仓库扩展按设计不会加载到 sycm 域”；因此本轮把它收口为明确的范围限制，而不是误判为运行异常。
- `onebpSite` 摸排任务的执行内容已经在旧记录和 `addList.md` 中完成，遗漏的是 checkbox 状态同步；本轮补齐完成状态并明确完成边界，避免把它误扩展成所有阿里妈妈 `bizCode` 的全量摸排。
- 本轮没有修改业务源码，只更新任务状态和验证记录。

---

# TODO - 2026-05-05 矩阵页趋势主题组合常驻入口

## 需求规格
- 目标：
  - 将矩阵页 `选择趋势主题` 维度里的 `添加趋势主题组合` 从下拉面板内移到卡片外层常驻区域；
  - 用户无需先点开 `点击选择` 下拉，就能直接新增趋势主题组合；
  - 保留已有下拉勾选能力，用于选择已添加的趋势主题组合和 `清空趋势主题`；
  - 不真实提交线上计划，只验证 UI 交互与矩阵配置写回。
- 成功标准：
  - 真实页面里 `选择趋势主题` 维度卡片上可以直接看到并点击 `添加趋势主题组合`；
  - `点击选择` 下拉里不再把新增入口藏在选项列表末尾；
  - 点击常驻入口能打开趋势主题弹窗，确认后写回当前维度并可在下拉中勾选；
  - 回归测试、构建、浏览器验证通过。

## 执行计划（可核对）
- [x] 回顾用户截图与现有入口实现，确认痛点是入口藏在下拉内。
- [x] 调整维度卡片渲染，把趋势主题新增入口移动到值选择器外层。
- [x] 更新样式，保证常驻按钮在卡片内清晰但不挤占选择器。
- [x] 更新回归测试，防止新增入口再次被放回下拉 panel。
- [x] 构建生成 userscript/extension 产物，并运行目标测试。
- [x] 使用 `chrome-devtools` MCP 在真实页面刷新插件后验证入口常驻和写回链路。
- [x] 运行完整检查并归档结果。

## 改动摘要
- 已将 `添加趋势主题组合` 从 `点击选择` 下拉 panel 内移出，改为渲染在 `选择趋势主题` 维度卡片的值选择器下方。
- 下拉 panel 现在只保留已有值选择，例如 `清空趋势主题` 或已创建的趋势主题组合；新增动作不再混在选项列表里。
- 事件处理继续复用原 `data-matrix-trend-theme-edit` 链路，不新增状态分支；点击常驻按钮仍会打开编辑页同源趋势主题弹窗，并把确认结果写回当前矩阵维度。
- 常驻按钮复用原 `am-wxt-matrix-trend-theme-actions` 样式，外置后保持卡片内分隔和整行按钮形态，不额外引入新的视觉规则。
- 已补回归测试，明确断言新增入口位于 `${valueEditorHtml}` 之后，并且值下拉 panel 内不再包含 `${trendThemeEditorHtml}`。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/matrix-plan-config.test.mjs tests/keyword-trend-theme-setting.test.mjs`：通过，27/27。
- `node scripts/build.mjs --check`：通过。
- `git diff --check`：通过。
- `node --test tests/*.test.mjs`：通过，423 个测试，421 通过，2 个跳过（既有 `agent-cluster/index.mjs` 缺失）。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `chrome-devtools` MCP（2026-05-05）：刷新 unpacked extension 后，在真实 `one.alimama.com` 页面打开向导，进入矩阵页并切换营销目标到 `趋势明星`，添加 `选择趋势主题` 维度后，未展开 `点击选择` 下拉即可直接看到 `添加趋势主题组合`。
- `chrome-devtools` MCP（2026-05-05）：展开 `点击选择` 下拉后，panel 内只显示 `清空趋势主题`，确认新增入口不在下拉选项内；DOM 检查 `buttonInsidePanel=false`。
- `chrome-devtools` MCP（2026-05-05）：点击常驻 `添加趋势主题组合` 后成功打开趋势主题弹窗，点击 `确定` 后矩阵维度回写为 `已选 1 项：已选 5/6：美的消毒碗柜、消毒碗柜、消毒碗柜家用等`。
- 验证过程中未点击 `立即投放`，未真实创建或提交线上计划；验证后已清理向导会话草稿并移除弹窗。

## 结果复盘
- 上一轮把新建入口放进下拉 panel，功能能用但路径过深；用户每新增一次都要先打开选择器，交互成本不合理。
- 更合适的划分是：常驻按钮负责创建/编辑复杂组合，下拉只负责选择已有值。这样也避免未来把多个动作继续堆到同一个选项面板里。
- 已将该经验沉淀到 `tasks/lessons.md` 的 L39。

# TODO - 2026-05-05 矩阵页“生成计划”点击无反应二次修复

## 需求规格
- 目标：
  - 复现用户当前反馈的“点击生成计划，没有反应”；
  - 定位真实点击链路中是事件未触发、异常中断、状态未同步、日志不可见还是运行态未刷新；
  - 修复后必须用用户可见的矩阵页操作路径验证，而不是只用脚本构造状态。
- 成功标准：
  - 在真实 `one.alimama.com` 页面，点击矩阵页 `生成计划` 后必须有明确结果：成功生成计划或可见错误日志；
  - 满足矩阵配置和商品前置条件时，点击后能生成计划列表；
  - 回归测试覆盖二次根因；
  - 自动化验证和 `chrome-devtools` MCP 真实页面验证通过。

## 执行计划（可核对）
- [x] 记录二次反馈，确认上一轮交付不足。
- [x] 检查当前真实页面按钮 DOM、disabled 状态、事件触发、日志区和控制台异常。
- [x] 定位并修复点击无反应的第二根因。
- [x] 补充/更新回归测试。
- [x] 重新构建并刷新浏览器运行态。
- [x] 按用户可见路径完成真实页面复测。
- [x] 运行目标测试、全量测试、`review-team` 和 `git diff --check`。
- [x] 更新 lessons、改动摘要、验证记录和结果复盘。

## 改动摘要
- 二次根因已在真实页面复现：`生成计划` 点击事件会触发，但缺商品等前置失败只写入隐藏的日志页，矩阵页当前操作区没有可见反馈，用户看到的是“点击没有反应”。
- 已新增矩阵页操作提示写入入口 `setMatrixActionNote`，并在点击生成的前置校验里通过 `showMatrixGenerateFeedback` 同步写入日志和矩阵页提示。
- 已拆分缺场景、缺矩阵配置、缺商品、缺策略、无有效计划等错误提示，缺商品时明确提示“请先回首页添加商品，再回矩阵页点击补齐5维或添加商品维度后生成计划”。
- 已为矩阵操作提示增加红色错误态和绿色成功态样式，避免点击后只有隐藏日志变化。
- 已更新矩阵回归测试，覆盖可见提示 helper、生成点击反馈和错误样式契约。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/matrix-plan-config.test.mjs`：通过，24/24。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/matrix-plan-config.test.mjs tests/matrix-bid-target-cost-package.test.mjs tests/matrix-dimension-structured-values.test.mjs tests/keyword-trend-theme-setting.test.mjs`：通过，41/41。
- `git diff --check`：通过。
- `node --test tests/*.test.mjs`：通过，423 个测试，421 通过，2 个跳过（既有 `agent-cluster/index.mjs` 缺失）。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `chrome-devtools` MCP（2026-05-05）：刷新 unpacked extension 后，在真实 `one.alimama.com` 页面复现到点击事件触发但只进入日志页的问题；矩阵页没有商品时，点击 `生成计划` 现在会在当前矩阵页显示红色提示 `请先回首页添加商品，再回矩阵页点击“补齐5维”或添加“商品”维度后生成计划`。
- `chrome-devtools` MCP（2026-05-05）：按用户可见路径回首页添加 1 个真实商品后，回到矩阵页点击 `补齐5维`，矩阵摘要显示 `矩阵：开启 ｜ 组合 32 ｜ 批次 13`，商品维度显示已选商品；点击 `生成计划` 后成功回首页计划列表，日志提示 `已生成计划 128 个，已追加到首页计划列表（共 132 个）`。
- 验证过程中未点击 `立即投放`，未真实创建或提交线上计划；验证后已通过向导 API 清理会话草稿并刷新页面。

## 结果复盘
- 上一轮修复只验证了按钮可点击、隐藏日志和成功生成路径，没有覆盖“前置条件失败时当前页必须可见反馈”，导致缺商品场景仍会被用户感知为无反应。
- 本轮修复把失败反馈放回用户当前操作区域，同时保留日志记录；这比继续扩大按钮禁用态更清晰，也能让用户知道下一步该补什么。
- 已将该教训沉淀到 `tasks/lessons.md`：点击类修复必须同时验证事件触发、隐藏日志、当前页反馈和成功路径。

# TODO - 2026-05-05 矩阵页“生成计划”点击生成修复

## 需求规格
- 目标：
  - 修复批量建计划 API 向导矩阵页里“生成计划”按钮无法点击或点击后无法生成计划的问题；
  - 保持矩阵页已有营销目标、维度卡片、复杂字段和请求写回能力不退化；
  - 不真实提交线上计划，只验证到生成计划草稿/预览或可生成状态。
- 成功标准：
  - 矩阵页满足必要配置后，“生成计划”按钮处于可点击状态；
  - 点击“生成计划”后能生成矩阵计划列表/预览，不被空维度、禁用态或事件链路阻断；
  - 回归测试覆盖本次根因，避免后续矩阵页再次出现可见按钮不可点击或点击无效；
  - `node scripts/build.mjs`、语法检查、相关测试、全量测试和 `scripts/review-team.sh` 通过；
  - 使用 `chrome-devtools` MCP 在真实 `one.alimama.com` 页面刷新运行态后验证通过。
- 非目标：
  - 不真实创建或提交线上计划；
  - 不重构整个批量建计划向导；
  - 不处理当前未跟踪目录和无关文件。

## 执行计划（可核对）
- [x] 回顾 `tasks/lessons.md`，确认矩阵页修复必须覆盖真实点击链路和浏览器复测。
- [x] 建立本轮需求规格、成功标准和验证计划。
- [x] 定位矩阵页“生成计划”按钮的渲染、禁用态和点击事件链路。
- [x] 复现或推断点击无效根因，并选择最小且优雅的修复方案。
- [x] 实现修复并补充/更新回归测试。
- [x] 运行构建、语法、目标测试、全量测试、`review-team` 和 `git diff --check`。
- [x] 使用 `chrome-devtools` MCP 在真实 `one.alimama.com` 页面复验矩阵页生成链路。
- [x] 回填改动摘要、验证记录和结果复盘。

## 改动摘要
- 根因是矩阵页 `生成计划` 按钮的禁用态把“已添加商品”和“已启用策略”等生成前置条件也纳入了按钮级禁用判断；真实页面里矩阵已开启且有组合，但商品池为空时按钮被置灰，用户无法点击并看到已有的错误提示。
- 已将按钮可点击条件收窄为“当前场景允许编辑矩阵维度”，缺矩阵配置、缺商品或缺策略时仍允许点击，由既有点击守卫输出可操作日志。
- 已在点击生成前主动同步矩阵页当前营销目标和维度 UI 状态，避免刚编辑的矩阵配置尚未写回草稿时被旧状态阻断。
- 已更新矩阵回归测试，覆盖按钮不再被缺商品前置条件置灰，以及点击链路会先同步场景和矩阵配置。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/matrix-plan-config.test.mjs`：通过，24/24。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/matrix-plan-config.test.mjs tests/matrix-bid-target-cost-package.test.mjs tests/matrix-dimension-structured-values.test.mjs tests/keyword-trend-theme-setting.test.mjs`：通过，41/41。
- `git diff --check`：通过。
- `node --test tests/*.test.mjs`：通过，423 个测试，421 通过，2 个跳过（既有 `agent-cluster/index.mjs` 缺失）。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `chrome-devtools` MCP（2026-05-05）：刷新 unpacked extension 后，在真实 `one.alimama.com` 页面打开批量建计划 API 向导，矩阵页无完整配置时 `生成计划` 按钮可点击，点击后日志提示 `请先开启矩阵并补齐至少 1 组有效组合，再生成计划`。
- `chrome-devtools` MCP（2026-05-05）：添加 1 个真实商品后进入矩阵页，点击 `补齐5维` 得到 `矩阵：开启 ｜ 组合 32 ｜ 批次 4`，点击 `生成计划` 后成功回到首页计划列表，显示 `已选 33 个`，日志提示 `已生成计划 32 个，已追加到首页计划列表（共 33 个）`。
- 验证过程中未点击 `立即投放`，未真实创建或提交线上计划；验证后已通过向导 API 清理会话草稿。

## 结果复盘
- 本轮缺陷不是矩阵物化核心失败，而是 UI 层把可诊断的前置条件提前折叠成禁用态，导致用户无法触发已有生成守卫和错误日志。
- 更优雅的修复是保留点击入口，把复杂前置校验集中在生成事件里输出明确原因，而不是继续扩展按钮禁用条件；这样既解决“无法点击”，也避免隐藏真实缺口。
- 真实页面验证覆盖了缺配置诊断链路和完整生成链路；本轮只生成本地草稿计划列表，没有触发线上投放。

# TODO - 2026-05-04 维度卡片支持新增趋势主题组合

## 需求规格
- 目标：
  - 修复矩阵页 `选择趋势主题` 维度卡只能选择 `清空趋势主题` 的问题；
  - 在维度卡片内提供新增/编辑趋势主题组合的入口，复用已有趋势主题选择能力；
  - 新增组合后进入该维度卡的可选值，并可被勾选为矩阵组合值；
  - 保持最终写回 `campaign.trendThemeList`。
- 成功标准：
  - `选择趋势主题` 维度卡中，值下拉除 `清空趋势主题` 外有可新增趋势主题组合的入口；
  - 从卡片入口选择趋势主题后，卡片值摘要显示 `已选 N/6：...`，而不是只有 `清空趋势主题`；
  - 回归测试、构建同步和真实页面 UI 验证通过；
  - 不真实提交线上计划。

## 执行计划（可核对）
- [x] 回顾 lessons，确认矩阵字段修复要覆盖维度卡片完整交互。
- [x] 定位编辑页趋势主题弹窗打开、确认、写回链路。
  - 已确认编辑页 `openKeywordTrendThemeSettingPopup` 返回 `trendThemeRaw/summary`，现有实现只依赖 `campaign.trendThemeList` 隐藏控件，需要改成可接收外部初始值的复用入口。
- [x] 为矩阵趋势主题维度卡增加新增/编辑组合入口，并将结果写回当前行。
  - 已在 `选择趋势主题` 多选面板中加入 `添加趋势主题组合`，确认后写回当前维度并刷新矩阵摘要。
- [x] 更新回归测试覆盖卡片入口和写回摘要。
  - 已覆盖矩阵卡片入口、脱离隐藏字段模式复用趋势主题弹窗、保存后写回当前维度。
- [x] 运行构建、语法、目标测试、全量测试和 `review-team`。
- [x] 使用 `chrome-devtools` MCP 在真实 `one.alimama.com` 页面复验。
- [x] 更新 lessons 与结果复盘。

## 改动摘要
- 已将编辑页趋势主题弹窗改成可复用入口：保留原隐藏控件写回方式，同时支持矩阵页传入 `initialRaw` 的 detached 模式。
- 已在矩阵趋势主题维度卡片的值下拉面板中增加 `添加趋势主题组合` 按钮，复用同一个趋势主题弹窗。
- 已在矩阵维度卡片点击链路中处理弹窗确认结果，将 `trendThemeRaw` 加入当前维度值，移除默认 `清空趋势主题`，并刷新草稿/摘要/预览。
- 已补充趋势主题弹窗和矩阵配置回归测试。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/matrix-plan-config.test.mjs tests/keyword-trend-theme-setting.test.mjs tests/matrix-bid-target-cost-package.test.mjs`：通过，36/36。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/*.test.mjs`：通过，423 个测试，421 通过，2 个跳过（既有 `agent-cluster/index.mjs` 缺失）。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `git diff --check`：通过。
- `chrome-devtools` MCP（2026-05-04）：刷新 unpacked extension 后，在真实 `one.alimama.com` 页面打开 API 向导，矩阵页切到 `关键词推广 -> 趋势明星`，维度卡片新增 `选择趋势主题` 后，值下拉除 `清空趋势主题` 外已显示 `添加趋势主题组合`。
- `chrome-devtools` MCP（2026-05-04）：点击 `添加趋势主题组合` 后成功打开趋势主题弹窗；确认默认推荐后，卡片值摘要显示 `已选 1 项：已选 5/6：美的消毒碗柜、消毒碗柜、消毒碗柜家用等`，可选项中同步出现当前 JSON 组合值；验证后已清理向导草稿，未触发真实计划提交。

## 结果复盘
- 根因是前两轮已经让矩阵页能添加 `选择趋势主题` 维度，但维度值编辑器仍只按已有值渲染；当编辑页没有预先保存趋势主题时，候选列表自然只剩 `清空趋势主题`。
- 修复策略是把编辑页趋势主题弹窗改成可复用的 detached 模式，并通过窄桥暴露给矩阵页；矩阵卡片确认后把 `trendThemeRaw` 序列化为当前维度值，再复用现有矩阵物化写回 `campaign.trendThemeList`。
- 本轮未真实创建或提交线上计划；真实页面验证只覆盖插件运行态、矩阵维度值入口、弹窗选择、卡片摘要和草稿清理。

# TODO - 2026-05-04 维度卡片补齐 `趋势主题` 添加入口

## 需求规格
- 目标：
  - 修复矩阵页 `维度卡片` 中不能自然增加 `趋势主题` 的问题；
  - 在 `关键词推广 -> 趋势明星` 下，除快捷预设外，维度卡片的新增/选择路径也必须能选到 `选择趋势主题`；
  - 保持最终写回 `campaign.trendThemeList` 与可读摘要逻辑不变。
- 成功标准：
  - 点击 `添加维度` 时，若当前目标为 `趋势明星` 且尚未添加趋势主题，应优先新增 `选择趋势主题`；
  - 维度卡片的维度类型下拉可见 `选择趋势主题`；
  - 回归测试、构建同步和真实页面 UI 验证通过；
  - 不真实提交线上计划。

## 执行计划（可核对）
- [x] 回顾 `tasks/lessons.md`，确认矩阵页不能只验证快捷预设路径。
- [x] 定位维度卡片 `添加维度` 与维度类型下拉的候选生成链路。
- [x] 将 `选择趋势主题` 接入维度卡片新增优先级与类型候选。
- [x] 更新回归测试覆盖维度卡片添加路径。
- [x] 运行构建、语法、目标测试、全量测试和 `review-team`。
- [x] 使用 `chrome-devtools` MCP 在真实 `one.alimama.com` 页面复验。
- [x] 更新 `tasks/lessons.md` 与结果复盘。

## 改动摘要
- 已确认维度卡片底部 `添加维度` 只取 `getNextAvailableMatrixPresetKey` 的第一个结果；此前排序先给预算、出价、前缀、商品，导致 `选择趋势主题` 虽在候选目录内，但用户很难从卡片路径直接新增。
- 已新增当前营销目标专属字段优先级：`getMatrixAppendablePresetKeys` 会先取当前目标的场景字段，再取通用推荐维度。
- 在 `关键词推广 -> 趋势明星` 下，维度卡片 `添加维度` 会优先新增 `选择趋势主题`；维度类型下拉仍保留 `选择趋势主题` 可选。
- 已补充回归断言，防止维度卡片添加入口再次只按通用推荐维度排序。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/matrix-plan-config.test.mjs`：通过，24/24。
- `node --test tests/matrix-plan-config.test.mjs tests/keyword-trend-theme-setting.test.mjs tests/matrix-bid-target-cost-package.test.mjs`：通过，36/36。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/*.test.mjs`：通过，423 个测试，421 通过，2 个跳过（既有 `agent-cluster/index.mjs` 缺失）。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `git diff --check`：通过。
- `chrome-devtools` MCP（2026-05-04）：刷新 unpacked extension 后，在真实 `one.alimama.com` 页面打开 API 向导，矩阵页 `关键词推广 -> 趋势明星` 下，维度卡片 `添加维度` 显示 `下一个可加：选择趋势主题`，其 `data-matrix-preset-key` 为 `scene_field:趋势主题`。
- `chrome-devtools` MCP（2026-05-04）：点击维度卡片 `添加维度` 后新增 `选择趋势主题` 行，维度类型下拉包含 `选择趋势主题`；新增后下一张添加卡显示 `冷启加速`，未再暴露 `scene_field:*` 内部 key；随后已移除验证行，未触发真实计划提交。

## 结果复盘
- 根因是上一轮只把当前目标专属字段前置到了快捷预设目录，维度卡片底部 `添加维度` 仍按通用推荐维度排序，所以趋势主题被排在预算/出价/前缀/商品之后。
- 修复策略是把“当前营销目标专属字段”抽成维度卡片追加优先级，并且只保留当前 catalog 中真实可编辑的 key，避免 `scene_field:出价目标` 这类被固定维度承接的内部 key 显示出来。
- 本轮未真实创建或提交线上计划；真实页面验证只覆盖插件运行态、维度卡片添加入口、维度行新增和清理。

# TODO - 2026-05-04 矩阵页补齐 `趋势明星` 的 `选择趋势主题`

## 需求规格
- 目标：
  - 修复批量建计划 API 向导矩阵页中 `关键词推广 -> 趋势明星` 的预设条件缺口；
  - 让矩阵页在切到 `趋势明星` 后可以看到编辑页已有的 `选择趋势主题` 能力；
  - 矩阵组合写回时保留 `campaign.trendThemeList`，避免只写中文展示字段导致最终请求丢失趋势主题。
- 成功标准：
  - 矩阵页 `关键词推广 -> 趋势明星` 快捷预设出现 `选择趋势主题`；
  - 新增维度后默认带入当前编辑页已选趋势主题集合，可作为矩阵组合值使用；
  - 矩阵物化计划时同步写入 `campaign.trendThemeList`；
  - 回归测试、构建同步和真实页面 UI 验证通过；
  - 不真实提交线上计划。

## 执行计划（可核对）
- [x] 回顾 `tasks/lessons.md`，确认目标专属原生控件不能只靠通用字段兜底。
- [x] 定位编辑页 `选择趋势主题` 的控件、隐藏字段和最终请求映射。
- [x] 将 `选择趋势主题` 纳入矩阵页 `趋势明星` 目标专属预设。
- [x] 增加矩阵趋势主题值的安全写回逻辑，保证落到 `campaign.trendThemeList`。
- [x] 更新回归测试覆盖矩阵预设、默认值和物化写回。
- [x] 运行构建、语法、目标测试、全量测试和 `review-team`。
- [x] 使用 `chrome-devtools` MCP 在真实 `one.alimama.com` 页面复验。
- [x] 更新 `tasks/lessons.md` 与结果复盘。

## 改动摘要
- 已将 `关键词推广 -> 趋势明星` 的矩阵快捷预设补齐 `选择趋势主题`，并保留目标专属顺序：`选择趋势主题 / 出价目标 / 冷启加速 / 预算类型 / 人群设置 / 人群优化目标`。
- 已为趋势主题增加矩阵专用适配：从编辑页当前 `campaign.trendThemeList` 生成可选组合值，摘要显示 `已选 N 项` 或 `清空趋势主题`，避免把底层 JSON 直接展示给用户。
- 已在矩阵物化计划时把该维度同步写回 `campaign.trendThemeList`，同时兼容中文展示字段，确保最终请求不会丢失趋势主题。
- 已更新矩阵回归测试，覆盖预设出现、复杂值不过滤、可选值生成和计划物化写回。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/matrix-plan-config.test.mjs`：通过，24/24。
- `node --test tests/matrix-plan-config.test.mjs tests/keyword-trend-theme-setting.test.mjs tests/matrix-bid-target-cost-package.test.mjs`：通过，36/36。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/*.test.mjs`：通过，423 个测试，421 通过，2 个跳过（既有 `agent-cluster/index.mjs` 缺失）。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `git diff --check`：通过。
- `chrome-devtools` MCP（2026-05-04）：刷新 unpacked extension 后，在真实 `one.alimama.com` `关键词推广 -> 搜索卡位` 页面打开 API 向导，矩阵页切到 `关键词推广 -> 趋势明星`，快捷预设已显示 `选择趋势主题`，其 key 为 `scene_field:趋势主题`。
- `chrome-devtools` MCP（2026-05-04）：点击 `选择趋势主题` 预设后新增维度行，展示为 `选择趋势主题`，值摘要为 `清空趋势主题`，未出现底层 JSON；随后已移除该验证维度，未触发真实计划提交。

## 结果复盘
- 根因是趋势主题属于目标专属复杂弹窗字段，底层请求字段为 `campaign.trendThemeList`；矩阵页原有的通用场景字段过滤会排除 JSON 复杂值，且只写中文字段不足以驱动最终请求。
- 修复策略是在矩阵层为趋势主题建立轻量适配：UI 预设、可读摘要、值选项和请求写回一起补齐，不把它伪装成普通文本维度。
- 本轮未真实创建或提交线上计划；真实页面验证只覆盖插件运行态、矩阵预设展示和维度添加/移除。

# TODO - 2026-05-04 矩阵页补充 `营销目标` 选择

## 需求规格
- 目标：
  - 在批量建计划 API 向导矩阵页的 `场景选择` 区域补充 `营销目标`；
  - 让矩阵页可直接切换 `关键词推广` 下的 `搜索卡位 / 趋势明星 / 流量金卡 / 自定义推广` 等目标；
  - 切换后同步编辑页同一份场景条件，并刷新快捷预设与维度可选项。
- 成功标准：
  - 矩阵页在 `场景选择` 下方可见 `营销目标` 行；
  - 点击目标后，编辑页 `营销目标` 和矩阵页快捷预设保持一致；
  - 回归测试、构建同步和真实页面 UI 验证通过；
  - 不真实提交线上计划。

## 执行计划（可核对）
- [x] 回顾 `tasks/lessons.md`，确认浏览器复测前必须刷新运行态。
- [x] 定位矩阵页场景卡片模板、编辑页营销目标行和目标同步链路。
- [x] 实现矩阵页 `营销目标` 行，并接入场景条件 bucket。
- [x] 更新回归测试覆盖矩阵页目标行、选项和点击后刷新链路。
- [x] 运行构建、语法、目标测试、全量测试和 `review-team`。
- [x] 使用 `chrome-devtools` MCP 在真实 `one.alimama.com` 页面复验矩阵页目标行。
- [x] 回填验证记录和结果复盘。

## 改动摘要
- 已在矩阵页 `场景选择` 下方新增 `营销目标` 行，用于直接切换 `关键词推广` 的 `搜索卡位 / 趋势明星 / 流量金卡 / 自定义推广`。
- 已让矩阵页目标切换写回同一份 `sceneSettingValues` bucket，并同步当前编辑策略的 `marketingGoal / sceneSettings`，随后刷新动态配置、矩阵摘要和请求预览。
- 已修正矩阵快捷预设目录：渲染时优先读取矩阵页当前高亮的营销目标，再读编辑 bucket，避免刚切换目标后仍展示旧目标字段。
- 已更新矩阵回归测试，覆盖目标行渲染、点击链路、当前目标优先级和目标专属快捷预设前置。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/matrix-plan-config.test.mjs`：通过，24/24。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/*.test.mjs`：通过，423 个测试，421 通过，2 个跳过（既有 `agent-cluster/index.mjs` 缺失）。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `git diff --check`：通过。
- `chrome-devtools` MCP（2026-05-04）：刷新 unpacked extension 后，在真实 `one.alimama.com` `关键词推广 -> 搜索卡位` 页面打开 API 向导，矩阵页 `场景选择` 下方已显示 `营销目标` 行。
- `chrome-devtools` MCP（2026-05-04）：点击矩阵页 `流量金卡` 后，编辑动态字段变为 `套餐卡 / 套餐包档位 / 套餐包自动续投 / 支付方式`，快捷预设同步显示这些流量金卡专属字段。
- `chrome-devtools` MCP（2026-05-04）：点击矩阵页 `自定义推广` 后，快捷预设恢复 `流量智选 / 冷启加速 / 预算类型 / 人群设置 / 人群优化目标`；未触发真实计划提交。

## 结果复盘
- 根因是矩阵页原本只有场景选择，没有暴露编辑页的 `营销目标` 分支；用户需要在矩阵页做目标切换时，预设目录仍只能从旧的场景默认值或 bucket 推断。
- 修复点选择在 `场景选择` 正下方，和“先选场景、再选该场景下目标”的心智一致，也避免把目标混入维度卡片造成误解。
- 真实页复验时发现扩展运行态可能缓存旧 bundle，因此浏览器验证前必须先在 `chrome://extensions` 重载 unpacked extension，再刷新 `one.alimama.com` 页面。

# TODO - 2026-05-04 `关键词推广` 矩阵页场景预设条件同步编辑页

## 需求规格
- 目标：
  - 修复批量建计划 API 向导矩阵页中 `关键词推广` 的场景选择预设条件；
  - 让矩阵页预设条件与编辑页中已有的条件/字段定义保持同步；
  - 避免后续编辑页新增条件后矩阵页继续遗漏。
- 成功标准：
  - `关键词推广` 在矩阵页选择场景时，可见的预设条件覆盖编辑页同目标条件；
  - 预设条件不会引入其他营销目标不适用的字段；
  - 构建产物与源码同步，相关回归测试通过；
  - 若改动影响 userscript 入口，完成语法与构建校验。
- 非目标：
  - 不重构整个 API 向导；
  - 不真实提交线上计划；
  - 不处理未跟踪临时目录和无关业务文件。

## 执行计划（可核对）
- [x] 回顾 `tasks/lessons.md`，确认本轮要避免只补通用兜底而遗漏真实编辑页条件。
- [x] 建立本轮需求规格、成功标准和验证计划。
- [x] 定位矩阵页场景选择的预设条件生成链路。
- [x] 定位编辑页条件定义和已有同步/复用模式。
- [x] 对比缺失字段，选择最小且可复用的同步修复方案。
- [x] 实现修复并补充/更新回归测试。
- [x] 运行构建、语法和目标/全量测试。
- [x] 使用 `chrome-devtools` MCP 在真实 `one.alimama.com` 页面复验矩阵页预设条件。
- [x] 回填改动摘要、验证记录和结果复盘。

## 改动摘要
- 已建立本轮 goal-driven 计划，并启动只读子代理并行定位矩阵页与编辑页条件链路。
- 已确认矩阵预设来源为固定维度 + `scene_field:*` 场景字段目录，编辑页条件来源为 `sceneSettings / sceneSettingValues`。
- 已在矩阵预设渲染、点击预设和“补齐5维”前同步编辑页当前 `data-scene-field` 控件，避免矩阵页读取旧 bucket。
- 已补齐关键词推广各目标可矩阵化的编辑页条件：`流量智选`、`冷启加速`、`预算类型`、`人群设置`、`人群优化目标` 等；保留高级设置这类复杂弹窗字段的排除，不把 JSON 弹窗误当普通文本维度。
- 已更新 `tests/matrix-plan-config.test.mjs` 覆盖矩阵预设与编辑页条件同步。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/matrix-plan-config.test.mjs`：通过，24/24。
- `node --test tests/matrix-bid-target-cost-package.test.mjs tests/keyword-custom-settings-sync.test.mjs tests/keyword-custom-popup-config.test.mjs`：通过，49/49。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/*.test.mjs`：通过，423 个测试，421 通过，2 个跳过（既有 `agent-cluster/index.mjs` 缺失）。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `chrome-devtools` MCP（2026-05-04）：刷新真实 `one.alimama.com` `关键词推广 -> 搜索卡位` 页面后打开 `关键词推广批量建计划 API 向导`，矩阵页 `关键词推广` 预设已显示 `流量智选`、`冷启加速`、`预算类型`、`人群设置`、`人群优化目标`。
- `chrome-devtools` MCP（2026-05-04）：点击 `人群设置` 预设后，维度值下拉包含 `设置优先投放客户`、`添加精选人群`、`关闭`，未触发真实计划提交。

## 结果复盘
- 根因是矩阵页预设目录读取了静态场景字段目录，但渲染/应用预设前没有先同步编辑页当前 `sceneSettings`，且关键词推广默认矩阵候选遗漏了部分可直接映射的编辑页条件。
- 修复策略是把“同步编辑页字段”收口成矩阵预设入口前置步骤，并只开放能稳定映射请求字段的普通条件；复杂高级设置弹窗继续保持排除，避免把 JSON 配置误作为普通文本维度。
- 本轮未真实创建或提交线上计划；真实页面验证只覆盖插件运行态、矩阵预设展示和值选择。

# TODO - 2026-05-04 `关键词推广 -> 自定义推广` 高级设置/人群/词包收口

## 需求规格
- 目标：
  - 基于当前未提交工作树继续收口，不回退既有趋势明星与关键词四目标改造；
  - 先审读现有改动并确认它们补齐的真实页面能力，再补齐 `关键词推广 -> 自定义推广` 的高级设置、人群、词包和请求一致性缺口；
  - 最终插件配置、请求预览、实际提交裁剪和真实 `one.alimama.com` 页面运行态表现一致。
- 范围：
  - 自定义推广的 `投放资源位 / 投放地域 / 分时折扣` 组合弹窗；
  - 手动出价与智能出价下的人群设置入口分流；
  - `流量智选` 词包在编辑态/预览态保留，提交态按原生契约裁剪；
  - 默认策略与请求预览一致性；
  - 自动化回归、构建校验与 `chrome-devtools` MCP 真实页面复验。
- 非目标：
  - 不真实创建或提交线上计划；
  - 不重构整个关键词计划 API 向导；
  - 不修改未跟踪临时目录、构建产物以外的无关文件。

## 当前未提交改动审读结论
- `defaults-and-presets.js / matrix-scene-fields.js`：已开始把关键词默认策略从 2 类扩展为搜索卡位、趋势明星、流量金卡、自定义推广 4 类，并让矩阵维度按营销目标展示，避免自定义推广看到不属于它的卡位/匹配字段。
- `search-and-draft.js / request-builder-preview.js`：已开始修正自定义推广智能出价预算类型不应强制切每日预算，并让趋势明星 ROI 出价目标不被策略默认值覆盖。
- `render-scene-dynamic-core.js / render-scene-dynamic-item-adzone-popup.js / style.js`：大量改动集中在趋势明星趋势主题原生弹窗，同步补了推荐接口、三红榜、联想搜索、底部已选浮层等真实页面能力。
- `component-config.js`：补齐商品素材图片字段归一化，服务于本店/竞店宝贝选择类弹窗展示。
- 当前缺口集中在自定义推广高级设置组合弹窗、人群设置按出价模式分流、流量智选词包保留/提交裁剪，以及默认策略和请求预览的一致性断言。

## 执行计划（可核对）
- [x] 审读当前未提交改动，按真实页面能力归类并写入本计划。
- [x] 定位自定义推广高级设置、人群设置、词包、请求预览和提交裁剪的现有链路。
- [x] 补齐 `投放资源位 / 投放地域 / 分时折扣` 组合弹窗：三块设置同窗编辑、摘要回填、隐藏字段同步。
- [x] 补齐手动/智能出价的人群设置分流：手动出价展示优先投放客户，智能出价展示人群优化目标，并保证提交字段互不串扰。
- [x] 补齐流量智选词包逻辑：编辑态/预览态保留词包，提交态按原生契约裁剪不应提交的冗余字段。
- [x] 对齐默认策略与请求预览：默认自定义推广策略、预算类型、出价目标、词包和高级设置预览保持一致。
- [x] 增加/更新回归测试，覆盖上述四类能力。
- [x] 运行 `node scripts/build.mjs`、`node scripts/build.mjs --check`、相关 `node --test` 与必要语法检查。
- [x] 使用 `chrome-devtools` MCP 在真实 `one.alimama.com` 自定义推广页面复验弹窗入口、摘要、分流和预览。
- [x] 回填验证记录与结果复盘。

## 改动摘要
- 已建立本轮收口计划。
- 已审读当前工作树并确认既有改动主要在补关键词四目标默认/矩阵契约、趋势明星趋势主题弹窗、商品图片字段归一化和预算/预览一致性。
- 已将自定义推广智能出价下的 `投放资源位 / 投放地域 / 分时折扣` 从三个独立入口收敛为和手动出价一致的组合弹窗，统一写回 `campaign.adzoneList`、`campaign.launchPeriodList`、`campaign.launchAreaStrList`。
- 已补充回归测试：组合弹窗手动/智能双分支、流量智选预览保留与提交裁剪、默认策略与请求预览/最终提交一致性。
- 已在真实页面验证自定义推广智能/手动出价分支：智能出价展示“设置优先投放客户”与“人群优化目标”；手动出价展示“添加精选人群”弹窗入口；两者均保留统一高级设置组合入口。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/keyword-custom-popup-config.test.mjs`：通过，25/25。
- `node --test tests/keyword-custom-mode-wordpackage.test.mjs tests/keyword-custom-preview-submit-parity.test.mjs tests/keyword-custom-popup-config.test.mjs`：通过，46/46。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/keyword-custom-popup-config.test.mjs tests/keyword-custom-mode-wordpackage.test.mjs tests/keyword-custom-preview-submit-parity.test.mjs tests/keyword-custom-settings-sync.test.mjs tests/keyword-custom-native-parity-ui.test.mjs tests/keyword-search-p0-contract.test.mjs tests/matrix-plan-config.test.mjs`：通过，99/99。
- `node --test tests/*.test.mjs`：通过，423 个测试，421 通过，2 个跳过（既有 `agent-cluster/index.mjs` 缺失）。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `chrome-devtools` MCP（2026-05-04）：在真实 `one.alimama.com` 页面复验，页面为 `计划创建_万相台无界版`，店铺为 `美的洗碗机旗舰店`，插件向导切到 `关键词推广 -> 自定义推广`。
- `chrome-devtools` MCP（2026-05-04）：智能出价分支确认存在 `投放资源位/投放地域/分时折扣` 组合行，触发器为 `adzone`，摘要为 `资源位:默认｜地域:全部｜分时:全时段`，隐藏字段同步 `campaign.adzoneList`、`campaign.launchPeriodList`、`campaign.launchAreaStrList`。
- `chrome-devtools` MCP（2026-05-04）：组合弹窗打开后为 `高级设置`，插件弹窗内三个页签为 `投放资源位 / 投放地域 / 分时折扣`。
- `chrome-devtools` MCP（2026-05-04）：手动出价分支确认 `人群设置` 切到 `添加精选人群`，触发器为 `crowd`，并继续保留同一个高级设置组合入口；未触发真实计划提交。

## 结果复盘
- 本轮现有工作树主要在补趋势明星趋势主题与关键词四目标默认能力；自定义推广缺口集中在动态配置层的入口形态与请求层的字段裁剪一致性。
- 最小收口点是把智能出价下分散的资源位、地域、时段入口合并到既有高级设置弹窗，而不是新增第二套弹窗状态；这样手动/智能共享同一组隐藏字段和摘要生成逻辑。
- 词包链路按“预览保留、提交裁剪”处理：预览继续表达 `流量智选` 开关，最终请求只在 adgroup 保留受控的 `wordPackageList`，campaign 不放行词包噪音字段。
- 本轮未真实创建或提交线上计划；真实页面验证只覆盖插件运行态、弹窗和分支切换。

# TODO - 2026-04-30 `趋势明星` 新增趋势主题设置

## 需求规格
- 目标：
  - 浏览真实 `one.alimama.com` 原生 `关键词推广 -> 趋势明星` 页面，弄清“新增趋势主题”的入口、选择逻辑、数据结构和提交字段；
  - 在插件 API 向导中按现有配置风格新增趋势主题设置；
  - 最终组包必须能把插件设置映射到原生 `trendThemeList` 等字段，不影响 P0/P1 已修复的其他关键词目标。
- 范围：
  - 原生页面交互观察与网络/运行态字段确认；
  - `src/optimizer/keyword-plan-api/` 中趋势明星动态配置、草稿、预览和最终组包；
  - 自动化回归测试与 `chrome-devtools` 真实页面复验。
- 非目标：
  - 不真实提交计划；
  - 不重新设计整套趋势明星主题管理；
  - 不触碰用户未跟踪目录或无关业务模块。

## 执行计划（可核对）
- [x] 关闭插件弹窗，切到原生 `趋势明星` 并观察“新增趋势主题”入口与弹窗/列表结构。
- [x] 捕获或推断趋势主题选择后的页面状态与请求字段，确认 `trendThemeList` 元素结构。
- [x] 定位插件中趋势明星场景字段、弹窗组件、预览与最终组包路径。
- [x] 按现有向导风格新增“趋势主题”设置入口，支持选择、展示摘要、保存到草稿与 sceneSettings。
- [x] 将趋势主题设置映射到最终请求的 `campaign.trendThemeList`，并保证请求预览一致。
- [x] 增加回归测试覆盖 UI 入口、草稿字段、预览和组包字段。
- [x] 运行构建、语法、目标测试、全量测试和 `review-team`。
- [x] 用 `chrome-devtools` MCP 刷新真实页面复验插件趋势明星配置入口。
- [x] 回填验证记录和结果复盘。

## 改动摘要
- 已建立本轮修复计划。
- 已通过 `chrome-devtools` MCP 观察真实 `one.alimama.com` 原生 `关键词推广 -> 趋势明星` 页面：
  - 页面入口为 `选择趋势主题 5 / 6`，弹窗标题为 `选择趋势主题`，包含趋势排行榜、快捷联想、已选趋势和候选主题表格；
  - 弹窗打开会请求 `recommendTheme.json`、`recommendThemeExclude.json`、`themeAssociation.json`；
  - 确认选择后会请求 `recommendItem.json`，请求体包含 `trendThemeList` 与 `themeIdList`，并刷新主题数量与推荐商品。
- 已确认趋势主题上限为 6 个；`trendThemeList` 元素结构至少包含 `trendThemeId`、`trendThemeName`，默认推荐主题通常还包含 `itemCount`。
- 已在趋势明星编辑态新增“趋势主题 / 选择趋势主题”专属设置入口，隐藏底层 `campaign.trendThemeList` 原始 JSON 字段。
- 已新增趋势主题弹窗：进入时读取原生 `recommendThemeDefault.json` 与 `recommendTheme.json` 推荐主题，支持搜索、补齐默认、手动添加、移除和清空，确认后写回完整 `trendThemeList` 对象数组。
- 已新增 `tests/keyword-trend-theme-setting.test.mjs` 覆盖 UI 入口、原生推荐接口、6 个主题上限和 `campaign.trendThemeList` 写回链路。
- 根据用户修正，趋势主题候选区已演进为原生同屏三榜单；最新实现保留 4 列信息（`趋势主题 / 指标列 / 推荐商品数 / 操作`），其中指标列按榜单显示 `趋势指数 / 投产指数 / 搜索指数`。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/keyword-search-p0-contract.test.mjs tests/keyword-trend-theme-setting.test.mjs`：通过，9/9。
- `node --test tests/*.test.mjs`：通过，417 个测试，415 通过，2 个跳过（既有 `agent-cluster/index.mjs` 缺失）。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `chrome-devtools` MCP（2026-04-30）：已重新连接调试浏览器并打开原生 `关键词推广 -> 趋势明星` 页面。
- `chrome-devtools` MCP（2026-04-30）：插件弹窗 `选择趋势主题` 已验证为 3 列表头，且无“趋势指数”列；表头顺序为 `趋势主题 / 推荐商品数 / 操作`。

## 结果复盘
- 本轮根因是“提交字段同构”优先于“列表结构同构”，导致首版趋势主题弹窗虽然字段正确，但列布局与原生不一致。
- 修复策略是以原生列结构为准，把候选表头和行网格收敛到 3 列，并补充自动化断言防回退。
- 当前趋势主题链路已同时满足：原生接口拉取、6 个上限控制、完整对象写回、3 列 UI 同构。

## 增补修复（用户二次修正：三红榜缺失）

### 执行计划（可核对）
- [x] 对齐原生榜单入口，确认“趋势红榜 / 效果红榜 / 流量红榜”均在弹窗中可见。
- [x] 补齐榜单切换行为，切换后按对应指标重排候选趋势主题。
- [x] 增加回归测试断言三红榜入口与切换逻辑，防止后续回退。
- [x] 运行构建与目标测试，确认无语法/契约回归。
- [x] 通过 `chrome-devtools` MCP 在真实页面复验三红榜入口与切换。

### 增补改动摘要
- 已在趋势主题弹窗头部增加三红榜入口：`趋势红榜 / 效果红榜 / 流量红榜`，沿用现有插件 tab 视觉风格。
- 已补齐三红榜切换逻辑：切换榜单后按对应指标分组重排候选主题，再按推荐商品数与主题名稳定排序。
- 已更新 `tests/keyword-trend-theme-setting.test.mjs`，新增三红榜入口、切换事件、排序逻辑断言。
- 已增强测试切块工具：当结束锚点缺失时自动回退到尾部切块，避免构建产物结构变更导致假失败。

### 增补验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。
- `node --test tests/keyword-search-p0-contract.test.mjs tests/keyword-trend-theme-setting.test.mjs`：通过，9/9。

## 增补修复（用户八次修正：已选浮条固定在底部，不随列表滚动）

### 执行计划（可核对）
- [x] 把已选主题浮条从顶部改到底部悬浮位置。
- [x] 保证浮条固定在弹窗底部，不随榜单列表滚动漂移。
- [x] 预留底部内容空间，避免浮条遮挡列表末尾行。
- [x] 构建并跑趋势主题专项测试。

### 增补改动摘要
- 结构上将 `am-wxt-scene-trend-selected-dock` 移到趋势主区域底部。
- 样式改为 `position:absolute; left/right/bottom` 固定在主区域底部，替换原 `sticky top`。
- 为主区域增加 `padding-bottom`，给底部浮条留出可滚动可见空间。

### 增补验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。
- `node --test tests/*.test.mjs`：通过，417 个测试，415 通过，2 个跳过（既有 `agent-cluster/index.mjs` 缺失）。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `chrome-devtools` MCP（2026-04-30）：真实页面插件弹窗存在三红榜入口，`document.querySelectorAll('[data-scene-popup-trend-rank-tab]')` 返回 `趋势红榜 / 效果红榜 / 流量红榜`。
- `chrome-devtools` MCP（2026-04-30）：切换 `trend -> effect -> traffic` 后 active tab 正常变更，候选主题前 8 条顺序三组均不相同，证明切换后重排生效。

## 增补修复（用户三次修正：同屏三列 + 趋势指数 + 原生视觉对齐）

### 执行计划（可核对）
- [x] 改造三榜单为同屏并排卡片，不再依赖 tab 切换视图。
- [x] 增加并保留榜单指标列，满足趋势指数可视化诉求。
- [x] 参考原生截图对齐三列标题、副文案、卡片层级和列表行样式。
- [x] 更新回归测试断言三榜单对应指标列与并行渲染逻辑。
- [x] 运行构建、目标测试、全量测试与 `review-team`。
- [x] 通过 `chrome-devtools` MCP 在真实页面复验三列内容与指标标题。

### 增补改动摘要
- 趋势主题弹窗候选区升级为三列同屏卡片：`趋势红榜 / 效果红榜 / 流量红榜`，每列独立滚动，便于并排对比选择。
- 每列指标标题按原生语义区分：趋势列显示 `趋势指数`，效果列显示 `投产指数`，流量列显示 `搜索指数`。
- 三列卡片新增副文案与分列底色；列表主体改为“彩色卡片 + 白色表格区 + 分隔行”结构，视觉更贴近原生截图。
- 指标取值按榜单维度读取：趋势列优先 `trendIndex/trend`，效果列优先 `roi/roiIndex/...`，流量列优先 `searchIndex/capacity/...`。
- 更新 `tests/keyword-trend-theme-setting.test.mjs` 断言，覆盖三榜单指标标题与分榜指标输出逻辑。

### 增补验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。
- `node --test tests/keyword-search-p0-contract.test.mjs tests/keyword-trend-theme-setting.test.mjs`：通过，9/9。
- `node --test tests/*.test.mjs`：通过，417 个测试，415 通过，2 个跳过（既有 `agent-cluster/index.mjs` 缺失）。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `chrome-devtools` MCP（2026-04-30）：真实页面弹窗复验通过，检测到三列榜单且指标列分别为 `趋势指数 / 投产指数 / 搜索指数`。
- `chrome-devtools` MCP（2026-04-30）：运行态校验结果 `count=3`，列标识为 `trend/effect/traffic`，每列均包含副文案与对应指标标题。

## 增补修复（用户四次修正：趋势主题文字可见性 + 已选面板宽度）

### 执行计划（可核对）
- [x] 缩窄右侧“已选趋势”面板宽度，为左侧三榜单释放主内容空间。
- [x] 收紧趋势榜单数值列和操作列固定宽度，优先保证“趋势主题”文本显示。
- [x] 复验移动端断点，避免窄屏出现右侧面板被限宽问题。
- [x] 运行构建和趋势主题专项回归测试。
- [x] 用 `chrome-devtools` MCP 在真实页面测量渲染宽度与首行主题文本可见宽度。

### 增补改动摘要
- `am-wxt-scene-crowd-native-layout` 主栅格调整为左宽右窄（`2.15fr / 0.78fr`），右侧 `am-wxt-scene-crowd-native-right` 限宽 `280px`。
- 趋势榜单行网格调整为 `主题 / 指标 / 商品数 / 操作 = 1fr / 32px / 38px / 34px`（移动端 `1fr / 30px / 34px / 32px`），并对指标列增加省略处理，避免挤压主题文本。
- 已选列表头/行宽度同步收窄为 `1fr / 68px / 48px`（移动端 `1fr / 64px / 44px`），`移除`按钮尺寸下调。
- 移动端媒体查询新增右侧面板复位规则：`max-width:none`、`justify-self:stretch`，保证单列堆叠时不被限宽。

### 增补验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。
- `chrome-devtools` MCP（2026-04-30）：弹窗测量结果 `layoutWidth=1144`，`leftWidth=830.65`，`rightWidth=280`。
- `chrome-devtools` MCP（2026-04-30）：趋势榜单行列模板为 `96.88px 32px 38px 34px`，首行主题文本可见宽度提升到 `97px`，已可直接阅读。

## 增补修复（用户五次修正：弹窗继续加宽 + 输入框边框统一灰色）

### 执行计划（可核对）
- [x] 把趋势主题弹窗最大宽度从 `1180` 提升到更大档位。
- [x] 将“搜索输入框”和“手动添加输入框”边框与聚焦态统一为灰色。
- [x] 构建并运行趋势主题专项测试，确认无回归。
- [x] 页面运行态检查新样式规则已注入。

### 增补改动摘要
- `am-wxt-scene-popup-dialog-filter` 宽度改为 `min(1320px, 98vw)`，同屏可视区域更大。
- 新增输入框样式覆盖：
  - `.am-wxt-scene-crowd-native-toolbar .am-wxt-input`
  - `.am-wxt-scene-crowd-native-manual .am-wxt-input`
  统一为灰色边框，并在 `:focus` 维持灰色与无高亮阴影。

### 增补验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。
- `chrome-devtools` MCP（2026-04-30）：运行态样式检测 `has1320=true`、`hasGrayInputRule=true`，确认新宽度与灰色边框规则生效。

## 增补修复（用户六次修正：输入框高度与按钮对齐）

### 执行计划（可核对）
- [x] 对搜索输入框和手动添加输入框设置固定高度，与同排按钮一致。
- [x] 同步调整输入框行高与垂直内边距，避免“看起来仍不齐”。
- [x] 构建并做趋势主题专项测试。

### 增补改动摘要
- 两个输入框统一新增：`height:30px`、`min-height:30px`、`line-height:28px`、`padding-top/bottom:0`，与同排按钮高度对齐。

### 增补验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。

## 增补修复（用户七次修正：改勾选方式 + 去操作列 + 已选主题置顶浮条）

### 执行计划（可核对）
- [x] 三榜单候选主题从“添加按钮”改为“复选框勾选”交互。
- [x] 去掉候选区“操作”列，仅保留 `主题 / 指标 / 推荐商品数` 三列。
- [x] 移除右侧已选面板，改为顶部置顶已选浮条（含数量、宝贝计数、可移除标签）。
- [x] 支持三榜单表头全选/取消全选（受最多 6 个上限约束）。
- [x] 更新回归测试断言并运行构建、目标测试。

### 增补改动摘要
- 弹窗结构改造：
  - 新增 `am-wxt-scene-trend-selected-dock` 置顶浮条，已选主题以 chip 方式展示，点击 `x` 即移除；
  - 右侧 `am-wxt-scene-crowd-native-right` 已选表格区域移除；
  - 三榜单表头改为勾选样式，加入 `data-scene-popup-trend-select-all` 全选入口。
- 候选行交互改造：
  - 原 `data-scene-popup-trend-add` 按钮逻辑替换为 `data-scene-popup-trend-toggle` 勾选逻辑；
  - 新增 `buildVisibleThemes / syncSelectAllState / toggleTheme`，按当前过滤结果维护“全选/半选”状态；
  - 继续保留最多 6 个主题限制。
- 样式改造：
  - 新增勾选控件视觉 `am-wxt-scene-trend-check*`；
  - 新增顶部浮条和 chip 样式 `am-wxt-scene-trend-selected-*`；
  - 三榜单网格列由 4 列收敛到 3 列，移动端同步收敛。
- 测试改造：
  - `tests/keyword-trend-theme-setting.test.mjs` 新增勾选入口、置顶浮条、移除旧“添加操作列”断言。

### 增补验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。
- `node --test tests/keyword-search-p0-contract.test.mjs tests/keyword-trend-theme-setting.test.mjs`：通过，9/9。

## 增补修复（用户十次修正：已选浮条立即可见 + 效果红榜投产指数无数据）

### 执行计划（可核对）
- [x] 修复趋势主题弹窗底部已选浮条未固定显示问题。
- [x] 补充效果红榜数据来源，修复投产指数显示空值问题。
- [x] 运行构建与趋势主题相关回归测试。

### 增补改动摘要
- 趋势主题弹窗改为专属对话框类名 `am-wxt-scene-popup-dialog-trend-theme`，并将弹窗滚动收敛到内部列表区域，避免整窗滚动导致“需要滚到底部才看到已选浮条”。
- 对趋势主题弹窗补接 `themeAssociation.json` 联想结果（按已选/默认主题种子查询并并入候选池，刷新时同步补拉），作为 AI 联想候选补充。
- 二次修正：趋势主题弹窗必须设置明确高度 `height: min(760px, calc(100vh - 32px))`，并让 `popup-body / trend-layout / trend-main` 逐层撑满，否则 `height:100%` 在 auto 高度父容器下不生效。
- 二次修正：候选合并顺序调整为 `associationThemes -> selectedThemes -> defaultThemes -> nativeBundle.candidateList`，避免带投产指标的联想主题被无指标推荐主题去重覆盖。
- 三次修正：原生 `recommendTheme.json` 同时返回 `trendThemeInfo / effectThemeInfo / capacityThemeInfo` 三个分榜；插件现在分别保存为 `trendRankList / effectRankList / trafficRankList`，并按分榜原始顺序渲染，不再用统一候选池排序模拟三红榜。

### 增补验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。
- `node --test tests/keyword-search-p0-contract.test.mjs tests/keyword-trend-theme-setting.test.mjs`：通过，9/9。
- `chrome-devtools` MCP（2026-04-30）：真实页面弹窗快照已看到 `已选明星趋势主题 5/6` 在当前弹窗可视区域内直接显示。
- `chrome-devtools` MCP（2026-04-30）：已确认原生 `recommendTheme.json` 响应字段：`trendThemeInfo` 对应趋势红榜，`effectThemeInfo` 对应效果红榜，`capacityThemeInfo` 对应流量红榜。

## 增补修复（用户十一次修正：红榜最右标签列 + 手动联想搜索区）

### 执行计划（可核对）
- [x] 补齐三红榜列表最右侧标签/状态列，并保留原生分榜顺序。
- [x] 保留原生响应中的标签、周增幅、收藏加购等字段，避免渲染时丢指标。
- [x] 在红榜下方新增原生风格手动联想搜索区，展示快捷联想与结果表格。
- [x] 将手动联想结果接入当前勾选/已选主题逻辑，支持添加、移除和 6 个上限。
- [x] 更新回归测试覆盖新列、新搜索区和指标字段。
- [x] 构建、运行专项回归与语法检查，并用 `chrome-devtools` MCP 做真实页面复验。

### 增补改动摘要
- `normalizeTrendThemeItem` 现在保留 `recommendItemCount`、`wcvr`、周变化比例、`resourceType`、`trendLv` 和 `tagText` 等原生字段，避免红榜标签和手动联想指标在归一化时丢失。
- 三红榜表格新增最右列：趋势红榜显示 `趋势增长中 / 周增幅 ...`，效果红榜与流量红榜显示 `淘宝热搜 / 行业趋势 / 大促热销` 等原生标签。
- 修复趋势红榜状态列误用 `trendLv` 单字母等级的问题，趋势列优先读取周增幅与趋势状态，不再显示 `A`。
- 红榜下方新增原生风格手动联想搜索区，包含 `关键词 / 本店宝贝 / 竞店宝贝` 入口、`深度搜索`、快捷联想已选趋势、结果表格和添加/移除操作。
- 手动联想结果已并入候选池，和红榜勾选、底部已选浮条、6 个上限共用同一套选择逻辑。
- 回归测试新增红榜标签列、联想搜索区、联想结果勾选和指标字段保留断言。

### 增补验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。
- `node --test tests/keyword-search-p0-contract.test.mjs tests/keyword-trend-theme-setting.test.mjs`：通过，9/9。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `chrome-devtools` MCP（2026-04-30）：真实 `one.alimama.com` 页面刷新后打开插件趋势主题弹窗，检测到红榜标签列前 8 项为 `趋势增长中 / 周增幅 13.8% / 周增幅 270.4% / ...`，不再显示 `A`。
- `chrome-devtools` MCP（2026-04-30）：真实页面弹窗检测到手动联想区，表头为 `趋势主题 / 推荐店铺商品数 / 趋势指数 / 搜索指数 / 竞争热度 / 收藏加购指数 / 转化指数 / 投产指数 / 操作`。
- `chrome-devtools` MCP（2026-04-30）：真实页面弹窗底部已选浮条仍为 `absolute` 固定在弹窗内部底部，当前显示 `已选明星趋势主题 5/6`。

## 增补修复（用户十二次修正：红榜标签完整显示 + 区域增高 + 已选浮条固定）

### 执行计划（可核对）
- [x] 放宽趋势红榜最右列宽度，确保 `趋势增长中 / 周增幅 xx%` 完整显示。
- [x] 按原生语义修正趋势标签颜色：增长状态为绿色，周增幅为红色；效果/流量标签按标签类型区分颜色。
- [x] 将红榜区域和下方手动联想搜索区高度提高约一倍，减少滚动压缩。
- [x] 把已选明星趋势主题浮条改为弹窗内悬浮固定层，不受弹窗内容滚动影响。
- [x] 更新回归测试并完成构建、专项测试、真实页面复验。

### 增补改动摘要
- 红榜行网格最右列从 `70px` 放宽到 `112px`，并为趋势红榜标签增加 `data-rank-tag-tone`，避免 `周增幅 270.4%` 等文案被截断。
- 标签颜色按语义区分：`趋势增长中` 为绿色，`周增幅` 为红色，`淘宝热搜` 为橙色，`行业趋势` 为蓝紫色，`大促热销` 为红色。
- 红榜区高度放大到 `420px`，手动联想区高度放大到 `380px`，弹窗高度提升到 `min(960px, calc(100vh - 16px))`。
- 已选明星趋势主题条改为相对专属弹窗的悬浮层，定位在底部操作按钮上方（`bottom:62px`），内容区滚动时不随内容移动。
- 更新趋势主题专项测试，覆盖悬浮层、放大高度和标签 tone 输出。

### 增补验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。
- `node --test tests/keyword-search-p0-contract.test.mjs tests/keyword-trend-theme-setting.test.mjs`：通过，9/9。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- `chrome-devtools` MCP（2026-04-30）：真实页面刷新后复验，弹窗尺寸 `1320x960`，红榜区域高度 `420px`，手动联想区高度 `380px`。
- `chrome-devtools` MCP（2026-04-30）：趋势红榜前 12 个标签均完整显示，示例 `趋势增长中 / 周增幅 13.8% / 周增幅 270.4%`；增长状态为绿色，周增幅为红色。
- `chrome-devtools` MCP（2026-04-30）：已选主题条 `position:absolute`，相对趋势主题弹窗悬浮在操作按钮上方，`bottom:62px`，内容滚动不改变位置。

---

# TODO - 2026-04-30 `onebpSearch` API 向导 P1 修复

## 需求规格
- 目标：
  - 完成上一轮对照检查中标记的 P1 问题，补齐关键词推广四类营销目标在默认策略、矩阵兜底、预算类型与请求预览层的目标感知行为；
  - 保持 P0 已修好的 `搜索卡位 / 趋势明星 / 流量金卡 / 自定义推广` UI 与最终请求契约不回退；
  - 用自动化回归和真实页面 `chrome-devtools` MCP 验证证明修复有效。
- 范围：
  - 默认策略列表、矩阵字段兜底、卡位方式兜底选项、自定义推广预算类型、请求预览覆盖逻辑；
  - `src/optimizer/keyword-plan-api/` 相关实现与 `tests/*.test.mjs` 回归测试；
  - 构建、语法、单测、review-team 和真实页面浏览器复验。
- 非目标：
  - 不真实提交计划；
  - 不重新摸排 `addList.md` 未覆盖的新分支；
  - 不处理 P2 的完整控件体验增强。

## 执行计划（可核对）
- [x] 静态核查 P1 五项清单，区分 P0 已覆盖项与仍需修复项。
- [x] 补齐或重构默认策略列表，使 `搜索卡位 / 趋势明星 / 流量金卡 / 自定义推广` 均有目标感知默认策略。
- [x] 按营销目标收敛矩阵兜底字段，确保四目标混合默认矩阵不注入 `卡位方式 / 匹配方式`。
- [x] 修正自定义推广智能出价预算类型，不再把文档样本应为 `day_average` 的链路强制为 `normal`。
- [x] 复核 `request-builder-preview.js` 的策略覆盖逻辑，确保不会覆盖 `搜索卡位 / 流量金卡 / 趋势明星 ROI` 原生字段。
- [x] 补充或更新回归测试，覆盖 P1 默认策略、矩阵兜底、预算类型和预览覆盖。
- [x] 运行构建、语法、全量测试和 `bash scripts/review-team.sh`。
- [x] 通过 `chrome-devtools` MCP 刷新真实页面并复验 P1 相关 UI/运行态。
- [x] 回填验证记录、结果复盘和剩余风险。

## 改动摘要
- 已补齐关键词推广默认策略列表，默认草稿现在直接包含 `搜索卡位 / 趋势明星 / 流量金卡 / 自定义推广` 四类目标，并为搜索卡位、流量金卡补齐目标感知的基础场景设置。
- 已把关键词推广矩阵兜底从场景级数组改为目标感知配置：四目标混合默认状态只展示安全维度；`卡位方式` 兜底选项补齐 `位置不限提升市场渗透`；趋势明星、流量金卡、自定义推广不会被矩阵默认注入 `卡位方式 / 匹配方式`。
- 已移除自定义推广智能出价下强制 `dmcType=normal` 的最终组包逻辑，恢复按真实来源与 `DEFAULTS.dmcType=day_average` 兜底。
- 已修正请求预览层的趋势明星出价目标读取优先级：趋势明星优先使用场景里的 `出价目标 / 优化目标`，避免策略默认 `conv` 覆盖 ROI。
- 已更新回归测试，覆盖默认策略四目标、矩阵目标感知兜底、`permeability` 选项、自定义推广预算类型、搜索/金卡固定目标与趋势明星 ROI 预览。

## 验证记录
- `node scripts/build.mjs`：通过，已重新生成根 userscript、packages 与 extension page bundle。
- `node scripts/build.mjs --check`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/keyword-search-p0-contract.test.mjs tests/keyword-custom-mode-wordpackage.test.mjs tests/keyword-custom-settings-sync.test.mjs tests/matrix-plan-config.test.mjs`：通过，61/61。
- `node --test tests/*.test.mjs`：通过，414 个测试，412 通过，2 个跳过；跳过项仍为既有可选 `agent-cluster/index.mjs` 缺失。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `chrome-devtools` MCP：已刷新真实 `one.alimama.com` 页面并确认插件运行态存在 `__AM_WXT_KEYWORD_API__`。
- `chrome-devtools` MCP：清空旧草稿后打开向导，默认策略列表为 4 个目标：`搜索卡位 / 趋势明星 / 流量金卡 / 自定义推广`，且预算类型均为 `day_average`。
- `chrome-devtools` MCP：矩阵页四目标混合默认状态未展示可注入的 `卡位方式 / 匹配方式` 场景维度，仅展示安全兜底维度。
- `chrome-devtools` MCP：搜索卡位编辑态仍展示 `卡位方式 / 匹配方式`，并包含 `位置不限提升市场渗透`。

## 结果复盘
- P1 的根因分成两类：默认策略仍停留在两目标时代，矩阵兜底仍按“关键词推广”整体注入字段，导致四目标默认策略扩展后更容易把 `卡位方式 / 匹配方式` 错写进不匹配目标。
- 修复策略采用“安全默认 + 目标感知”：默认策略补四目标；矩阵在混合目标默认状态只暴露不会污染目标契约的维度，目标相关字段必须由目标上下文明确驱动。
- 自定义推广预算类型不再在智能出价下强制改成 `normal`；后续若要支持用户显式选择每日预算，仍应通过场景预算字段进入，而不是在最终裁剪层无条件覆盖。
- 本轮未真实提交计划，避免影响线上投放；请求契约通过自动化测试和预览层源码契约覆盖，UI 运行态通过真实页面刷新复验。

---

# TODO - 2026-04-29 `onebpSearch` API 向导 P0 修复

## 需求规格
- 目标：
  - 修复关键词推广 API 向导 P0 问题，使 `搜索卡位`、`趋势明星`、`流量金卡`、`自定义推广` 的最终组包按各自真实请求契约保留关键字段；
  - 避免四类关键词营销目标继续统一套用 `自定义推广/智能出价` 的字段裁剪逻辑；
  - 补齐 P0 中明确要求的运行时默认值、字段映射、控件展示/隐藏和最终请求保留字段。
- 范围：
  - `src/optimizer/keyword-plan-api/` 下默认值、场景动态表单、请求预览、草稿组包与字段裁剪；
  - 覆盖 P0 关键字段的回归测试；
  - 构建、语法、单测和 review-team 验证。
- 非目标：
  - 不重新抓真实页面流量；
  - 不真实提交计划；
  - 不处理 P1/P2 中未被 P0 依赖的完整体验增强。

## 执行计划（可核对）
- [x] 定位 P0 涉及代码路径和现有测试契约，确认最小侵入方案。
- [x] 为四类关键词营销目标拆分目标感知的字段保留和默认映射。
- [x] 修复 `搜索卡位`、`趋势明星`、`流量金卡` 的 P0 运行时默认值、UI 控件和请求字段组包。
- [x] 补充或更新关键回归测试，覆盖 P0 字段不丢失与目标特异映射。
- [x] 运行 `node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"`、`node --test tests/*.test.mjs`、`bash scripts/review-team.sh`。
- [x] 通过 `chrome-devtools` MCP 复验刷新插件后的真实页面 UI。
- [x] 回填验证记录、结果复盘和剩余风险。

## 改动摘要
- 已建立本次 P0 修复计划，待进入代码定位。
- 已确认核心落点：
  - `src/optimizer/keyword-plan-api/runtime.js`：关键词目标默认契约与动态字段兜底；
  - `src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-core.js`：编辑态控件展示/隐藏；
  - `src/optimizer/keyword-plan-api/request-builder-preview.js`：策略预览层对出价目标的通用覆盖；
  - `src/optimizer/keyword-plan-api/search-and-draft.js`：最终请求组包、字段保留和目标契约裁剪。
- 已完成四类关键词目标的目标感知运行时契约拆分：
  - `搜索卡位` 固定 `promotion_scene_search_detent / itemSelectedMode=search_detent / bidType=max_amount / dmcType=day_average / searchDetentType`；
  - `趋势明星` 固定 `promotion_scene_search_trend / itemSelectedMode=trend / trendType`，并区分普通智能目标、ROI 与平均直接成交成本契约；
  - `流量金卡` 固定 `promotion_scene_golden_traffic_card_package / itemSelectedMode=user_define / bidTargetV2=conv`，并保留套餐、订单与续投字段；
  - `自定义推广` 继续保留自定义智能/手动出价链路，并补齐 `aiMaxSwitch / aiMaxInfo` 等原生字段保留。
- 已修复真实页面复验暴露的 UI 残留：`趋势明星 / 流量金卡` 不再从通用关键词兜底里显示 `核心词设置 / 匹配方式 / 卡位方式 / 流量智选`。
- 已修复最终复验暴露的搜索卡位细节：`卡位方式` 只在 `搜索卡位` 下展示，并强制补齐 `位置不限提升市场渗透`；`自定义推广` 不再残留 `卡位方式`。
- 已新增 `tests/keyword-search-p0-contract.test.mjs`，并更新既有 UI 契约测试，覆盖 P0 默认值、字段保留、目标分支组包、编辑态隐藏和请求预览覆盖。

## 验证记录
- `node scripts/build.mjs`：通过，已重新生成根 userscript、packages 与 extension page bundle。
- `node scripts/build.mjs --check`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/keyword-search-p0-contract.test.mjs`：通过，5/5。
- `node --test tests/*.test.mjs`：通过，412 个测试，410 通过，2 个跳过；跳过项为既有可选 `agent-cluster/index.mjs` 缺失。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `chrome-devtools` MCP：已确认真实 `one.alimama.com` 页面、插件面板与 API 向导可打开；清空旧草稿后发现并修复了 `趋势明星` 仍显示通用 `匹配方式` 的 UI 残留。
- `chrome-devtools` MCP 最终复验：通过，真实页面 URL 为 `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSearch&promotionScene=promotion_scene_search_detent&stepIndex=1&subStepIndex=0`。
  - `搜索卡位`：不显示通用 `出价方式 / 出价目标`，显示 `卡位方式`，并包含 `位置不限提升市场渗透`；保留 `匹配方式 / 手动关键词`。
  - `趋势明星`：显示 `出价方式 / 出价目标 / 平均直接成交成本`，不显示 `卡位方式 / 匹配方式 / 手动关键词`。
  - `流量金卡`：显示 `套餐卡 / 套餐包档位 / 套餐包自动续投 / 支付方式`，不显示 `出价方式 / 出价目标 / 卡位方式 / 匹配方式 / 手动关键词`。
  - `自定义推广`：显示 `出价方式 / 出价目标 / 匹配方式 / 手动关键词`，不显示 `卡位方式`。

## 结果复盘
- 本次根因是关键词推广四个营销目标此前共用“自定义推广/智能出价”模型，导致默认值、字段裁剪、请求预览和最终组包都会覆盖或丢弃非自定义目标的原生字段。
- 修复策略采用目标感知分支，而不是继续扩大单一 allowlist：默认值、UI 过滤、请求预览与最终裁剪均按 `搜索卡位 / 趋势明星 / 流量金卡 / 自定义推广` 分别处理。
- 真实页面复验发现旧草稿与通用兜底字段会掩盖新逻辑；后续复验必须先清空或切换到新草稿，避免用历史草稿判断当前实现。
- 本轮剩余风险：未真实提交计划，避免影响线上投放；最终请求契约通过自动化回归覆盖，真实页面复验覆盖到向导 UI 字段收敛。

---

# TODO - 2026-04-28 `onebpSearch` API 向导编辑选项对照检查

## 需求规格
- 目标：
  - 以 `addList.md` 作为关键词推广新建计划最终请求的唯一对照来源；
  - 检查插件“关键词推广批量建计划 API 向导”的编辑态选择项；
  - 明确哪些选项已正确覆盖、哪些漏配、哪些实现存在风险；
  - 建立可执行修复清单，暂不直接修改业务逻辑。
- 范围：
  - `onebpSearch` 下已沉淀的 `搜索卡位`、`趋势明星`、`流量金卡`、`自定义推广`；
  - 向导编辑 UI 的可见选择项、默认值、字段映射、提交组包相关逻辑；
  - 已有测试中的关键词推广契约。
- 非目标：
  - 不重新抓真实页面流量；
  - 不真实提交计划；
  - 不在本轮直接实现修复，除非后续明确要求。

## 执行计划（可核对）
- [x] 阅读并提取 `addList.md` 中 `onebpSearch` 控件与字段映射。
- [x] 定位 API 向导编辑 UI、场景配置、提交组包、测试覆盖。
- [x] 对照四类营销目标，标记已覆盖、遗漏、问题项。
- [x] 按优先级输出修复清单，包含预期字段与验证方式。
- [x] 回填本文件的结果复盘。

## 改动摘要
- 已建立本轮检查计划。
- 已完成 `addList.md` 第 17-20 章的 `onebpSearch` 样本对照，覆盖 `搜索卡位`、`趋势明星`、`流量金卡`、`自定义推广` 四个营销目标。
- 已完成 API 向导编辑态相关代码静态检查，重点检查默认策略、营销目标运行时映射、动态表单、请求预览、最终组包与字段裁剪逻辑。
- 本轮仅形成修复清单，未修改业务逻辑。

## 验证记录
- 已对照文档样本：
  - `搜索卡位`：`KS01-KS10`
  - `趋势明星`：`KT01-KT25`
  - `流量金卡`：`GK01-GK09`
  - `自定义推广`：`KD01-KD03`
- 已检查实现文件：
  - `src/optimizer/keyword-plan-api/runtime.js`
  - `src/optimizer/keyword-plan-api/wizard-style-and-state/defaults-and-presets.js`
  - `src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-core.js`
  - `src/optimizer/keyword-plan-api/request-builder-preview.js`
  - `src/optimizer/keyword-plan-api/search-and-draft.js`
- 已确认一个子代理完成 `addList.md` 字段提取；另一个实现检查子代理因额度中断，已由本轮本地静态检查补足。
- 本轮未运行构建或测试，因为未修改业务代码；后续实现修复时必须执行 `node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"`、`node --test tests/*.test.mjs`，涉及 UI 后还需通过 `chrome-devtools` MCP 做真实页面验证。

## 结果复盘
- 已设置好的部分：
  - `关键词推广` 的营销目标候选已经包含 `搜索卡位 / 趋势明星 / 流量金卡 / 自定义推广`。
  - 营销目标切换后，运行时已有把 `promotionScene / itemSelectedMode` 同步进场景设置的基础逻辑。
  - 编辑态已有计划名称、预算、出价方式、部分出价目标、冷启加速、投放资源位、投放时间、投放地域、手动关键词等通用控件。
  - `自定义推广` 是当前覆盖最完整的目标，已有智能/手动出价、人群、成本约束、高级设置和手动关键词面板。
  - `冷启加速` 到 `campaignColdStartVO.coldStartStatus` 的基础映射已经存在。
- 总体问题：
  - 当前实现把四个关键词营销目标过度套进同一套“自定义推广/智能出价”模型，导致 UI 选择项、默认值、字段保留和最终组包都与 `addList.md` 的真实请求不完全一致。
  - 字段裁剪函数按通用 allowlist 处理全部关键词目标，会丢弃 `searchDetentType / trendType / trendThemeList / packageId / planId / orderInfo / orderAutoRenewalInfo / launchTime / aiMaxSwitch / aiMaxInfo` 等真实请求关键字段。
  - 动态表单对 `趋势明星`、`流量金卡` 仍展示 `卡位方式 / 匹配方式 / 手动关键词` 这类不匹配控件，反而缺少主题、套餐、自动续投、人群目标等真实控件。
- P0 修复清单：
  - 为 `搜索卡位 / 趋势明星 / 流量金卡 / 自定义推广` 拆分独立的关键词目标契约，不再把全部关键词目标统一走 `pruneKeywordCampaignForCustomScene`。
  - `搜索卡位` 需要把 `卡位方式` 映射为 `searchDetentType`，补齐 `permeability`，使用真实 `bidType=max_amount` 和 `dmcType=day_average`，隐藏通用智能出价目标和平均直接成交成本。
  - `趋势明星` 需要移除 `卡位方式 / 匹配方式 / 手动关键词`，新增并保留 `trendType / trendThemeList / itemIdList / adgroupList / crowdList / adzoneList / launchAreaStrList / launchPeriodList`。
  - `趋势明星` 的出价目标需要按真实请求处理：`conv / click / coll_cart` 保持普通智能目标，`roi` 只保留 `bidTargetV2=roi + constraintType=roi + constraintValue`，平均直接成交成本走 `setSingleCostV2=true + constraintType=dir_conv + constraintValue` 且不提交 `optimizeTarget`。
  - `流量金卡` 需要把运行时默认修正为 `itemSelectedMode=user_define`、`bidTargetV2=conv`，并新增套餐卡、套餐包档位、自动续投、支付方式、冷启开关等控件与字段保留。
  - 最终组包需要按目标保留真实字段，至少补齐 `searchDetentType`、`trendType`、`trendThemeList`、`packageId`、`packageTemplateId`、`planId`、`planTemplateId`、`orderInfo`、`orderAutoRenewalInfo`、`orderChargeType`、`launchTime`、`aiMaxSwitch`、`aiMaxInfo`。
- P1 修复清单：
  - 默认策略列表当前只有 `趋势明星` 与 `自定义推广`，需要补齐或改造成能覆盖 `搜索卡位` 与 `流量金卡`。
  - 矩阵兜底配置需要按营销目标分组，避免给 `趋势明星 / 流量金卡 / 自定义推广` 注入 `卡位方式 / 匹配方式`。
  - `卡位方式` 兜底选项缺少 `位置不限提升市场渗透`，需要补齐并映射为 `permeability`。
  - `自定义推广` 需要保留 `aiMaxSwitch / aiMaxInfo`，并修正智能出价下把预算类型强制改为 `normal` 的逻辑，文档样本为 `dmcType=day_average`。
  - `request-builder-preview.js` 当前会用策略出价目标覆盖场景设置，后续需要改为目标感知，避免覆盖 `搜索卡位 / 流量金卡 / 趋势明星 ROI` 的原生字段。
- P2 修复清单：
  - 为四个营销目标分别补回归测试，断言 UI 设置到最终 `solution/addList.json` 请求体的关键字段。
  - 后续如果要完整支持 `自定义推广` 的出价目标、成本约束、预算类型、高级设置，还需要继续补抓 `addList.md`。
  - 后续如果要完整支持 `流量金卡` 的自动续投门槛与支付方式，还需要再次抓取有效样本，因为当前 `GK08 / GK09` 样本未观察到阈值和支付方式真实落库。

---

# TODO - 2026-04-28 `onebpSearch` 关键词推广提交流量摸排

## 需求规格
- 目标：
  - 在真实 `one.alimama.com` 页面继续覆盖“下一个场景”，默认从 `关键词推广` 开始；
  - 先确认该场景的 `bizCode`、默认营销目标、商品前置条件与提交前最后一跳接口；
  - 继续沿用离线提交方式，逐步沉淀到 `addList.md`。
- 范围：
  - Chrome DevTools MCP 真实页面测试；
  - `关键词推广` 的页面结构梳理、前置条件确认、离线提交抓包；
  - `tasks/todo.md` 进度同步。
- 非目标：
  - 不真实提交计划；
  - 不修改业务代码；
  - 本轮先从 `关键词推广` 开始，不承诺一次覆盖完全部关键词子场景。

## 执行计划（可核对）
- [x] 恢复 DevTools 连接并切回真实阿里妈妈页面。
- [x] 切换到下一个场景 `关键词推广`，确认 URL 与默认营销目标。
- [x] 跑通 `关键词推广` 当前默认子场景的离线提交，确认接口与请求体结构。
- [x] 梳理该场景的首批可确认分支，并补写到 `addList.md`。
- [x] 回填验证记录与结果复盘。
- [x] 补抓“核心词设置 -> 添加关键词”入口及其对 `wordList` 的影响。
- [x] 补抓“手动输入添加关键词”入口及其对 `wordList` 的影响。
- [x] 补抓“清空关键词”入口及页面阻塞/提交前置条件。
- [x] 补抓“广泛 / 中心词 / 精准”切换对 `wordList.matchScope` 的影响。
- [x] 重新验证 `位置不限提升市场渗透` 的真实选中行为与提交字段。
- [x] 切换到下一个关键词营销目标，抓取新的基线提交结构。
- [x] 补抓 `趋势明星 -> 设置平均直接成交成本` 的默认档、分档与自定义值。
- [x] 补抓 `趋势明星 -> 设置优先投放客户 / 人群优化目标` 总开关对 `crowdList` 的影响。
- [x] 补抓 `趋势明星 -> 新客户获取 / 流失老客挽回 / 高价值客户获取` 三个人群开关。
- [x] 验证 `趋势明星` 的人群倍率输入是否真实落到提交体。
- [x] 补抓 `趋势明星 -> 选择趋势主题` 对 `trendThemeList` 的影响。
- [x] 补抓 `趋势明星 -> 添加自选商品` 对 `itemIdList / adgroupList` 的影响。
- [x] 补抓 `趋势明星 -> 清空` 对 `trendThemeList / itemIdList / adgroupList` 的影响。
- [x] 补抓 `趋势明星 -> 高级设置 -> 投放地域 / 投放时间` 的非默认提交结构。
- [x] 复核 `趋势明星 -> 设置平均直接成交成本` 的默认档是否为动态值。
- [x] 补抓 `流量金卡` 基线、解决方案卡切换与套餐包档位切换。
- [x] 补抓 `流量金卡` 的冷启开关与套餐包自动续投开关。
- [x] 补抓 `自定义推广` 基线（含加商品后可提交态）。
- [x] 补抓 `自定义推广 -> AI点睛` 关闭后的可提交分支。
- [x] 补抓 `趋势明星 -> 高级设置 -> 投放资源位` 的非默认结构。

## 改动摘要
- 已从 `货品全站推广` 切换到 `关键词推广`。
- 当前页面 URL：
  - `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSearch&promotionScene=promotion_scene_search_detent`
- 当前默认营销目标：
  - `搜索卡位`
- 已把 `关键词推广 -> 搜索卡位` 的基线样本与首批分支写入 `addList.md`：
  - `KS01` 基线
  - `KS02` 抢前三
  - `KS03` 抢首页
  - `KS04` 冷启加速 = 关
  - `KS05` 添加关键词（推荐词：美的小魔方）
  - `KS06` 手动输入关键词（方太水槽）
  - `KS07` 手动词匹配方式 = 中心词
  - `KS08` 手动词匹配方式 = 精准
  - `KS09` 清空关键词
  - `KS10` 位置不限提升市场渗透
- 已新增 `关键词推广 -> 趋势明星` 的基线与首批分支：
  - `KT01` 基线
  - `KT02` 冷启加速 = 关
  - `KT03` 出价目标 = 增加点击量
  - `KT04` 出价目标 = 增加收藏加购量
  - `KT05` 出价目标 = 稳定投产比（推荐档 6.89）
  - `KT06` 稳定投产比档位 = 5.51
  - `KT07` 稳定投产比档位 = 8.27
  - `KT08` 稳定投产比档位 = 自定义 7.11
- 已继续补齐 `趋势明星` 的成本与人群层：
  - `KT09` 平均直接成交成本 = 默认档 370.9
  - `KT10` 平均直接成交成本 = 445.08
  - `KT11` 平均直接成交成本 = 296.72
  - `KT12` 平均直接成交成本 = 自定义 333.33
  - `KT13` 设置优先投放客户 = 关
  - `KT14` 人群优化目标 = 关
  - `KT15` 新客户获取 = 关
  - `KT16` 流失老客挽回 = 关
  - `KT17` 高价值客户获取 = 关
  - `KT18` 新客户倍率 = 1.8
  - `KT19` 高价值客户倍率 = 1.6
- 已继续补齐 `趋势明星` 的商品与主题层：
  - `KT20` 选择趋势主题 = 补满第 6 个主题（美的酷省电二代空调）
  - `KT21` 清空 = 趋势主题与商品全部清空
  - `KT22` 添加自选商品 = 新增 `1029803691231`
- 已继续补齐 `趋势明星` 的高级设置层：
  - `KT23` 投放地域 = 取消上海
  - `KT24` 投放时间 = `08:00-13:00`
- 已追加复核 `趋势明星 -> 设置平均直接成交成本`：
  - 旧样本默认档 `constraintValue = 370.9`
  - 当前页面在 `dayAverageBudget = 1430` 下，默认档已变为 `362.56`
  - 结论：默认档是动态值，不能硬编码
- 已补齐用户指出的遗漏点：
  - `核心词设置 -> 添加关键词`
- 已新增 `关键词推广 -> 流量金卡` 的基线与首批分支：
  - `GK01` 类目精准词卡基线（`packageId=47, planId=171, orderAmount=500`）
  - `GK02` 百亿秒杀节-大促成交抢量卡（`packageId=2008, planId=158, orderAmount=3000`）
  - `GK03` 一人食炖煮家电高转化卡（补商品到 `8/30` 后可提交）
  - `GK04` 增量畅享包（`planId=228, orderAmount=10000`）
  - `GK05` 自定义成交包（`planId=229, orderAmount=30000`）
  - `GK06` 冷启加速=关（`coldStartStatus=0`）
  - `GK07` 套餐包自动续投=关（`orderAutoRenewalSwitch=0`）
  - `GK08` 设置自动续投门槛（当前样本 `orderAutoRenewalCondition` 仍为空）
  - `GK09` 点击支付宝支付（当前样本 `orderChargeType` 仍为 `balance_charge`）
- 已新增 `关键词推广 -> 自定义推广` 基线：
  - `KD01` 自定义选品基线（加商品后）：
    - `promotionScene=promotion_scene_search_user_define`
    - `itemSelectedMode=user_define`
    - `bidTypeV2=smart_bid`
    - `bidTargetV2/optimizeTarget=conv`
    - `dmcType=day_average, dayAverageBudget=1480`
    - `itemIdListLength=8, adgroupListLength=8`
- 已补齐 `自定义推广` 的关键分支：
  - `KD02` `AI点睛=关`（`aiMaxSwitch=0`）
  - `KD03` `核心词设置->添加关键词(洗碗机家用全自动)`（新增词同步写入全部 `8` 个 adgroup）
- 已补齐 `趋势明星` 的高级设置最后分支：
  - `KT25` `投放资源位=仅1个开启`（`adzoneList` 呈现 `pause + start` 组合）

## 验证记录
- 浏览器连接：
  - `http://127.0.0.1:9222/json/version` 正常返回 `webSocketDebuggerUrl`
  - `chrome-devtools` MCP 可正常列出并切换页签
- 页面切换：
  - 已成功从 `onebpSite` 切到 `onebpSearch`
  - 当前默认子目标为 `搜索卡位`
- 离线提交：
  - 已通过 `一键上车` 自动加入 `5` 个商品
  - 页面自动带出 `dayAverageBudget = 1640`
  - 离线提交命中：
    - `POST https://one.alimama.com/solution/addList.json?...&bizCode=onebpSearch`
- 添加关键词补抓：
  - 已打开 `添加关键词` 弹窗并勾选推荐词 `美的小魔方`
  - 确认后主页面从 `10` 个关键词变为 `11` 个关键词
  - 为保证可提交态，重新通过 `一键上车` 恢复 `5` 个商品后执行离线触发
- 手动输入与匹配方式补抓：
  - 已通过 `点击此处可手动输入添加关键词` 新增手动词 `方太水槽`
  - 确认后主页面从 `11` 个关键词变为 `12` 个关键词
  - 手动词对象已确认带 `isManual = true`、`originalWord = "方太水槽"`、默认 `matchScope = "4"`
  - 已确认 `matchScope` 映射：
    - `广泛 = "4"`
    - `中心词 = "16"`
    - `精准 = "1"`
- 清空补抓：
  - 点击 `清空` 后无二次确认，关键词立即归零
  - 商品区域同时回落到 `0 / 30`
  - 即便页面进入空态，离线点击 `创建完成` 仍会发 `POST addList.json`
- `位置不限提升市场渗透` 复抓：
  - 已确认该分支真实可选，最终提交不是 `home_page`
  - 真实提交字段为：
    - `searchDetentType = permeability`
  - 页面存在一个关键行为：
    - 先选 `位置不限提升市场渗透` 再 `一键上车` 加商品时，页面会自动重置回 `抢首条`
    - 提交前必须重新选一次 `位置不限提升市场渗透`
- `趋势明星` 基线补抓：
  - 已成功切到：
    - `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSearch&promotionScene=promotion_scene_search_trend`
  - 离线提交仍命中：
    - `POST https://one.alimama.com/solution/addList.json?...&bizCode=onebpSearch`
  - 已确认基线结构核心字段：
    - `promotionScene = promotion_scene_search_trend`
    - `itemSelectedMode = trend`
    - `trendType = 0`
    - `bidTypeV2 = smart_bid`
    - `bidTargetV2 = conv`
    - `optimizeTarget = conv`
    - `trendThemeListLength = 5`
    - `itemIdListLength = 9`
    - `adgroupListLength = 9`
    - `crowdListLength = 5`
    - `campaignColdStartVO.coldStartStatus = 1`
    - `dayAverageBudget = 1640`
- `趋势明星` 分支补抓：
  - 已确认冷启加速关闭后：
    - `campaignColdStartVO.coldStartStatus = 0`
  - 页面可见 checkbox 直接点击时曾出现：
    - `系统异常，请稍后重试。status=0`
  - 但底层开关实际切换后，请求体会稳定带出 `coldStartStatus = 0`
  - 已确认出价目标映射：
    - `获取成交量 = bidTargetV2 / optimizeTarget = conv`
    - `增加收藏加购量 = bidTargetV2 / optimizeTarget = coll_cart`
    - `增加点击量 = bidTargetV2 / optimizeTarget = click`
    - `稳定投产比 = bidTargetV2 = roi`，且不再提交 `optimizeTarget / setSingleCostV2`
  - 已确认 `稳定投产比` 额外字段：
    - `constraintType = roi`
    - `constraintValue` 会随档位变化
  - 已确认的 ROI 档位：
    - `5.51`
    - `6.89`
    - `8.27`
    - `自定义 7.11`
  - 已确认 `设置平均直接成交成本` 会改写提交模型：
    - `bidTargetV2` 仍是 `conv`
    - 新增：
      - `setSingleCostV2 = true`
      - `constraintType = dir_conv`
      - `constraintValue`
    - `optimizeTarget` 不再提交
  - 已确认的平均直接成交成本档位：
    - 默认档 `370.9`
    - `445.08`
    - `296.72`
    - 自定义 `333.33`
  - 已确认人群总开关行为：
    - `设置优先投放客户 = 关 -> crowdList = []`
    - `人群优化目标 = 关 -> crowdList = []`
  - 已确认客群开关到 `crowdList` 的映射：
    - `新客户获取 = 关 -> 删除 3008_3000949_3000949`
    - `流失老客挽回 = 关 -> 删除 3009_3000951_3000951`
    - `高价值客户获取 = 关 -> 一次性删除 3 条 3010_*`
  - 已确认倍率字段会真实落到 `crowdList.price.discount`：
    - 基线 `1.3 / 1.5 / 1.3 -> 30 / 50 / 30`
    - 自定义样本：
      - `新客户 1.8 -> 80`
      - `高价值 1.6 -> 60 / 60 / 60`
  - 已确认 `选择趋势主题` 补到第 6 个主题后：
    - `trendThemeListLength = 6`
    - 新增主题：
      - `895617013 / 美的酷省电二代空调 / itemCount = 0`
    - `itemIdListLength / adgroupListLength` 仍保持 `9`
  - 已确认 `清空` 后：
    - `trendThemeList = []`
    - `itemIdList = []`
    - `adgroupList = []`
    - `campaignColdStartVO.coldStartStatus = 0`
    - `crowdList / adzoneList / launchAreaStrList / launchPeriodList` 仍保留默认值
  - 已确认 `添加自选商品` 样本：
    - 为避免真实提交，改用页面内拦截 `addList.json` 的方式取最终请求体
    - 新增商品：
      - `1029803691231 / 美的洗碗机V6pro灶下家用15套大容量全自动热风烘干消毒一体机`
    - `itemIdListLength = 10`
    - `adgroupListLength = 10`
    - `trendThemeListLength` 仍为 `6`
    - 页面“将暂停全站推场景计划”提示未进入请求体
  - 页面存在一个重要联动异常：
    - 关闭单个客群时，界面上的 `人群优化目标` 会被联动取消选中
    - 但真实提交仍会保留剩余 `crowdList`
- `流量金卡` 分支补抓：
  - 已确认三张解决方案卡会整体切换模板（包/词/货/周期联动变化）：
    - `类目精准词卡`：`packageId=47, planId=171, itemIdListLength=5, wordListLength=0`
    - `百亿秒杀节-大促成交抢量卡`：`packageId=2008, planId=158, itemIdListLength=3`
    - `一人食炖煮家电高转化卡`：先补商品到 `8/30` 后可提交，`packageId=2004, planId=227, wordListLength=49`
  - 已确认套餐包档位映射（基于一人食卡）：
    - `基础起量包 -> planId=227, orderAmount=3000`
    - `增量畅享包 -> planId=228, orderAmount=10000`
    - `自定义成交包 -> planId=229, orderAmount=30000`
  - 已确认开关行为：
    - `冷启加速=关 -> campaignColdStartVO.coldStartStatus=0`
    - `套餐包自动续投=关 -> orderAutoRenewalInfo.orderAutoRenewalSwitch=0`
  - 已确认当前限制：
    - `设置自动续投门槛` 当前样本未写入有效阈值（`orderAutoRenewalCondition` 仍为空）
    - 点击 `支付宝支付` 后当前样本仍是 `orderChargeType=balance_charge`
- `自定义推广` 补抓：
  - 已确认可提交基线 `KD01`（需先加商品到 `8/30`）
  - 已确认 `AI点睛=关` 可稳定触发 `addList.json`
  - 已确认 `核心词设置 -> 添加关键词` 会改写 `adgroupList[*].wordList`
- 已确认字段：
  - `promotionScene = promotion_scene_search_detent`
  - `itemSelectedMode = search_detent`
  - `searchDetentType`
  - `campaignColdStartVO.coldStartStatus`
  - `wordList`
  - `wordPackageList`
  - `itemIdList`
  - `adzoneList`
  - `launchAreaStrList`
  - `launchPeriodList`
  - `dmcType = day_average`
  - `dayAverageBudget = 1640`
- 已确认分支：
  - `抢首条 -> searchDetentType = first_place`
  - `抢前三 -> searchDetentType = third_place`
  - `抢首页 -> searchDetentType = home_page`
  - `冷启加速 = 关 -> campaignColdStartVO.coldStartStatus = 0`
  - `添加关键词（推荐词：美的小魔方） -> wordListCount = 11，新增词插入 wordList[0]，matchScope = "4"，recReason = "aiRecWord"`
  - `手动输入关键词（方太水槽） -> wordListCount = 12，wordList[0].isManual = true，originalWord = "方太水槽"`
  - `手动词切到中心词 -> wordList[0].matchScope = "16"`
  - `手动词切到精准 -> wordList[0].matchScope = "1"`
  - `清空关键词 -> wordList = []，itemIdList = []，adgroupList = []，但仍会 POST addList.json`
  - `位置不限提升市场渗透 -> searchDetentType = permeability`
  - `趋势明星基线 -> bidTypeV2 = smart_bid，bidTargetV2 = conv，optimizeTarget = conv，trendThemeListLength = 5，itemIdListLength = 9，crowdListLength = 5`
  - `趋势明星冷启加速 = 关 -> campaignColdStartVO.coldStartStatus = 0`
  - `趋势明星出价目标 = 增加收藏加购量 -> bidTargetV2 / optimizeTarget = coll_cart`
  - `趋势明星出价目标 = 增加点击量 -> bidTargetV2 / optimizeTarget = click`
  - `趋势明星出价目标 = 稳定投产比 -> bidTargetV2 = roi，新增 constraintType = roi / constraintValue，且不再提交 optimizeTarget / setSingleCostV2`
  - `趋势明星稳定投产比档位 5.51 -> constraintValue = 5.51`
  - `趋势明星稳定投产比档位 8.27 -> constraintValue = 8.27`
  - `趋势明星稳定投产比自定义 7.11 -> constraintValue = 7.11`
  - `趋势明星平均直接成交成本默认档 370.9 -> setSingleCostV2 = true，constraintType = dir_conv，constraintValue = 370.9，且不再提交 optimizeTarget`
  - `趋势明星平均直接成交成本 445.08 -> constraintValue = 445.08`
  - `趋势明星平均直接成交成本 296.72 -> constraintValue = 296.72`
  - `趋势明星平均直接成交成本自定义 333.33 -> constraintValue = 333.33`
  - `趋势明星设置优先投放客户 = 关 -> crowdList = []`
  - `趋势明星人群优化目标 = 关 -> crowdList = []`
  - `趋势明星新客户获取 = 关 -> crowdList 删除 3008_3000949_3000949`
  - `趋势明星流失老客挽回 = 关 -> crowdList 删除 3009_3000951_3000951`
  - `趋势明星高价值客户获取 = 关 -> crowdList 仅剩 3008 / 3009 两条`
  - `趋势明星新客户倍率 1.8 -> 3008 对应 discount = 80`
  - `趋势明星高价值客户倍率 1.6 -> 全部 3010_* 对应 discount = 60`
  - `趋势明星选择趋势主题补到 6 个 -> trendThemeList[5] = 895617013 / 美的酷省电二代空调 / itemCount = 0，itemIdListLength 仍为 9`
  - `趋势明星清空 -> trendThemeList = []，itemIdList = []，adgroupList = []，coldStartStatus = 0`
  - `趋势明星添加自选商品 1029803691231 -> itemIdListLength = 10，adgroupListLength = 10，trendThemeListLength 仍为 6`
  - `流量金卡类目精准词卡基线 -> packageId=47，planId=171，orderAmount=500，wordListLength=0，itemIdListLength=5`
  - `流量金卡百亿秒杀节基线 -> packageId=2008，planId=158，orderAmount=3000，itemIdListLength=3`
  - `流量金卡一人食基线（补商品后） -> packageId=2004，planId=227，orderAmount=3000，wordListLength=49，itemIdListLength=8`
  - `流量金卡一人食增量畅享包 -> planId=228，orderAmount=10000`
  - `流量金卡一人食自定义成交包 -> planId=229，orderAmount=30000`
  - `流量金卡冷启加速=关 -> coldStartStatus=0`
  - `流量金卡自动续投=关 -> orderAutoRenewalSwitch=0，且无二次确认弹窗`
  - `流量金卡自动续投门槛勾选 -> orderAutoRenewalCondition 仍为空`
  - `流量金卡点击支付宝支付 -> 当前样本 orderChargeType 仍为 balance_charge`
  - `自定义推广基线（KD01） -> promotionScene=promotion_scene_search_user_define，bidTypeV2=smart_bid，bidTargetV2/optimizeTarget=conv，dayAverageBudget=1480，itemIdListLength=8`
  - `自定义推广 AI点睛=关（KD02） -> aiMaxSwitch=0，aiMaxInfo.aiMaxSwitch=0，itemIdListLength=8，adgroupListLength=8`
  - `自定义推广添加关键词（KD03） -> 新词“洗碗机家用全自动”进入全部8个adgroup.wordList，matchScope=1，isManual=true`
  - `趋势明星高级设置投放资源位（KT25） -> adzoneList: 114790550288=status pause，114786650498=status start`

## 结果复盘
- `onebpSearch` 的默认 `搜索卡位` 和 `onebpSite` 结构差异很大，后续开发不能复用全站推广的 ROI/起量模型。
- 这个场景的核心不是 ROI，而是：
  - `wordList`
  - `wordPackageList`
  - `searchDetentType`
  - `campaignColdStartVO`
  - `adzoneList / launchAreaStrList / launchPeriodList`
- 已补齐本轮明确遗漏点：
  - `核心词设置 -> 添加关键词` 已单独记录，且确认它不会改写商品、卡位方式、预算类型等基线结构，只会扩展 `wordList` 并追加 `aiword` 恢复信息。
- 核心词设置这组高频分支目前已补齐：
  - 推荐词新增
  - 手动输入新增
  - `广泛 / 中心词 / 精准` 三档映射
  - 清空关键词
- `位置不限提升市场渗透` 也已从“待确认”转为“已确认”：
  - 真实值是 `permeability`
  - 但“先选卡位再加商品”会被页面重置，自动化顺序必须调整为“加商品后再选卡位”
- `趋势明星` 与 `搜索卡位` 的结构差异已经明确：
  - `搜索卡位` 以 `wordList / searchDetentType` 为核心
  - `趋势明星` 以 `trendThemeList / crowdList / bidTargetV2` 为核心
- `趋势明星 -> 高级设置` 追加验证：
  - `投放地域` 从 `["all"]` 切为部分地域后，会改成数值型 `launchAreaStrList`
  - `投放时间` 编辑态虽然是半小时网格，但提交体会压缩成 `launchPeriodList`
  - `08:00-13:00` 样本已确认会序列化为每周 `7` 条、每条 `3` 段的 `timeSpanList`
  - `投放资源位` 关闭单个资源位后，提交体不是删项，而是对应 `adzone.status` 由 `start` 变为 `pause`
- `趋势明星 -> 稳定投产比` 还存在一层子配置：
  - 同样是 `bidTargetV2 = roi`，真正决定 ROI 强弱的是 `constraintValue`
  - 后续开发不能只识别“是否 ROI”，还要序列化具体档位或自定义值
- `趋势明星 -> 设置平均直接成交成本` 是另一条独立的 `conv` 约束链路：
  - 它不是简单布尔开关，而是改为 `setSingleCostV2 + constraintType = dir_conv + constraintValue`
  - 后续开发不能把它和普通 `conv / optimizeTarget` 混成同一结构
  - 补充复核已确认 `constraintValue` 会随页面当前预算/商品状态变化，默认档并不固定
- `趋势明星 -> crowdList` 不是按 UI 行数一一对应：
  - `新客户获取 = 1` 条
  - `流失老客挽回 = 1` 条
  - `高价值客户获取 = 3` 条
- `趋势明星` 的剩余商品层也已经明确：
  - `补主题` 只改 `trendThemeList`
  - `加自选商品` 只扩 `itemIdList / adgroupList`
  - `清空` 会一起清空 `trendThemeList / itemIdList / adgroupList`
- 从多组样本可推断倍率与折扣的换算规则是：
  - `price.discount ≈ (倍率 - 1) * 100`
- 单个人群关闭会把 `人群优化目标` 的视觉状态一起取消，但请求体仍会带剩余人群：
  - 自动化与后续开发必须以真实请求字段为准，不能只靠页面选中态判断
- 离线断网并不总能稳定拿到提交体：
  - `添加自选商品` 这条分支在断网下出现过状态回退且不发 `addList.json`
  - 后续若仍要求“只模拟不提交”，优先用页面内拦截 `addList.json` 的方式取参数，再阻断真实发送
- 当前仍待继续覆盖的上层分支：
  - `自定义推广 -> 出价目标 / 成本约束 / 预算类型` 分支
  - `流量金卡 -> 关键词设置 / 人群屏蔽` 的提交体差异

---

# TODO - 2026-04-28 `addList.md` 整理为开发文档

## 需求规格
- 目标：
  - 将仓库根目录 `addList.md` 从“抓包流水账”整理成“后续开发可直接查阅”的开发文档；
  - 保留真实页面抓取得到的关键请求结构、字段映射、分支差异、异常样本与覆盖范围；
  - 让后续开发在不回看会话的情况下，也能直接据此实现 `addList.json` 组包、字段映射与异常兼容。
- 范围：
  - 重构 `addList.md` 文档结构与章节表达；
  - 在 `tasks/todo.md` 回填计划、执行摘要与整理结果。
- 非目标：
  - 不新增新的页面抓包；
  - 不修改业务代码；
  - 不改动既有样本含义，仅调整表达与归类方式。

## 执行计划（可核对）
- [x] 盘点 `addList.md` 现有信息，区分“接口事实”“分支样本”“开发注意事项”三类内容。
- [x] 按开发文档格式重组 `addList.md`，补齐总览、字段映射、覆盖矩阵、异常说明与样本附录。
- [x] 自检文档可读性与信息完整度，并回填本节结果复盘。

## 改动摘要
- `addList.md`
  - 标题从“提交流量记录”重构为“`addList.json` 开发文档”；
  - 新增“开发先读”“接口总览”“字段映射”“样本索引”“已知异常”“后续追加规则”等章节；
  - 原有 `onebpSite` 13 条样本全部保留，但重排为“基线 + 分支附录”的开发向结构；
  - 把 `algoPredictionExtraInfo` 独立为附录，并明确其“结构可参考、数值不可硬编码”的开发语义。

## 验证记录
- 文档结构自检：
  - 已确认 `addList.md` 具备 13 个一级/二级开发章节，覆盖“抓取方式、接口结构、字段映射、样本附录、异常说明、追加规则”。
  - 已确认 `S01` 到 `S13` 样本索引与详细附录均保留，未丢失已有抓包结论。
  - 已确认关键异常样本仍保留：
    - `campaignGroupId = null`
    - `campaignGroupName = "小白鲸"`
- 自动化测试：
  - 本次仅整理文档，未修改业务代码，未运行测试。

## 结果复盘
- `addList.md` 已从“按时间堆叠的抓包流水账”转成“面向开发实现的结构化文档”，后续做 `addList.json` 组包时可先看字段映射，再按样本附录核对分支差异。
- 这次整理保留了全部已抓取事实，但把“接口事实”“字段语义”“分支样本”“已知异常”四类信息拆开，后续查文档不需要再全文扫读。

---

# TODO - 2026-04-15 出价调控保留 + 新增净投产比调控并存

## 需求规格
- 目标：
  - 不删除“出价调控（bidConstraintValue）”；
  - 在手动设置与方案展示中新增并保留“净投产比调控（netBidConstraintValue）”；
  - 面板未配置/未勾选的方案默认不执行；
  - 方案名称全量展示，状态独立展示，详情保留方案介绍。
- 范围：
  - `src/optimizer/ui.js`（方案表映射、弹窗读取、手动面板模板/读写/回填）；
  - `tests/optimizer-escort-new-flow-fallback.test.mjs`（文案与结构断言）；
  - 浏览器实页“立即检查并优化”复测。
- 非目标：
  - 不改 openV3 请求结构；
  - 不改与护航无关逻辑。

## 执行计划（可核对）
- [x] 补齐 `ui.js` 里出价/净投产比双方案的名称、详情、读取与手动表单字段。
- [x] 更新测试断言，确保“出价调控 + 净投产比调控并存”长期稳定。
- [x] 运行目标测试、全量测试与构建校验。
- [x] 在真实阿里妈妈页面点击“立即检查并优化”验证勾选与执行一致。

## 改动摘要
- `src/optimizer/ui.js`
  - `escortSettingTable` 默认顺序保留并新增双方案：`出价调控(bidConstraintValue)` + `净投产比调控(netBidConstraintValue)`；
  - 详情文案拆分为两条默认说明：出价与净投产比分别兜底；
  - 护航弹窗精确读取补齐三路映射：出价/净投产比/预算，分别读取开关、区间、次数、次日恢复；
  - 手动设置面板新增“净投产比调控”独立卡片（`manual-net-bid-*`），并保留“出价调控”原卡片；
  - 表单读写/回填/主从勾选同步逻辑均纳入 `netBidConstraintValue`。
- `tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 更新全量方案顺序断言为包含 `netBidConstraintValue`；
  - 更新详情兜底断言为“出价 + 净投产比 + 预算”三路；
  - 更新手动面板断言为“双入口并存（manual-bid-enabled + manual-net-bid-enabled）”；
  - 更新弹窗精确读取断言为“出价/净投产比/预算”三路标签匹配。

## 验证记录
- `node --test tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 结果：`35/35 passed`
- `node scripts/build.mjs`
  - 结果：构建成功（v7.02）
- `node --test tests/*.test.mjs`
  - 结果：`403 passed, 0 failed, 2 skipped`
- 浏览器实页（`one.alimama.com`，点击“立即扫描并优化”）
  - 关键日志：
    - `使用手动设置参数（未勾选）：6 个设置项`
    - 方案表同时展示：
      - `出价调控` -> `未勾选`
      - `净投产比调控` -> `未勾选`
      - `预算调控` -> `未勾选`
      - `添加关键词/切换关键词匹配方式/屏蔽关键词` -> `未勾选`
  - 结论：手动未勾选时不执行，且“出价调控 + 净投产比调控”并存显示生效。

## 结果复盘
- 根因：之前把 `bidConstraintValue` 语义替换成净投产比，导致“新增需求”被误做成“替换方案”。
- 修复：恢复出价方案原语义，新增 `netBidConstraintValue` 独立链路，并在展示、读取、手动面板、回归测试四层同步落地。

---

# TODO - 2026-04-15 手动设置与方案执行映射一致性（净投产比调控补齐）

## 需求规格
- 目标：
  - 手动设置面板中补齐“净投产比调控”配置入口（参考预算/原出价调控卡片）；
  - 方案表“方案名称”需全量展示，不因是否执行而缺失；
  - 若手动设置未开启对应方案，则默认不执行；
  - 保留方案详情介绍文案，不回退为错误状态语义。
- 范围：
  - `src/optimizer/ui.js` 手动设置 UI、读取/回填、方案名称映射；
  - `src/optimizer/core.js` 方案别名匹配与提交映射稳定性；
  - `tests/optimizer-escort-new-flow-fallback.test.mjs` 回归断言；
  - 真实阿里妈妈页面点击“立即检查并优化”复测。
- 非目标：
  - 不改动接口协议；
  - 不改动与护航设置无关模块。

## 执行计划（可核对）
- [x] 新增手动设置“净投产比调控”面板与表单读写，沿用 `bidConstraintValue` 数据键。
- [x] 调整方案名称/默认详情文案，将 `bidConstraintValue` 统一展示为“净投产比调控”。
- [x] 校验“手动未配置/未勾选默认不执行”链路，避免回退为默认执行所有方案。
- [x] 更新回归测试并执行目标测试 + 全量测试 + 构建。
- [x] 浏览器真实页面点击“立即扫描并优化”验证执行状态与手动设置一致。

## 改动摘要
- `src/optimizer/ui.js`
  - 手动设置面板把原“出价调控（成本）”统一为“净投产比调控”，并补齐对应读写与展示字段；
  - 方案表渲染改为“全量方案名称 + 独立状态列 + 详情列保留方案介绍/配置说明”；
  - 弹窗读取支持“净投产比调控/成本调控”标签兼容，避免线上字段差异导致映射失败。
- `src/optimizer/core.js`
  - `bidConstraintValue` 增加“净投产比/净投产比调控”别名；
  - 手动合并时按 `manualTargetKeySet` 对所有方案显式收敛：未在手动配置内一律 `enabled=false`；
  - 主开关未勾选时通过 `buildManualDisabledOverride` 强制全部方案按未勾选提交，不再回退默认执行。
- `tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 更新净投产比文案与标签读取断言；
  - 新增“未在手动面板配置默认关闭”与“手动未勾选不执行”回归断言。

## 验证记录
- `node --test tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 结果：`35/35 passed`
- `node scripts/build.mjs`
  - 结果：构建成功（v7.02）
- `node --test tests/*.test.mjs`
  - 结果：全量通过（dot reporter 退出码 `0`）
- 浏览器实页（`one.alimama.com`，点击“立即扫描并优化”）：
  - 场景A：主开关未勾选、子项未勾选，方案表展示 `净投产比调控/预算调控/添加关键词/切换关键词匹配方式/屏蔽关键词`，状态均为 `未勾选`；
  - 场景B：主开关仍未勾选，但手动勾选“净投产比调控 + 预算调控”子项再执行，结果仍全部 `未勾选`，提交来源为 `手动设置参数（未勾选）`；
  - 详情列保留方案说明（如范围、次数、次日恢复、关键词偏好），未被状态文案覆盖。

## 结果复盘
- 根因：提交层在“手动主开关未勾选”场景下会回退默认执行语义，且方案键别名不完整，导致预算/净投产比出现误执行感知。
- 修复：统一净投产比方案键映射；提交层显式以手动快照收敛所有方案 `enabled`；未勾选主开关时强制“全部未勾选提交”。
- 结论：手动面板与方案执行已对齐，且方案名称与详情展示保持稳定。

---

# TODO - 2026-04-15 用户复测“还是一样生效”闭环复核（小万护航手动设置）

## 需求规格
- 目标：
  - 处理用户“还是一样生效了”的复测反馈，确认“使用手动设置提交”主开关与执行方案严格一致；
  - 在真实阿里妈妈页面点击“立即扫描并优化”完成闭环验证。
- 范围：
  - 浏览器实页复测“主开关关闭/开启”两条链路；
  - 校验执行日志中的提交来源与方案数量，确认不再出现“默认执行所有方案”误判。
- 非目标：
  - 不新增业务字段；
  - 不改动与本问题无关模块。

## 执行计划（可核对）
- [x] 定位方案详情被“状态文案”覆盖的触发分支。
- [x] 调整 `escortSettingTable` 详情构造：详情优先展示方案介绍，状态仅在“状态”列呈现。
- [x] 更新回归测试，防止详情再次被“未开启”回退覆盖。
- [x] 构建并在真实阿里妈妈页面复测“立即扫描并优化”。

## 改动摘要
- `src/optimizer/ui.js`
  - 新增详情文本归一化/去重逻辑；
  - 新增配置描述提取逻辑（`description/desc/intro/...`）；
  - 新增默认方案介绍文案映射（出价/预算/关键词类）；
  - 移除“详情列回退为已开启/未开启”逻辑，状态由“状态列”单独表达。
- `tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 更新“方案详情保留介绍文案”断言，改为校验默认介绍文案与“不再回退未开启”。

## 验证记录
- `node --test tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 结果：`33/33 passed`
- `node scripts/build.mjs`
  - 结果：构建成功，产物刷新（v7.02）
- 浏览器实页（`one.alimama.com`，点击“立即扫描并优化”）
  - 结果：日志表格显示 `方案名称 / 状态 / 详情`；
  - 详情示例：
    - `净投产比调控`：`范围 13-39；最多 10 次/日；次日不恢复`
    - `预算调控`：`范围 50-不限；最多 20 次/日；次日恢复初始值`
    - `切换关键词匹配方式`：`自动在广泛匹配与精准匹配间切换`
    - `屏蔽关键词`：`自动屏蔽低转化关键词`

## 结果复盘
- 根因：详情兜底复用了状态语义，导致未开启时“方案介绍”被覆盖。
- 修复策略：状态与详情职责彻底分离，详情优先使用后端描述与方案介绍，缺省再用功能性介绍兜底。

---

# TODO - 2026-04-15 手动未勾选仍执行预算/净投产比（二次复测闭环）

## 需求规格
- 目标：
  - 修复“手动设置主开关未勾选时，方案仍默认执行预算调控/净投产比调控”的映射错位；
  - 在真实阿里妈妈页面点击“立即扫描并优化”验证状态与手动设置一致。
- 范围：
  - `openV3` 提交设置来源解析；
  - 回归测试与浏览器实测。
- 非目标：
  - 不改动业务接口；
  - 不改动无关模块。

## 执行计划（可核对）
- [x] 修复提交层在“手动未勾选”场景下的设置来源，禁止回退为诊断/默认执行方案。
- [x] 修正对应回归断言并通过目标测试。
- [x] 完整跑测并构建产物。
- [x] 真实页面执行“立即扫描并优化”复测方案状态与来源文案。

## 改动摘要
- `src/optimizer/core.js`
  - `resolveOpenV3Setting` 读取手动设置快照时改为 `includeDisabled: true`；
  - 新增“手动主开关未勾选”分支：构造 `operationList: []` 的手动设置提交；
  - 来源文案明确为 `手动设置参数（未勾选）`，并标记 `fromManual = true`。
- `tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 补充并修正“手动未启用仍按手动快照提交”的断言；
  - 修复一条因分支结构升级导致的过期正则断言。

## 验证记录
- `node --test tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 结果：`33/33 passed`
- `node --test tests/*.test.mjs`
  - 结果：`401 passed, 0 failed, 2 skipped`
- `node scripts/build.mjs`
  - 结果：构建成功（v7.02）
- 浏览器实页（`one.alimama.com`，点击“立即扫描并优化”）
  - 结果：
    - 日志显示：`使用手动设置参数（未勾选）：5 个设置项`
    - 方案表状态显示：`出价调控/预算调控/添加关键词/切换匹配/屏蔽关键词` 全部为 `未勾选`
    - 不再出现 `预算调控`、`净投产比调控` 被误标为 `已执行`。

## 结果复盘
- 根因：主开关未勾选时，提交层仍可能回退到诊断/默认设置来源，导致执行状态与手动设置错位。
- 修复策略：在提交层显式保留“手动未勾选”语义，提交来源与展示状态统一以手动快照为准。

---

# TODO - 2026-04-15 手动子项勾选后未执行（净投产比与全项复测）

## 需求规格
- 目标：
  - 修复“手动面板勾选净投产比调控后执行未生效”；
  - 检查其它手动子项是否存在同类问题；
  - 在真实页面浏览器中回归到通过为止。
- 范围：
  - 手动主开关与子项勾选联动逻辑；
  - 护航执行状态渲染链路验证。
- 非目标：
  - 不改动接口协议；
  - 不改动与手动设置无关模块。

## 执行计划（可核对）
- [x] 复现“仅勾子项、主开关未开”场景，确认执行链路来源与状态。
- [x] 修改主从联动：子项有勾选时自动开启主开关。
- [x] 更新回归测试覆盖新联动规则。
- [x] 构建并在 `one.alimama.com` 实页逐项验证（净投产比、出价、预算、加词、切换匹配、屏蔽）。

## 改动摘要
- `src/optimizer/ui.js`
  - `syncManualEscortMasterCheckbox` 改为：当任一主子项勾选时，自动 `master.checked = true`；
  - 保留部分勾选 `indeterminate` 语义，避免展示与提交状态不一致。
- `tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 将“主开关不反向开启”旧断言更新为“子项勾选自动开启主开关”；
  - 同步更新“外层与内层勾选状态保持同步”的正则断言。

## 验证记录
- `node --test tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 结果：`35/35 passed`
- `node --test tests/*.test.mjs`
  - 结果：`403 passed, 0 failed, 2 skipped`
- `node scripts/build.mjs`
  - 结果：构建成功（v7.02）
- 浏览器实页（`https://one.alimama.com/index.html#!/manage/search?...`）
  - 逐项单独勾选执行（单计划 `campaignId=69514602419`）：
    - `净投产比调控`：状态 `执行失败`（接口提示重复创建），其余项 `未勾选`；
    - `出价调控/预算调控/添加关键词/切换关键词匹配方式/屏蔽关键词`：各自状态 `已执行`，其余项 `未勾选`；
  - 每次“仅勾子项”时，主开关均自动变为勾选（`masterAfterChildCheck = true`）；
  - 全部不勾选执行时：6 项状态均为 `未勾选`。

## 结果复盘
- 根因：主开关关闭时，子项勾选不回写主开关，提交层按“手动未勾选”处理，造成“看起来勾了但不执行”。
- 修复：子项勾选反向开启主开关，确保面板视觉状态与提交语义一致。

---

# TODO - 2026-04-16 小万护航面板初始宽度放大 + 净投产比默认下限调整

## 需求规格
- 目标：
  - 小万护航在“未开始优化前”的面板宽度放大 1/3；
  - 手动设置中“净投产比调控”的下限默认值改为 `20`。
- 范围：
  - `src/optimizer/ui.js` 面板初始/恢复宽度与净投产比默认回填；
  - `src/optimizer/bootstrap.js` 默认配置基线。
- 非目标：
  - 不改动执行链路与接口协议；
  - 不改动其它方案的默认下限。

## 执行计划（可核对）
- [x] 定位并统一“未开始优化前”宽度设置入口（初始化与返回态）。
- [x] 调整净投产比下限默认值（读取 fallback、表单 fallback、默认配置）。
- [x] 跑回归测试并构建产物。

## 改动摘要
- `src/optimizer/ui.js`
  - 新增 `idlePanelWidthPx = 667`（500 放大约 1/3）；
  - 初始化面板 `width/min-width` 改为 `667px`；
  - `restoreIdlePanelView` 恢复宽度改为 `667px`；
  - `manual-net-bid-lower` 默认读取/回填从 `0.15` 改为 `20`；
  - 手动设置默认对象 `netBidConstraintValue.lowerLimit` 从 `0.15` 改为 `20`。
- `src/optimizer/bootstrap.js`
  - 默认配置 `manualEscortSetting.netBidConstraintValue.lowerLimit` 从 `0.15` 改为 `20`。

## 验证记录
- `node --test tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 结果：`35/35 passed`
- `node --test tests/*.test.mjs`
  - 结果：`403 passed, 0 failed, 2 skipped`
- `node scripts/build.mjs`
  - 结果：构建成功（v7.02）

## 结果复盘
- 这次改动为纯 UI 与默认值层，不影响执行协议；
- 初始宽度与返回态宽度已统一，避免“优化后返回时宽度不一致”。
# TODO - 2026-04-27 `sycm.taobao.com` 插件真实页面测试

## 需求规格
- 目标：
  - 打开真实 `sycm.taobao.com` 页面，验证当前仓库插件能否正常加载；
  - 确认页面侧是否出现插件注入痕迹、控制台是否有报错、基础交互是否可用；
  - 输出明确的测试结论与阻塞点，避免只停留在“页面能打开”层面。
- 范围：
  - 当前仓库构建产物 `dist/extension/`；
  - Chrome DevTools MCP 真实浏览器测试；
  - `sycm.taobao.com` 页面加载、注入、控制台、网络与页面痕迹检查。
- 非目标：
  - 不在本轮修改业务逻辑；
  - 不替代后续更细的功能专项回归。

## 执行计划（可核对）
- [x] 回顾仓库说明、历史教训与当前插件加载方式。
- [x] 构建最新扩展产物，确保浏览器加载的是当前代码。
- [x] 打开真实 `sycm.taobao.com` 页面并确认页面完成刷新。
- [x] 检查插件注入痕迹、控制台日志与关键页面交互。
- [x] 在本文档回填测试结果、结论与后续动作。

## 改动摘要
- 已确认当前 userscript/extension 只匹配 `alimama.com` 与 `one.alimama.com`，不匹配 `sycm.taobao.com` 或 `*.taobao.com`。
- 因此 `sycm.taobao.com` 的正确浏览器验收不是“出现助手面板”，而是确认页面可打开且没有当前仓库助手注入痕迹。
- 本轮未修改业务逻辑；仅完成真实页面验证与文档回填。

## 验证记录
- `node scripts/build.mjs`：通过，生成 v7.02 `dist/extension/`。
- `node scripts/build.mjs --check`：通过。
- `chrome-devtools` MCP（2026-05-05）：打开真实 `https://sycm.taobao.com/portal/home.htm`，页面标题为 `生意参谋 - 零售电商大数据产品平台`，店铺为 `美的洗碗机旗舰店`。
- `chrome-devtools` MCP（2026-05-05）：DOM 检查 `#am-helper-pro-extension-page-bundle`、`#am-helper-icon`、`#am-helper-panel`、`#am-report-capture-panel`、`#am-wxt-keyword-overlay`、`#am-license-lock-overlay`、`#alimama-escort-helper-ui`、`#am-magic-report-popup` 均不存在。
- `chrome-devtools` MCP（2026-05-05）：全局检查 `window.__AM_GET_SCRIPT_VERSION__`、`window.__AM_HOOK_MANAGER__`、`window.__ALIMAMA_OPTIMIZER_TOGGLE__`、`window.__ALIMAMA_OPTIMIZER_RUN_CAMPAIGN__` 均为 `undefined`。
- `chrome-devtools` MCP（2026-05-05）：资源检查没有 `chrome-extension://` 助手资源，也没有 `page.bundle.js` / `content.js` 注入记录。
- `chrome-devtools` MCP（2026-05-05）：控制台没有 `[AM]`、`[AM][Interceptor]`、`[AM-WXT]` 助手日志；页面自身存在 `portal/live/new/index/trend/v3.json` 安全提示 iframe，属于生意参谋接口响应，不是本扩展注入。

## 结果复盘
- 结论：当前仓库插件不会加载到 `sycm.taobao.com`，这与源码和 manifest 匹配规则一致，不是浏览器加载失败。
- 若后续要让该插件支持生意参谋，需要单独新增匹配域、权限和业务入口，并重新做安全/页面兼容验证。

---

# TODO - 2026-04-27 `one.alimama.com` 新建计划提交流量摸排

## 需求规格
- 目标：
  - 打开真实 `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSite` 新建计划页面；
  - 在“不真实提交”的前提下，按“每个计划类型 × 每个可选分支”逐一尝试，并尽可能触发到提交前最后一步；
  - 记录每类计划显示条件、点击路径、是否依赖先添加商品，以及提交前请求的 URL、Method、Query、Body、Header/鉴权关键信息；
  - 输出后续开发可直接复用的参数清单与差异点。
- 范围：
  - Chrome DevTools MCP 真实页面测试；
  - 页面 UI 路径梳理、网络请求抓取、提交前参数归档；
  - `tasks/todo.md` 结果回填。
- 非目标：
  - 不真实提交计划；
  - 不在本轮直接修改业务代码；
  - 不伪造不存在的入口，若页面因账号/商品状态不展示，只记录阻塞条件。

## 执行计划（可核对）
- [x] 回顾仓库约束、任务文档与现有脏工作树，避免覆盖无关改动。
- [x] 连接 Chrome DevTools，打开目标页面并确认运行态已刷新。
- [x] 梳理新建计划入口，记录每个计划类型的显示前提与全部可选分支。
- [x] 对每个可进入的计划类型、每个可选分支分别模拟填写到最后一步，逐次抓取提交前相关网络参数。
- [x] 整理参数差异、公共字段、阻塞点与建议，回填本文档结果复盘。

## 改动摘要
- 已根据用户补充，把范围从“计划抽样”收紧为“每个计划 × 每个分支都要各自模拟提交并记录”。
- 记录载体已切换为仓库根目录 `addList.md`，后续提交流量参数与分支差异统一沉淀到该文件，`tasks/todo.md` 只保留任务管理与复盘。
- 2026-05-05 收口确认：上述完成状态限定为 `onebpSite` 当前账号、当前已添加商品、页面可见入口与可达结构性分支；其它 `bizCode` 或页面未展示计划类型不纳入本 TODO 完成口径。

## 验证记录
- `onebpSite` 全站推广页面已完成真实页面离线抓取，抓取方式为 `chrome-devtools` MCP + 页面内 `window.__AM_HOOK_MANAGER__`。
- 本轮新增覆盖分支：
  - `起量时间地域设置 = 8点~13点`
  - `起量地域 = 部分地域（取消上海）`
  - `设置计划组 = 归属到已有计划组（小白鲸）`
  - `设置计划组 = 不归属任何计划组`
  - `设置计划组 = 新建计划组并归属`
- 全部新增记录已集中写入仓库根目录 `addList.md`，未再散落到其它文档。
- `addList.md` 只读复核（2026-05-05）：`onebpSite` 章节明确仅覆盖 2026-04-27 抓取的全站推广页面，含 13 条样本、最终提交接口、可见控件分支盘点、未覆盖声明和 Offline 不真实创建计划说明。
- `chrome-devtools` MCP（2026-05-05）：重新打开真实 `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSite`，页面标题为 `计划创建_万相台无界版`，助手 v7.02 已启动，DOM 中存在 `#am-helper-icon`、`#am-helper-panel`、`#am-report-capture-panel`。
- `chrome-devtools` MCP（2026-05-05）：本轮只做页面运行态复核，未点击 `创建完成`；资源记录中没有 `/solution/addList.json` 请求。

## 结果复盘
- 当前 `onebpSite` 全站推广页面可见的结构性分支已补齐，后续开发可以直接对照 `addList.md` 里的 13 条样本做组包。
- `起量时间地域设置` 最终都落在 `quickLiftBudgetCommand`：
  - 时间段字段是 `quickLiftTimeSlot`
  - 地域字段是 `quickLiftLaunchArea`
- `设置计划组` 有一条关键异常：
  - 选择“不归属任何计划组”后，`campaignGroupId` 会变成 `null`
  - 但 `campaignGroupName` 仍残留上一条已有组名称 `小白鲸`
  - 这意味着后续开发不能只看 `campaignGroupName` 判断是否真的归属了计划组。
- 2026-05-05 收口复盘：原三项未勾选是文档状态滞后，不是实际摸排缺口；为避免误解，已把完成边界写清楚，不把 `onebpSite` 结论外推到其它计划类型或 `bizCode`。

---

# TODO - 2026-04-30 趋势主题联想入口对齐原生关键词/本店宝贝/竞店宝贝

## 需求规格
- 目标：
  - 将趋势主题手动联想区从“静态三按钮 + 通用输入框”改为原生同构交互；
  - `关键词` 支持直接输入并触发深度搜索；
  - `本店宝贝` 弹出本店商品列表，可按宝贝标题过滤并选择后联想趋势主题；
  - `竞店宝贝` 弹出全网商品搜索列表，可按宝贝标题搜索并选择后联想趋势主题。
- 范围：
  - 趋势主题弹窗 DOM、状态与事件；
  - 商品列表归一化与搜索；
  - 对应样式、回归测试、构建产物与浏览器实测。
- 非目标：
  - 不改变趋势主题最终提交字段；
  - 不改动非趋势明星目标的商品选择流程。

## 执行计划（可核对）
- [x] 复核原生截图与当前插件差异，明确三类入口的交互边界。
- [x] 改造趋势主题联想区：关键词输入内嵌、宝贝入口可打开选择面板。
- [x] 接入本店商品与竞店商品搜索，选择宝贝后用宝贝标题/ID 调用趋势联想接口。
- [x] 补充样式与回归断言，确保不退回静态按钮方案。
- [x] 运行构建、语法检查、目标测试。
- [x] 通过 Chrome DevTools 在真实 `one.alimama.com` 页面验证弹窗交互。

## 改动摘要
- 趋势主题联想区已改成原生同构入口：`关键词` 可直接输入，`本店宝贝` / `竞店宝贝` 打开宝贝选择面板。
- `本店宝贝` 继续使用趋势明星上下文的店内物料接口，保留店内商品与标题搜索。
- `竞店宝贝` 独立接入 `https://ai.alimama.com/ai/common/searchItemPage.json`，使用 `similarItemQueryStr` 搜索全网商品，不再复用本店商品接口。
- 商品归一化补充图片字段与多层响应列表解析，确保宝贝标题、ID、缩略图能稳定展示。
- 回归测试新增对关键词输入、宝贝面板、竞店 AI 全网搜索接口、本店/竞店数据源分离的断言。

## 验证记录
- `node scripts/build.mjs`：通过，生成根 userscript、packages 与 extension 产物。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过 3/3。
- `node --test tests/keyword-search-p0-contract.test.mjs tests/keyword-trend-theme-setting.test.mjs && node --check "阿里妈妈多合一助手.js" && node scripts/build.mjs --check`：通过 9/9、语法检查通过、构建同步检查通过。
- Chrome DevTools 真实页面 `one.alimama.com` 验证：
  - `关键词` 输入 `洗碗机` 后返回 20 个趋势热点，首行包含 `洗碗机`、趋势指数 `334`、搜索指数 `35919`。
  - `本店宝贝` 面板显示 `本店宝贝标题` 搜索框，返回 40 条店内商品。
  - `竞店宝贝` 面板显示 `竞店宝贝标题` 搜索框，输入 `洗碗机` 后返回 79 条全网商品，并捕获到 `ai/common/searchItemPage.json` 请求。
  - 选择竞店商品后，已选文案显示 `已选竞店宝贝：...`，面板收起并触发趋势主题联想。

## 结果复盘
- 竞店宝贝的根因不是 UI，而是错误复用了本店/可投商品接口；修复后已按原生 AI 全网商品搜索链路独立实现。
- 后续类似“本店/竞店/全网”入口，必须先确认数据源和请求字段，再复刻 UI，避免同形控件误用同一接口。

## 缺陷修复计划 - 宝贝联想无趋势结果与快捷联想选中态
- [x] 复核当前宝贝选中后的联想查询方式，避免只用完整宝贝标题导致 `themeAssociation` 无结果。
- [x] 为本店/竞店宝贝选中后增加可联想关键词降级：完整标题无结果时提取类目/核心商品词继续查询。
- [x] 修复“快捷联想已选趋势”点击后的当前选中圆点状态，确保点击哪个趋势就高亮哪个趋势。
- [x] 更新回归断言覆盖宝贝联想降级查询与快捷联想 active 状态。
- [x] 重新构建、运行测试，并用真实 `one.alimama.com` 页面验证。

### 缺陷修复结果
- 宝贝联想不再只用完整标题：会按“宝贝搜索词 -> 已选/红榜中匹配的趋势词 -> 核心商品词 -> 完整标题”的顺序尝试，避免长标题导致无结果。
- 快捷联想已选趋势新增当前选中态，点击 `pro套` 后圆点切换到 `pro套`，不再固定第一个。
- 真实页面验证：
  - 选择本店宝贝 `美的消毒柜150R02...` 后返回 20 条趋势热点，状态显示 `联想词：美的消毒柜`。
  - 选择竞店宝贝 `304不锈钢筷子筒...洗碗机专用` 后返回 20 条趋势热点，状态显示 `联想词：洗碗机`。
  - 快捷联想点击第二个趋势后 active 圆点切换到 `pro套`。

## 缺陷修复计划 - 移除趋势旧手动入口并固定联想区高度
- [x] 删除趋势主题弹窗里多余的旧 `am-wxt-scene-crowd-native-manual` 手动添加区域及对应事件逻辑。
- [x] 为趋势主题专项测试补充旧入口不存在的回归断言。
- [x] 将趋势联想区设置为 `height:100%`、`overflow:hidden`，不再依赖滚动才能看到下方内容。
- [x] 重新构建、运行专项测试与契约检查。
- [x] 用真实 `one.alimama.com` 页面验证旧入口不存在且联想区完整可见。

### 缺陷修复结果
- 趋势主题弹窗旧手动添加区已移除，源码和生成后的 userscript 不再包含 `data-scene-popup-trend-manual` / `data-scene-popup-trend-manual-add` / `添加自定义主题`。
- 趋势联想区样式已改为 `flex:1 1 0`、`height:100%`、`overflow:hidden`，主内容区不再需要滚动才能看到联想区下方内容。
- 真实页面验证：
  - 旧 `.am-wxt-scene-crowd-native-manual` 不存在；
  - 联想区 CSSOM 规则为 `height: 100%`、`overflow: hidden`；
  - `mainScroll` 与 `associationScroll` 均无外层滚动，红榜、联想搜索、结果表头和已选悬浮条均在当前弹窗窗口内可见。

### 二次修复 - 联想区只露一行
- [x] 将红榜区固定压缩到 `180px`，释放纵向空间给下方联想区。
- [x] 按用户最新要求允许趋势主题弹窗整窗滚动，不再强制固定窗口内全部压缩展示。
- [x] 去掉联想区和联想结果表内部滚动/截断，让“联想相关趋势主题”下方结果自然展开显示全。
- [x] 重新构建并在真实页面确认联想区不再只露一行。

### 二次修复验证结果
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。
- `node --test tests/keyword-search-p0-contract.test.mjs tests/keyword-trend-theme-setting.test.mjs`：通过，9/9。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- Chrome DevTools 真实页面验证：
  - 旧手动入口仍不存在；
  - 弹窗外层 `overflow:auto`，允许整窗滚动；
  - 联想区 `overflow:visible`，结果表 `overflow:visible`；
  - 联想结果共 20 行，联想区内展开 20 行；
  - 联想区、结果表均 `clientHeight == scrollHeight`，没有内部滚动条。

### 三次修复 - 红榜增高与已选主题底部悬浮
- [x] 将三列红榜区域从 `180px` 增高到 `900px`，每个红榜卡片按当前压缩高度放大 5 倍。
- [x] 将“已选明星趋势主题”从弹窗内容绝对定位改成视窗底部 `fixed` 悬浮层。
- [x] 将趋势主题主内容底部避让空间增加到 `180px`，避免底部悬浮条遮住列表内容。
- [x] 重新构建、运行专项测试，并在真实页面确认红榜高度和底部悬浮条。

### 三次修复验证结果
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- Chrome DevTools 真实页面验证：
  - 红榜区 CSS 为 `flex: 0 0 900px`、`min-height: 900px`；
  - 三个红榜卡片实际高度约 `880px`；
  - 已选主题条 CSS 为 `position: fixed`、`bottom: 24px`；
  - 弹窗滚动前后已选主题条位置不变；
  - 联想区与结果表仍为 `overflow: visible`，结果表没有内部滚动条。

### 四次修复 - 红榜高度回归自然流与底部按钮合并
- [x] 删除红榜区 `flex: 0 0 900px` 与 `min-height: 900px/800px` 固定高度，恢复内容自然撑开。
- [x] 将顶部趋势主题搜索框改成与联想区“关键词”一致的胶囊样式。
- [x] 将“确定/取消”按钮移动到已选浮条中“全部移除”的右侧，按钮原有保存/取消逻辑不变。
- [x] 重新构建、运行专项测试，并在真实页面确认样式与按钮位置。

### 四次修复验证结果
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。
- `node --test tests/keyword-search-p0-contract.test.mjs tests/keyword-trend-theme-setting.test.mjs`：通过，9/9。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- Chrome DevTools 真实页面验证：
  - 红榜容器为 `flex: 0 1 auto`、`min-height: auto`，固定 `900px/800px` 已删除；
  - 顶部趋势主题搜索框与联想区“关键词”标签同为蓝色胶囊样式，圆角 `7px`、无边框、字重 `600`；
  - “确定/取消”显示在“全部移除”右侧；
  - 两个按钮仍是原 `data-scene-popup-save/cancel` 节点，父级已移动到 `data-scene-popup-trend-actions`；
  - 原底部 footer 已隐藏，已选主题条仍 `position: fixed` 固定在视窗底部。

## TODO - 2026-05-10 修复 AI 点睛「展开详情」按钮不触发问题

### 需求规格
- 目标：
  - 保证 `关键词计划` 场景中 `AI点睛设置` 的 `展开详情` 按钮可正常切换详情区。
  - 切换时按钮文案稳定在 `展开详情` / `收起详情`。
  - 无需改动原生提交链路，不能触发真实创建/投放入口。

### 执行计划（可核对）
- [x] 回看 AI 点睛面板模板与事件绑定路径。
- [x] 修复展开/收起交互事件失效问题。
- [x] 重建 userscript 与 extension 产物。
- [x] 用 Chrome DevTools MCP 进行浏览器状态复验（当前会话脚本加载状态需确认）。

### 改动摘要
- 在 `render-scene-dynamic-grid.js` 增加 `syncAiMaxDetailButtonLabel()`，按详情区 `hidden` 状态更新按钮文案。
- 将详情按钮交互改为文档级一次性委托监听，避免仅依赖 `wizardState.els.sceneDynamic` 容器。
- 保留每次渲染后批量同步 `data-ai-max-detail-toggle` 按钮的初始文案。
- 重新构建并同步产物到 `阿里妈妈多合一助手.js`、`dist/*`。

### 验证记录
- `node scripts/build.mjs`：通过。
- 真实页面验证：
  - 本次浏览器会话内未检测到该功能原始 AI 面板挂载；
  - 已补齐绑定逻辑并构建产物，同页面内注入测试面板后可验证点击切换文本与 `hidden` 状态生效（当前作为逻辑复现）。

## TODO - 2026-05-10 AI 点睛完全同构原生可见结构

### 需求规格
- 目标：
  - 对齐原生 `AI点睛` 开关行：帮助图标、说明文案、`介绍文档` 入口。
  - 对齐开启态 `AI点睛设置` 的原生下沉区视觉层级、状态行和 `展开详情` 交互。
  - 对齐开启 AI 点睛后的智能出价提示完整文案。
  - 保持现有 `campaign.aiMaxSwitch` / `campaign.aiMaxInfo` 提交映射不变，不触发真实创建/投放入口。

### 执行计划（可核对）
- [x] 用 Chrome DevTools MCP 读取原生页可见文案、链接和 DOM 层级。
- [x] 补插件 `AI点睛` 专用开关行，加入原生说明、帮助图标和介绍文档链接。
- [x] 将 AI 点睛面板样式改为更接近原生的白底下沉区、状态行和右侧展开入口。
- [x] 补回归断言锁定原生说明、介绍文档链接和完整智能出价提示。
- [x] 构建、专项测试、语法检查和 Chrome DevTools MCP 真实页面复验。
- [x] 补齐红框差异：`已选：N个需求` 右侧入口和需求卡片点击切换预览。

### 原生对照记录
- 原生 `AI点睛` 行显示：`AI点睛` + 帮助图标 + `开/关` + `借助AI点睛开“搜索外挂”，智能识别您表达的搜索流量诉求，精准触达目标客群，有效提升精准流量比例` + `介绍文档`。
- `介绍文档` 链接为 `https://alidocs.dingtalk.com/i/nodes/N7dx2rn0JbxOaqnACQ5kRDGvWMGjLRb3`。
- 开启态显示下沉区：`深度解析主要销量商品的标题和历史成交数据，为你生成以下投放内容`、`表达更多流量诉求`、`已完成深度搜索`、`展开详情`。
- 智能出价提示完整文案为：`开启‘AI点睛’后仅支持智能出价。如需使用手动出价，可关闭该功能。`

### 改动摘要
- 新增 `AI点睛` 专用开关行，对齐原生帮助图标、说明文案和 `介绍文档` 链接。
- 将 AI 点睛面板调整为原生式白底下沉区，状态行和展开按钮保持同态。
- 智能出价提示改为原生完整文案。
- 弹窗摘要更新增加当前动态区域兜底，避免重渲染后写到旧行。
- 2026-05-10 继续补齐：`已选：N个需求` 从面板头部移到核心诉求行右侧，并准备支持点击需求卡片切换当前预览。
- 2026-05-10 红框补齐：`已选：N个需求` 已移到核心诉求行右侧，点击打开同一个 `AI点睛设置` 弹窗；需求卡片点击会切换 active 状态，并用原生 `nativeCrowdList` 中对应需求的解析、搜索词和人群画像刷新下方详情。

### 验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs`：通过，37/37。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- Chrome DevTools MCP：真实插件页刷新后打开 API 向导编辑页，确认 `AI点睛` 行显示帮助图标、原生说明、`介绍文档` 链接；开启态显示 `AI点睛设置`、`已完成深度搜索`、`展开详情` 和完整智能出价提示。
- Chrome DevTools MCP：点击 `展开详情` 后详情区显示热门搜索词和搜索人群画像；关闭 `AI点睛` 后设置区消失、手动出价恢复；重新开启后设置区和原生说明恢复。
- `node --test tests/keyword-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs`：通过，37/37。
- Chrome DevTools MCP：真实插件页刷新后，`AI点睛设置` 中显示右侧 `已选：5个需求`；点击该入口打开 `AI点睛设置` 弹窗，弹窗内有 5 个需求、全选和屏蔽词设置。
- Chrome DevTools MCP：点击第二个需求卡片后，active 需求从 `小型家用洗碗机的精致生活选择` 切换为 `洗碗机耗材一次买齐省心省力`，`AI解析`、热门搜索词和人群画像均随原生逐需求数据变化。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。

### 用户修正 - AI点睛需求选择与切换缺失
- 触发：用户截图红框指出插件缺少原生右侧 `已选：5个需求`，且需求卡片不能点击切换。
- 修正规格：
  - `已选：N个需求` 入口应显示在核心诉求行右侧，点击仍打开 `表达更多流量诉求` 同一设置弹窗。
  - 需求卡片必须可点击切换 active 状态。
  - 切换需求时，下面的 `AI解析`、`热门搜索词`、`搜索人群画像与特征` 应优先使用原生 `nativeCrowdList` 中对应需求的数据。
  - 如果原生接口未返回逐需求数据，只允许保持聚合数据展示，不允许本地伪造内容。

## TODO - 2026-05-15 修复辅助显示日志更新但页面不可见

### 需求规格
- 目标：
  - 当日志出现 `✅ 更新 N 项数据` 时，用户应能在当前可见阿里妈妈表格中看到对应 `.am-helper-tag` 标签。
  - 不改变现有指标计算口径，只修复可见表格选择、DOM 注入可见性和诊断能力。
  - 保持 Tampermonkey 与 extension 双产物同步。
- 判断标准：
  - 若标签被插入到不可见/克隆表格，必须优先选择当前可见且可显示标签的 body 表格。
  - 若标签存在但不可见，应通过诊断函数区分写入表格错误、可见性错误和样式布局差异；基础标签宽度按后续修正保留 `width:100%`。
  - 需要补回归测试覆盖“日志更新但不可见”的可能根因。

### 执行计划（可核对）
- [x] 回看辅助显示表格选择、标签渲染和全局样式。
- [x] 补充诊断或修复逻辑，避免更新不可见表格副本。
- [x] 补充回归测试锁定修复。
- [x] 构建、语法检查和相关测试验证。

### 改动摘要
- 收紧 `Core.isElementVisible()`：向上检查祖先 `display/visibility/opacity/aria-hidden`，并要求目标元素有实际可见矩形。
- 表格选择新增 `visibleRowCount`，并从单个 `resolveTableContext()` 扩展为 `resolveTableContexts()`，遍历所有当前可见且包含可见行的指标表格，避免只更新上方汇总表而漏掉当前计划列表。
- 辅助标签基础样式调整已按后续用户修正取消，`TAG_BASE_STYLE` 恢复保留 `width:100%;margin-top:2px;`；本节保留的有效修复集中在可见表格选择、多表格遍历和诊断能力。
- 渲染标签时给单元格打 `data-am-helper-tagged-cell`，并暴露 `window.__AM_ASSIST_DISPLAY_DIAGNOSTICS__()`，便于问题浏览器直接诊断标签总数、可见数、表格数量、列映射和样例。
- 自动排序被收口到 `applyAutoSort(tableContexts)`，多表格页面只触发一次排序，避免误点多个表头。
- 更新 `tests/logger-api.test.mjs` 和 `tests/report-metric-ratio-columns.test.mjs`，锁定可见表格选择、多表格遍历、标签样式、诊断函数和占比总量传递契约。

### 验证记录
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 和 extension bundle。
- `node --test tests/logger-api.test.mjs tests/report-metric-ratio-columns.test.mjs`：通过，15/15。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- `node --test --test-reporter=dot tests/*.test.mjs`：通过，退出码 0。
- Chrome DevTools MCP 真实 `one.alimama.com` 关键词推广页：`window.__AM_ASSIST_DISPLAY_DIAGNOSTICS__()` 可用，返回 `tagCount=175`、`visibleTagCount=175`、`tableCount=2`、`tableFound=true`、`tableVisible=true`、`tableVisibleRowCount=16`；第二个候选表格 `rowCount=24`、`visibleRowCount=24`，证明同页多表格已被诊断识别。
- Chrome DevTools MCP 样式抽样：该记录来自取消样式调整前，后续用户已要求恢复 `TAG_BASE_STYLE` 的 `width:100%;margin-top:2px;`，当前样式契约以最新任务和测试为准。
- `bash scripts/review-team.sh`：通过，452 个测试中 450 pass、2 skip，所有 automated review checks passed。

### 结果复盘
- 这类现象不能只看 `更新 N 项数据` 日志；该日志证明 DOM 写入发生，但不证明写入到当前可见表格，也不证明标签未被样式裁剪。
- 真实页面验证显示同页可同时存在 2 个指标表格；旧单表格逻辑容易把标签写到上方数据汇总表，用户看下方计划列表时就会认为“没有显示”。
- 本轮没有改指标计算公式和列识别口径，只修复“写到哪里”和“是否看得见”，并给问题浏览器留下可复制的诊断入口。
# TODO - 2026-05-24 编辑计划无法编辑

## 用户复测补充 - 浏览器仍不可编辑
- 触发：用户反馈“请在浏览器里测试，现在还是不行，直到修复位置”。
- 追加要求：必须在真实浏览器中实际尝试修改编辑页字段，而不是只确认“进入编辑页”。
- 追加计划：
  - [ ] 在 Chrome DevTools MCP 中打开当前向导首页，真实点击“编辑计划”。
  - [ ] 对计划名称/预算值等字段执行真实输入，确认是无法聚焦、无法输入、输入后回滚，还是保存/列表不同步。
  - [ ] 定位具体失效源码位置，修复后重新构建并复测。

## 需求规格
- 目标：修复批量建计划 API 向导首页“编辑计划”无法进入可编辑态的问题。
- 约束：只修编辑入口链路和必要同步，不扩大重构；不点击真实创建、投放、提交入口。
- 成功标准：点击任一计划的“编辑计划”后稳定进入编辑页，详情区可见且输入/弹窗控件可操作；源码与生成产物同步。

## 执行计划（可核对）
- [x] 记录本次缺陷与用户修正教训。
- [x] 确认 `src` 与生成产物中 `openStrategyDetail` 是否仍存在同计划点击即关闭的短路。
- [x] 采用最小修复：编辑计划入口只负责打开/刷新编辑态，不承担关闭语义。
- [x] 运行构建同步 userscript 与 extension 产物。
- [x] 做必要静态/浏览器验证，并记录实际结果。

## 高层操作摘要
- 已在 `tasks/lessons.md` 记录本次修正：编辑入口修复必须同步生成产物和真实运行态。
- 已移除 `openStrategyDetail` 中“同一计划已在编辑页时点击即关闭”的短路逻辑，保留统一 `showStrategyDetail(strategy)` 打开链路。
- 已补充回归断言，禁止“编辑计划”入口再次承担关闭语义。
- 已运行构建同步根 userscript、packages 与 extension bundle。

## 验证记录
- `node scripts/build.mjs`：通过，已同步 `阿里妈妈多合一助手.js`、`dist/packages/alimama-helper-pro.user.js`、`dist/extension/page.bundle.js` 等产物。
- `rg "wizardState\\.workbenchPage === 'editor'|const openStrategyDetail = \\(strategyId\\)|setWorkbenchPage\\('home'\\)" src/optimizer/keyword-plan-api/wizard-scene-config/batch-edit-popup.js 阿里妈妈多合一助手.js dist/extension/page.bundle.js dist/packages/alimama-helper-pro.user.js`：确认 `openStrategyDetail` 旧短路已从源码和产物消失，剩余 `setWorkbenchPage('home')` 属于其他关闭/返回链路。
- `node --test tests/keyword-edit-strategy-settings.test.mjs`：3/3 通过。
- Chrome DevTools MCP：在真实 `one.alimama.com` 页面加载 worktree extension `~/.codex/worktrees/313b/alimama-helper-pro/dist/extension`，打开向导后切到首页，点击第一个“编辑计划”，进入编辑页；计划名称与预算值显示为可编辑 textbox，未停留首页，未触发创建/投放/提交。

## 结果复盘
- 根因：源码中“编辑计划”入口曾复用 toggle 关闭语义；更关键的是此前只改了 `src`，真实浏览器加载的 userscript/extension bundle 仍保留旧短路。
- 修复策略：让“编辑计划”只负责打开/刷新编辑态，关闭继续由显式关闭按钮承担；构建同步所有运行产物，并用回归测试锁定该入口契约。
- 风险：当前真实验证覆盖了首页列表第一个计划的编辑入口；未点击 `立即投放`、`批量创建` 或任何真实提交入口。

### 补充验证记录 - 2026-05-24 23:13 编辑计划真实填充修复
- 根因补充：`#am-wxt-keyword-detail-config` 是 `fixed` 子级，但父级 `#am-wxt-keyword-modal` 在详情态只有约 118px 高且 `overflow: hidden`，导致详情区域虽然可见、可被无障碍树枚举，但命中测试落到 `#am-wxt-keyword-detail-backdrop`，真实输入框无法交互。
- 修复摘要：保留弹层高于遮罩的层级，并新增 `#am-wxt-keyword-detail-backdrop.open + #am-wxt-keyword-modal { overflow: visible; }`，只在详情弹层打开时放开 overflow，保留点击遮罩关闭能力。
- 验证命令：`node scripts/build.mjs` 通过，已同步 userscript、packages 和 extension 产物。
- 验证命令：`node --test tests/keyword-edit-strategy-settings.test.mjs` 通过，5/5。
- 浏览器验证：在 `https://one.alimama.com/index.html#!/manage/search?orderField=charge&orderBy=desc` reload 当前扩展 `cfegfgaodnfeigffdknhgciapojejflk` 和页面，打开“组建计划” -> “首页” -> 第一条“编辑计划”。
- 浏览器验证：`elementFromPoint` 在“计划名前缀”输入框中心命中 `INPUT#am-wxt-keyword-prefix`，`#am-wxt-keyword-modal` computed `overflow=visible`。
- 浏览器验证：通过 Chrome DevTools 对“计划名前缀”填入 `关键词推广_20260523_043636_01_验证` 成功，随后恢复为 `关键词推广_20260523_043636_01` 成功；未点击“立即投放”“批量创建”等真实提交入口。
- 控制台记录：页面仍存在平台侧/助手侧既有 `Uncaught (in promise)` 与少量网络错误，抽查最新栈为 `restoreSmartAssistantPatches`，未阻断本次编辑计划字段交互。
- 结果复盘：本轮缺陷不是单一“详情是否打开”，而是“输入框是否真实可命中”。后续 UI 验收必须包含实际 fill/click 行为和 `elementFromPoint` 命中检查。

## TODO - 2026-05-24 编辑计划重复表单修正

### 需求规格
- 用户反馈编辑详情上方旧基础表单重复显示，“上面那些不要”。
- 目标：隐藏上方旧基础表单，只保留下方“场景配置”作为编辑入口。
- 成功标准：编辑计划详情仍能打开；下方“计划名称”等场景配置输入框可真实填充并恢复；不触发真实提交。

### 执行计划（可核对）
- [x] 将 `.am-wxt-static-settings` 恢复为隐藏，避免重复显示。
- [x] 调整回归测试，固定旧基础表单隐藏、详情弹层命中可编辑。
- [x] 构建同步生成产物并运行专项测试。
- [x] 在真实 `one.alimama.com` 页面 reload 扩展后，验证下方“计划名称”可编辑并恢复。

### 高层操作摘要
- 待执行。

### 验证记录 - 2026-05-24 23:16 编辑计划重复表单修正
- 源码修复：`.am-wxt-static-settings` 恢复为 `display: none`，上方旧基础表单不再显示。
- 回归测试：`node --test tests/keyword-edit-strategy-settings.test.mjs` 通过，5/5，覆盖旧基础表单隐藏与详情弹层命中层级。
- 构建同步：`node scripts/build.mjs` 通过，已更新 userscript、packages 和 extension 产物。
- 浏览器验证：reload 当前扩展 `cfegfgaodnfeigffdknhgciapojejflk` 和 `one.alimama.com` 页面后，打开“组建计划” -> “首页” -> 第一条“编辑计划”，详情中只显示“场景配置：关键词推广”，不再显示上方旧基础表单。
- 浏览器验证：下方“计划名称”输入框填入 `关键词推广_20260524_231614_01_验证` 成功，随后恢复为 `关键词推广_20260524_231614_01` 成功；未点击“立即投放”“批量创建”等真实提交入口。

### 结果复盘
- 上一轮把旧基础表单显示出来解决了一个隐藏输入框不可交互的表象，但引入重复 UI。正确方案是隐藏旧表单，同时修复详情弹层 overflow/z-index，让新的场景配置表单成为唯一可编辑入口。
