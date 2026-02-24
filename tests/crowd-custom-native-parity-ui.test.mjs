import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getRenderSceneDynamicConfigBlock() {
  const start = source.indexOf('const renderSceneDynamicConfig = () => {');
  const end = source.indexOf('const collectManualKeywordRowsFromPanel = (panel) => (', start);
  assert.ok(start > -1 && end > start, '无法定位 renderSceneDynamicConfig 代码块');
  return source.slice(start, end);
}

function getResolveSceneSettingOverridesBlock() {
  const start = source.indexOf('const resolveSceneSettingOverrides = ({ sceneName = \'\', sceneSettings = {}, runtime = {} }) => {');
  const end = source.indexOf('const buildFallbackSolutionTemplate = (runtime, sceneName = \'\') => {', start);
  assert.ok(start > -1 && end > start, '无法定位 resolveSceneSettingOverrides 代码块');
  return source.slice(start, end);
}

function getLoadRecommendedCrowdsBlock() {
  const start = source.indexOf('const loadRecommendedCrowds = async () => {');
  const end = source.indexOf('const resolveSceneSyncItemId = () => {', start);
  assert.ok(start > -1 && end > start, '无法定位 loadRecommendedCrowds 代码块');
  return source.slice(start, end);
}

function extractBraceBlock(text, anchorIndex, label = '代码块') {
  const openIndex = text.indexOf('{', anchorIndex);
  assert.ok(openIndex > -1, `无法定位${label}起始大括号`);
  let depth = 0;
  for (let idx = openIndex; idx < text.length; idx += 1) {
    const ch = text[idx];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return {
          start: openIndex,
          end: idx,
          body: text.slice(openIndex + 1, idx)
        };
      }
    }
  }
  assert.fail(`无法定位${label}结束位置`);
}

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('人群推广营销目标回退选项包含自定义推广', () => {
  assert.match(
    source,
    /SCENE_MARKETING_GOAL_FALLBACK_OPTIONS\s*=\s*\{[\s\S]*?'人群推广':\s*\[[^\]]*'自定义推广'[^\]]*\]/,
    'SCENE_MARKETING_GOAL_FALLBACK_OPTIONS 缺少“人群推广-自定义推广”'
  );
  assert.match(
    source,
    /SCENE_FALLBACK_OPTION_MAP\s*=\s*\{[\s\S]*?'人群推广':\s*\{[\s\S]*?营销目标:\s*\[[^\]]*'自定义推广'[^\]]*\]/,
    'SCENE_FALLBACK_OPTION_MAP 缺少“人群推广-自定义推广”'
  );
});

