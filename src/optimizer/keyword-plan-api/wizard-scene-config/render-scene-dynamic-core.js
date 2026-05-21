            const renderSceneDynamicConfig = () => {
                if (!wizardState.els.sceneDynamic) return;
                const sceneName = String(wizardState.els.sceneSelect?.value || wizardState.draft?.sceneName || '关键词推广').trim();
                const profile = getSceneProfile(sceneName);
                const metaFieldLabels = isPlainObject(profile?.fieldMeta)
                    ? Object.keys(profile.fieldMeta)
                        .map(key => normalizeText(profile.fieldMeta[key]?.label || '').replace(/[：:]/g, '').trim())
                        .filter(Boolean)
                    : [];
                const GOAL_SELECTOR_LABEL_RE = /^(营销目标|选择卡位方案|选择拉新方案|选择方案|选择优化方向|选择解决方案|投放策略|推广模式|选择方式|卡位方式)$/;
                const isGoalSelectorField = (label = '') => {
                    const token = normalizeSceneLabelToken(label);
                    if (sceneName === '关键词推广' && token === '卡位方式') return false;
                    return GOAL_SELECTOR_LABEL_RE.test(token);
                };
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
                    return uniqueBy(labels, item => normalizeSceneLabelToken(item));
                };
                const baseSceneFields = dedupeSceneFieldLabelsForRender(
                    (profile.requiredFields || [])
                        .concat(metaFieldLabels)
                        .filter(Boolean)
                        .filter(item => shouldRenderDynamicSceneField(item, sceneName))
                ).slice(0, 320);
                const bucket = ensureSceneSettingBucket(sceneName);
                const touchedBucket = ensureSceneTouchedBucket(sceneName);
                const goalFieldKey = normalizeSceneFieldKey('营销目标');
                const goalAliasKeys = [
                    normalizeSceneFieldKey('选择卡位方案'),
                    normalizeSceneFieldKey('选择拉新方案'),
                    normalizeSceneFieldKey('选择方案'),
                    normalizeSceneFieldKey('选择优化方向'),
                    normalizeSceneFieldKey('选择解决方案'),
                    normalizeSceneFieldKey('投放策略'),
                    normalizeSceneFieldKey('推广模式'),
                    normalizeSceneFieldKey('选择方式'),
                    normalizeSceneFieldKey('卡位方式')
                ].filter(Boolean);
                const goalOptions = uniqueBy(
                    resolveSceneFieldOptions(profile, '营销目标')
                        .concat(getSceneMarketingGoalFallbackList(sceneName))
                        .map(item => normalizeGoalCandidateLabel(item))
                        .filter(Boolean),
                    item => item
                ).slice(0, 24);
                const goalFromBucket = normalizeGoalCandidateLabel(
                    bucket[goalFieldKey]
                    || goalAliasKeys.map(key => bucket[key]).find(Boolean)
                    || ''
                );
                const goalFallback = normalizeGoalCandidateLabel(
                    SCENE_SPEC_FIELD_FALLBACK?.[sceneName]?.营销目标
                    || ''
                );
                const activeMarketingGoal = goalFromBucket || goalOptions[0] || goalFallback || '';
                if (activeMarketingGoal) {
                    bucket[goalFieldKey] = activeMarketingGoal;
                }
                const keywordGoalRuntime = sceneName === '关键词推广'
                    ? resolveKeywordGoalRuntimeFallback(activeMarketingGoal)
                    : {};
                const syncGoalRuntimeBucket = (label = '', nextValue = '') => {
                    const key = normalizeSceneFieldKey(label);
                    const value = String(nextValue || '').trim();
                    if (!key || !value) return;
                    if (touchedBucket[key]) return;
                    bucket[key] = value;
                };
                const isLaunchPeriodAllDay = (rawValue = '') => {
                    const list = parseScenePopupJsonArray(rawValue, []);
                    if (!list.length) return false;
                    return list.every(item => {
                        const spanList = Array.isArray(item?.timeSpanList) ? item.timeSpanList : [];
                        return spanList.length === 1 && String(spanList[0]?.time || '').trim() === '00:00-24:00';
                    });
                };
                if (sceneName === '关键词推广' && activeMarketingGoal) {
                    syncGoalRuntimeBucket('campaign.promotionScene', keywordGoalRuntime.promotionScene || '');
                    syncGoalRuntimeBucket('campaign.itemSelectedMode', keywordGoalRuntime.itemSelectedMode || '');
                }
                const sceneGoalSpecs = getSceneCachedGoalSpecs(sceneName);
                const fallbackGoalRows = getSceneGoalFieldRowFallback(sceneName, activeMarketingGoal);
                const fallbackGoalFieldLabels = dedupeSceneFieldLabelsForRender(
                    fallbackGoalRows
                        .map(row => normalizeText(row?.label || '').replace(/[：:]/g, '').trim())
                        .filter(Boolean)
                );
                fallbackGoalRows.forEach(row => {
                    const key = normalizeSceneFieldKey(normalizeSceneRenderFieldLabel(row?.label || ''));
                    if (!key || touchedBucket[key]) return;
                    if (normalizeSceneSettingValue(bucket[key]) !== '') return;
                    const defaultValue = normalizeSceneSettingValue(row?.defaultValue || '');
                    if (!defaultValue) return;
                    bucket[key] = defaultValue;
                });
                const allGoalFieldLabels = dedupeSceneFieldLabelsForRender(
                    sceneGoalSpecs.flatMap(goal => collectGoalFieldLabels(goal)).concat(fallbackGoalFieldLabels)
                );
                const matchedGoalSpec = sceneGoalSpecs.find(goal => (
                    normalizeGoalCandidateLabel(goal?.goalLabel || '') === activeMarketingGoal
                )) || sceneGoalSpecs.find(goal => goal?.isDefault) || sceneGoalSpecs[0] || null;
                const activeGoalFieldLabels = dedupeSceneFieldLabelsForRender(
                    collectGoalFieldLabels(matchedGoalSpec).concat(fallbackGoalFieldLabels)
                );
                const extraSceneFields = sceneName === '货品全站推广'
                    ? ['目标投产比', '发布日期', '计划组']
                    : [];
                const allSceneFields = dedupeSceneFieldLabelsForRender(
                    baseSceneFields.concat(
                        activeGoalFieldLabels.filter(label => {
                            if (!label || isGoalSelectorField(label)) return false;
                            const token = normalizeSceneLabelToken(label);
                            if (!token || SCENE_SECTION_ONLY_LABEL_RE.test(token)) return false;
                            if (SCENE_LABEL_NOISE_RE.test(token)) return false;
                            return true;
                        }),
                        extraSceneFields
                    )
                ).slice(0, 360);
                const isLabelInGoalFieldSet = (label = '', set = []) => (
                    Array.isArray(set) && set.some(item => isSceneLabelMatch(label, item))
                );
                const staticFieldTokenSet = new Set(
                    [
                        '营销目标',
                        '营销场景',
                        '场景名称',
                        '计划名称',
                        '计划名',
                        '预算值',
                        '每日预算',
                        '日均预算',
                        '总预算'
                    ].map(item => normalizeSceneRenderFieldToken(item)).filter(Boolean)
                );
                if (sceneName === '关键词推广') {
                    [
                        '出价方式',
                        '出价目标',
                        '预算类型',
                        '关键词模式',
                        '默认关键词出价',
                        '推荐词目标数',
                        '平均直接成交成本',
                        '手动关键词',
                        '选品方式',
                        '选择推广商品',
                        '冷启加速',
                        '开启冷启加速',
                        '流量智选',
                        'AI点睛',
                        '人群设置',
                        '创意设置',
                        '投放时间',
                        '投放地域'
                    ].forEach(item => staticFieldTokenSet.add(normalizeSceneRenderFieldToken(item)));
                    const activeKeywordGoalForRender = detectKeywordGoalFromText(activeMarketingGoal || '');
                    if (['趋势明星', '流量金卡'].includes(activeKeywordGoalForRender)) {
                        [
                            '核心词设置',
                            '关键词设置',
                            '匹配方式',
                            '关键词匹配方式',
                            '默认匹配方式',
                            '流量智选'
                        ].forEach(item => staticFieldTokenSet.add(normalizeSceneRenderFieldToken(item)));
                    }
                    if (activeKeywordGoalForRender === '趋势明星') {
                        [
                            '趋势主题',
                            '选择趋势主题',
                            '趋势主题列表'
                        ].forEach(item => staticFieldTokenSet.add(normalizeSceneRenderFieldToken(item)));
                    }
                    if (activeKeywordGoalForRender !== '搜索卡位') {
                        [
                            '卡位方式',
                            '选择卡位方案'
                        ].forEach(item => staticFieldTokenSet.add(normalizeSceneRenderFieldToken(item)));
                    }
                }
                if (sceneName === '货品全站推广') {
                    [
                        '出价方式',
                        '出价目标',
                        '预算类型',
                        '专属权益',
                        '优质计划防停投',
                        '智能创意',
                        '投放调优',
                        '优化目标',
                        '多目标预算',
                        '一键起量预算',
                        '投放时间',
                        '投放地域',
                        '地域设置',
                        '起量时间地域设置'
                    ]
                        .forEach(item => staticFieldTokenSet.add(normalizeSceneRenderFieldToken(item)));
                }
                if (sceneName === '人群推广' && activeMarketingGoal === '自定义推广') {
                    [
                        '选择推广商品',
                        '选品方式',
                        '添加商品',
                        '出价方式',
                        '出价目标',
                        '选择方式',
                        '人群设置',
                        '过滤人群',
                        '设置过滤人群',
                        '优质计划防停投',
                        '资源位溢价',
                        '投放地域/投放时间',
                        '设置人群',
                        '设置拉新人群',
                        '种子人群',
                        '投放资源位/投放地域/分时折扣',
                        '投放资源位/投放地域/投放时间',
                        '投放资源位',
                        '投放日期',
                        '投放时间',
                        '投放地域',
                        '分时折扣',
                        '高级设置'
                    ].forEach(item => staticFieldTokenSet.add(normalizeSceneRenderFieldToken(item)));
                }
                const liveBidTypeValue = normalizeSceneSettingValue(
                    wizardState.els.sceneDynamic?.querySelector('input[data-scene-field="出价方式"]')?.value || ''
                );
                const fullSiteBidType = normalizeSceneSettingValue(
                    bucket[normalizeSceneFieldKey('出价方式')]
                    || liveBidTypeValue
                    || SCENE_SPEC_FIELD_FALLBACK?.['货品全站推广']?.出价方式
                    || ''
                );
                const isFullSiteMaxAmount = sceneName === '货品全站推广' && /最大化拿量/.test(fullSiteBidType);
                const hiddenKeywordFieldTokenSet = new Set(
                    [
                        'campaign.promotionScene',
                        'campaign.itemSelectedMode',
                        'campaign.trendThemeList'
                    ].map(item => normalizeSceneRenderFieldToken(item)).filter(Boolean)
                );
                let fields = allSceneFields.filter((fieldLabel) => {
                    if (isGoalSelectorField(fieldLabel)) return false;
                    if (!isSceneFieldConnectedToPayload(fieldLabel)) return false;
                    const fieldToken = normalizeSceneRenderFieldToken(fieldLabel);
                    if (sceneName === '关键词推广' && hiddenKeywordFieldTokenSet.has(fieldToken)) return false;
                    if (isFullSiteMaxAmount && /^(目标投产比|ROI目标值|出价目标值|约束值)$/.test(fieldToken)) return false;
                    if (staticFieldTokenSet.has(fieldToken)) return false;
                    if (
                        sceneName === '货品全站推广'
                        && /^(目标投产比|发布日期|计划组)$/.test(fieldToken)
                    ) {
                        return true;
                    }
                    if (!allGoalFieldLabels.length || !activeGoalFieldLabels.length) return true;
                    if (!isLabelInGoalFieldSet(fieldLabel, allGoalFieldLabels)) return true;
                    return isLabelInGoalFieldSet(fieldLabel, activeGoalFieldLabels);
                });
                if (sceneName === '货品全站推广') {
                    const moveFieldAfter = (list = [], targetLabel = '', anchorLabel = '') => {
                        const targetToken = normalizeSceneRenderFieldToken(targetLabel);
                        const anchorToken = normalizeSceneRenderFieldToken(anchorLabel);
                        if (!targetToken || !anchorToken || targetToken === anchorToken) return list;
                        const targetIndex = list.findIndex(item => normalizeSceneRenderFieldToken(item) === targetToken);
                        const anchorIndex = list.findIndex(item => normalizeSceneRenderFieldToken(item) === anchorToken);
                        if (targetIndex < 0 || anchorIndex < 0) return list;
                        const next = list.slice();
                        const [targetField] = next.splice(targetIndex, 1);
                        const currentAnchorIndex = next.findIndex(item => normalizeSceneRenderFieldToken(item) === anchorToken);
                        const insertIndex = currentAnchorIndex >= 0 ? currentAnchorIndex + 1 : next.length;
                        next.splice(insertIndex, 0, targetField);
                        return next;
                    };
                    fields = moveFieldAfter(fields, '目标投产比', '出价目标');
                }
                const autoFilledCount = autoFillSceneDefaults({
                    sceneName,
                    profile,
                    fields,
                    bucket
                });
                if (autoFilledCount > 0) {
                    KeywordPlanWizardStore.persistDraft();
                    appendWizardLog(`场景默认设置已加载 ${autoFilledCount} 项（${sceneName}）`, 'success');
                }
                const filledCount = Object.keys(bucket || {})
                    .filter(key => normalizeSceneSettingValue(bucket[key]) !== '')
                    .length;

                const buildProxySelectRow = (label, targetId, selectEl, rowOptions = {}) => {
                    if (!(selectEl instanceof HTMLSelectElement)) return '';
                    const segmented = rowOptions.segmented !== false;
                    const resolveBadgeText = typeof rowOptions.resolveBadgeText === 'function'
                        ? rowOptions.resolveBadgeText
                        : (() => '');
                    const resolveOptionText = typeof rowOptions.resolveOptionText === 'function'
                        ? rowOptions.resolveOptionText
                        : ({ text }) => text;
                    const inlineControlHtml = String(rowOptions.inlineControlHtml || '').trim();
                    const allowedValues = Array.isArray(rowOptions.allowedValues)
                        ? new Set(rowOptions.allowedValues.map(item => String(item || '').trim()).filter(Boolean))
                        : null;
                    const optionList = Array.from(selectEl.options || []).filter(option => {
                        if (!(allowedValues instanceof Set) || !allowedValues.size) return true;
                        return allowedValues.has(String(option?.value || '').trim());
                    });
                    const safeOptionList = optionList.length ? optionList : Array.from(selectEl.options || []);
                    let selectedValue = String(selectEl.value || '');
                    if (!safeOptionList.some(option => String(option?.value || '') === selectedValue)) {
                        const fallbackValue = String(safeOptionList[0]?.value || '');
                        const shouldEnforceSelection = rowOptions.enforceFilteredSelection !== false;
                        if (shouldEnforceSelection && fallbackValue && selectedValue !== fallbackValue && !selectEl.disabled) {
                            selectEl.value = fallbackValue;
                            selectedValue = fallbackValue;
                        }
                    }
                    const optionHtml = safeOptionList.map(option => {
                        const value = String(option?.value || '');
                        const sourceText = String(option?.textContent || option?.label || value);
                        const text = String(resolveOptionText({ value, text: sourceText, label }) || sourceText);
                        const badgeText = String(resolveBadgeText({ value, text, label }) || '').trim();
                        const textHtml = Utils.escapeHtml(text);
                        const badgeHtml = badgeText ? `<span class="am-wxt-option-badge">${Utils.escapeHtml(badgeText)}</span>` : '';
                        return `
                            <button
                                type="button"
                                class="am-wxt-option-chip ${value === selectedValue ? 'active' : ''}"
                                data-proxy-select-target="${Utils.escapeHtml(targetId)}"
                                data-proxy-select-value="${Utils.escapeHtml(value)}"
                                ${selectEl.disabled ? 'disabled' : ''}
                            >${textHtml}${badgeHtml}</button>
                        `;
                    }).join('');
                    const controlClass = `am-wxt-setting-control${inlineControlHtml ? ' am-wxt-setting-control-pair' : ''}`;
                    return `
                        <div class="am-wxt-scene-setting-row">
                            <div class="am-wxt-scene-setting-label">${Utils.escapeHtml(label)}</div>
                            <div class="${controlClass}">
                                <div class="am-wxt-option-line${segmented ? ' segmented' : ''}">${optionHtml}</div>
                                ${inlineControlHtml}
                            </div>
                        </div>
                    `;
                };

                const buildGoalSelectorRow = (goalLabel, options = [], selectedValue = '', rowOptions = {}) => {
                    const key = normalizeSceneFieldKey(goalLabel || '营销目标');
                    const segmented = rowOptions.segmented !== false;
                    const optionList = uniqueBy(
                        (Array.isArray(options) ? options : [])
                            .concat([selectedValue])
                            .map(item => normalizeGoalCandidateLabel(item))
                            .filter(Boolean),
                        item => item
                    ).slice(0, 24);
                    if (!optionList.length) return '';
                    const safeValue = optionList.includes(selectedValue) ? selectedValue : optionList[0];
                    const optionHtml = optionList.map(opt => `
                        <button
                            type="button"
                            class="am-wxt-option-chip ${opt === safeValue ? 'active' : ''}"
                            data-scene-option="1"
                            data-scene-option-field="${Utils.escapeHtml(key)}"
                            data-scene-option-value="${Utils.escapeHtml(opt)}"
                        >${Utils.escapeHtml(opt)}</button>
                    `).join('');
                    return `
                        <div class="am-wxt-scene-setting-row">
                            <div class="am-wxt-scene-setting-label">${Utils.escapeHtml(goalLabel || '营销目标')}</div>
                            <div class="am-wxt-setting-control">
                                <div class="am-wxt-option-line${segmented ? ' segmented' : ''}">${optionHtml}</div>
                                <input class="am-wxt-hidden-control" data-scene-field="${Utils.escapeHtml(key)}" value="${Utils.escapeHtml(safeValue)}" />
                            </div>
                        </div>
                    `;
                };

                const buildSceneOptionRow = (label, fieldKey, options = [], selectedValue = '', rowOptions = {}) => {
                    const segmented = rowOptions.segmented !== false;
                    const inlineControlHtml = String(rowOptions.inlineControlHtml || '').trim();
                    const optionList = uniqueBy(
                        (Array.isArray(options) ? options : [])
                            .concat([selectedValue])
                            .map(item => normalizeSceneSettingValue(item))
                            .filter(Boolean),
                        item => item
                    ).slice(0, 24);
                    if (!optionList.length) return '';
                    const safeValue = optionList.find(opt => isSceneOptionMatch(opt, selectedValue)) || optionList[0];
                    const optionHtml = optionList.map(opt => `
                        <button
                            type="button"
                            class="am-wxt-option-chip ${isSceneOptionMatch(opt, safeValue) ? 'active' : ''}"
                            data-scene-option="1"
                            data-scene-option-field="${Utils.escapeHtml(fieldKey)}"
                            data-scene-option-value="${Utils.escapeHtml(opt)}"
                        >${Utils.escapeHtml(opt)}</button>
                    `).join('');
                    const controlClass = `am-wxt-setting-control${inlineControlHtml ? ' am-wxt-setting-control-pair' : ''}`;
                    return `
                        <div class="am-wxt-scene-setting-row">
                            <div class="am-wxt-scene-setting-label">${Utils.escapeHtml(label)}</div>
                            <div class="${controlClass}">
                                <div class="am-wxt-option-line${segmented ? ' segmented' : ''}">${optionHtml}</div>
                                <input class="am-wxt-hidden-control" data-scene-field="${Utils.escapeHtml(fieldKey)}" value="${Utils.escapeHtml(safeValue)}" />
                                ${inlineControlHtml}
                            </div>
                        </div>
                    `;
                };

                const buildKeywordAiMaxSwitchRow = ({
                    fieldKey = '',
                    selectedValue = '',
                    switchValue = '',
                    infoRaw = ''
                } = {}) => {
                    const label = 'AI点睛';
                    const helpText = '借助AI点睛开“搜索外挂”，智能识别您表达的搜索流量诉求，精准触达目标客群，有效提升精准流量比例';
                    const optionList = ['开启', '关闭'];
                    const safeValue = optionList.find(opt => isSceneOptionMatch(opt, selectedValue)) || optionList[0];
                    const optionHtml = optionList.map(opt => `
                        <button
                            type="button"
                            class="am-wxt-option-chip ${isSceneOptionMatch(opt, safeValue) ? 'active' : ''}"
                            data-scene-option="1"
                            data-scene-option-field="${Utils.escapeHtml(fieldKey)}"
                            data-scene-option-value="${Utils.escapeHtml(opt)}"
                        >${Utils.escapeHtml(opt)}</button>
                    `).join('');
                    return `
                        <div class="am-wxt-scene-setting-row am-wxt-ai-max-switch-row">
                            <div class="am-wxt-scene-setting-label am-wxt-ai-max-switch-label">
                                <span>${Utils.escapeHtml(label)}</span>
                                <span class="am-wxt-ai-max-help-icon" title="${Utils.escapeHtml(helpText)}">?</span>
                            </div>
                            <div class="am-wxt-setting-control am-wxt-ai-max-switch-control">
                                <div class="am-wxt-option-line segmented">${optionHtml}</div>
                                <span class="am-wxt-ai-max-switch-desc">${Utils.escapeHtml(helpText)}</span>
                                <a
                                    class="am-wxt-ai-max-doc-link"
                                    href="https://alidocs.dingtalk.com/i/nodes/N7dx2rn0JbxOaqnACQ5kRDGvWMGjLRb3"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >介绍文档</a>
                                <input class="am-wxt-hidden-control" data-scene-field="${Utils.escapeHtml(fieldKey)}" value="${Utils.escapeHtml(safeValue)}" />
                                <input class="am-wxt-hidden-control" data-scene-field="campaign.aiMaxSwitch" value="${Utils.escapeHtml(switchValue)}" />
                                <input class="am-wxt-hidden-control" data-scene-field="campaign.aiMaxInfo" value="${Utils.escapeHtml(infoRaw)}" />
                            </div>
                        </div>
                    `;
                };

                const KEYWORD_AI_MAX_DEFAULT_PROMPT = '快速积累精准成交流量。如投放叶子类目成交词，与商品卖点精准匹配的搜索词，与商品历史成交人群相似的人群';
                const KEYWORD_AI_MAX_TEMPLATE_LIST = [
                    {
                        title: '提升商品质量分',
                        text: '快速积累精准成交流量。如投放叶子类目成交词，与商品卖点精准匹配的搜索词，与商品历史成交人群相似的人群'
                    },
                    {
                        title: '核心流量竞争',
                        text: '渗透核心竞品流量，放大流量规模。如投放同叶子类目排名相近商品的搜索词，商品叶子类目感兴趣人群'
                    },
                    {
                        title: '热门流量追踪',
                        text: '实时投放商品相关的热门流量，如商品属性相关的行业热搜词；并提前投放趋势流量'
                    },
                    {
                        title: '低成本稳增长',
                        text: '触达高点击率、低点击成本的流量。如商品历史成交词，同叶子类目高点击率词或搜索量和竞争力适中的长尾词'
                    },
                    {
                        title: '爆品拉新破圈',
                        text: '触达经常同展现商品的点击词和竞店兴趣潜客；触达关联品类人群和叶子类目的新客'
                    },
                    {
                        title: '新品快速测款',
                        text: '快速积累精准的点击流量。如与商品卖点相关性好的高搜索量词、浏览或点击过相似商品的消费者、店铺专有词'
                    }
                ];
                const normalizeKeywordAiMaxItemTitle = (item = {}) => normalizeSceneSettingValue(
                    item?.materialName
                    || item?.itemTitle
                    || item?.title
                    || item?.name
                    || item?.itemName
                    || ''
                );
                const resolveKeywordAiMaxPrimaryItem = () => {
                    const sourceList = []
                        .concat(Array.isArray(wizardState?.addedItems) ? wizardState.addedItems : [])
                        .concat(Array.isArray(wizardState?.draft?.addedItems) ? wizardState.draft.addedItems : [])
                        .filter(item => item && typeof item === 'object');
                    const hit = sourceList.find(item => {
                        const itemId = String(toIdValue(item?.materialId || item?.itemId || item?.id || '') || '').trim();
                        return !!itemId || !!normalizeKeywordAiMaxItemTitle(item);
                    });
                    return hit || null;
                };
                const normalizeKeywordAiMaxWordList = (value = [], limit = 100) => (
                    uniqueBy(
                        (Array.isArray(value) ? value : String(value || '').split(/[,，\n]/))
                            .map(item => normalizeSceneSettingValue(item))
                            .filter(Boolean),
                        item => item
                    ).slice(0, limit)
                );
                const normalizeKeywordAiMaxInfo = (rawSource = '', enabled = true, itemContext = {}) => {
                    let parsed = {};
                    if (rawSource && typeof rawSource === 'string') {
                        try {
                            parsed = JSON.parse(rawSource);
                        } catch { }
                    } else if (isPlainObject(rawSource)) {
                        parsed = deepClone(rawSource);
                    }
                    if (!isPlainObject(parsed)) parsed = {};
                    const parsedItemId = normalizeSceneSettingValue(parsed.itemId || parsed.materialId || '');
                    const contextItemId = normalizeSceneSettingValue(toIdValue(itemContext?.materialId || itemContext?.itemId || itemContext?.id || '') || '');
                    const itemChanged = !!(contextItemId && parsedItemId && parsedItemId !== contextItemId);
                    if (itemChanged || (parsedItemId && !parsed.nativeGenerated && !parsed.nativeSource)) {
                        parsed = {};
                    }
                    const blockWordConfig = isPlainObject(parsed.blockWordConfig) ? parsed.blockWordConfig : {};
                    const demandList = normalizeKeywordAiMaxWordList(
                        parsed.demandList || [],
                        20
                    );
                    const hasSelectedDemandList = Object.prototype.hasOwnProperty.call(parsed, 'selectedDemandList')
                        && Array.isArray(parsed.selectedDemandList);
                    const selectedDemandList = normalizeKeywordAiMaxWordList(
                        hasSelectedDemandList ? parsed.selectedDemandList : demandList,
                        20
                    )
                        .filter(item => demandList.includes(item));
                    return {
                        ...parsed,
                        itemId: contextItemId || parsedItemId,
                        aiMaxSwitch: enabled ? 1 : 0,
                        trafficAppeal: normalizeSceneSettingValue(parsed.trafficAppeal || parsed.prompt || parsed.userInput || KEYWORD_AI_MAX_DEFAULT_PROMPT),
                        demandList,
                        selectedDemandList: hasSelectedDemandList ? selectedDemandList : demandList,
                        centerShieldWordList: normalizeKeywordAiMaxWordList(
                            parsed.centerShieldWordList || blockWordConfig.centerShieldWordList || blockWordConfig.centerWordList || [],
                            10
                        ),
                        exactShieldWordList: normalizeKeywordAiMaxWordList(
                            parsed.exactShieldWordList || blockWordConfig.exactShieldWordList || blockWordConfig.exactWordList || [],
                            100
                        ),
                        searchWordList: normalizeKeywordAiMaxWordList(
                            parsed.searchWordList || [],
                            20
                        ),
                        personaList: Array.isArray(parsed.personaList) && parsed.personaList.length
                            ? parsed.personaList.filter(item => isPlainObject(item)).slice(0, 6)
                            : [],
                        analysis: normalizeSceneSettingValue(parsed.analysis || ''),
                        itemTitle: normalizeSceneSettingValue(parsed.itemTitle || normalizeKeywordAiMaxItemTitle(itemContext || {})),
                        budgetSuggestion: isPlainObject(parsed.budgetSuggestion) ? parsed.budgetSuggestion : {}
                    };
                };
                const serializeKeywordAiMaxInfo = (info = {}, enabled = true) => JSON.stringify({
                    itemId: normalizeSceneSettingValue(info.itemId || ''),
                    aiMaxSwitch: enabled ? 1 : 0,
                    trafficAppeal: normalizeSceneSettingValue(info.trafficAppeal || KEYWORD_AI_MAX_DEFAULT_PROMPT),
                    nativeGenerated: !!info.nativeGenerated,
                    nativeSource: normalizeSceneSettingValue(info.nativeSource || ''),
                    nativeTraceId: normalizeSceneSettingValue(info.nativeTraceId || ''),
                    selectedDemandList: normalizeKeywordAiMaxWordList(info.selectedDemandList || [], 20),
                    demandList: normalizeKeywordAiMaxWordList(info.demandList || [], 20),
                    centerShieldWordList: normalizeKeywordAiMaxWordList(info.centerShieldWordList || [], 10),
                    exactShieldWordList: normalizeKeywordAiMaxWordList(info.exactShieldWordList || [], 100),
                    searchWordList: normalizeKeywordAiMaxWordList(info.searchWordList || [], 20),
                    personaList: Array.isArray(info.personaList) && info.personaList.length
                        ? info.personaList.filter(item => isPlainObject(item)).slice(0, 6)
                        : [],
                    analysis: normalizeSceneSettingValue(info.analysis || ''),
                    aiMaxReason: normalizeSceneSettingValue(info.aiMaxReason || ''),
                    aiMaxDeliveryPlan: normalizeSceneSettingValue(info.aiMaxDeliveryPlan || ''),
                    itemTitle: normalizeSceneSettingValue(info.itemTitle || ''),
                    budgetSuggestion: isPlainObject(info.budgetSuggestion) ? info.budgetSuggestion : {},
                    nativeCrowdList: Array.isArray(info.nativeCrowdList) ? info.nativeCrowdList.slice(0, 20) : []
                });
                const getKeywordAiMaxGenerationKey = (item = {}) => {
                    const itemId = normalizeSceneSettingValue(toIdValue(item?.materialId || item?.itemId || item?.id || '') || '');
                    return itemId || normalizeKeywordAiMaxItemTitle(item || {});
                };
                const getKeywordAiMaxGenerationMap = () => {
                    if (!isPlainObject(wizardState.keywordAiMaxGenerationMap)) {
                        wizardState.keywordAiMaxGenerationMap = {};
                    }
                    return wizardState.keywordAiMaxGenerationMap;
                };
                const KEYWORD_AI_MAX_ERROR_RETRY_COOLDOWN_MS = 5000;
                const ensureKeywordAiMaxGeneration = (item = {}) => {
                    const generationKey = getKeywordAiMaxGenerationKey(item);
                    const itemId = normalizeSceneSettingValue(toIdValue(item?.materialId || item?.itemId || item?.id || '') || '');
                    if (!generationKey || !itemId) return null;
                    const generationMap = getKeywordAiMaxGenerationMap();
                    const current = generationMap[generationKey];
                    if (current?.status === 'pending' || current?.status === 'ready') return current;
                    if (
                        current?.status === 'error'
                        && Date.now() - toNumber(current.finishedAt, 0) < KEYWORD_AI_MAX_ERROR_RETRY_COOLDOWN_MS
                    ) {
                        return current;
                    }
                    const pending = {
                        status: 'pending',
                        itemId,
                        itemTitle: normalizeKeywordAiMaxItemTitle(item),
                        startedAt: Date.now()
                    };
                    generationMap[generationKey] = pending;
                    Promise.resolve()
                        .then(() => fetchKeywordAiMaxInfo({
                            bizCode: 'onebpSearch',
                            item
                        }))
                        .then((info) => {
                            generationMap[generationKey] = {
                                status: 'ready',
                                itemId,
                                itemTitle: normalizeKeywordAiMaxItemTitle(item),
                                info,
                                finishedAt: Date.now()
                            };
                            renderSceneDynamicConfig();
                        })
                        .catch((err) => {
                            generationMap[generationKey] = {
                                status: 'error',
                                itemId,
                                itemTitle: normalizeKeywordAiMaxItemTitle(item),
                                message: normalizeSceneSettingValue(err?.message || err || 'AI点睛生成失败'),
                                finishedAt: Date.now()
                            };
                            renderSceneDynamicConfig();
                        });
                    return pending;
                };
                const describeKeywordAiMaxInfo = (info = {}) => {
                    const selectedCount = Array.isArray(info.selectedDemandList) ? info.selectedDemandList.length : 0;
                    const shieldCount = (Array.isArray(info.centerShieldWordList) ? info.centerShieldWordList.length : 0)
                        + (Array.isArray(info.exactShieldWordList) ? info.exactShieldWordList.length : 0);
                    return `已选：${selectedCount || 0}个需求｜屏蔽词 ${shieldCount}`;
                };
                const parseKeywordAiMaxJsonList = (rawValue = '') => {
                    if (Array.isArray(rawValue)) return rawValue;
                    const text = normalizeSceneSettingValue(rawValue || '');
                    if (!text) return [];
                    try {
                        const parsed = JSON.parse(text);
                        return Array.isArray(parsed) ? parsed : [];
                    } catch {
                        return [];
                    }
                };
                const resolveKeywordAiMaxDemandDetail = (info = {}, demandTitle = '') => {
                    const title = normalizeSceneSettingValue(demandTitle || '');
                    const crowdList = Array.isArray(info.nativeCrowdList) ? info.nativeCrowdList : [];
                    const matched = crowdList.find(entry => {
                        const crowd = isPlainObject(entry?.crowd) ? entry.crowd : {};
                        const name = normalizeSceneSettingValue(
                            crowd.crowdName
                            || crowd.label?.optionList?.[0]?.optionName
                            || ''
                        );
                        return title && name === title;
                    }) || crowdList[0] || {};
                    const properties = isPlainObject(matched?.crowd?.properties) ? matched.crowd.properties : {};
                    const searchWordList = parseKeywordAiMaxJsonList(properties.searchWordList)
                        .map(word => normalizeSceneSettingValue(word?.name || word?.word || word || ''))
                        .filter(Boolean);
                    const personaList = parseKeywordAiMaxJsonList(properties.crowdProfileList)
                        .map(profile => ({
                            title: normalizeSceneSettingValue(profile?.name || profile?.title || ''),
                            desc: normalizeSceneSettingValue(profile?.desc || profile?.description || '')
                        }))
                        .filter(profile => profile.title || profile.desc);
                    return {
                        analysis: normalizeSceneSettingValue(properties.description || info.analysis || info.aiMaxReason || ''),
                        searchWordList: searchWordList.length ? searchWordList : (Array.isArray(info.searchWordList) ? info.searchWordList : []),
                        personaList: personaList.length ? personaList : (Array.isArray(info.personaList) ? info.personaList : [])
                    };
                };
                const buildKeywordAiMaxInsightPanelRow = ({
                    infoRaw = '',
                    info = {},
                    infoField = '',
                    popupTrigger = 'keywordAiMaxSetting'
                } = {}) => {
                    const normalizedInfoField = normalizeSceneSettingValue(infoField);
                    if (!normalizedInfoField) return '';
                    const demandList = Array.isArray(info.selectedDemandList) && info.selectedDemandList.length
                        ? info.selectedDemandList
                        : [];
                    if (!info.nativeGenerated && !info.nativeSource) {
                        return buildKeywordAiMaxPendingPanelRow({
                            infoRaw,
                            infoField,
                            message: 'AI点睛正在按原生接口生成投放内容，请稍候...'
                        });
                    }
                    if (!demandList.length && !normalizeSceneSettingValue(info.analysis || info.aiMaxReason || '')) {
                        return buildKeywordAiMaxPendingPanelRow({
                            infoRaw,
                            infoField,
                            message: 'AI点睛原生接口暂未返回可展示内容，请稍候重试。'
                        });
                    }
                    const renderSearchWordHtml = (wordList = []) => (Array.isArray(wordList) ? wordList : []).slice(0, 6).map((word, index) => `
                        <span class="am-wxt-ai-max-word word-${(index % 3) + 1}">${Utils.escapeHtml(word)}</span>
                    `).join('');
                    const renderPersonaHtml = (list = []) => (Array.isArray(list) ? list : []).slice(0, 3).map(item => `
                        <div class="am-wxt-ai-max-persona">
                            <span class="am-wxt-ai-max-persona-icon">P</span>
                            <span>
                                <b>${Utils.escapeHtml(normalizeSceneSettingValue(item?.title || item?.name || '搜索人群'))}</b>
                                <em>${Utils.escapeHtml(normalizeSceneSettingValue(item?.desc || item?.description || ''))}</em>
                            </span>
                        </div>
                    `).join('');
                    const firstDemandDetail = resolveKeywordAiMaxDemandDetail(info, demandList[0]);
                    const demandCards = demandList.map((title, index) => `
                        <button
                            type="button"
                            class="am-wxt-ai-max-demand-card ${index === 0 ? 'active' : ''}"
                            data-ai-max-demand-preview="${Utils.escapeHtml(title)}"
                            data-ai-max-demand-analysis="${Utils.escapeHtml(resolveKeywordAiMaxDemandDetail(info, title).analysis || '')}"
                            data-ai-max-demand-search-words="${Utils.escapeHtml(JSON.stringify(resolveKeywordAiMaxDemandDetail(info, title).searchWordList || []))}"
                            data-ai-max-demand-personas="${Utils.escapeHtml(JSON.stringify(resolveKeywordAiMaxDemandDetail(info, title).personaList || []))}"
                        >
                            <span class="am-wxt-ai-max-demand-icon">*</span>
                            <span class="am-wxt-ai-max-demand-main">
                                <b>${Utils.escapeHtml(title)}</b>
                                <em>"${Utils.escapeHtml(info.itemTitle || '已选商品标题')}"</em>
                            </span>
                        </button>
                    `).join('');
                    const demandNextButton = demandList.length > 3 ? `
                        <button
                            type="button"
                            class="am-wxt-ai-max-demand-next"
                            data-ai-max-demand-next="1"
                            aria-label="查看更多AI点睛需求"
                        >›</button>
                    ` : '';
                    const searchWordHtml = renderSearchWordHtml(firstDemandDetail.searchWordList);
                    const personaHtml = renderPersonaHtml(firstDemandDetail.personaList);
                    const budgetSuggestion = isPlainObject(info.budgetSuggestion) ? info.budgetSuggestion : {};
                    const budgetAmount = normalizeSceneSettingValue(budgetSuggestion.amount || '');
                    const clickEstimate = normalizeSceneSettingValue(budgetSuggestion.clickEstimate || '');
                    const reasonText = normalizeSceneSettingValue(info.aiMaxReason || info.aiMaxDeliveryPlan || info.trafficAppeal || '');
                    const analysisText = normalizeSceneSettingValue(firstDemandDetail.analysis || info.analysis || info.aiMaxReason || '');
                    const demandTitleText = demandList.slice(0, 5).join('、');
                    const searchWordText = firstDemandDetail.searchWordList.slice(0, 4).join('、');
                    const personaText = firstDemandDetail.personaList.slice(0, 3)
                        .map(item => normalizeSceneSettingValue(item?.title || item?.name || ''))
                        .filter(Boolean)
                        .join('、');
                    const aiMaxDeepSteps = [
                        {
                            title: '第1步：计划定向画像分析',
                            desc: `基于${info.itemTitle || '当前商品'}的标题、历史成交和投放目标，识别可承接的高意向搜索人群。`
                        },
                        {
                            title: '第2步：关键词深度分析',
                            desc: searchWordText
                                ? `围绕${searchWordText}等热门搜索词扩展搜索意图，优先承接强相关需求。`
                                : '围绕商品核心卖点和成交词扩展搜索意图，优先承接强相关需求。'
                        },
                        {
                            title: '第3步：流入流失竞对分析',
                            desc: '结合类目搜索竞争和成交相似路径，过滤低相关流量，提升精准转化比例。'
                        },
                        {
                            title: '第4步：同行定向画像分析',
                            desc: personaText
                                ? `参考${personaText}等人群画像，匹配更接近成交链路的搜索客群。`
                                : '参考同行成交相似人群画像，匹配更接近成交链路的搜索客群。'
                        },
                        {
                            title: '第5步：搜索需求分析',
                            desc: demandTitleText
                                ? `已生成${demandList.length}个搜索需求：${demandTitleText}，用于后续精准投放。`
                                : '已结合商品卖点生成搜索需求，用于后续精准投放。'
                        }
                    ];
                    const aiMaxDeepStepHtml = aiMaxDeepSteps.map((step, index) => `
                        <div class="am-wxt-ai-max-deep-step" data-ai-max-deep-step="${index + 1}">
                            <div class="am-wxt-ai-max-deep-step-main">
                                <span
                                    class="am-wxt-ai-max-deep-step-title"
                                    data-ai-max-typewriter="1"
                                    data-ai-max-typewriter-text="${Utils.escapeHtml(step.title)}"
                                >${Utils.escapeHtml(step.title)}</span>
                                <div
                                    class="am-wxt-ai-max-deep-step-desc hidden"
                                    data-ai-max-step-detail="1"
                                    data-ai-max-typewriter-text="${Utils.escapeHtml(step.desc)}"
                                >${Utils.escapeHtml(step.desc)}</div>
                            </div>
                            <button type="button" class="am-wxt-ai-max-step-btn" data-ai-max-step-toggle="1">展开详情</button>
                        </div>
                    `).join('');
                    return `
                        <div class="am-wxt-scene-setting-row am-wxt-ai-max-setting-row">
                            <div class="am-wxt-scene-setting-label">AI点睛设置</div>
                            <div class="am-wxt-setting-control">
                                <section class="am-wxt-ai-max-panel" data-ai-max-panel="1">
                                    <input
                                        class="am-wxt-hidden-control"
                                        data-scene-field="${Utils.escapeHtml(normalizedInfoField)}"
                                        data-scene-popup-field="${Utils.escapeHtml(popupTrigger)}"
                                        value="${Utils.escapeHtml(infoRaw)}"
                                    />
                                    <div class="am-wxt-ai-max-head">
                                        <span>深度解析主要销量商品的标题和历史成交数据，为你生成以下投放内容</span>
                                        <button type="button" class="am-wxt-ai-max-link" data-scene-popup-trigger="${Utils.escapeHtml(popupTrigger)}">表达更多流量诉求</button>
                                    </div>
                                    <div class="am-wxt-ai-max-status">
                                        <span class="am-wxt-ai-max-status-title">
                                            <span class="am-wxt-ai-max-status-icon">✓</span>
                                            <span>已完成深度搜索</span>
                                        </span>
                                        <button
                                            type="button"
                                            class="am-wxt-ai-max-detail-btn"
                                            data-ai-max-detail-toggle="1"
                                        >展开详情</button>
                                    </div>
                                    <div class="am-wxt-ai-max-deep-detail hidden" data-ai-max-detail-section="deep">
                                        <div class="am-wxt-ai-max-deep-box">
                                            ${aiMaxDeepStepHtml}
                                        </div>
                                    </div>
                                    <div class="am-wxt-ai-max-copy-row">
                                        ${reasonText ? `<div class="am-wxt-ai-max-copy">${Utils.escapeHtml(reasonText)}</div>` : '<div></div>'}
                                        <button
                                            type="button"
                                            class="am-wxt-ai-max-demand-summary"
                                            data-scene-popup-summary="${Utils.escapeHtml(popupTrigger)}"
                                            data-ai-max-demand-selector-trigger="1"
                                            data-ai-max-info-field="${Utils.escapeHtml(normalizedInfoField)}"
                                        >
                                            <span>已选：</span>
                                            <b>${Utils.escapeHtml(`${(Array.isArray(info.selectedDemandList) ? info.selectedDemandList.length : 0) || 0}个需求`)}</b>
                                        </button>
                                    </div>
                                    <div class="am-wxt-ai-max-demand-list-wrap">
                                        <div class="am-wxt-ai-max-demand-list" data-ai-max-demand-list="1">${demandCards}</div>
                                        ${demandNextButton}
                                    </div>
                                    <div class="am-wxt-ai-max-analysis" data-ai-max-analysis-target="1">${analysisText ? `<b>AI解析：</b>${Utils.escapeHtml(analysisText)}` : ''}</div>
                                    ${budgetAmount || clickEstimate ? `
                                        <div class="am-wxt-ai-max-budget">
                                            <b>AI小万建议</b>
                                            <span>${clickEstimate ? `预计可获得点击量 ${Utils.escapeHtml(clickEstimate)} 次` : '已生成预算建议'}${budgetAmount ? `，建议日均预算 ${Utils.escapeHtml(budgetAmount)} 元` : ''}</span>
                                        </div>
                                    ` : ''}
                                    <div class="am-wxt-ai-max-detail-grid" data-ai-max-demand-detail-grid="1">
                                        ${searchWordHtml ? `<div class="am-wxt-ai-max-word-cloud">
                                            <b>热门搜索词</b>
                                            <div data-ai-max-word-target="1">${searchWordHtml}</div>
                                        </div>` : ''}
                                        ${personaHtml ? `<div class="am-wxt-ai-max-persona-list">
                                            <b>搜索人群画像与特征</b>
                                            <div data-ai-max-persona-target="1">${personaHtml}</div>
                                        </div>` : ''}
                                    </div>
                                </section>
                            </div>
                        </div>
                    `;
                };

                const buildKeywordAiMaxPendingPanelRow = ({
                    infoRaw = '',
                    infoField = '',
                    message = '添加商品后可生成 AI 点睛投放内容和预算建议',
                    status = 'pending'
                } = {}) => {
                    const normalizedInfoField = normalizeSceneSettingValue(infoField);
                    if (!normalizedInfoField) return '';
                    const panelStatus = normalizeSceneSettingValue(status || 'pending');
                    return `
                        <div class="am-wxt-scene-setting-row am-wxt-ai-max-setting-row">
                            <div class="am-wxt-scene-setting-label">AI点睛设置</div>
                            <div class="am-wxt-setting-control">
                                <section class="am-wxt-ai-max-panel am-wxt-ai-max-panel-pending" data-ai-max-panel="${Utils.escapeHtml(panelStatus)}">
                                    <input
                                        class="am-wxt-hidden-control"
                                        data-scene-field="${Utils.escapeHtml(normalizedInfoField)}"
                                        data-scene-popup-field="keywordAiMaxSetting"
                                        value="${Utils.escapeHtml(infoRaw || '')}"
                                    />
                                    <div class="am-wxt-ai-max-status">
                                        <span>${Utils.escapeHtml(message || '添加商品后可生成 AI 点睛投放内容和预算建议')}</span>
                                    </div>
                                </section>
                            </div>
                        </div>
                    `;
                };

                const buildKeywordCustomKeywordSettingRow = ({
                    fieldKey = '',
                    enabled = true,
                    manualKeywordCount = 0,
                    recommendCount = ''
                } = {}) => {
                    const normalizedFieldKey = normalizeSceneSettingValue(fieldKey);
                    if (!normalizedFieldKey) return '';
                    const fieldValue = enabled ? '查看和添加关键词' : '关闭';
                    const safeManualCount = Math.max(0, toNumber(manualKeywordCount, 0));
                    const safeRecommendCount = normalizeSceneSettingValue(recommendCount || '');
                    const summary = `已设置：开启流量智选，关键词组合 1 个、自选词 ${safeManualCount} 个${safeRecommendCount ? `、推荐词目标 ${safeRecommendCount} 个` : ''}`;
                    return `
                        <div class="am-wxt-scene-setting-row">
                            <div class="am-wxt-scene-setting-label">关键词设置</div>
                            <div class="am-wxt-setting-control am-wxt-keyword-setting-control">
                                <input class="am-wxt-hidden-control" data-scene-field="${Utils.escapeHtml(normalizedFieldKey)}" value="${Utils.escapeHtml(fieldValue)}" />
                                <label class="am-wxt-smart-crowd-check">
                                    <input
                                        type="checkbox"
                                        data-scene-crowd-priority-toggle="1"
                                        data-scene-crowd-priority-field="${Utils.escapeHtml(normalizedFieldKey)}"
                                        data-scene-crowd-priority-on="查看和添加关键词"
                                        data-scene-crowd-priority-off="关闭"
                                        ${enabled ? 'checked' : ''}
                                    />
                                    <span
                                        data-keyword-setting-open-manual="1"
                                        data-keyword-setting-open-manual-field="${Utils.escapeHtml(normalizedFieldKey)}"
                                    >查看和添加关键词</span>
                                </label>
                                <div class="am-wxt-smart-crowd-desc">${Utils.escapeHtml(summary)}</div>
                            </div>
                        </div>
                    `;
                };

                const buildKeywordSmartCrowdPriorityRow = ({
                    label = '人群设置',
                    fieldKey = '',
                    enabled = false,
                    onValue = '设置优先投放客户',
                    offValue = '关闭',
                    helpText = '',
                    description = '支持对特定客户设置更高权重，进行优先获取。',
                    detailUrl = '',
                    detailLabel = '了解详情'
                } = {}) => {
                    const normalizedFieldKey = normalizeSceneSettingValue(fieldKey);
                    if (!normalizedFieldKey) return '';
                    const normalizedLabel = normalizeSceneSettingValue(label) || '人群设置';
                    const normalizedOnValue = normalizeSceneSettingValue(onValue) || '设置优先投放客户';
                    const normalizedOffValue = normalizeSceneSettingValue(offValue) || '关闭';
                    const normalizedHelpText = normalizeSceneSettingValue(helpText);
                    const normalizedDescription = normalizeSceneSettingValue(description) || '支持对特定客户设置更高权重，进行优先获取。';
                    const normalizedDetailUrl = String(detailUrl || '').trim();
                    const normalizedDetailLabel = normalizeSceneSettingValue(detailLabel) || '了解详情';
                    const checked = !!enabled;
                    const fieldValue = checked ? normalizedOnValue : normalizedOffValue;
                    return `
                        <div class="am-wxt-scene-setting-row">
                            <div class="am-wxt-scene-setting-label">
                                <span class="am-wxt-scene-label-main">
                                    <span>${Utils.escapeHtml(normalizedLabel)}</span>
                                    ${normalizedHelpText
                                        ? `<span class="am-wxt-scene-label-help" title="${Utils.escapeHtml(normalizedHelpText)}" aria-label="${Utils.escapeHtml(normalizedHelpText)}">?</span>`
                                        : ''}
                                </span>
                            </div>
                            <div class="am-wxt-setting-control am-wxt-smart-crowd-control">
                                <input class="am-wxt-hidden-control" data-scene-field="${Utils.escapeHtml(normalizedFieldKey)}" value="${Utils.escapeHtml(fieldValue)}" />
                                <label class="am-wxt-smart-crowd-check">
                                    <input
                                        type="checkbox"
                                        data-scene-crowd-priority-toggle="1"
                                        data-scene-crowd-priority-field="${Utils.escapeHtml(normalizedFieldKey)}"
                                        data-scene-crowd-priority-on="${Utils.escapeHtml(normalizedOnValue)}"
                                        data-scene-crowd-priority-off="${Utils.escapeHtml(normalizedOffValue)}"
                                        ${checked ? 'checked' : ''}
                                    />
                                    <span>${Utils.escapeHtml(normalizedOnValue)}</span>
                                </label>
                                <div class="am-wxt-smart-crowd-desc">
                                    <span>${Utils.escapeHtml(normalizedDescription)}</span>
                                    ${normalizedDetailUrl
                                        ? `<a class="am-wxt-smart-crowd-link" href="${Utils.escapeHtml(normalizedDetailUrl)}" target="_blank" rel="noreferrer noopener">${Utils.escapeHtml(normalizedDetailLabel)}</a>`
                                        : ''}
                                </div>
                            </div>
                        </div>
                    `;
                };

                const KEYWORD_SMART_CROWD_TARGET_PRESETS = [
                    {
                        key: '1',
                        label: '新客户获取',
                        defaultOption: '365天无成交店铺潜客',
                        options: ['365天无成交店铺潜客', '近180天无成交店铺潜客', '365天店铺浅客'],
                        defaultDiscount: 1.1
                    },
                    {
                        key: '2',
                        label: '流失老客挽回',
                        defaultOption: '即将流失的老客',
                        options: ['即将流失的老客', '潜在流失老客', '周期沉默老客'],
                        defaultDiscount: 1.5
                    },
                    {
                        key: '3',
                        label: '高价值客户获取',
                        defaultOption: '行业高频购买和高消费力人群',
                        options: ['行业高频购买和高消费力人群', '天猫高品质人群', '家装品质焕新人群'],
                        defaultDiscount: 1.3
                    }
                ];

                const normalizeKeywordSmartCrowdTargetRows = (rawValue = '') => {
                    const list = parseScenePopupJsonArray(rawValue, [])
                        .filter(item => isPlainObject(item));
                    const matchPreset = (preset = {}, index = 0) => {
                        const directHit = list.find(item => String(item?.value || item?.id || '').trim() === String(preset.key || '').trim());
                        if (directHit) return directHit;
                        const byNameHit = list.find(item => {
                            const seed = [
                                item?.name,
                                item?.label,
                                item?.title,
                                item?.selectedLabelName,
                                item?.selectedLabelText
                            ].map(value => normalizeSceneSettingValue(value)).join(' ');
                            if (!seed) return false;
                            return seed.includes(preset.label)
                                || (preset.key === '1' && /(新客|潜客)/.test(seed))
                                || (preset.key === '2' && /(流失|老客)/.test(seed))
                                || (preset.key === '3' && /(高价值|高频|高消费)/.test(seed));
                        });
                        if (byNameHit) return byNameHit;
                        return list[index] || null;
                    };
                    return KEYWORD_SMART_CROWD_TARGET_PRESETS.map((preset, index) => {
                        const hit = matchPreset(preset, index);
                        const selectedLabel = normalizeSceneSettingValue(
                            hit?.selectedLabelName
                            || hit?.selectedLabelText
                            || hit?.labelName
                            || hit?.crowdName
                            || hit?.name
                            || hit?.label
                            || preset.defaultOption
                        ) || preset.defaultOption;
                        const discountSeed = [
                            hit?.discount,
                            hit?.weight,
                            hit?.priority,
                            hit?.rate
                        ].find(value => value !== undefined && value !== null && String(value).trim() !== '');
                        const discountNum = toNumber(discountSeed, NaN);
                        const discount = Number.isFinite(discountNum)
                            ? Math.min(99.9, Math.max(0.1, Math.round(discountNum * 10) / 10))
                            : preset.defaultDiscount;
                        const enabledSeed = [
                            hit?.enabled,
                            hit?.checked,
                            hit?.status,
                            hit?.switch
                        ].find(value => value !== undefined && value !== null && String(value).trim() !== '');
                        const enabled = enabledSeed === undefined
                            ? true
                            : !/^(0|false|off|关闭|否)$/i.test(String(enabledSeed).trim());
                        const selectedLabelId = normalizeSceneSettingValue(
                            hit?.selectedLabelId
                            || hit?.labelId
                            || hit?.crowdId
                            || hit?.id
                            || ''
                        );
                        const optionList = uniqueBy(
                            (preset.options || [])
                                .concat([selectedLabel])
                                .map(item => normalizeSceneSettingValue(item))
                                .filter(Boolean),
                            item => item
                        );
                        return {
                            key: preset.key,
                            label: preset.label,
                            selectedLabel,
                            selectedLabelId,
                            discount,
                            enabled,
                            optionList
                        };
                    });
                };

                const buildKeywordSmartCrowdTargetPanelRow = ({
                    targetFieldKey = '',
                    clientFieldKey = '',
                    valueFieldKey = '',
                    campaignFieldKey = '',
                    campaignRaw = '[]',
                    enabled = false
                } = {}) => {
                    const normalizedTargetFieldKey = normalizeSceneSettingValue(targetFieldKey);
                    const normalizedClientFieldKey = normalizeSceneSettingValue(clientFieldKey);
                    const normalizedValueFieldKey = normalizeSceneSettingValue(valueFieldKey);
                    const normalizedCampaignFieldKey = normalizeSceneSettingValue(campaignFieldKey);
                    if (!normalizedTargetFieldKey || !normalizedCampaignFieldKey) return '';
                    const rowList = normalizeKeywordSmartCrowdTargetRows(campaignRaw);
                    const isEnabled = !!enabled;
                    const statusValue = isEnabled ? '人群优化目标' : '关闭';
                    const rowHtml = rowList.map((row) => `
                        <div class="am-wxt-smart-crowd-target-row" data-keyword-smart-crowd-row="${Utils.escapeHtml(row.key)}">
                            <label class="am-wxt-smart-crowd-target-check">
                                <input
                                    type="checkbox"
                                    data-keyword-smart-crowd-enabled="${Utils.escapeHtml(row.key)}"
                                    ${row.enabled ? 'checked' : ''}
                                    ${isEnabled ? '' : 'disabled'}
                                />
                                <span>${Utils.escapeHtml(row.label)}</span>
                            </label>
                            <select
                                class="am-wxt-smart-crowd-target-select"
                                data-keyword-smart-crowd-label="${Utils.escapeHtml(row.key)}"
                                data-keyword-smart-crowd-label-id="${Utils.escapeHtml(row.selectedLabelId || '')}"
                                ${isEnabled ? '' : 'disabled'}
                            >
                                ${row.optionList.map(option => `
                                    <option value="${Utils.escapeHtml(option)}" ${option === row.selectedLabel ? 'selected' : ''}>${Utils.escapeHtml(option)}</option>
                                `).join('')}
                            </select>
                            <label class="am-wxt-smart-crowd-target-value">
                                <span>重要程度是一般客户的</span>
                                <input
                                    type="number"
                                    min="0.1"
                                    max="99.9"
                                    step="0.1"
                                    data-keyword-smart-crowd-discount="${Utils.escapeHtml(row.key)}"
                                    value="${Utils.escapeHtml(toShortSceneValue(String(row.discount)) || String(row.discount))}"
                                    ${isEnabled ? '' : 'disabled'}
                                />
                                <span>倍</span>
                            </label>
                        </div>
                    `).join('');
                    return `
                        <div class="am-wxt-scene-setting-row">
                            <div class="am-wxt-scene-setting-label">人群优化目标</div>
                            <div class="am-wxt-setting-control">
                                <div class="am-wxt-smart-crowd-target-panel" data-keyword-smart-crowd-panel="1">
                                    <div class="am-wxt-smart-crowd-target-head">
                                        <label class="am-wxt-smart-crowd-target-check">
                                            <input type="checkbox" data-keyword-smart-crowd-master="1" ${isEnabled ? 'checked' : ''} />
                                            <span>人群优化目标</span>
                                        </label>
                                        <span>客户口径设置</span>
                                        <span style="display:inline-flex;align-items:center;gap:8px;">人群价值设置<a class="am-wxt-smart-crowd-target-help" href="https://img.alicdn.com/imgextra/i3/O1CN01xFkkDL1OcYfFRtATG_!!6000000001726-0-tps-1328-1168.jpg" target="_blank" rel="noreferrer noopener">投放小妙招</a></span>
                                    </div>
                                    ${rowHtml}
                                    <input class="am-wxt-hidden-control" data-scene-field="${Utils.escapeHtml(normalizedTargetFieldKey)}" data-keyword-smart-crowd-target="1" value="${Utils.escapeHtml(statusValue)}" />
                                    ${normalizedClientFieldKey
                                        ? `<input class="am-wxt-hidden-control" data-scene-field="${Utils.escapeHtml(normalizedClientFieldKey)}" data-keyword-smart-crowd-client="1" value="${Utils.escapeHtml(statusValue)}" />`
                                        : ''}
                                    ${normalizedValueFieldKey
                                        ? `<input class="am-wxt-hidden-control" data-scene-field="${Utils.escapeHtml(normalizedValueFieldKey)}" data-keyword-smart-crowd-value="1" value="${Utils.escapeHtml(statusValue)}" />`
                                        : ''}
                                    <textarea class="am-wxt-hidden-control" data-scene-field="${Utils.escapeHtml(normalizedCampaignFieldKey)}" data-keyword-smart-crowd-campaign="1">${Utils.escapeHtml(campaignRaw || '[]')}</textarea>
                                </div>
                            </div>
                        </div>
                    `;
                };

                const buildSceneSwitchControl = (fieldKey, currentValue, onValue, offValue, switchOptions = {}) => {
                    const normalizedValue = normalizeSceneSettingValue(currentValue || '');
                    const normalizedOn = normalizeSceneSettingValue(onValue || '开');
                    const normalizedOff = normalizeSceneSettingValue(offValue || '关');
                    const onLabel = normalizeSceneSettingValue(switchOptions.onLabel || '开') || '开';
                    const offLabel = normalizeSceneSettingValue(switchOptions.offLabel || '关') || '关';
                    const isOn = isSceneOptionMatch(normalizedValue, normalizedOn);
                    const stateText = isOn ? onLabel : offLabel;
                    return `
                        <button
                            type="button"
                            class="am-wxt-site-switch ${isOn ? 'is-on' : 'is-off'}"
                            data-scene-switch-target="${Utils.escapeHtml(fieldKey)}"
                            data-scene-switch-on="${Utils.escapeHtml(normalizedOn)}"
                            data-scene-switch-off="${Utils.escapeHtml(normalizedOff)}"
                            data-scene-switch-on-label="${Utils.escapeHtml(onLabel)}"
                            data-scene-switch-off-label="${Utils.escapeHtml(offLabel)}"
                            aria-pressed="${isOn ? 'true' : 'false'}"
                        >
                            <span class="am-wxt-site-switch-handle"></span>
                            <span class="am-wxt-site-switch-state">${Utils.escapeHtml(stateText)}</span>
                        </button>
                    `;
                };

                const buildProxyInputRow = (label, targetId, value, placeholder = '') => `
                    <div class="am-wxt-scene-setting-row">
                        <div class="am-wxt-scene-setting-label">${Utils.escapeHtml(label)}</div>
                        <div class="am-wxt-setting-control">
                            <input
                                data-proxy-input-target="${Utils.escapeHtml(targetId)}"
                                value="${Utils.escapeHtml(value || '')}"
                                placeholder="${Utils.escapeHtml(placeholder || '')}"
                            />
                        </div>
                    </div>
                `;

                const buildInlineProxyInputControl = (label, targetId, value, placeholder = '') => `
                    <div class="am-wxt-scene-inline-input">
                        <span class="am-wxt-inline-label">${Utils.escapeHtml(label)}</span>
                        <input
                            data-proxy-input-target="${Utils.escapeHtml(targetId)}"
                            value="${Utils.escapeHtml(value || '')}"
                            placeholder="${Utils.escapeHtml(placeholder || '')}"
                        />
                    </div>
                `;

                const buildInlineSceneInputControl = (label, fieldKey, value, placeholder = '', options = {}) => {
                    const unit = normalizeSceneSettingValue(options?.unit || '');
                    const hideLabel = options?.hideLabel === true;
                    const labelHtml = hideLabel
                        ? ''
                        : `<span class="am-wxt-inline-label">${Utils.escapeHtml(label)}</span>`;
                    return `
                        <div class="am-wxt-scene-inline-input ${unit ? 'with-unit' : ''}">
                            ${labelHtml}
                            <span class="am-wxt-inline-input-wrap">
                                <input
                                    data-scene-field="${Utils.escapeHtml(fieldKey)}"
                                    value="${Utils.escapeHtml(value || '')}"
                                    placeholder="${Utils.escapeHtml(placeholder || '')}"
                                />
                                ${unit ? `<span class="am-wxt-inline-unit">${Utils.escapeHtml(unit)}</span>` : ''}
                            </span>
                        </div>
                    `;
                };

                const parseScenePopupJsonArray = (rawValue = '', fallback = []) => {
                    const parsed = tryParseMaybeJSON(rawValue);
                    if (!Array.isArray(parsed)) return Array.isArray(fallback) ? fallback : [];
                    return parsed.filter(item => item !== null && item !== undefined);
                };

                const describeLaunchPeriodSummary = (rawValue = '') => {
                    const list = parseScenePopupJsonArray(rawValue, []);
                    if (!list.length) return '使用默认全时段';
                    const allDay = list.every(item => {
                        const timeSpanList = Array.isArray(item?.timeSpanList) ? item.timeSpanList : [];
                        return timeSpanList.length === 1 && String(timeSpanList[0]?.time || '') === '00:00-24:00';
                    });
                    if (allDay) return '全时段 00:00-24:00';
                    return `已配置 ${list.length} 组时段`;
                };

                const describeLaunchAreaSummary = (rawValue = '') => {
                    const list = parseScenePopupJsonArray(rawValue, ['all'])
                        .map(item => String(item || '').trim())
                        .filter(Boolean);
                    if (!list.length || (list.length === 1 && list[0] === 'all')) return '全部地域';
                    return `已配置 ${list.length} 个地域`;
                };

                const isAdzoneStatusEnabled = (item = {}) => {
                    if (!isPlainObject(item)) return false;
                    const statusCandidate = [
                        item.status,
                        item.enabled,
                        item.state,
                        item.switch
                    ].find(value => value !== undefined && value !== null && String(value).trim() !== '');
                    if (statusCandidate === undefined) return true;
                    if (typeof statusCandidate === 'boolean') return statusCandidate;
                    const text = String(statusCandidate).trim().toLowerCase();
                    if (!text) return true;
                    if (['0', 'false', 'off', 'close', 'closed', '关', '关闭', '否', 'no'].includes(text)) return false;
                    return true;
                };

                const setAdzoneStatus = (item = {}, enabled = true) => {
                    const source = isPlainObject(item) ? deepClone(item) : {};
                    const boolEnabled = !!enabled;
                    if (hasOwn(source, 'status') || (!hasOwn(source, 'enabled') && !hasOwn(source, 'state') && !hasOwn(source, 'switch'))) {
                        source.status = boolEnabled ? '1' : '0';
                        return source;
                    }
                    if (hasOwn(source, 'enabled')) {
                        source.enabled = boolEnabled;
                    } else if (hasOwn(source, 'state')) {
                        source.state = boolEnabled ? 1 : 0;
                    } else if (hasOwn(source, 'switch')) {
                        source.switch = boolEnabled ? '1' : '0';
                    } else {
                        source.status = boolEnabled ? '1' : '0';
                    }
                    return source;
                };

                const describeAdzoneSummary = (rawValue = '') => {
                    const list = parseScenePopupJsonArray(rawValue, [])
                        .filter(item => isPlainObject(item));
                    if (!list.length) return '沿用默认资源位';
                    const enabledCount = list.filter(item => isAdzoneStatusEnabled(item)).length;
                    return `已开启 ${enabledCount}/${list.length} 个资源位`;
                };

                const describeCrowdSummary = (campaignRaw = '', adgroupRaw = '') => {
                    const campaignList = parseScenePopupJsonArray(campaignRaw, []);
                    const adgroupList = parseScenePopupJsonArray(adgroupRaw, []);
                    if (!campaignList.length && !adgroupList.length) return '未配置人群明细';
                    return `客户 ${campaignList.length} / 种子 ${adgroupList.length}`;
                };
                const getSceneCrowdTargetKey = (item = {}, index = 0) => normalizeSceneSettingValue(
                    item?.mx_crowdId
                    || getCrowdMxId(item?.crowd?.label || {})
                    || item?.crowd?.label?.labelId
                    || item?.crowd?.crowdId
                    || item?.crowdId
                    || item?.id
                    || ''
                ) || `crowd_target_${index + 1}`;
                const normalizeSceneCrowdTargetBid = (input = {}, fallback = 0.3) => {
                    const sourceValue = isPlainObject(input)
                        ? (
                            input?.price?.price
                            ?? input?.price?.value
                            ?? input?.crowd?.price
                            ?? input?.bid
                            ?? input?.bidPrice
                        )
                        : input;
                    const fallbackBid = Math.max(0.01, Math.min(999, Math.round(toNumber(fallback, 0.3) * 100) / 100));
                    const raw = toNumber(sourceValue, NaN);
                    if (!Number.isFinite(raw) || raw <= 0) return fallbackBid;
                    return Math.max(0.01, Math.min(999, Math.round(raw * 100) / 100));
                };
                const cloneSceneCrowdTargetWithBid = (item = {}, bid = 0.3) => {
                    const next = deepClone(item || {});
                    if (!isPlainObject(next.price)) next.price = {};
                    next.price.price = normalizeSceneCrowdTargetBid(
                        bid,
                        normalizeSceneCrowdTargetBid(next, 0.3)
                    );
                    return next;
                };
                const resolveSceneCrowdTargetBidSuggestion = (item = {}, bid = 0.3) => {
                    const suggestion = [
                        item?.fitBidPriceTips,
                        item?.crowd?.fitBidPriceTips,
                        item?.crowd?.label?.fitBidPriceTips,
                        item?.crowd?.label?.optionList?.[0]?.properties?.fitBidPriceTips,
                        item?.crowd?.label?.optionList?.[0]?.properties?.recommendRedirectReason
                    ]
                        .map(candidate => normalizeSceneSettingValue(candidate))
                        .find(Boolean);
                    if (suggestion && /建议|出价|元/.test(suggestion)) {
                        return suggestion;
                    }
                    const baseBid = normalizeSceneCrowdTargetBid(bid, 0.3);
                    const low = Math.max(0.01, Math.round(baseBid * 0.75 * 100) / 100).toFixed(2);
                    const high = Math.max(Number(low), Math.round(baseBid * 1.25 * 100) / 100).toFixed(2);
                    return `建议出价：${low} - ${high}元`;
                };
                const normalizeScenePopupItemIdList = (rawValue = '') => {
                    const normalizedInput = isPlainObject(rawValue) || Array.isArray(rawValue)
                        ? rawValue
                        : tryParseMaybeJSON(String(rawValue || '').trim());
                    const sourceList = Array.isArray(normalizedInput)
                        ? normalizedInput
                        : String(rawValue || '').split(/[\s,，]+/g);
                    return uniqueBy(
                        sourceList
                            .map((item) => {
                                if (isPlainObject(item)) {
                                    return String(
                                        toIdValue(item.materialId || item.itemId || item.id || '')
                                    ).trim();
                                }
                                return String(toIdValue(item)).trim();
                            })
                            .filter(item => /^\d{4,}$/.test(item)),
                        item => item
                    ).slice(0, WIZARD_MAX_ITEMS);
                };
                const describeCrowdItemSummary = (rawValue = '') => {
                    const itemIdList = normalizeScenePopupItemIdList(rawValue);
                    if (!itemIdList.length) return '未添加商品';
                    if (itemIdList.length === 1) return `已添加 1 个（${itemIdList[0]}）`;
                    return `已添加 ${itemIdList.length} 个（首个 ${itemIdList[0]}）`;
                };
                const normalizeTrendThemeIdValue = (value = '') => {
                    const normalized = String(toIdValue(value) || '').trim();
                    return normalized || '';
                };
                const normalizeTrendThemeNameValue = (item = {}, index = 0) => (
                    normalizeSceneSettingValue(
                        item?.trendThemeName
                        || item?.themeName
                        || item?.name
                        || item?.label
                        || item?.title
                        || item?.query
                        || item?.word
                        || ''
                    ) || `趋势主题${index + 1}`
                );
                const normalizeTrendThemeMetricValue = (value) => {
                    if (value === undefined || value === null || value === '') return undefined;
                    const num = Number(value);
                    if (Number.isFinite(num)) return num;
                    return normalizeSceneSettingValue(value);
                };
                const normalizeTrendThemeItem = (item = {}, index = 0) => {
                    const source = isPlainObject(item)
                        ? item
                        : { trendThemeName: normalizeSceneSettingValue(item) };
                    const trendThemeName = normalizeTrendThemeNameValue(source, index);
                    const trendThemeId = normalizeTrendThemeIdValue(
                        source.trendThemeId
                        ?? source.themeId
                        ?? source.id
                        ?? source.value
                        ?? source.themeIdStr
                        ?? ''
                    ) || trendThemeName;
                    if (!trendThemeId && !trendThemeName) return null;
                    const normalized = {
                        trendThemeId,
                        trendThemeName: trendThemeName || trendThemeId
                    };
                    [
                        'itemCount',
                        'recommendItemCount',
                        'trend',
                        'trendIndex',
                        'capacity',
                        'searchIndex',
                        'competition',
                        'competitionHeat',
                        'favCartIndex',
                        'collectCartIndex',
                        'wcvr',
                        'cvr',
                        'convertIndex',
                        'roi',
                        'roiIndex',
                        'capacityChangeRatio',
                        'trendChangeRatio',
                        'roiChangeRatio',
                        'cvrChangeRatio',
                        'wcvrChangeRatio',
                        'competitionChangeRatio',
                        'weekCapacityChangeRatio',
                        'weekTrendChangeRatio',
                        'weekRoiChangeRatio',
                        'weekCvrChangeRatio',
                        'weekWcvrChangeRatio',
                        'weekCompetitionChangeRatio'
                    ].forEach(key => {
                        const value = normalizeTrendThemeMetricValue(source[key]);
                        if (value !== undefined) normalized[key] = value;
                    });
                    if (isPlainObject(source.resourceType)) {
                        normalized.resourceType = Object.assign({}, source.resourceType);
                    }
                    if (isPlainObject(source.trendLv)) {
                        normalized.trendLv = Object.assign({}, source.trendLv);
                    }
                    const tagText = normalizeSceneSettingValue(
                        normalized.resourceType?.tagText
                        || normalized.resourceType?.operateText
                        || normalized.resourceType?.name
                        || normalized.trendLv?.tagText
                        || normalized.trendLv?.name
                        || source.tagText
                        || source.statusText
                        || ''
                    );
                    if (tagText) normalized.tagText = tagText;
                    return normalized;
                };
                const getTrendThemeKey = (item = {}, index = 0) => {
                    const trendThemeId = normalizeTrendThemeIdValue(item?.trendThemeId ?? item?.themeId ?? item?.id ?? '');
                    if (trendThemeId) return `id:${trendThemeId}`;
                    const trendThemeName = normalizeSceneSettingValue(item?.trendThemeName || item?.themeName || item?.name || '');
                    return trendThemeName ? `name:${trendThemeName}` : `idx:${index}`;
                };
                const uniqueTrendThemeList = (list = [], limit = 6) => uniqueBy(
                    (Array.isArray(list) ? list : [])
                        .map((item, index) => normalizeTrendThemeItem(item, index))
                        .filter(Boolean),
                    (item, index) => getTrendThemeKey(item, index)
                ).slice(0, Math.max(0, Number(limit) || 6));
                const normalizeTrendThemeList = (rawValue = '', limit = 6) => {
                    const parsed = Array.isArray(rawValue) || isPlainObject(rawValue)
                        ? rawValue
                        : tryParseMaybeJSON(String(rawValue || '').trim());
                    const sourceList = Array.isArray(parsed)
                        ? parsed
                        : parseScenePopupJsonArray(rawValue, []);
                    return uniqueTrendThemeList(sourceList, limit);
                };
                const serializeTrendThemeList = (list = []) => JSON.stringify(normalizeTrendThemeList(list, 6));
                const describeTrendThemeSummary = (rawValue = '') => {
                    const trendThemeList = normalizeTrendThemeList(rawValue, 6);
                    if (!trendThemeList.length) return '未选择主题';
                    const names = trendThemeList
                        .map(item => normalizeSceneSettingValue(item?.trendThemeName || item?.trendThemeId || ''))
                        .filter(Boolean);
                    const preview = names.slice(0, 3).join('、');
                    return `已选 ${trendThemeList.length}/6${preview ? `：${preview}${names.length > 3 ? '等' : ''}` : ''}`;
                };
                const collectTrendThemeResponseList = (response = {}) => {
                    const data = isPlainObject(response?.data) ? response.data : {};
                    const candidates = [
                        data.trendThemeInfo,
                        data.trendThemeList,
                        data.themeList,
                        data.list,
                        data.result,
                        response?.trendThemeInfo,
                        response?.trendThemeList,
                        response?.list
                    ];
                    const list = candidates.find(item => Array.isArray(item));
                    return Array.isArray(list) ? list : [];
                };
                const collectTrendThemeRankLists = (response = {}) => {
                    const data = isPlainObject(response?.data) ? response.data : {};
                    return {
                        trend: Array.isArray(data.trendThemeInfo) ? data.trendThemeInfo : [],
                        effect: Array.isArray(data.effectThemeInfo) ? data.effectThemeInfo : [],
                        traffic: Array.isArray(data.capacityThemeInfo) ? data.capacityThemeInfo : []
                    };
                };
                const fetchNativeTrendThemeBundle = async (bizCode = '') => {
                    const targetBizCode = normalizeSceneBizCode(bizCode || DEFAULTS.bizCode) || DEFAULTS.bizCode;
                    const output = {
                        defaultList: [],
                        candidateList: [],
                        trendRankList: [],
                        effectRankList: [],
                        trafficRankList: []
                    };
                    try {
                        const response = await requestOne('/trendtheme/recommendThemeDefault.json', targetBizCode, {
                            bizCode: targetBizCode
                        }, {});
                        output.defaultList = normalizeTrendThemeList(collectTrendThemeResponseList(response), 6);
                    } catch (err) {
                        log.warn('加载默认趋势主题失败:', err?.message || err);
                    }
                    try {
                        const response = await requestOne('/trendtheme/recommendTheme.json', targetBizCode, {
                            bizCode: targetBizCode
                        }, {});
                        const rankLists = collectTrendThemeRankLists(response);
                        output.trendRankList = normalizeTrendThemeList(rankLists.trend, 160);
                        output.effectRankList = normalizeTrendThemeList(rankLists.effect, 160);
                        output.trafficRankList = normalizeTrendThemeList(rankLists.traffic, 160);
                        output.candidateList = uniqueTrendThemeList(
                            output.trendRankList
                                .concat(output.effectRankList)
                                .concat(output.trafficRankList)
                                .concat(collectTrendThemeResponseList(response)),
                            160
                        );
                    } catch (err) {
                        log.warn('加载推荐趋势主题失败:', err?.message || err);
                    }
                    if (!output.trendRankList.length) output.trendRankList = output.candidateList;
                    if (!output.effectRankList.length) output.effectRankList = output.candidateList;
                    if (!output.trafficRankList.length) output.trafficRankList = output.candidateList;
                    output.candidateList = uniqueTrendThemeList(
                        output.defaultList.concat(output.candidateList),
                        160
                    );
                    return output;
                };
                const CROWD_FILTER_GENDER_OPTIONS = [
                    { value: 'female', label: '女性用户' },
                    { value: 'male', label: '男性用户' }
                ];
                const CROWD_FILTER_AGE_OPTIONS = [
                    { value: '18-24', label: '18-24岁' },
                    { value: '25-29', label: '25-29岁' },
                    { value: '30-34', label: '30-34岁' },
                    { value: '35-39', label: '35-39岁' },
                    { value: '40-49', label: '40-49岁' },
                    { value: '50+', label: '50岁以上' }
                ];
                const CROWD_FILTER_INTERACTIVE_OPTIONS = [
                    '浏览未购买人群',
                    '加购未购买人群',
                    '收藏未购买人群',
                    '领券未使用人群',
                    '频繁搜索人群'
                ];
                const normalizeCrowdFilterToken = (value = '') => String(value || '').trim();
                const normalizeCrowdFilterFlatList = (input = []) => uniqueBy(
                    (Array.isArray(input) ? input : [])
                        .map(item => normalizeCrowdFilterToken(item))
                        .filter(Boolean),
                    item => item
                );
                const normalizeCrowdFilterConfig = (rawValue = '') => {
                    const parsed = isPlainObject(rawValue)
                        ? rawValue
                        : tryParseMaybeJSON(String(rawValue || '').trim());
                    const source = isPlainObject(parsed) ? parsed : {};
                    const allowedGenderSet = new Set(CROWD_FILTER_GENDER_OPTIONS.map(item => item.value));
                    const allowedAgeSet = new Set(CROWD_FILTER_AGE_OPTIONS.map(item => item.value));
                    const normalizeGenderList = (list = []) => {
                        const normalized = normalizeCrowdFilterFlatList(list)
                            .map(item => {
                                const token = item.toLowerCase();
                                if (token === 'all' || token === '不限') return 'all';
                                if (/(female|女)/.test(token)) return 'female';
                                if (/(male|男)/.test(token)) return 'male';
                                return '';
                            })
                            .filter(Boolean);
                        const deduped = uniqueBy(normalized, item => item);
                        if (!deduped.length || deduped.includes('all')) return ['all'];
                        return deduped.filter(item => allowedGenderSet.has(item));
                    };
                    const normalizeAgeList = (list = []) => {
                        const normalized = normalizeCrowdFilterFlatList(list)
                            .map(item => {
                                const token = item.toLowerCase().replace(/\s+/g, '');
                                if (token === 'all' || token === '不限') return 'all';
                                if (/18[-~_]?24/.test(token)) return '18-24';
                                if (/25[-~_]?29/.test(token)) return '25-29';
                                if (/30[-~_]?34/.test(token)) return '30-34';
                                if (/35[-~_]?39/.test(token)) return '35-39';
                                if (/40[-~_]?49/.test(token)) return '40-49';
                                if (/50/.test(token)) return '50+';
                                return '';
                            })
                            .filter(Boolean);
                        const deduped = uniqueBy(normalized, item => item);
                        if (!deduped.length || deduped.includes('all')) return ['all'];
                        return deduped.filter(item => allowedAgeSet.has(item));
                    };
                    const blockedInteractive = normalizeCrowdFilterFlatList(
                        source.blockedInteractive || source.interactive || []
                    ).slice(0, 100);
                    const blockedCustom = normalizeCrowdFilterFlatList(
                        source.blockedCustom || source.custom || []
                    ).slice(0, 100);
                    return {
                        gender: normalizeGenderList(source.gender || []),
                        age: normalizeAgeList(source.age || []),
                        blockedInteractive,
                        blockedCustom
                    };
                };
                const collectCrowdFilterSelectedList = (config = {}) => {
                    const normalized = normalizeCrowdFilterConfig(config);
                    const genderList = Array.isArray(normalized.gender) ? normalized.gender : ['all'];
                    const ageList = Array.isArray(normalized.age) ? normalized.age : ['all'];
                    const selected = [];
                    if (!genderList.includes('all')) {
                        genderList.forEach(token => {
                            const option = CROWD_FILTER_GENDER_OPTIONS.find(item => item.value === token);
                            if (!option) return;
                            selected.push({
                                key: `gender:${option.value}`,
                                type: 'gender',
                                value: option.value,
                                label: option.label
                            });
                        });
                    }
                    if (!ageList.includes('all')) {
                        ageList.forEach(token => {
                            const option = CROWD_FILTER_AGE_OPTIONS.find(item => item.value === token);
                            if (!option) return;
                            selected.push({
                                key: `age:${option.value}`,
                                type: 'age',
                                value: option.value,
                                label: option.label
                            });
                        });
                    }
                    normalizeCrowdFilterFlatList(normalized.blockedInteractive || []).forEach((label) => {
                        selected.push({
                            key: `interactive:${label}`,
                            type: 'interactive',
                            value: label,
                            label
                        });
                    });
                    normalizeCrowdFilterFlatList(normalized.blockedCustom || []).forEach((label) => {
                        selected.push({
                            key: `custom:${label}`,
                            type: 'custom',
                            value: label,
                            label
                        });
                    });
                    return selected.slice(0, 100);
                };
                const describeCrowdFilterSummary = (rawValue = '') => {
                    const selectedCount = collectCrowdFilterSelectedList(rawValue).length;
                    if (!selectedCount) return '未设置过滤';
                    return `已过滤 ${selectedCount} 项`;
                };
                const normalizeBudgetGuardConfig = (rawValue = '') => {
                    const parsed = isPlainObject(rawValue)
                        ? rawValue
                        : tryParseMaybeJSON(String(rawValue || '').trim());
                    const source = isPlainObject(parsed) ? parsed : {};
                    const spendRateThreshold = Math.min(100, Math.max(1, Math.round(toNumber(
                        source.spendRateThreshold ?? source.budgetSpendRateThreshold ?? 70,
                        70
                    ))));
                    const roiThreshold = Math.min(99.9, Math.max(0.1, Math.round(toNumber(
                        source.roiThreshold ?? source.roi ?? 3.9,
                        3.9
                    ) * 10) / 10));
                    const boostPercent = Math.min(300, Math.max(1, Math.round(toNumber(
                        source.boostPercent ?? source.increasePercent ?? 10,
                        10
                    ))));
                    const maxAdjustCount = Math.min(99, Math.max(1, Math.round(toNumber(
                        source.maxAdjustCount ?? source.modifyCount ?? 8,
                        8
                    ))));
                    const restoreCandidate = source.restoreNextDay ?? source.restoreDailyBudget ?? true;
                    const restoreNextDay = !/^(0|false|off|关闭|否)$/i.test(String(restoreCandidate ?? true).trim());
                    return {
                        spendRateThreshold,
                        roiThreshold,
                        boostPercent,
                        maxAdjustCount,
                        restoreNextDay
                    };
                };
                const describeBudgetGuardSummary = (rawValue = '') => {
                    const config = normalizeBudgetGuardConfig(rawValue);
                    return `花费率≥${config.spendRateThreshold}%｜投产比≥${config.roiThreshold}｜单次+${config.boostPercent}%`;
                };
                const describeKeywordAdvancedSummary = ({
                    adzoneRaw = '[]',
                    launchAreaRaw = '["all"]',
                    launchPeriodRaw = ''
                } = {}) => {
                    const adzoneList = parseScenePopupJsonArray(adzoneRaw, [])
                        .filter(item => isPlainObject(item));
                    const adzoneEnabledCount = adzoneList.filter(item => isAdzoneStatusEnabled(item)).length;
                    const adzoneText = !adzoneList.length || adzoneEnabledCount === adzoneList.length
                        ? '资源位:默认'
                        : `资源位:${adzoneEnabledCount}/${adzoneList.length}`;
                    const areaList = parseScenePopupJsonArray(launchAreaRaw, ['all'])
                        .map(item => String(item || '').trim())
                        .filter(Boolean);
                    const areaText = (!areaList.length || (areaList.length === 1 && /^all$/i.test(areaList[0])))
                        ? '地域:全部'
                        : `地域:${areaList.length}个`;
                    const periodList = parseScenePopupJsonArray(launchPeriodRaw || '', []);
                    const periodAllDay = periodList.length > 0 && periodList.every(item => {
                        const spanList = Array.isArray(item?.timeSpanList) ? item.timeSpanList : [];
                        return spanList.length === 1 && String(spanList[0]?.time || '').trim() === '00:00-24:00';
                    });
                    const periodText = periodAllDay ? '分时:全时段' : '分时:自定义';
                    return `${adzoneText}｜${areaText}｜${periodText}`;
                };

                const buildScenePopupControl = (popup = {}) => {
                    const trigger = String(popup?.trigger || '').trim();
                    if (!trigger) return '';
                    const title = String(popup?.title || '').trim();
                    const buttonLabel = String(popup?.buttonLabel || '配置').trim() || '配置';
                    const summary = String(popup?.summary || '').trim();
                    const hiddenFields = Array.isArray(popup?.hiddenFields) ? popup.hiddenFields : [];
                    const hiddenHtml = hiddenFields
                        .map(field => {
                            const fieldKey = String(field?.fieldKey || '').trim();
                            if (!fieldKey) return '';
                            const fieldValue = String(field?.value || '').trim();
                            return `
                                <input
                                    class="am-wxt-hidden-control"
                                    data-scene-field="${Utils.escapeHtml(fieldKey)}"
                                    data-scene-popup-field="${Utils.escapeHtml(trigger)}"
                                    value="${Utils.escapeHtml(fieldValue)}"
                                />
                            `;
                        })
                        .join('');
                    return `
                        <div class="am-wxt-scene-popup-control">
                            <button
                                type="button"
                                class="am-wxt-btn"
                                data-scene-popup-trigger="${Utils.escapeHtml(trigger)}"
                                data-scene-popup-title="${Utils.escapeHtml(title)}"
                            >${Utils.escapeHtml(buttonLabel)}</button>
                            <span
                                class="am-wxt-scene-popup-summary"
                                data-scene-popup-summary="${Utils.escapeHtml(trigger)}"
                                data-scene-popup-trigger-proxy="${Utils.escapeHtml(trigger)}"
                                role="button"
                                tabindex="0"
                                aria-label="${Utils.escapeHtml(`点击${buttonLabel}`)}"
                            >${Utils.escapeHtml(summary || '未配置')}</span>
                            ${hiddenHtml}
                        </div>
                    `;
                };

                const buildProxyTextareaRow = (label, targetId, value, placeholder = '') => `
                    <div class="am-wxt-scene-setting-row">
                        <div class="am-wxt-scene-setting-label">${Utils.escapeHtml(label)}</div>
                        <div class="am-wxt-setting-control">
                            <textarea
                                data-proxy-input-target="${Utils.escapeHtml(targetId)}"
                                placeholder="${Utils.escapeHtml(placeholder || '')}"
                            >${Utils.escapeHtml(value || '')}</textarea>
                        </div>
                    </div>
                `;
                const buildManualKeywordDesignerRow = (label = '手动关键词', options = {}) => {
                    const fallbackBid = toNumber(wizardState.els.bidInput?.value, 1);
                    const keywordDefaults = {
                        bidPrice: Number.isFinite(fallbackBid) ? fallbackBid : 1,
                        matchScope: DEFAULTS.matchScope,
                        onlineStatus: DEFAULTS.keywordOnlineStatus
                    };
                    const rawManualText = String(wizardState.els.manualInput?.value || '').trim();
                    const keywordList = parseKeywords(rawManualText, keywordDefaults).slice(0, 200);
                    const normalizedManualText = keywordList.map(item => formatKeywordLine(item)).join('\n');
                    const flowFieldKey = normalizeSceneFieldKey('流量智选');
                    const editingStrategy = typeof getStrategyById === 'function'
                        ? getStrategyById(wizardState.editingStrategyId)
                        : null;
                    const flowEnabled = editingStrategy
                        ? editingStrategy.useWordPackage !== false
                        : wizardState?.draft?.useWordPackage !== false;
                    const manualKeywordPanelCollapsed = Object.prototype.hasOwnProperty.call(options || {}, 'collapsed')
                        ? !!options.collapsed
                        : wizardState.manualKeywordPanelCollapsed !== false;
                    const flowStatusText = flowEnabled ? '生效中' : '已关闭';
                    const flowSwitchText = flowEnabled ? '开' : '关';
                    const flowSwitchClassName = flowEnabled ? 'is-on' : 'is-off';
                    const formatBidDisplay = (value) => {
                        const num = toNumber(value, Number.isFinite(fallbackBid) ? fallbackBid : 1);
                        if (!Number.isFinite(num)) return '1';
                        return String(Math.max(0, num).toFixed(4)).replace(/(?:\.0+|(\.\d+?)0+)$/, '$1');
                    };
                    const keywordComboMap = new Map();
                    keywordList.forEach(item => {
                        const metricEntry = getKeywordMetricByWord(item.word) || {};
                        const reasonTag = Array.isArray(metricEntry.reasonTagList) && metricEntry.reasonTagList.length
                            ? String(metricEntry.reasonTagList[0] || '').trim()
                            : '';
                        if (!reasonTag) return;
                        const comboKey = reasonTag;
                        if (!keywordComboMap.has(comboKey)) {
                            keywordComboMap.set(comboKey, {
                                name: reasonTag,
                                wordCount: 0,
                                bidTotal: 0,
                                predictClickTotal: 0
                            });
                        }
                        const target = keywordComboMap.get(comboKey);
                        target.wordCount += 1;
                        target.bidTotal += toNumber(metricEntry.marketAverageBidText, 0);
                        target.predictClickTotal += toNumber(metricEntry.predictClickText, 0);
                    });
                    const keywordComboList = Array.from(keywordComboMap.values())
                        .map(item => ({
                            ...item,
                            avgBidText: item.wordCount > 0
                                ? String((item.bidTotal / item.wordCount).toFixed(2)).replace(/(?:\.0+|(\.\d+?)0+)$/, '$1')
                                : '1',
                            displayText: item.predictClickTotal > 0
                                ? `预估展现：${Math.max(1, Math.round(item.predictClickTotal * 100))}`
                                : `预估展现：${Math.max(1, item.wordCount * 80)}`
                        }))
                        .sort((a, b) => b.wordCount - a.wordCount)
                        .slice(0, 8);
                    const comboRows = keywordComboList.map(item => `
                        <div class="am-wxt-manual-keyword-left-item">
                            <label class="am-wxt-manual-left-check">
                                <input type="checkbox" data-manual-package-enable="1" checked />
                                <span>
                                    <span class="am-wxt-manual-left-title">#${Utils.escapeHtml(item.name)}#</span>
                                    <span class="am-wxt-manual-left-meta">${Utils.escapeHtml(item.displayText)}</span>
                                </span>
                            </label>
                            <span class="am-wxt-manual-left-bid">${Utils.escapeHtml(item.avgBidText)} 元</span>
                        </div>
                    `).join('');
                    const keywordRows = keywordList.map((item, idx) => {
                        const matchScope = parseMatchScope(item.matchScope, DEFAULTS.matchScope);
                        const isExact = matchScope === 1;
                        const bidText = formatBidDisplay(item.bidPrice);
                        const metricEntry = getKeywordMetricByWord(item.word) || {};
                        const searchIndexText = String(metricEntry.searchIndexText || '-');
                        const clickRateText = String(metricEntry.marketClickRateText || '-');
                        const conversionRateText = String(metricEntry.marketClickConversionRateText || '-');
                        const marketAverageBidText = String(metricEntry.marketAverageBidText || bidText || '-');
                        const relevanceText = String(metricEntry.relevanceText || '好');
                        const relevanceClassName = String(metricEntry.relevanceClassName || 'keyword-relevance');
                        return `
                            <div
                                class="am-wxt-manual-keyword-item"
                                data-manual-keyword-row="1"
                                data-manual-keyword-word="${Utils.escapeHtml(item.word)}"
                                data-manual-keyword-bid="${Utils.escapeHtml(bidText)}"
                                data-manual-keyword-match="${isExact ? '1' : '4'}"
                            >
                                <label class="keyword-col">
                                    <input type="checkbox" data-manual-keyword-enable="1" checked />
                                    <span class="keyword-main">
                                        <span class="keyword-text">${Utils.escapeHtml(item.word)}</span>
                                        <span class="keyword-submeta">
                                            <span class="keyword-submeta-text">搜索指数：${Utils.escapeHtml(searchIndexText)}</span>
                                            <span class="keyword-submeta-text">相关性：<span class="${Utils.escapeHtml(relevanceClassName)}">${Utils.escapeHtml(relevanceText)}</span></span>
                                        </span>
                                    </span>
                                </label>
                                <span class="${clickRateText === '-' ? 'metric-muted' : ''}">${Utils.escapeHtml(clickRateText)}</span>
                                <span class="${conversionRateText === '-' ? 'metric-muted' : ''}">${Utils.escapeHtml(conversionRateText)}</span>
                                <span class="bid-value">${Utils.escapeHtml(marketAverageBidText)}</span>
                                <div class="am-wxt-option-line segmented">
                                    <button type="button" class="am-wxt-option-chip ${isExact ? '' : 'active'}" data-manual-keyword-match="4">广泛</button>
                                    <button type="button" class="am-wxt-option-chip ${isExact ? 'active' : ''}" data-manual-keyword-match="1">精准</button>
                                </div>
                                <label class="am-wxt-bid-edit">
                                    <input type="text" data-manual-keyword-bid-input="1" value="${Utils.escapeHtml(bidText)}" />
                                    <span>元</span>
                                </label>
                            </div>
                        `;
                    }).join('');
                    return `
                        <div class="am-wxt-scene-setting-row">
                            <div class="am-wxt-scene-setting-label">${Utils.escapeHtml(label)}</div>
                            <div class="am-wxt-setting-control">
                                <input class="am-wxt-hidden-control" data-scene-field="${Utils.escapeHtml(flowFieldKey)}" data-manual-keyword-flow-hidden="1" value="${flowEnabled ? '开启' : '关闭'}" />
                                <textarea class="am-wxt-hidden-control" data-proxy-input-target="am-wxt-keyword-manual" data-manual-keyword-hidden="1">${Utils.escapeHtml(normalizedManualText || rawManualText)}</textarea>
                                <div
                                    class="am-wxt-manual-keyword-panel ${manualKeywordPanelCollapsed ? 'is-collapsed' : ''}"
                                    data-manual-keyword-panel="1"
                                    data-manual-keyword-combo-count="${keywordComboList.length}"
                                    data-manual-keyword-count="${keywordList.length}"
                                    data-manual-keyword-collapsed="${manualKeywordPanelCollapsed ? '1' : '0'}"
                                >
                                    <div class="am-wxt-manual-keyword-toolbar">
                                        <div class="am-wxt-manual-keyword-toolbar-left">
                                            <button class="am-wxt-btn primary" type="button" data-manual-keyword-add="1">+更多关键词</button>
                                            <button class="am-wxt-btn" type="button" data-manual-keyword-batch-bid="1">批量修改出价</button>
                                            <div class="am-wxt-manual-keyword-match-menu" data-manual-keyword-match-menu="1">
                                                <button class="am-wxt-btn" type="button" data-manual-keyword-menu-toggle="1">修改匹配方案 ▾</button>
                                                <div class="am-wxt-manual-keyword-match-pop">
                                                    <button class="am-wxt-btn" type="button" data-manual-keyword-batch-match="4">批量设为广泛</button>
                                                    <button class="am-wxt-btn" type="button" data-manual-keyword-batch-match="1">批量设为精准</button>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="am-wxt-manual-keyword-toolbar-right">
                                            <span class="tips">已设置：${flowEnabled ? '开启' : '关闭'}流量智选，关键词组合 ${keywordComboList.length} 个、自选词 ${keywordList.length} 个</span>
                                            <button
                                                class="am-wxt-btn"
                                                type="button"
                                                data-manual-keyword-collapse-toggle="1"
                                                aria-expanded="${manualKeywordPanelCollapsed ? 'false' : 'true'}"
                                            >${manualKeywordPanelCollapsed ? '展开' : '收起'}</button>
                                        </div>
                                    </div>
                                    <div class="am-wxt-manual-keyword-layout">
                                        <div class="am-wxt-manual-keyword-left">
                                            <div class="am-wxt-manual-keyword-left-head">
                                                <label class="am-wxt-manual-left-check">
                                                    <input type="checkbox" data-manual-package-check-all="1" ${keywordComboList.length ? 'checked' : ''} />
                                                    <span>词包 (${keywordComboList.length}/100)<br />/预估展现量</span>
                                                </label>
                                                <span>基础出价</span>
                                            </div>
                                            <div class="am-wxt-manual-keyword-left-list">
                                                <div class="am-wxt-manual-keyword-left-item">
                                                    <label class="am-wxt-manual-left-check">
                                                        <input type="checkbox" data-manual-package-enable="1" ${flowEnabled ? 'checked' : ''} />
                                                        <span>
                                                            <span class="am-wxt-manual-left-title">流量智选</span>
                                                            <span class="am-wxt-manual-left-meta status">${flowStatusText}</span>
                                                        </span>
                                                    </label>
                                                    <button
                                                        type="button"
                                                        class="am-wxt-site-switch ${flowSwitchClassName}"
                                                        data-manual-keyword-flow-toggle="1"
                                                        aria-pressed="${flowEnabled ? 'true' : 'false'}"
                                                    >
                                                        <span class="am-wxt-site-switch-handle"></span>
                                                        <span class="am-wxt-site-switch-state">${flowSwitchText}</span>
                                                    </button>
                                                </div>
                                                ${comboRows || '<div class="am-wxt-manual-keyword-empty">暂无关键词组合</div>'}
                                            </div>
                                        </div>
                                        <div class="am-wxt-manual-keyword-right">
                                            <div class="am-wxt-manual-keyword-head">
                                                <label class="keyword-col">
                                                    <input type="checkbox" data-manual-keyword-check-all="1" ${keywordList.length ? 'checked' : ''} />
                                                    <span>关键词 (${keywordList.length}/200)</span>
                                                </label>
                                                <span>市场点击率</span>
                                                <span>市场转化率</span>
                                                <span>市场平均出价</span>
                                                <span>匹配方案</span>
                                                <span>基础出价</span>
                                            </div>
                                            <div class="am-wxt-manual-keyword-list">
                                                ${keywordRows || '<div class="am-wxt-manual-keyword-empty">暂无手动关键词，点击“+更多关键词”录入</div>'}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="am-wxt-manual-keyword-actions">
                                        <span class="tips">支持批量改价、批量修改匹配方案</span>
                                        <div>
                                            <button class="am-wxt-btn" type="button" data-manual-keyword-clear="1">清空</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                };

                const sceneFieldText = uniqueBy((profile.requiredFields || []).concat(metaFieldLabels), item => normalizeSceneLabelToken(item)).join(' ');
                const hasSceneField = (pattern) => pattern.test(sceneFieldText);
                const isKeywordScene = sceneName === '关键词推广';
                const shouldShowBudgetInput = isKeywordScene || hasSceneField(/预算|日均预算|每日预算|总预算/);
                const budgetTypeFieldToken = normalizeSceneRenderFieldToken('预算类型');
                const hasDynamicBudgetTypeField = fields.some(
                    fieldLabel => normalizeSceneRenderFieldToken(fieldLabel) === budgetTypeFieldToken
                );
                const shouldInlineBudgetWithBudgetType = shouldShowBudgetInput && (isKeywordScene || sceneName === '货品全站推广' || hasDynamicBudgetTypeField);
                const shouldRenderStandaloneBudgetRow = shouldShowBudgetInput && !shouldInlineBudgetWithBudgetType;
                const bidConstraintFieldLabel = (() => {
                    if (sceneName !== '货品全站推广' || isFullSiteMaxAmount) return '';
                    const preferredLabels = ['目标投产比', '净目标投产比', 'ROI目标值', '出价目标值', '约束值'];
                    for (const preferredLabel of preferredLabels) {
                        const token = normalizeSceneRenderFieldToken(preferredLabel);
                        const hit = fields.find(fieldLabel => normalizeSceneRenderFieldToken(fieldLabel) === token);
                        if (hit) return hit;
                    }
                    return '目标投产比';
                })();
                const bidConstraintFieldKey = bidConstraintFieldLabel ? normalizeSceneFieldKey(bidConstraintFieldLabel) : '';
                const bidConstraintFieldToken = bidConstraintFieldLabel ? normalizeSceneRenderFieldToken(bidConstraintFieldLabel) : '';
                const resolveFullSiteBidConstraintFallbackValue = () => normalizeSceneSettingValue(
                    runtimeCache?.value?.storeData?.constraintValue
                    || runtimeCache?.value?.solutionTemplate?.campaign?.constraintValue
                    || SCENE_SPEC_FIELD_FALLBACK?.['货品全站推广']?.目标投产比
                    || SCENE_SPEC_FIELD_FALLBACK?.['货品全站推广']?.净目标投产比
                    || ''
                );
                if (sceneName === '货品全站推广' && Object.prototype.hasOwnProperty.call(bucket, 'field')) {
                    delete bucket.field;
                }
                if (sceneName === '货品全站推广' && bidConstraintFieldKey && normalizeSceneSettingValue(bucket[bidConstraintFieldKey]) === '') {
                    const fallbackBidConstraintValue = resolveFullSiteBidConstraintFallbackValue();
                    if (fallbackBidConstraintValue) {
                        bucket[bidConstraintFieldKey] = fallbackBidConstraintValue;
                    }
                }
                if (sceneName === '货品全站推广' && bidConstraintFieldKey) {
                    const currentBidConstraintValue = normalizeSceneSettingValue(bucket[bidConstraintFieldKey]);
                    if (/(增加总成交金额|增加净成交金额|获取成交量|稳定投产比|增加点击量|增加收藏加购量)/.test(currentBidConstraintValue)) {
                        const fallbackBidConstraintValue = resolveFullSiteBidConstraintFallbackValue() || '5';
                        bucket[bidConstraintFieldKey] = fallbackBidConstraintValue;
                    }
                }
                const staticRows = [];
                staticRows.push(buildProxySelectRow('场景选择', 'am-wxt-keyword-scene-select', wizardState.els.sceneSelect, { segmented: true }));
                staticRows.push(buildGoalSelectorRow('营销目标', goalOptions, activeMarketingGoal, { segmented: true }));
                staticRows.push(buildProxyInputRow('计划名称', 'am-wxt-keyword-prefix', wizardState.els.prefixInput?.value || '', '例如：场景_时间'));
                const shouldRenderManualKeywordPanel = isKeywordScene && !['趋势明星', '流量金卡'].includes(detectKeywordGoalFromText(activeMarketingGoal || ''));
                let keywordManualPanelInsertedAfterSetting = false;
                if (isKeywordScene) {
                    let keywordBidMode = normalizeBidMode(
                        wizardState?.els?.bidModeSelect?.value || wizardState?.draft?.bidMode || 'smart',
                        'smart'
                    );
                    const activeKeywordGoal = detectKeywordGoalFromText(activeMarketingGoal || '');
                    const isFixedKeywordBidContract = activeKeywordGoal === '搜索卡位' || activeKeywordGoal === '流量金卡';
                    const keywordAiMaxFieldLabel = 'AI点睛';
                    const keywordAiMaxFieldKey = normalizeSceneFieldKey(keywordAiMaxFieldLabel);
                    const keywordAiMaxSwitchField = 'campaign.aiMaxSwitch';
                    const keywordAiMaxSwitchFieldKey = normalizeSceneFieldKey(keywordAiMaxSwitchField);
                    const keywordAiMaxInfoField = 'campaign.aiMaxInfo';
                    const keywordAiMaxInfoFieldKey = normalizeSceneFieldKey(keywordAiMaxInfoField);
                    const keywordAiMaxPrimaryItem = activeKeywordGoal === '自定义推广'
                        ? resolveKeywordAiMaxPrimaryItem()
                        : null;
                    const keywordAiMaxHasItem = !!(
                        keywordAiMaxPrimaryItem
                        && (
                            toIdValue(keywordAiMaxPrimaryItem?.materialId || keywordAiMaxPrimaryItem?.itemId || keywordAiMaxPrimaryItem?.id || '')
                            || normalizeKeywordAiMaxItemTitle(keywordAiMaxPrimaryItem)
                        )
                    );
                    const pickKeywordAiMaxRawValue = (...values) => {
                        for (const value of values) {
                            if (value === undefined || value === null) continue;
                            const text = String(value).trim();
                            if (text !== '') return text;
                        }
                        return '';
                    };
                    const keywordAiMaxRaw = activeKeywordGoal === '自定义推广'
                        ? pickKeywordAiMaxRawValue(
                            bucket[keywordAiMaxFieldKey],
                            bucket[keywordAiMaxFieldLabel],
                            bucket[keywordAiMaxSwitchField],
                            bucket[keywordAiMaxSwitchFieldKey],
                            runtimeCache?.value?.storeData?.aiMaxSwitch,
                            runtimeCache?.value?.solutionTemplate?.campaign?.aiMaxSwitch,
                            '1'
                        )
                        : '';
                    const keywordAiMaxEnabled = activeKeywordGoal === '自定义推广'
                        && !/^(0|false|off|关闭|否)$/i.test(keywordAiMaxRaw || '1');
                    if (activeKeywordGoal === '自定义推广' && keywordAiMaxEnabled && keywordBidMode === 'manual') {
                        keywordBidMode = 'smart';
                        if (wizardState.els.bidModeSelect) wizardState.els.bidModeSelect.value = 'smart';
                        if (wizardState.draft) wizardState.draft.bidMode = 'smart';
                    }
                    if (activeKeywordGoal === '自定义推广' && keywordAiMaxFieldKey) {
                        const keywordAiMaxValue = keywordAiMaxEnabled ? '开启' : '关闭';
                        const keywordAiMaxSwitchValue = keywordAiMaxEnabled ? '1' : '0';
                        const keywordAiMaxInfoSource = bucket[keywordAiMaxInfoField]
                            || bucket[keywordAiMaxInfoFieldKey]
                            || runtimeCache?.value?.storeData?.aiMaxInfo
                            || runtimeCache?.value?.solutionTemplate?.campaign?.aiMaxInfo
                            || '';
                        const keywordAiMaxInfoTouched = !!(
                            touchedBucket[keywordAiMaxInfoField]
                            || touchedBucket[keywordAiMaxInfoFieldKey]
                        );
                        const keywordAiMaxGenerationKey = keywordAiMaxPrimaryItem
                            ? getKeywordAiMaxGenerationKey(keywordAiMaxPrimaryItem)
                            : '';
                        const keywordAiMaxGeneration = keywordAiMaxGenerationKey
                            ? getKeywordAiMaxGenerationMap()[keywordAiMaxGenerationKey]
                            : null;
                        let keywordAiMaxInfoSourceForRender = keywordAiMaxInfoSource;
                        if (keywordAiMaxEnabled && keywordAiMaxHasItem) {
                            if (!keywordAiMaxInfoTouched && keywordAiMaxGeneration?.status === 'ready' && isPlainObject(keywordAiMaxGeneration.info)) {
                                keywordAiMaxInfoSourceForRender = keywordAiMaxGeneration.info;
                            } else {
                                const parsedKeywordAiMaxInfo = normalizeKeywordAiMaxInfo(keywordAiMaxInfoSource, keywordAiMaxEnabled, keywordAiMaxPrimaryItem || {});
                                if (!parsedKeywordAiMaxInfo.nativeGenerated && !parsedKeywordAiMaxInfo.nativeSource) {
                                    ensureKeywordAiMaxGeneration(keywordAiMaxPrimaryItem);
                                }
                            }
                        }
                        const keywordAiMaxInfo = normalizeKeywordAiMaxInfo(keywordAiMaxInfoSourceForRender, keywordAiMaxEnabled, keywordAiMaxPrimaryItem || {});
                        const keywordAiMaxInfoRaw = serializeKeywordAiMaxInfo(keywordAiMaxInfo, keywordAiMaxEnabled);
                        bucket[keywordAiMaxFieldKey] = keywordAiMaxValue;
                        bucket[keywordAiMaxFieldLabel] = keywordAiMaxValue;
                        bucket[keywordAiMaxSwitchField] = keywordAiMaxSwitchValue;
                        bucket[keywordAiMaxSwitchFieldKey] = keywordAiMaxSwitchValue;
                        bucket[keywordAiMaxInfoField] = keywordAiMaxInfoRaw;
                        bucket[keywordAiMaxInfoFieldKey] = keywordAiMaxInfoRaw;
                        staticRows.push(buildKeywordAiMaxSwitchRow({
                            fieldKey: keywordAiMaxFieldKey,
                            selectedValue: keywordAiMaxValue,
                            switchValue: keywordAiMaxSwitchValue,
                            infoRaw: keywordAiMaxInfoRaw
                        }));
                        if (keywordAiMaxEnabled) {
                            if (!keywordAiMaxHasItem) {
                                staticRows.push(buildKeywordAiMaxPendingPanelRow({
                                    infoRaw: keywordAiMaxInfoRaw,
                                    infoField: keywordAiMaxInfoField
                                }));
                            } else if (keywordAiMaxGeneration?.status === 'error' && !keywordAiMaxInfo.nativeGenerated && !keywordAiMaxInfo.nativeSource) {
                                staticRows.push(buildKeywordAiMaxPendingPanelRow({
                                    infoRaw: keywordAiMaxInfoRaw,
                                    infoField: keywordAiMaxInfoField,
                                    status: 'error',
                                    message: `AI点睛生成失败：${keywordAiMaxGeneration.message || '原生接口暂不可用'}`
                                }));
                            } else if (!keywordAiMaxInfo.nativeGenerated && !keywordAiMaxInfo.nativeSource) {
                                staticRows.push(buildKeywordAiMaxPendingPanelRow({
                                    infoRaw: keywordAiMaxInfoRaw,
                                    infoField: keywordAiMaxInfoField,
                                    message: 'AI点睛正在按原生接口生成投放内容，请稍候...'
                                }));
                            } else {
                                staticRows.push(buildKeywordAiMaxInsightPanelRow({
                                    infoRaw: keywordAiMaxInfoRaw,
                                    info: keywordAiMaxInfo,
                                    infoField: keywordAiMaxInfoField
                                }));
                            }
                            staticRows.push(`
                                <div class="am-wxt-scene-setting-row am-wxt-scene-setting-row-readonly">
                                    <div class="am-wxt-scene-setting-label">创意设置</div>
                                    <div class="am-wxt-setting-control">
                                        <span class="tips">当前解决方案下暂不支持设置创意，默认开启智能创意。</span>
                                    </div>
                                </div>
                            `);
                        }
                    }
                    let keywordBidTargetLinkedInsertIndex = -1;
                    if (!isFixedKeywordBidContract) {
                        staticRows.push(buildProxySelectRow('出价方式', 'am-wxt-keyword-bid-mode', wizardState.els.bidModeSelect, {
                            segmented: true,
                            allowedValues: keywordAiMaxEnabled ? ['smart'] : [],
                            enforceFilteredSelection: true,
                            inlineControlHtml: keywordAiMaxEnabled
                                ? '<span class="tips">开启‘AI点睛’后仅支持智能出价。如需使用手动出价，可关闭该功能。</span>'
                                : ''
                        }));
                    }
                    if (keywordBidMode !== 'manual' && !isFixedKeywordBidContract) {
                        const keywordCustomBidTargetAllowedValues = ['conv', 'similar_item', 'market_penetration', 'fav_cart', 'click', 'roi'];
                        const keywordAiMaxBidTargetAllowedValues = ['conv', 'fav_cart', 'click', 'roi'];
                        const keywordTrendBidTargetAllowedValues = ['conv', 'click', 'fav_cart', 'roi'];
                        staticRows.push(buildProxySelectRow('出价目标', 'am-wxt-keyword-bid-target', wizardState.els.bidTargetSelect, {
                            segmented: true,
                            allowedValues: activeKeywordGoal === '自定义推广'
                                ? (keywordAiMaxEnabled ? keywordAiMaxBidTargetAllowedValues : keywordCustomBidTargetAllowedValues)
                                : (activeKeywordGoal === '趋势明星' ? keywordTrendBidTargetAllowedValues : []),
                            enforceFilteredSelection: activeKeywordGoal === '自定义推广' || activeKeywordGoal === '趋势明星',
                            resolveOptionText: ({ value, text }) => (
                                activeKeywordGoal === '自定义推广' && value === 'market_penetration'
                                    ? '提升词市场渗透'
                                    : text
                            ),
                            resolveBadgeText: ({ value, text }) => (value === 'conv' || /获取成交量/.test(text)) ? '升级净成交' : ''
                        }));
                        if (normalizeSceneSettingValue(activeKeywordGoal) === '自定义推广') {
                            keywordBidTargetLinkedInsertIndex = staticRows.length;
                        }
                    }
                    staticRows.push(buildProxySelectRow('预算类型', 'am-wxt-keyword-budget-type', wizardState.els.budgetTypeSelect, {
                        segmented: true,
                        inlineControlHtml: shouldInlineBudgetWithBudgetType
                            ? buildInlineProxyInputControl(
                                '预算值',
                                'am-wxt-keyword-budget',
                                wizardState.els.budgetInput?.value || '',
                                '请输入预算'
                            )
                            : ''
                    }));
                    if (activeKeywordGoal === '趋势明星') {
                        const trendThemeField = 'campaign.trendThemeList';
                        const trendThemeFieldKey = normalizeSceneFieldKey(trendThemeField);
                        const trendThemeRaw = serializeTrendThemeList(
                            bucket[trendThemeField]
                            || bucket[trendThemeFieldKey]
                            || '[]'
                        );
                        bucket[trendThemeField] = trendThemeRaw;
                        if (trendThemeFieldKey && !touchedBucket[trendThemeFieldKey]) {
                            bucket[trendThemeFieldKey] = trendThemeRaw;
                        }
                        staticRows.push(`
                            <div class="am-wxt-scene-setting-row">
                                <div class="am-wxt-scene-setting-label">平均直接成交成本</div>
                                <div class="am-wxt-setting-control am-wxt-setting-control-inline">
                                    <label class="am-wxt-inline-check">
                                        <input
                                            type="checkbox"
                                            data-proxy-check-target="am-wxt-keyword-single-cost-enable"
                                            ${wizardState.els.singleCostEnableInput?.checked ? 'checked' : ''}
                                            ${wizardState.els.singleCostEnableInput?.disabled ? 'disabled' : ''}
                                        />
                                        <span>启用（非必要）</span>
                                    </label>
                                    <input
                                        data-proxy-input-target="am-wxt-keyword-single-cost"
                                        value="${Utils.escapeHtml(wizardState.els.singleCostInput?.value || '')}"
                                        placeholder="成本上限"
                                        ${wizardState.els.singleCostInput?.disabled ? 'disabled' : ''}
                                    />
                                </div>
                            </div>
                        `);
                        staticRows.push(`
                            <div class="am-wxt-scene-setting-row">
                                <div class="am-wxt-scene-setting-label">趋势主题</div>
                                <div class="am-wxt-setting-control">
                                    ${buildScenePopupControl({
                                        trigger: 'trendTheme',
                                        title: '选择趋势主题',
                                        buttonLabel: '选择趋势主题',
                                        summary: describeTrendThemeSummary(trendThemeRaw),
                                        hiddenFields: [
                                            { fieldKey: trendThemeField, value: trendThemeRaw }
                                        ]
                                    })}
                                </div>
                            </div>
                        `);
                    }
                    if (activeKeywordGoal === '自定义推广') {
                        const pushKeywordCustomSettingRow = ({
                            label = '',
                            aliases = [],
                            options = [],
                            defaultValue = '',
                            popup = null,
                            strictOptions = false
                        } = {}) => {
                            const normalizedLabel = normalizeSceneRenderFieldLabel(label) || label;
                            const key = normalizeSceneFieldKey(normalizedLabel);
                            if (!normalizedLabel || !key) return;
                            const aliasKeys = (Array.isArray(aliases) ? aliases : [])
                                .map(item => normalizeSceneFieldKey(item))
                                .filter(Boolean);
                            const optionSource = strictOptions === true
                                ? (Array.isArray(options) ? options : [])
                                : resolveSceneFieldOptions(profile, normalizedLabel)
                                    .concat(Array.isArray(options) ? options : []);
                            const optionList = uniqueBy(
                                optionSource
                                    .map(item => normalizeSceneSettingValue(item))
                                    .filter(Boolean),
                                item => item
                            ).slice(0, 24);
                            const currentCandidate = normalizeSceneSettingValue(
                                bucket[key]
                                || aliasKeys.map(aliasKey => bucket[aliasKey]).find(val => normalizeSceneSettingValue(val))
                                || defaultValue
                                || optionList[0]
                                || ''
                            );
                            let currentValue = currentCandidate;
                            if (strictOptions === true && optionList.length) {
                                const matchedCurrent = pickSceneValueFromOptions(currentCandidate, optionList);
                                if (matchedCurrent) {
                                    currentValue = matchedCurrent;
                                } else {
                                    const matchedDefault = pickSceneValueFromOptions(defaultValue, optionList);
                                    currentValue = matchedDefault || optionList[0];
                                }
                            }
                            if (currentValue) {
                                bucket[key] = currentValue;
                                aliasKeys.forEach(aliasKey => {
                                    if (!aliasKey || touchedBucket[aliasKey]) return;
                                    if (normalizeSceneSettingValue(bucket[aliasKey])) return;
                                    bucket[aliasKey] = currentValue;
                                });
                            }
                            const popupControlHtml = isPlainObject(popup) ? buildScenePopupControl(popup) : '';
                            staticRows.push(buildSceneOptionRow(normalizedLabel, key, optionList, currentValue, {
                                segmented: true,
                                inlineControlHtml: popupControlHtml
                            }));
                        };
                        const crowdCampaignField = 'campaign.crowdList';
                        const crowdAdgroupField = 'adgroup.rightList';
                        const adzoneField = 'campaign.adzoneList';
                        const launchPeriodField = 'campaign.launchPeriodList';
                        const launchAreaField = 'campaign.launchAreaStrList';
                        const crowdCampaignRaw = normalizeSceneSettingValue(
                            bucket[crowdCampaignField]
                            || bucket[normalizeSceneFieldKey(crowdCampaignField)]
                            || '[]'
                        ) || '[]';
                        const crowdAdgroupRaw = normalizeSceneSettingValue(
                            bucket[crowdAdgroupField]
                            || bucket[normalizeSceneFieldKey(crowdAdgroupField)]
                            || (Array.isArray(wizardState.crowdList) && wizardState.crowdList.length
                                ? JSON.stringify(wizardState.crowdList)
                                : '[]')
                        ) || '[]';
                        const launchPeriodList = parseScenePopupJsonArray(
                            normalizeSceneSettingValue(
                                bucket[launchPeriodField]
                                || bucket[normalizeSceneFieldKey(launchPeriodField)]
                                || ''
                            ),
                            buildDefaultLaunchPeriodList()
                        );
                        const launchPeriodRaw = JSON.stringify(
                            Array.isArray(launchPeriodList) && launchPeriodList.length
                                ? launchPeriodList
                                : buildDefaultLaunchPeriodList()
                        );
                        const launchAreaList = uniqueBy(
                            parseScenePopupJsonArray(
                                normalizeSceneSettingValue(
                                    bucket[launchAreaField]
                                    || bucket[normalizeSceneFieldKey(launchAreaField)]
                                    || '["all"]'
                                ),
                                ['all']
                            )
                                .map(item => String(item || '').trim())
                                .filter(Boolean),
                            item => item
                        );
                        const launchAreaRaw = JSON.stringify(
                            launchAreaList.length ? launchAreaList : ['all']
                        );
                        const adzoneRawValue = normalizeSceneSettingValue(
                            bucket[adzoneField]
                            || bucket[normalizeSceneFieldKey(adzoneField)]
                            || '[]'
                        ) || '[]';
                        const adzoneList = normalizeAdzoneListForAdvanced(adzoneRawValue);
                        const adzoneRaw = JSON.stringify(adzoneList);
                        bucket[crowdCampaignField] = crowdCampaignRaw;
                        bucket[crowdAdgroupField] = crowdAdgroupRaw;
                        bucket[adzoneField] = adzoneRaw;
                        bucket[launchPeriodField] = launchPeriodRaw;
                        bucket[launchAreaField] = launchAreaRaw;
                        const needTargetCrowdRaw = normalizeSceneSettingValue(
                            bucket.campaign?.needTargetCrowd
                            || bucket['campaign.needTargetCrowd']
                            || bucket[normalizeSceneFieldKey('campaign.needTargetCrowd')]
                            || '1'
                        );
                        const aiCrowdListSwitchRaw = normalizeSceneSettingValue(
                            bucket.campaign?.aiXiaowanCrowdListSwitch
                            || bucket['campaign.aiXiaowanCrowdListSwitch']
                            || bucket[normalizeSceneFieldKey('campaign.aiXiaowanCrowdListSwitch')]
                            || needTargetCrowdRaw
                            || '1'
                        );
                        const isCrowdTargetEnabled = !/^(0|false|off|关闭|否)$/i.test(needTargetCrowdRaw || '1');
                        const isPriorityCrowdEnabled = !/^(0|false|off|关闭|否)$/i.test(aiCrowdListSwitchRaw || '1');
                        const launchAreaIsAll = !launchAreaList.length || (launchAreaList.length === 1 && /^all$/i.test(launchAreaList[0]));
                        const launchPeriodIsAllDay = launchPeriodList.length > 0 && launchPeriodList.every(item => {
                            const spanList = Array.isArray(item?.timeSpanList) ? item.timeSpanList : [];
                            return spanList.length === 1 && String(spanList[0]?.time || '').trim() === '00:00-24:00';
                        });
                        const adzoneEnabledCount = adzoneList.filter(item => isAdzoneStatusEnabled(item)).length;
                        const advancedDefaultMode = (!adzoneList.length || adzoneEnabledCount === adzoneList.length)
                            && launchAreaIsAll
                            && launchPeriodIsAllDay;
                        // 临时隐藏：关键词-自定义推广下先不展示选品方式，后续再彻底移除。
                        pushKeywordCustomSettingRow({
                            label: '冷启加速',
                            aliases: ['开启冷启加速'],
                            options: ['开启', '关闭'],
                            defaultValue: normalizeSceneSettingValue(
                                SCENE_SPEC_FIELD_FALLBACK?.['关键词推广']?.冷启加速
                                || SCENE_SPEC_FIELD_FALLBACK?.['关键词推广']?.开启冷启加速
                                || '开启'
                            ),
                            strictOptions: true
                        });
                        const hasCrowdData = parseScenePopupJsonArray(crowdCampaignRaw, []).length > 0
                            || parseScenePopupJsonArray(crowdAdgroupRaw, []).length > 0;
                        if (keywordBidMode === 'manual') {
                            pushKeywordCustomSettingRow({
                                label: '人群设置',
                                aliases: ['设置人群', '设置拉新人群', '种子人群'],
                                options: ['添加精选人群', '关闭'],
                                defaultValue: hasCrowdData ? '添加精选人群' : '关闭',
                                strictOptions: true,
                                popup: {
                                    trigger: 'crowd',
                                    title: '添加精选人群',
                                    buttonLabel: '编辑人群',
                                    summary: describeCrowdSummary(crowdCampaignRaw, crowdAdgroupRaw),
                                    hiddenFields: [
                                        { fieldKey: crowdCampaignField, value: crowdCampaignRaw },
                                        { fieldKey: crowdAdgroupField, value: crowdAdgroupRaw }
                                    ]
                                }
                            });
                            pushKeywordCustomSettingRow({
                                label: '投放资源位/投放地域/分时折扣',
                                aliases: ['高级设置', '投放资源位/投放地域/投放时间', '资源位设置'],
                                options: ['默认投放', '自定义设置'],
                                defaultValue: advancedDefaultMode ? '默认投放' : '自定义设置',
                                strictOptions: true,
                                popup: {
                                    trigger: 'adzone',
                                    title: '高级设置',
                                    buttonLabel: '编辑设置',
                                    summary: describeKeywordAdvancedSummary({
                                        adzoneRaw,
                                        launchAreaRaw,
                                        launchPeriodRaw
                                    }),
                                    hiddenFields: [
                                        { fieldKey: adzoneField, value: adzoneRaw },
                                        { fieldKey: launchPeriodField, value: launchPeriodRaw },
                                        { fieldKey: launchAreaField, value: launchAreaRaw }
                                    ]
                                }
                            });
                        } else {
                            if (!keywordAiMaxEnabled) {
                                if (shouldRenderManualKeywordPanel) {
                                    const keywordSettingFieldLabel = '关键词设置';
                                    const keywordSettingFieldKey = normalizeSceneFieldKey(keywordSettingFieldLabel);
                                    const manualKeywordCount = String(wizardState?.els?.manualInput?.value || '')
                                        .split(/\n+/)
                                        .map(item => normalizeSceneSettingValue(item))
                                        .filter(Boolean)
                                        .length;
                                    const keywordSettingRaw = normalizeSceneSettingValue(
                                        bucket[keywordSettingFieldKey]
                                        || bucket[keywordSettingFieldLabel]
                                        || '查看和添加关键词'
                                    );
                                    const keywordSettingEnabled = !/^(0|false|off|关闭|否)$/i.test(keywordSettingRaw || '查看和添加关键词');
                                    if (keywordSettingFieldKey) {
                                        bucket[keywordSettingFieldKey] = keywordSettingEnabled ? '查看和添加关键词' : '关闭';
                                        bucket[keywordSettingFieldLabel] = bucket[keywordSettingFieldKey];
                                        staticRows.push(buildKeywordCustomKeywordSettingRow({
                                            fieldKey: keywordSettingFieldKey,
                                            enabled: keywordSettingEnabled,
                                            manualKeywordCount,
                                            recommendCount: wizardState?.els?.recommendCountInput?.value || ''
                                        }));
                                        staticRows.push(buildManualKeywordDesignerRow('手动关键词', {
                                            collapsed: !keywordSettingEnabled
                                        }));
                                        keywordManualPanelInsertedAfterSetting = true;
                                    }
                                }
                                const keywordSmartCrowdSettingLabel = normalizeSceneRenderFieldLabel('人群设置') || '人群设置';
                                const keywordSmartCrowdSettingFieldKey = normalizeSceneFieldKey(keywordSmartCrowdSettingLabel);
                                const keywordSmartCrowdSettingAliasKeys = ['设置人群', '设置拉新人群', '种子人群']
                                    .map(item => normalizeSceneFieldKey(item))
                                    .filter(Boolean);
                                const keywordSmartCrowdSettingValue = isPriorityCrowdEnabled ? '设置优先投放客户' : '关闭';
                                if (keywordSmartCrowdSettingFieldKey) {
                                    bucket[keywordSmartCrowdSettingFieldKey] = keywordSmartCrowdSettingValue;
                                    keywordSmartCrowdSettingAliasKeys.forEach(aliasKey => {
                                        if (!aliasKey || touchedBucket[aliasKey]) return;
                                        if (normalizeSceneSettingValue(bucket[aliasKey])) return;
                                        bucket[aliasKey] = keywordSmartCrowdSettingValue;
                                    });
                                    staticRows.push(buildKeywordSmartCrowdPriorityRow({
                                        label: keywordSmartCrowdSettingLabel,
                                        fieldKey: keywordSmartCrowdSettingFieldKey,
                                        enabled: isPriorityCrowdEnabled,
                                        onValue: '设置优先投放客户',
                                        offValue: '关闭',
                                        helpText: '智能出价方式下，可通过人群设置，提高特定客户的投放权重。特别的，价值设置用于调整算法的出价系数，并不等于最终的出价。',
                                        description: '支持对特定客户设置更高权重，进行优先获取。',
                                        detailUrl: 'https://alidocs.dingtalk.com/i/nodes/Y1OQX0akWmzdBowLFk0vRgKlVGlDd3mE',
                                        detailLabel: '了解详情'
                                    }));
                                }
                                const keywordCrowdTargetFieldKey = normalizeSceneFieldKey('人群优化目标');
                                const keywordCrowdClientFieldKey = normalizeSceneFieldKey('客户口径设置');
                                const keywordCrowdValueFieldKey = normalizeSceneFieldKey('人群价值设置');
                                const keywordCrowdTargetStatus = isCrowdTargetEnabled ? '人群优化目标' : '关闭';
                                if (keywordCrowdTargetFieldKey) bucket[keywordCrowdTargetFieldKey] = keywordCrowdTargetStatus;
                                if (keywordCrowdClientFieldKey) bucket[keywordCrowdClientFieldKey] = keywordCrowdTargetStatus;
                                if (keywordCrowdValueFieldKey) bucket[keywordCrowdValueFieldKey] = keywordCrowdTargetStatus;
                                staticRows.push(buildKeywordSmartCrowdTargetPanelRow({
                                    targetFieldKey: keywordCrowdTargetFieldKey,
                                    clientFieldKey: keywordCrowdClientFieldKey,
                                    valueFieldKey: keywordCrowdValueFieldKey,
                                    campaignFieldKey: crowdCampaignField,
                                    campaignRaw: crowdCampaignRaw,
                                    enabled: isCrowdTargetEnabled
                                }));
                            }
                            // 临时隐藏：关键词-自定义推广-智能出价下先不展示 crowd target 开关，后续再彻底移除。
                            const keywordBidTargetLinkedRows = [];
                            const keywordRoiLevelFieldLabel = '设置7日投产比';
                            const keywordRoiLevelFieldKey = normalizeSceneFieldKey(keywordRoiLevelFieldLabel);
                            const keywordRoiCustomFieldLabel = '目标投产比';
                            const keywordRoiCustomFieldKey = normalizeSceneFieldKey(keywordRoiCustomFieldLabel);
                            const keywordAvgDealCostSwitchFieldLabel = '设置平均成交成本';
                            const keywordAvgDealCostSwitchFieldKey = normalizeSceneFieldKey(keywordAvgDealCostSwitchFieldLabel);
                            const keywordAvgDealCostFieldLabel = '平均成交成本';
                            const keywordAvgDealCostFieldKey = normalizeSceneFieldKey(keywordAvgDealCostFieldLabel);
                            const keywordAvgCartCostSwitchFieldLabel = '设置平均收藏加购成本';
                            const keywordAvgCartCostSwitchFieldKey = normalizeSceneFieldKey(keywordAvgCartCostSwitchFieldLabel);
                            const keywordAvgCartCostFieldLabel = '平均收藏加购成本';
                            const keywordAvgCartCostFieldKey = normalizeSceneFieldKey(keywordAvgCartCostFieldLabel);
                            const keywordAvgClickCostSwitchFieldLabel = '设置平均点击成本';
                            const keywordAvgClickCostSwitchFieldKey = normalizeSceneFieldKey(keywordAvgClickCostSwitchFieldLabel);
                            const keywordAvgClickCostFieldLabel = '平均点击成本';
                            const keywordAvgClickCostFieldKey = normalizeSceneFieldKey(keywordAvgClickCostFieldLabel);
                            const keywordSubOptimizeTargetFieldLabel = '成交口径';
                            const keywordSubOptimizeTargetFieldKey = normalizeSceneFieldKey(keywordSubOptimizeTargetFieldLabel);
                            const keywordSubOptimizeTargetApiFieldKey = normalizeSceneFieldKey('campaign.subOptimizeTarget');
                            const keywordBidTargetSeed = normalizeSceneSettingValue(
                                wizardState?.els?.bidTargetSelect?.value
                                || bucket[normalizeSceneFieldKey('campaign.bidTargetV2')]
                                || bucket[normalizeSceneFieldKey('campaign.optimizeTarget')]
                                || bucket[normalizeSceneFieldKey('优化目标')]
                                || bucket[normalizeSceneFieldKey('出价目标')]
                                || ''
                            );
                            const keywordBidTargetCode = normalizeKeywordBidTargetOptionValue(
                                mapSceneBidTargetValue(keywordBidTargetSeed) || keywordBidTargetSeed
                            ) || 'conv';
                            const resolveKeywordTargetCostValue = ({
                                fieldKey = '',
                                fieldLabel = '',
                                aliases = [],
                                fallback = ''
                            } = {}) => {
                                const aliasKeys = (Array.isArray(aliases) ? aliases : [])
                                    .map(item => normalizeSceneFieldKey(item))
                                    .filter(Boolean);
                                const optionSeeds = resolveSceneFieldOptions(profile, fieldLabel);
                                const heuristicSeed = resolveSceneFieldHeuristicDefault(fieldLabel, optionSeeds);
                                const candidates = [
                                    fieldKey ? bucket[fieldKey] : '',
                                    fieldLabel ? bucket[fieldLabel] : '',
                                    ...aliasKeys.map(aliasKey => bucket[aliasKey]),
                                    wizardState?.els?.singleCostInput?.value,
                                    runtimeCache?.value?.storeData?.singleCostV2,
                                    runtimeCache?.value?.solutionTemplate?.campaign?.singleCostV2,
                                    runtimeCache?.value?.storeData?.constraintValue,
                                    runtimeCache?.value?.solutionTemplate?.campaign?.constraintValue,
                                    heuristicSeed,
                                    fallback
                                ];
                                for (const candidate of candidates) {
                                    const num = parseNumberFromSceneValue(candidate);
                                    if (!Number.isFinite(num) || num <= 0 || num > 9999) continue;
                                    const text = toShortSceneValue(String(num));
                                    if (text) return text;
                                }
                                return '';
                            };
                            const keywordRoiFallbackValue = resolveKeywordTargetCostValue({
                                fieldKey: keywordRoiCustomFieldKey,
                                fieldLabel: keywordRoiCustomFieldLabel,
                                aliases: ['ROI目标值', '出价目标值', '约束值'],
                                fallback: ''
                            });
                            if (keywordBidTargetCode === 'roi') {
                                const collectKeywordRoiPresetValues = () => {
                                    const values = [];
                                    const pushNumericValue = (candidate = '') => {
                                        const num = parseNumberFromSceneValue(candidate);
                                        if (!Number.isFinite(num) || num <= 0 || num > 9999) return;
                                        const text = toShortSceneValue(String(num));
                                        if (!text) return;
                                        values.push(text);
                                    };
                                    const appendOptions = (fieldLabel = '') => {
                                        resolveSceneFieldOptions(profile, fieldLabel).forEach(pushNumericValue);
                                    };
                                    appendOptions(keywordRoiLevelFieldLabel);
                                    appendOptions(keywordRoiCustomFieldLabel);
                                    appendOptions('ROI目标值');
                                    appendOptions('出价目标值');
                                    appendOptions('约束值');
                                    [
                                        bucket[keywordRoiLevelFieldKey],
                                        bucket[keywordRoiLevelFieldLabel],
                                        bucket[keywordRoiCustomFieldKey],
                                        bucket[keywordRoiCustomFieldLabel],
                                        runtimeCache?.value?.storeData?.constraintValue,
                                        runtimeCache?.value?.solutionTemplate?.campaign?.constraintValue
                                    ].forEach(pushNumericValue);
                                    [
                                        runtimeCache?.value?.storeData?.constraintValueList,
                                        runtimeCache?.value?.storeData?.constraintList,
                                        runtimeCache?.value?.storeData?.constraintOptions,
                                        runtimeCache?.value?.storeData?.constraintValueOptions,
                                        runtimeCache?.value?.solutionTemplate?.campaign?.constraintValueList,
                                        runtimeCache?.value?.solutionTemplate?.campaign?.constraintOptions
                                    ].forEach(list => {
                                        if (!Array.isArray(list)) return;
                                        list.forEach(item => {
                                            if (isPlainObject(item)) {
                                                pushNumericValue(item.value);
                                                pushNumericValue(item.constraintValue);
                                                pushNumericValue(item.label);
                                                pushNumericValue(item.text);
                                                return;
                                            }
                                            pushNumericValue(item);
                                        });
                                    });
                                    if (!values.length) {
                                        pushNumericValue(keywordRoiFallbackValue);
                                    }
                                    return uniqueBy(values, item => item).slice(0, 8);
                                };
                                const keywordRoiPresetOptions = collectKeywordRoiPresetValues();
                                const keywordRoiCustomValue = normalizeSceneSettingValue(
                                    bucket[keywordRoiCustomFieldKey]
                                    || bucket[keywordRoiCustomFieldLabel]
                                    || keywordRoiFallbackValue
                                    || ''
                                );
                                if (keywordRoiCustomValue) {
                                    bucket[keywordRoiCustomFieldKey] = keywordRoiCustomValue;
                                    bucket[keywordRoiCustomFieldLabel] = keywordRoiCustomValue;
                                }
                                const keywordRoiSeed = normalizeSceneSettingValue(
                                    bucket[keywordRoiLevelFieldKey]
                                    || bucket[keywordRoiLevelFieldLabel]
                                    || keywordRoiCustomValue
                                    || ''
                                );
                                let keywordRoiPresetValue = pickSceneValueFromOptions(keywordRoiSeed, keywordRoiPresetOptions);
                                if (!keywordRoiPresetValue) {
                                    keywordRoiPresetValue = keywordRoiCustomValue ? '自定义' : (keywordRoiPresetOptions[0] || '自定义');
                                }
                                const keywordRoiPresetOptionsWithCustom = keywordRoiPresetOptions.concat(['自定义']);
                                bucket[keywordRoiLevelFieldKey] = keywordRoiPresetValue;
                                bucket[keywordRoiLevelFieldLabel] = keywordRoiPresetValue;
                                keywordBidTargetLinkedRows.push(buildSceneOptionRow(
                                    keywordRoiLevelFieldLabel,
                                    keywordRoiLevelFieldKey,
                                    keywordRoiPresetOptionsWithCustom,
                                    keywordRoiPresetValue,
                                    {
                                        segmented: true,
                                        inlineControlHtml: keywordRoiPresetValue === '自定义'
                                            ? buildInlineSceneInputControl(
                                                '自定义',
                                                keywordRoiCustomFieldKey,
                                                keywordRoiCustomValue,
                                                '例如 2.24'
                                            )
                                            : ''
                                    }
                                ));
                            } else if (keywordBidTargetCode === 'conv') {
                                const keywordSubOptimizeTargetSeed = normalizeSceneSettingValue(
                                    bucket[keywordSubOptimizeTargetFieldKey]
                                    || bucket[keywordSubOptimizeTargetFieldLabel]
                                    || bucket[keywordSubOptimizeTargetApiFieldKey]
                                    || runtimeCache?.value?.storeData?.subOptimizeTarget
                                    || runtimeCache?.value?.solutionTemplate?.campaign?.subOptimizeTarget
                                    || 'retained_buy'
                                );
                                const keywordSubOptimizeTargetCode = normalizeKeywordConvSubOptimizeTargetValue(
                                    keywordSubOptimizeTargetSeed,
                                    { fallback: 'retained_buy' }
                                ) || 'retained_buy';
                                const keywordSubOptimizeTargetValue = keywordConvSubOptimizeTargetCodeToLabel(keywordSubOptimizeTargetCode);
                                const keywordSubOptimizeTargetOptions = ['获取成交量', '获取净成交'];
                                const keywordSubOptimizeTargetOptionHtml = keywordSubOptimizeTargetOptions.map(opt => `
                                    <button
                                        type="button"
                                        class="am-wxt-option-chip ${isSceneOptionMatch(opt, keywordSubOptimizeTargetValue) ? 'active' : ''}"
                                        data-scene-option="1"
                                        data-scene-option-field="${Utils.escapeHtml(keywordSubOptimizeTargetFieldKey)}"
                                        data-scene-option-value="${Utils.escapeHtml(opt)}"
                                    >${Utils.escapeHtml(opt)}</button>
                                `).join('');
                                bucket[keywordSubOptimizeTargetFieldKey] = keywordSubOptimizeTargetValue;
                                bucket[keywordSubOptimizeTargetFieldLabel] = keywordSubOptimizeTargetValue;
                                bucket[keywordSubOptimizeTargetApiFieldKey] = keywordSubOptimizeTargetCode;
                                const keywordAvgDealCostValue = resolveKeywordTargetCostValue({
                                    fieldKey: keywordAvgDealCostFieldKey,
                                    fieldLabel: keywordAvgDealCostFieldLabel,
                                    aliases: ['平均直接成交成本', '直接成交成本', '单次成交成本', '目标成交成本'],
                                    fallback: ''
                                });
                                if (keywordAvgDealCostValue) {
                                    bucket[keywordAvgDealCostFieldKey] = keywordAvgDealCostValue;
                                    bucket[keywordAvgDealCostFieldLabel] = keywordAvgDealCostValue;
                                }
                                const keywordAvgDealCostSwitchRaw = normalizeSceneSettingValue(
                                    bucket[keywordAvgDealCostSwitchFieldKey]
                                    || bucket[keywordAvgDealCostSwitchFieldLabel]
                                    || ''
                                );
                                const keywordAvgDealCostEnabled = keywordAvgDealCostSwitchRaw
                                    ? !/^(0|false|off|关闭|否)$/i.test(keywordAvgDealCostSwitchRaw)
                                    : (toNumber(keywordAvgDealCostValue, 0) > 0);
                                const keywordAvgDealCostSwitchValue = keywordAvgDealCostEnabled ? '开启' : '关闭';
                                bucket[keywordAvgDealCostSwitchFieldKey] = keywordAvgDealCostSwitchValue;
                                bucket[keywordAvgDealCostSwitchFieldLabel] = keywordAvgDealCostSwitchValue;
                                const keywordAvgDealCostVisibleLabel = keywordAiMaxEnabled
                                    ? '设置平均直接净成交成本（非必要）'
                                    : '设置平均成交成本';
                                keywordBidTargetLinkedRows.push(`
                                    <div class="am-wxt-scene-setting-row">
                                        <div class="am-wxt-scene-setting-label">${Utils.escapeHtml(keywordAvgDealCostVisibleLabel)}</div>
                                        <div class="am-wxt-setting-control am-wxt-setting-control-pair">
                                            <div class="am-wxt-option-line segmented">${keywordSubOptimizeTargetOptionHtml}</div>
                                            ${buildSceneSwitchControl(
                                    keywordAvgDealCostSwitchFieldKey,
                                    keywordAvgDealCostSwitchValue,
                                    '开启',
                                    '关闭'
                                )}
                                            <span class="am-wxt-scene-budget-guard-text">控成本投放：成本过低可能影响系统最大化获取成交量</span>
                                            ${buildInlineSceneInputControl(
                                    '目标成本',
                                    keywordAvgDealCostFieldKey,
                                    keywordAvgDealCostValue,
                                    '请输入',
                                    { unit: '元', hideLabel: keywordAiMaxEnabled }
                                )}
                                            <input
                                                class="am-wxt-hidden-control"
                                                data-scene-field="${Utils.escapeHtml(keywordSubOptimizeTargetFieldKey)}"
                                                value="${Utils.escapeHtml(keywordSubOptimizeTargetValue)}"
                                            />
                                            <input
                                                class="am-wxt-hidden-control"
                                                data-scene-field="${Utils.escapeHtml(keywordAvgDealCostSwitchFieldKey)}"
                                                value="${Utils.escapeHtml(keywordAvgDealCostSwitchValue)}"
                                            />
                                        </div>
                                    </div>
                                `);
                            } else if (keywordBidTargetCode === 'fav_cart') {
                                const keywordAvgCartCostValue = resolveKeywordTargetCostValue({
                                    fieldKey: keywordAvgCartCostFieldKey,
                                    fieldLabel: keywordAvgCartCostFieldLabel,
                                    aliases: ['收藏加购成本'],
                                    fallback: ''
                                });
                                if (keywordAvgCartCostValue) {
                                    bucket[keywordAvgCartCostFieldKey] = keywordAvgCartCostValue;
                                    bucket[keywordAvgCartCostFieldLabel] = keywordAvgCartCostValue;
                                }
                                const keywordAvgCartCostSwitchRaw = normalizeSceneSettingValue(
                                    bucket[keywordAvgCartCostSwitchFieldKey]
                                    || bucket[keywordAvgCartCostSwitchFieldLabel]
                                    || ''
                                );
                                const keywordAvgCartCostEnabled = keywordAvgCartCostSwitchRaw
                                    ? !/^(0|false|off|关闭|否)$/i.test(keywordAvgCartCostSwitchRaw)
                                    : (toNumber(keywordAvgCartCostValue, 0) > 0);
                                const keywordAvgCartCostSwitchValue = keywordAvgCartCostEnabled ? '开启' : '关闭';
                                bucket[keywordAvgCartCostSwitchFieldKey] = keywordAvgCartCostSwitchValue;
                                bucket[keywordAvgCartCostSwitchFieldLabel] = keywordAvgCartCostSwitchValue;
                                keywordBidTargetLinkedRows.push(`
                                    <div class="am-wxt-scene-setting-row">
                                        <div class="am-wxt-scene-setting-label">设置平均收藏加购成本</div>
                                        <div class="am-wxt-setting-control am-wxt-setting-control-pair">
                                            ${buildSceneSwitchControl(
                                    keywordAvgCartCostSwitchFieldKey,
                                    keywordAvgCartCostSwitchValue,
                                    '开启',
                                    '关闭'
                                )}
                                            <span class="am-wxt-scene-budget-guard-text">控成本投放：成本过低可能影响系统最大化获取收藏加购量</span>
                                            ${buildInlineSceneInputControl(
                                    '目标成本',
                                    keywordAvgCartCostFieldKey,
                                    keywordAvgCartCostValue,
                                    '请输入',
                                    { unit: '元' }
                                )}
                                            <input
                                                class="am-wxt-hidden-control"
                                                data-scene-field="${Utils.escapeHtml(keywordAvgCartCostSwitchFieldKey)}"
                                                value="${Utils.escapeHtml(keywordAvgCartCostSwitchValue)}"
                                            />
                                        </div>
                                    </div>
                                `);
                            } else if (keywordBidTargetCode === 'click') {
                                let keywordAvgClickCostValue = resolveKeywordTargetCostValue({
                                    fieldKey: keywordAvgClickCostFieldKey,
                                    fieldLabel: keywordAvgClickCostFieldLabel,
                                    aliases: ['点击成本'],
                                    fallback: ''
                                });
                                const keywordAvgClickCostTouched = !!(
                                    touchedBucket[keywordAvgClickCostFieldKey]
                                    || touchedBucket[keywordAvgClickCostFieldLabel]
                                );
                                if (!keywordAvgClickCostValue && !keywordAvgClickCostTouched) {
                                    keywordAvgClickCostValue = '0.5';
                                }
                                if (keywordAvgClickCostValue) {
                                    bucket[keywordAvgClickCostFieldKey] = keywordAvgClickCostValue;
                                    bucket[keywordAvgClickCostFieldLabel] = keywordAvgClickCostValue;
                                }
                                const keywordAvgClickCostSwitchRaw = normalizeSceneSettingValue(
                                    bucket[keywordAvgClickCostSwitchFieldKey]
                                    || bucket[keywordAvgClickCostSwitchFieldLabel]
                                    || ''
                                );
                                const keywordAvgClickCostEnabled = keywordAvgClickCostSwitchRaw
                                    ? !/^(0|false|off|关闭|否)$/i.test(keywordAvgClickCostSwitchRaw)
                                    : (toNumber(keywordAvgClickCostValue, 0) > 0);
                                const keywordAvgClickCostSwitchValue = keywordAvgClickCostEnabled ? '开启' : '关闭';
                                bucket[keywordAvgClickCostSwitchFieldKey] = keywordAvgClickCostSwitchValue;
                                bucket[keywordAvgClickCostSwitchFieldLabel] = keywordAvgClickCostSwitchValue;
                                keywordBidTargetLinkedRows.push(`
                                    <div class="am-wxt-scene-setting-row">
                                        <div class="am-wxt-scene-setting-label">设置平均点击成本</div>
                                        <div class="am-wxt-setting-control am-wxt-setting-control-pair">
                                            ${buildSceneSwitchControl(
                                    keywordAvgClickCostSwitchFieldKey,
                                    keywordAvgClickCostSwitchValue,
                                    '开启',
                                    '关闭'
                                )}
                                            <span class="am-wxt-scene-budget-guard-text">控成本投放：成本过低可能影响系统最大化获取点击量</span>
                                            ${buildInlineSceneInputControl(
                                    '目标成本',
                                    keywordAvgClickCostFieldKey,
                                    keywordAvgClickCostValue,
                                    '请输入',
                                    { unit: '元' }
                                )}
                                            <input
                                                class="am-wxt-hidden-control"
                                                data-scene-field="${Utils.escapeHtml(keywordAvgClickCostSwitchFieldKey)}"
                                                value="${Utils.escapeHtml(keywordAvgClickCostSwitchValue)}"
                                            />
                                        </div>
                                    </div>
                                `);
                            }
                            if (keywordBidTargetLinkedRows.length) {
                                const keywordLinkedInsertAt = keywordBidTargetLinkedInsertIndex > -1
                                    ? keywordBidTargetLinkedInsertIndex
                                    : staticRows.length;
                                staticRows.splice(keywordLinkedInsertAt, 0, ...keywordBidTargetLinkedRows);
                            }
                            pushKeywordCustomSettingRow({
                                label: '投放资源位/投放地域/分时折扣',
                                aliases: [
                                    '高级设置',
                                    '投放资源位/投放地域/投放时间',
                                    '资源位设置',
                                    '投放资源位',
                                    '投放时间',
                                    '投放日期',
                                    '发布日期',
                                    '分时折扣',
                                    '投放地域',
                                    '地域设置'
                                ],
                                options: ['默认投放', '自定义设置'],
                                defaultValue: advancedDefaultMode ? '默认投放' : '自定义设置',
                                strictOptions: true,
                                popup: {
                                    trigger: 'adzone',
                                    title: '高级设置',
                                    buttonLabel: '编辑设置',
                                    summary: describeKeywordAdvancedSummary({
                                        adzoneRaw,
                                        launchAreaRaw,
                                        launchPeriodRaw
                                    }),
                                    hiddenFields: [
                                        { fieldKey: adzoneField, value: adzoneRaw },
                                        { fieldKey: launchPeriodField, value: launchPeriodRaw },
                                        { fieldKey: launchAreaField, value: launchAreaRaw }
                                    ]
                                }
                            });
                        }
                    }
                }
                if (sceneName === '人群推广' && activeMarketingGoal === '自定义推广') {
                    const pushCrowdCustomSettingRow = ({
                        label = '',
                        aliases = [],
                        options = [],
                        defaultValue = '',
                        popup = null,
                        strictOptions = false
                    } = {}) => {
                        const normalizedLabel = normalizeSceneRenderFieldLabel(label) || label;
                        const key = normalizeSceneFieldKey(normalizedLabel);
                        if (!normalizedLabel || !key) return;
                        const aliasKeys = (Array.isArray(aliases) ? aliases : [])
                            .map(item => normalizeSceneFieldKey(item))
                            .filter(Boolean);
                        const optionSource = strictOptions === true
                            ? (Array.isArray(options) ? options : [])
                            : resolveSceneFieldOptions(profile, normalizedLabel)
                                .concat(Array.isArray(options) ? options : []);
                        const optionList = uniqueBy(
                            optionSource
                                .map(item => normalizeSceneSettingValue(item))
                                .filter(Boolean),
                            item => item
                        ).slice(0, 24);
                        const currentCandidate = normalizeSceneSettingValue(
                            bucket[key]
                            || aliasKeys.map(aliasKey => bucket[aliasKey]).find(val => normalizeSceneSettingValue(val))
                            || defaultValue
                            || optionList[0]
                            || ''
                        );
                        let currentValue = currentCandidate;
                        if (strictOptions === true && optionList.length) {
                            const matchedCurrent = pickSceneValueFromOptions(currentCandidate, optionList);
                            if (matchedCurrent) {
                                currentValue = matchedCurrent;
                            } else {
                                const matchedDefault = pickSceneValueFromOptions(defaultValue, optionList);
                                currentValue = matchedDefault || optionList[0];
                            }
                        }
                        if (currentValue) {
                            bucket[key] = currentValue;
                            aliasKeys.forEach(aliasKey => {
                                if (!aliasKey || touchedBucket[aliasKey]) return;
                                if (normalizeSceneSettingValue(bucket[aliasKey])) return;
                                bucket[aliasKey] = currentValue;
                            });
                        }
                        const popupControlHtml = isPlainObject(popup) ? buildScenePopupControl(popup) : '';
                        staticRows.push(buildSceneOptionRow(normalizedLabel, key, optionList, currentValue, {
                            segmented: true,
                            inlineControlHtml: popupControlHtml
                        }));
                    };
                    const crowdCampaignField = 'campaign.crowdList';
                    const crowdAdgroupField = 'adgroup.rightList';
                    const crowdItemIdField = 'campaign.itemIdList';
                    const crowdItemSelectedModeField = 'campaign.itemSelectedMode';
                    const crowdFilterField = 'campaign.crowdFilterConfig';
                    const adzoneField = 'campaign.adzoneList';
                    const launchPeriodField = 'campaign.launchPeriodList';
                    const launchAreaField = 'campaign.launchAreaStrList';
                    const budgetGuardSwitchField = 'campaign.budgetGuardSwitch';
                    const budgetGuardConfigField = 'campaign.budgetGuardConfig';
                    const crowdBidTargetFieldLabel = '出价目标';
                    const crowdBidTargetFieldKey = normalizeSceneFieldKey(crowdBidTargetFieldLabel);
                    const crowdCampaignFieldKey = normalizeSceneFieldKey(crowdCampaignField);
                    const crowdAdgroupFieldKey = normalizeSceneFieldKey(crowdAdgroupField);
                    const crowdItemIdFieldKey = normalizeSceneFieldKey(crowdItemIdField);
                    const crowdItemSelectedModeFieldKey = normalizeSceneFieldKey(crowdItemSelectedModeField);
                    const adzoneFieldKey = normalizeSceneFieldKey(adzoneField);
                    const crowdCampaignTouched = touchedBucket[crowdCampaignField] === true
                        || touchedBucket[crowdCampaignFieldKey] === true;
                    const crowdAdgroupTouched = touchedBucket[crowdAdgroupField] === true
                        || touchedBucket[crowdAdgroupFieldKey] === true;
                    const crowdItemTouched = touchedBucket[crowdItemIdField] === true
                        || touchedBucket[crowdItemIdFieldKey] === true;
                    const crowdItemSelectedModeTouched = touchedBucket[crowdItemSelectedModeField] === true
                        || touchedBucket[crowdItemSelectedModeFieldKey] === true;
                    const adzoneTouched = touchedBucket[adzoneField] === true
                        || touchedBucket[adzoneFieldKey] === true;
                    const wizardCrowdRaw = (Array.isArray(wizardState.crowdList) && wizardState.crowdList.length)
                        ? JSON.stringify(wizardState.crowdList)
                        : '';
                    const expectedCrowdBizCode = normalizeSceneBizCode(
                        wizardState?.draft?.bizCode
                        || parseRouteParamFromHash('bizCode')
                        || ''
                    );
                    const resolveActiveCrowdGoalForScene = (targetSceneName = '') => {
                        const targetScene = String(targetSceneName || '').trim();
                        if (!targetScene) return '';
                        const targetBucket = ensureSceneSettingBucket(targetScene);
                        if (!isPlainObject(targetBucket)) return '';
                        return normalizeGoalCandidateLabel(
                            targetBucket[goalFieldKey]
                            || goalAliasKeys.map(key => targetBucket[key]).find(Boolean)
                            || ''
                        );
                    };
                    const hasWizardAddedItems = Array.isArray(wizardState.addedItems)
                        && wizardState.addedItems.some(item => toIdValue(item?.materialId || item?.itemId));
                    if (!hasWizardAddedItems && !wizardState.crowdCustomDefaultItemPending) {
                        wizardState.crowdCustomDefaultItemPending = ensureSceneDefaultItemForScene({
                            sceneName: '人群推广',
                            force: false,
                            silent: false,
                            rerender: true
                        })
                            .catch(err => {
                                log.warn('人群自定义场景自动补齐默认商品失败:', err?.message || err);
                            })
                            .finally(() => {
                                wizardState.crowdCustomDefaultItemPending = null;
                            });
                    }
                    if (!Array.isArray(runtimeCache.nativeCrowdCustomBidTargetOptions) && !runtimeCache.nativeCrowdCustomBidTargetPending) {
                        runtimeCache.nativeCrowdCustomBidTargetPending = resolveNativeCrowdCustomBidTargetOptionsFromVframes({
                            expectedBizCode: expectedCrowdBizCode
                        })
                            .then((list) => {
                                if (!Array.isArray(list) || !list.length) return;
                                const activeSceneName = String(wizardState.els.sceneSelect?.value || wizardState.draft?.sceneName || '').trim();
                                const activeGoal = resolveActiveCrowdGoalForScene(activeSceneName);
                                if (activeSceneName === '人群推广' && activeGoal === '自定义推广') {
                                    renderSceneDynamicConfig();
                                }
                            })
                            .catch(() => { })
                            .finally(() => {
                                runtimeCache.nativeCrowdCustomBidTargetPending = null;
                            });
                    }
                    if (!Array.isArray(runtimeCache.nativeAdzoneList) && !runtimeCache.nativeAdzonePending) {
                        runtimeCache.nativeAdzonePending = resolveNativeAdzoneListFromVframes({
                            expectedBizCode: expectedCrowdBizCode
                        })
                            .then((list) => {
                                if (!Array.isArray(list) || !list.length) return;
                                const activeSceneName = String(wizardState.els.sceneSelect?.value || wizardState.draft?.sceneName || '').trim();
                                const activeGoal = resolveActiveCrowdGoalForScene(activeSceneName);
                                if (activeSceneName === '人群推广' && activeGoal === '自定义推广') {
                                    renderSceneDynamicConfig();
                                }
                            })
                            .catch(() => { })
                            .finally(() => {
                                runtimeCache.nativeAdzonePending = null;
                            });
                    }
                    const crowdCampaignRawCandidate = normalizeSceneSettingValue(
                        bucket[crowdCampaignField]
                        || bucket[crowdCampaignFieldKey]
                        || ''
                    );
                    const crowdAdgroupRawCandidate = normalizeSceneSettingValue(
                        bucket[crowdAdgroupField]
                        || bucket[crowdAdgroupFieldKey]
                        || ''
                    );
                    const shouldSyncCrowdCampaignFromWizard = !crowdCampaignTouched
                        && !!wizardCrowdRaw
                        && (!crowdCampaignRawCandidate || crowdCampaignRawCandidate === '[]');
                    const shouldSyncCrowdAdgroupFromWizard = !crowdAdgroupTouched
                        && !!wizardCrowdRaw
                        && (!crowdAdgroupRawCandidate || crowdAdgroupRawCandidate === '[]');
                    const crowdCampaignRaw = shouldSyncCrowdCampaignFromWizard
                        ? wizardCrowdRaw
                        : (crowdCampaignRawCandidate || '[]');
                    const crowdAdgroupRaw = shouldSyncCrowdAdgroupFromWizard
                        ? wizardCrowdRaw
                        : (crowdAdgroupRawCandidate || '[]');
                    const wizardItemIdList = uniqueBy(
                        (Array.isArray(wizardState.addedItems) ? wizardState.addedItems : [])
                            .map(item => String(toIdValue(item?.materialId || item?.itemId || '')).trim())
                            .filter(item => /^\d{4,}$/.test(item)),
                        item => item
                    ).slice(0, WIZARD_MAX_ITEMS);
                    const crowdItemIdRawCandidate = normalizeSceneSettingValue(
                        bucket[crowdItemIdField]
                        || bucket[crowdItemIdFieldKey]
                        || ''
                    );
                    const crowdItemIdListFromBucket = normalizeScenePopupItemIdList(crowdItemIdRawCandidate);
                    const crowdItemIdList = (
                        wizardItemIdList.length
                            ? wizardItemIdList
                            : (crowdItemIdListFromBucket.length ? crowdItemIdListFromBucket : [SCENE_SYNC_DEFAULT_ITEM_ID])
                    ).slice(0, WIZARD_MAX_ITEMS);
                    const crowdItemIdRaw = JSON.stringify(
                        crowdItemIdList.map((itemId) => {
                            const num = Number(itemId);
                            return Number.isFinite(num) && num > 0 ? num : itemId;
                        })
                    );
                    const crowdItemSelectedModeValue = 'user_define';
                    const launchPeriodList = parseScenePopupJsonArray(
                        normalizeSceneSettingValue(
                            bucket[launchPeriodField]
                            || bucket[normalizeSceneFieldKey(launchPeriodField)]
                            || ''
                        ),
                        buildDefaultLaunchPeriodList()
                    );
                    const launchPeriodRaw = JSON.stringify(
                        Array.isArray(launchPeriodList) && launchPeriodList.length
                            ? launchPeriodList
                            : buildDefaultLaunchPeriodList()
                    );
                    const launchAreaList = uniqueBy(
                        parseScenePopupJsonArray(
                            normalizeSceneSettingValue(
                                bucket[launchAreaField]
                                || bucket[normalizeSceneFieldKey(launchAreaField)]
                                || '["all"]'
                            ),
                            ['all']
                        )
                            .map(item => String(item || '').trim())
                            .filter(Boolean),
                        item => item
                    );
                    const launchAreaRaw = JSON.stringify(
                        launchAreaList.length ? launchAreaList : ['all']
                    );
                    const adzoneRawValue = normalizeSceneSettingValue(
                        bucket[adzoneField]
                        || bucket[normalizeSceneFieldKey(adzoneField)]
                        || '[]'
                    ) || '[]';
                    let adzoneList = normalizeAdzoneListForAdvanced(adzoneRawValue);
                    const hasRealAdzoneData = adzoneList.some((item, idx) => {
                        const name = normalizeSceneSettingValue(
                            item?.adzoneName
                            || item?.name
                            || item?.title
                            || ''
                        );
                        const code = normalizeSceneSettingValue(
                            item?.adzoneCode
                            || item?.adzoneId
                            || item?.code
                            || item?.id
                            || ''
                        ) || `native_adzone_${idx + 1}`;
                        if (!name && !code) return false;
                        if (/^资源位\d+$/.test(name)) return false;
                        if (/^native_adzone_/i.test(code)) return false;
                        return true;
                    });
                    const cachedNativeAdzoneList = Array.isArray(runtimeCache.nativeAdzoneList)
                        ? runtimeCache.nativeAdzoneList.filter(item => isPlainObject(item))
                        : [];
                    if (!adzoneTouched && (!adzoneList.length || !hasRealAdzoneData) && cachedNativeAdzoneList.length) {
                        adzoneList = normalizeAdzoneListForAdvanced(JSON.stringify(cachedNativeAdzoneList));
                    }
                    const adzoneRaw = JSON.stringify(adzoneList);
                    const crowdFilterRawValue = normalizeSceneSettingValue(
                        bucket[crowdFilterField]
                        || bucket[normalizeSceneFieldKey(crowdFilterField)]
                        || '{}'
                    ) || '{}';
                    const crowdFilterConfig = normalizeCrowdFilterConfig(crowdFilterRawValue);
                    const crowdFilterRaw = JSON.stringify(crowdFilterConfig);
                    const budgetGuardSwitchRaw = normalizeSceneSettingValue(
                        bucket[budgetGuardSwitchField]
                        || bucket[normalizeSceneFieldKey(budgetGuardSwitchField)]
                        || '开启'
                    );
                    const budgetGuardSwitchValue = /^(0|false|off|关闭|否)$/i.test(budgetGuardSwitchRaw || '')
                        ? '关闭'
                        : '开启';
                    const budgetGuardConfigRawValue = normalizeSceneSettingValue(
                        bucket[budgetGuardConfigField]
                        || bucket[normalizeSceneFieldKey(budgetGuardConfigField)]
                        || '{}'
                    ) || '{}';
                    const budgetGuardConfig = normalizeBudgetGuardConfig(budgetGuardConfigRawValue);
                    const budgetGuardConfigRaw = JSON.stringify(budgetGuardConfig);
                    bucket[crowdCampaignField] = crowdCampaignRaw;
                    bucket[crowdAdgroupField] = crowdAdgroupRaw;
                    bucket[crowdItemIdField] = crowdItemIdRaw;
                    bucket[crowdItemSelectedModeField] = crowdItemSelectedModeValue;
                    if (!crowdCampaignTouched) bucket[crowdCampaignFieldKey] = crowdCampaignRaw;
                    if (!crowdAdgroupTouched) bucket[crowdAdgroupFieldKey] = crowdAdgroupRaw;
                    if (!crowdItemTouched) bucket[crowdItemIdFieldKey] = crowdItemIdRaw;
                    if (!crowdItemSelectedModeTouched) bucket[crowdItemSelectedModeFieldKey] = crowdItemSelectedModeValue;
                    bucket[crowdFilterField] = crowdFilterRaw;
                    bucket[adzoneField] = adzoneRaw;
                    bucket[launchPeriodField] = launchPeriodRaw;
                    bucket[launchAreaField] = launchAreaRaw;
                    bucket[budgetGuardSwitchField] = budgetGuardSwitchValue;
                    bucket[budgetGuardConfigField] = budgetGuardConfigRaw;
                    const needTargetCrowdRaw = normalizeSceneSettingValue(
                        bucket.campaign?.needTargetCrowd
                        || bucket['campaign.needTargetCrowd']
                        || bucket[normalizeSceneFieldKey('campaign.needTargetCrowd')]
                        || '1'
                    );
                    const aiCrowdListSwitchRaw = normalizeSceneSettingValue(
                        bucket.campaign?.aiXiaowanCrowdListSwitch
                        || bucket['campaign.aiXiaowanCrowdListSwitch']
                        || bucket[normalizeSceneFieldKey('campaign.aiXiaowanCrowdListSwitch')]
                        || needTargetCrowdRaw
                        || '1'
                    );
                    const isPriorityCrowdEnabled = !/^(0|false|off|关闭|否)$/i.test(aiCrowdListSwitchRaw || '1');
                    const launchAreaIsAll = !launchAreaList.length || (launchAreaList.length === 1 && /^all$/i.test(launchAreaList[0]));
                    const launchPeriodIsAllDay = launchPeriodList.length > 0 && launchPeriodList.every(item => {
                        const spanList = Array.isArray(item?.timeSpanList) ? item.timeSpanList : [];
                        return spanList.length === 1 && String(spanList[0]?.time || '').trim() === '00:00-24:00';
                    });
                    const adzoneEnabledCount = adzoneList.filter(item => isAdzoneStatusEnabled(item)).length;
                    const adzonePremiumDefaultMode = !adzoneList.length || adzoneEnabledCount === adzoneList.length;
                    const launchSettingDefaultMode = launchAreaIsAll && launchPeriodIsAllDay;
                    const hasCrowdData = parseScenePopupJsonArray(crowdCampaignRaw, []).length > 0
                        || parseScenePopupJsonArray(crowdAdgroupRaw, []).length > 0;
                    const crowdBidTypeFieldLabel = '出价方式';
                    const crowdBidTypeFieldKey = normalizeSceneFieldKey(crowdBidTypeFieldLabel);
                    const crowdBidTypeSeed = normalizeSceneSettingValue(
                        bucket[crowdBidTypeFieldKey]
                        || bucket[crowdBidTypeFieldLabel]
                        || bucket[normalizeSceneFieldKey('campaign.bidTypeV2')]
                        || ''
                    );
                    const crowdBidMode = normalizeBidMode(
                        mapSceneBidTypeValue(crowdBidTypeSeed, '人群推广') || crowdBidTypeSeed,
                        'manual'
                    );
                    const crowdBidTypeLabel = crowdBidMode === 'smart' ? '智能出价' : '手动出价';
                    bucket[crowdBidTypeFieldKey] = crowdBidTypeLabel;
                    bucket[crowdBidTypeFieldLabel] = crowdBidTypeLabel;
                    const nativeCrowdBidTargetOptions = Array.isArray(runtimeCache.nativeCrowdCustomBidTargetOptions)
                        ? runtimeCache.nativeCrowdCustomBidTargetOptions
                        : [];
                    const crowdBidTargetLabelByCode = new Map(
                        CROWD_CUSTOM_BID_TARGET_ORDER.map(code => [
                            code,
                            CROWD_CUSTOM_BID_TARGET_LABEL_MAP[code] || crowdCustomBidTargetCodeToLabel(code)
                        ])
                    );
                    nativeCrowdBidTargetOptions.forEach((item) => {
                        const code = normalizeCrowdCustomBidTargetCode(
                            item?.code || item?.label || '',
                            { strict: true, fallback: '' }
                        );
                        if (!code) return;
                        const label = normalizeSceneSettingValue(item?.label || '')
                            || CROWD_CUSTOM_BID_TARGET_LABEL_MAP[code]
                            || crowdCustomBidTargetCodeToLabel(code);
                        crowdBidTargetLabelByCode.set(code, label);
                    });
                    const crowdSmartBidTargetLabelByCode = new Map(
                        CROWD_CUSTOM_SMART_BID_TARGET_ORDER.map(code => [
                            code,
                            CROWD_CUSTOM_SMART_BID_TARGET_LABEL_MAP[code] || crowdCustomSmartBidTargetCodeToLabel(code)
                        ])
                    );
                    const crowdBidTargetSeed = normalizeSceneSettingValue(
                        bucket[crowdBidTargetFieldKey]
                        || bucket[crowdBidTargetFieldLabel]
                        || ''
                    );
                    const crowdBidTargetCode = crowdBidMode === 'smart'
                        ? normalizeCrowdCustomSmartBidTargetCode(crowdBidTargetSeed, { fallback: 'display_roi' })
                        : normalizeCrowdCustomBidTargetCode(crowdBidTargetSeed, { fallback: 'display_pay' });
                    const crowdBidTargetOptions = (crowdBidMode === 'smart'
                        ? CROWD_CUSTOM_SMART_BID_TARGET_ORDER
                        : CROWD_CUSTOM_BID_TARGET_ORDER
                    ).map(code => (
                        crowdBidMode === 'smart'
                            ? (
                                crowdSmartBidTargetLabelByCode.get(code)
                                || CROWD_CUSTOM_SMART_BID_TARGET_LABEL_MAP[code]
                                || crowdCustomSmartBidTargetCodeToLabel(code)
                            )
                            : (
                                crowdBidTargetLabelByCode.get(code)
                                || CROWD_CUSTOM_BID_TARGET_LABEL_MAP[code]
                                || crowdCustomBidTargetCodeToLabel(code)
                            )
                    ));
                    const crowdBidTargetLabel = crowdBidMode === 'smart'
                        ? (
                            crowdSmartBidTargetLabelByCode.get(crowdBidTargetCode)
                            || CROWD_CUSTOM_SMART_BID_TARGET_LABEL_MAP[crowdBidTargetCode]
                            || crowdCustomSmartBidTargetCodeToLabel(crowdBidTargetCode)
                        )
                        : (
                            crowdBidTargetLabelByCode.get(crowdBidTargetCode)
                            || CROWD_CUSTOM_BID_TARGET_LABEL_MAP[crowdBidTargetCode]
                            || crowdCustomBidTargetCodeToLabel(crowdBidTargetCode)
                        );
                    bucket[crowdBidTargetFieldKey] = crowdBidTargetLabel;
                    bucket[crowdBidTargetFieldLabel] = crowdBidTargetLabel;
                    const crowdFilterSummary = describeCrowdFilterSummary(crowdFilterRaw);
                    const budgetGuardSummary = describeBudgetGuardSummary(budgetGuardConfigRaw);
                    const launchSettingSummary = `${describeLaunchAreaSummary(launchAreaRaw)}｜${describeLaunchPeriodSummary(launchPeriodRaw)}`;
                    staticRows.push(`
                        <div class="am-wxt-scene-setting-row">
                            <div class="am-wxt-scene-setting-label">选择推广商品</div>
                            <div class="am-wxt-setting-control">
                                <input
                                    class="am-wxt-hidden-control"
                                    data-scene-field="${Utils.escapeHtml(crowdItemSelectedModeField)}"
                                    value="${Utils.escapeHtml(crowdItemSelectedModeValue)}"
                                />
                                ${buildScenePopupControl({
                        trigger: 'itemSelect',
                        title: '添加商品',
                        buttonLabel: '添加商品',
                        summary: describeCrowdItemSummary(crowdItemIdRaw),
                        hiddenFields: [
                            { fieldKey: crowdItemIdField, value: crowdItemIdRaw }
                        ]
                    })}
                            </div>
                        </div>
                    `);
                    pushCrowdCustomSettingRow({
                        label: '出价方式',
                        options: ['智能出价', '手动出价'],
                        defaultValue: crowdBidTypeLabel,
                        strictOptions: true
                    });
                    pushCrowdCustomSettingRow({
                        label: '出价目标',
                        aliases: ['优化目标', '人群优化目标', '客户口径设置', '人群价值设置'],
                        options: crowdBidTargetOptions,
                        defaultValue: crowdBidTargetLabel,
                        strictOptions: true
                    });
                    if (crowdBidMode === 'manual') {
                        const crowdTargetInitialList = uniqueBy(
                            parseScenePopupJsonArray(crowdAdgroupRaw, [])
                                .concat(parseScenePopupJsonArray(crowdCampaignRaw, []))
                                .filter(item => isPlainObject(item)),
                            (item, idx) => getSceneCrowdTargetKey(item, idx)
                        ).slice(0, 100);
                        const crowdTargetBatchSeed = crowdTargetInitialList.length
                            ? normalizeSceneCrowdTargetBid(crowdTargetInitialList[0], 0.3)
                            : '';
                        const crowdTargetRowsHtml = crowdTargetInitialList.length
                            ? crowdTargetInitialList.map((item, idx) => {
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
                            }).join('')
                            : '<div class="am-wxt-crowd-target-empty">请先添加目标人群</div>';
                        staticRows.push(`
                            <div class="am-wxt-scene-setting-row">
                                <div class="am-wxt-scene-setting-label">目标人群</div>
                                <div class="am-wxt-setting-control">
                                    <div class="am-wxt-crowd-target-panel" data-scene-crowd-target-panel="1">
                                        <div class="am-wxt-crowd-target-toolbar">
                                            <div class="am-wxt-crowd-target-batch">
                                                <span>批量修改为</span>
                                                <input
                                                    type="number"
                                                    min="0.01"
                                                    max="999"
                                                    step="0.01"
                                                    value="${Utils.escapeHtml(crowdTargetBatchSeed ? crowdTargetBatchSeed.toFixed(2) : '')}"
                                                    data-scene-crowd-target-batch-input="1"
                                                    placeholder="0.30"
                                                />
                                                <span>元</span>
                                                <button type="button" class="am-wxt-btn" data-scene-crowd-target-batch-apply="1">批量应用</button>
                                            </div>
                                            <div class="am-wxt-crowd-target-view-tips">
                                                <span>卡片视图</span>
                                                <span class="active">表格视图</span>
                                            </div>
                                            <button type="button" class="am-wxt-btn" data-scene-crowd-target-open-popup="1">${crowdTargetInitialList.length ? '编辑人群' : '添加人群'}</button>
                                        </div>
                                        <div class="am-wxt-crowd-target-summary" data-scene-crowd-target-summary="1">${Utils.escapeHtml(crowdTargetInitialList.length ? `已配置 ${crowdTargetInitialList.length} 条` : '未配置人群')}</div>
                                        <div class="am-wxt-crowd-target-list" data-scene-crowd-target-list="1">${crowdTargetRowsHtml}</div>
                                        <input class="am-wxt-hidden-control" data-scene-crowd-target-json="campaign" value="${Utils.escapeHtml(crowdCampaignRaw)}" />
                                        <input class="am-wxt-hidden-control" data-scene-crowd-target-json="adgroup" value="${Utils.escapeHtml(crowdAdgroupRaw)}" />
                                    </div>
                                </div>
                            </div>
                        `);
                    }
                    const crowdRoiLevelFieldLabel = '设置7日投产比';
                    const crowdRoiLevelFieldKey = normalizeSceneFieldKey(crowdRoiLevelFieldLabel);
                    const crowdRoiCustomFieldLabel = '目标投产比';
                    const crowdRoiCustomFieldKey = normalizeSceneFieldKey(crowdRoiCustomFieldLabel);
                    const crowdAvgDealCostSwitchFieldLabel = '设置平均成交成本';
                    const crowdAvgDealCostSwitchFieldKey = normalizeSceneFieldKey(crowdAvgDealCostSwitchFieldLabel);
                    const crowdAvgDealCostFieldLabel = '平均直接成交成本';
                    const crowdAvgDealCostFieldKey = normalizeSceneFieldKey(crowdAvgDealCostFieldLabel);
                    const crowdAvgCartCostSwitchFieldLabel = '设置平均收藏加购成本';
                    const crowdAvgCartCostSwitchFieldKey = normalizeSceneFieldKey(crowdAvgCartCostSwitchFieldLabel);
                    const crowdAvgCartCostFieldLabel = '平均收藏加购成本';
                    const crowdAvgCartCostFieldKey = normalizeSceneFieldKey(crowdAvgCartCostFieldLabel);
                    if (crowdBidMode === 'smart') {
                        if (crowdBidTargetCode === 'display_roi') {
                            const crowdRoiPresetOptions = ['1.79', '2.24', '2.97', '自定义'];
                            const crowdRoiCustomValue = normalizeSceneSettingValue(
                                bucket[crowdRoiCustomFieldKey]
                                || bucket[crowdRoiCustomFieldLabel]
                                || ''
                            );
                            const crowdRoiSeed = normalizeSceneSettingValue(
                                bucket[crowdRoiLevelFieldKey]
                                || bucket[crowdRoiLevelFieldLabel]
                                || crowdRoiCustomValue
                                || '2.24'
                            );
                            let crowdRoiPresetValue = pickSceneValueFromOptions(crowdRoiSeed, crowdRoiPresetOptions);
                            if (!crowdRoiPresetValue) {
                                crowdRoiPresetValue = crowdRoiCustomValue ? '自定义' : '2.24';
                            }
                            bucket[crowdRoiLevelFieldKey] = crowdRoiPresetValue;
                            bucket[crowdRoiLevelFieldLabel] = crowdRoiPresetValue;
                            staticRows.push(buildSceneOptionRow(
                                crowdRoiLevelFieldLabel,
                                crowdRoiLevelFieldKey,
                                crowdRoiPresetOptions,
                                crowdRoiPresetValue,
                                {
                                    segmented: true,
                                    inlineControlHtml: buildInlineSceneInputControl(
                                        '自定义',
                                        crowdRoiCustomFieldKey,
                                        crowdRoiCustomValue,
                                        '例如 2.24'
                                    )
                                }
                            ));
                        } else if (crowdBidTargetCode === 'display_pay') {
                            const crowdAvgDealCostValue = normalizeSceneSettingValue(
                                bucket[crowdAvgDealCostFieldKey]
                                || bucket[crowdAvgDealCostFieldLabel]
                                || ''
                            );
                            const crowdAvgDealCostSwitchRaw = normalizeSceneSettingValue(
                                bucket[crowdAvgDealCostSwitchFieldKey]
                                || bucket[crowdAvgDealCostSwitchFieldLabel]
                                || ''
                            );
                            const crowdAvgDealCostEnabled = crowdAvgDealCostSwitchRaw
                                ? !/^(0|false|off|关闭|否)$/i.test(crowdAvgDealCostSwitchRaw)
                                : (toNumber(crowdAvgDealCostValue, 0) > 0);
                            const crowdAvgDealCostSwitchValue = crowdAvgDealCostEnabled ? '开启' : '关闭';
                            bucket[crowdAvgDealCostSwitchFieldKey] = crowdAvgDealCostSwitchValue;
                            bucket[crowdAvgDealCostSwitchFieldLabel] = crowdAvgDealCostSwitchValue;
                            staticRows.push(`
                                <div class="am-wxt-scene-setting-row">
                                    <div class="am-wxt-scene-setting-label">设置平均成交成本</div>
                                    <div class="am-wxt-setting-control am-wxt-setting-control-pair">
                                        ${buildSceneSwitchControl(
                                crowdAvgDealCostSwitchFieldKey,
                                crowdAvgDealCostSwitchValue,
                                '开启',
                                '关闭'
                            )}
                                        <span class="am-wxt-scene-budget-guard-text">控成本投放：成本过低可能影响系统最大化获取成交量</span>
                                        ${buildInlineSceneInputControl(
                                '目标成本',
                                crowdAvgDealCostFieldKey,
                                crowdAvgDealCostValue,
                                '请输入',
                                { unit: '元' }
                            )}
                                        <input
                                            class="am-wxt-hidden-control"
                                            data-scene-field="${Utils.escapeHtml(crowdAvgDealCostSwitchFieldKey)}"
                                            value="${Utils.escapeHtml(crowdAvgDealCostSwitchValue)}"
                                        />
                                    </div>
                                </div>
                            `);
                        } else if (crowdBidTargetCode === 'display_cart') {
                            const crowdAvgCartCostValue = normalizeSceneSettingValue(
                                bucket[crowdAvgCartCostFieldKey]
                                || bucket[crowdAvgCartCostFieldLabel]
                                || ''
                            );
                            const crowdAvgCartCostSwitchRaw = normalizeSceneSettingValue(
                                bucket[crowdAvgCartCostSwitchFieldKey]
                                || bucket[crowdAvgCartCostSwitchFieldLabel]
                                || ''
                            );
                            const crowdAvgCartCostEnabled = crowdAvgCartCostSwitchRaw
                                ? !/^(0|false|off|关闭|否)$/i.test(crowdAvgCartCostSwitchRaw)
                                : (toNumber(crowdAvgCartCostValue, 0) > 0);
                            const crowdAvgCartCostSwitchValue = crowdAvgCartCostEnabled ? '开启' : '关闭';
                            bucket[crowdAvgCartCostSwitchFieldKey] = crowdAvgCartCostSwitchValue;
                            bucket[crowdAvgCartCostSwitchFieldLabel] = crowdAvgCartCostSwitchValue;
                            staticRows.push(`
                                <div class="am-wxt-scene-setting-row">
                                    <div class="am-wxt-scene-setting-label">设置平均收藏加购成本</div>
                                    <div class="am-wxt-setting-control am-wxt-setting-control-pair">
                                        ${buildSceneSwitchControl(
                                crowdAvgCartCostSwitchFieldKey,
                                crowdAvgCartCostSwitchValue,
                                '开启',
                                '关闭'
                            )}
                                        <span class="am-wxt-scene-budget-guard-text">控成本投放：成本过低可能影响系统最大化获取收藏加购量</span>
                                        ${buildInlineSceneInputControl(
                                '目标成本',
                                crowdAvgCartCostFieldKey,
                                crowdAvgCartCostValue,
                                '请输入',
                                { unit: '元' }
                            )}
                                        <input
                                            class="am-wxt-hidden-control"
                                            data-scene-field="${Utils.escapeHtml(crowdAvgCartCostSwitchFieldKey)}"
                                            value="${Utils.escapeHtml(crowdAvgCartCostSwitchValue)}"
                                        />
                                    </div>
                                </div>
                            `);
                        }
                    }
                    pushCrowdCustomSettingRow({
                        label: '选择方式',
                        options: ['自定义人群', 'AI推人'],
                        defaultValue: isPriorityCrowdEnabled ? 'AI推人' : '自定义人群',
                        strictOptions: true
                    });
                    pushCrowdCustomSettingRow({
                        label: '人群设置',
                        aliases: ['设置人群', '设置拉新人群', '种子人群'],
                        options: ['手动添加人群', '关闭'],
                        defaultValue: hasCrowdData ? '手动添加人群' : '关闭',
                        strictOptions: true,
                        popup: {
                            trigger: 'crowd',
                            title: '手动添加人群',
                            buttonLabel: '手动添加人群',
                            summary: describeCrowdSummary(crowdCampaignRaw, crowdAdgroupRaw),
                            hiddenFields: [
                                { fieldKey: crowdCampaignField, value: crowdCampaignRaw },
                                { fieldKey: crowdAdgroupField, value: crowdAdgroupRaw }
                            ]
                        }
                    });
                    staticRows.push(`
                        <div class="am-wxt-scene-setting-row">
                            <div class="am-wxt-scene-setting-label">过滤人群</div>
                            <div class="am-wxt-setting-control">
                                ${buildScenePopupControl({
                        trigger: 'crowdFilter',
                        title: '设置过滤人群',
                        buttonLabel: '设置过滤人群',
                        summary: crowdFilterSummary,
                        hiddenFields: [
                            { fieldKey: crowdFilterField, value: crowdFilterRaw }
                        ]
                    })}
                            </div>
                        </div>
                    `);
                    pushCrowdCustomSettingRow({
                        label: '资源位溢价',
                        aliases: ['投放资源位', '资源位设置', '投放资源位/投放地域/投放时间', '投放资源位/投放地域/分时折扣', '高级设置'],
                        options: ['默认溢价', '自定义溢价'],
                        defaultValue: adzonePremiumDefaultMode ? '默认溢价' : '自定义溢价',
                        strictOptions: true,
                        popup: {
                            trigger: 'adzonePremium',
                            title: '资源位溢价',
                            buttonLabel: '编辑资源位',
                            summary: describeAdzoneSummary(adzoneRaw),
                            hiddenFields: [
                                { fieldKey: adzoneField, value: adzoneRaw }
                            ]
                        }
                    });
                    staticRows.push(`
                        <div class="am-wxt-scene-setting-row">
                            <div class="am-wxt-scene-setting-label">优质计划防停投</div>
                            <div class="am-wxt-setting-control am-wxt-setting-control-pair">
                                <div class="am-wxt-scene-budget-guard-main">
                                    ${buildSceneSwitchControl(
                        budgetGuardSwitchField,
                        budgetGuardSwitchValue,
                        '开启',
                        '关闭'
                    )}
                                    <span class="am-wxt-scene-budget-guard-text">提升预算续航，防止成交损失</span>
                                </div>
                                ${buildScenePopupControl({
                        trigger: 'budgetGuard',
                        title: '优质计划防停投',
                        buttonLabel: '修改',
                        summary: budgetGuardSummary,
                        hiddenFields: [
                            { fieldKey: budgetGuardConfigField, value: budgetGuardConfigRaw }
                        ]
                    })}
                                <input
                                    class="am-wxt-hidden-control"
                                    data-scene-field="${Utils.escapeHtml(budgetGuardSwitchField)}"
                                    value="${Utils.escapeHtml(budgetGuardSwitchValue)}"
                                />
                            </div>
                        </div>
                    `);
                    pushCrowdCustomSettingRow({
                        label: '投放地域/投放时间',
                        aliases: ['投放时间', '投放地域', '投放日期', '分时折扣', '投放资源位/投放地域/投放时间', '投放资源位/投放地域/分时折扣', '高级设置'],
                        options: ['默认投放', '自定义设置'],
                        defaultValue: launchSettingDefaultMode ? '默认投放' : '自定义设置',
                        strictOptions: true,
                        popup: {
                            trigger: 'launchSetting',
                            title: '投放地域/投放时间',
                            buttonLabel: '编辑设置',
                            summary: launchSettingSummary,
                            hiddenFields: [
                                { fieldKey: launchPeriodField, value: launchPeriodRaw },
                                { fieldKey: launchAreaField, value: launchAreaRaw }
                            ]
                        }
                    });
                }
                if (sceneName === '货品全站推广') {
                    const bidTypeKey = normalizeSceneFieldKey('出价方式');
                    const bidTypeOptions = resolveSceneFieldOptions(profile, '出价方式');
                    const bidTypeValue = normalizeSceneSettingValue(
                        bucket[bidTypeKey]
                        || SCENE_SPEC_FIELD_FALLBACK?.['货品全站推广']?.出价方式
                        || bidTypeOptions[0]
                        || ''
                    );
                    if (bidTypeValue) bucket[bidTypeKey] = bidTypeValue;
                    staticRows.push(buildSceneOptionRow('出价方式', bidTypeKey, bidTypeOptions, bidTypeValue, { segmented: true }));

                    const bidTargetKey = normalizeSceneFieldKey('出价目标');
                    const bidTargetOptions = resolveSceneFieldOptions(profile, '出价目标');
                    const bidTargetValue = normalizeSceneSettingValue(
                        bucket[bidTargetKey]
                        || SCENE_SPEC_FIELD_FALLBACK?.['货品全站推广']?.出价目标
                        || bidTargetOptions[0]
                        || ''
                    );
                    if (bidTargetValue) bucket[bidTargetKey] = bidTargetValue;
                    const bidConstraintLabel = normalizeSceneRenderFieldLabel(bidConstraintFieldLabel) || '目标投产比';
                    staticRows.push(buildSceneOptionRow('出价目标', bidTargetKey, bidTargetOptions, bidTargetValue, {
                        segmented: true,
                        inlineControlHtml: (!isFullSiteMaxAmount && bidConstraintFieldKey)
                            ? buildInlineSceneInputControl(
                                bidConstraintLabel,
                                bidConstraintFieldKey,
                                normalizeSceneSettingValue(bucket[bidConstraintFieldKey] || ''),
                                `请输入${bidConstraintLabel}`
                            )
                            : ''
                    }));

                    const budgetTypeKey = normalizeSceneFieldKey('预算类型');
                    const budgetTypeOptions = resolveSceneFieldOptions(profile, '预算类型');
                    const budgetTypeValue = normalizeSceneSettingValue(
                        bucket[budgetTypeKey]
                        || SCENE_SPEC_FIELD_FALLBACK?.['货品全站推广']?.预算类型
                        || budgetTypeOptions[0]
                        || ''
                    );
                    if (budgetTypeValue) bucket[budgetTypeKey] = budgetTypeValue;
                    staticRows.push(buildSceneOptionRow('预算类型', budgetTypeKey, budgetTypeOptions, budgetTypeValue, {
                        segmented: true,
                        inlineControlHtml: buildInlineProxyInputControl(
                            '预算值',
                            'am-wxt-keyword-budget',
                            wizardState.els.budgetInput?.value || '',
                            '请输入预算'
                        )
                    }));

                    const staleBenefitKey = normalizeSceneFieldKey('专属权益');
                    if (staleBenefitKey) delete bucket[staleBenefitKey];
                    delete bucket.专属权益;

                    const siteBudgetGuardKey = normalizeSceneFieldKey('优质计划防停投');
                    const siteBudgetGuardValue = /^(0|false|off|关闭|否)$/i.test(normalizeSceneSettingValue(
                        bucket[siteBudgetGuardKey]
                        || SCENE_SPEC_FIELD_FALLBACK?.['货品全站推广']?.优质计划防停投
                        || '开启'
                    ))
                        ? '关闭'
                        : '开启';
                    const siteBudgetGuardConfigField = '__am.siteBudgetGuardConfig';
                    const siteBudgetGuardConfigRawValue = normalizeSceneSettingValue(
                        bucket[siteBudgetGuardConfigField]
                        || bucket[normalizeSceneFieldKey(siteBudgetGuardConfigField)]
                        || '{}'
                    ) || '{}';
                    const siteBudgetGuardConfigRaw = JSON.stringify(normalizeBudgetGuardConfig(siteBudgetGuardConfigRawValue));
                    bucket[siteBudgetGuardKey] = siteBudgetGuardValue;
                    bucket[siteBudgetGuardConfigField] = siteBudgetGuardConfigRaw;
                    staticRows.push(`
                        <div class="am-wxt-scene-setting-row">
                            <div class="am-wxt-scene-setting-label">优质计划防停投</div>
                            <div class="am-wxt-setting-control am-wxt-setting-control-pair">
                                <div class="am-wxt-scene-budget-guard-main">
                                    ${buildSceneSwitchControl(siteBudgetGuardKey, siteBudgetGuardValue, '开启', '关闭')}
                                    <span class="am-wxt-scene-budget-guard-text">提升预算续航，防止成交损失</span>
                                </div>
                                ${buildScenePopupControl({
                        trigger: 'budgetGuard',
                        title: '优质计划防停投',
                        buttonLabel: '修改',
                        summary: describeBudgetGuardSummary(siteBudgetGuardConfigRaw),
                        hiddenFields: [
                            { fieldKey: siteBudgetGuardConfigField, value: siteBudgetGuardConfigRaw }
                        ]
                    })}
                                <input
                                    class="am-wxt-hidden-control"
                                    data-scene-field="${Utils.escapeHtml(siteBudgetGuardKey)}"
                                    value="${Utils.escapeHtml(siteBudgetGuardValue)}"
                                />
                            </div>
                        </div>
                    `);

                    const smartCreativeKey = normalizeSceneFieldKey('智能创意');
                    const smartCreativeValue = /^(0|false|off|关闭|否)$/i.test(normalizeSceneSettingValue(
                        bucket[smartCreativeKey]
                        || SCENE_SPEC_FIELD_FALLBACK?.['货品全站推广']?.智能创意
                        || '开启'
                    ))
                        ? '关闭'
                        : '开启';
                    bucket[smartCreativeKey] = smartCreativeValue;
                    staticRows.push(`
                        <div class="am-wxt-scene-setting-row">
                            <div class="am-wxt-scene-setting-label">智能创意</div>
                            <div class="am-wxt-setting-control">
                                <div class="am-wxt-site-optimize-main">
                                    <span class="am-wxt-site-optimize-title">智能创意</span>
                                    ${buildSceneSwitchControl(smartCreativeKey, smartCreativeValue, '开启', '关闭')}
                                    <span class="am-wxt-site-optimize-link">自动优选商品素材</span>
                                </div>
                                <input
                                    class="am-wxt-hidden-control"
                                    data-scene-field="${Utils.escapeHtml(smartCreativeKey)}"
                                    value="${Utils.escapeHtml(smartCreativeValue)}"
                                />
                            </div>
                        </div>
                    `);

                    const optimizeModeKey = normalizeSceneFieldKey('投放调优');
                    const optimizeTargetKey = normalizeSceneFieldKey('优化目标');
                    const optimizeBudgetKey = normalizeSceneFieldKey('多目标预算');
                    const launchBudgetKey = normalizeSceneFieldKey('一键起量预算');
                    const launchTimeKey = normalizeSceneFieldKey('投放时间');
                    const launchAreaKey = normalizeSceneFieldKey('投放地域');
                    const quickLiftLaunchPeriodField = '__am.quickLiftLaunchPeriodList';
                    const quickLiftLaunchAreaField = '__am.quickLiftLaunchAreaList';
                    const optimizeTargetOptions = ['优化加购', '优化直接成交'];
                    const normalizeSiteMultiTargetLabel = (value = '') => {
                        const normalizedValue = normalizeSceneSettingValue(value);
                        if (/^(1230|优化直接成交|增加净成交金额|净成交金额|直接成交)$/.test(normalizedValue)) return '优化直接成交';
                        if (/^(1034|优化加购|收藏加购|加购)$/.test(normalizedValue)) return '优化加购';
                        return '优化加购';
                    };
                    const buildSiteQuickLiftHourRanges = (hours = []) => {
                        const sortedHours = Array.from(new Set(
                            (Array.isArray(hours) ? hours : [])
                                .map(hour => toNumber(hour, NaN))
                                .filter(hour => Number.isFinite(hour) && hour >= 0 && hour <= 23)
                        )).sort((left, right) => left - right);
                        const ranges = [];
                        sortedHours.forEach(hour => {
                            const last = ranges[ranges.length - 1];
                            if (last && hour === last.end) {
                                last.end = hour + 1;
                            } else {
                                ranges.push({ start: hour, end: hour + 1 });
                            }
                        });
                        return ranges;
                    };
                    const buildSiteQuickLiftPeriodRawFromValue = (value = '') => {
                        const text = normalizeSceneSettingValue(value || '');
                        if (!text || /(长期|全天|24小时|不限)/.test(text)) {
                            return JSON.stringify(buildDefaultLaunchPeriodList());
                        }
                        const rangeMatches = Array.from(text.matchAll(/(\d{1,2})\s*(?:点|时)?\s*(?:~|-|至|到)\s*(\d{1,2})\s*(?:点|时)?/g));
                        const hourList = (() => {
                            if (rangeMatches.length) {
                                const hourSet = new Set();
                                rangeMatches.forEach(match => {
                                    const start = Math.max(0, Math.min(23, toNumber(match[1], 0)));
                                    const endRaw = toNumber(match[2], 24);
                                    const end = Math.max(start + 1, Math.min(24, endRaw));
                                    for (let hour = start; hour < end; hour += 1) hourSet.add(hour);
                                });
                                return Array.from(hourSet).sort((left, right) => left - right);
                            }
                            return Array.from(new Set(
                                (text.match(/\d{1,2}/g) || [])
                                    .map(item => toNumber(item, NaN))
                                    .filter(num => Number.isFinite(num) && num >= 0 && num <= 23)
                            )).sort((left, right) => left - right);
                        })();
                        if (!hourList.length || hourList.length >= 24) {
                            return JSON.stringify(buildDefaultLaunchPeriodList());
                        }
                        const formatHour = hour => `${String(Math.max(0, Math.min(24, hour))).padStart(2, '0')}:00`;
                        const timeSpanList = buildSiteQuickLiftHourRanges(hourList)
                            .map(range => ({
                                discount: 100,
                                time: `${formatHour(range.start)}-${formatHour(Math.max(range.start + 1, range.end))}`
                            }));
                        return JSON.stringify(['1', '2', '3', '4', '5', '6', '7'].map(dayOfWeek => ({
                            dayOfWeek,
                            timeSpanList
                        })));
                    };
                    const buildSiteQuickLiftAreaRawFromValue = (value = '') => {
                        const text = normalizeSceneSettingValue(value || '');
                        if (!text || /(全部|全国|不限|all)/i.test(text)) return '["all"]';
                        const list = uniqueBy(
                            text
                                .split(/[,，\s、]+/)
                                .map(item => normalizeSceneSettingValue(item))
                                .filter(Boolean),
                            item => item
                        );
                        return JSON.stringify(list.length ? list : ['all']);
                    };
                    const describeSiteQuickLiftPeriodSummary = (rawValue = '') => {
                        if (!rawValue || isLaunchPeriodAllDay(rawValue)) return '0点~24点';
                        const selectedHourSet = new Set();
                        parseScenePopupJsonArray(rawValue, []).forEach(item => {
                            const spanList = Array.isArray(item?.timeSpanList) ? item.timeSpanList : [];
                            spanList.forEach(span => {
                                const timeText = String(span?.time || '').trim();
                                if (timeText === '00:00-24:00') {
                                    Array.from({ length: 24 }, (_, idx) => idx).forEach(hour => selectedHourSet.add(hour));
                                    return;
                                }
                                const range = parseTimeRangeToMinutes(timeText);
                                if (!range) return;
                                const startHour = Math.max(0, Math.min(23, Math.floor(range.start / 60)));
                                const endHour = Math.max(startHour + 1, Math.min(24, Math.ceil(range.end / 60)));
                                for (let hour = startHour; hour < endHour; hour += 1) {
                                    selectedHourSet.add(hour);
                                }
                            });
                        });
                        const ranges = buildSiteQuickLiftHourRanges(Array.from(selectedHourSet));
                        if (!ranges.length) return '未设置';
                        if (ranges.length === 1 && ranges[0].start === 0 && ranges[0].end === 24) return '0点~24点';
                        return ranges.map(range => `${range.start}点~${Math.max(range.start + 1, range.end)}点`).join('、');
                    };
                    const describeSiteQuickLiftAreaSummary = (rawValue = '') => {
                        const list = parseScenePopupJsonArray(rawValue, ['all'])
                            .map(item => String(item || '').trim())
                            .filter(Boolean);
                        if (!list.length || list.some(item => /^all$/i.test(item))) return '在全部地域投放';
                        return `已选择 ${list.length} 个起量地域`;
                    };
                    const optimizeModeValue = normalizeSceneSettingValue(
                        bucket[optimizeModeKey]
                        || SCENE_SPEC_FIELD_FALLBACK?.['货品全站推广']?.投放调优
                        || '多目标优化'
                    );
                    const optimizeTargetValue = normalizeSiteMultiTargetLabel(
                        bucket[optimizeTargetKey]
                        || SCENE_SPEC_FIELD_FALLBACK?.['货品全站推广']?.优化目标
                        || '优化加购'
                    );
                    const optimizeBudgetValue = normalizeSceneSettingValue(
                        bucket[optimizeBudgetKey]
                        || SCENE_SPEC_FIELD_FALLBACK?.['货品全站推广']?.多目标预算
                        || wizardState.els.budgetInput?.value
                        || '50'
                    );
                    const launchBudgetValue = normalizeSceneSettingValue(
                        bucket[launchBudgetKey]
                        || SCENE_SPEC_FIELD_FALLBACK?.['货品全站推广']?.一键起量预算
                        || wizardState.els.budgetInput?.value
                        || '50'
                    );
                    const launchTimeValue = normalizeSceneSettingValue(
                        bucket[launchTimeKey]
                        || SCENE_SPEC_FIELD_FALLBACK?.['货品全站推广']?.投放时间
                        || '长期投放'
                    );
                    const launchAreaValue = normalizeSceneSettingValue(
                        bucket[launchAreaKey]
                        || SCENE_SPEC_FIELD_FALLBACK?.['货品全站推广']?.投放地域
                        || '全部地域'
                    );
                    bucket[optimizeModeKey] = optimizeModeValue;
                    bucket[optimizeTargetKey] = optimizeTargetValue;
                    bucket[optimizeBudgetKey] = optimizeBudgetValue;
                    bucket[launchBudgetKey] = launchBudgetValue;
                    bucket[launchTimeKey] = launchTimeValue;
                    bucket[launchAreaKey] = launchAreaValue;
                    const quickLiftLaunchPeriodRaw = normalizeSceneSettingValue(
                        bucket[quickLiftLaunchPeriodField]
                        || bucket[normalizeSceneFieldKey(quickLiftLaunchPeriodField)]
                        || buildSiteQuickLiftPeriodRawFromValue(launchTimeValue)
                    ) || JSON.stringify(buildDefaultLaunchPeriodList());
                    const quickLiftLaunchAreaRaw = normalizeSceneSettingValue(
                        bucket[quickLiftLaunchAreaField]
                        || bucket[normalizeSceneFieldKey(quickLiftLaunchAreaField)]
                        || buildSiteQuickLiftAreaRawFromValue(launchAreaValue)
                    ) || '["all"]';
                    bucket[quickLiftLaunchPeriodField] = quickLiftLaunchPeriodRaw;
                    bucket[quickLiftLaunchAreaField] = quickLiftLaunchAreaRaw;
                    const quickLiftLaunchSummary = `${describeSiteQuickLiftPeriodSummary(quickLiftLaunchPeriodRaw)}｜${describeSiteQuickLiftAreaSummary(quickLiftLaunchAreaRaw)}`;
                    const optimizeTargetOptionHtml = optimizeTargetOptions.map(opt => `
                        <button
                            type="button"
                            class="am-wxt-option-chip ${isSceneOptionMatch(opt, optimizeTargetValue) ? 'active' : ''}"
                            data-scene-toggle-target="${Utils.escapeHtml(optimizeTargetKey)}"
                            data-scene-toggle-value="${Utils.escapeHtml(opt)}"
                        >${Utils.escapeHtml(opt)}</button>
                    `).join('');
                    staticRows.push(`
                        <div class="am-wxt-scene-setting-row">
                            <div class="am-wxt-scene-setting-label">投放调优</div>
                            <div class="am-wxt-setting-control am-wxt-site-optimize-box">
                                <div class="am-wxt-site-optimize-item">
                                    <div class="am-wxt-site-optimize-main">
                                        <span class="am-wxt-site-optimize-title">多目标优化</span>
                                        ${buildSceneSwitchControl(optimizeModeKey, optimizeModeValue, '多目标优化', '日常优化')}
                                    </div>
                                    <div class="am-wxt-site-optimize-inline-row">
                                        <span class="am-wxt-site-optimize-inline-label">目标：</span>
                                        <div class="am-wxt-site-toggle am-wxt-site-toggle-wide" data-scene-toggle-group="site-multi-target-target">
                                            ${optimizeTargetOptionHtml}
                                        </div>
                                        <div class="am-wxt-site-optimize-inline-input">
                                            <span>预算：</span>
                                            <input data-scene-field="${Utils.escapeHtml(optimizeBudgetKey)}" value="${Utils.escapeHtml(optimizeBudgetValue)}" placeholder="预算" />
                                            <span>元</span>
                                        </div>
                                    </div>
                                    <div class="am-wxt-site-optimize-hint">建议预算不低于50元</div>
                                    <input class="am-wxt-hidden-control" data-scene-field="${Utils.escapeHtml(optimizeModeKey)}" value="${Utils.escapeHtml(optimizeModeValue)}" />
                                    <input class="am-wxt-hidden-control" data-scene-field="${Utils.escapeHtml(optimizeTargetKey)}" value="${Utils.escapeHtml(optimizeTargetValue)}" />
                                </div>
                                <div class="am-wxt-site-optimize-item">
                                    <div class="am-wxt-site-optimize-main">
                                        <span class="am-wxt-site-optimize-title">一键起量</span>
                                        ${buildSceneSwitchControl(
                        launchTimeKey,
                        /固定时段|关闭|不启用|关/.test(normalizeSceneSettingValue(launchTimeValue)) ? '固定时段' : '长期投放',
                        '长期投放',
                        '固定时段'
                    )}
                                        ${buildScenePopupControl({
                        trigger: 'quickLiftLaunchSetting',
                        title: '起量时间地域设置',
                        buttonLabel: '起量时间地域设置',
                        summary: quickLiftLaunchSummary,
                        hiddenFields: [
                            { fieldKey: quickLiftLaunchPeriodField, value: quickLiftLaunchPeriodRaw },
                            { fieldKey: quickLiftLaunchAreaField, value: quickLiftLaunchAreaRaw }
                        ]
                    })}
                                    </div>
                                    <div class="am-wxt-site-optimize-inline-row">
                                        <div class="am-wxt-site-optimize-inline-input">
                                            <span>预算：</span>
                                            <input data-scene-field="${Utils.escapeHtml(launchBudgetKey)}" value="${Utils.escapeHtml(launchBudgetValue)}" placeholder="预算" />
                                            <span>元</span>
                                        </div>
                                    </div>
                                    <div class="am-wxt-site-optimize-hint">建议预算不低于133元</div>
                                    <div class="am-wxt-site-optimize-config">
                                        <input class="am-wxt-hidden-control" data-scene-field="${Utils.escapeHtml(launchTimeKey)}" value="${Utils.escapeHtml(launchTimeValue)}" />
                                        <input class="am-wxt-hidden-control" data-scene-field="${Utils.escapeHtml(launchAreaKey)}" value="${Utils.escapeHtml(launchAreaValue)}" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    `);
                }
                if (shouldRenderStandaloneBudgetRow) {
                    staticRows.push(buildProxyInputRow('预算值', 'am-wxt-keyword-budget', wizardState.els.budgetInput?.value || '', '请输入预算'));
                }
                if (
                    shouldRenderManualKeywordPanel
                    && !keywordManualPanelInsertedAfterSetting
                ) {
                    staticRows.push(buildManualKeywordDesignerRow('手动关键词'));
                }
                const staticGridHtml = staticRows.join('');
                const API_SCENE_FIELD_LABEL_MAP = {
                    'campaign.promotionScene': '推广场景代码',
                    'campaign.itemSelectedMode': '选品模式代码',
                    'campaign.bidTargetV2': '出价目标代码',
                    'campaign.optimizeTarget': '优化目标代码'
                };
