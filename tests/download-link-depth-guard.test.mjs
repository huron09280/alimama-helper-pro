import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, createContext } from 'node:vm';

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

function createDownloadCaptureHarness(initialVisibilityState = 'visible') {
    let visibilityState = String(initialVisibilityState || 'visible');
    let nextTimerId = 1;
    const timers = new Map();
    const listeners = new Map();
    const clipboardWrites = [];

    class FakeHTMLElement {
        constructor(tagName = 'div', ownerDocument = null) {
            this.tagName = String(tagName || 'div').toUpperCase();
            this.ownerDocument = ownerDocument;
            this.nodeType = 1;
            this.children = [];
            this.parentElement = null;
            this.isConnected = false;
            this.attributes = new Map();
            this.dataset = {};
            this.style = {};
            this.className = '';
            this.onclick = null;
            this.onkeydown = null;
            this.tabIndex = 0;
            this._textContent = '';
            this._innerHTML = '';
        }

        get id() {
            return this.attributes.get('id') || '';
        }

        set id(value) {
            this.setAttribute('id', value);
        }

        set textContent(value) {
            this._textContent = String(value ?? '');
            this.children.forEach(child => child.markConnected(false));
            this.children = [];
            this._innerHTML = '';
        }

        get textContent() {
            return this._textContent;
        }

        set innerText(value) {
            this.textContent = value;
        }

        get innerText() {
            return this.textContent;
        }

        set innerHTML(value) {
            this._innerHTML = String(value ?? '');
            this._textContent = this._innerHTML.replace(/<[^>]*>/g, '');
        }

        get innerHTML() {
            return this._innerHTML;
        }

        setAttribute(name, value) {
            const key = String(name);
            const nextValue = String(value);
            if (key === 'id' && this.ownerDocument) {
                const oldId = this.attributes.get('id');
                if (oldId) this.ownerDocument.unregisterElementId(oldId, this);
                this.ownerDocument.registerElementId(nextValue, this);
            }
            this.attributes.set(key, nextValue);
        }

        getAttribute(name) {
            return this.attributes.get(String(name)) || null;
        }

        appendChild(child) {
            if (!(child instanceof FakeHTMLElement)) return child;
            if (child.parentElement) {
                child.parentElement.children = child.parentElement.children.filter(item => item !== child);
            }
            this.children.push(child);
            child.parentElement = this;
            child.markConnected(this.isConnected);
            return child;
        }

        remove() {
            if (this.parentElement) {
                this.parentElement.children = this.parentElement.children.filter(item => item !== this);
            }
            this.parentElement = null;
            this.markConnected(false);
        }

        markConnected(nextConnected) {
            this.isConnected = nextConnected === true;
            const id = this.attributes.get('id');
            if (this.ownerDocument && id) {
                if (this.isConnected) {
                    this.ownerDocument.registerElementId(id, this);
                } else {
                    this.ownerDocument.unregisterElementId(id, this);
                }
            }
            this.children.forEach(child => child.markConnected(this.isConnected));
        }

        click() {
            if (typeof this.onclick === 'function') {
                this.onclick({ type: 'click', target: this, preventDefault() {} });
            }
        }
    }

    const elementsById = new Map();
    const documentRef = {
        get visibilityState() {
            return visibilityState;
        },
        body: null,
        documentElement: null,
        createElement(tagName) {
            return new FakeHTMLElement(tagName, documentRef);
        },
        getElementById(id) {
            return elementsById.get(String(id)) || null;
        },
        addEventListener(type, handler) {
            if (typeof handler !== 'function') return;
            if (!listeners.has(type)) listeners.set(type, new Set());
            listeners.get(type).add(handler);
        },
        removeEventListener(type, handler) {
            listeners.get(type)?.delete(handler);
        },
        registerElementId(id, element) {
            elementsById.set(String(id), element);
        },
        unregisterElementId(id, element) {
            if (elementsById.get(String(id)) === element) elementsById.delete(String(id));
        }
    };
    documentRef.body = new FakeHTMLElement('body', documentRef);
    documentRef.documentElement = documentRef.body;
    documentRef.body.markConnected(true);

    const findByClass = (root, className) => {
        if (!(root instanceof FakeHTMLElement)) return null;
        const classes = String(root.className || '').split(/\s+/).filter(Boolean);
        if (classes.includes(className)) return root;
        for (const child of root.children) {
            const found = findByClass(child, className);
            if (found) return found;
        }
        return null;
    };

    const interceptorBlock = getInterceptorBlock();
    const context = createContext({
        CONSTANTS: { DL_KEYWORDS: ['xlsx'] },
        Logger: { log() {} },
        createHookManager: () => ({ install() {} }),
        renderAmIcon: () => '<svg></svg>',
        renderAmWindowIcon: () => '<svg></svg>',
        GM_setClipboard(value) {
            clipboardWrites.push(String(value));
        },
        window: { location: { hostname: 'one.alimama.com' } },
        document: documentRef,
        HTMLElement: FakeHTMLElement,
        Element: FakeHTMLElement,
        URL,
        console,
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
    new Script(`${interceptorBlock}\nglobalThis.__Interceptor = Interceptor;`).runInContext(context);
    const interceptor = context.__Interceptor;
    return {
        interceptor,
        documentRef,
        timers,
        clipboardWrites,
        listenerCount(type) {
            return listeners.get(type)?.size || 0;
        },
        setVisibilityState(nextState) {
            visibilityState = String(nextState || 'visible');
            Array.from(listeners.get('visibilitychange') || []).forEach(handler => handler({ type: 'visibilitychange' }));
        },
        show() {
            interceptor.show('https://demo.oss-accelerate.aliyuncs.com/report.xlsx', 'JSON:test');
            return interceptor.panel;
        },
        getCopyButton() {
            return findByClass(interceptor.panel, 'am-download-copy');
        },
        getStatus() {
            return documentRef.getElementById('am-report-capture-status');
        },
        getTimerDelays() {
            return Array.from(timers.values()).map(timer => timer.delay);
        },
        tickNextTimer() {
            const [timerId, timer] = Array.from(timers.entries())[0] || [];
            if (!timer) return false;
            timers.delete(timerId);
            timer.handler();
            return true;
        }
    };
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
    assert.match(interceptorBlock, /GM_setClipboard\(safeUrl\);[\s\S]*?status\.textContent = '下载链接已复制';[\s\S]*?Interceptor\.scheduleCopyFeedbackReset\(this,\s*status,\s*1500\);/, '复制按钮应更新状态并交给统一 helper 恢复');
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
        /copyResetTimer:\s*0,[\s\S]*copyResetVisibilityHandler:\s*null,[\s\S]*copyResetButton:\s*null,[\s\S]*copyResetStatus:\s*null,[\s\S]*exitModeClickHandler:\s*null,[\s\S]*exitModeClickHandlerBound:\s*false,/,
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
        /removePanel\(\)\s*\{[\s\S]*this\.clearCopyResetState\(\{ reset: false \}\);[\s\S]*this\.unbindExitModeClickHandler\(\);[\s\S]*this\.panel\.onkeydown = null;[\s\S]*this\.panel\.remove\(\);[\s\S]*this\.panel = null;[\s\S]*\}/,
        'removePanel 应卸载面板、释放退出模式监听并通过统一 helper 取消复制恢复定时器'
    );
    assert.match(
        interceptorBlock,
        /clearCopyResetState\(options = \{\}\)\s*\{[\s\S]*this\.clearCopyResetTimer\(\);[\s\S]*this\.clearCopyResetVisibilityHandler\(\);[\s\S]*if \(shouldReset\) this\.resetCopyFeedback\(\);[\s\S]*this\.copyResetButton = null;[\s\S]*this\.copyResetStatus = null;[\s\S]*\}/,
        '复制按钮恢复状态应通过统一 helper 清理 timer、visibility handler 和 DOM 引用'
    );
    assert.match(
        interceptorBlock,
        /scheduleCopyFeedbackReset\(button,\s*status,\s*delay = 1500\)\s*\{[\s\S]*this\.clearCopyResetState\(\{ reset: false \}\);[\s\S]*this\.copyResetButton = button;[\s\S]*this\.copyResetStatus = status;[\s\S]*if \(this\.isCopyResetDocumentHidden\(\)\) \{[\s\S]*this\.resetCopyFeedback\(button,\s*status\);[\s\S]*return;[\s\S]*\}[\s\S]*this\.bindCopyResetVisibilityHandler\(\);[\s\S]*this\.copyResetTimer = setTimeout\(\(\) => \{[\s\S]*this\.copyResetTimer = 0;[\s\S]*this\.resetCopyFeedback\(button,\s*status\);/,
        '复制按钮应在隐藏页即时复位，可见页才保留 1500ms 恢复定时器'
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

test('下载捕获复制反馈 reset timer 在隐藏页即时复位并释放监听', () => {
    const hiddenHarness = createDownloadCaptureHarness('hidden');
    hiddenHarness.show();
    const hiddenCopyBtn = hiddenHarness.getCopyButton();
    const hiddenStatus = hiddenHarness.getStatus();
    hiddenCopyBtn.click();
    assert.equal(hiddenHarness.clipboardWrites.length, 1, '隐藏页复制仍应执行剪贴板写入');
    assert.equal(hiddenCopyBtn.textContent, '复制', '隐藏页复制后应立即恢复按钮文案');
    assert.equal(hiddenStatus.textContent, '链接已捕获，可复制或直连下载', '隐藏页复制后应立即恢复状态文案');
    assert.equal(hiddenHarness.timers.size, 0, '隐藏页复制不应排 1500ms timeout');
    assert.equal(hiddenHarness.listenerCount('visibilitychange'), 0, '隐藏页复制不应残留 visibilitychange');
    assert.equal(hiddenHarness.interceptor.copyResetButton, null, '隐藏页复制不应保留按钮引用');
    assert.equal(hiddenHarness.interceptor.copyResetStatus, null, '隐藏页复制不应保留状态引用');

    const visibleHarness = createDownloadCaptureHarness('visible');
    visibleHarness.show();
    const visibleCopyBtn = visibleHarness.getCopyButton();
    const visibleStatus = visibleHarness.getStatus();
    visibleCopyBtn.click();
    visibleCopyBtn.click();
    assert.deepEqual(visibleHarness.getTimerDelays(), [1500], '可见页重复复制只应保留一个 1500ms timeout');
    assert.equal(visibleHarness.listenerCount('visibilitychange'), 1, '可见页等待复位时应监听转隐藏');
    assert.equal(visibleCopyBtn.textContent, '已复制', '可见页 timer 触发前保留复制成功文案');
    assert.equal(visibleStatus.textContent, '下载链接已复制', '可见页 timer 触发前保留复制成功状态');
    assert.equal(visibleHarness.tickNextTimer(), true, '应能触发可见页复制反馈复位 timer');
    assert.equal(visibleCopyBtn.textContent, '复制', 'timer 后应恢复按钮文案');
    assert.equal(visibleStatus.textContent, '链接已捕获，可复制或直连下载', 'timer 后应恢复状态文案');
    assert.equal(visibleHarness.listenerCount('visibilitychange'), 0, 'timer 完成后应释放 visibilitychange');
    assert.equal(visibleHarness.interceptor.copyResetButton, null, 'timer 完成后应释放按钮引用');
    assert.equal(visibleHarness.interceptor.copyResetStatus, null, 'timer 完成后应释放状态引用');

    const switchHarness = createDownloadCaptureHarness('visible');
    switchHarness.show();
    const switchCopyBtn = switchHarness.getCopyButton();
    const switchStatus = switchHarness.getStatus();
    switchCopyBtn.click();
    assert.deepEqual(switchHarness.getTimerDelays(), [1500], '转隐藏前应先按原 1500ms 调度');
    switchHarness.setVisibilityState('hidden');
    assert.equal(switchHarness.timers.size, 0, '转隐藏时应取消已排复制反馈 timeout');
    assert.equal(switchCopyBtn.textContent, '复制', '转隐藏时应立即恢复按钮文案');
    assert.equal(switchStatus.textContent, '链接已捕获，可复制或直连下载', '转隐藏时应立即恢复状态文案');
    assert.equal(switchHarness.listenerCount('visibilitychange'), 0, '转隐藏收尾后应释放 visibilitychange');

    const closeHarness = createDownloadCaptureHarness('visible');
    closeHarness.show();
    closeHarness.getCopyButton().click();
    closeHarness.interceptor.removePanel();
    assert.equal(closeHarness.timers.size, 0, '面板卸载应取消复制反馈 timeout');
    assert.equal(closeHarness.listenerCount('visibilitychange'), 0, '面板卸载应释放 visibilitychange');
    assert.equal(closeHarness.interceptor.copyResetButton, null, '面板卸载应释放按钮引用');
    assert.equal(closeHarness.interceptor.copyResetStatus, null, '面板卸载应释放状态引用');
    assert.equal(closeHarness.interceptor.panel, null, '面板卸载后应清空 panel 引用');
});

test('下载捕获退出模式 click 监听只在面板展示期间绑定', () => {
    const interceptorBlock = getInterceptorBlock();
    const registerHooksBlock = interceptorBlock.match(/registerHooks\(\)\s*\{[\s\S]*?\n\s*\}\n\s*\};/)?.[0] || '';
    assert.match(
        interceptorBlock,
        /bindExitModeClickHandler\(\)\s*\{[\s\S]*if \(this\.exitModeClickHandlerBound\) return;[\s\S]*this\.exitModeClickHandler = \(e\) => \{[\s\S]*const isExitModeBtn = !!target\.closest\('#mx_2517 > button'\);[\s\S]*const isExitModeText = text\.includes\('退出模式'\);[\s\S]*this\.removePanel\(\);[\s\S]*\};[\s\S]*document\.addEventListener\('click', this\.exitModeClickHandler, true\);[\s\S]*this\.exitModeClickHandlerBound = true;[\s\S]*\}/,
        '退出模式 click 监听应通过命名 handler 按需绑定'
    );
    assert.match(
        interceptorBlock,
        /unbindExitModeClickHandler\(\)\s*\{[\s\S]*if \(!this\.exitModeClickHandlerBound\) return;[\s\S]*document\.removeEventListener\('click', this\.exitModeClickHandler, true\);[\s\S]*this\.exitModeClickHandlerBound = false;[\s\S]*\}/,
        '退出模式 click 监听应可释放'
    );
    assert.match(
        interceptorBlock,
        /const panel = this\.createPanel\(\);[\s\S]*this\.bindExitModeClickHandler\(\);[\s\S]*if \(panel\.dataset\.lastUrl === safeUrl && panel\.style\.display === 'block'\) return;/,
        'show 应在面板展示和重复 URL 早退前确保退出模式监听已绑定'
    );
    assert.doesNotMatch(
        registerHooksBlock,
        /document\.addEventListener\('click'/,
        'registerHooks 不应冷态常驻注册退出模式 click 监听'
    );
});
