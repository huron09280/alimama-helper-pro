import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');
const escapeRegExp = (text) => String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const getLastCssBlock = (selector) => {
  const matches = Array.from(source.matchAll(new RegExp(`${escapeRegExp(selector)}\\s*\\{[^}]*\\}`, 'g')));
  return matches.at(-1)?.[0] || '';
};
const getLastCssBlockByPattern = (pattern) => {
  const matches = Array.from(source.matchAll(pattern));
  return matches.at(-1)?.[0] || '';
};

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
  const tabIdIndex = source.indexOf('id="am-wxt-workbench-tabs"');
  const tabBlockStart = tabIdIndex > -1 ? source.lastIndexOf('<div', tabIdIndex) : -1;
  const tabBlockEnd = tabIdIndex > -1 ? source.indexOf('</div>', tabIdIndex) : -1;
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

test('编辑计划详情背板和详情面板壳层改为白色轻玻璃背景', () => {
    const finalBackdropBlock = getLastCssBlock('#am-wxt-keyword-overlay #am-wxt-keyword-detail-backdrop');
    const finalDetailConfigBlock = getLastCssBlock('#am-wxt-keyword-modal #am-wxt-keyword-detail-config');
    const finalTitleFooterBlock = getLastCssBlockByPattern(/#am-wxt-keyword-detail-config \.am-wxt-detail-title,\s*#am-wxt-keyword-detail-config \.am-wxt-detail-footer\s*\{[^}]*\}/g);

    assert.match(
        finalBackdropBlock,
        /background:\s*rgba\(255,\s*255,\s*255,\s*0\.72\);/,
        '详情背板未改为白色半透明背景'
    );
    assert.match(
        finalBackdropBlock,
        /backdrop-filter:\s*blur\(8px\) saturate\(1\.15\);/,
        '详情背板缺少白色轻玻璃模糊'
    );
    assert.match(
        finalBackdropBlock,
        /-webkit-backdrop-filter:\s*blur\(8px\) saturate\(1\.15\);/,
        '详情背板缺少 WebKit 玻璃模糊'
    );
    assert.match(
        finalDetailConfigBlock,
        /background:\s*var\(--am26-panel-strong,/,
        '详情面板壳层未使用 --am26-panel-strong'
    );
    assert.match(
        finalDetailConfigBlock,
        /border:\s*1px solid var\(--am26-border-strong,/,
        '详情面板壳层边框未使用 --am26-border-strong'
    );
    assert.match(
        finalDetailConfigBlock,
        /box-shadow:\s*var\(--am26-shadow,/,
        '详情面板壳层阴影未使用 --am26-shadow'
    );
    assert.match(
        finalDetailConfigBlock,
        /color:\s*var\(--am26-text,/,
        '详情面板壳层文字未使用 --am26-text'
    );
    assert.match(
        finalDetailConfigBlock,
        /backdrop-filter:\s*blur\(18px\) saturate\(1\.35\);/,
        '详情面板壳层缺少浅玻璃面板模糊'
    );
    assert.match(
        finalTitleFooterBlock,
        /background:\s*var\(--am26-surface-strong,/,
        '详情标题栏和底部操作区未使用 --am26-surface-strong'
    );
    assert.match(
        finalTitleFooterBlock,
        /border-color:\s*var\(--am26-border,/,
        '详情标题栏和底部操作区分割线未使用 --am26-border'
    );
    assert.match(
        finalTitleFooterBlock,
        /box-shadow:\s*inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.28\);/,
        '详情标题栏和底部操作区缺少轻量内高光'
    );

    assert.doesNotMatch(
        finalBackdropBlock,
        /rgba\(15,\s*23,\s*42,\s*(?:0\.2|0\.28)\)/,
        '详情背板不得回退到旧暗色遮罩'
    );
    assert.doesNotMatch(
        finalDetailConfigBlock,
        /(?:background:\s*linear-gradient\(145deg,\s*rgba\(255,\s*255,\s*255,\s*0\.98\)|border:\s*1px solid rgba\(255,\s*255,\s*255,\s*0\.72\)|backdrop-filter:\s*blur\(12px\);)/,
        '详情面板壳层不得回退到旧硬编码白底面板'
    );
    assert.doesNotMatch(
        finalTitleFooterBlock,
        /(?:background:\s*rgba\(255,\s*255,\s*255,\s*0\.95\)|border-color:\s*rgba\(148,\s*163,\s*184,\s*0\.2\))/,
        '详情标题栏和底部操作区不得回退到旧硬编码白底灰边'
    );
});

test('编辑计划详情标题和场景配置区收敛到统一工作台结构', () => {
    assert.match(
        source,
        /<div class="am-wxt-detail-title-main">[\s\S]*?class="am-wxt-detail-title-icon"[\s\S]*?renderAmIcon\('edit', \{ size: 16, strokeWidth: 2\.1 \}\)[\s\S]*?<span id="am-wxt-keyword-detail-title">同步计划<\/span>[\s\S]*?<span class="am-wxt-detail-title-sub">场景配置 \/ 计划参数<\/span>[\s\S]*?<span class="am-wxt-detail-status">编辑中<\/span>/,
        '编辑计划详情标题缺少图标、说明或编辑状态'
    );
    assert.match(
        source,
        /#am-wxt-keyword-modal #am-wxt-keyword-detail-config \.am-wxt-detail-title \{[\s\S]*?min-height:\s*56px;[\s\S]*?border-bottom:\s*1px solid var\(--am26-border,[\s\S]*?background:\s*linear-gradient\(135deg,\s*rgba\(255,255,255,0\.56\),\s*rgba\(255,255,255,0\.24\)\);/,
        '编辑计划详情标题未使用统一浅玻璃标题栏'
    );
    assert.match(
        source,
        /#am-wxt-keyword-modal \.am-wxt-detail-title-icon \{[\s\S]*?width:\s*30px;[\s\S]*?height:\s*30px;[\s\S]*?background:\s*rgba\(69,84,229,0\.10\);[\s\S]*?color:\s*var\(--am26-primary-strong,/,
        '编辑计划详情标题图标缺少主色浅玻璃容器'
    );
    assert.match(
        source,
        /#am-wxt-keyword-modal \.am-wxt-detail-status \{[\s\S]*?border:\s*1px solid rgba\(14,168,111,0\.22\);[\s\S]*?background:\s*rgba\(14,168,111,0\.10\);[\s\S]*?color:\s*var\(--am26-success,/,
        '编辑计划状态胶囊缺少成功语义 token'
    );
    assert.match(
        source,
        /#am-wxt-keyword-modal #am-wxt-keyword-detail-config \.am-wxt-scene-dynamic \{[\s\S]*?border:\s*1px solid var\(--am26-border,[\s\S]*?border-radius:\s*14px;[\s\S]*?background:\s*linear-gradient\(145deg,\s*var\(--am26-surface-strong,[\s\S]*?backdrop-filter:\s*blur\(10px\) saturate\(1\.15\);/,
        '编辑计划场景配置区未收敛到统一浅玻璃工作区'
    );
    assert.match(
        source,
        /#am-wxt-keyword-modal #am-wxt-keyword-detail-config \.am-wxt-scene-setting-row \{[\s\S]*?grid-template-columns:\s*150px minmax\(0,\s*1fr\);[\s\S]*?border:\s*1px solid var\(--am26-border,[\s\S]*?border-radius:\s*12px;[\s\S]*?background:\s*var\(--am26-surface,/,
        '编辑计划场景配置行未使用稳定两列和 token 背景'
    );
});

test('高级设置弹窗局部收敛到浅玻璃，不扩大影响通用场景弹窗', () => {
    const finalAdvancedMaskBlock = getLastCssBlock('#am-wxt-scene-popup-mask:has(.am-wxt-scene-popup-dialog-advanced)');
    const finalAdvancedDialogBlock = getLastCssBlock('#am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog.am-wxt-scene-popup-dialog-advanced');
    const finalAdvancedTabActiveBlock = getLastCssBlock('#am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog-advanced .am-wxt-scene-advanced-tab.active');
    const finalAdvancedSurfaceBlock = getLastCssBlockByPattern(/#am-wxt-scene-popup-mask \.am-wxt-scene-popup-dialog-advanced \.am-wxt-scene-popup-time-grid,\s*#am-wxt-scene-popup-mask \.am-wxt-scene-popup-dialog-advanced \.am-wxt-scene-advanced-adzone-table,\s*#am-wxt-scene-popup-mask \.am-wxt-scene-popup-dialog-advanced \.am-wxt-scene-advanced-area-selector\s*\{[^}]*\}/g);

    assert.match(
        finalAdvancedMaskBlock,
        /background:\s*linear-gradient\(135deg,\s*rgba\(255,255,255,0\.78\),\s*rgba\(255,255,255,0\.48\)\);/,
        '高级设置弹窗遮罩未局部收敛到浅玻璃'
    );
    assert.match(
        finalAdvancedMaskBlock,
        /backdrop-filter:\s*blur\(10px\) saturate\(1\.18\);/,
        '高级设置弹窗遮罩缺少浅玻璃模糊'
    );
    assert.match(
        finalAdvancedDialogBlock,
        /width:\s*min\(1080px,\s*calc\(100vw - 32px\)\);/,
        '高级设置弹窗宽度未按工作台弹窗收敛'
    );
    assert.match(
        finalAdvancedDialogBlock,
        /background:\s*var\(--am26-panel-strong,/,
        '高级设置弹窗外壳未使用 --am26-panel-strong'
    );
    assert.match(
        finalAdvancedDialogBlock,
        /border:\s*1px solid var\(--am26-border-strong,/,
        '高级设置弹窗外壳未使用 --am26-border-strong'
    );
    assert.match(
        finalAdvancedDialogBlock,
        /backdrop-filter:\s*blur\(20px\) saturate\(1\.35\);/,
        '高级设置弹窗外壳未使用统一浅玻璃 token'
    );
    assert.match(
        finalAdvancedTabActiveBlock,
        /background:\s*var\(--am26-surface-strong,/,
        '高级设置 tab 激活态未使用 --am26-surface-strong'
    );
    assert.match(
        finalAdvancedTabActiveBlock,
        /color:\s*var\(--am26-primary-strong,/,
        '高级设置 tab 激活态未使用主色文本'
    );
    assert.match(
        finalAdvancedTabActiveBlock,
        /box-shadow:\s*0 8px 18px rgba\(69,84,229,0\.12\),/,
        '高级设置 tab 激活态未使用主色 token'
    );
    assert.match(
        finalAdvancedSurfaceBlock,
        /border:\s*1px solid var\(--am26-border,/,
        '高级设置时间/地域容器未使用 --am26-border'
    );
    assert.match(
        finalAdvancedSurfaceBlock,
        /border-radius:\s*12px;/,
        '高级设置时间/地域容器未使用统一圆角'
    );
    assert.match(
        finalAdvancedSurfaceBlock,
        /background:\s*var\(--am26-surface-strong,/,
        '高级设置时间/地域容器未使用 token 化面板'
    );
    assert.doesNotMatch(
        getLastCssBlock('#am-wxt-scene-popup-mask'),
        /rgba\(255,255,255,0\.78\)/,
        '通用场景弹窗遮罩不应被高级设置浅玻璃背景覆盖'
    );
});
