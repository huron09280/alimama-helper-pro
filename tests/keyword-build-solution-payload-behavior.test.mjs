import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(target = {}, sourceObj = {}) {
    const out = isPlainObject(target) ? { ...target } : {};
    if (!isPlainObject(sourceObj)) return out;
    Object.keys(sourceObj).forEach((key) => {
        const nextValue = sourceObj[key];
        if (isPlainObject(nextValue) && isPlainObject(out[key])) {
            out[key] = deepMerge(out[key], nextValue);
            return;
        }
        if (isPlainObject(nextValue)) {
            out[key] = deepMerge({}, nextValue);
            return;
        }
        if (Array.isArray(nextValue)) {
            out[key] = nextValue.map((item) => (isPlainObject(item) ? deepMerge({}, item) : item));
            return;
        }
        out[key] = nextValue;
    });
    return out;
}

function mergeDeep(...objects) {
    return objects.reduce((acc, current) => deepMerge(acc, current), {});
}

function extractApplyOverrides() {
    const start = source.indexOf('const applyOverrides = (target, request, plan) => {');
    const end = source.indexOf('const buildDefaultLaunchPeriodList = () => {', start);
    assert.ok(start > -1 && end > start, '无法定位 applyOverrides 代码块');
    const fnSource = source
        .slice(start, end)
        .trim()
        .replace(/^const applyOverrides = /, '')
        .replace(/;\s*$/, '');
    return Function('mergeDeep', 'isPlainObject', `return (${fnSource});`)(mergeDeep, isPlainObject);
}

function extractResolveLeadTemplateTriplet() {
    const start = source.indexOf('const resolveLeadTemplateTriplet = ({ campaign = {}, runtimeStoreData = {} } = {}) => {');
    const end = source.indexOf('const applyNonKeywordOptionalCampaignPrune = ({', start);
    assert.ok(start > -1 && end > start, '无法定位 resolveLeadTemplateTriplet 代码块');
    const fnSource = source
        .slice(start, end)
        .trim()
        .replace(/^const resolveLeadTemplateTriplet = /, '')
        .replace(/;\s*$/, '');
    const toIdValue = (value) => value === undefined || value === null ? '' : String(value).trim();
    return Function('toIdValue', 'isPlainObject', `return (${fnSource});`)(toIdValue, isPlainObject);
}

function extractStripKeywordTrafficArtifacts() {
    const start = source.indexOf('const KEYWORD_TRAFFIC_PACKAGE_FIELD_RE = /(golden|detent|trend|traffic|kr|card|flow|package|词包|卡位|趋势|流量金卡)/i;');
    const end = source.indexOf('const KEYWORD_CUSTOM_CAMPAIGN_ALLOW_KEYS = new Set([', start);
    assert.ok(start > -1 && end > start, '无法定位 stripKeywordTrafficArtifacts 代码块');
    const block = source.slice(start, end);
    return Function('isPlainObject', `${block}; return stripKeywordTrafficArtifacts;`)(isPlainObject);
}

test('applyOverrides: plan.campaignOverride 优先于 common.passthrough', () => {
    const applyOverrides = extractApplyOverrides();
    const target = {
        campaign: { optimizeTarget: 'base_target' },
        adgroup: {}
    };
    const request = {
        common: {
            passthrough: {
                optimizeTarget: 'from_common_passthrough'
            }
        }
    };
    const plan = {
        campaignOverride: {
            optimizeTarget: 'from_plan_override'
        }
    };

    applyOverrides(target, request, plan);
    assert.equal(target.campaign.optimizeTarget, 'from_plan_override');
});

test('resolveLeadTemplateTriplet: campaign 不完整但 orderInfo 完整时选择 orderInfo', () => {
    const resolveLeadTemplateTriplet = extractResolveLeadTemplateTriplet();
    const resolved = resolveLeadTemplateTriplet({
        campaign: {
            planId: '1001',
            orderInfo: {
                planId: '2001',
                planTemplateId: '2002',
                packageTemplateId: '2003'
            }
        },
        runtimeStoreData: {
            planId: '3001',
            planTemplateId: '3002',
            packageTemplateId: '3003'
        }
    });

    assert.equal(resolved.source, 'orderInfo');
    assert.equal(resolved.planId, '2001');
    assert.equal(resolved.planTemplateId, '2002');
    assert.equal(resolved.packageTemplateId, '2003');
    assert.deepEqual(resolved.missingFields, []);
});

