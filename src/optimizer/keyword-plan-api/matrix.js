        const applyMatrixPreset = (presetKey = '') => {
            const draft = ensureWizardDraft();
            const currentSceneName = getMatrixSceneName(draft.sceneName || '');
            const nextMatrixConfig = normalizeMatrixConfig(draft.matrixConfig, currentSceneName);
            if (!currentSceneName) {
                nextMatrixConfig.enabled = false;
                draft.matrixConfig = nextMatrixConfig;
                KeywordPlanWizardStore.persistDraft(draft);
                if (typeof KeywordPlanPreviewExecutor.renderWorkbenchMatrixSummary === 'function') {
                    KeywordPlanPreviewExecutor.renderWorkbenchMatrixSummary();
                }
                if (typeof KeywordPlanPreviewExecutor.refreshWizardPreview === 'function') {
                    KeywordPlanPreviewExecutor.refreshWizardPreview();
                }
                return nextMatrixConfig;
            }
            let insertedPresetKey = '';
            if (!nextMatrixConfig.dimensions.some(item => item.key === presetKey)) {
                const nextDimension = buildMatrixDimensionDraft(presetKey, {
                    sceneName: currentSceneName,
                    itemList: wizardState.addedItems
                });
                if (nextDimension) {
                    nextMatrixConfig.dimensions.push(nextDimension);
                    insertedPresetKey = nextDimension.key;
                }
            }
            nextMatrixConfig.enabled = nextMatrixConfig.dimensions.length > 0;
            draft.matrixConfig = nextMatrixConfig;
            if (wizardState.els?.matrixEnabledInput instanceof HTMLInputElement) {
                wizardState.els.matrixEnabledInput.checked = nextMatrixConfig.enabled === true;
            }
            KeywordPlanWizardStore.persistDraft(draft);
            if (typeof KeywordPlanPreviewExecutor.renderWorkbenchMatrixSummary === 'function') {
                KeywordPlanPreviewExecutor.renderWorkbenchMatrixSummary();
            }
            if (typeof KeywordPlanPreviewExecutor.refreshWizardPreview === 'function') {
                KeywordPlanPreviewExecutor.refreshWizardPreview();
            }
            scrollMatrixDimensionRowIntoView(insertedPresetKey || presetKey);
            return nextMatrixConfig;
        };

        const applyMatrixPresetBundle = (presetKeys = [], options = {}) => {
            const draft = ensureWizardDraft();
            const currentSceneName = getMatrixSceneName(draft.sceneName || '');
            const nextMatrixConfig = normalizeMatrixConfig(draft.matrixConfig, currentSceneName);
            if (!currentSceneName) {
                nextMatrixConfig.enabled = false;
                draft.matrixConfig = nextMatrixConfig;
                KeywordPlanWizardStore.persistDraft(draft);
                if (typeof KeywordPlanPreviewExecutor.renderWorkbenchMatrixSummary === 'function') {
                    KeywordPlanPreviewExecutor.renderWorkbenchMatrixSummary();
                }
                if (typeof KeywordPlanPreviewExecutor.refreshWizardPreview === 'function') {
                    KeywordPlanPreviewExecutor.refreshWizardPreview();
                }
                return nextMatrixConfig;
            }
            const orderedKeys = uniqueBy(
                (Array.isArray(presetKeys) ? presetKeys : [presetKeys])
                    .map(item => String(item || '').trim())
                    .filter(Boolean),
                item => item
            );
            const insertedKeys = [];
            orderedKeys.forEach((presetKey) => {
                if (nextMatrixConfig.dimensions.some(item => item.key === presetKey)) return;
                const nextDimension = buildMatrixDimensionDraft(presetKey, {
                    sceneName: currentSceneName,
                    itemList: wizardState.addedItems
                });
                if (!nextDimension) return;
                nextMatrixConfig.dimensions.push(nextDimension);
                insertedKeys.push(nextDimension.key);
            });
            nextMatrixConfig.enabled = nextMatrixConfig.dimensions.length > 0;
            draft.matrixConfig = nextMatrixConfig;
            if (wizardState.els?.matrixEnabledInput instanceof HTMLInputElement) {
                wizardState.els.matrixEnabledInput.checked = nextMatrixConfig.enabled === true;
            }
            KeywordPlanWizardStore.persistDraft(draft);
            if (typeof KeywordPlanPreviewExecutor.renderWorkbenchMatrixSummary === 'function') {
                KeywordPlanPreviewExecutor.renderWorkbenchMatrixSummary();
            }
            if (typeof KeywordPlanPreviewExecutor.refreshWizardPreview === 'function') {
                KeywordPlanPreviewExecutor.refreshWizardPreview();
            }
            const focusKey = String(options?.focusKey || insertedKeys[insertedKeys.length - 1] || orderedKeys[orderedKeys.length - 1] || '').trim();
            scrollMatrixDimensionRowIntoView(focusKey);
            return nextMatrixConfig;
        };

        const clearMatrixDimensions = (options = {}) => {
            const draft = ensureWizardDraft();
            const nextMatrixConfig = normalizeMatrixConfig(draft.matrixConfig, getMatrixSceneName(draft.sceneName || ''));
            nextMatrixConfig.dimensions = [];
            nextMatrixConfig.enabled = false;
            draft.matrixConfig = nextMatrixConfig;
            if (wizardState.els?.matrixEnabledInput instanceof HTMLInputElement) {
                wizardState.els.matrixEnabledInput.checked = false;
            }
            KeywordPlanWizardStore.persistDraft(draft);
            if (typeof KeywordPlanPreviewExecutor.renderWorkbenchMatrixSummary === 'function') {
                KeywordPlanPreviewExecutor.renderWorkbenchMatrixSummary();
            }
            if (typeof KeywordPlanPreviewExecutor.refreshWizardPreview === 'function') {
                KeywordPlanPreviewExecutor.refreshWizardPreview();
            }
            return nextMatrixConfig;
        };

        const buildMatrixCombinations = (matrixConfig = {}, options = {}) => {
            const config = normalizeMatrixConfig(matrixConfig, options?.sceneName || '');
            if (config.enabled !== true) return [];
            const activeDimensions = config.dimensions.filter(item => item.enabled !== false && item.values.length);
            if (!activeDimensions.length) return [];
            const combinations = [];
            const visit = (depth, current) => {
                if (depth >= activeDimensions.length) {
                    combinations.push({
                        index: combinations.length + 1,
                        values: current.slice(),
                        labels: current.map(item => item.label)
                    });
                    return;
                }
                const dimension = activeDimensions[depth];
                dimension.values.forEach((value) => {
                    const rawValue = String(value || '').trim();
                    visit(depth + 1, current.concat([{
                        key: dimension.key,
                        value: rawValue,
                        label: buildMatrixCombinationValueLabel(dimension, rawValue, config.sceneName || options?.sceneName || ''),
                        dimensionLabel: dimension.label || dimension.key
                    }]));
                });
            };
            visit(0, []);
            return combinations;
        };

        const buildMatrixPreviewStats = (matrixConfig = {}, options = {}) => {
            const sceneName = String(options?.sceneName || '').trim();
            const config = normalizeMatrixConfig(matrixConfig, sceneName);
            const activeDimensions = config.dimensions.filter(item => item.enabled !== false && item.values.length);
            const combinations = buildMatrixCombinations(config, { sceneName });
            const strategyCount = Math.max(0, toNumber(options?.strategyCount, 0));
            const itemCount = Math.max(0, toNumber(options?.itemCount, 0));
            const basePlanCount = strategyCount > 0 && itemCount > 0
                ? strategyCount * itemCount
                : Math.max(0, toNumber(options?.basePlanCount, 0));
            return {
                config,
                activeDimensions,
                combinations,
                basePlanCount,
                expandedPlanCount: combinations.length ? basePlanCount * combinations.length : basePlanCount,
                sampleLabels: combinations.slice(0, 6).map(item => item.labels.join(' / '))
            };
        };

        const applyMatrixNamingPattern = (pattern = MATRIX_DEFAULT_NAMING_PATTERN, plan = {}, combination = {}, index = 0) => {
            const template = String(pattern || MATRIX_DEFAULT_NAMING_PATTERN).trim() || MATRIX_DEFAULT_NAMING_PATTERN;
            const basePlanName = String(plan?.planName || '').trim();
            const comboLabel = Array.isArray(combination?.labels) ? combination.labels.join('_') : '';
            return template
                .replace(/\{planName\}/g, basePlanName)
                .replace(/\{combo\}/g, comboLabel)
                .replace(/\{index\}/g, String(index + 1).padStart(2, '0'))
                .trim();
        };

        const normalizeMatrixBindingKey = (key = '') => {
            const rawKey = String(key || '').trim();
            if (isMatrixSceneFieldBindingKey(rawKey)) {
                const sceneFieldKey = normalizeSceneFieldKey(rawKey.slice(MATRIX_SCENE_FIELD_KEY_PREFIX.length));
                return sceneFieldKey ? `${MATRIX_SCENE_FIELD_KEY_PREFIX}${sceneFieldKey}` : '';
            }
            const normalized = normalizeText(String(key || '').replace(/[：:]/g, ''));
            const compact = normalized.replace(/[\s_-]+/g, '').toLowerCase();
            if (!compact) return '';
            if (compact === 'budget' || compact === '预算' || compact === '预算值') return 'budget';
            if (compact === 'daybudget' || compact === '每日预算') return 'day_budget';
            if (compact === 'dayaveragebudget' || compact === '日均预算') return 'day_average_budget';
            if (compact === 'bidmode' || compact === '出价方式') return 'bid_mode';
            if (compact === 'bidtarget' || compact === '出价目标' || compact === '优化目标') return 'bid_target';
            if (
                compact === 'bidtargetcostpackage'
                || compact === 'bidtargetcost'
                || compact === '出价目标目标成本'
                || compact === '出价目标+目标值'
                || compact === '智能出价目标包'
            ) return 'bid_target_cost_package';
            if (compact === 'planprefix' || compact === '计划名前缀' || compact === '前缀') return 'plan_prefix';
            if (
                compact === 'materialid'
                || compact === 'material'
                || compact === 'item'
                || compact === 'itemid'
                || compact === '商品'
                || compact === '商品id'
            ) return 'material_id';
            return '';
        };

        const parseMatrixNumericValue = (value = '') => {
            const text = String(value || '').replace(/,/g, '').trim();
            const parsed = Number(text);
            return Number.isFinite(parsed) ? parsed : NaN;
        };

        const resolveMatrixBudgetField = (plan = {}, bindingKey = '') => {
            if (bindingKey === 'day_budget') return 'dayBudget';
            if (bindingKey === 'day_average_budget') return 'dayAverageBudget';
            const planBudget = isPlainObject(plan?.budget) ? plan.budget : {};
            if (planBudget.dayBudget !== undefined && planBudget.dayBudget !== null && planBudget.dayBudget !== '') {
                return 'dayBudget';
            }
            if (planBudget.dayAverageBudget !== undefined && planBudget.dayAverageBudget !== null && planBudget.dayAverageBudget !== '') {
                return 'dayAverageBudget';
            }
            return 'dayAverageBudget';
        };

        const resolveMatrixBoundItem = (value = '', itemList = []) => {
            const materialId = String(toIdValue(value)).trim();
            if (!/^\d{4,}$/.test(materialId)) return null;
            const matched = (Array.isArray(itemList) ? itemList : []).find(item => (
                materialId === String(toIdValue(item?.materialId || item?.itemId || '')).trim()
            ));
            return matched ? normalizeItem(matched) : null;
        };

        const applyMatrixDimensionBindingToPlan = (plan = {}, dimensionValue = {}, options = {}) => {
            if (!isPlainObject(plan) || !isPlainObject(dimensionValue)) return plan;
            const bindingKey = normalizeMatrixBindingKey(dimensionValue.key || dimensionValue.dimensionLabel || '');
            const rawValue = normalizeText(dimensionValue.value || dimensionValue.label || '');
            const planSceneName = String(plan?.sceneName || options?.sceneName || '').trim();
            if (!bindingKey || !rawValue) return plan;
            if (isMatrixSceneFieldBindingKey(bindingKey)) {
                const fieldKey = normalizeSceneFieldKey(bindingKey.slice(MATRIX_SCENE_FIELD_KEY_PREFIX.length));
                const fieldLabel = normalizeMatrixSceneRenderFieldLabel(
                    dimensionValue.dimensionLabel || dimensionValue.key || fieldKey
                ) || fieldKey;
                if (!fieldKey || !fieldLabel) return plan;
                plan.sceneSettingValues = isPlainObject(plan?.sceneSettingValues)
                    ? mergeDeep({}, plan.sceneSettingValues)
                    : {};
                plan.sceneSettingValues[fieldKey] = rawValue;
                plan.sceneSettings = isPlainObject(plan?.sceneSettings)
                    ? mergeDeep({}, plan.sceneSettings)
                    : {};
                plan.sceneSettings[fieldLabel] = rawValue;
                return plan;
            }
            if (bindingKey === 'material_id') {
                const boundItem = resolveMatrixBoundItem(rawValue, options?.itemList || []);
                if (!boundItem) {
                    throw new Error(`矩阵商品维度未命中已添加商品：${rawValue}`);
                }
                plan.item = boundItem;
                plan.itemId = String(toIdValue(boundItem.materialId || boundItem.itemId)).trim();
                return plan;
            }
            if (bindingKey === 'plan_prefix') {
                const currentPlanName = String(plan?.planName || '').trim();
                plan.planName = currentPlanName ? `${rawValue}_${currentPlanName}` : rawValue;
                return plan;
            }
            if (bindingKey === 'bid_mode') {
                const nextBidMode = normalizeBidMode(
                    mapSceneBidTypeValue(rawValue, planSceneName) || rawValue,
                    ''
                );
                if (!nextBidMode) return plan;
                plan.bidMode = nextBidMode;
                plan.campaignOverride = isPlainObject(plan?.campaignOverride)
                    ? mergeDeep({}, plan.campaignOverride)
                    : {};
                plan.campaignOverride.bidTypeV2 = bidModeToBidType(nextBidMode);
                if (nextBidMode === 'manual') {
                    delete plan.campaignOverride.bidTargetV2;
                    delete plan.campaignOverride.optimizeTarget;
                    delete plan.campaignOverride.constraintType;
                    delete plan.campaignOverride.constraintValue;
                    plan.campaignOverride.setSingleCostV2 = false;
                    delete plan.campaignOverride.singleCostV2;
                }
                return plan;
            }
            if (bindingKey === 'bid_target_cost_package') {
                if (planSceneName !== '关键词推广') return plan;
                const targetPackage = parseMatrixBidTargetCostPackageValue(rawValue);
                if (!targetPackage) return plan;
                if (targetPackage.targetOptionValue === 'fav_cart' && targetPackage.amount < 5) {
                    throw new Error('增加收藏加购量目标成本需填写 5-9999.99 的数值');
                }
                const submitBidTargetV2 = resolveKeywordCustomBidTargetAlias(
                    targetPackage.targetOptionValue,
                    '自定义推广'
                ) || targetPackage.targetOptionValue;
                const targetCostConfig = resolveMatrixBidTargetCostConfig(targetPackage.targetOptionValue);
                const applySceneSetting = (label, value) => {
                    const text = String(value || '').trim();
                    const fieldLabel = normalizeMatrixSceneRenderFieldLabel(label) || label;
                    const fieldKey = normalizeSceneFieldKey(fieldLabel);
                    if (!fieldLabel || !text) return;
                    plan.sceneSettingValues = isPlainObject(plan?.sceneSettingValues)
                        ? mergeDeep({}, plan.sceneSettingValues)
                        : {};
                    plan.sceneSettingValues[fieldKey || fieldLabel] = text;
                    plan.sceneSettings = isPlainObject(plan?.sceneSettings)
                        ? mergeDeep({}, plan.sceneSettings)
                        : {};
                    plan.sceneSettings[fieldLabel] = text;
                };
                plan.bidMode = 'smart';
                plan.marketingGoal = '自定义推广';
                plan.bidTargetV2 = submitBidTargetV2;
                plan.setSingleCostV2 = targetPackage.targetOptionValue !== 'roi';
                plan.singleCostV2 = targetPackage.targetOptionValue === 'roi' ? '' : targetPackage.costValue;
                plan.campaignOverride = isPlainObject(plan?.campaignOverride)
                    ? mergeDeep({}, plan.campaignOverride)
                    : {};
                plan.campaignOverride.bidTypeV2 = bidModeToBidType('smart');
                plan.campaignOverride.bidTargetV2 = submitBidTargetV2;
                plan.campaignOverride.optimizeTarget = submitBidTargetV2;
                if (targetPackage.targetOptionValue === 'roi') {
                    plan.campaignOverride.constraintType = 'roi';
                    plan.campaignOverride.constraintValue = targetPackage.amount;
                    plan.campaignOverride.setSingleCostV2 = false;
                    delete plan.campaignOverride.singleCostV2;
                } else {
                    delete plan.campaignOverride.constraintType;
                    delete plan.campaignOverride.constraintValue;
                    plan.campaignOverride.setSingleCostV2 = true;
                    plan.campaignOverride.singleCostV2 = targetPackage.amount;
                }
                applySceneSetting('营销目标', '自定义推广');
                applySceneSetting('选择卡位方案', '自定义推广');
                applySceneSetting('出价方式', '智能出价');
                applySceneSetting('出价目标', targetPackage.targetLabel);
                if (targetCostConfig?.switchLabel) {
                    applySceneSetting(targetCostConfig.switchLabel, targetCostConfig.switchOnValue || '开启');
                }
                if (Array.isArray(targetCostConfig?.valueLabels) && targetCostConfig.valueLabels.length) {
                    applySceneSetting(targetCostConfig.valueLabels[0], targetPackage.costValue);
                }
                if (targetPackage.targetOptionValue !== 'roi') {
                    applySceneSetting('目标成本', targetPackage.costValue);
                }
                return plan;
            }
            if (bindingKey === 'bid_target') {
                if (planSceneName !== '关键词推广') return plan;
                const currentBidMode = normalizeBidMode(plan?.bidMode || plan?.campaignOverride?.bidTypeV2 || '', 'smart');
                if (currentBidMode === 'manual') return plan;
                let nextBidTargetV2 = normalizeKeywordBidTargetOptionValue(
                    mapSceneBidTargetValue(rawValue) || rawValue
                ) || '';
                if (!nextBidTargetV2) return plan;
                nextBidTargetV2 = resolveKeywordCustomBidTargetAlias(nextBidTargetV2, plan?.marketingGoal || '');
                plan.campaignOverride = isPlainObject(plan?.campaignOverride)
                    ? mergeDeep({}, plan.campaignOverride)
                    : {};
                plan.campaignOverride.bidTargetV2 = nextBidTargetV2;
                plan.campaignOverride.optimizeTarget = nextBidTargetV2;
                if (nextBidTargetV2 === 'roi') {
                    plan.campaignOverride.constraintType = 'roi';
                } else {
                    delete plan.campaignOverride.constraintType;
                    delete plan.campaignOverride.constraintValue;
                }
                return plan;
            }
            if (bindingKey === 'budget' || bindingKey === 'day_budget' || bindingKey === 'day_average_budget') {
                const budgetValue = parseMatrixNumericValue(rawValue);
                if (!Number.isFinite(budgetValue) || budgetValue <= 0) return plan;
                const targetBudgetField = resolveMatrixBudgetField(plan, bindingKey);
                plan.budget = { [targetBudgetField]: budgetValue };
                return plan;
            }
            return plan;
        };

        const applyMatrixCombinationBindingsToPlan = (plan = {}, combination = {}, options = {}) => {
            if (!isPlainObject(plan)) return plan;
            const matrixValues = (Array.isArray(combination?.values) ? combination.values : [])
                .map(item => ({
                    ...item,
                    bindingKey: normalizeMatrixBindingKey(item?.key || item?.dimensionLabel || '')
                }))
                .filter(item => item.bindingKey);
            if (!matrixValues.length) return plan;
            const hasExplicitBudgetBinding = matrixValues.some(item => (
                item.bindingKey === 'day_budget' || item.bindingKey === 'day_average_budget'
            ));
            [
                'material_id',
                'day_budget',
                'day_average_budget',
                'budget',
                'bid_mode',
                'bid_target',
                'bid_target_cost_package',
                'plan_prefix'
            ].forEach((bindingKey) => {
                matrixValues
                    .filter(item => item.bindingKey === bindingKey)
                    .forEach((item) => {
                        if (bindingKey === 'budget' && hasExplicitBudgetBinding) return;
                        applyMatrixDimensionBindingToPlan(plan, item, options);
                    });
            });
            return plan;
        };

        const materializePlansFromMatrix = (basePlans = [], combinations = [], options = {}) => {
            const sourcePlans = Array.isArray(basePlans) ? basePlans : [];
            const comboList = Array.isArray(combinations) ? combinations : [];
            if (!comboList.length) return sourcePlans.map(item => mergeDeep({}, item));
            const namingPattern = String(options?.namingPattern || MATRIX_DEFAULT_NAMING_PATTERN).trim() || MATRIX_DEFAULT_NAMING_PATTERN;
            const plans = [];
            sourcePlans.forEach((plan) => {
                comboList.forEach((combination, comboIndex) => {
                    const nextPlan = mergeDeep({}, plan);
                    applyMatrixCombinationBindingsToPlan(nextPlan, combination, {
                        sceneName: options?.sceneName || nextPlan?.sceneName || '',
                        itemList: Array.isArray(options?.itemList) ? options.itemList : []
                    });
                    nextPlan.planName = applyMatrixNamingPattern(namingPattern, nextPlan, combination, comboIndex);
                    nextPlan.matrixCombination = {
                        index: comboIndex + 1,
                        values: Array.isArray(combination?.values) ? combination.values.map(item => ({ ...item })) : [],
                        labels: Array.isArray(combination?.labels) ? combination.labels.slice() : []
                    };
                    plans.push(nextPlan);
                });
            });
            return plans;
        };

        const splitMatrixBatches = (plans = [], batchSize = MATRIX_LIMITS.batchSize) => {
            const list = Array.isArray(plans) ? plans : [];
            const size = Math.max(1, toNumber(batchSize, MATRIX_LIMITS.batchSize) || MATRIX_LIMITS.batchSize);
            return chunk(list, size);
        };

        const wizardDefaultDraft = () => ({
            schemaVersion: SESSION_DRAFT_SCHEMA_VERSION,
            bizCode: DEFAULTS.bizCode,
            promotionScene: DEFAULTS.promotionScene,
            sceneName: '关键词推广',
            sceneSettingValues: {},
            sceneSettingTouched: {},
            planNamePrefix: buildSceneTimePrefix('关键词推广'),
            dayAverageBudget: '',
            defaultBidPrice: '1',
            bidMode: 'smart',
            keywordMode: DEFAULTS.keywordMode,
            useWordPackage: DEFAULTS.useWordPackage,
            recommendCount: String(DEFAULTS.recommendCount),
            manualKeywords: '',
            manualKeywordPanelCollapsed: true,
            addedItems: [],
            crowdList: [],
            debugVisible: false,
            itemSplitExpanded: false,
            candidateListExpanded: false,
            fallbackPolicy: normalizeWizardFallbackPolicy('auto'),
            submitMode: 'serial',
            parallelSubmitTimes: normalizeParallelSubmitTimes(DEFAULT_SCENE_PARALLEL_SUBMIT_TIMES, DEFAULT_SCENE_PARALLEL_SUBMIT_TIMES),
            matrixConfig: buildDefaultMatrixConfig(),
            strategyList: getDefaultStrategyList(),
            editingStrategyId: '',
            detailVisible: false
        });

        const formatRepairStatusText = (state = {}) => {
            const scene = String(state.sceneName || '-').trim() || '-';
            const sceneText = state.sceneIndex && state.sceneTotal
                ? `${scene}(${state.sceneIndex}/${state.sceneTotal})`
                : scene;
            const caseIndex = Math.max(0, toNumber(state.caseIndex, 0));
            const caseTotal = Math.max(0, toNumber(state.caseTotal, 0));
            const passCases = Math.max(0, toNumber(state.passCases, 0));
            const repairedCases = Math.max(0, toNumber(state.repairedCases, 0));
            const failedCases = Math.max(0, toNumber(state.failedCases, 0));
            const deletedCount = Math.max(0, toNumber(state.deletedCount, 0));
            const stoppedCount = Math.max(0, toNumber(state.stoppedCount, 0));
            return `场景=${sceneText} 用例=${caseIndex}/${caseTotal} 通过=${passCases} 修复=${repairedCases} 失败=${failedCases} 删除=${deletedCount} 停止=${stoppedCount}`;
        };
        const normalizeRepairItemId = (value = '') => {
            const text = String(value || '').trim();
            return /^\d{4,}$/.test(text) ? text : '';
        };
        const setRepairStatusText = (text = '') => {
            if (wizardState?.els?.repairStatus instanceof HTMLElement) {
                wizardState.els.repairStatus.textContent = String(text || '').trim();
            }
        };
        const setRepairControlState = (running = false) => {
            const isRunning = !!running;
            if (wizardState?.els?.repairRunBtn instanceof HTMLButtonElement) {
                wizardState.els.repairRunBtn.disabled = isRunning;
            }
            if (wizardState?.els?.repairStopBtn instanceof HTMLButtonElement) {
                wizardState.els.repairStopBtn.disabled = !isRunning;
            }
            if (wizardState?.els?.repairItemIdInput instanceof HTMLInputElement) {
                wizardState.els.repairItemIdInput.disabled = isRunning;
            }
        };
        const ensureSceneDefaultItemForScene = async ({
            sceneName = '',
            runtime = null,
            force = false,
            silent = false,
            rerender = true,
            isStale = null
        } = {}) => {
            const runner = typeof wizardState.ensureSceneDefaultItemForSceneImpl === 'function'
                ? wizardState.ensureSceneDefaultItemForSceneImpl
                : null;
            if (typeof runner !== 'function') return false;
            return runner({
                sceneName,
                runtime,
                force,
                silent,
                rerender,
                isStale
            });
        };
        const syncNativeCrowdDefaultsForScene = async ({
            sceneName = '',
            runtime = null,
            force = false,
            silent = false,
            rerender = true,
            isStale = null
        } = {}) => {
            const runner = typeof wizardState.syncNativeCrowdDefaultsForSceneImpl === 'function'
                ? wizardState.syncNativeCrowdDefaultsForSceneImpl
                : null;
            if (typeof runner !== 'function') return false;
            return runner({
                sceneName,
                runtime,
                force,
                silent,
                rerender,
                isStale
            });
        };
