# AI点睛 prompt 生成与复制计划投放验证报告 - 2026-06-06

## 结论

手动新建 AI点睛计划确实走了 prompt 生成链路；复制计划不是重新调用 AI 生成，而是复制源计划已经生成好的 AI点睛结果，包括 `aiMaxInfo.aiMaxUserInput`、`aiMaxDeliveryPlan`、词包、人群和源关键词。

但“复制计划只是复制 AI点睛人群，所以不能投放”这个判断不成立。当前验证的复制计划已经具备投放条件：计划与单元均开启、单元审核通过、商品一致、`sourceChannel=onebp`、`searchUpgradePxb=null`、AI点睛开启、预算和智能出价目标与手动计划一致。

本轮不能承诺新计划一定马上产生花费；是否起量还取决于平台竞价、流量分配、时间和账户因素。但从创建链路与服务端配置看，复制 AI点睛人群本身不是阻塞投放的根因。

## 验证对象

| 类型 | 计划 ID | 计划名 | 单元 ID | 商品 ID |
| --- | --- | --- | --- | --- |
| 手动新建 | `81271150778` | `E7Pro_AI点睛_重建对比_041518` | `81187227738` | `757440599385` |
| 复制计划 | `81229359071` | `E7Pro_AI点睛_重建对比_41519` | `81229301200` | `757440599385` |

## 提交载荷对比

证据来自 Chrome MCP 当前页面插件请求历史，已脱敏 `csrfId/loginPointId`。

| 字段 | 手动新建 | 复制计划 | 判断 |
| --- | --- | --- | --- |
| 提交 URL | `/solution/addList.json?csrfId=...&bizCode=onebpSearch` | `/solution/addList.json?bizCode=onebpSearch&csrfId=...` | 同一路径、同一业务线 |
| `solutionCount` | `1` | `1` | 本次均创建 1 个计划 |
| `campaign.bizCode` | `onebpSearch` | `onebpSearch` | 一致 |
| `sourceChannel` | `onebp` | `onebp` | 一致，未丢官方入口字段 |
| `searchUpgradePxb` | `null` | `null` | 一致，未复制旧异常升舱字段 |
| 商品 | `757440599385` | `757440599385` | 一致 |
| `aiMaxSwitch` | `1` | `1` | AI点睛均开启 |
| prompt | 有，默认诉求 prompt | 有，同源 prompt | 复制不是丢 prompt |
| `aiMaxDeliveryPlan` | 有 | 有 | 复制保留 AI 生成投放方案 |
| `wordListCount` | `0` | `5` | 主要差异：复制带源关键词 |
| `wordPackageCount` | `1` | `1` | 均有流量智选词包 |
| `crowdCount` | `5` | `5` | 均有 AI 点睛人群 |
| 出价目标 | `smart_bid + coll_cart` | `max_amount + smart_bid + coll_cart` | 服务端最终合同一致 |
| 预算 | `100` | `100` | 一致 |

关键差异是：手动新建由官方 AI 向导当场生成结果，所以提交时 `wordListCount=0`；复制计划复用源计划已经生成出的关键词、人群和词包，所以 `wordListCount=5`。这不是投放阻塞字段。

## 服务端详情对比

证据来自 Chrome MCP 当前页只读调用 `campaign/get.json` 与 `adgroup/get.json`，响应均 `200` 且 `info.ok=true`。

