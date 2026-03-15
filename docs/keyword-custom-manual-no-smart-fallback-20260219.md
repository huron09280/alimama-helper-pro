# 关键词推广 / 自定义推广：手动出价不转智能 & 报错直出（MCP 真机测试）

## 1. 测试目标
- 场景：`关键词推广`
- 营销目标：`自定义推广`
- 必选商品：`682357641421`
- 验证点：
  - 手动出价提交快照必须保持 `bidMode=manual` / `bidTypeV2=custom_bid`
  - 接口失败时直接返回失败，不触发任何 `fallback_downgrade_*` 降级链路

## 2. 测试环境
- 页面：`https://one.alimama.com/index.html#!/main/index?bizCode=onebpLive`
- 向导 API：`window.__AM_WXT_PLAN_API__`
- 脚本构建标识：`build=2026-02-18 04:00`，`patch=adzone-default-sync-v5`
- 浏览器执行方式：MCP `chrome-devtools` -> `evaluate_script`

## 3. 用例与结果

### 用例 A：dry-run 快照验证（不真实提交）
调用：`collectWizardSubmitSnapshot(request, { dryRunOnly: true, batchRetry: 0, fallbackPolicy: 'auto' })`

关键返回：
```json
{
  "ok": true,
  "bidMode": "manual",
  "bidTypeV2": "custom_bid",
  "wordPackageCount": 0,
  "submitEndpoint": "/solution/addList.json"
}
```

结论：在“关键词推广 / 自定义推广 / 手动出价”下，提交快照已保持手动，不再被强制改为智能。

### 用例 B：真实失败回路验证（接口报错直出）
调用：`collectWizardSubmitSnapshot(request, { dryRunOnly: false, batchRetry: 0, fallbackPolicy: 'auto' })`

为稳定复现失败，使用重复计划名 `MCP_DUP_1771521515153`。

关键返回：
```json
{
  "ok": false,
  "failCount": 1,
  "successCount": 0,
  "firstFailure": "EXTERNAL_ERROR：推广计划标题\"计划标题不合法，标题重复\"不允许重复",
  "bidMode": "manual",
  "bidTypeV2": "custom_bid",
  "hasDowngradeEvent": false,
  "fallbackEvents": ["submit_batch_fallback_single"]
}
```

结论：接口报错后直接失败返回；未出现 `fallback_downgrade_pending / confirmed / result` 等降级事件，也未转智能出价。

## 4. 总结
- 手动出价链路已可稳定落到 `custom_bid`。
- 失败路径按“报错即报错”处理，未触发降级重提逻辑。
