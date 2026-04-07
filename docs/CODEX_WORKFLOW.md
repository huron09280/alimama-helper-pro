# Codex 高效开发工作流（小上下文）

这份文档用于解决两个常见问题：

1. 历史上单文件太大，导致对话上下文很快膨胀。
2. 每轮都做全量分析与全量验证，开发反馈速度慢。

## 核心原则

1. `src/` 是唯一源码事实来源；`阿里妈妈多合一助手.js` 只当构建产物，不做日常阅读与手工修改。
2. 每次只做一个小目标，明确“只改哪些文件”，禁止无关扫描与改动。
3. 检索默认限定在 `src/`、`tests/`、`scripts/`、`docs/`、`README.md`、`package.json`、`AGENTS.md`。
4. 开发中优先跑最小相关回归，提交前再跑全量门禁。

## 命令速查

```bash
npm run codex:map
npm run codex:find -- "__AM_HOOK_MANAGER__"
npm run codex:changed
bash scripts/recover-chrome-devtools-mcp.sh
```

说明：

- `codex:map`：列出可编辑范围文件，避免把上下文浪费在产物和 `dist/`。
- `codex:find`：只在源码范围检索，默认排除 `阿里妈妈多合一助手.js`、`dist/`、`node_modules/`。
- `codex:changed`：查看当前变更是否仍聚焦在目标文件。
- `recover-chrome-devtools-mcp.sh`：一键修复 `chrome-devtools` 通道（专用 profile、9222 端口、Codex MCP 配置）。

## 推荐执行节奏

1. 开始前：用 `npm run codex:map` / `npm run codex:find -- "<关键词>"` 先精准定位。
2. 开发中：只跑相关测试，例如 `node --test tests/xxx.test.mjs`。
3. 提交前：统一执行 `npm run review`（含 `build --check`、语法检查、全量回归）。
4. 涉及 UI 改动：必须补真实阿里妈妈页面验证（按项目约定使用 chrome-devtools MCP）。
5. 若 MCP 报 `Transport closed`：先执行 `bash scripts/recover-chrome-devtools-mcp.sh`，再重开 Codex 会话继续验证。

## Codex 任务模板

```text
目标：
修复/实现 <单一目标>

只改：
src/xxx.js
tests/xxx.test.mjs

禁止：
阿里妈妈多合一助手.js
dist/**
无关模块

验收：
node --test tests/xxx.test.mjs
必要时再跑 npm run review

输出：
只给变更摘要、风险点、实际命令结果
```

## 常见反模式

1. 一次性让 Codex 阅读全仓库或全量文件。
2. 在需求未切片前就执行大范围重构。
3. 每轮都跑 `review-team`，导致反馈循环过长。
4. 直接手改生成产物 `阿里妈妈多合一助手.js`，引入同步冲突。
