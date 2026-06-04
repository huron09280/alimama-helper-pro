    const KEYWORD_PLAN_OPEN_BRIDGE_READY_KEY = '__AM_WXT_KEYWORD_OPEN_BRIDGE_READY__';
    const KEYWORD_PLAN_OPEN_BRIDGE_REQ_EVENT = '__AM_WXT_KEYWORD_OPEN_BRIDGE_REQ__';
    const KEYWORD_PLAN_OPEN_BRIDGE_RES_EVENT = '__AM_WXT_KEYWORD_OPEN_BRIDGE_RES__';
    const API_BRIDGE_METHODS = [
        'openWizard',
        'getRuntimeDefaults',
        'searchItems',
        'createPlansBatch',
        'createPlansByScene',
        'copyCurrentPlanByScene',
        'createSitePlansBatch',
        'createKeywordPlansBatch',
        'createCrowdPlansBatch',
        'createShopDirectPlansBatch',
        'createContentPlansBatch',
        'createLeadPlansBatch',
        'applyMatrixPreset',
        'runCreateRepairByItem',
        'appendKeywords',
        'suggestKeywords',
        'suggestCrowds',
        'validate',
        'getSessionDraft',
        'clearSessionDraft'
    ];
    const API_BRIDGE_METHOD_SET = new Set(API_BRIDGE_METHODS);
    const isExtensionPageRuntime = () => {
        try {
            return window.__AM_PLATFORM_RUNTIME__?.mode === 'extension';
        } catch {
            return false;
        }
    };
    const resolveKeywordPlanApiForBridge = () => {
        try {
            if (typeof KeywordPlanApi !== 'undefined' && KeywordPlanApi && typeof KeywordPlanApi.openWizard === 'function') {
                return KeywordPlanApi;
            }
        } catch { }
        try {
            const fromWindow = window.__AM_WXT_KEYWORD_API__;
            if (fromWindow && typeof fromWindow.openWizard === 'function') return fromWindow;
        } catch { }
        try {
            const fromGlobal = globalThis.__AM_WXT_KEYWORD_API__;
            if (fromGlobal && typeof fromGlobal.openWizard === 'function') return fromGlobal;
        } catch { }
        return null;
    };
    const resolveKeywordPlanOpenForBridge = () => {
        const api = resolveKeywordPlanApiForBridge();
        if (api && typeof api.openWizard === 'function') {
            return () => api.openWizard();
        }
        return null;
    };
    const ensureKeywordPlanApiForBridge = async (options = {}) => {
        const needFullApi = options.needFullApi === true;
        const currentApi = resolveKeywordPlanApiForBridge();
        if (currentApi || (!needFullApi && resolveKeywordPlanOpenForBridge())) return currentApi;
        throw new Error(needFullApi ? 'keyword_plan_api_not_ready' : 'keyword_plan_open_not_ready');
    };
    const installKeywordPlanOpenBridgeHost = () => {
        const dispatchOpenBridgeResponse = (payload) => {
            try {
                window.dispatchEvent(new CustomEvent(KEYWORD_PLAN_OPEN_BRIDGE_RES_EVENT, { detail: payload }));
            } catch { }
        };
        const handleOpenBridgeRequest = async (event) => {
            const callId = String(event?.detail?.callId || '').trim();
            if (!callId) return;
            const payload = {
                callId,
                ok: false,
                result: null,
                error: ''
            };
            try {
                await ensureKeywordPlanApiForBridge();
                const openWizard = resolveKeywordPlanOpenForBridge();
                if (typeof openWizard !== 'function') {
                    throw new Error('keyword_plan_open_not_ready');
                }
                const result = openWizard();
                payload.result = result && typeof result.then === 'function' ? await result : result;
                payload.ok = true;
            } catch (err) {
                payload.error = err?.message || String(err || 'keyword_open_bridge_failed');
            }
            dispatchOpenBridgeResponse(payload);
        };
        window.addEventListener(KEYWORD_PLAN_OPEN_BRIDGE_REQ_EVENT, handleOpenBridgeRequest, false);
        try {
            Object.defineProperty(window, KEYWORD_PLAN_OPEN_BRIDGE_READY_KEY, {
                value: '1',
                configurable: false,
                enumerable: false,
                writable: false
            });
        } catch {
            try {
                window[KEYWORD_PLAN_OPEN_BRIDGE_READY_KEY] = '1';
            } catch { }
        }
    };
    const installPageApiBridgeHost = () => {
        if (window.__AM_WXT_PLAN_API_BRIDGE_HOST__) return;
        window.__AM_WXT_PLAN_API_BRIDGE_HOST__ = true;
        const BRIDGE_RESULT_CACHE_TTL_MS = 90 * 1000;
        const inFlightCallIds = new Set();
        const resolvedPayloadCache = new Map();
        let bridgeCacheCleanupTimer = 0;
        let bridgeCacheCleanupVisibilityHandler = null;
        const isBridgeDocumentHidden = () => {
            try {
                return document.visibilityState === 'hidden';
            } catch {
                return false;
            }
        };
        const clearBridgeCacheCleanupTimer = () => {
            if (!bridgeCacheCleanupTimer) return;
            clearTimeout(bridgeCacheCleanupTimer);
            bridgeCacheCleanupTimer = 0;
        };
        const releaseBridgeCacheCleanupVisibilityHandlerIfIdle = () => {
            if (bridgeCacheCleanupTimer || resolvedPayloadCache.size > 0) return;
            if (typeof bridgeCacheCleanupVisibilityHandler === 'function') {
                document.removeEventListener('visibilitychange', bridgeCacheCleanupVisibilityHandler);
            }
            bridgeCacheCleanupVisibilityHandler = null;
        };
        const bindBridgeCacheCleanupVisibilityHandler = () => {
            if (typeof bridgeCacheCleanupVisibilityHandler === 'function') return;
            bridgeCacheCleanupVisibilityHandler = () => {
                if (isBridgeDocumentHidden()) {
                    clearBridgeCacheCleanupTimer();
                    return;
                }
                scheduleBridgeCacheCleanup();
            };
            document.addEventListener('visibilitychange', bridgeCacheCleanupVisibilityHandler);
        };
        const cleanupBridgeCache = () => {
            const now = Date.now();
            let nextDelayMs = Infinity;
            resolvedPayloadCache.forEach((cached, callId) => {
                const ts = Number(cached?.ts);
                if (!Number.isFinite(ts) || now - ts > BRIDGE_RESULT_CACHE_TTL_MS) {
                    resolvedPayloadCache.delete(callId);
                    return;
                }
                nextDelayMs = Math.min(nextDelayMs, Math.max(0, BRIDGE_RESULT_CACHE_TTL_MS - (now - ts)));
            });
            return Number.isFinite(nextDelayMs) ? nextDelayMs : null;
        };
        const scheduleBridgeCacheCleanup = () => {
            if (bridgeCacheCleanupTimer) return;
            const nextDelayMs = cleanupBridgeCache();
            if (!Number.isFinite(nextDelayMs)) {
                releaseBridgeCacheCleanupVisibilityHandlerIfIdle();
                return;
            }
            bindBridgeCacheCleanupVisibilityHandler();
            if (isBridgeDocumentHidden()) return;
            bridgeCacheCleanupTimer = window.setTimeout(() => {
                bridgeCacheCleanupTimer = 0;
                cleanupBridgeCache();
                scheduleBridgeCacheCleanup();
            }, Math.max(1, Math.ceil(nextDelayMs) + 1));
        };
        const extractBridgeDetail = (raw) => {
            if (!raw || typeof raw !== 'object') return null;
            const callId = String(raw.callId || '').trim();
            const method = String(raw.method || '').trim();
            const args = Array.isArray(raw.args) ? raw.args : [];
            if (!callId || !method) return null;
            return {
                callId,
                method,
                args
            };
        };
        const dispatchBridgeResponse = (payload) => {
            try {
                window.dispatchEvent(new CustomEvent(API_BRIDGE_RES_EVENT, { detail: payload }));
            } catch { }
            try {
                document.dispatchEvent(new CustomEvent(API_BRIDGE_RES_EVENT, { detail: payload }));
            } catch { }
            try {
                window.postMessage({
                    channel: API_BRIDGE_MSG_CHANNEL,
                    direction: 'res',
                    payload
                }, '*');
            } catch { }
        };
        const processBridgeRequest = async (detail) => {
            const callId = String(detail.callId || '').trim();
            const method = String(detail.method || '').trim();
            const args = Array.isArray(detail.args) ? detail.args : [];
            if (!callId || !method) return;
            cleanupBridgeCache();
            if (resolvedPayloadCache.has(callId)) {
                dispatchBridgeResponse(resolvedPayloadCache.get(callId).payload);
                return;
            }
            if (inFlightCallIds.has(callId)) return;
            inFlightCallIds.add(callId);
            const payload = {
                callId,
                method,
                ok: false,
                result: null,
                error: ''
            };
            try {
                if (!API_BRIDGE_METHOD_SET.has(method)) {
                    throw new Error(`method_not_allowed:${method}`);
                }
                const api = await ensureKeywordPlanApiForBridge({ needFullApi: true });
                const fn = api?.[method];
                if (typeof fn !== 'function') {
                    throw new Error(`method_not_found:${method}`);
                }
                payload.result = await fn(...args);
                payload.ok = true;
            } catch (err) {
                payload.error = err?.message || String(err);
            } finally {
                inFlightCallIds.delete(callId);
            }
            resolvedPayloadCache.set(callId, {
                ts: Date.now(),
                payload
            });
            scheduleBridgeCacheCleanup();
            dispatchBridgeResponse(payload);
        };
        const handleBridgeRequestEvent = (event) => {
            const detail = extractBridgeDetail(event?.detail);
            if (!detail) return;
            processBridgeRequest(detail);
        };
        const handleBridgeRequestMessage = (event) => {
            if (!event || event.source !== window) return;
            const data = event.data;
            if (!data || typeof data !== 'object') return;
            if (String(data.channel || '').trim() !== API_BRIDGE_MSG_CHANNEL) return;
            if (String(data.direction || '').trim() !== 'req') return;
            const detail = extractBridgeDetail(data.payload);
            if (!detail) return;
            processBridgeRequest(detail);
        };
        window.addEventListener(API_BRIDGE_REQ_EVENT, handleBridgeRequestEvent);
        document.addEventListener(API_BRIDGE_REQ_EVENT, handleBridgeRequestEvent);
        window.addEventListener('message', handleBridgeRequestMessage, false);
    };
    const injectPageApiBridgeClient = () => {
        if (document.getElementById('am-wxt-plan-api-bridge-client')) return;
        const script = document.createElement('script');
        script.id = 'am-wxt-plan-api-bridge-client';
        script.type = 'text/javascript';
        const bridgeBuildVersion = resolveKeywordPlanApiForBridge()?.buildVersion || window.__AM_WXT_PLAN_BUILD__ || '';
        script.textContent = `
            ;(function() {
                try {
                    var REQ = ${JSON.stringify(API_BRIDGE_REQ_EVENT)};
                    var RES = ${JSON.stringify(API_BRIDGE_RES_EVENT)};
                    var CHANNEL = ${JSON.stringify(API_BRIDGE_MSG_CHANNEL)};
                    var METHODS = ${JSON.stringify(API_BRIDGE_METHODS)};
                    var BUILD = ${JSON.stringify(bridgeBuildVersion)};
                    var DEBUG_STORAGE_KEY = ${JSON.stringify(PAGE_API_DEBUG_STORAGE_KEY)};
                    var shouldExposePageApi = function() {
                        try {
                            return window.localStorage && window.localStorage.getItem(DEBUG_STORAGE_KEY) === '1';
                        } catch (_) {
                            return false;
                        }
                    };
                    var METHOD_TIMEOUTS = {
                        runCreateRepairByItem: 30 * 60 * 1000
                    };
                    var resolveTimeout = function(method) {
                        var methodKey = String(method || '').trim();
                        if (!methodKey) return 180000;
                        var resolved = METHOD_TIMEOUTS[methodKey];
                        if (typeof resolved === 'number' && Number.isFinite(resolved) && resolved > 0) {
                            return Math.max(180000, resolved);
                        }
                        return 180000;
                    };
                    var callApi = function(method, args) {
                        return new Promise(function(resolve, reject) {
                            var callId = 'wxt_bridge_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
                            var done = false;
                            var timeoutMs = resolveTimeout(method);
                            var timeoutId = setTimeout(function() {
                                if (done) return;
                                done = true;
                                window.removeEventListener(RES, onResponse, false);
                                document.removeEventListener(RES, onResponse, false);
                                window.removeEventListener('message', onMessage, false);
                                reject(new Error('bridge_timeout:' + method));
                            }, timeoutMs);
                            var onResponse = function(event) {
                                var detail = event && event.detail ? event.detail : {};
                                if (!detail || detail.callId !== callId) return;
                                if (done) return;
                                done = true;
                                clearTimeout(timeoutId);
                                window.removeEventListener(RES, onResponse, false);
                                document.removeEventListener(RES, onResponse, false);
                                window.removeEventListener('message', onMessage, false);
                                if (detail.ok) {
                                    resolve(detail.result);
                                } else {
                                    reject(new Error(detail.error || ('bridge_error:' + method)));
                                }
                            };
                            var onMessage = function(event) {
                                var data = event && event.data ? event.data : null;
                                if (!data || data.channel !== CHANNEL || data.direction !== 'res') return;
                                var detail = data && data.payload ? data.payload : {};
                                if (!detail || detail.callId !== callId) return;
                                if (done) return;
                                done = true;
                                clearTimeout(timeoutId);
                                window.removeEventListener(RES, onResponse, false);
                                document.removeEventListener(RES, onResponse, false);
                                window.removeEventListener('message', onMessage, false);
                                if (detail.ok) {
                                    resolve(detail.result);
                                } else {
                                    reject(new Error(detail.error || ('bridge_error:' + method)));
                                }
                            };
                            window.addEventListener(RES, onResponse, false);
                            document.addEventListener(RES, onResponse, false);
                            window.addEventListener('message', onMessage, false);
                            var requestDetail = {
                                callId: callId,
                                method: method,
                                args: Array.isArray(args) ? args : []
                            };
                            window.dispatchEvent(new CustomEvent(REQ, {
                                detail: requestDetail
                            }));
                            document.dispatchEvent(new CustomEvent(REQ, {
                                detail: requestDetail
                            }));
                            window.postMessage({
                                channel: CHANNEL,
                                direction: 'req',
                                payload: requestDetail
                            }, '*');
                        });
                    };
                    var bridgeApi = {
                        buildVersion: BUILD
                    };
                    METHODS.forEach(function(method) {
                        bridgeApi[method] = function() {
                            return callApi(method, Array.prototype.slice.call(arguments));
                        };
                    });
                    if (shouldExposePageApi()) {
                        window.__AM_WXT_KEYWORD_API__ = bridgeApi;
                        window.__AM_WXT_PLAN_API__ = bridgeApi;
                    }
                    window.__AM_WXT_PLAN_BUILD__ = BUILD;
                } catch (err) {
                    console.warn('[AM] plan api bridge client inject failed', err);
                }
            })();
        `;
        (document.documentElement || document.head || document.body || document).appendChild(script);
        script.remove();
    };
    if (typeof globalThis !== 'undefined' && !isExtensionPageRuntime()) {
        globalThis.__AM_TOKENS__ = State.tokens;
        globalThis.__AM_WXT_KEYWORD_API__ = KeywordPlanApi;
        globalThis.__AM_WXT_PLAN_API__ = KeywordPlanApi;
        globalThis.__AM_WXT_PLAN_BUILD__ = KeywordPlanApi.buildVersion || '';
        globalThis.__AM_WXT_PLAN_PATCH__ = 'adzone-default-sync-v5';
    }
    installKeywordPlanOpenBridgeHost();
    if (isExtensionPageRuntime() || shouldExposePageApiDebug()) {
        installPageApiBridgeHost();
    }
    if (shouldExposePageApiDebug()) {
        const directKeywordPlanApi = resolveKeywordPlanApiForBridge();
        if (!isExtensionPageRuntime() && directKeywordPlanApi) {
            window.__AM_WXT_KEYWORD_API__ = directKeywordPlanApi;
            window.__AM_WXT_PLAN_API__ = directKeywordPlanApi;
        }
        injectPageApiBridgeClient();
    }
    window.__AM_WXT_PLAN_BUILD__ = resolveKeywordPlanApiForBridge()?.buildVersion || '';
    window.__AM_WXT_PLAN_PATCH__ = 'adzone-default-sync-v5';
    if (pageGlobal && pageGlobal !== window) {
        pageGlobal.__AM_WXT_PLAN_BUILD__ = resolveKeywordPlanApiForBridge()?.buildVersion || '';
        pageGlobal.__AM_WXT_PLAN_PATCH__ = 'adzone-default-sync-v5';
    }

    // [INTEGRATED] Expose toggle function
