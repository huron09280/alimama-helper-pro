import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, createContext } from 'node:vm';

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

function sliceBetween(block, startText, endText) {
  const start = block.indexOf(startText);
  const end = block.indexOf(endText, start + startText.length);
  assert.ok(start > -1 && end > start, `无法定位代码片段：${startText}`);
  return block.slice(start, end);
}

function createPanelAutoHideHarness(initialVisibilityState = 'visible') {
  let visibilityState = String(initialVisibilityState || 'visible');
  let nextTimerId = 1;
  const timers = new Map();
  const listeners = new Map();
  class FakeHTMLElement {
    constructor() {
      this.hover = false;
    }

    matches(selector) {
      return selector === ':hover' ? this.hover : false;
    }
  }
  const addListener = (type, handler) => {
    if (typeof handler !== 'function') return;
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(handler);
  };
  const removeListener = (type, handler) => {
    listeners.get(type)?.delete(handler);
  };
  const uiBlock = getUiBlock();
  const methodSource = sliceBetween(
    uiBlock,
    'isPanelAutoHideDocumentHidden()',
    'clearPanelIconRevealTimer()'
  );
  const context = createContext({
    HTMLElement: FakeHTMLElement,
    State: {
      config: {
        panelOpen: true
      },
      saveCount: 0,
      save() {
        this.saveCount += 1;
      }
    },
    document: {
      get visibilityState() {
        return visibilityState;
      },
      addEventListener: addListener,
      removeEventListener: removeListener
    },
    setTimeout(handler, delay = 0) {
      const timerId = nextTimerId;
      nextTimerId += 1;
      if (typeof handler === 'function') {
        timers.set(timerId, { handler, delay: Math.max(0, Number(delay) || 0) });
      }
      return timerId;
    },
    clearTimeout(timerId) {
      timers.delete(Number(timerId));
    }
  });
  new Script(`const UI = {
runtime: {
  panelAutoHideTimer: null,
  panelAutoHideVisibilityHandler: null,
  panelAutoHidePendingContext: null
},
${methodSource}
};
globalThis.__UI = UI;
globalThis.__State = State;`).runInContext(context);
  const closeCalls = [];
  const panel = new FakeHTMLElement();
  const icon = new FakeHTMLElement();
  const closePanel = (blockHoverOpen = false) => {
    closeCalls.push(blockHoverOpen);
    context.__UI.clearPanelAutoHideState();
    context.__State.config.panelOpen = false;
    context.__State.save();
  };
  return {
    context,
    timers,
    closeCalls,
    panel,
    icon,
    FakeHTMLElement,
    listenerCount(type = 'visibilitychange') {
      return listeners.get(type)?.size || 0;
    },
    getTimerDelays() {
      return Array.from(timers.values()).map(timer => timer.delay);
    },
    setVisibilityState(nextState) {
      visibilityState = String(nextState || 'visible');
      const handlers = Array.from(listeners.get('visibilitychange') || []);
      handlers.forEach(handler => handler({ type: 'visibilitychange' }));
    },
    tickNextTimer() {
      const [timerId, timer] = Array.from(timers.entries())[0] || [];
      if (!timer) return false;
      timers.delete(timerId);
      timer.handler();
      return true;
    },
    schedule(delay = 180) {
      context.__UI.schedulePanelAutoHide({ panel, icon, closePanel }, delay);
    },
    get UI() {
      return context.__UI;
    },
    get State() {
      return context.__State;
    }
  };
}

