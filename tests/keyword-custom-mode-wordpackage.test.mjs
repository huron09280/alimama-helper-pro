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

test('关键词推广自定义推广默认策略改为智能出价', () => {
  const block = getBlock(
    'const getDefaultStrategyList = () => ([',
    'const wizardDefaultDraft = () => ({'
  );
  assert.match(
    block,
    /id:\s*'custom_define'[\s\S]*bidMode:\s*'smart'/,
    '自定义推广默认策略仍不是智能出价'
  );
});

test('自定义推广目标运行时不再强制切到手动出价', () => {
  const block = getBlock(
    "const resolveKeywordGoalRuntime = (goalLabel = '') => {",
    'const handleGenerateOtherStrategies = () => {'
  );
  assert.doesNotMatch(
    block,
    /normalizedGoal === '自定义推广' \? 'manual' : 'smart'/,
    '仍存在自定义推广强制手动出价逻辑'
  );
  assert.match(
    block,
    /bidMode:\s*'smart'/,
    '关键词目标运行时未默认智能出价'
  );
});

test('关键词单元裁剪会按出价模式处理词包字段', () => {
  const block = getBlock(
    'const pruneKeywordAdgroupForCustomScene = (adgroup = {}, item = null, options = {}) => {',
    'const deriveFallbackKeywordListFromItem = (item = {}, keywordDefaults = {}) => {'
  );
  assert.match(
    block,
    /wordPackageList/,
    '关键词单元裁剪未处理词包字段'
  );
  assert.match(
    block,
    /bidMode/,
    '关键词单元裁剪未按出价模式区分词包处理'
  );
});

test('关键词建计划时向单元裁剪传入当前出价模式', () => {
  assert.match(
    source,
    /pruneKeywordAdgroupForCustomScene\(merged\.adgroup,\s*hasItem \? item : null,\s*\{\s*bidMode:\s*planBidMode\s*\}\)/,
    '关键词建计划未将当前出价模式传给单元裁剪逻辑'
  );
});

test('关键词自定义推广会清理资源位列表避免接口系统异常', () => {
  const block = getBlock(
    'const pruneKeywordCampaignForCustomScene = (campaign = {}, options = {}) => {',
    'const pruneKeywordAdgroupForCustomScene = (adgroup = {}, item = null, options = {}) => {'
  );
  assert.match(
    block,
    /if \(out\.promotionScene === 'promotion_scene_search_user_define'\)\s*\{[\s\S]*out\.adzoneList = \[];[\s\S]*\}/,
    '关键词自定义推广未清理 adzoneList'
  );
});

test('关键词出价模式判定会读取目标强制覆盖来源避免误判手动', () => {
  const block = getBlock(
    'const resolvePlanBidMode = ({ plan = {}, request = {}, runtime = {}, campaign = {} } = {}) => {',
    'const normalizeKeywordWordListForSubmit = (wordList = []) => {'
  );
  assert.match(
    block,
    /plan\?\.__goalResolution\?\.resolvedMarketingGoal/,
    '未读取计划级目标解析结果'
  );
  assert.match(
    block,
    /request\?\.__goalResolution\?\.resolvedMarketingGoal/,
    '未读取请求级目标解析结果'
  );
  assert.match(
    block,
    /plan\?\.goalForcedCampaignOverride\?\.promotionScene/,
    '未读取计划级目标强制营销场景'
  );
  assert.match(
    block,
    /request\?\.goalForcedCampaignOverride\?\.promotionScene/,
    '未读取请求级目标强制营销场景'
  );
  assert.match(
    block,
    /request\?\.sceneForcedCampaignOverride\?\.promotionScene/,
    '未读取场景级营销场景覆盖'
  );
});

test('关键词自定义推广不再强制改为智能出价', () => {
  const block = getBlock(
    'const resolvePlanBidMode = ({ plan = {}, request = {}, runtime = {}, campaign = {} } = {}) => {',
    'const normalizeKeywordWordListForSubmit = (wordList = []) => {'
  );
  assert.doesNotMatch(
    block,
    /keywordGoal === '自定义推广'[\s\S]*keywordSceneHint === 'promotion_scene_search_user_define'[\s\S]*keywordItemModeHint === 'user_define'[\s\S]*return 'smart';/,
    '仍存在“自定义推广/自定义选品强制智能出价”逻辑'
  );
});

test('关键词提交失败后不再执行词包校验降级重提', () => {
  const block = getBlock(
    'const buildFailureFromEntry = (entry = {}, fallbackError = \'\') => ({',
    'const result = {'
  );
  assert.doesNotMatch(
    block,
    /fallback_downgrade_pending|fallback_downgrade_confirmed|fallback_downgrade_result|downgradeKeywordEntryToManual/,
    '仍存在失败后降级重提逻辑'
  );
});
