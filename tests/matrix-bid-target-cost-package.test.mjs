import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

test('矩阵模板补充智能出价目标包维度', () => {
  assert.match(
    source,
    /key:\s*'bid_target_cost_package'[\s\S]*?label:\s*'智能出价目标包'[\s\S]*?sceneNames:\s*\['关键词推广'\][\s\S]*?hint:\s*'仅用于关键词推广-自定义推广-智能出价；每行填写“出价目标\|目标成本\/ROI值”，按整组组合。'[\s\S]*?suggestedValues:\s*\['获取成交量\|35',\s*'增加收藏加购量\|1\.88',\s*'增加点击量\|1\.29',\s*'稳定投产比\|5'\]/,
    '矩阵模板缺少智能出价目标包预设'
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
