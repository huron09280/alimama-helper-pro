# 仓库贡献指南

## 项目结构与模块组织
- `阿里妈妈多合一助手.js` 是主 Tampermonkey 用户脚本，界面、数据钩子、护航桥接能力均以它为准。
- `tests/` 存放 Node 回归测试，文件命名统一为 `*.test.mjs`。
- `dev/dev-loader.user.js` 用于本地热加载；`dev/smoke-harness.html` 用于快速 UI/DOM 冒烟验证。
- `scripts/review-team.sh` 是本地与 CI 共用的质量门禁脚本。
- `.github/workflows/ci.yml` 负责 PR/分支校验，`.github/workflows/release.yml` 负责打包与发布资产。

## 构建、测试与开发命令
- `node --check "阿里妈妈多合一助手.js"`：检查主脚本语法。
- `node --test tests/*.test.mjs`：运行全部自动化回归测试。
- `bash scripts/review-team.sh`：执行架构契约、安全扫描、测试与版本一致性检查（提交前必跑）。
- `python3 -m http.server 5173`：启动本地静态服务，配合开发加载器刷新即生效。
- `git tag vX.YY && git push origin vX.YY`：推送版本标签并触发发布流水线。

## 编码风格与命名约定
- 统一使用 4 空格缩进、保留分号，优先 `const`/`let`，避免 `var`。
- 保持双 IIFE 架构稳定，不破坏全局桥接协议（如 `__AM_HOOK_MANAGER__`、`__ALIMAMA_OPTIMIZER_TOGGLE__`）。
- 注入页面的类名/ID 建议使用 `am-` 前缀；全局共享键使用 `__AM_*__` 形式。
- 禁止在界面中硬编码版本号，必须从 `GM_info` 或 `GM.info` 动态读取。

## 测试指南
- 测试框架为 `node:test`（配合严格断言）。
- 修改日志 API、钩子行为、配置同步或关键界面流程时，必须补充或更新对应测试。
- 提交 PR 前除自动化检查外，还需按 `SMOKE_TEST_CHECKLIST.md` 完成关键手工回归。

## 提交与合并请求规范
- 提交信息遵循仓库历史风格：`fix: ...`、`fix(scope): ...`、`docs: ...`，简洁描述可验证变更。
- 每次提交只解决一个逻辑问题，避免把无关修改混入同一提交。
- PR 需包含：变更说明、风险与回滚要点、执行过的检查项；涉及 UI/交互需附截图或 GIF。
- 提交前完成 `.github/pull_request_template.md` 清单并确保 CI 通过。
