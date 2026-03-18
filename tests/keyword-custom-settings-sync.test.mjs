import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getResolveSceneSettingOverridesBlock() {
  const start = source.indexOf('const resolveSceneSettingOverrides = ({ sceneName = \'\', sceneSettings = {}, runtime = {} }) => {');
  const end = source.indexOf('const buildFallbackSolutionTemplate = (runtime, sceneName = \'\') => {', start);
  assert.ok(start > -1 && end > start, '无法定位 resolveSceneSettingOverrides 代码块');
  return source.slice(start, end);
}

function getRenderSceneDynamicConfigBlock() {
  const start = source.indexOf('const renderSceneDynamicConfig = () => {');
  const end = source.indexOf('const collectManualKeywordRowsFromPanel = (panel) => (', start);
  assert.ok(start > -1 && end > start, '无法定位 renderSceneDynamicConfig 代码块');
  return source.slice(start, end);
}

function getManualFlowToggleBlock() {
  const start = source.indexOf('if (target.matches(\'button[data-manual-keyword-flow-toggle]\')) {');
  const end = source.indexOf('if (target.matches(\'button[data-manual-keyword-batch-bid]\')) {', start);
  assert.ok(start > -1 && end > start, '无法定位流量智选切换分支');
  return source.slice(start, end);
}

function getManualCollapseToggleBlock() {
  const start = source.indexOf('if (target.matches(\'button[data-manual-keyword-collapse-toggle]\')) {');
  const end = source.indexOf('if (target.matches(\'button[data-manual-keyword-flow-toggle]\')) {', start);
  assert.ok(start > -1 && end > start, '无法定位手动关键词展开/收起分支');
  return source.slice(start, end);
}

function getKeywordCustomCampaignAllowListBlock() {
  const start = source.indexOf('const KEYWORD_CUSTOM_CAMPAIGN_ALLOW_KEYS = new Set([');
  const end = source.indexOf(']);', start);
  assert.ok(start > -1 && end > start, '无法定位 KEYWORD_CUSTOM_CAMPAIGN_ALLOW_KEYS');
  return source.slice(start, end);
}

function getPruneKeywordCampaignForCustomSceneBlock() {
  const start = source.indexOf('const pruneKeywordCampaignForCustomScene = (campaign = {}, options = {}) => {');
  const end = source.indexOf('const pruneKeywordAdgroupForCustomScene = (adgroup = {}, item = null, options = {}) => {', start);
  assert.ok(start > -1 && end > start, '无法定位 pruneKeywordCampaignForCustomScene 代码块');
  return source.slice(start, end);
}

