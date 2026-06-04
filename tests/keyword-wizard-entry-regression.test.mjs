import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const gridSource = readFileSync(new URL('../src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-grid.js', import.meta.url), 'utf8');
const assistantBootstrapSource = readFileSync(new URL('../src/main-assistant/bootstrap.js', import.meta.url), 'utf8');
const assistantUiSource = readFileSync(new URL('../src/main-assistant/ui.js', import.meta.url), 'utf8');
const optimizerBridgeSource = readFileSync(new URL('../src/optimizer/bridge.js', import.meta.url), 'utf8');
const wizardIntroSource = readFileSync(new URL('../src/optimizer/keyword-plan-api/intro.js', import.meta.url), 'utf8');
const wizardMountIntroSource = readFileSync(new URL('../src/optimizer/keyword-plan-api/wizard-mount-intro.js', import.meta.url), 'utf8');
const wizardOpenSource = readFileSync(new URL('../src/optimizer/keyword-plan-api/wizard-open-and-create.js', import.meta.url), 'utf8');
const requestBuilderPreviewSource = readFileSync(new URL('../src/optimizer/keyword-plan-api/request-builder-preview.js', import.meta.url), 'utf8');
const searchAndDraftSource = readFileSync(new URL('../src/optimizer/keyword-plan-api/search-and-draft.js', import.meta.url), 'utf8');
const strategyStateSource = readFileSync(new URL('../src/optimizer/keyword-plan-api/wizard-scene-config/strategy-state-and-draft.js', import.meta.url), 'utf8');
const batchEditPopupSource = readFileSync(new URL('../src/optimizer/keyword-plan-api/wizard-scene-config/batch-edit-popup.js', import.meta.url), 'utf8');
const manualKeywordsAndDetailSource = readFileSync(new URL('../src/optimizer/keyword-plan-api/wizard-scene-config/manual-keywords-and-detail.js', import.meta.url), 'utf8');
const itemSelectionSource = readFileSync(new URL('../src/optimizer/keyword-plan-api/wizard-scene-config/item-selection.js', import.meta.url), 'utf8');

