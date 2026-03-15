import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

test('首页计划头部新增批量编辑与清空按钮，并挂到向导元素缓存', () => {
  assert.match(
    source,
    /class="am-wxt-strategy-head-main">[\s\S]*?id="am-wxt-keyword-add-strategy"[\s\S]*?id="am-wxt-keyword-strategy-count"[\s\S]*?class="am-wxt-strategy-head-tools">[\s\S]*?id="am-wxt-keyword-strategy-select-all"[\s\S]*?id="am-wxt-keyword-strategy-search"[\s\S]*?class="am-wxt-strategy-head-actions">[\s\S]*?id="am-wxt-keyword-batch-edit-strategy"[\s\S]*?id="am-wxt-keyword-clear-strategy"/,
    '首页计划头部缺少搜索、全选或批量操作控件'
  );
  assert.match(
    source,
    /strategySelectAllInput: overlay\.querySelector\('#am-wxt-keyword-strategy-select-all'\),[\s\S]*?strategySearchInput: overlay\.querySelector\('#am-wxt-keyword-strategy-search'\),[\s\S]*?batchEditStrategyBtn: overlay\.querySelector\('#am-wxt-keyword-batch-edit-strategy'\),[\s\S]*?clearStrategyBtn: overlay\.querySelector\('#am-wxt-keyword-clear-strategy'\),/,
    '计划搜索、全选或批量按钮未挂到 wizardState.els'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-strategy-head \{[\s\S]*?justify-content:\s*space-between;[\s\S]*?flex-wrap:\s*wrap;[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-head-tools \{[\s\S]*?flex:\s*1 1 280px;[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-search-input \{[\s\S]*?width:\s*min\(260px,\s*100%\);[\s\S]*?border:\s*1px solid rgba\(69,84,229,0\.3\);[\s\S]*?border-radius:\s*8px;[\s\S]*?padding:\s*6px 10px;[\s\S]*?font-size:\s*12px;[\s\S]*?background:\s*#eef2ff;[\s\S]*?color:\s*#2e3ab8;/,
    '首页计划头部未扩展搜索与全选布局'
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
