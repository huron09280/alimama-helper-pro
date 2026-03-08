import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

test('首页计划头部新增批量编辑与清空按钮，并挂到向导元素缓存', () => {
  assert.match(
    source,
    /class="am-wxt-strategy-head-main">[\s\S]*?id="am-wxt-keyword-add-strategy"[\s\S]*?id="am-wxt-keyword-strategy-count"[\s\S]*?class="am-wxt-strategy-head-actions">[\s\S]*?id="am-wxt-keyword-batch-edit-strategy"[\s\S]*?id="am-wxt-keyword-clear-strategy"/,
    '首页计划头部缺少批量编辑/清空按钮'
  );
  assert.match(
    source,
    /batchEditStrategyBtn: overlay\.querySelector\('#am-wxt-keyword-batch-edit-strategy'\),[\s\S]*?clearStrategyBtn: overlay\.querySelector\('#am-wxt-keyword-clear-strategy'\),/,
    '批量编辑/清空按钮未挂到 wizardState.els'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-strategy-head \{[\s\S]*?justify-content:\s*space-between;[\s\S]*?flex-wrap:\s*wrap;/,
    '首页计划头部未扩展为左右分栏布局'
  );
});

test('首页计划区会按已选计划刷新批量操作按钮状态', () => {
  assert.match(source, /const syncStrategyHeadActionState = \(\) => \{/, '缺少首页计划批量按钮状态同步 helper');
  assert.match(
    source,
    /const selectedCount = getSelectedStrategyList\(\)\.length;[\s\S]*?wizardState\.els\.batchEditStrategyBtn\.disabled = selectedCount <= 0;[\s\S]*?wizardState\.els\.clearStrategyBtn\.disabled = selectedCount <= 0 \|\| totalCount <= 1;/,
    '首页计划批量按钮未按已选计划数量控制禁用态'
  );
  assert.match(
    source,
    /const renderStrategyList = \(\) => \{[\s\S]*?wizardState\.els\.strategyCount\.textContent = String\(enabledCount\);[\s\S]*?syncStrategyHeadActionState\(\);/,
    '渲染计划列表时未同步批量操作按钮状态'
  );
});

test('批量编辑会进入编辑页，并在保存并关闭时同步到已选计划', () => {
  assert.match(source, /const buildBatchEditableStrategySnapshot = \(strategy = \{\}\) => \(\{/, '缺少批量编辑快照 helper');
  assert.match(
    source,
    /const applyBatchEditableStrategySnapshot = \(strategy = \{\}, snapshot = \{\}\) => \{[\s\S]*?strategy\.sceneName = snapshot\.sceneName;[\s\S]*?strategy\.sceneSettings = mergeDeep\(\{\}, normalizeSceneSettingsObject\(snapshot\.sceneSettings \|\| \{\}\)\);/,
    '批量编辑快照未回写到目标计划字段'
  );
  assert.match(
    source,
    /if \(Array\.isArray\(options\.batchSyncIds\)\) \{[\s\S]*?wizardState\.strategyBatchEditIds = uniqueBy\(/,
    'showStrategyDetail 未接收批量编辑目标集合'
  );
  assert.match(
    source,
    /const handleBatchEditStrategies = \(\) => \{[\s\S]*?const selectedStrategies = getSelectedStrategyList\(\);[\s\S]*?appendWizardLog\('请先勾选至少 1 个计划，再批量编辑', 'error'\);[\s\S]*?const batchSyncIds = selectedStrategies[\s\S]*?showStrategyDetail\(sourceStrategy,\s*\{[\s\S]*?batchSyncIds,[\s\S]*?switchWorkbench:\s*true[\s\S]*?\}\);[\s\S]*?appendWizardLog\(`已进入批量编辑：保存并关闭后将同步 \$\{batchSyncIds\.length\} 个已选计划`, 'success'\);/,
    '批量编辑按钮未进入“编辑后统一保存”的链路'
  );
  assert.match(
    source,
    /const closeDetailDialog = \(\) => \{[\s\S]*?const batchStrategyIds = uniqueBy\([\s\S]*?batchEditedCount = applyBatchEditToStrategies\(editingStrategy,\s*batchStrategyIds\);[\s\S]*?wizardState\.strategyBatchEditIds = \[\];[\s\S]*?appendWizardLog\(`已批量编辑 \$\{batchEditedCount\} 个计划`, 'success'\);/,
    '保存并关闭时未把批量编辑结果同步回已选计划'
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
