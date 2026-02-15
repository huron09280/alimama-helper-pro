# 阿里妈妈多合一助手 (Pro版)

[![Version](https://img.shields.io/github/v/release/huron09280/alimama-helper-pro?sort=semver&label=version)](https://github.com/huron09280/alimama-helper-pro/releases/latest)

阿里妈妈投放平台增强工具，当前仓库以 **Tampermonkey 用户脚本** 为主，发布产物为 `.user.js` 与 `.meta.js`。

## 快速安装（推荐）

1. 安装 Tampermonkey 扩展。  
2. 打开发布脚本链接安装：  
`https://github.com/huron09280/alimama-helper-pro/releases/latest/download/alimama-helper-pro.user.js`
3. 保持脚本启用，访问阿里妈妈页面即可生效。

更新元信息地址（用于自动更新检查）：
`https://github.com/huron09280/alimama-helper-pro/releases/latest/download/alimama-helper-pro.meta.js`

## 核心功能

- 实时指标增强：询单成本、加购成本、潜客占比、花费占比、预算进度
- 智能识别：自动扫描计划 ID，注入「万能查数」快捷图标
- 主面板三入口：算法护航、万能查数、辅助显示
- 交互增强：自动按花费排序、Tab 切换重排、弹窗速闭
- 下载增强：报表直连捕获、复制与一键下载
- 日志系统：按日期分组、可折叠、可清空、自动高度适配

## 更新日志（最近）

### v5.30 (2026-02-15)
- 新增代码检查团队机制：引入 `CODE_REVIEW_TEAM.md` 与 PR 检查清单
- 新增一键审查脚本：`bash scripts/review-team.sh`
- CI/Release 统一接入团队检查脚本，避免规则分叉
- 新增 `.github/CODEOWNERS`，自动分配审查责任

### v5.29 (2026-02-15)
- 主面板工具区重构：新增「辅助显示」入口，与「算法护航」「万能查数」形成三入口布局
- 辅助显示体验优化：开关区改为主面板内联展开/收起，加入过渡动画并默认收起
- 配置版本化迁移：新增 `configRevision`，升级时自动修正默认配置并持久化
- 默认行为修订：日志区默认折叠，首次打开更聚焦核心操作区
- 冒烟与回归增强：补充辅助显示与配置迁移相关检查，新增本地烟测页 `dev/smoke-harness.html`

### v5.28 (2026-02-15)
- 万能查数弹窗头部全量重构，统一品牌头图与文案
- 弹窗首屏体验优化，减少初次展示闪现
- 样式规则改为动态选择器，兼容动态 `mx_*` 节点
- 快捷查数文案升级为“计划名：{对应计划名}”，并修复计划名识别噪音
- 新增开发加载器脚本 `dev/dev-loader.user.js`，支持本地自动加载执行

## 项目结构（当前仓库）

```text
阿里妈妈多合一助手.js                     # 主 UserScript（主助手 + 算法护航）
dev/dev-loader.user.js                    # 本地开发加载器（刷新即生效）
dev/smoke-harness.html                    # 本地烟测页面
tests/logger-api.test.mjs                 # 关键 API 回归测试
scripts/review-team.sh                    # 团队自动化检查入口
.github/workflows/ci.yml                  # CI 检查
.github/workflows/release.yml             # Tag 发布流程
.github/pull_request_template.md          # PR 团队检查清单
.github/CODEOWNERS                        # 审查责任人自动分配
CODE_REVIEW_TEAM.md                       # 代码检查团队职责说明
README.md                               # 项目说明
PROJECT_RULES.md                        # 工程规则
SMOKE_TEST_CHECKLIST.md                 # 回归验收清单
KNOWLEDGE.md                            # 架构与实现知识库
RELEASE.md                              # 发布说明
```

## 本地开发与联调

```bash
node --check "阿里妈妈多合一助手.js"
node --test tests/logger-api.test.mjs
```

建议配合 Tampermonkey 加载脚本后，在阿里妈妈页面执行手工回归（见 `SMOKE_TEST_CHECKLIST.md`）。

## 代码检查团队（Review Team）

仓库内置“5 角色检查团队”机制（架构、安全、测试、UI/交互、发布），用于统一代码审查口径。

```bash
bash scripts/review-team.sh
```

- 团队职责说明：`CODE_REVIEW_TEAM.md`
- PR 勾选清单：`.github/pull_request_template.md`

### 刷新即生效（Dev Loader）

如果你不想每次复制粘贴脚本到 Tampermonkey，可以用仓库自带开发加载器：

1. 在项目根目录启动本地静态服务：

```bash
python3 -m http.server 5173
```

2. 打开 Tampermonkey，创建新脚本，把 `dev/dev-loader.user.js` 的内容完整粘贴进去并保存。
3. 禁用线上版脚本（`阿里妈妈多合一助手 (Pro版)`），只保留 `Dev Loader` 启用，避免重复执行。
4. 之后你每次修改 `阿里妈妈多合一助手.js`，只需刷新阿里妈妈页面即可加载最新代码。

说明：
- Dev Loader 默认从 `http://127.0.0.1:5173/阿里妈妈多合一助手.js` 拉取脚本，并附加时间戳避免缓存。
- 若端口不同，改 `dev/dev-loader.user.js` 里的 `DEV_ENTRY_URL` 即可。

### 本地烟测页

如需在无业务环境下做基础验证，可打开 `dev/smoke-harness.html`，用于检查：
- 计划 ID 识别与快捷入口注入
- 基础 UI 结构与脚本加载是否正常

## 发布流程（维护者）

1. 确认脚本头 `@version` 与更新日志一致。  
2. 本地检查：
```bash
node --check "阿里妈妈多合一助手.js"
node --test tests/logger-api.test.mjs
```
3. 推送代码并打 tag：
```bash
git tag vX.YY
git push origin vX.YY
```
4. `release.yml` 会自动创建 GitHub Release 并上传：
- `alimama-helper-pro.user.js`
- `alimama-helper-pro.meta.js`

## 兼容性

- Chrome / Edge：首发功能完整
- Firefox：首版以“核心功能可用”为目标，允许少量高级行为后续补齐

## 说明与排错

- 若版本号显示不一致，优先检查脚本头 `@version`、脚本内更新日志、README 最近更新三处是否同步。
- 若 Tampermonkey 未提示更新，手动打开 `.meta.js` 地址触发更新检查。
- 若页面未生效，先确认脚本匹配域名是否命中、是否与旧版脚本重复启用。
