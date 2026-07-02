# TODO - 2026-07-02 v7.07 版本更新、中文提交与发布

## 需求规格
- 用户要求：更新版本，使用中文 commit，并执行发布。
- 版本策略：当前版本为 `7.06`，未指定目标版本；按项目既有两段式版本号顺延到 `7.07`。
- 发布范围：把当前工作区已完成但未提交的修复与文档记录纳入本次发布；不回退、不覆盖已有脏改。
- 发布方式：按 `other/RELEASE.md`，提交后创建并推送 `v7.07` tag，由 GitHub Actions 自动生成 GitHub Release 与发布资产。
- 验证要求：同步版本事实源、README/脚本更新日志、文档示例、mockup 与构建产物；至少运行版本同步测试、extension 静态构建测试、构建检查、语法检查和发布门禁。

## 执行计划
- [x] 校验当前变更范围、版本事实源、发布流程和已有 tag，确认 `v7.07` 不冲突。
- [x] 同步 `src/entries/userscript-meta.js`、`src/shared/script-preamble.js`、README、开发文档、教程/mockup 展示版本到 `7.07`。
- [x] 运行构建生成根 userscript、`dist/packages/` 和 `dist/extension/` 产物。
- [x] 运行版本/构建/语法/测试门禁，并记录失败与修复。
- [x] 做 diff 自审，确认没有症状补丁、版本遗漏、生成产物不同步或无关回退。
- [ ] 使用中文提交信息提交本次发布变更。
- [ ] 创建并推送 `v7.07` tag，触发 GitHub Actions 发布。

## 高层操作摘要
- 已读取项目规则、`tasks/lessons.md` 顶部教训、发布说明和版本事实源；命中 L107：版本更新必须同步示例文档并跑版本同步测试。
- 已确认当前发布流程通过 Git tag 触发 GitHub Actions，不走 npm publish。
- 优雅性自检：本次优先复用现有构建脚本、mockup 生成脚本和发布门禁，不新增第二套版本写入机制。
- 已确认本次版本从 `7.06` 顺延到 `7.07`，当前本地 tag 最高为 `v7.06`，`v7.07` 未占用。
- 已梳理本次发布内容：并发创建跳过全局限速、并发模式旧草稿/徽标交互修复、插件弹窗背景滚动守卫、DMP SPA 路由入口补挂。
- 已同步版本事实源、脚本/README 更新日志、开发文档、授权管理页与新人教程当前展示版本；`node scripts/generate-mockups.mjs` 已重建 mockup HTML。
- `npm run build` 已生成 `7.07` 根 userscript、`dist/packages/` 与 `dist/extension/` 产物。

## 验证记录
- `node --test tests/build-output-sync.test.mjs tests/extension-static-build.test.mjs tests/site-scene-submit-mode.test.mjs tests/plugin-modal-scroll-guard.test.mjs tests/magic-report-crowd-matrix.test.mjs tests/campaign-copy-current-plan-quick-entry.test.mjs`：通过，122/122。
- `npm run build:check`：通过，构建输出版本 `7.07`。
- `npm run check:syntax`：通过。
- `npm run test`：通过，655 项中 653 通过、2 个既有 AgentCluster 条件跳过、0 失败。
- `npm run review`：通过，构建同步、依赖契约、架构/安全检查、全量回归和版本一致性均通过；版本对齐 `7.07`。
- `git diff --check`：通过，无输出。
- Chrome 只读验证：现有达摩盘页 `https://dmp.taobao.com/...analysisTab=crowd-insight...` 中 `#am-dmp-crowd-matrix-entry` 可见，文案为“人群对比看板”，按钮尺寸约 `111x32`；本轮未点击任何创建、提交、删除或投放入口。
- Chrome 控制台检查：存在既有阿里风控脚本 `Error` 与 DMP 自定义画像标签读取失败日志，来源含 `chrome-extension://fejbonphnhfgfomjjchjijfeippmhnfd/page.bundle.js`；未发现本轮操作触发写请求迹象。
- 发现 `src/main-assistant/magic-report.js` 的 DMP 入口复查修复后追加复核：`npm run build:check` 通过；`node --test tests/build-output-sync.test.mjs tests/magic-report-crowd-matrix.test.mjs tests/site-scene-submit-mode.test.mjs tests/plugin-modal-scroll-guard.test.mjs` 通过，96/96。

