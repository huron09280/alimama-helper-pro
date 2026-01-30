# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个针对阿里妈妈(Alimama)广告投放平台的浏览器用户脚本(UserScript),用于增强广告数据表格的计算功能和用户体验。

**当前版本:** v4.10

**核心功能:**
- 实时计算询单成本(花费/旺旺咨询量)
- 实时计算加购成本(花费/总购物车数)
- 实时计算潜客占比(引导访问潜客数/点击量)
- **实时计算花费占比**(单项花费/总花费)
- **实时显示预算进度**(花费/预算,带进度条)
- 自动关闭烦人的弹窗
- 拦截并提取报表直连下载链接

## 技术架构

### 脚本类型
- **Tampermonkey/Greasemonkey 用户脚本**
- 使用 `@match` 规则匹配 `*.alimama.com` 域名
- 依赖 `GM_setClipboard` 权限用于剪贴板操作

### 模块划分

1. **配置与状态管理** (行17-61)
   - 使用 `localStorage` 持久化配置(key: `AM_HELPER_CONFIG_V4_10`)
   - 支持的配置项: `panelOpen`, `showCost`, `showCartCost`, `showPercent`, `showCostRatio`, `showBudget`, `autoClose`, `logExpanded`
   - 兼容旧版配置读取(V4.8, V4.9)

2. **日志系统** (行63-120)
   - `Logger` 对象:控制台+UI面板双输出
   - DOM缓存优化(requestAnimationFrame批量更新)
   - 自动维护最近100条日志记录

3. **核心计算逻辑** (行122-347)
   - `Core` 对象:表格数据解析与计算
   - 关键方法:
     - `getTotalCost()`: 使用XPath从顶部统计区提取总花费
     - `parseValue()`: 从表格单元格提取数值(优化文本节点解析)
     - `renderTag()`: 在单元格内插入/更新计算结果标签(DOM复用优化)
     - `getColumnIndexMap()`: 动态识别表格列索引(带缓存)
     - `run()`: 主计算循环(包含5种计算)
   - 计算类型:
     1. 询单成本: 花费/旺旺咨询量
     2. 加购成本: 花费/购物车数
     3. 潜客占比: 引导访问潜客数/点击量
     4. 花费占比: 单项花费/总花费
     5. 预算进度: 花费/预算(带渐变进度条)

4. **UI界面构建** (行349-500)
   - 悬浮按钮(⚡图标) + 控制面板
   - 六个功能开关按钮(网格布局):询单成本、加购成本、潜客占比、花费占比、预算进度、弹窗速闭
   - 日志显示区域(支持折叠/展开)
   - 交互监听:集成在UI.bindEvents中,监听用户点击操作

5. **网络拦截器** (行502-603)
   - `Interceptor` 对象:劫持网络请求
   - 劫持 `window.fetch` 和 `XMLHttpRequest.prototype.send`
   - 递归扫描响应JSON中的文件URL
   - 正则匹配裸露的下载链接
   - 浮窗展示捕获的链接,支持直连下载和复制

### 运行机制

- **MutationObserver**: 监听DOM变化,800ms防抖后执行计算
- **轮询兜底**: 5秒间隔定时器确保数据更新
- **列识别动态化**: 通过表头文本特征(如"花费"、"旺旺咨询量"等)自适应列索引
- **性能优化**:
  - XPath快速定位总花费元素
  - 列索引映射缓存(基于Header签名)
  - DOM节点复用(标签更新而非重建)
  - requestAnimationFrame批量日志更新

## 开发指南

### 修改计算逻辑

在 `Core` 对象中修改:

1. **新增指标**: 在 `getColumnIndexMap()` 添加列识别规则(行192-214)
2. **修改计算公式**: 在 `Core.run()` 的对应计算块修改(行216-346)
3. **样式调整**: 修改 `CONSTANTS.STYLES` 常量(行22-28)
4. **新增计算类型**:
   - 在 `Core.run()` 添加新的 `needXXX` 检查
   - 在配置项中添加对应的开关
   - 在UI中添加对应的按钮

### 调试技巧

