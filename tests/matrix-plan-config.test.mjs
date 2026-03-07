import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

test('会话草稿包含矩阵默认配置', () => {
  assert.match(source, /const SESSION_DRAFT_SCHEMA_VERSION = 3;/, 'schemaVersion 未升级到 3');
  assert.match(
    source,
    /const buildDefaultMatrixConfig = \(\) => \(\{[\s\S]*?enabled:\s*false,[\s\S]*?maxCombinations:\s*MATRIX_LIMITS\.maxCombinations,[\s\S]*?batchSize:\s*MATRIX_LIMITS\.batchSize,[\s\S]*?namingPattern:\s*MATRIX_DEFAULT_NAMING_PATTERN,[\s\S]*?dimensions:\s*\[\]/,
    '缺少矩阵默认配置'
  );
  assert.match(source, /matrixConfig:\s*buildDefaultMatrixConfig\(\)/, 'wizardDefaultDraft 未注入 matrixConfig');
});

test('矩阵核心函数接入 buildRequestFromWizard', () => {
  assert.match(source, /const buildMatrixCombinations = \(matrixConfig = \{\}, options = \{\}\) => \{/, '缺少 buildMatrixCombinations');
  assert.match(source, /const buildMatrixPreviewStats = \(matrixConfig = \{\}, options = \{\}\) => \{/, '缺少 buildMatrixPreviewStats');
  assert.match(source, /const materializePlansFromMatrix = \(basePlans = \[\], combinations = \[\], options = \{\}\) => \{/, '缺少 materializePlansFromMatrix');
  assert.match(source, /const splitMatrixBatches = \(plans = \[\], batchSize = MATRIX_LIMITS\.batchSize\) => \{/, '缺少 splitMatrixBatches');
  assert.match(source, /const matrixConfig = normalizeMatrixConfig\(wizardState\?\.draft\?\.matrixConfig, selectedSceneName\);/, 'buildRequestFromWizard 未读取 matrixConfig');
  assert.match(source, /组合数 \$\{matrixCombinations\.length\} 超过上限 \$\{matrixConfig\.maxCombinations\}/, '缺少矩阵上限阻断提示');
});

test('矩阵绑定 helper 支持预算出价前缀商品白名单', () => {
  assert.match(source, /const normalizeMatrixBindingKey = \(key = ''\) => \{/, '缺少矩阵绑定 key 归一化');
  assert.match(source, /return 'budget';[\s\S]*return 'day_budget';[\s\S]*return 'day_average_budget';[\s\S]*return 'bid_mode';[\s\S]*return 'bid_target';[\s\S]*return 'plan_prefix';[\s\S]*return 'material_id';/, '矩阵绑定 key 白名单不完整');
  assert.match(source, /const resolveMatrixBoundItem = \(value = '', itemList = \[\]\) => \{/, '缺少矩阵商品绑定解析函数');
  assert.match(source, /throw new Error\(`矩阵商品维度未命中已添加商品：\$\{rawValue\}`\);/, '矩阵商品绑定缺少商品池校验');
  assert.match(source, /const applyMatrixCombinationBindingsToPlan = \(plan = \{\}, combination = \{\}, options = \{\}\) => \{/, '缺少矩阵组合绑定函数');
});

test('关键词出价目标 option helper 提前定义为共享函数，避免矩阵预览运行时报错', () => {
  const helperSignature = "const normalizeKeywordBidTargetOptionValue = (bidTarget = '') => {";
  const helperIndex = source.indexOf(helperSignature);
  const applyBindingIndex = source.indexOf('const applyMatrixDimensionBindingToPlan = (plan = {}, dimensionValue = {}, options = {}) => {');
  assert.notEqual(helperIndex, -1, '缺少 normalizeKeywordBidTargetOptionValue 共享 helper');
  assert.notEqual(applyBindingIndex, -1, '缺少 applyMatrixDimensionBindingToPlan');
  assert.ok(helperIndex < applyBindingIndex, 'normalizeKeywordBidTargetOptionValue 定义晚于矩阵绑定逻辑，浏览器会报 ReferenceError');
  assert.equal(
    source.split(helperSignature).length - 1,
    1,
    'normalizeKeywordBidTargetOptionValue 出现了重复定义，容易再次产生作用域漂移'
  );
});

test('关键词自定义推广目标别名 helper 提前定义为共享函数，避免矩阵预览运行时报错', () => {
  const helperSignature = "const resolveKeywordCustomBidTargetAlias = (bidTarget = '', marketingGoal = '') => {";
  const helperIndex = source.indexOf(helperSignature);
  const applyBindingIndex = source.indexOf('const applyMatrixDimensionBindingToPlan = (plan = {}, dimensionValue = {}, options = {}) => {');
  assert.notEqual(helperIndex, -1, '缺少 resolveKeywordCustomBidTargetAlias 共享 helper');
  assert.notEqual(applyBindingIndex, -1, '缺少 applyMatrixDimensionBindingToPlan');
  assert.ok(helperIndex < applyBindingIndex, 'resolveKeywordCustomBidTargetAlias 定义晚于矩阵绑定逻辑，浏览器会报 ReferenceError');
  assert.equal(
    source.split(helperSignature).length - 1,
    1,
    'resolveKeywordCustomBidTargetAlias 出现了重复定义，容易再次产生作用域漂移'
  );
});

test('矩阵物化会先绑定 plan 字段再命名，并透传商品池', () => {
  assert.match(
    source,
    /applyMatrixCombinationBindingsToPlan\(nextPlan,\s*combination,\s*\{[\s\S]*?itemList:\s*Array\.isArray\(options\?\.itemList\) \? options\.itemList : \[\][\s\S]*?\}\);\s*nextPlan\.planName = applyMatrixNamingPattern\(namingPattern,\s*nextPlan,\s*combination,\s*comboIndex\);/,
    'materializePlansFromMatrix 未先绑定再命名'
  );
  assert.match(
    source,
    /materializePlansFromMatrix\(plans,\s*matrixCombinations,\s*\{[\s\S]*?namingPattern:\s*matrixConfig\.namingPattern,[\s\S]*?sceneName:\s*selectedSceneName,[\s\S]*?itemList:\s*wizardState\.addedItems[\s\S]*?\}\)/,
    'buildRequestFromWizard 未向矩阵物化透传商品池'
  );
  assert.match(
    source,
    /if \(bindingKey === 'budget' && hasExplicitBudgetBinding\) return;/,
    '矩阵预算绑定缺少显式预算键优先规则'
  );
});

test('矩阵空态文案说明支持白名单绑定', () => {
  assert.match(
    source,
    /当前未配置组合维度，开启后仍按原计划直出；支持预算、出价、计划名前缀、商品等白名单绑定/,
    '矩阵空态文案未说明绑定能力'
  );
  assert.match(
    source,
    /Object\.assign\(KeywordPlanCoreUtils,\s*\{[\s\S]*?normalizeMatrixBindingKey,[\s\S]*?applyMatrixCombinationBindingsToPlan,[\s\S]*?materializePlansFromMatrix,/,
    '矩阵绑定 helper 未暴露到 CoreUtils'
  );
});

test('矩阵页提供至少 5 类白名单维度模板与可编辑维度行', () => {
  assert.match(
    source,
    /const MATRIX_DIMENSION_PRESET_CATALOG = \[[\s\S]*?key:\s*'budget'[\s\S]*?key:\s*'bid_mode'[\s\S]*?key:\s*'bid_target'[\s\S]*?key:\s*'plan_prefix'[\s\S]*?key:\s*'material_id'/,
    '矩阵页未提供至少 5 类白名单模板'
  );
  assert.match(source, /id="am-wxt-matrix-preset-list"/, '矩阵页缺少模板按钮容器');
  assert.match(source, /data-matrix-preset-key="\$\{Utils\.escapeHtml\(item\.key\)\}"/, '矩阵页缺少模板快捷添加按钮');
  assert.match(source, /data-matrix-dimension-row="1"/, '矩阵页缺少维度编辑行');
  assert.match(source, /data-matrix-dimension-values="1"/, '矩阵页缺少维度值编辑控件');
});

test('固定枚举维度改为多选，自由输入维度保留文本框', () => {
  assert.match(
    source,
    /key:\s*'bid_mode'[\s\S]*?valueInputMode:\s*'multi_select'[\s\S]*?valueOptions:\s*\['智能出价',\s*'手动出价'\]/,
    '出价方式未切到固定多选'
  );
  assert.match(
    source,
    /key:\s*'bid_target'[\s\S]*?valueInputMode:\s*'multi_select'[\s\S]*?valueOptions:\s*\['获取成交量',\s*'相似品跟投',\s*'抢占搜索卡位',\s*'提升市场渗透',\s*'增加收藏加购量',\s*'增加点击量',\s*'稳定投产比'\]/,
    '出价目标未切到固定多选'
  );
  assert.match(
    source,
    /key:\s*'material_id'[\s\S]*?valueInputMode:\s*'multi_select'/,
    '商品维度未切到固定多选'
  );
  assert.match(source, /data-matrix-dimension-values-select="1"/, '固定维度缺少多选控件');
  assert.match(source, /data-matrix-dimension-picker-toggle="1"/, '固定维度未改成下拉触发器');
  assert.match(source, /data-matrix-dimension-value-option="1"/, '固定维度下拉缺少 checkbox 选项');
  assert.match(source, /固定维度改为下拉勾选；不带搜索。/, '固定维度提示文案未改成下拉勾选');
  assert.match(
    source,
    /const readMatrixDimensionValuesFromRow = \(row = null,\s*sceneName = ''\) => \{[\s\S]*?data-matrix-dimension-values-select="1"[\s\S]*?selectedOptions[\s\S]*?data-matrix-dimension-values="1"/,
    '矩阵取值链路未同时兼容多选和文本框'
  );
});

test('矩阵页支持一键补齐推荐 5 维并自动聚焦新增卡片', () => {
  assert.match(source, /id="am-wxt-matrix-apply-recommended"/, '矩阵页缺少一键补齐推荐 5 维按钮');
  assert.match(source, /id="am-wxt-matrix-clear-dimensions"/, '矩阵页缺少清空维度按钮');
  assert.match(source, /const getMatrixRecommendedPresetKeys = \(sceneName = ''\) => \{/, '缺少推荐维度集合函数');
  assert.match(source, /const applyMatrixPresetBundle = \(presetKeys = \[\], options = \{\}\) => \{/, '缺少推荐维度批量注入函数');
  assert.match(source, /const scrollMatrixDimensionRowIntoView = \(presetKey = ''\) => \{/, '缺少新增维度自动聚焦函数');
  assert.match(source, /const clearMatrixDimensions = \(options = \{\}\) => \{[\s\S]*?nextMatrixConfig\.dimensions = \[\];[\s\S]*?nextMatrixConfig\.enabled = false;/, '清空维度时未同步关闭矩阵');
  assert.match(
    source,
    /matrixApplyRecommendedBtn: overlay\.querySelector\('#am-wxt-matrix-apply-recommended'\),[\s\S]*?matrixClearBtn: overlay\.querySelector\('#am-wxt-matrix-clear-dimensions'\),[\s\S]*?matrixActionNote: overlay\.querySelector\('#am-wxt-matrix-action-note'\)/,
    '矩阵快捷操作按钮未挂到 wizardState.els'
  );
  assert.match(
    source,
    /wizardState\.els\.matrixApplyRecommendedBtn\.addEventListener\('click',[\s\S]*?const presetKeys = getMatrixRecommendedPresetKeys\(wizardState\.draft\?\.sceneName \|\| ''\);[\s\S]*?applyMatrixPresetBundle\(presetKeys,\s*\{[\s\S]*?focusKey:\s*presetKeys\[presetKeys\.length - 1\] \|\| ''[\s\S]*?\}\);/,
    '一键补齐推荐 5 维按钮未接到批量注入链路'
  );
  assert.match(
    source,
    /scrollMatrixDimensionRowIntoView\(insertedPresetKey \|\| presetKey\);[\s\S]*?const applyMatrixPresetBundle = \(presetKeys = \[\], options = \{\}\) => \{[\s\S]*?scrollMatrixDimensionRowIntoView\(focusKey\);/,
    '单个或批量新增维度后未自动滚动到对应卡片'
  );
});

test('矩阵页使用双栏工作台布局并扩展维度编辑区', () => {
  assert.match(source, /class="am-wxt-matrix-workspace"/, '矩阵页缺少工作台布局容器');
  assert.match(source, /class="am-wxt-config-grid am-wxt-matrix-settings-grid"/, '矩阵页缺少侧栏参数网格');
  assert.match(source, /id="am-wxt-matrix-stat-enabled"/, '矩阵页缺少状态统计卡片');
  assert.match(source, /id="am-wxt-matrix-stat-dimensions"/, '矩阵页缺少维度数量统计卡片');
  assert.match(source, /class="am-wxt-crowd-list am-wxt-matrix-dimension-list"/, '矩阵页缺少独立维度列表容器');
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-crowd-list\.am-wxt-matrix-dimension-list \{[\s\S]*?max-height:\s*none;[\s\S]*?min-height:\s*0;[\s\S]*?overflow:\s*visible;/,
    '矩阵维度编辑区仍然带有内部滚动，无法稳定展示瀑布流'
  );
});

test('矩阵维度卡片将维度类型下拉收进首行，避免重复展示', () => {
  assert.match(
    source,
    /class="am-wxt-matrix-dimension-top-main">[\s\S]*?class="am-wxt-inline-check am-wxt-matrix-dimension-enable-inline"[\s\S]*?data-matrix-dimension-enabled="1"[\s\S]*?class="am-wxt-matrix-dimension-index">维度 \$\{index \+ 1\}<\/span>[\s\S]*?class="am-wxt-matrix-dimension-top-actions">[\s\S]*?<select data-matrix-dimension-key="1"[\s\S]*?class="am-wxt-matrix-dimension-remove-icon"[\s\S]*?data-matrix-dimension-remove="1"[\s\S]*?&times;/,
    '维度序号、启用控件或右上角删除图标未收进卡片首行'
  );
  assert.doesNotMatch(
    source,
    /class="am-wxt-inline-check am-wxt-matrix-dimension-enable-inline">[\s\S]*?<span>启用<\/span>/,
    '卡片头部仍保留“启用”文案'
  );
  assert.match(
    source,
    /<input[\s\S]*?type="hidden"[\s\S]*?class="am-wxt-matrix-dimension-hidden-label"[\s\S]*?data-matrix-dimension-label="1"[\s\S]*?\/>\s*\$\{valueEditorHtml\}/,
    '卡片未隐藏标签输入，或骨架未压缩为头部加编辑区'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-matrix-dimension-remove-icon \{[\s\S]*?width:\s*34px;[\s\S]*?height:\s*34px;[\s\S]*?font-size:\s*16px;/,
    '右上角删除图标样式未生效'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-matrix-dimension-top \{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) auto;[\s\S]*?align-items:\s*center;/,
    '卡片头部未改为单行紧凑布局'
  );
  assert.doesNotMatch(
    source,
    /class="am-wxt-matrix-dimension-head">/,
    '卡片仍保留多余的第二行头部容器'
  );
  assert.doesNotMatch(
    source,
    /data-matrix-dimension-meta-summary="1"/,
    '卡片顶部仍在渲染重复的摘要行'
  );
});

test('矩阵维度卡片采用瀑布流排布，移动端退回单列', () => {
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-crowd-list\.am-wxt-matrix-dimension-list \{[\s\S]*?column-count:\s*2;[\s\S]*?column-width:\s*280px;[\s\S]*?column-gap:\s*12px;/,
    '矩阵维度列表未启用瀑布流列布局'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-matrix-dimension-row \{[\s\S]*?display:\s*inline-block;[\s\S]*?break-inside:\s*avoid;[\s\S]*?-webkit-column-break-inside:\s*avoid;/,
    '矩阵维度卡片未阻止瀑布流断裂'
  );
  assert.match(
    source,
    /@media \(max-width: 980px\) \{[\s\S]*?#am-wxt-keyword-modal \.am-wxt-crowd-list\.am-wxt-matrix-dimension-list \{[\s\S]*?column-count:\s*1;[\s\S]*?column-width:\s*auto;/,
    '矩阵维度卡片在窄屏未回退为单列'
  );
});

test('切到矩阵页时会移除 collapsed 隐藏状态', () => {
  assert.match(
    source,
    /wizardState\.els\.matrixPanel\.classList\.toggle\('collapsed', nextPage !== 'matrix'\);/,
    '切换矩阵页时仍可能被 collapsed 隐藏'
  );
  assert.match(
    source,
    /wizardState\.els\.previewlogPanel\.classList\.toggle\('collapsed', nextPage !== 'previewlog'\);/,
    '切换日志页时仍可能被 collapsed 隐藏'
  );
});

test('矩阵页编辑行会同步回 draft.matrixConfig', () => {
  assert.match(
    source,
    /querySelectorAll\('\[data-matrix-dimension-row="1"\]'\)[\s\S]*?querySelector\('\[data-matrix-dimension-key="1"\]'\)[\s\S]*?const values = readMatrixDimensionValuesFromRow\(row,\s*currentSceneName\);[\s\S]*?draft\.matrixConfig = nextMatrixConfig;/,
    '矩阵编辑行未同步回 draft.matrixConfig'
  );
  assert.match(
    source,
    /const applyMatrixPreset = \(presetKey = ''\) => \{[\s\S]*?draft\.matrixConfig = nextMatrixConfig;[\s\S]*?renderWorkbenchMatrixSummary\(\);[\s\S]*?refreshWizardPreview\(\);/,
    '矩阵模板新增后未先渲染维度行再刷新预览'
  );
  assert.match(
    source,
    /wizardState\.els\.matrixPresetList\.addEventListener\('click',[\s\S]*?const presetKey = String\(target\.getAttribute\('data-matrix-preset-key'\) \|\| ''\)\.trim\(\);[\s\S]*?applyMatrixPreset\(presetKey\);/,
    '矩阵模板按钮未复用统一 applyMatrixPreset 链路'
  );
});

test('矩阵摘要在没有 request 时也会按当前草稿兜底计算', () => {
  assert.match(
    source,
    /const matrixStats = buildMatrixPreviewStats\(matrixConfig,\s*\{[\s\S]*?strategyCount:\s*enabledStrategyCount,[\s\S]*?itemCount:\s*Array\.isArray\(wizardState\?\.addedItems\) \? wizardState\.addedItems\.length : 0[\s\S]*?\}\);/,
    '矩阵摘要未按当前草稿计算 fallback 统计'
  );
  assert.match(
    source,
    /const fallbackMatrixPreview = \{[\s\S]*?combinationCount:\s*matrixStats\.combinations\.length,[\s\S]*?batchCount:\s*matrixStats\.expandedPlanCount > 0[\s\S]*?Math\.ceil\(matrixStats\.expandedPlanCount \/ Math\.max\(1,\s*matrixConfig\.batchSize\)\)[\s\S]*?\};/,
    '矩阵摘要缺少组合数和批次数的 fallback 结果'
  );
  assert.match(
    source,
    /const matrixPreview = isPlainObject\(request\?\.matrixPreview\)\s*\?\s*\{[\s\S]*?\.\.\.fallbackMatrixPreview,[\s\S]*?\.\.\.request\.matrixPreview[\s\S]*?\}\s*:\s*fallbackMatrixPreview;/,
    '矩阵摘要未在 request 缺失时回退到 fallback 结果'
  );
  assert.match(
    source,
    /const displayMatrixBatchCount = matrixConfig\.enabled[\s\S]*?\?\s*toNumber\(matrixPreview\?\.batchCount,\s*0\)[\s\S]*?:\s*0;[\s\S]*?矩阵：\$\{matrixConfig\.enabled \? '开启' : '关闭'\} ｜ 组合 \$\{toNumber\(matrixPreview\?\.combinationCount,\s*0\)\} ｜ 批次 \$\{displayMatrixBatchCount\}/,
    '矩阵关闭时摘要批次未归零'
  );
  assert.match(
    source,
    /matrixStatusValue: overlay\.querySelector\('#am-wxt-matrix-stat-enabled'\),[\s\S]*?matrixDimensionCountValue: overlay\.querySelector\('#am-wxt-matrix-stat-dimensions'\),[\s\S]*?matrixCombinationCountValue: overlay\.querySelector\('#am-wxt-matrix-stat-combinations'\),[\s\S]*?matrixBatchCountValue: overlay\.querySelector\('#am-wxt-matrix-stat-batches'\)/,
    '矩阵工作台统计卡片未挂到 wizardState.els'
  );
});
