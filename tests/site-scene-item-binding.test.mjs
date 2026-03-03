import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

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
