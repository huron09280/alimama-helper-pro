import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getMagicPromptDriverBlock() {
  const start = source.indexOf('const MagicPromptDriver = {');
  const end = source.indexOf('const resolveKeywordPlanApiAccessor = () => {', start);
  assert.ok(start > -1 && end > start, '无法定位 MagicPromptDriver 代码块');
  return source.slice(start, end);
}

test('MagicPromptDriver 为“查数/一键查数”按钮提供优先识别与近邻加权', () => {
  const block = getMagicPromptDriverBlock();
  assert.match(block, /if \(text\.includes\('一键查数'\)\) score \+= 220;/, '缺少一键查数高权重');
  assert.match(block, /else if \(text\.includes\('查数'\)\) score \+= 150;/, '缺少查数权重');
  assert.match(block, /if \(inputEl && el\.closest\('#ai-input-magic-report'\)\) score \+= 220;/, '缺少输入区近邻加权');
  assert.match(block, /if \(/, 'MagicPromptDriver 代码块为空');
});

test('MagicPromptDriver 触发器选择器覆盖 report/search 并包含近邻兜底扫描', () => {
  const block = getMagicPromptDriverBlock();
  assert.match(block, /'button\[mx-click\*="report"\]'/, '缺少 report 按钮选择器');
  assert.match(block, /'\[mx-click\*="report"\]'/, '缺少 report 通用选择器');
  assert.match(block, /'\[id\*="input_btn"\]'/, '缺少输入区提交按钮选择器');
  assert.match(block, /nearest\.querySelectorAll\('button, \[role="button"\], \[mx-click\], \[tabindex\]'\)/, '缺少输入区兜底扫描');
  assert.match(block, /if \(!\/查数\|查询\|search\|query\|submit\|send\|report\/i\.test\(text\)\) return;/, '兜底扫描未按查数关键词过滤');
});

test('MagicPromptDriver 跨 iframe 场景采用 ownerDocument.defaultView 判定元素类型', () => {
  const block = getMagicPromptDriverBlock();
  assert.match(block, /isElementNode\(el\)\s*\{[\s\S]*el\.nodeType === 1;/, '缺少跨 iframe 元素节点判定');
  assert.match(block, /const view = el\.ownerDocument\?\.defaultView \|\| window;/, '缺少 ownerDocument.defaultView 上下文判定');
  assert.match(block, /view\.HTMLInputElement && el instanceof view\.HTMLInputElement/, '缺少跨 iframe input 类型判定');
  assert.match(block, /if \(!this\.isElementNode\(el\)\) return;/, '点击触发未使用跨 iframe 元素保护');
});

test('MagicPromptDriver 优先走 Magix Vframe setData/search 提交，避免 DOM 话术与请求体不一致', () => {
  const block = getMagicPromptDriverBlock();
  assert.match(block, /buildPromptWordList\(promptText\)/, '缺少 prompt wordList 构造');
  assert.match(block, /getMagixVframe\(doc\)/, '缺少 Magix Vframe 获取逻辑');
  assert.match(block, /inputVframe\.invoke\('setData', \[wordList, false\]\)/, '缺少 Vframe setData 提交');
  assert.match(block, /inputVframe\.invoke\('search'\)/, '缺少 Vframe search 提交');
  assert.match(block, /const vframeResult = this\.submitPromptViaVframe\(doc, inputEl, promptText\);/, 'trySubmitPromptInDocument 未优先使用 Vframe 提交');
});
