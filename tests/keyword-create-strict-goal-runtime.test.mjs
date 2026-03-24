import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

const CREATE_PLANS_BATCH_DEP_KEYS = [
    'validate',
    'isSceneLikelyRequireItem',
    'mergeDeep',
    'normalizeFallbackPolicy',
    'REPAIR_DEFAULTS',
    'isPlainObject',
    'normalizeSceneSettingEntries',
    'findSceneSettingEntry',
    'normalizeGoalLabel',
    'normalizeBidMode',
    'DEFAULTS',
    'normalizeSceneBizCode',
    'resolveSceneBizCodeHint',
    'getRuntimeDefaults',
    'isRuntimeBizCodeMatched',
    'normalizeGoalCreateEndpoint',
    'SCENE_CREATE_ENDPOINT_FALLBACK',
    'resolveGoalContextForPlan',
    'buildStrictRequestGoalFailureResult',
    'SCENE_BIDTYPE_V2_ONLY',
    'mergeRuntimeWithGoalPatch',
    'resolveSceneDefaultPromotionScene',
    'resolveSceneSettingOverrides',
    'SCENE_BIDTYPE_V2_DEFAULT',
    'resolveSceneCapabilities',
    'emitProgress',
    'resolvePreferredItems',
    'normalizePlans',
    'buildDroppedPlanFailure',
    'buildStrictGoalFailureError',
    'mergeGoalWarnings'
];

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

function normalizeGoalLabel(value) {
    return String(value || '').trim();
}

function extractCreatePlansBatch() {
    const start = source.indexOf('const createPlansBatch = async (request = {}, options = {}) => {');
    const end = source.indexOf('const appendKeywords = async (request = {}, options = {}) => {', start);
    assert.ok(start > -1 && end > start, '无法定位 createPlansBatch 代码块');
    const fnSource = source
        .slice(start, end)
        .trim()
        .replace(/^const createPlansBatch = /, '')
        .replace(/;\s*$/, '');
    return fnSource;
}

function createRuntimeDeps(overrides = {}) {
    const deps = {
        validate: () => ({ ok: true }),
        isSceneLikelyRequireItem: () => false,
        mergeDeep,
        normalizeFallbackPolicy: (value, fallback = 'confirm') => {
            const normalized = String(value || '').trim();
            return normalized || fallback;
        },
        REPAIR_DEFAULTS: { stopScope: 'same_item_only' },
        isPlainObject,
        normalizeSceneSettingEntries: () => [],
        findSceneSettingEntry: () => null,
        normalizeGoalLabel,
        normalizeBidMode: (value, fallback = 'smart') => String(value || '').trim() || fallback,
        DEFAULTS: {
            bizCode: '1101',
            promotionScene: '',
            itemSelectedMode: 'manual',
            bidTypeV2: 'smart_bid',
            bidTargetV2: 'roi',
            dmcType: 'day_average'
        },
        normalizeSceneBizCode: (value) => String(value || '').trim(),
        resolveSceneBizCodeHint: () => '',
        getRuntimeDefaults: async () => ({
            bizCode: '1101',
            promotionScene: '',
            itemSelectedMode: 'manual',
            bidTypeV2: '',
            bidTargetV2: '',
            dmcType: 'day_average'
        }),
        isRuntimeBizCodeMatched: () => true,
        normalizeGoalCreateEndpoint: (value) => String(value || '').trim(),
        SCENE_CREATE_ENDPOINT_FALLBACK: '/unit/fallback',
        resolveGoalContextForPlan: ({ marketingGoal = '', planIndex = -1 }) => {
            const requestedGoal = normalizeGoalLabel(marketingGoal) || '收藏加购';
            if (planIndex < 0) {
                return {
                    resolvedMarketingGoal: requestedGoal,
                    goalFallbackUsed: false,
                    goalWarnings: [],
                    availableGoalLabels: ['收藏加购'],
                    endpoint: '/unit/request-create',
                    campaignOverride: {},
                    adgroupOverride: {},
                    goalSpec: null
                };
            }
            return {
                resolvedMarketingGoal: '促进成交',
                goalFallbackUsed: true,
                goalWarnings: ['计划级目标发生 fallback'],
                availableGoalLabels: ['促进成交'],
                endpoint: '/unit/plan-create',
                campaignOverride: {},
                adgroupOverride: {},
                goalSpec: null
            };
        },
        buildStrictRequestGoalFailureResult: () => {
            throw new Error('unexpected request-level strict failure');
        },
        SCENE_BIDTYPE_V2_ONLY: new Set(),
        mergeRuntimeWithGoalPatch: (runtime, patch) => mergeDeep({}, runtime, patch),
        resolveSceneDefaultPromotionScene: () => '',
        resolveSceneSettingOverrides: () => ({
            campaignOverride: {},
            adgroupOverride: {}
        }),
        SCENE_BIDTYPE_V2_DEFAULT: {},
        resolveSceneCapabilities: ({ sceneName = '' } = {}) => ({
            sceneName: sceneName || '全站推广',
            requiresItem: false,
            hasItemIdList: false
        }),
        emitProgress: () => {},
        resolvePreferredItems: async () => [],
        normalizePlans: (request) => (
            Array.isArray(request?.plans)
                ? request.plans.map((plan) => (isPlainObject(plan) ? { ...plan } : {}))
                : []
        ),
        buildDroppedPlanFailure: (droppedPlan) => ({ ...droppedPlan }),
        buildStrictGoalFailureError: (requested, resolved) => (
            `STRICT_GOAL_MISMATCH: requested=${requested}, resolved=${resolved}`
        ),
        mergeGoalWarnings: (...warningGroups) => {
            const merged = [];
            warningGroups.flat().forEach((warning) => {
                const text = String(warning || '').trim();
                if (!text || merged.includes(text)) return;
                merged.push(text);
            });
            return merged;
        }
    };
    return { ...deps, ...overrides };
}

