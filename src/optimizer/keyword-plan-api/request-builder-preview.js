            const buildRequestFromWizard = () => {
                syncDraftFromUI();
                const selectedSceneName = SCENE_OPTIONS.includes(wizardState.draft.sceneName) ? wizardState.draft.sceneName : '关键词推广';
                const matrixConfig = normalizeMatrixConfig(wizardState?.draft?.matrixConfig, selectedSceneName);
                const selectedSceneSettings = buildSceneSettingsPayload(selectedSceneName);
                const selectedSceneGoalFromSettings = normalizeGoalLabel(resolveKeywordGoalFromSceneSettings(selectedSceneSettings));
                const prefix = wizardState.draft.planNamePrefix || buildSceneTimePrefix(selectedSceneName);
                const dayAverageBudget = wizardState.draft.dayAverageBudget;
                const isSelectedKeywordScene = selectedSceneName === '关键词推广';
                const enabledStrategies = (wizardState.strategyList || []).filter(item => item.enabled);
                const strategyGoalSetByScene = new Map();
                const sceneSettingsCache = new Map();
                const getSceneSettingsForRequest = (sceneName = '') => {
                    const targetScene = SCENE_OPTIONS.includes(String(sceneName || '').trim())
                        ? String(sceneName).trim()
                        : selectedSceneName;
                    if (targetScene === '关键词推广') return {};
                    if (!sceneSettingsCache.has(targetScene)) {
                        sceneSettingsCache.set(targetScene, buildSceneSettingsPayload(targetScene));
                    }
                    return sceneSettingsCache.get(targetScene) || {};
                };
                const plans = [];
                const usedPlanNameInRequest = new Set();
                const ensureUniquePlanNameInRequest = (rawName = '') => {
                    const seed = String(rawName || '').trim();
                    let candidate = seed || `${prefix}_${String(usedPlanNameInRequest.size + 1).padStart(2, '0')}`;
                    let cursor = 2;
                    while (usedPlanNameInRequest.has(candidate) && cursor < 999) {
                        candidate = `${seed || prefix}_${String(cursor).padStart(2, '0')}`;
                        cursor += 1;
                    }
                    usedPlanNameInRequest.add(candidate);
                    return candidate;
                };
                enabledStrategies.forEach((strategy, strategyIdx) => {
                    const strategyBoundMaterialId = resolveStrategyBoundMaterialId(strategy);
                    const strategyItemList = resolveStrategyBoundItemList(strategy, wizardState.addedItems);
                    strategyItemList.forEach((item, itemIdx) => {
                        const strategySceneName = SCENE_OPTIONS.includes(String(strategy?.sceneName || '').trim())
                            ? String(strategy.sceneName).trim()
                            : selectedSceneName;
                        const isKeywordScene = strategySceneName === '关键词推广';
                        let strategySceneSettings = normalizeSceneSettingsObject(strategy?.sceneSettings || {});
                        if (!Object.keys(strategySceneSettings).length && isPlainObject(strategy?.sceneSettingValues)) {
                            const strategySceneSettingValues = normalizeSceneSettingsObject(
                                normalizeSceneSettingBucketValues(strategy.sceneSettingValues || {}, strategySceneName)
                            );
                            if (Object.keys(strategySceneSettingValues).length) {
                                strategySceneSettings = mergeDeep({}, strategySceneSettingValues);
                            }
                        }
                        if (!Object.keys(strategySceneSettings).length) {
                            strategySceneSettings = normalizeSceneSettingsObject(
                                getSceneSettingsForRequest(strategySceneName)
                            );
                        }
                        const strategySceneBidTypeSeed = isKeywordScene
                            ? normalizeSceneSettingValue(
                                strategySceneSettings[normalizeSceneFieldKey('出价方式')]
                                || strategySceneSettings.出价方式
                                || strategySceneSettings[normalizeSceneFieldKey('campaign.bidTypeV2')]
                                || strategySceneSettings['campaign.bidTypeV2']
                                || ''
                            )
                            : '';
                        const strategySceneBidTypeCode = isKeywordScene
                            ? mapSceneBidTypeValue(strategySceneBidTypeSeed, '关键词推广')
                            : '';
                        const strategyBidMode = normalizeBidMode(
                            strategySceneBidTypeCode || strategy.bidMode || wizardState.draft.bidMode || 'smart',
                            'smart'
                        );
                        strategy.bidMode = strategyBidMode;
                        const strategyMarketingGoal = normalizeGoalLabel(
                            resolveStrategyMarketingGoal(strategy, strategySceneSettings, strategySceneName)
                        );
                        const strategyKeywordContractType = isKeywordScene
                            ? resolveKeywordCampaignContractType({
                                campaign: resolveKeywordGoalRuntimeFallback(strategyMarketingGoal),
                                goalText: strategyMarketingGoal
                            })
                            : '';
                        const strategyBidTargetV2 = String(strategy.bidTargetV2 || DEFAULTS.bidTargetV2).trim() || DEFAULTS.bidTargetV2;
                        const strategyBidTargetOptionValue = normalizeKeywordBidTargetOptionValue(strategyBidTargetV2) || strategyBidTargetV2;
                        if (isKeywordScene) {
                            strategySceneSettings = mergeDeep({}, strategySceneSettings);
                            strategySceneSettings.出价方式 = strategyBidMode === 'manual' ? '手动出价' : '智能出价';
                            delete strategySceneSettings['campaign.bidTypeV2'];
                            delete strategySceneSettings['campaign.bidTargetV2'];
                            delete strategySceneSettings['campaign.optimizeTarget'];
                            if (strategyBidMode === 'manual') {
                                delete strategySceneSettings.出价目标;
                                delete strategySceneSettings.优化目标;
                            } else if (strategyKeywordContractType === 'search_detent' || strategyKeywordContractType === 'golden_traffic_card') {
                                delete strategySceneSettings.出价目标;
                                delete strategySceneSettings.优化目标;
                            } else {
                                const strategyBidTargetLabel = BID_TARGET_OPTIONS.find(item => item.value === strategyBidTargetOptionValue)?.label || '获取成交量';
                                strategySceneSettings.出价目标 = strategyBidTargetLabel;
                            }
                        }
                        const strategyKeywordMode = strategy.keywordMode || wizardState.draft.keywordMode || DEFAULTS.keywordMode;
                        const strategyUseWordPackage = strategy.useWordPackage !== false && wizardState.draft.useWordPackage !== false;
                        const strategyRecommendCount = Math.max(0, toNumber(strategy.recommendCount, toNumber(wizardState.draft.recommendCount, DEFAULTS.recommendCount)));
                        const strategyDefaultBid = toNumber(strategy.defaultBidPrice, toNumber(wizardState.draft.defaultBidPrice, 1));
                        const strategyManualKeywords = parseKeywords(strategy.manualKeywords || wizardState.draft.manualKeywords || '', {
                            bidPrice: strategyDefaultBid,
                            matchScope: DEFAULTS.matchScope,
                            onlineStatus: DEFAULTS.keywordOnlineStatus
                        });
                        const explicitPlanName = String(strategy.planName || '').trim();
                        const autoStrategyPlanName = getStrategyMainLabel(strategy);
                        const shouldAppendItemIndex = strategyItemList.length > 1 || (!strategyBoundMaterialId && wizardState.addedItems.length > 1);
                        const autoPlanName = shouldAppendItemIndex
                            ? `${autoStrategyPlanName}_${String(itemIdx + 1).padStart(2, '0')}`
                            : autoStrategyPlanName;
                        const finalPlanName = ensureUniquePlanNameInRequest(
                            explicitPlanName
                            || autoPlanName
                            || `${prefix}_${String(strategyIdx + 1).padStart(2, '0')}`
                        );
                        if (isKeywordScene && strategyMarketingGoal) {
                            strategySceneSettings = mergeDeep({}, strategySceneSettings, {
                                营销目标: strategyMarketingGoal
                            });
                            strategySceneSettings.选择卡位方案 = strategyMarketingGoal;
                        }
                        const strategySubmitBidTargetV2 = resolveKeywordCustomBidTargetAlias(strategyBidTargetV2, strategyMarketingGoal);
                        if (strategyMarketingGoal) {
                            if (!strategyGoalSetByScene.has(strategySceneName)) {
                                strategyGoalSetByScene.set(strategySceneName, new Set());
                            }
                            strategyGoalSetByScene.get(strategySceneName).add(strategyMarketingGoal);
                        }
                        const resolveKeywordSceneSettingValueByLabels = (labels = []) => {
                            if (!isPlainObject(strategySceneSettings)) return '';
                            const list = Array.isArray(labels) ? labels : [];
                            for (const label of list) {
                                const key = normalizeSceneFieldKey(label);
                                const value = normalizeSceneSettingValue(
                                    strategySceneSettings[label]
                                    || (key ? strategySceneSettings[key] : '')
                                    || ''
                                );
                                if (value) return value;
                            }
                            return '';
                        };
                        const resolveKeywordSingleCostLabelsByTarget = (targetCode = '', type = 'amount') => {
                            const normalizedTargetCode = normalizeKeywordBidTargetOptionValue(
                                mapSceneBidTargetValue(targetCode) || targetCode
                            ) || 'conv';
                            const switchLabelMap = {
                                conv: ['设置平均成交成本', '控成本投放'],
                                fav_cart: ['设置平均收藏加购成本', '控成本投放'],
                                click: ['设置平均点击成本', '控成本投放']
                            };
                            const amountLabelMap = {
                                conv: ['平均直接成交成本', '平均成交成本', '直接成交成本', '单次成交成本', '目标成交成本', '目标成本'],
                                fav_cart: ['平均收藏加购成本', '收藏加购成本', '目标成本'],
                                click: ['平均点击成本', '点击成本', '目标成本']
                            };
                            if (type === 'switch') {
                                return switchLabelMap[normalizedTargetCode] || ['控成本投放'];
                            }
                            return amountLabelMap[normalizedTargetCode] || [
                                '平均直接成交成本',
                                '平均成交成本',
                                '平均收藏加购成本',
                                '平均点击成本',
                                '直接成交成本',
                                '单次成交成本',
                                '目标成交成本',
                                '点击成本',
                                '目标成本'
                            ];
                        };
                        const keywordSingleCostTargetCode = isKeywordScene
                            ? normalizeKeywordBidTargetOptionValue(
                                mapSceneBidTargetValue(strategySubmitBidTargetV2) || strategySubmitBidTargetV2
                            ) || 'conv'
                            : '';
                        const keywordSceneSingleCostSwitchLabels = isKeywordScene
                            ? resolveKeywordSingleCostLabelsByTarget(keywordSingleCostTargetCode, 'switch')
                            : [];
                        const keywordSceneSingleCostSwitchValue = isKeywordScene
                            ? resolveKeywordSceneSettingValueByLabels(keywordSceneSingleCostSwitchLabels)
                            : '';
                        const keywordSceneSingleCostSwitchOff = keywordSceneSingleCostSwitchValue
                            && /(关|关闭|不启用|禁用|否|off|false|0)/i.test(keywordSceneSingleCostSwitchValue)
                            && !/(开|开启|启用|是|on|true|1)/i.test(keywordSceneSingleCostSwitchValue);
                        const keywordSceneSingleCostAmountLabels = isKeywordScene
                            ? resolveKeywordSingleCostLabelsByTarget(keywordSingleCostTargetCode, 'amount')
                            : [];
                        const keywordSceneSingleCostAmount = isKeywordScene
                            ? parseNumberFromSceneValue(resolveKeywordSceneSettingValueByLabels(keywordSceneSingleCostAmountLabels))
                            : NaN;
                        const keywordSceneSingleCostEnabled = isKeywordScene
                            && !keywordSceneSingleCostSwitchOff
                            && Number.isFinite(keywordSceneSingleCostAmount)
                            && keywordSceneSingleCostAmount > 0;
                        const plan = {
                            sceneName: strategySceneName,
                            planName: finalPlanName,
                            item,
                            bidMode: strategyBidMode,
                            keywords: strategyManualKeywords,
                            keywordDefaults: {
                                bidPrice: strategyDefaultBid,
                                matchScope: DEFAULTS.matchScope,
                                onlineStatus: DEFAULTS.keywordOnlineStatus
                            },
                            keywordSource: {
                                mode: strategyKeywordMode,
                                recommendCount: strategyRecommendCount,
                                useWordPackage: strategyUseWordPackage
                            }
                        };
                        if (strategyMarketingGoal) {
                            plan.marketingGoal = strategyMarketingGoal;
                        }
                        if (Object.keys(strategySceneSettings).length) {
                            plan.sceneSettings = mergeDeep({}, strategySceneSettings);
                        }
                        const strategyBudget = String(strategy.dayAverageBudget || '').trim();
                        const finalBudget = strategyBudget !== '' ? strategyBudget : dayAverageBudget;
                        if (finalBudget !== '') {
                            if (strategy.budgetType === 'day_budget') {
                                plan.budget = { dayBudget: toNumber(finalBudget, 0) };
                            } else {
                                plan.budget = { dayAverageBudget: toNumber(finalBudget, 0) };
                            }
                        }
                        const campaignOverride = {};
                        if (isKeywordScene) {
                            campaignOverride.bidTypeV2 = bidModeToBidType(strategyBidMode);
                            if (strategyKeywordContractType === 'search_detent') {
                                campaignOverride.promotionScene = 'promotion_scene_search_detent';
                                campaignOverride.itemSelectedMode = 'search_detent';
                                campaignOverride.bidType = 'max_amount';
                                campaignOverride.dmcType = 'day_average';
                                campaignOverride.searchDetentType = mapKeywordSearchDetentTypeValue(
                                    strategySceneSettings.卡位方式
                                    || strategySceneSettings[normalizeSceneFieldKey('卡位方式')]
                                    || '抢首条'
                                ) || 'first_place';
                                delete campaignOverride.bidTypeV2;
                            } else if (strategyKeywordContractType === 'golden_traffic_card') {
                                campaignOverride.promotionScene = 'promotion_scene_golden_traffic_card_package';
                                campaignOverride.itemSelectedMode = 'user_define';
                                campaignOverride.bidTypeV2 = 'smart_bid';
                                campaignOverride.bidTargetV2 = 'conv';
                                campaignOverride.orderChargeType = mapSceneOrderChargeTypeValue(
                                    strategySceneSettings.支付方式
                                    || strategySceneSettings[normalizeSceneFieldKey('支付方式')]
                                    || strategySceneSettings['campaign.orderChargeType']
                                    || '余额支付',
                                    runtimeCache?.value || {}
                                ) || 'balance_charge';
                            } else if (strategyBidMode === 'smart') {
                                if (strategySubmitBidTargetV2) {
                                    campaignOverride.bidTargetV2 = strategySubmitBidTargetV2;
                                    campaignOverride.optimizeTarget = strategySubmitBidTargetV2;
                                    if (strategySubmitBidTargetV2 === 'roi') {
                                        const roiConstraintValue = toNumber(
                                            strategy.singleCostV2
                                            || runtimeCache?.value?.storeData?.constraintValue
                                            || runtimeCache?.value?.solutionTemplate?.campaign?.constraintValue,
                                            NaN
                                        );
                                        campaignOverride.bidTargetV2 = 'roi';
                                        campaignOverride.optimizeTarget = 'roi';
                                        campaignOverride.constraintType = 'roi';
                                        if (Number.isFinite(roiConstraintValue) && roiConstraintValue > 0) {
                                            campaignOverride.constraintValue = roiConstraintValue;
                                        }
                                    }
                                }
                                const strategySingleCostAmount = toNumber(strategy.singleCostV2, NaN);
                                const strategySingleCostEnabled = !!strategy.setSingleCostV2
                                    && Number.isFinite(strategySingleCostAmount)
                                    && strategySingleCostAmount > 0;
                                campaignOverride.setSingleCostV2 = strategySingleCostEnabled || keywordSceneSingleCostEnabled;
                                if (campaignOverride.setSingleCostV2) {
                                    const mergedSingleCostAmount = strategySingleCostEnabled
                                        ? strategySingleCostAmount
                                        : keywordSceneSingleCostAmount;
                                    if (Number.isFinite(mergedSingleCostAmount) && mergedSingleCostAmount > 0) {
                                        campaignOverride.singleCostV2 = mergedSingleCostAmount;
                                    }
                                }
                                if (strategySubmitBidTargetV2 === 'roi') {
                                    campaignOverride.setSingleCostV2 = false;
                                    delete campaignOverride.singleCostV2;
                                }
                            } else {
                                campaignOverride.setSingleCostV2 = false;
                            }
                        }
                        if (Object.keys(campaignOverride).length) {
                            plan.campaignOverride = campaignOverride;
                        }
                        plans.push(plan);
                    });
                });

                const commonKeywordMode = wizardState.draft.keywordMode || DEFAULTS.keywordMode;
                const commonUseWordPackage = wizardState.draft.useWordPackage !== false;
                const commonRecommendCount = Math.max(0, toNumber(wizardState.draft.recommendCount, DEFAULTS.recommendCount));
                const commonDefaultBid = toNumber(wizardState.draft.defaultBidPrice, 1);
                const commonBidMode = normalizeBidMode(
                    (isSelectedKeywordScene ? plans[0]?.bidMode : '')
                    || wizardState.draft.bidMode
                    || enabledStrategies[0]?.bidMode
                    || 'smart',
                    'smart'
                );
                const common = {
                    keywordDefaults: {
                        bidPrice: commonDefaultBid,
                        matchScope: DEFAULTS.matchScope,
                        onlineStatus: DEFAULTS.keywordOnlineStatus
                    },
                    useWordPackage: commonUseWordPackage,
                    keywordMode: commonKeywordMode,
                    recommendCount: commonRecommendCount
                };
                if (isSelectedKeywordScene) {
                    common.bidMode = commonBidMode;
                }
                if (wizardState.crowdList.length) {
                    common.adgroupOverride = {
                        rightList: wizardState.crowdList.map(item => deepClone(item))
                    };
                }

                const sceneBizCodeHint = resolveSceneBizCodeHint(selectedSceneName);
                const requestBizCode = sceneBizCodeHint || wizardState.draft.bizCode || DEFAULTS.bizCode;
                const requestPromotionSceneDefault = resolveSceneDefaultPromotionScene(selectedSceneName, wizardState.draft.promotionScene || DEFAULTS.promotionScene);
                const requestPromotionScene = requestBizCode === DEFAULTS.bizCode
                    ? requestPromotionSceneDefault
                    : (wizardState.draft.promotionScene || '');
                const selectedSceneGoalSet = strategyGoalSetByScene.get(selectedSceneName) || new Set();
                const sceneMarketingGoal = (() => {
                    if (!isSelectedKeywordScene) {
                        return normalizeGoalLabel(
                            selectedSceneSettings.营销目标
                            || selectedSceneSettings.优化目标
                            || ''
                        );
                    }
                    if (selectedSceneGoalFromSettings) return selectedSceneGoalFromSettings;
                    if (selectedSceneGoalSet.size === 1) return Array.from(selectedSceneGoalSet)[0] || '';
                    if (selectedSceneGoalSet.size > 1) return Array.from(selectedSceneGoalSet)[0] || '';
                    return normalizeBidMode(commonBidMode, 'smart') === 'manual' ? '自定义推广' : '趋势明星';
                })();
                const matrixCombinations = buildMatrixCombinations(matrixConfig, {
                    sceneName: selectedSceneName,
                    strategyList: enabledStrategies,
                    itemList: wizardState.addedItems
                });
                if (matrixCombinations.length > matrixConfig.maxCombinations) {
                    throw new Error(`组合数 ${matrixCombinations.length} 超过上限 ${matrixConfig.maxCombinations}`);
                }
                const requestPlans = matrixCombinations.length
                    ? materializePlansFromMatrix(plans, matrixCombinations, {
                        namingPattern: matrixConfig.namingPattern,
                        sceneName: selectedSceneName,
                        itemList: wizardState.addedItems
                    })
                    : plans;
                const matrixBatches = splitMatrixBatches(requestPlans, matrixConfig.batchSize);

                return {
                    bizCode: requestBizCode,
                    promotionScene: requestPromotionScene,
                    sceneName: selectedSceneName,
                    marketingGoal: sceneMarketingGoal || undefined,
                    sceneSettings: selectedSceneSettings,
                    fallbackPolicy: normalizeWizardFallbackPolicy(wizardState.draft.fallbackPolicy),
                    parallelSubmitTimes: normalizeParallelSubmitTimes(
                        wizardState?.draft?.parallelSubmitTimes,
                        DEFAULT_SCENE_PARALLEL_SUBMIT_TIMES
                    ),
                    plans: requestPlans,
                    common,
                    matrixPreview: {
                        enabled: matrixConfig.enabled === true,
                        combinationCount: matrixCombinations.length,
                        batchSize: matrixConfig.batchSize,
                        batchCount: matrixBatches.length,
                        namingPattern: matrixConfig.namingPattern
                    }
                };
            };

            const buildSceneRequestsFromWizard = (request = {}) => {
                const selectedSceneName = SCENE_OPTIONS.includes(String(request?.sceneName || '').trim())
                    ? String(request.sceneName).trim()
                    : '关键词推广';
                const planList = Array.isArray(request?.plans) ? request.plans : [];
                const requestSceneSettings = normalizeSceneSettingsObject(request?.sceneSettings || {});
                const normalizeSceneSettingsForGroup = (rawSettings = {}) => {
                    const normalized = normalizeSceneSettingsObject(rawSettings);
                    const ordered = {};
                    Object.keys(normalized).sort().forEach(key => {
                        const value = normalizeSceneSettingValue(normalized[key]);
                        if (!value) return;
                        ordered[key] = value;
                    });
                    return ordered;
                };
                const groupedPlans = new Map();
                const configuredParallelSubmitTimes = normalizeParallelSubmitTimes(
                    request?.parallelSubmitTimes,
                    wizardState?.draft?.parallelSubmitTimes || DEFAULT_SCENE_PARALLEL_SUBMIT_TIMES
                );
                planList.forEach(plan => {
                    const planSceneName = SCENE_OPTIONS.includes(String(plan?.sceneName || '').trim())
                        ? String(plan.sceneName).trim()
                        : selectedSceneName;
                    const nextPlan = mergeDeep({}, plan);
                    const planSceneSettings = normalizeSceneSettingsForGroup(
                        nextPlan.sceneSettings || requestSceneSettings
                    );
                    delete nextPlan.sceneName;
                    delete nextPlan.sceneSettings;
                    const groupKey = `${planSceneName}::${JSON.stringify(planSceneSettings)}`;
                    if (!groupedPlans.has(groupKey)) {
                        groupedPlans.set(groupKey, {
                            sceneName: planSceneName,
                            sceneSettings: planSceneSettings,
                            plans: []
                        });
                    }
                    groupedPlans.get(groupKey).plans.push(nextPlan);
                });
                if (!groupedPlans.size) {
                    const fallbackSceneSettings = normalizeSceneSettingsForGroup(requestSceneSettings);
                    groupedPlans.set(`${selectedSceneName}::${JSON.stringify(fallbackSceneSettings)}`, {
                        sceneName: selectedSceneName,
                        sceneSettings: fallbackSceneSettings,
                        plans: []
                    });
                }
                const fallbackPolicy = normalizeWizardFallbackPolicy(request?.fallbackPolicy || wizardState.draft?.fallbackPolicy);
                const sceneRequests = [];
                groupedPlans.forEach(group => {
                    const sceneName = SCENE_OPTIONS.includes(String(group?.sceneName || '').trim())
                        ? String(group.sceneName).trim()
                        : selectedSceneName;
                    const plans = Array.isArray(group?.plans) ? group.plans : [];
                    const sceneSettings = Object.keys(group?.sceneSettings || {}).length
                        ? mergeDeep({}, group.sceneSettings)
                        : normalizeSceneSettingsObject(buildSceneSettingsPayload(sceneName));
                    const sceneBizCodeHint = resolveSceneBizCodeHint(sceneName);
                    const bizCode = sceneBizCodeHint || request?.bizCode || wizardState.draft?.bizCode || DEFAULTS.bizCode;
                    const promotionSceneDefault = resolveSceneDefaultPromotionScene(
                        sceneName,
                        request?.promotionScene || wizardState.draft?.promotionScene || DEFAULTS.promotionScene
                    );
                    const promotionScene = bizCode === DEFAULTS.bizCode
                        ? promotionSceneDefault
                        : (request?.promotionScene || wizardState.draft?.promotionScene || '');
                    const sceneGoalFromSettings = normalizeGoalLabel(
                        sceneName === '关键词推广'
                            ? resolveKeywordGoalFromSceneSettings(sceneSettings)
                            : (sceneSettings.营销目标 || sceneSettings.优化目标 || '')
                    );
                    const buildSceneCommon = () => {
                        const sceneCommon = mergeDeep({}, request?.common || {});
                        if (sceneName === '关键词推广') {
                            const keywordBidMode = normalizeBidMode(
                                sceneCommon.bidMode || request?.common?.bidMode || 'smart',
                                'smart'
                            );
                            sceneCommon.bidMode = keywordBidMode;
                        } else {
                            delete sceneCommon.bidMode;
                        }
                        return sceneCommon;
                    };
                    const fallbackGoal = sceneName === '关键词推广'
                        ? (normalizeBidMode(request?.common?.bidMode || 'smart', 'smart') === 'manual' ? '自定义推广' : '趋势明星')
                        : normalizeGoalLabel(request?.marketingGoal || '');
                    const plansForSync = Array.isArray(plans) ? plans : [];
                    const sceneParallelSubmitTimes = configuredParallelSubmitTimes;
                    plansForSync.forEach(plan => {
                        const planGoal = normalizeGoalLabel(plan?.marketingGoal || '');
                        const sceneMarketingGoal = sceneGoalFromSettings || planGoal || fallbackGoal;
                        sceneRequests.push({
                            bizCode,
                            promotionScene,
                            sceneName,
                            marketingGoal: sceneMarketingGoal || undefined,
                            sceneSettings,
                            fallbackPolicy,
                            parallelSubmitTimes: sceneParallelSubmitTimes,
                            chunkSize: 1,
                            plans: [plan],
                            common: buildSceneCommon()
                        });
                    });
                });
                return sceneRequests;
            };

            const normalizePlanNameForCompare = (rawName = '') => {
                const text = String(rawName || '').replace(/\s+/g, ' ').trim();
                if (!text) return '';
                let normalized = text;
                try {
                    if (MagicReport && typeof MagicReport.sanitizeCampaignName === 'function') {
                        normalized = MagicReport.sanitizeCampaignName(text) || text;
                    }
                } catch { }
                return String(normalized || '').replace(/\s+/g, ' ').trim();
            };

            const extractExistingPlanNamesFromPage = () => {
                const names = [];
                const pushName = (rawName = '') => {
                    const name = normalizePlanNameForCompare(rawName);
                    if (!name) return;
                    if (/^(未知计划|-|—)$/.test(name)) return;
                    names.push(name);
                };

                document.querySelectorAll('a[href*="campaignId="], a[href*="campaign_id="], a[mx-href*="campaignId="], a[mx-href*="campaign_id="]')
                    .forEach(anchor => {
                        pushName(anchor?.getAttribute?.('title') || anchor?.textContent || '');
                    });

                document.querySelectorAll('input[type="checkbox"][value]').forEach(input => {
                    const id = String(input?.value || '').trim();
                    if (!/^\d{6,}$/.test(id)) return;
                    const row = input.closest('tr, [role="row"], li, [class*="row"], [class*="item"]');
                    if (!(row instanceof Element)) return;
                    const strictAnchor = row.querySelector('span + a[title]');
                    if (strictAnchor) {
                        pushName(strictAnchor.getAttribute('title') || strictAnchor.textContent || '');
                    }
                    row.querySelectorAll('a[title]').forEach(anchor => {
                        const prevText = (anchor.previousElementSibling?.textContent || '').replace(/\s+/g, '');
                        const parentText = (anchor.parentElement?.textContent || '').replace(/\s+/g, '');
                        if (!/^计划[:：]?$/.test(prevText) && !/计划[:：]/.test(parentText)) return;
                        pushName(anchor.getAttribute('title') || anchor.textContent || '');
                    });
                });

                return uniqueBy(names, item => item);
            };

            const validatePlanNameUniqueness = (request = {}) => {
                const planEntries = (Array.isArray(request?.plans) ? request.plans : [])
                    .map((plan, idx) => {
                        const rawName = String(plan?.planName || '').trim();
                        const normalized = normalizePlanNameForCompare(rawName);
                        return {
                            index: idx + 1,
                            rawName: rawName || `plans[${idx + 1}]`,
                            normalized
                        };
                    })
                    .filter(item => item.normalized);

                const firstSeen = new Map();
                const duplicateInRequest = [];
                planEntries.forEach(item => {
                    if (!firstSeen.has(item.normalized)) {
                        firstSeen.set(item.normalized, item.rawName);
                        return;
                    }
                    duplicateInRequest.push(firstSeen.get(item.normalized));
                    duplicateInRequest.push(item.rawName);
                });

                const existingNames = extractExistingPlanNamesFromPage();
                const existingSet = new Set(existingNames.map(name => normalizePlanNameForCompare(name)).filter(Boolean));
                const duplicateWithExisting = planEntries
                    .filter(item => existingSet.has(item.normalized))
                    .map(item => item.rawName);

                return {
                    ok: duplicateInRequest.length === 0 && duplicateWithExisting.length === 0,
                    duplicateInRequest: uniqueBy(duplicateInRequest, item => item),
                    duplicateWithExisting: uniqueBy(duplicateWithExisting, item => item),
                    existingPlanNameCount: existingNames.length
                };
            };

            const summarizePlanForPreview = (plan = null) => {
                if (!plan || !isPlainObject(plan)) return null;
                const item = isPlainObject(plan.item) ? plan.item : {};
                const budget = isPlainObject(plan.budget) ? plan.budget : null;
                const campaignOverride = isPlainObject(plan.campaignOverride) ? plan.campaignOverride : null;
                return {
                    sceneName: String(plan.sceneName || '').trim(),
                    planName: plan.planName || '',
                    marketingGoal: normalizeGoalLabel(plan.marketingGoal || ''),
                    bidMode: normalizeBidMode(plan.bidMode || '', 'smart'),
                    item: {
                        materialId: item.materialId || item.itemId || '',
                        materialName: item.materialName || (item.materialId || item.itemId ? `商品${item.materialId || item.itemId}` : '')
                    },
                    keywordCount: Array.isArray(plan.keywords) ? plan.keywords.length : 0,
                    keywordSource: isPlainObject(plan.keywordSource) ? plan.keywordSource : {},
                    budget,
                    campaignOverride
                };
            };

            const renderWorkbenchMatrixSummary = (request = null) => {
                if (!(wizardState?.els?.matrixSummary instanceof HTMLElement)) return;
                const currentSceneName = getMatrixSceneName(wizardState?.draft?.sceneName || '');
                const matrixConfig = normalizeMatrixConfig(wizardState?.draft?.matrixConfig, currentSceneName);
                const enabledStrategyCount = Array.isArray(wizardState?.strategyList)
                    ? wizardState.strategyList.filter(item => item?.enabled !== false).length
                    : 0;
                const matrixStats = buildMatrixPreviewStats(matrixConfig, {
                    sceneName: currentSceneName,
                    strategyCount: enabledStrategyCount,
                    itemCount: Array.isArray(wizardState?.addedItems) ? wizardState.addedItems.length : 0
                });
                const fallbackMatrixPreview = {
                    enabled: matrixConfig.enabled === true,
                    dimensionCount: matrixConfig.dimensions.length,
                    activeDimensionCount: matrixStats.activeDimensions.length,
                    combinationCount: matrixStats.combinations.length,
                    batchSize: matrixConfig.batchSize,
                    batchCount: matrixStats.expandedPlanCount > 0
                        ? Math.ceil(matrixStats.expandedPlanCount / Math.max(1, matrixConfig.batchSize))
                        : 0,
                    namingPattern: matrixConfig.namingPattern
                };
                const matrixPreview = isPlainObject(request?.matrixPreview)
                    ? {
                        ...fallbackMatrixPreview,
                        ...request.matrixPreview
                    }
                    : fallbackMatrixPreview;
                const dimensionList = Array.isArray(matrixConfig.dimensions) ? matrixConfig.dimensions : [];
                const presetCatalog = getMatrixDimensionPresetCatalog(currentSceneName);
                const quickPresetCatalog = getMatrixQuickPresetCatalog(currentSceneName);
                const canEditMatrixDimensions = SCENE_OPTIONS.includes(String(currentSceneName || '').trim());
                const appendablePresetKeys = getMatrixAppendablePresetKeys(currentSceneName, dimensionList);
                const buildMatrixDimensionHint = (dimension = {}) => {
                    const preset = getMatrixDimensionPresetByKey(dimension?.key || '', currentSceneName);
                    if (!preset) return '值可用换行或逗号分隔。';
                    if (preset.key === 'material_id' && !wizardState.addedItems.length) {
                        return '请先在首页“已添加商品”中补齐商品，再填商品 ID。';
                    }
                    return preset.hint || '值可用换行或逗号分隔。';
                };
                const buildMatrixDimensionRow = (dimension = {}, index = 0) => {
                    const preset = getMatrixDimensionPresetByKey(dimension.key, currentSceneName);
                    const optionHtml = presetCatalog.map(item => `
                        <option value="${Utils.escapeHtml(item.key)}" ${item.key === dimension.key ? 'selected' : ''}>${Utils.escapeHtml(item.label)}</option>
                    `).join('');
                    const keyPickerSummaryText = buildMatrixDimensionKeyPickerSummaryText(dimension.key, currentSceneName);
                    const keyPickerOptionHtml = presetCatalog.map(item => `
                        <label class="am-wxt-matrix-dimension-picker-option" title="${Utils.escapeHtml(item.hint || item.label)}">
                            <input
                                type="radio"
                                name="am-wxt-matrix-dimension-key-${index}"
                                data-matrix-dimension-key-option="1"
                                value="${Utils.escapeHtml(item.key)}"
                                ${item.key === dimension.key ? 'checked' : ''}
                            />
                            <span class="am-wxt-matrix-dimension-picker-option-text">${Utils.escapeHtml(item.label)}</span>
                        </label>
                    `).join('');
                    const normalizedValues = normalizeMatrixDimensionValuesByPreset(dimension.values || [], preset);
                    const valueOptions = getMatrixDimensionValueOptions(preset, {
                        itemList: wizardState.addedItems,
                        selectedValues: normalizedValues
                    });
                    const useMultiSelect = String(preset?.valueInputMode || '').trim() === 'multi_select';
                    const usePackageRows = String(preset?.valueInputMode || '').trim() === 'package_rows';
                    const selectedValueSet = new Set(normalizedValues);
                    const pickerSummaryText = buildMatrixDimensionPickerSummaryText(normalizedValues);
                    const rowHintText = buildMatrixDimensionHint(dimension);
                    const pickerHintText = preset?.key === 'material_id'
                        ? '从已添加商品里下拉勾选；如无可选项，请先回首页添加商品。'
                        : '固定维度改为下拉勾选；不带搜索。';
                    const valueEditorHtml = usePackageRows
                        ? buildMatrixBidTargetCostPackageEditorHtml(normalizedValues, preset?.suggestedValues || [])
                        : (useMultiSelect
                            ? `
                            <div class="am-wxt-matrix-dimension-picker" data-matrix-dimension-picker="1">
                                <button
                                    type="button"
                                    class="am-wxt-matrix-dimension-picker-trigger"
                                    data-matrix-dimension-picker-toggle="1"
                                    aria-expanded="false"
                                    title="${Utils.escapeHtml(pickerHintText)}"
                                    ${valueOptions.length ? '' : 'disabled'}
                                >
                                    <span class="am-wxt-matrix-dimension-picker-label" data-matrix-dimension-picker-label="1">${Utils.escapeHtml(pickerSummaryText)}</span>
                                    <span class="am-wxt-matrix-dimension-picker-arrow">▾</span>
                                </button>
                                <div class="am-wxt-matrix-dimension-picker-panel" data-matrix-dimension-picker-panel="1">
                                    ${valueOptions.length
                                ? valueOptions.map(option => `
                                            <label class="am-wxt-matrix-dimension-picker-option">
                                                <input type="checkbox" data-matrix-dimension-value-option="1" value="${Utils.escapeHtml(option.value)}" ${selectedValueSet.has(option.value) ? 'checked' : ''} />
                                                <span class="am-wxt-matrix-dimension-picker-option-text">${Utils.escapeHtml(option.label || option.value)}</span>
                                            </label>
                                        `).join('')
                                : '<div class="am-wxt-matrix-dimension-picker-empty">暂无可选项</div>'}
                                </div>
                                <select
                                    class="am-wxt-matrix-dimension-value-select am-wxt-hidden-control"
                                    data-matrix-dimension-values-select="1"
                                    multiple
                                    ${valueOptions.length ? '' : 'disabled'}
                                    tabindex="-1"
                                    aria-hidden="true"
                                >${valueOptions.length
                                ? valueOptions.map(option => `
                                        <option value="${Utils.escapeHtml(option.value)}" ${selectedValueSet.has(option.value) ? 'selected' : ''}>${Utils.escapeHtml(option.label || option.value)}</option>
                                    `).join('')
                                : '<option value="" disabled>暂无可选项</option>'}
                                </select>
                            </div>
                        `
                            : buildMatrixStructuredDimensionEditorHtml(normalizedValues, preset));
                    return `
                        <div class="am-wxt-matrix-dimension-row" data-matrix-dimension-row="1" data-matrix-dimension-index="${index}">
                            <div class="am-wxt-matrix-dimension-top">
                                <div class="am-wxt-matrix-dimension-top-main">
                                    <label class="am-wxt-inline-check am-wxt-matrix-dimension-enable-inline" aria-label="启用维度">
                                        <input type="checkbox" data-matrix-dimension-enabled="1" ${dimension.enabled !== false ? 'checked' : ''} title="启用维度" />
                                    </label>
                                    <div class="am-wxt-matrix-dimension-picker am-wxt-matrix-dimension-key-picker" data-matrix-dimension-picker="1">
                                        <button
                                            type="button"
                                            class="am-wxt-matrix-dimension-picker-trigger"
                                            data-matrix-dimension-key-picker-toggle="1"
                                            aria-expanded="false"
                                            title="${Utils.escapeHtml(rowHintText)}"
                                        >
                                            <span class="am-wxt-matrix-dimension-picker-label" data-matrix-dimension-key-picker-label="1">${Utils.escapeHtml(keyPickerSummaryText)}</span>
                                            <span class="am-wxt-matrix-dimension-picker-arrow">▾</span>
                                        </button>
                                        <div class="am-wxt-matrix-dimension-picker-panel" data-matrix-dimension-picker-panel="1">
                                            ${keyPickerOptionHtml}
                                        </div>
                                        <select class="am-wxt-hidden-control" data-matrix-dimension-key="1" title="${Utils.escapeHtml(rowHintText)}">${optionHtml}</select>
                                    </div>
                                </div>
                                <div class="am-wxt-matrix-dimension-top-actions">
                                    <button
                                        type="button"
                                        class="am-wxt-matrix-dimension-remove-icon"
                                        data-matrix-dimension-remove="1"
                                        aria-label="删除维度"
                                        title="删除维度"
                                    >&times;</button>
                                </div>
                            </div>
                            <input
                                type="hidden"
                                class="am-wxt-matrix-dimension-hidden-label"
                                data-matrix-dimension-label="1"
                                value="${Utils.escapeHtml(dimension.label || preset?.label || dimension.key || '')}"
                            />
                            ${valueEditorHtml}
                        </div>
                    `;
                };
                const buildMatrixDimensionAddCard = (presetKey = '') => {
                    const normalizedPresetKey = String(presetKey || '').trim();
                    const nextPreset = getMatrixDimensionPresetByKey(normalizedPresetKey, currentSceneName);
                    const isDisabled = !normalizedPresetKey;
                    const title = isDisabled ? '当前场景维度已补齐' : '添加维度';
                    const desc = isDisabled
                        ? '该场景可用维度已全部加入，直接编辑现有卡片即可。'
                        : `下一个可加：${nextPreset?.label || normalizedPresetKey}`;
                    return `
                        <button
                            type="button"
                            class="am-wxt-matrix-dimension-add-card${isDisabled ? ' is-disabled' : ''}"
                            data-matrix-dimension-add="1"
                            data-matrix-preset-key="${Utils.escapeHtml(normalizedPresetKey)}"
                            aria-label="${Utils.escapeHtml(title)}"
                            title="${Utils.escapeHtml(desc)}"
                            ${isDisabled ? 'disabled' : ''}
                        >
                            <span class="am-wxt-matrix-dimension-add-icon">+</span>
                            <span class="am-wxt-matrix-dimension-add-title">${Utils.escapeHtml(title)}</span>
                            <span class="am-wxt-matrix-dimension-add-desc">${Utils.escapeHtml(desc)}</span>
                        </button>
                    `;
                };
                if (wizardState.els.matrixEnabledInput instanceof HTMLInputElement) {
                    wizardState.els.matrixEnabledInput.checked = canEditMatrixDimensions && matrixConfig.enabled === true;
                    wizardState.els.matrixEnabledInput.disabled = !canEditMatrixDimensions;
                }
                if (wizardState.els.matrixMaxInput instanceof HTMLInputElement) {
                    wizardState.els.matrixMaxInput.value = String(matrixConfig.maxCombinations);
                    wizardState.els.matrixMaxInput.disabled = !canEditMatrixDimensions;
                }
                if (wizardState.els.matrixBatchInput instanceof HTMLInputElement) {
                    wizardState.els.matrixBatchInput.value = String(matrixConfig.batchSize);
                    wizardState.els.matrixBatchInput.disabled = !canEditMatrixDimensions;
                }
                if (wizardState.els.matrixNamePatternInput instanceof HTMLInputElement) {
                    wizardState.els.matrixNamePatternInput.value = matrixConfig.namingPattern || MATRIX_DEFAULT_NAMING_PATTERN;
                    wizardState.els.matrixNamePatternInput.disabled = !canEditMatrixDimensions;
                }
                if (wizardState.els.matrixIntro instanceof HTMLElement) {
                    wizardState.els.matrixIntro.textContent = !canEditMatrixDimensions
                        ? '先在上方切换场景，矩阵维度会按该场景同步展示。'
                        : currentSceneName === '关键词推广'
                            ? '推荐先配预算、出价方式、智能出价目标包、计划名前缀、商品，再补充匹配方式等场景维度。'
                            : '推荐先配预算、出价方式、计划名前缀、商品，再补充当前场景维度。';
                }
                if (wizardState.els.matrixApplyRecommendedBtn instanceof HTMLButtonElement) {
                    wizardState.els.matrixApplyRecommendedBtn.disabled = !canEditMatrixDimensions;
                }
                if (wizardState.els.matrixGenerateBtn instanceof HTMLButtonElement) {
                    const canGenerateMatrixPlans = canEditMatrixDimensions
                        && matrixConfig.enabled === true
                        && matrixStats.combinations.length > 0
                        && enabledStrategyCount > 0
                        && Array.isArray(wizardState?.addedItems)
                        && wizardState.addedItems.length > 0;
                    wizardState.els.matrixGenerateBtn.disabled = !canGenerateMatrixPlans;
                }
                if (wizardState.els.matrixClearBtn instanceof HTMLButtonElement) {
                    wizardState.els.matrixClearBtn.disabled = !canEditMatrixDimensions && !dimensionList.length;
                }
                if (wizardState.els.matrixPresetList instanceof HTMLElement) {
                    wizardState.els.matrixPresetList.innerHTML = quickPresetCatalog.map(item => `
                        <button
                            type="button"
                            class="am-wxt-btn"
                            data-matrix-preset-key="${Utils.escapeHtml(item.key)}"
                            onclick="window.__AM_WXT_PLAN_API__ && typeof window.__AM_WXT_PLAN_API__.applyMatrixPreset === 'function' && window.__AM_WXT_PLAN_API__.applyMatrixPreset('${Utils.escapeHtml(item.key)}');"
                            title="${Utils.escapeHtml(item.hint || item.label)}"
                            ${canEditMatrixDimensions ? '' : 'disabled'}
                        >${Utils.escapeHtml(item.label)}</button>
                    `).join('');
                    wizardState.els.matrixPresetList.querySelectorAll('[data-matrix-preset-key]').forEach((button) => {
                        button.addEventListener('click', () => {
                            const presetKey = String(button.getAttribute('data-matrix-preset-key') || '').trim();
                            applyMatrixPreset(presetKey);
                        });
                    });
                }
                const displayMatrixBatchCount = matrixConfig.enabled && canEditMatrixDimensions
                    ? toNumber(matrixPreview?.batchCount, 0)
                    : 0;
                wizardState.els.matrixSummary.textContent = `矩阵：${canEditMatrixDimensions && matrixConfig.enabled ? '开启' : '关闭'} ｜ 组合 ${toNumber(matrixPreview?.combinationCount, 0)} ｜ 批次 ${displayMatrixBatchCount}`;
                if (wizardState.els.matrixStatusValue instanceof HTMLElement) {
                    wizardState.els.matrixStatusValue.textContent = !canEditMatrixDimensions
                        ? '待选场景'
                        : (matrixConfig.enabled ? '已开启' : '已关闭');
                }
                if (wizardState.els.matrixDimensionCountValue instanceof HTMLElement) {
                    wizardState.els.matrixDimensionCountValue.textContent = String(dimensionList.length);
                }
                if (wizardState.els.matrixCombinationCountValue instanceof HTMLElement) {
                    wizardState.els.matrixCombinationCountValue.textContent = String(toNumber(matrixPreview?.combinationCount, 0));
                }
                if (wizardState.els.matrixBatchCountValue instanceof HTMLElement) {
                    wizardState.els.matrixBatchCountValue.textContent = String(displayMatrixBatchCount);
                }
                if (wizardState.els.matrixActionNote instanceof HTMLElement) {
                    if (!canEditMatrixDimensions) {
                        wizardState.els.matrixActionNote.textContent = '请先在上方切换场景，再添加矩阵维度。';
                    } else {
                        const recommendedKeys = getMatrixRecommendedPresetKeys(currentSceneName);
                        const configuredKeys = new Set(dimensionList.map(item => item.key));
                        const readyCount = recommendedKeys.filter(key => configuredKeys.has(key)).length;
                        const missingLabels = recommendedKeys
                            .filter(key => !configuredKeys.has(key))
                            .map(key => getMatrixDimensionPresetByKey(key, currentSceneName)?.label || key);
                        wizardState.els.matrixActionNote.textContent = recommendedKeys.length
                            ? (readyCount >= recommendedKeys.length
                                ? `推荐维度 ${readyCount}/${recommendedKeys.length}`
                                : `推荐维度 ${readyCount}/${recommendedKeys.length} · 缺 ${missingLabels.join('、')}`)
                            : '当前场景暂无推荐维度，可按需手动添加。';
                    }
                }
                if (wizardState.els.matrixDimensionList instanceof HTMLElement) {
                    wizardState.els.matrixDimensionList.classList.toggle('is-empty', !canEditMatrixDimensions);
                    if (!canEditMatrixDimensions) {
                        wizardState.els.matrixDimensionList.innerHTML = `
                            <div class="am-wxt-matrix-empty-state">
                                <div class="am-wxt-matrix-empty-title">先选场景</div>
                                <div class="am-wxt-matrix-empty-desc">请先在上方切换场景，再添加维度。</div>
                                <div class="am-wxt-matrix-empty-hint">矩阵维度会同步当前场景，只显示该场景可用的预算、出价、前缀、商品等维度。</div>
                            </div>
                        `;
                    } else {
                        const nextPresetKey = getNextAvailableMatrixPresetKey(currentSceneName, dimensionList);
                        wizardState.els.matrixDimensionList.innerHTML = [
                            ...dimensionList.map((item, index) => buildMatrixDimensionRow(item, index)),
                            buildMatrixDimensionAddCard(nextPresetKey)
                        ].join('');
                    }
                }
            };

            const renderPreviewSummaryPanel = (request = null) => {
                if (!(wizardState?.els?.previewSceneSummary instanceof HTMLElement)) return;
                const sceneGroups = Array.isArray(request?.scenePlanGroups) ? request.scenePlanGroups : [];
                const sceneSummary = sceneGroups.length
                    ? sceneGroups.map(item => `${item.sceneName}×${item.count}`).join('、')
                    : `${request?.sceneName || wizardState?.draft?.sceneName || '-'}×${toNumber(request?.planCount, 0)}`;
                const combinationCount = toNumber(request?.matrixPreview?.combinationCount, 0);
                const batchSummary = `${toNumber(request?.matrixPreview?.batchCount, 0)} 批 / 每批 ${toNumber(request?.matrixPreview?.batchSize, MATRIX_LIMITS.batchSize)}`;
                wizardState.els.previewSceneSummary.textContent = sceneSummary;
                wizardState.els.previewComboSummary.textContent = combinationCount > 0 ? `${combinationCount} 组` : '未启用';
                wizardState.els.previewBatchSummary.textContent = batchSummary;
            };

            const renderPreview = (request) => {
                const scenePlanGroups = Array.isArray(request?.plans)
                    ? uniqueBy(
                        request.plans.map(plan => String(plan?.sceneName || request?.sceneName || '').trim()).filter(Boolean),
                        item => item
                    ).map(sceneName => ({
                        sceneName,
                        count: request.plans.filter(plan => String(plan?.sceneName || request?.sceneName || '').trim() === sceneName).length
                    }))
                    : [];
                const preview = {
                    bizCode: request.bizCode,
                    promotionScene: request.promotionScene,
                    sceneName: request.sceneName || wizardState.draft?.sceneName || '',
                    scenePlanGroups,
                    sceneSettingCount: isPlainObject(request.sceneSettings) ? Object.keys(request.sceneSettings).filter(key => String(request.sceneSettings[key] || '').trim() !== '').length : 0,
                    planCount: request.plans.length,
                    strategyCount: (wizardState.strategyList || []).filter(item => item.enabled).length,
                    bidMode: request.common?.bidMode || 'smart',
                    fallbackPolicy: request.fallbackPolicy || 'confirm',
                    keywordMode: request.common?.keywordMode,
                    recommendCount: request.common?.recommendCount,
                    crowdCount: Array.isArray(request.common?.adgroupOverride?.rightList) ? request.common.adgroupOverride.rightList.length : 0,
                    firstPlan: summarizePlanForPreview(request.plans[0] || null),
                    matrix: {
                        enabled: request?.matrixPreview?.enabled === true,
                        combinationCount: toNumber(request?.matrixPreview?.combinationCount, 0),
                        batchSize: toNumber(request?.matrixPreview?.batchSize, MATRIX_LIMITS.batchSize),
                        batchCount: toNumber(request?.matrixPreview?.batchCount, 0),
                        namingPattern: String(request?.matrixPreview?.namingPattern || MATRIX_DEFAULT_NAMING_PATTERN).trim()
                    }
                };
                wizardState.els.preview.textContent = JSON.stringify(preview, null, 2);
                renderWorkbenchMatrixSummary(request);
                renderPreviewSummaryPanel({
                    ...preview,
                    scenePlanGroups,
                    planCount: preview.planCount,
                    matrixPreview: request?.matrixPreview || {}
                });
            };

            const buildKeywordConsoleRows = (words = []) => (
                (Array.isArray(words) ? words : [])
                    .map(item => {
                        const word = String(item?.word || item?.keyword || '').trim();
                        if (!word) return null;
                        const metricEntry = getKeywordMetricByWord(word) || {};
                        return {
                            keyword: word,
                            bidPrice: toNumber(item?.bidPrice, 1),
                            matchScope: parseMatchScope(item?.matchScope, DEFAULTS.matchScope) === 1 ? '精准' : '广泛',
                            onlineStatus: toNumber(item?.onlineStatus, DEFAULTS.keywordOnlineStatus),
                            searchIndex: String(metricEntry.searchIndexText || '-'),
                            marketClickRate: String(metricEntry.marketClickRateText || '-'),
                            marketClickConversionRate: String(metricEntry.marketClickConversionRateText || '-'),
                            marketAverageBid: String(metricEntry.marketAverageBidText || '-'),
                            relevance: String(metricEntry.relevanceText || '-')
                        };
                    })
                    .filter(Boolean)
            );

            const logRecommendedKeywordConsoleReport = ({
                triggerSource = 'manual',
                targetItem = {},
                runtime = {},
                keywordDefaults = {},
                recommendCount = 0,
                recommendedWords = [],
                normalizedRecommend = [],
                manualWords = [],
                mergedWords = []
            } = {}) => {
                if (typeof console === 'undefined') return;
                const sourceTag = String(triggerSource || 'manual').trim() || 'manual';
                const snapshotMaterialId = toIdValue(targetItem?.materialId || targetItem?.itemId);
                const targetItemSnapshot = {
                    materialId: snapshotMaterialId,
                    materialName: String(targetItem?.materialName || '').trim() || (snapshotMaterialId ? `商品${snapshotMaterialId}` : '')
                };
                const runtimeSnapshot = {
                    bizCode: String(runtime?.bizCode || '').trim(),
                    promotionScene: String(runtime?.promotionScene || '').trim(),
                    itemSelectedMode: String(runtime?.itemSelectedMode || '').trim(),
                    bidTypeV2: String(runtime?.bidTypeV2 || '').trim(),
                    bidTargetV2: String(runtime?.bidTargetV2 || '').trim()
                };
                const keywordDefaultsSnapshot = {
                    bidPrice: toNumber(keywordDefaults?.bidPrice, 1),
                    matchScope: parseMatchScope(keywordDefaults?.matchScope, DEFAULTS.matchScope),
                    onlineStatus: toNumber(keywordDefaults?.onlineStatus, DEFAULTS.keywordOnlineStatus)
                };
                const summary = {
                    source: sourceTag,
                    recommendCount,
                    rawRecommendCount: Array.isArray(recommendedWords) ? recommendedWords.length : 0,
                    normalizedRecommendCount: Array.isArray(normalizedRecommend) ? normalizedRecommend.length : 0,
                    manualWordCount: Array.isArray(manualWords) ? manualWords.length : 0,
                    mergedWordCount: Array.isArray(mergedWords) ? mergedWords.length : 0
                };
                const reportTitle = `${TAG} 推荐关键词加载结果 [${sourceTag}] item=${targetItemSnapshot.materialId || '-'}`;

                if (typeof console.groupCollapsed === 'function') {
                    console.groupCollapsed(reportTitle);
                } else if (typeof console.log === 'function') {
                    console.log(reportTitle);
                }
                try {
                    if (typeof console.log === 'function') {
                        console.log('summary', summary);
                        console.log('targetItem', targetItemSnapshot);
                        console.log('runtime', runtimeSnapshot);
                        console.log('keywordDefaults', keywordDefaultsSnapshot);
                        console.log('recommendedWords(raw)', recommendedWords);
                        console.log('normalizedRecommend', normalizedRecommend);
                        console.log('manualWords(beforeMerge)', manualWords);
                        console.log('mergedWords(afterMerge)', mergedWords);
                    }
                    const mergedRows = buildKeywordConsoleRows(mergedWords);
                    if (mergedRows.length && typeof console.table === 'function') {
                        console.table(mergedRows);
                    } else if (typeof console.log === 'function') {
                        console.log('mergedWords(rows)', mergedRows);
                    }
                } finally {
                    if (typeof console.groupEnd === 'function') {
                        console.groupEnd();
                    }
                }
            };

            const loadRecommendedKeywords = async (options = {}) => {
                const triggerSource = String(options?.triggerSource || 'manual').trim() || 'manual';
                if (!wizardState.addedItems.length) {
                    appendWizardLog('请先添加商品，再加载推荐关键词', 'error');
                    return false;
                }
                const editingStrategy = getStrategyById(wizardState.editingStrategyId) || wizardState.strategyList.find(item => item.enabled) || wizardState.strategyList[0];
                if (!editingStrategy) {
                    appendWizardLog('请先选择一个策略并点击“编辑计划”', 'error');
                    return false;
                }
                const targetItem = wizardState.addedItems[0];
                const recommendCount = Math.max(1, toNumber(wizardState.els.recommendCountInput.value.trim(), DEFAULTS.recommendCount));
                const defaultBid = toNumber(wizardState.els.bidInput.value.trim(), 1);
                const keywordDefaults = {
                    bidPrice: defaultBid,
                    matchScope: DEFAULTS.matchScope,
                    onlineStatus: DEFAULTS.keywordOnlineStatus
                };
                appendWizardLog(`开始加载推荐关键词：${targetItem.materialName || targetItem.materialId}`);
                try {
                    const runtime = await getRuntimeDefaults(false);
                    runtime.bizCode = wizardState.draft?.bizCode || runtime.bizCode || DEFAULTS.bizCode;
                    runtime.promotionScene = wizardState.draft?.promotionScene || runtime.promotionScene || DEFAULTS.promotionScene;
                    const recommendedWords = await fetchRecommendWordList({
                        bizCode: runtime.bizCode,
                        materialId: targetItem.materialId || targetItem.itemId,
                        defaults: runtime,
                        source: 'auto'
                    });
                    mergeKeywordMetricMap(recommendedWords);
                    const normalizedRecommend = recommendedWords
                        .map(word => applyKeywordDefaults(word, keywordDefaults))
                        .filter(word => word.word)
                        .slice(0, recommendCount);
                    if (!normalizedRecommend.length) {
                        appendWizardLog('未获取到推荐关键词，请稍后重试', 'error');
                        return false;
                    }

                    const manualWords = parseKeywords(wizardState.els.manualInput.value || '', keywordDefaults)
                        .map(word => applyKeywordDefaults(word, keywordDefaults));
                    const dedupMap = new Map();
                    manualWords.forEach(word => dedupMap.set(word.word, word));
                    normalizedRecommend.forEach(word => {
                        if (!dedupMap.has(word.word)) dedupMap.set(word.word, word);
                    });
                    const mergedWords = Array.from(dedupMap.values()).slice(0, 200);
                    wizardState.els.manualInput.value = mergedWords.map(formatKeywordLine).join('\n');
                    pullDetailFormToStrategy(editingStrategy);
                    commitStrategyUiState({ renderSceneDynamic: true });
                    logRecommendedKeywordConsoleReport({
                        triggerSource,
                        targetItem,
                        runtime,
                        keywordDefaults,
                        recommendCount,
                        recommendedWords,
                        normalizedRecommend,
                        manualWords,
                        mergedWords
                    });
                    appendWizardLog(`推荐关键词已加载 ${normalizedRecommend.length} 条（合并后 ${mergedWords.length} 条）`, 'success');
                    return true;
                } catch (err) {
                    appendWizardLog(`加载推荐关键词失败：${err?.message || err}`, 'error');
                    return false;
                }
            };

            const maybeAutoLoadManualKeywords = (strategy = null, options = {}) => {
                const targetStrategy = strategy || getStrategyById(wizardState.editingStrategyId);
                if (!isPlainObject(targetStrategy)) return;
                if (!wizardState.detailVisible) return;
                if (String(targetStrategy.sceneName || '').trim() !== '关键词推广') return;
                if (!wizardState.addedItems.length) return;
                const manualText = String(wizardState.els.manualInput?.value || targetStrategy.manualKeywords || '').trim();
                if (manualText) return;
                const materialId = String(wizardState.addedItems[0]?.materialId || wizardState.addedItems[0]?.itemId || '').trim();
                const strategyId = String(targetStrategy.id || '').trim();
                if (!materialId || !strategyId) return;
                wizardState.autoKeywordLoadMap = isPlainObject(wizardState.autoKeywordLoadMap) ? wizardState.autoKeywordLoadMap : {};
                const autoLoadKey = `${strategyId}::${materialId}`;
                const currentStatus = String(wizardState.autoKeywordLoadMap[autoLoadKey] || '').trim();
                if (currentStatus === 'pending' || currentStatus === 'done') return;
                wizardState.autoKeywordLoadMap[autoLoadKey] = 'pending';
                appendWizardLog('检测到手动关键词为空，自动加载推荐关键词...');
                const delayMs = Math.max(120, toNumber(options.delayMs, 240));
                window.setTimeout(async () => {
                    const latestStrategy = getStrategyById(strategyId);
                    if (!latestStrategy || wizardState.editingStrategyId !== strategyId || !wizardState.detailVisible) {
                        delete wizardState.autoKeywordLoadMap[autoLoadKey];
                        return;
                    }
                    const loadOk = await loadRecommendedKeywords({ triggerSource: 'auto_fill' });
                    if (!loadOk) {
                        delete wizardState.autoKeywordLoadMap[autoLoadKey];
                        return;
                    }
                    wizardState.autoKeywordLoadMap[autoLoadKey] = 'done';
                }, delayMs);
            };

            const loadRecommendedCrowds = async () => {
                appendWizardLog('开始加载推荐人群...');
                try {
                    const runtime = await getRuntimeDefaults(false);
                    runtime.bizCode = wizardState.draft?.bizCode || runtime.bizCode || DEFAULTS.bizCode;
                    runtime.promotionScene = wizardState.draft?.promotionScene || runtime.promotionScene || DEFAULTS.promotionScene;
                    runtime.bidTargetV2 = wizardState.draft?.bidTargetV2 || runtime.bidTargetV2 || DEFAULTS.bidTargetV2;
                    runtime.subPromotionType = wizardState.draft?.subPromotionType || runtime.subPromotionType || DEFAULTS.subPromotionType;
                    runtime.promotionType = wizardState.draft?.promotionType || runtime.promotionType || DEFAULTS.promotionType;
                    const materialList = uniqueBy(
                        (Array.isArray(wizardState.addedItems) ? wizardState.addedItems : [])
                            .map(item => {
                                const materialId = toIdValue(item?.materialId || item?.itemId);
                                if (!materialId) return null;
                                const resolvedMaterialName = String(item?.materialName || item?.name || '').trim() || `商品${materialId}`;
                                return {
                                    materialId,
                                    materialName: resolvedMaterialName
                                };
                            })
                            .filter(item => item && item.materialId),
                        item => item.materialId
                    ).slice(0, 10);
                    if (!materialList.length) {
                        const fallbackId = toIdValue(SCENE_SYNC_DEFAULT_ITEM_ID);
                        if (fallbackId) materialList.push({ materialId: fallbackId, materialName: `商品${fallbackId}` });
                    }
                    const materialIdList = materialList.map(item => item.materialId);
                    const draft = isPlainObject(wizardState.draft) ? wizardState.draft : {};
                    const sceneSettings = isPlainObject(draft.sceneSettings) ? draft.sceneSettings : {};
                    const sceneSettingValues = isPlainObject(draft.sceneSettingValues) ? draft.sceneSettingValues : {};
                    const goalFieldKey = normalizeSceneFieldKey('营销目标');
                    const strategyFieldKey = normalizeSceneFieldKey('选择拉新方案');
                    const goalLabel = normalizeGoalCandidateLabel(
                        draft.marketingGoal
                        || sceneSettings.营销目标
                        || sceneSettings.选择拉新方案
                        || sceneSettingValues[goalFieldKey]
                        || sceneSettingValues[strategyFieldKey]
                        || ''
                    );
                    const crowdSuggestList = await fetchRecommendCrowdListByCrowdSuggest({
                        bizCode: runtime.bizCode,
                        defaults: runtime,
                        materialList,
                        goalLabel,
                        labelIdList: CROWD_RECOMMEND_SEED_LABEL_IDS
                    });
                    const crowdList = crowdSuggestList.length
                        ? crowdSuggestList
                        : await fetchRecommendCrowdList({
                            bizCode: runtime.bizCode,
                            defaults: runtime,
                            labelIdList: DEFAULTS.recommendCrowdLabelIds,
                            materialIdList
                        });
                    const nativeCrowdFallback = await resolveNativeCrowdListFromVframes({
                        expectedBizCode: runtime?.bizCode || wizardState.draft?.bizCode || ''
                    });
                    const fallbackRightList = Array.isArray(runtime?.solutionTemplate?.adgroupList?.[0]?.rightList)
                        ? runtime.solutionTemplate.adgroupList[0].rightList.map(item => deepClone(item))
                        : [];
                    const mergedCrowdList = crowdList.length
                        ? crowdList
                        : (nativeCrowdFallback.length ? nativeCrowdFallback : fallbackRightList);
                    if (!mergedCrowdList.length) {
                        appendWizardLog('未获取到推荐人群，可直接创建（默认不限人群）', 'error');
                        return;
                    }
                    wizardState.crowdList = uniqueBy(
                        mergedCrowdList,
                        item => item?.mx_crowdId || `${item?.crowd?.label?.labelId || ''}_${item?.crowd?.label?.optionList?.[0]?.optionValue || ''}`
                    ).slice(0, 50);
                    commitCrowdUiState();
                    appendWizardLog(`推荐人群已加载 ${wizardState.crowdList.length} 条`, 'success');
                } catch (err) {
                    appendWizardLog(`加载推荐人群失败：${err?.message || err}`, 'error');
                }
            };

            const resolveSceneSyncItemId = () => {
                const fromWizard = wizardState.addedItems
                    .map(item => String(item?.materialId || item?.itemId || '').trim())
                    .find(Boolean);
                if (fromWizard) return fromWizard;
                const pageItemIds = extractPageAddedItemIds();
                if (Array.isArray(pageItemIds) && pageItemIds.length) {
                    return String(pageItemIds[0] || '').trim();
                }
                return SCENE_SYNC_DEFAULT_ITEM_ID;
            };

            const scheduleSceneCreateContractSync = (sceneName, options = {}) => {
                const targetScene = String(sceneName || '').trim();
                if (!SCENE_OPTIONS.includes(targetScene)) return;
                const forceRefresh = options.forceRefresh === true;
                if (!forceRefresh) {
                    const cached = getCachedSceneCreateContract(targetScene, '');
                    if (cached) return;
                }
                if (wizardState.sceneSyncTimer) {
                    clearTimeout(wizardState.sceneSyncTimer);
                    wizardState.sceneSyncTimer = 0;
                }
                const delayMs = Math.max(180, toNumber(options.delayMs, 420));
                const token = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                wizardState.sceneSyncPendingToken = token;
                wizardState.sceneSyncTimer = window.setTimeout(async () => {
                    if (wizardState.sceneSyncPendingToken !== token) return;
                    if (wizardState.sceneSyncInFlight) return;
                    wizardState.sceneSyncInFlight = true;
                    const itemId = resolveSceneSyncItemId();
                    appendWizardLog(`场景接口同步：${targetScene}（itemId=${itemId}）`);
                    try {
                        const capture = await captureSceneCreateInterfaces(targetScene, {
                            itemId,
                            passMode: 'interface',
                            captureInterfaces: true,
                            fallbackPolicy: 'none',
                            batchRetry: 0,
                            maxRetries: 1,
                            timeoutMs: Math.max(18000, toNumber(options.timeoutMs, 35000)),
                            requestTimeout: Math.max(10000, toNumber(options.requestTimeout, 22000)),
                            dayAverageBudget: Math.max(50, toNumber(options.dayAverageBudget, 100))
                        });
                        const row = isPlainObject(capture?.row) ? capture.row : {};
                        const createInterfaces = Array.isArray(row?.capture?.createInterfaces)
                            ? row.capture.createInterfaces
                            : [];
                        if (createInterfaces.length) {
                            const goalLabel = normalizeGoalLabel(row?.requestPreview?.marketingGoal || '');
                            const rememberedContract = rememberSceneCreateInterfaces(
                                targetScene,
                                goalLabel,
                                createInterfaces,
                                { source: 'scene_switch_sync' }
                            );
                            appendWizardLog(
                                `场景接口已同步：${targetScene} 接口=${rememberedContract?.endpoint || row.submitEndpoint || '-'} 请求字段数=${toNumber(rememberedContract?.requestKeys?.length, 0)}`,
                                'success'
                            );
                        } else {
                            appendWizardLog(`场景接口同步未捕获到创建请求：${targetScene}${row?.error ? `（${row.error}）` : ''}`, 'error');
                        }
                    } catch (err) {
                        appendWizardLog(`场景接口同步失败：${targetScene} -> ${err?.message || err}`, 'error');
                    } finally {
                        wizardState.sceneSyncInFlight = false;
                    }
                }, delayMs);
            };
            const buildSceneSyncDefaultItem = () => normalizeItem({
                materialId: SCENE_SYNC_DEFAULT_ITEM_ID,
                itemId: SCENE_SYNC_DEFAULT_ITEM_ID,
                materialName: `默认商品 ${SCENE_SYNC_DEFAULT_ITEM_ID}`
            });
            const ensureSceneDefaultItemForSceneImpl = async ({
                sceneName = '',
                runtime = null,
                force = false,
                silent = false,
                rerender = true,
                isStale = null
            } = {}) => {
                const currentScene = SCENE_OPTIONS.includes(sceneName)
                    ? sceneName
                    : (SCENE_OPTIONS.includes(wizardState?.draft?.sceneName) ? wizardState.draft.sceneName : inferCurrentSceneName());
                if (currentScene !== '人群推广') return false;
                const existingItems = Array.isArray(wizardState.addedItems)
                    ? wizardState.addedItems.filter(item => toIdValue(item?.materialId || item?.itemId))
                    : [];
                if (!force && existingItems.length) return false;
                if (typeof isStale === 'function' && isStale()) return false;

                let nextItem = null;
                try {
                    const runtimeSnapshot = isPlainObject(runtime) && Object.keys(runtime).length
                        ? runtime
                        : await getRuntimeDefaults(false);
                    if (typeof isStale === 'function' && isStale()) return false;
                    const fetchedItems = await fetchItemsByIds([SCENE_SYNC_DEFAULT_ITEM_ID], runtimeSnapshot);
                    if (Array.isArray(fetchedItems) && fetchedItems.length) {
                        nextItem = normalizeItem(fetchedItems[0]);
                    }
                } catch (err) {
                    log.warn('自动注入人群默认商品失败，使用兜底商品:', err?.message || err);
                }
                if (!nextItem || !toIdValue(nextItem.materialId || nextItem.itemId)) {
                    nextItem = buildSceneSyncDefaultItem();
                }
                if (!nextItem || !toIdValue(nextItem.materialId || nextItem.itemId)) return false;

                wizardState.addedItems = [deepClone(nextItem)];
                const draft = ensureWizardDraft();
                draft.addedItems = wizardState.addedItems.map(item => deepClone(item));
                KeywordPlanWizardStore.persistDraft(draft);
                if (typeof isStale === 'function' && isStale()) return false;
                if (rerender) {
                    commitItemSelectionUiState({
                        renderAdded: true,
                        renderCandidate: true,
                        refreshPreview: true
                    });
                }
                if (!silent) {
                    appendWizardLog(`已注入默认商品 ${SCENE_SYNC_DEFAULT_ITEM_ID} 以补齐人群配置层`, 'success');
                }
                return true;
            };
            const syncNativeCrowdDefaultsForSceneImpl = async ({
                sceneName = '',
                runtime = null,
                force = false,
                silent = false,
                rerender = true,
                isStale = null
            } = {}) => {
                const currentScene = SCENE_OPTIONS.includes(sceneName)
                    ? sceneName
                    : (SCENE_OPTIONS.includes(wizardState?.draft?.sceneName) ? wizardState.draft.sceneName : inferCurrentSceneName());
                if (currentScene !== '人群推广') return false;
                if (typeof isStale === 'function' && isStale()) return false;
                const expectedBizCode = normalizeSceneBizCode(
                    runtime?.bizCode
                    || wizardState?.draft?.bizCode
                    || parseRouteParamFromHash('bizCode')
                    || ''
                );
                if (expectedBizCode && expectedBizCode !== 'onebpDisplay') return false;
                const nativeCrowdList = await resolveNativeCrowdListFromVframes({
                    expectedBizCode,
                    force
                });
                if (typeof isStale === 'function' && isStale()) return false;
                if (!nativeCrowdList.length) return false;
                const sceneBucket = ensureSceneSettingBucket('人群推广');
                const touchedBucket = ensureSceneTouchedBucket('人群推广');
                const crowdField = 'adgroup.rightList';
                const crowdFieldKey = normalizeSceneFieldKey(crowdField);
                const campaignField = 'campaign.crowdList';
                const campaignFieldKey = normalizeSceneFieldKey(campaignField);
                const crowdTouched = touchedBucket[crowdField] === true || touchedBucket[crowdFieldKey] === true;
                const campaignTouched = touchedBucket[campaignField] === true || touchedBucket[campaignFieldKey] === true;
                const crowdRawValue = normalizeSceneSettingValue(
                    sceneBucket[crowdField]
                    || sceneBucket[crowdFieldKey]
                    || ''
                );
                const campaignRawValue = normalizeSceneSettingValue(
                    sceneBucket[campaignField]
                    || sceneBucket[campaignFieldKey]
                    || ''
                );
                const canFillCrowdField = !crowdTouched && (!crowdRawValue || crowdRawValue === '[]');
                const canFillCampaignField = !campaignTouched && (!campaignRawValue || campaignRawValue === '[]');
                const shouldSyncWizardCrowd = !Array.isArray(wizardState.crowdList)
                    || !wizardState.crowdList.length
                    || canFillCrowdField;
                if (!canFillCrowdField && !canFillCampaignField && !shouldSyncWizardCrowd) return false;
                const syncedCrowdList = deepClone(nativeCrowdList.slice(0, 100));
                const syncedCrowdRaw = JSON.stringify(syncedCrowdList);
                if (canFillCrowdField) {
                    sceneBucket[crowdField] = syncedCrowdRaw;
                    sceneBucket[crowdFieldKey] = syncedCrowdRaw;
                }
                if (canFillCampaignField) {
                    sceneBucket[campaignField] = syncedCrowdRaw;
                    sceneBucket[campaignFieldKey] = syncedCrowdRaw;
                }
                if (shouldSyncWizardCrowd) {
                    wizardState.crowdList = syncedCrowdList;
                }
                const draft = ensureWizardDraft();
                draft.crowdList = deepClone(wizardState.crowdList);
                KeywordPlanWizardStore.persistDraft(draft);
                if (typeof isStale === 'function' && isStale()) return false;
                if (rerender) {
                    commitCrowdUiState({
                        renderSceneDynamic: true
                    });
                }
                if (!silent) {
                    appendWizardLog(`已同步原生默认人群 ${wizardState.crowdList.length} 条`, 'success');
                }
                return true;
            };

            const switchSceneFromEditor = async (sceneName) => {
                const nextScene = String(sceneName || '').trim();
                if (!SCENE_OPTIONS.includes(nextScene)) return;
                const draft = ensureWizardDraft();
                const prevScene = draft.sceneName;
                const prevPrefix = String(draft.planNamePrefix || '').trim();
                const editingStrategy = getStrategyById(wizardState.editingStrategyId)
                    || wizardState.strategyList[0]
                    || null;
                if (!wizardState.editingStrategyId && editingStrategy?.id) {
                    wizardState.editingStrategyId = editingStrategy.id;
                }
                const applyToAllStrategies = !editingStrategy;
                draft.sceneName = nextScene;
                const sceneBizCodeHint = resolveSceneBizCodeHint(nextScene);
                if (sceneBizCodeHint) draft.bizCode = sceneBizCodeHint;
                if (sceneBizCodeHint && sceneBizCodeHint !== DEFAULTS.bizCode) {
                    draft.promotionScene = '';
                } else if (!draft.promotionScene) {
                    draft.promotionScene = DEFAULTS.promotionScene;
                }
                if (wizardState.els.sceneSelect && wizardState.els.sceneSelect.value !== nextScene) {
                    wizardState.els.sceneSelect.value = nextScene;
                }
                const nextPrefix = buildDefaultPlanPrefixByScene(nextScene);
                const prefixInputValue = String(wizardState.els.prefixInput?.value || '').trim();
                const shouldSyncDefaultPrefix = !prefixInputValue
                    || isAutoGeneratedPlanPrefix(prefixInputValue)
                    || (prevPrefix && prefixInputValue === prevPrefix);
                if (applyToAllStrategies || shouldSyncDefaultPrefix) {
                    wizardState.draft.planNamePrefix = nextPrefix;
                    if (wizardState.els.prefixInput) wizardState.els.prefixInput.value = nextPrefix;
                }
                const shouldSyncAutoPlanName = (rawPlanName = '') => {
                    const value = String(rawPlanName || '').trim();
                    if (!value) return true;
                    if (isAutoGeneratedPlanPrefix(value)) return true;
                    if (prevPrefix && value === prevPrefix) return true;
                    return SCENE_OPTIONS.some(scene => {
                        const escaped = escapeRegExp(scene);
                        return new RegExp(`^${escaped}_\\d{8,14}(?:_|$)`).test(value);
                    });
                };
                const targetStrategies = applyToAllStrategies
                    ? (wizardState.strategyList || [])
                    : [editingStrategy];
                targetStrategies.forEach(strategy => {
                    if (!isPlainObject(strategy)) return;
                    strategy.sceneName = nextScene;
                    strategy.sceneSettings = {};
                    strategy.sceneSettingValues = {};
                    strategy.sceneSettingTouched = {};
                    if (shouldSyncAutoPlanName(strategy.planName || '')) {
                        strategy.planName = '';
                        strategy.autoPlanPrefix = nextPrefix;
                    }
                });
                const prevMatrixConfig = normalizeMatrixConfig(draft.matrixConfig, prevScene);
                draft.matrixConfig = normalizeMatrixConfig(draft.matrixConfig, nextScene);
                const nextMatrixKeySet = new Set(
                    (Array.isArray(draft.matrixConfig?.dimensions) ? draft.matrixConfig.dimensions : [])
                        .map(item => String(item?.key || '').trim())
                        .filter(Boolean)
                );
                const removedMatrixLabels = (Array.isArray(prevMatrixConfig?.dimensions) ? prevMatrixConfig.dimensions : [])
                    .map(item => {
                        const key = String(item?.key || '').trim();
                        if (!key || nextMatrixKeySet.has(key)) return '';
                        return getMatrixDimensionPresetByKey(key, prevScene)?.label || item?.label || key;
                    })
                    .filter(Boolean);
                renderSceneDynamicConfig();
                const sceneSettingsForStrategy = nextScene === '关键词推广'
                    ? {}
                    : buildSceneSettingsPayload(nextScene);
                targetStrategies.forEach(strategy => {
                    if (!isPlainObject(strategy)) return;
                    strategy.marketingGoal = resolveStrategyMarketingGoal(strategy, sceneSettingsForStrategy, nextScene);
                });
                if (editingStrategy && wizardState.detailVisible) {
                    applyStrategyToDetailForm(editingStrategy);
                }
                renderStaticOptionLines();
                commitStrategyUiState();
                if (prevScene !== nextScene) {
                    const sceneHintText = sceneBizCodeHint ? `（${sceneBizCodeHint}）` : '';
                    const scopeText = applyToAllStrategies ? '全部计划' : (editingStrategy?.name || '当前计划');
                    appendWizardLog(`场景配置已切换：${nextScene}${sceneHintText}（${scopeText}）${WIZARD_FORCE_API_ONLY_SCENE_CONFIG ? ' [API模式]' : ''}`, 'success');
                    if (removedMatrixLabels.length) {
                        appendWizardLog(`矩阵维度已按场景同步，移除：${removedMatrixLabels.join('、')}`);
                    }
                }
                if (!WIZARD_FORCE_API_ONLY_SCENE_CONFIG) {
                    refreshSceneProfileFromSpec(nextScene, {
                        scanMode: 'full_top_down',
                        unlockPolicy: 'safe_only',
                        goalScan: true,
                        silent: true
                    });
                    scheduleSceneCreateContractSync(nextScene, {
                        forceRefresh: prevScene !== nextScene
                    });
                }
                if (nextScene === '人群推广') {
                    try {
                        await ensureSceneDefaultItemForScene({
                            sceneName: nextScene,
                            force: false,
                            silent: false,
                            rerender: true
                        });
                        await syncNativeCrowdDefaultsForScene({
                            sceneName: nextScene,
                            runtime: {
                                bizCode: wizardState?.draft?.bizCode || ''
                            },
                            silent: false,
                            rerender: true
                        });
                    } catch (err) {
                        log.warn('场景切换后同步原生人群失败:', err?.message || err);
                    }
                }
            };

            wizardState.els.closeBtn.onclick = () => {
                if (wizardState.repairRunning) {
                    wizardState.repairStopRequested = true;
                    appendWizardLog('弹窗已关闭，停止信号已发送（当前 case 结束后停止）', 'error');
                }
                commitDraftState();
                setDetailVisible(false);
                setRunModeMenuOpen(false);
                overlay.classList.remove('open');
                wizardState.visible = false;
            };
            overlay.addEventListener('click', (e) => {
                const target = e.target instanceof Element ? e.target : null;
                if (!(target && target.closest('#am-wxt-keyword-run-mode-wrap'))) {
                    setRunModeMenuOpen(false);
                }
                if (!(target && target.closest('[data-matrix-dimension-picker="1"]'))) {
                    closeMatrixDimensionPickers(wizardState?.els?.matrixDimensionList);
                }
                if (e.target === overlay) wizardState.els.closeBtn.click();
            });
            if (wizardState.els.runModeToggleBtn instanceof HTMLButtonElement) {
                const toggleRunModeMenu = (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const opened = wizardState.els.runModeToggleBtn?.dataset?.open === '1';
                    setRunModeMenuOpen(!opened);
                };
                wizardState.els.runModeToggleBtn.addEventListener('pointerdown', toggleRunModeMenu, { passive: false });
                wizardState.els.runModeToggleBtn.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                });
                wizardState.els.runModeToggleBtn.addEventListener('keydown', (event) => {
                    if (!(event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar')) return;
                    toggleRunModeMenu(event);
                });
                window.addEventListener('resize', () => {
                    if (wizardState.els.runModeToggleBtn?.dataset?.open === '1') positionRunModeMenu();
                });
                window.addEventListener('scroll', () => {
                    if (wizardState.els.runModeToggleBtn?.dataset?.open === '1') positionRunModeMenu();
                }, true);
            }
            if (wizardState.els.runModeMenu instanceof HTMLElement) {
                const runModeCountBadge = wizardState.els.runModeMenu.querySelector('[data-action="run-mode-count-badge"]');
                if (runModeCountBadge instanceof HTMLElement) {
                    const applyParallelCountDelta = (delta = 0) => {
                        const currentCount = normalizeParallelSubmitTimes(
                            wizardState?.draft?.parallelSubmitTimes,
                            DEFAULT_SCENE_PARALLEL_SUBMIT_TIMES
                        );
                        setParallelSubmitTimesFromUI(currentCount + delta, {
                            syncDraft: true,
                            silent: false
                        });
                        positionRunModeMenu();
                    };
                    runModeCountBadge.addEventListener('click', (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        applyParallelCountDelta(1);
                    });
                    runModeCountBadge.addEventListener('contextmenu', (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        applyParallelCountDelta(-1);
                    });
                    runModeCountBadge.addEventListener('wheel', (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        const delta = event.deltaY > 0 ? -1 : 1;
                        applyParallelCountDelta(delta);
                    }, { passive: false });
                }
                wizardState.els.runModeMenu.addEventListener('click', (event) => {
                    if (event.target instanceof Element && event.target.closest('[data-action="run-mode-count-badge"]')) {
                        event.preventDefault();
                        event.stopPropagation();
                        return;
                    }
                    const target = event.target instanceof Element
                        ? event.target.closest('[data-submit-mode]')
                        : null;
                    if (!(target instanceof HTMLButtonElement)) return;
                    event.preventDefault();
                    const selectedMode = normalizeSubmitMode(target.getAttribute('data-submit-mode') || '');
                    setSubmitModeFromUI(selectedMode, {
                        syncDraft: true,
                        silent: false
                    });
                    setRunModeMenuOpen(false);
                });
            }
            wizardState.els.searchBtn.onclick = () => loadCandidates(wizardState.els.searchInput.value.trim(), wizardState.candidateSource);
            wizardState.els.hotBtn.onclick = () => {
                wizardState.els.searchInput.value = '';
                loadCandidates('', 'recommend');
            };
            wizardState.els.allBtn.onclick = () => {
                wizardState.els.searchInput.value = '';
                loadCandidates('', 'all');
            };
            wizardState.els.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    wizardState.els.searchBtn.click();
                }
            });
            wizardState.els.toggleCandidateBtn.onclick = () => {
                openKeywordItemPickerPopup();
            };
            wizardState.els.toggleCandidateListBtn.onclick = () => {
                setCandidateListExpanded(wizardState.candidateListExpanded !== true);
                commitDraftState();
            };
            wizardState.els.addAllBtn.onclick = () => {
                if (!wizardState.candidates.length) return;
                const room = Math.max(0, WIZARD_MAX_ITEMS - wizardState.addedItems.length);
                if (!room) {
                    appendWizardLog(`已达到上限 ${WIZARD_MAX_ITEMS} 个商品`, 'error');
                    return;
                }
                const addedSet = new Set(wizardState.addedItems.map(item => String(item.materialId)));
                const pick = wizardState.candidates.filter(item => !addedSet.has(String(item.materialId))).slice(0, room);
                wizardState.addedItems = wizardState.addedItems.concat(pick);
                commitItemSelectionUiState({
                    renderAdded: true,
                    renderCandidate: true
                });
                appendWizardLog(`已批量添加 ${pick.length} 个商品`, 'success');
            };
            wizardState.els.clearAddedBtn.onclick = () => {
                wizardState.addedItems = [];
                commitItemSelectionUiState({
                    renderAdded: true,
                    renderCandidate: true
                });
            };
            (Array.isArray(wizardState.els.workbenchTabs) ? wizardState.els.workbenchTabs : []).forEach((btn) => {
                if (!(btn instanceof HTMLButtonElement)) return;
                btn.addEventListener('click', () => {
                    const nextPage = btn.dataset.workbenchPage || 'home';
                    if (nextPage === 'editor') {
                        const activeStrategy = getStrategyById(wizardState.editingStrategyId) || wizardState.strategyList[0] || null;
                        if (activeStrategy) {
                            showStrategyDetail(activeStrategy);
                            return;
                        }
                    }
                    setWorkbenchPage(nextPage);
                    commitPreviewUiState();
                });
            });
            [wizardState.els.matrixEnabledInput, wizardState.els.matrixMaxInput, wizardState.els.matrixBatchInput, wizardState.els.matrixNamePatternInput]
                .forEach((input) => {
                    if (!(input instanceof HTMLElement)) return;
                    input.addEventListener('change', () => {
                        commitPreviewUiState();
                    });
                });
            if (wizardState.els.matrixPresetList instanceof HTMLElement) {
                wizardState.els.matrixPresetList.addEventListener('click', (event) => {
                    const target = event.target instanceof Element
                        ? event.target.closest('[data-matrix-preset-key]')
                        : null;
                    if (!(target instanceof Element)) return;
                    const currentSceneName = getMatrixSceneName(wizardState.draft?.sceneName || '');
                    if (!currentSceneName) {
                        appendWizardLog('请先在编辑页选择场景，再添加矩阵维度', 'error');
                        return;
                    }
                    const presetKey = String(target.getAttribute('data-matrix-preset-key') || '').trim();
                    applyMatrixPreset(presetKey);
                });
            }
            if (wizardState.els.matrixApplyRecommendedBtn instanceof HTMLButtonElement) {
                wizardState.els.matrixApplyRecommendedBtn.addEventListener('click', () => {
                    const currentSceneName = getMatrixSceneName(wizardState.draft?.sceneName || '');
                    if (!currentSceneName) {
                        appendWizardLog('请先在编辑页选择场景，再补齐矩阵维度', 'error');
                        return;
                    }
                    const presetKeys = getMatrixRecommendedPresetKeys(currentSceneName);
                    const beforeCount = Array.isArray(wizardState?.draft?.matrixConfig?.dimensions)
                        ? wizardState.draft.matrixConfig.dimensions.length
                        : 0;
                    const nextMatrixConfig = applyMatrixPresetBundle(presetKeys, {
                        focusKey: presetKeys[presetKeys.length - 1] || ''
                    });
                    const afterCount = Array.isArray(nextMatrixConfig?.dimensions) ? nextMatrixConfig.dimensions.length : beforeCount;
                    if (afterCount > beforeCount) {
                        appendWizardLog(`已补齐矩阵推荐维度 ${afterCount} 项`, 'success');
                    } else {
                        appendWizardLog('矩阵推荐维度已齐全，可直接编辑右侧卡片');
                    }
                });
            }
            if (wizardState.els.matrixGenerateBtn instanceof HTMLButtonElement) {
                wizardState.els.matrixGenerateBtn.addEventListener('click', () => {
                    try {
                        const currentSceneName = getMatrixSceneName(wizardState.draft?.sceneName || '');
                        if (!currentSceneName) {
                            appendWizardLog('请先在编辑页选择场景，再生成计划', 'error');
                            return;
                        }
                        const matrixConfig = normalizeMatrixConfig(wizardState?.draft?.matrixConfig, currentSceneName);
                        const enabledStrategyCount = Array.isArray(wizardState?.strategyList)
                            ? wizardState.strategyList.filter(item => item?.enabled !== false).length
                            : 0;
                        const matrixStats = buildMatrixPreviewStats(matrixConfig, {
                            sceneName: currentSceneName,
                            strategyCount: enabledStrategyCount,
                            itemCount: Array.isArray(wizardState?.addedItems) ? wizardState.addedItems.length : 0
                        });
                        if (!matrixConfig.enabled || !matrixStats.combinations.length) {
                            appendWizardLog('请先开启矩阵并补齐至少 1 组有效组合，再生成计划', 'error');
                            return;
                        }
                        const req = KeywordPlanRequestBuilder.buildRequestFromWizard();
                        if (!Array.isArray(req?.plans) || !req.plans.length) {
                            appendWizardLog('请先添加商品并勾选策略后再生成计划', 'error');
                            return;
                        }
                        const materializedStrategies = materializeStrategyListFromPlans(req.plans);
                        if (!materializedStrategies.length) {
                            appendWizardLog('当前矩阵组合未生成有效计划，请检查维度值', 'error');
                            return;
                        }
                        const draft = ensureWizardDraft();
                        draft.matrixConfig = normalizeMatrixConfig({
                            ...(isPlainObject(draft.matrixConfig) ? draft.matrixConfig : buildDefaultMatrixConfig()),
                            enabled: false
                        }, currentSceneName);
                        const existingStrategyList = Array.isArray(wizardState?.strategyList)
                            ? wizardState.strategyList
                            : [];
                        wizardState.strategyList = [...existingStrategyList, ...materializedStrategies];
                        wizardState.editingStrategyId = materializedStrategies[0]?.id || wizardState.strategyList[0]?.id || '';
                        if (wizardState.els.matrixEnabledInput instanceof HTMLInputElement) {
                            wizardState.els.matrixEnabledInput.checked = false;
                        }
                        setDetailVisible(false);
                        setWorkbenchPage('home');
                        commitStrategyUiState();
                        appendWizardLog(`已生成计划 ${materializedStrategies.length} 个，已追加到首页计划列表（共 ${wizardState.strategyList.length} 个）`, 'success');
                    } catch (err) {
                        appendWizardLog(`生成计划失败：${err?.message || err}`, 'error');
                    }
                });
            }
            if (wizardState.els.matrixClearBtn instanceof HTMLButtonElement) {
                wizardState.els.matrixClearBtn.addEventListener('click', () => {
                    clearMatrixDimensions();
                    appendWizardLog('已清空矩阵维度并关闭矩阵，可重新按推荐模板补齐', 'success');
                });
            }
            if (wizardState.els.matrixDimensionList instanceof HTMLElement) {
                wizardState.els.matrixDimensionList.addEventListener('click', (event) => {
                    const toggleBtn = event.target instanceof Element
                        ? event.target.closest('[data-matrix-dimension-picker-toggle="1"], [data-matrix-dimension-key-picker-toggle="1"], [data-matrix-bid-package-picker-toggle="1"]')
                        : null;
                    if (toggleBtn instanceof HTMLButtonElement) {
                        event.preventDefault();
                        const picker = toggleBtn.closest('[data-matrix-dimension-picker="1"]');
                        if (!(picker instanceof HTMLElement)) return;
                        const nextOpen = !picker.classList.contains('open');
                        closeMatrixDimensionPickers(wizardState.els.matrixDimensionList, picker);
                        setMatrixDimensionPickerOpen(picker, nextOpen);
                        return;
                    }
                    const bidPackageTargetOptionBtn = event.target instanceof Element
                        ? event.target.closest('[data-matrix-bid-package-target-option="1"]')
                        : null;
                    if (bidPackageTargetOptionBtn instanceof HTMLButtonElement) {
                        event.preventDefault();
                        const row = bidPackageTargetOptionBtn.closest('[data-matrix-dimension-row="1"]');
                        const packageRow = bidPackageTargetOptionBtn.closest('[data-matrix-bid-package-row="1"]');
                        const hiddenSelect = packageRow?.querySelector('[data-matrix-bid-package-target="1"]');
                        const nextValue = normalizeKeywordBidTargetOptionValue(
                            bidPackageTargetOptionBtn.getAttribute('data-value') || ''
                        );
                        if (!(row instanceof HTMLElement) || !(packageRow instanceof HTMLElement) || !(hiddenSelect instanceof HTMLSelectElement)) return;
                        if (!resolveMatrixBidTargetCostConfig(nextValue)) return;
                        hiddenSelect.value = nextValue;
                        const currentSceneName = getMatrixSceneName(wizardState?.draft?.sceneName || '');
                        syncMatrixDimensionMetaStateFromRow(row, currentSceneName);
                        syncMatrixConfigFromUI();
                        KeywordPlanWizardStore.persistDraft(wizardState.draft);
                        closeMatrixDimensionPickers(wizardState.els.matrixDimensionList);
                        if (!row.querySelector('[data-matrix-bid-package-row="1"].is-pending')) {
                            renderWorkbenchMatrixSummary();
                            refreshWizardPreview();
                        }
                        const activeRow = Array.from(row.querySelectorAll('[data-matrix-bid-package-row="1"]')).find((itemRow) => {
                            const targetSelect = itemRow.querySelector('[data-matrix-bid-package-target="1"]');
                            return normalizeKeywordBidTargetOptionValue(
                                targetSelect instanceof HTMLSelectElement ? targetSelect.value : ''
                            ) === nextValue;
                        }) || packageRow;
                        const costInput = Array.from(activeRow.querySelectorAll('[data-matrix-bid-package-cost="1"]')).slice(-1)[0];
                        if (costInput instanceof HTMLInputElement) {
                            costInput.focus({ preventScroll: true });
                        }
                        return;
                    }
                    const addBtn = event.target instanceof Element
                        ? event.target.closest('[data-matrix-dimension-add="1"]')
                        : null;
                    if (addBtn instanceof HTMLButtonElement) {
                        event.preventDefault();
                        closeMatrixDimensionPickers(wizardState.els.matrixDimensionList);
                        const nextPresetKey = String(addBtn.getAttribute('data-matrix-preset-key') || '').trim();
                        if (!nextPresetKey) return;
                        applyMatrixPreset(nextPresetKey);
                        const nextPreset = getMatrixDimensionPresetByKey(nextPresetKey, getMatrixSceneName(wizardState.draft?.sceneName || ''));
                        appendWizardLog(`已添加矩阵维度：${nextPreset?.label || nextPresetKey}`, 'success');
                        return;
                    }
                    const dimensionValueBatchAddBtn = event.target instanceof Element
                        ? event.target.closest('[data-matrix-dimension-value-batch-add="1"]')
                        : null;
                    if (dimensionValueBatchAddBtn instanceof HTMLButtonElement) {
                        event.preventDefault();
                        const row = dimensionValueBatchAddBtn.closest('[data-matrix-dimension-row="1"]');
                        const batchPicker = dimensionValueBatchAddBtn.closest('[data-matrix-dimension-picker="1"]');
                        if (!(row instanceof HTMLElement)) return;
                        const batchMenu = dimensionValueBatchAddBtn.closest('[data-matrix-dimension-value-batch-menu="1"]');
                        const intervalInput = batchMenu?.querySelector('[data-matrix-dimension-value-batch-interval="1"]');
                        const countInput = batchMenu?.querySelector('[data-matrix-dimension-value-batch-count="1"]');
                        const intervalValue = intervalInput instanceof HTMLInputElement ? intervalInput.value : '';
                        const countValue = countInput instanceof HTMLInputElement ? countInput.value : '';
                        const batchDraftState = getMatrixBatchDraftInputState(intervalValue, countValue);
                        if (!batchDraftState.hasValidInterval) {
                            if (intervalInput instanceof HTMLInputElement) {
                                intervalInput.focus({ preventScroll: true });
                            }
                            return;
                        }
                        if (!batchDraftState.hasValidCount) {
                            if (countInput instanceof HTMLInputElement) {
                                countInput.focus({ preventScroll: true });
                            }
                            return;
                        }
                        setMatrixDimensionValueBatchDraft(row, {
                            interval: intervalValue,
                            count: countValue
                        });
                        const insertedInputs = appendMatrixDimensionBatchValues(row, {
                            mode: 'batch',
                            interval: intervalValue,
                            count: countValue
                        });
                        closeMatrixDimensionPickers(wizardState.els.matrixDimensionList);
                        syncMatrixStructuredDimensionStateFromRow(row, getMatrixSceneName(wizardState?.draft?.sceneName || ''));
                        setMatrixDimensionPickerOpen(batchPicker, false);
                        commitPreviewUiState();
                        const focusInput = insertedInputs.slice(-1)[0];
                        if (focusInput instanceof HTMLInputElement) {
                            focusInput.focus({ preventScroll: true });
                        }
                        return;
                    }
                    const dimensionValueBatchManualBtn = event.target instanceof Element
                        ? event.target.closest('[data-matrix-dimension-value-batch-manual="1"]')
                        : null;
                    if (dimensionValueBatchManualBtn instanceof HTMLButtonElement) {
                        event.preventDefault();
                        const row = dimensionValueBatchManualBtn.closest('[data-matrix-dimension-row="1"]');
                        const batchPicker = dimensionValueBatchManualBtn.closest('[data-matrix-dimension-picker="1"]');
                        if (!(row instanceof HTMLElement)) return;
                        const insertedInputs = appendMatrixDimensionBatchValues(row, {
                            mode: 'manual'
                        });
                        closeMatrixDimensionPickers(wizardState.els.matrixDimensionList);
                        syncMatrixStructuredDimensionStateFromRow(row, getMatrixSceneName(wizardState?.draft?.sceneName || ''));
                        setMatrixDimensionPickerOpen(batchPicker, false);
                        commitPreviewUiState();
                        const focusInput = insertedInputs.slice(-1)[0];
                        if (focusInput instanceof HTMLInputElement) {
                            focusInput.focus({ preventScroll: true });
                        }
                        return;
                    }
                    const dimensionValueRemoveBtn = event.target instanceof Element
                        ? event.target.closest('[data-matrix-dimension-value-item-remove="1"]')
                        : null;
                    if (dimensionValueRemoveBtn instanceof HTMLButtonElement) {
                        event.preventDefault();
                        const row = dimensionValueRemoveBtn.closest('[data-matrix-dimension-row="1"]');
                        const valueItem = dimensionValueRemoveBtn.closest('[data-matrix-dimension-value-item="1"]');
                        const valueList = row?.querySelector('[data-matrix-dimension-value-list="1"]');
                        if (!(row instanceof HTMLElement) || !(valueItem instanceof HTMLElement) || !(valueList instanceof HTMLElement)) return;
                        const valueItems = Array.from(valueList.querySelectorAll('[data-matrix-dimension-value-item="1"]'));
                        if (valueItems.length > 1) {
                            valueItem.remove();
                        } else {
                            const valueInput = valueItem.querySelector('[data-matrix-dimension-value-item-input="1"]');
                            if (valueInput instanceof HTMLInputElement) {
                                valueInput.value = '';
                            }
                        }
                        syncMatrixStructuredDimensionStateFromRow(row, getMatrixSceneName(wizardState?.draft?.sceneName || ''));
                        commitPreviewUiState();
                        return;
                    }
                    const bidPackageBatchAddBtn = event.target instanceof Element
                        ? event.target.closest('[data-matrix-bid-package-batch-add="1"]')
                        : null;
                    if (bidPackageBatchAddBtn instanceof HTMLButtonElement) {
                        event.preventDefault();
                        const row = bidPackageBatchAddBtn.closest('[data-matrix-dimension-row="1"]');
                        const packageRow = bidPackageBatchAddBtn.closest('[data-matrix-bid-package-row="1"]');
                        const batchPicker = bidPackageBatchAddBtn.closest('[data-matrix-dimension-picker="1"]');
                        if (!(row instanceof HTMLElement) || !(packageRow instanceof HTMLElement)) return;
                        const batchMenu = bidPackageBatchAddBtn.closest('[data-matrix-bid-package-cost-batch-menu="1"]');
                        const intervalInput = batchMenu?.querySelector('[data-matrix-bid-package-batch-interval="1"]');
                        const countInput = batchMenu?.querySelector('[data-matrix-bid-package-batch-count="1"]');
                        const intervalValue = intervalInput instanceof HTMLInputElement ? intervalInput.value : '';
                        const countValue = countInput instanceof HTMLInputElement ? countInput.value : '';
                        const batchDraftState = getMatrixBatchDraftInputState(intervalValue, countValue);
                        if (!batchDraftState.hasValidInterval) {
                            if (intervalInput instanceof HTMLInputElement) {
                                intervalInput.focus({ preventScroll: true });
                            }
                            return;
                        }
                        if (!batchDraftState.hasValidCount) {
                            if (countInput instanceof HTMLInputElement) {
                                countInput.focus({ preventScroll: true });
                            }
                            return;
                        }
                        setMatrixBidTargetCostPackageBatchDraft(packageRow, {
                            interval: intervalValue,
                            count: countValue
                        });
                        const insertedInputs = appendMatrixBidTargetCostPackageBatchCosts(packageRow, {
                            mode: 'batch',
                            interval: intervalValue,
                            count: countValue
                        });
                        closeMatrixDimensionPickers(wizardState.els.matrixDimensionList);
                        syncMatrixBidTargetCostPackageStateFromRow(row);
                        setMatrixDimensionPickerOpen(batchPicker, false);
                        const focusInput = insertedInputs.slice(-1)[0];
                        syncMatrixConfigFromUI();
                        KeywordPlanWizardStore.persistDraft(wizardState.draft);
                        if (!row.querySelector('[data-matrix-bid-package-row="1"].is-pending')) {
                            renderWorkbenchMatrixSummary();
                            refreshWizardPreview();
                        }
                        if (focusInput instanceof HTMLInputElement) {
                            focusInput.focus({ preventScroll: true });
                        }
                        return;
                    }
                    const bidPackageBatchManualBtn = event.target instanceof Element
                        ? event.target.closest('[data-matrix-bid-package-batch-manual="1"]')
                        : null;
                    if (bidPackageBatchManualBtn instanceof HTMLButtonElement) {
                        event.preventDefault();
                        const row = bidPackageBatchManualBtn.closest('[data-matrix-dimension-row="1"]');
                        const packageRow = bidPackageBatchManualBtn.closest('[data-matrix-bid-package-row="1"]');
                        const batchPicker = bidPackageBatchManualBtn.closest('[data-matrix-dimension-picker="1"]');
                        if (!(row instanceof HTMLElement) || !(packageRow instanceof HTMLElement)) return;
                        const insertedInputs = appendMatrixBidTargetCostPackageBatchCosts(packageRow, {
                            mode: 'manual'
                        });
                        closeMatrixDimensionPickers(wizardState.els.matrixDimensionList);
                        syncMatrixBidTargetCostPackageStateFromRow(row);
                        setMatrixDimensionPickerOpen(batchPicker, false);
                        const focusInput = insertedInputs.slice(-1)[0];
                        if (focusInput instanceof HTMLInputElement) {
                            focusInput.focus({ preventScroll: true });
                        }
                        return;
                    }
                    const bidPackageCostAddBtn = event.target instanceof Element
                        ? event.target.closest('[data-matrix-bid-package-cost-add="1"]')
                        : null;
                    if (bidPackageCostAddBtn instanceof HTMLButtonElement) {
                        event.preventDefault();
                        const row = bidPackageCostAddBtn.closest('[data-matrix-dimension-row="1"]');
                        const packageRow = bidPackageCostAddBtn.closest('[data-matrix-bid-package-row="1"]');
                        const targetSelect = packageRow?.querySelector('[data-matrix-bid-package-target="1"]');
                        const costList = packageRow?.querySelector('[data-matrix-bid-package-cost-list="1"]');
                        if (!(row instanceof HTMLElement) || !(packageRow instanceof HTMLElement) || !(costList instanceof HTMLElement)) return;
                        const emptyCostInput = Array.from(packageRow.querySelectorAll('[data-matrix-bid-package-cost="1"]')).find((costInput) => (
                            !buildMatrixBidTargetCostPackageRowValue({
                                targetOptionValue: targetSelect instanceof HTMLSelectElement ? targetSelect.value : '',
                                costValue: costInput instanceof HTMLInputElement ? costInput.value : ''
                            })
                        ));
                        if (emptyCostInput instanceof HTMLInputElement) {
                            emptyCostInput.focus({ preventScroll: true });
                            return;
                        }
                        const targetOptionValue = normalizeKeywordBidTargetOptionValue(
                            targetSelect instanceof HTMLSelectElement ? targetSelect.value : ''
                        ) || getMatrixBidTargetCostPackageDefaultOption().value;
                        insertMatrixBidTargetCostPackageCostItemHtml(
                            costList,
                            bidPackageCostAddBtn,
                            buildMatrixBidTargetCostPackageCostItemHtml(
                                '',
                                targetOptionValue,
                                packageRow.querySelectorAll('[data-matrix-bid-package-cost-item="1"]').length
                            )
                        );
                        syncMatrixBidTargetCostPackageStateFromRow(row);
                        const insertedInput = Array.from(packageRow.querySelectorAll('[data-matrix-bid-package-cost="1"]')).slice(-1)[0];
                        if (insertedInput instanceof HTMLInputElement) {
                            insertedInput.focus({ preventScroll: true });
                        }
                        return;
                    }
                    const bidPackageSuggestBtn = event.target instanceof Element
                        ? event.target.closest('[data-matrix-bid-package-suggest="1"]')
                        : null;
                    if (bidPackageSuggestBtn instanceof HTMLButtonElement) {
                        event.preventDefault();
                        const row = bidPackageSuggestBtn.closest('[data-matrix-dimension-row="1"]');
                        const packageList = row?.querySelector('[data-matrix-bid-package-list="1"]');
                        if (!(row instanceof HTMLElement) || !(packageList instanceof HTMLElement)) return;
                        const nextValue = String(bidPackageSuggestBtn.getAttribute('data-matrix-bid-package-value') || '').trim();
                        const parsedValue = parseMatrixBidTargetCostPackageValue(nextValue);
                        if (!parsedValue) return;
                        const currentValueSet = new Set(readMatrixBidTargetCostPackageValuesFromRow(row));
                        if (currentValueSet.has(parsedValue.rawValue)) return;
                        const matchedRow = Array.from(packageList.querySelectorAll('[data-matrix-bid-package-row="1"]')).find((itemRow) => {
                            const targetSelect = itemRow.querySelector('[data-matrix-bid-package-target="1"]');
                            return normalizeKeywordBidTargetOptionValue(
                                targetSelect instanceof HTMLSelectElement ? targetSelect.value : ''
                            ) === parsedValue.targetOptionValue;
                        });
                        if (matchedRow instanceof HTMLElement) {
                            const emptyCostInput = Array.from(matchedRow.querySelectorAll('[data-matrix-bid-package-cost="1"]')).find((costInput) => (
                                !buildMatrixBidTargetCostPackageRowValue({
                                    targetOptionValue: parsedValue.targetOptionValue,
                                    costValue: costInput instanceof HTMLInputElement ? costInput.value : ''
                                })
                            ));
                            if (emptyCostInput instanceof HTMLInputElement) {
                                emptyCostInput.value = parsedValue.costValue;
                            } else {
                                const costAddBtn = matchedRow.querySelector('[data-matrix-bid-package-cost-add="1"]');
                                insertMatrixBidTargetCostPackageCostItemHtml(
                                    matchedRow.querySelector('[data-matrix-bid-package-cost-list="1"]'),
                                    costAddBtn,
                                    buildMatrixBidTargetCostPackageCostItemHtml(
                                        parsedValue.costValue,
                                        parsedValue.targetOptionValue,
                                        matchedRow.querySelectorAll('[data-matrix-bid-package-cost-item="1"]').length
                                    )
                                );
                            }
                        } else {
                            const emptyRow = Array.from(packageList.querySelectorAll('[data-matrix-bid-package-row="1"]')).find((itemRow) => {
                                const targetSelect = itemRow.querySelector('[data-matrix-bid-package-target="1"]');
                                const rowValues = Array.from(itemRow.querySelectorAll('[data-matrix-bid-package-cost="1"]'))
                                    .map((costInput) => buildMatrixBidTargetCostPackageRowValue({
                                        targetOptionValue: targetSelect instanceof HTMLSelectElement ? targetSelect.value : '',
                                        costValue: costInput instanceof HTMLInputElement ? costInput.value : ''
                                    }))
                                    .filter(Boolean);
                                return !rowValues.length;
                            });
                            if (emptyRow instanceof HTMLElement) {
                                const targetSelect = emptyRow.querySelector('[data-matrix-bid-package-target="1"]');
                                const costInputs = Array.from(emptyRow.querySelectorAll('[data-matrix-bid-package-cost="1"]'));
                                if (targetSelect instanceof HTMLSelectElement) targetSelect.value = parsedValue.targetOptionValue;
                                if (costInputs[0] instanceof HTMLInputElement) costInputs[0].value = parsedValue.costValue;
                            } else {
                                packageList.insertAdjacentHTML(
                                    'beforeend',
                                    buildMatrixBidTargetCostPackageRowHtml({
                                        targetOptionValue: parsedValue.targetOptionValue,
                                        targetLabel: parsedValue.targetLabel,
                                        costValues: [parsedValue.costValue]
                                    }, packageList.children.length)
                                );
                            }
                        }
                        syncMatrixBidTargetCostPackageStateFromRow(row);
                        commitPreviewUiState();
                        return;
                    }
                    const bidPackageCostRemoveBtn = event.target instanceof Element
                        ? event.target.closest('[data-matrix-bid-package-cost-remove="1"]')
                        : null;
                    if (bidPackageCostRemoveBtn instanceof HTMLButtonElement) {
                        event.preventDefault();
                        const row = bidPackageCostRemoveBtn.closest('[data-matrix-dimension-row="1"]');
                        const packageRow = bidPackageCostRemoveBtn.closest('[data-matrix-bid-package-row="1"]');
                        const packageList = row?.querySelector('[data-matrix-bid-package-list="1"]');
                        const costItem = bidPackageCostRemoveBtn.closest('[data-matrix-bid-package-cost-item="1"]');
                        if (!(row instanceof HTMLElement) || !(packageRow instanceof HTMLElement) || !(packageList instanceof HTMLElement) || !(costItem instanceof HTMLElement)) return;
                        const rowCostItems = Array.from(packageRow.querySelectorAll('[data-matrix-bid-package-cost-item="1"]'));
                        const packageRows = Array.from(packageList.querySelectorAll('[data-matrix-bid-package-row="1"]'));
                        if (rowCostItems.length > 1) {
                            costItem.remove();
                        } else if (packageRows.length > 1) {
                            packageRow.remove();
                        } else {
                            const costInput = costItem.querySelector('[data-matrix-bid-package-cost="1"]');
                            if (costInput instanceof HTMLInputElement) {
                                costInput.value = '';
                            }
                        }
                        syncMatrixBidTargetCostPackageStateFromRow(row);
                        commitPreviewUiState();
                        return;
                    }
                    const bidPackageRemoveBtn = event.target instanceof Element
                        ? event.target.closest('[data-matrix-bid-package-remove="1"]')
                        : null;
                    if (bidPackageRemoveBtn instanceof HTMLButtonElement) {
                        event.preventDefault();
                        const row = bidPackageRemoveBtn.closest('[data-matrix-dimension-row="1"]');
                        const packageRow = bidPackageRemoveBtn.closest('[data-matrix-bid-package-row="1"]');
                        const packageList = row?.querySelector('[data-matrix-bid-package-list="1"]');
                        if (!(row instanceof HTMLElement) || !(packageRow instanceof HTMLElement) || !(packageList instanceof HTMLElement)) return;
                        const packageRows = Array.from(packageList.querySelectorAll('[data-matrix-bid-package-row="1"]'));
                        if (packageRows.length <= 1) {
                            packageRow.outerHTML = buildMatrixBidTargetCostPackageRowHtml(buildMatrixBidTargetCostPackageRows([])[0], 0);
                        } else {
                            packageRow.remove();
                        }
                        syncMatrixBidTargetCostPackageStateFromRow(row);
                        commitPreviewUiState();
                        return;
                    }
                    const removeBtn = event.target instanceof Element
                        ? event.target.closest('[data-matrix-dimension-remove="1"]')
                        : null;
                    if (!(removeBtn instanceof Element)) return;
                    const row = removeBtn.closest('[data-matrix-dimension-row="1"]');
                    if (!(row instanceof HTMLElement)) return;
                    closeMatrixDimensionPickers(wizardState.els.matrixDimensionList);
                    row.remove();
                    commitPreviewUiState();
                });
                wizardState.els.matrixDimensionList.addEventListener('input', (event) => {
                    const row = event.target instanceof Element
                        ? event.target.closest('[data-matrix-dimension-row="1"]')
                        : null;
                    if (!(row instanceof HTMLElement)) return;
                    const currentSceneName = getMatrixSceneName(wizardState?.draft?.sceneName || '');
                    if (event.target instanceof HTMLInputElement && event.target.matches('[data-matrix-dimension-value-batch-interval="1"], [data-matrix-dimension-value-batch-count="1"]')) {
                        const intervalInput = row.querySelector('[data-matrix-dimension-value-batch-interval="1"]');
                        const countInput = row.querySelector('[data-matrix-dimension-value-batch-count="1"]');
                        setMatrixDimensionValueBatchDraft(row, {
                            interval: intervalInput instanceof HTMLInputElement ? intervalInput.value : '',
                            count: countInput instanceof HTMLInputElement ? countInput.value : ''
                        });
                        syncMatrixDimensionValueBatchSubmitState(row, currentSceneName);
                        return;
                    }
                    if (event.target instanceof HTMLInputElement && event.target.matches('[data-matrix-bid-package-batch-interval="1"], [data-matrix-bid-package-batch-count="1"]')) {
                        const packageRow = event.target.closest('[data-matrix-bid-package-row="1"]');
                        const batchMenu = event.target.closest('[data-matrix-bid-package-cost-batch-menu="1"]');
                        const intervalInput = batchMenu?.querySelector('[data-matrix-bid-package-batch-interval="1"]');
                        const countInput = batchMenu?.querySelector('[data-matrix-bid-package-batch-count="1"]');
                        setMatrixBidTargetCostPackageBatchDraft(packageRow, {
                            interval: intervalInput instanceof HTMLInputElement ? intervalInput.value : '',
                            count: countInput instanceof HTMLInputElement ? countInput.value : ''
                        });
                        syncMatrixBidPackageBatchSubmitState(packageRow);
                        return;
                    }
                    if (event.target instanceof HTMLInputElement && event.target.matches('[data-matrix-dimension-key-option="1"]')) {
                        return;
                    }
                    if (event.target instanceof HTMLInputElement && event.target.matches('[data-matrix-bid-package-target-option="1"]')) {
                        const packageRow = event.target.closest('[data-matrix-bid-package-row="1"]');
                        const hiddenSelect = packageRow?.querySelector('[data-matrix-bid-package-target="1"]');
                        if (hiddenSelect instanceof HTMLSelectElement) {
                            hiddenSelect.value = event.target.value;
                        }
                        syncMatrixDimensionMetaStateFromRow(row, currentSceneName);
                        syncMatrixConfigFromUI();
                        KeywordPlanWizardStore.persistDraft(wizardState.draft);
                        return;
                    }
                    if (event.target instanceof HTMLInputElement && event.target.matches('[data-matrix-dimension-value-option="1"]')) {
                        syncMatrixDimensionPickerStateFromRow(row);
                    } else {
                        syncMatrixDimensionMetaStateFromRow(row, currentSceneName);
                    }
                    syncMatrixConfigFromUI();
                    KeywordPlanWizardStore.persistDraft(wizardState.draft);
                });
                wizardState.els.matrixDimensionList.addEventListener('change', (event) => {
                    const row = event.target instanceof Element
                        ? event.target.closest('[data-matrix-dimension-row="1"]')
                        : null;
                    if (!(row instanceof HTMLElement)) return;
                    const currentSceneName = getMatrixSceneName(wizardState?.draft?.sceneName || '');
                    if (event.target instanceof HTMLInputElement && event.target.matches('[data-matrix-dimension-value-batch-interval="1"], [data-matrix-dimension-value-batch-count="1"]')) {
                        const intervalInput = row.querySelector('[data-matrix-dimension-value-batch-interval="1"]');
                        const countInput = row.querySelector('[data-matrix-dimension-value-batch-count="1"]');
                        setMatrixDimensionValueBatchDraft(row, {
                            interval: intervalInput instanceof HTMLInputElement ? intervalInput.value : '',
                            count: countInput instanceof HTMLInputElement ? countInput.value : ''
                        });
                        syncMatrixDimensionValueBatchSubmitState(row, currentSceneName);
                        return;
                    }
                    if (event.target instanceof HTMLInputElement && event.target.matches('[data-matrix-bid-package-batch-interval="1"], [data-matrix-bid-package-batch-count="1"]')) {
                        const packageRow = event.target.closest('[data-matrix-bid-package-row="1"]');
                        const batchMenu = event.target.closest('[data-matrix-bid-package-cost-batch-menu="1"]');
                        const intervalInput = batchMenu?.querySelector('[data-matrix-bid-package-batch-interval="1"]');
                        const countInput = batchMenu?.querySelector('[data-matrix-bid-package-batch-count="1"]');
                        setMatrixBidTargetCostPackageBatchDraft(packageRow, {
                            interval: intervalInput instanceof HTMLInputElement ? intervalInput.value : '',
                            count: countInput instanceof HTMLInputElement ? countInput.value : ''
                        });
                        syncMatrixBidPackageBatchSubmitState(packageRow);
                        return;
                    }
                    if (event.target instanceof HTMLInputElement && event.target.matches('[data-matrix-bid-package-target-option="1"]')) {
                        const packageRow = event.target.closest('[data-matrix-bid-package-row="1"]');
                        const hiddenSelect = packageRow?.querySelector('[data-matrix-bid-package-target="1"]');
                        if (hiddenSelect instanceof HTMLSelectElement) {
                            hiddenSelect.value = event.target.value;
                        }
                        syncMatrixDimensionMetaStateFromRow(row, currentSceneName);
                        syncMatrixConfigFromUI();
                        KeywordPlanWizardStore.persistDraft(wizardState.draft);
                        closeMatrixDimensionPickers(wizardState.els.matrixDimensionList);
                        if (row.querySelector('[data-matrix-bid-package-row="1"].is-pending')) return;
                        renderWorkbenchMatrixSummary();
                        refreshWizardPreview();
                        return;
                    }
                    if (event.target instanceof HTMLInputElement && event.target.matches('[data-matrix-bid-package-cost="1"]')) {
                        syncMatrixDimensionMetaStateFromRow(row, currentSceneName);
                        syncMatrixConfigFromUI();
                        KeywordPlanWizardStore.persistDraft(wizardState.draft);
                        if (row.querySelector('[data-matrix-bid-package-row="1"].is-pending')) return;
                        renderWorkbenchMatrixSummary();
                        refreshWizardPreview();
                        return;
                    }
                    if (event.target instanceof HTMLInputElement && event.target.matches('[data-matrix-dimension-key-option="1"]')) {
                        const nextKey = syncMatrixDimensionKeyPickerStateFromRow(row, currentSceneName);
                        const hiddenLabelInput = row.querySelector('[data-matrix-dimension-label="1"]');
                        if (hiddenLabelInput instanceof HTMLInputElement) {
                            const nextPreset = getMatrixDimensionPresetByKey(nextKey, currentSceneName);
                            hiddenLabelInput.value = String(nextPreset?.label || nextKey || '').trim();
                        }
                        syncMatrixConfigFromUI();
                        KeywordPlanWizardStore.persistDraft(wizardState.draft);
                        closeMatrixDimensionPickers(wizardState.els.matrixDimensionList);
                        renderWorkbenchMatrixSummary();
                        refreshWizardPreview();
                        return;
                    }
                    if (event.target instanceof HTMLInputElement && event.target.matches('[data-matrix-dimension-value-option="1"]')) {
                        syncMatrixDimensionPickerStateFromRow(row);
                    }
                    if (event.target instanceof HTMLSelectElement && event.target.matches('[data-matrix-dimension-key="1"]')) {
                        const hiddenLabelInput = row.querySelector('[data-matrix-dimension-label="1"]');
                        if (hiddenLabelInput instanceof HTMLInputElement) {
                            const nextPreset = getMatrixDimensionPresetByKey(String(event.target.value || '').trim(), currentSceneName);
                            hiddenLabelInput.value = String(nextPreset?.label || event.target.value || '').trim();
                        }
                        syncMatrixConfigFromUI();
                        KeywordPlanWizardStore.persistDraft(wizardState.draft);
                        closeMatrixDimensionPickers(wizardState.els.matrixDimensionList);
                        renderWorkbenchMatrixSummary();
                        refreshWizardPreview();
                        return;
                    }
                    syncMatrixDimensionMetaStateFromRow(row, currentSceneName);
                    commitPreviewUiState();
                });
            }
            wizardState.els.loadRecommendBtn.onclick = () => {
                loadRecommendedKeywords({ triggerSource: 'button_click' });
            };
            wizardState.els.loadCrowdBtn.onclick = () => {
                loadRecommendedCrowds();
            };
            wizardState.els.sceneSelect.onchange = () => {
                switchSceneFromEditor(wizardState.els.sceneSelect.value).catch(err => {
                    log.warn('切换场景失败:', err?.message || err);
                });
            };
            [wizardState.els.sceneSelect, wizardState.els.bidModeSelect, wizardState.els.bidTargetSelect, wizardState.els.budgetTypeSelect, wizardState.els.modeSelect]
                .forEach(select => {
                    if (!(select instanceof HTMLSelectElement)) return;
                    select.addEventListener('change', () => {
                        renderSelectOptionLine(select);
                    });
                });
            wizardState.els.clearCrowdBtn.onclick = () => {
                wizardState.crowdList = [];
                commitCrowdUiState();
                appendWizardLog('已清空人群设置');
            };
            if (wizardState.els.strategySearchInput instanceof HTMLInputElement) {
                wizardState.els.strategySearchInput.addEventListener('input', () => {
                    renderStrategyList();
                });
            }
            if (wizardState.els.strategySelectAllInput instanceof HTMLInputElement) {
                wizardState.els.strategySelectAllInput.addEventListener('change', handleSelectAllStrategies);
            }
            if (wizardState.els.batchEditStrategyBtn instanceof HTMLButtonElement) {
                wizardState.els.batchEditStrategyBtn.onclick = handleBatchEditStrategies;
            }
            if (wizardState.els.clearStrategyBtn instanceof HTMLButtonElement) {
                wizardState.els.clearStrategyBtn.onclick = clearSelectedStrategies;
            }
            (Array.isArray(wizardState.els.toggleDebugBtns) ? wizardState.els.toggleDebugBtns : [])
                .forEach(btn => {
                    if (!(btn instanceof HTMLButtonElement)) return;
                    btn.onclick = () => {
                        setDebugVisible(!wizardState.debugVisible);
                        commitSceneDynamicUiState({
                            syncSceneSettings: false,
                            renderSceneDynamic: true
                        });
                    };
                });

            const closeDetailDialog = () => {
                const editingStrategy = getStrategyById(wizardState.editingStrategyId);
                if (editingStrategy) {
                    pullDetailFormToStrategy(editingStrategy);
                }
                setDetailVisible(false);
                if (typeof wizardState.setWorkbenchPage === 'function') {
                    wizardState.setWorkbenchPage('home');
                }
                commitStrategyUiState();
            };
            wizardState.els.backSimpleBtn.onclick = closeDetailDialog;
            if (wizardState.els.detailCloseBtn) {
                wizardState.els.detailCloseBtn.onclick = closeDetailDialog;
            }
            if (wizardState.els.detailBackdrop) {
                wizardState.els.detailBackdrop.onclick = closeDetailDialog;
            }

            const handlePreview = () => {
                try {
                    const req = KeywordPlanRequestBuilder.buildRequestFromWizard();
                    KeywordPlanPreviewExecutor.renderPreview(req);
                    appendWizardLog(`预览已生成：${req.plans.length} 个计划`, 'success');
                } catch (err) {
                    appendWizardLog(`预览失败：${err?.message || err}`, 'error');
                }
            };
            wizardState.els.previewBtn.onclick = handlePreview;
            wizardState.els.previewQuickBtn.onclick = handleGenerateOtherStrategies;

            const handleRun = async () => {
                const req = KeywordPlanRequestBuilder.buildRequestFromWizard();
                if (!req.plans.length) {
                    appendWizardLog('请先添加商品并勾选策略后再创建', 'error');
                    return;
                }
                const planNameCheck = validatePlanNameUniqueness(req);
                if (!planNameCheck.ok) {
                    if (planNameCheck.duplicateInRequest.length) {
                        appendWizardLog(
                            `计划名校验失败：本次新建计划内存在重复 -> ${planNameCheck.duplicateInRequest.slice(0, 8).join('、')}`,
                            'error'
                        );
                    }
                    if (planNameCheck.duplicateWithExisting.length) {
                        appendWizardLog(
                            `计划名校验失败：与当前已有计划重名 -> ${planNameCheck.duplicateWithExisting.slice(0, 8).join('、')}`,
                            'error'
                        );
                    }
                    appendWizardLog('请修改计划名后再提交，当前已拦截提交', 'error');
                    if (wizardState.els.preview) {
                        wizardState.els.preview.textContent = JSON.stringify({
                            sceneName: req.sceneName,
                            blocked: true,
                            reason: 'duplicate_plan_name',
                            duplicateInRequest: planNameCheck.duplicateInRequest,
                            duplicateWithExisting: planNameCheck.duplicateWithExisting,
                            existingPlanNameCount: planNameCheck.existingPlanNameCount
                        }, null, 2);
                    }
                    return;
                }
                const sceneRequests = buildSceneRequestsFromWizard(req)
                    .filter(sceneReq => Array.isArray(sceneReq?.plans) && sceneReq.plans.length);
                if (!sceneRequests.length) {
                    appendWizardLog('未识别到可提交的场景计划，请检查策略场景设置', 'error');
                    return;
                }
                const runCount = req.plans.length || 0;
                KeywordPlanPreviewExecutor.renderPreview(req);
                const sceneSummaryText = sceneRequests.map(item => `${item.sceneName}×${item.plans.length}`).join('、');
                const submitMode = normalizeSubmitMode(wizardState?.draft?.submitMode || 'serial');
                const serialIntervalMs = Math.max(300, SERIAL_PLAN_SUBMIT_INTERVAL_MS);
                appendWizardLog(`开始批量创建 ${runCount} 个计划（${sceneSummaryText}，模式=${submitModeLabel(submitMode)}）...`);
                wizardState.els.runBtn.disabled = true;
                wizardState.els.runQuickBtn.disabled = true;
                if (wizardState.els.runModeToggleBtn instanceof HTMLButtonElement) {
                    wizardState.els.runModeToggleBtn.disabled = true;
                }
                setRunModeMenuOpen(false);
                const onRunProgress = ({ event, ...payload }) => {
                    const sceneTag = payload.sceneName ? `【${payload.sceneName}】` : '';
                    const fallbackPolicyText = ({
                        auto: '自动',
                        confirm: '确认',
                        none: '不降级'
                    })[String(payload.policy || '').trim()] || String(payload.policy || '-');
                    if (event === 'scene_runtime_sync_start') {
                        appendWizardLog(`${sceneTag}场景运行时同步：${payload.currentBizCode || '-'} -> ${payload.expectedBizCode || '-'}（${payload.sceneName || '未命名场景'}）`);
                    } else if (event === 'scene_runtime_synced') {
                        if (payload.matched === false) {
                            appendWizardLog(`${sceneTag}场景运行时同步结果不匹配：当前 ${payload.currentBizCode || '-'}，期望 ${payload.expectedBizCode || '-'}（${payload.sceneName || '未命名场景'}）`, 'error');
                        } else {
                            appendWizardLog(`${sceneTag}场景运行时已同步：${payload.currentBizCode || '-'}（${payload.sceneName || '未命名场景'}）`, 'success');
                        }
                    } else if (event === 'scene_runtime_sync_failed') {
                        appendWizardLog(`${sceneTag}场景运行时同步失败：${payload.error || '未知错误'}`, 'error');
                    } else if (event === 'scene_runtime_sync_abort') {
                        if (payload.error) {
                            appendWizardLog(`${sceneTag}场景运行时同步中止：${payload.error}`, 'error');
                        } else {
                            appendWizardLog(`${sceneTag}场景运行时同步中止：当前 ${payload.currentBizCode || '-'}，期望 ${payload.expectedBizCode || '-'}（${payload.sceneName || '未命名场景'}）`, 'error');
                        }
                    } else if (event === 'scene_runtime_sync_bypass') {
                        appendWizardLog(`${sceneTag}场景运行时不匹配，已按纯API模式继续：当前 ${payload.currentBizCode || '-'}，期望 ${payload.expectedBizCode || '-'}（${payload.sceneName || '未命名场景'}）`);
                    } else if (event === 'goal_resolution_warning') {
                        const warningList = Array.isArray(payload.warnings) ? payload.warnings : [];
                        if (warningList.length) {
                            warningList.slice(0, 5).forEach(msg => {
                                appendWizardLog(`${sceneTag}营销目标告警：${msg}`, 'error');
                            });
                        }
                    } else if (event === 'build_solution_item') {
                        appendWizardLog(`${sceneTag}组装计划：${payload.planName} (${payload.index}/${payload.total})`);
                    } else if (event === 'submit_batch_start') {
                        appendWizardLog(`${sceneTag}提交批次 ${payload.batchIndex}/${payload.batchTotal}，数量 ${payload.size}${payload.endpoint ? `，接口=${payload.endpoint}` : ''}`);
                    } else if (event === 'submit_batch_parallel_start') {
                        appendWizardLog(`${sceneTag}并发重复提交：计划=${payload.planName || '-'}，并发数=${payload.submitTimes || 1}${payload.endpoint ? `，接口=${payload.endpoint}` : ''}`);
                    } else if (event === 'submit_payload_snapshot') {
                        const campaignKeys = Array.isArray(payload.campaignKeys) ? payload.campaignKeys.join(',') : '';
                        const adgroupKeys = Array.isArray(payload.adgroupKeys) ? payload.adgroupKeys.join(',') : '';
                        appendWizardLog(`${sceneTag}提交预览：场景=${payload.sceneName || '-'} 目标=${payload.marketingGoal || '-'} 推广场景=${payload.promotionScene || '-'} 出价类型=${payload.bidTypeV2 || '-'} 出价目标=${payload.bidTargetV2 || '-'} 优化目标=${payload.optimizeTarget || '-'} 出价模式=${payload.bidMode || '-'} 提交接口=${payload.submitEndpoint || '-'} 商品ID=${payload.materialId || '-'} 关键词数=${payload.wordListCount || 0} 词包数=${payload.wordPackageCount || 0} 是否触发降级=${payload.fallbackTriggered ? '是' : '否'} 是否目标回退=${payload.goalFallbackUsed ? '是' : '否'} 计划字段=[${campaignKeys}] 单元字段=[${adgroupKeys}]`);
                    } else if (event === 'submit_batch_retry') {
                        appendWizardLog(`${sceneTag}批次重试 #${payload.attempt}：${payload.error}`, 'error');
                    } else if (event === 'submit_batch_success') {
                        if (payload.failedCount > 0) {
                            const duplicateSubmitError = /(请勿重复提交|重复提交|duplicate\s*submit)/i.test(String(payload.error || ''));
                            if (duplicateSubmitError) {
                                appendWizardLog(`${sceneTag}批次返回重复提交通知：成功 ${payload.createdCount}，失败 ${payload.failedCount}（汇总阶段会按同计划成功结果去重）`);
                            } else {
                                appendWizardLog(`${sceneTag}批次部分成功：成功 ${payload.createdCount}，失败 ${payload.failedCount}${payload.error ? `（${payload.error}）` : ''}`, 'error');
                            }
                        } else {
                            appendWizardLog(`${sceneTag}批次成功：${payload.createdCount} 个`, 'success');
                        }
                    } else if (event === 'fallback_downgrade_pending') {
                        const pendingText = payload.policy === 'auto'
                            ? '检测到词包校验失败，准备自动降级重试'
                            : '检测到词包校验失败，等待降级确认';
                        appendWizardLog(`${sceneTag}${pendingText}（批次 ${payload.batchIndex}，失败 ${payload.count}，策略=${fallbackPolicyText}）`, 'error');
                    } else if (event === 'fallback_downgrade_confirmed') {
                        appendWizardLog(`${sceneTag}用户确认降级重试（批次 ${payload.batchIndex}，数量 ${payload.count}${payload.auto ? '，自动策略' : ''}）`, 'success');
                    } else if (event === 'fallback_downgrade_canceled') {
                        appendWizardLog(`${sceneTag}用户取消降级（批次 ${payload.batchIndex}，数量 ${payload.count}）`, 'error');
                    } else if (event === 'fallback_downgrade_result') {
                        appendWizardLog(`${sceneTag}降级重试结果：成功${payload.successCount || 0}/失败${payload.failCount || 0}`, (payload.failCount || 0) > 0 ? 'error' : 'success');
                    } else if (event === 'submit_batch_fallback_single') {
                        appendWizardLog(`${sceneTag}${payload.fallbackTriggered ? '批次降级单计划重试' : '批次单计划重试'}：${payload.error}`, 'error');
                    } else if (event === 'conflict_resolve_start') {
                        appendWizardLog(`${sceneTag}检测到在投冲突，开始自动处理：计划=${payload.planName || '-'} 商品ID=${payload.itemId || '-'}（${payload.error || '冲突'}）`);
                    } else if (event === 'conflict_resolve_done') {
                        if (payload.resolved) {
                            const oneClickHint = payload.oneClickUsed ? '（一键处理）' : '';
                            appendWizardLog(`${sceneTag}冲突处理完成${oneClickHint}：已停用 ${payload.stoppedCount || 0} 个冲突计划，继续重试创建`, 'success');
                        } else {
                            const extra = payload.oneClickError ? `；一键处理=${payload.oneClickError}` : '';
                            appendWizardLog(`${sceneTag}冲突处理失败：已处理 ${payload.stoppedCount || 0}，未解决 ${payload.unresolvedCount || 0}${payload.error ? `（${payload.error}${extra}）` : (extra ? `（${extra.slice(1)}）` : '')}`, 'error');
                        }
                    }
                };
                const runSingleSceneTask = async (sceneReq = {}, sceneIdx = 0, total = 1) => {
                    const submitTimes = submitMode === 'serial'
                        ? 1
                        : Math.max(1, toNumber(sceneReq?.parallelSubmitTimes, 1));
                    appendWizardLog(
                        `${submitMode === 'serial' ? '场景单条提交' : '场景分组并发提交'} ${sceneIdx + 1}/${total}：${sceneReq.sceneName}（${sceneReq.plans.length} 个，提交=${submitModeLabel(submitMode)}）`
                    );
                    try {
                        const sceneResult = await createPlansByScene(sceneReq.sceneName, sceneReq, {
                            ...API_ONLY_CREATE_OPTIONS,
                            conflictPolicy: 'none',
                            batchRetry: 0,
                            disableFallbackSingleRetry: true,
                            parallelSubmitTimes: submitTimes,
                            onProgress: ({ event, ...payload }) => {
                                onRunProgress({
                                    event,
                                    ...payload,
                                    sceneName: payload.sceneName || sceneReq.sceneName
                                });
                            }
                        });
                        return {
                            sceneIdx,
                            sceneReq,
                            sceneResult
                        };
                    } catch (sceneErr) {
                        return {
                            sceneIdx,
                            sceneReq,
                            sceneErrorText: sceneErr?.message || String(sceneErr)
                        };
                    }
                };
                try {
                    const result = {
                        ok: true,
                        partial: false,
                        successCount: 0,
                        failCount: 0,
                        successes: [],
                        failures: [],
                        byScene: []
                    };
                    let sceneTaskResults = [];
                    if (submitMode === 'serial') {
                        for (let sceneIdx = 0; sceneIdx < sceneRequests.length; sceneIdx++) {
                            const sceneReq = sceneRequests[sceneIdx];
                            const taskResult = await runSingleSceneTask(sceneReq, sceneIdx, sceneRequests.length);
                            sceneTaskResults.push(taskResult);
                            if (sceneIdx < sceneRequests.length - 1) {
                                appendWizardLog(`单条模式间隔 ${Math.round(serialIntervalMs / 100) / 10} 秒后继续下一个计划...`);
                                await sleep(serialIntervalMs);
                            }
                        }
                    } else {
                        const sceneTasks = sceneRequests.map((sceneReq, sceneIdx) => (
                            runSingleSceneTask(sceneReq, sceneIdx, sceneRequests.length)
                        ));
                        sceneTaskResults = await Promise.all(sceneTasks);
                    }
                    sceneTaskResults
                        .sort((a, b) => toNumber(a?.sceneIdx, 0) - toNumber(b?.sceneIdx, 0))
                        .forEach(taskResult => {
                            const sceneReq = taskResult?.sceneReq || {};
                            const sceneResult = taskResult?.sceneResult;
                            const sceneErrorText = String(taskResult?.sceneErrorText || '').trim();
                            if (sceneErrorText) {
                                const fallbackFailCount = Math.max(1, sceneReq.plans?.length || 0);
                                result.ok = false;
                                result.failCount += fallbackFailCount;
                                result.failures.push({
                                    sceneName: sceneReq.sceneName,
                                    error: sceneErrorText
                                });
                                result.byScene.push({
                                    sceneName: sceneReq.sceneName,
                                    planCount: sceneReq.plans?.length || 0,
                                    ok: false,
                                    successCount: 0,
                                    failCount: fallbackFailCount
                                });
                                appendWizardLog(`场景 ${sceneReq.sceneName} 创建异常：${sceneErrorText}`, 'error');
                                return;
                            }
                            result.byScene.push({
                                sceneName: sceneReq.sceneName,
                                planCount: sceneReq.plans?.length || 0,
                                ok: !!sceneResult?.ok,
                                successCount: toNumber(sceneResult?.successCount, 0),
                                failCount: toNumber(sceneResult?.failCount, 0)
                            });
                            result.successCount += toNumber(sceneResult?.successCount, 0);
                            result.failCount += toNumber(sceneResult?.failCount, 0);
                            if (Array.isArray(sceneResult?.successes) && sceneResult.successes.length) {
                                result.successes.push(...sceneResult.successes);
                            }
                            if (Array.isArray(sceneResult?.failures) && sceneResult.failures.length) {
                                result.failures.push(...sceneResult.failures.map(item => ({
                                    ...item,
                                    sceneName: item?.sceneName || sceneReq.sceneName
                                })));
                            }
                            if (!sceneResult?.ok) {
                                result.ok = false;
                            }
                        });
                    const DUPLICATE_SUBMIT_ERROR_RE = /(请勿重复提交|重复提交|duplicate\s*submit)/i;
                    if (result.failures.length && result.successes.length) {
                        const successPlanNameSet = new Set(
                            result.successes
                                .map(item => String(item?.planName || '').trim())
                                .filter(Boolean)
                        );
                        if (successPlanNameSet.size) {
                            const beforeFailCount = result.failures.length;
                            result.failures = result.failures.filter((item) => {
                                const planName = String(item?.planName || '').trim();
                                const errorText = String(item?.error || '').trim();
                                if (!planName || !errorText) return true;
                                if (!successPlanNameSet.has(planName)) return true;
                                return !DUPLICATE_SUBMIT_ERROR_RE.test(errorText);
                            });
                            const removedFailCount = beforeFailCount - result.failures.length;
                            if (removedFailCount > 0) {
                                result.failCount = Math.max(0, result.failCount - removedFailCount);
                                appendWizardLog(`检测到 ${removedFailCount} 条重复提交通知已由同计划成功覆盖，已按成功结果去重`, 'success');
                            }
                        }
                    }
                    result.ok = result.failCount === 0;
                    result.partial = result.successCount > 0 && result.failCount > 0;
                    appendWizardLog(`完成：成功 ${result.successCount}，失败 ${result.failCount}`, result.ok ? 'success' : 'error');
                    if (result.failures.length) {
                        result.failures.slice(0, 3).forEach(item => {
                            appendWizardLog(`失败明细：${item.planName || '-'} -> ${item.error || '未知错误'}`, 'error');
                        });
                    }
                } catch (err) {
                    appendWizardLog(`创建异常：${err?.message || err}`, 'error');
                } finally {
                    wizardState.els.runBtn.disabled = false;
                    wizardState.els.runQuickBtn.disabled = false;
                    if (wizardState.els.runModeToggleBtn instanceof HTMLButtonElement) {
                        wizardState.els.runModeToggleBtn.disabled = false;
                    }
                }
            };
            wizardState.els.runBtn.onclick = handleRun;
            wizardState.els.runQuickBtn.onclick = handleRun;
            if (wizardState.els.addStrategyBtn) {
                wizardState.els.addStrategyBtn.onclick = () => {
                    addNewStrategy();
                };
            }
            wizardState.els.clearDraftBtn.onclick = () => {
                KeywordPlanWizardStore.clearSessionDraft();
                wizardState.draft = KeywordPlanWizardStore.resetWizardDraft({
                    sceneName: '关键词推广'
                });
                wizardState.addedItems = [];
                wizardState.crowdList = [];
                wizardState.candidates = [];
                wizardState.keywordMetricMap = {};
                wizardState.repairRunToken = toNumber(wizardState.repairRunToken, 0) + 1;
                wizardState.repairRunning = false;
                wizardState.repairStopRequested = false;
                wizardState.repairLastSummary = null;
                setRepairControlState(false);
                setRepairStatusText('场景=- 用例=0/0 通过=0 修复=0 失败=0 删除=0 停止=0');
                KeywordPlanPreviewExecutor.renderWizardFromState({ clearLogs: true });
                appendWizardLog('已清空会话草稿');
            };
            [wizardState.els.budgetInput, wizardState.els.bidInput, wizardState.els.bidModeSelect, wizardState.els.modeSelect, wizardState.els.recommendCountInput, wizardState.els.manualInput, wizardState.els.bidTargetSelect, wizardState.els.budgetTypeSelect, wizardState.els.singleCostEnableInput, wizardState.els.singleCostInput]
                .forEach(el => {
                    if (!el) return;
                    el.addEventListener('input', syncDraftFromUI);
                    el.addEventListener('change', syncDraftFromUI);
                });
            if (wizardState.els.manualInput) {
                const syncManualPanelIfStale = () => {
                    if (!wizardState.detailVisible) return;
                    if (getCurrentEditorSceneName() !== '关键词推广') return;
                    const panel = wizardState.els.sceneDynamic?.querySelector?.('[data-manual-keyword-panel]');
                    if (!(panel instanceof Element)) return;
                    const hiddenInput = resolveManualKeywordHiddenInput(panel);
                    const manualText = String(wizardState.els.manualInput.value || '').trim();
                    const hiddenText = String(hiddenInput?.value || '').trim();
                    if (manualText === hiddenText) return;
                    renderSceneDynamicConfig();
                };
                wizardState.els.manualInput.addEventListener('input', syncManualPanelIfStale);
                wizardState.els.manualInput.addEventListener('change', syncManualPanelIfStale);
            }
            if (wizardState.els.prefixInput) {
                const syncPlanNameToStrategyList = () => {
                    commitStrategyUiState({ refreshPreview: false });
                };
                wizardState.els.prefixInput.addEventListener('input', syncPlanNameToStrategyList);
                wizardState.els.prefixInput.addEventListener('change', syncPlanNameToStrategyList);
            }
            wizardState.els.budgetInput.addEventListener('change', renderStrategyList);
            wizardState.els.bidTargetSelect.addEventListener('change', () => {
                commitStrategyUiState();
            });
            wizardState.els.bidModeSelect.addEventListener('change', () => {
                updateBidModeControls(wizardState.els.bidModeSelect.value);
                const currentSceneName = getCurrentEditorSceneName();
                if (currentSceneName === '关键词推广') {
                    const nextMode = normalizeBidMode(wizardState.els.bidModeSelect.value || 'smart', 'smart');
                    const sceneBucket = ensureSceneSettingBucket(currentSceneName);
                    const touchedBucket = ensureSceneTouchedBucket(currentSceneName);
                    const goalFieldKey = normalizeSceneFieldKey('营销目标');
                    const schemeFieldKey = normalizeSceneFieldKey('选择卡位方案');
                    const currentGoal = detectKeywordGoalFromText(
                        sceneBucket.营销目标 || sceneBucket.选择卡位方案 || ''
                    );
                    if (!currentGoal) {
                        const fallbackSmartGoal = detectKeywordGoalFromBidTarget(
                            wizardState.els.bidTargetSelect?.value || wizardState.draft?.bidTargetV2 || DEFAULTS.bidTargetV2
                        ) || (nextMode === 'manual' ? '自定义推广' : '趋势明星');
                        sceneBucket.营销目标 = fallbackSmartGoal;
                        if (sceneBucket.选择卡位方案 !== undefined) {
                            sceneBucket.选择卡位方案 = fallbackSmartGoal;
                        }
                        touchedBucket[goalFieldKey] = false;
                        touchedBucket[schemeFieldKey] = false;
                    }
                    renderSceneDynamicConfig();
                }
                commitStrategyUiState();
            });
            wizardState.els.singleCostEnableInput.addEventListener('change', () => {
                wizardState.els.singleCostInput.disabled = !wizardState.els.singleCostEnableInput.checked;
                commitDraftState();
            });

            Object.assign(KeywordPlanCoreUtils, {
                buildDefaultMatrixConfig,
                normalizeMatrixConfig,
                normalizeMatrixBindingKey,
                buildMatrixCombinations,
                applyMatrixCombinationBindingsToPlan,
                materializePlansFromMatrix,
                splitMatrixBatches
            });
            Object.assign(KeywordPlanRuntime, {
                getDefaultStrategyList,
                buildSceneProfiles,
                loadCandidates,
                loadRecommendedKeywords,
                loadRecommendedCrowds,
                prepareWizardStateForOpen: (storedDraft = {}) => prepareWizardStateForOpen(storedDraft),
                applyRuntimeToDraft: (runtime = {}, sceneName = '') => applyRuntimeToDraft(runtime, sceneName),
                refreshSceneSelect: () => refreshSceneSelect(),
                commitStrategyUiState: (options = {}) => commitStrategyUiState(options),
                commitCrowdUiState: (options = {}) => commitCrowdUiState(options),
                commitSceneDynamicUiState: (options = {}) => commitSceneDynamicUiState(options),
                commitItemSelectionUiState: (options = {}) => commitItemSelectionUiState(options),
                commitPreviewUiState: (options = {}) => commitPreviewUiState(options),
                commitDraftState: (draft = null) => commitDraftState(draft),
                normalizeDraftForUi: (draft = {}) => normalizeDraftForUi(draft),
                applyDraftStateToWizard: (draft = {}) => applyDraftStateToWizard(draft),
                applyDraftValuesToControls: (draft = {}) => applyDraftValuesToControls(draft),
                renderWizardFromState: (options = {}) => renderWizardFromState(options)
            });
            Object.assign(KeywordPlanSceneSpec, {
                buildSceneSettingsPayload,
                normalizeSceneSettingsObject
            });
            Object.assign(KeywordPlanWizardStore, {
                readSessionDraft,
                saveSessionDraft,
                clearSessionDraft,
                wizardDefaultDraft,
                createWizardDraft,
                resetWizardDraft,
                hydrateWizardDraftForOpen: (storedDraft = {}) => hydrateWizardDraftForOpen(storedDraft),
                ensureWizardDraft: () => ensureWizardDraft(),
                persistDraft: (draft = null) => persistWizardDraft(draft),
                syncDraftSceneIdentity: (draft, editingStrategy = null) => syncDraftSceneIdentity(draft, editingStrategy),
                syncDraftGlobalDefaults: (draft, enabled = false) => syncDraftGlobalDefaults(draft, enabled),
                syncDraftViewState: (draft) => syncDraftViewState(draft),
                syncDraftMetaState: (draft) => syncDraftMetaState(draft)
            });
            Object.assign(KeywordPlanRequestBuilder, {
                buildRequestFromWizard: () => buildRequestFromWizard()
            });
            Object.assign(KeywordPlanPreviewExecutor, {
                renderPreview: (request) => renderPreview(request),
                renderWorkbenchMatrixSummary: (request = null) => renderWorkbenchMatrixSummary(request),
                renderPreviewSummaryPanel: (request = null) => renderPreviewSummaryPanel(request),
                refreshWizardPreview: () => refreshWizardPreview(),
                renderWizardFromState: (options = {}) => renderWizardFromState(options)
            });

            wizardState.renderStrategyList = renderStrategyList;
            wizardState.openStrategyDetail = openStrategyDetail;
            wizardState.renderCandidateList = renderCandidateList;
            wizardState.renderAddedList = renderAddedList;
            wizardState.renderCrowdList = renderCrowdList;
            wizardState.loadCandidates = KeywordPlanRuntime.loadCandidates;
            wizardState.loadRecommendedKeywords = KeywordPlanRuntime.loadRecommendedKeywords;
            wizardState.loadRecommendedCrowds = KeywordPlanRuntime.loadRecommendedCrowds;
            wizardState.applyRuntimeToDraft = KeywordPlanRuntime.applyRuntimeToDraft;
            wizardState.refreshSceneSelect = KeywordPlanRuntime.refreshSceneSelect;
            wizardState.setCandidateSource = setCandidateSource;
            wizardState.setWorkbenchPage = setWorkbenchPage;
            wizardState.setDebugVisible = setDebugVisible;
            wizardState.setItemSplitExpanded = setItemSplitExpanded;
            wizardState.setCandidateListExpanded = setCandidateListExpanded;
            wizardState.fillUIFromDraft = fillUIFromDraft;
            wizardState.appendWizardLog = appendWizardLog;
            wizardState.renderPreview = KeywordPlanPreviewExecutor.renderPreview;
            wizardState.renderWorkbenchMatrixSummary = KeywordPlanPreviewExecutor.renderWorkbenchMatrixSummary;
            wizardState.renderPreviewSummaryPanel = KeywordPlanPreviewExecutor.renderPreviewSummaryPanel;
            wizardState.renderWizardPreview = KeywordPlanPreviewExecutor.refreshWizardPreview;
            wizardState.renderWizardFromState = KeywordPlanPreviewExecutor.renderWizardFromState;
            wizardState.buildRequest = KeywordPlanRequestBuilder.buildRequestFromWizard;
            wizardState.keywordPlanCoreUtils = KeywordPlanCoreUtils;
            wizardState.keywordPlanRuntime = KeywordPlanRuntime;
            wizardState.keywordPlanSceneSpec = KeywordPlanSceneSpec;
            wizardState.keywordPlanWizardStore = KeywordPlanWizardStore;
            wizardState.refreshSceneProfileFromSpec = refreshSceneProfileFromSpec;
            wizardState.ensureSceneDefaultItemForSceneImpl = ensureSceneDefaultItemForSceneImpl;
            wizardState.syncNativeCrowdDefaultsForSceneImpl = syncNativeCrowdDefaultsForSceneImpl;
            wizardState.ensureSceneDefaultItemForScene = ensureSceneDefaultItemForScene;
            wizardState.syncNativeCrowdDefaultsForScene = syncNativeCrowdDefaultsForScene;
            setRepairControlState(false);
            setRepairStatusText('场景=- 用例=0/0 通过=0 修复=0 失败=0 删除=0 停止=0');
            wizardState.mounted = true;
        };
