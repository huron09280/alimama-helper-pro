# 关键词推广 / 自定义推广 浏览器真实测试记录

更新时间：2026-02-19 23:56

## 1. 测试目标

- 场景：`关键词推广`
- 营销目标：`自定义推广`
- 强制前置商品：`682357641421`
- 验证点：
  - 页面层级可完整加载并可点击到最细层。
  - 插件场景配置与页面设置映射一致。
  - 提交前快照字段正确（尤其 `promotionScene`、`bidTypeV2`、`bidMode`、`wordPackageCount`）。
  - 真实提交可成功返回 `campaignId`。

## 2. 环境与入口

- 页面：`https://one.alimama.com/index.html#!/main/index?bizCode=onebpSearch&promotionScene=promotion_scene_search_detent`
- 页面内向导：`关键词推广批量建计划 API 向导`
- 向导构建信息：`构建 2026-02-18 04:00`
- 调试 API：`window.__AM_WXT_KEYWORD_API__`

## 3. 层级点击覆盖（最细层）

已在向导内逐项触发以下按钮/配置（关键分组）：

1. 营销目标：`搜索卡位`、`趋势明星`、`流量金卡`、`自定义推广`
2. 出价方式：`智能出价`、`手动出价`
3. 出价目标：`获取成交量升级净成交`、`相似品跟投`、`抢占搜索卡位`、`提升市场渗透`、`增加收藏加购量`、`增加点击量`、`稳定投产比`
4. 预算类型：`每日预算`、`日均预算`
5. 选品方式：`自定义选品`、`行业推荐选品`
6. 冷启加速：`开启`、`关闭`
7. 人群设置：`智能人群`、`添加种子人群`、`设置优先投放客户`、`关闭`
8. 创意设置：`智能`、`专业`、`极简`
9. 投放资源位：`平台优选`、`自定义资源位` + 资源位配置入口
10. 投放时间：`长期投放`、`不限时段`、`固定时段` + 时段配置入口
11. 投放地域：`全部地域` + 地域配置入口
12. 关键词模式：`混合`、`仅手动`、`仅推荐`

说明：完整层级树和页面映射见 `docs/plan-create-hierarchy.md`。

## 4. 提交前快照校验（dry run）

通过 `collectWizardSubmitSnapshot`（`dryRunOnly=true`）验证：

- `sceneName=关键词推广`
- `marketingGoal=自定义推广`
- `promotionScene=promotion_scene_search_user_define`
- `bidTypeV2=smart_bid`
- `bidMode=smart`
- `wordListCount=14`
- `wordPackageCount=0`

结论：即使输入侧有 `manual`，在“自定义推广”下提交流水线仍归一为智能出价，并且词包数量为 0。

## 5. 真实提交结果

### 5.1 失败路径（已复现并定位）

- 请求：`reqid=7102`，`POST /solution/addList.json?bizCode=onebpSearch`
- 请求关键字段：
  - `campaign.promotionScene=promotion_scene_search_user_define`
  - `campaign.bidTypeV2=smart_bid`
  - `campaign.itemIdList=[682357641421]`
- 响应关键字段：
  - `info.ok=true`
  - `data.list[0].errorMsg=INVALID_PARAMETER：新增单元，流量智选词包校验失败`

### 5.2 成功路径（真实创建成功）

- 请求：`reqid=7119`，`POST /solution/addList.json?bizCode=onebpSearch`
- 请求关键字段：
  - `campaign.campaignName=PARITY_RT_关键词推广_1771516545084`
  - `campaign.promotionScene=promotion_scene_search_user_define`
  - `campaign.bidTypeV2=custom_bid`（失败后回退重试路径）
  - `campaign.itemIdList=[682357641421]`
- 响应关键字段：
  - `info.ok=true`
  - `data.errorDetails=[]`
  - `data.list[0].campaignId=79287144346`
  - `data.list[0].adgroupResultList[0].materialId=682357641421`

## 6. 日志与结论

- 日志中先出现系统侧拥塞/词包校验失败，再进入重试链路。
- 最终真实提交成功，返回有效 `campaignId=79287144346`。
- 结合 dry run 快照与真实提交通路，当前“关键词推广 / 自定义推广 / 指定商品 682357641421”场景已可完整操作并成功提交。
