import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getBlock(startMarker, endMarker = '') {
    const start = source.indexOf(startMarker);
    assert.notEqual(start, -1, `无法定位代码块起点：${startMarker}`);
    if (!endMarker) return source.slice(start);
    const end = source.indexOf(endMarker, start + startMarker.length);
    assert.ok(end > start, `无法定位代码块终点：${endMarker}`);
    return source.slice(start, end);
}

function assertInOrder(text, markers, message) {
    let cursor = -1;
    for (const marker of markers) {
        const next = text.indexOf(marker, cursor + 1);
        assert.ok(next > cursor, `${message}；缺少或顺序错误：${marker}`);
        cursor = next;
    }
}

test('趋势明星矩阵验证包：营销目标会驱动趋势主题预设与维度添加顺序', () => {
    const fallbackBlock = getBlock(
        'const MATRIX_SCENE_DIMENSION_FALLBACK_LABELS = {',
        'const MATRIX_SCENE_DIMENSION_OPTION_FALLBACKS ='
    );
    assertInOrder(
        fallbackBlock,
        [
            "'关键词推广': {",
            "趋势明星: ['趋势主题'",
            "'出价目标'",
            "'冷启加速'",
            "'预算类型'",
            "'人群设置'",
            "'人群优化目标'"
        ],
        '趋势明星矩阵兜底维度未固定为目标专属顺序'
    );

    const activeGoalBlock = getBlock(
        'const resolveMatrixSceneActiveMarketingGoal = ({',
        'const shouldHideMatrixKeywordGoalField ='
    );
    assertInOrder(
        activeGoalBlock,
        [
            'activeGoalFromMatrixUi',
            "querySelector('[data-matrix-goal-option].active')",
            'activeGoalFromMatrixUi',
            'bucket?.[goalFieldKey]',
            'sceneSettings?.营销目标'
        ],
        '矩阵目标解析必须优先读取当前矩阵页高亮目标，再读取编辑页 bucket'
    );

    const appendableBlock = getBlock(
        "const getMatrixActiveGoalScenePresetKeys = (sceneName = '') => {",
        "const getMatrixQuickPresetCatalog = (sceneName = '') => {"
    );
    assertInOrder(
        appendableBlock,
        [
            'getMatrixSceneScopedFallbackLabels(normalizedSceneName, activeMarketingGoal)',
            'buildMatrixSceneDimensionPreset(fieldLabel, normalizedSceneName)',
            "const getMatrixAppendablePresetKeys = (sceneName = '', dimensions = []) => {",
            '...getMatrixActiveGoalScenePresetKeys(sceneName)',
            '...getMatrixRecommendedPresetKeys(sceneName)'
        ],
        '维度卡片添加入口未把当前营销目标专属字段排在推荐维度之前'
    );

    const recommendedBlock = getBlock(
        "const getMatrixRecommendedPresetKeys = (sceneName = '') => {",
        "const getMatrixActiveGoalScenePresetKeys = (sceneName = '') => {"
    );
    assertInOrder(
        recommendedBlock,
        [
            'activeMarketingGoal',
            'activeGoalScenePresetKeys',
            "activeMarketingGoal === '自定义推广'",
            "'bid_target_cost_package'",
            ": ['budget', 'bid_mode', 'plan_prefix', 'material_id']",
            '.concat(activeGoalScenePresetKeys)',
            ".concat(['bid_target'])"
        ],
        '趋势明星补齐推荐维度必须避开自定义推广专属的智能出价目标包，并纳入趋势主题'
    );

    const quickPresetBlock = getBlock(
        "const getMatrixQuickPresetCatalog = (sceneName = '') => {",
        'const normalizeMatrixDimensionValues = (input = []) => {'
    );
    assertInOrder(
        quickPresetBlock,
        [
            'activeMarketingGoal',
            'preferredScenePresets',
            'preferredSceneFieldKeys',
            '...preferredSceneFieldKeys',
            '...sceneFieldKeys'
        ],
        '矩阵快捷预设未同步当前趋势明星目标的专属字段'
    );

    const applyGoalBlock = getBlock(
        "const applyMatrixMarketingGoal = (sceneName = '', nextGoal = '') => {",
        'const setMatrixActionNote ='
    );
    assertInOrder(
        applyGoalBlock,
        [
            'activeStrategies',
            'strategy.enabled !== false',
            'targetStrategies.forEach',
            'strategy.marketingGoal = normalizedGoal',
            'strategy.sceneName = currentSceneName'
        ],
        '矩阵页营销目标必须同步到所有启用源模板，避免趋势明星生成链路混入其他目标'
    );
});

