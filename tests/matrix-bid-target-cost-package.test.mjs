import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

test('矩阵模板补充智能出价目标包维度', () => {
  assert.match(
    source,
    /key:\s*'bid_target_cost_package'[\s\S]*?label:\s*'智能出价目标包'[\s\S]*?sceneNames:\s*\['关键词推广'\][\s\S]*?hint:\s*'仅用于关键词推广-自定义推广-智能出价；每个出价目标单独占一行，同一行可追加多个目标成本\/ROI值，不用手写分隔符。'[\s\S]*?valueInputMode:\s*'package_rows'[\s\S]*?suggestedValues:\s*\['获取成交量\|35',\s*'增加收藏加购量\|1\.88',\s*'增加点击量\|1\.29',\s*'稳定投产比\|5'\]/,
    '矩阵模板缺少智能出价目标包预设'
  );
});

test('智能出价目标包改为结构化行编辑，不再依赖纯文本 textarea 协议输入', () => {
  assert.match(source, /const buildMatrixBidTargetCostPackageRows = \(values = \[\]\) => \(/, '缺少智能出价目标包结构化行 helper');
  assert.match(source, /const buildMatrixBidTargetCostPackageRowValue = \(row = \{\}\) => \{/, '缺少智能出价目标包行值序列化 helper');
  assert.match(source, /const buildMatrixBidTargetCostPackageCostItemHtml = \(costValue = '', targetOptionValue = '', costIndex = 0\) => \{/, '缺少智能出价目标包行内成本项 helper');
  assert.match(
    source,
    /const buildMatrixBidTargetCostPackageCostItemHtml = \(costValue = '', targetOptionValue = '', costIndex = 0\) => \{[\s\S]*?const widthChars = Math\.max\(3, Math\.min\(10, \(displayValue \|\| costPlaceholder \|\| ''\)\.length \|\| 3\)\);[\s\S]*?size="\$\{widthChars\}"[\s\S]*?--am-wxt-matrix-bid-package-cost-chars:\$\{widthChars\};padding:0 7px;border:0;background:transparent;text-align:center;box-shadow:none;outline:none;-webkit-appearance:none;appearance:none;/,
    '智能出价目标包初始输入框未内联同步无边框自适应样式'
  );
  assert.match(source, /const getMatrixBidTargetCostPackageRowMaxCostValue = \(packageRow = null\) => \{/, '缺少智能出价目标包当前行最高成本 helper');
  assert.match(source, /const getMatrixBidTargetCostPackageBatchDraft = \(packageRow = null\) => \(\{/, '缺少智能出价目标包批量草稿 helper');
  assert.match(source, /const setMatrixBidTargetCostPackageBatchDraft = \(packageRow = null, options = \{\}\) => \{/, '缺少智能出价目标包批量草稿写入 helper');
  assert.match(source, /const buildMatrixBidTargetCostPackageBatchMenuHtml = \(targetOptionValue = '', baseCost = NaN, options = \{\}\) => \{/, '缺少智能出价目标包批量菜单渲染 helper');
  assert.match(source, /const appendMatrixBidTargetCostPackageBatchCosts = \(packageRow = null, options = \{\}\) => \{/, '缺少智能出价目标包批量追加 helper');
  assert.match(source, /const readMatrixBidTargetCostPackageValuesFromRow = \(row = null\) => \{/, '缺少智能出价目标包读值 helper');
  assert.match(source, /const syncMatrixBidTargetCostPackageStateFromRow = \(row = null\) => \{/, '缺少智能出价目标包行同步 helper');
  assert.match(source, /const mergeMatrixBidTargetCostPackageRowsFromDom = \(row = null\) => \{/, '缺少智能出价目标包同目标分组合并 helper');
  assert.match(
    source,
    /const readMatrixDimensionValuesFromRow = \(row = null, sceneName = ''\) => \{[\s\S]*?String\(preset\?\.valueInputMode \|\| ''\)\.trim\(\) === 'package_rows'[\s\S]*?readMatrixBidTargetCostPackageValuesFromRow\(row\)/,
    '矩阵维度读值链路未接入结构化目标包'
  );
  assert.match(source, /data-matrix-bid-package-list="1"/, '矩阵页缺少智能出价目标包列表容器');
  assert.match(source, /data-matrix-bid-package-row="1"/, '矩阵页缺少智能出价目标包目标行容器');
  assert.match(source, /class="am-wxt-matrix-bid-package-row-head"/, '矩阵页缺少智能出价目标包目标头部容器');
  assert.match(source, /class="am-wxt-matrix-bid-package-row-body"/, '矩阵页缺少智能出价目标包数值独立行容器');
  assert.match(source, /data-matrix-bid-package-target="1"/, '矩阵页缺少智能出价目标包目标隐藏控件');
  assert.match(source, /data-matrix-bid-package-cost-list="1"/, '矩阵页缺少智能出价目标包行内成本列表');
  assert.match(source, /data-matrix-bid-package-cost="1"/, '矩阵页缺少智能出价目标包成本输入');
  assert.match(source, /data-matrix-bid-package-cost-remove="1"/, '矩阵页缺少智能出价目标包行内成本删除按钮');
  assert.match(source, /data-matrix-bid-package-cost-add="1"/, '矩阵页缺少智能出价目标包行内成本追加按钮');
  assert.match(source, /data-matrix-bid-package-cost-actions="1"/, '矩阵页缺少智能出价目标包行内成本操作下拉容器');
  assert.match(source, /data-matrix-bid-package-cost-batch-menu="1"/, '矩阵页缺少智能出价目标包批量菜单面板');
  assert.match(source, /data-matrix-bid-package-batch-manual="1"/, '矩阵页缺少智能出价目标包手动新增按钮');
  assert.match(source, /data-matrix-bid-package-batch-interval="1"/, '矩阵页缺少智能出价目标包批量区间输入');
  assert.match(source, /data-matrix-bid-package-batch-count="1"/, '矩阵页缺少智能出价目标包批量个数输入');
  assert.match(source, /data-matrix-bid-package-batch-add="1"/, '矩阵页缺少智能出价目标包批量追加按钮');
  assert.match(source, /data-matrix-bid-package-remove="1"/, '矩阵页缺少智能出价目标包整行删除按钮');
  assert.match(
    source,
    /groupedRowMap\.get\(item\.targetOptionValue\)\.costValues\.push\(item\.costValue\)/,
    '智能出价目标包未按目标聚合同一行多个成本'
  );
  assert.match(
    source,
    /class="am-wxt-matrix-bid-package-target-option[\s\S]*?data-matrix-bid-package-target-option="1"[\s\S]*?data-value="\$\{Utils\.escapeHtml\(item\.value\)\}"/,
    '智能出价目标包下拉仍未切到紧凑按钮菜单'
  );
  assert.match(
    source,
    /\.am-wxt-matrix-bid-package-row \{[\s\S]*?display: flex;[\s\S]*?flex-direction: column;/,
    '智能出价目标包目标与数值仍未拆成上下两行'
  );
  assert.match(
    source,
    /\.am-wxt-matrix-bid-package-row input \{[\s\S]*?width: calc\(var\(--am-wxt-matrix-bid-package-cost-chars, 4\) \* 1ch \+ 14px\);[\s\S]*?min-width: calc\(3ch \+ 14px\);[\s\S]*?max-width: calc\(10ch \+ 14px\);[\s\S]*?border: 0;/,
    '智能出价目标包数值输入框未切到无边框自适应宽度'
  );
  assert.match(
    source,
    /\.am-wxt-matrix-bid-package-cost-remove \{[\s\S]*?width: 14px;[\s\S]*?margin-left: -14px;[\s\S]*?visibility: hidden;[\s\S]*?opacity: 0;[\s\S]*?pointer-events: none;[\s\S]*?transform: translateX\(4px\) scale\(0\.82\);/,
    '目标成本删除 X 默认态未改为非 0 宽隐藏'
  );
  assert.match(
    source,
    /\.am-wxt-matrix-bid-package-cost-item:hover \.am-wxt-matrix-bid-package-cost-remove \{[\s\S]*?width: 26px;[\s\S]*?margin-left: 0;[\s\S]*?visibility: visible;[\s\S]*?pointer-events: auto;/,
    '目标成本删除 X hover 态未恢复完整占位'
  );
  assert.match(
    source,
    /\.am-wxt-matrix-bid-package-remove \{[\s\S]*?width: 18px;[\s\S]*?margin-left: -18px;[\s\S]*?visibility: hidden;[\s\S]*?opacity: 0;[\s\S]*?pointer-events: none;[\s\S]*?transform: translateX\(6px\) scale\(0\.78\);/,
    '目标包删除 X 默认态未改为非 0 宽隐藏'
  );
  assert.match(
    source,
    /\.am-wxt-matrix-bid-package-row:hover \.am-wxt-matrix-bid-package-remove \{[\s\S]*?width: 32px;[\s\S]*?margin-left: 0;[\s\S]*?visibility: visible;[\s\S]*?pointer-events: auto;/,
    '目标包删除 X hover 态未恢复完整占位'
  );
  assert.match(
    source,
    /const bidPackageTargetOptionBtn = event\.target instanceof Element[\s\S]*?closest\('\[data-matrix-bid-package-target-option="1"\]'\)/,
    '智能出价目标包下拉点击未接入按钮菜单事件'
  );
  assert.doesNotMatch(source, /<span class="am-wxt-matrix-chip">结构化编辑<\/span>/, '智能出价目标包仍保留冗余结构化编辑标签');
  assert.match(
    source,
    /data-matrix-bid-package-cost-add="1"[\s\S]*?data-matrix-bid-package-picker-toggle="1"[\s\S]*?>\+<\/button>/,
    '智能出价目标包行内新增按钮未接入下拉菜单或仍保留冗余文字'
  );
  assert.doesNotMatch(source, /class="am-wxt-matrix-bid-package-footer"/, '智能出价目标包底部 footer 未移除');
  assert.doesNotMatch(source, /class="am-wxt-matrix-bid-package-add"/, '智能出价目标包底部新增目标按钮未移除');
  assert.doesNotMatch(source, /class="am-wxt-matrix-bid-package-suggest"/, '智能出价目标包仍保留快捷提示标签');
  assert.match(
    source,
    /const buildMatrixBidTargetCostPackageBatchMenuHtml = \(targetOptionValue = '', baseCost = NaN, options = \{\}\) => \{[\s\S]*?data-matrix-bid-package-batch-interval="1"[\s\S]*?data-matrix-bid-package-batch-count="1"[\s\S]*?>批量新增<\/button>/,
    '智能出价目标包批量菜单未改为用户自填区间和个数'
  );
  assert.match(
    source,
    /const appendMatrixBidTargetCostPackageBatchCosts = \(packageRow = null, options = \{\}\) => \{[\s\S]*?getMatrixBidTargetCostPackageRowMaxCostValue\(packageRow\)[\s\S]*?const nextCostValue = formatMatrixBidTargetCostPackageAmount\(baseCost \+ interval \* step\)/,
    '智能出价目标包批量追加未基于当前最高成本递增生成'
  );
  assert.match(
    source,
    /const bidPackageCostAddBtn = event\.target instanceof Element[\s\S]*?closest\('\[data-matrix-bid-package-cost-add="1"\]'\)/,
    '智能出价目标包同目标追加成本按钮未接入点击链路'
  );
  assert.match(
    source,
    /const bidPackageBatchAddBtn = event\.target instanceof Element[\s\S]*?closest\('\[data-matrix-bid-package-batch-add="1"\]'\)[\s\S]*?const intervalInput = batchMenu\?\.querySelector\('\[data-matrix-bid-package-batch-interval="1"\]'\)[\s\S]*?const countInput = batchMenu\?\.querySelector\('\[data-matrix-bid-package-batch-count="1"\]'\)[\s\S]*?appendMatrixBidTargetCostPackageBatchCosts\(packageRow,\s*\{[\s\S]*?interval:\s*intervalValue[\s\S]*?count:\s*countValue/,
    '智能出价目标包批量菜单点击未读取自填区间和个数'
  );
  assert.match(
    source,
    /const bidPackageBatchManualBtn = event\.target instanceof Element[\s\S]*?closest\('\[data-matrix-bid-package-batch-manual="1"\]'\)[\s\S]*?appendMatrixBidTargetCostPackageBatchCosts\(packageRow,\s*\{[\s\S]*?mode:\s*'manual'/,
    '智能出价目标包手动新增按钮未接入链路'
  );
  assert.match(
    source,
    /event\.target instanceof HTMLInputElement && event\.target\.matches\('\[data-matrix-bid-package-batch-interval="1"\], \[data-matrix-bid-package-batch-count="1"\]'\)[\s\S]*?setMatrixBidTargetCostPackageBatchDraft\(packageRow,\s*\{/,
    '智能出价目标包批量区间和个数字段未保留输入草稿'
  );
  assert.match(
    source,
    /const bidPackageCostRemoveBtn = event\.target instanceof Element[\s\S]*?closest\('\[data-matrix-bid-package-cost-remove="1"\]'\)/,
    '智能出价目标包行内成本删除按钮未接入点击链路'
  );
});

test('智能出价目标包会先做行级归一，再生成组合标签', () => {
  assert.match(
    source,
    /const resolveMatrixBidTargetCostConfig = \(bidTarget = ''\) => \{/,
    '矩阵页缺少可直接访问的智能出价目标成本配置 helper'
  );
  assert.match(
    source,
    /const MATRIX_BID_TARGET_OPTIONS = \[[\s\S]*?value: 'conv', label: '获取成交量'[\s\S]*?value: 'roi', label: '稳定投产比'[\s\S]*?\];/,
    '矩阵页缺少可直接访问的智能出价目标文案映射'
  );
  assert.match(source, /const parseMatrixBidTargetCostPackageValue = \(value = ''\) => \{/, '缺少智能出价目标包解析 helper');
  assert.match(
    source,
    /parseMatrixBidTargetCostPackageValue = \(value = ''\) => \{[\s\S]*?resolveMatrixBidTargetCostConfig\(targetOptionValue\)[\s\S]*?MATRIX_BID_TARGET_OPTIONS\.find\(item => item\.value === targetOptionValue\)\?\.label/,
    '智能出价目标包解析仍依赖编辑计划作用域 helper'
  );
  assert.match(
    source,
    /const normalizeMatrixDimensionValuesByPreset = \(values = \[\], preset = null\) => \{[\s\S]*?String\(preset\?\.key \|\| ''\)\.trim\(\) === 'bid_target_cost_package'[\s\S]*?parseMatrixBidTargetCostPackageValue\(item\)\?\.rawValue/,
    '智能出价目标包未做行级归一'
  );
  assert.match(
    source,
    /const buildMatrixCombinationValueLabel = \(dimension = \{\}, value = '', sceneName = ''\) => \{[\s\S]*?bid_target_cost_package[\s\S]*?displayLabel/,
    '智能出价目标包组合标签未单独格式化'
  );
  assert.match(
    source,
    /values:\s*current\.slice\(\),[\s\S]*?dimension\.values\.forEach\(\(value\) => \{[\s\S]*?value:\s*rawValue,[\s\S]*?label:\s*buildMatrixCombinationValueLabel\(dimension,\s*rawValue,\s*config\.sceneName \|\| options\?\.sceneName \|\| ''\)/,
    '矩阵组合未保留智能出价目标包原值与展示标签'
  );
});

test('智能出价目标包批量菜单补充间隔说明并收窄宽度', () => {
  assert.match(
    source,
    /class="am-wxt-matrix-bid-package-batch-help">间隔填“隔多少”，个数填“生成多少个”<\/div>/,
    '智能出价目标包批量菜单缺少间隔与个数说明'
  );
  assert.match(
    source,
    /\.am-wxt-matrix-bid-package-cost-batch-menu \{[\s\S]*?width: 196px;[\s\S]*?min-width: 196px;[\s\S]*?max-width: 196px;/,
    '智能出价目标包批量菜单宽度未收窄到固定值'
  );
});

test('矩阵绑定 key 支持智能出价目标包别名', () => {
  assert.match(
    source,
    /compact === 'bidtargetcostpackage'[\s\S]*?compact === 'bidtargetcost'[\s\S]*?compact === '出价目标目标成本'[\s\S]*?compact === '出价目标\+目标值'[\s\S]*?compact === '智能出价目标包'[\s\S]*?return 'bid_target_cost_package';/,
    '矩阵绑定 key 未支持智能出价目标包'
  );
});

test('智能出价目标包会强制落到关键词自定义智能出价所需字段', () => {
  assert.match(
    source,
    /if \(bindingKey === 'bid_target_cost_package'\) \{[\s\S]*?resolveMatrixBidTargetCostConfig\(targetPackage\.targetOptionValue\)[\s\S]*?plan\.bidMode = 'smart';[\s\S]*?plan\.marketingGoal = '自定义推广';[\s\S]*?plan\.campaignOverride\.bidTypeV2 = bidModeToBidType\('smart'\);[\s\S]*?plan\.campaignOverride\.bidTargetV2 = submitBidTargetV2;[\s\S]*?plan\.campaignOverride\.optimizeTarget = submitBidTargetV2;/,
    '智能出价目标包未强制写入智能出价目标'
  );
  assert.match(
    source,
    /if \(targetPackage\.targetOptionValue === 'roi'\) \{[\s\S]*?constraintType = 'roi';[\s\S]*?constraintValue = targetPackage\.amount;[\s\S]*?setSingleCostV2 = false;[\s\S]*?delete plan\.campaignOverride\.singleCostV2;[\s\S]*?\} else \{[\s\S]*?plan\.campaignOverride\.setSingleCostV2 = true;[\s\S]*?plan\.campaignOverride\.singleCostV2 = targetPackage\.amount;/,
    '智能出价目标包未按 ROI / 目标成本分流'
  );
  assert.match(
    source,
    /applySceneSetting\('营销目标', '自定义推广'\);[\s\S]*?applySceneSetting\('选择卡位方案', '自定义推广'\);[\s\S]*?applySceneSetting\('出价方式', '智能出价'\);[\s\S]*?applySceneSetting\('出价目标', targetPackage\.targetLabel\);/,
    '智能出价目标包未同步场景目标字段'
  );
  assert.match(
    source,
    /if \(targetCostConfig\?\.switchLabel\) \{[\s\S]*?applySceneSetting\(targetCostConfig\.switchLabel,\s*targetCostConfig\.switchOnValue \|\| '开启'\);[\s\S]*?\}[\s\S]*?if \(Array\.isArray\(targetCostConfig\?\.valueLabels\) && targetCostConfig\.valueLabels\.length\) \{[\s\S]*?applySceneSetting\(targetCostConfig\.valueLabels\[0\],\s*targetPackage\.costValue\);[\s\S]*?\}[\s\S]*?if \(targetPackage\.targetOptionValue !== 'roi'\) \{[\s\S]*?applySceneSetting\('目标成本', targetPackage\.costValue\);/,
    '智能出价目标包未同步目标成本场景字段'
  );
});

test('矩阵物化顺序支持智能出价目标包覆盖普通出价目标', () => {
  assert.match(
    source,
    /'bid_mode',[\s\S]*?'bid_target',[\s\S]*?'bid_target_cost_package',[\s\S]*?'plan_prefix'/,
    '矩阵物化顺序未把智能出价目标包放在普通出价目标之后'
  );
});

test('关键词矩阵推荐优先露出智能出价目标包', () => {
  assert.match(
    source,
    /const preferredPresetKeys = sceneName === '关键词推广'[\s\S]*?'budget',\s*'bid_mode',\s*'bid_target_cost_package',\s*'plan_prefix',\s*'material_id',\s*'bid_target'/,
    '关键词矩阵推荐维度未优先露出智能出价目标包'
  );
  assert.match(
    source,
    /推荐先配预算、出价方式、智能出价目标包、计划名前缀、商品，再补充匹配方式等场景维度。/,
    '矩阵页提示文案未同步到智能出价目标包'
  );
});

test('关键词矩阵场景维度会隐藏已被智能出价目标包承接的目标成本子字段', () => {
  assert.match(
    source,
    /const MATRIX_KEYWORD_BID_TARGET_COST_FIELD_LABEL_RE = \/.*设置7日投产比.*目标投产比.*目标成本.*设置平均点击成本.*点击成本.*\$\//,
    '缺少关键词智能出价目标成本子字段白名单'
  );
  assert.match(
    source,
    /const shouldHideMatrixKeywordBidTargetCostField = \(fieldLabel = '', sceneName = '', marketingGoal = ''\) => \{[\s\S]*?getMatrixSceneName\(sceneName\) !== '关键词推广'[\s\S]*?normalizeMatrixGoalCandidateLabel\(marketingGoal\)[\s\S]*?normalizedGoal !== '自定义推广'[\s\S]*?MATRIX_KEYWORD_BID_TARGET_COST_FIELD_LABEL_RE\.test\(normalizedFieldLabel\)/,
    '缺少关键词智能出价目标成本子字段隐藏 helper'
  );
  assert.match(
    source,
    /const getMatrixSceneDimensionFieldLabels = \(sceneName = ''\) => \{[\s\S]*?if \(shouldHideMatrixKeywordBidTargetCostField\(normalizedFieldLabel,\s*normalizedSceneName,\s*activeMarketingGoal\)\) return false;/,
    '矩阵场景维度未收起智能出价目标成本子字段'
  );
});
