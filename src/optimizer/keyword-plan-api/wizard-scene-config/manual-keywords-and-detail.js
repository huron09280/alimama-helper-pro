            const resolveManualKeywordHiddenInput = (panel) => {
                const scope = panel?.closest?.('.am-wxt-setting-control')
                    || panel?.parentElement
                    || wizardState.els?.sceneDynamic
                    || null;
                return scope?.querySelector?.('textarea[data-manual-keyword-hidden]') || null;
            };
            const applyManualKeywordRowsFromPanel = (panel, rows = []) => {
                const hidden = resolveManualKeywordHiddenInput(panel);
                if (!hidden) return;
                const enabledRows = rows.filter(item => item?.enabled !== false);
                const nextRows = uniqueBy(enabledRows, item => String(item?.word || '').trim()).slice(0, 200);
                const nextText = nextRows.map(item => formatKeywordLine(item)).join('\n');
                if (hidden.value !== nextText) hidden.value = nextText;
                hidden.dispatchEvent(new Event('input', { bubbles: true }));
                hidden.dispatchEvent(new Event('change', { bubbles: true }));
                renderSceneDynamicConfig();
            };
            const normalizeManualKeywordBidValue = (value, fallback = 1) => {
                const num = toNumber(value, fallback);
                const safeNum = Number.isFinite(num) ? Math.max(0, num) : Math.max(0, fallback);
                return String(safeNum.toFixed(4)).replace(/(?:\.0+|(\.\d+?)0+)$/, '$1');
            };
            const ensureManualKeywordPanelDelegates = () => {
                if (wizardState.manualKeywordDelegatedBound) return;
                if (!(wizardState.els?.sceneDynamic instanceof HTMLElement)) return;
                wizardState.manualKeywordDelegatedBound = true;

                wizardState.els.sceneDynamic.addEventListener('click', (event) => {
                    const target = event.target instanceof Element ? event.target.closest('button') : null;
                    if (!(target instanceof Element)) return;
                    const panel = target.closest('[data-manual-keyword-panel]');
                    if (!(panel instanceof Element)) return;
                    if (!target.matches('button[data-manual-keyword-menu-toggle]') && !target.matches('button[data-manual-keyword-batch-match]')) {
                        panel.querySelectorAll('[data-manual-keyword-match-menu].open').forEach(menu => menu.classList.remove('open'));
                    }

                    if (target.matches('button[data-manual-keyword-menu-toggle]')) {
                        const menu = target.closest('[data-manual-keyword-match-menu]');
                        if (!(menu instanceof Element)) return;
                        menu.classList.toggle('open');
                        return;
                    }

                    if (target.matches('button[data-manual-keyword-collapse-toggle]')) {
                        const nextCollapsed = !panel.classList.contains('is-collapsed');
                        panel.classList.toggle('is-collapsed', nextCollapsed);
                        panel.setAttribute('data-manual-keyword-collapsed', nextCollapsed ? '1' : '0');
                        target.setAttribute('aria-expanded', nextCollapsed ? 'false' : 'true');
                        target.textContent = nextCollapsed ? '展开' : '收起';
                        wizardState.manualKeywordPanelCollapsed = nextCollapsed;
                        ensureWizardDraft().manualKeywordPanelCollapsed = nextCollapsed;
                        commitDraftState();
                        return;
                    }

                    if (target.matches('button[data-manual-keyword-flow-toggle]')) {
                        const nextOn = !target.classList.contains('is-on');
                        target.classList.toggle('is-on', nextOn);
                        target.classList.toggle('is-off', !nextOn);
                        target.setAttribute('aria-pressed', nextOn ? 'true' : 'false');
                        const state = target.querySelector('.am-wxt-site-switch-state');
                        if (state) state.textContent = nextOn ? '开' : '关';
                        const flowCheckbox = target.closest('.am-wxt-manual-keyword-left-item')?.querySelector('input[data-manual-package-enable]');
                        if (flowCheckbox instanceof HTMLInputElement) {
                            flowCheckbox.checked = nextOn;
                        }
                        const status = target.closest('.am-wxt-manual-keyword-left-item')?.querySelector('.am-wxt-manual-left-meta.status');
                        if (status) status.textContent = nextOn ? '生效中' : '已关闭';
                        const flowScope = panel.closest('.am-wxt-setting-control') || panel.parentElement || panel;
                        const flowHidden = flowScope?.querySelector?.('input[data-manual-keyword-flow-hidden]');
                        if (flowHidden instanceof HTMLInputElement) {
                            flowHidden.value = nextOn ? '开启' : '关闭';
                            flowHidden.dispatchEvent(new Event('input', { bubbles: true }));
                            flowHidden.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                        const comboCount = Math.max(0, toNumber(panel.getAttribute('data-manual-keyword-combo-count'), 0));
                        const keywordCount = Math.max(0, toNumber(panel.getAttribute('data-manual-keyword-count'), 0));
                        const toolbarTips = panel.querySelector('.am-wxt-manual-keyword-toolbar .tips');
                        if (toolbarTips) {
                            toolbarTips.textContent = `已设置：${nextOn ? '开启' : '关闭'}流量智选，关键词组合 ${comboCount} 个、自选词 ${keywordCount} 个`;
                        }
                        const editingStrategy = getStrategyById(wizardState.editingStrategyId);
                        if (editingStrategy) {
                            editingStrategy.useWordPackage = nextOn;
                        }
                        syncSceneSettingValuesFromUI();
                        commitStrategyUiState();
                        return;
                    }

                    if (target.matches('button[data-manual-keyword-batch-bid]')) {
                        const selectedRows = Array.from(panel.querySelectorAll('[data-manual-keyword-row]')).filter(row => (
                            row.querySelector('input[data-manual-keyword-enable]')?.checked !== false
                        ));
                        if (!selectedRows.length) {
                            appendWizardLog('请先勾选关键词，再批量修改出价', 'error');
                            return;
                        }
                        const defaultBid = selectedRows[0]?.getAttribute('data-manual-keyword-bid') || String(toNumber(wizardState.els.bidInput?.value, 1));
                        const bidText = window.prompt('请输入批量基础出价（单位：元）', defaultBid) || '';
                        const inputText = String(bidText || '').trim();
                        if (!inputText) return;
                        const normalizedBid = normalizeManualKeywordBidValue(inputText, toNumber(defaultBid, toNumber(wizardState.els.bidInput?.value, 1)));
                        selectedRows.forEach(row => {
                            row.setAttribute('data-manual-keyword-bid', normalizedBid);
                            const bidInput = row.querySelector('input[data-manual-keyword-bid-input]');
                            if (bidInput instanceof HTMLInputElement) bidInput.value = normalizedBid;
                        });
                        applyManualKeywordRowsFromPanel(panel, collectManualKeywordRowsFromPanel(panel));
                        return;
                    }

                    if (target.matches('button[data-manual-keyword-batch-match]')) {
                        const nextMatch = parseMatchScope(target.getAttribute('data-manual-keyword-batch-match'), DEFAULTS.matchScope);
                        const selectedRows = Array.from(panel.querySelectorAll('[data-manual-keyword-row]')).filter(row => (
                            row.querySelector('input[data-manual-keyword-enable]')?.checked !== false
                        ));
                        if (!selectedRows.length) {
                            appendWizardLog('请先勾选关键词，再批量修改匹配方案', 'error');
                            return;
                        }
                        selectedRows.forEach(row => {
                            row.setAttribute('data-manual-keyword-match', String(nextMatch));
                        });
                        applyManualKeywordRowsFromPanel(panel, collectManualKeywordRowsFromPanel(panel));
                        return;
                    }

                    if (target.matches('button[data-manual-keyword-match]')) {
                        const row = target.closest('[data-manual-keyword-row]');
                        if (!(row instanceof Element)) return;
                        const nextMatch = parseMatchScope(target.getAttribute('data-manual-keyword-match'), DEFAULTS.matchScope);
                        row.setAttribute('data-manual-keyword-match', String(nextMatch));
                        applyManualKeywordRowsFromPanel(panel, collectManualKeywordRowsFromPanel(panel));
                        return;
                    }

                    if (target.matches('button[data-manual-keyword-add]')) {
                        const addedText = window.prompt('请输入关键词，每行一个，支持：关键词,出价,匹配方式（广泛/精准）', '') || '';
                        const inputText = String(addedText || '').trim();
                        if (!inputText) return;
                        const existingRows = collectManualKeywordRowsFromPanel(panel).filter(item => item?.enabled !== false);
                        const parsedRows = parseKeywords(inputText, {
                            bidPrice: toNumber(wizardState.els.bidInput?.value, 1),
                            matchScope: DEFAULTS.matchScope,
                            onlineStatus: DEFAULTS.keywordOnlineStatus
                        });
                        applyManualKeywordRowsFromPanel(
                            panel,
                            existingRows.concat(parsedRows).map(item => ({ ...item, enabled: true }))
                        );
                        return;
                    }

                    if (target.matches('button[data-manual-keyword-clear]')) {
                        applyManualKeywordRowsFromPanel(panel, []);
                    }
                });

                wizardState.els.sceneDynamic.addEventListener('change', (event) => {
                    const target = event.target instanceof Element ? event.target : null;
                    if (!(target instanceof Element)) return;
                    const panel = target.closest('[data-manual-keyword-panel]');
                    if (!(panel instanceof Element)) return;

                    if (target.matches('input[data-manual-keyword-check-all]')) {
                        const checkAll = !!target.checked;
                        panel.querySelectorAll('input[data-manual-keyword-enable]').forEach(input => {
                            input.checked = checkAll;
                        });
                        applyManualKeywordRowsFromPanel(panel, collectManualKeywordRowsFromPanel(panel));
                        return;
                    }

                    if (target.matches('input[data-manual-package-check-all]')) {
                        const checkAll = !!target.checked;
                        panel.querySelectorAll('input[data-manual-package-enable]').forEach(input => {
                            input.checked = checkAll;
                        });
                        return;
                    }

                    if (target.matches('input[data-manual-package-enable]')) {
                        const packageInputs = Array.from(panel.querySelectorAll('input[data-manual-package-enable]'));
                        const allChecked = packageInputs.length > 0 && packageInputs.every(input => !!input.checked);
                        const checkAllInput = panel.querySelector('input[data-manual-package-check-all]');
                        if (checkAllInput instanceof HTMLInputElement) {
                            checkAllInput.checked = allChecked;
                        }
                        return;
                    }

                    if (target.matches('input[data-manual-keyword-enable]')) {
                        applyManualKeywordRowsFromPanel(panel, collectManualKeywordRowsFromPanel(panel));
                        return;
                    }

                    if (target.matches('input[data-manual-keyword-bid-input]')) {
                        const row = target.closest('[data-manual-keyword-row]');
                        if (!(row instanceof Element)) return;
                        const normalizedBid = normalizeManualKeywordBidValue(
                            target.value,
                            toNumber(row.getAttribute('data-manual-keyword-bid'), toNumber(wizardState.els.bidInput?.value, 1))
                        );
                        target.value = normalizedBid;
                        row.setAttribute('data-manual-keyword-bid', normalizedBid);
                        applyManualKeywordRowsFromPanel(panel, collectManualKeywordRowsFromPanel(panel));
                    }
                });
            };
            ensureManualKeywordPanelDelegates();

            const resolveStrategyBoundMaterialId = (strategy = {}) => String(toIdValue(
                strategy?.materialId
                || strategy?.item?.materialId
                || strategy?.item?.itemId
                || strategy?.boundMaterialId
                || ''
            )).trim();

            const normalizeStrategyBoundItem = (strategy = {}) => {
                const materialId = resolveStrategyBoundMaterialId(strategy);
                const rawItem = isPlainObject(strategy?.item) ? strategy.item : null;
                if (rawItem) {
                    const normalizedItem = normalizeItem(rawItem);
                    const normalizedMaterialId = String(toIdValue(
                        normalizedItem?.materialId || normalizedItem?.itemId || ''
                    )).trim();
                    if (materialId && normalizedMaterialId !== materialId) {
                        normalizedItem.materialId = materialId;
                        normalizedItem.itemId = materialId;
                    }
                    if (!String(normalizedItem?.materialName || '').trim()) {
                        normalizedItem.materialName = String(strategy?.materialName || '').trim();
                    }
                    return normalizedItem;
                }
                if (!materialId) return null;
                return normalizeItem({
                    materialId,
                    itemId: materialId,
                    materialName: String(strategy?.materialName || '').trim() || `商品${materialId}`
                });
            };

            const resolveStrategyBoundItemList = (strategy = {}, itemList = []) => {
                const normalizedItems = Array.isArray(itemList)
                    ? itemList.map(item => normalizeItem(item)).filter(item => item?.materialId)
                    : [];
                const materialId = resolveStrategyBoundMaterialId(strategy);
                if (!materialId) return normalizedItems;
                const matchedItem = resolveMatrixBoundItem(materialId, normalizedItems);
                if (matchedItem) return [matchedItem];
                const fallbackItem = normalizeStrategyBoundItem(strategy);
                if (fallbackItem?.materialId) return [fallbackItem];
                throw new Error(`计划绑定商品已失效：${materialId}`);
            };

            const buildMaterializedStrategyManualKeywords = (keywordList = []) => (
                (Array.isArray(keywordList) ? keywordList : [])
                    .map(item => (
                        isPlainObject(item)
                            ? formatKeywordLine(item)
                            : String(item || '').trim()
                    ))
                    .filter(Boolean)
                    .join('\n')
            );

            const normalizeStrategyList = (rawList, fallbackBudget = '') => {
                const fallback = getDefaultStrategyList();
                const input = Array.isArray(rawList) && rawList.length ? rawList : fallback;
                return input.map((item, idx) => {
                    const base = fallback[idx] || fallback[0];
                    const sceneName = SCENE_OPTIONS.includes(String(item?.sceneName || '').trim())
                        ? String(item.sceneName).trim()
                        : (SCENE_OPTIONS.includes(String(wizardState?.draft?.sceneName || '').trim())
                            ? String(wizardState.draft.sceneName).trim()
                            : getCurrentEditorSceneName());
                    const id = String(item?.id || base?.id || `strategy_${idx + 1}`).trim();
                    const name = String(item?.name || base?.name || `${getCurrentEditorSceneName()}-策略${idx + 1}`).trim();
                    const enabled = item?.enabled !== false;
                    const dayAverageBudget = String(item?.dayAverageBudget ?? fallbackBudget ?? '').trim();
                    const defaultBidPrice = String(item?.defaultBidPrice ?? '1').trim() || '1';
                    const keywordMode = String(item?.keywordMode || DEFAULTS.keywordMode).trim() || DEFAULTS.keywordMode;
                    const useWordPackage = item?.useWordPackage !== false;
                    const recommendCount = String(item?.recommendCount ?? DEFAULTS.recommendCount).trim() || String(DEFAULTS.recommendCount);
                    const manualKeywords = String(item?.manualKeywords || '').trim();
                    const bidMode = normalizeBidMode(
                        item?.bidMode
                        || item?.campaignOverride?.bidTypeV2
                        || base?.bidMode
                        || wizardState?.draft?.bidMode
                        || 'smart',
                        'smart'
                    );
                    const bidTargetV2 = String(item?.bidTargetV2 || DEFAULTS.bidTargetV2).trim() || DEFAULTS.bidTargetV2;
                    const budgetType = String(item?.budgetType || 'day_average').trim() || 'day_average';
                    const setSingleCostV2 = bidMode === 'smart' && item?.setSingleCostV2 === true;
                    const singleCostV2 = String(item?.singleCostV2 || '').trim();
                    const planName = String(item?.planName || '').trim();
                    const autoPlanPrefix = String(item?.autoPlanPrefix || '').trim();
                    const copyBatchCount = Math.min(99, Math.max(1, toNumber(item?.copyBatchCount ?? item?.copyCount, 1)));
                    const sceneSettingValues = normalizeSceneSettingBucketValues(item?.sceneSettingValues || {}, sceneName);
                    const sceneSettingTouched = normalizeSceneSettingTouchedValues(item?.sceneSettingTouched || {}, sceneName);
                    const sceneSettings = normalizeSceneSettingsObject(item?.sceneSettings || {});
                    const strategyGoalSceneSettings = Object.keys(sceneSettingValues).length
                        ? sceneSettingValues
                        : sceneSettings;
                    const materialId = resolveStrategyBoundMaterialId(item);
                    const itemSnapshot = normalizeStrategyBoundItem(item);
                    const materialName = String(item?.materialName || itemSnapshot?.materialName || '').trim();
                    const matrixMaterialized = item?.matrixMaterialized === true;
                    const matrixCombination = isPlainObject(item?.matrixCombination)
                        ? mergeDeep({}, item.matrixCombination)
                        : null;
                    const marketingGoal = normalizeGoalLabel(resolveStrategyMarketingGoal({
                        ...item,
                        bidMode,
                        bidTargetV2,
                        marketingGoal: item?.marketingGoal || base?.marketingGoal || ''
                    }, strategyGoalSceneSettings, sceneName));
                    return {
                        sceneName,
                        id,
                        name,
                        marketingGoal,
                        enabled,
                        bidMode,
                        dayAverageBudget,
                        defaultBidPrice,
                        keywordMode,
                        useWordPackage,
                        recommendCount,
                        manualKeywords,
                        bidTargetV2,
                        budgetType,
                        setSingleCostV2,
                        singleCostV2,
                        planName,
                        autoPlanPrefix,
                        copyBatchCount,
                        sceneSettingValues,
                        sceneSettingTouched,
                        sceneSettings,
                        materialId,
                        materialName,
                        item: itemSnapshot,
                        matrixMaterialized,
                        matrixCombination
                    };
                });
            };

            const materializeStrategyListFromPlans = (plans = []) => normalizeStrategyList(
                (Array.isArray(plans) ? plans : []).map((plan, idx) => {
                    const sceneName = SCENE_OPTIONS.includes(String(plan?.sceneName || '').trim())
                        ? String(plan.sceneName).trim()
                        : (SCENE_OPTIONS.includes(String(wizardState?.draft?.sceneName || '').trim())
                            ? String(wizardState.draft.sceneName).trim()
                            : getCurrentEditorSceneName());
                    const budget = isPlainObject(plan?.budget) ? plan.budget : {};
                    const hasDayBudget = budget.dayBudget !== undefined && budget.dayBudget !== null && budget.dayBudget !== '';
                    const budgetValue = hasDayBudget ? budget.dayBudget : budget.dayAverageBudget;
                    const campaignOverride = isPlainObject(plan?.campaignOverride) ? plan.campaignOverride : {};
                    const bidMode = normalizeBidMode(
                        plan?.bidMode || campaignOverride?.bidTypeV2 || 'smart',
                        'smart'
                    );
                    const bidTargetV2 = String(
                        campaignOverride?.bidTargetV2
                        || campaignOverride?.optimizeTarget
                        || plan?.bidTargetV2
                        || DEFAULTS.bidTargetV2
                    ).trim() || DEFAULTS.bidTargetV2;
                    const sceneSettings = normalizeSceneSettingsObject(plan?.sceneSettings || {});
                    const sceneSettingValues = normalizeSceneSettingBucketValues(
                        plan?.sceneSettingValues || sceneSettings,
                        sceneName
                    );
                    const rawItem = normalizeItem(plan?.item || {});
                    const materialId = String(toIdValue(rawItem?.materialId || rawItem?.itemId || '')).trim();
                    const materialName = String(rawItem?.materialName || rawItem?.name || '').trim();
                    const strategyName = String(plan?.planName || '').trim() || `矩阵计划${idx + 1}`;
                    return {
                        sceneName,
                        id: createStrategyCloneId('matrix_plan'),
                        name: strategyName,
                        marketingGoal: normalizeGoalLabel(
                            plan?.marketingGoal || resolveStrategyMarketingGoal({
                                marketingGoal: plan?.marketingGoal || '',
                                bidMode,
                                bidTargetV2,
                                planName: plan?.planName || ''
                            }, sceneSettings, sceneName)
                        ),
                        enabled: true,
                        bidMode,
                        dayAverageBudget: budgetValue === undefined || budgetValue === null || budgetValue === ''
                            ? ''
                            : String(budgetValue).trim(),
                        defaultBidPrice: String(plan?.keywordDefaults?.bidPrice ?? '1').trim() || '1',
                        keywordMode: String(plan?.keywordSource?.mode || DEFAULTS.keywordMode).trim() || DEFAULTS.keywordMode,
                        useWordPackage: plan?.keywordSource?.useWordPackage !== false,
                        recommendCount: String(plan?.keywordSource?.recommendCount ?? DEFAULTS.recommendCount).trim() || String(DEFAULTS.recommendCount),
                        manualKeywords: buildMaterializedStrategyManualKeywords(plan?.keywords),
                        bidTargetV2,
                        budgetType: hasDayBudget ? 'day_budget' : 'day_average',
                        setSingleCostV2: bidMode === 'smart'
                            && campaignOverride?.setSingleCostV2 === true
                            && Number.isFinite(toNumber(campaignOverride?.singleCostV2, NaN))
                            && toNumber(campaignOverride?.singleCostV2, NaN) > 0,
                        singleCostV2: bidMode === 'smart' && campaignOverride?.setSingleCostV2 === true
                            ? String(campaignOverride?.singleCostV2 ?? '').trim()
                            : '',
                        planName: String(plan?.planName || '').trim(),
                        autoPlanPrefix: '',
                        copyBatchCount: 1,
                        sceneSettingValues,
                        sceneSettingTouched: normalizeSceneSettingTouchedValues({}),
                        sceneSettings,
                        materialId,
                        materialName,
                        item: rawItem?.materialId ? rawItem : null,
                        matrixMaterialized: true,
                        matrixCombination: isPlainObject(plan?.matrixCombination)
                            ? mergeDeep({}, plan.matrixCombination)
                            : null
                    };
                }),
                wizardState?.draft?.dayAverageBudget || ''
            );

            const getSelectedStrategyList = () => (
                Array.isArray(wizardState?.strategyList)
                    ? wizardState.strategyList.filter(item => item?.enabled !== false)
                    : []
            );

            const normalizeStrategySearchText = (text = '') => String(text || '').trim().toLowerCase();

            const getStrategySearchKeyword = () => normalizeStrategySearchText(
                wizardState?.els?.strategySearchInput?.value || ''
            );

            const isStrategyMatchedBySearch = (strategy = {}, keyword = '') => {
                const normalizedKeyword = normalizeStrategySearchText(keyword);
                if (!normalizedKeyword) return true;
                const candidateTexts = [
                    getStrategyMainLabel(strategy),
                    strategy?.planName,
                    strategy?.name
                ]
                    .map(item => normalizeStrategySearchText(item))
                    .filter(Boolean);
                return candidateTexts.some(text => text.includes(normalizedKeyword));
            };

            const getFilteredStrategyList = () => {
                const strategyList = Array.isArray(wizardState?.strategyList) ? wizardState.strategyList : [];
                const keyword = getStrategySearchKeyword();
                if (!keyword) return strategyList;
                return strategyList.filter(strategy => isStrategyMatchedBySearch(strategy, keyword));
            };

            const setFilteredStrategiesEnabled = (enabled = true) => {
                const filteredStrategyList = getFilteredStrategyList();
                filteredStrategyList.forEach((strategy) => {
                    if (!isPlainObject(strategy)) return;
                    strategy.enabled = !!enabled;
                });
                return filteredStrategyList.length;
            };

            const resolveBatchEditableStrategyTargetCostCode = (strategy = {}) => {
                const sceneName = SCENE_OPTIONS.includes(String(strategy?.sceneName || '').trim())
                    ? String(strategy.sceneName).trim()
                    : getCurrentEditorSceneName();
                if (sceneName !== '关键词推广') return '';
                const bidMode = normalizeBidMode(strategy?.bidMode || 'smart', 'smart');
                if (bidMode !== 'smart') return '';
                return normalizeKeywordBidTargetOptionValue(
                    mapSceneBidTargetValue(strategy?.bidTargetV2 || '') || strategy?.bidTargetV2 || DEFAULTS.bidTargetV2
                ) || '';
            };

            const isBatchEditableStrategyTargetCostEnabled = (strategy = {}) => {
                const bidTargetCode = resolveBatchEditableStrategyTargetCostCode(strategy);
                return !!(bidTargetCode && resolveStrategyTargetCostConfig(bidTargetCode));
            };

            const countBatchEditableStrategyTargetCostPlans = (strategies = []) => (
                (Array.isArray(strategies) ? strategies : []).reduce((count, strategy) => (
                    isBatchEditableStrategyTargetCostEnabled(strategy) ? count + 1 : count
                ), 0)
            );

            const getBatchStrategyNumberFieldSeedValue = (strategies = [], fieldKey = '') => {
                const list = Array.isArray(strategies) ? strategies : [];
                if (!list.length) return '';
                if (fieldKey === 'targetCostValue') {
                    const targetStrategy = list.find(item => isBatchEditableStrategyTargetCostEnabled(item));
                    if (!targetStrategy) return '';
                    return resolveStrategyTargetCostValue(
                        targetStrategy,
                        resolveBatchEditableStrategyTargetCostCode(targetStrategy)
                    );
                }
                const seedStrategy = list[0] || {};
                if (fieldKey === 'dayAverageBudget') {
                    return String(seedStrategy?.dayAverageBudget || wizardState?.draft?.dayAverageBudget || '100').trim() || '100';
                }
                if (fieldKey === 'defaultBidPrice') {
                    return String(seedStrategy?.defaultBidPrice || wizardState?.draft?.defaultBidPrice || '1').trim() || '1';
                }
                if (fieldKey === 'recommendCount') {
                    return String(seedStrategy?.recommendCount || wizardState?.draft?.recommendCount || DEFAULTS.recommendCount).trim() || String(DEFAULTS.recommendCount);
                }
                return '';
            };

            const normalizeBatchStrategyNumberEditValues = (rawValues = {}) => {
                const normalizedValues = {};
                const normalizeDecimalValue = (rawValue = '', label = '', options = {}) => {
                    const text = String(rawValue || '').trim();
                    if (!text) return '';
                    const amount = parseNumberFromSceneValue(text);
                    const min = Number.isFinite(options.min) ? options.min : 0;
                    const max = Number.isFinite(options.max) ? options.max : 9999;
                    if (!Number.isFinite(amount) || amount <= min || amount > max) {
                        throw new Error(`${label}需填写大于 ${min} 且不超过 ${max} 的数值`);
                    }
                    return toShortSceneValue(String(amount)) || String(amount);
                };
                const normalizeIntegerValue = (rawValue = '', label = '', options = {}) => {
                    const text = String(rawValue || '').trim();
                    if (!text) return '';
                    const amount = Number(text);
                    const min = Number.isFinite(options.min) ? options.min : 1;
                    const max = Number.isFinite(options.max) ? options.max : 200;
                    if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount < min || amount > max) {
                        throw new Error(`${label}需填写 ${min}-${max} 的整数`);
                    }
                    return String(amount);
                };
                const budgetValue = normalizeDecimalValue(rawValues.dayAverageBudget, '预算值', { min: 0, max: 999999 });
                const bidValue = normalizeDecimalValue(rawValues.defaultBidPrice, '默认出价', { min: 0, max: 9999 });
                const recommendValue = normalizeIntegerValue(rawValues.recommendCount, '推荐词目标数', { min: 1, max: 200 });
                const targetCostValue = normalizeDecimalValue(rawValues.targetCostValue, '目标成本/ROI', { min: 0, max: 9999 });
                if (budgetValue) normalizedValues.dayAverageBudget = budgetValue;
                if (bidValue) normalizedValues.defaultBidPrice = bidValue;
                if (recommendValue) normalizedValues.recommendCount = recommendValue;
                if (targetCostValue) normalizedValues.targetCostValue = targetCostValue;
                return normalizedValues;
            };

            const applyBatchNumberEditToStrategies = (strategies = [], values = {}) => {
                const targetStrategies = Array.isArray(strategies)
                    ? strategies.filter(item => isPlainObject(item))
                    : [];
                const hasBudget = typeof values.dayAverageBudget === 'string' && values.dayAverageBudget !== '';
                const hasBidPrice = typeof values.defaultBidPrice === 'string' && values.defaultBidPrice !== '';
                const hasRecommendCount = typeof values.recommendCount === 'string' && values.recommendCount !== '';
                const hasTargetCost = typeof values.targetCostValue === 'string' && values.targetCostValue !== '';
                let updatedCount = 0;
                let targetCostAppliedCount = 0;
                targetStrategies.forEach((strategy) => {
                    let changed = false;
                    if (hasBudget) {
                        strategy.dayAverageBudget = values.dayAverageBudget;
                        changed = true;
                    }
                    if (hasBidPrice) {
                        strategy.defaultBidPrice = values.defaultBidPrice;
                        changed = true;
                    }
                    if (hasRecommendCount) {
                        strategy.recommendCount = values.recommendCount;
                        changed = true;
                    }
                    if (hasTargetCost) {
                        const bidTargetCode = resolveBatchEditableStrategyTargetCostCode(strategy);
                        if (bidTargetCode && resolveStrategyTargetCostConfig(bidTargetCode)) {
                            syncStrategyTargetCostFields(strategy, bidTargetCode, values.targetCostValue);
                            targetCostAppliedCount += 1;
                            changed = true;
                        }
                    }
                    if (changed) updatedCount += 1;
                });
                return {
                    updatedCount,
                    targetCostAppliedCount
                };
            };

            const getStrategyById = (strategyId) => wizardState.strategyList.find(item => item.id === strategyId) || null;

            const openBatchStrategyPopupDialog = ({
                title = '',
                bodyHtml = '',
                onMounted = null,
                onSave = null,
                dialogClassName = '',
                cancelLabel = '取消',
                saveLabel = '保存'
            } = {}) => (
                new Promise((resolve) => {
                    const previousMask = document.getElementById('am-wxt-scene-popup-mask');
                    if (previousMask) previousMask.remove();
                    const mask = document.createElement('div');
                    mask.id = 'am-wxt-scene-popup-mask';
                    mask.className = 'am-wxt-scene-popup-mask';
                    const dialogClass = `am-wxt-scene-popup-dialog${String(dialogClassName || '').trim() ? ` ${String(dialogClassName || '').trim()}` : ''}`;
                    mask.innerHTML = `
                        <div class="${Utils.escapeHtml(dialogClass)}" role="dialog" aria-modal="true">
                            <div class="am-wxt-scene-popup-head">
                                <span>${Utils.escapeHtml(title || '批量修改')}</span>
                                <button type="button" class="am-wxt-btn" data-scene-popup-close="1">关闭</button>
                            </div>
                            <div class="am-wxt-scene-popup-body">${bodyHtml || ''}</div>
                            <div class="am-wxt-scene-popup-foot">
                                <button type="button" class="am-wxt-btn" data-scene-popup-cancel="1">${Utils.escapeHtml(cancelLabel || '取消')}</button>
                                <button type="button" class="am-wxt-btn primary" data-scene-popup-save="1">${Utils.escapeHtml(saveLabel || '保存')}</button>
                            </div>
                        </div>
                    `;
                    const handleEscClose = (event) => {
                        if (event?.key !== 'Escape') return;
                        event.preventDefault();
                        close(null);
                    };
                    const close = (payload = null) => {
                        document.removeEventListener('keydown', handleEscClose, true);
                        mask.remove();
                        resolve(payload);
                    };
                    mask.addEventListener('click', (event) => {
                        if (event.target === mask) close(null);
                    });
                    document.addEventListener('keydown', handleEscClose, true);
                    const closeBtn = mask.querySelector('[data-scene-popup-close]');
                    const cancelBtn = mask.querySelector('[data-scene-popup-cancel]');
                    const saveBtn = mask.querySelector('[data-scene-popup-save]');
                    if (closeBtn instanceof HTMLButtonElement) closeBtn.onclick = () => close(null);
                    if (cancelBtn instanceof HTMLButtonElement) cancelBtn.onclick = () => close(null);
                    if (saveBtn instanceof HTMLButtonElement) {
                        saveBtn.onclick = () => {
                            try {
                                const payload = typeof onSave === 'function' ? onSave(mask) : {};
                                if (payload && payload.ok === false) return;
                                close(payload || {});
                            } catch (err) {
                                appendWizardLog(`保存配置失败：${err?.message || err}`, 'error');
                            }
                        };
                    }
                    document.body.appendChild(mask);
                    if (typeof onMounted === 'function') {
                        try {
                            onMounted(mask);
                        } catch (err) {
                            appendWizardLog(`初始化批量编辑弹窗失败：${err?.message || err}`, 'error');
                        }
                    }
                })
            );

