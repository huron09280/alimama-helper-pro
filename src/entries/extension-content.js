(() => {
    const SCRIPT_ID = 'am-helper-pro-extension-page-bundle';
    if (document.getElementById(SCRIPT_ID)) return;

    const mountNode = document.head || document.documentElement || document.body;
    if (!mountNode) return;

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.type = 'text/javascript';
    script.src = chrome.runtime.getURL('page.bundle.js');
    script.dataset.amHelperSource = 'extension';
    script.dataset.amHelperInjectedAt = String(Date.now());
    script.onload = () => script.remove();
    script.onerror = () => script.remove();
    mountNode.appendChild(script);
})();
