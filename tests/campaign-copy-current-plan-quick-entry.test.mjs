import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

const quickEntry = read('src/main-assistant/campaign-id-quick-entry.js');
const quickEntryStyle = read('src/main-assistant/ui.js');
const apiIntro = read('src/optimizer/keyword-plan-api/intro.js');
const wizardApi = read('src/optimizer/keyword-plan-api/wizard-open-and-create.js');
const draftBuilder = read('src/optimizer/keyword-plan-api/search-and-draft.js');
const createAndSuggest = read('src/optimizer/keyword-plan-api/create-and-suggest.js');
const sceneSpecSource = read('src/optimizer/keyword-plan-api/scene-spec.js');
const exportsSource = read('src/optimizer/keyword-plan-api/exports.js');
const bridgeSource = read('src/optimizer/bridge.js');
const bootstrapSource = read('src/main-assistant/bootstrap.js');

const extractFunctionSegment = (source, marker, endMarker = '\n        };') => {
    const start = source.indexOf(marker);
    assert.notEqual(start, -1, `缺少函数片段：${marker}`);
    const end = source.indexOf(endMarker, start);
    assert.notEqual(end, -1, `函数片段未闭合：${marker}`);
    return source.slice(start, end);
};

const extractCssRule = (source, selector) => {
    const start = source.indexOf(`${selector} {`);
    assert.notEqual(start, -1, `缺少 CSS 规则：${selector}`);
    const end = source.indexOf('\n                }', start);
    assert.notEqual(end, -1, `CSS 规则未闭合：${selector}`);
    return source.slice(start, end);
};

