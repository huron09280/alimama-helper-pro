import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getBlock(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.ok(start > -1 && end > start, `无法定位代码块: ${startMarker}`);
  return source.slice(start, end);
}

test('关键词推广自定义推广默认策略改为智能出价', () => {
  const block = getBlock(
    'const getDefaultStrategyList = () => ([',
    'const wizardDefaultDraft = () => ({'
  );
  assert.match(
    block,
    /id:\s*'custom_define'[\s\S]*bidMode:\s*'smart'/,
    '自定义推广默认策略仍不是智能出价'
  );
});

test('自定义推广目标运行时不再强制切到手动出价', () => {
  const block = getBlock(
    "const resolveKeywordGoalRuntime = (goalLabel = '') => {",
    'const handleGenerateOtherStrategies = () => {'
  );
  assert.doesNotMatch(
    block,
    /normalizedGoal === '自定义推广' \? 'manual' : 'smart'/,
    '仍存在自定义推广强制手动出价逻辑'
  );
  assert.match(
    block,
    /bidMode:\s*'smart'/,
    '关键词目标运行时未默认智能出价'
  );
});

test('关键词单元裁剪不再按手动出价强制清空词包字段', () => {
  const block = getBlock(
    'const pruneKeywordAdgroupForCustomScene = (adgroup = {}, item = null, options = {}) => {',
    'const deriveFallbackKeywordListFromItem = (item = {}, keywordDefaults = {}) => {'
  );
  assert.match(
    block,
    /wordPackageList/,
    '关键词单元裁剪未处理词包字段'
  );
  assert.match(
    block,
    /if \(hasOwn\(input, 'wordPackageList'\)\) \{/,
    '关键词单元裁剪未透传词包字段'
  );
  assert.doesNotMatch(
    block,
    /if \(!isManual && hasOwn\(input, 'wordPackageList'\)\)/,
    '关键词单元裁剪仍在手动出价下强制清空词包'
  );
});

test('关键词建计划时向单元裁剪传入当前出价模式', () => {
  assert.match(
    source,
    /pruneKeywordAdgroupForCustomScene\(merged\.adgroup,\s*hasItem \? item : null,\s*\{\s*bidMode:\s*planBidMode\s*\}\)/,
    '关键词建计划未将当前出价模式传给单元裁剪逻辑'
  );
});

test('关键词自定义推广保留资源位列表并交由场景配置透传', () => {
  const block = getBlock(
    'const pruneKeywordCampaignForCustomScene = (campaign = {}, options = {}) => {',
    'const pruneKeywordAdgroupForCustomScene = (adgroup = {}, item = null, options = {}) => {'
  );
  assert.doesNotMatch(
    block,
    /if \(out\.promotionScene === 'promotion_scene_search_user_define'\)\s*\{[\s\S]*out\.adzoneList = \[];[\s\S]*\}/,
    '关键词自定义推广仍在强制清空 adzoneList'
  );
  assert.match(block, /if \(!Array\.isArray\(out\.adzoneList\)\) out\.adzoneList = \[];/, '缺少 adzoneList 数组兜底');
});

test('关键词自定义推广缺省资源位与人群会回落到运行时模板', () => {
  const block = getBlock(
    'const pruneKeywordCampaignForCustomScene = (campaign = {}, options = {}) => {',
    'const pruneKeywordAdgroupForCustomScene = (adgroup = {}, item = null, options = {}) => {'
  );
  assert.match(
    block,
    /const resolveNonEmptyArrayField = \(field = '', fallback = \[]\) => \{/,
    '缺少数组字段回落解析器'
  );
  assert.match(
    block,
    /out\.crowdList = resolveNonEmptyArrayField\(\s*'crowdList',[\s\S]*\);/,
    'crowdList 未回落到运行时模板'
  );
  assert.match(
    block,
    /out\.adzoneList = resolveNonEmptyArrayField\(\s*'adzoneList',[\s\S]*\);/,
    'adzoneList 未回落到运行时模板'
  );
});

test('关键词手动出价提交会移除出价目标字段（bidTargetV2/optimizeTarget）', () => {
  const block = getBlock(
    'const pruneKeywordCampaignForCustomScene = (campaign = {}, options = {}) => {',
    'const pruneKeywordAdgroupForCustomScene = (adgroup = {}, item = null, options = {}) => {'
  );
  assert.match(
    block,
    /if \(isManual\)\s*\{[\s\S]*delete out\.bidTargetV2;[\s\S]*delete out\.optimizeTarget;[\s\S]*\}/,
    '手动出价分支未清理 bidTargetV2/optimizeTarget'
  );
});

test('关键词智能出价仅在单次成本有效时才保留 setSingleCostV2', () => {
  const block = getBlock(
    'const pruneKeywordCampaignForCustomScene = (campaign = {}, options = {}) => {',
    'const pruneKeywordAdgroupForCustomScene = (adgroup = {}, item = null, options = {}) => {'
  );
  assert.match(
    block,
    /const singleCostValue = toNumber\(out\.singleCostV2, NaN\);/,
    '缺少 singleCostV2 数值校验'
  );
  assert.match(
    block,
    /if \(out\.setSingleCostV2 && Number\.isFinite\(singleCostValue\) && singleCostValue > 0\) \{/,
    '未按有效 singleCostV2 决定是否启用 setSingleCostV2'
  );
  assert.match(
    block,
    /out\.setSingleCostV2 = false;[\s\S]*delete out\.singleCostV2;/,
    'singleCostV2 无效时未回退到关闭状态'
  );
});

test('关键词出价模式判定会读取目标强制覆盖来源避免误判手动', () => {
  const block = getBlock(
    'const resolvePlanBidMode = ({ plan = {}, request = {}, runtime = {}, campaign = {} } = {}) => {',
    'const normalizeKeywordWordListForSubmit = (wordList = []) => {'
  );
  assert.match(
    block,
    /plan\?\.__goalResolution\?\.resolvedMarketingGoal/,
    '未读取计划级目标解析结果'
  );
  assert.match(
    block,
    /request\?\.__goalResolution\?\.resolvedMarketingGoal/,
    '未读取请求级目标解析结果'
  );
  assert.match(
    block,
    /plan\?\.goalForcedCampaignOverride\?\.promotionScene/,
    '未读取计划级目标强制营销场景'
  );
  assert.match(
    block,
    /request\?\.goalForcedCampaignOverride\?\.promotionScene/,
    '未读取请求级目标强制营销场景'
  );
  assert.match(
    block,
    /request\?\.sceneForcedCampaignOverride\?\.promotionScene/,
    '未读取场景级营销场景覆盖'
  );
});

test('关键词自定义推广不再强制改为智能出价', () => {
  const block = getBlock(
    'const resolvePlanBidMode = ({ plan = {}, request = {}, runtime = {}, campaign = {} } = {}) => {',
    'const normalizeKeywordWordListForSubmit = (wordList = []) => {'
  );
  assert.doesNotMatch(
    block,
    /keywordGoal === '自定义推广'[\s\S]*keywordSceneHint === 'promotion_scene_search_user_define'[\s\S]*keywordItemModeHint === 'user_define'[\s\S]*return 'smart';/,
    '仍存在“自定义推广/自定义选品强制智能出价”逻辑'
  );
});

test('关键词提交失败后不再执行词包校验降级重提', () => {
  const block = getBlock(
    'const buildFailureFromEntry = (entry = {}, fallbackError = \'\') => ({',
    'const result = {'
  );
  assert.doesNotMatch(
    block,
    /fallback_downgrade_pending|fallback_downgrade_confirmed|fallback_downgrade_result|downgradeKeywordEntryToManual/,
    '仍存在失败后降级重提逻辑'
  );
});

test('关键词智能出价词包为空时会回落到模板词包', () => {
  const block = getBlock(
    'let keywordBundle = {',
    'if (sceneCapabilities.hasMaterial && hasItem) {'
  );
  assert.match(
    block,
    /const templateWordPackageList = Array\.isArray\(baseAdgroup\?\.wordPackageList\)/,
    '未读取模板词包作为兜底'
  );
  assert.match(
    block,
    /if \(keywordBundle\.useWordPackage && !keywordBundle\.wordPackageList\.length && templateWordPackageList\.length\) \{/,
    '缺少按词包开关兜底的模板回落分支'
  );
  assert.match(
    block,
    /keywordBundle\.wordPackageList = templateWordPackageList\.slice\(0, 100\);/,
    '模板词包未写回关键词提交载荷'
  );
});

test('关键词手动出价对齐原生提交，不再要求词包数必须为 0', () => {
  const block = getBlock(
    'const compareWizardParityCase = ({',
    'const runWizardSceneParityTest = async (options = {}) => {'
  );
  assert.doesNotMatch(
    block,
    /expectedBidMode === 'manual'[\s\S]*field:\s*'wordPackageCount'/,
    '手动出价比对仍要求词包数必须为 0'
  );
});

test('关键词手动出价在开启流量智选时仍会请求词包推荐', () => {
  const block = getBlock(
    'const buildKeywordBundle = async ({ plan, item, runtimeDefaults, request, requestOptions }) => {',
    'const extractPageAddedItemIds = () => {'
  );
  assert.match(
    block,
    /if \(useWordPackage\) \{[\s\S]*fetchRecommendWordPackageList/,
    '未在流量智选开启时请求词包推荐'
  );
  assert.match(
    block,
    /if \(mode !== 'manual'\)\s*\{[\s\S]*fetchRecommendWordList[\s\S]*\}\s*if \(useWordPackage\) \{/,
    '词包推荐仍未从手动模式分支中拆出'
  );
});

test('关键词词包推荐请求会为 bidTargetV2 提供默认兜底，避免手动模式返回空词包', () => {
  const block = getBlock(
    'const buildKeywordBundle = async ({ plan, item, runtimeDefaults, request, requestOptions }) => {',
    'const extractPageAddedItemIds = () => {'
  );
  assert.match(
    block,
    /bidTargetV2:\s*runtimeDefaults\.bidTargetV2\s*\|\|\s*DEFAULTS\.bidTargetV2/,
    '词包推荐请求缺少 bidTargetV2 兜底'
  );
});
