# 阿里妈妈新建计划 `addList.json` 开发文档

> 本文件是阿里妈妈新建计划页“最终创建请求”抓取结果的唯一开发文档。
> 后续开发直接查这里，不再依赖会话上下文、临时笔记或 `tasks/todo.md`。

## 1. 文档定位

- 当前范围：
  - 仅覆盖 2026-04-27 抓取的 `onebpSite` 页面，即全站推广：
    - `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSite`
- 当前账号上下文：
  - 店铺：`美的洗碗机旗舰店`
  - 店铺 ID：`2957960066`
  - 页面内已添加商品数：`4`
- 当前覆盖口径：
  - 以“首件商品”作为字段差异基准；
  - 若某个控件是“按商品重复”的结构，默认先记录首件商品；
  - 只有发现跨商品结构差异时，才额外补记。

## 2. 抓取方式与安全边界

### 2.1 抓取方式

- 页面：真实 `one.alimama.com`
- 工具：`chrome-devtools` MCP + 页面内 `window.__AM_HOOK_MANAGER__`
- 提交口径：点击页面上的 `创建完成`，抓“提交前最后一跳”的 `addList.json`

### 2.2 安全策略

每次抓取都按下面顺序执行：

1. `window.__AM_HOOK_MANAGER__.clearRequestHistory()`
2. 将网络切到 `Offline`
3. 点击 `创建完成`
4. 页面报错：`系统异常，请稍后重试。status=0`
5. 从 hook 历史中读取最后一条 `addList.json`
6. 恢复网络

结论：

- 这样可以触发前端最终组包；
- 但不会真实创建计划；
- 当前文档中的样本全部来自这条离线提交流程。

## 3. 开发先读

- 后续实现建议按“基线模板 + 分支增量”组包，不要把 13 条样本硬编码成 13 份整包。
- `algoPredictionExtraInfo` 里的 `traceId`、推荐值、预算理由属于算法快照，结构可参考，具体值不要硬编码。
- `campaignGroupId` 才是判断是否归属计划组的主依据，`campaignGroupName` 可能残留脏值。
- 页面 DOM 节点 ID 会随重渲染变化，例如 `row_757440599385`，开发时不要依赖这些 ID。
- 当前文档只覆盖 `onebpSite` 全站推广；后续若继续摸排其它 `bizCode`，直接在本文件追加新章节。

## 4. 接口总览

### 4.1 最终提交接口

- Method：`POST`
- URL：
  - `https://one.alimama.com/solution/addList.json?csrfId=<CSRF_ID>&bizCode=onebpSite`

### 4.2 已确认关键请求头

- `referer: https://one.alimama.com/index.html`
- `x-requested-with: XMLHttpRequest`
- `accept: application/json, text/javascript, */*; q=0.01`
- `content-type: application/json`
- `bx-v: 2.5.36`

### 4.3 根级请求体结构

```json
{
  "bizCode": "onebpSite",
  "solutionList": [],
  "csrfId": "<CSRF_ID>",
  "strategyRecoverys": [],
  "loginPointId": "<LOGIN_POINT_ID>",
  "lrsIdList": []
}
```

### 4.4 `solutionList[i]` 关键结构

```json
{
  "campaign": {
    "promotionScene": "",
    "itemSelectedMode": "",
    "promotionType": "",
    "subPromotionType": "",
    "itemRecTrend": "",
    "campaignName": "",
    "campaignGroupId": "",
    "campaignGroupName": "",
    "bidType": "",
    "optimizeTarget": "",
    "constraintType": "",
    "constraintValue": 0,
    "dmcType": "",
    "multiTarget": {},
    "smartCreative": 1,
    "creativeSetMode": "minimalist",
    "quickLiftBudgetCommand": {},
    "algoPredictionExtraInfo": {},
    "effectPrediction": {},
    "sourceChannel": "",
    "channelLocation": "",
    "selectedTargetBizCode": "",
    "dmpSolutionId": "",
    "activityId": "",
    "specialSourceForMainStep": "",
    "bpStrategyId": "",
    "bpStrategyType": ""
  },
  "adgroupList": [
    {
      "material": {
        "materialId": 0,
        "materialName": "",
        "promotionType": "item",
        "subPromotionType": "item",
        "linkUrl": "",
        "goalLifeCycleList": [],
        "shopId": 0,
        "shopName": "",
        "bidCount": 0,
        "categoryLevel1": ""
      }
    }
  ]
}
```

## 5. 页面控件与请求字段映射

### 5.1 出价方式

- `控投产比投放`
  - `campaign.bidType = roi_control`
  - 提交 `constraintType = roi`
  - 提交 `constraintValue`
  - `dmcType` 可为 `unlimit` 或 `normal`
- `最大化拿量`
  - `campaign.bidType = max_amount`
  - 不再提交 `constraintType / constraintValue`
  - 当前观测样本下 `dmcType = normal`
  - `algoPredictionExtraInfo` 的 key 集合会变化

### 5.2 出价目标

- `增加净成交金额`
  - `campaign.optimizeTarget = ad_strategy_retained_buy`
- `增加总成交金额`
  - `campaign.optimizeTarget = ad_strategy_buy`
  - 会影响推荐 ROI 和自定义 ROI 展示值

### 5.3 ROI 目标

- 仅在 `bidType = roi_control` 时有意义
- `推荐`
  - `constraintValue` 取算法推荐值
- `自定义`
  - `constraintValue` 改为用户输入/选定值
  - `algoPredictionExtraInfo.constraintValue_custom_obj.traceId` 会变化

### 5.4 预算类型

- `不限预算`
  - `campaign.dmcType = unlimit`
- `每日预算`
  - `campaign.dmcType = normal`
  - `algoPredictionExtraInfo` 增加日预算相关字段
  - 页面会出现 `优质计划防停投`

### 5.5 多目标优化

- 关闭：
  - `multiTarget.multiTargetSwitch = "0"`
- 开启：
  - `multiTarget.multiTargetSwitch = "1"`
  - 新增 `multiTarget.multiTargetConfigList`
  - `algoPredictionExtraInfo` 新增 `multiTarget`

### 5.6 一键起量

- 开启：
  - `quickLiftBudgetCommand.quickLiftSwitch = "true"`
  - 提交时间段、地域和起量预算
- 关闭：
  - `quickLiftBudgetCommand` 收缩为：

```json
{
  "quickLiftSwitch": "false"
}
```

### 5.7 起量时间地域设置

- 时间段：
  - 写入 `quickLiftBudgetCommand.quickLiftTimeSlot`
- 地域：
  - 写入 `quickLiftBudgetCommand.quickLiftLaunchArea`

### 5.8 优质计划防停投

- 关闭时显式提交：

```json
{
  "enableRuleAuto": false
}
```

### 5.9 设置计划组

- 归属到已有计划组：
  - 写入 `campaignGroupId / campaignGroupName`
- 不归属任何计划组：
  - 当前观测是 `campaignGroupId = null`
  - 但 `campaignGroupName` 不一定清空
- 新建计划组并归属：
  - 提交新的 `campaignGroupId / campaignGroupName`

## 6. 页面可见控件盘点

- 出价方式：
  - `roi_control` 对应 `控投产比投放`
  - `max_amount` 对应 `最大化拿量`
- 出价目标：
  - `ad_strategy_buy` 对应 `增加总成交金额`
  - `ad_strategy_retained_buy` 对应 `增加净成交金额`
- ROI 目标：
  - `推荐`
  - `自定义`
- 预算类型：
  - `unlimit` 对应 `不限预算`
  - `normal` 对应 `每日预算`
- 开关：
  - `优质计划防停投`
  - `多目标优化`
  - `一键起量`
- 其它可变入口：
  - `起量时间地域设置`
  - `设置计划组`

## 7. 已覆盖样本索引

### 7.1 核心出价与预算

- `S01` 默认基线：
  - `roi_control + ad_strategy_retained_buy + unlimit`
- `S02` 出价目标切到总成交金额：
  - `roi_control + ad_strategy_buy + unlimit`
- `S03` 出价方式切到最大化拿量：
  - `max_amount`
- `S04` 预算类型切到每日预算：
  - `roi_control + ad_strategy_retained_buy + normal`
- `S05` 在 `roi_control + normal` 下使用 ROI 自定义：
  - `roi_control + ad_strategy_retained_buy + normal + ROI 自定义`

### 7.2 开关类

- `S06` 多目标优化开启：
  - `roi_control + ad_strategy_retained_buy + normal + 多目标优化 = 开`
- `S07` 一键起量关闭：
  - `roi_control + ad_strategy_retained_buy + normal + 一键起量 = 关`
- `S08` 优质计划防停投关闭：
  - `roi_control + ad_strategy_retained_buy + normal + 优质计划防停投 = 关`

### 7.3 起量时间与地域

- `S09` 起量时间段改为 `8点~13点`
- `S10` 起量地域改为“部分地域（取消上海）”

### 7.4 设置计划组

- `S11` 归属到已有计划组：`小白鲸`
- `S12` 不归属任何计划组
- `S13` 新建计划组并归属：`计划组_20260428_002559`

## 8. 基线样本

### 8.1 基线页面状态

- 第一件商品
- `bidType = roi_control`
- `optimizeTarget = ad_strategy_retained_buy`
- `预算类型 = 不限预算`
- `多目标优化 = 关`
- `一键起量 = 开`

### 8.2 基线提交字段

```json
{
  "bidType": "roi_control",
  "optimizeTarget": "ad_strategy_retained_buy",
  "constraintType": "roi",
  "constraintValue": 8.05,
  "dmcType": "unlimit",
  "multiTarget": {
    "multiTargetSwitch": "0"
  },
  "quickLiftBudgetCommand": {
    "quickLiftSwitch": "true",
    "quickLiftTimeSlot": "0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23",
    "quickLiftLaunchArea": [
      "all"
    ],
    "quickLiftBudget": 762
  },
  "smartCreative": 1,
  "creativeSetMode": "minimalist"
}
```

## 9. 分支样本附录

> 未特别说明时，以下样本都只列“关键差异字段”。
> 未列出的字段默认沿用 `S01` 基线，或沿用同分组上一条样本。

### 9.1 核心出价与预算

#### S02 `roi_control` + `ad_strategy_buy` + `unlimit`

- 与 `S01` 差异：
  - `optimizeTarget` 从 `ad_strategy_retained_buy` 变为 `ad_strategy_buy`
  - 第一件商品推荐 ROI 从 `8.05` 变为 `9.04`
  - 第一件商品自定义 ROI 显示值从 `10.07` 变为 `11.3`
- 结果片段：

