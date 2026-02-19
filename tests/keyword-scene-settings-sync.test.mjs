import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getBlock(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.ok(start > -1, `无法定位起始标记: ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  assert.ok(end > start, `无法定位结束标记: ${endMarker}`);
  return source.slice(start, end);
}

test('关键词场景构建 sceneSettings 时，出价方式/出价目标与当前静态控件保持一致', () => {
  const block = getBlock(
    'const buildSceneSettingsPayload = (sceneName = \'\') => {',
    'const renderSceneDynamicConfig = () => {'
  );
  assert.match(
    block,
    /const currentBidMode = normalizeBidMode\(\s*wizardState\?\.els\?\.bidModeSelect\?\.value/,
    '未从当前静态出价方式控件读取 bidMode'
  );
  assert.match(
    block,
    /if \(allowAutoBidType\)\s*\{[\s\S]*if \(targetSceneName === '关键词推广'\)\s*\{\s*sceneSettings\.出价方式 = bidTypeLabel;/,
    '关键词场景未强制回写 sceneSettings.出价方式'
  );
  assert.match(
    block,
    /if \(allowAutoBidTarget && bidTargetLabel\)\s*\{[\s\S]*if \(targetSceneName === '关键词推广'\)\s*\{[\s\S]*sceneSettings\.出价目标 = bidTargetLabel;/,
    '关键词场景未强制回写 sceneSettings.出价目标'
  );
  assert.match(
    block,
    /if \(currentBidMode === 'manual'\)\s*\{[\s\S]*delete sceneSettings\.出价目标;[\s\S]*delete sceneSettings\.优化目标;/,
    '关键词手动出价时未清理 sceneSettings 的目标字段'
  );
});

test('关键词计划组装请求时，会清理 sceneSettings 的残留 API 字段并对齐出价方式', () => {
  const block = getBlock(
    'const buildRequestFromWizard = () => {',
    'const buildSceneRequestsFromWizard = (request = {}) => {'
  );
  assert.match(
    block,
    /strategySceneSettings\.出价方式 = strategyBidMode === 'manual' \? '手动出价' : '智能出价';/,
    '未在组装计划请求时对齐关键词 sceneSettings.出价方式'
  );
  assert.match(
    block,
    /delete strategySceneSettings\['campaign\.bidTypeV2'\];[\s\S]*delete strategySceneSettings\['campaign\.bidTargetV2'\];[\s\S]*delete strategySceneSettings\['campaign\.optimizeTarget'\];/,
    '未清理关键词 sceneSettings 残留 campaign.* 出价字段'
  );
});
