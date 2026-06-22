# 代码仓库探索笔记 - 2026-06-14

## 探索方式
- 本轮以并行只读扫描模拟多个探索子任务；当前环境未暴露真正的 Task/subagent 调用能力。
- 排除范围：`node_modules/`、`.git/`、`dist/`、`coverage/` 等生成或依赖目录。

## 子任务 A：仓库结构与文档
- 顶层目录：`dev/`、`docs/`、`other/`、`scripts/`、`services/license-server/`、`src/`、`tasks/`、`tests/`。
- 仓库当前只有根 `AGENTS.md`；没有发现子目录级 `AGENTS.md`。
- 事实源边界：
  - `src/` 是业务源码事实源。
  - 根目录 `阿里妈妈多合一助手.js`、`dist/packages/`、`dist/extension/` 是构建产物，不手工维护。
  - `tasks/` 存任务记录和临时证据，适合放本轮探索笔记。
- 关键长期文档：
  - `README.md`：安装、核心功能、版本日志、5 分钟上手。
  - `docs/源码结构速查.md`：最有用的维护入口，按需求给出目标文件和测试。
  - `docs/CODEX_WORKFLOW.md`：小上下文工作流。
  - `docs/插件UI统一设计规范.md`、`docs/图标设计规范.md`：UI 改动前必读。
  - `other/RELEASE.md`：发布参考。

## 子任务 B：构建、入口与产物边界
- `package.json` 是零依赖脚本入口，主命令：
  - `npm run build` -> `node scripts/build.mjs`
  - `npm run build:check` -> `node scripts/build.mjs --check`
  - `npm run check:syntax` -> `node --check "阿里妈妈多合一助手.js"`
  - `npm run test` -> `node --test tests/*.test.mjs`
  - `npm run review` -> `bash scripts/review-team.sh`
  - `npm run codex:map/find/changed` -> 小上下文定位脚本。
- `scripts/build.mjs` 是装配事实源：
  - `USERSCRIPT_SEGMENTS` 由 `src/entries/userscript-meta.js` + 核心运行时片段组成。
  - `EXTENSION_PAGE_SEGMENTS` 由 `src/entries/extension-page-compat.js` + license guard + 核心运行时组成。
  - `KEYWORD_PLAN_API_SEGMENTS` 明确列出 `src/optimizer/keyword-plan-api/` 下所有需拼入产物的文件；新增文件必须加入该列表。
  - build 会生成根 userscript、`dist/packages` 和 `dist/extension`，并抽取 `wizard-style.css` 给 extension 使用。
- userscript 入口：
  - `src/entries/userscript-meta.js` 当前版本 `7.06`，匹配 `alimama.com`、`one.alimama.com`、`myseller.taobao.com`、`dmp.taobao.com`。
- extension 入口：
  - `src/entries/extension-content.js` 在隔离世界判断是否注入 `page.bundle.js`，并桥接授权校验请求到 background。
  - 注入范围：`one.alimama.com`、`dmp.taobao.com` 直接注入；`myseller.taobao.com` 仅 SmartAssistant 预算页注入，普通工作台只保留轻量 URL 监听。
  - `src/entries/extension-page-compat.js` 在页面主世界补 `GM_getValue`、`GM_setValue`、`GM_setClipboard`、`GM_info`、`unsafeWindow` 和 `__AM_PLATFORM_RUNTIME__`。
- 授权服务：
  - `services/license-server/` 是独立 Node ESM 服务。
  - `services/license-server/package.json` 主要依赖为 `tablestore`，仓库门禁会校验依赖清单和锁文件。
  - 服务提供 `/v1/license/verify`、`/v1/license/admin/*`、`/v1/license/revoke`，持久化策略以 Tablestore 为唯一持久层。

## 子任务 C：源码模块与桥接边界
- `src/shared/script-preamble.js`
  - 动态解析版本，优先 `GM_info.script.version` / `GM.info.script.version`，并暴露 `__AM_GET_SCRIPT_VERSION__`。
  - 定义运行时跳过逻辑：普通 `myseller.taobao.com` 主助手早退，optimizer 在所有 myseller 页面早退。
  - 提供共享图标渲染 `renderAmIcon()` / `renderAmWindowIcon()`，挂到 `__AM_RENDER_ICON__` 等全局键。
- `src/main-assistant/`
  - `bootstrap.js` 安装 `__AM_HOOK_MANAGER__`，集中管理 fetch/XHR hook、请求历史和 handler 注册。
  - `core.js`、`main.js`、`ui.js` 负责主助手状态、DOM 扫描、主面板、辅助入口。
  - 业务增强文件包括预算前端限制绕过、下载拦截、万能查数、计划 ID 快捷入口、潜力词导出。
