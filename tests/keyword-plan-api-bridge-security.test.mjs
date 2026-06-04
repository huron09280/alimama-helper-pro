import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

test('page API 全局客户端默认仅在 debug 开关开启时暴露', () => {
    assert.match(source, /const PAGE_API_DEBUG_STORAGE_KEY = '__AM_WXT_DEBUG_PAGE_API__';/, '缺少 page API debug 开关常量');
    assert.match(source, /const shouldExposePageApiDebug = \(\) => \{[\s\S]*?PAGE_API_DEBUG_STORAGE_KEY[\s\S]*?localStorage/s, '缺少 page API debug 开关判定');
    assert.match(source, /if \(isExtensionPageRuntime\(\) \|\| shouldExposePageApiDebug\(\)\) \{[\s\S]*?installPageApiBridgeHost\(\);[\s\S]*?\}/s, 'extension 运行态应默认安装内部 bridge host');
    assert.match(source, /if \(shouldExposePageApiDebug\(\)\) \{[\s\S]*?injectPageApiBridgeClient\(\);[\s\S]*?\}/s, 'page API 全局客户端未被 debug 开关保护');
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

test('extension 默认安装内部复制桥但不把完整 API 暴露到页面全局', () => {
    const start = source.indexOf('const installKeywordPlanOpenBridgeHost = () => {');
    const end = source.indexOf('const installPageApiBridgeHost = () => {', start);
    assert.ok(start > -1 && end > start, '无法定位 openWizard 窄桥 host');
    const narrowBridgeBlock = source.slice(start, end);
    assert.match(narrowBridgeBlock, /resolveKeywordPlanOpenForBridge\(\)/, '窄桥应通过 openWizard-only 解析器打开向导');
    assert.match(narrowBridgeBlock, /ensureKeywordPlanApiForBridge\(\)/, '窄桥应确认关键词 API 已随 page runtime 初始化');
    assert.doesNotMatch(narrowBridgeBlock, /loadKeywordPlanApiForExtension/, '窄桥不应在点击路径懒加载关键词 API 大包');
    assert.doesNotMatch(narrowBridgeBlock, /createPlansBatch|searchItems|runCreateRepairByItem|appendKeywords|suggestKeywords/, '窄桥不得包含建计划或查询类高权限方法');
    assert.match(source, /installKeywordPlanOpenBridgeHost\(\);\s*if \(isExtensionPageRuntime\(\) \|\| shouldExposePageApiDebug\(\)\) \{[\s\S]*?installPageApiBridgeHost\(\);[\s\S]*?\}\s*if \(shouldExposePageApiDebug\(\)\) \{/s, '窄桥与内部复制桥应默认安装，完整 page API 全局客户端仍必须在 debug 开关内');
    assert.match(source, /if \(window\[KEYWORD_PLAN_OPEN_BRIDGE_READY_KEY\] === '1'\) \{[\s\S]*?return createKeywordPlanOpenBridgeApi\(\);[\s\S]*?\}/s, '主助手未回退到 openWizard 窄桥');
});

test('完整 page API bridge host 也校验方法白名单', () => {
    assert.match(source, /const API_BRIDGE_METHOD_SET = new Set\(API_BRIDGE_METHODS\);/, 'bridge host 缺少方法白名单 Set');
    assert.match(source, /'copyCurrentPlanByScene'/, '受控复制当前计划方法应加入 bridge 白名单');
    assert.match(
        source,
        /if \(!API_BRIDGE_METHOD_SET\.has\(method\)\) \{[\s\S]*?throw new Error\(`method_not_allowed:\$\{method\}`\);[\s\S]*?\}/s,
        'bridge host 调用 API 前必须拒绝白名单外 method'
    );
});

test('完整 page API bridge result cache 会主动按 TTL 释放', () => {
    const start = source.indexOf('const installPageApiBridgeHost = () => {');
    const end = source.indexOf('const injectPageApiBridgeClient = () => {', start);
    assert.ok(start > -1 && end > start, '无法定位完整 page API bridge host');
    const block = source.slice(start, end);
    assert.match(block, /const BRIDGE_RESULT_CACHE_TTL_MS = 90 \* 1000;/, 'bridge result cache TTL 应保持 90 秒');
    assert.match(block, /const resolvedPayloadCache = new Map\(\);/, 'bridge result cache 应保持单一 Map 事实源');
    assert.match(block, /let bridgeCacheCleanupTimer = 0;/, 'bridge result cache 缺少主动清理 timer');
    assert.match(
        block,
        /const cleanupBridgeCache = \(\) => \{[\s\S]*let nextDelayMs = Infinity;[\s\S]*resolvedPayloadCache\.forEach\(\(cached, callId\) => \{[\s\S]*const ts = Number\(cached\?\.ts\);[\s\S]*resolvedPayloadCache\.delete\(callId\);[\s\S]*nextDelayMs = Math\.min\(nextDelayMs, Math\.max\(0, BRIDGE_RESULT_CACHE_TTL_MS - \(now - ts\)\)\);[\s\S]*return Number\.isFinite\(nextDelayMs\) \? nextDelayMs : null;/,
        'cleanupBridgeCache 应删除过期结果，并返回下一条结果的清理时间'
    );
    assert.match(
        block,
        /const scheduleBridgeCacheCleanup = \(\) => \{[\s\S]*if \(bridgeCacheCleanupTimer\) return;[\s\S]*const nextDelayMs = cleanupBridgeCache\(\);[\s\S]*bridgeCacheCleanupTimer = window\.setTimeout\(\(\) => \{[\s\S]*bridgeCacheCleanupTimer = 0;[\s\S]*cleanupBridgeCache\(\);[\s\S]*scheduleBridgeCacheCleanup\(\);[\s\S]*\}, Math\.max\(1, Math\.ceil\(nextDelayMs\) \+ 1\)\);[\s\S]*\};/,
        'bridge result cache 应通过一个可重入 timeout 主动释放，并在仍有缓存时继续调度'
    );
    assert.match(
        block,
        /resolvedPayloadCache\.set\(callId,\s*\{[\s\S]*ts: Date\.now\(\),[\s\S]*payload[\s\S]*\}\);[\s\S]*scheduleBridgeCacheCleanup\(\);[\s\S]*dispatchBridgeResponse\(payload\);/,
        'bridge result cache 写入后应立即安排主动 TTL 清理'
    );
});

test('向导 API 覆盖检查将 page API 视为可选调试面', () => {
    assert.match(source, /const pageApiExposed = \(typeof window !== 'undefined' && isPlainObject\(window\.__AM_WXT_KEYWORD_API__\)\);/, '缺少 pageApiExposed 标记');
    assert.match(source, /const missingInPage = pageApiExposed[\s\S]*?: \[\];/s, '缺少 page API 可选时的空缺省处理');
    assert.match(source, /ok: missingInLocal.length === 0 && \(!pageApiExposed \|\| missingInPage.length === 0\)/, 'page API 关闭时不应导致覆盖检查失败');
});
