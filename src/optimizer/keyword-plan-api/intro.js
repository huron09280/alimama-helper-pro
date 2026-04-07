    // ==================== 无界关键词建计划 API ====================
    const KeywordPlanApi = (() => {
        const TAG = '[KeywordPlanAPI]';
        const BUILD_VERSION = '2026-02-18 04:00';
        const SESSION_DRAFT_KEY = 'am.wxt.keyword_plan_wizard.draft';
        const SESSION_DRAFT_SCHEMA_VERSION = 3;
        const WIZARD_MAX_ITEMS = 30;
        const WORKBENCH_PAGE_SET = new Set(['home', 'editor', 'matrix', 'previewlog']);
        const MATRIX_LIMITS = {
            maxCombinations: 48,
            batchSize: 10
        };
        const MATRIX_DEFAULT_NAMING_PATTERN = '{planName}_{index}';
        const DEFAULTS = {
            bizCode: 'onebpSearch',
            promotionScene: 'promotion_scene_search_user_define',
            itemSelectedMode: 'user_define',
            subPromotionType: 'item',
            promotionType: 'item',
            bidTypeV2: 'smart_bid',
            bidTargetV2: 'conv',
            dmcType: 'day_average',
            keywordMode: 'mixed',
            useWordPackage: true,
            recommendCount: 20,
            matchScope: 4,
            keywordOnlineStatus: 1,
            chunkSize: 10,
            batchRetry: 1,
            recommendCrowdLabelIds: ['3000949', '3000950', '3000951', '3000952', '3000953', '3000980', '3000995']
        };
        const CROWD_RECOMMEND_REC_SCENE_LIST = ['bd_sys'];
        const CROWD_RECOMMEND_SEED_LABEL_IDS = ['3000495'];
        const SCENE_SYNC_DEFAULT_ITEM_ID = '682357641421';
        const REPAIR_DEFAULTS = {
            coverageMode: 'scene_goal_option_full',
            conflictPolicy: 'auto_stop_retry',
            stopScope: 'same_item_only',
            postCleanup: 'delete',
            fallbackPolicy: 'auto',
            itemId: SCENE_SYNC_DEFAULT_ITEM_ID
        };
        const SITE_SCENE_PARALLEL_SUBMIT_TIMES = 1;
        const DEFAULT_SCENE_PARALLEL_SUBMIT_TIMES = 2;
        const SERIAL_PLAN_SUBMIT_INTERVAL_MS = 1200;
        const WIZARD_FORCE_API_ONLY_SCENE_CONFIG = true;
        const API_ONLY_CREATE_OPTIONS = Object.freeze({
            syncSceneRuntime: false,
            applySceneSpec: false,
            strictSceneRuntimeMatch: false,
            conflictPolicy: 'auto_stop_retry',
            stopScope: 'same_item_only'
        });
        const SCENE_DEFAULT_PROMOTION_SCENE = {
            '货品全站推广': 'promotion_scene_site',
            '关键词推广': 'promotion_scene_search_user_define',
            '人群推广': 'promotion_scene_display_laxin',
            '内容营销': 'scene_live_room',
            '线索推广': 'leads_collection'
        };
        const SCENE_FALLBACK_BID_TARGET = {};
        const SCENE_BIDTYPE_V2_ONLY = new Set(['关键词推广', '人群推广']);
        const SCENE_BIDTYPE_V2_DEFAULT = {
            '关键词推广': 'smart_bid',
            '人群推广': 'custom_bid'
        };
        const ENDPOINTS = {
            solutionAddList: '/solution/addList.json',
            solutionBusinessAddList: '/solution/business/addList.json',
            componentFindList: '/component/' + 'findList.json',
            materialFindPage: '/material/item/findPage.json',
            bidwordSuggestDefault: '/bidword/suggest/default/list.json',
            bidwordSuggestKr: '/bidword/suggest/kr/list.json',
            wordPackageSuggestDefault: '/wordpackage/suggest/default/list.json',
            bidwordAdd: '/bidword/add.json',
            labelFindList: '/label/findList.json',
            crowdFindRecommend: '/crowd/findRecommendCrowd.json'
        };
        const runtimeCache = {
            value: null,
            ts: 0,
            magix: null,
            magixPending: null,
            nativeCrowdList: null,
            nativeCrowdTs: 0,
            nativeCrowdBizCode: '',
            nativeCrowdCustomBidTargetOptions: null,
            nativeCrowdCustomBidTargetTs: 0,
            nativeCrowdCustomBidTargetBizCode: '',
            nativeCrowdCustomBidTargetPending: null,
            nativeAdzoneList: null,
            nativeAdzoneTs: 0,
            nativeAdzoneBizCode: '',
            nativeAdzonePending: null
        };
        const componentConfigCache = {
            data: null,
            key: '',
            ts: 0
        };
        const COMPONENT_CONFIG_CACHE_TTL_MS = 10 * 60 * 1000;
        const KeywordPlanCoreUtils = {};
        const KeywordPlanRuntime = {};
        const KeywordPlanSceneSpec = {};
        const KeywordPlanWizardStore = {};
        const KeywordPlanRequestBuilder = {};
        const KeywordPlanPreviewExecutor = {};
        const wizardState = {
            mounted: false,
            visible: false,
            draft: null,
            sceneProfiles: {},
            candidateSource: 'all',
            candidates: [],
            addedItems: [],
            crowdList: [],
            debugVisible: false,
            itemSplitExpanded: false,
            candidateListExpanded: false,
            strategyList: [],
            editingStrategyId: '',
            detailVisible: false,
            workbenchPage: 'home',
            previewLogLines: [],
            sceneSyncTimer: 0,
            sceneSyncInFlight: false,
            sceneSyncPendingToken: '',
            repairRunToken: 0,
            repairRunning: false,
            repairStopRequested: false,
            repairLastSummary: null,
            manualKeywordDelegatedBound: false,
            manualKeywordPanelCollapsed: true,
            keywordMetricMap: {},
            crowdCustomDefaultItemPending: null,
            els: {}
        };

        const log = {
            info: (...args) => console.log(TAG, ...args),
            warn: (...args) => console.warn(TAG, ...args),
            error: (...args) => console.error(TAG, ...args)
        };

        const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]';
        const deepClone = (value) => value === undefined ? value : JSON.parse(JSON.stringify(value));
        const toNumber = (value, fallback = 0) => {
            const num = Number(value);
            return Number.isFinite(num) ? num : fallback;
        };
        const toIdValue = (value) => {
            const n = Number(value);
            if (Number.isFinite(n) && n > 0) return n;
            const s = value === null || value === undefined ? '' : String(value).trim();
            return s;
        };
        const uniqueBy = (list, getKey) => {
            const map = new Map();
            (list || []).forEach(item => {
                const key = getKey(item);
                if (!key && key !== 0) return;
                if (!map.has(key)) map.set(key, item);
            });
            return Array.from(map.values());
        };
        const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);
        const chunk = (list, size) => {
            const out = [];
            if (!Array.isArray(list) || !list.length) return out;
            const chunkSize = Math.max(1, toNumber(size, DEFAULTS.chunkSize));
            for (let i = 0; i < list.length; i += chunkSize) {
                out.push(list.slice(i, i + chunkSize));
            }
            return out;
        };
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        const todayStamp = () => {
            const d = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
        };
        const nowStampSeconds = () => {
            const d = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
        };
        const nowDateTimeStamp = () => {
            const d = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            const datePart = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
            const timePart = `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
            return `${datePart}_${timePart}`;
        };
        const buildSceneTimePrefix = (sceneName = '') => {
            const scene = String(sceneName || '').trim() || '关键词推广';
            return `${scene}_${nowDateTimeStamp()}`;
        };
        const BUDGET_FIELDS = ['dayBudget', 'dayAverageBudget', 'totalBudget', 'futureBudget'];
        const DMC_BUDGET_FIELD_MAP = {
            normal: 'dayBudget',
            total: 'totalBudget',
            day_freeze: 'futureBudget',
            day_average: 'dayAverageBudget'
        };
        const BUDGET_FIELD_DMC_MAP = {
            dayBudget: 'normal',
            totalBudget: 'total',
            futureBudget: 'day_freeze',
            dayAverageBudget: 'day_average'
        };

        const sniffCsrfFromPerformance = () => {
            try {
                const entries = performance.getEntriesByType('resource') || [];
                for (let i = entries.length - 1; i >= 0; i--) {
                    const name = entries[i]?.name || '';
                    if (!name || !name.includes('alimama.com')) continue;
                    const match = name.match(/[?&]csrfId=([^&]+)/i) || name.match(/[?&]csrfID=([^&]+)/i);
                    if (!match || !match[1]) continue;
                    return decodeURIComponent(match[1]);
                }
            } catch { }
            return '';
        };
        const sniffAemUidFromPerformance = () => {
            try {
                const entries = performance.getEntriesByType('resource') || [];
                for (let i = entries.length - 1; i >= 0; i--) {
                    const name = entries[i]?.name || '';
                    if (!name || !name.includes('alimama.com')) continue;
                    const match = name.match(/[?&]_aem_uid=([^&]+)/i);
                    if (!match || !match[1]) continue;
                    return decodeURIComponent(match[1]);
                }
            } catch { }
            return '';
        };
        const resolveAemUid = (input = '') => {
            const direct = String(input || '').trim();
            if (direct) return direct;
            try {
                const fromLocation = new URL(window.location.href).searchParams.get('_aem_uid');
                if (fromLocation) return String(fromLocation).trim();
            } catch { }
            try {
                const hash = String(window.location.hash || '');
                const match = hash.match(/[?&]_aem_uid=([^&]+)/i);
                if (match && match[1]) return decodeURIComponent(match[1]);
            } catch { }
            const fromPerf = sniffAemUidFromPerformance();
            if (fromPerf) return fromPerf;
            return '';
        };

        const mergeDeep = (target, ...sources) => {
            const out = isPlainObject(target) ? { ...target } : {};
            sources.forEach(src => {
                if (!isPlainObject(src)) return;
                Object.keys(src).forEach(key => {
                    const srcVal = src[key];
                    const curVal = out[key];
                    if (isPlainObject(srcVal)) {
                        out[key] = mergeDeep(isPlainObject(curVal) ? curVal : {}, srcVal);
                    } else if (Array.isArray(srcVal)) {
                        out[key] = srcVal.slice();
                    } else {
                        out[key] = srcVal;
                    }
                });
            });
            return out;
        };

        const ensureTokens = () => {
            TokenManager.refresh();
            if (!TokenManager.isStrongCsrf(State.tokens.csrfID)) {
                const perfCsrf = sniffCsrfFromPerformance();
                if (perfCsrf) TokenManager.applyCsrf(perfCsrf);
            }
            const { dynamicToken, loginPointId, csrfID } = State.tokens;
            if (!loginPointId || !csrfID) {
                throw new Error('Token 未就绪，请先在页面任意位置点击一次后重试');
            }
            return { dynamicToken, loginPointId, csrfId: csrfID };
        };

        const buildOneApiUrl = (path, bizCode) => {
            const { csrfId } = ensureTokens();
            const hasQuery = path.includes('?');
            return `https://one.alimama.com${path}${hasQuery ? '&' : '?'}csrfId=${encodeURIComponent(csrfId)}&bizCode=${encodeURIComponent(bizCode)}`;
        };

        const isResponseOk = (res) => {
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
        };

        const assertResponseOk = (res, action) => {
            if (isResponseOk(res)) return;
            const retMessage = Array.isArray(res?.ret) && res.ret.length
                ? res.ret.map(item => String(item || '').trim()).filter(Boolean).join(' | ')
                : '';
            const punishUrl = String(res?.data?.url || '').trim();
            const isRiskChallenge = punishUrl.includes('/_____tmd_____/punish');
            const fallbackMessage = isRiskChallenge
                ? `${action}失败：触发风控验证，请在页面完成人机验证后重试`
                : `${action}失败`;
            const msg = res?.info?.message || res?.message || retMessage || fallbackMessage;
            throw new Error(msg);
        };

        const requestOne = async (path, bizCode, payload = {}, options = {}) => {
            const token = ensureTokens();
            const url = buildOneApiUrl(path, bizCode);
            const body = {
                ...payload,
                csrfId: token.csrfId,
                loginPointId: token.loginPointId
            };
            const res = await API.request(url, body, options);
            assertResponseOk(res, path);
            return res;
        };
        const requestOneGet = async (path, query = {}, options = {}) => {
            const token = ensureTokens();
            const mergedQuery = {
                ...query,
                csrfId: query?.csrfId || token.csrfId,
                bizCode: query?.bizCode || DEFAULTS.bizCode
            };
            const params = new URLSearchParams();
            Object.keys(mergedQuery).forEach(key => {
                const value = mergedQuery[key];
                if (value === undefined || value === null || value === '') return;
                params.set(key, String(value));
            });
            const url = `https://one.alimama.com${path}${path.includes('?') ? '&' : '?'}${params.toString()}`;
            recordApiRequestToHookHistory(url, 'GET', null, 'api_fetch_get');
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    Accept: 'application/json, text/plain, */*'
                },
                signal: options?.signal
            });
            if (!response.ok) {
                const text = await response.text().catch(() => '');
                throw new Error(`HTTP ${response.status}: ${response.statusText}${text ? ` - ${text.slice(0, 220)}` : ''}`);
            }
            const json = await response.json().catch(() => ({}));
            assertResponseOk(json, path);
            return json;
        };

        const pickMaterialFields = (material = {}) => ({
            materialId: material.materialId,
            materialName: material.materialName,
            promotionType: material.promotionType,
            subPromotionType: material.subPromotionType,
            fromTab: material.fromTab,
            linkUrl: material.linkUrl,
            goalLifeCycleList: material.goalLifeCycleList,
            shopId: material.shopId,
            shopName: material.shopName,
            bidCount: material.bidCount,
            categoryLevel1: material.categoryLevel1
        });

        const sanitizeCampaign = (campaign = {}) => {
            const out = {};
            Object.keys(campaign || {}).forEach(key => {
                if (key.startsWith('mx_')) return;
                if (key === 'adgroupList') return;
                if (key === 'couponId' && !campaign[key]) return;
                out[key] = campaign[key];
            });
            return out;
        };

        const sanitizeAdgroup = (adgroup = {}) => {
            const out = {};
            Object.keys(adgroup || {}).forEach(key => {
                if (key.startsWith('mx_')) return;
                if (key === 'material') {
                    out.material = pickMaterialFields(adgroup.material || {});
                    return;
                }
                out[key] = adgroup[key];
            });
            return out;
        };

        const purgeCreateTransientFields = (value) => {
            const dropKeys = new Set(['campaignId', 'adgroupId', 'copyCampaignId', 'copyAdgroupId', 'id', 'gmtCreate', 'gmtModified', 'createTime', 'modifyTime']);
            if (Array.isArray(value)) return value.map(v => purgeCreateTransientFields(v));
            if (!isPlainObject(value)) return value;
            const out = {};
            Object.keys(value).forEach(key => {
                if (key.startsWith('mx_')) return;
                if (dropKeys.has(key)) return;
                out[key] = purgeCreateTransientFields(value[key]);
            });
            return out;
        };

        const getMagixInstance = async () => {
            if (window.Magix?.Vframe?.all) return window.Magix;
            if (runtimeCache.magix?.Vframe?.all) return runtimeCache.magix;
            if (!window.seajs || typeof window.seajs.use !== 'function') return null;
            if (runtimeCache.magixPending) return runtimeCache.magixPending;
            runtimeCache.magixPending = new Promise(resolve => {
                try {
                    window.seajs.use(['magix'], (magixRef) => resolve(magixRef || null));
                } catch (err) {
                    log.warn('seajs 加载 magix 失败:', err?.message || err);
                    resolve(null);
                }
            }).then((magixRef) => {
                if (magixRef?.Vframe?.all) runtimeCache.magix = magixRef;
                runtimeCache.magixPending = null;
                return magixRef;
            }).catch(() => {
                runtimeCache.magixPending = null;
                return null;
            });
            return runtimeCache.magixPending;
        };

        const getAllVframes = async () => {
            const magixRef = await getMagixInstance();
            if (!magixRef?.Vframe?.all) return {};
            try {
                return magixRef.Vframe.all() || {};
            } catch (err) {
                log.warn('读取 Vframe 列表失败:', err?.message || err);
                return {};
            }
        };

        const parseRouteParamFromHash = (param = '', hash = '') => {
            const key = String(param || '').trim();
            if (!key) return '';
            const raw = String(hash || window.location.hash || '').trim();
            if (!raw) return '';
            const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const match = raw.match(new RegExp(`[?&]${escaped}=([^&#]+)`, 'i'));
            if (!match || !match[1]) return '';
            try {
                return decodeURIComponent(match[1]);
            } catch {
                return String(match[1] || '').trim();
            }
        };

        const invokeSolutionDataViaPageBridge = async (expectedBizCode = '', options = {}) => {
            const timeoutMs = Math.max(1200, toNumber(options.timeoutMs, 5800));
            const bridgeKey = `am_wxt_solution_bridge_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            const expected = String(expectedBizCode || '').trim();
            return new Promise((resolve) => {
                let settled = false;
                let timer = null;
                const cleanup = () => {
                    if (timer) {
                        clearTimeout(timer);
                        timer = null;
                    }
                    window.removeEventListener('message', onMessage);
                };
                const finalize = (payload) => {
                    if (settled) return;
                    settled = true;
                    cleanup();
                    resolve(payload || null);
                };
                const onMessage = (event) => {
                    try {
                        if (event.source !== window) return;
                    } catch { }
                    const data = event.data || {};
                    if (!data || data.__amWxtBridgeKey !== bridgeKey) return;
                    finalize(data.ok ? (data.result || null) : null);
                };
                window.addEventListener('message', onMessage);
                timer = setTimeout(() => finalize(null), timeoutMs);
                try {
                    const payload = JSON.stringify({
                        key: bridgeKey,
                        expectedBizCode: expected
                    });
                    const script = document.createElement('script');
                    script.type = 'text/javascript';
                    script.textContent = `;(() => {
                        const payload = ${payload};
                        const aliasMap = {
                            onebpSite: 'onebpSite',
                            onebpSearch: 'onebpSearch',
                            onebpDisplay: 'onebpDisplay',
                            onebpShopMarketing: 'onebpStarShop',
                            onebpStarShop: 'onebpStarShop',
                            onebpContentMarketing: 'onebpLive',
                            onebpLive: 'onebpLive',
                            onebpAdStrategyLiuZi: 'onebpAdStrategyLiuZi'
                        };
                        const normalizeBiz = (biz) => {
                            const value = String(biz || '').trim();
                            if (!value) return '';
                            return String(aliasMap[value] || value).trim();
                        };
                        const serialize = (value) => {
                            try { return JSON.parse(JSON.stringify(value)); } catch { return null; }
                        };
                        const post = (ok, result) => {
                            window.postMessage({ __amWxtBridgeKey: payload.key, ok: !!ok, result: serialize(result) }, '*');
                        };
                        const run = async () => {
                            let magixRef = window.Magix && window.Magix.Vframe && window.Magix.Vframe.all
                                ? window.Magix
                                : null;
                            if (!magixRef && window.seajs && typeof window.seajs.use === 'function') {
                                try {
                                    magixRef = await new Promise((resolve) => {
                                        window.seajs.use(['magix'], (ref) => resolve(ref || null));
                                    });
                                } catch { }
                            }
                            if (!magixRef || !magixRef.Vframe || typeof magixRef.Vframe.all !== 'function') {
                                post(true, null);
                                return;
                            }
                            const all = magixRef.Vframe.all() || {};
                            const ids = Object.keys(all || {});
                            if (!ids.length) {
                                post(true, null);
                                return;
                            }
                            const expectedBiz = normalizeBiz(payload.expectedBizCode || '');
                            const rankedIds = [
                                ...ids.filter(id => id.includes('universalBP_common_layout_main_content')),
                                ...ids.filter(id => !id.includes('universalBP_common_layout_main_content') && id.includes('main_content')),
                                ...ids.filter(id => !id.includes('main_content') && id.includes('universalBP_common_layout')),
                                ...ids.filter(id => !id.includes('universalBP_common_layout') && id.toLowerCase().includes('onebp')),
                                ...ids.filter(id => !id.toLowerCase().includes('onebp'))
                            ];
                            const tried = new Set();
                            let fallback = null;
                            for (const id of rankedIds) {
                                if (tried.has(id)) continue;
                                tried.add(id);
                                const vf = all[id];
                                if (!vf || typeof vf.invoke !== 'function') continue;
                                try {
                                    const res = await vf.invoke('getSolutionData');
                                    if (!res || !Array.isArray(res.solutionList) || !res.solutionList.length) continue;
                                    if (!expectedBiz) {
                                        post(true, res);
                                        return;
                                    }
                                    const storeBiz = normalizeBiz((res.storeData && res.storeData.bizCode) || res.bizCode || '');
                                    const matched = res.solutionList.some((solution) => (
                                        normalizeBiz((solution && solution.bizCode) || storeBiz) === expectedBiz
                                    )) || (storeBiz && storeBiz === expectedBiz);
                                    if (matched) {
                                        post(true, res);
                                        return;
                                    }
                                    if (!fallback) fallback = res;
                                } catch { }
                            }
                            if (!expectedBiz && fallback) {
                                post(true, fallback);
                                return;
                            }
                            post(true, null);
                        };
                        run().catch(() => post(false, null));
                    })();`;
                    (document.documentElement || document.head || document.body).appendChild(script);
                    script.remove();
                } catch {
                    finalize(null);
                }
            });
        };

        const invokeMainVframe = async (method, ...args) => {
            const all = await getAllVframes();
            const ids = Object.keys(all);
            if (!ids.length) return null;
            const expectedBizCode = method === 'getSolutionData'
                ? normalizeSceneBizCode(parseRouteParamFromHash('bizCode'))
                : '';

            const rankedIds = [
                ...ids.filter(id => id.includes('universalBP_common_layout_main_content')),
                ...ids.filter(id => !id.includes('universalBP_common_layout_main_content') && id.includes('main_content')),
                ...ids.filter(id => !id.includes('main_content') && id.includes('universalBP_common_layout')),
                ...ids.filter(id => !id.includes('universalBP_common_layout') && id.toLowerCase().includes('onebp')),
                ...ids.filter(id => !id.toLowerCase().includes('onebp'))
            ];

            const tried = new Set();
            let fallbackSolutionData = null;
            for (const id of rankedIds) {
                if (tried.has(id)) continue;
                tried.add(id);
                const vf = all[id];
                if (!vf || typeof vf.invoke !== 'function') continue;
                try {
                    const result = await vf.invoke(method, ...args);
                    if (method === 'getSolutionData') {
                        if (result && Array.isArray(result.solutionList) && result.solutionList.length) {
                            if (!expectedBizCode) return result;
                            const storeBizCode = normalizeSceneBizCode(result?.storeData?.bizCode || result?.bizCode || '');
                            const hasExpectedBizCode = result.solutionList.some(solution => (
                                normalizeSceneBizCode(solution?.bizCode || solution?.campaign?.bizCode || storeBizCode) === expectedBizCode
                            )) || (storeBizCode && storeBizCode === expectedBizCode);
                            if (hasExpectedBizCode) return result;
                            if (!fallbackSolutionData) fallbackSolutionData = result;
                            continue;
                        }
                        if (result !== null && result !== undefined && !expectedBizCode) {
                            return result;
                        }
                    } else if (result !== null && result !== undefined) {
                        return result;
                    }
                } catch { }
            }
            if (method === 'getSolutionData') {
                if (!expectedBizCode && fallbackSolutionData) return fallbackSolutionData;
                return null;
            }
            return null;
        };

        const readCheckedValue = (acceptedValues = []) => {
            const checked = Array.from(document.querySelectorAll('input[type="radio"]:checked'));
            const found = checked.find(el => acceptedValues.includes(el.value));
            return found ? found.value : '';
        };

        const inferRuntimeFromDom = () => {
            const routeBizCode = normalizeSceneBizCode(parseRouteParamFromHash('bizCode') || DEFAULTS.bizCode);
            const useKeywordDefaults = !routeBizCode || routeBizCode === DEFAULTS.bizCode;
            const routePromotionScene = parseRouteParamFromHash('promotionScene');
            const promotionScene = routePromotionScene || readCheckedValue([
                'promotion_scene_search_user_define',
                'promotion_scene_search_detent',
                'promotion_scene_search_trend',
                'promotion_scene_golden_traffic_card_package'
            ]) || (useKeywordDefaults ? DEFAULTS.promotionScene : '');
            const itemSelectedMode = readCheckedValue(['user_define', 'shop']) || (useKeywordDefaults ? DEFAULTS.itemSelectedMode : '');
            const bidTypeV2 = readCheckedValue(['smart_bid', 'custom_bid']) || (useKeywordDefaults ? DEFAULTS.bidTypeV2 : '');
            const dmcType = readCheckedValue(['normal', 'total', 'day_freeze', 'day_average']) || DEFAULTS.dmcType;
            const budgetInput = document.querySelector('input[placeholder*="预算"], input[aria-label*="预算"], input[title*="预算"]');
            const budgetValue = budgetInput ? toNumber(budgetInput.value, NaN) : NaN;
            const dayAverageBudget = Number.isFinite(budgetValue) && budgetValue > 0 ? budgetValue : '';
            return {
                bizCode: routeBizCode || DEFAULTS.bizCode,
                promotionScene,
                itemSelectedMode,
                bidTypeV2,
                dmcType,
                dayAverageBudget
            };
        };

