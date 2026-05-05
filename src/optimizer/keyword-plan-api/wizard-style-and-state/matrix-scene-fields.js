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

        const isMatrixTrendThemeFieldLabel = (fieldLabel = '') => {
            const normalizedLabel = normalizeMatrixSceneFieldLabel(fieldLabel);
            const normalizedToken = normalizeMatrixSceneFieldToken(normalizedLabel);
            return /^campaign\.trendThemeList$/i.test(normalizedLabel)
                || /^(选择趋势主题|趋势主题|趋势主题列表)$/.test(normalizedToken);
        };

        const isMatrixKeywordTrendThemeField = (sceneName = '', marketingGoal = '', fieldLabel = '') => (
            getMatrixSceneName(sceneName) === '关键词推广'
            && normalizeMatrixGoalCandidateLabel(marketingGoal) === '趋势明星'
            && isMatrixTrendThemeFieldLabel(fieldLabel)
        );

        const parseMatrixTrendThemeList = (rawValue = '') => {
            if (typeof normalizeTrendThemeList === 'function') {
                return normalizeTrendThemeList(rawValue, 6);
            }
            const sourceValue = Array.isArray(rawValue) || isPlainObject(rawValue)
                ? rawValue
                : String(rawValue || '').trim();
            let parsed = sourceValue;
            if (typeof sourceValue === 'string') {
                try {
                    parsed = JSON.parse(sourceValue);
                } catch {
                    parsed = [];
                }
            }
            return uniqueBy(
                (Array.isArray(parsed) ? parsed : (isPlainObject(parsed) ? [parsed] : []))
                    .map((item) => {
                        if (!isPlainObject(item)) return null;
                        const trendThemeId = normalizeMatrixSceneFieldValue(item.trendThemeId || item.themeId || item.id || '');
                        const trendThemeName = normalizeMatrixSceneFieldValue(item.trendThemeName || item.themeName || item.name || '');
                        if (!trendThemeId && !trendThemeName) return null;
                        return Object.assign({}, item, {
                            trendThemeId,
                            trendThemeName: trendThemeName || trendThemeId
                        });
                    })
                    .filter(Boolean),
                item => item.trendThemeId || item.trendThemeName
            ).slice(0, 6);
        };

        const serializeMatrixTrendThemeRawValue = (rawValue = '') => {
            const rawText = typeof rawValue === 'string' ? rawValue.trim() : '';
            if (rawText === '[]') return '[]';
            const trendThemeList = parseMatrixTrendThemeList(rawValue);
            return trendThemeList.length ? JSON.stringify(trendThemeList) : '';
        };

        const describeMatrixTrendThemeRawValue = (rawValue = '') => {
            const rawText = typeof rawValue === 'string' ? rawValue.trim() : '';
            if (rawText === '[]') return '清空趋势主题';
            const normalizedRaw = serializeMatrixTrendThemeRawValue(rawValue);
            if (normalizedRaw && typeof describeTrendThemeSummary === 'function') {
                return describeTrendThemeSummary(normalizedRaw);
            }
            const trendThemeList = parseMatrixTrendThemeList(normalizedRaw || rawValue);
            if (!trendThemeList.length) return '未选择趋势主题';
            const names = trendThemeList
                .map(item => normalizeMatrixSceneFieldValue(item?.trendThemeName || item?.trendThemeId || ''))
                .filter(Boolean);
            const preview = names.slice(0, 3).join('、');
            return `已选 ${trendThemeList.length}/6${preview ? `：${preview}${names.length > 3 ? '等' : ''}` : ''}`;
        };

        const collectMatrixTrendThemeRawCandidates = ({ bucket = {}, sceneSettings = {} } = {}) => {
            const directField = 'campaign.trendThemeList';
            const directFieldKey = normalizeMatrixSceneFieldKey(directField);
            const labelFieldKey = normalizeMatrixSceneFieldKey('趋势主题');
            const selectLabelFieldKey = normalizeMatrixSceneFieldKey('选择趋势主题');
            return uniqueBy(
                [
                    bucket?.[directField],
                    directFieldKey ? bucket?.[directFieldKey] : '',
                    bucket?.[labelFieldKey],
                    bucket?.[selectLabelFieldKey],
                    bucket?.['趋势主题'],
                    bucket?.['选择趋势主题'],
                    sceneSettings?.[directField],
                    directFieldKey ? sceneSettings?.[directFieldKey] : '',
                    sceneSettings?.[labelFieldKey],
                    sceneSettings?.[selectLabelFieldKey],
                    sceneSettings?.['趋势主题'],
                    sceneSettings?.['选择趋势主题']
                ]
                    .map(item => serializeMatrixTrendThemeRawValue(item))
                    .filter(Boolean),
                item => item
            );
        };

        const getMatrixTrendThemeOptionValues = ({ bucket = {}, sceneSettings = {} } = {}) => {
            const optionValues = collectMatrixTrendThemeRawCandidates({ bucket, sceneSettings })
                .map(value => ({
                    value,
                    label: describeMatrixTrendThemeRawValue(value)
                }));
            if (!optionValues.some(item => item.value === '[]')) {
                optionValues.push({
                    value: '[]',
                    label: '清空趋势主题'
                });
            }
            return optionValues;
        };

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

        const getMatrixSceneScopedFallbackLabels = (sceneName = '', marketingGoal = '') => {
            const normalizedSceneName = getMatrixSceneName(sceneName);
            if (!normalizedSceneName) return [];
            const sceneConfig = MATRIX_SCENE_DIMENSION_FALLBACK_LABELS[normalizedSceneName];
            if (Array.isArray(sceneConfig)) return sceneConfig;
            if (!isPlainObject(sceneConfig)) return [];
            const normalizedGoal = normalizeMatrixGoalCandidateLabel(marketingGoal)
                || (normalizedSceneName === '关键词推广' ? '自定义推广' : '');
            const matchedGoalKey = Object.keys(sceneConfig).find(key => (
                key !== '__default'
                && key !== 'default'
                && normalizeMatrixGoalCandidateLabel(key) === normalizedGoal
            ));
            const scopedLabels = matchedGoalKey && Array.isArray(sceneConfig[matchedGoalKey])
                ? sceneConfig[matchedGoalKey]
                : [];
            const defaultLabels = Array.isArray(sceneConfig.__default)
                ? sceneConfig.__default
                : (Array.isArray(sceneConfig.default) ? sceneConfig.default : []);
            return uniqueBy(
                [].concat(scopedLabels.length ? scopedLabels : defaultLabels)
                    .map(item => normalizeMatrixSceneFieldLabel(item))
                    .filter(Boolean),
                item => normalizeMatrixSceneFieldToken(item)
            );
        };

        const resolveMatrixSceneActiveMarketingGoal = ({
            sceneName = '',
            bucket = {},
            sceneSettings = {}
        } = {}) => {
            const normalizedSceneName = getMatrixSceneName(sceneName);
            if (!normalizedSceneName) return '';
            const activeGoalFromMatrixUi = (() => {
                const row = wizardState?.els?.matrixGoalRow;
                if (!(row instanceof HTMLElement)) return '';
                const activeButton = row.querySelector('[data-matrix-goal-option].active');
                if (!(activeButton instanceof HTMLElement)) return '';
                return normalizeMatrixGoalCandidateLabel(
                    activeButton.getAttribute('data-matrix-goal-value')
                    || activeButton.textContent
                    || ''
                );
            })();
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
            return normalizeMatrixGoalCandidateLabel(
                activeGoalFromMatrixUi
                || bucket?.[goalFieldKey]
                || goalAliasKeys.map(key => bucket?.[key]).find(Boolean)
                || sceneSettings?.营销目标
                || sceneSettings?.选择卡位方案
                || sceneSettings?.选择拉新方案
                || sceneSettings?.选择方案
                || sceneSettings?.选择优化方向
                || sceneSettings?.选择解决方案
                || sceneSettings?.投放策略
                || sceneSettings?.推广模式
                || ''
            );
        };

        const shouldHideMatrixKeywordGoalField = (fieldLabel = '', sceneName = '', marketingGoal = '') => {
            if (getMatrixSceneName(sceneName) !== '关键词推广') return false;
            const normalizedGoal = normalizeMatrixGoalCandidateLabel(marketingGoal) || '自定义推广';
            const token = normalizeMatrixSceneFieldToken(fieldLabel);
            if (!token) return false;
            if (normalizedGoal !== '搜索卡位' && token === '卡位方式') return true;
            if (['趋势明星', '流量金卡', '自定义推广'].includes(normalizedGoal) && token === '匹配方式') return true;
            return false;
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
            if (/(选择趋势主题|趋势主题|趋势主题列表)/.test(token)) return 'trendTheme';
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
            return !!token && /(?:预算|出价|目标|方式|匹配|流量|冷启|投放|地域|计划组|选品|人群|创意|套餐包|线索|场景|趋势|主题)/.test(token);
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
            if (isMatrixTrendThemeFieldLabel(normalizedFieldLabel)) {
                return collectMatrixTrendThemeRawCandidates({ bucket, sceneSettings })[0] || '';
            }
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
            const goalSelectorLabelRe = /^(营销目标|选择卡位方案|选择拉新方案|选择方案|选择优化方向|选择解决方案|投放策略|推广模式)$/;
            const activeMarketingGoal = resolveMatrixSceneActiveMarketingGoal({
                sceneName: normalizedSceneName,
                bucket,
                sceneSettings
            });
            const preferredFieldLabels = getMatrixSceneScopedFallbackLabels(normalizedSceneName, activeMarketingGoal);
            const preferredFieldTokenSet = new Set(
                preferredFieldLabels
                    .map(item => normalizeMatrixSceneFieldToken(item))
                    .filter(Boolean)
            );
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
                    .concat(preferredFieldLabels)
                    .concat(activeGoalFieldLabels)
                    .concat(profile?.requiredFields || [])
                    .concat(metaFieldLabels)
                    .concat(Object.keys(bucket || {}))
                    .concat(Object.keys(sceneSettings || {}))
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
                if (shouldHideMatrixKeywordGoalField(normalizedFieldLabel, normalizedSceneName, activeMarketingGoal)) return false;
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
                if (isMatrixKeywordTrendThemeField(normalizedSceneName, activeMarketingGoal, normalizedFieldLabel)) return true;
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
            const isTrendThemePreset = isMatrixTrendThemeFieldLabel(normalizedFieldLabel);
            const rawOptionValues = isTrendThemePreset
                ? getMatrixTrendThemeOptionValues({ bucket, sceneSettings })
                : (
                    typeof resolveSceneFieldOptions === 'function'
                        ? resolveSceneFieldOptions(profile, normalizedFieldLabel)
                        : getMatrixSceneFallbackOptionValues(normalizedSceneName, normalizedFieldLabel)
                );
            const optionList = uniqueBy(
                (Array.isArray(rawOptionValues) ? rawOptionValues : [])
                    .map((item) => {
                        if (isPlainObject(item)) {
                            const value = normalizeMatrixSceneFieldValue(item.value || '');
                            if (!value) return null;
                            const label = normalizeMatrixSceneFieldValue(item.label || item.value || '');
                            return {
                                value,
                                label: label || value
                            };
                        }
                        const value = normalizeMatrixSceneFieldValue(item);
                        return value || null;
                    })
                    .filter(Boolean),
                item => (isPlainObject(item) ? item.value : item)
            ).slice(0, 24);
            const currentValue = getMatrixSceneCurrentFieldValue({
                fieldLabel: normalizedFieldLabel,
                fieldKey,
                bucket,
                sceneSettings,
                profile,
                optionList
            });
            const shouldUseMultiSelect = isTrendThemePreset || (optionList.length >= 2 && (
                MATRIX_SCENE_STRICT_OPTION_TYPE_SET.has(optionType)
                || optionList.every(item => isMatrixLikelySceneOptionValue(isPlainObject(item) ? item.value : item))
            ));
            const suggestedValues = uniqueBy(
                (isTrendThemePreset
                    ? [currentValue]
                    : [
                        currentValue,
                        profile?.fieldMeta?.[fieldKey]?.defaultValue
                    ]
                ).map(item => normalizeSceneSettingValue(item)).filter(Boolean),
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
                if (isTrendThemePreset) return '先在编辑页选择趋势主题，再在这里按组合复用或清空';
                if (currentValue) return `例如 ${currentValue}`;
                if (/预算|成本|投产比|目标值|数量|出价/.test(normalizedFieldLabel)) {
                    return `请输入${normalizedFieldLabel}`;
                }
                return `填写${normalizedFieldLabel}，每行一个值`;
            })();
            return {
                key: bindingKey,
                label: isTrendThemePreset ? '选择趋势主题' : normalizedFieldLabel,
                hint: isTrendThemePreset
                    ? '场景字段“选择趋势主题”，按组合切换当前编辑页已选趋势主题集合。'
                    : (shouldUseMultiSelect
                    ? `场景字段“${normalizedFieldLabel}”，按组合切换已选项。`
                    : `场景字段“${normalizedFieldLabel}”，支持按组合写入该字段。`),
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
            const isTrendThemePreset = isMatrixTrendThemeFieldLabel(preset?.label || preset?.key || '');
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
                        label: isTrendThemePreset
                            ? `${describeMatrixTrendThemeRawValue(value)}（当前值）`
                            : (preset.key === 'material_id' ? `${value} ｜ 当前值` : `${value}（当前值）`)
                    });
                    existingValues.add(value);
                }
            });
            return uniqueBy(optionList, item => item.value);
        };

        const formatMatrixDimensionDisplayValue = (value = '', preset = null) => {
            const normalizedValue = String(value || '').trim();
            if (!normalizedValue) return '';
            if (isMatrixTrendThemeFieldLabel(preset?.label || preset?.key || '')) {
                return describeMatrixTrendThemeRawValue(normalizedValue);
            }
            return normalizedValue;
        };

        const buildMatrixDimensionPreviewText = (values = [], options = {}) => {
            const normalizedValues = normalizeMatrixDimensionValues(values || []);
            const previewLimit = Math.max(1, Math.min(6, toNumber(options?.previewLimit, 3) || 3));
            const previewValues = normalizedValues
                .slice(0, previewLimit)
                .map(item => formatMatrixDimensionDisplayValue(item, options?.preset || null))
                .filter(Boolean);
            if (!previewValues.length) {
                return String(options?.emptyText || '未填写值').trim() || '未填写值';
            }
            return `${previewValues.join(' / ')}${normalizedValues.length > previewValues.length ? ' / ...' : ''}`;
        };

        const buildMatrixDimensionPickerSummaryText = (values = [], options = {}) => {
            const normalizedValues = normalizeMatrixDimensionValues(values || []);
            if (!normalizedValues.length) return '点击选择';
            return `已选 ${normalizedValues.length} 项：${buildMatrixDimensionPreviewText(normalizedValues, {
                previewLimit: 2,
                emptyText: '点击选择',
                preset: options?.preset || null
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
                const key = String(row.querySelector('[data-matrix-dimension-key="1"]')?.value || '').trim();
                const preset = getMatrixDimensionPresetByKey(key, wizardState?.draft?.sceneName || '');
                pickerLabel.textContent = buildMatrixDimensionPickerSummaryText(selectedValues, { preset });
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

        const getMatrixActiveGoalScenePresetKeys = (sceneName = '') => {
            const normalizedSceneName = getMatrixSceneName(sceneName);
            if (!normalizedSceneName) return [];
            const availablePresetKeys = new Set(
                getMatrixDimensionPresetCatalog(normalizedSceneName).map(item => item.key)
            );
            const sceneSettings = typeof buildSceneSettingsPayload === 'function'
                ? buildSceneSettingsPayload(normalizedSceneName)
                : {};
            const bucket = typeof ensureSceneSettingBucket === 'function'
                ? ensureSceneSettingBucket(normalizedSceneName)
                : {};
            const activeMarketingGoal = resolveMatrixSceneActiveMarketingGoal({
                sceneName: normalizedSceneName,
                bucket,
                sceneSettings
            });
            return getMatrixSceneScopedFallbackLabels(normalizedSceneName, activeMarketingGoal)
                .map(fieldLabel => buildMatrixSceneDimensionPreset(fieldLabel, normalizedSceneName))
                .filter(item => item && isMatrixSceneFieldBindingKey(item.key || '') && availablePresetKeys.has(item.key))
                .map(item => item.key);
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
                    ...getMatrixActiveGoalScenePresetKeys(sceneName),
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
            const normalizedSceneName = getMatrixSceneName(sceneName);
            if (!normalizedSceneName) return [];
            const sceneSettings = typeof buildSceneSettingsPayload === 'function'
                ? buildSceneSettingsPayload(normalizedSceneName)
                : {};
            const bucket = typeof ensureSceneSettingBucket === 'function'
                ? ensureSceneSettingBucket(normalizedSceneName)
                : {};
            const activeMarketingGoal = resolveMatrixSceneActiveMarketingGoal({
                sceneName: normalizedSceneName,
                bucket,
                sceneSettings
            });
            const preferredScenePresets = getMatrixSceneScopedFallbackLabels(normalizedSceneName, activeMarketingGoal)
                .map(fieldLabel => buildMatrixSceneDimensionPreset(fieldLabel, normalizedSceneName))
                .filter(Boolean);
            const catalog = uniqueBy(
                preferredScenePresets.concat(getMatrixDimensionPresetCatalog(normalizedSceneName)),
                item => item.key
            );
            if (!catalog.length) return [];
            const presetMap = new Map(catalog.map(item => [item.key, item]));
            const preferredSceneFieldKeys = preferredScenePresets
                .filter(item => isMatrixSceneFieldBindingKey(item?.key || ''))
                .map(item => item.key);
            const sceneFieldKeys = catalog
                .filter(item => isMatrixSceneFieldBindingKey(item?.key || ''))
                .map(item => item.key)
                .slice(0, 6);
            return uniqueBy(
                [
                    ...getMatrixRecommendedPresetKeys(normalizedSceneName),
                    ...preferredSceneFieldKeys,
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