function createPlansBatchFromSource(overrides = {}) {
    const fnSource = extractCreatePlansBatch();
    const deps = createRuntimeDeps(overrides);
    const depValues = CREATE_PLANS_BATCH_DEP_KEYS.map((key) => {
        assert.ok(key in deps, `缺少依赖 stub: ${key}`);
        return deps[key];
    });
    return Function(...CREATE_PLANS_BATCH_DEP_KEYS, `return (${fnSource});`)(...depValues);
}

async function runStrictGoalPlanFallbackCase({
    requestAllowFuzzyGoalMatch,
    optionsAllowFuzzyGoalMatch
} = {}) {
    const createPlansBatch = createPlansBatchFromSource();
    const request = {
        sceneName: '全站推广',
        marketingGoal: '收藏加购',
        plans: [
            {
                planName: '计划A',
                marketingGoal: '收藏加购',
                itemId: '1001'
            }
        ]
    };
    if (requestAllowFuzzyGoalMatch !== undefined) {
        request.allowFuzzyGoalMatch = requestAllowFuzzyGoalMatch;
    }
    const options = {};
    if (optionsAllowFuzzyGoalMatch !== undefined) {
        options.allowFuzzyGoalMatch = optionsAllowFuzzyGoalMatch;
    }
    return createPlansBatch(request, options);
}

