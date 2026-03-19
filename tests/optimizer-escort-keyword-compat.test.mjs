import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const bootstrapSource = readFileSync(new URL('../src/optimizer/bootstrap.js', import.meta.url), 'utf8');
const coreSource = readFileSync(new URL('../src/optimizer/core.js', import.meta.url), 'utf8');
const uiSource = readFileSync(new URL('../src/optimizer/ui.js', import.meta.url), 'utf8');

test('护航关键词匹配兼容小万护航/实时护航', () => {
  assert.match(
    bootstrapSource,
    /isEscortActionText:\s*\(text\)\s*=>\s*\{[\s\S]*算法护航[\s\S]*小万护航[\s\S]*实时护航[\s\S]*\}/,
    '护航关键词匹配函数未包含新文案兼容'
  );
});

test('护航方案提取使用统一关键词匹配函数', () => {
  assert.match(
    coreSource,
    /list\.find\(\s*i\s*=>\s*Utils\.isEscortActionText\(i\?\.actionText\)\s*\)/,
    '核心流程仍在硬编码护航文案匹配'
  );
});

test('护航方案表格高亮使用统一关键词匹配函数', () => {
  assert.match(
    uiSource,
    /highlight:\s*row\s*=>\s*Utils\.isEscortActionText\(row\?\.actionText\)/,
    'UI 高亮仍在硬编码护航文案匹配'
  );
});
