import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function sliceBlock(startMarker, endMarker, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.ok(start > -1 && end > start, `无法定位 ${label} 代码块`);
  return source.slice(start, end);
}

test('mapSceneBidTargetValue 覆盖人群自定义三目标 display_* 映射', () => {
  const block = sliceBlock(
    'const mapSceneBidTargetValue = (text = \'\') => {',
    'const crowdCustomBidTargetCodeToLabel = (code = \'\') => {',
    'mapSceneBidTargetValue'
  );
  assert.match(
    block,
    /if \(\/获取成交量\|display\[_\\s-\]\*pay\/i\.test\(value\)\) return 'display_pay';/,
    '缺少“获取成交量 -> display_pay”映射'
  );
  assert.match(
    block,
    /if \(\/收藏加购量\|display\[_\\s-\]\*cart\/i\.test\(value\)\) return 'display_cart';/,
    '缺少“收藏加购量 -> display_cart”映射'
  );
  assert.match(
    block,
    /if \(\/增加点击量\|display\[_\\s-\]\*click\/i\.test\(value\)\) return 'display_click';/,
    '缺少“增加点击量 -> display_click”映射'
  );
});

test('normalizeCrowdCustomBidTargetCode 将旧码归一到三目标并支持 strict/fallback', () => {
  const block = sliceBlock(
    'const normalizeCrowdCustomBidTargetCode = (value = \'\', options = {}) => {',
    'const mapSiteMultiTargetOptimizeTargetValue = (text = \'\') => {',
    'normalizeCrowdCustomBidTargetCode'
  );
  assert.match(
    block,
    /if \(token === 'display_pay' \|\| token === 'conv' \|\| token === 'ad_strategy_buy' \|\| token === 'ad_strategy_retained_buy'\) \{\s*return 'display_pay';/s,
    '旧成交目标未归一到 display_pay'
  );
  assert.match(
    block,
    /if \(token === 'display_cart' \|\| token === 'fav_cart' \|\| token === 'coll_cart'\) \{\s*return 'display_cart';/s,
    '旧加购目标未归一到 display_cart'
  );
  assert.match(
    block,
    /if \(token === 'display_click' \|\| token === 'click'\) \{\s*return 'display_click';/s,
    '旧点击目标未归一到 display_click'
  );
  assert.match(
    block,
    /return strict \? '' : fallback;/,
    'normalizeCrowdCustomBidTargetCode 缺少 strict/fallback 兜底行为'
  );
});

test('人群场景目标映射优先读取“出价目标”并双写到 bidTargetV2/optimizeTarget', () => {
  const block = sliceBlock(
    'const resolveSceneSettingOverrides = ({ sceneName = \'\', sceneSettings = {}, runtime = {} }) => {',
    'const buildFallbackSolutionTemplate = (runtime, sceneName = \'\') => {',
    'resolveSceneSettingOverrides'
  );
  assert.match(
    block,
    /const targetPatterns = normalizedSceneName === '关键词推广'\s*\?\s*\[\/出价目标\/,\s*\/优化目标\/,\s*\/营销目标\/\]\s*:\s*\[\/出价目标\/,\s*\/优化目标\/\];/,
    '场景目标映射未优先读取“出价目标”'
  );
  assert.match(
    block,
    /if \(targetEntry && targetCode && supportsBidTargetFields\) \{[\s\S]*?applyCampaign\('bidTargetV2', targetCode, targetEntry\.key, targetEntry\.value\);[\s\S]*?applyCampaign\('optimizeTarget', targetCode, targetEntry\.key, targetEntry\.value\);/,
    '目标码未同步写入 bidTargetV2/optimizeTarget'
  );
});

test('人群自定义草稿迁移与场景设置构建会清理旧字段并写入新键', () => {
  const migrateBlock = sliceBlock(
    'const migrateCrowdCustomSceneSettingBucket = (sceneName = \'\') => {',
    'const ensureSceneSettingBucket = (sceneName) => {',
    'migrateCrowdCustomSceneSettingBucket'
  );
  assert.match(
    migrateBlock,
    /writeValueByLabel\('出价目标', crowdCustomBidTargetCodeToLabel\(targetCode\), \[[\s\S]*?'优化目标'[\s\S]*?'人群优化目标'[\s\S]*?'客户口径设置'[\s\S]*?'人群价值设置'[\s\S]*?\]\);/,
    '草稿迁移未把旧目标键归并到“出价目标”'
  );
  assert.match(
    migrateBlock,
    /writeValueByLabel\('资源位溢价', migratedAdzoneValue, \[[\s\S]*?'投放资源位\/投放地域\/分时折扣'[\s\S]*?'高级设置'[\s\S]*?\]\);/,
    '草稿迁移未把旧资源位键归并到“资源位溢价”'
  );
  assert.match(
    migrateBlock,
    /writeValueByLabel\('投放地域\/投放时间', migratedLaunchValue, \[[\s\S]*?'投放资源位\/投放地域\/分时折扣'[\s\S]*?'高级设置'[\s\S]*?\]\);/,
    '草稿迁移未把旧高级设置键归并到“投放地域/投放时间”'
  );
  assert.match(
    migrateBlock,
    /'优化目标'[\s\S]*?'人群优化目标'[\s\S]*?'客户口径设置'[\s\S]*?'人群价值设置'[\s\S]*?'投放资源位\/投放地域\/分时折扣'[\s\S]*?'投放资源位\/投放地域\/投放时间'[\s\S]*?'投放资源位'[\s\S]*?'资源位设置'[\s\S]*?'高级设置'/,
    '草稿迁移未清理旧键'
  );

  const payloadBlock = sliceBlock(
    'const buildSceneSettingsPayload = (sceneName = \'\') => {',
    'const renderSceneDynamicConfig = () => {',
    'buildSceneSettingsPayload'
  );
  assert.match(
    payloadBlock,
    /if \(isCrowdCustomGoal\) \{[\s\S]*?sceneSettings\.出价目标 = crowdCustomBidTargetCodeToLabel\(crowdTargetCode\);[\s\S]*?sceneSettings\.资源位溢价 = \/\(自定义\|手动\|关闭\|停用\)\/\.test\(resourcePremiumSeed\)[\s\S]*?sceneSettings\['投放地域\/投放时间'\] = \/\(自定义\|固定\|手动\|编辑\|配置\)\/\.test\(launchSettingSeed\)/,
    '构建场景设置时未规范化人群自定义新字段'
  );
  assert.match(
    payloadBlock,
    /delete sceneSettings\.优化目标;[\s\S]*?delete sceneSettings\['投放资源位\/投放地域\/分时折扣'\];[\s\S]*?delete sceneSettings\['投放资源位\/投放地域\/投放时间'\];[\s\S]*?delete sceneSettings\.投放资源位;[\s\S]*?delete sceneSettings\.高级设置;/,
    '构建场景设置时未清理旧字段'
  );
});