test('createPlansBatch runtime: strictGoalMatch plan级早退返回 allowFuzzyGoalMatch 与归一化输入一致', async () => {
    const cases = [
        {
            name: '默认输入（request/options 都未开启）',
            requestAllowFuzzyGoalMatch: undefined,
            optionsAllowFuzzyGoalMatch: undefined,
            expectedAllowFuzzyGoalMatch: false
        },
        {
            name: 'request 显式开启 allowFuzzyGoalMatch',
            requestAllowFuzzyGoalMatch: true,
            optionsAllowFuzzyGoalMatch: undefined,
            expectedAllowFuzzyGoalMatch: true
        },
        {
            name: 'options 显式开启 allowFuzzyGoalMatch',
            requestAllowFuzzyGoalMatch: false,
            optionsAllowFuzzyGoalMatch: true,
            expectedAllowFuzzyGoalMatch: true
        },
        {
            name: 'request/options 都显式关闭 allowFuzzyGoalMatch',
            requestAllowFuzzyGoalMatch: false,
            optionsAllowFuzzyGoalMatch: false,
            expectedAllowFuzzyGoalMatch: false
        }
    ];

    for (const entry of cases) {
        const result = await runStrictGoalPlanFallbackCase({
            requestAllowFuzzyGoalMatch: entry.requestAllowFuzzyGoalMatch,
            optionsAllowFuzzyGoalMatch: entry.optionsAllowFuzzyGoalMatch
        });
        assert.equal(result.ok, false, `${entry.name}：应走 strict early return`);
        assert.equal(result.strictGoalMatch, true, `${entry.name}：strictGoalMatch 应保持开启`);
        assert.equal(result.successCount, 0, `${entry.name}：successCount 应为 0`);
        assert.equal(result.failCount, 1, `${entry.name}：failCount 应为 1`);
        assert.equal(
            result.allowFuzzyGoalMatch,
            entry.expectedAllowFuzzyGoalMatch,
            `${entry.name}：allowFuzzyGoalMatch 应与归一化输入一致`
        );
        assert.match(
            String(result.failures?.[0]?.error || ''),
            /STRICT_GOAL_MISMATCH/,
            `${entry.name}：应为 plan 级 strict fallback 失败`
        );
    }
});

test('createPlansBatch runtime: 多计划 strict fallback 失败明细保持计划隔离', async () => {
    const createPlansBatch = createPlansBatchFromSource({
        resolveGoalContextForPlan: ({ marketingGoal = '', planIndex = -1 }) => {
            const requestedGoal = normalizeGoalLabel(marketingGoal) || '收藏加购';
            if (planIndex < 0) {
                return {
                    resolvedMarketingGoal: requestedGoal,
                    goalFallbackUsed: false,
                    goalWarnings: [],
                    availableGoalLabels: ['收藏加购'],
                    endpoint: '/unit/request-create',
                    campaignOverride: {},
                    adgroupOverride: {},
                    goalSpec: null
                };
            }
            return {
                resolvedMarketingGoal: planIndex === 0 ? '促进成交' : '收藏加购',
                goalFallbackUsed: true,
                goalWarnings: [`计划${planIndex + 1}目标 fallback`],
                availableGoalLabels: ['促进成交', '收藏加购'],
                endpoint: `/unit/plan-create-${planIndex + 1}`,
                campaignOverride: {},
                adgroupOverride: {},
                goalSpec: null
            };
        }
    });

    const result = await createPlansBatch({
        sceneName: '全站推广',
        marketingGoal: '收藏加购',
        plans: [
            { planName: '计划A', marketingGoal: '请求目标A', itemId: '1001' },
            { planName: '计划B', marketingGoal: '请求目标B', itemId: '1002' }
        ]
    }, {});

    assert.equal(result.ok, false);
    assert.equal(result.strictGoalMatch, true);
    assert.equal(result.successCount, 0);
    assert.equal(result.failCount, 2);
    assert.deepEqual(
        result.failures.map((failure) => ({
            planName: failure.planName,
            marketingGoal: failure.marketingGoal
        })),
        [
            { planName: '计划A', marketingGoal: '请求目标A' },
            { planName: '计划B', marketingGoal: '请求目标B' }
        ],
        '多计划 strict fallback 的失败明细不应串计划字段'
    );
    assert.deepEqual(
        result.failures.map((failure) => failure.submitEndpoint),
        ['/unit/plan-create-1', '/unit/plan-create-2'],
        '多计划 strict fallback 的失败明细不应串计划 submitEndpoint'
    );
    assert.match(String(result.failures[0]?.error || ''), /STRICT_GOAL_MISMATCH/);
    assert.match(String(result.failures[1]?.error || ''), /STRICT_GOAL_MISMATCH/);
});

test('createPlansBatch runtime: 最小依赖清单可独立构建 createPlansBatch harness', () => {
    assert.equal(CREATE_PLANS_BATCH_DEP_KEYS.length, 31);
    const uniqueKeys = new Set(CREATE_PLANS_BATCH_DEP_KEYS);
    assert.equal(uniqueKeys.size, CREATE_PLANS_BATCH_DEP_KEYS.length, '依赖清单不应包含重复键');
    const createPlansBatch = createPlansBatchFromSource();
    assert.equal(typeof createPlansBatch, 'function');
});
