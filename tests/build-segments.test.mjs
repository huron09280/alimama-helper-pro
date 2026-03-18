import test from 'node:test';
import assert from 'node:assert/strict';
import {
    PRE_KEYWORD_SEGMENTS,
    KEYWORD_PLAN_API_SEGMENTS,
    POST_KEYWORD_SEGMENTS,
    CORE_RUNTIME_SEGMENTS,
    EXTENSION_PAGE_SEGMENTS,
    findMissingKeywordPlanApiSegments
} from '../scripts/build.mjs';

test('core runtime segments are PRE + keyword plan + POST', () => {
    const expected = [
        ...PRE_KEYWORD_SEGMENTS,
        ...KEYWORD_PLAN_API_SEGMENTS,
        ...POST_KEYWORD_SEGMENTS
    ];
    assert.deepEqual(CORE_RUNTIME_SEGMENTS, expected, 'CORE_RUNTIME_SEGMENTS must concatenate the shared slices');
});

test('extension page segments keep compat entry before shared runtime segments', () => {
    assert.equal(
        EXTENSION_PAGE_SEGMENTS[0],
        'src/entries/extension-page-compat.js',
        'extension entry point must stay first'
    );
    const rest = EXTENSION_PAGE_SEGMENTS.slice(1);
    assert.deepEqual(rest, CORE_RUNTIME_SEGMENTS, 'extension segments after the entry should match CORE runtime segments');
});

test('keyword-plan-api 目录下新增切片文件必须加入 segment 清单', () => {
    const missing = findMissingKeywordPlanApiSegments();
    assert.deepEqual(
        missing,
        [],
        `发现未纳入 KEYWORD_PLAN_API_SEGMENTS 的文件:\n${missing.join('\n')}`
    );
});
