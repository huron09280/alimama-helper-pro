import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getGoalChangeBlock() {
  const start = source.indexOf("if (activeScene === '关键词推广' && isGoalSelectorField(fieldKey)) {");
  assert.ok(start > -1, '无法定位关键词目标切换分支');
  const end = source.indexOf('syncSceneSettingValuesFromUI();', start);
  assert.ok(end > start, '关键词目标切换分支结构不完整');
  return source.slice(start, end);
}

test('关键词营销目标切换不再强制改写 bidMode/bidTarget，且不再隐式覆盖 campaign 出价目标字段', () => {
  const block = getGoalChangeBlock();
  assert.match(
    block,
    /resolveKeywordGoalRuntime\(/,
    '缺少关键词目标运行时映射调用'
  );
  assert.doesNotMatch(
    block,
    /wizardState\.els\.bidModeSelect\.value\s*=\s*keywordRuntime\.bidMode/,
    '仍存在营销目标切换时强制改写出价方式'
  );
  assert.doesNotMatch(
    block,
    /updateBidModeControls\(keywordRuntime\.bidMode\)/,
    '仍存在营销目标切换时强制刷新为目标默认出价方式'
  );
  assert.doesNotMatch(
    block,
    /wizardState\.els\.bidTargetSelect\.value\s*=\s*keywordRuntime\.bidTargetV2/,
    '仍存在营销目标切换时强制改写出价目标'
  );
  assert.match(
    block,
    /campaign\.promotionScene/,
    '缺少 campaign.promotionScene 同步'
  );
  assert.match(
    block,
    /campaign\.itemSelectedMode/,
    '缺少 campaign.itemSelectedMode 同步'
  );
  assert.doesNotMatch(
    block,
    /localSceneBucket\[campaignBidTargetKey\]\s*=/,
    '营销目标切换仍在隐式覆盖 campaign.bidTargetV2'
  );
  assert.doesNotMatch(
    block,
    /localSceneBucket\[campaignOptimizeTargetKey\]\s*=/,
    '营销目标切换仍在隐式覆盖 campaign.optimizeTarget'
  );
});
