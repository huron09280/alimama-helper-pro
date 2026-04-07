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

test('scene runtime 相关早退返回补齐 common result 字段', () => {
    const block = getCreatePlansBatchBlock();

    assert.match(
        block,
        /if \(sceneRuntimeMismatch && strictSceneRuntimeMatch\) \{[\s\S]*?return \{(?=[\s\S]*?runtime:\s*\{)(?=[\s\S]*?submitEndpoint:)(?=[\s\S]*?fallbackPolicy)(?=[\s\S]*?conflictPolicy)(?=[\s\S]*?stopScope)(?=[\s\S]*?strictGoalMatch)(?=[\s\S]*?allowFuzzyGoalMatch)(?=[\s\S]*?rawResponses:\s*\[\])[\s\S]*?\};/,
        'scene runtime mismatch 严格模式早退缺少 common 字段'
    );
    assert.match(
        block,
        /if \(sceneRuntimeMismatch && strictSceneRuntimeMatch\) \{[\s\S]*?failures:\s*\[\{[\s\S]*?planName:\s*''[\s\S]*?item:\s*null[\s\S]*?marketingGoal:[\s\S]*?submitEndpoint:[\s\S]*?error:\s*`场景运行时同步失败：当前/,
        'scene runtime mismatch 严格模式早退 failure 条目结构不完整'
    );

    assert.match(
        block,
        /if \(requireTemplateForScene && !isRuntimeTemplateReadyForScene\(runtime\)\) \{[\s\S]*?return \{(?=[\s\S]*?runtime:\s*\{)(?=[\s\S]*?submitEndpoint:)(?=[\s\S]*?fallbackPolicy)(?=[\s\S]*?conflictPolicy)(?=[\s\S]*?stopScope)(?=[\s\S]*?strictGoalMatch)(?=[\s\S]*?allowFuzzyGoalMatch)(?=[\s\S]*?rawResponses:\s*\[\])[\s\S]*?\};/,
        'scene runtime template 未就绪早退缺少 common 字段'
    );
    assert.match(
        block,
        /if \(requireTemplateForScene && !isRuntimeTemplateReadyForScene\(runtime\)\) \{[\s\S]*?failures:\s*\[\{[\s\S]*?planName:\s*''[\s\S]*?item:\s*null[\s\S]*?marketingGoal:[\s\S]*?submitEndpoint:[\s\S]*?error:\s*`场景运行时模板未就绪：当前模板/,
        'scene runtime template 未就绪早退 failure 条目结构不完整'
    );
});

test('无可提交计划相关早退返回补齐 common result 字段', () => {
    const block = getCreatePlansBatchBlock();

    assert.match(
        block,
        /if \(normalizedPlanDropFailures\.length\) \{[\s\S]*?return \{(?=[\s\S]*?goalWarnings:\s*mergedGoalWarnings)(?=[\s\S]*?submitEndpoint:)(?=[\s\S]*?strictGoalMatch)(?=[\s\S]*?allowFuzzyGoalMatch)(?=[\s\S]*?rawResponses:\s*\[\])(?=[\s\S]*?failCount:\s*normalizedPlanDropFailures\.length)[\s\S]*?\};/,
        '全部计划被 normalize 过滤时返回缺少 common 字段'
    );

    assert.match(
        block,
        /if \(!plans\.length\) \{[\s\S]*?return \{(?=[\s\S]*?failCount:\s*1)(?=[\s\S]*?goalWarnings:\s*mergedGoalWarnings)(?=[\s\S]*?submitEndpoint:)(?=[\s\S]*?strictGoalMatch)(?=[\s\S]*?allowFuzzyGoalMatch)(?=[\s\S]*?rawResponses:\s*\[\])[\s\S]*?\};/,
        '无可提交计划早退缺少 common 字段'
    );
    assert.match(
        block,
        /if \(!plans\.length\) \{[\s\S]*?failCount:\s*1,[\s\S]*?failures:\s*\[\{[\s\S]*?planName:\s*''[\s\S]*?item:\s*null[\s\S]*?marketingGoal:[\s\S]*?submitEndpoint:[\s\S]*?error:\s*sceneCapabilities\.requiresItem/,
        '无可提交计划早退 failure 条目结构不完整'
    );

    assert.match(
        block,
        /if \(!builtList\.length\) \{[\s\S]*?return \{(?=[\s\S]*?goalWarnings:\s*mergedGoalWarnings)(?=[\s\S]*?submitEndpoint:)(?=[\s\S]*?strictGoalMatch)(?=[\s\S]*?allowFuzzyGoalMatch)(?=[\s\S]*?rawResponses:\s*\[\])[\s\S]*?\};/,
        'build 阶段全部失败早退缺少 common 字段'
    );
    assert.match(
        block,
        /if \(!builtList\.length\) \{[\s\S]*?prebuildFailures\.length[\s\S]*?:\s*\[\{[\s\S]*?planName:\s*''[\s\S]*?item:\s*null[\s\S]*?marketingGoal:[\s\S]*?submitEndpoint:[\s\S]*?error:\s*'未生成可提交计划，请检查场景配置'/,
        'build 阶段全部失败早退 fallback failure 条目结构不完整'
    );
});
