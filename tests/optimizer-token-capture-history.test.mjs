import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const tokenSource = readFileSync(new URL('../src/optimizer/token-manager.js', import.meta.url), 'utf8');
const uiSource = readFileSync(new URL('../src/optimizer/ui.js', import.meta.url), 'utf8');
const mainBootstrapSource = readFileSync(new URL('../src/main-assistant/bootstrap.js', import.meta.url), 'utf8');

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