## 结果复盘
- 版本、更新日志、文档示例、mockup 与构建产物已统一到 `7.07`。
- 发布前自动化门禁和只读页面验收已完成；剩余步骤是中文提交、创建并推送 `v7.07` tag。

# TODO - 2026-07-02 达摩盘人群对比看板入口部分电脑不可见复查

## 需求规格
- 用户反馈：达摩盘里仍有一些电脑无法看到“人群对比看板”按钮，需要检查并修复。
- 范围：只排查 DMP/达摩盘商品洞察页入口按钮的注入、显示条件、路由监听、DOM 锚点、运行态兼容性和构建产物同步；不新增无关功能，不点击会真实创建/投放/提交/删除的入口。
- UI 规范：已读取 `docs/插件UI统一设计规范.md` 与 `docs/图标设计规范.md`；如需改 UI，沿用现有 `--am26-*`、`renderAmIcon()` 和 `am-` 前缀，不新增独立主题或图标体系。
- 历史背景：2026-06-27 已修过 DMP SPA 路由后进入 `crowd-insight` 不补挂入口的问题；本轮按复发缺陷处理，重点检查是否仍存在浏览器兼容 API、页面锚点过窄、脚本注入时机或产物未覆盖的缺口。
- 根因判断：待源码、测试和运行态证据确认。
- 热修 vs 结构性修复取舍：优先在入口识别/挂载单点表达“不变量：进入 DMP 人群洞察页后按钮应可补挂且可重试”，避免针对单台电脑写症状补丁。

## 执行计划
- [x] 回顾历史 DMP 教训、上轮修复记录和入口相关源码/测试，确认当前已知事实。
- [x] 定位仍可能导致部分电脑不可见的条件：路由匹配、history 监听兼容性、DOM 锚点重试、visibility/observer 生命周期、extension/userscript 注入差异。
- [x] 选择更优雅的最小修复方案，更新源码事实源与必要回归测试。
- [x] 运行相关单测、语法/构建同步检查和 diff 自审；涉及产物时通过构建同步，不手改生成文件。
- [x] 尽量使用 Chrome DevTools MCP 在真实 DMP 页面或受控同域页面验证按钮出现；如受登录/环境限制，记录替代证据和限制。
- [x] 在本节补充高层操作摘要、验证记录和结果复盘。

## 高层操作摘要
- 已读取项目规则、`tasks/lessons.md` 顶部历史教训和 UI/图标规范；命中 DMP 相关 L99-L106、L98，以及 2026-06-27 DMP 按钮缺失历史任务。
- 已发现工作区存在多处未提交改动，包括上轮 DMP 修复、构建产物和其它任务文件；本轮会避免回退或覆盖无关改动。
- 源码链路：extension content 在 `dmp.taobao.com` 会直接注入 `page.bundle.js`；DMP host 分支只启动入口监听，不启动普通 one.alimama 主助手。
- 复发可疑根因：当前 DMP 页面判断要求 hash 精确包含 `/items/item-insight` 且 `analysisTab === crowd-insight`，入口锚点又要求页面上存在可见且文案精确为“切换分析单品”的控件。若部分电脑/账号/页面版本的 hash 参数缺省、大小写/分隔符不同，或原生按钮在窄屏/缩放下被折叠、隐藏、文案变体化，observer/timer 会持续重试但无法补挂入口。
- 取舍结论：不做单机或浏览器特判；在入口识别单点做宽容但有边界的结构修复：DMP 商品洞察页路由判断支持常见 hash 变体，按钮锚点首选“切换分析单品”，缺失时退到同一动作区其它稳定控件，仍复用唯一的 `ensureDmpCrowdMatrixButton()`。
- 已在 `src/main-assistant/magic-report.js` 增加 DMP route token 归一化：兼容大小写、下划线/空白分隔、`crowdinsight` 写法，并接受 `analysisTab/tab/activeTab/currentTab/selectedTab` 常见参数；商品洞察页缺省 tab 时按人群洞察入口可补挂处理。
- 已放宽 DMP 入口锚点：继续优先定位“切换分析单品”，同时支持“切换...单品/商品”文案变体，并用“标杆商品池管理”作为同一头部动作区 fallback。
- 已更新 `tests/magic-report-crowd-matrix.test.mjs`，锁定 route token 兼容、缺省 tab 兜底、锚点优先级和 SPA 路由监听。

