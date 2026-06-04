import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, createContext } from 'node:vm';

const tokenSource = readFileSync(new URL('../src/optimizer/token-manager.js', import.meta.url), 'utf8');
const uiSource = readFileSync(new URL('../src/optimizer/ui.js', import.meta.url), 'utf8');
const mainBootstrapSource = readFileSync(new URL('../src/main-assistant/bootstrap.js', import.meta.url), 'utf8');
const optimizerPublicApiSource = readFileSync(new URL('../src/optimizer/public-api.js', import.meta.url), 'utf8');

function sliceSource(text, startText, endText) {
    const start = text.indexOf(startText);
    const end = text.indexOf(endText, start + startText.length);
    assert.ok(start > -1 && end > start, `无法定位代码片段：${startText}`);
    return text.slice(start, end);
}

function createPanelRevealHarness(initialVisibilityState = 'visible', options = {}) {
    let visibilityState = String(initialVisibilityState || 'visible');
    let nextTimerId = 1;
    const timers = new Map();
    const listeners = new Map();
    const panel = options.panel === null
        ? null
        : {
            nodeType: 1,
            isConnected: true,
            id: 'am-optimizer-panel'
        };
    const addListener = (type, handler) => {
        if (typeof handler !== 'function') return;
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type).add(handler);
    };
    const removeListener = (type, handler) => {
        listeners.get(type)?.delete(handler);
    };
    const panelRevealSource = sliceSource(
        uiSource,
        'clearPanelRevealTimer: () => {',
        'clearPanelHighlightTimer: () => {'
    );
    const context = createContext({
        CONFIG: {
            UI_ID: 'am-optimizer-panel'
        },
        document: {
            get visibilityState() {
                return visibilityState;
            },
            addEventListener: addListener,
            removeEventListener: removeListener,
            getElementById(id) {
                return id === 'am-optimizer-panel' ? panel : null;
            }
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
panelRevealTimerId: null,
panelRevealVisibilityHandler: null,
panelRevealPendingCallback: null,
isDocumentHidden: () => document.visibilityState === 'hidden',
${panelRevealSource}
};
globalThis.__UI = UI;`).runInContext(context);
    return {
        context,
        panel,
        timers,
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
        }
    };
}

test('TokenManager 会从 hook history 回填 dynamicToken/loginPointId/csrf', () => {
    assert.match(
        tokenSource,
        /syncFromHookHistory:\s*\(\)\s*=>\s*\{[\s\S]*getRequestHistory\(\{[\s\S]*includePattern:\s*\/\\\.json\(\?:\$\|\\\?\)\/i[\s\S]*limit:\s*2600[\s\S]*\}\)[\s\S]*TokenManager\.syncFromUrl\(entry\.url\)[\s\S]*TokenManager\.syncFromBody\(entry\.body\)/,
        '缺少从 hook history 回填 token 的逻辑'
    );
});

test('TokenManager 会同时注册 fetch/XHR 捕获 token', () => {
    assert.match(
        tokenSource,
        /hooks\.registerXHROpen\([\s\S]*hooks\.registerXHRSend\([\s\S]*hooks\.registerFetch\([\s\S]*TokenManager\.syncFromUrl\(requestUrl\)[\s\S]*TokenManager\.syncFromBody\(requestBody\)/,
        'Token hook 未覆盖 fetch + XHR 两条链路'
    );
});

test('统一 Hook 管理器在下载捕获模块之前创建', () => {
    assert.match(
        mainBootstrapSource,
        /const createHookManager = \(\) => \{[\s\S]*hookWindow\.__AM_HOOK_MANAGER__ = manager;[\s\S]*window\.__AM_HOOK_MANAGER__ = manager;[\s\S]*return manager;[\s\S]*\};[\s\S]*try \{\s*createHookManager\(\);\s*\} catch \{ \}/,
        '主助手 bootstrap 应先创建统一 Hook 管理器，不能依赖下载捕获模块初始化'
    );
});

test('Token 指示灯在缺 token 时会主动触发 refresh，避免长期红色误报', () => {
    assert.match(
        uiSource,
        /tokenStatusLastRefreshAt:\s*0,[\s\S]*refreshTokenStatusIndicator:\s*\(\) => \{[\s\S]*if \(!tokenReady && now - UI\.tokenStatusLastRefreshAt >= 2500\)[\s\S]*TokenManager\.refresh\(\);[\s\S]*const nextTokenReady = !!\(State\.tokens\.dynamicToken && State\.tokens\.loginPointId\);[\s\S]*tokenDot\.style\.color = nextTokenReady \? 'var\(--am26-success,#0ea86f\)' : 'var\(--am26-danger,#ea4f4f\)';/,
        'Token 指示灯未在缺 token 时主动刷新'
    );
});

test('算法护航关闭后会释放 token 状态轮询，再次展示时恢复', () => {
    assert.match(
        uiSource,
        /tokenStatusTimerId:\s*null,[\s\S]*tokenStatusMonitorActive:\s*false,[\s\S]*tokenStatusVisibilityHandlerBound:\s*false,/,
        'Token 状态监控缺少 timeout 句柄、active 状态或 visibility 监听状态'
    );
    assert.match(
        uiSource,
        /isDocumentHidden:\s*\(\) => document\.visibilityState === 'hidden',[\s\S]*clearTokenStatusTimer:\s*\(\) => \{[\s\S]*if \(UI\.tokenStatusTimerId === null\) return;[\s\S]*clearTimeout\(UI\.tokenStatusTimerId\);[\s\S]*UI\.tokenStatusTimerId = null;[\s\S]*\},/,
        'Token 状态监控缺少隐藏态判定或统一 timer 清理 helper'
    );
    assert.match(
        uiSource,
        /bindTokenStatusVisibilityHandler:\s*\(\) => \{[\s\S]*document\.addEventListener\('visibilitychange', UI\.handleTokenStatusVisibilityChange\);[\s\S]*UI\.tokenStatusVisibilityHandlerBound = true;[\s\S]*unbindTokenStatusVisibilityHandler:\s*\(\) => \{[\s\S]*document\.removeEventListener\('visibilitychange', UI\.handleTokenStatusVisibilityChange\);[\s\S]*UI\.tokenStatusVisibilityHandlerBound = false;/,
        'Token 状态监控应绑定并释放 visibilitychange 监听'
    );
    assert.match(
        uiSource,
        /scheduleTokenStatusRefresh:\s*\(\) => \{[\s\S]*if \(!UI\.tokenStatusMonitorActive\) return;[\s\S]*UI\.clearTokenStatusTimer\(\);[\s\S]*if \(UI\.isDocumentHidden\(\)\) return;[\s\S]*UI\.refreshTokenStatusIndicator\(\);[\s\S]*UI\.tokenStatusTimerId = setTimeout\(\(\) => \{[\s\S]*UI\.tokenStatusTimerId = null;[\s\S]*if \(!UI\.tokenStatusMonitorActive \|\| UI\.isDocumentHidden\(\)\) return;[\s\S]*UI\.scheduleTokenStatusRefresh\(\);[\s\S]*\},\s*1000\);[\s\S]*\},/,
        'Token 状态轮询应使用可取消 timeout 循环并在隐藏态暂停'
    );
    assert.match(
        uiSource,
        /handleTokenStatusVisibilityChange:\s*\(\) => \{[\s\S]*if \(!UI\.tokenStatusMonitorActive\) return;[\s\S]*if \(UI\.isDocumentHidden\(\)\) \{[\s\S]*UI\.clearTokenStatusTimer\(\);[\s\S]*return;[\s\S]*\}[\s\S]*UI\.scheduleTokenStatusRefresh\(\);[\s\S]*\},/,
        'Token 状态监控隐藏页应释放 timer，恢复可见后补刷并恢复循环'
    );
    assert.match(
        uiSource,
        /startTokenStatusMonitor:\s*\(\) => \{[\s\S]*if \(UI\.tokenStatusMonitorActive\) return;[\s\S]*UI\.tokenStatusMonitorActive = true;[\s\S]*UI\.bindTokenStatusVisibilityHandler\(\);[\s\S]*UI\.scheduleTokenStatusRefresh\(\);[\s\S]*stopTokenStatusMonitor:\s*\(\) => \{[\s\S]*UI\.tokenStatusMonitorActive = false;[\s\S]*UI\.clearTokenStatusTimer\(\);[\s\S]*UI\.unbindTokenStatusVisibilityHandler\(\);/,
        'Token 状态监控应具备可启动和可停止的完整生命周期'
    );
    assert.match(
        uiSource,
        /document\.getElementById\(`\$\{CONFIG\.UI_ID\}-close`\)\.onclick = \(\) => \{[\s\S]*panel\.style\.pointerEvents = 'none';[\s\S]*UI\.stopTokenStatusMonitor\(\);/,
        '关闭算法护航面板时应停止 token 状态轮询'
    );
    assert.match(
        uiSource,
        /UI\.refreshTokenStatusIndicator\(\);[\s\S]*\n\s*\}\n\s*\};/,
        '创建算法护航面板时应只做一次 token 状态刷新，不应直接常驻轮询'
    );
    assert.doesNotMatch(
        uiSource,
        /tokenStatusIntervalId|setInterval\(\(\) => \{[\s\S]*UI\.refreshTokenStatusIndicator\(\);/,
        'Token 状态监控不应继续保留固定 interval 轮询'
    );
});

test('算法护航日志展开 overflow 延迟 timer 会在返回或关闭时释放', () => {
    assert.match(
        uiSource,
        /logOverflowTimerId:\s*null,/,
        '日志 overflow 延迟 timer 缺少可清理句柄'
    );
    assert.match(
        uiSource,
        /clearLogOverflowTimer:\s*\(\) => \{[\s\S]*if \(UI\.logOverflowTimerId === null\) return;[\s\S]*clearTimeout\(UI\.logOverflowTimerId\);[\s\S]*UI\.logOverflowTimerId = null;[\s\S]*\},/,
        '日志 overflow timer 应支持显式 clear 并归零'
    );
    assert.match(
        uiSource,
        /scheduleLogOverflowAuto:\s*\(wrapper = null\) => \{[\s\S]*UI\.clearLogOverflowTimer\(\);[\s\S]*if \(!wrapper \|\| wrapper\.nodeType !== 1\) return;[\s\S]*UI\.logOverflowTimerId = setTimeout\(\(\) => \{[\s\S]*UI\.logOverflowTimerId = null;[\s\S]*if \(!wrapper\.isConnected \|\| wrapper\.dataset\.expanded !== 'true'\) return;[\s\S]*wrapper\.style\.overflow = 'auto';[\s\S]*\},\s*300\);[\s\S]*\},/,
        '日志 overflow timer 应统一调度，并在回调触发前校验 wrapper 仍连接且保持展开'
    );
    assert.match(
        uiSource,
        /document\.getElementById\(`\$\{CONFIG\.UI_ID\}-close`\)\.onclick = \(\) => \{[\s\S]*UI\.stopTokenStatusMonitor\(\);[\s\S]*UI\.clearLogOverflowTimer\(\);[\s\S]*UI\.closeManualKeywordPreferenceMenu\(\);/,
        '关闭算法护航面板时应释放日志 overflow timer'
    );
    assert.match(
        uiSource,
        /const restoreIdlePanelView = \(\{ clearLog = true \} = \{\}\) => \{[\s\S]*UI\.clearLogOverflowTimer\(\);[\s\S]*wrapper\.style\.overflow = 'hidden';/,
        '返回空闲态时应先释放日志 overflow timer 再折叠日志区域'
    );
    assert.equal(
        (uiSource.match(/wrapper\.style\.transform = 'scaleY\(1\)';\s*\n\s*UI\.scheduleLogOverflowAuto\(wrapper\);/g) || []).length,
        2,
        '两个展开日志区域入口都应通过统一 helper 调度 overflow timer'
    );
    assert.doesNotMatch(
        uiSource,
        /setTimeout\(\(\) => wrapper\.style\.overflow = 'auto', 300\);/,
        '不应继续使用匿名 overflow 延迟 timer'
    );
});

test('算法护航面板高亮提示 timer 会复用并在关闭时释放', () => {
    assert.match(
        uiSource,
        /panelHighlightTimerId:\s*null,/,
        '算法护航面板高亮 timer 缺少可清理句柄'
    );
    assert.match(
        uiSource,
        /clearPanelHighlightTimer:\s*\(\) => \{[\s\S]*if \(UI\.panelHighlightTimerId === null\) return;[\s\S]*clearTimeout\(UI\.panelHighlightTimerId\);[\s\S]*UI\.panelHighlightTimerId = null;[\s\S]*\},/,
        '算法护航面板高亮 timer 应支持显式 clear 并归零'
    );
    assert.match(
        uiSource,
        /flashPanelHighlight:\s*\(panel = null\) => \{[\s\S]*UI\.clearPanelHighlightTimer\(\);[\s\S]*if \(!panel \|\| panel\.nodeType !== 1\) return;[\s\S]*panel\.style\.boxShadow = '0 0 20px rgba\(24,144,255,0\.8\)';[\s\S]*UI\.panelHighlightTimerId = setTimeout\(\(\) => \{[\s\S]*UI\.panelHighlightTimerId = null;[\s\S]*if \(!panel\.isConnected\) return;[\s\S]*panel\.style\.boxShadow = '0 4px 16px rgba\(0,0,0,0\.15\)';[\s\S]*\},\s*500\);[\s\S]*\},/,
        '算法护航面板高亮应统一调度，并在回调触发前校验 panel 仍连接'
    );
    assert.match(
        uiSource,
        /document\.getElementById\(`\$\{CONFIG\.UI_ID\}-close`\)\.onclick = \(\) => \{[\s\S]*UI\.clearLogOverflowTimer\(\);[\s\S]*UI\.clearPanelHighlightTimer\(\);[\s\S]*UI\.closeManualKeywordPreferenceMenu\(\);/,
        '关闭算法护航面板时应释放高亮 timer'
    );
    assert.equal(
        (optimizerPublicApiSource.match(/UI\.flashPanelHighlight\?\.\(panel\);/g) || []).length,
        2,
        '公开入口两处已打开面板高亮都应走统一 helper'
    );
    assert.doesNotMatch(
        optimizerPublicApiSource,
        /setTimeout\(\(\) => \{[\s\S]*panel\.style\.boxShadow = '0 4px 16px rgba\(0,0,0,0\.15\)';[\s\S]*\}, 500\);/,
        '公开入口不应继续保留无句柄 boxShadow reset timeout'
    );
});

test('算法护航首次创建 reveal timer 会复用并在关闭时释放', () => {
    assert.match(
        uiSource,
        /panelRevealTimerId:\s*null,[\s\S]*panelRevealVisibilityHandler:\s*null,[\s\S]*panelRevealPendingCallback:\s*null,/,
        '算法护航面板首次 reveal timer 缺少可清理句柄、visibility handler 或 pending callback'
    );
    assert.match(
        uiSource,
        /clearPanelRevealTimer:\s*\(\) => \{[\s\S]*if \(UI\.panelRevealTimerId !== null\) \{[\s\S]*clearTimeout\(UI\.panelRevealTimerId\);[\s\S]*UI\.panelRevealTimerId = null;[\s\S]*\}[\s\S]*UI\.clearPanelRevealVisibilityHandler\(\);[\s\S]*UI\.panelRevealPendingCallback = null;[\s\S]*\},/,
        '算法护航面板 reveal timer 应支持显式 clear、归零并释放 visibility/pending 状态'
    );
    assert.match(
        uiSource,
        /clearPanelRevealVisibilityHandler:\s*\(\) => \{[\s\S]*document\.removeEventListener\('visibilitychange', UI\.panelRevealVisibilityHandler\);[\s\S]*UI\.panelRevealVisibilityHandler = null;[\s\S]*\},/,
        '算法护航面板 reveal 应支持释放 visibilitychange handler'
    );
    assert.match(
        uiSource,
        /bindPanelRevealVisibilityHandler:\s*\(\) => \{[\s\S]*if \(typeof UI\.panelRevealVisibilityHandler === 'function'\) return;[\s\S]*if \(UI\.isDocumentHidden\(\)\) \{[\s\S]*clearTimeout\(UI\.panelRevealTimerId\);[\s\S]*UI\.panelRevealTimerId = null;[\s\S]*return;[\s\S]*const pendingCallback = UI\.panelRevealPendingCallback;[\s\S]*UI\.schedulePanelReveal\(pendingCallback\);[\s\S]*document\.addEventListener\('visibilitychange', UI\.panelRevealVisibilityHandler\);/,
        '算法护航面板 reveal 应在隐藏时取消 timer，恢复可见后继续同一个 pending callback'
    );
    assert.match(
        uiSource,
        /schedulePanelReveal:\s*\(callback\) => \{[\s\S]*UI\.clearPanelRevealTimer\(\);[\s\S]*if \(typeof callback !== 'function'\) return;[\s\S]*UI\.panelRevealPendingCallback = callback;[\s\S]*UI\.bindPanelRevealVisibilityHandler\(\);[\s\S]*if \(UI\.isDocumentHidden\(\)\) return;[\s\S]*UI\.panelRevealTimerId = setTimeout\(\(\) => \{[\s\S]*UI\.panelRevealTimerId = null;[\s\S]*if \(UI\.isDocumentHidden\(\)\) return;[\s\S]*const pendingCallback = UI\.panelRevealPendingCallback;[\s\S]*UI\.clearPanelRevealVisibilityHandler\(\);[\s\S]*UI\.panelRevealPendingCallback = null;[\s\S]*const panel = document\.getElementById\(CONFIG\.UI_ID\);[\s\S]*if \(!panel\) return;[\s\S]*if \(typeof pendingCallback === 'function'\) pendingCallback\(panel\);[\s\S]*\},\s*100\);[\s\S]*\},/,
        '算法护航面板首次 reveal 应隐藏页暂停，可见页按 100ms 统一调度，并在回调触发前校验 panel 仍存在'
    );
    assert.match(
        uiSource,
        /document\.getElementById\(`\$\{CONFIG\.UI_ID\}-close`\)\.onclick = \(\) => \{[\s\S]*UI\.clearLogOverflowTimer\(\);[\s\S]*UI\.clearPanelRevealTimer\(\);[\s\S]*UI\.clearPanelHighlightTimer\(\);/,
        '关闭算法护航面板时应释放 pending reveal timer'
    );
    assert.match(
        optimizerPublicApiSource,
        /UI\.schedulePanelReveal\?\.\(\(createdPanel\) => \{[\s\S]*revealOptimizerPanel\(createdPanel\);[\s\S]*\}\);/,
        '公开入口首次创建面板后应通过 UI helper 调度 reveal'
    );
    assert.doesNotMatch(
        optimizerPublicApiSource,
        /setTimeout\(\(\) => \{[\s\S]*revealOptimizerPanel\(document\.getElementById\(CONFIG\.UI_ID\)\);[\s\S]*\}, 100\);/,
        '公开入口不应继续保留无句柄首次 reveal timeout'
    );
});

test('算法护航首次 reveal timer 在隐藏页暂停并恢复可见后补排', () => {
    const hiddenHarness = createPanelRevealHarness('hidden');
    const hiddenCalls = [];
    hiddenHarness.UI.schedulePanelReveal((panel) => hiddenCalls.push(panel));
    assert.equal(hiddenHarness.timers.size, 0, '隐藏页不应排 100ms reveal timeout');
    assert.equal(hiddenHarness.listenerCount(), 1, '隐藏页应保留 visibilitychange 恢复监听');
    assert.equal(typeof hiddenHarness.UI.panelRevealPendingCallback, 'function', '隐藏页应保留 pending callback');

    hiddenHarness.setVisibilityState('visible');
    assert.deepEqual(hiddenHarness.getTimerDelays(), [100], '恢复可见后应按原 100ms 节奏补排 reveal timeout');
    assert.equal(hiddenHarness.listenerCount(), 1, '补排 timeout 等待期间应继续监听转隐藏');
    assert.equal(hiddenHarness.tickNextTimer(), true, '应能触发补排 reveal timeout');
    assert.deepEqual(hiddenCalls, [hiddenHarness.panel], '补排 timeout 触发后应执行原 pending callback');
    assert.equal(hiddenHarness.listenerCount(), 0, '执行完成后应释放 visibilitychange');
    assert.equal(hiddenHarness.UI.panelRevealPendingCallback, null, '执行完成后应释放 pending callback');

    const visibleHarness = createPanelRevealHarness('visible');
    const visibleCalls = [];
    visibleHarness.UI.schedulePanelReveal((panel) => visibleCalls.push(panel));
    assert.deepEqual(visibleHarness.getTimerDelays(), [100], '可见页应保留原 100ms reveal timeout');
    assert.equal(visibleHarness.listenerCount(), 1, '可见页等待 reveal 时应监听 visibilitychange');
    visibleHarness.setVisibilityState('hidden');
    assert.equal(visibleHarness.timers.size, 0, '可见页转隐藏时应取消已排 reveal timeout');
    assert.deepEqual(visibleCalls, [], '转隐藏时不应执行 reveal callback');
    assert.equal(typeof visibleHarness.UI.panelRevealPendingCallback, 'function', '转隐藏时应保留 pending callback');
    visibleHarness.setVisibilityState('visible');
    assert.deepEqual(visibleHarness.getTimerDelays(), [100], '再次恢复可见后应重新排原 100ms reveal timeout');
    assert.equal(visibleHarness.tickNextTimer(), true, '再次恢复后的 reveal timeout 应可触发');
    assert.deepEqual(visibleCalls, [visibleHarness.panel], '再次恢复后应执行原 pending callback');
    assert.equal(visibleHarness.listenerCount(), 0, '执行完成后应释放 visibilitychange');

    const missingPanelHarness = createPanelRevealHarness('visible', { panel: null });
    const missingPanelCalls = [];
    missingPanelHarness.UI.schedulePanelReveal((panel) => missingPanelCalls.push(panel));
    assert.equal(missingPanelHarness.tickNextTimer(), true, '缺少 panel 时仍应消费 reveal timeout');
    assert.deepEqual(missingPanelCalls, [], '缺少 panel 时不应执行 reveal callback');
    assert.equal(missingPanelHarness.listenerCount(), 0, '缺少 panel 分支也应释放 visibilitychange');
    assert.equal(missingPanelHarness.UI.panelRevealPendingCallback, null, '缺少 panel 分支也应释放 pending callback');

    const clearHarness = createPanelRevealHarness('hidden');
    clearHarness.UI.schedulePanelReveal(() => {});
    clearHarness.UI.clearPanelRevealTimer();
    assert.equal(clearHarness.timers.size, 0, '显式清理后不应残留 reveal timeout');
    assert.equal(clearHarness.listenerCount(), 0, '显式清理后不应残留 visibilitychange');
    assert.equal(clearHarness.UI.panelRevealPendingCallback, null, '显式清理后不应残留 pending callback');
});

test('算法护航手动关键词偏好外部点击监听只在菜单打开期间绑定', () => {
    assert.match(
        uiSource,
        /manualKeywordOutsideHandler:\s*null,\s*\n\s*manualKeywordOutsideHandlerBound:\s*false,/,
        '手动关键词偏好外部点击监听缺少绑定状态'
    );
    assert.match(
        uiSource,
        /bindManualKeywordOutsideHandler:\s*\(\) => \{[\s\S]*if \(UI\.manualKeywordOutsideHandlerBound\) return;[\s\S]*if \(typeof UI\.manualKeywordOutsideHandler !== 'function'\) return;[\s\S]*document\.addEventListener\('mousedown', UI\.manualKeywordOutsideHandler, true\);[\s\S]*UI\.manualKeywordOutsideHandlerBound = true;[\s\S]*\},/,
        '手动关键词偏好菜单应在打开时按需绑定外部点击监听'
    );
    assert.match(
        uiSource,
        /unbindManualKeywordOutsideHandler:\s*\(\) => \{[\s\S]*if \(!UI\.manualKeywordOutsideHandlerBound\) return;[\s\S]*document\.removeEventListener\('mousedown', UI\.manualKeywordOutsideHandler, true\);[\s\S]*UI\.manualKeywordOutsideHandlerBound = false;[\s\S]*\},/,
        '手动关键词偏好菜单应支持释放外部点击监听'
    );
    assert.match(
        uiSource,
        /closeManualKeywordPreferenceMenu:\s*\(\) => \{[\s\S]*trigger\.setAttribute\('aria-expanded', 'false'\);[\s\S]*UI\.unbindManualKeywordOutsideHandler\(\);[\s\S]*\},/,
        '关闭关键词偏好菜单时应释放 document mousedown 监听'
    );
    assert.match(
        uiSource,
        /preferenceMenu\.style\.display = 'block';[\s\S]*preferenceMenu\.dataset\.open = 'true';[\s\S]*preferenceTrigger\.setAttribute\('aria-expanded', 'true'\);[\s\S]*UI\.bindManualKeywordOutsideHandler\(\);/,
        '打开关键词偏好菜单时应绑定 document mousedown 监听'
    );
    assert.match(
        uiSource,
        /UI\.unbindManualKeywordOutsideHandler\(\);[\s\S]*UI\.manualKeywordOutsideHandler = \(event\) => \{[\s\S]*UI\.closeManualKeywordPreferenceMenu\(\);[\s\S]*\};[\s\S]*UI\.refreshManualKeywordControls\(\);/,
        '初始化手动关键词控件时应只准备 handler，不应直接常驻绑定'
    );
    assert.match(
        uiSource,
        /panel\.style\.pointerEvents = 'none';[\s\S]*UI\.stopTokenStatusMonitor\(\);[\s\S]*UI\.closeManualKeywordPreferenceMenu\(\);/,
        '关闭算法护航面板时应兜底释放手动关键词偏好外部点击监听'
    );
    assert.doesNotMatch(
        uiSource,
        /bindManualKeywordControls:\s*\(\) => \{[\s\S]*document\.addEventListener\('mousedown', UI\.manualKeywordOutsideHandler, true\);[\s\S]*UI\.refreshManualKeywordControls\(\);/,
        'bindManualKeywordControls 不应在初始化时常驻绑定 document mousedown'
    );
});
