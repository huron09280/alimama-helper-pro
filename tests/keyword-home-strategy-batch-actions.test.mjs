import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

test('首页贴图改版包含运行态、轻量 Tab、摘要卡片、固定执行区和日志标题', () => {
  assert.match(source, /class="am-wxt-header-main"[\s\S]*?关键词推广批量建计划 API 向导[\s\S]*?class="am-wxt-runtime-pill"[\s\S]*?向导就绪/, 'Header 缺少向导就绪状态');
  assert.match(
    source,
    /data-workbench-page="home">首页<\/button>[\s\S]*?data-workbench-page="matrix">矩阵页<\/button>[\s\S]*?data-workbench-page="previewlog">日志页<\/button>/,
    '首页顶部 Tab 文案未保留首页/矩阵页/日志页，或矩阵入口不在顶部'
  );
  assert.match(
    source,
    /id="am-wxt-keyword-home-summary"[\s\S]*?id="am-wxt-keyword-summary-added"[\s\S]*?id="am-wxt-keyword-summary-strategy"[\s\S]*?id="am-wxt-keyword-summary-budget"/,
    '首页摘要卡片缺少商品、计划或预算摘要'
  );
  assert.match(
    source,
    /class="am-wxt-strategy-footer"[\s\S]*?id="am-wxt-keyword-submit-summary"[\s\S]*?id="am-wxt-keyword-preview-quick"[\s\S]*?id="am-wxt-keyword-run-quick"[\s\S]*?提交创建/,
    '计划区缺少底部执行条或主操作'
  );
  assert.match(source, /class="am-wxt-quick-log-title">执行日志<\/div>[\s\S]*?id="am-wxt-keyword-quick-log"/, '首页日志区缺少标题');
  assert.match(source, /const syncHomeSummary = \(\) => \{[\s\S]*?summaryAddedCount[\s\S]*?summaryStrategyCount[\s\S]*?summaryBudgetTotal[\s\S]*?submitSummary[\s\S]*?将提交 <strong>\$\{enabledStrategyCount\}<\/strong> 个计划[\s\S]*?预算合计 \$\{budgetText\}[\s\S]*?提交方式：\$\{Utils\.escapeHtml\(submitModeText\)\}/, '首页摘要或底部预算摘要未接入动态同步');
});

test('首页计划列表改为表格化列结构', () => {
  assert.match(
    source,
    /listHead\.className = 'am-wxt-strategy-list-head';[\s\S]*?计划名称[\s\S]*?类型[\s\S]*?出价目标[\s\S]*?预算[\s\S]*?操作/,
    '计划列表缺少表头列'
  );
  assert.match(
    source,
    /const strategyLabel = getStrategyMainLabel\(strategy\);[\s\S]*?class="am-wxt-strategy-check"[\s\S]*?class="am-wxt-strategy-name"[\s\S]*?title="\$\{Utils\.escapeHtml\(strategyLabel\)\}"[\s\S]*?class="am-wxt-strategy-tags"[\s\S]*?getStrategyTagClassName\('scene', strategySceneName\)[\s\S]*?getStrategyTagClassName\('goal', goalLabel\)[\s\S]*?getStrategyTagClassName\('bid', bidModeLabel\)[\s\S]*?class="am-wxt-strategy-target"[\s\S]*?class="am-wxt-strategy-summary"[\s\S]*?class="am-wxt-strategy-budget"[\s\S]*?预算 \$\{Utils\.escapeHtml\(budgetLabel\)\} 元[\s\S]*?class="am-wxt-strategy-actions"/,
    '计划行未按表格化列结构渲染'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-strategy-list-head,[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-main \{[\s\S]*?display: grid;[\s\S]*?grid-template-columns: 28px minmax\(180px, 1\.05fr\) minmax\(190px, 0\.95fr\)/,
    '计划行缺少稳定网格列样式'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \{[\s\S]*?width:\s*min\(1320px,\s*calc\(100vw - 48px\)\);/,
    '首页主弹窗宽度未放宽，计划表格在宽屏下仍容易拥挤'
  );
});

test('首页类型列标签按设置语义使用不同色系和深浅', () => {
  assert.match(
    source,
    /const getStrategyTagClassName = \(kind = '', label = ''\) => \{[\s\S]*?kind === 'scene'[\s\S]*?tone-keyword[\s\S]*?kind === 'goal'[\s\S]*?tone-trend[\s\S]*?tone-search[\s\S]*?tone-traffic[\s\S]*?tone-custom[\s\S]*?kind === 'bid'[\s\S]*?tone-manual[\s\S]*?tone-smart/,
    '类型标签缺少按推广类型、营销目标和出价模式分配色彩的 helper'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-strategy-tag \{[\s\S]*?--am-wxt-strategy-tag-border[\s\S]*?--am-wxt-strategy-tag-bg[\s\S]*?--am-wxt-strategy-tag-text[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-tag-tone-keyword \{[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-tag-tone-trend \{[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-tag-tone-search \{[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-tag-tone-smart \{/,
    '类型标签缺少可区分不同设置的 CSS 色彩变量'
  );
});

test('首页提交创建会先二次确认，确认后才调用现有创建链路', () => {
  assert.match(
    source,
    /const openKeywordSubmitConfirmPopup = async \(\{ req = \{\}, sceneRequests = \[\] \} = \{\}\) => \{[\s\S]*?data-submit-confirm-dialog="1"[\s\S]*?data-submit-confirm-plan-count="1"[\s\S]*?data-submit-confirm-budget="1"[\s\S]*?data-submit-confirm-item-count="1"[\s\S]*?data-submit-confirm-mode="1"[\s\S]*?确认后会调用创建接口/,
    '缺少提交创建二次确认弹窗或关键摘要'
  );
  assert.match(
    source,
    /dialogClassName: 'am-wxt-scene-popup-dialog-submit-confirm'[\s\S]*?saveLabel: '确认提交创建'/,
    '提交确认弹窗未使用专用 class 或确认文案'
  );
  assert.match(
    source,
    /const handleRunQuickWithConfirm = async \(\) => \{[\s\S]*?const confirmResult = await openKeywordSubmitConfirmPopup\(runPayload\);[\s\S]*?if \(!confirmResult\?\.confirmed\) \{[\s\S]*?return;[\s\S]*?\}[\s\S]*?await handleRun\(\);/,
    '首页主按钮未在确认后再进入现有创建链路'
  );
  assert.match(
    source,
    /wizardState\.els\.runBtn\.onclick = handleRun;[\s\S]*?wizardState\.els\.runQuickBtn\.onclick = handleRunQuickWithConfirm;/,
    '编辑页创建与首页主按钮未区分绑定'
  );
  assert.doesNotMatch(source, /window\.confirm\(/, '不得使用浏览器原生 confirm');
});

test('首页计划行强化可读性和风险态', () => {
  assert.match(
    source,
    /class="am-wxt-btn am-wxt-copy-btn am-wxt-strategy-action-secondary"[\s\S]*?class="am-wxt-btn danger am-wxt-strategy-delete-btn"[\s\S]*?class="am-wxt-btn am-wxt-strategy-action-main"/,
    '复制、删除、编辑按钮未拉开视觉权重或删除缺少危险态'
  );
  assert.match(
    source,
    /\$\{wizardState\.detailVisible && wizardState\.editingStrategyId === strategy\.id \? '编辑中' : '编辑'\}/,
    '首页计划行编辑按钮文案应为“编辑”'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-strategy-actions \{[\s\S]*?opacity:\s*0;[\s\S]*?visibility:\s*hidden;[\s\S]*?pointer-events:\s*none;[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-item:hover \.am-wxt-strategy-actions,[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-item:focus-within \.am-wxt-strategy-actions \{[\s\S]*?opacity:\s*1;[\s\S]*?visibility:\s*visible;[\s\S]*?pointer-events:\s*auto;/,
    '首页计划行操作按钮应仅在行 hover/focus-within 时显示'
  );
  assert.match(source, /placeholder="\$\{strategyBidTargetCode === 'roi' \? '例如 2\.24' : '待填写'\}"/, '目标成本空值态提示不清晰');
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-strategy-name \.am-wxt-strategy-inline-view \{[\s\S]*?-webkit-line-clamp:\s*2;[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?white-space:\s*normal;/,
    '计划名称未支持更完整的两行识别'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-strategy-delete-btn \{[\s\S]*?color:\s*#b91c1c;[\s\S]*?border-color:\s*#fecaca;/,
    '删除按钮缺少危险态样式'
  );
});

test('首页计划名称与预算支持悬停铅笔行内编辑并自动保存', () => {
  assert.match(
    source,
    /data-inline-edit-field="planName"[\s\S]*?data-action="inline-edit-input"[\s\S]*?data-field="planName"[\s\S]*?data-action="inline-edit"[\s\S]*?编辑计划名称/,
    '计划名称列缺少行内编辑结构'
  );
  assert.match(
    source,
    /data-inline-edit-field="dayAverageBudget"[\s\S]*?预算 \$\{Utils\.escapeHtml\(budgetLabel\)\} 元[\s\S]*?type="number"[\s\S]*?data-field="dayAverageBudget"[\s\S]*?编辑预算/,
    '预算列缺少行内编辑结构'
  );
  assert.match(
    source,
    /const normalizeInlineStrategyBudgetValue = \(rawValue = ''\) => \{[\s\S]*?parseNumberFromSceneValue\(text\)[\s\S]*?amount <= 0 \|\| amount > 999999[\s\S]*?toShortSceneValue/,
    '行内预算编辑缺少数值校验'
  );
  assert.match(
    source,
    /const commitInlineEdit = \(\) => \{[\s\S]*?ensureUniqueStrategyPlanName\(rawValue, strategy\.id\)[\s\S]*?strategy\.dayAverageBudget = nextBudgetValue[\s\S]*?commitStrategyUiState\(\);/,
    '行内编辑未写回计划名称/预算并复用现有提交状态刷新'
  );
  assert.match(
    source,
    /const syncInlineStrategyDetailField = \(strategy = null, field = '', value = ''\) => \{[\s\S]*?wizardState\.editingStrategyId !== strategy\.id[\s\S]*?prefixInput\.value = value[\s\S]*?budgetInput\.value = value/,
    '行内编辑未同步当前详情页表单，可能被 syncDraftFromUI 覆盖'
  );
  assert.match(
    source,
    /row\.addEventListener\('mouseleave', \(\) => \{[\s\S]*?commitInlineEdit\(\);[\s\S]*?\}\);/,
    '计划行鼠标离开时未自动保存行内编辑'
  );
  assert.match(
    source,
    /renderAmIcon\('edit', \{ size: 16, strokeWidth: 1\.8 \}\)/,
    '行内编辑按钮未使用共享铅笔图标'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-strategy-item:hover \.am-wxt-strategy-inline-edit-btn,[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-item:focus-within \.am-wxt-strategy-inline-edit-btn,[\s\S]*?opacity:\s*1;[\s\S]*?visibility:\s*visible;/,
    '行内编辑按钮缺少 hover/focus 显示样式'
  );
});

test('首页计划头部包含计划配置、搜索、批量编辑与清空按钮，并挂到向导元素缓存', () => {
  assert.match(
    source,
    /class="am-wxt-strategy-head-main">[\s\S]*?计划配置[\s\S]*?id="am-wxt-keyword-add-strategy"[\s\S]*?id="am-wxt-keyword-strategy-count"[\s\S]*?class="am-wxt-strategy-head-tools">[\s\S]*?id="am-wxt-keyword-strategy-select-all"[\s\S]*?id="am-wxt-keyword-strategy-search"[\s\S]*?class="am-wxt-strategy-head-actions">[\s\S]*?id="am-wxt-keyword-batch-edit-strategy"[\s\S]*?id="am-wxt-keyword-clear-strategy"/,
    '首页计划头部缺少计划配置、搜索、全选或批量操作控件'
  );
  assert.match(
    source,
    /strategySelectAllInput: overlay\.querySelector\('#am-wxt-keyword-strategy-select-all'\),[\s\S]*?strategySearchInput: overlay\.querySelector\('#am-wxt-keyword-strategy-search'\),[\s\S]*?batchEditStrategyBtn: overlay\.querySelector\('#am-wxt-keyword-batch-edit-strategy'\),[\s\S]*?clearStrategyBtn: overlay\.querySelector\('#am-wxt-keyword-clear-strategy'\),/,
    '计划搜索、全选或批量按钮未挂到 wizardState.els'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-strategy-head \{[\s\S]*?display:\s*grid;[\s\S]*?grid-template-columns:\s*minmax\(180px, auto\) minmax\(260px, 1fr\) auto;[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-search-input \{[\s\S]*?width:\s*min\(280px,\s*100%\);/,
    '首页计划头部未按上一版网格布局'
  );
});

test('快捷日志保持原时间前缀输出并弱化为次级区块', () => {
  assert.match(source, /const timestampText = `\[\$\{new Date\(\)\.toLocaleTimeString\('zh-CN', \{ hour12: false \}\)\}\] \$\{text\}`;/, '快捷日志未保持原时间前缀输出');
  assert.match(source, /line\.className = `line \$\{type\}`;[\s\S]*?line\.textContent = timestampText;/, '快捷日志不应拆分原输出容器文本');
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-quick-log-panel \{[\s\S]*?#am-wxt-keyword-modal \.am-wxt-quick-log-title \{[\s\S]*?#am-wxt-keyword-quick-log \{/,
    '快捷日志缺少次级区块样式'
  );
});

test('首页计划区会按已选计划刷新批量操作按钮状态', () => {
  assert.match(source, /const syncStrategyHeadActionState = \(\) => \{/, '缺少首页计划批量按钮状态同步 helper');
  assert.match(
    source,
    /const selectedCount = getSelectedStrategyList\(\)\.length;[\s\S]*?const filteredStrategyList = getFilteredStrategyList\(\);[\s\S]*?wizardState\.els\.strategySelectAllInput\.checked = filteredCount > 0 && filteredSelectedCount === filteredCount;[\s\S]*?wizardState\.els\.strategySelectAllInput\.indeterminate = filteredSelectedCount > 0 && filteredSelectedCount < filteredCount;[\s\S]*?wizardState\.els\.batchEditStrategyBtn\.disabled = selectedCount <= 0;[\s\S]*?wizardState\.els\.clearStrategyBtn\.disabled = selectedCount <= 0 \|\| totalCount <= 1;/,
    '首页计划头部未同步全选态或批量按钮禁用态'
  );
  assert.match(
    source,
    /const renderStrategyList = \(\) => \{[\s\S]*?wizardState\.els\.strategyCount\.textContent = String\(enabledCount\);[\s\S]*?syncStrategyHeadActionState\(\);/,
    '渲染计划列表时未同步批量操作按钮状态'
  );
});

test('首页计划区支持按计划名称搜索并对当前结果全选', () => {
  assert.match(source, /const normalizeStrategySearchText = \(text = ''\) => String\(text \|\| ''\)\.trim\(\)\.toLowerCase\(\);/, '缺少计划搜索文本归一化 helper');
  assert.match(
    source,
    /const getFilteredStrategyList = \(\) => \{[\s\S]*?const keyword = getStrategySearchKeyword\(\);[\s\S]*?return strategyList\.filter\(strategy => isStrategyMatchedBySearch\(strategy,\s*keyword\)\);/,
    '首页计划列表未接入计划名称搜索过滤'
  );
  assert.match(
    source,
    /const setFilteredStrategiesEnabled = \(enabled = true\) => \{[\s\S]*?const filteredStrategyList = getFilteredStrategyList\(\);[\s\S]*?strategy\.enabled = !!enabled;/,
    '首页计划全选未限定到当前搜索结果'
  );
  assert.match(
    source,
    /if \(!filteredStrategyList\.length\) \{[\s\S]*?empty\.className = 'am-wxt-strategy-empty';[\s\S]*?未找到匹配“\$\{wizardState\.els\.strategySearchInput\?\.value\?\.trim\(\) \|\| ''\}”的计划/,
    '搜索为空时缺少计划空状态提示'
  );
  assert.match(
    source,
    /wizardState\.els\.strategySearchInput\.addEventListener\('input', \(\) => \{[\s\S]*?renderStrategyList\(\);[\s\S]*?\}\);[\s\S]*?wizardState\.els\.strategySelectAllInput\.addEventListener\('change', handleSelectAllStrategies\);/,
    '计划搜索或全选控件未绑定事件'
  );
});

test('批量编辑改为独立弹窗，只批量修改数值字段', () => {
  assert.match(source, /const resolveBatchEditableStrategyTargetCostCode = \(strategy = \{\}\) => \{/, '缺少批量目标成本适配 helper');
  assert.match(source, /const openBatchStrategyPopupDialog = \(\{/, '缺少首页计划批量编辑弹窗 helper');
  assert.match(
    source,
    /const normalizeBatchStrategyNumberEditValues = \(rawValues = \{\}\) => \{[\s\S]*?const budgetValue = normalizeDecimalValue\(rawValues\.dayAverageBudget, '预算值', \{ min: 0, max: 999999 \}\);[\s\S]*?const recommendValue = normalizeIntegerValue\(rawValues\.recommendCount, '推荐词目标数', \{ min: 1, max: 200 \}\);/,
    '批量编辑缺少数值字段校验'
  );
  assert.match(
    source,
    /const applyBatchNumberEditToStrategies = \(strategies = \[\], values = \{\}\) => \{[\s\S]*?strategy\.dayAverageBudget = values\.dayAverageBudget;[\s\S]*?strategy\.defaultBidPrice = values\.defaultBidPrice;[\s\S]*?strategy\.recommendCount = values\.recommendCount;[\s\S]*?syncStrategyTargetCostFields\(strategy,\s*bidTargetCode,\s*values\.targetCostValue\);/,
    '批量编辑未收敛为数值字段回写'
  );
  assert.match(
    source,
    /const openBatchStrategyNumberEditPopup = async \(strategies = \[\]\) => \{[\s\S]*?return openBatchStrategyPopupDialog\(\{[\s\S]*?data-batch-strategy-number-field="dayAverageBudget"[\s\S]*?data-batch-strategy-number-field="defaultBidPrice"[\s\S]*?data-batch-strategy-number-field="recommendCount"[\s\S]*?data-batch-strategy-number-field="targetCostValue"[\s\S]*?请至少填写 1 个需要批量修改的数值字段/,
    '批量编辑弹窗未提供独立数值字段表单'
  );
  assert.match(
    source,
    /const handleBatchEditStrategies = async \(\) => \{[\s\S]*?const result = await openBatchStrategyNumberEditPopup\(selectedStrategies\);[\s\S]*?const applyResult = applyBatchNumberEditToStrategies\(selectedStrategies,\s*result\.values\);[\s\S]*?applyStrategyToDetailForm\(editingStrategy\);[\s\S]*?appendWizardLog\(logParts\.join\('；'\), 'success'\);/,
    '批量编辑按钮未改为“弹窗填写数值后批量应用”的链路'
  );
  assert.doesNotMatch(source, /buildBatchEditableStrategySnapshot|applyBatchEditableStrategySnapshot|applyBatchEditToStrategies/, '旧的整条计划覆盖式批量编辑 helper 仍然存在');
  assert.doesNotMatch(
    source,
    /const closeDetailDialog = \(\) => \{[\s\S]*?applyBatchEditToStrategies\(/,
    '关闭编辑页时仍会触发旧的整条计划同步'
  );
});

test('首页计划清空会删除已选计划，但至少保留 1 条', () => {
  assert.match(source, /const clearSelectedStrategies = \(\) => \{/, '缺少首页计划清空 helper');
  assert.match(
    source,
    /appendWizardLog\('请先勾选至少 1 个计划，再清空', 'error'\);[\s\S]*?if \(strategyList\.length <= 1\) \{[\s\S]*?appendWizardLog\('至少保留 1 个计划', 'error'\);/,
    '首页计划清空缺少空选中与最小保留数拦截'
  );
  assert.match(
    source,
    /if \(!nextStrategyList\.length\) \{[\s\S]*?preservedLocked = true;[\s\S]*?wizardState\.strategyList = nextStrategyList;[\s\S]*?appendWizardLog\(\s*`已清空 \$\{removedCount\} 个计划\$\{preservedLocked \? '，已保留 1 个计划' : ''\}`,/,
    '首页计划清空未保底留 1 条计划或未反馈结果'
  );
  assert.match(
    source,
    /wizardState\.els\.batchEditStrategyBtn\.onclick = handleBatchEditStrategies;[\s\S]*?wizardState\.els\.clearStrategyBtn\.onclick = clearSelectedStrategies;/,
    '首页计划批量编辑/清空按钮未绑定点击事件'
  );
});

test('首页计划复制数量大于等于 2 时会在复制后自动删除原计划', () => {
  assert.match(
    source,
    /const shouldDeleteOriginalAfterCopy = targetCopyCount >= 2;[\s\S]*?const removedOriginal = shouldDeleteOriginalAfterCopy[\s\S]*?removeStrategyById\(strategy\.id\)[\s\S]*?appendWizardLog\([\s\S]*?`已复制计划：\$\{targetCopyCount\} 个（已删除原计划）`[\s\S]*?: `已复制计划：\$\{targetCopyCount\} 个`/,
    '复制数量大于等于 2 时未启用“复制后删除原计划”逻辑'
  );
});

test('首页计划复制命名按末尾序号连续递增，避免 _1_2 嵌套后缀', () => {
  assert.match(
    source,
    /const hasAutoTimeSuffix = \/\(\?:_\\d\{8\}\|\\d\{14\}\|_\\d\{8\}_\\d\{6\}\)\$\/\.test\(baseSeed\);[\s\S]*?const sourceSerial = !hasAutoTimeSuffix && \/_\(\\d\+\)\$\/\.test\(baseSeed\)[\s\S]*?const serialStart = sourceSerial > 0 \? sourceSerial : 0;[\s\S]*?let serialCursor = serialStart \+ Math\.max\(1, toNumber\(copyIndex, 1\)\);[\s\S]*?let candidate = `\$\{base\}_\$\{serialCursor\}`;[\s\S]*?while \(usedPlanNames\.has\(candidate\) && serialCursor < 9999\)/,
    '复制计划命名未使用连续递增序号策略，仍可能生成嵌套后缀'
  );
});
