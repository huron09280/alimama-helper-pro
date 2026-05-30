# AGENTS.md - 阿里妈妈多合一助手 Pro

给 Codex、Claude 和其它代码代理的项目级规则。默认用中文沟通。动手前先读本文件、`tasks/lessons.md` 和当前任务相关源码/测试；你的交付会被 Claude 复审。

## 工作原则

- 少问多做：低风险歧义先说明假设并推进；只有缺失信息会改变方案或带来真实风险时才提窄问题。
- 只做达成目标必需的改动，不加无关功能、顺手重构或风格迁移。
- 工作区可能已有用户或其它代理改动；不得回退、覆盖、格式化无关改动，必须和相关脏改共存。
- 未证明功能可正常运行前，不得标记完成；失败、跳过和未验证项必须如实记录。
- 多步任务首次调用工具前，先用 1-2 句说明要做什么；匹配本地技能或项目文档时，先读对应说明并声明使用原因。
- 复杂任务优先把调研、定位、并行分析、证据收集交给只读子代理；主线程负责决策、改代码、集成验证和用户沟通。无法调用子代理时，用 `rg`、`npm run codex:map`、`npm run codex:find -- "<关键词>"` 控制上下文。

## 计划与任务记录

- 非简单任务必须先在 `tasks/todo.md` 顶部写计划。凡 3 步以上、涉及架构判断、关键路径、UI/浏览器验证、发布或安全边界，都算非简单。
- 计划最少包含：`需求规格`、可勾选 `执行计划`、`高层操作摘要`、`验证记录`、`结果复盘`。验证必须是计划的一部分。
- 缺陷或结构性任务还要写清根因判断、影响文件、热修 vs 结构性修复取舍和验证方式。
- 开发前先校验计划范围；执行偏离时停下更新计划再继续。执行中及时勾选和记录摘要，不要最后一次性补状态。
- 收到用户修正、发现重复失误或沉淀出可复用规则时，更新 `tasks/lessons.md`；后续任务启动时先回顾相关教训。
- 大量抓包、调研或验证细节放到 `tasks/` 下独立笔记，`tasks/todo.md` 只保留结论、路径和风险。

## Debug-First 与结构性修复

- 让错误清晰暴露：保留异常、日志和失败测试，不用静默兜底、假成功、mock 成功路径掩盖问题。
- 修 bug 先追根因。优先删除冗余配置、死分支和多余闸门；不要在旧绕路上再加新绕路。
- 避免第二套实现、第二事实源、平行校验/权限逻辑、宽泛 `try/catch` 吞错、隐藏默认值和会掩盖坏数据的 fallback。
- 若确需兜底或边界保护，必须说明触发条件、风险、可关闭方式，并写入任务记录。
- 触及重复业务逻辑、多事实源、共享校验/权限/路由/缓存、API 合同、schema、跨模块状态同步、反复 bug、测试不稳定、安全授权、policy token、shopId、真实投放或数据完整性边界时，按结构性问题处理：先找应成立的不变量，让代码在一个地方表达它，再移除过时逻辑。

## 项目事实源

- `src/` 是源码事实来源。根目录 `阿里妈妈多合一助手.js`、`dist/packages/`、`dist/extension/` 是构建产物，不手工维护。
- 入口与注入在 `src/entries/`、公共前置能力在 `src/shared/`、主助手在 `src/main-assistant/`、算法护航与建计划链路在 `src/optimizer/`、授权服务在 `services/license-server/`。
- 测试在 `tests/`，构建和 Codex 辅助脚本在 `scripts/`，长期说明在 `docs/`，任务记录和临时证据在 `tasks/`。更多定位见 `docs/源码结构速查.md`。
- 只改必要文件；需要同步产物时运行构建脚本，不直接编辑生成文件。

## 验证硬规则

