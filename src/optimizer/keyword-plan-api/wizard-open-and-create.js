        const openWizard = () => {
            mountWizard();
            wizardState.openToken = (toNumber(wizardState.openToken, 0) + 1);
            const openToken = wizardState.openToken;
            const isStaleOpen = () => openToken !== wizardState.openToken;

            const storedDraft = KeywordPlanWizardStore.readSessionDraft() || {};
            if (typeof KeywordPlanRuntime.prepareWizardStateForOpen === 'function') {
                KeywordPlanRuntime.prepareWizardStateForOpen(storedDraft);
            } else {
                wizardState.draft = KeywordPlanWizardStore.hydrateWizardDraftForOpen(storedDraft);
                wizardState.candidateSource = 'all';
                wizardState.addedItems = Array.isArray(wizardState.draft.addedItems)
                    ? wizardState.draft.addedItems.map(normalizeItem).filter(item => item.materialId).slice(0, WIZARD_MAX_ITEMS)
                    : [];
            }

            KeywordPlanPreviewExecutor.renderWizardFromState({ clearLogs: true });
            setRepairControlState(!!wizardState.repairRunning);
            if (wizardState.repairLastSummary) {
                setRepairStatusText(formatRepairStatusText({
                    sceneName: '-',
                    caseIndex: toNumber(wizardState.repairLastSummary.totalCases, 0),
                    caseTotal: toNumber(wizardState.repairLastSummary.totalCases, 0),
                    passCases: toNumber(wizardState.repairLastSummary.passCases, 0),
                    repairedCases: toNumber(wizardState.repairLastSummary.repairedCases, 0),
                    failedCases: toNumber(wizardState.repairLastSummary.failedCases, 0),
                    deletedCount: toNumber(wizardState.repairLastSummary.deletedCount, 0),
                    stoppedCount: toNumber(wizardState.repairLastSummary.stoppedCount, 0)
                }));
            } else {
                setRepairStatusText('场景=- 用例=0/0 通过=0 修复=0 失败=0 删除=0 停止=0');
            }
            wizardState.appendWizardLog(`向导已就绪（构建 ${BUILD_VERSION}），支持双列表选品与批量创建`);
            wizardState.appendWizardLog('正在后台通过接口初始化运行时和商品列表...');

            wizardState.els.overlay.classList.add('open');
            wizardState.visible = true;
            if (!WIZARD_FORCE_API_ONLY_SCENE_CONFIG && typeof wizardState.refreshSceneProfileFromSpec === 'function') {
                wizardState.refreshSceneProfileFromSpec(wizardState.draft.sceneName, {
                    scanMode: 'visible',
                    unlockPolicy: 'safe_only',
                    goalScan: false,
                    silent: true
                });
            }

            if (!wizardState.candidates.length) {
                wizardState.loadCandidates('', wizardState.candidateSource || 'all');
            }

            (async () => {
                let runtimeForInit = null;
                try {
                    runtimeForInit = await getRuntimeDefaults(false);
                    if (isStaleOpen()) return;
                    if (typeof wizardState.applyRuntimeToDraft === 'function') {
                        wizardState.applyRuntimeToDraft(runtimeForInit, wizardState.draft.sceneName);
                    } else {
                        applyRuntimeToDraft(runtimeForInit, wizardState.draft.sceneName);
                    }
                    await ensureSceneDefaultItemForScene({
                        sceneName: wizardState?.draft?.sceneName || '',
                        runtime: runtimeForInit,
                        force: false,
                        silent: false,
                        rerender: false,
                        isStale: () => isStaleOpen()
                    });
                    await syncNativeCrowdDefaultsForScene({
                        sceneName: wizardState?.draft?.sceneName || '',
                        runtime: runtimeForInit,
                        silent: false,
                        rerender: false,
                        isStale: () => isStaleOpen()
                    });
                    if (isStaleOpen()) return;
                    KeywordPlanPreviewExecutor.renderWizardFromState();
                } catch (err) {
                    log.warn('初始化运行时默认值失败:', err?.message || err);
                }

                if (wizardState.addedItems.length) return;
                try {
                    const runtime = runtimeForInit || await getRuntimeDefaults(false);
                    if (isStaleOpen()) return;
                    const preferred = await resolvePreferredItems({}, runtime);
                    if (isStaleOpen()) return;
                    wizardState.addedItems = preferred.slice(0, WIZARD_MAX_ITEMS);
                    wizardState.draft.addedItems = wizardState.addedItems;
                    wizardState.draft.matrixConfig = syncMatrixMaterialDimensionValues(
                        wizardState.draft.matrixConfig,
                        wizardState.addedItems,
                        wizardState.draft.sceneName
                    );
                    KeywordPlanWizardStore.persistDraft();
                    wizardState.renderAddedList();
                    wizardState.renderCandidateList({ preserveScroll: true });
                    KeywordPlanPreviewExecutor.refreshWizardPreview();
                } catch (err) {
                    log.warn('初始化已添加商品失败:', err?.message || err);
                }
            })();
        };

        const getSessionDraft = () => readSessionDraft();
        const withSceneRequest = (sceneName, request = {}) => mergeDeep({}, request, {
            sceneName: String(sceneName || '').trim()
        });
        const createPlansByScene = async (sceneName, request = {}, options = {}) => {
            const nextScene = String(sceneName || request?.sceneName || '').trim();
            const sceneRequest = nextScene ? withSceneRequest(nextScene, request) : mergeDeep({}, request);
            const normalizedOptions = isPlainObject(options) ? mergeDeep({}, options) : {};
            if (WIZARD_FORCE_API_ONLY_SCENE_CONFIG) {
                normalizedOptions.syncSceneRuntime = false;
                normalizedOptions.applySceneSpec = false;
                normalizedOptions.strictSceneRuntimeMatch = false;
                return createPlansBatch(sceneRequest, normalizedOptions);
            }
            if (normalizedOptions?.applySceneSpec === false) {
                return createPlansBatch(sceneRequest, normalizedOptions);
            }
            const sceneValidation = await validateSceneRequest(nextScene, sceneRequest, {
                scanMode: normalizedOptions?.scanMode || 'full_top_down',
                unlockPolicy: normalizedOptions?.unlockPolicy || 'safe_only',
                goalScan: normalizedOptions?.goalScan !== false,
                refresh: !!normalizedOptions?.refreshSceneSpec,
                forceRuntimeRefresh: !!normalizedOptions?.forceRuntimeRefresh
            });
            const normalizedRequest = sceneValidation?.normalizedRequest || sceneRequest;
            const result = await createPlansBatch(normalizedRequest, normalizedOptions);
            result.sceneRequestValidation = {
                filledDefaults: sceneValidation?.filledDefaults || [],
                warnings: sceneValidation?.warnings || [],
                missingCritical: sceneValidation?.missingCritical || [],
                sceneSpecMeta: sceneValidation?.sceneSpecMeta || null,
                resolvedMarketingGoal: sceneValidation?.resolvedMarketingGoal || '',
                goalFallbackUsed: !!sceneValidation?.goalFallbackUsed,
                goalWarnings: sceneValidation?.goalWarnings || []
            };
            return result;
        };
        const buildSmokeTestRequestByScene = (sceneName = '', itemId = '', options = {}) => {
            const stamp = buildTemplateTimestamp(new Date());
            const idx = toNumber(options.index, 1);
            const uniqueTail = `${String(Date.now()).slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
            const defaultPlanName = `${sceneName}_${stamp}_${String(idx).padStart(2, '0')}_${uniqueTail}`;
            const planName = sceneName === '货品全站推广'
                ? `site${stamp}${String(idx).padStart(2, '0')}`
                : defaultPlanName;
            const plan = {
                planName,
                budget: {
                    dayAverageBudget: Math.max(30, toNumber(options.dayAverageBudget, 100))
                }
            };
            if (sceneName === '货品全站推广') {
                plan.budget = {
                    dayBudget: Math.max(30, toNumber(options.dayAverageBudget, 100))
                };
            }
            if (itemId) {
                plan.itemId = String(itemId).trim();
            }
            const req = {
                sceneName,
                plans: [plan]
            };
            if (sceneName === '关键词推广') {
                req.common = {
                    bidMode: 'manual',
                    keywordMode: 'manual',
                    keywordDefaults: {
                        matchScope: 4,
                        bidPrice: 1,
                        onlineStatus: 1
                    }
                };
                plan.keywords = ['测试词A', '测试词B', '测试词C'];
            } else if (sceneName === '内容营销') {
                req.common = {
                    campaignOverride: {
                        launchTime: buildDefaultLaunchTime({ forever: true }),
                        optimizeTarget: 'ad_strategy_buy_net',
                        itemSelectedMode: 'user_define',
                        promotionModel: 'daily',
                        launchPeriodList: buildDefaultLaunchPeriodList(),
                        launchAreaStrList: ['all']
                    }
                };
            } else if (sceneName === '线索推广') {
                plan.budget = {
                    totalBudget: Math.max(1500, toNumber(options.dayAverageBudget, 3000))
                };
                req.common = {
                    campaignOverride: {
                        dmcType: 'total',
                        promotionModel: 'order',
                        promotionModelMarketing: 'strategy',
                        orderChargeType: 'balance_charge',
                        optimizeTarget: 'leads_cost',
                        itemSelectedMode: 'user_define',
                        launchTime: buildDefaultLaunchTime({ days: 7, forever: false }),
                        planId: 308,
                        planTemplateId: 308,
                        packageTemplateId: 74,
                        launchPeriodList: buildDefaultLaunchPeriodList(),
                        launchAreaStrList: ['all']
                    }
                };
            }
            return req;
        };
        const runSceneSmokeTests = async (options = {}) => {
            const itemId = String(options.itemId || options.materialId || '').trim();
            const scenes = Array.isArray(options.scenes) && options.scenes.length
                ? uniqueBy(options.scenes.map(item => String(item || '').trim()).filter(Boolean), item => item)
                : SCENE_NAME_LIST.slice();
            const timeoutMs = Math.max(15000, toNumber(options.timeoutMs, 50000));
            const createMode = options.createMode !== false;
            const captureInterfaces = createMode && options.captureInterfaces !== false;
            const passMode = (() => {
                const mode = String(options.passMode || '').trim();
                if (mode === 'create' || mode === 'both' || mode === 'interface') return mode;
                return createMode ? 'interface' : 'create';
            })();
            const list = [];
            for (let i = 0; i < scenes.length; i++) {
                const sceneName = scenes[i];
                const request = buildSmokeTestRequestByScene(sceneName, itemId, {
                    index: i + 1,
                    dayAverageBudget: toNumber(options.dayAverageBudget, 100)
                });
                const row = {
                    sceneName,
                    itemId,
                    mode: createMode ? 'create' : 'validate',
                    passMode,
                    requestPreview: {
                        planName: request?.plans?.[0]?.planName || '',
                        submitEndpoint: request.submitEndpoint || '',
                        marketingGoal: request.marketingGoal || ''
                    },
                    ok: false,
                    createOk: false,
                    interfaceOk: false,
                    timeout: false,
                    successCount: 0,
                    failCount: 0,
                    submitEndpoint: '',
                    failTop: '',
                    error: '',
                    capture: {
                        enabled: captureInterfaces,
                        captureId: '',
                        recordCount: 0,
                        contractCount: 0,
                        createInterfaceCount: 0,
                        createEndpoints: [],
                        createInterfaces: [],
                        contracts: []
                    },
                    ts: new Date().toISOString()
                };
                if (typeof options.onProgress === 'function') {
                    try {
                        options.onProgress({
                            event: 'scene_smoke_start',
                            sceneName,
                            index: i + 1,
                            total: scenes.length,
                            mode: row.mode,
                            passMode
                        });
                    } catch { }
                }
                if (!createMode) {
                    try {
                        const validation = await validateSceneRequest(sceneName, request, {
                            scanMode: options.scanMode || 'visible',
                            unlockPolicy: options.unlockPolicy || 'safe_only',
                            refresh: !!options.refresh
                        });
                        row.createOk = !!validation?.ok;
                        row.ok = row.createOk;
                        row.successCount = row.ok ? 1 : 0;
                        row.failCount = row.ok ? 0 : 1;
                        row.submitEndpoint = validation?.normalizedRequest?.submitEndpoint || '';
                        row.failTop = Array.isArray(validation?.warnings) ? (validation.warnings[0] || '') : '';
                    } catch (err) {
                        row.error = err?.message || String(err);
                        row.failCount = 1;
                    }
                } else {
                    let captureId = '';
                    if (captureInterfaces) {
                        try {
                            const capture = startNetworkCapture({ sceneName });
                            captureId = capture?.captureId || '';
                            row.capture.captureId = captureId;
                        } catch (err) {
                            row.error = err?.message || String(err);
                        }
                    }
                    const run = createPlansByScene(sceneName, request, {
                        batchRetry: Math.max(0, toNumber(options.batchRetry, 0)),
                        fallbackPolicy: options.fallbackPolicy || 'none',
                        requestOptions: {
                            maxRetries: Math.max(1, toNumber(options.maxRetries, 1)),
                            timeout: Math.max(8000, toNumber(options.requestTimeout, 20000))
                        }
                    });
                    const wrapped = await Promise.race([
                        run.then(res => ({ type: 'result', res })).catch(err => ({ type: 'error', err: err?.message || String(err) })),
                        new Promise(resolve => setTimeout(() => resolve({ type: 'timeout' }), timeoutMs))
                    ]);
                    if (wrapped.type === 'timeout') {
                        row.timeout = true;
                        row.error = `timeout_${timeoutMs}ms`;
                        row.failCount = 1;
                    } else if (wrapped.type === 'error') {
                        row.error = wrapped.err;
                        row.failCount = 1;
                    } else {
                        const res = wrapped.res || {};
                        row.createOk = !!res.ok;
                        row.successCount = toNumber(res.successCount, 0);
                        row.failCount = toNumber(res.failCount, 0);
                        row.submitEndpoint = res.submitEndpoint || '';
                        row.failTop = Array.isArray(res.failures) && res.failures.length
                            ? String(res.failures[0]?.error || '')
                            : '';
                    }
                    if (captureInterfaces && captureId) {
                        try {
                            const stopped = stopNetworkCapture(captureId, {
                                withRecords: !!options.withRecords
                            });
                            row.capture.recordCount = toNumber(stopped?.recordCount, 0);
                            row.capture.contractCount = toNumber(stopped?.contractCount, 0);
                            row.capture.createInterfaceCount = toNumber(stopped?.createInterfaceCount, 0);
                            row.capture.createEndpoints = Array.isArray(stopped?.createEndpoints)
                                ? stopped.createEndpoints.slice(0, 40)
                                : [];
                            row.capture.createInterfaces = Array.isArray(stopped?.createInterfaces)
                                ? stopped.createInterfaces.slice(0, 40)
                                : [];
                            row.capture.contracts = Array.isArray(stopped?.contracts)
                                ? stopped.contracts.slice(0, 120)
                                : [];
                            const rememberedContract = rememberSceneCreateInterfaces(
                                sceneName,
                                request?.marketingGoal || request?.common?.marketingGoal || '',
                                row.capture.createInterfaces,
                                { source: 'scene_smoke_test' }
                            );
                            if (rememberedContract) {
                                row.capture.rememberedContract = {
                                    endpoint: rememberedContract.endpoint || '',
                                    goalLabel: rememberedContract.goalLabel || '',
                                    requestKeyCount: Array.isArray(rememberedContract.requestKeys) ? rememberedContract.requestKeys.length : 0,
                                    campaignKeyCount: Array.isArray(rememberedContract.campaignKeys) ? rememberedContract.campaignKeys.length : 0,
                                    adgroupKeyCount: Array.isArray(rememberedContract.adgroupKeys) ? rememberedContract.adgroupKeys.length : 0
                                };
                            }
                            row.interfaceOk = row.capture.createInterfaceCount > 0;
                            if (!row.submitEndpoint && row.capture.createEndpoints.length) {
                                row.submitEndpoint = parseCreateEndpointFromMethodPath(row.capture.createEndpoints[0]);
                            }
                        } catch (err) {
                            row.error = row.error || (err?.message || String(err));
                        }
                    }
                    if (passMode === 'create') {
                        row.ok = !!row.createOk;
                    } else if (passMode === 'both') {
                        row.ok = !!row.createOk && !!row.interfaceOk;
                    } else {
                        row.ok = !!row.interfaceOk;
                        if (!row.ok && !row.error) {
                            row.error = 'create_interface_not_captured';
                        }
                    }
                }
                list.push(row);
                if (typeof options.onProgress === 'function') {
                    try {
                        options.onProgress({
                            event: 'scene_smoke_done',
                            sceneName,
                            index: i + 1,
                            total: scenes.length,
                            ok: row.ok,
                            createOk: row.createOk,
                            interfaceOk: row.interfaceOk,
                            createInterfaceCount: toNumber(row.capture?.createInterfaceCount, 0),
                            timeout: row.timeout,
                            successCount: row.successCount,
                            failCount: row.failCount,
                            submitEndpoint: row.submitEndpoint || '',
                            error: row.error || row.failTop || ''
                        });
                    } catch { }
                }
            }
            const result = {
                ok: list.every(item => item.ok),
                mode: createMode ? 'create' : 'validate',
                passMode,
                captureInterfaces,
                itemId,
                scannedAt: new Date().toISOString(),
                count: list.length,
                successCount: list.filter(item => item.ok).length,
                failCount: list.filter(item => !item.ok).length,
                list
            };
            window.__AM_WXT_SCENE_SMOKE_TEST_RESULT__ = result;
            if (captureInterfaces) {
                window.__AM_WXT_SCENE_CREATE_CAPTURE_RESULT__ = result;
            }
            return result;
        };
        const runSceneGoalOptionTests = async (options = {}) => {
            const scenes = Array.isArray(options.scenes) && options.scenes.length
                ? uniqueBy(options.scenes.map(item => String(item || '').trim()).filter(Boolean), item => item)
                : SCENE_NAME_LIST.slice();
            const strict = options.strict === true;
            const list = [];
            for (let i = 0; i < scenes.length; i++) {
                const sceneName = scenes[i];
                if (typeof options.onProgress === 'function') {
                    try {
                        options.onProgress({
                            event: 'scene_goal_option_test_start',
                            sceneName,
                            index: i + 1,
                            total: scenes.length
                        });
                    } catch { }
                }
                let row = {
                    sceneName,
                    ok: false,
                    goalCount: 0,
                    goalsWithFieldRows: 0,
                    goalsWithOptionRows: 0,
                    fieldCount: 0,
                    optionCount: 0,
                    warnings: [],
                    error: ''
                };
                try {
                    const extracted = await extractSceneGoalSpecs(sceneName, {
                        ...options,
                        scanMode: options.scanMode || 'full_top_down',
                        unlockPolicy: options.unlockPolicy || 'safe_only',
                        goalScan: true,
                        goalFieldScan: options.goalFieldScan !== false,
                        goalFieldScanMode: options.goalFieldScanMode || 'full_top_down',
                        goalFieldMaxDepth: toNumber(options.goalFieldMaxDepth, 2),
                        goalFieldMaxSnapshots: toNumber(options.goalFieldMaxSnapshots, 48),
                        goalFieldMaxGroupsPerLevel: toNumber(options.goalFieldMaxGroupsPerLevel, 6),
                        goalFieldMaxOptionsPerGroup: toNumber(options.goalFieldMaxOptionsPerGroup, 8),
                        refresh: options.refresh !== false
                    });
                    const goals = Array.isArray(extracted?.goals) ? extracted.goals : [];
                    const goalsWithFieldRows = goals.filter(goal => Array.isArray(goal?.fieldRows) && goal.fieldRows.length > 0).length;
                    const goalsWithOptionRows = goals.filter(goal => Array.isArray(goal?.fieldRows) && goal.fieldRows.some(field => Array.isArray(field?.options) && field.options.length >= 2)).length;
                    const fieldCount = goals.reduce((sum, goal) => sum + (Array.isArray(goal?.fieldRows) ? goal.fieldRows.length : 0), 0);
                    const optionCount = goals.reduce((sum, goal) => sum + (Array.isArray(goal?.fieldRows)
                        ? goal.fieldRows.reduce((acc, field) => acc + (Array.isArray(field?.options) ? field.options.length : 0), 0)
                        : 0), 0);
                    const warningList = Array.isArray(extracted?.warnings) ? extracted.warnings : [];
                    const fallbackGoalOnly = warningList.some(msg => /未识别到可点击的营销目标选项/.test(String(msg || '')));
                    const strictPass = goals.length > 0
                        && goalsWithFieldRows === goals.length
                        && goalsWithOptionRows === goals.length;
                    const relaxedPass = goals.length > 0
                        && goalsWithFieldRows > 0
                        && (goalsWithOptionRows > 0 || fallbackGoalOnly);
                    row = {
                        sceneName,
                        ok: !!extracted?.ok && (strict ? strictPass : relaxedPass),
                        goalCount: goals.length,
                        goalsWithFieldRows,
                        goalsWithOptionRows,
                        fieldCount,
                        optionCount,
                        warnings: warningList.slice(0, 40),
                        error: extracted?.error || ''
                    };
                } catch (err) {
                    row.error = err?.message || String(err);
                }
                list.push(row);
                if (typeof options.onProgress === 'function') {
                    try {
                        options.onProgress({
                            event: 'scene_goal_option_test_done',
                            sceneName,
                            index: i + 1,
                            total: scenes.length,
                            ok: row.ok,
                            goalCount: row.goalCount,
                            goalsWithFieldRows: row.goalsWithFieldRows,
                            goalsWithOptionRows: row.goalsWithOptionRows,
                            fieldCount: row.fieldCount,
                            optionCount: row.optionCount,
                            error: row.error || ''
                        });
                    } catch { }
                }
            }
            const result = {
                ok: list.every(item => item.ok),
                strict,
                scannedAt: new Date().toISOString(),
                sceneOrder: scenes,
                count: list.length,
                successCount: list.filter(item => item.ok).length,
                failCount: list.filter(item => !item.ok).length,
                goalCount: list.reduce((sum, item) => sum + toNumber(item?.goalCount, 0), 0),
                goalsWithFieldRows: list.reduce((sum, item) => sum + toNumber(item?.goalsWithFieldRows, 0), 0),
                goalsWithOptionRows: list.reduce((sum, item) => sum + toNumber(item?.goalsWithOptionRows, 0), 0),
                fieldCount: list.reduce((sum, item) => sum + toNumber(item?.fieldCount, 0), 0),
                optionCount: list.reduce((sum, item) => sum + toNumber(item?.optionCount, 0), 0),
                list
            };
            window.__AM_WXT_SCENE_GOAL_OPTION_TEST_RESULT__ = result;
            return result;
        };
        const buildGoalOptionSimulationCases = (goal = {}, options = {}) => {
            const maxOptionsPerField = Math.max(1, Math.min(24, toNumber(options.maxOptionsPerField, 12)));
            const maxCasesPerGoal = Math.max(1, Math.min(360, toNumber(options.maxCasesPerGoal, 96)));
            const includeBaseCase = options.includeBaseCase !== false;
            const fieldRows = normalizeGoalFieldRows(goal?.fieldRows || []);
            const cases = [];
            if (includeBaseCase) {
                cases.push({
                    caseId: 'goal_default',
                    caseType: 'goal_default',
                    fieldLabel: '',
                    optionValue: '',
                    sceneSettingsPatch: {}
                });
            }
            fieldRows.forEach(row => {
                const fieldLabel = normalizeSceneOptionText(row?.label || '');
                if (!fieldLabel) return;
                const defaultValue = normalizeSceneSettingValue(row?.defaultValue || '');
                const optionsList = uniqueBy(
                    (Array.isArray(row?.options) ? row.options : [])
                        .map(item => normalizeSceneSettingValue(item))
                        .filter(Boolean),
                    item => item
                );
                if (defaultValue && !optionsList.includes(defaultValue)) {
                    optionsList.unshift(defaultValue);
                }
                const pickedOptions = optionsList.slice(0, maxOptionsPerField);
                pickedOptions.forEach((optionValue, idx) => {
                    const safeFieldKey = normalizeSceneSpecFieldKey(fieldLabel) || `field_${cases.length + idx + 1}`;
                    const safeValueKey = normalizeSceneSpecFieldKey(optionValue) || `opt_${idx + 1}`;
                    cases.push({
                        caseId: `${safeFieldKey}_${safeValueKey}`,
                        caseType: 'field_option',
                        fieldLabel,
                        optionValue,
                        sceneSettingsPatch: {
                            [fieldLabel]: optionValue
                        },
                        dependsOn: Array.isArray(row?.dependsOn) ? row.dependsOn.slice(0, 12) : [],
                        triggerPath: normalizeText(row?.triggerPath || '')
                    });
                });
            });
            return uniqueBy(cases, item => `${item.caseType}::${item.fieldLabel}::${item.optionValue}`)
                .slice(0, maxCasesPerGoal);
        };
        const runSceneOptionSubmitSimulations = async (options = {}) => {
            const itemId = String(options.itemId || options.materialId || SCENE_SYNC_DEFAULT_ITEM_ID).trim();
            const scenes = Array.isArray(options.scenes) && options.scenes.length
                ? uniqueBy(options.scenes.map(item => String(item || '').trim()).filter(Boolean), item => item)
                : SCENE_NAME_LIST.slice();
            const timeoutMs = Math.max(15000, toNumber(options.timeoutMs, 50000));
            const passMode = (() => {
                const mode = String(options.passMode || '').trim();
                if (mode === 'create' || mode === 'both' || mode === 'interface') return mode;
                return 'interface';
            })();
            const maxGoalsPerScene = Math.max(1, Math.min(40, toNumber(options.maxGoalsPerScene, 16)));
            const maxCasesPerGoal = Math.max(1, Math.min(360, toNumber(options.maxCasesPerGoal, 96)));
            const maxCasesPerScene = Math.max(1, Math.min(520, toNumber(options.maxCasesPerScene, 220)));
            const resolveExplicitGoalLabels = (sceneName = '') => {
                if (Array.isArray(options.goalLabels)) {
                    return uniqueBy(
                        options.goalLabels
                            .map(item => normalizeGoalCandidateLabel(item))
                            .filter(Boolean),
                        item => item
                    ).slice(0, 24);
                }
                if (isPlainObject(options.goalLabels)) {
                    const list = options.goalLabels[sceneName];
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
            const list = [];
            for (let sceneIdx = 0; sceneIdx < scenes.length; sceneIdx++) {
                const sceneName = scenes[sceneIdx];
                if (typeof options.onProgress === 'function') {
                    try {
                        options.onProgress({
                            event: 'scene_option_submit_start',
                            sceneName,
                            index: sceneIdx + 1,
                            total: scenes.length
                        });
                    } catch { }
                }
                let extracted = null;
                const explicitGoalLabels = resolveExplicitGoalLabels(sceneName);
                if (explicitGoalLabels.length) {
                    extracted = {
                        goals: explicitGoalLabels.map((label, idx) => ({
                            goalLabel: label,
                            isDefault: idx === 0,
                            fieldRows: []
                        }))
                    };
                } else {
                    try {
                        extracted = await extractSceneGoalSpecs(sceneName, {
                            ...options,
                            scanMode: options.scanMode || 'full_top_down',
                            unlockPolicy: options.unlockPolicy || 'safe_only',
                            goalScan: true,
                            goalFieldScan: options.goalFieldScan !== false,
                            goalFieldScanMode: options.goalFieldScanMode || 'full_top_down',
                            goalFieldMaxDepth: toNumber(options.goalFieldMaxDepth, 2),
                            goalFieldMaxSnapshots: toNumber(options.goalFieldMaxSnapshots, 48),
                            goalFieldMaxGroupsPerLevel: toNumber(options.goalFieldMaxGroupsPerLevel, 6),
                            goalFieldMaxOptionsPerGroup: toNumber(options.goalFieldMaxOptionsPerGroup, 8),
                            refresh: options.refreshGoalSpecs === true
                        });
                    } catch (err) {
                        list.push({
                            sceneName,
                            goalLabel: '',
                            caseId: '',
                            caseType: 'goal_default',
                            fieldLabel: '',
                            optionValue: '',
                            ok: false,
                            createOk: false,
                            interfaceOk: false,
                            submitEndpoint: '',
                            createInterfaceCount: 0,
                            error: err?.message || String(err),
                            timeout: false,
                            requestPreview: {},
                            capture: {
                                enabled: false,
                                captureId: '',
                                recordCount: 0,
                                contractCount: 0,
                                createInterfaceCount: 0,
                                createEndpoints: [],
                                createInterfaces: [],
                                contracts: []
                            },
                            ts: new Date().toISOString()
                        });
                        continue;
                    }
                }
                const goalsRaw = Array.isArray(extracted?.goals) && extracted.goals.length
                    ? extracted.goals
                    : [{ goalLabel: '', isDefault: true, fieldRows: [] }];
                const fallbackGoalLabels = getSceneMarketingGoalFallbackList(sceneName);
                const goalsExpanded = goalsRaw.slice();
                const existingGoalSet = new Set(
                    goalsExpanded
                        .map(goal => normalizeGoalCandidateLabel(goal?.goalLabel || ''))
                        .filter(Boolean)
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
                let sceneCaseCursor = 0;
                for (let goalIdx = 0; goalIdx < goals.length; goalIdx++) {
                    const goal = goals[goalIdx] || {};
                    const goalLabel = normalizeGoalLabel(goal?.goalLabel || '');
                    const cases = buildGoalOptionSimulationCases(goal, {
                        maxOptionsPerField: options.maxOptionsPerField,
                        maxCasesPerGoal,
                        includeBaseCase: options.includeBaseCase !== false
                    });
                    for (let caseIdx = 0; caseIdx < cases.length; caseIdx++) {
                        if (sceneCaseCursor >= maxCasesPerScene) break;
                        sceneCaseCursor += 1;
                        const caseInfo = cases[caseIdx] || {};
                        const request = buildSmokeTestRequestByScene(sceneName, itemId, {
                            index: sceneCaseCursor,
                            dayAverageBudget: toNumber(options.dayAverageBudget, 100)
                        });
                        request.marketingGoal = goalLabel || request.marketingGoal || '';
                        request.common = mergeDeep({}, request.common || {}, {
                            marketingGoal: goalLabel || request?.common?.marketingGoal || ''
                        });
                        request.sceneSettings = mergeDeep({}, request.sceneSettings || {}, caseInfo.sceneSettingsPatch || {});
                        if (isPlainObject(options.requestOverrides)) {
                            mergeDeep(request, options.requestOverrides);
                        }
                        if (Array.isArray(request?.plans) && request.plans[0]) {
                            const tail = `${String(sceneCaseCursor).padStart(3, '0')}${String(Date.now()).slice(-4)}`;
                            request.plans[0].planName = `${request.plans[0].planName}_${tail}`;
                        }
                        const row = {
                            sceneName,
                            goalLabel,
                            caseId: caseInfo.caseId || '',
                            caseType: caseInfo.caseType || 'goal_default',
                            fieldLabel: caseInfo.fieldLabel || '',
                            optionValue: caseInfo.optionValue || '',
                            dependsOn: Array.isArray(caseInfo.dependsOn) ? caseInfo.dependsOn.slice(0, 12) : [],
                            triggerPath: caseInfo.triggerPath || '',
                            ok: false,
                            createOk: false,
                            interfaceOk: false,
                            submitEndpoint: '',
                            createInterfaceCount: 0,
                            error: '',
                            timeout: false,
                            requestPreview: {
                                planName: request?.plans?.[0]?.planName || '',
                                marketingGoal: request.marketingGoal || '',
                                sceneSettings: deepClone(request.sceneSettings || {})
                            },
                            capture: {
                                enabled: true,
                                captureId: '',
                                recordCount: 0,
                                contractCount: 0,
                                createInterfaceCount: 0,
                                createEndpoints: [],
                                createInterfaces: [],
                                contracts: []
                            },
                            ts: new Date().toISOString()
                        };
                        let captureId = '';
                        try {
                            const capture = startNetworkCapture({ sceneName });
                            captureId = capture?.captureId || '';
                            row.capture.captureId = captureId;
                        } catch (err) {
                            row.capture.enabled = false;
                            row.error = err?.message || String(err);
                        }
                        const run = createPlansByScene(sceneName, request, {
                            batchRetry: Math.max(0, toNumber(options.batchRetry, 0)),
                            fallbackPolicy: options.fallbackPolicy || 'none',
                            requestOptions: {
                                maxRetries: Math.max(1, toNumber(options.maxRetries, 1)),
                                timeout: Math.max(8000, toNumber(options.requestTimeout, 20000))
                            }
                        });
                        const wrapped = await Promise.race([
                            run.then(res => ({ type: 'result', res })).catch(err => ({ type: 'error', err: err?.message || String(err) })),
                            new Promise(resolve => setTimeout(() => resolve({ type: 'timeout' }), timeoutMs))
                        ]);
                        if (wrapped.type === 'timeout') {
                            row.timeout = true;
                            row.error = `timeout_${timeoutMs}ms`;
                        } else if (wrapped.type === 'error') {
                            row.error = wrapped.err;
                        } else {
                            const res = wrapped.res || {};
                            row.createOk = !!res.ok;
                            row.submitEndpoint = normalizeGoalCreateEndpoint(res.submitEndpoint || '');
                            if (!row.createOk && !row.error) {
                                row.error = Array.isArray(res?.failures) && res.failures.length
                                    ? String(res.failures[0]?.error || '')
                                    : '';
                            }
                        }
                        if (captureId) {
                            try {
                                const stopped = stopNetworkCapture(captureId, {
                                    withRecords: !!options.withRecords
                                });
                                row.capture.recordCount = toNumber(stopped?.recordCount, 0);
                                row.capture.contractCount = toNumber(stopped?.contractCount, 0);
                                row.capture.createInterfaceCount = toNumber(stopped?.createInterfaceCount, 0);
                                row.capture.createEndpoints = Array.isArray(stopped?.createEndpoints)
                                    ? stopped.createEndpoints.slice(0, 60)
                                    : [];
                                row.capture.createInterfaces = Array.isArray(stopped?.createInterfaces)
                                    ? stopped.createInterfaces.slice(0, 80)
                                    : [];
                                row.capture.contracts = Array.isArray(stopped?.contracts)
                                    ? stopped.contracts.slice(0, 160)
                                    : [];
                                row.createInterfaceCount = row.capture.createInterfaceCount;
                                row.interfaceOk = row.capture.createInterfaceCount > 0;
                                if (!row.submitEndpoint && row.capture.createEndpoints.length) {
                                    row.submitEndpoint = parseCreateEndpointFromMethodPath(row.capture.createEndpoints[0]);
                                }
                                const rememberedContract = rememberSceneCreateInterfaces(
                                    sceneName,
                                    goalLabel,
                                    row.capture.createInterfaces,
                                    { source: 'option_submit_simulation' }
                                );
                                if (rememberedContract) {
                                    row.rememberedContract = {
                                        endpoint: rememberedContract.endpoint || '',
                                        goalLabel: rememberedContract.goalLabel || '',
                                        requestKeyCount: Array.isArray(rememberedContract.requestKeys) ? rememberedContract.requestKeys.length : 0,
                                        campaignKeyCount: Array.isArray(rememberedContract.campaignKeys) ? rememberedContract.campaignKeys.length : 0,
                                        adgroupKeyCount: Array.isArray(rememberedContract.adgroupKeys) ? rememberedContract.adgroupKeys.length : 0
                                    };
                                }
                            } catch (err) {
                                row.error = row.error || (err?.message || String(err));
                            }
                        }
                        if (passMode === 'create') {
                            row.ok = !!row.createOk;
                        } else if (passMode === 'both') {
                            row.ok = !!row.createOk && !!row.interfaceOk;
                        } else {
                            row.ok = !!row.interfaceOk;
                            if (!row.ok && !row.error) row.error = 'create_interface_not_captured';
                        }
                        list.push(row);
                        if (typeof options.onProgress === 'function') {
                            try {
                                options.onProgress({
                                    event: 'scene_option_submit_case_done',
                                    sceneName,
                                    goalLabel,
                                    caseId: row.caseId,
                                    caseType: row.caseType,
                                    fieldLabel: row.fieldLabel,
                                    optionValue: row.optionValue,
                                    ok: row.ok,
                                    createOk: row.createOk,
                                    interfaceOk: row.interfaceOk,
                                    createInterfaceCount: row.createInterfaceCount,
                                    submitEndpoint: row.submitEndpoint || '',
                                    error: row.error || ''
                                });
                            } catch { }
                        }
                    }
                    if (sceneCaseCursor >= maxCasesPerScene) break;
                }
                if (typeof options.onProgress === 'function') {
                    try {
                        const sceneRows = list.filter(item => item.sceneName === sceneName);
                        options.onProgress({
                            event: 'scene_option_submit_done',
                            sceneName,
                            index: sceneIdx + 1,
                            total: scenes.length,
                            caseCount: sceneRows.length,
                            successCount: sceneRows.filter(item => item.ok).length,
                            failCount: sceneRows.filter(item => !item.ok).length
                        });
                    } catch { }
                }
            }
            const byScene = scenes.map(sceneName => {
                const rows = list.filter(item => item.sceneName === sceneName);
                const goalSet = uniqueBy(rows.map(item => normalizeGoalLabel(item.goalLabel || '')).filter(Boolean), item => item);
                return {
                    sceneName,
                    caseCount: rows.length,
                    successCount: rows.filter(item => item.ok).length,
                    failCount: rows.filter(item => !item.ok).length,
                    goalCount: goalSet.length,
                    createInterfaceCount: rows.reduce((sum, item) => sum + toNumber(item?.createInterfaceCount, 0), 0)
                };
            });
            const missingList = list
                .filter(item => !item.ok)
                .map(item => ({
                    sceneName: item.sceneName,
                    goalLabel: item.goalLabel || '',
                    fieldLabel: item.fieldLabel || '',
                    optionValue: item.optionValue || '',
                    caseId: item.caseId || '',
                    error: item.error || ''
                }))
                .slice(0, 400);
            const result = {
                ok: list.length > 0 && list.every(item => item.ok),
                itemId,
                passMode,
                scannedAt: new Date().toISOString(),
                sceneOrder: scenes,
                count: list.length,
                successCount: list.filter(item => item.ok).length,
                failCount: list.filter(item => !item.ok).length,
                missingCount: missingList.length,
                byScene,
                missingList,
                list
            };
            window.__AM_WXT_SCENE_OPTION_SUBMIT_SIM_RESULT__ = result;
            return result;
        };
        const captureSceneCreateInterfaces = async (sceneName = '', options = {}) => {
            const targetScene = String(sceneName || '').trim();
            if (!targetScene) {
                return {
                    ok: false,
                    sceneName: '',
                    error: '缺少 sceneName'
                };
            }
            const result = await runSceneSmokeTests({
                ...options,
                scenes: [targetScene],
                createMode: true,
                captureInterfaces: true,
                passMode: options.passMode || 'interface'
            });
            const row = Array.isArray(result?.list) && result.list.length ? result.list[0] : null;
            return {
                ok: !!row?.ok,
                sceneName: targetScene,
                itemId: row?.itemId || String(options.itemId || options.materialId || '').trim(),
                passMode: result?.passMode || 'interface',
                row: row || null,
                error: row?.error || ''
            };
        };
        const captureAllSceneCreateInterfaces = async (options = {}) => runSceneSmokeTests({
            ...options,
            createMode: true,
            captureInterfaces: true,
            passMode: options.passMode || 'interface'
        });
        const WIZARD_PARITY_REQUIRED_API_METHODS = [
            'openWizard',
            'getRuntimeDefaults',
            'searchItems',
            'createPlansBatch',
            'createPlansByScene',
            'createSitePlansBatch',
            'createKeywordPlansBatch',
            'createCrowdPlansBatch',
            'createShopDirectPlansBatch',
            'createContentPlansBatch',
            'createLeadPlansBatch',
            'applyMatrixPreset',
            'suggestKeywords',
            'suggestCrowds',
            'getSessionDraft',
            'clearSessionDraft',
            'runSceneSmokeTests',
            'runSceneGoalOptionTests',
            'runSceneOptionSubmitSimulations',
            'captureSceneCreateInterfaces',
            'captureAllSceneCreateInterfaces',
            'buildSceneParityCaseMatrix',
            'collectWizardSubmitSnapshot',
            'runWizardSceneParityTest',
            'checkWizardApiCoverage'
        ];
        const checkWizardApiCoverage = () => {
            const localApi = {
                openWizard,
                getRuntimeDefaults,
                searchItems,
                createPlansBatch,
                createPlansByScene,
                createSitePlansBatch,
                createKeywordPlansBatch,
                createCrowdPlansBatch,
                createShopDirectPlansBatch,
                createContentPlansBatch,
                createLeadPlansBatch,
                applyMatrixPreset,
                suggestKeywords,
                suggestCrowds,
                getSessionDraft,
                clearSessionDraft,
                runSceneSmokeTests,
                runSceneGoalOptionTests,
                runSceneOptionSubmitSimulations,
                captureSceneCreateInterfaces,
                captureAllSceneCreateInterfaces,
                buildSceneParityCaseMatrix,
                collectWizardSubmitSnapshot,
                runWizardSceneParityTest,
                checkWizardApiCoverage
            };
            const pageApiExposed = (typeof window !== 'undefined' && isPlainObject(window.__AM_WXT_KEYWORD_API__));
            const pageApi = pageApiExposed ? window.__AM_WXT_KEYWORD_API__ : {};
            const missingInLocal = WIZARD_PARITY_REQUIRED_API_METHODS
                .filter(name => typeof localApi[name] !== 'function');
            const missingInPage = pageApiExposed
                ? WIZARD_PARITY_REQUIRED_API_METHODS.filter(name => typeof pageApi[name] !== 'function')
                : [];
            return {
                required: WIZARD_PARITY_REQUIRED_API_METHODS.slice(),
                pageApiExposed,
                missingInLocal,
                missingInPage,
                ok: missingInLocal.length === 0 && (!pageApiExposed || missingInPage.length === 0)
            };
        };
        const KEYWORD_PARITY_TARGET_COST_PRESET = Object.freeze({
            conv: '35',
            fav_cart: '5',
            click: '0.5',
            roi: '5'
        });
        const normalizeKeywordParityBidTargetCode = (value = '') => {
            const seed = normalizeSceneSettingValue(value);
            if (!seed) return '';
            const mapped = normalizeKeywordBidTargetCode(mapSceneBidTargetValue(seed) || seed);
            const token = String(mapped || seed).trim().toLowerCase();
            if (!token) return '';
            if (token === 'display_cart' || token === 'coll_cart') return 'fav_cart';
            if (token === 'display_click') return 'click';
            if (token === 'display_roi') return 'roi';
            if (token === 'display_pay' || token === 'ad_strategy_buy' || token === 'ad_strategy_retained_buy') return 'conv';
            if (token === 'fav_cart' || token === 'click' || token === 'roi' || token === 'conv') return token;
            if (/收藏|加购/.test(seed)) return 'fav_cart';
            if (/点击/.test(seed)) return 'click';
            if (/投产|roi/i.test(seed)) return 'roi';
            if (/成交|gmv|净成交/i.test(seed)) return 'conv';
            return '';
        };
        const resolveKeywordParityCostConfig = (targetCode = '') => {
            const token = String(targetCode || '').trim().toLowerCase();
            if (token === 'roi') {
                return {
                    switchLabel: '设置7日投产比',
                    switchOnValue: '自定义',
                    valueLabels: ['目标投产比', 'ROI目标值', '出价目标值', '约束值']
                };
            }
            if (token === 'conv') {
                return {
                    switchLabel: '设置平均成交成本',
                    switchOnValue: '开启',
                    valueLabels: ['平均成交成本', '平均直接成交成本', '目标成本']
                };
            }
            if (token === 'fav_cart') {
                return {
                    switchLabel: '设置平均收藏加购成本',
                    switchOnValue: '开启',
                    valueLabels: ['平均收藏加购成本', '目标成本']
                };
            }
            if (token === 'click') {
                return {
                    switchLabel: '设置平均点击成本',
                    switchOnValue: '开启',
                    valueLabels: ['平均点击成本', '目标成本']
                };
            }
            return null;
        };
        const ensureKeywordParityTargetCostForTest = (strategy = {}, sceneSettingsPatch = {}, options = {}) => {
            const enabled = options?.ensureTargetCostForTest !== false;
            const nextStrategy = isPlainObject(strategy) ? mergeDeep({}, strategy) : {};
            const nextPatch = isPlainObject(sceneSettingsPatch) ? mergeDeep({}, sceneSettingsPatch) : {};
            if (!enabled) {
                return {
                    strategy: nextStrategy,
                    sceneSettingsPatch: nextPatch
                };
            }
            const bidMode = normalizeBidMode(nextStrategy.bidMode || 'smart', 'smart');
            if (bidMode !== 'smart') {
                return {
                    strategy: nextStrategy,
                    sceneSettingsPatch: nextPatch
                };
            }
            const marketingGoal = detectKeywordGoalFromText(
                nextStrategy.marketingGoal
                || nextPatch.营销目标
                || nextPatch.选择卡位方案
                || ''
            );
            if (marketingGoal !== '自定义推广') {
                return {
                    strategy: nextStrategy,
                    sceneSettingsPatch: nextPatch
                };
            }
            const targetCode = normalizeKeywordParityBidTargetCode(
                nextStrategy.bidTargetV2
                || nextPatch.出价目标
                || nextPatch.优化目标
                || ''
            );
            const targetCostConfig = resolveKeywordParityCostConfig(targetCode);
            if (!targetCostConfig) {
                return {
                    strategy: nextStrategy,
                    sceneSettingsPatch: nextPatch
                };
            }
            const candidateValues = [
                nextStrategy.singleCostV2,
                ...targetCostConfig.valueLabels.map(label => nextPatch[label]),
                targetCode === 'roi' ? nextPatch.设置7日投产比 : '',
                nextPatch.目标成本
            ];
            let targetCostValue = '';
            for (const candidate of candidateValues) {
                const amount = parseNumberFromSceneValue(candidate);
                if (!Number.isFinite(amount) || amount <= 0) continue;
                targetCostValue = toShortSceneValue(String(amount));
                if (targetCostValue) break;
            }
            if (!targetCostValue) {
                targetCostValue = KEYWORD_PARITY_TARGET_COST_PRESET[targetCode] || '';
            }
            if (!targetCostValue) {
                return {
                    strategy: nextStrategy,
                    sceneSettingsPatch: nextPatch
                };
            }
            nextStrategy.setSingleCostV2 = true;
            nextStrategy.singleCostV2 = targetCostValue;
            if (targetCostConfig.switchLabel) {
                nextPatch[targetCostConfig.switchLabel] = targetCostConfig.switchOnValue || '开启';
            }
            targetCostConfig.valueLabels.forEach((label, idx) => {
                if (!label) return;
                if (idx === 0 || !normalizeSceneSettingValue(nextPatch[label])) {
                    nextPatch[label] = targetCostValue;
                }
            });
            if (targetCode !== 'roi' && !normalizeSceneSettingValue(nextPatch.目标成本)) {
                nextPatch.目标成本 = targetCostValue;
            }
            return {
                strategy: nextStrategy,
                sceneSettingsPatch: nextPatch
            };
        };
        const buildSceneParityCaseMatrix = (sceneName = '', options = {}) => {
            const targetScene = SCENE_NAME_LIST.includes(String(sceneName || '').trim())
                ? String(sceneName || '').trim()
                : '关键词推广';
            const maxGoalCases = Math.max(1, Math.min(6, toNumber(options.maxGoalCases, 3)));
            const maxDynamicCases = Math.max(0, Math.min(10, toNumber(options.maxDynamicCases, 4)));
            const fallbackGoals = getSceneMarketingGoalFallbackList(targetScene);
            const defaultGoal = fallbackGoals[0]
                || (targetScene === '关键词推广' ? '趋势明星' : normalizeGoalLabel(targetScene));
            const cases = [];
            const pushCase = (entry = {}) => {
                const caseId = String(entry.caseId || '').trim() || `case_${cases.length + 1}`;
                if (cases.some(item => item.caseId === caseId)) return;
                cases.push({
                    caseId,
                    label: String(entry.label || caseId).trim(),
                    strategyPatch: isPlainObject(entry.strategyPatch) ? deepClone(entry.strategyPatch) : {},
                    sceneSettingsPatch: isPlainObject(entry.sceneSettingsPatch) ? deepClone(entry.sceneSettingsPatch) : {}
                });
            };
            pushCase({
                caseId: 'base_default',
                label: '默认配置',
                strategyPatch: {
                    marketingGoal: defaultGoal
                },
                sceneSettingsPatch: {
                    营销目标: defaultGoal
                }
            });
            fallbackGoals.slice(1, maxGoalCases).forEach((goalLabel, idx) => {
                pushCase({
                    caseId: `goal_${idx + 1}`,
                    label: `营销目标-${goalLabel}`,
                    strategyPatch: {
                        marketingGoal: goalLabel
                    },
                    sceneSettingsPatch: {
                        营销目标: goalLabel
                    }
                });
            });
            if (targetScene === '关键词推广') {
                pushCase({
                    caseId: 'kw_manual',
                    label: '关键词-手动出价',
                    strategyPatch: {
                        bidMode: 'manual',
                        marketingGoal: '自定义推广',
                        bidTargetV2: 'conv',
                        keywordMode: 'manual',
                        manualKeywords: '测试词A,1.20,精准\n测试词B,1.10,广泛',
                        setSingleCostV2: false,
                        singleCostV2: ''
                    },
                    sceneSettingsPatch: {
                        营销目标: '自定义推广',
                        选择卡位方案: '自定义推广'
                    }
                });
                pushCase({
                    caseId: 'kw_smart_roi',
                    label: '关键词-智能投产比',
                    strategyPatch: {
                        bidMode: 'smart',
                        marketingGoal: '自定义推广',
                        bidTargetV2: 'roi',
                        keywordMode: 'recommend',
                        recommendCount: '8',
                        manualKeywords: '',
                        setSingleCostV2: true,
                        singleCostV2: '5'
                    },
                    sceneSettingsPatch: {
                        营销目标: '自定义推广',
                        选择卡位方案: '自定义推广',
                        出价目标: '稳定投产比',
                        设置7日投产比: '自定义',
                        目标投产比: '5'
                    }
                });
                pushCase({
                    caseId: 'kw_smart_fav_cart',
                    label: '关键词-智能收藏加购',
                    strategyPatch: {
                        bidMode: 'smart',
                        marketingGoal: '自定义推广',
                        bidTargetV2: 'fav_cart',
                        keywordMode: 'recommend',
                        recommendCount: '8',
                        manualKeywords: '',
                        setSingleCostV2: true,
                        singleCostV2: '5'
                    },
                    sceneSettingsPatch: {
                        营销目标: '自定义推广',
                        选择卡位方案: '自定义推广',
                        出价目标: '增加收藏加购量',
                        设置平均收藏加购成本: '开启',
                        平均收藏加购成本: '5',
                        目标成本: '5'
                    }
                });
                pushCase({
                    caseId: 'kw_smart_click',
                    label: '关键词-智能点击量',
                    strategyPatch: {
                        bidMode: 'smart',
                        marketingGoal: '自定义推广',
                        bidTargetV2: 'click',
                        keywordMode: 'recommend',
                        recommendCount: '8',
                        manualKeywords: '',
                        setSingleCostV2: true,
                        singleCostV2: '0.5'
                    },
                    sceneSettingsPatch: {
                        营销目标: '自定义推广',
                        选择卡位方案: '自定义推广',
                        出价目标: '增加点击量',
                        设置平均点击成本: '开启',
                        平均点击成本: '0.5',
                        目标成本: '0.5'
                    }
                });
                pushCase({
                    caseId: 'kw_day_budget',
                    label: '关键词-每日预算',
                    strategyPatch: {
                        budgetType: 'day_budget',
                        dayAverageBudget: '188'
                    },
                    sceneSettingsPatch: {
                        预算类型: '每日预算'
                    }
                });
            } else {
                pushCase({
                    caseId: 'scene_day_budget',
                    label: '场景-每日预算',
                    strategyPatch: {
                        budgetType: 'day_budget',
                        dayAverageBudget: '188'
                    },
                    sceneSettingsPatch: {
                        预算类型: '每日预算'
                    }
                });
                pushCase({
                    caseId: 'scene_day_average',
                    label: '场景-日均预算',
                    strategyPatch: {
                        budgetType: 'day_average',
                        dayAverageBudget: '166'
                    },
                    sceneSettingsPatch: {
                        预算类型: '日均预算'
                    }
                });
            }
            const sceneFallbackOptionMap = (typeof SCENE_FALLBACK_OPTION_MAP !== 'undefined' && isPlainObject(SCENE_FALLBACK_OPTION_MAP))
                ? SCENE_FALLBACK_OPTION_MAP
                : {};
            const sceneOptionMap = isPlainObject(sceneFallbackOptionMap[targetScene])
                ? sceneFallbackOptionMap[targetScene]
                : {};
            const DYNAMIC_FIELD_SKIP_RE = /(营销目标|选择卡位方案|选择拉新方案|选择方案|选择优化方向|选择解决方案|投放策略|推广模式|卡位方式|选择方式|预算类型|计划名称|计划名|预算值|每日预算|日均预算|总预算)/;
            let dynamicCursor = 0;
            Object.keys(sceneOptionMap).forEach(label => {
                if (dynamicCursor >= maxDynamicCases) return;
                const text = normalizeGoalLabel(label);
                if (!text || DYNAMIC_FIELD_SKIP_RE.test(text)) return;
                const optionsList = uniqueBy(
                    (Array.isArray(sceneOptionMap[label]) ? sceneOptionMap[label] : [])
                        .map(item => normalizeGoalLabel(item))
                        .filter(Boolean),
                    item => item
                );
                if (optionsList.length < 2) return;
                const optionValue = optionsList[1];
                dynamicCursor += 1;
                pushCase({
                    caseId: `dynamic_${dynamicCursor}`,
                    label: `${text}-${optionValue}`,
                    strategyPatch: {},
                    sceneSettingsPatch: {
                        [text]: optionValue
                    }
                });
            });
            return {
                sceneName: targetScene,
                count: cases.length,
                cases
            };
        };
        const resolveParityTestItem = async (sceneName = '', options = {}) => {
            const targetScene = String(sceneName || '').trim() || '关键词推广';
            const explicitItem = isPlainObject(options.item) ? options.item : null;
            if (explicitItem && (explicitItem.materialId || explicitItem.itemId)) {
                return deepClone(explicitItem);
            }
            const itemList = Array.isArray(options.items) ? options.items : [];
            const firstFromList = itemList.find(item => isPlainObject(item) && (item.materialId || item.itemId));
            if (firstFromList) return deepClone(firstFromList);
            const existing = Array.isArray(wizardState.addedItems)
                ? wizardState.addedItems.find(item => item && (item.materialId || item.itemId))
                : null;
            if (existing) return deepClone(existing);
            const query = String(options.itemQuery || '').trim();
            const runtime = await getRuntimeDefaults(false);
            if (targetScene === '关键词推广' && options.useDefaultSyncItem !== false) {
                const defaultItems = await fetchItemsByIds([SCENE_SYNC_DEFAULT_ITEM_ID], runtime);
                if (Array.isArray(defaultItems) && defaultItems.length) {
                    return deepClone(defaultItems[0]);
                }
            }
            const bizCode = resolveSceneBizCodeHint(targetScene) || runtime.bizCode || DEFAULTS.bizCode;
            const promotionScene = resolveSceneDefaultPromotionScene(
                targetScene,
                runtime.promotionScene || DEFAULTS.promotionScene
            );
            const searched = await searchItems({
                bizCode,
                promotionScene,
                query,
                pageSize: Math.max(20, toNumber(options.pageSize, 40)),
                tagId: null,
                channelKey: query ? '' : 'effect'
            });
            const candidate = Array.isArray(searched?.list) ? searched.list[0] : null;
            return candidate ? deepClone(candidate) : null;
        };
        const buildParityStrategyTemplate = (sceneName = '', patch = {}) => {
            const targetScene = String(sceneName || '').trim() || '关键词推广';
            const fallbackGoals = getSceneMarketingGoalFallbackList(targetScene);
            const defaultGoal = fallbackGoals[0]
                || (targetScene === '关键词推广' ? '趋势明星' : normalizeGoalLabel(targetScene));
            const base = {
                id: `parity_${nowStampSeconds()}_${Math.floor(Math.random() * 90 + 10)}`,
                name: `${targetScene}-校对`,
                enabled: true,
                bidMode: 'smart',
                marketingGoal: defaultGoal,
                dayAverageBudget: '100',
                defaultBidPrice: '1',
                keywordMode: DEFAULTS.keywordMode,
                useWordPackage: true,
                recommendCount: String(DEFAULTS.recommendCount),
                manualKeywords: '',
                bidTargetV2: DEFAULTS.bidTargetV2,
                budgetType: 'day_average',
                setSingleCostV2: false,
                singleCostV2: '',
                planName: `PARITY_${targetScene}_${nowStampSeconds()}`,
                copyBatchCount: 1
            };
            const merged = mergeDeep({}, base, isPlainObject(patch) ? patch : {});
            merged.bidMode = normalizeBidMode(merged.bidMode || 'smart', 'smart');
            merged.marketingGoal = normalizeGoalLabel(merged.marketingGoal || defaultGoal || '');
            merged.bidTargetV2 = String(merged.bidTargetV2 || DEFAULTS.bidTargetV2).trim() || DEFAULTS.bidTargetV2;
            merged.dayAverageBudget = String(merged.dayAverageBudget || '100').trim() || '100';
            merged.defaultBidPrice = String(merged.defaultBidPrice || '1').trim() || '1';
            merged.keywordMode = String(merged.keywordMode || DEFAULTS.keywordMode).trim() || DEFAULTS.keywordMode;
            merged.recommendCount = String(merged.recommendCount || DEFAULTS.recommendCount).trim() || String(DEFAULTS.recommendCount);
            merged.planName = String(merged.planName || '').trim() || `PARITY_${targetScene}_${nowStampSeconds()}`;
            merged.copyBatchCount = Math.max(1, Math.min(99, toNumber(merged.copyBatchCount, 1)));
            if (targetScene !== '关键词推广') {
                merged.manualKeywords = '';
                merged.keywordMode = DEFAULTS.keywordMode;
                merged.setSingleCostV2 = false;
                merged.singleCostV2 = '';
            }
            return merged;
        };
        const pickBudgetValueFromObject = (obj = {}) => {
            if (!isPlainObject(obj)) return 0;
            const value = toNumber(
                obj.dayAverageBudget
                || obj.dayBudget
                || obj.totalBudget
                || obj.orderAmount
                || obj.futureBudget,
                0
            );
            return Number.isFinite(value) && value > 0 ? value : 0;
        };
        const collectWizardSubmitSnapshot = async (request = {}, options = {}) => {
            const sceneName = String(request?.sceneName || options?.sceneName || '').trim();
            if (!sceneName) {
                return {
                    ok: false,
                    error: 'missing_scene_name',
                    submitPayloadSnapshot: {},
                    result: null,
                    progressEvents: []
                };
            }
            const progressEvents = [];
            let submitPayloadSnapshot = null;
            const userOnProgress = typeof options.onProgress === 'function' ? options.onProgress : null;
            const runOptions = mergeDeep({
                fallbackPolicy: 'none',
                batchRetry: 0,
                syncSceneRuntime: false,
                strictSceneRuntimeMatch: false,
                dryRunOnly: true
            }, isPlainObject(options) ? options : {});
            runOptions.onProgress = (payload = {}) => {
                progressEvents.push(payload);
                if (payload?.event === 'submit_payload_snapshot') {
                    submitPayloadSnapshot = {
                        ...payload
                    };
                    delete submitPayloadSnapshot.event;
                }
                if (userOnProgress) {
                    try {
                        userOnProgress(payload);
                    } catch { }
                }
            };
            const result = await createPlansByScene(sceneName, request, runOptions);
            if (!submitPayloadSnapshot && isPlainObject(result?.submitPayloadSnapshot)) {
                submitPayloadSnapshot = deepClone(result.submitPayloadSnapshot);
            }
            return {
                ok: !!result?.ok,
                error: result?.error || '',
                submitPayloadSnapshot: submitPayloadSnapshot || {},
                result,
                progressEvents
            };
        };
        const collectWizardParityUiSnapshot = (sceneName = '', strategy = {}, request = {}, caseInfo = {}) => {
            const els = wizardState.els || {};
            const firstPlan = Array.isArray(request?.plans) && request.plans.length ? request.plans[0] : {};
            const manualKeywordCount = parseKeywords(
                els?.manualInput?.value || strategy?.manualKeywords || '',
                {
                    bidPrice: toNumber(strategy?.defaultBidPrice, 1),
                    matchScope: DEFAULTS.matchScope,
                    onlineStatus: DEFAULTS.keywordOnlineStatus
                }
            ).length;
            return {
                caseId: String(caseInfo?.caseId || '').trim(),
                label: String(caseInfo?.label || '').trim(),
                sceneName: String(sceneName || '').trim(),
                staticControls: {
                    bidMode: String(els?.bidModeSelect?.value || strategy?.bidMode || '').trim(),
                    bidTargetV2: String(els?.bidTargetSelect?.value || strategy?.bidTargetV2 || '').trim(),
                    budgetType: String(els?.budgetTypeSelect?.value || strategy?.budgetType || '').trim(),
                    budgetValue: String(els?.budgetInput?.value || strategy?.dayAverageBudget || '').trim(),
                    keywordMode: String(els?.modeSelect?.value || strategy?.keywordMode || '').trim(),
                    recommendCount: String(els?.recommendCountInput?.value || strategy?.recommendCount || '').trim(),
                    planName: String(els?.prefixInput?.value || strategy?.planName || '').trim(),
                    singleCostEnabled: !!els?.singleCostEnableInput?.checked,
                    singleCostValue: String(els?.singleCostInput?.value || strategy?.singleCostV2 || '').trim(),
                    manualKeywordCount
                },
                strategy: deepClone(strategy || {}),
                requestPreview: {
                    sceneName: request?.sceneName || '',
                    marketingGoal: normalizeGoalLabel(firstPlan?.marketingGoal || request?.marketingGoal || ''),
                    planName: String(firstPlan?.planName || '').trim(),
                    bidMode: normalizeBidMode(firstPlan?.bidMode || strategy?.bidMode || 'smart', 'smart'),
                    budgetValue: pickBudgetValueFromObject(firstPlan?.budget || {}),
                    budget: deepClone(firstPlan?.budget || {}),
                    sceneSettingCount: isPlainObject(request?.sceneSettings)
                        ? Object.keys(request.sceneSettings).filter(key => String(request.sceneSettings[key] || '').trim() !== '').length
                        : 0
                },
                sceneSettings: deepClone(request?.sceneSettings || {})
            };
        };
        const applyWizardParityCase = async (sceneName = '', caseInfo = {}, options = {}) => {
            const targetScene = SCENE_NAME_LIST.includes(String(sceneName || '').trim())
                ? String(sceneName || '').trim()
                : '关键词推广';
            openWizard();
            const item = await resolveParityTestItem(targetScene, options);
            if (!item || !(item.materialId || item.itemId)) {
                throw new Error(`场景「${targetScene}」未找到可用商品`);
            }
            const rawStrategy = buildParityStrategyTemplate(targetScene, caseInfo?.strategyPatch || {});
            const rawSceneSettingsPatch = mergeDeep({}, isPlainObject(caseInfo?.sceneSettingsPatch) ? caseInfo.sceneSettingsPatch : {});
            const parityCostSeed = targetScene === '关键词推广'
                ? ensureKeywordParityTargetCostForTest(rawStrategy, rawSceneSettingsPatch, options)
                : {
                    strategy: rawStrategy,
                    sceneSettingsPatch: rawSceneSettingsPatch
                };
            const strategy = parityCostSeed.strategy;
            const sceneSettingsPatch = parityCostSeed.sceneSettingsPatch;
            const draft = KeywordPlanWizardStore.createWizardDraft(wizardState.draft || {});
            const planPrefix = String(strategy.planName || caseInfo?.planNamePrefix || '').trim() || `PARITY_${targetScene}_${nowStampSeconds()}`;
            draft.sceneName = targetScene;
            draft.planNamePrefix = planPrefix;
            draft.bidMode = normalizeBidMode(strategy.bidMode || draft.bidMode || 'smart', 'smart');
            draft.keywordMode = strategy.keywordMode || draft.keywordMode || DEFAULTS.keywordMode;
            draft.recommendCount = String(strategy.recommendCount || draft.recommendCount || DEFAULTS.recommendCount).trim() || String(DEFAULTS.recommendCount);
            draft.defaultBidPrice = String(strategy.defaultBidPrice || draft.defaultBidPrice || '1').trim() || '1';
            draft.dayAverageBudget = String(strategy.dayAverageBudget || draft.dayAverageBudget || '100').trim() || '100';
            draft.manualKeywords = String(strategy.manualKeywords || '').trim();
            draft.useWordPackage = strategy.useWordPackage !== false;
            draft.fallbackPolicy = normalizeWizardFallbackPolicy(draft.fallbackPolicy || 'auto');
            draft.addedItems = [deepClone(item)];
            draft.strategyList = [deepClone(strategy)];
            draft.editingStrategyId = strategy.id;
            draft.detailVisible = false;
            draft.sceneSettings = isPlainObject(draft.sceneSettings) ? draft.sceneSettings : {};
            draft.sceneSettingTouched = isPlainObject(draft.sceneSettingTouched) ? draft.sceneSettingTouched : {};
            if (strategy.marketingGoal) {
                sceneSettingsPatch.营销目标 = sceneSettingsPatch.营销目标 || strategy.marketingGoal;
                if (targetScene === '关键词推广') {
                    sceneSettingsPatch.选择卡位方案 = sceneSettingsPatch.选择卡位方案 || strategy.marketingGoal;
                }
            }
            draft.sceneSettings[targetScene] = mergeDeep({}, draft.sceneSettings[targetScene] || {}, sceneSettingsPatch);
            draft.sceneSettingTouched[targetScene] = isPlainObject(draft.sceneSettingTouched[targetScene])
                ? draft.sceneSettingTouched[targetScene]
                : {};
            Object.keys(sceneSettingsPatch).forEach(label => {
                const key = typeof normalizeSceneFieldKey === 'function'
                    ? normalizeSceneFieldKey(label)
                    : String(label || '').trim();
                if (!key) return;
                draft.sceneSettingTouched[targetScene][key] = true;
            });
            wizardState.draft = draft;
            wizardState.addedItems = [deepClone(item)];
            wizardState.crowdList = Array.isArray(caseInfo?.crowdList) ? deepClone(caseInfo.crowdList) : [];
            wizardState.strategyList = [deepClone(strategy)];
            wizardState.editingStrategyId = strategy.id;
            wizardState.detailVisible = false;
            if (typeof wizardState.fillUIFromDraft === 'function') {
                wizardState.fillUIFromDraft();
            }
            if (wizardState.els?.sceneSelect instanceof HTMLSelectElement && wizardState.els.sceneSelect.value !== targetScene) {
                wizardState.els.sceneSelect.value = targetScene;
                wizardState.els.sceneSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (typeof wizardState.renderStrategyList === 'function') {
                wizardState.renderStrategyList();
            }
            if (typeof wizardState.buildRequest !== 'function') {
                throw new Error('wizard_build_request_unavailable');
            }
            const request = wizardState.buildRequest();
            const activeStrategy = deepClone((wizardState.strategyList || [])[0] || strategy);
            const uiSnapshot = collectWizardParityUiSnapshot(targetScene, activeStrategy, request, caseInfo);
            return {
                sceneName: targetScene,
                request,
                strategy: activeStrategy,
                item: deepClone(item),
                uiSnapshot
            };
        };
        const compareWizardParityCase = ({
            sceneName = '',
            request = {},
            uiSnapshot = {},
            submitPayloadSnapshot = {},
            dryRunResult = {}
        } = {}) => {
            const targetScene = String(sceneName || request?.sceneName || '').trim();
            const firstPlan = Array.isArray(request?.plans) && request.plans.length ? request.plans[0] : {};
            const sampleCampaign = isPlainObject(dryRunResult?.sample?.campaign) ? dryRunResult.sample.campaign : {};
            const expectedMarketingGoal = normalizeGoalLabel(
                firstPlan?.marketingGoal
                || request?.marketingGoal
                || uiSnapshot?.strategy?.marketingGoal
                || ''
            );
            const actualMarketingGoal = normalizeGoalLabel(
                submitPayloadSnapshot?.marketingGoal
                || dryRunResult?.sample?.meta?.marketingGoal
                || ''
            );
            const diffs = [];
            if (expectedMarketingGoal && actualMarketingGoal && expectedMarketingGoal !== actualMarketingGoal) {
                diffs.push({
                    field: 'marketingGoal',
                    expected: expectedMarketingGoal,
                    actual: actualMarketingGoal
                });
            }
            const expectedPlanName = String(firstPlan?.planName || '').trim();
            const actualPlanName = String(sampleCampaign?.campaignName || '').trim();
            if (expectedPlanName && actualPlanName && expectedPlanName !== actualPlanName) {
                diffs.push({
                    field: 'planName',
                    expected: expectedPlanName,
                    actual: actualPlanName
                });
            }
            const expectedBudgetValue = pickBudgetValueFromObject(firstPlan?.budget || {});
            const actualBudgetValue = pickBudgetValueFromObject(sampleCampaign || {});
            const isLeadSceneBudgetAutoRaised = targetScene === '线索推广'
                && expectedBudgetValue > 0
                && actualBudgetValue >= 1500
                && actualBudgetValue >= expectedBudgetValue;
            if (!isLeadSceneBudgetAutoRaised && expectedBudgetValue > 0 && actualBudgetValue > 0 && Math.abs(expectedBudgetValue - actualBudgetValue) > 0.001) {
                diffs.push({
                    field: 'budgetValue',
                    expected: expectedBudgetValue,
                    actual: actualBudgetValue
                });
            } else if (!isLeadSceneBudgetAutoRaised && expectedBudgetValue > 0 && !(actualBudgetValue > 0)) {
                diffs.push({
                    field: 'budgetValue',
                    expected: expectedBudgetValue,
                    actual: actualBudgetValue
                });
            }
            if (targetScene === '关键词推广') {
                const expectedBidMode = normalizeBidMode(
                    firstPlan?.bidMode
                    || uiSnapshot?.strategy?.bidMode
                    || request?.common?.bidMode
                    || 'smart',
                    'smart'
                );
                const actualBidMode = normalizeBidMode(
                    submitPayloadSnapshot?.bidMode
                    || dryRunResult?.sample?.meta?.bidMode
                    || '',
                    expectedBidMode
                );
                if (expectedBidMode !== actualBidMode) {
                    diffs.push({
                        field: 'bidMode',
                        expected: expectedBidMode,
                        actual: actualBidMode
                    });
                }
                const expectedBidTarget = expectedBidMode === 'smart'
                    ? String(firstPlan?.campaignOverride?.bidTargetV2 || '').trim()
                    : '';
                const actualBidTarget = String(
                    submitPayloadSnapshot?.bidTargetV2
                    || dryRunResult?.sample?.campaign?.bidTargetV2
                    || ''
                ).trim();
                if (expectedBidTarget !== actualBidTarget) {
                    diffs.push({
                        field: 'bidTargetV2',
                        expected: expectedBidTarget,
                        actual: actualBidTarget
                    });
                }
                const expectedManualKeywordCount = parseKeywords(
                    uiSnapshot?.strategy?.manualKeywords || '',
                    {
                        bidPrice: toNumber(uiSnapshot?.strategy?.defaultBidPrice, 1),
                        matchScope: DEFAULTS.matchScope,
                        onlineStatus: DEFAULTS.keywordOnlineStatus
                    }
                ).length;
                const actualWordListCount = toNumber(submitPayloadSnapshot?.wordListCount, 0);
                if (expectedManualKeywordCount > 0 && actualWordListCount < expectedManualKeywordCount) {
                    diffs.push({
                        field: 'wordListCount',
                        expected: `>=${expectedManualKeywordCount}`,
                        actual: actualWordListCount
                    });
                }
            }
            return {
                ok: diffs.length === 0,
                diffs,
                expected: {
                    sceneName: targetScene,
                    marketingGoal: expectedMarketingGoal,
                    planName: expectedPlanName,
                    budgetValue: expectedBudgetValue
                },
                actual: {
                    sceneName: submitPayloadSnapshot?.sceneName || targetScene,
                    marketingGoal: actualMarketingGoal,
                    planName: actualPlanName,
                    budgetValue: actualBudgetValue
                }
            };
        };
        const runWizardSceneParityTest = async (options = {}) => {
            const rounds = Math.max(1, Math.min(10, toNumber(options.rounds, 1)));
            const scenes = Array.isArray(options.scenes) && options.scenes.length
                ? uniqueBy(options.scenes.map(item => String(item || '').trim()).filter(Boolean), item => item)
                    .filter(scene => SCENE_NAME_LIST.includes(scene))
                : SCENE_NAME_LIST.slice();
            const maxCasesPerScene = Math.max(1, Math.min(24, toNumber(options.maxCasesPerScene, 8)));
            const dryRunOnly = options.dryRunOnly !== false;
            const rows = [];
            const onProgress = typeof options.onProgress === 'function' ? options.onProgress : null;
            const apiCoverage = checkWizardApiCoverage();
            for (let round = 1; round <= rounds; round += 1) {
                for (let sceneIdx = 0; sceneIdx < scenes.length; sceneIdx += 1) {
                    const sceneName = scenes[sceneIdx];
                    const matrix = buildSceneParityCaseMatrix(sceneName, options);
                    const sceneCases = Array.isArray(matrix?.cases) ? matrix.cases.slice(0, maxCasesPerScene) : [];
                    for (let caseIdx = 0; caseIdx < sceneCases.length; caseIdx += 1) {
                        const caseInfo = sceneCases[caseIdx];
                        const row = {
                            round,
                            sceneName,
                            caseId: caseInfo?.caseId || '',
                            caseLabel: caseInfo?.label || '',
                            index: caseIdx + 1,
                            total: sceneCases.length,
                            ok: false,
                            error: '',
                            diffCount: 0,
                            diffs: [],
                            requestPreview: {},
                            submitPayloadSnapshot: {},
                            uiSnapshot: {}
                        };
                        if (onProgress) {
                            try {
                                onProgress({
                                    event: 'wizard_parity_case_start',
                                    round,
                                    sceneName,
                                    caseId: row.caseId,
                                    caseLabel: row.caseLabel,
                                    index: row.index,
                                    total: row.total
                                });
                            } catch { }
                        }
                        try {
                            const applied = await applyWizardParityCase(sceneName, caseInfo, options);
                            row.uiSnapshot = deepClone(applied.uiSnapshot || {});
                            row.requestPreview = {
                                sceneName: applied.request?.sceneName || '',
                                planName: applied.request?.plans?.[0]?.planName || '',
                                marketingGoal: normalizeGoalLabel(
                                    applied.request?.plans?.[0]?.marketingGoal
                                    || applied.request?.marketingGoal
                                    || ''
                                )
                            };
                            const submit = await collectWizardSubmitSnapshot(applied.request, {
                                ...options,
                                dryRunOnly,
                                onProgress: null
                            });
                            row.submitPayloadSnapshot = deepClone(submit?.submitPayloadSnapshot || {});
                            const compare = compareWizardParityCase({
                                sceneName,
                                request: applied.request,
                                uiSnapshot: applied.uiSnapshot,
                                submitPayloadSnapshot: submit?.submitPayloadSnapshot || {},
                                dryRunResult: submit?.result || {}
                            });
                            row.ok = !!compare.ok;
                            row.diffCount = Array.isArray(compare?.diffs) ? compare.diffs.length : 0;
                            row.diffs = Array.isArray(compare?.diffs) ? compare.diffs : [];
                            if (!submit?.ok && !row.error) {
                                row.error = submit?.error || (submit?.result?.error || '');
                            }
                        } catch (err) {
                            row.ok = false;
                            row.error = err?.message || String(err);
                        }
                        rows.push(row);
                        if (onProgress) {
                            try {
                                onProgress({
                                    event: 'wizard_parity_case_done',
                                    round,
                                    sceneName,
                                    caseId: row.caseId,
                                    caseLabel: row.caseLabel,
                                    index: row.index,
                                    total: row.total,
                                    ok: row.ok,
                                    diffCount: row.diffCount,
                                    error: row.error || ''
                                });
                            } catch { }
                        }
                    }
                }
            }
            const byScene = scenes.map(sceneName => {
                const sceneRows = rows.filter(item => item.sceneName === sceneName);
                return {
                    sceneName,
                    total: sceneRows.length,
                    pass: sceneRows.filter(item => item.ok).length,
                    fail: sceneRows.filter(item => !item.ok).length,
                    diffCount: sceneRows.reduce((sum, item) => sum + toNumber(item.diffCount, 0), 0)
                };
            });
            const byRound = Array.from({ length: rounds }).map((_, idx) => {
                const round = idx + 1;
                const roundRows = rows.filter(item => item.round === round);
                return {
                    round,
                    total: roundRows.length,
                    pass: roundRows.filter(item => item.ok).length,
                    fail: roundRows.filter(item => !item.ok).length,
                    diffCount: roundRows.reduce((sum, item) => sum + toNumber(item.diffCount, 0), 0)
                };
            });
            const result = {
                ok: rows.length > 0 && rows.every(item => item.ok),
                dryRunOnly,
                rounds,
                scenes,
                scannedAt: new Date().toISOString(),
                count: rows.length,
                successCount: rows.filter(item => item.ok).length,
                failCount: rows.filter(item => !item.ok).length,
                byScene,
                byRound,
                apiCoverage,
                list: rows
            };
            window.__AM_WXT_WIZARD_PARITY_RESULT__ = result;
            return result;
        };

        const CREATE_FAILURE_CONFLICT_RE = /(onebpsite-existed|horizontal-onebpsite-existed|daily-existed|crossaccount-existed|order-existed|diffbizcode-existed|存在在投计划|在投计划|持续推广计划|冲突|已存在.*计划|计划已存在|already.*exist|conflict)/i;
        const CREATE_FAILURE_DUPLICATE_PLAN_NAME_RE = /(计划标题不合法|标题重复|不允许重复|计划名称重复|计划名重复|campaign\s*name.*(exist|duplicate|repeat)|title.*(duplicate|repeat))/i;
        const CREATE_FAILURE_ONE_CLICK_CONFLICT_CODE_RE = /(crossaccount-existed|onebpsite-existed|horizontal-onebpsite-existed|order-existed|daily-existed|diffbizcode-existed)/i;
        const CREATE_FAILURE_PERMISSION_RE = /(csrf|403|无权限|权限不足|风控|登录失效|bizlogin|forbidden)/i;
        const CREATE_FAILURE_MAPPING_RE = /(不支持的出价类型|INVALID_PARAMETER|参数.*(非法|错误|校验失败)|字段.*(缺失|错误)|unsupported)/i;
        const CREATE_FAILURE_THROTTLE_RE = /(FAIL_SYS_USER_VALIDATE|被挤爆|稍后重试|系统繁忙|服务繁忙|请求过于频繁|rate.?limit|throttle|too\\s*many\\s*requests)/i;

        const classifyCreateFailure = (errorText = '') => {
            const text = String(errorText || '').trim();
            if (!text) return 'unknown';
            if (isWordPackageValidationError(text)) return 'keyword_word_package';
            if (CREATE_FAILURE_DUPLICATE_PLAN_NAME_RE.test(text)) return 'duplicate_plan_name';
            if (CREATE_FAILURE_CONFLICT_RE.test(text)) return 'conflict';
            if (CREATE_FAILURE_THROTTLE_RE.test(text)) return 'throttle';
            if (CREATE_FAILURE_PERMISSION_RE.test(text)) return 'permission_or_risk';
            if (CREATE_FAILURE_MAPPING_RE.test(text)) return 'mapping';
            return 'unknown';
        };

        const buildDuplicatePlanRetryName = (seedName = '', sceneName = '') => {
            const source = String(seedName || '').trim() || String(sceneName || '').trim() || '计划';
            const timeSuffix = String(nowStampSeconds()).slice(-8);
            const randSuffix = Math.random().toString(36).slice(2, 4);
            const suffix = `${timeSuffix}${randSuffix}`;
            const maxLength = 60;
            const keepLength = Math.max(6, maxLength - suffix.length - 1);
            const clipped = source.replace(/\s+/g, ' ').trim().slice(0, keepLength).replace(/[_-]+$/, '');
            return `${clipped || '计划'}_${suffix}`;
        };

        const toPositiveIdText = (value) => {
            if (value === undefined || value === null || value === '') return '';
            const text = String(value).trim();
            if (!/^\d{4,}$/.test(text)) return '';
            return text;
        };

        const normalizeCampaignRefList = (list = []) => uniqueBy(
            (Array.isArray(list) ? list : [])
                .map(item => {
                    const campaignId = toPositiveIdText(item?.campaignId || item?.planId || item?.id || '');
                    if (!campaignId) return null;
                    return {
                        campaignId,
                        itemId: toPositiveIdText(item?.itemId || item?.materialId || ''),
                        status: item?.status,
                        source: normalizeText(item?.source || '')
                    };
                })
                .filter(Boolean),
            item => `${item.campaignId}::${item.itemId || ''}`
        );

        const collectCampaignRefsFromNode = (node, out = [], state = {}) => {
            if (!node || typeof node !== 'object') return;
            const seen = state.seen || new WeakSet();
            const depth = toNumber(state.depth, 0);
            if (depth > 12) return;
            if (node && typeof node === 'object') {
                if (seen.has(node)) return;
                seen.add(node);
            }
            if (Array.isArray(node)) {
                node.forEach(item => collectCampaignRefsFromNode(item, out, { seen, depth: depth + 1 }));
                return;
            }
            if (!isPlainObject(node)) return;

            const localItemId = toPositiveIdText(
                node.itemId
                || node.materialId
                || node.auctionId
                || node.targetItemId
                || node.targetMaterialId
            );
            const localStatus = node.status !== undefined
                ? node.status
                : (node.onlineStatus !== undefined ? node.onlineStatus : node.campaignStatus);
            const idKeys = ['campaignId', 'campaign_id', 'planId', 'plan_id', 'bpCampaignId', 'targetCampaignId'];
            idKeys.forEach(key => {
                const campaignId = toPositiveIdText(node[key]);
                if (!campaignId) return;
                out.push({
                    campaignId,
                    itemId: localItemId || '',
                    status: localStatus,
                    source: `node.${key}`
                });
            });
            const idListKeys = ['campaignIdList', 'campaign_id_list', 'planIdList', 'plan_id_list', 'campaignIds', 'planIds', 'idList'];
            idListKeys.forEach(key => {
                const list = Array.isArray(node[key]) ? node[key] : [];
                list.forEach(id => {
                    const campaignId = toPositiveIdText(id);
                    if (!campaignId) return;
                    out.push({
                        campaignId,
                        itemId: localItemId || '',
                        status: localStatus,
                        source: `node.${key}`
                    });
                });
            });
            Object.keys(node).forEach(key => {
                const val = node[key];
                if (!val || typeof val !== 'object') return;
                collectCampaignRefsFromNode(val, out, { seen, depth: depth + 1 });
            });
        };

        const extractCampaignRefsFromErrorText = (errorText = '') => {
            const text = String(errorText || '').trim();
            if (!text) return [];
            const refs = [];
            const scoped = text.match(/(?:campaignId|campaign_id|planId|plan_id)[=:：\s]*(\d{4,})/ig) || [];
            scoped.forEach(segment => {
                const id = toPositiveIdText((segment.match(/(\d{4,})/) || [])[1]);
                if (!id) return;
                refs.push({
                    campaignId: id,
                    itemId: '',
                    status: '',
                    source: 'error_text_scoped'
                });
            });
            if (!refs.length) {
                const fallbackNumbers = text.match(/\d{6,}/g) || [];
                fallbackNumbers.slice(0, 8).forEach(id => {
                    refs.push({
                        campaignId: toPositiveIdText(id),
                        itemId: '',
                        status: '',
                        source: 'error_text_fallback'
                    });
                });
            }
            return normalizeCampaignRefList(refs);
        };

        const extractConflictCampaignRefs = (failureEntry = {}, itemId = '') => {
            const refs = [];
            if (isPlainObject(failureEntry?.response)) {
                collectCampaignRefsFromNode(failureEntry.response, refs, { depth: 0, seen: new WeakSet() });
            }
            if (isPlainObject(failureEntry?.detail)) {
                collectCampaignRefsFromNode(failureEntry.detail, refs, { depth: 0, seen: new WeakSet() });
            }
            if (isPlainObject(failureEntry?.fullResponse)) {
                collectCampaignRefsFromNode(failureEntry.fullResponse, refs, { depth: 0, seen: new WeakSet() });
            }
            const textRefs = extractCampaignRefsFromErrorText(failureEntry?.error || '');
            refs.push(...textRefs);
            const normalized = normalizeCampaignRefList(refs);
            const targetItemId = toPositiveIdText(itemId);
            if (!targetItemId) return normalized;
            const sameItem = normalized.filter(item => item.itemId && item.itemId === targetItemId);
            if (sameItem.length) return sameItem;
            return normalized;
        };

        const isCampaignStatusActive = (statusValue) => {
            if (statusValue === undefined || statusValue === null || statusValue === '') return null;
            if (typeof statusValue === 'boolean') return statusValue;
            const num = Number(statusValue);
            if (Number.isFinite(num)) {
                if (num === 1) return true;
                if (num === 0) return false;
            }
            const text = String(statusValue).trim().toLowerCase();
            if (!text) return null;
            if (/(online|active|running|enable|投放|在投|开启|on)/.test(text)) return true;
            if (/(offline|pause|stop|suspend|disable|删除|下线|暂停|关闭|off)/.test(text)) return false;
            return null;
        };

        const buildLifecyclePayloadByContract = (contract = {}, context = {}) => {
            const requestKeys = Array.isArray(contract?.requestKeys) ? contract.requestKeys : [];
            const bodyKeys = Array.isArray(contract?.bodyKeys) ? contract.bodyKeys : requestKeys;
            const keyList = uniqueBy(requestKeys.concat(bodyKeys).map(item => normalizeText(item)).filter(Boolean), item => item);
            const normalizedAction = normalizeLifecycleAction(context?.action || context?.lifecycleAction || contract?.action || '');
            const itemId = toPositiveIdText(context?.itemId || '');
            const campaignId = toPositiveIdText(context?.campaignId || '');
            const campaignIdList = uniqueBy(
                (Array.isArray(context?.campaignIdList) ? context.campaignIdList : [campaignId])
                    .map(item => toPositiveIdText(item))
                    .filter(Boolean),
                item => item
            );
            const toCompactPayload = (payload = {}) => Object.keys(payload).reduce((acc, key) => {
                const value = payload[key];
                if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) return acc;
                acc[key] = value;
                return acc;
            }, {});
            const toNumericId = (idText = '') => {
                const num = Number(idText);
                return Number.isFinite(num) ? num : idText;
            };
            const normalizedCampaignId = campaignId ? toNumericId(campaignId) : '';
            const normalizedCampaignIdList = campaignIdList.map(id => toNumericId(id));
            const fallbackPayload = {
                itemId,
                materialId: itemId,
                campaignId: normalizedCampaignId || campaignId,
                campaignIdList: normalizedCampaignIdList.slice(0, 50),
                pageNo: 1,
                pageSize: 50,
                offset: 0
            };
            const payload = keyList.length ? {} : toCompactPayload(fallbackPayload);
            const ensureCampaignList = () => {
                if (!Array.isArray(payload.campaignList)) payload.campaignList = [];
                if (!isPlainObject(payload.campaignList[0])) payload.campaignList[0] = {};
                return payload.campaignList[0];
            };
            const ensureEntityList = () => {
                if (!Array.isArray(payload.entityList)) payload.entityList = [];
                if (!isPlainObject(payload.entityList[0])) payload.entityList[0] = {};
                return payload.entityList[0];
            };
            const setSimplePayloadKey = (key, value) => {
                if (!key || value === undefined || value === null || value === '') return;
                if (Array.isArray(value) && !value.length) return;
                if (/[.\[\]]/.test(key)) return;
                payload[key] = value;
            };
            const hasCampaignListHint = keyList.some(rawKey => /campaignlist|displaystatus/.test(String(rawKey || '').toLowerCase()));
            const hasEntityListHint = keyList.some(rawKey => /entitylist/.test(String(rawKey || '').toLowerCase()));
            keyList.forEach(rawKey => {
                const key = String(rawKey || '').trim();
                const lower = key.toLowerCase();
                if (!key) return;
                if (lower === 'bizcode' || lower === 'csrfid' || lower === 'loginpointid') return;
                if (/campaignlist/.test(lower)) {
                    if (campaignId) {
                        const row = ensureCampaignList();
                        row.campaignId = normalizedCampaignId;
                    }
                    if (/displaystatus/.test(lower) && context?.desiredStatus !== undefined) {
                        const row = ensureCampaignList();
                        row.displayStatus = Number(context.desiredStatus) === 1 ? 'start' : 'pause';
                    }
                    return;
                }
                if (/entitylist/.test(lower)) {
                    if (campaignId) {
                        const row = ensureEntityList();
                        row.campaignId = normalizedCampaignId;
                    }
                    return;
                }
                if (/displaystatus/.test(lower) && context?.desiredStatus !== undefined) {
                    setSimplePayloadKey(key, Number(context.desiredStatus) === 1 ? 'start' : 'pause');
                    return;
                }
                if (/itemidlist|materialidlist/.test(lower)) {
                    setSimplePayloadKey(key, itemId ? [itemId] : []);
                    return;
                }
                if (/itemid|materialid|auctionid/.test(lower)) {
                    if (itemId) setSimplePayloadKey(key, itemId);
                    return;
                }
                if (/campaignidlist|planidlist|campaignids|planids|idlist/.test(lower)) {
                    if (normalizedCampaignIdList.length) setSimplePayloadKey(key, normalizedCampaignIdList.slice(0, 50));
                    return;
                }
                if (/campaignid|planid|targetcampaignid/.test(lower)) {
                    if (campaignId) setSimplePayloadKey(key, normalizedCampaignId);
                    return;
                }
                if (/pagesize|limit|size/.test(lower)) {
                    setSimplePayloadKey(key, Math.max(20, toNumber(context?.pageSize, 50)));
                    return;
                }
                if (/pageno|pageindex|page|offset|start/.test(lower)) {
                    setSimplePayloadKey(key, /offset|start/.test(lower) ? 0 : 1);
                    return;
                }
                if (/status|online/.test(lower) && context?.desiredStatus !== undefined) {
                    setSimplePayloadKey(key, context.desiredStatus);
                    return;
                }
                if (/keyword|search|query/.test(lower) && context?.query !== undefined) {
                    setSimplePayloadKey(key, context.query);
                }
            });
            if (normalizedAction === 'pause') {
                if (campaignId && payload.campaignId === undefined) {
                    payload.campaignId = normalizedCampaignId;
                }
                if (context?.desiredStatus !== undefined && payload.onlineStatus === undefined) {
                    payload.onlineStatus = context.desiredStatus;
                }
                if (hasCampaignListHint) {
                    const row = ensureCampaignList();
                    if (row.campaignId === undefined && campaignId) row.campaignId = normalizedCampaignId;
                    if (row.displayStatus === undefined && context?.desiredStatus !== undefined) {
                        row.displayStatus = Number(context.desiredStatus) === 1 ? 'start' : 'pause';
                    }
                }
            }
            if (normalizedAction === 'delete') {
                if ((!Array.isArray(payload.campaignIdList) || !payload.campaignIdList.length) && normalizedCampaignIdList.length) {
                    payload.campaignIdList = normalizedCampaignIdList.slice(0, 50);
                }
                if (payload.campaignId === undefined && campaignId) {
                    payload.campaignId = normalizedCampaignId;
                }
                if (hasCampaignListHint && campaignId) {
                    const row = ensureCampaignList();
                    if (row.campaignId === undefined) row.campaignId = normalizedCampaignId;
                }
                if (hasEntityListHint && campaignId) {
                    const row = ensureEntityList();
                    if (row.campaignId === undefined) row.campaignId = normalizedCampaignId;
                }
            }
            if (Array.isArray(payload.campaignList)) {
                payload.campaignList = payload.campaignList.filter(item => isPlainObject(item) && Object.keys(item).length > 0);
                if (!payload.campaignList.length) delete payload.campaignList;
            }
            if (Array.isArray(payload.entityList)) {
                payload.entityList = payload.entityList.filter(item => isPlainObject(item) && Object.keys(item).length > 0);
                if (!payload.entityList.length) delete payload.entityList;
            }
            return toCompactPayload(payload);
        };

        const executeLifecycleActionByContract = async (sceneName = '', action = '', context = {}, options = {}) => {
            const targetScene = String(sceneName || '').trim();
            const normalizedAction = normalizeLifecycleAction(action);
            const bizCode = normalizeSceneBizCode(
                context?.bizCode
                || options?.bizCode
                || resolveSceneBizCodeHint(targetScene)
                || SCENE_BIZCODE_HINT_FALLBACK[targetScene]
                || DEFAULTS.bizCode
            ) || DEFAULTS.bizCode;
            const contractResult = getLifecycleContract(targetScene, normalizedAction, options);
            if (!contractResult?.ok || !contractResult.contract) {
                return {
                    ok: false,
                    sceneName: targetScene,
                    action: normalizedAction,
                    contract: null,
                    payload: {},
                    response: null,
                    error: contractResult?.error || 'lifecycle_contract_not_ready'
                };
            }
            const contract = contractResult.contract;
            const payload = buildLifecyclePayloadByContract(contract, {
                ...context,
                action: normalizedAction
            });
            let captureId = '';
            if (options.capture !== false) {
                try {
                    captureId = startNetworkCapture({ sceneName: targetScene }).captureId || '';
                } catch { }
            }
            try {
                const response = await requestOne(contract.endpoint, bizCode, payload, options.requestOptions || {});
                return {
                    ok: true,
                    sceneName: targetScene,
                    action: normalizedAction,
                    contract,
                    payload,
                    response,
                    error: ''
                };
            } catch (err) {
                return {
                    ok: false,
                    sceneName: targetScene,
                    action: normalizedAction,
                    contract,
                    payload,
                    response: null,
                    error: err?.message || String(err)
                };
            } finally {
                if (captureId) {
                    try {
                        const stopped = stopNetworkCapture(captureId, { withRecords: false });
                        if (Array.isArray(stopped?.contracts) && stopped.contracts.length) {
                            rememberLifecycleContractsFromContractList(targetScene, stopped.contracts, {
                                source: `lifecycle_action_${normalizedAction}`
                            });
                        }
                    } catch { }
                }
            }
        };

        const queryConflictCampaignRefsByItem = async (sceneName = '', itemId = '', options = {}) => {
            const targetItemId = toPositiveIdText(itemId);
            const listAction = await executeLifecycleActionByContract(sceneName, 'list_conflict', {
                itemId: targetItemId,
                bizCode: options.bizCode || '',
                pageSize: Math.max(20, toNumber(options.pageSize, 80)),
                query: targetItemId
            }, options);
            if (!listAction.ok) {
                return {
                    ok: false,
                    refs: [],
                    response: null,
                    error: listAction.error || 'list_conflict_failed'
                };
            }
            const refs = [];
            collectCampaignRefsFromNode(listAction.response, refs, { depth: 0, seen: new WeakSet() });
            const normalized = normalizeCampaignRefList(refs);
            const filtered = targetItemId
                ? normalized.filter(item => !item.itemId || item.itemId === targetItemId)
                : normalized;
            return {
                ok: true,
                refs: filtered,
                response: listAction.response,
                error: ''
            };
        };

        const extractConflictItemIdList = (failureEntry = {}, fallbackItemId = '') => {
            const out = [];
            const pushId = (value) => {
                const id = toPositiveIdText(value);
                if (!id) return;
                out.push(id);
            };
            pushId(fallbackItemId);
            if (isPlainObject(failureEntry?.detail)) {
                pushId(failureEntry.detail.itemId || failureEntry.detail.materialId || failureEntry.detail.auctionId || '');
            }
            if (isPlainObject(failureEntry?.response)) {
                pushId(failureEntry.response.itemId || failureEntry.response.materialId || failureEntry.response.auctionId || '');
            }
            const detailList = Array.isArray(failureEntry?.fullResponse?.data?.errorDetails)
                ? failureEntry.fullResponse.data.errorDetails
                : [];
            detailList.forEach(detail => {
                if (!isPlainObject(detail?.result)) return;
                pushId(detail.result.itemId || detail.result.materialId || detail.result.auctionId || '');
            });
            return uniqueBy(out, item => item);
        };

        const resolveConflictByOneClick = async (failureEntry = {}, context = {}) => {
            const failureCode = normalizeText(failureEntry?.code || '');
            const failureError = normalizeText(failureEntry?.error || '');
            const applicable = (failureCode && CREATE_FAILURE_ONE_CLICK_CONFLICT_CODE_RE.test(failureCode))
                || (!failureCode && CREATE_FAILURE_ONE_CLICK_CONFLICT_CODE_RE.test(failureError));
            if (!applicable) {
                return {
                    ok: false,
                    handled: false,
                    itemIdList: [],
                    pauseCampaignList: [],
                    stoppedCampaignIds: [],
                    failedItems: [],
                    conflictBizCode: '',
                    fromBizCode: '',
                    error: 'one_click_not_applicable'
                };
            }
            const itemIdList = extractConflictItemIdList(failureEntry, context?.itemId || '');
            if (!itemIdList.length) {
                return {
                    ok: false,
                    handled: false,
                    itemIdList: [],
                    pauseCampaignList: [],
                    stoppedCampaignIds: [],
                    failedItems: [],
                    conflictBizCode: '',
                    fromBizCode: '',
                    error: 'one_click_item_missing'
                };
            }
            const detailBizCode = normalizeSceneBizCode(
                failureEntry?.detail?.bizCode
                || failureEntry?.response?.bizCode
                || ''
            );
            const conflictBizCode = normalizeSceneBizCode(
                context?.conflictBizCode
                || detailBizCode
                || resolveSceneBizCodeHint(context?.sceneName || '')
                || 'onebpSite'
            ) || 'onebpSite';
            const fromBizCode = normalizeSceneBizCode(
                context?.fromBizCode
                || context?.entryBizCode
                || context?.bizCode
                || resolveSceneBizCodeHint(context?.entrySceneName || '')
                || DEFAULTS.bizCode
            ) || DEFAULTS.bizCode;
            const errorExtInfo = isPlainObject(context?.errorExtInfo)
                ? deepClone(context.errorExtInfo)
                : (isPlainObject(failureEntry?.fullResponse?.data?.errorExtInfo)
                    ? deepClone(failureEntry.fullResponse.data.errorExtInfo)
                    : {});
            const pauseCampaignList = [];
            const failedItems = [];
            for (let i = 0; i < itemIdList.length; i++) {
                const itemId = itemIdList[i];
                try {
                    const response = await requestOne('/campaign/onebpSite/oneClick.json', conflictBizCode, {
                        ...errorExtInfo,
                        fromBizCode,
                        itemIdList: [itemId],
                        bizCode: conflictBizCode
                    }, context?.requestOptions || {});
                    const list = Array.isArray(response?.data?.list) ? response.data.list : [];
                    if (list.length) pauseCampaignList.push(...list);
                    const errorDetails = Array.isArray(response?.data?.errorDetails) ? response.data.errorDetails : [];
                    if (errorDetails.length) {
                        failedItems.push({
                            itemId,
                            error: errorDetails.map(detail => `${detail?.code || 'ERROR'}：${detail?.msg || 'one_click_failed'}`).join('；')
                        });
                    }
                } catch (err) {
                    failedItems.push({
                        itemId,
                        error: err?.message || String(err)
                    });
                }
            }
            const stoppedCampaignIds = uniqueBy(
                pauseCampaignList
                    .map(item => toPositiveIdText(item?.campaignId || item?.planId || item?.id || ''))
                    .filter(Boolean),
                item => item
            );
            const ok = failedItems.length === 0;
            return {
                ok,
                handled: itemIdList.length > 0 && ok,
                itemIdList,
                pauseCampaignList,
                stoppedCampaignIds,
                failedItems,
                conflictBizCode,
                fromBizCode,
                error: ok ? '' : 'one_click_partial_failed'
            };
        };

        const resolveCreateConflicts = async (failureEntry = {}, context = {}) => {
            const sceneName = String(context?.sceneName || '').trim();
            const itemId = toPositiveIdText(context?.itemId || '');
            const conflictPolicy = String(context?.conflictPolicy || 'auto_stop_retry').trim();
            const stopScope = String(context?.stopScope || 'same_item_only').trim();
            const classification = classifyCreateFailure(failureEntry?.error || '');
            if (classification !== 'conflict') {
                return {
                    ok: false,
                    handled: false,
                    classification,
                    sceneName,
                    itemId,
                    stoppedCampaignIds: [],
                    unresolvedCampaignIds: [],
                    error: 'not_conflict_failure'
                };
            }
            if (conflictPolicy !== 'auto_stop_retry') {
                return {
                    ok: false,
                    handled: false,
                    classification,
                    sceneName,
                    itemId,
                    stoppedCampaignIds: [],
                    unresolvedCampaignIds: [],
                    error: 'conflict_policy_disabled'
                };
            }

            let oneClickResult = null;
            if (context?.oneClickConflictResolve !== false) {
                oneClickResult = await resolveConflictByOneClick(failureEntry, {
                    ...context,
                    sceneName,
                    itemId
                });
                if (oneClickResult?.handled && oneClickResult?.ok) {
                    const stoppedIds = Array.isArray(oneClickResult?.stoppedCampaignIds)
                        ? oneClickResult.stoppedCampaignIds
                        : [];
                    return {
                        ok: true,
                        handled: true,
                        classification,
                        sceneName,
                        itemId,
                        stoppedCampaignIds: uniqueBy(stoppedIds, id => id),
                        unresolvedCampaignIds: [],
                        pauseConfirmedIds: uniqueBy(stoppedIds, id => id),
                        deletedFallbackCampaignIds: [],
                        oneClickResult,
                        error: ''
                    };
                }
            }

            let refs = extractConflictCampaignRefs(failureEntry, itemId);
            if (!refs.length) {
                const queried = await queryConflictCampaignRefsByItem(sceneName, itemId, {
                    bizCode: context?.bizCode || '',
                    requestOptions: context?.requestOptions || {},
                    capture: context?.capture !== false
                });
                if (queried.ok) refs = queried.refs;
            }
            if (stopScope === 'same_item_only') {
                refs = refs.filter(item => item.itemId && item.itemId === itemId);
            }
            if (!refs.length) {
                return {
                    ok: false,
                    handled: false,
                    classification,
                    sceneName,
                    itemId,
                    stoppedCampaignIds: [],
                    unresolvedCampaignIds: [],
                    oneClickResult,
                    error: oneClickResult?.error || 'conflict_campaign_not_found'
                };
            }

            const stoppedCampaignIds = [];
            const unresolvedCampaignIds = [];
            const deletedFallbackCampaignIds = [];
            for (let i = 0; i < refs.length; i++) {
                const ref = refs[i];
                const campaignId = toPositiveIdText(ref.campaignId);
                if (!campaignId) continue;
                const pauseAction = await executeLifecycleActionByContract(sceneName, 'pause', {
                    itemId,
                    campaignId,
                    campaignIdList: [campaignId],
                    desiredStatus: 0,
                    bizCode: context?.bizCode || ''
                }, {
                    requestOptions: context?.requestOptions || {},
                    capture: context?.capture !== false
                });
                if (pauseAction.ok) {
                    stoppedCampaignIds.push(campaignId);
                } else {
                    const allowDeleteFallback = context?.conflictDeleteFallback !== false;
                    if (allowDeleteFallback) {
                        const deleteAction = await executeLifecycleActionByContract(sceneName, 'delete', {
                            itemId,
                            campaignId,
                            campaignIdList: [campaignId],
                            bizCode: context?.bizCode || ''
                        }, {
                            requestOptions: context?.requestOptions || {},
                            capture: context?.capture !== false
                        });
                        if (deleteAction.ok) {
                            stoppedCampaignIds.push(campaignId);
                            deletedFallbackCampaignIds.push(campaignId);
                        } else {
                            unresolvedCampaignIds.push(campaignId);
                        }
                    } else {
                        unresolvedCampaignIds.push(campaignId);
                    }
                }
            }

            const pollTimes = Math.max(1, toNumber(context?.pollTimes, 3));
            const pollIntervalMs = Math.max(500, toNumber(context?.pollIntervalMs, 2000));
            let pauseConfirmedIds = [];
            let pausePendingIds = stoppedCampaignIds.slice();
            if (stoppedCampaignIds.length) {
                for (let i = 0; i < pollTimes; i++) {
                    const query = await queryConflictCampaignRefsByItem(sceneName, itemId, {
                        bizCode: context?.bizCode || '',
                        requestOptions: context?.requestOptions || {},
                        capture: false
                    });
                    if (!query.ok) break;
                    const activeSet = new Set(
                        query.refs
                            .filter(ref => {
                                const active = isCampaignStatusActive(ref.status);
                                return active !== false;
                            })
                            .map(ref => ref.campaignId)
                    );
                    pauseConfirmedIds = stoppedCampaignIds.filter(id => !activeSet.has(id));
                    pausePendingIds = stoppedCampaignIds.filter(id => activeSet.has(id));
                    if (!pausePendingIds.length) break;
                    await sleep(pollIntervalMs);
                }
            }
            unresolvedCampaignIds.push(...pausePendingIds);
            return {
                ok: unresolvedCampaignIds.length === 0 && stoppedCampaignIds.length > 0,
                handled: stoppedCampaignIds.length > 0,
                classification,
                sceneName,
                itemId,
                stoppedCampaignIds: uniqueBy(stoppedCampaignIds, id => id),
                unresolvedCampaignIds: uniqueBy(unresolvedCampaignIds, id => id),
                pauseConfirmedIds: uniqueBy(pauseConfirmedIds, id => id),
                deletedFallbackCampaignIds: uniqueBy(deletedFallbackCampaignIds, id => id),
                oneClickResult,
                error: unresolvedCampaignIds.length ? 'pause_not_fully_confirmed' : ''
            };
        };
