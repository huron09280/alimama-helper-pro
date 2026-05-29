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

test('下载捕获面板具备响应式宽度与可见焦点态', () => {
    const interceptorBlock = getInterceptorBlock();
    const uiBlock = getUiBlock();
    assert.match(
        interceptorBlock,
        /div\.style\.cssText = 'font-size:13px;position:fixed;right:20px;bottom:20px;width:min\(340px, calc\(100vw - 24px\)\);/,
        '下载面板内联兜底宽度应适配窄视口'
    );
    assert.match(uiBlock, /#am-report-capture-panel\s*\{[\s\S]*?width:\s*min\(340px,\s*calc\(100vw - 24px\)\);/, '下载面板 CSS 宽度应适配窄视口');
    assert.match(interceptorBlock, /dlLink\.setAttribute\('aria-label',\s*'直连下载捕获到的报表'\)/, '下载链接应有可访问名称');
    assert.match(interceptorBlock, /copyBtn\.type = 'button';[\s\S]*?closeBtn\.type = 'button';/, '下载面板操作按钮应显式声明 type=button');
    assert.match(uiBlock, /#am-report-capture-panel \.am-download-btn:focus-visible,[\s\S]*?#am-report-capture-panel \.am-download-link:focus-visible[\s\S]*?outline:\s*2px solid/, '下载面板按钮与链接应有可见 focus 态');
    assert.match(uiBlock, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?#am-report-capture-panel \.am-download-btn,[\s\S]*?#am-report-capture-panel \.am-download-link/, '下载面板 hover/focus 动效应适配减少动画');
});
