(function () {
    'use strict';

    // 全局版本管理
    const CURRENT_VERSION = typeof globalThis !== 'undefined' && typeof globalThis.__AM_GET_SCRIPT_VERSION__ === 'function'
        ? globalThis.__AM_GET_SCRIPT_VERSION__()
        : resolveScriptVersion();

    // ==========================================
    // 1. 配置与状态管理
    // ==========================================
    const CONSTANTS = {
        STORAGE_KEY: 'AM_HELPER_CONFIG',
        CONFIG_REVISION: 2,
        LEGACY_STORAGE_KEYS: ['AM_HELPER_CONFIG_V5_15', 'AM_HELPER_CONFIG_V5_14', 'AM_HELPER_CONFIG_V5_13'],
        TAG_BASE_STYLE: 'align-items:center;border:0 none;border-radius:var(--mx-effects-tag-border-radius,8px);display:inline-flex;font-size:9px;font-weight:800;height:var(--mx-effects-tag-height,16px);justify-content:center;padding:0 var(--mx-effects-tag-h-gap,1px);position:relative;transition:background-color var(--duration),color var(--duration),border var(--duration),opacity var(--duration);-webkit-user-select:none;-moz-user-select:none;user-select:none;width:100%;margin-top:2px;',
        STYLES: {
            cost: 'background-color:rgba(255,0,106,0.1);color:#ff006a;',
            cart: 'background-color:rgba(114,46,209,0.1);color:#722ed1;',
            percent: 'background-color:rgba(24,144,255,0.1);color:#1890ff;',
            ratio: 'background-color:rgba(250,140,22,0.1);color:#fa8c16;',
            budget: 'color:#52c41a;transition:all 0.3s;'
        },
        KEYWORDS: ['查询', '搜索', '确定', '今天', '昨天', '过去', '本月', '上月', '计划', '单元', '创意', '推广'],
        DL_KEYWORDS: ["oss-accelerate", "aliyuncs.com", "download"]
    };

    const DEFAULT_CONFIG = {
        panelOpen: false,
        showCost: true,
        showCartCost: true,
        showPercent: true,
        showCostRatio: true,
        showBudget: true,
        unlockBudgetFrontendLimit: false,
        autoClose: true,
        autoSortCharge: true,  // 花费降序排序
        logExpanded: false,
        magicReportOpen: false,
        magicReportDefaultView: 'matrix',
        showConcurrentStartButton: false,
        configRevision: CONSTANTS.CONFIG_REVISION
    };

    const resolveHookTargetWindow = () => {
        try {
            if (typeof unsafeWindow !== 'undefined' && unsafeWindow && unsafeWindow.window === unsafeWindow) {
                return unsafeWindow;
            }
        } catch { }
        return window;
    };

    const createHookManager = () => {
        const hookWindow = resolveHookTargetWindow();
        if (hookWindow.__AM_HOOK_MANAGER__) return hookWindow.__AM_HOOK_MANAGER__;
        if (window.__AM_HOOK_MANAGER__) return window.__AM_HOOK_MANAGER__;

        const manager = {
            installed: false,
            fetchHandlers: [],
            xhrOpenHandlers: [],
            xhrSendHandlers: [],
            xhrLoadHandlers: [],
            requestHistory: [],
            requestHistoryLimit: 4000,

            recordRequest(entry = {}) {
                const rawUrl = entry?.url;
                if (!rawUrl) return;
                let normalizedUrl = '';
                try {
                    normalizedUrl = new URL(String(rawUrl), window.location.origin).toString();
                } catch {
                    normalizedUrl = String(rawUrl || '').trim();
                }
                if (!normalizedUrl) return;
                const method = String(entry?.method || 'GET').trim().toUpperCase() || 'GET';
                this.requestHistory.push({
                    ts: Date.now(),
                    method,
                    url: normalizedUrl,
                    body: entry?.body ?? null,
                    source: String(entry?.source || '').trim()
                });
                const maxSizeRaw = Number(this.requestHistoryLimit);
                const maxSize = Math.max(500, Number.isFinite(maxSizeRaw) ? maxSizeRaw : 4000);
                if (this.requestHistory.length > maxSize) {
                    this.requestHistory.splice(0, this.requestHistory.length - maxSize);
                }
            },

            getRequestHistory(options = {}) {
                const includePattern = options.includePattern instanceof RegExp ? options.includePattern : null;
                const sinceRaw = Number(options.since);
                const since = Math.max(0, Number.isFinite(sinceRaw) ? sinceRaw : 0);
                const limitRaw = Number(options.limit);
                const fallbackLimitRaw = Number(this.requestHistoryLimit);
                const fallbackLimit = Number.isFinite(fallbackLimitRaw) ? fallbackLimitRaw : 4000;
                const limit = Math.max(1, Math.min(20000, Number.isFinite(limitRaw) ? limitRaw : fallbackLimit));
                let list = Array.isArray(this.requestHistory) ? this.requestHistory.slice() : [];
                if (since > 0) {
                    list = list.filter(item => Number(item?.ts) >= since);
                }
                if (includePattern) {
                    list = list.filter(item => {
                        let path = '';
                        try {
                            path = new URL(String(item?.url || ''), window.location.origin).pathname || '';
                        } catch {
                            path = String(item?.url || '');
                        }
                        return !!path && includePattern.test(path);
                    });
                }
                if (list.length > limit) {
                    list = list.slice(list.length - limit);
                }
                return list.map(item => ({ ...item }));
            },

            clearRequestHistory() {
                this.requestHistory = [];
            },

            unregisterHandler(listName, handler) {
                const list = this[listName];
                if (!Array.isArray(list) || typeof handler !== 'function') return false;
                const index = list.indexOf(handler);
                if (index < 0) return false;
                list.splice(index, 1);
                return true;
            },

            registerFetch(handler) {
                if (typeof handler !== 'function') return () => false;
                this.fetchHandlers.push(handler);
                return () => this.unregisterHandler('fetchHandlers', handler);
            },

            registerXHROpen(handler) {
                if (typeof handler !== 'function') return () => false;
                this.xhrOpenHandlers.push(handler);
                return () => this.unregisterHandler('xhrOpenHandlers', handler);
            },

            registerXHRSend(handler) {
                if (typeof handler !== 'function') return () => false;
                this.xhrSendHandlers.push(handler);
                return () => this.unregisterHandler('xhrSendHandlers', handler);
            },

            registerXHRLoad(handler) {
                if (typeof handler !== 'function') return () => false;
                this.xhrLoadHandlers.push(handler);
                return () => this.unregisterHandler('xhrLoadHandlers', handler);
            },

            install() {
                if (this.installed || hookWindow.__AM_HOOKS_INSTALLED__) return;

                const originalFetch = hookWindow.fetch;
                if (typeof originalFetch === 'function') {
                    hookWindow.fetch = async function (...args) {
                        const first = args?.[0];
                        const second = args?.[1];
                        const method = second?.method || first?.method || 'GET';
                        const url = typeof first === 'string'
                            ? first
                            : first?.url || '';
                        const body = second?.body || first?.body || '';
                        manager.recordRequest({
                            method,
                            url,
                            body,
                            source: 'fetch'
                        });
                        const response = await originalFetch.apply(this, args);
                        manager.fetchHandlers.forEach(handler => {
                            try {
                                handler({ args, response });
                            } catch { }
                        });
                        return response;
                    };
                }

                const originalOpen = hookWindow.XMLHttpRequest.prototype.open;
                const originalSend = hookWindow.XMLHttpRequest.prototype.send;

                hookWindow.XMLHttpRequest.prototype.open = function (...args) {
                    const [method, url] = args;
                    this.__amHookMethod = method;
                    this.__amHookUrl = url;

                    manager.xhrOpenHandlers.forEach(handler => {
                        try {
                            handler({ xhr: this, method, url, args });
                        } catch { }
                    });

                    return originalOpen.apply(this, args);
                };

                hookWindow.XMLHttpRequest.prototype.send = function (...args) {
                    const [data] = args;
                    const xhr = this;
                    manager.recordRequest({
                        method: xhr.__amHookMethod || 'POST',
                        url: xhr.__amHookUrl || '',
                        body: data,
                        source: 'xhr'
                    });

                    manager.xhrSendHandlers.forEach(handler => {
                        try {
                            handler({
                                xhr,
                                data,
                                method: xhr.__amHookMethod,
                                url: xhr.__amHookUrl,
                                args
                            });
                        } catch { }
                    });

                    xhr.addEventListener('load', function () {
                        manager.xhrLoadHandlers.forEach(handler => {
                            try {
                                handler({
                                    xhr: this,
                                    method: this.__amHookMethod,
                                    url: this.__amHookUrl
                                });
                            } catch { }
                        });
                    });

                    return originalSend.apply(xhr, args);
                };

                this.installed = true;
                hookWindow.__AM_HOOKS_INSTALLED__ = true;
                window.__AM_HOOKS_INSTALLED__ = true;
            }
        };

        hookWindow.__AM_HOOK_MANAGER__ = manager;
        window.__AM_HOOK_MANAGER__ = manager;
        return manager;
    };

    const safeParseJSON = (raw) => {
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    };

    const normalizeConfig = (rawConfig) => {
        const parsedRevision = Number(rawConfig?.configRevision);
        const hasValidRevision = Number.isFinite(parsedRevision);
        const needsRevisionUpgrade = !hasValidRevision || parsedRevision < CONSTANTS.CONFIG_REVISION;
        const nextConfig = { ...DEFAULT_CONFIG, ...rawConfig, panelOpen: false };

        if (needsRevisionUpgrade) {
            nextConfig.logExpanded = false;
            nextConfig.configRevision = CONSTANTS.CONFIG_REVISION;
        } else {
            nextConfig.configRevision = parsedRevision;
        }

        return { config: nextConfig, migrated: needsRevisionUpgrade };
    };

    const loadConfig = () => {
        const current = safeParseJSON(localStorage.getItem(CONSTANTS.STORAGE_KEY));
        if (current && typeof current === 'object') {
            const { config, migrated } = normalizeConfig(current);
            if (migrated) {
                localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(config));
            }
            return config;
        }

        for (const legacyKey of CONSTANTS.LEGACY_STORAGE_KEYS) {
            const legacy = safeParseJSON(localStorage.getItem(legacyKey));
            if (legacy && typeof legacy === 'object') {
                const { config } = normalizeConfig(legacy);
                localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(config));
                return config;
            }
        }

        return { ...DEFAULT_CONFIG };
    };

    const PlanIdentityUtils = {
        DEFAULT_BIZ_CODE: 'onebpSearch',
        BIZ_CODE_LIST: ['onebpSearch', 'onebpSite', 'onebpAdStrategyLiuZi', 'onebpDisplay'],
        campaignItemIdCache: new Map(),
        campaignItemCandidatesCache: new Map(),

        normalizeCampaignId(rawId) {
            const id = String(rawId || '').trim();
            return /^\d{6,}$/.test(id) ? id : '';
        },

        normalizeAdgroupId(rawId) {
            const id = String(rawId || '').trim();
            return /^\d{6,}$/.test(id) ? id : '';
        },

        normalizeItemId(rawItemId) {
            const itemId = String(rawItemId || '').trim();
            return /^\d{6,}$/.test(itemId) ? itemId : '';
        },

        normalizeBizCode(rawBizCode) {
            const biz = String(rawBizCode || '').trim();
            if (!biz) return '';
            if (biz === 'onebpSearch' || biz === 'onebpSite' || biz === 'onebpAdStrategyLiuZi' || biz === 'onebpDisplay') return biz;
            if (/onebpsearch|search|keyword|关键词/i.test(biz)) return 'onebpSearch';
            if (/onebpsite|site|全站/i.test(biz)) return 'onebpSite';
            if (/onebpadstrategyliuzi|liuzi|lead|线索|留资/i.test(biz)) return 'onebpAdStrategyLiuZi';
            if (/onebpdisplay|display|crowd|人群/i.test(biz)) return 'onebpDisplay';
            return '';
        },

        getOppositeBizCode(bizCode) {
            const biz = this.normalizeBizCode(bizCode);
            if (biz === 'onebpSearch') return 'onebpSite';
            if (biz === 'onebpSite') return 'onebpSearch';
            return '';
        },

        formatDateYmd(date = new Date()) {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        },

        rememberCampaignItemId(campaignId, itemId) {
            const normalizedCampaignId = this.normalizeCampaignId(campaignId);
            const normalizedItemId = this.normalizeItemId(itemId);
            if (!normalizedCampaignId || !normalizedItemId) return;
            this.campaignItemIdCache.set(normalizedCampaignId, normalizedItemId);
            this.rememberCampaignItemIdCandidates(normalizedCampaignId, [normalizedItemId], {
                prepend: true,
                maxCount: 24
            });
        },

        getCampaignItemId(campaignId) {
            const normalizedCampaignId = this.normalizeCampaignId(campaignId);
            if (!normalizedCampaignId) return '';
            const direct = this.normalizeItemId(this.campaignItemIdCache.get(normalizedCampaignId) || '');
            if (direct) return direct;
            const candidates = this.getCampaignItemIdCandidates(normalizedCampaignId);
            const firstCandidate = this.normalizeItemId(candidates[0] || '');
            if (firstCandidate) {
                this.campaignItemIdCache.set(normalizedCampaignId, firstCandidate);
            }
            return firstCandidate;
        },

        rememberCampaignItemIdCandidates(campaignId, itemIds = [], options = {}) {
            const normalizedCampaignId = this.normalizeCampaignId(campaignId);
            if (!normalizedCampaignId) return [];
            const maxCount = Math.max(1, Number(options?.maxCount) || 24);
            const prepend = options?.prepend === true;
            const nextCandidates = this.collectItemIdCandidatesFromSources(itemIds, maxCount);
            if (!nextCandidates.length) return this.getCampaignItemIdCandidates(normalizedCampaignId);
            const currentCandidates = this.getCampaignItemIdCandidates(normalizedCampaignId);
            const merged = prepend
                ? [...nextCandidates, ...currentCandidates]
                : [...currentCandidates, ...nextCandidates];
            const deduped = [];
            const seen = new Set();
            for (let i = 0; i < merged.length; i++) {
                const normalized = this.normalizeItemId(merged[i] || '');
                if (!normalized || seen.has(normalized)) continue;
                seen.add(normalized);
                deduped.push(normalized);
                if (deduped.length >= maxCount) break;
            }
            this.campaignItemCandidatesCache.set(normalizedCampaignId, deduped);
            const firstCandidate = this.normalizeItemId(deduped[0] || '');
            if (firstCandidate) {
                this.campaignItemIdCache.set(normalizedCampaignId, firstCandidate);
            }
            return deduped;
        },

        getCampaignItemIdCandidates(campaignId) {
            const normalizedCampaignId = this.normalizeCampaignId(campaignId);
            if (!normalizedCampaignId) return [];
            const rawList = this.campaignItemCandidatesCache instanceof Map
                ? this.campaignItemCandidatesCache.get(normalizedCampaignId)
                : [];
            return this.collectItemIdCandidatesFromSources(rawList, 24);
        },

        parseBizCodeFromRaw(raw) {
            const text = String(raw || '').trim();
            if (!text) return '';
            try {
                const parsed = new URL(text, window.location.origin);
                const fromQuery = this.normalizeBizCode(parsed.searchParams.get('bizCode') || '');
                if (fromQuery) return fromQuery;
            } catch { }
            const match = text.match(/[?&]bizCode=([^&#]+)/i) || text.match(/bizCode[=:]([^&#]+)/i);
            if (!match || !match[1]) return '';
            try {
                return this.normalizeBizCode(decodeURIComponent(match[1]));
            } catch {
                return this.normalizeBizCode(match[1]);
            }
        },

        inferBizCodeFromElement(el) {
            const fromLocation = this.parseBizCodeFromRaw(window.location.href) || this.parseBizCodeFromRaw(window.location.hash);
            if (!(el instanceof Element)) return fromLocation;

            const fromSelf = this.parseBizCodeFromRaw(el.getAttribute?.('href') || '')
                || this.parseBizCodeFromRaw(el.getAttribute?.('mx-href') || '')
                || this.parseBizCodeFromRaw(el.getAttribute?.('data-biz-code') || '')
                || this.parseBizCodeFromRaw(el.dataset?.bizCode || '');
            if (fromSelf) return fromSelf;

            const nearestLink = el.closest('a[href], [mx-href], [data-biz-code]');
            if (nearestLink instanceof Element) {
                const fromLink = this.parseBizCodeFromRaw(nearestLink.getAttribute('href') || '')
                    || this.parseBizCodeFromRaw(nearestLink.getAttribute('mx-href') || '')
                    || this.parseBizCodeFromRaw(nearestLink.getAttribute('data-biz-code') || '')
                    || this.parseBizCodeFromRaw(nearestLink.dataset?.bizCode || '');
                if (fromLink) return fromLink;
            }

            const scope = el.closest('tr, li, section, article, .table-row, .list-item, .campaign-row') || el.parentElement;
            const scopeText = String(scope?.textContent || '');
            if (/关键词推广|关键词计划|关键词/.test(scopeText)) return 'onebpSearch';
            if (/全站推广|货品全站|全站/.test(scopeText)) return 'onebpSite';
            if (/线索推广|线索计划|线索|留资/.test(scopeText)) return 'onebpAdStrategyLiuZi';
            if (/人群推广|人群计划|人群/.test(scopeText)) return 'onebpDisplay';
            return fromLocation;
        },

        parseItemIdFromRaw(raw) {
            const text = String(raw || '').trim();
            if (!text) return '';
            const fromPlain = this.normalizeItemId(
                (text.match(/(?:itemId|item_id|materialId|material_id|searchValue)[=:]([0-9]{6,})/i) || [])[1]
            );
            if (fromPlain) return fromPlain;
            try {
                const parsed = new URL(text, window.location.origin);
                const searchKey = String(parsed.searchParams.get('searchKey') || '').trim().toLowerCase();
                const searchValue = this.normalizeItemId(parsed.searchParams.get('searchValue') || '');
                if (searchValue && (!searchKey || searchKey === 'itemid' || searchKey === 'item_id' || searchKey === 'materialid')) {
                    return searchValue;
                }
                const keys = ['itemId', 'item_id', 'materialId', 'material_id', 'searchValue'];
                for (let i = 0; i < keys.length; i++) {
                    const candidate = this.normalizeItemId(parsed.searchParams.get(keys[i]) || '');
                    if (candidate) return candidate;
                }
                const host = String(parsed.hostname || '').toLowerCase();
                const path = String(parsed.pathname || '').toLowerCase();
                if (/detail\.tmall\.com|item\.taobao\.com/.test(host) || /\/item\.htm/.test(path)) {
                    const candidate = this.normalizeItemId(parsed.searchParams.get('id') || '');
                    if (candidate) return candidate;
                }
            } catch { }
            return '';
        },

        inferItemIdFromElement(el, options = {}) {
            const allowLocationFallback = options?.allowLocationFallback !== false;
            const allowBodyFallback = options?.allowBodyFallback !== false;
            const fromLocation = allowLocationFallback
                ? (this.parseItemIdFromRaw(window.location.href)
                    || this.parseItemIdFromRaw(window.location.hash))
                : '';
            const findFromText = (text) => this.normalizeItemId(
                (String(text || '').match(/(?:宝贝|商品)\s*ID\s*[：:]\s*([0-9]{6,})/i) || [])[1]
            );
            if (!(el instanceof Element)) {
                if (fromLocation) return fromLocation;
                return allowBodyFallback ? findFromText(document.body?.innerText || '') : '';
            }
            const fromSelf = this.parseItemIdFromRaw(el.getAttribute?.('href') || '')
                || this.parseItemIdFromRaw(el.getAttribute?.('mx-href') || '')
                || this.normalizeItemId(el.getAttribute?.('data-item-id') || '')
                || this.normalizeItemId(el.getAttribute?.('data-material-id') || '')
                || this.normalizeItemId(el.dataset?.itemId || '')
                || this.normalizeItemId(el.dataset?.materialId || '');
            if (fromSelf) return fromSelf;
            const fromNearestData = this.normalizeItemId(
                el.closest?.('[data-item-id], [data-material-id]')?.getAttribute('data-item-id')
                || el.closest?.('[data-item-id], [data-material-id]')?.getAttribute('data-material-id')
                || ''
            );
            if (fromNearestData) return fromNearestData;
            const scope = el.closest('tr, li, section, article, .table-row, .list-item, .campaign-row') || el.parentElement;
            const fromScope = findFromText(scope?.textContent || '');
            if (fromScope) return fromScope;
            if (fromLocation) return fromLocation;
            if (!allowBodyFallback) return '';
            return findFromText(document.body?.innerText || '');
        },

        collectItemIdCandidatesFromSources(candidates = [], maxCount = 24) {
            const queue = Array.isArray(candidates) ? [...candidates] : [candidates];
            const limit = Math.max(1, Number(maxCount) || 24);
            const out = [];
            const seenItemIds = new Set();
            const visitedObjects = new WeakSet();
            const pushItemId = (raw) => {
                const normalized = this.normalizeItemId(raw);
                if (!normalized || seenItemIds.has(normalized)) return;
                seenItemIds.add(normalized);
                out.push(normalized);
            };
            while (queue.length && out.length < limit) {
                const current = queue.shift();
                if (current === undefined || current === null || current === '') continue;
                if (Array.isArray(current)) {
                    queue.push(...current);
                    continue;
                }
                if (typeof current === 'object') {
                    if (visitedObjects.has(current)) continue;
                    visitedObjects.add(current);
                    queue.push(
                        current.itemId,
                        current.materialId,
                        current.auctionId,
                        current.targetItemId,
                        current.targetMaterialId,
                        current.item_id,
                        current.material_id,
                        current.itemid,
                        current.materialid,
                        current.lastAdgroup,
                        current.material,
                        current.scopeItems,
                        current.linkUrl,
                        current.itemUrl,
                        current.itemIdList,
                        current.materialIdList,
                        current.whiteBoxItemIds,
                        current.similarItemIds,
                        current.materialList
                    );
                    continue;
                }
                const normalized = this.normalizeItemId(current);
                if (normalized) {
                    pushItemId(normalized);
                    continue;
                }
                const parsed = this.parseItemIdFromRaw(current);
                if (parsed) {
                    pushItemId(parsed);
                }
            }
            return out;
        },

        resolveItemIdFromCandidates(candidates = []) {
            return this.collectItemIdCandidatesFromSources(candidates, 1)[0] || '';
        },

        collectCampaignRefsFromNode(node, out, meta = {}) {
            const depth = Number(meta.depth || 0);
            const seen = meta.seen instanceof WeakSet ? meta.seen : new WeakSet();
            const bizHint = this.normalizeBizCode(meta.bizHint || '');
            const itemHint = this.normalizeItemId(meta.itemHint || '');
            if (!node || depth > 10) return;
            if (typeof node !== 'object') return;
            if (seen.has(node)) return;
            seen.add(node);

            if (Array.isArray(node)) {
                node.forEach(item => this.collectCampaignRefsFromNode(item, out, {
                    depth: depth + 1,
                    seen,
                    bizHint,
                    itemHint
                }));
                return;
            }

            const localBiz = this.normalizeBizCode(
                node.bizCode
                || node.diffBizCode
                || node.fromBizCode
                || node.targetBizCode
                || bizHint
                || ''
            );
            const localItemId = this.resolveItemIdFromCandidates([
                node.itemId,
                node.materialId,
                node.auctionId,
                node.targetItemId,
                node.targetMaterialId,
                node.item_id,
                node.material_id,
                node.itemid,
                node.materialid,
                node.lastAdgroup,
                node.material,
                node.scopeItems,
                node.itemIdList,
                node.materialIdList,
                node.whiteBoxItemIds,
                node.linkUrl,
                itemHint
            ]);
            const localStatus = node.status;
            const localOnlineStatus = node.onlineStatus ?? node.isOnline ?? node.online;
            const localDisplayStatus = node.displayStatus || node.planStatus || node.campaignStatus || '';
            const pushRef = (rawId, source) => {
                const campaignId = this.normalizeCampaignId(rawId);
                if (!campaignId) return;
                out.push({
                    campaignId,
                    bizCode: localBiz,
                    itemId: localItemId,
                    status: localStatus,
                    onlineStatus: localOnlineStatus,
                    displayStatus: localDisplayStatus,
                    source
                });
            };

            pushRef(node.campaignId, 'campaignId');
            pushRef(node.planId, 'planId');
            pushRef(node.targetCampaignId, 'targetCampaignId');
            pushRef(node.diffCampaignId, 'diffCampaignId');

            const textHints = [node.message, node.msg, node.error, node.remark]
                .map(item => String(item || '').trim())
                .filter(Boolean)
                .join(' ');
            if (textHints) {
                const scoped = textHints.match(/(?:计划|campaign(?:id)?|plan(?:id)?)[^0-9]{0,8}\d{6,}/ig) || [];
                scoped.slice(0, 12).forEach((segment) => {
                    const match = segment.match(/(\d{6,})/);
                    const campaignId = this.normalizeCampaignId(match?.[1] || '');
                    if (!campaignId) return;
                    out.push({
                        campaignId,
                        bizCode: localBiz,
                        itemId: localItemId,
                        status: localStatus,
                        onlineStatus: localOnlineStatus,
                        displayStatus: localDisplayStatus,
                        source: 'text_hint'
                    });
                });
            }

            Object.keys(node).forEach((key) => {
                const value = node[key];
                if (!value || typeof value !== 'object') return;
                this.collectCampaignRefsFromNode(value, out, {
                    depth: depth + 1,
                    seen,
                    bizHint: localBiz || bizHint,
                    itemHint: localItemId || itemHint
                });
            });
        },

        normalizeCampaignRefs(refs = []) {
            const map = new Map();
            (Array.isArray(refs) ? refs : []).forEach((item) => {
                const campaignId = this.normalizeCampaignId(item?.campaignId);
                if (!campaignId) return;
                const prev = map.get(campaignId) || {
                    campaignId,
                    bizCode: '',
                    itemId: '',
                    status: '',
                    onlineStatus: '',
                    displayStatus: '',
                    source: ''
                };
                const nextBiz = this.normalizeBizCode(item?.bizCode || '');
                const nextItemId = this.normalizeItemId(item?.itemId || '');
                if (!prev.bizCode && nextBiz) prev.bizCode = nextBiz;
                if (!prev.itemId && nextItemId) prev.itemId = nextItemId;
                if ((prev.status === '' || prev.status === undefined || prev.status === null)
                    && item?.status !== '' && item?.status !== undefined && item?.status !== null) {
                    prev.status = item.status;
                }
                if ((prev.onlineStatus === '' || prev.onlineStatus === undefined || prev.onlineStatus === null)
                    && item?.onlineStatus !== '' && item?.onlineStatus !== undefined && item?.onlineStatus !== null) {
                    prev.onlineStatus = item.onlineStatus;
                }
                if (!prev.displayStatus && item?.displayStatus) prev.displayStatus = item.displayStatus;
                if (!prev.source && item?.source) prev.source = String(item.source || '');
                map.set(campaignId, prev);
            });
            return Array.from(map.values());
        },

        extractAdgroupIdsFromCampaignPayload(payload = {}, expectedCampaignId = '') {
            const normalizedCampaignId = this.normalizeCampaignId(expectedCampaignId);
            const campaign = payload?.data?.campaign || payload?.campaign || payload?.data || {};
            const adgroupList = Array.isArray(campaign?.adgroupList) ? campaign.adgroupList : [];
            const dataAdgroupList = Array.isArray(payload?.data?.adgroupList) ? payload.data.adgroupList : [];
            const adgroupIdBuckets = [
                campaign?.adgroupIdList,
                campaign?.adgroupIds,
                payload?.data?.adgroupIdList,
                payload?.data?.adgroupIds,
                payload?.adgroupIdList,
                payload?.adgroupIds
            ];
            const candidates = [
                campaign,
                campaign?.lastAdgroup,
                ...adgroupList,
                ...dataAdgroupList,
                payload?.data?.adgroup
            ];
            const out = [];
            const pushId = (raw) => {
                const adgroupId = this.normalizeAdgroupId(raw);
                if (!adgroupId) return;
                if (out.includes(adgroupId)) return;
                out.push(adgroupId);
            };
            candidates.forEach((item) => {
                if (!item || typeof item !== 'object') return;
                const campaignId = this.normalizeCampaignId(item.campaignId || '');
                if (normalizedCampaignId && campaignId && campaignId !== normalizedCampaignId) return;
                pushId(item.adgroupId || item.groupId || item.id || '');
            });
            adgroupIdBuckets.forEach((bucket) => {
                if (Array.isArray(bucket)) {
                    bucket.forEach(pushId);
                    return;
                }
                pushId(bucket);
            });
            return out;
        },

        extractItemIdCandidatesFromCampaignPayload(payload = {}, expectedCampaignId = '') {
            const normalizedCampaignId = this.normalizeCampaignId(expectedCampaignId);
            const refs = [];
            this.collectCampaignRefsFromNode(payload, refs, {
                depth: 0,
                seen: new WeakSet()
            });
            const normalizedRefs = this.normalizeCampaignRefs(refs);
            normalizedRefs.forEach((item) => {
                this.rememberCampaignItemId(item?.campaignId, item?.itemId || '');
            });
            const out = [];
            const seen = new Set();
            const pushItem = (raw) => {
                const normalized = this.normalizeItemId(raw);
                if (!normalized || seen.has(normalized)) return;
                seen.add(normalized);
                out.push(normalized);
            };
            const campaign = payload?.data?.campaign || payload?.campaign || payload?.data || {};
            const adgroupList = Array.isArray(campaign?.adgroupList) ? campaign.adgroupList : [];
            const scopedAdgroupList = normalizedCampaignId
                ? adgroupList.filter((item) => {
                    const campaignId = this.normalizeCampaignId(item?.campaignId || '');
                    return !campaignId || campaignId === normalizedCampaignId;
                })
                : adgroupList;
            this.collectItemIdCandidatesFromSources([
                campaign?.itemId,
                campaign?.materialId,
                campaign?.auctionId,
                campaign?.targetItemId,
                campaign?.targetMaterialId,
                campaign?.lastAdgroup,
                scopedAdgroupList,
                payload?.data?.adgroup,
                payload?.data?.adgroupList,
                campaign?.material,
                campaign?.itemIdList,
                campaign?.materialIdList,
                campaign?.whiteBoxItemIds,
                campaign?.scopeItems,
                campaign?.materialList
            ], 36).forEach(pushItem);
            if (normalizedCampaignId) {
                normalizedRefs
                    .filter(item => this.normalizeCampaignId(item?.campaignId) === normalizedCampaignId)
                    .forEach(item => pushItem(item?.itemId || ''));
            }
            if (normalizedCampaignId && out.length) {
                this.rememberCampaignItemIdCandidates(normalizedCampaignId, out, {
                    prepend: true,
                    maxCount: 36
                });
            }
            return out;
        },

        extractWeakItemIdCandidatesFromCampaignPayload(payload = {}, expectedCampaignId = '') {
            const normalizedCampaignId = this.normalizeCampaignId(expectedCampaignId);
            const campaign = payload?.data?.campaign || payload?.campaign || payload?.data || {};
            const adgroupList = Array.isArray(campaign?.adgroupList) ? campaign.adgroupList : [];
            const scopedAdgroupList = normalizedCampaignId
                ? adgroupList.filter((item) => {
                    const campaignId = this.normalizeCampaignId(item?.campaignId || '');
                    return !campaignId || campaignId === normalizedCampaignId;
                })
                : adgroupList;
            const pickSimilarItemBuckets = (preferences) => {
                if (!Array.isArray(preferences)) return [];
                return preferences.map(item => item?.similarItemIds);
            };
            const weakBuckets = [
                campaign?.whiteBoxItemIds,
                pickSimilarItemBuckets(campaign?.boxPreferences),
                pickSimilarItemBuckets(campaign?.blackBoxPreferences),
                ...scopedAdgroupList.map(item => item?.whiteBoxItemIds),
                ...scopedAdgroupList.map(item => pickSimilarItemBuckets(item?.boxPreferences)),
                ...scopedAdgroupList.map(item => pickSimilarItemBuckets(item?.blackBoxPreferences)),
                payload?.data?.adgroup?.whiteBoxItemIds,
                pickSimilarItemBuckets(payload?.data?.adgroup?.boxPreferences),
                pickSimilarItemBuckets(payload?.data?.adgroup?.blackBoxPreferences)
            ];
            return this.collectItemIdCandidatesFromSources(weakBuckets, 48);
        },

        extractItemIdFromCampaignPayload(payload = {}, expectedCampaignId = '') {
            const candidates = this.extractItemIdCandidatesFromCampaignPayload(payload, expectedCampaignId);
            return this.normalizeItemId(candidates[0] || '');
        },

        parseAuthFromObject(source, depth = 0, visited = new WeakSet()) {
            const out = { csrfId: '', loginPointId: '', bizCode: '' };
            if (!source || typeof source !== 'object' || depth > 4) return out;
            if (visited.has(source)) return out;
            visited.add(source);

            Object.keys(source).slice(0, 120).forEach((key) => {
                const value = source[key];
                const lower = String(key || '').toLowerCase();
                if (lower === 'csrfid' || lower === 'csrf') {
                    if (!out.csrfId) out.csrfId = String(value || '').trim();
                    return;
                }
                if (lower === 'loginpointid') {
                    if (!out.loginPointId) out.loginPointId = String(value || '').trim();
                    return;
                }
                if (lower === 'bizcode') {
                    if (!out.bizCode) out.bizCode = this.normalizeBizCode(value);
                    return;
                }
                if (value && typeof value === 'object') {
                    const child = this.parseAuthFromObject(value, depth + 1, visited);
                    if (!out.csrfId && child.csrfId) out.csrfId = child.csrfId;
                    if (!out.loginPointId && child.loginPointId) out.loginPointId = child.loginPointId;
                    if (!out.bizCode && child.bizCode) out.bizCode = child.bizCode;
                }
            });
            return out;
        },

        parseAuthFromBody(body) {
            const out = { csrfId: '', loginPointId: '', bizCode: '' };
            if (body === undefined || body === null) return out;
            if (typeof body === 'string') {
                const text = body.trim();
                if (!text) return out;
                const parsed = safeParseJSON(text);
                if (parsed && typeof parsed === 'object') return this.parseAuthFromObject(parsed);
                try {
                    const params = new URLSearchParams(text);
                    out.csrfId = String(params.get('csrfId') || params.get('csrfID') || '').trim();
                    out.loginPointId = String(params.get('loginPointId') || '').trim();
                    out.bizCode = this.normalizeBizCode(params.get('bizCode') || '');
                } catch { }
                return out;
            }
            if (body instanceof URLSearchParams) {
                out.csrfId = String(body.get('csrfId') || body.get('csrfID') || '').trim();
                out.loginPointId = String(body.get('loginPointId') || '').trim();
                out.bizCode = this.normalizeBizCode(body.get('bizCode') || '');
                return out;
            }
            if (typeof FormData !== 'undefined' && body instanceof FormData) {
                out.csrfId = String(body.get('csrfId') || body.get('csrfID') || '').trim();
                out.loginPointId = String(body.get('loginPointId') || '').trim();
                out.bizCode = this.normalizeBizCode(body.get('bizCode') || '');
                return out;
            }
            if (typeof body === 'object') {
                return this.parseAuthFromObject(body);
            }
            return out;
        },

        parseAuthFromUrl(rawUrl) {
            const out = { csrfId: '', loginPointId: '', bizCode: '' };
            const text = String(rawUrl || '').trim();
            if (!text) return out;
            try {
                const parsed = new URL(text, window.location.origin);
                out.csrfId = String(parsed.searchParams.get('csrfId') || parsed.searchParams.get('csrfID') || '').trim();
                out.loginPointId = String(parsed.searchParams.get('loginPointId') || '').trim();
                out.bizCode = this.normalizeBizCode(parsed.searchParams.get('bizCode') || '');
            } catch { }
            return out;
        },

        getCsrfScore(csrf) {
            const value = String(csrf || '').trim();
            if (!value) return -1;
            let score = Math.min(80, value.length);
            if (value.includes('_')) score += 30;
            if (!/^\d+$/.test(value)) score += 20;
            if (value.length >= 16) score += 10;
            return score;
        },

        pickCsrf(current, next) {
            const currentText = String(current || '').trim();
            const nextText = String(next || '').trim();
            if (!currentText) return nextText;
            if (!nextText) return currentText;
            return this.getCsrfScore(nextText) >= this.getCsrfScore(currentText) ? nextText : currentText;
        },

        resolveAuthContext(preferredBizCode = '') {
            const auth = {
                csrfId: '',
                loginPointId: '',
                bizCode: this.normalizeBizCode(preferredBizCode) || ''
            };
            const applyAuth = (entry) => {
                if (!entry || typeof entry !== 'object') return;
                auth.csrfId = this.pickCsrf(auth.csrfId, entry.csrfId);
                if (!auth.loginPointId && entry.loginPointId) auth.loginPointId = String(entry.loginPointId || '').trim();
                if (!auth.bizCode && entry.bizCode) auth.bizCode = this.normalizeBizCode(entry.bizCode);
            };

            applyAuth(this.parseAuthFromUrl(window.location.href));
            applyAuth(this.parseAuthFromUrl(window.location.hash));
            applyAuth(this.parseAuthFromBody(window.location.hash.includes('?') ? window.location.hash.split('?')[1] : ''));

            [
                (typeof globalThis !== 'undefined' ? globalThis.__AM_TOKENS__ : null),
                window.g_config,
                window.PageConfig,
                window.mm,
                window.FEED_CONFIG,
                window.__magix_data__
            ].forEach(source => applyAuth(this.parseAuthFromObject(source)));

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
            if (!managers.length) {
                try { pushManager(createHookManager()); } catch { }
            }

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
            history.sort((left, right) => Number(right?.ts || 0) - Number(left?.ts || 0));
            for (let i = 0; i < history.length; i++) {
                const entry = history[i] || {};
                applyAuth(this.parseAuthFromUrl(entry.url));
                applyAuth(this.parseAuthFromBody(entry.body));
                if (auth.csrfId && auth.loginPointId && auth.bizCode) break;
            }

            if (!auth.csrfId) {
                const cookieMatch = document.cookie.match(/_tb_token_=([^;]+)/);
                if (cookieMatch && cookieMatch[1]) {
                    auth.csrfId = this.pickCsrf(auth.csrfId, decodeURIComponent(cookieMatch[1]));
                }
            }
            if (!auth.bizCode) auth.bizCode = this.DEFAULT_BIZ_CODE;
            if (!auth.csrfId || !auth.loginPointId) {
                throw new Error('Token 未就绪，请先在页面手动点击一次计划开关后重试');
            }
            return auth;
        },

        isResponseOk(res) {
            if (!res || typeof res !== 'object') return false;
            if (res.success === false || res.ok === false) return false;
            if (res.info && res.info.ok === false) return false;
            if (res.info && res.info.errorCode) return false;
            if (Array.isArray(res.ret) && res.ret.length) {
                const retTokens = res.ret.map(item => String(item || '').trim()).filter(Boolean);
                const hasRetFail = retTokens.some(token => /^FAIL[_:]/i.test(token));
                const hasRetSuccess = retTokens.some(token => /^SUCCESS(?:$|[:_])/i.test(token) || token.includes('调用成功'));
                if (hasRetFail && !hasRetSuccess) return false;
            }
            return true;
        },

        pickResponseMessage(res, fallbackMessage = '') {
            const retText = Array.isArray(res?.ret) ? res.ret.map(item => String(item || '').trim()).filter(Boolean).join(' | ') : '';
            const punishUrl = String(res?.data?.url || '').trim();
            if (punishUrl.includes('/_____tmd_____/punish')) {
                return '触发风控验证，请先在页面完成人机验证后重试';
            }
            return String(
                res?.info?.message
                || res?.message
                || res?.msg
                || retText
                || fallbackMessage
                || '请求失败'
            ).trim();
        },

        async queryCampaignDetail(campaignId, bizCode, authContext) {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) return { itemId: '', adgroupIds: [] };
            const targetBizCode = this.normalizeBizCode(bizCode) || authContext?.bizCode || this.DEFAULT_BIZ_CODE;
            const url = OneApiTransport.buildOneUrl('/campaign/get.json', {
                csrfId: String(authContext?.csrfId || ''),
                bizCode: targetBizCode
            });
            const payload = {
                bizCode: targetBizCode,
                campaignId: id,
                csrfId: String(authContext?.csrfId || ''),
                loginPointId: String(authContext?.loginPointId || '')
            };
            const json = await OneApiTransport.postJson(url, payload, {
                actionName: '查询计划详情失败',
                businessErrorMessage: '查询计划详情失败'
            });
            const itemIdCandidates = this.extractItemIdCandidatesFromCampaignPayload(json, id);
            const itemId = this.normalizeItemId(itemIdCandidates[0] || '');
            const weakItemIdCandidates = this.extractWeakItemIdCandidatesFromCampaignPayload(json, id);
            const adgroupIds = this.extractAdgroupIdsFromCampaignPayload(json, id);
            if (itemIdCandidates.length) {
                this.rememberCampaignItemIdCandidates(id, itemIdCandidates, {
                    prepend: true,
                    maxCount: 36
                });
            }
            if (itemId) this.rememberCampaignItemId(id, itemId);
            return { itemId, itemIdCandidates, weakItemIdCandidates, adgroupIds, response: json };
        },

        async queryAdgroupDetail(campaignId, adgroupId, bizCode, authContext) {
            const normalizedCampaignId = this.normalizeCampaignId(campaignId);
            const normalizedAdgroupId = this.normalizeAdgroupId(adgroupId);
            if (!normalizedCampaignId || !normalizedAdgroupId) return { itemId: '' };
            const targetBizCode = this.normalizeBizCode(bizCode) || authContext?.bizCode || this.DEFAULT_BIZ_CODE;
            const url = OneApiTransport.buildOneUrl('/adgroup/get.json', {
                csrfId: String(authContext?.csrfId || ''),
                bizCode: targetBizCode
            });
            const payload = {
                bizCode: targetBizCode,
                campaignId: normalizedCampaignId,
                adgroupId: normalizedAdgroupId,
                csrfId: String(authContext?.csrfId || ''),
                loginPointId: String(authContext?.loginPointId || '')
            };
            const json = await OneApiTransport.postJson(url, payload, {
                actionName: '查询单元详情失败',
                businessErrorMessage: '查询单元详情失败'
            });
            const itemIdCandidates = this.extractItemIdCandidatesFromCampaignPayload(json, normalizedCampaignId);
            const fallbackCandidates = this.collectItemIdCandidatesFromSources([
                json?.data?.adgroup,
                json?.data?.adgroup?.material,
                json?.data?.adgroup?.material?.linkUrl
            ], 12);
            const mergedCandidates = [];
            const seen = new Set();
            [...itemIdCandidates, ...fallbackCandidates].forEach((raw) => {
                const normalized = this.normalizeItemId(raw);
                if (!normalized || seen.has(normalized)) return;
                seen.add(normalized);
                mergedCandidates.push(normalized);
            });
            const itemId = this.normalizeItemId(mergedCandidates[0] || '');
            if (mergedCandidates.length) {
                this.rememberCampaignItemIdCandidates(normalizedCampaignId, mergedCandidates, {
                    prepend: true,
                    maxCount: 24
                });
            }
            if (itemId) this.rememberCampaignItemId(normalizedCampaignId, itemId);
            return { itemId, itemIdCandidates: mergedCandidates, response: json };
        },

        async findConflictRefs(campaignId, bizCode, authContext, itemId = '', options = {}) {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) return [];
            const targetBizCode = this.normalizeBizCode(bizCode) || authContext?.bizCode || this.DEFAULT_BIZ_CODE;
            const normalizedItemId = this.normalizeItemId(itemId);
            const allowCacheHint = options?.allowCacheHint !== false;
            const cachedItemHint = allowCacheHint ? this.getCampaignItemId(id) : '';
            const numericCampaignId = Number(id);
            const url = OneApiTransport.buildOneUrl('/campaign/diff/findList.json', {
                csrfId: String(authContext?.csrfId || ''),
                bizCode: targetBizCode
            });
            const payload = {
                bizCode: targetBizCode,
                source: 'campaign',
                campaignIdList: [numericCampaignId],
                campaignList: [{
                    campaignId: numericCampaignId
                }],
                csrfId: String(authContext?.csrfId || ''),
                loginPointId: String(authContext?.loginPointId || '')
            };
            if (normalizedItemId) {
                payload.campaignList[0].itemSelectedMode = 'user_define';
                payload.campaignList[0].materialIdList = [Number(normalizedItemId)];
            }
            const json = await OneApiTransport.postJson(url, payload, {
                actionName: '查询冲突计划失败',
                businessErrorMessage: '查询冲突计划失败'
            });
            const refs = [];
            this.collectCampaignRefsFromNode(json, refs, {
                depth: 0,
                seen: new WeakSet(),
                bizHint: targetBizCode,
                itemHint: normalizedItemId || cachedItemHint
            });
            refs.push({
                campaignId: id,
                itemId: normalizedItemId || cachedItemHint || '',
                bizCode: targetBizCode,
                status: '',
                onlineStatus: '',
                displayStatus: '',
                source: 'seed'
            });
            const normalizedRefs = this.normalizeCampaignRefs(refs);
            normalizedRefs.forEach((item) => {
                this.rememberCampaignItemId(item?.campaignId, item?.itemId || '');
            });
            this.rememberCampaignItemIdCandidates(
                id,
                normalizedRefs
                    .filter(item => this.normalizeCampaignId(item?.campaignId) === id)
                    .map(item => item?.itemId || ''),
                {
                    prepend: true,
                    maxCount: 24
                }
            );
            return normalizedRefs;
        },

        async resolveItemIdByCampaignId(campaignId, bizCandidates, authContext, fallbackItemId = '', traceMessages = null, options = {}) {
            const normalizedCampaignId = this.normalizeCampaignId(campaignId);
            if (!normalizedCampaignId) return '';
            const preferCache = options?.preferCache !== false;
            const pushTrace = (message) => {
                if (!Array.isArray(traceMessages)) return;
                const text = String(message || '').trim();
                if (!text) return;
                traceMessages.push(text);
            };
            const fallback = this.normalizeItemId(fallbackItemId);
            const cached = this.getCampaignItemId(normalizedCampaignId);
            const rememberCandidatePool = (candidates = [], sourceLabel = '') => {
                const list = this.rememberCampaignItemIdCandidates(normalizedCampaignId, candidates, {
                    prepend: true,
                    maxCount: 36
                });
                if (!Array.isArray(list) || !list.length) return;
                if (sourceLabel) {
                    pushTrace(`商品ID识别：${sourceLabel} 候选 ${list.slice(0, 6).join(' / ')}`);
                }
            };
            rememberCandidatePool(this.getCampaignItemIdCandidates(normalizedCampaignId));
            if (cached && preferCache) {
                pushTrace(`商品ID识别：命中缓存 ${cached}`);
                return cached;
            }
            const bizList = [];
            const pushBizCode = (value) => {
                const bizCode = this.normalizeBizCode(value);
                if (!bizCode) return;
                if (bizList.includes(bizCode)) return;
                bizList.push(bizCode);
            };
            (Array.isArray(bizCandidates) ? bizCandidates : []).forEach(pushBizCode);
            this.BIZ_CODE_LIST.forEach(pushBizCode);

            for (let i = 0; i < bizList.length; i++) {
                const currentBiz = bizList[i];
                try {
                    const refs = await this.findConflictRefs(normalizedCampaignId, currentBiz, authContext, '', {
                        allowCacheHint: preferCache
                    });
                    const selfRefs = (Array.isArray(refs) ? refs : [])
                        .filter(item => this.normalizeCampaignId(item?.campaignId) === normalizedCampaignId);
                    rememberCandidatePool(selfRefs.map(item => item?.itemId || ''), `冲突接口（${currentBiz}）`);
                    const selfRef = (Array.isArray(refs) ? refs : []).find(item => this.normalizeCampaignId(item?.campaignId) === normalizedCampaignId);
                    const resolved = this.normalizeItemId(selfRef?.itemId || '');
                    if (resolved) {
                        this.rememberCampaignItemId(normalizedCampaignId, resolved);
                        pushTrace(`商品ID识别：冲突接口命中 ${resolved}（${currentBiz}）`);
                        return resolved;
                    }
                } catch (err) {
                    pushTrace(`商品ID识别：冲突接口失败（${currentBiz}）${err?.message ? `：${String(err.message).slice(0, 80)}` : ''}`);
                }
                try {
                    const detail = await this.queryCampaignDetail(normalizedCampaignId, currentBiz, authContext);
                    rememberCandidatePool(detail?.itemIdCandidates || [], `计划详情（${currentBiz}）`);
                    const resolvedByCampaign = this.normalizeItemId(detail?.itemId || '');
                    const weakCandidateSet = new Set(Array.isArray(detail?.weakItemIdCandidates) ? detail.weakItemIdCandidates : []);
                    const resolvedByCampaignIsWeak = !!resolvedByCampaign && weakCandidateSet.has(resolvedByCampaign);
                    if (resolvedByCampaign && !resolvedByCampaignIsWeak) {
                        this.rememberCampaignItemId(normalizedCampaignId, resolvedByCampaign);
                        pushTrace(`商品ID识别：计划详情命中 ${resolvedByCampaign}（${currentBiz}）`);
                        return resolvedByCampaign;
                    }
                    if (resolvedByCampaign && resolvedByCampaignIsWeak) {
                        pushTrace(`商品ID识别：计划详情命中白名单候选 ${resolvedByCampaign}（${currentBiz}），继续查单元详情校准`);
                    }
                    const adgroupIds = Array.isArray(detail?.adgroupIds) ? detail.adgroupIds : [];
                    if (adgroupIds.length) {
                        pushTrace(`商品ID识别：计划详情返回单元 ${adgroupIds.length} 个（${currentBiz}）`);
                    }
                    for (let j = 0; j < Math.min(8, adgroupIds.length); j++) {
                        try {
                            const adgroupDetail = await this.queryAdgroupDetail(normalizedCampaignId, adgroupIds[j], currentBiz, authContext);
                            rememberCandidatePool(adgroupDetail?.itemIdCandidates || [], `单元详情（${currentBiz}/adgroup=${adgroupIds[j]}）`);
                            const resolvedByAdgroup = this.normalizeItemId(adgroupDetail?.itemId || '');
                            if (resolvedByAdgroup) {
                                this.rememberCampaignItemId(normalizedCampaignId, resolvedByAdgroup);
                                pushTrace(`商品ID识别：单元详情命中 ${resolvedByAdgroup}（${currentBiz} / adgroup=${adgroupIds[j]}）`);
                                return resolvedByAdgroup;
                            }
                        } catch (err) {
                            pushTrace(`商品ID识别：单元详情失败（${currentBiz} / adgroup=${adgroupIds[j]}）${err?.message ? `：${String(err.message).slice(0, 80)}` : ''}`);
                        }
                    }
                    if (resolvedByCampaign) {
                        this.rememberCampaignItemId(normalizedCampaignId, resolvedByCampaign);
                        pushTrace(`商品ID识别：回退计划详情候选 ${resolvedByCampaign}（${currentBiz}）`);
                        return resolvedByCampaign;
                    }
                } catch (err) {
                    pushTrace(`商品ID识别：计划详情失败（${currentBiz}）${err?.message ? `：${String(err.message).slice(0, 80)}` : ''}`);
                }
            }
            if (fallback) {
                this.rememberCampaignItemId(normalizedCampaignId, fallback);
                this.rememberCampaignItemIdCandidates(normalizedCampaignId, [fallback], {
                    prepend: true,
                    maxCount: 24
                });
                pushTrace(`商品ID识别：使用按钮透传兜底 ${fallback}`);
                return fallback;
            }
            pushTrace('商品ID识别：未识别到商品ID');
            return '';
        }
    };

    const OneApiTransport = {
        DEFAULT_HEADERS: {
            'Content-Type': 'application/json',
            Accept: '*/*',
            'X-Requested-With': 'XMLHttpRequest',
            'bx-v': '2.5.36'
        },

        buildOneUrl(path, query = {}) {
            const url = String(path || '').startsWith('http')
                ? new URL(String(path || ''), window.location.origin)
                : new URL(`https://one.alimama.com${String(path || '').trim()}`, window.location.origin);
            Object.keys(query || {}).forEach((key) => {
                const value = query[key];
                if (value === undefined || value === null || value === '') return;
                url.searchParams.set(key, String(value));
            });
            return url.toString();
        },

        async parseJsonResponse(response, options = {}) {
            const actionName = String(options.actionName || '请求失败').trim() || '请求失败';
            if (!response.ok) {
                const text = await response.text().catch(() => '');
                throw new Error(`${actionName}：HTTP ${response.status}${text ? ` ${text.slice(0, 120)}` : ''}`);
            }
            const json = await response.json().catch(() => ({}));
            if (options.validateOk !== false && !PlanIdentityUtils.isResponseOk(json)) {
                throw new Error(PlanIdentityUtils.pickResponseMessage(json, options.businessErrorMessage || actionName));
            }
            return json;
        },

        async postJson(url, body = {}, options = {}) {
            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    ...this.DEFAULT_HEADERS,
                    ...(options.headers || {})
                },
                body: JSON.stringify(body)
            });
            return this.parseJsonResponse(response, options);
        }
    };

    const MagicPromptDriver = {
        isElementNode(el) {
            return !!el && typeof el === 'object' && el.nodeType === 1;
        },

        buildPromptWordList(promptText) {
            return [{
                word: String(promptText || '').trim(),
                wordType: 'text',
                subjectId: null,
                subjectType: null,
                isTemplate: false,
                placeholder: ''
            }];
        },

        getMagixVframe(doc) {
            try {
                const view = doc?.defaultView || window;
                const cache = view?.seajs?.cache;
                if (!cache || typeof cache !== 'object') return null;
                const magixModule = Object.values(cache).find((mod) => {
                    if (!mod || typeof mod !== 'object') return false;
                    const uri = String(mod.uri || '');
                    if (!uri) return false;
                    return /mlog\/magix\.js$/.test(uri);
                });
                const Vframe = magixModule?.exports?.Vframe;
                return Vframe && typeof Vframe.get === 'function' ? Vframe : null;
            } catch {
                return null;
            }
        },

        submitPromptViaVframe(doc, inputEl, promptText) {
            const cleanPrompt = String(promptText || '').trim();
            if (!cleanPrompt) return { ok: false, reason: 'empty-prompt' };

            const Vframe = this.getMagixVframe(doc);
            if (!Vframe) return { ok: false, reason: 'vframe-not-ready' };

            const inputId = String(inputEl?.id || '').trim();
            const inputVframeCandidates = [];
            if (inputId.endsWith('_ai_input')) {
                inputVframeCandidates.push(inputId.replace(/_ai_input$/, ''));
            }
            inputVframeCandidates.push('ai-input-magic-report_magic_input');

            let inputVframe = null;
            for (const id of inputVframeCandidates) {
                if (!id) continue;
                const candidate = Vframe.get(id);
                if (candidate && typeof candidate.invoke === 'function') {
                    inputVframe = candidate;
                    break;
                }
            }
            if (!inputVframe) return { ok: false, reason: 'vframe-input-missing' };

            try {
                const wordList = this.buildPromptWordList(cleanPrompt);
                inputVframe.invoke('setData', [wordList, false]);
                const searchResult = inputVframe.invoke('search');
                if (searchResult && searchResult.isEmpty) {
                    return { ok: false, reason: 'vframe-empty-question' };
                }
                return { ok: true, method: 'vframe-search' };
            } catch {
                return { ok: false, reason: 'vframe-submit-failed' };
            }
        },

        isEditablePromptElement(el) {
            if (!this.isElementNode(el)) return false;
            const view = el.ownerDocument?.defaultView || window;
            if (view.HTMLTextAreaElement && el instanceof view.HTMLTextAreaElement) {
                return !el.disabled && !el.readOnly;
            }
            if (view.HTMLInputElement && el instanceof view.HTMLInputElement) {
                const t = (el.type || 'text').toLowerCase();
                return !el.disabled && !el.readOnly && (t === 'text' || t === 'search' || t === 'url');
            }
            return !!el.isContentEditable;
        },

        isVisibleElement(el) {
            if (!this.isElementNode(el)) return false;
            const style = el.ownerDocument?.defaultView?.getComputedStyle(el);
            if (!style) return true;
            if (style.display === 'none' || style.visibility === 'hidden') return false;
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
        },

        findPromptInput(rootDoc) {
            const doc = rootDoc && typeof rootDoc.querySelector === 'function' ? rootDoc : null;
            if (!doc) return null;
            const selectors = [
                '#ai-input-magic-report textarea',
                '#ai-input-magic-report input[type="text"]',
                '#ai-input-magic-report input[type="search"]',
                '#ai-input-magic-report [contenteditable="true"]',
                'textarea#ai-input-magic-report',
                'input#ai-input-magic-report[type="text"]',
                'input#ai-input-magic-report[type="search"]',
                '[id="ai-input-magic-report"][contenteditable="true"]'
            ];

            for (const selector of selectors) {
                const el = doc.querySelector(selector);
                if (this.isEditablePromptElement(el)) return el;
            }

            const fallback = Array.from(doc.querySelectorAll('textarea, input[type="text"], input[type="search"], [contenteditable="true"]'))
                .find(el => {
                    const id = (el.id || '').toLowerCase();
                    const cls = (el.className || '').toLowerCase();
                    const placeholder = (el.getAttribute('placeholder') || '').toLowerCase();
                    const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
                    return (id.includes('magic') || cls.includes('magic') || placeholder.includes('提问') || placeholder.includes('输入') || ariaLabel.includes('输入'))
                        && this.isEditablePromptElement(el)
                        && this.isVisibleElement(el);
                });
            if (fallback) return fallback;

            return Array.from(doc.querySelectorAll('textarea, input[type="text"], input[type="search"], [contenteditable="true"]'))
                .find(el => this.isEditablePromptElement(el) && this.isVisibleElement(el)) || null;
        },

        setPromptInputValue(inputEl, promptText) {
            if (!this.isEditablePromptElement(inputEl)) return false;

            inputEl.focus();
            if (inputEl.isContentEditable) {
                inputEl.textContent = '';
                inputEl.textContent = promptText;
                inputEl.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: promptText }));
                inputEl.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }

            const view = inputEl.ownerDocument?.defaultView || window;
            const proto = (view.HTMLTextAreaElement && inputEl instanceof view.HTMLTextAreaElement)
                ? view.HTMLTextAreaElement.prototype
                : view.HTMLInputElement?.prototype;
            const valueSetter = proto ? Object.getOwnPropertyDescriptor(proto, 'value')?.set : null;
            if (valueSetter) {
                valueSetter.call(inputEl, promptText);
            } else {
                inputEl.value = promptText;
            }

            inputEl.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: promptText }));
            inputEl.dispatchEvent(new Event('change', { bubbles: true }));
            return (inputEl.value || '').trim() === promptText.trim();
        },

        triggerClick(el) {
            if (!this.isElementNode(el)) return;
            const mouseOpts = { bubbles: true, cancelable: true };
            ['mousedown', 'mouseup', 'click'].forEach(type => {
                try {
                    el.dispatchEvent(new MouseEvent(type, mouseOpts));
                } catch {
                    try {
                        el.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
                    } catch { }
                }
            });
            if (typeof el.click === 'function') el.click();
        },

        scoreQueryTrigger(el, inputEl) {
            const text = (el.textContent || '').trim();
            const title = (el.getAttribute('title') || '').trim();
            const aria = (el.getAttribute('aria-label') || '').trim();
            const mx = (el.getAttribute('mx-click') || '').trim();
            const cls = (el.className || '').toString();
            const id = (el.id || '').trim();
            const merged = `${text} ${title} ${aria} ${mx} ${cls} ${id} `;
            let score = 0;

            if (text === '查询' || text === '发送' || text === '提问' || text === '立即查询') score += 100;
            if (text.includes('查询')) score += 90;
            if (text.includes('发送') || text.includes('提问')) score += 80;
            if (/query|search|send|submit/i.test(merged)) score += 40;
            if (text.includes('一键查数')) score += 220;
            else if (text.includes('查数')) score += 150;
            if (/查数|一键查数/.test(`${title} ${aria}`)) score += 150;
            if (/magic[_-]?report|ai[_-]?report|magix-ports|report/i.test(merged)) score += 45;
            if (/next-btn-primary/.test(cls)) score += 15;
            if (inputEl && el.closest('#ai-input-magic-report')) score += 220;
            if (inputEl?.form && el.closest('form') === inputEl.form) score += 20;
            if (this.isElementNode(inputEl)) {
                const inputRect = inputEl.getBoundingClientRect();
                const targetRect = el.getBoundingClientRect();
                const dx = (targetRect.left + targetRect.width / 2) - (inputRect.left + inputRect.width / 2);
                const dy = (targetRect.top + targetRect.height / 2) - (inputRect.top + inputRect.height / 2);
                const distance = Math.hypot(dx, dy);
                if (distance < 130) score += 80;
                else if (distance < 260) score += 40;
            }
            if (el.tagName === 'BUTTON') score += 8;
            return score;
        },

        findQueryTrigger(rootDoc, inputEl) {
            const doc = rootDoc && typeof rootDoc.querySelector === 'function' ? rootDoc : null;
            if (!doc) return null;
            const roots = [];
            let nearest = inputEl?.closest?.('#ai-input-magic-report, [id*="magic-report"], [class*="magic-report"], [id*="magic"], [class*="magic"], [class*="query"], [class*="report"], form');
            if (nearest === inputEl && inputEl?.parentElement) nearest = inputEl.parentElement;
            if (nearest) roots.push(nearest);
            roots.push(doc);

            const triggerSelectors = [
                'button[type="submit"]',
                'button[mx-click*="query"]',
                'button[mx-click*="search"]',
                'button[mx-click*="send"]',
                'button[mx-click*="report"]',
                '[role="button"][mx-click*="query"]',
                '[role="button"][mx-click*="search"]',
                '[role="button"][mx-click*="send"]',
                '[role="button"][mx-click*="report"]',
                '[mx-click*="query"]',
                '[mx-click*="search"]',
                '[mx-click*="send"]',
                '[mx-click*="report"]',
                'button[class*="query"]',
                'button[class*="search"]',
                'button[class*="send"]',
                'button[class*="report"]',
                '[id*="input_btn"]',
                '[aria-label*="查数"]',
                '[title*="查数"]',
                '.next-btn-primary',
                '.next-btn'
            ];

            const seen = new Set();
            const candidates = [];
            roots.forEach(root => {
                triggerSelectors.forEach(selector => {
                    root.querySelectorAll(selector).forEach(el => {
                        if (seen.has(el) || !this.isVisibleElement(el)) return;
                        if (el.hasAttribute('disabled')) return;
                        if (el.getAttribute('aria-disabled') === 'true') return;
                        seen.add(el);
                        candidates.push(el);
                    });
                });
            });
            if (!candidates.length && nearest) {
                nearest.querySelectorAll('button, [role="button"], [mx-click], [tabindex]').forEach(el => {
                    if (seen.has(el) || !this.isVisibleElement(el)) return;
                    if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return;
                    const text = `${(el.textContent || '').trim()} ${(el.getAttribute('title') || '').trim()} ${(el.getAttribute('aria-label') || '').trim()} ${(el.getAttribute('mx-click') || '').trim()}`;
                    if (!/查数|查询|search|query|submit|send|report/i.test(text)) return;
                    seen.add(el);
                    candidates.push(el);
                });
            }
            if (!candidates.length) return null;

            return candidates
                .map(el => ({ el, score: this.scoreQueryTrigger(el, inputEl) }))
                .sort((a, b) => b.score - a.score)[0]?.el || null;
        },

        trySubmitPromptInDocument(doc, promptText) {
            if (!doc || typeof doc.querySelector !== 'function') {
                return { ok: false, reason: 'doc-not-ready' };
            }

            const inputEl = this.findPromptInput(doc);
            if (!inputEl) return { ok: false, reason: 'input-not-found' };

            const vframeResult = this.submitPromptViaVframe(doc, inputEl, promptText);
            if (vframeResult.ok) return vframeResult;

            if (!this.setPromptInputValue(inputEl, promptText)) {
                return { ok: false, reason: 'input-set-failed' };
            }

            const trigger = this.findQueryTrigger(doc, inputEl);
            if (trigger && typeof trigger.click === 'function') {
                this.triggerClick(trigger);
                return { ok: true, method: 'button' };
            }

            if (inputEl.form && typeof inputEl.form.requestSubmit === 'function') {
                inputEl.form.requestSubmit();
                return { ok: true, method: 'form-submit' };
            }

            const eventView = doc.defaultView || window;
            const keyOptions = { key: 'Enter', code: 'Enter', which: 13, keyCode: 13, bubbles: true, cancelable: true, view: eventView };
            inputEl.dispatchEvent(new KeyboardEvent('keydown', keyOptions));
            inputEl.dispatchEvent(new KeyboardEvent('keypress', keyOptions));
            inputEl.dispatchEvent(new KeyboardEvent('keyup', keyOptions));
            return { ok: true, method: 'enter-fallback', uncertain: true };
        },

        scoreNativeEntry(el) {
            const text = (el.textContent || '').trim();
            const title = (el.getAttribute('title') || '').trim();
            const aria = (el.getAttribute('aria-label') || '').trim();
            const mx = (el.getAttribute('mx-click') || '').trim();
            const cls = (el.className || '').toString();
            const idText = (el.id || '').trim();
            const merged = `${text} ${title} ${aria} ${mx} ${cls} ${idText}`.toLowerCase();

            let score = 0;
            if (merged.includes('万象查数')) score += 400;
            else if (merged.includes('万能查数')) score += 300;
            else if (merged.includes('全能数据查')) score += 200;
            else if (merged.includes('查数')) score += 120;
            else return -1;

            if (merged.includes('万象')) score += 40;
            if (merged.includes('report')) score += 10;
            if (el.tagName === 'BUTTON') score += 6;
            if (merged.includes('ai')) score += 4;
            return score;
        },

        pickNativeEntry(rootDoc = document, options = {}) {
            const doc = rootDoc && typeof rootDoc.querySelectorAll === 'function' ? rootDoc : document;
            const ignoredSelector = String(options.ignoredSelector || '').trim();
            const selectors = ['button', 'a', '[role="button"]', '[mx-click]'];
            const nodes = doc.querySelectorAll(selectors.join(','));
            const candidates = [];
            const seen = new Set();

            nodes.forEach(el => {
                if (!this.isElementNode(el) || seen.has(el)) return;
                if (ignoredSelector && el.closest(ignoredSelector)) return;
                if (!this.isVisibleElement(el)) return;
                if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return;
                const score = this.scoreNativeEntry(el);
                if (score < 0) return;
                seen.add(el);
                candidates.push({ el, score });
            });

            return candidates.sort((a, b) => b.score - a.score)[0]?.el || null;
        },

        async openNativeAndSubmit(campaignId, promptText, options = {}) {
            const id = String(campaignId || '').trim();
            if (!/^\d{6,}$/.test(id)) return false;

            const entry = this.pickNativeEntry(document, {
                ignoredSelector: '#am-helper-panel, #am-magic-report-popup, #alimama-escort-helper-ui, #am-report-capture-panel'
            });
            if (!entry) return false;

            this.triggerClick(entry);

            const maxAttempts = Math.max(1, Number(options.maxAttempts || 12) || 12);
            const retryDelay = Math.max(50, Number(options.retryDelayMs || 350) || 350);
            for (let i = 0; i < maxAttempts; i++) {
                const result = this.trySubmitPromptInDocument(document, promptText);
                if (result.ok) return true;
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }

            return false;
        }
    };

    const resolveKeywordPlanApiAccessor = () => {
        try {
            if (KeywordPlanApi && typeof KeywordPlanApi.openWizard === 'function') {
                return KeywordPlanApi;
            }
        } catch { }
        try {
            const fromWindow = window.__AM_WXT_KEYWORD_API__;
            if (fromWindow && typeof fromWindow.openWizard === 'function') {
                return fromWindow;
            }
        } catch { }
        try {
            const fromGlobal = globalThis.__AM_WXT_KEYWORD_API__;
            if (fromGlobal && typeof fromGlobal.openWizard === 'function') {
                return fromGlobal;
            }
        } catch { }
        return null;
    };

    const State = {
        config: loadConfig(),
        riskAlertLastUrl: '',
        save() {
            localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(this.config));
        }
    };

    const RISK_CHALLENGE_URL_RE = /\/_____tmd_____\/punish/i;
    const RISK_CHALLENGE_STEP_RE = /[?&]x5step=1(?:&|$)/i;

    const isRiskChallengePage = (url = '') => {
        const href = String(url || window.location.href || '').trim();
        if (!href) return false;
        return RISK_CHALLENGE_URL_RE.test(href) || RISK_CHALLENGE_STEP_RE.test(href);
    };

    const notifyRiskChallengeIfNeeded = (url = '') => {
        const href = String(url || window.location.href || '').trim();
        if (!isRiskChallengePage(href)) {
            State.riskAlertLastUrl = '';
            return false;
        }
        if (State.riskAlertLastUrl === href) return true;
        State.riskAlertLastUrl = href;
        Logger.warn('⚠️ 检测到阿里妈妈风控页，请手动完成人机验证后继续');
        setTimeout(() => {
            try {
                alert('检测到阿里妈妈风控页，请先手动完成人机验证（滑块/短信/扫码）后再继续操作。');
            } catch { }
        }, 0);
        return true;
    };
