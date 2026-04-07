import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getCreatePlansBatchBlock() {
    const start = source.indexOf('const createPlansBatch = async (request = {}, options = {}) => {');
    const end = source.indexOf('const appendKeywords = async (request = {}, options = {}) => {', start);
    assert.ok(start > -1 && end > start, '无法定位 createPlansBatch 代码块');
    return source.slice(start, end);
}

function getReturnSnippetByAnchor(block, anchor) {
    const anchorIndex = block.indexOf(anchor);
    assert.ok(anchorIndex > -1, `无法定位 ${anchor} 对应代码`);
    const returnStart = block.lastIndexOf('return {', anchorIndex);
    const returnEnd = block.indexOf('\n                };', anchorIndex);
    assert.ok(returnStart > -1 && returnEnd > returnStart, `无法截取 ${anchor} 对应 return 片段`);
    return block.slice(returnStart, returnEnd + '\n                };'.length);
}

function assertEarlyReturnIncludesCommonFields(snippet, message) {
    assert.match(
        snippet,
        /validation,[\s\S]*?runtime:\s*\{[\s\S]*?bizCode:[\s\S]*?promotionScene:[\s\S]*?itemSelectedMode:[\s\S]*?bidTypeV2:[\s\S]*?bidTargetV2:[\s\S]*?dmcType:[\s\S]*?\},[\s\S]*?marketingGoal:\s*[^,]+,[\s\S]*?goalFallbackUsed:\s*[^,]+,[\s\S]*?goalWarnings:[\s\S]*?submitEndpoint:[\s\S]*?fallbackPolicy,[\s\S]*?conflictPolicy,[\s\S]*?stopScope,[\s\S]*?strictGoalMatch,[\s\S]*?allowFuzzyGoalMatch,[\s\S]*?successCount:\s*0,[\s\S]*?failCount:\s*[^,]+,[\s\S]*?successes:\s*\[\],[\s\S]*?failures:[\s\S]*?rawResponses:\s*\[\]/,
        message
    );
}

test('createPlansBatch 支持 strictGoalMatch 开关并默认开启（可显式关闭）', () => {
    const block = getCreatePlansBatchBlock();
    assert.match(
        block,
        /const strictGoalMatch = options\.strictGoalMatch !== false[\s\S]*?&& mergedRequest\.strictGoalMatch !== false;/,
        'strictGoalMatch 开关未接入'
    );
    assert.match(
        block,
        /mergedRequest\.strictGoalMatch = strictGoalMatch;/,
        'strictGoalMatch 归一化结果未回写到请求'
    );
    assert.match(
        block,
        /const allowFuzzyGoalMatch = options\.allowFuzzyGoalMatch === true[\s\S]*?\|\| mergedRequest\.allowFuzzyGoalMatch === true;/,
        'allowFuzzyGoalMatch 开关未接入'
    );
});

test('strictGoalMatch 开启时，plan 级目标 fallback 会聚合失败并提前返回', () => {
    const block = getCreatePlansBatchBlock();
    assert.match(
        block,
        /if \(strictGoalMatch && requestGoalContext\.goalFallbackUsed\) \{[\s\S]*?return buildStrictRequestGoalFailureResult\(\{/,
        'strictGoalMatch 未在 request 级 fallback 时提前失败'
    );
    assert.match(
        block,
        /if \(strictGoalMatch && goalContext\.goalFallbackUsed\) \{[\s\S]*?strictGoalFailures\.push\(\{/,
        'strictGoalMatch 未聚合 plan 级 fallback 失败'
    );
    assert.match(
        block,
        /if \(strictGoalMatch && strictGoalFailures\.length\) \{[\s\S]*?const strictFailures = normalizedPlanDropFailures\.concat\(strictGoalFailures\);[\s\S]*?failCount:\s*strictFailures\.length,[\s\S]*?failures:\s*strictFailures/,
        'strictGoalMatch 命中 fallback 后未提前返回失败'
    );
    assert.match(
        block,
        /if \(strictGoalMatch && strictGoalFailures\.length\) \{[\s\S]*?strictGoalMatch:\s*true,[\s\S]*?allowFuzzyGoalMatch,[\s\S]*?goalWarnings:/,
        'strictGoalMatch 提前返回缺少 allowFuzzyGoalMatch 标记'
    );
    assert.match(
        block,
        /if \(strictGoalMatch && strictGoalFailures\.length\) \{[\s\S]*?return \{[\s\S]*?strictGoalMatch:\s*true,[\s\S]*?allowFuzzyGoalMatch,[\s\S]*?goalWarnings:\s*mergedGoalWarnings,[\s\S]*?successCount:\s*0,/,
        'strictGoalFailures 早退结果缺少 allowFuzzyGoalMatch/successCount 标记'
    );
    assert.match(
        block,
        /if \(strictGoalMatch && strictGoalFailures\.length\) \{[\s\S]*?runtime:\s*\{[\s\S]*?marketingGoal:[\s\S]*?submitEndpoint:[\s\S]*?fallbackPolicy,[\s\S]*?conflictPolicy,[\s\S]*?stopScope,[\s\S]*?rawResponses:\s*\[\]/,
        'strictGoalFailures 早退结果未补齐关键上下文字段'
    );
});

test('scene runtime / 无可提交计划早退结果补齐共享上下文字段', () => {
    const block = getCreatePlansBatchBlock();
    const sceneRuntimeAbortReturn = getReturnSnippetByAnchor(block, '场景运行时同步失败：当前');
    const noSubmittablePlanReturn = getReturnSnippetByAnchor(block, '未生成可提交计划，请检查 plans 或 planCount 参数');

    assertEarlyReturnIncludesCommonFields(
        sceneRuntimeAbortReturn,
        'scene runtime 严格早退结果未补齐共享上下文字段'
    );
    assert.match(
        sceneRuntimeAbortReturn,
        /failures:\s*\[\{[\s\S]*?场景运行时同步失败：当前/,
        'scene runtime 严格早退错误信息缺失'
    );

    assertEarlyReturnIncludesCommonFields(
        noSubmittablePlanReturn,
        '无可提交计划早退结果未补齐共享上下文字段'
    );
    assert.match(
        noSubmittablePlanReturn,
        /sceneCapabilities\.requiresItem[\s\S]*?'未生成可提交计划，请检查 plans 或 planCount 参数'/,
        '无可提交计划早退错误文案分支缺失'
    );
});