- `src/optimizer/`
  - `bootstrap.js` 初始化算法护航配置、状态和工具函数。
  - `token-manager.js`、`api.js`、`core.js`、`ui.js` 负责 token、接口、执行和 UI。
  - `public-api.js` 暴露 `__ALIMAMA_OPTIMIZER_TOGGLE__`、`__ALIMAMA_OPTIMIZER_RUN_CAMPAIGN__`，入口前会走授权检查。
  - `bridge.js` 是 KeywordPlanApi 页面桥接边界；桥接方法白名单包含 `openWizard`、`getRuntimeDefaults`、`fetchKeywordAiMaxInfo`、`createPlansBatch`、`copyCurrentPlanByScene`、`applyMatrixPreset`、`runCreateRepairByItem` 等。
- `src/optimizer/keyword-plan-api/`
  - 是建计划/复制/修复链路的核心域，按运行时默认值、场景规格、生命周期抓包、组件配置、商品搜索、创建与推荐、矩阵、向导挂载、预览、打开创建、repair 拆分。
  - UI 相关继续拆在 `wizard-style-and-state/` 与 `wizard-scene-config/`。
- 规模热点：
  - `src/optimizer/keyword-plan-api/wizard-style-and-state/style.js` 约 9777 行。
  - `src/main-assistant/magic-report.js` 约 9080 行。
  - `src/main-assistant/campaign-id-quick-entry.js` 约 8343 行。
  - `src/optimizer/keyword-plan-api/search-and-draft.js` 约 5829 行。
  - `src/optimizer/keyword-plan-api/scene-spec.js` 与 `render-scene-dynamic-core.js` 均超过 4000 行。
- 全局/桥接敏感键：
  - `__AM_HOOK_MANAGER__`
  - `__ALIMAMA_OPTIMIZER_TOGGLE__`
  - `__ALIMAMA_OPTIMIZER_RUN_CAMPAIGN__`
  - `__AM_WXT_KEYWORD_API__`
  - `__AM_WXT_PLAN_API__`
  - `__AM_WXT_PLAN_API_BRIDGE_HOST__`
  - `__AM_PLATFORM_RUNTIME__`
  - `LicenseGuard`

## 子任务 D：测试、验证与风险链路
- 当前 `tests/` 下有 85 个 `*.test.mjs`。
- `scripts/review-team.sh` 是完整门禁：
  - `node scripts/build.mjs --check`
  - `node scripts/check-license-server-deps.mjs`
  - 检查根 userscript 中关键桥接 `__ALIMAMA_OPTIMIZER_TOGGLE__` 与 `__AM_HOOK_MANAGER__`
  - 禁止 `eval(...)` / `new Function(...)`
  - 禁止 tracked `.DS_Store`
  - `node --check "阿里妈妈多合一助手.js"`
  - `node --test tests/*.test.mjs`
  - userscript、README、CLAUDE 版本一致性。
- 高风险测试簇：
  - 构建与 extension：`build-output-sync`、`build-segments`、`extension-static-build`。
  - 授权与 license server：`extension-license-*`、`license-server-*`、`license-subaccount-tracking`。
  - KeywordPlanApi：`keyword-*`、`matrix-*`、`lifecycle-*`、`scene-*`。
  - 主助手：`magic-report-*`、`campaign-*`、`budget-*`、`download-*`、`logger-api`。
- 高风险行为边界：
  - 任何创建、复制、保存、删除、预算、人群、授权、policy token、shopId 相关改动都不能只靠本地 mock 验收。
  - UI 或真实页面行为改动必须按项目规则在真实 `one.alimama.com`/相关页面用 Chrome DevTools MCP 验证。
  - 写请求验证必须安装守卫，结束后恢复守卫、清理弹窗/勾选，并记录 `hasGuard:false` 等证据。

## 初步结论
- 仓库是“零依赖脚本项目 + userscript/extension 双产物”的结构，真正维护入口在 `src/`。
- 构建脚本采用显式 segment 列表，优点是产物可控；代价是新增源码文件时必须同步 `scripts/build.mjs` 里的 segment，否则产物不会包含新代码。
- 运行时边界很重要：`myseller.taobao.com` 被强约束为普通页不跑完整 runtime，只保留 SmartAssistant 预算页能力；`one.alimama.com` 和 `dmp.taobao.com` 是主要完整注入目标。
- KeywordPlanApi 与主助手中的 `magic-report`、`campaign-id-quick-entry` 是最大复杂度区，后续改动应先用 `docs/源码结构速查.md` 和 `npm run codex:find -- "<关键词>"` 缩小范围。
- 授权与桥接是安全核心，`LicenseGuard`、policy token、shopId、bridge 白名单和全局 API 暴露必须按结构性问题处理，不能临时绕过。
- 本轮未启动真实 Task/subagent 工具，因为当前工具列表未提供该能力；已用并行只读扫描模拟四个探索子任务，并把结论落盘。
