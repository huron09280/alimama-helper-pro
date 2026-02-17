# Repository Guidelines

## 项目结构与模块组织
- 核心用户脚本：`阿里妈妈多合一助手.js`，包含主运行逻辑、UI、网络 Hook 与护航桥接能力。
- 开发辅助：`dev/dev-loader.user.js`，用于 Tampermonkey 本地联调（刷新页面即生效）。
- 开发辅助：`dev/smoke-harness.html`，用于轻量级 UI/DOM 冒烟验证。
- 自动化检查：`tests/logger-api.test.mjs`，覆盖 Logger 与关键 UI 契约回归。
- 自动化检查：`scripts/review-team.sh`，本地与 CI 统一检查入口。
- CI 与发布流程位于 `.github/workflows/`；PR 检查清单位于 `.github/pull_request_template.md`。

## 构建、测试与开发命令
- `node --check "阿里妈妈多合一助手.js"`：校验脚本语法。
- `node --test tests/logger-api.test.mjs`：运行 Node 内置测试。
- `bash scripts/review-team.sh`：执行架构、安全、测试、版本一致性全量检查（与 CI 同步）。
- `python3 -m http.server 5173`：本地启动静态服务，配合 `dev/dev-loader.user.js` 联调。
- 发布示例：`git tag v5.31 && git push origin v5.31`（触发 `release.yml`）。

## 编码风格与命名约定
- 使用 JavaScript，4 空格缩进，保留分号，遵循 `阿里妈妈多合一助手.js` 现有风格。
- 优先使用 `const`/`let`，函数尽量小且职责单一。
- 保持双 IIFE 架构与跨模块全局桥接（如 `window.__ALIMAMA_OPTIMIZER_TOGGLE__`、`window.__AM_HOOK_MANAGER__`）不被破坏。
- 禁止在 UI 中硬编码版本号；统一从 `GM_info`/`GM.info` 动态读取。
- UI 节点 ID/Class 建议使用 `am-` 前缀；桥接键名保持 `__AM_*__` 形式。

## 测试指南
- 测试框架为 Node 内置 `node:test` + `assert/strict`。
- 测试文件放在 `tests/*.test.mjs`，命名参考 `logger-api.test.mjs`。
- 修改 Logger、UI 契约或 Hook 行为时，必须同步新增或更新回归测试。
- 提交 PR 前先运行 `bash scripts/review-team.sh`，并在真实阿里妈妈页面完成手工冒烟检查。

## 提交与 Pull Request 规范
- 提交信息遵循仓库既有 Conventional Commits：`feat:`、`fix:`、`docs:`、`chore:`、`ci:`；版本发布常用 `chore(release): ...`。
- 每次提交保持聚焦与可审阅性；重构与行为变更尽量拆分。
- PR 需包含：变更摘要、风险说明；涉及界面调整时附截图或 GIF。
- 按 `.github/pull_request_template.md` 完成勾选并确保检查全部通过后再请求评审。
- `CODEOWNERS` 会将核心文件评审路由到 `@huron09280`，不要绕过必需评审流程。
