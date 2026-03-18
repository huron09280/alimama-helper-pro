        const validate = (request, options = {}) => {
            const result = { ok: true, errors: [], warnings: [] };
            if (!isPlainObject(request)) {
                result.ok = false;
                result.errors.push('请求体必须是对象');
                return result;
            }
            const sceneName = String(request?.sceneName || '').trim();
            const requiresItem = (options?.requiresItem === true || options?.requiresItem === false)
                ? !!options.requiresItem
                : isSceneLikelyRequireItem(sceneName);
            if (request.plans !== undefined && !Array.isArray(request.plans)) {
                result.ok = false;
                result.errors.push('plans 必须是数组');
            }
            if (Array.isArray(request.plans) && request.plans.length > 0) {
                request.plans.forEach((plan, idx) => {
                    if (!plan || typeof plan !== 'object') {
                        result.ok = false;
                        result.errors.push(`plans[${idx}] 非法`);
                        return;
                    }
                    if (!plan.planName) {
                        result.warnings.push(`plans[${idx}] 未提供 planName，将自动生成`);
                    }
                    if (!plan.item && !plan.itemId) {
                        if (requiresItem) {
                            result.warnings.push(`plans[${idx}] 未提供 item，将尝试从页面已添加商品补齐`);
                        }
                    }
                });
            } else {
                if (requiresItem) {
                    result.warnings.push('未显式提供 plans，将尝试读取当前已添加商品自动生成计划');
                } else {
                    result.warnings.push('未显式提供 plans，将按场景自动生成计划（默认 1 个，可通过 planCount 指定）');
                }
            }
            return result;
        };

        const normalizeSceneSettingsObject = (sceneSettings = {}) => {
            if (!isPlainObject(sceneSettings)) return {};
            const out = {};
            Object.keys(sceneSettings).forEach(key => {
                const normalizedKey = normalizeText(key).replace(/[：:]/g, '').trim();
                if (!normalizedKey) return;
                out[normalizedKey] = normalizeSceneSettingValue(sceneSettings[key]);
            });
            return out;
        };

        const mergeSceneSettingsDefaults = ({
            sceneName = '',
            targetSettings = {},
            spec = null,
            runtime = {}
        }) => {
            const filledDefaults = [];
            const warnings = [];
            const merged = normalizeSceneSettingsObject(targetSettings);
            const applyDefault = (key, value, source) => {
                const normalizedKey = normalizeText(key).replace(/[：:]/g, '').trim();
                const normalizedValue = normalizeSceneSettingValue(value);
                if (!normalizedKey || !normalizedValue) return;
                if (/^计划名称$|^计划名$/.test(normalizedKey)) return;
                if (normalizeSceneSettingValue(merged[normalizedKey]) !== '') return;
                merged[normalizedKey] = normalizedValue;
                filledDefaults.push({
                    key: normalizedKey,
                    value: normalizedValue,
                    source
                });
            };

            const specFields = Array.isArray(spec?.fields) ? spec.fields : [];
            specFields.forEach(field => {
                const settingKey = normalizeText(field?.settingKey || field?.label || '').replace(/[：:]/g, '').trim();
                if (!settingKey) return;
                const defaultValue = normalizeSceneSettingValue(field?.defaultValue || '');
                if (defaultValue) applyDefault(settingKey, defaultValue, 'scene_spec');
            });

            const templateDefaults = deriveTemplateSceneSettings(runtime);
            Object.keys(templateDefaults).forEach(key => {
                applyDefault(key, templateDefaults[key], 'runtime_template');
            });

            const fallbackDefaults = isPlainObject(SCENE_SPEC_FIELD_FALLBACK[sceneName]) ? SCENE_SPEC_FIELD_FALLBACK[sceneName] : {};
            Object.keys(fallbackDefaults).forEach(key => {
                applyDefault(key, fallbackDefaults[key], 'scene_fallback');
            });

            const missingCritical = specFields
                .filter(field => field?.requiredGuess)
                .map(field => normalizeText(field?.settingKey || field?.label || '').replace(/[：:]/g, '').trim())
                .filter(Boolean)
                .filter(key => normalizeSceneSettingValue(merged[key]) === '');
            if (missingCritical.length) {
                warnings.push(`场景「${sceneName || '未命名'}」仍缺少关键字段：${missingCritical.slice(0, 12).join('，')}`);
            }

            return {
                sceneSettings: merged,
                filledDefaults,
                warnings,
                missingCritical
            };
        };

        const validateSceneRequest = async (sceneName, request = {}, options = {}) => {
            const targetScene = String(sceneName || request?.sceneName || inferCurrentSceneName() || '').trim();
            if (!targetScene) {
                return {
                    ok: false,
                    sceneName: '',
                    normalizedRequest: mergeDeep({}, request),
                    resolvedMarketingGoal: '',
                    goalFallbackUsed: false,
                    goalWarnings: [],
                    filledDefaults: [],
                    warnings: ['缺少 sceneName，无法做场景级校验'],
                    missingCritical: ['sceneName']
                };
            }

            let runtime = null;
            try {
                runtime = await getRuntimeDefaults(!!options.forceRuntimeRefresh);
            } catch {
                runtime = {};
            }

            const sceneSpec = await getSceneSpec(targetScene, {
                scanMode: options.scanMode || 'visible',
                unlockPolicy: options.unlockPolicy || 'safe_only',
                goalScan: options.goalScan !== false,
                refresh: !!options.refresh
            });

            const normalizedRequest = mergeDeep({}, request, {
                sceneName: targetScene
            });
            const currentSettings = normalizeSceneSettingsObject(normalizedRequest.sceneSettings || {});
            const defaultsResult = mergeSceneSettingsDefaults({
                sceneName: targetScene,
                targetSettings: currentSettings,
                spec: sceneSpec,
                runtime
            });
            normalizedRequest.sceneSettings = defaultsResult.sceneSettings;

            const sceneBizCode = resolveSceneBizCodeHint(targetScene) || SCENE_BIZCODE_HINT_FALLBACK[targetScene] || '';
            if (!normalizedRequest.bizCode && sceneBizCode) {
                normalizedRequest.bizCode = sceneBizCode;
            }
            const scenePromotionScene = resolveSceneDefaultPromotionScene(targetScene, normalizedRequest.promotionScene || runtime?.promotionScene || '');
            if (!normalizedRequest.promotionScene && scenePromotionScene) {
                normalizedRequest.promotionScene = scenePromotionScene;
            }

            const goalResolution = resolveGoalContextForPlan({
                sceneName: targetScene,
                sceneSpec,
                runtime,
                marketingGoal: normalizedRequest.marketingGoal || normalizedRequest?.common?.marketingGoal || '',
                planName: '',
                planIndex: -1
            });
            if (!isPlainObject(normalizedRequest.common)) {
                normalizedRequest.common = {};
            }
            if (goalResolution.resolvedMarketingGoal) {
                normalizedRequest.marketingGoal = goalResolution.resolvedMarketingGoal;
                if (!normalizedRequest.common.marketingGoal) {
                    normalizedRequest.common.marketingGoal = goalResolution.resolvedMarketingGoal;
                }
            }
            if (goalResolution.endpoint) {
                normalizedRequest.submitEndpoint = normalizeGoalCreateEndpoint(
                    normalizedRequest.submitEndpoint || goalResolution.endpoint
                );
            }
            if (!isPlainObject(normalizedRequest.goalForcedCampaignOverride)) {
                normalizedRequest.goalForcedCampaignOverride = {};
            }
            if (!isPlainObject(normalizedRequest.goalForcedAdgroupOverride)) {
                normalizedRequest.goalForcedAdgroupOverride = {};
            }
            normalizedRequest.goalForcedCampaignOverride = mergeDeep(
                {},
                goalResolution.campaignOverride || {},
                normalizedRequest.goalForcedCampaignOverride || {}
            );
            if (sceneBizCode) {
                const forcedBizCode = normalizeSceneBizCode(normalizedRequest.goalForcedCampaignOverride?.bizCode || '');
                if (forcedBizCode && forcedBizCode !== sceneBizCode) {
                    normalizedRequest.goalForcedCampaignOverride.bizCode = sceneBizCode;
                }
            }
            normalizedRequest.goalForcedAdgroupOverride = mergeDeep(
                {},
                goalResolution.adgroupOverride || {},
                normalizedRequest.goalForcedAdgroupOverride || {}
            );

            const runtimePatch = goalResolution.runtimePatch || {};
            if (!normalizedRequest.bizCode && runtimePatch.bizCode) {
                normalizedRequest.bizCode = runtimePatch.bizCode;
            }
            if (!normalizedRequest.promotionScene && runtimePatch.promotionScene) {
                normalizedRequest.promotionScene = runtimePatch.promotionScene;
            }
            normalizedRequest.__sceneSpec = sceneSpec && sceneSpec.ok ? deepClone(sceneSpec) : null;
            normalizedRequest.__goalResolution = {
                resolvedMarketingGoal: goalResolution.resolvedMarketingGoal || '',
                goalFallbackUsed: !!goalResolution.goalFallbackUsed,
                goalWarnings: goalResolution.goalWarnings || [],
                availableGoals: goalResolution.availableGoalLabels || [],
                goalSpec: goalResolution.goalSpec ? deepClone(goalResolution.goalSpec) : null,
                endpoint: goalResolution.endpoint || '',
                contractHints: isPlainObject(goalResolution.contractHints) ? deepClone(goalResolution.contractHints) : {}
            };

            const passthroughWarnings = [];
            if (isPlainObject(normalizedRequest.rawOverrides)) {
                const knownCampaignKeys = new Set(Object.keys(runtime?.solutionTemplate?.campaign || {}));
                const rawCampaign = isPlainObject(normalizedRequest.rawOverrides.campaign)
                    ? normalizedRequest.rawOverrides.campaign
                    : normalizedRequest.rawOverrides;
                Object.keys(rawCampaign || {}).forEach(key => {
                    if (!knownCampaignKeys.size || knownCampaignKeys.has(key)) return;
                    passthroughWarnings.push(`rawOverrides.campaign.${key} 非模板字段，按透传提交`);
                });
            }

            return {
                ok: true,
                sceneName: targetScene,
                normalizedRequest,
                filledDefaults: defaultsResult.filledDefaults,
                resolvedMarketingGoal: goalResolution.resolvedMarketingGoal || '',
                goalFallbackUsed: !!goalResolution.goalFallbackUsed,
                goalWarnings: goalResolution.goalWarnings || [],
                warnings: defaultsResult.warnings.concat(goalResolution.goalWarnings || [], passthroughWarnings),
                missingCritical: defaultsResult.missingCritical,
                sceneSpecMeta: {
                    ok: !!sceneSpec?.ok,
                    sceneName: sceneSpec?.sceneName || targetScene,
                    fieldCount: sceneSpec?.coverage?.fieldCount || 0,
                    goalCount: sceneSpec?.coverage?.goalCount || sceneSpec?.goalCoverage?.goalCount || 0,
                    snapshotCount: sceneSpec?.coverage?.snapshotCount || 0,
                    scanMode: sceneSpec?.scanMode || options.scanMode || 'visible'
                },
                sceneSpec: sceneSpec?.ok ? deepClone(sceneSpec) : null
            };
        };

        const createPlansBatch = async (request = {}, options = {}) => {
            const validation = validate(request, {
                requiresItem: isSceneLikelyRequireItem(String(request?.sceneName || '').trim())
            });
            if (!validation.ok) {
                return { ok: false, partial: false, validation, successCount: 0, failCount: 0, successes: [], failures: [] };
            }

            const mergedRequest = mergeDeep({}, request);
            const fallbackPolicy = normalizeFallbackPolicy(
                options?.fallbackPolicy || mergedRequest?.fallbackPolicy || 'confirm',
                'confirm'
            );
            const conflictPolicy = String(
                options?.conflictPolicy
                || mergedRequest?.conflictPolicy
                || 'none'
            ).trim() || 'none';
            const stopScope = String(
                options?.stopScope
                || mergedRequest?.stopScope
                || REPAIR_DEFAULTS.stopScope
                || 'same_item_only'
            ).trim() || 'same_item_only';
            mergedRequest.fallbackPolicy = fallbackPolicy;
            if (!isPlainObject(mergedRequest.common)) {
                mergedRequest.common = {};
            }
            if (!isPlainObject(mergedRequest.sceneSettings)) {
                mergedRequest.sceneSettings = {};
            }
            const settingEntriesForGoal = normalizeSceneSettingEntries(mergedRequest.sceneSettings);
            const settingGoalEntry = findSceneSettingEntry(settingEntriesForGoal, [/营销目标/, /优化目标/]);
            const settingGoalLabel = normalizeGoalLabel(settingGoalEntry?.value || '');
            if (settingGoalLabel) {
                if (!normalizeGoalLabel(mergedRequest.marketingGoal || '')) {
                    mergedRequest.marketingGoal = settingGoalLabel;
                }
                if (!normalizeGoalLabel(mergedRequest?.common?.marketingGoal || '')) {
                    mergedRequest.common.marketingGoal = settingGoalLabel;
                }
            }
            mergedRequest.common.bidMode = normalizeBidMode(
                mergedRequest?.common?.bidMode
                || mergedRequest?.bidMode
                || mergedRequest?.bidTypeV2
                || DEFAULTS.bidTypeV2,
                'smart'
            );
            const requestedSceneName = String(mergedRequest.sceneName || '').trim();
            const expectedSceneBizCode = normalizeSceneBizCode(resolveSceneBizCodeHint(requestedSceneName));
            if (!mergedRequest.bizCode && expectedSceneBizCode) {
                mergedRequest.bizCode = expectedSceneBizCode;
            } else if (mergedRequest.bizCode) {
                mergedRequest.bizCode = normalizeSceneBizCode(mergedRequest.bizCode);
            }

            let runtime = await getRuntimeDefaults(!!options.forceRuntimeRefresh);
            const requireTemplateForScene = options.requireSceneTemplate === true
                && requestedSceneName
                && requestedSceneName !== '关键词推广';
            const isRuntimeTemplateReadyForScene = (runtimeRef = {}) => {
                if (!requireTemplateForScene) return true;
                const hasTemplateCampaign = isPlainObject(runtimeRef?.solutionTemplate?.campaign)
                    && Object.keys(runtimeRef.solutionTemplate.campaign).length > 0;
                if (!hasTemplateCampaign) return false;
                const templateBizCode = normalizeSceneBizCode(runtimeRef?.solutionTemplate?.bizCode || '');
                if (!expectedSceneBizCode || !templateBizCode) return true;
                return templateBizCode === expectedSceneBizCode;
            };
            const isSceneRuntimeReady = (runtimeRef = {}) => (
                isRuntimeBizCodeMatched(runtimeRef, expectedSceneBizCode, {
                    includeRoute: !requireTemplateForScene
                })
                && isRuntimeTemplateReadyForScene(runtimeRef)
            );
            const shouldSyncSceneRuntime = options.syncSceneRuntime === true;
            const strictSceneRuntimeMatch = options.strictSceneRuntimeMatch === true;
            if (shouldSyncSceneRuntime
                && requestedSceneName
                && expectedSceneBizCode
                && !isSceneRuntimeReady(runtime)) {
                emitProgress(options, 'scene_runtime_sync_start', {
                    sceneName: requestedSceneName,
                    currentBizCode: resolveRuntimeBizCode(runtime) || '',
                    expectedBizCode: expectedSceneBizCode
                });
                try {
                    const syncOptions = options.sceneSyncOptions || {};
                    const sceneSyncRetry = Math.max(3, toNumber(
                        syncOptions.retry,
                        toNumber(options.sceneSyncRetry, 8)
                    ));
                    const sceneSyncIntervalMs = Math.max(240, toNumber(
                        syncOptions.retryIntervalMs,
                        toNumber(options.sceneSyncIntervalMs, 420)
                    ));
                    await ensureSceneRoute(requestedSceneName, syncOptions);
                    await waitForDomStable(syncOptions);
                    let syncedRuntime = null;
                    for (let attempt = 0; attempt < sceneSyncRetry; attempt++) {
                        syncedRuntime = await getRuntimeDefaults(true);
                        if (!expectedSceneBizCode || isSceneRuntimeReady(syncedRuntime)) break;
                        await sleep(sceneSyncIntervalMs);
                    }
                    runtime = syncedRuntime || runtime;
                    const syncedBizCode = resolveRuntimeBizCode(runtime) || '';
                    emitProgress(options, 'scene_runtime_synced', {
                        sceneName: requestedSceneName,
                        currentBizCode: syncedBizCode,
                        expectedBizCode: expectedSceneBizCode,
                        matched: isSceneRuntimeReady(runtime),
                        templateReady: isRuntimeTemplateReadyForScene(runtime),
                        templateBizCode: normalizeSceneBizCode(runtime?.solutionTemplate?.bizCode || '')
                    });
                } catch (err) {
                    emitProgress(options, 'scene_runtime_sync_failed', {
                        sceneName: requestedSceneName,
                        currentBizCode: resolveRuntimeBizCode(runtime) || '',
                        expectedBizCode: expectedSceneBizCode,
                        error: err?.message || String(err)
                    });
                }
            }
            const sceneRuntimeMismatch = !!(
                requestedSceneName
                && expectedSceneBizCode
                && !isRuntimeBizCodeMatched(runtime, expectedSceneBizCode, {
                    includeRoute: !requireTemplateForScene
                })
            );
            if (sceneRuntimeMismatch && strictSceneRuntimeMatch) {
                const currentRuntimeBizCode = resolveRuntimeBizCode(runtime) || '';
                emitProgress(options, 'scene_runtime_sync_abort', {
                    sceneName: requestedSceneName,
                    currentBizCode: currentRuntimeBizCode,
                    expectedBizCode: expectedSceneBizCode
                });
                return {
                    ok: false,
                    partial: false,
                    validation,
                    successCount: 0,
                    failCount: 1,
                    successes: [],
                    failures: [{
                        error: `场景运行时同步失败：当前 ${currentRuntimeBizCode || 'unknown'}，期望 ${expectedSceneBizCode}（${requestedSceneName}）`
                    }]
                };
            }
            if (sceneRuntimeMismatch && !strictSceneRuntimeMatch) {
                emitProgress(options, 'scene_runtime_sync_bypass', {
                    sceneName: requestedSceneName,
                    currentBizCode: resolveRuntimeBizCode(runtime) || '',
                    expectedBizCode: expectedSceneBizCode
                });
            }

            const runtimeTemplateBizCode = normalizeSceneBizCode(runtime?.solutionTemplate?.bizCode || '');
            if (requireTemplateForScene && !isRuntimeTemplateReadyForScene(runtime)) {
                const currentRuntimeBizCode = resolveRuntimeBizCode(runtime) || '';
                emitProgress(options, 'scene_runtime_sync_abort', {
                    sceneName: requestedSceneName,
                    currentBizCode: currentRuntimeBizCode,
                    expectedBizCode: expectedSceneBizCode,
                    error: `场景运行时模板未就绪：当前模板 ${runtimeTemplateBizCode || 'unknown'}，期望 ${expectedSceneBizCode}`
                });
                return {
                    ok: false,
                    partial: false,
                    validation,
                    successCount: 0,
                    failCount: 1,
                    successes: [],
                    failures: [{
                        error: `场景运行时模板未就绪：当前模板 ${runtimeTemplateBizCode || 'unknown'}，期望 ${expectedSceneBizCode}（${requestedSceneName}）`
                    }]
                };
            }

            const sceneNameHint = mergedRequest.sceneName || requestedSceneName || '';
            const useKeywordDefaults = sceneNameHint === '关键词推广';
            runtime.bizCode = normalizeSceneBizCode(mergedRequest.bizCode || runtime.bizCode || DEFAULTS.bizCode);
            runtime.promotionScene = mergedRequest.promotionScene || runtime.promotionScene || (useKeywordDefaults ? DEFAULTS.promotionScene : '');
            runtime.itemSelectedMode = mergedRequest.itemSelectedMode || runtime.itemSelectedMode || (useKeywordDefaults ? DEFAULTS.itemSelectedMode : '');
            runtime.bidTypeV2 = mergedRequest.bidTypeV2 || runtime.bidTypeV2 || (useKeywordDefaults ? DEFAULTS.bidTypeV2 : '');
            runtime.bidTargetV2 = mergedRequest.bidTargetV2 || runtime.bidTargetV2 || (useKeywordDefaults ? DEFAULTS.bidTargetV2 : '');
            if (!useKeywordDefaults) {
                if (!mergedRequest.bidTypeV2) runtime.bidTypeV2 = '';
                if (!mergedRequest.bidTargetV2) runtime.bidTargetV2 = '';
            }
            runtime.dmcType = mergedRequest.dmcType || runtime.dmcType || DEFAULTS.dmcType;
            if (!mergedRequest.sceneName) {
                const inferredSceneName = inferCurrentSceneName();
                if (SCENE_NAME_LIST.includes(inferredSceneName)) {
                    mergedRequest.sceneName = inferredSceneName;
                }
            }
            const sceneNameForRuntime = mergedRequest.sceneName || requestedSceneName || '';
            let sceneSpecForGoal = isPlainObject(mergedRequest.__sceneSpec) ? mergedRequest.__sceneSpec : null;
            if ((!sceneSpecForGoal || !Array.isArray(sceneSpecForGoal?.goals))
                && sceneNameForRuntime
                && options.applySceneSpec === true) {
                try {
                    sceneSpecForGoal = await getSceneSpec(sceneNameForRuntime, {
                        scanMode: options.goalScanMode || options.scanMode || 'visible',
                        unlockPolicy: options.goalUnlockPolicy || options.unlockPolicy || 'safe_only',
                        goalScan: options.goalScan !== false,
                        refresh: !!options.refreshSceneSpec
                    });
                } catch { }
            }

            const requestGoalContext = resolveGoalContextForPlan({
                sceneName: sceneNameForRuntime,
                sceneSpec: sceneSpecForGoal,
                runtime,
                marketingGoal: mergedRequest.marketingGoal || mergedRequest?.common?.marketingGoal || mergedRequest?.__goalResolution?.resolvedMarketingGoal || '',
                planName: '',
                planIndex: -1
            });
            if (requestGoalContext.goalWarnings.length) {
                emitProgress(options, 'goal_resolution_warning', {
                    sceneName: sceneNameForRuntime,
                    resolvedMarketingGoal: requestGoalContext.resolvedMarketingGoal || '',
                    goalFallbackUsed: !!requestGoalContext.goalFallbackUsed,
                    warnings: requestGoalContext.goalWarnings.slice(0, 20)
                });
            }
            mergedRequest.__goalResolution = {
                resolvedMarketingGoal: requestGoalContext.resolvedMarketingGoal || '',
                goalFallbackUsed: !!requestGoalContext.goalFallbackUsed,
                goalWarnings: requestGoalContext.goalWarnings || [],
                availableGoals: requestGoalContext.availableGoalLabels || [],
                goalSpec: requestGoalContext.goalSpec ? deepClone(requestGoalContext.goalSpec) : null,
                endpoint: requestGoalContext.endpoint || ''
            };
            if (requestGoalContext.resolvedMarketingGoal) {
                mergedRequest.marketingGoal = requestGoalContext.resolvedMarketingGoal;
                mergedRequest.common.marketingGoal = mergedRequest.common.marketingGoal || requestGoalContext.resolvedMarketingGoal;
            }
            mergedRequest.submitEndpoint = normalizeGoalCreateEndpoint(
                mergedRequest.submitEndpoint
                || requestGoalContext.endpoint
                || SCENE_CREATE_ENDPOINT_FALLBACK
            );
            mergedRequest.goalForcedCampaignOverride = mergeDeep(
                {},
                requestGoalContext.campaignOverride || {},
                mergedRequest.goalForcedCampaignOverride || {}
            );
            if (expectedSceneBizCode) {
                const forcedBizCode = normalizeSceneBizCode(mergedRequest.goalForcedCampaignOverride?.bizCode || '');
                if (forcedBizCode && forcedBizCode !== expectedSceneBizCode) {
                    mergedRequest.goalForcedCampaignOverride.bizCode = expectedSceneBizCode;
                }
            }
            const sceneKeepBidTypeV2 = SCENE_BIDTYPE_V2_ONLY.has(sceneNameForRuntime);
            if (!sceneKeepBidTypeV2) {
                delete mergedRequest.goalForcedCampaignOverride.bidTypeV2;
                delete mergedRequest.goalForcedCampaignOverride.bidTargetV2;
                delete mergedRequest.goalForcedCampaignOverride.optimizeTarget;
            }
            mergedRequest.goalForcedAdgroupOverride = mergeDeep(
                {},
                requestGoalContext.adgroupOverride || {},
                mergedRequest.goalForcedAdgroupOverride || {}
            );
            runtime = mergeRuntimeWithGoalPatch(runtime, requestGoalContext.runtimePatch || {});
            if (expectedSceneBizCode) {
                runtime.bizCode = expectedSceneBizCode;
            }
            if (!sceneKeepBidTypeV2) {
                if (!mergedRequest.bidTypeV2) runtime.bidTypeV2 = '';
                if (!mergedRequest.bidTargetV2) runtime.bidTargetV2 = '';
                if (!mergedRequest.optimizeTarget && !mergedRequest?.common?.campaignOverride?.optimizeTarget) {
                    runtime.optimizeTarget = '';
                }
            }

            const keywordGoalRuntimeAtRequest = sceneNameForRuntime === '关键词推广'
                ? resolveKeywordGoalRuntimeFallback(
                    mergedRequest.marketingGoal
                    || mergedRequest?.common?.marketingGoal
                    || settingGoalLabel
                    || ''
                )
                : {};
            const forcedPromotionScene = sceneNameForRuntime === '关键词推广'
                ? String(
                    mergedRequest?.goalForcedCampaignOverride?.promotionScene
                    || mergedRequest.promotionScene
                    || runtime.promotionScene
                    || keywordGoalRuntimeAtRequest?.promotionScene
                    || resolveSceneDefaultPromotionScene(sceneNameForRuntime, '')
                ).trim()
                : resolveSceneDefaultPromotionScene(sceneNameForRuntime, '');
            if (forcedPromotionScene) {
                mergedRequest.promotionScene = forcedPromotionScene;
                runtime.promotionScene = forcedPromotionScene;
            }
            if (sceneNameForRuntime === '关键词推广') {
                const forcedItemSelectedMode = String(
                    mergedRequest?.goalForcedCampaignOverride?.itemSelectedMode
                    || mergedRequest.itemSelectedMode
                    || runtime.itemSelectedMode
                    || keywordGoalRuntimeAtRequest?.itemSelectedMode
                    || DEFAULTS.itemSelectedMode
                ).trim();
                mergedRequest.itemSelectedMode = forcedItemSelectedMode || DEFAULTS.itemSelectedMode;
                runtime.itemSelectedMode = forcedItemSelectedMode || DEFAULTS.itemSelectedMode;
                mergedRequest.common.bidMode = normalizeBidMode(
                    mergedRequest?.common?.bidMode || mergedRequest?.bidMode || mergedRequest?.bidTypeV2 || DEFAULTS.bidTypeV2,
                    'smart'
                );
                runtime.bidTypeV2 = bidModeToBidType(mergedRequest.common.bidMode);
            }

            if (!isPlainObject(mergedRequest.sceneSettings)) {
                mergedRequest.sceneSettings = {};
            }
            const sceneConfigMapping = resolveSceneSettingOverrides({
                sceneName: sceneNameForRuntime,
                sceneSettings: mergedRequest.sceneSettings,
                runtime
            });
            mergedRequest.sceneForcedCampaignOverride = sceneConfigMapping.campaignOverride || {};
            mergedRequest.sceneForcedAdgroupOverride = sceneConfigMapping.adgroupOverride || {};

            const mappedCampaignOverride = mergeDeep(
                {},
                sceneConfigMapping.campaignOverride || {},
                mergedRequest?.common?.campaignOverride || {}
            );
            if (sceneNameForRuntime === '关键词推广') {
                const keywordGoalRuntime = resolveKeywordGoalRuntimeFallback(
                    mergedRequest.marketingGoal
                    || mergedRequest?.common?.marketingGoal
                    || settingGoalLabel
                    || ''
                );
                const keywordPromotionScene = String(
                    mappedCampaignOverride.promotionScene
                    || mergedRequest?.goalForcedCampaignOverride?.promotionScene
                    || mergedRequest.promotionScene
                    || runtime.promotionScene
                    || keywordGoalRuntime?.promotionScene
                    || resolveSceneDefaultPromotionScene(sceneNameForRuntime, '')
                ).trim();
                if (keywordPromotionScene) {
                    mergedRequest.promotionScene = keywordPromotionScene;
                    runtime.promotionScene = keywordPromotionScene;
                }
                const keywordItemSelectedMode = String(
                    mappedCampaignOverride.itemSelectedMode
                    || mergedRequest?.goalForcedCampaignOverride?.itemSelectedMode
                    || mergedRequest.itemSelectedMode
                    || runtime.itemSelectedMode
                    || keywordGoalRuntime?.itemSelectedMode
                    || DEFAULTS.itemSelectedMode
                ).trim();
                if (keywordItemSelectedMode) {
                    mergedRequest.itemSelectedMode = keywordItemSelectedMode;
                    runtime.itemSelectedMode = keywordItemSelectedMode;
                }
            }
            runtime.bidTypeV2 = mappedCampaignOverride.bidTypeV2
                || mergedRequest.bidTypeV2
                || runtime.bidTypeV2
                || SCENE_BIDTYPE_V2_DEFAULT[sceneNameForRuntime]
                || '';
            runtime.bidTargetV2 = mappedCampaignOverride.bidTargetV2
                || mappedCampaignOverride.optimizeTarget
                || mergedRequest.bidTargetV2
                || runtime.bidTargetV2
                || (sceneNameForRuntime === '关键词推广' ? DEFAULTS.bidTargetV2 : '');
            if (!sceneKeepBidTypeV2) {
                if (!mergedRequest.bidTypeV2 && !mappedCampaignOverride.bidTypeV2) {
                    runtime.bidTypeV2 = '';
                }
                if (!mergedRequest.bidTargetV2 && !mappedCampaignOverride.bidTargetV2 && !mappedCampaignOverride.optimizeTarget) {
                    runtime.bidTargetV2 = '';
                }
            }
            runtime.dmcType = mappedCampaignOverride.dmcType
                || mergedRequest.dmcType
                || runtime.dmcType
                || DEFAULTS.dmcType;

            const sceneCapabilities = resolveSceneCapabilities({
                sceneName: mergedRequest.sceneName || requestedSceneName,
                runtime,
                request: mergedRequest
            });
            const inputPlans = Array.isArray(mergedRequest.plans) ? mergedRequest.plans : [];
            const hasPlansWithoutItem = inputPlans.some(plan => isPlainObject(plan) && !plan.item && !plan.itemId);
            const shouldResolvePreferredItems = sceneCapabilities.requiresItem || !!mergedRequest.itemSearch || hasPlansWithoutItem;

            emitProgress(options, 'resolve_items_start', {
                sceneName: sceneCapabilities.sceneName,
                requiresItem: sceneCapabilities.requiresItem,
                resolvePreferredItems: shouldResolvePreferredItems
            });
            const preferredItems = shouldResolvePreferredItems
                ? await resolvePreferredItems(mergedRequest, runtime)
                : [];
            let plans = normalizePlans(mergedRequest, preferredItems, {
                requiresItem: sceneCapabilities.requiresItem
            });
            const planGoalWarnings = [];
            plans = plans.map((plan, idx) => {
                const goalContext = resolveGoalContextForPlan({
                    sceneName: sceneCapabilities.sceneName || sceneNameForRuntime,
                    sceneSpec: sceneSpecForGoal,
                    runtime,
                    marketingGoal: plan?.marketingGoal || mergedRequest.marketingGoal || mergedRequest?.common?.marketingGoal || '',
                    planName: plan?.planName || '',
                    planIndex: idx
                });
                if (goalContext.goalWarnings.length) {
                    planGoalWarnings.push(...goalContext.goalWarnings);
                }
                const planGoalCampaignOverride = mergeDeep(
                    {},
                    goalContext.campaignOverride || {},
                    plan?.goalForcedCampaignOverride || {}
                );
                if (expectedSceneBizCode) {
                    const forcedBizCode = normalizeSceneBizCode(planGoalCampaignOverride?.bizCode || '');
                    if (forcedBizCode && forcedBizCode !== expectedSceneBizCode) {
                        planGoalCampaignOverride.bizCode = expectedSceneBizCode;
                    }
                }
                if (!sceneKeepBidTypeV2) {
                    delete planGoalCampaignOverride.bidTypeV2;
                    delete planGoalCampaignOverride.bidTargetV2;
                    delete planGoalCampaignOverride.optimizeTarget;
                }
                return {
                    ...plan,
                    marketingGoal: goalContext.resolvedMarketingGoal || normalizeGoalLabel(plan?.marketingGoal || mergedRequest.marketingGoal || ''),
                    goalForcedCampaignOverride: planGoalCampaignOverride,
                    goalForcedAdgroupOverride: mergeDeep(
                        {},
                        goalContext.adgroupOverride || {},
                        plan?.goalForcedAdgroupOverride || {}
                    ),
                    submitEndpoint: normalizeGoalCreateEndpoint(
                        plan?.submitEndpoint
                        || goalContext.endpoint
                        || mergedRequest.submitEndpoint
                        || SCENE_CREATE_ENDPOINT_FALLBACK
                    ),
                    __goalResolution: {
                        resolvedMarketingGoal: goalContext.resolvedMarketingGoal || '',
                        goalFallbackUsed: !!goalContext.goalFallbackUsed,
                        goalWarnings: goalContext.goalWarnings || [],
                        availableGoals: goalContext.availableGoalLabels || [],
                        goalSpec: goalContext.goalSpec ? deepClone(goalContext.goalSpec) : null,
                        endpoint: goalContext.endpoint || ''
                    }
                };
            });
            if (planGoalWarnings.length) {
                emitProgress(options, 'goal_resolution_warning', {
                    sceneName: sceneCapabilities.sceneName || sceneNameForRuntime,
                    resolvedMarketingGoal: mergedRequest.marketingGoal || '',
                    goalFallbackUsed: false,
                    warnings: uniqueBy(planGoalWarnings, item => item).slice(0, 50)
                });
            }
            const forcedDmcType = mappedCampaignOverride.dmcType || '';
            if (forcedDmcType) {
                const targetBudgetField = DMC_BUDGET_FIELD_MAP[forcedDmcType] || 'dayAverageBudget';
                plans.forEach(plan => {
                    if (!isPlainObject(plan?.budget)) return;
                    let budgetValue = NaN;
                    BUDGET_FIELDS.forEach(field => {
                        if (Number.isFinite(budgetValue) && budgetValue > 0) return;
                        if (plan.budget[field] === undefined || plan.budget[field] === null || plan.budget[field] === '') return;
                        budgetValue = toNumber(plan.budget[field], NaN);
                    });
                    if (!Number.isFinite(budgetValue) || budgetValue <= 0) return;
                    plan.budget = { [targetBudgetField]: budgetValue };
                });
            }
            if (!plans.length) {
                return {
                    ok: false,
                    partial: false,
                    validation,
                    successCount: 0,
                    failCount: 1,
                    successes: [],
                    failures: [{
                        error: sceneCapabilities.requiresItem
                            ? '未找到可用商品，请先添加商品或提供 plans/itemSearch'
                            : '未生成可提交计划，请检查 plans 或 planCount 参数'
                    }]
                };
            }

            emitProgress(options, 'build_solution_start', { planCount: plans.length });
            const builtList = [];
            const prebuildFailures = [];
            for (let i = 0; i < plans.length; i++) {
                const plan = plans[i];
                emitProgress(options, 'build_solution_item', { index: i + 1, total: plans.length, planName: plan.planName });
                try {
                    const built = await buildSolutionFromPlan({
                        plan,
                        request: mergedRequest,
                        runtime,
                        requestOptions: options.requestOptions || {}
                    });
                    builtList.push(built);
                } catch (err) {
                    const errorText = err?.message || String(err) || '构建计划失败';
                    prebuildFailures.push({
                        planName: String(plan?.planName || '').trim(),
                        item: isPlainObject(plan?.item) ? plan.item : null,
                        marketingGoal: normalizeGoalLabel(
                            plan?.marketingGoal
                            || mergedRequest?.marketingGoal
                            || mergedRequest?.common?.marketingGoal
                            || ''
                        ),
                        submitEndpoint: normalizeGoalCreateEndpoint(
                            plan?.submitEndpoint
                            || mergedRequest?.submitEndpoint
                            || SCENE_CREATE_ENDPOINT_FALLBACK
                        ),
                        error: errorText
                    });
                    emitProgress(options, 'build_solution_failed', {
                        index: i + 1,
                        total: plans.length,
                        planName: plan?.planName || '',
                        error: errorText
                    });
                }
            }
            if (!builtList.length) {
                return {
                    ok: false,
                    partial: false,
                    validation,
                    successCount: 0,
                    failCount: prebuildFailures.length || 1,
                    successes: [],
                    failures: prebuildFailures.length
                        ? prebuildFailures
                        : [{ error: '未生成可提交计划，请检查场景配置' }]
                };
            }
            if (builtList.length) {
                const sample = builtList[0]?.solution || {};
                const sampleMeta = builtList[0]?.meta || {};
                const sampleCampaign = isPlainObject(sample.campaign) ? sample.campaign : {};
                const sampleAdgroup = isPlainObject(sample.adgroupList?.[0]) ? sample.adgroupList[0] : {};
                emitProgress(options, 'submit_payload_snapshot', {
                    sceneName: mergedRequest.sceneName || '',
                    marketingGoal: sampleMeta?.marketingGoal || mergedRequest.marketingGoal || '',
                    promotionScene: sampleCampaign.promotionScene || runtime.promotionScene || '',
                    bidTypeV2: sampleCampaign.bidTypeV2 || '',
                    bidTargetV2: sampleCampaign.bidTargetV2 || '',
                    optimizeTarget: sampleCampaign.optimizeTarget || '',
                    bidMode: sampleMeta?.bidMode || '',
                    submitEndpoint: sampleMeta?.submitEndpoint || mergedRequest.submitEndpoint || SCENE_CREATE_ENDPOINT_FALLBACK,
                    materialId: sampleAdgroup?.material?.materialId || '',
                    wordListCount: Array.isArray(sampleAdgroup?.wordList) ? sampleAdgroup.wordList.length : 0,
                    wordPackageCount: Array.isArray(sampleAdgroup?.wordPackageList) ? sampleAdgroup.wordPackageList.length : 0,
                    fallbackTriggered: !!sampleMeta?.fallbackTriggered,
                    goalFallbackUsed: !!sampleMeta?.goalFallbackUsed,
                    campaignKeys: Object.keys(sampleCampaign).slice(0, 80),
                    adgroupKeys: Object.keys(sampleAdgroup).slice(0, 80)
                });
            }
            if (options.dryRunOnly === true) {
                const sampleEntry = builtList[0] || {};
                const sampleSolution = sampleEntry?.solution || {};
                const sampleCampaign = isPlainObject(sampleSolution.campaign) ? deepClone(sampleSolution.campaign) : {};
                const sampleAdgroup = isPlainObject(sampleSolution.adgroupList?.[0]) ? deepClone(sampleSolution.adgroupList[0]) : {};
                const sampleMeta = isPlainObject(sampleEntry?.meta) ? deepClone(sampleEntry.meta) : {};
                return {
                    ok: prebuildFailures.length === 0,
                    partial: prebuildFailures.length > 0,
                    dryRunOnly: true,
                    validation,
                    planCount: builtList.length,
                    successCount: 0,
                    failCount: prebuildFailures.length,
                    successes: [],
                    failures: prebuildFailures,
                    submitEndpoint: normalizeGoalCreateEndpoint(
                        sampleMeta?.submitEndpoint
                        || mergedRequest.submitEndpoint
                        || SCENE_CREATE_ENDPOINT_FALLBACK
                    ),
                    submitPayloadSnapshot: {
                        sceneName: mergedRequest.sceneName || '',
                        marketingGoal: sampleMeta?.marketingGoal || mergedRequest.marketingGoal || '',
                        promotionScene: sampleCampaign.promotionScene || runtime.promotionScene || '',
                        bidTypeV2: sampleCampaign.bidTypeV2 || '',
                        bidTargetV2: sampleCampaign.bidTargetV2 || '',
                        optimizeTarget: sampleCampaign.optimizeTarget || '',
                        bidMode: sampleMeta?.bidMode || '',
                        submitEndpoint: normalizeGoalCreateEndpoint(
                            sampleMeta?.submitEndpoint
                            || mergedRequest.submitEndpoint
                            || SCENE_CREATE_ENDPOINT_FALLBACK
                        ),
                        materialId: sampleAdgroup?.material?.materialId || '',
                        wordListCount: Array.isArray(sampleAdgroup?.wordList) ? sampleAdgroup.wordList.length : 0,
                        wordPackageCount: Array.isArray(sampleAdgroup?.wordPackageList) ? sampleAdgroup.wordPackageList.length : 0,
                        fallbackTriggered: !!sampleMeta?.fallbackTriggered,
                        goalFallbackUsed: !!sampleMeta?.goalFallbackUsed,
                        campaignKeys: Object.keys(sampleCampaign).slice(0, 80),
                        adgroupKeys: Object.keys(sampleAdgroup).slice(0, 80)
                    },
                    sample: {
                        campaign: sampleCampaign,
                        adgroup: sampleAdgroup,
                        meta: sampleMeta
                    }
                };
            }

            const chunkSize = Math.max(1, toNumber(options.chunkSize, toNumber(mergedRequest.chunkSize, DEFAULTS.chunkSize)));
            const batchRetry = Math.max(0, toNumber(options.batchRetry, DEFAULTS.batchRetry));
            const parallelSubmitTimes = Math.max(1, toNumber(
                options.parallelSubmitTimes,
                toNumber(mergedRequest.parallelSubmitTimes, 1)
            ));
            const disableFallbackSingleRetry = options.disableFallbackSingleRetry === true
                || mergedRequest.disableFallbackSingleRetry === true;
            const resolveEntrySubmitEndpoint = (entry = {}) => normalizeGoalCreateEndpoint(
                entry?.meta?.submitEndpoint
                || mergedRequest.submitEndpoint
                || SCENE_CREATE_ENDPOINT_FALLBACK
            );
            const groupedBatches = (() => {
                const map = new Map();
                builtList.forEach(entry => {
                    const endpoint = resolveEntrySubmitEndpoint(entry);
                    if (!map.has(endpoint)) map.set(endpoint, []);
                    map.get(endpoint).push(entry);
                });
                const out = [];
                Array.from(map.keys()).forEach(endpoint => {
                    const list = map.get(endpoint) || [];
                    chunk(list, chunkSize).forEach(entries => {
                        out.push({ endpoint, entries });
                    });
                });
                return out;
            })();
            const successes = [];
            const failures = prebuildFailures.slice();
            const rawResponses = [];
            const buildFailureFromEntry = (entry = {}, fallbackError = '') => ({
                planName: entry?.meta?.planName || '',
                item: entry?.meta?.item || null,
                marketingGoal: entry?.meta?.marketingGoal || '',
                submitEndpoint: entry?.meta?.submitEndpoint || '',
                error: String(entry?.lastError || entry?.meta?.lastError || fallbackError || '服务端未返回 campaignId')
            });
            const submitSinglePlanInParallel = async (entry = null, endpoint = '', submitTimes = 1) => {
                if (!entry || submitTimes <= 1) return null;
                const singleEndpoint = normalizeGoalCreateEndpoint(endpoint || resolveEntrySubmitEndpoint(entry));
                const tasks = [];
                for (let i = 0; i < submitTimes; i++) {
                    tasks.push((async () => {
                        try {
                            const res = await requestOne(singleEndpoint, runtime.bizCode, {
                                bizCode: runtime.bizCode,
                                solutionList: [entry.solution]
                            }, options.requestOptions || {});
                            return { ok: true, res };
                        } catch (err) {
                            return {
                                ok: false,
                                error: err?.message || String(err)
                            };
                        }
                    })());
                }
                const settled = await Promise.all(tasks);
                const successList = [];
                const failureList = [];
                settled.forEach(item => {
                    if (item.ok) {
                        rawResponses.push(item.res);
                        const outcome = parseAddListOutcome(item.res, [entry]);
                        if (Array.isArray(outcome?.successes) && outcome.successes.length) {
                            successList.push(outcome.successes[0]);
                        } else {
                            const fallbackFailure = Array.isArray(outcome?.failures) && outcome.failures.length
                                ? outcome.failures[0]
                                : buildFailureFromEntry(entry, 'parallel_submit_failed');
                            failureList.push(fallbackFailure);
                        }
                        return;
                    }
                    failureList.push(buildFailureFromEntry(entry, item.error || 'parallel_submit_failed'));
                });
                if (successList.length) {
                    return {
                        ok: true,
                        success: successList[0],
                        successCopies: successList.length,
                        failCopies: failureList.length
                    };
                }
                const firstFailure = failureList[0] || buildFailureFromEntry(entry, 'parallel_submit_failed');
                return {
                    ok: false,
                    failure: firstFailure,
                    error: firstFailure.error || 'parallel_submit_failed',
                    successCopies: 0,
                    failCopies: failureList.length
                };
            };

            for (let batchIndex = 0; batchIndex < groupedBatches.length; batchIndex++) {
                const batchPayload = groupedBatches[batchIndex] || {};
                const batchEndpoint = normalizeGoalCreateEndpoint(batchPayload.endpoint || SCENE_CREATE_ENDPOINT_FALLBACK);
                const batch = Array.isArray(batchPayload.entries) ? batchPayload.entries : [];
                emitProgress(options, 'submit_batch_start', {
                    batchIndex: batchIndex + 1,
                    batchTotal: groupedBatches.length,
                    size: batch.length,
                    endpoint: batchEndpoint
                });

                let remainingEntries = batch.slice();
                let batchError = null;
                for (let attempt = 1; attempt <= batchRetry + 1; attempt++) {
                    const useParallelSingleSubmit = remainingEntries.length === 1 && parallelSubmitTimes > 1;
                    if (useParallelSingleSubmit) {
                        const parallelEntry = remainingEntries[0];
                        emitProgress(options, 'submit_batch_parallel_start', {
                            batchIndex: batchIndex + 1,
                            batchTotal: groupedBatches.length,
                            endpoint: batchEndpoint,
                            submitTimes: parallelSubmitTimes,
                            planName: parallelEntry?.meta?.planName || ''
                        });
                        const parallelResult = await submitSinglePlanInParallel(
                            parallelEntry,
                            batchEndpoint,
                            parallelSubmitTimes
                        );
                        if (parallelResult?.ok && parallelResult.success) {
                            successes.push(parallelResult.success);
                            emitProgress(options, 'submit_batch_success', {
                                batchIndex: batchIndex + 1,
                                createdCount: 1,
                                failedCount: 0,
                                endpoint: batchEndpoint,
                                submitTimes: parallelSubmitTimes,
                                successCopies: parallelResult.successCopies,
                                failCopies: parallelResult.failCopies
                            });
                            remainingEntries = [];
                            break;
                        }
                        const parallelErrorText = parallelResult?.error || 'parallel_submit_failed';
                        batchError = new Error(parallelErrorText);
                        emitProgress(options, 'submit_batch_success', {
                            batchIndex: batchIndex + 1,
                            createdCount: 0,
                            failedCount: 1,
                            endpoint: batchEndpoint,
                            submitTimes: parallelSubmitTimes,
                            successCopies: parallelResult?.successCopies || 0,
                            failCopies: parallelResult?.failCopies || 0,
                            error: parallelErrorText
                        });
                        if (attempt < batchRetry + 1) {
                            emitProgress(options, 'submit_batch_retry', {
                                batchIndex: batchIndex + 1,
                                attempt,
                                endpoint: batchEndpoint,
                                error: parallelErrorText
                            });
                            await sleep(1200);
                            continue;
                        }
                        remainingEntries = [mergeDeep({}, parallelEntry, {
                            lastError: parallelErrorText
                        })];
                        break;
                    }
                    const solutionList = remainingEntries.map(entry => entry.solution);
                    try {
                        const res = await requestOne(batchEndpoint, runtime.bizCode, {
                            bizCode: runtime.bizCode,
                            solutionList
                        }, options.requestOptions || {});
                        rawResponses.push(res);
                        const outcome = parseAddListOutcome(res, remainingEntries);
                        if (outcome.successes.length) {
                            successes.push(...outcome.successes);
                        }
                        if (!outcome.failures.length) {
                            emitProgress(options, 'submit_batch_success', {
                                batchIndex: batchIndex + 1,
                                createdCount: outcome.successes.length,
                                failedCount: 0,
                                endpoint: batchEndpoint
                            });
                            remainingEntries = [];
                            break;
                        }

                        const errSummary = outcome.failures.map(item => `${item.planName}: ${item.error}`).join('；');
                        batchError = new Error(errSummary || '服务端未返回 campaignId');
                        emitProgress(options, 'submit_batch_success', {
                            batchIndex: batchIndex + 1,
                            createdCount: outcome.successes.length,
                            failedCount: outcome.failures.length,
                            endpoint: batchEndpoint,
                            error: batchError.message
                        });

                        if (!outcome.successes.length && attempt < batchRetry + 1) {
                            emitProgress(options, 'submit_batch_retry', {
                                batchIndex: batchIndex + 1,
                                attempt,
                                endpoint: batchEndpoint,
                                error: batchError.message
                            });
                            await sleep(1200);
                            continue;
                        }

                        remainingEntries = outcome.failedEntries;
                        break;
                    } catch (err) {
                        batchError = err;
                        emitProgress(options, 'submit_batch_retry', {
                            batchIndex: batchIndex + 1,
                            attempt,
                            endpoint: batchEndpoint,
                            error: err?.message || String(err)
                        });
                        if (attempt < batchRetry + 1) await sleep(1200);
                    }
                }

                if (!remainingEntries.length) continue;
                if (disableFallbackSingleRetry) {
                    remainingEntries.forEach(entry => {
                        failures.push(buildFailureFromEntry(entry, batchError?.message || 'submit_failed'));
                    });
                    continue;
                }

                const singleRetryEntries = remainingEntries.slice();

                emitProgress(options, 'submit_batch_fallback_single', {
                    batchIndex: batchIndex + 1,
                    endpoint: batchEndpoint,
                    error: batchError?.message || String(batchError),
                    fallbackTriggered: false,
                    fallbackPolicy
                });
                for (const entry of singleRetryEntries) {
                    const entrySceneName = String(sceneCapabilities.sceneName || mergedRequest.sceneName || '').trim();
                    const entryItemId = toPositiveIdText(entry?.meta?.item?.materialId || entry?.meta?.item?.itemId || '');
                    const submitSingleEntry = async () => {
                        const singleEndpoint = resolveEntrySubmitEndpoint(entry);
                        const res = await requestOne(singleEndpoint, runtime.bizCode, {
                            bizCode: runtime.bizCode,
                            solutionList: [entry.solution]
                        }, options.requestOptions || {});
                        rawResponses.push(res);
                        return parseAddListOutcome(res, [entry]);
                    };
                    try {
                        let outcome = await submitSingleEntry();
                        if (outcome.successes.length) {
                            successes.push(...outcome.successes);
                        } else {
                            const primaryFailure = outcome.failures[0] || buildFailureFromEntry(entry, 'single_retry_failed');
                            const classification = classifyCreateFailure(primaryFailure?.error || '');
                            let conflictRetried = false;
                            if (classification === 'conflict' && conflictPolicy === 'auto_stop_retry' && entryItemId) {
                                const conflictText = String(primaryFailure?.error || '').trim();
                                const conflictSceneName = /(onebpsite|全站|site)/i.test(conflictText)
                                    ? '货品全站推广'
                                    : (entrySceneName || mergedRequest.sceneName || '');
                                emitProgress(options, 'conflict_resolve_start', {
                                    sceneName: entrySceneName || conflictSceneName || '',
                                    conflictSceneName: conflictSceneName || '',
                                    planName: entry?.meta?.planName || '',
                                    itemId: entryItemId,
                                    error: conflictText
                                });
                                const resolved = await resolveCreateConflicts(primaryFailure, {
                                    sceneName: conflictSceneName || entrySceneName || mergedRequest.sceneName || '',
                                    entrySceneName: entrySceneName || mergedRequest.sceneName || '',
                                    itemId: entryItemId,
                                    bizCode: runtime.bizCode,
                                    requestOptions: options.requestOptions || {},
                                    conflictPolicy,
                                    stopScope,
                                    capture: options.captureConflictLifecycle !== false,
                                    conflictDeleteFallback: options.conflictDeleteFallback !== false,
                                    oneClickConflictResolve: options.oneClickConflictResolve !== false
                                });
                                emitProgress(options, 'conflict_resolve_done', {
                                    sceneName: entrySceneName || conflictSceneName || '',
                                    conflictSceneName: conflictSceneName || '',
                                    planName: entry?.meta?.planName || '',
                                    itemId: entryItemId,
                                    handled: !!resolved?.handled,
                                    resolved: !!resolved?.ok,
                                    stoppedCount: Array.isArray(resolved?.stoppedCampaignIds) ? resolved.stoppedCampaignIds.length : 0,
                                    unresolvedCount: Array.isArray(resolved?.unresolvedCampaignIds) ? resolved.unresolvedCampaignIds.length : 0,
                                    oneClickUsed: !!resolved?.oneClickResult,
                                    oneClickError: resolved?.oneClickResult?.error || '',
                                    error: resolved?.error || ''
                                });
                                if (resolved?.handled && resolved?.ok) {
                                    conflictRetried = true;
                                    outcome = await submitSingleEntry();
                                }
                            }
                            if (outcome.successes.length) {
                                successes.push(...outcome.successes);
                            } else {
                                const finalFailures = Array.isArray(outcome.failures) && outcome.failures.length
                                    ? outcome.failures
                                    : [buildFailureFromEntry(entry, conflictRetried ? 'conflict_resolve_retry_failed' : 'single_retry_failed')];
                                failures.push(...finalFailures);
                            }
                        }
                    } catch (err) {
                        failures.push({
                            planName: entry.meta.planName,
                            item: entry.meta.item,
                            marketingGoal: entry?.meta?.marketingGoal || '',
                            submitEndpoint: entry?.meta?.submitEndpoint || '',
                            error: err?.message || String(err)
                        });
                    }
                }
            }

            const result = {
                ok: failures.length === 0,
                partial: successes.length > 0 && failures.length > 0,
                validation,
                sceneConfigMapping: {
                    sceneName: sceneConfigMapping?.sceneName || mergedRequest.sceneName || '',
                    appliedCount: Array.isArray(sceneConfigMapping?.applied) ? sceneConfigMapping.applied.length : 0,
                    skippedCount: Array.isArray(sceneConfigMapping?.skipped) ? sceneConfigMapping.skipped.length : 0,
                    applied: Array.isArray(sceneConfigMapping?.applied) ? sceneConfigMapping.applied : [],
                    skipped: Array.isArray(sceneConfigMapping?.skipped) ? sceneConfigMapping.skipped : []
                },
                runtime: {
                    bizCode: runtime.bizCode,
                    promotionScene: runtime.promotionScene,
                    itemSelectedMode: runtime.itemSelectedMode,
                    bidTypeV2: runtime.bidTypeV2,
                    bidTargetV2: runtime.bidTargetV2,
                    dmcType: runtime.dmcType
                },
                marketingGoal: mergedRequest?.__goalResolution?.resolvedMarketingGoal || mergedRequest.marketingGoal || '',
                goalFallbackUsed: !!mergedRequest?.__goalResolution?.goalFallbackUsed,
                goalWarnings: Array.isArray(mergedRequest?.__goalResolution?.goalWarnings)
                    ? mergedRequest.__goalResolution.goalWarnings.slice(0, 50)
                    : [],
                submitEndpoint: mergedRequest.submitEndpoint || SCENE_CREATE_ENDPOINT_FALLBACK,
                fallbackPolicy,
                conflictPolicy,
                stopScope,
                successCount: successes.length,
                failCount: failures.length,
                successes,
                failures,
                rawResponses
            };
            emitProgress(options, 'done', result);
            return result;
        };

        const appendKeywords = async (request = {}, options = {}) => {
            const runtime = await getRuntimeDefaults(false);
            runtime.bizCode = request.bizCode || runtime.bizCode;
            runtime.promotionScene = request.promotionScene || runtime.promotionScene;
            runtime.itemSelectedMode = request.itemSelectedMode || runtime.itemSelectedMode;
            runtime.bidTypeV2 = request.bidTypeV2 || runtime.bidTypeV2;
            runtime.bidTargetV2 = request.bidTargetV2 || runtime.bidTargetV2;

            const entries = Array.isArray(request.entries) ? request.entries : [request];
            const results = [];
            for (const entry of entries) {
                const adgroupId = toIdValue(entry.adgroupId);
                if (!adgroupId) {
                    results.push({ ok: false, adgroupId: '', error: '缺少 adgroupId' });
                    continue;
                }
                const keywordDefaults = {
                    bidPrice: toNumber(entry?.keywordDefaults?.bidPrice, toNumber(request?.keywordDefaults?.bidPrice, 1)),
                    matchScope: parseMatchScope(entry?.keywordDefaults?.matchScope, parseMatchScope(request?.keywordDefaults?.matchScope, DEFAULTS.matchScope)),
                    onlineStatus: toNumber(entry?.keywordDefaults?.onlineStatus, toNumber(request?.keywordDefaults?.onlineStatus, DEFAULTS.keywordOnlineStatus))
                };
                const wordList = parseKeywords(entry.keywords || request.keywords || [], keywordDefaults)
                    .map(word => applyKeywordDefaults(word, keywordDefaults))
                    .slice(0, 200);
                if (!wordList.length) {
                    results.push({ ok: false, adgroupId, error: '关键词为空' });
                    continue;
                }

                try {
                    const res = await requestOne(ENDPOINTS.bidwordAdd, runtime.bizCode, {
                        bizCode: runtime.bizCode,
                        promotionScene: runtime.promotionScene,
                        itemSelectedMode: runtime.itemSelectedMode,
                        bidTypeV2: runtime.bidTypeV2,
                        bidTargetV2: runtime.bidTargetV2,
                        adgroupId,
                        wordList
                    }, options.requestOptions || {});
                    results.push({
                        ok: true,
                        adgroupId,
                        wordCount: wordList.length,
                        response: res
                    });
                } catch (err) {
                    results.push({
                        ok: false,
                        adgroupId,
                        wordCount: wordList.length,
                        error: err?.message || String(err)
                    });
                }
            }

            return {
                ok: results.every(item => item.ok),
                partial: results.some(item => item.ok) && results.some(item => !item.ok),
                results
            };
        };

        const suggestKeywords = async (request = {}, options = {}) => {
            const runtime = await getRuntimeDefaults(false);
            runtime.bizCode = request.bizCode || runtime.bizCode || DEFAULTS.bizCode;
            runtime.promotionScene = request.promotionScene || runtime.promotionScene || DEFAULTS.promotionScene;
            runtime.itemSelectedMode = request.itemSelectedMode || runtime.itemSelectedMode || DEFAULTS.itemSelectedMode;
            runtime.bidTypeV2 = request.bidTypeV2 || runtime.bidTypeV2 || DEFAULTS.bidTypeV2;
            runtime.bidTargetV2 = request.bidTargetV2 || runtime.bidTargetV2 || DEFAULTS.bidTargetV2;

            const materialId = request.materialId || request.itemId;
            if (!materialId) {
                return { ok: false, wordList: [], wordPackageList: [], error: '缺少 materialId/itemId' };
            }

            const keywordDefaults = {
                bidPrice: toNumber(request?.keywordDefaults?.bidPrice, 1),
                matchScope: parseMatchScope(request?.keywordDefaults?.matchScope, DEFAULTS.matchScope),
                onlineStatus: toNumber(request?.keywordDefaults?.onlineStatus, DEFAULTS.keywordOnlineStatus)
            };
            const source = request.source || 'auto';
            const limit = Math.max(1, Math.min(200, toNumber(request.limit, DEFAULTS.recommendCount)));
            const [wordList, wordPackageList] = await Promise.all([
                fetchRecommendWordList({
                    bizCode: runtime.bizCode,
                    materialId,
                    defaults: runtime,
                    source,
                    requestOptions: options.requestOptions || {}
                }),
                fetchRecommendWordPackageList({
                    bizCode: runtime.bizCode,
                    materialId,
                    defaults: runtime,
                    requestOptions: options.requestOptions || {}
                })
            ]);

            return {
                ok: true,
                wordList: (Array.isArray(wordList) ? wordList : [])
                    .map(word => applyKeywordDefaults(word, keywordDefaults))
                    .filter(word => word.word)
                    .slice(0, limit),
                wordPackageList: Array.isArray(wordPackageList) ? wordPackageList.slice(0, 100) : []
            };
        };

        const suggestCrowds = async (request = {}, options = {}) => {
            const runtime = await getRuntimeDefaults(false);
            runtime.bizCode = request.bizCode || runtime.bizCode || DEFAULTS.bizCode;
            runtime.promotionScene = request.promotionScene || runtime.promotionScene || DEFAULTS.promotionScene;
            runtime.bidTargetV2 = request.bidTargetV2 || runtime.bidTargetV2 || DEFAULTS.bidTargetV2;
            runtime.subPromotionType = request.subPromotionType || runtime.subPromotionType || DEFAULTS.subPromotionType;
            runtime.promotionType = request.promotionType || runtime.promotionType || DEFAULTS.promotionType;
            const requestMaterialList = Array.isArray(request.materialList)
                ? request.materialList
                : (Array.isArray(request.materialIdList) ? request.materialIdList : []);
            const crowdSuggestList = await fetchRecommendCrowdListByCrowdSuggest({
                bizCode: runtime.bizCode,
                defaults: runtime,
                materialList: requestMaterialList,
                goalLabel: request.marketingGoal || request.goalLabel || request.promotionStrategy || '',
                labelIdList: request.labelIdList || [],
                requestOptions: options.requestOptions || {}
            });
            const crowdList = crowdSuggestList.length
                ? crowdSuggestList
                : await fetchRecommendCrowdList({
                    bizCode: runtime.bizCode,
                    defaults: runtime,
                    labelIdList: request.labelIdList || DEFAULTS.recommendCrowdLabelIds,
                    materialIdList: Array.isArray(request.materialIdList) ? request.materialIdList : [],
                    requestOptions: options.requestOptions || {}
                });
            return {
                ok: true,
                crowdList: crowdList.slice(0, Math.max(1, Math.min(100, toNumber(request.limit, 50))))
            };
        };

