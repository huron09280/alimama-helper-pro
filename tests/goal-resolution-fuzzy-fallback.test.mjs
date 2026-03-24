import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function extractResolveGoalSpecForScene() {
    const start = source.indexOf('const resolveGoalSpecForScene = ({');
    const end = source.indexOf('const buildGoalContractDefaults =', start);
    assert.ok(start > -1 && end > start, '无法定位 resolveGoalSpecForScene 代码块');
    const fnSource = source
        .slice(start, end)
        .trim()
        .replace(/^const resolveGoalSpecForScene = /, '')
        .replace(/;\s*$/, '');
    const normalizeGoalCandidateLabel = (value) => String(value || '').replace(/\s+/g, '').trim();
    const normalizeGoalKey = (value) => String(value || '').replace(/[^\w\u4e00-\u9fa5]/g, '').toLowerCase();
    const SCENE_SPEC_FIELD_FALLBACK = {};
    return Function(
        'normalizeGoalCandidateLabel',
        'normalizeGoalKey',
        'SCENE_SPEC_FIELD_FALLBACK',
        `return (${fnSource});`
    )(normalizeGoalCandidateLabel, normalizeGoalKey, SCENE_SPEC_FIELD_FALLBACK);
}

test('resolveGoalSpecForScene: marketingGoal 模糊匹配会标记 fallback 并输出告警', () => {
    const resolveGoalSpecForScene = extractResolveGoalSpecForScene();
    const result = resolveGoalSpecForScene({
        sceneName: '关键词推广',
        sceneSpec: {
            goals: [
                { goalLabel: '促进成交', isDefault: true },
                { goalLabel: '收藏加购' }
            ]
        },
        marketingGoal: '收藏',
        allowFuzzyMatch: true
    });

    assert.equal(result.resolvedMarketingGoal, '收藏加购');
    assert.equal(result.goalFallbackUsed, true, '模糊命中应视为非精确命中');
    assert.match(
        (result.goalWarnings || []).join('\n'),
        /模糊匹配/,
        '模糊命中应输出显式 warning'
    );
});

test('resolveGoalSpecForScene: 未开启 allowFuzzyMatch 时不走模糊匹配', () => {
    const resolveGoalSpecForScene = extractResolveGoalSpecForScene();
    const result = resolveGoalSpecForScene({
        sceneName: '关键词推广',
        sceneSpec: {
            goals: [
                { goalLabel: '促进成交', isDefault: true },
                { goalLabel: '收藏加购' }
            ]
        },
        marketingGoal: '收藏'
    });

    assert.equal(result.resolvedMarketingGoal, '促进成交');
    assert.equal(result.goalFallbackUsed, true);
    assert.match(
        (result.goalWarnings || []).join('\n'),
        /未命中/,
        '未开启 allowFuzzyMatch 时应走默认回退并提示未命中'
    );
});

test('resolveGoalSpecForScene: allowFuzzyMatch 命中多个候选时回退默认目标', () => {
    const resolveGoalSpecForScene = extractResolveGoalSpecForScene();
    const result = resolveGoalSpecForScene({
        sceneName: '关键词推广',
        sceneSpec: {
            goals: [
                { goalLabel: '促进成交', isDefault: true },
                { goalLabel: '收藏加购' },
                { goalLabel: '收藏点击' }
            ]
        },
        marketingGoal: '收藏',
        allowFuzzyMatch: true
    });

    assert.equal(result.resolvedMarketingGoal, '促进成交');
    assert.equal(result.goalFallbackUsed, true);
    assert.match(
        (result.goalWarnings || []).join('\n'),
        /匹配到多个候选/,
        '多候选 fuzzy 不应直接命中某个目标'
    );
});

test('resolveGoalSpecForScene: marketingGoal 精确匹配不应标记 fallback', () => {
    const resolveGoalSpecForScene = extractResolveGoalSpecForScene();
    const result = resolveGoalSpecForScene({
        sceneName: '关键词推广',
        sceneSpec: {
            goals: [
                { goalLabel: '促进成交', isDefault: true },
                { goalLabel: '收藏加购' }
            ]
        },
        marketingGoal: '收藏加购'
    });

    assert.equal(result.resolvedMarketingGoal, '收藏加购');
    assert.equal(result.goalFallbackUsed, false);
    assert.equal((result.goalWarnings || []).length, 0);
});
