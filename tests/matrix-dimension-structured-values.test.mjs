import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

test('矩阵自由输入维度改为结构化多值编辑器', () => {
  assert.match(source, /const isMatrixDimensionStructuredValuePreset = \(preset = null\) => \{/, '缺少矩阵自由输入维度结构化判定 helper');
  assert.match(source, /const buildMatrixStructuredDimensionEditorHtml = \(values = \[\], preset = null\) => \{/, '缺少矩阵自由输入维度结构化编辑器 helper');
  assert.match(source, /const readMatrixStructuredDimensionValuesFromRow = \(row = null\) => \{/, '缺少矩阵自由输入维度读值 helper');
  assert.match(source, /const syncMatrixStructuredDimensionStateFromRow = \(row = null,\s*sceneName = ''\) => \{/, '缺少矩阵自由输入维度状态同步 helper');
  assert.match(source, /data-matrix-dimension-value-list="1"/, '矩阵自由输入维度缺少值列表容器');
  assert.match(source, /data-matrix-dimension-value-item="1"/, '矩阵自由输入维度缺少值项容器');
  assert.match(source, /data-matrix-dimension-value-item-input="1"/, '矩阵自由输入维度缺少值输入框');
  assert.match(source, /data-matrix-dimension-value-item-remove="1"/, '矩阵自由输入维度缺少值删除按钮');
  assert.match(source, /data-matrix-dimension-value-actions="1"/, '矩阵自由输入维度缺少加号操作容器');
  assert.match(source, /data-matrix-dimension-value-add="1"/, '矩阵自由输入维度缺少加号按钮');
  assert.match(source, /data-matrix-dimension-value-batch-menu="1"/, '矩阵自由输入维度缺少加号下拉面板');
  assert.match(source, /data-matrix-dimension-value-batch-manual="1"/, '矩阵自由输入维度缺少手动新增入口');
});

test('矩阵自由输入维度会按数值或文本决定是否显示批量新增', () => {
  assert.match(source, /key:\s*'budget'[\s\S]*?valueType:\s*'number'/, '预算值维度未声明为数值型');
  assert.match(source, /key:\s*'plan_prefix'[\s\S]*?valueType:\s*'text'/, '计划名前缀维度未声明为文本型');
  assert.match(source, /const isMatrixDimensionBatchValuePreset = \(preset = null\) => \{/, '缺少矩阵自由输入维度批量判定 helper');
  assert.match(
    source,
    /const buildMatrixDimensionValueBatchMenuHtml = \(preset = null,\s*baseValue = NaN,\s*options = \{\}\) => \{[\s\S]*?const supportsBatch = isMatrixDimensionBatchValuePreset\(preset\);[\s\S]*?const canSubmitBatch = canBatch && batchDraftState\.canSubmit;[\s\S]*?data-matrix-dimension-value-batch-manual="1"[\s\S]*?supportsBatch \? `[\s\S]*?data-matrix-dimension-value-batch-interval="1"[\s\S]*?data-matrix-dimension-value-batch-count="1"[\s\S]*?data-matrix-dimension-value-batch-add="\$\{canSubmitBatch \? '1' : '0'\}"/,
    '矩阵自由输入维度未按数值型条件渲染批量新增表单'
  );
  assert.match(
    source,
    /const appendMatrixDimensionBatchValues = \(row = null,\s*options = \{\}\) => \{[\s\S]*?const baseValue = getMatrixDimensionValueRowMaxNumericValue\(row\)[\s\S]*?const nextValue = formatMatrixDimensionNumericValue\(baseValue \+ interval \* step\)/,
    '矩阵自由输入维度批量新增未基于当前最大值递增生成'
  );
});

test('矩阵自由输入维度接入新增删除与批量事件链路', () => {
  assert.match(
    source,
    /const dimensionValueBatchAddBtn = event\.target instanceof Element[\s\S]*?closest\('\[data-matrix-dimension-value-batch-add="1"\]'\)[\s\S]*?appendMatrixDimensionBatchValues\(row,\s*\{[\s\S]*?interval:\s*intervalValue[\s\S]*?count:\s*countValue/,
    '矩阵自由输入维度批量新增按钮未接入点击链路'
  );
  assert.match(
    source,
    /const dimensionValueBatchManualBtn = event\.target instanceof Element[\s\S]*?closest\('\[data-matrix-dimension-value-batch-manual="1"\]'\)[\s\S]*?appendMatrixDimensionBatchValues\(row,\s*\{[\s\S]*?mode:\s*'manual'/,
    '矩阵自由输入维度手动新增按钮未接入点击链路'
  );
  assert.match(
    source,
    /const dimensionValueRemoveBtn = event\.target instanceof Element[\s\S]*?closest\('\[data-matrix-dimension-value-item-remove="1"\]'\)/,
    '矩阵自由输入维度删除按钮未接入点击链路'
  );
  assert.match(
    source,
    /event\.target instanceof HTMLInputElement && event\.target\.matches\('\[data-matrix-dimension-value-batch-interval="1"\], \[data-matrix-dimension-value-batch-count="1"\]'\)[\s\S]*?setMatrixDimensionValueBatchDraft\(row,\s*\{/,
    '矩阵自由输入维度批量草稿未接入输入链路'
  );
});

test('矩阵自由输入维度的 + 号紧跟值列表末尾渲染', () => {
  assert.match(
    source,
    /<div class="am-wxt-matrix-value-list" data-matrix-dimension-value-list="1">\s*\$\{itemValues\.map\(\(item, index\) => buildMatrixDimensionValueItemHtml\(item, preset, index\)\)\.join\(''\)\}\s*<div\s+class="am-wxt-matrix-dimension-picker am-wxt-matrix-value-actions"/,
    '矩阵自由输入维度的 + 号未跟随值列表末尾渲染'
  );
});

test('矩阵自由输入维度批量菜单补充间隔说明并收窄宽度', () => {
  assert.match(
    source,
    /class="am-wxt-matrix-value-batch-help">间隔填“隔多少”，个数填“生成多少个”<\/div>/,
    '矩阵自由输入维度批量菜单缺少间隔与个数说明'
  );
  assert.match(
    source,
    /\.am-wxt-matrix-value-batch-menu \{[\s\S]*?width: 196px;[\s\S]*?min-width: 196px;[\s\S]*?max-width: 196px;/,
    '矩阵自由输入维度批量菜单宽度未收窄到固定值'
  );
});
