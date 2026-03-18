        const startNetworkCapture = (options = {}) => {
            const includePattern = options.includePattern instanceof RegExp ? options.includePattern : /\.json(?:$|\?)/i;
            const session = createGoalCaptureSession({ includePattern });
            const captureId = `wxt_capture_${Date.now()}_${++networkCaptureRegistry.seq}`;
            const sceneName = String(options.sceneName || inferCurrentSceneName() || '').trim();
            const startedAtTs = Date.now();
            const startedAt = new Date().toISOString();
            networkCaptureRegistry.sessions.set(captureId, {
                captureId,
                sceneName,
                startedAtTs,
                startedAt,
                includePattern: String(includePattern),
                session
            });
            return {
                ok: true,
                captureId,
                sceneName,
                startedAtTs,
                startedAt,
                includePattern: String(includePattern)
            };
        };
        const getNetworkCapture = (captureId = '', options = {}) => {
            const id = String(captureId || '').trim();
            const entry = id ? networkCaptureRegistry.sessions.get(id) : null;
            if (!entry) {
                return {
                    ok: false,
                    captureId: id,
                    error: 'captureId 不存在或已结束'
                };
            }
            const records = entry.session.sliceFrom(0);
            const contractsFromSession = summarizeGoalLoadContracts(records);
            const historySummary = options.includeHookHistory === false
                ? { contracts: [], snapshots: [] }
                : collectContractsFromHookHistory(entry.sceneName || '', {
                    includePattern: /\.json(?:$|\?)/i,
                    limit: Math.max(200, Math.min(30000, toNumber(options.historyLimit, 8000))),
                    since: Math.max(0, toNumber(entry.startedAtTs, 0))
                });
            const contracts = mergeContractSummaries(
                contractsFromSession.concat(Array.isArray(historySummary.contracts) ? historySummary.contracts : [])
            );
            const createInterfaces = summarizeCreateInterfacesFromContracts(contracts);
            const createEndpoints = uniqueBy(
                createInterfaces.map(item => `${normalizeCaptureMethod(item?.method)} ${normalizeCapturePath(item?.path || '')}`).filter(Boolean),
                item => item
            );
            const historyRecordCount = Array.isArray(historySummary.snapshots)
                ? historySummary.snapshots.reduce((sum, item) => sum + toNumber(item?.recordCount, 0), 0)
                : 0;
            return {
                ok: true,
                captureId: id,
                sceneName: entry.sceneName || '',
                startedAtTs: toNumber(entry.startedAtTs, 0),
                startedAt: entry.startedAt,
                includePattern: entry.includePattern,
                recordCount: Math.max(records.length, historyRecordCount),
                sessionRecordCount: records.length,
                hookHistoryRecordCount: historyRecordCount,
                contractCount: contracts.length,
                contracts,
                createInterfaceCount: createInterfaces.length,
                createInterfaces,
                createEndpoints,
                records: options.withRecords ? records : []
            };
        };
        const stopNetworkCapture = (captureId = '', options = {}) => {
            const snapshot = getNetworkCapture(captureId, options);
            if (!snapshot.ok) return snapshot;
            const id = String(captureId || '').trim();
            const entry = networkCaptureRegistry.sessions.get(id);
            try {
                entry?.session?.stop?.();
            } catch { }
            networkCaptureRegistry.sessions.delete(id);
            return {
                ...snapshot,
                stoppedAt: new Date().toISOString(),
                stopped: true
            };
        };
        const listNetworkCaptures = () => {
            const list = Array.from(networkCaptureRegistry.sessions.values()).map(item => ({
                captureId: item.captureId,
                sceneName: item.sceneName || '',
                startedAt: item.startedAt,
                includePattern: item.includePattern
            })).sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)));
            return {
                ok: true,
                count: list.length,
                list
            };
        };
        const stopAllNetworkCaptures = (options = {}) => {
            const ids = Array.from(networkCaptureRegistry.sessions.keys());
            const list = ids.map(id => stopNetworkCapture(id, options));
            return {
                ok: list.every(item => item?.ok),
                count: list.length,
                list
            };
        };

        const LIFECYCLE_LIST_PATH_RE = /\/(?:campaign|plan)(?:\/[^?]*)?(?:list|query|find|get)[^?]*?\.json$/i;
        const LIFECYCLE_PAUSE_PATH_RE = /\/(?:campaign|plan)(?:\/[^?]*)?(?:pause|offline|stop|suspend|updatePart|update(?:Batch)?Status|changeStatus|setStatus|onlineStatus)[^?]*?\.json$/i;
        const LIFECYCLE_DELETE_PATH_RE = /\/(?:campaign|plan)(?:\/[^?]*)?(?:delete|remove|batchDelete|del|recycle)[^?]*?\.json$/i;
        const LIFECYCLE_CONFLICT_LIST_PATH_RE = /\/campaign\/(?:horizontal\/findPage|diff\/findList|findPage|findList)\.json$/i;
        const LIFECYCLE_IGNORE_PATH_RE = /\/(?:material\/item\/findPage|bidword\/suggest|wordpackage\/suggest|label\/findList|algo\/getBudgetSuggestion|cube\/triggerDynamicModule|component\/findList)\.json$/i;

        const buildLifecycleMergedKeyText = (contract = {}) => {
            const bodyKeys = Array.isArray(contract?.bodyKeys)
                ? contract.bodyKeys
                : (Array.isArray(contract?.requestKeys) ? contract.requestKeys : []);
            const bodyKeyPaths = Array.isArray(contract?.bodyKeyPaths)
                ? contract.bodyKeyPaths
                : (Array.isArray(contract?.requestKeyPaths) ? contract.requestKeyPaths : []);
            const queryKeys = Array.isArray(contract?.queryKeys) ? contract.queryKeys : [];
            return bodyKeys
                .concat(bodyKeyPaths, queryKeys)
                .map(item => String(item || '').toLowerCase())
                .join('|');
        };

        const hasLifecycleCampaignIdHint = (keyText = '') => (
            /(campaignid|planid|targetcampaignid|campaignidlist|planidlist|entitylist\[\]\.campaignid)/.test(keyText)
        );
        const hasLifecycleItemIdHint = (keyText = '') => (
            /(itemid|materialid|auctionid|itemidlist|materialidlist)/.test(keyText)
        );
        const hasLifecycleStatusHint = (keyText = '') => (
            /(status|onlinestatus|offlinestatus|desiredstatus|pause|offline|suspend|online)/.test(keyText)
        );

        const isLifecycleContractUsable = (action = '', contract = {}) => {
            const normalizedAction = normalizeLifecycleAction(action);
            if (!normalizedAction) return false;
            const path = normalizeCapturePath(contract?.path || contract?.endpoint || '');
            if (!path) return false;
            if (LIFECYCLE_IGNORE_PATH_RE.test(path)) return false;
            if (normalizedAction === 'create') {
                return isGoalCreateSubmitPath(path);
            }

            const mergedKeyText = buildLifecycleMergedKeyText(contract);
            if (normalizedAction === 'delete') {
                return LIFECYCLE_DELETE_PATH_RE.test(path)
                    && hasLifecycleCampaignIdHint(mergedKeyText);
            }
            if (normalizedAction === 'pause') {
                return LIFECYCLE_PAUSE_PATH_RE.test(path)
                    && hasLifecycleCampaignIdHint(mergedKeyText)
                    && (
                        hasLifecycleStatusHint(mergedKeyText)
                        || /updatepart|status|online|offline|pause|suspend|stop/i.test(path)
                    );
            }
            if (normalizedAction === 'list_conflict') {
                if (LIFECYCLE_CONFLICT_LIST_PATH_RE.test(path)) return true;
                if (!LIFECYCLE_LIST_PATH_RE.test(path)) return false;
                if (!/\/campaign\//i.test(path)) return false;
                return hasLifecycleItemIdHint(mergedKeyText) || hasLifecycleCampaignIdHint(mergedKeyText);
            }
            return false;
        };

        const getFallbackLifecycleContract = (sceneName = '', action = '') => {
            const targetScene = String(sceneName || '').trim();
            const normalizedAction = normalizeLifecycleAction(action);
            if (!targetScene || !normalizedAction) return null;
            if (normalizedAction === 'pause') {
                return {
                    sceneName: targetScene,
                    action: normalizedAction,
                    method: 'POST',
                    endpoint: '/campaign/updatePart.json',
                    requestKeys: ['campaignId', 'onlineStatus'],
                    requestKeyPaths: ['campaignId', 'onlineStatus'],
                    queryKeys: [],
                    bodyKeys: ['campaignId', 'onlineStatus'],
                    bodyKeyPaths: ['campaignId', 'onlineStatus'],
                    responseShape: {},
                    sampleBody: null,
                    count: 1,
                    source: 'builtin_fallback',
                    sampledAt: new Date().toISOString()
                };
            }
            if (normalizedAction === 'delete') {
                return {
                    sceneName: targetScene,
                    action: normalizedAction,
                    method: 'POST',
                    endpoint: '/campaign/delete.json',
                    requestKeys: ['campaignIdList'],
                    requestKeyPaths: ['campaignIdList'],
                    queryKeys: [],
                    bodyKeys: ['campaignIdList'],
                    bodyKeyPaths: ['campaignIdList'],
                    responseShape: {},
                    sampleBody: null,
                    count: 1,
                    source: 'builtin_fallback',
                    sampledAt: new Date().toISOString()
                };
            }
            return null;
        };

        const inferLifecycleActionFromContract = (contract = {}, options = {}) => {
            const path = normalizeCapturePath(contract?.path || contract?.endpoint || '');
            if (!path) return '';
            const forceAction = normalizeLifecycleAction(options?.forceAction || '');
            if (forceAction && isLifecycleContractUsable(forceAction, contract)) return forceAction;
            if (isLifecycleContractUsable('create', contract)) return 'create';
            if (isLifecycleContractUsable('delete', contract)) return 'delete';
            if (isLifecycleContractUsable('pause', contract)) return 'pause';
            if (isLifecycleContractUsable('list_conflict', contract)) return 'list_conflict';
            return '';
        };

        const scoreLifecycleContractCandidate = (action = '', contract = {}) => {
            const normalizedAction = normalizeLifecycleAction(action);
            if (!normalizedAction) return -1;
            if (!isLifecycleContractUsable(normalizedAction, contract)) return -1;
            const path = normalizeCapturePath(contract?.path || contract?.endpoint || '');
            const count = Math.max(1, toNumber(contract?.count, 1));
            const bodyKeys = Array.isArray(contract?.bodyKeys) ? contract.bodyKeys : [];
            const requestKeys = Array.isArray(contract?.requestKeys) ? contract.requestKeys : [];
            const bodyKeyPaths = Array.isArray(contract?.bodyKeyPaths) ? contract.bodyKeyPaths : [];
            const requestKeyPaths = Array.isArray(contract?.requestKeyPaths) ? contract.requestKeyPaths : [];
            const mergedKeyText = bodyKeys.concat(requestKeys, bodyKeyPaths, requestKeyPaths).map(item => String(item || '').toLowerCase()).join('|');
            let score = count * 10;
            if (normalizedAction === 'create') {
                if (isGoalCreateSubmitPath(path)) score += 300;
                if (/\/solution\/business\/addList\.json$/i.test(path)) score += 40;
            }
            if (normalizedAction === 'list_conflict') {
                if (LIFECYCLE_CONFLICT_LIST_PATH_RE.test(path)) score += 220;
                if (LIFECYCLE_LIST_PATH_RE.test(path)) score += 180;
                if (/(itemid|materialid)/.test(mergedKeyText)) score += 40;
                if (/(campaignid|planid)/.test(mergedKeyText)) score += 20;
            }
            if (normalizedAction === 'pause') {
                if (LIFECYCLE_PAUSE_PATH_RE.test(path)) score += 200;
                if (/(campaignid|planid)/.test(mergedKeyText)) score += 25;
                if (/(status|online)/.test(mergedKeyText)) score += 20;
            }
            if (normalizedAction === 'delete') {
                if (LIFECYCLE_DELETE_PATH_RE.test(path)) score += 220;
                if (/(campaignid|planid)/.test(mergedKeyText)) score += 25;
            }
            return score;
        };

        const normalizeLifecycleContract = (sceneName = '', action = '', contract = {}, extra = {}) => {
            const targetScene = String(sceneName || '').trim();
            const normalizedAction = normalizeLifecycleAction(action);
            if (!targetScene || !normalizedAction) return null;
            const endpoint = normalizeCapturePath(contract?.path || contract?.endpoint || '');
            if (!endpoint) return null;
            const requestKeys = Array.isArray(contract?.requestKeys)
                ? contract.requestKeys
                : [];
            const requestKeyPaths = Array.isArray(contract?.requestKeyPaths)
                ? contract.requestKeyPaths
                : [];
            const bodyKeys = Array.isArray(contract?.bodyKeys)
                ? contract.bodyKeys
                : requestKeys;
            const bodyKeyPaths = Array.isArray(contract?.bodyKeyPaths)
                ? contract.bodyKeyPaths
                : requestKeyPaths;
            return {
                sceneName: targetScene,
                action: normalizedAction,
                method: normalizeCaptureMethod(contract?.method || 'POST'),
                endpoint,
                requestKeys: uniqueBy(requestKeys.map(item => normalizeText(item)).filter(Boolean), item => item).slice(0, 320),
                requestKeyPaths: uniqueBy(requestKeyPaths.map(item => normalizeText(item)).filter(Boolean), item => item).slice(0, 1600),
                queryKeys: uniqueBy((Array.isArray(contract?.queryKeys) ? contract.queryKeys : [])
                    .map(item => normalizeText(item))
                    .filter(Boolean), item => item).slice(0, 120),
                bodyKeys: uniqueBy(bodyKeys.map(item => normalizeText(item)).filter(Boolean), item => item).slice(0, 320),
                bodyKeyPaths: uniqueBy(bodyKeyPaths.map(item => normalizeText(item)).filter(Boolean), item => item).slice(0, 1600),
                responseShape: isPlainObject(contract?.responseShape) ? deepClone(contract.responseShape) : {},
                sampleBody: isPlainObject(contract?.sampleBody) ? deepClone(contract.sampleBody) : null,
                count: Math.max(1, toNumber(contract?.count, 1)),
                source: normalizeText(extra?.source || contract?.source || 'network_listener'),
                sampledAt: extra?.sampledAt || new Date().toISOString()
            };
        };

        const mergeLifecycleContract = (base = null, next = null) => {
            if (!isPlainObject(next)) return isPlainObject(base) ? deepClone(base) : null;
            if (!isPlainObject(base)) return deepClone(next);
            const merged = deepClone(base);
            merged.method = normalizeCaptureMethod(next.method || merged.method || 'POST');
            merged.endpoint = normalizeCapturePath(next.endpoint || merged.endpoint || '');
            merged.requestKeys = uniqueBy(
                (Array.isArray(base.requestKeys) ? base.requestKeys : [])
                    .concat(Array.isArray(next.requestKeys) ? next.requestKeys : [])
                    .map(item => normalizeText(item))
                    .filter(Boolean),
                item => item
            ).slice(0, 320);
            merged.requestKeyPaths = uniqueBy(
                (Array.isArray(base.requestKeyPaths) ? base.requestKeyPaths : [])
                    .concat(Array.isArray(next.requestKeyPaths) ? next.requestKeyPaths : [])
                    .map(item => normalizeText(item))
                    .filter(Boolean),
                item => item
            ).slice(0, 1600);
            merged.queryKeys = uniqueBy(
                (Array.isArray(base.queryKeys) ? base.queryKeys : [])
                    .concat(Array.isArray(next.queryKeys) ? next.queryKeys : [])
                    .map(item => normalizeText(item))
                    .filter(Boolean),
                item => item
            ).slice(0, 120);
            merged.bodyKeys = uniqueBy(
                (Array.isArray(base.bodyKeys) ? base.bodyKeys : [])
                    .concat(Array.isArray(next.bodyKeys) ? next.bodyKeys : [])
                    .map(item => normalizeText(item))
                    .filter(Boolean),
                item => item
            ).slice(0, 320);
            merged.bodyKeyPaths = uniqueBy(
                (Array.isArray(base.bodyKeyPaths) ? base.bodyKeyPaths : [])
                    .concat(Array.isArray(next.bodyKeyPaths) ? next.bodyKeyPaths : [])
                    .map(item => normalizeText(item))
                    .filter(Boolean),
                item => item
            ).slice(0, 1600);
            merged.count = Math.max(
                toNumber(base.count, 0),
                toNumber(next.count, 0)
            );
            merged.source = normalizeText(next.source || base.source || '');
            merged.sampledAt = next.sampledAt || base.sampledAt || new Date().toISOString();
            if (!merged.sampleBody && isPlainObject(next.sampleBody)) {
                merged.sampleBody = deepClone(next.sampleBody);
            }
            return merged;
        };

        const rememberLifecycleContractsFromContractList = (sceneName = '', contracts = [], options = {}) => {
            const targetScene = String(sceneName || '').trim();
            if (!targetScene || !Array.isArray(contracts) || !contracts.length) return [];
            const mergedContracts = mergeContractSummaries(contracts);
            const remembered = [];
            mergedContracts.forEach(contract => {
                const action = inferLifecycleActionFromContract(contract, options);
                if (!isLifecycleAction(action)) return;
                const normalized = normalizeLifecycleContract(targetScene, action, contract, {
                    source: options.source || 'network_listener'
                });
                if (!normalized) return;
                const cached = getCachedSceneLifecycleContract(targetScene, action);
                const merged = mergeLifecycleContract(cached, normalized);
                if (!merged) return;
                setCachedSceneLifecycleContract(targetScene, action, merged);
                remembered.push({
                    action,
                    endpoint: merged.endpoint || '',
                    method: merged.method || 'POST'
                });
            });
            return remembered;
        };

        const collectContractsFromActiveCaptures = (sceneName = '') => {
            const targetScene = String(sceneName || '').trim();
            const contracts = [];
            const snapshots = [];
            Array.from(networkCaptureRegistry.sessions.values()).forEach(entry => {
                if (!entry?.captureId || !entry?.session) return;
                if (targetScene && entry.sceneName && entry.sceneName !== targetScene) return;
                const records = entry.session.sliceFrom(0);
                if (!records.length) return;
                const summary = summarizeGoalLoadContracts(records);
                if (summary.length) {
                    contracts.push(...summary);
                    snapshots.push({
                        captureId: entry.captureId,
                        sceneName: entry.sceneName || '',
                        contractCount: summary.length,
                        recordCount: records.length
                    });
                }
            });
            return { contracts, snapshots };
        };

        const collectContractsFromHookHistory = (sceneName = '', options = {}) => {
            const targetScene = String(sceneName || '').trim();
            const hookManagers = listHookManagers();
            if (!hookManagers.length) {
                return { contracts: [], snapshots: [] };
            }
            const includePattern = options.includePattern instanceof RegExp
                ? options.includePattern
                : /\.json(?:$|\?)/i;
            const targetBizCode = normalizeSceneBizCode(
                options.bizCode
                || resolveSceneBizCodeHint(targetScene)
                || SCENE_BIZCODE_HINT_FALLBACK[targetScene]
                || ''
            );
            const limit = Math.max(200, Math.min(20000, toNumber(options.limit, 3000)));
            const since = Math.max(0, toNumber(options.since, 0));
            const history = uniqueBy(
                hookManagers.flatMap(manager => {
                    if (!manager || typeof manager.getRequestHistory !== 'function') return [];
                    try {
                        const list = manager.getRequestHistory({
                            includePattern,
                            limit,
                            since
                        });
                        return Array.isArray(list) ? list : [];
                    } catch {
                        return [];
                    }
                }),
                item => `${toNumber(item?.ts, 0)}::${normalizeCaptureMethod(item?.method || 'POST')}::${String(item?.url || '').trim()}::${String(item?.source || '').trim()}`
            );
            if (!Array.isArray(history) || !history.length) {
                return { contracts: [], snapshots: [] };
            }
            const records = [];
            history.forEach(entry => {
                const method = normalizeCaptureMethod(entry?.method || 'POST');
                const url = String(entry?.url || '').trim();
                const path = normalizeCapturePath(url);
                if (!path) return;
                let queryKeys = [];
                let queryBizCode = '';
                try {
                    const parsed = new URL(url, window.location.origin);
                    queryKeys = uniqueBy(Array.from(parsed.searchParams.keys()).filter(Boolean), item => item).slice(0, 80);
                    queryBizCode = normalizeSceneBizCode(parsed.searchParams.get('bizCode') || '');
                } catch { }
                const body = parseCaptureBody(entry?.body);
                const bodyBizCode = normalizeSceneBizCode(body?.bizCode || body?.biz_code || '');
                if (targetBizCode) {
                    const matched = queryBizCode === targetBizCode
                        || bodyBizCode === targetBizCode
                        || queryBizCode === 'universalBP'
                        || bodyBizCode === 'universalBP'
                        || (!queryBizCode && !bodyBizCode);
                    if (!matched) return;
                }
                records.push({
                    method,
                    path,
                    queryKeys,
                    bodyKeys: body && typeof body === 'object'
                        ? uniqueBy(Object.keys(body).filter(Boolean), item => item).slice(0, 160)
                        : [],
                    bodyKeyPaths: body && typeof body === 'object'
                        ? flattenCaptureKeyPaths(body, {
                            maxDepth: 10,
                            maxPaths: 1400,
                            maxArrayItems: 3
                        })
                        : [],
                    sampleBody: body && typeof body === 'object'
                        ? Object.keys(body).slice(0, 24).reduce((acc, key) => {
                            acc[key] = body[key];
                            return acc;
                        }, {})
                        : null
                });
            });
            if (!records.length) {
                return { contracts: [], snapshots: [] };
            }
            const contracts = summarizeGoalLoadContracts(records);
            if (!contracts.length) {
                return { contracts: [], snapshots: [] };
            }
            return {
                contracts,
                snapshots: [{
                    source: 'hook_history',
                    sceneName: targetScene,
                    recordCount: records.length,
                    contractCount: contracts.length
                }]
            };
        };

        const extractLifecycleContracts = async (sceneName = '', options = {}) => {
            const targetScene = String(sceneName || inferCurrentSceneName() || '').trim();
            if (!targetScene) {
                return {
                    ok: false,
                    sceneName: '',
                    actions: [],
                    warnings: ['缺少 sceneName']
                };
            }
            const warnings = [];
            const sourceContracts = [];
            const sourceNotes = [];

            if (options.fromSceneGoalSpecs !== false) {
                try {
                    const extracted = await extractSceneGoalSpecs(targetScene, {
                        scanMode: options.scanMode || 'full_top_down',
                        unlockPolicy: options.unlockPolicy || 'safe_only',
                        goalScan: true,
                        goalFieldScan: false,
                        refresh: !!options.refresh
                    });
                    if (Array.isArray(extracted?.contracts) && extracted.contracts.length) {
                        sourceContracts.push(...extracted.contracts);
                        sourceNotes.push(`scene_goal_specs:${extracted.contracts.length}`);
                    }
                } catch (err) {
                    warnings.push(`提取场景合同失败：${err?.message || err}`);
                }
            }
            if (Array.isArray(options.contracts) && options.contracts.length) {
                sourceContracts.push(...options.contracts);
                sourceNotes.push(`input_contracts:${options.contracts.length}`);
            }
            if (options.includeActiveCaptures !== false) {
                const fromActive = collectContractsFromActiveCaptures(targetScene);
                if (fromActive.contracts.length) {
                    sourceContracts.push(...fromActive.contracts);
                    sourceNotes.push(`active_captures:${fromActive.contracts.length}`);
                }
            }
            if (options.includeHookHistory !== false) {
                const fromHistory = collectContractsFromHookHistory(targetScene, {
                    limit: Math.max(200, toNumber(options.historyLimit, 3000)),
                    since: Math.max(0, toNumber(options.historySince, 0))
                });
                if (fromHistory.contracts.length) {
                    sourceContracts.push(...fromHistory.contracts);
                    sourceNotes.push(`hook_history:${fromHistory.contracts.length}`);
                }
            }

            const mergedContracts = mergeContractSummaries(sourceContracts);
            const byAction = {
                create: [],
                list_conflict: [],
                pause: [],
                delete: []
            };
            mergedContracts.forEach(contract => {
                const action = inferLifecycleActionFromContract(contract, options);
                if (!isLifecycleAction(action)) return;
                byAction[action].push(contract);
            });

            // create 没有匹配时尝试复用已缓存创建合同，避免阻断。
            if (!byAction.create.length) {
                const createContract = getSceneCreateContract(targetScene, options.goalLabel || '');
                if (createContract?.ok && createContract.contract) {
                    byAction.create.push({
                        method: createContract.contract.method || 'POST',
                        path: createContract.contract.endpoint || '',
                        requestKeys: Array.isArray(createContract.contract.requestKeys) ? createContract.contract.requestKeys.slice(0, 320) : [],
                        requestKeyPaths: Array.isArray(createContract.contract.requestKeyPaths) ? createContract.contract.requestKeyPaths.slice(0, 1600) : [],
                        bodyKeys: Array.isArray(createContract.contract.requestKeys) ? createContract.contract.requestKeys.slice(0, 320) : [],
                        bodyKeyPaths: Array.isArray(createContract.contract.requestKeyPaths) ? createContract.contract.requestKeyPaths.slice(0, 1600) : [],
                        queryKeys: [],
                        count: toNumber(createContract.contract.count, 0),
                        sampleBody: null,
                        source: 'scene_create_contract_cache'
                    });
                }
            }

            const actionResults = LIFECYCLE_ACTION_LIST.map(action => {
                const list = Array.isArray(byAction[action]) ? byAction[action] : [];
                if (!list.length) {
                    return {
                        action,
                        ok: false,
                        error: 'not_detected',
                        contract: null
                    };
                }
                const candidates = list
                    .map(item => ({
                        item,
                        score: scoreLifecycleContractCandidate(action, item)
                    }))
                    .filter(row => row.score >= 0);
                if (!candidates.length) {
                    return {
                        action,
                        ok: false,
                        error: 'not_detected',
                        contract: null
                    };
                }
                const picked = candidates.sort((left, right) => {
                    const scoreDiff = right.score - left.score;
                    if (scoreDiff !== 0) return scoreDiff;
                    return normalizeCapturePath(String(right?.item?.path || '')).length
                        - normalizeCapturePath(String(left?.item?.path || '')).length;
                })[0]?.item;
                const normalized = normalizeLifecycleContract(targetScene, action, picked, {
                    source: 'network_listener'
                });
                if (!normalized) {
                    return {
                        action,
                        ok: false,
                        error: 'normalize_failed',
                        contract: null
                    };
                }
                const cached = getCachedSceneLifecycleContract(targetScene, action);
                const merged = mergeLifecycleContract(cached, normalized);
                if (merged) {
                    setCachedSceneLifecycleContract(targetScene, action, merged);
                }
                return {
                    action,
                    ok: !!merged,
                    contract: merged || null,
                    error: merged ? '' : 'cache_write_failed'
                };
            });

            const missingActions = actionResults.filter(item => !item.ok).map(item => item.action);
            if (missingActions.length) {
                warnings.push(`场景「${targetScene}」生命周期合同缺失：${missingActions.join(', ')}`);
            }

            return {
                ok: actionResults.some(item => item.ok),
                sceneName: targetScene,
                scannedAt: new Date().toISOString(),
                source: 'network_listener',
                sourceNotes,
                contractCount: mergedContracts.length,
                actions: actionResults,
                warnings
            };
        };

        const extractSceneGoalSpecs = async (sceneName = '', options = {}) => {
            const targetScene = String(sceneName || inferCurrentSceneName() || '').trim();
            if (!targetScene) {
                return {
                    ok: false,
                    sceneName: '',
                    error: '缺少 sceneName'
                };
            }
            const goalResult = await scanSceneGoalSpecs(targetScene, {
                ...options,
                scanMode: options.scanMode || 'full_top_down',
                unlockPolicy: options.unlockPolicy || 'safe_only',
                goalScan: options.goalScan !== false,
                goalFieldScan: options.goalFieldScan !== false,
                goalFieldScanMode: options.goalFieldScanMode || (options.scanMode === 'visible' ? 'visible' : 'full_top_down'),
                goalFieldMaxDepth: toNumber(options.goalFieldMaxDepth, 2),
                goalFieldMaxSnapshots: toNumber(options.goalFieldMaxSnapshots, 48),
                goalFieldMaxGroupsPerLevel: toNumber(options.goalFieldMaxGroupsPerLevel, 6),
                goalFieldMaxOptionsPerGroup: toNumber(options.goalFieldMaxOptionsPerGroup, 8),
                contractMode: options.contractMode || 'network_only',
                refresh: options.refresh !== false
            });
            const goals = normalizeGoalSpecContracts(goalResult?.goals || []);
            const networkSummary = summarizeSceneNetworkContractsFromGoals(goals);
            if (networkSummary.createInterfaces.length) {
                rememberSceneCreateInterfaces(targetScene, '', networkSummary.createInterfaces, {
                    source: 'extract_scene_goal_specs'
                });
            }
            goals.forEach(goal => {
                const goalCreateContracts = mergeContractSummaries(
                    (Array.isArray(goal?.loadContracts) ? goal.loadContracts : [])
                        .filter(item => isGoalCreateSubmitPath(item?.path || ''))
                );
                const goalCreateInterfaces = summarizeCreateInterfacesFromContracts(goalCreateContracts);
                if (!goalCreateInterfaces.length) return;
                rememberSceneCreateInterfaces(targetScene, goal?.goalLabel || '', goalCreateInterfaces, {
                    source: 'extract_scene_goal_specs_goal'
                });
            });
            const goalFieldCount = goals.reduce((sum, goal) => sum + (Array.isArray(goal?.fieldRows) ? goal.fieldRows.length : 0), 0);
            const goalOptionCount = goals.reduce((sum, goal) => sum + ((goal?.fieldCoverage?.optionCount && Number.isFinite(goal.fieldCoverage.optionCount))
                ? toNumber(goal.fieldCoverage.optionCount, 0)
                : (Array.isArray(goal?.fieldRows) ? goal.fieldRows.reduce((acc, row) => acc + (Array.isArray(row?.options) ? row.options.length : 0), 0) : 0)), 0);
            const goalsWithFieldRows = goals.filter(goal => Array.isArray(goal?.fieldRows) && goal.fieldRows.length > 0).length;
            const goalsWithOptionRows = goals.filter(goal => Array.isArray(goal?.fieldRows) && goal.fieldRows.some(row => Array.isArray(row?.options) && row.options.length >= 2)).length;
            const extractWarnings = Array.isArray(goalResult?.warnings) ? goalResult.warnings.slice(0, 120) : [];
            if (!networkSummary.createContracts.length) {
                extractWarnings.push(`场景「${targetScene}」未捕获到创建提交接口，请在开启抓包后执行一次“新建计划提交”再提取`);
            }
            if (goals.length && goalsWithFieldRows < goals.length) {
                extractWarnings.push(`场景「${targetScene}」存在营销目标未采集到行配置（${goalsWithFieldRows}/${goals.length}）`);
            }
            if (goals.length && goalsWithOptionRows < goals.length) {
                extractWarnings.push(`场景「${targetScene}」存在营销目标未采集到可切换选项（${goalsWithOptionRows}/${goals.length}）`);
            }
            return {
                ok: !!goalResult?.ok,
                source: 'network_listener',
                sceneName: targetScene,
                scannedAt: goalResult?.scannedAt || new Date().toISOString(),
                goalCount: goals.length,
                goals,
                contracts: networkSummary.contracts,
                createContracts: networkSummary.createContracts,
                createInterfaces: networkSummary.createInterfaces,
                createEndpoints: networkSummary.createEndpoints,
                goalCoverage: {
                    mode: 'network_listener',
                    goalCount: goals.length,
                    contractCount: networkSummary.contracts.length,
                    createContractCount: networkSummary.createContracts.length,
                    createInterfaceCount: networkSummary.createInterfaces.length
                },
                goalFieldCoverage: {
                    goalCount: goals.length,
                    goalsWithFieldRows,
                    goalsWithOptionRows,
                    fieldCount: goalFieldCount,
                    optionCount: goalOptionCount
                },
                coverage: {
                    source: 'network_listener'
                },
                warnings: uniqueBy(extractWarnings, item => item)
            };
        };

        const extractAllSceneGoalSpecs = async (options = {}) => {
            const scenes = Array.isArray(options.scenes) && options.scenes.length
                ? uniqueBy(options.scenes.map(item => String(item || '').trim()).filter(Boolean), item => item)
                : SCENE_NAME_LIST.slice();
            const list = [];
            for (let i = 0; i < scenes.length; i++) {
                const sceneName = scenes[i];
                if (typeof options.onProgress === 'function') {
                    try {
                        options.onProgress({
                            event: 'scene_goal_spec_start',
                            sceneName,
                            index: i + 1,
                            total: scenes.length
                        });
                    } catch { }
                }
                const result = await extractSceneGoalSpecs(sceneName, {
                    ...options,
                    refresh: options.refresh !== false
                });
                list.push(result);
                if (typeof options.onProgress === 'function') {
                    try {
                        options.onProgress({
                            event: 'scene_goal_spec_done',
                            sceneName,
                            index: i + 1,
                            total: scenes.length,
                            ok: !!result?.ok,
                            goalCount: result?.goalCount || 0
                        });
                    } catch { }
                }
            }
            return {
                ok: list.every(item => item?.ok),
                source: 'network_listener',
                scannedAt: new Date().toISOString(),
                sceneOrder: scenes,
                count: list.length,
                successCount: list.filter(item => item?.ok).length,
                failCount: list.filter(item => !item?.ok).length,
                goalCount: list.reduce((sum, item) => sum + toNumber(item?.goalCount, 0), 0),
                goalFieldCount: list.reduce((sum, item) => sum + toNumber(item?.goalFieldCoverage?.fieldCount, 0), 0),
                goalOptionCount: list.reduce((sum, item) => sum + toNumber(item?.goalFieldCoverage?.optionCount, 0), 0),
                goalsWithFieldRows: list.reduce((sum, item) => sum + toNumber(item?.goalFieldCoverage?.goalsWithFieldRows, 0), 0),
                goalsWithOptionRows: list.reduce((sum, item) => sum + toNumber(item?.goalFieldCoverage?.goalsWithOptionRows, 0), 0),
                contractCount: list.reduce((sum, item) => sum + toNumber(Array.isArray(item?.contracts) ? item.contracts.length : 0, 0), 0),
                createContractCount: list.reduce((sum, item) => sum + toNumber(Array.isArray(item?.createContracts) ? item.createContracts.length : 0, 0), 0),
                createInterfaceCount: list.reduce((sum, item) => sum + toNumber(Array.isArray(item?.createInterfaces) ? item.createInterfaces.length : 0, 0), 0),
                list
            };
        };
        const parseComponentFindListSummary = (payload = {}) => {
            const scenes = [];
            const goals = [];
            const fieldRows = [];
            const samplePaths = [];
            const seenRows = new Set();
            const sceneSet = new Set(SCENE_NAME_LIST);
            const goalHintSet = new Set(SCENE_GOAL_LABEL_HINTS);
            const pushRow = (label = '', options = [], path = '') => {
                const normalizedLabel = normalizeText(label).replace(/[：:]/g, '').trim();
                if (!normalizedLabel) return;
                const normalizedOptions = uniqueBy(
                    (Array.isArray(options) ? options : [])
                        .map(item => normalizeSceneOptionText(item))
                        .filter(item => isLikelySceneOptionValue(item)),
                    item => item
                ).slice(0, 36);
                if (normalizedOptions.length < 2) return;
                const rowKey = `${normalizeSceneFieldKey(normalizedLabel)}::${normalizedOptions.join('|')}`;
                if (seenRows.has(rowKey)) return;
                seenRows.add(rowKey);
                fieldRows.push({
                    label: normalizedLabel,
                    options: normalizedOptions,
                    path: path || ''
                });
            };
            const readOptionText = (item) => {
                if (item === undefined || item === null) return '';
                if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
                    return normalizeText(String(item)).trim();
                }
                if (!isPlainObject(item)) return '';
                return normalizeText(
                    item.label
                    || item.optionText
                    || item.title
                    || item.name
                    || item.text
                    || item.value
                    || ''
                ).trim();
            };
            const pickNodeOptions = (node = {}) => {
                const source = node.options || node.optionList || node.tabs || node.items || node.cards || node.cardList || node.children || [];
                if (!Array.isArray(source)) return [];
                return uniqueBy(source.map(readOptionText).filter(Boolean), item => item).slice(0, 60);
            };
            const markScalar = (text = '', path = '') => {
                const normalized = normalizeText(text).trim();
                if (!normalized) return;
                if (normalized.length <= 28 && sceneSet.has(normalized)) {
                    scenes.push(normalized);
                }
                const goalLabel = normalizeGoalCandidateLabel(normalized);
                if (goalLabel && goalHintSet.has(goalLabel)) {
                    goals.push(goalLabel);
                }
                if (path && samplePaths.length < 120 && /scene|goal|target|option|label|title|name|promotion|budget|bid|word|crowd/i.test(path)) {
                    samplePaths.push({
                        path,
                        value: normalized.slice(0, 140)
                    });
                }
            };
            const walk = (node, path = '', depth = 0) => {
                if (depth > 6 || node === null || node === undefined) return;
                if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
                    markScalar(String(node), path);
                    return;
                }
                if (Array.isArray(node)) {
                    node.slice(0, 60).forEach((item, idx) => {
                        walk(item, `${path}[${idx}]`, depth + 1);
                    });
                    return;
                }
                if (!isPlainObject(node)) return;
                const label = normalizeText(node.label || node.title || node.name || '').trim();
                if (label) {
                    markScalar(label, `${path}.label`);
                    const options = pickNodeOptions(node);
                    if (options.length >= 2) {
                        pushRow(label, options, `${path}.options`);
                    }
                }
                const entries = Object.entries(node).slice(0, 80);
                entries.forEach(([key, value]) => {
                    const nextPath = path ? `${path}.${key}` : key;
                    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                        markScalar(String(value), nextPath);
                        return;
                    }
                    walk(value, nextPath, depth + 1);
                });
            };
            walk(payload, '$', 0);
            return {
                sceneOptions: uniqueBy(scenes, item => item),
                goalOptions: uniqueBy(goals, item => item),
                fieldRows: uniqueBy(fieldRows, row => normalizeSceneFieldKey(row.label)),
                samplePaths: samplePaths.slice(0, 120)
            };
        };
        const mergeComponentGoalFallbackOptions = (summary = {}) => {
            const goalOptions = Array.isArray(summary?.goalOptions)
                ? summary.goalOptions.map(item => normalizeGoalCandidateLabel(item)).filter(Boolean)
                : [];
            if (!goalOptions.length) return;
            const mergeGoals = (sceneName, seeds = []) => {
                const normalizedSeeds = uniqueBy(
                    (Array.isArray(seeds) ? seeds : [])
                        .map(item => normalizeGoalCandidateLabel(item))
                        .filter(Boolean),
                    item => item
                );
                if (!normalizedSeeds.length) return;
                const current = Array.isArray(SCENE_MARKETING_GOAL_FALLBACK_OPTIONS[sceneName])
                    ? SCENE_MARKETING_GOAL_FALLBACK_OPTIONS[sceneName]
                    : [];
                SCENE_MARKETING_GOAL_FALLBACK_OPTIONS[sceneName] = uniqueBy(current.concat(normalizedSeeds), item => item).slice(0, 24);
            };
            const pickByKeywords = (keywords = []) => goalOptions.filter(goal => (
                keywords.some(token => goal.includes(token))
            ));
            mergeGoals('关键词推广', pickByKeywords(['卡位', '趋势', '金卡', '自定义']));
            mergeGoals('人群推广', pickByKeywords(['拉新', '竞店', '借势', '机会人群', '跨类目']));
            mergeGoals('内容营销', pickByKeywords(['直播', '打爆', '增粉']));
            mergeGoals('线索推广', pickByKeywords(['线索', '行业解决方案']));
            mergeGoals('货品全站推广', pickByKeywords(['货品全站']));
            mergeGoals('店铺直达', pickByKeywords(['店铺直达']));
        };
        const mergeComponentFieldFallbackOptions = (summary = {}) => {
            const rows = Array.isArray(summary?.fieldRows) ? summary.fieldRows : [];
            if (!rows.length) return;
            const mergeOptions = (target = [], incoming = []) => uniqueBy(
                (Array.isArray(target) ? target : []).concat(
                    (Array.isArray(incoming) ? incoming : [])
                        .map(item => normalizeSceneOptionText(item))
                        .filter(item => isLikelySceneOptionValue(item))
                ),
                item => item
            ).slice(0, 24);
            const sceneNames = Object.keys(SCENE_FALLBACK_OPTION_MAP || {});
            rows.forEach(row => {
                const label = normalizeText(row?.label || '').replace(/[：:]/g, '').trim();
                const options = Array.isArray(row?.options) ? row.options : [];
                if (!label || options.length < 2) return;
                sceneNames.forEach(sceneName => {
                    const sceneMap = SCENE_FALLBACK_OPTION_MAP[sceneName];
                    if (!isPlainObject(sceneMap)) return;
                    Object.keys(sceneMap).forEach(key => {
                        if (!isSceneLabelMatch(label, key)) return;
                        sceneMap[key] = mergeOptions(sceneMap[key], options);
                    });
                });
            });
        };
