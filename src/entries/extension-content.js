(() => {
    const SCRIPT_ID = 'am-helper-pro-extension-page-bundle';
    const ERROR_ID = 'am-helper-pro-extension-injection-error';
    const LICENSE_VERIFY_BRIDGE_CHANNEL = 'am-helper-pro:license-verify';
    const LICENSE_VERIFY_REQUEST_TYPE = 'verify-request';
    const LICENSE_VERIFY_RESPONSE_TYPE = 'verify-response';
    const LICENSE_VERIFY_MESSAGE_TYPE = 'AM_LICENSE_VERIFY_REQUEST';
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

    const postBridgeMessage = (payload = {}) => {
        const targetOrigin = String(window.location?.origin || '').trim() || '*';
        window.postMessage(payload, targetOrigin);
    };

    const forwardLicenseVerifyRequest = (requestId = '', payload = null) => {
        chrome.runtime.sendMessage({
            type: LICENSE_VERIFY_MESSAGE_TYPE,
            payload
        }, (response) => {
            const runtimeError = chrome.runtime.lastError;
            if (runtimeError) {
                postBridgeMessage({
                    channel: LICENSE_VERIFY_BRIDGE_CHANNEL,
                    type: LICENSE_VERIFY_RESPONSE_TYPE,
                    requestId,
                    ok: false,
                    status: 0,
                    message: String(runtimeError.message || 'runtime_unavailable')
                });
                return;
            }

            postBridgeMessage({
                channel: LICENSE_VERIFY_BRIDGE_CHANNEL,
                type: LICENSE_VERIFY_RESPONSE_TYPE,
                requestId,
                ...(response && typeof response === 'object'
                    ? response
                    : {
                        ok: false,
                        status: 0,
                        message: 'empty_background_response'
                    })
            });
        });
    };

    window.addEventListener('message', (event) => {
        if (event.source !== window) return;
        const data = event.data;
        if (!data || typeof data !== 'object') return;
        if (data.channel !== LICENSE_VERIFY_BRIDGE_CHANNEL) return;
        if (data.type !== LICENSE_VERIFY_REQUEST_TYPE) return;

        const requestId = String(data.requestId || '').trim();
        const payload = data.payload && typeof data.payload === 'object'
            ? data.payload
            : null;
        if (!requestId || !payload) return;

        forwardLicenseVerifyRequest(requestId, payload);
    });

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
