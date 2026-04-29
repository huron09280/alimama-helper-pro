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

test('关键词四类营销目标具备独立运行时契约', () => {
    const runtimeBlock = getBlock(
        'const KEYWORD_GOAL_RUNTIME_FALLBACK_MAP = [',
        'const SCENE_GOAL_FIELD_ROW_FALLBACK = {'
    );

    assert.match(
        runtimeBlock,
        /pattern:\s*\/\(搜索卡位\|卡位\)\/[\s\S]*promotionScene:\s*'promotion_scene_search_detent'[\s\S]*itemSelectedMode:\s*'search_detent'[\s\S]*bidType:\s*'max_amount'[\s\S]*dmcType:\s*'day_average'[\s\S]*searchDetentType:\s*'first_place'/,
        '搜索卡位缺少 max_amount/day_average/searchDetentType 契约'
    );
    assert.match(
        runtimeBlock,
        /pattern:\s*\/\(趋势明星\|趋势\|渗透\)\/[\s\S]*promotionScene:\s*'promotion_scene_search_trend'[\s\S]*itemSelectedMode:\s*'trend'[\s\S]*bidTypeV2:\s*'smart_bid'[\s\S]*bidTargetV2:\s*'conv'[\s\S]*trendType:\s*'0'/,
        '趋势明星缺少 trend 原生契约'
    );
    assert.match(
        runtimeBlock,
        /pattern:\s*\/\(流量金卡\|金卡\)\/[\s\S]*promotionScene:\s*'promotion_scene_golden_traffic_card_package'[\s\S]*itemSelectedMode:\s*'user_define'[\s\S]*bidTypeV2:\s*'smart_bid'[\s\S]*bidTargetV2:\s*'conv'/,
        '流量金卡缺少 user_define + conv 契约'
    );
});

test('关键词 P0 原生字段不会被流量字段裁剪和 allowlist 删除', () => {
    const stripBlock = getBlock(
        'const KEYWORD_NATIVE_CAMPAIGN_CONTRACT_KEYS = new Set([',
        'const normalizeBidMode = (value, fallback = \'smart\') => {'
    );
    for (const key of [
        'searchDetentType',
        'trendType',
        'trendThemeList',
        'packageId',
        'packageTemplateId',
        'planId',
        'planTemplateId',
        'orderInfo',
        'orderAutoRenewalInfo',
        'orderChargeType',
        'launchTime',
        'aiMaxSwitch',
        'aiMaxInfo'
    ]) {
        assert.match(stripBlock, new RegExp(`'${key}'`), `P0 字段未纳入关键词原生字段保留集: ${key}`);
    }
    assert.match(
        stripBlock,
        /!KEYWORD_NATIVE_CAMPAIGN_CONTRACT_KEYS\.has\(key\)[\s\S]*KEYWORD_TRAFFIC_PACKAGE_FIELD_RE\.test\(lower\)/,
        '流量字段裁剪未豁免 P0 原生字段'
    );
});

test('关键词最终组包按目标拆分搜索卡位、趋势明星、流量金卡契约', () => {
    const pruneBlock = getBlock(
        'const pruneKeywordCampaignForCustomScene = (campaign = {}, options = {}) => {',
        'const pruneKeywordAdgroupForCustomScene = (adgroup = {}, item = null, options = {}) => {'
    );

    assert.match(
        pruneBlock,
        /isSearchDetentContract[\s\S]*out\.promotionScene = 'promotion_scene_search_detent'[\s\S]*out\.itemSelectedMode = 'search_detent'[\s\S]*out\.bidType = 'max_amount'[\s\S]*delete out\.bidTypeV2[\s\S]*out\.dmcType = 'day_average'[\s\S]*out\.searchDetentType = mapKeywordSearchDetentTypeValue/,
        '搜索卡位最终组包未强制原生 max_amount/day_average/searchDetentType'
    );
    assert.match(
        pruneBlock,
        /isTrendContract[\s\S]*out\.promotionScene = 'promotion_scene_search_trend'[\s\S]*out\.itemSelectedMode = 'trend'[\s\S]*out\.trendType[\s\S]*trendBidTarget === 'roi'[\s\S]*delete out\.optimizeTarget[\s\S]*trendBidTarget === 'conv' && out\.setSingleCostV2[\s\S]*out\.constraintType = 'dir_conv'/,
        '趋势明星最终组包未区分 ROI 与平均直接成交成本契约'
    );
    assert.match(
        pruneBlock,
        /isGoldenTrafficCardContract[\s\S]*out\.promotionScene = 'promotion_scene_golden_traffic_card_package'[\s\S]*out\.itemSelectedMode = 'user_define'[\s\S]*out\.bidTargetV2 = 'conv'[\s\S]*delete out\.optimizeTarget[\s\S]*out\.orderChargeType/,
        '流量金卡最终组包未强制 user_define/conv/orderChargeType 契约'
    );
});