- 验证顺序：相关单测 -> 语法/类型/静态检查 -> 构建检查 -> 最小烟测 -> 浏览器或真实链路验收。
- 常用命令优先走 `package.json`：`npm run build`、`npm run build:check`、`npm run check:syntax`、`npm run test`、`npm run review`、`npm run codex:changed`。
- 测试沿用 `node:test` 和 `node:assert/strict`；后端或长跑测试必须设置 60 秒内的硬超时。关键路径改动必须补充或更新测试，尤其是 Hook、fetch/XHR 拦截、配置同步、持久化、跨页面缓存、请求载荷、计划创建/复制/修复、商品绑定、UI 状态、弹窗编辑、矩阵维度、extension 注入、MV3 manifest、content/page/background 桥接、授权识别、policy token、license server、下载解析、报表查询、人群看板、万能查数。
- 无法运行某项验证时，说明原因和替代检查；不要用“应该可以”代替证据。
- 完成前做 diff 自审，重点检查症状补丁、重复逻辑、隐藏 fallback、吞错、第二事实源、弱测试、死代码、安全回退和未说明的行为变化。

## UI 与真实页面边界

- UI 任务开始前必须读 `docs/插件UI统一设计规范.md` 和 `docs/图标设计规范.md`，并在计划里写明是否按统一规范落地。
- 运行态 UI 复用 `--am26-*` token、共享 `renderAmIcon()` / `renderAmWindowIcon()`、`am-` 前缀类名或 ID；不新增独立主题系统，不用 emoji、私有字体字符或 1024 iconfont 大路径冒充功能图标。
- 后台工具界面保持高密度、浅玻璃、低噪声；状态必须覆盖 loading/success/warn/error/empty/retry，交互控件必须有可见 focus 和必要 `aria`。
- 涉及 UI、注入、extension、userscript、阿里妈妈页面运行态或真实页面行为的改动，必须用 Chrome DevTools MCP 在真实 `one.alimama.com` 页面执行实际操作验证；启动浏览器或服务不算证据。把页面、操作、可见状态、控制台/网络异常和结论写入 `tasks/todo.md`。
- 验证前先确认运行态刷新；extension 改动需重载 unpacked extension 后再刷新页面。`chrome-devtools` 异常时先运行 `bash scripts/recover-chrome-devtools-mcp.sh`。
- 不点击会真实创建、投放、提交、删除或扣费的入口，除非用户明确授权；提交链路摸排必须先证明阻断、离线或拦截保护有效。

## 代码与安全

- 使用 4 空格缩进、分号、`const`/`let`，避免 `var`。函数保持短、嵌套浅、参数少；优先早返回和命名常量。
- 注释只解释意图、约束、协议或兼容性原因，不复述代码。
- 不破坏 userscript 双 IIFE 启动结构和桥接协议。谨慎处理全局/桥接键：`__AM_HOOK_MANAGER__`、`__ALIMAMA_OPTIMIZER_TOGGLE__`、`__AM_WXT_*`、`__AM_*__`。
- 版本号统一从 `GM_info` 或 `GM.info` 读取，不在 UI 逻辑里硬编码。
- 模块拆分按功能边界落在 `src/`，避免跨文件重复定义平台能力。
- 不提交密钥、Cookie、店铺敏感信息或用户数据；`.keys/` 等本地敏感目录不得纳入改动。
- 不通过直接修改发布包或生成产物绕过源码问题；不降低授权、签名、policy token、shopId 校验或桥接白名单安全性。

## 发布与交付

- `node scripts/build.mjs` 生成根 userscript、`dist/packages/alimama-helper-pro.user.js`、`dist/packages/alimama-helper-pro.meta.js` 和 `dist/extension/`；`node scripts/build.mjs --check` 校验源码与产物同步。
- 打标签发布前同步 `@version`、`README.md` 和更新记录，参考 `other/RELEASE.md` 与 `.github/workflows/`。
- 提交主题保持简短、结果导向；每个提交只解决一个逻辑问题。PR 说明包含变更摘要、风险/回滚说明和实际运行命令；UI 改动附截图、GIF 或真实页面验证记录。
- 最终回复只报告关键改动、验证结果、未验证风险和必要后续动作。
