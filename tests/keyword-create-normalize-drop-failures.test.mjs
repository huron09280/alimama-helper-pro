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

test('createPlansBatch 接收 normalizePlans 的缺商品计划上报并转成失败明细', () => {
    const block = getCreatePlansBatchBlock();
    assert.match(
        block,
        /const normalizedPlanDropFailures = \[\];/,
        '缺少 normalizePlans 过滤计划失败缓存'
    );
    assert.match(
        block,
        /onDroppedPlan:\s*\(droppedPlan = \{\}\) => \{[\s\S]*?normalizedPlanDropFailures\.push\(buildDroppedPlanFailure\(droppedPlan,\s*mergedRequest\)\);/,
        'createPlansBatch 未接收 normalizePlans 的过滤计划上报'
    );
    assert.match(
        block,
        /if \(!plans\.length\) \{[\s\S]*?if \(normalizedPlanDropFailures\.length\) \{[\s\S]*?failCount:\s*normalizedPlanDropFailures\.length,[\s\S]*?failures:\s*normalizedPlanDropFailures/,
        '全部计划被过滤时未返回明确失败明细'
    );
    assert.match(
        block,
        /const prebuildFailures = normalizedPlanDropFailures\.slice\(\);/,
        '预构建失败未合并 normalizePlans 过滤失败'
    );
});
