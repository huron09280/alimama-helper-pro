import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getRenderSceneDynamicConfigBlock() {
  const start = source.indexOf('const renderSceneDynamicConfig = () => {');
  const end = source.indexOf('const collectManualKeywordRowsFromPanel = (panel) => (', start);
  assert.ok(start > -1 && end > start, '无法定位 renderSceneDynamicConfig 代码块');
  return source.slice(start, end);
}

test('关键词场景平均直接成交成本代理开关会跟随底层控件 disabled 状态', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /data-proxy-check-target="am-wxt-keyword-single-cost-enable"[\s\S]*wizardState\.els\.singleCostEnableInput\?\.disabled\s*\?\s*'disabled'\s*:\s*''/,
    '平均直接成交成本代理 checkbox 未同步 disabled 状态'
  );
});

test('代理 checkbox 变更时会跳过 disabled 的真实控件', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /if \(!\(target instanceof HTMLInputElement\) \|\| target\.disabled\) return;/,
    'proxy checkbox 仍会尝试写入 disabled 真实控件'
  );
});
