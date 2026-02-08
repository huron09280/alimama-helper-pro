# 阿里妈妈多合一助手 - 技术知识库 (Knowledge Base)

本文档记录了本项目的核心技术实现、业务逻辑与 API 交互流程，作为未来开发与维护的深度参考。

## 1. 项目架构 (Architecture)

本项目由两个主要的 IIFE（立即调用函数表达式）组成，分别负责不同的核心功能：

- **IIFE 1: 助手主模块 (Main Helper)**：负责表格增强（加购成本、消耗占比）、日志系统、UI 基础框架及数据抓取拦截。
- **IIFE 2: 算法护航模块 (Escort Module)**：集成自 `alimama-auto-optimizer`，专门负责针对特定计划的 AI 诊断与护航建议提交。

两个模块通过 `window.__ALIMAMA_OPTIMIZER_TOGGLE__` 全局函数进行通信。

## 2. 身份验证与令牌 (Authentication & Tokens)

脚本通过三种方式动态获取阿里妈妈 API 所需的令牌：

- **XHR Hook**：拦截页面自身的 API 请求，从中提取 `dynamicToken` 和 `loginPointId`。
- **全局搜索 (Deep Search)**：在 `window` 对象下的 `g_config`, `PageConfig`, `mm`, `__magix_data__` 等知名变量中深度遍历查找。
- **Magix Vframe 提取**：遍历 `window.Magix.Vframe.all()`，从各视图的 `accessInfo` 中获取最新的 `csrfID` 和令牌。

**关键令牌：**
- `dynamicToken`: API 请求必传参数。
- `loginPointId`: 身份标识。
- `_tb_token_ (csrfID)`: 从 Cookie 或 Magix 获取，用于防御 CSRF。

## 3. 核心 API 流程 (API Flow)

### 3.1 诊断与对话 (Chat/Talk)

* **Endpoint**: `ai.alimama.com/ai/chat/talk.json`
- **Method**: POST
- **Payload**: 包含 `bizCode: "universalBP"` 和 `customPrompt`。
- **响应格式**: SSE (Server-Sent Events) 流。
- **解析逻辑**: 脚本实现了 `_parseSSEChuncks`，逐块解析 JSON 数据，从中提取 `actionList`（改进建议列表）。

### 3.2 方案开启 (Escort Open)

* **Endpoint**: `ai.alimama.com/ai/escort/open.json`
- **Method**: POST
- **功能**: 提交并确认执行 AI 建议的方案。

## 4. UI 与交互逻辑 (UI & Interactions)

### 4.1 样式系统 (CSS)

* 采用动态注入 `<style>` 标签的方式。
- 整体风格为“灰色系 (Vibrant Grey)”，使用线性渐变（如 `#fafafa` 到 `#f5f5f5`）提升质感。

### 4.2 状态管理 (State Management)

* 核心配置通过 `localStorage` (以 `am-helper-state` 为键) 进行本地存储。
- 功能开关（如“询单成本”、“花费排序”）在刷新后依然保持用户之前的选择。

### 4.3 表格增强

* 使用 `MutationObserver` 监听 DOM 变化。
- 自动识别表格中的“基础预算”与“多目标预算”行，利用正则匹配数值并计算消耗占比。
- 解析逻辑考虑了数值中的千分位（如 `1,234.56`）。

## 5. 性能与安全性 (Optimization & Security)

### 5.1 并发控制

* `Utils.concurrentLimit`：限制同时进行的 API 请求数量（默认 3），防止由于并发过高导致触发阿里妈妈的 WAF 防护或请求超时。

### 5.2 容错机制

* **重试逻辑**: API 请求失败时支持自动指数级退避重试（最高 3 次）。
- **超时控制**: 默认 30 秒超时，使用 `AbortController` 强制终止挂起的请求。

### 5.3 防 XSS

* 所有的 UI 输出（特别是日志和提取的建议文本）均通过 `Utils.escapeHtml` 进行转义。

## 6. 版本同步机制 (Version Sync)

通过 `const CURRENT_VERSION = typeof GM_info !== 'undefined' ? GM_info.script.version : 'X.X';` 实现。
- 该变量在两个 IIFE 内部各声明一次。
- 全局 UI（主面板、护航面板、日志）通过该变量统一显示版本，确保版本一致性。
