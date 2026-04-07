        const MATRIX_BID_TARGET_OPTIONS = [
            { value: 'conv', label: '获取成交量' },
            { value: 'ad_strategy_buy', label: '增加总成交金额' },
            { value: 'ad_strategy_retained_buy', label: '增加净成交金额' },
            { value: 'similar_item', label: '相似品跟投' },
            { value: 'search_rank', label: '抢占搜索卡位' },
            { value: 'market_penetration', label: '提升市场渗透' },
            { value: 'fav_cart', label: '增加收藏加购量' },
            { value: 'click', label: '增加点击量' },
            { value: 'roi', label: '稳定投产比' }
        ];

        const resolveMatrixBidTargetCostConfig = (bidTarget = '') => {
            const bidTargetCode = normalizeKeywordBidTargetOptionValue(
                mapSceneBidTargetValue(bidTarget) || bidTarget
            );
            if (bidTargetCode === 'roi') {
                return {
                    switchLabel: '设置7日投产比',
                    switchOnValue: '自定义',
                    valueLabels: ['目标投产比', 'ROI目标值', '出价目标值', '约束值']
                };
            }
            if (bidTargetCode === 'conv') {
                return {
                    switchLabel: '设置平均成交成本',
                    switchOnValue: '开启',
                    valueLabels: ['平均成交成本', '平均直接成交成本', '直接成交成本', '单次成交成本', '目标成交成本', '目标成本']
                };
            }
            if (bidTargetCode === 'fav_cart') {
                return {
                    switchLabel: '设置平均收藏加购成本',
                    switchOnValue: '开启',
                    valueLabels: ['平均收藏加购成本', '收藏加购成本', '目标成本']
                };
            }
            if (bidTargetCode === 'click') {
                return {
                    switchLabel: '设置平均点击成本',
                    switchOnValue: '开启',
                    valueLabels: ['平均点击成本', '点击成本', '目标成本']
                };
            }
            return null;
        };

        const parseMatrixBidTargetCostPackageValue = (value = '') => {
            const text = normalizeText(value);
            if (!text) return null;
            const parts = text.split(/[|｜]/g).map(item => normalizeSceneSettingValue(item)).filter(Boolean);
            if (parts.length < 2) return null;
            const targetSeed = String(parts.shift() || '').trim();
            const costSeed = String(parts.join('|') || '').trim();
            if (!targetSeed || !costSeed) return null;
            const targetOptionValue = normalizeKeywordBidTargetOptionValue(
                mapSceneBidTargetValue(targetSeed) || targetSeed
            ) || '';
            const targetCostConfig = targetOptionValue ? resolveMatrixBidTargetCostConfig(targetOptionValue) : null;
            if (!targetOptionValue || !targetCostConfig) return null;
            const amount = parseNumberFromSceneValue(costSeed);
            if (!Number.isFinite(amount) || amount <= 0) return null;
            const targetLabel = MATRIX_BID_TARGET_OPTIONS.find(item => item.value === targetOptionValue)?.label || targetSeed;
            const costValue = formatMatrixBidTargetCostPackageAmount(amount);
            return {
                targetLabel,
                targetOptionValue,
                amount,
                costValue,
                rawValue: `${targetLabel}|${costValue}`,
                displayLabel: `${targetLabel}_${costValue}`
            };
        };

        const getMatrixBidTargetCostPackageOptions = () => (
            MATRIX_BID_TARGET_OPTIONS
                .map(item => ({
                    ...item,
                    costConfig: resolveMatrixBidTargetCostConfig(item.value)
                }))
                .filter(item => item.costConfig)
        );

        const getMatrixBidTargetCostPackageDefaultOption = () => (
            getMatrixBidTargetCostPackageOptions()[0] || { value: 'conv', label: '获取成交量', costConfig: resolveMatrixBidTargetCostConfig('conv') || {} }
        );

        const getMatrixBidTargetCostPackageCostFieldMeta = (targetOptionValue = '') => {
            const normalizedTarget = normalizeKeywordBidTargetOptionValue(targetOptionValue) || getMatrixBidTargetCostPackageDefaultOption().value;
            const targetCostConfig = resolveMatrixBidTargetCostConfig(normalizedTarget);
            const costLabel = Array.isArray(targetCostConfig?.valueLabels) && targetCostConfig.valueLabels.length
                ? targetCostConfig.valueLabels[0]
                : (normalizedTarget === 'roi' ? 'ROI目标值' : '目标成本');
            const costPlaceholder = normalizedTarget === 'roi'
                ? '例如 5'
                : (normalizedTarget === 'click' ? '例如 0.5' : (normalizedTarget === 'fav_cart' ? '例如 5' : '例如 35'));
            return { costLabel, costPlaceholder };
        };

        const formatMatrixBidTargetCostPackageAmount = (amount = NaN) => {
            if (!Number.isFinite(amount) || amount <= 0) return '';
            return String((Math.round(amount * 100) / 100).toFixed(2)).replace(/(?:\.0+|(\.\d+?)0+)$/, '$1');
        };

        const buildMatrixBidTargetCostPackageRows = (values = []) => (
            (() => {
                const groupedRows = [];
                const groupedRowMap = new Map();
                normalizeMatrixDimensionValues(values)
                    .map(item => parseMatrixBidTargetCostPackageValue(item))
                    .filter(Boolean)
                    .forEach((item) => {
                        if (!groupedRowMap.has(item.targetOptionValue)) {
                            const nextRow = {
                                targetOptionValue: item.targetOptionValue,
                                targetLabel: item.targetLabel,
                                costValues: []
                            };
                            groupedRowMap.set(item.targetOptionValue, nextRow);
                            groupedRows.push(nextRow);
                        }
                        groupedRowMap.get(item.targetOptionValue).costValues.push(item.costValue);
                    });
                if (groupedRows.length) {
                    return groupedRows.map((item) => ({
                        ...item,
                        costValues: Array.isArray(item.costValues) && item.costValues.length ? item.costValues : ['']
                    }));
                }
                const defaultOption = getMatrixBidTargetCostPackageDefaultOption();
                return [{
                    targetOptionValue: defaultOption.value,
                    targetLabel: defaultOption.label,
                    costValues: ['']
                }];
            })()
        );

        const buildMatrixBidTargetCostPackageRowValue = (row = {}) => {
            const targetOptionValue = normalizeKeywordBidTargetOptionValue(
                row?.targetOptionValue || row?.target || row?.bidTarget || ''
            );
            const targetLabel = MATRIX_BID_TARGET_OPTIONS.find(item => item.value === targetOptionValue)?.label
                || String(row?.targetLabel || '').trim();
            const targetCostConfig = resolveMatrixBidTargetCostConfig(targetOptionValue);
            const amount = parseNumberFromSceneValue(row?.costValue || row?.amount || row?.cost || '');
            if (!targetOptionValue || !targetLabel || !targetCostConfig) return '';
            if (!Number.isFinite(amount) || amount <= 0) return '';
            return `${targetLabel}|${formatMatrixBidTargetCostPackageAmount(amount)}`;
        };

        const buildMatrixBidTargetCostPackageCostItemHtml = (costValue = '', targetOptionValue = '', costIndex = 0) => {
            const { costLabel, costPlaceholder } = getMatrixBidTargetCostPackageCostFieldMeta(targetOptionValue);
            const displayValue = String(costValue || '').trim();
            const widthChars = Math.max(3, Math.min(10, (displayValue || costPlaceholder || '').length || 3));
            return `
                <div class="am-wxt-matrix-bid-package-cost-item" data-matrix-bid-package-cost-item="1" data-matrix-bid-package-cost-index="${costIndex}">
                    <input
                        type="text"
                        inputmode="decimal"
                        data-matrix-bid-package-cost="1"
                        value="${Utils.escapeHtml(displayValue)}"
                        placeholder="${Utils.escapeHtml(costPlaceholder)}"
                        title="${Utils.escapeHtml(`填写${costLabel}`)}"
                        size="${widthChars}"
                        style="--am-wxt-matrix-bid-package-cost-chars:${widthChars};padding:0 7px;border:0;background:transparent;text-align:center;box-shadow:none;outline:none;-webkit-appearance:none;appearance:none;"
                    />
                    <button
                        type="button"
                        class="am-wxt-matrix-bid-package-cost-remove"
                        data-matrix-bid-package-cost-remove="1"
                        aria-label="删除目标成本"
                        title="删除这个目标成本"
                    >&times;</button>
                </div>
            `;
        };

        const getMatrixBidTargetCostPackageCostInsertAnchor = (costAddBtn = null) => (
            costAddBtn instanceof HTMLElement
                ? (costAddBtn.closest('[data-matrix-bid-package-cost-actions="1"]') || costAddBtn)
                : null
        );

        const insertMatrixBidTargetCostPackageCostItemHtml = (costList = null, costAddBtn = null, html = '') => {
            if (!(costList instanceof HTMLElement) || !String(html || '').trim()) return null;
            const anchor = getMatrixBidTargetCostPackageCostInsertAnchor(costAddBtn);
            if (anchor instanceof HTMLElement && anchor.parentElement === costList) {
                anchor.insertAdjacentHTML('beforebegin', html);
            } else {
                costList.insertAdjacentHTML('beforeend', html);
            }
            return Array.from(costList.querySelectorAll('[data-matrix-bid-package-cost-item="1"]')).slice(-1)[0] || null;
        };

        const insertMatrixBidTargetCostPackageCostItemElement = (costList = null, costAddBtn = null, costItem = null) => {
            if (!(costList instanceof HTMLElement) || !(costItem instanceof HTMLElement)) return null;
            const anchor = getMatrixBidTargetCostPackageCostInsertAnchor(costAddBtn);
            if (anchor instanceof HTMLElement && anchor.parentElement === costList) {
                anchor.insertAdjacentElement('beforebegin', costItem);
            } else {
                costList.appendChild(costItem);
            }
            return costItem;
        };

        const getMatrixBidTargetCostPackageRowMaxCostValue = (packageRow = null) => {
            if (!(packageRow instanceof HTMLElement)) return NaN;
            return Array.from(packageRow.querySelectorAll('[data-matrix-bid-package-cost="1"]'))
                .reduce((maxValue, costInput) => {
                    const amount = parseNumberFromSceneValue(costInput instanceof HTMLInputElement ? costInput.value : '');
                    if (!Number.isFinite(amount)) return maxValue;
                    return !Number.isFinite(maxValue) || amount > maxValue ? amount : maxValue;
                }, NaN);
        };

        const syncMatrixBidTargetCostInputPresentation = (costInput = null) => {
            if (!(costInput instanceof HTMLInputElement)) return;
            const displayValue = String(costInput.value || costInput.placeholder || '').trim();
            const widthChars = Math.max(3, Math.min(10, displayValue.length || 0 || 3));
            costInput.style.setProperty('--am-wxt-matrix-bid-package-cost-chars', String(widthChars));
            costInput.style.padding = '0 7px';
            costInput.style.border = '0';
            costInput.style.background = 'transparent';
            costInput.style.textAlign = 'center';
            costInput.style.boxShadow = 'none';
            costInput.style.outline = 'none';
            costInput.style.webkitAppearance = 'none';
            costInput.style.appearance = 'none';
        };

        const getMatrixBidTargetCostPackageBatchDraft = (packageRow = null) => ({
            interval: packageRow instanceof HTMLElement
                ? String(packageRow.dataset.matrixBidPackageBatchInterval || '').trim()
                : '',
            count: packageRow instanceof HTMLElement
                ? String(packageRow.dataset.matrixBidPackageBatchCount || '').trim()
                : ''
        });

        const setMatrixBidTargetCostPackageBatchDraft = (packageRow = null, options = {}) => {
            if (!(packageRow instanceof HTMLElement)) return { interval: '', count: '' };
            const currentDraft = getMatrixBidTargetCostPackageBatchDraft(packageRow);
            const nextInterval = String(options?.interval ?? currentDraft.interval ?? '').trim();
            const nextCount = String(options?.count ?? currentDraft.count ?? '').trim();
            if (nextInterval) {
                packageRow.dataset.matrixBidPackageBatchInterval = nextInterval;
            } else {
                delete packageRow.dataset.matrixBidPackageBatchInterval;
            }
            if (nextCount) {
                packageRow.dataset.matrixBidPackageBatchCount = nextCount;
            } else {
                delete packageRow.dataset.matrixBidPackageBatchCount;
            }
            return {
                interval: nextInterval,
                count: nextCount
            };
        };

        const getMatrixBidTargetCostPackageBatchIntervalPlaceholder = (baseCost = NaN) => (
            baseCost < 3 ? '0.1'
                : baseCost < 10 ? '0.5'
                    : baseCost < 80 ? '1'
                        : '5'
        );

        const buildMatrixBidTargetCostPackageBatchMenuHtml = (targetOptionValue = '', baseCost = NaN, options = {}) => {
            const { costLabel } = getMatrixBidTargetCostPackageCostFieldMeta(targetOptionValue);
            const hasPendingCost = options?.hasPendingCost === true;
            const batchDraft = {
                interval: String(options?.interval || '').trim(),
                count: String(options?.count || '').trim()
            };
            const canBatch = Number.isFinite(baseCost) && baseCost > 0;
            const batchDraftState = getMatrixBatchDraftInputState(batchDraft.interval, batchDraft.count);
            const canSubmitBatch = canBatch && batchDraftState.canSubmit;
            const baseText = canBatch
                ? `参考当前最高 ${formatMatrixBidTargetCostPackageAmount(baseCost)}`
                : `先填 1 个${costLabel}`;
            const batchSubmitTitle = !canBatch
                ? `先填写一个${costLabel}后再批量新增`
                : (canSubmitBatch
                    ? `按你设置的区间和个数，基于当前最高${formatMatrixBidTargetCostPackageAmount(baseCost)}批量新增${costLabel}`
                    : '先填写有效的区间和个数（个数需为正整数）');
            return `
                <button
                    type="button"
                    class="am-wxt-matrix-bid-package-batch-option"
                    data-matrix-bid-package-batch-manual="1"
                    title="${Utils.escapeHtml(hasPendingCost ? `继续填写当前空白${costLabel}` : `手动新增一个${costLabel}`)}"
                >${Utils.escapeHtml(hasPendingCost ? '继续填写空位' : '新增1个')}</button>
                <div class="am-wxt-matrix-bid-package-batch-note">${Utils.escapeHtml(baseText)}</div>
                <div class="am-wxt-matrix-bid-package-batch-help">间隔填“隔多少”，个数填“生成多少个”</div>
                <div class="am-wxt-matrix-bid-package-batch-form">
                    <input
                        type="text"
                        inputmode="decimal"
                        data-matrix-bid-package-batch-interval="1"
                        value="${Utils.escapeHtml(batchDraft.interval)}"
                        placeholder="${Utils.escapeHtml(getMatrixBidTargetCostPackageBatchIntervalPlaceholder(baseCost))}"
                        aria-label="批量区间值"
                        title="填写批量递增区间值"
                        ${canBatch ? '' : 'disabled'}
                    />
                    <input
                        type="text"
                        inputmode="numeric"
                        data-matrix-bid-package-batch-count="1"
                        value="${Utils.escapeHtml(batchDraft.count)}"
                        placeholder="3"
                        aria-label="批量个数"
                        title="填写批量新增个数"
                        ${canBatch ? '' : 'disabled'}
                    />
                </div>
                <button
                    type="button"
                    class="am-wxt-matrix-bid-package-batch-submit${canSubmitBatch ? '' : ' is-disabled'}"
                    data-matrix-bid-package-batch-add="${canSubmitBatch ? '1' : '0'}"
                    title="${Utils.escapeHtml(batchSubmitTitle)}"
                    ${canSubmitBatch ? '' : 'disabled'}
                >批量新增</button>
            `;
        };

        const appendMatrixBidTargetCostPackageBatchCosts = (packageRow = null, options = {}) => {
            if (!(packageRow instanceof HTMLElement)) return [];
            const targetSelect = packageRow.querySelector('[data-matrix-bid-package-target="1"]');
            const costList = packageRow.querySelector('[data-matrix-bid-package-cost-list="1"]');
            const costAddBtn = costList?.querySelector('[data-matrix-bid-package-cost-add="1"]');
            if (!(costList instanceof HTMLElement)) return [];
            const targetOptionValue = normalizeKeywordBidTargetOptionValue(
                targetSelect instanceof HTMLSelectElement ? targetSelect.value : ''
            ) || getMatrixBidTargetCostPackageDefaultOption().value;
            const insertedInputs = [];
            const appendBlankOrPresetValue = (costValue = '') => {
                const insertedItem = insertMatrixBidTargetCostPackageCostItemHtml(
                    costList,
                    costAddBtn,
                    buildMatrixBidTargetCostPackageCostItemHtml(
                        costValue,
                        targetOptionValue,
                        packageRow.querySelectorAll('[data-matrix-bid-package-cost-item="1"]').length
                    )
                );
                const insertedInput = insertedItem?.querySelector('[data-matrix-bid-package-cost="1"]');
                if (insertedInput instanceof HTMLInputElement) {
                    insertedInputs.push(insertedInput);
                }
                return insertedInput;
            };
            const reusableEmptyInputs = Array.from(packageRow.querySelectorAll('[data-matrix-bid-package-cost="1"]')).filter((costInput) => (
                !buildMatrixBidTargetCostPackageRowValue({
                    targetOptionValue,
                    costValue: costInput instanceof HTMLInputElement ? costInput.value : ''
                })
            ));
            if (String(options?.mode || '').trim() === 'manual') {
                const emptyCostInput = reusableEmptyInputs[0];
                if (emptyCostInput instanceof HTMLInputElement) {
                    insertedInputs.push(emptyCostInput);
                    return insertedInputs;
                }
                appendBlankOrPresetValue('');
                return insertedInputs;
            }
            const baseCost = getMatrixBidTargetCostPackageRowMaxCostValue(packageRow);
            const interval = parseNumberFromSceneValue(options?.interval || '');
            const count = Math.max(1, Math.min(20, Math.round(parseNumberFromSceneValue(options?.count || '')) || 0));
            if (!Number.isFinite(baseCost) || baseCost <= 0) return insertedInputs;
            if (!Number.isFinite(interval) || interval <= 0 || !count) return insertedInputs;
            const existingCostValueSet = new Set(
                Array.from(packageRow.querySelectorAll('[data-matrix-bid-package-cost="1"]'))
                    .map((costInput) => formatMatrixBidTargetCostPackageAmount(
                        parseNumberFromSceneValue(costInput instanceof HTMLInputElement ? costInput.value : '')
                    ))
                    .filter(Boolean)
            );
            for (let step = 1; step <= count; step += 1) {
                const nextCostValue = formatMatrixBidTargetCostPackageAmount(baseCost + interval * step);
                if (!nextCostValue || existingCostValueSet.has(nextCostValue)) continue;
                existingCostValueSet.add(nextCostValue);
                const reusableInput = reusableEmptyInputs.shift();
                if (reusableInput instanceof HTMLInputElement) {
                    reusableInput.value = nextCostValue;
                    insertedInputs.push(reusableInput);
                    continue;
                }
                appendBlankOrPresetValue(nextCostValue);
            }
            return insertedInputs;
        };

        const buildMatrixBidTargetCostPackageRowHtml = (row = {}, index = 0) => {
            const optionList = getMatrixBidTargetCostPackageOptions();
            const defaultOption = getMatrixBidTargetCostPackageDefaultOption();
            const targetOptionValue = normalizeKeywordBidTargetOptionValue(row?.targetOptionValue || '') || defaultOption.value;
            const targetOption = optionList.find(item => item.value === targetOptionValue) || defaultOption;
            const { costLabel } = getMatrixBidTargetCostPackageCostFieldMeta(targetOption.value);
            const costValues = Array.isArray(row?.costValues) && row.costValues.length
                ? row.costValues
                : [String(row?.costValue || '').trim()];
            const rowMaxCost = costValues.reduce((maxValue, costValue) => {
                const amount = parseNumberFromSceneValue(costValue);
                if (!Number.isFinite(amount)) return maxValue;
                return !Number.isFinite(maxValue) || amount > maxValue ? amount : maxValue;
            }, NaN);
            const hasPendingCost = costValues.some((costValue) => !buildMatrixBidTargetCostPackageRowValue({
                targetOptionValue: targetOption.value,
                costValue
            }));
            const batchDraft = {
                interval: String(row?.batchInterval || '').trim(),
                count: String(row?.batchCount || '').trim()
            };
            return `
                <div class="am-wxt-matrix-bid-package-row" data-matrix-bid-package-row="1" data-matrix-bid-package-index="${index}">
                    <div class="am-wxt-matrix-bid-package-row-head">
                        <div class="am-wxt-matrix-dimension-picker am-wxt-matrix-bid-package-target-picker" data-matrix-dimension-picker="1">
                            <button
                                type="button"
                                class="am-wxt-matrix-dimension-picker-trigger"
                                data-matrix-bid-package-picker-toggle="1"
                                aria-expanded="false"
                                title="选择出价目标"
                            >
                                <span class="am-wxt-matrix-dimension-picker-label" data-matrix-bid-package-target-label="1">${Utils.escapeHtml(targetOption.label || defaultOption.label)}</span>
                                <span class="am-wxt-matrix-dimension-picker-arrow">▾</span>
                            </button>
                            <div class="am-wxt-matrix-dimension-picker-panel" data-matrix-dimension-picker-panel="1">
                                ${optionList.map(item => `
                                    <button
                                        type="button"
                                        class="am-wxt-matrix-bid-package-target-option${item.value === targetOption.value ? ' is-active' : ''}"
                                        data-matrix-bid-package-target-option="1"
                                        data-value="${Utils.escapeHtml(item.value)}"
                                        aria-pressed="${item.value === targetOption.value ? 'true' : 'false'}"
                                        title="${Utils.escapeHtml(item.label)}"
                                    >${Utils.escapeHtml(item.label)}</button>
                                `).join('')}
                            </div>
                            <select class="am-wxt-hidden-control" data-matrix-bid-package-target="1" title="选择出价目标">
                                ${optionList.map(item => `
                                    <option value="${Utils.escapeHtml(item.value)}" ${item.value === targetOption.value ? 'selected' : ''}>${Utils.escapeHtml(item.label)}</option>
                                `).join('')}
                            </select>
                        </div>
                        <button
                            type="button"
                            class="am-wxt-matrix-bid-package-remove"
                            data-matrix-bid-package-remove="1"
                            aria-label="删除目标包"
                            title="删除这一组"
                        >&times;</button>
                    </div>
                    <div class="am-wxt-matrix-bid-package-row-body">
                        <div class="am-wxt-matrix-bid-package-cost-list" data-matrix-bid-package-cost-list="1">
                            ${costValues.map((item, costIndex) => (
                buildMatrixBidTargetCostPackageCostItemHtml(item, targetOption.value, costIndex)
            )).join('')}
                            <div
                                class="am-wxt-matrix-dimension-picker am-wxt-matrix-bid-package-cost-actions"
                                data-matrix-dimension-picker="1"
                                data-matrix-bid-package-cost-actions="1"
                            >
                                <button
                                    type="button"
                                    class="am-wxt-matrix-bid-package-cost-add"
                                    data-matrix-bid-package-cost-add="1"
                                    data-matrix-bid-package-picker-toggle="1"
                                    aria-expanded="false"
                                    aria-label="${Utils.escapeHtml(targetOption.value === 'roi' ? '新增目标值' : '新增目标成本')}"
                                    title="${Utils.escapeHtml(`为${targetOption.label || defaultOption.label}再加一个${costLabel}`)}"
                                >+</button>
                                <div
                                    class="am-wxt-matrix-dimension-picker-panel am-wxt-matrix-bid-package-cost-batch-menu"
                                    data-matrix-dimension-picker-panel="1"
                                    data-matrix-bid-package-cost-batch-menu="1"
                                >
                                    ${buildMatrixBidTargetCostPackageBatchMenuHtml(targetOption.value, rowMaxCost, {
                hasPendingCost,
                interval: batchDraft.interval,
                count: batchDraft.count
            })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        };

        const buildMatrixBidTargetCostPackageEditorHtml = (values = [], suggestedValues = []) => {
            const rows = buildMatrixBidTargetCostPackageRows(values);
            const normalizedValues = uniqueBy(
                rows
                    .reduce((result, item) => {
                        const targetOptionValue = normalizeKeywordBidTargetOptionValue(item?.targetOptionValue || '');
                        const costValues = Array.isArray(item?.costValues) ? item.costValues : [item?.costValue || ''];
                        costValues.forEach((costValue) => {
                            const rowValue = buildMatrixBidTargetCostPackageRowValue({
                                targetOptionValue,
                                costValue
                            });
                            if (rowValue) result.push(rowValue);
                        });
                        return result;
                    }, []),
                item => item
            );
            const summaryText = normalizedValues.length
                ? `已配置 ${normalizedValues.length} 组目标包`
                : '先选目标，再在下方填写目标成本';
            // data-matrix-bid-package-list="1" -> data-matrix-bid-package-row="1" -> data-matrix-bid-package-target="1" -> data-matrix-bid-package-cost="1" -> data-matrix-bid-package-cost-add="1" -> data-matrix-bid-package-cost-remove="1" -> data-matrix-bid-package-remove="1"
            return `
                <div class="am-wxt-matrix-bid-package-editor" data-matrix-dimension-bid-package="1">
                    <div class="am-wxt-matrix-bid-package-summary" data-matrix-bid-package-summary="1">${Utils.escapeHtml(summaryText)}</div>
                    <div class="am-wxt-matrix-bid-package-list" data-matrix-bid-package-list="1">
                        ${rows.map((item, index) => buildMatrixBidTargetCostPackageRowHtml(item, index)).join('')}
                    </div>
                    <textarea class="am-wxt-hidden-control" data-matrix-dimension-values="1" tabindex="-1" aria-hidden="true">${Utils.escapeHtml(serializeMatrixDimensionValues(normalizedValues))}</textarea>
                </div>
            `;
        };

        const readMatrixBidTargetCostPackageValuesFromRow = (row = null) => {
            if (!(row instanceof HTMLElement)) return [];
            const packageRows = Array.from(row.querySelectorAll('[data-matrix-bid-package-row="1"]'));
            if (!packageRows.length) {
                return normalizeMatrixDimensionValues(
                    row.querySelector('[data-matrix-dimension-values="1"]')?.value || ''
                );
            }
            return uniqueBy(
                packageRows
                    .reduce((result, itemRow) => {
                        const targetSelect = itemRow.querySelector('[data-matrix-bid-package-target="1"]');
                        Array.from(itemRow.querySelectorAll('[data-matrix-bid-package-cost="1"]')).forEach((costInput) => {
                            const rowValue = buildMatrixBidTargetCostPackageRowValue({
                                targetOptionValue: targetSelect instanceof HTMLSelectElement ? targetSelect.value : '',
                                costValue: costInput instanceof HTMLInputElement ? costInput.value : ''
                            });
                            if (rowValue) result.push(rowValue);
                        });
                        return result;
                    }, []),
                item => item
            );
        };

        const mergeMatrixBidTargetCostPackageRowsFromDom = (row = null) => {
            if (!(row instanceof HTMLElement)) return;
            const defaultOptionValue = getMatrixBidTargetCostPackageDefaultOption().value;
            const primaryRowByTarget = new Map();
            Array.from(row.querySelectorAll('[data-matrix-bid-package-row="1"]')).forEach((itemRow) => {
                if (!(itemRow instanceof HTMLElement)) return;
                const targetSelect = itemRow.querySelector('[data-matrix-bid-package-target="1"]');
                if (!(targetSelect instanceof HTMLSelectElement)) return;
                const normalizedTargetValue = normalizeKeywordBidTargetOptionValue(targetSelect.value || '') || defaultOptionValue;
                targetSelect.value = resolveMatrixBidTargetCostConfig(normalizedTargetValue)
                    ? normalizedTargetValue
                    : defaultOptionValue;
                if (!primaryRowByTarget.has(targetSelect.value)) {
                    primaryRowByTarget.set(targetSelect.value, itemRow);
                    return;
                }
                const primaryRow = primaryRowByTarget.get(targetSelect.value);
                const primaryCostList = primaryRow?.querySelector('[data-matrix-bid-package-cost-list="1"]');
                const primaryCostAddBtn = primaryCostList?.querySelector('[data-matrix-bid-package-cost-add="1"]');
                Array.from(itemRow.querySelectorAll('[data-matrix-bid-package-cost-item="1"]')).forEach((costItem) => {
                    if (!(costItem instanceof HTMLElement) || !(primaryCostList instanceof HTMLElement)) return;
                    insertMatrixBidTargetCostPackageCostItemElement(primaryCostList, primaryCostAddBtn, costItem);
                });
                itemRow.remove();
            });
            Array.from(row.querySelectorAll('[data-matrix-bid-package-row="1"]')).forEach((itemRow) => {
                if (!(itemRow instanceof HTMLElement)) return;
                const targetSelect = itemRow.querySelector('[data-matrix-bid-package-target="1"]');
                const costList = itemRow.querySelector('[data-matrix-bid-package-cost-list="1"]');
                const costAddBtn = costList?.querySelector('[data-matrix-bid-package-cost-add="1"]');
                const targetOptionValue = normalizeKeywordBidTargetOptionValue(
                    targetSelect instanceof HTMLSelectElement ? targetSelect.value : ''
                ) || defaultOptionValue;
                if (!(costList instanceof HTMLElement)) return;
                if (!costList.querySelector('[data-matrix-bid-package-cost-item="1"]')) {
                    insertMatrixBidTargetCostPackageCostItemHtml(
                        costList,
                        costAddBtn,
                        buildMatrixBidTargetCostPackageCostItemHtml('', targetOptionValue, 0)
                    );
                }
            });
        };

        const syncMatrixBidTargetCostPackageStateFromRow = (row = null) => {
            if (!(row instanceof HTMLElement)) return [];
            mergeMatrixBidTargetCostPackageRowsFromDom(row);
            let pendingCount = 0;
            row.querySelectorAll('[data-matrix-bid-package-row="1"]').forEach((itemRow, index) => {
                if (!(itemRow instanceof HTMLElement)) return;
                itemRow.setAttribute('data-matrix-bid-package-index', String(index));
                const targetSelect = itemRow.querySelector('[data-matrix-bid-package-target="1"]');
                const targetLabel = itemRow.querySelector('[data-matrix-bid-package-target-label="1"]');
                const targetOptions = Array.from(itemRow.querySelectorAll('[data-matrix-bid-package-target-option="1"]'));
                const costMeta = itemRow.querySelector('[data-matrix-bid-package-cost-meta="1"]');
                const costAddBtn = itemRow.querySelector('[data-matrix-bid-package-cost-add="1"]');
                const targetOptionValue = normalizeKeywordBidTargetOptionValue(
                    targetSelect instanceof HTMLSelectElement ? targetSelect.value : ''
                ) || 'conv';
                const targetOptionLabel = MATRIX_BID_TARGET_OPTIONS.find(item => item.value === targetOptionValue)?.label || '获取成交量';
                const { costLabel, costPlaceholder } = getMatrixBidTargetCostPackageCostFieldMeta(targetOptionValue);
                if (targetSelect instanceof HTMLSelectElement && !resolveMatrixBidTargetCostConfig(targetSelect.value)) {
                    targetSelect.value = 'conv';
                }
                if (targetSelect instanceof HTMLSelectElement) {
                    targetOptions.forEach((optionInput) => {
                        if (!(optionInput instanceof HTMLButtonElement)) return;
                        const isActive = String(optionInput.getAttribute('data-value') || '').trim() === targetSelect.value;
                        optionInput.classList.toggle('is-active', isActive);
                        optionInput.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                    });
                    if (targetLabel instanceof HTMLElement) {
                        targetLabel.textContent = targetOptionLabel;
                    }
                }
                if (costMeta instanceof HTMLElement) {
                    costMeta.textContent = costLabel;
                }
                if (costAddBtn instanceof HTMLButtonElement) {
                    costAddBtn.textContent = '+';
                    costAddBtn.setAttribute('aria-label', targetOptionValue === 'roi' ? '新增目标值' : '新增目标成本');
                    costAddBtn.title = `为${targetOptionLabel}再加一个${costLabel}`;
                }
                let rowHasPending = false;
                Array.from(itemRow.querySelectorAll('[data-matrix-bid-package-cost-item="1"]')).forEach((costItem, costIndex) => {
                    if (!(costItem instanceof HTMLElement)) return;
                    costItem.setAttribute('data-matrix-bid-package-cost-index', String(costIndex));
                    const costInput = costItem.querySelector('[data-matrix-bid-package-cost="1"]');
                    const costValue = costInput instanceof HTMLInputElement ? costInput.value : '';
                    if (costInput instanceof HTMLInputElement) {
                        costInput.placeholder = costPlaceholder;
                        costInput.title = `填写${costLabel}`;
                        syncMatrixBidTargetCostInputPresentation(costInput);
                    }
                    const rowValue = buildMatrixBidTargetCostPackageRowValue({
                        targetOptionValue,
                        costValue
                    });
                    const isPending = !rowValue;
                    costItem.classList.toggle('is-pending', isPending);
                    rowHasPending = rowHasPending || isPending;
                    if (isPending) pendingCount += 1;
                });
                const batchMenu = itemRow.querySelector('[data-matrix-bid-package-cost-batch-menu="1"]');
                if (batchMenu instanceof HTMLElement) {
                    const batchDraft = getMatrixBidTargetCostPackageBatchDraft(itemRow);
                    batchMenu.innerHTML = buildMatrixBidTargetCostPackageBatchMenuHtml(
                        targetOptionValue,
                        getMatrixBidTargetCostPackageRowMaxCostValue(itemRow),
                        {
                            hasPendingCost: rowHasPending,
                            interval: batchDraft.interval,
                            count: batchDraft.count
                        }
                    );
                }
                itemRow.classList.toggle('is-pending', rowHasPending);
            });
            const values = readMatrixBidTargetCostPackageValuesFromRow(row);
            const hiddenTextarea = row.querySelector('[data-matrix-dimension-values="1"]');
            if (hiddenTextarea instanceof HTMLTextAreaElement) {
                hiddenTextarea.value = serializeMatrixDimensionValues(values);
            }
            const summary = row.querySelector('[data-matrix-bid-package-summary="1"]');
            if (summary instanceof HTMLElement) {
                summary.textContent = values.length && pendingCount
                    ? `已配置 ${values.length} 组目标包，另有 ${pendingCount} 组待填写`
                    : values.length
                        ? `已配置 ${values.length} 组目标包`
                        : pendingCount
                            ? `已新增 ${pendingCount} 组待填写`
                            : '先选目标，再在下方填写目标成本';
            }
            return values;
        };

        const syncMatrixBidPackageBatchSubmitState = (packageRow = null) => {
            if (!(packageRow instanceof HTMLElement)) return false;
            const batchMenu = packageRow.querySelector('[data-matrix-bid-package-cost-batch-menu="1"]');
            const submitBtn = batchMenu?.querySelector('[data-matrix-bid-package-batch-add]');
            if (!(submitBtn instanceof HTMLButtonElement)) return false;
            const targetSelect = packageRow.querySelector('[data-matrix-bid-package-target="1"]');
            const targetOptionValue = normalizeKeywordBidTargetOptionValue(
                targetSelect instanceof HTMLSelectElement ? targetSelect.value : ''
            ) || getMatrixBidTargetCostPackageDefaultOption().value;
            const { costLabel } = getMatrixBidTargetCostPackageCostFieldMeta(targetOptionValue);
            const baseCost = getMatrixBidTargetCostPackageRowMaxCostValue(packageRow);
            const canBatch = Number.isFinite(baseCost) && baseCost > 0;
            const intervalInput = batchMenu?.querySelector('[data-matrix-bid-package-batch-interval="1"]');
            const countInput = batchMenu?.querySelector('[data-matrix-bid-package-batch-count="1"]');
            const batchDraftState = getMatrixBatchDraftInputState(
                intervalInput instanceof HTMLInputElement ? intervalInput.value : '',
                countInput instanceof HTMLInputElement ? countInput.value : ''
            );
            const canSubmitBatch = canBatch && batchDraftState.canSubmit;
            submitBtn.dataset.matrixBidPackageBatchAdd = canSubmitBatch ? '1' : '0';
            submitBtn.disabled = !canSubmitBatch;
            submitBtn.classList.toggle('is-disabled', !canSubmitBatch);
            submitBtn.title = !canBatch
                ? `先填写一个${costLabel}后再批量新增`
                : (canSubmitBatch
                    ? `按你设置的区间和个数，基于当前最高${formatMatrixBidTargetCostPackageAmount(baseCost)}批量新增${costLabel}`
                    : '先填写有效的区间和个数（个数需为正整数）');
            return canSubmitBatch;
        };