test('关键词编辑态按目标隐藏不匹配控件', () => {
    const renderBlock = getBlock(
        'const renderSceneDynamicConfig = () => {',
        'const collectManualKeywordRowsFromPanel = (panel) => ('
    );

    assert.match(
        renderBlock,
        /const isFixedKeywordBidContract = activeKeywordGoal === '搜索卡位' \|\| activeKeywordGoal === '流量金卡';/,
        '编辑态缺少搜索卡位/流量金卡固定出价契约判定'
    );
    assert.match(
        renderBlock,
        /sceneName === '关键词推广' && token === '卡位方式'[\s\S]*return false;/,
        '搜索卡位的卡位方式被误当作营销目标选择器过滤'
    );
    assert.match(
        renderBlock,
        /if \(!isFixedKeywordBidContract\) \{[\s\S]*buildProxySelectRow\('出价方式'/,
        '固定出价目标仍可能展示通用出价方式'
    );
    assert.match(
        renderBlock,
        /activeKeywordGoal === '趋势明星' \? keywordTrendBidTargetAllowedValues/,
        '趋势明星出价目标未过滤为原生目标集合'
    );
    assert.match(
        renderBlock,
        /\['趋势明星', '流量金卡'\]\.includes\(activeKeywordGoalForRender\)[\s\S]*'核心词设置'[\s\S]*'匹配方式'[\s\S]*'卡位方式'[\s\S]*staticFieldTokenSet\.add/,
        '趋势明星/流量金卡未过滤通用核心词、匹配方式和卡位方式'
    );
    assert.match(
        renderBlock,
        /activeKeywordGoalForRender !== '搜索卡位'[\s\S]*'卡位方式'[\s\S]*'选择卡位方案'[\s\S]*staticFieldTokenSet\.add/,
        '非搜索卡位目标未过滤卡位方式'
    );
    assert.match(
        renderBlock,
        /isKeywordScene && !\['趋势明星', '流量金卡'\]\.includes\(detectKeywordGoalFromText\(activeMarketingGoal \|\| ''\)\)[\s\S]*buildManualKeywordDesignerRow\('手动关键词'\)/,
        '趋势明星/流量金卡未隐藏手动关键词面板'
    );

    const gridBlock = getBlock(
        'const getSceneFieldDisplayLabel = (rawFieldLabel = \'\') => {',
        'const proxySelectButtons = wizardState.els.sceneDynamic.querySelectorAll'
    );
    assert.match(
        gridBlock,
        /detectKeywordGoalFromText\(activeMarketingGoal \|\| ''\) === '搜索卡位'[\s\S]*normalizeSceneRenderFieldToken\(normalizedFieldLabel\) === '卡位方式'[\s\S]*'位置不限提升市场渗透'/,
        '搜索卡位卡位方式未强制补齐位置不限提升市场渗透'
    );
});

test('请求预览层不会用通用策略出价目标覆盖固定关键词目标', () => {
    const previewBlock = getBlock(
        'const strategyKeywordContractType = isKeywordScene',
        'const commonKeywordMode = wizardState.draft.keywordMode || DEFAULTS.keywordMode;'
    );

    assert.match(
        previewBlock,
        /strategyKeywordContractType === 'search_detent' \|\| strategyKeywordContractType === 'golden_traffic_card'[\s\S]*delete strategySceneSettings\.出价目标[\s\S]*delete strategySceneSettings\.优化目标/,
        '请求预览层未移除固定目标的通用出价目标设置'
    );
    assert.match(
        previewBlock,
        /strategyKeywordContractType === 'search_detent'[\s\S]*campaignOverride\.bidType = 'max_amount'[\s\S]*campaignOverride\.searchDetentType = mapKeywordSearchDetentTypeValue/,
        '搜索卡位预览组包未写入 max_amount/searchDetentType'
    );
    assert.match(
        previewBlock,
        /strategyKeywordContractType === 'golden_traffic_card'[\s\S]*campaignOverride\.promotionScene = 'promotion_scene_golden_traffic_card_package'[\s\S]*campaignOverride\.itemSelectedMode = 'user_define'[\s\S]*campaignOverride\.bidTargetV2 = 'conv'/,
        '流量金卡预览组包未写入 promotionScene/user_define/conv'
    );
});
