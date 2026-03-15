# Repository Guidelines

## 项目结构与模块组织
`阿里妈妈多合一助手.js` 是最终发布的 Tampermonkey 主脚本，也是功能实现的单一事实来源；这是中文文件名，发布、测试和 Dev Loader 都依赖这个原名，不要随意重命名。业务逻辑、页面注入、Hook 桥接、版本日志优先维护在这里，只有明确属于开发辅助的代码才放到 `dev/`。`tests/*.test.mjs` 存放基于 Node 的回归测试，通常一类能力或一个风险点对应一个测试文件。`dev/dev-loader.user.js` 用于本地热加载。发布与流程说明主要在 `README.md`、`KNOWLEDGE.md`、`other/RELEASE.md` 和 `.github/workflows/`。

## 构建、测试与开发命令
- `node --check "阿里妈妈多合一助手.js"`：检查主脚本语法是否有效。
- `node --test tests/*.test.mjs`：运行全部 `node:test` 回归测试。
- `bash scripts/review-team.sh`：统一执行架构、安全、语法、测试和版本一致性检查；提交 PR 和发版前必须运行。
- `python3 -m http.server 8173`：在本地启动静态服务，配合 `dev/dev-loader.user.js` 刷新页面即可加载最新脚本。
- `git tag vX.YY` 与 `git push origin vX.YY`：推送版本标签并触发发布工作流。

## 编码风格与命名约定
统一使用 4 空格缩进、分号和 `const`/`let`，避免 `var`。不要破坏现有 userscript 启动结构和桥接协议，例如 `__AM_HOOK_MANAGER__`、`__ALIMAMA_OPTIMIZER_TOGGLE__`。注入页面的类名和 ID 使用 `am-` 前缀；共享全局键统一使用 `__AM_*__` 形式。这个仓库以大单文件为主，修改应尽量局部、明确、可回溯。版本号统一从 `GM_info` 或 `GM.info` 读取，不要在 UI 逻辑里硬编码。

## 测试指南
凡是修改 Hook、配置同步、请求载荷构造、商品绑定、界面状态切换等关键路径，都应补充或更新测试。测试文件沿用现有 `*.test.mjs` 命名方式，断言使用 `node:assert/strict`，保持聚焦且可读。仓库目前没有强制覆盖率门槛，但每个缺陷修复或高风险改动都应附带回归测试。涉及 UI 的改动，除自动化测试外，还必须完成浏览器测试。浏览器测试只能通过 `chrome-devtools` MCP 连接浏览器执行，不允许改用其他浏览器自动化通道、人工口头确认或跳过真实页面验证；这里的“阿里妈妈页面”指线上投放后台真实页面，而不是本地静态页。

## 提交与合并请求规范
最近提交历史以简短、结果导向的主题为主，通常使用 `fix: ...`，也可使用 `docs:` 或 `fix(keyword): ...` 这类带范围的格式。每个提交只解决一个逻辑问题，避免混入无关改动。PR 需要写清变更摘要、风险或回滚说明、实际执行过的命令；涉及界面调整时附上截图或 GIF。提交前请对照 PR 模板检查，并确认浏览器测试是通过 `chrome-devtools` MCP 完成且自动化测试已通过；打标签前同步 `@version`、`README.md` 与更新记录。



## Compact Instructions

When compressing, preserve in priority order:

1. Architecture decisions (NEVER summarize)
2. Modified files and their key changes
3. Current verification status (pass/fail)
4. Open TODOs and rollback notes
5. Tool outputs (can delete, keep pass/fail only)