test('人群推广自定义推广提供原生同构弹窗入口与双出价模式', () => {
  const renderBlock = getRenderSceneDynamicConfigBlock();
  const marker = "if (sceneName === '人群推广' && activeMarketingGoal === '自定义推广') {";
  const branchStart = renderBlock.lastIndexOf(marker);
  assert.ok(branchStart > -1, '缺少“人群推广-自定义推广”场景渲染分支');
  const branch = extractBraceBlock(renderBlock, branchStart, '人群自定义推广分支').body;

  assert.match(
    branch,
    /label:\s*'出价方式'[\s\S]*?options:\s*\[\s*'智能出价'\s*,\s*'手动出价'\s*\]/,
    '人群自定义推广未补齐“智能出价/手动出价”双模式'
  );
  assert.match(
    branch,
    /am-wxt-scene-setting-label">选择推广商品[\s\S]*?trigger:\s*'itemSelect'/,
    '人群自定义推广缺少“选择推广商品-添加商品”弹窗触发器'
  );
  assert.match(
    branch,
    /am-wxt-scene-setting-label">选择推广商品[\s\S]*?title:\s*'添加商品'/,
    '人群自定义推广“选择推广商品”弹窗标题未对齐原生“添加商品”'
  );
  assert.doesNotMatch(
    branch,
    /label:\s*'选择推广商品'[\s\S]*?options:\s*\[\s*'自定义选品'\s*\]/,
    '人群自定义推广不应再显示“选品方式/自定义选品”选项片'
  );
  assert.match(
    branch,
    /label:\s*'人群设置'[\s\S]*?trigger:\s*'crowd'/,
    '人群自定义推广缺少“人群设置”弹窗触发器'
  );
  assert.match(
    branch,
    /label:\s*'人群设置'[\s\S]*?title:\s*'手动添加人群'/,
    '人群自定义推广“人群设置”弹窗标题未对齐原生“手动添加人群”'
  );
  assert.match(
    branch,
    /label:\s*'选择方式'[\s\S]*?options:\s*\[\s*'自定义人群'\s*,\s*'AI推人'\s*\]/,
    '人群自定义推广缺少“选择方式（自定义人群/AI推人）”配置'
  );
  assert.match(
    branch,
    /const crowdBidTargetOptions = \(crowdBidMode === 'smart'[\s\S]*?CROWD_CUSTOM_SMART_BID_TARGET_ORDER[\s\S]*?CROWD_CUSTOM_BID_TARGET_ORDER[\s\S]*?label:\s*'出价目标'[\s\S]*?options:\s*crowdBidTargetOptions[\s\S]*?strictOptions:\s*true/,
    '人群自定义推广“出价目标”未按智能/手动出价模式切换'
  );
  assert.match(
    branch,
    /if \(crowdBidMode === 'manual'\) \{[\s\S]*?am-wxt-scene-setting-label">目标人群[\s\S]*?data-scene-crowd-target-panel="1"/,
    '人群自定义推广手动出价缺少“目标人群”内联面板'
  );
  assert.match(
    branch,
    /if \(crowdBidMode === 'manual'\) \{[\s\S]*?data-scene-crowd-target-batch-apply="1"[\s\S]*?data-scene-crowd-target-open-popup="1"/,
    '人群自定义推广手动出价“目标人群”面板缺少批量应用与人群编辑入口'
  );
  assert.match(
    branch,
    /if \(crowdBidMode === 'manual'\) \{[\s\S]*?data-scene-crowd-target-json="campaign"[\s\S]*?data-scene-crowd-target-json="adgroup"/,
    '人群自定义推广手动出价“目标人群”面板未绑定 campaign\/adgroup 人群字段'
  );
  assert.match(
    branch,
    /const crowdRoiLevelFieldLabel = '设置7日投产比';[\s\S]*?if \(crowdBidMode === 'smart'\) \{[\s\S]*?crowdBidTargetCode === 'display_roi'[\s\S]*?buildSceneOptionRow\(\s*crowdRoiLevelFieldLabel,/,
    '人群自定义推广智能出价缺少“设置7日投产比”设置块'
  );
  assert.match(
    branch,
    /if \(crowdBidMode === 'smart'\) \{[\s\S]*?crowdBidTargetCode === 'display_pay'[\s\S]*?设置平均成交成本/,
    '人群自定义推广智能出价缺少“设置平均成交成本（控成本投放）”设置块'
  );
  assert.match(
    branch,
    /if \(crowdBidMode === 'smart'\) \{[\s\S]*?crowdBidTargetCode === 'display_cart'[\s\S]*?设置平均收藏加购成本/,
    '人群自定义推广智能出价缺少“设置平均收藏加购成本（控成本投放）”设置块'
  );
  assert.match(
    branch,
    /am-wxt-scene-setting-label">过滤人群[\s\S]*?trigger:\s*'crowdFilter'/,
    '人群自定义推广缺少“过滤人群-设置过滤人群”弹窗触发器'
  );
  assert.match(
    branch,
    /am-wxt-scene-setting-label">优质计划防停投[\s\S]*?trigger:\s*'budgetGuard'/,
    '人群自定义推广缺少“优质计划防停投-修改”弹窗触发器'
  );
  assert.match(
    branch,
    /trigger:\s*'budgetGuard'[\s\S]*?buttonLabel:\s*'修改'/,
    '优质计划防停投弹窗按钮文案未对齐为“修改”'
  );
  assert.match(
    branch,
    /label:\s*'资源位溢价'[\s\S]*?trigger:\s*'adzonePremium'/,
    '人群自定义推广缺少“资源位溢价”弹窗触发器'
  );
  assert.match(
    branch,
    /label:\s*'资源位溢价'[\s\S]*?title:\s*'资源位溢价'/,
    '人群自定义推广“资源位溢价”弹窗标题未对齐'
  );
  assert.match(
    branch,
    /label:\s*'投放地域\/投放时间'[\s\S]*?trigger:\s*'launchSetting'/,
    '人群自定义推广缺少“投放地域/投放时间”弹窗触发器'
  );
  assert.match(
    branch,
    /label:\s*'投放地域\/投放时间'[\s\S]*?title:\s*'投放地域\/投放时间'/,
    '人群自定义推广“投放地域/投放时间”弹窗标题未对齐'
  );
  assert.doesNotMatch(
    branch,
    /label:\s*'投放资源位\/投放地域\/分时折扣'/,
    '人群自定义推广仍渲染旧合并字段“投放资源位/投放地域/分时折扣”'
  );

  for (const fieldKey of [
    'campaign.itemIdList',
    'campaign.itemSelectedMode',
    'campaign.adzoneList',
    'campaign.launchPeriodList',
    'campaign.launchAreaStrList',
    'campaign.crowdList',
    'adgroup.rightList',
    'campaign.crowdFilterConfig',
    'campaign.budgetGuardSwitch',
    'campaign.budgetGuardConfig'
  ]) {
    assert.match(
      branch,
      new RegExp(`const\\s+\\w+\\s*=\\s*'${escapeRegExp(fieldKey)}'`),
      `人群自定义推广缺少弹窗字段常量: ${fieldKey}`
    );
  }
});

test('人群推广自定义推广弹窗触发器路由到独立资源位与地域时间弹窗', () => {
  const renderBlock = getRenderSceneDynamicConfigBlock();
  assert.match(
    renderBlock,
    /const openCrowdItemSettingPopup = async \(\) => \{/,
    '缺少“添加商品”独立弹窗函数 openCrowdItemSettingPopup'
  );
  assert.match(
    renderBlock,
    /const openAdzonePremiumSettingPopup = async \(\) => \{/,
    '缺少“资源位溢价”独立弹窗函数 openAdzonePremiumSettingPopup'
  );
  assert.match(
    renderBlock,
    /const openAdzonePremiumSettingPopup = async \(\) => \{[\s\S]*?批量修改为[\s\S]*?data-scene-popup-adzone-discount-batch-input="1"[\s\S]*?建议溢价/,
    '资源位溢价弹窗未复刻原生“批量溢价/建议溢价”结构'
  );
  assert.match(
    renderBlock,
    /const openAdzonePremiumSettingPopup = async \(\) => \{[\s\S]*?needNativeAdzoneRefresh[\s\S]*?isAdzoneListPlaceholderForSync\(adzoneList\)[\s\S]*?isDisplayBizCode && !isDisplayAdzoneList\(adzoneList\)[\s\S]*?resolveNativeAdzoneListFromVframes\([\s\S]*?force:\s*isAdzoneListPlaceholderForSync\(adzoneList\) \|\| \(isDisplayBizCode && !isDisplayAdzoneList\(adzoneList\)\)/,
    '资源位溢价弹窗未在占位资源位时强制回源原生资源位'
  );
  assert.match(
    renderBlock,
    /const openAdzonePremiumSettingPopup = async \(\) => \{[\s\S]*?loadNativeAdvancedDefaultsSnapshot\(\)[\s\S]*?nativeDefaults\.adzoneList/,
    '资源位溢价弹窗未兜底复用原生高级设置资源位数据'
  );
  assert.match(
    renderBlock,
    /const openAdzonePremiumSettingPopup = async \(\) => \{[\s\S]*?if \(isDisplayBizCode\) \{[\s\S]*?淘系信息流[\s\S]*?首页猜你喜欢[\s\S]*?全屏微详情[\s\S]*?购中购后猜你喜欢[\s\S]*?信息流人群追投/,
    '资源位溢价弹窗缺少 onebpDisplay 场景资源位兜底列表'
  );
  assert.match(
    renderBlock,
    /const openAdzonePremiumSettingPopup = async \(\) => \{[\s\S]*?const parentCodeSet = new Set\([\s\S]*?switchHint = \/追投\|开关\|switch\|开\\\/关\/i\.test\(text\)[\s\S]*?const rowType = maybeGroup \? 'group' : \(switchOnly \? 'switch' : 'premium'\);/,
    '资源位溢价弹窗未按原生父子层级与追投语义识别分组/开关行'
  );
  assert.match(
    renderBlock,
    /const openAdzonePremiumSettingPopup = async \(\) => \{[\s\S]*?class="am-wxt-site-switch \$\{row\.enabled \? 'is-on' : 'is-off'\}"/,
    '资源位溢价弹窗未渲染统一开关样式'
  );
  assert.doesNotMatch(
    renderBlock,
    /资源位开关/,
    '资源位溢价弹窗不应展示“资源位开关”文案'
  );
  assert.match(
    renderBlock,
    /if \(row\.rowType === 'group'\) \{[\s\S]*?class="am-wxt-site-switch \$\{row\.enabled \? 'is-on' : 'is-off'\}"[\s\S]*?data-scene-popup-adzone-row-toggle="\$\{idx\}"/,
    '资源位溢价分组行（如淘系信息流）未提供统一开关样式'
  );
  assert.match(
    renderBlock,
    /const rowType = String\(currentRows\[index\]\?\.rowType \|\| ''\)\.trim\(\);[\s\S]*?if \(rowType !== 'switch' && rowType !== 'group'\) return;/,
    '资源位溢价开关点击逻辑未覆盖分组行'
  );
  assert.match(
    renderBlock,
    /if \(rowType === 'group'\) \{[\s\S]*?setAdzoneStatus\(raw,\s*row\?\.enabled !== false\);/,
    '资源位溢价保存逻辑未回写分组行开关状态'
  );
  assert.match(
    renderBlock,
    /const openCrowdLaunchSettingPopup = async \(\) => \{/,
    '缺少“投放地域\/投放时间”独立弹窗函数 openCrowdLaunchSettingPopup'
  );
  assert.match(
    renderBlock,
    /const openCrowdLaunchSettingPopup = async \(\) => \{[\s\S]*?openKeywordAdvancedSettingPopup\('launchArea'\)/,
    '投放地域/投放时间弹窗未复用关键词高级设置板块'
  );
  assert.match(
    renderBlock,
    /resolvePopupControlByTriggers\('campaign\.adzoneList',\s*\[[\s\S]*?'adzonePremium'[\s\S]*?'launchSetting'[\s\S]*?\]\)/,
    '关键词高级设置弹窗未兼容人群场景的 adzonePremium/launchSetting 控件'
  );
  assert.match(
    renderBlock,
    /else if \(trigger === 'adzonePremium'\) \{[\s\S]*?openAdzonePremiumSettingPopup\(\)[\s\S]*?result\.isDefaultMode[\s\S]*?dispatchSceneControlUpdate\(mainControl,\s*nextMode\);/,
    '未将 adzonePremium 触发器路由到独立资源位弹窗并回写主控件'
  );
  assert.match(
    renderBlock,
    /else if \(trigger === 'launchSetting'\) \{[\s\S]*?openCrowdLaunchSettingPopup\(\)[\s\S]*?dispatchSceneControlUpdate\(mainControl,\s*areaDefault && periodAllDay \? '默认投放' : '自定义设置'\);/,
    '未将 launchSetting 触发器路由到地域时间弹窗并回写主控件'
  );
  assert.match(
    renderBlock,
    /else if \(trigger === 'itemSelect'\) \{[\s\S]*?openCrowdItemSettingPopup\(\)[\s\S]*?dispatchSceneControlUpdate\(itemIdListControl,\s*result\.itemIdListRaw \|\| '\[\]'\);/,
    '未将 itemSelect 触发器路由到“添加商品”弹窗并回写商品ID列表'
  );
});

test('场景选项按钮携带字段键并在人群自定义出价字段变更时强制重渲染', () => {
  const renderBlock = getRenderSceneDynamicConfigBlock();
  assert.match(
    renderBlock,
    /data-scene-option-field="\$\{Utils\.escapeHtml\(fieldKey\)\}"/,
    '场景分段选项缺少 data-scene-option-field 字段绑定'
  );
  assert.match(
    renderBlock,
    /const isCrowdCustomBidField = activeScene === '人群推广'[\s\S]*?activeCrowdGoal === '自定义推广'[\s\S]*?isSceneLabelMatch\(fieldKey, '出价方式'\)[\s\S]*?isSceneLabelMatch\(fieldKey, '出价目标'\)/,
    '人群自定义推广出价方式/出价目标变更未触发强制重渲染'
  );
  assert.match(
    renderBlock,
    /const shouldRerenderSceneConfig =[\s\S]*?isCrowdCustomBidField/,
    '人群自定义推广出价方式/出价目标变更未触发强制重渲染'
  );
  assert.match(
    renderBlock,
    /const sceneCrowdTargetPanels = wizardState\.els\.sceneDynamic\.querySelectorAll\('\[data-scene-crowd-target-panel="1"\]'\);/,
    '缺少“目标人群”内联面板绑定逻辑'
  );
  assert.match(
    renderBlock,
    /const crowdCampaignControl = resolveScenePopupControl\('campaign\.crowdList', 'crowd'\);[\s\S]*?const crowdAdgroupControl = resolveScenePopupControl\('adgroup\.rightList', 'crowd'\);/,
    '“目标人群”面板未复用人群弹窗字段 campaign.crowdList\/adgroup.rightList'
  );
  assert.match(
    renderBlock,
    /data-scene-crowd-target-open-popup="1"[\s\S]*?crowdPopupButton\.click\(\);/,
    '“目标人群”面板未联动“人群设置”弹窗入口'
  );
});

test('人群推广策略映射支持从营销目标识别自定义拉新方案', () => {
  const mappingBlock = getResolveSceneSettingOverridesBlock();
  assert.match(
    mappingBlock,
    /const strategyEntry = findSceneSettingEntry\(entries,\s*\[\/选择拉新方案\/,\s*\/投放策略\/,\s*\/方案选择\/,\s*\/方案\/,\s*\/营销目标\/\]\);/,
    '人群推广 strategy 映射未兜底读取“营销目标”'
  );
});

test('场景弹窗支持 ESC 关闭并在销毁时解绑事件', () => {
  const renderBlock = getRenderSceneDynamicConfigBlock();
  assert.match(
    renderBlock,
    /const handleEscClose = \(event\) => \{[\s\S]*?event\?\.key !== 'Escape'/,
    '缺少 ESC 关闭处理逻辑'
  );
  assert.match(
    renderBlock,
    /document\.addEventListener\('keydown', handleEscClose, true\);/,
    '弹窗打开时未绑定 ESC 事件'
  );
  assert.match(
    renderBlock,
    /document\.removeEventListener\('keydown', handleEscClose, true\);/,
    '弹窗关闭时未解绑 ESC 事件'
  );
  assert.match(
    renderBlock,
    /saveFirst\s*=\s*false[\s\S]*?defaultFocus\s*=\s*''/,
    '通用弹窗未提供按钮顺序/默认焦点配置能力'
  );
  assert.match(
    renderBlock,
    /dialogClassName:\s*'am-wxt-scene-popup-dialog-crowd'[\s\S]*?closeLabel:\s*'×'/,
    '人群弹窗头部关闭按钮未对齐为“×”'
  );
  assert.match(
    renderBlock,
    /dialogClassName:\s*'am-wxt-scene-popup-dialog-crowd'[\s\S]*?saveLabel:\s*'确定'/,
    '人群弹窗确认按钮文案未对齐为“确定”'
  );
  assert.match(
    renderBlock,
    /dialogClassName:\s*'am-wxt-scene-popup-dialog-crowd'[\s\S]*?data-scene-popup-crowd-add-new[\s\S]*?新增人群/,
    '人群设置弹窗缺少“新增人群”入口'
  );
  assert.match(
    renderBlock,
    /data-scene-popup-crowd-native-tab="compete_new"[\s\S]*?竞争航线[\s\S]*?data-scene-popup-crowd-native-tab="shopAndItem"[\s\S]*?本店核心人群[\s\S]*?data-scene-popup-crowd-native-tab="dmpRecommends"[\s\S]*?平台精选人群[\s\S]*?data-scene-popup-crowd-native-tab="keywordAndDmp"[\s\S]*?用户画像人群/,
    '新增人群弹窗未复刻原生一级人群分类导航'
  );
  assert.match(
    renderBlock,
    /data-scene-popup-crowd-native-subtab="item"[\s\S]*?竞争商品[\s\S]*?data-scene-popup-crowd-native-subtab="shop"[\s\S]*?竞争店铺/,
    '新增人群弹窗未复刻原生“竞争商品/竞争店铺”二级切换'
  );
  assert.match(
    renderBlock,
    /data-scene-popup-crowd-native-selected-count="1"[\s\S]*?已选人群/,
    '新增人群弹窗缺少原生“已选人群”计数区'
  );
  assert.match(
    renderBlock,
    /data-scene-popup-crowd-native-clear="1"[\s\S]*?全部移除/,
    '新增人群弹窗缺少原生“全部移除”入口'
  );
  assert.match(
    renderBlock,
    /dialogClassName:\s*'am-wxt-scene-popup-dialog-crowd'[\s\S]*?fetchRecommendCrowdListByCrowdSuggest\([\s\S]*?labelIdList:\s*CROWD_RECOMMEND_SEED_LABEL_IDS/,
    '人群弹窗未使用 seed 标签请求系统推荐人群'
  );
  assert.match(
    renderBlock,
    /dialogClassName:\s*'am-wxt-scene-popup-dialog-crowd'[\s\S]*?fetchRecommendCrowdList\([\s\S]*?materialIdList/,
    '人群弹窗未在打开时加载系统推荐人群'
  );
  assert.match(
    renderBlock,
    /title:\s*'设置过滤人群'[\s\S]*?saveFirst:\s*true[\s\S]*?defaultFocus:\s*'cancel'/,
    '过滤人群弹窗未对齐“确定优先+默认聚焦取消”'
  );
  assert.match(
    renderBlock,
    /title:\s*'设置过滤人群'[\s\S]*?am-wxt-scene-filter-option-check[\s\S]*?type="checkbox"/,
    '过滤人群弹窗选项未对齐为复选框语义'
  );
  assert.match(
    renderBlock,
    /title:\s*'优质计划防停投'[\s\S]*?saveFirst:\s*true[\s\S]*?defaultFocus:\s*'cancel'/,
    '优质计划防停投弹窗未对齐“确定优先+默认聚焦取消”'
  );
  assert.match(
    renderBlock,
    /title:\s*'优质计划防停投'[\s\S]*?data-scene-popup-budget-guard-switch-text="1"[\s\S]*?restoreInput\.addEventListener\('change', syncRestoreText\)/,
    '优质计划防停投未对齐开关状态文案联动'
  );
});

test('加载推荐人群优先命中 crowd 推荐接口并保留 label 接口兜底', () => {
  const block = getLoadRecommendedCrowdsBlock();
  assert.match(
    block,
    /const crowdSuggestList = await fetchRecommendCrowdListByCrowdSuggest\(/,
    '加载推荐人群未优先调用 crowd 推荐接口'
  );
  assert.match(
    block,
    /const crowdList = crowdSuggestList\.length[\s\S]*?: await fetchRecommendCrowdList\(/,
    '加载推荐人群缺少 label 接口兜底逻辑'
  );
  assert.match(
    block,
    /fetchRecommendCrowdListByCrowdSuggest\([\s\S]*?labelIdList:\s*CROWD_RECOMMEND_SEED_LABEL_IDS/,
    '加载推荐人群未使用 seed 标签请求系统推荐人群'
  );
  assert.match(
    block,
    /const materialList =[\s\S]*?const materialIdList = materialList\.map\(item => item\.materialId\);/,
    '加载推荐人群未对齐 materialList -> materialIdList 的映射'
  );
});

test('向导打开时会从原生 allCrowdList 同步默认人群', () => {
  assert.match(
    source,
    /const resolveNativeCrowdListFromVframes = async \(/,
    '缺少原生 vframe 人群同步函数 resolveNativeCrowdListFromVframes'
  );
  assert.match(
    source,
    /stateData\?\.allCrowdList/,
    '原生人群同步未读取 vframe updater 的 allCrowdList'
  );
  assert.match(
    source,
    /const syncNativeCrowdDefaultsForScene = async \(\{[\s\S]*?sceneName = ''[\s\S]*?runtime = null/,
    '缺少共享原生人群默认值同步函数 syncNativeCrowdDefaultsForScene'
  );
  assert.match(
    source,
    /const ensureSceneDefaultItemForScene = async \(\{[\s\S]*?sceneName = ''[\s\S]*?runtime = null/,
    '缺少人群场景默认商品兜底函数 ensureSceneDefaultItemForScene'
  );
  assert.match(
    source,
    /await syncNativeCrowdDefaultsForScene\(\{[\s\S]*?runtime:\s*runtimeForInit[\s\S]*?\}\);/,
    'openWizard 初始化未触发原生人群同步'
  );
  assert.match(
    source,
    /await ensureSceneDefaultItemForScene\(\{[\s\S]*?sceneName:\s*wizardState\?\.\s*draft\?\.\s*sceneName[\s\S]*?runtime:\s*runtimeForInit[\s\S]*?\}\);/,
    'openWizard 初始化未触发人群默认商品注入'
  );
  assert.match(
    source,
    /if \(nextScene === '人群推广'\) \{[\s\S]*?await ensureSceneDefaultItemForScene\(\{[\s\S]*?sceneName:\s*nextScene[\s\S]*?\}\);[\s\S]*?await syncNativeCrowdDefaultsForScene\(/,
    '切换到人群推广时未先注入默认商品再同步原生人群'
  );
});

test('人群弹窗候选不应注入“系统推荐人群N”占位名称', () => {
  assert.doesNotMatch(
    source,
    /labelName:\s*`系统推荐人群\$\{idx \+ 1\}`/,
    '人群弹窗仍注入占位 labelName，导致默认人群名称错误'
  );
  assert.doesNotMatch(
    source,
    /crowdName:\s*`系统推荐人群\$\{idx \+ 1\}`/,
    '人群弹窗仍注入占位 crowdName，导致默认人群名称错误'
  );
});

test('人群推广“拉新渗透”映射优先命中 display_shentou，避免被通用渗透分支吞掉', () => {
  const start = source.indexOf('const mapSceneBidTargetValue = (text = \'\') => {');
  const end = source.indexOf('const mapSiteMultiTargetOptimizeTargetValue = (text = \'\') => {', start);
  assert.ok(start > -1 && end > start, '无法定位 mapSceneBidTargetValue 代码块');
  const block = source.slice(start, end);

  const crowdRule = "if (/拉新|拉新人群|拉新渗透|引力魔方|人群推广|display[_\\s-]*shentou/i.test(value)) return 'display_shentou';";
  const genericRule = "if (/渗透|趋势|趋势明星/.test(value)) return 'market_penetration';";
  const crowdIdx = block.indexOf(crowdRule);
  const genericIdx = block.indexOf(genericRule);

  assert.ok(crowdIdx > -1, '缺少“拉新渗透 -> display_shentou”映射规则');
  assert.ok(genericIdx > -1, '缺少通用“渗透 -> market_penetration”映射规则');
  assert.ok(
    crowdIdx < genericIdx,
    '“拉新渗透”映射顺序错误：应先于通用“渗透”规则，避免提交丢失 bidTargetV2/optimizeTarget'
  );
});

test('人群推广自定义推广提交对齐原生 campaign 契约', () => {
  const start = source.indexOf("if (sceneCapabilities.sceneName === '人群推广') {");
  const end = source.indexOf("if (sceneCapabilities.sceneName === '货品全站推广') {", start);
  assert.ok(start > -1 && end > start, '无法定位人群推广 campaign 组装分支');
  const block = source.slice(start, end);

  assert.match(
    block,
    /const crowdGoalLabel = normalizeGoalLabel\([\s\S]*?const isCrowdCustomGoal = crowdGoalLabel === '自定义推广';/,
    '人群推广分支未识别“自定义推广”营销目标'
  );
  assert.match(
    block,
    /if \(isCrowdCustomGoal\) \{[\s\S]*?merged\.campaign\.promotionScene = 'promotion_scene_item';[\s\S]*?merged\.campaign\.promotionStrategy = 'zidingyi';/,
    '人群自定义推广未对齐原生 promotionScene/promotionStrategy'
  );
  assert.match(
    block,
    /if \(isCrowdCustomGoal\) \{[\s\S]*?const crowdCustomBidMode = normalizeBidMode\([\s\S]*?const normalizedCustomTarget = crowdCustomBidMode === 'smart'[\s\S]*?normalizeCrowdCustomSmartBidTargetCode\([\s\S]*?fallback:\s*'display_roi'[\s\S]*?: normalizeCrowdCustomBidTargetCode\([\s\S]*?fallback:\s*'display_pay'[\s\S]*?merged\.campaign\.bidTargetV2 = normalizedCustomTarget;[\s\S]*?merged\.campaign\.optimizeTarget = normalizedCustomTarget;/,
    '人群自定义推广未按出价模式写入 bidTargetV2/optimizeTarget'
  );
  assert.match(
    block,
    /if \(isCrowdCustomGoal\) \{[\s\S]*?const customDayBudget = toNumber\([\s\S]*?merged\.campaign\.dmcType = 'normal';[\s\S]*?merged\.campaign\.dayBudget = customDayBudget;[\s\S]*?delete merged\.campaign\.dayAverageBudget;/,
    '人群自定义推广未将预算类型对齐为每日预算'
  );
  assert.match(
    block,
    /if \(isCrowdCustomGoal\) \{[\s\S]*?if \(hasItem\) \{[\s\S]*?merged\.adgroup\.material = pickMaterialFields\(/,
    '人群自定义推广未回填 adgroup.material，可能导致站内商品主体为空'
  );
});
