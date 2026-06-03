import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getInterceptorBlock() {
    const start = source.indexOf('const Interceptor = {');
    const end = source.indexOf('// ==========================================', start + 1);
    assert.ok(start > -1 && end > start, '无法定位 Interceptor 代码块');
    return source.slice(start, end);
}

function getUiBlock() {
    const start = source.indexOf('const UI = {');
    const end = source.indexOf('const BudgetFrontendLimitBypass = {', start);
    assert.ok(start > -1 && end > start, '无法定位 UI 代码块');
    return source.slice(start, end);
}

function extractFindUrlInObject() {
    const match = source.match(
        /findUrlInObject\(obj,\s*source,\s*maxDepth = 20\)\s*\{([\s\S]*?)\n\s*},\n\s*handleResponse\(text,\s*source,\s*meta = \{\}\)\s*\{/
    );
    assert.ok(match, '无法定位 findUrlInObject');
    const fnSource = `function findUrlInObject(obj, source, maxDepth = 20) {${match[1]}\n}`;
    return Function(`return (${fnSource});`)();
}

function buildNestedUrlObject(depth) {
    let value = 'https://demo.oss-accelerate.aliyuncs.com/report.xlsx';
    for (let i = 0; i < depth; i += 1) {
        value = { next: value };
    }
    return value;
}

function createHelper() {
    const hits = [];
    const helper = {
        isDownloadUrl(url) {
            return /xlsx$/i.test(String(url || ''));
        },
        show(url, sourceLabel) {
            hits.push({ url, source: sourceLabel });
        }
    };
    helper.findUrlInObject = extractFindUrlInObject();
    return { helper, hits };
}

test('下载链接递归解析：默认 maxDepth=20 时可命中第 20 层 URL', () => {
    const { helper, hits } = createHelper();
    helper.findUrlInObject(buildNestedUrlObject(20), 'JSON:test');
    assert.equal(hits.length, 1, '第 20 层 URL 不应被深度边界漏检');
});

test('下载链接递归解析：默认 maxDepth=20 时第 21 层仍受限', () => {
    const { helper, hits } = createHelper();
    helper.findUrlInObject(buildNestedUrlObject(21), 'JSON:test');
    assert.equal(hits.length, 0, '第 21 层 URL 应被默认深度限制拦截');
});

test('下载捕获面板具备统一语义、响应式宽度与可见焦点态', () => {
    const interceptorBlock = getInterceptorBlock();
    const uiBlock = getUiBlock();
    assert.match(
        interceptorBlock,
        /div\.style\.cssText = 'font-size:13px;position:fixed;right:20px;bottom:20px;width:min\(340px, calc\(100vw - 24px\)\);/,
        '下载面板内联兜底宽度应适配窄视口'
    );
    assert.match(interceptorBlock, /div\.setAttribute\('role', 'region'\);[\s\S]*?div\.setAttribute\('aria-label', '报表下载捕获'\);[\s\S]*?div\.setAttribute\('aria-live', 'polite'\);[\s\S]*?div\.setAttribute\('aria-hidden', 'true'\);[\s\S]*?div\.tabIndex = -1;/, '下载面板容器应具备 region/live 语义与可聚焦兜底');
    assert.match(interceptorBlock, /panel\.setAttribute\('aria-hidden', 'false'\);[\s\S]*?panel\.setAttribute\('aria-labelledby', 'am-report-capture-title'\);[\s\S]*?panel\.setAttribute\('aria-describedby', 'am-report-capture-url am-report-capture-status'\);/, '下载面板展示时应关联标题、地址和状态说明');
    assert.match(interceptorBlock, /headerTitle\.id = 'am-report-capture-title';[\s\S]*?headerSource\.setAttribute\('aria-label', `来源：\$\{source\}`\);/, '下载面板标题和来源应有可访问名称');
    assert.match(interceptorBlock, /urlBox\.id = 'am-report-capture-url';[\s\S]*?urlBox\.title = safeUrl;[\s\S]*?urlBox\.setAttribute\('aria-label', `下载地址：\$\{safeUrl\}`\);[\s\S]*?urlBox\.textContent = safeUrl;/, '下载地址应使用 textContent 且暴露完整地址说明');
    assert.match(uiBlock, /#am-report-capture-panel\s*\{[\s\S]*?width:\s*min\(340px,\s*calc\(100vw - 24px\)\);/, '下载面板 CSS 宽度应适配窄视口');
    assert.match(uiBlock, /#am-report-capture-panel\s*\{[\s\S]*?background:\s*var\(--am26-panel-strong\);[\s\S]*?backdrop-filter:\s*blur\(18px\) saturate\(1\.35\);[\s\S]*?box-shadow:\s*var\(--am26-shadow\),\s*var\(--am26-glow\);/, '下载面板应使用统一浅玻璃 token 与阴影');
    assert.match(interceptorBlock, /dlLink\.setAttribute\('aria-label',\s*'直连下载捕获到的报表'\)/, '下载链接应有可访问名称');
    assert.match(interceptorBlock, /dlLink\.innerHTML = `\$\{renderAmIcon\('external-link', \{ size: 14, strokeWidth: 2\.1 \}\)\}<span>直连下载<\/span>`;/, '直连下载按钮应使用共享 external-link 图标');
    assert.match(interceptorBlock, /copyBtn\.type = 'button';[\s\S]*?closeBtn\.type = 'button';/, '下载面板操作按钮应显式声明 type=button');
    assert.match(interceptorBlock, /status\.id = 'am-report-capture-status';[\s\S]*?status\.setAttribute\('role', 'status'\);[\s\S]*?status\.setAttribute\('aria-live', 'polite'\);[\s\S]*?status\.textContent = '链接已捕获，可复制或直连下载';/, '下载面板复制状态应使用 live status');
    assert.match(interceptorBlock, /GM_setClipboard\(safeUrl\);[\s\S]*?status\.textContent = '下载链接已复制';[\s\S]*?status\.textContent = '链接已捕获，可复制或直连下载';/, '复制按钮应更新并恢复状态提示');
    assert.match(interceptorBlock, /closeBtn\.onclick = \(\) => \{[\s\S]*?panel\.setAttribute\('aria-hidden', 'true'\);[\s\S]*?this\.removePanel\(\);[\s\S]*?\};[\s\S]*?panel\.onkeydown = \(event\) => \{[\s\S]*?event\.key !== 'Escape'[\s\S]*?closeBtn\.click\(\);/, '下载面板应支持关闭后卸载并用 Escape 关闭');
    assert.match(uiBlock, /#am-report-capture-panel \.am-download-btn:focus-visible,[\s\S]*?#am-report-capture-panel \.am-download-link:focus-visible[\s\S]*?outline:\s*2px solid/, '下载面板按钮与链接应有可见 focus 态');
    assert.match(uiBlock, /#am-report-capture-panel \.am-download-copy-status\s*\{[\s\S]*?background:\s*rgba\(14,\s*168,\s*111,\s*0\.08\);[\s\S]*?color:\s*var\(--am26-success\);/, '下载面板复制状态应使用成功语义 token');
    assert.match(uiBlock, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?#am-report-capture-panel \.am-download-btn,[\s\S]*?#am-report-capture-panel \.am-download-link/, '下载面板 hover/focus 动效应适配减少动画');
});

test('下载捕获在 mai.taobao.com 与 myseller.taobao.com 不启动', () => {
    const interceptorBlock = getInterceptorBlock();
    assert.match(
        interceptorBlock,
        /init\(\)\s*\{\s*if \(this\.shouldSkipForCurrentHost\(\)\) \{\s*this\.ensureHookManager\(\);\s*return;\s*\}\s*this\.registerHooks\(\);/,
        'Interceptor.init 应先判断当前域名，禁用域名不得注册捕获 hook，允许页不应冷态创建下载面板'
    );
    assert.match(
        interceptorBlock,
        /ensureHookManager\(\)\s*\{[\s\S]*createHookManager\(\)\?\.install\?\.\(\);[\s\S]*\}/,
        '禁用下载捕获时仍应保留基础 Hook 管理器，避免影响其它助手模块'
    );
    assert.match(
        interceptorBlock,
        /shouldSkipForCurrentHost\(\)\s*\{[\s\S]*return this\.isDisabledHost\(window\.location\.hostname\);[\s\S]*return false;[\s\S]*\}/,
        '下载捕获缺少当前 hostname 禁用判断'
    );
    assert.match(
        interceptorBlock,
        /isDisabledHost\(hostname\)\s*\{[\s\S]*const host = String\(hostname \|\| ''\)\.trim\(\)\.toLowerCase\(\);[\s\S]*host === 'mai\.taobao\.com'[\s\S]*host\.endsWith\('\.mai\.taobao\.com'\)[\s\S]*host === 'myseller\.taobao\.com'[\s\S]*host\.endsWith\('\.myseller\.taobao\.com'\)[\s\S]*\}/,
        '下载捕获应在 mai.taobao.com、myseller.taobao.com 及其子域禁用'
    );
});

test('下载捕获面板按需挂载，避免 Chrome 冷态常驻 DOM', () => {
    const interceptorBlock = getInterceptorBlock();
    assert.match(
        interceptorBlock,
        /copyResetTimer:\s*0,/,
        '下载面板复制恢复定时器应有可清理状态'
    );
    assert.match(
        interceptorBlock,
        /createPanel\(\)\s*\{\s*if \(this\.panel instanceof HTMLElement && this\.panel\.isConnected\) return this\.panel;/,
        'createPanel 应复用已连接面板，避免重复挂载'
    );
    assert.match(
        interceptorBlock,
        /const existing = document\.getElementById\('am-report-capture-panel'\);[\s\S]*if \(existing instanceof HTMLElement\) \{[\s\S]*this\.panel = existing;[\s\S]*return existing;[\s\S]*\}/,
        'createPanel 应接管已有面板，避免第二事实源'
    );
    assert.match(
        interceptorBlock,
        /const panel = this\.createPanel\(\);[\s\S]*if \(!panel\) \{[\s\S]*debugOnce\('panel-mount-failed'[\s\S]*return;[\s\S]*\}[\s\S]*panel\.dataset\.lastUrl = safeUrl;/,
        'show 命中下载链接后才应挂载面板并写入 lastUrl'
    );
    assert.match(
        interceptorBlock,
        /removePanel\(\)\s*\{[\s\S]*if \(this\.copyResetTimer\) \{[\s\S]*clearTimeout\(this\.copyResetTimer\);[\s\S]*this\.copyResetTimer = 0;[\s\S]*\}[\s\S]*this\.panel\.onkeydown = null;[\s\S]*this\.panel\.remove\(\);[\s\S]*this\.panel = null;[\s\S]*\}/,
        'removePanel 应卸载面板并取消复制恢复定时器'
    );
    assert.match(
        interceptorBlock,
        /if \(Interceptor\.copyResetTimer\) \{[\s\S]*clearTimeout\(Interceptor\.copyResetTimer\);[\s\S]*\}[\s\S]*Interceptor\.copyResetTimer = setTimeout\(\(\) => \{[\s\S]*Interceptor\.copyResetTimer = 0;/,
        '复制按钮应复用可取消的恢复定时器'
    );
    assert.match(
        interceptorBlock,
        /if \(isExitModeBtn \|\| isExitModeText\) \{[\s\S]*this\.removePanel\(\);[\s\S]*\}/,
        '退出模式时应卸载下载捕获面板而不是隐藏'
    );
    assert.doesNotMatch(
        interceptorBlock,
        /init\(\)\s*\{[\s\S]*this\.createPanel\(\);[\s\S]*this\.registerHooks\(\);/,
        'init 不应冷态创建下载捕获面板'
    );
});