function getResolveStrategyMarketingGoalBlock() {
  const start = source.indexOf('const resolveStrategyMarketingGoal = (strategy = {}, sceneSettings = {}, sceneName = \'\') => {');
  const end = source.indexOf('const getStrategyMainLabel = (strategy = {}) => {', start);
  assert.ok(start > -1 && end > start, '无法定位 resolveStrategyMarketingGoal 代码块');
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

function getKeywordCustomBidModeBranchesFromRenderBlock() {
  const renderBlock = getRenderSceneDynamicConfigBlock();
  const customStart = renderBlock.indexOf("if (activeKeywordGoal === '自定义推广') {");
  assert.ok(customStart > -1, '无法定位自定义推广场景渲染分支');
  const customBlock = extractBraceBlock(renderBlock, customStart, '自定义推广分支').body;
  const manualStart = customBlock.indexOf("if (keywordBidMode === 'manual') {");
  assert.ok(manualStart > -1, '自定义推广缺少手动出价分支');
  const manualBlock = extractBraceBlock(customBlock, manualStart, '手动分支');
  const elseStart = customBlock.indexOf('else {', manualBlock.end);
  assert.ok(elseStart > -1, '自定义推广缺少智能出价分支');
  const smartBlock = extractBraceBlock(customBlock, elseStart, '智能分支');
  return {
    manualBranch: manualBlock.body,
    smartBranch: smartBlock.body
  };
}

test('自定义推广静态设置已隐藏选品方式并保留冷启加速提交流程', () => {
  const renderBlock = getRenderSceneDynamicConfigBlock();
  assert.doesNotMatch(
    renderBlock,
    /label:\s*'选品方式'/,
    '编辑计划仍展示“选品方式”按钮行'
  );
  assert.match(
    renderBlock,
    /label:\s*'冷启加速'/,
    '编辑计划缺少“冷启加速”按钮行'
  );

  const mappingBlock = getResolveSceneSettingOverridesBlock();
  assert.match(
    mappingBlock,
    /campaignColdStartVO/,
    '提交流程未放行 campaignColdStartVO 字段'
  );
  assert.match(
    mappingBlock,
    /coldStartEntry[\s\S]*campaignColdStartVO\.coldStartStatus/,
    '冷启加速未映射到 campaignColdStartVO.coldStartStatus'
  );

  const allowListBlock = getKeywordCustomCampaignAllowListBlock();
  for (const key of ['campaignColdStartVO', 'needTargetCrowd', 'aiXiaowanCrowdListSwitch', 'creativeSetMode', 'enableRuleAuto', 'ruleCommand']) {
    assert.match(
      allowListBlock,
      new RegExp(`'${key}'`),
      `关键词自定义场景提交白名单缺少字段: ${key}`
    );
  }
});

test('流量智选开关会同步到策略 useWordPackage', () => {
  const flowBlock = getManualFlowToggleBlock();
  assert.match(
    flowBlock,
    /useWordPackage\s*=\s*nextOn/,
    '流量智选切换后未写回 useWordPackage'
  );
  assert.match(
    flowBlock,
    /data-manual-keyword-flow-hidden/,
    '流量智选切换后未同步隐藏字段'
  );
});

test('手动关键词面板默认收起，并支持展开状态同步', () => {
  const renderBlock = getRenderSceneDynamicConfigBlock();
  assert.match(
    renderBlock,
    /const manualKeywordPanelCollapsed = wizardState\.manualKeywordPanelCollapsed !== false;/,
    '手动关键词面板默认收起状态未定义'
  );
  assert.match(
    renderBlock,
    /data-manual-keyword-collapse-toggle="1"/,
    '手动关键词面板缺少展开\/收起按钮'
  );
  assert.match(
    renderBlock,
    /manualKeywordPanelCollapsed \? '展开' : '收起'/,
    '手动关键词面板未根据状态显示展开\/收起文案'
  );

  const collapseBlock = getManualCollapseToggleBlock();
  assert.match(
    collapseBlock,
    /wizardState\.manualKeywordPanelCollapsed = nextCollapsed;/,
    '手动关键词展开\/收起后未同步到草稿状态'
  );
  assert.match(
    collapseBlock,
    /panel\.classList\.toggle\('is-collapsed', nextCollapsed\);/,
    '手动关键词展开\/收起后未更新面板折叠样式'
  );
});

test('自定义推广手动出价启用人群弹窗并保留提交流程映射', () => {
  const { manualBranch } = getKeywordCustomBidModeBranchesFromRenderBlock();
  assert.match(
    manualBranch,
    /label:\s*'人群设置'[\s\S]*trigger:\s*'crowd'/,
    '编辑计划手动出价未启用“人群设置”弹窗'
  );
  assert.match(
    manualBranch,
    /label:\s*'人群设置'[\s\S]*defaultValue:\s*hasCrowdData\s*\?\s*'添加精选人群'\s*:\s*'关闭'/,
    '编辑计划手动出价“人群设置”默认值未按已选人群数据回填'
  );
  assert.match(
    manualBranch,
    /label:\s*'人群设置'[\s\S]*title:\s*'添加精选人群'/,
    '编辑计划手动出价“人群设置”弹窗标题未对齐原生'
  );
  assert.doesNotMatch(
    manualBranch,
    /label:\s*'人群优化目标'/,
    '编辑计划手动出价仍展示“人群优化目标”'
  );

  const mappingBlock = getResolveSceneSettingOverridesBlock();
  assert.match(
    mappingBlock,
    /设置优先投放客户[\s\S]*aiXiaowanCrowdListSwitch',\s*'1'/,
    '“设置优先投放客户”未映射到 aiXiaowanCrowdListSwitch=1'
  );
  assert.match(
    mappingBlock,
    /crowdCloseHint[\s\S]*aiXiaowanCrowdListSwitch',\s*'0'/,
    '“关闭”未映射到 aiXiaowanCrowdListSwitch=0'
  );
  assert.match(
    mappingBlock,
    /const preferManualCrowdMode = normalizedSceneName === '人群推广'[\s\S]*\|\| normalizedSceneName === '关键词推广';/,
    '关键词推广“添加精选人群”未纳入手动人群模式判定'
  );
  assert.match(
    mappingBlock,
    /isSelectedCrowd[\s\S]*aiXiaowanCrowdListSwitch',\s*preferManualCrowdMode \? '0' : '1'/,
    '“添加精选人群”未按手动模式映射 aiXiaowanCrowdListSwitch'
  );
  assert.match(
    mappingBlock,
    /const crowdTargetEntry = findSceneSettingEntry\(entries,\s*\[\/人群优化目标\/,\s*\/客户口径设置\/,\s*\/人群价值设置\//,
    '缺少人群优化目标独立映射入口'
  );
});

test('自定义推广智能出价保持独立人群设置，不复用手动人群弹窗', () => {
  const { smartBranch } = getKeywordCustomBidModeBranchesFromRenderBlock();
  assert.match(
    smartBranch,
    /buildKeywordSmartCrowdPriorityRow\(/,
    '智能出价人群设置未切换为原生同构行渲染'
  );
  assert.match(
    smartBranch,
    /keywordSmartCrowdSettingValue\s*=\s*isPriorityCrowdEnabled\s*\?\s*'设置优先投放客户'\s*:\s*'关闭'/,
    '智能出价人群设置默认值未按优先投放开关回填'
  );
  assert.match(
    smartBranch,
    /description:\s*'支持对特定客户设置更高权重，进行优先获取。'/,
    '智能出价人群设置缺少原生说明文案'
  );
  assert.match(
    smartBranch,
    /detailUrl:\s*'https:\/\/alidocs\.dingtalk\.com\/i\/nodes\/Y1OQX0akWmzdBowLFk0vRgKlVGlDd3mE'/,
    '智能出价人群设置缺少原生“了解详情”链接'
  );
  assert.match(
    smartBranch,
    /buildKeywordSmartCrowdTargetPanelRow\(/,
    '智能出价缺少人群优化目标面板'
  );
  assert.match(
    smartBranch,
    /targetFieldKey:\s*keywordCrowdTargetFieldKey[\s\S]*clientFieldKey:\s*keywordCrowdClientFieldKey[\s\S]*valueFieldKey:\s*keywordCrowdValueFieldKey/,
    '人群优化目标面板未绑定人群优化目标/客户口径/人群价值字段'
  );
  assert.doesNotMatch(
    smartBranch,
    /label:\s*'人群设置'[\s\S]*?trigger:\s*'crowd'/,
    '智能出价人群设置错误复用手动出价“人群设置”弹窗'
  );

  const renderBlock = getRenderSceneDynamicConfigBlock();
  assert.match(
    renderBlock,
    /const sceneCrowdPriorityToggles = wizardState\.els\.sceneDynamic\.querySelectorAll\('\[data-scene-crowd-priority-toggle\]'\);/,
    '智能出价人群设置缺少 checkbox 事件绑定'
  );
  assert.match(
    renderBlock,
    /hiddenControl\.value = toggle\.checked \? onValue : offValue;/,
    '智能出价人群设置 checkbox 切换后未同步隐藏值'
  );
  assert.match(
    renderBlock,
    /const keywordSmartCrowdPanels = wizardState\.els\.sceneDynamic\.querySelectorAll\('\[data-keyword-smart-crowd-panel=\"1\"\]'\);/,
    '人群优化目标面板缺少事件绑定'
  );
  assert.match(
    renderBlock,
    /campaignControl\.value = JSON\.stringify\(nextCampaignList\);/,
    '人群优化目标面板未回写 campaign.crowdList'
  );
});

test('编辑计划会优先根据关键词自定义场景提示回填营销目标，避免误判丢失人群设置', () => {
  const block = getResolveStrategyMarketingGoalBlock();
  assert.match(
    block,
    /const currentSceneSettings = normalizeSceneSettingBucketValues\(sceneSettings,\s*currentScene\);/,
    '未先按当前场景归一 sceneSettings'
  );
  assert.match(
    block,
    /const keywordSceneHint = normalizeSceneSettingValue\([\s\S]*?campaign\.promotionScene[\s\S]*?\);/,
    '缺少 campaign.promotionScene 场景提示读取'
  );
  assert.match(
    block,
    /const keywordItemModeHint = normalizeSceneSettingValue\([\s\S]*?campaign\.itemSelectedMode[\s\S]*?\);/,
    '缺少 campaign.itemSelectedMode 场景提示读取'
  );
  assert.match(
    block,
    /promotion_scene_search_user_define[\s\S]*?return '自定义推广';/,
    '未在关键词自定义场景提示命中时优先回填“自定义推广”'
  );
});

test('关键词自定义推广提交流程会按预算类型裁剪字段并对齐每日预算契约', () => {
  const block = getPruneKeywordCampaignForCustomSceneBlock();
  assert.match(
    block,
    /const forceKeywordDailyBudget = !isManual[\s\S]*keywordMarketingGoal === '自定义推广'[\s\S]*!keywordRoiContract;/,
    '缺少关键词自定义推广非ROI场景的每日预算契约兜底'
  );
  assert.match(
    block,
    /if \(forceKeywordDailyBudget\) normalizedDmcType = 'normal';/,
    '关键词自定义推广非ROI场景未强制对齐 normal 预算类型'
  );
  assert.match(
    block,
    /if \(keywordRoiContract\) normalizedDmcType = 'day_average';/,
    '关键词ROI场景未保持 day_average 预算类型'
  );
  assert.match(
    block,
    /BUDGET_FIELDS\.forEach\(field => \{\s*if \(field !== targetBudgetField\) delete out\[field\];\s*\}\);/,
    '关键词提交前未按目标预算字段裁剪互斥预算字段'
  );
  assert.match(
    source,
    /pruneKeywordCampaignForCustomScene\(merged\.campaign,\s*\{[\s\S]*request,\s*plan,\s*bidMode:/,
    '关键词提交净化未透传 plan，无法识别当前计划营销目标'
  );
});

test('关键词自定义推广提交流程会同步计划MCB出价模型字段', () => {
  const block = getPruneKeywordCampaignForCustomSceneBlock();
  assert.match(
    block,
    /'planMcbBidModel'/,
    '未识别 planMcbBidModel 字段来源'
  );
  assert.match(
    block,
    /out\.mcbBidModel = 'coll_cart';\s*out\.planMcbBidModel = 'coll_cart';/,
    '收藏加购目标未同步写入 planMcbBidModel'
  );
  assert.match(
    block,
    /out\.mcbBidModel = resolvedMcbBidModel;\s*out\.planMcbBidModel = resolvedMcbBidModel;/,
    '智能出价目标未同步写入 planMcbBidModel'
  );
  assert.match(
    block,
    /else if \(keywordClickContract\) \{[\s\S]*out\.bidTargetV2 = 'click';[\s\S]*delete out\.optimizeTarget;[\s\S]*out\.constraintType = 'click';/,
    '点击量目标未对齐原生 click\+constraint 合同'
  );
  assert.match(
    block,
    /else if \(keywordClickContract\) \{[\s\S]*delete out\.mcbBidModel;[\s\S]*delete out\.planMcbBidModel;/,
    '点击量目标未清理 mcb 字段，可能触发手动出价降级'
  );
});

test('关键词自定义推广收藏加购目标成本为空不兜底，填写时必须 >=5', () => {
  const block = getPruneKeywordCampaignForCustomSceneBlock();
  assert.match(
    block,
    /const keywordFavCartMinConstraintValue = 5;/,
    '收藏加购目标缺少最低成本阈值'
  );
  assert.match(
    block,
    /const hasFavCartConstraintValue = Number\.isFinite\(favCartConstraintSeed\);/,
    '收藏加购目标成本“填写判断”仍按 >0 处理，导致 0 被当成空值'
  );
  assert.match(
    block,
    /if \(hasFavCartConstraintValue && favCartConstraintSeed < keywordFavCartMinConstraintValue\) \{[\s\S]*throw new Error\('增加收藏加购量目标成本需填写 5-9999\.99 的数值'\);/,
    '收藏加购目标成本低于 5 时未本地阻断'
  );
  assert.match(
    block,
    /if \(favCartSingleCostEnabled && hasFavCartConstraintValue\) \{[\s\S]*out\.setSingleCostV2 = true;[\s\S]*out\.constraintValue = favCartConstraintSeed;[\s\S]*\} else \{[\s\S]*out\.setSingleCostV2 = false;[\s\S]*delete out\.constraintValue;/,
    '收藏加购目标未按“空值不传、非空才传”处理'
  );
  assert.doesNotMatch(
    block,
    /Math\.max\(keywordFavCartMinConstraintValue,\s*favCartConstraintSeed\)/,
    '收藏加购目标仍存在自动兜底逻辑'
  );
  assert.doesNotMatch(
    block,
    /const hasFavCartConstraintValue = Number\.isFinite\(favCartConstraintSeed\) && favCartConstraintSeed > 0;/,
    '收藏加购目标成本仍把 0 当成空值而不是非法值'
  );
});

test('关键词自定义推广增加点击量目标成本为空不兜底，且不强制 >=5', () => {
  const block = getPruneKeywordCampaignForCustomSceneBlock();
  assert.match(
    block,
    /const hasClickSingleCostValue = Number\.isFinite\(clickSingleCostSeed\) && clickSingleCostSeed > 0;/,
    '点击量目标成本未按正数判断“是否填写”'
  );
  assert.match(
    block,
    /if \(clickSingleCostEnabled && hasClickSingleCostValue\) \{[\s\S]*out\.setSingleCostV2 = true;[\s\S]*out\.constraintValue = clickSingleCostSeed;[\s\S]*\} else \{[\s\S]*out\.setSingleCostV2 = false;[\s\S]*delete out\.constraintValue;/,
    '点击量目标未按原生 click 合同写入 constraintValue'
  );
  assert.match(
    block,
    /delete out\.singleCostV2;/,
    '点击量目标未清理 singleCostV2，可能与原生契约冲突'
  );
  assert.match(
    block,
    /if \(!keywordFavCartContract && !keywordClickContract\) \{[\s\S]*delete out\.constraintType;[\s\S]*delete out\.constraintValue;/,
    '点击量目标 contract 字段被误删'
  );
  assert.match(
    block,
    /const clickSingleCostSeed = toNumber\([\s\S]*?NaN\);/,
    '点击量目标缺少单值成本数值解析'
  );
  assert.doesNotMatch(
    block,
    /keywordClickMinSingleCostValue/,
    '点击量目标仍残留 >=5 的阈值限制'
  );
  assert.doesNotMatch(
    block,
    /增加点击量目标成本需填写 5-9999\.99 的数值/,
    '点击量目标仍残留 5-9999.99 阈值报错'
  );
  assert.doesNotMatch(
    block,
    /Math\.max\(keywordClickMinSingleCostValue,\s*clickSingleCostSeed\)/,
    '点击量目标仍存在自动兜底逻辑'
  );
});

test('关键词批量构建阶段会收集本地校验失败并继续返回失败明细', () => {
  assert.match(
    source,
    /const prebuildFailures = \[\];/,
    '缺少构建前失败收集容器'
  );
  assert.match(
    source,
    /emitProgress\(options,\s*'build_solution_failed',\s*\{/,
    '构建失败未输出进度事件'
  );
  assert.match(
    source,
    /const failures = prebuildFailures\.slice\(\);/,
    '最终失败列表未合并本地校验失败'
  );
});

test('关键词自定义推广获取成交量会对齐原生 dir_conv 合同并清理冲突字段', () => {
  const block = getPruneKeywordCampaignForCustomSceneBlock();
  assert.match(
    block,
    /const keywordConvContract = keywordBidTargetCode === 'conv';/,
    '缺少 conv 合同判定'
  );
  assert.match(
    block,
    /if \(keywordConvContract\) \{[\s\S]*out\.constraintType = 'dir_conv';[\s\S]*out\.setSingleCostV2 = true;/,
    'conv 合同未映射为 constraintType=dir_conv 且开启 setSingleCostV2'
  );
  assert.match(
    block,
    /if \(keywordConvContract\) \{[\s\S]*delete out\.optimizeTarget;[\s\S]*delete out\.subOptimizeTarget;[\s\S]*delete out\.singleCostV2;/,
    'conv 合同未清理 optimizeTarget/subOptimizeTarget/singleCostV2'
  );
  assert.match(
    block,
    /if \(keywordConvContract\) \{[\s\S]*delete out\.mcbBidModel;[\s\S]*delete out\.planMcbBidModel;/,
    'conv 合同未清理 mcb 字段'
  );
});

test('编辑计划会从按场景嵌套的 sceneSettingValues 中回填关键词自定义目标', () => {
  assert.match(
    source,
    /const resolveSceneSettingBucketSource = \(rawValues = \{\}, sceneName = ''\) => \{/,
    '缺少 sceneSettingValues 场景桶解析 helper'
  );
  assert.match(
    source,
    /if \(normalizedSceneName && isPlainObject\(rawValues\[normalizedSceneName\]\)\) \{\s*return rawValues\[normalizedSceneName\];\s*\}/,
    '场景桶解析未优先命中当前场景'
  );
  assert.match(
    source,
    /const strategySceneSettingValues = normalizeSceneSettingBucketValues\(\s*strategy\.sceneSettingValues \|\| \{\},\s*strategyScene\s*\);/,
    'applyStrategyToDetailForm 未按策略场景读取 sceneSettingValues'
  );
  assert.match(
    source,
    /normalizeSceneSettingBucketValues\(strategy\.sceneSettingValues \|\| \{\}, strategySceneName\)/,
    'buildRequestFromWizard 未按策略场景读取 sceneSettingValues'
  );
});

test('场景配置中的计划名称位于营销目标下方', () => {
  const renderBlock = getRenderSceneDynamicConfigBlock();
  assert.match(
    renderBlock,
    /buildGoalSelectorRow\('营销目标'[\s\S]*?staticRows\.push\(buildProxyInputRow\('计划名称'/,
    '计划名称未紧随营销目标渲染'
  );
});

test('场景配置隐藏关键词模式、默认关键词出价与推荐词目标数', () => {
  const renderBlock = getRenderSceneDynamicConfigBlock();
  assert.doesNotMatch(
    renderBlock,
    /staticRows\.push\(buildProxySelectRow\('关键词模式'/,
    '场景配置仍在展示“关键词模式”'
  );
  assert.doesNotMatch(
    renderBlock,
    /staticRows\.push\(buildProxyInputRow\('默认关键词出价'/,
    '场景配置仍在展示“默认关键词出价”'
  );
  assert.doesNotMatch(
    renderBlock,
    /staticRows\.push\(buildProxyInputRow\('推荐词目标数'/,
    '场景配置仍在展示“推荐词目标数”'
  );
});
