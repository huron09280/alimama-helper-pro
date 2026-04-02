# License Server (Function Compute + API Gateway)

## 目标
- 提供店铺授权校验接口，给前端 `LicenseGuard` 使用。
- 接口：
  - `POST /v1/license/verify`
  - `POST /v1/license/revoke`
  - `GET /`（在线授权管理页）
  - `GET /v1/license/admin/state`
  - `POST /v1/license/admin/allow`
  - `POST /v1/license/admin/revoke`
  - `POST /v1/license/admin/delete`

## 在线管理页
- 访问函数地址根路径即可打开管理页（示例）：
  - `https://your-function-domain.fcapp.run/`
- 页面模板文件：`services/license-server/license-admin.html`（由 `index.mjs` 直接读取并返回）。
- 触发器方法要求：HTTP 触发器必须允许 `GET,POST,OPTIONS`；若仅放开 `POST`，访问根路径会返回 `403 unauthorized method 'GET'`。
- 注意：阿里云默认 `fcapp.run / aliyuncs.com` 域名会被平台强制追加 `Content-Disposition: attachment`，浏览器会下载而不是渲染页面；这是平台行为，不是代码问题。
- 若需“在线网页可直接打开”，请改用自定义域名，或将管理页单独托管到静态站点（Vercel/Netlify/GitHub Pages/OSS 静态网站）并调用本服务 API。
- 页面可直接执行：
  - 授权/禁用店铺（写入持久层，立即生效）
  - 吊销/取消吊销
  - 删除当前行（移除该店铺的授权/吊销/活跃聚合内存记录）
  - 在线触发 `verify` 自检

## 持久化策略
- 仅使用 Tablestore（云数据库）持久化授权状态，不再提供文件或纯内存兜底。
- 若 Tablestore 未配置或不可用，状态相关接口会返回 `503`（`code=license_storage_unavailable`）。
- 所有写操作（`verify`/`revoke`/`admin allow`/`admin revoke`/`admin delete`）都会触发持久化；请求入口会先执行状态同步。
- 新店自动授权默认关闭；如需开启，设置 `AM_LICENSE_AUTO_PROVISION_NEW_SHOP=1`。

## 请求/响应契约

### POST /v1/license/verify
请求体：
```json
{
  "shopId": "123456789",
  "shopName": "示例店铺",
  "scriptVersion": "6.08",
  "buildId": "build-20260331-001",
  "buildChannel": "production",
  "runtimeMode": "userscript",
  "deviceHash": "...",
  "timestamp": 1711860000000,
  "nonce": "abc123"
}
```

成功响应：
```json
{
  "authorized": true,
  "reason": "ok",
  "leaseToken": "uuid",
  "expiresAt": 1711860300000,
  "policy": {
    "signature": "sha256hex",
    "token": "eyJ...<policy token>...",
    "tokenAlg": "ES256",
    "ttlMs": 300000,
    "shopId": "123456789",
    "shopName": "示例店铺",
    "buildId": "build-20260331-001",
    "buildChannel": "production"
  }
}
```
> `timestamp` 需落在服务端时间窗内（默认 ±60 秒）；`nonce` 在窗口期内只能使用一次（默认 5 分钟），重放会返回 `nonce_replayed`。

失败响应：
```json
{
  "authorized": false,
  "reason": "店铺未授权",
  "code": "shop_not_allowed"
}
```
> 若店铺授权已到期，返回 `{"authorized":false,"code":"shop_license_expired","reason":"店铺授权已过期"}`。

### POST /v1/license/revoke
请求体：
```json
{
  "shopId": "123456789"
}
```

响应：
```json
{
  "ok": true,
  "shopId": "123456789",
  "revokedAt": "2026-03-31T01:00:00.000Z"
}
```

### GET /v1/license/admin/state
返回当前授权状态快照（环境变量 + 持久层覆盖 + 最近使用店铺）：
```json
{
  "ok": true,
  "adminTokenConfigured": true,
  "generatedAt": "2026-04-01T02:00:00.000Z",
  "allowed": {
    "env": ["2957960066"],
    "memory": ["1234567890"],
    "effective": ["1234567890", "2957960066"]
  },
  "revoked": {
    "env": [],
    "memory": ["9876543210"],
    "effective": ["9876543210"]
  },
  "defaultAuthValidDays": 3,
  "storage": {
    "mode": "tablestore",
    "syncIntervalMs": 1500
  },
  "activeShops": [
    {
      "shopId": "2957960066",
      "shopName": "示例店铺",
      "currentAuthorization": "enabled",
      "currentAuthExpiresAt": "2026-04-04T23:59:59.999Z",
      "currentAuthExpired": false,
      "firstSeenAt": "2026-04-01T00:10:00.000Z",
      "lastAuthorized": true,
      "lastCode": "ok",
      "runtimeMode": "extension",
      "scriptVersion": "6.08",
      "buildId": "release-20260401-01",
      "buildChannel": "release",
      "lastSeenAt": "2026-04-01T02:00:00.000Z",
      "verifyCount": 12
    }
  ]
}
```

