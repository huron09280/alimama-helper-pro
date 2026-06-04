import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const tokenSource = readFileSync(new URL('../src/optimizer/token-manager.js', import.meta.url), 'utf8');
const uiSource = readFileSync(new URL('../src/optimizer/ui.js', import.meta.url), 'utf8');
const mainBootstrapSource = readFileSync(new URL('../src/main-assistant/bootstrap.js', import.meta.url), 'utf8');
const optimizerPublicApiSource = readFileSync(new URL('../src/optimizer/public-api.js', import.meta.url), 'utf8');

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
        /tokenStatusIntervalId:\s*null,[\s\S]*startTokenStatusMonitor:\s*\(\) => \{[\s\S]*if \(UI\.tokenStatusIntervalId !== null\) return;[\s\S]*UI\.refreshTokenStatusIndicator\(\);[\s\S]*UI\.tokenStatusIntervalId = setInterval\(\(\) => \{[\s\S]*UI\.refreshTokenStatusIndicator\(\);[\s\S]*\},\s*1000\);[\s\S]*stopTokenStatusMonitor:\s*\(\) => \{[\s\S]*if \(UI\.tokenStatusIntervalId === null\) return;[\s\S]*clearInterval\(UI\.tokenStatusIntervalId\);[\s\S]*UI\.tokenStatusIntervalId = null;/,
        'Token 状态轮询应具备可启动和可停止的生命周期'
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
        /panelRevealTimerId:\s*null,/,
        '算法护航面板首次 reveal timer 缺少可清理句柄'
    );
    assert.match(
        uiSource,
        /clearPanelRevealTimer:\s*\(\) => \{[\s\S]*if \(UI\.panelRevealTimerId === null\) return;[\s\S]*clearTimeout\(UI\.panelRevealTimerId\);[\s\S]*UI\.panelRevealTimerId = null;[\s\S]*\},/,
        '算法护航面板 reveal timer 应支持显式 clear 并归零'
    );
    assert.match(
        uiSource,
        /schedulePanelReveal:\s*\(callback\) => \{[\s\S]*UI\.clearPanelRevealTimer\(\);[\s\S]*if \(typeof callback !== 'function'\) return;[\s\S]*UI\.panelRevealTimerId = setTimeout\(\(\) => \{[\s\S]*UI\.panelRevealTimerId = null;[\s\S]*const panel = document\.getElementById\(CONFIG\.UI_ID\);[\s\S]*if \(!panel\) return;[\s\S]*callback\(panel\);[\s\S]*\},\s*100\);[\s\S]*\},/,
        '算法护航面板首次 reveal 应统一调度，并在回调触发前校验 panel 仍存在'
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
