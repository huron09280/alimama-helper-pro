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
