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
    /createPopup\(\)\s*\{[\s\S]*if \(this\.popup instanceof HTMLElement && this\.popup\.isConnected\) return;[\s\S]*this\.releasePopupResources\(\);[\s\S]*const stalePopup = document\.getElementById\('am-magic-report-popup'\);[\s\S]*if \(stalePopup instanceof HTMLElement\) stalePopup\.remove\(\);/,
    'createPopup 未清理失联引用/旧弹窗节点，重复注入后可能出现面板不显示'
  );
});

test('MagicReport.toggle 关闭时会释放弹窗资源，展示前会校验 popup 是否仍在 DOM', () => {
  const block = getMagicReportBlock();
  assert.match(
    block,
    /toggle\(show\)\s*\{[\s\S]*const nextOpen = show === true;[\s\S]*if \(!nextOpen\) \{[\s\S]*this\.releasePopupResources\(\);[\s\S]*State\.config\.magicReportOpen = false;[\s\S]*return;[\s\S]*if \(\!\(this\.popup instanceof HTMLElement\) \|\| !this\.popup\.isConnected\) \{[\s\S]*this\.popup = null;[\s\S]*\}[\s\S]*if \(!this\.popup\) \{[\s\S]*this\.createPopup\(\);/,
    'toggle 未在关闭时释放资源，或展示前未校验失联 popup'
  );
});

test('MagicReport 关闭释放会清理 iframe、DOM、全局监听、timer 和可重建缓存', () => {
  const block = getMagicReportBlock();
  assert.match(block, /popupCleanupHandlers:\s*\[\],[\s\S]*popupLifecycleToken:\s*0,[\s\S]*quickPromptResetTimer:\s*0,[\s\S]*quickPromptRetryTimer:\s*0,[\s\S]*iframeCleanupRetryTimer:\s*0,[\s\S]*magicPromptDraft:\s*''/, 'MagicReport 未声明关闭生命周期所需状态');
  assert.match(block, /releasePopupResources\(\)\s*\{[\s\S]*this\.captureMagicPromptDraft\(\);[\s\S]*this\.popupLifecycleToken \+= 1;[\s\S]*this\.hideCrowdMatrixHoverTip\(\);[\s\S]*this\.setCrowdCampaignItemDropdownOpen\(false\);[\s\S]*this\.runPopupCleanupHandlers\(\);[\s\S]*this\.clearMagicRuntimeCaches\(\);/, 'releasePopupResources 未统一收敛浮层、监听和缓存清理');
  assert.match(block, /if \(this\.iframe instanceof HTMLIFrameElement\) \{[\s\S]*this\.iframe\.onload = null;[\s\S]*this\.iframe\.onerror = null;[\s\S]*this\.iframe\.src = 'about:blank';[\s\S]*\}/, 'releasePopupResources 未释放 iframe 子文档');
  assert.match(block, /const popup = this\.popup instanceof HTMLElement[\s\S]*document\.getElementById\('am-magic-report-popup'\);[\s\S]*if \(popup instanceof HTMLElement\) popup\.remove\(\);[\s\S]*document\.getElementById\('am-magic-report-popup-style'\);[\s\S]*if \(style instanceof HTMLElement\) style\.remove\(\);/, 'releasePopupResources 未卸载 popup DOM 或样式节点');
  assert.match(block, /if \(this\.quickPromptResetTimer\) \{[\s\S]*clearTimeout\(this\.quickPromptResetTimer\);[\s\S]*if \(this\.quickPromptRetryTimer\) \{[\s\S]*clearTimeout\(this\.quickPromptRetryTimer\);[\s\S]*if \(this\.iframeCleanupRetryTimer\) \{[\s\S]*clearTimeout\(this\.iframeCleanupRetryTimer\);/, 'clearMagicRuntimeCaches 未清理关闭后的待执行 timer');
  assert.doesNotMatch(block.match(/releasePopupResources\(\)\s*\{[\s\S]*?\n\s*\},\n\s*\n\s*createPopup\(/)?.[0] || '', /lastCampaignId\s*=\s*''|lastCampaignName\s*=\s*''/, '关闭释放不应清空最近计划上下文');
});

test('MagicReport document 级监听和拖拽监听会登记到 popup cleanup', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const handleDocumentClick = \(e\) => \{[\s\S]*this\.setCrowdCampaignItemDropdownOpen\(false\);[\s\S]*\};[\s\S]*const handleDocumentKeydown = \(e\) => \{[\s\S]*if \(e\.key !== 'Escape'\) return;[\s\S]*this\.setCrowdCampaignItemDropdownOpen\(false\);[\s\S]*\};[\s\S]*document\.addEventListener\('click', handleDocumentClick\);[\s\S]*document\.addEventListener\('keydown', handleDocumentKeydown\);[\s\S]*this\.addPopupCleanup\(\(\) => \{[\s\S]*document\.removeEventListener\('click', handleDocumentClick\);[\s\S]*document\.removeEventListener\('keydown', handleDocumentKeydown\);/, 'document click/Escape 监听必须可注销，不能匿名常驻');
  assert.match(block, /document\.addEventListener\('mousemove', handleDragMove\);[\s\S]*document\.addEventListener\('mouseup', handleDragEnd\);[\s\S]*this\.addPopupCleanup\(\(\) => \{[\s\S]*document\.removeEventListener\('mousemove', handleDragMove\);[\s\S]*document\.removeEventListener\('mouseup', handleDragEnd\);[\s\S]*document\.body\.style\.userSelect = '';[\s\S]*\}\);/, '拖拽监听必须随弹窗释放注销');
  assert.match(block, /const resizeHandler = this\.popupResizeHandler;[\s\S]*this\.addPopupCleanup\(\(\) => window\.removeEventListener\('resize', resizeHandler\)\);/, 'resize 监听 cleanup 应捕获注册时的 handler');
  assert.match(block, /const dropdownPositionHandler = this\.popupDropdownPositionHandler;[\s\S]*this\.addPopupCleanup\(\(\) => \{[\s\S]*window\.removeEventListener\('resize', dropdownPositionHandler\);[\s\S]*document\.removeEventListener\('scroll', dropdownPositionHandler, true\);/, 'dropdown resize/scroll 监听 cleanup 应捕获注册时的 handler');
});

test('MagicReport 释放 iframe 前保存查询草稿并在重开后恢复', () => {
  const block = getMagicReportBlock();
  assert.match(block, /setPromptInputValue\(inputEl, promptText\)\s*\{[\s\S]*const ok = MagicPromptDriver\.setPromptInputValue\(inputEl, promptText\);[\s\S]*if \(ok\) this\.magicPromptDraft = String\(promptText \|\| ''\)\.trim\(\);[\s\S]*return ok;/, '设置查询输入时应同步草稿');
  assert.match(block, /captureMagicPromptDraft\(\)\s*\{[\s\S]*const iframeDoc = this\.getIframeDoc\(\);[\s\S]*const inputEl = this\.findPromptInput\(iframeDoc\);[\s\S]*if \(!inputEl\) return;[\s\S]*const draft = this\.readPromptInputValue\(inputEl\);[\s\S]*this\.magicPromptDraft = draft;[\s\S]*\}/, '关闭前未保存 iframe 查询输入草稿');
  assert.match(block, /restoreMagicPromptDraft\(\)\s*\{[\s\S]*const draft = String\(this\.magicPromptDraft \|\| ''\)\.trim\(\);[\s\S]*const inputEl = this\.findPromptInput\(iframeDoc\);[\s\S]*return this\.setPromptInputValue\(inputEl, draft\);[\s\S]*\}/, '重开后未恢复查询输入草稿');
  assert.match(block, /const revealIframe = \(\) => \{[\s\S]*this\.iframe\.style\.opacity = '1';[\s\S]*this\.restoreMagicPromptDraft\(\);[\s\S]*\};/, 'iframe 显示后应尝试恢复查询草稿');
});

test('UI.createElements 会清理旧主面板节点，避免重复注入导致按钮失联', () => {
  const block = getUiBlock();
  assert.match(
    block,
    /createElements\(\)\s*\{[\s\S]*document\.querySelectorAll\('#am-helper-icon, #am-helper-panel'\)\.forEach\(\(node\)\s*=>\s*\{[\s\S]*if \(node instanceof HTMLElement\) node\.remove\(\);[\s\S]*\}\);/,
    'UI.createElements 未清理旧主面板，重复注入时万能查数按钮可能无响应'
  );
});

test('UI 主面板宽度拖拽监听只在拖拽期间绑定并在结束时释放', () => {
  const block = getUiBlock();
  assert.match(
    block,
    /const handlePanelResizeMove = \(e\) => \{[\s\S]*if \(!isResizing\) return;[\s\S]*panel\.style\.width = newWidth \+ 'px';[\s\S]*\};[\s\S]*const handlePanelResizeEnd = \(\) => \{[\s\S]*isResizing = false;[\s\S]*document\.body\.style\.userSelect = '';[\s\S]*document\.removeEventListener\('mousemove', handlePanelResizeMove\);[\s\S]*document\.removeEventListener\('mouseup', handlePanelResizeEnd\);[\s\S]*\};[\s\S]*resizer\.onmousedown = \(e\) => \{[\s\S]*document\.addEventListener\('mousemove', handlePanelResizeMove\);[\s\S]*document\.addEventListener\('mouseup', handlePanelResizeEnd\);/,
    '主助手面板宽度拖拽监听必须按需绑定并在 mouseup 后释放'
  );
  assert.doesNotMatch(
    block,
    /document\.addEventListener\('mousemove',\s*\(e\) => \{[\s\S]*?if \(isResizing\)/,
    '主助手面板不应在初始化时常驻匿名 mousemove 监听'
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