test('趋势明星矩阵验证包：选择趋势主题支持新建组合并直连 campaign.trendThemeList', () => {
    const presetBlock = getBlock(
        "const buildMatrixSceneDimensionPreset = (fieldLabel = '', sceneName = '') => {",
        "const getMatrixSceneDimensionPresetCatalog = (sceneName = '') => {"
    );
    assertInOrder(
        presetBlock,
        [
            'const isTrendThemePreset = isMatrixTrendThemeFieldLabel(normalizedFieldLabel);',
            '? getMatrixTrendThemeOptionValues({ bucket, sceneSettings })',
            "label: isTrendThemePreset ? '选择趋势主题' : normalizedFieldLabel",
            "valueInputMode: shouldUseMultiSelect ? 'multi_select' : 'text'"
        ],
        '趋势主题场景字段未映射为“选择趋势主题”多选维度'
    );

    const rowRenderBlock = getBlock(
        'const buildMatrixDimensionRow = (dimension = {}, index = 0) => {',
        'const buildMatrixDimensionAddCard = (presetKey = \'\') => {'
    );
    assertInOrder(
        rowRenderBlock,
        [
            'const isTrendThemeDimension = useMultiSelect && isMatrixTrendThemeFieldLabel',
            'const trendThemeEditorHtml = isTrendThemeDimension',
            'data-matrix-trend-theme-edit="1"',
            '添加趋势主题组合',
            '${valueEditorHtml}',
            '${trendThemeEditorHtml}'
        ],
        '趋势主题组合新建入口必须常驻在值选择器外侧'
    );
    const valuePanelStart = rowRenderBlock.indexOf('class="am-wxt-matrix-dimension-picker-panel" data-matrix-dimension-picker-panel="1">');
    const valuePanelEnd = rowRenderBlock.indexOf('<select', valuePanelStart);
    assert.ok(valuePanelStart > -1 && valuePanelEnd > valuePanelStart, '未定位到趋势主题值下拉面板');
    assert.ok(
        !rowRenderBlock.slice(valuePanelStart, valuePanelEnd).includes('trendThemeEditorHtml'),
        '添加趋势主题组合入口不应回退到下拉 panel 内'
    );

    const editClickBlock = getBlock(
        'const trendThemeEditBtn = event.target instanceof Element',
        'const addBtn = event.target instanceof Element'
    );
    assertInOrder(
        editClickBlock,
        [
            "closest('[data-matrix-trend-theme-edit=\"1\"]')",
            'openKeywordTrendThemeSettingPopup',
            'detached: true',
            'initialRaw',
            'popupPayload?.result?.trendThemeRaw',
            'nextMatrixConfig.dimensions = nextMatrixConfig.dimensions.map',
            'renderWorkbenchMatrixSummary()',
            'refreshWizardPreview()',
            '已添加趋势主题组合'
        ],
        '矩阵页趋势主题组合新建未复用 detached 弹窗并写回当前维度'
    );

    const bindingBlock = getBlock(
        'const applyMatrixDimensionBindingToPlan = (plan = {}, dimensionValue = {}, options = {}) => {',
        "if (bindingKey === 'material_id') {"
    );
    assertInOrder(
        bindingBlock,
        [
            'isMatrixSceneFieldBindingKey(bindingKey)',
            "const trendThemeField = 'campaign.trendThemeList';",
            'plan.sceneSettingValues[trendThemeField] = trendThemeRaw;',
            'plan.sceneSettings[trendThemeField] = trendThemeRaw;'
        ],
        '矩阵趋势主题维度未直连最终 API 字段 campaign.trendThemeList'
    );

    const combinationBindingBlock = getBlock(
        'const applyMatrixCombinationBindingsToPlan = (plan = {}, combination = {}, options = {}) => {',
        'const materializePlansFromMatrix = (basePlans = [], combinations = [], options = {}) => {'
    );
    assertInOrder(
        combinationBindingBlock,
        [
            'matrixValues',
            '.filter(item => isMatrixSceneFieldBindingKey(item.bindingKey))',
            'applyMatrixDimensionBindingToPlan(plan, item, options);'
        ],
        '矩阵组合物化必须遍历动态 scene_field:* 维度，否则趋势主题只会影响 UI'
    );
});

