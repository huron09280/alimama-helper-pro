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
        getCsrfScore: (value) => {
            const v = value === null || value === undefined ? '' : String(value).trim();
            if (!v) return -1;
            let score = Math.min(80, v.length);
            if (v.includes('_')) score += 30;
            if (!/^\d+$/.test(v)) score += 20;
            if (v.length >= 16) score += 10;
            return score;
        },
        pickCsrf: (current, next) => {
            const currentText = current === null || current === undefined ? '' : String(current).trim();
            const nextText = next === null || next === undefined ? '' : String(next).trim();
            if (!currentText) return nextText;
            if (!nextText) return currentText;
            return TokenManager.getCsrfScore(nextText) >= TokenManager.getCsrfScore(currentText)
                ? nextText
                : currentText;
        },
        applyCsrf: (value) => {
            const next = value === null || value === undefined ? '' : String(value).trim();
            if (!next) return;
            State.tokens.csrfID = TokenManager.pickCsrf(State.tokens.csrfID, next);
        },
        parseAuthFromUrl: (rawUrl) => {
            const out = { dynamicToken: '', loginPointId: '', csrfID: '' };
            const text = rawUrl === null || rawUrl === undefined ? '' : String(rawUrl).trim();
            if (!text || !/(dynamicToken|loginPointId|csrfId|csrfID)/.test(text)) return out;
            try {
                const parsed = new URL(text, window.location.origin);
                out.dynamicToken = String(parsed.searchParams.get('dynamicToken') || '').trim();
                out.loginPointId = String(parsed.searchParams.get('loginPointId') || '').trim();
                out.csrfID = String(parsed.searchParams.get('csrfId') || parsed.searchParams.get('csrfID') || '').trim();
            } catch { }
            return out;
        },
        parseAuthFromBody: (body) => {
            const out = { dynamicToken: '', loginPointId: '', csrfID: '' };
            if (!body) return out;
            if (typeof body === 'string') {
                const text = body.trim();
                if (!text) return out;
                if (/(dynamicToken|loginPointId|csrfId|csrfID)/.test(text)) {
                    try {
                        const json = JSON.parse(text);
                        return TokenManager.parseAuthFromObject(json);
                    } catch { }
                    try {
                        const params = new URLSearchParams(text);
                        out.dynamicToken = String(params.get('dynamicToken') || '').trim();
                        out.loginPointId = String(params.get('loginPointId') || '').trim();
                        out.csrfID = String(params.get('csrfId') || params.get('csrfID') || '').trim();
                    } catch { }
                }
                return out;
            }
            if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) {
                out.dynamicToken = String(body.get('dynamicToken') || '').trim();
                out.loginPointId = String(body.get('loginPointId') || '').trim();
                out.csrfID = String(body.get('csrfId') || body.get('csrfID') || '').trim();
                return out;
            }
            if (typeof FormData !== 'undefined' && body instanceof FormData) {
                out.dynamicToken = String(body.get('dynamicToken') || '').trim();
                out.loginPointId = String(body.get('loginPointId') || '').trim();
                out.csrfID = String(body.get('csrfId') || body.get('csrfID') || '').trim();
                return out;
            }
            return TokenManager.parseAuthFromObject(body);
        },
        parseAuthFromObject: (source, maxDepth = 4) => {
            const out = { dynamicToken: '', loginPointId: '', csrfID: '' };
            const visited = new WeakSet();
            const readText = (value) => value === null || value === undefined ? '' : String(value).trim();
            const walk = (obj, depth = 0) => {
                if (!obj || typeof obj !== 'object' || depth > maxDepth) return;
                if (visited.has(obj)) return;
                visited.add(obj);
                for (const key in obj) {
                    let value = null;
                    try {
                        value = obj[key];
                    } catch {
                        continue;
                    }
                    if (!out.dynamicToken && key === 'dynamicToken') out.dynamicToken = readText(value);
                    if (!out.loginPointId && key === 'loginPointId') out.loginPointId = readText(value);
                    if (key === 'csrfId' || key === 'csrfID') out.csrfID = TokenManager.pickCsrf(out.csrfID, readText(value));
                    if (key === 'user' && value) {
                        let info = null;
                        try {
                            info = value.accessInfo;
                        } catch { }
                        if (info) {
                            out.dynamicToken = out.dynamicToken || readText(info.dynamicToken);
                            out.loginPointId = out.loginPointId || readText(info.loginPointId);
                            out.csrfID = TokenManager.pickCsrf(out.csrfID, readText(info.csrfId || info.csrfID));
                        }
                    }
                    if (value && typeof value === 'object') walk(value, depth + 1);
                }
            };
            walk(source, 0);
            return out;
        },
        applyAuthCandidate: (candidate) => {
            if (!candidate || typeof candidate !== 'object') return;
            const nextDynamic = candidate.dynamicToken === null || candidate.dynamicToken === undefined
                ? '' : String(candidate.dynamicToken).trim();
            const nextLoginPoint = candidate.loginPointId === null || candidate.loginPointId === undefined
                ? '' : String(candidate.loginPointId).trim();
            if (nextDynamic && !State.tokens.dynamicToken) {
                State.tokens.dynamicToken = nextDynamic;
            }
            if (nextLoginPoint && !State.tokens.loginPointId) {
                State.tokens.loginPointId = nextLoginPoint;
            }
            TokenManager.applyCsrf(candidate.csrfID);
        },
        syncFromUrl: (rawUrl) => {
            TokenManager.applyAuthCandidate(TokenManager.parseAuthFromUrl(rawUrl));
        },
        syncFromBody: (body) => {
            TokenManager.applyAuthCandidate(TokenManager.parseAuthFromBody(body));
        },
        resolveHookManagers: () => {
            const managers = [];
            const pushManager = (manager) => {
                if (!manager || typeof manager.getRequestHistory !== 'function') return;
                if (managers.includes(manager)) return;
                managers.push(manager);
            };
            try {
                pushManager(window.__AM_HOOK_MANAGER__);
            } catch { }
            try {
                if (typeof unsafeWindow !== 'undefined' && unsafeWindow) {
                    pushManager(unsafeWindow.__AM_HOOK_MANAGER__);
                }
            } catch { }
            if (!managers.length && typeof createHookManager === 'function') {
                try {
                    pushManager(createHookManager());
                } catch { }
            }
            return managers;
        },
        syncFromHookHistory: () => {
            if (State.tokens.dynamicToken && State.tokens.loginPointId && TokenManager.isStrongCsrf(State.tokens.csrfID)) return;
            const managers = TokenManager.resolveHookManagers();
            if (!managers.length) return;
            const history = [];
            managers.forEach((manager) => {
                try {
                    const list = manager.getRequestHistory({
                        includePattern: /\.json(?:$|\?)/i,
                        limit: 2600
                    });
                    if (Array.isArray(list) && list.length) history.push(...list);
                } catch { }
            });
            if (!history.length) return;
            history.sort((left, right) => Number(right?.ts || 0) - Number(left?.ts || 0));
            for (let i = 0; i < history.length; i++) {
                const entry = history[i] || {};
                TokenManager.syncFromUrl(entry.url);
                TokenManager.syncFromBody(entry.body);
                if (State.tokens.dynamicToken && State.tokens.loginPointId && TokenManager.isStrongCsrf(State.tokens.csrfID)) {
                    break;
                }
            }
        },

        // Hook XHR / Fetch 捕获 Token
        hookXHR: () => {
            if (TokenManager.hookReady) return;
            const hooks = window.__AM_HOOK_MANAGER__;
            if (!hooks) {
                Logger.warn('统一 Hook 管理器不可用，已跳过 Token Hook 注入');
                return;
            }

            hooks.registerXHROpen(({ xhr, url }) => {
                xhr._url = url;
                TokenManager.syncFromUrl(url);
            });

            hooks.registerXHRSend(({ data, url }) => {
                TokenManager.syncFromUrl(url);
                TokenManager.syncFromBody(data);
            });

            if (typeof hooks.registerFetch === 'function') {
                hooks.registerFetch(({ args }) => {
                    const firstArg = Array.isArray(args) ? args[0] : null;
                    const secondArg = Array.isArray(args) ? args[1] : null;
                    const requestUrl = typeof firstArg === 'string'
                        ? firstArg
                        : (firstArg && typeof firstArg === 'object' ? firstArg.url : '');
                    const requestBody = secondArg?.body || firstArg?.body || null;
                    TokenManager.syncFromUrl(requestUrl);
                    TokenManager.syncFromBody(requestBody);
                });
            }

            TokenManager.hookReady = true;
            Logger.info('Token Hook 已接入统一管理器');
        },

        // 深度搜索全局变量
        deepSearch: () => {
            if (State.tokens.dynamicToken && State.tokens.loginPointId && TokenManager.isStrongCsrf(State.tokens.csrfID)) return;
            [window.g_config, window.PageConfig, window.mm, window.FEED_CONFIG, window.__magix_data__]
                .forEach(source => TokenManager.applyAuthCandidate(TokenManager.parseAuthFromObject(source, 3)));
        },

        // 刷新 Token
        refresh: () => {
            TokenManager.deepSearch();
            TokenManager.syncFromUrl(window.location.href || '');

            if (window.location.hash && window.location.hash.includes('?')) {
                const hashQuery = window.location.hash.split('?')[1] || '';
                TokenManager.syncFromBody(hashQuery);
            }

            TokenManager.syncFromHookHistory();

            // 从 cookie 获取 CSRF
            const csrfMatch = document.cookie.match(/_tb_token_=([^;]+)/);
            if (csrfMatch) {
                // 仅当当前未拿到有效 csrfId 时，才用 _tb_token_ 兜底，避免覆盖真实 csrfId
                if (!TokenManager.isStrongCsrf(State.tokens.csrfID)) {
                    try {
                        TokenManager.applyCsrf(decodeURIComponent(csrfMatch[1]));
                    } catch {
                        TokenManager.applyCsrf(csrfMatch[1]);
                    }
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
                            TokenManager.applyAuthCandidate(TokenManager.parseAuthFromObject(info, 1));
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
