import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');
const matrixStyleSource = fs.readFileSync(new URL('../src/optimizer/keyword-plan-api/wizard-style-and-state/style.js', import.meta.url), 'utf8');
const matrixArrowSource = [
  '../src/optimizer/keyword-plan-api/request-builder-preview.js',
  '../src/optimizer/keyword-plan-api/wizard-style-and-state/matrix-bid-package.js'
].map(file => fs.readFileSync(new URL(file, import.meta.url), 'utf8')).join('\n');
const escapeRegExp = (text) => String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const getLastCssBlockFrom = (text, selector) => {
  const matches = Array.from(text.matchAll(new RegExp(`${escapeRegExp(selector)}\\s*\\{[^}]*\\}`, 'g')));
  return matches.at(-1)?.[0] || '';
};
const getLastCssBlockWithFrom = (text, selector, pattern) => {
  const matches = Array.from(text.matchAll(new RegExp(`${escapeRegExp(selector)}\\s*\\{[^}]*\\}`, 'g')))
    .map(match => match[0])
    .filter(block => pattern.test(block));
  return matches.at(-1) || '';
};
const getLastCssBlockContainingFrom = (text, selector, pattern = /[\s\S]/) => {
  const matches = Array.from(text.matchAll(/(^|\n)([^{}]+)\{[^}]*\}/g))
    .map(match => match[0].trim())
    .filter(block => {
      const selectorList = block.slice(0, block.indexOf('{'));
      return selectorList
        .split(',')
        .map(item => item.trim())
        .includes(selector) && pattern.test(block);
    });
  return matches.at(-1) || '';
};
const getLastCssBlock = (selector) => getLastCssBlockFrom(source, selector);
const getLastCssBlockWith = (selector, pattern) => getLastCssBlockWithFrom(source, selector, pattern);
const getLastMatch = (pattern) => Array.from(source.matchAll(pattern)).map(match => match[0]).at(-1) || '';

