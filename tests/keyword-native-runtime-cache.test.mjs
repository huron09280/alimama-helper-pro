import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const introSource = readFileSync(new URL('../src/optimizer/keyword-plan-api/intro.js', import.meta.url), 'utf8');
const searchSource = readFileSync(new URL('../src/optimizer/keyword-plan-api/search-and-draft.js', import.meta.url), 'utf8');

test('关键词向导 native runtime list cache 使用单一主动清理计时器', () => {
    assert.match(
        introSource,
        /nativeRuntimeCacheCleanupTimer:\s*0/,
        'runtimeCache 缺少 native runtime list cache 清理 timer 句柄'
    );
    assert.match(
        searchSource,
        /const NATIVE_RUNTIME_CACHE_TTL_MS = 8 \* 1000;[\s\S]*const NATIVE_CROWD_CACHE_TTL_MS = NATIVE_RUNTIME_CACHE_TTL_MS;[\s\S]*const CROWD_NATIVE_RUNTIME_CACHE_TTL_MS = NATIVE_RUNTIME_CACHE_TTL_MS;/,
        '三类 native runtime list cache 应复用同一个 8 秒 TTL'
    );
    assert.match(
        searchSource,
        /const NATIVE_RUNTIME_LIST_CACHE_SLOTS = \[[\s\S]*valueKey: 'nativeCrowdList'[\s\S]*tsKey: 'nativeCrowdTs'[\s\S]*bizCodeKey: 'nativeCrowdBizCode'[\s\S]*valueKey: 'nativeCrowdCustomBidTargetOptions'[\s\S]*tsKey: 'nativeCrowdCustomBidTargetTs'[\s\S]*bizCodeKey: 'nativeCrowdCustomBidTargetBizCode'[\s\S]*valueKey: 'nativeAdzoneList'[\s\S]*tsKey: 'nativeAdzoneTs'[\s\S]*bizCodeKey: 'nativeAdzoneBizCode'/,
        '清理槽位必须覆盖原生人群、出价目标和资源位三类运行态列表缓存'
    );
});

test('native runtime list cache 到期后清空 value/ts/bizCode 并重排下一次清理', () => {
    assert.match(
        searchSource,
        /const clearNativeRuntimeListCacheSlot = \(slot = \{\}\) => \{[\s\S]*runtimeCache\[slot\.valueKey\] = null;[\s\S]*runtimeCache\[slot\.tsKey\] = 0;[\s\S]*if \(slot\.bizCodeKey\) runtimeCache\[slot\.bizCodeKey\] = '';/,
        '清理单个槽位时必须释放列表值、时间戳和 bizCode'
    );
    assert.match(
        searchSource,
        /const cleanupNativeRuntimeListCaches = \(\) => \{[\s\S]*const hasCachedList = Array\.isArray\(value\) && value\.length;[\s\S]*clearNativeRuntimeListCacheSlot\(slot\);[\s\S]*const delayMs = ttlMs - Math\.max\(0, ageMs\);[\s\S]*nextDelayMs = nextDelayMs \? Math\.min\(nextDelayMs, delayMs\) : delayMs;[\s\S]*return nextDelayMs;/,
        'cleanup 应只释放过期列表，并返回仍新鲜列表的最近到期时间'
    );
    assert.match(
        searchSource,
        /const scheduleNativeRuntimeListCacheCleanup = \(\) => \{[\s\S]*if \(runtimeCache\.nativeRuntimeCacheCleanupTimer\) return;[\s\S]*runtimeCache\.nativeRuntimeCacheCleanupTimer = window\.setTimeout\(\(\) => \{[\s\S]*runtimeCache\.nativeRuntimeCacheCleanupTimer = 0;[\s\S]*cleanupNativeRuntimeListCaches\(\);[\s\S]*scheduleNativeRuntimeListCacheCleanup\(\);[\s\S]*\}, nextDelayMs\);/,
        '调度器必须保持单一 timer，并在触发后按剩余缓存重排'
    );
});

test('三类 native runtime list cache 写入后调度清理且保留 fresh cache 命中窗口', () => {
    assert.match(
        searchSource,
        /const hasFreshCache = Array\.isArray\(runtimeCache\.nativeCrowdList\)[\s\S]*\(now - toNumber\(runtimeCache\.nativeCrowdTs, 0\)\) < NATIVE_CROWD_CACHE_TTL_MS;[\s\S]*return deepClone\(runtimeCache\.nativeCrowdList\);[\s\S]*runtimeCache\.nativeCrowdList = deepClone\(bestList\);[\s\S]*runtimeCache\.nativeCrowdTs = now;[\s\S]*runtimeCache\.nativeCrowdBizCode = expectedBizCode;[\s\S]*scheduleNativeRuntimeListCacheCleanup\(\);/,
        '原生人群列表应保持 8 秒 fresh cache 命中，并在写入后调度 TTL 清理'
    );
    assert.match(
        searchSource,
        /const hasFreshCache = Array\.isArray\(runtimeCache\.nativeCrowdCustomBidTargetOptions\)[\s\S]*\(now - toNumber\(runtimeCache\.nativeCrowdCustomBidTargetTs, 0\)\) < CROWD_NATIVE_RUNTIME_CACHE_TTL_MS;[\s\S]*return deepClone\(runtimeCache\.nativeCrowdCustomBidTargetOptions\);[\s\S]*runtimeCache\.nativeCrowdCustomBidTargetOptions = deepClone\(bestOptions\);[\s\S]*runtimeCache\.nativeCrowdCustomBidTargetTs = now;[\s\S]*runtimeCache\.nativeCrowdCustomBidTargetBizCode = expectedBizCode;[\s\S]*scheduleNativeRuntimeListCacheCleanup\(\);/,
        '原生人群出价目标选项应保持 fresh cache 命中，并在写入后调度 TTL 清理'
    );
    assert.match(
        searchSource,
        /const hasFreshCache = Array\.isArray\(runtimeCache\.nativeAdzoneList\)[\s\S]*\(now - toNumber\(runtimeCache\.nativeAdzoneTs, 0\)\) < CROWD_NATIVE_RUNTIME_CACHE_TTL_MS;[\s\S]*return deepClone\(runtimeCache\.nativeAdzoneList\);[\s\S]*runtimeCache\.nativeAdzoneList = deepClone\(bestList\);[\s\S]*runtimeCache\.nativeAdzoneTs = now;[\s\S]*runtimeCache\.nativeAdzoneBizCode = expectedBizCode;[\s\S]*scheduleNativeRuntimeListCacheCleanup\(\);/,
        '原生资源位列表应保持 fresh cache 命中，并在写入后调度 TTL 清理'
    );
});
