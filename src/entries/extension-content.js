(() => {
    const SCRIPT_ID = 'am-helper-pro-extension-page-bundle';
    const ERROR_ID = 'am-helper-pro-extension-injection-error';
    const LICENSE_VERIFY_BRIDGE_CHANNEL = 'am-helper-pro:license-verify';
    const LICENSE_VERIFY_REQUEST_TYPE = 'verify-request';
    const LICENSE_VERIFY_RESPONSE_TYPE = 'verify-response';
    const LICENSE_VERIFY_MESSAGE_TYPE = 'AM_LICENSE_VERIFY_REQUEST';
    const INJECTION_CHECK_DELAY_MS = 80;
    const URL_POLL_INITIAL_INTERVAL_MS = 600;
    const URL_POLL_MAX_INTERVAL_MS = 4800;
    if (document.getElementById(SCRIPT_ID)) return;

    const normalizeHostname = (value = '') => String(value || '').trim().toLowerCase();
    const resolveCurrentUrl = () => {
        try {
            return new URL(String(window.location?.href || ''));
        } catch {
            return null;
        }
    };
    const isMysellerHost = (hostname = '') => (
        hostname === 'myseller.taobao.com'
        || hostname.endsWith('.myseller.taobao.com')
    );
    const isDmpHost = (hostname = '') => hostname === 'dmp.taobao.com';
    const isSmartAssistantBudgetPage = (url = null) => {
        if (!url) return false;
        const pathname = String(url.pathname || '').toLowerCase();
        const hash = String(url.hash || '').toLowerCase();
        return (
            pathname.includes('/home.htm')
            && (/crm-workbench\/smartassistant/i.test(pathname) || /crm-workbench\/smartassistant/i.test(hash))
        );
    };
    const shouldInjectPageBundle = () => {
        const url = resolveCurrentUrl();
        if (!url) return false;
        if (String(url.protocol || '').toLowerCase() !== 'https:') return false;
        const hostname = normalizeHostname(url.hostname);
        if (hostname === 'one.alimama.com') return true;
        if (isDmpHost(hostname)) return true;
        if (isMysellerHost(hostname)) return isSmartAssistantBudgetPage(url);
        return false;
    };
    const shouldWatchForDeferredInjection = () => {
        const url = resolveCurrentUrl();
        if (!url) return false;
        if (String(url.protocol || '').toLowerCase() !== 'https:') return false;
        return isMysellerHost(normalizeHostname(url.hostname));
    };

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
    let pageBundleInjected = false;

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

    const injectPageBundle = () => {
        if (pageBundleInjected || document.getElementById(SCRIPT_ID)) return true;
        const nextMountNode = document.head || document.documentElement || document.body || mountNode;
        if (!nextMountNode) {
            renderInjectionError();
            return false;
        }

        const script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.type = 'text/javascript';
        try {
            script.src = chrome.runtime.getURL('page.bundle.js');
        } catch {
            renderInjectionError('阿里妈妈助手加载失败：扩展资源地址不可用。');
            return false;
        }
        script.dataset.amHelperSource = 'extension';
        script.dataset.amHelperInjectedAt = String(Date.now());
        script.onload = () => script.remove();
        script.onerror = () => {
            script.remove();
            renderInjectionError();
        };
        try {
            nextMountNode.appendChild(script);
            pageBundleInjected = true;
            return true;
        } catch {
            renderInjectionError();
            return false;
        }
    };

    const tryInjectPageBundle = () => {
        if (!shouldInjectPageBundle()) return false;
        return injectPageBundle();
    };

    let injectionCheckTimer = 0;
    let urlPollTimer = 0;
    let urlPollDelayMs = URL_POLL_INITIAL_INTERVAL_MS;
    let deferredInjectionWatchActive = false;
    let pendingHiddenUrlPoll = false;
    let lastObservedUrl = String(window.location?.href || '');
    const isDocumentHidden = () => document.visibilityState === 'hidden';
    const resetUrlPollDelay = () => {
        urlPollDelayMs = URL_POLL_INITIAL_INTERVAL_MS;
    };
    const clearInjectionCheckTimer = () => {
        if (!injectionCheckTimer) return;
        window.clearTimeout(injectionCheckTimer);
        injectionCheckTimer = 0;
    };
    const clearUrlPollTimer = () => {
        if (!urlPollTimer) return;
        window.clearTimeout(urlPollTimer);
        urlPollTimer = 0;
    };
    const markHiddenUrlPollPending = () => {
        pendingHiddenUrlPoll = true;
        clearInjectionCheckTimer();
        clearUrlPollTimer();
    };
    let stopDeferredInjectionWatch = () => {
        clearInjectionCheckTimer();
        clearUrlPollTimer();
    };
    function handleDeferredInjectionVisibilityChange() {
        if (!deferredInjectionWatchActive) return;
        if (isDocumentHidden()) {
            markHiddenUrlPollPending();
            return;
        }
        if (!pendingHiddenUrlPoll) return;
        pendingHiddenUrlPoll = false;
        scheduleInjectionCheck();
        startUrlPolling();
    }
    const scheduleInjectionCheck = () => {
        resetUrlPollDelay();
        if (pageBundleInjected || document.getElementById(SCRIPT_ID)) {
            stopDeferredInjectionWatch();
            return;
        }
        if (isDocumentHidden()) {
            markHiddenUrlPollPending();
            return;
        }
        if (injectionCheckTimer) return;
        injectionCheckTimer = window.setTimeout(() => {
            injectionCheckTimer = 0;
            if (tryInjectPageBundle()) stopDeferredInjectionWatch();
        }, INJECTION_CHECK_DELAY_MS);
    };
    stopDeferredInjectionWatch = () => {
        clearInjectionCheckTimer();
        clearUrlPollTimer();
        if (!deferredInjectionWatchActive) return;
        window.removeEventListener('hashchange', scheduleInjectionCheck);
        window.removeEventListener('popstate', scheduleInjectionCheck);
        document.removeEventListener('visibilitychange', handleDeferredInjectionVisibilityChange);
        deferredInjectionWatchActive = false;
        pendingHiddenUrlPoll = false;
    };
    const scheduleNextUrlPoll = () => {
        if (urlPollTimer || pageBundleInjected || document.getElementById(SCRIPT_ID)) return;
        if (isDocumentHidden()) {
            markHiddenUrlPollPending();
            return;
        }
        urlPollTimer = window.setTimeout(() => {
            urlPollTimer = 0;
            if (isDocumentHidden()) {
                markHiddenUrlPollPending();
                return;
            }
            const currentUrl = String(window.location?.href || '');
            if (currentUrl !== lastObservedUrl) {
                lastObservedUrl = currentUrl;
                scheduleInjectionCheck();
            } else {
                urlPollDelayMs = Math.min(URL_POLL_MAX_INTERVAL_MS, Math.max(URL_POLL_INITIAL_INTERVAL_MS, urlPollDelayMs * 2));
            }
            if (!pageBundleInjected && !document.getElementById(SCRIPT_ID)) {
                scheduleNextUrlPoll();
            }
        }, urlPollDelayMs);
    };
    const startUrlPolling = () => {
        if (urlPollTimer) return;
        resetUrlPollDelay();
        scheduleNextUrlPoll();
    };

    if (!tryInjectPageBundle() && shouldWatchForDeferredInjection()) {
        window.addEventListener('hashchange', scheduleInjectionCheck);
        window.addEventListener('popstate', scheduleInjectionCheck);
        document.addEventListener('visibilitychange', handleDeferredInjectionVisibilityChange);
        deferredInjectionWatchActive = true;
        startUrlPolling();
    }
})();
