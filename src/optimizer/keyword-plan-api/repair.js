        const cleanupCreatedPlansByLifecycle = async (records = [], options = {}) => {
            const list = Array.isArray(records) ? records : [];
            const deletedCampaignIds = [];
            const pausedFallbackCampaignIds = [];
            const failedList = [];
            for (let i = 0; i < list.length; i++) {
                const entry = list[i] || {};
                const sceneName = String(entry.sceneName || '').trim();
                const campaignId = toPositiveIdText(entry.campaignId || '');
                const itemId = toPositiveIdText(entry.itemId || '');
                if (!sceneName || !campaignId) continue;
                const deleteAction = await executeLifecycleActionByContract(sceneName, 'delete', {
                    itemId,
                    campaignId,
                    campaignIdList: [campaignId],
                    bizCode: options.bizCode || ''
                }, {
                    requestOptions: options.requestOptions || {},
                    capture: options.capture !== false
                });
                if (deleteAction.ok) {
                    deletedCampaignIds.push(campaignId);
                    continue;
                }
                const pauseFallback = await executeLifecycleActionByContract(sceneName, 'pause', {
                    itemId,
                    campaignId,
                    campaignIdList: [campaignId],
                    desiredStatus: 0,
                    bizCode: options.bizCode || ''
                }, {
                    requestOptions: options.requestOptions || {},
                    capture: options.capture !== false
                });
                if (pauseFallback.ok) {
                    pausedFallbackCampaignIds.push(campaignId);
                    failedList.push({
                        sceneName,
                        campaignId,
                        itemId,
                        error: `delete_failed_fallback_paused: ${deleteAction.error || ''}`.trim()
                    });
                } else {
                    failedList.push({
                        sceneName,
                        campaignId,
                        itemId,
                        error: `delete_failed:${deleteAction.error || 'unknown'}; pause_failed:${pauseFallback.error || 'unknown'}`
                    });
                }
            }
            return {
                ok: failedList.length === 0,
                deletedCampaignIds: uniqueBy(deletedCampaignIds, id => id),
                pausedFallbackCampaignIds: uniqueBy(pausedFallbackCampaignIds, id => id),
                failedList
            };
        };

        const buildSceneGoalOptionCaseMatrix = async (sceneName = '', options = {}) => {
            const targetScene = String(sceneName || '').trim();
            if (!targetScene) {
                return {
                    ok: false,
                    sceneName: '',
                    caseCount: 0,
                    list: [],
                    warnings: ['缺少 sceneName']
                };
            }
            const maxGoalsPerScene = Math.max(1, Math.min(40, toNumber(options.maxGoalsPerScene, 24)));
            const maxCasesPerGoal = Math.max(1, Math.min(360, toNumber(options.maxCasesPerGoal, 120)));
            const maxCasesPerScene = Math.max(1, Math.min(900, toNumber(options.maxCasesPerScene, 360)));
            const resolveExplicitGoalLabels = () => {
                if (Array.isArray(options.goalLabels)) {
                    return uniqueBy(
                        options.goalLabels
                            .map(item => normalizeGoalCandidateLabel(item))
                            .filter(Boolean),
                        item => item
                    ).slice(0, 24);
                }
                if (isPlainObject(options.goalLabels)) {
                    const list = options.goalLabels[targetScene];
                    if (!Array.isArray(list)) return [];
                    return uniqueBy(
                        list
                            .map(item => normalizeGoalCandidateLabel(item))
                            .filter(Boolean),
                        item => item
                    ).slice(0, 24);
                }
                return [];
            };
            const explicitGoalLabels = resolveExplicitGoalLabels();
            const quickCaseOnly = options.quickCaseOnly === true;
            const shouldSkipScan = quickCaseOnly || explicitGoalLabels.length > 0 || options.skipGoalSpecScan === true;
            let extracted = { goals: [], warnings: [] };
            if (!shouldSkipScan) {
                extracted = await extractSceneGoalSpecs(targetScene, {
                    scanMode: options.scanMode || 'full_top_down',
                    unlockPolicy: options.unlockPolicy || 'safe_only',
                    goalScan: true,
                    goalFieldScan: options.goalFieldScan !== false,
                    goalFieldScanMode: options.goalFieldScanMode || 'full_top_down',
                    goalFieldMaxDepth: toNumber(options.goalFieldMaxDepth, 2),
                    goalFieldMaxSnapshots: toNumber(options.goalFieldMaxSnapshots, 48),
                    goalFieldMaxGroupsPerLevel: toNumber(options.goalFieldMaxGroupsPerLevel, 6),
                    goalFieldMaxOptionsPerGroup: toNumber(options.goalFieldMaxOptionsPerGroup, 8),
                    refresh: !!options.refreshGoalSpecs
                });
            }
            const goalsRaw = explicitGoalLabels.length
                ? explicitGoalLabels.map((label, idx) => ({
                    goalLabel: label,
                    isDefault: idx === 0,
                    fieldRows: []
                }))
                : (Array.isArray(extracted?.goals) && extracted.goals.length
                    ? extracted.goals
                    : [{ goalLabel: '', isDefault: true, fieldRows: [] }]);
            const fallbackGoalLabels = getSceneMarketingGoalFallbackList(targetScene);
            const goalsExpanded = goalsRaw.slice();
            const existingGoalSet = new Set(
                goalsExpanded.map(goal => normalizeGoalCandidateLabel(goal?.goalLabel || '')).filter(Boolean)
            );
            fallbackGoalLabels.forEach(label => {
                if (existingGoalSet.has(label)) return;
                goalsExpanded.push({
                    goalLabel: label,
                    isDefault: false,
                    fieldRows: []
                });
            });
            const goals = goalsExpanded.slice(0, maxGoalsPerScene);
            const cases = [];
            goals.forEach(goal => {
                const goalLabel = normalizeGoalLabel(goal?.goalLabel || '');
                const fallbackFieldRows = getSceneGoalFieldRowFallback(targetScene, goalLabel);
                const goalForCases = {
                    ...goal,
                    fieldRows: Array.isArray(goal?.fieldRows) && goal.fieldRows.length
                        ? goal.fieldRows
                        : fallbackFieldRows
                };
                if (quickCaseOnly) {
                    cases.push({
                        sceneName: targetScene,
                        goalLabel,
                        caseId: 'goal_default',
                        caseType: 'goal_default',
                        fieldLabel: '',
                        optionValue: '',
                        triggerPath: '',
                        dependsOn: [],
                        sceneSettingsPatch: {}
                    });
                    return;
                }
                const rowCases = buildGoalOptionSimulationCases(goalForCases, {
                    maxOptionsPerField: options.maxOptionsPerField,
                    maxCasesPerGoal,
                    includeBaseCase: options.includeBaseCase !== false
                });
                rowCases.forEach(caseInfo => {
                    cases.push({
                        sceneName: targetScene,
                        goalLabel,
                        caseId: caseInfo.caseId || '',
                        caseType: caseInfo.caseType || 'goal_default',
                        fieldLabel: caseInfo.fieldLabel || '',
                        optionValue: caseInfo.optionValue || '',
                        triggerPath: caseInfo.triggerPath || '',
                        dependsOn: Array.isArray(caseInfo.dependsOn) ? caseInfo.dependsOn.slice(0, 12) : [],
                        sceneSettingsPatch: isPlainObject(caseInfo.sceneSettingsPatch) ? deepClone(caseInfo.sceneSettingsPatch) : {}
                    });
                });
            });
            const deduped = uniqueBy(cases, item => `${item.sceneName}::${item.goalLabel}::${JSON.stringify(normalizeSceneSettingsObject(item.sceneSettingsPatch || {}))}`)
                .slice(0, maxCasesPerScene);
            return {
                ok: true,
                sceneName: targetScene,
                caseCount: deduped.length,
                list: deduped,
                warnings: Array.isArray(extracted?.warnings) ? extracted.warnings.slice(0, 80) : []
            };
        };

        const runCreateRepairByItem = async (itemId, options = {}) => {
            const targetItemId = toPositiveIdText(itemId || options.itemId || options.materialId || '');
            if (!targetItemId) {
                return {
                    ok: false,
                    summary: null,
                    createdCampaignIds: [],
                    stoppedCampaignIds: [],
                    deletedCampaignIds: [],
                    unresolvedFailures: [{
                        sceneName: '',
                        goalLabel: '',
                        caseId: '',
                        error: '缺少 itemId'
                    }],
                    warnings: ['itemId 不能为空']
                };
            }

            const ensureRepairCaseItemBinding = (request = {}, itemIdText = '') => {
                const normalizedItemId = toPositiveIdText(itemIdText);
                if (!normalizedItemId || !isPlainObject(request)) return;
                if (!Array.isArray(request.plans)) request.plans = [];
                if (!isPlainObject(request.plans[0])) request.plans[0] = {};
                const firstPlan = request.plans[0];
                firstPlan.itemId = normalizedItemId;
                const currentItem = isPlainObject(firstPlan.item) ? normalizeItem(firstPlan.item) : null;
                if (!currentItem || !toIdValue(currentItem.materialId || currentItem.itemId)) {
                    firstPlan.item = normalizeItem({
                        materialId: normalizedItemId,
                        itemId: normalizedItemId,
                        materialName: `商品${normalizedItemId}`
                    });
                } else {
                    firstPlan.item = normalizeItem({
                        ...currentItem,
                        materialId: currentItem.materialId || normalizedItemId,
                        itemId: currentItem.itemId || normalizedItemId,
                        materialName: String(currentItem.materialName || '').trim() || `商品${normalizedItemId}`
                    });
                }
                if (!request.itemId) request.itemId = normalizedItemId;
                if (!request.materialId) request.materialId = normalizedItemId;
            };
            const coverageMode = String(options.coverageMode || 'scene_goal_option_full').trim();
            const conflictPolicy = String(options.conflictPolicy || 'auto_stop_retry').trim();
            const stopScope = String(options.stopScope || 'same_item_only').trim();
            const postCleanup = String(options.postCleanup || 'delete').trim();
            const fallbackPolicy = normalizeFallbackPolicy(options.fallbackPolicy || 'auto', 'auto');
            const scenes = Array.isArray(options.scenes) && options.scenes.length
                ? uniqueBy(options.scenes.map(item => String(item || '').trim()).filter(Boolean), item => item)
                : SCENE_NAME_LIST.slice();
            const requestOptions = mergeDeep({
                maxRetries: 1,
                timeout: Math.max(8000, toNumber(options.requestTimeout, 22000))
            }, isPlainObject(options.requestOptions) ? options.requestOptions : {});
            const throttleRetryTimes = Math.max(0, Math.min(6, toNumber(options.throttleRetryTimes, 2)));
            const throttleBackoffMs = Math.max(500, toNumber(options.throttleBackoffMs, 1800));
            const throttleCooldownMs = Math.max(0, toNumber(options.throttleCooldownMs, Math.max(throttleBackoffMs * 2, 3000)));
            const throttleBurstCooldownMs = Math.max(throttleCooldownMs, toNumber(options.throttleBurstCooldownMs, Math.max(throttleBackoffMs * 6, 12000)));
            const throttleBurstThreshold = Math.max(1, Math.min(12, toNumber(options.throttleBurstThreshold, 3)));
            const caseIntervalMs = Math.max(0, toNumber(options.caseIntervalMs, 0));
            const caseIntervalJitterMs = Math.max(0, toNumber(options.caseIntervalJitterMs, 0));
            const resolveCaseIntervalWaitMs = () => {
                if (caseIntervalMs <= 0) return 0;
                if (caseIntervalJitterMs <= 0) return caseIntervalMs;
                const jitter = Math.floor(Math.random() * (caseIntervalJitterMs + 1));
                return caseIntervalMs + jitter;
            };
            const shouldStop = typeof options.shouldStop === 'function'
                ? options.shouldStop
                : () => false;
            const isStopRequested = () => {
                try {
                    return !!shouldStop();
                } catch {
                    return false;
                }
            };
            const skipGoalSpecScan = options.skipGoalSpecScan !== false;
            const quickCaseOnly = coverageMode !== 'scene_goal_option_full';

            const createdRecords = [];
            const stoppedCampaignIds = [];
            const unresolvedFailures = [];
            const byScene = [];
            let globalCaseSeq = 0;
            let stopped = false;

            for (let sceneIdx = 0; sceneIdx < scenes.length; sceneIdx++) {
                if (isStopRequested()) {
                    stopped = true;
                    break;
                }
                const sceneName = scenes[sceneIdx];
                emitProgress(options, 'scene_option_submit_start', {
                    sceneName,
                    index: sceneIdx + 1,
                    total: scenes.length,
                    coverageMode
                });

                const lifecycleReady = await extractLifecycleContracts(sceneName, {
                    refresh: options.refreshLifecycleContracts === true,
                    scanMode: options.scanMode || 'full_top_down',
                    unlockPolicy: options.unlockPolicy || 'safe_only',
                    fromSceneGoalSpecs: options.lifecycleFromSceneGoalSpecs === true,
                    includeActiveCaptures: options.includeActiveCaptures !== false,
                    includeHookHistory: options.includeHookHistory !== false
                });
                const missingLifecycle = Array.isArray(lifecycleReady?.actions)
                    ? lifecycleReady.actions.filter(item => !item?.ok).map(item => item.action)
                    : [];
                if (missingLifecycle.length) {
                    emitProgress(options, 'scene_lifecycle_contract_missing', {
                        sceneName,
                        missingActions: missingLifecycle
                    });
                }

                const matrix = await buildSceneGoalOptionCaseMatrix(sceneName, {
                    ...options,
                    includeBaseCase: true,
                    quickCaseOnly,
                    skipGoalSpecScan
                });
                const cases = Array.isArray(matrix?.list) ? matrix.list : [];
                const sceneStats = {
                    sceneName,
                    total: cases.length,
                    pass: 0,
                    repaired: 0,
                    failed: 0,
                    deleted: 0,
                    stopped: 0
                };
                let throttleStreak = 0;

                for (let caseIdx = 0; caseIdx < cases.length; caseIdx++) {
                    if (isStopRequested()) {
                        stopped = true;
                        break;
                    }
                    if (caseIdx > 0) {
                        const spacingWaitMs = resolveCaseIntervalWaitMs();
                        if (spacingWaitMs > 0) {
                            emitProgress(options, 'case_interval_wait', {
                                sceneName,
                                index: caseIdx + 1,
                                total: cases.length,
                                waitMs: spacingWaitMs
                            });
                            await sleep(spacingWaitMs);
                        }
                    }
                    const caseInfo = cases[caseIdx] || {};
                    globalCaseSeq += 1;
                    const request = buildSmokeTestRequestByScene(sceneName, targetItemId, {
                        index: globalCaseSeq,
                        dayAverageBudget: Math.max(30, toNumber(options.dayAverageBudget, 100))
                    });
                    const casePlanName = `${sceneName}_${nowStampSeconds()}_${String(globalCaseSeq).padStart(4, '0')}`;
                    const goalLabel = normalizeGoalLabel(caseInfo.goalLabel || request.marketingGoal || '');
                    request.marketingGoal = goalLabel || request.marketingGoal || '';
                    request.common = mergeDeep({}, request.common || {}, {
                        marketingGoal: goalLabel || request?.common?.marketingGoal || ''
                    });
                    request.sceneSettings = mergeDeep({}, request.sceneSettings || {}, caseInfo.sceneSettingsPatch || {});
                    if (isPlainObject(options.requestOverrides)) {
                        mergeDeep(request, options.requestOverrides);
                    }
                    ensureRepairCaseItemBinding(request, targetItemId);
                    if (Array.isArray(request?.plans) && request.plans[0]) {
                        request.plans[0].planName = casePlanName;
                    }

                    emitProgress(options, 'case_start', {
                        sceneName,
                        goalLabel,
                        caseId: caseInfo.caseId || '',
                        caseType: caseInfo.caseType || '',
                        index: caseIdx + 1,
                        total: cases.length,
                        planName: request?.plans?.[0]?.planName || ''
                    });

                    const captureStart = startNetworkCapture({ sceneName });
                    let runResult = null;
                    let runError = '';
                    try {
                        runResult = await createPlansByScene(sceneName, request, {
                            fallbackPolicy,
                            batchRetry: Math.max(0, toNumber(options.batchRetry, 1)),
                            chunkSize: Math.max(1, toNumber(options.chunkSize, 1)),
                            applySceneSpec: false,
                            syncSceneRuntime: false,
                            strictSceneRuntimeMatch: false,
                            requestOptions
                        });
                    } catch (err) {
                        runError = err?.message || String(err);
                    }
                    let stoppedCapture = null;
                    try {
                        stoppedCapture = stopNetworkCapture(captureStart?.captureId || '', { withRecords: false });
                    } catch { }
                    if (Array.isArray(stoppedCapture?.contracts) && stoppedCapture.contracts.length) {
                        rememberLifecycleContractsFromContractList(sceneName, stoppedCapture.contracts, {
                            source: 'run_create_repair_case'
                        });
                    }

                    if (!runError && runResult?.ok) {
                        const successCampaignIds = extractCreatedCampaignIdsFromCreateResult(runResult);
                        successCampaignIds.forEach(campaignId => {
                            createdRecords.push({
                                sceneName,
                                goalLabel,
                                caseId: caseInfo.caseId || '',
                                campaignId,
                                itemId: targetItemId
                            });
                        });
                        throttleStreak = 0;
                        sceneStats.pass += 1;
                        continue;
                    }

                    const failures = Array.isArray(runResult?.failures) && runResult.failures.length
                        ? runResult.failures
                        : [{
                            planName: request?.plans?.[0]?.planName || '',
                            item: { materialId: targetItemId },
                            error: runError || 'create_failed'
                        }];
                    const primaryFailure = failures[0] || {};
                    const classification = classifyCreateFailure(primaryFailure?.error || runError || '');
                    if (classification === 'throttle' && throttleRetryTimes > 0) {
                        let throttledRecovered = false;
                        let throttleErrorText = primaryFailure?.error || runError || 'throttle_failed';
                        for (let retryAttempt = 1; retryAttempt <= throttleRetryTimes; retryAttempt += 1) {
                            emitProgress(options, 'throttle_retry_pending', {
                                sceneName,
                                goalLabel,
                                caseId: caseInfo.caseId || '',
                                retryAttempt,
                                retryMax: throttleRetryTimes,
                                waitMs: throttleBackoffMs * retryAttempt,
                                error: throttleErrorText
                            });
                            await sleep(throttleBackoffMs * retryAttempt);
                            if (Array.isArray(request?.plans) && request.plans[0]) {
                                request.plans[0].planName = `${sceneName}_${nowStampSeconds()}_${String(globalCaseSeq).padStart(4, '0')}_throttle_${retryAttempt}`;
                            }
                            ensureRepairCaseItemBinding(request, targetItemId);
                            let retryResult = null;
                            let retryError = '';
                            try {
                                retryResult = await createPlansByScene(sceneName, request, {
                                    fallbackPolicy,
                                    batchRetry: 0,
                                    chunkSize: 1,
                                    applySceneSpec: false,
                                    syncSceneRuntime: false,
                                    strictSceneRuntimeMatch: false,
                                    requestOptions
                                });
                            } catch (err) {
                                retryError = err?.message || String(err);
                            }
                            if (!retryError && retryResult?.ok) {
                                const retrySuccessCampaignIds = extractCreatedCampaignIdsFromCreateResult(retryResult);
                                retrySuccessCampaignIds.forEach(campaignId => {
                                    createdRecords.push({
                                        sceneName,
                                        goalLabel,
                                        caseId: caseInfo.caseId || '',
                                        campaignId,
                                        itemId: targetItemId
                                    });
                                });
                                throttleStreak = 0;
                                sceneStats.pass += 1;
                                sceneStats.repaired += 1;
                                emitProgress(options, 'case_passed_after_throttle_retry', {
                                    sceneName,
                                    goalLabel,
                                    caseId: caseInfo.caseId || '',
                                    retryAttempt,
                                    successCount: retrySuccessCampaignIds.length
                                });
                                throttledRecovered = true;
                                break;
                            }
                            throttleErrorText = retryError || (Array.isArray(retryResult?.failures) && retryResult.failures.length
                                ? retryResult.failures[0]?.error || 'throttle_retry_failed'
                                : 'throttle_retry_failed');
                        }
                        if (throttledRecovered) {
                            continue;
                        }
                        unresolvedFailures.push({
                            sceneName,
                            goalLabel,
                            caseId: caseInfo.caseId || '',
                            itemId: targetItemId,
                            classification,
                            error: throttleErrorText
                        });
                        throttleStreak += 1;
                        const cooldownMs = throttleStreak >= throttleBurstThreshold
                            ? throttleBurstCooldownMs
                            : throttleCooldownMs;
                        if (cooldownMs > 0) {
                            emitProgress(options, 'throttle_cooldown_wait', {
                                sceneName,
                                goalLabel,
                                caseId: caseInfo.caseId || '',
                                throttleStreak,
                                throttleBurstThreshold,
                                waitMs: cooldownMs
                            });
                            await sleep(cooldownMs);
                        }
                        sceneStats.failed += 1;
                        continue;
                    }
                    throttleStreak = 0;
                    if (classification === 'conflict' && conflictPolicy === 'auto_stop_retry') {
                        emitProgress(options, 'conflict_detected', {
                            sceneName,
                            goalLabel,
                            caseId: caseInfo.caseId || '',
                            error: primaryFailure?.error || runError || ''
                        });
                        const resolved = await resolveCreateConflicts(primaryFailure, {
                            sceneName,
                            itemId: targetItemId,
                            conflictPolicy,
                            stopScope,
                            requestOptions,
                            pollTimes: Math.max(1, toNumber(options.pausePollTimes, 3)),
                            pollIntervalMs: Math.max(500, toNumber(options.pausePollIntervalMs, 2000))
                        });
                        if (resolved.stoppedCampaignIds.length) {
                            stoppedCampaignIds.push(...resolved.stoppedCampaignIds);
                            sceneStats.stopped += resolved.stoppedCampaignIds.length;
                        }
                        emitProgress(options, 'pause_retry_result', {
                            sceneName,
                            goalLabel,
                            caseId: caseInfo.caseId || '',
                            stoppedCampaignIds: resolved.stoppedCampaignIds || [],
                            unresolvedCampaignIds: resolved.unresolvedCampaignIds || [],
                            ok: !!resolved.ok
                        });
                        if (resolved.handled) {
                            if (Array.isArray(request?.plans) && request.plans[0]) {
                                request.plans[0].planName = `${sceneName}_${nowStampSeconds()}_${String(globalCaseSeq).padStart(4, '0')}_retry`;
                            }
                            ensureRepairCaseItemBinding(request, targetItemId);
                            let retryResult = null;
                            let retryError = '';
                            try {
                                retryResult = await createPlansByScene(sceneName, request, {
                                    fallbackPolicy,
                                    batchRetry: 0,
                                    chunkSize: 1,
                                    applySceneSpec: false,
                                    syncSceneRuntime: false,
                                    strictSceneRuntimeMatch: false,
                                    requestOptions
                                });
                            } catch (err) {
                                retryError = err?.message || String(err);
                            }
                            if (!retryError && retryResult?.ok) {
                                const retrySuccessCampaignIds = extractCreatedCampaignIdsFromCreateResult(retryResult);
                                retrySuccessCampaignIds.forEach(campaignId => {
                                    createdRecords.push({
                                        sceneName,
                                        goalLabel,
                                        caseId: caseInfo.caseId || '',
                                        campaignId,
                                        itemId: targetItemId
                                    });
                                });
                                sceneStats.pass += 1;
                                sceneStats.repaired += 1;
                                emitProgress(options, 'case_passed_after_repair', {
                                    sceneName,
                                    goalLabel,
                                    caseId: caseInfo.caseId || '',
                                    successCount: retrySuccessCampaignIds.length
                                });
                                continue;
                            }
                            unresolvedFailures.push({
                                sceneName,
                                goalLabel,
                                caseId: caseInfo.caseId || '',
                                itemId: targetItemId,
                                classification,
                                error: retryError || (Array.isArray(retryResult?.failures) && retryResult.failures.length
                                    ? retryResult.failures[0]?.error || 'retry_failed'
                                    : 'retry_failed')
                            });
                            sceneStats.failed += 1;
                            continue;
                        }
                    }

                    unresolvedFailures.push({
                        sceneName,
                        goalLabel,
                        caseId: caseInfo.caseId || '',
                        itemId: targetItemId,
                        classification,
                        error: primaryFailure?.error || runError || 'create_failed'
                    });
                    sceneStats.failed += 1;
                }
                byScene.push(sceneStats);
                emitProgress(options, 'scene_option_submit_done', {
                    sceneName,
                    index: sceneIdx + 1,
                    total: scenes.length,
                    caseCount: sceneStats.total,
                    successCount: sceneStats.pass,
                    failCount: sceneStats.failed,
                    repairedCount: sceneStats.repaired
                });
                if (stopped) break;
            }

            const createdCampaignIds = uniqueBy(
                createdRecords.map(item => toPositiveIdText(item.campaignId)).filter(Boolean),
                item => item
            );
            const stoppedUniqueIds = uniqueBy(stoppedCampaignIds.map(item => toPositiveIdText(item)).filter(Boolean), item => item);
            let deletedCampaignIds = [];
            let cleanupFailures = [];
            if (postCleanup === 'delete' && createdRecords.length) {
                const cleanup = await cleanupCreatedPlansByLifecycle(createdRecords, {
                    requestOptions,
                    capture: options.capture !== false
                });
                deletedCampaignIds = cleanup.deletedCampaignIds || [];
                cleanupFailures = cleanup.failedList || [];
                emitProgress(options, 'delete_cleanup_result', {
                    deletedCount: deletedCampaignIds.length,
                    failedCount: cleanupFailures.length,
                    pausedFallbackCount: Array.isArray(cleanup.pausedFallbackCampaignIds) ? cleanup.pausedFallbackCampaignIds.length : 0
                });
                byScene.forEach(row => {
                    row.deleted = createdRecords.filter(item => item.sceneName === row.sceneName && deletedCampaignIds.includes(item.campaignId)).length;
                });
                cleanupFailures.forEach(item => {
                    unresolvedFailures.push({
                        sceneName: item.sceneName || '',
                        goalLabel: '',
                        caseId: '',
                        itemId: item.itemId || '',
                        classification: 'cleanup',
                        error: item.error || 'cleanup_failed'
                    });
                });
            }

            const summary = {
                coverageMode,
                conflictPolicy,
                stopScope,
                postCleanup,
                fallbackPolicy,
                itemId: targetItemId,
                stopped,
                totalCases: byScene.reduce((sum, row) => sum + toNumber(row.total, 0), 0),
                passCases: byScene.reduce((sum, row) => sum + toNumber(row.pass, 0), 0),
                repairedCases: byScene.reduce((sum, row) => sum + toNumber(row.repaired, 0), 0),
                failedCases: byScene.reduce((sum, row) => sum + toNumber(row.failed, 0), 0),
                deletedCount: deletedCampaignIds.length,
                stoppedCount: stoppedUniqueIds.length,
                byScene
            };
            if (stopped) {
                emitProgress(options, 'repair_stopped', {
                    itemId: targetItemId,
                    totalScenes: scenes.length,
                    processedScenes: byScene.length
                });
            }

            return {
                ok: unresolvedFailures.length === 0 && !stopped,
                stopped,
                summary,
                createdCampaignIds,
                stoppedCampaignIds: stoppedUniqueIds,
                deletedCampaignIds,
                unresolvedFailures
            };
        };