```json
{
  "bidType": "roi_control",
  "optimizeTarget": "ad_strategy_buy",
  "constraintType": "roi",
  "constraintValue": 9.04,
  "dmcType": "unlimit",
  "multiTarget": {
    "multiTargetSwitch": "0"
  },
  "quickLiftBudgetCommand": {
    "quickLiftSwitch": "true",
    "quickLiftBudget": 762
  }
}
```

#### S03 `max_amount`

- 与 `S01` 差异：
  - `bidType` 从 `roi_control` 变为 `max_amount`
  - 不再提交 `constraintType / constraintValue`
  - `dmcType` 变为 `normal`
  - `algoPredictionExtraInfo` 结构明显变化
- 结果片段：

```json
{
  "bidType": "max_amount",
  "optimizeTarget": "ad_strategy_retained_buy",
  "dmcType": "normal",
  "multiTarget": {
    "multiTargetSwitch": "0"
  },
  "quickLiftBudgetCommand": {
    "quickLiftSwitch": "true",
    "quickLiftBudget": 762
  },
  "smartCreative": 1,
  "creativeSetMode": "minimalist",
  "algoPredictionExtraInfoKeys": [
    "dayBudget",
    "dayBudget_obj",
    "mx_predict",
    "qcpx_level_obj",
    "qcpx_score_obj",
    "quickLiftBudgetCommand"
  ]
}
```

#### S04 `roi_control` + `ad_strategy_retained_buy` + `normal`

- 与 `S01` 差异：
  - `dmcType` 从 `unlimit` 变为 `normal`
  - 保留 `constraintType = roi` 与 `constraintValue = 8.05`
  - `algoPredictionExtraInfo` 新增日预算相关字段
  - 页面出现 `优质计划防停投`
- 结果片段：

```json
{
  "bidType": "roi_control",
  "optimizeTarget": "ad_strategy_retained_buy",
  "constraintType": "roi",
  "constraintValue": 8.05,
  "dmcType": "normal",
  "multiTarget": {
    "multiTargetSwitch": "0"
  },
  "quickLiftBudgetCommand": {
    "quickLiftSwitch": "true",
    "quickLiftTimeSlot": "0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23",
    "quickLiftLaunchArea": [
      "all"
    ],
    "quickLiftBudget": 762
  },
  "smartCreative": 1,
  "creativeSetMode": "minimalist",
  "algoPredictionExtraInfoKeys": [
    "constraintValue",
    "constraintValue_suggest_obj",
    "constraintValue_custom_obj",
    "mx_predict",
    "dayBudget",
    "dayBudget_obj",
    "qcpx_score_obj",
    "qcpx_level_obj",
    "quickLiftBudgetCommand"
  ]
}
```

#### S05 `roi_control` + `ad_strategy_retained_buy` + `normal` + `ROI 自定义`

- 与 `S04` 差异：
  - `constraintValue` 从推荐值 `8.05` 变为自定义值 `10.07`
  - `constraintValue_custom_obj.traceId` 变化
  - 预算、起量、多目标主结构保持不变
- 结果片段：

```json
{
  "bidType": "roi_control",
  "optimizeTarget": "ad_strategy_retained_buy",
  "constraintType": "roi",
  "constraintValue": 10.07,
  "dmcType": "normal",
  "multiTarget": {
    "multiTargetSwitch": "0"
  },
  "quickLiftBudgetCommand": {
    "quickLiftSwitch": "true",
    "quickLiftTimeSlot": "0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23",
    "quickLiftLaunchArea": [
      "all"
    ],
    "quickLiftBudget": 762
  },
  "algoPredictionExtraInfoKeys": [
    "constraintValue",
    "constraintValue_suggest_obj",
    "constraintValue_custom_obj",
    "mx_predict",
    "dayBudget",
    "dayBudget_obj",
    "qcpx_score_obj",
    "qcpx_level_obj",
    "quickLiftBudgetCommand"
  ]
}
```

### 9.2 开关类

#### S06 `roi_control` + `ad_strategy_retained_buy` + `normal` + `多目标优化 = 开`

- 与默认 `多目标优化 = 关` 差异：
  - `multiTarget.multiTargetSwitch` 从 `0` 变为 `1`
  - 新增 `multiTarget.multiTargetConfigList`
  - `algoPredictionExtraInfoKeys` 新增 `multiTarget`
  - 页面总预算从 `3141` 变为 `3903`
- 结果片段：

```json
{
  "bidType": "roi_control",
  "optimizeTarget": "ad_strategy_retained_buy",
  "constraintType": "roi",
  "constraintValue": "8.05",
  "dmcType": "normal",
  "multiTarget": {
    "multiTargetSwitch": "1",
    "multiTargetConfigList": [
      {
        "optimizeTarget": "1034",
        "multiTargetBudget": 762
      }
    ]
  },
  "quickLiftBudgetCommand": {
    "quickLiftSwitch": "true",
    "quickLiftTimeSlot": "0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23",
    "quickLiftLaunchArea": [
      "all"
    ],
    "quickLiftBudget": 762
  },
  "algoPredictionExtraInfoKeys": [
    "constraintValue",
    "constraintValue_suggest_obj",
    "constraintValue_custom_obj",
    "mx_predict",
    "dayBudget",
    "dayBudget_obj",
    "qcpx_score_obj",
    "qcpx_level_obj",
    "multiTarget",
    "quickLiftBudgetCommand"
  ]
}
```

#### S07 `roi_control` + `ad_strategy_retained_buy` + `normal` + `一键起量 = 关`

- 与默认 `一键起量 = 开` 差异：
  - `quickLiftBudgetCommand` 收缩为仅提交 `quickLiftSwitch = false`
  - `algoPredictionExtraInfoKeys` 不再包含 `quickLiftBudgetCommand`
  - 页面起量预算区收起，计划总预算展示同步消失
- 结果片段：

```json
{
  "bidType": "roi_control",
  "optimizeTarget": "ad_strategy_retained_buy",
  "constraintType": "roi",
  "constraintValue": "8.05",
  "dmcType": "normal",
  "multiTarget": {
    "multiTargetSwitch": "0"
  },
  "quickLiftBudgetCommand": {
    "quickLiftSwitch": "false"
  },
  "algoPredictionExtraInfoKeys": [
    "constraintValue",
    "constraintValue_suggest_obj",
    "constraintValue_custom_obj",
    "mx_predict",
    "dayBudget",
    "dayBudget_obj",
    "qcpx_score_obj",
    "qcpx_level_obj"
  ]
}
```

#### S08 `roi_control` + `ad_strategy_retained_buy` + `normal` + `优质计划防停投 = 关`

- 与默认 `优质计划防停投 = 开` 差异：
  - 请求里显式出现 `enableRuleAuto: false`
  - `quickLiftBudgetCommand`、`multiTarget`、`constraintValue` 结构维持默认
  - 当前观察到 `qcpx_score_obj / qcpx_level_obj / quickLiftBudgetCommand` 的 `traceId` 会刷新，但结构不变
- 结果片段：

```json
{
  "bidType": "roi_control",
  "optimizeTarget": "ad_strategy_retained_buy",
  "constraintType": "roi",
  "constraintValue": "8.05",
  "dmcType": "normal",
  "enableRuleAuto": false,
  "multiTarget": {
    "multiTargetSwitch": "0"
  },
  "quickLiftBudgetCommand": {
    "quickLiftSwitch": "true",
    "quickLiftTimeSlot": "0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23",
    "quickLiftLaunchArea": [
      "all"
    ],
    "quickLiftBudget": 762
  }
}
```

### 9.3 起量时间与地域

#### S09 `roi_control` + `ad_strategy_retained_buy` + `normal` + `起量时间地域设置 = 8点~13点`

- 与默认 `0点~24点` 差异：
  - `quickLiftBudgetCommand.quickLiftTimeSlot` 从全天 24 个小时收缩为 `8,9,10,11,12`
  - 页面摘要显示 `8点~13点`
  - `quickLiftLaunchArea` 仍为 `["all"]`
- 结果片段：

```json
{
  "bidType": "roi_control",
  "optimizeTarget": "ad_strategy_retained_buy",
  "constraintType": "roi",
  "constraintValue": "8.05",
  "dmcType": "normal",
  "quickLiftBudgetCommand": {
    "quickLiftSwitch": "true",
    "quickLiftBudget": 762,
    "quickLiftTimeSlot": "8,9,10,11,12",
    "quickLiftLaunchArea": [
      "all"
    ]
  }
}
```

#### S10 `roi_control` + `ad_strategy_retained_buy` + `normal` + `起量地域 = 部分地域（取消上海）`

- 与默认 `全部地域` 差异：
  - `quickLiftBudgetCommand.quickLiftLaunchArea` 从 `["all"]` 变为省份 ID 数组
  - 当前页面操作是“仅取消上海”，因此数组里不再出现上海对应的 `417`
  - `quickLiftTimeSlot` 保持全天不变
- 结果片段：

```json
{
  "bidType": "roi_control",
  "optimizeTarget": "ad_strategy_retained_buy",
  "constraintType": "roi",
  "constraintValue": "8.05",
  "dmcType": "normal",
  "quickLiftBudgetCommand": {
    "quickLiftSwitch": "true",
    "quickLiftBudget": 762,
    "quickLiftTimeSlot": "0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23",
    "quickLiftLaunchArea": [
      1,
      19,
      532,
      39,
      68,
      92,
      109,
      52,
      165,
      125,
      145,
      184,
      212,
      120,
      234,
      255,
      279,
      294,
      333,
      351,
      357,
      393,
      406,
      368,
      438,
      461,
      488,
      508,
      471,
      463,
      577,
      599,
      576,
      531,
      575
    ]
  }
}
```

### 9.4 设置计划组

#### S11 `设置计划组 = 归属到已有计划组（小白鲸）`

- 说明：
  - 该设置只影响首件商品所在计划，其余计划仍保持空计划组
  - 当前页面直接可见的已有计划组值为 `小白鲸`
- 结果片段：

```json
{
  "campaignGroupId": 85876013,
  "campaignGroupName": "小白鲸"
}
```

#### S12 `设置计划组 = 不归属任何计划组`

- 与 `S11` 差异：
  - `campaignGroupId` 被清成 `null`
  - `campaignGroupName` 没有同步清空，仍保留 `"小白鲸"`
  - 这说明页面当前行为更像“只清计划组 ID，不清计划组名称”
- 结果片段：

```json
{
  "campaignGroupId": null,
  "campaignGroupName": "小白鲸"
}
```

#### S13 `设置计划组 = 新建计划组并归属`

- 说明：
  - 使用弹窗自动生成的计划组名：`计划组_20260428_002559`
  - 提交时首件商品拿到了新的 `campaignGroupId`
- 结果片段：

```json
{
  "campaignGroupId": 85789647,
  "campaignGroupName": "计划组_20260428_002559"
}
```

