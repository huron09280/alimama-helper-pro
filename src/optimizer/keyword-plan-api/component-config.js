        const getNewPlanComponentConfig = async (options = {}) => {
            const componentCode = String(options.componentCode || 'b_onebp_main_step_one_scene').trim() || 'b_onebp_main_step_one_scene';
            const bizCode = String(options.bizCode || 'universalBP').trim() || 'universalBP';
            const cacheKey = `${componentCode}::${bizCode}`;
            const now = Date.now();
            if (!options.refresh && componentConfigCache.data && componentConfigCache.key === cacheKey && now - componentConfigCache.ts < COMPONENT_CONFIG_CACHE_TTL_MS) {
                return deepClone(componentConfigCache.data);
            }
            const aemUid = resolveAemUid(options.aemUid || '');
            const query = {
                componentCode,
                bizCode
            };
            if (aemUid) query._aem_uid = aemUid;
            const response = await requestOneGet(ENDPOINTS.componentFindList, query, options.requestOptions || {});
            const summary = parseComponentFindListSummary(response?.data || response || {});
            mergeComponentGoalFallbackOptions(summary);
            mergeComponentFieldFallbackOptions(summary);
            const result = {
                ok: true,
                source: 'component_findList',
                fetchedAt: new Date().toISOString(),
                componentCode,
                bizCode,
                aemUid,
                summary,
                raw: deepClone(response || {})
            };
            componentConfigCache.key = cacheKey;
            componentConfigCache.ts = Date.now();
            componentConfigCache.data = deepClone(result);
            return result;
        };
        const extractSceneCreateInterfaces = (sceneName = '', options = {}) => extractSceneGoalSpecs(sceneName, options);
        const extractAllSceneCreateInterfaces = (options = {}) => extractAllSceneGoalSpecs(options);
        const listCachedSceneCreateContracts = (sceneName = '') => {
            loadSceneCreateContractCache();
            const targetScene = String(sceneName || '').trim();
            const now = Date.now();
            const out = [];
            Object.keys(sceneCreateContractCache.map || {}).forEach(key => {
                const entry = sceneCreateContractCache.map[key];
                if (!isPlainObject(entry)) return;
                const ts = toNumber(entry.ts, 0);
                if (!ts || now - ts > SCENE_CREATE_CONTRACT_CACHE_TTL_MS) {
                    delete sceneCreateContractCache.map[key];
                    return;
                }
                const data = isPlainObject(entry.data) ? deepClone(entry.data) : null;
                if (!data) return;
                const parts = String(key || '').split('::');
                const scenePart = String(parts[0] || '').trim();
                const goalPartRaw = String(parts[1] || '').trim();
                if (!scenePart) return;
                if (targetScene && scenePart !== targetScene) return;
                const goalLabel = goalPartRaw === '__scene_default__'
                    ? ''
                    : normalizeGoalCandidateLabel(goalPartRaw);
                out.push({
                    sceneName: scenePart,
                    goalLabel,
                    contract: data,
                    sampledAt: data?.sampledAt || (new Date(ts).toISOString()),
                    ts
                });
            });
            persistSceneCreateContractCache();
            return out.sort((a, b) => Number(b.ts || 0) - Number(a.ts || 0));
        };
        const mergeApiDocKeys = (lists = [], limit = 320) => mergeInterfaceKeyList(lists, limit);
        const pickPrimaryCreateInterface = (list = []) => {
            const interfaces = Array.isArray(list) ? list : [];
            if (!interfaces.length) return null;
            return interfaces.slice().sort((left, right) => {
                const diff = toNumber(right?.count, 0) - toNumber(left?.count, 0);
                if (diff !== 0) return diff;
                const leftBusiness = /\/solution\/business\/addList\.json$/i.test(String(left?.path || '')) ? 1 : 0;
                const rightBusiness = /\/solution\/business\/addList\.json$/i.test(String(right?.path || '')) ? 1 : 0;
                return rightBusiness - leftBusiness;
            })[0] || null;
        };
        const buildGoalCreateApiDocRow = ({
            sceneName = '',
            goalLabel = '',
            goalSpec = null,
            cachedGoalContract = null,
            cachedSceneContract = null,
            hookHistoryContract = null
        } = {}) => {
            const normalizedGoalLabel = normalizeGoalCandidateLabel(goalLabel || goalSpec?.goalLabel || '');
            const goalCreateContract = isPlainObject(goalSpec?.createContract) ? deepClone(goalSpec.createContract) : {};
            const goalLoadContracts = mergeContractSummaries(Array.isArray(goalSpec?.loadContracts) ? goalSpec.loadContracts : []);
            const goalCreateInterfaces = summarizeCreateInterfacesFromContracts(
                goalLoadContracts.filter(item => isGoalCreateSubmitPath(item?.path || ''))
            );
            const interfaceSummary = summarizeCreateInterfaceHints(goalCreateInterfaces);
            const topInterface = pickPrimaryCreateInterface(goalCreateInterfaces);
            const endpoint = normalizeGoalCreateEndpoint(
                topInterface?.path
                || interfaceSummary.path
                || goalCreateContract.endpoint
                || cachedGoalContract?.endpoint
                || hookHistoryContract?.endpoint
                || cachedSceneContract?.endpoint
                || ''
            );
            const method = normalizeCaptureMethod(
                topInterface?.method
                || interfaceSummary.method
                || goalCreateContract.method
                || cachedGoalContract?.method
                || hookHistoryContract?.method
                || cachedSceneContract?.method
                || 'POST'
            );
            const requestKeys = mergeApiDocKeys([
                interfaceSummary.requestKeys,
                goalCreateContract.requestKeys,
                cachedGoalContract?.requestKeys,
                hookHistoryContract?.requestKeys,
                cachedSceneContract?.requestKeys
            ], 480);
            const requestKeyPaths = mergeApiDocKeys([
                interfaceSummary.requestKeyPaths,
                goalCreateContract.requestKeyPaths,
                cachedGoalContract?.requestKeyPaths,
                hookHistoryContract?.requestKeyPaths,
                cachedSceneContract?.requestKeyPaths
            ], 1800);
            const solutionKeys = mergeApiDocKeys([
                interfaceSummary.solutionKeys,
                goalCreateContract.solutionKeys,
                cachedGoalContract?.solutionKeys,
                hookHistoryContract?.solutionKeys,
                cachedSceneContract?.solutionKeys
            ], 480);
            const solutionKeyPaths = mergeApiDocKeys([
                interfaceSummary.solutionKeyPaths,
                goalCreateContract.solutionKeyPaths,
                cachedGoalContract?.solutionKeyPaths,
                hookHistoryContract?.solutionKeyPaths,
                cachedSceneContract?.solutionKeyPaths
            ], 1600);
            const campaignKeys = mergeApiDocKeys([
                interfaceSummary.campaignKeys,
                goalCreateContract.campaignKeys,
                cachedGoalContract?.campaignKeys,
                hookHistoryContract?.campaignKeys,
                cachedSceneContract?.campaignKeys
            ], 480);
            const campaignKeyPaths = mergeApiDocKeys([
                interfaceSummary.campaignKeyPaths,
                goalCreateContract.campaignKeyPaths,
                cachedGoalContract?.campaignKeyPaths,
                hookHistoryContract?.campaignKeyPaths,
                cachedSceneContract?.campaignKeyPaths
            ], 1400);
            const adgroupKeys = mergeApiDocKeys([
                interfaceSummary.adgroupKeys,
                goalCreateContract.adgroupKeys,
                cachedGoalContract?.adgroupKeys,
                hookHistoryContract?.adgroupKeys,
                cachedSceneContract?.adgroupKeys
            ], 480);
            const adgroupKeyPaths = mergeApiDocKeys([
                interfaceSummary.adgroupKeyPaths,
                goalCreateContract.adgroupKeyPaths,
                cachedGoalContract?.adgroupKeyPaths,
                hookHistoryContract?.adgroupKeyPaths,
                cachedSceneContract?.adgroupKeyPaths
            ], 1400);
            const warnings = [];
            if (!requestKeyPaths.length && !requestKeys.length) {
                warnings.push('未捕获到请求体字段，请先执行一次真实新建提交并开启网络监听');
            }
            if (!campaignKeyPaths.length && !campaignKeys.length) {
                warnings.push('未捕获到 campaign 字段');
            }
            if (!adgroupKeyPaths.length && !adgroupKeys.length) {
                warnings.push('未捕获到 adgroup 字段');
            }
            if (!endpoint || endpoint === SCENE_CREATE_ENDPOINT_FALLBACK) {
                warnings.push(`创建接口端点未锁定，当前回退为 ${SCENE_CREATE_ENDPOINT_FALLBACK}`);
            }
            return {
                sceneName: String(sceneName || '').trim(),
                goalLabel: normalizedGoalLabel || '',
                isDefaultGoal: !!goalSpec?.isDefault,
                method,
                endpoint,
                requestKeys,
                requestKeyPaths,
                solutionKeys,
                solutionKeyPaths,
                campaignKeys,
                campaignKeyPaths,
                adgroupKeys,
                adgroupKeyPaths,
                createInterfaceCount: goalCreateInterfaces.length,
                createInterfaces: goalCreateInterfaces.slice(0, 120),
                source: uniqueBy([
                    goalCreateInterfaces.length ? 'goal_load_contracts' : '',
                    Object.keys(goalCreateContract || {}).length ? 'goal_create_contract' : '',
                    cachedGoalContract ? 'cached_goal_contract' : '',
                    cachedSceneContract ? 'cached_scene_contract' : '',
                    hookHistoryContract ? 'hook_history_contract' : ''
                ].filter(Boolean), item => item),
                warnings
            };
        };
        const getSceneCachedGoalSpecs = (sceneName = '') => {
            const targetScene = String(sceneName || '').trim();
            if (!targetScene) return [];
            const sceneBizCode = resolveSceneBizCodeHint(targetScene) || SCENE_BIZCODE_HINT_FALLBACK[targetScene] || '';
            const cachedSceneSpec = getCachedSceneSpec(targetScene, sceneBizCode);
            if (isPlainObject(cachedSceneSpec) && Array.isArray(cachedSceneSpec.goals) && cachedSceneSpec.goals.length) {
                return normalizeGoalSpecContracts(cachedSceneSpec.goals);
            }
            return buildFallbackGoalSpecList(targetScene);
        };
        const buildSceneCreateApiDoc = async (sceneName = '', options = {}) => {
            const targetScene = String(sceneName || '').trim();
            if (!targetScene) {
                return {
                    ok: false,
                    sceneName: '',
                    goals: [],
                    warnings: ['缺少 sceneName']
                };
            }
            const warnings = [];
            let goalSpecs = getSceneCachedGoalSpecs(targetScene);
            let sceneSpecSource = goalSpecs.length ? 'scene_spec_cache' : 'none';
            if ((!goalSpecs.length || options.refresh === true) && options.extractOnMiss === true) {
                try {
                    const extracted = await extractSceneGoalSpecs(targetScene, {
                        ...options,
                        refresh: true
                    });
                    if (Array.isArray(extracted?.goals) && extracted.goals.length) {
                        goalSpecs = normalizeGoalSpecContracts(extracted.goals);
                        sceneSpecSource = 'extract_scene_goal_specs';
                    }
                    if (Array.isArray(extracted?.warnings) && extracted.warnings.length) {
                        warnings.push(...extracted.warnings);
                    }
                } catch (err) {
                    warnings.push(`提取场景营销目标失败：${err?.message || err}`);
                }
            }

            const cachedContracts = listCachedSceneCreateContracts(targetScene);
            const cachedSceneContract = cachedContracts.find(item => !item.goalLabel)?.contract || getCachedSceneCreateContract(targetScene, '');
            const activeCaptureSummary = options.includeActiveCaptures === false
                ? { contracts: [], snapshots: [] }
                : collectContractsFromActiveCaptures(targetScene);
            const hookHistorySummary = options.includeHookHistory === false
                ? { contracts: [], snapshots: [] }
                : collectContractsFromHookHistory(targetScene, {
                    limit: Math.max(200, Math.min(30000, toNumber(options.historyLimit, 8000))),
                    since: Math.max(0, toNumber(options.historySince, 0))
                });
            const networkContracts = mergeContractSummaries(
                []
                    .concat(Array.isArray(activeCaptureSummary.contracts) ? activeCaptureSummary.contracts : [])
                    .concat(Array.isArray(hookHistorySummary.contracts) ? hookHistorySummary.contracts : [])
            );
            const hookCreateInterfaces = summarizeCreateInterfacesFromContracts(
                networkContracts.filter(item => isGoalCreateSubmitPath(item?.path || ''))
            );
            const hookSummary = summarizeCreateInterfaceHints(hookCreateInterfaces);
            const hookHistoryContract = hookCreateInterfaces.length ? {
                method: hookSummary.method || 'POST',
                endpoint: normalizeGoalCreateEndpoint(hookSummary.path || ''),
                requestKeys: hookSummary.requestKeys || [],
                requestKeyPaths: hookSummary.requestKeyPaths || [],
                solutionKeys: hookSummary.solutionKeys || [],
                solutionKeyPaths: hookSummary.solutionKeyPaths || [],
                campaignKeys: hookSummary.campaignKeys || [],
                campaignKeyPaths: hookSummary.campaignKeyPaths || [],
                adgroupKeys: hookSummary.adgroupKeys || [],
                adgroupKeyPaths: hookSummary.adgroupKeyPaths || []
            } : null;
            if (!goalSpecs.length) {
                warnings.push(`场景「${targetScene}」未命中营销目标缓存，当前按已缓存创建合同兜底`);
            }
            if (!networkContracts.length) {
                warnings.push(`场景「${targetScene}」未命中网络合同（active capture + hook history）`);
            }
            if (!cachedContracts.length) {
                warnings.push(`场景「${targetScene}」未命中创建合同缓存`);
            }
            if (hookCreateInterfaces.length) {
                rememberSceneCreateInterfaces(targetScene, '', hookCreateInterfaces, {
                    source: 'create_api_doc_hook_history'
                });
            }

            const goalLabelList = uniqueBy(
                []
                    .concat(goalSpecs.map(goal => normalizeGoalCandidateLabel(goal?.goalLabel || '')).filter(Boolean))
                    .concat(cachedContracts.map(item => normalizeGoalCandidateLabel(item?.goalLabel || '')).filter(Boolean)),
                item => item
            );
            if (!goalLabelList.length) {
                goalLabelList.push('');
            }
            const goals = goalLabelList.map(goalLabel => {
                const goalSpec = goalSpecs.find(item => normalizeGoalCandidateLabel(item?.goalLabel || '') === goalLabel) || null;
                const cachedGoalContract = getCachedSceneCreateContract(targetScene, goalLabel);
                return buildGoalCreateApiDocRow({
                    sceneName: targetScene,
                    goalLabel,
                    goalSpec,
                    cachedGoalContract,
                    cachedSceneContract,
                    hookHistoryContract
                });
            });
            const missingCritical = goals.flatMap(goal => {
                const reasons = [];
                if (!Array.isArray(goal?.requestKeyPaths) || !goal.requestKeyPaths.length) {
                    reasons.push('request_key_paths_missing');
                }
                if (!Array.isArray(goal?.campaignKeyPaths) || !goal.campaignKeyPaths.length) {
                    reasons.push('campaign_key_paths_missing');
                }
                if (!Array.isArray(goal?.adgroupKeyPaths) || !goal.adgroupKeyPaths.length) {
                    reasons.push('adgroup_key_paths_missing');
                }
                if (!reasons.length) return [];
                return [{
                    sceneName: targetScene,
                    goalLabel: goal.goalLabel || '默认目标',
                    reason: reasons.join(',')
                }];
            });
            const sceneResult = {
                ok: missingCritical.length === 0,
                sceneName: targetScene,
                goalCount: goals.length,
                goals,
                sceneCoverage: {
                    sceneSpecSource,
                    cachedGoalContractCount: cachedContracts.length,
                    activeCaptureContractCount: Array.isArray(activeCaptureSummary.contracts) ? activeCaptureSummary.contracts.length : 0,
                    hookHistoryContractCount: Array.isArray(hookHistorySummary.contracts) ? hookHistorySummary.contracts.length : 0,
                    totalNetworkContractCount: networkContracts.length,
                    hookHistorySnapshotCount: Array.isArray(hookHistorySummary.snapshots) ? hookHistorySummary.snapshots.length : 0,
                    requestFieldCount: goals.reduce((sum, goal) => sum + toNumber(goal?.requestKeys?.length, 0), 0),
                    requestFieldPathCount: goals.reduce((sum, goal) => sum + toNumber(goal?.requestKeyPaths?.length, 0), 0)
                },
                missingCritical,
                warnings: uniqueBy(warnings.concat(goals.flatMap(goal => goal.warnings || [])), item => normalizeText(item)).slice(0, 240)
            };
            return sceneResult;
        };
        const buildCreateApiDoc = async (options = {}) => {
            const scenes = Array.isArray(options.scenes) && options.scenes.length
                ? uniqueBy(options.scenes.map(item => String(item || '').trim()).filter(Boolean), item => item)
                : SCENE_NAME_LIST.slice();
            const list = [];
            for (let i = 0; i < scenes.length; i++) {
                const sceneName = scenes[i];
                if (typeof options.onProgress === 'function') {
                    try {
                        options.onProgress({
                            event: 'create_api_doc_scene_start',
                            sceneName,
                            index: i + 1,
                            total: scenes.length
                        });
                    } catch { }
                }
                const row = await buildSceneCreateApiDoc(sceneName, options);
                list.push(row);
                if (typeof options.onProgress === 'function') {
                    try {
                        options.onProgress({
                            event: 'create_api_doc_scene_done',
                            sceneName,
                            index: i + 1,
                            total: scenes.length,
                            ok: !!row?.ok,
                            goalCount: toNumber(row?.goalCount, 0),
                            missingCriticalCount: Array.isArray(row?.missingCritical) ? row.missingCritical.length : 0
                        });
                    } catch { }
                }
            }
            const allGoals = list.flatMap(item => Array.isArray(item?.goals) ? item.goals : []);
            const missingCritical = list.flatMap(item => Array.isArray(item?.missingCritical) ? item.missingCritical : []);
            const result = {
                ok: missingCritical.length === 0,
                source: 'network_listener_and_cache',
                generatedAt: new Date().toISOString(),
                scenes,
                count: list.length,
                successCount: list.filter(item => item?.ok).length,
                failCount: list.filter(item => !item?.ok).length,
                goalCount: allGoals.length,
                requestFieldCount: allGoals.reduce((sum, goal) => sum + toNumber(goal?.requestKeys?.length, 0), 0),
                requestFieldPathCount: allGoals.reduce((sum, goal) => sum + toNumber(goal?.requestKeyPaths?.length, 0), 0),
                missingCriticalCount: missingCritical.length,
                missingCritical,
                list
            };
            window.__AM_WXT_SCENE_CREATE_API_REPORT__ = result;
            return result;
        };
        const parseCreateEndpointFromMethodPath = (value = '') => {
            const text = String(value || '').trim();
            if (!text) return '';
            const match = text.match(/^[A-Z]+\s+(.+)$/);
            return normalizeCapturePath(match ? match[1] : text);
        };
        const buildTemplateTimestamp = (date = new Date()) => {
            const d = date instanceof Date ? date : new Date();
            const pad = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
        };
        const buildDefaultCommonByScene = (sceneName = '') => {
            if (sceneName === '关键词推广') {
                return {
                    bidMode: 'smart',
                    useWordPackage: DEFAULTS.useWordPackage,
                    keywordMode: 'mixed',
                    keywordDefaults: {
                        matchScope: 4,
                        bidPrice: 1,
                        onlineStatus: 1
                    }
                };
            }
            return {};
        };
        const buildDefaultPlanByScene = (sceneName = '', stamp = '', suffix = '') => {
            const baseName = `${sceneName || '计划'}_${stamp}${suffix}`;
            const plan = {
                planName: baseName
            };
            if (isSceneLikelyRequireItem(sceneName)) {
                plan.itemId = '';
            }
            if (sceneName === '关键词推广') {
                plan.keywords = [''];
            }
            return plan;
        };
        const normalizeSceneSettingTemplateKey = (text = '') => normalizeText(String(text || '').replace(/[：:]/g, '')).trim();
        const stringifySceneSettingTemplateValue = (value) => {
            if (value === undefined || value === null) return '';
            if (typeof value === 'string') {
                return normalizeSceneSettingValue(value);
            }
            if (typeof value === 'number' || typeof value === 'boolean') {
                return String(value);
            }
            try {
                return JSON.stringify(value);
            } catch {
                return '';
            }
        };
        const flattenObjectToSceneSettingKeyValues = (source = null, prefix = '', options = {}) => {
            const maxDepth = Math.max(1, Math.min(8, toNumber(options.maxDepth, 6)));
            const out = [];
            const walk = (node, basePath = '', depth = 0) => {
                if (depth > maxDepth) return;
                if (Array.isArray(node)) {
                    if (!basePath) return;
                    const text = stringifySceneSettingTemplateValue(node);
                    if (!text) return;
                    out.push({ key: basePath, value: text });
                    return;
                }
                if (!isPlainObject(node)) {
                    if (!basePath) return;
                    const text = stringifySceneSettingTemplateValue(node);
                    if (!text) return;
                    out.push({ key: basePath, value: text });
                    return;
                }
                const keys = Object.keys(node).slice(0, 280);
                keys.forEach(key => {
                    const normalizedKey = String(key || '').trim();
                    if (!normalizedKey) return;
                    const nextPath = basePath ? `${basePath}.${normalizedKey}` : normalizedKey;
                    const value = node[normalizedKey];
                    if (isPlainObject(value)) {
                        walk(value, nextPath, depth + 1);
                        return;
                    }
                    if (Array.isArray(value)) {
                        const text = stringifySceneSettingTemplateValue(value);
                        if (!text) return;
                        out.push({ key: nextPath, value: text });
                        return;
                    }
                    const text = stringifySceneSettingTemplateValue(value);
                    if (!text) return;
                    out.push({ key: nextPath, value: text });
                });
            };
            walk(source, String(prefix || '').trim(), 0);
            return uniqueBy(
                out.filter(item => normalizeSceneSettingTemplateKey(item?.key || '') && normalizeSceneSettingValue(item?.value || '')),
                item => `${normalizeSceneSettingTemplateKey(item.key)}::${normalizeSceneSettingValue(item.value)}`
            ).slice(0, 2000);
        };
        const appendGoalContractDefaultsToSceneSettings = (goal = null, applyDefault = () => { }, allowEmptyKeys = false) => {
            const createContract = isPlainObject(goal?.createContract) ? goal.createContract : {};
            const runtimeSnapshot = isPlainObject(goal?.runtimeSnapshot) ? goal.runtimeSnapshot : {};
            const campaignDefaults = isPlainObject(createContract?.defaultCampaign) ? createContract.defaultCampaign : {};
            const adgroupDefaults = isPlainObject(createContract?.defaultAdgroup) ? createContract.defaultAdgroup : {};

            // runtimeSnapshot 存在但 defaultCampaign 缺失时，仍确保关键字段可配置。
            Object.keys(runtimeSnapshot || {}).forEach(key => {
                const normalizedKey = String(key || '').trim();
                if (!normalizedKey || campaignDefaults[normalizedKey] !== undefined) return;
                campaignDefaults[normalizedKey] = runtimeSnapshot[normalizedKey];
            });

            flattenObjectToSceneSettingKeyValues(campaignDefaults, 'campaign', { maxDepth: 6 })
                .forEach(entry => {
                    applyDefault(entry.key, entry.value);
                });
            flattenObjectToSceneSettingKeyValues(adgroupDefaults, 'adgroup', { maxDepth: 6 })
                .forEach(entry => {
                    applyDefault(entry.key, entry.value);
                });
            if (allowEmptyKeys) {
                const normalizePathKey = (path = '') => String(path || '')
                    .trim()
                    .replace(/^(campaign|adgroup)\./i, '')
                    .replace(/\[\]/g, '')
                    .replace(/\.+/g, '.')
                    .replace(/^\.+|\.+$/g, '');
                const appendPathList = (prefix = '', list = []) => {
                    (Array.isArray(list) ? list : [])
                        .map(item => normalizePathKey(item))
                        .filter(Boolean)
                        .slice(0, 1200)
                        .forEach(path => {
                            applyDefault(`${prefix}.${path}`, '', true);
                        });
                };
                appendPathList('campaign', createContract?.campaignKeyPaths || []);
                appendPathList('adgroup', createContract?.adgroupKeyPaths || []);
            }
        };
        const pickSceneSettingDefaultFromFieldRow = (row = {}) => {
            const defaultValue = normalizeSceneSettingValue(row?.defaultValue || '');
            if (defaultValue) return defaultValue;
            const options = Array.isArray(row?.options) ? row.options : [];
            const firstOption = options
                .map(item => normalizeSceneSettingValue(item))
                .find(Boolean);
            return firstOption || '';
        };
        const collectGoalFieldRowsForTemplate = (sceneName = '', goal = null, goalLabel = '') => {
            const targetScene = String(sceneName || '').trim();
            const normalizedGoalLabel = normalizeGoalLabel(goalLabel || goal?.goalLabel || '');
            const rowSeeds = [];
            if (Array.isArray(goal?.fieldRows) && goal.fieldRows.length) {
                rowSeeds.push(...goal.fieldRows);
            }
            if (Array.isArray(goal?.settingsRows) && goal.settingsRows.length) {
                rowSeeds.push(...goal.settingsRows);
            }
            if (isPlainObject(goal?.fieldMatrix)) {
                Object.keys(goal.fieldMatrix).forEach(label => {
                    const matrixRow = goal.fieldMatrix[label];
                    if (!matrixRow) return;
                    rowSeeds.push({
                        label,
                        options: Array.isArray(matrixRow?.options) ? matrixRow.options : [],
                        defaultValue: matrixRow?.defaultValue || ''
                    });
                });
            }
            if (!rowSeeds.length) {
                rowSeeds.push(...getSceneGoalFieldRowFallback(targetScene, normalizedGoalLabel));
            }
            return normalizeGoalFieldRows(rowSeeds);
        };
        const buildSceneSettingsTemplateByGoal = ({
            sceneName = '',
            goalLabel = '',
            goal = null,
            planTemplate = null,
            contractHints = {}
        } = {}) => {
            const targetScene = String(sceneName || '').trim();
            const normalizedGoal = normalizeGoalLabel(goalLabel || goal?.goalLabel || '');
            const output = {};
            const applyDefault = (key = '', value = '', allowEmpty = false) => {
                const normalizedKey = normalizeSceneSettingTemplateKey(key);
                const normalizedValue = normalizeSceneSettingValue(value);
                if (!normalizedKey) return;
                const currentValue = normalizeSceneSettingValue(output[normalizedKey]);
                if (currentValue) return;
                if (!normalizedValue && !allowEmpty) return;
                output[normalizedKey] = normalizedValue;
            };
            applyDefault('场景名称', targetScene);
            if (normalizedGoal) {
                applyDefault('营销目标', normalizedGoal);
            }
            const fieldRows = collectGoalFieldRowsForTemplate(targetScene, goal, normalizedGoal);
            fieldRows.forEach(row => {
                const fieldLabel = normalizeSceneSettingTemplateKey(row?.label || row?.settingKey || '');
                if (!fieldLabel) return;
                applyDefault(fieldLabel, pickSceneSettingDefaultFromFieldRow(row));
            });
            const fallbackDefaults = isPlainObject(SCENE_SPEC_FIELD_FALLBACK[targetScene]) ? SCENE_SPEC_FIELD_FALLBACK[targetScene] : {};
            Object.keys(fallbackDefaults).forEach(key => {
                applyDefault(key, fallbackDefaults[key]);
            });
            appendGoalContractDefaultsToSceneSettings(goal, applyDefault, true);
            const normalizePath = (path = '') => String(path || '')
                .trim()
                .replace(/^(campaign|adgroup)\./i, '')
                .replace(/\[\]/g, '')
                .replace(/\.+/g, '.')
                .replace(/^\.+|\.+$/g, '');
            const appendHintPaths = (prefix = '', paths = []) => {
                (Array.isArray(paths) ? paths : [])
                    .map(item => normalizePath(item))
                    .filter(Boolean)
                    .slice(0, 1200)
                    .forEach(path => applyDefault(`${prefix}.${path}`, '', true));
            };
            appendHintPaths('campaign', contractHints?.campaignKeyPaths || []);
            appendHintPaths('adgroup', contractHints?.adgroupKeyPaths || []);
            const planName = normalizeSceneSettingValue(planTemplate?.planName || '');
            if (planName) {
                applyDefault('计划名称', planName);
            }
            return output;
        };
        const normalizeTemplateSceneListInput = (source = null) => {
            if (Array.isArray(source)) return source;
            if (isPlainObject(source)) {
                if (Array.isArray(source.scenes)) return source.scenes;
                if (Array.isArray(source.list)) return source.list;
                if (Array.isArray(source.results)) return source.results;
            }
            const fromWindow = window.__AM_WXT_SCENE_CREATE_API_REPORT__;
            if (isPlainObject(fromWindow)) {
                if (Array.isArray(fromWindow.list)) return fromWindow.list;
                if (Array.isArray(fromWindow.scenes)) return fromWindow.scenes;
            }
            return [];
        };
        const inferCreateInterfacesFromSceneEntry = (entry = {}) => {
            if (Array.isArray(entry?.createInterfaces) && entry.createInterfaces.length) {
                return deepClone(entry.createInterfaces);
            }
            if (Array.isArray(entry?.createContracts) && entry.createContracts.length) {
                return summarizeCreateInterfacesFromContracts(entry.createContracts);
            }
            return [];
        };
        const buildSceneGoalRequestTemplates = async (source = null, options = {}) => {
            const sceneEntries = normalizeTemplateSceneListInput(source);
            const requestedScenes = Array.isArray(options?.scenes) && options.scenes.length
                ? uniqueBy(options.scenes.map(item => String(item || '').trim()).filter(Boolean), item => item)
                : [];
            const sceneNameList = requestedScenes.length
                ? requestedScenes
                : uniqueBy(sceneEntries.map(item => String(item?.sceneName || '').trim()).filter(Boolean), item => item);
            const fallbackScenes = sceneNameList.length ? sceneNameList : SCENE_NAME_LIST.slice();
            const stamp = buildTemplateTimestamp(new Date());
            const outList = [];

            for (let i = 0; i < fallbackScenes.length; i++) {
                const sceneName = fallbackScenes[i];
                const sceneEntry = sceneEntries.find(item => String(item?.sceneName || '').trim() === sceneName) || {};
                const createInterfaces = inferCreateInterfacesFromSceneEntry(sceneEntry);
                const createEndpoints = uniqueBy(
                    (Array.isArray(sceneEntry?.createEndpoints) ? sceneEntry.createEndpoints : []).map(item => String(item || '').trim()).filter(Boolean),
                    item => item
                );
                let goals = Array.isArray(sceneEntry?.goals) ? sceneEntry.goals : [];
                const warnings = [];
                if (!goals.length && options.resolveGoals !== false) {
                    try {
                        const sceneGoalResult = await extractSceneGoalSpecs(sceneName, {
                            scanMode: options.scanMode || 'visible',
                            unlockPolicy: options.unlockPolicy || 'safe_only',
                            refresh: !!options.refresh,
                            contractMode: 'network_only'
                        });
                        if (Array.isArray(sceneGoalResult?.goals) && sceneGoalResult.goals.length) {
                            goals = sceneGoalResult.goals;
                        }
                        if (Array.isArray(sceneGoalResult?.warnings) && sceneGoalResult.warnings.length) {
                            warnings.push(...sceneGoalResult.warnings);
                        }
                    } catch (err) {
                        warnings.push(`读取营销目标失败：${err?.message || err}`);
                    }
                }
                const normalizedGoals = uniqueBy(
                    (Array.isArray(goals) ? goals : []).map(goal => ({
                        goalLabel: normalizeGoalLabel(goal?.goalLabel || ''),
                        isDefault: !!goal?.isDefault,
                        raw: isPlainObject(goal) ? deepClone(goal) : {}
                    })).filter(goal => goal.goalLabel),
                    goal => goal.goalLabel
                );
                if (!normalizedGoals.length) {
                    normalizedGoals.push({
                        goalLabel: '',
                        isDefault: true,
                        raw: {}
                    });
                } else if (!normalizedGoals.some(goal => goal.isDefault)) {
                    normalizedGoals[0].isDefault = true;
                }

                const preferredInterface = createInterfaces
                    .slice()
                    .sort((a, b) => toNumber(b?.count, 0) - toNumber(a?.count, 0))[0] || null;
                const submitEndpoint = normalizeCapturedCreateEndpoint(
                    preferredInterface?.path
                    || parseCreateEndpointFromMethodPath(createEndpoints[0] || '')
                    || ''
                );
                const contractHints = {
                    requestKeys: Array.isArray(preferredInterface?.requestKeys) ? preferredInterface.requestKeys.slice(0, 240) : [],
                    requestKeyPaths: Array.isArray(preferredInterface?.requestKeyPaths) ? preferredInterface.requestKeyPaths.slice(0, 1400) : [],
                    solutionKeys: Array.isArray(preferredInterface?.solutionKeys) ? preferredInterface.solutionKeys.slice(0, 240) : [],
                    solutionKeyPaths: Array.isArray(preferredInterface?.solutionKeyPaths) ? preferredInterface.solutionKeyPaths.slice(0, 1200) : [],
                    campaignKeys: Array.isArray(preferredInterface?.campaignKeys) ? preferredInterface.campaignKeys.slice(0, 240) : [],
                    campaignKeyPaths: Array.isArray(preferredInterface?.campaignKeyPaths) ? preferredInterface.campaignKeyPaths.slice(0, 1200) : [],
                    adgroupKeys: Array.isArray(preferredInterface?.adgroupKeys) ? preferredInterface.adgroupKeys.slice(0, 240) : [],
                    adgroupKeyPaths: Array.isArray(preferredInterface?.adgroupKeyPaths) ? preferredInterface.adgroupKeyPaths.slice(0, 1200) : []
                };

                normalizedGoals.forEach((goal, goalIdx) => {
                    const planTemplate = buildDefaultPlanByScene(sceneName, stamp, String(i * 20 + goalIdx + 1).padStart(2, '0'));
                    const requestTemplate = {
                        sceneName,
                        marketingGoal: goal.goalLabel || '',
                        common: buildDefaultCommonByScene(sceneName),
                        sceneSettings: buildSceneSettingsTemplateByGoal({
                            sceneName,
                            goalLabel: goal.goalLabel || '',
                            goal: goal?.raw || {},
                            planTemplate,
                            contractHints
                        }),
                        plans: [
                            planTemplate
                        ]
                    };
                    if (submitEndpoint) requestTemplate.submitEndpoint = submitEndpoint;
                    outList.push({
                        sceneName,
                        marketingGoal: goal.goalLabel || '',
                        isDefaultGoal: !!goal.isDefault,
                        submitEndpoint,
                        createInterfaces: createInterfaces.slice(0, 12),
                        createEndpoints: createEndpoints.slice(0, 12),
                        contractHints,
                        warnings: uniqueBy(warnings, item => item).slice(0, 40),
                        requestTemplate
                    });
                });
            }

            const templateMap = {};
            outList.forEach(item => {
                const sceneName = item.sceneName || '';
                const goalLabel = item.marketingGoal || '默认目标';
                if (!templateMap[sceneName]) templateMap[sceneName] = {};
                templateMap[sceneName][goalLabel] = deepClone(item.requestTemplate);
            });
            const result = {
                ok: true,
                source: 'capture_report_to_request_templates',
                generatedAt: new Date().toISOString(),
                sceneCount: uniqueBy(outList.map(item => item.sceneName).filter(Boolean), item => item).length,
                templateCount: outList.length,
                list: outList,
                map: templateMap
            };
            window.__AM_WXT_SCENE_GOAL_REQUEST_TEMPLATES__ = result;
            return result;
        };

        const toSafeItemRaw = (item = {}) => {
            const source = isPlainObject(item?.raw) ? item.raw : (isPlainObject(item) ? item : {});
            const materialId = String(source.materialId || source.itemId || item.materialId || item.itemId || '').trim();
            const itemId = String(source.itemId || source.materialId || item.itemId || item.materialId || '').trim();
            const picUrl = source.picUrl
                || source.imgUrl
                || source.imageUrl
                || source.pictUrl
                || source.itemPicUrl
                || source.materialPicUrl
                || source.materialImageUrl
                || source.mainPic
                || '';
            return {
                materialId: materialId || itemId,
                itemId: itemId || materialId,
                materialName: source.materialName || source.title || source.name || '',
                picUrl,
                shopId: source.shopId || '',
                shopName: source.shopName || '',
                linkUrl: source.linkUrl || '',
                bidCount: source.bidCount || 0,
                categoryLevel1: source.categoryLevel1 || ''
            };
        };

        const normalizeItem = (item = {}) => {
            const materialId = String(item.materialId || item.itemId || '').trim();
            const itemId = String(item.itemId || item.materialId || '').trim();
            const raw = isPlainObject(item?.raw) ? item.raw : {};
            const picUrl = item.picUrl
                || item.imgUrl
                || item.imageUrl
                || item.pictUrl
                || item.itemPicUrl
                || item.materialPicUrl
                || item.materialImageUrl
                || item.mainPic
                || raw.picUrl
                || raw.imgUrl
                || raw.imageUrl
                || raw.pictUrl
                || raw.itemPicUrl
                || raw.materialPicUrl
                || raw.materialImageUrl
                || raw.mainPic
                || '';
            return {
                materialId: materialId || itemId,
                itemId: itemId || materialId,
                materialName: item.materialName || item.title || item.name || '',
                picUrl,
                shopId: item.shopId || '',
                shopName: item.shopName || '',
                linkUrl: item.linkUrl || '',
                bidCount: item.bidCount || 0,
                categoryLevel1: item.categoryLevel1 || '',
                fromTab: item.fromTab || 'manual',
                raw: toSafeItemRaw(item)
            };
        };

        const parseItemIdsFromText = (text = '') => {
            const ids = [];
            const regex = /\d{6,}/g;
            let m;
            while ((m = regex.exec(text))) ids.push(m[0]);
            return uniqueBy(ids, id => id);
        };

        const parseQueryToItemIds = (query = '') => {
            if (!query) return [];
            const candidates = query.split(/[,，\s]+/).map(s => s.trim()).filter(Boolean);
            if (!candidates.length) return [];
            if (candidates.every(v => /^\d{6,}$/.test(v))) return uniqueBy(candidates, id => id);
            return [];
        };
