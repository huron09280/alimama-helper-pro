import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getApplyStrategyBlock() {
  const start = source.indexOf('const applyStrategyToDetailForm = (strategy, options = {}) => {');
  assert.ok(start > -1, '无法定位 applyStrategyToDetailForm');
  const end = source.indexOf('const pullDetailFormToStrategy = (strategy) => {', start);
  assert.ok(end > start, '无法定位 pullDetailFormToStrategy');
  return source.slice(start, end);
}

function getOpenStrategyDetailBlock() {
  const start = source.indexOf('const openStrategyDetail = (strategyId) => {');
  assert.ok(start > -1, '无法定位 openStrategyDetail');
  const end = source.indexOf('const addNewStrategy = () => {', start);
  assert.ok(end > start, '无法定位 addNewStrategy');
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

test('编辑计划入口共用 showStrategyDetail 链路，顶部编辑页 tab 已移除', () => {
  const tabBlockStart = source.indexOf('<div class="am-wxt-workbench-tabs" id="am-wxt-workbench-tabs">');
  const tabBlockEnd = source.indexOf('</div>', tabBlockStart);
  const tabBlock = tabBlockStart > -1 && tabBlockEnd > tabBlockStart
    ? source.slice(tabBlockStart, tabBlockEnd)
    : '';
  assert.ok(tabBlock, '无法定位顶部工作台 tab 结构');
  assert.doesNotMatch(
    tabBlock,
    /data-workbench-page="editor"[\s\S]*?>编辑页<\/button>/,
    '顶部导航不应继续展示“编辑页”tab'
  );
  assert.match(
    tabBlock,
    /data-workbench-page="home"[\s\S]*?>首页<\/button>[\s\S]*data-workbench-page="matrix"[\s\S]*?>矩阵页<\/button>[\s\S]*data-workbench-page="previewlog"[\s\S]*?>日志页<\/button>/,
    '顶部导航应保留首页、矩阵页和日志页'
  );
  assert.match(
    source,
    /const showStrategyDetail = \(strategy = null, options = \{\}\) => \{[\s\S]*?applyStrategyToDetailForm\(targetStrategy\);[\s\S]*?setDetailVisible\(true\);[\s\S]*?wizardState\.setWorkbenchPage\('editor'\);[\s\S]*?commitStrategyUiState\(\{ refreshPreview: false \}\);[\s\S]*?maybeAutoLoadManualKeywords\(targetStrategy\);[\s\S]*?return targetStrategy;[\s\S]*?\};/,
    '缺少统一的 showStrategyDetail 打开链路，顶部编辑页与编辑计划仍可能分叉'
  );
  assert.doesNotMatch(
    source,
    /const showStrategyDetail = \(strategy = null, options = \{\}\) => \{[\s\S]*?applyStrategyToDetailForm\(targetStrategy,\s*\{[\s\S]*?renderSceneDynamic:\s*false/,
    '编辑计划入口不能跳过动态配置渲染，否则进入编辑页会空白'
  );
  assert.match(
    source,
    /const openStrategyDetail = \(strategyId\) => \{[\s\S]*?showStrategyDetail\(strategy\);[\s\S]*?\};/,
    '编辑计划入口没有复用 showStrategyDetail，字段联动仍可能不一致'
  );
  assert.doesNotMatch(
    getOpenStrategyDetailBlock(),
    /setDetailVisible\(false\)|setWorkbenchPage\('home'\)/,
    '编辑计划入口不应承担关闭语义，否则同计划点击会直接退出编辑态'
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

test('编辑计划旧基础设置容器保持隐藏，避免与场景配置重复显示', () => {
    assert.match(
        source,
        /#am-wxt-keyword-modal\s+\.am-wxt-static-settings\s*\{[^}]*display:\s*none\s*;/,
        '旧基础设置容器不应显示，编辑入口应使用下方场景配置表单'
    );
});

test('编辑计划弹层高于遮罩，避免输入框点击命中遮罩', () => {
    const modalBlock = source.match(/#am-wxt-keyword-modal\s*\{[^}]*\}/)?.[0] || '';
    assert.match(
        modalBlock,
        /position:\s*relative\s*;/,
        '编辑计划弹层必须建立独立层级，避免子级 fixed 面板被遮罩覆盖'
    );
    assert.match(
        modalBlock,
        /z-index:\s*1000008\s*;/,
        '编辑计划弹层 z-index 必须高于 detail backdrop 的 1000007'
    );
    assert.match(
        source,
        /#am-wxt-keyword-overlay\s+#am-wxt-keyword-detail-backdrop\.open\s*\+\s*#am-wxt-keyword-modal\s*\{[^}]*overflow:\s*visible\s*;/,
        '详情遮罩打开时 modal 必须允许 fixed 详情面板参与命中测试'
    );
});
