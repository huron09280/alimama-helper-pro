# CLAUDE.md

Claude Code 入口说明。项目级硬规则以 `AGENTS.md` 为准；开始任何任务前先读 `AGENTS.md`、`tasks/lessons.md` 和当前任务相关源码/测试。

## 快速定位

- 源码事实源：`src/`
- 构建产物：`阿里妈妈多合一助手.js`、`dist/packages/`、`dist/extension/`
- 版本事实源：`src/entries/userscript-meta.js`
- UI 规范：`docs/插件UI统一设计规范.md`、`docs/图标设计规范.md`
- 源码地图：`docs/源码结构速查.md`

## Claude 注意事项

- 不要手改构建产物；修改 `src/` 后运行构建或 `npm run build:check`。
- 版本展示不要在业务 UI 中硬编码，运行态优先从 `GM_info` / `GM.info` 获取。
- 保持 userscript 双 IIFE 和桥接协议，不破坏 `window.__ALIMAMA_OPTIMIZER_TOGGLE__`、`window.__AM_HOOK_MANAGER__`、`__AM_WXT_*` 等全局约定。
- UI、注入、extension 或真实阿里妈妈页面行为改动，按 `AGENTS.md` 要求做真实页面验证并写入 `tasks/todo.md`。
- 交付前至少运行与改动相关的测试；版本和产物同步问题优先跑 `npm run build:check` 与 `node --test tests/build-output-sync.test.mjs`。