## 10. `roi_control + normal` 样本下的 `algoPredictionExtraInfo`

### 10.1 使用建议

- 这个对象主要提供算法推荐、预算上下界、质控评分、trace 信息。
- 其中很多值会随时间、店铺状态、页面重算而变化。
- 开发侧更应该依赖“字段存在性与结构”，不要依赖固定数值。

### 10.2 原始样本

```json
{
  "constraintValue": "215040dd17773057501778195e3bce",
  "constraintValue_suggest_obj": {
    "validateBidMin": 0.1,
    "validateBidMax": 21.51,
    "bidMin": 4.53,
    "bidLeft": 8.05,
    "bidMiddle": 9.06,
    "bidRight": 10.07,
    "bidMax": 18.12,
    "traceId": "215040dd17773057501778195e3bce"
  },
  "constraintValue_custom_obj": {
    "traceId": "215040dd17773057506478276e3bce"
  },
  "mx_predict": "215040dd17773057511858388e3bce",
  "dayBudget": "215040dd17773057933215507e3bce",
  "dayBudget_obj": {
    "budgetLower": 3811,
    "traceId": "215040dd17773057933215507e3bce",
    "budgetDefault": 3811,
    "budgetLeft": 3811,
    "budgetMiddle": 4192,
    "budgetRight": 4954,
    "budgetUpper": 4954,
    "budgetMin": 1830,
    "appendBudgetLimit": 1830,
    "algoBudget": 4192,
    "reason": "昨日预算使用率达0.0%,但宝贝昨日无成交,建议每日预算不低于3811元"
  },
  "qcpx_score_obj": {
    "traceId": "215040dd17773057944265780e3bce",
    "qcpxScore": 9125
  },
  "qcpx_level_obj": {
    "traceId": "215040dd17773057944265780e3bce",
    "qcpxLevel": "低"
  },
  "quickLiftBudgetCommand": {
    "quickLiftBudget": "215040dd17773057952375963e3bce",
    "quickLiftBudget_obj": {
      "budgetLower": 762,
      "traceId": "215040dd17773057952375963e3bce",
      "budgetDefault": 762,
      "budgetLeft": 762,
      "budgetMiddle": 1270,
      "budgetRight": 2032,
      "budgetUpper": 2032,
      "budgetMin": 119,
      "appendBudgetLimit": 119,
      "algoBudget": 1270,
      "reason": "建议预算不低于2032元"
    }
  }
}
```

## 11. 已知异常与实现注意事项

### 11.1 计划组“取消归属”存在脏名称残留

- 触发路径：
  - 先选 `归属到已有计划组（小白鲸）`
  - 再切到 `不归属任何计划组`
- 观测结果：
  - `campaignGroupId = null`
  - `campaignGroupName = "小白鲸"`
- 开发结论：
  - 不能只根据 `campaignGroupName` 判断是否已归组；
  - 应以 `campaignGroupId` 是否为空为主判断；
  - 若后续需要本地组包或清洗数据，建议在 `campaignGroupId == null` 时主动清空 `campaignGroupName`。

### 11.2 `algoPredictionExtraInfo` 是快照，不是稳定字典

- `traceId`、预算建议、ROI 建议区间会刷新；
- 同一分支重复进入页面也可能变；
- 代码里应把它视为“实时算法快照”，不要做固定值断言。

### 11.3 页面重渲染后控件 ID 不稳定

- 行容器、开关节点、弹窗节点的内部 ID 会变；
- 真正稳定的是语义结构，不是 DOM ID。

## 12. 当前覆盖状态

- 暂无新的结构性分支未覆盖。
- 当前结论仅基于页面可见入口与可达分支。
- `已有计划组` 下拉若后续出现更多历史计划组，预期只会变动：
  - `campaignGroupId`
  - `campaignGroupName`
- 对应字段结构可直接参考 `S11` 样本。

## 13. 后续追加规则

- 后续若继续摸排其它计划类型或其它 `bizCode`，直接在本文件追加新章节。
- 新增记录时优先补：
  - 页面入口与前置条件
  - 最终提交接口
  - 字段映射
  - 已覆盖样本索引
  - 异常与未覆盖分支
- 不要把新抓到的参数散落到对话、临时笔记或 `tasks/todo.md`。

## 14. 组包实现建议

### 14.1 推荐实现流程

建议按下面顺序实现 `addList.json` 组包：

1. 从页面运行态读取根级上下文：
   - `bizCode`
   - `csrfId`
   - `loginPointId`
   - 其它请求必需运行时字段
2. 构造根级骨架：
   - `bizCode`
   - `solutionList`
   - `csrfId`
   - `strategyRecoverys`
   - `loginPointId`
   - `lrsIdList`
3. 以 `S01` 作为 `campaign` 基线模板。
4. 根据页面选择项，对基线模板做“增量覆盖”。
5. 为每个商品补齐对应 `adgroupList[].material`。
6. 在提交前执行一次字段清洗和类型归一。
7. 对照本文件样本做分支级对拍，忽略 `traceId` 等动态值。

### 14.2 推荐的基线模板思路

- 根级 payload：
  - 运行时字段从页面读取，不要硬编码样本值。
- `solutionList[i].campaign`：
  - 以 `S01` 为默认模板；
  - 只在用户明确切换某个分支时覆盖相关字段；
  - 未受该分支影响的字段保留基线值。
- `solutionList[i].adgroupList`：
  - 以当前商品列表逐条生成；
  - 当前文档未发现“首件商品和其它商品的结构字段名不同”的情况。

### 14.3 分支覆盖规则

- 出价方式切到 `max_amount`：
  - 设置 `bidType = max_amount`
  - 删除或不提交 `constraintType`
  - 删除或不提交 `constraintValue`
  - 设置 `dmcType = normal`
- 出价目标切到 `ad_strategy_buy`：
  - 设置 `optimizeTarget = ad_strategy_buy`
  - ROI 推荐值、自定义值来源需要跟页面实时值保持一致，不要复用 `ad_strategy_retained_buy` 的推荐值
- 预算类型切到 `normal`：
  - 设置 `dmcType = normal`
  - 引入日预算相关 `algoPredictionExtraInfo`
- ROI 目标切到自定义：
  - 只覆盖 `constraintValue`
  - 其余 ROI 结构沿用当前 `roi_control + normal` 模板
- 开启多目标优化：
  - 设置 `multiTarget.multiTargetSwitch = "1"`
  - 补齐 `multiTarget.multiTargetConfigList`
- 关闭多目标优化：
  - 设置 `multiTarget.multiTargetSwitch = "0"`
  - 不提交多目标配置列表
- 关闭一键起量：
  - `quickLiftBudgetCommand` 收缩为仅提交 `quickLiftSwitch = "false"`
  - 不再提交 `quickLiftTimeSlot / quickLiftLaunchArea / quickLiftBudget`
- 开启一键起量：
  - `quickLiftBudgetCommand` 需要完整提交起量预算、时间段、地域
- 关闭优质计划防停投：
  - 显式提交 `enableRuleAuto = false`
- 修改起量时间段：
  - 只覆盖 `quickLiftBudgetCommand.quickLiftTimeSlot`
- 修改起量地域：
  - 只覆盖 `quickLiftBudgetCommand.quickLiftLaunchArea`
- 归属到已有计划组：
  - 设置 `campaignGroupId / campaignGroupName`
- 不归属任何计划组：
  - 至少保证 `campaignGroupId = null`
  - 本地组包建议同时清空 `campaignGroupName`
- 新建计划组并归属：
  - 设置新的 `campaignGroupId / campaignGroupName`

## 15. 值类型与清洗规则

### 15.1 当前观测到的值类型特征

- `quickLiftBudgetCommand.quickLiftSwitch`
  - 使用字符串布尔值：`"true"` / `"false"`
- `multiTarget.multiTargetSwitch`
  - 使用字符串枚举：`"0"` / `"1"`
- `constraintValue`
  - 样本里同时出现过数字 `8.05` 和字符串 `"8.05"` 的写法
  - 开发侧做比较时应按数值语义处理
- `campaignGroupId`
  - 可能是数字，也可能是 `null`
- `quickLiftLaunchArea`
  - 可能是 `["all"]`
  - 也可能是省份 ID 数组
- `quickLiftTimeSlot`
  - 使用逗号拼接的小时字符串，不是数组

### 15.2 文档字段与真实请求字段的区别

- 本文中的 `algoPredictionExtraInfoKeys` 是文档摘要字段，用于表达“这个对象里有哪些 key”。
- 它不是线上真实请求里的字段名。
- 真正请求里提交的是完整的 `algoPredictionExtraInfo` 对象。

### 15.3 提交前建议做的清洗

- 当 `campaignGroupId == null` 时：
  - 主动把 `campaignGroupName` 清空，避免残留脏名称
- 当 `quickLiftSwitch == "false"` 时：
  - 删除 `quickLiftTimeSlot`
  - 删除 `quickLiftLaunchArea`
  - 删除 `quickLiftBudget`
- 当 `bidType == max_amount` 时：
  - 删除 `constraintType`
  - 删除 `constraintValue`
- 对算法快照字段：
  - 仅保留页面当前真实值
  - 不做本地推导或补造

## 16. 开发核对清单

### 16.1 组包前

- 已从真实页面拿到当前 `bizCode / csrfId / loginPointId`
- 已确认商品已添加，否则很多计划入口不会展示
- 已确认本次实现对应的是 `onebpSite`，不是其它 `bizCode`

### 16.2 组包时

- 根级 payload 字段齐全
- `solutionList` 中每个 `campaign` 都是基线模板加分支覆盖，不是手写散装对象
- `adgroupList[].material` 与当前商品列表一一对应
- 起量、计划组、多目标等条件字段只在对应分支下出现

### 16.3 对拍时

- 先对拍字段结构，再对拍字段取值
- 忽略会漂移的 `traceId`、预算建议原因、算法推荐文案
- 若出现差异，优先判断是否属于：
  - 页面实时推荐值变动
  - 算法快照刷新
  - 计划组名称残留这类已知页面异常

## 17. 2026-04-28 `onebpSearch` 关键词推广 - 搜索卡位

### 17.1 页面与入口

- 页面：
  - `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSearch&promotionScene=promotion_scene_search_detent`
- 一级场景：
  - `关键词推广`
- 当前默认营销目标：
  - `搜索卡位`
- 当前页面可见营销目标：
  - `搜索卡位`
  - `趋势明星`
  - `流量金卡`
  - `自定义推广`

### 17.2 提交前置条件

- 页面默认已带出 `10` 个核心词。
- 必须先添加商品，否则：
  - `itemIdList` 为空
  - `日均预算` 不会生成建议值
  - 提交结构不完整
