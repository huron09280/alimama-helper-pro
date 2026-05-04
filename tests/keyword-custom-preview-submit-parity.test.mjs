import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getBlock(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.ok(start > -1 && end > start, `无法定位代码块: ${startMarker}`);
  return source.slice(start, end);
}

test('默认自定义推广策略与请求预览保持智能出价 conv 契约', () => {
  const defaultsBlock = getBlock(
    'const getDefaultStrategyList = () => ([',
    'const wizardDefaultDraft = () => ({'
  );
  assert.match(
    defaultsBlock,
    /id:\s*'custom_define'[\s\S]*marketingGoal:\s*'自定义推广'[\s\S]*bidMode:\s*'smart'[\s\S]*bidTargetV2:\s*'conv'[\s\S]*useWordPackage:\s*DEFAULTS\.useWordPackage[\s\S]*出价目标:\s*'获取成交量'/,
    '默认自定义推广策略未保持 自定义推广 + 智能出价 + conv + 流量智选 契约'
  );

  const previewBlock = getBlock(
    'const strategyBidMode = normalizeBidMode(',
    'const commonKeywordMode = wizardState.draft.keywordMode || DEFAULTS.keywordMode;'
  );
  assert.match(
    previewBlock,
    /strategySceneSettings\.出价方式 = strategyBidMode === 'manual' \? '手动出价' : '智能出价';/,
    '请求预览未把出价方式写回 sceneSettings'
  );
  assert.match(
    previewBlock,
    /const strategyBidTargetLabel = BID_TARGET_OPTIONS\.find\(item => item\.value === strategyBidTargetOptionValue\)\?\.label \|\| '获取成交量';[\s\S]*strategySceneSettings\.出价目标 = strategyBidTargetLabel;/,
    '请求预览未把 conv 目标回写为“获取成交量”'
  );
  assert.match(
    previewBlock,
    /keywordSource:\s*\{[\s\S]*useWordPackage:\s*strategyUseWordPackage[\s\S]*\}/,
    '请求预览未保留流量智选开关'
  );
});

test('手动出价预览与最终提交都会裁掉出价目标字段', () => {
  const previewBlock = getBlock(
    'if (isKeywordScene) {',
    'const strategyKeywordMode = strategy.keywordMode || wizardState.draft.keywordMode || DEFAULTS.keywordMode;'
  );
  assert.match(
    previewBlock,
    /if \(strategyBidMode === 'manual'\) \{[\s\S]*delete strategySceneSettings\.出价目标;[\s\S]*delete strategySceneSettings\.优化目标;/,
    '手动出价预览未删除 出价目标/优化目标'
  );

  const submitBlock = getBlock(
    'const pruneKeywordCampaignForCustomScene = (campaign = {}, options = {}) => {',
    'const pruneKeywordAdgroupForCustomScene = (adgroup = {}, item = null, options = {}) => {'
  );
  assert.match(
    submitBlock,
    /if \(isManual\)\s*\{[\s\S]*delete out\.bidTargetV2;[\s\S]*delete out\.optimizeTarget;[\s\S]*\}/,
    '手动出价最终提交未删除 bidTargetV2/optimizeTarget'
  );
});

test('自定义推广高级设置三字段在预览场景设置与最终提交间保持同名字段', () => {
  const renderBlock = getBlock(
    "if (activeKeywordGoal === '自定义推广') {",
    "if (sceneName === '货品全站推广') {"
  );
  assert.match(
    renderBlock,
    /label:\s*'投放资源位\/投放地域\/分时折扣'[\s\S]*hiddenFields:\s*\[[\s\S]*\{ fieldKey: adzoneField, value: adzoneRaw \},[\s\S]*\{ fieldKey: launchPeriodField, value: launchPeriodRaw \},[\s\S]*\{ fieldKey: launchAreaField, value: launchAreaRaw \}[\s\S]*\]/,
    '编辑态组合弹窗未把三类高级设置写入同一个场景设置快照'
  );

  const mappingBlock = getBlock(
    'const resolveSceneSettingOverrides = ({ sceneName = \'\', sceneSettings = {}, runtime = {} }) => {',
    'const buildFallbackSolutionTemplate = (runtime, sceneName = \'\') => {'
  );
  for (const key of ['adzoneList', 'launchPeriodList', 'launchAreaStrList']) {
    assert.match(
      mappingBlock,
      new RegExp(key),
      `场景设置映射未识别 ${key}`
    );
  }

  const submitBlock = getBlock(
    'const pruneKeywordCampaignForCustomScene = (campaign = {}, options = {}) => {',
    'const pruneKeywordAdgroupForCustomScene = (adgroup = {}, item = null, options = {}) => {'
  );
  assert.match(
    submitBlock,
    /out\.adzoneList = resolveNonEmptyArrayField\('adzoneList'[\s\S]*\);/,
    '最终提交未保留/回落 adzoneList'
  );
  assert.match(
    submitBlock,
    /out\.launchAreaStrList = Array\.isArray\(resolvedLaunchAreaList\) && resolvedLaunchAreaList\.length[\s\S]*\? resolvedLaunchAreaList[\s\S]*: \['all'\];/,
    '最终提交未保留/回落 launchAreaStrList'
  );
  assert.match(
    submitBlock,
    /out\.launchPeriodList = Array\.isArray\(resolvedLaunchPeriodList\) && resolvedLaunchPeriodList\.length[\s\S]*\? resolvedLaunchPeriodList[\s\S]*: buildDefaultLaunchPeriodList\(\);/,
    '最终提交未保留/回落 launchPeriodList'
  );
});
