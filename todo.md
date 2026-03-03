# 关键词推广批量建计划 API 向导 - 全面回归 TODO

更新时间：2026-03-03

## 流程约束
- 每次仅执行一个场景：真实新建计划 -> 浏览器核对设置 -> 不一致即修复 -> 本地回归 -> 中文 commit -> push
- 核对依据：`createPlansByScene` 的 `submit_payload_snapshot` 与创建结果 `successes/failures`

## 场景清单
- [x] 关键词推广（已跑完 143 个设置用例；平台侧频控导致部分失败，已补限流重试）
- [ ] 货品全站推广
- [ ] 人群推广
- [ ] 店铺直达
- [ ] 内容营销
- [ ] 线索推广

## 记录模板
- 场景：
- 创建结果：
- 核对结论：
- 修复内容：
- 本地测试：
- commit：
- push：

## 关键词推广（itemId=1024883718763）执行记录
- 场景：关键词推广（scene_goal_option_full，fallback 配置矩阵）
- 创建结果：总用例 143，成功 21，失败 122（首轮）；失败主要为 `FAIL_SYS_USER_VALIDATE / 被挤爆`
- 核对结论：关键请求字段映射可建立（可成功创建 21 条）；主要阻塞为平台侧频控而非字段映射错位
- 修复内容：新增 `throttle` 错误分类 + 退避重试（可配置次数/间隔），并扩展 bridge 方法超时
- 本地测试：`node --test tests/*.test.mjs`（149/149 通过），`node --check "阿里妈妈多合一助手.js"` 通过
- commit：`91df760`（fix: 增加全设置建计划限流重试并记录关键词场景回归）
- push：`origin/api/plan-create` 已推送
- 当前阻塞：阿里妈妈页面进入 `_____tmd_____/punish` 风控页，需人工解除后才能继续下一场景真机回归

## 关键词推广（itemId=1024883718763）执行记录（第二轮：全设置修复）
- 场景：关键词推广（scene_goal_option_full，143 个设置逐项创建）
- 创建结果：总用例 143，成功 95，失败 48；`addList` 请求 257 次（含限流重试）
- 核对结论：
  - 商品绑定已稳定：创建请求内持续命中 `campaign.itemIdList` 与 `adgroup.material.materialId=1024883718763`
  - 清理链路已修复：先自动清理成功 21 条；剩余 74 条通过“仅本次 ID 精确重试删除”全部清理完成
  - 本轮创建计划总数 95，已删除 95，剩余 0（未操作其它计划）
- 修复内容：
  - 生命周期：新增 `delete` 内置兜底合同（`/campaign/delete.json + campaignIdList`）
  - 生命周期 payload：支持 `campaignList/entityList` 嵌套键结构化赋值，过滤非法路径键，`pause/delete` action 兜底关键字段
  - 限流治理：新增 `caseIntervalMs/caseIntervalJitterMs`，按 case 间隔降速执行
- 风控：运行中触发风控提示弹窗（按要求提醒人工验证）
- 本地测试：
  - `node --test tests/lifecycle-contract-safety.test.mjs tests/lifecycle-payload-builder-compat.test.mjs tests/keyword-create-repair-throttle-retry.test.mjs tests/keyword-create-repair-cleanup-id-extract.test.mjs tests/keyword-create-repair-item-binding-guard.test.mjs` 通过
  - `node --check "阿里妈妈多合一助手.js"` 通过
- commit：待提交
- push：待推送

## 货品全站推广（安全修复进行中）
- 问题：真实回归中触发 `oneClick` 冲突处理，存在误操作其它计划风险；且在传入商品时存在落入 `shop` 选品模式的空商品观感风险。
- 修复：
  - `createPlansBatch` 默认 `conflictPolicy` 改为 `none`（仅显式指定才允许冲突处理）。
  - 货品全站场景在 `hasItem` 时强制 `campaign.itemSelectedMode='user_define'`，确保按商品绑定创建。
- 验证：
  - `node --test tests/site-scene-item-binding.test.mjs` 通过
  - `node --test tests/site-scene-submit-mode.test.mjs` 通过
  - `node --check "阿里妈妈多合一助手.js"` 通过
