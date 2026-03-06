import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

test('目标成本输入框样式保证“请输入”占位文案完整显示', () => {
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-strategy-target-cost input \{[\s\S]*?width:\s*68px;[\s\S]*?min-width:\s*68px;[\s\S]*?padding-right:\s*20px;[\s\S]*?box-sizing:\s*border-box;[\s\S]*?\}/,
    '目标成本输入框宽度或内边距不足，可能导致占位文案被截断'
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
});
