import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function extractFunctionByName(name, endPattern) {
    const start = source.indexOf(`const ${name} = `);
    const end = source.indexOf(endPattern, start);
    assert.ok(start > -1 && end > start, `无法定位 ${name} 代码块`);
    return source
        .slice(start, end)
        .trim()
        .replace(new RegExp(`^const ${name} = `), '')
        .replace(/;\s*$/, '');
}

function extractBuildStrictGoalFailureError() {
    const fnSource = extractFunctionByName('buildStrictGoalFailureError', 'const buildStrictRequestGoalFailureResult =');
    const normalizeGoalLabel = (value) => String(value || '').trim();
    return Function('normalizeGoalLabel', `return (${fnSource});`)(normalizeGoalLabel);
}

function extractBuildStrictRequestGoalFailureResult() {
    const fnSource = extractFunctionByName('buildStrictRequestGoalFailureResult', 'const buildDroppedPlanFailure =');
    const normalizeGoalLabel = (value) => String(value || '').trim();
    const normalizeGoalCreateEndpoint = (value) => String(value || '').trim();
    const SCENE_CREATE_ENDPOINT_FALLBACK = 'https://unit.test/fallback';
    const buildStrictGoalFailureError = extractBuildStrictGoalFailureError();
    return Function(
        'normalizeGoalLabel',
        'normalizeGoalCreateEndpoint',
        'SCENE_CREATE_ENDPOINT_FALLBACK',
        'buildStrictGoalFailureError',
        `return (${fnSource});`
    )(
        normalizeGoalLabel,
        normalizeGoalCreateEndpoint,
        SCENE_CREATE_ENDPOINT_FALLBACK,
        buildStrictGoalFailureError
    );
}

function extractBuildDroppedPlanFailure() {
    const fnSource = extractFunctionByName('buildDroppedPlanFailure', 'const validate =');
    const deepClone = (value) => value === undefined ? value : JSON.parse(JSON.stringify(value));
    const normalizeGoalLabel = (value) => String(value || '').trim();
    const normalizeGoalCreateEndpoint = (value) => String(value || '').trim();
    const SCENE_CREATE_ENDPOINT_FALLBACK = 'https://unit.test/fallback';
    return Function(
        'isPlainObject',
        'deepClone',
        'normalizeGoalLabel',
        'normalizeGoalCreateEndpoint',
        'SCENE_CREATE_ENDPOINT_FALLBACK',
        `return (${fnSource});`
    )(
        isPlainObject,
        deepClone,
        normalizeGoalLabel,
        normalizeGoalCreateEndpoint,
        SCENE_CREATE_ENDPOINT_FALLBACK
    );
}

test('buildStrictRequestGoalFailureResult 在 request 级 fallback 时返回统一失败结构', () => {
    const buildStrictRequestGoalFailureResult = extractBuildStrictRequestGoalFailureResult();
    const result = buildStrictRequestGoalFailureResult({
        validation: { ok: true },
        runtime: {
            bizCode: '1101',
            promotionScene: 'sceneA',
            itemSelectedMode: 'manual',
            bidTypeV2: 'smart_bid',
            bidTargetV2: 'roi',
            dmcType: 'day_average'
        },
        mergedRequest: {
            marketingGoal: '收藏',
            submitEndpoint: '/api/submit'
        },
        requestGoalContext: {
            resolvedMarketingGoal: '促进成交',
            goalWarnings: ['fallback used'],
            availableGoalLabels: ['促进成交', '收藏加购'],
            endpoint: '/api/by-goal'
        },
        fallbackPolicy: 'confirm',
        conflictPolicy: 'none',
        stopScope: 'same_item_only',
        allowFuzzyGoalMatch: false
    });

    assert.equal(result.ok, false);
    assert.equal(result.strictGoalMatch, true);
    assert.equal(result.allowFuzzyGoalMatch, false);
    assert.equal(result.failCount, 1);
    assert.equal(result.failures.length, 1);
    assert.match(result.failures[0].error, /营销目标严格匹配失败/);
    assert.equal(result.submitEndpoint, '/api/submit');
});

test('buildDroppedPlanFailure 会从 droppedPlan/mergedRequest 组装失败明细', () => {
    const buildDroppedPlanFailure = extractBuildDroppedPlanFailure();
    const failure = buildDroppedPlanFailure(
        {
            planName: '计划A',
            item: { materialId: '1001', materialName: '商品A' },
            marketingGoal: '收藏加购',
            submitEndpoint: '/api/plan-submit',
            error: '缺少商品参数'
        },
        {
            marketingGoal: '促进成交',
            submitEndpoint: '/api/request-submit'
        }
    );

    assert.equal(failure.planName, '计划A');
    assert.equal(failure.item.materialId, '1001');
    assert.equal(failure.marketingGoal, '收藏加购');
    assert.equal(failure.submitEndpoint, '/api/plan-submit');
    assert.equal(failure.error, '缺少商品参数');
});

