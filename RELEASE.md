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

1. 确认 `package.json` 版本号（例如 `5.25.0`）
2. 本地验证：

```bash
npm ci
npm run verify
```

3. 提交并打 tag：

```bash
git tag v5.25.0
git push origin v5.25.0
```

4. GitHub Actions 自动执行：
- 构建扩展和 userscript 产物
- 打包 zip/xpi
- 创建 GitHub Release 并上传资产
- 发布到 Chrome / Edge / Firefox（各渠道独立，失败互不阻断）

## 3. 产物清单

`release.yml` 会上传以下资产：

- `alimama-helper-pro.crx`
- `alimama-helper-pro-chrome.zip`
- `alimama-helper-pro-edge.zip`
- `alimama-helper-pro-firefox.xpi`
- `alimama-helper-pro.user.js`
- `alimama-helper-pro.meta.js`

> `crx` 打包默认使用本地 `.keys/alimama-helper-pro.pem`。如需指定固定私钥，可设置 `CHROME_CRX_KEY_PATH`。

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
