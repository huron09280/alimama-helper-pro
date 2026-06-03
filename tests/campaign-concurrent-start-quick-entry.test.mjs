import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getCampaignQuickEntryBlock() {
    const start = source.indexOf('const CampaignIdQuickEntry = {');
    const end = source.indexOf('// ==========================================\n    // 7. 启动程序', start);
    assert.ok(start > -1 && end > start, '无法定位 CampaignIdQuickEntry 代码块');
    return source.slice(start, end);
}

function getConcurrentLogStyleBlock() {
    const start = source.indexOf('#am-campaign-concurrent-log-popup {');
    const end = source.indexOf('#am-campaign-copy-overview-popup {', start);
    assert.ok(start > -1 && end > start, '无法定位并发日志样式块');
    return source.slice(start, end);
}

function getCssRule(selector) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = source.match(new RegExp(`${escaped}\\s*\\{[\\s\\S]*?\\}`));
    assert.ok(match, `无法定位 ${selector} 样式规则`);
    return match[0];
}

test('计划ID快捷入口包含并发开启按钮与样式标识', () => {
    const block = getCampaignQuickEntryBlock();
    assert.match(block, /ICON_SVG:\s*renderAmIcon\('campaign-query',\s*\{\s*size:\s*14,\s*strokeWidth:\s*2\.1\s*\}\)/, '快捷查数按钮未使用专用查询图标');
    assert.match(block, /CONCURRENT_START_ICON_SVG:\s*renderAmIcon\('campaign-concurrent-start',\s*\{\s*size:\s*14,\s*strokeWidth:\s*2\.1\s*\}\)/, '并发开启按钮未使用专用启动图标');
    assert.match(block, /data-am-campaign-concurrent-start/, '缺少并发开启 data 标识');
    assert.match(source, /\.am-campaign-concurrent-start-btn/, '缺少并发开启按钮样式类');
});

