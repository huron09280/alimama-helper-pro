# RELEASE 指南

## 1. 前置条件

在 GitHub 仓库 Secrets 中配置以下变量：

### Chrome
- `CHROME_EXTENSION_ID`
- `CHROME_CLIENT_ID`
- `CHROME_CLIENT_SECRET`
- `CHROME_REFRESH_TOKEN`

### Edge
- `EDGE_PRODUCT_ID`
- `EDGE_CLIENT_ID`
- `EDGE_CLIENT_SECRET`
- `EDGE_TENANT_ID`

可选（优先）：
- `EDGE_API_KEY`

> 说明：发布脚本默认优先使用 `EDGE_API_KEY`，若未配置则使用 `EDGE_CLIENT_SECRET` 作为 API Key。

### Firefox
- `FIREFOX_EXTENSION_ID`
- `FIREFOX_API_KEY`
- `FIREFOX_API_SECRET`

## 2. 发版流程

1. 确认脚本头 `@version` 与更新日志一致（例如 `5.29`）
2. 本地验证：

```bash
node --check "阿里妈妈多合一助手.js"
node --test tests/logger-api.test.mjs
```

3. 提交并打 tag：

```bash
git tag v5.29
git push origin v5.29
```

4. GitHub Actions 自动执行：
- 运行脚本语法检查与测试
- 生成 userscript 发布资产
- 创建 GitHub Release 并上传资产

## 3. 产物清单

`release.yml` 会上传以下资产：

- `alimama-helper-pro.user.js`
- `alimama-helper-pro.meta.js`

## 4. 回滚策略

若发布后发现问题：

1. 在商店后台回退到上一稳定版本（或停止分发当前版本）
2. 代码回滚到对应 commit，修复后提升版本号重新发布
3. 保留错误版本 tag，但使用更高版本覆盖发布（避免版本号倒退）

## 5. 密钥轮换

建议每 90 天轮换一次密钥：

1. 在各商店后台生成新密钥
2. 更新 GitHub Secrets
3. 触发一次测试 tag（例如 `vX.Y.Z-rc1`，若策略允许）或在分支上手动触发验证
4. 验证通过后删除旧密钥

## 6. 常见故障

- `publish_chrome` 失败：检查 Google OAuth refresh token 是否仍有效。
- `publish_edge` 失败：优先检查 `EDGE_API_KEY` / `EDGE_CLIENT_ID` / `EDGE_PRODUCT_ID` 是否匹配同一应用。
- `publish_firefox` 失败：检查 AMO API 凭证权限以及扩展 ID 是否已在 AMO 注册。
