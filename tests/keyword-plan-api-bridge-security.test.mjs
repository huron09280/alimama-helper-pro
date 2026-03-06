import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

test('page bridge 默认仅在 debug 开关开启时暴露', () => {
    assert.match(source, /const PAGE_API_DEBUG_STORAGE_KEY = '__AM_WXT_DEBUG_PAGE_API__';/, '缺少 page API debug 开关常量');
    assert.match(source, /const shouldExposePageApiDebug = \(\) => \{[\s\S]*?PAGE_API_DEBUG_STORAGE_KEY[\s\S]*?localStorage/s, '缺少 page API debug 开关判定');
    assert.match(source, /if \(shouldExposePageApiDebug\(\)\) \{[\s\S]*?installPageApiBridgeHost\(\);[\s\S]*?injectPageApiBridgeClient\(\);[\s\S]*?\}/s, 'page bridge 未被 debug 开关保护');
    assert.match(source, /if \(shouldExposePageApi\(\)\) \{[\s\S]*?window\.__AM_WXT_KEYWORD_API__ = bridgeApi;[\s\S]*?window\.__AM_WXT_PLAN_API__ = bridgeApi;[\s\S]*?\}/s, '注入到页面的 bridge API 未被 debug 开关保护');
});

test('token 不再通过全局对象直接暴露给页面', () => {
    assert.doesNotMatch(source, /window\.__AM_TOKENS__\s*=\s*State\.tokens;/, '不应继续把 token 暴露到 window.__AM_TOKENS__');
    assert.doesNotMatch(source, /pageGlobal\.__AM_TOKENS__\s*=\s*State\.tokens;/, '不应继续把 token 暴露到 pageGlobal.__AM_TOKENS__');
    assert.doesNotMatch(source, /\[\s*window\.__AM_TOKENS__/, '鉴权聚合逻辑不应依赖 window.__AM_TOKENS__');
});


test('双 IIFE 仍通过 sandbox globalThis 共享 token 与计划 API', () => {
    assert.match(source, /globalThis\.__AM_TOKENS__\s*=\s*State\.tokens;/, '缺少 sandbox token 内部桥接');
    assert.match(source, /globalThis\.__AM_WXT_KEYWORD_API__\s*=\s*KeywordPlanApi;/, '缺少 sandbox KeywordPlanApi 内部桥接');
    assert.match(source, /globalThis\.__AM_WXT_PLAN_API__\s*=\s*KeywordPlanApi;/, '缺少 sandbox Plan API 内部桥接');
    assert.match(source, /\(typeof globalThis !== 'undefined' \? globalThis\.__AM_TOKENS__ : null\)/, '鉴权聚合未回退到 sandbox token');
});


test('关键词计划入口仍会优先通过 sandbox 内部桥接解析 API', () => {
    assert.match(source, /const fromGlobal = globalThis\.__AM_WXT_KEYWORD_API__;/, '入口缺少 globalThis KeywordPlanApi 兜底');
    assert.match(source, /if \(fromGlobal && typeof fromGlobal\.openWizard === 'function'\) \{[\s\S]*?return fromGlobal;[\s\S]*?\}/s, '入口未优先接受 sandbox 内部桥接');
});

test('向导 API 覆盖检查将 page API 视为可选调试面', () => {
    assert.match(source, /const pageApiExposed = \(typeof window !== 'undefined' && isPlainObject\(window\.__AM_WXT_KEYWORD_API__\)\);/, '缺少 pageApiExposed 标记');
    assert.match(source, /const missingInPage = pageApiExposed[\s\S]*?: \[\];/s, '缺少 page API 可选时的空缺省处理');
    assert.match(source, /ok: missingInLocal.length === 0 && \(!pageApiExposed \|\| missingInPage.length === 0\)/, 'page API 关闭时不应导致覆盖检查失败');
});
