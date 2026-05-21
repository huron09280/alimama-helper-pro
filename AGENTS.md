# AGENTS.md - 阿里妈妈多合一助手 (Pro版)

这份文件是给 Codex、Claude 和其他代码代理使用的项目级工作规范。修改本仓库时，先读本文件，再读 `tasks/lessons.md` 和与任务相关的源码/测试。

## 核心工作原则

- 你的代码会被同事 Claude 复审；提交前按资深工程师标准自检，优先定位根因，不做临时绕过。
- 简洁优先，保持最小代码侵入；除非确有必要，不做顺手重构、风格漂移或无关文件清理。
- 工作区可能已有用户或其他代理的未提交改动。不得回退、覆盖或格式化与当前任务无关的改动。
- 收到缺陷报告时直接定位并修复，主动查看日志、失败测试和相关实现，不要求用户手把手补上下文。
- 非简单改动完成前要自问：有没有更优雅、范围更小、可验证性更强的实现方式。
- 未证明功能可正常运行前，不得标记完成。

## 任务规划与记录

- 所有非简单任务（3 步以上、涉及架构判断、关键路径或 UI/浏览器验证）必须先在 `tasks/todo.md` 写计划。
- 新任务记录建议放在 `tasks/todo.md` 顶部，包含：
  - `需求规格`：目标、约束、成功标准；
  - `执行计划（可核对）`：可勾选步骤，必须包含验证；
  - `高层操作摘要`：每一步做了什么、为什么；
  - `验证记录`：实际运行的命令、浏览器检查和结果；
  - `结果复盘`：根因、风险、回滚方式或后续事项。
- 启动开发前先校验计划范围是否正确；若执行偏离计划，停止推进并更新计划。
- 执行中按进度同步勾选任务，不要等到最后一次性补状态。
- 收到用户修正、发现重复失误或形成可复用规则时，更新 `tasks/lessons.md`，并在后续任务开始时先回顾相关教训。
- 需要沉淀大量抓包、调研或验证细节时，新建任务笔记文件放在 `tasks/` 下，`tasks/todo.md` 只保留摘要和链接式说明。

## 子代理与上下文管理

- 复杂任务可将调研、探索、并行分析和验证分给子代理；单个子代理只负责一个聚焦问题。
- 主线程保留决策、集成、最终验证和用户沟通，避免把大段无关源码塞进上下文。
- 若当前环境不允许调用子代理，则用 `rg`、`npm run codex:map`、`npm run codex:find -- "<关键词>"` 等小上下文方式替代。
- 上下文压缩时必须优先保留：架构决策、已改文件及关键变化、验证状态、开放 TODO、可回滚信息。

## 项目结构

`src/` 是源码事实来源。根目录 `阿里妈妈多合一助手.js`、`dist/packages/` 和 `dist/extension/` 是由构建生成的兼容/发布产物，不手工维护。

| 路径 | 说明 |
| --- | --- |
| `src/entries/` | userscript 与 MV3 extension 入口、兼容层、图标资源 |
| `src/shared/` | 公共前置代码、平台兼容能力 |
| `src/main-assistant/` | 主面板、辅助显示、指标增强、下载拦截、万能查数、快捷入口 |
| `src/optimizer/` | 算法护航、Token、API、桥接和公开入口 |
| `src/optimizer/keyword-plan-api/` | 批量建计划、场景向导、矩阵配置、请求构建和修复链路 |
| `scripts/` | 构建、打包、Codex 定位、review 门禁、Chrome DevTools 恢复脚本 |
| `tests/` | `node:test` 回归测试与浏览器验收清单 |
| `dev/` | 本地 Tampermonkey Dev Loader 和开发辅助脚本 |
| `docs/`、`other/` | 开发文档、结构速查、发布流程 |
| `services/license-server/` | 授权服务与管理页 |
| `tasks/` | 任务计划、复盘、教训、临时调研笔记 |

更多“改什么去哪里改”的映射见 `docs/源码结构速查.md`。

## 构建与测试命令

优先使用 `package.json` 中的脚本入口：

```bash
npm run build
npm run build:check
npm run check:syntax
npm run test
npm run review
npm run dev:serve
```

底层等价命令：

```bash
node scripts/build.mjs
node scripts/build.mjs --check
node --check "阿里妈妈多合一助手.js"
node --test tests/*.test.mjs
bash scripts/review-team.sh
python3 -m http.server 5173
```

小上下文定位优先使用：

```bash
npm run codex:map
npm run codex:find -- "<关键词>"
npm run codex:changed
```

## 开发流程

1. 回顾 `tasks/lessons.md` 中与当前任务相关的教训。
2. 在 `tasks/todo.md` 写清需求、计划、验证标准和边界。
3. 用 `rg` 或 `npm run codex:find` 精准定位源码与测试，优先读 `src/`、`tests/`、`scripts/`、`docs/`。
4. 只改任务必要文件；生成产物必须通过 `node scripts/build.mjs` 同步，不手改根 userscript 或 `dist/`。
5. 对关键路径补充或更新回归测试。
6. 先跑最小相关测试，再按风险决定是否跑 `npm run review`。
7. 涉及 UI、注入、浏览器运行态或真实页面行为时，必须做真实浏览器验证并记录。
8. 回填 `tasks/todo.md` 的验证记录和结果复盘。

