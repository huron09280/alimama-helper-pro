import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

test('首页计划摘要把目标成本和预算固定在独立右侧元信息组，避免随目标文案漂移', () => {
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-strategy-right \{[\s\S]*?flex:\s*1 1 420px;[\s\S]*?min-width:\s*0;[\s\S]*?\}[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-right > \.am-wxt-strategy-summary:first-child \{[\s\S]*?flex:\s*1 1 auto;[\s\S]*?min-width:\s*0;[\s\S]*?text-align:\s*right;[\s\S]*?\}/,
    '首页计划摘要未把第一段目标说明变成弹性列，目标成本仍会被不同目标文案推着跑'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-strategy-target-cost \{[\s\S]*?flex:\s*0 0 auto;[\s\S]*?width:\s*auto;[\s\S]*?box-sizing:\s*border-box;[\s\S]*?justify-content:\s*flex-start;[\s\S]*?\}[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-right > \.am-wxt-strategy-summary:nth-of-type\(2\) \{[\s\S]*?flex:\s*0 0 73px;[\s\S]*?width:\s*73px;[\s\S]*?\}/,
    '首页计划摘要未把目标成本胶囊切到内容自适应布局，预算列可能再次被错位'
  );
  assert.match(
    source,
    /@media \(max-width: 980px\) \{[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-right > \.am-wxt-strategy-summary:first-child \{[\s\S]*?flex:\s*0 1 auto;[\s\S]*?text-align:\s*left;[\s\S]*?\}[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-target-cost,[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-right > \.am-wxt-strategy-summary:nth-of-type\(2\) \{[\s\S]*?flex:\s*0 0 auto;[\s\S]*?width:\s*auto;[\s\S]*?\}/,
    '移动端未回退为自然宽度布局，可能出现摘要拥挤或换行异常'
  );
});
