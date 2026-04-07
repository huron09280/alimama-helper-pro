            const openBatchStrategyNumberEditPopup = async (strategies = []) => {
                const selectedStrategies = Array.isArray(strategies)
                    ? strategies.filter(item => isPlainObject(item))
                    : [];
                if (!selectedStrategies.length) return null;
                const targetCostPlanCount = countBatchEditableStrategyTargetCostPlans(selectedStrategies);
                const budgetSeedValue = getBatchStrategyNumberFieldSeedValue(selectedStrategies, 'dayAverageBudget');
                const bidSeedValue = getBatchStrategyNumberFieldSeedValue(selectedStrategies, 'defaultBidPrice');
                const recommendSeedValue = getBatchStrategyNumberFieldSeedValue(selectedStrategies, 'recommendCount');
                const targetCostSeedValue = getBatchStrategyNumberFieldSeedValue(selectedStrategies, 'targetCostValue');
                return openBatchStrategyPopupDialog({
                    title: `批量修改数值（已选 ${selectedStrategies.length} 个计划）`,
                    dialogClassName: 'am-wxt-scene-popup-dialog-batch-number',
                    saveLabel: '批量修改',
                    bodyHtml: `
                        <div class="am-wxt-strategy-batch-number-form">
                            <div class="am-wxt-scene-popup-tips">留空表示不修改；仅会批量修改数值字段，不会覆盖计划名、商品、场景和出价模式。</div>
                            <div class="am-wxt-strategy-batch-number-grid">
                                <label class="am-wxt-strategy-batch-number-field">
                                    <span>预算值</span>
                                    <input type="number" min="0.01" max="999999" step="0.01" placeholder="${Utils.escapeHtml(budgetSeedValue || '例如 100')}" data-batch-strategy-number-field="dayAverageBudget" />
                                </label>
                                <label class="am-wxt-strategy-batch-number-field">
                                    <span>默认出价</span>
                                    <input type="number" min="0.01" max="9999" step="0.01" placeholder="${Utils.escapeHtml(bidSeedValue || '例如 1')}" data-batch-strategy-number-field="defaultBidPrice" />
                                </label>
                                <label class="am-wxt-strategy-batch-number-field">
                                    <span>推荐词目标数</span>
                                    <input type="number" min="1" max="200" step="1" placeholder="${Utils.escapeHtml(recommendSeedValue || String(DEFAULTS.recommendCount))}" data-batch-strategy-number-field="recommendCount" />
                                </label>
                                <label class="am-wxt-strategy-batch-number-field">
                                    <span>目标成本/ROI</span>
                                    <input
                                        type="number"
                                        min="0.01"
                                        max="9999"
                                        step="0.01"
                                        placeholder="${Utils.escapeHtml(targetCostSeedValue || '例如 5')}"
                                        data-batch-strategy-number-field="targetCostValue"
                                        ${targetCostPlanCount > 0 ? '' : 'disabled'}
                                    />
                                </label>
                            </div>
                            <div class="am-wxt-strategy-batch-number-note">
                                目标成本/ROI 仅对关键词推广下的智能出价计划生效，本次命中 ${targetCostPlanCount} 个计划。
                            </div>
                        </div>
                    `,
                    onMounted(mask) {
                        const budgetInput = mask.querySelector('[data-batch-strategy-number-field="dayAverageBudget"]');
                        if (budgetInput instanceof HTMLInputElement) {
                            requestAnimationFrame(() => {
                                try {
                                    budgetInput.focus({ preventScroll: true });
                                } catch {
                                    budgetInput.focus();
                                }
                            });
                        }
                    },
                    onSave(mask) {
                        const normalizedValues = normalizeBatchStrategyNumberEditValues({
                            dayAverageBudget: mask.querySelector('[data-batch-strategy-number-field="dayAverageBudget"]')?.value || '',
                            defaultBidPrice: mask.querySelector('[data-batch-strategy-number-field="defaultBidPrice"]')?.value || '',
                            recommendCount: mask.querySelector('[data-batch-strategy-number-field="recommendCount"]')?.value || '',
                            targetCostValue: mask.querySelector('[data-batch-strategy-number-field="targetCostValue"]')?.value || ''
                        });
                        if (!Object.keys(normalizedValues).length) {
                            appendWizardLog('请至少填写 1 个需要批量修改的数值字段', 'error');
                            return { ok: false };
                        }
                        if (normalizedValues.targetCostValue && targetCostPlanCount <= 0) {
                            appendWizardLog('已选计划中没有可批量修改目标成本/ROI的计划', 'error');
                            return { ok: false };
                        }
                        return {
                            ok: true,
                            values: normalizedValues
                        };
                    }
                });
            };

            const applyStrategyToDetailForm = (strategy) => {
                if (!strategy) return;
                if (wizardState.els.detailTitle) {
                    wizardState.els.detailTitle.textContent = getStrategyMainLabel(strategy);
                }
                const strategyScene = SCENE_OPTIONS.includes(String(strategy?.sceneName || '').trim())
                    ? String(strategy.sceneName).trim()
                    : (SCENE_OPTIONS.includes(String(wizardState.draft?.sceneName || '').trim())
                        ? String(wizardState.draft.sceneName).trim()
                        : '关键词推广');
                strategy.sceneName = strategyScene;
                if (wizardState.els.sceneSelect) {
                    wizardState.els.sceneSelect.value = strategyScene;
                }
                if (wizardState.draft) wizardState.draft.sceneName = strategyScene;
                const strategySceneSettingValues = normalizeSceneSettingBucketValues(
                    strategy.sceneSettingValues || {},
                    strategyScene
                );
                const strategySceneSettingTouched = normalizeSceneSettingTouchedValues(
                    strategy.sceneSettingTouched || {},
                    strategyScene
                );
                if (!Object.keys(strategySceneSettingValues).length && isPlainObject(strategy.sceneSettings)) {
                    const fromPayload = normalizeSceneSettingBucketValues(strategy.sceneSettings, strategyScene);
                    if (Object.keys(fromPayload).length) {
                        Object.assign(strategySceneSettingValues, fromPayload);
                    }
                }
                const draft = ensureWizardDraft();
                if (!isPlainObject(wizardState.draft.sceneSettingValues)) {
                    draft.sceneSettingValues = {};
                }
                wizardState.draft.sceneSettingValues[strategyScene] = mergeDeep({}, strategySceneSettingValues);
                if (!isPlainObject(draft.sceneSettingTouched)) {
                    draft.sceneSettingTouched = {};
                }
                wizardState.draft.sceneSettingTouched[strategyScene] = mergeDeep({}, strategySceneSettingTouched);
                const currentSceneName = getCurrentEditorSceneName();
                if (currentSceneName === '关键词推广') {
                    const strategyGoal = normalizeGoalLabel(
                        strategy.marketingGoal
                        || resolveStrategyMarketingGoal(strategy, strategySceneSettingValues, currentSceneName)
                    );
                    if (strategyGoal) {
                        const bucket = ensureSceneSettingBucket(currentSceneName);
                        if (!normalizeSceneSettingValue(bucket.营销目标) || normalizeGoalLabel(bucket.营销目标) !== strategyGoal) {
                            bucket.营销目标 = strategyGoal;
                        }
                        if (!normalizeSceneSettingValue(bucket.选择卡位方案) || normalizeGoalLabel(bucket.选择卡位方案) !== strategyGoal) {
                            bucket.选择卡位方案 = strategyGoal;
                        }
                        strategy.marketingGoal = strategyGoal;
                    }
                }
                const bidMode = normalizeBidMode(strategy.bidMode || wizardState.draft?.bidMode || 'smart', 'smart');
                if (wizardState.els.bidTargetSelect) {
                    const strategyBidTargetValue = normalizeKeywordBidTargetOptionValue(
                        strategy.bidTargetV2 || DEFAULTS.bidTargetV2
                    ) || DEFAULTS.bidTargetV2;
                    wizardState.els.bidTargetSelect.value = strategyBidTargetValue;
                }
                if (wizardState.els.budgetTypeSelect) wizardState.els.budgetTypeSelect.value = strategy.budgetType || 'day_average';
                if (wizardState.els.budgetInput) wizardState.els.budgetInput.value = strategy.dayAverageBudget || wizardState.draft?.dayAverageBudget || '';
                if (wizardState.els.bidInput) wizardState.els.bidInput.value = strategy.defaultBidPrice || wizardState.draft?.defaultBidPrice || '1';
                if (wizardState.els.modeSelect) wizardState.els.modeSelect.value = strategy.keywordMode || wizardState.draft?.keywordMode || DEFAULTS.keywordMode;
                if (wizardState.els.recommendCountInput) wizardState.els.recommendCountInput.value = strategy.recommendCount || wizardState.draft?.recommendCount || String(DEFAULTS.recommendCount);
                if (wizardState.els.manualInput) wizardState.els.manualInput.value = strategy.manualKeywords || '';
                const visiblePlanName = getStrategyMainLabel(strategy);
                if (!String(strategy.autoPlanPrefix || '').trim()) {
                    strategy.autoPlanPrefix = stripAutoPlanSerialSuffix(visiblePlanName);
                }
                if (wizardState.els.prefixInput) {
                    wizardState.els.prefixInput.value = visiblePlanName || strategy.autoPlanPrefix || wizardState.draft?.planNamePrefix || '';
                }
                if (wizardState.els.singleCostEnableInput) wizardState.els.singleCostEnableInput.checked = bidMode === 'smart' && !!strategy.setSingleCostV2;
                if (wizardState.els.singleCostInput) {
                    wizardState.els.singleCostInput.value = strategy.singleCostV2 || '';
                }
                updateBidModeControls(bidMode);
                renderSceneDynamicConfig();
            };

            const pullDetailFormToStrategy = (strategy) => {
                if (!strategy) return;
                const bidMode = normalizeBidMode(
                    wizardState.els.bidModeSelect?.value || strategy.bidMode || wizardState.draft?.bidMode || 'smart',
                    'smart'
                );
                const sceneName = getCurrentEditorSceneName();
                const sceneSettings = buildSceneSettingsPayload(sceneName);
                strategy.sceneName = sceneName;
                strategy.bidMode = bidMode;
                if (wizardState.els.bidTargetSelect) strategy.bidTargetV2 = wizardState.els.bidTargetSelect.value || DEFAULTS.bidTargetV2;
                if (wizardState.els.budgetTypeSelect) strategy.budgetType = wizardState.els.budgetTypeSelect.value || 'day_average';
                if (wizardState.els.budgetInput) strategy.dayAverageBudget = wizardState.els.budgetInput.value.trim();
                if (wizardState.els.bidInput) strategy.defaultBidPrice = wizardState.els.bidInput.value.trim() || '1';
                if (wizardState.els.modeSelect) strategy.keywordMode = wizardState.els.modeSelect.value;
                if (wizardState.els.recommendCountInput) strategy.recommendCount = wizardState.els.recommendCountInput.value.trim() || String(DEFAULTS.recommendCount);
                if (wizardState.els.manualInput) strategy.manualKeywords = wizardState.els.manualInput.value.trim();
                if (wizardState.els.prefixInput) {
                    const inputPlanName = wizardState.els.prefixInput.value.trim();
                    if (isAutoGeneratedPlanPrefix(inputPlanName)) {
                        strategy.planName = '';
                        strategy.autoPlanPrefix = stripAutoPlanSerialSuffix(inputPlanName);
                    } else {
                        strategy.planName = inputPlanName;
                    }
                }
                if (wizardState.els.singleCostEnableInput) strategy.setSingleCostV2 = bidMode === 'smart' && !!wizardState.els.singleCostEnableInput.checked;
                if (wizardState.els.singleCostInput) strategy.singleCostV2 = wizardState.els.singleCostInput.value.trim();
                strategy.marketingGoal = resolveStrategyMarketingGoal(strategy, sceneSettings, sceneName);
                strategy.sceneSettingValues = mergeDeep({}, normalizeSceneSettingBucketValues(ensureSceneSettingBucket(sceneName), sceneName));
                strategy.sceneSettingTouched = mergeDeep({}, normalizeSceneSettingTouchedValues(ensureSceneTouchedBucket(sceneName), sceneName));
                strategy.sceneSettings = normalizeSceneSettingsObject(sceneSettings);
                const strategyTargetCostConfig = (
                    sceneName === '关键词推广' && bidMode === 'smart'
                ) ? resolveStrategyTargetCostConfig(strategy.bidTargetV2 || '') : null;
                if (strategyTargetCostConfig) {
                    const targetCostValueFromScene = resolveStrategyTargetCostValue({
                        singleCostV2: '',
                        sceneSettingValues: strategy.sceneSettingValues,
                        sceneSettings: strategy.sceneSettings
                    }, strategy.bidTargetV2 || '');
                    strategy.setSingleCostV2 = !!targetCostValueFromScene;
                    strategy.singleCostV2 = targetCostValueFromScene;
                }
            };

            const setDetailVisible = (visible) => {
                wizardState.detailVisible = !!visible;
                if (wizardState.els.detailConfig) {
                    wizardState.els.detailConfig.classList.toggle('collapsed', !wizardState.detailVisible);
                }
                if (wizardState.els.detailBackdrop) {
                    wizardState.els.detailBackdrop.classList.toggle('open', wizardState.detailVisible);
                }
            };

            const showStrategyDetail = (strategy = null, options = {}) => {
                const targetStrategy = strategy || getStrategyById(wizardState.editingStrategyId) || wizardState.strategyList[0] || null;
                if (!targetStrategy) return null;
                const previous = getStrategyById(wizardState.editingStrategyId);
                if (previous && previous.id !== targetStrategy.id && wizardState.detailVisible) {
                    pullDetailFormToStrategy(previous);
                }
                wizardState.editingStrategyId = targetStrategy.id;
                applyStrategyToDetailForm(targetStrategy);
                setDetailVisible(true);
                if (options.switchWorkbench !== false && typeof wizardState.setWorkbenchPage === 'function') {
                    wizardState.setWorkbenchPage('editor');
                }
                if (options.commit !== false) {
                    commitStrategyUiState({ refreshPreview: false });
                }
                if (options.autoLoad !== false) {
                    maybeAutoLoadManualKeywords(targetStrategy);
                }
                return targetStrategy;
            };

            const openStrategyDetail = (strategyId) => {
                const strategy = getStrategyById(strategyId);
                if (!strategy) return;
                if (
                    wizardState.editingStrategyId === strategy.id
                    && wizardState.detailVisible
                    && wizardState.workbenchPage === 'editor'
                ) {
                    setDetailVisible(false);
                    if (typeof wizardState.setWorkbenchPage === 'function') {
                        wizardState.setWorkbenchPage('home');
                    }
                    commitStrategyUiState({ refreshPreview: false });
                    return;
                }
                showStrategyDetail(strategy);
            };
            const addNewStrategy = () => {
                const editing = getStrategyById(wizardState.editingStrategyId);
                if (editing && wizardState.detailVisible) pullDetailFormToStrategy(editing);
                const sceneName = getCurrentEditorSceneName();
                const bidMode = normalizeBidMode(
                    wizardState.els.bidModeSelect?.value || wizardState.draft?.bidMode || 'smart',
                    'smart'
                );
                const rawPlanName = String(
                    wizardState.els.prefixInput?.value
                    || wizardState.draft?.planNamePrefix
                    || buildDefaultPlanPrefixByScene(sceneName)
                ).trim();
                const sceneSettings = buildSceneSettingsPayload(sceneName);
                const next = {
                    sceneName,
                    id: createStrategyCloneId('strategy'),
                    name: createNewStrategyName(sceneName),
                    enabled: true,
                    bidMode,
                    marketingGoal: resolveStrategyMarketingGoal({
                        bidMode,
                        bidTargetV2: String(wizardState.els.bidTargetSelect?.value || DEFAULTS.bidTargetV2).trim() || DEFAULTS.bidTargetV2
                    }, sceneSettings, sceneName),
                    dayAverageBudget: String(wizardState.els.budgetInput?.value || wizardState.draft?.dayAverageBudget || '100').trim() || '100',
                    defaultBidPrice: String(wizardState.els.bidInput?.value || wizardState.draft?.defaultBidPrice || '1').trim() || '1',
                    keywordMode: String(wizardState.els.modeSelect?.value || wizardState.draft?.keywordMode || DEFAULTS.keywordMode).trim() || DEFAULTS.keywordMode,
                    useWordPackage: wizardState?.draft?.useWordPackage !== false,
                    recommendCount: String(wizardState.els.recommendCountInput?.value || wizardState.draft?.recommendCount || DEFAULTS.recommendCount).trim() || String(DEFAULTS.recommendCount),
                    manualKeywords: String(wizardState.els.manualInput?.value || '').trim(),
                    bidTargetV2: String(wizardState.els.bidTargetSelect?.value || DEFAULTS.bidTargetV2).trim() || DEFAULTS.bidTargetV2,
                    budgetType: String(wizardState.els.budgetTypeSelect?.value || 'day_average').trim() || 'day_average',
                    setSingleCostV2: bidMode === 'smart' && !!wizardState.els.singleCostEnableInput?.checked,
                    singleCostV2: String(wizardState.els.singleCostInput?.value || '').trim(),
                    planName: ensureUniqueStrategyPlanName(rawPlanName || buildDefaultPlanPrefixByScene(sceneName)),
                    copyBatchCount: 1,
                    sceneSettingValues: mergeDeep({}, normalizeSceneSettingBucketValues(ensureSceneSettingBucket(sceneName), sceneName)),
                    sceneSettingTouched: mergeDeep({}, normalizeSceneSettingTouchedValues(ensureSceneTouchedBucket(sceneName), sceneName)),
                    sceneSettings: normalizeSceneSettingsObject(sceneSettings)
                };
                wizardState.strategyList.push(next);
                showStrategyDetail(next, { autoLoad: false });
                appendWizardLog(`已新建计划：${next.name}`, 'success');
                maybeAutoLoadManualKeywords(next, { delayMs: 320 });
            };

            const syncStrategyHeadActionState = () => {
                const selectedCount = getSelectedStrategyList().length;
                const totalCount = Array.isArray(wizardState?.strategyList) ? wizardState.strategyList.length : 0;
                const filteredStrategyList = getFilteredStrategyList();
                const filteredCount = filteredStrategyList.length;
                const filteredSelectedCount = filteredStrategyList.filter(item => item?.enabled !== false).length;
                const hasStrategySearch = !!getStrategySearchKeyword();
                if (wizardState.els.strategySelectAllInput instanceof HTMLInputElement) {
                    wizardState.els.strategySelectAllInput.disabled = filteredCount <= 0;
                    wizardState.els.strategySelectAllInput.checked = filteredCount > 0 && filteredSelectedCount === filteredCount;
                    wizardState.els.strategySelectAllInput.indeterminate = filteredSelectedCount > 0 && filteredSelectedCount < filteredCount;
                    wizardState.els.strategySelectAllInput.title = filteredCount > 0
                        ? (hasStrategySearch ? `全选当前搜索结果 ${filteredCount} 个计划` : `全选当前 ${filteredCount} 个计划`)
                        : (hasStrategySearch ? '当前搜索无匹配计划' : '暂无计划可全选');
                }
                if (wizardState.els.batchEditStrategyBtn instanceof HTMLButtonElement) {
                    wizardState.els.batchEditStrategyBtn.disabled = selectedCount <= 0;
                    wizardState.els.batchEditStrategyBtn.title = selectedCount > 0
                        ? `批量修改已选 ${selectedCount} 个计划的数值项`
                        : '请先勾选至少 1 个计划';
                }
                if (wizardState.els.clearStrategyBtn instanceof HTMLButtonElement) {
                    wizardState.els.clearStrategyBtn.disabled = selectedCount <= 0 || totalCount <= 1;
                    wizardState.els.clearStrategyBtn.title = totalCount <= 1
                        ? '至少保留 1 个计划'
                        : (selectedCount > 0 ? `清空已选 ${selectedCount} 个计划` : '请先勾选至少 1 个计划');
                }
            };

            const handleSelectAllStrategies = () => {
                if (!(wizardState.els.strategySelectAllInput instanceof HTMLInputElement)) return;
                const nextEnabled = !!wizardState.els.strategySelectAllInput.checked;
                const affectedCount = setFilteredStrategiesEnabled(nextEnabled);
                if (affectedCount <= 0) {
                    appendWizardLog('当前没有可全选的计划', 'error');
                    return;
                }
                commitStrategyUiState({ refreshPreview: false });
                const scopeLabel = getStrategySearchKeyword() ? '当前搜索结果' : '当前计划';
                appendWizardLog(`${nextEnabled ? '已全选' : '已取消全选'} ${scopeLabel} ${affectedCount} 个`, 'success');
            };

            const handleBatchEditStrategies = async () => {
                const selectedStrategies = getSelectedStrategyList();
                if (!selectedStrategies.length) {
                    appendWizardLog('请先勾选至少 1 个计划，再批量编辑', 'error');
                    return;
                }
                const result = await openBatchStrategyNumberEditPopup(selectedStrategies);
                if (!result?.values || !isPlainObject(result.values)) return;
                const applyResult = applyBatchNumberEditToStrategies(selectedStrategies, result.values);
                if (applyResult.updatedCount <= 0) {
                    appendWizardLog('未命中可批量修改的计划', 'error');
                    return;
                }
                const editingStrategy = getStrategyById(wizardState.editingStrategyId);
                if (
                    editingStrategy
                    && wizardState.detailVisible
                    && selectedStrategies.some(item => item?.id === editingStrategy.id)
                ) {
                    applyStrategyToDetailForm(editingStrategy);
                }
                commitStrategyUiState();
                const logParts = [`已批量修改 ${applyResult.updatedCount} 个计划`];
                if (result.values.targetCostValue) {
                    logParts.push(`目标成本/ROI 命中 ${applyResult.targetCostAppliedCount} 个计划`);
                }
                appendWizardLog(logParts.join('；'), 'success');
            };

            const clearSelectedStrategies = () => {
                const selectedStrategies = getSelectedStrategyList();
                if (!selectedStrategies.length) {
                    appendWizardLog('请先勾选至少 1 个计划，再清空', 'error');
                    return;
                }
                const strategyList = Array.isArray(wizardState?.strategyList) ? wizardState.strategyList : [];
                if (strategyList.length <= 1) {
                    appendWizardLog('至少保留 1 个计划', 'error');
                    return;
                }
                const selectedIdSet = new Set(
                    selectedStrategies
                        .map(item => String(item?.id || '').trim())
                        .filter(Boolean)
                );
                let preservedLocked = false;
                let nextStrategyList = strategyList.filter(item => !selectedIdSet.has(String(item?.id || '').trim()));
                if (!nextStrategyList.length) {
                    const fallbackStrategy = selectedStrategies[0] || strategyList[0] || null;
                    nextStrategyList = fallbackStrategy ? [fallbackStrategy] : strategyList.slice(0, 1);
                    preservedLocked = true;
                }
                const removedCount = Math.max(0, strategyList.length - nextStrategyList.length);
                if (!removedCount) {
                    appendWizardLog('至少保留 1 个计划', 'error');
                    return;
                }
                wizardState.strategyList = nextStrategyList;
                if (!nextStrategyList.some(item => item.id === wizardState.editingStrategyId)) {
                    const fallbackStrategy = nextStrategyList[0] || null;
                    wizardState.editingStrategyId = fallbackStrategy?.id || '';
                    if (fallbackStrategy && wizardState.detailVisible) {
                        applyStrategyToDetailForm(fallbackStrategy);
                    }
                }
                commitStrategyUiState();
                appendWizardLog(
                    `已清空 ${removedCount} 个计划${preservedLocked ? '，已保留 1 个计划' : ''}`,
                    'success'
                );
            };

            const resolveKeywordGoalRuntime = (goalLabel = '') => {
                const normalizedGoal = detectKeywordGoalFromText(goalLabel) || normalizeGoalCandidateLabel(goalLabel);
                const runtimeRule = resolveKeywordGoalRuntimeFallback(normalizedGoal);
                const bidTargetV2 = String(
                    runtimeRule?.bidTargetV2
                    || (normalizedGoal === '自定义推广' ? 'conv' : DEFAULTS.bidTargetV2)
                ).trim() || DEFAULTS.bidTargetV2;
                const optimizeTarget = String(runtimeRule?.optimizeTarget || bidTargetV2).trim() || bidTargetV2;
                const promotionScene = String(runtimeRule?.promotionScene || '').trim();
                const itemSelectedMode = String(runtimeRule?.itemSelectedMode || '').trim();
                return {
                    marketingGoal: normalizedGoal || '趋势明星',
                    bidMode: 'smart',
                    bidTargetV2,
                    optimizeTarget,
                    promotionScene,
                    itemSelectedMode
                };
            };
