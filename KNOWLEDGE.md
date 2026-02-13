# 阿里妈妈多合一助手 - 技术知识库 (Knowledge Base)

本文档记录当前 `v5.26` 版本的关键实现，供维护和扩展时快速对齐。

## 1. 项目架构 (Architecture)

项目由两个 IIFE 组成：

- **IIFE 1: 主助手模块**：表格增强计算、主面板 UI、日志系统、报表下载拦截。
- **IIFE 2: 算法护航模块**：计划扫描、Token 获取、AI 诊断与护航方案提交。

模块间通信保持不变：通过 `window.__ALIMAMA_OPTIMIZER_TOGGLE__` 由主面板唤起护航面板。

## 2. 统一 Hook 机制 (Network Hooking)

为避免双模块重复 monkey patch，脚本通过全局 Hook 管理器统一注入：

- 全局对象：`window.__AM_HOOK_MANAGER__`
- 幂等标记：`window.__AM_HOOKS_INSTALLED__`
- 统一 patch：一次性接管 `window.fetch` 与 `XMLHttpRequest.prototype.open/send`
- 分发能力：按事件将数据派发给下载拦截与 Token 捕获逻辑

这保证了两个 IIFE 共存时不会出现链式重复包裹。

## 3. 配置与状态 (State)

主助手配置存储在 `localStorage`：

- 当前 key：`AM_HELPER_CONFIG`
- 兼容迁移：启动时自动读取旧 key（`AM_HELPER_CONFIG_V5_15`、`AM_HELPER_CONFIG_V5_14`、`AM_HELPER_CONFIG_V5_13`）并迁移到新 key

护航配置通过油猴 API 保存：

- `GM_getValue('config')`
- `GM_setValue('config', userConfig)`

## 4. 核心 API 流程 (Escort API Flow)

护航模块主要调用：

1. `POST https://ai.alimama.com/ai/chat/talk.json`
2. `POST https://ai.alimama.com/ai/escort/open.json`

请求支持：

- 超时控制（AbortController）
- 失败重试
- SSE/JSON 兼容解析
- 并发限制（`Utils.concurrentLimit`）

## 5. 安全与性能策略 (Security & Performance)

### 5.1 DOM 安全

- 日志与下载弹窗的动态内容使用 `textContent` 与 DOM API 组装，避免未转义 `innerHTML` 注入。
- 下载链接通过 `sanitizeUrl(url)` 严格限制为 `http/https` 协议。
- 外链统一设置 `rel="noopener noreferrer"`。

### 5.2 解析门槛

下载拦截仅在以下条件满足时解析响应体：

- `content-type` 属于文本/JSON 类可解析内容
- `content-length` 未超过 1MB（默认阈值）
- `XHR.responseType` 为文本类型

超限或类型不匹配会跳过解析，并仅输出一次 debug 提示，减少页面卡顿。

## 6. 版本同步机制 (Version Sync)

两个 IIFE 均通过以下方式读取版本，避免硬编码漂移：

```js
const CURRENT_VERSION = typeof GM_info !== 'undefined'
  ? GM_info.script.version
  : '5.26';
```

主面板、护航面板与启动日志均引用该值进行展示。

## 7. 多表格上下文选择与排序稳定性

主助手模块新增表格上下文选择策略，用于在复杂页面中准确命中目标报表：

- 通过 `resolveTableContext()` 汇总候选表格，按“可见性 + 列能力评分 + 行列规模”排序择优。
- `getTableHeaders()` / `resolveStickyHeaderWrapper()` 适配 Sticky Table 双表头结构，避免表头错位。
- 花费排序按钮通过 `resolveChargeHeader(table)` 进行作用域内定位，降低跨区域误触发。
- URL 变化重置增加短间隔节流，首次执行增加去重，减少高频 DOM 变更下的重复计算。

## 8. 计划 ID 识别与快捷入口 (Campaign ID Discovery)

`v5.26` 引入了 `CampaignIdQuickEntry` 模块，极大提升了查数效率：

- **自动化扫描**：使用高效的选择器扫描页面中的计划名称、ID 文本。
- **智能注入**：在识别出的 ID 后动态注入「万能查数」SVG 图标。
- **原生回退机制**：点击图标优先尝试唤起页面原生的查数组件；若失败，则平滑降级至内置的 iframe 万能查数。

## 9. 界面标准规范 (UI/UX Standards)

为达成 Premium 视觉感，项目遵循以下硬性标准：

- **圆角体系**：外层容器统一使用 `18px`，内容卡片 `12px`，交互组件 `10px`。
- **视觉风格**：全量使用 `backdrop-filter: blur(16px)` 实现磨砂玻璃质感，配合 `rgba` 柔和边框。
- **图标标准**：摒弃 Unicode 字符，全量切换为标准化补齐比重的 SVG 矢量图标。
- **响应式布局**：算法护航面板支持自适应高度计算，确保在日志展开时不会遮挡下方的配置控制区。
