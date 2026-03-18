    // ==================== Token 管理模块 ====================
    const TokenManager = {
        hookReady: false,
        isStrongCsrf: (value) => {
            const v = value === null || value === undefined ? '' : String(value).trim();
            if (!v) return false;
            // one 平台有效 csrfId 通常包含下划线并且长度较长，例如: xxxxx_1_1_1
            if (v.includes('_') && v.length >= 12) return true;
            // 兼容部分场景：长度较长的非纯数字 token 也视为有效
            if (!/^\d+$/.test(v) && v.length >= 16) return true;
            return false;
        },
        applyCsrf: (value) => {
            const next = value === null || value === undefined ? '' : String(value).trim();
            if (!next) return;
            const prev = State.tokens.csrfID === null || State.tokens.csrfID === undefined
                ? '' : String(State.tokens.csrfID).trim();
            if (!prev || TokenManager.isStrongCsrf(next) || !TokenManager.isStrongCsrf(prev)) {
                State.tokens.csrfID = next;
            }
        },

        // Hook XHR 捕获 Token
        hookXHR: () => {
            if (TokenManager.hookReady) return;
            const hooks = window.__AM_HOOK_MANAGER__;
            if (!hooks) {
                Logger.warn('统一 Hook 管理器不可用，已跳过 Token Hook 注入');
                return;
            }

            const syncFromUrl = (rawUrl) => {
                try {
                    if (!rawUrl
                        || (!rawUrl.includes('dynamicToken')
                            && !rawUrl.includes('loginPointId')
                            && !rawUrl.includes('csrfId')
                            && !rawUrl.includes('csrfID'))) return;
                    const urlObj = new URL(rawUrl, window.location.origin);
                    State.tokens.dynamicToken = urlObj.searchParams.get('dynamicToken') || State.tokens.dynamicToken;
                    State.tokens.loginPointId = urlObj.searchParams.get('loginPointId') || State.tokens.loginPointId;
                    TokenManager.applyCsrf(urlObj.searchParams.get('csrfId') || urlObj.searchParams.get('csrfID'));
                } catch { }
            };

            const syncFromBody = (body) => {
                if (!body || typeof body !== 'string') return;
                try {
                    const json = JSON.parse(body);
                    State.tokens.dynamicToken = json.dynamicToken || State.tokens.dynamicToken;
                    State.tokens.loginPointId = json.loginPointId || State.tokens.loginPointId;
                    TokenManager.applyCsrf(json.csrfId || json.csrfID);
                } catch {
                    const params = new URLSearchParams(body);
                    State.tokens.dynamicToken = params.get('dynamicToken') || State.tokens.dynamicToken;
                    State.tokens.loginPointId = params.get('loginPointId') || State.tokens.loginPointId;
                    TokenManager.applyCsrf(params.get('csrfId') || params.get('csrfID'));
                }
            };

            hooks.registerXHROpen(({ xhr, url }) => {
                xhr._url = url;
                syncFromUrl(url);
            });

            hooks.registerXHRSend(({ data, url }) => {
                syncFromUrl(url);
                syncFromBody(data);
            });

            TokenManager.hookReady = true;
            Logger.info('XHR Hook 已接入统一管理器');
        },

        // 深度搜索全局变量
        deepSearch: () => {
            if (State.tokens.dynamicToken && State.tokens.loginPointId && TokenManager.isStrongCsrf(State.tokens.csrfID)) return;

            const findInObj = (obj, depth = 0) => {
                if (!obj || depth > 3) return;
                try {
                    for (const key in obj) {
                        if (key === 'dynamicToken') State.tokens.dynamicToken = obj[key];
                        if (key === 'loginPointId') State.tokens.loginPointId = obj[key];
                        if (key === 'csrfId' || key === 'csrfID') TokenManager.applyCsrf(obj[key]);
                        if (key === 'user' && obj[key]?.accessInfo) {
                            State.tokens.dynamicToken = obj[key].accessInfo.dynamicToken || State.tokens.dynamicToken;
                            State.tokens.loginPointId = obj[key].accessInfo.loginPointId || State.tokens.loginPointId;
                            TokenManager.applyCsrf(obj[key].accessInfo.csrfId || obj[key].accessInfo.csrfID);
                        }
                        if (typeof obj[key] === 'object') findInObj(obj[key], depth + 1);
                    }
                } catch { }
            };

            [window.g_config, window.PageConfig, window.mm, window.FEED_CONFIG, window.__magix_data__]
                .forEach(c => findInObj(c));
        },

        // 刷新 Token
        refresh: () => {
            TokenManager.deepSearch();

            // 从 URL 参数补充 CSRF（如果存在）
            try {
                const href = window.location.href || '';
                const urlObj = new URL(href, window.location.origin);
                TokenManager.applyCsrf(urlObj.searchParams.get('csrfId') || urlObj.searchParams.get('csrfID'));
                if (window.location.hash && window.location.hash.includes('?')) {
                    const hashQuery = window.location.hash.split('?')[1] || '';
                    const hashParams = new URLSearchParams(hashQuery);
                    TokenManager.applyCsrf(hashParams.get('csrfId') || hashParams.get('csrfID'));
                }
            } catch { }

            // 从 cookie 获取 CSRF
            const csrfMatch = document.cookie.match(/_tb_token_=([^;]+)/);
            if (csrfMatch) {
                // 仅当当前未拿到有效 csrfId 时，才用 _tb_token_ 兜底，避免覆盖真实 csrfId
                if (!TokenManager.isStrongCsrf(State.tokens.csrfID)) {
                    State.tokens.csrfID = csrfMatch[1];
                }
            }

            // 从 Magix Vframe 获取
            if (window.Magix?.Vframe) {
                try {
                    const vframes = window.Magix.Vframe.all();
                    for (const id in vframes) {
                        const info = vframes[id]?.view?.user?.accessInfo ||
                            vframes[id]?.$v?.$d?.$d?.user?.accessInfo;
                        if (info) {
                            State.tokens.dynamicToken = info.dynamicToken || State.tokens.dynamicToken;
                            State.tokens.loginPointId = info.loginPointId || State.tokens.loginPointId;
                            TokenManager.applyCsrf(info.csrfId || info.csrfID);
                        }
                    }
                } catch { }
            }
        }
    };

    const recordApiRequestToHookHistory = (url, method = 'POST', data = null, source = 'api_fetch_manual') => {
        const requestUrl = String(url || '').trim();
        if (!requestUrl) return;
        const requestMethod = String(method || 'POST').trim().toUpperCase() || 'POST';
        let body = data;
        if (data !== undefined && data !== null && typeof data !== 'string') {
            try {
                body = JSON.stringify(data);
            } catch {
                body = data;
            }
        }
        const candidates = [];
        const addCandidate = (manager) => {
            if (!manager || typeof manager.recordRequest !== 'function') return;
            if (candidates.includes(manager)) return;
            candidates.push(manager);
        };
        try {
            addCandidate(window.__AM_HOOK_MANAGER__);
        } catch { }
        try {
            if (typeof unsafeWindow !== 'undefined' && unsafeWindow) {
                addCandidate(unsafeWindow.__AM_HOOK_MANAGER__);
            }
        } catch { }
        if (!candidates.length && typeof createHookManager === 'function') {
            try {
                addCandidate(createHookManager());
            } catch { }
        }
        candidates.forEach(manager => {
            try {
                manager.recordRequest({
                    method: requestMethod,
                    url: requestUrl,
                    body,
                    source
                });
            } catch { }
        });
    };

