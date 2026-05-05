import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getBlock(startMarker, endMarker = '') {
    const start = source.indexOf(startMarker);
    assert.ok(start > -1, `无法定位代码块起点: ${startMarker}`);
    if (!endMarker) return source.slice(start);
    const end = source.indexOf(endMarker, start + startMarker.length);
    if (end === -1 || end <= start) return source.slice(start);
    return source.slice(start, end);
}

test('趋势明星编辑态提供趋势主题专属设置入口', () => {
    const renderBlock = getBlock(
        'const renderSceneDynamicConfig = () => {',
        'const collectManualKeywordRowsFromPanel = (panel) => ('
    );

    assert.match(
        renderBlock,
        /activeKeywordGoalForRender === '趋势明星'[\s\S]*'趋势主题'[\s\S]*'选择趋势主题'[\s\S]*staticFieldTokenSet\.add/,
        '趋势明星未把趋势主题纳入专属静态控件'
    );
    assert.match(
        renderBlock,
        /hiddenKeywordFieldTokenSet[\s\S]*'campaign\.trendThemeList'/,
        '底层 campaign.trendThemeList JSON 字段未隐藏，可能与专属控件重复'
    );
    assert.match(
        renderBlock,
        /activeKeywordGoal === '趋势明星'[\s\S]*trigger:\s*'trendTheme'[\s\S]*buttonLabel:\s*'选择趋势主题'[\s\S]*fieldKey:\s*trendThemeField/,
        '趋势明星未渲染“选择趋势主题”弹窗入口'
    );
});

