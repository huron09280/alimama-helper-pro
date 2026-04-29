                const getSceneFieldDisplayLabel = (rawFieldLabel = '') => {
                    const raw = String(normalizeSceneRenderFieldLabel(rawFieldLabel) || rawFieldLabel || '').trim();
                    if (!raw) return '';
                    const mapped = API_SCENE_FIELD_LABEL_MAP[raw];
                    if (!mapped) return raw;
                    return `${mapped}（${raw}）`;
                };

                const gridRows = fields.map(fieldLabel => {
                    const normalizedFieldLabel = normalizeSceneRenderFieldLabel(fieldLabel) || fieldLabel;
                    const key = normalizeSceneFieldKey(normalizedFieldLabel);
                    const renderFieldToken = normalizeSceneRenderFieldToken(normalizedFieldLabel);
                    if (bidConstraintFieldToken && renderFieldToken === bidConstraintFieldToken) return '';
                    let options = resolveSceneFieldOptions(profile, normalizedFieldLabel);
                    if (
                        sceneName === '关键词推广'
                        && detectKeywordGoalFromText(activeMarketingGoal || '') === '搜索卡位'
                        && normalizeSceneRenderFieldToken(normalizedFieldLabel) === '卡位方式'
                    ) {
                        options = uniqueBy(
                            options.concat(['抢首条', '抢前三', '抢首页', '位置不限提升市场渗透'])
                                .map(item => normalizeSceneSettingValue(item))
                                .filter(Boolean),
                            item => item
                        );
                    }
                    let value = normalizeSceneSettingValue(bucket[key] || '');
                    const fieldMeta = profile?.fieldMeta?.[key] || {};
                    const token = normalizeSceneLabelToken(normalizedFieldLabel);
                    const isApiPathField = /^(campaign\.|adgroup\.)/i.test(token);
                    const displayFieldLabel = getSceneFieldDisplayLabel(normalizedFieldLabel) || normalizedFieldLabel;
                    const optionType = resolveSceneFieldOptionType(normalizedFieldLabel);
                    const inlineControlHtml = (() => {
                        if (shouldInlineBudgetWithBudgetType && renderFieldToken === budgetTypeFieldToken) {
                            return buildInlineProxyInputControl(
                                '预算值',
                                'am-wxt-keyword-budget',
                                wizardState.els.budgetInput?.value || '',
                                '请输入预算'
                            );
                        }
                        if (bidConstraintFieldKey && /^(出价目标|优化目标)$/.test(renderFieldToken)) {
                            const fieldLabelText = normalizeSceneRenderFieldLabel(bidConstraintFieldLabel) || bidConstraintFieldLabel || '目标投产比';
                            const fieldValue = normalizeSceneSettingValue(bucket[bidConstraintFieldKey] || '');
                            return buildInlineSceneInputControl(
                                fieldLabelText,
                                bidConstraintFieldKey,
                                fieldValue,
                                `请输入${fieldLabelText}`
                            );
                        }
                        return '';
                    })();
                    const rowControlClass = `am-wxt-setting-control${inlineControlHtml ? ' am-wxt-setting-control-pair' : ''}`;
                    const hasExactOptionMatch = (candidate = '') => {
                        const normalizedCandidate = normalizeSceneOptionText(candidate);
                        if (!normalizedCandidate) return false;
                        return options.some(opt => normalizeSceneOptionText(opt) === normalizedCandidate);
                    };
                    if (
                        options.length >= 2
                        && value
                        && SCENE_STRICT_OPTION_TYPE_SET.has(optionType)
                        && !hasExactOptionMatch(value)
                    ) {
                        value = options[0] || '';
                        bucket[key] = value;
                    }
                    if (options.length < 2 || isApiPathField) {
                        const forceKeepInputField = /^(营销场景|目标投产比|ROI目标值|出价目标值|约束值|投放地域|计划组|发布日期)$/.test(token);
                        const shouldKeepInputField = (
                            isApiPathField
                            || (
                                token
                                && token.length <= 14
                                && !SCENE_SECTION_ONLY_LABEL_RE.test(token)
                                && !/添加商品|选择推广商品/.test(token)
                                && (
                                    normalizeSceneSettingValue(value) !== ''
                                    || fieldMeta?.requiredGuess === true
                                    || fieldMeta?.criticalGuess === true
                                    || forceKeepInputField
                                )
                            )
                        );
                        if (!shouldKeepInputField) return '';
                        const optionHint = isApiPathField && options.length
                            ? `推荐值：${options.slice(0, 6).join(' / ')}`
                            : '';
                        return `
                            <div class="am-wxt-scene-setting-row">
                                <div class="am-wxt-scene-setting-label">${Utils.escapeHtml(displayFieldLabel)}</div>
                                <div class="${rowControlClass}">
                                    <input data-scene-field="${Utils.escapeHtml(key)}" value="${Utils.escapeHtml(value)}" placeholder="${isApiPathField ? '可填 JSON / 数字 / 布尔 / 文本' : `请输入${Utils.escapeHtml(normalizedFieldLabel)}`}" />
                                    ${inlineControlHtml}
                                    ${optionHint ? `<div style="margin-top:4px;font-size:12px;color:#6b7280;">${Utils.escapeHtml(optionHint)}</div>` : ''}
                                </div>
                            </div>
                        `;
                    }
                    const includeCurrentValue = !!(
                        value
                        && (isApiPathField || isLikelySceneOptionValue(value))
                        && (
                            !SCENE_STRICT_OPTION_TYPE_SET.has(optionType)
                            || hasExactOptionMatch(value)
                        )
                    );
                    const optionList = (() => {
                        const baseList = uniqueBy(
                            (Array.isArray(options) ? options : [])
                                .map(item => normalizeSceneSettingValue(item))
                                .filter(Boolean),
                            item => item
                        );
                        if (includeCurrentValue && value && !baseList.some(opt => isSceneOptionMatch(opt, value))) {
                            baseList.push(value);
                        }
                        return baseList.slice(0, 18);
                    })();
                    const optionHtml = optionList.map(opt => `
                        <button
                            type="button"
                            class="am-wxt-option-chip ${opt === value ? 'active' : ''}"
                            data-scene-option="1"
                            data-scene-option-field="${Utils.escapeHtml(key)}"
                            data-scene-option-value="${Utils.escapeHtml(opt)}"
                        >${Utils.escapeHtml(opt)}</button>
                    `).join('');
                    return `
                        <div class="am-wxt-scene-setting-row">
                            <div class="am-wxt-scene-setting-label">${Utils.escapeHtml(displayFieldLabel)}</div>
                            <div class="${rowControlClass}">
                                <div class="am-wxt-option-line segmented">${optionHtml}</div>
                                <input class="am-wxt-hidden-control" data-scene-field="${Utils.escapeHtml(key)}" value="${Utils.escapeHtml(value)}" />
                                ${inlineControlHtml}
                            </div>
                        </div>
                    `;
                }).filter(Boolean);
                const gridHtml = gridRows.join('');

                wizardState.els.sceneDynamic.innerHTML = `
                    <div class="title">
                        <span>场景配置：${Utils.escapeHtml(sceneName)}</span>
                        <span class="meta">${profile.source === 'scan' ? '动态读取' : '基础模板'} · 已设置 ${filledCount} 项</span>
                    </div>
                    <div class="am-wxt-scene-grid">
                        ${staticGridHtml}
                        ${gridRows.length ? gridHtml : '<div class="am-wxt-scene-empty">当前场景暂无额外动态配置项</div>'}
                    </div>
                `;

                const proxySelectButtons = wizardState.els.sceneDynamic.querySelectorAll('[data-proxy-select-target]');
                proxySelectButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const targetId = String(button.getAttribute('data-proxy-select-target') || '').trim();
                        const nextValue = String(button.getAttribute('data-proxy-select-value') || '').trim();
                        const target = targetId ? wizardState.els.overlay.querySelector(`#${targetId}`) : null;
                        if (!(target instanceof HTMLSelectElement) || target.disabled) return;
                        if (target.value !== nextValue) {
                            target.value = nextValue;
                            target.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                        target.dispatchEvent(new Event('change', { bubbles: true }));
                        if (targetId !== 'am-wxt-keyword-scene-select') {
                            renderSceneDynamicConfig();
                        }
                    });
                });

                const proxyChecks = wizardState.els.sceneDynamic.querySelectorAll('[data-proxy-check-target]');
                proxyChecks.forEach(checkbox => {
                    checkbox.addEventListener('change', () => {
                        const targetId = String(checkbox.getAttribute('data-proxy-check-target') || '').trim();
                        const target = targetId ? wizardState.els.overlay.querySelector(`#${targetId}`) : null;
                        if (!(target instanceof HTMLInputElement) || target.disabled) return;
                        target.checked = !!checkbox.checked;
                        target.dispatchEvent(new Event('input', { bubbles: true }));
                        target.dispatchEvent(new Event('change', { bubbles: true }));
                        renderSceneDynamicConfig();
                    });
                });

                const proxyInputs = wizardState.els.sceneDynamic.querySelectorAll('[data-proxy-input-target]');
                proxyInputs.forEach(proxy => {
                    const syncProxyValue = () => {
                        const targetId = String(proxy.getAttribute('data-proxy-input-target') || '').trim();
                        const target = targetId ? wizardState.els.overlay.querySelector(`#${targetId}`) : null;
                        if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
                        const nextValue = String(proxy.value || '');
                        if (target.value !== nextValue) target.value = nextValue;
                        target.dispatchEvent(new Event('input', { bubbles: true }));
                        target.dispatchEvent(new Event('change', { bubbles: true }));
                    };
                    proxy.addEventListener('input', syncProxyValue);
                    proxy.addEventListener('change', syncProxyValue);
                });

                const sceneToggleButtons = wizardState.els.sceneDynamic.querySelectorAll('[data-scene-toggle-target]');
                sceneToggleButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const fieldKey = String(button.getAttribute('data-scene-toggle-target') || '').trim();
                        const nextValue = String(button.getAttribute('data-scene-toggle-value') || '').trim();
                        if (!fieldKey) return;
                        const targetControl = Array.from(wizardState.els.sceneDynamic.querySelectorAll('[data-scene-field]')).find(control => (
                            String(control.getAttribute('data-scene-field') || '').trim() === fieldKey
                        ));
                        if (!(targetControl instanceof HTMLInputElement || targetControl instanceof HTMLTextAreaElement)) return;
                        targetControl.value = nextValue;
                        targetControl.dispatchEvent(new Event('input', { bubbles: true }));
                        targetControl.dispatchEvent(new Event('change', { bubbles: true }));
                        const toggleGroup = button.closest('[data-scene-toggle-group]');
                        if (toggleGroup) {
                            toggleGroup.querySelectorAll('[data-scene-toggle-target]').forEach(chip => {
                                chip.classList.toggle('active', chip === button);
                            });
                        }
                    });
                });

                const syncSceneSwitchVisual = (switchButton, enabled) => {
                    if (!(switchButton instanceof HTMLButtonElement)) return;
                    const onLabel = normalizeSceneSettingValue(switchButton.getAttribute('data-scene-switch-on-label') || '开') || '开';
                    const offLabel = normalizeSceneSettingValue(switchButton.getAttribute('data-scene-switch-off-label') || '关') || '关';
                    const isOn = !!enabled;
                    switchButton.classList.toggle('is-on', isOn);
                    switchButton.classList.toggle('is-off', !isOn);
                    switchButton.setAttribute('aria-pressed', isOn ? 'true' : 'false');
                    const stateEl = switchButton.querySelector('.am-wxt-site-switch-state');
                    if (stateEl) stateEl.textContent = isOn ? onLabel : offLabel;
                };

                const sceneSwitchButtons = wizardState.els.sceneDynamic.querySelectorAll('[data-scene-switch-target]');
                sceneSwitchButtons.forEach(button => {
                    if (!(button instanceof HTMLButtonElement)) return;
                    button.addEventListener('click', () => {
                        const fieldKey = String(button.getAttribute('data-scene-switch-target') || '').trim();
                        const onValue = normalizeSceneSettingValue(button.getAttribute('data-scene-switch-on') || '开') || '开';
                        const offValue = normalizeSceneSettingValue(button.getAttribute('data-scene-switch-off') || '关') || '关';
                        if (!fieldKey) return;
                        const targetControl = Array.from(wizardState.els.sceneDynamic.querySelectorAll('[data-scene-field]')).find(control => (
                            String(control.getAttribute('data-scene-field') || '').trim() === fieldKey
                        ));
                        if (!(targetControl instanceof HTMLInputElement || targetControl instanceof HTMLTextAreaElement)) return;
                        const currentValue = normalizeSceneSettingValue(targetControl.value);
                        const nextValue = isSceneOptionMatch(currentValue, onValue) ? offValue : onValue;
                        targetControl.value = nextValue;
                        targetControl.dispatchEvent(new Event('input', { bubbles: true }));
                        targetControl.dispatchEvent(new Event('change', { bubbles: true }));
                        const isOn = isSceneOptionMatch(nextValue, onValue);
                        wizardState.els.sceneDynamic.querySelectorAll('[data-scene-switch-target]').forEach(peer => {
                            if (!(peer instanceof HTMLButtonElement)) return;
                            if (String(peer.getAttribute('data-scene-switch-target') || '').trim() !== fieldKey) return;
                            syncSceneSwitchVisual(peer, isOn);
                        });
                    });
                });

                const sceneOptionButtons = wizardState.els.sceneDynamic.querySelectorAll('[data-scene-option]');
                sceneOptionButtons.forEach(button => {
                    button.addEventListener('click', (event) => {
                        event.preventDefault();
                        const row = button.closest('.am-wxt-scene-setting-row');
                        const fieldKeyFromButton = String(button.getAttribute('data-scene-option-field') || '').trim();
                        const escapeSelectorAttrValue = (value = '') => String(value || '')
                            .replace(/\\/g, '\\\\')
                            .replace(/"/g, '\\"');
                        let hiddenControl = row?.querySelector('input.am-wxt-hidden-control[data-scene-field]')
                            || row?.querySelector('input[data-scene-field], textarea[data-scene-field]');
                        if (!(hiddenControl instanceof HTMLInputElement || hiddenControl instanceof HTMLTextAreaElement) && fieldKeyFromButton) {
                            const escapedFieldKey = escapeSelectorAttrValue(fieldKeyFromButton);
                            hiddenControl = wizardState.els.sceneDynamic?.querySelector(`input[data-scene-field="${escapedFieldKey}"]`)
                                || wizardState.els.sceneDynamic?.querySelector(`textarea[data-scene-field="${escapedFieldKey}"]`);
                        }
                        if (!(hiddenControl instanceof HTMLInputElement || hiddenControl instanceof HTMLTextAreaElement)) return;
                        const fieldKey = String(hiddenControl.getAttribute('data-scene-field') || fieldKeyFromButton || '').trim();
                        if (!fieldKey) return;
                        const nextValue = String(button.getAttribute('data-scene-option-value') || '').trim();
                        hiddenControl.value = nextValue;
                        row.querySelectorAll('[data-scene-option]').forEach(chip => {
                            chip.classList.toggle('active', chip === button);
                        });
                        hiddenControl.dispatchEvent(new Event('input', { bubbles: true }));
                        hiddenControl.dispatchEvent(new Event('change', { bubbles: true }));
                        const crowdCustomBidTypeFieldKey = normalizeSceneFieldKey('出价方式');
                        const crowdCustomBidTargetFieldKey = normalizeSceneFieldKey('出价目标');
                        const keywordCustomRoiFieldKey = normalizeSceneFieldKey('设置7日投产比');
                        const activeSceneName = String(wizardState.els.sceneSelect?.value || wizardState.draft?.sceneName || '').trim();
                        const activeSceneBucket = ensureSceneSettingBucket(activeSceneName);
                        const activeCrowdGoal = normalizeGoalCandidateLabel(
                            activeSceneBucket[normalizeSceneFieldKey('营销目标')]
                            || activeSceneBucket[normalizeSceneFieldKey('选择拉新方案')]
                            || activeSceneBucket[normalizeSceneFieldKey('投放策略')]
                            || activeSceneBucket[normalizeSceneFieldKey('选择方式')]
                            || ''
                        );
                        const activeKeywordGoal = detectKeywordGoalFromText(
                            activeSceneBucket[normalizeSceneFieldKey('营销目标')]
                            || activeSceneBucket[normalizeSceneFieldKey('选择卡位方案')]
                            || ''
                        );
                        const shouldRerenderCrowdCustomBid = (
                            activeSceneName === '人群推广'
                            && activeCrowdGoal === '自定义推广'
                            && (isSceneLabelMatch(fieldKey, crowdCustomBidTypeFieldKey) || isSceneLabelMatch(fieldKey, crowdCustomBidTargetFieldKey))
                        );
                        const shouldRerenderKeywordCustomRoi = (
                            activeSceneName === '关键词推广'
                            && activeKeywordGoal === '自定义推广'
                            && isSceneLabelMatch(fieldKey, keywordCustomRoiFieldKey)
                        );
                        if (shouldRerenderCrowdCustomBid || shouldRerenderKeywordCustomRoi) {
                            renderSceneDynamicConfig();
                        }
                    });
                });

                const sceneCrowdPriorityToggles = wizardState.els.sceneDynamic.querySelectorAll('[data-scene-crowd-priority-toggle]');
                sceneCrowdPriorityToggles.forEach(toggle => {
                    if (!(toggle instanceof HTMLInputElement)) return;
                    toggle.addEventListener('change', () => {
                        const row = toggle.closest('.am-wxt-scene-setting-row');
                        const fieldKey = String(toggle.getAttribute('data-scene-crowd-priority-field') || '').trim();
                        const onValue = normalizeSceneSettingValue(toggle.getAttribute('data-scene-crowd-priority-on') || '设置优先投放客户')
                            || '设置优先投放客户';
                        const offValue = normalizeSceneSettingValue(toggle.getAttribute('data-scene-crowd-priority-off') || '关闭')
                            || '关闭';
                        let hiddenControl = row?.querySelector('input.am-wxt-hidden-control[data-scene-field]')
                            || row?.querySelector('input[data-scene-field], textarea[data-scene-field]');
                        if (!(hiddenControl instanceof HTMLInputElement || hiddenControl instanceof HTMLTextAreaElement) && fieldKey) {
                            const escapedFieldKey = fieldKey
                                .replace(/\\/g, '\\\\')
                                .replace(/"/g, '\\"');
                            hiddenControl = wizardState.els.sceneDynamic?.querySelector(`input[data-scene-field="${escapedFieldKey}"]`)
                                || wizardState.els.sceneDynamic?.querySelector(`textarea[data-scene-field="${escapedFieldKey}"]`);
                        }
                        if (!(hiddenControl instanceof HTMLInputElement || hiddenControl instanceof HTMLTextAreaElement)) return;
                        hiddenControl.value = toggle.checked ? onValue : offValue;
                        hiddenControl.dispatchEvent(new Event('input', { bubbles: true }));
                        hiddenControl.dispatchEvent(new Event('change', { bubbles: true }));
                    });
                });

                const keywordSmartCrowdPanels = wizardState.els.sceneDynamic.querySelectorAll('[data-keyword-smart-crowd-panel="1"]');
                keywordSmartCrowdPanels.forEach(panel => {
                    if (!(panel instanceof HTMLElement)) return;
                    const masterToggle = panel.querySelector('[data-keyword-smart-crowd-master="1"]');
                    const targetControl = panel.querySelector('[data-keyword-smart-crowd-target="1"]');
                    const clientControl = panel.querySelector('[data-keyword-smart-crowd-client="1"]');
                    const valueControl = panel.querySelector('[data-keyword-smart-crowd-value="1"]');
                    const campaignControl = panel.querySelector('[data-keyword-smart-crowd-campaign="1"]');
                    if (!(masterToggle instanceof HTMLInputElement) || !(campaignControl instanceof HTMLTextAreaElement)) return;
                    const rowList = Array.from(panel.querySelectorAll('[data-keyword-smart-crowd-row]'))
                        .filter(row => row instanceof HTMLElement);
                    if (!rowList.length) return;
                    const readCrowdRowPayload = (row) => {
                        const key = String(row.getAttribute('data-keyword-smart-crowd-row') || '').trim();
                        const check = row.querySelector(`[data-keyword-smart-crowd-enabled="${key}"]`);
                        const select = row.querySelector(`[data-keyword-smart-crowd-label="${key}"]`);
                        const discountInput = row.querySelector(`[data-keyword-smart-crowd-discount="${key}"]`);
                        if (!(check instanceof HTMLInputElement) || !(select instanceof HTMLSelectElement) || !(discountInput instanceof HTMLInputElement)) {
                            return null;
                        }
                        const discountNum = toNumber(discountInput.value, NaN);
                        const normalizedDiscount = Number.isFinite(discountNum)
                            ? Math.min(99.9, Math.max(0.1, Math.round(discountNum * 10) / 10))
                            : 1;
                        discountInput.value = toShortSceneValue(String(normalizedDiscount)) || String(normalizedDiscount);
                        return {
                            value: key || '',
                            name: normalizeSceneSettingValue(row.textContent || '').split(/\s+/)[0] || '',
                            enabled: check.checked,
                            selectedLabelId: normalizeSceneSettingValue(select.getAttribute('data-keyword-smart-crowd-label-id') || ''),
                            selectedLabelName: normalizeSceneSettingValue(select.value || ''),
                            discount: normalizedDiscount
                        };
                    };
                    const syncPanel = () => {
                        const masterEnabled = masterToggle.checked;
                        const rowPayload = rowList
                            .map(readCrowdRowPayload)
                            .filter(item => item && item.value);
                        rowList.forEach(row => {
                            const key = String(row.getAttribute('data-keyword-smart-crowd-row') || '').trim();
                            const check = row.querySelector(`[data-keyword-smart-crowd-enabled="${key}"]`);
                            const select = row.querySelector(`[data-keyword-smart-crowd-label="${key}"]`);
                            const discountInput = row.querySelector(`[data-keyword-smart-crowd-discount="${key}"]`);
                            if (check instanceof HTMLInputElement) check.disabled = !masterEnabled;
                            if (select instanceof HTMLSelectElement) select.disabled = !masterEnabled;
                            if (discountInput instanceof HTMLInputElement) discountInput.disabled = !masterEnabled;
                        });
                        const statusValue = masterEnabled ? '人群优化目标' : '关闭';
                        const nextCampaignList = masterEnabled
                            ? rowPayload
                                .filter(item => item.enabled)
                                .map(item => ({
                                    value: item.value,
                                    selectedLabelId: item.selectedLabelId || '',
                                    selectedLabelName: item.selectedLabelName || '',
                                    discount: item.discount
                                }))
                            : [];
                        campaignControl.value = JSON.stringify(nextCampaignList);
                        [targetControl, clientControl, valueControl]
                            .filter(control => control instanceof HTMLInputElement)
                            .forEach((control) => {
                                control.value = statusValue;
                                control.dispatchEvent(new Event('input', { bubbles: true }));
                                control.dispatchEvent(new Event('change', { bubbles: true }));
                            });
                        campaignControl.dispatchEvent(new Event('input', { bubbles: true }));
                        campaignControl.dispatchEvent(new Event('change', { bubbles: true }));
                    };
                    masterToggle.addEventListener('change', syncPanel);
                    rowList.forEach(row => {
                        const key = String(row.getAttribute('data-keyword-smart-crowd-row') || '').trim();
                        const check = row.querySelector(`[data-keyword-smart-crowd-enabled="${key}"]`);
                        const select = row.querySelector(`[data-keyword-smart-crowd-label="${key}"]`);
                        const discountInput = row.querySelector(`[data-keyword-smart-crowd-discount="${key}"]`);
                        if (check instanceof HTMLInputElement) check.addEventListener('change', syncPanel);
                        if (select instanceof HTMLSelectElement) select.addEventListener('change', syncPanel);
                        if (discountInput instanceof HTMLInputElement) discountInput.addEventListener('input', syncPanel);
                        if (discountInput instanceof HTMLInputElement) discountInput.addEventListener('change', syncPanel);
                    });
                    syncPanel();
                });

                const updateScenePopupSummary = (row, trigger, text) => {
                    const summaryEl = row?.querySelector?.(`[data-scene-popup-summary="${trigger}"]`);
                    if (summaryEl instanceof HTMLElement) {
                        summaryEl.textContent = String(text || '').trim() || '未配置';
                    }
                };
                const dispatchSceneControlUpdate = (control, nextValue = '') => {
                    if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) return;
                    control.value = String(nextValue || '');
                    control.dispatchEvent(new Event('input', { bubbles: true }));
                    control.dispatchEvent(new Event('change', { bubbles: true }));
                };
                const openScenePopupDialog = ({
                    title = '',
                    bodyHtml = '',
                    onMounted = null,
                    onSave = null,
                    dialogClassName = '',
                    closeLabel = '关闭',
                    cancelLabel = '取消',
                    saveLabel = '保存',
                    hideCloseButton = false,
                    saveFirst = false,
                    defaultFocus = ''
                } = {}) => (
                    new Promise((resolve) => {
                        const previousMask = document.getElementById('am-wxt-scene-popup-mask');
                        if (previousMask) previousMask.remove();
                        const mask = document.createElement('div');
                        mask.id = 'am-wxt-scene-popup-mask';
                        mask.className = 'am-wxt-scene-popup-mask';
                        const dialogClass = `am-wxt-scene-popup-dialog${String(dialogClassName || '').trim() ? ` ${String(dialogClassName || '').trim()}` : ''}`;
                        const closeBtnHtml = hideCloseButton
                            ? ''
                            : `<button type="button" class="am-wxt-btn" data-scene-popup-close="1">${Utils.escapeHtml(closeLabel || '关闭')}</button>`;
                        const cancelBtnHtml = `<button type="button" class="am-wxt-btn" data-scene-popup-cancel="1">${Utils.escapeHtml(cancelLabel || '取消')}</button>`;
                        const saveBtnHtml = `<button type="button" class="am-wxt-btn primary" data-scene-popup-save="1">${Utils.escapeHtml(saveLabel || '保存')}</button>`;
                        const footButtonsHtml = saveFirst ? `${saveBtnHtml}${cancelBtnHtml}` : `${cancelBtnHtml}${saveBtnHtml}`;
                        mask.innerHTML = `
                            <div class="${Utils.escapeHtml(dialogClass)}" role="dialog" aria-modal="true">
                                <div class="am-wxt-scene-popup-head">
                                    <span>${Utils.escapeHtml(title || '配置设置')}</span>
                                    ${closeBtnHtml}
                                </div>
                                <div class="am-wxt-scene-popup-body">${bodyHtml || ''}</div>
                                <div class="am-wxt-scene-popup-foot">
                                    ${footButtonsHtml}
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
                            if (typeof mask._amWxtCleanup === 'function') {
                                try {
                                    mask._amWxtCleanup();
                                } catch { }
                            }
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
                        if (defaultFocus) {
                            const focusTarget = (() => {
                                if (defaultFocus === 'save') return saveBtn;
                                if (defaultFocus === 'cancel') return cancelBtn;
                                if (defaultFocus === 'close') return closeBtn;
                                return null;
                            })();
                            if (focusTarget instanceof HTMLElement) {
                                requestAnimationFrame(() => {
                                    try {
                                        focusTarget.focus({ preventScroll: true });
                                    } catch {
                                        focusTarget.focus();
                                    }
                                });
                            }
                        }
                        if (typeof onMounted === 'function') {
                            try {
                                onMounted(mask);
                            } catch (err) {
                                appendWizardLog(`初始化配置弹窗失败：${err?.message || err}`, 'error');
                            }
                        }
                    })
                );
                const resolveScenePopupControl = (fieldKey = '', popupTrigger = '') => {
                    if (!wizardState.els.sceneDynamic) return null;
                    const normalizedFieldKey = String(fieldKey || '').trim();
                    if (!normalizedFieldKey) return null;
                    const triggerSelector = String(popupTrigger || '').trim()
                        ? `[data-scene-popup-field="${String(popupTrigger || '').trim()}"]`
                        : '';
                    return wizardState.els.sceneDynamic.querySelector(
                        `input[data-scene-field="${normalizedFieldKey}"]${triggerSelector}`
                    );
                };
                const resolveScenePopupRowByTrigger = (popupTrigger = '') => {
                    if (!wizardState.els.sceneDynamic) return null;
                    const triggerButton = wizardState.els.sceneDynamic.querySelector(
                        `[data-scene-popup-trigger="${String(popupTrigger || '').trim()}"]`
                    );
                    return triggerButton instanceof HTMLElement
                        ? triggerButton.closest('.am-wxt-scene-setting-row')
                        : null;
                };
                function normalizeAdzoneListForAdvanced(rawValue = '') {
                    const parsed = parseScenePopupJsonArray(rawValue, []);
                    return parsed
                        .map((item, idx) => {
                            if (isPlainObject(item)) return deepClone(item);
                            const token = normalizeSceneSettingValue(item);
                            if (!token) return null;
                            return {
                                adzoneCode: token,
                                adzoneName: token || `资源位${idx + 1}`,
                                status: '1'
                            };
                        })
                        .filter(item => isPlainObject(item));
                }
                const getAdzoneDisplayName = (item = {}, idx = 0) => (
                    normalizeSceneSettingValue(
                        item.adzoneName
                        || item.name
                        || item.title
                        || item.adzoneCode
                        || item.code
                        || item.resourceCode
                        || item.resourceName
                        || item.tagName
                    ) || `资源位${idx + 1}`
                );
                const getAdzoneDisplayDesc = (item = {}) => normalizeSceneSettingValue(
                    item.description
                    || item.desc
                    || item.subTitle
                    || item.sceneDesc
                    || item.resourceTypeDesc
                    || item.resourceDesc
                    || ''
                );
                const parseLaunchAreaList = (rawValue = '') => {
                    const list = uniqueBy(
                        parseScenePopupJsonArray(rawValue, ['all'])
                            .map(item => String(item || '').trim())
                            .filter(Boolean),
                        item => item
                    );
                    return list.length ? list : ['all'];
                };
                const normalizeNativeAdzoneCode = (item = {}, idx = 0) => {
                    const token = normalizeSceneSettingValue(
                        item.adzoneCode
                        || item.adzoneId
                        || item.code
                        || item.id
                        || item.resourceCode
                        || item.properties?.adzoneId
                        || ''
                    );
                    if (token) return token;
                    const fallbackName = normalizeSceneSettingValue(
                        item.adzoneName
                        || item.name
                        || item.properties?.adzoneName
                        || ''
                    );
                    if (fallbackName) return fallbackName;
                    return `native_adzone_${idx + 1}`;
                };
                const normalizeNativeAdzoneName = (item = {}, idx = 0) => (
                    normalizeSceneSettingValue(
                        item.adzoneName
                        || item.name
                        || item.title
                        || item.properties?.adzoneName
                        || ''
                    ) || `资源位${idx + 1}`
                );
                const isAdzoneListPlaceholderForSync = (list = []) => {
                    const normalized = Array.isArray(list) ? list : [];
                    if (!normalized.length) return true;
                    return normalized.every((item, idx) => {
                        const code = normalizeSceneSettingValue(
                            item?.adzoneCode
                            || item?.adzoneId
                            || item?.code
                            || item?.id
                            || ''
                        );
                        const name = normalizeNativeAdzoneName(item, idx);
                        if (/^(DEFAULT_SEARCH|A_TEST_SLOT|B_TEST_SLOT|TEST_|native_adzone_)/i.test(code)) return true;
                        if (/^(DEFAULT_SEARCH|A_TEST_SLOT|B_TEST_SLOT|TEST_|native_adzone_)/i.test(name)) return true;
                        if (/^资源位\d+$/.test(name)) return true;
                        return false;
                    });
                };
                const extractNativeAdvancedDefaultsSnapshot = (stateData = {}) => {
                    if (!isPlainObject(stateData)) return null;
                    const selected = isPlainObject(stateData.selected) ? stateData.selected : {};
                    const selectedAdzoneList = Array.isArray(selected.adzoneList)
                        ? selected.adzoneList.filter(item => isPlainObject(item))
                        : [];
                    const allAdzoneListRaw = Array.isArray(stateData.adzoneList)
                        ? stateData.adzoneList
                        : selectedAdzoneList;
                    const selectedCodeSet = new Set(
                        selectedAdzoneList
                            .map((item, idx) => normalizeNativeAdzoneCode(item, idx))
                            .filter(Boolean)
                    );
                    const adzoneList = allAdzoneListRaw
                        .filter(item => isPlainObject(item))
                        .map((item, idx) => {
                            const source = deepClone(item);
                            const adzoneCode = normalizeNativeAdzoneCode(item, idx);
                            const adzoneName = normalizeNativeAdzoneName(item, idx);
                            const isEnabledBySelection = selectedCodeSet.size
                                ? selectedCodeSet.has(adzoneCode)
                                : true;
                            const normalized = {
                                ...source,
                                adzoneCode,
                                adzoneId: normalizeSceneSettingValue(source.adzoneId || source.id || source.properties?.adzoneId || adzoneCode),
                                adzoneName,
                                resourceName: normalizeSceneSettingValue(
                                    source.resourceName
                                    || source.description
                                    || source.desc
                                    || source.subTitle
                                    || source.properties?.desc
                                    || ''
                                ),
                                status: isEnabledBySelection ? '1' : '0'
                            };
                            if (!hasOwn(normalized, 'fitDiscount') && source.fitDiscount !== undefined) {
                                normalized.fitDiscount = source.fitDiscount;
                            }
                            if (!hasOwn(normalized, 'suggestDiscount') && source.suggestDiscount !== undefined) {
                                normalized.suggestDiscount = source.suggestDiscount;
                            }
                            if (!hasOwn(normalized, 'parentAdoneId') && source.parentAdoneId !== undefined) {
                                normalized.parentAdoneId = source.parentAdoneId;
                            }
                            return normalized;
                        });
                    const launchAreaList = uniqueBy(
                        (Array.isArray(selected.launchAreaStrList) ? selected.launchAreaStrList : ['all'])
                            .map(item => String(item || '').trim())
                            .filter(Boolean),
                        item => item
                    );
                    const launchPeriodList = Array.isArray(selected.launchPeriodList)
                        ? selected.launchPeriodList.filter(item => isPlainObject(item))
                        : [];
                    if (!adzoneList.length && !launchAreaList.length && !launchPeriodList.length) return null;
                    return {
                        adzoneList,
                        launchAreaList: launchAreaList.length ? launchAreaList : ['all'],
                        launchPeriodList: launchPeriodList.length ? launchPeriodList : buildDefaultLaunchPeriodList()
                    };
                };
                const scoreNativeAdvancedDefaultsSnapshot = (snapshot = {}) => {
                    if (!isPlainObject(snapshot)) return -1;
                    const adzoneList = Array.isArray(snapshot.adzoneList) ? snapshot.adzoneList : [];
                    const launchAreaList = Array.isArray(snapshot.launchAreaList) ? snapshot.launchAreaList : [];
                    const launchPeriodList = Array.isArray(snapshot.launchPeriodList) ? snapshot.launchPeriodList : [];
                    let score = 0;
                    score += Math.min(60, adzoneList.length * 12);
                    if (adzoneList.some((item, idx) => !/^资源位\d+$/.test(normalizeNativeAdzoneName(item, idx)))) {
                        score += 20;
                    }
                    if (launchAreaList.length) score += Math.min(10, launchAreaList.length);
                    if (launchPeriodList.length) score += 8;
                    if (launchPeriodList.some(item => Array.isArray(item?.timeSpanList) && item.timeSpanList.length)) {
                        score += 4;
                    }
                    return score;
                };
                const isNativeAdvancedSnapshotRich = (snapshot = {}) => {
                    if (!isPlainObject(snapshot)) return false;
                    const adzoneList = Array.isArray(snapshot.adzoneList) ? snapshot.adzoneList : [];
                    if (!adzoneList.length) return false;
                    return adzoneList.some((item, idx) => {
                        const code = normalizeSceneSettingValue(
                            item?.adzoneCode
                            || item?.adzoneId
                            || item?.code
                            || item?.id
                            || ''
                        );
                        const name = normalizeNativeAdzoneName(item, idx);
                        if (!name || /^资源位\d+$/.test(name)) return false;
                        if (/^(DEFAULT_SEARCH|A_TEST_SLOT|B_TEST_SLOT|TEST_|native_adzone_)/i.test(code)) return false;
                        if (/^(DEFAULT_SEARCH|A_TEST_SLOT|B_TEST_SLOT|TEST_|native_adzone_)/i.test(name)) return false;
                        return true;
                    });
                };
                const resolveNativeAdvancedDefaultsFromDialog = () => {
                    const stateHosts = Array.from(document.querySelectorAll('[id^="content_cnt_dlg_"][id$="_adzoneList"], [id^="cnt_dlg_"]'));
                    let bestSnapshot = null;
                    let bestScore = -1;
                    for (const host of stateHosts) {
                        const stateData = host?.vframe?.$v?.updater?.$d;
                        const snapshot = extractNativeAdvancedDefaultsSnapshot(stateData);
                        if (!snapshot) continue;
                        const score = scoreNativeAdvancedDefaultsSnapshot(snapshot);
                        if (score > bestScore) {
                            bestSnapshot = snapshot;
                            bestScore = score;
                        }
                    }
                    return bestSnapshot;
                };
                const sampleBestNativeAdvancedDefaultsSnapshot = async (seedSnapshot = null, options = {}) => {
                    let bestSnapshot = isPlainObject(seedSnapshot) ? seedSnapshot : null;
                    let bestScore = scoreNativeAdvancedDefaultsSnapshot(bestSnapshot);
                    const durationMs = Math.max(0, toNumber(options.durationMs, 0));
                    const intervalMs = Math.max(40, toNumber(options.intervalMs, 80));
                    const deadline = Date.now() + durationMs;
                    const capture = () => {
                        const snapshot = resolveNativeAdvancedDefaultsFromDialog();
                        const score = scoreNativeAdvancedDefaultsSnapshot(snapshot);
                        if (score > bestScore) {
                            bestSnapshot = snapshot;
                            bestScore = score;
                        }
                    };
                    capture();
                    while (Date.now() < deadline) {
                        await sleep(intervalMs);
                        capture();
                    }
                    return bestSnapshot;
                };
                const resolveNativeAdvancedDialogRoot = () => (
                    document.querySelector('[data-daynamic-view="onebp/views/pages/main/campaign/advance-dlg"]')
                );
                const resolveNativeAdvancedDialogCloseButton = () => {
                    const root = resolveNativeAdvancedDialogRoot();
                    if (!(root instanceof HTMLElement)) return null;
                    return root.querySelector('[data-spm-click*="dialog_close"] button')
                        || root.querySelector('[mx-click*="magix-portsbN"]')
                        || root.querySelector('[data-spm-click*="dialog_close"]');
                };
                const findNativeAdvancedEntryButton = () => {
                    const root = pickPlanConfigRoot();
                    const searchScopes = [root, document];
                    const visited = new Set();
                    for (const scope of searchScopes) {
                        if (!scope || visited.has(scope) || typeof scope.querySelectorAll !== 'function') continue;
                        visited.add(scope);
                        const candidates = Array.from(scope.querySelectorAll('button,a,[role="button"]'));
                        const target = candidates.find(item => {
                            if (!(item instanceof HTMLElement)) return false;
                            const style = window.getComputedStyle(item);
                            if (style.display === 'none' || style.visibility === 'hidden') return false;
                            const text = normalizeText(item.textContent || '').replace(/\s+/g, '');
                            if (!text) return false;
                            return /投放资源位\/投放地域\/(投放时间|分时折扣)/.test(text)
                                || (
                                    /投放资源位/.test(text)
                                    && /投放地域/.test(text)
                                    && (/(投放时间|分时折扣)/.test(text))
                                );
                        });
                        if (target instanceof HTMLElement) return target;
                    }
                    return null;
                };
                const loadNativeAdvancedDefaultsSnapshot = async () => {
                    let latestSnapshot = resolveNativeAdvancedDefaultsFromDialog();
                    if (isNativeAdvancedSnapshotRich(latestSnapshot)) {
                        latestSnapshot = await sampleBestNativeAdvancedDefaultsSnapshot(latestSnapshot, {
                            durationMs: 420,
                            intervalMs: 70
                        });
                        return latestSnapshot;
                    }
                    const openButton = findNativeAdvancedEntryButton();
                    if (!(openButton instanceof HTMLElement)) return latestSnapshot;
                    try {
                        openButton.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
                    } catch {
                        try {
                            openButton.scrollIntoView({ block: 'center', inline: 'nearest' });
                        } catch { }
                    }
                    let openedByScript = false;
                    if (!(resolveNativeAdvancedDialogRoot() instanceof HTMLElement)) {
                        openedByScript = clickElement(openButton) === true;
                    }
                    await waitUntil(
                        () => {
                            latestSnapshot = resolveNativeAdvancedDefaultsFromDialog();
                            return isNativeAdvancedSnapshotRich(latestSnapshot);
                        },
                        2200,
                        90
                    );
                    if (!latestSnapshot) {
                        latestSnapshot = resolveNativeAdvancedDefaultsFromDialog();
                    }
                    if (!isNativeAdvancedSnapshotRich(latestSnapshot)) {
                        await waitUntil(
                            () => {
                                latestSnapshot = resolveNativeAdvancedDefaultsFromDialog();
                                return !!latestSnapshot;
                            },
                            500,
                            80
                        );
                    }
                    latestSnapshot = await sampleBestNativeAdvancedDefaultsSnapshot(latestSnapshot, {
                        durationMs: isNativeAdvancedSnapshotRich(latestSnapshot) ? 560 : 360,
                        intervalMs: 70
                    });
                    if (openedByScript) {
                        const closeButton = resolveNativeAdvancedDialogCloseButton();
                        if (closeButton instanceof HTMLElement) {
                            clickElement(closeButton);
                            await sleep(80);
                        }
                    }
                    return latestSnapshot;
                };
                const ADVANCED_DAY_COLUMNS = [
                    { key: '1', label: '星期一', shortLabel: '一' },
                    { key: '2', label: '星期二', shortLabel: '二' },
                    { key: '3', label: '星期三', shortLabel: '三' },
                    { key: '4', label: '星期四', shortLabel: '四' },
                    { key: '5', label: '星期五', shortLabel: '五' },
                    { key: '6', label: '星期六', shortLabel: '六' },
                    { key: '7', label: '星期日', shortLabel: '日' }
                ];
                const ADVANCED_TIME_SLOTS = Array.from({ length: 24 }, (_, hour) => {
                    const startHour = String(hour).padStart(2, '0');
                    const endHourRaw = hour + 1;
                    const endHour = endHourRaw >= 24 ? '24' : String(endHourRaw).padStart(2, '0');
                    return {
                        key: `${startHour}:00-${endHour}:00`,
                        label: `${startHour}:00 - ${endHour}:00`,
                        hour,
                        start: hour * 60,
                        end: (hour + 1) * 60
                    };
                });
                const parseTimeRangeToMinutes = (timeText = '') => {
                    const match = String(timeText || '').trim().match(/^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/);
                    if (!match) return null;
                    const start = toNumber(match[1], 0) * 60 + toNumber(match[2], 0);
                    let end = toNumber(match[3], 0) * 60 + toNumber(match[4], 0);
                    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
                    if (end <= start) end += 24 * 60;
                    return { start, end };
                };
                const formatMinutesToClock = (minutes = 0) => {
                    const safeMinutes = toNumber(minutes, 0);
                    const base = ((safeMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
                    if (safeMinutes >= 24 * 60 && base === 0) return '24:00';
                    const hour = Math.floor(base / 60);
                    const minute = base % 60;
                    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                };
                const createEmptyLaunchPeriodGridState = () => {
                    const state = {};
                    ADVANCED_DAY_COLUMNS.forEach(day => {
                        state[day.key] = {};
                        ADVANCED_TIME_SLOTS.forEach(slot => {
                            state[day.key][slot.key] = false;
                        });
                    });
                    return state;
                };
                const buildLaunchPeriodGridState = (rawValue = '') => {
                    const state = createEmptyLaunchPeriodGridState();
                    const list = parseScenePopupJsonArray(rawValue, []);
                    list.forEach(item => {
                        const dayKey = String(item?.dayOfWeek || '').trim();
                        if (!state[dayKey]) return;
                        const spanList = Array.isArray(item?.timeSpanList) ? item.timeSpanList : [];
                        spanList.forEach(span => {
                            const timeText = String(span?.time || '').trim();
                            if (!timeText) return;
                            if (timeText === '00:00-24:00') {
                                ADVANCED_TIME_SLOTS.forEach(slot => {
                                    state[dayKey][slot.key] = true;
                                });
                                return;
                            }
                            const range = parseTimeRangeToMinutes(timeText);
                            if (!range) return;
                            ADVANCED_TIME_SLOTS.forEach(slot => {
                                const slotStart = slot.start;
                                const slotEnd = slot.end <= slot.start ? slot.end + 24 * 60 : slot.end;
                                if (range.start < slotEnd && range.end > slotStart) {
                                    state[dayKey][slot.key] = true;
                                }
                            });
                        });
                    });
                    return state;
                };
                const buildLaunchPeriodListFromGridState = (gridState = {}) => {
                    const output = [];
                    ADVANCED_DAY_COLUMNS.forEach(day => {
                        const dayState = isPlainObject(gridState?.[day.key]) ? gridState[day.key] : {};
                        const enabledSlots = ADVANCED_TIME_SLOTS
                            .filter(slot => !!dayState[slot.key])
                            .map(slot => ({ start: slot.start, end: slot.end }));
                        if (!enabledSlots.length) return;
                        if (enabledSlots.length === ADVANCED_TIME_SLOTS.length) {
                            output.push({
                                dayOfWeek: day.key,
                                timeSpanList: [{ discount: 100, time: '00:00-24:00' }]
                            });
                            return;
                        }
                        const merged = [];
                        enabledSlots.forEach(slot => {
                            const prev = merged[merged.length - 1];
                            if (prev && prev.end === slot.start) {
                                prev.end = slot.end;
                            } else {
                                merged.push({ start: slot.start, end: slot.end });
                            }
                        });
                        output.push({
                            dayOfWeek: day.key,
                            timeSpanList: merged.map(span => ({
                                discount: 100,
                                time: `${formatMinutesToClock(span.start)}-${formatMinutesToClock(span.end)}`
                            }))
                        });
                    });
                    return output;
                };
                const isLaunchPeriodAllDay = (rawValue = '') => {
                    const list = parseScenePopupJsonArray(rawValue, []);
                    if (!list.length) return false;
                    return list.every(item => {
                        const spanList = Array.isArray(item?.timeSpanList) ? item.timeSpanList : [];
                        return spanList.length === 1 && String(spanList[0]?.time || '').trim() === '00:00-24:00';
                    });
                };
