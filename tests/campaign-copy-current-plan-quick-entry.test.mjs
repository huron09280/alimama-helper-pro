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
    assert.match(quickEntry, /copyCurrentPlanByScene\(sceneName,\s*source,\s*\{[\s\S]*?copyMode:\s*mode,[\s\S]*?copyCount,[\s\S]*?usedPlanNames,[\s\S]*?targetOnlineStatus,[\s\S]*?conflictPolicy:\s*'none'/, '复制按钮应调用受控复制 API 并透传复制数量与已用计划名');
    assert.match(quickEntry, /resolveCopyTargetOnlineStatus\(source\)/, '复制入口应按源计划当前状态决定新计划状态');
    assert.match(quickEntry, /源计划\$\{id\}[\s\S]*?新计划[\s\S]*?跟随源状态/, '复制日志应包含源计划、新计划名和跟随源状态');
});

test('copyCurrentPlanByScene 通过白名单和瞬态字段清理构造创建请求', () => {
    assert.match(wizardApi, /const copyCurrentPlanByScene\s*=\s*async/, '缺少复制当前计划公开方法');
    for (const field of ['dayBudget', 'optimizeTarget', 'launchTime', 'launchPeriodList', 'launchAreaStrList', 'orderInfo']) {
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

test('复制跟随源计划状态并保持线索日预算', () => {
    assert.match(wizardApi, /planCampaign\.campaignName = planName;[\s\S]*?planCampaign\.onlineStatus = targetOnlineStatus;[\s\S]*?planAdgroup\.onlineStatus = targetOnlineStatus;/, '复制应为每条新计划设置名称和状态');
    assert.match(wizardApi, /if \(result\?\.dryRunOnly\) \{[\s\S]*?reason:\s*'dry_run_only'/, 'dry-run 复制不应触发创建后暂停');
    assert.match(wizardApi, /targetStatus:\s*meta\.targetOnlineStatus === 1 \? 'start' : 'pause'/, '复制结果应回传目标状态');
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