test('趋势主题弹窗读取原生推荐并按对象结构保存', () => {
    const helperBlock = getBlock(
        'const normalizeTrendThemeIdValue = (value = \'\') => {',
        'const CROWD_FILTER_GENDER_OPTIONS = ['
    );
    const popupBlock = getBlock(
        'const openKeywordTrendThemeSettingPopup = async (options = {}) => {',
        'const openCrowdItemSettingPopup = async () => {'
    );
    const styleBlock = getBlock(
        '#am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog.am-wxt-scene-popup-dialog-filter {',
        '#am-wxt-scene-popup-mask .am-wxt-scene-filter-layout {'
    );
    const trendLayoutStyleBlock = getBlock(
        '#am-wxt-scene-popup-mask .am-wxt-scene-trend-selected-dock {',
        '#am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-candidate-name .name,'
    );
    const trendMainStyleBlock = getBlock(
        '#am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-left.am-wxt-scene-trend-main {',
        '#am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-right {'
    );
    const trendToolbarInputStyleBlock = getBlock(
        '#am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-layout[data-scene-popup-trend-layout="1"] .am-wxt-scene-crowd-native-toolbar .am-wxt-input {',
        '#am-wxt-scene-popup-mask .am-wxt-scene-trend-selected-dock {'
    );
    const trendRankBoardStyleBlock = getBlock(
        '#am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-board {',
        '#am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-column {'
    );

    assert.match(
        helperBlock,
        /recommendThemeDefault\.json/,
        '趋势主题弹窗未读取原生默认主题接口'
    );
    assert.match(
        helperBlock,
        /recommendTheme\.json/,
        '趋势主题弹窗未读取原生推荐主题接口'
    );
    assert.match(
        helperBlock,
        /trendThemeId[\s\S]*trendThemeName[\s\S]*itemCount/,
        '趋势主题弹窗未按 trendThemeId/trendThemeName/itemCount 对象结构维护'
    );
    assert.match(
        helperBlock,
        /recommendItemCount[\s\S]*wcvr[\s\S]*weekCapacityChangeRatio[\s\S]*resourceType[\s\S]*tagText/,
        '趋势主题弹窗未保留原生红榜标签与手动联想指标字段'
    );
    assert.match(
        helperBlock,
        /collectTrendThemeRankLists[\s\S]*trendThemeInfo[\s\S]*effectThemeInfo[\s\S]*capacityThemeInfo/,
        '趋势主题弹窗未保留原生趋势/效果/流量三红榜独立列表'
    );
    assert.match(
        helperBlock,
        /trendRankList[\s\S]*effectRankList[\s\S]*trafficRankList/,
        '趋势主题弹窗原生推荐结果未输出三红榜分榜数据'
    );
    assert.match(
        popupBlock,
        /data-scene-popup-trend-candidate-list="trend"[\s\S]*data-scene-popup-trend-candidate-list="effect"[\s\S]*data-scene-popup-trend-candidate-list="traffic"/,
        '趋势主题弹窗未按三列并排渲染趋势/效果/流量榜单'
    );
    assert.match(
        popupBlock,
        /趋势红榜[\s\S]*趋势指数[\s\S]*推荐商品数[\s\S]*状态[\s\S]*效果红榜[\s\S]*投产指数[\s\S]*推荐商品数[\s\S]*标签[\s\S]*流量红榜[\s\S]*搜索指数[\s\S]*推荐商品数[\s\S]*标签/,
        '趋势主题弹窗未按原生同屏展示三榜单、对应指标列与最右标签列'
    );
    assert.match(
        popupBlock,
        /data-scene-popup-trend-association="1"[\s\S]*通过[\s\S]*关键词[\s\S]*本店宝贝[\s\S]*竞店宝贝[\s\S]*深度搜索[\s\S]*快捷联想已选趋势[\s\S]*趋势主题[\s\S]*推荐店铺商品数[\s\S]*收藏加购指数[\s\S]*投产指数[\s\S]*操作/,
        '趋势主题弹窗未增加原生风格手动联想搜索区'
    );
    assert.match(
        popupBlock,
        /data-scene-popup-trend-association-keyword-input="1"[\s\S]*data-scene-popup-trend-association-item-panel="1"[\s\S]*宝贝\/主体信息[\s\S]*data-scene-popup-trend-association-item-search="1"[\s\S]*placeholder="宝贝标题"[\s\S]*data-scene-popup-trend-association-item-list="1"/,
        '趋势主题联想区未按原生实现关键词输入与宝贝选择面板'
    );
    assert.doesNotMatch(
        popupBlock,
        /am-wxt-scene-crowd-native-manual|data-scene-popup-trend-manual|data-scene-popup-trend-manual-add|添加自定义主题|手动添加：主题/,
        '趋势主题弹窗仍保留多余的旧手动添加区域'
    );
    assert.match(
        popupBlock,
        /const fetchCompetitorAssociationItems = async[\s\S]*ai\/common\/searchItemPage\.json[\s\S]*similarItemQueryStr: normalizedQuery[\s\S]*collectTrendAssociationItemResponseList/,
        '趋势主题联想区未给竞店宝贝接入原生 AI 全网商品搜索接口'
    );
    assert.match(
        popupBlock,
        /const loadAssociationItems = async[\s\S]*itemType === 'competitorItem'[\s\S]*fetchCompetitorAssociationItems\(competitorQuery\)[\s\S]*searchItems\(\{[\s\S]*promotionScene: 'promotion_scene_search_trend'[\s\S]*itemSelectedMode: 'trend'[\s\S]*tagId: '101111310'[\s\S]*channelKey: !normalizedQuery \? 'effect' : ''/,
        '趋势主题联想区未区分本店宝贝与竞店宝贝的数据加载方式，或未使用趋势明星原生商品上下文'
    );
    assert.match(
        popupBlock,
        /associationSelectedItemType[\s\S]*data-scene-popup-trend-association-item-select[\s\S]*resolveTrendAssociationItemQuery\(item\)[\s\S]*runAssociationSearch\(itemQuery\)/,
        '趋势主题联想区未用选中的本店/竞店宝贝触发趋势主题联想'
    );
    assert.match(
        popupBlock,
        /const collectTrendAssociationThemeNames = \(\) => uniqueBy[\s\S]*?const extractTrendAssociationCandidateTerms = \(text = ''\)[\s\S]*?const collectTrendAssociationDynamicTerms = \(text = ''\)[\s\S]*?collectTrendAssociationThemeNames\(\)[\s\S]*?extractTrendAssociationCandidateTerms\(normalizedText\)[\s\S]*?const buildTrendAssociationCoreQueries = \(text = ''\)[\s\S]*?collectTrendAssociationDynamicTerms\(normalizedText\)[\s\S]*?const resolveAssociationSearchQueries = \(query = ''\)[\s\S]*?buildTrendAssociationCoreQueries\(`\$\{selectedItemText\} \$\{directQuery\}`\)[\s\S]*?fetchAssociationThemes\(queryCandidate\)[\s\S]*?联想词/,
        '趋势主题联想区未在宝贝完整标题无结果时基于主题与标题动态降级搜索'
    );
    assert.doesNotMatch(
        popupBlock,
        /TREND_ASSOCIATION_CORE_TERMS|消毒碗柜|洗碗机|消毒柜|空调|冰箱|洗衣机|烟机|灶具|热水器|净水器/,
        '趋势主题联想区仍残留单一类目的硬编码降级词'
    );
    assert.match(
        popupBlock,
        /associationQuickActiveQuery[\s\S]*const isActive = activeQuickQuery && name === activeQuickQuery[\s\S]*class="\$\{isActive \? 'active' : ''\}"[\s\S]*associationQuickActiveQuery = query/,
        '快捷联想已选趋势未维护当前点击项的选中圆点状态'
    );
    assert.match(
        popupBlock,
        /data-scene-popup-trend-select-all="trend"[\s\S]*data-scene-popup-trend-select-all="effect"[\s\S]*data-scene-popup-trend-select-all="traffic"/,
        '趋势主题弹窗未提供三榜单勾选入口'
    );
    assert.match(
        popupBlock,
        /am-wxt-scene-trend-selected-dock[\s\S]*data-scene-popup-trend-clear="1"[\s\S]*data-scene-popup-trend-actions="1"[\s\S]*data-scene-popup-trend-selected-list="1"/,
        '趋势主题弹窗未提供置顶已选主题浮条'
    );
    assert.match(
        popupBlock,
        /saveFirst:\s*true[\s\S]*selectedActionsEl[\s\S]*popupFootEl[\s\S]*querySelectorAll\('\[data-scene-popup-save\], \[data-scene-popup-cancel\]'\)[\s\S]*appendChild\(button\)/,
        '趋势主题弹窗未把确定/取消按钮移动到全部移除右侧'
    );
    assert.match(
        popupBlock,
        /am-wxt-scene-popup-dialog-trend-theme/,
        '趋势主题弹窗未使用专属弹窗类，无法稳定约束底部浮条'
    );
    assert.match(
        styleBlock,
        /am-wxt-scene-popup-dialog-trend-theme[\s\S]*position:\s*relative[\s\S]*height:\s*auto[\s\S]*max-height:\s*calc\(100vh - 16px\)[\s\S]*overflow:\s*auto[\s\S]*am-wxt-scene-popup-body[\s\S]*flex:\s*0 0 auto[\s\S]*overflow:\s*visible[\s\S]*data-scene-popup-trend-layout="1"[\s\S]*flex:\s*0 0 auto[\s\S]*height:\s*auto[\s\S]*am-wxt-scene-trend-main[\s\S]*height:\s*auto/,
        '趋势主题弹窗未允许整窗滚动，联想结果可能仍被局部截断'
    );
    assert.match(
        trendLayoutStyleBlock,
        /am-wxt-scene-trend-selected-dock[\s\S]*position:\s*fixed[\s\S]*bottom:\s*24px[\s\S]*box-shadow:\s*0 14px 34px[\s\S]*am-wxt-scene-trend-selected-actions[\s\S]*am-wxt-scene-trend-rank-board[\s\S]*display:\s*grid[\s\S]*am-wxt-scene-trend-association[\s\S]*flex:\s*0 0 auto[\s\S]*height:\s*auto[\s\S]*overflow:\s*visible[\s\S]*has-item-panel[\s\S]*flex-basis:\s*auto[\s\S]*am-wxt-scene-trend-association-table[\s\S]*overflow:\s*visible/,
        '趋势主题弹窗未将联想结果改为自然展开，结果表可能仍需内部滚动'
    );
    assert.doesNotMatch(
        trendRankBoardStyleBlock,
        /flex:\s*0 0 900px|min-height:\s*(?:800|900)px/,
        '趋势红榜区域仍残留固定 900/800 高度'
    );
    assert.match(
        trendToolbarInputStyleBlock,
        /justify-self:\s*start[\s\S]*border:\s*none[\s\S]*border-radius:\s*7px[\s\S]*background:\s*rgba\(79,104,255,0\.12\)[\s\S]*color:\s*#4f68ff[\s\S]*font-weight:\s*600/,
        '趋势主题顶部搜索框未对齐联想区关键词胶囊样式'
    );
    assert.match(
        trendMainStyleBlock,
        /padding-bottom:\s*180px[\s\S]*overflow:\s*visible/,
        '趋势主题弹窗主内容区仍可能截断自定义搜索'
    );
    assert.match(
        trendLayoutStyleBlock,
        /am-wxt-scene-trend-association-type\.active input[\s\S]*width:\s*150px[\s\S]*am-wxt-scene-trend-association-item-panel[\s\S]*flex:\s*0 0 260px[\s\S]*am-wxt-scene-trend-association-item-row[\s\S]*grid-template-columns:\s*28px 46px minmax\(0, 1fr\)/,
        '趋势主题联想区缺少原生式关键词输入或宝贝列表面板样式'
    );
    assert.match(
        popupBlock,
        /am-wxt-scene-trend-rank-board[\s\S]*am-wxt-scene-trend-rank-column/,
        '趋势主题弹窗未启用并排榜单卡片布局'
    );
    assert.match(
        popupBlock,
        /const rankTabs = \['trend', 'effect', 'traffic'\];[\s\S]*const getRankScore = \(item = \{\}, rankTab = 'trend'\) => \{[\s\S]*const getRankMetricText = \(item = \{\}, rankTab = 'trend'\) => \{[\s\S]*const buildVisibleThemes = \(rankTab = 'trend'\) => \{[\s\S]*const toggleTheme = \(item = \{\}\) => \{/,
        '趋势主题弹窗未按三榜单分榜排序并输出勾选切换逻辑'
    );
    assert.match(
        popupBlock,
        /const getRankTagText = \(item = \{\}, rankTab = 'trend'\)[\s\S]*weekCapacityChangeRatio[\s\S]*趋势增长中[\s\S]*const getRankTagTone[\s\S]*rankTagTone[\s\S]*am-wxt-scene-trend-rank-tag[\s\S]*data-rank-tag-tone/,
        '趋势主题弹窗未渲染红榜最右侧状态/标签列，或未按状态区分颜色'
    );
    assert.match(
        popupBlock,
        /rankThemeMap[\s\S]*trendRankList[\s\S]*effectRankList[\s\S]*trafficRankList[\s\S]*const nativeRankThemes = rankThemeMap\?\.\[rankTab\][\s\S]*if \(nativeRankThemes\.length\) \{[\s\S]*return filteredThemes\.slice\(0, 80\);/,
        '趋势主题弹窗未按原生分榜列表渲染，可能仍用同一候选池排序模拟红榜'
    );
    assert.match(
        popupBlock,
        /themeAssociation\.json[\s\S]*associationThemes[\s\S]*uniqueTrendThemeList\(\s*associationThemes\s*\.concat\(selectedThemes\)/,
        '趋势主题弹窗未优先合并带投产指标的联想主题，效果红榜可能显示空指标'
    );
    assert.match(
        popupBlock,
        /const runAssociationSearch = async[\s\S]*resolveAssociationSearchQueries\(query\)[\s\S]*fetchAssociationThemes\(queryCandidate\)[\s\S]*data-scene-popup-trend-association-toggle[\s\S]*findThemeByKey\(key\)[\s\S]*toggleTheme\(item\)/,
        '趋势主题弹窗手动联想结果未接入当前勾选/移除逻辑'
    );
    assert.match(
        popupBlock,
        /data-scene-popup-trend-toggle/,
        '趋势主题弹窗未改为勾选方式维护已选主题'
    );
    assert.doesNotMatch(
        popupBlock,
        /data-scene-popup-trend-add/,
        '趋势主题弹窗仍保留“添加”操作列逻辑'
    );
    assert.doesNotMatch(
        popupBlock,
        /data-scene-popup-trend-rank-tab|activeRankTab/,
        '趋势主题弹窗仍残留 tab 切换逻辑'
    );
    assert.match(
        popupBlock,
        /selectedThemes\.length >= 6/,
        '趋势主题弹窗未限制原生 6 个主题上限'
    );
    assert.match(
        popupBlock,
        /const trendThemeRaw = serializeTrendThemeList\(nextThemes\);[\s\S]*summary: describeTrendThemeSummary\(trendThemeRaw\)/,
        '趋势主题弹窗保存时未序列化完整趋势主题对象'
    );
    assert.match(
        popupBlock,
        /const isDetachedTrendThemePopup = popupOptions\.detached === true[\s\S]*trendThemeControl instanceof HTMLInputElement\) && !isDetachedTrendThemePopup[\s\S]*initialTrendThemeRaw[\s\S]*popupOptions\.initialRaw/,
        '趋势主题弹窗未支持矩阵页传入外部初始值的脱离隐藏字段模式'
    );
    assert.match(
        popupBlock,
        /if \(typeof popupOptions\.onSave === 'function'\) \{[\s\S]*await popupOptions\.onSave\(result\);/,
        '趋势主题弹窗未给复用方保留保存回调'
    );
    assert.match(
        popupBlock,
        /KeywordPlanPreviewExecutor\.openKeywordTrendThemeSettingPopup = openKeywordTrendThemeSettingPopup;/,
        '趋势主题弹窗未通过窄桥暴露给矩阵页复用'
    );
});

test('趋势主题弹窗确认后写回 campaign.trendThemeList', () => {
    const eventBlock = getBlock(
        "const scenePopupButtons = wizardState.els.sceneDynamic.querySelectorAll('[data-scene-popup-trigger]');",
        'const scenePopupSummaryTriggers = wizardState.els.sceneDynamic.querySelectorAll'
    );

    assert.match(
        eventBlock,
        /trigger === 'trendTheme'[\s\S]*openKeywordTrendThemeSettingPopup/,
        '场景弹窗事件未接入 trendTheme 分支'
    );
    assert.match(
        eventBlock,
        /dispatchSceneControlUpdate\(trendThemeControl,\s*result\.trendThemeRaw \|\| '\[\]'\)/,
        'trendTheme 分支未把结果写回 campaign.trendThemeList 隐藏字段'
    );

    const mappingBlock = getBlock(
        'const resolveSceneSettingOverrides = ({ sceneName = \'\', sceneSettings = {}, runtime = {} }) => {',
        'const buildFallbackSolutionTemplate = (runtime, sceneName = \'\') => {'
    );
    assert.match(
        mappingBlock,
        /'trendThemeList'/,
        '场景设置映射层未允许 trendThemeList 进入 campaign override'
    );
});
