import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

test('关键词配置文本输入样式需排除 checkbox/radio', () => {
  const textInputSelectorPattern = /#am-wxt-keyword-modal \.am-wxt-toolbar input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\),[\s\S]*#am-wxt-keyword-modal \.am-wxt-config input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\),[\s\S]*#am-wxt-keyword-modal \.am-wxt-config select,[\s\S]*#am-wxt-keyword-modal \.am-wxt-config textarea/s;
  assert.ok(
    textInputSelectorPattern.test(source),
    '文本输入通用样式仍覆盖 checkbox/radio，可能导致勾选视觉异常'
  );
});

test('关键词配置 checkbox 需有独立可视样式', () => {
  const checkboxRulePattern = /#am-wxt-keyword-modal \.am-wxt-config input\[type="checkbox"\]\s*\{[\s\S]*appearance:\s*auto\s*!important;[\s\S]*accent-color:\s*#4f68ff;[\s\S]*\}/s;
  assert.ok(
    checkboxRulePattern.test(source),
    '缺少 checkbox 独立视觉样式，勾选状态可能不可见'
  );

  const checkboxDisabledRulePattern = /#am-wxt-keyword-modal \.am-wxt-config input\[type="checkbox"\]:disabled\s*\{[\s\S]*cursor:\s*not-allowed;[\s\S]*opacity:\s*0\.55;[\s\S]*\}/s;
  assert.ok(
    checkboxDisabledRulePattern.test(source),
    '缺少 checkbox disabled 态视觉反馈'
  );
});

test('手动关键词出价输入框保持无边框', () => {
  const bidInputRulePattern = /#am-wxt-keyword-modal \.am-wxt-config \.am-wxt-manual-keyword-item \.am-wxt-bid-edit input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\)\s*\{[\s\S]*border:\s*0;[\s\S]*background:\s*transparent;[\s\S]*\}/s;
  assert.ok(
    bidInputRulePattern.test(source),
    '手动关键词出价输入框样式未显式覆盖通用输入边框'
  );
});