- 打开浏览器控制台查看 `[AM]` 前缀的日志
- 点击助手面板的"运行日志"区域查看详细执行记录
- 使用 `localStorage.removeItem('AM_HELPER_CONFIG_V4_10')` 重置配置
- 使用 `localStorage.clear()` 清空所有本地存储

### 添加新关键词监听

修改 `UI.bindEvents()` 中的 `updateKeywords` 数组(行469),添加需要触发数据刷新的关键词。

### 修改匹配规则

表格列匹配逻辑在 `getColumnIndexMap()` 方法中(行192-214):
- 使用 `replace(/\s+/g, '')` 清洗表头文本(移除所有空格)
- 支持模糊匹配(`includes`),可根据需要改为正则精确匹配
- 自动生成Header签名用于缓存判断

## 常见问题

**Q: 为什么计算结果不显示?**
A: 检查配置开关是否开启(助手面板按钮状态),确认表格列名包含关键词。

**Q: 合计行数据计算错误?**
A: 脚本已包含合计行列索引偏移处理逻辑(行258-270),检查是否被其他脚本干扰。

**Q: 总花费获取不准确?**
A: `getTotalCost()` 使用XPath定位包含"花费(元)"的元素(行127-150),如果页面结构变化可能失效,需调整XPath表达式。

**Q: 如何更新版本号?**
A: 修改文件头部的 `@version` (第4行)和 `@name` 字段,同时更新 `CONSTANTS.STORAGE_KEY` (第21行)。

**Q: 预算进度条不显示?**
A: 确保"预算进度"开关已开启,且表格中包含"预算"列(不包含"建议"字样)。

**Q: 性能问题/页面卡顿?**
A: 脚本已做性能优化(800ms防抖+5秒轮询+DOM缓存),如仍有问题,可在控制台查看日志排查。

## 安全注意事项

- 脚本仅在 `alimama.com` 域名下运行
- 不收集或上传任何用户数据
- 所有配置存储在本地 localStorage
- 下载拦截器仅识别包含阿里云OSS特征的链接(`oss-accelerate`, `aliyuncs.com`, `download`)
- 不修改原有页面数据,仅插入计算标签

## 版本历史

**v4.10** (当前版本)
- ✨ 新增花费占比计算功能
- ✨ 新增预算进度显示(带渐变进度条)
- 🚀 优化总花费获取逻辑(使用XPath)
- 🚀 性能优化:列索引映射缓存、DOM节点复用、requestAnimationFrame
- 🐛 修复文本节点解析导致重复计算的问题
- 🔧 兼容旧版配置(V4.8, V4.9)

**v4.8**
- 基础计算功能:询单成本、加购成本、潜客占比
- 弹窗自动关闭
- 报表直连下载拦截
- UI控制面板

## 第三方资源

- **更新源**: Greasy Fork (https://greasyfork.org/zh-CN/scripts/560594)
- **依赖**: 无外部依赖,纯原生JavaScript实现
- **浏览器兼容**: Chrome/Edge/Firefox + Tampermonkey/Greasemonkey

## 技术栈

- **ES6+**: 箭头函数、const/let、模板字符串、解构赋值
- **DOM API**: MutationObserver、XPath、requestAnimationFrame
- **异步处理**: Promise(async/await用于fetch拦截)
- **存储**: localStorage(配置持久化)

## 开发建议

1. **添加新功能时**:
   - 先在 `CONSTANTS` 中定义样式和关键词
   - 在 `DEFAULT_CONFIG` 中添加默认配置
   - 在 `Core.getColumnIndexMap()` 中添加列识别
   - 在 `Core.run()` 中实现计算逻辑
   - 在UI中添加控制按钮

2. **性能优化原则**:
   - 避免频繁DOM操作(使用缓存、批量更新)
   - 减少不必要的计算(列索引缓存、条件判断)
   - 使用原生API(如 `.rows` 优于 `querySelectorAll`)

3. **调试方法**:
   - 利用Logger.log()输出关键信息
   - 使用浏览器调试器断点查看变量
   - 检查localStorage确认配置是否正确保存