- 本次使用页面 `一键上车` 后，自动加入 `5` 个商品。
- 加商品后页面自动带出：
  - `dayAverageBudget = 1640`
  - `campaignColdStartVO.coldStartStatus = "1"`

### 17.3 最终提交接口

- Method：`POST`
- URL：
  - `https://one.alimama.com/solution/addList.json?csrfId=<CSRF_ID>&bizCode=onebpSearch`

### 17.4 当前场景新增的关键字段

相对 `onebpSite`，`onebpSearch` 的 `campaign` 新增了这些关键字段族：

- 搜索场景标识：
  - `promotionScene = "promotion_scene_search_detent"`
  - `itemSelectedMode = "search_detent"`
- 搜索词配置：
  - `wordList`
  - `wordPackageList`
- 商品范围：
  - `itemIdList`
- 资源位与投放设置：
  - `adzoneList`
  - `launchAreaStrList`
  - `launchPeriodList`
- 冷启加速：
  - `campaignColdStartVO.coldStartStatus`
- 卡位方式：
  - `searchDetentType`
- 预算模式：
  - `dmcType = "day_average"`
  - `dayAverageBudget`
- 当前默认出价方式：
  - `bidType = "max_amount"`

### 17.5 `wordList[0]` 参数样本

> `wordList` 是本场景最重要的新字段族。
> 当前默认基线下共有 10 条词，每条都带完整的词级预测和出价参数。

```json
{
  "word": "aq80s",
  "matchScope": "4",
  "bidPrice": 1.96,
  "onlineStatus": 1,
  "disabled": false,
  "upgrade": false,
  "relevanceType": 3,
  "searchIndex": 86,
  "marketAverageBid": 2.9217,
  "marketClickRate": 0.0741,
  "marketClickConversionRate": 0,
  "predictClick": 0.1,
  "competitionIndex": 45.3105,
  "trendIndex": 0.1119,
  "presentMPenetrationRate": "数据量过小",
  "presentMPenetrationRateRank": "数据量过小",
  "firstSlotImpressionRate": 0,
  "impression": "1-10",
  "leadAdGmvRate": 0,
  "reasonTagList": []
}
```

### 17.6 `wordPackageList[0]` 参数样本

> 页面里的“流量智选”会进入 `wordPackageList`。
> 当前默认基线下，该词包本身 `onlineStatus = 1`，内部策略开关是逐条独立的。

```json
{
  "wordPackageId": 0,
  "wordPackageName": "流量智选",
  "wordPackageType": 0,
  "onlineStatus": 1,
  "status": 0,
  "bidPrice": 1,
  "strategyList": [
    {
      "strategyId": 1,
      "strategyName": "好词优选",
      "onlineStatus": 1
    },
    {
      "strategyId": 2,
      "strategyName": "捡漏",
      "onlineStatus": 0
    },
    {
      "strategyId": 3,
      "strategyName": "类目优选",
      "onlineStatus": 1
    }
  ]
}
```

### 17.7 基线样本 `KS01`

- 页面状态：
  - `关键词推广 -> 搜索卡位`
  - 已通过 `一键上车` 添加 5 个商品
  - `开启冷启加速 = 开`
  - `卡位方式 = 抢首条`
  - `日均预算 = 1640`
  - `高级设置 = 默认`
- 关键字段：

```json
{
  "promotionScene": "promotion_scene_search_detent",
  "itemSelectedMode": "search_detent",
  "campaignName": "关键词推广_卡位_20260428_004143",
  "campaignGroupId": "",
  "campaignGroupName": "",
  "searchDetentType": "first_place",
  "campaignColdStartVO": {
    "coldStartStatus": "1"
  },
  "dmcType": "day_average",
  "dayAverageBudget": 1640,
  "bidType": "max_amount",
  "adzoneList": [
    {
      "adzoneId": "114790550288",
      "status": "start"
    }
  ],
  "launchAreaStrList": [
    "all"
  ],
  "launchPeriodList[0].timeSpanList[0].time": "00:00-24:00",
  "itemIdList": [
    973306665230,
    675990562049,
    757440599385,
    757374325509,
    928529817799
  ],
  "wordListCount": 10,
  "wordPackageListCount": 1,
  "algoPredictionExtraInfoKeys": [
    "dayAverageBudget",
    "dayAverageBudget_obj",
    "qcpx_score_obj",
    "qcpx_level_obj"
  ]
}
```

### 17.8 已覆盖分支

#### `KS02` 卡位方式 = `抢前三`

- 与 `KS01` 差异：
  - `searchDetentType` 从 `first_place` 变为 `third_place`
- 关键字段：

```json
{
  "searchDetentType": "third_place",
  "campaignColdStartVO": {
    "coldStartStatus": "1"
  },
  "dmcType": "day_average",
  "dayAverageBudget": 1640
}
```

#### `KS03` 卡位方式 = `抢首页`

- 与 `KS01` 差异：
  - `searchDetentType` 从 `first_place` 变为 `home_page`
- 关键字段：

```json
{
  "searchDetentType": "home_page",
  "campaignColdStartVO": {
    "coldStartStatus": "1"
  },
  "dmcType": "day_average",
  "dayAverageBudget": 1640
}
```

#### `KS04` 开启冷启加速 = `关`

- 与 `KS01` 差异：
  - `campaignColdStartVO.coldStartStatus` 从 `"1"` 变为 `"0"`
  - 当前抓取时卡位方式仍保持 `抢首条`
- 关键字段：

```json
{
  "searchDetentType": "first_place",
  "campaignColdStartVO": {
    "coldStartStatus": "0"
  },
  "dmcType": "day_average",
  "dayAverageBudget": 1640
}
```

#### `KS05` 核心词设置 = `添加关键词（推荐词：美的小魔方）`

- 操作路径：
  - 点击 `添加关键词`
  - 在推荐列表勾选 `美的小魔方`
  - 在弹窗内确认新增后回到主页面
  - 若商品区域被重置为 `0 / 30`，需重新 `一键上车` 恢复到可提交态再做离线触发
- 与 `KS01` 差异：
  - `wordListCount` 从 `10` 变为 `11`
  - 新增词会插入到 `wordList[0]`，原第一个词顺延为 `wordList[1] = "aq80s"`
  - 新词默认沿用页面当前匹配方式 `广泛`，即 `wordList[0].matchScope = "4"`
  - 新词会带出 `recReason = "aiRecWord"` 与 `showTagList = [{ "name": "AI" }]`
  - `strategyRecoverys` 中会出现 `strategyType = "aiword"` 的恢复记录
  - `itemIdList`、`searchDetentType`、`campaignColdStartVO.coldStartStatus`、`dayAverageBudget` 保持不变
- 关键字段：

```json
{
  "searchDetentType": "first_place",
  "campaignColdStartVO": {
    "coldStartStatus": "1"
  },
  "dayAverageBudget": 1640,
  "itemIdList": [
    973306665230,
    675990562049,
    757440599385,
    757374325509,
    928529817799
  ],
  "wordListCount": 11,
  "wordList[0].word": "美的小魔方",
  "wordList[0].matchScope": "4",
  "wordList[0].recReason": "aiRecWord",
  "wordList[0].showTagList": [
    {
      "name": "AI"
    }
  ],
  "wordList[0].suggestPrice": 1,
  "wordList[0].bidPrice": 1,
  "strategyRecoveryTypes": {
    "xuanpin_suggest": 3,
    "bp_sides": 1,
    "budget_suggest": 15,
    "bid_suggest": 7,
    "bidword_suggest": 8,
    "case_study_cube": 2,
    "aiword": 1
  }
}
```

#### `KS06` 核心词设置 = `手动输入添加关键词（方太水槽）`

- 操作路径：
  - 点击 `添加关键词`
  - 点击 `点击此处可手动输入添加关键词`
  - 点击行首编辑图标，展开隐藏输入框
  - 输入 `方太水槽`
  - 以默认 `广泛` 匹配确认
- 前置状态：
  - 本样本是在 `KS05` 已存在 `美的小魔方` 的基础上继续补加
- 与 `KS05` 差异：
  - `wordListCount` 从 `11` 变为 `12`
  - 手动词会插入到 `wordList[0]`，原 `美的小魔方` 顺延为 `wordList[1]`
  - 手动词不再带推荐词的完整指标对象，而是最小手动结构
  - 手动词对象的关键标记是：
    - `isManual = true`
    - `originalWord = "方太水槽"`
    - `matchScope = "4"`
    - `bidPrice = 1.03`
  - 页面确认后会再次把商品区清成 `0 / 30`，需要重新 `一键上车` 才能回到可提交态
- 关键字段：

```json
{
  "wordListCount": 12,
  "wordList[0]": {
    "word": "方太水槽",
    "bidPrice": 1.03,
    "isManual": true,
    "matchScope": "4",
    "onlineStatus": 1,
    "originalWord": "方太水槽",
    "upgrade": false
  },
  "wordList[1].word": "美的小魔方",
  "itemIdList": [
    973306665230,
    675990562049,
    757440599385,
    757374325509,
    928529817799
  ],
  "searchDetentType": "first_place",
  "campaignColdStartVO": {
    "coldStartStatus": "1"
  }
}
```

#### `KS07` 首行手动词匹配方式 = `中心词`

- 操作路径：
  - 保持 `KS06` 的 12 词状态
  - 点击首行手动词 `方太水槽` 的 `中心词`
- 与 `KS06` 差异：
  - 仅 `wordList[0].matchScope` 改写
- 关键字段：

```json
{
  "wordList[0].word": "方太水槽",
  "wordList[0].isManual": true,
  "wordList[0].matchScope": "16",
  "wordListLength": 12
}
```

#### `KS08` 首行手动词匹配方式 = `精准`

- 操作路径：
  - 保持 `KS06` 的 12 词状态
  - 点击首行手动词 `方太水槽` 的 `精准`
- 与 `KS06` 差异：
  - 仅 `wordList[0].matchScope` 改写
- 关键字段：

```json
{
  "wordList[0].word": "方太水槽",
  "wordList[0].isManual": true,
  "wordList[0].matchScope": "1",
  "wordListLength": 12
}
```

#### `KS09` 核心词设置 = `清空`

- 操作路径：
  - 在主页面直接点击 `清空`
- 页面行为：
  - 无二次确认弹层
  - 立即清空全部关键词
  - 同时把商品区域打回 `添加商品 0 / 30`
  - 顶部出现提示：`请完成添加关键词，可获得对应的投放建议！`
- 关键异常：
  - 页面虽然已经进入“无关键词、无商品”的空态，点击 `创建完成` 仍然会发出 `addList.json`
  - 后续开发不能假设前端一定会在缺少关键词时阻止提交
