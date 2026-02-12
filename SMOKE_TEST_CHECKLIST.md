# 阿里妈妈多合一助手 - 回归验收清单（扩展 + UserScript）

适用版本：`v5.24.0`

## 1. 构建与产物

1. 本地执行：
- `npm ci`
- `npm run verify`

2. 预期产物存在：
- `dist/extension/chrome/manifest.json`
- `dist/extension/firefox/manifest.json`
- `dist/userscript/alimama-helper-pro.user.js`
- `dist/userscript/alimama-helper-pro.meta.js`
- `dist/packages/alimama-helper-pro-chrome.zip`
- `dist/packages/alimama-helper-pro-edge.zip`
- `dist/packages/alimama-helper-pro-firefox.xpi`
- `dist/packages/alimama-helper-pro.crx`

## 2. 安装与加载

1. Chrome/Edge 临时加载 `dist/extension/chrome`：
- 打开阿里妈妈页面后出现悬浮入口
- 点击后主面板可打开

2. Firefox 临时加载 `dist/extension/firefox`：
- 核心功能可运行（首版允许少量高级功能降级）

3. Tampermonkey 安装 `dist/userscript/alimama-helper-pro.user.js`：
- 右侧显示主助手悬浮球
- 面板可展开与收起

## 3. 核心功能回归

1. 指标计算：
- 询单成本、加购成本、潜客占比、花费占比、预算进度正常显示

2. 排序行为：
- 开启“花费排序”后首次自动降序
- 切换 Tab 后自动重新降序
- 路由变化后重置并重新降序
- 多表格场景仅命中当前可见且结构匹配表格

3. 下载捕获：
- 出现下载弹窗
- 可复制链接
- 可打开直连下载

4. 算法护航：
- 点击入口后主面板自动最小化
- 护航面板可打开并执行
- 执行完成后有成功/失败统计

## 4. 安全与稳定性

1. 日志与动态内容：
- 文本展示不执行脚本注入内容

2. 下载外链：
- 包含 `rel="noopener noreferrer"`
- 非法协议链接不应生成可点击按钮

3. 高频变更稳定性：
- 快速切换筛选/Tab/路由无重复初始化风暴
- 页面无明显卡顿

## 5. 持久化与版本

1. 配置持久化：
- 刷新后开关状态保留

2. 旧配置迁移：
- 预置 `AM_HELPER_CONFIG_V5_15` 后可迁移到 `AM_HELPER_CONFIG`

3. 版本显示：
- UI 版本号与 `package.json` 一致（通过构建注入）

## 6. 自动发布验收

1. 在 GitHub 设置 Secrets 后推送 `vX.Y.Z` tag
2. 预期 `release.yml` 完成：
- 创建 GitHub Release 并上传 5 个资产
- Chrome 发布任务执行
- Edge 发布任务执行
- Firefox 提交任务执行
3. 任一渠道失败不阻断其他渠道任务

## 7. 并行渠道更新验收

1. 安装 Release 渠道 UserScript 后等待更新检查
2. 更新到新 tag 后，Tampermonkey 可检测到新版本
3. `@updateURL` 与 `@downloadURL` 指向 `releases/latest/download/*`
