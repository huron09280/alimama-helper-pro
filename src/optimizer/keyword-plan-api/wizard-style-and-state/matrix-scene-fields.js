        const getMatrixSceneName = (sceneName = '') => {
            const normalizedSceneName = String(sceneName || '').trim();
            return SCENE_NAME_LIST.includes(normalizedSceneName) ? normalizedSceneName : '';
        };

        const isMatrixSceneFieldBindingKey = (key = '') => /^scene_field:/i.test(String(key || '').trim());

        const getMatrixSceneFieldBindingKey = (fieldLabel = '') => {
            const normalizedFieldLabel = typeof normalizeSceneRenderFieldLabel === 'function'
                ? normalizeSceneRenderFieldLabel(fieldLabel)
                : String(fieldLabel || '').replace(/[：:]/g, '').trim();
            const fieldKey = typeof normalizeSceneFieldKey === 'function'
                ? normalizeSceneFieldKey(normalizedFieldLabel)
                : normalizeText(normalizedFieldLabel).replace(/[：:]/g, '').trim();
            return fieldKey ? `${MATRIX_SCENE_FIELD_KEY_PREFIX}${fieldKey}` : '';
        };

        const normalizeMatrixSceneFieldValue = (value = '') => (
            typeof normalizeSceneSettingValue === 'function'
                ? normalizeSceneSettingValue(value)
                : normalizeText(value)
        );

        const normalizeMatrixSceneRenderFieldLabel = (fieldLabel = '') => {
            if (typeof normalizeSceneRenderFieldLabel === 'function') {
                return normalizeSceneRenderFieldLabel(fieldLabel);
            }
            const raw = normalizeText(fieldLabel).replace(/[：:]/g, '').trim();
            if (!raw) return '';
            if (/^(campaign\.|adgroup\.)/i.test(raw)) return raw;
            const token = normalizeText(String(raw || '').replace(/[：:]/g, ''));
            for (const rule of MATRIX_SCENE_RENDER_FIELD_ALIAS_RULES) {
                if (rule.pattern.test(token)) {
                    return rule.label;
                }
            }
            return raw;
        };

        const normalizeMatrixSceneFieldLabel = (fieldLabel = '') => (
            normalizeMatrixSceneRenderFieldLabel(fieldLabel)
        );

        const normalizeMatrixSceneFieldKey = (fieldLabel = '') => (
            typeof normalizeSceneFieldKey === 'function'
                ? normalizeSceneFieldKey(fieldLabel)
                : normalizeText(fieldLabel).replace(/[：:]/g, '').trim()
        );

        const normalizeMatrixSceneFieldToken = (fieldLabel = '') => (
            typeof normalizeSceneRenderFieldToken === 'function'
                ? normalizeSceneRenderFieldToken(fieldLabel)
                : normalizeText(normalizeMatrixSceneRenderFieldLabel(fieldLabel)).replace(/[：:]/g, '').trim()
        );

        const isMatrixLikelySceneOptionValue = (value = '') => {
            if (typeof isLikelySceneOptionValue === 'function') {
                return isLikelySceneOptionValue(value);
            }
            const text = normalizeMatrixSceneFieldValue(value);
            return !!text && text.length <= 24 && !/^(保存|关闭|清空|展开|收起|详情|删除|编辑)$/.test(text);
        };

        const normalizeMatrixGoalCandidateLabel = (value = '') => (
            typeof normalizeGoalCandidateLabel === 'function'
                ? normalizeGoalCandidateLabel(value)
                : normalizeMatrixSceneFieldValue(value)
        );

        const shouldHideMatrixKeywordBidTargetCostField = (fieldLabel = '', sceneName = '', marketingGoal = '') => {
            if (getMatrixSceneName(sceneName) !== '关键词推广') return false;
            const normalizedGoal = normalizeMatrixGoalCandidateLabel(marketingGoal);
            if (normalizedGoal !== '自定义推广') return false;
            const normalizedFieldLabel = normalizeMatrixSceneFieldLabel(fieldLabel);
            if (!normalizedFieldLabel) return false;
            return MATRIX_KEYWORD_BID_TARGET_COST_FIELD_LABEL_RE.test(normalizedFieldLabel);
        };

        const isMatrixSceneLabelMatch = (left = '', right = '') => {
            if (typeof isSceneLabelMatch === 'function') {
                return isSceneLabelMatch(left, right);
            }
            const a = normalizeMatrixSceneFieldToken(left);
            const b = normalizeMatrixSceneFieldToken(right);
            if (!a || !b) return false;
            return a === b || a.includes(b) || b.includes(a);
        };

        const dedupeMatrixSceneFieldLabels = (labels = []) => {
            if (typeof dedupeSceneFieldLabelsForRender === 'function') {
                return dedupeSceneFieldLabelsForRender(labels);
            }
            return uniqueBy(
                (Array.isArray(labels) ? labels : [])
                    .map(item => normalizeMatrixSceneFieldLabel(item))
                    .filter(Boolean),
                item => normalizeMatrixSceneFieldToken(item)
            );
        };

        const resolveMatrixSceneFieldOptionType = (fieldLabel = '') => {
            if (typeof resolveSceneFieldOptionType === 'function') {
                return resolveSceneFieldOptionType(fieldLabel);
            }
            const token = normalizeMatrixSceneFieldToken(fieldLabel);
            if (!token) return '';
            if (/(营销目标|选择卡位方案|选择拉新方案|选择方案|选择优化方向|选择解决方案|投放策略|推广模式|卡位方式|选择方式)/.test(token)) return 'goal';
            if (/(出价方式)/.test(token)) return 'bidType';
            if (/(出价目标|优化目标)/.test(token)) return 'bidTarget';
            if (/(预算类型)/.test(token)) return 'budgetType';
            if (/(选品方式|选择推广商品|添加商品)/.test(token)) return 'itemMode';
            if (/(关键词设置|核心词设置|设置词包|匹配方式)/.test(token)) return 'keyword';
            if (/(人群设置|种子人群|设置拉新人群|设置人群)/.test(token)) return 'crowd';
            if (/(投放调优|优化模式)/.test(token)) return 'strategy';
            if (/(投放时间|投放日期|分时折扣|发布日期|排期|投放地域|地域设置|投放地域\/投放时间|资源位溢价|流量智选|冷启加速)/.test(token)) return 'schedule';
            return '';
        };

        const isMatrixSceneFieldConnected = (fieldLabel = '') => {
            const normalizedLabel = normalizeMatrixSceneFieldLabel(fieldLabel);
            if (!normalizedLabel) return false;
            if (/^(campaign\.|adgroup\.)/i.test(normalizedLabel)) return true;
            if (typeof isSceneFieldConnectedToPayload === 'function') {
                return isSceneFieldConnectedToPayload(normalizedLabel);
            }
            const token = normalizeMatrixSceneFieldToken(normalizedLabel);
            return !!token && /(?:预算|出价|目标|方式|匹配|流量|冷启|投放|地域|计划组|选品|人群|创意|套餐包|线索|场景)/.test(token);
        };

        const getMatrixSceneFallbackOptionValues = (sceneName = '', fieldLabel = '') => {
            const normalizedSceneName = getMatrixSceneName(sceneName);
            const normalizedFieldLabel = normalizeMatrixSceneFieldLabel(fieldLabel);
            if (!normalizedSceneName || !normalizedFieldLabel) return [];
            const optionMap = isPlainObject(MATRIX_SCENE_DIMENSION_OPTION_FALLBACKS[normalizedSceneName])
                ? MATRIX_SCENE_DIMENSION_OPTION_FALLBACKS[normalizedSceneName]
                : {};
            const optionList = Array.isArray(optionMap[normalizedFieldLabel])
                ? optionMap[normalizedFieldLabel]
                : [];
            return uniqueBy(
                optionList
                    .map(item => normalizeMatrixSceneFieldValue(item))
                    .filter(Boolean),
                item => item
            ).slice(0, 24);
        };

        const getMatrixSceneCurrentFieldValue = ({
            fieldLabel = '',
            fieldKey = '',
            bucket = {},
            sceneSettings = {},
            profile = null,
            optionList = []
        } = {}) => {
            const normalizedFieldLabel = normalizeMatrixSceneFieldLabel(fieldLabel);
            const normalizedFieldKey = normalizeMatrixSceneFieldKey(fieldKey || normalizedFieldLabel);
            const sceneName = getMatrixSceneName(profile?.sceneName || '') || getMatrixSceneName(sceneSettings?.场景名称 || '');
            const sceneDefaults = isPlainObject(MATRIX_SCENE_DIMENSION_DEFAULT_VALUES[sceneName])
                ? MATRIX_SCENE_DIMENSION_DEFAULT_VALUES[sceneName]
                : {};
            const fallbackDefault = normalizeMatrixSceneFieldValue(
                sceneDefaults[normalizedFieldLabel]
                || sceneDefaults[normalizedFieldKey]
                || ''
            );
            return normalizeMatrixSceneFieldValue(
                bucket?.[normalizedFieldKey]
                || sceneSettings?.[normalizedFieldLabel]
                || sceneSettings?.[normalizedFieldKey]
                || profile?.fieldMeta?.[normalizedFieldKey]?.defaultValue
                || (typeof resolveSceneFieldDefaultValue === 'function'
                    ? resolveSceneFieldDefaultValue({
                        fieldLabel: normalizedFieldLabel,
                        options: optionList,
                        schema: null
                    })
                    : '')
                || fallbackDefault
                || optionList[0]
                || ''
            );
        };

        const getMatrixSceneDimensionFieldLabels = (sceneName = '') => {
            const normalizedSceneName = getMatrixSceneName(sceneName);
            if (!normalizedSceneName) return [];
            const profile = typeof getSceneProfile === 'function' ? getSceneProfile(normalizedSceneName) : {};
            const sceneSettings = typeof buildSceneSettingsPayload === 'function'
                ? buildSceneSettingsPayload(normalizedSceneName)
                : {};
            const bucket = typeof ensureSceneSettingBucket === 'function'
                ? ensureSceneSettingBucket(normalizedSceneName)
                : {};
            const metaFieldLabels = isPlainObject(profile?.fieldMeta)
                ? Object.keys(profile.fieldMeta)
                    .map(key => normalizeText(profile.fieldMeta[key]?.label || '').replace(/[：:]/g, '').trim())
                    .filter(Boolean)
                : [];
            const preferredFieldLabels = (Array.isArray(MATRIX_SCENE_DIMENSION_FALLBACK_LABELS[normalizedSceneName])
                ? MATRIX_SCENE_DIMENSION_FALLBACK_LABELS[normalizedSceneName]
                : []
            ).map(item => normalizeMatrixSceneFieldLabel(item)).filter(Boolean);
            const preferredFieldTokenSet = new Set(
                preferredFieldLabels
                    .map(item => normalizeMatrixSceneFieldToken(item))
                    .filter(Boolean)
            );
            const goalSelectorLabelRe = /^(营销目标|选择卡位方案|选择拉新方案|选择方案|选择优化方向|选择解决方案|投放策略|推广模式)$/;
            const collectGoalFieldLabels = (goal = null) => {
                const labels = [];
                if (Array.isArray(goal?.fieldRows)) {
                    goal.fieldRows.forEach(row => {
                        const text = normalizeText(row?.label || row?.settingKey || '').replace(/[：:]/g, '').trim();
                        if (text) labels.push(text);
                    });
                }
                if (isPlainObject(goal?.fieldMatrix)) {
                    Object.keys(goal.fieldMatrix).forEach(label => {
                        const text = normalizeText(label).replace(/[：:]/g, '').trim();
                        if (text) labels.push(text);
                    });
                }
                return uniqueBy(labels, item => normalizeMatrixSceneFieldToken(item));
            };
            const goalFieldKey = normalizeMatrixSceneFieldKey('营销目标') || '营销目标';
            const goalAliasKeys = [
                '选择卡位方案',
                '选择拉新方案',
                '选择方案',
                '选择优化方向',
                '选择解决方案',
                '投放策略',
                '推广模式'
            ].map(label => normalizeMatrixSceneFieldKey(label)).filter(Boolean);
            const activeMarketingGoal = normalizeMatrixGoalCandidateLabel(
                sceneSettings?.营销目标
                || sceneSettings?.选择卡位方案
                || sceneSettings?.选择拉新方案
                || sceneSettings?.选择方案
                || sceneSettings?.选择优化方向
                || sceneSettings?.选择解决方案
                || sceneSettings?.投放策略
                || sceneSettings?.推广模式
                || bucket?.[goalFieldKey]
                || goalAliasKeys.map(key => bucket?.[key]).find(Boolean)
                || ''
            );
            const sceneGoalSpecs = typeof getSceneCachedGoalSpecs === 'function'
                ? getSceneCachedGoalSpecs(normalizedSceneName)
                : [];
            const fallbackGoalRows = typeof getSceneGoalFieldRowFallback === 'function'
                ? getSceneGoalFieldRowFallback(normalizedSceneName, activeMarketingGoal)
                : [];
            const fallbackGoalFieldLabels = dedupeMatrixSceneFieldLabels(
                fallbackGoalRows
                    .map(row => normalizeText(row?.label || '').replace(/[：:]/g, '').trim())
                    .filter(Boolean)
            );
            const allGoalFieldLabels = dedupeMatrixSceneFieldLabels(
                sceneGoalSpecs.flatMap(goal => collectGoalFieldLabels(goal)).concat(fallbackGoalFieldLabels)
            );
            const matchedGoalSpec = sceneGoalSpecs.find(goal => (
                normalizeMatrixGoalCandidateLabel(goal?.goalLabel || '') === activeMarketingGoal
            )) || sceneGoalSpecs.find(goal => goal?.isDefault) || sceneGoalSpecs[0] || null;
            const activeGoalFieldLabels = dedupeMatrixSceneFieldLabels(
                collectGoalFieldLabels(matchedGoalSpec).concat(fallbackGoalFieldLabels)
            );
            const hiddenKeywordFieldTokenSet = new Set(
                ['campaign.promotionScene', 'campaign.itemSelectedMode']
                    .map(item => normalizeMatrixSceneFieldToken(item))
                    .filter(Boolean)
            );
            const rawLabels = uniqueBy(
                []
                    .concat(profile?.requiredFields || [])
                    .concat(metaFieldLabels)
                    .concat(Object.keys(bucket || {}))
                    .concat(Object.keys(sceneSettings || {}))
                    .concat(preferredFieldLabels)
                    .concat(activeGoalFieldLabels)
                    .map(item => normalizeMatrixSceneFieldLabel(item))
                    .filter(Boolean),
                item => normalizeMatrixSceneFieldToken(item)
            );
            return rawLabels.filter((fieldLabel) => {
                const normalizedFieldLabel = normalizeMatrixSceneFieldLabel(fieldLabel);
                const fieldKey = normalizeMatrixSceneFieldKey(normalizedFieldLabel);
                const fieldToken = normalizeMatrixSceneFieldToken(normalizedFieldLabel);
                if (!normalizedFieldLabel || !fieldKey || !fieldToken) return false;
                if (goalSelectorLabelRe.test(normalizeMatrixSceneFieldToken(normalizedFieldLabel))) return false;
                if (MATRIX_SCENE_FIELD_EXCLUDE_LABEL_RE.test(normalizedFieldLabel)) return false;
                if (shouldHideMatrixKeywordBidTargetCostField(normalizedFieldLabel, normalizedSceneName, activeMarketingGoal)) return false;
                if (/^(campaign\.|adgroup\.)/i.test(normalizedFieldLabel)) return false;
                if (!preferredFieldTokenSet.has(fieldToken) && !isMatrixSceneFieldConnected(normalizedFieldLabel)) return false;
                if (normalizedSceneName === '关键词推广' && hiddenKeywordFieldTokenSet.has(fieldToken)) return false;
                if (
                    !preferredFieldTokenSet.has(fieldToken)
                    &&
                    allGoalFieldLabels.length
                    && activeGoalFieldLabels.length
                    && allGoalFieldLabels.some(item => isMatrixSceneLabelMatch(normalizedFieldLabel, item))
                    && !activeGoalFieldLabels.some(item => isMatrixSceneLabelMatch(normalizedFieldLabel, item))
                ) {
                    return false;
                }
                const options = typeof resolveSceneFieldOptions === 'function'
                    ? resolveSceneFieldOptions(profile, normalizedFieldLabel)
                    : getMatrixSceneFallbackOptionValues(normalizedSceneName, normalizedFieldLabel);
                const optionList = uniqueBy(
                    (Array.isArray(options) ? options : [])
                        .map(item => normalizeMatrixSceneFieldValue(item))
                        .filter(Boolean),
                    item => item
                );
                const currentValue = getMatrixSceneCurrentFieldValue({
                    fieldLabel: normalizedFieldLabel,
                    fieldKey,
                    bucket,
                    sceneSettings,
                    profile,
                    optionList
                });
                if (currentValue && /^[\[{]/.test(currentValue)) return false;
                if (preferredFieldTokenSet.has(fieldToken) && optionList.length) return true;
                if (optionList.length >= 2) return true;
                if (currentValue) return true;
                return profile?.fieldMeta?.[fieldKey]?.requiredGuess === true
                    || profile?.fieldMeta?.[fieldKey]?.criticalGuess === true;
            });
        };

        const buildMatrixSceneDimensionPreset = (fieldLabel = '', sceneName = '') => {
            const normalizedSceneName = getMatrixSceneName(sceneName);
            if (!normalizedSceneName) return null;
            const normalizedFieldLabel = normalizeMatrixSceneFieldLabel(fieldLabel);
            const bindingKey = getMatrixSceneFieldBindingKey(normalizedFieldLabel);
            const fieldKey = normalizeMatrixSceneFieldKey(normalizedFieldLabel);
            if (!normalizedFieldLabel || !bindingKey || !fieldKey) return null;
            const profile = typeof getSceneProfile === 'function' ? getSceneProfile(normalizedSceneName) : {};
            const sceneSettings = typeof buildSceneSettingsPayload === 'function'
                ? buildSceneSettingsPayload(normalizedSceneName)
                : {};
            const bucket = typeof ensureSceneSettingBucket === 'function'
                ? ensureSceneSettingBucket(normalizedSceneName)
                : {};
            const optionType = resolveMatrixSceneFieldOptionType(normalizedFieldLabel);
            const optionList = uniqueBy(
                (
                    typeof resolveSceneFieldOptions === 'function'
                        ? resolveSceneFieldOptions(profile, normalizedFieldLabel)
                        : getMatrixSceneFallbackOptionValues(normalizedSceneName, normalizedFieldLabel)
                )
                    .map(item => normalizeMatrixSceneFieldValue(item))
                    .filter(Boolean),
                item => item
            ).slice(0, 24);
            const currentValue = getMatrixSceneCurrentFieldValue({
                fieldLabel: normalizedFieldLabel,
                fieldKey,
                bucket,
                sceneSettings,
                profile,
                optionList
            });
            const shouldUseMultiSelect = optionList.length >= 2 && (
                MATRIX_SCENE_STRICT_OPTION_TYPE_SET.has(optionType)
                || optionList.every(item => isMatrixLikelySceneOptionValue(item))
            );
            const suggestedValues = uniqueBy(
                [
                    currentValue,
                    profile?.fieldMeta?.[fieldKey]?.defaultValue
                ].map(item => normalizeSceneSettingValue(item)).filter(Boolean),
                item => item
            ).slice(0, shouldUseMultiSelect ? 3 : 6);
            const valueType = shouldUseMultiSelect
                ? 'text'
                : (
                    isMatrixDimensionNumericValueLabel(normalizedFieldLabel)
                        || [currentValue]
                            .concat(suggestedValues)
                            .some(item => Number.isFinite(parseNumberFromSceneValue(item)))
                        ? 'number'
                        : 'text'
                );
            const placeholder = (() => {
                if (currentValue) return `例如 ${currentValue}`;
                if (/预算|成本|投产比|目标值|数量|出价/.test(normalizedFieldLabel)) {
                    return `请输入${normalizedFieldLabel}`;
                }
                return `填写${normalizedFieldLabel}，每行一个值`;
            })();
            return {
                key: bindingKey,
                label: normalizedFieldLabel,
                hint: shouldUseMultiSelect
                    ? `场景字段“${normalizedFieldLabel}”，按组合切换已选项。`
                    : `场景字段“${normalizedFieldLabel}”，支持按组合写入该字段。`,
                placeholder,
                suggestedValues,
                valueInputMode: shouldUseMultiSelect ? 'multi_select' : 'text',
                valueType,
                valueOptions: optionList,
                sceneNames: [normalizedSceneName],
                isSceneField: true
            };
        };

        const getMatrixSceneDimensionPresetCatalog = (sceneName = '') => {
            const normalizedSceneName = getMatrixSceneName(sceneName);
            if (!normalizedSceneName) return [];
            return getMatrixSceneDimensionFieldLabels(normalizedSceneName)
                .map(fieldLabel => buildMatrixSceneDimensionPreset(fieldLabel, normalizedSceneName))
                .filter(Boolean);
        };

        const getMatrixDimensionPresetCatalog = (sceneName = '') => {
            const normalizedSceneName = getMatrixSceneName(sceneName);
            if (!normalizedSceneName) return [];
            const fixedCatalog = MATRIX_DIMENSION_PRESET_CATALOG
                .filter(item => !Array.isArray(item.sceneNames) || !item.sceneNames.length || item.sceneNames.includes(normalizedSceneName))
                .map(item => ({
                    ...item,
                    sceneName: normalizedSceneName
                }));
            const sceneCatalog = getMatrixSceneDimensionPresetCatalog(normalizedSceneName)
                .map(item => ({
                    ...item,
                    sceneName: normalizedSceneName
                }));
            return uniqueBy(
                fixedCatalog.concat(sceneCatalog),
                item => item.key
            );
        };

        const getMatrixDimensionPresetByKey = (key = '', sceneName = '') => {
            const normalizedKey = String(key || '').trim();
            if (!normalizedKey) return null;
            return getMatrixDimensionPresetCatalog(sceneName).find(item => item.key === normalizedKey) || null;
        };

        const getMatrixDimensionValueOptions = (preset = null, options = {}) => {
            if (!isPlainObject(preset)) return [];
            const selectedValues = normalizeMatrixDimensionValues(options?.selectedValues || []);
            const baseOptions = Array.isArray(preset.valueOptions)
                ? preset.valueOptions.map((item) => {
                    if (isPlainObject(item)) {
                        return {
                            value: String(item.value || '').trim(),
                            label: String(item.label || item.value || '').trim()
                        };
                    }
                    const value = String(item || '').trim();
                    return { value, label: value };
                })
                : [];
            let optionList = baseOptions.filter(item => item.value);
            if (preset.key === 'material_id') {
                const itemList = Array.isArray(options?.itemList) ? options.itemList : [];
                optionList = itemList.map((item) => {
                    const materialId = String(toIdValue(item?.materialId || item?.itemId || '')).trim();
                    const materialName = String(item?.materialName || item?.name || '').trim();
                    return {
                        value: materialId,
                        label: materialName ? `${materialName} ｜ ${materialId}` : materialId
                    };
                }).filter(item => item.value);
            }
            const existingValues = new Set(optionList.map(item => item.value));
            selectedValues.forEach((value) => {
                if (!existingValues.has(value)) {
                    optionList.push({
                        value,
                        label: preset.key === 'material_id' ? `${value} ｜ 当前值` : `${value}（当前值）`
                    });
                    existingValues.add(value);
                }
            });
            return uniqueBy(optionList, item => item.value);
        };

        const buildMatrixDimensionPreviewText = (values = [], options = {}) => {
            const normalizedValues = normalizeMatrixDimensionValues(values || []);
            const previewLimit = Math.max(1, Math.min(6, toNumber(options?.previewLimit, 3) || 3));
            const previewValues = normalizedValues.slice(0, previewLimit);
            if (!previewValues.length) {
                return String(options?.emptyText || '未填写值').trim() || '未填写值';
            }
            return `${previewValues.join(' / ')}${normalizedValues.length > previewValues.length ? ' / ...' : ''}`;
        };

        const buildMatrixDimensionPickerSummaryText = (values = []) => {
            const normalizedValues = normalizeMatrixDimensionValues(values || []);
            if (!normalizedValues.length) return '点击选择';
            return `已选 ${normalizedValues.length} 项：${buildMatrixDimensionPreviewText(normalizedValues, {
                previewLimit: 2,
                emptyText: '点击选择'
            })}`;
        };

        const buildMatrixDimensionKeyPickerSummaryText = (key = '', sceneName = '') => {
            const preset = getMatrixDimensionPresetByKey(key, sceneName);
            return String(preset?.label || key || '请选择维度').trim() || '请选择维度';
        };

        const syncMatrixDimensionMetaStateFromRow = (row = null, sceneName = '') => {
            if (!(row instanceof HTMLElement)) return [];
            const currentSceneName = getMatrixSceneName(sceneName || wizardState?.draft?.sceneName || '');
            const key = String(row.querySelector('[data-matrix-dimension-key="1"]')?.value || '').trim();
            const preset = getMatrixDimensionPresetByKey(key, currentSceneName);
            if (String(preset?.valueInputMode || '').trim() === 'package_rows') {
                return syncMatrixBidTargetCostPackageStateFromRow(row);
            }
            if (isMatrixDimensionStructuredValuePreset(preset)) {
                return syncMatrixStructuredDimensionStateFromRow(row, currentSceneName);
            }
            return readMatrixDimensionValuesFromRow(row, sceneName);
        };

        const syncMatrixDimensionPickerStateFromRow = (row = null) => {
            if (!(row instanceof HTMLElement)) return [];
            const hiddenSelect = row.querySelector('[data-matrix-dimension-values-select="1"]');
            const optionInputs = Array.from(row.querySelectorAll('[data-matrix-dimension-value-option="1"]'));
            if (!(hiddenSelect instanceof HTMLSelectElement) || !optionInputs.length) return [];
            const selectedValues = normalizeMatrixDimensionValues(
                optionInputs
                    .filter(input => input instanceof HTMLInputElement && input.checked)
                    .map(input => String(input.value || '').trim())
            );
            Array.from(hiddenSelect.options).forEach((option) => {
                option.selected = selectedValues.includes(String(option.value || '').trim());
            });
            const pickerLabel = row.querySelector('[data-matrix-dimension-picker-label="1"]');
            if (pickerLabel instanceof HTMLElement) {
                pickerLabel.textContent = buildMatrixDimensionPickerSummaryText(selectedValues);
            }
            syncMatrixDimensionMetaStateFromRow(row);
            return selectedValues;
        };

        const syncMatrixDimensionKeyPickerStateFromRow = (row = null, sceneName = '') => {
            if (!(row instanceof HTMLElement)) return '';
            const hiddenSelect = row.querySelector('[data-matrix-dimension-key="1"]');
            if (!(hiddenSelect instanceof HTMLSelectElement)) return '';
            const checkedInput = row.querySelector('[data-matrix-dimension-key-option="1"]:checked');
            const nextKey = String(
                (checkedInput instanceof HTMLInputElement ? checkedInput.value : hiddenSelect.value) || ''
            ).trim();
            if (nextKey) {
                hiddenSelect.value = nextKey;
            }
            const pickerLabel = row.querySelector('[data-matrix-dimension-key-picker-label="1"]');
            if (pickerLabel instanceof HTMLElement) {
                pickerLabel.textContent = buildMatrixDimensionKeyPickerSummaryText(
                    hiddenSelect.value || nextKey,
                    sceneName
                );
            }
            return String(hiddenSelect.value || nextKey || '').trim();
        };

        const setMatrixDimensionPickerOpen = (picker = null, open = false) => {
            if (!(picker instanceof HTMLElement)) return;
            const nextOpen = open === true;
            picker.classList.toggle('open', nextOpen);
            const toggleBtn = picker.querySelector('[data-matrix-dimension-picker-toggle="1"], [data-matrix-dimension-key-picker-toggle="1"], [data-matrix-bid-package-picker-toggle="1"]');
            if (toggleBtn instanceof HTMLButtonElement) {
                toggleBtn.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
            }
        };

        const closeMatrixDimensionPickers = (root = null, exceptPicker = null) => {
            if (!(root instanceof HTMLElement)) return;
            root.querySelectorAll('[data-matrix-dimension-picker="1"].open').forEach((picker) => {
                if (picker === exceptPicker) return;
                setMatrixDimensionPickerOpen(picker, false);
            });
        };

        const readMatrixDimensionValuesFromRow = (row = null, sceneName = '') => {
            if (!(row instanceof HTMLElement)) return [];
            const key = String(row.querySelector('[data-matrix-dimension-key="1"]')?.value || '').trim();
            const preset = getMatrixDimensionPresetByKey(key, sceneName);
            if (String(preset?.valueInputMode || '').trim() === 'package_rows') {
                return readMatrixBidTargetCostPackageValuesFromRow(row);
            }
            if (String(preset?.valueInputMode || '').trim() === 'multi_select') {
                const valueSelect = row.querySelector('[data-matrix-dimension-values-select="1"]');
                if (valueSelect instanceof HTMLSelectElement) {
                    return normalizeMatrixDimensionValues(
                        Array.from(valueSelect.selectedOptions).map(option => option.value)
                    );
                }
            }
            if (row.querySelector('[data-matrix-dimension-value-item-input="1"]')) {
                return readMatrixStructuredDimensionValuesFromRow(row);
            }
            return normalizeMatrixDimensionValues(
                row.querySelector('[data-matrix-dimension-values="1"]')?.value || ''
            );
        };

        const getMatrixRecommendedPresetKeys = (sceneName = '') => {
            const catalog = getMatrixDimensionPresetCatalog(sceneName);
            const availableKeys = new Set(catalog.map(item => item.key));
            const preferredPresetKeys = sceneName === '关键词推广'
                ? ['budget', 'bid_mode', 'bid_target_cost_package', 'plan_prefix', 'material_id', 'bid_target', 'day_budget', 'day_average_budget']
                : ['budget', 'bid_mode', 'bid_target', 'plan_prefix', 'material_id', 'day_budget', 'day_average_budget'];
            return uniqueBy(
                preferredPresetKeys
                    .concat(catalog.map(item => item.key))
                    .filter(key => availableKeys.has(key)),
                item => item
            ).slice(0, Math.min(5, catalog.length));
        };

        const getMatrixAppendablePresetKeys = (sceneName = '', dimensions = []) => {
            const catalog = getMatrixDimensionPresetCatalog(sceneName);
            if (!catalog.length) return [];
            const existingKeys = new Set(
                (Array.isArray(dimensions) ? dimensions : [])
                    .map(item => String(item?.key || '').trim())
                    .filter(Boolean)
            );
            const sceneFieldKeys = catalog
                .filter(item => isMatrixSceneFieldBindingKey(item?.key || ''))
                .map(item => item.key);
            const standardKeys = catalog
                .filter(item => !isMatrixSceneFieldBindingKey(item?.key || ''))
                .map(item => item.key);
            return uniqueBy(
                [
                    ...getMatrixRecommendedPresetKeys(sceneName),
                    ...sceneFieldKeys,
                    ...standardKeys
                ].filter(key => key && !existingKeys.has(key)),
                item => item
            );
        };

        const getNextAvailableMatrixPresetKey = (sceneName = '', dimensions = []) => (
            String(getMatrixAppendablePresetKeys(sceneName, dimensions)[0] || '').trim()
        );

        const getMatrixQuickPresetCatalog = (sceneName = '') => {
            const catalog = getMatrixDimensionPresetCatalog(sceneName);
            if (!catalog.length) return [];
            const presetMap = new Map(catalog.map(item => [item.key, item]));
            const sceneFieldKeys = catalog
                .filter(item => isMatrixSceneFieldBindingKey(item?.key || ''))
                .map(item => item.key)
                .slice(0, 6);
            return uniqueBy(
                [
                    ...getMatrixRecommendedPresetKeys(sceneName),
                    ...sceneFieldKeys,
                    ...catalog.map(item => item.key)
                ].map(key => presetMap.get(key)).filter(Boolean),
                item => item.key
            ).slice(0, 12);
        };

        const normalizeMatrixDimensionValues = (input = []) => {
            const sourceList = Array.isArray(input)
                ? input
                : String(input || '').split(/[\n,，;；]+/g);
            return uniqueBy(
                sourceList
                    .map(item => normalizeText(item))
                    .filter(Boolean),
                item => item
            );
        };