- 关键字段：

```json
{
  "wordListLength": 0,
  "itemIdListLength": 0,
  "itemIdList": [],
  "adgroupListLength": 0,
  "wordPackageListLength": 1,
  "campaignColdStartVO": {
    "coldStartStatus": "0"
  },
  "searchDetentType": "first_place",
  "dayAverageBudget": 1640,
  "launchAreaStrList": [
    "all"
  ]
}
```

#### `KS10` 卡位方式 = `位置不限提升市场渗透`

- 操作路径：
  - 在 `10` 个默认词仍存在时，先点击 `位置不限提升市场渗透`
  - 再执行 `一键上车` 添加商品
  - 页面会把卡位方式自动重置回 `抢首条`
  - 需要再次点击 `位置不限提升市场渗透`，再做离线触发
- 页面行为：
  - 这个分支是真实可选项，不是之前误判的 `home_page`
  - 商品加入动作会覆盖掉当前卡位方式，后续开发或自动化不能假设“先选卡位、后选商品”能保留最终状态
- 关键字段：

```json
{
  "searchDetentType": "permeability",
  "campaignColdStartVO": {
    "coldStartStatus": "1"
  },
  "dayAverageBudget": 1640,
  "wordListLength": 10,
  "itemIdListLength": 5
}
```

### 17.9 当前仍待覆盖的分支

- `流量金卡`
- `自定义推广`
- `高级设置`
  - `投放资源位`
  - `投放地域`
  - `投放时间`
- `设置计划组`
- `流量智选` 开关及内部策略联动

### 17.10 开发结论

- `onebpSearch` 的默认 `搜索卡位` 不是 ROI 类计划，而是：
  - `bidType = max_amount`
  - `dmcType = day_average`
- 这个场景的真正核心参数不再是 ROI/起量预算，而是：
  - `wordList`
  - `wordPackageList`
  - `searchDetentType`
  - `campaignColdStartVO`
  - `adzoneList`
  - `launchAreaStrList`
  - `launchPeriodList`
- `wordList` 目前已确认至少有两套结构：
  - 推荐词结构：字段完整，常带 `recReason`、`showTagList`、市场指标、建议出价
  - 手动词结构：字段极短，核心是 `word / bidPrice / isManual / originalWord / matchScope / onlineStatus`
- `matchScope` 当前已确认映射：
  - `广泛 = "4"`
  - `中心词 = "16"`
  - `精准 = "1"`
- `位置不限提升市场渗透` 已确认真实映射：
  - `searchDetentType = "permeability"`
  - 但加商品后页面会自动重置回 `抢首条`，提交前必须重新选一次
- `清空关键词` 后前端界面虽然提示缺少关键词，且商品被清空，但离线触发仍会序列化空 `wordList` 和空 `itemIdList`。
- 后续开发如果要做 `onebpSearch` 组包，建议以 `KS01` 为基线模板，再按卡位方式、冷启加速、高级设置做增量覆盖。

## 18. 2026-04-28 `onebpSearch` 关键词推广 - 趋势明星

### 18.1 页面与入口

- 页面：
  - `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSearch&promotionScene=promotion_scene_search_trend`
- 一级场景：
  - `关键词推广`
- 当前营销目标：
  - `趋势明星`

### 18.2 提交前置条件

- 页面初始即带出一组趋势主题和商品推荐：
  - `选择趋势主题 = 5 / 6`
  - `添加自选商品 = 9 / 30`
- 页面默认同时带出：
  - `开启冷启加速 = 开`
  - `出价目标 = 获取成交量`
  - `日均预算 = 1640`
  - `设置优先投放客户 = 开`
  - `人群优化目标 = 开`
- 本场景无需再单独添加关键词，提交核心改为“趋势主题 + 商品 + 人群 + 出价目标”。

### 18.3 最终提交接口

- Method：`POST`
- URL：
  - `https://one.alimama.com/solution/addList.json?csrfId=<CSRF_ID>&bizCode=onebpSearch`

### 18.4 当前场景新增的关键字段

相对 `搜索卡位`，`趋势明星` 的 `campaign` 结构切换为这几组核心字段：

- 趋势场景标识：
  - `promotionScene = "promotion_scene_search_trend"`
  - `itemSelectedMode = "trend"`
  - `trendType = "0"`
- 趋势主题：
  - `trendThemeList`
- 商品列表：
  - `itemIdList`
  - `adgroupList`
- 智能出价：
  - `bidTypeV2 = "smart_bid"`
  - `bidTargetV2`
  - `optimizeTarget`
- 人群配置：
  - `crowdList`
- 冷启加速：
  - `campaignColdStartVO.coldStartStatus`
- 预算与投放设置：
  - `dmcType = "day_average"`
  - `dayAverageBudget`
  - `adzoneList`
  - `launchAreaStrList`
  - `launchPeriodList`

### 18.5 基线样本 `KT01`

- 页面状态：
  - `关键词推广 -> 趋势明星`
  - 页面默认已带 `5` 个趋势主题
  - 页面默认已带 `9` 个商品
  - `开启冷启加速 = 开`
  - `出价目标 = 获取成交量`
  - `日均预算 = 1640`
  - `高级设置 = 默认`
- 关键字段：

```json
{
  "promotionScene": "promotion_scene_search_trend",
  "itemSelectedMode": "trend",
  "trendType": "0",
  "campaignName": "关键词推广_20260428_011353",
  "campaignGroupId": "",
  "campaignGroupName": "",
  "bidTypeV2": "smart_bid",
  "bidTargetV2": "conv",
  "optimizeTarget": "conv",
  "campaignColdStartVO": {
    "coldStartStatus": "1"
  },
  "dmcType": "day_average",
  "dayAverageBudget": 1640,
  "trendThemeListLength": 5,
  "trendThemeList[0].trendThemeName": "空调1.5匹一级能效",
  "trendThemeList[1].trendThemeName": "消毒碗柜家用",
  "trendThemeList[2].trendThemeName": "消毒碗柜",
  "trendThemeList[3].trendThemeName": "嵌入式消毒柜",
  "trendThemeList[4].trendThemeName": "小魔方",
  "itemIdListLength": 9,
  "adgroupListLength": 9,
  "crowdListLength": 5,
  "adzoneList": [
    {
      "adzoneId": "114790550288",
      "status": "start"
    },
    {
      "adzoneId": "114786650498",
      "status": "start"
    }
  ],
  "launchAreaStrList": [
    "all"
  ],
  "launchPeriodList[0].timeSpanList[0].time": "00:00-24:00"
}
```

### 18.6 已覆盖分支

#### `KT02` 开启冷启加速 = `关`

- 与 `KT01` 差异：
  - `campaignColdStartVO.coldStartStatus` 从 `"1"` 变为 `"0"`
- 页面行为：
  - 直接点可见 checkbox 时，页面出现 `系统异常，请稍后重试。status=0`，且不一定真正切换
  - 但底层 input 切换后，请求体会稳定序列化为 `coldStartStatus = "0"`
- 关键字段：

```json
{
  "bidTargetV2": "conv",
  "optimizeTarget": "conv",
  "campaignColdStartVO": {
    "coldStartStatus": "0"
  },
  "trendThemeListLength": 5,
  "itemIdListLength": 9,
  "dayAverageBudget": 1640
}
```

#### `KT03` 出价目标 = `增加点击量`

- 前置状态：
  - 基于 `KT02` 的 `冷启加速 = 关` 状态继续切换
- 与 `KT02` 差异：
  - `bidTargetV2` 从 `conv` 变为 `click`
  - `optimizeTarget` 从 `conv` 变为 `click`
- 关键字段：

```json
{
  "bidTargetV2": "click",
  "optimizeTarget": "click",
  "campaignColdStartVO": {
    "coldStartStatus": "0"
  },
  "trendThemeListLength": 5,
  "itemIdListLength": 9,
  "dayAverageBudget": 1640
}
```

#### `KT04` 出价目标 = `增加收藏加购量`

- 前置状态：
  - 基于 `KT02` 的 `冷启加速 = 关` 状态继续切换
- 与 `KT02` 差异：
  - `bidTargetV2` 从 `conv` 变为 `coll_cart`
  - `optimizeTarget` 从 `conv` 变为 `coll_cart`
- 关键字段：

```json
{
  "bidTargetV2": "coll_cart",
  "optimizeTarget": "coll_cart",
  "campaignColdStartVO": {
    "coldStartStatus": "0"
  },
  "trendThemeListLength": 5,
  "itemIdListLength": 9,
  "dayAverageBudget": 1640
}
```

#### `KT05` 出价目标 = `稳定投产比（推荐档 6.89）`

- 前置状态：
  - 基于 `KT02` 的 `冷启加速 = 关` 状态继续切换
- 与 `KT02` 差异：
  - `bidTargetV2` 从 `conv` 变为 `roi`
  - 新增：
    - `constraintType = "roi"`
    - `constraintValue = 6.89`
  - `optimizeTarget` 不再提交
  - `setSingleCostV2` 也不再提交
- 关键字段：

```json
{
  "bidTargetV2": "roi",
  "constraintType": "roi",
  "constraintValue": 6.89,
  "dmcType": "day_average",
  "hasOptimizeTarget": false,
  "hasSetSingleCostV2": false,
  "campaignColdStartVO": {
    "coldStartStatus": "0"
  },
  "trendThemeListLength": 5,
  "itemIdListLength": 9,
  "dayAverageBudget": 1640
}
```

#### `KT06` 稳定投产比档位 = `5.51`

- 前置状态：
  - 已切到 `稳定投产比`
  - 继续基于 `KT02` 的 `冷启加速 = 关` 状态
- 与 `KT05` 差异：
  - 仅 `constraintValue` 从 `6.89` 变为 `5.51`
  - 页面预算建议同步从 `2760` 上升到 `4210`
- 关键字段：

```json
{
  "bidTargetV2": "roi",
  "constraintType": "roi",
  "constraintValue": "5.51",
  "dmcType": "day_average",
  "dayAverageBudget": 1640,
  "campaignColdStartVO": {
    "coldStartStatus": "0"
  }
}
```

#### `KT07` 稳定投产比档位 = `8.27`

- 前置状态：
  - 已切到 `稳定投产比`
  - 继续基于 `KT02` 的 `冷启加速 = 关` 状态
- 与 `KT05` 差异：
  - 仅 `constraintValue` 从 `6.89` 变为 `8.27`
  - 页面预算建议同步从 `2760` 上升到 `4210`
- 关键字段：

```json
{
  "bidTargetV2": "roi",
  "constraintType": "roi",
  "constraintValue": "8.27",
  "dmcType": "day_average",
  "dayAverageBudget": 1640,
  "campaignColdStartVO": {
    "coldStartStatus": "0"
  }
}
```

