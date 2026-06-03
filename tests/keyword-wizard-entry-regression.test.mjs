import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const gridSource = readFileSync(new URL('../src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-grid.js', import.meta.url), 'utf8');
const assistantBootstrapSource = readFileSync(new URL('../src/main-assistant/bootstrap.js', import.meta.url), 'utf8');
const assistantUiSource = readFileSync(new URL('../src/main-assistant/ui.js', import.meta.url), 'utf8');
const optimizerBridgeSource = readFileSync(new URL('../src/optimizer/bridge.js', import.meta.url), 'utf8');
const wizardOpenSource = readFileSync(new URL('../src/optimizer/keyword-plan-api/wizard-open-and-create.js', import.meta.url), 'utf8');
const searchAndDraftSource = readFileSync(new URL('../src/optimizer/keyword-plan-api/search-and-draft.js', import.meta.url), 'utf8');
const strategyStateSource = readFileSync(new URL('../src/optimizer/keyword-plan-api/wizard-scene-config/strategy-state-and-draft.js', import.meta.url), 'utf8');
const batchEditPopupSource = readFileSync(new URL('../src/optimizer/keyword-plan-api/wizard-scene-config/batch-edit-popup.js', import.meta.url), 'utf8');
const itemSelectionSource = readFileSync(new URL('../src/optimizer/keyword-plan-api/wizard-scene-config/item-selection.js', import.meta.url), 'utf8');

