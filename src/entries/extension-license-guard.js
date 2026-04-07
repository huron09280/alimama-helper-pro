(() => {
    'use strict';

    const guardGlobal = typeof globalThis !== 'undefined' ? globalThis : window;
    if (guardGlobal && guardGlobal.LicenseGuard && typeof guardGlobal.LicenseGuard.assertAuthorized === 'function') {
        return;
    }

    const AUTH_BASE_URL = "https://am-licee-server-mpbzozflkj.cn-hangzhou.fcapp.run";
    const BUILD_ID = "mcp-e2e-20260331";
    const BUILD_CHANNEL = "release";
    const POLICY_TOKEN_PUBLIC_KEY_PEM = [
        '-----BEGIN PUBLIC KEY-----',
        'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEl9dnep6QIyORHbfzlPFcggzLGBXy',
        'tq++VJp0r9MI/VYiUv/3K8beRUjeGWZIHIs1VoAFlubm8bBD3rHsA844Kw==',
        '-----END PUBLIC KEY-----'
    ].join('\n');

    const CACHE_KEY = '__AM_LICENSE_CACHE_V1__';
    const STATE_KEY = '__AM_LICENSE_STATE__';
    const OVERLAY_ID = 'am-license-lock-overlay';
    const OVERLAY_STYLE_ID = 'am-license-lock-style';

    const shopIdPattern = /^\d{6,}$/;
    const shopNamePattern = /\S/;
    const shopNamePlaceholderPattern = /^(?:-|--|—|——|暂无|无|未知|null|undefined|n\/a|na)$/i;
    const shopNamePlatformNoisePattern = /(阿里妈妈|万相台|直通车|淘宝联盟|营销中心|推广中心|商家后台|广告后台|投放平台|千牛|服务市场)/i;
    const shopNameGenericNoisePattern = /^(?:消息中心|首页|工作台|账户中心|数据看板|计划管理|计划列表|报表中心|投放管理|运营中心|管理中心)$/;
    const shopNameStrongSignalPattern = /(店|旗舰|专营|专卖|企业|官方|品牌|工作室|商行|小店|小铺)/;

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
    let renewTimer = 0;
    let onDemandVerifyInstalled = false;
    let onDemandVerifyInFlight = false;

    const LEASE_RENEW_DEFAULT_LEAD_MS = 60 * 1000;
    const LEASE_RENEW_MIN_LEAD_MS = 15 * 1000;
    const LEASE_RENEW_MAX_LEAD_MS = 2 * 60 * 1000;
    const LEASE_RENEW_RETRY_MIN_MS = 2 * 1000;
    const LEASE_RENEW_RETRY_MAX_MS = 10 * 1000;
    const ON_DEMAND_VERIFY_INTERACTION_SELECTOR = [
        '[id^="am-"]',
        '[class*="am-"]',
        '[data-am-helper]',
        '[data-am-license]',
        '#am-license-lock-overlay'
    ].join(',');

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

    const clearLeaseTimers = () => {
        if (expiryTimer) {
            clearTimeout(expiryTimer);
            expiryTimer = 0;
        }
        if (renewTimer) {
            clearTimeout(renewTimer);
            renewTimer = 0;
        }
    };

    const resolveLeaseRenewLeadMs = () => {
        const ttlMs = Number(state?.policy?.ttlMs || 0);
        if (Number.isFinite(ttlMs) && ttlMs > 0) {
            return Math.max(
                LEASE_RENEW_MIN_LEAD_MS,
                Math.min(LEASE_RENEW_MAX_LEAD_MS, Math.floor(ttlMs * 0.2))
            );
        }
        return LEASE_RENEW_DEFAULT_LEAD_MS;
    };

    const scheduleExpiryCheck = () => {
        clearLeaseTimers();
        // Extension mode uses interaction-triggered verification only; no background checks.
        if (resolveRuntimeMode() === 'extension') return;
        const expireAt = Number(state.expiresAt || 0);
        if (!state.authorized || !Number.isFinite(expireAt) || expireAt <= 0) return;
        const remainingMs = Math.max(0, expireAt - toNow());
        const renewLeadMs = resolveLeaseRenewLeadMs();
        const renewDelayMs = Math.max(0, remainingMs - renewLeadMs);

        if (renewDelayMs > 0) {
            renewTimer = setTimeout(() => {
                assertAuthorized({
                    source: 'lease_renew',
                    force: true,
                    shopIdRetryAttempts: 2,
                    shopIdRetryBaseDelayMs: 160,
                    shopIdRetryMaxDelayMs: 520
                }).catch(() => {
                    if (!state.authorized) return;
                    const retryRemaining = Number(state.expiresAt || 0) - toNow();
                    if (!Number.isFinite(retryRemaining) || retryRemaining <= 1200) return;
                    const retryDelay = Math.min(
                        LEASE_RENEW_RETRY_MAX_MS,
                        Math.max(LEASE_RENEW_RETRY_MIN_MS, Math.floor(retryRemaining / 2))
                    );
                    renewTimer = setTimeout(() => {
                        if (!state.authorized) return;
                        assertAuthorized({
                            source: 'lease_renew_retry',
                            force: true,
                            shopIdRetryAttempts: 1,
                            shopIdRetryBaseDelayMs: 140,
                            shopIdRetryMaxDelayMs: 360
                        }).catch(() => { });
                    }, retryDelay);
                });
            }, renewDelayMs);
        }

        const delay = remainingMs;
        expiryTimer = setTimeout(() => {
            lock('lease_expired', '授权租约已过期，请联系管理员续期', state.source || 'lease_timer');
        }, delay + 50);
    };

    const SHOP_ID_RETRY_ATTEMPTS_DEFAULT = 6;
    const SHOP_ID_RETRY_BASE_DELAY_MS = 260;
    const SHOP_ID_RETRY_MAX_DELAY_MS = 1200;
    const SHOP_NAME_BACKFILL_ATTEMPTS_DEFAULT = 8;
    const SHOP_NAME_BACKFILL_BASE_DELAY_MS = 320;
    const SHOP_NAME_BACKFILL_MAX_DELAY_MS = 2200;

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

    const isLikelyShopName = (value = '') => {
        const text = String(value || '').trim();
        if (!text) return false;
        if (shopNamePlaceholderPattern.test(text)) return false;
        if (shopNameGenericNoisePattern.test(text)) return false;
        if (shopNamePlatformNoisePattern.test(text) && !shopNameStrongSignalPattern.test(text)) return false;
        return true;
    };

    const hasStrongShopNameSignal = (value = '') => shopNameStrongSignalPattern.test(String(value || '').trim());

    const normalizeShopName = (value) => {
        const raw = sanitizeShopNameCandidate(value);
        const decoded = decodeUnicodeEscapes(raw).trim();
        if (!shopNamePattern.test(decoded)) return '';
        return isLikelyShopName(decoded) ? decoded : '';
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
        if (!shopName && idLineIndex >= 0 && idLineIndex < lines.length - 1) {
            const candidate = lines[idLineIndex + 1];
            if (candidate && candidate.length <= 80 && !/\d{6,}/.test(candidate)) {
                shopName = normalizeShopName(candidate);
            }
        }

        return { shopId, shopName, source: sourceName, confidence: 3 };
    };

    const parseShopNameFromLabeledText = (text = '') => {
        const normalizedText = String(text || '').trim();
        if (!normalizedText) return '';
        const lines = normalizedText
            .split(/\n+/)
            .map(line => String(line || '').trim())
            .filter(Boolean);
        const namePatterns = [
            /(?:店铺名称|店铺名|当前店铺|商家名称|商家名|掌柜名|店铺昵称)\s*[:：]\s*(.+)$/i,
            /(?:shopName|sellerName|shopTitle|nick|userNick)\s*[:=]\s*(.+)$/i
        ];
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            for (let patternIndex = 0; patternIndex < namePatterns.length; patternIndex++) {
                const matched = line.match(namePatterns[patternIndex]);
                const candidate = normalizeShopName(matched?.[1] || '');
                if (candidate && candidate.length <= 80 && !/\d{6,}/.test(candidate)) {
                    return candidate;
                }
            }
        }
        return '';
    };

    const escapeRegExp = (value = '') => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const parseShopNameNearShopId = (shopId = '', text = '') => {
        const normalizedShopId = normalizeShopId(shopId);
        const normalizedText = String(text || '').trim();
        if (!normalizedShopId || !normalizedText) return '';
        const lines = normalizedText
            .split(/\n+/)
            .map(line => String(line || '').trim())
            .filter(Boolean);
        if (!lines.length) return '';

        const escapedShopId = escapeRegExp(normalizedShopId);
        const lineHasShopIdPattern = new RegExp(`(?:^|\\b)(?:店铺ID|商家ID|账号ID|ID)?\\s*[:：#]?\\s*${escapedShopId}\\b`, 'i');
        const stripShopIdPattern = new RegExp(`(?:店铺ID|商家ID|账号ID|ID)?\\s*[:：#]?\\s*${escapedShopId}\\b`, 'ig');
        const lineHasShopNameLabelPattern = /(?:店铺名称|店铺名|当前店铺|商家名称|商家名|掌柜名|店铺昵称|shopName|sellerName|shopTitle|nick|userNick)/i;
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            if (!lineHasShopIdPattern.test(line)) continue;

            const inlineCandidate = normalizeShopName(line.replace(stripShopIdPattern, ' ').trim());
            if (
                inlineCandidate
                && inlineCandidate.length <= 80
                && !/\d{6,}/.test(inlineCandidate)
                && (hasStrongShopNameSignal(inlineCandidate) || lineHasShopNameLabelPattern.test(line))
            ) {
                return inlineCandidate;
            }

            const nearLineOffsets = [-2, -1, 1, 2];
            for (let offsetIndex = 0; offsetIndex < nearLineOffsets.length; offsetIndex++) {
                const targetIndex = lineIndex + nearLineOffsets[offsetIndex];
                if (targetIndex < 0 || targetIndex >= lines.length) continue;
                const targetLine = lines[targetIndex];
                if (!targetLine || lineHasShopIdPattern.test(targetLine)) continue;
                const nearCandidate = normalizeShopName(targetLine);
                if (
                    nearCandidate
                    && nearCandidate.length <= 80
                    && !/\d{6,}/.test(nearCandidate)
                    && hasStrongShopNameSignal(nearCandidate)
                ) {
                    return nearCandidate;
                }
            }
        }
        return '';
    };

    const collectShopIdAnchoredTextBlocks = (shopId = '') => {
        const normalizedShopId = normalizeShopId(shopId);
        if (!normalizedShopId) return [];
        const blocks = [];
        const seen = new Set();
        const push = (value) => {
            const text = String(value || '').trim();
            if (!text || text.length < 2) return;
            if (seen.has(text)) return;
            seen.add(text);
            blocks.push(text);
        };

        const attrSelectors = [
            `[data-shop-id="${normalizedShopId}"]`,
            `[data-shopid="${normalizedShopId}"]`,
            `[data-seller-id="${normalizedShopId}"]`,
            `[data-sellerid="${normalizedShopId}"]`,
            `[data-member-id="${normalizedShopId}"]`,
            `[data-owner-id="${normalizedShopId}"]`
        ];
        attrSelectors.forEach((selector) => {
            const nodes = Array.from(document.querySelectorAll(selector) || []).slice(0, 20);
            nodes.forEach((node) => {
                if (!node) return;
                push(node.textContent || '');
                push(node.getAttribute?.('title') || '');
                push(node.parentElement?.textContent || '');
                push(node.parentElement?.getAttribute?.('title') || '');
            });
        });

        const root = document.body || document.documentElement;
        const nodeFilterShowText = window.NodeFilter?.SHOW_TEXT || 4;
        if (!root || !document.createTreeWalker) return blocks;
        let textNodeCount = 0;
        let matchCount = 0;
        const walker = document.createTreeWalker(root, nodeFilterShowText, null);
        while (walker.nextNode() && textNodeCount < 2600 && matchCount < 24) {
            textNodeCount += 1;
            const rawText = String(walker.currentNode?.nodeValue || '').trim();
            if (!rawText || rawText.length > 160) continue;
            if (!rawText.includes(normalizedShopId)) continue;
            matchCount += 1;
            const parent = walker.currentNode.parentElement;
            push(parent?.textContent || '');
            push(parent?.getAttribute?.('title') || '');
            push(parent?.parentElement?.textContent || '');
        }
        return blocks;
    };

    const resolveLooseShopNameCandidate = (shopId = '') => {
        const normalizedShopId = normalizeShopId(shopId);
        const pageText = document.body?.innerText || document.documentElement?.innerText || '';
        const shopIdAnchoredBlocks = collectShopIdAnchoredTextBlocks(normalizedShopId);
        const shopIdAnchoredCandidates = shopIdAnchoredBlocks
            .map(block => parseShopNameNearShopId(normalizedShopId, block))
            .filter(Boolean);

        const candidates = [
            ...shopIdAnchoredCandidates,
            parseShopNameNearShopId(normalizedShopId, pageText),
            parseShopNameFromLabeledText(pageText),
            document.querySelector?.('[data-shop-name]')?.getAttribute?.('data-shop-name'),
            document.querySelector?.('[data-shopname]')?.getAttribute?.('data-shopname'),
            document.querySelector?.('[data-seller-name]')?.getAttribute?.('data-seller-name'),
            document.querySelector?.('[data-sellername]')?.getAttribute?.('data-sellername'),
            document.querySelector?.('[data-nick]')?.getAttribute?.('data-nick'),
            document.querySelector?.('.shop-name')?.textContent,
            document.querySelector?.('[class*="shop-name"]')?.textContent,
            document.querySelector?.('[class*="shopname"]')?.textContent,
            document.querySelector?.('[class*="shopName"]')?.textContent,
            document.querySelector?.('.seller-name')?.textContent,
            document.querySelector?.('[class*="seller-name"]')?.textContent,
            document.querySelector?.('[class*="sellername"]')?.textContent,
            document.querySelector?.('[class*="sellerName"]')?.textContent,
            document.querySelector?.('.nick')?.textContent,
            document.querySelector?.('[class*="nick"]')?.textContent,
            document.querySelector?.('h1')?.textContent,
            document.title
        ];
        for (let index = 0; index < candidates.length; index++) {
            const normalized = normalizeShopName(candidates[index] || '');
            if (normalized && normalized.length <= 80 && !/\d{6,}/.test(normalized)) {
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
        const fallbackShopName = nameMatch ? '' : resolveLooseShopNameCandidate(shopId);

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
        const force = !!context.force;
        const attemptsRaw = Number(context.maxAttempts);
        const maxAttempts = Math.max(
            1,
            Math.min(20, Number.isFinite(attemptsRaw) ? attemptsRaw : SHOP_NAME_BACKFILL_ATTEMPTS_DEFAULT)
        );
        const baseDelayRaw = Number(context.baseDelayMs);
        const baseDelayMs = Math.max(
            120,
            Number.isFinite(baseDelayRaw) ? baseDelayRaw : SHOP_NAME_BACKFILL_BASE_DELAY_MS
        );
        const maxDelayRaw = Number(context.maxDelayMs);
        const maxDelayMs = Math.max(
            baseDelayMs,
            Number.isFinite(maxDelayRaw) ? maxDelayRaw : SHOP_NAME_BACKFILL_MAX_DELAY_MS
        );
        const initialDelayRaw = Number(context.initialDelayMs);
        const initialDelayMs = Math.min(
            maxDelayMs,
            Math.max(0, Number.isFinite(initialDelayRaw) ? initialDelayRaw : 380)
        );
        if (!shopId) return;
        if (!force && normalizeShopName(context.shopName || '')) return;

        let attempt = 0;
        const run = () => {
            attempt += 1;
            let resolved = false;
            try {
                if (normalizeShopId(state.shopId) !== shopId) return;
                if (normalizeShopName(state.shopName || '')) return;
                const fallbackName = resolveLooseShopNameCandidate(shopId);
                if (fallbackName) {
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
                    if (!state.authorized || document.getElementById(OVERLAY_ID)) {
                        renderOverlay();
                    }
                    resolved = true;
                }
            } catch { }
            if (resolved) return;
            if (attempt >= maxAttempts) return;
            const nextDelay = Math.min(maxDelayMs, baseDelayMs * attempt);
            setTimeout(run, nextDelay);
        };

        setTimeout(run, initialDelayMs);
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

    const base64ToBytes = (value = '') => {
        const text = String(value || '').replace(/\s+/g, '');
        if (!text) return new Uint8Array(0);
        const binary = atob(text);
        const out = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            out[i] = binary.charCodeAt(i);
        }
        return out;
    };

    const base64UrlToBytes = (value = '') => {
        const raw = String(value || '').trim();
        if (!raw) return new Uint8Array(0);
        const normalized = raw.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
        return base64ToBytes(padded);
    };

    const bytesToText = (bytes) => {
        try {
            return new TextDecoder().decode(bytes || new Uint8Array(0));
        } catch {
            return '';
        }
    };

    const decodeBase64UrlJson = (value = '') => {
        const text = bytesToText(base64UrlToBytes(value));
        const parsed = safeParseJson(text);
        return parsed && typeof parsed === 'object' ? parsed : null;
    };

    const parsePolicyToken = (token = '') => {
        const raw = String(token || '').trim();
        if (!raw) return null;
        const parts = raw.split('.');
        if (parts.length !== 3) return null;
        const header = decodeBase64UrlJson(parts[0]);
        const payload = decodeBase64UrlJson(parts[1]);
        if (!header || !payload) return null;
        return {
            raw,
            parts,
            header,
            payload,
            signatureBytes: base64UrlToBytes(parts[2]),
            signingInput: `${parts[0]}.${parts[1]}`
        };
    };

    let policyPublicKeyPromise = null;

    const importPolicyPublicKey = async () => {
        if (policyPublicKeyPromise) return policyPublicKeyPromise;
        policyPublicKeyPromise = (async () => {
            if (!window.crypto?.subtle) return null;
            const pem = String(POLICY_TOKEN_PUBLIC_KEY_PEM || '').trim();
            if (!pem) return null;
            const body = pem
                .replace(/-----BEGIN PUBLIC KEY-----/g, '')
                .replace(/-----END PUBLIC KEY-----/g, '')
                .replace(/\s+/g, '');
            if (!body) return null;
            const keyData = base64ToBytes(body);
            return window.crypto.subtle.importKey(
                'spki',
                keyData.buffer,
                { name: 'ECDSA', namedCurve: 'P-256' },
                false,
                ['verify']
            );
        })().catch(() => null);
        return policyPublicKeyPromise;
    };

    const verifyPolicyToken = async (shopId = '', normalizedResult = {}) => {
        const token = String(normalizedResult?.policyToken || '').trim();
        if (!token) {
            throw createError('policy_token_missing', '授权返回缺少 policyToken');
        }
        const parsed = parsePolicyToken(token);
        if (!parsed) {
            throw createError('policy_token_invalid', 'policyToken 格式非法');
        }
        const alg = String(parsed?.header?.alg || '').trim();
        if (alg !== 'ES256') {
            throw createError('policy_token_alg_invalid', 'policyToken 算法非法');
        }
        const publicKey = await importPolicyPublicKey();
        if (!publicKey) {
            throw createError('policy_key_unavailable', 'policyToken 公钥不可用');
        }
        const verified = await window.crypto.subtle.verify(
            { name: 'ECDSA', hash: { name: 'SHA-256' } },
            publicKey,
            parsed.signatureBytes,
            new TextEncoder().encode(parsed.signingInput)
        ).catch(() => false);
        if (!verified) {
            throw createError('policy_token_signature_invalid', 'policyToken 验签失败');
        }

        const payload = parsed.payload || {};
        const payloadShopId = normalizeShopId(payload.sid || '');
        const payloadLeaseToken = String(payload.ltk || '').trim();
        const payloadExpiresAt = normalizeTimestamp(payload.exp);
        const payloadBuildId = String(payload.bid || '').trim();
        const payloadBuildChannel = String(payload.bch || '').trim();

        if (!payloadShopId || payloadShopId !== normalizeShopId(shopId || '')) {
            throw createError('policy_token_shop_mismatch', 'policyToken 店铺不匹配');
        }
        if (!payloadLeaseToken || payloadLeaseToken !== String(normalizedResult.leaseToken || '')) {
            throw createError('policy_token_lease_mismatch', 'policyToken 租约不匹配');
        }
        if (!payloadExpiresAt || payloadExpiresAt !== Number(normalizedResult.expiresAt || 0)) {
            throw createError('policy_token_exp_mismatch', 'policyToken 过期时间不匹配');
        }
        if (payloadBuildId !== String(BUILD_ID || '') || payloadBuildChannel !== String(BUILD_CHANNEL || '')) {
            throw createError('policy_token_build_mismatch', 'policyToken 构建标识不匹配');
        }
        if (payloadExpiresAt <= toNow()) {
            throw createError('policy_token_expired', 'policyToken 已过期');
        }
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

    const resolveBrowserVersion = () => {
        const ua = String(navigator.userAgent || '');
        if (!ua) return '';

        const edge = ua.match(/Edg\/([\d.]+)/i);
        if (edge) return `Edge ${edge[1]}`;

        const opera = ua.match(/OPR\/([\d.]+)/i);
        if (opera) return `Opera ${opera[1]}`;

        const chrome = ua.match(/Chrome\/([\d.]+)/i);
        if (chrome && !/Edg\/|OPR\//i.test(ua)) return `Chrome ${chrome[1]}`;

        const firefox = ua.match(/Firefox\/([\d.]+)/i);
        if (firefox) return `Firefox ${firefox[1]}`;

        const safari = ua.match(/Version\/([\d.]+).*Safari\//i);
        if (safari && !/Chrome\/|Chromium\/|Edg\/|OPR\//i.test(ua)) return `Safari ${safari[1]}`;

        const ie = ua.match(/(?:MSIE |rv:)([\d.]+).*Trident/i);
        if (ie) return `IE ${ie[1]}`;

        return '';
    };

    const resolveOsVersion = () => {
        const ua = String(navigator.userAgent || '');
        if (!ua) return '';

        const windows = ua.match(/Windows NT ([\d.]+)/i);
        if (windows) {
            if (windows[1] === '10.0') return 'Windows 10/11';
            if (windows[1] === '6.3') return 'Windows 8.1';
            if (windows[1] === '6.2') return 'Windows 8';
            if (windows[1] === '6.1') return 'Windows 7';
            return `Windows NT ${windows[1]}`;
        }

        const ios = ua.match(/(?:iPhone OS|CPU (?:iPhone )?OS|CPU OS) ([\d_]+)/i);
        if (ios) return `iOS ${ios[1].replace(/_/g, '.')}`;

        const android = ua.match(/Android ([\d.]+)/i);
        if (android) return `Android ${android[1]}`;

        const mac = ua.match(/Mac OS X ([\d_]+)/i);
        if (mac) return `macOS ${mac[1].replace(/_/g, '.')}`;

        const chromeOs = ua.match(/CrOS [^ ]+ ([\d.]+)/i);
        if (chromeOs) return `ChromeOS ${chromeOs[1]}`;

        if (/Linux/i.test(ua)) return 'Linux';
        return '';
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
        const policyToken = String(json?.policy?.token || json?.policyToken || '').trim();

        return {
            authorized,
            reason: String(json.reason || ''),
            leaseToken,
            expiresAt,
            signature,
            policyToken,
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
        if (normalized.policyToken) {
            await verifyPolicyToken(payload.shopId, normalized);
        }
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
        clearLeaseTimers();
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
            userAgent: String(navigator.userAgent || ''),
            browserVersion: resolveBrowserVersion(),
            osVersion: resolveOsVersion(),
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
        const cachePolicyToken = String(cache?.policyToken || cache?.policy?.token || '').trim();
        const stateShopId = normalizeShopId(state.shopId || '');
        const stateShopName = normalizeShopName(state.shopName || '');

        if (!shopInfo.shopId && stateShopId) {
            shopInfo = {
                shopId: stateShopId,
                shopName: shopInfo.shopName || stateShopName || cacheShopName,
                source: shopInfo.source && shopInfo.source !== 'none'
                    ? `${shopInfo.source}+license_state_fallback`
                    : 'license_state_fallback',
                confidence: Math.max(1, Number(shopInfo.confidence || 0))
            };
        } else if (!shopInfo.shopId && cacheShopId) {
            shopInfo = {
                shopId: cacheShopId,
                shopName: shopInfo.shopName || cacheShopName || stateShopName,
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
                const cacheLeaseToken = String(cache.leaseToken || '').trim();
                if (cacheLeaseToken && cachePolicyToken) {
                    try {
                        await verifyPolicyToken(shopInfo.shopId, {
                            leaseToken: cacheLeaseToken,
                            expiresAt: cacheExpiresAt,
                            policyToken: cachePolicyToken
                        });
                        unlock({
                            source,
                            shopId: shopInfo.shopId,
                            shopName: shopInfo.shopName || cache.shopName || '',
                            expiresAt: cacheExpiresAt,
                            leaseToken: cacheLeaseToken,
                            policy: {
                                ...(cache.policy || {}),
                                token: cachePolicyToken
                            }
                        });
                        return { ...state };
                    } catch {
                        writeCache(null);
                    }
                } else {
                    writeCache(null);
                }
            }
        }

        const payload = await buildVerifyPayload(shopInfo);

        try {
            const normalized = await requestVerify(payload);
            const verifiedShopName = normalizeShopName(shopInfo.shopName || normalized?.policy?.shopName || '');
            writeCache({
                shopId: shopInfo.shopId,
                shopName: verifiedShopName,
                leaseToken: normalized.leaseToken,
                expiresAt: normalized.expiresAt,
                policyToken: normalized.policyToken || '',
                policy: normalized.policy || {},
                updatedAt: toNow()
            });
            unlock({
                source,
                shopId: shopInfo.shopId,
                shopName: verifiedShopName,
                expiresAt: normalized.expiresAt,
                leaseToken: normalized.leaseToken,
                policy: normalized.policy || {}
            });
            return { ...state };
        } catch (err) {
            const code = String(err?.code || 'verify_failed');
            const msg = String(err?.message || '授权校验失败');
            const detailShopId = normalizeShopId(err?.detail?.shopId || shopInfo.shopId || '');
            const detailShopName = normalizeShopName(
                err?.detail?.shopName
                || err?.detail?.policy?.shopName
                || shopInfo.shopName
                || ''
            );
            if (detailShopId || detailShopName) {
                updateState({
                    shopId: detailShopId || state.shopId || '',
                    shopName: detailShopName || state.shopName || '',
                    source
                });
            }
            lock(code, msg, source);
            if (detailShopId && !detailShopName) {
                scheduleShopNameBackfill({
                    shopId: detailShopId,
                    shopName: '',
                    source: `${source}+after_lock`,
                    force: true,
                    initialDelayMs: 460,
                    maxAttempts: 12,
                    baseDelayMs: 360,
                    maxDelayMs: 2400
                });
            }
            throw createError(code, msg, err?.detail || null);
        }
    };

    const isPluginInteractionTarget = (target) => {
        if (!(target instanceof Element)) return false;
        if (String(target.id || '').startsWith('am-')) return true;
        const className = typeof target.className === 'string' ? target.className : '';
        if (/\bam-[a-z0-9_-]+/i.test(className)) return true;
        return !!target.closest(ON_DEMAND_VERIFY_INTERACTION_SELECTOR);
    };

    const triggerOnDemandVerify = (source = 'on_demand_interaction') => {
        if (onDemandVerifyInFlight || isCurrentLeaseValid()) return;
        onDemandVerifyInFlight = true;
        assertAuthorized({
            source,
            shopIdRetryAttempts: 2,
            shopIdRetryBaseDelayMs: 180,
            shopIdRetryMaxDelayMs: 620
        })
            .catch(() => { })
            .finally(() => {
                onDemandVerifyInFlight = false;
            });
    };

    const installOnDemandVerifyHooks = () => {
        if (onDemandVerifyInstalled || resolveRuntimeMode() !== 'extension') return;
        onDemandVerifyInstalled = true;

        document.addEventListener('pointerdown', (event) => {
            if (!isPluginInteractionTarget(event?.target)) return;
            triggerOnDemandVerify('on_demand_pointerdown');
        }, true);

        document.addEventListener('keydown', (event) => {
            const key = String(event?.key || '');
            if (key !== 'Enter' && key !== ' ' && key !== 'Spacebar') return;
            if (!isPluginInteractionTarget(event?.target)) return;
            triggerOnDemandVerify('on_demand_keydown');
        }, true);

        window.addEventListener('am-helper:license-check', () => {
            triggerOnDemandVerify('on_demand_custom_event');
        });
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
        triggerOnDemandVerify,
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

    if (resolveRuntimeMode() === 'extension') {
        installOnDemandVerifyHooks();
    } else {
        // userscript 模式保持启动预热校验。
        LicenseGuard.assertAuthorized({ source: 'bootstrap_preflight' }).catch(() => { });
    }
})();
