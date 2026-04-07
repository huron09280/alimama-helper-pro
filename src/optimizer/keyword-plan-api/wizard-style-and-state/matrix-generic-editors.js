        const MATRIX_DIMENSION_NUMERIC_LABEL_RE = /^(?:预算值|每日预算|日均预算|总预算|预算|平均成交成本|平均直接成交成本|直接成交成本|单次成交成本|目标成交成本|目标成本|平均收藏加购成本|收藏加购成本|平均点击成本|点击成本|目标投产比|ROI目标值|出价目标值|约束值|出价|溢价|折扣|比例|数量|金额|单价)$/;
        const MATRIX_DIMENSION_NON_NUMERIC_LABEL_RE = /^(?:预算类型|出价方式|出价目标|优化目标|匹配方式|计划名前缀|计划组|投放时间|投放日期|分时折扣|投放地域|投放地域\/投放时间|资源位设置|投放资源位|选品方式|商品|人群设置|创意设置|设置创意|套餐包|种子人群|关键词设置|核心词设置|卡位方式|流量智选|冷启加速|推广模式|营销目标|选择方案|选择解决方案)$/;

        const isMatrixDimensionNumericValueLabel = (label = '') => {
            const normalizedLabel = normalizeMatrixSceneFieldLabel(label);
            if (!normalizedLabel) return false;
            if (MATRIX_DIMENSION_NON_NUMERIC_LABEL_RE.test(normalizedLabel)) return false;
            return MATRIX_DIMENSION_NUMERIC_LABEL_RE.test(normalizedLabel)
                || /预算|成本|投产比|目标值|约束值|出价|溢价|折扣|比例|数量|金额|单价/.test(normalizedLabel);
        };

        const isMatrixDimensionStructuredValuePreset = (preset = null) => {
            const inputMode = String(preset?.valueInputMode || '').trim();
            return !!preset && inputMode !== 'multi_select' && inputMode !== 'package_rows';
        };

        const isMatrixDimensionBatchValuePreset = (preset = null) => {
            if (!isMatrixDimensionStructuredValuePreset(preset)) return false;
            const explicitValueType = String(preset?.valueType || '').trim().toLowerCase();
            if (explicitValueType) return explicitValueType === 'number';
            return isMatrixDimensionNumericValueLabel(preset?.label || preset?.key || '');
        };

        const getMatrixDimensionPresetFromRow = (row = null, sceneName = '') => {
            if (!(row instanceof HTMLElement)) return null;
            const key = String(row.querySelector('[data-matrix-dimension-key="1"]')?.value || '').trim();
            const currentSceneName = getMatrixSceneName(sceneName || wizardState?.draft?.sceneName || '');
            return getMatrixDimensionPresetByKey(key, currentSceneName);
        };

        const formatMatrixDimensionNumericValue = (amount = NaN) => {
            if (!Number.isFinite(amount) || amount <= 0) return '';
            return String((Math.round(amount * 100) / 100).toFixed(2)).replace(/(?:\.0+|(\.\d+?)0+)$/, '$1');
        };

        const getMatrixDimensionValuePlaceholder = (preset = null) => {
            const suggestion = normalizeText(Array.isArray(preset?.suggestedValues) ? preset.suggestedValues[0] : '');
            if (suggestion) return suggestion;
            const normalizedPlaceholder = normalizeText(preset?.placeholder || '')
                .replace(/^例如\s*/i, '')
                .split(/[\n,，;；]+/g)
                .map(item => normalizeText(item))
                .filter(Boolean)[0] || '';
            if (normalizedPlaceholder && !/^(请输入|填写)/.test(normalizedPlaceholder)) {
                return normalizedPlaceholder;
            }
            return isMatrixDimensionBatchValuePreset(preset) ? '100' : '输入一个值';
        };

        const buildMatrixDimensionValueItemHtml = (value = '', preset = null, index = 0) => {
            const displayValue = String(value || '').trim();
            const isNumeric = isMatrixDimensionBatchValuePreset(preset);
            const placeholder = getMatrixDimensionValuePlaceholder(preset);
            const widthChars = isNumeric
                ? Math.max(3, Math.min(10, (displayValue || placeholder || '').length || 3))
                : Math.max(4, Math.min(18, (displayValue || placeholder || '').length || 4));
            return `
                <div class="am-wxt-matrix-value-item${isNumeric ? ' is-numeric' : ''}" data-matrix-dimension-value-item="1" data-matrix-dimension-value-index="${index}">
                    <input
                        type="text"
                        ${isNumeric ? 'inputmode="decimal"' : ''}
                        data-matrix-dimension-value-item-input="1"
                        data-matrix-dimension-value-kind="${isNumeric ? 'number' : 'text'}"
                        value="${Utils.escapeHtml(displayValue)}"
                        placeholder="${Utils.escapeHtml(placeholder)}"
                        title="${Utils.escapeHtml(`填写${String(preset?.label || '维度值').trim() || '维度值'}`)}"
                        size="${widthChars}"
                        style="--am-wxt-matrix-value-chars:${widthChars};padding:0 7px;border:0;background:transparent;${isNumeric ? 'text-align:center;' : 'text-align:left;'}box-shadow:none;outline:none;-webkit-appearance:none;appearance:none;"
                    />
                    <button
                        type="button"
                        class="am-wxt-matrix-value-item-remove"
                        data-matrix-dimension-value-item-remove="1"
                        aria-label="删除维度值"
                        title="删除这个维度值"
                    >&times;</button>
                </div>
            `;
        };

        const insertMatrixDimensionValueItemHtml = (valueList = null, html = '') => {
            if (!(valueList instanceof HTMLElement) || !String(html || '').trim()) return null;
            valueList.insertAdjacentHTML('beforeend', html);
            return Array.from(valueList.querySelectorAll('[data-matrix-dimension-value-item="1"]')).slice(-1)[0] || null;
        };

        const getMatrixDimensionValueRowMaxNumericValue = (row = null) => {
            if (!(row instanceof HTMLElement)) return NaN;
            return Array.from(row.querySelectorAll('[data-matrix-dimension-value-item-input="1"]'))
                .reduce((maxValue, valueInput) => {
                    const amount = parseNumberFromSceneValue(valueInput instanceof HTMLInputElement ? valueInput.value : '');
                    if (!Number.isFinite(amount)) return maxValue;
                    return !Number.isFinite(maxValue) || amount > maxValue ? amount : maxValue;
                }, NaN);
        };

        const syncMatrixDimensionValueInputPresentation = (valueInput = null, options = {}) => {
            if (!(valueInput instanceof HTMLInputElement)) return;
            const kind = String(options?.kind || valueInput.dataset.matrixDimensionValueKind || '').trim() || 'text';
            const isNumeric = kind === 'number';
            const displayValue = String(valueInput.value || valueInput.placeholder || '').trim();
            const widthChars = isNumeric
                ? Math.max(3, Math.min(10, displayValue.length || 0 || 3))
                : Math.max(4, Math.min(18, displayValue.length || 0 || 4));
            valueInput.style.setProperty('--am-wxt-matrix-value-chars', String(widthChars));
            valueInput.style.padding = '0 7px';
            valueInput.style.border = '0';
            valueInput.style.background = 'transparent';
            valueInput.style.textAlign = isNumeric ? 'center' : 'left';
            valueInput.style.boxShadow = 'none';
            valueInput.style.outline = 'none';
            valueInput.style.webkitAppearance = 'none';
            valueInput.style.appearance = 'none';
            valueInput.size = widthChars;
        };

        const getMatrixDimensionValueBatchDraft = (row = null) => ({
            interval: row instanceof HTMLElement
                ? String(row.dataset.matrixDimensionBatchInterval || '').trim()
                : '',
            count: row instanceof HTMLElement
                ? String(row.dataset.matrixDimensionBatchCount || '').trim()
                : ''
        });

        const setMatrixDimensionValueBatchDraft = (row = null, options = {}) => {
            if (!(row instanceof HTMLElement)) return { interval: '', count: '' };
            const currentDraft = getMatrixDimensionValueBatchDraft(row);
            const nextInterval = String(options?.interval ?? currentDraft.interval ?? '').trim();
            const nextCount = String(options?.count ?? currentDraft.count ?? '').trim();
            if (nextInterval) {
                row.dataset.matrixDimensionBatchInterval = nextInterval;
            } else {
                delete row.dataset.matrixDimensionBatchInterval;
            }
            if (nextCount) {
                row.dataset.matrixDimensionBatchCount = nextCount;
            } else {
                delete row.dataset.matrixDimensionBatchCount;
            }
            return {
                interval: nextInterval,
                count: nextCount
            };
        };

        const getMatrixDimensionValueBatchIntervalPlaceholder = (baseValue = NaN) => (
            baseValue < 3 ? '0.1'
                : baseValue < 10 ? '0.5'
                    : baseValue < 80 ? '1'
                        : '5'
        );

        const getMatrixBatchDraftInputState = (intervalValue = '', countValue = '') => {
            const intervalText = String(intervalValue || '').trim();
            const countText = String(countValue || '').trim();
            const intervalAmount = parseNumberFromSceneValue(intervalText);
            const countAmount = parseNumberFromSceneValue(countText);
            const hasValidInterval = Number.isFinite(intervalAmount) && intervalAmount > 0;
            const hasValidCount = /^[1-9]\d*$/.test(countText) && Number.isFinite(countAmount) && countAmount > 0;
            return {
                hasValidInterval,
                hasValidCount,
                canSubmit: hasValidInterval && hasValidCount
            };
        };

        const buildMatrixDimensionValueBatchMenuHtml = (preset = null, baseValue = NaN, options = {}) => {
            const supportsBatch = isMatrixDimensionBatchValuePreset(preset);
            const hasPendingValue = options?.hasPendingValue === true;
            const batchDraft = {
                interval: String(options?.interval || '').trim(),
                count: String(options?.count || '').trim()
            };
            const canBatch = supportsBatch && Number.isFinite(baseValue) && baseValue > 0;
            const batchDraftState = getMatrixBatchDraftInputState(batchDraft.interval, batchDraft.count);
            const canSubmitBatch = canBatch && batchDraftState.canSubmit;
            const valueLabel = String(preset?.label || '维度值').trim() || '维度值';
            const baseText = supportsBatch
                ? (canBatch ? `参考当前最高 ${formatMatrixDimensionNumericValue(baseValue)}` : `先填 1 个${valueLabel}`)
                : '文本维度仅支持手动新增';
            const batchSubmitTitle = !canBatch
                ? `先填写一个${valueLabel}后再批量新增`
                : (canSubmitBatch
                    ? `按你设置的区间和个数，基于当前最高${formatMatrixDimensionNumericValue(baseValue)}批量新增${valueLabel}`
                    : '先填写有效的区间和个数（个数需为正整数）');
            return `
                <button
                    type="button"
                    class="am-wxt-matrix-value-batch-option"
                    data-matrix-dimension-value-batch-manual="1"
                    title="${Utils.escapeHtml(hasPendingValue ? `继续填写当前空白${valueLabel}` : `手动新增一个${valueLabel}`)}"
                >${Utils.escapeHtml(hasPendingValue ? '继续填写空位' : '新增1个')}</button>
                <div class="am-wxt-matrix-value-batch-note">${Utils.escapeHtml(baseText)}</div>
                <div class="am-wxt-matrix-value-batch-help">间隔填“隔多少”，个数填“生成多少个”</div>
                ${supportsBatch ? `
                    <div class="am-wxt-matrix-value-batch-form">
                        <input
                            type="text"
                            inputmode="decimal"
                            data-matrix-dimension-value-batch-interval="1"
                            value="${Utils.escapeHtml(batchDraft.interval)}"
                            placeholder="${Utils.escapeHtml(getMatrixDimensionValueBatchIntervalPlaceholder(baseValue))}"
                            aria-label="批量区间值"
                            title="填写批量递增区间值"
                            ${canBatch ? '' : 'disabled'}
                        />
                        <input
                            type="text"
                            inputmode="numeric"
                            data-matrix-dimension-value-batch-count="1"
                            value="${Utils.escapeHtml(batchDraft.count)}"
                            placeholder="3"
                            aria-label="批量个数"
                            title="填写批量新增个数"
                            ${canBatch ? '' : 'disabled'}
                        />
                    </div>
                    <button
                        type="button"
                        class="am-wxt-matrix-value-batch-submit${canSubmitBatch ? '' : ' is-disabled'}"
                        data-matrix-dimension-value-batch-add="${canSubmitBatch ? '1' : '0'}"
                        title="${Utils.escapeHtml(batchSubmitTitle)}"
                        ${canSubmitBatch ? '' : 'disabled'}
                    >批量新增</button>
                ` : ''}
            `;
        };

        const readMatrixStructuredDimensionValuesFromRow = (row = null) => {
            if (!(row instanceof HTMLElement)) return [];
            return normalizeMatrixDimensionValues(
                Array.from(row.querySelectorAll('[data-matrix-dimension-value-item-input="1"]'))
                    .map((input) => input instanceof HTMLInputElement ? input.value : '')
            );
        };

        const appendMatrixDimensionBatchValues = (row = null, options = {}) => {
            if (!(row instanceof HTMLElement)) return [];
            const preset = getMatrixDimensionPresetFromRow(row, options?.sceneName || '');
            const valueList = row.querySelector('[data-matrix-dimension-value-list="1"]');
            if (!(valueList instanceof HTMLElement) || !preset) return [];
            const insertedInputs = [];
            const appendBlankOrPresetValue = (nextValue = '') => {
                const insertedItem = insertMatrixDimensionValueItemHtml(
                    valueList,
                    buildMatrixDimensionValueItemHtml(
                        nextValue,
                        preset,
                        valueList.querySelectorAll('[data-matrix-dimension-value-item="1"]').length
                    )
                );
                const insertedInput = insertedItem?.querySelector('[data-matrix-dimension-value-item-input="1"]');
                if (insertedInput instanceof HTMLInputElement) {
                    insertedInputs.push(insertedInput);
                }
                return insertedInput;
            };
            const reusableEmptyInputs = Array.from(row.querySelectorAll('[data-matrix-dimension-value-item-input="1"]')).filter((input) => (
                !normalizeText(input instanceof HTMLInputElement ? input.value : '')
            ));
            if (String(options?.mode || '').trim() === 'manual') {
                const emptyValueInput = reusableEmptyInputs[0];
                if (emptyValueInput instanceof HTMLInputElement) {
                    insertedInputs.push(emptyValueInput);
                    return insertedInputs;
                }
                appendBlankOrPresetValue('');
                return insertedInputs;
            }
            if (!isMatrixDimensionBatchValuePreset(preset)) return insertedInputs;
            const baseValue = getMatrixDimensionValueRowMaxNumericValue(row);
            const interval = parseNumberFromSceneValue(options?.interval || '');
            const count = Math.max(1, Math.min(20, Math.round(parseNumberFromSceneValue(options?.count || '')) || 0));
            if (!Number.isFinite(baseValue) || baseValue <= 0) return insertedInputs;
            if (!Number.isFinite(interval) || interval <= 0 || !count) return insertedInputs;
            const existingValueSet = new Set(
                Array.from(row.querySelectorAll('[data-matrix-dimension-value-item-input="1"]'))
                    .map((input) => formatMatrixDimensionNumericValue(
                        parseNumberFromSceneValue(input instanceof HTMLInputElement ? input.value : '')
                    ))
                    .filter(Boolean)
            );
            for (let step = 1; step <= count; step += 1) {
                const nextValue = formatMatrixDimensionNumericValue(baseValue + interval * step);
                if (!nextValue || existingValueSet.has(nextValue)) continue;
                existingValueSet.add(nextValue);
                const reusableInput = reusableEmptyInputs.shift();
                if (reusableInput instanceof HTMLInputElement) {
                    reusableInput.value = nextValue;
                    insertedInputs.push(reusableInput);
                    continue;
                }
                appendBlankOrPresetValue(nextValue);
            }
            return insertedInputs;
        };

        const buildMatrixStructuredDimensionEditorHtml = (values = [], preset = null) => {
            const normalizedValues = normalizeMatrixDimensionValues(values);
            const itemValues = normalizedValues.length ? normalizedValues : [''];
            const batchDraft = {
                interval: '',
                count: ''
            };
            const rowMaxValue = isMatrixDimensionBatchValuePreset(preset)
                ? itemValues.reduce((maxValue, item) => {
                    const amount = parseNumberFromSceneValue(item);
                    if (!Number.isFinite(amount)) return maxValue;
                    return !Number.isFinite(maxValue) || amount > maxValue ? amount : maxValue;
                }, NaN)
                : NaN;
            const hasPendingValue = itemValues.some((item) => !normalizeText(item));
            const summaryText = normalizedValues.length
                ? `已填写 ${normalizedValues.length} 个值`
                : '先填写 1 个值';
            return `
                <div class="am-wxt-matrix-value-editor" data-matrix-dimension-value-editor="1" data-matrix-dimension-value-type="${isMatrixDimensionBatchValuePreset(preset) ? 'number' : 'text'}">
                    <div class="am-wxt-matrix-value-summary" data-matrix-dimension-value-summary="1">${Utils.escapeHtml(summaryText)}</div>
                    <div class="am-wxt-matrix-value-body">
                        <div class="am-wxt-matrix-value-list" data-matrix-dimension-value-list="1">
                            ${itemValues.map((item, index) => buildMatrixDimensionValueItemHtml(item, preset, index)).join('')}
                            <div
                                class="am-wxt-matrix-dimension-picker am-wxt-matrix-value-actions"
                                data-matrix-dimension-picker="1"
                                data-matrix-dimension-value-actions="1"
                            >
                                <button
                                    type="button"
                                    class="am-wxt-matrix-value-add"
                                    data-matrix-dimension-value-add="1"
                                    data-matrix-bid-package-picker-toggle="1"
                                    aria-expanded="false"
                                    aria-label="新增维度值"
                                    title="新增一个维度值"
                                >+</button>
                                <div
                                    class="am-wxt-matrix-dimension-picker-panel am-wxt-matrix-value-batch-menu"
                                    data-matrix-dimension-picker-panel="1"
                                    data-matrix-dimension-value-batch-menu="1"
                                >
                                    ${buildMatrixDimensionValueBatchMenuHtml(preset, rowMaxValue, {
                hasPendingValue,
                interval: batchDraft.interval,
                count: batchDraft.count
            })}
                                </div>
                            </div>
                        </div>
                    </div>
                    <textarea class="am-wxt-hidden-control" data-matrix-dimension-values="1" tabindex="-1" aria-hidden="true">${Utils.escapeHtml(serializeMatrixDimensionValues(normalizedValues))}</textarea>
                </div>
            `;
        };

        const syncMatrixStructuredDimensionStateFromRow = (row = null, sceneName = '') => {
            if (!(row instanceof HTMLElement)) return [];
            const preset = getMatrixDimensionPresetFromRow(row, sceneName);
            if (!preset || !isMatrixDimensionStructuredValuePreset(preset)) {
                return readMatrixStructuredDimensionValuesFromRow(row);
            }
            const valueList = row.querySelector('[data-matrix-dimension-value-list="1"]');
            if (valueList instanceof HTMLElement && !valueList.querySelector('[data-matrix-dimension-value-item="1"]')) {
                insertMatrixDimensionValueItemHtml(valueList, buildMatrixDimensionValueItemHtml('', preset, 0));
            }
            let pendingCount = 0;
            row.querySelectorAll('[data-matrix-dimension-value-item="1"]').forEach((item, index) => {
                if (!(item instanceof HTMLElement)) return;
                item.setAttribute('data-matrix-dimension-value-index', String(index));
                const valueInput = item.querySelector('[data-matrix-dimension-value-item-input="1"]');
                if (valueInput instanceof HTMLInputElement) {
                    valueInput.dataset.matrixDimensionValueKind = isMatrixDimensionBatchValuePreset(preset) ? 'number' : 'text';
                    syncMatrixDimensionValueInputPresentation(valueInput, {
                        kind: valueInput.dataset.matrixDimensionValueKind
                    });
                }
                const isPending = !normalizeText(valueInput instanceof HTMLInputElement ? valueInput.value : '');
                item.classList.toggle('is-pending', isPending);
                if (isPending) pendingCount += 1;
            });
            const values = readMatrixStructuredDimensionValuesFromRow(row);
            const hiddenTextarea = row.querySelector('[data-matrix-dimension-values="1"]');
            if (hiddenTextarea instanceof HTMLTextAreaElement) {
                hiddenTextarea.value = serializeMatrixDimensionValues(values);
            }
            const batchMenu = row.querySelector('[data-matrix-dimension-value-batch-menu="1"]');
            if (batchMenu instanceof HTMLElement) {
                const batchDraft = getMatrixDimensionValueBatchDraft(row);
                batchMenu.innerHTML = buildMatrixDimensionValueBatchMenuHtml(
                    preset,
                    getMatrixDimensionValueRowMaxNumericValue(row),
                    {
                        hasPendingValue: pendingCount > 0,
                        interval: batchDraft.interval,
                        count: batchDraft.count
                    }
                );
            }
            const summary = row.querySelector('[data-matrix-dimension-value-summary="1"]');
            if (summary instanceof HTMLElement) {
                summary.textContent = values.length && pendingCount
                    ? `已填写 ${values.length} 个值，另有 ${pendingCount} 个空位`
                    : values.length
                        ? `已填写 ${values.length} 个值`
                        : pendingCount
                            ? `已新增 ${pendingCount} 个待填值`
                            : '先填写 1 个值';
            }
            return values;
        };

        const syncMatrixDimensionValueBatchSubmitState = (row = null, sceneName = '') => {
            if (!(row instanceof HTMLElement)) return false;
            const batchMenu = row.querySelector('[data-matrix-dimension-value-batch-menu="1"]');
            const submitBtn = batchMenu?.querySelector('[data-matrix-dimension-value-batch-add]');
            if (!(submitBtn instanceof HTMLButtonElement)) return false;
            const preset = getMatrixDimensionPresetFromRow(row, sceneName);
            const valueLabel = String(preset?.label || '维度值').trim() || '维度值';
            const baseValue = getMatrixDimensionValueRowMaxNumericValue(row);
            const canBatch = isMatrixDimensionBatchValuePreset(preset) && Number.isFinite(baseValue) && baseValue > 0;
            const intervalInput = batchMenu?.querySelector('[data-matrix-dimension-value-batch-interval="1"]');
            const countInput = batchMenu?.querySelector('[data-matrix-dimension-value-batch-count="1"]');
            const batchDraftState = getMatrixBatchDraftInputState(
                intervalInput instanceof HTMLInputElement ? intervalInput.value : '',
                countInput instanceof HTMLInputElement ? countInput.value : ''
            );
            const canSubmitBatch = canBatch && batchDraftState.canSubmit;
            submitBtn.dataset.matrixDimensionValueBatchAdd = canSubmitBatch ? '1' : '0';
            submitBtn.disabled = !canSubmitBatch;
            submitBtn.classList.toggle('is-disabled', !canSubmitBatch);
            submitBtn.title = !canBatch
                ? `先填写一个${valueLabel}后再批量新增`
                : (canSubmitBatch
                    ? `按你设置的区间和个数，基于当前最高${formatMatrixDimensionNumericValue(baseValue)}批量新增${valueLabel}`
                    : '先填写有效的区间和个数（个数需为正整数）');
            return canSubmitBatch;
        };