test('场景动态渲染的时间解析 helper 可被前置货品全站配置安全调用', () => {
  assert.match(
    gridSource,
    /function parseTimeRangeToMinutes\(timeText = ''\) \{/,
    'parseTimeRangeToMinutes 必须使用函数声明，避免货品全站配置在声明前调用时触发 TDZ'
  );
  assert.doesNotMatch(
    gridSource,
    /const parseTimeRangeToMinutes\s*=/,
    'parseTimeRangeToMinutes 不能退回 const 表达式，否则 openWizard 会在货品全站配置中报 TDZ'
  );
  assert.match(
    gridSource,
    /function formatMinutesToClock\(minutes = 0\) \{/,
    'formatMinutesToClock 也应保持函数声明，供后续弹窗序列化稳定复用'
  );
});

test('组建计划入口捕获 openWizard 异常并打开已有弹窗兜底', () => {
  assert.match(
    assistantUiSource,
    /const reportKeywordPlanOpenFailure = \(err\) => \{[\s\S]*?openExistingKeywordOverlay\(\)[\s\S]*?alert\(`/,
    '组建计划入口异常时必须给当前页可见反馈，并优先打开已有弹窗'
  );
  assert.match(
    assistantUiSource,
    /const openKeywordPlanWizard = \(targetApi\) => \{[\s\S]*?const result = targetApi\.openWizard\(\);[\s\S]*?result\.catch\(reportKeywordPlanOpenFailure\);[\s\S]*?catch \(err\) \{[\s\S]*?reportKeywordPlanOpenFailure\(err\);/,
    '组建计划入口必须同时捕获同步异常和 Promise reject'
  );
});

test('组建计划入口在完整 API 不可见时回退到 openWizard 窄桥', () => {
  assert.match(
    assistantBootstrapSource,
    /const KEYWORD_PLAN_OPEN_BRIDGE_READY_KEY = '__AM_WXT_KEYWORD_OPEN_BRIDGE_READY__';/,
    '主助手缺少 openWizard 窄桥就绪标记'
  );
  assert.match(
    assistantBootstrapSource,
    /const createKeywordPlanOpenBridgeApi = \(\) => \(\{[\s\S]*?openWizard\(\) \{[\s\S]*?window\.dispatchEvent\(new CustomEvent\(KEYWORD_PLAN_OPEN_BRIDGE_REQ_EVENT/,
    '主助手未实现只打开向导的窄桥客户端'
  );
  assert.match(
    assistantBootstrapSource,
    /if \(window\[KEYWORD_PLAN_OPEN_BRIDGE_READY_KEY\] === '1'\) \{[\s\S]*?return createKeywordPlanOpenBridgeApi\(\);[\s\S]*?\}/,
    'resolveKeywordPlanApiAccessor 未在完整 API 不可见时回退到窄桥'
  );
});

test('optimizer 默认安装内部桥但不恢复完整 page API 全局暴露', () => {
  assert.match(
    optimizerBridgeSource,
    /const installKeywordPlanOpenBridgeHost = \(\) => \{[\s\S]*?ensureKeywordPlanApiForBridge\(\)[\s\S]*?resolveKeywordPlanOpenForBridge\(\)[\s\S]*?window\.addEventListener\(KEYWORD_PLAN_OPEN_BRIDGE_REQ_EVENT/,
    'optimizer 未安装默认 openWizard 窄桥 host'
  );
  assert.match(
    optimizerBridgeSource,
    /installKeywordPlanOpenBridgeHost\(\);\s*if \(isExtensionPageRuntime\(\) \|\| shouldExposePageApiDebug\(\)\) \{[\s\S]*?installPageApiBridgeHost\(\);[\s\S]*?\}\s*if \(shouldExposePageApiDebug\(\)\) \{/,
    'extension 运行态应默认安装内部完整桥 host，避免新安装时复制 API 不可用'
  );
  assert.doesNotMatch(
    optimizerBridgeSource,
    /loadKeywordPlanApiForExtension|KEYWORD_PLAN_LAZY|keywordPlanApiBundle/,
    '组建计划点击路径不应懒加载 keyword-plan-api 大包'
  );
  assert.match(
    optimizerBridgeSource,
    /if \(shouldExposePageApiDebug\(\)\) \{[\s\S]*?injectPageApiBridgeClient\(\);[\s\S]*?\}/,
    '完整 page API 客户端暴露仍必须受 debug 开关保护'
  );
  assert.doesNotMatch(
    optimizerBridgeSource,
    /window\.__AM_WXT_KEYWORD_API__\s*=\s*\{\s*openWizard/s,
    '不要用 page 全局对象暴露 openWizard 窄桥，避免和完整 API 暴露边界混淆'
  );
});

test('组建计划打开路径不在点击同步任务里构建预览', () => {
  assert.match(
    wizardOpenSource,
    /const scheduleWizardOpenTask = \(openToken = 0, task = null\) => \{[\s\S]*?if \(openToken !== wizardState\.openToken\) return;[\s\S]*?if \(wizardState\.visible !== true\) return;[\s\S]*?setTimeout\(runTask, 0\)[\s\S]*?window\.requestAnimationFrame\(scheduleAfterPaint\)/,
    'openWizard 应把预览刷新延后到 overlay 打开后的下一帧，避免点击同步任务里做重预览'
  );
  assert.match(
    wizardOpenSource,
    /const revealWizardAfterStyleReady = \(openToken = 0\) => \{[\s\S]*?const styleReadyPromise = wizardState\.styleReadyPromise[\s\S]*?delete overlay\.dataset\.styleLoading;[\s\S]*?overlay\.classList\.add\('open'\);[\s\S]*?scheduleWizardOpenPreviewRefresh\(openToken\);/,
    '首次打开向导应等待样式加载结果后再打开 overlay，并在打开后异步刷新预览'
  );
  assert.match(
    wizardOpenSource,
    /KeywordPlanPreviewExecutor\.renderWizardFromState\(\{[\s\S]*?clearLogs: true,[\s\S]*?refreshPreview: false,[\s\S]*?\}\);[\s\S]*?wizardState\.els\.overlay\.dataset\.styleLoading = '1';[\s\S]*?wizardState\.els\.overlay\.classList\.remove\('open'\);[\s\S]*?revealWizardAfterStyleReady\(openToken\);[\s\S]*?scheduleWizardOpenTask\(openToken, \(\) => \{[\s\S]*?refreshSceneProfileFromSpec/,
    '首次打开向导应先跳过预览构建，样式加载前保持 overlay 隐藏，后续重任务再异步执行'
  );
  assert.match(
    wizardOpenSource,
    /KeywordPlanPreviewExecutor\.renderWizardFromState\(\{[\s\S]*?refreshPreview: false,[\s\S]*?\}\);[\s\S]*?revealWizardAfterStyleReady\(openToken\);/,
    '后台 runtime 初始化前的首次渲染不应同步构建预览'
  );
});

test('组建计划默认打开不渲染隐藏编辑页动态配置', () => {
  assert.match(
    batchEditPopupSource,
    /const applyStrategyToDetailForm = \(strategy, options = \{\}\) => \{[\s\S]*?if \(options\.renderSceneDynamic !== false\) \{[\s\S]*?renderSceneDynamicConfig\(\);[\s\S]*?\}/,
    'applyStrategyToDetailForm 应支持跳过隐藏 editor 的动态配置渲染'
  );
  assert.match(
    strategyStateSource,
    /const shouldRenderDetailSceneDynamic = options\.renderDetailSceneDynamic !== false[\s\S]*?\|\| wizardState\.detailVisible === true[\s\S]*?\|\| wizardState\.workbenchPage === 'editor';[\s\S]*?applyStrategyToDetailForm\(editingStrategy \|\| wizardState\.strategyList\[0\] \|\| null, \{[\s\S]*?renderSceneDynamic: shouldRenderDetailSceneDynamic[\s\S]*?\}\);/,
    'fillUIFromDraft 应只在默认隐藏 editor 时跳过动态配置，用户已进入 editor 时仍要补渲染'
  );
  assert.match(
    searchAndDraftSource,
    /wizardState\.fillUIFromDraft\(\{[\s\S]*?renderDetailSceneDynamic: options\.renderDetailSceneDynamic !== false[\s\S]*?\}\);/,
    'renderWizardFromState 应把 renderDetailSceneDynamic 选项传入 fillUIFromDraft'
  );
  assert.match(
    wizardOpenSource,
    /KeywordPlanPreviewExecutor\.renderWizardFromState\(\{[\s\S]*?clearLogs: true,[\s\S]*?refreshPreview: false,[\s\S]*?renderDetailSceneDynamic: false[\s\S]*?\}\);/,
    'openWizard 首次渲染应跳过隐藏 editor 动态配置'
  );
});

test('组建计划默认打开不重建隐藏候选商品列表', () => {
  assert.match(
    itemSelectionSource,
    /const shouldRenderCandidateDomNow = \(options = \{\}\) => \([\s\S]*?options\.force === true[\s\S]*?\|\| wizardState\.itemSplitExpanded === true[\s\S]*?\|\| !!document\.getElementById\('am-wxt-keyword-item-picker-mask'\)[\s\S]*?\);/,
    '候选商品列表应只在强制、商品面板展开或商品弹窗可见时重建 DOM'
  );
  assert.match(
    itemSelectionSource,
    /const renderCandidateList = \(options = \{\}\) => \{[\s\S]*?if \(!shouldRenderCandidateDomNow\(options\)\) \{[\s\S]*?wizardState\.candidateListDirty = true;[\s\S]*?return;[\s\S]*?\}[\s\S]*?wizardState\.candidateListDirty = false;/,
    '隐藏态 renderCandidateList 应只标记 dirty，不生成候选商品卡片'
  );
});