## 验证记录
- `npm run build:check`：通过，构建输出版本 `7.07`。
- `node --test tests/build-output-sync.test.mjs tests/magic-report-crowd-matrix.test.mjs tests/site-scene-submit-mode.test.mjs tests/plugin-modal-scroll-guard.test.mjs`：通过，96/96。
- Chrome 只读验证：现有达摩盘人群洞察页中 `#am-dmp-crowd-matrix-entry` 可见，文案“人群对比看板”，按钮尺寸约 `111x32`；没有点击业务写操作入口。
- 控制台检查：仅见既有 DMP 标签读取失败与阿里风控脚本 `Error` 噪声，本轮未触发创建、提交、删除或投放请求。

## 结果复盘
- 已完成结构性收口：入口是否出现不再只依赖单一 `analysisTab=crowd-insight` 与精确“切换分析单品”文案，降低不同账号/页面版本/缩放布局导致的按钮缺失概率。
- 本轮仍保持单一入口挂载函数，不新增第二套 DMP 看板或按钮实现。

# TODO - 2026-07-01 Chrome 复测并发提交仍未生效

## 需求规格
- 用户反馈：关键词推广批量建计划 API 向导中选择“提交创建 -> 并发”后，在 Chrome 复测仍然没有并发。
- 用户确认 Chrome unpacked extension 加载路径为当前仓库 `dist/extension`，需要判断是否插件加载错误并继续修复。
- 范围：排查提交方式菜单、草稿状态、确认弹窗、提交执行链路与底层请求限速；真实页面测试必须先装写请求守卫，不创建、不投放、不删除计划。
- 根因判断：路径正确且 Chrome 当前读取的 `page.bundle.js` 与本地 `dist/extension/page.bundle.js` SHA-256 一致；并发状态也已进入 `并发数 3`。新的断点是 `createPlansBatch` 虽用 `Promise.all` 构造并发任务，但每个任务最终进入 `API.request -> waitForRateLimitSlot()`，被全局 `10rpm/6s` 队列重新串行化。
- 取舍：保留普通 API 限速；只给明确的并发创建请求增加跳过全局限速的显式选项，避免新增第二套请求实现。

## 执行计划
- [x] 核对源码中并发菜单、草稿、确认弹窗、提交执行的传递链路。
- [x] 用 Chrome DevTools 检查当前页面加载的构建版本与并发状态变化，不触发真实提交。
- [x] 按根因最小修复，并补一条能防回归的检查。
- [x] 运行相关测试、构建/语法/同步检查和 diff 自审。
- [x] 更新 `tasks/lessons.md`，记录“用户复测失败时必须先验证运行态构建”的教训。
- [x] 修复并发创建被全局 `API.request` 限速串行化的问题。
- [x] 补充回归测试，证明并发创建请求会显式跳过全局请求队列，普通请求默认不跳过。
- [ ] 重新构建并在 Chrome 当前扩展包中核对新 bundle 哈希/补丁特征。
- [ ] 在写请求守卫下点击确认提交，验证运行日志出现并发数与拦截请求记录；结束前恢复守卫。

## 高层操作摘要
- Chrome DevTools 证据：当前关键词推广详情页 `planBuild=2026-02-18 04:00`，`hasCurrentBadgeFix=false`，`hasScrollGuardFix=false`，说明 Chrome 复测环境仍是旧插件/userscript 运行态，不包含当前仓库修复。
- 源码链路结论：`setSubmitModeFromUI('parallel')` 原本只写 `draft.submitMode`；若历史草稿中的 `parallelSubmitTimes` 是 1，提交阶段会进入并发模式但 `submitTimes` 仍为 1，用户肉眼表现就是“选了并发但没有并发重复提交”。
- 已在 `src/optimizer/keyword-plan-api/wizard-mount-intro.js` 的共享提交方式 setter 里补不变量：切到 `parallel` 且当前并发数 `<=1` 时，自动提升到默认并发数（至少 2）。
- 已在 `tests/site-scene-submit-mode.test.mjs` 增加回归断言，覆盖“直接选择并发菜单项会把旧草稿 ×1 提升到有效并发数”。
- 已运行 `npm run build` 同步根 userscript、`dist/packages/alimama-helper-pro.user.js` 和 `dist/extension/page.bundle.js`。
- 2026-07-01 追加 Chrome 证据：用户加载的 unpacked extension 路径为当前仓库 `dist/extension`，扩展 ID `fejbonphnhfgfomjjchjijfeippmhnfd`；页面当前向导显示 `提交方式：并发`、菜单 active 为 `并发数 3`。
- 2026-07-01 追加包验证：Chrome 通过 `chrome-extension://fejbonphnhfgfomjjchjijfeippmhnfd/page.bundle.js` 读取到的 bundle SHA-256 为 `ac526e3ef226a75d29ac6f5c85466ea3a78952f52fc45e928dbf457dc8ed96b8`，与本地 `dist/extension/page.bundle.js` 完全一致，说明加载路径正确且当前页面已用新包。
- 2026-07-01 新根因：并发分支内部最终仍调用 `API.request`，该函数每次请求前都会 `await API.waitForRateLimitSlot(signal)`；并行任务被全局队列按 6 秒间隔放行，导致真实 HTTP 层没有并发。
- 已在 `API.request` 增加显式 `skipRateLimit` 选项，并仅在并发创建分支构造 `skipRateLimit: true` 的请求选项；普通请求继续走全局 10rpm 队列。