const sliceSource = (source, startNeedle, endNeedle) => {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `缺少源码片段起点：${startNeedle}`);
  const end = source.indexOf(endNeedle, start);
  assert.notEqual(end, -1, `缺少源码片段终点：${endNeedle}`);
  return source.slice(start, end);
};

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
    wizardIntroSource,
    /openTaskTimers:\s*new Set\(\),[\s\S]*openTaskFrames:\s*new Set\(\),/,
    'wizardState 应登记打开后延迟任务的 timer/raf 注册表'
  );
  assert.match(
    wizardOpenSource,
    /const ensureWizardOpenTaskSchedules = \(\) => \{[\s\S]*wizardState\.openTaskTimers instanceof Set[\s\S]*wizardState\.openTaskFrames instanceof Set[\s\S]*return \{[\s\S]*timers: wizardState\.openTaskTimers,[\s\S]*frames: wizardState\.openTaskFrames[\s\S]*\};[\s\S]*\};/,
    '打开任务调度应规范化 timer/raf 注册表'
  );
  assert.match(
    wizardOpenSource,
    /const clearWizardOpenTaskSchedule = \(\) => \{[\s\S]*timers\.forEach\(\(timerId\) => clearTimeout\(timerId\)\);[\s\S]*timers\.clear\(\);[\s\S]*frames\.forEach\(\(frameId\) => \{[\s\S]*window\.cancelAnimationFrame\(frameId\);[\s\S]*\}\);[\s\S]*frames\.clear\(\);[\s\S]*\};/,
    '打开任务调度应能统一释放 pending timeout 与 rAF'
  );
  assert.match(
    wizardOpenSource,
    /const scheduleWizardOpenTask = \(openToken = 0, task = null\) => \{[\s\S]*const \{ timers, frames \} = ensureWizardOpenTaskSchedules\(\);[\s\S]*if \(openToken !== wizardState\.openToken\) return;[\s\S]*if \(wizardState\.visible !== true\) return;[\s\S]*const timerId = setTimeout\(\(\) => \{[\s\S]*timers\.delete\(timerId\);[\s\S]*runTask\(\);[\s\S]*\}, 0\);[\s\S]*timers\.add\(timerId\);[\s\S]*let frameId = 0;[\s\S]*let frameFired = false;[\s\S]*frameId = window\.requestAnimationFrame\(\(\) => \{[\s\S]*frameFired = true;[\s\S]*frames\.delete\(frameId\);[\s\S]*scheduleAfterPaint\(\);[\s\S]*if \(!frameFired && frameId !== undefined && frameId !== null\) \{[\s\S]*frames\.add\(frameId\);/,
    'openWizard 应把预览刷新延后到 overlay 打开后的下一帧，并登记可取消的 timeout/rAF；同步 rAF shim 不应留下 frame 句柄'
  );
  assert.doesNotMatch(
    wizardOpenSource,
    /setTimeout\(runTask, 0\)|window\.requestAnimationFrame\(scheduleAfterPaint\)/,
    '打开后任务不应继续使用无句柄 timeout 或 rAF'
  );
  assert.match(
    wizardOpenSource,
    /wizardState\.openToken = \(toNumber\(wizardState\.openToken, 0\) \+ 1\);[\s\S]*const openToken = wizardState\.openToken;[\s\S]*clearWizardOpenTaskSchedule\(\);/,
    '每次重新打开向导时应先释放上一轮 pending 打开任务'
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

test('组建计划关闭后卸载隐藏 DOM 并清理全局监听', () => {
  assert.match(
    wizardIntroSource,
    /styleReadyPromise: null,[\s\S]*?styleCleanupHandlers: \[\],[\s\S]*?closeItemPicker: null,[\s\S]*?closeScenePopup: null,[\s\S]*?closeKeywordAiMaxDemandPopover: null,[\s\S]*?cleanupHandlers: \[\],[\s\S]*?els: \{\}/,
    'wizardState 应显式初始化样式加载 Promise 和关闭清理队列'
  );
  assert.match(
    requestBuilderPreviewSource,
    /const removeWizardDomAfterClose = \(\) => \{[\s\S]*?wizardState\.closeItemPicker\(false\);[\s\S]*?wizardState\.closeScenePopup\(null\);[\s\S]*?wizardState\.closeKeywordAiMaxDemandPopover\(\);[\s\S]*?wizardState\.cleanupHandlers\.forEach\(\(cleanup\) => \{[\s\S]*?wizardState\.styleCleanupHandlers\.forEach\(\(cleanup\) => \{[\s\S]*?currentEls\.runModeMenu\.remove\(\);[\s\S]*?currentEls\.overlay\.remove\(\);[\s\S]*?wizardState\.els = \{\};[\s\S]*?wizardState\.mounted = false;[\s\S]*?wizardState\.styleReadyPromise = null;[\s\S]*?wizardState\.closeItemPicker = null;[\s\S]*?wizardState\.closeScenePopup = null;[\s\S]*?wizardState\.closeKeywordAiMaxDemandPopover = null;[\s\S]*?\};/,
    '关闭组建计划后必须先关闭 body 级子浮层，再移除 overlay、样式和元素引用'
  );
  assert.match(
    requestBuilderPreviewSource,
    /wizardState\.styleReadyPromise = null;[\s\S]*?wizardState\.manualKeywordDelegatedBound = false;/,
    '卸载旧弹窗 DOM 后必须重置绑定在 sceneDynamic 上的委托标记，避免重开后手动关键词控件失效'
  );
  assert.match(
    requestBuilderPreviewSource,
    /const closeWizardOverlay = \(\) => \{[\s\S]*?commitDraftState\(\);[\s\S]*?setRunModeMenuOpen\(false\);[\s\S]*?wizardState\.openToken = toNumber\(wizardState\.openToken, 0\) \+ 1;[\s\S]*?clearWizardOpenTaskSchedule\(\);[\s\S]*?removeWizardDomAfterClose\(\);[\s\S]*?\};/,
    '关闭路径应先保存草稿和关闭浮层状态，再失效异步 open 任务并卸载 DOM'
  );
  assert.match(
    requestBuilderPreviewSource,
    /window\.addEventListener\('resize', repositionRunModeMenuIfOpen\);[\s\S]*?window\.addEventListener\('scroll', repositionRunModeMenuIfOpen, true\);[\s\S]*?wizardState\.cleanupHandlers\.push\(\(\) => \{[\s\S]*?window\.removeEventListener\('resize', repositionRunModeMenuIfOpen\);[\s\S]*?window\.removeEventListener\('scroll', repositionRunModeMenuIfOpen, true\);[\s\S]*?\}\);/,
    '可重建弹窗上的 window 级监听必须在关闭卸载时同步清理，避免重复打开叠加监听'
  );
  assert.match(
    wizardMountIntroSource,
    /const closePicker = \(confirmed = false\) => \{[\s\S]*?wizardState\.closeItemPicker = null;[\s\S]*?document\.removeEventListener\('keydown', handleEsc, true\);[\s\S]*?restoreItemSplit\(\);[\s\S]*?\};[\s\S]*?wizardState\.closeItemPicker = closePicker;/,
    '商品选择 body 级弹窗应登记正常关闭句柄，主弹窗关闭时必须先恢复搬出的商品列表 DOM'
  );
  assert.match(
    gridSource,
    /const closeKeywordAiMaxDemandPopover = \(\) => \{[\s\S]*?wizardState\.closeKeywordAiMaxDemandPopover = null;[\s\S]*?document\.removeEventListener\('click', wizardState\.aiMaxDemandPopoverOutsideClick, true\);[\s\S]*?\};[\s\S]*?wizardState\.closeKeywordAiMaxDemandPopover = closeKeywordAiMaxDemandPopover;/,
    'AI 需求 popover 应登记关闭句柄并清理外部 click/keydown 监听'
  );
  assert.match(
    gridSource,
    /if \(previousMask\) \{[\s\S]*?wizardState\.closeScenePopup\(null\);[\s\S]*?\}[\s\S]*?const close = \(payload = null\) => \{[\s\S]*?wizardState\.closeScenePopup = null;[\s\S]*?document\.removeEventListener\('keydown', handlePopupKeydown, true\);[\s\S]*?\};[\s\S]*?wizardState\.closeScenePopup = close;/,
    '场景配置弹窗应登记关闭句柄，替换旧弹窗和主弹窗关闭都应走正常清理'
  );
  assert.match(
    manualKeywordsAndDetailSource,
    /if \(previousMask\) \{[\s\S]*?wizardState\.closeScenePopup\(null\);[\s\S]*?\}[\s\S]*?const close = \(payload = null\) => \{[\s\S]*?wizardState\.closeScenePopup = null;[\s\S]*?document\.removeEventListener\('keydown', handleEscClose, true\);[\s\S]*?\};[\s\S]*?wizardState\.closeScenePopup = close;/,
    '批量编辑弹窗应复用同一关闭句柄，避免关闭主弹窗后遗留 body 级遮罩'
  );
});

test('自动推荐关键词延迟加载 timer 纳入向导生命周期', () => {
  const stateBlock = sliceSource(wizardIntroSource, 'const wizardState = {', 'const log = {');
  const clearBlock = sliceSource(wizardIntroSource, 'const clearWizardAutoKeywordLoadTimer = (options = {}) => {', 'const deepClone =');
  const setDetailVisibleBlock = sliceSource(batchEditPopupSource, 'const setDetailVisible = (visible) => {', 'const showStrategyDetail =');
  const scheduleBlock = sliceSource(requestBuilderPreviewSource, 'const scheduleAutoKeywordLoad = ({', 'const maybeAutoLoadManualKeywords =');
  const maybeBlock = sliceSource(requestBuilderPreviewSource, 'const maybeAutoLoadManualKeywords = (strategy = null, options = {}) => {', 'const loadRecommendedCrowds = async () => {');
  const closeBlock = sliceSource(requestBuilderPreviewSource, 'const closeWizardOverlay = () => {', 'wizardState.els.closeBtn.onclick = closeWizardOverlay;');

  assert.ok(
    stateBlock.includes('autoKeywordLoadTimer: 0,')
      && stateBlock.includes("autoKeywordLoadKey: '',")
      && stateBlock.includes("autoKeywordLoadToken: '',")
      && stateBlock.includes('autoKeywordLoadMap: {},'),
    'wizardState 应登记自动推荐关键词的 timer/key/token/map 生命周期状态'
  );
  assert.ok(
    clearBlock.includes('clearTimeout(wizardState.autoKeywordLoadTimer);')
      && clearBlock.includes('wizardState.autoKeywordLoadTimer = 0;')
      && clearBlock.includes("const pendingKey = String(wizardState.autoKeywordLoadKey || '').trim();")
      && clearBlock.includes("wizardState.autoKeywordLoadKey = '';")
      && clearBlock.includes("wizardState.autoKeywordLoadToken = '';")
      && clearBlock.includes("wizardState.autoKeywordLoadMap[pendingKey] === 'pending'")
      && clearBlock.includes('delete wizardState.autoKeywordLoadMap[pendingKey];'),
    '自动推荐关键词 timer 应提供可复用清理 helper，并在取消 pending 任务时清理 map'
  );
  assert.ok(
    setDetailVisibleBlock.includes('if (!wizardState.detailVisible) {')
      && setDetailVisibleBlock.includes('clearWizardAutoKeywordLoadTimer();'),
    '隐藏策略详情时应释放 pending 自动推荐关键词 timer'
  );
  assert.ok(
    closeBlock.includes('setDetailVisible(false);')
      && closeBlock.includes('clearWizardOpenTaskSchedule();'),
    '关闭主弹窗时应通过详情隐藏路径释放自动推荐关键词 timer，并继续释放打开任务'
  );
  assert.ok(
    scheduleBlock.includes('clearWizardAutoKeywordLoadTimer();')
      && scheduleBlock.includes('wizardState.autoKeywordLoadKey = normalizedKey;')
      && scheduleBlock.includes('wizardState.autoKeywordLoadToken = token;')
      && scheduleBlock.includes('wizardState.autoKeywordLoadTimer = window.setTimeout(async () => {')
      && scheduleBlock.includes('wizardState.autoKeywordLoadTimer = 0;')
      && scheduleBlock.includes('if (wizardState.autoKeywordLoadToken !== token) return;')
      && scheduleBlock.includes('if (wizardState.autoKeywordLoadKey !== normalizedKey) return;')
      && scheduleBlock.includes('wizardState.editingStrategyId !== normalizedStrategyId')
      && scheduleBlock.includes('|| !wizardState.detailVisible')
      && scheduleBlock.includes('|| wizardState.visible !== true')
      && scheduleBlock.includes("loadRecommendedKeywords({ triggerSource: 'auto_fill' })")
      && scheduleBlock.includes("wizardState.autoKeywordLoadMap[normalizedKey] = 'done';")
      && scheduleBlock.includes("wizardState.autoKeywordLoadKey = '';")
      && scheduleBlock.includes("wizardState.autoKeywordLoadToken = '';"),
    '自动推荐关键词应通过可取消 helper 调度，触发前复核 token/key/策略和可见状态'
  );
  assert.ok(
    maybeBlock.includes("wizardState.autoKeywordLoadMap[autoLoadKey] = 'pending';")
      && maybeBlock.includes('scheduleAutoKeywordLoad({ autoLoadKey, strategyId, delayMs });'),
    'maybeAutoLoadManualKeywords 应只登记 pending 并交给可取消调度 helper'
  );
  assert.equal(
    maybeBlock.includes('window.setTimeout(async () => {'),
    false,
    'maybeAutoLoadManualKeywords 不应继续直接排裸 async timeout'
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
