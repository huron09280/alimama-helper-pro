# 阿里妈妈多合一助手 - 回归验收清单（扩展 + UserScript）

适用版本：`v5.26`


## 0. 快速自动化检查（新增）

1. 语法与关键接口检查：

- `node --check "阿里妈妈多合一助手.js"`
- `node --test tests/logger-api.test.mjs`

1. 预期：

- 脚本语法检查通过
- 主助手 Logger 至少包含 `log/info/warn/error` 方法，避免运行期调用未定义方法

## 1. 构建与产物

1. 本地执行：

- `npm ci`
- `npm run verify`

1. 预期产物存在：

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

1. Firefox 临时加载 `dist/extension/firefox`：

- 核心功能可运行（首版允许少量高级功能降级）

1. Tampermonkey 安装 `dist/userscript/alimama-helper-pro.user.js`：

- 右侧显示主助手悬浮球
- 面板可展开与收起

## 3. 核心功能回归

1. 指标计算：

- 询单成本、加购成本、潜客占比、花费占比、预算进度正常显示
- 计划 ID 识别：页面中的计划 ID 后应出现查数图标
- 查数入口连通性：点击查数图标可正确唤起万象/内置查数窗口

1. 排序行为：

- 开启“花费排序”后首次自动降序
- 切换 Tab 后自动重新降序
- 路由变化后重置并重新降序
- 多表格场景仅命中当前可见且结构匹配表格

1. 下载捕获：

- 出现下载弹窗
- 可复制链接
- 可打开直连下载

1. 算法护航：

- 点击入口后主面板自动最小化
- 护航面板可展开/最小化/居中/最大化
- 刷新图标比例正常，悬浮反馈灵敏
- 执行完成后有成功/失败统计，日志区域高度自适应配置区

## 4. 安全与稳定性

1. 日志与动态内容：

- 文本展示不执行脚本注入内容

1. 下载外链：

- 包含 `rel="noopener noreferrer"`
- 非法协议链接不应生成可点击按钮

1. 高频变更稳定性：

- 快速切换筛选/Tab/路由无重复初始化风暴
- 页面无明显卡顿

## 5. 持久化与版本

1. 配置持久化：

- 刷新后开关状态保留

1. 旧配置迁移：

- 预置 `AM_HELPER_CONFIG_V5_15` 后可迁移到 `AM_HELPER_CONFIG`

1. 版本显示：

- UI 版本号与脚本头 `@version` 一致（由 `GM_info.script.version` 动态读取）

## 6. 自动发布验收

1. 在 GitHub 设置 Secrets 后推送 `vX.Y.Z` tag
2. 预期 `release.yml` 完成：

- 创建 GitHub Release 并上传 5 个资产
- Chrome 发布任务执行
- Edge 发布任务执行
- Firefox 提交任务执行

1. 任一渠道失败不阻断其他渠道任务

## 7. 并行渠道更新验收

1. 安装 Release 渠道 UserScript 后等待更新检查
2. 更新到新 tag 后，Tampermonkey 可检测到新版本
3. `@updateURL` 与 `@downloadURL` 指向 `releases/latest/download/*`
