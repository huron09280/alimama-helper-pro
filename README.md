# 阿里妈妈多合一助手 (Pro版)

[![Version](https://img.shields.io/badge/version-5.24.0-blue.svg)](./package.json)
[![Build](https://img.shields.io/badge/build-GitHub_Actions-black.svg)](./.github/workflows/ci.yml)

阿里妈妈投放平台增强工具，现支持两种交付形态：

- 浏览器扩展（Chrome / Edge / Firefox）
- Tampermonkey 用户脚本（并行维护）

本仓库以 GitHub 为唯一源码，自动发布流程为：

`GitHub Tag -> GitHub Actions -> 商店发布 -> 浏览器自动更新`

## 功能概览

- 实时指标增强：询单成本、加购成本、潜客占比、花费占比、预算进度
- 交互增强：自动按花费排序、Tab 切换重排、弹窗速闭
- 下载增强：报表直链捕获、复制与一键下载
- 算法护航：主面板一键调起，保留 `window.__ALIMAMA_OPTIMIZER_TOGGLE__`
- 日志系统：按日期分组、可折叠、可清空

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

## 项目结构

```text
src/
  core/alimama-helper-core.js          # 核心业务逻辑（无 userscript 头）
  platform/gm-shim.js                  # 扩展环境下 GM 兼容层
  userscript/header.template.txt       # userscript 头模板
extension/
  common/content-injector.js           # 内容注入器（页面上下文）
  common/icons/                        # 扩展图标（沿用悬浮球风格）
  chrome/manifest.json                 # Chromium 模板清单
  firefox/manifest.json                # Firefox 模板清单
build/
  build.mjs                            # 生成 dist/extension + dist/userscript
  package.mjs                          # 生成 zip/xpi/release 资产
  check-syntax.mjs                     # 语法检查
scripts/
  publish-chrome.mjs                   # Chrome 商店发布
  publish-edge.mjs                     # Edge 商店发布
  publish-firefox.mjs                  # Firefox 商店发布
.github/workflows/
  ci.yml
  release.yml
```

## 本地开发

```bash
npm ci
npm run check:syntax
npm run build
npm run package
```

构建产物：

- `dist/extension/chrome`
- `dist/extension/firefox`
- `dist/userscript/alimama-helper-pro.user.js`
- `dist/userscript/alimama-helper-pro.meta.js`
- `dist/packages/*`
- 其中包含 `alimama-helper-pro.crx`（用于本地分发安装）

## 版本规则

- 单一版本源：`package.json#version`
- 构建时注入：`__AM_VERSION__`
- 发布触发：推送 tag `vX.Y.Z`

## 兼容策略

- Chrome / Edge：首发功能完整
- Firefox：首版以“核心功能可用”为目标，允许少量高级行为后续补齐

## 说明

- 当前仓库存在历史用户脚本文件与文档，迁移到扩展形态时保持核心逻辑一致，避免业务行为回归。
- 若商店 API 密钥缺失，对应发布任务会失败，但不阻断其他商店渠道。
