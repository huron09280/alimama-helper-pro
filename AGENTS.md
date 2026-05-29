# AGENTS.md - 阿里妈妈多合一助手 Pro

这份文件是给 Codex、Claude 和其它代码代理使用的项目级规则。修改本仓库前，先读本文件，再读 `tasks/lessons.md` 和当前任务相关源码/测试。默认用中文与用户沟通。

## 工作姿态

- 你的代码会被 Claude 复审；提交前按资深工程师标准自检，优先找根因，不做临时绕过。
- 少问多做。低风险歧义可先说明假设并推进；只有缺失信息会改变方案或带来真实风险时才提窄问题。
- 只做用户要求和达成目标必需的改动，不加无关功能、顺手重构或风格迁移。
- 工作区可能已有用户或其它代理改动。不得回退、覆盖、格式化无关改动；必须和相关脏改共存。
- 未证明功能可正常运行前，不得标记完成；失败、跳过和未验证项必须如实记录。

## 计划与记录

- 非简单任务必须先在 `tasks/todo.md` 顶部写计划：3 步以上、涉及架构判断、关键路径、UI/浏览器验证、发布或安全边界都算非简单。
- 计划必须包含 `需求规格`、可勾选 `执行计划`、`高层操作摘要`、`验证记录`、`结果复盘`，并把验证作为计划的一部分。
- 开发前校验计划范围；执行偏离时先停下更新计划，再继续。执行中及时勾选，不要最后一次性补状态。
- 收到用户修正、发现重复失误或沉淀出可复用规则时，更新 `tasks/lessons.md`；启动后续任务时先回顾相关教训。
- 大量抓包、调研或验证细节放到 `tasks/` 下独立笔记，`tasks/todo.md` 只保留摘要和路径。

## Debug-First

- 让错误清晰暴露：保留异常、日志和失败测试，不用静默兜底、假成功、mock 成功路径掩盖问题。
- 修 bug 必须从第一性原理追根因。优先删除冗余配置、死分支和多余闸门；不要在旧绕路上再加新绕路。
- 避免第二套实现、第二事实源、平行校验/权限逻辑、宽泛 `try/catch` 吞错、隐藏默认值和会掩盖坏数据的 fallback。
- 若确需兜底或边界保护，必须说明触发条件、风险、可关闭方式，并在任务记录里写清。
- 缺陷报告默认直接修：主动查日志、报错、失败测试和相关实现，不要求用户手把手补上下文。

## 结构性修复触发

以下情况按结构性问题处理，不按局部热修补丁处理：

- 重复业务逻辑、多事实源、共享校验/权限/路由/缓存。
- API 合同、请求/响应 schema、迁移、跨模块状态同步。
- 反复出现的 bug 模式、隐藏 fallback、测试不稳定。
- 安全、授权、签名、policy token、shopId、真实投放或数据完整性边界。

结构性修复要先找应成立的不变量，让代码在一个地方表达它，再移除过时逻辑。大改前比较“最小补丁”和“根因方案”，当最小补丁会增加不一致或债务时，选可维护方案。

## 子代理与上下文

- 复杂任务优先把调研、定位、并行分析、证据收集交给只读子代理；单个子代理只负责一个聚焦问题。
- 主线程负责决策、集成、代码修改、最终验证和用户沟通。
- 并行代码编辑必须先规划隔离边界；无法调用子代理时，用 `rg`、`npm run codex:map`、`npm run codex:find -- "<关键词>"` 控制上下文。
- 上下文压缩时优先保留：架构决策、已改文件、关键变化、验证状态、开放 TODO、风险和回滚方式。

## 项目事实源

`src/` 是源码事实来源。根目录 `阿里妈妈多合一助手.js`、`dist/packages/`、`dist/extension/` 都是构建产物，不手工维护。

| 路径 | 说明 |
| --- | --- |
| `src/entries/` | userscript、MV3 extension 入口、兼容层、图标资源 |
| `src/shared/` | 公共前置代码、平台兼容能力 |
| `src/main-assistant/` | 主面板、辅助显示、指标增强、下载拦截、万能查数、快捷入口 |
| `src/optimizer/` | 算法护航、Token、API、桥接和公开入口 |
| `src/optimizer/keyword-plan-api/` | 批量建计划、场景向导、矩阵配置、请求构建和修复链路 |
| `scripts/` | 构建、打包、Codex 定位、review 门禁、Chrome DevTools 恢复 |
| `tests/` | `node:test` 回归测试与浏览器验收清单 |
| `docs/`、`other/`、`tasks/` | 文档、发布流程、计划复盘和临时调研 |
| `services/license-server/` | 授权服务与管理页 |

更多定位映射见 `docs/源码结构速查.md`。

## 开发流程