test('resolveLeadTemplateTriplet: campaign 完整时优先使用 campaign', () => {
    const resolveLeadTemplateTriplet = extractResolveLeadTemplateTriplet();
    const resolved = resolveLeadTemplateTriplet({
        campaign: {
            planId: '1101',
            planTemplateId: '1102',
            packageTemplateId: '1103',
            orderInfo: {
                planId: '2101',
                planTemplateId: '2102',
                packageTemplateId: '2103'
            }
        },
        runtimeStoreData: {
            planId: '3101',
            planTemplateId: '3102',
            packageTemplateId: '3103'
        }
    });

    assert.equal(resolved.source, 'campaign');
    assert.equal(resolved.planId, '1101');
    assert.equal(resolved.planTemplateId, '1102');
    assert.equal(resolved.packageTemplateId, '1103');
    assert.deepEqual(resolved.missingFields, []);
});

test('resolveLeadTemplateTriplet: 存在显式模板字段但来源不完整时不与 runtime 混拼', () => {
    const resolveLeadTemplateTriplet = extractResolveLeadTemplateTriplet();
    const resolved = resolveLeadTemplateTriplet({
        campaign: {
            planId: '9101'
        },
        runtimeStoreData: {
            planId: '9201',
            planTemplateId: '9202',
            packageTemplateId: '9203'
        }
    });

    assert.equal(resolved.source, 'campaign');
    assert.equal(resolved.planId, '9101');
    assert.equal(resolved.planTemplateId, '');
    assert.equal(resolved.packageTemplateId, '');
    assert.deepEqual(resolved.missingFields, ['planTemplateId', 'packageTemplateId']);
});

test('resolveLeadTemplateTriplet: 非数字模板 ID 会被清洗为空并进入缺失项', () => {
    const resolveLeadTemplateTriplet = extractResolveLeadTemplateTriplet();
    const resolved = resolveLeadTemplateTriplet({
        campaign: {
            planId: 'abc',
            planTemplateId: '9102',
            packageTemplateId: 'x-1'
        },
        runtimeStoreData: {
            planId: '9201',
            planTemplateId: '9202',
            packageTemplateId: '9203'
        }
    });

    assert.equal(resolved.source, 'campaign');
    assert.equal(resolved.planId, '');
    assert.equal(resolved.planTemplateId, '9102');
    assert.equal(resolved.packageTemplateId, '');
    assert.deepEqual(resolved.missingFields, ['planId', 'packageTemplateId']);
});

test('stripKeywordTrafficArtifacts: 关键词场景会裁剪词包/卡位/流量等噪音字段', () => {
    const stripKeywordTrafficArtifacts = extractStripKeywordTrafficArtifacts();
    const output = stripKeywordTrafficArtifacts({
        promotionScene: 'promotion_scene_search_custom',
        subPromotionType: 'search',
        campaignName: '测试计划',
        flowPackageId: 'abc',
        nested: {
            trendScore: 3,
            keepField: 1
        },
        list: [
            { trafficHint: 'x', keepField: 'ok' },
            { cardTag: 'drop', promotionType: '1101' }
        ]
    });

    assert.equal(output.promotionScene, 'promotion_scene_search_custom');
    assert.equal(output.subPromotionType, 'search');
    assert.equal(output.campaignName, '测试计划');
    assert.equal(output.flowPackageId, undefined);
    assert.deepEqual(output.nested, { keepField: 1 });
    assert.deepEqual(output.list, [{ keepField: 'ok' }, { promotionType: '1101' }]);
});

test('buildSolutionFromPlan: 非关键词场景模板裁剪与 itemIdList 二次重写分支存在', () => {
    assert.match(
        source,
        /if \(hasItem && sceneCapabilities\.hasItemIdList\) \{[\s\S]*?merged\.campaign\.itemIdList = \[toIdValue\(item\.materialId \|\| item\.itemId\)\];[\s\S]*?\} else if \(!sceneCapabilities\.hasItemIdList && hasOwn\(merged\.campaign, 'itemIdList'\)\) \{[\s\S]*?\}/,
        '缺少 itemIdList 二次重写/删除分支'
    );
    assert.match(
        source,
        /if \(hasRuntimeTemplateCampaign\) \{[\s\S]*?merged\.campaign = applyNonKeywordOptionalCampaignPrune\(\{[\s\S]*?hasExplicitCampaignField[\s\S]*?\}\);/,
        '缺少非关键词模板 optional keys 裁剪分支'
    );
});
