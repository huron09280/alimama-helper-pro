import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getKeywordCustomSceneBlock() {
  const start = source.indexOf("if (activeKeywordGoal === '自定义推广') {");
  const end = source.indexOf("if (sceneName === '货品全站推广') {", start);
  assert.ok(start > -1 && end > start, '无法定位关键词自定义推广场景配置代码块');
  return source.slice(start, end);
}

function getRenderSceneDynamicConfigBlock() {
  const start = source.indexOf('const renderSceneDynamicConfig = () => {');
  const end = source.indexOf('const collectManualKeywordRowsFromPanel = (panel) => (', start);
  assert.ok(start > -1 && end > start, '无法定位 renderSceneDynamicConfig 代码块');
  return source.slice(start, end);
}

function getResolveSceneSettingOverridesBlock() {
  const start = source.indexOf("const resolveSceneSettingOverrides = ({ sceneName = '', sceneSettings = {}, runtime = {} }) => {");
  const end = source.indexOf("const buildFallbackSolutionTemplate = (runtime, sceneName = '') => {", start);
  assert.ok(start > -1 && end > start, '无法定位 resolveSceneSettingOverrides 代码块');
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

function getKeywordCustomBidModeBranches() {
  const customBlock = getKeywordCustomSceneBlock();
  const manualMarker = "if (keywordBidMode === 'manual') {";
  const manualStart = customBlock.indexOf(manualMarker);
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

test('关键词自定义推广隐藏选品方式配置项', () => {
  const block = getKeywordCustomSceneBlock();
  assert.doesNotMatch(
    block,
    /label:\s*'选品方式'/,
    '自定义推广分支仍展示“选品方式”配置项'
  );
  assert.doesNotMatch(
    block,
    /options:\s*\[\s*'自定义选品'\s*,\s*'好货快投-大家电专享'\s*\]/,
    '自定义推广分支仍展示“选品方式”选项'
  );
});

test('关键词自定义推广只展示 AI 点睛开启态创意只读说明，不恢复创意设置分段按钮', () => {
  const block = getKeywordCustomSceneBlock();
  const renderBlock = getRenderSceneDynamicConfigBlock();
  assert.doesNotMatch(
    block,
    /label:\s*'创意设置'/,
    '关键词自定义推广仍在展示“创意设置”按钮组'
  );
  assert.match(
    renderBlock,
    /am-wxt-scene-setting-label">创意设置[\s\S]*当前解决方案下暂不支持设置创意，默认开启智能创意。/,
    'AI点睛开启态缺少原生只读创意设置说明'
  );
  assert.doesNotMatch(
    renderBlock,
    /data-scene-field="\$\{Utils\.escapeHtml\([^}]*创意设置/,
    '只读创意说明不应写入可提交的创意设置字段'
  );
});

test('关键词自定义推广提供 AI点睛独立开关并同步原生 aiMax 字段', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /const keywordAiMaxFieldLabel = 'AI点睛';/,
    '自定义推广缺少 AI点睛 独立字段声明'
  );
  assert.match(
    block,
    /buildKeywordAiMaxSwitchRow\(\{[\s\S]*fieldKey:\s*keywordAiMaxFieldKey[\s\S]*selectedValue:\s*keywordAiMaxValue/,
    '自定义推广缺少 AI点睛 开启/关闭开关'
  );
  assert.match(
    block,
    /借助AI点睛开“搜索外挂”，智能识别您表达的搜索流量诉求，精准触达目标客群，有效提升精准流量比例[\s\S]*N7dx2rn0JbxOaqnACQ5kRDGvWMGjLRb3[\s\S]*介绍文档/,
    'AI点睛开关行未对齐原生说明文案和介绍文档入口'
  );
  assert.match(
    block,
    /const keywordAiMaxSwitchField = 'campaign\.aiMaxSwitch';[\s\S]*const keywordAiMaxInfoField = 'campaign\.aiMaxInfo';/,
    'AI点睛开关未绑定 campaign.aiMaxSwitch / campaign.aiMaxInfo'
  );
  assert.match(
    block,
    /keywordAiMaxEnabled[\s\S]*wizardState\.els\.bidModeSelect\.value = 'smart';/,
    '开启 AI点睛 时未强制回到智能出价'
  );
  assert.match(
    block,
    /allowedValues:\s*keywordAiMaxEnabled \? \['smart'\] : \[\]/,
    '开启 AI点睛 时出价方式未限制为智能出价'
  );
  assert.match(
    block,
    /开启‘AI点睛’后仅支持智能出价。如需使用手动出价，可关闭该功能。/,
    'AI点睛开启时出价方式提示未对齐原生完整文案'
  );
  assert.match(
    block,
    /keywordAvgDealCostVisibleLabel = keywordAiMaxEnabled[\s\S]*设置平均直接净成交成本（非必要）[\s\S]*设置平均成交成本/,
    'AI点睛开启态获取成交量成本项可见文案未对齐原生'
  );
  assert.match(
    block,
    /buildInlineSceneInputControl\([\s\S]*'目标成本'[\s\S]*keywordAvgDealCostFieldKey[\s\S]*\{ unit: '元', hideLabel: keywordAiMaxEnabled \}/,
    'AI点睛开启态成本输入仍可能显示额外“目标成本”小标签'
  );
  assert.match(
    block,
    /buildKeywordAiMaxInsightPanelRow\(/,
    '开启 AI点睛 后缺少添加商品后的原生同构详情面板'
  );
  assert.match(
    block,
    /表达更多流量诉求/,
    'AI点睛详情面板缺少“表达更多流量诉求”入口'
  );
  assert.match(
    block,
    /KEYWORD_AI_MAX_TEMPLATE_LIST[\s\S]*提升商品质量分[\s\S]*核心流量竞争[\s\S]*热门流量追踪[\s\S]*低成本稳增长[\s\S]*爆品拉新破圈[\s\S]*新品快速测款/,
    'AI点睛设置缺少原生 6 个模板推荐'
  );
  assert.match(
    block,
    /centerShieldWordList[\s\S]*exactShieldWordList[\s\S]*selectedDemandList/,
    'AI点睛设置缺少屏蔽词和已选需求结构化字段'
  );

  const mappingBlock = getResolveSceneSettingOverridesBlock();
  assert.match(
    mappingBlock,
    /const keywordAiMaxEntry = normalizedSceneName === '关键词推广'[\s\S]*findSceneSettingEntry\(entries,\s*\[\/AI点睛\/\]\)/,
    '提交流程未识别 AI点睛 设置'
  );
  assert.match(
    mappingBlock,
    /applyCampaign\('aiMaxSwitch',\s*keywordAiMaxSwitch/,
    'AI点睛未映射到 campaign.aiMaxSwitch'
  );
  assert.match(
    mappingBlock,
    /applyCampaign\([\s\S]*'aiMaxInfo'[\s\S]*\{ aiMaxSwitch: keywordAiMaxSwitch \}/,
    'AI点睛未映射到 campaign.aiMaxInfo.aiMaxSwitch'
  );
});

test('关键词预算类型按原生顺序展示日均预算在前', () => {
  const selectStart = source.indexOf('<select id="am-wxt-keyword-budget-type"');
  assert.ok(selectStart > -1, '无法定位关键词预算类型 select');
  const selectEnd = source.indexOf('</select>', selectStart);
  assert.ok(selectEnd > selectStart, '无法定位关键词预算类型 select 结束');
  const selectBlock = source.slice(selectStart, selectEnd);
  assert.ok(
    selectBlock.indexOf('value="day_average"') > -1
      && selectBlock.indexOf('value="day_budget"') > -1
      && selectBlock.indexOf('value="day_average"') < selectBlock.indexOf('value="day_budget"'),
    '关键词预算类型未按原生顺序展示：日均预算应在每日预算前'
  );
});

test('关键词自定义推广智能出价展示人群优化目标面板并保留 crowd 开关映射兼容', () => {
  const { smartBranch } = getKeywordCustomBidModeBranches();
  assert.match(
    smartBranch,
    /buildKeywordSmartCrowdTargetPanelRow\(/,
    '自定义推广智能出价分支缺少“人群优化目标”同构面板'
  );
  assert.match(
    smartBranch,
    /targetFieldKey:\s*keywordCrowdTargetFieldKey[\s\S]*campaignFieldKey:\s*crowdCampaignField/,
    '人群优化目标面板未绑定目标字段与 campaign.crowdList'
  );

  const mappingBlock = getResolveSceneSettingOverridesBlock();
  assert.match(
    mappingBlock,
    /const crowdTargetEntry = findSceneSettingEntry\(entries,\s*\[\/人群优化目标\/,\s*\/客户口径设置\/,\s*\/人群价值设置\//,
    '提交流程未识别“人群优化目标”'
  );
});

test('关键词自定义推广智能出价人群设置复刻原生 checkbox 结构', () => {
  const { smartBranch } = getKeywordCustomBidModeBranches();
  assert.match(
    smartBranch,
    /buildKeywordSmartCrowdPriorityRow\(/,
    '智能出价人群设置未切到原生 checkbox 行渲染'
  );
  assert.match(
    smartBranch,
    /helpText:\s*'智能出价方式下，可通过人群设置，提高特定客户的投放权重。特别的，价值设置用于调整算法的出价系数，并不等于最终的出价。'/,
    '智能出价人群设置缺少原生提示文案'
  );
  assert.match(
    smartBranch,
    /description:\s*'支持对特定客户设置更高权重，进行优先获取。'/,
    '智能出价人群设置缺少原生说明文案'
  );
  assert.match(
    smartBranch,
    /detailUrl:\s*'https:\/\/alidocs\.dingtalk\.com\/i\/nodes\/Y1OQX0akWmzdBowLFk0vRgKlVGlDd3mE'/,
    '智能出价人群设置缺少原生“了解详情”跳转'
  );
  assert.doesNotMatch(
    smartBranch,
    /options:\s*\[\s*'设置优先投放客户'\s*,\s*'关闭'\s*\]/,
    '智能出价人群设置仍在使用旧的分段按钮结构'
  );
});

test('关键词自定义推广增加点击量默认目标成本为0.5，且不覆盖手动清空', () => {
  const { smartBranch } = getKeywordCustomBidModeBranches();
  assert.match(
    smartBranch,
    /const keywordAvgClickCostTouched = !!\([\s\S]*touchedBucket\[keywordAvgClickCostFieldKey\][\s\S]*touchedBucket\[keywordAvgClickCostFieldLabel\][\s\S]*\);/,
    '增加点击量目标成本缺少手动编辑保护判断'
  );
  assert.match(
    smartBranch,
    /if \(!keywordAvgClickCostValue && !keywordAvgClickCostTouched\) \{[\s\S]*keywordAvgClickCostValue = '0\.5';[\s\S]*\}/,
    '增加点击量目标成本未默认回填 0.5'
  );
});

test('关键词自定义推广手动出价展示原生人群弹窗入口并隐藏人群优化目标', () => {
  const { manualBranch } = getKeywordCustomBidModeBranches();
  assert.match(
    manualBranch,
    /label:\s*'人群设置'[\s\S]*?trigger:\s*'crowd'/,
    '自定义推广手动出价缺少“人群设置”弹窗入口'
  );
  assert.match(
    manualBranch,
    /label:\s*'人群设置'[\s\S]*?title:\s*'添加精选人群'/,
    '手动出价“人群设置”弹窗标题未对齐原生“添加精选人群”'
  );
  assert.doesNotMatch(
    manualBranch,
    /label:\s*'人群优化目标'/,
    '手动出价仍展示无效“人群优化目标”配置'
  );
  assert.match(
    manualBranch,
    /label:\s*'投放资源位\/投放地域\/分时折扣'/,
    '手动出价缺少原生“投放资源位/投放地域/分时折扣”组合设置'
  );
});

test('关键词自定义推广出价目标过滤掉卡位目标，仅保留原生目标集合', () => {
  assert.match(
    source,
    /const keywordCustomBidTargetAllowedValues = \['conv', 'similar_item', 'market_penetration', 'fav_cart', 'click', 'roi'\];/,
    'AI点睛关闭时自定义推广“出价目标”白名单常量缺失'
  );
  assert.match(
    source,
    /const keywordAiMaxBidTargetAllowedValues = \['conv', 'fav_cart', 'click', 'roi'\];/,
    'AI点睛开启时自定义推广“出价目标”原生白名单常量缺失'
  );
  assert.match(
    source,
    /allowedValues:\s*activeKeywordGoal === '自定义推广'[\s\S]*\?\s*\(keywordAiMaxEnabled \? keywordAiMaxBidTargetAllowedValues : keywordCustomBidTargetAllowedValues\)[\s\S]*:\s*\(activeKeywordGoal === '趋势明星' \? keywordTrendBidTargetAllowedValues : \[\]\)/,
    '自定义推广“出价目标”未按 AI点睛 开关启用原生白名单过滤'
  );
  assert.match(
    source,
    /resolveOptionText:\s*\(\{ value, text \}\) => \([\s\S]*activeKeywordGoal === '自定义推广' && value === 'market_penetration'[\s\S]*\? '提升词市场渗透'[\s\S]*: text/,
    'AI点睛关闭时自定义推广“出价目标”未对齐原生“提升词市场渗透”文案'
  );
  assert.doesNotMatch(
    source,
    /keywordCustomBidTargetAllowedValues[\s\S]*'search_rank'/,
    '自定义推广“出价目标”错误包含卡位目标 search_rank'
  );
});

test('AI点睛添加商品后重渲染并隐藏关键词/人群独立设置', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /const keywordAiMaxPrimaryItem = activeKeywordGoal === '自定义推广'[\s\S]*resolveKeywordAiMaxPrimaryItem\(\)/,
    'AI点睛未读取已添加商品作为生成上下文'
  );
  assert.match(
    block,
    /const keywordAiMaxHasItem = !!\([\s\S]*toIdValue\(keywordAiMaxPrimaryItem\?\.materialId[\s\S]*normalizeKeywordAiMaxItemTitle\(keywordAiMaxPrimaryItem\)/,
    'AI点睛未判断添加商品后才展示完整解析面板'
  );
  assert.match(
    block,
    /if \(!keywordAiMaxHasItem\) \{[\s\S]*buildKeywordAiMaxPendingPanelRow\([\s\S]*AI点睛正在按原生接口生成投放内容，请稍候[\s\S]*buildKeywordAiMaxInsightPanelRow\(/,
    'AI点睛缺少添加商品前等待、生成中和详情面板切换'
  );
  assert.match(
    block,
    /if \(!keywordAiMaxEnabled\) \{[\s\S]*buildKeywordCustomKeywordSettingRow\([\s\S]*buildKeywordSmartCrowdPriorityRow\([\s\S]*buildKeywordSmartCrowdTargetPanelRow\(/,
    'AI点睛开启时未隐藏关键词设置、人群设置和人群优化目标'
  );
  assert.match(
    source,
    /commitItemSelectionUiState = \(options = \{\}\) => \{[\s\S]*if \(options\.renderSceneDynamic === true\) \{[\s\S]*renderSceneDynamicConfig\(\);/,
    '添加商品状态提交未支持重渲染场景设置'
  );
  assert.match(
    source,
    /wizardState\.addedItems\.push\(item\);[\s\S]*commitItemSelectionUiState\(\{[\s\S]*renderSceneDynamic:\s*true/,
    '单个添加商品后未刷新 AI点睛动态面板'
  );
  assert.match(
    source,
    /wizardState\.addedItems = wizardState\.addedItems\.concat\(pick\);[\s\S]*commitItemSelectionUiState\(\{[\s\S]*renderSceneDynamic:\s*true/,
    '全部添加商品后未刷新 AI点睛动态面板'
  );
  assert.match(
    source,
    /wizardState\.addedItems = \[\];[\s\S]*commitItemSelectionUiState\(\{[\s\S]*renderSceneDynamic:\s*true/,
    '清空商品后未刷新 AI点睛动态面板'
  );
});

test('AI点睛添加商品后走原生接口生成，不再本地写死解析结果', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.doesNotMatch(
    block,
    /KEYWORD_AI_MAX_DEFAULT_ITEM_TITLE|buildKeywordAiMaxDerivedInfo|KEYWORD_AI_MAX_DEFAULT_DEMANDS|KEYWORD_AI_MAX_DEFAULT_SEARCH_WORDS|KEYWORD_AI_MAX_DEFAULT_PERSONAS/,
    'AI点睛仍保留本地默认标题/需求/搜索词/人群画像生成逻辑'
  );
  assert.doesNotMatch(
    source,
    /amount:\s*'890'|clickEstimate:\s*'2747'/,
    'AI点睛仍写死预算 890 或点击量 2747'
  );
  assert.match(
    source,
    /const parseAiMaxEventStream = \(rawText = ''\) =>[\s\S]*const requestAiMaxBusinessTalk = async[\s\S]*https:\/\/ai\.alimama\.com\/ai\/chat\/businessTalk\.json[\s\S]*parseAiMaxEventStream\(rawText\)/,
    'AI点睛缺少原生 businessTalk 事件流生成链路'
  );
  assert.match(
    source,
    /additionalData\.aiMaxInfo/,
    'AI点睛没有读取原生返回的 additionalData.aiMaxInfo'
  );
  assert.match(
    source,
    /const normalizeNativeAiMaxInfo = \(\{[\s\S]*budgetSuggestion[\s\S]*ENDPOINTS\.budgetSuggestion[\s\S]*ENDPOINTS\.effectPrediction/,
    'AI点睛缺少预算建议和效果预估的原生数据归一化'
  );
  assert.match(
    block,
    /keywordAiMaxGenerationMap[\s\S]*ensureKeywordAiMaxGeneration[\s\S]*fetchKeywordAiMaxInfo/,
    'AI点睛添加商品后未接入异步生成状态'
  );
  assert.match(
    block,
    /AI点睛正在按原生接口生成投放内容，请稍候[\s\S]*AI点睛生成失败/,
    'AI点睛缺少接口等待或失败状态'
  );
  assert.match(
    block,
    /if \(!info\.nativeGenerated && !info\.nativeSource\)[\s\S]*buildKeywordAiMaxPendingPanelRow/,
    'AI点睛无原生数据时仍可能渲染完整内容面板'
  );
  assert.match(
    block,
    /AI小万建议[\s\S]*预计可获得点击量[\s\S]*建议日均预算/,
    'AI点睛详情面板缺少原生预算建议展示'
  );
  assert.match(
    block,
    /class="am-wxt-ai-max-demand-summary"[\s\S]*data-scene-popup-summary="\$\{Utils\.escapeHtml\(popupTrigger\)\}"[\s\S]*<span>已选：<\/span>[\s\S]*\$\{\(Array\.isArray\(info\.selectedDemandList\)/,
    'AI点睛缺少原生右侧“已选：N个需求”入口'
  );
  assert.match(
    block,
    /resolveKeywordAiMaxDemandDetail[\s\S]*nativeCrowdList[\s\S]*data-ai-max-demand-analysis[\s\S]*data-ai-max-demand-search-words[\s\S]*data-ai-max-demand-personas/,
    'AI点睛需求卡片未绑定原生逐需求解析、搜索词和人群画像'
  );
  assert.match(
    source,
    /data-ai-max-demand-preview[\s\S]*addEventListener\('click'[\s\S]*data-ai-max-analysis-target[\s\S]*data-ai-max-word-target[\s\S]*data-ai-max-persona-target/,
    'AI点睛需求卡片不能点击切换当前解析详情'
  );
  assert.match(
    source,
    /const aiMaxDeepSteps = \[[\s\S]*第1步：计划定向画像分析[\s\S]*第2步：关键词深度分析[\s\S]*第3步：流入流失竞对分析[\s\S]*第4步：同行定向画像分析[\s\S]*第5步：搜索需求分析/,
    'AI点睛展开详情缺少原生 5 步深度分析结构'
  );
  assert.match(
    source,
    /am-wxt-ai-max-deep-detail hidden[\s\S]*data-ai-max-detail-section="deep"[\s\S]*\$\{aiMaxDeepStepHtml\}/,
    'AI点睛展开详情缺少 5 步分析容器挂载点'
  );
  assert.match(
    source,
    /class="am-wxt-ai-max-detail-grid" data-ai-max-demand-detail-grid="1"[\s\S]*<b>热门搜索词<\/b>[\s\S]*<b>搜索人群画像与特征<\/b>/,
    'AI点睛热门搜索词和搜索人群画像默认应常驻展开'
  );
  assert.match(
    source,
    /querySelectorAll\('\[data-ai-max-detail-section="deep"\]'\)[\s\S]*classList\.toggle\('hidden', expanded\)/,
    'AI点睛展开详情按钮应只控制 5 步深度分析，不应隐藏热门搜索词版块'
  );
  assert.match(
    source,
    /const runAiMaxTypewriter = \(panel = null\) =>[\s\S]*data-ai-max-typewriter-text[\s\S]*window\.setInterval[\s\S]*target\.textContent = fullText\.slice/,
    'AI点睛展开详情缺少原生式打字展示逻辑'
  );
  assert.match(
    source,
    /class="am-wxt-ai-max-demand-next"[\s\S]*data-ai-max-demand-next="1"[\s\S]*aria-label="查看更多AI点睛需求"/,
    'AI点睛需求卡片超过 3 个时缺少右侧灰色切换箭头'
  );
  assert.match(
    source,
    /data-ai-max-demand-next="1"[\s\S]*data-ai-max-demand-list="1"[\s\S]*(scrollBy|scrollTo)/,
    'AI点睛需求卡片右侧箭头缺少滚动切换逻辑'
  );
  assert.match(
    source,
    /data-ai-max-demand-selector-trigger="1"[\s\S]*data-ai-max-info-field="\$\{Utils\.escapeHtml\(normalizedInfoField\)\}"/,
    'AI点睛“5个需求”入口未绑定独立需求下拉浮层'
  );
  assert.match(
    source,
    /openKeywordAiMaxDemandPopover[\s\S]*am-wxt-ai-max-demand-popover[\s\S]*data-ai-max-demand-popover-all="1"[\s\S]*data-ai-max-demand-popover-confirm="1"[\s\S]*data-ai-max-demand-popover-cancel="1"/,
    'AI点睛“5个需求”缺少原生小浮层的全选、确定和取消结构'
  );
  assert.doesNotMatch(
    source,
    /class="am-wxt-ai-max-demand-summary"[\s\S]{0,500}data-scene-popup-trigger-proxy="\$\{Utils\.escapeHtml\(popupTrigger\)\}"/,
    'AI点睛“5个需求”仍复用完整设置弹窗，而不是原生小浮层'
  );
});

test('关键词自定义推广编辑计划不依赖未定义 runtime 变量', () => {
  const customBlock = getKeywordCustomSceneBlock();
  assert.doesNotMatch(
    customBlock,
    /runtime\?\.storeData\?\.needTargetCrowd|runtime\?\.solutionTemplate\?\.campaign\?\.needTargetCrowd/,
    '自定义推广场景渲染仍依赖未定义 runtime，编辑计划会报错'
  );
  assert.match(
    customBlock,
    /isCrowdTargetEnabled\s*=\s*!\/\^\(0\|false\|off\|关闭\|否\)\$\/i\.test/,
    '人群优化目标开关对“关闭”值识别不完整'
  );
});
