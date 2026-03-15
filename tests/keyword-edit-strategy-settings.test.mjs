import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getApplyStrategyBlock() {
  const start = source.indexOf('const applyStrategyToDetailForm = (strategy) => {');
  assert.ok(start > -1, '无法定位 applyStrategyToDetailForm');
  const end = source.indexOf('const pullDetailFormToStrategy = (strategy) => {', start);
  assert.ok(end > start, '无法定位 pullDetailFormToStrategy');
  return source.slice(start, end);
}

test('编辑计划切换策略时会覆盖 sceneSettingValues/sceneSettingTouched，避免残留上一个策略设置', () => {
  const block = getApplyStrategyBlock();
  assert.match(
    block,
    /wizardState\.draft\.sceneSettingValues\[strategyScene\]\s*=\s*mergeDeep\(\{\},\s*strategySceneSettingValues\);/,
    '缺少 sceneSettingValues 覆盖回填'
  );
  assert.match(
    block,
    /wizardState\.draft\.sceneSettingTouched\[strategyScene\]\s*=\s*mergeDeep\(\{\},\s*strategySceneSettingTouched\);/,
    '缺少 sceneSettingTouched 覆盖回填'
  );
  assert.doesNotMatch(
    block,
    /if\s*\(Object\.keys\(strategySceneSettingValues\)\.length\)\s*\{[\s\S]*wizardState\.draft\.sceneSettingValues\[strategyScene\]/,
    '仍存在按非空才回填 sceneSettingValues 的逻辑，可能导致编辑计划串值'
  );
  assert.doesNotMatch(
    block,
    /if\s*\(Object\.keys\(strategySceneSettingTouched\)\.length\)\s*\{[\s\S]*wizardState\.draft\.sceneSettingTouched\[strategyScene\]/,
    '仍存在按非空才回填 sceneSettingTouched 的逻辑，可能导致编辑计划串值'
  );
});

test('顶部编辑页与编辑计划共用 showStrategyDetail 链路，避免字段联动分叉', () => {
  assert.match(
    source,
    /const showStrategyDetail = \(strategy = null, options = \{\}\) => \{[\s\S]*?applyStrategyToDetailForm\(targetStrategy\);[\s\S]*?setDetailVisible\(true\);[\s\S]*?wizardState\.setWorkbenchPage\('editor'\);[\s\S]*?commitStrategyUiState\(\{ refreshPreview: false \}\);[\s\S]*?maybeAutoLoadManualKeywords\(targetStrategy\);[\s\S]*?return targetStrategy;[\s\S]*?\};/,
    '缺少统一的 showStrategyDetail 打开链路，顶部编辑页与编辑计划仍可能分叉'
  );
  assert.match(
    source,
    /const openStrategyDetail = \(strategyId\) => \{[\s\S]*?showStrategyDetail\(strategy\);[\s\S]*?\};/,
    '编辑计划入口没有复用 showStrategyDetail，字段联动仍可能不一致'
  );
  assert.match(
    source,
    /btn\.addEventListener\('click', \(\) => \{[\s\S]*?if \(nextPage === 'editor'\) \{[\s\S]*?showStrategyDetail\(activeStrategy\);[\s\S]*?return;[\s\S]*?\}[\s\S]*?setWorkbenchPage\(nextPage\);/,
    '顶部编辑页 tab 没有复用 showStrategyDetail，可能继续出现空白或全量字段'
  );
  assert.doesNotMatch(
    source,
    /const setWorkbenchPage = \(page = 'home'\) => \{[\s\S]*?if \(nextPage === 'editor'\) \{[\s\S]*?const editingStrategy = getStrategyById\(wizardState\.editingStrategyId\) \|\| wizardState\.strategyList\[0\] \|\| null;[\s\S]*?applyStrategyToDetailForm\(editingStrategy\);[\s\S]*?wizardState\.detailVisible = true;/,
    'setWorkbenchPage 里仍保留 editor 特判，顶部编辑页与编辑计划仍是两套链路'
  );
});

test('首页新建计划复用 showStrategyDetail，避免只开遮罩不进入编辑页', () => {
  assert.match(
    source,
    /const addNewStrategy = \(\) => \{[\s\S]*?wizardState\.strategyList\.push\(next\);[\s\S]*?showStrategyDetail\(next,\s*\{\s*autoLoad:\s*false\s*\}\);[\s\S]*?appendWizardLog\(`已新建计划：\$\{next\.name\}`, 'success'\);[\s\S]*?maybeAutoLoadManualKeywords\(next,\s*\{\s*delayMs:\s*320\s*\}\);[\s\S]*?\};/,
    '首页新建计划未复用统一详情链路，可能出现遮罩打开但编辑页未展示'
  );
});
