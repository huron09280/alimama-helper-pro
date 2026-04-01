import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pageBundle = readFileSync(new URL('../dist/extension/page.bundle.js', import.meta.url), 'utf8');

test('授权模块补齐 shopId 多来源识别与缓存兜底', () => {
  assert.match(pageBundle, /const decodeUnicodeEscapes = \(value\) => \{/, '缺少 shopName Unicode 转义解码函数');
  assert.match(pageBundle, /const normalizeShopName = \(value\) => \{[\s\S]*decodeUnicodeEscapes\(raw\)\.trim\(\)/, 'shopName 归一化未接入 Unicode 解码');
  assert.match(pageBundle, /const shopName = normalizeShopName\(state\.shopName\) \|\| '-';/, '遮罩展示未使用解码后的 shopName');
  assert.match(pageBundle, /push\('window\.__INITIAL_STATE__', window\.__INITIAL_STATE__\);/, '未补齐 __INITIAL_STATE__ 识别来源');
  assert.match(pageBundle, /const parseShopFromDomText = \(sourceName = 'dom_text'\) => \{/, '未补齐 DOM 文本店铺ID识别');
  assert.match(pageBundle, /const fromDomText = parseShopFromDomText\('dom_text'\);/, 'resolveShopIdentity 未接入 DOM 文本候选');
  assert.match(pageBundle, /const cacheShopId = normalizeShopId\(cache\?\.shopId\);/, '缺少 cache shopId 兜底读取');
  assert.match(pageBundle, /if \(!shopInfo\.shopId && !force && cacheShopId\) \{[\s\S]*license_cache_fallback/, '缺少 shopId 缓存兜底分支');
  assert.match(pageBundle, /resolveShopIdentityWithRetry/, '缺少 shopId 重试解析入口');
});

test('bootstrap 预热阶段未识别 shopId 时不应立即锁定', () => {
  assert.match(
    pageBundle,
    /if \(!shopInfo\.shopId && source === 'bootstrap_preflight'\) \{\s*throw createError\('shop_not_found', '未识别到店铺标识（shopId）'\);\s*\}/,
    'bootstrap 预热缺少非锁定早退'
  );
});
