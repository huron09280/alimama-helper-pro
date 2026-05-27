import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

const quickEntry = read('src/main-assistant/campaign-id-quick-entry.js');
const quickEntryStyle = read('src/main-assistant/ui.js');
const wizardApi = read('src/optimizer/keyword-plan-api/wizard-open-and-create.js');
const draftBuilder = read('src/optimizer/keyword-plan-api/search-and-draft.js');
const exportsSource = read('src/optimizer/keyword-plan-api/exports.js');
const bridgeSource = read('src/optimizer/bridge.js');
const bootstrapSource = read('src/main-assistant/bootstrap.js');

test('计划行操作区注入单个复制按钮', () => {
    assert.match(quickEntry, /COPY_ICON_SVG:\s*renderAmIcon\('campaign-copy',\s*\{\s*size:\s*14,\s*strokeWidth:\s*2\.1\s*\}\)/, '复制按钮未使用共享复制图标');
    assert.match(quickEntry, /mode:\s*'copy'/, '操作区应只创建单个复制按钮');
    assert.match(quickEntry, /const copyMode = 'inherit';[\s\S]*?data-am-campaign-copy',\s*copyMode\);/, '复制按钮应标记为跟随源计划状态');
    assert.match(quickEntry, /data-am-campaign-copy/, '缺少复制按钮 data 标识');
    assert.match(quickEntry, /return '复制';/, '复制按钮文案应收敛为单个“复制”');
    assert.doesNotMatch(quickEntry, /ensureCopyButton\('pause'\)|ensureCopyButton\('start'\)/, '操作区不应再注入两个复制按钮');
    assert.doesNotMatch(quickEntry, /copy_pause|copy_start/, '不应再保留双按钮创建模式');
    assert.match(quickEntry, /enhanceOperationNodes\(\);/, 'run 流程应增强原生操作区');
    assert.match(quickEntry, /data-am-campaign-operation-copy-host/, '复制按钮应挂在原生操作区 host 上');
    assert.match(quickEntry, /operationRow\?\.previousElementSibling/, '操作区应从上一条计划数据行解析 campaign 上下文');
    assert.match(quickEntry, /\.wO_WXptarh\.clearfix,\s*\.wO_WXbzarh\.clearfix/, '操作区识别应同时覆盖线索页与营销场景页原生操作组');
    assert.match(quickEntry, /text\.includes\('推广解读'\)[\s\S]*?text\.includes\('复制'\)/, '人群推广原生操作区应能通过推广解读/复制识别挂载点');
    assert.match(quickEntry, /text\.includes\('AI点睛'\)[\s\S]*?text\.includes\('人群设置'\)[\s\S]*?text\.includes\('置顶'\)[\s\S]*?text\.includes\('一键起量'\)[\s\S]*?text\.includes\('相似品跟投'\)[\s\S]*?text\.includes\('修改趋势'\)[\s\S]*?text\.includes\('创意起量'\)[\s\S]*?text\.includes\('加速测图'\)/, '营销场景操作区无报表/置顶时也应能识别复制按钮挂载点');
    assert.match(quickEntryStyle, /\.am-campaign-copy-btn\s*\{[\s\S]*?min-width:\s*88px;[\s\S]*?white-space:\s*nowrap;/, '复制按钮缺少稳定尺寸与不换行约束');
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
    assert.match(quickEntryStyle, /\.am-campaign-copy-btn \.am-wxt-copy-multi\s*\{[\s\S]*?border-radius:\s*10px;[\s\S]*?border:\s*1px solid rgba\(99,\s*102,\s*241,\s*0\.32\);/, '复制数量徽标样式应复用组建计划视觉');
});

test('复制入口读取当前计划详情并调用受控 API', () => {
    assert.match(quickEntry, /queryCampaignDetail\(id,\s*targetBizCode,\s*authContext\)/, '复制前应读取计划详情');
    assert.match(quickEntry, /queryAdgroupDetail\(id,\s*adgroupIds\[0\],\s*targetBizCode,\s*authContext\)/, '复制前应兜底读取单元详情');
    assert.match(quickEntry, /queryCampaignCrowdList\(id,\s*targetBizCode,\s*authContext\)/, '关键词复制前应读取原生需求人群');
    assert.match(quickEntry, /\/crowd\/findList\.json\?\$\{query\.toString\(\)\}/, '需求人群应来自原生 crowd/findList 接口');
    assert.match(quickEntry, /campaign\.crowdList = campaignCrowdList;/, '源计划需求人群应写回 campaign.crowdList 参与复制');
    assert.match(quickEntry, /查询AI点睛需求人群失败，已取消复制/, 'AI点睛源计划读不到需求人群时应 fail-fast，避免半成品复制');
    assert.match(quickEntry, /copyCurrentPlanByScene\(sceneName,\s*source,\s*\{[\s\S]*?copyMode:\s*mode,[\s\S]*?copyCount,[\s\S]*?usedPlanNames,[\s\S]*?targetOnlineStatus,[\s\S]*?pauseIfStartedAfterCreate:\s*true,[\s\S]*?conflictPolicy:\s*'none'/, '复制按钮应调用受控复制 API 并透传复制数量、已用计划名与复制后暂停兜底');
    assert.match(quickEntry, /resolveCopyTargetOnlineStatus\(source\)/, '复制入口应按源计划当前状态决定新计划状态');
    assert.match(quickEntry, /collectRemoteCampaignPlanNames\(bizCode,\s*authContext,\s*sourcePlanName = ''\)[\s\S]*?searchKey = 'campaignNameLike';[\s\S]*?searchValue = searchSeed;/, '复制前应通过只读列表接口补齐已有计划名，避免刷新后重复命名');
    assert.match(quickEntry, /const remotePlanNames = await this\.collectRemoteCampaignPlanNames\([\s\S]*?const usedPlanNames = Array\.from\(new Set\(\[[\s\S]*?collectVisibleCampaignPlanNames\(document\),[\s\S]*?\.\.\.remotePlanNames/, '复制 API 入参应合并页面可见名称与远端已有名称');
    assert.match(quickEntry, /源计划\$\{id\}[\s\S]*?新计划[\s\S]*?跟随源状态/, '复制日志应包含源计划、新计划名和跟随源状态');
});

test('复制成功后弹窗说明明细并确认刷新页面', () => {
    assert.match(quickEntry, /showCopySuccessDialogAndRefresh\(result,\s*\{[\s\S]*?sourceCampaignId:\s*id,[\s\S]*?copyCount,[\s\S]*?statusText[\s\S]*?\}\);/, '复制成功后应展示明细弹窗');
    assert.match(quickEntry, /resolveCopiedCampaignIds\(result = \{\}\)[\s\S]*?copySource\.createdCampaignIds[\s\S]*?result\?\.postCreateStatus\?\.campaignIds/, '弹窗明细应优先使用创建后确认的新计划 ID');
    assert.match(quickEntry, /buildCopySuccessDialogMessage\(result = \{\},\s*context = \{\}\)[\s\S]*?'复制计划已成功'[\s\S]*?`本次复制成功：\$\{successCount\} 个`[\s\S]*?'新计划明细：'[\s\S]*?'点击“确定并刷新”后将搜索计划名称公共部分。'/, '弹窗应说明复制数量、明细和刷新行为');
    assert.match(quickEntry, /popup\.id = 'am-campaign-copy-success-popup';[\s\S]*?icon\.className = 'am-copy-success-icon';[\s\S]*?body\.textContent = message\.replace[\s\S]*?confirmBtn\.textContent = '确定并刷新';[\s\S]*?cancelBtn\.textContent = '取消';/, '复制成功后应使用仿原生自定义弹窗展示明细');
    assert.match(quickEntry, /resolvePlanNameCommonPart\(planNames = \[\]\)[\s\S]*?replace\(\s*\/\[\\s_-\]\+\$\/g,[\s\S]*?resolveCopySuccessSearchKeyword\(result = \{\},\s*context = \{\}\)[\s\S]*?sourceCampaignName,[\s\S]*?\.\.\.newPlanNames/, '确认刷新应按源计划和新计划名公共部分搜索');
    assert.match(quickEntry, /buildCopySuccessSearchUrl\(result = \{\},\s*context = \{\}\)[\s\S]*?nextParams\.set\('searchKey',\s*'campaignNameLike'\);[\s\S]*?nextParams\.set\('searchValue',\s*searchValue\);/, '确认刷新应跳转到计划名称公共部分搜索 URL');
    assert.match(quickEntry, /confirmBtn\.addEventListener\('click',\s*\(\) => \{[\s\S]*?this\.navigateToCopySuccessSearch\(result,\s*context\);/, '用户确认自定义弹窗后应跳转到公共名称搜索结果');
    assert.match(quickEntry, /cancelBtn\.addEventListener\('click',\s*\(\) => \{[\s\S]*?popup\.remove\(\);/, '复制成功弹窗取消按钮应只关闭弹窗');
    assert.doesNotMatch(quickEntry, /window\.alert\(message\)/, '复制成功弹窗不能使用浏览器原生 alert');
    assert.match(quickEntryStyle, /#am-campaign-copy-success-popup\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?background:\s*rgba\(15,\s*23,\s*42,\s*0\.36\);/, '缺少复制成功自定义弹窗遮罩样式');
    assert.match(quickEntryStyle, /#am-campaign-copy-success-popup \.am-copy-success-card\s*\{[\s\S]*?width:\s*min\(320px,[\s\S]*?border-radius:\s*24px;[\s\S]*?box-shadow:\s*0 2px 10px rgba\(0,\s*0,\s*0,\s*0\.16\);/, '复制成功弹窗应按参考原生弹窗尺寸');
    assert.match(quickEntryStyle, /#am-campaign-copy-success-popup \.am-copy-success-icon\s*\{[\s\S]*?border-radius:\s*50%;[\s\S]*?background:\s*#ffa33b;/, '复制成功弹窗应带原生风格提示图标');
    assert.match(quickEntryStyle, /#am-campaign-copy-success-popup \.am-copy-success-title\s*\{[\s\S]*?font-size:\s*16px;[\s\S]*?line-height:\s*24px;[\s\S]*?#am-campaign-copy-success-popup \.am-copy-success-body\s*\{[\s\S]*?font-size:\s*12px;[\s\S]*?line-height:\s*18px;/, '复制成功弹窗字体应按参考原生弹窗尺寸');
    assert.match(quickEntryStyle, /#am-campaign-copy-success-popup \.am-copy-success-confirm,[\s\S]*?#am-campaign-copy-success-popup \.am-copy-success-cancel\s*\{[\s\S]*?min-width:\s*64px;[\s\S]*?height:\s*32px;[\s\S]*?border-radius:\s*500px;[\s\S]*?font-size:\s*12px;/, '复制成功弹窗按钮应按参考原生弹窗尺寸');
    assert.match(quickEntry, /const createdCampaignIds = this\.resolveCopiedCampaignIds\(result\);[\s\S]*?if \(!createdCampaignIds\.length && successCount <= 0\) \{[\s\S]*?创建接口未返回成功的新计划/, '无成功新计划时不应进入成功弹窗刷新链路');
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
    assert.match(wizardApi, /const copyCount = normalizeCurrentPlanCopyCount\(options\);[\s\S]*?const newPlanNames = buildCurrentPlanCopiedPlanNames\(sourcePlanName,\s*targetScene,\s*copyCount,\s*source,\s*options\);/, '复制 API 应支持组建计划同款复制数量');
    assert.match(wizardApi, /const marketingGoal = resolveCurrentPlanCopyMarketingGoal\(targetScene,\s*source,\s*campaign,\s*options\);/, '复制请求应显式补齐营销目标，避免严格目标匹配失败');
    assert.match(wizardApi, /marketingGoal,[\s\S]*?planNamePrefix:\s*newPlanName/, '复制顶层请求应带 marketingGoal');
    assert.match(wizardApi, /common:\s*\{[\s\S]*?marketingGoal,[\s\S]*?rawOverrides:/, '复制 common 请求应带 marketingGoal');
    assert.match(wizardApi, /plans:\s*newPlanNames\.map\(\(planName\) => \{[\s\S]*?planName,[\s\S]*?marketingGoal,/, '复制计划请求应按复制数量生成多条计划');
});

test('人群推广当前计划复制使用官方复制接口并保留暂停兜底', () => {
    assert.match(wizardApi, /const isDisplayOfficialCopyScene = \(meta = \{\}\) => \{[\s\S]*?bizCode === 'onebpDisplay' \|\| meta\?\.sceneName === '人群推广';/, '人群推广复制应进入官方复制分支');
    assert.match(wizardApi, /const buildDisplayOfficialCopyPayload = \(meta = \{\},\s*planName = '',\s*source = \{\},\s*options = \{\}\) => \{[\s\S]*?copyCampaignId:\s*Number\(sourceCampaignId\),[\s\S]*?campaignName:[\s\S]*?campaignGroupName:[\s\S]*?campaignGroupId:[\s\S]*?startTime,[\s\S]*?launchForever:/, '官方复制请求应对齐原生弹窗提交字段');
    assert.match(wizardApi, /requestOne\('\/campaign\/copy\/campaignCheck\.json',\s*bizCode,[\s\S]*?campaignId:\s*payload\.copyCampaignId/, '提交官方复制前应走原生 campaignCheck');
    assert.match(wizardApi, /requestOne\('\/solution\/copy\.json',\s*bizCode,\s*payload,\s*options\.requestOptions \|\| \{\}\)/, '人群推广应调用原生 solution/copy.json，而不是自己组 addList');
    assert.match(wizardApi, /const result = isDisplayOfficialCopyScene\(meta\)[\s\S]*?\? await copyDisplayCurrentPlanByOfficialApi\(meta,\s*source,\s*options\)[\s\S]*?: await createPlansByScene/, 'copyCurrentPlanByScene 应只把人群推广切到官方复制接口');
    assert.match(wizardApi, /officialCopyPayloads:\s*payloads/, '官方复制 dry-run/结果应暴露官方 payload 方便受保护验证');
    assert.match(wizardApi, /const postCreateStatus = await pauseCopiedCampaignsAfterCreate\(meta\.sceneName,\s*resultWithCreatedIds,\s*meta,\s*options\);/, '官方复制后仍应复用创建后暂停兜底');
});

test('关键词当前计划复制保留 AI 点睛和原生智能出价目标合同', () => {
    for (const field of ['aiMaxInfo', 'aiMaxSwitch', 'campaignShieldWords', 'shieldWords', 'shieldCenterWords']) {
        assert.match(draftBuilder, new RegExp(`KEYWORD_CUSTOM_CAMPAIGN_ALLOW_KEYS[\\s\\S]*?'${field}'`), `关键词复制裁剪白名单缺少 ${field}`);
    }
    assert.match(wizardApi, /const pickCopyCampaignCrowdList = \(source = \{\}\) => \{[\s\S]*?source\?\.campaign\?\.crowdList,[\s\S]*?source\?\.crowdList,[\s\S]*?source\?\.aiMaxCrowdList/, '复制 API 应兼容源计划需求人群字段');
    assert.match(wizardApi, /campaign\.crowdList = purgeCreateTransientFields\(sourceCrowdList\);/, '复制 API 应把原生需求人群写入创建 campaign.crowdList 并清理旧计划 ID');
    assert.match(wizardApi, /COPY_CAMPAIGN_FIELD_WHITELIST[\s\S]*?'crowdList'/, 'campaign 白名单必须保留需求人群 crowdList');
    assert.doesNotMatch(
        draftBuilder,
        /KEYWORD_CUSTOM_CAMPAIGN_ALLOW_KEYS[\s\S]*?'supportAiDigitalLaunch'/,
        'supportAiDigitalLaunch 是只读能力标记，不应提交到创建接口'
    );
    assert.match(
        draftBuilder,
        /const isCopyCurrentPlan = request\?\.__copyCurrentPlan === true \|\| plan\?\.__copyCurrentPlan === true;/,
        '关键词裁剪阶段应识别当前计划复制'
    );
    assert.match(
        draftBuilder,
        /const fromPlanRawCampaign = normalizeBidMode\([\s\S]*?plan\?\.rawOverrides\?\.campaign\?\.bidTypeV2[\s\S]*?plan\?\.rawOverrides\?\.campaign\?\.bidType[\s\S]*?if \(fromPlanRawCampaign\) return fromPlanRawCampaign;/,
        '复制链路应从 rawOverrides 读取源计划出价方式，避免自定义计划被默认成手动或智能'
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

test('复制跟随源计划状态并保持线索日预算', () => {
    assert.match(wizardApi, /planCampaign\.campaignName = planName;[\s\S]*?planCampaign\.onlineStatus = targetOnlineStatus;[\s\S]*?planAdgroup\.onlineStatus = targetOnlineStatus;/, '复制应为每条新计划设置名称和状态');
    assert.match(wizardApi, /if \(result\?\.dryRunOnly\) \{[\s\S]*?reason:\s*'dry_run_only'/, 'dry-run 复制不应触发创建后暂停');
    assert.match(wizardApi, /targetStatus:\s*meta\.targetOnlineStatus === 1 \? 'start' : 'pause'/, '复制结果应回传目标状态');
    assert.match(wizardApi, /batchRetry:\s*Math\.max\(0,\s*toNumber\(options\.batchRetry,\s*0\)\)/, '当前计划复制默认不应对创建失败做重复真实提交');
    assert.match(wizardApi, /let createdCampaignIds = extractCreatedCampaignIdsFromCreateResult\(result\);[\s\S]*?if \(!createdCampaignIds\.length\) \{[\s\S]*?queryCopiedCampaignIdsByPlanNames[\s\S]*?if \(!createdCampaignIds\.length\) \{[\s\S]*?reason:\s*'create_not_successful'/, '创建未成功且按名称查不到新计划时不应执行暂停兜底');
    assert.match(wizardApi, /const pauseCopiedCampaignsAfterCreate\s*=\s*async/, '复制暂停应在创建后执行新计划暂停兜底');
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
    assert.match(bridgeSource, /method_not_allowed/, 'bridge 仍需拒绝非白名单方法');
    assert.doesNotMatch(bridgeSource, /rawCreate|createRaw|submitRaw/, 'bridge 不应暴露任意 raw 创建入口');
    assert.match(bootstrapSource, /const fromWindowPlan = window\.__AM_WXT_PLAN_API__;/, '主助手 API 解析缺少 window Plan API 兜底');
    assert.match(bootstrapSource, /const fromGlobalPlan = globalThis\.__AM_WXT_PLAN_API__;/, '主助手 API 解析缺少 sandbox Plan API 兜底');
});
