# Repository Guidelines

## 项目结构与模块组织
- `阿里妈妈多合一助手.js` 是主 Tampermonkey 用户脚本，包含核心 UI 逻辑、表格增强、网络 Hook 与护航桥接能力。
- `dev/` 存放本地开发辅助文件：`dev/dev-loader.user.js` 用于本地热加载，`dev/smoke-harness.html` 用于快速 DOM/UI 冒烟验证。
- `tests/` 存放 Node 回归测试（如 `tests/logger-api.test.mjs`、`tests/keyword-plan-api-slim.test.mjs`）。
- `scripts/review-team.sh` 是本地与 CI 共用的统一质量检查入口。
- `.github/workflows/` 定义 CI（`ci.yml`）与基于 tag 的发布流程（`release.yml`）。

## 构建、测试与开发命令
- `node --check "阿里妈妈多合一助手.js"`：校验 userscript 语法。
- `node --test tests/*.test.mjs`：使用 Node 内置测试运行器执行自动化测试。
- `bash scripts/review-team.sh`：执行架构、安全、测试与版本一致性检查。
- `python3 -m http.server 5173`：启动本地静态服务，供 `dev/dev-loader.user.js` 拉取脚本。
- `git tag vX.YY && git push origin vX.YY`：发布版本标签并触发 `.user.js`/`.meta.js` 打包流程。

## 编码风格与命名约定
- 遵循现有 JavaScript 风格：4 空格缩进、保留分号，优先使用 `const`/`let`，避免 `var`。
- 函数保持单一职责，避免跨模块的广泛副作用。
- 保持双 IIFE 与全局桥接契约稳定（如 `window.__ALIMAMA_OPTIMIZER_TOGGLE__`、`window.__AM_HOOK_MANAGER__`）。
- UI ID/Class 建议使用 `am-` 前缀；全局集成键使用 `__AM_*__` 命名。
- 禁止在 UI 中硬编码版本号，应从 `GM_info`/`GM.info` 动态读取。

## 测试指南
- 测试框架：`node:test` + `node:assert/strict`。
- 命名规范：测试文件使用 `*.test.mjs`，放在 `tests/` 目录。
- 调整 Logger、UI 契约、API 桥接暴露或 Hook 行为时，必须同步补充或更新测试。
- 提交 PR 前，先运行 `bash scripts/review-team.sh`，并完成一次 Tampermonkey 手工冒烟验证。

## 自动循环开发流程
- 开发任务默认按以下循环执行：写代码 → 跑 MCP 浏览器测试 → 修 bug → 再次测试，直到关键流程通过。
- MCP 浏览器测试未通过时，不进入提交步骤。
- 完成上述循环后再提交，提交信息使用中文（可保留 `feat:`、`fix:` 等前缀）。

## 提交与 Pull Request 规范
- 提交信息遵循仓库既有风格：`feat:`、`fix:`、`style:`，以及 `feat(wizard): ...` 这类带 scope 的格式。
- 每个提交只处理一个逻辑变更，保持可审阅性。
- PR 需包含简要变更说明、风险说明；涉及 UI 的改动需附截图或 GIF。
- 按 `.github/pull_request_template.md` 完成清单，确保 CI 通过，并按 `CODEOWNERS` 请求必需评审。