#### `KT08` 稳定投产比档位 = `自定义 7.11`

- 操作路径：
  - 点击 `自定义`
  - 在输入框内填入 `7.11`
- 前置状态：
  - 已切到 `稳定投产比`
  - 继续基于 `KT02` 的 `冷启加速 = 关` 状态
- 与 `KT05` 差异：
  - `constraintValue` 从 `6.89` 变为自定义值 `7.11`
  - 其余 `roi` 档结构保持不变
- 关键字段：

```json
{
  "bidTargetV2": "roi",
  "constraintType": "roi",
  "constraintValue": "7.11",
  "dmcType": "day_average",
  "dayAverageBudget": 1640,
  "campaignColdStartVO": {
    "coldStartStatus": "0"
  }
}
```

#### `KT09` 设置平均直接成交成本 = `开（默认档 370.9）`

- 操作路径：
  - 勾选 `设置平均直接成交成本（非必要）`
- 与 `KT01` 差异：
  - `bidTargetV2` 仍为 `conv`
  - 新增：
    - `setSingleCostV2 = true`
    - `constraintType = "dir_conv"`
    - `constraintValue = 370.9`
  - `optimizeTarget` 不再提交
- 关键字段：

```json
{
  "bidTargetV2": "conv",
  "setSingleCostV2": true,
  "constraintType": "dir_conv",
  "constraintValue": 370.9,
  "hasOptimizeTarget": false,
  "campaignColdStartVO": {
    "coldStartStatus": "1"
  },
  "crowdListLength": 5,
  "dayAverageBudget": 1640
}
```

#### `KT10` 平均直接成交成本档位 = `445.08`

- 前置状态：
  - 已开启 `设置平均直接成交成本`
- 与 `KT09` 差异：
  - `constraintValue` 从 `370.9` 变为 `445.08`
- 关键字段：

```json
{
  "bidTargetV2": "conv",
  "setSingleCostV2": true,
  "constraintType": "dir_conv",
  "constraintValue": "445.08",
  "hasOptimizeTarget": false,
  "campaignColdStartVO": {
    "coldStartStatus": "1"
  },
  "dayAverageBudget": 1640
}
```

#### `KT11` 平均直接成交成本档位 = `296.72`

- 前置状态：
  - 已开启 `设置平均直接成交成本`
- 与 `KT09` 差异：
  - `constraintValue` 从 `370.9` 变为 `296.72`
- 关键字段：

```json
{
  "bidTargetV2": "conv",
  "setSingleCostV2": true,
  "constraintType": "dir_conv",
  "constraintValue": "296.72",
  "hasOptimizeTarget": false,
  "campaignColdStartVO": {
    "coldStartStatus": "1"
  },
  "dayAverageBudget": 1640
}
```

#### `KT12` 平均直接成交成本档位 = `自定义 333.33`

- 操作路径：
  - 选择 `自定义`
  - 输入 `333.33`
- 与 `KT09` 差异：
  - `constraintValue` 从 `370.9` 变为 `333.33`
- 关键字段：

```json
{
  "bidTargetV2": "conv",
  "setSingleCostV2": true,
  "constraintType": "dir_conv",
  "constraintValue": "333.33",
  "hasOptimizeTarget": false,
  "campaignColdStartVO": {
    "coldStartStatus": "1"
  },
  "dayAverageBudget": 1640
}
```

#### `KT13` 设置优先投放客户 = `关`

- 页面行为：
  - 关闭主开关后，人群子区域整体收起
- 与 `KT01` 差异：
  - `crowdList` 仍然保留字段，但数组变空
- 关键字段：

```json
{
  "bidTargetV2": "conv",
  "optimizeTarget": "conv",
  "setSingleCostV2": false,
  "crowdListLength": 0,
  "crowdList": [],
  "campaignColdStartVO": {
    "coldStartStatus": "1"
  },
  "dayAverageBudget": 1640
}
```

#### `KT14` 人群优化目标 = `关`

- 前置状态：
  - `设置优先投放客户 = 开`
- 页面行为：
  - 客群子项会一起取消选中，倍率输入变禁用
- 与 `KT01` 差异：
  - 提交体同样退化为 `crowdList = []`
- 关键字段：

```json
{
  "bidTargetV2": "conv",
  "optimizeTarget": "conv",
  "setSingleCostV2": false,
  "crowdListLength": 0,
  "crowdList": [],
  "campaignColdStartVO": {
    "coldStartStatus": "1"
  },
  "dayAverageBudget": 1640
}
```

#### `KT15` 新客户获取 = `关`

- 页面行为：
  - 关闭该项时，界面上的 `人群优化目标` 会被联动取消选中
  - 但真实提交不会清空全部人群，只会删除对应 `3008` 客群
- 与 `KT01` 差异：
  - `crowdListLength` 从 `5` 变为 `4`
  - 删除：
    - `3008_3000949_3000949`
- 关键字段：

```json
{
  "crowdListLength": 4,
  "crowdMxIds": [
    "3009_3000951_3000951",
    "3010_3000953_3000953",
    "3010_3000980_26",
    "3010_3000995_3000995"
  ],
  "discounts": [
    50,
    30,
    30,
    30
  ],
  "bidTargetV2": "conv",
  "optimizeTarget": "conv",
  "campaignColdStartVO": {
    "coldStartStatus": "1"
  }
}
```

#### `KT16` 流失老客挽回 = `关`

- 页面行为：
  - 关闭该项时，界面上的 `人群优化目标` 也会联动取消选中
  - 但真实提交仍保留剩余人群
- 与 `KT01` 差异：
  - `crowdListLength` 从 `5` 变为 `4`
  - 删除：
    - `3009_3000951_3000951`
- 关键字段：

```json
{
  "crowdListLength": 4,
  "crowdMxIds": [
    "3008_3000949_3000949",
    "3010_3000953_3000953",
    "3010_3000980_26",
    "3010_3000995_3000995"
  ],
  "discounts": [
    30,
    30,
    30,
    30
  ],
  "bidTargetV2": "conv",
  "optimizeTarget": "conv",
  "campaignColdStartVO": {
    "coldStartStatus": "1"
  }
}
```

#### `KT17` 高价值客户获取 = `关`

- 与 `KT01` 差异：
  - `crowdListLength` 从 `5` 变为 `2`
  - 一次性删除全部 `3010` 三条高价值客群
- 关键字段：

```json
{
  "crowdListLength": 2,
  "crowdMxIds": [
    "3008_3000949_3000949",
    "3009_3000951_3000951"
  ],
  "discounts": [
    30,
    50
  ],
  "bidTargetV2": "conv",
  "optimizeTarget": "conv",
  "campaignColdStartVO": {
    "coldStartStatus": "1"
  }
}
```

#### `KT18` 新客户获取倍率 = `1.8`

- 前置状态：
  - 三组客群均重新恢复为选中
- 与 `KT01` 差异：
  - 仅 `3008_3000949_3000949` 对应的新客户客群折扣从 `30` 变为 `80`
- 关键字段：

```json
{
  "crowdListLength": 5,
  "crowdMxIds": [
    "3008_3000949_3000949",
    "3009_3000951_3000951",
    "3010_3000953_3000953",
    "3010_3000980_26",
    "3010_3000995_3000995"
  ],
  "discounts": [
    80,
    50,
    30,
    30,
    30
  ],
  "bidTargetV2": "conv",
  "optimizeTarget": "conv",
  "campaignColdStartVO": {
    "coldStartStatus": "1"
  }
}
```

#### `KT19` 高价值客户获取倍率 = `1.6`

- 前置状态：
  - 恢复 `新客户获取倍率 = 1.3`
  - 将高价值客群倍率调到 `1.6`
- 与 `KT01` 差异：
  - 全部 `3010` 三条高价值客群折扣从 `30` 一起变为 `60`
- 关键字段：

```json
{
  "crowdListLength": 5,
  "crowdMxIds": [
    "3008_3000949_3000949",
    "3009_3000951_3000951",
    "3010_3000953_3000953",
    "3010_3000980_26",
    "3010_3000995_3000995"
  ],
  "discounts": [
    30,
    50,
    60,
    60,
    60
  ],
  "bidTargetV2": "conv",
  "optimizeTarget": "conv",
  "campaignColdStartVO": {
    "coldStartStatus": "1"
  }
}
```

#### `KT20` 选择趋势主题 = `补满第 6 个主题（美的酷省电二代空调）`

- 操作路径：
  - 打开 `选择趋势主题`
  - 追加 `美的酷省电二代空调`
- 页面行为：
  - 首次点击 `确定` 不一定立即生效，实测出现一次“选中后回弹”，重新选择再确认后主页面才稳定显示 `6 / 6`
- 与 `KT01` 差异：
  - `trendThemeListLength` 从 `5` 变为 `6`
  - 新增第 `6` 个主题：
    - `trendThemeId = "895617013"`
    - `trendThemeName = "美的酷省电二代空调"`
    - `itemCount = 0`
  - `itemIdListLength` 仍为 `9`
  - `adgroupListLength` 仍为 `9`
  - `dayAverageBudget` 从基线的 `1640` 切到 `1430`
- 关键字段：

```json
{
  "bidTargetV2": "conv",
  "optimizeTarget": "conv",
  "setSingleCostV2": false,
  "campaignColdStartVO": {
    "coldStartStatus": "1"
  },
  "trendThemeListLength": 6,
  "trendThemeNames": [
    "空调1.5匹一级能效",
    "消毒碗柜家用",
    "消毒碗柜",
    "嵌入式消毒柜",
    "小魔方",
    "美的酷省电二代空调"
  ],
  "trendThemeList[5]": {
    "trendThemeId": "895617013",
    "trendThemeName": "美的酷省电二代空调",
    "itemCount": 0
  },
  "itemIdListLength": 9,
  "adgroupListLength": 9,
  "dayAverageBudget": 1430
}
```

#### `KT21` 清空 = `趋势主题与商品全部清空`

- 操作路径：
  - 在主页面直接点击 `清空`
- 页面行为：
  - 无二次确认
  - 趋势主题和商品立即回落到空态
- 与 `KT01` 差异：
  - `trendThemeList` 清空
  - `itemIdList` 清空
  - `adgroupList` 清空
  - `campaignColdStartVO.coldStartStatus` 从 `"1"` 变为 `"0"`
  - `crowdListLength` 仍为 `5`
  - `adzoneList / launchAreaStrList / launchPeriodList` 仍保留默认值
- 关键字段：