test('趋势明星矩阵验证包：生成计划点击覆盖当前页失败提示与成功物化路径', () => {
    const summaryBlock = getBlock(
        'const renderWorkbenchMatrixSummary = (request = null) => {',
        'const displayMatrixBatchCount = matrixConfig.enabled && canEditMatrixDimensions'
    );
    assertInOrder(
        summaryBlock,
        [
            'const canAttemptMatrixGeneration = canEditMatrixDimensions;',
            'wizardState.els.matrixGenerateBtn.disabled = !canAttemptMatrixGeneration;',
            '点击查看矩阵配置缺口',
            '点击查看生成前置条件'
        ],
        '生成计划按钮不应再被缺商品或缺策略提前置灰'
    );

    const actionNoteBlock = getBlock(
        "const setMatrixActionNote = (text = '', type = '') => {",
        'const renderWorkbenchMatrixSummary = (request = null) => {'
    );
    assertInOrder(
        actionNoteBlock,
        [
            'el.textContent',
            "classList.toggle('is-error', normalizedType === 'error')",
            "classList.toggle('is-success', normalizedType === 'success')"
        ],
        '矩阵页缺少当前操作区可见反馈状态'
    );

    const generateClickBlock = getBlock(
        'wizardState.els.matrixGenerateBtn.addEventListener(\'click\', () => {',
        'if (wizardState.els.matrixClearBtn instanceof HTMLButtonElement) {'
    );
    assertInOrder(
        generateClickBlock,
        [
            'const showMatrixGenerateFeedback',
            'appendWizardLog(normalizedMessage',
            'setMatrixActionNote(normalizedMessage, type)',
            'syncMatrixScenePresetContextFromEditor()',
            '请先在编辑页选择场景，再生成计划',
            'syncMatrixConfigFromUI()',
            '请先开启矩阵并补齐至少 1 组有效组合，再生成计划',
            '请先回首页添加商品，再回矩阵页点击“补齐5维”或添加“商品”维度后生成计划',
            '请先勾选至少 1 个计划策略后再生成矩阵计划',
            '当前矩阵没有生成可用计划，请检查商品维度、策略勾选和维度取值',
            'materializeStrategyListFromPlans(req.plans)',
            'enabled: false',
            'const disabledTemplateCount = existingStrategyList.filter(item => item?.enabled !== false).length;',
            'const nextExistingStrategyList = existingStrategyList.map',
            'enabled: false',
            'wizardState.strategyList = [...nextExistingStrategyList, ...materializedStrategies];',
            "setWorkbenchPage('home')",
            'commitStrategyUiState()',
            '已生成计划 ${materializedStrategies.length} 个',
            '源模板已暂停 ${disabledTemplateCount} 个',
            '生成计划失败：'
        ],
        '生成计划点击链路未同时覆盖前置失败、当前页提示和成功物化回首页'
    );

    assert.doesNotMatch(
        generateClickBlock,
        /wizardState\.strategyList = \[\.\.\.existingStrategyList,\s*\.\.\.materializedStrategies\];/,
        '生成计划成功后不能保留源模板启用态，避免后续真实提交时模板计划和矩阵计划重复'
    );

    assert.match(source, /\.am-wxt-matrix-action-note\.is-error/, '缺少矩阵生成失败提示样式');
    assert.match(source, /\.am-wxt-matrix-action-note\.is-success/, '缺少矩阵生成成功提示样式');
});
