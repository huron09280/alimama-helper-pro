import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getResolvePreferredItemsBlock() {
  const start = source.indexOf('const resolvePreferredItems = async (request, runtime) => {');
  const end = source.indexOf('const isSceneLikelyRequireItem = (sceneName = \'\') => {', start);
  assert.ok(start > -1 && end > start, '无法定位 resolvePreferredItems 代码块');
  return source.slice(start, end);
}

function getResolveParityTestItemBlock() {
  const start = source.indexOf('const resolveParityTestItem = async (sceneName = \'\', options = {}) => {');
  const end = source.indexOf('const buildParityStrategyTemplate = (sceneName = \'\', patch = {}) => {', start);
  assert.ok(start > -1 && end > start, '无法定位 resolveParityTestItem 代码块');
  return source.slice(start, end);
}

test('关键词场景缺省会优先尝试注入默认同步商品 682357641421', () => {
  const block = getResolvePreferredItemsBlock();
  assert.match(
    block,
    /SCENE_SYNC_DEFAULT_ITEM_ID/,
    'resolvePreferredItems 未引用默认同步商品 ID'
  );
  assert.match(
    block,
    /fetchItemsByIds\(\[SCENE_SYNC_DEFAULT_ITEM_ID\], runtime\)/,
    'resolvePreferredItems 未尝试按默认商品 ID 拉取商品'
  );
  assert.match(
    block,
    /关键词推广/,
    'resolvePreferredItems 未按关键词场景做默认商品注入判断'
  );
});

test('场景校对用例选品会优先使用默认同步商品 ID', () => {
  const block = getResolveParityTestItemBlock();
  assert.match(
    block,
    /SCENE_SYNC_DEFAULT_ITEM_ID/,
    'resolveParityTestItem 未引用默认同步商品 ID'
  );
  assert.match(
    block,
    /fetchItemsByIds\(\[SCENE_SYNC_DEFAULT_ITEM_ID\], runtime\)/,
    'resolveParityTestItem 未尝试按默认商品 ID 拉取商品'
  );
});
