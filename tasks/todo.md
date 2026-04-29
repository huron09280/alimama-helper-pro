# TODO - 2026-04-29 `onebpSearch` API 向导 P0 修复

## 需求规格
- 目标：
  - 修复关键词推广 API 向导 P0 问题，使 `搜索卡位`、`趋势明星`、`流量金卡`、`自定义推广` 的最终组包按各自真实请求契约保留关键字段；
  - 避免四类关键词营销目标继续统一套用 `自定义推广/智能出价` 的字段裁剪逻辑；
  - 补齐 P0 中明确要求的运行时默认值、字段映射、控件展示/隐藏和最终请求保留字段。
- 范围：
  - `src/optimizer/keyword-plan-api/` 下默认值、场景动态表单、请求预览、草稿组包与字段裁剪；
  - 覆盖 P0 关键字段的回归测试；
  - 构建、语法、单测和 review-team 验证。
- 非目标：
  - 不重新抓真实页面流量；
  - 不真实提交计划；
  - 不处理 P1/P2 中未被 P0 依赖的完整体验增强。

## 执行计划（可核对）
- [x] 定位 P0 涉及代码路径和现有测试契约，确认最小侵入方案。
- [x] 为四类关键词营销目标拆分目标感知的字段保留和默认映射。
- [x] 修复 `搜索卡位`、`趋势明星`、`流量金卡` 的 P0 运行时默认值、UI 控件和请求字段组包。
- [x] 补充或更新关键回归测试，覆盖 P0 字段不丢失与目标特异映射。
- [x] 运行 `node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"`、`node --test tests/*.test.mjs`、`bash scripts/review-team.sh`。
- [x] 通过 `chrome-devtools` MCP 复验刷新插件后的真实页面 UI。
- [x] 回填验证记录、结果复盘和剩余风险。

## 改动摘要
- 已建立本次 P0 修复计划，待进入代码定位。
- 已确认核心落点：
  - `src/optimizer/keyword-plan-api/runtime.js`：关键词目标默认契约与动态字段兜底；
  - `src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-core.js`：编辑态控件展示/隐藏；
  - `src/optimizer/keyword-plan-api/request-builder-preview.js`：策略预览层对出价目标的通用覆盖；
  - `src/optimizer/keyword-plan-api/search-and-draft.js`：最终请求组包、字段保留和目标契约裁剪。
- 已完成四类关键词目标的目标感知运行时契约拆分：
  - `搜索卡位` 固定 `promotion_scene_search_detent / itemSelectedMode=search_detent / bidType=max_amount / dmcType=day_average / searchDetentType`；
  - `趋势明星` 固定 `promotion_scene_search_trend / itemSelectedMode=trend / trendType`，并区分普通智能目标、ROI 与平均直接成交成本契约；
  - `流量金卡` 固定 `promotion_scene_golden_traffic_card_package / itemSelectedMode=user_define / bidTargetV2=conv`，并保留套餐、订单与续投字段；
  - `自定义推广` 继续保留自定义智能/手动出价链路，并补齐 `aiMaxSwitch / aiMaxInfo` 等原生字段保留。
- 已修复真实页面复验暴露的 UI 残留：`趋势明星 / 流量金卡` 不再从通用关键词兜底里显示 `核心词设置 / 匹配方式 / 卡位方式 / 流量智选`。
- 已修复最终复验暴露的搜索卡位细节：`卡位方式` 只在 `搜索卡位` 下展示，并强制补齐 `位置不限提升市场渗透`；`自定义推广` 不再残留 `卡位方式`。
- 已新增 `tests/keyword-search-p0-contract.test.mjs`，并更新既有 UI 契约测试，覆盖 P0 默认值、字段保留、目标分支组包、编辑态隐藏和请求预览覆盖。

