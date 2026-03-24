import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function extractMergeGoalWarnings() {
    const start = source.indexOf('const mergeGoalWarnings = (requestWarnings = [], planWarnings = [], limit = 50) => {');
    const end = source.indexOf('const buildStrictGoalFailureError =', start);
    assert.ok(start > -1 && end > start, '无法定位 mergeGoalWarnings 代码块');
    const fnSource = source
        .slice(start, end)
        .trim()
        .replace(/^const mergeGoalWarnings = /, '')
        .replace(/;\s*$/, '');
    const uniqueBy = (list = [], iteratee = (item) => item) => {
        const out = [];
        const seen = new Set();
        list.forEach((item) => {
            const key = iteratee(item);
            if (seen.has(key)) return;
            seen.add(key);
            out.push(item);
        });
        return out;
    };
    const toNumber = (value, fallback) => {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    };
    return Function('uniqueBy', 'toNumber', `return (${fnSource});`)(uniqueBy, toNumber);
}

function getCreatePlansBatchBlock() {
    const start = source.indexOf('const createPlansBatch = async (request = {}, options = {}) => {');
    const end = source.indexOf('const appendKeywords = async (request = {}, options = {}) => {', start);
    assert.ok(start > -1 && end > start, '无法定位 createPlansBatch 代码块');
    return source.slice(start, end);
}

test('mergeGoalWarnings 合并请求级与计划级警告并去重截断', () => {
    const mergeGoalWarnings = extractMergeGoalWarnings();
    const warnings = mergeGoalWarnings(
        [' 请求级告警 ', '重复告警', '', '请求级告警'],
        ['计划级告警', '重复告警', '额外告警'],
        3
    );

    assert.deepEqual(warnings, ['请求级告警', '重复告警', '计划级告警']);
});

test('createPlansBatch 最终结果返回合并后的 goalWarnings', () => {
    const block = getCreatePlansBatchBlock();
    assert.match(
        block,
        /const mergedGoalWarnings = mergeGoalWarnings\(\s*mergedRequest\?\.__goalResolution\?\.goalWarnings,\s*planGoalWarnings,\s*50\s*\);/,
        'createPlansBatch 未汇总请求级与计划级 goalWarnings'
    );
    assert.match(
        block,
        /goalWarnings:\s*mergedGoalWarnings,/,
        'createPlansBatch 最终结果未返回 mergedGoalWarnings'
    );
});
