import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

test('目标成本输入框样式保证“请输入”占位文案完整显示', () => {
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-strategy-target-cost \{[\s\S]*?padding:\s*2px 2px 2px 6px;[\s\S]*?width:\s*auto;[\s\S]*?justify-content:\s*flex-start;[\s\S]*?\}[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-target-cost-field \{[\s\S]*?flex:\s*0 0 auto;[\s\S]*?min-width:\s*0;[\s\S]*?\}[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-target-cost input \{[\s\S]*?width:\s*auto;[\s\S]*?min-width:\s*0;[\s\S]*?border-radius:\s*999px;[\s\S]*?padding-right:\s*20px;[\s\S]*?box-sizing:\s*border-box;[\s\S]*?\}/,
    '目标成本胶囊未切到内容自适应布局，仍可能出现右侧留白不均或输入框过宽'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-strategy-target-cost input::placeholder \{[\s\S]*?opacity:\s*1;[\s\S]*?\}/,
    '目标成本输入框 placeholder 可见性未显式设置'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-strategy-target-cost input\[type="number"\] \{[\s\S]*?appearance:\s*textfield;[\s\S]*?\}/,
    '目标成本输入框未移除 number 默认控件样式'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-strategy-target-cost input\[type="number"\]::\-webkit-outer-spin-button,[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-target-cost input\[type="number"\]::\-webkit-inner-spin-button \{[\s\S]*?\-webkit-appearance:\s*none;[\s\S]*?\}/,
    '目标成本输入框未禁用 webkit spinner，可能吞掉可视宽度'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-strategy-target-cost-field:not\(\.with-unit\) input \{[\s\S]*?width:\s*auto;[\s\S]*?min-width:\s*0;[\s\S]*?padding-right:\s*8px;[\s\S]*?\}/,
    'ROI 目标值输入框未沿用内容自适应的输入宽度规则'
  );
  assert.match(source, /const measureStrategyTargetCostInputWidth = \(input = null\) => \{/, '缺少目标成本输入框测宽 helper');
  assert.match(
    source,
    /const minWidth = hasUnit \? 48 : 36;[\s\S]*?return Math\.max\(minWidth,\s*textWidth \+ paddingLeft \+ paddingRight \+ borderLeft \+ borderRight \+ 4\);/,
    '目标成本输入框测宽仍存在过小下限或截断上限，输入长数值时可能切字'
  );
  assert.match(source, /const syncStrategyTargetCostInputWidth = \(input = null\) => \{/, '缺少目标成本输入框宽度同步 helper');
  assert.match(source, /const scheduleStrategyTargetCostInputWidthSync = \(input = null\) => \{/, '缺少目标成本输入框首帧测宽调度 helper');
  assert.match(
    source,
    /const syncStrategyTargetCostInputOnly = \(\) => \{[\s\S]*?syncStrategyTargetCostFields\(strategy,\s*strategyBidTargetCode,\s*targetCostInput\.value\);[\s\S]*?syncStrategyTargetCostInputWidth\(targetCostInput\);[\s\S]*?\}/,
    '输入目标成本时未同步刷新输入框宽度'
  );
  assert.match(
    source,
    /const nextValue = syncStrategyTargetCostFields\(strategy,\s*strategyBidTargetCode,\s*parsed\);[\s\S]*?targetCostInput\.value = nextValue;[\s\S]*?syncStrategyTargetCostInputWidth\(targetCostInput\);/,
    '目标成本提交归一后未重新同步输入框宽度'
  );
  assert.match(
    source,
    /wizardState\.els\.strategyList\.appendChild\(row\);[\s\S]*?scheduleStrategyTargetCostInputWidthSync\(targetCostInput\);/,
    '目标成本输入框未在挂载到列表后重新测宽，默认值仍可能先被切字'
  );
});
