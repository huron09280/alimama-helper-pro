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
  const match = block.match(/buildMetricPrompt\(\{ campaignId, metricType, itemId = '' \}\)\s*\{([\s\S]*?)\n\s*\},\n\s*\n\s*parseSseEvents\(/);
  assert.ok(match, '无法定位 buildMetricPrompt 代码块');
  return match[1];
}

test('MagicReport 声明人群看板固定周期/维度/指标常量', () => {
  const block = getMagicReportBlock();
  assert.match(block, /CROWD_PERIODS:\s*\[\s*3\s*,\s*7\s*,\s*30\s*,\s*90\s*\]/, '缺少 4 周期常量或顺序不符');
  assert.match(block, /CROWD_GROUP_ORDER:\s*\[\s*'消费能力等级'\s*,\s*'月均消费金额'\s*,\s*'用户年龄'\s*,\s*'用户性别'\s*,\s*'城市等级'\s*,\s*'店铺潜新老客'\s*\]/, '缺少 6 维度常量或顺序不符');
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
    'buildCrowdMatrixHoverTipText',
    'activateCrowdMatrixHoverBars',
    'getCrowdPeriodVisible',
    'getVisibleCrowdPeriods',
    'getCrowdRatioVisible',
    'getCrowdInsightsVisible',
    'applyCrowdMetricVisibility',
    'normalizeMagicView',
    'getMagicDefaultView',
    'setMagicDefaultView',
    'refreshMagicViewTabDefaultState',
    'cacheCrowdCampaignItemId',
    'getCrowdCampaignItemId',
    'maximizePopupForMatrix',
    'restorePopupFromMatrix',
    'buildMetricPrompt',
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

test('万能查数快捷话术包含“✨商品ID成交”，并支持商品ID占位替换', () => {
  const block = getMagicReportBlock();
  assert.match(block, /label:\s*'✨商品ID成交'\s*,\s*value:\s*'商品ID：\{商品ID\}\s*成交人群分析'/, '快捷话术缺少商品ID成交按钮');
  assert.match(block, /if \(resolved\.includes\('\{商品ID\}'\) \|\| resolved\.includes\('\{itemId\}'\)\) \{/, 'resolvePromptText 未处理商品ID占位');
  assert.match(block, /itemId = await this\.resolveCrowdItemIdByCampaign\(campaignId\);/, '商品ID占位未按计划自动补齐商品ID');
  assert.match(block, /resolved = resolved[\s\S]*replace\(\/\\\{商品ID\\\}\/g, itemId\)/, '商品ID占位未正确替换');
});

test('周期覆写使用 panelDataQuery，且请求体包含 queryConf.period/queryExecutePlan/timeMode', () => {
  const block = getMagicReportBlock();
  assert.match(block, /requestCrowdApi\('\/ai\/report\/panelDataQuery\.json'/, '未调用 panelDataQuery 接口');
  assert.match(block, /queryConf:\s*\{[\s\S]*period:\s*\[\s*\{\s*timeInfo:\s*`过去\$\{days\}天`\s*\}\s*\]/, 'queryConf.period 未按周期写入');
  assert.match(block, /queryExecutePlan:\s*String\(queryExecutePlan\s*\|\|\s*''\)\.trim\(\)/, 'queryConf 缺少 queryExecutePlan');
  assert.match(block, /timeMode:\s*String\(timeMode\s*\|\|\s*'\{"timeInfo":"过去7天","timeMode":"slidedTime"\}'\)/, 'queryConf 缺少 timeMode');
  assert.match(block, /timeInfo:\s*`过去\$\{days\}天`/, 'queryConf 缺少 timeInfo 覆写');
});

test('extractGroupList 同时兼容 CHART_GROUP.groupList 与 subComponentList.properties.groupList', () => {
  const block = getMagicReportBlock();
  assert.match(block, /if \(Array\.isArray\(current\.groupList\) && current\.groupList\.length\) return current\.groupList;/, '未读取 CHART_GROUP.groupList');
  assert.match(block, /if \(Array\.isArray\(current\?\.properties\?\.groupList\) && current\.properties\.groupList\.length\) return current\.properties\.groupList;/, '未兜底读取 subComponentList.properties.groupList');
  assert.match(block, /if \(Array\.isArray\(current\.subComponentList\) && current\.subComponentList\.length\)/, '未遍历 subComponentList 进行递归兜底');
});

test('queryCrowdInsight 采用 dataQuery 首查 + panelDataQuery 周期覆写的混合链路', () => {
  const block = getMagicReportBlock();
  assert.match(block, /requestCrowdApi\('\/ai\/report\/dataQuery\.json'/, '缺少 dataQuery 首查调用');
  assert.match(block, /itemId = await this\.resolveCrowdItemIdByCampaign\(id\);/, '商品成交人群未先按计划识别商品ID');
  assert.match(block, /throw new Error\(`未识别到计划 \$\{id\} 对应商品ID`\);/, '商品成交人群缺少商品ID识别失败提示');
  assert.match(block, /if \(days === 7\) \{[\s\S]*requestPath: baseResult\.requestPath/, '7 天分支未复用首查结果');
  assert.match(block, /const panelResult = await this\.queryPanelPeriod\(/, '非 7 天分支未走 panel 周期覆写');
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

test('看板计划信息展示计划名/计划ID/商品ID', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const itemId = this\.getCrowdCampaignItemId\(id\);/, '计划信息未读取商品ID');
  assert.match(block, /`计划名：\$\{name \|\| '未识别'\} ｜ 计划ID：\$\{id \|\| '--'\} ｜ 商品ID：\$\{itemId \|\| '--'\}`/, '计划信息文案缺少商品ID展示');
});

test('看板状态区仅展示最新一行日志，并支持进度条背景变量', () => {
  const block = getMagicReportBlock();
  assert.match(block, /split\(\/\\r\?\\n\/\)/, '状态文案未按行切分');
  assert.match(block, /style\.setProperty\('--am-crowd-progress', `\$\{nextProgress\}%`\);/, '状态区未写入进度条变量');
  assert.match(block, /textNode\.className = 'am-crowd-matrix-state-text';/, '状态区未使用单行文本节点');
  assert.match(block, /this\.matrixStateEl\.replaceChildren\(textNode\);/, '状态区未替换为最新单行日志');
});

test('看板加载完成后状态条自动隐藏', () => {
  const block = getMagicReportBlock();
  assert.match(block, /if \(options\.autoHide === true\) \{[\s\S]*setTimeout\(\(\) => \{[\s\S]*classList\.add\('is-hidden'\)/, '状态条缺少自动隐藏逻辑');
  assert.match(block, /setCrowdMatrixStatus\('人群对比看板已加载完成（4列周期 × 6行维度）',\s*'success',\s*\{[\s\S]*autoHide:\s*true/, '加载完成后未开启状态自动隐藏');
});

test('人群维度列宽按文字内容自适应', () => {
  const block = getMagicReportBlock();
  assert.match(block, /grid-template-columns:\s*max-content repeat\(var\(--am-crowd-matrix-data-cols,\s*4\), minmax\(0,\s*1fr\)\);/, '首列宽度未改为文字自适应');
});

test('柱状图悬停提示使用即时 tooltip（data-tooltip）并绑定网格鼠标事件', () => {
  const block = getMagicReportBlock();
  assert.match(block, /bindCrowdMatrixHoverTipEvents\(\)\s*\{/, '缺少柱状图悬停事件绑定方法');
  assert.match(block, /showCrowdMatrixHoverTip\(tipText,\s*event\.clientX,\s*event\.clientY\);/, '悬停时未即时显示 tooltip');
  assert.match(block, /const linkedBars = this\.activateCrowdMatrixHoverBars\(bar\);/, '悬停时未先获取跨周期联动柱集合');
  assert.match(block, /const tipText = this\.buildCrowdMatrixHoverTipText\(bar,\s*linkedBars\);/, '悬停时未构造跨周期提示文案');
  assert.match(block, /bar\.dataset\.tooltip\s*=\s*tooltipText;/, '柱状图未写入 data-tooltip');
  assert.match(block, /bar\.dataset\.labelIndex = String\(labelIdx\);/, '柱状图未写入标签索引');
  assert.match(block, /bar\.dataset\.crowdGroup = String\(groupName \|\| ''\);/, '柱状图未写入维度分组标记');
  assert.match(block, /return items\.map\(\(item\) => \{[\s\S]*过去\$\{item\.period\}天[\s\S]*\}\)\.join\('\\n'\);/, '跨周期提示文案未按周期逐行拼接');
  assert.match(block, /am-crowd-matrix-hover-tip[\s\S]*white-space:\s*pre-line;/, 'tooltip 样式未开启多行换行显示');
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

test('buildMatrixDataset 生成固定 4x6 结构并包含四系列与 raw/noData 字段', () => {
  const block = getMagicReportBlock();
  assert.match(block, /const periods = this\.CROWD_PERIODS\.slice\(\);/, '缺少周期列表初始化');
  assert.match(block, /const groups = this\.CROWD_GROUP_ORDER\.slice\(\);/, '缺少维度列表初始化');
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
  assert.match(block, /if \(animateBars\) \{[\s\S]*fill\.style\.height = '0%';[\s\S]*fill\.style\.opacity = '0\.38';/, '柱状图切换动画初始状态缺失');
  assert.match(block, /requestAnimationFrame\(applyHeight\)/, '柱状图切换动画缺少 requestAnimationFrame 过渡');
});

test('全部失败时展示统一失败态并提供重试入口', () => {
  const block = getMagicReportBlock();
  assert.match(block, /if \(!successResults\.length\) \{[\s\S]*setCrowdMatrixStatus\('人群看板加载失败，请稍后重试',\s*'error',\s*\{[\s\S]*showRetry:\s*true/, '全失败态或重试按钮逻辑缺失');
  assert.match(block, /this\.matrixRetryBtn\.addEventListener\('click',\s*\(\) => \{[\s\S]*ensureCrowdMatrixLoaded\(true\);/, '重试按钮未绑定强制重载');
});
