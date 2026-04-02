import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_LEASE_TTL_MS = 5 * 60 * 1000;
const ADMIN_TOKEN = String(process.env.AM_LICENSE_ADMIN_TOKEN || '').trim();

const ALLOWED_SHOP_IDS = String(process.env.AM_LICENSE_ALLOWED_SHOPS || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
const ALLOWED_SHOP_ID_SET = new Set(ALLOWED_SHOP_IDS);

const REVOKED_SHOP_IDS = new Set(
    String(process.env.AM_LICENSE_REVOKED_SHOPS || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
);

const MEMORY_SHOP_STORE = new Map();
const MEMORY_REVOKE_STORE = new Set();
const MEMORY_ACTIVE_SHOP_STORE = new Map();

const resolvePositiveInt = (value, fallback) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
    return Math.floor(numeric);
};

const MAX_ACTIVE_SHOP_ENTRIES = resolvePositiveInt(process.env.AM_LICENSE_ACTIVE_SHOP_LIMIT, 500);
const DEFAULT_AUTH_VALID_DAYS = resolvePositiveInt(process.env.AM_LICENSE_DEFAULT_AUTH_VALID_DAYS, 3);
const STATE_FILE_PATH = String(process.env.AM_LICENSE_STATE_FILE || '').trim();
const STATE_SYNC_INTERVAL_MS = resolvePositiveInt(process.env.AM_LICENSE_STATE_SYNC_INTERVAL_MS, 1500);
const STATE_FILE_ENABLED = !!STATE_FILE_PATH;
const STATE_FILE_META = {
    lastSyncAtMs: 0,
    lastLoadAtMs: 0,
    lastPersistAtMs: 0,
    lastMtimeMs: 0
};
const TABLESTORE_ENDPOINT = String(process.env.AM_LICENSE_TABLESTORE_ENDPOINT || '').trim();
const TABLESTORE_INSTANCE = String(process.env.AM_LICENSE_TABLESTORE_INSTANCE || '').trim();
const TABLESTORE_TABLE = String(process.env.AM_LICENSE_TABLESTORE_TABLE || '').trim();
const TABLESTORE_STATE_PK = String(process.env.AM_LICENSE_TABLESTORE_STATE_PK || 'license_state').trim() || 'license_state';
const TABLESTORE_AK = String(process.env.AM_LICENSE_TABLESTORE_AK || process.env.ALIBABA_CLOUD_ACCESS_KEY_ID || '').trim();
const TABLESTORE_SK = String(process.env.AM_LICENSE_TABLESTORE_SK || process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET || '').trim();
const TABLESTORE_STS_TOKEN = String(process.env.AM_LICENSE_TABLESTORE_STS_TOKEN || process.env.ALIBABA_CLOUD_SECURITY_TOKEN || '').trim();
const TABLESTORE_ENABLED = !!(TABLESTORE_ENDPOINT && TABLESTORE_INSTANCE && TABLESTORE_TABLE);
const TABLESTORE_META = {
    runtimePromise: null,
    lastSyncAtMs: 0,
    lastLoadAtMs: 0,
    lastPersistAtMs: 0
};
const SERVICE_DIR = path.dirname(fileURLToPath(import.meta.url));
const ADMIN_PAGE_TEMPLATE_PATH = path.join(SERVICE_DIR, 'license-admin.html');

const toNow = () => Date.now();
const normalizeShopId = (value = '') => String(value || '').trim().replace(/\D+/g, '');
const normalizeShopName = (value = '') => String(value || '').trim();
const normalizeBuildId = (value = '') => String(value || '').trim();
const normalizeBuildChannel = (value = '') => String(value || '').trim();
const normalizeRuntimeMode = (value = '') => String(value || '').trim();
const normalizeScriptVersion = (value = '') => String(value || '').trim();
const normalizeClientText = (value = '', maxLength = 256) => {
    const text = String(value || '').trim();
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) : text;
};
const pickFirstText = (...values) => {
    for (const value of values) {
        const text = String(value || '').trim();
        if (text) return text;
    }
    return '';
};
const pickPreferredShopName = (...values) => {
    for (const value of values) {
        const normalized = normalizeShopName(value || '');
        if (!normalized) continue;
        if (normalized === '-' || normalized === '--') continue;
        return normalized;
    }
    return '';
};
const resolveBrowserVersionFromUserAgent = (userAgent = '') => {
    const ua = String(userAgent || '');
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
const resolveOsVersionFromUserAgent = (userAgent = '') => {
    const ua = String(userAgent || '');
    if (!ua) return '';

    const windows = ua.match(/Windows NT ([\d.]+)/i);
    if (windows) {
        const version = windows[1];
        if (version === '10.0') return 'Windows 10/11';
        if (version === '6.3') return 'Windows 8.1';
        if (version === '6.2') return 'Windows 8';
        if (version === '6.1') return 'Windows 7';
        return `Windows NT ${version}`;
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

const normalizeBoolean = (value, defaultValue = true) => {
    if (typeof value === 'boolean') return value;
    if (value == null) return defaultValue;
    const normalized = String(value).trim().toLowerCase();
    if (!normalized) return defaultValue;
    if (['1', 'true', 'yes', 'on', 'enable', 'enabled'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off', 'disable', 'disabled'].includes(normalized)) return false;
    return defaultValue;
};

const toEventObject = (req = {}) => {
    if (req && typeof req === 'object' && !Buffer.isBuffer(req)) return req;
    const raw = Buffer.isBuffer(req) ? req.toString('utf8') : String(req || '').trim();
    if (!raw) return {};
    try {
        return JSON.parse(raw);
    } catch {
        return { body: raw };
    }
};

const getHeaderValue = (headers = {}, name = '') => {
    const target = String(name || '').trim().toLowerCase();
    if (!target) return '';
    const key = Object.keys(headers || {}).find(item => String(item || '').toLowerCase() === target);
    return key ? String(headers[key] || '').trim() : '';
};

const resolveVerifyClientProfile = (req = {}, payload = {}) => {
    const event = toEventObject(req);
    const headers = event?.headers || {};
    const userAgent = normalizeClientText(
        pickFirstText(payload?.userAgent, payload?.ua, getHeaderValue(headers, 'user-agent')),
        512
    );
    const browserVersion = normalizeClientText(
        pickFirstText(payload?.browserVersion, payload?.browser, resolveBrowserVersionFromUserAgent(userAgent)),
        120
    );
    const osVersion = normalizeClientText(
        pickFirstText(payload?.osVersion, payload?.os, resolveOsVersionFromUserAgent(userAgent)),
        120
    );
    return { userAgent, browserVersion, osVersion };
};

const readBodyText = (event = {}) => {
    let body = event?.body;
    if (body == null) return '';
    if (typeof body !== 'string') {
        try {
            return JSON.stringify(body);
        } catch {
            return '';
        }
    }
    if (event?.isBase64Encoded) {
        try {
            return Buffer.from(body, 'base64').toString('utf8');
        } catch {
            return '';
        }
    }
    return body;
};

const parseJsonBody = async (req = {}) => {
    const event = toEventObject(req);
    if (event.body && typeof event.body === 'object') return event.body;
    const raw = String(readBodyText(event) || '').trim();
    if (!raw) return {};
    try {
        return JSON.parse(raw);
    } catch {
        return {};
    }
};

const DEFAULT_ALLOW_HEADERS = 'content-type,accept,x-am-admin-token,x-admin-token';
const DEFAULT_ALLOW_METHODS = 'GET,POST,OPTIONS';

const resolveCorsHeaders = (req = {}) => {
    const event = toEventObject(req);
    const headers = event?.headers || {};
    const requestOrigin = getHeaderValue(headers, 'origin');
    const requestAllowHeaders = getHeaderValue(headers, 'access-control-request-headers');
    const hasOrigin = !!requestOrigin;

    return {
        'access-control-allow-origin': hasOrigin ? requestOrigin : '*',
        'access-control-allow-methods': DEFAULT_ALLOW_METHODS,
        'access-control-allow-headers': requestAllowHeaders || DEFAULT_ALLOW_HEADERS,
        'access-control-max-age': '86400',
        'access-control-expose-headers': 'Date,x-fc-request-id',
        'cache-control': 'no-store',
        'content-disposition': 'inline',
        ...(hasOrigin ? { 'access-control-allow-credentials': 'true' } : {}),
        'vary': 'Origin,Access-Control-Request-Headers'
    };
};

const responseJson = (req = {}, statusCode = 200, body = {}, extraHeaders = {}) => ({
    statusCode,
    headers: {
        ...resolveCorsHeaders(req),
        'content-type': 'application/json; charset=utf-8',
        ...extraHeaders
    },
    body: JSON.stringify(body)
});

const responseHtml = (req = {}, statusCode = 200, html = '') => ({
    statusCode,
    headers: {
        ...resolveCorsHeaders(req),
        'content-type': 'text/html; charset=utf-8'
    },
    body: String(html || '')
});

const responseNoContent = (req = {}) => ({
    statusCode: 204,
    headers: {
        ...resolveCorsHeaders(req),
        'content-type': 'text/plain; charset=utf-8'
    },
    body: ''
});

const buildSignature = ({ shopId, leaseToken, expiresAt, buildId, buildChannel }) => {
    const payload = {
        authorized: true,
        shopId: String(shopId || ''),
        leaseToken: String(leaseToken || ''),
        expiresAt: Number(expiresAt || 0),
        buildId: String(buildId || ''),
        buildChannel: String(buildChannel || '')
    };
    return crypto.createHash('sha256').update(JSON.stringify(payload), 'utf8').digest('hex');
};

const resolveLeaseTtl = () => {
    const configured = Number(process.env.AM_LICENSE_LEASE_TTL_MS || DEFAULT_LEASE_TTL_MS);
    return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : DEFAULT_LEASE_TTL_MS;
};

const resolveNonNegativeInt = (value, fallback = 0) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) return fallback;
    return Math.floor(numeric);
};

const normalizeIsoDatetime = (value = '') => {
    const text = String(value || '').trim();
    if (!text) return '';
    const parsed = Date.parse(text);
    if (!Number.isFinite(parsed) || parsed <= 0) return '';
    return new Date(parsed).toISOString();
};

const resolveIsoDatetimeMs = (value = '') => {
    const normalized = normalizeIsoDatetime(value);
    if (!normalized) return 0;
    const parsed = Date.parse(normalized);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const resolveProfileAuthExpiresAt = (profile = {}) => (
    normalizeIsoDatetime(profile?.authExpiresAt || profile?.expiresAt || '')
);

const isAuthExpirationReached = (expiresAt = '', nowMs = toNow()) => {
    const expiresAtMs = resolveIsoDatetimeMs(expiresAt);
    if (!expiresAtMs) return false;
    return expiresAtMs <= nowMs;
};

const addDaysToNowIso = (days = 0) => {
    const count = resolvePositiveInt(days, 0);
    if (!count) return '';
    return new Date(toNow() + (count * 24 * 60 * 60 * 1000)).toISOString();
};

const addMonthsToNowIso = (months = 0) => {
    const count = resolvePositiveInt(months, 0);
    if (!count) return '';
    const date = new Date();
    date.setMonth(date.getMonth() + count);
    return date.toISOString();
};

const hasOwn = (obj = {}, key = '') => Object.prototype.hasOwnProperty.call(obj || {}, key);

const resolveAuthExpiresAtUpdate = ({ payload = {}, existingProfile = {}, enabled = true } = {}) => {
    const currentAuthExpiresAt = resolveProfileAuthExpiresAt(existingProfile);
    const hasDurationKey = hasOwn(payload, 'durationKey');
    const hasValidMonths = hasOwn(payload, 'validMonths');
    const hasValidDays = hasOwn(payload, 'validDays');
    const hasAuthExpiresAt = hasOwn(payload, 'authExpiresAt');
    const hasExpiresAt = hasOwn(payload, 'expiresAt');
    const touched = hasDurationKey || hasValidMonths || hasValidDays || hasAuthExpiresAt || hasExpiresAt;

    if (hasDurationKey) {
        const durationKey = String(payload.durationKey || '').trim().toLowerCase();
        if (!durationKey || durationKey === 'keep') {
            return { ok: true, authExpiresAt: currentAuthExpiresAt, source: 'keep', touched: true };
        }
        if (durationKey === '3d') {
            return { ok: true, authExpiresAt: addDaysToNowIso(3), source: '3d', touched: true };
        }
        if (durationKey === '1m') {
            return { ok: true, authExpiresAt: addMonthsToNowIso(1), source: '1m', touched: true };
        }
        if (durationKey === '3m') {
            return { ok: true, authExpiresAt: addMonthsToNowIso(3), source: '3m', touched: true };
        }
        if (durationKey === '1y' || durationKey === '12m') {
            return { ok: true, authExpiresAt: addMonthsToNowIso(12), source: '1y', touched: true };
        }
        if (durationKey === 'permanent' || durationKey === 'forever' || durationKey === 'none') {
            return { ok: true, authExpiresAt: '', source: 'permanent', touched: true };
        }
        return { ok: false, code: 'duration_key_invalid', reason: 'durationKey 非法（支持 3d/1m/3m/1y/permanent/keep）' };
    }

    if (hasValidMonths) {
        const months = resolvePositiveInt(payload.validMonths, 0);
        if (!months) {
            return { ok: false, code: 'valid_months_invalid', reason: 'validMonths 必须是正整数' };
        }
        return { ok: true, authExpiresAt: addMonthsToNowIso(months), source: 'valid_months', touched: true };
    }

    if (hasValidDays) {
        const days = resolvePositiveInt(payload.validDays, 0);
        if (!days) {
            return { ok: false, code: 'valid_days_invalid', reason: 'validDays 必须是正整数' };
        }
        return { ok: true, authExpiresAt: addDaysToNowIso(days), source: 'valid_days', touched: true };
    }

    if (hasAuthExpiresAt || hasExpiresAt) {
        const raw = hasAuthExpiresAt ? payload.authExpiresAt : payload.expiresAt;
        const text = String(raw ?? '').trim();
        if (!text || text.toLowerCase() === 'permanent' || text.toLowerCase() === 'forever') {
            return { ok: true, authExpiresAt: '', source: 'explicit_permanent', touched: true };
        }
        const normalized = normalizeIsoDatetime(text);
        if (!normalized) {
            return { ok: false, code: 'auth_expires_at_invalid', reason: 'authExpiresAt 非法，需为有效时间格式' };
        }
        if (isAuthExpirationReached(normalized)) {
            return { ok: false, code: 'auth_expires_at_past', reason: 'authExpiresAt 必须晚于当前时间' };
        }
        return { ok: true, authExpiresAt: normalized, source: 'explicit_time', touched: true };
    }

    if (enabled) {
        const applyDefaultExpiry = payload.applyDefaultExpiry !== false;
        if (applyDefaultExpiry) {
            return {
                ok: true,
                authExpiresAt: addDaysToNowIso(DEFAULT_AUTH_VALID_DAYS),
                source: 'default',
                touched: false
            };
        }
    }

    return { ok: true, authExpiresAt: currentAuthExpiresAt, source: 'keep', touched };
};

const resolveStateFileTargetPath = () => path.resolve(STATE_FILE_PATH);

const buildStateSnapshot = () => ({
    version: 1,
    updatedAt: new Date().toISOString(),
    stores: {
        shops: Array.from(MEMORY_SHOP_STORE.entries())
            .map(([shopId, profile = {}]) => ({
                shopId: normalizeShopId(shopId),
                shopName: normalizeShopName(profile.shopName || ''),
                enabled: profile.enabled !== false,
                authExpiresAt: resolveProfileAuthExpiresAt(profile),
                updatedAt: normalizeIsoDatetime(profile.updatedAt || '')
            }))
            .filter(entry => !!entry.shopId)
            .sort((a, b) => a.shopId.localeCompare(b.shopId)),
        revoked: Array.from(MEMORY_REVOKE_STORE.values())
            .map(item => normalizeShopId(item))
            .filter(Boolean)
            .sort(),
        activeShops: Array.from(MEMORY_ACTIVE_SHOP_STORE.values())
            .map((entry = {}) => ({
                shopId: normalizeShopId(entry.shopId || ''),
                shopName: normalizeShopName(entry.shopName || ''),
                firstSeenAt: normalizeIsoDatetime(entry.firstSeenAt || ''),
                firstSeenAtMs: resolveNonNegativeInt(entry.firstSeenAtMs || 0),
                runtimeMode: normalizeRuntimeMode(entry.runtimeMode || ''),
                scriptVersion: normalizeScriptVersion(entry.scriptVersion || ''),
                buildId: normalizeBuildId(entry.buildId || ''),
                buildChannel: normalizeBuildChannel(entry.buildChannel || ''),
                deviceHash: String(entry.deviceHash || '').trim(),
                userAgent: normalizeClientText(entry.userAgent || '', 512),
                browserVersion: normalizeClientText(entry.browserVersion || '', 120),
                osVersion: normalizeClientText(entry.osVersion || '', 120),
                lastAuthorized: !!entry.lastAuthorized,
                lastReason: String(entry.lastReason || ''),
                lastCode: String(entry.lastCode || ''),
                lastSeenAt: normalizeIsoDatetime(entry.lastSeenAt || ''),
                lastSeenAtMs: resolveNonNegativeInt(entry.lastSeenAtMs || 0),
                lastRequestTimestamp: resolveNonNegativeInt(entry.lastRequestTimestamp || 0),
                verifyCount: resolveNonNegativeInt(entry.verifyCount || 0),
                lastAuthorizedAt: normalizeIsoDatetime(entry.lastAuthorizedAt || ''),
                lastRejectedAt: normalizeIsoDatetime(entry.lastRejectedAt || '')
            }))
            .filter(entry => !!entry.shopId)
            .sort((a, b) => Number(a.lastSeenAtMs || 0) - Number(b.lastSeenAtMs || 0) || a.shopId.localeCompare(b.shopId))
    }
});

const applyStateSnapshot = (snapshot = {}) => {
    const stores = snapshot && typeof snapshot === 'object' && snapshot.stores && typeof snapshot.stores === 'object'
        ? snapshot.stores
        : {};

    const shops = Array.isArray(stores.shops) ? stores.shops : [];
    const revoked = Array.isArray(stores.revoked) ? stores.revoked : [];
    const activeShops = Array.isArray(stores.activeShops) ? stores.activeShops : [];

    const nextShopEntries = shops
        .map((entry = {}) => {
            const shopId = normalizeShopId(entry.shopId || '');
            if (!shopId) return null;
            return {
                shopId,
                profile: {
                    enabled: normalizeBoolean(entry.enabled, true),
                    shopName: normalizeShopName(entry.shopName || ''),
                    authExpiresAt: normalizeIsoDatetime(entry.authExpiresAt || ''),
                    updatedAt: normalizeIsoDatetime(entry.updatedAt || '') || new Date().toISOString()
                }
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.shopId.localeCompare(b.shopId));

    const nextRevokedIds = revoked
        .map(item => normalizeShopId(item))
        .filter(Boolean)
        .sort();

    const normalizedActiveShops = activeShops
        .map((entry = {}) => {
            const shopId = normalizeShopId(entry.shopId || '');
            if (!shopId) return null;
            const lastSeenAtMs = resolveNonNegativeInt(
                entry.lastSeenAtMs || Date.parse(String(entry.lastSeenAt || '').trim()) || 0
            );
            const firstSeenAtMs = resolveNonNegativeInt(
                entry.firstSeenAtMs || Date.parse(String(entry.firstSeenAt || '').trim()) || 0
            ) || lastSeenAtMs;
            return {
                shopId,
                shopName: normalizeShopName(entry.shopName || ''),
                firstSeenAt: normalizeIsoDatetime(entry.firstSeenAt || '') || (firstSeenAtMs ? new Date(firstSeenAtMs).toISOString() : ''),
                firstSeenAtMs,
                runtimeMode: normalizeRuntimeMode(entry.runtimeMode || ''),
                scriptVersion: normalizeScriptVersion(entry.scriptVersion || ''),
                buildId: normalizeBuildId(entry.buildId || ''),
                buildChannel: normalizeBuildChannel(entry.buildChannel || ''),
                deviceHash: String(entry.deviceHash || '').trim(),
                userAgent: normalizeClientText(entry.userAgent || '', 512),
                browserVersion: normalizeClientText(entry.browserVersion || '', 120),
                osVersion: normalizeClientText(entry.osVersion || '', 120),
                lastAuthorized: !!entry.lastAuthorized,
                lastReason: String(entry.lastReason || ''),
                lastCode: String(entry.lastCode || ''),
                lastSeenAt: normalizeIsoDatetime(entry.lastSeenAt || '') || (lastSeenAtMs ? new Date(lastSeenAtMs).toISOString() : ''),
                lastSeenAtMs,
                lastRequestTimestamp: resolveNonNegativeInt(entry.lastRequestTimestamp || 0),
                verifyCount: resolveNonNegativeInt(entry.verifyCount || 0),
                lastAuthorizedAt: normalizeIsoDatetime(entry.lastAuthorizedAt || ''),
                lastRejectedAt: normalizeIsoDatetime(entry.lastRejectedAt || '')
            };
        })
        .filter(Boolean)
        .sort((a, b) => Number(a.lastSeenAtMs || 0) - Number(b.lastSeenAtMs || 0) || a.shopId.localeCompare(b.shopId));

    const limitedActiveShops = normalizedActiveShops.slice(Math.max(0, normalizedActiveShops.length - MAX_ACTIVE_SHOP_ENTRIES));

    MEMORY_SHOP_STORE.clear();
    nextShopEntries.forEach(({ shopId, profile }) => {
        MEMORY_SHOP_STORE.set(shopId, profile);
    });

    MEMORY_REVOKE_STORE.clear();
    nextRevokedIds.forEach((shopId) => {
        MEMORY_REVOKE_STORE.add(shopId);
    });

    MEMORY_ACTIVE_SHOP_STORE.clear();
    limitedActiveShops.forEach((entry) => {
        MEMORY_ACTIVE_SHOP_STORE.set(entry.shopId, entry);
    });
};

const syncStateFromFile = ({ force = false } = {}) => {
    if (!STATE_FILE_ENABLED) return false;

    const nowMs = toNow();
    if (!force && nowMs - STATE_FILE_META.lastSyncAtMs < STATE_SYNC_INTERVAL_MS) {
        return false;
    }
    STATE_FILE_META.lastSyncAtMs = nowMs;

    const targetPath = resolveStateFileTargetPath();
    let stats;
    try {
        stats = fs.statSync(targetPath);
    } catch (error) {
        if (error?.code === 'ENOENT') {
            STATE_FILE_META.lastMtimeMs = 0;
            return false;
        }
        console.error('[license_state] failed to stat state file', error);
        return false;
    }

    const fileMtimeMs = resolveNonNegativeInt(stats?.mtimeMs || 0);
    if (!force && fileMtimeMs > 0 && fileMtimeMs <= STATE_FILE_META.lastMtimeMs) {
        return false;
    }

    let snapshot;
    try {
        const raw = fs.readFileSync(targetPath, 'utf8');
        snapshot = raw.trim() ? JSON.parse(raw) : {};
    } catch (error) {
        console.error('[license_state] failed to read state file', error);
        return false;
    }

    applyStateSnapshot(snapshot);
    STATE_FILE_META.lastLoadAtMs = nowMs;
    STATE_FILE_META.lastMtimeMs = fileMtimeMs || nowMs;
    return true;
};

const persistStateToFile = ({ force = false } = {}) => {
    if (!STATE_FILE_ENABLED) return false;

    const nowMs = toNow();
    if (!force && nowMs - STATE_FILE_META.lastPersistAtMs < STATE_SYNC_INTERVAL_MS) {
        return false;
    }

    const targetPath = resolveStateFileTargetPath();
    const parentDir = path.dirname(targetPath);
    const tempPath = path.join(parentDir, `.${path.basename(targetPath)}.${process.pid}.${nowMs}.tmp`);

    try {
        fs.mkdirSync(parentDir, { recursive: true });
        fs.writeFileSync(tempPath, JSON.stringify(buildStateSnapshot(), null, 2), 'utf8');
        fs.renameSync(tempPath, targetPath);
        const stats = fs.statSync(targetPath);
        const persistedAtMs = toNow();
        STATE_FILE_META.lastPersistAtMs = persistedAtMs;
        STATE_FILE_META.lastLoadAtMs = persistedAtMs;
        STATE_FILE_META.lastSyncAtMs = persistedAtMs;
        STATE_FILE_META.lastMtimeMs = resolveNonNegativeInt(stats?.mtimeMs || 0, persistedAtMs);
        return true;
    } catch (error) {
        try {
            fs.unlinkSync(tempPath);
        } catch {}
        console.error('[license_state] failed to persist state file', error);
        return false;
    }
};

const resolveTablestoreRuntime = async () => {
    if (!TABLESTORE_ENABLED) return null;
    if (TABLESTORE_META.runtimePromise) {
        return TABLESTORE_META.runtimePromise;
    }

    TABLESTORE_META.runtimePromise = (async () => {
        let sdkModule;
        try {
            sdkModule = await import('tablestore');
        } catch (error) {
            console.error('[license_state] failed to import tablestore sdk', error);
            return null;
        }

        const Tablestore = sdkModule?.default || sdkModule;
        if (!Tablestore || typeof Tablestore.Client !== 'function') {
            console.error('[license_state] invalid tablestore sdk runtime');
            return null;
        }

        try {
            const clientConfig = {
                endpoint: TABLESTORE_ENDPOINT,
                instancename: TABLESTORE_INSTANCE,
                maxRetries: 2
            };
            if (TABLESTORE_AK && TABLESTORE_SK) {
                clientConfig.accessKeyId = TABLESTORE_AK;
                clientConfig.secretAccessKey = TABLESTORE_SK;
            }
            if (TABLESTORE_STS_TOKEN) {
                clientConfig.securityToken = TABLESTORE_STS_TOKEN;
            }

            const client = new Tablestore.Client(clientConfig);
            return { Tablestore, client };
        } catch (error) {
            console.error('[license_state] failed to initialize tablestore client', error);
            return null;
        }
    })();

    return TABLESTORE_META.runtimePromise;
};

const runTablestoreCall = async (client, methodName, params) => (
    new Promise((resolve, reject) => {
        const method = client?.[methodName];
        if (typeof method !== 'function') {
            reject(new Error(`Tablestore client missing method: ${methodName}`));
            return;
        }
        method.call(client, params, (error, data) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(data);
        });
    })
);

const resolveTablestoreAttribute = (row = {}, columnName = '') => {
    const attributes = row?.attributes || row?.attributeColumns || [];
    if (!Array.isArray(attributes)) return '';

    for (const attribute of attributes) {
        if (!attribute) continue;
        if (Array.isArray(attribute)) {
            if (String(attribute[0] || '') === columnName) {
                return attribute[1];
            }
            continue;
        }

        if (attribute.columnName && String(attribute.columnName) === columnName) {
            return attribute.columnValue;
        }
        if (attribute.name && String(attribute.name) === columnName) {
            return attribute.value;
        }
        if (Object.prototype.hasOwnProperty.call(attribute, columnName)) {
            return attribute[columnName];
        }
    }
    return '';
};

const syncStateFromTablestore = async ({ force = false } = {}) => {
    if (!TABLESTORE_ENABLED) return false;

    const nowMs = toNow();
    if (!force && nowMs - TABLESTORE_META.lastSyncAtMs < STATE_SYNC_INTERVAL_MS) {
        return false;
    }
    TABLESTORE_META.lastSyncAtMs = nowMs;

    const runtime = await resolveTablestoreRuntime();
    if (!runtime?.client) return false;

    const params = {
        tableName: TABLESTORE_TABLE,
        primaryKey: [{ pk: TABLESTORE_STATE_PK }],
        maxVersions: 1
    };

    let result;
    try {
        result = await runTablestoreCall(runtime.client, 'getRow', params);
    } catch (error) {
        const errorCode = String(error?.code || error?.name || '');
        if (errorCode === 'OTSRowNotExist' || errorCode === 'OTSObjectNotExist' || errorCode === 'OTSParameterInvalid') {
            return false;
        }
        console.error('[license_state] failed to load state from tablestore', error);
        return false;
    }

    const row = result?.row || result?.rowData || null;
    if (!row) {
        TABLESTORE_META.lastLoadAtMs = nowMs;
        return false;
    }

    const payloadText = String(resolveTablestoreAttribute(row, 'payload') || '').trim();
    if (!payloadText) {
        TABLESTORE_META.lastLoadAtMs = nowMs;
        return false;
    }

    let snapshot;
    try {
        snapshot = JSON.parse(payloadText);
    } catch (error) {
        console.error('[license_state] invalid payload json from tablestore', error);
        return false;
    }

    applyStateSnapshot(snapshot);
    TABLESTORE_META.lastLoadAtMs = nowMs;
    return true;
};

const persistStateToTablestore = async ({ force = false } = {}) => {
    if (!TABLESTORE_ENABLED) return false;

    const nowMs = toNow();
    if (!force && nowMs - TABLESTORE_META.lastPersistAtMs < STATE_SYNC_INTERVAL_MS) {
        return false;
    }

    const runtime = await resolveTablestoreRuntime();
    if (!runtime?.client) return false;

    const snapshot = buildStateSnapshot();
    const condition = (() => {
        const Tablestore = runtime.Tablestore;
        if (!Tablestore?.Condition || !Tablestore?.RowExistenceExpectation) return undefined;
        try {
            return new Tablestore.Condition(Tablestore.RowExistenceExpectation.IGNORE, null);
        } catch {
            return undefined;
        }
    })();

    const params = {
        tableName: TABLESTORE_TABLE,
        primaryKey: [{ pk: TABLESTORE_STATE_PK }],
        attributeColumns: [
            { payload: JSON.stringify(snapshot) },
            { updatedAt: snapshot.updatedAt || new Date().toISOString() }
        ],
        ...(condition ? { condition } : {})
    };

    try {
        await runTablestoreCall(runtime.client, 'putRow', params);
        const persistedAtMs = toNow();
        TABLESTORE_META.lastPersistAtMs = persistedAtMs;
        TABLESTORE_META.lastLoadAtMs = persistedAtMs;
        TABLESTORE_META.lastSyncAtMs = persistedAtMs;
        return true;
    } catch (error) {
        console.error('[license_state] failed to persist state to tablestore', error);
        return false;
    }
};

const syncStateBeforeRequest = async (route = {}) => {
    const force = shouldForceStateSync(route);
    const loadedFromCloud = await syncStateFromTablestore({ force });
    if (loadedFromCloud) return true;
    return syncStateFromFile({ force });
};

const persistStateChanges = async () => {
    const persistedToCloud = await persistStateToTablestore({ force: true });
    if (persistedToCloud) return true;
    return persistStateToFile({ force: true });
};

const upsertActiveShopRecord = (payload = {}, verifyResult = {}) => {
    const shopId = normalizeShopId(payload.shopId || '');
    if (!shopId) return;

    const existing = MEMORY_ACTIVE_SHOP_STORE.get(shopId) || {};
    const nowMs = toNow();
    const firstSeenAtMs = resolveNonNegativeInt(
        existing.firstSeenAtMs || Date.parse(String(existing.firstSeenAt || '').trim()) || 0
    ) || nowMs;
    const currentShopProfile = MEMORY_SHOP_STORE.get(shopId);
    const nextRecord = {
        shopId,
        shopName: pickPreferredShopName(payload.shopName, existing.shopName, currentShopProfile?.shopName),
        firstSeenAt: new Date(firstSeenAtMs).toISOString(),
        firstSeenAtMs,
        runtimeMode: normalizeRuntimeMode(payload.runtimeMode || existing.runtimeMode || ''),
        scriptVersion: normalizeScriptVersion(payload.scriptVersion || existing.scriptVersion || ''),
        buildId: normalizeBuildId(payload.buildId || existing.buildId || ''),
        buildChannel: normalizeBuildChannel(payload.buildChannel || existing.buildChannel || ''),
        deviceHash: String(payload.deviceHash || existing.deviceHash || '').trim(),
        userAgent: normalizeClientText(
            pickFirstText(payload.userAgent, existing.userAgent),
            512
        ),
        browserVersion: normalizeClientText(
            pickFirstText(
                payload.browserVersion,
                resolveBrowserVersionFromUserAgent(payload.userAgent || ''),
                existing.browserVersion,
                resolveBrowserVersionFromUserAgent(existing.userAgent || '')
            ),
            120
        ),
        osVersion: normalizeClientText(
            pickFirstText(
                payload.osVersion,
                resolveOsVersionFromUserAgent(payload.userAgent || ''),
                existing.osVersion,
                resolveOsVersionFromUserAgent(existing.userAgent || '')
            ),
            120
        ),
        lastAuthorized: !!verifyResult.authorized,
        lastReason: String(verifyResult.reason || ''),
        lastCode: String(verifyResult.code || ''),
        lastSeenAt: new Date(nowMs).toISOString(),
        lastSeenAtMs: nowMs,
        lastRequestTimestamp: Number(payload.timestamp || 0),
        verifyCount: Number(existing.verifyCount || 0) + 1,
        lastAuthorizedAt: existing.lastAuthorizedAt || '',
        lastRejectedAt: existing.lastRejectedAt || ''
    };

    if (nextRecord.lastAuthorized) {
        nextRecord.lastAuthorizedAt = nextRecord.lastSeenAt;
    } else {
        nextRecord.lastRejectedAt = nextRecord.lastSeenAt;
    }

    MEMORY_ACTIVE_SHOP_STORE.delete(shopId);
    MEMORY_ACTIVE_SHOP_STORE.set(shopId, nextRecord);

    while (MEMORY_ACTIVE_SHOP_STORE.size > MAX_ACTIVE_SHOP_ENTRIES) {
        const oldestKey = MEMORY_ACTIVE_SHOP_STORE.keys().next().value;
        if (!oldestKey) break;
        MEMORY_ACTIVE_SHOP_STORE.delete(oldestKey);
    }
};

const resolveActiveShopEntries = () => (
    Array.from(MEMORY_ACTIVE_SHOP_STORE.values())
        .map((entry = {}) => {
            const shopId = normalizeShopId(entry.shopId || '');
            const currentShopProfile = MEMORY_SHOP_STORE.get(shopId);
            const currentAuthExpiresAt = resolveProfileAuthExpiresAt(currentShopProfile);
            const currentAuthExpired = isAuthExpirationReached(currentAuthExpiresAt);
            const currentEnabled = isShopAllowed(shopId);
            const currentRevoked = isShopRevoked(shopId);
            const userAgent = normalizeClientText(entry.userAgent || '', 512);
            const browserVersion = normalizeClientText(
                pickFirstText(entry.browserVersion, resolveBrowserVersionFromUserAgent(userAgent)),
                120
            );
            const osVersion = normalizeClientText(
                pickFirstText(entry.osVersion, resolveOsVersionFromUserAgent(userAgent)),
                120
            );
            const currentAuthorization = currentRevoked
                ? 'revoked'
                : (currentEnabled ? 'enabled' : (currentAuthExpired ? 'expired' : 'disabled'));
            return {
                shopId,
                shopName: pickPreferredShopName(entry.shopName, currentShopProfile?.shopName),
                currentEnabled,
                currentRevoked,
                currentAuthExpiresAt,
                currentAuthExpired,
                currentAuthorization,
                firstSeenAt: String(entry.firstSeenAt || entry.lastSeenAt || ''),
                firstSeenAtMs: Number(entry.firstSeenAtMs || entry.lastSeenAtMs || 0),
                lastAuthorized: !!entry.lastAuthorized,
                lastReason: String(entry.lastReason || ''),
                lastCode: String(entry.lastCode || ''),
                runtimeMode: normalizeRuntimeMode(entry.runtimeMode || ''),
                scriptVersion: normalizeScriptVersion(entry.scriptVersion || ''),
                buildId: normalizeBuildId(entry.buildId || ''),
                buildChannel: normalizeBuildChannel(entry.buildChannel || ''),
                deviceHash: String(entry.deviceHash || ''),
                userAgent,
                browserVersion,
                osVersion,
                lastSeenAt: String(entry.lastSeenAt || ''),
                lastSeenAtMs: Number(entry.lastSeenAtMs || 0),
                lastRequestTimestamp: Number(entry.lastRequestTimestamp || 0),
                verifyCount: Number(entry.verifyCount || 0),
                lastAuthorizedAt: String(entry.lastAuthorizedAt || ''),
                lastRejectedAt: String(entry.lastRejectedAt || ''),
                reason: String(entry.lastReason || ''),
                code: String(entry.lastCode || ''),
                updatedAt: String(entry.lastSeenAt || '')
            };
        })
        .filter((entry) => !!entry.shopId)
        .sort((a, b) => Number(b.lastSeenAtMs || 0) - Number(a.lastSeenAtMs || 0) || a.shopId.localeCompare(b.shopId))
);

const isShopAuthorizationExpired = (shopId = '') => {
    const normalizedShopId = normalizeShopId(shopId);
    if (!normalizedShopId) return false;
    if (!MEMORY_SHOP_STORE.has(normalizedShopId)) return false;
    const profile = MEMORY_SHOP_STORE.get(normalizedShopId) || {};
    if (profile.enabled === false) return false;
    return isAuthExpirationReached(resolveProfileAuthExpiresAt(profile));
};

const isShopAllowed = (shopId = '') => {
    const normalizedShopId = normalizeShopId(shopId);
    if (!normalizedShopId) return false;
    if (MEMORY_SHOP_STORE.has(normalizedShopId)) {
        const profile = MEMORY_SHOP_STORE.get(normalizedShopId);
        if (!profile || profile.enabled === false) return false;
        if (isAuthExpirationReached(resolveProfileAuthExpiresAt(profile))) return false;
        return true;
    }
    if (!ALLOWED_SHOP_ID_SET.size) return false;
    return ALLOWED_SHOP_ID_SET.has(normalizedShopId);
};

const isShopRevoked = (shopId = '') => {
    const normalizedShopId = normalizeShopId(shopId);
    if (!normalizedShopId) return true;
    return REVOKED_SHOP_IDS.has(normalizedShopId) || MEMORY_REVOKE_STORE.has(normalizedShopId);
};

const provisionDefaultAuthForNewShop = (payload = {}) => {
    const shopId = normalizeShopId(payload.shopId || '');
    if (!shopId) return { applied: false };
    if (ALLOWED_SHOP_ID_SET.has(shopId) || MEMORY_SHOP_STORE.has(shopId)) {
        return { applied: false };
    }
    if (isShopRevoked(shopId)) return { applied: false };

    const shopName = pickPreferredShopName(payload.shopName);
    const authExpiresAt = addDaysToNowIso(DEFAULT_AUTH_VALID_DAYS);
    MEMORY_SHOP_STORE.set(shopId, {
        enabled: true,
        shopName,
        authExpiresAt,
        updatedAt: new Date().toISOString()
    });
    return {
        applied: true,
        authExpiresAt
    };
};

const verifyLicensePayload = (payload = {}) => {
    const shopId = normalizeShopId(payload.shopId || '');
    const shopName = normalizeShopName(payload.shopName || '');
    const scriptVersion = String(payload.scriptVersion || '').trim();
    const buildId = normalizeBuildId(payload.buildId || '');
    const buildChannel = normalizeBuildChannel(payload.buildChannel || '');
    const runtimeMode = String(payload.runtimeMode || '').trim();
    const deviceHash = String(payload.deviceHash || '').trim();
    const timestamp = Number(payload.timestamp || 0);
    const nonce = String(payload.nonce || '').trim();
    const userAgent = normalizeClientText(payload.userAgent || payload.ua || '', 512);
    const browserVersion = normalizeClientText(
        pickFirstText(payload.browserVersion, payload.browser, resolveBrowserVersionFromUserAgent(userAgent)),
        120
    );
    const osVersion = normalizeClientText(
        pickFirstText(payload.osVersion, payload.os, resolveOsVersionFromUserAgent(userAgent)),
        120
    );

    if (!shopId) return { ok: false, code: 'shop_not_found', reason: '缺少 shopId' };
    if (!scriptVersion) return { ok: false, code: 'script_version_missing', reason: '缺少 scriptVersion' };
    if (!buildId) return { ok: false, code: 'build_id_missing', reason: '缺少 buildId' };
    if (!buildChannel) return { ok: false, code: 'build_channel_missing', reason: '缺少 buildChannel' };
    if (!runtimeMode) return { ok: false, code: 'runtime_mode_missing', reason: '缺少 runtimeMode' };
    if (!deviceHash) return { ok: false, code: 'device_hash_missing', reason: '缺少 deviceHash' };
    if (!Number.isFinite(timestamp) || timestamp <= 0) return { ok: false, code: 'timestamp_invalid', reason: 'timestamp 非法' };
    if (!nonce) return { ok: false, code: 'nonce_missing', reason: '缺少 nonce' };

    return {
        ok: true,
        shopId,
        shopName,
        scriptVersion,
        buildId,
        buildChannel,
        runtimeMode,
        deviceHash,
        timestamp,
        nonce,
        userAgent,
        browserVersion,
        osVersion
    };
};

const writeAuditLog = (entry = {}) => {
    const base = {
        ts: new Date().toISOString(),
        shopId: normalizeShopId(entry.shopId || ''),
        action: String(entry.action || 'verify'),
        result: String(entry.result || ''),
        reason: String(entry.reason || '')
    };
    if (process.env.AM_LICENSE_AUDIT_STDOUT === '1') {
        console.log('[license_audit]', JSON.stringify(base));
    }
};

const timingSafeEqualText = (a = '', b = '') => {
    const left = Buffer.from(String(a || ''), 'utf8');
    const right = Buffer.from(String(b || ''), 'utf8');
    if (left.length !== right.length) return false;
    return crypto.timingSafeEqual(left, right);
};

const checkAdminAuthorization = (req = {}) => {
    if (!ADMIN_TOKEN) {
        return { ok: true, configured: false };
    }

    const event = toEventObject(req);
    const headers = event?.headers || {};
    const providedToken = getHeaderValue(headers, 'x-am-admin-token') || getHeaderValue(headers, 'x-admin-token');
    if (!providedToken) {
        return { ok: false, configured: true, statusCode: 401, code: 'admin_token_missing', reason: '缺少管理 token' };
    }
    if (!timingSafeEqualText(providedToken, ADMIN_TOKEN)) {
        return { ok: false, configured: true, statusCode: 401, code: 'admin_token_invalid', reason: '管理 token 无效' };
    }
    return { ok: true, configured: true };
};

const ensureAdminAuthorized = (req = {}) => {
    const checked = checkAdminAuthorization(req);
    if (checked.ok) return null;
    return responseJson(req, checked.statusCode || 401, {
        ok: false,
        code: checked.code || 'admin_unauthorized',
        reason: checked.reason || '管理鉴权失败'
    });
};

const resolveMemoryShopEntries = () => (
    Array.from(MEMORY_SHOP_STORE.entries())
        .map(([shopId, profile = {}]) => {
            const authExpiresAt = resolveProfileAuthExpiresAt(profile);
            return {
                shopId,
                shopName: pickPreferredShopName(profile.shopName),
                enabled: profile.enabled !== false,
                authExpiresAt,
                authExpired: isAuthExpirationReached(authExpiresAt),
                source: 'memory',
                updatedAt: String(profile.updatedAt || '')
            };
        })
        .sort((a, b) => a.shopId.localeCompare(b.shopId))
);

const backfillShopNameFromVerify = (shopId = '', shopName = '') => {
    const normalizedShopId = normalizeShopId(shopId);
    const normalizedShopName = pickPreferredShopName(shopName);
    if (!normalizedShopId || !normalizedShopName) return false;

    const existingProfile = MEMORY_SHOP_STORE.get(normalizedShopId);
    if (existingProfile) {
        const currentShopName = pickPreferredShopName(existingProfile.shopName);
        if (currentShopName === normalizedShopName) return false;
        MEMORY_SHOP_STORE.set(normalizedShopId, {
            ...existingProfile,
            shopName: normalizedShopName,
            updatedAt: new Date().toISOString()
        });
        return true;
    }

    if (!ALLOWED_SHOP_ID_SET.has(normalizedShopId)) return false;

    MEMORY_SHOP_STORE.set(normalizedShopId, {
        enabled: true,
        shopName: normalizedShopName,
        authExpiresAt: '',
        updatedAt: new Date().toISOString()
    });
    return true;
};

const resolveAdminState = () => {
    const memoryEntries = resolveMemoryShopEntries();
    const activeEntries = resolveActiveShopEntries();
    const activeShopNameMap = new Map(
        activeEntries
            .map((entry) => [entry.shopId, pickPreferredShopName(entry.shopName)])
            .filter(([, shopName]) => !!shopName)
    );
    const effectiveAllowed = new Set(ALLOWED_SHOP_IDS);
    memoryEntries.forEach((entry) => {
        if (entry.enabled && !entry.authExpired) {
            effectiveAllowed.add(entry.shopId);
            return;
        }
        effectiveAllowed.delete(entry.shopId);
    });

    const shopMap = new Map();
    const upsertShopEntry = (entry = {}) => {
        const shopId = normalizeShopId(entry.shopId || '');
        if (!shopId) return;
        const current = shopMap.get(shopId) || {
            shopId,
            shopName: '',
            enabled: true,
            authExpiresAt: '',
            authExpired: false,
            source: '',
            updatedAt: ''
        };

        const mergedAuthExpiresAt = pickPreferredShopName(
            entry.authExpiresAt,
            current.authExpiresAt
        );
        const mergedAuthExpired = typeof entry.authExpired === 'boolean'
            ? entry.authExpired
            : isAuthExpirationReached(mergedAuthExpiresAt);

        shopMap.set(shopId, {
            shopId,
            shopName: pickPreferredShopName(
                entry.shopName,
                current.shopName,
                activeShopNameMap.get(shopId)
            ),
            enabled: typeof entry.enabled === 'boolean' ? entry.enabled : current.enabled,
            authExpiresAt: mergedAuthExpiresAt,
            authExpired: mergedAuthExpired,
            source: entry.source === 'memory' || current.source === 'memory'
                ? 'memory'
                : (String(entry.source || current.source || '').trim() || 'env'),
            updatedAt: String(entry.updatedAt || current.updatedAt || '').trim()
        });
    };

    ALLOWED_SHOP_IDS.forEach((shopId) => {
        upsertShopEntry({
            shopId,
            shopName: activeShopNameMap.get(shopId) || '',
            enabled: true,
            authExpiresAt: '',
            authExpired: false,
            source: 'env',
            updatedAt: ''
        });
    });
    memoryEntries.forEach(upsertShopEntry);

    const shops = Array.from(shopMap.values()).sort((a, b) => a.shopId.localeCompare(b.shopId));

    const revokedEnv = Array.from(REVOKED_SHOP_IDS).sort();
    const revokedMemory = Array.from(MEMORY_REVOKE_STORE).sort();
    const revokedEffective = Array.from(new Set([...revokedEnv, ...revokedMemory])).sort();
    const storageMode = TABLESTORE_ENABLED ? 'tablestore' : (STATE_FILE_ENABLED ? 'file' : 'memory');

    return {
        ok: true,
        adminTokenConfigured: !!ADMIN_TOKEN,
        generatedAt: new Date().toISOString(),
        allowed: {
            env: ALLOWED_SHOP_IDS.slice().sort(),
            memory: memoryEntries.filter(item => item.enabled && !item.authExpired).map(item => item.shopId),
            effective: Array.from(effectiveAllowed).sort()
        },
        revoked: {
            env: revokedEnv,
            memory: revokedMemory,
            effective: revokedEffective
        },
        shops,
        activeShops: activeEntries,
        leaseTtlMs: resolveLeaseTtl(),
        defaultAuthValidDays: DEFAULT_AUTH_VALID_DAYS,
        storage: {
            mode: storageMode,
            syncIntervalMs: STATE_SYNC_INTERVAL_MS,
            tablestore: TABLESTORE_ENABLED ? {
                endpoint: TABLESTORE_ENDPOINT,
                instance: TABLESTORE_INSTANCE,
                table: TABLESTORE_TABLE,
                statePk: TABLESTORE_STATE_PK
            } : null,
            file: STATE_FILE_ENABLED ? {
                path: resolveStateFileTargetPath()
            } : null
        }
    };
};

const handleVerify = async (req = {}) => {
    const payload = await parseJsonBody(req);
    const payloadWithClient = {
        ...payload,
        ...resolveVerifyClientProfile(req, payload)
    };
    const checked = verifyLicensePayload(payloadWithClient);
    if (!checked.ok) {
        upsertActiveShopRecord(payloadWithClient, {
            authorized: false,
            reason: checked.reason,
            code: checked.code
        });
        await persistStateChanges();
        writeAuditLog({ shopId: payloadWithClient?.shopId, action: 'verify', result: 'reject', reason: checked.code });
        return responseJson(req, 200, {
            authorized: false,
            reason: checked.reason,
            code: checked.code
        });
    }

    const autoProvision = provisionDefaultAuthForNewShop(checked);
    if (autoProvision.applied) {
        writeAuditLog({
            shopId: checked.shopId,
            action: 'auto_allow',
            result: 'allow',
            reason: `new_shop_default_${DEFAULT_AUTH_VALID_DAYS}d`
        });
    }

    if (!isShopAllowed(checked.shopId)) {
        if (isShopAuthorizationExpired(checked.shopId)) {
            upsertActiveShopRecord(checked, {
                authorized: false,
                reason: '店铺授权已过期',
                code: 'shop_license_expired'
            });
            await persistStateChanges();
            writeAuditLog({ shopId: checked.shopId, action: 'verify', result: 'reject', reason: 'shop_license_expired' });
            return responseJson(req, 200, {
                authorized: false,
                reason: '店铺授权已过期',
                code: 'shop_license_expired'
            });
        }
        upsertActiveShopRecord(checked, {
            authorized: false,
            reason: '店铺未授权',
            code: 'shop_not_allowed'
        });
        await persistStateChanges();
        writeAuditLog({ shopId: checked.shopId, action: 'verify', result: 'reject', reason: 'shop_not_allowed' });
        return responseJson(req, 200, {
            authorized: false,
            reason: '店铺未授权',
            code: 'shop_not_allowed'
        });
    }

    if (isShopRevoked(checked.shopId)) {
        upsertActiveShopRecord(checked, {
            authorized: false,
            reason: '店铺授权已吊销',
            code: 'shop_revoked'
        });
        await persistStateChanges();
        writeAuditLog({ shopId: checked.shopId, action: 'verify', result: 'reject', reason: 'shop_revoked' });
        return responseJson(req, 200, {
            authorized: false,
            reason: '店铺授权已吊销',
            code: 'shop_revoked'
        });
    }

    const leaseTtl = resolveLeaseTtl();
    const expiresAt = toNow() + leaseTtl;
    const leaseToken = crypto.randomUUID();
    const signature = buildSignature({
        shopId: checked.shopId,
        leaseToken,
        expiresAt,
        buildId: checked.buildId,
        buildChannel: checked.buildChannel
    });

    backfillShopNameFromVerify(checked.shopId, checked.shopName);
    upsertActiveShopRecord(checked, {
        authorized: true,
        reason: 'ok',
        code: 'ok'
    });
    await persistStateChanges();
    writeAuditLog({ shopId: checked.shopId, action: 'verify', result: 'allow', reason: 'ok' });
    return responseJson(req, 200, {
        authorized: true,
        reason: 'ok',
        leaseToken,
        expiresAt,
        policy: {
            signature,
            ttlMs: leaseTtl,
            shopId: checked.shopId,
            shopName: checked.shopName,
            buildId: checked.buildId,
            buildChannel: checked.buildChannel
        }
    });
};

const handleRevoke = async (req = {}) => {
    const deny = ensureAdminAuthorized(req);
    if (deny) return deny;

    const payload = await parseJsonBody(req);
    const shopId = normalizeShopId(payload.shopId || '');
    if (!shopId) {
        return responseJson(req, 400, { ok: false, code: 'shop_not_found', reason: '缺少 shopId' });
    }

    MEMORY_REVOKE_STORE.add(shopId);
    await persistStateChanges();
    writeAuditLog({ shopId, action: 'revoke', result: 'ok', reason: 'manual_revoke' });
    return responseJson(req, 200, {
        ok: true,
        shopId,
        revokedAt: new Date().toISOString()
    });
};

const handleAdminAllow = async (req = {}) => {
    const deny = ensureAdminAuthorized(req);
    if (deny) return deny;

    const payload = await parseJsonBody(req);
    const shopId = normalizeShopId(payload.shopId || '');
    if (!shopId) {
        return responseJson(req, 400, { ok: false, code: 'shop_not_found', reason: '缺少 shopId' });
    }

    const existingShopProfile = MEMORY_SHOP_STORE.get(shopId) || {};
    const existingActiveProfile = MEMORY_ACTIVE_SHOP_STORE.get(shopId) || {};
    const shopName = pickPreferredShopName(
        payload.shopName,
        existingShopProfile.shopName,
        existingActiveProfile.shopName
    );
    const enabled = normalizeBoolean(payload.enabled, true);
    const expiryUpdate = resolveAuthExpiresAtUpdate({
        payload,
        existingProfile: existingShopProfile,
        enabled
    });
    if (!expiryUpdate.ok) {
        return responseJson(req, 400, {
            ok: false,
            code: expiryUpdate.code || 'auth_expiry_invalid',
            reason: expiryUpdate.reason || '授权有效期参数非法'
        });
    }
    const authExpiresAt = expiryUpdate.authExpiresAt || '';
    const authExpired = isAuthExpirationReached(authExpiresAt);

    MEMORY_SHOP_STORE.set(shopId, {
        enabled,
        shopName,
        authExpiresAt,
        updatedAt: new Date().toISOString()
    });
    if (shopName && MEMORY_ACTIVE_SHOP_STORE.has(shopId)) {
        const activeRecord = MEMORY_ACTIVE_SHOP_STORE.get(shopId) || {};
        MEMORY_ACTIVE_SHOP_STORE.set(shopId, {
            ...activeRecord,
            shopId,
            shopName
        });
    }
    if (enabled) {
        MEMORY_REVOKE_STORE.delete(shopId);
    }
    await persistStateChanges();
    writeAuditLog({ shopId, action: 'admin_allow', result: enabled ? 'allow' : 'disable', reason: 'manual_admin' });

    return responseJson(req, 200, {
        ok: true,
        shopId,
        shopName,
        enabled,
        authExpiresAt,
        authExpired,
        expirySource: expiryUpdate.source || '',
        state: resolveAdminState()
    });
};

const handleAdminRevoke = async (req = {}) => {
    const deny = ensureAdminAuthorized(req);
    if (deny) return deny;

    const payload = await parseJsonBody(req);
    const shopId = normalizeShopId(payload.shopId || '');
    if (!shopId) {
        return responseJson(req, 400, { ok: false, code: 'shop_not_found', reason: '缺少 shopId' });
    }

    const revoked = normalizeBoolean(payload.revoked, true);
    if (revoked) {
        MEMORY_REVOKE_STORE.add(shopId);
    } else {
        MEMORY_REVOKE_STORE.delete(shopId);
    }
    await persistStateChanges();
    writeAuditLog({ shopId, action: 'admin_revoke', result: revoked ? 'revoke' : 'unrevoke', reason: 'manual_admin' });

    return responseJson(req, 200, {
        ok: true,
        shopId,
        revoked,
        state: resolveAdminState()
    });
};

const handleAdminDelete = async (req = {}) => {
    const deny = ensureAdminAuthorized(req);
    if (deny) return deny;

    const payload = await parseJsonBody(req);
    const shopId = normalizeShopId(payload.shopId || '');
    if (!shopId) {
        return responseJson(req, 400, { ok: false, code: 'shop_not_found', reason: '缺少 shopId' });
    }

    const removed = {
        shop: MEMORY_SHOP_STORE.delete(shopId),
        revoked: MEMORY_REVOKE_STORE.delete(shopId),
        active: MEMORY_ACTIVE_SHOP_STORE.delete(shopId)
    };

    await persistStateChanges();
    writeAuditLog({ shopId, action: 'admin_delete', result: 'ok', reason: 'manual_admin' });

    return responseJson(req, 200, {
        ok: true,
        shopId,
        removed,
        state: resolveAdminState()
    });
};

const handleAdminState = async (req = {}) => {
    const deny = ensureAdminAuthorized(req);
    if (deny) return deny;
    return responseJson(req, 200, resolveAdminState());
};

const ADMIN_PAGE_FALLBACK_HTML = `<!doctype html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>License Admin</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
            color: #11233a;
            background: #f6f8fb;
        }
        .card {
            max-width: 760px;
            margin: 20px auto;
            border: 1px solid #dde5ef;
            border-radius: 12px;
            background: #fff;
            padding: 16px;
        }
        h1 { margin: 0 0 8px; font-size: 20px; }
        p { margin: 6px 0; }
        code {
            display: inline-block;
            margin: 0 2px;
            padding: 1px 6px;
            border-radius: 6px;
            border: 1px solid #dde5ef;
            background: #f8fbff;
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <section class="card">
        <h1>License Admin 模板加载失败</h1>
        <p>当前函数未读取到 <code>services/license-server/license-admin.html</code>，请确认部署包包含该文件。</p>
        <p>你仍可通过接口进行管理：<code>GET /v1/license/admin/state</code>、<code>POST /v1/license/admin/allow</code>、<code>POST /v1/license/admin/revoke</code>、<code>POST /v1/license/admin/delete</code>。</p>
    </section>
</body>
</html>`;

let ADMIN_PAGE_HTML_CACHE = '';
let ADMIN_PAGE_LOAD_FAILED = false;

const loadAdminPageTemplate = () => {
    try {
        const html = fs.readFileSync(ADMIN_PAGE_TEMPLATE_PATH, 'utf8');
        if (String(html || '').includes('<html') && String(html || '').includes('</html>')) {
            return html;
        }
    } catch (error) {
        if (!ADMIN_PAGE_LOAD_FAILED) {
            console.error('[license_admin] failed to load admin template', error);
            ADMIN_PAGE_LOAD_FAILED = true;
        }
    }
    return ADMIN_PAGE_FALLBACK_HTML;
};

const renderAdminPage = () => {
    if (ADMIN_PAGE_HTML_CACHE) return ADMIN_PAGE_HTML_CACHE;
    ADMIN_PAGE_HTML_CACHE = loadAdminPageTemplate();
    return ADMIN_PAGE_HTML_CACHE;
};

const resolveRoute = (req = {}) => {
    const event = toEventObject(req);
    const headers = event?.headers || {};

    const method = String(
        event?.method ||
        event?.httpMethod ||
        event?.requestContext?.http?.method ||
        event?.requestContext?.httpMethod ||
        getHeaderValue(headers, 'x-fc-http-method') ||
        'GET'
    ).toUpperCase();

    let path = String(
        event?.path ||
        event?.rawPath ||
        event?.requestContext?.http?.path ||
        event?.requestContext?.path ||
        getHeaderValue(headers, 'x-fc-request-uri') ||
        '/'
    ).trim();

    if (path.startsWith('http://') || path.startsWith('https://')) {
        try {
            const parsed = new URL(path);
            path = parsed.pathname || '/';
        } catch {
            path = '/';
        }
    }

    const queryPos = path.indexOf('?');
    if (queryPos >= 0) {
        path = path.slice(0, queryPos);
    }
    if (!path) path = '/';
    if (!path.startsWith('/')) path = `/${path}`;

    return { method, path };
};

const isAdminPagePath = (path = '/') => {
    if (path === '/' || path === '/admin' || path === '/index.html') {
        return true;
    }
    if (path.endsWith('/admin') || path.endsWith('/index.html')) {
        return true;
    }
    return false;
};

const shouldForceStateSync = (route = {}) => {
    if (route.method !== 'POST') return false;
    if (route.path.endsWith('/v1/license/admin/allow')) return true;
    if (route.path.endsWith('/v1/license/admin/revoke')) return true;
    if (route.path.endsWith('/v1/license/admin/delete')) return true;
    if (route.path.endsWith('/v1/license/revoke')) return true;
    return false;
};

export const handler = async (req = {}) => {
    const route = resolveRoute(req);

    if (route.method === 'OPTIONS') {
        return responseNoContent(req);
    }

    await syncStateBeforeRequest(route);

    if (route.method === 'GET' && isAdminPagePath(route.path)) {
        return responseHtml(req, 200, renderAdminPage());
    }

    if (route.method === 'GET' && route.path.endsWith('/v1/license/admin/state')) {
        return handleAdminState(req);
    }
    if (route.method === 'POST' && route.path.endsWith('/v1/license/admin/allow')) {
        return handleAdminAllow(req);
    }
    if (route.method === 'POST' && route.path.endsWith('/v1/license/admin/revoke')) {
        return handleAdminRevoke(req);
    }
    if (route.method === 'POST' && route.path.endsWith('/v1/license/admin/delete')) {
        return handleAdminDelete(req);
    }
    if (route.method === 'POST' && route.path.endsWith('/v1/license/verify')) {
        return handleVerify(req);
    }
    if (route.method === 'POST' && route.path.endsWith('/v1/license/revoke')) {
        return handleRevoke(req);
    }

    return responseJson(req, 404, {
        ok: false,
        code: 'not_found',
        reason: `${route.method} ${route.path}`
    });
};
