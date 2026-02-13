# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个运行在 Tampermonkey/Greasemonkey 的阿里妈妈增强脚本。

- **当前版本**: `v5.26`
- **主文件**: `阿里妈妈多合一助手.js`
- **架构**: 双 IIFE（主助手 + 算法护航）

## 核心功能

1. 表格增强计算

- 询单成本、加购成本、潜客占比、花费占比
- 预算进度（支持基础预算与多目标预算分类显示）
- 计划 ID 智能识别（自动注入快捷查数入口）
- UI 极致精装修（18px 圆角、磨砂玻璃、SVG 图标标准化）

1. 交互与自动化

- 主助手面板开关与状态持久化
- 自动花费降序排序（Tab/页面切换后自动重置状态）
- 多表格上下文识别（优先可见且列结构匹配的目标表）
- 弹窗自动关闭
- 报表下载直连捕获与复制
- 算法护航入口（调用 `window.__ALIMAMA_OPTIMIZER_TOGGLE__`）

1. 算法护航（API）

- 扫描页面计划
- 获取 token（dynamicToken/loginPointId/csrfID）
- 调用 `chat/talk.json` 获取建议
- 调用 `escort/open.json` 执行护航方案

## 关键技术点

### 1) 配置存储

- 主助手配置 key：`AM_HELPER_CONFIG`
- 启动时兼容迁移旧 key：
  - `AM_HELPER_CONFIG_V5_15`
  - `AM_HELPER_CONFIG_V5_14`
  - `AM_HELPER_CONFIG_V5_13`

### 2) 统一网络 Hook

脚本通过全局 Hook 管理器只注入一次网络 patch：

- `window.__AM_HOOK_MANAGER__`
- `window.__AM_HOOKS_INSTALLED__`

统一接管：

- `window.fetch`
- `XMLHttpRequest.prototype.open/send`

并向不同模块派发事件（下载拦截、Token 捕获）。

### 3) 安全策略

- 日志与下载弹窗动态内容优先使用 `textContent` + DOM API
- 下载 URL 通过 `sanitizeUrl` 限制为 `http/https`
- 下载外链使用 `rel="noopener noreferrer"`

### 4) 性能策略

- `MutationObserver` + 延迟触发计算
- 列索引缓存
- 响应解析门槛（按 content-type / content-length / responseType）
- 护航并发限制执行器 `Utils.concurrentLimit`

## 调试建议

1. 打开控制台查看日志：

- 主助手日志前缀：`[AM]`
- 护航日志前缀：`[EscortAPI]`

1. 重置主助手配置：

```js
localStorage.removeItem('AM_HELPER_CONFIG')
```

1. 检查护航配置：

```js
GM_getValue('config')
```

## 修改注意事项

1. **版本显示不要硬编码**

- 所有 UI 版本号使用 `GM_info.script.version`（保留 fallback）

1. **保持双 IIFE 架构**

- 不要破坏 `window.__ALIMAMA_OPTIMIZER_TOGGLE__` 的对外行为

1. **网络 Hook 必须幂等**

- 通过统一 Hook 管理器注册监听，不要重复 patch 原型链

1. **变更 UI 时保持项目规则**

- 参考 `PROJECT_RULES.md` 的 z-index、自动最小化、日志分组等约束