## 验证记录
- Chrome DevTools MCP：仅检查页面运行态与补丁特征，未点击真实创建/提交；当前页面为旧运行态，不能作为当前构建功能验收。
- `node --test tests/site-scene-submit-mode.test.mjs`：先在未 build 时失败，原因是测试读取根 userscript 产物；`npm run build` 后重跑通过，12/12。
- `npm run build`：通过。
- `npm run check:syntax`：通过。
- `npm run build:check`：通过。
- `git diff --check`：通过，无输出。
- 构建产物核对：`src/optimizer/keyword-plan-api/wizard-mount-intro.js`、`dist/extension/page.bundle.js`、`dist/packages/alimama-helper-pro.user.js`、根 `阿里妈妈多合一助手.js` 均包含 `draft.parallelSubmitTimes = Math.max(2, normalizeParallelSubmitTimes(DEFAULT_SCENE_PARALLEL_SUBMIT_TIMES, 2));`。
- `node --test tests/site-scene-submit-mode.test.mjs`：版本发布前重跑通过，并覆盖 `skipRateLimit` 仅用于并发创建分支、普通批量提交不默认跳过限速。

## 结果复盘
- 已补上这次复测暴露的真正缺口：不是只修按钮徽标，而是在提交方式事实源里保证“并发模式必须有有效并发数”。
- 已继续补上最终根因：并发创建请求不再被 `API.request` 全局 10rpm 队列重新串行化；普通 API 请求仍保留限速保护。
- 当前 Chrome 仍需要重载当前仓库的 `dist/extension` 或更新 userscript 后再复测；否则仍会跑旧 `2026-02-18 04:00` 运行态。
- 本轮未点击真实创建、提交、删除或投放入口。

# TODO - 2026-07-01 插件弹窗背景滚动阻断修复

## 需求规格
- 用户反馈：插件弹窗打开后，弹窗以外的位置仍能用鼠标滚轮或鼠标中键带动背景网页滚动。
- 目标：任一插件弹窗/遮罩打开时，弹窗内容区域保留正常滚动；弹窗外背景网页不得响应 `wheel` 或鼠标中键自动滚动。
- 范围：优先修复关键词推广 API 向导及其二级弹窗，并兼顾主助手现有 body 级插件弹窗；不改变弹窗视觉、不修改真实创建/投放/删除流程。
- UI 规范：沿用现有遮罩、`am-`/`am-wxt-` 命名和滚动容器设计；本轮不新增独立主题或图标。
- 根因判断：`src/main-assistant/ui.js` 原有滚动链守卫只在事件目标处于插件内部时处理 `wheel`，事件落在遮罩空白区或背景网页时直接放行；同时没有拦截鼠标中键 `mousedown/auxclick`，会触发浏览器背景自动滚动。
- 取舍：优先做一个小型共享运行态守卫，动态识别已打开的插件弹窗根节点；避免在每个弹窗里重复写事件拦截。

## 执行计划
- [x] 回顾弹窗挂载/关闭逻辑，确认主向导、二级弹窗、主助手弹窗的共同入口。
- [x] 设计最小背景滚动守卫：弹窗内允许滚动，弹窗外捕获并阻断 `wheel`、鼠标中键 `mousedown`/`auxclick`。
- [x] 在源码事实源中落地实现，不手改构建产物。
- [x] 补充回归测试，锁定事件守卫、弹窗选择器和中键阻断行为。
- [x] 运行构建、相关测试、语法/构建同步检查和 diff 自审。
- [x] 尝试 Chrome DevTools MCP 真实页面验证；若受登录/环境限制，记录限制和替代验证。

