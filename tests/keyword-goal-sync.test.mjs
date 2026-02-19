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

test('关键词营销目标切换会同步 bidMode/bidTarget 与 campaign 运行时字段', () => {
  const block = getGoalChangeBlock();
  assert.match(
    block,
    /resolveKeywordGoalRuntime\(/,
    '缺少关键词目标运行时映射调用'
  );
  assert.match(
    block,
    /wizardState\.els\.bidModeSelect\.value\s*=\s*keywordRuntime\.bidMode/,
    '缺少出价方式同步'
  );
  assert.match(
    block,
    /updateBidModeControls\(keywordRuntime\.bidMode\)/,
    '缺少出价方式 UI 同步'
  );
  assert.match(
    block,
    /wizardState\.els\.bidTargetSelect\.value\s*=\s*keywordRuntime\.bidTargetV2/,
    '缺少出价目标同步'
  );
  assert.match(
    block,
    /campaign\.bidTargetV2/,
    '缺少 campaign.bidTargetV2 同步'
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
  assert.match(
    block,
    /campaign\.optimizeTarget/,
    '缺少 campaign.optimizeTarget 同步'
  );
});
