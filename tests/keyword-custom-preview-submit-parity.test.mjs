import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getBlock(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.ok(start > -1 && end > start, `无法定位代码块: ${startMarker}`);
  return source.slice(start, end);
}

test('默认自定义推广策略与请求预览保持智能出价 conv 契约', () => {
  const defaultsBlock = getBlock(
    'const getDefaultStrategyList = () => ([',
    'const wizardDefaultDraft = () => ({'
  );
  assert.match(
    defaultsBlock,
    /id:\s*'custom_define'[\s\S]*marketingGoal:\s*'自定义推广'[\s\S]*bidMode:\s*'smart'[\s\S]*bidTargetV2:\s*'conv'[\s\S]*useWordPackage:\s*DEFAULTS\.useWordPackage[\s\S]*出价目标:\s*'获取成交量'/,
    '默认自定义推广策略未保持 自定义推广 + 智能出价 + conv + 流量智选 契约'
  );

  const previewBlock = getBlock(
    'const strategyBidMode = normalizeBidMode(',
    'const commonKeywordMode = wizardState.draft.keywordMode || DEFAULTS.keywordMode;'
  );
  assert.match(
    previewBlock,
    /strategySceneSettings\.出价方式 = strategyBidMode === 'manual' \? '手动出价' : '智能出价';/,
    '请求预览未把出价方式写回 sceneSettings'
  );
  assert.match(
    previewBlock,
    /const strategyBidTargetLabel = BID_TARGET_OPTIONS\.find\(item => item\.value === strategyBidTargetOptionValue\)\?\.label \|\| '获取成交量';[\s\S]*strategySceneSettings\.出价目标 = strategyBidTargetLabel;/,
    '请求预览未把 conv 目标回写为“获取成交量”'
  );
  assert.match(
    previewBlock,
    /keywordSource:\s*\{[\s\S]*useWordPackage:\s*strategyUseWordPackage[\s\S]*\}/,
    '请求预览未保留流量智选开关'
  );
});