## 高层操作摘要
- 已接手上轮上下文：项目规则、历史教训、UI/图标规范已在本轮前置读取；本次继续按 UI 运行态修复流程执行。
- 定位结论：`src/main-assistant/ui.js` 已有 `wheel` 滚动链守卫，但只在事件目标位于插件内部时生效；事件落在遮罩外层或网页背景时直接放行，中键 `mousedown/auxclick` 也没有拦截。
- 取舍结论：复用现有 UI 守卫安装点，动态识别已打开的插件弹窗根节点；弹窗内容、body portal 子菜单算内部，其他位置统一阻断背景滚动和中键自动滚动。
- 已在 `src/main-assistant/ui.js` 增加弹窗根节点、弹窗内部区域、滚轮调数值控件三组选择器：背景区域统一阻断，弹窗内部滚动继续交给原滚动链判断，`×N`/复制数量等滚轮控件不被捕获层吞掉。
- 已在 `src/main-assistant/main.js` 的 `main()` 开头安装滚动守卫，保证 DMP 分支提前 return 时也具备弹窗背景滚动阻断。
- 已新增 `tests/plugin-modal-scroll-guard.test.mjs`，覆盖主弹窗/二级弹窗/body 子弹层选择器、`wheel` 捕获、鼠标中键捕获、滚轮调数值控件豁免和 DMP 安装点。

## 验证记录
- `node --test tests/plugin-modal-scroll-guard.test.mjs`：通过，4/4。
- `node --test tests/keyword-wizard-entry-regression.test.mjs`：通过，10/10。
- `node --test tests/campaign-batch-plus-quick-entry.test.mjs`：通过，13/13。
- `node --test tests/site-scene-submit-mode.test.mjs`：通过，11/11。
- `node --test tests/campaign-copy-current-plan-quick-entry.test.mjs`：通过，15/15。
- `node --test tests/magic-report-crowd-matrix.test.mjs`：通过，74/74。
- `npm run build`：通过，已同步根 userscript、`dist/packages/alimama-helper-pro.user.js` 与 `dist/extension/page.bundle.js`。
- `npm run check:syntax`：通过。
- `npm run build:check`：通过，源码与构建产物同步。
- `git diff --check`：通过，无输出。
- `node --test tests/extension-static-build.test.mjs`：通过，11/11。
- `node --test tests/build-output-sync.test.mjs`：通过，5/5。
- Chrome DevTools MCP：已切到真实 `https://one.alimama.com/index.html#!/manage/search?...` 关键词推广页；该页当前加载的扩展运行态不含本次新增守卫（`guardInBundle=false`，`planBuild=2026-02-18 04:00`），因此未作为发布后端到端验收。
- Chrome DevTools MCP 替代验证：在真实页面 DOM 临时注入当前守卫等价测试夹具，只创建并移除测试遮罩/菜单，不发请求不点击业务按钮；结果为背景 `wheel`、中键 `mousedown`、中键 `auxclick` 均被取消，弹窗内部滚轮与滚轮调数值控件均未被吞掉，测试 DOM 已清理且页面滚动位置恢复。
- 网络/控制台检查：XHR/fetch 仅见页面自身 banner trace/pv GET，请求列表未出现创建、提交、删除或投放接口；控制台仅有既有资源 `ERR_TUNNEL_CONNECTION_FAILED`，本轮未触发业务写操作。

## 结果复盘
- 已完成最小结构性修复：一个共享 UI 守卫统一处理插件弹窗背景滚动/中键自动滚动，不在各弹窗里复制拦截代码。
- 修复覆盖关键词 API 向导、场景二级弹窗、商品选择弹窗、批量+/AI 点睛/复制/并发日志/万能查数等主助手弹窗，并保留弹窗内部滚动和滚轮调数值交互。
- 剩余限制：当前 DevTools 连接的 Chrome profile 仍加载旧扩展运行态，真实页面只完成“临时等价守卫”事件验证；发布自测前建议把 unpacked extension 指向当前仓库 `dist/extension` 后再做一次真实弹窗手动滚轮/中键验收。