## 验证记录
- `node scripts/build.mjs`：通过，已重新生成根 userscript、packages 与 extension page bundle。
- `node scripts/build.mjs --check`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/keyword-search-p0-contract.test.mjs`：通过，5/5。
- `node --test tests/*.test.mjs`：通过，412 个测试，410 通过，2 个跳过；跳过项为既有可选 `agent-cluster/index.mjs` 缺失。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `chrome-devtools` MCP：已确认真实 `one.alimama.com` 页面、插件面板与 API 向导可打开；清空旧草稿后发现并修复了 `趋势明星` 仍显示通用 `匹配方式` 的 UI 残留。
- `chrome-devtools` MCP 最终复验：通过，真实页面 URL 为 `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSearch&promotionScene=promotion_scene_search_detent&stepIndex=1&subStepIndex=0`。
  - `搜索卡位`：不显示通用 `出价方式 / 出价目标`，显示 `卡位方式`，并包含 `位置不限提升市场渗透`；保留 `匹配方式 / 手动关键词`。
  - `趋势明星`：显示 `出价方式 / 出价目标 / 平均直接成交成本`，不显示 `卡位方式 / 匹配方式 / 手动关键词`。
  - `流量金卡`：显示 `套餐卡 / 套餐包档位 / 套餐包自动续投 / 支付方式`，不显示 `出价方式 / 出价目标 / 卡位方式 / 匹配方式 / 手动关键词`。
  - `自定义推广`：显示 `出价方式 / 出价目标 / 匹配方式 / 手动关键词`，不显示 `卡位方式`。

## 结果复盘
- 本次根因是关键词推广四个营销目标此前共用“自定义推广/智能出价”模型，导致默认值、字段裁剪、请求预览和最终组包都会覆盖或丢弃非自定义目标的原生字段。
- 修复策略采用目标感知分支，而不是继续扩大单一 allowlist：默认值、UI 过滤、请求预览与最终裁剪均按 `搜索卡位 / 趋势明星 / 流量金卡 / 自定义推广` 分别处理。
- 真实页面复验发现旧草稿与通用兜底字段会掩盖新逻辑；后续复验必须先清空或切换到新草稿，避免用历史草稿判断当前实现。
- 本轮剩余风险：未真实提交计划，避免影响线上投放；最终请求契约通过自动化回归覆盖，真实页面复验覆盖到向导 UI 字段收敛。

---

# TODO - 2026-04-28 `onebpSearch` API 向导编辑选项对照检查

## 需求规格
- 目标：
  - 以 `addList.md` 作为关键词推广新建计划最终请求的唯一对照来源；
  - 检查插件“关键词推广批量建计划 API 向导”的编辑态选择项；
  - 明确哪些选项已正确覆盖、哪些漏配、哪些实现存在风险；
  - 建立可执行修复清单，暂不直接修改业务逻辑。
- 范围：
  - `onebpSearch` 下已沉淀的 `搜索卡位`、`趋势明星`、`流量金卡`、`自定义推广`；
  - 向导编辑 UI 的可见选择项、默认值、字段映射、提交组包相关逻辑；
  - 已有测试中的关键词推广契约。
- 非目标：
  - 不重新抓真实页面流量；
  - 不真实提交计划；
  - 不在本轮直接实现修复，除非后续明确要求。

## 执行计划（可核对）
- [x] 阅读并提取 `addList.md` 中 `onebpSearch` 控件与字段映射。
- [x] 定位 API 向导编辑 UI、场景配置、提交组包、测试覆盖。
- [x] 对照四类营销目标，标记已覆盖、遗漏、问题项。
- [x] 按优先级输出修复清单，包含预期字段与验证方式。
- [x] 回填本文件的结果复盘。

## 改动摘要
- 已建立本轮检查计划。
- 已完成 `addList.md` 第 17-20 章的 `onebpSearch` 样本对照，覆盖 `搜索卡位`、`趋势明星`、`流量金卡`、`自定义推广` 四个营销目标。
- 已完成 API 向导编辑态相关代码静态检查，重点检查默认策略、营销目标运行时映射、动态表单、请求预览、最终组包与字段裁剪逻辑。
- 本轮仅形成修复清单，未修改业务逻辑。

## 验证记录
- 已对照文档样本：
  - `搜索卡位`：`KS01-KS10`
  - `趋势明星`：`KT01-KT25`
  - `流量金卡`：`GK01-GK09`
  - `自定义推广`：`KD01-KD03`
- 已检查实现文件：
  - `src/optimizer/keyword-plan-api/runtime.js`
  - `src/optimizer/keyword-plan-api/wizard-style-and-state/defaults-and-presets.js`
  - `src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-core.js`
  - `src/optimizer/keyword-plan-api/request-builder-preview.js`
  - `src/optimizer/keyword-plan-api/search-and-draft.js`
- 已确认一个子代理完成 `addList.md` 字段提取；另一个实现检查子代理因额度中断，已由本轮本地静态检查补足。
- 本轮未运行构建或测试，因为未修改业务代码；后续实现修复时必须执行 `node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"`、`node --test tests/*.test.mjs`，涉及 UI 后还需通过 `chrome-devtools` MCP 做真实页面验证。

## 结果复盘
- 已设置好的部分：
  - `关键词推广` 的营销目标候选已经包含 `搜索卡位 / 趋势明星 / 流量金卡 / 自定义推广`。
  - 营销目标切换后，运行时已有把 `promotionScene / itemSelectedMode` 同步进场景设置的基础逻辑。
  - 编辑态已有计划名称、预算、出价方式、部分出价目标、冷启加速、投放资源位、投放时间、投放地域、手动关键词等通用控件。
  - `自定义推广` 是当前覆盖最完整的目标，已有智能/手动出价、人群、成本约束、高级设置和手动关键词面板。
  - `冷启加速` 到 `campaignColdStartVO.coldStartStatus` 的基础映射已经存在。
- 总体问题：
  - 当前实现把四个关键词营销目标过度套进同一套“自定义推广/智能出价”模型，导致 UI 选择项、默认值、字段保留和最终组包都与 `addList.md` 的真实请求不完全一致。
  - 字段裁剪函数按通用 allowlist 处理全部关键词目标，会丢弃 `searchDetentType / trendType / trendThemeList / packageId / planId / orderInfo / orderAutoRenewalInfo / launchTime / aiMaxSwitch / aiMaxInfo` 等真实请求关键字段。
  - 动态表单对 `趋势明星`、`流量金卡` 仍展示 `卡位方式 / 匹配方式 / 手动关键词` 这类不匹配控件，反而缺少主题、套餐、自动续投、人群目标等真实控件。
- P0 修复清单：
  - 为 `搜索卡位 / 趋势明星 / 流量金卡 / 自定义推广` 拆分独立的关键词目标契约，不再把全部关键词目标统一走 `pruneKeywordCampaignForCustomScene`。
  - `搜索卡位` 需要把 `卡位方式` 映射为 `searchDetentType`，补齐 `permeability`，使用真实 `bidType=max_amount` 和 `dmcType=day_average`，隐藏通用智能出价目标和平均直接成交成本。
  - `趋势明星` 需要移除 `卡位方式 / 匹配方式 / 手动关键词`，新增并保留 `trendType / trendThemeList / itemIdList / adgroupList / crowdList / adzoneList / launchAreaStrList / launchPeriodList`。
  - `趋势明星` 的出价目标需要按真实请求处理：`conv / click / coll_cart` 保持普通智能目标，`roi` 只保留 `bidTargetV2=roi + constraintType=roi + constraintValue`，平均直接成交成本走 `setSingleCostV2=true + constraintType=dir_conv + constraintValue` 且不提交 `optimizeTarget`。
  - `流量金卡` 需要把运行时默认修正为 `itemSelectedMode=user_define`、`bidTargetV2=conv`，并新增套餐卡、套餐包档位、自动续投、支付方式、冷启开关等控件与字段保留。
  - 最终组包需要按目标保留真实字段，至少补齐 `searchDetentType`、`trendType`、`trendThemeList`、`packageId`、`packageTemplateId`、`planId`、`planTemplateId`、`orderInfo`、`orderAutoRenewalInfo`、`orderChargeType`、`launchTime`、`aiMaxSwitch`、`aiMaxInfo`。
- P1 修复清单：
  - 默认策略列表当前只有 `趋势明星` 与 `自定义推广`，需要补齐或改造成能覆盖 `搜索卡位` 与 `流量金卡`。
  - 矩阵兜底配置需要按营销目标分组，避免给 `趋势明星 / 流量金卡 / 自定义推广` 注入 `卡位方式 / 匹配方式`。
  - `卡位方式` 兜底选项缺少 `位置不限提升市场渗透`，需要补齐并映射为 `permeability`。
  - `自定义推广` 需要保留 `aiMaxSwitch / aiMaxInfo`，并修正智能出价下把预算类型强制改为 `normal` 的逻辑，文档样本为 `dmcType=day_average`。
  - `request-builder-preview.js` 当前会用策略出价目标覆盖场景设置，后续需要改为目标感知，避免覆盖 `搜索卡位 / 流量金卡 / 趋势明星 ROI` 的原生字段。
- P2 修复清单：
  - 为四个营销目标分别补回归测试，断言 UI 设置到最终 `solution/addList.json` 请求体的关键字段。
  - 后续如果要完整支持 `自定义推广` 的出价目标、成本约束、预算类型、高级设置，还需要继续补抓 `addList.md`。
  - 后续如果要完整支持 `流量金卡` 的自动续投门槛与支付方式，还需要再次抓取有效样本，因为当前 `GK08 / GK09` 样本未观察到阈值和支付方式真实落库。

---

# TODO - 2026-04-28 `onebpSearch` 关键词推广提交流量摸排

## 需求规格
- 目标：
  - 在真实 `one.alimama.com` 页面继续覆盖“下一个场景”，默认从 `关键词推广` 开始；
  - 先确认该场景的 `bizCode`、默认营销目标、商品前置条件与提交前最后一跳接口；
  - 继续沿用离线提交方式，逐步沉淀到 `addList.md`。
- 范围：
  - Chrome DevTools MCP 真实页面测试；
  - `关键词推广` 的页面结构梳理、前置条件确认、离线提交抓包；
  - `tasks/todo.md` 进度同步。
- 非目标：
  - 不真实提交计划；
  - 不修改业务代码；
  - 本轮先从 `关键词推广` 开始，不承诺一次覆盖完全部关键词子场景。

## 执行计划（可核对）
- [x] 恢复 DevTools 连接并切回真实阿里妈妈页面。
- [x] 切换到下一个场景 `关键词推广`，确认 URL 与默认营销目标。
- [x] 跑通 `关键词推广` 当前默认子场景的离线提交，确认接口与请求体结构。
- [x] 梳理该场景的首批可确认分支，并补写到 `addList.md`。
- [x] 回填验证记录与结果复盘。
- [x] 补抓“核心词设置 -> 添加关键词”入口及其对 `wordList` 的影响。
- [x] 补抓“手动输入添加关键词”入口及其对 `wordList` 的影响。
- [x] 补抓“清空关键词”入口及页面阻塞/提交前置条件。
- [x] 补抓“广泛 / 中心词 / 精准”切换对 `wordList.matchScope` 的影响。
- [x] 重新验证 `位置不限提升市场渗透` 的真实选中行为与提交字段。
- [x] 切换到下一个关键词营销目标，抓取新的基线提交结构。
- [x] 补抓 `趋势明星 -> 设置平均直接成交成本` 的默认档、分档与自定义值。
- [x] 补抓 `趋势明星 -> 设置优先投放客户 / 人群优化目标` 总开关对 `crowdList` 的影响。
- [x] 补抓 `趋势明星 -> 新客户获取 / 流失老客挽回 / 高价值客户获取` 三个人群开关。
- [x] 验证 `趋势明星` 的人群倍率输入是否真实落到提交体。
- [x] 补抓 `趋势明星 -> 选择趋势主题` 对 `trendThemeList` 的影响。
- [x] 补抓 `趋势明星 -> 添加自选商品` 对 `itemIdList / adgroupList` 的影响。
- [x] 补抓 `趋势明星 -> 清空` 对 `trendThemeList / itemIdList / adgroupList` 的影响。
- [x] 补抓 `趋势明星 -> 高级设置 -> 投放地域 / 投放时间` 的非默认提交结构。
- [x] 复核 `趋势明星 -> 设置平均直接成交成本` 的默认档是否为动态值。
- [x] 补抓 `流量金卡` 基线、解决方案卡切换与套餐包档位切换。
- [x] 补抓 `流量金卡` 的冷启开关与套餐包自动续投开关。
- [x] 补抓 `自定义推广` 基线（含加商品后可提交态）。
- [x] 补抓 `自定义推广 -> AI点睛` 关闭后的可提交分支。
- [x] 补抓 `趋势明星 -> 高级设置 -> 投放资源位` 的非默认结构。

## 改动摘要
- 已从 `货品全站推广` 切换到 `关键词推广`。
- 当前页面 URL：
  - `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSearch&promotionScene=promotion_scene_search_detent`
- 当前默认营销目标：
  - `搜索卡位`
- 已把 `关键词推广 -> 搜索卡位` 的基线样本与首批分支写入 `addList.md`：
  - `KS01` 基线
  - `KS02` 抢前三
  - `KS03` 抢首页
  - `KS04` 冷启加速 = 关
  - `KS05` 添加关键词（推荐词：美的小魔方）
  - `KS06` 手动输入关键词（方太水槽）
  - `KS07` 手动词匹配方式 = 中心词
  - `KS08` 手动词匹配方式 = 精准
  - `KS09` 清空关键词
  - `KS10` 位置不限提升市场渗透
- 已新增 `关键词推广 -> 趋势明星` 的基线与首批分支：
  - `KT01` 基线
  - `KT02` 冷启加速 = 关
  - `KT03` 出价目标 = 增加点击量
  - `KT04` 出价目标 = 增加收藏加购量
  - `KT05` 出价目标 = 稳定投产比（推荐档 6.89）
  - `KT06` 稳定投产比档位 = 5.51
  - `KT07` 稳定投产比档位 = 8.27
  - `KT08` 稳定投产比档位 = 自定义 7.11
- 已继续补齐 `趋势明星` 的成本与人群层：
  - `KT09` 平均直接成交成本 = 默认档 370.9
  - `KT10` 平均直接成交成本 = 445.08
  - `KT11` 平均直接成交成本 = 296.72
  - `KT12` 平均直接成交成本 = 自定义 333.33
  - `KT13` 设置优先投放客户 = 关
  - `KT14` 人群优化目标 = 关
  - `KT15` 新客户获取 = 关
  - `KT16` 流失老客挽回 = 关
  - `KT17` 高价值客户获取 = 关
  - `KT18` 新客户倍率 = 1.8
  - `KT19` 高价值客户倍率 = 1.6
- 已继续补齐 `趋势明星` 的商品与主题层：
  - `KT20` 选择趋势主题 = 补满第 6 个主题（美的酷省电二代空调）
  - `KT21` 清空 = 趋势主题与商品全部清空
  - `KT22` 添加自选商品 = 新增 `1029803691231`
- 已继续补齐 `趋势明星` 的高级设置层：
  - `KT23` 投放地域 = 取消上海
  - `KT24` 投放时间 = `08:00-13:00`
- 已追加复核 `趋势明星 -> 设置平均直接成交成本`：
  - 旧样本默认档 `constraintValue = 370.9`
  - 当前页面在 `dayAverageBudget = 1430` 下，默认档已变为 `362.56`
  - 结论：默认档是动态值，不能硬编码
- 已补齐用户指出的遗漏点：
  - `核心词设置 -> 添加关键词`
- 已新增 `关键词推广 -> 流量金卡` 的基线与首批分支：
  - `GK01` 类目精准词卡基线（`packageId=47, planId=171, orderAmount=500`）
  - `GK02` 百亿秒杀节-大促成交抢量卡（`packageId=2008, planId=158, orderAmount=3000`）
  - `GK03` 一人食炖煮家电高转化卡（补商品到 `8/30` 后可提交）
  - `GK04` 增量畅享包（`planId=228, orderAmount=10000`）
  - `GK05` 自定义成交包（`planId=229, orderAmount=30000`）
  - `GK06` 冷启加速=关（`coldStartStatus=0`）
  - `GK07` 套餐包自动续投=关（`orderAutoRenewalSwitch=0`）
  - `GK08` 设置自动续投门槛（当前样本 `orderAutoRenewalCondition` 仍为空）
  - `GK09` 点击支付宝支付（当前样本 `orderChargeType` 仍为 `balance_charge`）
- 已新增 `关键词推广 -> 自定义推广` 基线：
  - `KD01` 自定义选品基线（加商品后）：
    - `promotionScene=promotion_scene_search_user_define`
    - `itemSelectedMode=user_define`
    - `bidTypeV2=smart_bid`
    - `bidTargetV2/optimizeTarget=conv`
    - `dmcType=day_average, dayAverageBudget=1480`
    - `itemIdListLength=8, adgroupListLength=8`
- 已补齐 `自定义推广` 的关键分支：
  - `KD02` `AI点睛=关`（`aiMaxSwitch=0`）
  - `KD03` `核心词设置->添加关键词(洗碗机家用全自动)`（新增词同步写入全部 `8` 个 adgroup）
- 已补齐 `趋势明星` 的高级设置最后分支：
  - `KT25` `投放资源位=仅1个开启`（`adzoneList` 呈现 `pause + start` 组合）

## 验证记录
- 浏览器连接：
  - `http://127.0.0.1:9222/json/version` 正常返回 `webSocketDebuggerUrl`
  - `chrome-devtools` MCP 可正常列出并切换页签
- 页面切换：
  - 已成功从 `onebpSite` 切到 `onebpSearch`
  - 当前默认子目标为 `搜索卡位`
- 离线提交：
  - 已通过 `一键上车` 自动加入 `5` 个商品
  - 页面自动带出 `dayAverageBudget = 1640`
  - 离线提交命中：
    - `POST https://one.alimama.com/solution/addList.json?...&bizCode=onebpSearch`
- 添加关键词补抓：
  - 已打开 `添加关键词` 弹窗并勾选推荐词 `美的小魔方`
  - 确认后主页面从 `10` 个关键词变为 `11` 个关键词
  - 为保证可提交态，重新通过 `一键上车` 恢复 `5` 个商品后执行离线触发
- 手动输入与匹配方式补抓：
  - 已通过 `点击此处可手动输入添加关键词` 新增手动词 `方太水槽`
  - 确认后主页面从 `11` 个关键词变为 `12` 个关键词
  - 手动词对象已确认带 `isManual = true`、`originalWord = "方太水槽"`、默认 `matchScope = "4"`
  - 已确认 `matchScope` 映射：
    - `广泛 = "4"`
    - `中心词 = "16"`
    - `精准 = "1"`
- 清空补抓：
  - 点击 `清空` 后无二次确认，关键词立即归零
  - 商品区域同时回落到 `0 / 30`
  - 即便页面进入空态，离线点击 `创建完成` 仍会发 `POST addList.json`
- `位置不限提升市场渗透` 复抓：
  - 已确认该分支真实可选，最终提交不是 `home_page`
  - 真实提交字段为：
    - `searchDetentType = permeability`
  - 页面存在一个关键行为：
    - 先选 `位置不限提升市场渗透` 再 `一键上车` 加商品时，页面会自动重置回 `抢首条`
    - 提交前必须重新选一次 `位置不限提升市场渗透`
- `趋势明星` 基线补抓：
  - 已成功切到：
    - `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSearch&promotionScene=promotion_scene_search_trend`
  - 离线提交仍命中：
    - `POST https://one.alimama.com/solution/addList.json?...&bizCode=onebpSearch`
  - 已确认基线结构核心字段：
    - `promotionScene = promotion_scene_search_trend`
    - `itemSelectedMode = trend`
    - `trendType = 0`
    - `bidTypeV2 = smart_bid`
    - `bidTargetV2 = conv`
    - `optimizeTarget = conv`
    - `trendThemeListLength = 5`
    - `itemIdListLength = 9`
    - `adgroupListLength = 9`
    - `crowdListLength = 5`
    - `campaignColdStartVO.coldStartStatus = 1`
    - `dayAverageBudget = 1640`
- `趋势明星` 分支补抓：
  - 已确认冷启加速关闭后：
    - `campaignColdStartVO.coldStartStatus = 0`
  - 页面可见 checkbox 直接点击时曾出现：
    - `系统异常，请稍后重试。status=0`
  - 但底层开关实际切换后，请求体会稳定带出 `coldStartStatus = 0`
  - 已确认出价目标映射：
    - `获取成交量 = bidTargetV2 / optimizeTarget = conv`
    - `增加收藏加购量 = bidTargetV2 / optimizeTarget = coll_cart`
    - `增加点击量 = bidTargetV2 / optimizeTarget = click`
    - `稳定投产比 = bidTargetV2 = roi`，且不再提交 `optimizeTarget / setSingleCostV2`
  - 已确认 `稳定投产比` 额外字段：
    - `constraintType = roi`
    - `constraintValue` 会随档位变化
  - 已确认的 ROI 档位：
    - `5.51`
    - `6.89`
    - `8.27`
    - `自定义 7.11`
  - 已确认 `设置平均直接成交成本` 会改写提交模型：
    - `bidTargetV2` 仍是 `conv`
    - 新增：
      - `setSingleCostV2 = true`
      - `constraintType = dir_conv`
      - `constraintValue`
    - `optimizeTarget` 不再提交
  - 已确认的平均直接成交成本档位：
    - 默认档 `370.9`
    - `445.08`
    - `296.72`
    - 自定义 `333.33`
  - 已确认人群总开关行为：
    - `设置优先投放客户 = 关 -> crowdList = []`
    - `人群优化目标 = 关 -> crowdList = []`
  - 已确认客群开关到 `crowdList` 的映射：
    - `新客户获取 = 关 -> 删除 3008_3000949_3000949`
    - `流失老客挽回 = 关 -> 删除 3009_3000951_3000951`
    - `高价值客户获取 = 关 -> 一次性删除 3 条 3010_*`
  - 已确认倍率字段会真实落到 `crowdList.price.discount`：
    - 基线 `1.3 / 1.5 / 1.3 -> 30 / 50 / 30`
    - 自定义样本：
      - `新客户 1.8 -> 80`
      - `高价值 1.6 -> 60 / 60 / 60`
  - 已确认 `选择趋势主题` 补到第 6 个主题后：
    - `trendThemeListLength = 6`
    - 新增主题：
      - `895617013 / 美的酷省电二代空调 / itemCount = 0`
    - `itemIdListLength / adgroupListLength` 仍保持 `9`
  - 已确认 `清空` 后：
    - `trendThemeList = []`
    - `itemIdList = []`
    - `adgroupList = []`
    - `campaignColdStartVO.coldStartStatus = 0`
    - `crowdList / adzoneList / launchAreaStrList / launchPeriodList` 仍保留默认值
  - 已确认 `添加自选商品` 样本：
    - 为避免真实提交，改用页面内拦截 `addList.json` 的方式取最终请求体
    - 新增商品：
      - `1029803691231 / 美的洗碗机V6pro灶下家用15套大容量全自动热风烘干消毒一体机`
    - `itemIdListLength = 10`
    - `adgroupListLength = 10`
    - `trendThemeListLength` 仍为 `6`
    - 页面“将暂停全站推场景计划”提示未进入请求体
  - 页面存在一个重要联动异常：
    - 关闭单个客群时，界面上的 `人群优化目标` 会被联动取消选中
    - 但真实提交仍会保留剩余 `crowdList`
- `流量金卡` 分支补抓：
  - 已确认三张解决方案卡会整体切换模板（包/词/货/周期联动变化）：
    - `类目精准词卡`：`packageId=47, planId=171, itemIdListLength=5, wordListLength=0`
    - `百亿秒杀节-大促成交抢量卡`：`packageId=2008, planId=158, itemIdListLength=3`
    - `一人食炖煮家电高转化卡`：先补商品到 `8/30` 后可提交，`packageId=2004, planId=227, wordListLength=49`
  - 已确认套餐包档位映射（基于一人食卡）：
    - `基础起量包 -> planId=227, orderAmount=3000`
    - `增量畅享包 -> planId=228, orderAmount=10000`
    - `自定义成交包 -> planId=229, orderAmount=30000`
  - 已确认开关行为：
    - `冷启加速=关 -> campaignColdStartVO.coldStartStatus=0`
    - `套餐包自动续投=关 -> orderAutoRenewalInfo.orderAutoRenewalSwitch=0`
  - 已确认当前限制：
    - `设置自动续投门槛` 当前样本未写入有效阈值（`orderAutoRenewalCondition` 仍为空）
    - 点击 `支付宝支付` 后当前样本仍是 `orderChargeType=balance_charge`
- `自定义推广` 补抓：
  - 已确认可提交基线 `KD01`（需先加商品到 `8/30`）
  - 已确认 `AI点睛=关` 可稳定触发 `addList.json`
  - 已确认 `核心词设置 -> 添加关键词` 会改写 `adgroupList[*].wordList`
- 已确认字段：
  - `promotionScene = promotion_scene_search_detent`
  - `itemSelectedMode = search_detent`
  - `searchDetentType`
  - `campaignColdStartVO.coldStartStatus`
  - `wordList`
  - `wordPackageList`
  - `itemIdList`
  - `adzoneList`
  - `launchAreaStrList`
  - `launchPeriodList`
  - `dmcType = day_average`
  - `dayAverageBudget = 1640`
- 已确认分支：
  - `抢首条 -> searchDetentType = first_place`
  - `抢前三 -> searchDetentType = third_place`
  - `抢首页 -> searchDetentType = home_page`
  - `冷启加速 = 关 -> campaignColdStartVO.coldStartStatus = 0`
  - `添加关键词（推荐词：美的小魔方） -> wordListCount = 11，新增词插入 wordList[0]，matchScope = "4"，recReason = "aiRecWord"`
  - `手动输入关键词（方太水槽） -> wordListCount = 12，wordList[0].isManual = true，originalWord = "方太水槽"`
  - `手动词切到中心词 -> wordList[0].matchScope = "16"`
  - `手动词切到精准 -> wordList[0].matchScope = "1"`
  - `清空关键词 -> wordList = []，itemIdList = []，adgroupList = []，但仍会 POST addList.json`
  - `位置不限提升市场渗透 -> searchDetentType = permeability`
  - `趋势明星基线 -> bidTypeV2 = smart_bid，bidTargetV2 = conv，optimizeTarget = conv，trendThemeListLength = 5，itemIdListLength = 9，crowdListLength = 5`
  - `趋势明星冷启加速 = 关 -> campaignColdStartVO.coldStartStatus = 0`
  - `趋势明星出价目标 = 增加收藏加购量 -> bidTargetV2 / optimizeTarget = coll_cart`
  - `趋势明星出价目标 = 增加点击量 -> bidTargetV2 / optimizeTarget = click`
  - `趋势明星出价目标 = 稳定投产比 -> bidTargetV2 = roi，新增 constraintType = roi / constraintValue，且不再提交 optimizeTarget / setSingleCostV2`
  - `趋势明星稳定投产比档位 5.51 -> constraintValue = 5.51`
  - `趋势明星稳定投产比档位 8.27 -> constraintValue = 8.27`
  - `趋势明星稳定投产比自定义 7.11 -> constraintValue = 7.11`
  - `趋势明星平均直接成交成本默认档 370.9 -> setSingleCostV2 = true，constraintType = dir_conv，constraintValue = 370.9，且不再提交 optimizeTarget`
  - `趋势明星平均直接成交成本 445.08 -> constraintValue = 445.08`
  - `趋势明星平均直接成交成本 296.72 -> constraintValue = 296.72`
  - `趋势明星平均直接成交成本自定义 333.33 -> constraintValue = 333.33`
  - `趋势明星设置优先投放客户 = 关 -> crowdList = []`
  - `趋势明星人群优化目标 = 关 -> crowdList = []`
  - `趋势明星新客户获取 = 关 -> crowdList 删除 3008_3000949_3000949`
  - `趋势明星流失老客挽回 = 关 -> crowdList 删除 3009_3000951_3000951`
  - `趋势明星高价值客户获取 = 关 -> crowdList 仅剩 3008 / 3009 两条`
  - `趋势明星新客户倍率 1.8 -> 3008 对应 discount = 80`
  - `趋势明星高价值客户倍率 1.6 -> 全部 3010_* 对应 discount = 60`
  - `趋势明星选择趋势主题补到 6 个 -> trendThemeList[5] = 895617013 / 美的酷省电二代空调 / itemCount = 0，itemIdListLength 仍为 9`
  - `趋势明星清空 -> trendThemeList = []，itemIdList = []，adgroupList = []，coldStartStatus = 0`
  - `趋势明星添加自选商品 1029803691231 -> itemIdListLength = 10，adgroupListLength = 10，trendThemeListLength 仍为 6`
  - `流量金卡类目精准词卡基线 -> packageId=47，planId=171，orderAmount=500，wordListLength=0，itemIdListLength=5`
  - `流量金卡百亿秒杀节基线 -> packageId=2008，planId=158，orderAmount=3000，itemIdListLength=3`
  - `流量金卡一人食基线（补商品后） -> packageId=2004，planId=227，orderAmount=3000，wordListLength=49，itemIdListLength=8`
  - `流量金卡一人食增量畅享包 -> planId=228，orderAmount=10000`
  - `流量金卡一人食自定义成交包 -> planId=229，orderAmount=30000`
  - `流量金卡冷启加速=关 -> coldStartStatus=0`
  - `流量金卡自动续投=关 -> orderAutoRenewalSwitch=0，且无二次确认弹窗`
  - `流量金卡自动续投门槛勾选 -> orderAutoRenewalCondition 仍为空`
  - `流量金卡点击支付宝支付 -> 当前样本 orderChargeType 仍为 balance_charge`
  - `自定义推广基线（KD01） -> promotionScene=promotion_scene_search_user_define，bidTypeV2=smart_bid，bidTargetV2/optimizeTarget=conv，dayAverageBudget=1480，itemIdListLength=8`
  - `自定义推广 AI点睛=关（KD02） -> aiMaxSwitch=0，aiMaxInfo.aiMaxSwitch=0，itemIdListLength=8，adgroupListLength=8`
  - `自定义推广添加关键词（KD03） -> 新词“洗碗机家用全自动”进入全部8个adgroup.wordList，matchScope=1，isManual=true`
  - `趋势明星高级设置投放资源位（KT25） -> adzoneList: 114790550288=status pause，114786650498=status start`

## 结果复盘
- `onebpSearch` 的默认 `搜索卡位` 和 `onebpSite` 结构差异很大，后续开发不能复用全站推广的 ROI/起量模型。
- 这个场景的核心不是 ROI，而是：
  - `wordList`
  - `wordPackageList`
  - `searchDetentType`
  - `campaignColdStartVO`
  - `adzoneList / launchAreaStrList / launchPeriodList`
- 已补齐本轮明确遗漏点：
  - `核心词设置 -> 添加关键词` 已单独记录，且确认它不会改写商品、卡位方式、预算类型等基线结构，只会扩展 `wordList` 并追加 `aiword` 恢复信息。
- 核心词设置这组高频分支目前已补齐：
  - 推荐词新增
  - 手动输入新增
  - `广泛 / 中心词 / 精准` 三档映射
  - 清空关键词
- `位置不限提升市场渗透` 也已从“待确认”转为“已确认”：
  - 真实值是 `permeability`
  - 但“先选卡位再加商品”会被页面重置，自动化顺序必须调整为“加商品后再选卡位”
- `趋势明星` 与 `搜索卡位` 的结构差异已经明确：
  - `搜索卡位` 以 `wordList / searchDetentType` 为核心
  - `趋势明星` 以 `trendThemeList / crowdList / bidTargetV2` 为核心
- `趋势明星 -> 高级设置` 追加验证：
  - `投放地域` 从 `["all"]` 切为部分地域后，会改成数值型 `launchAreaStrList`
  - `投放时间` 编辑态虽然是半小时网格，但提交体会压缩成 `launchPeriodList`
  - `08:00-13:00` 样本已确认会序列化为每周 `7` 条、每条 `3` 段的 `timeSpanList`
  - `投放资源位` 关闭单个资源位后，提交体不是删项，而是对应 `adzone.status` 由 `start` 变为 `pause`
- `趋势明星 -> 稳定投产比` 还存在一层子配置：
  - 同样是 `bidTargetV2 = roi`，真正决定 ROI 强弱的是 `constraintValue`
  - 后续开发不能只识别“是否 ROI”，还要序列化具体档位或自定义值
- `趋势明星 -> 设置平均直接成交成本` 是另一条独立的 `conv` 约束链路：
  - 它不是简单布尔开关，而是改为 `setSingleCostV2 + constraintType = dir_conv + constraintValue`
  - 后续开发不能把它和普通 `conv / optimizeTarget` 混成同一结构
  - 补充复核已确认 `constraintValue` 会随页面当前预算/商品状态变化，默认档并不固定
- `趋势明星 -> crowdList` 不是按 UI 行数一一对应：
  - `新客户获取 = 1` 条
  - `流失老客挽回 = 1` 条
  - `高价值客户获取 = 3` 条
- `趋势明星` 的剩余商品层也已经明确：
  - `补主题` 只改 `trendThemeList`
  - `加自选商品` 只扩 `itemIdList / adgroupList`
  - `清空` 会一起清空 `trendThemeList / itemIdList / adgroupList`
- 从多组样本可推断倍率与折扣的换算规则是：
  - `price.discount ≈ (倍率 - 1) * 100`
- 单个人群关闭会把 `人群优化目标` 的视觉状态一起取消，但请求体仍会带剩余人群：
  - 自动化与后续开发必须以真实请求字段为准，不能只靠页面选中态判断
- 离线断网并不总能稳定拿到提交体：
  - `添加自选商品` 这条分支在断网下出现过状态回退且不发 `addList.json`
  - 后续若仍要求“只模拟不提交”，优先用页面内拦截 `addList.json` 的方式取参数，再阻断真实发送
- 当前仍待继续覆盖的上层分支：
  - `自定义推广 -> 出价目标 / 成本约束 / 预算类型` 分支
  - `流量金卡 -> 关键词设置 / 人群屏蔽` 的提交体差异

---

# TODO - 2026-04-28 `addList.md` 整理为开发文档

## 需求规格
- 目标：
  - 将仓库根目录 `addList.md` 从“抓包流水账”整理成“后续开发可直接查阅”的开发文档；
  - 保留真实页面抓取得到的关键请求结构、字段映射、分支差异、异常样本与覆盖范围；
  - 让后续开发在不回看会话的情况下，也能直接据此实现 `addList.json` 组包、字段映射与异常兼容。
- 范围：
  - 重构 `addList.md` 文档结构与章节表达；
  - 在 `tasks/todo.md` 回填计划、执行摘要与整理结果。
- 非目标：
  - 不新增新的页面抓包；
  - 不修改业务代码；
  - 不改动既有样本含义，仅调整表达与归类方式。

## 执行计划（可核对）
- [x] 盘点 `addList.md` 现有信息，区分“接口事实”“分支样本”“开发注意事项”三类内容。
- [x] 按开发文档格式重组 `addList.md`，补齐总览、字段映射、覆盖矩阵、异常说明与样本附录。
- [x] 自检文档可读性与信息完整度，并回填本节结果复盘。

## 改动摘要
- `addList.md`
  - 标题从“提交流量记录”重构为“`addList.json` 开发文档”；
  - 新增“开发先读”“接口总览”“字段映射”“样本索引”“已知异常”“后续追加规则”等章节；
  - 原有 `onebpSite` 13 条样本全部保留，但重排为“基线 + 分支附录”的开发向结构；
  - 把 `algoPredictionExtraInfo` 独立为附录，并明确其“结构可参考、数值不可硬编码”的开发语义。

## 验证记录
- 文档结构自检：
  - 已确认 `addList.md` 具备 13 个一级/二级开发章节，覆盖“抓取方式、接口结构、字段映射、样本附录、异常说明、追加规则”。
  - 已确认 `S01` 到 `S13` 样本索引与详细附录均保留，未丢失已有抓包结论。
  - 已确认关键异常样本仍保留：
    - `campaignGroupId = null`
    - `campaignGroupName = "小白鲸"`
- 自动化测试：
  - 本次仅整理文档，未修改业务代码，未运行测试。

## 结果复盘
- `addList.md` 已从“按时间堆叠的抓包流水账”转成“面向开发实现的结构化文档”，后续做 `addList.json` 组包时可先看字段映射，再按样本附录核对分支差异。
- 这次整理保留了全部已抓取事实，但把“接口事实”“字段语义”“分支样本”“已知异常”四类信息拆开，后续查文档不需要再全文扫读。

---

# TODO - 2026-04-15 出价调控保留 + 新增净投产比调控并存

## 需求规格
- 目标：
  - 不删除“出价调控（bidConstraintValue）”；
  - 在手动设置与方案展示中新增并保留“净投产比调控（netBidConstraintValue）”；
  - 面板未配置/未勾选的方案默认不执行；
  - 方案名称全量展示，状态独立展示，详情保留方案介绍。
- 范围：
  - `src/optimizer/ui.js`（方案表映射、弹窗读取、手动面板模板/读写/回填）；
  - `tests/optimizer-escort-new-flow-fallback.test.mjs`（文案与结构断言）；
  - 浏览器实页“立即检查并优化”复测。
- 非目标：
  - 不改 openV3 请求结构；
  - 不改与护航无关逻辑。

## 执行计划（可核对）
- [x] 补齐 `ui.js` 里出价/净投产比双方案的名称、详情、读取与手动表单字段。
- [x] 更新测试断言，确保“出价调控 + 净投产比调控并存”长期稳定。
- [x] 运行目标测试、全量测试与构建校验。
- [x] 在真实阿里妈妈页面点击“立即检查并优化”验证勾选与执行一致。

## 改动摘要
- `src/optimizer/ui.js`
  - `escortSettingTable` 默认顺序保留并新增双方案：`出价调控(bidConstraintValue)` + `净投产比调控(netBidConstraintValue)`；
  - 详情文案拆分为两条默认说明：出价与净投产比分别兜底；
  - 护航弹窗精确读取补齐三路映射：出价/净投产比/预算，分别读取开关、区间、次数、次日恢复；
  - 手动设置面板新增“净投产比调控”独立卡片（`manual-net-bid-*`），并保留“出价调控”原卡片；
  - 表单读写/回填/主从勾选同步逻辑均纳入 `netBidConstraintValue`。
- `tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 更新全量方案顺序断言为包含 `netBidConstraintValue`；
  - 更新详情兜底断言为“出价 + 净投产比 + 预算”三路；
  - 更新手动面板断言为“双入口并存（manual-bid-enabled + manual-net-bid-enabled）”；
  - 更新弹窗精确读取断言为“出价/净投产比/预算”三路标签匹配。

## 验证记录
- `node --test tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 结果：`35/35 passed`
- `node scripts/build.mjs`
  - 结果：构建成功（v7.02）
- `node --test tests/*.test.mjs`
  - 结果：`403 passed, 0 failed, 2 skipped`
- 浏览器实页（`one.alimama.com`，点击“立即扫描并优化”）
  - 关键日志：
    - `使用手动设置参数（未勾选）：6 个设置项`
    - 方案表同时展示：
      - `出价调控` -> `未勾选`
      - `净投产比调控` -> `未勾选`
      - `预算调控` -> `未勾选`
      - `添加关键词/切换关键词匹配方式/屏蔽关键词` -> `未勾选`
  - 结论：手动未勾选时不执行，且“出价调控 + 净投产比调控”并存显示生效。

## 结果复盘
- 根因：之前把 `bidConstraintValue` 语义替换成净投产比，导致“新增需求”被误做成“替换方案”。
- 修复：恢复出价方案原语义，新增 `netBidConstraintValue` 独立链路，并在展示、读取、手动面板、回归测试四层同步落地。

---

# TODO - 2026-04-15 手动设置与方案执行映射一致性（净投产比调控补齐）

## 需求规格
- 目标：
  - 手动设置面板中补齐“净投产比调控”配置入口（参考预算/原出价调控卡片）；
  - 方案表“方案名称”需全量展示，不因是否执行而缺失；
  - 若手动设置未开启对应方案，则默认不执行；
  - 保留方案详情介绍文案，不回退为错误状态语义。
- 范围：
  - `src/optimizer/ui.js` 手动设置 UI、读取/回填、方案名称映射；
  - `src/optimizer/core.js` 方案别名匹配与提交映射稳定性；
  - `tests/optimizer-escort-new-flow-fallback.test.mjs` 回归断言；
  - 真实阿里妈妈页面点击“立即检查并优化”复测。
- 非目标：
  - 不改动接口协议；
  - 不改动与护航设置无关模块。

## 执行计划（可核对）
- [x] 新增手动设置“净投产比调控”面板与表单读写，沿用 `bidConstraintValue` 数据键。
- [x] 调整方案名称/默认详情文案，将 `bidConstraintValue` 统一展示为“净投产比调控”。
- [x] 校验“手动未配置/未勾选默认不执行”链路，避免回退为默认执行所有方案。
- [x] 更新回归测试并执行目标测试 + 全量测试 + 构建。
- [x] 浏览器真实页面点击“立即扫描并优化”验证执行状态与手动设置一致。

## 改动摘要
- `src/optimizer/ui.js`
  - 手动设置面板把原“出价调控（成本）”统一为“净投产比调控”，并补齐对应读写与展示字段；
  - 方案表渲染改为“全量方案名称 + 独立状态列 + 详情列保留方案介绍/配置说明”；
  - 弹窗读取支持“净投产比调控/成本调控”标签兼容，避免线上字段差异导致映射失败。
- `src/optimizer/core.js`
  - `bidConstraintValue` 增加“净投产比/净投产比调控”别名；
  - 手动合并时按 `manualTargetKeySet` 对所有方案显式收敛：未在手动配置内一律 `enabled=false`；
  - 主开关未勾选时通过 `buildManualDisabledOverride` 强制全部方案按未勾选提交，不再回退默认执行。
- `tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 更新净投产比文案与标签读取断言；
  - 新增“未在手动面板配置默认关闭”与“手动未勾选不执行”回归断言。

## 验证记录
- `node --test tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 结果：`35/35 passed`
- `node scripts/build.mjs`
  - 结果：构建成功（v7.02）
- `node --test tests/*.test.mjs`
  - 结果：全量通过（dot reporter 退出码 `0`）
- 浏览器实页（`one.alimama.com`，点击“立即扫描并优化”）：
  - 场景A：主开关未勾选、子项未勾选，方案表展示 `净投产比调控/预算调控/添加关键词/切换关键词匹配方式/屏蔽关键词`，状态均为 `未勾选`；
  - 场景B：主开关仍未勾选，但手动勾选“净投产比调控 + 预算调控”子项再执行，结果仍全部 `未勾选`，提交来源为 `手动设置参数（未勾选）`；
  - 详情列保留方案说明（如范围、次数、次日恢复、关键词偏好），未被状态文案覆盖。

## 结果复盘
- 根因：提交层在“手动主开关未勾选”场景下会回退默认执行语义，且方案键别名不完整，导致预算/净投产比出现误执行感知。
- 修复：统一净投产比方案键映射；提交层显式以手动快照收敛所有方案 `enabled`；未勾选主开关时强制“全部未勾选提交”。
- 结论：手动面板与方案执行已对齐，且方案名称与详情展示保持稳定。

---

# TODO - 2026-04-15 用户复测“还是一样生效”闭环复核（小万护航手动设置）

## 需求规格
- 目标：
  - 处理用户“还是一样生效了”的复测反馈，确认“使用手动设置提交”主开关与执行方案严格一致；
  - 在真实阿里妈妈页面点击“立即扫描并优化”完成闭环验证。
- 范围：
  - 浏览器实页复测“主开关关闭/开启”两条链路；
  - 校验执行日志中的提交来源与方案数量，确认不再出现“默认执行所有方案”误判。
- 非目标：
  - 不新增业务字段；
  - 不改动与本问题无关模块。

## 执行计划（可核对）
- [x] 定位方案详情被“状态文案”覆盖的触发分支。
- [x] 调整 `escortSettingTable` 详情构造：详情优先展示方案介绍，状态仅在“状态”列呈现。
- [x] 更新回归测试，防止详情再次被“未开启”回退覆盖。
- [x] 构建并在真实阿里妈妈页面复测“立即扫描并优化”。

## 改动摘要
- `src/optimizer/ui.js`
  - 新增详情文本归一化/去重逻辑；
  - 新增配置描述提取逻辑（`description/desc/intro/...`）；
  - 新增默认方案介绍文案映射（出价/预算/关键词类）；
  - 移除“详情列回退为已开启/未开启”逻辑，状态由“状态列”单独表达。
- `tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 更新“方案详情保留介绍文案”断言，改为校验默认介绍文案与“不再回退未开启”。

## 验证记录
- `node --test tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 结果：`33/33 passed`
- `node scripts/build.mjs`
  - 结果：构建成功，产物刷新（v7.02）
- 浏览器实页（`one.alimama.com`，点击“立即扫描并优化”）
  - 结果：日志表格显示 `方案名称 / 状态 / 详情`；
  - 详情示例：
    - `净投产比调控`：`范围 13-39；最多 10 次/日；次日不恢复`
    - `预算调控`：`范围 50-不限；最多 20 次/日；次日恢复初始值`
    - `切换关键词匹配方式`：`自动在广泛匹配与精准匹配间切换`
    - `屏蔽关键词`：`自动屏蔽低转化关键词`

## 结果复盘
- 根因：详情兜底复用了状态语义，导致未开启时“方案介绍”被覆盖。
- 修复策略：状态与详情职责彻底分离，详情优先使用后端描述与方案介绍，缺省再用功能性介绍兜底。

---

# TODO - 2026-04-15 手动未勾选仍执行预算/净投产比（二次复测闭环）

## 需求规格
- 目标：
  - 修复“手动设置主开关未勾选时，方案仍默认执行预算调控/净投产比调控”的映射错位；
  - 在真实阿里妈妈页面点击“立即扫描并优化”验证状态与手动设置一致。
- 范围：
  - `openV3` 提交设置来源解析；
  - 回归测试与浏览器实测。
- 非目标：
  - 不改动业务接口；
  - 不改动无关模块。

## 执行计划（可核对）
- [x] 修复提交层在“手动未勾选”场景下的设置来源，禁止回退为诊断/默认执行方案。
- [x] 修正对应回归断言并通过目标测试。
- [x] 完整跑测并构建产物。
- [x] 真实页面执行“立即扫描并优化”复测方案状态与来源文案。

## 改动摘要
- `src/optimizer/core.js`
  - `resolveOpenV3Setting` 读取手动设置快照时改为 `includeDisabled: true`；
  - 新增“手动主开关未勾选”分支：构造 `operationList: []` 的手动设置提交；
  - 来源文案明确为 `手动设置参数（未勾选）`，并标记 `fromManual = true`。
- `tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 补充并修正“手动未启用仍按手动快照提交”的断言；
  - 修复一条因分支结构升级导致的过期正则断言。

## 验证记录
- `node --test tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 结果：`33/33 passed`
- `node --test tests/*.test.mjs`
  - 结果：`401 passed, 0 failed, 2 skipped`
- `node scripts/build.mjs`
  - 结果：构建成功（v7.02）
- 浏览器实页（`one.alimama.com`，点击“立即扫描并优化”）
  - 结果：
    - 日志显示：`使用手动设置参数（未勾选）：5 个设置项`
    - 方案表状态显示：`出价调控/预算调控/添加关键词/切换匹配/屏蔽关键词` 全部为 `未勾选`
    - 不再出现 `预算调控`、`净投产比调控` 被误标为 `已执行`。

## 结果复盘
- 根因：主开关未勾选时，提交层仍可能回退到诊断/默认设置来源，导致执行状态与手动设置错位。
- 修复策略：在提交层显式保留“手动未勾选”语义，提交来源与展示状态统一以手动快照为准。

---

# TODO - 2026-04-15 手动子项勾选后未执行（净投产比与全项复测）

## 需求规格
- 目标：
  - 修复“手动面板勾选净投产比调控后执行未生效”；
  - 检查其它手动子项是否存在同类问题；
  - 在真实页面浏览器中回归到通过为止。
- 范围：
  - 手动主开关与子项勾选联动逻辑；
  - 护航执行状态渲染链路验证。
- 非目标：
  - 不改动接口协议；
  - 不改动与手动设置无关模块。

## 执行计划（可核对）
- [x] 复现“仅勾子项、主开关未开”场景，确认执行链路来源与状态。
- [x] 修改主从联动：子项有勾选时自动开启主开关。
- [x] 更新回归测试覆盖新联动规则。
- [x] 构建并在 `one.alimama.com` 实页逐项验证（净投产比、出价、预算、加词、切换匹配、屏蔽）。

## 改动摘要
- `src/optimizer/ui.js`
  - `syncManualEscortMasterCheckbox` 改为：当任一主子项勾选时，自动 `master.checked = true`；
  - 保留部分勾选 `indeterminate` 语义，避免展示与提交状态不一致。
- `tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 将“主开关不反向开启”旧断言更新为“子项勾选自动开启主开关”；
  - 同步更新“外层与内层勾选状态保持同步”的正则断言。

## 验证记录
- `node --test tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 结果：`35/35 passed`
- `node --test tests/*.test.mjs`
  - 结果：`403 passed, 0 failed, 2 skipped`
- `node scripts/build.mjs`
  - 结果：构建成功（v7.02）
- 浏览器实页（`https://one.alimama.com/index.html#!/manage/search?...`）
  - 逐项单独勾选执行（单计划 `campaignId=69514602419`）：
    - `净投产比调控`：状态 `执行失败`（接口提示重复创建），其余项 `未勾选`；
    - `出价调控/预算调控/添加关键词/切换关键词匹配方式/屏蔽关键词`：各自状态 `已执行`，其余项 `未勾选`；
  - 每次“仅勾子项”时，主开关均自动变为勾选（`masterAfterChildCheck = true`）；
  - 全部不勾选执行时：6 项状态均为 `未勾选`。

## 结果复盘
- 根因：主开关关闭时，子项勾选不回写主开关，提交层按“手动未勾选”处理，造成“看起来勾了但不执行”。
- 修复：子项勾选反向开启主开关，确保面板视觉状态与提交语义一致。

---

# TODO - 2026-04-16 小万护航面板初始宽度放大 + 净投产比默认下限调整

## 需求规格
- 目标：
  - 小万护航在“未开始优化前”的面板宽度放大 1/3；
  - 手动设置中“净投产比调控”的下限默认值改为 `20`。
- 范围：
  - `src/optimizer/ui.js` 面板初始/恢复宽度与净投产比默认回填；
  - `src/optimizer/bootstrap.js` 默认配置基线。
- 非目标：
  - 不改动执行链路与接口协议；
  - 不改动其它方案的默认下限。

## 执行计划（可核对）
- [x] 定位并统一“未开始优化前”宽度设置入口（初始化与返回态）。
- [x] 调整净投产比下限默认值（读取 fallback、表单 fallback、默认配置）。
- [x] 跑回归测试并构建产物。

## 改动摘要
- `src/optimizer/ui.js`
  - 新增 `idlePanelWidthPx = 667`（500 放大约 1/3）；
  - 初始化面板 `width/min-width` 改为 `667px`；
  - `restoreIdlePanelView` 恢复宽度改为 `667px`；
  - `manual-net-bid-lower` 默认读取/回填从 `0.15` 改为 `20`；
  - 手动设置默认对象 `netBidConstraintValue.lowerLimit` 从 `0.15` 改为 `20`。
- `src/optimizer/bootstrap.js`
  - 默认配置 `manualEscortSetting.netBidConstraintValue.lowerLimit` 从 `0.15` 改为 `20`。

## 验证记录
- `node --test tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 结果：`35/35 passed`
- `node --test tests/*.test.mjs`
  - 结果：`403 passed, 0 failed, 2 skipped`
- `node scripts/build.mjs`
  - 结果：构建成功（v7.02）

## 结果复盘
- 这次改动为纯 UI 与默认值层，不影响执行协议；
- 初始宽度与返回态宽度已统一，避免“优化后返回时宽度不一致”。
# TODO - 2026-04-27 `sycm.taobao.com` 插件真实页面测试

## 需求规格
- 目标：
  - 打开真实 `sycm.taobao.com` 页面，验证当前仓库插件能否正常加载；
  - 确认页面侧是否出现插件注入痕迹、控制台是否有报错、基础交互是否可用；
  - 输出明确的测试结论与阻塞点，避免只停留在“页面能打开”层面。
- 范围：
  - 当前仓库构建产物 `dist/extension/`；
  - Chrome DevTools MCP 真实浏览器测试；
  - `sycm.taobao.com` 页面加载、注入、控制台、网络与页面痕迹检查。
- 非目标：
  - 不在本轮修改业务逻辑；
  - 不替代后续更细的功能专项回归。

## 执行计划（可核对）
- [ ] 回顾仓库说明、历史教训与当前插件加载方式。
- [ ] 构建最新扩展产物，确保浏览器加载的是当前代码。
- [ ] 打开真实 `sycm.taobao.com` 页面并确认页面完成刷新。
- [ ] 检查插件注入痕迹、控制台日志与关键页面交互。
- [ ] 在本文档回填测试结果、结论与后续动作。

## 改动摘要
- 待执行。

## 验证记录
- 待执行。

## 结果复盘
- 待执行。

---

# TODO - 2026-04-27 `one.alimama.com` 新建计划提交流量摸排

## 需求规格
- 目标：
  - 打开真实 `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSite` 新建计划页面；
  - 在“不真实提交”的前提下，按“每个计划类型 × 每个可选分支”逐一尝试，并尽可能触发到提交前最后一步；
  - 记录每类计划显示条件、点击路径、是否依赖先添加商品，以及提交前请求的 URL、Method、Query、Body、Header/鉴权关键信息；
  - 输出后续开发可直接复用的参数清单与差异点。
- 范围：
  - Chrome DevTools MCP 真实页面测试；
  - 页面 UI 路径梳理、网络请求抓取、提交前参数归档；
  - `tasks/todo.md` 结果回填。
- 非目标：
  - 不真实提交计划；
  - 不在本轮直接修改业务代码；
  - 不伪造不存在的入口，若页面因账号/商品状态不展示，只记录阻塞条件。

## 执行计划（可核对）
- [x] 回顾仓库约束、任务文档与现有脏工作树，避免覆盖无关改动。
- [x] 连接 Chrome DevTools，打开目标页面并确认运行态已刷新。
- [ ] 梳理新建计划入口，记录每个计划类型的显示前提与全部可选分支。
- [ ] 对每个可进入的计划类型、每个可选分支分别模拟填写到最后一步，逐次抓取提交前相关网络参数。
- [ ] 整理参数差异、公共字段、阻塞点与建议，回填本文档结果复盘。

## 改动摘要
- 已根据用户补充，把范围从“计划抽样”收紧为“每个计划 × 每个分支都要各自模拟提交并记录”。
- 记录载体已切换为仓库根目录 `addList.md`，后续提交流量参数与分支差异统一沉淀到该文件，`tasks/todo.md` 只保留任务管理与复盘。

## 验证记录
- `onebpSite` 全站推广页面已完成真实页面离线抓取，抓取方式为 `chrome-devtools` MCP + 页面内 `window.__AM_HOOK_MANAGER__`。
- 本轮新增覆盖分支：
  - `起量时间地域设置 = 8点~13点`
  - `起量地域 = 部分地域（取消上海）`
  - `设置计划组 = 归属到已有计划组（小白鲸）`
  - `设置计划组 = 不归属任何计划组`
  - `设置计划组 = 新建计划组并归属`
- 全部新增记录已集中写入仓库根目录 `addList.md`，未再散落到其它文档。

## 结果复盘
- 当前 `onebpSite` 全站推广页面可见的结构性分支已补齐，后续开发可以直接对照 `addList.md` 里的 13 条样本做组包。
- `起量时间地域设置` 最终都落在 `quickLiftBudgetCommand`：
  - 时间段字段是 `quickLiftTimeSlot`
  - 地域字段是 `quickLiftLaunchArea`
- `设置计划组` 有一条关键异常：
  - 选择“不归属任何计划组”后，`campaignGroupId` 会变成 `null`
  - 但 `campaignGroupName` 仍残留上一条已有组名称 `小白鲸`
  - 这意味着后续开发不能只看 `campaignGroupName` 判断是否真的归属了计划组。
