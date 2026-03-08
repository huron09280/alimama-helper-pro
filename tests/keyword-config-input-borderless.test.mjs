import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

test('关键词向导通用输入样式去掉边框，避免矩阵目标包数值框被通用规则盖回去', () => {
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-toolbar input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\),[\s\S]*?#am-wxt-keyword-modal \.am-wxt-config textarea \{[\s\S]*?border: 0;[\s\S]*?border-radius: 8px;/,
    '关键词向导通用输入样式仍带边框'
  );
});

test('矩阵目标包数值输入仍保持无边框和自适应宽度', () => {
  assert.match(source, /#am-wxt-keyword-modal \.am-wxt-matrix-bid-package-row input \{/, '缺少矩阵目标包数值输入样式块');
  assert.match(
    source,
    /width: calc\(var\(--am-wxt-matrix-bid-package-cost-chars, 4\) \* 1ch \+ 14px\);/,
    '矩阵目标包数值输入未按字符数自适应宽度'
  );
  assert.match(source, /#am-wxt-keyword-modal \.am-wxt-matrix-bid-package-row input \{[\s\S]*?border: 0;/, '矩阵目标包数值输入仍带边框');
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-matrix-bid-package-row input \{[\s\S]*?background: transparent;/,
    '矩阵目标包数值输入背景未保持透明'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-matrix-bid-package-row input \{[\s\S]*?appearance: none;[\s\S]*?-webkit-appearance: none;/,
    '矩阵目标包数值输入未关闭原生输入外观'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-matrix-bid-package-row input \{[\s\S]*?text-align: center;/,
    '矩阵目标包数值输入未居中'
  );
  assert.match(
    source,
    /const syncMatrixBidTargetCostInputPresentation = \(costInput = null\) => \{[\s\S]*?costInput\.style\.setProperty\('--am-wxt-matrix-bid-package-cost-chars', String\(widthChars\)\);[\s\S]*?costInput\.style\.border = '0';[\s\S]*?costInput\.style\.textAlign = 'center';[\s\S]*?costInput\.style\.webkitAppearance = 'none';[\s\S]*?costInput\.style\.appearance = 'none';/,
    '矩阵目标包数值输入缺少运行时宽度与外观同步'
  );
});