| 字段 | 手动计划 `81271150778` | 复制计划 `81229359071` |
| --- | --- | --- |
| 创建时间 | `2026-06-06 04:18:06` | `2026-06-06 04:22:17` |
| 计划状态 | `onlineStatus=1`, `displayStatus=start` | `onlineStatus=1`, `displayStatus=start` |
| 单元状态 | `onlineStatus=1`, `displayStatus=start`, `auditStatus=1` | `onlineStatus=1`, `displayStatus=start`, `auditStatus=1` |
| 商品 ID | `757440599385` | `757440599385` |
| `bizCode` | `onebpSearch` | `onebpSearch` |
| `sourceChannel` | `onebp` | `onebp` |
| `searchUpgradePxb` | `null` | `null` |
| AI点睛 | `aiMaxSwitch=1` | `aiMaxSwitch=1` |
| prompt | `promptWordCount=1` | `promptWordCount=1` |
| `aiMaxDeliveryPlan` | 有 | 有 |
| `aiMaxGenReason` | 有 | 无 |
| 预算 | `dayBudget=100`, `dmcType=normal` | `dayBudget=100`, `dmcType=normal` |
| 出价 | `bidType=max_amount`, `bidTypeV2=smart_bid` | `bidType=max_amount`, `bidTypeV2=smart_bid` |
| 优化目标 | `bidTargetV2=coll_cart`, `optimizeTarget=coll_cart` | `bidTargetV2=coll_cart`, `optimizeTarget=coll_cart` |
| 目标成本字段 | `setSingleCostV2=false`，无 `constraintType/constraintValue/singleCostV2` | 同左 |
| 地域/分时 | `launchAreaCount=1`, `launchPeriodCount=7` | `launchAreaCount=1`, `launchPeriodCount=7` |
| 标签 | `冷启加速未开启`, `自定义推广` | `冷启加速未开启`, `自定义推广` |

`aiMaxGenReason` 在复制计划服务端详情中为空，但 `prompt` 与 `aiMaxDeliveryPlan` 都存在，且投放状态、预算、出价、商品、来源字段均正常；没有证据表明 `aiMaxGenReason` 为空会阻塞投放。

## 源码判断

- 手动 AI点睛生成：`src/optimizer/keyword-plan-api/search-and-draft.js` 会从 AI 原生返回的 `additionalData.aiMaxInfo` 和 `additionalData.crowdList` 归一化出 `trafficAppeal`、`aiMaxDeliveryPlan`、`nativeCrowdList` 等字段。
- 复制计划字段保留：`src/optimizer/keyword-plan-api/wizard-open-and-create.js` 的复制白名单包含 `crowdList`、`aiMaxSwitch`、`aiMaxInfo`、`sourceChannel`、`channelLocation`、`selectedTargetBizCode`。
- 复制计划组包：复制链路会读取源 `wordList`，AI点睛计划没有显式词包时会补流量智选词包，并把源计划 campaign/adgroup 放进 `rawOverrides`。
- 最终关键词提交白名单：`src/optimizer/keyword-plan-api/search-and-draft.js` 的关键词最终裁剪白名单允许 `crowdList`、`sourceChannel`、`aiMaxSwitch`、`aiMaxInfo`、屏蔽词、地域和分时等关键字段。

因此当前代码不是“只复制人群、不带 prompt 或 AI点睛方案”的实现；它复制的是源计划完整 AI点睛结果，并保留投放必要字段。

## 对“不能投放”的判断

当前复制计划未出现以下历史无花费风险字段：

- 未丢 `sourceChannel`，当前为 `onebp`。
- 未带旧异常 `searchUpgradePxb=2`，当前为 `null`。
- 创建后未被暂停，当前 `onlineStatus=1/displayStatus=start`。
- 单元未被停用，当前 `onlineStatus=1/displayStatus=start/auditStatus=1`。
- 提交 URL 已回到 `/solution/addList.json?bizCode=onebpSearch`。
- `bizCode未找到` 和 `CODEX_GUARDED_WRITE_BLOCKED` 当前页面均无残留。

所以当前能下的结论是：复制计划链路已经具备投放条件；如果后续仍长期无花费，应优先排查平台流量分配、竞价竞争、关键词覆盖、预算消耗节奏、账户余额/风控等非复制组包因素，而不是把根因归为“复制了 AI点睛人群”。

## 浏览器验证记录

- Chrome MCP 当前页面：`https://one.alimama.com/index.html#!/manage/search?...searchValue=E7Pro_AI点睛_重建对比_041518`。
- 页面残留检查：`__codexCopySubmitGuard=false`、`__codexE7RebuildCapture=false`，页面不含 `CODEX_GUARDED_WRITE_BLOCKED` 或 `bizCode未找到` 文案。
- Chrome MCP 只读详情：目标两条计划的 `campaign/get.json` 与 `adgroup/get.json` 均返回 `200/info.ok=true`。
- Console 复查：剩余 warning 主要来自官方 ADC 表达式、组件依赖和 Router context 噪声；未见插件复制提交异常、`bizCode未找到` 或 `CODEX_GUARDED_WRITE_BLOCKED` 相关错误。
