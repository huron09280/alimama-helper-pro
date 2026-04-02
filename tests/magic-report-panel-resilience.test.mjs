import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getMagicReportBlock() {
  const start = source.indexOf('const MagicReport = {');
  const end = source.indexOf('const CampaignIdQuickEntry = {', start);
  assert.ok(start > -1 && end > start, '无法定位 MagicReport 代码块');
  return source.slice(start, end);
}

function getUiBlock() {
  const start = source.indexOf('const UI = {');
  const end = source.indexOf('const BudgetFrontendLimitBypass = {', start);
  assert.ok(start > -1 && end > start, '无法定位 UI 代码块');
  return source.slice(start, end);
}

test('MagicReport.createPopup 会清理失联弹窗引用与旧 DOM 节点', () => {
  const block = getMagicReportBlock();
  assert.match(
    block,
    /createPopup\(\)\s*\{[\s\S]*if \(this\.popup instanceof HTMLElement && this\.popup\.isConnected\) return;[\s\S]*this\.popup = null;[\s\S]*const stalePopup = document\.getElementById\('am-magic-report-popup'\);[\s\S]*if \(stalePopup instanceof HTMLElement\) stalePopup\.remove\(\);/,
    'createPopup 未清理失联引用/旧弹窗节点，重复注入后可能出现面板不显示'
  );
});

test('MagicReport.toggle 在展示前会校验 popup 是否仍在 DOM', () => {
  const block = getMagicReportBlock();
  assert.match(
    block,
    /toggle\(show\)\s*\{[\s\S]*if \(\!\(this\.popup instanceof HTMLElement\) \|\| !this\.popup\.isConnected\) \{[\s\S]*this\.popup = null;[\s\S]*\}[\s\S]*if \(this\.popup\) \{[\s\S]*\} else if \(show\) \{/,
    'toggle 未校验失联 popup，页面重渲染后可能点击无反应'
  );
});

test('UI.createElements 会清理旧主面板节点，避免重复注入导致按钮失联', () => {
  const block = getUiBlock();
  assert.match(
    block,
    /createElements\(\)\s*\{[\s\S]*document\.querySelectorAll\('#am-helper-icon, #am-helper-panel'\)\.forEach\(\(node\)\s*=>\s*\{[\s\S]*if \(node instanceof HTMLElement\) node\.remove\(\);[\s\S]*\}\);/,
    'UI.createElements 未清理旧主面板，重复注入时万能查数按钮可能无响应'
  );
});

test('UI 悬浮图标包含默认动效并兼容减少动态偏好', () => {
  const block = getUiBlock();
  assert.match(
    block,
    /#am-helper-icon svg \{[\s\S]*animation:\s*am-helper-icon-pulse\s+2\.4s\s+ease-in-out\s+infinite;/,
    '悬浮图标缺少默认动效，无法呈现动图效果'
  );
  assert.match(
    block,
    /@media \(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*#am-helper-icon svg \{[\s\S]*animation:\s*none\s*!important;/,
    '悬浮图标未兼容减少动态偏好，可能影响可访问性'
  );
});

test('MagicReport 识别当前计划ID/计划名时会遍历所有已勾选行，避免命中无效勾选框', () => {
  const block = getMagicReportBlock();
  assert.match(
    block,
    /const checkedBoxes = document\.querySelectorAll\('input\[type="checkbox"\]\[value\]:checked'\);[\s\S]*for \(const checkedBox of checkedBoxes\) \{[\s\S]*const id = this\.extractCampaignIdFromElement\(checkedBox\);[\s\S]*if \(!id\) continue;[\s\S]*this\.lastCampaignId = id;/,
    'getCurrentCampaignId 未遍历所有已勾选框，可能误判为无计划ID'
  );
  assert.match(
    block,
    /const checkedBoxes = document\.querySelectorAll\('input\[type="checkbox"\]\[value\]:checked'\);[\s\S]*for \(const checkedBox of checkedBoxes\) \{[\s\S]*const row = checkedBox\.closest\('tr, \[role="row"\], li, \[class\*="row"\], \[class\*="item"\]'\);[\s\S]*if \(!row\) continue;/,
    'getCurrentCampaignName 未遍历勾选行，可能读取不到计划名'
  );
});

test('MagicReport.extractCampaignId 支持从纯数字字符串（checkbox value）提取计划ID', () => {
  const block = getMagicReportBlock();
  assert.match(
    block,
    /for \(const source of normalized\) \{[\s\S]*const compact = String\(source \|\| ''\)\.trim\(\);[\s\S]*if \(\/\^\\d\{6,\}\$\/\.test\(compact\)\) return compact;/,
    'extractCampaignId 未支持纯数字计划ID，勾选计划后仍可能识别失败'
  );
});
