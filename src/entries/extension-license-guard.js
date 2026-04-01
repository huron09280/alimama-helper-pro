(() => {
    'use strict';

    const guardGlobal = typeof globalThis !== 'undefined' ? globalThis : window;
    if (guardGlobal && guardGlobal.LicenseGuard && typeof guardGlobal.LicenseGuard.assertAuthorized === 'function') {
        return;
    }

    const AUTH_BASE_URL = "https://am-licee-server-mpbzozflkj.cn-hangzhou.fcapp.run";
    const BUILD_ID = "mcp-e2e-20260331";
    const BUILD_CHANNEL = "release";

    const CACHE_KEY = '__AM_LICENSE_CACHE_V1__';
    const STATE_KEY = '__AM_LICENSE_STATE__';
    const OVERLAY_ID = 'am-license-lock-overlay';
    const OVERLAY_STYLE_ID = 'am-license-lock-style';

    const shopIdPattern = /^\d{6,}$/;
    const shopNamePattern = /\S/;

    const decodeUnicodeEscapes = (value) => {
        const raw = value === null || value === undefined ? '' : String(value);
        if (!raw) return '';
        if (!/\\u[0-9a-fA-F]{4}/.test(raw)) return raw;
        return raw.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => {
            const codePoint = Number.parseInt(hex, 16);
            return Number.isFinite(codePoint) ? String.fromCharCode(codePoint) : _;
        });
    };

    const state = {
        authorized: false,
        reason: 'license_unverified',
        message: '授权尚未验证',
        shopId: '',
        shopName: '',
        expiresAt: 0,
        leaseToken: '',
        policy: null,
        runtimeMode: '',
        scriptVersion: '',
        source: 'bootstrap',
        updatedAt: 0
    };

    let expiryTimer = 0;

    const toNow = () => Date.now();

    const setReadonlyState = () => {
        const snapshot = Object.freeze({
            authorized: !!state.authorized,
            reason: String(state.reason || ''),
            message: String(state.message || ''),
            shopId: String(state.shopId || ''),
            shopName: normalizeShopName(state.shopName),
            expiresAt: Number(state.expiresAt || 0),
            leaseToken: String(state.leaseToken || ''),
            runtimeMode: String(state.runtimeMode || ''),
            scriptVersion: String(state.scriptVersion || ''),
            source: String(state.source || ''),
            updatedAt: Number(state.updatedAt || 0),
            build: {
                id: String(BUILD_ID || ''),
                channel: String(BUILD_CHANNEL || ''),
                authBaseUrl: String(AUTH_BASE_URL || '')
            }
        });
        guardGlobal[STATE_KEY] = snapshot;
    };

    const updateState = (patch = {}) => {
        Object.assign(state, patch || {});
        state.shopName = normalizeShopName(state.shopName);
        state.updatedAt = toNow();
        setReadonlyState();
    };

    const clearExpiryTimer = () => {
        if (!expiryTimer) return;
        clearTimeout(expiryTimer);
        expiryTimer = 0;
    };

    const scheduleExpiryCheck = () => {
        clearExpiryTimer();
        const expireAt = Number(state.expiresAt || 0);
        if (!state.authorized || !Number.isFinite(expireAt) || expireAt <= 0) return;
        const delay = Math.max(0, expireAt - toNow());
        expiryTimer = setTimeout(() => {
            lock('lease_expired', '授权租约已过期，请联系管理员续期', state.source || 'lease_timer');
        }, delay + 50);
    };

    const SHOP_ID_RETRY_ATTEMPTS_DEFAULT = 6;
    const SHOP_ID_RETRY_BASE_DELAY_MS = 260;
    const SHOP_ID_RETRY_MAX_DELAY_MS = 1200;

    const normalizeShopId = (value) => {
        const raw = value === null || value === undefined ? '' : String(value).trim();
        if (!raw) return '';
        if (shopIdPattern.test(raw)) return raw;
        const digits = raw.replace(/\D+/g, '');
        return shopIdPattern.test(digits) ? digits : '';
    };

    const sanitizeShopNameCandidate = (value = '') => {
        const raw = value === null || value === undefined ? '' : String(value);
        if (!raw) return '';
        return raw
            .replace(/[\r\t]/g, ' ')
            .replace(/[|｜]/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/^(店铺名称|店铺名|商家名称|商家名)\s*[:：]\s*/i, '')
            .trim();
    };

    const normalizeShopName = (value) => {
        const raw = sanitizeShopNameCandidate(value);
        const decoded = decodeUnicodeEscapes(raw).trim();
        return shopNamePattern.test(decoded) ? decoded : '';
    };

    const safeParseJson = (value) => {
        if (typeof value !== 'string') return null;
        const text = value.trim();
        if (!text) return null;
        try {
            return JSON.parse(text);
        } catch {
            return null;
        }
    };

    const safeDecodeURIComponent = (value) => {
        const raw = String(value === null || value === undefined ? '' : value);
        if (!raw) return '';
        try {
            return decodeURIComponent(raw);
        } catch {
            return raw;
        }
    };

    const pickSourceObjectList = () => {
        const out = [];
        const push = (sourceName, obj) => {
            if (!obj || typeof obj !== 'object') return;
            out.push({ sourceName, obj });
        };
        push('window.g_config', window.g_config);
        push('window.PageConfig', window.PageConfig);
        push('window.__magix_data__', window.__magix_data__);
        push('window.mm', window.mm);
        push('window.__INITIAL_STATE__', window.__INITIAL_STATE__);
        push('window.__INIT_STATE__', window.__INIT_STATE__);
        push('window.__INIT_DATA__', window.__INIT_DATA__);
        push('window.__PRELOADED_STATE__', window.__PRELOADED_STATE__);
        push('window.__NEXT_DATA__', window.__NEXT_DATA__);
        push('window.__NUXT__', window.__NUXT__);
        push('window.__STORE_STATE__', window.__STORE_STATE__);
        push('window.__data__', window.__data__);
        push('window.__DATA__', window.__DATA__);
        return out;
    };

    const pickNodeKeysForScan = (node) => {
        if (!node || typeof node !== 'object') return [];
        const keys = Object.keys(node);
        if (keys.length <= 280) return keys;
        const head = keys.slice(0, 180);
        const tail = keys.slice(-120);
        return Array.from(new Set([...head, ...tail]));
    };

    const parseShopFromObject = (root = null, sourceName = 'unknown') => {
        if (!root || typeof root !== 'object') return null;
        const queue = [{ node: root, depth: 0 }];
        const visited = new WeakSet();
        const idKeys = new Set([
            'shopid', 'shop_id',
            'sellerid', 'seller_id',
            'memberid', 'member_id',
            'merchantid', 'merchant_id',
            'principalid', 'principal_id',
            'ownerid', 'owner_id'
        ]);
        const nameKeys = new Set([
            'shopname', 'shop_name',
            'sellername', 'seller_name',
            'nick', 'usernick',
            'membername', 'merchantname',
            'principalname', 'ownername', 'shoptitle'
        ]);
        const matches = [];

        while (queue.length) {
            const current = queue.shift();
            const node = current.node;
            const depth = current.depth;
            if (!node || typeof node !== 'object' || depth > 6) continue;
            if (visited.has(node)) continue;
            visited.add(node);

            let localShopId = [
                node.shopId, node.shopID, node.shop_id,
                node.sellerId, node.sellerID, node.seller_id,
                node.memberId, node.memberID, node.member_id,
                node.merchantId, node.merchantID, node.merchant_id,
                node.principalId, node.principalID, node.principal_id,
                node.ownerId, node.ownerID, node.owner_id
            ].map(normalizeShopId).find(Boolean) || '';

            let localShopName = [
                node.shopName, node.shop_name, node.shopTitle,
                node.sellerName, node.seller_name,
                node.nick, node.userNick, node.usernick,
                node.memberName, node.member_name,
                node.merchantName, node.merchant_name,
                node.ownerName, node.owner_name
            ].map(normalizeShopName).find(Boolean) || '';

            const scannedKeys = pickNodeKeysForScan(node);
            if (!localShopId || !localShopName) {
                scannedKeys.forEach((key) => {
                    const lowerKey = String(key || '').toLowerCase();
                    const value = node[key];
                    if (!localShopId && idKeys.has(lowerKey)) {
                        localShopId = normalizeShopId(value);
                    }
                    if (!localShopName && nameKeys.has(lowerKey)) {
                        localShopName = normalizeShopName(value);
                    }
                });
            }

            if (localShopId) {
                matches.push({
                    shopId: localShopId,
                    shopName: localShopName,
                    source: sourceName,
                    confidence: Math.max(1, 12 - depth)
                });
            }

            scannedKeys.forEach((key) => {
                const value = node[key];
                if (value && typeof value === 'object') {
                    queue.push({ node: value, depth: depth + 1 });
                }
            });
        }

        if (!matches.length) return null;
        matches.sort((a, b) => b.confidence - a.confidence);
        const top = matches[0];
        if (top.shopName) return top;
        const withName = matches.find(item => item.shopName && item.shopId === top.shopId);
        return withName || top;
    };

    const parseShopFromSearchParams = (params = null, sourceName = 'searchParams') => {
        if (!params || typeof params.get !== 'function') return null;
        const idCandidates = [
            params.get('shopId'),
            params.get('shop_id'),
            params.get('sellerId'),
            params.get('seller_id'),
            params.get('memberId'),
            params.get('member_id'),
            params.get('merchantId'),
            params.get('merchant_id'),
            params.get('principalId'),
            params.get('ownerId')
        ];
        const nameCandidates = [
            params.get('shopName'),
            params.get('shop_name'),
            params.get('sellerName'),
            params.get('seller_name'),
            params.get('nick'),
            params.get('userNick'),
            params.get('ownerName'),
            params.get('shopTitle')
        ];
        const shopId = idCandidates.map(normalizeShopId).find(Boolean) || '';
        if (!shopId) return null;
        const shopName = nameCandidates.map(normalizeShopName).find(Boolean) || '';
        return { shopId, shopName, source: sourceName, confidence: 5 };
    };

    const parseShopFromUrl = (rawUrl = '', sourceName = 'url') => {
        const text = String(rawUrl || '').trim();
        if (!text) return null;
        try {
            const parsed = new URL(text, window.location.origin);
            return parseShopFromSearchParams(parsed.searchParams, sourceName);
        } catch {
            return null;
        }
    };

    const parseShopFromBody = (body = null, sourceName = 'request_body') => {
        if (!body) return null;
        if (typeof body === 'string') {
            const parsed = safeParseJson(body);
            if (parsed && typeof parsed === 'object') {
                const fromObject = parseShopFromObject(parsed, sourceName);
                if (fromObject) return fromObject;
            }
            try {
                return parseShopFromSearchParams(new URLSearchParams(body), sourceName);
            } catch {
                return null;
            }
        }
        if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) {
            return parseShopFromSearchParams(body, sourceName);
        }
        if (typeof FormData !== 'undefined' && body instanceof FormData) {
            const params = new URLSearchParams();
            body.forEach((value, key) => params.set(key, String(value || '')));
            return parseShopFromSearchParams(params, sourceName);
        }
        if (typeof body === 'object') {
            return parseShopFromObject(body, sourceName);
        }
        return null;
    };

    const parseShopFromCookie = (sourceName = 'document_cookie') => {
        const rawCookie = String(document.cookie || '').trim();
        if (!rawCookie) return null;
        const kvMap = new Map();
        rawCookie.split(';').forEach((part) => {
            const text = String(part || '').trim();
            if (!text) return;
            const equalIndex = text.indexOf('=');
            if (equalIndex <= 0) return;
            const key = text.slice(0, equalIndex).trim().toLowerCase();
            if (!key) return;
            const value = safeDecodeURIComponent(text.slice(equalIndex + 1).trim());
            kvMap.set(key, value);
        });
        const pick = (key) => kvMap.get(String(key || '').toLowerCase()) || '';
        const shopId = [
            'shopId', 'shop_id',
            'sellerId', 'seller_id',
            'memberId', 'member_id',
            'merchantId', 'merchant_id',
            'principalId', 'principal_id',
            'ownerId', 'owner_id'
        ].map(pick).map(normalizeShopId).find(Boolean) || '';
        if (!shopId) return null;
        const shopName = [
            'shopName', 'shop_name',
            'sellerName', 'seller_name',
            'nick', 'userNick',
            'ownerName', 'owner_name'
        ].map(pick).map(normalizeShopName).find(Boolean) || '';
        return { shopId, shopName, source: sourceName, confidence: 4 };
    };

    const parseShopFromStorage = (storage = null, sourceName = 'storage') => {
        if (!storage || typeof storage.getItem !== 'function') return null;
        const idKeyPattern = /(shop|seller|member|merchant|principal|owner)[_-]?id/i;
        const nameKeyPattern = /(shop|seller|member|merchant|principal|owner)[_-]?(name|nick|title)/i;
        const keyCount = Math.max(0, Math.min(260, Number(storage.length) || 0));
        const scannedKeys = [];
        for (let i = 0; i < keyCount; i++) {
            try {
                const key = String(storage.key(i) || '').trim();
                if (key) scannedKeys.push(key);
            } catch { }
        }
        let shopId = '';
        let shopName = '';
        for (let i = 0; i < scannedKeys.length; i++) {
            const key = scannedKeys[i];
            const lowerKey = key.toLowerCase();
            let value = '';
            try {
                value = String(storage.getItem(key) || '');
            } catch {
                value = '';
            }
            if (!value) continue;
            const decodedValue = safeDecodeURIComponent(value);
            if (!shopId && idKeyPattern.test(lowerKey)) {
                shopId = normalizeShopId(decodedValue);
            }
            if (!shopName && nameKeyPattern.test(lowerKey)) {
                shopName = normalizeShopName(decodedValue);
            }
            if ((!shopId || !shopName) && /^[\[{]/.test(decodedValue.trim())) {
                const parsed = safeParseJson(decodedValue);
                const fromObject = parseShopFromObject(parsed, `${sourceName}:${key}`);
                if (fromObject) {
                    if (!shopId) shopId = normalizeShopId(fromObject.shopId);
                    if (!shopName) shopName = normalizeShopName(fromObject.shopName);
                }
            }
            if (shopId && shopName) break;
        }
        if (!shopId) return null;
        return { shopId, shopName, source: sourceName, confidence: 4 };
    };

    const parseShopFromDom = (sourceName = 'dom_attr') => {
        const nodeList = [document.documentElement, document.body].filter(Boolean);
        const idAttrCandidates = ['data-shop-id', 'data-shopid', 'data-seller-id', 'data-sellerid', 'data-member-id'];
        const nameAttrCandidates = ['data-shop-name', 'data-shopname', 'data-seller-name', 'data-sellername', 'data-nick'];
        for (let i = 0; i < nodeList.length; i++) {
            const node = nodeList[i];
            if (!node || typeof node.getAttribute !== 'function') continue;
            const shopId = idAttrCandidates
                .map(attr => normalizeShopId(node.getAttribute(attr)))
                .find(Boolean) || '';
            if (!shopId) continue;
            const shopName = nameAttrCandidates
                .map(attr => normalizeShopName(node.getAttribute(attr)))
                .find(Boolean) || '';
            return { shopId, shopName, source: sourceName, confidence: 3 };
        }
        return null;
    };

    const parseShopFromDomText = (sourceName = 'dom_text') => {
        const root = document.body || document.documentElement;
        if (!root) return null;
        const text = String(root.innerText || '').trim();
        if (!text) return null;
        const idPatterns = [
            /(?:^|\n)\s*(?:店铺ID|商家ID|账号ID|ID)\s*[:：]\s*(\d{6,})\b/m,
            /\b(?:memberId|sellerId)\s*[:=]\s*(\d{6,})\b/i
        ];
        let shopId = '';
        for (let index = 0; index < idPatterns.length; index++) {
            const matched = text.match(idPatterns[index]);
            shopId = normalizeShopId(matched?.[1] || '');
            if (shopId) break;
        }
        if (!shopId) return null;

        let shopName = '';
        const lines = text
            .split(/\n+/)
            .map(line => String(line || '').trim())
            .filter(Boolean);
        const idLineIndex = lines.findIndex(line => /(?:店铺ID|商家ID|账号ID|ID)\s*[:：]\s*\d{6,}/.test(line));
        if (idLineIndex >= 0 && lines[idLineIndex]) {
            const inline = lines[idLineIndex].match(/^(.+?)(?:店铺ID|商家ID|账号ID|ID)\s*[:：]\s*\d{6,}\b/);
            const inlineName = normalizeShopName(inline?.[1] || '');
            if (inlineName) {
                shopName = inlineName;
            }
        }
        if (idLineIndex > 0) {
            const candidate = lines[idLineIndex - 1];
            if (candidate && candidate.length <= 80 && !/\d{6,}/.test(candidate)) {
                shopName = normalizeShopName(candidate);
            }
        }

        return { shopId, shopName, source: sourceName, confidence: 3 };
    };

    const resolveLooseShopNameCandidate = () => {
        const candidates = [
            document.querySelector?.('[data-shop-name]')?.getAttribute?.('data-shop-name'),
            document.querySelector?.('[data-seller-name]')?.getAttribute?.('data-seller-name'),
            document.querySelector?.('.shop-name')?.textContent,
            document.querySelector?.('[class*="shop-name"]')?.textContent,
            document.querySelector?.('h1')?.textContent,
            document.title
        ];
        for (let index = 0; index < candidates.length; index++) {
            const normalized = normalizeShopName(candidates[index] || '');
            if (normalized && !/\d{6,}/.test(normalized)) {
                return normalized;
            }
        }
        return '';
    };

    const collectRequestHistoryCandidates = () => {
        const out = [];
        const managers = [];
        const pushManager = (manager) => {
            if (!manager || typeof manager.getRequestHistory !== 'function') return;
            if (managers.includes(manager)) return;
            managers.push(manager);
        };
        try { pushManager(window.__AM_HOOK_MANAGER__); } catch { }
        try {
            if (typeof unsafeWindow !== 'undefined' && unsafeWindow) {
                pushManager(unsafeWindow.__AM_HOOK_MANAGER__);
            }
        } catch { }

        managers.forEach((manager) => {
            try {
                const history = manager.getRequestHistory({ limit: 2000 }) || [];
                history.forEach((entry) => {
                    const fromUrl = parseShopFromUrl(entry?.url || '', 'request_history_url');
                    if (fromUrl) out.push(fromUrl);
                    const fromBody = parseShopFromBody(entry?.body, 'request_history_body');
                    if (fromBody) out.push(fromBody);
                });
            } catch { }
        });

        try {
            const resources = performance.getEntriesByType('resource') || [];
            resources.slice(Math.max(0, resources.length - 1200)).forEach((entry) => {
                const candidate = parseShopFromUrl(entry?.name || '', 'performance_resource');
                if (candidate) out.push(candidate);
            });
        } catch { }

        return out;
    };

    const parseShopFromCache = (cache = null, sourceName = 'license_cache') => {
        if (!cache || typeof cache !== 'object') return null;
        const shopId = normalizeShopId(cache.shopId);
        if (!shopId) return null;
        const shopName = normalizeShopName(cache.shopName || '');
        return {
            shopId,
            shopName,
            source: sourceName,
            confidence: 1
        };
    };

    const resolveShopIdentity = () => {
        const candidates = [];

        pickSourceObjectList().forEach(({ sourceName, obj }) => {
            const parsed = parseShopFromObject(obj, sourceName);
            if (parsed) candidates.push(parsed);
        });

        collectRequestHistoryCandidates().forEach((item) => {
            if (item) candidates.push(item);
        });

        const fromUrl = parseShopFromUrl(window.location.href, 'location_href');
        if (fromUrl) candidates.push(fromUrl);
        const fromHash = parseShopFromUrl(window.location.hash, 'location_hash');
        if (fromHash) candidates.push(fromHash);

        const fromCookie = parseShopFromCookie('document_cookie');
        if (fromCookie) candidates.push(fromCookie);

        const fromLocalStorage = parseShopFromStorage(window.localStorage, 'local_storage');
        if (fromLocalStorage) candidates.push(fromLocalStorage);

        const fromSessionStorage = parseShopFromStorage(window.sessionStorage, 'session_storage');
        if (fromSessionStorage) candidates.push(fromSessionStorage);

        const fromDom = parseShopFromDom('dom_attr');
        if (fromDom) candidates.push(fromDom);

        const fromDomText = parseShopFromDomText('dom_text');
        if (fromDomText) candidates.push(fromDomText);

        const fromCache = parseShopFromCache(readCache(), 'license_cache');
        if (fromCache) candidates.push(fromCache);

        if (!candidates.length) {
            return {
                shopId: '',
                shopName: '',
                source: 'none',
                confidence: 0
            };
        }

        candidates.sort((a, b) => Number(b?.confidence || 0) - Number(a?.confidence || 0));

        const primary = candidates.find(item => normalizeShopId(item?.shopId)) || null;
        if (!primary) {
            return {
                shopId: '',
                shopName: '',
                source: 'none',
                confidence: 0
            };
        }

        const shopId = normalizeShopId(primary.shopId);
        const nameMatch = candidates.find(item => normalizeShopId(item?.shopId) === shopId && normalizeShopName(item?.shopName));
        const fallbackShopName = nameMatch ? '' : resolveLooseShopNameCandidate();

        return {
            shopId,
            shopName: normalizeShopName(nameMatch?.shopName || primary.shopName || fallbackShopName || ''),
            source: String(primary.source || 'unknown'),
            confidence: Number(primary.confidence || 1)
        };
    };

    const sleep = (ms = 0) => new Promise((resolve) => {
        const delay = Math.max(0, Number(ms) || 0);
        setTimeout(resolve, delay);
    });

    const resolveShopIdentityWithRetry = async (options = {}) => {
        const attemptsRaw = Number(options.attempts);
        const attempts = Math.max(0, Math.min(20, Number.isFinite(attemptsRaw) ? attemptsRaw : 0));
        const baseDelayRaw = Number(options.baseDelayMs);
        const baseDelayMs = Math.max(120, Number.isFinite(baseDelayRaw) ? baseDelayRaw : SHOP_ID_RETRY_BASE_DELAY_MS);
        const maxDelayRaw = Number(options.maxDelayMs);
        const maxDelayMs = Math.max(baseDelayMs, Number.isFinite(maxDelayRaw) ? maxDelayRaw : SHOP_ID_RETRY_MAX_DELAY_MS);

        let latest = resolveShopIdentity();
        if (latest.shopId || attempts <= 0) return latest;

        for (let index = 0; index < attempts; index++) {
            const waitMs = Math.min(maxDelayMs, baseDelayMs * (index + 1));
            await sleep(waitMs);
            latest = resolveShopIdentity();
            if (latest.shopId) return latest;
        }
        return latest;
    };

    const resolveRuntimeMode = () => {
        try {
            const mode = window.__AM_PLATFORM_RUNTIME__?.mode;
            const normalized = String(mode || '').trim();
            if (normalized) return normalized;
        } catch { }
        return 'userscript';
    };

    const resolveScriptVersion = () => {
        try {
            if (typeof guardGlobal.__AM_GET_SCRIPT_VERSION__ === 'function') {
                return String(guardGlobal.__AM_GET_SCRIPT_VERSION__() || 'dev').trim() || 'dev';
            }
        } catch { }
        try {
            const fromInfo = window.GM_info?.script?.version || window.GM?.info?.script?.version;
            if (fromInfo) return String(fromInfo).trim();
        } catch { }
        return 'dev';
    };

    const normalizeTimestamp = (value) => {
        const num = Number(value);
        if (Number.isFinite(num) && num > 0) {
            return Math.floor(num > 1e12 ? num : num * 1000);
        }
        const text = String(value || '').trim();
        if (!text) return 0;
        const parsed = Date.parse(text);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const readCache = () => {
        try {
            const raw = window.localStorage?.getItem?.(CACHE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return null;
            return parsed;
        } catch {
            return null;
        }
    };

    const writeCache = (payload = null) => {
        try {
            if (!payload) {
                window.localStorage?.removeItem?.(CACHE_KEY);
                return;
            }
            window.localStorage?.setItem?.(CACHE_KEY, JSON.stringify(payload));
        } catch { }
    };

    const scheduleShopNameBackfill = (context = {}) => {
        const shopId = normalizeShopId(context.shopId || '');
        const source = String(context.source || 'shop_name_backfill');
        if (!shopId) return;
        if (normalizeShopName(context.shopName || '')) return;
        setTimeout(() => {
            try {
                const fallbackName = resolveLooseShopNameCandidate();
                if (!fallbackName) return;
                if (normalizeShopId(state.shopId) !== shopId) return;
                const cache = readCache();
                writeCache({
                    ...(cache && typeof cache === 'object' ? cache : {}),
                    shopId,
                    shopName: fallbackName,
                    updatedAt: toNow()
                });
                updateState({
                    shopId,
                    shopName: fallbackName,
                    source
                });
            } catch { }
        }, 380);
    };

    const createError = (code, message, detail = null) => {
        const err = new Error(String(message || 'license_error'));
        err.code = String(code || 'license_error');
        err.detail = detail;
        return err;
    };

    const toHex = (bytes) => {
        return Array.from(new Uint8Array(bytes || new ArrayBuffer(0)))
            .map((item) => item.toString(16).padStart(2, '0'))
            .join('');
    };

    const sha256Hex = async (text) => {
        const raw = String(text || '');
        if (window.crypto?.subtle) {
            const encoded = new TextEncoder().encode(raw);
            const digest = await window.crypto.subtle.digest('SHA-256', encoded);
            return toHex(digest);
        }
        let hash = 0;
        for (let i = 0; i < raw.length; i++) {
            hash = ((hash << 5) - hash) + raw.charCodeAt(i);
            hash |= 0;
        }
        return `fallback_${Math.abs(hash)}`;
    };

    const computeDeviceHash = async () => {
        const seed = [
            navigator.userAgent || '',
            navigator.language || '',
            navigator.platform || '',
            String(navigator.hardwareConcurrency || ''),
            String(window.screen?.width || ''),
            String(window.screen?.height || ''),
            Intl.DateTimeFormat().resolvedOptions().timeZone || '',
            resolveRuntimeMode()
        ].join('|');
        return sha256Hex(seed);
    };

    const normalizeBaseUrl = (value) => {
        const raw = String(value || '').trim();
        if (!raw) return '';
        return raw.replace(/\/+$/, '');
    };

    const runtimeAuthUrl = () => {
        const base = normalizeBaseUrl(AUTH_BASE_URL);
        if (!base) return '';
        return `${base}/v1/license/verify`;
    };

    const ensureAuthConfig = () => {
        const verifyUrl = runtimeAuthUrl();
        if (!verifyUrl) {
            throw createError('config_missing', '授权服务地址未配置');
        }
        return verifyUrl;
    };

    const verifyLeasePayloadShape = (json, context = {}) => {
        if (!json || typeof json !== 'object') {
            throw createError('invalid_response', '授权接口返回无效');
        }
        const authorized = !!json.authorized;
        if (!authorized) {
            throw createError('unauthorized', String(json.reason || '店铺未授权'), json);
        }
        const leaseToken = String(json.leaseToken || '').trim();
        const expiresAt = normalizeTimestamp(json.expiresAt);
        if (!leaseToken) {
            throw createError('lease_token_missing', '授权返回缺少 leaseToken', json);
        }
        if (!expiresAt || expiresAt <= toNow()) {
            throw createError('lease_expired', '授权租约已过期', json);
        }

        const signature = String(json?.policy?.signature || json.signature || '').trim();
        if (!signature) {
            throw createError('signature_missing', '授权返回缺少签名', json);
        }

        return {
            authorized,
            reason: String(json.reason || ''),
            leaseToken,
            expiresAt,
            signature,
            policy: json.policy && typeof json.policy === 'object' ? json.policy : {}
        };
    };

    const verifySignature = async (payload, normalizedResult) => {
        const signature = String(normalizedResult?.signature || '').trim().toLowerCase();
        const signPayload = {
            authorized: true,
            shopId: String(payload.shopId || ''),
            leaseToken: String(normalizedResult.leaseToken || ''),
            expiresAt: Number(normalizedResult.expiresAt || 0),
            buildId: String(BUILD_ID || ''),
            buildChannel: String(BUILD_CHANNEL || '')
        };
        const localSignature = (await sha256Hex(JSON.stringify(signPayload))).toLowerCase();
        if (!signature || signature !== localSignature) {
            throw createError('signature_invalid', '授权签名校验失败', {
                expected: localSignature,
                actual: signature,
                signPayload
            });
        }
    };

    const requestVerify = async (payload) => {
        const url = ensureAuthConfig();
        let response;
        try {
            response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
        } catch (err) {
            throw createError('request_failed', `授权请求失败: ${err?.message || 'network_error'}`);
        }

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw createError('request_http_error', `授权请求失败: HTTP ${response.status}${text ? ` ${text.slice(0, 120)}` : ''}`);
        }

        let json;
        try {
            json = await response.json();
        } catch {
            throw createError('response_parse_error', '授权响应解析失败');
        }

        const normalized = verifyLeasePayloadShape(json, payload);
        await verifySignature(payload, normalized);
        return normalized;
    };

    const renderOverlayStyle = () => {
        if (document.getElementById(OVERLAY_STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = OVERLAY_STYLE_ID;
        style.textContent = `
            #${OVERLAY_ID} {
                position: fixed;
                inset: 0;
                z-index: 2147483647;
                background: rgba(6, 9, 19, 0.82);
                color: #e8edf7;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 16px;
            }
            #${OVERLAY_ID} .am-license-lock-card {
                width: min(560px, 92vw);
                border-radius: 14px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                background: linear-gradient(145deg, rgba(17, 24, 39, 0.94), rgba(31, 41, 55, 0.92));
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
                padding: 24px;
            }
            #${OVERLAY_ID} .am-license-lock-title {
                margin: 0 0 8px;
                font-size: 20px;
                line-height: 1.3;
                font-weight: 700;
                color: #f3f6ff;
            }
            #${OVERLAY_ID} .am-license-lock-desc {
                margin: 0;
                font-size: 14px;
                line-height: 1.6;
                color: rgba(232, 237, 247, 0.92);
                word-break: break-word;
            }
            #${OVERLAY_ID} .am-license-lock-meta {
                margin-top: 14px;
                font-size: 12px;
                line-height: 1.6;
                color: rgba(206, 216, 230, 0.92);
            }
            #${OVERLAY_ID} .am-license-lock-badge {
                display: inline-flex;
                align-items: center;
                padding: 2px 8px;
                border-radius: 999px;
                border: 1px solid rgba(255, 255, 255, 0.24);
                background: rgba(255, 255, 255, 0.08);
                margin-right: 6px;
                margin-top: 6px;
            }
        `;
        (document.head || document.documentElement || document.body || document).appendChild(style);
    };

    const removeOverlay = () => {
        const node = document.getElementById(OVERLAY_ID);
        if (node) node.remove();
    };

    const renderOverlay = () => {
        renderOverlayStyle();
        const reason = String(state.message || state.reason || '授权失败');
        const shopId = String(state.shopId || '-');
        const shopName = normalizeShopName(state.shopName) || '-';
        const runtimeMode = String(state.runtimeMode || '-');
        const scriptVersion = String(state.scriptVersion || '-');
        const buildId = String(BUILD_ID || '-');
        const buildChannel = String(BUILD_CHANNEL || '-');

        let root = document.getElementById(OVERLAY_ID);
        if (!root) {
            root = document.createElement('div');
            root.id = OVERLAY_ID;
            root.innerHTML = `
                <div class="am-license-lock-card">
                    <h2 class="am-license-lock-title">店铺授权校验失败，功能已锁定</h2>
                    <p class="am-license-lock-desc" data-license-message="1"></p>
                    <div class="am-license-lock-meta" data-license-meta="1"></div>
                </div>
            `;
            (document.body || document.documentElement || document).appendChild(root);
        }

        const messageNode = root.querySelector('[data-license-message="1"]');
        if (messageNode) {
            messageNode.textContent = reason;
        }

        const metaNode = root.querySelector('[data-license-meta="1"]');
        if (metaNode) {
            metaNode.innerHTML = [
                `<span class="am-license-lock-badge">shopId: ${shopId}</span>`,
                `<span class="am-license-lock-badge">shopName: ${shopName}</span>`,
                `<span class="am-license-lock-badge">runtime: ${runtimeMode}</span>`,
                `<span class="am-license-lock-badge">version: ${scriptVersion}</span>`,
                `<span class="am-license-lock-badge">build: ${buildId}</span>`,
                `<span class="am-license-lock-badge">channel: ${buildChannel}</span>`
            ].join('');
        }
    };

    const lock = (reasonCode = 'unauthorized', message = '', source = 'unknown') => {
        clearExpiryTimer();
        const nextMessage = String(message || '').trim() || '授权失败，功能已锁定';
        updateState({
            authorized: false,
            reason: String(reasonCode || 'unauthorized'),
            message: nextMessage,
            source: String(source || 'unknown')
        });
        writeCache(null);
        renderOverlay();
    };

    const unlock = (payload = {}) => {
        updateState({
            authorized: true,
            reason: 'authorized',
            message: '授权有效',
            source: String(payload.source || 'verify'),
            shopId: String(payload.shopId || state.shopId || ''),
            shopName: String(payload.shopName || state.shopName || ''),
            expiresAt: Number(payload.expiresAt || state.expiresAt || 0),
            leaseToken: String(payload.leaseToken || state.leaseToken || ''),
            policy: payload.policy || state.policy || null
        });
        removeOverlay();
        scheduleExpiryCheck();
    };

    const isCurrentLeaseValid = () => {
        if (!state.authorized) return false;
        const expireAt = Number(state.expiresAt || 0);
        return Number.isFinite(expireAt) && expireAt > toNow();
    };

    const buildVerifyPayload = async (shopInfo = {}) => {
        const runtimeMode = resolveRuntimeMode();
        const scriptVersion = resolveScriptVersion();
        const deviceHash = await computeDeviceHash();
        const nonce = Math.random().toString(36).slice(2, 14);
        const timestamp = toNow();
        return {
            shopId: String(shopInfo.shopId || ''),
            shopName: String(shopInfo.shopName || ''),
            scriptVersion,
            buildId: String(BUILD_ID || ''),
            buildChannel: String(BUILD_CHANNEL || ''),
            runtimeMode,
            deviceHash,
            timestamp,
            nonce
        };
    };

    const assertAuthorized = async (options = {}) => {
        const source = String(options?.source || 'runtime_check');
        const force = !!options?.force;

        const runtimeMode = resolveRuntimeMode();
        const scriptVersion = resolveScriptVersion();
        updateState({ runtimeMode, scriptVersion, source });

        const retryAttemptsDefault = source === 'bootstrap_preflight'
            ? Math.max(SHOP_ID_RETRY_ATTEMPTS_DEFAULT, 8)
            : SHOP_ID_RETRY_ATTEMPTS_DEFAULT;
        const retryAttemptsRaw = Number(options?.shopIdRetryAttempts);
        const retryAttempts = force
            ? 0
            : Math.max(0, Math.min(20, Number.isFinite(retryAttemptsRaw) ? retryAttemptsRaw : retryAttemptsDefault));
        const retryBaseDelayRaw = Number(options?.shopIdRetryBaseDelayMs);
        const retryBaseDelayMs = Math.max(120, Number.isFinite(retryBaseDelayRaw) ? retryBaseDelayRaw : SHOP_ID_RETRY_BASE_DELAY_MS);
        const retryMaxDelayRaw = Number(options?.shopIdRetryMaxDelayMs);
        const retryMaxDelayMs = Math.max(retryBaseDelayMs, Number.isFinite(retryMaxDelayRaw) ? retryMaxDelayRaw : SHOP_ID_RETRY_MAX_DELAY_MS);

        const cache = readCache();
        let shopInfo = await resolveShopIdentityWithRetry({
            attempts: retryAttempts,
            baseDelayMs: retryBaseDelayMs,
            maxDelayMs: retryMaxDelayMs
        });

        const cacheShopId = normalizeShopId(cache?.shopId);
        const cacheShopName = normalizeShopName(cache?.shopName || '');
        const cacheExpiresAt = normalizeTimestamp(cache?.expiresAt);

        if (!shopInfo.shopId && !force && cacheShopId) {
            shopInfo = {
                shopId: cacheShopId,
                shopName: shopInfo.shopName || cacheShopName,
                source: shopInfo.source && shopInfo.source !== 'none'
                    ? `${shopInfo.source}+license_cache_fallback`
                    : 'license_cache_fallback',
                confidence: Math.max(1, Number(shopInfo.confidence || 0))
            };
        }

        if (!shopInfo.shopId && source === 'bootstrap_preflight') {
            throw createError('shop_not_found', '未识别到店铺标识（shopId）');
        }

        if (!shopInfo.shopId) {
            lock('shop_not_found', '未识别到店铺标识（shopId），功能已锁定', source);
            throw createError('shop_not_found', '未识别到店铺标识（shopId）');
        }

        updateState({
            shopId: String(shopInfo.shopId || ''),
            shopName: String(shopInfo.shopName || ''),
            source
        });
        scheduleShopNameBackfill({
            shopId: shopInfo.shopId,
            shopName: shopInfo.shopName,
            source
        });

        if (!force && isCurrentLeaseValid()) {
            return { ...state };
        }

        if (!force && cache && typeof cache === 'object') {
            if (cacheShopId && cacheShopId === shopInfo.shopId && cacheExpiresAt > toNow()) {
                unlock({
                    source,
                    shopId: shopInfo.shopId,
                    shopName: shopInfo.shopName || cache.shopName || '',
                    expiresAt: cacheExpiresAt,
                    leaseToken: String(cache.leaseToken || ''),
                    policy: cache.policy || {}
                });
                return { ...state };
            }
        }

        const payload = await buildVerifyPayload(shopInfo);

        try {
            const normalized = await requestVerify(payload);
            writeCache({
                shopId: shopInfo.shopId,
                shopName: shopInfo.shopName,
                leaseToken: normalized.leaseToken,
                expiresAt: normalized.expiresAt,
                policy: normalized.policy || {},
                updatedAt: toNow()
            });
            unlock({
                source,
                shopId: shopInfo.shopId,
                shopName: shopInfo.shopName,
                expiresAt: normalized.expiresAt,
                leaseToken: normalized.leaseToken,
                policy: normalized.policy || {}
            });
            return { ...state };
        } catch (err) {
            const code = String(err?.code || 'verify_failed');
            const msg = String(err?.message || '授权校验失败');
            lock(code, msg, source);
            throw createError(code, msg, err?.detail || null);
        }
    };

    const requireAuthorizedSync = (source = 'sync_gate') => {
        if (isCurrentLeaseValid()) return true;
        lock('lease_expired', '授权已失效，功能已锁定', source);
        throw createError('lease_expired', '授权已失效');
    };

    const buildDeniedResult = (error, source = 'unknown') => ({
        success: false,
        code: String(error?.code || 'unauthorized'),
        msg: String(error?.message || '店铺未授权'),
        source: String(source || 'unknown')
    });

    const getState = () => ({
        authorized: !!state.authorized,
        reason: String(state.reason || ''),
        message: String(state.message || ''),
        shopId: String(state.shopId || ''),
        shopName: normalizeShopName(state.shopName),
        expiresAt: Number(state.expiresAt || 0),
        source: String(state.source || ''),
        runtimeMode: String(state.runtimeMode || ''),
        scriptVersion: String(state.scriptVersion || ''),
        buildId: String(BUILD_ID || ''),
        buildChannel: String(BUILD_CHANNEL || ''),
        authBaseUrl: String(AUTH_BASE_URL || '')
    });

    const LicenseGuard = {
        resolveShopIdentity,
        assertAuthorized,
        requireAuthorizedSync,
        lock,
        getState,
        buildDeniedResult
    };

    guardGlobal.LicenseGuard = LicenseGuard;
    updateState({
        runtimeMode: resolveRuntimeMode(),
        scriptVersion: resolveScriptVersion(),
        source: 'bootstrap'
    });

    // 预热授权，确保启动前就完成首轮校验；失败会自动锁定。
    LicenseGuard.assertAuthorized({ source: 'bootstrap_preflight' }).catch(() => { });
})();
