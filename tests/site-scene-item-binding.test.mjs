import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function extractSiteSceneBuildBlock() {
  const start = source.indexOf("if (sceneCapabilities.sceneName === '货品全站推广') {");
  const end = source.indexOf("if (sceneCapabilities.sceneName === '店铺直达') {", start);
  assert.ok(start > -1 && end > start, '无法定位货品全站推广构建分支');
  return source.slice(start, end);
}

test('货品全站推广能力回退启用 itemIdList，避免空商品计划', () => {
  assert.match(
    source,
    /'货品全站推广':\s*\{\s*hasMaterial:\s*true,\s*hasItemIdList:\s*true,\s*hasWordList:\s*false,\s*hasWordPackageList:\s*false,\s*hasRightList:\s*false\s*\}/,
    'capabilityFallback 未为货品全站推广开启 hasItemIdList'
  );
});

test('resolveSceneCapabilities 对货品全站推广强制保留 itemIdList', () => {
  assert.match(
    source,
    /hasItemIdList:\s*\(normalizedScene === '关键词推广' \|\| normalizedScene === '货品全站推广'\) \? true : hasItemIdList,/
  );

  assert.match(
    source,
    /if \(hasItem && sceneCapabilities\.hasItemIdList\) \{[\s\S]*?campaign\.itemIdList = \[toIdValue\(item\.materialId \|\| item\.itemId\)\];/,
    'buildSolutionFromPlan 未在 hasItemIdList 场景回填 campaign.itemIdList'
  );
});

test('模板可选字段裁剪阶段保留 hasItemIdList 场景的 itemIdList', () => {
  assert.match(
    source,
    /if \(key === 'itemIdList' && hasItem && sceneCapabilities\.hasItemIdList\) return;/,
    '可选字段裁剪错误删除 itemIdList，可能导致创建空商品计划'
  );
});

test('货品全站推广在存在商品时强制 user_define 选品模式，避免空商品观感', () => {
  assert.match(
    source,
    /if \(sceneCapabilities\.sceneName === '货品全站推广'\) \{[\s\S]*?merged\.campaign\.itemSelectedMode = hasItem\s*\? 'user_define'\s*:\s*\(merged\.campaign\.itemSelectedMode \|\| runtimeForScene\?\.storeData\?\.itemSelectedMode \|\| 'user_define'\);/,
    '货品全站推广未在有商品时强制 user_define，可能落入全店模式导致空商品计划'
  );
});

test('货品全站推广保留插件计划名，不再强制改写为 site 时间戳', () => {
  const block = extractSiteSceneBuildBlock();
  assert.match(
    block,
    /merged\.campaign\.campaignName = String\(\s*merged\.campaign\.campaignName\s*\|\|\s*plan\.planName\s*\|\|\s*''\s*\)\.trim\(\);/,
    '货品全站推广未把 campaignName 对齐为插件计划名'
  );
  assert.doesNotMatch(
    block,
    /safeSiteCampaignName|site\$\{nowStampSeconds\(\)\}|\^\[A-Za-z0-9\]\{2,64\}\$/,
    '货品全站推广仍存在计划名强制改写逻辑'
  );
  assert.doesNotMatch(
    source,
    /siteNameAutoNormalized/,
    '计划名一致性比对仍放过“site时间戳自动改名”特例'
  );
});
