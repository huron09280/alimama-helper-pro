            const handleGenerateOtherStrategies = () => {
                const editing = getStrategyById(wizardState.editingStrategyId);
                if (editing && wizardState.detailVisible) pullDetailFormToStrategy(editing);
                const sceneName = getCurrentEditorSceneName();
                const sceneSettings = buildSceneSettingsPayload(sceneName);
                const goalCandidates = getSceneMarketingGoalFallbackList(sceneName);
                if (!goalCandidates.length) {
                    addNewStrategy();
                    return;
                }
                const existingGoalSet = new Set(
                    (wizardState.strategyList || [])
                        .map(strategy => normalizeGoalLabel(resolveStrategyMarketingGoal(strategy, sceneSettings, sceneName)))
                        .filter(Boolean)
                );
                const missingGoals = goalCandidates
                    .map(goal => (sceneName === '关键词推广' ? normalizeGoalCandidateLabel(goal) : normalizeGoalLabel(goal)))
                    .filter(Boolean)
                    .filter(goal => !existingGoalSet.has(normalizeGoalLabel(goal)));
                if (!missingGoals.length) {
                    appendWizardLog(`当前策略已覆盖「${sceneName}」候选目标，无需新增`, 'success');
                    return;
                }
                const seedStrategy = deepClone(editing || wizardState.strategyList[0] || {});
                const seedSceneSettings = normalizeSceneSettingsObject(seedStrategy.sceneSettings || sceneSettings);
                const seedSceneSettingValues = normalizeSceneSettingBucketValues(
                    seedStrategy.sceneSettingValues || ensureSceneSettingBucket(sceneName),
                    sceneName
                );
                const seedSceneSettingTouched = normalizeSceneSettingTouchedValues(
                    seedStrategy.sceneSettingTouched || ensureSceneTouchedBucket(sceneName),
                    sceneName
                );
                const usedNameSet = new Set(
                    (wizardState.strategyList || [])
                        .map(item => String(item?.name || '').trim())
                        .filter(Boolean)
                );
                const created = [];
                const createUniqueStrategyNameByGoal = (goalLabel = '') => {
                    const base = `${sceneName}-${goalLabel || '策略'}`;
                    if (!usedNameSet.has(base)) {
                        usedNameSet.add(base);
                        return base;
                    }
                    let cursor = 2;
                    let candidate = `${base}${cursor}`;
                    while (usedNameSet.has(candidate) && cursor < 99) {
                        cursor += 1;
                        candidate = `${base}${cursor}`;
                    }
                    usedNameSet.add(candidate);
                    return candidate;
                };
                missingGoals.forEach(goal => {
                    const runtime = sceneName === '关键词推广'
                        ? resolveKeywordGoalRuntime(goal)
                        : {
                            marketingGoal: goal,
                            bidMode: normalizeBidMode(seedStrategy.bidMode || wizardState.draft?.bidMode || 'smart', 'smart'),
                            bidTargetV2: String(seedStrategy.bidTargetV2 || DEFAULTS.bidTargetV2).trim() || DEFAULTS.bidTargetV2
                        };
                    const strategySceneSettings = mergeDeep({}, seedSceneSettings);
                    if (runtime.marketingGoal) {
                        if (sceneName === '关键词推广') {
                            strategySceneSettings.营销目标 = runtime.marketingGoal;
                            strategySceneSettings.选择卡位方案 = runtime.marketingGoal;
                        } else if (!normalizeGoalLabel(strategySceneSettings.营销目标 || '')) {
                            strategySceneSettings.营销目标 = runtime.marketingGoal;
                        }
                    }
                    const strategySceneSettingValues = mergeDeep({}, seedSceneSettingValues);
                    if (runtime.marketingGoal) {
                        const goalFieldKey = normalizeSceneFieldKey('营销目标');
                        if (goalFieldKey) strategySceneSettingValues[goalFieldKey] = runtime.marketingGoal;
                        if (sceneName === '关键词推广') {
                            const schemeFieldKey = normalizeSceneFieldKey('选择卡位方案');
                            if (schemeFieldKey) strategySceneSettingValues[schemeFieldKey] = runtime.marketingGoal;
                        }
                    }
                    const strategySceneSettingTouched = mergeDeep({}, seedSceneSettingTouched);
                    if (runtime.marketingGoal) {
                        const goalFieldKey = normalizeSceneFieldKey('营销目标');
                        if (goalFieldKey) strategySceneSettingTouched[goalFieldKey] = true;
                        if (sceneName === '关键词推广') {
                            const schemeFieldKey = normalizeSceneFieldKey('选择卡位方案');
                            if (schemeFieldKey) strategySceneSettingTouched[schemeFieldKey] = true;
                        }
                    }
                    const planNameSeed = String(
                        seedStrategy.planName
                        || wizardState.els.prefixInput?.value
                        || wizardState.draft?.planNamePrefix
                        || buildDefaultPlanPrefixByScene(sceneName)
                    ).trim() || buildDefaultPlanPrefixByScene(sceneName);
                    const next = {
                        sceneName,
                        id: createStrategyCloneId('strategy'),
                        name: createUniqueStrategyNameByGoal(runtime.marketingGoal),
                        enabled: true,
                        bidMode: runtime.bidMode,
                        marketingGoal: runtime.marketingGoal,
                        dayAverageBudget: String(seedStrategy.dayAverageBudget || wizardState.els.budgetInput?.value || wizardState.draft?.dayAverageBudget || '100').trim() || '100',
                        defaultBidPrice: String(seedStrategy.defaultBidPrice || wizardState.els.bidInput?.value || wizardState.draft?.defaultBidPrice || '1').trim() || '1',
                        keywordMode: String(seedStrategy.keywordMode || wizardState.els.modeSelect?.value || wizardState.draft?.keywordMode || DEFAULTS.keywordMode).trim() || DEFAULTS.keywordMode,
                        useWordPackage: seedStrategy.useWordPackage !== false && wizardState?.draft?.useWordPackage !== false,
                        recommendCount: String(seedStrategy.recommendCount || wizardState.els.recommendCountInput?.value || wizardState.draft?.recommendCount || DEFAULTS.recommendCount).trim() || String(DEFAULTS.recommendCount),
                        manualKeywords: String(seedStrategy.manualKeywords || wizardState.els.manualInput?.value || '').trim(),
                        bidTargetV2: runtime.bidTargetV2,
                        budgetType: String(seedStrategy.budgetType || wizardState.els.budgetTypeSelect?.value || 'day_average').trim() || 'day_average',
                        setSingleCostV2: runtime.bidMode === 'smart' && !!seedStrategy.setSingleCostV2,
                        singleCostV2: runtime.bidMode === 'smart' ? String(seedStrategy.singleCostV2 || '').trim() : '',
                        planName: ensureUniqueStrategyPlanName(`${planNameSeed}_${runtime.marketingGoal}`),
                        copyBatchCount: 1,
                        sceneSettingValues: strategySceneSettingValues,
                        sceneSettingTouched: strategySceneSettingTouched,
                        sceneSettings: strategySceneSettings
                    };
                    wizardState.strategyList.push(next);
                    created.push(next);
                });
                const currentEditing = created[created.length - 1] || created[0];
                if (currentEditing) {
                    wizardState.editingStrategyId = currentEditing.id;
                    setDetailVisible(true);
                    applyStrategyToDetailForm(currentEditing);
                }
                commitStrategyUiState();
                appendWizardLog(
                    `已生成其他策略：${created.length} 个（${created.map(item => item.marketingGoal || item.name).slice(0, 4).join('、')}）`,
                    'success'
                );
            };

            const commitStrategyUiState = (options = {}) => {
                syncDraftFromUI();
                renderStrategyList();
                if (options.renderSceneDynamic === true) {
                    renderSceneDynamicConfig();
                }
                if (options.refreshPreview !== false) {
                    refreshWizardPreview();
                }
            };

            const commitCrowdUiState = (options = {}) => {
                if (options.syncSceneSettings === true) {
                    syncSceneSettingValuesFromUI();
                }
                syncDraftFromUI();
                renderCrowdList();
                if (options.renderSceneDynamic === true) {
                    renderSceneDynamicConfig();
                }
                if (options.refreshPreview !== false) {
                    refreshWizardPreview();
                }
            };

            const commitSceneDynamicUiState = (options = {}) => {
                if (options.syncSceneSettings !== false) {
                    syncSceneSettingValuesFromUI();
                }
                syncDraftFromUI();
                if (options.renderStrategyList === true) {
                    renderStrategyList();
                }
                if (options.renderCrowdList === true) {
                    renderCrowdList();
                }
                if (options.renderSceneDynamic === true) {
                    renderSceneDynamicConfig();
                }
                if (options.refreshPreview !== false) {
                    refreshWizardPreview();
                }
            };

            const renderItemSelectionLists = (options = {}) => {
                if (options.renderAdded !== false) {
                    renderAddedList();
                }
                if (options.renderCandidate === true) {
                    renderCandidateList(options.candidateOptions || {});
                }
            };

            const commitItemSelectionUiState = (options = {}) => {
                syncDraftFromUI();
                renderItemSelectionLists(options);
                if (options.refreshPreview === true) {
                    refreshWizardPreview();
                }
            };

            const commitPreviewUiState = (options = {}) => {
                syncDraftFromUI();
                if (options.refreshPreview !== false) {
                    refreshWizardPreview();
                }
            };

            const commitDraftState = (draft = null) => {
                if (isPlainObject(draft)) {
                    KeywordPlanWizardStore.persistDraft(draft);
                    return draft;
                }
                syncDraftFromUI();
                return wizardState.draft;
            };

            const strategyTargetCostMeasureCanvas = document.createElement('canvas');
            const strategyTargetCostMeasureContext = strategyTargetCostMeasureCanvas.getContext('2d');

            const measureStrategyTargetCostInputWidth = (input = null) => {
                if (!(input instanceof HTMLInputElement) || !strategyTargetCostMeasureContext) return 0;
                const ownerWindow = input.ownerDocument?.defaultView || window;
                const computedStyle = ownerWindow.getComputedStyle(input);
                const fontSpec = computedStyle.font
                    || `${computedStyle.fontStyle} ${computedStyle.fontVariant} ${computedStyle.fontWeight} ${computedStyle.fontSize} / ${computedStyle.lineHeight} ${computedStyle.fontFamily}`;
                strategyTargetCostMeasureContext.font = fontSpec;
                const text = String(input.value || input.getAttribute('placeholder') || '').trim() || '0';
                const textWidth = Math.ceil(strategyTargetCostMeasureContext.measureText(text).width);
                const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
                const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
                const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
                const borderRight = parseFloat(computedStyle.borderRightWidth) || 0;
                const field = input.closest('.am-wxt-strategy-target-cost-field');
                const hasUnit = field instanceof HTMLElement && field.classList.contains('with-unit');
                const minWidth = hasUnit ? 48 : 36;
                return Math.max(minWidth, textWidth + paddingLeft + paddingRight + borderLeft + borderRight + 4);
            };

            const syncStrategyTargetCostInputWidth = (input = null) => {
                if (!(input instanceof HTMLInputElement)) return;
                const nextWidth = measureStrategyTargetCostInputWidth(input);
                if (nextWidth > 0) {
                    input.style.width = `${nextWidth}px`;
                } else {
                    input.style.removeProperty('width');
                }
            };

            const scheduleStrategyTargetCostInputWidthSync = (input = null) => {
                if (!(input instanceof HTMLInputElement)) return;
                const ownerWindow = input.ownerDocument?.defaultView || window;
                ownerWindow.requestAnimationFrame(() => {
                    syncStrategyTargetCostInputWidth(input);
                });
            };

            const renderStrategyList = () => {
                if (!wizardState.els.strategyList || !wizardState.els.strategyCount) return;
                wizardState.els.strategyList.innerHTML = '';
                const enabledCount = wizardState.strategyList.filter(item => item.enabled).length;
                wizardState.els.strategyCount.textContent = String(enabledCount);
                syncStrategyHeadActionState();
                const filteredStrategyList = getFilteredStrategyList();
                const strategySearchKeyword = getStrategySearchKeyword();
                if (!filteredStrategyList.length) {
                    const empty = document.createElement('div');
                    empty.className = 'am-wxt-strategy-empty';
                    empty.textContent = strategySearchKeyword
                        ? `未找到匹配“${wizardState.els.strategySearchInput?.value?.trim() || ''}”的计划`
                        : '暂无计划';
                    wizardState.els.strategyList.appendChild(empty);
                    setDetailVisible(wizardState.detailVisible);
                    renderRunModeMenu();
                    return;
                }
                const fallbackSceneName = getCurrentEditorSceneName();
                const sceneSettingsCache = new Map();
                const getSceneSettingsFor = (sceneName = '') => {
                    const targetScene = SCENE_OPTIONS.includes(String(sceneName || '').trim())
                        ? String(sceneName).trim()
                        : fallbackSceneName;
                    if (targetScene === '关键词推广') return {};
                    if (!sceneSettingsCache.has(targetScene)) {
                        sceneSettingsCache.set(targetScene, buildSceneSettingsPayload(targetScene));
                    }
                    return sceneSettingsCache.get(targetScene) || {};
                };
                filteredStrategyList.forEach((strategy) => {
                    const strategySceneName = SCENE_OPTIONS.includes(String(strategy?.sceneName || '').trim())
                        ? String(strategy.sceneName).trim()
                        : fallbackSceneName;
                    strategy.sceneName = strategySceneName;
                    const bidMode = normalizeBidMode(strategy.bidMode || 'smart', 'smart');
                    strategy.bidMode = bidMode;
                    const strategySceneSettings = normalizeSceneSettingsObject(strategy.sceneSettings || {});
                    const goalSceneSettings = Object.keys(strategySceneSettings).length
                        ? strategySceneSettings
                        : getSceneSettingsFor(strategySceneName);
                    strategy.marketingGoal = resolveStrategyMarketingGoal(strategy, goalSceneSettings, strategySceneName);
                    const strategyBidTargetCode = normalizeKeywordBidTargetOptionValue(
                        mapSceneBidTargetValue(strategy.bidTargetV2 || '') || strategy.bidTargetV2 || DEFAULTS.bidTargetV2
                    ) || DEFAULTS.bidTargetV2;
                    const bidTargetLabel = BID_TARGET_OPTIONS.find(item => item.value === strategyBidTargetCode)?.label || '获取成交量';
                    const bidModeLabel = bidMode === 'manual' ? '手动出价' : '智能出价';
                    const goalLabel = normalizeGoalLabel(strategy.marketingGoal || '') || '未设置目标';
                    const budgetLabel = String(strategy.dayAverageBudget || '').trim() || '100';
                    const strategyTargetCostConfig = resolveStrategyTargetCostConfig(strategyBidTargetCode);
                    const shouldShowStrategyTargetCostInput = strategySceneName === '关键词推广'
                        && bidMode === 'smart'
                        && !!strategyTargetCostConfig;
                    const strategyTargetCostValue = shouldShowStrategyTargetCostInput
                        ? resolveStrategyTargetCostValue(strategy, strategyBidTargetCode)
                        : '';
                    const showStrategyTargetCostUnit = shouldShowStrategyTargetCostInput && strategyBidTargetCode !== 'roi';
                    const copyBatchCount = Math.min(99, Math.max(1, toNumber(strategy.copyBatchCount, 1)));
                    strategy.copyBatchCount = copyBatchCount;
                    const row = document.createElement('div');
                    row.className = 'am-wxt-strategy-item';
                    row.innerHTML = `
                        <div class="am-wxt-strategy-main">
                            <div class="am-wxt-strategy-left">
                                <input type="checkbox" ${strategy.enabled ? 'checked' : ''} />
                                <span>${Utils.escapeHtml(getStrategyMainLabel(strategy))}</span>
                            </div>
                            <div class="am-wxt-strategy-right">
                                <span class="am-wxt-strategy-summary">${Utils.escapeHtml(goalLabel)} / ${Utils.escapeHtml(bidModeLabel)} / ${Utils.escapeHtml(bidTargetLabel)}</span>
                                ${shouldShowStrategyTargetCostInput ? `
                                    <label class="am-wxt-strategy-target-cost">
                                        <span>目标成本</span>
                                        <span class="am-wxt-strategy-target-cost-field ${showStrategyTargetCostUnit ? 'with-unit' : ''}">
                                            <input
                                                type="number"
                                                min="0.01"
                                                max="9999"
                                                step="0.01"
                                                value="${Utils.escapeHtml(strategyTargetCostValue)}"
                                                data-action="target-cost-input"
                                                data-target-code="${Utils.escapeHtml(strategyBidTargetCode)}"
                                                placeholder="${strategyBidTargetCode === 'roi' ? '例如 2.24' : '请输入'}"
                                            />
                                            ${showStrategyTargetCostUnit ? '<span class="am-wxt-strategy-target-cost-unit">元</span>' : ''}
                                        </span>
                                    </label>
                                ` : ''}
                                <span class="am-wxt-strategy-summary">/ 预算 ${Utils.escapeHtml(budgetLabel)} 元</span>
                                <button class="am-wxt-btn am-wxt-copy-btn" data-action="copy">
                                    <span>复制</span>
                                    <span class="am-wxt-copy-multi" data-action="copy-count-badge" title="点击增加，右键减少，滚轮可调节">
                                        <span class="am-wxt-copy-multi-icon">×</span>
                                        <span class="am-wxt-copy-multi-num">${copyBatchCount}</span>
                                    </span>
                                </button>
                                <button class="am-wxt-btn" data-action="delete">删除</button>
                                <button class="am-wxt-btn" data-action="edit">${wizardState.detailVisible && wizardState.editingStrategyId === strategy.id ? '编辑中' : '编辑计划'}</button>
                            </div>
                        </div>
                    `;
                    const checkbox = row.querySelector('input[type="checkbox"]');
                    const copyCountBadge = row.querySelector('[data-action="copy-count-badge"]');
                    const copyCountNum = row.querySelector('.am-wxt-copy-multi-num');
                    const copyBtn = row.querySelector('button[data-action="copy"]');
                    const deleteBtn = row.querySelector('button[data-action="delete"]');
                    const editBtn = row.querySelector('button[data-action="edit"]');
                    const targetCostInput = row.querySelector('input[data-action="target-cost-input"]');
                    let commitStrategyTargetCostInput = () => { };
                    checkbox.onchange = () => {
                        strategy.enabled = !!checkbox.checked;
                        commitStrategyUiState({ refreshPreview: false });
                    };
                    if (targetCostInput instanceof HTMLInputElement) {
                        const syncStrategyTargetCostInputOnly = () => {
                            syncStrategyTargetCostFields(strategy, strategyBidTargetCode, targetCostInput.value);
                            syncStrategyTargetCostInputWidth(targetCostInput);
                        };
                        commitStrategyTargetCostInput = () => {
                            const parsed = parseNumberFromSceneValue(targetCostInput.value);
                            const nextValue = syncStrategyTargetCostFields(strategy, strategyBidTargetCode, parsed);
                            targetCostInput.value = nextValue;
                            syncStrategyTargetCostInputWidth(targetCostInput);
                            if (wizardState.detailVisible && wizardState.editingStrategyId === strategy.id) {
                                applyStrategyToDetailForm(strategy);
                            }
                            syncDraftFromUI();
                            wizardState.renderPreview(wizardState.buildRequest());
                        };
                        targetCostInput.addEventListener('input', syncStrategyTargetCostInputOnly);
                        targetCostInput.addEventListener('change', commitStrategyTargetCostInput);
                        targetCostInput.addEventListener('click', (event) => {
                            event.stopPropagation();
                        });
                    }
                    if (copyCountBadge instanceof HTMLElement) {
                        const refreshCopyCount = () => {
                            if (copyCountNum instanceof HTMLElement) {
                                copyCountNum.textContent = String(strategy.copyBatchCount);
                            }
                        };
                        const setCopyCount = (next) => {
                            const nextCount = Math.min(99, Math.max(1, toNumber(next, 1)));
                            strategy.copyBatchCount = nextCount;
                            refreshCopyCount();
                            commitDraftState();
                        };
                        copyCountBadge.addEventListener('click', (event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setCopyCount(strategy.copyBatchCount + 1);
                        });
                        copyCountBadge.addEventListener('contextmenu', (event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setCopyCount(strategy.copyBatchCount - 1);
                        });
                        copyCountBadge.addEventListener('wheel', (event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            const delta = event.deltaY > 0 ? -1 : 1;
                            setCopyCount(strategy.copyBatchCount + delta);
                        }, { passive: false });
                    }
                    copyBtn.onclick = () => {
                        commitStrategyTargetCostInput();
                        const editing = getStrategyById(wizardState.editingStrategyId);
                        if (editing && wizardState.detailVisible) pullDetailFormToStrategy(editing);
                        const targetCopyCount = Math.min(99, Math.max(1, toNumber(strategy.copyBatchCount, 1)));
                        for (let idx = 1; idx <= targetCopyCount; idx++) {
                            const clone = deepClone(strategy);
                            clone.id = createStrategyCloneId(strategy.id || 'strategy');
                            clone.name = createStrategyCloneName(strategy.name || '计划');
                            clone.planName = buildCopiedStrategyPlanName(
                                strategy.planName || wizardState?.draft?.planNamePrefix || '',
                                getCurrentEditorSceneName(),
                                idx
                            );
                            clone.enabled = true;
                            clone.copyBatchCount = 1;
                            wizardState.strategyList.push(clone);
                        }
                        commitStrategyUiState();
                        appendWizardLog(`已复制计划：${targetCopyCount} 个`, 'success');
                    };
                    deleteBtn.onclick = () => {
                        commitStrategyTargetCostInput();
                        if ((wizardState.strategyList || []).length <= 1) {
                            appendWizardLog('至少保留 1 个计划', 'error');
                            return;
                        }
                        const removeIndex = wizardState.strategyList.findIndex(item => item.id === strategy.id);
                        if (removeIndex < 0) return;
                        const removed = wizardState.strategyList.splice(removeIndex, 1)[0];
                        if (wizardState.editingStrategyId === removed.id) {
                            const fallback = wizardState.strategyList[Math.max(0, removeIndex - 1)] || wizardState.strategyList[0] || null;
                            wizardState.editingStrategyId = fallback?.id || '';
                            if (fallback && wizardState.detailVisible) {
                                applyStrategyToDetailForm(fallback);
                            }
                        }
                        commitStrategyUiState();
                        appendWizardLog(`已删除计划：${removed?.name || ''}`, 'success');
                    };
                    editBtn.onclick = () => {
                        commitStrategyTargetCostInput();
                        openStrategyDetail(strategy.id);
                    };
                    wizardState.els.strategyList.appendChild(row);
                    scheduleStrategyTargetCostInputWidthSync(targetCostInput);
                });
                setDetailVisible(wizardState.detailVisible);
                renderRunModeMenu();
            };

            const syncDraftSceneIdentity = (draft, editingStrategy = null) => {
                const selectedScene = wizardState.els.sceneSelect?.value || draft.sceneName || '关键词推广';
                draft.sceneName = SCENE_OPTIONS.includes(selectedScene) ? selectedScene : '关键词推广';
                syncSceneSettingValuesFromUI();
                const prefixValue = wizardState.els.prefixInput?.value?.trim() || '';
                if (!editingStrategy || !wizardState.detailVisible) {
                    draft.planNamePrefix = prefixValue || draft.planNamePrefix || buildSceneTimePrefix(draft.sceneName);
                } else if (!draft.planNamePrefix) {
                    draft.planNamePrefix = buildSceneTimePrefix(draft.sceneName);
                }
            };

            const syncDraftGlobalDefaults = (draft, enabled = false) => {
                if (!enabled) return;
                draft.dayAverageBudget = wizardState.els.budgetInput?.value?.trim() || draft.dayAverageBudget || '';
                draft.defaultBidPrice = wizardState.els.bidInput?.value?.trim() || draft.defaultBidPrice || '1';
                draft.bidMode = normalizeBidMode(
                    wizardState.els.bidModeSelect?.value || draft.bidMode || 'smart',
                    'smart'
                );
                draft.keywordMode = wizardState.els.modeSelect?.value || draft.keywordMode || DEFAULTS.keywordMode;
                draft.recommendCount = wizardState.els.recommendCountInput?.value?.trim() || draft.recommendCount || String(DEFAULTS.recommendCount);
                draft.manualKeywords = wizardState.els.manualInput?.value || draft.manualKeywords || '';
            };

            const syncDraftViewState = (draft) => {
                draft.addedItems = wizardState.addedItems.map(item => ({ ...item }));
                draft.matrixConfig = syncMatrixMaterialDimensionValues(draft.matrixConfig, draft.addedItems, draft.sceneName);
                draft.crowdList = wizardState.crowdList.map(item => deepClone(item));
                draft.debugVisible = !!wizardState.debugVisible;
                draft.itemSplitExpanded = wizardState.itemSplitExpanded === true;
                draft.candidateListExpanded = wizardState.candidateListExpanded === true;
                draft.strategyList = wizardState.strategyList.map(item => deepClone(item));
                draft.editingStrategyId = wizardState.editingStrategyId || '';
                draft.detailVisible = !!wizardState.detailVisible;
                draft.workbenchPage = WORKBENCH_PAGE_SET.has(wizardState.workbenchPage) ? wizardState.workbenchPage : 'home';
            };

            const syncDraftMetaState = (draft) => {
                wizardState.manualKeywordPanelCollapsed = wizardState.manualKeywordPanelCollapsed !== false;
                draft.manualKeywordPanelCollapsed = wizardState.manualKeywordPanelCollapsed !== false;
                draft.useWordPackage = draft.useWordPackage !== false;
                draft.fallbackPolicy = normalizeWizardFallbackPolicy(draft.fallbackPolicy);
                syncMatrixConfigFromUI();
            };

            const syncDraftFromUI = () => {
                const draft = ensureWizardDraft();
                draft.schemaVersion = SESSION_DRAFT_SCHEMA_VERSION;
                const editingStrategy = getStrategyById(wizardState.editingStrategyId);
                const syncGlobalDefaults = !editingStrategy || !wizardState.detailVisible;
                KeywordPlanWizardStore.syncDraftSceneIdentity(draft, editingStrategy);
                KeywordPlanWizardStore.syncDraftGlobalDefaults(draft, syncGlobalDefaults);
                syncDraftMetaState(draft);
                wizardState.draft.submitMode = normalizeSubmitMode(wizardState.draft.submitMode || 'serial');
                wizardState.draft.parallelSubmitTimes = normalizeParallelSubmitTimes(
                    wizardState.draft.parallelSubmitTimes,
                    DEFAULT_SCENE_PARALLEL_SUBMIT_TIMES
                );
                if (editingStrategy && wizardState.detailVisible) {
                    pullDetailFormToStrategy(editingStrategy);
                }
                KeywordPlanWizardStore.syncDraftViewState(draft);
                KeywordPlanWizardStore.persistDraft(draft);
            };

            const normalizeDraftForUi = (draft = {}) => {
                const nextDraft = isPlainObject(draft) ? draft : ensureWizardDraft();
                nextDraft.fallbackPolicy = normalizeWizardFallbackPolicy(nextDraft.fallbackPolicy);
                if (!isPlainObject(nextDraft.sceneSettingValues)) {
                    nextDraft.sceneSettingValues = {};
                }
                if (!isPlainObject(nextDraft.sceneSettingTouched)) {
                    nextDraft.sceneSettingTouched = {};
                }
                nextDraft.itemSplitExpanded = nextDraft.itemSplitExpanded === true;
                nextDraft.candidateListExpanded = nextDraft.candidateListExpanded === true;
                nextDraft.manualKeywordPanelCollapsed = nextDraft.manualKeywordPanelCollapsed !== false;
                const sceneName = SCENE_OPTIONS.includes(nextDraft.sceneName) ? nextDraft.sceneName : '关键词推广';
                nextDraft.sceneName = sceneName || '关键词推广';
                nextDraft.useWordPackage = nextDraft.useWordPackage !== false;
                nextDraft.submitMode = normalizeSubmitMode(nextDraft.submitMode || 'serial');
                nextDraft.parallelSubmitTimes = normalizeParallelSubmitTimes(
                    nextDraft.parallelSubmitTimes,
                    DEFAULT_SCENE_PARALLEL_SUBMIT_TIMES
                );
                nextDraft.matrixConfig = normalizeMatrixConfig(nextDraft.matrixConfig, nextDraft.sceneName);
                if (isAutoGeneratedPlanPrefix(nextDraft.planNamePrefix || '') || !String(nextDraft.planNamePrefix || '').trim()) {
                    nextDraft.planNamePrefix = buildDefaultPlanPrefixByScene(nextDraft.sceneName);
                }
                return nextDraft;
            };

            const applyDraftStateToWizard = (draft = {}) => {
                wizardState.itemSplitExpanded = draft.itemSplitExpanded === true;
                wizardState.candidateListExpanded = draft.candidateListExpanded === true;
                wizardState.manualKeywordPanelCollapsed = draft.manualKeywordPanelCollapsed !== false;
                wizardState.workbenchPage = WORKBENCH_PAGE_SET.has(String(draft.workbenchPage || '').trim())
                    ? String(draft.workbenchPage || '').trim()
                    : 'home';
                wizardState.sceneProfiles = buildSceneProfiles();
                wizardState.crowdList = Array.isArray(draft.crowdList) ? draft.crowdList.map(item => deepClone(item)) : [];
                wizardState.strategyList = normalizeStrategyList(
                    draft.strategyList,
                    draft.dayAverageBudget || ''
                );
                wizardState.editingStrategyId = String(draft.editingStrategyId || wizardState.strategyList[0]?.id || '').trim();
            };

            const applyDraftValuesToControls = (draft = {}) => {
                if (wizardState.els.sceneSelect) wizardState.els.sceneSelect.value = draft.sceneName;
                if (wizardState.els.prefixInput) wizardState.els.prefixInput.value = draft.planNamePrefix || '';
                if (wizardState.els.budgetInput) wizardState.els.budgetInput.value = draft.dayAverageBudget || '';
                if (wizardState.els.bidInput) wizardState.els.bidInput.value = draft.defaultBidPrice || '';
                if (wizardState.els.bidModeSelect) wizardState.els.bidModeSelect.value = normalizeBidMode(draft.bidMode || 'smart', 'smart');
                if (wizardState.els.modeSelect) wizardState.els.modeSelect.value = draft.keywordMode || DEFAULTS.keywordMode;
                if (wizardState.els.recommendCountInput) wizardState.els.recommendCountInput.value = draft.recommendCount || String(DEFAULTS.recommendCount);
                if (wizardState.els.manualInput) wizardState.els.manualInput.value = draft.manualKeywords || '';
                setDetailVisible(!!draft.detailVisible);
                const editingStrategy = getStrategyById(wizardState.editingStrategyId);
                applyStrategyToDetailForm(editingStrategy || wizardState.strategyList[0] || null);
                updateBidModeControls(editingStrategy?.bidMode || draft.bidMode || 'smart');
                setDebugVisible(!!draft.debugVisible);
                renderRunModeMenu();
                setRunModeMenuOpen(false);
                setItemSplitExpanded(wizardState.itemSplitExpanded);
                setCandidateListExpanded(wizardState.candidateListExpanded);
            };

            const fillUIFromDraft = () => {
                const draft = KeywordPlanRuntime.normalizeDraftForUi(ensureWizardDraft());
                KeywordPlanRuntime.applyDraftStateToWizard(draft);
                KeywordPlanRuntime.applyDraftValuesToControls(draft);
            };