test('计划并发默认关闭时不保留隐藏按钮 DOM', () => {
    const block = getCampaignQuickEntryBlock();
    assert.match(block, /isConcurrentStartEnabled\(\)\s*\{[\s\S]*?State\.config\.showConcurrentStartButton/, '并发入口应受配置开关控制');
    assert.match(block, /syncConcurrentButtonsVisibility\(\)\s*\{[\s\S]*?if \(!enabled\) \{[\s\S]*?data-am-campaign-concurrent-start="1"[\s\S]*?btn\.classList\.contains\('is-running'\) \|\| btn\.disabled[\s\S]*?btn\.remove\(\);[\s\S]*?return;[\s\S]*?this\.ensureConcurrentButtonsForQuickEntries\(\);/, '关闭计划并发时应移除空闲并发按钮，开启时再按需补建');
    assert.match(block, /setConcurrentButtonRunning\(campaignId,\s*running\)[\s\S]*?if \(!this\.isConcurrentStartEnabled\(\)\) \{[\s\S]*?btn\.remove\(\);[\s\S]*?\}/, '运行中并发按钮应在执行结束后按当前开关清理');
    assert.match(block, /ensureConcurrentButtonsForQuickEntries\(\)\s*\{[\s\S]*?data-am-campaign-quick="1"[\s\S]*?this\.createButton\(campaignId,\s*\{[\s\S]*?mode:\s*'concurrent'[\s\S]*?anchor\.insertAdjacentElement\('afterend',\s*concurrentBtn\);/, '开启计划并发时应从已有快捷查数按钮补建并发按钮');
    assert.match(block, /if \(this\.isConcurrentStartEnabled\(\)\) \{[\s\S]*?mode:\s*'concurrent'[\s\S]*?frag\.appendChild\(concurrentBtn\);[\s\S]*?\}/, '文本计划 ID 注入不应在关闭时创建并发按钮');
    assert.match(block, /if \(this\.isConcurrentStartEnabled\(\) && !concurrentBtn\) \{[\s\S]*?mode:\s*'concurrent'[\s\S]*?insertAdjacentElement\('afterend',\s*createdConcurrent\);/, '链接计划 ID 注入不应在关闭时创建并发按钮');
    assert.doesNotMatch(block, /style\.display\s*=\s*enabled\s*\?\s*''\s*:\s*'none'/, '计划并发关闭不应再通过 display:none 保留隐藏按钮');
});

test('计划ID快捷入口图标按钮保留热区和线性 SVG 样式', () => {
    assert.match(source, /'campaign-query':\s*\{[\s\S]*?<circle cx="10" cy="10" r="5"><\/circle>[\s\S]*?<path d="M14 14l5 5"><\/path>[\s\S]*?'campaign-concurrent-start':/, '缺少简约查询图标定义');
    assert.match(source, /'campaign-concurrent-start':\s*\{[\s\S]*?<path d="M8 6l10 6-10 6V6z"><\/path>/, '缺少简约启动图标定义');
    assert.match(source, /\.am-campaign-search-btn \{[\s\S]*?width:\s*20px;[\s\S]*?height:\s*20px;[\s\S]*?padding:\s*2px;/, '计划ID图标按钮缺少 20px 热区');
    assert.match(source, /\.am-campaign-search-btn svg \{[\s\S]*?width:\s*14px;[\s\S]*?height:\s*14px;[\s\S]*?fill:\s*none;[\s\S]*?stroke:\s*currentColor;/, '计划ID图标 SVG 应保持线性无填充');
    assert.match(source, /\.am-campaign-search-btn \{[\s\S]*?border:\s*1px solid transparent;[\s\S]*?border-radius:\s*999px;[\s\S]*?color:\s*var\(--am26-text-soft\);/, '计划ID图标按钮应使用统一 token 胶囊底座');
    assert.match(source, /\.am-campaign-search-btn:hover \{[\s\S]*?color:\s*var\(--am26-primary\);[\s\S]*?border-color:\s*var\(--am26-border\);[\s\S]*?background:\s*var\(--am26-surface\);/, '计划ID图标按钮 hover 应使用统一 token');
    assert.match(source, /\.am-campaign-search-btn:focus-visible \{[\s\S]*?box-shadow:\s*0 0 0 2px rgba\(69,\s*84,\s*229,\s*0\.24\);[\s\S]*?background:\s*var\(--am26-surface-strong\);/, '计划ID图标按钮缺少 token 化键盘焦点状态');
    assert.match(source, /\.am-campaign-concurrent-start-btn:hover \{[\s\S]*?color:\s*var\(--am26-success\);[\s\S]*?background:\s*rgba\(14,\s*168,\s*111,\s*0\.12\);/, '并发开启入口 hover 应使用成功语义 token');
    assert.doesNotMatch(getCssRule('.am-campaign-search-btn:hover'), /#1677ff|rgba\(22,\s*119,\s*255/, '计划ID图标按钮 hover 不应回退到旧蓝色硬编码');
    assert.doesNotMatch(getCssRule('.am-campaign-concurrent-start-btn:hover'), /#157a43|rgba\(21,\s*122,\s*67/, '并发开启入口 hover 不应回退到旧绿色硬编码');
});

test('并发开启流程包含全量暂停与原在投并发重试', () => {
    const block = getCampaignQuickEntryBlock();
    assert.match(block, /BIZ_CODE_LIST:\s*\[\s*'onebpSearch',\s*'onebpSite',\s*'onebpAdStrategyLiuZi',\s*'onebpDisplay'\s*\]/, '并发识别范围未覆盖关键词/全站/线索/人群四类计划');
    assert.match(block, /MAX_START_RETRIES:\s*\d+/, '缺少并发重试次数配置');
    assert.match(block, /runConcurrentStartFlow\(/, '缺少并发开启主流程函数');
    assert.match(block, /resolveConcurrentTargetsByItem\(/, '缺少按商品ID的全量计划识别逻辑');
    assert.match(block, /resolveResumeTargets\(/, '缺少重开计划集合解析逻辑');
    assert.match(block, /resolveConcurrentTargets\(/, '缺少同商品计划集合识别逻辑');
    assert.match(block, /resolveItemIdByCampaignId\(/, '缺少按计划ID反查商品ID逻辑');
    assert.match(block, /queryCampaignDetail\(/, '缺少计划详情兜底反查逻辑');
    assert.match(block, /queryAdgroupDetail\(/, '缺少单元详情兜底反查逻辑');
    assert.match(block, /campaignItemIdCache:\s*new Map\(\)/, '缺少计划与商品映射缓存');
    assert.match(block, /campaignItemCacheLimit:\s*240/, '计划与商品映射缓存缺少容量上限');
    assert.match(block, /rememberLocalCampaignItemId\(campaignId,\s*itemId\)[\s\S]*?this\.campaignItemIdCache\.set\(normalizedCampaignId,\s*normalizedItemId\);[\s\S]*?this\.trimLocalCampaignItemIdCache\(normalizedCampaignId\);/, '本地商品映射写入后应裁剪缓存');
    assert.match(block, /touchLocalCampaignItemId\(campaignId\)[\s\S]*?this\.campaignItemIdCache\.delete\(normalizedCampaignId\);[\s\S]*?this\.campaignItemIdCache\.set\(normalizedCampaignId,\s*itemId\);/, '读取商品映射应刷新最近使用顺序');
    assert.match(block, /trimLocalCampaignItemIdCache\(protectedCampaignId = ''\)[\s\S]*?Math\.max\(24,\s*Number\(this\.campaignItemCacheLimit\) \|\| 240\)[\s\S]*?this\.campaignItemIdCache\.delete\(key\);/, '本地商品映射缓存应按上限删除最旧项');
    assert.match(block, /collectSiteCustomTargetBuckets\(/, '缺少全站与自定义计划分桶逻辑');
    assert.match(block, /shouldRunSiteCustomBreakthrough\(/, '缺少全站与自定义同开突破触发逻辑');
    assert.match(block, /runSiteCustomBreakthroughStrategy\(/, '缺少全站与自定义同开突破执行逻辑');
    assert.match(block, /updateCampaignStatusBatchByBiz\(/, '缺少按业务线批量开启突破逻辑');
    assert.match(block, /mandatorySiteTargets/, '缺少货品全站计划强制开启集合');
    assert.match(block, /item\.bizCode === 'onebpSite'/, '缺少货品全站计划筛选逻辑');
    assert.match(block, /customTargetsByBiz/, '缺少自定义计划按业务线分桶并发逻辑');
    assert.match(
        block,
        /Promise\.allSettled\(\s*allTargets\.map\(target => this\.updateCampaignStatus\(target\.campaignId,\s*target\.bizCode,\s*0,\s*authContext\)\)\s*\)/s,
        '缺少同商品全量暂停并发提交逻辑'
    );
    assert.match(
        block,
        /resumeTargets\.map\(target => this\.updateCampaignStatus\(target\.campaignId,\s*target\.bizCode,\s*1,\s*authContext\)\)/,
        '缺少原在投计划并发重开逻辑'
    );
    assert.match(block, /originalActiveTargets/, '缺少原在投计划集合回溯逻辑');
});

test('并发开启流程使用冲突查询与后台更新接口', () => {
    const block = getCampaignQuickEntryBlock();
    assert.match(block, /campaign\/diff\/findList\.json/, '缺少冲突查询接口');
    assert.match(block, /campaign\/horizontal\/findPage\.json/, '缺少按商品ID查询计划接口');
    assert.match(block, /campaign\/get\.json/, '缺少计划详情反查接口');
    assert.match(block, /adgroup\/get\.json/, '缺少单元详情反查接口');
    assert.match(block, /itemId:\s*Number\(normalizedItemId\)/, '缺少商品ID计划查询参数');
    assert.match(block, /campaignList:\s*\[\s*\{\s*campaignId:\s*numericCampaignId,\s*displayStatus:/s, '缺少状态批量更新 payload');
    assert.match(block, /campaign\/updatePart\.json/, '缺少状态更新接口');
});

test('并发开启流程包含弹窗日志并在成功后提示', () => {
    const block = getCampaignQuickEntryBlock();
    assert.match(source, /#am-campaign-concurrent-log-popup/, '缺少并发执行日志弹窗样式');
    assert.match(block, /openConcurrentLogPopup\(/, '缺少并发日志弹窗打开逻辑');
    assert.match(block, /appendConcurrentLog\(/, '缺少并发日志追加逻辑');
    assert.match(block, /setConcurrentLogStatus\(/, '缺少并发日志状态提示逻辑');
    assert.match(block, /同商品全部计划：/, '缺少同商品全部计划明细日志');
    assert.match(block, /同商品分类统计：货品全站/, '缺少同商品四类计划分类统计日志');
    assert.match(block, /商品ID识别：/, '缺少商品ID识别过程日志');
    assert.match(block, /未使用地址栏候选/, '缺少地址栏候选防串商品日志');
    assert.match(block, /setConcurrentLogStatus\(`执行成功：第\$\{result\?\.attempt \|\| 1\}次即完成`, 'success'\)/, '缺少成功状态提示');
    assert.match(block, /#am-campaign-concurrent-log-popup/, '并发日志弹窗未加入忽略区域，可能污染计划按钮');
    assert.match(block, /data-item-id/, '并发按钮缺少商品ID透传字段');
});

test('并发日志弹窗对齐统一弹窗语义和焦点规范', () => {
    const block = getCampaignQuickEntryBlock();
    assert.match(block, /class="am-concurrent-log-card" role="dialog" aria-modal="true" aria-labelledby="am-concurrent-log-title" aria-describedby="am-concurrent-log-status"/, '并发日志弹窗应通过标题和状态建立可访问名称与描述');
    assert.match(block, /class="am-concurrent-log-icon" aria-hidden="true">\$\{renderAmIcon\('campaign-concurrent-start'/, '并发日志标题应使用共享启动图标');
    assert.match(block, /<h3 class="am-concurrent-log-title" id="am-concurrent-log-title">并发开启执行日志<\/h3>/, '并发日志标题应使用 heading 结构');
    assert.match(block, /id="am-concurrent-log-status" role="status" aria-live="polite"/, '并发日志状态条应具备 live status 语义');
    assert.match(block, /id="am-concurrent-log-body" role="log" aria-live="polite" aria-relevant="additions text" aria-label="并发开启日志明细" tabindex="0"/, '并发日志明细应具备 log 语义和键盘滚动焦点');
    assert.match(block, /popup\.setAttribute\('aria-hidden', 'false'\)/, '打开并发日志时应同步 aria-hidden');
    assert.match(block, /closeConcurrentLogPopup\(\{ restoreFocus = true \} = \{\}\)[\s\S]*?popup\.setAttribute\('aria-hidden', 'true'\)[\s\S]*?document\.removeEventListener\('keydown', this\.concurrentLogKeydownHandler, true\)[\s\S]*?focusBackEl\.focus\(\{ preventScroll: true \}\)/, '并发日志关闭应移除 Esc 监听并恢复触发按钮焦点');
    assert.match(block, /this\.concurrentLogKeydownHandler = \(event\) => \{[\s\S]*?event\.key !== 'Escape'[\s\S]*?this\.closeConcurrentLogPopup\(\)/, '并发日志应支持 Esc 关闭');
    assert.match(block, /requestAnimationFrame\(\(\) => closeBtn\.focus\(\{ preventScroll: true \}\)\)/, '打开并发日志后应聚焦关闭按钮');
    assert.match(block, /const normalizedLevel = \['running', 'success', 'warning', 'error'\]\.includes\(level\) \? level : 'running'/, '并发日志状态应支持 warning 语义');
});

test('并发日志弹窗样式使用统一 token 和可见焦点', () => {
    const styleBlock = getConcurrentLogStyleBlock();
    assert.match(styleBlock, /#am-campaign-concurrent-log-popup \{[\s\S]*?background:\s*rgba\(255,\s*255,\s*255,\s*0\.72\);[\s\S]*?-webkit-backdrop-filter:\s*blur\(8px\) saturate\(1\.15\);[\s\S]*?backdrop-filter:\s*blur\(8px\) saturate\(1\.15\);/, '并发日志遮罩应使用统一白色轻玻璃遮罩');
    assert.match(styleBlock, /#am-campaign-concurrent-log-popup \.am-concurrent-log-card\s*\{[\s\S]*?border-radius:\s*18px;[\s\S]*?border:\s*1px solid var\(--am26-border-strong\);[\s\S]*?background:\s*linear-gradient\(135deg,\s*rgba\(255,\s*255,\s*255,\s*0\.96\),\s*rgba\(255,\s*255,\s*255,\s*0\.88\)\);[\s\S]*?box-shadow:\s*var\(--am26-shadow\);[\s\S]*?backdrop-filter:\s*blur\(20px\) saturate\(1\.4\);/, '并发日志卡片应收敛到统一白色玻璃面板');
    assert.match(styleBlock, /#am-campaign-concurrent-log-popup \.am-concurrent-log-title\s*\{[\s\S]*?min-width:\s*0;[\s\S]*?overflow:\s*hidden;[\s\S]*?text-overflow:\s*ellipsis;[\s\S]*?white-space:\s*nowrap;/, '并发日志标题应防止挤压关闭按钮');
    assert.match(styleBlock, /#am-campaign-concurrent-log-popup \.am-concurrent-log-close:focus-visible\s*\{[\s\S]*?box-shadow:\s*0 0 0 3px rgba\(69,\s*84,\s*229,\s*0\.28\);/, '并发日志关闭按钮缺少可见键盘焦点');
    assert.match(styleBlock, /#am-campaign-concurrent-log-popup \.am-concurrent-log-body:focus-visible\s*\{[\s\S]*?box-shadow:\s*inset 0 0 0 2px rgba\(69,\s*84,\s*229,\s*0\.22\);/, '并发日志明细区缺少可见键盘焦点');
    assert.match(styleBlock, /#am-campaign-concurrent-log-popup \.am-concurrent-log-status\.is-warning\s*\{[\s\S]*?color:\s*var\(--am26-warning,[\s\S]*?background:\s*rgba\(232,\s*163,\s*37,\s*0\.14\);/, '并发日志状态缺少 warning 语义样式');
    assert.match(styleBlock, /#am-campaign-concurrent-log-popup \.am-concurrent-log-line\.is-warn\s*\{[\s\S]*?color:\s*var\(--am26-warning,/, '并发日志警告行应使用 warning token');
    assert.match(styleBlock, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?#am-campaign-concurrent-log-popup \.am-concurrent-log-close/, '并发日志动效应适配减少动画');
    assert.doesNotMatch(styleBlock, /background:\s*rgba\(27,\s*36,\s*56,\s*0\.28\)|backdrop-filter:\s*blur\(10px\);/, '并发日志遮罩不应回退到旧灰色遮罩');
    assert.doesNotMatch(styleBlock, /#am-campaign-concurrent-log-popup \.am-concurrent-log-card\s*\{[\s\S]*?background:\s*#ffffff;/, '并发日志卡片不应回退到旧纯白硬编码背景');
    assert.doesNotMatch(styleBlock, /#am-campaign-concurrent-log-popup \.am-concurrent-log-body\s*\{[\s\S]*?background:\s*#0f172a;/, '并发日志明细区不应回退到旧深色终端背景');
    assert.doesNotMatch(styleBlock, /#am-campaign-concurrent-log-popup \.am-concurrent-log-status\.is-warning\s*\{[\s\S]*?color:\s*#a16207|#am-campaign-concurrent-log-popup \.am-concurrent-log-line\.is-warn\s*\{[\s\S]*?color:\s*#a16207/, '并发日志警告状态不应回退到旧硬编码黄褐色');
});
