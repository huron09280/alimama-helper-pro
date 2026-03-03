# 关键词推广全设置真机回归（2026-03-03）

## 输入
- 场景：`关键词推广`
- 商品：`itemId=1024883718763`
- 模式：`scene_goal_option_full`（每个设置项各建计划）

## 首轮执行结果（修复前）
- 总用例：`143`
- 成功：`21`
- 失败：`122`
- 主要失败签名：`FAIL_SYS_USER_VALIDATE | RGV587_ERROR::SM::哎哟喂,被挤爆啦,请稍后重试`

结论：失败集中于平台侧频控/拥塞，不是设置映射错误主因。

## 本轮修复
- 新增创建失败分类：`throttle`
  - 识别关键字：`FAIL_SYS_USER_VALIDATE`、`被挤爆`、`稍后重试`、`rate limit` 等
- 在 `runCreateRepairByItem` 中加入限流退避重试：
  - 默认 `throttleRetryTimes=2`
  - 默认 `throttleBackoffMs=1800`（按重试次数线性退避）
  - 重试成功计入 `repairedCases`
- 扩展 bridge 方法超时：
  - `runCreateRepairByItem` 调用超时调整为 `30 分钟`，避免大矩阵任务被 180 秒截断

## 本地验证
- `node --test tests/*.test.mjs`：`149/149 pass`
- `node --check "阿里妈妈多合一助手.js"`：通过

## 当前阻塞
- 页面进入风控：`/_____tmd_____/punish`
- 在解除风控前，无法继续后续场景（全站/人群/店铺直达/内容/线索）的真实建计划回归。