## 代码风格与命名

- 使用 4 空格缩进、分号、`const`/`let`，避免 `var`。
- 不破坏 userscript 双 IIFE 启动结构和桥接协议。
- 保留并谨慎处理这些全局/桥接键：`__AM_HOOK_MANAGER__`、`__ALIMAMA_OPTIMIZER_TOGGLE__`、`__AM_WXT_*`、`__AM_*__`。
- 注入页面的类名和 ID 使用 `am-` 前缀。
- 版本号统一从 `GM_info` 或 `GM.info` 读取，不在 UI 逻辑里硬编码。
- 模块拆分按功能边界落在 `src/`，避免跨文件重复定义平台能力。
- 添加注释只解释非显而易见的约束、协议或兼容性原因。

## 关键路径测试要求

以下改动必须补充或更新测试：

- Hook、fetch/XHR 拦截、`__AM_HOOK_MANAGER__`；
- 配置同步、状态持久化、跨页面缓存；
- 请求载荷构造、计划创建、修复链路、商品绑定；
- UI 状态切换、按钮点击、弹窗编辑、矩阵维度；
- extension 注入链路、MV3 manifest、content/page/background 桥接；
- 授权识别、policy token、license server 依赖与缓存策略；
- 下载链接解析、报表查询、人群看板、万能查数。

测试文件沿用 `tests/*.test.mjs`，使用 `node:assert/strict` 和 `node:test`。优先运行相关测试，提交前或高风险改动后运行：

```bash
npm run build:check
npm run check:syntax
npm run test
npm run review
```

## 浏览器验证要求

- 涉及 UI 或阿里妈妈页面运行态的改动，除自动化测试外，必须通过 `chrome-devtools` MCP 在真实 `one.alimama.com` 页面验证。
- 不能用其他浏览器自动化通道、人工口头确认、本地静态页或代码推断替代真实页面验收。
- 验证前先确认运行态已刷新，避免旧脚本缓存造成误判。
- 若 `chrome-devtools` 通道异常，先运行 `bash scripts/recover-chrome-devtools-mcp.sh`，再恢复验证。
- 不要点击会真实创建、投放、提交或扣费的入口，除非用户明确授权。抓包或提交链路摸排必须先证明阻断/离线/拦截保护有效。
- 浏览器验证结果要写入 `tasks/todo.md`，包括页面、操作、可见状态、控制台/网络异常和结论。

## 构建产物与发布

- `node scripts/build.mjs` 会从 `src/` 生成：
  - 根目录 `阿里妈妈多合一助手.js`；
  - `dist/packages/alimama-helper-pro.user.js`；
  - `dist/packages/alimama-helper-pro.meta.js`；
  - `dist/extension/` unpacked MV3 插件目录。
- `node scripts/build.mjs --check` 用于校验源码与产物同步，并验证 extension 产物可生成。
- `npm run pack:extension` 生成 extension zip。
- 打标签发布前同步 `@version`、`README.md` 和更新记录，参考 `other/RELEASE.md` 与 `.github/workflows/`。

## 提交与 PR

- 提交主题保持简短、结果导向，优先使用 `fix: ...`、`docs: ...` 或 `fix(keyword): ...`。
- 每个提交只解决一个逻辑问题，不混入无关改动。
- PR 说明必须包含变更摘要、风险/回滚说明、实际执行过的命令。
- UI 改动需要截图、GIF 或真实页面验证记录。
- 提交前确认 `npm run review` 通过；若因环境限制无法运行，要明确说明原因和已完成的替代验证。

## 安全与边界

- 不提交密钥、Cookie、店铺敏感信息或用户数据；`.keys/` 等本地敏感目录不得纳入改动。
- 不直接修改线上发布包或生成产物来绕过源码问题。
- 不降低授权、签名、policy token、shopId 校验或桥接白名单安全性。
- 涉及真实投放、创建计划、立即投放、批量提交等功能时，默认只做只读检查或受保护抓包。
- 任何失败、跳过或未验证项都要如实记录，不用“应该可以”替代验证结果。

## 复审前自检清单

- 计划是否已写入并更新到 `tasks/todo.md`？
- 是否回顾了相关 `tasks/lessons.md`？
- 是否只改了必要文件，没有碰无关改动？
- 是否优先修改 `src/`，并通过构建同步产物？
- 是否为关键路径补充或更新了测试？
- 是否运行了与风险相匹配的验证命令？
- UI/浏览器行为是否已用 `chrome-devtools` MCP 在真实页面验证？
- `tasks/todo.md` 是否记录了验证结果、风险和复盘？