function createPanelIconRevealHarness(initialVisibilityState = 'visible') {
  let visibilityState = String(initialVisibilityState || 'visible');
  let nextTimerId = 1;
  const timers = new Map();
  const listeners = new Map();
  class FakeHTMLElement {
    constructor() {
      this.isConnected = true;
      this.style = {};
    }
  }
  const addListener = (type, handler) => {
    if (typeof handler !== 'function') return;
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(handler);
  };
  const removeListener = (type, handler) => {
    listeners.get(type)?.delete(handler);
  };
  const uiBlock = getUiBlock();
  const methodSource = sliceBetween(
    uiBlock,
    'clearPanelIconRevealTimer()',
    'isToolOpenRetryDocumentHidden()'
  );
  const context = createContext({
    HTMLElement: FakeHTMLElement,
    State: {
      config: {
        panelOpen: false
      }
    },
    document: {
      get visibilityState() {
        return visibilityState;
      },
      addEventListener: addListener,
      removeEventListener: removeListener
    },
    setTimeout(handler, delay = 0) {
      const timerId = nextTimerId;
      nextTimerId += 1;
      if (typeof handler === 'function') {
        timers.set(timerId, { handler, delay: Math.max(0, Number(delay) || 0) });
      }
      return timerId;
    },
    clearTimeout(timerId) {
      timers.delete(Number(timerId));
    }
  });
  new Script(`const UI = {
runtime: {
  panelIconRevealTimer: null,
  panelIconRevealVisibilityHandler: null,
  panelIconRevealPendingIcon: null
},
${methodSource}
};
globalThis.__UI = UI;
globalThis.__State = State;`).runInContext(context);
  return {
    context,
    timers,
    FakeHTMLElement,
    listenerCount(type = 'visibilitychange') {
      return listeners.get(type)?.size || 0;
    },
    getTimerDelays() {
      return Array.from(timers.values()).map(timer => timer.delay);
    },
    setVisibilityState(nextState) {
      visibilityState = String(nextState || 'visible');
      const handlers = Array.from(listeners.get('visibilitychange') || []);
      handlers.forEach(handler => handler({ type: 'visibilitychange' }));
    },
    tickNextTimer() {
      const [timerId, timer] = Array.from(timers.entries())[0] || [];
      if (!timer) return false;
      timers.delete(timerId);
      timer.handler();
      return true;
    },
    get UI() {
      return context.__UI;
    },
    get State() {
      return context.__State;
    }
  };
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
  assert.match(block, /popupCleanupHandlers:\s*\[\],[\s\S]*popupLifecycleToken:\s*0,[\s\S]*quickPromptResetTimer:\s*0,[\s\S]*quickPromptResetVisibilityHandler:\s*null,[\s\S]*quickPromptResetPendingButton:\s*null,[\s\S]*quickPromptResetPendingDelayMs:\s*0,[\s\S]*quickPromptRetryTimer:\s*0,[\s\S]*quickPromptRetryVisibilityHandler:\s*null,[\s\S]*quickPromptRetryPendingCallback:\s*null,[\s\S]*iframeCleanupRetryTimer:\s*0,[\s\S]*iframeCleanupVisibilityHandler:\s*null,[\s\S]*magicPromptDraft:\s*''/, 'MagicReport 未声明关闭生命周期所需状态');
  assert.match(block, /releasePopupResources\(\)\s*\{[\s\S]*this\.captureMagicPromptDraft\(\);[\s\S]*this\.popupLifecycleToken \+= 1;[\s\S]*this\.hideCrowdMatrixHoverTip\(\);[\s\S]*this\.setCrowdCampaignItemDropdownOpen\(false\);[\s\S]*this\.runPopupCleanupHandlers\(\);[\s\S]*this\.clearMagicRuntimeCaches\(\);/, 'releasePopupResources 未统一收敛浮层、监听和缓存清理');
  assert.match(block, /if \(this\.iframe instanceof HTMLIFrameElement\) \{[\s\S]*this\.iframe\.onload = null;[\s\S]*this\.iframe\.onerror = null;[\s\S]*this\.iframe\.src = 'about:blank';[\s\S]*\}/, 'releasePopupResources 未释放 iframe 子文档');
  assert.match(block, /const popup = this\.popup instanceof HTMLElement[\s\S]*document\.getElementById\('am-magic-report-popup'\);[\s\S]*if \(popup instanceof HTMLElement\) popup\.remove\(\);[\s\S]*document\.getElementById\('am-magic-report-popup-style'\);[\s\S]*if \(style instanceof HTMLElement\) style\.remove\(\);/, 'releasePopupResources 未卸载 popup DOM 或样式节点');
  assert.match(block, /this\.clearQuickPromptResetState\(\);[\s\S]*this\.clearQuickPromptRetryState\(\);[\s\S]*this\.clearIframeCleanupRetryTimer\(\);[\s\S]*this\.clearIframeCleanupVisibilityHandler\(\);/, 'clearMagicRuntimeCaches 未清理关闭后的待执行 timer、visibility handler 和 pending 状态');
  assert.doesNotMatch(block.match(/releasePopupResources\(\)\s*\{[\s\S]*?\n\s*\},\n\s*\n\s*createPopup\(/)?.[0] || '', /lastCampaignId\s*=\s*''|lastCampaignName\s*=\s*''/, '关闭释放不应清空最近计划上下文');
});

test('MagicReport 快捷查询 retry 在隐藏页暂停并保持原重试合同', () => {
  const block = getMagicReportBlock();
  const clearTimerBlock = sliceBetween(block, 'clearQuickPromptRetryTimer()', 'clearQuickPromptRetryVisibilityHandler()');
  const clearVisibilityBlock = sliceBetween(block, 'clearQuickPromptRetryVisibilityHandler()', 'clearQuickPromptRetryState()');
  const clearStateBlock = sliceBetween(block, 'clearQuickPromptRetryState()', 'bindQuickPromptRetryVisibilityHandler()');
  const visibilityBlock = sliceBetween(block, 'bindQuickPromptRetryVisibilityHandler()', 'scheduleQuickPromptRetry(callback, delayMs = 500)');
  const scheduleBlock = sliceBetween(block, 'scheduleQuickPromptRetry(callback, delayMs = 500)', 'scheduleIframeCleanupRetry(callback, delayMs = 120)');
  const runBlock = sliceBetween(block, 'runQuickPrompt(promptText)', 'buildPromptByCampaignId(campaignId, promptType =');
  assert.match(
    clearTimerBlock,
    /if \(!this\.quickPromptRetryTimer\) return;[\s\S]*clearTimeout\(this\.quickPromptRetryTimer\);[\s\S]*this\.quickPromptRetryTimer = 0;/,
    'quick prompt retry timer 缺少统一清理 helper'
  );
  assert.match(
    clearVisibilityBlock,
    /const handler = this\.quickPromptRetryVisibilityHandler;[\s\S]*document\.removeEventListener\('visibilitychange', handler\);[\s\S]*this\.quickPromptRetryVisibilityHandler = null;[\s\S]*this\.quickPromptRetryPendingCallback = null;/,
    'quick prompt retry visibility handler 缺少统一解绑和 pending 清理'
  );
  assert.match(
    clearStateBlock,
    /this\.clearQuickPromptRetryTimer\(\);[\s\S]*this\.clearQuickPromptRetryVisibilityHandler\(\);/,
    'quick prompt retry 应有统一状态清理 helper'
  );
  assert.match(
    visibilityBlock,
    /if \(typeof this\.quickPromptRetryVisibilityHandler === 'function'\) return;[\s\S]*this\.quickPromptRetryVisibilityHandler = \(\) => \{[\s\S]*if \(this\.isMagicReportDocumentHidden\(\)\) \{[\s\S]*this\.clearQuickPromptRetryTimer\(\);[\s\S]*return;[\s\S]*\}[\s\S]*const pendingCallback = this\.quickPromptRetryPendingCallback;[\s\S]*this\.clearQuickPromptRetryVisibilityHandler\(\);[\s\S]*if \(typeof pendingCallback === 'function'\) pendingCallback\(\);[\s\S]*\};[\s\S]*document\.addEventListener\('visibilitychange', this\.quickPromptRetryVisibilityHandler\);/,
    'quick prompt retry 应在隐藏时取消 timer，恢复可见后执行同一 pending callback 并释放监听'
  );
  assert.match(
    scheduleBlock,
    /this\.clearQuickPromptRetryState\(\);[\s\S]*if \(typeof callback !== 'function'\) return;[\s\S]*const normalizedDelayMs = Math\.max\(0, Number\(delayMs\) \|\| 0\);[\s\S]*this\.quickPromptRetryPendingCallback = callback;[\s\S]*this\.bindQuickPromptRetryVisibilityHandler\(\);[\s\S]*if \(this\.isMagicReportDocumentHidden\(\)\) \{[\s\S]*return;[\s\S]*\}[\s\S]*this\.quickPromptRetryTimer = setTimeout\(\(\) => \{[\s\S]*this\.quickPromptRetryTimer = 0;[\s\S]*if \(this\.isMagicReportDocumentHidden\(\)\) return;[\s\S]*const pendingCallback = this\.quickPromptRetryPendingCallback;[\s\S]*this\.clearQuickPromptRetryVisibilityHandler\(\);[\s\S]*if \(typeof pendingCallback === 'function'\) pendingCallback\(\);[\s\S]*\}, normalizedDelayMs\);/,
    'quick prompt retry 应隐藏页暂停，可见页才排 timeout，触发后只执行一次 pending callback'
  );
  assert.match(
    runBlock,
    /const maxRetries = 16;[\s\S]*const promptToken = this\.popupLifecycleToken;[\s\S]*this\.clearQuickPromptRetryState\(\);[\s\S]*const tryRun = \(retriesLeft\) => \{[\s\S]*if \(this\.isMagicReportDocumentHidden\(\)\) \{[\s\S]*this\.scheduleQuickPromptRetry\(\(\) => tryRun\(retriesLeft\), 500\);[\s\S]*return;[\s\S]*\}[\s\S]*const result = this\.trySubmitPrompt\(promptText\);[\s\S]*if \(retriesLeft <= 0\) \{[\s\S]*this\.tryFallbackSubmitPrompt\(promptText\)\.then\(\(fallbackOk\) => \{[\s\S]*this\.scheduleQuickPromptRetry\(\(\) => tryRun\(retriesLeft - 1\), 500\);[\s\S]*\};[\s\S]*tryRun\(maxRetries\);/,
    'runQuickPrompt 应隐藏页暂停同一 retries，可见页仍保留 16 次/500ms 重试和原 fallback'
  );
  assert.doesNotMatch(
    runBlock,
    /this\.quickPromptRetryTimer = setTimeout\(\(\) => \{[\s\S]*tryRun\(retriesLeft - 1\);[\s\S]*\}, 500\);/,
    'quick prompt retry 不应绕过统一 helper 直接排裸 setTimeout'
  );
});

test('MagicReport iframe 清理 retry 在隐藏页暂停并随弹窗释放', () => {
  const block = getMagicReportBlock();
  assert.match(
    block,
    /isMagicReportDocumentHidden\(\)\s*\{[\s\S]*return document\.visibilityState === 'hidden';[\s\S]*\}/,
    'MagicReport 缺少隐藏页判定'
  );
  assert.match(
    block,
    /clearIframeCleanupRetryTimer\(\)\s*\{[\s\S]*if \(!this\.iframeCleanupRetryTimer\) return;[\s\S]*clearTimeout\(this\.iframeCleanupRetryTimer\);[\s\S]*this\.iframeCleanupRetryTimer = 0;[\s\S]*\}/,
    'iframe cleanup retry timer 缺少统一清理 helper'
  );
  assert.match(
    block,
    /clearIframeCleanupVisibilityHandler\(\)\s*\{[\s\S]*if \(!this\.iframeCleanupVisibilityHandler\) return;[\s\S]*document\.removeEventListener\('visibilitychange', this\.iframeCleanupVisibilityHandler\);[\s\S]*this\.iframeCleanupVisibilityHandler = null;[\s\S]*\}/,
    'iframe cleanup visibility handler 缺少统一解绑 helper'
  );
  assert.match(
    block,
    /scheduleIframeCleanupRetry\(callback, delayMs = 120\)\s*\{[\s\S]*this\.clearIframeCleanupRetryTimer\(\);[\s\S]*if \(typeof callback !== 'function'\) return;[\s\S]*if \(this\.isMagicReportDocumentHidden\(\)\) \{[\s\S]*this\.clearIframeCleanupVisibilityHandler\(\);[\s\S]*this\.iframeCleanupVisibilityHandler = \(\) => \{[\s\S]*if \(this\.isMagicReportDocumentHidden\(\)\) return;[\s\S]*this\.clearIframeCleanupVisibilityHandler\(\);[\s\S]*callback\(\);[\s\S]*\};[\s\S]*document\.addEventListener\('visibilitychange', this\.iframeCleanupVisibilityHandler\);[\s\S]*return;[\s\S]*this\.clearIframeCleanupVisibilityHandler\(\);[\s\S]*this\.iframeCleanupRetryTimer = setTimeout\(\(\) => \{[\s\S]*this\.iframeCleanupRetryTimer = 0;[\s\S]*callback\(\);[\s\S]*\}, normalizedDelayMs\);[\s\S]*\}/,
    'iframe cleanup retry 应在隐藏页暂停，恢复可见后继续 callback，可见页才排 timeout'
  );
  assert.match(
    block,
    /const tryCleanup = \(retries = 0\) => \{[\s\S]*if \(popupToken !== this\.popupLifecycleToken\) return;[\s\S]*if \(this\.isMagicReportDocumentHidden\(\)\) \{[\s\S]*this\.scheduleIframeCleanupRetry\(\(\) => tryCleanup\(retries\), retryInterval\);[\s\S]*return;[\s\S]*\}[\s\S]*const target = iframeDoc\.getElementById\('universalBP_common_layout_main_content'\);/,
    'iframe cleanup retry 触发前应在隐藏页暂停并保留当前 retries'
  );
  assert.match(
    block,
    /this\.scheduleIframeCleanupRetry\(\(\) => tryCleanup\(retries \+ 1\), retryInterval\);/,
    'iframe cleanup 未通过统一 helper 调度下一次 retry'
  );
  assert.doesNotMatch(
    block,
    /this\.iframeCleanupRetryTimer = setTimeout\(\(\) => \{[\s\S]*tryCleanup\(retries \+ 1\);[\s\S]*\}, retryInterval\);/,
    'iframe cleanup 不应绕过 helper 直接排 120ms retry timer'
  );
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

test('UI 主面板外部点击监听和悬浮球显示 timer 按面板开关释放', () => {
  const block = getUiBlock();
  assert.match(
    block,
    /runtime:\s*\{[\s\S]*panelOutsideClickHandler:\s*null,[\s\S]*panelOutsideClickHandlerBound:\s*false,[\s\S]*panelAutoHideTimer:\s*null,[\s\S]*panelAutoHideVisibilityHandler:\s*null,[\s\S]*panelAutoHidePendingContext:\s*null,[\s\S]*panelIconRevealTimer:\s*null,[\s\S]*panelIconRevealVisibilityHandler:\s*null,[\s\S]*panelIconRevealPendingIcon:\s*null/,
    'UI runtime 缺少主面板外部点击监听、auto-hide 状态、悬浮球 timer、visibility handler 或 pending icon 状态'
  );
  assert.match(
    block,
    /isPanelAutoHideDocumentHidden\(\)\s*\{[\s\S]*return document\.visibilityState === 'hidden';[\s\S]*\}/,
    '主面板 auto-hide 缺少隐藏页判定'
  );
  assert.match(
    block,
    /clearPanelAutoHideState\(\)\s*\{[\s\S]*this\.clearPanelAutoHideTimer\(\);[\s\S]*this\.clearPanelAutoHideVisibilityHandler\(\);[\s\S]*this\.runtime\.panelAutoHidePendingContext = null;/,
    '主面板 auto-hide 应支持统一清理 timer、visibility handler 和 pending context'
  );
  assert.match(
    block,
    /bindPanelAutoHideVisibilityHandler\(\)\s*\{[\s\S]*if \(typeof this\.runtime\.panelAutoHideVisibilityHandler === 'function'\) return;[\s\S]*if \(this\.isPanelAutoHideDocumentHidden\(\)\) \{[\s\S]*this\.finishPanelAutoHide\(\);[\s\S]*document\.addEventListener\('visibilitychange', this\.runtime\.panelAutoHideVisibilityHandler\);/,
    '主面板 auto-hide 应在页面转 hidden 时完成关闭并释放 timer'
  );
  assert.match(
    block,
    /finishPanelAutoHide\(\)\s*\{[\s\S]*const context = this\.runtime\.panelAutoHidePendingContext;[\s\S]*this\.clearPanelAutoHideState\(\);[\s\S]*if \(!State\.config\.panelOpen\) return;[\s\S]*if \(!this\.isPanelAutoHideDocumentHidden\(\) && \(panel\.matches\(':hover'\) \|\| icon\.matches\(':hover'\)\)\) return;[\s\S]*closePanel\(false\);/,
    '主面板 auto-hide 触发时应释放 pending 状态、保持 hover 中不关闭，并复用既有 closePanel(false)'
  );
  assert.match(
    block,
    /schedulePanelAutoHide\(context = \{\}, delay = 180\)\s*\{[\s\S]*this\.clearPanelAutoHideState\(\);[\s\S]*this\.runtime\.panelAutoHidePendingContext = \{ panel, icon, closePanel \};[\s\S]*this\.bindPanelAutoHideVisibilityHandler\(\);[\s\S]*if \(this\.isPanelAutoHideDocumentHidden\(\)\) \{[\s\S]*this\.finishPanelAutoHide\(\);[\s\S]*return;[\s\S]*this\.runtime\.panelAutoHideTimer = setTimeout\(\(\) => \{[\s\S]*this\.runtime\.panelAutoHideTimer = null;[\s\S]*this\.finishPanelAutoHide\(\);[\s\S]*\}, Math\.max\(0, Number\(delay\) \|\| 0\)\);/,
    '主面板 auto-hide 应在可见页保留 delay，在隐藏页即时完成关闭'
  );
  assert.match(
    block,
    /clearPanelIconRevealTimer\(\)\s*\{[\s\S]*clearTimeout\(this\.runtime\.panelIconRevealTimer\);[\s\S]*this\.runtime\.panelIconRevealTimer = null;[\s\S]*this\.clearPanelIconRevealVisibilityHandler\(\);[\s\S]*this\.runtime\.panelIconRevealPendingIcon = null;/,
    '悬浮球 reveal timer 应支持显式清理 timer、visibility handler 和 pending icon'
  );
  assert.match(
    block,
    /isPanelIconRevealDocumentHidden\(\)\s*\{[\s\S]*return document\.visibilityState === 'hidden';[\s\S]*\}/,
    '悬浮球 reveal 缺少隐藏页判定'
  );
  assert.match(
    block,
    /clearPanelIconRevealVisibilityHandler\(\)\s*\{[\s\S]*document\.removeEventListener\('visibilitychange', handler\);[\s\S]*this\.runtime\.panelIconRevealVisibilityHandler = null;/,
    '悬浮球 reveal 应支持释放 visibilitychange handler'
  );
  assert.match(
    block,
    /bindPanelIconRevealVisibilityHandler\(\)\s*\{[\s\S]*if \(typeof this\.runtime\.panelIconRevealVisibilityHandler === 'function'\) return;[\s\S]*if \(this\.isPanelIconRevealDocumentHidden\(\)\) \{[\s\S]*clearTimeout\(this\.runtime\.panelIconRevealTimer\);[\s\S]*this\.runtime\.panelIconRevealTimer = null;[\s\S]*return;[\s\S]*const pendingIcon = this\.runtime\.panelIconRevealPendingIcon;[\s\S]*this\.schedulePanelIconReveal\(pendingIcon\);[\s\S]*document\.addEventListener\('visibilitychange', this\.runtime\.panelIconRevealVisibilityHandler\);/,
    '悬浮球 reveal 应在隐藏时取消 timer，恢复可见后继续同一个 pending icon'
  );
  assert.match(
    block,
    /schedulePanelIconReveal\(icon\)\s*\{[\s\S]*this\.clearPanelIconRevealTimer\(\);[\s\S]*this\.runtime\.panelIconRevealPendingIcon = icon;[\s\S]*this\.bindPanelIconRevealVisibilityHandler\(\);[\s\S]*if \(this\.isPanelIconRevealDocumentHidden\(\)\) return;[\s\S]*this\.runtime\.panelIconRevealTimer = setTimeout\(\(\) => \{[\s\S]*this\.runtime\.panelIconRevealTimer = null;[\s\S]*if \(this\.isPanelIconRevealDocumentHidden\(\)\) return;[\s\S]*const pendingIcon = this\.runtime\.panelIconRevealPendingIcon;[\s\S]*this\.clearPanelIconRevealVisibilityHandler\(\);[\s\S]*this\.runtime\.panelIconRevealPendingIcon = null;[\s\S]*if \(State\.config\.panelOpen\) return;[\s\S]*if \(!revealIcon\.isConnected\) return;[\s\S]*revealIcon\.style\.display = 'flex';[\s\S]*\}, 300\);/,
    '悬浮球 reveal timer 应隐藏页暂停，可见页触发前校验面板仍关闭且 icon 仍连接'
  );
  assert.match(
    block,
    /bindPanelOutsideClickHandler\(panel, icon, closePanel\)\s*\{[\s\S]*this\.unbindPanelOutsideClickHandler\(\);[\s\S]*this\.runtime\.panelOutsideClickHandler = \(event\) => \{[\s\S]*if \(State\.config\.panelOpen && !panel\.contains\(target\) && !icon\.contains\(target\)\) \{[\s\S]*closePanel\(false\);[\s\S]*\}[\s\S]*document\.addEventListener\('click', this\.runtime\.panelOutsideClickHandler\);[\s\S]*this\.runtime\.panelOutsideClickHandlerBound = true;/,
    '主面板外部点击监听应通过命名 handler 按需绑定'
  );
  assert.match(
    block,
    /unbindPanelOutsideClickHandler\(\)\s*\{[\s\S]*if \(!this\.runtime\.panelOutsideClickHandlerBound\) return;[\s\S]*document\.removeEventListener\('click', this\.runtime\.panelOutsideClickHandler\);[\s\S]*this\.runtime\.panelOutsideClickHandler = null;[\s\S]*this\.runtime\.panelOutsideClickHandlerBound = false;/,
    '主面板外部点击监听应支持关闭时解绑'
  );
  assert.match(
    block,
    /const openPanel = \(force = false\) => \{[\s\S]*this\.clearPanelAutoHideState\(\);[\s\S]*this\.clearPanelIconRevealTimer\(\);[\s\S]*this\.updateState\(\);[\s\S]*this\.bindPanelOutsideClickHandler\(panel, icon, closePanel\);/,
    '打开主面板时应绑定外部点击监听并清理 auto-hide/reveal timer'
  );
  assert.match(
    block,
    /const closePanel = \(blockHoverOpen = false\) => \{[\s\S]*this\.clearPanelAutoHideState\(\);[\s\S]*this\.unbindPanelOutsideClickHandler\(\);[\s\S]*State\.config\.panelOpen = false;[\s\S]*this\.updateState\(\);/,
    '关闭主面板时应解绑外部点击监听并释放 auto-hide 状态'
  );
  assert.match(
    block,
    /const scheduleAutoHide = \(delay = 180\) => \{[\s\S]*this\.schedulePanelAutoHide\(\{ panel, icon, closePanel \}, delay\);[\s\S]*\};/,
    '主面板鼠标离开应复用统一 auto-hide helper'
  );
  assert.match(
    block,
    /panel\.onmouseenter = \(\) => this\.clearPanelAutoHideState\(\);/,
    '主面板鼠标重新进入时应通过统一 helper 取消 pending auto-hide'
  );
  assert.match(
    block,
    /if \(panelOpen\) \{[\s\S]*this\.clearPanelIconRevealTimer\(\);[\s\S]*icon\.style\.display = 'none';[\s\S]*\} else \{[\s\S]*this\.unbindPanelOutsideClickHandler\(\);[\s\S]*this\.schedulePanelIconReveal\(icon\);/,
    'updateState 应在打开态清理 reveal timer，并在关闭态解绑监听后统一调度 icon 显示'
  );
  assert.doesNotMatch(
    block,
    /document\.addEventListener\('click',\s*\(e\) => \{[\s\S]*State\.config\.panelOpen[\s\S]*panel\.contains\(e\.target\)/,
    '主面板外部点击关闭不应继续使用匿名常驻 document click 监听'
  );
  assert.doesNotMatch(
    block,
    /setTimeout\(\(\) => \{ icon\.style\.display = 'flex'; \}, 300\);/,
    '悬浮球显示不应继续使用无句柄 setTimeout'
  );
  assert.doesNotMatch(
    block,
    /let autoHideTimer = null|clearAutoHideTimer\b|autoHideTimer = setTimeout/,
    '主面板 auto-hide 不应继续使用 bindEvents 局部 timer'
  );
});

test('UI 主面板 auto-hide timer 在隐藏页即时关闭并释放 pending 引用', () => {
  const visibleHarness = createPanelAutoHideHarness('visible');
  visibleHarness.schedule();
  assert.deepEqual(visibleHarness.getTimerDelays(), [180], '可见页应保留原 180ms auto-hide timeout');
  assert.equal(visibleHarness.listenerCount(), 1, '等待 auto-hide 时应监听 visibilitychange');
  assert.equal(visibleHarness.State.config.panelOpen, true, 'timeout 触发前主面板应保持打开');
  assert.equal(visibleHarness.tickNextTimer(), true, '应能触发 auto-hide timeout');
  assert.deepEqual(visibleHarness.closeCalls, [false], 'timeout 触发应复用 closePanel(false)');
  assert.equal(visibleHarness.State.config.panelOpen, false, 'auto-hide timeout 触发后应关闭主面板');
  assert.equal(visibleHarness.listenerCount(), 0, '关闭后应释放 visibilitychange');
  assert.equal(visibleHarness.UI.runtime.panelAutoHidePendingContext, null, '关闭后应释放 pending context');

  const hoverHarness = createPanelAutoHideHarness('visible');
  hoverHarness.panel.hover = true;
  hoverHarness.schedule();
  assert.equal(hoverHarness.tickNextTimer(), true, 'hover 场景应消费 auto-hide timeout');
  assert.deepEqual(hoverHarness.closeCalls, [], '面板仍 hover 时不应关闭');
  assert.equal(hoverHarness.State.config.panelOpen, true, '面板仍 hover 时应保持打开');
  assert.equal(hoverHarness.listenerCount(), 0, 'hover 分支也应释放 visibilitychange');
  assert.equal(hoverHarness.UI.runtime.panelAutoHidePendingContext, null, 'hover 分支也应释放 pending context');

  const hiddenHarness = createPanelAutoHideHarness('hidden');
  hiddenHarness.schedule();
  assert.equal(hiddenHarness.timers.size, 0, '隐藏页不应排 180ms auto-hide timeout');
  assert.deepEqual(hiddenHarness.closeCalls, [false], '隐藏页 schedule 应立即复用 closePanel(false)');
  assert.equal(hiddenHarness.State.config.panelOpen, false, '隐藏页 schedule 后应直接关闭主面板');
  assert.equal(hiddenHarness.listenerCount(), 0, '隐藏页即时关闭后不应残留 visibilitychange');
  assert.equal(hiddenHarness.UI.runtime.panelAutoHidePendingContext, null, '隐藏页即时关闭后不应残留 pending context');

  const transitionHarness = createPanelAutoHideHarness('visible');
  transitionHarness.schedule();
  assert.equal(transitionHarness.timers.size, 1, '转隐藏前应存在 pending auto-hide timeout');
  transitionHarness.setVisibilityState('hidden');
  assert.equal(transitionHarness.timers.size, 0, '可见页转隐藏时应取消 pending auto-hide timeout');
  assert.deepEqual(transitionHarness.closeCalls, [false], '转隐藏时应立即复用 closePanel(false)');
  assert.equal(transitionHarness.State.config.panelOpen, false, '转隐藏后应直接关闭主面板');
  assert.equal(transitionHarness.listenerCount(), 0, '转隐藏关闭后应释放 visibilitychange');
});

test('UI 悬浮球 reveal timer 在隐藏页暂停并恢复可见后补排', () => {
  const hiddenHarness = createPanelIconRevealHarness('hidden');
  const hiddenIcon = new hiddenHarness.FakeHTMLElement();
  hiddenHarness.UI.schedulePanelIconReveal(hiddenIcon);
  assert.equal(hiddenHarness.timers.size, 0, '隐藏页不应排 300ms reveal timeout');
  assert.equal(hiddenHarness.listenerCount(), 1, '隐藏页应保留 visibilitychange 恢复监听');
  assert.equal(hiddenHarness.UI.runtime.panelIconRevealPendingIcon, hiddenIcon, '隐藏页应保留 pending icon');

  hiddenHarness.setVisibilityState('visible');
  assert.deepEqual(hiddenHarness.getTimerDelays(), [300], '恢复可见后应按原 300ms 节奏补排 reveal timeout');
  assert.equal(hiddenHarness.listenerCount(), 1, '补排 timeout 等待期间应继续监听转隐藏');
  assert.equal(hiddenHarness.tickNextTimer(), true, '应能触发补排 reveal timeout');
  assert.equal(hiddenIcon.style.display, 'flex', '补排 timeout 触发后应显示悬浮球');
  assert.equal(hiddenHarness.listenerCount(), 0, '显示完成后应释放 visibilitychange');
  assert.equal(hiddenHarness.UI.runtime.panelIconRevealPendingIcon, null, '显示完成后应释放 pending icon');

  const visibleHarness = createPanelIconRevealHarness('visible');
  const visibleIcon = new visibleHarness.FakeHTMLElement();
  visibleHarness.UI.schedulePanelIconReveal(visibleIcon);
  assert.deepEqual(visibleHarness.getTimerDelays(), [300], '可见页应保留原 300ms reveal timeout');
  assert.equal(visibleHarness.listenerCount(), 1, '可见页等待 reveal 时应监听 visibilitychange');
  visibleHarness.setVisibilityState('hidden');
  assert.equal(visibleHarness.timers.size, 0, '可见页转隐藏时应取消已排 reveal timeout');
  assert.equal(visibleIcon.style.display, undefined, '转隐藏时不应显示悬浮球');
  assert.equal(visibleHarness.UI.runtime.panelIconRevealPendingIcon, visibleIcon, '转隐藏时应保留 pending icon');
  visibleHarness.setVisibilityState('visible');
  assert.deepEqual(visibleHarness.getTimerDelays(), [300], '再次恢复可见后应重新排原 300ms reveal timeout');
  visibleHarness.State.config.panelOpen = true;
  assert.equal(visibleHarness.tickNextTimer(), true, '面板已打开时仍应消费 reveal timeout');
  assert.equal(visibleIcon.style.display, undefined, '面板已打开时不应显示悬浮球');
  assert.equal(visibleHarness.listenerCount(), 0, '面板打开分支消费后应释放 visibilitychange');

  const clearHarness = createPanelIconRevealHarness('hidden');
  const clearIcon = new clearHarness.FakeHTMLElement();
  clearHarness.UI.schedulePanelIconReveal(clearIcon);
  clearHarness.UI.clearPanelIconRevealTimer();
  assert.equal(clearHarness.timers.size, 0, '显式清理后不应残留 reveal timeout');
  assert.equal(clearHarness.listenerCount(), 0, '显式清理后不应残留 visibilitychange');
  assert.equal(clearHarness.UI.runtime.panelIconRevealPendingIcon, null, '显式清理后不应残留 pending icon');
});

test('UI 工具按钮打开重试 timer 会按按钮维度复用并释放', () => {
  const block = getUiBlock();
  assert.match(
    block,
    /runtime:\s*\{[\s\S]*optimizerOpenRetryTimer:\s*null,[\s\S]*optimizerOpenRetryVisibilityHandler:\s*null,[\s\S]*optimizerOpenRetryPendingCallback:\s*null,[\s\S]*keywordPlanOpenRetryTimer:\s*null,[\s\S]*keywordPlanOpenRetryVisibilityHandler:\s*null,[\s\S]*keywordPlanOpenRetryPendingCallback:\s*null/,
    'UI runtime 缺少工具按钮打开重试 timer、pending callback 或 visibility handler 状态'
  );
  assert.match(
    block,
    /isToolOpenRetryDocumentHidden\(\)\s*\{[\s\S]*return document\.visibilityState === 'hidden';[\s\S]*\}/,
    '工具按钮打开重试缺少隐藏页判定'
  );
  assert.match(
    block,
    /clearOptimizerOpenRetryVisibilityHandler\(\)\s*\{[\s\S]*document\.removeEventListener\('visibilitychange', handler\);[\s\S]*this\.runtime\.optimizerOpenRetryVisibilityHandler = null;[\s\S]*this\.runtime\.optimizerOpenRetryPendingCallback = null;/,
    '算法护航打开重试应支持释放 visibility handler 与 pending callback'
  );
  assert.match(
    block,
    /bindOptimizerOpenRetryVisibilityHandler\(\)\s*\{[\s\S]*if \(typeof this\.runtime\.optimizerOpenRetryVisibilityHandler === 'function'\) return;[\s\S]*if \(this\.isToolOpenRetryDocumentHidden\(\)\) \{[\s\S]*clearTimeout\(this\.runtime\.optimizerOpenRetryTimer\);[\s\S]*this\.runtime\.optimizerOpenRetryTimer = null;[\s\S]*return;[\s\S]*\}[\s\S]*const pendingCallback = this\.runtime\.optimizerOpenRetryPendingCallback;[\s\S]*this\.clearOptimizerOpenRetryVisibilityHandler\(\);[\s\S]*if \(typeof pendingCallback === 'function'\) pendingCallback\(\);[\s\S]*document\.addEventListener\('visibilitychange', this\.runtime\.optimizerOpenRetryVisibilityHandler\);[\s\S]*\}/,
    '算法护航打开重试应在隐藏时取消 timer，恢复可见后执行同一 pending callback 并释放监听'
  );
  assert.match(
    block,
    /clearOptimizerOpenRetryTimer\(\)\s*\{[\s\S]*if \(this\.runtime\.optimizerOpenRetryTimer\) \{[\s\S]*clearTimeout\(this\.runtime\.optimizerOpenRetryTimer\);[\s\S]*this\.runtime\.optimizerOpenRetryTimer = null;[\s\S]*\}[\s\S]*this\.clearOptimizerOpenRetryVisibilityHandler\(\);/,
    '算法护航打开重试 timer 应支持显式清理并同步释放 pending visibility 状态'
  );
  assert.match(
    block,
    /scheduleOptimizerOpenRetry\(callback\)\s*\{[\s\S]*this\.clearOptimizerOpenRetryTimer\(\);[\s\S]*this\.runtime\.optimizerOpenRetryPendingCallback = callback;[\s\S]*this\.bindOptimizerOpenRetryVisibilityHandler\(\);[\s\S]*if \(this\.isToolOpenRetryDocumentHidden\(\)\) \{[\s\S]*return;[\s\S]*\}[\s\S]*this\.runtime\.optimizerOpenRetryTimer = setTimeout\(\(\) => \{[\s\S]*this\.runtime\.optimizerOpenRetryTimer = null;[\s\S]*const pendingCallback = this\.runtime\.optimizerOpenRetryPendingCallback;[\s\S]*this\.clearOptimizerOpenRetryVisibilityHandler\(\);[\s\S]*if \(typeof pendingCallback === 'function'\) pendingCallback\(\);[\s\S]*\}, 1000\);/,
    '算法护航打开重试应通过单一 timer 调度，可见页触发后只执行一次 pending callback'
  );
  assert.match(
    block,
    /clearKeywordPlanOpenRetryVisibilityHandler\(\)\s*\{[\s\S]*document\.removeEventListener\('visibilitychange', handler\);[\s\S]*this\.runtime\.keywordPlanOpenRetryVisibilityHandler = null;[\s\S]*this\.runtime\.keywordPlanOpenRetryPendingCallback = null;/,
    '组建计划打开重试应支持释放 visibility handler 与 pending callback'
  );
  assert.match(
    block,
    /bindKeywordPlanOpenRetryVisibilityHandler\(\)\s*\{[\s\S]*if \(typeof this\.runtime\.keywordPlanOpenRetryVisibilityHandler === 'function'\) return;[\s\S]*if \(this\.isToolOpenRetryDocumentHidden\(\)\) \{[\s\S]*clearTimeout\(this\.runtime\.keywordPlanOpenRetryTimer\);[\s\S]*this\.runtime\.keywordPlanOpenRetryTimer = null;[\s\S]*return;[\s\S]*\}[\s\S]*const pendingCallback = this\.runtime\.keywordPlanOpenRetryPendingCallback;[\s\S]*this\.clearKeywordPlanOpenRetryVisibilityHandler\(\);[\s\S]*if \(typeof pendingCallback === 'function'\) pendingCallback\(\);[\s\S]*document\.addEventListener\('visibilitychange', this\.runtime\.keywordPlanOpenRetryVisibilityHandler\);[\s\S]*\}/,
    '组建计划打开重试应在隐藏时取消 timer，恢复可见后执行同一 pending callback 并释放监听'
  );
  assert.match(
    block,
    /clearKeywordPlanOpenRetryTimer\(\)\s*\{[\s\S]*if \(this\.runtime\.keywordPlanOpenRetryTimer\) \{[\s\S]*clearTimeout\(this\.runtime\.keywordPlanOpenRetryTimer\);[\s\S]*this\.runtime\.keywordPlanOpenRetryTimer = null;[\s\S]*\}[\s\S]*this\.clearKeywordPlanOpenRetryVisibilityHandler\(\);/,
    '组建计划打开重试 timer 应支持显式清理并同步释放 pending visibility 状态'
  );
  assert.match(
    block,
    /scheduleKeywordPlanOpenRetry\(callback\)\s*\{[\s\S]*this\.clearKeywordPlanOpenRetryTimer\(\);[\s\S]*this\.runtime\.keywordPlanOpenRetryPendingCallback = callback;[\s\S]*this\.bindKeywordPlanOpenRetryVisibilityHandler\(\);[\s\S]*if \(this\.isToolOpenRetryDocumentHidden\(\)\) \{[\s\S]*return;[\s\S]*\}[\s\S]*this\.runtime\.keywordPlanOpenRetryTimer = setTimeout\(\(\) => \{[\s\S]*this\.runtime\.keywordPlanOpenRetryTimer = null;[\s\S]*const pendingCallback = this\.runtime\.keywordPlanOpenRetryPendingCallback;[\s\S]*this\.clearKeywordPlanOpenRetryVisibilityHandler\(\);[\s\S]*if \(typeof pendingCallback === 'function'\) pendingCallback\(\);[\s\S]*\}, 800\);/,
    '组建计划打开重试应通过单一 timer 调度，可见页触发后只执行一次 pending callback'
  );
  assert.match(
    block,
    /optBtn\.onclick = \(\) => \{[\s\S]*this\.clearOptimizerOpenRetryTimer\(\);[\s\S]*Logger\.log\('⚠️ 算法护航模块初始化中\.\.\.', true\);[\s\S]*this\.scheduleOptimizerOpenRetry\(\(\) => \{[\s\S]*alert\('算法护航模块无法加载，请刷新页面重试'\);[\s\S]*\}\);/,
    '算法护航按钮点击前应清理旧重试 timer，并通过可取消 helper 调度重试'
  );
  assert.match(
    block,
    /keywordPlanBtn\.onclick = \(\) => \{[\s\S]*this\.clearKeywordPlanOpenRetryTimer\(\);[\s\S]*Logger\.log\('⚠️ 关键词建计划模块初始化中\.\.\.', true\);[\s\S]*this\.scheduleKeywordPlanOpenRetry\(\(\) => \{[\s\S]*alert\('组建计划模块不可用，请刷新页面重试'\);[\s\S]*\}\);/,
    '组建计划按钮点击前应清理旧重试 timer，并通过可取消 helper 调度重试'
  );
  assert.doesNotMatch(
    block,
    /Logger\.log\('⚠️ 算法护航模块初始化中\.\.\.', true\);\s*setTimeout\(\(\) =>/,
    '算法护航模块初始化重试不应继续使用无句柄 setTimeout'
  );
  assert.doesNotMatch(
    block,
    /Logger\.log\('⚠️ 关键词建计划模块初始化中\.\.\.', true\);\s*setTimeout\(\(\) =>/,
    '组建计划模块初始化重试不应继续使用无句柄 setTimeout'
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
