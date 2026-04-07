# RELEASE 指南

## 1. 发版前检查

修改 `src/` 后，先重新生成根文件与发布产物：

```bash
node scripts/build.mjs
```

然后执行完整检查：

```bash
node scripts/build.mjs --check
node --check "阿里妈妈多合一助手.js"
node --test tests/*.test.mjs
bash scripts/review-team.sh
```

说明：
- `scripts/review-team.sh` 会先校验 `src/` 与根文件同步，再执行架构/安全/测试/版本检查。
- 若仓库存在 `CLAUDE.md`，还会追加版本一致性校验。

## 2. 发版流程

1. 确认脚本头 `@version` 与更新日志一致。
2. 本地执行构建与检查命令。
3. 提交并打 tag：

```bash
git tag vX.YY
git push origin vX.YY
```

4. GitHub Actions 自动执行：
- 运行 `bash scripts/review-team.sh`
- 执行 `node scripts/build.mjs`
- 生成 userscript 发布资产
- 打包 `dist/extension/` 为 extension zip
- 创建 GitHub Release 并上传资产

## 3. 产物清单

`release.yml` 会上传以下资产：

- `alimama-helper-pro.user.js`
- `alimama-helper-pro.meta.js`
- `alimama-helper-pro-extension.zip`

## 4. 回滚策略

若发布后发现问题：

1. 回退到上一稳定 tag 对应的 release 资产。
2. 代码回滚到对应 commit，修复后提升版本号重新发布。
3. 保留错误版本 tag，但使用更高版本覆盖发布，避免版本号倒退。

## 5. 常见故障

- `node scripts/build.mjs --check` 失败：说明 `src/` 与根文件不同步，或有人直接手改了根文件。
- `release.yml` 未生成 extension zip：检查 `dist/extension/` 是否由构建脚本正确产出。
- Tampermonkey 未提示更新：手动打开 `.meta.js` 地址触发更新检查。
- unpacked extension 未生效：在扩展页点击重新加载，并确认 `manifest.json`、`content.js`、`page.bundle.js` 来自同一次构建。