### POST /v1/license/admin/allow
请求体：
```json
{
  "shopId": "1234567890",
  "shopName": "示例店铺",
  "enabled": true,
  "durationKey": "3d"
}
```
- `enabled=true`：授权/更新店铺（默认有效期 3 天）
- `enabled=false`：禁用店铺
- 有效期可选参数：
  - `durationKey`: `3d` / `1m` / `3m` / `1y` / `permanent` / `keep`
  - `validDays`: 正整数天数（可覆盖默认）
  - `validMonths`: 正整数月数
  - `authExpiresAt`（或 `expiresAt`）: 绝对时间（ISO 格式）
- 说明：管理页“授权到期”列的日期输入框会把所选日期转换成当天 `23:59:59.999` 对应的 `authExpiresAt` 自动上传。

### POST /v1/license/admin/revoke
请求体：
```json
{
  "shopId": "1234567890",
  "revoked": true
}
```
- `revoked=true`：吊销
- `revoked=false`：取消吊销

### POST /v1/license/admin/delete
请求体：
```json
{
  "shopId": "1234567890"
}
```
- 作用：删除当前店铺在管理状态中的内存记录，包括：
  - `shops`（授权配置）
  - `revoked`（吊销状态）
  - `activeShops`（最近活跃聚合）

## 表存储建议设计（Tablestore）

### `license_shop`
- 主键：`pk=shopId`
- 字段：
  - `enabled` (boolean)
  - `shopName` (string)
  - `allowBuildChannels` (string list)
  - `allowBuildIds` (string list / 通配)
  - `updatedAt` (ISO datetime)

### `license_revocation`
- 主键：`pk=shopId`
- 字段：
  - `revoked` (boolean)
  - `reason` (string)
  - `revokedAt` (ISO datetime)
  - `operator` (string)

### `license_audit`
- 主键：`pk=shopId`, `sk=timestamp`（或反向时间序）
- 字段：
  - `action` (`verify` / `revoke`)
  - `result` (`allow` / `reject` / `ok`)
  - `reason` (string)
  - `buildId` / `buildChannel` / `runtimeMode` / `deviceHash`

## 环境变量
- `AM_LICENSE_ALLOWED_SHOPS`: 允许店铺白名单，逗号分隔。
- `AM_LICENSE_REVOKED_SHOPS`: 吊销店铺列表，逗号分隔。
- `AM_LICENSE_LEASE_TTL_MS`: 租约毫秒数，默认 300000。
- `AM_LICENSE_DEFAULT_AUTH_VALID_DAYS`: 店铺授权默认有效天数（`admin/allow enabled=true` 未显式指定时生效），默认 `3`。
- `AM_LICENSE_AUTO_PROVISION_NEW_SHOP`: 是否开启“新店首次 verify 自动授权”；默认 `false`（关闭），设为 `1/true` 可开启。
- `AM_LICENSE_AUDIT_STDOUT`: 设为 `1` 时输出审计日志到 stdout。
- `AM_LICENSE_ADMIN_TOKEN`: 管理端 token（必填）。未配置时，`/v1/license/revoke` 与所有 `/v1/license/admin/*` 会返回 `503 admin_token_not_configured`。
- `AM_LICENSE_ACTIVE_SHOP_LIMIT`: 最近使用店铺内存缓存上限，默认 `500`。
- `AM_LICENSE_STATE_SYNC_INTERVAL_MS`: 状态同步最小间隔（毫秒），默认 `1500`。
- `AM_LICENSE_VERIFY_TIMESTAMP_DRIFT_MS`: `verify` 请求允许的时间漂移窗口（毫秒），默认 `60000`。
- `AM_LICENSE_NONCE_WINDOW_MS`: nonce 防重放窗口（毫秒），默认 `300000`。
- `AM_LICENSE_NONCE_CACHE_LIMIT`: nonce 内存缓存上限，默认 `20000`。
- `AM_LICENSE_POLICY_PRIVATE_KEY_PEM`: ES256 私钥 PEM（支持 `\\n` 换行）；配置后服务端会在 `policy.token` 返回签名 token，供客户端缓存验签。
- `AM_LICENSE_POLICY_PRIVATE_KEY_BASE64`: ES256 私钥 PEM 的 Base64（单行），当控制台多行转义不稳定时可优先使用该变量。

### Tablestore（必选）
- 部署依赖：函数代码包必须包含 `tablestore` npm 包（建议在 `services/license-server` 执行 `npm ci --omit=dev` 后再打包部署）。
- 发布前校验：在仓库根目录执行 `node scripts/check-license-server-deps.mjs`，若失败说明依赖清单或锁文件不完整，禁止发布。
- 打包时至少包含：`index.mjs`、`license-admin.html`、`package.json`、`package-lock.json`、`node_modules/`（含 `tablestore`）。
- `AM_LICENSE_TABLESTORE_ENDPOINT`: Tablestore Endpoint（例如 `https://xxx.cn-hangzhou.ots.aliyuncs.com`）。
- `AM_LICENSE_TABLESTORE_INSTANCE`: Tablestore 实例名。
- `AM_LICENSE_TABLESTORE_TABLE`: 存储表名（建议单行快照表）。
- `AM_LICENSE_TABLESTORE_STATE_PK`: 快照主键值，默认 `license_state`。
- `AM_LICENSE_TABLESTORE_AK`: AccessKey ID（可选；在 FC RAM 角色可用时可不填）。
- `AM_LICENSE_TABLESTORE_SK`: AccessKey Secret（可选）。
- `AM_LICENSE_TABLESTORE_STS_TOKEN`: STS Token（可选）。