```json
{
  "bidTargetV2": "conv",
  "optimizeTarget": "conv",
  "setSingleCostV2": false,
  "campaignColdStartVO": {
    "coldStartStatus": "0"
  },
  "trendThemeListLength": 0,
  "itemIdListLength": 0,
  "itemIdList": [],
  "adgroupListLength": 0,
  "crowdListLength": 5,
  "launchAreaStrList": [
    "all"
  ],
  "launchPeriodList[0].timeSpanList[0].time": "00:00-24:00",
  "dayAverageBudget": 1640
}
```

#### `KT22` 添加自选商品 = `新增 1029803691231`

- 操作路径：
  - 基于 `KT20` 的 `6 / 6` 趋势主题状态继续操作
  - 打开 `添加自选商品`
  - 添加 `美的洗碗机V6pro灶下家用15套大容量全自动热风烘干消毒一体机`
  - 确认后主页面显示 `添加自选商品 10 / 30`
- 页面行为：
  - 商品弹窗里的普通点击不稳定，实测出现“按钮高亮但数量未变化”的假点击
  - 新增成功后页面提示：
    - `宝贝正在全站推广进行投放，计划创建后将暂停全站推场景计划`
  - 但这段提示不会进入最终请求体
- 与 `KT20` 差异：
  - `trendThemeListLength` 仍为 `6`
  - `itemIdListLength` 从 `9` 变为 `10`
  - `adgroupListLength` 从 `9` 变为 `10`
  - 追加商品：
    - `itemId = 1029803691231`
    - `materialName = "美的洗碗机V6pro灶下家用15套大容量全自动热风烘干消毒一体机"`
    - `bidCount = 141`
  - `新广告加速` 页面提示从 `6` 个宝贝变为 `7` 个宝贝
- 关键字段：

```json
{
  "bidTargetV2": "conv",
  "optimizeTarget": "conv",
  "setSingleCostV2": false,
  "campaignColdStartVO": {
    "coldStartStatus": "1"
  },
  "trendThemeListLength": 6,
  "itemIdListLength": 10,
  "itemIdList": [
    730484825313,
    758478345532,
    971494418224,
    675990562049,
    874523794899,
    757440599385,
    758747035483,
    758507858852,
    1036198609154,
    1029803691231
  ],
  "adgroupListLength": 10,
  "adgroupList[9].material": {
    "materialId": 1029803691231,
    "materialName": "美的洗碗机V6pro灶下家用15套大容量全自动热风烘干消毒一体机",
    "bidCount": 141
  },
  "dayAverageBudget": 1430,
  "hasAllSiteWarningInRequest": false
}
```

#### `KT23` 高级设置 = `投放地域取消上海`

- 操作路径：
  - 打开 `高级设置 -> 投放地域`
  - 取消勾选 `上海`
- 页面行为：
  - 页面摘要从 `在全部地域投放` 变为 `在部分地域投放`
- 与 `KT01` 差异：
  - `launchAreaStrList` 从 `["all"]` 改为 `35` 个地域 ID
  - `launchPeriodList` 仍保持 `00:00-24:00`
  - `adzoneList` 不变，仍为 `2` 个开启资源位
- 关键字段：

```json
{
  "launchAreaStrListLength": 35,
  "launchAreaStrList": [
    1,
    19,
    532,
    39,
    68,
    92,
    109,
    52,
    165,
    125,
    145,
    184,
    212,
    120,
    234,
    255,
    279,
    294,
    333,
    351,
    357,
    393,
    406,
    368,
    438,
    461,
    488,
    508,
    471,
    463,
    577,
    599,
    576,
    531,
    575
  ],
  "launchPeriodList[0].timeSpanList[0].time": "00:00-24:00",
  "adzoneList": [
    {
      "adzoneId": "114790550288",
      "status": "start"
    },
    {
      "adzoneId": "114786650498",
      "status": "start"
    }
  ],
  "trendThemeListLength": 5,
  "itemIdListLength": 8,
  "adgroupListLength": 8
}
```

#### `KT24` 高级设置 = `投放时间 08:00-13:00`

- 操作路径：
  - 打开 `高级设置 -> 投放时间`
  - 将星期一到星期日统一设置为 `08:00-13:00`
- 页面行为：
  - 时间面板底层是“半小时网格”，但最终请求体会压缩为连续时间段
  - 页面摘要从 `在全部时段投放` 变为 `在部分时段投放`
- 与 `KT01` 差异：
  - `launchPeriodList` 从全天 `1` 段改为每周 `7` 条、每条 `3` 段
  - 中间有效投放段为 `08:00-13:00`
  - `launchAreaStrList` 仍为 `["all"]`
  - `adzoneList` 不变
- 关键字段：

```json
{
  "launchPeriodListLength": 7,
  "launchPeriodList[0]": {
    "dayOfWeek": 1,
    "timeSpanList": [
      {
        "time": "00:00-08:00",
        "discount": 0
      },
      {
        "time": "08:00-13:00",
        "discount": "100"
      },
      {
        "time": "13:00-24:00",
        "discount": 0
      }
    ]
  },
  "launchAreaStrList": [
    "all"
  ],
  "adzoneList": [
    {
      "adzoneId": "114790550288",
      "status": "start"
    },
    {
      "adzoneId": "114786650498",
      "status": "start"
    }
  ],
  "itemIdListLength": 8,
  "adgroupListLength": 8,
  "bidTargetV2": "conv",
  "setSingleCostV2": false
}
```

#### `KT25` 高级设置 = `投放资源位仅保留1个开启`

- 操作路径：
  - 打开 `高级设置 -> 投放资源位`
  - 关闭 `淘宝搜索` 资源位（保留 `搜索意图全域追投` 为开启）
- 页面行为：
  - 页面摘要从 `已开启2个投放位置` 变为 `已开启1个投放位置`
- 与 `KT01` 差异：
  - `adzoneList` 不再是“2个都 start”，而是“1个 pause + 1个 start”
  - `launchAreaStrList`、`launchPeriodList` 保持默认
  - `trendThemeList / itemIdList / adgroupList` 保持本场景当前值
- 关键字段：

```json
{
  "adzoneList": [
    {
      "adzoneId": "114790550288",
      "status": "pause",
      "discount": ""
    },
    {
      "adzoneId": "114786650498",
      "status": "start",
      "discount": ""
    }
  ],
  "launchAreaStrList": [
    "all"
  ],
  "launchPeriodListLength": 7,
  "dayAverageBudget": 1480,
  "trendThemeListLength": 5,
  "itemIdListLength": 8,
  "adgroupListLength": 8
}
```

### 18.7 当前覆盖状态

- `趋势明星` 的 `高级设置` 三个维度已全部覆盖：
  - `投放资源位`
  - `投放地域`
  - `投放时间`

### 18.8 开发结论

- `趋势明星` 不再提交 `wordList` 或 `searchDetentType`，而是切换为：
  - `trendThemeList`
  - `itemIdList / adgroupList`
  - `crowdList`
  - `bidTargetV2 / optimizeTarget`
- 当前已确认的出价目标映射：
  - `获取成交量 = conv`
  - `增加收藏加购量 = coll_cart`
  - `增加点击量 = click`
  - `稳定投产比 = roi`
- `稳定投产比` 当前已确认会额外引入：
  - `constraintType = "roi"`
  - `constraintValue`
- `稳定投产比` 的已覆盖 ROI 档位：
  - `5.51`
  - `6.89`
  - `8.27`
  - `自定义 7.11`
- `稳定投产比` 是当前已抓到的唯一一档“去掉 `optimizeTarget`”的目标，后续开发不能假设这两个字段始终成对出现。
- `设置平均直接成交成本` 虽然仍然是 `bidTargetV2 = conv`，但序列化模型已经切到另一套：
  - `setSingleCostV2 = true`
  - `constraintType = "dir_conv"`
  - `constraintValue`
  - `optimizeTarget` 不再提交
- `设置平均直接成交成本` 的“默认档”不是固定常量：
  - `KT09` 样本里是 `370.9`
  - 同场景追加复核时，在 `dayAverageBudget = 1430` 的页面状态下默认值变成了 `362.56`
  - 后续开发不能把默认档硬编码为单一数值，必须以页面真实返回或运行时配置为准
- `选择趋势主题` 追加主题时，不能假设“加主题 = 加商品”：
  - `trendThemeList` 新增主题对象后，若该主题 `itemCount = 0`，`itemIdList / adgroupList` 可以完全不变
- `添加自选商品` 与趋势主题是两条独立维度：
  - 新增自选商品会直接扩展 `itemIdList / adgroupList`
  - `trendThemeList` 本身不会因此变化
  - 页面提示“将暂停全站推场景计划”只是 UI 提示，不会序列化进提交体
- `清空` 不是只清商品：
  - `trendThemeList / itemIdList / adgroupList` 会一起清空
  - 但 `crowdList / adzoneList / launchAreaStrList / launchPeriodList` 默认仍然保留
- 人群结构当前已确认不是“3 个 UI 选项 = 3 条 crowdList”，而是：
  - `新客户获取` 对应 `1` 条：`3008_3000949_3000949`
  - `流失老客挽回` 对应 `1` 条：`3009_3000951_3000951`
  - `高价值客户获取` 对应 `3` 条：`3010_3000953_3000953`、`3010_3000980_26`、`3010_3000995_3000995`
- `高级设置 -> 投放地域` 当前已确认：
  - 默认是 `launchAreaStrList = ["all"]`
  - 切到部分地域后会序列化为数值型地域 ID 列表，而不是省份名称
- `高级设置 -> 投放时间` 当前已确认：
  - 页面编辑态是半小时网格
  - 最终请求体会压缩成 `launchPeriodList`
  - 有效投放段使用 `discount = "100"`，非投放段使用 `discount = 0`
- `设置优先投放客户 = 关` 与 `人群优化目标 = 关` 最终都会把 `crowdList` 清空，但这是两条不同的 UI 入口，自动化需要分别覆盖。
- 关闭单个人群时，页面会把 `人群优化目标` 视觉状态联动取消；但真实提交仍会保留剩余 `crowdList`，后续开发不能只看页面 checkbox 的视觉态。
- 结合基线和自定义样本可推断：
  - `1.3 -> discount 30`
  - `1.5 -> discount 50`
  - `1.8 -> discount 80`
  - `1.6 -> discount 60`
  - 即 `crowdList.price.discount` 很大概率等于 `(倍率 - 1) * 100`
- 这个场景默认就会带完整的趋势主题对象，而不是只传趋势主题 ID；后续组包应按 `KT01` 真实结构保留主题对象字段。
- `添加自选商品` 弹窗存在“点击成功但状态未变”的假点击现象，后续自动化不能只依赖 click 成功回执，必须以数量或商品列表是否变化作为最终断言。

## 19. 2026-04-28 `onebpSearch` 关键词推广 - 流量金卡

### 19.1 页面与入口

- 页面：
  - `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSearch&promotionScene=promotion_scene_golden_traffic_card_package`
