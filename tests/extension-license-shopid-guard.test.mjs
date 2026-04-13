import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pageBundle = readFileSync(new URL('../dist/extension/page.bundle.js', import.meta.url), 'utf8');

test('授权模块补齐 shopId 多来源识别与缓存兜底', () => {
  assert.match(pageBundle, /const AUTH_BASE_URL = "https:\/\/am-licee-server-mpbzozflkj\.cn-hangzhou\.fcapp\.run";/, '授权服务地址未切换到阿里云可用地址');
  assert.doesNotMatch(pageBundle, /mock-license\.local/, '授权服务地址仍指向 mock-license.local');
  assert.match(pageBundle, /const decodeUnicodeEscapes = \(value\) => \{/, '缺少 shopName Unicode 转义解码函数');
  assert.match(pageBundle, /const sanitizeShopNameCandidate = \(value = ''\) => \{/, '缺少 shopName 候选清洗函数');
  assert.match(pageBundle, /const normalizeShopName = \(value\) => \{[\s\S]*decodeUnicodeEscapes\(raw\)\.trim\(\)/, 'shopName 归一化未接入 Unicode 解码');
  assert.match(pageBundle, /const PRIMARY_SHOP_ID_KEY_SET = new Set\(\['shopid'\]\);/, '缺少 shopId 主键优先集合');
  assert.match(pageBundle, /const SECONDARY_SHOP_ID_KEY_SET = new Set\(\['sellerid', 'memberid', 'merchantid', 'principalid', 'ownerid'\]\);/, '缺少降级ID键集合');
  assert.match(pageBundle, /const resolveSecondaryShopIdVerifiedSet = \(candidates = \[\], options = \{\}\) => \{/, '缺少降级ID二次校验函数');
  assert.match(pageBundle, /\+secondary_verified/, '降级ID命中缺少二次校验来源标识');
  assert.match(pageBundle, /const shopName = normalizeShopName\(state\.shopName\) \|\| '-';/, '遮罩展示未使用解码后的 shopName');
  assert.match(pageBundle, /push\('window\.__INITIAL_STATE__', window\.__INITIAL_STATE__\);/, '未补齐 __INITIAL_STATE__ 识别来源');
  assert.match(pageBundle, /const parseShopFromDomText = \(sourceName = 'dom_text'\) => \{/, '未补齐 DOM 文本店铺ID识别');
  assert.match(
    pageBundle,
    /const inline = lines\[idLineIndex\]\.match\(\/\^\(\.\+\?\)\(\?:店铺ID\|商家ID\|账号ID\|ID\)\\s\*\[:：\]\\s\*\\d\{6,\}\\b\/\);/,
    '未补齐同一行店铺名解析'
  );
  assert.match(pageBundle, /const parseShopNameFromLabeledText = \(text = ''\) => \{/, '缺少标签文本店铺名解析函数');
  assert.match(pageBundle, /const parseShopNameNearShopId = \(shopId = '', text = ''\) => \{/, '缺少按 shopId 锚定的店铺名解析函数');
  assert.match(pageBundle, /const collectShopIdAnchoredTextBlocks = \(shopId = ''\) => \{/, '缺少 shopId 锚定文本块收集函数');
  assert.match(pageBundle, /const resolveLooseShopNameCandidate = \(shopId = ''\) => \{/, '缺少店铺名松耦合兜底解析');
  assert.match(pageBundle, /const fromDomText = parseShopFromDomText\('dom_text'\);/, 'resolveShopIdentity 未接入 DOM 文本候选');
  assert.match(pageBundle, /const fallbackShopName = nameMatch \? '' : resolveLooseShopNameCandidate\(shopId\);/, 'resolveShopIdentity 未接入带 shopId 的店铺名松耦合兜底');
  assert.match(pageBundle, /const cacheShopId = normalizeShopId\(cache\?\.shopId\);/, '缺少 cache shopId 兜底读取');
  assert.match(pageBundle, /const stateShopId = normalizeShopId\(state\.shopId \|\| ''\);/, '缺少 state shopId 兜底读取');
  assert.match(pageBundle, /if \(!shopInfo\.shopId && stateShopId\) \{[\s\S]*license_state_fallback/, '缺少 state shopId 兜底分支');
  assert.match(pageBundle, /else if \(!shopInfo\.shopId && cacheShopId\) \{[\s\S]*license_cache_fallback/, '缺少 cache shopId 兜底分支');
  assert.match(pageBundle, /const scheduleShopNameBackfill = \(context = \{\}\) => \{/, '缺少店铺名异步回填任务');
  assert.match(pageBundle, /const SHOP_NAME_BACKFILL_ATTEMPTS_DEFAULT = 8;/, '缺少店铺名回填重试默认配置');
  assert.match(pageBundle, /const fallbackName = resolveLooseShopNameCandidate\(shopId\);/, '店铺名异步回填未使用 shopId 定向兜底');
  assert.match(pageBundle, /if \(!state\.authorized \|\| document\.getElementById\(OVERLAY_ID\)\) \{\s*renderOverlay\(\);\s*\}/, '店铺名回填后未刷新锁定遮罩');
  assert.match(pageBundle, /const verifiedShopName = normalizeShopName\(shopInfo\.shopName \|\| normalized\?\.policy\?\.shopName \|\| ''\);/, '授权成功未接入 policy.shopName 回填');
  assert.match(pageBundle, /source: `\$\{source\}\+after_lock`/, '授权失败后未触发二次店铺名回填任务');
  assert.match(pageBundle, /scheduleShopNameBackfill\(\{\s*shopId: shopInfo\.shopId,\s*shopName: shopInfo\.shopName,\s*source\s*\}\);/, '授权链路未接入店铺名回填调用');
  assert.match(pageBundle, /resolveShopIdentityWithRetry/, '缺少 shopId 重试解析入口');
});

test('bootstrap 预热阶段未识别 shopId 时不应立即锁定', () => {
  assert.match(
    pageBundle,
    /if \(!shopInfo\.shopId && source === 'bootstrap_preflight'\) \{\s*throw createError\('shop_not_found', '未识别到店铺标识（shopId）'\);\s*\}/,
    'bootstrap 预热缺少非锁定早退'
  );
});

test('授权租约到期前会自动续租并失败重试', () => {
  assert.match(pageBundle, /const LEASE_RENEW_DEFAULT_LEAD_MS = 60 \* 1000;/, '缺少租约续租提前量默认值');
  assert.match(pageBundle, /let renewTimer = 0;/, '缺少租约续租计时器');
  assert.match(pageBundle, /clearLeaseTimers/, '缺少租约双计时器清理函数');
  assert.match(
    pageBundle,
    /assertAuthorized\(\{\s*source: 'lease_renew',\s*force: true,[\s\S]*?\}\)\.catch\(\(\) => \{/,
    '租约到期前未触发强制续租'
  );
  assert.match(
    pageBundle,
    /assertAuthorized\(\{\s*source: 'lease_renew_retry',\s*force: true,[\s\S]*?\}\)\.catch\(\(\) => \{ \}\);/,
    '续租失败后未触发补偿重试'
  );
});
