import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const tokenSource = readFileSync(new URL('../src/optimizer/token-manager.js', import.meta.url), 'utf8');
const uiSource = readFileSync(new URL('../src/optimizer/ui.js', import.meta.url), 'utf8');

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

test('Token 指示灯在缺 token 时会主动触发 refresh，避免长期红色误报', () => {
    assert.match(
        uiSource,
        /let lastTokenRefreshAt = 0;[\s\S]*if \(!tokenReady && now - lastTokenRefreshAt >= 2500\)[\s\S]*TokenManager\.refresh\(\);[\s\S]*tokenDot\.style\.color = \(State\.tokens\.dynamicToken && State\.tokens\.loginPointId\) \? '#52c41a' : '#ff4d4f';/,
        'Token 指示灯未在缺 token 时主动刷新'
    );
});