# TODO - 2026-07-01 关键词推广 API 向导并发数交互修复

## 需求规格
- 用户反馈：关键词推广批量建计划 API 向导里提交创建选择并发后，实际没有并发提交。
- 根因判断：并发数徽标 `×N` 是独立交互，只调整 `parallelSubmitTimes` 并阻止冒泡，不会触发外层 `data-submit-mode="parallel"` 菜单项；提交阶段仍可能读取到 `submitMode=serial` 并强制 `submitTimes=1`。
- 范围：只修复并发数交互与必要回归测试；不改变创建接口合同、不新增队列/调度抽象、不触碰真实投放数据。
- 取舍：最小结构性修复是在并发数调整入口同步切换 `submitMode=parallel`，复用现有 `setSubmitModeFromUI()`、`setParallelSubmitTimesFromUI()` 和提交链路。

## 执行计划
- [x] 回顾项目规则、历史教训和当前并发提交链路。
- [x] 修改并发数徽标交互：调整 `×N` 时同步切换为并发提交模式。
- [x] 增加回归测试，锁定“调整并发数会同步切到并发模式”。
- [x] 运行相关测试、构建同步检查和 diff 自审。

## 高层操作摘要
- 已确认当前实现里 `submitMode=serial` 会在提交时强制 `submitTimes=1`；并发数徽标点击只改次数，不改提交模式。
- 已在并发数调整入口复用 `setSubmitModeFromUI('parallel')`，避免新增第二套状态写入。
- 已补 `tests/site-scene-submit-mode.test.mjs` 回归断言，覆盖并发数徽标调整必须同步切换提交模式。

## 验证记录
- `npm run build`：通过，已同步根 userscript、`dist/packages/alimama-helper-pro.user.js` 与 `dist/extension/page.bundle.js`。
- `node --test tests/site-scene-submit-mode.test.mjs`：通过，11/11。
- `npm run check:syntax`：通过。
- `npm run build:check`：通过，源码与构建产物同步。
- `git diff --check`：通过，无输出。
- Chrome DevTools MCP：已切到真实 `https://one.alimama.com/index.html#!/manage/search?...` 关键词推广页，刷新页面后确认插件运行态存在（`scriptVersion=7.06`、`__AM_WXT_PLAN_BUILD__` 存在）；当前页面未成功打开插件 API 向导 DOM（`#am-wxt-keyword-run-mode-menu` 不存在，`批量+` 点击未出现菜单），因此真实向导并发菜单交互未完成验收。网络记录仅见刷新/页面查询/推荐类请求，未见 `/solution/addList.json` 创建提交接口。

## 结果复盘
- 已修复根因：并发数徽标调整不再只改 `parallelSubmitTimes`，会同步切换 `submitMode=parallel`，避免提交阶段仍按单条强制 `submitTimes=1`。
- 修复复用现有草稿状态入口，没有新增第二套并发状态、调度器或请求队列。
- 剩余限制：真实 one.alimama 页面只完成刷新与插件存在检查，未能打开 API 向导做端到端点击验收；本轮未点击任何创建、提交、下单、删除或投放入口。

# TODO - 2026-06-27 DMP 人群对比看板按钮缺失排查

## 需求规格
- 用户反馈：达摩盘里“人群对比看板”在部分浏览器看不到入口按钮，需要查明原因并修复可复现的根因。
- 范围：只排查并最小修复 DMP/达摩盘商品洞察页的人群对比看板入口注入、显示条件、浏览器兼容性或页面时机问题；不新增无关功能，不手工改构建产物。
- UI 规范：已读取 `docs/插件UI统一设计规范.md` 与 `docs/图标设计规范.md`；若改 UI，沿用现有 `--am26-*`、`renderAmIcon()` 和 `am-` 前缀。
- 根因判断：待源码与运行态证据确认；优先考虑 DOM 锚点识别过窄、URL/路由判断过窄、浏览器兼容 API、异步注入时机、扩展/userscript 权限差异。
- 热修 vs 结构性修复取舍：优先在共享入口识别/挂载函数里一次性修复，避免对单个浏览器或单个页面写症状补丁。

