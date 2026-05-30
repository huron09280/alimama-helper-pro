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
        root.setAttribute('role', 'alert');
        root.setAttribute('aria-live', 'assertive');
        root.setAttribute('aria-atomic', 'true');
        root.tabIndex = -1;
        root.textContent = message || '阿里妈妈助手加载失败，请刷新页面或重新加载扩展。';
        root.style.cssText = [
            'position:fixed',
            'right:16px',
            'bottom:16px',
            'z-index:2147483647',
            'max-width:360px',
            'padding:12px 14px',
            'border-radius:14px',
            'border:1px solid rgba(255,255,255,.62)',
            'background:linear-gradient(135deg, rgba(255,255,255,.86), rgba(255,255,255,.58))',
            'color:#7f1d1d',
            'font:13px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
            'box-shadow:0 12px 32px rgba(31,38,135,.16)',
            'backdrop-filter:blur(18px) saturate(1.28)',
            '-webkit-backdrop-filter:blur(18px) saturate(1.28)',
            'outline:none'
        ].join(';');
        (document.body || document.documentElement || document).appendChild(root);
        if (typeof root.focus === 'function') {
            root.focus({ preventScroll: true });
        }
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

    let licenseBridgeRuntimeUnavailableMessage = '';

    const markLicenseBridgeRuntimeUnavailable = (err) => {
        licenseBridgeRuntimeUnavailableMessage = String(err?.message || err || 'runtime_unavailable').trim() || 'runtime_unavailable';
    };

    const postLicenseBridgeRuntimeUnavailable = (requestId = '') => {
        postBridgeMessage({
            channel: LICENSE_VERIFY_BRIDGE_CHANNEL,
            type: LICENSE_VERIFY_RESPONSE_TYPE,
            requestId,
            ok: false,
            status: 0,
            message: licenseBridgeRuntimeUnavailableMessage || 'runtime_unavailable'
        });
    };

    const forwardLicenseVerifyRequest = (requestId = '', payload = null) => {
        if (licenseBridgeRuntimeUnavailableMessage) {
            postLicenseBridgeRuntimeUnavailable(requestId);
            return;
        }

        try {
            chrome.runtime.sendMessage({
                type: LICENSE_VERIFY_MESSAGE_TYPE,
                payload
            }, (response) => {
                let runtimeError = null;
                try {
                    runtimeError = chrome.runtime.lastError;
                } catch (err) {
                    markLicenseBridgeRuntimeUnavailable(err);
                    postLicenseBridgeRuntimeUnavailable(requestId);
                    return;
                }

                if (runtimeError) {
                    markLicenseBridgeRuntimeUnavailable(runtimeError);
                    postLicenseBridgeRuntimeUnavailable(requestId);
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
        } catch (err) {
            markLicenseBridgeRuntimeUnavailable(err);
            postLicenseBridgeRuntimeUnavailable(requestId);
        }
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
