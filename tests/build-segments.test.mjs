import test from 'node:test';
import assert from 'node:assert/strict';
import {
    PRE_KEYWORD_SEGMENTS,
    KEYWORD_PLAN_API_SEGMENTS,
    POST_KEYWORD_SEGMENTS,
    CORE_RUNTIME_SEGMENTS,
    USERSCRIPT_SEGMENTS,
    EXTENSION_PAGE_SEGMENTS,
    EXTENSION_PAGE_RUNTIME_SEGMENTS,
    WIZARD_STYLE_SEGMENT,
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

test('extension page segments keep compat entry before extension runtime segments', () => {
    assert.equal(
        EXTENSION_PAGE_SEGMENTS[0],
        'src/entries/extension-page-compat.js',
        'extension entry point must stay first'
    );
    const rest = EXTENSION_PAGE_SEGMENTS.slice(1);
    assert.deepEqual(
        rest,
        EXTENSION_PAGE_RUNTIME_SEGMENTS,
        'extension segments after the entry should match extension runtime segments'
    );
    assert.equal(
        rest[0],
        'src/shared/script-preamble.js',
        'extension runtime must keep shared script preamble first'
    );
    assert.equal(
        rest[1],
        'src/entries/extension-license-guard.js',
        'extension license guard must execute right after preamble'
    );
    const firstKeywordIndex = rest.indexOf(KEYWORD_PLAN_API_SEGMENTS[0]);
    const postStartIndex = rest.indexOf(POST_KEYWORD_SEGMENTS[0]);
    assert.ok(firstKeywordIndex > 1, 'extension page runtime 应包含 keyword-plan-api，避免点击时首次解析大包');
    assert.ok(postStartIndex > firstKeywordIndex, 'extension post keyword segments 应在 keyword-plan-api 之后执行');
});

test('wizard style segment stays in both userscript and extension runtimes', () => {
    assert.ok(
        KEYWORD_PLAN_API_SEGMENTS.includes(WIZARD_STYLE_SEGMENT),
        'keyword-plan-api segment 清单必须包含组建计划样式源'
    );
    assert.ok(
        USERSCRIPT_SEGMENTS.includes(WIZARD_STYLE_SEGMENT),
        'userscript 必须继续包含组建计划样式源以保持自包含'
    );
    assert.ok(
        EXTENSION_PAGE_RUNTIME_SEGMENTS.includes(WIZARD_STYLE_SEGMENT),
        'extension runtime 必须继续包含组建计划样式源并由构建器替换为外置 CSS loader'
    );
});

test('keyword-plan-api 目录下新增切片文件必须加入 segment 清单', () => {
    const missing = findMissingKeywordPlanApiSegments();
    assert.deepEqual(
        missing,
        [],
        `发现未纳入 KEYWORD_PLAN_API_SEGMENTS 的文件:\n${missing.join('\n')}`
    );
});
