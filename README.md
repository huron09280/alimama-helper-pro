# 阿里妈妈多合一助手 (Pro版)

[![Version](https://img.shields.io/github/v/release/huron09280/alimama-helper-pro?sort=semver&label=version)](https://github.com/huron09280/alimama-helper-pro/releases/latest)

阿里妈妈投放平台增强工具，当前仓库采用“双产物过渡”模式：

- `src/` 是源码事实来源，按功能拆成多文件维护。
- 根目录 [`阿里妈妈多合一助手.js`](./阿里妈妈多合一助手.js) 仍保留为最终发布的 userscript 文件名，但改为构建产物。
- `dist/packages/` 产出 `.user.js` / `.meta.js`。
- `dist/extension/` 产出 Chrome / Edge 可直接“加载已解压扩展程序”的 MV3 插件目录。

## 安装方式

### Tampermonkey（推荐稳定版）

1. 安装 Tampermonkey 扩展。
2. 打开发布脚本链接安装：  
   `https://github.com/huron09280/alimama-helper-pro/releases/latest/download/alimama-helper-pro.user.js`
3. 保持脚本启用，访问阿里妈妈页面即可生效。

更新元信息地址：  
`https://github.com/huron09280/alimama-helper-pro/releases/latest/download/alimama-helper-pro.meta.js`

### Chrome / Edge 插件（解压加载）

1. 下载 release 中的 `alimama-helper-pro-extension.zip`，或本地执行 `node scripts/build.mjs`。
2. 打开浏览器扩展管理页，启用“开发者模式”。
3. 选择“加载已解压的扩展程序”，指向 `dist/extension/`。
4. 访问阿里妈妈页面，插件会自动注入页面增强能力。

## 核心功能

- 实时指标增强：询单成本、加购成本、潜客占比、花费占比、预算进度
- 智能识别：自动扫描计划 ID，注入「万能查数」快捷图标
- 主面板三入口：算法护航、万能查数、辅助显示
- 交互增强：自动按花费排序、Tab 切换重排、弹窗速闭
- 下载增强：报表直连捕获、复制与一键下载
- 日志系统：按日期分组、可折叠、可清空、自动高度适配
- 计划辅助：批量建计划 API、场景向导、并发开启与修复链路

## 更新日志（最近）

### v6.05 (2026-03-18)
- extension 清单增强：新增 MV3 `icons` 与 `action.default_icon`，补齐浏览器扩展图标声明
- 构建链路增强：build 阶段自动复制 `src/entries/extension-icons/*` 到 `dist/extension/`
- 构建门禁补齐：`--check` 增加 extension 图标文件存在性校验
- 回归测试补齐：新增 manifest 图标配置断言，防止后续回归

### v6.04 (2026-03-17)
- 开发入口标准化：新增零依赖 `package.json` 脚本入口，统一 `build/test/review/dev` 常用命令
- 构建装配维护性优化：抽出共享 runtime segments，减少 userscript 与 extension 拼接列表重复维护
- 仓库卫生门禁增强：`review-team` 新增 tracked `.DS_Store` 检查，阻止 macOS 噪音文件入库
- 回归测试补齐：新增 build segment 装配关系与 `review-team` 仓库卫生断言

### v6.03 (2026-03-16)
- 人群看板悬停性能修复：预构建指标索引，移除 `mousemove` 热路径全表扫描
- 周期查询链路修复：`base` 维度缺失 `queryExecutePlan` 时立即失败，不再等待额外维度请求
- 回归测试补齐：新增悬停缓存与 `base` 快速失败断言

## 项目结构

详细目录说明和“改什么去哪里改”的速查入口见：

- [`docs/源码结构速查.md`](./docs/源码结构速查.md)

```text
src/
  entries/                         # userscript / extension 入口
  shared/                          # 版本解析、公共前置、平台兼容层
  main-assistant/                  # 主面板、指标增强、下载拦截、万能查数、快捷入口
  optimizer/                       # 算法护航、Token、API、KeywordPlanApi、桥接
阿里妈妈多合一助手.js              # 生成后的主 UserScript（兼容产物）
dev/dev-loader.user.js             # 本地开发加载器（刷新即生效）
tests/*.test.mjs                   # Node 回归测试
dist/packages/                     # 构建后的 userscript 产物
dist/extension/                    # 构建后的 MV3 unpacked 插件目录
scripts/build.mjs                  # 构建脚本
scripts/review-team.sh             # 团队自动化检查入口
package.json                       # 零依赖脚本入口（build/test/review/dev）
```

## 本地开发与联调

### 5 分钟上手（推荐入口）

仓库为零依赖脚本项目，不需要 `npm install`。推荐优先使用 `package.json` 封装入口：

```bash
npm run build
npm run test
npm run review
```

对应底层等价命令分别是：
- `node scripts/build.mjs`
- `node --test tests/*.test.mjs`
- `bash scripts/review-team.sh`

### 常用命令

推荐命令（更利于 Codex 与新维护者快速发现）：

```bash
npm run build
npm run build:check
npm run check:syntax
npm run test
npm run review
```

底层等价命令（保持可用）：

```bash
node scripts/build.mjs
node scripts/build.mjs --check
node --check "阿里妈妈多合一助手.js"
node --test tests/*.test.mjs
bash scripts/review-team.sh
```

### Dev Loader 工作流

如果你不想每次复制粘贴脚本到 Tampermonkey，可以用仓库自带开发加载器：

1. 在项目根目录启动静态服务：

```bash
python3 -m http.server 5173
```

或使用 npm 别名：

```bash
npm run dev:serve
```

2. 打开 Tampermonkey，创建新脚本，把 `dev/dev-loader.user.js` 的内容完整粘贴进去并保存。
3. 禁用线上版脚本，只保留 `Dev Loader` 启用，避免重复执行。
4. 之后你每次修改 `src/`，先执行 `node scripts/build.mjs`，再刷新阿里妈妈页面即可加载最新生成脚本。
5. 如果你希望持续生成，可使用 `node scripts/build.mjs --watch`。

说明：
- Dev Loader 默认从 `http://127.0.0.1:5173/阿里妈妈多合一助手.js` 拉取脚本，并附加时间戳避免缓存。
- 若端口不同，改 `dev/dev-loader.user.js` 里的入口地址即可。

### 本地 extension 联调

```bash
node scripts/build.mjs
```

然后在 Chrome / Edge 扩展页加载 `dist/extension/`。当前 v1 不提供 popup/options 页面，访问阿里妈妈页面即自动生效。

## 代码检查团队（Review Team）

仓库内置“5 角色检查团队”机制（架构、安全、测试、UI/交互、发布），用于统一代码审查口径。

```bash
bash scripts/review-team.sh
```

说明：
- 脚本会先执行 `node scripts/build.mjs --check`，确保 `src/` 与根文件同步。
- 若仓库存在 `CLAUDE.md`，会额外校验版本；缺失时会跳过，不阻塞 CI/Release。
- 脚本会统一执行 `node --check "阿里妈妈多合一助手.js"` 与 `node --test tests/*.test.mjs`，作为发布门禁入口。

## 发布流程（维护者）

1. 修改 `src/` 后执行构建：

```bash
node scripts/build.mjs
```

2. 确认版本与自动化检查：

```bash
node scripts/build.mjs --check
node --check "阿里妈妈多合一助手.js"
node --test tests/*.test.mjs
bash scripts/review-team.sh
```

3. 推送代码并打 tag：

```bash
git tag vX.YY
git push origin vX.YY
```

4. `release.yml` 会自动创建 GitHub Release 并上传：
- `alimama-helper-pro.user.js`
- `alimama-helper-pro.meta.js`
- `alimama-helper-pro-extension.zip`

## 兼容性

- Tampermonkey：Chrome / Edge 首发完整支持
- MV3 插件：Chrome / Edge 首发支持
- Firefox：当前未作为首发插件目标，后续再补

## 说明与排错

- 若 `node scripts/build.mjs --check` 失败，说明有人改了 `src/` 但没重新生成根文件，或手工改了根文件。
- 若页面版本号显示不一致，优先检查 userscript 头 `@version`、脚本内更新日志、README 最近更新三处是否同步。
- 若 Tampermonkey 未提示更新，手动打开 `.meta.js` 地址触发更新检查。
- 若 extension 未生效，优先检查 `dist/extension/manifest.json` 与 `page.bundle.js` 是否为最新构建结果，并确认浏览器扩展页已重新加载。
- 若需要贡献约定与开发入口，优先查看根目录 `AGENTS.md`、`README.md` 与 `KNOWLEDGE.md`；发布相关说明在 `other/RELEASE.md`。
