import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getMagicReportBlock() {
  const start = source.indexOf('const MagicReport = {');
  const end = source.indexOf('const CampaignIdQuickEntry = {', start);
  assert.ok(start > -1 && end > start, '无法定位 MagicReport 代码块');
  return source.slice(start, end);
}

function getBuildMetricPromptBlock() {
  const block = getMagicReportBlock();
  const match = block.match(/buildMetricPrompt\(\{ campaignId, metricType, itemId = '' \}\)\s*\{([\s\S]*?)\n\s*\},\n\s*\n\s*normalizeCrowdGroupName\(/);
  assert.ok(match, '无法定位 buildMetricPrompt 代码块');
  return match[1];
}

test('MagicReport 声明人群看板固定周期/维度/指标常量', () => {
  const block = getMagicReportBlock();
  assert.match(block, /CROWD_PERIODS:\s*\[\s*3\s*,\s*7\s*,\s*30\s*,\s*90\s*\]/, '缺少 4 周期常量或顺序不符');
  assert.match(block, /CROWD_GROUP_ORDER:\s*\[\s*'消费能力等级'\s*,\s*'月均消费金额'\s*,\s*'用户年龄'\s*,\s*'用户性别'\s*,\s*'城市等级'\s*,\s*'店铺潜新老客'\s*,\s*'省份'\s*,\s*'城市'\s*\]/, '缺少 8 维度常量或顺序不符');
  assert.match(block, /CROWD_EXTRA_DIMENSION_GROUPS:\s*\[\s*'省份'\s*,\s*'城市'\s*\]/, '缺少省份/城市额外查数维度常量');
  assert.match(block, /CROWD_METRICS:\s*\[\s*'click'\s*,\s*'cart'\s*,\s*'deal'\s*,\s*'itemdeal'\s*\]/, '缺少 4 指标常量或顺序不符');
});

test('MagicReport 包含人群看板核心方法与辅助方法', () => {
  const block = getMagicReportBlock();
  for (const method of [
    'queryCrowdInsight',
    'parseSseEvents',
    'extractGroupList',
    'buildMatrixDataset',
    'renderCrowdMatrixCharts',
    'renderCrowdGlobalLegend',
    'toggleCrowdMetricVisibility',
    'toggleCrowdPeriodVisibility',
    'toggleCrowdRatioVisibility',
    'toggleCrowdInsightsVisibility',
    'syncCrowdAuxiliaryVisibilityByMetricCount',
    'clearCrowdMatrixHoverBars',
    'getCrowdMatrixLinkedBars',
    'buildCrowdMatrixHoverMetricIndex',
    'getCrowdMatrixHoverMetricScopeMap',
    'buildCrowdMatrixHoverTipText',
    'formatCrowdMatrixHoverTipHtml',
    'activateCrowdMatrixHoverBars',
    'formatCrowdHoverPercent',
    'formatCrowdPtDiff',
    'getCrowdPeriodVisible',
    'getVisibleCrowdPeriods',
    'getCrowdRatioVisible',
    'getCrowdInsightsVisible',
    'applyCrowdMetricVisibility',
    'enableCrowdMatrixHorizontalDrag',
    'normalizeMagicView',
    'getMagicDefaultView',
    'setMagicDefaultView',
    'refreshMagicViewTabDefaultState',
    'cacheCrowdCampaignItemId',
    'getCrowdCampaignItemId',
    'getCrowdCampaignSelectedItemId',
    'setCrowdCampaignSelectedItemId',
    'collectCrowdItemSpendSummaryFromPayload',
    'queryCrowdCampaignSpendPayload',
    'refreshCrowdCampaignItemOptions',
    'renderCrowdCampaignItemSelect',
    'maximizePopupForMatrix',
    'restorePopupFromMatrix',
    'buildMetricPrompt',
    'buildCrowdPeriodPrompt',
    'buildCrowdPanelTimeMode',
    'buildCrowdPanelQueryExecutePlan',
    'resolveCrowdItemIdByCampaign',
    'extractPanelQueryConfFromDataQuery',
    'queryPanelPeriod',
    'runCrowdMatrixLoad'
  ]) {
    assert.match(block, new RegExp(`\\b${method}\\s*\\(`), `缺少方法: ${method}`);
  }
});

test('人群看板默认仅显示加购人群，并默认显示占比/关闭提示', () => {
  const block = getMagicReportBlock();
  assert.match(block, /matrixHoverMetricIndex:\s*null/, '悬停提示指标索引缓存未初始化');
  assert.match(block, /crowdMatrixGroupSortModeMap:\s*\{\s*\}/, '省份/城市排序模式默认值未初始化为空');
  assert.match(block, /crowdMetricVisibility:\s*\{\s*click:\s*false,\s*cart:\s*true,\s*deal:\s*false,\s*itemdeal:\s*false\s*\}/, '默认人群显隐未设置为仅加购可见');
  assert.match(block, /crowdRatioVisibility:\s*true/, '默认占比显示未开启');
  assert.match(block, /crowdInsightsVisibility:\s*false/, '默认提示显示未关闭');
});

test('四类指标 prompt 采用无时间词模板（周期通过 panelDataQuery 覆盖）', () => {
  const block = getMagicReportBlock();
  const methodBlock = getBuildMetricPromptBlock();
  assert.match(block, /promptKeyword:\s*'点击人群分析'/, '点击指标 promptKeyword 不存在');
  assert.match(block, /promptKeyword:\s*'加购人群分析'/, '加购指标 promptKeyword 不存在');
  assert.match(block, /promptKeyword:\s*'成交人群分析'/, '成交指标 promptKeyword 不存在');
  assert.match(block, /seriesLabel:\s*'商品成交人群'/, '商品成交人群指标配置不存在');
  assert.match(methodBlock, /return\s+`计划ID：\$\{id\}\s+\$\{this\.getCrowdMetricMeta\(metric\)\.promptKeyword\}`;/, 'buildMetricPrompt 未按无时间词模板构造');
  assert.match(methodBlock, /return\s+`商品ID：\$\{item\}\s+成交人群分析`;/, 'buildMetricPrompt 未按商品ID模板构造商品成交人群查询');
  assert.doesNotMatch(methodBlock, /过去\$\{/, 'buildMetricPrompt 不应直接拼接周期词');
});

test('万能查数快捷话术包含“✨商品ID成交占比分析”，并支持商品ID占位替换', () => {
  const block = getMagicReportBlock();
  assert.match(block, /label:\s*'✨商品ID成交'\s*,\s*value:\s*'商品ID：\{商品ID\}，成交人群在各个省份或城市的花费，再使用占比工具进行占比分析'/, '快捷话术缺少商品ID成交占比模板');
  assert.match(block, /if \(resolved\.includes\('\{商品ID\}'\) \|\| resolved\.includes\('\{itemId\}'\)\) \{/, 'resolvePromptText 未处理商品ID占位');
  assert.match(block, /itemId = await this\.resolveCrowdItemIdByCampaign\(campaignId\);/, '商品ID占位未按计划自动补齐商品ID');
  assert.match(block, /resolved = resolved[\s\S]*replace\(\/\\\{商品ID\\\}\/g, itemId\)/, '商品ID占位未正确替换');
});

test('万能查数快捷话术补充计划ID省份/城市花费占比模板', () => {
  const block = getMagicReportBlock();
  assert.match(block, /label:\s*'🏙️ 省份占比'\s*,\s*value:\s*'计划ID：\{campaignId\}，在各个省份的花费，再使用占比工具进行占比分析'/, '快捷话术缺少计划ID省份花费占比模板');
  assert.match(block, /label:\s*'🌆 城市占比'\s*,\s*value:\s*'计划ID：\{campaignId\}，在各个城市的花费，再使用占比工具进行占比分析'/, '快捷话术缺少计划ID城市花费占比模板');
});

test('快捷查询在 iframe 提交失败后会回退原生查数入口', () => {
  const block = getMagicReportBlock();
  assert.match(block, /async tryFallbackSubmitPrompt\(promptText\)\s*\{[\s\S]*this\.openNativeAndSubmit\(fallbackCampaignId,\s*promptText\)/, '缺少原生查数回退提交流程');
  assert.match(block, /if \(retriesLeft <= 0\) \{[\s\S]*this\.tryFallbackSubmitPrompt\(promptText\)\.then\(\(fallbackOk\) => \{/, 'runQuickPrompt 未在重试耗尽后触发原生回退');
});

test('buildCrowdDimensionPrompt 按计划ID/商品ID与省市维度构造花费占比分析话术', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const crowdLabelMap = \{\s*click:\s*'点击人群'\s*,\s*cart:\s*'加购人群'\s*,\s*deal:\s*'成交人群'\s*,\s*itemdeal:\s*'成交人群'\s*\};/, 'buildCrowdDimensionPrompt 未按指标映射点击/加购/成交人群');
  assert.match(block, /return `计划ID：\$\{id\}，\$\{crowdLabel\}在各个\$\{normalizedGroup\}的花费，再使用占比工具进行占比分析`;/, '计划ID维度话术不符合最新模板');
  assert.match(block, /return `商品ID：\$\{item\}，\$\{crowdLabel\}在各个\$\{normalizedGroup\}的花费，再使用占比工具进行占比分析`;/, '商品ID维度话术不符合最新模板');
});

test('周期覆写使用 panelDataQuery，且请求体包含 queryConf.period/queryExecutePlan/timeMode', () => {
  const block = getMagicReportBlock();
  assert.match(block, /requestCrowdApi\('\/ai\/report\/panelDataQuery\.json'/, '未调用 panelDataQuery 接口');
  assert.match(block, /const periodText = `过去\$\{days\}天`;/, '缺少周期文本变量 periodText');
  assert.match(block, /const normalizedTitle = this\.buildCrowdPeriodPrompt\(String\(title \|\| ''\)\.trim\(\),\s*days\);/, 'panelDataQuery title 未按周期改写');
  assert.match(block, /const normalizedTimeMode = this\.buildCrowdPanelTimeMode\(timeMode,\s*days\);/, 'panelDataQuery 未按周期重写 timeMode');
  assert.match(block, /const rootMode = String\(cloned\.timeMode \|\| ''\)\.trim\(\);[\s\S]*if \(!rootMode \|\| rootMode === 'noTimeMode'\) \{\s*cloned\.timeMode = 'slidedTime';/, 'timeMode 未将 noTimeMode 归一为 slidedTime');
  assert.match(block, /if \(!String\(cloned\.timeInfo \|\| ''\)\.trim\(\)\) \{\s*cloned\.timeInfo = periodText;\s*\}/, 'timeMode 缺少 timeInfo 兜底覆写');
  assert.match(block, /if \(!Array\.isArray\(cloned\.period\) \|\| !cloned\.period\.length\) \{\s*cloned\.period = \[\{\s*timeInfo:\s*periodText\s*\}\];\s*\}/, 'timeMode 缺少 period 数组兜底覆写');
  assert.match(block, /const normalizedQueryExecutePlan = this\.buildCrowdPanelQueryExecutePlan\(queryExecutePlan,\s*days\);/, 'panelDataQuery 未按周期重写 queryExecutePlan');
  assert.match(block, /title:\s*normalizedTitle/, 'query payload.title 未使用按周期改写后的标题');
  assert.match(block, /queryConf:\s*\{[\s\S]*period:\s*\[\s*\{\s*timeInfo:\s*periodText\s*\}\s*\]/, 'queryConf.period 未按周期写入');
  assert.match(block, /queryExecutePlan:\s*String\(normalizedQueryExecutePlan\s*\|\|\s*''\)\.trim\(\)/, 'queryConf 缺少按周期重写后的 queryExecutePlan');
  assert.match(block, /timeMode:\s*normalizedTimeMode/, 'queryConf.timeMode 未使用按周期重写后的值');
  assert.match(block, /timeInfo:\s*periodText/, 'queryConf 缺少 timeInfo 覆写');
  assert.match(block, /const rewritePlanString = \(value = '', depth = 0\) => \{/, 'queryExecutePlan 缺少嵌套字符串计划改写逻辑');
  assert.match(block, /const directParsed = tryParseJson\(text\);[\s\S]*rewritePlanObject\(copied,\s*depth \+ 1\)/, 'queryExecutePlan 未递归改写嵌套 JSON 字符串');
  assert.match(block, /const encodeBase64Text = \(text = ''\) => \{/, 'queryExecutePlan 缺少 UTF-8 安全 base64 编码 helper');
  assert.match(block, /const encoded = encodeBase64Text\(JSON\.stringify\(copied\)\);[\s\S]*value:\s*encoded/, 'queryExecutePlan 未使用 UTF-8 安全编码回写 base64 计划');
  assert.doesNotMatch(block, /return btoa\(JSON\.stringify\(copied\)\);/, 'queryExecutePlan 仍在直接 btoa JSON，中文会导致重写失效');
  assert.match(block, /if \(typeof node\.query === 'string'\) \{[\s\S]*this\.buildCrowdPeriodPrompt\(node\.query,\s*normalizedDays\)/, 'queryExecutePlan 未按周期改写 query 文本');
  assert.match(block, /if \(typeof node\.timeInfo === 'string' && node\.timeInfo !== periodText\) \{[\s\S]*node\.timeInfo = periodText;/, 'queryExecutePlan 未按周期同步 timeInfo');
  assert.match(block, /if \(typeof value !== 'string'\) return;[\s\S]*const rewritten = rewritePlanString\(value,\s*currentDepth\);[\s\S]*node\[key\] = rewritten\.value;/, 'queryExecutePlan 未将嵌套字符串改写结果回写到原对象');
});

test('extractGroupList 同时兼容 CHART_GROUP.groupList 与 subComponentList.properties.groupList', () => {
  const block = getMagicReportBlock();
  assert.match(block, /if \(Array\.isArray\(current\.groupList\) && current\.groupList\.length\) return current\.groupList;/, '未读取 CHART_GROUP.groupList');
  assert.match(block, /if \(Array\.isArray\(current\?\.properties\?\.groupList\) && current\.properties\.groupList\.length\) return current\.properties\.groupList;/, '未兜底读取 subComponentList.properties.groupList');
  assert.match(block, /if \(Array\.isArray\(current\.subComponentList\) && current\.subComponentList\.length\)/, '未遍历 subComponentList 进行递归兜底');
});

test('extractGroupList 兼容 pie 图结构，并支持按 fallbackGroupName 兜底分组名', () => {
  const block = getMagicReportBlock();
  assert.match(block, /extractGroupList\(componentList,\s*fallbackGroupName = ''\)/, 'extractGroupList 未声明 fallbackGroupName 参数');
  assert.match(block, /const normalizedFallbackGroup = this\.normalizeCrowdGroupName\(fallbackGroupName\);/, 'extractGroupList 未对 fallbackGroupName 做规范化');
  assert.match(block, /const chartData = Array\.isArray\(current\?\.chartData\) && current\.chartData\.length[\s\S]*?Array\.isArray\(current\?\.properties\?\.chartData\)/, 'extractGroupList 未兼容 pie chartData 结构');
  assert.match(block, /fallbackGroups\.push\(\{\s*groupName,\s*componentList:\s*\[\{\s*chartData\s*\}\]\s*\}\);/, 'extractGroupList 未将 pie 结构映射为 groupList 统一结构');
});

test('buildGroupMapFromGroupList 支持按 fallbackGroupName 兜底城市分组名', () => {
  const block = getMagicReportBlock();
  assert.match(block, /buildGroupMapFromGroupList\(groupList,\s*fallbackGroupName = ''\)/, 'buildGroupMapFromGroupList 未声明 fallbackGroupName 参数');
  assert.match(block, /const normalizedFallbackGroup = this\.normalizeCrowdGroupName\(fallbackGroupName\);/, 'buildGroupMapFromGroupList 未规范化 fallbackGroupName');
  assert.match(block, /if \(!groupName\) \{\s*groupName = normalizedFallbackGroup;\s*\}/, 'buildGroupMapFromGroupList 未在分组名缺失时使用 fallbackGroupName');
  assert.match(block, /const panelGroupMap = this\.buildGroupMapFromGroupList\(panelResult\.groupList,\s*scopeKey === 'base' \? '' : scopeKey\);/, 'panelDataQuery 结果未透传 scopeKey 兜底分组名');
  assert.match(block, /const scopeGroupMap = this\.buildGroupMapFromGroupList\(scopeGroupList,\s*scopeKey\);/, '周期直查结果未透传 scopeKey 兜底分组名');
});

test('queryCrowdInsight 采用 dataQuery 首查 + panelDataQuery 周期覆写的混合链路', () => {
  const block = getMagicReportBlock();
  assert.match(block, /requestCrowdApi\('\/ai\/report\/dataQuery\.json'/, '缺少 dataQuery 首查调用');
  assert.match(block, /itemId = \/\^\\d\{6,\}\$\/\.test\(selectedItemId\)\s*\?\s*selectedItemId\s*:\s*await this\.resolveCrowdItemIdByCampaign\(id\);/, '商品成交人群未优先使用已选商品ID并按计划识别兜底');
  assert.match(block, /throw new Error\(`未识别到计划 \$\{id\} 对应商品ID`\);/, '商品成交人群缺少商品ID识别失败提示');
  assert.match(block, /const scopePrompt = this\.buildCrowdDimensionPrompt\(\{ campaignId: id, metricType: metric, groupName, itemId \}\);/, '未按省份\/城市构造额外查数话术');
  assert.match(block, /const mergedGroupMap = this\.mergeCrowdGroupMaps\(/, '多话术结果未合并成统一 groupMap');
  assert.match(block, /scopeResultMap\[normalizedGroup\] = \{[\s\S]*panelQueryConf:\s*null/, '省份\/城市话术缺少独立 scope 容器');
  assert.match(block, /const groupList = this\.extractGroupList\(componentList,\s*scopeKey\);/, '省份\/城市首查未按 scopeKey 兜底维度名');
  assert.match(block, /const scopeGroupList = this\.extractGroupList\(scopeComponentList,\s*scopeKey\);/, '省份\/城市周期直查未按 scopeKey 兜底维度名');
  assert.match(block, /if \(days === 7\) \{[\s\S]*requestPath: baseResult\.requestPath/, '7 天分支未复用首查结果');
  assert.match(block, /const baseScopeMeta = scopeResultMap\.base;[\s\S]*throw new Error\('未获取到周期切换所需 queryExecutePlan'\);/, 'base 维度缺少 queryExecutePlan 时未快速失败');
  assert.match(block, /const baseScopeResult = await queryScopePeriod\('base',\s*baseScopeMeta\);[\s\S]*if \(baseScopeResult\?\.error\) \{[\s\S]*throw baseScopeResult\.error;/, 'base 维度周期查询失败未在并发前直接中断');
  assert.match(block, /const extraScopeEntries = scopeEntries\.filter\(\(\[scopeKey\]\) => scopeKey !== 'base'\);/, '额外维度周期查询未排除 base 独立处理');
  assert.match(block, /const panelResult = await this\.queryPanelPeriod\(/, '非 7 天分支未走 panel 周期覆写');
  assert.match(block, /fallbackGroupName:\s*scopeKey === 'base' \? '' : scopeKey/, 'panelDataQuery 周期覆写未透传 scopeKey 兜底维度名');
  assert.match(block, /mergedPeriodGroupMap = this\.mergeCrowdGroupMaps\(mergedPeriodGroupMap,\s*panelGroupMap\);/, '周期覆写结果未按维度汇总合并');
});

test('省份/城市缺少 queryExecutePlan 时会按周期直查兜底', () => {
  const block = getMagicReportBlock();
  assert.match(block, /buildCrowdPeriodPrompt\(promptText = '', periodDays = 7\)\s*\{/, '缺少按周期直查 prompt helper');
  assert.match(block, /let panelQueryConf = null;[\s\S]*?try \{[\s\S]*?panelQueryConf = this\.extractPanelQueryConfFromDataQuery\(componentList\);[\s\S]*?\} catch \{ \}/, '额外维度首查未兼容缺失 queryExecutePlan');
  assert.match(block, /if \(!panelQueryConf \|\| typeof panelQueryConf !== 'object'\) \{[\s\S]*?const scopePrompt = this\.buildCrowdPeriodPrompt\(scopeMeta\?\.prompt \|\| '', days\);[\s\S]*?requestCrowdApi\('\/ai\/report\/dataQuery\.json'/, '额外维度缺少 queryExecutePlan 时未走周期直查兜底');
});

test('itemdeal 缺少 queryExecutePlan 时会强制刷新商品ID并重试首查', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const shouldRetryByRefreshingItem = metric === 'itemdeal' && !lockToSelectedItem && \/queryExecutePlan\/\.test\(message\);/, '未按 itemdeal + queryExecutePlan 缺失条件触发重试');
  assert.match(block, /this\.resolveCrowdItemIdByCampaign\(id,\s*\{\s*preferCache:\s*false,\s*allowCacheFallback:\s*false\s*\}\)/, '缺少强制刷新商品ID重试逻辑');
  assert.match(block, /if \(!\/\^\\d\{6,\}\$\/\.test\(refreshedItemId\) \|\| refreshedItemId === itemId\) \{[\s\S]*throw err;/, '缺少无效/未变化商品ID的失败保护');
});

test('人群看板请求启用限速与重试保护，且并发由配置值控制', () => {
  const block = getMagicReportBlock();
  assert.match(block, /CROWD_REQUEST_CONCURRENCY:\s*2/, '缺少看板请求并发配置');
  assert.match(block, /CROWD_REQUEST_THROTTLE_MS:\s*340/, '缺少看板请求节流间隔配置');
  assert.match(block, /CROWD_REQUEST_MAX_ATTEMPTS:\s*3/, '缺少看板请求重试次数配置');
  assert.match(block, /await this\.acquireCrowdRequestSlot\(\);/, 'requestCrowdApi 未启用请求节流');
  assert.match(block, /for \(let attempt = 1; attempt <= maxAttempts; attempt\+\+\)/, 'requestCrowdApi 未启用重试循环');
  assert.match(block, /const canRetry = attempt < maxAttempts && this\.shouldRetryCrowdApiError\(error\);/, 'requestCrowdApi 缺少重试条件判断');
  assert.match(block, /const delayMs = this\.getCrowdRetryDelay\(attempt\);/, 'requestCrowdApi 缺少退避等待');
  assert.match(block, /runTasksWithConcurrency\(taskFns,\s*this\.CROWD_REQUEST_CONCURRENCY\)/, '看板任务并发未使用配置值');
});

test('切换到人群看板会最大化弹窗，切回万能查数会恢复弹窗尺寸', () => {
  const block = getMagicReportBlock();
  assert.match(block, /if \(next === 'matrix'\) this\.maximizePopupForMatrix\(\);\s*else this\.restorePopupFromMatrix\(\);/, 'switchMagicView 未实现矩阵视图最大化/恢复逻辑');
  assert.match(block, /if \(this\.activeView === 'matrix'\) \{\s*this\.maximizePopupForMatrix\(\);\s*\}/, '窗口尺寸变化时未保持矩阵视图最大化');
});

test('万能查数弹窗默认打开人群对比看板，并支持默认 tab 持久化', () => {
  const block = getMagicReportBlock();
  assert.match(source, /magicReportDefaultView:\s*'matrix'/, '默认配置未将 magicReportDefaultView 设为 matrix');
  assert.match(block, /activeView:\s*'matrix'/, 'MagicReport 默认 activeView 未设为 matrix');
  assert.match(block, /this\.activeView = this\.getMagicDefaultView\(\);\s*this\.switchMagicView\(this\.activeView \|\| 'matrix', \{ skipLoad: true \}\);/, '弹窗初始化未按默认视图打开');
  assert.match(block, /const defaultView = this\.getMagicDefaultView\(\);\s*this\.activeView = defaultView;\s*this\.switchMagicView\(defaultView \|\| 'matrix'\);/, '弹窗打开时未按默认视图重置');
});

test('tab 上提供默认图标，点击后写入默认视图并切换到对应 tab', () => {
  const block = getMagicReportBlock();
  assert.match(block, /class="am-magic-view-default-icon" data-default-view="query"/, '万能查数 tab 缺少默认图标');
  assert.match(block, /class="am-magic-view-default-icon" data-default-view="matrix"/, '人群对比看板 tab 缺少默认图标');
  assert.match(block, /const defaultIcon = target\.closest\('\[data-default-view\]'\);/, '默认图标点击事件未绑定');
  assert.match(block, /this\.setMagicDefaultView\(defaultView\);/, '默认图标点击后未写入默认视图');
  assert.match(block, /this\.switchMagicView\(defaultView\);/, '默认图标点击后未切换到对应 tab');
});

test('人群看板使用顶部统一图例，并支持点击切换系列显隐', () => {
  const block = getMagicReportBlock();
  assert.match(block, /id="am-crowd-matrix-global-legend"/, '看板顶部缺少统一图例容器');
  assert.match(block, /this\.matrixLegendEl\.addEventListener\('click'[\s\S]*toggleCrowdMetricVisibility\(metric\);/, '统一图例点击未绑定系列显隐切换');
  assert.match(block, /this\.matrixLegendEl\.addEventListener\('click'[\s\S]*toggleCrowdPeriodVisibility\(period\);/, '统一图例点击未绑定周期列显隐切换');
  assert.match(block, /this\.matrixLegendEl\.addEventListener\('click'[\s\S]*toggleCrowdRatioVisibility\(\);/, '统一图例点击未绑定占比显隐切换');
  assert.match(block, /this\.matrixLegendEl\.addEventListener\('click'[\s\S]*toggleCrowdInsightsVisibility\(\);/, '统一图例点击未绑定提示显隐切换');
  assert.match(block, /btn\.dataset\.crowdPeriod = String\(period\);/, '统一图例未渲染周期按钮');
  assert.match(block, /ratioBtn\.dataset\.crowdRatioToggle = '1';/, '统一图例未渲染显示占比按钮');
  assert.match(block, /insightBtn\.dataset\.crowdInsightToggle = '1';/, '统一图例未渲染显示提示按钮');
  assert.match(block, /classList\.toggle\(`am-hide-metric-\$\{metric\}`,\s*!this\.getCrowdMetricVisible\(metric\)\);/, '网格缺少系列显隐 class 切换');
  assert.match(block, /this\.matrixGridEl\.classList\.toggle\('am-show-ratio-values', this\.getCrowdRatioVisible\(\)\);/, '网格缺少占比显隐 class 切换');
  assert.match(block, /this\.matrixGridEl\.classList\.toggle\('am-hide-insights', !this\.getCrowdInsightsVisible\(\)\);/, '网格缺少提示显隐 class 切换');
});

test('单人群与多人群切换时自动联动“显示占比/显示提示”状态', () => {
  const block = getMagicReportBlock();
  assert.match(block, /this\.syncCrowdAuxiliaryVisibilityByMetricCount\(nextMap\);/, '人群显隐切换后未触发占比/提示自动联动');
  assert.match(block, /if \(visibleCount <= 1\) \{[\s\S]*this\.crowdRatioVisibility = true;[\s\S]*this\.crowdInsightsVisibility = false;/, '单人群时未自动开启占比并关闭提示');
  assert.match(block, /else \{[\s\S]*this\.crowdRatioVisibility = false;[\s\S]*this\.crowdInsightsVisibility = true;/, '多人群时未自动关闭占比并开启提示');
});

test('顶部统一图例将人群与时间按钮分组，并用竖线分隔', () => {
  const block = getMagicReportBlock();
  assert.match(block, /metricGroup\.className = 'am-crowd-matrix-legend-group am-crowd-matrix-legend-group-metric';/, '缺少人群图例分组容器');
  assert.match(block, /periodGroup\.className = 'am-crowd-matrix-legend-group am-crowd-matrix-legend-group-period';/, '缺少时间图例分组容器');
  assert.match(block, /divider\.className = 'am-crowd-matrix-legend-divider';/, '缺少图例分隔符节点');
  assert.match(block, /divider\.textContent = '｜';/, '图例分隔符未使用竖线');
});

test('看板计划信息展示计划名/计划ID，并将商品ID改为下拉单选', () => {
  const block = getMagicReportBlock();
  assert.match(block, /data-crowd-campaign-name/, '计划信息缺少计划名节点');
  assert.match(block, /data-crowd-campaign-id/, '计划信息缺少计划ID节点');
  assert.match(block, /id="am-crowd-matrix-item-select"/, '计划信息缺少商品ID下拉节点');
  assert.match(block, /data-crowd-item-trigger/, '商品ID缺少自定义下拉触发器节点');
  assert.match(block, /data-crowd-item-dropdown/, '商品ID缺少自定义下拉菜单节点');
  assert.match(block, /this\.matrixCampaignNameEl\.textContent = `计划名：\$\{name \|\| '未识别'\}`;/, '计划名文案未按节点更新');
  assert.match(block, /this\.matrixCampaignIdEl\.textContent = `计划ID：\$\{id \|\| '--'\}`;/, '计划ID文案未按节点更新');
  assert.match(block, /this\.renderCrowdCampaignItemSelect\(id\);/, '计划信息刷新未触发商品ID下拉渲染');
  assert.match(block, /buildCrowdCampaignItemOptionLabel\(item\)\s*\{[\s\S]*normalizeCrowdItemTitle[\s\S]*花费/, '商品ID下拉未展示商品标题和花费信息');
  assert.match(block, /optionBtn\.dataset\.crowdItemId = item\.itemId;/, '商品ID下拉未写入选项 data-item-id');
  assert.match(block, /itemOptions = itemOptions[\s\S]*\.filter\(item => item\.active !== false\)/, '商品候选未过滤暂停推广状态');
  assert.match(block, /const leftRank = left\?\.active === true \? 0 : 1;[\s\S]*const rightRank = right\?\.active === true \? 0 : 1;/, '商品候选排序未优先推广中状态');
  assert.match(block, /this\.matrixCampaignEl\.addEventListener\('click', \(e\) => \{[\s\S]*target\.closest\('\[data-crowd-item-trigger\]'\)[\s\S]*target\.closest\('\[data-crowd-item-id\]'\)/, '商品ID下拉未绑定触发器/选项点击事件');
  assert.match(block, /handleCrowdCampaignItemSelect\(itemId = ''\)\s*\{[\s\S]*this\.setCrowdCampaignSelectedItemId\(id,\s*selectedItemId,\s*\{\s*manual:\s*true\s*\}\);[\s\S]*this\.reloadCrowdMatrixMetric\(\{\s*campaignId:\s*id,\s*metricType:\s*'itemdeal'\s*\}\);/, '商品ID下拉切换后未仅刷新商品成交人群');
});

test('商品成交人群局部刷新会替换同指标缓存，避免旧周期残留', () => {
  const block = getMagicReportBlock();
  assert.match(block, /replaceCrowdMatrixMetricResults\(metricType,\s*results = \[\]\)\s*\{/, '缺少按指标替换结果缓存方法');
  assert.match(block, /const metricPrefix = `\$\{metric\}\\|`;/, '按指标清理缓存缺少 key 前缀');
  assert.match(block, /this\.crowdMatrixResultMap\.delete\(key\);/, '按指标清理缓存未删除旧周期结果');
  assert.match(block, /const mergedResults = this\.replaceCrowdMatrixMetricResults\(metric,\s*successResults\);/, '局部刷新未替换同指标缓存');
});

test('刷新进行中切换商品会排队并在完成后补跑最新请求', () => {
  const block = getMagicReportBlock();
  assert.match(block, /if \(this\.crowdMatrixLoading\) \{[\s\S]*this\.scheduleCrowdMatrixMetricReload\(id,\s*metric\);[\s\S]*return;[\s\S]*\}/, '刷新进行中未排队最新指标请求');
  assert.match(block, /scheduleCrowdMatrixMetricReload\(campaignId,\s*metricType\)\s*\{/, '缺少排队重刷方法');
  assert.match(block, /flushPendingCrowdMatrixMetricReload\(\)\s*\{/, '缺少排队请求冲刷方法');
  assert.match(block, /this\.flushPendingCrowdMatrixMetricReload\(\);/, '刷新完成后未冲刷排队请求');
});

test('商品成交人群支持手动锁定所选商品ID，避免自动切换到其他候选', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const lockToSelectedItem = metric === 'itemdeal'[\s\S]*this\.isCrowdCampaignItemManuallySelected\(id\)[\s\S]*\/\^\\d\{6,\}\$\/\.test\(selectedItemId\);/, 'itemdeal 未识别手动选中锁定条件');
  assert.match(block, /const candidates = lockedItemId[\s\S]*\?\s*\[lockedItemId\][\s\S]*:\s*this\.getCrowdCampaignItemCandidates\(id,\s*seedItemId\);/, 'itemdeal 未按锁定状态构造候选商品集合');
  assert.match(block, /lockedItemId:\s*lockToSelectedItem \?\s*selectedItemId\s*:\s*''/, 'itemdeal 首查未透传锁定商品ID');
  assert.match(block, /const shouldRetryByRefreshingItem = metric === 'itemdeal' && !lockToSelectedItem && \/queryExecutePlan\/\.test\(message\);/, '锁定商品ID后仍会触发刷新重试，可能串商品');
});

test('看板状态区仅展示最新一行日志，并支持进度条背景变量', () => {
  const block = getMagicReportBlock();
  assert.match(block, /split\(\/\\r\?\\n\/\)/, '状态文案未按行切分');
  assert.match(block, /style\.setProperty\('--am-crowd-progress', `\$\{nextProgress\}%`\);/, '状态区未写入进度条变量');
  assert.match(block, /textNode\.className = 'am-crowd-matrix-state-text';/, '状态区未使用单行文本节点');
  assert.match(block, /this\.matrixStateEl\.replaceChildren\(textNode\);/, '状态区未替换为最新单行日志');
});

test('看板加载进度文案包含省份/城市维度进度', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const scopeProgressText = totalTaskCount > 0[\s\S]*\? ` ｜ 省份 \$\{done\}\/\$\{totalTaskCount\} · 城市 \$\{done\}\/\$\{totalTaskCount\}`[\s\S]*: '';/, '加载进度未追加省份/城市进度文案');
  assert.match(block, /setCrowdMatrixStatus\(`加载中 \$\{done\}\/\$\{totalTaskCount\} · \$\{detailText\}\$\{scopeProgressText\}`,\s*'loading'/, '加载状态文案未使用省份/城市进度拼接');
});

test('看板加载完成后状态条自动隐藏', () => {
  const block = getMagicReportBlock();
  assert.match(block, /if \(options\.autoHide === true\) \{[\s\S]*setTimeout\(\(\) => \{[\s\S]*classList\.add\('is-hidden'\)/, '状态条缺少自动隐藏逻辑');
  assert.match(block, /setCrowdMatrixStatus\('人群对比看板已加载完成（4列周期 × 8行维度）',\s*'success',\s*\{[\s\S]*autoHide:\s*true/, '加载完成后未开启状态自动隐藏');
});

test('人群维度列宽按文字内容自适应', () => {
  const block = getMagicReportBlock();
  assert.match(block, /grid-template-columns:\s*max-content repeat\(var\(--am-crowd-matrix-data-cols,\s*4\), minmax\(0,\s*1fr\)\);/, '首列宽度未改为文字自适应');
});

test('省份/城市维度支持横向拖拽浏览，且占比显示逻辑与其它维度一致', () => {
  const block = getMagicReportBlock();
  assert.match(block, /enableCrowdMatrixHorizontalDrag\(scrollerEl\)\s*\{/, '缺少横向拖拽绑定方法');
  assert.match(block, /const enableHorizontalScroll = normalizedGroupName === '省份' \|\| normalizedGroupName === '城市';/, '未将省份\/城市标记为横向滚动维度');
  assert.match(block, /wrap\.classList\.add\('is-horizontal-scroll'\);/, '省份\/城市单元格未开启横向滚动样式');
  assert.match(block, /chart\.style\.setProperty\('--am-crowd-label-min-width', `\$\{labelMinWidth\}px`\);/, '省份\/城市未按标签密度设置横向最小列宽');
  assert.match(block, /this\.enableCrowdMatrixHorizontalDrag\(wrap\);/, '省份\/城市单元格未绑定拖拽滚动行为');
  assert.match(block, /am-crowd-matrix-cell-chart\.is-horizontal-scroll[\s\S]*overflow-x:\s*auto;/, '省份\/城市单元格未启用横向滚动');
  assert.match(block, /am-crowd-matrix-cell-chart\.is-horizontal-scroll \.am-crowd-matrix-chart[\s\S]*min-width:\s*calc\(var\(--am-crowd-label-count,\s*1\) \* var\(--am-crowd-label-min-width,\s*58px\)\);/, '省份\/城市图表最小宽度未按标签数量扩展');
  assert.match(block, /am-crowd-matrix-grid\.am-show-ratio-values \.am-crowd-matrix-bar-ratio[\s\S]*opacity:\s*1;/, '占比显示态未沿用全局逻辑');
  assert.doesNotMatch(block, /am-show-ratio-values[\s\S]*am-crowd-matrix-cell-chart\.is-horizontal-scroll \.am-crowd-matrix-bar-ratio[\s\S]*opacity:\s*0;/, '省份\/城市占比不应单独覆盖为悬停显示');
});

test('省份/城市默认各周期独立排序，并可点击表头图标切换到主周期优先', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const shouldUseStableSort = isPriorityGroupSort\(groupName\);/, '未按分组排序模式控制稳定标签开关');
  assert.match(block, /const stableLabels = shouldUseStableSort \? stableLabelMap\.get\(normalizedGroupName\) : null;/, '默认排序未回落到各周期独立标签');
  assert.match(block, /rowHeader\.classList\.add\('has-sort-toggle'\);/, '省份\/城市行头未启用排序开关布局');
  assert.match(block, /sortBtn\.dataset\.crowdGroupSortToggle = normalizedGroupName;/, '排序图标未写入分组标识');
  assert.match(block, /sortBtn\.textContent = '⇅';/, '排序图标字符未渲染');
  assert.match(block, /this\.matrixGridEl\.addEventListener\('click', \(e\) => \{[\s\S]*target\.closest\('\[data-crowd-group-sort-toggle\]'\)[\s\S]*this\.toggleCrowdGroupSortMode\(groupName\);/, '排序图标点击未绑定模式切换');
  assert.match(block, /const nextMode = this\.getCrowdGroupSortMode\(normalizedGroupName\) === 'priority' \? 'period' : 'priority';/, '排序切换逻辑未在默认与主周期优先之间切换');
  assert.match(block, /const modeText = nextMode === 'priority' \? '主周期优先（90→30→7→3）' : '各周期独立排序';/, '排序切换后的状态文案未区分两种模式');
});

test('柱状图悬停提示使用即时 tooltip（data-tooltip）并绑定网格鼠标事件', () => {
  const block = getMagicReportBlock();
  assert.match(block, /bindCrowdMatrixHoverTipEvents\(\)\s*\{/, '缺少柱状图悬停事件绑定方法');
  assert.match(block, /showCrowdMatrixHoverTip\(tipText,\s*event\.clientX,\s*event\.clientY\);/, '悬停时未即时显示 tooltip');
  assert.match(block, /const linkedBars = this\.activateCrowdMatrixHoverBars\(bar\);/, '悬停时未先获取跨周期联动柱集合');
  assert.match(block, /const tipText = this\.buildCrowdMatrixHoverTipText\(bar,\s*linkedBars\);/, '悬停时未构造跨周期提示文案');
  assert.match(block, /bar\.dataset\.tooltip\s*=\s*tooltipText;/, '柱状图未写入 data-tooltip');
  assert.match(block, /const shouldAppendYuan = crowdGroup === '省份' \|\| crowdGroup === '城市';/, '省份\/城市悬停提示未启用金额单位逻辑');
  assert.match(block, /const countDisplay = shouldAppendYuan && !\/元\$\/\.test\(rawCountDisplay\) \? `\$\{rawCountDisplay\}元` : rawCountDisplay;/, '跨周期悬停提示未为省份\/城市追加元单位');
  assert.match(block, /bar\.dataset\.labelIndex = String\(labelIdx\);/, '柱状图未写入标签索引');
  assert.match(block, /bar\.dataset\.crowdGroup = String\(groupName \|\| ''\);/, '柱状图未写入维度分组标记');
  assert.match(block, /bar\.dataset\.metricLabel = String\(metricMeta\.seriesLabel \|\| ''\);/, '柱状图未写入系列名称');
  assert.match(block, /bar\.dataset\.ratio = String\(ratio\);/, '柱状图未写入占比数值');
  assert.match(block, /const tooltipCountDisplay = \(normalizedGroupName === '省份' \|\| normalizedGroupName === '城市'\) && !\/元\$\/\.test\(String\(countDisplay \|\| ''\)\)/, '单柱 fallback tooltip 未按省份\/城市追加元单位');
  assert.match(block, /const tooltipText = `\$\{metricMeta\.seriesLabel\}: \$\{this\.formatCrowdPercent\(ratio\)\}（\$\{tooltipCountDisplay\}）\$\{cell\?\.noData\?\.\[metric\] \? ' 无数据' : ''\}`;/, '单柱 fallback tooltip 未使用带元单位的金额文案');
  assert.match(block, /const periodCompareMap = \{\s*3:\s*7,\s*7:\s*30,\s*30:\s*90\s*\};/, '跨周期 pt 对比链路未按 3→7→30→90 定义');
  assert.match(block, /const diffPt = item\.ratio - compareItem\.ratio;/, '跨周期提示文案未按相邻周期计算差异 pt');
  assert.match(block, /diffLabel = `（\$\{this\.formatCrowdPtDiff\(diffPt\)\}）`;/, '跨周期提示文案未按括号格式输出差异 pt');
  assert.match(block, /const orderedMetrics = anchorMetric[\s\S]*\? \[anchorMetric,\s*\.\.\.visibleMetrics\.filter\(metric => metric !== anchorMetric\)\][\s\S]*: visibleMetrics\.slice\(\);/, '悬停提示未按可见人群构造动态列顺序');
  assert.match(block, /const scopeMetricMap = this\.getCrowdMatrixHoverMetricScopeMap\(anchorLabelIndex,\s*anchorCrowdGroup\);/, '悬停提示未读取预构建指标索引');
  assert.match(block, /const scopeMap = scopeMetricMap\.get\(metric\);/, '悬停提示未按人群类型读取缓存映射');
  assert.match(block, /const compareMetricLabels = orderedMetricLabels\.slice\(1\);/, '悬停提示未提取对比人群列表');
  assert.match(block, /const header = \[metricLabel,\s*labelName,\s*compareMetricLabels\.length \? `对比人群：\$\{compareMetricLabels\.join\('、'\)\}` : ''\]\.filter\(Boolean\)\.join\(' · '\);/, '悬停提示标题未按多人群拼接对比人群文案');
  assert.match(block, /const extraMetrics = orderedMetrics\.slice\(1\);/, '悬停提示未构造额外人群列');
  assert.match(block, /const extraCells = extraMetrics\.map\(\(metric\) => \{/, '悬停提示未按可见人群生成动态列数据');
  assert.match(block, /ratioLabel:\s*metricItem \? this\.formatCrowdHoverPercent\(metricItem\.ratio\) : ''/, '悬停提示缺数据时未隐藏对比占比');
  assert.match(block, /countLabel:\s*metricItem \? String\(metricItem\.countDisplay \|\| ''\) : ''/, '悬停提示缺数据时未隐藏对比数值');
  assert.match(block, /const metricHeaderLine = orderedMetricLabels\.length \? `__METRICS__\|\$\{orderedMetricLabels\.join\('\|'\)\}` : '';/, '悬停提示未写入人群列头元数据');
  assert.match(block, /const contentLines = metricHeaderLine \? \[metricHeaderLine,\s*\.\.\.lines\] : lines;/, '悬停提示未将列头插入第一行');
  assert.match(block, /const countLabelMax = items\.reduce\(\(maxLen, item\) => \{[\s\S]*item\.countDisplay[\s\S]*\}, 0\);/, '提示文案未计算末尾具体数值列宽');
  assert.match(block, /const countLabel = item\.countDisplay\.padStart\(countLabelMax, ' '\);/, '提示文案末尾具体数值未做对齐');
  assert.match(block, /const diffLabelMax = rows\.reduce\(\(maxLen, row\) => Math\.max\(maxLen, row\.diffLabel\.length\), 0\);/, '提示文案未计算 pt 差异列宽');
  assert.match(block, /const diffColumn = row\.diffLabel\.padEnd\(diffLabelMax, ' '\);/, '提示文案未为缺失 pt 差异补齐占位宽度');
  assert.match(block, /if \(bodyLines\.length && bodyLines\[0\]\.startsWith\('__METRICS__\|'\)\) \{/, 'tooltip HTML 未读取第一行人群列头');
  assert.match(block, /const metricHeaderHtml = metricLabels\.length[\s\S]*am-crowd-matrix-hover-tip-row-metrics/, 'tooltip HTML 未渲染人群名称第一行');
  assert.match(block, /const compareCells = compareParts\.map\(\(part\) => \{/, 'tooltip HTML 未按动态列拆分对比数据');
  assert.match(block, /while \(compareCells\.length < compareMetricLabels\.length\) \{/, 'tooltip HTML 未按可见人群补齐动态列');
  assert.match(block, /const gridTemplateParts = \[[\s\S]*\];/, 'tooltip HTML 未初始化动态网格模板');
  assert.match(block, /gridTemplateParts\.push\('max-content'\);/, 'tooltip HTML 未追加末尾标记列宽');
  assert.match(block, /const tableStyle = `--am-crowd-hover-grid-template:\$\{gridTemplateParts\.join\(' '\)\};`;/, 'tooltip HTML 未写入动态网格模板样式');
  assert.match(block, /am-crowd-matrix-hover-tip-col am-crowd-matrix-hover-tip-col-compare-ratio/, 'tooltip HTML 未渲染对比占比列');
  assert.match(block, /am-crowd-matrix-hover-tip-col am-crowd-matrix-hover-tip-col-compare-count/, 'tooltip HTML 未渲染对比数值列');
  assert.doesNotMatch(block, /`VS \$\{compareMetricLabel\}`/, '悬停提示仍包含 VS 文案');
  assert.doesNotMatch(block, /compareRatioLabel[\s\S]*:\s*'--'/, '悬停提示对比占比仍使用 -- 占位符，未按要求隐藏空值');
  assert.doesNotMatch(block, /compareCountLabel[\s\S]*:\s*'--'/, '悬停提示对比数值仍使用 -- 占位符，未按要求隐藏空值');
  assert.doesNotMatch(block, /vs\$\{compareLabel\}/, '提示文案仍包含 vs过去N天 文案');
  assert.match(block, /const tipHtml = this\.formatCrowdMatrixHoverTipHtml\(content\);/, 'tooltip 未构造 HTML 提示内容');
  assert.match(block, /tip\.innerHTML = tipHtml;/, 'tooltip 未按 HTML 方式渲染分色内容');
  assert.match(block, /diffClass = diffValue\.startsWith\('\+'\)\s*\?\s*'is-pos'\s*:\s*\(diffValue\.startsWith\('-'\)\s*\?\s*'is-neg'\s*:\s*'is-neutral'\);/, 'pt 差异颜色分类逻辑缺失');
  assert.match(block, /am-crowd-matrix-hover-tip[\s\S]*white-space:\s*pre-wrap;/, 'tooltip 样式未开启对齐换行显示');
  assert.match(block, /am-crowd-matrix-hover-tip-line[\s\S]*white-space:\s*pre;/, 'tooltip 行样式未启用预格式化对齐');
  assert.match(block, /am-crowd-matrix-hover-tip[\s\S]*background:\s*linear-gradient\(145deg,\s*rgba\(248,\s*252,\s*255,\s*0\.95\)\s*0%,\s*rgba\(238,\s*246,\s*255,\s*0\.92\)\s*100%\);/, 'tooltip 背景未对齐看板浅蓝玻璃风格');
  assert.match(block, /am-crowd-matrix-hover-tip[\s\S]*border:\s*1px solid rgba\(255,\s*255,\s*255,\s*0\.82\);/, 'tooltip 边框未与看板卡片风格统一');
  assert.match(block, /am-crowd-matrix-hover-tip[\s\S]*color:\s*#56647d;/, 'tooltip 主文字未调整为浅灰蓝');
  assert.match(block, /am-crowd-matrix-hover-tip-row-metrics[\s\S]*border-bottom:\s*1px dashed rgba\(31,\s*53,\s*109,\s*0\.12\);/, 'tooltip 列头分隔线未统一为看板风格');
  assert.match(block, /am-crowd-matrix-hover-tip-row-metrics[\s\S]*color:\s*#6c7890;/, 'tooltip 列头文字未统一为看板辅色');
  assert.match(block, /am-crowd-matrix-hover-tip-col-compare-ratio[\s\S]*color:\s*#56647d;/, 'tooltip 对比占比列未使用浅灰蓝主色');
  assert.match(block, /am-crowd-matrix-hover-tip-col-compare-count[\s\S]*color:\s*#56647d;/, 'tooltip 对比数值列未使用浅灰蓝主色');
  assert.match(block, /am-crowd-matrix-hover-tip-col-flag[\s\S]*color:\s*#7f8aa0;/, 'tooltip 标记列未使用更浅辅色');
  assert.match(block, /am-crowd-matrix-hover-tip-diff\.is-pos[\s\S]*color:\s*#0f766e;/, 'pt 正向差异未切换为浅色主题配色');
  assert.match(block, /am-crowd-matrix-hover-tip-diff\.is-neg[\s\S]*color:\s*#b42318;/, 'pt 负向差异未切换为浅色主题配色');
  assert.match(block, /am-crowd-matrix-hover-tip-diff\.is-neutral[\s\S]*color:\s*#a16207;/, 'pt 中性差异未切换为浅色主题配色');
  assert.match(block, /am-crowd-matrix-hover-tip[\s\S]*font-family:\s*var\(--am26-font,\s*-apple-system,\s*BlinkMacSystemFont,\s*"Segoe UI",\s*"PingFang SC",\s*"Hiragino Sans GB",\s*"Microsoft YaHei",\s*sans-serif\);/, 'tooltip 字体未与看板风格统一');
  assert.match(block, /am-crowd-matrix-hover-tip[\s\S]*font-variant-numeric:\s*tabular-nums;/, 'tooltip 样式未启用等宽数字显示');
  assert.match(block, /am-crowd-matrix-hover-tip-row[\s\S]*--am-crowd-hover-grid-template/, 'tooltip 样式未使用动态网格模板变量');
  assert.match(block, /am-crowd-matrix-hover-tip-row-metrics/, 'tooltip 样式未声明第一行人群名称样式');
  assert.match(block, /am-crowd-matrix-hover-tip-col-compare-ratio[\s\S]*text-align:\s*right;/, 'tooltip 对比占比列未右对齐');
  assert.match(block, /am-crowd-matrix-hover-tip-col-compare-count[\s\S]*text-align:\s*right;/, 'tooltip 对比数值列未右对齐');
  assert.match(block, /this\.buildCrowdMatrixHoverMetricIndex\(\);/, '看板渲染后未预构建悬停缓存');
  assert.doesNotMatch(block, /bar\.title\s*=\s*`/, '柱状图仍在使用 title 作为提示，存在延迟显示问题');
});

test('柱组之间提供轻量竖向分隔线，提升横向可读性', () => {
  const block = getMagicReportBlock();
  assert.match(block, /am-crowd-matrix-bar-group \+ \.am-crowd-matrix-bar-group::before/, '缺少柱组间分隔线选择器');
  assert.match(block, /background:\s*linear-gradient\(180deg,\s*rgba\(127,\s*140,\s*169,\s*0\),\s*rgba\(127,\s*140,\s*169,\s*0\.16\),\s*rgba\(127,\s*140,\s*169,\s*0\)\);/, '分隔线未使用弱化渐变样式');
});

test('周期图例切换会过滤渲染列，且不再生成 peak badge 提示', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const periods = this\.getVisibleCrowdPeriods\(Array\.isArray\(dataset\.periods\) \? dataset\.periods : \[\]\);/, '渲染时未按周期显隐过滤列');
  assert.match(block, /table\.style\.setProperty\('--am-crowd-matrix-data-cols', String\(Math\.max\(1, periods\.length\)\)\);/, '表格列数未随可见周期动态调整');
  assert.doesNotMatch(block, /peak\.className\s*=\s*'am-crowd-matrix-peak-badge'/, '仍在生成 peak badge，未移除顶部提示');
});

test('单元格不再渲染 am-crowd-matrix-cell-title，保持页面更简洁', () => {
  const block = getMagicReportBlock();
  assert.doesNotMatch(block, /title\.className\s*=\s*'am-crowd-matrix-cell-title'/, '单元格标题节点仍在渲染');
});

test('单元格不再显示“部分系列无数据，已按 0 展示”提示', () => {
  const block = getMagicReportBlock();
  assert.doesNotMatch(block, /note\.textContent\s*=\s*'部分系列无数据，已按 0 展示'/, '无数据提示仍在渲染');
});

test('buildMatrixDataset 生成固定 4x8 结构并包含四系列与 raw/noData 字段', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const periods = this\.CROWD_PERIODS\.slice\(\);/, '缺少周期列表初始化');
  assert.match(block, /const groups = this\.CROWD_GROUP_ORDER\.slice\(\);/, '缺少维度列表初始化');
  assert.match(block, /const stableGroupSet = new Set\(/, '缺少省份\/城市稳定标签集合初始化');
  assert.match(block, /const groupSortModeMap = options\?\.groupSortModeMap && typeof options\.groupSortModeMap === 'object'/, '缺少分组排序模式映射读取');
  assert.match(block, /const stableLabelMap = new Map\(\);/, '缺少稳定标签映射缓存');
  assert.match(block, /if \(!stableGroupSet\.has\(normalizedGroupName\)\) return;/, '稳定标签计算未限定在省份\/城市');
  assert.match(block, /const periodSortPriority = Array\.isArray\(this\.CROWD_GROUP_SORT_PERIOD_PRIORITY\) && this\.CROWD_GROUP_SORT_PERIOD_PRIORITY\.length/, '稳定标签排序未读取主周期优先配置');
  assert.match(block, /for \(const period of periodSortPriority\) \{[\s\S]*periodDiff[\s\S]*if \(Math\.abs\(periodDiff\) > 1e-9\) return periodDiff;/, '稳定标签排序未按主周期优先比较');
  assert.match(block, /const scoreDiff = this\.toNumericValue\(rightMeta\.score\) - this\.toNumericValue\(leftMeta\.score\);/, '稳定标签排序未按累计值降序');
  assert.match(block, /const stableLabels = shouldUseStableSort \? stableLabelMap\.get\(normalizedGroupName\) : null;/, '周期渲染未按模式读取稳定标签映射');
  assert.match(block, /const labelList = Array\.isArray\(stableLabels\) && stableLabels\.length[\s\S]*\? stableLabels\.slice\(\)[\s\S]*: \[\];/, '周期标签列表未优先使用稳定顺序');
  assert.match(block, /cell\[\`\$\{metric\}Raw`\] = \[\];/, 'cellData 未动态初始化 raw 字段');
  assert.match(block, /cell\.noData\[metric\] = true;/, 'cellData 未动态初始化 noData 字段');
  assert.match(block, /nextCell\[`\$\{metric\}Raw`\] = rawList\.length \? rawList : rawValues;/, 'cellData 未写入动态 raw 数据');
});

test('buildMatrixDataset 在单指标内做比例归一化并标记缺失数据', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const sum = rawValues\.reduce\(\(acc, value\) => acc \+ this\.toNumericValue\(value\), 0\);/, '未按单指标计算总量');
  assert.match(block, /return \(this\.toNumericValue\(value\) \/ sum\) \* 100;/, '未按单指标归一化到百分比');
  assert.match(block, /nextCell\.noData\[metric\] = !labelList\.length \|\| sum <= 0;/, '缺失数据未标记 noData');
});

test('单元格柱高按该单元格最高值自适应缩放，避免整体过矮', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const visibleMetrics = metrics\.filter\(metric => this\.getCrowdMetricVisible\(metric\)\);/, '未按可见系列过滤最高柱值计算范围');
  assert.match(block, /const cellMaxRatio = scaleMetrics\.reduce\(\(maxValue, metric\) => \{[\s\S]*return Math\.max\(maxValue, currentMax\);[\s\S]*\}, 0\);/, '未按可见系列计算单元格内最高柱值');
  assert.match(block, /const normalizedMax = cellMaxRatio > 0 \? cellMaxRatio : 1;/, '缺少单元格缩放基准');
  assert.match(block, /const barHeight = `\$\{Math\.max\(0, Math\.min\(100, \(ratio \/ normalizedMax\) \* 100\)\)\}%`;/, '柱高目标值未按单元格最高值计算');
});

test('切换显示与隐藏会触发重绘动画', () => {
  const block = getMagicReportBlock();
  assert.match(block, /this\.renderCrowdMatrixCharts\(this\.crowdMatrixDataset,\s*\{\s*animate:\s*true\s*\}\);/, '显示隐藏切换未触发带动画重绘');
  assert.match(block, /chart\.style\.setProperty\('--am-crowd-metric-visible-count', String\(visibleMetricCount\)\);/, '切换后未写入可见系列数量，柱宽无法自适应');
  assert.match(block, /width:\s*clamp\(\s*8px,\s*calc\(\(100% - \(var\(--am-crowd-visible-metrics\) - 1\) \* var\(--am-crowd-bar-gap\)\) \/ var\(--am-crowd-visible-metrics\)\),\s*36px\s*\);/, '柱宽未按可见系列数量做自适应公式');
  assert.match(block, /ratioLabel\.className = 'am-crowd-matrix-bar-ratio';/, '柱状图未渲染占比标签节点');
  assert.match(block, /ratioLabel\.textContent = this\.formatCrowdPercent\(ratio\);/, '占比标签未按百分比渲染');
  assert.match(block, /am-crowd-matrix-grid\.am-show-ratio-values \.am-crowd-matrix-bar-ratio/, '缺少占比显示态样式选择器');
  assert.match(block, /am-crowd-matrix-grid\.am-hide-insights \.am-crowd-matrix-insights/, '缺少提示区隐藏态样式选择器');
  assert.match(block, /am-crowd-matrix-grid\.am-hide-insights \.am-crowd-matrix-cell-chart[\s\S]*min-height:\s*clamp\(186px,\s*22vh,\s*276px\);/, '隐藏提示后未压缩单元格高度');
  assert.match(block, /am-crowd-matrix-grid\.am-hide-insights \.am-crowd-matrix-chart[\s\S]*min-height:\s*clamp\(136px,\s*17vh,\s*208px\);/, '隐藏提示后未压缩图表区高度');
  assert.match(block, /am-crowd-matrix-insights[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\);/, '提示区未改为单列逐行显示');
  assert.match(block, /am-crowd-matrix-insight-item[\s\S]*justify-content:\s*flex-start;[\s\S]*text-align:\s*left;/, '提示文案未改为左对齐逐行阅读');
  assert.match(block, /if \(animateBars\) \{[\s\S]*fill\.style\.height = '0%';[\s\S]*fill\.style\.opacity = '0\.38';/, '柱状图切换动画初始状态缺失');
  assert.match(block, /requestAnimationFrame\(applyHeight\)/, '柱状图切换动画缺少 requestAnimationFrame 过渡');
});

test('全部失败时展示统一失败态并提供重试入口', () => {
  const block = getMagicReportBlock();
  assert.match(block, /if \(!successResults\.length\) \{[\s\S]*setCrowdMatrixStatus\('人群看板加载失败，请稍后重试',\s*'error',\s*\{[\s\S]*showRetry:\s*true/, '全失败态或重试按钮逻辑缺失');
  assert.match(block, /this\.matrixRetryBtn\.addEventListener\('click',\s*\(\) => \{[\s\S]*ensureCrowdMatrixLoaded\(true\);/, '重试按钮未绑定强制重载');
});

test('runTasksWithConcurrency 采用 allSettled 汇总，单任务失败不会提前中断队列', () => {
  const block = getMagicReportBlock();
  assert.match(block, /Promise\.race\(Array\.from\(executing\)\.map\(task => task\.catch\(\(\) => null\)\)\)/, '并发队列仍会因单任务失败提前中断');
  assert.match(block, /return Promise\.allSettled\(results\);/, '并发执行结果未按 allSettled 汇总');
});

test('extractPanelQueryConfFromDataQuery 支持递归扫描嵌套组件提取 queryExecutePlan', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const list = Array\.isArray\(componentList\) \? componentList\.slice\(\) : \[\];/, '未复制组件列表进行递归扫描');
  assert.match(block, /const childBuckets = \[[\s\S]*component\?\.subComponentList,[\s\S]*component\?\.componentList,[\s\S]*properties\?\.componentList[\s\S]*\];/, '缺少嵌套组件桶递归扫描');
  assert.match(block, /if \(!queryExecutePlan && \(type === 'ADDITION' \|\| properties\?\.queryExecutePlan \|\| component\?\.queryExecutePlan \|\| component\?\.queryConf\?\.queryExecutePlan\)\) \{/, 'queryExecutePlan 提取未覆盖嵌套/兜底字段');
});

test('itemdeal 遇到跨店商品时会标记暂不可用并返回空结果', () => {
  const block = getMagicReportBlock();
  assert.match(block, /extractCrowdUnsupportedReason\(componentList\)\s*\{/, '缺少跨店商品不可用识别方法');
  assert.match(block, /if \(\/商品所属店铺与当前店铺不一致\|不支持查询其\[它他\]店铺商品的人群画像\/\.test\(serialized\)\) \{\s*return '商品成交人群暂不可用（跨店商品）';/, '跨店商品不可用文案识别缺失');
  assert.match(block, /const unsupportedReason = metric === 'itemdeal'\s*\?\s*this\.extractCrowdUnsupportedReason\(componentList\)\s*:\s*'';/, 'itemdeal 首查未识别跨店不可用');
  assert.match(block, /if \(baseResult\.unsupportedReason\) \{[\s\S]*groupMap:\s*\{\},[\s\S]*unsupportedReason:\s*baseResult\.unsupportedReason/, '跨店不可用未走空结果兜底分支');
});

test('跨店商品暂不可用会单独提示，且不计入失败数', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const unsupportedReasonSet = new Set\(\);/, '缺少暂不可用原因集合');
  assert.match(block, /const reason = String\(item\.value\?\.rawMeta\?\.unsupportedReason \|\| ''\)\.trim\(\);/, '未从任务结果读取暂不可用原因');
  assert.match(block, /const unsupportedNotice = Array\.from\(unsupportedReasonSet\)\.filter\(Boolean\)\.join\('；'\);/, '暂不可用原因聚合缺失');
  assert.match(block, /const unsupportedSuffix = unsupportedNotice \? `；\$\{unsupportedNotice\}` : '';/, '部分失败文案未追加暂不可用提示');
  assert.match(block, /else if \(unsupportedNotice\) \{[\s\S]*setCrowdMatrixStatus\(`人群对比看板已加载完成；\$\{unsupportedNotice\}`,\s*'warn'/, '无失败时未展示暂不可用提示');
});

test('强制刷新商品ID会绕过底层缓存并禁用缓存 hint', () => {
  const block = getMagicReportBlock();
  assert.match(block, /if \(!preferCache\) \{[\s\S]*PlanIdentityUtils\.campaignItemIdCache\.delete\(id\);[\s\S]*\}/, '强制刷新未清理共享缓存');
  assert.match(block, /if \(!preferCache\) \{[\s\S]*PlanIdentityUtils\.campaignItemCandidatesCache\.delete\(id\);[\s\S]*\}/, '强制刷新未清理商品候选缓存');
  assert.match(block, /PlanIdentityUtils\.resolveItemIdByCampaignId\([\s\S]*allowCacheFallback \? \(fromCache \|\| ''\) : ''[\s\S]*\{\s*preferCache\s*\}\s*\)/, '强制刷新未透传 preferCache 参数');
  assert.match(source, /async resolveItemIdByCampaignId\(campaignId, bizCandidates, authContext, fallbackItemId = '', traceMessages = null, options = \{\}\)/, 'PlanIdentity 商品ID解析未支持 options');
  assert.match(source, /const preferCache = options\?\.preferCache !== false;/, 'PlanIdentity 商品ID解析未读取 preferCache');
  assert.match(source, /if \(cached && preferCache\) \{/, 'PlanIdentity 商品ID解析仍无条件命中缓存');
  assert.match(source, /this\.findConflictRefs\(normalizedCampaignId,\s*currentBiz,\s*authContext,\s*'',\s*\{\s*allowCacheHint:\s*preferCache\s*\}\)/, '冲突接口未按 preferCache 控制缓存 hint');
});

test('itemdeal 会遍历候选商品ID并优先使用可查询结果', () => {
  const block = getMagicReportBlock();
  assert.match(source, /campaignItemCandidatesCache:\s*new Map\(\)/, 'PlanIdentity 缺少商品候选缓存');
  assert.match(source, /rememberCampaignItemIdCandidates\(campaignId,\s*itemIds = \[\],\s*options = \{\}\)\s*\{/, 'PlanIdentity 缺少候选商品缓存写入方法');
  assert.match(source, /extractItemIdCandidatesFromCampaignPayload\(payload = \{\},\s*expectedCampaignId = ''\)\s*\{/, 'PlanIdentity 缺少计划详情候选商品提取方法');
  assert.match(block, /getCrowdCampaignItemCandidates\(campaignId,\s*preferredItemId = ''\)\s*\{/, 'MagicReport 缺少候选商品聚合方法');
  assert.match(block, /const queryItemDealByCandidate = async \(seedItemId = '',\s*options = \{\}\) => \{/, 'itemdeal 缺少候选商品逐个探测逻辑');
  assert.match(block, /const candidates = lockedItemId[\s\S]*:\s*this\.getCrowdCampaignItemCandidates\(id,\s*seedItemId\);/, 'itemdeal 未读取候选商品列表');
  assert.match(block, /const resolvedByCandidates = await queryItemDealByCandidate\(itemId,\s*\{[\s\S]*allowAutoPick:\s*!lockToSelectedItem[\s\S]*\}\);/, 'itemdeal 首查未走候选商品探测');
  assert.match(block, /const refreshedByCandidates = await queryItemDealByCandidate\(itemId,\s*\{[\s\S]*allowAutoPick:\s*true[\s\S]*\}\);/, 'itemdeal 强刷后未走候选商品探测');
});

test('计划详情命中白名单商品时会继续查询单元详情，并仅作为回退候选', () => {
  assert.match(source, /extractWeakItemIdCandidatesFromCampaignPayload\(payload = \{\},\s*expectedCampaignId = ''\)\s*\{/, 'PlanIdentity 缺少弱商品候选提取方法');
  assert.match(source, /const weakCandidateSet = new Set\(Array\.isArray\(detail\?\.weakItemIdCandidates\) \? detail\.weakItemIdCandidates : \[\]\);/, '未构建弱候选集合');
  assert.match(source, /if \(resolvedByCampaign && !resolvedByCampaignIsWeak\) \{[\s\S]*计划详情命中/, '非弱候选未直接使用计划详情结果');
  assert.match(source, /if \(resolvedByCampaign && resolvedByCampaignIsWeak\) \{[\s\S]*继续查单元详情校准/, '白名单候选未继续查询单元详情校准');
  assert.match(source, /if \(resolvedByCampaign\) \{[\s\S]*回退计划详情候选/, '白名单候选缺少最终回退分支');
});
