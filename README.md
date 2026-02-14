# 阿里妈妈多合一助手 (Pro版)

[![Version](https://img.shields.io/badge/version-5.26-blue.svg)](./阿里妈妈多合一助手.js)

阿里妈妈投放平台增强工具，当前仓库以 **Tampermonkey 用户脚本** 为主。

## 功能概览

- 实时指标增强：询单成本、加购成本、潜客占比、花费占比、预算进度
- 智能识别：自动扫描计划 ID，注入「万能查数」快捷图标
- UI/UX：iPhone 级圆角 (18px)、磨砂玻璃质感、标准化 SVG 图标、沉浸式交互
- 交互增强：自动按花费排序、Tab 切换重排、弹窗速闭、面板最大化/居中
- 下载增强：报表直连捕获、复制与一键下载
- 算法护航：主面板一键调起，支持 API 级深度诊断与优化
- 日志系统：按日期分组、可折叠、可清空、自动高度适配

## 安装方式（推荐顺序）

### 1. 浏览器扩展（推荐）

- Chrome 商店：待补充上架链接
- Edge Add-ons：待补充上架链接
- Firefox Add-ons：待补充上架链接

安装一次后，后续版本由浏览器通过商店自动更新。

### 2. Tampermonkey（并行渠道）

- 安装链接（Release 资产）：
  - `https://github.com/huron09280/alimama-helper-pro/releases/latest/download/alimama-helper-pro.user.js`
- 更新元信息：
  - `https://github.com/huron09280/alimama-helper-pro/releases/latest/download/alimama-helper-pro.meta.js`

脚本内已包含 `@downloadURL` / `@updateURL`，可自动提示更新。

## 项目结构（当前仓库）

```text
阿里妈妈多合一助手.js                     # 主 UserScript（主助手 + 算法护航）
README.md                               # 项目说明
PROJECT_RULES.md                        # 工程规则
SMOKE_TEST_CHECKLIST.md                 # 回归验收清单
KNOWLEDGE.md                            # 架构与实现知识库
RELEASE.md                              # 发布说明
```

## 本地开发

```bash
node --check "阿里妈妈多合一助手.js"
```

建议配合 Tampermonkey 加载脚本后，在阿里妈妈页面执行手工回归（见 `SMOKE_TEST_CHECKLIST.md`）。

## 兼容策略

- Chrome / Edge：首发功能完整
- Firefox：首版以“核心功能可用”为目标，允许少量高级行为后续补齐

## 说明

- 当前仓库存在历史用户脚本文件与文档，迁移到扩展形态时保持核心逻辑一致，避免业务行为回归。
- 若商店 API 密钥缺失，对应发布任务会失败，但不阻断其他商店渠道。