- 一级场景：
  - `关键词推广`
- 当前营销目标：
  - `流量金卡`

### 19.2 提交前置条件

- 本目标下存在多张解决方案卡：
  - `类目精准词卡`
  - `百亿秒杀节-大促成交抢量卡`
  - `一人食炖煮家电高转化卡`
- 不同卡片的商品前置条件不同：
  - `类目精准词卡` 默认即有可投商品（本次样本为 `5` 个）
  - `百亿秒杀节-大促成交抢量卡` 默认样本为 `3` 个商品
  - `一人食炖煮家电高转化卡` 初始为空，需要先加商品才会发 `addList.json`

### 19.3 最终提交接口

- Method：`POST`
- URL：
  - `https://one.alimama.com/solution/addList.json?csrfId=<CSRF_ID>&bizCode=onebpSearch`

### 19.4 基线样本 `GK01`（类目精准词卡）

- 页面状态：
  - 解决方案：`类目精准词卡`
  - 套餐包档位：`自定义预算包`
  - 套餐包自动续投：`开`
  - 冷启加速：`开`
- 关键字段：

```json
{
  "promotionScene": "promotion_scene_golden_traffic_card_package",
  "itemSelectedMode": "user_define",
  "bidTypeV2": "smart_bid",
  "bidTargetV2": "conv",
  "packageId": 47,
  "packageTemplateId": 47,
  "planId": 171,
  "planTemplateId": 171,
  "orderInfo.planName": "自定义预算包",
  "orderInfo.orderAmount": 500,
  "orderAutoRenewalInfo": {
    "orderAutoRenewalSwitch": "1",
    "orderAutoRenewalCondition": ""
  },
  "orderChargeType": "balance_charge",
  "wordPackageList": [
    {
      "id": "5",
      "tag": {
        "bizType": 2,
        "best": "e"
      }
    }
  ],
  "wordListLength": 0,
  "itemIdListLength": 5,
  "adgroupListLength": 5,
  "campaignColdStartVO.coldStartStatus": "1",
  "launchTime.endTime": "2026-05-12",
  "launchAreaStrList": [
    "all"
  ],
  "launchPeriodListLength": 7
}
```

### 19.5 已覆盖分支

#### `GK02` 解决方案卡切到 `百亿秒杀节-大促成交抢量卡`

- 与 `GK01` 差异：
  - 套餐与计划模板切换到大促链路
  - 商品数从 `5` 变为 `3`
  - 默认投放周期变短（结束时间改为 `2026-05-04`）
- 关键字段：

```json
{
  "packageId": "2008",
  "packageTemplateId": 2008,
  "planId": 158,
  "planTemplateId": 158,
  "orderInfo.planName": "大促成交体验包",
  "orderInfo.orderAmount": 3000,
  "wordListLength": 0,
  "itemIdListLength": 3,
  "adgroupListLength": 3,
  "campaignColdStartVO.coldStartStatus": "1",
  "launchTime.endTime": "2026-05-04"
}
```

#### `GK03` 解决方案卡切到 `一人食炖煮家电高转化卡`（先补商品到 `8/30`）

- 关键事实：
  - 初始 `添加商品 = 0/30` 时不会发最终创建请求
  - 需先进入 `添加商品` 弹窗，执行 `一键上车` 并 `确定`
- 与 `GK01` 差异：
  - 词与货同时切到该卡模板
  - `wordListLength` 变为 `49`
  - `itemIdListLength/adgroupListLength` 变为 `8`
- 关键字段：

```json
{
  "packageId": "2004",
  "packageTemplateId": 2004,
  "planId": 227,
  "planTemplateId": 227,
  "orderInfo.planName": "基础起量包",
  "orderInfo.orderAmount": 3000,
  "wordListLength": 49,
  "itemIdListLength": 8,
  "adgroupListLength": 8,
  "campaignColdStartVO.coldStartStatus": "1",
  "launchTime.endTime": "2026-05-04"
}
```

#### `GK04` 套餐包档位切到 `增量畅享包`

- 前置状态：
  - 基于 `GK03`
- 与 `GK03` 差异：
  - 预算包由 `3000` 升到 `10000`
  - `planId` 从 `227` 变为 `228`
- 关键字段：

```json
{
  "packageId": "2004",
  "planId": 228,
  "orderInfo.planName": "增量畅享包",
  "orderInfo.orderAmount": 10000,
  "orderAutoRenewalInfo.orderAutoRenewalSwitch": "1",
  "wordListLength": 49,
  "itemIdListLength": 8
}
```

#### `GK05` 套餐包档位切到 `自定义成交包`

- 前置状态：
  - 基于 `GK03`
- 与 `GK03` 差异：
  - `planId` 从 `227` 变为 `229`
  - `orderAmount` 变为 `30000`
- 关键字段：

```json
{
  "packageId": "2004",
  "planId": 229,
  "orderInfo.planName": "自定义成交包",
  "orderInfo.orderAmount": 30000,
  "orderAutoRenewalInfo.orderAutoRenewalSwitch": "1",
  "wordListLength": 49,
  "itemIdListLength": 8
}
```

#### `GK06` 冷启加速 = `关`

- 前置状态：
  - 基于 `GK05`
- 与 `GK05` 差异：
  - `campaignColdStartVO.coldStartStatus` 从 `"1"` 变为 `"0"`
- 关键字段：

```json
{
  "planId": 229,
  "orderInfo.orderAmount": 30000,
  "campaignColdStartVO.coldStartStatus": "0",
  "wordListLength": 49,
  "itemIdListLength": 8
}
```

#### `GK07` 套餐包自动续投 = `关`

- 前置状态：
  - 基于 `GK06`
- 与 `GK06` 差异：
  - `orderAutoRenewalInfo.orderAutoRenewalSwitch` 从 `"1"` 变为 `"0"`
  - 页面不再出现“确认并继续创建”弹窗
- 关键字段：

```json
{
  "planId": 229,
  "orderInfo.orderAmount": 30000,
  "orderAutoRenewalInfo": {
    "orderAutoRenewalSwitch": "0"
  },
  "campaignColdStartVO.coldStartStatus": "0"
}
```

#### `GK08` 设置自动续投门槛（勾选）

- 前置状态：
  - 基于 `GK05`（自动续投已恢复为开）
- 结果：
  - 本次样本里 `orderAutoRenewalCondition` 仍为空字符串，未观测到阈值参数落盘
- 关键字段：

```json
{
  "orderAutoRenewalInfo": {
    "orderAutoRenewalSwitch": "1",
    "orderAutoRenewalCondition": ""
  }
}
```

#### `GK09` 支付方式尝试切到 `支付宝支付`

- 结果：
  - 当前样本仍序列化为 `orderChargeType = "balance_charge"`
  - 未观测到支付方式字段变化
- 关键字段：

```json
{
  "orderChargeType": "balance_charge"
}
```

### 19.6 开发结论

- `流量金卡` 的结构核心不是 ROI/constraint，而是：
  - `packageId / packageTemplateId / planId / planTemplateId`
  - `orderInfo.orderAmount`
  - `orderAutoRenewalInfo`
  - `wordList / wordPackageList`
  - `itemIdList / adgroupList`
- 同一目标下“解决方案卡”会整体替换模板：
  - 词包、商品数、预算包和投放周期会一起变化
- `一人食炖煮家电高转化卡` 初始空商品状态是硬前置：
  - 未加商品时不会发最终提交
- 自动续投开关会直接影响是否弹出“确认并继续创建”二次确认层。

## 20. 2026-04-28 `onebpSearch` 关键词推广 - 自定义推广

### 20.1 页面与入口

- 页面：
  - `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSearch&promotionScene=promotion_scene_search_user_define`
- 一级场景：
  - `关键词推广`
- 当前营销目标：
  - `自定义推广`

### 20.2 当前已抓基线 `KD01`

- 前置状态：
  - `自定义推广 -> 自定义选品`
  - 先在商品弹窗执行 `一键上车` 并确认，商品提升到 `8/30`
- 关键字段：

```json
{
  "promotionScene": "promotion_scene_search_user_define",
  "itemSelectedMode": "user_define",
  "bidTypeV2": "smart_bid",
  "bidTargetV2": "conv",
  "optimizeTarget": "conv",
  "dmcType": "day_average",
  "dayAverageBudget": 1480,
  "campaignColdStartVO.coldStartStatus": "1",
  "smartCreative": 1,
  "itemIdListLength": 8,
  "adgroupListLength": 8,
  "launchAreaStrList": [
    "all"
  ],
  "launchPeriodListLength": 7
}
```

### 20.3 已覆盖分支

#### `KD02` `AI点睛 = 关`

- 页面行为：
  - 关闭后页面从“仅智能出价”切到“智能出价/手动出价”双形态
  - `关键词设置` 与 `人群设置` 变为可直接编辑
- 关键字段：

```json
{
  "promotionScene": "promotion_scene_search_user_define",
  "itemSelectedMode": "user_define",
  "aiMaxSwitch": "0",
  "aiMaxInfo": {
    "aiMaxSwitch": "0"
  },
  "bidTypeV2": "smart_bid",
  "bidTargetV2": "conv",
  "optimizeTarget": "conv",
  "itemIdListLength": 8,
  "adgroupListLength": 8,
  "launchAreaStrList": [
    "all"
  ],
  "launchPeriodListLength": 7
}
```

#### `KD03` 核心词设置 = `添加关键词（洗碗机家用全自动）`

- 操作路径：
  - `关键词设置 -> +更多关键词`
  - `关键词推荐 -> 点击此处可手动输入添加关键词`
  - 新增关键词：`洗碗机家用全自动`
  - 选择匹配方式后确认，回到主页面离线触发 `创建完成`
- 与 `KD02` 差异：
  - `firstAdgroup.wordListLength` 从 `5` 变为 `6`
  - 新词会同步写入全部 `8` 个 `adgroup.wordList`
  - 新词对象为手动词结构（`isManual=true`），本样本 `matchScope=1`
- 关键字段：

```json
{
  "firstAdgroup.wordListLength": 6,
  "newWord": {
    "word": "洗碗机家用全自动",
    "bidPrice": 2.84,
    "isManual": true,
    "matchScope": 1,
    "onlineStatus": 1,
    "originalWord": ""
  },
  "newWordHitAdgroupCount": 8,
  "wordPackageStrategyIds": [
    1,
    2,
    3
  ],
  "aiMaxSwitch": "0",
  "itemIdListLength": 8,
  "adgroupListLength": 8
}
```

### 20.4 当前待补分支

- `出价目标`、`平均直接净成交成本`、`预算类型` 的逐项差异
- `高级设置 -> 投放资源位/地域/时段` 的非默认样本
