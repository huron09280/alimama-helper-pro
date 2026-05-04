                const openCrowdLaunchSettingPopup = async () => {
                    const popupPayload = await openKeywordAdvancedSettingPopup('launchArea');
                    if (!popupPayload || popupPayload.ok !== true) return null;
                    const { result, launchPeriodControl, launchAreaControl } = popupPayload;
                    return {
                        ok: true,
                        result,
                        launchPeriodControl,
                        launchAreaControl
                    };
                };

                const openCrowdFilterSettingPopup = async () => {
                    const filterControl = resolveScenePopupControl('campaign.crowdFilterConfig', 'crowdFilter');
                    if (!(filterControl instanceof HTMLInputElement)) return null;
                    const crowdNameCandidates = uniqueBy(
                        (Array.isArray(wizardState.crowdList) ? wizardState.crowdList : [])
                            .map((item, idx) => normalizeSceneSettingValue(
                                item?.crowd?.label?.name
                                || item?.crowd?.label?.labelName
                                || item?.crowd?.name
                                || item?.name
                                || item?.title
                                || item?.crowdId
                                || `人群${idx + 1}`
                            ))
                            .filter(Boolean),
                        item => item
                    );
                    const interactiveCandidates = uniqueBy(
                        CROWD_FILTER_INTERACTIVE_OPTIONS.concat(crowdNameCandidates)
                            .map(item => normalizeSceneSettingValue(item))
                            .filter(Boolean),
                        item => item
                    ).slice(0, 100);
                    const result = await openScenePopupDialog({
                        title: '设置过滤人群',
                        dialogClassName: 'am-wxt-scene-popup-dialog-filter',
                        closeLabel: '×',
                        cancelLabel: '取消',
                        saveLabel: '确定',
                        saveFirst: true,
                        defaultFocus: 'cancel',
                        bodyHtml: `
                            <div class="am-wxt-scene-popup-tips">系统将对您“勾选添加”的特征人群进行屏蔽，不勾选不会屏蔽过滤。请谨慎过滤，以免屏蔽过多消费者导致无曝光。</div>
                            <div class="am-wxt-scene-filter-layout">
                                <section class="am-wxt-scene-filter-left">
                                    <div class="am-wxt-scene-filter-tabs">
                                        <button type="button" class="am-wxt-scene-filter-tab active" data-scene-popup-filter-tab="genderAge">屏蔽性别年龄人群</button>
                                        <button type="button" class="am-wxt-scene-filter-tab" data-scene-popup-filter-tab="interactive">屏蔽互动人群</button>
                                        <button type="button" class="am-wxt-scene-filter-tab" data-scene-popup-filter-tab="custom">屏蔽自定义人群</button>
                                    </div>
                                    <section class="am-wxt-scene-filter-panel active" data-scene-popup-filter-panel="genderAge">
                                        <div class="am-wxt-scene-filter-group">
                                            <div class="am-wxt-scene-filter-group-title">用户性别</div>
                                            <div class="am-wxt-scene-filter-option-grid" data-scene-popup-filter-gender-grid="1"></div>
                                        </div>
                                        <div class="am-wxt-scene-filter-group">
                                            <div class="am-wxt-scene-filter-group-title">用户年龄</div>
                                            <div class="am-wxt-scene-filter-option-grid" data-scene-popup-filter-age-grid="1"></div>
                                        </div>
                                    </section>
                                    <section class="am-wxt-scene-filter-panel" data-scene-popup-filter-panel="interactive">
                                        <div class="am-wxt-scene-filter-group">
                                            <div class="am-wxt-scene-filter-group-title">互动人群</div>
                                            <div class="am-wxt-scene-filter-option-grid" data-scene-popup-filter-interactive-grid="1"></div>
                                            <div class="am-wxt-scene-filter-tools">
                                                <input
                                                    type="text"
                                                    class="am-wxt-scene-filter-custom-input"
                                                    data-scene-popup-filter-interactive-input="1"
                                                    placeholder="支持手动补充互动人群，多个名称可用逗号分隔"
                                                />
                                                <button type="button" class="am-wxt-btn" data-scene-popup-filter-interactive-add="1">添加人群</button>
                                            </div>
                                        </div>
                                    </section>
                                    <section class="am-wxt-scene-filter-panel" data-scene-popup-filter-panel="custom">
                                        <div class="am-wxt-scene-filter-group">
                                            <div class="am-wxt-scene-filter-group-title">自定义人群</div>
                                            <textarea
                                                class="am-wxt-scene-filter-custom-input"
                                                data-scene-popup-filter-custom-input="1"
                                                placeholder="每行一个人群名称，点击“添加人群”后写入已选列表"
                                            ></textarea>
                                            <div class="am-wxt-scene-filter-tools">
                                                <button type="button" class="am-wxt-btn" data-scene-popup-filter-custom-add="1">添加人群</button>
                                            </div>
                                        </div>
                                    </section>
                                </section>
                                <aside class="am-wxt-scene-filter-right">
                                    <div class="am-wxt-scene-filter-selected-head">
                                        <span>已选人群（<b data-scene-popup-filter-selected-count="1">0</b>/100）</span>
                                    </div>
                                    <div class="am-wxt-scene-filter-selected-list" data-scene-popup-filter-selected-list="1"></div>
                                </aside>
                            </div>
                            <div class="am-wxt-scene-filter-footnote" data-scene-popup-filter-coverage="1">屏蔽预计覆盖人群：0</div>
                        `,
                        onMounted: (mask) => {
                            let activeTab = 'genderAge';
                            let filterConfig = normalizeCrowdFilterConfig(filterControl.value || '{}');
                            const genderGrid = mask.querySelector('[data-scene-popup-filter-gender-grid="1"]');
                            const ageGrid = mask.querySelector('[data-scene-popup-filter-age-grid="1"]');
                            const interactiveGrid = mask.querySelector('[data-scene-popup-filter-interactive-grid="1"]');
                            const interactiveInput = mask.querySelector('[data-scene-popup-filter-interactive-input="1"]');
                            const customInput = mask.querySelector('[data-scene-popup-filter-custom-input="1"]');
                            const selectedCountEl = mask.querySelector('[data-scene-popup-filter-selected-count="1"]');
                            const selectedListEl = mask.querySelector('[data-scene-popup-filter-selected-list="1"]');
                            const coverageEl = mask.querySelector('[data-scene-popup-filter-coverage="1"]');
                            const tabButtons = Array.from(mask.querySelectorAll('[data-scene-popup-filter-tab]'));
                            const panels = Array.from(mask.querySelectorAll('[data-scene-popup-filter-panel]'));
                            const normalizeGenderState = () => {
                                const safe = uniqueBy(
                                    (Array.isArray(filterConfig.gender) ? filterConfig.gender : [])
                                        .map(item => String(item || '').trim())
                                        .filter(item => item === 'female' || item === 'male' || item === 'all'),
                                    item => item
                                );
                                filterConfig.gender = !safe.length || safe.includes('all')
                                    ? ['all']
                                    : safe.filter(item => item !== 'all');
                            };
                            const normalizeAgeState = () => {
                                const allowSet = new Set(CROWD_FILTER_AGE_OPTIONS.map(item => item.value));
                                const safe = uniqueBy(
                                    (Array.isArray(filterConfig.age) ? filterConfig.age : [])
                                        .map(item => String(item || '').trim())
                                        .filter(item => item === 'all' || allowSet.has(item)),
                                    item => item
                                );
                                filterConfig.age = !safe.length || safe.includes('all')
                                    ? ['all']
                                    : safe.filter(item => item !== 'all');
                            };
                            const ensureSelectionLimit = () => {
                                let selectedList = collectCrowdFilterSelectedList(filterConfig);
                                if (selectedList.length <= 100) return;
                                let overflow = selectedList.length - 100;
                                if (overflow > 0) {
                                    const customList = normalizeCrowdFilterFlatList(filterConfig.blockedCustom);
                                    filterConfig.blockedCustom = customList.slice(0, Math.max(0, customList.length - overflow));
                                }
                                selectedList = collectCrowdFilterSelectedList(filterConfig);
                                overflow = selectedList.length - 100;
                                if (overflow > 0) {
                                    const interactiveList = normalizeCrowdFilterFlatList(filterConfig.blockedInteractive);
                                    filterConfig.blockedInteractive = interactiveList.slice(0, Math.max(0, interactiveList.length - overflow));
                                }
                            };
                            const renderTabs = () => {
                                tabButtons.forEach(btn => {
                                    if (!(btn instanceof HTMLButtonElement)) return;
                                    const key = String(btn.getAttribute('data-scene-popup-filter-tab') || '').trim();
                                    const active = key === activeTab;
                                    btn.classList.toggle('active', active);
                                    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
                                });
                                panels.forEach(panel => {
                                    if (!(panel instanceof HTMLElement)) return;
                                    const key = String(panel.getAttribute('data-scene-popup-filter-panel') || '').trim();
                                    const active = key === activeTab;
                                    panel.classList.toggle('active', active);
                                    panel.hidden = !active;
                                });
                            };
                            const renderGenderAge = () => {
                                normalizeGenderState();
                                normalizeAgeState();
                                if (genderGrid instanceof HTMLElement) {
                                    const selectedSet = new Set(filterConfig.gender);
                                    const options = [{ value: 'all', label: '不限' }].concat(CROWD_FILTER_GENDER_OPTIONS);
                                    genderGrid.innerHTML = options.map(option => {
                                        const active = option.value === 'all'
                                            ? selectedSet.has('all')
                                            : (!selectedSet.has('all') && selectedSet.has(option.value));
                                        return `
                                            <label
                                                class="am-wxt-scene-filter-option-check ${active ? 'active' : ''}"
                                                data-scene-popup-filter-gender="${Utils.escapeHtml(option.value)}"
                                            >
                                                <input type="checkbox" ${active ? 'checked' : ''} />
                                                <span>${Utils.escapeHtml(option.label)}</span>
                                            </label>
                                        `;
                                    }).join('');
                                }
                                if (ageGrid instanceof HTMLElement) {
                                    const selectedSet = new Set(filterConfig.age);
                                    const options = [{ value: 'all', label: '不限' }].concat(CROWD_FILTER_AGE_OPTIONS);
                                    ageGrid.innerHTML = options.map(option => {
                                        const active = option.value === 'all'
                                            ? selectedSet.has('all')
                                            : (!selectedSet.has('all') && selectedSet.has(option.value));
                                        return `
                                            <label
                                                class="am-wxt-scene-filter-option-check ${active ? 'active' : ''}"
                                                data-scene-popup-filter-age="${Utils.escapeHtml(option.value)}"
                                            >
                                                <input type="checkbox" ${active ? 'checked' : ''} />
                                                <span>${Utils.escapeHtml(option.label)}</span>
                                            </label>
                                        `;
                                    }).join('');
                                }
                            };
                            const renderInteractive = () => {
                                if (!(interactiveGrid instanceof HTMLElement)) return;
                                const selectedSet = new Set(normalizeCrowdFilterFlatList(filterConfig.blockedInteractive || []));
                                interactiveGrid.innerHTML = interactiveCandidates.map(label => {
                                    const active = selectedSet.has(label);
                                    return `
                                        <label
                                            class="am-wxt-scene-filter-option-check ${active ? 'active' : ''}"
                                            data-scene-popup-filter-interactive="${Utils.escapeHtml(label)}"
                                        >
                                            <input type="checkbox" ${active ? 'checked' : ''} />
                                            <span>${Utils.escapeHtml(label)}</span>
                                        </label>
                                    `;
                                }).join('');
                            };
                            const renderSelected = () => {
                                ensureSelectionLimit();
                                const selectedList = collectCrowdFilterSelectedList(filterConfig);
                                if (selectedCountEl instanceof HTMLElement) {
                                    selectedCountEl.textContent = String(selectedList.length);
                                }
                                if (coverageEl instanceof HTMLElement) {
                                    coverageEl.textContent = `屏蔽预计覆盖人群：${selectedList.length}`;
                                }
                                if (!(selectedListEl instanceof HTMLElement)) return;
                                if (!selectedList.length) {
                                    selectedListEl.innerHTML = '<div class="am-wxt-scene-filter-selected-empty">请从左侧添加人群</div>';
                                    return;
                                }
                                selectedListEl.innerHTML = selectedList.map(item => `
                                    <div class="am-wxt-scene-filter-selected-row">
                                        <span>${Utils.escapeHtml(item.label || item.value || '')}</span>
                                        <button
                                            type="button"
                                            class="am-wxt-btn"
                                            data-scene-popup-filter-remove="${Utils.escapeHtml(item.key || '')}"
                                        >移除</button>
                                    </div>
                                `).join('');
                            };
                            const removeSelectedByKey = (key = '') => {
                                const safeKey = String(key || '').trim();
                                if (!safeKey) return;
                                const separatorIndex = safeKey.indexOf(':');
                                if (separatorIndex < 0) return;
                                const type = safeKey.slice(0, separatorIndex);
                                const value = safeKey.slice(separatorIndex + 1).trim();
                                if (type === 'gender') {
                                    filterConfig.gender = normalizeCrowdFilterFlatList(filterConfig.gender)
                                        .filter(item => item !== value && item !== 'all');
                                    if (!filterConfig.gender.length) filterConfig.gender = ['all'];
                                    return;
                                }
                                if (type === 'age') {
                                    filterConfig.age = normalizeCrowdFilterFlatList(filterConfig.age)
                                        .filter(item => item !== value && item !== 'all');
                                    if (!filterConfig.age.length) filterConfig.age = ['all'];
                                    return;
                                }
                                if (type === 'interactive') {
                                    filterConfig.blockedInteractive = normalizeCrowdFilterFlatList(filterConfig.blockedInteractive)
                                        .filter(item => item !== value);
                                    return;
                                }
                                if (type === 'custom') {
                                    filterConfig.blockedCustom = normalizeCrowdFilterFlatList(filterConfig.blockedCustom)
                                        .filter(item => item !== value);
                                }
                            };
                            renderTabs();
                            renderGenderAge();
                            renderInteractive();
                            renderSelected();
                            tabButtons.forEach(btn => {
                                if (!(btn instanceof HTMLButtonElement)) return;
                                btn.onclick = () => {
                                    activeTab = String(btn.getAttribute('data-scene-popup-filter-tab') || '').trim() || 'genderAge';
                                    renderTabs();
                                };
                            });
                            mask.addEventListener('click', (event) => {
                                const genderBtn = event.target instanceof HTMLElement
                                    ? event.target.closest('[data-scene-popup-filter-gender]')
                                    : null;
                                if (genderBtn instanceof HTMLElement) {
                                    const token = String(genderBtn.getAttribute('data-scene-popup-filter-gender') || '').trim();
                                    if (!token) return;
                                    if (token === 'all') {
                                        filterConfig.gender = ['all'];
                                    } else {
                                        const currentSet = new Set(
                                            normalizeCrowdFilterFlatList(filterConfig.gender).filter(item => item !== 'all')
                                        );
                                        if (currentSet.has(token)) currentSet.delete(token);
                                        else currentSet.add(token);
                                        filterConfig.gender = currentSet.size ? Array.from(currentSet) : ['all'];
                                    }
                                    renderGenderAge();
                                    renderSelected();
                                    return;
                                }
                                const ageBtn = event.target instanceof HTMLElement
                                    ? event.target.closest('[data-scene-popup-filter-age]')
                                    : null;
                                if (ageBtn instanceof HTMLElement) {
                                    const token = String(ageBtn.getAttribute('data-scene-popup-filter-age') || '').trim();
                                    if (!token) return;
                                    if (token === 'all') {
                                        filterConfig.age = ['all'];
                                    } else {
                                        const currentSet = new Set(
                                            normalizeCrowdFilterFlatList(filterConfig.age).filter(item => item !== 'all')
                                        );
                                        if (currentSet.has(token)) currentSet.delete(token);
                                        else currentSet.add(token);
                                        filterConfig.age = currentSet.size ? Array.from(currentSet) : ['all'];
                                    }
                                    renderGenderAge();
                                    renderSelected();
                                    return;
                                }
                                const interactiveBtn = event.target instanceof HTMLElement
                                    ? event.target.closest('[data-scene-popup-filter-interactive]')
                                    : null;
                                if (interactiveBtn instanceof HTMLElement) {
                                    const label = String(interactiveBtn.getAttribute('data-scene-popup-filter-interactive') || '').trim();
                                    if (!label) return;
                                    const currentSet = new Set(normalizeCrowdFilterFlatList(filterConfig.blockedInteractive));
                                    if (currentSet.has(label)) currentSet.delete(label);
                                    else currentSet.add(label);
                                    filterConfig.blockedInteractive = Array.from(currentSet).slice(0, 100);
                                    renderInteractive();
                                    renderSelected();
                                    return;
                                }
                                const removeBtn = event.target instanceof HTMLElement
                                    ? event.target.closest('[data-scene-popup-filter-remove]')
                                    : null;
                                if (removeBtn instanceof HTMLElement) {
                                    removeSelectedByKey(String(removeBtn.getAttribute('data-scene-popup-filter-remove') || '').trim());
                                    renderGenderAge();
                                    renderInteractive();
                                    renderSelected();
                                    return;
                                }
                                const interactiveAddBtn = event.target instanceof HTMLElement
                                    ? event.target.closest('[data-scene-popup-filter-interactive-add]')
                                    : null;
                                if (interactiveAddBtn instanceof HTMLElement) {
                                    const inputText = String(interactiveInput instanceof HTMLInputElement ? interactiveInput.value : '').trim();
                                    if (!inputText) return;
                                    const currentSet = new Set(normalizeCrowdFilterFlatList(filterConfig.blockedInteractive));
                                    inputText.split(/[,\n，]/g).map(item => item.trim()).filter(Boolean).forEach(item => currentSet.add(item));
                                    filterConfig.blockedInteractive = Array.from(currentSet).slice(0, 100);
                                    if (interactiveInput instanceof HTMLInputElement) interactiveInput.value = '';
                                    renderInteractive();
                                    renderSelected();
                                    return;
                                }
                                const customAddBtn = event.target instanceof HTMLElement
                                    ? event.target.closest('[data-scene-popup-filter-custom-add]')
                                    : null;
                                if (customAddBtn instanceof HTMLElement) {
                                    const inputText = String(customInput instanceof HTMLTextAreaElement ? customInput.value : '').trim();
                                    if (!inputText) return;
                                    const currentSet = new Set(normalizeCrowdFilterFlatList(filterConfig.blockedCustom));
                                    inputText.split(/[,\n，]/g).map(item => item.trim()).filter(Boolean).forEach(item => currentSet.add(item));
                                    filterConfig.blockedCustom = Array.from(currentSet).slice(0, 100);
                                    if (customInput instanceof HTMLTextAreaElement) customInput.value = '';
                                    renderSelected();
                                }
                            });
                            mask._sceneCrowdFilterState = {
                                getConfig: () => normalizeCrowdFilterConfig(filterConfig)
                            };
                        },
                        onSave: (mask) => {
                            const state = mask._sceneCrowdFilterState || {};
                            const config = typeof state.getConfig === 'function'
                                ? state.getConfig()
                                : normalizeCrowdFilterConfig('{}');
                            const filterRaw = JSON.stringify(config);
                            return {
                                ok: true,
                                filterRaw,
                                summary: describeCrowdFilterSummary(filterRaw)
                            };
                        }
                    });
                    if (!result || result.ok !== true) return null;
                    return { ok: true, result, filterControl };
                };
                const openBudgetGuardSettingPopup = async () => {
                    const configControl = resolveScenePopupControl('campaign.budgetGuardConfig', 'budgetGuard');
                    if (!(configControl instanceof HTMLInputElement)) return null;
                    const result = await openScenePopupDialog({
                        title: '优质计划防停投',
                        dialogClassName: 'am-wxt-scene-popup-dialog-budget-guard',
                        closeLabel: '×',
                        cancelLabel: '取消',
                        saveLabel: '确定',
                        saveFirst: true,
                        defaultFocus: 'cancel',
                        bodyHtml: `
                            <div class="am-wxt-scene-popup-tips">优质计划满足预设的投产比或收藏加购成本，以及预算花费率的条件后自动追加预算，保证计划竞争卡位“不断电”，持续放大计划转化。</div>
                            <div class="am-wxt-scene-budget-guard-form">
                                <section class="am-wxt-scene-budget-guard-section">
                                    <div class="am-wxt-scene-budget-guard-section-title">执行条件</div>
                                    <div class="am-wxt-scene-budget-guard-grid">
                                        <label class="am-wxt-scene-budget-guard-field">
                                            <span>当天预算花费率 ></span>
                                            <input type="number" min="1" max="100" step="1" data-scene-popup-budget-guard-field="spendRateThreshold" />
                                            <span>%</span>
                                        </label>
                                        <label class="am-wxt-scene-budget-guard-field">
                                            <span>当天投入产出比 ></span>
                                            <input type="number" min="0.1" max="99.9" step="0.1" data-scene-popup-budget-guard-field="roiThreshold" />
                                        </label>
                                    </div>
                                </section>
                                <section class="am-wxt-scene-budget-guard-section">
                                    <div class="am-wxt-scene-budget-guard-section-title">提升幅度与次数</div>
                                    <div class="am-wxt-scene-budget-guard-grid">
                                        <label class="am-wxt-scene-budget-guard-field">
                                            <span>单次提升幅度</span>
                                            <input type="number" min="1" max="300" step="1" data-scene-popup-budget-guard-field="boostPercent" />
                                            <span>%</span>
                                        </label>
                                        <label class="am-wxt-scene-budget-guard-field">
                                            <span>修改次数</span>
                                            <input type="number" min="1" max="99" step="1" data-scene-popup-budget-guard-field="maxAdjustCount" />
                                        </label>
                                    </div>
                                </section>
                                <section class="am-wxt-scene-budget-guard-section">
                                    <label class="am-wxt-scene-budget-guard-toggle">
                                        <span class="am-wxt-scene-budget-guard-toggle-label">次日恢复初始预算</span>
                                        <input type="checkbox" data-scene-popup-budget-guard-field="restoreNextDay" />
                                        <span class="am-wxt-scene-budget-guard-switch-text" data-scene-popup-budget-guard-switch-text="1">开</span>
                                    </label>
                                    <div class="am-wxt-scene-budget-guard-note">次日0-1点恢复首次执行前预算，如人工修改过预算则恢复为末次人工修改的预算值（计划设置次日预算则不恢复）。</div>
                                </section>
                            </div>
                        `,
                        onMounted: (mask) => {
                            const config = normalizeBudgetGuardConfig(configControl.value || '{}');
                            const setNumberValue = (field, value) => {
                                const input = mask.querySelector(`[data-scene-popup-budget-guard-field="${field}"]`);
                                if (input instanceof HTMLInputElement) {
                                    input.value = String(value);
                                }
                            };
                            setNumberValue('spendRateThreshold', config.spendRateThreshold);
                            setNumberValue('roiThreshold', config.roiThreshold);
                            setNumberValue('boostPercent', config.boostPercent);
                            setNumberValue('maxAdjustCount', config.maxAdjustCount);
                            const restoreInput = mask.querySelector('[data-scene-popup-budget-guard-field="restoreNextDay"]');
                            const restoreText = mask.querySelector('[data-scene-popup-budget-guard-switch-text="1"]');
                            const syncRestoreText = () => {
                                if (restoreText instanceof HTMLElement) {
                                    restoreText.textContent = restoreInput instanceof HTMLInputElement && restoreInput.checked
                                        ? '开'
                                        : '关';
                                }
                            };
                            if (restoreInput instanceof HTMLInputElement) {
                                restoreInput.checked = config.restoreNextDay === true;
                                restoreInput.addEventListener('change', syncRestoreText);
                            }
                            syncRestoreText();
                        },
                        onSave: (mask) => {
                            const readField = (field, fallback) => {
                                const input = mask.querySelector(`[data-scene-popup-budget-guard-field="${field}"]`);
                                if (!(input instanceof HTMLInputElement)) return fallback;
                                return input.value;
                            };
                            const restoreInput = mask.querySelector('[data-scene-popup-budget-guard-field="restoreNextDay"]');
                            const config = normalizeBudgetGuardConfig({
                                spendRateThreshold: readField('spendRateThreshold', 70),
                                roiThreshold: readField('roiThreshold', 3.9),
                                boostPercent: readField('boostPercent', 10),
                                maxAdjustCount: readField('maxAdjustCount', 8),
                                restoreNextDay: restoreInput instanceof HTMLInputElement ? restoreInput.checked : true
                            });
                            const configRaw = JSON.stringify(config);
                            return {
                                ok: true,
                                configRaw,
                                summary: describeBudgetGuardSummary(configRaw)
                            };
                        }
                    });
                    if (!result || result.ok !== true) return null;
                    return { ok: true, result, configControl };
                };
                const sceneCrowdTargetPanels = wizardState.els.sceneDynamic.querySelectorAll('[data-scene-crowd-target-panel="1"]');
                sceneCrowdTargetPanels.forEach((panel) => {
                    if (!(panel instanceof HTMLElement)) return;
                    const listWrap = panel.querySelector('[data-scene-crowd-target-list="1"]');
                    const summaryEl = panel.querySelector('[data-scene-crowd-target-summary="1"]');
                    const batchInput = panel.querySelector('[data-scene-crowd-target-batch-input="1"]');
                    const batchApplyBtn = panel.querySelector('[data-scene-crowd-target-batch-apply="1"]');
                    const openPopupBtn = panel.querySelector('[data-scene-crowd-target-open-popup="1"]');
                    const shadowCampaignControl = panel.querySelector('[data-scene-crowd-target-json="campaign"]');
                    const shadowAdgroupControl = panel.querySelector('[data-scene-crowd-target-json="adgroup"]');
                    if (!(listWrap instanceof HTMLElement)) return;
                    const crowdRow = resolveScenePopupRowByTrigger('crowd');
                    const crowdPopupButton = crowdRow?.querySelector('[data-scene-popup-trigger="crowd"]');
                    const crowdCampaignControl = resolveScenePopupControl('campaign.crowdList', 'crowd');
                    const crowdAdgroupControl = resolveScenePopupControl('adgroup.rightList', 'crowd');
                    const crowdMainControl = crowdRow?.querySelector(
                        'input.am-wxt-hidden-control[data-scene-field]:not([data-scene-popup-field])'
                    );
                    const parseSelectedListFromRaw = (campaignRaw = '', adgroupRaw = '') => uniqueBy(
                        parseScenePopupJsonArray(adgroupRaw, [])
                            .concat(parseScenePopupJsonArray(campaignRaw, []))
                            .filter(item => isPlainObject(item)),
                        (item, idx) => getSceneCrowdTargetKey(item, idx)
                    ).slice(0, 100);
                    let selectedList = parseSelectedListFromRaw(
                        normalizeSceneSettingValue(
                            crowdCampaignControl instanceof HTMLInputElement
                                ? crowdCampaignControl.value
                                : (shadowCampaignControl instanceof HTMLInputElement ? shadowCampaignControl.value : '')
                        ) || '[]',
                        normalizeSceneSettingValue(
                            crowdAdgroupControl instanceof HTMLInputElement
                                ? crowdAdgroupControl.value
                                : (shadowAdgroupControl instanceof HTMLInputElement ? shadowAdgroupControl.value : '')
                        ) || '[]'
                    );
                    const syncShadowJsonControls = (campaignRaw = '[]', adgroupRaw = '[]') => {
                        if (shadowCampaignControl instanceof HTMLInputElement) {
                            shadowCampaignControl.value = campaignRaw;
                        }
                        if (shadowAdgroupControl instanceof HTMLInputElement) {
                            shadowAdgroupControl.value = adgroupRaw;
                        }
                    };
                    const renderTargetList = () => {
                        const safeList = Array.isArray(selectedList) ? selectedList : [];
                        if (summaryEl instanceof HTMLElement) {
                            summaryEl.textContent = safeList.length
                                ? `已配置 ${safeList.length} 条`
                                : '未配置人群';
                        }
                        if (!safeList.length) {
                            listWrap.innerHTML = '<div class="am-wxt-crowd-target-empty">请先添加目标人群</div>';
                            return;
                        }
                        listWrap.innerHTML = safeList.map((item, idx) => {
                            const key = getSceneCrowdTargetKey(item, idx);
                            const crowdName = getCrowdDisplayName(item) || `目标人群${idx + 1}`;
                            const bidValue = normalizeSceneCrowdTargetBid(item, 0.3);
                            const suggestionText = resolveSceneCrowdTargetBidSuggestion(item, bidValue);
                            const labelId = normalizeSceneSettingValue(item?.crowd?.label?.labelId || key);
                            return `
                                <div class="am-wxt-crowd-target-row" data-scene-crowd-target-key="${Utils.escapeHtml(key)}">
                                    <div class="am-wxt-crowd-target-name">
                                        <div class="name">${Utils.escapeHtml(crowdName)}</div>
                                        <div class="meta">${Utils.escapeHtml(labelId || '未提供ID')}</div>
                                    </div>
                                    <div class="am-wxt-crowd-target-bid">
                                        <input
                                            type="number"
                                            min="0.01"
                                            max="999"
                                            step="0.01"
                                            value="${Utils.escapeHtml(bidValue.toFixed(2))}"
                                            data-scene-crowd-target-bid="${Utils.escapeHtml(key)}"
                                        />
                                        <span>元/点击</span>
                                    </div>
                                    <div class="am-wxt-crowd-target-suggest">${Utils.escapeHtml(suggestionText)}</div>
                                    <div class="am-wxt-crowd-target-actions">
                                        <button type="button" class="am-wxt-btn" data-scene-crowd-target-remove="${Utils.escapeHtml(key)}">移除</button>
                                    </div>
                                </div>
                            `;
                        }).join('');
                    };
                    const persistTargetList = () => {
                        selectedList = uniqueBy(
                            (Array.isArray(selectedList) ? selectedList : [])
                                .filter(item => isPlainObject(item)),
                            (item, idx) => getSceneCrowdTargetKey(item, idx)
                        ).slice(0, 100);
                        const crowdRaw = JSON.stringify(selectedList);
                        syncShadowJsonControls(crowdRaw, crowdRaw);
                        if (crowdCampaignControl instanceof HTMLInputElement) {
                            dispatchSceneControlUpdate(crowdCampaignControl, crowdRaw);
                        }
                        if (crowdAdgroupControl instanceof HTMLInputElement) {
                            dispatchSceneControlUpdate(crowdAdgroupControl, crowdRaw);
                        }
                        if (crowdMainControl instanceof HTMLInputElement) {
                            dispatchSceneControlUpdate(crowdMainControl, selectedList.length ? '手动添加人群' : '关闭');
                        }
                        updateScenePopupSummary(
                            crowdRow,
                            'crowd',
                            describeCrowdSummary(crowdRaw, crowdRaw)
                        );
                        wizardState.crowdList = selectedList.map(item => deepClone(item));
                        commitCrowdUiState({ syncSceneSettings: true });
                    };
                    renderTargetList();
                    if (openPopupBtn instanceof HTMLButtonElement) {
                        openPopupBtn.addEventListener('click', () => {
                            if (crowdPopupButton instanceof HTMLButtonElement) {
                                crowdPopupButton.click();
                                return;
                            }
                            appendWizardLog('未找到“人群设置”弹窗入口，请先检查场景配置', 'error');
                        });
                    }
                    if (batchApplyBtn instanceof HTMLButtonElement) {
                        batchApplyBtn.addEventListener('click', () => {
                            const bidText = String(batchInput instanceof HTMLInputElement ? batchInput.value : '').trim();
                            if (!bidText) {
                                appendWizardLog('请先输入批量出价', 'error');
                                return;
                            }
                            if (!selectedList.length) {
                                appendWizardLog('请先添加目标人群', 'error');
                                return;
                            }
                            const nextBid = normalizeSceneCrowdTargetBid({ price: { price: bidText } }, 0.3);
                            selectedList = selectedList.map(item => cloneSceneCrowdTargetWithBid(item, nextBid));
                            renderTargetList();
                            persistTargetList();
                        });
                    }
                    listWrap.addEventListener('click', (event) => {
                        const removeBtn = event.target instanceof HTMLElement
                            ? event.target.closest('[data-scene-crowd-target-remove]')
                            : null;
                        if (!(removeBtn instanceof HTMLElement)) return;
                        const key = String(removeBtn.getAttribute('data-scene-crowd-target-remove') || '').trim();
                        if (!key) return;
                        selectedList = selectedList.filter((item, idx) => getSceneCrowdTargetKey(item, idx) !== key);
                        renderTargetList();
                        persistTargetList();
                    });
                    listWrap.addEventListener('input', (event) => {
                        const input = event.target instanceof HTMLInputElement
                            ? event.target
                            : null;
                        if (!(input instanceof HTMLInputElement)) return;
                        const key = String(input.getAttribute('data-scene-crowd-target-bid') || '').trim();
                        if (!key) return;
                        const hitIndex = selectedList.findIndex((item, idx) => getSceneCrowdTargetKey(item, idx) === key);
                        if (hitIndex < 0) return;
                        const fallbackBid = normalizeSceneCrowdTargetBid(selectedList[hitIndex], 0.3);
                        const nextBid = normalizeSceneCrowdTargetBid({ price: { price: input.value } }, fallbackBid);
                        input.value = nextBid.toFixed(2);
                        selectedList[hitIndex] = cloneSceneCrowdTargetWithBid(selectedList[hitIndex], nextBid);
                        persistTargetList();
                    });
                });
                const scenePopupButtons = wizardState.els.sceneDynamic.querySelectorAll('[data-scene-popup-trigger]');
                scenePopupButtons.forEach(button => {
                    button.addEventListener('click', async () => {
                        const trigger = String(button.getAttribute('data-scene-popup-trigger') || '').trim();
                        const popupTitle = String(button.getAttribute('data-scene-popup-title') || '').trim();
                        const row = button.closest('.am-wxt-scene-setting-row');
                        if (!trigger || !(row instanceof HTMLElement)) return;
                        const findPopupControl = (fieldKey) => row.querySelector(`input[data-scene-field="${fieldKey}"][data-scene-popup-field="${trigger}"]`);
                        const findMainControl = () => row.querySelector('input.am-wxt-hidden-control[data-scene-field]:not([data-scene-popup-field])');

                        if (trigger === 'adzone' || trigger === 'launchPeriod' || trigger === 'launchArea') {
                            const popupPayload = await openKeywordAdvancedSettingPopup(trigger);
                            if (!popupPayload || popupPayload.ok !== true) return;
                            const { result, adzoneControl, launchPeriodControl, launchAreaControl } = popupPayload;
                            dispatchSceneControlUpdate(adzoneControl, result.adzoneRaw || '[]');
                            dispatchSceneControlUpdate(
                                launchPeriodControl,
                                result.launchPeriodRaw || JSON.stringify(buildDefaultLaunchPeriodList())
                            );
                            dispatchSceneControlUpdate(launchAreaControl, result.launchAreaRaw || '["all"]');

                            const adzoneRow = resolveScenePopupRowByTrigger('adzone');
                            const launchPeriodRow = resolveScenePopupRowByTrigger('launchPeriod');
                            const launchAreaRow = resolveScenePopupRowByTrigger('launchArea');
                            const combinedAdvancedRow = adzoneRow instanceof HTMLElement
                                && /投放资源位\/投放地域\/(投放时间|分时折扣)/.test(
                                    normalizeText(adzoneRow.querySelector('.am-wxt-scene-setting-label')?.textContent || '').replace(/\s+/g, '')
                                );
                            const combinedSummary = describeKeywordAdvancedSummary({
                                adzoneRaw: result.adzoneRaw || '[]',
                                launchAreaRaw: result.launchAreaRaw || '["all"]',
                                launchPeriodRaw: result.launchPeriodRaw || JSON.stringify(buildDefaultLaunchPeriodList())
                            });
                            updateScenePopupSummary(
                                adzoneRow,
                                'adzone',
                                combinedAdvancedRow
                                    ? combinedSummary
                                    : (result.adzoneSummary || describeAdzoneSummary(result.adzoneRaw || '[]'))
                            );
                            if (!combinedAdvancedRow) {
                                updateScenePopupSummary(
                                    launchPeriodRow,
                                    'launchPeriod',
                                    result.launchPeriodSummary || describeLaunchPeriodSummary(result.launchPeriodRaw || '[]')
                                );
                                updateScenePopupSummary(
                                    launchAreaRow,
                                    'launchArea',
                                    result.launchAreaSummary || describeLaunchAreaSummary(result.launchAreaRaw || '["all"]')
                                );
                            }

                            const adzoneMainControl = adzoneRow?.querySelector(
                                'input.am-wxt-hidden-control[data-scene-field]:not([data-scene-popup-field])'
                            );
                            if (adzoneMainControl instanceof HTMLInputElement) {
                                const parsedAdzone = parseScenePopupJsonArray(result.adzoneRaw || '[]', [])
                                    .filter(item => isPlainObject(item));
                                const enabledCount = parsedAdzone.filter(item => isAdzoneStatusEnabled(item)).length;
                                if (combinedAdvancedRow) {
                                    const areaList = parseScenePopupJsonArray(result.launchAreaRaw || '["all"]', ['all'])
                                        .map(item => String(item || '').trim())
                                        .filter(Boolean);
                                    const areaDefault = !areaList.length || (areaList.length === 1 && /^all$/i.test(areaList[0]));
                                    const periodAllDay = isLaunchPeriodAllDay(result.launchPeriodRaw || JSON.stringify(buildDefaultLaunchPeriodList()));
                                    const adzoneDefault = !parsedAdzone.length || enabledCount === parsedAdzone.length;
                                    dispatchSceneControlUpdate(
                                        adzoneMainControl,
                                        (adzoneDefault && areaDefault && periodAllDay) ? '默认投放' : '自定义设置'
                                    );
                                } else {
                                    dispatchSceneControlUpdate(
                                        adzoneMainControl,
                                        parsedAdzone.length && enabledCount !== parsedAdzone.length ? '自定义资源位' : '平台优选'
                                    );
                                }
                            }
                            const launchPeriodMainControl = launchPeriodRow?.querySelector(
                                'input.am-wxt-hidden-control[data-scene-field]:not([data-scene-popup-field])'
                            );
                            if (!combinedAdvancedRow && launchPeriodMainControl instanceof HTMLInputElement) {
                                const nextLaunchPeriodRaw = String(result.launchPeriodRaw || '').trim();
                                let nextLabel = '长期投放';
                                if (nextLaunchPeriodRaw && nextLaunchPeriodRaw !== '[]') {
                                    nextLabel = isLaunchPeriodAllDay(nextLaunchPeriodRaw)
                                        ? '不限时段'
                                        : '固定时段';
                                }
                                dispatchSceneControlUpdate(launchPeriodMainControl, nextLabel);
                            }
                        } else if (trigger === 'adzonePremium') {
                            const popupPayload = await openAdzonePremiumSettingPopup();
                            if (!popupPayload || popupPayload.ok !== true) return;
                            const { result, adzoneControl } = popupPayload;
                            dispatchSceneControlUpdate(adzoneControl, result.adzoneRaw || '[]');
                            updateScenePopupSummary(
                                row,
                                trigger,
                                result.summary || describeAdzoneSummary(result.adzoneRaw || '[]')
                            );
                            const mainControl = findMainControl();
                            if (mainControl instanceof HTMLInputElement) {
                                let nextMode = '';
                                if (typeof result.isDefaultMode === 'boolean') {
                                    nextMode = result.isDefaultMode ? '默认溢价' : '自定义溢价';
                                } else {
                                    const parsedAdzone = parseScenePopupJsonArray(result.adzoneRaw || '[]', [])
                                        .filter(item => isPlainObject(item));
                                    const enabledCount = parsedAdzone.filter(item => isAdzoneStatusEnabled(item)).length;
                                    nextMode = (!parsedAdzone.length || enabledCount === parsedAdzone.length)
                                        ? '默认溢价'
                                        : '自定义溢价';
                                }
                                dispatchSceneControlUpdate(mainControl, nextMode);
                            }
                        } else if (trigger === 'launchSetting') {
                            const popupPayload = await openCrowdLaunchSettingPopup();
                            if (!popupPayload || popupPayload.ok !== true) return;
                            const { result, launchPeriodControl, launchAreaControl } = popupPayload;
                            dispatchSceneControlUpdate(
                                launchPeriodControl,
                                result.launchPeriodRaw || JSON.stringify(buildDefaultLaunchPeriodList())
                            );
                            dispatchSceneControlUpdate(
                                launchAreaControl,
                                result.launchAreaRaw || '["all"]'
                            );
                            const launchAreaSummary = result.launchAreaSummary
                                || describeLaunchAreaSummary(result.launchAreaRaw || '["all"]');
                            const launchPeriodSummary = result.launchPeriodSummary
                                || describeLaunchPeriodSummary(result.launchPeriodRaw || JSON.stringify(buildDefaultLaunchPeriodList()));
                            updateScenePopupSummary(
                                row,
                                trigger,
                                `${launchAreaSummary}｜${launchPeriodSummary}`
                            );
                            const mainControl = findMainControl();
                            if (mainControl instanceof HTMLInputElement) {
                                const areaList = parseScenePopupJsonArray(result.launchAreaRaw || '["all"]', ['all'])
                                    .map(item => String(item || '').trim())
                                    .filter(Boolean);
                                const areaDefault = !areaList.length || (areaList.length === 1 && /^all$/i.test(areaList[0]));
                                const periodAllDay = isLaunchPeriodAllDay(
                                    result.launchPeriodRaw || JSON.stringify(buildDefaultLaunchPeriodList())
                                );
                                dispatchSceneControlUpdate(mainControl, areaDefault && periodAllDay ? '默认投放' : '自定义设置');
                            }
                        } else if (trigger === 'itemSelect') {
                            const popupPayload = await openCrowdItemSettingPopup();
                            if (!popupPayload || popupPayload.ok !== true) return;
                            const { result, itemIdListControl } = popupPayload;
                            dispatchSceneControlUpdate(itemIdListControl, result.itemIdListRaw || '[]');
                            if (Array.isArray(result.itemList) && result.itemList.length) {
                                wizardState.addedItems = result.itemList
                                    .map(item => normalizeItem(item))
                                    .filter(item => toIdValue(item?.materialId || item?.itemId))
                                    .slice(0, WIZARD_MAX_ITEMS);
                                const draft = ensureWizardDraft();
                                draft.addedItems = wizardState.addedItems.map(item => deepClone(item));
                                KeywordPlanWizardStore.persistDraft(draft);
                                if (typeof renderAddedList === 'function') renderAddedList();
                                if (typeof renderCandidateList === 'function') renderCandidateList();
                            }
                            updateScenePopupSummary(
                                row,
                                trigger,
                                result.summary || describeCrowdItemSummary(result.itemIdListRaw || '[]')
                            );
                        } else if (trigger === 'trendTheme') {
                            const popupPayload = await openKeywordTrendThemeSettingPopup();
                            if (!popupPayload || popupPayload.ok !== true) return;
                            const { result, trendThemeControl } = popupPayload;
                            dispatchSceneControlUpdate(trendThemeControl, result.trendThemeRaw || '[]');
                            updateScenePopupSummary(
                                row,
                                trigger,
                                result.summary || describeTrendThemeSummary(result.trendThemeRaw || '[]')
                            );
                        } else if (trigger === 'crowd') {
                            const crowdCampaignControl = findPopupControl('campaign.crowdList');
                            const crowdAdgroupControl = findPopupControl('adgroup.rightList');
                            if (!(crowdCampaignControl instanceof HTMLInputElement) || !(crowdAdgroupControl instanceof HTMLInputElement)) return;
                            const crowdCampaignRaw = normalizeSceneSettingValue(crowdCampaignControl.value || '') || '[]';
                            const crowdAdgroupRaw = normalizeSceneSettingValue(crowdAdgroupControl.value || '') || '[]';
                            const crowdPopupTitle = popupTitle || '添加精选人群';
                            const result = await openScenePopupDialog({
                                title: crowdPopupTitle,
                                dialogClassName: 'am-wxt-scene-popup-dialog-crowd',
                                closeLabel: '×',
                                cancelLabel: '取消',
                                saveLabel: '确定',
                                bodyHtml: `
                                    <div class="am-wxt-scene-popup-tips">原生页“${Utils.escapeHtml(crowdPopupTitle)}”同构：左侧候选人群、右侧已选人群，支持推荐出价和高级 JSON 编辑。</div>
                                    <div class="am-wxt-scene-crowd-layout" data-scene-popup-crowd-layout="1">
                                        <section class="am-wxt-scene-crowd-pane is-left">
                                            <div class="am-wxt-scene-crowd-tabs">
                                                <button type="button" class="am-wxt-scene-crowd-tab active" data-scene-popup-crowd-tab="recommend">人群推荐</button>
                                                <button type="button" class="am-wxt-scene-crowd-tab" data-scene-popup-crowd-tab="system">系统推荐人群</button>
                                                <button type="button" class="am-wxt-scene-crowd-tab" data-scene-popup-crowd-tab="base">基础属性人群</button>
                                                <button type="button" class="am-wxt-scene-crowd-tab" data-scene-popup-crowd-tab="ai">AI小万达人</button>
                                            </div>
                                            <div class="am-wxt-scene-popup-actions">
                                                <button type="button" class="am-wxt-btn" data-scene-popup-copy-right-list="1">同步计划人群</button>
                                                <button type="button" class="am-wxt-btn" data-scene-popup-crowd-add-new="1">新增人群</button>
                                                <button type="button" class="am-wxt-btn" data-scene-popup-crowd-toggle-json="1">高级JSON</button>
                                            </div>
                                            <div class="am-wxt-scene-crowd-quick-filters" data-scene-popup-crowd-quick-filters="1">
                                                <button type="button" class="am-wxt-scene-crowd-quick-filter active" data-scene-popup-crowd-quick-filter="all">全部人群</button>
                                                <button type="button" class="am-wxt-scene-crowd-quick-filter" data-scene-popup-crowd-quick-filter="assist">助力人群提效</button>
                                                <button type="button" class="am-wxt-scene-crowd-quick-filter" data-scene-popup-crowd-quick-filter="asset">宝贝成交资产</button>
                                                <button type="button" class="am-wxt-scene-crowd-quick-filter" data-scene-popup-crowd-quick-filter="high_value">高价值潜客</button>
                                            </div>
                                            <div class="am-wxt-scene-crowd-table-head">
                                                <span>人群名称</span>
                                                <span>人群规模</span>
                                                <span>推荐理由</span>
                                                <span>设置溢价</span>
                                                <span>操作</span>
                                            </div>
                                            <div class="am-wxt-scene-crowd-candidate-list" data-scene-popup-crowd-candidate-list="1"></div>
                                        </section>
                                        <section class="am-wxt-scene-crowd-pane is-right">
                                            <div class="am-wxt-scene-crowd-selected-head">
                                                <span>已选人群（<b data-scene-popup-crowd-selected-count="1">0</b>/100）</span>
                                                <div class="am-wxt-scene-crowd-selected-actions">
                                                    <button type="button" class="am-wxt-btn" data-scene-popup-crowd-batch-bid="1">批量设置溢价</button>
                                                    <button type="button" class="am-wxt-btn" data-scene-popup-crowd-clear-selected="1">清空</button>
                                                </div>
                                            </div>
                                            <div class="am-wxt-scene-crowd-selected-list" data-scene-popup-crowd-selected-list="1"></div>
                                        </section>
                                    </div>
                                    <div class="am-wxt-scene-crowd-add-mask hidden" data-scene-popup-crowd-add-mask="1">
                                        <div class="am-wxt-scene-crowd-add-dialog am-wxt-scene-crowd-native-dialog" role="dialog" aria-modal="true" aria-label="手动添加人群">
                                            <div class="am-wxt-scene-crowd-add-head">
                                                <div class="am-wxt-scene-crowd-native-title">
                                                    <span>手动添加人群</span>
                                                    <a
                                                        class="am-wxt-scene-crowd-native-help"
                                                        data-scene-popup-crowd-native-help="1"
                                                        href="https://alidocs.dingtalk.com/i/nodes/Qnp9zOoBVBDEydnQU4mLjg5G81DK0g6l"
                                                        target="_blank"
                                                        rel="noreferrer noopener"
                                                    >人群解读</a>
                                                </div>
                                                <button type="button" class="am-wxt-btn" data-scene-popup-crowd-add-close="1">×</button>
                                            </div>
                                            <div class="am-wxt-scene-crowd-add-body">
                                                <div class="am-wxt-scene-crowd-native-layout" data-scene-popup-crowd-native-layout="1">
                                                    <section class="am-wxt-scene-crowd-native-left">
                                                        <div class="am-wxt-scene-crowd-native-tabs" data-scene-popup-crowd-native-tabs="1">
                                                            <button type="button" class="am-wxt-scene-crowd-native-tab active" data-scene-popup-crowd-native-tab="compete_new">
                                                                <span>竞争航线</span>
                                                                <i>强势拉新</i>
                                                            </button>
                                                            <button type="button" class="am-wxt-scene-crowd-native-tab" data-scene-popup-crowd-native-tab="shopAndItem">
                                                                <span>本店核心人群</span>
                                                            </button>
                                                            <button type="button" class="am-wxt-scene-crowd-native-tab" data-scene-popup-crowd-native-tab="dmpRecommends">
                                                                <span>平台精选人群</span>
                                                            </button>
                                                            <button type="button" class="am-wxt-scene-crowd-native-tab" data-scene-popup-crowd-native-tab="keywordAndDmp">
                                                                <span>用户画像人群</span>
                                                            </button>
                                                            <button type="button" class="am-wxt-scene-crowd-native-tab" data-scene-popup-crowd-native-tab="other">
                                                                <span>其他</span>
                                                            </button>
                                                        </div>
                                                        <div class="am-wxt-scene-crowd-native-subtabs" data-scene-popup-crowd-native-subtabs="1">
                                                            <button type="button" class="am-wxt-scene-crowd-native-subtab active" data-scene-popup-crowd-native-subtab="item">竞争商品</button>
                                                            <button type="button" class="am-wxt-scene-crowd-native-subtab" data-scene-popup-crowd-native-subtab="shop">竞争店铺</button>
                                                        </div>
                                                        <div class="am-wxt-scene-crowd-native-toolbar">
                                                            <input
                                                                type="text"
                                                                class="am-wxt-input"
                                                                data-scene-popup-crowd-native-search="1"
                                                                placeholder="输入人群名称或标签ID搜索"
                                                            />
                                                            <button type="button" class="am-wxt-btn" data-scene-popup-crowd-native-search-reset="1">重置</button>
                                                            <button type="button" class="am-wxt-btn" data-scene-popup-crowd-native-add-all="1">全部添加</button>
                                                        </div>
                                                        <div class="am-wxt-scene-crowd-native-manual">
                                                            <input
                                                                type="text"
                                                                class="am-wxt-input"
                                                                data-scene-popup-crowd-add-input="1"
                                                                placeholder="手动添加：输入人群名称或标签ID，多个可用逗号分隔"
                                                            />
                                                            <button type="button" class="am-wxt-btn" data-scene-popup-crowd-native-manual-add="1">添加自定义人群</button>
                                                        </div>
                                                        <div class="am-wxt-scene-crowd-native-candidate-head">
                                                            <span>人群名称</span>
                                                            <span>推荐理由</span>
                                                            <span>人群规模</span>
                                                            <span>操作</span>
                                                        </div>
                                                        <div class="am-wxt-scene-crowd-native-candidate-list" data-scene-popup-crowd-native-candidate-list="1"></div>
                                                    </section>
                                                    <section class="am-wxt-scene-crowd-native-right">
                                                        <div class="am-wxt-scene-crowd-native-selected-head">
                                                            <span>已选人群（<b data-scene-popup-crowd-native-selected-count="1">0</b>/100）</span>
                                                            <a href="javascript:;" data-scene-popup-crowd-native-clear="1">全部移除</a>
                                                        </div>
                                                        <div class="am-wxt-scene-crowd-native-selected-table-head">
                                                            <span>人群名称</span>
                                                            <span>来源</span>
                                                            <span>操作</span>
                                                        </div>
                                                        <div class="am-wxt-scene-crowd-native-selected-list" data-scene-popup-crowd-native-selected-list="1"></div>
                                                    </section>
                                                </div>
                                                <div class="am-wxt-scene-popup-actions am-wxt-scene-crowd-native-foot">
                                                    <button type="button" class="am-wxt-btn" data-scene-popup-crowd-add-cancel="1">取消</button>
                                                    <button type="button" class="am-wxt-btn primary" data-scene-popup-crowd-add-confirm="1">确定</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <section class="am-wxt-scene-crowd-json hidden" data-scene-popup-crowd-json="1">
                                        <label class="am-wxt-scene-popup-label">${Utils.escapeHtml(crowdPopupTitle)}（adgroup.rightList）</label>
                                        <textarea class="am-wxt-scene-popup-textarea" data-scene-popup-editor="crowdAdgroup"></textarea>
                                        <label class="am-wxt-scene-popup-label">客户口径设置（campaign.crowdList）</label>
                                        <textarea class="am-wxt-scene-popup-textarea" data-scene-popup-editor="crowdCampaign"></textarea>
                                    </section>
                                `,
                                onMounted: (mask) => {
                                    const getCrowdKey = (item = {}, index = 0) => (
                                        normalizeSceneSettingValue(
                                            item?.mx_crowdId
                                            || item?.crowd?.label?.labelId
                                            || item?.id
                                            || item?.crowd?.id
                                            || ''
                                        ) || `crowd_${index + 1}`
                                    );
                                    const normalizeCrowdBid = (item = {}, fallback = 30) => {
                                        const raw = toNumber(
                                            item?.price?.price
                                            || item?.price?.value
                                            || item?.crowd?.price
                                            || fallback,
                                            fallback
                                        );
                                        if (!Number.isFinite(raw)) return fallback;
                                        return Math.max(30, Math.min(300, Math.round(raw)));
                                    };
                                    const cloneWithCrowdBid = (item = {}, bid = 30) => {
                                        const next = deepClone(item || {});
                                        if (!isPlainObject(next.price)) next.price = {};
                                        next.price.price = normalizeCrowdBid(next, bid);
                                        return next;
                                    };
                                    const campaignEditor = mask.querySelector('[data-scene-popup-editor="crowdCampaign"]');
                                    const adgroupEditor = mask.querySelector('[data-scene-popup-editor="crowdAdgroup"]');
                                    const crowdJsonWrap = mask.querySelector('[data-scene-popup-crowd-json]');
                                    const crowdCandidateListEl = mask.querySelector('[data-scene-popup-crowd-candidate-list]');
                                    const crowdSelectedListEl = mask.querySelector('[data-scene-popup-crowd-selected-list]');
                                    const crowdSelectedCountEl = mask.querySelector('[data-scene-popup-crowd-selected-count]');
                                    const tabButtons = Array.from(mask.querySelectorAll('[data-scene-popup-crowd-tab]'));
                                    const quickFilterButtons = Array.from(mask.querySelectorAll('[data-scene-popup-crowd-quick-filter]'));
                                    const crowdAddMask = mask.querySelector('[data-scene-popup-crowd-add-mask]');
                                    const crowdAddInput = mask.querySelector('[data-scene-popup-crowd-add-input]');
                                    const crowdAddNativeTabButtons = Array.from(mask.querySelectorAll('[data-scene-popup-crowd-native-tab]'));
                                    const crowdAddNativeSubtabButtons = Array.from(mask.querySelectorAll('[data-scene-popup-crowd-native-subtab]'));
                                    const crowdAddNativeSubtabsWrap = mask.querySelector('[data-scene-popup-crowd-native-subtabs]');
                                    const crowdAddNativeSearchInput = mask.querySelector('[data-scene-popup-crowd-native-search]');
                                    const crowdAddNativeSearchResetBtn = mask.querySelector('[data-scene-popup-crowd-native-search-reset]');
                                    const crowdAddNativeManualAddBtn = mask.querySelector('[data-scene-popup-crowd-native-manual-add]');
                                    const crowdAddNativeAddAllBtn = mask.querySelector('[data-scene-popup-crowd-native-add-all]');
                                    const crowdAddNativeCandidateListEl = mask.querySelector('[data-scene-popup-crowd-native-candidate-list]');
                                    const crowdAddNativeSelectedListEl = mask.querySelector('[data-scene-popup-crowd-native-selected-list]');
                                    const crowdAddNativeSelectedCountEl = mask.querySelector('[data-scene-popup-crowd-native-selected-count]');
                                    const crowdAddNativeClearBtn = mask.querySelector('[data-scene-popup-crowd-native-clear]');
                                    const initialCampaignList = parseScenePopupJsonArray(crowdCampaignRaw, [])
                                        .filter(item => isPlainObject(item));
                                    const initialAdgroupList = parseScenePopupJsonArray(crowdAdgroupRaw, [])
                                        .filter(item => isPlainObject(item));
                                    const wizardCrowdList = Array.isArray(wizardState.crowdList) ? wizardState.crowdList : [];
                                    const fallbackCandidates = [];
                                    let activeTab = 'recommend';
                                    let activeQuickFilter = 'all';
                                    let selectedList = uniqueBy(
                                        initialAdgroupList.length ? initialAdgroupList : wizardCrowdList,
                                        (item, idx) => getCrowdKey(item, idx)
                                    ).slice(0, 100);
                                    let candidateList = uniqueBy(
                                        wizardCrowdList
                                            .concat(initialAdgroupList)
                                            .concat(initialCampaignList)
                                            .concat(fallbackCandidates),
                                        (item, idx) => getCrowdKey(item, idx)
                                    ).slice(0, 200);
                                    let jsonMode = false;
                                    let systemCrowdLoading = false;
                                    let systemCrowdLoaded = false;
                                    let crowdAddNativeTab = 'compete_new';
                                    let crowdAddNativeSubtab = 'item';
                                    let crowdAddNativeKeyword = '';
                                    let crowdAddDialogSnapshot = [];
                                    let crowdAddDialogOpen = false;

                                    const formatCrowdScaleText = (item = {}, index = 0) => {
                                        const fromItem = toNumber(
                                            item?.crowdScale
                                            || item?.crowd?.scale
                                            || item?.crowd?.crowdScale
                                            || item?.crowd?.estimateUv
                                            || item?.coverage
                                            || '',
                                            NaN
                                        );
                                        const keySeed = getCrowdKey(item, index);
                                        let value = Number.isFinite(fromItem) && fromItem > 0
                                            ? Math.max(1, Math.round(fromItem))
                                            : NaN;
                                        if (!Number.isFinite(value) || value <= 0) {
                                            const hash = Array.from(String(keySeed || `crowd_${index + 1}`))
                                                .reduce((acc, ch) => ((acc << 5) - acc + ch.charCodeAt(0)) | 0, 0);
                                            value = (Math.abs(hash) % 280000000) + 1200000;
                                        }
                                        return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                                    };
                                    const resolveCrowdQuickFilterKey = (item = {}, index = 0, name = '') => {
                                        const normalizedName = String(name || getCrowdDisplayName(item) || '').trim();
                                        if (/高价值|高潜|高净值|收藏|加购|复购|潜客/.test(normalizedName)) return 'high_value';
                                        if (/资产|宝贝|货品|成交|老客|行为/.test(normalizedName)) return 'asset';
                                        if (/达人|系统|推荐|拉新|提效|流量/.test(normalizedName)) return 'assist';
                                        const ring = ['assist', 'asset', 'high_value'];
                                        return ring[index % ring.length];
                                    };
                                    const resolveCrowdReasonText = (item = {}, index = 0, name = '') => {
                                        const reasonList = uniqueBy(
                                            (Array.isArray(item?.reasonTagList) ? item.reasonTagList : [])
                                                .map(reason => String(reason?.name || reason || '').trim())
                                                .filter(Boolean),
                                            reason => reason
                                        );
                                        if (reasonList.length) return reasonList[0];
                                        const quickKey = resolveCrowdQuickFilterKey(item, index, name);
                                        if (quickKey === 'high_value') return '高价值高潜力';
                                        if (quickKey === 'asset') return '优选成交资产';
                                        return '高相关引流';
                                    };
                                    const resolveCrowdNativeTabKey = (item = {}, index = 0, name = '') => {
                                        const crowdName = String(name || getCrowdDisplayName(item) || '').trim();
                                        const reason = resolveCrowdReasonText(item, index, crowdName);
                                        const merged = `${crowdName} ${reason}`.trim();
                                        if (/竞店|竞品|竞争|航线|相似宝贝|搭配宝贝/.test(merged)) return 'compete_new';
                                        if (/店铺|领券|成交|加购|收藏|老客|复购|即将成交/.test(merged)) return 'shopAndItem';
                                        if (/平台|精选|高潜|高价值|资产|行为|达人/.test(merged)) return 'dmpRecommends';
                                        if (/关键词|画像|标签|兴趣|偏好/.test(merged)) return 'keywordAndDmp';
                                        return 'other';
                                    };
                                    const resolveCrowdNativeCompeteSubtabKey = (item = {}, index = 0, name = '') => {
                                        const crowdName = String(name || getCrowdDisplayName(item) || '').trim();
                                        const reason = resolveCrowdReasonText(item, index, crowdName);
                                        const merged = `${crowdName} ${reason}`.trim();
                                        if (/店铺|竞店/.test(merged)) return 'shop';
                                        return 'item';
                                    };
                                    const resolveCrowdNativeSourceLabel = (item = {}, index = 0, name = '') => {
                                        const tabKey = resolveCrowdNativeTabKey(item, index, name);
                                        if (tabKey === 'compete_new') return '竞争航线';
                                        if (tabKey === 'shopAndItem') return '店铺人群';
                                        if (tabKey === 'dmpRecommends') return '平台精选';
                                        if (tabKey === 'keywordAndDmp') return '用户画像';
                                        return '其他';
                                    };
                                    const mergeCandidateList = (incoming = [], limit = 260) => {
                                        candidateList = uniqueBy(
                                            candidateList.concat(
                                                (Array.isArray(incoming) ? incoming : [])
                                                    .filter(item => isPlainObject(item))
                                                    .map(item => deepClone(item))
                                            ),
                                            (item, idx) => getCrowdKey(item, idx)
                                        ).slice(0, Math.max(100, Math.min(600, toNumber(limit, 260))));
                                    };
                                    const collectCrowdMaterialList = () => {
                                        const list = uniqueBy(
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
                                        );
                                        if (list.length) return list.slice(0, 10);
                                        const fallbackId = toIdValue(SCENE_SYNC_DEFAULT_ITEM_ID);
                                        return fallbackId
                                            ? [{ materialId: fallbackId, materialName: `商品${fallbackId}` }]
                                            : [];
                                    };
                                    const resolveCrowdGoalLabel = () => {
                                        const draft = isPlainObject(wizardState.draft) ? wizardState.draft : {};
                                        const sceneSettings = isPlainObject(draft.sceneSettings) ? draft.sceneSettings : {};
                                        const sceneSettingValues = isPlainObject(draft.sceneSettingValues) ? draft.sceneSettingValues : {};
                                        const goalFieldKey = normalizeSceneFieldKey('营销目标');
                                        const strategyFieldKey = normalizeSceneFieldKey('选择拉新方案');
                                        return normalizeGoalCandidateLabel(
                                            draft.marketingGoal
                                            || sceneSettings.营销目标
                                            || sceneSettings.选择拉新方案
                                            || sceneSettingValues[goalFieldKey]
                                            || sceneSettingValues[strategyFieldKey]
                                            || ''
                                        );
                                    };
                                    const loadSystemCrowdCandidates = async (force = false) => {
                                        if (systemCrowdLoading) return;
                                        if (!force && systemCrowdLoaded) return;
                                        systemCrowdLoading = true;
                                        try {
                                            const runtime = await getRuntimeDefaults(false);
                                            runtime.bizCode = wizardState.draft?.bizCode || runtime.bizCode || DEFAULTS.bizCode;
                                            runtime.promotionScene = wizardState.draft?.promotionScene || runtime.promotionScene || DEFAULTS.promotionScene;
                                            runtime.bidTargetV2 = wizardState.draft?.bidTargetV2 || runtime.bidTargetV2 || DEFAULTS.bidTargetV2;
                                            runtime.subPromotionType = wizardState.draft?.subPromotionType || runtime.subPromotionType || DEFAULTS.subPromotionType;
                                            runtime.promotionType = wizardState.draft?.promotionType || runtime.promotionType || DEFAULTS.promotionType;
                                            const materialList = collectCrowdMaterialList();
                                            const materialIdList = materialList.map(item => item.materialId);
                                            const goalLabel = resolveCrowdGoalLabel();
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
                                            const runtimeFallbackList = Array.isArray(runtime?.solutionTemplate?.adgroupList?.[0]?.rightList)
                                                ? runtime.solutionTemplate.adgroupList[0].rightList.map(item => deepClone(item))
                                                : [];
                                            const mergedSystemList = crowdList.length ? crowdList : runtimeFallbackList;
                                            if (!mergedSystemList.length) {
                                                appendWizardLog('人群弹窗未获取到系统推荐人群，已保留当前候选列表', 'error');
                                                return;
                                            }
                                            mergeCandidateList(mergedSystemList, 320);
                                            if (Array.isArray(wizardState.crowdList) && wizardState.crowdList.length === 0 && crowdList.length) {
                                                wizardState.crowdList = uniqueBy(
                                                    crowdList.map(item => deepClone(item)),
                                                    (item, idx) => getCrowdKey(item, idx)
                                                ).slice(0, 100);
                                            }
                                            renderCandidateList();
                                            if (crowdAddDialogOpen) {
                                                renderCrowdAddNative();
                                            }
                                            appendWizardLog(`人群弹窗已加载系统推荐人群 ${mergedSystemList.length} 条`, 'success');
                                            systemCrowdLoaded = true;
                                        } catch (err) {
                                            appendWizardLog(`人群弹窗加载系统推荐人群失败：${err?.message || err}`, 'error');
                                        } finally {
                                            systemCrowdLoading = false;
                                        }
                                    };

                                    const getSelectedKeySet = () => new Set(
                                        selectedList.map((item, idx) => getCrowdKey(item, idx))
                                    );
                                    const renderTabs = () => {
                                        tabButtons.forEach(btn => {
                                            if (!(btn instanceof HTMLButtonElement)) return;
                                            const key = String(btn.getAttribute('data-scene-popup-crowd-tab') || '').trim();
                                            const active = key === activeTab;
                                            btn.classList.toggle('active', active);
                                            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
                                        });
                                    };
                                    const renderQuickFilters = () => {
                                        quickFilterButtons.forEach(btn => {
                                            if (!(btn instanceof HTMLButtonElement)) return;
                                            const key = String(btn.getAttribute('data-scene-popup-crowd-quick-filter') || '').trim() || 'all';
                                            const active = key === activeQuickFilter;
                                            btn.classList.toggle('active', active);
                                            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
                                        });
                                    };
                                    const renderCandidateList = () => {
                                        if (!(crowdCandidateListEl instanceof HTMLElement)) return;
                                        const selectedSet = getSelectedKeySet();
                                        const filtered = candidateList.filter((item, idx) => {
                                            const key = getCrowdKey(item, idx);
                                            if (!key) return false;
                                            const name = getCrowdDisplayName(item);
                                            let tabMatched = true;
                                            if (activeTab === 'system') tabMatched = /系统|推荐/.test(name);
                                            else if (activeTab === 'base') tabMatched = /属性|人群/.test(name);
                                            else if (activeTab === 'ai') tabMatched = /AI|达人|小万/.test(name);
                                            if (!tabMatched) return false;
                                            if (activeQuickFilter === 'all') return true;
                                            return resolveCrowdQuickFilterKey(item, idx, name) === activeQuickFilter;
                                        });
                                        if (!filtered.length) {
                                            crowdCandidateListEl.innerHTML = '<div class="am-wxt-scene-crowd-empty">暂无可选人群</div>';
                                            return;
                                        }
                                        crowdCandidateListEl.innerHTML = filtered.map((item, idx) => {
                                            const key = getCrowdKey(item, idx);
                                            const rawName = getCrowdDisplayName(item) || `精选人群${idx + 1}`;
                                            const name = Utils.escapeHtml(rawName);
                                            const labelId = Utils.escapeHtml(normalizeSceneSettingValue(item?.crowd?.label?.labelId || key));
                                            const bid = normalizeCrowdBid(item, 30);
                                            const scaleText = Utils.escapeHtml(formatCrowdScaleText(item, idx));
                                            const reasonText = Utils.escapeHtml(resolveCrowdReasonText(item, idx, rawName));
                                            const selected = selectedSet.has(key);
                                            return `
                                                <div class="am-wxt-scene-crowd-candidate-row">
                                                    <div class="am-wxt-scene-crowd-candidate-name">
                                                        <div class="name">${name}</div>
                                                        <div class="meta">${labelId || '未提供ID'}</div>
                                                    </div>
                                                    <div class="am-wxt-scene-crowd-candidate-scale">${scaleText}</div>
                                                    <div class="am-wxt-scene-crowd-candidate-reason">
                                                        <span class="tag">${reasonText}</span>
                                                    </div>
                                                    <div class="am-wxt-scene-crowd-candidate-bid">
                                                        <input type="number" min="30" max="300" step="1" value="${Utils.escapeHtml(String(bid))}" data-scene-popup-crowd-bid="${Utils.escapeHtml(key)}" />
                                                        <span>%</span>
                                                    </div>
                                                    <div class="am-wxt-scene-crowd-candidate-actions">
                                                        ${selected
                                                    ? `<button type="button" class="am-wxt-btn" data-scene-popup-crowd-remove="${Utils.escapeHtml(key)}">移除</button>`
                                                    : `<button type="button" class="am-wxt-btn primary" data-scene-popup-crowd-add="${Utils.escapeHtml(key)}">添加</button>`}
                                                    </div>
                                                </div>
                                            `;
                                        }).join('');
                                    };
                                    const renderSelectedList = () => {
                                        if (!(crowdSelectedListEl instanceof HTMLElement)) return;
                                        if (crowdSelectedCountEl instanceof HTMLElement) {
                                            crowdSelectedCountEl.textContent = String(selectedList.length);
                                        }
                                        if (!selectedList.length) {
                                            crowdSelectedListEl.innerHTML = '<div class="am-wxt-scene-crowd-empty">暂无已选人群</div>';
                                            return;
                                        }
                                        crowdSelectedListEl.innerHTML = selectedList.map((item, idx) => {
                                            const key = getCrowdKey(item, idx);
                                            const name = Utils.escapeHtml(getCrowdDisplayName(item) || `已选人群${idx + 1}`);
                                            const labelId = Utils.escapeHtml(
                                                normalizeSceneSettingValue(item?.crowd?.label?.labelId || key)
                                            );
                                            const bid = normalizeCrowdBid(item, 30);
                                            return `
                                                <div class="am-wxt-scene-crowd-selected-row">
                                                    <div class="am-wxt-scene-crowd-selected-name">
                                                        <div class="name">${name}</div>
                                                        <div class="meta">${labelId || '未提供ID'}</div>
                                                    </div>
                                                    <div class="am-wxt-scene-crowd-selected-bid">
                                                        <input type="number" min="30" max="300" step="1" value="${Utils.escapeHtml(String(bid))}" data-scene-popup-crowd-selected-bid="${Utils.escapeHtml(key)}" />
                                                        <span>%</span>
                                                    </div>
                                                    <button type="button" class="am-wxt-btn" data-scene-popup-crowd-remove="${Utils.escapeHtml(key)}">移除</button>
                                                </div>
                                            `;
                                        }).join('');
                                    };
                                    const syncJsonEditors = () => {
                                        if (campaignEditor instanceof HTMLTextAreaElement) {
                                            campaignEditor.value = JSON.stringify(selectedList, null, 2);
                                        }
                                        if (adgroupEditor instanceof HTMLTextAreaElement) {
                                            adgroupEditor.value = JSON.stringify(selectedList, null, 2);
                                        }
                                    };
                                    const toggleJsonMode = (nextVisible) => {
                                        jsonMode = !!nextVisible;
                                        if (crowdJsonWrap instanceof HTMLElement) {
                                            crowdJsonWrap.classList.toggle('hidden', !jsonMode);
                                        }
                                        syncJsonEditors();
                                    };
                                    const findCandidateByKey = (key = '') => (
                                        candidateList.find((item, idx) => getCrowdKey(item, idx) === key) || null
                                    );
                                    const findCandidateByToken = (token = '') => {
                                        const normalizedToken = String(token || '').trim();
                                        if (!normalizedToken) return null;
                                        const loweredToken = normalizedToken.toLowerCase();
                                        return candidateList.find(item => {
                                            const labelId = normalizeSceneSettingValue(item?.crowd?.label?.labelId || '').trim();
                                            const crowdName = normalizeSceneSettingValue(getCrowdDisplayName(item) || '').trim();
                                            return (labelId && labelId === normalizedToken)
                                                || (crowdName && crowdName.toLowerCase() === loweredToken);
                                        }) || null;
                                    };
                                    const buildManualCrowdCandidate = (token = '') => {
                                        const normalizedToken = String(token || '').trim();
                                        const isLabelId = /^\d{4,}$/.test(normalizedToken);
                                        const labelId = isLabelId ? normalizedToken : '';
                                        const crowdName = normalizedToken;
                                        const fallbackKey = normalizeSceneFieldKey(crowdName)
                                            || `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                                        return {
                                            mx_crowdId: isLabelId ? `manual_label_${labelId}` : `manual_name_${fallbackKey}`,
                                            crowd: {
                                                targetType: 'label',
                                                label: {
                                                    labelId,
                                                    labelName: crowdName,
                                                    optionList: []
                                                },
                                                crowdName
                                            },
                                            price: { price: 30 },
                                            reasonTagList: [{ name: '手动新增' }]
                                        };
                                    };
                                    const ensureCandidateByToken = (token = '') => {
                                        const normalizedToken = String(token || '').trim();
                                        if (!normalizedToken) return null;
                                        const existed = findCandidateByToken(normalizedToken);
                                        if (existed) return existed;
                                        const manualCandidate = buildManualCrowdCandidate(normalizedToken);
                                        mergeCandidateList([manualCandidate], 320);
                                        return findCandidateByToken(normalizedToken) || manualCandidate;
                                    };
                                    const removeSelectedByKey = (key = '') => {
                                        selectedList = selectedList.filter((item, idx) => getCrowdKey(item, idx) !== key);
                                    };
                                    const addSelectedByKey = (key = '') => {
                                        const candidate = findCandidateByKey(key);
                                        if (!candidate) return;
                                        if (selectedList.some((item, idx) => getCrowdKey(item, idx) === key)) return;
                                        if (selectedList.length >= 100) {
                                            appendWizardLog('最多添加 100 条精选人群', 'error');
                                            return;
                                        }
                                        selectedList.push(deepClone(candidate));
                                    };
                                    const addSelectedByToken = (token = '') => {
                                        const candidate = ensureCandidateByToken(token);
                                        if (!candidate) return false;
                                        const key = getCrowdKey(candidate, candidateList.findIndex(item => item === candidate));
                                        if (!key) return false;
                                        if (selectedList.some((item, idx) => getCrowdKey(item, idx) === key)) return false;
                                        if (selectedList.length >= 100) return false;
                                        selectedList.push(deepClone(candidate));
                                        return true;
                                    };
                                    const renderCrowdPopupLists = () => {
                                        renderCandidateList();
                                        renderSelectedList();
                                    };
                                    const refreshCrowdPopupViews = () => {
                                        syncJsonEditors();
                                        renderCrowdPopupLists();
                                    };
                                    const refreshCrowdAddDialogViews = (options = {}) => {
                                        if (options.refreshPopup !== false) {
                                            refreshCrowdPopupViews();
                                        }
                                        if (options.renderNative !== false) {
                                            renderCrowdAddNative();
                                        }
                                    };
                                    const getCrowdAddNativeFilteredList = () => {
                                        return candidateList.filter((item, idx) => {
                                            const key = getCrowdKey(item, idx);
                                            if (!key) return false;
                                            const name = String(getCrowdDisplayName(item) || '').trim();
                                            const labelId = normalizeSceneSettingValue(item?.crowd?.label?.labelId || key);
                                            const reason = resolveCrowdReasonText(item, idx, name);
                                            const tabKey = resolveCrowdNativeTabKey(item, idx, name);
                                            if (tabKey !== crowdAddNativeTab) return false;
                                            if (
                                                crowdAddNativeTab === 'compete_new'
                                                && resolveCrowdNativeCompeteSubtabKey(item, idx, name) !== crowdAddNativeSubtab
                                            ) return false;
                                            if (!crowdAddNativeKeyword) return true;
                                            const haystack = `${name} ${labelId} ${reason}`.toLowerCase();
                                            return haystack.includes(crowdAddNativeKeyword.toLowerCase());
                                        });
                                    };
                                    const renderCrowdAddNativeTabs = () => {
                                        crowdAddNativeTabButtons.forEach(btn => {
                                            if (!(btn instanceof HTMLButtonElement)) return;
                                            const key = String(btn.getAttribute('data-scene-popup-crowd-native-tab') || '').trim();
                                            const active = key === crowdAddNativeTab;
                                            btn.classList.toggle('active', active);
                                            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
                                        });
                                        crowdAddNativeSubtabButtons.forEach(btn => {
                                            if (!(btn instanceof HTMLButtonElement)) return;
                                            const key = String(btn.getAttribute('data-scene-popup-crowd-native-subtab') || '').trim();
                                            const active = key === crowdAddNativeSubtab;
                                            btn.classList.toggle('active', active);
                                            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
                                        });
                                        if (crowdAddNativeSubtabsWrap instanceof HTMLElement) {
                                            crowdAddNativeSubtabsWrap.classList.toggle('hidden', crowdAddNativeTab !== 'compete_new');
                                        }
                                        if (crowdAddNativeSearchInput instanceof HTMLInputElement) {
                                            crowdAddNativeSearchInput.value = crowdAddNativeKeyword;
                                        }
                                    };
                                    const renderCrowdAddNativeCandidateList = () => {
                                        if (!(crowdAddNativeCandidateListEl instanceof HTMLElement)) return;
                                        const selectedSet = getSelectedKeySet();
                                        const filtered = getCrowdAddNativeFilteredList();
                                        if (!filtered.length) {
                                            crowdAddNativeCandidateListEl.innerHTML = '<div class="am-wxt-scene-crowd-empty">暂无可选人群</div>';
                                            return;
                                        }
                                        crowdAddNativeCandidateListEl.innerHTML = filtered.map((item, idx) => {
                                            const key = getCrowdKey(item, idx);
                                            const rawName = getCrowdDisplayName(item) || `精选人群${idx + 1}`;
                                            const selected = selectedSet.has(key);
                                            const labelId = normalizeSceneSettingValue(item?.crowd?.label?.labelId || key);
                                            return `
                                                <div class="am-wxt-scene-crowd-native-candidate-row">
                                                    <div class="am-wxt-scene-crowd-native-candidate-name">
                                                        <div class="name">${Utils.escapeHtml(rawName)}</div>
                                                        <div class="meta">${Utils.escapeHtml(labelId || '未提供ID')}</div>
                                                    </div>
                                                    <div class="am-wxt-scene-crowd-native-candidate-reason">
                                                        ${Utils.escapeHtml(resolveCrowdReasonText(item, idx, rawName))}
                                                    </div>
                                                    <div class="am-wxt-scene-crowd-native-candidate-scale">
                                                        ${Utils.escapeHtml(formatCrowdScaleText(item, idx))}
                                                    </div>
                                                    <div class="am-wxt-scene-crowd-native-candidate-actions">
                                                        ${selected
                                                    ? `<button type="button" class="am-wxt-btn" data-scene-popup-crowd-native-remove="${Utils.escapeHtml(key)}">取消添加</button>`
                                                    : `<button type="button" class="am-wxt-btn primary" data-scene-popup-crowd-native-add="${Utils.escapeHtml(key)}">添加</button>`}
                                                    </div>
                                                </div>
                                            `;
                                        }).join('');
                                    };
                                    const renderCrowdAddNativeSelectedList = () => {
                                        if (crowdAddNativeSelectedCountEl instanceof HTMLElement) {
                                            crowdAddNativeSelectedCountEl.textContent = String(selectedList.length);
                                        }
                                        if (!(crowdAddNativeSelectedListEl instanceof HTMLElement)) return;
                                        if (!selectedList.length) {
                                            crowdAddNativeSelectedListEl.innerHTML = '<div class="am-wxt-scene-crowd-empty">请从左侧添加人群</div>';
                                            return;
                                        }
                                        crowdAddNativeSelectedListEl.innerHTML = selectedList.map((item, idx) => {
                                            const key = getCrowdKey(item, idx);
                                            const crowdName = getCrowdDisplayName(item) || `已选人群${idx + 1}`;
                                            const source = resolveCrowdNativeSourceLabel(item, idx, crowdName);
                                            return `
                                                <div class="am-wxt-scene-crowd-native-selected-row">
                                                    <div class="am-wxt-scene-crowd-native-selected-name">${Utils.escapeHtml(crowdName)}</div>
                                                    <div class="am-wxt-scene-crowd-native-selected-source">${Utils.escapeHtml(source)}</div>
                                                    <div class="am-wxt-scene-crowd-native-selected-actions">
                                                        <a href="javascript:;" data-scene-popup-crowd-native-remove-selected="${Utils.escapeHtml(key)}">移除</a>
                                                    </div>
                                                </div>
                                            `;
                                        }).join('');
                                    };
                                    const renderCrowdAddNativeLists = () => {
                                        renderCrowdAddNativeCandidateList();
                                        renderCrowdAddNativeSelectedList();
                                    };
                                    const renderCrowdAddNative = () => {
                                        if (!crowdAddDialogOpen) return;
                                        renderCrowdAddNativeTabs();
                                        renderCrowdAddNativeLists();
                                    };
                                    const closeCrowdAddDialog = (commit = false) => {
                                        if (!(crowdAddMask instanceof HTMLElement)) return;
                                        if (!crowdAddDialogOpen) {
                                            crowdAddMask.classList.add('hidden');
                                            return;
                                        }
                                        if (!commit && Array.isArray(crowdAddDialogSnapshot)) {
                                            selectedList = crowdAddDialogSnapshot.map(item => deepClone(item));
                                            refreshCrowdAddDialogViews({ renderNative: false });
                                        }
                                        crowdAddDialogOpen = false;
                                        crowdAddDialogSnapshot = [];
                                        crowdAddMask.classList.add('hidden');
                                        if (crowdAddInput instanceof HTMLInputElement) {
                                            crowdAddInput.value = '';
                                        }
                                    };
                                    const openCrowdAddDialog = () => {
                                        if (!(crowdAddMask instanceof HTMLElement)) return;
                                        crowdAddDialogSnapshot = selectedList.map(item => deepClone(item));
                                        crowdAddNativeTab = 'compete_new';
                                        crowdAddNativeSubtab = 'item';
                                        crowdAddNativeKeyword = '';
                                        crowdAddDialogOpen = true;
                                        crowdAddMask.classList.remove('hidden');
                                        renderCrowdAddNative();
                                        requestAnimationFrame(() => {
                                            if (crowdAddNativeSearchInput instanceof HTMLInputElement) {
                                                try {
                                                    crowdAddNativeSearchInput.focus({ preventScroll: true });
                                                } catch {
                                                    crowdAddNativeSearchInput.focus();
                                                }
                                            }
                                        });
                                    };
                                    const submitCrowdAddInput = () => {
                                        const rawInput = String(crowdAddInput instanceof HTMLInputElement ? crowdAddInput.value : '').trim();
                                        if (!rawInput) {
                                            appendWizardLog('请先输入人群名称或标签ID', 'error');
                                            return;
                                        }
                                        const tokens = uniqueBy(
                                            rawInput.split(/[,\n，]/g).map(item => item.trim()).filter(Boolean),
                                            item => item
                                        ).slice(0, 120);
                                        if (!tokens.length) {
                                            appendWizardLog('请先输入人群名称或标签ID', 'error');
                                            return;
                                        }
                                        let addedCount = 0;
                                        let skippedCount = 0;
                                        tokens.forEach(token => {
                                            const added = addSelectedByToken(token);
                                            if (added) addedCount += 1;
                                            else skippedCount += 1;
                                        });
                                        if (selectedList.length >= 100 && skippedCount > 0) {
                                            appendWizardLog('最多添加 100 条精选人群', 'error');
                                        }
                                        refreshCrowdAddDialogViews();
                                        appendWizardLog(
                                            `新增人群处理完成：新增 ${addedCount} 条${skippedCount ? `，跳过 ${skippedCount} 条` : ''}`,
                                            addedCount > 0 ? 'success' : 'error'
                                        );
                                        if (crowdAddInput instanceof HTMLInputElement) {
                                            crowdAddInput.value = '';
                                        }
                                    };
                                    const updateBidByKey = (key = '', nextBid = 30) => {
                                        const safeBid = normalizeCrowdBid({ price: { price: nextBid } }, 30);
                                        candidateList = candidateList.map((item, idx) => {
                                            if (getCrowdKey(item, idx) !== key) return item;
                                            return cloneWithCrowdBid(item, safeBid);
                                        });
                                        selectedList = selectedList.map((item, idx) => {
                                            if (getCrowdKey(item, idx) !== key) return item;
                                            return cloneWithCrowdBid(item, safeBid);
                                        });
                                        return safeBid;
                                    };
                                    if (campaignEditor instanceof HTMLTextAreaElement) {
                                        campaignEditor.value = JSON.stringify(
                                            parseScenePopupJsonArray(crowdCampaignRaw, []).filter(item => isPlainObject(item)),
                                            null,
                                            2
                                        );
                                    }
                                    if (adgroupEditor instanceof HTMLTextAreaElement) {
                                        adgroupEditor.value = JSON.stringify(
                                            parseScenePopupJsonArray(crowdAdgroupRaw, []).filter(item => isPlainObject(item)),
                                            null,
                                            2
                                        );
                                    }
                                    renderTabs();
                                    renderQuickFilters();
                                    renderCandidateList();
                                    renderSelectedList();
                                    syncJsonEditors();
                                    toggleJsonMode(false);
                                    tabButtons.forEach(btn => {
                                        if (!(btn instanceof HTMLButtonElement)) return;
                                        btn.onclick = () => {
                                            const nextTab = String(btn.getAttribute('data-scene-popup-crowd-tab') || '').trim() || 'recommend';
                                            activeTab = nextTab;
                                            renderTabs();
                                            renderCandidateList();
                                        };
                                    });
                                    quickFilterButtons.forEach(btn => {
                                        if (!(btn instanceof HTMLButtonElement)) return;
                                        btn.onclick = () => {
                                            const nextFilter = String(btn.getAttribute('data-scene-popup-crowd-quick-filter') || '').trim() || 'all';
                                            activeQuickFilter = nextFilter;
                                            renderQuickFilters();
                                            renderCandidateList();
                                        };
                                    });
                                    const copyBtn = mask.querySelector('[data-scene-popup-copy-right-list]');
                                    if (copyBtn instanceof HTMLButtonElement) {
                                        copyBtn.onclick = () => {
                                            selectedList = uniqueBy(
                                                (Array.isArray(wizardState.crowdList) ? wizardState.crowdList : [])
                                                    .filter(item => isPlainObject(item))
                                                    .map(item => deepClone(item)),
                                                (item, idx) => getCrowdKey(item, idx)
                                            ).slice(0, 100);
                                            refreshCrowdAddDialogViews();
                                        };
                                    }
                                    const crowdAddNewBtn = mask.querySelector('[data-scene-popup-crowd-add-new]');
                                    const crowdAddCloseBtn = mask.querySelector('[data-scene-popup-crowd-add-close]');
                                    const crowdAddCancelBtn = mask.querySelector('[data-scene-popup-crowd-add-cancel]');
                                    const crowdAddConfirmBtn = mask.querySelector('[data-scene-popup-crowd-add-confirm]');
                                    if (crowdAddNewBtn instanceof HTMLButtonElement) {
                                        crowdAddNewBtn.onclick = () => {
                                            openCrowdAddDialog();
                                            void loadSystemCrowdCandidates(true);
                                        };
                                    }
                                    if (crowdAddCloseBtn instanceof HTMLButtonElement) {
                                        crowdAddCloseBtn.onclick = () => closeCrowdAddDialog(false);
                                    }
                                    if (crowdAddCancelBtn instanceof HTMLButtonElement) {
                                        crowdAddCancelBtn.onclick = () => closeCrowdAddDialog(false);
                                    }
                                    if (crowdAddConfirmBtn instanceof HTMLButtonElement) {
                                        crowdAddConfirmBtn.onclick = () => closeCrowdAddDialog(true);
                                    }
                                    if (crowdAddInput instanceof HTMLInputElement) {
                                        crowdAddInput.addEventListener('keydown', (event) => {
                                            if (event.key !== 'Enter') return;
                                            event.preventDefault();
                                            submitCrowdAddInput();
                                        });
                                    }
                                    if (crowdAddNativeManualAddBtn instanceof HTMLButtonElement) {
                                        crowdAddNativeManualAddBtn.onclick = () => submitCrowdAddInput();
                                    }
                                    crowdAddNativeTabButtons.forEach(btn => {
                                        if (!(btn instanceof HTMLButtonElement)) return;
                                        btn.onclick = () => {
                                            const nextTab = String(btn.getAttribute('data-scene-popup-crowd-native-tab') || '').trim() || 'compete_new';
                                            crowdAddNativeTab = nextTab;
                                            if (crowdAddNativeTab !== 'compete_new') {
                                                crowdAddNativeSubtab = 'item';
                                            }
                                            renderCrowdAddNative();
                                        };
                                    });
                                    crowdAddNativeSubtabButtons.forEach(btn => {
                                        if (!(btn instanceof HTMLButtonElement)) return;
                                        btn.onclick = () => {
                                            const nextSubtab = String(btn.getAttribute('data-scene-popup-crowd-native-subtab') || '').trim() || 'item';
                                            crowdAddNativeSubtab = nextSubtab;
                                            renderCrowdAddNative();
                                        };
                                    });
                                    if (crowdAddNativeSearchInput instanceof HTMLInputElement) {
                                        crowdAddNativeSearchInput.addEventListener('input', () => {
                                            crowdAddNativeKeyword = String(crowdAddNativeSearchInput.value || '').trim();
                                            renderCrowdAddNativeCandidateList();
                                        });
                                    }
                                    if (crowdAddNativeSearchResetBtn instanceof HTMLButtonElement) {
                                        crowdAddNativeSearchResetBtn.onclick = () => {
                                            crowdAddNativeKeyword = '';
                                            if (crowdAddNativeSearchInput instanceof HTMLInputElement) {
                                                crowdAddNativeSearchInput.value = '';
                                            }
                                            renderCrowdAddNativeCandidateList();
                                        };
                                    }
                                    if (crowdAddNativeAddAllBtn instanceof HTMLButtonElement) {
                                        crowdAddNativeAddAllBtn.onclick = () => {
                                            const filtered = getCrowdAddNativeFilteredList();
                                            let addedCount = 0;
                                            filtered.forEach((item, idx) => {
                                                if (selectedList.length >= 100) return;
                                                const key = getCrowdKey(item, idx);
                                                const beforeCount = selectedList.length;
                                                addSelectedByKey(key);
                                                if (selectedList.length > beforeCount) addedCount += 1;
                                            });
                                            refreshCrowdAddDialogViews();
                                            if (addedCount === 0) {
                                                appendWizardLog('当前筛选结果无可新增人群', 'error');
                                            } else {
                                                appendWizardLog(`已批量添加 ${addedCount} 条人群`, 'success');
                                            }
                                        };
                                    }
                                    if (crowdAddNativeClearBtn instanceof HTMLElement) {
                                        crowdAddNativeClearBtn.addEventListener('click', (event) => {
                                            event.preventDefault();
                                            selectedList = [];
                                            refreshCrowdAddDialogViews();
                                        });
                                    }
                                    if (crowdAddNativeCandidateListEl instanceof HTMLElement) {
                                        crowdAddNativeCandidateListEl.addEventListener('click', (event) => {
                                            const actionBtn = event.target instanceof HTMLElement
                                                ? event.target.closest('[data-scene-popup-crowd-native-add],[data-scene-popup-crowd-native-remove]')
                                                : null;
                                            if (!(actionBtn instanceof HTMLElement)) return;
                                            const addKey = String(actionBtn.getAttribute('data-scene-popup-crowd-native-add') || '').trim();
                                            const removeKey = String(actionBtn.getAttribute('data-scene-popup-crowd-native-remove') || '').trim();
                                            if (addKey) addSelectedByKey(addKey);
                                            if (removeKey) removeSelectedByKey(removeKey);
                                            refreshCrowdAddDialogViews();
                                        });
                                    }
                                    if (crowdAddNativeSelectedListEl instanceof HTMLElement) {
                                        crowdAddNativeSelectedListEl.addEventListener('click', (event) => {
                                            const removeBtn = event.target instanceof HTMLElement
                                                ? event.target.closest('[data-scene-popup-crowd-native-remove-selected]')
                                                : null;
                                            if (!(removeBtn instanceof HTMLElement)) return;
                                            const key = String(removeBtn.getAttribute('data-scene-popup-crowd-native-remove-selected') || '').trim();
                                            if (!key) return;
                                            removeSelectedByKey(key);
                                            refreshCrowdAddDialogViews();
                                        });
                                    }
                                    if (crowdAddMask instanceof HTMLElement) {
                                        crowdAddMask.addEventListener('click', (event) => {
                                            if (event.target !== crowdAddMask) return;
                                            closeCrowdAddDialog(false);
                                        });
                                    }
                                    const jsonToggleBtn = mask.querySelector('[data-scene-popup-crowd-toggle-json]');
                                    if (jsonToggleBtn instanceof HTMLButtonElement) {
                                        jsonToggleBtn.onclick = () => {
                                            toggleJsonMode(!jsonMode);
                                            jsonToggleBtn.classList.toggle('primary', jsonMode);
                                        };
                                    }
                                    const batchBidBtn = mask.querySelector('[data-scene-popup-crowd-batch-bid]');
                                    if (batchBidBtn instanceof HTMLButtonElement) {
                                        batchBidBtn.onclick = () => {
                                            if (!selectedList.length) {
                                                appendWizardLog('请先添加人群后再设置溢价', 'error');
                                                return;
                                            }
                                            const defaultBid = normalizeCrowdBid(selectedList[0], 30);
                                            const inputText = String(window.prompt('请输入批量溢价（30-300）', String(defaultBid)) || '').trim();
                                            if (!inputText) return;
                                            const nextBid = normalizeCrowdBid({ price: { price: inputText } }, defaultBid);
                                            const selectedKeySet = new Set(selectedList.map((item, idx) => getCrowdKey(item, idx)));
                                            candidateList = candidateList.map((item, idx) => {
                                                if (!selectedKeySet.has(getCrowdKey(item, idx))) return item;
                                                return cloneWithCrowdBid(item, nextBid);
                                            });
                                            selectedList = selectedList.map(item => cloneWithCrowdBid(item, nextBid));
                                            refreshCrowdAddDialogViews();
                                        };
                                    }
                                    const clearBtn = mask.querySelector('[data-scene-popup-crowd-clear-selected]');
                                    if (clearBtn instanceof HTMLButtonElement) {
                                        clearBtn.onclick = () => {
                                            selectedList = [];
                                            refreshCrowdAddDialogViews();
                                        };
                                    }
                                    if (crowdCandidateListEl instanceof HTMLElement) {
                                        crowdCandidateListEl.addEventListener('click', (event) => {
                                            const actionBtn = event.target instanceof HTMLElement
                                                ? event.target.closest('[data-scene-popup-crowd-add],[data-scene-popup-crowd-remove]')
                                                : null;
                                            if (!(actionBtn instanceof HTMLElement)) return;
                                            const addKey = String(actionBtn.getAttribute('data-scene-popup-crowd-add') || '').trim();
                                            const removeKey = String(actionBtn.getAttribute('data-scene-popup-crowd-remove') || '').trim();
                                            if (addKey) addSelectedByKey(addKey);
                                            if (removeKey) removeSelectedByKey(removeKey);
                                            refreshCrowdAddDialogViews();
                                        });
                                        crowdCandidateListEl.addEventListener('input', (event) => {
                                            const input = event.target instanceof HTMLInputElement
                                                ? event.target
                                                : null;
                                            if (!(input instanceof HTMLInputElement)) return;
                                            const key = String(input.getAttribute('data-scene-popup-crowd-bid') || '').trim();
                                            if (!key) return;
                                            const nextBid = updateBidByKey(key, input.value);
                                            input.value = String(nextBid);
                                            refreshCrowdAddDialogViews();
                                        });
                                    }
                                    if (crowdSelectedListEl instanceof HTMLElement) {
                                        crowdSelectedListEl.addEventListener('click', (event) => {
                                            const removeBtn = event.target instanceof HTMLElement
                                                ? event.target.closest('[data-scene-popup-crowd-remove]')
                                                : null;
                                            if (!(removeBtn instanceof HTMLElement)) return;
                                            const key = String(removeBtn.getAttribute('data-scene-popup-crowd-remove') || '').trim();
                                            if (!key) return;
                                            removeSelectedByKey(key);
                                            refreshCrowdAddDialogViews();
                                        });
                                        crowdSelectedListEl.addEventListener('input', (event) => {
                                            const input = event.target instanceof HTMLInputElement
                                                ? event.target
                                                : null;
                                            if (!(input instanceof HTMLInputElement)) return;
                                            const key = String(input.getAttribute('data-scene-popup-crowd-selected-bid') || '').trim();
                                            if (!key) return;
                                            const nextBid = updateBidByKey(key, input.value);
                                            input.value = String(nextBid);
                                            refreshCrowdAddDialogViews();
                                        });
                                    }
                                    mask._sceneCrowdPopupState = {
                                        getSelectedList: () => selectedList.map(item => deepClone(item)),
                                        isJsonMode: () => !!jsonMode
                                    };
                                    void loadSystemCrowdCandidates(false);
                                },
                                onSave: (mask) => {
                                    const campaignEditor = mask.querySelector('[data-scene-popup-editor="crowdCampaign"]');
                                    const adgroupEditor = mask.querySelector('[data-scene-popup-editor="crowdAdgroup"]');
                                    const popupState = mask._sceneCrowdPopupState || {};
                                    const selectedOutput = typeof popupState.getSelectedList === 'function'
                                        ? popupState.getSelectedList()
                                        : [];
                                    const jsonModeEnabled = typeof popupState.isJsonMode === 'function'
                                        ? popupState.isJsonMode()
                                        : false;
                                    let campaignOutput = selectedOutput.map(item => deepClone(item));
                                    let adgroupOutput = selectedOutput.map(item => deepClone(item));
                                    if (jsonModeEnabled) {
                                        const campaignParsed = tryParseMaybeJSON(
                                            String(campaignEditor instanceof HTMLTextAreaElement ? campaignEditor.value : '').trim() || '[]'
                                        );
                                        const adgroupParsed = tryParseMaybeJSON(
                                            String(adgroupEditor instanceof HTMLTextAreaElement ? adgroupEditor.value : '').trim() || '[]'
                                        );
                                        if (!Array.isArray(campaignParsed) || !Array.isArray(adgroupParsed)) {
                                            appendWizardLog('人群配置格式错误：请填写 JSON 数组', 'error');
                                            return { ok: false };
                                        }
                                        campaignOutput = campaignParsed.filter(item => isPlainObject(item));
                                        adgroupOutput = adgroupParsed.filter(item => isPlainObject(item));
                                    }
                                    return {
                                        ok: true,
                                        campaignRaw: JSON.stringify(campaignOutput),
                                        adgroupRaw: JSON.stringify(adgroupOutput),
                                        summary: describeCrowdSummary(JSON.stringify(campaignOutput), JSON.stringify(adgroupOutput)),
                                        adgroupList: adgroupOutput
                                    };
                                }
                            });
                            if (!result || result.ok !== true) return;
                            dispatchSceneControlUpdate(crowdCampaignControl, result.campaignRaw || '[]');
                            dispatchSceneControlUpdate(crowdAdgroupControl, result.adgroupRaw || '[]');
                            if (Array.isArray(result.adgroupList)) {
                                wizardState.crowdList = deepClone(result.adgroupList);
                                if (typeof wizardState.renderCrowdList === 'function') {
                                    wizardState.renderCrowdList();
                                }
                            }
                            updateScenePopupSummary(row, trigger, result.summary || describeCrowdSummary(result.campaignRaw || '[]', result.adgroupRaw || '[]'));
                        } else if (trigger === 'crowdFilter') {
                            const popupPayload = await openCrowdFilterSettingPopup();
                            if (!popupPayload || popupPayload.ok !== true) return;
                            const { result, filterControl } = popupPayload;
                            dispatchSceneControlUpdate(filterControl, result.filterRaw || '{}');
                            updateScenePopupSummary(
                                row,
                                trigger,
                                result.summary || describeCrowdFilterSummary(result.filterRaw || '{}')
                            );
                        } else if (trigger === 'budgetGuard') {
                            const popupPayload = await openBudgetGuardSettingPopup();
                            if (!popupPayload || popupPayload.ok !== true) return;
                            const { result, configControl } = popupPayload;
                            dispatchSceneControlUpdate(
                                configControl,
                                result.configRaw || JSON.stringify(normalizeBudgetGuardConfig({}))
                            );
                            updateScenePopupSummary(
                                row,
                                trigger,
                                result.summary || describeBudgetGuardSummary(result.configRaw || '{}')
                            );
                            const mainControl = findMainControl();
                            if (mainControl instanceof HTMLInputElement) {
                                const normalizedSwitchValue = /^(0|false|off|关闭|否)$/i.test(
                                    normalizeSceneSettingValue(mainControl.value || '')
                                )
                                    ? '关闭'
                                    : '开启';
                                dispatchSceneControlUpdate(mainControl, normalizedSwitchValue);
                            }
                        } else {
                            return;
                        }

                        commitSceneDynamicUiState({ renderSceneDynamic: true });
                    });
                });

                const scenePopupSummaryTriggers = wizardState.els.sceneDynamic.querySelectorAll('[data-scene-popup-trigger-proxy]');
                scenePopupSummaryTriggers.forEach(summary => {
                    if (!(summary instanceof HTMLElement)) return;
                    const resolveScenePopupButton = () => {
                        const row = summary.closest('.am-wxt-scene-setting-row');
                        if (!(row instanceof HTMLElement)) return null;
                        const trigger = String(summary.getAttribute('data-scene-popup-trigger-proxy') || '').trim();
                        if (!trigger) return null;
                        const popupButtons = row.querySelectorAll('[data-scene-popup-trigger]');
                        return Array.from(popupButtons).find(candidate => (
                            candidate instanceof HTMLButtonElement
                            && String(candidate.getAttribute('data-scene-popup-trigger') || '').trim() === trigger
                        )) || null;
                    };
                    summary.addEventListener('click', (event) => {
                        event.preventDefault();
                        const button = resolveScenePopupButton();
                        if (!(button instanceof HTMLButtonElement)) return;
                        button.click();
                    });
                    summary.addEventListener('keydown', (event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return;
                        event.preventDefault();
                        const button = resolveScenePopupButton();
                        if (!(button instanceof HTMLButtonElement)) return;
                        button.click();
                    });
                });

                const controls = wizardState.els.sceneDynamic.querySelectorAll('[data-scene-field]');
                controls.forEach(control => {
                    const onChange = () => {
                        const activeScene = String(wizardState.els.sceneSelect?.value || wizardState.draft?.sceneName || '关键词推广').trim();
                        const fieldKey = String(control.getAttribute('data-scene-field') || '').trim();
                        const localSceneBucket = ensureSceneSettingBucket(activeScene);
                        const localTouchedBucket = ensureSceneTouchedBucket(activeScene);
                        if (activeScene && fieldKey) {
                            localTouchedBucket[fieldKey] = true;
                        }
                        if (activeScene === '关键词推广' && isGoalSelectorField(fieldKey)) {
                            [
                                normalizeSceneFieldKey('出价目标'),
                                normalizeSceneFieldKey('优化目标'),
                                normalizeSceneFieldKey('核心词设置'),
                                normalizeSceneFieldKey('关键词设置'),
                                normalizeSceneFieldKey('匹配方式'),
                                normalizeSceneFieldKey('流量智选'),
                                normalizeSceneFieldKey('开启冷启加速'),
                                normalizeSceneFieldKey('冷启加速'),
                                normalizeSceneFieldKey('卡位方式'),
                                normalizeSceneFieldKey('campaign.promotionScene'),
                                normalizeSceneFieldKey('campaign.itemSelectedMode'),
                                normalizeSceneFieldKey('campaign.bidTargetV2'),
                                normalizeSceneFieldKey('campaign.optimizeTarget')
                            ].forEach(key => {
                                if (!key) return;
                                localTouchedBucket[key] = false;
                                if (key !== fieldKey) delete localSceneBucket[key];
                            });
                            const selectedGoal = normalizeGoalCandidateLabel(
                                normalizeSceneSettingValue(control.value)
                                || normalizeSceneSettingValue(localSceneBucket[normalizeSceneFieldKey('营销目标')] || '')
                                || normalizeSceneSettingValue(localSceneBucket[normalizeSceneFieldKey('选择卡位方案')] || '')
                            );
                            const keywordRuntime = resolveKeywordGoalRuntime(selectedGoal || '趋势明星');
                            if (keywordRuntime.marketingGoal) {
                                const goalFieldKey = normalizeSceneFieldKey('营销目标');
                                const goalSchemeFieldKey = normalizeSceneFieldKey('选择卡位方案');
                                if (goalFieldKey) {
                                    localSceneBucket[goalFieldKey] = keywordRuntime.marketingGoal;
                                    localTouchedBucket[goalFieldKey] = false;
                                }
                                if (goalSchemeFieldKey) {
                                    localSceneBucket[goalSchemeFieldKey] = keywordRuntime.marketingGoal;
                                    localTouchedBucket[goalSchemeFieldKey] = false;
                                }
                            }
                            if (keywordRuntime.promotionScene) {
                                const campaignPromotionSceneKey = normalizeSceneFieldKey('campaign.promotionScene');
                                if (campaignPromotionSceneKey) localSceneBucket[campaignPromotionSceneKey] = keywordRuntime.promotionScene;
                            }
                            if (keywordRuntime.itemSelectedMode) {
                                const campaignItemSelectedModeKey = normalizeSceneFieldKey('campaign.itemSelectedMode');
                                if (campaignItemSelectedModeKey) localSceneBucket[campaignItemSelectedModeKey] = keywordRuntime.itemSelectedMode;
                            }
                        }
                        if (activeScene === '关键词推广') {
                            const keywordActiveGoal = detectKeywordGoalFromText(
                                localSceneBucket[normalizeSceneFieldKey('营销目标')]
                                || localSceneBucket[normalizeSceneFieldKey('选择卡位方案')]
                                || ''
                            );
                            const resolveKeywordCostSwitchField = (candidateFieldKey = '') => {
                                if (!candidateFieldKey) return '';
                                if (
                                    isSceneLabelMatch(candidateFieldKey, '平均直接成交成本')
                                    || isSceneLabelMatch(candidateFieldKey, '平均成交成本')
                                ) {
                                    return normalizeSceneFieldKey('设置平均成交成本');
                                }
                                if (isSceneLabelMatch(candidateFieldKey, '平均收藏加购成本')) {
                                    return normalizeSceneFieldKey('设置平均收藏加购成本');
                                }
                                if (
                                    isSceneLabelMatch(candidateFieldKey, '平均点击成本')
                                    || isSceneLabelMatch(candidateFieldKey, '点击成本')
                                ) {
                                    return normalizeSceneFieldKey('设置平均点击成本');
                                }
                                return '';
                            };
                            const keywordCostSwitchFieldKey = keywordActiveGoal === '自定义推广'
                                ? resolveKeywordCostSwitchField(fieldKey)
                                : '';
                            if (keywordCostSwitchFieldKey) {
                                const valueText = control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement
                                    ? control.value
                                    : '';
                                const amount = parseNumberFromSceneValue(valueText);
                                if (Number.isFinite(amount) && amount > 0) {
                                    const relatedControls = Array.from(
                                        wizardState.els.sceneDynamic.querySelectorAll('[data-scene-field]')
                                    ).filter(candidate => {
                                        const candidateFieldKey = String(candidate.getAttribute('data-scene-field') || '').trim();
                                        return candidateFieldKey && candidateFieldKey === keywordCostSwitchFieldKey;
                                    });
                                    relatedControls.forEach(candidate => {
                                        if (!(candidate instanceof HTMLInputElement || candidate instanceof HTMLTextAreaElement)) return;
                                        candidate.value = '开启';
                                    });
                                    localSceneBucket[keywordCostSwitchFieldKey] = '开启';
                                    localTouchedBucket[keywordCostSwitchFieldKey] = true;
                                    wizardState.els.sceneDynamic.querySelectorAll('[data-scene-switch-target]').forEach(peer => {
                                        if (!(peer instanceof HTMLButtonElement)) return;
                                        const peerFieldKey = String(peer.getAttribute('data-scene-switch-target') || '').trim();
                                        if (!peerFieldKey || peerFieldKey !== keywordCostSwitchFieldKey) return;
                                        syncSceneSwitchVisual(peer, true);
                                    });
                                }
                            }
                        }
                        const activeCrowdGoal = normalizeGoalCandidateLabel(
                            localSceneBucket[normalizeSceneFieldKey('营销目标')]
                            || localSceneBucket[normalizeSceneFieldKey('选择拉新方案')]
                            || localSceneBucket[normalizeSceneFieldKey('投放策略')]
                            || localSceneBucket[normalizeSceneFieldKey('选择方式')]
                            || ''
                        );
                        const activeKeywordGoal = detectKeywordGoalFromText(
                            localSceneBucket[normalizeSceneFieldKey('营销目标')]
                            || localSceneBucket[normalizeSceneFieldKey('选择卡位方案')]
                            || ''
                        );
                        const isCrowdCustomBidField = activeScene === '人群推广'
                            && activeCrowdGoal === '自定义推广'
                            && (isSceneLabelMatch(fieldKey, '出价方式') || isSceneLabelMatch(fieldKey, '出价目标'));
                        const isKeywordCustomRoiField = activeScene === '关键词推广'
                            && activeKeywordGoal === '自定义推广'
                            && isSceneLabelMatch(fieldKey, '设置7日投产比');
                        const shouldRerenderSceneConfig = isGoalSelectorField(fieldKey)
                            || (activeScene === '货品全站推广' && isSceneLabelMatch(fieldKey, '出价方式'))
                            || isCrowdCustomBidField
                            || isKeywordCustomRoiField;
                        commitSceneDynamicUiState({
                            renderSceneDynamic: shouldRerenderSceneConfig
                        });
                    };
                    control.addEventListener('input', onChange);
                    control.addEventListener('change', onChange);
                });
            };
            const collectManualKeywordRowsFromPanel = (panel) => (
                Array.from(panel?.querySelectorAll?.('[data-manual-keyword-row]') || [])
                    .map(row => {
                        const word = String(row?.getAttribute?.('data-manual-keyword-word') || '').trim();
                        if (!word) return null;
                        const bidPrice = toNumber(row?.getAttribute?.('data-manual-keyword-bid'), toNumber(wizardState.els.bidInput?.value, 1));
                        const matchScope = parseMatchScope(row?.getAttribute?.('data-manual-keyword-match'), DEFAULTS.matchScope);
                        const enabledInput = row?.querySelector?.('input[data-manual-keyword-enable]');
                        const enabled = !enabledInput || enabledInput.checked !== false;
                        return {
                            word,
                            bidPrice: Number.isFinite(bidPrice) ? bidPrice : 1,
                            matchScope,
                            onlineStatus: DEFAULTS.keywordOnlineStatus,
                            enabled
                        };
                    })
                    .filter(Boolean)
            );