test('手动出价预览与最终提交都会裁掉出价目标字段', () => {
  const previewBlock = getBlock(
    'if (isKeywordScene) {',
    'const strategyKeywordMode = strategy.keywordMode || wizardState.draft.keywordMode || DEFAULTS.keywordMode;'
  );
  assert.match(
    previewBlock,
    /if \(strategyBidMode === 'manual'\) \{[\s\S]*delete strategySceneSettings\.出价目标;[\s\S]*delete strategySceneSettings\.优化目标;/,
    '手动出价预览未删除 出价目标/优化目标'
  );

  const submitBlock = getBlock(
    'const pruneKeywordCampaignForCustomScene = (campaign = {}, options = {}) => {',
    'const pruneKeywordAdgroupForCustomScene = (adgroup = {}, item = null, options = {}) => {'
  );
  assert.match(
    submitBlock,
    /if \(isManual\)\s*\{[\s\S]*delete out\.bidTargetV2;[\s\S]*delete out\.optimizeTarget;[\s\S]*\}/,
    '手动出价最终提交未删除 bidTargetV2/optimizeTarget'
  );
});

test('自定义推广高级设置三字段在预览场景设置与最终提交间保持同名字段', () => {
  const renderBlock = getBlock(
    "if (activeKeywordGoal === '自定义推广') {",
    "if (sceneName === '货品全站推广') {"
  );
  assert.match(
    renderBlock,
    /label:\s*'投放资源位\/投放地域\/分时折扣'[\s\S]*hiddenFields:\s*\[[\s\S]*\{ fieldKey: adzoneField, value: adzoneRaw \},[\s\S]*\{ fieldKey: launchPeriodField, value: launchPeriodRaw \},[\s\S]*\{ fieldKey: launchAreaField, value: launchAreaRaw \}[\s\S]*\]/,
    '编辑态组合弹窗未把三类高级设置写入同一个场景设置快照'
  );

  const mappingBlock = getBlock(
    'const resolveSceneSettingOverrides = ({ sceneName = \'\', sceneSettings = {}, runtime = {} }) => {',
    'const buildFallbackSolutionTemplate = (runtime, sceneName = \'\') => {'
  );
  for (const key of ['adzoneList', 'launchPeriodList', 'launchAreaStrList']) {
    assert.match(
      mappingBlock,
      new RegExp(key),
      `场景设置映射未识别 ${key}`
    );
  }

  const submitBlock = getBlock(
    'const pruneKeywordCampaignForCustomScene = (campaign = {}, options = {}) => {',
    'const pruneKeywordAdgroupForCustomScene = (adgroup = {}, item = null, options = {}) => {'
  );
  assert.match(
    submitBlock,
    /out\.adzoneList = resolveNonEmptyArrayField\('adzoneList'[\s\S]*\);/,
    '最终提交未保留/回落 adzoneList'
  );
  assert.match(
    submitBlock,
    /out\.launchAreaStrList = Array\.isArray\(resolvedLaunchAreaList\) && resolvedLaunchAreaList\.length[\s\S]*\? resolvedLaunchAreaList[\s\S]*: \['all'\];/,
    '最终提交未保留/回落 launchAreaStrList'
  );
  assert.match(
    submitBlock,
    /out\.launchPeriodList = Array\.isArray\(resolvedLaunchPeriodList\) && resolvedLaunchPeriodList\.length[\s\S]*\? resolvedLaunchPeriodList[\s\S]*: buildDefaultLaunchPeriodList\(\);/,
    '最终提交未保留/回落 launchPeriodList'
  );
});

test('货品全站推广原生开关在编辑态与提交映射中保持一致', () => {
  const siteRenderBlock = getBlock(
    "if (sceneName === '货品全站推广') {",
    'if (shouldRenderStandaloneBudgetRow) {'
  );
  assert.match(
    siteRenderBlock,
    /am-wxt-scene-setting-label">优质计划防停投[\s\S]*?trigger:\s*'budgetGuard'[\s\S]*?buttonLabel:\s*'修改'/,
    '货品全站推广编辑态缺少“优质计划防停投”开关与修改弹窗'
  );
  assert.match(
    siteRenderBlock,
    /const smartCreativeKey = normalizeSceneFieldKey\('智能创意'\);[\s\S]*?am-wxt-scene-setting-label">智能创意[\s\S]*?buildSceneSwitchControl\(smartCreativeKey, smartCreativeValue, '开启', '关闭'\)/,
    '货品全站推广编辑态缺少“智能创意”开关'
  );
  assert.match(
    siteRenderBlock,
    /const optimizeTargetOptions = \['优化加购', '优化直接成交'\];/,
    '货品全站推广多目标优化目标候选未对齐原生开启态'
  );
  assert.doesNotMatch(
    siteRenderBlock.match(/const optimizeTargetOptions[\s\S]*?;/)?.[0] || '',
    /增加收藏加购量|增加总成交金额|增加净成交金额|获取成交量/,
    '货品全站推广多目标优化仍混入非原生目标候选'
  );
  assert.match(
    siteRenderBlock,
    /data-scene-toggle-group="site-multi-target-target"[\s\S]*?data-scene-field="\$\{Utils\.escapeHtml\(optimizeBudgetKey\)\}"/,
    '货品全站推广开启多目标优化后缺少目标与预算配置'
  );
  assert.match(
    siteRenderBlock,
    /const quickLiftLaunchPeriodField = '__am\.quickLiftLaunchPeriodList';[\s\S]*?const quickLiftLaunchAreaField = '__am\.quickLiftLaunchAreaList';/,
    '一键起量缺少时间/地域弹窗内部字段'
  );
  assert.match(
    siteRenderBlock,
    /trigger:\s*'quickLiftLaunchSetting'[\s\S]*?buttonLabel:\s*'起量时间地域设置'[\s\S]*?hiddenFields:\s*\[[\s\S]*quickLiftLaunchPeriodField[\s\S]*quickLiftLaunchAreaField[\s\S]*\]/,
    '一键起量未使用原生式“起量时间地域设置”弹窗入口'
  );
  assert.match(
    siteRenderBlock,
    /class="am-wxt-hidden-control" data-scene-field="\$\{Utils\.escapeHtml\(launchTimeKey\)\}"[\s\S]*?class="am-wxt-hidden-control" data-scene-field="\$\{Utils\.escapeHtml\(launchAreaKey\)\}"/,
    '一键起量仍缺少投放时间/投放地域隐藏字段写回'
  );
  assert.match(
    siteRenderBlock,
    /const normalizeSiteMultiTargetLabel = \(value = ''\) => \{[\s\S]*?1230\|优化直接成交[\s\S]*?return '优化直接成交';[\s\S]*?1034\|优化加购[\s\S]*?return '优化加购';/,
    '货品全站推广未把旧草稿目标归一到原生目标文案'
  );
  assert.doesNotMatch(
    siteRenderBlock,
    /am-wxt-scene-setting-label">专属权益/,
    '货品全站推广仍展示原生未确认的“专属权益”开关'
  );
  assert.match(
    siteRenderBlock,
    /const staleBenefitKey = normalizeSceneFieldKey\('专属权益'\);[\s\S]*?delete bucket\.专属权益;/,
    '货品全站推广未清理历史草稿中的“专属权益”字段'
  );

  const connectedLabelBlock = getBlock(
    'const SCENE_CONNECTED_SETTING_LABEL_RE =',
    'const SCENE_RENDER_FIELD_ALIAS_RULES = ['
  );
  assert.match(connectedLabelBlock, /优质计划防停投/, '场景设置采集未放行“优质计划防停投”');
  assert.match(connectedLabelBlock, /智能创意/, '场景设置采集未放行“智能创意”');

  const mappingBlock = getBlock(
    'const resolveSceneSettingOverrides = ({ sceneName = \'\', sceneSettings = {}, runtime = {} }) => {',
    'const buildFallbackSolutionTemplate = (runtime, sceneName = \'\') => {'
  );
  assert.match(
    mappingBlock,
    /const smartCreativeEntry = findSceneSettingEntry\(entries, \[\/智能创意\/, \/创意优选\/, \/封面智能创意\/\]\);[\s\S]*?applyCampaign\('smartCreative', 0/,
    '提交映射未把“智能创意=关闭”映射为 smartCreative=0'
  );
  assert.match(
    mappingBlock,
    /const budgetGuardEntry = findSceneSettingEntry\(entries, \[\/优质计划防停投\/, \/预算自动提升\/, \/防停投\/\]\);[\s\S]*?applyCampaign\('enableRuleAuto', false/,
    '提交映射未把“优质计划防停投=关闭”映射为 enableRuleAuto=false'
  );
  const popupBlock = getBlock(
    'const openQuickLiftLaunchSettingPopup = async () => {',
    'const openCrowdFilterSettingPopup = async () => {'
  );
  assert.match(
    popupBlock,
    /variant:\s*'quickLift'[\s\S]*?includeAdzone:\s*false[\s\S]*?title:\s*'起量时间地域设置'/,
    '一键起量弹窗未使用专用 quickLift 原生式弹窗'
  );
  assert.match(
    popupBlock,
    /areaCustomTemplateLabel:\s*'自定义起量地域模板'[\s\S]*?areaCustomTemplateOptionLabel:\s*'RX10SMax成交'/,
    '一键起量地域模板文案未对齐原生'
  );
  assert.match(
    popupBlock,
    /launchPeriodField:\s*'__am\.quickLiftLaunchPeriodList'[\s\S]*?launchAreaField:\s*'__am\.quickLiftLaunchAreaList'/,
    '一键起量弹窗未绑定内部时间/地域字段'
  );
  const popupSaveBlock = getBlock(
    "} else if (trigger === 'quickLiftLaunchSetting') {",
    "} else if (trigger === 'itemSelect') {"
  );
  assert.match(
    popupSaveBlock,
    /const launchAreaSummary = quickLiftLaunchAreaRawToSummary\(result\.launchAreaRaw[\s\S]*?\|\| result\.launchAreaSummary[\s\S]*?const launchPeriodSummary = quickLiftLaunchPeriodRawToSummary\(result\.launchPeriodRaw[\s\S]*?\|\| result\.launchPeriodSummary[\s\S]*?updateScenePopupSummary\(row,\s*trigger,\s*`\$\{launchPeriodSummary\}｜\$\{launchAreaSummary\}`\)/,
    '一键起量弹窗保存摘要必须优先以结构化时间/地域字段为准'
  );
  assert.match(
    popupSaveBlock,
    /quickLiftLaunchPeriodRawToValue[\s\S]*?quickLiftLaunchAreaRawToValue[\s\S]*?dispatchSceneControlUpdate\(quickLiftTimeControl[\s\S]*?dispatchSceneControlUpdate\(quickLiftAreaControl/,
    '一键起量弹窗保存未把结构化时间/地域写回可提交字段'
  );
  const advancedPopupBlock = getBlock(
    'const openKeywordAdvancedSettingPopup = async (initialTab = \'adzone\', popupOptions = {}) => {',
    'const openCrowdLaunchSettingPopup = async () => {'
  );
  assert.match(
    advancedPopupBlock,
    /const isQuickLiftVariant = advancedVariant === 'quickLift';[\s\S]*?const includeAreaRecommendTemplate = !isQuickLiftVariant/,
    '高级弹窗未为一键起量关闭通用推荐地域模板'
  );
  assert.match(
    advancedPopupBlock,
    /am-wxt-scene-quick-lift-section[\s\S]*?起量时间[\s\S]*?data-scene-popup-quick-time-range[\s\S]*?至少选择4个起量小时，支持多个时间段[\s\S]*?起量地域[\s\S]*?\$\{areaConfigRowHtml\}/,
    '一键起量弹窗未采用原生纵向“起量时间/起量地域”结构'
  );
  assert.match(
    advancedPopupBlock,
    /buildQuickLiftLaunchPeriodListFromSelectionState[\s\S]*?timeSpanList:\s*timeSpanList\.map[\s\S]*?formatQuickLiftTimeSelectionSummaryFromState/,
    '一键起量弹窗未把多时间段序列化为结构化投放时间'
  );
  assert.match(
    advancedPopupBlock,
    /const applyQuickLiftHourRangeSelection = \(startHour, endHour, nextSelected\) => \{[\s\S]*?for \(let hour = from; hour <= to; hour \+= 1\)[\s\S]*?renderQuickLiftTimeRange\(\);/,
    '一键起量时间条缺少拖动连续选择/取消的区间应用逻辑'
  );
  assert.match(
    advancedPopupBlock,
    /quickLiftTimeRangeEl\.addEventListener\('pointerdown'[\s\S]*?event\.button !== 0[\s\S]*?quickLiftSuppressNextClick = true[\s\S]*?setPointerCapture/,
    '一键起量时间条未监听鼠标左键按下开始拖选'
  );
  assert.match(
    advancedPopupBlock,
    /quickLiftTimeRangeEl\.addEventListener\('pointermove'[\s\S]*?applyQuickLiftHourRangeSelection\([\s\S]*?quickLiftDragState\.nextSelected[\s\S]*?quickLiftDragState\.lastHour = hour;/,
    '一键起量时间条未在按住拖动时连续应用选择状态'
  );
  assert.match(
    advancedPopupBlock,
    /const advancedPopupCleanupHandlers = \[\];[\s\S]*mask\._amWxtCleanup = \(\) => \{[\s\S]*advancedPopupCleanupHandlers\.splice\(0\)\.forEach/,
    '高级设置弹层外部资源必须统一接入 mask cleanup'
  );
  assert.match(
    advancedPopupBlock,
    /const cleanupQuickLiftDrag = \(\) => \{[\s\S]*window\.removeEventListener\('pointerup', stopQuickLiftDrag, true\);[\s\S]*window\.removeEventListener\('pointercancel', stopQuickLiftDrag, true\);[\s\S]*clearQuickLiftSuppressResetTimer\(\);[\s\S]*quickLiftSuppressNextClick = false;/,
    '一键起量拖拽关闭弹层时必须释放 window pointer 监听和 reset timer'
  );
  assert.match(
    advancedPopupBlock,
    /quickLiftSuppressResetTimer = window\.setTimeout\(\(\) => \{[\s\S]*quickLiftSuppressResetTimer = 0;[\s\S]*quickLiftSuppressNextClick = false;[\s\S]*addAdvancedPopupCleanup\(cleanupQuickLiftDrag\);/,
    '一键起量拖拽 suppress reset timer 必须保存句柄并接入弹层 cleanup'
  );
  assert.match(
    advancedPopupBlock,
    /quickLiftSuppressNextClick[\s\S]*?quickLiftTimeRangeEl\.addEventListener\('click'[\s\S]*?if \(quickLiftSuppressNextClick\)/,
    '一键起量时间条拖选后未抑制 click 二次反转'
  );
  const siteMultiTargetMapBlock = getBlock(
    'const mapSiteMultiTargetOptimizeTargetValue = (text = \'\') => {',
    'const buildQuickLiftHourSlotValue = (text = \'\') => {'
  );
  assert.match(
    siteMultiTargetMapBlock,
    /if \(\/\^\\d\{3,6\}\$\/\.test\(value\)\) return \['1034', '1230'\]\.includes\(value\) \? value : '';/,
    '多目标优化数字目标码未限制为原生两个目标'
  );
  assert.match(
    siteMultiTargetMapBlock,
    /if \(\/优化加购\|收藏加购\|加购\/\.test\(value\)\) return '1034';[\s\S]*?if \(\/优化直接成交\|增加净成交金额\|净成交金额\|直接成交\/\.test\(value\)\) return '1230';/,
    '多目标优化目标码未覆盖原生两个目标'
  );
  assert.doesNotMatch(
    siteMultiTargetMapBlock,
    /return '1231';/,
    '多目标优化仍保留原生开启态不存在的总成交目标码'
  );
  const quickLiftSlotBlock = getBlock(
    'const buildQuickLiftHourSlotValue = (text = \'\') => {',
    'const mapSceneLaunchAreaList = (text = \'\') => {'
  );
  assert.match(
    quickLiftSlotBlock,
    /value\.matchAll\([\s\S]*?\)\);[\s\S]*?rangeMatches\.forEach[\s\S]*?hourSet\.add\(String\(i\)\)/,
    'quickLiftTimeSlot 未解析多个时间段'
  );
  const siteQuickLiftPeriodBlock = getBlock(
    'const buildSiteQuickLiftPeriodRawFromValue = (value = \'\') => {',
    'const buildSiteQuickLiftAreaRawFromValue = (value = \'\') => {'
  );
  assert.match(
    siteQuickLiftPeriodBlock,
    /text\.matchAll\([\s\S]*?\)\);[\s\S]*?rangeMatches\.forEach[\s\S]*?hourSet\.add\(hour\)/,
    '一键起量投放时间文本回填未解析多个时间段'
  );
  assert.match(
    siteQuickLiftPeriodBlock,
    /buildSiteQuickLiftHourRanges\(hourList\)[\s\S]*?\.map\(range => \(\{[\s\S]*?time: `\$\{formatHour\(range\.start\)\}-\$\{formatHour\(Math\.max\(range\.start \+ 1, range\.end\)\)\}`/,
    '一键起量投放时间文本回填仍会把多个时间段合并成单段'
  );
  const siteQuickLiftSummaryBlock = getBlock(
    'const describeSiteQuickLiftPeriodSummary = (rawValue = \'\') => {',
    'const describeSiteQuickLiftAreaSummary = (rawValue = \'\') => {'
  );
  assert.match(
    siteQuickLiftSummaryBlock,
    /const selectedHourSet = new Set\(\);[\s\S]*?buildSiteQuickLiftHourRanges\(Array\.from\(selectedHourSet\)\)[\s\S]*?join\('、'\)/,
    '一键起量投放时间摘要未按多个连续区间展示'
  );
});
