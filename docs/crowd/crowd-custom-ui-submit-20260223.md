# 人群推广-自定义推广-手动出价（插件 UI 实跑）

## 固定格式
### 1) RunMeta
- run_id: `crowd-custom-ui-submit-20260223-0316`
- run_at_gmt: `2026-02-22T19:16:11Z`
- page_url: `https://one.alimama.com/index.html#!/main/index?bizCode=onebpDisplay&promotionScene=promotion_scene_display_laxin`
- plugin_entry: `阿里助手 Pro -> 关键词建计划`
- ui_path: `新建计划 -> 场景=人群推广 -> 营销目标=自定义推广 -> 出价方式=手动出价 -> 批量创建`
- ui_result: `完成：成功 2，失败 0`

### 2) FinalRequest（目标商品 682357641421）
- reqid: `1887`
- method: `POST`
- endpoint: `/solution/addList.json?bizCode=onebpDisplay`
- request_file: `docs/crowd/req-1887-request.json`
- content_length: `46309`
- key_fields:
```json
{
  "bizCode": "onebpDisplay",
  "campaign.campaignName": "人群推广_20260223_031455_02_01",
  "campaign.promotionScene": "promotion_scene_item",
  "campaign.promotionType": "item",
  "campaign.subPromotionType": "item",
  "campaign.promotionStrategy": "zidingyi",
  "campaign.bidTypeV2": "custom_bid",
  "campaign.bidTargetV2": "display_pay",
  "campaign.optimizeTarget": "display_pay",
  "campaign.dmcType": "normal",
  "campaign.dayBudget": 100,
  "campaign.dayAverageBudget": null,
  "campaign.itemIdList": [682357641421],
  "campaign.crowdList.length": 10,
  "adgroupList[0].material.materialId": 682357641421,
  "adgroupList[0].material.materialName": "默认商品 682357641421"
}
```

### 3) FinalResponse（目标商品 682357641421）
- reqid: `1887`
- status: `200`
- response_file: `docs/crowd/req-1887-response.json`
- key_fields:
```json
{
  "info.ok": true,
  "info.errorCode": null,
  "info.message": null,
  "data.count": 1,
  "data.errorDetails": [],
  "data.list[0].campaignName": "人群推广_20260223_031455_02_01",
  "data.list[0].campaignId": 79260500889,
  "data.list[0].adgroupResultList[0].adgroupId": 79260474894,
  "data.list[0].adgroupResultList[0].errorMsg": null
}
```

### 4) SameBatch（同批次第二条）
- reqid: `1888`
- item_id: `989362689528`
- request_file: `docs/crowd/req-1888-request.json`
- response_file: `docs/crowd/req-1888-response.json`
- response_summary:
```json
{
  "info.ok": true,
  "campaignId": 79260618609,
  "adgroupId": 79299810325,
  "errorDetails": []
}
```
