# 代码检查团队（Review Team）

团队目标：每次改动在提交前完成自动化检查与人工审查，降低回归风险，保证 UI 与行为一致性。

## 角色分工

1. 架构守门员（Architecture）
- 关注双 IIFE 架构是否被破坏。
- 关注 `window.__ALIMAMA_OPTIMIZER_TOGGLE__`、`window.__AM_HOOK_MANAGER__` 等关键对外协议是否兼容。
- 审查结果：通过 / 阻塞。

2. 安全审计员（Security）
- 关注危险执行入口（`eval`、`new Function`）是否出现。
- 关注 URL 与动态内容是否仍遵循 `sanitizeUrl`、`textContent + DOM API` 约束。
- 审查结果：通过 / 阻塞。

3. 稳定性测试员（Test）
- 必跑脚本语法检查与测试：`node --check`、`node --test`。
- 检查关键交互变更是否补充回归测试或冒烟项。
- 审查结果：通过 / 阻塞。

4. UI/交互验收员（UX）
- 对照 `PROJECT_RULES.md` 核查自动最小化、z-index、日志按天分组等规则。
- 核查面板交互是否存在明显倒退（遮挡、跳闪、布局错位）。
- 审查结果：通过 / 阻塞。

5. 发布经理（Release）
- 检查 `@version`、README 最近版本、`CLAUDE.md` 当前版本是否一致。
- 确认发布产物与流程（`release.yml`）未被破坏。
- 审查结果：通过 / 阻塞。

## 启动方式

在仓库根目录执行：

```bash
bash scripts/review-team.sh
```

该命令会完成团队中的自动化部分（架构基础约束、安全扫描、测试与版本一致性检查），并输出结果。人工审查项通过 PR 模板清单补齐。

审查分配机制：
- PR 清单：`.github/pull_request_template.md`
- 代码所有者：`.github/CODEOWNERS`
