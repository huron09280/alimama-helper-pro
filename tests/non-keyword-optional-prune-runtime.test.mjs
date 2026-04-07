import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function extractApplyNonKeywordOptionalCampaignPrune() {
    const start = source.indexOf('const applyNonKeywordOptionalCampaignPrune = ({');
    const end = source.indexOf('const buildSolutionFromPlan = async ({ plan, request, runtime, requestOptions }) => {', start);
    assert.ok(start > -1 && end > start, '无法定位 applyNonKeywordOptionalCampaignPrune 代码块');
    const fnSource = source
        .slice(start, end)
        .trim()
        .replace(/^const applyNonKeywordOptionalCampaignPrune = /, '')
        .replace(/;\s*$/, '');
    return Function('isPlainObject', 'hasOwn', `return (${fnSource});`)(isPlainObject, hasOwn);
}

test('applyNonKeywordOptionalCampaignPrune 会删除模板缺失且非显式字段', () => {
    const fn = extractApplyNonKeywordOptionalCampaignPrune();
    const campaign = {
        bidTypeV2: 'smart_bid',
        adzoneList: ['1'],
        launchAreaStrList: ['all'],
        creativeSetMode: 'minimalist'
    };
    const out = fn({
        campaign,
        templateCampaign: {},
        hasItem: false,
        sceneCapabilities: { sceneName: '店铺直达', hasItemIdList: false },
        hasExplicitCampaignField: () => false
    });

    assert.equal(out.bidTypeV2, undefined);
    assert.equal(out.adzoneList, undefined);
    assert.equal(out.creativeSetMode, undefined);
    assert.equal(out.launchAreaStrList, undefined);
});

test('applyNonKeywordOptionalCampaignPrune 会保留显式字段', () => {
    const fn = extractApplyNonKeywordOptionalCampaignPrune();
    const campaign = {
        adzoneList: ['1'],
        crowdList: ['c1']
    };
    const out = fn({
        campaign,
        templateCampaign: {},
        hasItem: false,
        sceneCapabilities: { sceneName: '店铺直达', hasItemIdList: false },
        hasExplicitCampaignField: (key) => key === 'adzoneList'
    });

    assert.deepEqual(out.adzoneList, ['1']);
    assert.equal(out.crowdList, undefined);
});

test('applyNonKeywordOptionalCampaignPrune 在有商品且场景支持 itemIdList 时保留 itemIdList', () => {
    const fn = extractApplyNonKeywordOptionalCampaignPrune();
    const campaign = {
        itemIdList: ['1001']
    };
    const out = fn({
        campaign,
        templateCampaign: {},
        hasItem: true,
        sceneCapabilities: { sceneName: '货品全站推广', hasItemIdList: true },
        hasExplicitCampaignField: () => false
    });

    assert.deepEqual(out.itemIdList, ['1001']);
});