test('计划行操作区注入单个复制按钮', () => {
    assert.match(quickEntry, /COPY_ICON_SVG:\s*renderAmIcon\('campaign-copy',\s*\{\s*size:\s*14,\s*strokeWidth:\s*2\.1\s*\}\)/, '复制按钮未使用共享复制图标');
    assert.match(quickEntry, /mode:\s*'copy'/, '操作区应只创建单个复制按钮');
    assert.match(quickEntry, /const copyMode = 'inherit';[\s\S]*?data-am-campaign-copy',\s*copyMode\);/, '复制按钮应标记为跟随源计划状态');
    assert.match(quickEntry, /data-am-campaign-copy/, '缺少复制按钮 data 标识');
    assert.match(quickEntry, /return '复制';/, '复制按钮文案应收敛为单个“复制”');
    assert.match(quickEntry, /class="am-campaign-copy-icon"[\s\S]*?COPY_ICON_SVG\.trim\(\)/, '复制按钮应使用独立左侧图标圆点容器');
    assert.doesNotMatch(quickEntry, /ensureCopyButton\('pause'\)|ensureCopyButton\('start'\)/, '操作区不应再注入两个复制按钮');
    assert.doesNotMatch(quickEntry, /copy_pause|copy_start/, '不应再保留双按钮创建模式');
    assert.match(quickEntry, /enhanceOperationNodes\(\);/, 'run 流程应增强原生操作区');
    assert.match(quickEntry, /data-am-campaign-operation-copy-host/, '复制按钮应挂在原生操作区 host 上');
    assert.match(quickEntry, /operationRow\?\.previousElementSibling/, '操作区应从上一条计划数据行解析 campaign 上下文');
    assert.match(quickEntry, /\.wO_WXptarh\.clearfix,\s*\.wO_WXbzarh\.clearfix/, '操作区识别应同时覆盖线索页与营销场景页原生操作组');
    assert.match(quickEntry, /text\.includes\('推广解读'\)[\s\S]*?text\.includes\('复制'\)/, '人群推广原生操作区应能通过推广解读/复制识别挂载点');
    assert.match(quickEntry, /text\.includes\('AI点睛'\)[\s\S]*?text\.includes\('人群设置'\)[\s\S]*?text\.includes\('置顶'\)[\s\S]*?text\.includes\('一键起量'\)[\s\S]*?text\.includes\('相似品跟投'\)[\s\S]*?text\.includes\('修改趋势'\)[\s\S]*?text\.includes\('创意起量'\)[\s\S]*?text\.includes\('加速测图'\)/, '营销场景操作区无报表/置顶时也应能识别复制按钮挂载点');
    assert.match(quickEntryStyle, /\.am-campaign-copy-btn\s*\{[\s\S]*?min-width:\s*90px;[\s\S]*?height:\s*24px;[\s\S]*?min-height:\s*24px;[\s\S]*?padding:\s*0 5px 0 8px;[\s\S]*?overflow:\s*hidden;[\s\S]*?border-radius:\s*500px;[\s\S]*?background:\s*rgb\(255,\s*255,\s*255\);[\s\S]*?white-space:\s*nowrap;/, '复制按钮缺少同组原生胶囊圆角和不换行约束');
    assert.match(quickEntryStyle, /\.am-campaign-operation-copy-btn\s*\{[\s\S]*?float:\s*left;[\s\S]*?margin:\s*0 8px 0 0;/, '操作区复制按钮应跟随原生操作按钮横排');
    const textEnhanceSegment = quickEntry.slice(
        quickEntry.indexOf('enhanceTextNodes()'),
        quickEntry.indexOf('enhanceLinkNodes()')
    );
    const linkEnhanceSegment = quickEntry.slice(
        quickEntry.indexOf('enhanceLinkNodes()'),
        quickEntry.indexOf('window.CampaignIdQuickEntry')
    );
    assert.doesNotMatch(textEnhanceSegment, /copy_pause|copy_start/, '计划名称/ID 文本旁不应再注入复制按钮');
    assert.doesNotMatch(linkEnhanceSegment, /insertAdjacentElement\('afterend',\s*createdCopy/, '计划链接旁不应再注入复制按钮');
});

test('复制按钮透传 campaignId/bizCode/itemId 并防重复点击', () => {
    assert.match(quickEntry, /btn\.setAttribute\('data-campaign-id',\s*id\);[\s\S]*?btn\.dataset\.campaignId\s*=\s*id;/, '复制按钮应复用 campaignId 透传');
    assert.match(quickEntry, /btn\.setAttribute\('data-biz-code',\s*bizCode\);[\s\S]*?btn\.dataset\.bizCode\s*=\s*bizCode;/, '复制按钮应透传 bizCode');
    assert.match(quickEntry, /btn\.setAttribute\('data-item-id',\s*itemId\);[\s\S]*?btn\.dataset\.itemId\s*=\s*itemId;/, '复制按钮应透传 itemId');
    assert.match(quickEntry, /runningCopyKeys:\s*new Set\(\)/, '缺少复制运行中集合');
    assert.match(quickEntry, /this\.runningCopyKeys\.has\(copyKey\)/, '缺少重复点击拦截');
    assert.match(quickEntry, /data-am-campaign-copy\]\[data-campaign-id="\$\{id\}"\]/, '同计划复制中应锁住对应复制按钮');
    assert.match(quickEntry, /setCopyButtonRunning\(id,\s*copyMode,\s*true\)/, '点击复制时应进入 running 状态');
    assert.match(quickEntry, /this\.runningCopyKeys\.delete\(copyKey\);[\s\S]*?this\.setCopyButtonRunning\(id,\s*copyMode,\s*false\);/, '复制结束后应恢复按钮状态');
});

test('复制按钮复刻组建计划的数量调节操作', () => {
    assert.match(quickEntry, /data-am-campaign-copy-count-badge/, '复制按钮缺少数量徽标');
    assert.match(quickEntry, /title="点击增加，右键减少，滚轮可调节"/, '复制数量徽标缺少组建计划同款操作提示');
    assert.match(quickEntry, /document\.addEventListener\('contextmenu'[\s\S]*?adjustCopyBatchCount\(copyButton,\s*-1\);/, '右键复制数量徽标应减少数量');
    assert.match(quickEntry, /document\.addEventListener\('wheel'[\s\S]*?adjustCopyBatchCount\(copyButton,\s*e\.deltaY > 0 \? -1 : 1\);/, '滚轮复制数量徽标应调节数量');
    assert.match(quickEntry, /normalizeCopyBatchCount\(value\)[\s\S]*?Math\.min\(99,\s*Math\.max\(1,/, '复制数量应限制在 1-99');
    assert.match(quickEntry, /countBadge\.setAttribute\('data-am-campaign-copy-count-badge',\s*String\(count\)\)/, '复制数量徽标 data 值应同步更新');
    assert.match(quickEntry, /copyPlanNameCache:\s*new Set\(\)/, '缺少已复制计划名缓存，重复复制可能命名冲突');
    assert.match(quickEntry, /copyPlanNameCacheLimit:\s*120/, '已复制计划名缓存缺少容量上限');
    assert.match(quickEntry, /rememberCopiedPlanNames\(planNames = \[\]\)[\s\S]*?this\.copyPlanNameCache\.delete\(name\)[\s\S]*?this\.copyPlanNameCache\.add\(name\)[\s\S]*?this\.trimCopiedPlanNameCache\(\);/, '已复制计划名写入应刷新最近顺序并裁剪缓存');
    assert.match(quickEntry, /trimCopiedPlanNameCache\(\)[\s\S]*?Math\.max\(20,\s*Number\(this\.copyPlanNameCacheLimit\) \|\| 120\)[\s\S]*?this\.copyPlanNameCache\.delete\(oldestName\);/, '已复制计划名缓存应按上限删除最旧项');
    const copyButtonRule = extractCssRule(quickEntryStyle, '.am-campaign-copy-btn');
    const copyBadgeRule = extractCssRule(quickEntryStyle, '.am-campaign-copy-btn .am-wxt-copy-multi');
    assert.match(quickEntry, /renderAmIcon\('plus',\s*\{\s*size:\s*12,\s*strokeWidth:\s*2\.6\s*\}\)/, '复制数量 + 图标应按用户要求渲染为 12px');
    assert.match(copyButtonRule, /position:\s*relative;[\s\S]*?border:\s*0;[\s\S]*?border-radius:\s*500px;[\s\S]*?background:\s*rgb\(255,\s*255,\s*255\);[\s\S]*?color:\s*#333333;[\s\S]*?box-shadow:\s*rgba\(0,\s*0,\s*0,\s*0\.06\) 0 4px 8px 0;[\s\S]*?font-size:\s*12px;[\s\S]*?font-weight:\s*400;/, '复制按钮应保留光影白底并跟随原生二级按钮字体和圆角');
    assert.match(quickEntryStyle, /\.am-campaign-copy-btn::before,[\s\S]*?\.am-campaign-copy-btn::after\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?z-index:\s*0;[\s\S]*?opacity:\s*0\.2;[\s\S]*?filter:\s*blur\(14px\);[\s\S]*?pointer-events:\s*none;/, '复制按钮应使用伪元素承载 mx_807 光影层');
    assert.match(quickEntryStyle, /\.am-campaign-copy-btn::before\s*\{[\s\S]*?background:\s*rgb\(51,\s*51,\s*255\);[\s\S]*?animation:\s*am-campaign-copy-shadow-left 5s linear infinite alternate;[\s\S]*?\.am-campaign-copy-btn::after\s*\{[\s\S]*?background:\s*rgb\(153,\s*51,\s*255\);[\s\S]*?animation:\s*am-campaign-copy-shadow-right 5s linear infinite alternate;/, '复制按钮应复刻 mx_807 蓝紫双向动画');
    assert.match(quickEntryStyle, /@keyframes am-campaign-copy-shadow-left\s*\{[\s\S]*?0%\s*\{[\s\S]*?bottom:\s*-24px;[\s\S]*?left:\s*0;[\s\S]*?50%\s*\{[\s\S]*?bottom:\s*-16px;[\s\S]*?left:\s*50%;[\s\S]*?@keyframes am-campaign-copy-shadow-right\s*\{[\s\S]*?0%\s*\{[\s\S]*?bottom:\s*-16px;[\s\S]*?left:\s*50%;[\s\S]*?50%\s*\{[\s\S]*?bottom:\s*-24px;[\s\S]*?left:\s*0;/, '复制按钮应包含互补位移动画关键帧');
    assert.match(quickEntryStyle, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.am-campaign-copy-btn::before,[\s\S]*?\.am-campaign-copy-btn::after\s*\{[\s\S]*?animation:\s*none;/, '复制按钮光影动画应适配减少动画');
    assert.match(quickEntryStyle, /\.am-campaign-copy-icon\s*\{[\s\S]*?position:\s*relative;[\s\S]*?z-index:\s*1;[\s\S]*?width:\s*14px;[\s\S]*?height:\s*14px;[\s\S]*?color:\s*inherit;[\s\S]*?background:\s*transparent;[\s\S]*?box-shadow:\s*none;/, '复制按钮左侧图标应在光影上方且无深色底');
    assert.match(copyBadgeRule, /height:\s*18px;[\s\S]*?min-width:\s*22px;[\s\S]*?padding:\s*0 5px;/, '复制数量徽标应收进 24px 复制按钮内，避免撑高或压矮按钮');
    assert.match(copyBadgeRule, /border-radius:\s*999px;[\s\S]*?border:\s*1px solid rgba\(218,\s*222,\s*235,\s*0\.95\);[\s\S]*?background:\s*rgba\(255,\s*255,\s*255,\s*0\.86\);[\s\S]*?color:\s*#333333;[\s\S]*?font-size:\s*12px;[\s\S]*?font-weight:\s*400;[\s\S]*?box-shadow:\s*none;/, '复制数量徽标应保持简约白底并与左侧按钮字体一致');
    assert.match(quickEntryStyle, /\.am-campaign-copy-btn \.am-wxt-copy-multi-icon\s*\{[\s\S]*?color:\s*inherit;[\s\S]*?opacity:\s*1;[\s\S]*?\.am-campaign-copy-btn \.am-wxt-copy-multi-icon svg\s*\{[\s\S]*?width:\s*12px;[\s\S]*?height:\s*12px;/, '复制数量 + 图标应继承原生文字色并固定为 12px');
    assert.doesNotMatch(copyButtonRule, /border-radius:\s*(?:4px|8px);/, '复制按钮不应回退到旧小圆角或 mx_807 的 8px 圆角');
    assert.doesNotMatch(copyBadgeRule, /rgba\(99,\s*102,\s*241,\s*0\.32\)|#3344c8/, '复制数量徽标不应回退到旧紫色硬编码');
});

test('复制入口读取当前计划详情并调用受控 API', () => {
    assert.match(quickEntry, /queryCampaignDetail\(id,\s*targetBizCode,\s*authContext\)/, '复制前应读取计划详情');
    assert.match(quickEntry, /queryAdgroupDetail\(id,\s*adgroupIds\[0\],\s*targetBizCode,\s*authContext\)/, '复制前应兜底读取单元详情');
    assert.match(quickEntry, /queryCampaignCrowdList\(id,\s*targetBizCode,\s*authContext\)/, '关键词复制前应读取原生需求人群');
    assert.match(quickEntry, /\/crowd\/findList\.json\?\$\{query\.toString\(\)\}/, '需求人群应来自原生 crowd/findList 接口');
    assert.match(quickEntry, /campaign\.crowdList = campaignCrowdList;/, '源计划需求人群应写回 campaign.crowdList 参与复制');
    assert.match(quickEntry, /查询AI点睛需求人群失败，已取消复制/, 'AI点睛源计划读不到需求人群时应 fail-fast，避免半成品复制');
    assert.match(quickEntry, /prepareCopyCurrentPlanContext\(campaignId,[\s\S]*?const previewRows = this\.buildCopyOverviewRows/, '复制详情准备仍应生成最终预览上下文');
    assert.match(quickEntry, /waitForKeywordPlanApiAccessor\(\{[\s\S]*?requiredMethod:\s*'copyCurrentPlanByScene'[\s\S]*?timeoutMs:/, '复制入口应等待受控复制 API 就绪，避免新安装时序下直接失败');
    assert.match(quickEntry, /const quickContext = this\.buildQuickCopyCurrentPlanContext\(campaignId,\s*triggerEl,\s*copyMode,\s*options\);[\s\S]*?return this\.openCopyPlanOverviewDialog\(quickContext,[\s\S]*?prepareContext:\s*async \(\) => \{[\s\S]*?this\.prepareCopyCurrentPlanContext\(campaignId,\s*triggerEl,\s*copyMode,\s*contextOptions\)/, '复制入口应先用快速上下文打开一览窗，再异步读取详情');
    assert.match(quickEntry, /submitPreparedCopyCurrentPlan\(preparedContext,\s*editedRows\)/, '确认提交必须使用异步补齐后的真实上下文');
    assert.match(quickEntry, /resolveCopyContextBizCode\(context = \{\}\)[\s\S]*?this\.getCurrentCampaignBizCode\(\)[\s\S]*?this\.DEFAULT_BIZ_CODE/, '复制确认应能从当前 URL 路由兜底 bizCode');
    assert.match(quickEntry, /const targetBizCode = this\.resolveCopyContextBizCode\(context\);[\s\S]*?context\.bizCode = targetBizCode;[\s\S]*?context\.source\.bizCode = this\.normalizeBizCode\(context\.source\.bizCode \|\| ''\) \|\| targetBizCode;[\s\S]*?context\.source\.campaign\.bizCode = this\.normalizeBizCode\(context\.source\.campaign\.bizCode \|\| ''\) \|\| targetBizCode;/, '确认提交前应把 bizCode 回写到 context/source/campaign');
    assert.match(quickEntry, /copyCurrentPlanByScene\(context\.sceneName,\s*context\.source,\s*\{[\s\S]*?bizCode:\s*targetBizCode,[\s\S]*?copyMode:\s*mode,[\s\S]*?copyCount:\s*copyPlanRows\.length \|\| context\.copyCount,[\s\S]*?usedPlanNames:\s*context\.usedPlanNames,[\s\S]*?targetOnlineStatus:\s*context\.targetOnlineStatus,[\s\S]*?copyPlanRows,[\s\S]*?pauseIfStartedAfterCreate:\s*context\.targetOnlineStatus === 0,[\s\S]*?conflictPolicy:\s*'none'/, '确认后应调用受控复制 API、透传 bizCode，并仅在目标为暂停时启用创建后暂停兜底');
    assert.doesNotMatch(quickEntry, /pauseIfStartedAfterCreate:\s*true,/, '开启复制不应无条件触发创建后暂停兜底');
    assert.match(quickEntry, /resolveCopyTargetOnlineStatus\(source\)/, '复制入口应按源计划当前状态决定新计划状态');
    assert.match(quickEntry, /collectRemoteCampaignPlanNames\(bizCode,\s*authContext,\s*sourcePlanName = ''\)[\s\S]*?searchKey = 'campaignNameLike';[\s\S]*?searchValue = searchSeed;/, '复制前应通过只读列表接口补齐已有计划名，避免刷新后重复命名');
    assert.match(quickEntry, /const remotePlanNames = await this\.collectRemoteCampaignPlanNames\([\s\S]*?const usedPlanNames = Array\.from\(new Set\(\[[\s\S]*?collectVisibleCampaignPlanNames\(document\),[\s\S]*?\.\.\.remotePlanNames/, '复制 API 入参应合并页面可见名称与远端已有名称');
    assert.match(quickEntry, /源计划\$\{id\}[\s\S]*?新计划[\s\S]*?跟随源状态/, '复制日志应包含源计划、新计划名和跟随源状态');
});

test('复制成功后弹窗说明明细并确认页内搜索', () => {
    assert.match(quickEntry, /showCopySuccessDialogAndRefresh\(result,\s*\{[\s\S]*?campaignId:\s*id,[\s\S]*?sourceCampaignId:\s*id,[\s\S]*?mode:\s*copyMode,[\s\S]*?copyCount,[\s\S]*?statusText,[\s\S]*?triggerEl:\s*copyBtn[\s\S]*?\}\);/, '复制成功后应展示明细弹窗并保留可重新定位的触发按钮焦点目标');
    assert.match(quickEntry, /resolveCopiedCampaignIds\(result = \{\}\)[\s\S]*?copySource\.createdCampaignIds[\s\S]*?result\?\.postCreateStatus\?\.campaignIds/, '弹窗明细应优先使用创建后确认的新计划 ID');
    assert.match(quickEntry, /buildCopySuccessDialogMessage\(result = \{\},\s*context = \{\}\)[\s\S]*?'复制计划已成功'[\s\S]*?`本次复制成功：\$\{successCount\} 个`[\s\S]*?'新计划明细：'[\s\S]*?'点击“确定并搜索”后将在计划名称框搜索公共名称。'/, '弹窗应说明复制数量、明细和页内搜索行为');
    assert.match(quickEntry, /popup\.id = 'am-campaign-copy-success-popup';[\s\S]*?popup\.setAttribute\('aria-labelledby',\s*titleId\);[\s\S]*?popup\.setAttribute\('aria-describedby',\s*bodyId\);[\s\S]*?icon\.innerHTML = renderAmIcon\('check-circle'[\s\S]*?title\.id = titleId;[\s\S]*?state\.className = 'am-copy-success-state';[\s\S]*?state\.textContent = '已完成';[\s\S]*?body\.id = bodyId;[\s\S]*?body\.textContent = message\.replace[\s\S]*?confirmBtn\.textContent = '确定并搜索';[\s\S]*?cancelBtn\.textContent = '取消';/, '复制成功后应使用共享 SVG、状态胶囊和标题/描述关联展示明细');
    assert.match(quickEntry, /resolveCopySuccessSearchKeyword\(result = \{\},\s*context = \{\}\)[\s\S]*?const normalizedNewPlanNames = newPlanNames[\s\S]*?\.map\(name => this\.normalizeCopyPlanSearchSeed\(name\)\)[\s\S]*?const newPlanCommonName = this\.resolvePlanNameCommonPart\(normalizedNewPlanNames\);/, '确认搜索应先去掉新计划名最右侧复制序号');
    assert.match(quickEntry, /findCopySuccessPlanNameSearchInput\(\)[\s\S]*?计划名称[\s\S]*?回车搜索/, '确认搜索应定位当前页计划名称搜索框');
    assert.match(quickEntry, /applyCopySuccessPlanNameSearch\(searchValue = '',\s*result = \{\},\s*context = \{\}\)[\s\S]*?setNativeInputValue\(input,\s*normalizedSearchValue\);[\s\S]*?dispatchCopySuccessSearchEnter\(input\);/, '确认搜索应写入输入框并触发回车搜索');
    assert.match(quickEntry, /updateCopySuccessSearchHash\(normalizedSearchValue,\s*result,\s*context\);/, '确认搜索应同步地址栏搜索条件但不刷新页面');
    assert.match(quickEntry, /confirmBtn\.addEventListener\('click',\s*\(\) => \{[\s\S]*?this\.navigateToCopySuccessSearch\(result,\s*context\);/, '用户确认自定义弹窗后应触发页内搜索');
    const navigationSegment = quickEntry.slice(
        quickEntry.indexOf('navigateToCopySuccessSearch(result = {}, context = {})'),
        quickEntry.indexOf('buildCopySuccessDialogMessage(result = {}, context = {})')
    );
    assert.doesNotMatch(navigationSegment, /window\.location\.(?:reload|assign)/, '复制成功确认不应刷新或整页跳转');
    assert.match(quickEntry, /cancelBtn\.addEventListener\('click',\s*\(\) => \{[\s\S]*?popup\.remove\(\);/, '复制成功弹窗取消按钮应只关闭弹窗');
    assert.doesNotMatch(quickEntry, /window\.alert\(message\)/, '复制成功弹窗不能使用浏览器原生 alert');
    const successPopupRule = extractCssRule(quickEntryStyle, '#am-campaign-copy-success-popup');
    const successCardRule = extractCssRule(quickEntryStyle, '#am-campaign-copy-success-popup .am-copy-success-card');
    assert.match(successPopupRule, /position:\s*fixed;/, '复制成功弹窗遮罩应固定覆盖页面');
    assert.match(successPopupRule, /background:\s*rgba\(255,\s*255,\s*255,\s*0\.72\);[\s\S]*?-webkit-backdrop-filter:\s*blur\(8px\) saturate\(1\.15\);[\s\S]*?backdrop-filter:\s*blur\(8px\) saturate\(1\.15\);/, '复制成功弹窗遮罩应改为白色轻玻璃背景');
    assert.doesNotMatch(successPopupRule, /rgba\(27,\s*36,\s*56,\s*0\.28\)|blur\(10px\)/, '复制成功弹窗遮罩不应回退到旧灰色遮罩');
    assert.match(successCardRule, /width:\s*min\(420px,[\s\S]*?border:\s*1px solid var\(--am26-border-strong\);[\s\S]*?border-radius:\s*18px;[\s\S]*?background:\s*linear-gradient\(135deg,\s*rgba\(255,\s*255,\s*255,\s*0\.96\),\s*rgba\(255,\s*255,\s*255,\s*0\.88\)\);[\s\S]*?box-shadow:\s*var\(--am26-shadow\);/, '复制成功弹窗应呈现明确白色轻玻璃面板');
    assert.match(quickEntryStyle, /#am-campaign-copy-success-popup \.am-copy-success-icon\s*\{[\s\S]*?border-radius:\s*50%;[\s\S]*?background:\s*rgba\(14,\s*168,\s*111,\s*0\.14\);[\s\S]*?color:\s*var\(--am26-success\);/, '复制成功弹窗应使用成功语义图标容器');
    assert.match(quickEntryStyle, /#am-campaign-copy-success-popup \.am-copy-success-state\s*\{[\s\S]*?color:\s*var\(--am26-success\);[\s\S]*?background:\s*rgba\(14,\s*168,\s*111,\s*0\.12\);/, '复制成功弹窗应显示成功语义状态胶囊');
    assert.match(quickEntryStyle, /#am-campaign-copy-success-popup \.am-copy-success-title\s*\{[\s\S]*?font-size:\s*16px;[\s\S]*?line-height:\s*24px;[\s\S]*?#am-campaign-copy-success-popup \.am-copy-success-body\s*\{[\s\S]*?font-size:\s*12px;[\s\S]*?line-height:\s*18px;/, '复制成功弹窗字体应按参考原生弹窗尺寸');
    assert.match(quickEntryStyle, /#am-campaign-copy-success-popup \.am-copy-success-confirm,[\s\S]*?#am-campaign-copy-success-popup \.am-copy-success-cancel\s*\{[\s\S]*?min-width:\s*64px;[\s\S]*?height:\s*32px;[\s\S]*?border-radius:\s*500px;[\s\S]*?font-size:\s*12px;/, '复制成功弹窗按钮应保持紧凑胶囊尺寸');
    assert.match(quickEntry, /createCopyFocusTarget\(context = \{\},\s*fallbackElement = null\)[\s\S]*?campaignId[\s\S]*?context\.campaignId[\s\S]*?context\.sourceCampaignId[\s\S]*?data-campaign-id[\s\S]*?mode[\s\S]*?data-am-campaign-copy/, '复制弹窗焦点目标应保存 campaignId 与复制模式，支持运行态重定位');
    assert.match(quickEntry, /resolveCopyFocusTargetElement\(target = null,\s*allowDisabled = true\)[\s\S]*?data-am-campaign-copy="\$\{mode\}"\]\[data-campaign-id="\$\{id\}"\][\s\S]*?isElementVisible\(candidate\)[\s\S]*?allowDisabled[\s\S]*?candidate\.disabled/, '焦点恢复应能按当前可见复制按钮重新定位，并跳过未就绪禁用按钮');
    assert.match(quickEntry, /copyFocusRestoreTimer:\s*null,/, '复制焦点恢复 timer 缺少可清理句柄');
    assert.match(quickEntry, /clearCopyFocusRestoreTimer\(\)\s*\{[\s\S]*?if \(!this\.copyFocusRestoreTimer\) return;[\s\S]*?window\.clearTimeout\(this\.copyFocusRestoreTimer\);[\s\S]*?this\.copyFocusRestoreTimer = null;[\s\S]*?\}/, '复制焦点恢复 timer 应支持显式清理并归零');
    assert.match(quickEntry, /scheduleCopyFocusRestore\(target = null,\s*attempt = 0,\s*delay = 0\)\s*\{[\s\S]*?this\.clearCopyFocusRestoreTimer\(\);[\s\S]*?this\.copyFocusRestoreTimer = window\.setTimeout\(\(\) => \{[\s\S]*?this\.copyFocusRestoreTimer = null;[\s\S]*?this\.runCopyFocusRestore\(target,\s*attempt\);[\s\S]*?\},\s*delay\);[\s\S]*?\}/, '复制焦点恢复应通过可取消 helper 调度');
    assert.match(quickEntry, /runCopyFocusRestore\(target = null,\s*attempt = 0\)[\s\S]*?this\.resolveCopyFocusTargetElement\(target,\s*true\)[\s\S]*?if \(!element \|\| \('disabled' in element && element\.disabled\)\) \{[\s\S]*?if \(attempt < 6\) this\.scheduleCopyFocusRestore\(target,\s*attempt \+ 1,\s*50\);[\s\S]*?requestAnimationFrame\(\(\) => \{[\s\S]*?readyElement\.focus\(\{ preventScroll: true \}\)/, '焦点恢复应等待触发按钮解除禁用后再执行并保留 rAF 聚焦');
    assert.match(quickEntry, /restoreFocusWhenReady\(target = null,\s*attempt = 0\)\s*\{\s*this\.scheduleCopyFocusRestore\(target,\s*attempt,\s*0\);\s*\}/, 'restoreFocusWhenReady 应只委托焦点恢复调度 helper');
    assert.doesNotMatch(quickEntry, /window\.setTimeout\(\(\) => this\.restoreFocusWhenReady\(target,\s*attempt \+ 1\),\s*50\)/, '复制焦点恢复不应继续排无句柄 50ms retry timeout');
    assert.match(quickEntry, /const focusBackTarget = this\.createCopyFocusTarget\(context,\s*previousActiveElement\);[\s\S]*?const restoreFocus = \(\) => \{[\s\S]*?this\.restoreFocusWhenReady\(focusBackTarget\);[\s\S]*?popup\.addEventListener\('keydown'[\s\S]*?event\.key !== 'Escape'/, '复制成功弹窗应支持 Esc 关闭并优先恢复到触发按钮');
    assert.match(quickEntry, /const createdCampaignIds = this\.resolveCopiedCampaignIds\(result\);[\s\S]*?if \(!createdCampaignIds\.length && successCount <= 0\) \{[\s\S]*?创建接口未返回成功的新计划/, '无成功新计划时不应进入成功弹窗刷新链路');
});

test('复制提交前先展示可编辑一览窗并在确认后显示生成中', () => {
    assert.match(quickEntry, /popup\.id = 'am-campaign-copy-overview-popup';[\s\S]*?popup\.setAttribute\('aria-labelledby',\s*titleId\);[\s\S]*?popup\.setAttribute\('aria-describedby',\s*statusId\);/, '复制前一览窗应通过标题和状态区建立可访问名称与描述');
    assert.match(quickEntry, /class="am-copy-overview-icon">\$\{renderAmIcon\('campaign-copy'[\s\S]*?class="am-copy-overview-title" id="\$\{titleId\}"[\s\S]*?data-am-copy-overview-state>[\s\S]*?class="am-copy-overview-close" aria-label="关闭">\$\{renderAmIcon\('close'/, '复制前一览窗应使用共享 SVG 图标、状态胶囊和 close 图标');
    for (const label of ['计划名称', '计划出价方式', '出价价格', '预算']) {
        assert.match(quickEntry, new RegExp(`<th>${label}<\\/th>`), `一览窗缺少 ${label} 列`);
    }
    for (const field of ['planName', 'bidPrice', 'budgetField', 'budgetValue']) {
        assert.match(quickEntry, new RegExp(`data-am-copy-field="${field}"`), `一览窗缺少可编辑字段 ${field}`);
    }
    assert.match(quickEntry, /data-am-copy-field="bidModeDisplay" class="am-copy-overview-static"/, '出价方式应展示源计划文案而不是可编辑输入框');
    assert.doesNotMatch(quickEntry, /data-am-copy-field="bidMode" class="am-copy-overview-input"/, '出价方式不应作为可编辑字段展示');
    for (const bulkField of ['bidStart', 'bidEnd', 'bidStepPreview', 'budgetField', 'budgetValue']) {
        assert.match(quickEntry, new RegExp(`data-am-copy-bulk="${bulkField}"`), `一览窗批量工具缺少 ${bulkField}`);
    }
    assert.match(quickEntry, /data-am-copy-bulk-action="bidGradient"/, '一览窗应提供批量应用出价梯度按钮');
    assert.match(quickEntry, /data-am-copy-bulk-action="budgetAll"/, '一览窗应提供批量应用预算按钮');
    assert.match(quickEntry, /applyCopyBidGradientToPopup\(popup\)/, '出价梯度按钮应批量写入弹窗行内出价');
    assert.match(quickEntry, /applyCopyBudgetBulkToPopup\(popup\)/, '预算批量按钮应批量写入弹窗行内预算');
    assert.match(quickEntry, /const step = inputs\.length > 1 \? \(end - start\) \/ \(inputs\.length - 1\) : 0;/, '出价梯度应按首价到尾价和可编辑行数等差计算');
    assert.match(quickEntry, /input\.value = this\.formatCopyBulkNumber\(start \+ \(step \* index\)\);/, '出价梯度应逐行写入计算后的价格');
    assert.match(quickEntry, /select\.value = budgetField;[\s\S]*?input\.value = budgetValue;/, '批量预算应同时写入预算类型和预算值');
    assert.match(quickEntry, /bidStartInput\?\.addEventListener\('input'[\s\S]*?previewCopyBidGradientStep/, '首价变化应刷新区间间隔展示');
    assert.match(quickEntry, /bidEndInput\?\.addEventListener\('input'[\s\S]*?previewCopyBidGradientStep/, '尾价变化应刷新区间间隔展示');
    assert.match(quickEntry, /bidPriceEditable:\s*!!bidPrice/, '源计划没有出价时行内出价应标记为不可编辑');
    assert.match(quickEntry, /data-am-copy-field="bidPrice"[\s\S]*?\$\{row\.bidPriceEditable === false \? 'disabled data-am-copy-readonly="1" placeholder="无出价"' : ''\}/, '无源出价的行内出价输入应禁用');
    assert.match(quickEntry, /const hasEditableBidPrice = rows\.some\(row => row\?\.bidPriceEditable !== false && this\.normalizeCopyEditableNumber\(row\?\.bidPrice \|\| ''\)\);/, '批量出价应只在存在源出价时可用');
    assert.match(quickEntry, /data-am-copy-bulk-action="bidGradient"[\s\S]*?\$\{hasEditableBidPrice \? '' : 'disabled data-am-copy-readonly="1"'\}/, '无源出价时批量出价按钮应禁用');
    assert.match(quickEntry, /getCopyEditableBidPriceInputs\(popup\)[\s\S]*?data-am-copy-field="bidPrice"[\s\S]*?input\.dataset\.amCopyReadonly !== '1' && !input\.disabled/, '批量出价应跳过只读或禁用出价输入');
    assert.match(quickEntry, /if \(!inputs\.length\) return \{ ok: false, message: '源计划没有出价价格，无法批量编辑出价' \};/, '无可编辑出价时批量应用应明确提示并不写入');
    assert.match(quickEntry, /bidPrice:\s*bidPriceEditable \? this\.normalizeCopyEditableNumber\(bidPriceInput\?\.value \|\| ''\) : '',/, '只读出价确认时不应写入 bidPrice 覆盖');
    assert.match(quickEntry, /el\.disabled = !!running \|\| el\.dataset\.amCopyReadonly === '1';/, '提交失败恢复运行态后只读出价仍应保持禁用');
    assert.match(quickEntry, /resolveCopyBidModeDisplaySeed\(source,\s*context\.triggerEl\)/, '出价方式展示应优先使用源计划显示文案');
    assert.match(quickEntry, /const fromVisibleRow = this\.resolveCopyBidModeDisplayFromElement\(triggerEl\);[\s\S]*?const smartBidDetail = this\.resolveCopySmartBidDetailSeed\(source,\s*triggerEl\);[\s\S]*?if \(fromVisibleRow\) return this\.formatCopyBidModeDisplayWithDetail\(fromVisibleRow,\s*smartBidDetail\);/, '出价方式应优先取当前列表行展示，并在智能出价时拼接目标明细');
    assert.match(quickEntry, /formatCopySmartBidDetailDisplay\(value = ''\)[\s\S]*?return '促点击';[\s\S]*?return '促收藏加购';[\s\S]*?return '促成交';/, '一览窗应把智能出价目标归一为促点击/促收藏加购/促成交');
    assert.match(quickEntry, /resolveCopySmartBidDetailSeed\(source = \{\},\s*triggerEl = null\)[\s\S]*?campaign\.constraintType,[\s\S]*?campaign\.bidTargetV2,[\s\S]*?campaign\.optimizeTarget,[\s\S]*?campaign\.subOptimizeTarget/, '智能出价明细应从源计划目标合同字段解析');
    assert.match(quickEntry, /formatCopyBidModeDisplayWithDetail\(modeDisplay = '',\s*smartDetail = ''\)[\s\S]*?if \(!detail \|\| !\/智能出价\/\.test\(base\) \|\| base\.includes\(detail\)\) return base;[\s\S]*?return `\$\{base\}（\$\{detail\}）`;/, '智能出价展示应拼接目标明细且保持手动出价不追加');
    assert.match(quickEntry, /querySelectorAll\(`a\[href\*="campaignId=\$\{campaignId\}"\], a\[href\*="campaignId%3D\$\{campaignId\}"\]`\)/, '固定操作列按钮应通过 campaignId 回到当前计划行提取出价方式');
    assert.match(quickEntry, /campaignLinkCount > 3/, '出价方式提取必须避开包含多计划的整表容器');
    assert.match(quickEntry, /if \(text\.length > 2500\) break;[\s\S]*?if \(text\.length > 1200\)/, '出价方式行文本提取不能扫到整张表导致误取其它计划');
    assert.match(quickEntry, /data-am-copy-overview-status role="status" aria-live="polite">\$\{contextReady \? '确认后才会提交创建请求。' : '已打开预览，正在读取源计划详情\.\.\.'\}/, '一览窗应先显示读取态并使用 live status 语义');
    assert.match(quickEntry, /setStatus\('生成中：正在提交复制请求，请勿重复操作。',\s*'running'\);/, '确认提交后应显示生成中状态');
    assert.match(quickEntry, /validateCopyOverviewRows\(editedRows\)/, '确认提交前应校验编辑行');
    assert.match(quickEntry, /let prepareContextTimerId = 0;/, '复制前一览窗详情准备 timer 缺少局部句柄');
    assert.match(quickEntry, /const clearPrepareContextTimer = \(\) => \{[\s\S]*?if \(!prepareContextTimerId\) return;[\s\S]*?clearTimeout\(prepareContextTimerId\);[\s\S]*?prepareContextTimerId = 0;[\s\S]*?\};/, '复制前一览窗详情准备 timer 应支持显式清理并归零');
    assert.match(quickEntry, /const removePopup = \(\) => \{[\s\S]*?clearPrepareContextTimer\(\);[\s\S]*?popup\.remove\(\);[\s\S]*?restoreFocus\(\);[\s\S]*?\};/, '复制前一览窗关闭时应释放 pending 详情准备 timer');
    assert.match(quickEntry, /setStatus\('生成中：正在提交复制请求，请勿重复操作。',\s*'running'\);[\s\S]*?clearPrepareContextTimer\(\);[\s\S]*?const result = await submitCallback\(editedRows,\s*activeContext\);/, '复制前一览窗提交前应释放 pending 详情准备 timer');
    assert.match(quickEntry, /const startPrepareContext = \(\) => \{[\s\S]*?options\.prepareContext[\s\S]*?renderCopyOverviewRows\(popup,\s*activeContext\)[\s\S]*?setReadyState\(true,\s*'源计划详情已读取完成，确认后才会提交创建请求。'\)/, '一览窗打开后应异步补齐真实预览行并切回待确认');
    assert.match(quickEntry, /const schedulePrepareContext = \(\) => \{[\s\S]*?clearPrepareContextTimer\(\);[\s\S]*?prepareContextTimerId = setTimeout\(\(\) => \{[\s\S]*?prepareContextTimerId = 0;[\s\S]*?startPrepareContext\(\);[\s\S]*?\},\s*0\);[\s\S]*?\};/, '复制前一览窗详情准备应通过可取消 timeout 调度并在触发后归零');
    assert.doesNotMatch(quickEntry, /setTimeout\(startPrepareContext,\s*0\);/, '复制前一览窗不应继续排无句柄详情准备 timeout');
    assert.match(quickEntry, /requestAnimationFrame\(\(\) => \{[\s\S]*?schedulePrepareContext\(\);[\s\S]*?\}\);/, '源计划详情读取应延后到弹窗首帧之后启动');
    assert.match(quickEntry, /if \(!contextReady\) \{[\s\S]*?setStatus\('源计划详情仍在读取中，请稍候。',\s*'running'\);[\s\S]*?return;[\s\S]*?\}/, '详情未读完时确认按钮不能提交');
    const overviewPopupRule = extractCssRule(quickEntryStyle, '#am-campaign-copy-overview-popup');
    const overviewCardRule = extractCssRule(quickEntryStyle, '#am-campaign-copy-overview-popup .am-copy-overview-card');
    assert.match(overviewPopupRule, /position:\s*fixed;/, '复制前一览窗遮罩应固定覆盖页面');
    assert.match(overviewPopupRule, /background:\s*rgba\(255,\s*255,\s*255,\s*0\.72\);[\s\S]*?-webkit-backdrop-filter:\s*blur\(8px\) saturate\(1\.15\);[\s\S]*?backdrop-filter:\s*blur\(8px\) saturate\(1\.15\);/, '复制前一览窗遮罩应改为白色轻玻璃背景');
    assert.doesNotMatch(overviewPopupRule, /rgba\(27,\s*36,\s*56,\s*0\.28\)|blur\(10px\)/, '复制前一览窗遮罩不应回退到旧灰色遮罩');
    assert.match(overviewCardRule, /width:\s*min\(1080px,[\s\S]*?border:\s*1px solid var\(--am26-border-strong\);[\s\S]*?border-radius:\s*18px;[\s\S]*?background:\s*linear-gradient\(135deg,\s*rgba\(255,\s*255,\s*255,\s*0\.96\),\s*rgba\(255,\s*255,\s*255,\s*0\.88\)\);[\s\S]*?box-shadow:\s*var\(--am26-shadow\);/, '一览窗应呈现明确白色轻玻璃面板并保持宽屏容量');
    assert.match(quickEntryStyle, /#am-campaign-copy-overview-popup \.am-copy-overview-table-wrap\s*\{[\s\S]*?overflow-x:\s*hidden;[\s\S]*?overflow-y:\s*auto;/, '一览窗不应出现横向滚动条');
    assert.match(quickEntryStyle, /#am-campaign-copy-overview-popup \.am-copy-overview-table[\s\S]*?table-layout:\s*auto;/, '一览窗表格应按内容自动适配列宽');
    assert.match(quickEntryStyle, /#am-campaign-copy-overview-popup \.am-copy-overview-bulkbar\s*\{[\s\S]*?display:\s*flex;[\s\S]*?flex-wrap:\s*wrap;[\s\S]*?border-bottom:\s*1px solid rgba\(255,\s*255,\s*255,\s*0\.42\);/, '批量编辑区应为可换行轻量玻璃工具条');
    assert.match(quickEntryStyle, /#am-campaign-copy-overview-popup \.am-copy-overview-state,[\s\S]*?#am-campaign-copy-success-popup \.am-copy-success-state\s*\{[\s\S]*?border:\s*1px solid var\(--am26-border\);[\s\S]*?border-radius:\s*999px;[\s\S]*?background:\s*var\(--am26-surface-strong\);[\s\S]*?color:\s*var\(--am26-primary\);/, '复制弹窗状态胶囊应复用统一 token');
    assert.match(quickEntryStyle, /#am-campaign-copy-overview-popup \.am-copy-overview-bulk-input,[\s\S]*?#am-campaign-copy-overview-popup \.am-copy-overview-bulk-select\s*\{[\s\S]*?border:\s*0;[\s\S]*?border-bottom:\s*1px solid rgba\(80,\s*90,\s*116,\s*0\.28\);/, '批量编辑输入也应使用 token 化轻量下划线样式');
    assert.match(quickEntryStyle, /#am-campaign-copy-overview-popup \.am-copy-overview-bulk-btn\s*\{[\s\S]*?border-radius:\s*500px;[\s\S]*?color:\s*var\(--am26-primary\);/, '批量编辑按钮应沿用弹窗胶囊按钮风格');
    assert.match(quickEntryStyle, /#am-campaign-copy-overview-popup \.am-copy-overview-table th:nth-child\(3\),[\s\S]*?#am-campaign-copy-overview-popup \.am-copy-overview-table td:nth-child\(3\)\s*\{[\s\S]*?width:\s*1%;[\s\S]*?min-width:\s*146px;[\s\S]*?white-space:\s*nowrap;/, '计划出价方式列应容纳智能出价目标明细并保持紧凑展示');
    assert.match(quickEntryStyle, /#am-campaign-copy-overview-popup \.am-copy-overview-table th:nth-child\(5\),[\s\S]*?#am-campaign-copy-overview-popup \.am-copy-overview-table td:nth-child\(5\)\s*\{[\s\S]*?width:\s*1%;[\s\S]*?min-width:\s*172px;[\s\S]*?white-space:\s*nowrap;/, '预算列应按控件内容紧凑展示');
    assert.match(quickEntryStyle, /#am-campaign-copy-overview-popup \.am-copy-overview-budget-cell\s*\{[\s\S]*?grid-template-columns:\s*76px 82px;/, '预算编辑控件不应撑宽整列');
    assert.match(quickEntryStyle, /#am-campaign-copy-overview-popup \.am-copy-overview-input,[\s\S]*?#am-campaign-copy-overview-popup \.am-copy-overview-select\s*\{[\s\S]*?border:\s*0;[\s\S]*?border-bottom:\s*1px solid rgba\(80,\s*90,\s*116,\s*0\.28\);[\s\S]*?background:\s*transparent;/, '一览窗编辑控件应使用无外框的 token 下划线样式');
    assert.match(quickEntryStyle, /#am-campaign-copy-overview-popup \.am-copy-overview-input:focus,[\s\S]*?#am-campaign-copy-overview-popup \.am-copy-overview-select:focus\s*\{[\s\S]*?border-bottom-color:\s*var\(--am26-primary\);/, '一览窗编辑控件 focus 仅强调底部线条');
    assert.match(quickEntryStyle, /#am-campaign-copy-overview-popup \.am-copy-overview-status\.is-running\s*\{[\s\S]*?color:\s*var\(--am26-primary-strong\);[\s\S]*?background:\s*rgba\(69,\s*84,\s*229,\s*0\.1\);[\s\S]*?#am-campaign-copy-overview-popup \.am-copy-overview-status\.is-success\s*\{[\s\S]*?color:\s*var\(--am26-success\);[\s\S]*?background:\s*rgba\(14,\s*168,\s*111,\s*0\.12\);[\s\S]*?#am-campaign-copy-overview-popup \.am-copy-overview-status\.is-error\s*\{[\s\S]*?color:\s*var\(--am26-danger\);[\s\S]*?background:\s*rgba\(234,\s*79,\s*79,\s*0\.12\);/, '一览窗状态条应使用统一语义 token');
    assert.doesNotMatch(quickEntryStyle, /#am-campaign-copy-overview-popup \.am-copy-overview-status\.is-running\s*\{[\s\S]*?#eff6ff|#am-campaign-copy-overview-popup \.am-copy-overview-status\.is-success\s*\{[\s\S]*?#edf9f2|#am-campaign-copy-overview-popup \.am-copy-overview-status\.is-error\s*\{[\s\S]*?#fff1f1/, '一览窗状态条不应回退到旧硬编码状态底色');
    assert.match(quickEntry, /openCopyPlanOverviewDialog\(context = \{\},\s*submitCallback,\s*options = \{\}\)[\s\S]*?const focusBackTarget = this\.createCopyFocusTarget\(context,\s*previousActiveElement\);[\s\S]*?const restoreFocus = \(\) => \{[\s\S]*?this\.restoreFocusWhenReady\(focusBackTarget\);[\s\S]*?popup\.addEventListener\('keydown'[\s\S]*?event\.key !== 'Escape'/, '复制前一览窗应支持 Esc 关闭并优先恢复到触发按钮');
    assert.match(quickEntryStyle, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?#am-campaign-copy-overview-popup \.am-copy-overview-close,[\s\S]*?#am-campaign-copy-success-popup \.am-copy-success-confirm/, '复制弹窗动效应适配减少动画');
});

test('copyCurrentPlanByScene 通过白名单和瞬态字段清理构造创建请求', () => {
    assert.match(wizardApi, /const copyCurrentPlanByScene\s*=\s*async/, '缺少复制当前计划公开方法');
    for (const field of ['dayBudget', 'optimizeTarget', 'launchTime', 'launchPeriodList', 'launchAreaStrList', 'orderInfo', 'aiMaxInfo', 'aiMaxSwitch', 'campaignShieldWords']) {
        assert.match(wizardApi, new RegExp(`COPY_CAMPAIGN_FIELD_WHITELIST[\\s\\S]*?'${field}'`), `campaign 白名单缺少 ${field}`);
    }
    assert.match(wizardApi, /COPY_ADGROUP_FIELD_WHITELIST[\s\S]*?'material'[\s\S]*?'wordList'[\s\S]*?'crowdList'/, 'adgroup 白名单缺少商品、关键词或人群字段');
    assert.match(wizardApi, /purgeCreateTransientFields\(sanitizeCampaign\(copyPickWhitelistedFields\(campaignSource,\s*COPY_CAMPAIGN_FIELD_WHITELIST\)\)\)/, 'campaign 复制未先白名单再清理瞬态字段');
    assert.match(wizardApi, /purgeCreateTransientFields\(sanitizeAdgroup\(copyPickWhitelistedFields\(adgroupSource,\s*COPY_ADGROUP_FIELD_WHITELIST\)\)\)/, 'adgroup 复制未先白名单再清理瞬态字段');
    assert.match(wizardApi, /COPY_DROP_STATUS_FIELDS\s*=\s*\['status',\s*'displayStatus',\s*'planStatus',\s*'campaignStatus'\]/, '复制应丢弃旧状态展示字段');
    assert.match(wizardApi, /const buildCurrentPlanCopiedPlanName = \(sourcePlanName = '', sceneName = '', copyIndex = 0, usedPlanNameSet = new Set\(\)\) => \{[\s\S]*?const hasAutoTimeSuffix = \/\(\?:_\\d\{8\}\|\\d\{14\}\|_\\d\{8\}_\\d\{6\}\)\$\/\.test\(baseSeed\);[\s\S]*?let candidate = `\$\{base\}_\$\{serialCursor\}`;[\s\S]*?usedPlanNames\.add\(candidate\);/, '复制计划名应复刻组建计划的连续序号命名');
    assert.match(wizardApi, /const normalizeCurrentPlanCopyRowList = \(options = \{\}\) => \{[\s\S]*?options\.copyPlanRows/, '复制 API 应支持每行编辑数据');
    assert.match(wizardApi, /const normalizeCurrentPlanCopyPlanNameList = \(options = \{\}\) => \{[\s\S]*?rowNames[\s\S]*?options\.newPlanNames/, '复制 API 应支持显式计划名数组');
    assert.match(wizardApi, /const copyCount = normalizeCurrentPlanCopyCount\(options\);[\s\S]*?const copyPlanRows = normalizeCurrentPlanCopyRowList\(options\);[\s\S]*?const newPlanNames = buildCurrentPlanCopiedPlanNames\(sourcePlanName,\s*targetScene,\s*copyCount,\s*source,\s*options\);/, '复制 API 应支持组建计划同款复制数量和一览窗行数据');
    assert.match(wizardApi, /const bizCode = normalizeSceneBizCode\(options\.bizCode \|\| campaign\.bizCode \|\| source\?\.bizCode \|\| resolveSceneBizCodeHint\(targetScene\) \|\| ''\);/, '确认提交传入的 options.bizCode 必须参与复制请求组包');
    assert.match(wizardApi, /const marketingGoal = resolveCurrentPlanCopyMarketingGoal\(targetScene,\s*source,\s*campaign,\s*options\);/, '复制请求应显式补齐营销目标，避免严格目标匹配失败');
    assert.match(wizardApi, /marketingGoal,[\s\S]*?planNamePrefix:\s*newPlanName/, '复制顶层请求应带 marketingGoal');
    assert.match(wizardApi, /common:\s*\{[\s\S]*?marketingGoal,[\s\S]*?rawOverrides:/, '复制 common 请求应带 marketingGoal');
    assert.match(wizardApi, /plans:\s*newPlanNames\.map\(\(planName,\s*index\) => \{[\s\S]*?const row = copyPlanRows\[index\] \|\| \{\};[\s\S]*?applyCurrentPlanCopyRowOverrides\(plan,\s*planCampaign,\s*planAdgroup,\s*row\);[\s\S]*?return plan;/, '复制计划请求应按复制数量生成多条计划并合并每行编辑值');
    assert.match(wizardApi, /const applyCurrentPlanCopyRowOverrides = \(plan = \{\},\s*planCampaign = \{\},\s*planAdgroup = \{\},\s*row = \{\}\) => \{[\s\S]*?planCampaign\[budgetField\] = budgetValue;[\s\S]*?plan\.budget = \{ \[budgetField\]: budgetValue \};/, '每行预算覆盖应写入 campaign 和 plan.budget');
    assert.match(wizardApi, /plan\.keywordDefaults = \{[\s\S]*?bidPrice[\s\S]*?planAdgroup\.bidPrice = bidPrice;/, '每行出价价格应写入关键词默认出价和 adgroup');
});

test('关键词 AI点睛当前计划复制在源词包为空时补齐流量智选词包', () => {
    assert.match(
        wizardApi,
        /const COPY_KEYWORD_TRAFFIC_SMART_WORD_PACKAGE_LIST = \[[\s\S]*?wordPackageId:\s*0,[\s\S]*?wordPackageName:\s*'流量智选'[\s\S]*?strategyId:\s*1,\s*strategyName:\s*'好词优选',\s*onlineStatus:\s*1[\s\S]*?strategyId:\s*2,\s*strategyName:\s*'捡漏',\s*onlineStatus:\s*0[\s\S]*?strategyId:\s*3,\s*strategyName:\s*'类目优选',\s*onlineStatus:\s*1/,
        '复制链路缺少服务端已验证通过的默认流量智选词包合同'
    );
    assert.match(
        wizardApi,
        /const isCurrentPlanCopyKeywordAiMaxEnabled = \(campaign = \{\}\) => \{[\s\S]*?campaign\.aiMaxSwitch \?\? aiMaxInfo\.aiMaxSwitch[\s\S]*?=== 1;/,
        '复制链路未识别 campaign.aiMaxSwitch / aiMaxInfo.aiMaxSwitch'
    );
    assert.match(
        wizardApi,
        /const isKeywordAiMaxCopy = bizCode === 'onebpSearch' && isCurrentPlanCopyKeywordAiMaxEnabled\(campaign\);/,
        '默认词包只应作用于关键词推广 AI点睛复制'
    );
    assert.match(
        wizardApi,
        /const commonSourceWordPackageList = Array\.isArray\(adgroup\.wordPackageList\) && adgroup\.wordPackageList\.length[\s\S]*?: \(isKeywordAiMaxCopy \? buildCopyKeywordTrafficSmartWordPackageList\(\) : \[]\);[\s\S]*?commonAdgroup\.wordPackageList = deepClone\(commonSourceWordPackageList\);/,
        'common rawOverrides.adgroup 未在源词包为空时补齐默认流量智选词包'
    );
    assert.match(
        wizardApi,
        /useWordPackage:\s*isKeywordAiMaxCopy \|\| commonSourceWordPackageList\.length > 0/,
        'common.useWordPackage 未随 AI点睛默认词包同步开启'
    );
    assert.match(
        wizardApi,
        /const sourceWordPackageList = Array\.isArray\(planAdgroup\.wordPackageList\) && planAdgroup\.wordPackageList\.length[\s\S]*?: deepClone\(commonSourceWordPackageList\);[\s\S]*?planAdgroup\.wordPackageList = deepClone\(sourceWordPackageList\);/,
        'plan rawOverrides.adgroup 未继承默认流量智选词包'
    );
    assert.match(
        wizardApi,
        /const planUseWordPackage = isKeywordAiMaxCopy \|\| sourceWordPackageList\.length > 0;[\s\S]*?keywordSource:\s*\{[\s\S]*?useWordPackage:\s*planUseWordPackage[\s\S]*?\},[\s\S]*?useWordPackage:\s*planUseWordPackage/,
        'plan.useWordPackage / keywordSource.useWordPackage 未同步开启'
    );
});

test('人群当前计划复制使用官方复制接口，关键词走通用创建路径', () => {
    assert.match(
        apiIntro,
        /const buildOneApiUrl = \(path, bizCode\) => \{[\s\S]*?const url = new URL\(String\(path \|\| ''\), 'https:\/\/one\.alimama\.com'\);[\s\S]*?url\.searchParams\.set\('csrfId', csrfId\);[\s\S]*?url\.searchParams\.set\('bizCode', bizCode\);[\s\S]*?return url\.toString\(\);/,
        'requestOne 构造 URL 时应使用 URLSearchParams.set 去重已有 bizCode query'
    );
    assert.doesNotMatch(
        apiIntro,
        /path\}\$\{hasQuery \? '&' : '\?'\}csrfId=.*&bizCode=/,
        'requestOne 不应在已有 ?bizCode 的 endpoint 后继续字符串拼接重复 bizCode'
    );
    assert.match(
        sceneSpecSource,
        /const normalizeCapturePathWithQuery = \(rawUrl = ''\) => \{[\s\S]*return path \? `\$\{path\}\$\{query\}` : '';/,
        '创建端点归一化应保留 query 参数，避免丢失 bizCode'
    );
    assert.match(
        sceneSpecSource,
        /if \(\/\\\/solution\\\/addList\\\.json\$\/i\.test\(endpointPath\)\) \{[\s\S]*url\.searchParams\.set\('bizCode', 'onebpSearch'\);[\s\S]*return `\$\{url\.pathname\}\$\{url\.search\}`;/,
        '关键词受控 addList 创建端点必须补齐 ?bizCode=onebpSearch'
    );
    const officialCopySceneSegment = extractFunctionSegment(
        wizardApi,
        'const isOfficialCopyScene = (meta = {}) => {',
        '        const formatOfficialCopyDate'
    );
    assert.match(officialCopySceneSegment, /bizCode === 'onebpDisplay'[\s\S]*?meta\?\.sceneName === '人群推广';/, '人群推广应进入官方复制分支');
    assert.doesNotMatch(officialCopySceneSegment, /onebpSearch/, '关键词推广不能进入官方 solution/copy 分支');
    assert.doesNotMatch(officialCopySceneSegment, /关键词推广/, '关键词推广不能进入官方 solution/copy 分支');
    const officialCopyBranchIndex = wizardApi.indexOf('if (isOfficialCopyScene(baseMeta))');
    const itemRequiredIndex = wizardApi.indexOf("if (!item) throw new Error('复制计划缺少商品参数');");
    assert.ok(officialCopyBranchIndex > -1, '官方复制场景应在组包阶段提前返回官方复制 meta');
    assert.ok(itemRequiredIndex > officialCopyBranchIndex, '人群官方复制场景不应先要求商品参数');
    assert.match(wizardApi, /const buildOfficialCopyPayload = \(meta = \{\},\s*planName = '',\s*source = \{\},\s*options = \{\}\) => \{[\s\S]*?copyCampaignId:\s*Number\(sourceCampaignId\),[\s\S]*?campaignName:[\s\S]*?campaignGroupName:[\s\S]*?campaignGroupId:[\s\S]*?startTime,[\s\S]*?launchForever:/, '官方复制请求应对齐原生弹窗提交字段');
    assert.match(wizardApi, /requestOne\('\/campaign\/copy\/campaignCheck\.json',\s*bizCode,[\s\S]*?campaignId:\s*payload\.copyCampaignId/, '提交官方复制前应走原生 campaignCheck');
    assert.match(wizardApi, /requestOne\('\/solution\/copy\.json',\s*bizCode,\s*payload,\s*options\.requestOptions \|\| \{\}\)/, '人群推广应调用原生 solution/copy.json');
    assert.match(wizardApi, /const result = isOfficialCopyScene\(meta\)[\s\S]*?\? await copyCurrentPlanByOfficialApi\(meta,\s*source,\s*options\)[\s\S]*?: await createPlansByScene/, '关键词推广应落到 createPlansByScene 通用创建路径');
    assert.match(wizardApi, /officialCopyPayloads:\s*payloads/, '官方复制 dry-run/结果应暴露官方 payload 方便受保护验证');
    assert.match(wizardApi, /const postCreateStatus = await pauseCopiedCampaignsAfterCreate\(meta\.sceneName,\s*resultWithCreatedIds,\s*meta,\s*options\);/, '官方复制后仍应复用创建后暂停兜底');
    assert.match(wizardApi, /keywordMode:\s*commonSourceWordList\.length \? 'manual' : undefined/, '关键词复制应使用归一后的源计划关键词，不应默认重建推荐词');
    assert.match(wizardApi, /const keywordSourceMode = sourceWordList\.length \? 'manual' : 'mixed';[\s\S]*?keywords:\s*sourceWordList,[\s\S]*?keywordSource:\s*\{[\s\S]*?mode:\s*keywordSourceMode/, '关键词复制 plan 应显式带源 wordList');
});

test('关键词当前计划复制保留隐藏配置、创意和原生智能出价目标合同', () => {
    for (const field of ['aiMaxInfo', 'aiMaxSwitch', 'sourceChannel', 'channelLocation', 'selectedTargetBizCode', 'campaignShieldWords', 'shieldWords', 'shieldCenterWords', 'adzoneList', 'launchAreaStrList', 'launchPeriodList', 'enableRuleAuto', 'ruleCommand', 'smartCreative', 'creativeSetMode', 'openAutoCreative', 'openStaticCreative']) {
        assert.match(draftBuilder, new RegExp(`KEYWORD_CUSTOM_CAMPAIGN_ALLOW_KEYS[\\s\\S]*?'${field}'`), `关键词复制裁剪白名单缺少 ${field}`);
    }
    for (const field of ['sourceChannel', 'channelLocation', 'selectedTargetBizCode', 'adzoneList', 'launchAreaStrList', 'launchPeriodList', 'campaignShieldWords', 'shieldWords', 'shieldCenterWords']) {
        assert.match(wizardApi, new RegExp(`COPY_CAMPAIGN_FIELD_WHITELIST[\\s\\S]*?'${field}'`), `复制 campaign 白名单缺少官方入口来源字段 ${field}`);
    }
    for (const field of ['wordList', 'wordPackageList', 'adzoneList', 'crowdList', 'smartCreative', 'creativeSetMode', 'openAutoCreative', 'openStaticCreative', 'creativeList', 'creativeInfo', 'materialList']) {
        assert.match(draftBuilder, new RegExp(`KEYWORD_CUSTOM_ADGROUP_ALLOW_KEYS[\\s\\S]*?'${field}'`), `关键词单元裁剪白名单缺少 ${field}`);
        assert.match(wizardApi, new RegExp(`COPY_ADGROUP_FIELD_WHITELIST[\\s\\S]*?'${field}'`), `复制单元白名单缺少 ${field}`);
    }
    assert.match(wizardApi, /const pickCopyCampaignCrowdList = \(source = \{\}\) => \{[\s\S]*?source\?\.campaign\?\.crowdList,[\s\S]*?source\?\.crowdList,[\s\S]*?source\?\.aiMaxCrowdList/, '复制 API 应兼容源计划需求人群字段');
    assert.match(wizardApi, /campaign\.crowdList = purgeCreateTransientFields\(sourceCrowdList\);/, '复制 API 应把原生需求人群写入创建 campaign.crowdList 并清理旧计划 ID');
    assert.match(wizardApi, /COPY_CAMPAIGN_FIELD_WHITELIST[\s\S]*?'crowdList'/, 'campaign 白名单必须保留需求人群 crowdList');
    assert.match(draftBuilder, /const resolvedLaunchAreaList = resolveNonEmptyArrayField\([\s\S]*?'launchAreaStrList'[\s\S]*?out\.launchAreaStrList = Array\.isArray\(resolvedLaunchAreaList\) && resolvedLaunchAreaList\.length[\s\S]*?: \['all'\];/, '地域仅应在源字段为空时回落 all');
    assert.match(draftBuilder, /out\.wordList = normalizeKeywordWordListForSubmit\(input\.wordList \|\| \[]\);/, '关键词单元应从源 wordList 归一提交');
    assert.match(draftBuilder, /const normalized = applyKeywordDefaults\(item \|\| \{\}, \{\}\);[\s\S]*?\.\.\.original,[\s\S]*?word: normalized\.word,[\s\S]*?onlineStatus: normalized\.onlineStatus/, '关键词归一应保留源关键词扩展字段');
    assert.doesNotMatch(
        draftBuilder,
        /KEYWORD_CUSTOM_CAMPAIGN_ALLOW_KEYS[\s\S]*?'supportAiDigitalLaunch'/,
        'supportAiDigitalLaunch 是只读能力标记，不应提交到创建接口'
    );
    assert.doesNotMatch(
        draftBuilder,
        /KEYWORD_CUSTOM_CAMPAIGN_ALLOW_KEYS[\s\S]*?'searchUpgradePxb'/,
        'searchUpgradePxb 是旧复制计划异常标签来源，不应提交到创建接口'
    );
    assert.match(
        draftBuilder,
        /const isCopyCurrentPlan = request\?\.__copyCurrentPlan === true \|\| plan\?\.__copyCurrentPlan === true;/,
        '关键词裁剪阶段应识别当前计划复制'
    );
    assert.match(
        draftBuilder,
        /const applyCopyKeywordAiMaxAdvancedSettingsForSubmit = \(campaign = \{\}, options = \{\}\) => \{[\s\S]*?applyKeywordAiMaxShieldWordsForSubmit\(campaign\);[\s\S]*?ensureCopyKeywordAiMaxDefaultAdzoneList\(campaign, options\);[\s\S]*?\};/,
        'AI点睛复制高级设置应收敛到最终提交可复用 helper'
    );
    assert.match(
        createAndSuggest,
        /const buildCreatePayload = \(entries = \[]\) => \{[\s\S]*?sceneCapabilities\.sceneName === '关键词推广'[\s\S]*?mergedRequest\?\.__copyCurrentPlan === true[\s\S]*?applyCopyKeywordAiMaxAdvancedSettingsForSubmit\(solution\.campaign,[\s\S]*?request:\s*mergedRequest[\s\S]*?\);[\s\S]*?return \{[\s\S]*?bizCode:\s*runtime\.bizCode,[\s\S]*?solutionList[\s\S]*?\};[\s\S]*?\};/,
        '最终 addList 请求体应在发出前补齐 AI点睛复制高级设置'
    );
    assert.match(
        createAndSuggest,
        /requestOne\(singleEndpoint,\s*runtime\.bizCode,\s*buildCreatePayload\(\[entry\]\),\s*options\.requestOptions \|\| \{\}\)/,
        '并发单条提交也必须走最终 payload 校正'
    );
    assert.match(
        createAndSuggest,
        /const createPayload = buildCreatePayload\(remainingEntries\);[\s\S]*?requestOne\(batchEndpoint,\s*runtime\.bizCode,\s*createPayload,\s*options\.requestOptions \|\| \{\}\)/,
        '批量提交必须走最终 payload 校正'
    );
    assert.match(
        createAndSuggest,
        /requestOne\(singleEndpoint,\s*runtime\.bizCode,\s*buildCreatePayload\(\[entry\]\),\s*options\.requestOptions \|\| \{\}\)/,
        'fallback 单条重试也必须走最终 payload 校正'
    );
    assert.match(
        draftBuilder,
        /const fromPlanRawCampaign = normalizeBidMode\([\s\S]*?plan\?\.rawOverrides\?\.campaign\?\.bidTypeV2[\s\S]*?plan\?\.rawOverrides\?\.campaign\?\.bidType[\s\S]*?if \(fromPlanRawCampaign\) return fromPlanRawCampaign;/,
        '复制链路应从 rawOverrides 读取源计划出价方式，避免自定义计划被默认成手动或智能'
    );
    assert.match(
        draftBuilder,
        /const rawCampaignBidMode = normalized\?\.rawOverrides\?\.campaign\?\.bidTypeV2[\s\S]*?request\?\.common\?\.rawOverrides\?\.campaign\?\.bidType[\s\S]*?normalized\.bidMode = normalizeBidMode\([\s\S]*?normalized\.campaignOverride\?\.bidTypeV2[\s\S]*?\|\| rawCampaignBidMode[\s\S]*?\|\| commonBidMode/,
        'normalizePlans 不应在复制计划缺少显式 bidMode 时用 common smart 覆盖源计划 rawOverrides 的 custom_bid'
    );
    assert.match(
        draftBuilder,
        /const copyHasNativeConvContract = isCopyCurrentPlan && \(copyConstraintType \|\| copySubOptimizeTarget\);[\s\S]*?if \(copyHasNativeConvContract\) \{[\s\S]*?out\.constraintType = copyConstraintType;[\s\S]*?out\.subOptimizeTarget = copySubOptimizeTarget;/,
        '当前计划复制遇到原生 conv 合同时应保留 constraintType/subOptimizeTarget'
    );
    assert.match(
        draftBuilder,
        /if \(copyOptimizeTarget\) \{[\s\S]*?out\.optimizeTarget = copyOptimizeTarget;[\s\S]*?\} else \{[\s\S]*?delete out\.optimizeTarget;/,
        '当前计划复制应按源计划保留或删除 optimizeTarget，不能强制回填默认 conv'
    );
});

test('关键词当前计划复制创建后必须按新单元补写源关键词', () => {
    assert.match(
        wizardApi,
        /const sourceWordListSeed = \[[\s\S]*?adgroup\.wordList,[\s\S]*?source\?\.wordList,[\s\S]*?source\?\.keywordList[\s\S]*?\]\.find\(list => Array\.isArray\(list\) && list\.length\) \|\| \[];[\s\S]*?const commonSourceWordList = normalizeCopyKeywordWordList\(sourceWordListSeed\);[\s\S]*?commonAdgroup\.wordList = deepClone\(commonSourceWordList\);/,
        '复制组包应把源关键词归一后同步回 rawOverrides.adgroup.wordList，避免后续覆盖为空或原始字段'
    );
    assert.match(
        wizardApi,
        /const sourceWordList = commonSourceWordList\.length[\s\S]*?deepClone\(commonSourceWordList\)[\s\S]*?normalizeCopyKeywordWordList\(planAdgroup\.wordList \|\| \[]\);[\s\S]*?planAdgroup\.wordList = deepClone\(sourceWordList\);/,
        '每条复制计划应使用同一份归一后的源关键词'
    );
    assert.match(
        wizardApi,
        /sourceWordList:\s*commonSourceWordList,[\s\S]*?sourceKeywordContext:\s*\{[\s\S]*?promotionScene:\s*campaign\.promotionScene \|\| DEFAULTS\.promotionScene,[\s\S]*?itemSelectedMode:\s*campaign\.itemSelectedMode \|\| DEFAULTS\.itemSelectedMode,[\s\S]*?bidTypeV2:\s*campaign\.bidTypeV2 \|\| 'custom_bid',[\s\S]*?bidTargetV2:\s*campaign\.bidTargetV2 \|\| campaign\.optimizeTarget \|\| DEFAULTS\.bidTargetV2/,
        '复制 meta 应保留源关键词和源计划关键词上下文，供创建后 bidword/add 补写'
    );
    assert.match(
        wizardApi,
        /const resolveCreatedAdgroupIdsFromCopyResult = \(result = \{\}\) => \{[\s\S]*?entry\?\.adgroupId[\s\S]*?entry\?\.adgroupIdList[\s\S]*?extractCreatedAdgroupIdsFromCreateResult\(result\)/,
        '复制后应能从创建结果解析新 adgroupId'
    );
    assert.match(
        wizardApi,
        /const appendCopiedKeywordsAfterCreate = async \(sceneName = '', result = \{\}, meta = \{\}, options = \{\}\) => \{[\s\S]*?bizCode !== 'onebpSearch'[\s\S]*?const sourceWordList = normalizeCopyKeywordWordList\(meta\?\.sourceWordList \|\| \[]\);[\s\S]*?const adgroupIds = resolveCreatedAdgroupIdsFromCopyResult\(result\);/,
        '关键词复制应在创建后准备源关键词和新单元 ID'
    );
    assert.match(
        wizardApi,
        /const sourceKeywordContext = isPlainObject\(meta\?\.sourceKeywordContext\) \? meta\.sourceKeywordContext : \{\};[\s\S]*?appendKeywords\(\{[\s\S]*?bizCode: bizCode \|\| DEFAULTS\.bizCode,[\s\S]*?promotionScene: sourceKeywordContext\.promotionScene \|\| DEFAULTS\.promotionScene,[\s\S]*?itemSelectedMode: sourceKeywordContext\.itemSelectedMode \|\| DEFAULTS\.itemSelectedMode,[\s\S]*?bidTypeV2: sourceKeywordContext\.bidTypeV2 \|\| 'custom_bid',[\s\S]*?bidTargetV2: sourceKeywordContext\.bidTargetV2 \|\| DEFAULTS\.bidTargetV2,[\s\S]*?entries[\s\S]*?\},\s*\{[\s\S]*?requestOptions: options\.requestOptions \|\| \{\}[\s\S]*?\}\)/,
        '创建后应复用 appendKeywords/bidword.add 按新 adgroupId 补写关键词'
    );
    assert.match(
        wizardApi,
        /const postCreateKeywords = await appendCopiedKeywordsAfterCreate\(meta\.sceneName,\s*resultWithCreatedIds,\s*meta,\s*options\);[\s\S]*?新计划创建成功但关键词复制失败：[\s\S]*?ok:\s*false,[\s\S]*?partial:\s*true,/,
        '关键词补写失败时复制结果必须标记 partial failure，不能显示整体成功'
    );
    assert.match(
        wizardApi,
        /postCreateKeywords,[\s\S]*?copySource:/,
        '复制结果应回传关键词后置复制状态，便于真实验收排查'
    );
});

test('复制跟随源计划状态并保持线索日预算', () => {
    assert.match(wizardApi, /planCampaign\.campaignName = planName;[\s\S]*?planCampaign\.onlineStatus = targetOnlineStatus;[\s\S]*?planAdgroup\.onlineStatus = targetOnlineStatus;/, '复制应为每条新计划设置名称和状态');
    assert.match(wizardApi, /if \(result\?\.dryRunOnly\) \{[\s\S]*?reason:\s*'dry_run_only'/, 'dry-run 复制不应触发创建后暂停');
    assert.match(wizardApi, /targetStatus:\s*meta\.targetOnlineStatus === 1 \? 'start' : 'pause'/, '复制结果应回传目标状态');
    assert.match(wizardApi, /batchRetry:\s*Math\.max\(0,\s*toNumber\(options\.batchRetry,\s*0\)\)/, '当前计划复制默认不应对创建失败做重复真实提交');
    assert.match(wizardApi, /let createdCampaignIds = extractCreatedCampaignIdsFromCreateResult\(result\);[\s\S]*?if \(!createdCampaignIds\.length\) \{[\s\S]*?queryCopiedCampaignIdsByPlanNames[\s\S]*?if \(!createdCampaignIds\.length\) \{[\s\S]*?reason:\s*'create_not_successful'/, '创建未成功且按名称查不到新计划时不应执行暂停兜底');
    assert.match(wizardApi, /const pauseCopiedCampaignsAfterCreate\s*=\s*async/, '复制暂停应在创建后执行新计划暂停兜底');
    assert.match(wizardApi, /const targetOnlineStatus = toNumber\(meta\?\.targetOnlineStatus,\s*NaN\);[\s\S]*?const shouldPause = targetOnlineStatus === 0[\s\S]*?!Number\.isFinite\(targetOnlineStatus\) && options\.pauseIfStartedAfterCreate === true/, '创建后暂停只能在目标状态为暂停时触发，未知目标状态才允许显式兜底');
    assert.doesNotMatch(wizardApi, /const shouldPause = toNumber\(meta\?\.targetOnlineStatus,\s*1\) === 0 \|\| options\.pauseIfStartedAfterCreate === true;/, '不应让 pauseIfStartedAfterCreate 覆盖明确的开启目标状态');
    assert.match(wizardApi, /extractCreatedCampaignIdsFromCreateResult\(result\)/, '创建后暂停应从创建结果提取新 campaignId');
    assert.match(wizardApi, /requestOne\('\/campaign\/updatePart\.json'[\s\S]*?campaignList:\s*\[\{[\s\S]*?campaignId:\s*Number\(campaignId\),[\s\S]*?displayStatus:\s*'pause'/, '创建后暂停应调用 updatePart 暂停新计划');
    assert.match(wizardApi, /if \(postCreateStatus && postCreateStatus\.ok === false\) \{[\s\S]*?error:\s*`新计划创建成功但暂停失败：/, '新计划暂停失败时应返回明确错误');
    assert.match(wizardApi, /if \(postCreateStatus && postCreateStatus\.ok === false\) \{[\s\S]*?ok:\s*false,[\s\S]*?partial:\s*true,/, '新计划暂停失败时复制结果必须标记失败');
    assert.match(draftBuilder, /const preserveLeadDailyBudget = isCopyCurrentPlan[\s\S]*?sourceLeadDmcType === 'normal'[\s\S]*?sourceLeadDailyBudget > 0;/, '线索复制应识别原日预算模式');
    assert.match(draftBuilder, /merged\.campaign\.dmcType = preserveLeadDailyBudget \? 'normal' : 'total';/, '线索复制应保留 daily/normal 预算模式');
    assert.match(draftBuilder, /if \(preserveLeadDailyBudget\) \{[\s\S]*?merged\.campaign\.dayBudget = sourceLeadDailyBudget;[\s\S]*?delete merged\.campaign\.totalBudget;/, '线索复制保留日预算时不应转成总预算');
    assert.match(draftBuilder, /if \(preserveLeadDailyBudget\) \{[\s\S]*?delete merged\.campaign\.orderChargeType;[\s\S]*?delete merged\.campaign\.orderInfo;/, '线索复制保留日预算时不应带出余额支付字段');
    assert.match(draftBuilder, /if \(preserveLeadDailyBudget\) \{[\s\S]*?delete merged\.campaign\.planId;[\s\S]*?delete merged\.campaign\.planTemplateId;[\s\S]*?delete merged\.campaign\.packageTemplateId;[\s\S]*?delete merged\.campaign\.orderInfo;[\s\S]*?\} else \{[\s\S]*?const leadTemplateTriplet = resolveLeadTemplateTriplet/, '线索复制日预算计划不应强制要求套餐模板 ID');
});

test('基础向导草稿 store 在复制链路前可用', () => {
    assert.match(
        draftBuilder,
        /Object\.assign\(KeywordPlanWizardStore,\s*\{[\s\S]*?readSessionDraft,[\s\S]*?saveSessionDraft,[\s\S]*?wizardDefaultDraft:\s*\(\.\.\.args\) => wizardDefaultDraft\(\.\.\.args\),[\s\S]*?persistDraft:\s*\(draft = null\) => persistWizardDraft\(draft\)[\s\S]*?\}\);[\s\S]*?const resolvePreferredItems/,
        '复制创建前应先暴露基础草稿 store，避免 readSessionDraft 依赖预览模块挂载顺序'
    );
});

test('复制 API 已导出且桥接只开放受控方法', () => {
    assert.match(exportsSource, /copyCurrentPlanByScene,/, 'KeywordPlanApi return 缺少 copyCurrentPlanByScene');
    assert.match(bridgeSource, /'copyCurrentPlanByScene'/, 'bridge 白名单缺少 copyCurrentPlanByScene');
    assert.match(bootstrapSource, /const PLAN_API_BRIDGE_READY_KEY = '__AM_WXT_PLAN_API_BRIDGE_HOST__';[\s\S]*?const PLAN_API_BRIDGE_METHODS = \[[\s\S]*?'copyCurrentPlanByScene'/, '主助手缺少复制 API 完整桥代理');
    assert.match(bootstrapSource, /const waitForKeywordPlanApiAccessor = async \(options = \{\}\) => \{[\s\S]*?requiredMethod[\s\S]*?resolveKeywordPlanApiAccessor\(\)/, '主助手缺少 API 延迟就绪等待逻辑');
    assert.match(bridgeSource, /installKeywordPlanOpenBridgeHost\(\);\s*if \(isExtensionPageRuntime\(\) \|\| shouldExposePageApiDebug\(\)\) \{[\s\S]*?installPageApiBridgeHost\(\);[\s\S]*?\}\s*if \(shouldExposePageApiDebug\(\)\) \{/, 'extension 运行态应默认安装内部完整桥 host，但全局 page API 客户端仍受 debug 开关保护');
    assert.match(bridgeSource, /method_not_allowed/, 'bridge 仍需拒绝非白名单方法');
    assert.doesNotMatch(bridgeSource, /rawCreate|createRaw|submitRaw/, 'bridge 不应暴露任意 raw 创建入口');
    assert.match(bootstrapSource, /const fromWindowPlan = window\.__AM_WXT_PLAN_API__;/, '主助手 API 解析缺少 window Plan API 兜底');
    assert.match(bootstrapSource, /const fromGlobalPlan = globalThis\.__AM_WXT_PLAN_API__;/, '主助手 API 解析缺少 sandbox Plan API 兜底');
});
