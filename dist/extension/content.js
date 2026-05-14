(() => {
    const SCRIPT_ID = 'am-helper-pro-extension-page-bundle';
    const ERROR_ID = 'am-helper-pro-extension-injection-error';
    if (document.getElementById(SCRIPT_ID)) return;

    const renderInjectionError = (message = '') => {
        if (document.getElementById(ERROR_ID)) return;
        const root = document.createElement('div');
        root.id = ERROR_ID;
        root.className = 'am-helper-pro-extension-error';
        root.textContent = message || '阿里妈妈助手加载失败，请刷新页面或重新加载扩展。';
        root.style.cssText = [
            'position:fixed',
            'right:16px',
            'bottom:16px',
            'z-index:2147483647',
            'max-width:360px',
            'padding:10px 12px',
            'border-radius:8px',
            'background:#b91c1c',
            'color:#fff',
            'font:13px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
            'box-shadow:0 10px 28px rgba(15,23,42,.24)'
        ].join(';');
        (document.body || document.documentElement || document).appendChild(root);
    };

    const mountNode = document.head || document.documentElement || document.body;
    if (!mountNode) {
        renderInjectionError();
        return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.type = 'text/javascript';
    try {
        script.src = chrome.runtime.getURL('page.bundle.js');
    } catch {
        renderInjectionError('阿里妈妈助手加载失败：扩展资源地址不可用。');
        return;
    }
    script.dataset.amHelperSource = 'extension';
    script.dataset.amHelperInjectedAt = String(Date.now());
    script.onload = () => script.remove();
    script.onerror = () => {
        script.remove();
        renderInjectionError();
    };
    try {
        mountNode.appendChild(script);
    } catch {
        renderInjectionError();
    }
})();