1. 回顾相关 `tasks/lessons.md`。
2. 在 `tasks/todo.md` 写清目标、约束、成功标准、计划和验证。
3. 用 `rg` 或 `npm run codex:find` 精准定位，优先读 `src/`、`tests/`、`scripts/`、`docs/`。
4. 只改必要文件；需要同步产物时运行 `node scripts/build.mjs`，不要手改生成文件。
5. 关键路径补充或更新 `tests/*.test.mjs`。
6. 按风险运行验证：专项测试、语法/类型、构建检查、最小烟测、真实浏览器验证。
7. 完成前做 diff 自审，检查是否存在症状补丁、重复逻辑、隐藏 fallback、吞错、第二事实源、弱测试、死代码、安全回退或未说明的行为变化。
8. 回填 `tasks/todo.md` 的验证记录、风险、回滚方式和结果复盘。

## 常用命令

优先使用 `package.json` 脚本：

```bash
npm run build
npm run build:check
npm run check:syntax
npm run test
npm run review
npm run dev:serve
npm run codex:map
npm run codex:find -- "<关键词>"
npm run codex:changed
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

## 测试与验证

- 验证顺序：相关单测 -> 语法/类型/静态检查 -> 构建检查 -> 最小烟测 -> 浏览器或真实链路验收。
- 无法运行某项验证时，说明原因和已做的替代检查；不要用“应该可以”代替证据。
- 修改以下关键路径必须补充或更新测试：Hook、fetch/XHR 拦截、配置同步、状态持久化、跨页面缓存、请求载荷构造、计划创建/复制/修复链路、商品绑定、UI 状态切换、弹窗编辑、矩阵维度、extension 注入链路、MV3 manifest、content/page/background 桥接、授权识别、policy token、license server、下载链接解析、报表查询、人群看板、万能查数。
- 测试沿用 `node:assert/strict` 和 `node:test`。高风险或提交前优先跑 `npm run review`。

## 浏览器验收

- 涉及 UI、注入、extension、userscript、阿里妈妈页面运行态或真实页面行为的改动，必须用 `chrome-devtools` MCP 在真实 `one.alimama.com` 页面验证。
- 验证前先确认运行态刷新；extension 改动需重载 unpacked extension 后再刷新页面。
- `chrome-devtools` 异常时先运行 `bash scripts/recover-chrome-devtools-mcp.sh`，再恢复验收。
- 不要点击会真实创建、投放、提交、删除或扣费的入口，除非用户明确授权；抓包或提交链路摸排必须先证明阻断、离线或拦截保护有效。
- 浏览器验证记录写入 `tasks/todo.md`：页面、操作、可见状态、控制台/网络异常和结论。

## 代码风格

- 使用 4 空格缩进、分号、`const`/`let`，避免 `var`。
- 保持函数短、嵌套浅、参数少；优先早返回和命名常量。
- 注释只解释意图、约束、协议或兼容性原因，不复述代码。
- 不破坏 userscript 双 IIFE 启动结构和桥接协议。
- 保留并谨慎处理全局/桥接键：`__AM_HOOK_MANAGER__`、`__ALIMAMA_OPTIMIZER_TOGGLE__`、`__AM_WXT_*`、`__AM_*__`。
- 注入页面类名和 ID 使用 `am-` 前缀。
- 版本号统一从 `GM_info` 或 `GM.info` 读取，不在 UI 逻辑里硬编码。
- 模块拆分按功能边界落在 `src/`，避免跨文件重复定义平台能力。
- UI 任务开始前必须阅读 `docs/插件UI统一设计规范.md` 和 `docs/图标设计规范.md`；计划中写明是否按统一规范落地，不新增独立主题系统；验收记录附运行态截图或说明保留偏离的原因。

## 发布与提交

- `node scripts/build.mjs` 生成根 userscript、`dist/packages/alimama-helper-pro.user.js`、`dist/packages/alimama-helper-pro.meta.js` 和 `dist/extension/`。
- `node scripts/build.mjs --check` 校验源码与产物同步，并验证 extension 产物可生成。
- `npm run pack:extension` 生成 extension zip。
- 打标签发布前同步 `@version`、`README.md` 和更新记录，参考 `other/RELEASE.md` 与 `.github/workflows/`。
- 提交主题保持简短、结果导向，优先 `fix: ...`、`docs: ...`、`fix(keyword): ...`；每个提交只解决一个逻辑问题。
- PR 说明包含变更摘要、风险/回滚说明、实际运行命令；UI 改动附截图、GIF 或真实页面验证记录。

## 安全边界

- 不提交密钥、Cookie、店铺敏感信息或用户数据；`.keys/` 等本地敏感目录不得纳入改动。
- 不通过直接修改发布包或生成产物绕过源码问题。
- 不降低授权、签名、policy token、shopId 校验或桥接白名单安全性。
- 涉及真实投放、创建计划、立即投放、批量提交等功能时，默认只做只读检查或受保护抓包。

## 交付前自检

- `tasks/todo.md` 是否已写计划、同步进度并记录验证？
- 相关 `tasks/lessons.md` 是否已回顾；用户修正是否已沉淀？
- 是否只改必要文件，并保护无关脏改？
- 是否优先修改 `src/`，并通过构建同步产物？
- 关键路径是否有测试；验证命令是否与风险匹配？
- UI/浏览器行为是否已在真实页面验收？
- diff 是否通过根因、结构、测试、安全和回滚角度自审？