## 执行计划
- [x] 回顾 `AGENTS.md`、`tasks/lessons.md`、UI/图标规范和当前任务要求。
- [x] 定位 DMP 人群对比看板入口按钮源码、注入条件、相关测试与历史逻辑。
- [x] 找出“部分浏览器缺按钮”的最小根因，并评估有没有更优雅的单点修复。
- [x] 实施最小修复与必要回归测试。
- [x] 运行相关单测、语法/构建检查；能连接真实页面时补 Chrome DevTools 验证并记录。
- [x] 做 diff 自审，补充验证记录和结果复盘。

## 高层操作摘要
- 已读取项目规则、历史教训，命中 DMP 相关 L99-L106：按钮/下拉要保留看板形态、挂载/默认时机必须基于真实运行态。
- 已读取 UI 与图标规范；本轮不会新增独立主题或图标体系。
- 定位结论：DMP extension content script 在 `document_start` 对 `dmp.taobao.com` 直接注入 page bundle；`src/main-assistant/main.js` 只在 `main()` 首次执行时判断一次 `analysisTab=crowd-insight`。若浏览器先进入 DMP 壳页/空 hash，再由 SPA 改到商品人群洞察页，当前代码不会再次调用 `MagicReport.initDmpCrowdMatrixEntry()`，入口按钮缺失。
- 取舍结论：最小结构性修复是在 DMP host 分支安装 hash/popstate/history 路由监听，进入目标页时复用同一个 `MagicReport.initDmpCrowdMatrixEntry()` 单点补挂入口；不改 DMP 按钮 DOM、样式、取数或弹窗逻辑。
- 已在 `src/main-assistant/main.js` 增加 DMP host 入口监听：DMP 域名不再只按首次 URL 判断是否初始化按钮，而是监听 `pushState`、`replaceState`、`hashchange`、`popstate`；进入人群洞察路由时补执行入口初始化，离开时移除入口并清理 timer/observer/visibility handler。
- 已在 `tests/magic-report-crowd-matrix.test.mjs` 增加回归断言，覆盖 DMP SPA 路由后进入 `crowd-insight` 会补挂入口、离开路由会清理入口、DMP host 不落入普通 one.alimama 主助手初始化。
- 浏览器环境发现：专用 Chrome profile 当前加载的阿里妈妈扩展路径仍是旧 worktree `/Users/liangchao/.codex/worktrees/f880/alimama-helper-pro/dist/extension`，直接用该 profile 会跑旧 bundle；已另开临时 profile 加载当前 `dist/extension`，但 Chrome 临时加载方式下 content script 未自动注入。最终用同一 DMP 页面 CDP 手动注入当前 `page.bundle.js` 验证路由监听逻辑。

## 验证记录
- `node --check tests/magic-report-crowd-matrix.test.mjs`：通过。
- `npm run build`：通过，已同步根 userscript、`dist/packages/alimama-helper-pro.user.js` 与 `dist/extension/page.bundle.js`。
- `node --test tests/magic-report-crowd-matrix.test.mjs`：通过，74/74。
- `npm run check:syntax`：通过。
- `npm run build:check`：通过，源码与构建产物同步。
- `git diff --check`：通过，无输出。
- `node --test tests/extension-static-build.test.mjs tests/magic-report-crowd-matrix.test.mjs`：通过，85/85。
- Chrome DevTools MCP：当前会话里的 `mcp__chrome_devtools.list_pages` 仍使用旧 MCP 配置，报 `Could not find DevToolsActivePort`；已把全局 MCP 配置修正为 `chrome-devtools-mcp --browserUrl http://[::1]:9222`，但当前 Codex 会话未热加载，故本轮真实浏览器验证改用同一 DevTools Protocol 端点执行。
- 浏览器/CDP 受控验证：DMP 未登录会跳到 `https://dmp.taobao.com/login.html`，无法进入真实商品洞察页；在 DMP 同域页面手动注入当前构建 bundle 后，日志显示 `DMP 单品人群看板入口监听`，普通主助手面板未启动；从 `/index_new.html` 通过 `history.pushState` 进入 `#!/items/item-insight?analysisTab=crowd-insight&itemId=757440599385&cycle=30` 后出现 `#am-dmp-crowd-matrix-entry`，文案为“人群对比看板”，`dataset.amDmpCrowdMatrixEntry=1`；再切到 `analysisTab=goods-insight` 后入口移除。
- 浏览器/CDP 写操作检查：验证脚本只创建临时 DOM 锚点并修改同域 URL/hash；资源记录只见 DMP 页面脚本与只读 `api_2/crowd` 查询，没有点击、提交、创建、删除、投放或扣费动作。

