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

function getBuildMetricPromptBlock() {
  const block = getMagicReportBlock();
  const match = block.match(/buildMetricPrompt\(\{ campaignId, metricType, itemId = '' \}\)\s*\{([\s\S]*?)\n\s*\},\n\s*\n\s*normalizeCrowdGroupName\(/);
  assert.ok(match, '无法定位 buildMetricPrompt 代码块');
  return match[1];
}

function getMagicReportMethodSlice(methodName, nextMethodName) {
  const block = getMagicReportBlock();
  const start = block.search(new RegExp(`\\n\\s*(?:async\\s+)?${methodName}\\(`));
  assert.ok(start > -1, `无法定位 ${methodName} 代码块`);
  const rest = block.slice(start);
  if (!nextMethodName) return rest;
  const end = rest.search(new RegExp(`\\n\\s*(?:async\\s+)?${nextMethodName}\\(`));
  assert.ok(end > 0, `无法定位 ${methodName} 的结束位置`);
  return rest.slice(0, end);
}

function createDmpButtonTimerHarness(initialVisibilityState = 'visible') {
  let visibilityState = String(initialVisibilityState || 'visible');
  let nextTimerId = 1;
  const timers = new Map();
  const listeners = new Map();
  const observerInstances = [];
  let mainAppRoot = { id: 'main_app' };
  const bodyRoot = { id: 'body' };
  const documentElementRoot = { id: 'documentElement' };
  class FakeMutationObserver {
    constructor(callback) {
      this.callback = callback;
      this.connected = false;
      this.root = null;
      this.options = null;
      this.observeCalls = 0;
      this.disconnectCalls = 0;
      observerInstances.push(this);
    }

    observe(root, options) {
      this.connected = true;
      this.root = root;
      this.options = options;
      this.observeCalls += 1;
    }

    disconnect() {
      this.connected = false;
      this.root = null;
      this.disconnectCalls += 1;
    }

    trigger() {
      if (!this.connected || typeof this.callback !== 'function') return;
      this.callback([{ type: 'childList' }]);
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
  const documentRef = {
    get visibilityState() {
      return visibilityState;
    },
    get body() {
      return bodyRoot;
    },
    get documentElement() {
      return documentElementRoot;
    },
    getElementById(id) {
      return id === 'main_app' ? mainAppRoot : null;
    },
    addEventListener: addListener,
    removeEventListener: removeListener
  };
  const context = createContext({
    document: documentRef,
    MutationObserver: FakeMutationObserver,
    setTimeout(handler, delay = 0) {
      const timerId = nextTimerId;
      nextTimerId += 1;
      if (typeof handler === 'function') {
        timers.set(timerId, { handler, delay: Math.max(0, Number(delay) || 0) });
      }
      return timerId;
    },
    clearTimeout(timerId) {
      timers.delete(timerId);
    }
  });
  const methodSource = [
    getMagicReportMethodSlice('clearDmpCrowdMatrixButtonTimer', 'clearDmpCrowdMatrixButtonVisibilityHandler'),
    getMagicReportMethodSlice('clearDmpCrowdMatrixButtonVisibilityHandler', 'ensureDmpCrowdMatrixButtonObserver'),
    getMagicReportMethodSlice('ensureDmpCrowdMatrixButtonObserver', 'disconnectDmpCrowdMatrixButtonObserver'),
    getMagicReportMethodSlice('disconnectDmpCrowdMatrixButtonObserver', 'connectDmpCrowdMatrixButtonObserver'),
    getMagicReportMethodSlice('connectDmpCrowdMatrixButtonObserver', 'bindDmpCrowdMatrixButtonVisibilityHandler'),
    getMagicReportMethodSlice('bindDmpCrowdMatrixButtonVisibilityHandler', 'scheduleDmpCrowdMatrixButtonEnsure'),
    getMagicReportMethodSlice('scheduleDmpCrowdMatrixButtonEnsure', 'initDmpCrowdMatrixEntry'),
    getMagicReportMethodSlice('initDmpCrowdMatrixEntry', 'getDmpVframeRegistry')
  ].join('\n');
  const runtime = new Script(`({
    dmpCrowdMatrixButtonObserver: null,
    dmpCrowdMatrixButtonObserverRoot: null,
    dmpCrowdMatrixButtonObserverConnected: false,
    dmpCrowdMatrixButtonTimer: 0,
    dmpCrowdMatrixButtonVisibilityHandler: null,
    dmpCrowdMatrixButtonEnsurePending: false,
    ensureCalls: 0,
    isMagicReportDocumentHidden() {
      return document.visibilityState === 'hidden';
    },
    isDmpItemInsightCrowdPage() {
      return true;
    },
    ensureDmpCrowdMatrixButton() {
      this.ensureCalls += 1;
      return true;
    },
    ${methodSource}
  })`).runInContext(context);
  return {
    runtime,
    timers,
    observerInstances,
    getObserver() {
      return observerInstances[0] || null;
    },
    listenerCount(type = 'visibilitychange') {
      return listeners.get(type)?.size || 0;
    },
    setMainAppRoot(root) {
      mainAppRoot = root || null;
    },
    setVisibilityState(nextState) {
      visibilityState = String(nextState || 'visible');
      const handlers = Array.from(listeners.get('visibilitychange') || []);
      handlers.forEach((handler) => handler({ type: 'visibilitychange' }));
    },
    tickTimers() {
      const entries = Array.from(timers.entries());
      entries.forEach(([timerId, timer]) => {
        if (!timers.has(timerId)) return;
        timers.delete(timerId);
        timer.handler();
      });
    },
    getTimerDelays() {
      return Array.from(timers.values()).map((timer) => timer.delay);
    }
  };
}

function createDmpDropdownPositionHarness(initialVisibilityState = 'visible', options = {}) {
  let visibilityState = String(initialVisibilityState || 'visible');
  let nextFrameId = 1;
  let nextTimerId = 1;
  const frames = new Map();
  const timers = new Map();
  const listeners = new Map();
  class FakeHTMLElement {
    constructor() {
      this.removed = false;
    }

    remove() {
      this.removed = true;
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
  const context = createContext({
    HTMLElement: FakeHTMLElement,
    document: {
      get visibilityState() {
        return visibilityState;
      },
      addEventListener: addListener,
      removeEventListener: removeListener
    },
    requestAnimationFrame: options.noRaf
      ? undefined
      : (handler) => {
          const frameId = nextFrameId;
          nextFrameId += 1;
          if (typeof handler === 'function') frames.set(frameId, handler);
          return frameId;
        },
    cancelAnimationFrame: options.noRaf
      ? undefined
      : (frameId) => {
          frames.delete(Number(frameId));
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
  const methodSource = [
    getMagicReportMethodSlice('removeDmpCrowdPropertyDropdownPortal', 'clearDmpCrowdPropertyDropdownPositionFrame'),
    getMagicReportMethodSlice('clearDmpCrowdPropertyDropdownPositionFrame', 'clearDmpCrowdPropertyDropdownPositionVisibilityHandler'),
    getMagicReportMethodSlice('clearDmpCrowdPropertyDropdownPositionVisibilityHandler', 'clearDmpCrowdPropertyDropdownPositionState'),
    getMagicReportMethodSlice('clearDmpCrowdPropertyDropdownPositionState', 'bindDmpCrowdPropertyDropdownPositionVisibilityHandler'),
    getMagicReportMethodSlice('bindDmpCrowdPropertyDropdownPositionVisibilityHandler', 'scheduleDmpCrowdPropertyDropdownPositionUpdate'),
    getMagicReportMethodSlice('scheduleDmpCrowdPropertyDropdownPositionUpdate', 'getDmpCrowdDropdownViewModel'),
    getMagicReportMethodSlice('clearMagicRuntimeCaches', 'releasePopupResources')
  ].join('\n');
  const runtime = new Script(`({
    dmpCrowdPropertyDropdownMetric: 'click',
    dmpCrowdPropertyDropdownChannelKey: 'all',
    dmpCrowdPropertyDropdownPortalEl: new HTMLElement(),
    dmpCrowdPropertyDropdownPositionFrame: 0,
    dmpCrowdPropertyDropdownPositionCancel: null,
    dmpCrowdPropertyDropdownPositionVisibilityHandler: null,
    dmpCrowdPropertyDropdownPositionPending: false,
    positionCalls: 0,
    crowdMatrixRunId: 0,
    crowdMatrixLoading: false,
    crowdMatrixProgress: 0,
    crowdMatrixLoadedCampaignId: '',
    crowdMatrixDataset: null,
    crowdMatrixResultMap: null,
    crowdMatrixPendingMetricReload: null,
    crowdMatrixGroupSortModeMap: {},
    crowdMatrixTaskProgressHandler: null,
    crowdInsightRunContext: null,
    crowdAuthParamsCache: null,
    crowdRequestSlotPromise: null,
    crowdRequestLastAt: 0,
    crowdCampaignItemIdMap: new Map(),
    crowdCampaignItemOptionsMap: new Map(),
    crowdCampaignSelectedItemIdMap: new Map(),
    crowdCampaignManualItemSelectionMap: new Map(),
    quickPromptResetTimer: 0,
    isMagicReportDocumentHidden() {
      return document.visibilityState === 'hidden';
    },
    positionDmpCrowdPropertyDropdownPortal() {
      this.positionCalls += 1;
    },
    clearCrowdMatrixStateHideState() {},
    clearCrowdMatrixBarAnimation() {},
    clearQuickPromptResetState() {},
    clearQuickPromptRetryState() {},
    clearIframeCleanupRetryTimer() {},
    clearIframeCleanupVisibilityHandler() {},
    ${methodSource}
  })`).runInContext(context);
  return {
    runtime,
    frames,
    timers,
    FakeHTMLElement,
    listenerCount(type = 'visibilitychange') {
      return listeners.get(type)?.size || 0;
    },
    setVisibilityState(nextState) {
      visibilityState = String(nextState || 'visible');
      const handlers = Array.from(listeners.get('visibilitychange') || []);
      handlers.forEach((handler) => handler({ type: 'visibilitychange' }));
    },
    tickNextFrame() {
      const [frameId, handler] = Array.from(frames.entries())[0] || [];
      if (typeof handler !== 'function') return false;
      frames.delete(frameId);
      handler();
      return true;
    },
    tickNextTimer() {
      const [timerId, timer] = Array.from(timers.entries())[0] || [];
      if (!timer) return false;
      timers.delete(timerId);
      timer.handler();
      return true;
    },
    getTimerDelays() {
      return Array.from(timers.values()).map((timer) => timer.delay);
    }
  };
}

function createCrowdMatrixStateHideHarness(initialVisibilityState = 'visible') {
  let visibilityState = String(initialVisibilityState || 'visible');
  let nextTimerId = 1;
  const timers = new Map();
  const listeners = new Map();
  class FakeHTMLElement {
    constructor() {
      this.className = '';
      this.style = {
        values: new Map(),
        setProperty: (name, value) => {
          this.style.values.set(String(name), String(value));
        }
      };
      this.children = [];
      this.textContent = '';
      this.classList = {
        values: new Set(),
        add: (...names) => {
          names.forEach((name) => this.classList.values.add(String(name)));
        },
        remove: (...names) => {
          names.forEach((name) => this.classList.values.delete(String(name)));
        },
        contains: (name) => this.classList.values.has(String(name))
      };
    }

    replaceChildren(...children) {
      this.children = children;
    }
  }
  const matrixStateEl = new FakeHTMLElement();
  const matrixRetryBtn = new FakeHTMLElement();
  const addListener = (type, handler) => {
    if (typeof handler !== 'function') return;
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(handler);
  };
  const removeListener = (type, handler) => {
    listeners.get(type)?.delete(handler);
  };
  const documentRef = {
    get visibilityState() {
      return visibilityState;
    },
    createElement() {
      return new FakeHTMLElement();
    },
    addEventListener: addListener,
    removeEventListener: removeListener
  };
  const context = createContext({
    document: documentRef,
    HTMLElement: FakeHTMLElement,
    matrixStateEl,
    matrixRetryBtn,
    setTimeout(handler, delay = 0) {
      const timerId = nextTimerId;
      nextTimerId += 1;
      if (typeof handler === 'function') {
        timers.set(timerId, { handler, delay: Math.max(0, Number(delay) || 0) });
      }
      return timerId;
    },
    clearTimeout(timerId) {
      timers.delete(timerId);
    }
  });
  const methodSource = [
    getMagicReportMethodSlice('isMagicReportDocumentHidden', 'clearIframeCleanupRetryTimer'),
    getMagicReportMethodSlice('clearCrowdMatrixStateHideTimer', 'clearCrowdMatrixStateHideVisibilityHandler'),
    getMagicReportMethodSlice('clearCrowdMatrixStateHideVisibilityHandler', 'clearCrowdMatrixStateHideState'),
    getMagicReportMethodSlice('clearCrowdMatrixStateHideState', 'bindCrowdMatrixStateHideVisibilityHandler'),
    getMagicReportMethodSlice('bindCrowdMatrixStateHideVisibilityHandler', 'scheduleCrowdMatrixStateAutoHide'),
    getMagicReportMethodSlice('scheduleCrowdMatrixStateAutoHide', 'setCrowdMatrixStatus'),
    getMagicReportMethodSlice('setCrowdMatrixStatus', 'ensureCrowdMatrixHoverTip'),
    getMagicReportMethodSlice('clearMagicRuntimeCaches', 'releasePopupResources')
  ].join('\n');
  const runtime = new Script(`({
    matrixStateEl,
    matrixRetryBtn,
    crowdMatrixProgress: 0,
    crowdMatrixRunId: 0,
    crowdMatrixLoading: false,
    crowdMatrixStateHideTimer: null,
    crowdMatrixStateHideVisibilityHandler: null,
    crowdMatrixStateHidePendingDelayMs: null,
    crowdMatrixLoadedCampaignId: '',
    crowdMatrixDataset: null,
    crowdMatrixResultMap: null,
    crowdMatrixPendingMetricReload: null,
    crowdMatrixGroupSortModeMap: {},
    crowdMatrixTaskProgressHandler: null,
    crowdInsightRunContext: null,
    crowdAuthParamsCache: null,
    crowdRequestSlotPromise: null,
    crowdRequestLastAt: 0,
    crowdCampaignItemIdMap: new Map(),
    crowdCampaignItemOptionsMap: new Map(),
    crowdCampaignSelectedItemIdMap: new Map(),
    crowdCampaignManualItemSelectionMap: new Map(),
    quickPromptResetTimer: 0,
    clearCrowdMatrixBarAnimation() {},
    clearQuickPromptResetState() {},
    clearQuickPromptRetryState() {},
    clearIframeCleanupRetryTimer() {},
    clearIframeCleanupVisibilityHandler() {},
    removeDmpCrowdPropertyDropdownPortal() {},
    clearDmpCrowdMatrixButtonTimer() {},
    clearDmpCrowdMatrixButtonVisibilityHandler() {},
    ${methodSource}
  })`).runInContext(context);
  return {
    runtime,
    matrixStateEl,
    timers,
    listenerCount(type = 'visibilitychange') {
      return listeners.get(type)?.size || 0;
    },
    setVisibilityState(nextState) {
      visibilityState = String(nextState || 'visible');
      const handlers = Array.from(listeners.get('visibilitychange') || []);
      handlers.forEach((handler) => handler({ type: 'visibilitychange' }));
    },
    tickNextTimer() {
      const [timerId, timer] = Array.from(timers.entries())[0] || [];
      if (!timer) return false;
      timers.delete(timerId);
      timer.handler();
      return true;
    },
    getTimerDelays() {
      return Array.from(timers.values()).map((timer) => timer.delay);
    }
  };
}

function createCrowdMatrixBarAnimationHarness(options = {}) {
  let visibilityState = String(options.visibilityState || 'visible');
  let nextFrameId = 1;
  let nextTimerId = 1;
  const frames = new Map();
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
  const documentRef = {
    get visibilityState() {
      return visibilityState;
    },
    addEventListener: addListener,
    removeEventListener: removeListener
  };
  const context = createContext({
    document: documentRef,
    HTMLElement: FakeHTMLElement,
    requestAnimationFrame: options.noRaf
      ? undefined
      : (handler) => {
          const frameId = nextFrameId;
          nextFrameId += 1;
          if (typeof handler === 'function') frames.set(frameId, handler);
          return frameId;
        },
    cancelAnimationFrame: options.noRaf
      ? undefined
      : (frameId) => {
          frames.delete(Number(frameId));
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
  const methodSource = [
    getMagicReportMethodSlice('isMagicReportDocumentHidden', 'clearIframeCleanupRetryTimer'),
    getMagicReportMethodSlice('clearCrowdMatrixBarAnimationFrame', 'clearCrowdMatrixBarAnimationVisibilityHandler'),
    getMagicReportMethodSlice('clearCrowdMatrixBarAnimationVisibilityHandler', 'clearCrowdMatrixBarAnimation'),
    getMagicReportMethodSlice('clearCrowdMatrixBarAnimation', 'flushCrowdMatrixBarAnimationQueue'),
    getMagicReportMethodSlice('flushCrowdMatrixBarAnimationQueue', 'bindCrowdMatrixBarAnimationVisibilityHandler'),
    getMagicReportMethodSlice('bindCrowdMatrixBarAnimationVisibilityHandler', 'scheduleCrowdMatrixBarAnimation'),
    getMagicReportMethodSlice('scheduleCrowdMatrixBarAnimation', 'queueCrowdMatrixBarAnimation'),
    getMagicReportMethodSlice('queueCrowdMatrixBarAnimation', 'ensureCrowdMatrixHoverTip'),
    getMagicReportMethodSlice('clearMagicRuntimeCaches', 'releasePopupResources')
  ].join('\n');
  const runtime = new Script(`({
    crowdMatrixBarAnimationFrame: 0,
    crowdMatrixBarAnimationCancel: null,
    crowdMatrixBarAnimationVisibilityHandler: null,
    crowdMatrixBarAnimationQueue: [],
    crowdMatrixRunId: 0,
    crowdMatrixLoading: false,
    crowdMatrixProgress: 0,
    clearCrowdMatrixStateHideState() {},
    clearQuickPromptResetState() {},
    clearQuickPromptRetryState() {},
    clearIframeCleanupRetryTimer() {},
    clearIframeCleanupVisibilityHandler() {},
    removeDmpCrowdPropertyDropdownPortal() {},
    clearDmpCrowdMatrixButtonTimer() {},
    clearDmpCrowdMatrixButtonVisibilityHandler() {},
    ${methodSource}
  })`).runInContext(context);
  return {
    runtime,
    frames,
    timers,
    FakeHTMLElement,
    createFill() {
      return new FakeHTMLElement();
    },
    tickNextFrame() {
      const [frameId, handler] = Array.from(frames.entries())[0] || [];
      if (typeof handler !== 'function') return false;
      frames.delete(frameId);
      handler();
      return true;
    },
    tickNextTimer() {
      const [timerId, timer] = Array.from(timers.entries())[0] || [];
      if (!timer) return false;
      timers.delete(timerId);
      timer.handler();
      return true;
    },
    getTimerDelays() {
      return Array.from(timers.values()).map((timer) => timer.delay);
    },
    listenerCount(type = 'visibilitychange') {
      return listeners.get(type)?.size || 0;
    },
    setVisibilityState(nextState) {
      visibilityState = String(nextState || 'visible');
      const handlers = Array.from(listeners.get('visibilitychange') || []);
      handlers.forEach((handler) => handler({ type: 'visibilitychange' }));
    }
  };
}

function createQuickPromptResetHarness(initialVisibilityState = 'visible') {
  let visibilityState = String(initialVisibilityState || 'visible');
  let nextTimerId = 1;
  const timers = new Map();
  const listeners = new Map();
  class FakeHTMLElement {
    constructor() {
      this.isConnected = true;
      this.attributes = new Map();
      this.classList = {
        values: new Set(),
        add: (...names) => {
          names.forEach((name) => this.classList.values.add(String(name)));
        },
        remove: (...names) => {
          names.forEach((name) => this.classList.values.delete(String(name)));
        },
        contains: (name) => this.classList.values.has(String(name))
      };
    }

    setAttribute(name, value) {
      this.attributes.set(String(name), String(value));
    }

    getAttribute(name) {
      return this.attributes.get(String(name)) || null;
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
  const documentRef = {
    get visibilityState() {
      return visibilityState;
    },
    addEventListener: addListener,
    removeEventListener: removeListener
  };
  const context = createContext({
    document: documentRef,
    HTMLElement: FakeHTMLElement,
    setTimeout(handler, delay = 0) {
      const timerId = nextTimerId;
      nextTimerId += 1;
      if (typeof handler === 'function') {
        timers.set(timerId, { handler, delay: Math.max(0, Number(delay) || 0) });
      }
      return timerId;
    },
    clearTimeout(timerId) {
      timers.delete(timerId);
    }
  });
  const methodSource = [
    getMagicReportMethodSlice('isMagicReportDocumentHidden', 'clearIframeCleanupRetryTimer'),
    getMagicReportMethodSlice('resetQuickPromptButtonPressedState', 'clearQuickPromptResetTimer'),
    getMagicReportMethodSlice('clearQuickPromptResetTimer', 'clearQuickPromptResetVisibilityHandler'),
    getMagicReportMethodSlice('clearQuickPromptResetVisibilityHandler', 'clearQuickPromptResetState'),
    getMagicReportMethodSlice('clearQuickPromptResetState', 'bindQuickPromptResetVisibilityHandler'),
    getMagicReportMethodSlice('bindQuickPromptResetVisibilityHandler', 'scheduleQuickPromptButtonReset'),
    getMagicReportMethodSlice('scheduleQuickPromptButtonReset', 'clearQuickPromptRetryVisibilityHandler'),
    getMagicReportMethodSlice('clearMagicRuntimeCaches', 'releasePopupResources')
  ].join('\n');
  const runtime = new Script(`({
    crowdMatrixRunId: 0,
    crowdMatrixLoading: false,
    crowdMatrixProgress: 0,
    crowdMatrixLoadedCampaignId: '',
    crowdMatrixDataset: null,
    crowdMatrixResultMap: null,
    crowdMatrixPendingMetricReload: null,
    crowdMatrixGroupSortModeMap: {},
    crowdMatrixTaskProgressHandler: null,
    crowdInsightRunContext: null,
    crowdAuthParamsCache: null,
    crowdRequestSlotPromise: null,
    crowdRequestLastAt: 0,
    crowdCampaignItemIdMap: new Map(),
    crowdCampaignItemOptionsMap: new Map(),
    crowdCampaignSelectedItemIdMap: new Map(),
    crowdCampaignManualItemSelectionMap: new Map(),
    quickPromptResetTimer: 0,
    quickPromptResetVisibilityHandler: null,
    quickPromptResetPendingButton: null,
    quickPromptResetPendingDelayMs: 0,
    clearCrowdMatrixStateHideState() {},
    clearCrowdMatrixBarAnimation() {},
    clearQuickPromptRetryState() {},
    clearIframeCleanupRetryTimer() {},
    clearIframeCleanupVisibilityHandler() {},
    removeDmpCrowdPropertyDropdownPortal() {},
    ${methodSource}
  })`).runInContext(context);
  return {
    runtime,
    timers,
    createButton() {
      const button = new FakeHTMLElement();
      button.classList.add('active');
      button.setAttribute('aria-pressed', 'true');
      return button;
    },
    listenerCount(type = 'visibilitychange') {
      return listeners.get(type)?.size || 0;
    },
    setVisibilityState(nextState) {
      visibilityState = String(nextState || 'visible');
      const handlers = Array.from(listeners.get('visibilitychange') || []);
      handlers.forEach((handler) => handler({ type: 'visibilitychange' }));
    },
    tickNextTimer() {
      const [timerId, timer] = Array.from(timers.entries())[0] || [];
      if (!timer) return false;
      timers.delete(timerId);
      timer.handler();
      return true;
    },
    getTimerDelays() {
      return Array.from(timers.values()).map((timer) => timer.delay);
    }
  };
}

test('MagicReport 声明人群看板固定周期/维度/指标常量', () => {
  const block = getMagicReportBlock();
  assert.match(block, /CROWD_PERIODS:\s*\[\s*3\s*,\s*7\s*,\s*30\s*,\s*90\s*\]/, '缺少 4 周期常量或顺序不符');
  assert.match(block, /CROWD_GROUP_ORDER:\s*\[\s*'消费能力等级'\s*,\s*'月均消费金额'\s*,\s*'用户年龄'\s*,\s*'用户性别'\s*,\s*'城市等级'\s*,\s*'店铺潜新老客'\s*,\s*'省份'\s*,\s*'城市'\s*\]/, '缺少 8 维度常量或顺序不符');
  assert.match(block, /CROWD_EXTRA_DIMENSION_GROUPS:\s*\[\s*'省份'\s*,\s*'城市'\s*\]/, '缺少省份/城市额外查数维度常量');
  assert.match(block, /CROWD_METRICS:\s*\[\s*'click'\s*,\s*'cart'\s*,\s*'deal'\s*,\s*'itemdeal'\s*\]/, '缺少 4 指标常量或顺序不符');
  assert.match(block, /DMP_CROWD_PERIODS:\s*\[\s*1\s*,\s*7\s*,\s*30\s*\]/, '缺少 DMP 1/7/30 周期常量');
  assert.match(block, /DMP_CROWD_METRICS:\s*\[\s*'analysis'\s*,\s*'compare'\s*\]/, '缺少 DMP 分析/对比指标常量');
});

test('MagicReport 包含人群看板核心方法与辅助方法', () => {
  const block = getMagicReportBlock();
  for (const method of [
    'queryCrowdInsight',
    'parseSseEvents',
    'extractGroupList',
    'buildMatrixDataset',
    'renderCrowdMatrixCharts',
    'renderCrowdGlobalLegend',
    'toggleCrowdMetricVisibility',
    'toggleCrowdPeriodVisibility',
    'toggleCrowdRatioVisibility',
    'toggleCrowdInsightsVisibility',
    'syncCrowdAuxiliaryVisibilityByMetricCount',
    'clearCrowdMatrixBarAnimation',
    'scheduleCrowdMatrixBarAnimation',
    'queueCrowdMatrixBarAnimation',
    'clearCrowdMatrixHoverBars',
    'getCrowdMatrixLinkedBars',
    'buildCrowdMatrixHoverMetricIndex',
    'getCrowdMatrixHoverMetricScopeMap',
    'buildCrowdMatrixHoverTipText',
    'formatCrowdMatrixHoverTipHtml',
    'activateCrowdMatrixHoverBars',
    'formatCrowdHoverPercent',
    'formatCrowdPtDiff',
    'getCrowdPeriodVisible',
    'getVisibleCrowdPeriods',
    'getCrowdRatioVisible',
    'getCrowdInsightsVisible',
    'applyCrowdMetricVisibility',
    'enableCrowdMatrixHorizontalDrag',
    'normalizeMagicView',
    'getMagicDefaultView',
    'setMagicDefaultView',
    'refreshMagicViewTabDefaultState',
    'cacheCrowdCampaignItemId',
    'getCrowdCampaignItemId',
    'getCrowdCampaignSelectedItemId',
    'setCrowdCampaignSelectedItemId',
    'collectCrowdItemSpendSummaryFromPayload',
    'queryCrowdCampaignSpendPayload',
    'refreshCrowdCampaignItemOptions',
    'refreshCrowdCampaignItemOptionsInBackground',
    'renderCrowdCampaignItemSelect',
    'maximizePopupForMatrix',
    'restorePopupFromMatrix',
    'buildMetricPrompt',
    'buildCrowdPeriodPrompt',
    'buildCrowdPanelTimeMode',
    'buildCrowdPanelQueryExecutePlan',
    'ensureCrowdInsightExtraScopeResults',
    'buildCrowdInsightPeriodResult',
    'applyCrowdInsightBackgroundScopeResult',
    'resolveCrowdItemIdByCampaign',
    'extractPanelQueryConfFromDataQuery',
    'queryPanelPeriod',
    'getCrowdMetricsForInitialLoad',
    'hasCrowdMatrixMetricResults',
    'runCrowdMatrixLoad',
    'initDmpCrowdMatrixEntry',
    'findDmpSwitchItemButton',
    'findDmpSwitchItemButtonControl',
    'syncDmpCrowdMatrixEntrySize',
    'resolveDmpCrowdRuntime',
    'resolveDmpCrowdMatrixContext',
    'normalizeDmpTagName',
    'normalizeDmpTagList',
    'normalizeDmpTagGroups',
    'queryDmpCustomPortraitGroups',
    'queryDmpAvailableCrowdProperties',
    'isDmpMultiValueGroup',
    'getDmpMultiValueGroupTitle',
    'toDmpRateNumericValue',
    'findDmpDefaultCompareProperty',
    'applyDmpDefaultCompareProperty',
    'queryDmpCrowdMatrixPeriod',
    'removeDmpCrowdPropertyDropdownPortal',
    'renderDmpCrowdPropertyDropdownPortal',
    'positionDmpCrowdPropertyDropdownPortal',
    'renderDmpCrowdMetricButtons',
    'handleDmpCrowdPropertySelect',
    'runDmpCrowdMatrixLoad',
    'openDmpCrowdMatrixPopup',
    'closeDmpCrowdMatrixPopup'
  ]) {
    assert.match(block, new RegExp(`\\b${method}\\s*\\(`), `缺少方法: ${method}`);
  }
});

test('人群看板默认仅显示加购人群，并默认显示占比/关闭提示', () => {
  const block = getMagicReportBlock();
  assert.match(block, /matrixHoverMetricIndex:\s*null/, '悬停提示指标索引缓存未初始化');
  assert.match(block, /crowdMatrixGroupSortModeMap:\s*\{\s*\}/, '省份/城市排序模式默认值未初始化为空');
  assert.match(block, /crowdMetricVisibility:\s*\{\s*click:\s*false,\s*cart:\s*true,\s*deal:\s*false,\s*itemdeal:\s*false\s*\}/, '默认人群显隐未设置为仅加购可见');
  assert.match(block, /crowdRatioVisibility:\s*true/, '默认占比显示未开启');
  assert.match(block, /crowdInsightsVisibility:\s*false/, '默认提示显示未关闭');
});

test('人群看板初次加载只请求当前可见人群，隐藏人群按需加载', () => {
  const block = getMagicReportBlock();
  assert.match(block, /getCrowdMetricsForInitialLoad\(\)\s*\{/, '缺少初次加载人群过滤方法');
  assert.match(block, /const visibleMetrics = this\.CROWD_METRICS\.filter\(metric => this\.getCrowdMetricVisible\(metric\)\);/, '初次加载未读取当前可见人群');
  assert.match(block, /return visibleMetrics\.length \? visibleMetrics : this\.CROWD_METRICS\.slice\(\);/, '初次加载缺少可见人群兜底逻辑');
  assert.match(block, /const initialMetrics = this\.getCrowdMetricsForInitialLoad\(\);/, '看板加载未使用初次加载人群列表');
  assert.match(block, /initialMetrics\.forEach\(\(metricType\) => \{[\s\S]*this\.CROWD_PERIODS\.forEach\(\(periodDays\) => \{/, '看板任务队列未按可见人群生成');
  assert.match(block, /const shouldLoadMetric = nextVisible[\s\S]*!this\.hasCrowdMatrixMetricResults\(metric\);[\s\S]*this\.reloadCrowdMatrixMetric\(\{[\s\S]*metricType:\s*metric/, '显示隐藏人群时未对缺失指标做按需加载');
});

test('四类指标 prompt 采用无时间词模板（周期通过 panelDataQuery 覆盖）', () => {
  const block = getMagicReportBlock();
  const methodBlock = getBuildMetricPromptBlock();
  assert.match(block, /promptKeyword:\s*'点击人群分析'/, '点击指标 promptKeyword 不存在');
  assert.match(block, /promptKeyword:\s*'加购人群分析'/, '加购指标 promptKeyword 不存在');
  assert.match(block, /promptKeyword:\s*'成交人群分析'/, '成交指标 promptKeyword 不存在');
  assert.match(block, /seriesLabel:\s*'商品成交人群'/, '商品成交人群指标配置不存在');
  assert.match(methodBlock, /return\s+`计划ID：\$\{id\}\s+\$\{this\.getCrowdMetricMeta\(metric\)\.promptKeyword\}`;/, 'buildMetricPrompt 未按无时间词模板构造');
  assert.match(methodBlock, /return\s+`商品ID：\$\{item\}\s+成交人群分析`;/, 'buildMetricPrompt 未按商品ID模板构造商品成交人群查询');
  assert.doesNotMatch(methodBlock, /过去\$\{/, 'buildMetricPrompt 不应直接拼接周期词');
});

test('万能查数快捷话术包含商品ID成交占比分析，并支持商品ID占位替换', () => {
  const block = getMagicReportBlock();
  assert.match(block, /icon:\s*'package'\s*,\s*label:\s*'商品ID成交'\s*,\s*value:\s*'商品ID：\{商品ID\}，成交人群在各个省份或城市的花费，再使用占比工具进行占比分析'/, '快捷话术缺少商品ID成交占比模板或线性图标');
  assert.match(block, /if \(resolved\.includes\('\{商品ID\}'\) \|\| resolved\.includes\('\{itemId\}'\)\) \{/, 'resolvePromptText 未处理商品ID占位');
  assert.match(block, /itemId = await this\.resolveCrowdItemIdByCampaign\(campaignId\);/, '商品ID占位未按计划自动补齐商品ID');
  assert.match(block, /resolved = resolved[\s\S]*replace\(\/\\\{商品ID\\\}\/g, itemId\)/, '商品ID占位未正确替换');
});

test('万能查数快捷话术补充计划ID省份/城市花费占比模板', () => {
  const block = getMagicReportBlock();
  assert.match(block, /icon:\s*'pin'\s*,\s*label:\s*'省份占比'\s*,\s*value:\s*'计划ID：\{campaignId\}，在各个省份的花费，再使用占比工具进行占比分析'/, '快捷话术缺少计划ID省份花费占比模板或线性图标');
  assert.match(block, /icon:\s*'city'\s*,\s*label:\s*'城市占比'\s*,\s*value:\s*'计划ID：\{campaignId\}，在各个城市的花费，再使用占比工具进行占比分析'/, '快捷话术缺少计划ID城市花费占比模板或线性图标');
});

test('快捷查询在 iframe 提交失败后会回退原生查数入口', () => {
  const block = getMagicReportBlock();
  assert.match(block, /async tryFallbackSubmitPrompt\(promptText\)\s*\{[\s\S]*this\.openNativeAndSubmit\(fallbackCampaignId,\s*promptText\)/, '缺少原生查数回退提交流程');
  assert.match(block, /if \(retriesLeft <= 0\) \{[\s\S]*this\.tryFallbackSubmitPrompt\(promptText\)\.then\(\(fallbackOk\) => \{/, 'runQuickPrompt 未在重试耗尽后触发原生回退');
});

test('buildCrowdDimensionPrompt 按计划ID/商品ID与省市维度构造花费占比分析话术', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const crowdLabelMap = \{\s*click:\s*'点击人群'\s*,\s*cart:\s*'加购人群'\s*,\s*deal:\s*'成交人群'\s*,\s*itemdeal:\s*'成交人群'\s*\};/, 'buildCrowdDimensionPrompt 未按指标映射点击/加购/成交人群');
  assert.match(block, /return `计划ID：\$\{id\}，\$\{crowdLabel\}在各个\$\{normalizedGroup\}的花费，再使用占比工具进行占比分析`;/, '计划ID维度话术不符合最新模板');
  assert.match(block, /return `商品ID：\$\{item\}，\$\{crowdLabel\}在各个\$\{normalizedGroup\}的花费，再使用占比工具进行占比分析`;/, '商品ID维度话术不符合最新模板');
});

test('周期覆写使用 panelDataQuery，且请求体包含 queryConf.period/queryExecutePlan/timeMode', () => {
  const block = getMagicReportBlock();
  assert.match(block, /requestCrowdApi\('\/ai\/report\/panelDataQuery\.json'/, '未调用 panelDataQuery 接口');
  assert.match(block, /const periodText = `过去\$\{days\}天`;/, '缺少周期文本变量 periodText');
  assert.match(block, /const normalizedTitle = this\.buildCrowdPeriodPrompt\(String\(title \|\| ''\)\.trim\(\),\s*days\);/, 'panelDataQuery title 未按周期改写');
  assert.match(block, /const normalizedTimeMode = this\.buildCrowdPanelTimeMode\(timeMode,\s*days\);/, 'panelDataQuery 未按周期重写 timeMode');
  assert.match(block, /const rootMode = String\(cloned\.timeMode \|\| ''\)\.trim\(\);[\s\S]*if \(!rootMode \|\| rootMode === 'noTimeMode'\) \{\s*cloned\.timeMode = 'slidedTime';/, 'timeMode 未将 noTimeMode 归一为 slidedTime');
  assert.match(block, /if \(!String\(cloned\.timeInfo \|\| ''\)\.trim\(\)\) \{\s*cloned\.timeInfo = periodText;\s*\}/, 'timeMode 缺少 timeInfo 兜底覆写');
  assert.match(block, /if \(!Array\.isArray\(cloned\.period\) \|\| !cloned\.period\.length\) \{\s*cloned\.period = \[\{\s*timeInfo:\s*periodText\s*\}\];\s*\}/, 'timeMode 缺少 period 数组兜底覆写');
  assert.match(block, /const normalizedQueryExecutePlan = this\.buildCrowdPanelQueryExecutePlan\(queryExecutePlan,\s*days\);/, 'panelDataQuery 未按周期重写 queryExecutePlan');
  assert.match(block, /title:\s*normalizedTitle/, 'query payload.title 未使用按周期改写后的标题');
  assert.match(block, /queryConf:\s*\{[\s\S]*period:\s*\[\s*\{\s*timeInfo:\s*periodText\s*\}\s*\]/, 'queryConf.period 未按周期写入');
  assert.match(block, /queryExecutePlan:\s*String\(normalizedQueryExecutePlan\s*\|\|\s*''\)\.trim\(\)/, 'queryConf 缺少按周期重写后的 queryExecutePlan');
  assert.match(block, /timeMode:\s*normalizedTimeMode/, 'queryConf.timeMode 未使用按周期重写后的值');
  assert.match(block, /timeInfo:\s*periodText/, 'queryConf 缺少 timeInfo 覆写');
  assert.match(block, /const rewritePlanString = \(value = '', depth = 0\) => \{/, 'queryExecutePlan 缺少嵌套字符串计划改写逻辑');
  assert.match(block, /const directParsed = tryParseJson\(text\);[\s\S]*rewritePlanObject\(copied,\s*depth \+ 1\)/, 'queryExecutePlan 未递归改写嵌套 JSON 字符串');
  assert.match(block, /const encodeBase64Text = \(text = ''\) => \{/, 'queryExecutePlan 缺少 UTF-8 安全 base64 编码 helper');
  assert.match(block, /const encoded = encodeBase64Text\(JSON\.stringify\(copied\)\);[\s\S]*value:\s*encoded/, 'queryExecutePlan 未使用 UTF-8 安全编码回写 base64 计划');
  assert.doesNotMatch(block, /return btoa\(JSON\.stringify\(copied\)\);/, 'queryExecutePlan 仍在直接 btoa JSON，中文会导致重写失效');
  assert.match(block, /if \(typeof node\.query === 'string'\) \{[\s\S]*this\.buildCrowdPeriodPrompt\(node\.query,\s*normalizedDays\)/, 'queryExecutePlan 未按周期改写 query 文本');
  assert.match(block, /if \(typeof node\.timeInfo === 'string' && node\.timeInfo !== periodText\) \{[\s\S]*node\.timeInfo = periodText;/, 'queryExecutePlan 未按周期同步 timeInfo');
  assert.match(block, /if \(typeof value !== 'string'\) return;[\s\S]*const rewritten = rewritePlanString\(value,\s*currentDepth\);[\s\S]*node\[key\] = rewritten\.value;/, 'queryExecutePlan 未将嵌套字符串改写结果回写到原对象');
});

test('extractGroupList 同时兼容 CHART_GROUP.groupList 与 subComponentList.properties.groupList', () => {
  const block = getMagicReportBlock();
  assert.match(block, /if \(Array\.isArray\(current\.groupList\) && current\.groupList\.length\) return current\.groupList;/, '未读取 CHART_GROUP.groupList');
  assert.match(block, /if \(Array\.isArray\(current\?\.properties\?\.groupList\) && current\.properties\.groupList\.length\) return current\.properties\.groupList;/, '未兜底读取 subComponentList.properties.groupList');
  assert.match(block, /if \(Array\.isArray\(current\.subComponentList\) && current\.subComponentList\.length\)/, '未遍历 subComponentList 进行递归兜底');
});

test('extractGroupList 兼容 pie 图结构，并支持按 fallbackGroupName 兜底分组名', () => {
  const block = getMagicReportBlock();
  assert.match(block, /extractGroupList\(componentList,\s*fallbackGroupName = ''\)/, 'extractGroupList 未声明 fallbackGroupName 参数');
  assert.match(block, /const normalizedFallbackGroup = this\.normalizeCrowdGroupName\(fallbackGroupName\);/, 'extractGroupList 未对 fallbackGroupName 做规范化');
  assert.match(block, /const chartData = Array\.isArray\(current\?\.chartData\) && current\.chartData\.length[\s\S]*?Array\.isArray\(current\?\.properties\?\.chartData\)/, 'extractGroupList 未兼容 pie chartData 结构');
  assert.match(block, /fallbackGroups\.push\(\{\s*groupName,\s*componentList:\s*\[\{\s*chartData\s*\}\]\s*\}\);/, 'extractGroupList 未将 pie 结构映射为 groupList 统一结构');
});

test('buildGroupMapFromGroupList 支持按 fallbackGroupName 兜底城市分组名', () => {
  const block = getMagicReportBlock();
  assert.match(block, /buildGroupMapFromGroupList\(groupList,\s*fallbackGroupName = ''\)/, 'buildGroupMapFromGroupList 未声明 fallbackGroupName 参数');
  assert.match(block, /const normalizedFallbackGroup = this\.normalizeCrowdGroupName\(fallbackGroupName\);/, 'buildGroupMapFromGroupList 未规范化 fallbackGroupName');
  assert.match(block, /if \(!groupName\) \{\s*groupName = normalizedFallbackGroup;\s*\}/, 'buildGroupMapFromGroupList 未在分组名缺失时使用 fallbackGroupName');
  assert.match(block, /const panelGroupMap = this\.buildGroupMapFromGroupList\(panelResult\.groupList,\s*scopeKey === 'base' \? '' : scopeKey\);/, 'panelDataQuery 结果未透传 scopeKey 兜底分组名');
  assert.match(block, /const scopeGroupMap = this\.buildGroupMapFromGroupList\(scopeGroupList,\s*scopeKey\);/, '周期直查结果未透传 scopeKey 兜底分组名');
});

test('queryCrowdInsight 采用 dataQuery 首查 + panelDataQuery 周期覆写的混合链路', () => {
  const block = getMagicReportBlock();
  assert.match(block, /requestCrowdApi\('\/ai\/report\/dataQuery\.json'/, '缺少 dataQuery 首查调用');
  assert.match(block, /itemId = \/\^\\d\{6,\}\$\/\.test\(selectedItemId\)\s*\?\s*selectedItemId\s*:\s*await this\.resolveCrowdItemIdByCampaign\(id\);/, '商品成交人群未优先使用已选商品ID并按计划识别兜底');
  assert.match(block, /throw new Error\(`未识别到计划 \$\{id\} 对应商品ID`\);/, '商品成交人群缺少商品ID识别失败提示');
  assert.match(block, /const scopePrompt = this\.buildCrowdDimensionPrompt\(\{ campaignId: id, metricType: metric, groupName, itemId \}\);/, '未按省份\/城市构造额外查数话术');
  assert.match(block, /const mergedGroupMap = this\.mergeCrowdGroupMaps\(/, '多话术结果未合并成统一 groupMap');
  assert.match(block, /scopeResultMap\[normalizedGroup\] = \{[\s\S]*panelQueryConf:\s*null/, '省份\/城市话术缺少独立 scope 容器');
  assert.match(block, /const groupList = this\.extractGroupList\(componentList,\s*scopeKey\);/, '省份\/城市首查未按 scopeKey 兜底维度名');
  assert.match(block, /const scopeGroupList = this\.extractGroupList\(scopeComponentList,\s*scopeKey\);/, '省份\/城市周期直查未按 scopeKey 兜底维度名');
  assert.match(block, /if \(days === 7\) \{[\s\S]*const sevenDayResult = this\.buildCrowdInsightPeriodResult\(baseResult,[\s\S]*return sevenDayResult;/, '7 天分支未复用首查结果并返回可后台更新的结果对象');
  assert.match(block, /const baseScopeMeta = scopeResultMap\.base;[\s\S]*throw new Error\('未获取到周期切换所需 queryExecutePlan'\);/, 'base 维度缺少 queryExecutePlan 时未快速失败');
  assert.match(block, /const baseScopeResult = await queryScopePeriod\('base',\s*baseScopeMeta\);[\s\S]*if \(baseScopeResult\?\.error\) \{[\s\S]*throw baseScopeResult\.error;/, 'base 维度周期查询失败未在并发前直接中断');
  assert.match(block, /const extraScopeEntries = scopeEntries\.filter\(\(\[scopeKey\]\) => scopeKey !== 'base'\);/, '额外维度周期查询未排除 base 独立处理');
  assert.match(block, /const panelResult = await this\.queryPanelPeriod\(/, '非 7 天分支未走 panel 周期覆写');
  assert.match(block, /fallbackGroupName:\s*scopeKey === 'base' \? '' : scopeKey/, 'panelDataQuery 周期覆写未透传 scopeKey 兜底维度名');
  assert.match(block, /mergedPeriodGroupMap = this\.mergeCrowdGroupMaps\(mergedPeriodGroupMap,\s*panelGroupMap\);/, '周期覆写结果未按维度汇总合并');
});

test('省份/城市缺少 queryExecutePlan 时会按周期直查兜底', () => {
  const block = getMagicReportBlock();
  assert.match(block, /buildCrowdPeriodPrompt\(promptText = '', periodDays = 7\)\s*\{/, '缺少按周期直查 prompt helper');
  assert.match(block, /let panelQueryConf = null;[\s\S]*?try \{[\s\S]*?panelQueryConf = this\.extractPanelQueryConfFromDataQuery\(componentList\);[\s\S]*?\} catch \{ \}/, '额外维度首查未兼容缺失 queryExecutePlan');
  assert.match(block, /if \(!panelQueryConf \|\| typeof panelQueryConf !== 'object'\) \{[\s\S]*?const scopePrompt = this\.buildCrowdPeriodPrompt\(scopeMeta\?\.prompt \|\| '', days\);[\s\S]*?requestCrowdApi\('\/ai\/report\/dataQuery\.json'/, '额外维度缺少 queryExecutePlan 时未走周期直查兜底');
});

test('itemdeal 缺少 queryExecutePlan 时会强制刷新商品ID并重试首查', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const shouldRetryByRefreshingItem = metric === 'itemdeal' && !lockToSelectedItem && \/queryExecutePlan\/\.test\(message\);/, '未按 itemdeal + queryExecutePlan 缺失条件触发重试');
  assert.match(block, /this\.resolveCrowdItemIdByCampaign\(id,\s*\{\s*preferCache:\s*false,\s*allowCacheFallback:\s*false\s*\}\)/, '缺少强制刷新商品ID重试逻辑');
  assert.match(block, /if \(!\/\^\\d\{6,\}\$\/\.test\(refreshedItemId\) \|\| refreshedItemId === itemId\) \{[\s\S]*throw err;/, '缺少无效/未变化商品ID的失败保护');
});

test('人群看板请求启用限速与重试保护，且并发由配置值控制', () => {
  const block = getMagicReportBlock();
  assert.match(block, /CROWD_REQUEST_CONCURRENCY:\s*4/, '缺少看板请求并发配置');
  assert.match(block, /CROWD_REQUEST_THROTTLE_MS:\s*340/, '缺少看板请求节流间隔配置');
  assert.match(block, /CROWD_REQUEST_MAX_ATTEMPTS:\s*3/, '缺少看板请求重试次数配置');
  assert.match(block, /await this\.acquireCrowdRequestSlot\(\);/, 'requestCrowdApi 未启用请求节流');
  assert.match(block, /for \(let attempt = 1; attempt <= maxAttempts; attempt\+\+\)/, 'requestCrowdApi 未启用重试循环');
  assert.match(block, /const canRetry = attempt < maxAttempts && this\.shouldRetryCrowdApiError\(error\);/, 'requestCrowdApi 缺少重试条件判断');
  assert.match(block, /const delayMs = this\.getCrowdRetryDelay\(attempt\);/, 'requestCrowdApi 缺少退避等待');
  assert.match(block, /runTasksWithConcurrency\(taskFns,\s*this\.CROWD_REQUEST_CONCURRENCY\)/, '看板任务并发未使用配置值');
});

test('人群看板首屏不被隐藏商品识别阻塞，且省市基础查数共享 promise', () => {
  const block = getMagicReportBlock();
  assert.match(block, /refreshCrowdCampaignItemOptionsInBackground\(campaignId,\s*options = \{\}\)\s*\{[\s\S]*this\.refreshCrowdCampaignItemOptions\(id,\s*options\)/, '缺少商品列表后台识别方法');
  assert.match(block, /if \(initialMetrics\.includes\('itemdeal'\)\) \{[\s\S]*await this\.refreshCrowdCampaignItemOptions\(id,\s*\{\s*forceRefresh:\s*forceRefreshItems\s*\}\);[\s\S]*\} else \{[\s\S]*pendingBackgroundItemRefresh = true;[\s\S]*const settled = await this\.runTasksWithConcurrency\(taskFns,\s*this\.CROWD_REQUEST_CONCURRENCY\);[\s\S]*this\.refreshCrowdCampaignItemOptionsInBackground\(id,\s*\{\s*forceRefresh:\s*forceRefreshItems,\s*idle:\s*true\s*\}\);/, '初次加载未避免非商品成交场景等待商品列表识别，或后台识别未延后到默认请求结束后的 idle 阶段');
  assert.match(block, /if \(!baseResult\.scopeResolutionPromise\) \{[\s\S]*baseResult\.scopeResolutionPromise = \(async \(\) => \{[\s\S]*const extraScopeKeys = Object\.keys\(scopeResultMap\)\.filter\(key => key !== 'base'\);[\s\S]*await Promise\.all\(extraScopeKeys\.map/, '省份/城市基础查数未用共享 promise 防重复');
  assert.match(block, /await this\.ensureCrowdInsightExtraScopeResults\(baseResult,\s*\{\s*campaignId:\s*id,\s*metricType:\s*metric\s*\}\);/, '周期查询未复用共享后的省份/城市基础查数结果');
});

test('人群看板 7 天首屏先返回基础结果，省份/城市后台补齐不阻塞首渲染', () => {
  const block = getMagicReportBlock();
  const methodBlock = getMagicReportMethodSlice('queryCrowdInsight', 'runTasksWithConcurrency');
  assert.match(methodBlock, /if \(days === 7\) \{[\s\S]*const sevenDayResult = this\.buildCrowdInsightPeriodResult\(baseResult,[\s\S]*this\.ensureCrowdInsightExtraScopeResults\(baseResult,\s*\{\s*campaignId:\s*id,\s*metricType:\s*metric\s*\}\)[\s\S]*return sevenDayResult;/, '7 天首屏未先返回基础结果或仍阻塞等待省份/城市补齐');
  assert.match(methodBlock, /sevenDayResult\.groupMap = enrichedResult\.groupMap;[\s\S]*sevenDayResult\.rawMeta = enrichedResult\.rawMeta;[\s\S]*this\.applyCrowdInsightBackgroundScopeResult\(\{[\s\S]*campaignId:\s*id,[\s\S]*runId,[\s\S]*result:\s*sevenDayResult[\s\S]*\}\);/, '7 天后台省份/城市补齐后未回写同一结果对象并触发当前看板重绘');
  assert.match(methodBlock, /if \(days === 7\)[\s\S]*return sevenDayResult;[\s\S]*await this\.ensureCrowdInsightExtraScopeResults\(baseResult,\s*\{\s*campaignId:\s*id,\s*metricType:\s*metric\s*\}\);/, '非 7 天周期仍应等待省份/城市补齐以保持完整 8 维度');
});

test('7 天省份/城市后台补齐只更新当前看板缓存并重绘', () => {
  const block = getMagicReportBlock();
  const methodBlock = getMagicReportMethodSlice('applyCrowdInsightBackgroundScopeResult', 'queryCrowdInsight');
  assert.match(methodBlock, /if \(Number\(runId\) !== Number\(this\.crowdMatrixRunId\)\) return false;/, '后台补齐未校验当前 run，可能覆盖新一轮看板');
  assert.match(methodBlock, /if \(this\.crowdMatrixLoadedCampaignId && this\.crowdMatrixLoadedCampaignId !== id\) return false;/, '后台补齐未校验当前计划 ID，可能串计划回写');
  assert.match(methodBlock, /if \(!key \|\| !this\.crowdMatrixResultMap\.has\(key\)\) return false;/, '后台补齐不应新增非当前结果项');
  assert.match(methodBlock, /const mergedResults = this\.upsertCrowdMatrixResults\(\[result\]\);[\s\S]*const dataset = this\.buildMatrixDataset\(mergedResults,\s*\{\s*groupSortModeMap:\s*this\.crowdMatrixGroupSortModeMap\s*\}\);[\s\S]*this\.crowdMatrixDataset = dataset;[\s\S]*this\.renderCrowdMatrixCharts\(dataset,\s*\{\s*progressivePeriod:\s*result\.periodDays\s*\}\);/, '后台补齐未写回 resultMap 并按新 dataset 重绘');
});

test('人群看板默认 matrix 打开时懒加载万能查数 iframe，避免点击路径抢资源', () => {
  const block = getMagicReportBlock();
  assert.match(block, /iframeLoadStarted:\s*false/, '缺少 iframe 懒加载状态');
  assert.match(block, /ensureMagicIframeLoaded\(forceReload = false\)\s*\{[\s\S]*this\.iframeLoadStarted = true;[\s\S]*this\.iframe\.src = this\.buildIframeUrl\(forceReload\);/, '缺少 iframe 懒加载入口');
  assert.match(block, /<iframe id="am-magic-iframe"\s+style="/, 'iframe 默认不应在 HTML 中设置 src');
  assert.doesNotMatch(block, /<iframe id="am-magic-iframe"[\s\S]{0,220}src="\$\{this\.buildIframeUrl\(false\)\}"/, '默认 matrix 首屏不应立即加载万能查数 iframe');
  assert.match(block, /if \(next === 'query'\) \{[\s\S]*this\.ensureMagicIframeLoaded\(false\);[\s\S]*\}/, '切到万能查数 tab 时应懒加载 iframe');
});

test('切换到人群看板会最大化弹窗，切回万能查数会恢复弹窗尺寸', () => {
  const block = getMagicReportBlock();
  assert.match(block, /if \(next === 'matrix'\) this\.maximizePopupForMatrix\(\);\s*else this\.restorePopupFromMatrix\(\);/, 'switchMagicView 未实现矩阵视图最大化/恢复逻辑');
  assert.match(block, /if \(this\.activeView === 'matrix'\) \{\s*this\.maximizePopupForMatrix\(\);\s*\}/, '窗口尺寸变化时未保持矩阵视图最大化');
});

test('万能查数弹窗默认打开人群对比看板，并支持默认 tab 持久化', () => {
  const block = getMagicReportBlock();
  assert.match(source, /magicReportDefaultView:\s*'matrix'/, '默认配置未将 magicReportDefaultView 设为 matrix');
  assert.match(block, /activeView:\s*'matrix'/, 'MagicReport 默认 activeView 未设为 matrix');
  assert.match(block, /this\.activeView = this\.getMagicDefaultView\(\);\s*this\.switchMagicView\(this\.activeView \|\| 'matrix', \{ skipLoad: true \}\);/, '弹窗初始化未按默认视图打开');
  assert.match(block, /const defaultView = this\.getMagicDefaultView\(\);\s*this\.activeView = defaultView;\s*this\.switchMagicView\(defaultView \|\| 'matrix'\);/, '弹窗打开时未按默认视图重置');
});

test('万能查数窗口动作与视图页签具备可访问语义', () => {
  const block = getMagicReportBlock();
  assert.match(block, /<button type="button" class="am-magic-window-btn" id="am-magic-refresh" title="刷新当前视图" aria-label="刷新当前视图">/, '刷新窗口动作应是有名称的 button');
  assert.match(block, /<button type="button" class="am-magic-window-btn" id="am-magic-close" title="关闭万能查数" aria-label="关闭万能查数弹窗">/, '关闭窗口动作应是有名称的 button');
  assert.doesNotMatch(block, /<span id="am-magic-(?:refresh|close)"/, '刷新/关闭窗口动作不应退回 span 控件');
  assert.match(block, /\.am-magic-window-btn:focus-visible[\s\S]*outline:\s*2px solid rgba\(37,\s*99,\s*235,\s*0\.45\)/, '窗口动作缺少可见 focus 态');
  assert.match(block, /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*#am-magic-report-popup \.am-magic-window-btn,[\s\S]*transition:\s*none !important;[\s\S]*animation:\s*none !important;/, '万能查数弹窗动效未适配减少动画');
  assert.match(block, /id="am-magic-view-tabs" role="tablist" aria-label="万能查数视图"/, '视图切换容器缺少 tablist 语义');
  assert.match(block, /id="am-magic-tab-query" data-view="query" role="tab" aria-selected="false" aria-controls="am-magic-panel-query" tabindex="-1"/, '万能查数 tab 缺少 aria-selected/controls/tabindex');
  assert.match(block, /id="am-magic-tab-matrix" data-view="matrix" role="tab" aria-selected="true" aria-controls="am-magic-panel-matrix" tabindex="0"/, '人群看板 tab 缺少 aria-selected/controls/tabindex');
  assert.match(block, /id="am-magic-panel-query" data-view-panel="query" role="tabpanel" aria-labelledby="am-magic-tab-query" aria-hidden="true" tabindex="0"/, '万能查数 panel 缺少 tabpanel 关联');
  assert.match(block, /id="am-magic-panel-matrix" data-view-panel="matrix" role="tabpanel" aria-labelledby="am-magic-tab-matrix" aria-hidden="false" tabindex="0"/, '人群看板 panel 缺少 tabpanel 关联');
  assert.match(block, /node\.setAttribute\('aria-selected', selected \? 'true' : 'false'\);[\s\S]*node\.tabIndex = selected \? 0 : -1;/, '切换视图时未同步 tab aria-selected 与 tabindex');
  assert.match(block, /this\.queryPanelEl\.setAttribute\('aria-hidden', active \? 'false' : 'true'\);[\s\S]*this\.matrixPanelEl\.setAttribute\('aria-hidden', active \? 'false' : 'true'\);/, '切换视图时未同步 panel aria-hidden');
  assert.match(block, /this\.viewTabsEl\.addEventListener\('keydown'[\s\S]*\['ArrowLeft', 'ArrowRight', 'Home', 'End'\][\s\S]*nextTab\.focus\(\{ preventScroll: true \}\);[\s\S]*this\.switchMagicView\(nextTab\.dataset\.view \|\| 'matrix'\);/, '视图页签缺少键盘左右/Home/End 切换');
});

test('万能查数头部与人群看板顶部控制区收敛到统一浅玻璃 token', () => {
  const block = getMagicReportBlock();
  assert.match(
    block,
    /#am-magic-report-popup \.am-magic-header \{[\s\S]*?background:\s*var\(--am26-surface-strong\);[\s\S]*?backdrop-filter:\s*blur\(18px\) saturate\(1\.28\);[\s\S]*?box-shadow:\s*inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.54\), 0 6px 18px rgba\(31,\s*53,\s*109,\s*0\.06\);/,
    '万能查数头部未使用统一浅玻璃表面 token'
  );
  assert.match(
    block,
    /#am-magic-report-popup \.am-magic-header \.am-btn-group \{[\s\S]*?border:\s*1px solid var\(--am26-border\);[\s\S]*?background:\s*var\(--am26-surface\);[\s\S]*?box-shadow:\s*inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.52\), 0 4px 12px rgba\(31,\s*53,\s*109,\s*0\.05\);/,
    '窗口动作组未收敛为统一浅玻璃工具组'
  );
  assert.match(
    block,
    /#am-magic-report-popup \.am-magic-header \.am-magic-view-tabs \{[\s\S]*?background:\s*var\(--am26-surface\);[\s\S]*?border:\s*1px solid var\(--am26-border\);[\s\S]*?backdrop-filter:\s*blur\(10px\) saturate\(1\.18\);/,
    '万能查数页签容器未使用统一 token'
  );
  assert.match(
    block,
    /#am-magic-report-popup \.am-crowd-matrix-campaign \{[\s\S]*?display:\s*grid;[\s\S]*?grid-template-columns:\s*minmax\(180px,\s*1fr\) minmax\(118px,\s*max-content\) minmax\(220px,\s*1\.1fr\);[\s\S]*?justify-items:\s*start;[\s\S]*?text-align:\s*left;/,
    '计划信息胶囊未使用左对齐三列布局'
  );
  assert.match(
    block,
    /#am-magic-report-popup \.am-crowd-matrix-campaign \{[\s\S]*?background:\s*var\(--am26-surface\);[\s\S]*?border:\s*1px solid var\(--am26-border\);[\s\S]*?overflow:\s*visible;/,
    '计划信息胶囊未使用统一 token 或未保留商品下拉弹出空间'
  );
  assert.match(
    block,
    /#am-magic-report-popup \.am-crowd-matrix-campaign-part \{[\s\S]*?width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?overflow:\s*hidden;[\s\S]*?text-overflow:\s*ellipsis;[\s\S]*?white-space:\s*nowrap;[\s\S]*?text-align:\s*left;/,
    '计划信息长文本缺少省略保护'
  );
  assert.match(
    block,
    /#am-magic-report-popup\.is-dmp-crowd-mode \.am-crowd-matrix-campaign \{[\s\S]*?display:\s*flex;[\s\S]*?flex-wrap:\s*nowrap;[\s\S]*?gap:\s*6px;[\s\S]*?flex:\s*0 1 auto;[\s\S]*?max-width:\s*100%;/,
    'DMP 商品信息条未使用单行紧凑 flex 布局'
  );
  assert.match(
    block,
    /#am-magic-report-popup\.is-dmp-crowd-mode \.am-crowd-matrix-campaign-part\[data-crowd-campaign-name\] \{[\s\S]*?flex:\s*0 1 auto;[\s\S]*?max-width:\s*max\(180px,\s*calc\(100% - var\(--am-dmp-item-id-width,\s*132px\) - 10px\)\);[\s\S]*?#am-magic-report-popup\.is-dmp-crowd-mode \.am-crowd-matrix-campaign-part\[data-crowd-campaign-id\] \{[\s\S]*?flex:\s*0 0 auto;[\s\S]*?width:\s*max-content;/,
    'DMP 商品ID未固定贴在商品名右侧'
  );
  assert.match(
    block,
    /#am-magic-report-popup \.am-crowd-matrix-toolbar \{[\s\S]*?border:\s*1px solid var\(--am26-border\);[\s\S]*?background:\s*var\(--am26-surface\);[\s\S]*?backdrop-filter:\s*blur\(10px\) saturate\(1\.12\);/,
    '看板工具栏未使用统一浅玻璃容器'
  );
  assert.match(
    block,
    /#am-magic-report-popup \.am-crowd-matrix-legend-group \{[\s\S]*?border:\s*1px solid var\(--am26-border\);[\s\S]*?background:\s*var\(--am26-surface-strong\);[\s\S]*?border-radius:\s*999px;/,
    '图例分组未使用统一胶囊控制组'
  );
  assert.match(
    block,
    /#am-magic-report-popup \.am-crowd-matrix-retry \{[\s\S]*?border:\s*1px solid var\(--am26-border\);[\s\S]*?color:\s*var\(--am26-primary\);[\s\S]*?transition:\s*background 0\.2s ease, border-color 0\.2s ease, color 0\.2s ease, box-shadow 0\.2s ease, transform 0\.2s ease;/,
    '重试按钮未使用统一按钮边框、语义色或明确 transition'
  );
  assert.match(
    block,
    /#am-magic-report-popup \.am-crowd-matrix-retry:hover,[\s\S]*?#am-magic-report-popup \.am-crowd-matrix-retry:focus-visible \{[\s\S]*?color:\s*var\(--am26-primary-strong\);[\s\S]*?transform:\s*translateY\(-1px\);/,
    '重试按钮 hover/focus 未使用克制反馈'
  );
  assert.doesNotMatch(
    block,
    /#am-magic-report-popup \.am-magic-header \.am-btn-group \{[\s\S]*?border-left:\s*1px solid rgba\(0,\s*0,\s*0,\s*0\.06\)/,
    '窗口动作组不应保留旧左分割线样式'
  );
});

test('商品ID候选弹层使用 body portal 高层级定位，避免被工具条遮挡点击', () => {
  const block = getMagicReportBlock();
  assert.match(block, /matrixCampaignItemDropdownHomeEl:\s*null/, '商品ID弹层缺少原始宿主记录状态');
  assert.match(block, /mountCrowdCampaignItemDropdownPortal\(\)\s*\{[\s\S]*document\.body\.appendChild\(this\.matrixCampaignItemDropdownEl\);[\s\S]*this\.matrixCampaignItemDropdownEl\.classList\.add\('is-body-portal'\);/, '商品ID弹层打开时未挂到 body 级 portal');
  assert.match(block, /restoreCrowdCampaignItemDropdownHome\(\)\s*\{[\s\S]*homeEl\.appendChild\(this\.matrixCampaignItemDropdownEl\);[\s\S]*this\.matrixCampaignItemDropdownEl\.classList\.remove\('is-body-portal'\);/, '商品ID弹层关闭时未还原到原宿主');
  assert.match(block, /if \(next\) \{[\s\S]*this\.mountCrowdCampaignItemDropdownPortal\(\);[\s\S]*this\.matrixCampaignItemDropdownEl\.classList\.toggle\('is-open', next\);/, '商品ID弹层打开时未先挂载 portal 或未同步独立打开态');
  assert.match(block, /positionCrowdCampaignItemDropdown\(\)\s*\{[\s\S]*const triggerRect = this\.matrixCampaignItemTriggerEl\.getBoundingClientRect\(\);/, '商品ID弹层缺少基于触发器的定位方法');
  assert.match(block, /const availableWidth = Math\.max\(80,\s*viewportWidth - gutter \* 2\);[\s\S]*const dropdownWidth = Math\.min\([\s\S]*420,[\s\S]*Math\.max\(260,\s*Math\.round\(triggerRect\.width \|\| 0\)\),[\s\S]*availableWidth[\s\S]*\);/, '商品ID弹层宽度未按视口与触发器约束计算');
  assert.doesNotMatch(block, /getCrowdCampaignItemDropdownBaseRect\(\)/, 'body portal 后不应继续依赖内部 fixed containing block 偏移纠偏');
  assert.match(block, /this\.mountCrowdCampaignItemDropdownPortal\(\);[\s\S]*this\.matrixCampaignItemDropdownEl\.style\.left = `\$\{Math\.round\(left\)\}px`;/, '商品ID弹层未使用 body portal 视口坐标写入 fixed left');
  assert.match(block, /this\.matrixCampaignItemDropdownEl\.style\.width = `\$\{dropdownWidth\}px`;/, '商品ID弹层未写入 fixed width');
  assert.match(block, /this\.matrixCampaignItemDropdownEl\.style\.maxHeight = `\$\{maxHeight\}px`;/, '商品ID弹层未写入可用高度');
  assert.match(block, /const measuredHeight = Math\.min\([\s\S]*this\.matrixCampaignItemDropdownEl\.getBoundingClientRect\(\)\.height[\s\S]*const top = openAbove[\s\S]*triggerRect\.top - measuredHeight - 6[\s\S]*triggerRect\.bottom \+ 6/, '商品ID弹层没有按实际高度选择向上或向下展开');
  assert.match(block, /this\.matrixCampaignItemDropdownEl\.style\.top = `\$\{Math\.round\(top\)\}px`;/, '商品ID弹层未使用 body portal 视口坐标写入 fixed top');
  assert.match(block, /body > \.am-crowd-matrix-item-dropdown \{[\s\S]*?position:\s*fixed;[\s\S]*?z-index:\s*2147483647;[\s\S]*?pointer-events:\s*auto;[\s\S]*?overscroll-behavior:\s*contain;/, '商品ID弹层 CSS 未覆盖 body portal 或层级仍可能被遮挡');
  assert.match(block, /\.am-crowd-matrix-item-dropdown\.is-open \{[\s\S]*?display:\s*block;/, 'body portal 弹层缺少独立打开态 display 规则');
  assert.match(block, /this\.positionCrowdCampaignItemDropdown\(\);[\s\S]*const options = this\.getCrowdCampaignItemOptionNodes\(\);/, '打开商品ID弹层时未立即定位');
  assert.match(block, /this\.matrixCampaignItemDropdownEl\.addEventListener\('click', \(e\) => \{[\s\S]*target\.closest\('\[data-crowd-item-id\]'\)[\s\S]*this\.handleCrowdCampaignItemSelect\(optionItemId\);/, '商品ID弹层挂到 body 后缺少 listbox 自有选项点击事件');
  assert.match(block, /const inItemDropdown = this\.matrixCampaignItemDropdownEl instanceof HTMLElement && this\.matrixCampaignItemDropdownEl\.contains\(target\);[\s\S]*if \(!inItemSelect && !inItemDropdown\) \{[\s\S]*this\.setCrowdCampaignItemDropdownOpen\(false\);/, 'document 点击关闭逻辑未排除 body portal 弹层内部点击');
  assert.match(block, /this\.popupDropdownPositionHandler = \(\) => this\.requestCrowdCampaignItemDropdownPositionUpdate\(\);[\s\S]*document\.addEventListener\('scroll', this\.popupDropdownPositionHandler, true\);/, '商品ID弹层未在页面滚动时重新定位');
});

test('万能查数快捷话术按钮具备焦点与临时激活语义', () => {
  const block = getMagicReportBlock();
  const resetStateBlock = getMagicReportMethodSlice('clearQuickPromptResetState', 'bindQuickPromptResetVisibilityHandler');
  const resetVisibilityBlock = getMagicReportMethodSlice('bindQuickPromptResetVisibilityHandler', 'scheduleQuickPromptButtonReset');
  const resetScheduleBlock = getMagicReportMethodSlice('scheduleQuickPromptButtonReset', 'clearQuickPromptRetryVisibilityHandler');
  const clickBlock = getMagicReportMethodSlice('createPopup', 'toggle');
  assert.match(block, /btn\.setAttribute\('aria-label', `快捷话术：\$\{label\}`\);/, '快捷话术缺少稳定 aria-label');
  assert.match(block, /btn\.setAttribute\('aria-pressed', 'false'\);/, '快捷话术初始化缺少 aria-pressed=false');
  assert.match(
    block,
    /quickPromptResetTimer:\s*0,[\s\S]*quickPromptResetVisibilityHandler:\s*null,[\s\S]*quickPromptResetPendingButton:\s*null,[\s\S]*quickPromptResetPendingDelayMs:\s*0,/,
    '快捷话术 reset 缺少 timer、visibility handler、pending button 或 pending delay 状态'
  );
  assert.match(
    getMagicReportMethodSlice('resetQuickPromptButtonPressedState', 'clearQuickPromptResetTimer'),
    /if \(!\(button instanceof HTMLElement\) \|\| !button\.isConnected\) return;[\s\S]*button\.classList\.remove\('active'\);[\s\S]*button\.setAttribute\('aria-pressed', 'false'\);/,
    '快捷话术 reset 应统一复位 active 和 aria-pressed'
  );
  assert.match(
    resetStateBlock,
    /this\.clearQuickPromptResetTimer\(\);[\s\S]*this\.clearQuickPromptResetVisibilityHandler\(\);[\s\S]*this\.quickPromptResetPendingButton = null;[\s\S]*this\.quickPromptResetPendingDelayMs = 0;/,
    '快捷话术 reset 应统一清理 timer、visibility、pending button 和 pending delay'
  );
  assert.match(
    resetVisibilityBlock,
    /if \(typeof this\.quickPromptResetVisibilityHandler === 'function'\) return;[\s\S]*if \(this\.isMagicReportDocumentHidden\(\)\) \{[\s\S]*this\.clearQuickPromptResetTimer\(\);[\s\S]*return;[\s\S]*const pendingButton = this\.quickPromptResetPendingButton;[\s\S]*const pendingDelayMs = this\.quickPromptResetPendingDelayMs;[\s\S]*this\.scheduleQuickPromptButtonReset\(pendingButton, pendingDelayMs\);[\s\S]*document\.addEventListener\('visibilitychange', this\.quickPromptResetVisibilityHandler\);/,
    '快捷话术 reset 应在隐藏时取消 timer，恢复可见后继续同一个 pending button/delay'
  );
  assert.match(
    resetScheduleBlock,
    /this\.clearQuickPromptResetState\(\);[\s\S]*if \(!\(button instanceof HTMLElement\) \|\| !button\.isConnected\) return;[\s\S]*const normalizedDelayMs = Math\.max\(0, Number\(delayMs\) \|\| 1200\);[\s\S]*this\.quickPromptResetPendingButton = button;[\s\S]*this\.quickPromptResetPendingDelayMs = normalizedDelayMs;[\s\S]*this\.bindQuickPromptResetVisibilityHandler\(\);[\s\S]*if \(this\.isMagicReportDocumentHidden\(\)\) return;[\s\S]*this\.quickPromptResetTimer = setTimeout\(\(\) => \{[\s\S]*this\.quickPromptResetTimer = 0;[\s\S]*if \(this\.isMagicReportDocumentHidden\(\)\) return;[\s\S]*this\.resetQuickPromptButtonPressedState\(pendingButton\);[\s\S]*this\.clearQuickPromptResetVisibilityHandler\(\);[\s\S]*this\.quickPromptResetPendingButton = null;[\s\S]*this\.quickPromptResetPendingDelayMs = 0;[\s\S]*\}, normalizedDelayMs\);/,
    '快捷话术 reset 应隐藏页暂停，可见页按原 delay 调度，并在触发前复核隐藏态'
  );
  assert.match(
    clickBlock,
    /quickPrompts\.querySelectorAll\('\.am-quick-prompt'\)\.forEach\(\(node\) => \{[\s\S]*node\.setAttribute\('aria-pressed', 'false'\);[\s\S]*\}\);[\s\S]*btn\.setAttribute\('aria-pressed', 'true'\);[\s\S]*this\.scheduleQuickPromptButtonReset\(btn, 1200\);[\s\S]*const promptText = await this\.resolvePromptText\(promptItem\);/,
    '快捷话术点击时应先同步临时 aria-pressed，再通过统一 helper 延迟复位'
  );
  assert.match(
    getMagicReportMethodSlice('clearMagicRuntimeCaches', 'releasePopupResources'),
    /this\.clearQuickPromptResetState\(\);/,
    '清理 MagicReport 运行态时必须释放快捷话术 reset timer、visibility 和 pending'
  );
  assert.doesNotMatch(
    clickBlock,
    /this\.quickPromptResetTimer = setTimeout\(\(\) => \{[\s\S]*btn\.classList\.remove\('active'\);/,
    '快捷话术点击不应绕过统一 helper 直接排裸 reset timeout'
  );
  assert.match(block, /\.am-quick-prompt:focus-visible[\s\S]*outline:\s*2px solid rgba\(37,\s*99,\s*235,\s*0\.45\)/, '快捷话术缺少可见 focus 态');
});

test('万能查数快捷话术按钮 reset timer 在隐藏页暂停并恢复可见后补排', () => {
  const hiddenHarness = createQuickPromptResetHarness('hidden');
  const hiddenButton = hiddenHarness.createButton();
  hiddenHarness.runtime.scheduleQuickPromptButtonReset(hiddenButton, 1200);
  assert.equal(hiddenHarness.timers.size, 0, '隐藏页 reset 不应排 timeout');
  assert.equal(hiddenHarness.listenerCount(), 1, '隐藏页 reset 应保留恢复可见监听');
  assert.equal(hiddenHarness.runtime.quickPromptResetPendingButton, hiddenButton, '隐藏页应保留 pending button');
  assert.equal(hiddenHarness.runtime.quickPromptResetPendingDelayMs, 1200, '隐藏页应保留原 reset delay');
  assert.equal(hiddenButton.classList.contains('active'), true, '隐藏页不应立即移除 active');
  assert.equal(hiddenButton.getAttribute('aria-pressed'), 'true', '隐藏页不应立即复位 aria-pressed');

  hiddenHarness.setVisibilityState('visible');
  assert.deepEqual(hiddenHarness.getTimerDelays(), [1200], '恢复可见后应按原 1200ms 补排');
  assert.equal(hiddenButton.classList.contains('active'), true, '补排 timer 触发前不应移除 active');
  assert.equal(hiddenHarness.tickNextTimer(), true, '应能触发恢复后的 reset timeout');
  assert.equal(hiddenButton.classList.contains('active'), false, 'reset timeout 应移除 active');
  assert.equal(hiddenButton.getAttribute('aria-pressed'), 'false', 'reset timeout 应复位 aria-pressed');
  assert.equal(hiddenHarness.listenerCount(), 0, 'reset 完成后应释放 visibilitychange');
  assert.equal(hiddenHarness.runtime.quickPromptResetPendingButton, null, 'reset 完成后应释放 pending button');
  assert.equal(hiddenHarness.runtime.quickPromptResetPendingDelayMs, 0, 'reset 完成后应释放 pending delay');

  const visibleHarness = createQuickPromptResetHarness('visible');
  const visibleButton = visibleHarness.createButton();
  visibleHarness.runtime.scheduleQuickPromptButtonReset(visibleButton, 1200);
  assert.deepEqual(visibleHarness.getTimerDelays(), [1200], '可见页应保留原 1200ms reset 调度');
  assert.equal(visibleHarness.listenerCount(), 1, '可见页等待 reset 时应监听 visibilitychange');
  visibleHarness.setVisibilityState('hidden');
  assert.equal(visibleHarness.timers.size, 0, '可见页转隐藏时应取消已排 reset timeout');
  assert.equal(visibleHarness.runtime.quickPromptResetPendingButton, visibleButton, '转隐藏后应保留 pending button');
  assert.equal(visibleHarness.runtime.quickPromptResetPendingDelayMs, 1200, '转隐藏后应保留 pending delay');
  assert.equal(visibleButton.classList.contains('active'), true, '转隐藏不应立即移除 active');
  visibleHarness.setVisibilityState('visible');
  assert.deepEqual(visibleHarness.getTimerDelays(), [1200], '再次恢复可见后应重新按原 delay 补排');

  const replacementButton = visibleHarness.createButton();
  visibleHarness.runtime.scheduleQuickPromptButtonReset(replacementButton, 700);
  assert.deepEqual(visibleHarness.getTimerDelays(), [700], '新点击应清理旧 timeout 并按新 delay 调度');
  assert.equal(visibleHarness.runtime.quickPromptResetPendingButton, replacementButton, '新点击应替换 pending button');
  assert.equal(visibleHarness.listenerCount(), 1, '新点击后应只保留一个 visibilitychange 监听');
  assert.equal(visibleButton.classList.contains('active'), true, '旧按钮不应被新 reset helper 主动复位');
  assert.equal(visibleHarness.tickNextTimer(), true, '应能触发新按钮 reset timeout');
  assert.equal(replacementButton.classList.contains('active'), false, '新按钮应被 reset timeout 复位');
  assert.equal(visibleButton.classList.contains('active'), true, '旧按钮不应由新按钮 timeout 复位');

  const cleanupHarness = createQuickPromptResetHarness('hidden');
  const cleanupButton = cleanupHarness.createButton();
  cleanupHarness.runtime.scheduleQuickPromptButtonReset(cleanupButton, 1200);
  cleanupHarness.runtime.clearMagicRuntimeCaches();
  assert.equal(cleanupHarness.timers.size, 0, '运行态清理后不应残留 reset timeout');
  assert.equal(cleanupHarness.listenerCount(), 0, '运行态清理后不应残留 visibilitychange');
  assert.equal(cleanupHarness.runtime.quickPromptResetPendingButton, null, '运行态清理后不应残留 pending button');
  assert.equal(cleanupHarness.runtime.quickPromptResetPendingDelayMs, 0, '运行态清理后不应残留 pending delay');
});

test('tab 上提供默认图标，点击后写入默认视图并切换到对应 tab', () => {
  const block = getMagicReportBlock();
  assert.match(block, /class="am-magic-view-default-icon" data-default-view="query"/, '万能查数 tab 缺少默认图标');
  assert.match(block, /class="am-magic-view-default-icon" data-default-view="matrix"/, '人群对比看板 tab 缺少默认图标');
  assert.match(block, /const defaultIcon = target\.closest\('\[data-default-view\]'\);/, '默认图标点击事件未绑定');
  assert.match(block, /this\.setMagicDefaultView\(defaultView\);/, '默认图标点击后未写入默认视图');
  assert.match(block, /this\.switchMagicView\(defaultView\);/, '默认图标点击后未切换到对应 tab');
});

test('人群看板使用顶部统一图例，并支持点击切换系列显隐', () => {
  const block = getMagicReportBlock();
  assert.match(block, /id="am-crowd-matrix-global-legend"/, '看板顶部缺少统一图例容器');
  assert.match(block, /this\.matrixLegendEl\.addEventListener\('click'[\s\S]*toggleCrowdMetricVisibility\(metric\);/, '统一图例点击未绑定系列显隐切换');
  assert.match(block, /this\.matrixLegendEl\.addEventListener\('click'[\s\S]*toggleCrowdPeriodVisibility\(period\);/, '统一图例点击未绑定周期列显隐切换');
  assert.match(block, /this\.matrixLegendEl\.addEventListener\('click'[\s\S]*toggleCrowdRatioVisibility\(\);/, '统一图例点击未绑定占比显隐切换');
  assert.match(block, /this\.matrixLegendEl\.addEventListener\('click'[\s\S]*toggleCrowdInsightsVisibility\(\);/, '统一图例点击未绑定提示显隐切换');
  assert.match(block, /btn\.dataset\.crowdPeriod = String\(period\);/, '统一图例未渲染周期按钮');
  assert.match(block, /ratioBtn\.dataset\.crowdRatioToggle = '1';/, '统一图例未渲染显示占比按钮');
  assert.match(block, /insightBtn\.dataset\.crowdInsightToggle = '1';/, '统一图例未渲染显示提示按钮');
  assert.match(block, /dot\.setAttribute\('aria-hidden', 'true'\);/, '人群/周期图例色点未标记为装饰性');
  assert.match(block, /ratioDot\.setAttribute\('aria-hidden', 'true'\);/, '占比图例色点未标记为装饰性');
  assert.match(block, /insightDot\.setAttribute\('aria-hidden', 'true'\);/, '提示图例色点未标记为装饰性');
  assert.match(block, /node\.setAttribute\('aria-label', `切换人群：\$\{label\}`\);/, '人群图例缺少稳定 aria-label');
  assert.match(block, /const periodLabel = this\.getCrowdPeriodLabel\(period\);[\s\S]*node\.setAttribute\('aria-label', `切换周期：\$\{periodLabel\}`\);/, '周期图例缺少稳定 aria-label');
  assert.match(block, /node\.setAttribute\('aria-label', '切换显示占比'\);/, '显示占比按钮缺少稳定 aria-label');
  assert.match(block, /node\.setAttribute\('aria-label', '切换显示提示'\);/, '显示提示按钮缺少稳定 aria-label');
  assert.match(block, /classList\.toggle\(`am-hide-metric-\$\{metric\}`,\s*!this\.getCrowdMetricVisible\(metric\)\);/, '网格缺少系列显隐 class 切换');
  assert.match(block, /this\.matrixGridEl\.classList\.toggle\('am-show-ratio-values', this\.getCrowdRatioVisible\(\)\);/, '网格缺少占比显隐 class 切换');
  assert.match(block, /this\.matrixGridEl\.classList\.toggle\('am-hide-insights', !this\.getCrowdInsightsVisible\(\)\);/, '网格缺少提示显隐 class 切换');
  assert.match(block, /\.am-crowd-matrix-legend-toggle:focus-visible[\s\S]*outline:\s*2px solid rgba\(37,\s*99,\s*235,\s*0\.45\)/, '图例按钮缺少可见 focus 态');
});

test('单人群与多人群切换时自动联动“显示占比/显示提示”状态', () => {
  const block = getMagicReportBlock();
  assert.match(block, /this\.syncCrowdAuxiliaryVisibilityByMetricCount\(nextMap\);/, '人群显隐切换后未触发占比/提示自动联动');
  assert.match(block, /if \(visibleCount <= 1\) \{[\s\S]*this\.crowdRatioVisibility = true;[\s\S]*this\.crowdInsightsVisibility = false;/, '单人群时未自动开启占比并关闭提示');
  assert.match(block, /else \{[\s\S]*this\.crowdRatioVisibility = false;[\s\S]*this\.crowdInsightsVisibility = true;/, '多人群时未自动关闭占比并开启提示');
});

test('顶部统一图例将人群与时间按钮分组，并用竖线分隔', () => {
  const block = getMagicReportBlock();
  assert.match(block, /metricGroup\.className = 'am-crowd-matrix-legend-group am-crowd-matrix-legend-group-metric';/, '缺少人群图例分组容器');
  assert.match(block, /periodGroup\.className = 'am-crowd-matrix-legend-group am-crowd-matrix-legend-group-period';/, '缺少时间图例分组容器');
  assert.match(block, /divider\.className = 'am-crowd-matrix-legend-divider';/, '缺少图例分隔符节点');
  assert.match(block, /divider\.textContent = '｜';/, '图例分隔符未使用竖线');
});

test('看板计划信息展示计划名/计划ID，并将商品ID改为下拉单选', () => {
  const block = getMagicReportBlock();
  assert.match(block, /data-crowd-campaign-name/, '计划信息缺少计划名节点');
  assert.match(block, /data-crowd-campaign-id/, '计划信息缺少计划ID节点');
  assert.match(block, /id="am-crowd-matrix-item-select"/, '计划信息缺少商品ID下拉节点');
  assert.match(block, /data-crowd-item-trigger aria-label="选择商品ID" aria-expanded="false" aria-haspopup="listbox" aria-controls="am-crowd-matrix-item-listbox"/, '商品ID触发器缺少 aria-label/controls/listbox 关联');
  assert.match(block, /id="am-crowd-matrix-item-listbox" data-crowd-item-dropdown role="listbox" aria-label="商品ID候选列表" aria-hidden="true"/, '商品ID listbox 缺少 id、可访问名称或隐藏状态');
  assert.match(block, /this\.matrixCampaignNameEl\.textContent = `计划名：\$\{name \|\| '未识别'\}`;/, '计划名文案未按节点更新');
  assert.match(block, /this\.matrixCampaignIdEl\.textContent = `计划ID：\$\{id \|\| '--'\}`;/, '计划ID文案未按节点更新');
  assert.match(block, /this\.renderCrowdCampaignItemSelect\(id\);/, '计划信息刷新未触发商品ID下拉渲染');
  assert.match(block, /buildCrowdCampaignItemOptionLabel\(item\)\s*\{[\s\S]*normalizeCrowdItemTitle[\s\S]*花费/, '商品ID下拉未展示商品标题和花费信息');
  assert.match(block, /optionBtn\.id = `am-crowd-matrix-item-option-\$\{item\.itemId\}`;/, '商品ID option 缺少稳定 id');
  assert.match(block, /optionBtn\.dataset\.crowdItemId = item\.itemId;/, '商品ID下拉未写入选项 data-item-id');
  assert.match(block, /optionBtn\.tabIndex = -1;[\s\S]*optionBtn\.setAttribute\('role', 'option'\);[\s\S]*optionBtn\.setAttribute\('aria-label', item\.label\);/, '商品ID option 缺少 option 语义或可访问名称');
  assert.match(block, /this\.matrixCampaignItemDropdownEl\.setAttribute\('aria-hidden', next \? 'false' : 'true'\);/, '商品ID下拉打开状态未同步 aria-hidden');
  assert.match(block, /this\.matrixCampaignItemDropdownHomeEl = this\.matrixCampaignItemSelectEl;/, '商品ID listbox 缺少原始宿主初始化');
  assert.match(block, /this\.matrixCampaignItemTriggerEl\.setAttribute\('aria-label', `选择商品ID：\$\{pickedOption\?\.label \|\| '--'\}`\);/, '商品ID触发器未同步当前选项可访问名称');
  assert.match(block, /itemOptions = itemOptions[\s\S]*\.filter\(item => item\.active !== false\)/, '商品候选未过滤暂停推广状态');
  assert.match(block, /const leftRank = left\?\.active === true \? 0 : 1;[\s\S]*const rightRank = right\?\.active === true \? 0 : 1;/, '商品候选排序未优先推广中状态');
  assert.match(block, /this\.matrixCampaignEl\.addEventListener\('click', \(e\) => \{[\s\S]*target\.closest\('\[data-crowd-item-trigger\]'\)[\s\S]*target\.closest\('\[data-crowd-item-id\]'\)/, '商品ID下拉未绑定触发器/选项点击事件');
  assert.match(block, /this\.matrixCampaignItemDropdownEl\.addEventListener\('click', \(e\) => \{[\s\S]*target\.closest\('\[data-crowd-item-id\]'\)[\s\S]*this\.handleCrowdCampaignItemSelect\(optionItemId\);/, '商品ID body portal 下拉未绑定自身选项点击事件');
  assert.match(block, /handleCrowdCampaignItemSelect\(itemId = ''\)\s*\{[\s\S]*this\.setCrowdCampaignSelectedItemId\(id,\s*selectedItemId,\s*\{\s*manual:\s*true\s*\}\);[\s\S]*this\.reloadCrowdMatrixMetric\(\{\s*campaignId:\s*id,\s*metricType:\s*'itemdeal'\s*\}\);/, '商品ID下拉切换后未仅刷新商品成交人群');
});

test('商品ID下拉支持键盘导航且仅复用局部商品成交刷新路径', () => {
  const block = getMagicReportBlock();
  const keydownBlock = getMagicReportMethodSlice('handleCrowdCampaignItemDropdownKeydown', 'renderCrowdCampaignItemSelect');
  const selectBlock = getMagicReportMethodSlice('selectCrowdCampaignItemActiveOption', 'handleCrowdCampaignItemDropdownKeydown');
  const handleSelectBlock = getMagicReportMethodSlice('handleCrowdCampaignItemSelect', 'refreshCrowdMatrixCampaignMeta');
  assert.match(keydownBlock, /target\.closest\('#am-crowd-matrix-item-select'\)/, '商品ID下拉键盘事件未限制在下拉区域');
  assert.match(keydownBlock, /if \(key === 'Tab'\) \{[\s\S]*this\.setCrowdCampaignItemDropdownOpen\(false\);[\s\S]*return;[\s\S]*\}/, 'Tab 未关闭商品ID下拉');
  assert.match(keydownBlock, /if \(key === 'Escape'\) \{[\s\S]*event\.preventDefault\(\);[\s\S]*this\.setCrowdCampaignItemDropdownOpen\(false\);[\s\S]*this\.matrixCampaignItemTriggerEl\.focus\(\{ preventScroll: true \}\);/, 'Escape 未关闭商品ID下拉并回焦触发器');
  assert.match(keydownBlock, /if \(key === 'Enter' \|\| key === ' '\) \{[\s\S]*if \(!isOpen\) \{[\s\S]*this\.setCrowdCampaignItemDropdownOpen\(true\);[\s\S]*return;[\s\S]*\}[\s\S]*this\.selectCrowdCampaignItemActiveOption\(\);/, 'Enter/Space 未打开或选中商品ID选项');
  assert.match(keydownBlock, /if \(key === 'ArrowDown' \|\| key === 'ArrowUp'\) \{[\s\S]*this\.moveCrowdCampaignItemActiveOption\(key === 'ArrowDown' \? 1 : -1\);/, '上下方向键未移动商品ID活跃选项');
  assert.match(keydownBlock, /if \(key === 'Home' \|\| key === 'End'\) \{[\s\S]*this\.setCrowdCampaignItemActiveOptionByIndex\(key === 'Home' \? 0 : options\.length - 1\);/, 'Home/End 未移动到首尾商品ID选项');
  assert.match(block, /this\.matrixCampaignEl\.addEventListener\('keydown', \(e\) => \{[\s\S]*this\.handleCrowdCampaignItemDropdownKeydown\(e\);[\s\S]*\}\);/, '商品ID下拉未绑定 keydown 事件');
  assert.match(selectBlock, /this\.handleCrowdCampaignItemSelect\(optionItemId\);/, '键盘选中未复用现有商品选择路径');
  assert.match(handleSelectBlock, /this\.reloadCrowdMatrixMetric\(\{\s*campaignId:\s*id,\s*metricType:\s*'itemdeal'\s*\}\);/, '商品键盘选择不应触发全量刷新，只能刷新 itemdeal');
});

test('商品成交人群局部刷新会替换同指标缓存，避免旧周期残留', () => {
  const block = getMagicReportBlock();
  assert.match(block, /replaceCrowdMatrixMetricResults\(metricType,\s*results = \[\]\)\s*\{/, '缺少按指标替换结果缓存方法');
  assert.match(block, /const metricPrefix = `\$\{metric\}\\|`;/, '按指标清理缓存缺少 key 前缀');
  assert.match(block, /this\.crowdMatrixResultMap\.delete\(key\);/, '按指标清理缓存未删除旧周期结果');
  assert.match(block, /const mergedResults = this\.replaceCrowdMatrixMetricResults\(metric,\s*successResults\);/, '局部刷新未替换同指标缓存');
});

test('局部刷新也按完成周期增量渲染，避免等全部周期结束', () => {
  const block = getMagicReportBlock();
  const match = block.match(/async reloadCrowdMatrixMetric\(\{ campaignId, metricType \}\)\s*\{([\s\S]*?)\n\s*\},\n\s*\n\s*ensureCrowdMatrixLoaded\(/);
  assert.ok(match, '无法定位 reloadCrowdMatrixMetric 代码块');
  const reloadBlock = match[1];
  assert.match(reloadBlock, /this\.replaceCrowdMatrixMetricResults\(metric,\s*\[\]\);[\s\S]*const taskFns = this\.CROWD_PERIODS\.map/, '局部刷新开始前未清理旧指标结果，可能混用旧周期');
  assert.match(reloadBlock, /const revealedPeriodSet = new Set\(\);/, '局部刷新缺少周期去重集合，可能重复闪烁');
  assert.match(reloadBlock, /if \(status === 'fulfilled' && progressInfo\?\.value\) \{[\s\S]*const mergedProgressResults = this\.upsertCrowdMatrixResults\(\[progressInfo\.value\]\);[\s\S]*const progressDataset = this\.buildMatrixDataset\(mergedProgressResults,\s*\{\s*groupSortModeMap:\s*this\.crowdMatrixGroupSortModeMap\s*\}\);[\s\S]*this\.renderCrowdMatrixCharts\(progressDataset,\s*\{\s*progressivePeriod:\s*shouldProgressiveReveal\s*\?\s*progressPeriod\s*:\s*0\s*\}\);/, '局部刷新未在单个周期完成后立即渲染');
});

test('刷新进行中切换商品会排队并在完成后补跑最新请求', () => {
  const block = getMagicReportBlock();
  assert.match(block, /if \(this\.crowdMatrixLoading\) \{[\s\S]*this\.scheduleCrowdMatrixMetricReload\(id,\s*metric\);[\s\S]*return;[\s\S]*\}/, '刷新进行中未排队最新指标请求');
  assert.match(block, /scheduleCrowdMatrixMetricReload\(campaignId,\s*metricType\)\s*\{/, '缺少排队重刷方法');
  assert.match(block, /this\.crowdMatrixPendingMetricReload\.set\(`\$\{id\}\|\$\{metric\}`,[\s\S]*metricType:\s*metric/, '排队重刷未支持多个指标依次补跑');
  assert.match(block, /flushPendingCrowdMatrixMetricReload\(\)\s*\{/, '缺少排队请求冲刷方法');
  assert.match(block, /const pendingList = Array\.from\(pending\.values\(\)\);[\s\S]*new Map\(pendingList\.map\(item => \[`\$\{item\.campaignId\}\|\$\{item\.metricType\}`, item\]\)\)/, '冲刷排队请求未保留剩余指标');
  assert.match(block, /this\.flushPendingCrowdMatrixMetricReload\(\);/, '刷新完成后未冲刷排队请求');
});

test('商品成交人群支持手动锁定所选商品ID，避免自动切换到其他候选', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const lockToSelectedItem = metric === 'itemdeal'[\s\S]*this\.isCrowdCampaignItemManuallySelected\(id\)[\s\S]*\/\^\\d\{6,\}\$\/\.test\(selectedItemId\);/, 'itemdeal 未识别手动选中锁定条件');
  assert.match(block, /const candidates = lockedItemId[\s\S]*\?\s*\[lockedItemId\][\s\S]*:\s*this\.getCrowdCampaignItemCandidates\(id,\s*seedItemId\);/, 'itemdeal 未按锁定状态构造候选商品集合');
  assert.match(block, /lockedItemId:\s*lockToSelectedItem \?\s*selectedItemId\s*:\s*''/, 'itemdeal 首查未透传锁定商品ID');
  assert.match(block, /const shouldRetryByRefreshingItem = metric === 'itemdeal' && !lockToSelectedItem && \/queryExecutePlan\/\.test\(message\);/, '锁定商品ID后仍会触发刷新重试，可能串商品');
});

test('看板状态区仅展示最新一行日志，并支持进度条背景变量', () => {
  const block = getMagicReportBlock();
  assert.match(block, /split\(\/\\r\?\\n\/\)/, '状态文案未按行切分');
  assert.match(block, /style\.setProperty\('--am-crowd-progress', `\$\{nextProgress\}%`\);/, '状态区未写入进度条变量');
  assert.match(block, /textNode\.className = 'am-crowd-matrix-state-text';/, '状态区未使用单行文本节点');
  assert.match(block, /this\.matrixStateEl\.replaceChildren\(textNode\);/, '状态区未替换为最新单行日志');
});

test('看板加载进度文案包含省份/城市维度进度', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const scopeProgressText = totalTaskCount > 0[\s\S]*\? ` ｜ 省份 \$\{done\}\/\$\{totalTaskCount\} · 城市 \$\{done\}\/\$\{totalTaskCount\}`[\s\S]*: '';/, '加载进度未追加省份/城市进度文案');
  assert.match(block, /setCrowdMatrixStatus\(`加载中 \$\{done\}\/\$\{totalTaskCount\} · \$\{detailText\}\$\{scopeProgressText\}`,\s*'loading'/, '加载状态文案未使用省份/城市进度拼接');
});

test('看板加载过程中会按已完成请求增量渲染', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const revealedPeriodSet = new Set\(\);/, '增量渲染缺少周期去重集合，可能导致重复闪烁');
  assert.match(block, /if \(status === 'fulfilled' && progressInfo\?\.value\) \{[\s\S]*const mergedProgressResults = this\.upsertCrowdMatrixResults\(\[progressInfo\.value\]\);[\s\S]*const progressDataset = this\.buildMatrixDataset\(mergedProgressResults,\s*\{\s*groupSortModeMap:\s*this\.crowdMatrixGroupSortModeMap\s*\}\);[\s\S]*this\.crowdMatrixDataset = progressDataset;[\s\S]*this\.crowdMatrixLoadedCampaignId = id;[\s\S]*const progressPeriod = this\.normalizeCrowdPeriod\(progressInfo\.value\?\.periodDays\);[\s\S]*const shouldProgressiveReveal = !!progressPeriod && !revealedPeriodSet\.has\(progressPeriod\);[\s\S]*this\.renderCrowdMatrixCharts\(progressDataset,\s*\{\s*progressivePeriod:\s*shouldProgressiveReveal\s*\?\s*progressPeriod\s*:\s*0\s*\}\);[\s\S]*if \(shouldProgressiveReveal\) \{[\s\S]*revealedPeriodSet\.add\(progressPeriod\);/, '加载中未按已完成请求做增量渲染或未按周期去重动画');
});

test('增量渲染仅对本次周期列添加渐显动画，避免整表突兀闪动', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const progressivePeriod = this\.normalizeCrowdPeriod\(options\?\.progressivePeriod\);/, '渲染入口未读取增量渐显周期');
  assert.match(block, /const shouldProgressiveReveal = !!progressivePeriod && period === progressivePeriod;/, '单元格未按周期列定向启用渐显');
  assert.match(block, /const cellNode = this\.createCrowdMatrixCell\(period,\s*groupName,\s*cell,\s*\{[\s\S]*progressiveReveal:\s*shouldProgressiveReveal,[\s\S]*revealIndex:\s*groupIdx[\s\S]*\}\);/, '渲染参数未透传渐显标识/顺序');
  assert.match(block, /const progressiveReveal = options\?\.progressiveReveal === true;/, '单元格创建未识别渐显开关');
  assert.match(block, /if \(progressiveReveal\) \{[\s\S]*wrap\.classList\.add\('is-progressive-reveal'\);[\s\S]*wrap\.style\.setProperty\('--am-crowd-reveal-index', String\(revealIndex\)\);/, '单元格未注入渐显类与延迟顺序变量');
  assert.match(block, /am-crowd-matrix-cell-chart\.is-progressive-reveal[\s\S]*animation:\s*am-crowd-cell-reveal\s*0\.34s/, '缺少单元格渐显动画样式');
  assert.match(block, /@keyframes am-crowd-cell-reveal \{[\s\S]*opacity:\s*0;[\s\S]*translateY\(7px\);[\s\S]*opacity:\s*1;[\s\S]*translateY\(0\);/, '缺少单元格渐显关键帧');
});

test('看板单元格只渲染当前可见人群柱子，避免默认隐藏指标放大 DOM 成本', () => {
  const block = getMagicReportBlock();
  const methodBlock = getMagicReportMethodSlice('createCrowdMatrixCell', 'renderCrowdMatrixCharts');
  assert.match(methodBlock, /const visibleMetrics = metrics\.filter\(metric => this\.getCrowdMetricVisible\(metric\)\);[\s\S]*const renderMetrics = visibleMetrics\.length \? visibleMetrics : metrics;/, '单元格未按可见指标收敛渲染指标集合');
  assert.match(methodBlock, /const cellMaxRatio = renderMetrics\.reduce\(/, '柱高比例计算未使用可见指标集合');
  assert.match(methodBlock, /columns\.className = 'am-crowd-matrix-bar-columns';[\s\S]*renderMetrics\.forEach\(\(metric\) => \{[\s\S]*columns\.appendChild\(bar\);/, '柱子 DOM 仍按全部指标生成，默认首屏会创建隐藏指标节点');
});

test('看板默认隐藏提示时不生成提示 DOM，打开提示后重绘补齐', () => {
  const block = getMagicReportBlock();
  const methodBlock = getMagicReportMethodSlice('createCrowdMatrixCell', 'renderCrowdMatrixCharts');
  assert.match(methodBlock, /if \(this\.getCrowdInsightsVisible\(\)\) \{[\s\S]*const insights = document\.createElement\('div'\);[\s\S]*insights\.className = 'am-crowd-matrix-insights';[\s\S]*renderMetrics\.forEach\(\(metric\) => \{[\s\S]*wrap\.appendChild\(insights\);[\s\S]*\}/, '默认隐藏提示时仍会生成提示 DOM，或提示未按当前可见指标生成');
  assert.match(block, /toggleCrowdInsightsVisibility\(\)\s*\{[\s\S]*this\.crowdInsightsVisibility = !this\.getCrowdInsightsVisible\(\);[\s\S]*if \(this\.crowdMatrixDataset\) \{[\s\S]*this\.renderCrowdMatrixCharts\(this\.crowdMatrixDataset,\s*\{\s*animate:\s*false\s*\}\);[\s\S]*return;[\s\S]*\}/, '显示提示切换后未重绘补齐提示 DOM');
});

test('看板状态条自动隐藏 timer 在隐藏页暂停并恢复可见后补排', () => {
  const block = getMagicReportBlock();
  assert.match(
    block,
    /crowdMatrixStateHideTimer:\s*null,[\s\S]*crowdMatrixStateHideVisibilityHandler:\s*null,[\s\S]*crowdMatrixStateHidePendingDelayMs:\s*null,/,
    '状态条 auto-hide 缺少 timer、visibility handler 或 pending delay 状态'
  );
  assert.match(
    getMagicReportMethodSlice('clearCrowdMatrixStateHideTimer', 'clearCrowdMatrixStateHideVisibilityHandler'),
    /if \(!this\.crowdMatrixStateHideTimer\) return;[\s\S]*clearTimeout\(this\.crowdMatrixStateHideTimer\);[\s\S]*this\.crowdMatrixStateHideTimer = null;/,
    '状态条 auto-hide timer 应支持统一清理并归零'
  );
  assert.match(
    getMagicReportMethodSlice('clearCrowdMatrixStateHideVisibilityHandler', 'clearCrowdMatrixStateHideState'),
    /const handler = this\.crowdMatrixStateHideVisibilityHandler;[\s\S]*document\.removeEventListener\('visibilitychange', handler\);[\s\S]*this\.crowdMatrixStateHideVisibilityHandler = null;/,
    '状态条 auto-hide 应支持释放 visibilitychange handler'
  );
  assert.match(
    getMagicReportMethodSlice('clearCrowdMatrixStateHideState', 'bindCrowdMatrixStateHideVisibilityHandler'),
    /this\.clearCrowdMatrixStateHideTimer\(\);[\s\S]*this\.clearCrowdMatrixStateHideVisibilityHandler\(\);[\s\S]*this\.crowdMatrixStateHidePendingDelayMs = null;/,
    '状态条 auto-hide 应统一清理 timer、visibility 和 pending delay'
  );
  assert.match(
    getMagicReportMethodSlice('bindCrowdMatrixStateHideVisibilityHandler', 'scheduleCrowdMatrixStateAutoHide'),
    /if \(typeof this\.crowdMatrixStateHideVisibilityHandler === 'function'\) return;[\s\S]*if \(this\.isMagicReportDocumentHidden\(\)\) \{[\s\S]*this\.clearCrowdMatrixStateHideTimer\(\);[\s\S]*return;[\s\S]*const pendingDelayMs = this\.crowdMatrixStateHidePendingDelayMs;[\s\S]*this\.scheduleCrowdMatrixStateAutoHide\(pendingDelayMs\);[\s\S]*document\.addEventListener\('visibilitychange', this\.crowdMatrixStateHideVisibilityHandler\);/,
    '状态条 auto-hide 应在隐藏时取消 timer，恢复可见后继续同一个 pending delay'
  );
  assert.match(
    getMagicReportMethodSlice('scheduleCrowdMatrixStateAutoHide', 'setCrowdMatrixStatus'),
    /this\.clearCrowdMatrixStateHideState\(\);[\s\S]*if \(!\(this\.matrixStateEl instanceof HTMLElement\)\) return;[\s\S]*const normalizedDelay = Math\.max\(0, Number\(delayMs\) \|\| 1200\);[\s\S]*this\.crowdMatrixStateHidePendingDelayMs = normalizedDelay;[\s\S]*this\.bindCrowdMatrixStateHideVisibilityHandler\(\);[\s\S]*if \(this\.isMagicReportDocumentHidden\(\)\) return;[\s\S]*this\.crowdMatrixStateHideTimer = setTimeout\(\(\) => \{[\s\S]*this\.crowdMatrixStateHideTimer = null;[\s\S]*if \(this\.isMagicReportDocumentHidden\(\)\) return;[\s\S]*this\.matrixStateEl\.classList\.add\('is-hidden'\);[\s\S]*this\.clearCrowdMatrixStateHideVisibilityHandler\(\);[\s\S]*this\.crowdMatrixStateHidePendingDelayMs = null;[\s\S]*\}, normalizedDelay\);/,
    '状态条 auto-hide 应隐藏页暂停，可见页按原 delay 调度，并在触发前复核隐藏态'
  );
  assert.match(
    getMagicReportMethodSlice('setCrowdMatrixStatus', 'ensureCrowdMatrixHoverTip'),
    /this\.clearCrowdMatrixStateHideState\(\);[\s\S]*if \(options\.autoHide === true\) \{[\s\S]*const delay = Math\.max\(0, Number\(options\.hideDelayMs\) \|\| 1200\);[\s\S]*this\.scheduleCrowdMatrixStateAutoHide\(delay\);/,
    '状态条更新应先清理旧 auto-hide 状态，再通过统一 helper 调度'
  );
  assert.match(
    getMagicReportMethodSlice('clearMagicRuntimeCaches', 'releasePopupResources'),
    /this\.clearCrowdMatrixStateHideState\(\);/,
    '清理 MagicReport 运行态时必须释放状态条 auto-hide timer、visibility 和 pending'
  );
  assert.match(block, /setCrowdMatrixStatus\('人群对比看板已加载完成（4列周期 × 8行维度）',\s*'success',\s*\{[\s\S]*autoHide:\s*true/, '加载完成后未开启状态自动隐藏');

  const hiddenHarness = createCrowdMatrixStateHideHarness('hidden');
  hiddenHarness.runtime.setCrowdMatrixStatus('已展示最近一次加载结果', 'success', {
    showRetry: false,
    progress: 100,
    autoHide: true,
    hideDelayMs: 800
  });
  assert.equal(hiddenHarness.timers.size, 0, '隐藏页 autoHide 不应排 timeout');
  assert.equal(hiddenHarness.listenerCount(), 1, '隐藏页 autoHide 应保留恢复可见监听');
  assert.equal(hiddenHarness.runtime.crowdMatrixStateHidePendingDelayMs, 800, '隐藏页应保留原 hideDelayMs');
  assert.equal(hiddenHarness.matrixStateEl.classList.contains('is-hidden'), false, '隐藏页不应立即隐藏状态条');

  hiddenHarness.setVisibilityState('visible');
  assert.deepEqual(hiddenHarness.getTimerDelays(), [800], '恢复可见后应按原 hideDelayMs 补排');
  assert.equal(hiddenHarness.matrixStateEl.classList.contains('is-hidden'), false, '补排 timer 触发前不应隐藏状态条');
  assert.equal(hiddenHarness.tickNextTimer(), true, '应能触发恢复后的 auto-hide timeout');
  assert.equal(hiddenHarness.matrixStateEl.classList.contains('is-hidden'), true, 'auto-hide timeout 应隐藏状态条');
  assert.equal(hiddenHarness.listenerCount(), 0, 'auto-hide 完成后应释放 visibilitychange');
  assert.equal(hiddenHarness.runtime.crowdMatrixStateHidePendingDelayMs, null, 'auto-hide 完成后应释放 pending delay');

  const visibleHarness = createCrowdMatrixStateHideHarness('visible');
  visibleHarness.runtime.setCrowdMatrixStatus('排序已切换', 'success', {
    showRetry: false,
    progress: 100,
    autoHide: true,
    hideDelayMs: 1000
  });
  assert.deepEqual(visibleHarness.getTimerDelays(), [1000], '可见页应保留原 hideDelayMs 调度');
  assert.equal(visibleHarness.listenerCount(), 1, '可见页等待 auto-hide 时应监听 visibilitychange');
  visibleHarness.setVisibilityState('hidden');
  assert.equal(visibleHarness.timers.size, 0, '可见页转隐藏时应取消已排 auto-hide timeout');
  assert.equal(visibleHarness.runtime.crowdMatrixStateHidePendingDelayMs, 1000, '转隐藏后应保留 pending delay');
  assert.equal(visibleHarness.matrixStateEl.classList.contains('is-hidden'), false, '转隐藏不应立即隐藏状态条');
  visibleHarness.setVisibilityState('visible');
  assert.deepEqual(visibleHarness.getTimerDelays(), [1000], '再次恢复可见后应重新按原 delay 补排');

  visibleHarness.runtime.setCrowdMatrixStatus('正在加载', 'loading', {
    showRetry: false,
    progress: 20
  });
  assert.equal(visibleHarness.timers.size, 0, '新状态未 autoHide 时应清理旧 timeout');
  assert.equal(visibleHarness.listenerCount(), 0, '新状态未 autoHide 时应清理旧 visibilitychange');
  assert.equal(visibleHarness.runtime.crowdMatrixStateHidePendingDelayMs, null, '新状态未 autoHide 时应清理旧 pending delay');
  assert.equal(visibleHarness.matrixStateEl.classList.contains('is-hidden'), false, '新 loading 状态应保持可见');

  const cleanupHarness = createCrowdMatrixStateHideHarness('hidden');
  cleanupHarness.runtime.setCrowdMatrixStatus('已展示缓存结果', 'success', {
    showRetry: false,
    progress: 100,
    autoHide: true,
    hideDelayMs: 800
  });
  cleanupHarness.runtime.clearMagicRuntimeCaches();
  assert.equal(cleanupHarness.timers.size, 0, '运行态清理后不应残留 auto-hide timeout');
  assert.equal(cleanupHarness.listenerCount(), 0, '运行态清理后不应残留 visibilitychange');
  assert.equal(cleanupHarness.runtime.crowdMatrixStateHidePendingDelayMs, null, '运行态清理后不应残留 pending delay');
});

test('人群维度列宽按文字内容自适应', () => {
  const block = getMagicReportBlock();
  assert.match(block, /grid-template-columns:\s*max-content repeat\(var\(--am-crowd-matrix-data-cols,\s*4\), minmax\(0,\s*1fr\)\);/, '首列宽度未改为文字自适应');
});

test('省份/城市维度支持横向拖拽浏览，且占比显示逻辑与其它维度一致', () => {
  const block = getMagicReportBlock();
  assert.match(block, /enableCrowdMatrixHorizontalDrag\(scrollerEl\)\s*\{/, '缺少横向拖拽绑定方法');
  assert.match(block, /const enableHorizontalScroll = normalizedGroupName === '省份' \|\| normalizedGroupName === '城市';/, '未将省份\/城市标记为横向滚动维度');
  assert.match(block, /wrap\.classList\.add\('is-horizontal-scroll'\);/, '省份\/城市单元格未开启横向滚动样式');
  assert.match(block, /chart\.style\.setProperty\('--am-crowd-label-min-width', `\$\{labelMinWidth\}px`\);/, '省份\/城市未按标签密度设置横向最小列宽');
  assert.match(block, /this\.enableCrowdMatrixHorizontalDrag\(wrap\);/, '省份\/城市单元格未绑定拖拽滚动行为');
  assert.match(block, /am-crowd-matrix-cell-chart\.is-horizontal-scroll[\s\S]*overflow-x:\s*auto;/, '省份\/城市单元格未启用横向滚动');
  assert.match(block, /am-crowd-matrix-cell-chart\.is-horizontal-scroll \.am-crowd-matrix-chart[\s\S]*min-width:\s*calc\(var\(--am-crowd-label-count,\s*1\) \* var\(--am-crowd-label-min-width,\s*58px\)\);/, '省份\/城市图表最小宽度未按标签数量扩展');
  assert.match(block, /am-crowd-matrix-grid\.am-show-ratio-values \.am-crowd-matrix-bar-ratio[\s\S]*opacity:\s*1;/, '占比显示态未沿用全局逻辑');
  assert.doesNotMatch(block, /am-show-ratio-values[\s\S]*am-crowd-matrix-cell-chart\.is-horizontal-scroll \.am-crowd-matrix-bar-ratio[\s\S]*opacity:\s*0;/, '省份\/城市占比不应单独覆盖为悬停显示');
});

test('省份/城市默认各周期独立排序，并可点击表头图标切换到主周期优先', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const shouldUseStableSort = isPriorityGroupSort\(groupName\);/, '未按分组排序模式控制稳定标签开关');
  assert.match(block, /const stableLabels = shouldUseStableSort \? stableLabelMap\.get\(normalizedGroupName\) : null;/, '默认排序未回落到各周期独立标签');
  assert.match(block, /rowHeader\.classList\.add\('has-sort-toggle'\);/, '省份\/城市行头未启用排序开关布局');
  assert.match(block, /sortBtn\.dataset\.crowdGroupSortToggle = normalizedGroupName;/, '排序图标未写入分组标识');
  assert.match(block, /sortBtn\.textContent = '⇅';/, '排序图标字符未渲染');
  assert.match(block, /this\.matrixGridEl\.addEventListener\('click', \(e\) => \{[\s\S]*target\.closest\('\[data-crowd-group-sort-toggle\]'\)[\s\S]*this\.toggleCrowdGroupSortMode\(groupName\);/, '排序图标点击未绑定模式切换');
  assert.match(block, /const nextMode = this\.getCrowdGroupSortMode\(normalizedGroupName\) === 'priority' \? 'period' : 'priority';/, '排序切换逻辑未在默认与主周期优先之间切换');
  assert.match(block, /const modeText = nextMode === 'priority' \? '主周期优先（90→30→7→3）' : '各周期独立排序';/, '排序切换后的状态文案未区分两种模式');
});

test('柱状图悬停提示使用即时 tooltip（data-tooltip）并绑定网格鼠标事件', () => {
  const block = getMagicReportBlock();
  assert.match(block, /bindCrowdMatrixHoverTipEvents\(\)\s*\{/, '缺少柱状图悬停事件绑定方法');
  assert.match(block, /showCrowdMatrixHoverTip\(tipText,\s*event\.clientX,\s*event\.clientY\);/, '悬停时未即时显示 tooltip');
  assert.match(block, /const linkedBars = this\.activateCrowdMatrixHoverBars\(bar\);/, '悬停时未先获取跨周期联动柱集合');
  assert.match(block, /const tipText = this\.buildCrowdMatrixHoverTipText\(bar,\s*linkedBars\);/, '悬停时未构造跨周期提示文案');
  assert.match(block, /const labelIndex = this\.normalizeCrowdLabelKey\(anchorBar\.dataset\.labelKey \|\| anchorBar\.dataset\.labelName[\s\S]*\);/, '跨周期联动未按标签内容键对齐');
  assert.match(block, /bar\.dataset\.tooltip\s*=\s*tooltipText;/, '柱状图未写入 data-tooltip');
  assert.match(block, /const shouldAppendYuan = crowdGroup === '省份' \|\| crowdGroup === '城市';/, '省份\/城市悬停提示未启用金额单位逻辑');
  assert.match(block, /const countDisplay = shouldAppendYuan && !\/元\$\/\.test\(rawCountDisplay\) \? `\$\{rawCountDisplay\}元` : rawCountDisplay;/, '跨周期悬停提示未为省份\/城市追加元单位');
  assert.match(block, /bar\.dataset\.labelIndex = String\(labelIdx\);/, '柱状图未写入标签索引');
  assert.match(block, /bar\.dataset\.labelKey = this\.normalizeCrowdLabelKey\(label\);/, '柱状图未写入标签内容键');
  assert.match(block, /bar\.dataset\.crowdGroup = String\(groupName \|\| ''\);/, '柱状图未写入维度分组标记');
  assert.match(block, /bar\.dataset\.metricLabel = String\(metricMeta\.seriesLabel \|\| ''\);/, '柱状图未写入系列名称');
  assert.match(block, /bar\.dataset\.ratio = String\(ratio\);/, '柱状图未写入占比数值');
  assert.match(block, /const tooltipCountDisplay = \(normalizedGroupName === '省份' \|\| normalizedGroupName === '城市'\) && !\/元\$\/\.test\(String\(countDisplay \|\| ''\)\)/, '单柱 fallback tooltip 未按省份\/城市追加元单位');
  assert.match(block, /const tooltipText = `\$\{metricMeta\.seriesLabel\}: \$\{this\.formatCrowdPercent\(ratio\)\}（\$\{tooltipCountDisplay\}）\$\{cell\?\.noData\?\.\[metric\] \? ' 无数据' : ''\}`;/, '单柱 fallback tooltip 未使用带元单位的金额文案');
  assert.match(block, /const periodCompareMap = \{\};[\s\S]*this\.CROWD_PERIODS\.forEach\(\(period,\s*index\) => \{[\s\S]*const nextPeriod = this\.CROWD_PERIODS\[index \+ 1\];[\s\S]*if \(nextPeriod\) periodCompareMap\[period\] = nextPeriod;/, '跨周期 pt 对比链路未按当前周期列表动态定义');
  assert.match(block, /const diffPt = item\.ratio - compareItem\.ratio;/, '跨周期提示文案未按相邻周期计算差异 pt');
  assert.match(block, /diffLabel = `（\$\{this\.formatCrowdPtDiff\(diffPt\)\}）`;/, '跨周期提示文案未按括号格式输出差异 pt');
  assert.match(block, /const orderedMetrics = anchorMetric[\s\S]*\? \[anchorMetric,\s*\.\.\.visibleMetrics\.filter\(metric => metric !== anchorMetric\)\][\s\S]*: visibleMetrics\.slice\(\);/, '悬停提示未按可见人群构造动态列顺序');
  assert.match(block, /const scopeMetricMap = this\.getCrowdMatrixHoverMetricScopeMap\(anchorLabelIndex,\s*anchorCrowdGroup\);/, '悬停提示未读取预构建指标索引');
  assert.match(block, /const scopeMap = scopeMetricMap\.get\(metric\);/, '悬停提示未按人群类型读取缓存映射');
  assert.match(block, /const compareMetricLabels = orderedMetricLabels\.slice\(1\);/, '悬停提示未提取对比人群列表');
  assert.match(block, /const header = \[metricLabel,\s*labelName,\s*compareMetricLabels\.length \? `对比人群：\$\{compareMetricLabels\.join\('、'\)\}` : ''\]\.filter\(Boolean\)\.join\(' · '\);/, '悬停提示标题未按多人群拼接对比人群文案');
  assert.match(block, /const extraMetrics = orderedMetrics\.slice\(1\);/, '悬停提示未构造额外人群列');
  assert.match(block, /const extraCells = extraMetrics\.map\(\(metric\) => \{/, '悬停提示未按可见人群生成动态列数据');
  assert.match(block, /ratioLabel:\s*metricItem \? this\.formatCrowdHoverPercent\(metricItem\.ratio\) : ''/, '悬停提示缺数据时未隐藏对比占比');
  assert.match(block, /countLabel:\s*metricItem \? String\(metricItem\.countDisplay \|\| ''\) : ''/, '悬停提示缺数据时未隐藏对比数值');
  assert.match(block, /const metricHeaderLine = orderedMetricLabels\.length \? `__METRICS__\|\$\{orderedMetricLabels\.join\('\|'\)\}` : '';/, '悬停提示未写入人群列头元数据');
  assert.match(block, /const contentLines = metricHeaderLine \? \[metricHeaderLine,\s*\.\.\.lines\] : lines;/, '悬停提示未将列头插入第一行');
  assert.match(block, /const countLabelMax = items\.reduce\(\(maxLen, item\) => \{[\s\S]*item\.countDisplay[\s\S]*\}, 0\);/, '提示文案未计算末尾具体数值列宽');
  assert.match(block, /const countLabel = item\.countDisplay\.padStart\(countLabelMax, ' '\);/, '提示文案末尾具体数值未做对齐');
  assert.match(block, /const diffLabelMax = rows\.reduce\(\(maxLen, row\) => Math\.max\(maxLen, row\.diffLabel\.length\), 0\);/, '提示文案未计算 pt 差异列宽');
  assert.match(block, /const diffColumn = row\.diffLabel\.padEnd\(diffLabelMax, ' '\);/, '提示文案未为缺失 pt 差异补齐占位宽度');
  assert.match(block, /if \(bodyLines\.length && bodyLines\[0\]\.startsWith\('__METRICS__\|'\)\) \{/, 'tooltip HTML 未读取第一行人群列头');
  assert.match(block, /const metricHeaderHtml = metricLabels\.length[\s\S]*am-crowd-matrix-hover-tip-row-metrics/, 'tooltip HTML 未渲染人群名称第一行');
  assert.match(block, /const compareCells = compareParts\.map\(\(part\) => \{/, 'tooltip HTML 未按动态列拆分对比数据');
  assert.match(block, /while \(compareCells\.length < compareMetricLabels\.length\) \{/, 'tooltip HTML 未按可见人群补齐动态列');
  assert.match(block, /const gridTemplateParts = \[[\s\S]*\];/, 'tooltip HTML 未初始化动态网格模板');
  assert.match(block, /`minmax\(\$\{Math\.max\(7,\s*ratioCh\)\}ch, max-content\)`/, 'tooltip 占比列未使用 minmax 防止列宽压叠');
  assert.match(block, /gridTemplateParts\.push\('minmax\(0, max-content\)'\);/, 'tooltip HTML 未追加稳定末尾标记列宽');
  assert.match(block, /const tableStyle = `--am-crowd-hover-grid-template:\$\{gridTemplateParts\.join\(' '\)\};`;/, 'tooltip HTML 未写入动态网格模板样式');
  assert.match(block, /am-crowd-matrix-hover-tip-col am-crowd-matrix-hover-tip-col-compare-ratio/, 'tooltip HTML 未渲染对比占比列');
  assert.match(block, /am-crowd-matrix-hover-tip-col am-crowd-matrix-hover-tip-col-compare-count/, 'tooltip HTML 未渲染对比数值列');
  assert.doesNotMatch(block, /`VS \$\{compareMetricLabel\}`/, '悬停提示仍包含 VS 文案');
  assert.doesNotMatch(block, /compareRatioLabel[\s\S]*:\s*'--'/, '悬停提示对比占比仍使用 -- 占位符，未按要求隐藏空值');
  assert.doesNotMatch(block, /compareCountLabel[\s\S]*:\s*'--'/, '悬停提示对比数值仍使用 -- 占位符，未按要求隐藏空值');
  assert.doesNotMatch(block, /vs\$\{compareLabel\}/, '提示文案仍包含 vs过去N天 文案');
  assert.match(block, /const tipHtml = this\.formatCrowdMatrixHoverTipHtml\(content\);/, 'tooltip 未构造 HTML 提示内容');
  assert.match(block, /tip\.innerHTML = tipHtml;/, 'tooltip 未按 HTML 方式渲染分色内容');
  assert.match(block, /diffClass = diffValue\.startsWith\('\+'\)\s*\?\s*'is-pos'\s*:\s*\(diffValue\.startsWith\('-'\)\s*\?\s*'is-neg'\s*:\s*'is-neutral'\);/, 'pt 差异颜色分类逻辑缺失');
  assert.match(block, /am-crowd-matrix-hover-tip[\s\S]*white-space:\s*pre-wrap;/, 'tooltip 样式未开启对齐换行显示');
  assert.match(block, /am-crowd-matrix-hover-tip-line[\s\S]*white-space:\s*pre;/, 'tooltip 行样式未启用预格式化对齐');
  assert.match(block, /am-crowd-matrix-hover-tip[\s\S]*max-width:\s*min\(720px,\s*calc\(100vw - 48px\)\);/, 'tooltip 最大宽度未扩展，长人群名称容易压叠');
  assert.match(block, /am-crowd-matrix-hover-tip-table[\s\S]*display:\s*inline-grid;[\s\S]*max-width:\s*100%;/, 'tooltip 表格未限制自身宽度');
  assert.match(block, /am-crowd-matrix-hover-tip-row[\s\S]*min-width:\s*0;/, 'tooltip 行缺少 min-width:0，网格列可能溢出重叠');
  assert.match(block, /am-crowd-matrix-hover-tip[\s\S]*background:\s*linear-gradient\(145deg,\s*rgba\(248,\s*252,\s*255,\s*0\.95\)\s*0%,\s*rgba\(238,\s*246,\s*255,\s*0\.92\)\s*100%\);/, 'tooltip 背景未对齐看板浅蓝玻璃风格');
  assert.match(block, /am-crowd-matrix-hover-tip[\s\S]*border:\s*1px solid rgba\(255,\s*255,\s*255,\s*0\.82\);/, 'tooltip 边框未与看板卡片风格统一');
  assert.match(block, /am-crowd-matrix-hover-tip[\s\S]*color:\s*#56647d;/, 'tooltip 主文字未调整为浅灰蓝');
  assert.match(block, /am-crowd-matrix-hover-tip-row-metrics[\s\S]*border-bottom:\s*1px dashed rgba\(31,\s*53,\s*109,\s*0\.12\);/, 'tooltip 列头分隔线未统一为看板风格');
  assert.match(block, /am-crowd-matrix-hover-tip-row-metrics[\s\S]*color:\s*#6c7890;/, 'tooltip 列头文字未统一为看板辅色');
  assert.match(block, /am-crowd-matrix-hover-tip-row-metrics[\s\S]*align-items:\s*start;/, 'tooltip 列头未顶部对齐，换行后可能压住下一行');
  assert.match(block, /am-crowd-matrix-hover-tip-col[\s\S]*min-width:\s*0;[\s\S]*white-space:\s*nowrap;/, 'tooltip 列未允许网格收缩，文本可能叠加');
  assert.match(block, /am-crowd-matrix-hover-tip-col-metric-label[\s\S]*white-space:\s*normal;[\s\S]*overflow-wrap:\s*anywhere;/, 'tooltip 长人群名称列头未允许换行');
  assert.match(block, /am-crowd-matrix-hover-tip-col-compare-ratio[\s\S]*color:\s*#56647d;/, 'tooltip 对比占比列未使用浅灰蓝主色');
  assert.match(block, /am-crowd-matrix-hover-tip-col-compare-count[\s\S]*color:\s*#56647d;/, 'tooltip 对比数值列未使用浅灰蓝主色');
  assert.match(block, /am-crowd-matrix-hover-tip-col-flag[\s\S]*color:\s*#7f8aa0;/, 'tooltip 标记列未使用更浅辅色');
  assert.match(block, /am-crowd-matrix-hover-tip-diff\.is-pos[\s\S]*color:\s*#0f766e;/, 'pt 正向差异未切换为浅色主题配色');
  assert.match(block, /am-crowd-matrix-hover-tip-diff\.is-neg[\s\S]*color:\s*#b42318;/, 'pt 负向差异未切换为浅色主题配色');
  assert.match(block, /am-crowd-matrix-hover-tip-diff\.is-neutral[\s\S]*color:\s*#a16207;/, 'pt 中性差异未切换为浅色主题配色');
  assert.match(block, /am-crowd-matrix-hover-tip[\s\S]*font-family:\s*var\(--am26-font,\s*-apple-system,\s*BlinkMacSystemFont,\s*"Segoe UI",\s*"PingFang SC",\s*"Hiragino Sans GB",\s*"Microsoft YaHei",\s*sans-serif\);/, 'tooltip 字体未与看板风格统一');
  assert.match(block, /am-crowd-matrix-hover-tip[\s\S]*font-variant-numeric:\s*tabular-nums;/, 'tooltip 样式未启用等宽数字显示');
  assert.match(block, /am-crowd-matrix-hover-tip-row[\s\S]*--am-crowd-hover-grid-template/, 'tooltip 样式未使用动态网格模板变量');
  assert.match(block, /am-crowd-matrix-hover-tip-row-metrics/, 'tooltip 样式未声明第一行人群名称样式');
  assert.match(block, /am-crowd-matrix-hover-tip-col-compare-ratio[\s\S]*text-align:\s*right;/, 'tooltip 对比占比列未右对齐');
  assert.match(block, /am-crowd-matrix-hover-tip-col-compare-count[\s\S]*text-align:\s*right;/, 'tooltip 对比数值列未右对齐');
  assert.match(block, /this\.buildCrowdMatrixHoverMetricIndex\(\);/, '看板渲染后未预构建悬停缓存');
  assert.doesNotMatch(block, /bar\.title\s*=\s*`/, '柱状图仍在使用 title 作为提示，存在延迟显示问题');
});

test('柱组之间提供轻量竖向分隔线，提升横向可读性', () => {
  const block = getMagicReportBlock();
  assert.match(block, /am-crowd-matrix-bar-group \+ \.am-crowd-matrix-bar-group::before/, '缺少柱组间分隔线选择器');
  assert.match(block, /background:\s*linear-gradient\(180deg,\s*rgba\(127,\s*140,\s*169,\s*0\),\s*rgba\(127,\s*140,\s*169,\s*0\.16\),\s*rgba\(127,\s*140,\s*169,\s*0\)\);/, '分隔线未使用弱化渐变样式');
});

test('周期图例切换会过滤渲染列，且不再生成 peak badge 提示', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const periods = this\.getVisibleCrowdPeriods\(Array\.isArray\(dataset\.periods\) \? dataset\.periods : \[\]\);/, '渲染时未按周期显隐过滤列');
  assert.match(block, /table\.style\.setProperty\('--am-crowd-matrix-data-cols', String\(Math\.max\(1, periods\.length\)\)\);/, '表格列数未随可见周期动态调整');
  assert.doesNotMatch(block, /peak\.className\s*=\s*'am-crowd-matrix-peak-badge'/, '仍在生成 peak badge，未移除顶部提示');
});

test('提示文案使用完整人群名称，不再使用简写标签', () => {
  const block = getMagicReportBlock();
  assert.match(block, /insightItem\.textContent = `\$\{metricMeta\.seriesLabel\}: \$\{labels\[topIdx\]\} \$\{this\.formatCrowdPercent\(topValue\)\}`;/, '提示文案未使用完整人群名称');
  assert.match(block, /insightItem\.textContent = `\$\{metricMeta\.seriesLabel\}: 无数据`;/, '无数据文案未使用完整人群名称');
  assert.doesNotMatch(block, /insightItem\.textContent = `\$\{metricMeta\.shortLabel\}:/, '提示文案仍在使用简写标签');
});

test('单元格不再渲染 am-crowd-matrix-cell-title，保持页面更简洁', () => {
  const block = getMagicReportBlock();
  assert.doesNotMatch(block, /title\.className\s*=\s*'am-crowd-matrix-cell-title'/, '单元格标题节点仍在渲染');
});

test('单元格不再显示“部分系列无数据，已按 0 展示”提示', () => {
  const block = getMagicReportBlock();
  assert.doesNotMatch(block, /note\.textContent\s*=\s*'部分系列无数据，已按 0 展示'/, '无数据提示仍在渲染');
});

test('buildMatrixDataset 生成固定 4x8 结构并包含四系列与 raw/noData 字段', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const periods = this\.CROWD_PERIODS\.slice\(\);/, '缺少周期列表初始化');
  assert.match(block, /const groups = this\.CROWD_GROUP_ORDER\.slice\(\);/, '缺少维度列表初始化');
  assert.match(block, /const stableGroupSet = new Set\(/, '缺少省份\/城市稳定标签集合初始化');
  assert.match(block, /const groupSortModeMap = options\?\.groupSortModeMap && typeof options\.groupSortModeMap === 'object'/, '缺少分组排序模式映射读取');
  assert.match(block, /const stableLabelMap = new Map\(\);/, '缺少稳定标签映射缓存');
  assert.match(block, /if \(!stableGroupSet\.has\(normalizedGroupName\)\) return;/, '稳定标签计算未限定在省份\/城市');
  assert.match(block, /const periodSortPriority = Array\.isArray\(this\.CROWD_GROUP_SORT_PERIOD_PRIORITY\) && this\.CROWD_GROUP_SORT_PERIOD_PRIORITY\.length/, '稳定标签排序未读取主周期优先配置');
  assert.match(block, /for \(const period of periodSortPriority\) \{[\s\S]*periodDiff[\s\S]*if \(Math\.abs\(periodDiff\) > 1e-9\) return periodDiff;/, '稳定标签排序未按主周期优先比较');
  assert.match(block, /const scoreDiff = this\.toNumericValue\(rightMeta\.score\) - this\.toNumericValue\(leftMeta\.score\);/, '稳定标签排序未按累计值降序');
  assert.match(block, /const stableLabels = shouldUseStableSort \? stableLabelMap\.get\(normalizedGroupName\) : null;/, '周期渲染未按模式读取稳定标签映射');
  assert.match(block, /const labelList = Array\.isArray\(stableLabels\) && stableLabels\.length[\s\S]*\? stableLabels\.slice\(\)[\s\S]*: \[\];/, '周期标签列表未优先使用稳定顺序');
  assert.match(block, /cell\[\`\$\{metric\}Raw`\] = \[\];/, 'cellData 未动态初始化 raw 字段');
  assert.match(block, /cell\.noData\[metric\] = true;/, 'cellData 未动态初始化 noData 字段');
  assert.match(block, /nextCell\[`\$\{metric\}Raw`\] = rawList\.length \? rawList : rawValues;/, 'cellData 未写入动态 raw 数据');
});

test('buildMatrixDataset 在单指标内做比例归一化并标记缺失数据', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const sum = rawValues\.reduce\(\(acc, value\) => acc \+ this\.toNumericValue\(value\), 0\);/, '未按单指标计算总量');
  assert.match(block, /return \(this\.toNumericValue\(value\) \/ sum\) \* 100;/, '未按单指标归一化到百分比');
  assert.match(block, /const ratioValuesFromPayload = labelList\.map\(\(label\) => \{[\s\S]*current && current\.ratio != null \? this\.toNumericValue\(current\.ratio\) : null;/, '未支持 DMP ratio 透传');
  assert.match(block, /const hasPayloadRatio = ratioValuesFromPayload\.length > 0 && ratioValuesFromPayload\.every\(value => value !== null\);/, '未识别完整 ratio 载荷');
  assert.match(block, /const ratioValues = hasPayloadRatio[\s\S]*\? ratioValuesFromPayload\.map\(value => this\.toNumericValue\(value\)\)[\s\S]*: rawValues\.map/, '有 ratio 载荷时未保留页面百分比');
  assert.match(block, /nextCell\.noData\[metric\] = !labelList\.length \|\| \(hasPayloadRatio[\s\S]*ratioValues\.every\(value => this\.toNumericValue\(value\) <= 0\)[\s\S]*: sum <= 0\);/, '缺失数据未兼容 ratio 载荷');
});

test('DMP 入口按钮 ensure timer 在隐藏页暂停并恢复可见补执行', () => {
  const block = getMagicReportBlock();
  assert.match(block, /dmpCrowdMatrixButtonObserver:\s*null,/, 'DMP 入口按钮缺少 observer 状态');
  assert.match(block, /dmpCrowdMatrixButtonObserverRoot:\s*null,/, 'DMP 入口按钮缺少 observer root 状态');
  assert.match(block, /dmpCrowdMatrixButtonObserverConnected:\s*false,/, 'DMP 入口按钮缺少 observer 连接状态');
  assert.match(block, /dmpCrowdMatrixButtonTimer:\s*0,/, 'DMP 入口按钮缺少 timer 状态');
  assert.match(block, /dmpCrowdMatrixButtonVisibilityHandler:\s*null,/, 'DMP 入口按钮缺少 visibility handler 状态');
  assert.match(block, /dmpCrowdMatrixButtonEnsurePending:\s*false,/, 'DMP 入口按钮缺少 pending ensure 状态');

  const clearTimerSlice = getMagicReportMethodSlice('clearDmpCrowdMatrixButtonTimer', 'clearDmpCrowdMatrixButtonVisibilityHandler');
  assert.match(clearTimerSlice, /if \(!this\.dmpCrowdMatrixButtonTimer\) return;/, 'timer 清理未保持空闲早返回');
  assert.match(clearTimerSlice, /clearTimeout\(this\.dmpCrowdMatrixButtonTimer\);[\s\S]*this\.dmpCrowdMatrixButtonTimer = 0;/, 'timer 清理未统一释放句柄');

  const clearVisibilitySlice = getMagicReportMethodSlice('clearDmpCrowdMatrixButtonVisibilityHandler', 'ensureDmpCrowdMatrixButtonObserver');
  assert.match(clearVisibilitySlice, /const handler = this\.dmpCrowdMatrixButtonVisibilityHandler;/, 'visibility 清理未读取当前 handler');
  assert.match(clearVisibilitySlice, /document\.removeEventListener\('visibilitychange', handler\);/, 'visibility 清理未移除 document 监听');
  assert.match(clearVisibilitySlice, /this\.dmpCrowdMatrixButtonVisibilityHandler = null;/, 'visibility 清理未置空 handler');

  const ensureObserverSlice = getMagicReportMethodSlice('ensureDmpCrowdMatrixButtonObserver', 'disconnectDmpCrowdMatrixButtonObserver');
  assert.match(ensureObserverSlice, /typeof MutationObserver !== 'function'/, 'observer 创建未兼容 MutationObserver 缺失场景');
  assert.match(ensureObserverSlice, /new MutationObserver\(\(\) => \{[\s\S]*this\.scheduleDmpCrowdMatrixButtonEnsure\(120\);[\s\S]*\}\);/, 'MutationObserver callback 未继续走 120ms 调度 helper');

  const disconnectObserverSlice = getMagicReportMethodSlice('disconnectDmpCrowdMatrixButtonObserver', 'connectDmpCrowdMatrixButtonObserver');
  assert.match(disconnectObserverSlice, /this\.dmpCrowdMatrixButtonObserver\.disconnect\(\);/, 'observer 断开 helper 未调用 disconnect');
  assert.match(disconnectObserverSlice, /this\.dmpCrowdMatrixButtonObserverRoot = null;[\s\S]*this\.dmpCrowdMatrixButtonObserverConnected = false;/, 'observer 断开 helper 未释放 root 与连接状态');

  const connectObserverSlice = getMagicReportMethodSlice('connectDmpCrowdMatrixButtonObserver', 'bindDmpCrowdMatrixButtonVisibilityHandler');
  assert.match(connectObserverSlice, /if \(this\.isMagicReportDocumentHidden\(\)\) \{[\s\S]*this\.disconnectDmpCrowdMatrixButtonObserver\(\);[\s\S]*this\.dmpCrowdMatrixButtonEnsurePending = true;[\s\S]*this\.bindDmpCrowdMatrixButtonVisibilityHandler\(\);[\s\S]*return false;/, '隐藏页连接 observer 应断开并登记 pending ensure');
  assert.match(connectObserverSlice, /if \(!this\.isDmpItemInsightCrowdPage\(\)\) \{[\s\S]*this\.disconnectDmpCrowdMatrixButtonObserver\(\);[\s\S]*this\.dmpCrowdMatrixButtonEnsurePending = false;[\s\S]*this\.clearDmpCrowdMatrixButtonVisibilityHandler\(\);[\s\S]*return false;/, '非 DMP 商品洞察页不应连接入口 observer');
  assert.match(connectObserverSlice, /const root = document\.getElementById\('main_app'\) \|\| document\.body \|\| document\.documentElement;/, 'observer 连接未按 main_app/body/documentElement 选择 root');
  assert.match(connectObserverSlice, /this\.dmpCrowdMatrixButtonObserverConnected && this\.dmpCrowdMatrixButtonObserverRoot === root/, 'observer 连接未避免重复 observe 相同 root');
  assert.match(connectObserverSlice, /observer\.observe\(root,\s*\{[\s\S]*childList:\s*true,[\s\S]*subtree:\s*true[\s\S]*\}\);/, 'observer 连接未继续观察 childList/subtree');
  assert.match(connectObserverSlice, /this\.dmpCrowdMatrixButtonObserverRoot = root;[\s\S]*this\.dmpCrowdMatrixButtonObserverConnected = true;[\s\S]*this\.bindDmpCrowdMatrixButtonVisibilityHandler\(\);/, 'observer 连接后未记录 root/connected 并绑定 visibility 生命周期');

  const bindVisibilitySlice = getMagicReportMethodSlice('bindDmpCrowdMatrixButtonVisibilityHandler', 'scheduleDmpCrowdMatrixButtonEnsure');
  assert.match(bindVisibilitySlice, /if \(typeof this\.dmpCrowdMatrixButtonVisibilityHandler === 'function'\) return;/, 'visibility 绑定未避免重复监听');
  assert.match(bindVisibilitySlice, /const shouldEnsureOnVisible = this\.dmpCrowdMatrixButtonEnsurePending === true[\s\S]*\|\| this\.dmpCrowdMatrixButtonObserverConnected === true;[\s\S]*this\.clearDmpCrowdMatrixButtonTimer\(\);[\s\S]*this\.disconnectDmpCrowdMatrixButtonObserver\(\);[\s\S]*this\.dmpCrowdMatrixButtonEnsurePending = shouldEnsureOnVisible;/, '隐藏页 visibility 事件未取消 timer、断开 observer 并保留必要 pending');
  assert.match(bindVisibilitySlice, /const shouldEnsure = this\.dmpCrowdMatrixButtonEnsurePending === true;[\s\S]*this\.dmpCrowdMatrixButtonEnsurePending = false;[\s\S]*this\.connectDmpCrowdMatrixButtonObserver\(\);[\s\S]*if \(shouldEnsure\) this\.ensureDmpCrowdMatrixButton\(\);/, '恢复可见未重连 observer、消费 pending ensure 并补执行入口恢复');
  assert.match(bindVisibilitySlice, /document\.addEventListener\('visibilitychange', this\.dmpCrowdMatrixButtonVisibilityHandler\);/, 'visibility handler 未绑定到 document');

  const scheduleSlice = getMagicReportMethodSlice('scheduleDmpCrowdMatrixButtonEnsure', 'initDmpCrowdMatrixEntry');
  assert.match(scheduleSlice, /scheduleDmpCrowdMatrixButtonEnsure\(delayMs = 120\)/, 'DMP 入口按钮调度默认间隔不应改变');
  assert.match(scheduleSlice, /this\.clearDmpCrowdMatrixButtonTimer\(\);[\s\S]*this\.dmpCrowdMatrixButtonEnsurePending = true;[\s\S]*this\.bindDmpCrowdMatrixButtonVisibilityHandler\(\);/, '调度前未统一清理旧 timer、登记 pending 和绑定可见性恢复');
  assert.match(scheduleSlice, /if \(this\.isMagicReportDocumentHidden\(\)\) \{\s*return;\s*\}/, '隐藏页 schedule 仍可能排 timeout');
  assert.match(scheduleSlice, /this\.dmpCrowdMatrixButtonTimer = setTimeout\(\(\) => \{[\s\S]*this\.dmpCrowdMatrixButtonTimer = 0;[\s\S]*if \(this\.isMagicReportDocumentHidden\(\)\) \{[\s\S]*this\.dmpCrowdMatrixButtonEnsurePending = true;[\s\S]*return;[\s\S]*this\.dmpCrowdMatrixButtonEnsurePending = false;[\s\S]*this\.ensureDmpCrowdMatrixButton\(\);/, 'timer 到期时未按可见性决定暂停或执行 ensure');
  assert.doesNotMatch(scheduleSlice, /if \(this\.dmpCrowdMatrixButtonTimer\) \{[\s\S]*clearTimeout\(this\.dmpCrowdMatrixButtonTimer\);/, 'schedule 不应保留内联 timer 清理旧实现');

  const initSlice = getMagicReportMethodSlice('initDmpCrowdMatrixEntry', 'getDmpVframeRegistry');
  assert.match(initSlice, /if \(this\.isMagicReportDocumentHidden\(\)\) \{[\s\S]*this\.scheduleDmpCrowdMatrixButtonEnsure\(500\);[\s\S]*\} else \{[\s\S]*this\.ensureDmpCrowdMatrixButton\(\);[\s\S]*this\.scheduleDmpCrowdMatrixButtonEnsure\(500\);[\s\S]*\}/, 'DMP 入口初始化未区分隐藏页暂停与可见页立即 ensure');
  assert.match(initSlice, /this\.connectDmpCrowdMatrixButtonObserver\(\);/, 'DMP 入口初始化未通过 observer 连接 helper 管理生命周期');
  assert.doesNotMatch(initSlice, /new MutationObserver/, 'DMP 入口初始化不应再内联创建常驻 observer');
});

test('DMP 入口按钮 ensure 调度实际释放 timer 与 visibility pending', () => {
  const hiddenHarness = createDmpButtonTimerHarness('hidden');
  hiddenHarness.runtime.scheduleDmpCrowdMatrixButtonEnsure(500);
  hiddenHarness.runtime.scheduleDmpCrowdMatrixButtonEnsure(120);
  assert.equal(hiddenHarness.timers.size, 0, '隐藏页重复 schedule 不应排 timeout');
  assert.equal(hiddenHarness.listenerCount(), 1, '隐藏页重复 schedule 不应重复绑定 visibilitychange');
  assert.equal(hiddenHarness.runtime.dmpCrowdMatrixButtonEnsurePending, true, '隐藏页应保留 pending ensure');

  hiddenHarness.setVisibilityState('visible');
  assert.equal(hiddenHarness.runtime.ensureCalls, 1, '恢复可见应只执行一次 pending ensure');
  assert.equal(hiddenHarness.runtime.dmpCrowdMatrixButtonEnsurePending, false, '恢复可见后应消费 pending ensure');
  assert.equal(hiddenHarness.runtime.dmpCrowdMatrixButtonObserverConnected, true, '恢复可见后应连接 observer');
  assert.equal(hiddenHarness.runtime.dmpCrowdMatrixButtonVisibilityHandler !== null, true, '恢复可见后应保留 observer 生命周期 visibility handler');
  assert.equal(hiddenHarness.listenerCount(), 1, '恢复可见后应保留 observer 生命周期 visibilitychange');
  hiddenHarness.setVisibilityState('visible');
  assert.equal(hiddenHarness.runtime.ensureCalls, 1, '无 pending 时 visibilitychange 不应重复执行 ensure');

  const visibleHarness = createDmpButtonTimerHarness('visible');
  visibleHarness.runtime.scheduleDmpCrowdMatrixButtonEnsure(120);
  assert.deepEqual(visibleHarness.getTimerDelays(), [120], '可见页应按 120ms 排 ensure timeout');
  assert.equal(visibleHarness.listenerCount(), 1, '可见页排 timer 时应绑定隐藏页暂停监听');
  visibleHarness.setVisibilityState('hidden');
  assert.equal(visibleHarness.timers.size, 0, '已排 timer 在转隐藏时应被清掉');
  assert.equal(visibleHarness.runtime.dmpCrowdMatrixButtonTimer, 0, '转隐藏后 timer 句柄应归零');
  assert.equal(visibleHarness.runtime.dmpCrowdMatrixButtonEnsurePending, true, '转隐藏后应保留 pending ensure');
  assert.equal(visibleHarness.runtime.ensureCalls, 0, '转隐藏不应执行 ensure');

  visibleHarness.setVisibilityState('visible');
  assert.equal(visibleHarness.runtime.ensureCalls, 1, '恢复可见后应补执行被取消的 ensure');
  assert.equal(visibleHarness.listenerCount(), 1, '补执行后应保留 observer 生命周期 visibilitychange');

  visibleHarness.runtime.scheduleDmpCrowdMatrixButtonEnsure(250);
  visibleHarness.tickTimers();
  assert.equal(visibleHarness.runtime.ensureCalls, 2, '可见页 timer 到期应执行 ensure');
  assert.equal(visibleHarness.runtime.dmpCrowdMatrixButtonEnsurePending, false, '可见页 timer 到期后应清掉 pending');
  assert.equal(visibleHarness.runtime.dmpCrowdMatrixButtonVisibilityHandler !== null, true, '可见页 timer 到期后应保留 observer 生命周期 visibility handler');
  assert.equal(visibleHarness.listenerCount(), 1, '可见页 timer 到期后应保留 visibilitychange');
});

test('DMP 入口按钮 observer 在隐藏页断开并恢复可见重连', () => {
  const hiddenHarness = createDmpButtonTimerHarness('hidden');
  hiddenHarness.runtime.initDmpCrowdMatrixEntry();
  assert.equal(hiddenHarness.runtime.ensureCalls, 0, '隐藏页初始化不应立即 ensure 入口');
  assert.equal(hiddenHarness.timers.size, 0, '隐藏页初始化不应排 ensure timeout');
  assert.equal(hiddenHarness.runtime.dmpCrowdMatrixButtonObserverConnected, false, '隐藏页初始化不应连接 observer');
  assert.equal(hiddenHarness.listenerCount(), 1, '隐藏页初始化应保留恢复可见监听');
  assert.equal(hiddenHarness.getObserver(), null, '隐藏页初始化不应创建 MutationObserver 实例');

  hiddenHarness.setVisibilityState('visible');
  const recoveredObserver = hiddenHarness.getObserver();
  assert.ok(recoveredObserver, '恢复可见后应创建 observer');
  assert.equal(recoveredObserver.connected, true, '恢复可见后应连接 observer');
  assert.equal(recoveredObserver.observeCalls, 1, '恢复可见后应 observe 一次');
  assert.equal(recoveredObserver.options?.childList, true, 'observer 应继续观察 childList');
  assert.equal(recoveredObserver.options?.subtree, true, 'observer 应继续观察 subtree');
  assert.equal(hiddenHarness.runtime.ensureCalls, 1, '恢复可见后应补 ensure 一次');
  assert.equal(hiddenHarness.runtime.dmpCrowdMatrixButtonEnsurePending, false, '恢复可见后应消费 pending ensure');

  recoveredObserver.trigger();
  assert.deepEqual(hiddenHarness.getTimerDelays(), [120], '可见页 mutation 应继续走 120ms debounce');
  hiddenHarness.tickTimers();
  assert.equal(hiddenHarness.runtime.ensureCalls, 2, '可见页 observer debounce 到期应执行 ensure');

  const visibleHarness = createDmpButtonTimerHarness('visible');
  visibleHarness.runtime.initDmpCrowdMatrixEntry();
  const observer = visibleHarness.getObserver();
  assert.ok(observer, '可见页初始化应创建 observer');
  assert.equal(observer.connected, true, '可见页初始化应连接 observer');
  assert.equal(visibleHarness.runtime.dmpCrowdMatrixButtonObserverConnected, true, '可见页初始化应记录 observer connected');
  assert.equal(visibleHarness.runtime.ensureCalls, 1, '可见页初始化应立即 ensure 一次');
  assert.deepEqual(visibleHarness.getTimerDelays(), [500], '可见页初始化仍应排 500ms 延迟 ensure');

  observer.trigger();
  assert.deepEqual(visibleHarness.getTimerDelays(), [120], '可见页 mutation 应替换为 120ms debounce');
  visibleHarness.setVisibilityState('hidden');
  assert.equal(observer.connected, false, 'visible->hidden 应断开 observer');
  assert.equal(visibleHarness.runtime.dmpCrowdMatrixButtonObserverConnected, false, 'visible->hidden 应清掉 connected 状态');
  assert.equal(visibleHarness.runtime.dmpCrowdMatrixButtonObserverRoot, null, 'visible->hidden 应释放 observer root');
  assert.equal(visibleHarness.timers.size, 0, 'visible->hidden 应取消 pending ensure timer');
  assert.equal(visibleHarness.runtime.dmpCrowdMatrixButtonEnsurePending, true, 'visible->hidden 应保留恢复可见 ensure');

  observer.trigger();
  assert.equal(visibleHarness.timers.size, 0, '隐藏期 mutation 不应触发 120ms debounce');
  assert.equal(visibleHarness.runtime.ensureCalls, 1, '隐藏期 mutation 不应执行 ensure');

  visibleHarness.setVisibilityState('visible');
  assert.equal(observer.connected, true, 'hidden->visible 应重连 observer');
  assert.equal(observer.observeCalls, 2, 'hidden->visible 应重新 observe 当前 root');
  assert.equal(visibleHarness.runtime.ensureCalls, 2, 'hidden->visible 应补 ensure 一次');
  assert.equal(visibleHarness.runtime.dmpCrowdMatrixButtonEnsurePending, false, 'hidden->visible 后应消费 pending');

  const nextRoot = { id: 'main_app_2' };
  visibleHarness.setMainAppRoot(nextRoot);
  visibleHarness.runtime.connectDmpCrowdMatrixButtonObserver();
  assert.equal(observer.connected, true, 'root 替换后 observer 应保持连接');
  assert.equal(observer.root, nextRoot, 'root 替换后 observer 应连接新 root');
  assert.equal(observer.observeCalls, 3, 'root 替换后应重新 observe 新 root');
});

test('DMP 人群看板复用现有矩阵框架并以自定义画像标签作为行维度', () => {
  const block = getMagicReportBlock();
  assert.match(block, /isDmpItemInsightCrowdPage\(\)\s*\{[\s\S]*hostname[\s\S]*dmp\.taobao\.com[\s\S]*analysisTab[\s\S]*crowd-insight/, 'DMP 页面守卫缺少目标域名或 crowd-insight 路由判断');
  assert.match(block, /normalizeText\(node\.textContent\) === '切换分析单品'/, 'DMP 入口未定位“切换分析单品”按钮');
  assert.match(block, /button\.dataset\.amDmpCrowdMatrixEntry = '1';/, 'DMP 入口按钮缺少稳定 data 标记');
  assert.match(block, /id = 'am-dmp-crowd-matrix-entry'/, 'DMP 入口按钮缺少稳定 id');
  assert.match(block, /height:\s*var\(--am-dmp-entry-height,\s*28px\);[\s\S]*min-height:\s*var\(--am-dmp-entry-height,\s*28px\);/, 'DMP 入口按钮高度未使用可同步变量');
  assert.match(block, /border-radius:\s*var\(--am-dmp-entry-radius,\s*14px\);/, 'DMP 入口按钮圆角未使用可同步变量');
  assert.match(block, /const findNestedControl = \(node\) => \{[\s\S]*querySelectorAll\('button, \[role="button"\], a'\)[\s\S]*normalizeText\(candidate\.textContent\) === '切换分析单品'[\s\S]*const nestedControl = findNestedControl\(node\);/, 'DMP 入口样式来源未优先读取外层包裹内的原生按钮');
  assert.match(block, /node\.closest\('button, \[role="button"\], a'\)/, 'DMP 入口样式来源未提升到原生可交互控件');
  assert.match(block, /syncDmpCrowdMatrixEntrySize\(button,\s*anchor\)[\s\S]*button\.style\.setProperty\('--am-dmp-entry-height', `\$\{height\}px`\);/, 'DMP 入口按钮未同步原生“切换分析单品”高度');
  assert.match(block, /button\.style\.setProperty\('--am-dmp-entry-radius', style\.borderRadius \|\| `\$\{Math\.round\(height \/ 2\)\}px`\);/, 'DMP 入口按钮未同步原生“切换分析单品”圆角');
  assert.match(block, /refreshMagicReportTitle\(\)[\s\S]*\? '达摩盘单品分析'[\s\S]*: '万能查数输入您想要了解的数据，小万帮您收集'/, 'DMP 弹窗标题未切换为达摩盘单品分析');
  assert.match(block, /data-am-magic-title-text/, '万能查数标题缺少可刷新节点标记');
  assert.match(block, /item-analysis\\\/cold-boot\\\/analysis\\\/crowd\\\/insight/, 'DMP 未按官方 crowd insight VFrame 路径定位');
  assert.match(block, /insight-new\\\/perspective-tags/, 'DMP 未按官方 perspective-tags VFrame 路径定位');
  assert.match(block, /window\.app\?\.vframe\?\.constructor[\s\S]*ctor\.all\(\)/, 'DMP 未使用页面 VFrame registry');
  assert.match(block, /const view = vf\?\.\$v \|\| null;/, 'DMP 未从 Magix VFrame $v 读取真实 View');
  assert.match(block, /const insightView = insightVframe\?\.\$v \|\| null;/, 'DMP insight 运行态未绑定 $v 真实 View');
  assert.match(block, /const perspectiveView = perspectiveVframe\?\.\$v \|\| null;/, 'DMP perspective 运行态未绑定 $v 真实 View');
  assert.match(block, /typeof insightView\.getCrowd !== 'function'/, 'DMP 未校验 getCrowd 官方方法');
  assert.match(block, /typeof perspectiveView\.fetch !== 'function'/, 'DMP 未校验 perspective fetch 官方方法');
  assert.match(block, /customTagKey[\s\S]*customTags6851/, 'DMP 未读取自定义画像标签 key');
  assert.match(block, /const customTags = this\.normalizeDmpTagList\([\s\S]*perspectiveState\.config\?\.\[customTagKey\]/, 'DMP 行维度未从 perspective config 自定义画像标签读取');
  assert.match(block, /findDmpVframeByPath\(\/insight-new\\\/custom-pers-tags\/i\)/, 'DMP 未优先读取官方自定义标签弹窗运行态');
  assert.match(block, /name:\s*'api_category_tags_get'[\s\S]*params:\s*\{\s*tagGroupIds\s*\}/, 'DMP 未用官方 category tags 模型补齐自定义画像标签全集');
  assert.match(block, /context\.tagGroups = await this\.queryDmpCustomPortraitGroups\(runtime,\s*context\);[\s\S]*flatMap\(group => Array\.isArray\(group\?\.tags\) \? group\.tags : \[\]\)/, 'DMP 未把自定义标签弹窗全集补齐到行维度');
  assert.match(block, /throw new Error\('未读取到“自定义画像标签”可分析标签'\);/, 'DMP 缺少自定义画像标签为空时的显式错误');
  assert.match(block, /normalizeDmpTagName\(tagName = ''\)[\s\S]*replace\(\/\\s\+\/g,\s*' '\)\.trim\(\);/, 'DMP 标签名应只清理空白，不应套用旧看板维度归一化');
  assert.match(block, /if \(\/月均消费频次\/\.test\(name\)\) return '月均消费频次';[\s\S]*if \(\/月均消费金额\/\.test\(name\)\) return '月均消费金额';[\s\S]*if \(\/月均消费\/\.test\(name\)\) return '月均消费金额';/, '月均消费频次必须优先于通用月均消费归一化，避免数据合并到金额行');
  assert.match(block, /isDmpMultiValueGroup\(groupName = ''\)[\s\S]*normalizedName === '特征兴趣';/, 'DMP 特征兴趣缺少多选标签识别');
  assert.match(block, /getDmpMultiValueGroupTitle\(groupName = ''\)[\s\S]*多选兴趣覆盖率，同一人可命中多个兴趣，合计可能超过100%/, 'DMP 特征兴趣缺少多选覆盖率说明');
  assert.match(block, /const isDmpMultiValue = this\.isDmpMultiValueGroup\(groupName\);[\s\S]*rowHeader\.classList\.add\('has-dmp-multi-value'\);[\s\S]*badge\.className = 'am-crowd-matrix-row-badge';[\s\S]*badge\.textContent = '多选';/, 'DMP 特征兴趣行头未渲染多选徽标');
  assert.match(block, /#am-magic-report-popup \.am-crowd-matrix-row-badge \{[\s\S]*?border:\s*1px solid rgba\(47,\s*84,\s*235,\s*0\.16\);[\s\S]*?font-size:\s*10px;/, 'DMP 多选徽标缺少低噪声样式');
  assert.match(block, /this\.CROWD_GROUP_ORDER = tags\.map\(tag => this\.normalizeDmpTagName\(tag\.tagName\)\)\.filter\(Boolean\);/, 'DMP 未把自定义画像标签原始名称映射为矩阵行维度');
  assert.match(block, /this\.CROWD_PERIODS = periods;/, 'DMP 未把周期切到页面 INSIGHT_PERIODS');
  assert.match(block, /this\.CROWD_METRICS = this\.DMP_CROWD_METRICS\.slice\(\);/, 'DMP 未把指标切到分析/对比人群');
  assert.match(block, /api_goods_insight_portrait_channel_get/, 'DMP 未读取“添加人群属性”可选项');
  assert.match(block, /findDmpDefaultCompareProperty\(properties = \[\]\)[\s\S]*channelName === '全部渠道' && behaviorName === '成交'[\s\S]*text === '全部渠道-成交'/, 'DMP 未按“全部渠道-成交”查找默认对比人群');
  assert.match(block, /applyDmpDefaultCompareProperty\(context = \{\}, properties = \[\]\)[\s\S]*context\.channelBehaviorListCompare = \[\{ \.\.\.nextProperty \}\];[\s\S]*context\.compareLabel = this\.getDmpCrowdPropertyLabel\(context\.channelBehaviorListCompare\) \|\| '全部渠道-成交';/, 'DMP 未将对比人群默认应用为全部渠道-成交');
  assert.match(block, /context\.availableProperties = await this\.queryDmpAvailableCrowdProperties\(runtime,\s*context\);[\s\S]*this\.applyDmpDefaultCompareProperty\(context,\s*context\.availableProperties\);/, 'DMP 可选人群读取后未应用默认对比人群');
  assert.match(block, /context\.dmpComparePropertyManuallySelected = true;/, 'DMP 手动选择对比人群后缺少防止默认值覆盖的标记');
  assert.match(block, /btn\.className = 'am-crowd-matrix-legend-toggle am-dmp-crowd-metric-button';[\s\S]*btn\.dataset\.crowdMetric = metric;/, 'DMP 分析/对比人群未保留看板系列显隐按钮形态');
  assert.match(block, /trigger\.dataset\.dmpCrowdDropdownTrigger = metric;/, 'DMP 系列按钮内缺少定制下拉触发区');
  assert.match(block, /document\.body\.appendChild\(dropdown\);[\s\S]*this\.dmpCrowdPropertyDropdownPortalEl = dropdown;/, 'DMP 定制下拉必须挂到 body 顶层 portal，避免被看板内部层级遮挡');
  assert.match(block, /\.am-dmp-crowd-dropdown-portal[\s\S]*position:\s*fixed;[\s\S]*z-index:\s*2147483605;/, 'DMP 定制下拉 portal 缺少 fixed 顶层定位样式');
  assert.match(block, /const anchor = trigger\.closest\('\.am-dmp-crowd-metric-button'\) \|\| trigger;[\s\S]*const rect = anchor\.getBoundingClientRect\(\);/, 'DMP 下拉未以整颗分析/对比按钮左侧作为定位锚点');
  assert.match(block, /dataset\.dmpCrowdChannel = group\.channelKey;[\s\S]*dataset\.dmpCrowdBehavior = item\.behaviorKey;/, 'DMP 定制下拉未按渠道/行为两列渲染');
  assert.match(block, /target\.closest\('\[data-dmp-crowd-dropdown-trigger\]'\)[\s\S]*target\.closest\('\[data-dmp-crowd-channel\]'\)[\s\S]*target\.closest\('\[data-dmp-crowd-behavior\]'\)/, 'DMP 定制下拉点击链路未覆盖触发、渠道与行为');
  assert.doesNotMatch(block, /am-dmp-crowd-selector-select/, 'DMP 人群选择不应退化为原生 select 替代按钮');
  assert.doesNotMatch(block, /title\.textContent = '标签全集';/, 'DMP 看板不应再渲染“标签全集”芯片区');
  assert.match(block, /api_analysis_tag_\$id_post/, 'DMP 未使用官方自定义画像标签分布模型');
  assert.match(block, /buildDmpTagAnalysisParams\(selectTagOptionSet\)[\s\S]*version:\s*'2\.0'[\s\S]*selectTagOptionSet:\s*selectTagOptionSet \|\| \{\}[\s\S]*needUnknown:\s*false[\s\S]*ext:\s*\{\}/, 'DMP 标签分布请求未按官方 body 包装 selectTagOptionSet');
  assert.match(block, /params:\s*this\.buildDmpTagAnalysisParams\(analysisObj\)/, 'DMP 分析人群标签请求未使用官方 body 形状');
  assert.match(block, /params:\s*this\.buildDmpTagAnalysisParams\(compareObj\)/, 'DMP 对比人群标签请求未使用官方 body 形状');
  assert.match(block, /isJson:\s*true/, 'DMP 标签分布请求未按 JSON 模型提交');
  assert.match(block, /runtime\.insightView\.getCrowd\.call\([\s\S]*String\(period\)/, 'DMP 未按周期调用官方 getCrowd');
  assert.match(block, /toDmpRateNumericValue\(rawValue\)[\s\S]*Number\(String\(rawValue \?\? ''\)\.replace\(\/,\/g,\s*''\)\.trim\(\)\)[\s\S]*return this\.toNumericValue\(rawValue\);/, 'DMP rate 未优先用 Number 解析科学计数法');
  assert.match(block, /const rateValue = this\.toDmpRateNumericValue\(item\.rate[\s\S]*const rate = rateValue > 1 \? rateValue : rateValue \* 100;/, 'DMP rate 小数占比未转换为矩阵百分比单位');
  assert.match(block, /value:\s*rate,[\s\S]*ratio:\s*rate,[\s\S]*raw:\s*String\(raw/, 'DMP 未保留 rate 百分比和 optionNum 原始值');
  assert.match(block, /runTasksWithConcurrency\(taskFns,\s*1\)/, 'DMP 周期请求应串行执行以降低页面风控风险');
  assert.match(block, /is-dmp-crowd-mode/, 'DMP 弹窗缺少模式类');
  assert.match(block, /this\.matrixCampaignNameEl\.textContent = `商品：\$\{context\.itemTitle \|\| '未识别'\}`;[\s\S]*this\.matrixCampaignIdEl\.textContent = `商品ID：\$\{context\.itemId \|\| '--'\}`;/, 'DMP 商品名与商品ID未使用左侧上下文信息');
  assert.match(block, /this\.matrixCampaignEl\.style\.setProperty\('--am-dmp-item-id-width', `\$\{width\}px`\);/, 'DMP 商品ID宽度未同步为商品名省略约束');
});

test('DMP 人群属性下拉二次定位在隐藏页暂停并随关闭释放', () => {
  const block = getMagicReportBlock();
  assert.match(
    block,
    /dmpCrowdPropertyDropdownPositionFrame:\s*0,[\s\S]*dmpCrowdPropertyDropdownPositionCancel:\s*null,[\s\S]*dmpCrowdPropertyDropdownPositionVisibilityHandler:\s*null,[\s\S]*dmpCrowdPropertyDropdownPositionPending:\s*false,/,
    'DMP 下拉定位缺少 frame、cancel、visibility handler 或 pending 状态'
  );

  assert.match(
    getMagicReportMethodSlice('removeDmpCrowdPropertyDropdownPortal', 'clearDmpCrowdPropertyDropdownPositionFrame'),
    /this\.clearDmpCrowdPropertyDropdownPositionState\(\);[\s\S]*this\.dmpCrowdPropertyDropdownPortalEl = null;/,
    '移除 DMP 下拉 portal 前应清理定位 frame/listener/pending 状态'
  );
  assert.match(
    getMagicReportMethodSlice('clearDmpCrowdPropertyDropdownPositionFrame', 'clearDmpCrowdPropertyDropdownPositionVisibilityHandler'),
    /if \(!this\.dmpCrowdPropertyDropdownPositionFrame\) return;[\s\S]*cancelFrame\(this\.dmpCrowdPropertyDropdownPositionFrame\);[\s\S]*this\.dmpCrowdPropertyDropdownPositionFrame = 0;[\s\S]*this\.dmpCrowdPropertyDropdownPositionCancel = null;/,
    'DMP 下拉定位 frame 清理应取消 rAF/fallback 并释放 cancel 引用'
  );
  assert.match(
    getMagicReportMethodSlice('clearDmpCrowdPropertyDropdownPositionVisibilityHandler', 'clearDmpCrowdPropertyDropdownPositionState'),
    /document\.removeEventListener\('visibilitychange', handler\);[\s\S]*this\.dmpCrowdPropertyDropdownPositionVisibilityHandler = null;/,
    'DMP 下拉定位 visibility handler 清理应解绑 document 监听'
  );
  assert.match(
    getMagicReportMethodSlice('clearDmpCrowdPropertyDropdownPositionState', 'bindDmpCrowdPropertyDropdownPositionVisibilityHandler'),
    /this\.clearDmpCrowdPropertyDropdownPositionFrame\(\);[\s\S]*this\.clearDmpCrowdPropertyDropdownPositionVisibilityHandler\(\);[\s\S]*this\.dmpCrowdPropertyDropdownPositionPending = false;/,
    'DMP 下拉定位完整清理应释放 frame、listener 和 pending'
  );

  const bindSlice = getMagicReportMethodSlice('bindDmpCrowdPropertyDropdownPositionVisibilityHandler', 'scheduleDmpCrowdPropertyDropdownPositionUpdate');
  assert.match(bindSlice, /if \(typeof this\.dmpCrowdPropertyDropdownPositionVisibilityHandler === 'function'\) return;/, 'DMP 下拉定位 visibility handler 未避免重复绑定');
  assert.match(bindSlice, /if \(this\.isMagicReportDocumentHidden\(\)\) \{[\s\S]*this\.clearDmpCrowdPropertyDropdownPositionFrame\(\);[\s\S]*this\.dmpCrowdPropertyDropdownPositionPending = this\.dmpCrowdPropertyDropdownPortalEl instanceof HTMLElement[\s\S]*&& !!this\.dmpCrowdPropertyDropdownMetric;[\s\S]*return;/, '隐藏页 visibility 事件应取消待执行定位并保留 pending');
  assert.match(bindSlice, /if \(this\.dmpCrowdPropertyDropdownPositionPending\) \{[\s\S]*this\.scheduleDmpCrowdPropertyDropdownPositionUpdate\(\);[\s\S]*return;[\s\S]*this\.clearDmpCrowdPropertyDropdownPositionVisibilityHandler\(\);/, '恢复可见时应按 pending 补排定位，否则释放监听');

  const scheduleSlice = getMagicReportMethodSlice('scheduleDmpCrowdPropertyDropdownPositionUpdate', 'getDmpCrowdDropdownViewModel');
  assert.match(scheduleSlice, /this\.clearDmpCrowdPropertyDropdownPositionFrame\(\);[\s\S]*this\.dmpCrowdPropertyDropdownPositionPending = true;[\s\S]*this\.bindDmpCrowdPropertyDropdownPositionVisibilityHandler\(\);[\s\S]*if \(this\.isMagicReportDocumentHidden\(\)\) return;/, 'DMP 下拉定位调度应先清旧 frame、登记 pending，并在隐藏页不排 frame/timeout');
  assert.match(scheduleSlice, /const runPositionUpdate = \(\) => \{[\s\S]*this\.dmpCrowdPropertyDropdownPositionFrame = 0;[\s\S]*this\.dmpCrowdPropertyDropdownPositionCancel = null;[\s\S]*if \(this\.isMagicReportDocumentHidden\(\)\) \{[\s\S]*this\.dmpCrowdPropertyDropdownPositionPending = this\.dmpCrowdPropertyDropdownPortalEl instanceof HTMLElement[\s\S]*&& !!this\.dmpCrowdPropertyDropdownMetric;[\s\S]*return;[\s\S]*this\.dmpCrowdPropertyDropdownPositionPending = false;[\s\S]*this\.clearDmpCrowdPropertyDropdownPositionVisibilityHandler\(\);[\s\S]*this\.positionDmpCrowdPropertyDropdownPortal\(\);/, 'DMP 下拉定位 frame 到期应按可见性决定暂停或执行定位并释放监听');
  assert.match(scheduleSlice, /typeof requestAnimationFrame === 'function' && typeof cancelAnimationFrame === 'function'[\s\S]*this\.dmpCrowdPropertyDropdownPositionCancel = cancelAnimationFrame;[\s\S]*requestAnimationFrame\(runPositionUpdate\)[\s\S]*this\.dmpCrowdPropertyDropdownPositionCancel = clearTimeout;[\s\S]*setTimeout\(runPositionUpdate,\s*16\);/, 'DMP 下拉定位应使用可取消 rAF，并提供 16ms fallback timeout');

  const renderSlice = getMagicReportMethodSlice('renderDmpCrowdPropertyDropdownPortal', 'renderDmpCrowdMetricButtons');
  assert.match(renderSlice, /this\.positionDmpCrowdPropertyDropdownPortal\(\);[\s\S]*this\.scheduleDmpCrowdPropertyDropdownPositionUpdate\(\);/, 'DMP 下拉 portal 渲染应保留同步定位并改用统一 helper 做二次定位');
  assert.doesNotMatch(block, /requestAnimationFrame\(\(\) => this\.positionDmpCrowdPropertyDropdownPortal\(\)\)/, 'DMP 下拉不应继续裸排不可取消的二次定位 rAF');
  assert.match(
    getMagicReportMethodSlice('clearMagicRuntimeCaches', 'releasePopupResources'),
    /this\.dmpCrowdPropertyDropdownMetric = '';[\s\S]*this\.dmpCrowdPropertyDropdownChannelKey = '';[\s\S]*this\.removeDmpCrowdPropertyDropdownPortal\(\);/,
    '释放 MagicReport 运行态时应清空 DMP 下拉选择态并移除 body portal'
  );

  const visibleHarness = createDmpDropdownPositionHarness('visible');
  visibleHarness.runtime.scheduleDmpCrowdPropertyDropdownPositionUpdate();
  assert.equal(visibleHarness.frames.size, 1, '可见页应排一个二次定位 rAF');
  assert.equal(visibleHarness.timers.size, 0, '有 rAF 时不应排 fallback timeout');
  assert.equal(visibleHarness.listenerCount(), 1, '可见页等待定位时应绑定 visibilitychange');
  assert.equal(visibleHarness.runtime.dmpCrowdPropertyDropdownPositionPending, true, '定位执行前应保留 pending');
  assert.equal(visibleHarness.tickNextFrame(), true, '应能触发二次定位 rAF');
  assert.equal(visibleHarness.runtime.positionCalls, 1, '可见页 rAF 到期应执行一次二次定位');
  assert.equal(visibleHarness.runtime.dmpCrowdPropertyDropdownPositionPending, false, '二次定位后应消费 pending');
  assert.equal(visibleHarness.listenerCount(), 0, '二次定位后应解绑 visibilitychange');

  const hiddenHarness = createDmpDropdownPositionHarness('hidden');
  hiddenHarness.runtime.scheduleDmpCrowdPropertyDropdownPositionUpdate();
  assert.equal(hiddenHarness.frames.size, 0, '隐藏页不应排 rAF');
  assert.equal(hiddenHarness.timers.size, 0, '隐藏页不应排 fallback timeout');
  assert.equal(hiddenHarness.listenerCount(), 1, '隐藏页应保留恢复可见监听');
  assert.equal(hiddenHarness.runtime.dmpCrowdPropertyDropdownPositionPending, true, '隐藏页应保留 pending 定位');
  hiddenHarness.setVisibilityState('visible');
  assert.equal(hiddenHarness.frames.size, 1, '恢复可见后应补排一次 rAF');
  assert.equal(hiddenHarness.tickNextFrame(), true, '恢复可见后应能触发补排定位');
  assert.equal(hiddenHarness.runtime.positionCalls, 1, '恢复可见后应执行一次定位');
  assert.equal(hiddenHarness.listenerCount(), 0, '补定位后应释放 visibilitychange');

  const cancelHarness = createDmpDropdownPositionHarness('visible');
  cancelHarness.runtime.scheduleDmpCrowdPropertyDropdownPositionUpdate();
  assert.equal(cancelHarness.frames.size, 1, '转隐藏前应存在 pending rAF');
  cancelHarness.setVisibilityState('hidden');
  assert.equal(cancelHarness.frames.size, 0, 'visible->hidden 应取消待执行 rAF');
  assert.equal(cancelHarness.runtime.dmpCrowdPropertyDropdownPositionPending, true, 'visible->hidden 应保留 pending 定位');
  cancelHarness.setVisibilityState('visible');
  assert.equal(cancelHarness.frames.size, 1, '再次可见后应重新补排 rAF');
  assert.equal(cancelHarness.tickNextFrame(), true, '重新补排的 rAF 应可执行');
  assert.equal(cancelHarness.runtime.positionCalls, 1, 'visible->hidden->visible 后应只补定位一次');

  const fallbackHarness = createDmpDropdownPositionHarness('visible', { noRaf: true });
  fallbackHarness.runtime.scheduleDmpCrowdPropertyDropdownPositionUpdate();
  assert.deepEqual(fallbackHarness.getTimerDelays(), [16], '无 rAF 时应排一个 16ms fallback timeout');
  fallbackHarness.setVisibilityState('hidden');
  assert.equal(fallbackHarness.timers.size, 0, 'fallback timeout 在转隐藏时应取消');
  assert.equal(fallbackHarness.runtime.dmpCrowdPropertyDropdownPositionPending, true, 'fallback 转隐藏后应保留 pending');
  fallbackHarness.setVisibilityState('visible');
  assert.deepEqual(fallbackHarness.getTimerDelays(), [16], '恢复可见后应重新排 16ms fallback timeout');
  assert.equal(fallbackHarness.tickNextTimer(), true, 'fallback timeout 应能触发定位');
  assert.equal(fallbackHarness.runtime.positionCalls, 1, 'fallback timeout 到期应执行定位');
  assert.equal(fallbackHarness.listenerCount(), 0, 'fallback 定位后应释放 visibilitychange');

  const removeHarness = createDmpDropdownPositionHarness('visible');
  const portalEl = removeHarness.runtime.dmpCrowdPropertyDropdownPortalEl;
  removeHarness.runtime.scheduleDmpCrowdPropertyDropdownPositionUpdate();
  removeHarness.runtime.removeDmpCrowdPropertyDropdownPortal();
  assert.equal(removeHarness.frames.size, 0, '移除 portal 应取消 pending rAF');
  assert.equal(removeHarness.listenerCount(), 0, '移除 portal 应解绑 visibilitychange');
  assert.equal(removeHarness.runtime.dmpCrowdPropertyDropdownPositionPending, false, '移除 portal 应清掉 pending');
  assert.equal(removeHarness.runtime.dmpCrowdPropertyDropdownPortalEl, null, '移除 portal 后应置空 portal 引用');
  assert.equal(portalEl.removed, true, '移除 portal 应调用 DOM remove');

  const clearHarness = createDmpDropdownPositionHarness('visible');
  const clearPortalEl = clearHarness.runtime.dmpCrowdPropertyDropdownPortalEl;
  clearHarness.runtime.scheduleDmpCrowdPropertyDropdownPositionUpdate();
  clearHarness.runtime.clearMagicRuntimeCaches();
  assert.equal(clearHarness.frames.size, 0, '运行态清理应取消 DMP 下拉 pending rAF');
  assert.equal(clearHarness.listenerCount(), 0, '运行态清理应解绑 DMP 下拉 visibilitychange');
  assert.equal(clearHarness.runtime.dmpCrowdPropertyDropdownPositionPending, false, '运行态清理应清掉 DMP 下拉 pending');
  assert.equal(clearHarness.runtime.dmpCrowdPropertyDropdownMetric, '', '运行态清理应清空 DMP 下拉 metric');
  assert.equal(clearHarness.runtime.dmpCrowdPropertyDropdownChannelKey, '', '运行态清理应清空 DMP 下拉 channel');
  assert.equal(clearHarness.runtime.dmpCrowdPropertyDropdownPortalEl, null, '运行态清理应置空 body portal 引用');
  assert.equal(clearPortalEl.removed, true, '运行态清理应移除 body portal DOM');
});

test('单元格柱高按该单元格最高值自适应缩放，避免整体过矮', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const visibleMetrics = metrics\.filter\(metric => this\.getCrowdMetricVisible\(metric\)\);/, '未按可见系列过滤最高柱值计算范围');
  assert.match(block, /const renderMetrics = visibleMetrics\.length \? visibleMetrics : metrics;[\s\S]*const cellMaxRatio = renderMetrics\.reduce\(\(maxValue, metric\) => \{[\s\S]*return Math\.max\(maxValue, currentMax\);[\s\S]*\}, 0\);/, '未按可见系列计算单元格内最高柱值');
  assert.match(block, /const normalizedMax = cellMaxRatio > 0 \? cellMaxRatio : 1;/, '缺少单元格缩放基准');
  assert.match(block, /const barHeight = `\$\{Math\.max\(0, Math\.min\(100, \(ratio \/ normalizedMax\) \* 100\)\)\}%`;/, '柱高目标值未按单元格最高值计算');
});

test('切换显示与隐藏会触发重绘动画', () => {
  const block = getMagicReportBlock();
  const cellBlock = getMagicReportMethodSlice('createCrowdMatrixCell', 'renderCrowdMatrixCharts');
  assert.match(block, /this\.renderCrowdMatrixCharts\(this\.crowdMatrixDataset,\s*\{\s*animate:\s*true\s*\}\);/, '显示隐藏切换未触发带动画重绘');
  assert.match(block, /chart\.style\.setProperty\('--am-crowd-metric-visible-count', String\(visibleMetricCount\)\);/, '切换后未写入可见系列数量，柱宽无法自适应');
  assert.match(block, /width:\s*clamp\(\s*8px,\s*calc\(\(100% - \(var\(--am-crowd-visible-metrics\) - 1\) \* var\(--am-crowd-bar-gap\)\) \/ var\(--am-crowd-visible-metrics\)\),\s*36px\s*\);/, '柱宽未按可见系列数量做自适应公式');
  assert.match(block, /ratioLabel\.className = 'am-crowd-matrix-bar-ratio';/, '柱状图未渲染占比标签节点');
  assert.match(block, /const ratioText = this\.formatCrowdPercent\(ratio\);[\s\S]*ratioLabel\.textContent = ratioText === '0%' \? '' : ratioText;/, '占比标签未隐藏 0% 可见文本');
  assert.match(block, /am-crowd-matrix-grid\.am-show-ratio-values \.am-crowd-matrix-bar-ratio/, '缺少占比显示态样式选择器');
  assert.match(block, /am-crowd-matrix-grid\.am-hide-insights \.am-crowd-matrix-insights/, '缺少提示区隐藏态样式选择器');
  assert.match(block, /am-crowd-matrix-grid\.am-hide-insights \.am-crowd-matrix-cell-chart[\s\S]*min-height:\s*clamp\(186px,\s*22vh,\s*276px\);/, '隐藏提示后未压缩单元格高度');
  assert.match(block, /am-crowd-matrix-grid\.am-hide-insights \.am-crowd-matrix-chart[\s\S]*min-height:\s*clamp\(136px,\s*17vh,\s*208px\);/, '隐藏提示后未压缩图表区高度');
  assert.match(block, /am-crowd-matrix-insights[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\);/, '提示区未改为单列逐行显示');
  assert.match(block, /am-crowd-matrix-insight-item[\s\S]*justify-content:\s*flex-start;[\s\S]*text-align:\s*left;/, '提示文案未改为左对齐逐行阅读');
  assert.match(cellBlock, /if \(animateBars\) \{[\s\S]*fill\.style\.height = '0%';[\s\S]*fill\.style\.opacity = '0\.38';[\s\S]*this\.queueCrowdMatrixBarAnimation\(fill,\s*barHeight\);/, '柱状图切换动画应保持初始状态，并通过统一队列调度高度恢复');
  assert.doesNotMatch(cellBlock, /requestAnimationFrame\(applyHeight\)|setTimeout\(applyHeight,\s*16\)/, '柱状图切换动画不应继续为每根柱子单独排 rAF 或 fallback timeout');
});

test('人群矩阵柱状条动画使用单帧批量调度并随重绘释放', () => {
  const block = getMagicReportBlock();
  assert.match(
    block,
    /crowdMatrixBarAnimationFrame:\s*0,[\s\S]*crowdMatrixBarAnimationCancel:\s*null,[\s\S]*crowdMatrixBarAnimationVisibilityHandler:\s*null,[\s\S]*crowdMatrixBarAnimationQueue:\s*\[\],/,
    '柱状条动画缺少 frame、cancel、visibility handler 或 pending queue 状态'
  );
  assert.match(
    getMagicReportMethodSlice('clearCrowdMatrixBarAnimationFrame', 'clearCrowdMatrixBarAnimationVisibilityHandler'),
    /if \(this\.crowdMatrixBarAnimationFrame\) \{[\s\S]*cancelFrame\(this\.crowdMatrixBarAnimationFrame\);[\s\S]*this\.crowdMatrixBarAnimationFrame = 0;[\s\S]*this\.crowdMatrixBarAnimationCancel = null;/,
    '柱状条动画应支持统一取消 frame/timeout'
  );
  assert.match(
    getMagicReportMethodSlice('clearCrowdMatrixBarAnimationVisibilityHandler', 'clearCrowdMatrixBarAnimation'),
    /document\.removeEventListener\('visibilitychange', handler\);[\s\S]*this\.crowdMatrixBarAnimationVisibilityHandler = null;/,
    '柱状条动画应支持释放 visibilitychange handler'
  );
  assert.match(
    getMagicReportMethodSlice('clearCrowdMatrixBarAnimation', 'flushCrowdMatrixBarAnimationQueue'),
    /this\.clearCrowdMatrixBarAnimationFrame\(\);[\s\S]*this\.clearCrowdMatrixBarAnimationVisibilityHandler\(\);[\s\S]*this\.crowdMatrixBarAnimationQueue = \[\];/,
    '柱状条动画完整清理应取消 frame、释放 visibility handler 并清空队列'
  );
  assert.match(
    getMagicReportMethodSlice('flushCrowdMatrixBarAnimationQueue', 'bindCrowdMatrixBarAnimationVisibilityHandler'),
    /includeDisconnected = options\.includeDisconnected === true;[\s\S]*this\.crowdMatrixBarAnimationQueue\.splice\(0\)[\s\S]*if \(!\(fill instanceof HTMLElement\) \|\| \(!includeDisconnected && !fill\.isConnected\)\) return;[\s\S]*fill\.style\.height = entry\.height;[\s\S]*fill\.style\.opacity = '1';/,
    '柱状条动画 flush 应批量写入最终高度，并允许隐藏页处理尚未连接的新 fill'
  );
  assert.match(
    getMagicReportMethodSlice('bindCrowdMatrixBarAnimationVisibilityHandler', 'scheduleCrowdMatrixBarAnimation'),
    /if \(typeof this\.crowdMatrixBarAnimationVisibilityHandler === 'function'\) return;[\s\S]*if \(!this\.isMagicReportDocumentHidden\(\)\) return;[\s\S]*this\.clearCrowdMatrixBarAnimationFrame\(\);[\s\S]*this\.clearCrowdMatrixBarAnimationVisibilityHandler\(\);[\s\S]*this\.flushCrowdMatrixBarAnimationQueue\(\);[\s\S]*document\.addEventListener\('visibilitychange', this\.crowdMatrixBarAnimationVisibilityHandler\);/,
    '柱状条动画等待期间转隐藏时应取消 pending frame 并 flush 队列'
  );
  assert.match(
    getMagicReportMethodSlice('scheduleCrowdMatrixBarAnimation', 'queueCrowdMatrixBarAnimation'),
    /if \(this\.isMagicReportDocumentHidden\(\)\) \{[\s\S]*this\.clearCrowdMatrixBarAnimationFrame\(\);[\s\S]*this\.clearCrowdMatrixBarAnimationVisibilityHandler\(\);[\s\S]*this\.flushCrowdMatrixBarAnimationQueue\(\{ includeDisconnected: true \}\);[\s\S]*return;[\s\S]*if \(this\.crowdMatrixBarAnimationFrame\) return;[\s\S]*const applyQueuedBars = \(\) => \{[\s\S]*this\.crowdMatrixBarAnimationFrame = 0;[\s\S]*this\.crowdMatrixBarAnimationCancel = null;[\s\S]*this\.clearCrowdMatrixBarAnimationVisibilityHandler\(\);[\s\S]*this\.flushCrowdMatrixBarAnimationQueue\(\);[\s\S]*this\.bindCrowdMatrixBarAnimationVisibilityHandler\(\);[\s\S]*requestAnimationFrame\(applyQueuedBars\)[\s\S]*setTimeout\(applyQueuedBars,\s*16\);/,
    '柱状条动画应在隐藏页不排 frame/timeout，可见页最多排一个 rAF/fallback timeout'
  );
  assert.match(
    getMagicReportMethodSlice('queueCrowdMatrixBarAnimation', 'ensureCrowdMatrixHoverTip'),
    /if \(!\(fill instanceof HTMLElement\)\) return;[\s\S]*this\.crowdMatrixBarAnimationQueue\.push\(\{[\s\S]*fill,[\s\S]*height: String\(height \|\| '0%'\)[\s\S]*\}\);[\s\S]*this\.scheduleCrowdMatrixBarAnimation\(\);/,
    '柱状条动画入队应记录 fill/height 并复用统一调度'
  );
  assert.match(
    getMagicReportMethodSlice('renderCrowdMatrixCharts', 'snapshotPopupLayout'),
    /this\.hideCrowdMatrixHoverTip\(\);[\s\S]*this\.clearCrowdMatrixBarAnimation\(\);[\s\S]*this\.matrixGridEl\.innerHTML = '';/,
    '人群矩阵重绘前应取消旧柱状条 pending 动画，避免旧 DOM 被 frame 保留'
  );
  assert.match(
    getMagicReportMethodSlice('clearMagicRuntimeCaches', 'releasePopupResources'),
    /this\.clearCrowdMatrixStateHideState\(\);[\s\S]*this\.clearCrowdMatrixBarAnimation\(\);/,
    '释放 MagicReport 运行态时应清理柱状条 pending 动画'
  );

  const harness = createCrowdMatrixBarAnimationHarness();
  const fillA = harness.createFill();
  const fillB = harness.createFill();
  const fillDisconnected = harness.createFill();
  fillDisconnected.isConnected = false;
  harness.runtime.queueCrowdMatrixBarAnimation(fillA, '52%');
  harness.runtime.queueCrowdMatrixBarAnimation(fillB, '87%');
  harness.runtime.queueCrowdMatrixBarAnimation(fillDisconnected, '99%');
  assert.equal(harness.frames.size, 1, '多根柱子应合并为一个 requestAnimationFrame');
  assert.equal(harness.timers.size, 0, '有 rAF 时不应排 fallback timeout');
  assert.equal(harness.listenerCount(), 1, '可见页等待动画帧时应绑定 visibilitychange');
  assert.equal(harness.runtime.crowdMatrixBarAnimationQueue.length, 3, '触发前应保留所有 pending fill');
  assert.equal(harness.tickNextFrame(), true, '应能触发批量柱状条动画帧');
  assert.equal(fillA.style.height, '52%', '批量帧应写入第一根柱子高度');
  assert.equal(fillA.style.opacity, '1', '批量帧应恢复第一根柱子透明度');
  assert.equal(fillB.style.height, '87%', '批量帧应写入第二根柱子高度');
  assert.equal(fillDisconnected.style.height, undefined, '断开连接的旧柱子不应再被写入');
  assert.equal(harness.runtime.crowdMatrixBarAnimationFrame, 0, '批量帧触发后应归零 frame 句柄');
  assert.equal(harness.runtime.crowdMatrixBarAnimationQueue.length, 0, '批量帧触发后应释放队列');
  assert.equal(harness.listenerCount(), 0, '批量帧触发后应释放 visibilitychange');

  const fallbackHarness = createCrowdMatrixBarAnimationHarness({ noRaf: true });
  const fallbackFill = fallbackHarness.createFill();
  fallbackHarness.runtime.queueCrowdMatrixBarAnimation(fallbackFill, '44%');
  fallbackHarness.runtime.queueCrowdMatrixBarAnimation(fallbackHarness.createFill(), '66%');
  assert.deepEqual(fallbackHarness.getTimerDelays(), [16], '无 rAF 时多根柱子也只应排一个 16ms fallback timeout');
  assert.equal(fallbackHarness.listenerCount(), 1, 'fallback 等待期间也应监听转隐藏');
  assert.equal(fallbackHarness.tickNextTimer(), true, '应能触发 fallback 批量动画 timeout');
  assert.equal(fallbackFill.style.height, '44%', 'fallback timeout 应批量写入柱子高度');
  assert.equal(fallbackHarness.runtime.crowdMatrixBarAnimationQueue.length, 0, 'fallback 触发后应释放队列');
  assert.equal(fallbackHarness.listenerCount(), 0, 'fallback 触发后应释放 visibilitychange');

  const hiddenHarness = createCrowdMatrixBarAnimationHarness({ visibilityState: 'hidden' });
  const hiddenFill = hiddenHarness.createFill();
  hiddenFill.isConnected = false;
  hiddenHarness.runtime.queueCrowdMatrixBarAnimation(hiddenFill, '58%');
  assert.equal(hiddenHarness.frames.size, 0, '隐藏页不应排 requestAnimationFrame');
  assert.equal(hiddenHarness.timers.size, 0, '隐藏页不应排 fallback timeout');
  assert.equal(hiddenHarness.listenerCount(), 0, '隐藏页直接 flush 后不应残留 visibilitychange');
  assert.equal(hiddenFill.style.height, '58%', '隐藏页应直接写入最终柱高');
  assert.equal(hiddenFill.style.opacity, '1', '隐藏页应直接恢复最终透明度');
  assert.equal(hiddenHarness.runtime.crowdMatrixBarAnimationQueue.length, 0, '隐藏页 flush 后应释放队列');

  const switchHarness = createCrowdMatrixBarAnimationHarness();
  const switchFill = switchHarness.createFill();
  switchHarness.runtime.queueCrowdMatrixBarAnimation(switchFill, '71%');
  assert.equal(switchHarness.frames.size, 1, '转隐藏前应存在 pending rAF');
  assert.equal(switchHarness.listenerCount(), 1, '转隐藏前应监听 visibilitychange');
  switchHarness.setVisibilityState('hidden');
  assert.equal(switchHarness.frames.size, 0, '转隐藏应取消 pending rAF');
  assert.equal(switchHarness.listenerCount(), 0, '转隐藏 flush 后应释放 visibilitychange');
  assert.equal(switchFill.style.height, '71%', '转隐藏应直接写入 pending 柱高');
  assert.equal(switchHarness.runtime.crowdMatrixBarAnimationQueue.length, 0, '转隐藏后应释放 pending 队列');

  const clearHarness = createCrowdMatrixBarAnimationHarness();
  const clearFill = clearHarness.createFill();
  clearHarness.runtime.queueCrowdMatrixBarAnimation(clearFill, '33%');
  assert.equal(clearHarness.frames.size, 1, '清理前应存在 pending frame');
  assert.equal(clearHarness.listenerCount(), 1, '清理前应存在 visibilitychange');
  clearHarness.runtime.clearMagicRuntimeCaches();
  assert.equal(clearHarness.frames.size, 0, '运行态清理应取消 pending frame');
  assert.equal(clearHarness.listenerCount(), 0, '运行态清理应释放 visibilitychange');
  assert.equal(clearHarness.runtime.crowdMatrixBarAnimationQueue.length, 0, '运行态清理应释放 pending 队列');
  assert.equal(clearFill.style.height, undefined, '被取消的 pending frame 不应写旧柱子 DOM');
});

test('全部失败时展示统一失败态并提供重试入口', () => {
  const block = getMagicReportBlock();
  assert.match(block, /if \(!successResults\.length\) \{[\s\S]*setCrowdMatrixStatus\('人群看板加载失败，请稍后重试',\s*'error',\s*\{[\s\S]*showRetry:\s*true/, '全失败态或重试按钮逻辑缺失');
  assert.match(block, /this\.matrixRetryBtn\.addEventListener\('click',\s*\(\) => \{[\s\S]*ensureCrowdMatrixLoaded\(true\);/, '重试按钮未绑定强制重载');
});

test('runTasksWithConcurrency 采用 allSettled 汇总，单任务失败不会提前中断队列', () => {
  const block = getMagicReportBlock();
  assert.match(block, /Promise\.race\(Array\.from\(executing\)\.map\(task => task\.catch\(\(\) => null\)\)\)/, '并发队列仍会因单任务失败提前中断');
  assert.match(block, /return Promise\.allSettled\(results\);/, '并发执行结果未按 allSettled 汇总');
});

test('extractPanelQueryConfFromDataQuery 支持递归扫描嵌套组件提取 queryExecutePlan', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const list = Array\.isArray\(componentList\) \? componentList\.slice\(\) : \[\];/, '未复制组件列表进行递归扫描');
  assert.match(block, /const childBuckets = \[[\s\S]*component\?\.subComponentList,[\s\S]*component\?\.componentList,[\s\S]*properties\?\.componentList[\s\S]*\];/, '缺少嵌套组件桶递归扫描');
  assert.match(block, /if \(!queryExecutePlan && \(type === 'ADDITION' \|\| properties\?\.queryExecutePlan \|\| component\?\.queryExecutePlan \|\| component\?\.queryConf\?\.queryExecutePlan\)\) \{/, 'queryExecutePlan 提取未覆盖嵌套/兜底字段');
});

test('itemdeal 遇到跨店商品时会标记暂不可用并返回空结果', () => {
  const block = getMagicReportBlock();
  assert.match(block, /extractCrowdUnsupportedReason\(componentList\)\s*\{/, '缺少跨店商品不可用识别方法');
  assert.match(block, /if \(\/商品所属店铺与当前店铺不一致\|不支持查询其\[它他\]店铺商品的人群画像\/\.test\(serialized\)\) \{\s*return '商品成交人群暂不可用（跨店商品）';/, '跨店商品不可用文案识别缺失');
  assert.match(block, /const unsupportedReason = metric === 'itemdeal'\s*\?\s*this\.extractCrowdUnsupportedReason\(componentList\)\s*:\s*'';/, 'itemdeal 首查未识别跨店不可用');
  assert.match(block, /if \(baseResult\.unsupportedReason\) \{[\s\S]*groupMap:\s*\{\},[\s\S]*unsupportedReason:\s*baseResult\.unsupportedReason/, '跨店不可用未走空结果兜底分支');
});

test('跨店商品暂不可用会单独提示，且不计入失败数', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const unsupportedReasonSet = new Set\(\);/, '缺少暂不可用原因集合');
  assert.match(block, /const reason = String\(item\.value\?\.rawMeta\?\.unsupportedReason \|\| ''\)\.trim\(\);/, '未从任务结果读取暂不可用原因');
  assert.match(block, /const unsupportedNotice = Array\.from\(unsupportedReasonSet\)\.filter\(Boolean\)\.join\('；'\);/, '暂不可用原因聚合缺失');
  assert.match(block, /const unsupportedSuffix = unsupportedNotice \? `；\$\{unsupportedNotice\}` : '';/, '部分失败文案未追加暂不可用提示');
  assert.match(block, /else if \(unsupportedNotice\) \{[\s\S]*setCrowdMatrixStatus\(`人群对比看板已加载完成；\$\{unsupportedNotice\}`,\s*'warn'/, '无失败时未展示暂不可用提示');
});

test('强制刷新商品ID会绕过底层缓存并禁用缓存 hint', () => {
  const block = getMagicReportBlock();
  assert.match(block, /if \(!preferCache\) \{[\s\S]*PlanIdentityUtils\.campaignItemIdCache\.delete\(id\);[\s\S]*\}/, '强制刷新未清理共享缓存');
  assert.match(block, /if \(!preferCache\) \{[\s\S]*PlanIdentityUtils\.campaignItemCandidatesCache\.delete\(id\);[\s\S]*\}/, '强制刷新未清理商品候选缓存');
  assert.match(block, /PlanIdentityUtils\.resolveItemIdByCampaignId\([\s\S]*allowCacheFallback \? \(fromCache \|\| ''\) : ''[\s\S]*\{\s*preferCache\s*\}\s*\)/, '强制刷新未透传 preferCache 参数');
  assert.match(source, /async resolveItemIdByCampaignId\(campaignId, bizCandidates, authContext, fallbackItemId = '', traceMessages = null, options = \{\}\)/, 'PlanIdentity 商品ID解析未支持 options');
  assert.match(source, /const preferCache = options\?\.preferCache !== false;/, 'PlanIdentity 商品ID解析未读取 preferCache');
  assert.match(source, /if \(cached && preferCache\) \{/, 'PlanIdentity 商品ID解析仍无条件命中缓存');
  assert.match(source, /this\.findConflictRefs\(normalizedCampaignId,\s*currentBiz,\s*authContext,\s*'',\s*\{\s*allowCacheHint:\s*preferCache\s*\}\)/, '冲突接口未按 preferCache 控制缓存 hint');
});

test('itemdeal 会遍历候选商品ID并优先使用可查询结果', () => {
  const block = getMagicReportBlock();
  assert.match(source, /campaignItemCandidatesCache:\s*new Map\(\)/, 'PlanIdentity 缺少商品候选缓存');
  assert.match(source, /rememberCampaignItemIdCandidates\(campaignId,\s*itemIds = \[\],\s*options = \{\}\)\s*\{/, 'PlanIdentity 缺少候选商品缓存写入方法');
  assert.match(source, /extractItemIdCandidatesFromCampaignPayload\(payload = \{\},\s*expectedCampaignId = ''\)\s*\{/, 'PlanIdentity 缺少计划详情候选商品提取方法');
  assert.match(block, /getCrowdCampaignItemCandidates\(campaignId,\s*preferredItemId = ''\)\s*\{/, 'MagicReport 缺少候选商品聚合方法');
  assert.match(block, /const queryItemDealByCandidate = async \(seedItemId = '',\s*options = \{\}\) => \{/, 'itemdeal 缺少候选商品逐个探测逻辑');
  assert.match(block, /const candidates = lockedItemId[\s\S]*:\s*this\.getCrowdCampaignItemCandidates\(id,\s*seedItemId\);/, 'itemdeal 未读取候选商品列表');
  assert.match(block, /const resolvedByCandidates = await queryItemDealByCandidate\(itemId,\s*\{[\s\S]*allowAutoPick:\s*!lockToSelectedItem[\s\S]*\}\);/, 'itemdeal 首查未走候选商品探测');
  assert.match(block, /const refreshedByCandidates = await queryItemDealByCandidate\(itemId,\s*\{[\s\S]*allowAutoPick:\s*true[\s\S]*\}\);/, 'itemdeal 强刷后未走候选商品探测');
});

test('PlanIdentity 商品映射缓存有容量上限并保持最近使用项', () => {
  assert.match(source, /campaignItemCacheLimit:\s*240/, 'PlanIdentity 商品映射缓存缺少容量上限');
  assert.match(source, /trimCampaignItemCaches\(protectedCampaignId = ''\)[\s\S]*?Math\.max\(24,\s*Number\(this\.campaignItemCacheLimit\) \|\| 240\)[\s\S]*?trim\(this\.campaignItemIdCache\);[\s\S]*?trim\(this\.campaignItemCandidatesCache\);/, 'PlanIdentity 应统一裁剪商品ID与候选商品缓存');
  assert.match(source, /rememberRecentMapEntry\(cache,\s*key,\s*value,\s*limitKey = key\)[\s\S]*?cache\.delete\(key\);[\s\S]*?cache\.set\(key,\s*value\);[\s\S]*?this\.trimCampaignItemCaches\(limitKey\);/, 'PlanIdentity 缓存写入应刷新最近顺序并裁剪');
  assert.match(source, /touchRecentMapEntry\(cache,\s*key\)[\s\S]*?cache\.delete\(key\);[\s\S]*?cache\.set\(key,\s*value\);[\s\S]*?this\.trimCampaignItemCaches\(key\);/, 'PlanIdentity 缓存读取应刷新最近使用顺序');
  assert.match(source, /rememberCampaignItemId\(campaignId,\s*itemId\)[\s\S]*?this\.rememberRecentMapEntry\(this\.campaignItemIdCache,\s*normalizedCampaignId,\s*normalizedItemId\);/, '主商品ID缓存写入未走容量裁剪');
  assert.match(source, /this\.rememberRecentMapEntry\(this\.campaignItemCandidatesCache,\s*normalizedCampaignId,\s*deduped\);/, '候选商品缓存写入未走容量裁剪');
  assert.match(source, /const rawList = this\.touchRecentMapEntry\(this\.campaignItemCandidatesCache,\s*normalizedCampaignId\) \|\| \[\];/, '读取候选商品缓存未刷新最近使用顺序');
});

test('计划详情命中白名单商品时会继续查询单元详情，并仅作为回退候选', () => {
  assert.match(source, /extractWeakItemIdCandidatesFromCampaignPayload\(payload = \{\},\s*expectedCampaignId = ''\)\s*\{/, 'PlanIdentity 缺少弱商品候选提取方法');
  assert.match(source, /const weakCandidateSet = new Set\(Array\.isArray\(detail\?\.weakItemIdCandidates\) \? detail\.weakItemIdCandidates : \[\]\);/, '未构建弱候选集合');
  assert.match(source, /if \(resolvedByCampaign && !resolvedByCampaignIsWeak\) \{[\s\S]*计划详情命中/, '非弱候选未直接使用计划详情结果');
  assert.match(source, /if \(resolvedByCampaign && resolvedByCampaignIsWeak\) \{[\s\S]*继续查单元详情校准/, '白名单候选未继续查询单元详情校准');
  assert.match(source, /if \(resolvedByCampaign\) \{[\s\S]*回退计划详情候选/, '白名单候选缺少最终回退分支');
});