test('首页贴图改版包含运行态、轻量 Tab、摘要卡片、固定执行区和日志标题', () => {
  assert.match(source, /class="am-wxt-header-main"[\s\S]*?关键词推广批量建计划 API 向导[\s\S]*?class="am-wxt-runtime-pill"[\s\S]*?向导就绪/, 'Header 缺少向导就绪状态');
  assert.match(
    source,
    /data-workbench-page="home"[^>]*>首页<\/button>[\s\S]*?data-workbench-page="matrix"[^>]*>矩阵页<\/button>[\s\S]*?data-workbench-page="previewlog"[^>]*>日志页<\/button>/,
    '首页顶部 Tab 文案未保留首页/矩阵页/日志页，或矩阵入口不在顶部'
  );
  assert.match(
    source,
    /id="am-wxt-workbench-tabs" role="tablist" aria-label="组建计划工作台页签"[\s\S]*?role="tab" aria-selected="true"[\s\S]*?role="tab" aria-selected="false"[\s\S]*?role="tab" aria-selected="false"/,
    '首页顶部 Tab 缺少 tablist/tab 语义或 aria-selected 初始态'
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
  assert.match(
    source,
    /id="am-wxt-keyword-run-mode-toggle"[\s\S]*?aria-controls="am-wxt-keyword-run-mode-menu"[\s\S]*?renderAmIcon\('chevron-down', \{ size: 12, strokeWidth: 2\.4 \}\)/,
    '提交方式下拉按钮未使用共享 chevron 图标或缺少 aria-controls'
  );
  assert.match(source, /const syncHomeSummary = \(\) => \{[\s\S]*?summaryAddedCount[\s\S]*?summaryStrategyCount[\s\S]*?summaryBudgetTotal[\s\S]*?submitSummary[\s\S]*?将提交 <strong>\$\{enabledStrategyCount\}<\/strong> 个计划[\s\S]*?预算合计 \$\{budgetText\}[\s\S]*?提交方式：\$\{Utils\.escapeHtml\(submitModeText\)\}/, '首页摘要或底部预算摘要未接入动态同步');
});

test('组建计划工作台页签同步可访问状态并使用浅玻璃胶囊', () => {
  const finalTabsBlock = getLastCssBlock('#am-wxt-keyword-modal .am-wxt-workbench-tabs');
  const finalTabButtonBlock = getLastCssBlock('#am-wxt-keyword-modal .am-wxt-workbench-tabs .am-wxt-btn');
  const finalTabActiveBlock = getLastMatch(/#am-wxt-keyword-modal \.am-wxt-workbench-tabs \.am-wxt-btn\.primary,\s*#am-wxt-keyword-modal \.am-wxt-workbench-tabs \.am-wxt-btn\[aria-selected="true"\] \{[\s\S]*?\n\s*\}/g);

  assert.match(
    source,
    /const active = btn\.dataset\.workbenchPage === nextPage;[\s\S]*?btn\.classList\.toggle\('primary', active\);[\s\S]*?btn\.setAttribute\('aria-selected', active \? 'true' : 'false'\);[\s\S]*?btn\.tabIndex = active \? 0 : -1;/,
    '切换工作台页签时未同步 aria-selected 或键盘 tabIndex'
  );
  assert.match(finalTabsBlock, /border-radius:\s*999px;/, '工作台页签容器未改为胶囊形态');
  assert.match(finalTabsBlock, /background:\s*var\(--am26-surface,/, '工作台页签容器背景未使用 --am26-surface');
  assert.match(finalTabsBlock, /backdrop-filter:\s*blur\(10px\) saturate\(1\.18\);/, '工作台页签容器缺少浅玻璃模糊');
  assert.match(finalTabButtonBlock, /border-radius:\s*999px;/, '工作台页签按钮未改为胶囊形态');
  assert.match(finalTabButtonBlock, /background:\s*transparent;/, '工作台页签按钮默认态不应绘制整块白底');
  assert.match(finalTabButtonBlock, /white-space:\s*nowrap;/, '工作台页签按钮缺少单行保护');
  assert.match(finalTabActiveBlock, /background:\s*var\(--am26-surface-strong,/, '工作台页签 active 态未使用 --am26-surface-strong');
  assert.match(finalTabActiveBlock, /color:\s*var\(--am26-primary-strong,/, '工作台页签 active 态未使用品牌强调文字色');
  assert.doesNotMatch(finalTabsBlock, /background:\s*transparent;/, '工作台页签容器不得回退到普通下划线 Tab');
});

test('组建计划矩阵配置页收敛到统一浅玻璃 token', () => {
  const matrixWorkspaceBlock = getLastCssBlockWithFrom(matrixStyleSource, '#am-wxt-keyword-modal .am-wxt-matrix-workspace', /gap:\s*12px;/);
  const matrixCardBlock = getLastCssBlockFrom(matrixStyleSource, '#am-wxt-keyword-modal .am-wxt-matrix-card');
  const matrixStatBlock = getLastCssBlockFrom(matrixStyleSource, '#am-wxt-keyword-modal .am-wxt-matrix-stat');
  const matrixActionNoteBlock = getLastCssBlockFrom(matrixStyleSource, '#am-wxt-keyword-modal .am-wxt-matrix-action-note');
  const matrixSceneCardBlock = getLastCssBlockContainingFrom(matrixStyleSource, '#am-wxt-keyword-modal .am-wxt-matrix-scene-card', /background:\s*var\(--am26-surface,/);
  const matrixDimensionBoxBlock = getLastCssBlockContainingFrom(matrixStyleSource, '#am-wxt-keyword-modal .am-wxt-matrix-dimension-box', /padding:\s*10px;/);
  const matrixDimensionRowBlock = getLastCssBlockContainingFrom(matrixStyleSource, '#am-wxt-keyword-modal .am-wxt-matrix-dimension-row', /background:\s*linear-gradient\(145deg,/);
  const matrixAddCardBlock = getLastCssBlockContainingFrom(matrixStyleSource, '#am-wxt-keyword-modal .am-wxt-matrix-dimension-add-card', /background:\s*linear-gradient\(145deg,/);
  const matrixPickerPanelBlock = getLastCssBlockFrom(matrixStyleSource, '#am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-panel');

  assert.match(matrixWorkspaceBlock, /gap:\s*12px;/, '矩阵工作区缺少紧凑栅格间距');
  assert.match(matrixCardBlock, /border:\s*1px solid var\(--am26-border,/, '矩阵卡片边框未使用 --am26-border');
  assert.match(matrixCardBlock, /background:\s*linear-gradient\(145deg,\s*var\(--am26-surface-strong,[\s\S]*?var\(--am26-surface,/, '矩阵卡片背景未使用 --am26 surface 渐变');
  assert.match(matrixCardBlock, /backdrop-filter:\s*blur\(10px\) saturate\(1\.15\);/, '矩阵卡片缺少浅玻璃模糊');
  assert.match(matrixStatBlock, /background:\s*var\(--am26-surface,/, '矩阵统计胶囊未使用 --am26-surface');
  assert.match(matrixStatBlock, /box-shadow:\s*inset 0 1px 0 rgba\(255,255,255,0\.3\);/, '矩阵统计胶囊缺少内高光');
  assert.match(matrixActionNoteBlock, /color:\s*var\(--am26-text-soft,/, '矩阵操作提示未使用 --am26-text-soft');
  assert.match(matrixSceneCardBlock, /background:\s*var\(--am26-surface,/, '矩阵场景配置卡片未使用 --am26-surface');
  assert.match(matrixDimensionBoxBlock, /padding:\s*10px;/, '矩阵维度容器缺少紧凑内边距');
  assert.match(matrixDimensionRowBlock, /background:\s*linear-gradient\(145deg,\s*var\(--am26-surface-strong,[\s\S]*?var\(--am26-surface,/, '矩阵维度行未使用 --am26 surface 渐变');
  assert.match(matrixAddCardBlock, /background:\s*linear-gradient\(145deg,\s*var\(--am26-surface-strong,[\s\S]*?var\(--am26-surface,/, '矩阵新增维度卡片未使用 --am26 surface 渐变');
  assert.match(matrixPickerPanelBlock, /background:\s*var\(--am26-panel-strong,/, '矩阵下拉面板未使用 --am26-panel-strong');
  assert.match(matrixPickerPanelBlock, /backdrop-filter:\s*blur\(12px\) saturate\(1\.25\);/, '矩阵下拉面板缺少浅玻璃模糊');
  assert.doesNotMatch(matrixCardBlock, /background:\s*(?:#fff|linear-gradient\(180deg,\s*rgba\(255,255,255,0\.98\))/, '矩阵卡片不得回退到旧白底');
  assert.doesNotMatch(matrixDimensionRowBlock, /background:\s*#fff;/, '矩阵维度行不得回退到硬编码白底');
  assert.doesNotMatch(matrixPickerPanelBlock, /background:\s*#fff;/, '矩阵下拉面板不得回退到硬编码白底');
});

test('矩阵配置页选择器箭头使用共享 SVG 并支持旋转状态', () => {
  const finalArrowBlock = getLastCssBlockWithFrom(matrixStyleSource, '#am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-arrow', /background-image:\s*none !important;/);
  const finalArrowBeforeBlock = getLastCssBlockFrom(matrixStyleSource, '#am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-arrow::before');
  const finalArrowSvgBlock = getLastCssBlockFrom(matrixStyleSource, '#am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-arrow svg');
  const finalArrowOpenBlock = getLastCssBlockFrom(matrixStyleSource, '#am-wxt-keyword-modal .am-wxt-matrix-dimension-picker.open .am-wxt-matrix-dimension-picker-arrow');
  const chevronUsages = matrixArrowSource.match(/class="am-wxt-matrix-dimension-picker-arrow" aria-hidden="true">\$\{renderAmIcon\('chevron-down', \{ size: 14, strokeWidth: 2\.4 \}\)\}<\/span>/g) || [];

  assert.ok(chevronUsages.length >= 3, '矩阵维度和出价目标选择器箭头未全部使用共享 chevron-down SVG');
  assert.match(finalArrowBlock, /background-image:\s*none !important;/, '矩阵选择器箭头未禁用旧 data-url 背景图');
  assert.match(finalArrowBeforeBlock, /content:\s*none !important;/, '矩阵选择器箭头仍可能使用 CSS 边框手绘');
  assert.match(finalArrowSvgBlock, /width:\s*14px;[\s\S]*?height:\s*14px;/, '矩阵选择器 SVG 尺寸不稳定');
  assert.match(finalArrowOpenBlock, /transform:\s*rotate\(180deg\);/, '矩阵选择器打开态缺少 chevron 旋转反馈');
  assert.doesNotMatch(finalArrowBlock, /url\("data:image\/svg\+xml/, '矩阵选择器箭头不得继续依赖 CSS data URL 图标');
});

test('组建计划主弹窗外壳对齐统一 UI 规范', () => {
  const finalOuterOverlayBlock = getLastCssBlock('#am-wxt-keyword-overlay:not(.item-picker-open)');
  const finalItemPickerOverlayBlock = getLastCssBlock('#am-wxt-keyword-overlay.item-picker-open');
  const finalModalBlock = getLastCssBlock('#am-wxt-keyword-modal');

  assert.match(
    source,
    /id="am-wxt-keyword-modal" role="dialog" aria-modal="true" aria-labelledby="am-wxt-keyword-title"[\s\S]*?<h3 class="am-wxt-title" id="am-wxt-keyword-title">关键词推广批量建计划 API 向导<\/h3>[\s\S]*?<button type="button" class="am-wxt-close" id="am-wxt-keyword-close" title="关闭" aria-label="关闭">/,
    '组建计划主弹窗缺少标题关联、稳定标题 id 或关闭按钮 type'
  );
  assert.match(finalOuterOverlayBlock, /background:\s*linear-gradient\(135deg,\s*rgba\(255,\s*255,\s*255,\s*0\.78\),\s*rgba\(255,\s*255,\s*255,\s*0\.48\)\);/, '组建计划主弹窗窗口外背景未改为白色玻璃渐变');
  assert.match(finalOuterOverlayBlock, /backdrop-filter:\s*blur\(8px\) saturate\(1\.15\);/, '组建计划主弹窗窗口外缺少轻量玻璃模糊');
  assert.match(finalItemPickerOverlayBlock, /background:\s*transparent;/, '添加商品二级弹窗打开时主 overlay 不应叠加窗口外背景');
  assert.match(finalItemPickerOverlayBlock, /backdrop-filter:\s*none;/, '添加商品二级弹窗打开时主 overlay 不应叠加 blur');
  assert.match(finalItemPickerOverlayBlock, /-webkit-backdrop-filter:\s*none;/, '添加商品二级弹窗打开时主 overlay 不应叠加 webkit blur');
  assert.doesNotMatch(finalOuterOverlayBlock, /background:\s*(?:transparent|rgba\(27,\s*36,\s*56,\s*0\.28\));/, '组建计划主弹窗窗口外不得回退为透明或旧灰色遮罩');
  assert.match(
    finalModalBlock,
    /width:\s*min\(1320px,\s*calc\(100vw - 48px\)\);[\s\S]*?background:\s*var\(--am26-panel-strong,[\s\S]*?rgba\(255,\s*255,\s*255,\s*0\.6\),\s*rgba\(255,\s*255,\s*255,\s*0\.2\)[\s\S]*?border:\s*1px solid var\(--am26-border-strong,[\s\S]*?border-radius:\s*18px;[\s\S]*?box-shadow:\s*var\(--am26-shadow,[\s\S]*?backdrop-filter:\s*blur\(20px\) saturate\(1\.4\);[\s\S]*?font-family:\s*var\(--am26-font,/,
    '组建计划最终生效弹窗外壳未保持轻透明 --am26 浅玻璃面板'
  );
  assert.doesNotMatch(finalModalBlock, /rgba\(255,\s*255,\s*255,\s*0\.9[0-9]\)/, '组建计划主面板本体不得再次强白化');
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-title \{[\s\S]*?margin:\s*0;[\s\S]*?min-width:\s*0;[\s\S]*?text-overflow:\s*ellipsis;[\s\S]*?font-size:\s*14px;[\s\S]*?letter-spacing:\s*0;/,
    '组建计划标题缺少紧凑标题与省略保护'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-btn:focus-visible,\s*#am-wxt-keyword-modal \.am-wxt-close:focus-visible \{[\s\S]*?outline:\s*2px solid rgba\(37,\s*99,\s*235,\s*0\.45\);[\s\S]*?box-shadow:\s*0 0 0 4px rgba\(69,\s*84,\s*229,\s*0\.12\);/,
    '组建计划按钮和关闭按钮缺少统一可见 focus 态'
  );
  assert.match(
    source,
    /@media \(prefers-reduced-motion:\s*reduce\) \{[\s\S]*?#am-wxt-keyword-modal \.am-wxt-btn,[\s\S]*?#am-wxt-keyword-modal \.am-wxt-close,[\s\S]*?transition:\s*none !important;/,
    '组建计划向导缺少 reduced-motion 覆盖'
  );
});

test('组建计划主向导内部整块灰底按小万护航方式移除', () => {
  const finalBodyBlock = getLastCssBlock('#am-wxt-keyword-modal .am-wxt-body');
  const finalTabsBlock = getLastCssBlock('#am-wxt-keyword-modal .am-wxt-workbench-tabs');
  const finalStrategyListBlock = getLastCssBlock('#am-wxt-keyword-modal .am-wxt-strategy-list');
  const finalStrategyListHeadBlock = getLastCssBlockWith('#am-wxt-keyword-modal .am-wxt-strategy-list-head', /background:/);
  const finalStrategyItemBlock = getLastCssBlock('#am-wxt-keyword-modal .am-wxt-strategy-item');

  assert.match(finalBodyBlock, /background:\s*transparent;/, '组建计划内容区仍在绘制整块灰白底');
  assert.match(finalTabsBlock, /background:\s*var\(--am26-surface,/, '组建计划顶部页签未使用浅玻璃胶囊承载');
  assert.match(finalStrategyListBlock, /background:\s*transparent;/, '组建计划首页计划列表仍在绘制整块白底');
  assert.match(finalStrategyListHeadBlock, /background:\s*var\(--am26-surface,/, '组建计划首页表头未使用半透明 token');
  assert.match(finalStrategyItemBlock, /background:\s*transparent;/, '组建计划首页计划行仍在绘制整块白底');
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-body \{[\s\S]*?background:\s*transparent;[\s\S]*?#am-wxt-keyword-modal \.am-wxt-workbench-tabs \{[\s\S]*?background:\s*var\(--am26-surface,/,
    '组建计划内容区或顶部页签仍在绘制整块灰白底'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-panel,[\s\S]*?#am-wxt-keyword-modal \.am-wxt-manual-keyword-panel \{[\s\S]*?border:\s*1px solid var\(--am26-border,[\s\S]*?background:\s*var\(--am26-surface,[\s\S]*?backdrop-filter:\s*blur\(10px\) saturate\(1\.15\);/,
    '组建计划主内容容器未按 --am26 半透明面板承载背景'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-strategy-list \{[\s\S]*?background:\s*transparent;[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-list-head \{[\s\S]*?background:\s*var\(--am26-surface,[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-item \{[\s\S]*?background:\s*transparent;/,
    '组建计划首页计划列表仍在使用整块白灰底'
  );
  assert.doesNotMatch(finalBodyBlock, /background:\s*(?:rgba\(255,\s*255,\s*255,\s*0\.12\)|#f7f8fc|#fff|#f8fafc);/, '组建计划内容区不得回退到整块灰白背景');
  assert.doesNotMatch(finalTabsBlock, /background:\s*(?:transparent|#fff|#f8fafc);/, '组建计划顶部页签不得回退到整块灰白背景或普通下划线态');
  assert.doesNotMatch(finalStrategyListBlock, /background:\s*#fff;/, '组建计划首页计划列表不得回退到 #fff 整块铺底');
  assert.doesNotMatch(finalStrategyListHeadBlock, /background:\s*#f8fafc;/, '组建计划首页表头不得回退到 #f8fafc 整块铺底');
  assert.doesNotMatch(finalStrategyItemBlock, /background:\s*#fff;/, '组建计划首页计划行不得回退到 #fff 整块铺底');
});

test('组建计划首页摘要卡片收敛到统一 token', () => {
  const finalHomeSummaryBlock = getLastCssBlock('#am-wxt-keyword-modal .am-wxt-home-summary');
  const finalHomeStatBlock = getLastCssBlock('#am-wxt-keyword-modal .am-wxt-home-stat');
  const finalHomeStatLabelBlock = getLastCssBlock('#am-wxt-keyword-modal .am-wxt-home-stat-label');
  const finalHomeStatStrongBlock = getLastCssBlock('#am-wxt-keyword-modal .am-wxt-home-stat strong');
  const finalHomeStatUnitBlock = getLastCssBlock('#am-wxt-keyword-modal .am-wxt-home-stat strong small');

  assert.match(finalHomeSummaryBlock, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/, '首页摘要容器缺少稳定三列布局');
  assert.match(finalHomeStatBlock, /border:\s*1px solid var\(--am26-border,/, '首页摘要卡片边框未使用 --am26-border');
  assert.match(finalHomeStatBlock, /background:\s*linear-gradient\(145deg,\s*var\(--am26-surface-strong,[\s\S]*?var\(--am26-surface,/, '首页摘要卡片背景未使用 --am26-surface token 渐变');
  assert.match(finalHomeStatBlock, /box-shadow:\s*inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.36\),\s*0 8px 20px rgba\(31,38,135,0\.06\);/, '首页摘要卡片缺少轻量内高光和浅阴影');
  assert.match(finalHomeStatLabelBlock, /color:\s*var\(--am26-text-soft,/, '首页摘要标签未使用 --am26-text-soft');
  assert.match(finalHomeStatStrongBlock, /color:\s*var\(--am26-primary-strong,/, '首页摘要数字未使用 --am26-primary-strong');
  assert.match(finalHomeStatUnitBlock, /color:\s*var\(--am26-text,/, '首页摘要单位未使用 --am26-text');
  assert.doesNotMatch(finalHomeStatBlock, /(?:border:\s*1px solid #eef2f7|background:\s*#fff);/, '首页摘要卡片不得回退到硬编码白底灰边');
  assert.doesNotMatch(finalHomeStatLabelBlock, /color:\s*#64748b;/, '首页摘要标签不得回退到硬编码灰色');
  assert.doesNotMatch(finalHomeStatStrongBlock, /color:\s*#0f172a;/, '首页摘要数字不得回退到硬编码深灰');
  assert.doesNotMatch(finalHomeStatUnitBlock, /color:\s*#0f172a;/, '首页摘要单位不得回退到硬编码深灰');
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
    /const openKeywordSubmitConfirmPopup = async \(\{ req = \{\}, sceneRequests = \[\] \} = \{\}\) => \{[\s\S]*?data-submit-confirm-dialog="1"[\s\S]*?renderAmIcon\('alert-triangle', \{ size: 18, strokeWidth: 2\.1 \}\)[\s\S]*?即将调用创建接口[\s\S]*?待提交[\s\S]*?data-submit-confirm-plan-count="1"[\s\S]*?data-submit-confirm-budget="1"[\s\S]*?data-submit-confirm-item-count="1"[\s\S]*?data-submit-confirm-mode="1"[\s\S]*?data-submit-confirm-scenes="1"[\s\S]*?确认后会调用创建接口/,
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
  const finalHeadActionButtonBlock = getLastMatch(/#am-wxt-keyword-modal \.am-wxt-strategy-head-actions \.am-wxt-btn,\s*#am-wxt-keyword-modal #am-wxt-keyword-batch-edit-strategy,\s*#am-wxt-keyword-modal #am-wxt-keyword-clear-strategy \{[\s\S]*?\n\s*\}/g);
  const finalHeadActionButtonHoverBlock = getLastMatch(/#am-wxt-keyword-modal \.am-wxt-strategy-head-actions \.am-wxt-btn:hover,\s*#am-wxt-keyword-modal \.am-wxt-strategy-head-actions \.am-wxt-btn:focus-visible \{[\s\S]*?\n\s*\}/g);
  const finalHeadActionButtonDisabledBlock = getLastMatch(/#am-wxt-keyword-modal \.am-wxt-strategy-head-actions \.am-wxt-btn:disabled,\s*#am-wxt-keyword-modal #am-wxt-keyword-batch-edit-strategy:disabled,\s*#am-wxt-keyword-modal #am-wxt-keyword-clear-strategy:disabled \{[\s\S]*?\n\s*\}/g);

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
  assert.match(finalHeadActionButtonBlock, /border:\s*1px solid var\(--am26-border,/, '批量编辑/清空按钮边框未使用 --am26-border');
  assert.match(finalHeadActionButtonBlock, /background:\s*var\(--am26-surface-strong,/, '批量编辑/清空按钮默认态未使用白色轻玻璃背景');
  assert.match(finalHeadActionButtonBlock, /color:\s*var\(--am26-text-soft,/, '批量编辑/清空按钮默认态文字未使用 --am26-text-soft');
  assert.match(finalHeadActionButtonBlock, /box-shadow:\s*inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.32\);/, '批量编辑/清空按钮默认态缺少轻玻璃内高光');
  assert.match(finalHeadActionButtonHoverBlock, /background:\s*rgba\(255,\s*255,\s*255,\s*0\.72\);/, '批量编辑/清空按钮 hover/focus 未提升为白色玻璃背景');
  assert.match(finalHeadActionButtonHoverBlock, /color:\s*var\(--am26-text,/, '批量编辑/清空按钮 hover/focus 文字未使用 --am26-text');
  assert.match(finalHeadActionButtonHoverBlock, /box-shadow:\s*0 0 0 3px rgba\(69,\s*84,\s*229,\s*0\.12\),\s*inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.36\);/, '批量编辑/清空按钮 hover/focus 缺少品牌弱光和内高光');
  assert.match(finalHeadActionButtonDisabledBlock, /background:\s*var\(--am26-surface,/, '批量编辑/清空按钮 disabled 态未保持白色轻玻璃背景');
  assert.match(finalHeadActionButtonDisabledBlock, /color:\s*rgba\(80,\s*90,\s*116,\s*0\.62\);/, '批量编辑/清空按钮 disabled 态文字未使用统一弱文本色');
  assert.match(finalHeadActionButtonDisabledBlock, /opacity:\s*1;/, '批量编辑/清空按钮 disabled 态不得依赖浏览器灰化透明度');
  assert.doesNotMatch(finalHeadActionButtonBlock, /(?:#f8fafc|#eff6ff|#cbd5e1|#475569|#1d4ed8)/, '批量编辑/清空按钮默认态不得回退到旧灰蓝硬编码色');
  assert.doesNotMatch(finalHeadActionButtonDisabledBlock, /(?:#f8fafc|#eff6ff|#cbd5e1|#475569|#1d4ed8)/, '批量编辑/清空按钮 disabled 态不得回退到旧灰蓝硬编码色');
});

test('首页工具条、搜索框和计划行文字控件收敛到统一 token', () => {
  const finalToolbarInputBlock = getLastMatch(/#am-wxt-keyword-modal \.am-wxt-toolbar input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\),[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-search-input \{[\s\S]*?\n\s*\}/g);
  const finalPlaceholderBlock = getLastMatch(/#am-wxt-keyword-modal \.am-wxt-toolbar input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\)::placeholder,[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-search-input::placeholder \{[\s\S]*?\n\s*\}/g);
  const finalFocusBlock = getLastMatch(/#am-wxt-keyword-modal \.am-wxt-toolbar input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\):focus,[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-search-input:focus \{[\s\S]*?\n\s*\}/g);
  const finalItemPickerToolbarBlock = getLastCssBlock('#am-wxt-keyword-item-picker-mask .am-wxt-toolbar');
  const finalItemPickerToolbarInputBlock = getLastCssBlock('#am-wxt-keyword-item-picker-mask .am-wxt-toolbar input:not([type="checkbox"]):not([type="radio"])');
  const finalItemPickerToolbarInputPlaceholderBlock = getLastCssBlock('#am-wxt-keyword-item-picker-mask .am-wxt-toolbar input:not([type="checkbox"]):not([type="radio"])::placeholder');
  const finalItemPickerToolbarInputFocusBlock = getLastCssBlock('#am-wxt-keyword-item-picker-mask .am-wxt-toolbar input:not([type="checkbox"]):not([type="radio"]):focus');
  const finalSectionTitleBlock = getLastCssBlock('#am-wxt-keyword-modal .am-wxt-strategy-section-title');
  const finalSearchInputBlock = getLastCssBlockWith(
    '#am-wxt-keyword-modal .am-wxt-strategy-search-input',
    /color:\s*var\(--am26-text,/
  );
  const finalStrategyNameBlock = getLastCssBlock('#am-wxt-keyword-modal .am-wxt-strategy-name');
  const finalInlineInputBlock = getLastCssBlock('#am-wxt-keyword-modal .am-wxt-strategy-inline-input');
  const finalInlineInputFocusBlock = getLastCssBlock('#am-wxt-keyword-modal .am-wxt-strategy-inline-input:focus');
  const finalInlineEditBtnBlock = getLastCssBlockWith(
    '#am-wxt-keyword-modal .am-wxt-strategy-inline-edit-btn',
    /color:\s*var\(--am26-text-soft,/
  );
  const finalInlineEditBtnFocusBlock = getLastMatch(/#am-wxt-keyword-modal \.am-wxt-strategy-inline-edit-btn:hover,\s*#am-wxt-keyword-modal \.am-wxt-strategy-inline-edit-btn:focus-visible \{[\s\S]*?\n\s*\}/g);
  const finalStrategySummaryBlock = getLastCssBlock('#am-wxt-keyword-modal .am-wxt-strategy-summary');
  const finalMutedSummaryBlock = getLastCssBlock('#am-wxt-keyword-modal .am-wxt-strategy-summary.muted');
  const finalCopyMultiBlock = getLastCssBlock('#am-wxt-keyword-modal .am-wxt-copy-multi');

  assert.match(finalToolbarInputBlock, /border:\s*1px solid var\(--am26-border,/, '首页工具条/搜索输入边框未使用 --am26-border');
  assert.match(finalToolbarInputBlock, /background:\s*var\(--am26-surface-strong,/, '首页工具条/搜索输入背景未使用 --am26-surface-strong');
  assert.match(finalToolbarInputBlock, /color:\s*var\(--am26-text,/, '首页工具条/搜索输入文字未使用 --am26-text');
  assert.match(finalToolbarInputBlock, /box-shadow:\s*inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.3\);/, '首页工具条/搜索输入缺少浅玻璃内高光');
  assert.match(finalPlaceholderBlock, /color:\s*rgba\(80,\s*90,\s*116,\s*0\.62\);/, '首页工具条/搜索输入 placeholder 未使用统一弱文本色');
  assert.match(finalFocusBlock, /border-color:\s*rgba\(69,\s*84,\s*229,\s*0\.42\);[\s\S]*?box-shadow:\s*0 0 0 3px rgba\(69,\s*84,\s*229,\s*0\.12\);/, '首页工具条/搜索输入 focus 态未收敛到统一品牌弱光');
  assert.match(finalItemPickerToolbarBlock, /border-bottom:\s*1px solid var\(--am26-border,/, '商品候选选择器工具条边框未使用 --am26-border');
  assert.match(finalItemPickerToolbarBlock, /background:\s*var\(--am26-surface,/, '商品候选选择器工具条背景未使用 --am26-surface');
  assert.match(finalItemPickerToolbarInputBlock, /border:\s*1px solid var\(--am26-border,/, '商品搜索输入最终运行态宿主未使用 --am26-border');
  assert.match(finalItemPickerToolbarInputBlock, /background:\s*var\(--am26-surface-strong,/, '商品搜索输入最终运行态宿主未使用 --am26-surface-strong');
  assert.match(finalItemPickerToolbarInputBlock, /color:\s*var\(--am26-text,/, '商品搜索输入最终运行态宿主未使用 --am26-text');
  assert.match(finalItemPickerToolbarInputBlock, /box-shadow:\s*inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.3\);/, '商品搜索输入最终运行态宿主缺少浅玻璃内高光');
  assert.match(finalItemPickerToolbarInputPlaceholderBlock, /color:\s*rgba\(80,\s*90,\s*116,\s*0\.62\);/, '商品搜索输入 placeholder 未使用统一弱文本色');
  assert.match(finalItemPickerToolbarInputFocusBlock, /border-color:\s*rgba\(69,\s*84,\s*229,\s*0\.42\);[\s\S]*?box-shadow:\s*0 0 0 3px rgba\(69,\s*84,\s*229,\s*0\.12\);/, '商品搜索输入 focus 态未收敛到统一品牌弱光');
  assert.match(finalSectionTitleBlock, /background:\s*rgba\(69,84,229,0\.08\);/, '计划配置标题未使用品牌浅色胶囊背景');
  assert.match(finalSectionTitleBlock, /color:\s*var\(--am26-primary-strong,/, '计划配置标题未使用品牌强调色');
  assert.match(finalSearchInputBlock, /color:\s*var\(--am26-text,/, '计划搜索框文字未使用 --am26-text');
  assert.match(finalSearchInputBlock, /background:\s*var\(--am26-surface-strong,/, '计划搜索框背景未使用 --am26-surface-strong');
  assert.match(finalStrategyNameBlock, /color:\s*var\(--am26-text,/, '计划名称文字未使用 --am26-text');
  assert.match(finalInlineInputBlock, /border:\s*1px solid var\(--am26-border,/, '计划行内编辑输入边框未使用 --am26-border');
  assert.match(finalInlineInputBlock, /background:\s*var\(--am26-surface-strong,/, '计划行内编辑输入背景未使用 --am26-surface-strong');
  assert.match(finalInlineInputBlock, /color:\s*var\(--am26-text,/, '计划行内编辑输入文字未使用 --am26-text');
  assert.match(finalInlineInputFocusBlock, /border-color:\s*rgba\(69,\s*84,\s*229,\s*0\.42\);[\s\S]*?box-shadow:\s*0 0 0 3px rgba\(69,\s*84,\s*229,\s*0\.12\);/, '计划行内编辑输入 focus 态未收敛到统一品牌弱光');
  assert.match(finalInlineEditBtnBlock, /color:\s*var\(--am26-text-soft,/, '计划行内编辑按钮默认态未使用 --am26-text-soft');
  assert.match(finalInlineEditBtnFocusBlock, /background:\s*var\(--am26-surface-strong,[\s\S]*?color:\s*var\(--am26-primary-strong,[\s\S]*?box-shadow:\s*0 0 0 3px rgba\(69,\s*84,\s*229,\s*0\.12\);/, '计划行内编辑按钮 hover/focus 未使用统一 token');
  assert.match(finalStrategySummaryBlock, /color:\s*var\(--am26-text-soft,/, '计划摘要文字未使用 --am26-text-soft');
  assert.match(finalMutedSummaryBlock, /color:\s*rgba\(80,\s*90,\s*116,\s*0\.62\);/, '计划弱摘要文字未使用统一弱文本色');
  assert.match(finalCopyMultiBlock, /background:\s*var\(--am26-surface,/, '复制数量徽标背景未使用 --am26-surface');
  assert.match(finalCopyMultiBlock, /border-color:\s*var\(--am26-border,/, '复制数量徽标边框未使用 --am26-border');
  assert.match(finalCopyMultiBlock, /color:\s*var\(--am26-text-soft,/, '复制数量徽标文字未使用 --am26-text-soft');

  assert.doesNotMatch(finalToolbarInputBlock, /(?:border:\s*1px solid #cbd5e1|background:\s*#fff|color:\s*#111827);/, '首页工具条/搜索输入不得回退到硬编码白底灰边深色文字');
  assert.doesNotMatch(finalItemPickerToolbarBlock, /(?:background:\s*#fff|background:\s*#f8fafc);/, '商品候选选择器工具条不得回退到整块白灰底');
  assert.doesNotMatch(finalItemPickerToolbarInputBlock, /(?:border:\s*1px solid rgba\(148,\s*163,\s*184,\s*0\.5\)|background:\s*#fff|color:\s*#1f2937);/, '商品搜索输入不得被旧基础工具条样式覆盖');
  assert.doesNotMatch(finalSectionTitleBlock, /color:\s*#0f172a;/, '计划配置标题不得回退到硬编码深色');
  assert.doesNotMatch(finalStrategyNameBlock, /color:\s*#0f172a;/, '计划名称不得回退到硬编码深色');
  assert.doesNotMatch(finalInlineInputBlock, /(?:border:\s*1px solid #cbd5e1|background:\s*#fff|color:\s*#0f172a);/, '计划行内编辑输入不得回退到硬编码白底灰边深色文字');
  assert.doesNotMatch(finalInlineEditBtnBlock, /color:\s*#94a3b8;/, '计划行内编辑按钮不得回退到硬编码灰色');
  assert.doesNotMatch(finalStrategySummaryBlock, /color:\s*#475569;/, '计划摘要不得回退到硬编码灰色');
  assert.doesNotMatch(finalCopyMultiBlock, /(?:background:\s*#f8fafc|border-color:\s*#cbd5e1|color:\s*#334155);/, '复制数量徽标不得回退到硬编码灰白样式');
});

test('快捷日志保持原时间前缀输出并弱化为次级区块', () => {
  assert.match(source, /const timestampText = `\[\$\{new Date\(\)\.toLocaleTimeString\('zh-CN', \{ hour12: false \}\)\}\] \$\{text\}`;/, '快捷日志未保持原时间前缀输出');
  assert.match(source, /line\.className = `line \$\{type\}`;[\s\S]*?line\.textContent = timestampText;/, '快捷日志不应拆分原输出容器文本');
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-quick-log-panel \{[\s\S]*?#am-wxt-keyword-modal \.am-wxt-quick-log-title \{[\s\S]*?#am-wxt-keyword-quick-log \{/,
    '快捷日志缺少次级区块样式'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-quick-log-title::before \{[\s\S]*?background:\s*var\(--am26-primary,[\s\S]*?#am-wxt-keyword-quick-log \.line::before,[\s\S]*?#am-wxt-keyword-modal #am-wxt-workbench-preview-log \.line::before \{[\s\S]*?background:\s*rgba\(80,90,116,0\.46\);/,
    '快捷日志缺少状态点或弱状态色'
  );
});

test('首页底部提交条和快捷日志区收敛到统一 token', () => {
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-run-mode-count \{[\s\S]*?background:\s*var\(--am26-surface,[\s\S]*?border-color:\s*var\(--am26-border,[\s\S]*?color:\s*var\(--am26-text-soft,[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-footer \{[\s\S]*?border-top:\s*1px solid var\(--am26-border,[\s\S]*?background:\s*var\(--am26-surface-strong,[\s\S]*?#am-wxt-keyword-modal \.am-wxt-submit-summary \{[\s\S]*?color:\s*var\(--am26-text-soft,[\s\S]*?#am-wxt-keyword-modal \.am-wxt-submit-summary strong \{[\s\S]*?color:\s*var\(--am26-primary-strong,/,
    '首页底部提交条、提交摘要或执行模式数量徽标未收敛到 --am26 token'
  );
  assert.match(
    source,
    /#am-wxt-keyword-run-mode-menu \.am-wxt-run-mode-count \{[\s\S]*?border:\s*1px solid var\(--am26-border,[\s\S]*?background:\s*var\(--am26-surface,[\s\S]*?color:\s*var\(--am26-text-soft,/,
    '执行模式下拉菜单数量徽标未收敛到 --am26 token'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-run-mode-toggle::before \{[\s\S]*?content:\s*none !important;[\s\S]*?#am-wxt-keyword-modal \.am-wxt-run-mode-toggle-icon \{[\s\S]*?display:\s*inline-flex;[\s\S]*?#am-wxt-keyword-modal \.am-wxt-run-mode-toggle\[data-open="1"\] \.am-wxt-run-mode-toggle-icon \{[\s\S]*?transform:\s*rotate\(180deg\);/,
    '提交方式下拉箭头未改为共享 SVG 图标旋转态'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-quick-log-panel \{[\s\S]*?border-top:\s*1px solid var\(--am26-border,[\s\S]*?background:\s*var\(--am26-surface,[\s\S]*?#am-wxt-keyword-modal \.am-wxt-quick-log-title \{[\s\S]*?color:\s*var\(--am26-text-soft,[\s\S]*?#am-wxt-keyword-quick-log \{[\s\S]*?border:\s*1px solid var\(--am26-border,[\s\S]*?background:\s*var\(--am26-surface,[\s\S]*?#am-wxt-keyword-quick-log \.line \{[\s\S]*?color:\s*var\(--am26-text-soft,/,
    '快捷日志面板、标题、日志容器或日志行未收敛到 --am26 token'
  );
  assert.doesNotMatch(
    source,
    /#am-wxt-keyword-modal \.am-wxt-run-mode-count \{[\s\S]*?background:\s*#f8fafc;[\s\S]*?color:\s*#334155;[\s\S]*?#am-wxt-keyword-modal \.am-wxt-strategy-footer \{[\s\S]*?background:\s*#fff;[\s\S]*?#am-wxt-keyword-modal \.am-wxt-submit-summary \{[\s\S]*?color:\s*#475569;/,
    '首页底部提交条不得回退到硬编码白/灰底和灰色文字'
  );
  assert.doesNotMatch(
    source,
    /#am-wxt-keyword-run-mode-menu \.am-wxt-run-mode-count \{[\s\S]*?border:\s*1px solid rgba\(99,\s*102,\s*241,\s*0\.32\);[\s\S]*?background:\s*rgba\(255,\s*255,\s*255,\s*0\.88\);[\s\S]*?color:\s*#3344c8;/,
    '执行模式下拉菜单数量徽标不得回退到旧白底蓝紫边框'
  );
  assert.doesNotMatch(
    source,
    /#am-wxt-keyword-modal \.am-wxt-quick-log-panel \{[\s\S]*?background:\s*#fff;[\s\S]*?#am-wxt-keyword-modal \.am-wxt-quick-log-title \{[\s\S]*?color:\s*#64748b;[\s\S]*?#am-wxt-keyword-quick-log \{[\s\S]*?background:\s*#fff;[\s\S]*?#am-wxt-keyword-quick-log \.line \{[\s\S]*?color:\s*#475569;/,
    '快捷日志区不得回退到硬编码白底和灰色文字'
  );
});

test('日志页预览与执行日志容器收敛到统一 token', () => {
  const finalPreviewLogPanelBlock = getLastCssBlock('#am-wxt-keyword-modal #am-wxt-keyword-previewlog-panel');
  const finalPreviewLogCrowdBoxBlock = getLastCssBlock('#am-wxt-keyword-modal #am-wxt-keyword-previewlog-panel .am-wxt-crowd-box');
  const finalPreviewLogCrowdTitleBlock = getLastCssBlock('#am-wxt-keyword-modal #am-wxt-keyword-previewlog-panel .am-wxt-crowd-title');
  const finalPreviewLogCrowdValueBlock = getLastCssBlock('#am-wxt-keyword-modal #am-wxt-keyword-previewlog-panel .am-wxt-crowd-title span:last-child');
  const finalPreviewLogBaseBlock = getLastMatch(/#am-wxt-keyword-modal #am-wxt-workbench-preview-log,\s*#am-wxt-keyword-modal #am-wxt-keyword-log,\s*#am-wxt-keyword-modal #am-wxt-keyword-preview \{[\s\S]*?\n\s*\}/g);
  const finalPreviewBlock = getLastCssBlock('#am-wxt-keyword-modal #am-wxt-keyword-preview');
  const finalLogLineBlock = getLastMatch(/#am-wxt-keyword-modal #am-wxt-workbench-preview-log \.line,\s*#am-wxt-keyword-modal #am-wxt-keyword-log \.line \{[\s\S]*?\n\s*\}/g);
  const finalLogErrorBlock = getLastMatch(/#am-wxt-keyword-modal #am-wxt-workbench-preview-log \.line\.error,\s*#am-wxt-keyword-modal #am-wxt-keyword-log \.line\.error \{[\s\S]*?\n\s*\}/g);
  const finalLogSuccessBlock = getLastMatch(/#am-wxt-keyword-modal #am-wxt-workbench-preview-log \.line\.success,\s*#am-wxt-keyword-modal #am-wxt-keyword-log \.line\.success \{[\s\S]*?\n\s*\}/g);

  assert.match(finalPreviewLogPanelBlock, /background:\s*var\(--am26-surface,/, '日志页面板背景未使用 --am26-surface');
  assert.match(finalPreviewLogPanelBlock, /color:\s*var\(--am26-text,/, '日志页面板文字未使用 --am26-text');
  assert.match(finalPreviewLogPanelBlock, /border-color:\s*var\(--am26-border,/, '日志页面板边框未使用 --am26-border');
  assert.match(finalPreviewLogCrowdBoxBlock, /display:\s*grid;/, '日志页摘要盒未改为紧凑摘要网格');
  assert.match(finalPreviewLogCrowdBoxBlock, /background:\s*transparent;/, '日志页摘要盒外层不应再绘制整块底色');
  assert.match(finalPreviewLogCrowdTitleBlock, /color:\s*var\(--am26-text-soft,/, '日志页摘要标题未使用 --am26-text-soft');
  assert.match(finalPreviewLogCrowdTitleBlock, /border:\s*1px solid var\(--am26-border,/, '日志页摘要标题卡片边框未使用 --am26-border');
  assert.match(finalPreviewLogCrowdTitleBlock, /background:\s*var\(--am26-surface,/, '日志页摘要标题卡片背景未使用 --am26-surface');
  assert.match(finalPreviewLogCrowdValueBlock, /color:\s*var\(--am26-text,/, '日志页摘要值未使用 --am26-text');
  assert.match(finalPreviewLogBaseBlock, /border:\s*1px solid var\(--am26-border,/, '日志页预览/执行日志容器边框未使用 --am26-border');
  assert.match(finalPreviewLogBaseBlock, /background:\s*var\(--am26-surface,/, '日志页预览/执行日志容器背景未使用 --am26-surface');
  assert.match(finalPreviewLogBaseBlock, /color:\s*var\(--am26-text-soft,/, '日志页预览/执行日志容器文字未使用 --am26-text-soft');
  assert.match(finalPreviewBlock, /color:\s*var\(--am26-text,/, '请求预览正文未使用 --am26-text');
  assert.match(finalLogLineBlock, /color:\s*var\(--am26-text-soft,/, '日志页日志行未使用 --am26-text-soft');
  assert.match(finalLogErrorBlock, /color:\s*var\(--am26-danger,/, '日志页错误日志未使用 --am26-danger');
  assert.match(finalLogSuccessBlock, /color:\s*var\(--am26-success,/, '日志页成功日志未使用 --am26-success');

  assert.doesNotMatch(finalPreviewLogPanelBlock, /(?:background:\s*#fff|background:\s*#f8fafc|border-color:\s*rgba\(148,\s*163,\s*184)/, '日志页面板不得回退到硬编码白灰底或旧灰边');
  assert.doesNotMatch(finalPreviewLogCrowdBoxBlock, /(?:background:\s*#f8fafc|border:\s*1px dashed rgba\(100,\s*116,\s*139)/, '日志页摘要盒不得回退到硬编码灰底虚线边框');
  assert.doesNotMatch(finalPreviewLogBaseBlock, /(?:background:\s*#fff|background:\s*#0f172a|border-color:\s*rgba\(148,\s*163,\s*184|color:\s*#d1d5db|color:\s*#334155)/, '日志页预览/执行日志容器不得回退到白底灰边或深色预览底');
  assert.doesNotMatch(finalPreviewBlock, /(?:background:\s*#0f172a|color:\s*#d1d5db)/, '请求预览不得回退到深色终端底');
  assert.doesNotMatch(finalLogLineBlock, /color:\s*#334155;/, '日志页日志行不得回退到硬编码深灰');
  assert.doesNotMatch(finalLogErrorBlock, /color:\s*#b91c1c;/, '日志页错误日志不得回退到硬编码红色');
  assert.doesNotMatch(finalLogSuccessBlock, /color:\s*#15803d;/, '日志页成功日志不得回退到硬编码绿色');
});

test('执行模式下拉菜单容器和菜单项收敛到统一 token', () => {
  const finalMenuOverride = source.match(/#am-wxt-keyword-modal \.am-wxt-run-mode-menu,\s*#am-wxt-keyword-run-mode-menu\.am-wxt-run-mode-menu \{[\s\S]*?\n\s*\}/)?.[0] || '';
  assert.ok(finalMenuOverride, '缺少执行模式下拉菜单最终覆盖块');
  assert.match(finalMenuOverride, /border:\s*1px solid var\(--am26-border-strong,/, '执行模式下拉菜单边框未使用 --am26 token');
  assert.match(finalMenuOverride, /background:\s*var\(--am26-panel-strong,/, '执行模式下拉菜单背景未使用 --am26 token');
  assert.match(finalMenuOverride, /box-shadow:\s*var\(--am26-shadow,/, '执行模式下拉菜单阴影未使用 --am26 token');
  assert.match(finalMenuOverride, /backdrop-filter:\s*blur\(12px\) saturate\(1\.25\);/, '执行模式下拉菜单模糊强度未使用统一浅玻璃设置');
  assert.match(
    source,
    /#am-wxt-keyword-run-mode-menu \.am-wxt-run-mode-item \{[\s\S]*?background:\s*transparent;[\s\S]*?color:\s*var\(--am26-text-soft,[\s\S]*?#am-wxt-keyword-run-mode-menu \.am-wxt-run-mode-item:hover \{[\s\S]*?background:\s*var\(--am26-surface-strong,[\s\S]*?color:\s*var\(--am26-primary-strong,[\s\S]*?#am-wxt-keyword-run-mode-menu \.am-wxt-run-mode-item\.active \{[\s\S]*?background:\s*rgba\(69,84,229,0\.10\);[\s\S]*?color:\s*var\(--am26-primary-strong,/,
    '执行模式下拉菜单项、hover 或 active 态未收敛到 --am26 token'
  );
  assert.doesNotMatch(
    source,
    /#am-wxt-keyword-modal \.am-wxt-run-mode-menu,\s*#am-wxt-keyword-run-mode-menu\.am-wxt-run-mode-menu \{[\s\S]*?background:\s*linear-gradient\(135deg,\s*rgba\(255,\s*255,\s*255,\s*0\.96\),\s*rgba\(246,\s*249,\s*255,\s*0\.9\)\);[\s\S]*?box-shadow:\s*0 12px 24px rgba\(42,\s*91,\s*255,\s*0\.12\);/,
    '执行模式下拉菜单最终覆盖块不得回退到白底浅蓝渐变和旧蓝色阴影'
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
    /const maskClassNames = \['am-wxt-scene-popup-mask'\];[\s\S]*?normalizedDialogClassName\.split\(\/\\s\+\/\)\.includes\('am-wxt-scene-popup-dialog-batch-number'\)[\s\S]*?maskClassNames\.push\('am-wxt-scene-popup-mask-batch-number'\);[\s\S]*?normalizedDialogClassName\.split\(\/\\s\+\/\)\.includes\('am-wxt-scene-popup-dialog-submit-confirm'\)[\s\S]*?maskClassNames\.push\('am-wxt-scene-popup-mask-submit-confirm'\);[\s\S]*?mask\.className = maskClassNames\.join\(' '\);/,
    '批量编辑/提交确认弹窗未给外层 mask 增加专属 class，无法局部覆盖背景'
  );
  assert.match(
    source,
    /const titleId = 'am-wxt-scene-popup-title';[\s\S]*?const errorId = 'am-wxt-scene-popup-error';[\s\S]*?role="dialog" aria-modal="true" aria-labelledby="\$\{titleId\}"[\s\S]*?<span id="\$\{titleId\}">[\s\S]*?<div class="am-wxt-scene-popup-error" id="\$\{errorId\}" role="alert" aria-live="assertive" hidden><\/div>/,
    '批量编辑弹窗缺少标题关联或弹窗内可见错误容器'
  );
  assert.match(
    source,
    /const showPopupError = \(message = '', focusSelector = ''\) => \{[\s\S]*?errorNode\.textContent = text;[\s\S]*?errorNode\.hidden = false;[\s\S]*?focusPopupTarget\(focusSelector\);/,
    '批量编辑弹窗校验失败未展示错误并回焦到目标输入'
  );
  assert.match(
    source,
    /if \(payload && payload\.ok === false\) \{[\s\S]*?showPopupError\(payload\.error \|\| payload\.message \|\| '', payload\.focusSelector \|\| ''\);[\s\S]*?return;[\s\S]*?\}/,
    '批量编辑弹窗保存失败只阻断关闭，未同步弹窗内错误'
  );
  assert.match(
    source,
    /const createFieldError = \(message = '', focusSelector = ''\) => Object\.assign\([\s\S]*?new Error\(message\),[\s\S]*?\{ focusSelector: String\(focusSelector \|\| ''\) \}/,
    '批量编辑数值格式错误缺少字段级 focusSelector'
  );
  assert.match(
    source,
    /const normalizeBatchStrategyNumberEditValues = \(rawValues = \{\}\) => \{[\s\S]*?const budgetValue = normalizeDecimalValue\(rawValues\.dayAverageBudget, '预算值', \{[\s\S]*?focusSelector: '\[data-batch-strategy-number-field="dayAverageBudget"\]'[\s\S]*?const bidValue = normalizeDecimalValue\(rawValues\.defaultBidPrice, '默认出价', \{[\s\S]*?focusSelector: '\[data-batch-strategy-number-field="defaultBidPrice"\]'[\s\S]*?const recommendValue = normalizeIntegerValue\(rawValues\.recommendCount, '推荐词目标数', \{[\s\S]*?focusSelector: '\[data-batch-strategy-number-field="recommendCount"\]'[\s\S]*?const targetCostValue = normalizeDecimalValue\(rawValues\.targetCostValue, '目标成本\/ROI', \{[\s\S]*?focusSelector: '\[data-batch-strategy-number-field="targetCostValue"\]'/,
    '批量编辑缺少数值字段校验'
  );
  assert.match(
    source,
    /const applyBatchNumberEditToStrategies = \(strategies = \[\], values = \{\}\) => \{[\s\S]*?strategy\.dayAverageBudget = values\.dayAverageBudget;[\s\S]*?strategy\.defaultBidPrice = values\.defaultBidPrice;[\s\S]*?strategy\.recommendCount = values\.recommendCount;[\s\S]*?syncStrategyTargetCostFields\(strategy,\s*bidTargetCode,\s*values\.targetCostValue\);/,
    '批量编辑未收敛为数值字段回写'
  );
  assert.match(
    source,
    /const openBatchStrategyNumberEditPopup = async \(strategies = \[\]\) => \{[\s\S]*?return openBatchStrategyPopupDialog\(\{[\s\S]*?dialogClassName: 'am-wxt-scene-popup-dialog-batch-number'[\s\S]*?saveLabel: '批量修改'[\s\S]*?data-batch-strategy-number-field="dayAverageBudget"[\s\S]*?data-batch-strategy-number-field="defaultBidPrice"[\s\S]*?data-batch-strategy-number-field="recommendCount"[\s\S]*?data-batch-strategy-number-field="targetCostValue"[\s\S]*?请至少填写 1 个需要批量修改的数值字段/,
    '批量编辑弹窗未提供独立数值字段表单'
  );
  assert.match(
    source,
    /if \(!Object\.keys\(normalizedValues\)\.length\) \{[\s\S]*?const message = '请至少填写 1 个需要批量修改的数值字段';[\s\S]*?appendWizardLog\(message, 'error'\);[\s\S]*?ok: false,[\s\S]*?error: message,[\s\S]*?focusSelector: '\[data-batch-strategy-number-field="dayAverageBudget"\]'/,
    '批量编辑空提交未返回弹窗内错误和预算输入焦点'
  );
  assert.match(
    source,
    /if \(normalizedValues\.targetCostValue && targetCostPlanCount <= 0\) \{[\s\S]*?const message = '已选计划中没有可批量修改目标成本\/ROI的计划';[\s\S]*?appendWizardLog\(message, 'error'\);[\s\S]*?ok: false,[\s\S]*?error: message,[\s\S]*?focusSelector: '\[data-batch-strategy-number-field="targetCostValue"\]'/,
    '批量编辑目标成本不可用时未返回弹窗内错误和目标成本输入焦点'
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

test('批量编辑数值弹窗样式局部收敛到统一 UI token', () => {
  const finalGenericSceneMaskBlock = getLastCssBlock('#am-wxt-scene-popup-mask');
  const finalBatchNumberMaskBlock = getLastCssBlock('#am-wxt-scene-popup-mask.am-wxt-scene-popup-mask-batch-number');

  assert.match(finalGenericSceneMaskBlock, /background:\s*rgba\(15,\s*23,\s*42,\s*0\.52\);/, '通用场景弹窗默认 mask 不应被本轮批量编辑背景改动扩大替换');
  assert.match(finalBatchNumberMaskBlock, /background:\s*linear-gradient\(135deg,\s*rgba\(255,\s*255,\s*255,\s*0\.78\),\s*rgba\(255,\s*255,\s*255,\s*0\.48\)\);/, '批量编辑数值弹窗外层 mask 未改为白色玻璃渐变背景');
  assert.match(finalBatchNumberMaskBlock, /backdrop-filter:\s*blur\(8px\) saturate\(1\.15\);/, '批量编辑数值弹窗外层 mask 缺少白色玻璃 blur');
  assert.doesNotMatch(finalBatchNumberMaskBlock, /rgba\(15,\s*23,\s*42,\s*0\.52\)/, '批量编辑数值弹窗外层 mask 不得回退到通用深灰遮罩');
  assert.match(
    source,
    /#am-wxt-scene-popup-mask \.am-wxt-scene-popup-dialog\.am-wxt-scene-popup-dialog-batch-number \{[\s\S]*?width:\s*min\(560px,\s*calc\(100vw - 32px\)\);[\s\S]*?background:\s*var\(--am26-panel-strong,[\s\S]*?border:\s*1px solid var\(--am26-border-strong,[\s\S]*?border-radius:\s*18px;[\s\S]*?box-shadow:\s*var\(--am26-shadow,[\s\S]*?backdrop-filter:\s*blur\(18px\) saturate\(1\.35\);/,
    '批量编辑数值弹窗外壳未收敛到统一浅玻璃 token'
  );
  assert.match(
    source,
    /#am-wxt-scene-popup-mask \.am-wxt-strategy-batch-number-field \{[\s\S]*?color:\s*var\(--am26-text,[\s\S]*?#am-wxt-scene-popup-mask \.am-wxt-strategy-batch-number-field input\[type="number"\] \{[\s\S]*?border:\s*1px solid var\(--am26-border,[\s\S]*?background:\s*rgba\(255,255,255,0\.72\);[\s\S]*?color:\s*var\(--am26-text,[\s\S]*?#am-wxt-scene-popup-mask \.am-wxt-strategy-batch-number-field input\[type="number"\]:focus-visible \{[\s\S]*?outline:\s*2px solid rgba\(37,99,235,0\.45\);/,
    '批量编辑数值输入缺少 token 色值或可见 focus 态'
  );
  assert.match(
    source,
    /#am-wxt-scene-popup-mask \.am-wxt-scene-popup-error \{[\s\S]*?border:\s*1px solid rgba\(234,79,79,0\.26\);[\s\S]*?background:\s*rgba\(234,79,79,0\.10\);[\s\S]*?color:\s*var\(--am26-danger,[\s\S]*?#am-wxt-scene-popup-mask \.am-wxt-scene-popup-error\[hidden\] \{[\s\S]*?display:\s*none !important;/,
    '批量编辑弹窗错误态缺少危险语义色或 hidden 规则'
  );
  assert.match(
    source,
    /#am-wxt-scene-popup-mask \.am-wxt-btn \{[\s\S]*?background:\s*#eef2ff;[\s\S]*?#am-wxt-scene-popup-mask \.am-wxt-scene-popup-dialog-batch-number \.am-wxt-btn \{[\s\S]*?background:\s*var\(--am26-surface-strong,[\s\S]*?#am-wxt-scene-popup-mask \.am-wxt-scene-popup-dialog-batch-number \.am-wxt-btn\.primary \{[\s\S]*?background:\s*linear-gradient\(135deg,\s*var\(--am26-primary,[\s\S]*?#am-wxt-scene-popup-mask \.am-wxt-scene-popup-dialog-batch-number \.am-wxt-btn:focus-visible \{/,
    '批量编辑按钮 token 覆盖必须局限在 batch-number 弹窗内，不能替换通用场景弹窗按钮事实源'
  );
});

test('提交确认弹窗样式局部收敛到统一 UI token', () => {
  const finalGenericSceneMaskBlock = getLastCssBlock('#am-wxt-scene-popup-mask');
  const finalSubmitConfirmMaskBlock = getLastCssBlock('#am-wxt-scene-popup-mask.am-wxt-scene-popup-mask-submit-confirm');
  const finalSubmitConfirmDialogBlock = getLastCssBlock('#am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog-submit-confirm');
  const finalSubmitConfirmHeroBlock = getLastCssBlock('#am-wxt-scene-popup-mask .am-wxt-submit-confirm-hero');
  const finalSubmitConfirmStatBlock = getLastCssBlock('#am-wxt-scene-popup-mask .am-wxt-submit-confirm-stat');
  const finalSubmitConfirmScenesBlock = getLastCssBlock('#am-wxt-scene-popup-mask .am-wxt-submit-confirm-scenes');
  const finalSubmitConfirmRiskBlock = getLastCssBlock('#am-wxt-scene-popup-mask .am-wxt-submit-confirm-risk');

  assert.match(finalGenericSceneMaskBlock, /background:\s*rgba\(15,\s*23,\s*42,\s*0\.52\);/, '通用场景弹窗默认 mask 不应被提交确认背景改动扩大替换');
  assert.match(finalSubmitConfirmMaskBlock, /background:\s*linear-gradient\(135deg,\s*rgba\(255,\s*255,\s*255,\s*0\.78\),\s*rgba\(255,\s*255,\s*255,\s*0\.48\)\);/, '提交确认弹窗外层 mask 未改为白色玻璃渐变背景');
  assert.match(finalSubmitConfirmMaskBlock, /backdrop-filter:\s*blur\(10px\) saturate\(1\.18\);/, '提交确认弹窗外层 mask 缺少白色玻璃 blur');
  assert.match(finalSubmitConfirmDialogBlock, /width:\s*min\(560px,\s*calc\(100vw - 32px\)\);/, '提交确认弹窗宽度未按工作台弹窗收敛');
  assert.match(finalSubmitConfirmDialogBlock, /background:\s*var\(--am26-panel-strong,/, '提交确认弹窗外壳未使用 --am26-panel-strong');
  assert.match(finalSubmitConfirmDialogBlock, /border:\s*1px solid var\(--am26-border-strong,/, '提交确认弹窗外壳未使用 --am26-border-strong');
  assert.match(finalSubmitConfirmDialogBlock, /border-radius:\s*18px;/, '提交确认弹窗外壳未使用统一圆角');
  assert.match(finalSubmitConfirmDialogBlock, /box-shadow:\s*var\(--am26-shadow,/, '提交确认弹窗外壳未使用 --am26-shadow');
  assert.match(finalSubmitConfirmDialogBlock, /backdrop-filter:\s*blur\(18px\) saturate\(1\.35\);/, '提交确认弹窗外壳未使用统一浅玻璃 blur');
  assert.match(
    finalSubmitConfirmHeroBlock,
    /background:\s*linear-gradient\(145deg,\s*var\(--am26-surface-strong,[\s\S]*?var\(--am26-surface,/,
    '提交确认头部提示区未使用统一浅玻璃 surface token'
  );
  assert.match(finalSubmitConfirmStatBlock, /border:\s*1px solid var\(--am26-border,/, '提交确认统计卡未使用 --am26-border');
  assert.match(finalSubmitConfirmStatBlock, /background:\s*var\(--am26-surface,/, '提交确认统计卡未使用 --am26-surface');
  assert.match(finalSubmitConfirmScenesBlock, /background:\s*rgba\(69,84,229,0\.10\);/, '提交确认场景摘要未使用主色浅背景');
  assert.match(finalSubmitConfirmScenesBlock, /color:\s*var\(--am26-primary-strong,/, '提交确认场景摘要未使用主色文字');
  assert.match(finalSubmitConfirmRiskBlock, /border:\s*1px solid rgba\(232,163,37,0\.28\);/, '提交确认风险提示未使用 warning 语义边框');
  assert.match(finalSubmitConfirmRiskBlock, /color:\s*var\(--am26-warning,/, '提交确认风险提示未使用 warning 语义文字');
  assert.doesNotMatch(finalSubmitConfirmStatBlock, /#f8fafc|#64748b|#0f172a/, '提交确认统计卡不得回退到旧硬编码灰色');
  assert.doesNotMatch(finalSubmitConfirmScenesBlock, /#eff6ff|#1d4ed8/, '提交确认场景摘要不得回退到旧硬编码蓝色');
  assert.doesNotMatch(finalSubmitConfirmRiskBlock, /#fff7ed|#9a3412/, '提交确认风险提示不得回退到旧硬编码橙色');
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