## 结果复盘
- 已定位根因并完成最小结构性修复：按钮缺失不是样式或按钮 DOM 问题，而是 DMP SPA 路由后进入人群洞察时，旧逻辑没有再次执行入口初始化。
- 修复保持单一挂载路径，继续复用 `MagicReport.initDmpCrowdMatrixEntry()`、原有按钮样式、原有弹窗和取数逻辑；没有新增第二套 DMP 入口实现。
- 剩余限制：本机专用 Chrome profile 的已安装扩展仍指向旧 worktree，且当前 DMP 未登录，尚未完成真实商品洞察页原生“切换分析单品”按钮旁的全链路验收。发布/自测前应把测试 profile 的 unpacked extension 指向当前仓库 `dist/extension` 并在登录态 DMP 页面复验一次。

# TODO - 2026-06-22 neat-freak 收尾同步

## 需求规格
- 用户触发 `neat-freak`，要求会话结束前同步项目知识库、任务记录和记忆入口。
- 本轮主要变更是中文提交与 GitHub 推送；未引入业务源码或运行态功能变化。
- 必须优先处理知识库膨胀：活跃 `tasks/todo.md` 只保留当前会话，已完成历史迁入 `tasks/archive/`。
- 不改业务源码、不改构建产物、不触发真实阿里妈妈页面操作；若发现文档与代码事实冲突，优先最小修正。

## 执行计划
- [x] 完成尺寸体检、文档枚举、记忆入口检查和当前会话影响判断。
- [x] 归档 `tasks/todo.md` 中已完成会话，保持活跃计划轻量。
- [x] 审查 README、CLAUDE/AGENTS、docs、任务记录是否需要补充本轮发布事实或删除过期叙事。
- [x] 运行文档/任务记录最小验证：尺寸检查、相对时间扫描、链接/路径抽查、`git diff --check`。
- [x] 在 `tasks/todo.md` 写入验证记录和结果复盘。

## 高层操作摘要
- 已使用 `neat-freak` 技能，并读取技能说明、`references/agent-paths.md` 和 `references/sync-matrix.md`。
- 已回顾 `tasks/lessons.md` 顶部教训，重点命中 L145：活跃 todo 只保留当前会话。
- 尺寸体检：`CLAUDE.md` 19 行、`AGENTS.md` 70 行、`README.md` 346 行、`tasks/todo.md` 107 行、`tasks/lessons.md` 915 行；入口规则未膨胀，活跃 todo 需要收口。
- 已枚举并审查根 markdown、`docs/` 全部文档、`other/RELEASE.md`、全局 `~/.codex/AGENTS.md` 与散落任务笔记；本轮发布事实属于会话结果，不进入 README/架构文档。
- 已将 2026-06-15 至 2026-06-22 的已完成任务迁入 `tasks/archive/todo-history-2026-06-15-to-2026-06-22.md`，并更新 `tasks/archive/README.md`。
- 已修正 `.github/pull_request_template.md` 中不存在的旧规则文档指针，改为 `AGENTS.md` 与 UI 规范。

## 验证记录
- 尺寸复核：`CLAUDE.md` 19 行、`AGENTS.md` 70 行、`README.md` 346 行、`tasks/todo.md` 34 行、`tasks/archive/todo-history-2026-06-15-to-2026-06-22.md` 111 行。
- 失效指针扫描：旧 PR 规则路径在长期文档和活跃 todo 中清零；已完成任务标题只存在于新归档文件。
- 相对时间关键词扫描：`README.md`、`CLAUDE.md`、`AGENTS.md`、`docs/`、`other/`、活跃 todo 和本轮归档无业务文档命中。
- `node --test tests/agents-rules-contract.test.mjs tests/build-output-sync.test.mjs tests/review-team-script.test.mjs`：通过，12/12。
- `git diff --check`：通过。

## 结果复盘
- 已完成 neat-freak 收尾：长期文档未新增历史叙事，活跃 todo 已收回到当前任务，旧完成流水迁入 `tasks/archive/`。
- 本轮没有修改业务源码、构建产物、版本号或真实页面运行态。
- 剩余风险：`tasks/` 历史笔记总体体量仍大于 `docs/`，但本轮只处理活跃 todo 膨胀；历史专项笔记是否进一步毕业进 docs 需要单独任务切片。
