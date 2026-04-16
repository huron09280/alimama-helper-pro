import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const coreSource = readFileSync(new URL('../src/optimizer/core.js', import.meta.url), 'utf8');
const uiSource = readFileSync(new URL('../src/optimizer/ui.js', import.meta.url), 'utf8');
const bootstrapSource = readFileSync(new URL('../src/optimizer/bootstrap.js', import.meta.url), 'utf8');

test('无 actionList 时可识别小万护航新链路信号', () => {
    assert.match(
        coreSource,
        /护航工作授权[\s\S]*确认修改规划/,
        '新护航链路关键词缺失，无法识别待授权流程'
    );
});

test('命中新链路后会走 openV3 护航授权接口', () => {
    assert.match(
        coreSource,
        /API\.request\('https:\/\/ai\.alimama\.com\/ai\/escort\/openV3\.json'/,
        '新链路未提交 openV3 护航授权接口'
    );
});

test('openV3 授权请求优先使用弹窗最新设置参数', () => {
    assert.match(
        coreSource,
        /#ai_analyst_action_modal\s*>\s*div\s*>\s*div\.dialog-modal-body\.flex-1\.min-height-0\s*>\s*div[\s\S]*const requestOpenV3ByActionType[\s\S]*userSetting:\s*resolvedOpenV3Setting\.userSetting[\s\S]*actionType,/,
        'openV3 请求未接入弹窗最新设置参数映射'
    );
});

test('openV3 设置解析失败时仍保留默认护航配置兜底', () => {
    assert.match(
        coreSource,
        /const defaultUserSetting =\s*\{[\s\S]*bidConstraintValue:\s*\{\s*enabled:\s*false\s*\}[\s\S]*budget:\s*\{\s*enabled:\s*false\s*\}[\s\S]*\}/,
        'openV3 请求缺少默认护航配置兜底'
    );
});

test('openV3 成功后卡片状态更新为护航中', () => {
    assert.match(
        coreSource,
        /card\.setStatus\(submitResult\.success \? '护航中' : '失败',\s*submitResult\.success \? 'success' : 'error'\)/,
        'openV3 成功后未更新为护航中状态'
    );
});

test('openV3 命中重复开启提示时会触发 updateInDialog 强制重试一次', () => {
    assert.match(
        coreSource,
        /isDuplicateEscortMessage[\s\S]*requestOpenV3ByActionType\('updateInDialog'\)/,
        'openV3 遇到重复开启提示时未触发 updateInDialog 强制重试'
    );
    assert.match(
        coreSource,
        /当前计划已开启护航，视为执行成功/,
        'openV3 重试后未将“已开启护航”识别为成功态'
    );
});

test('手动设置开启时即使缺少新链路设置表也会按手动参数构造 openV3 提交', () => {
    assert.match(
        coreSource,
        /const manualFallbackSetting = normalizeEscortSettingTable\(\{[\s\S]*manualOverride\.operationList[\s\S]*manualOverride\.userSetting[\s\S]*\}\);[\s\S]*const base = normalizeEscortSettingTable\(settingTable\) \|\| manualFallbackSetting;/,
        '无 escortSettingTable 时未回退到手动设置构造提交参数，可能退回默认全方案执行'
    );
    assert.match(
        coreSource,
        /if \(manualSetting && typeof manualSetting === 'object'\) \{[\s\S]*if \(manualSetting\.enabled\) \{[\s\S]*const mergedByManual = applyManualSetting\(finalSetting,\s*manualSetting\);/,
        '手动设置仍受设置表存在性限制，可能被跳过'
    );
});

test('计划处于护航中/已结束时仍会强制重新提交一次护航', () => {
    assert.match(
        coreSource,
        /护航调优中\|护航中\|护航工作报告[\s\S]*护航已结束[\s\S]*按配置强制重新提交护航/,
        '未实现忽略原状态并强制重新提交护航'
    );
});

test('新链路会解析 escortSettingTable 结构用于提交参数与展示', () => {
    assert.match(
        coreSource,
        /renderCode === 'escortSettingTable'[\s\S]*normalizeEscortSettingTable/,
        '新链路未解析 escortSettingTable 结构'
    );
});

test('旧 actionList 链路仍保留 open.json 提交', () => {
    assert.match(
        coreSource,
        /API\.request\('https:\/\/ai\.alimama\.com\/ai\/escort\/open\.json',\s*\{[\s\S]*actionList/,
        '旧护航 actionList 链路被误删'
    );
});

test('无 actionList 时会读取计划行护航状态做兜底', () => {
    assert.match(
        coreSource,
        /计划护航已结束（页面状态识别）[\s\S]*计划当前处于小万护航中（页面状态识别）[\s\S]*按配置强制重新提交护航/,
        '未实现基于计划行状态的护航兜底识别'
    );
});

test('escortSettingTable 渲染包含操作项与范围信息', () => {
    assert.match(
        uiSource,
        /renderEscortSettingTableToCard[\s\S]*operationList[\s\S]*范围[\s\S]*提交按钮/,
        'escortSettingTable 渲染信息不完整'
    );
});

test('openV3 提交后会把执行状态回传到方案渲染并显示 ✅/❌', () => {
    assert.match(
        coreSource,
        /buildExecutionStateMap[\s\S]*UI\.renderEscortSettingTableToCard\(card,\s*resolvedOpenV3Setting\.displaySetting,\s*\{[\s\S]*executionState[\s\S]*sourceLabel[\s\S]*fromManual[\s\S]*\}\)/,
        'openV3 提交后未将 executionState 回传给方案渲染'
    );
    assert.match(
        uiSource,
        /resolveExecutionStateValue[\s\S]*executionState[\s\S]*resolveExecutionIcon[\s\S]*'✅'[\s\S]*'❌'[\s\S]*actionText:\s*`\$\{resolveExecutionIcon\(rawKey,\s*key\)\}/,
        '方案名称未根据 executionState 显示 ✅/❌'
    );
});

test('escortSettingTable 会全量显示方案并提供状态列', () => {
    assert.match(
        uiSource,
        /const canonicalOperationOrder = \['bidConstraintValue', 'netBidConstraintValue', 'budget', 'keywordAdd', 'keywordSwitch', 'keywordMask'\];[\s\S]*canonicalOperationOrder\.forEach\(pushSourceKey\);[\s\S]*Object\.keys\(userSetting\)\.forEach\(pushSourceKey\);/,
        '方案列表未按全量方案渲染，可能仍会隐藏未执行项'
    );
    assert.match(
        uiSource,
        /const resolveStatusText =[\s\S]*'已执行'[\s\S]*'执行失败'[\s\S]*'未勾选'[\s\S]*'未开启'[\s\S]*title:\s*'状态'/,
        '缺少方案状态列或状态文案不完整'
    );
});

test('方案详情保留介绍文案，不再被未开启状态覆盖', () => {
    assert.match(
        uiSource,
        /defaultDetailByKey = \{[\s\S]*bidConstraintValue:\s*'根据目标区间自动调控出价'[\s\S]*netBidConstraintValue:\s*'根据目标区间自动调控净投产比'[\s\S]*budget:\s*'根据目标区间自动调控预算'[\s\S]*keywordSwitch:\s*'自动在广泛匹配与精准匹配间切换'[\s\S]*keywordMask:\s*'自动屏蔽低转化关键词'/,
        '未保留关键词方案详情介绍文案'
    );
    assert.match(
        uiSource,
        /case 'bidConstraintValue':[\s\S]*case 'netBidConstraintValue':[\s\S]*case 'budget':[\s\S]*configDescriptionList\.forEach\(text => appendDetailPart\(detailParts,\s*text\)\);[\s\S]*if \(!detailParts\.length\) appendDetailPart\(detailParts,\s*defaultDetailByKey\[key\]\);/,
        '出价\/净投产比\/预算详情未按“优先介绍、兜底介绍”输出'
    );
    assert.doesNotMatch(
        uiSource,
        /case 'bidConstraintValue':[\s\S]*case 'netBidConstraintValue':[\s\S]*case 'budget':[\s\S]*if \(!detailParts\.length\) detailParts\.push\(planEnabled \? '已开启' : '未开启'\);/,
        '出价\/净投产比\/预算详情仍会被未开启分支直接覆盖'
    );
});

test('手动设置面板 checkbox 有独立可见样式兜底', () => {
    assert.match(
        uiSource,
        /#\$\{CONFIG\.UI_ID\}-latest-setting-content \.am26-manual-root input\[type="checkbox"\]\s*\{[\s\S]*appearance:\s*auto\s*!important;[\s\S]*display:\s*inline-block\s*!important;[\s\S]*visibility:\s*visible\s*!important;[\s\S]*\}/,
        '手动设置面板缺少 checkbox 可见性兜底样式，部分页面可能看不到勾选框'
    );
    assert.match(
        uiSource,
        /#\$\{CONFIG\.UI_ID\}-latest-setting-content \.am26-manual-root input\[type="checkbox"\]:disabled\s*\{[\s\S]*cursor:\s*not-allowed;[\s\S]*opacity:\s*\.55\s*!important;[\s\S]*\}/,
        '手动设置面板 checkbox 缺少 disabled 态视觉反馈'
    );
});

test('手动设置默认勾选项全部关闭', () => {
    assert.match(
        bootstrapSource,
        /manualEscortSetting:\s*\{[\s\S]*enabled:\s*false[\s\S]*bidConstraintValue:\s*\{\s*enabled:\s*false[\s\S]*netBidConstraintValue:\s*\{\s*enabled:\s*false[\s\S]*budget:\s*\{\s*enabled:\s*false[\s\S]*dailyReset:\s*false[\s\S]*addKeyword:\s*\{\s*enabled:\s*false[\s\S]*switchKeywordMatchType:\s*\{\s*enabled:\s*false[\s\S]*shieldKeyword:\s*\{\s*enabled:\s*false/,
        '默认配置仍存在开启项，未满足“默认全部关闭”'
    );
    assert.match(
        uiSource,
        /setCheckboxValue\(`\$\{CONFIG\.UI_ID\}-manual-enable`,\s*setting\.enabled,\s*false\);[\s\S]*setCheckboxValue\(`\$\{CONFIG\.UI_ID\}-manual-bid-enabled`,\s*bid\.enabled,\s*false\);[\s\S]*setCheckboxValue\(`\$\{CONFIG\.UI_ID\}-manual-net-bid-enabled`,\s*netBid\.enabled,\s*false\);[\s\S]*setCheckboxValue\(`\$\{CONFIG\.UI_ID\}-manual-budget-enabled`,\s*budget\.enabled,\s*false\);[\s\S]*setCheckboxValue\(`\$\{CONFIG\.UI_ID\}-manual-addkeyword-enabled`,\s*addKeyword\.enabled,\s*false\);[\s\S]*setCheckboxValue\(`\$\{CONFIG\.UI_ID\}-manual-switchmatch-enabled`,\s*switchKeywordMatchType\.enabled,\s*false\);[\s\S]*setCheckboxValue\(`\$\{CONFIG\.UI_ID\}-manual-shield-enabled`,\s*shieldKeyword\.enabled,\s*false\);/,
        'UI 表单 fallback 未统一改为默认关闭'
    );
});

test('手动设置外层与内层勾选状态保持同步', () => {
    assert.match(
        uiSource,
        /getManualEscortCheckboxNodes:\s*\(\)\s*=>\s*\{[\s\S]*primaryChildIdList[\s\S]*manual-bid-enabled[\s\S]*manual-net-bid-enabled[\s\S]*manual-budget-enabled[\s\S]*manual-addkeyword-enabled[\s\S]*manual-switchmatch-enabled[\s\S]*manual-shield-enabled[\s\S]*auxiliaryChildIdList[\s\S]*manual-bid-reset[\s\S]*manual-net-bid-reset[\s\S]*manual-budget-reset/,
        '未按“主功能开关/辅助开关”拆分节点列表，无法规避辅助项反向开启主开关'
    );
    assert.match(
        uiSource,
        /bindManualEscortCheckboxSync:\s*\(\)\s*=>\s*\{[\s\S]*\{\s*master,\s*children,\s*auxiliaryChildren\s*\}[\s\S]*master\.addEventListener\('change'[\s\S]*children\.forEach\(node => \{[\s\S]*node\.checked = nextChecked;[\s\S]*auxiliaryChildren\.forEach\(node => \{[\s\S]*node\.checked = nextChecked;[\s\S]*children\.forEach\(node => \{[\s\S]*node\.addEventListener\('change'[\s\S]*UI\.syncManualEscortMasterCheckbox\(\);/,
        '外层->内层或内层->外层同步逻辑缺失'
    );
    assert.match(
        uiSource,
        /syncManualEscortMasterCheckbox:\s*\(\)\s*=>\s*\{[\s\S]*if \(checkedCount <= 0\) \{[\s\S]*master\.checked = false;[\s\S]*master\.indeterminate = false;[\s\S]*return;[\s\S]*\}[\s\S]*master\.checked = true;[\s\S]*master\.indeterminate = checkedCount < enabledChildren\.length;/,
        '主开关同步逻辑未满足“子项勾选自动开启主开关，部分勾选时半选”'
    );
});

test('手动设置默认折叠并支持点击展开内部设置', () => {
    assert.match(
        uiSource,
        /manual-main-switch-label[\s\S]*使用手动设置提交[\s\S]*manual-expand-toggle[\s\S]*aria-expanded="false"[\s\S]*manual-setting-body[\s\S]*hidden[\s\S]*aria-hidden="true"/,
        '手动设置区域未默认折叠'
    );
    assert.match(
        uiSource,
        /setManualEscortSettingExpanded:\s*\(expanded = false\)\s*=>\s*\{[\s\S]*toggle\.setAttribute\('aria-expanded',\s*nextExpanded \? 'true' : 'false'\);[\s\S]*body\.hidden = !nextExpanded;/,
        '缺少手动设置展开/收起状态同步函数'
    );
    assert.match(
        uiSource,
        /bindManualEscortExpandToggle:\s*\(defaultExpanded = false\)\s*=>\s*\{[\s\S]*manualEscortExpandHandler[\s\S]*UI\.setManualEscortSettingExpanded\(!expanded\);[\s\S]*UI\.setManualEscortSettingExpanded\(\!\!defaultExpanded\);[\s\S]*bindManualEscortExpandToggle\(false\);/,
        '未绑定手动设置折叠交互或默认态'
    );
    assert.match(
        uiSource,
        /bindManualEscortMainSwitchGuard:\s*\(\)\s*=>\s*\{[\s\S]*manual-main-switch-label[\s\S]*if \(!body\.hidden\) return;[\s\S]*event\.preventDefault\(\);[\s\S]*event\.stopPropagation\(\);[\s\S]*UI\.setManualEscortSettingExpanded\(true\);[\s\S]*addEventListener\('click',\s*UI\.manualEscortMainSwitchGuardHandler,\s*true\);[\s\S]*bindManualEscortMainSwitchGuard\(\);/,
        '缺少“未展开点击主文案只展开、不选择；展开后再可选择”的守卫逻辑'
    );
    assert.match(
        uiSource,
        /\.am26-manual-expand::before\s*\{[\s\S]*content:'▸';[\s\S]*\}[\s\S]*\.am26-manual-expand\.is-expanded::before\s*\{[\s\S]*content:'▾';/,
        '展开入口未采用简约图标态（收起/展开）'
    );
    assert.doesNotMatch(
        uiSource,
        /manual-expand-toggle[\s\S]*>\s*展开设置\s*</,
        '展开入口仍保留“展开设置”文本按钮，未简化为图标'
    );
});

test('escortSettingTable 关键词类方案会显示中文名称与对应详情', () => {
    assert.match(
        uiSource,
        /key === 'keywordAdd'[\s\S]*'添加关键词'[\s\S]*case 'keywordAdd'[\s\S]*买词偏好：[\s\S]*匹配方式：[\s\S]*自选词上限：/,
        '关键词新增方案未显示中文名称或详情字段'
    );
    assert.match(
        uiSource,
        /key === 'keywordSwitch'[\s\S]*'切换关键词匹配方式'[\s\S]*case 'keywordSwitch'[\s\S]*广泛匹配与精准匹配间切换/,
        '关键词匹配切换方案未显示中文名称或切换说明'
    );
    assert.match(
        uiSource,
        /key === 'keywordMask'[\s\S]*'屏蔽关键词'[\s\S]*case 'keywordMask'[\s\S]*低转化关键词/,
        '关键词屏蔽方案未显示中文名称或屏蔽说明'
    );
});

test('从弹窗带入优先按官方字段标签精确读取护航参数', () => {
    assert.match(
        uiSource,
        /readCheckboxByLabelList\(\['出价调控',\s*'成本调控',\s*'平均点击成本'\]\)[\s\S]*findLineByLabelList\(\['出价调控区间',\s*'出价区间',\s*'平均点击成本',\s*'成本调控区间'\]\)[\s\S]*readCheckboxByLabelList\(\['净投产比调控',\s*'净投产比',\s*'净目标投产比'\]\)[\s\S]*findLineByLabelList\(\['净投产比调控区间',\s*'净投产比区间',\s*'净投产比',\s*'净目标投产比'\]\)[\s\S]*findLineByLabelList\(\['每日预算调控区间',\s*'预算调控区间',\s*'每日预算'\]\)/,
        '弹窗出价/净投产比/预算字段未按官方标签精确定位，容易出现参数串位'
    );
    assert.match(
        uiSource,
        /findLineByLabel\('买词偏好'\)[\s\S]*findLineByLabel\('匹配方式'\)/,
        '弹窗关键词字段未按官方标签精确定位，容易出现参数串位'
    );
});

test('次日恢复开关识别同时兼容 style 颜色与 class 状态', () => {
    assert.match(
        uiSource,
        /styleText\.includes\('#c3c9d9'\)[\s\S]*styleText\.includes\('#4554e5'\)[\s\S]*asiyysfazn[\s\S]*asiyysfazo/i,
        '次日恢复开关状态识别规则不完整，可能误判开关值'
    );
});

test('预算调控区间解析会跳过 disabled 输入并识别不限上限', () => {
    assert.match(
        uiSource,
        /const budgetEnabledInputs = budgetInputs\.filter\(input => !input\.disabled\);[\s\S]*budgetLineText\.includes\('不限'\)/,
        '预算调控区间未过滤 disabled 输入或未正确识别不限上限'
    );
});

test('手动覆盖映射仅预算使用 upperType，出价调控不再写入 upperType', () => {
    assert.match(
        coreSource,
        /if \(manualCfg\.upperLimit === '不限'\) \{[\s\S]*if \(targetKey === 'budget'\) baseCfg\.upperType = 0;[\s\S]*if \(targetKey === 'bidConstraintValue' \|\| targetKey === 'netBidConstraintValue'\) delete baseCfg\.upperType;[\s\S]*\} else \{[\s\S]*if \(targetKey === 'budget'\) baseCfg\.upperType = 1;[\s\S]*if \(targetKey === 'bidConstraintValue' \|\| targetKey === 'netBidConstraintValue'\) delete baseCfg\.upperType;/,
        'manual 覆盖未正确按预算/出价区分 upperType 规则'
    );
});

test('手动覆盖会提交关键词匹配、切换匹配与屏蔽关键词开关', () => {
    assert.match(
        coreSource,
        /patchKeywordMatchTypeField\(baseCfg,\s*manualCfg\.matchType\)/,
        'manual 覆盖未包含关键词匹配方式映射'
    );
    assert.match(
        coreSource,
        /switchKeywordMatchType[\s\S]*shieldKeyword/,
        'manual 覆盖未包含切换匹配/屏蔽关键词映射'
    );
});

test('openV3 提交顶层参数与原生保持一致', () => {
    assert.match(
        coreSource,
        /const openV3BizCode = talkData\?\.contextParam\?\.bizCode[\s\S]*bizCode:\s*openV3BizCode[\s\S]*csrfID:\s*''/,
        'openV3 顶层参数未对齐原生提交（bizCode/csrfID）'
    );
    assert.match(
        coreSource,
        /normalizeActionType\([\s\S]*'openInDialog'\)/,
        'openV3 actionType 默认值未对齐 openInDialog'
    );
});

test('openV3 会把关键词设置映射为原生字段与枚举', () => {
    assert.match(
        coreSource,
        /addKeyword:\s*'keywordAdd'[\s\S]*switchKeywordMatchType:\s*'keywordSwitch'[\s\S]*shieldKeyword:\s*'keywordMask'/,
        'openV3 未把关键词设置键名映射到原生字段'
    );
    assert.match(
        coreSource,
        /'类目流量飙升词':\s*2[\s\S]*if \(text\.includes\('精准'\)\) return 4;[\s\S]*if \(text\.includes\('广泛'\)\) return 1;/,
        'openV3 未把关键词偏好/匹配方式映射为原生枚举'
    );
});

test('openV3 弹窗解析不再通过根文本命中默认开启设置项', () => {
    assert.doesNotMatch(
        coreSource,
        /rootText[\s\S]*stateByKey\.set\([\s\S]*enabled:\s*true/,
        '仍存在根文本命中即默认 enabled=true 的逻辑，可能导致未勾选项误生效'
    );
});

test('openV3 弹窗解析采用显式状态优先、默认关闭与兜底回退策略', () => {
    assert.match(
        coreSource,
        /const explicitStateByKey = new Map\(\);[\s\S]*input\[type="checkbox"\],input\[type="radio"\],\[role="switch"\],\[aria-checked\][\s\S]*const hasExplicitState = explicitStateByKey\.size > 0;/,
        '未按显式控件收集开关状态'
    );
    assert.match(
        coreSource,
        /const fallbackEnabled = Array\.isArray\(settingTable\.operationList\)[\s\S]*const enabled = typeof explicitEnabled === 'boolean'[\s\S]*\? explicitEnabled[\s\S]*: \(hasExplicitState \? false : fallbackEnabled\);/,
        '缺少“显式状态优先 + 默认关闭 + operationList 兜底”判定链路'
    );
});

test('openV3 显式状态采集会过滤辅助控件与匹配方式 radio', () => {
    assert.match(
        coreSource,
        /const isAuxiliaryExplicitControlHint =[\s\S]*field === 'dailyReset'[\s\S]*field === 'keywordPreference'[\s\S]*field === 'keywordLimit'[\s\S]*field === 'matchType'[\s\S]*normalizedKey !== 'switchkeywordmatchtype'[\s\S]*normalizedKey !== 'keywordswitch'/,
        '缺少辅助控件过滤规则，显式状态仍可能被参数字段污染'
    );
    assert.match(
        coreSource,
        /if \(control instanceof HTMLInputElement\) \{[\s\S]*if \(type === 'radio'\) return;[\s\S]*\}[\s\S]*const ownHint = buildControlOwnHint\(control\);[\s\S]*if \(isAuxiliaryExplicitControlHint\(ownHint,\s*key\)\) return;[\s\S]*if \(!explicitStateByKey\.has\(key\)\) \{[\s\S]*explicitStateByKey\.set\(key,\s*enabledFromControl\);/,
        '显式状态采集未排除 radio/辅助控件，或未避免同 key 被后续控件覆盖'
    );
});

test('手动子项勾选会反向开启主开关，避免出现子项已勾选但提交仍未开启', () => {
    assert.match(
        uiSource,
        /syncManualEscortMasterCheckbox:\s*\(\)\s*=>\s*\{[\s\S]*if \(checkedCount <= 0\) \{[\s\S]*master\.checked = false;[\s\S]*master\.indeterminate = false;[\s\S]*return;[\s\S]*\}[\s\S]*master\.checked = true;[\s\S]*master\.indeterminate = checkedCount < enabledChildren\.length;/,
        '子项勾选后主开关未被自动开启，仍可能导致提交按未开启处理'
    );
});

test('手动设置未启用时仍持久化表单快照，提交层继续按未启用处理', () => {
    assert.match(
        uiSource,
        /readManualEscortSettingOverride:\s*\(options = \{\}\)\s*=>\s*\{[\s\S]*const includeDisabled = !!\(options && typeof options === 'object' && options\.includeDisabled\);[\s\S]*if \(!manualEnabled && !includeDisabled\) return null;[\s\S]*enabled:\s*!!manualEnabled,/,
        '手动设置读取未区分提交态与持久化快照态'
    );
    assert.match(
        uiSource,
        /persistManualEscortSettingFromForm:\s*\(\)\s*=>\s*\{[\s\S]*readManualEscortSettingOverride\(\{\s*includeDisabled:\s*true\s*\}\)/,
        '主开关关闭时未持久化手动表单快照'
    );
    assert.match(
        coreSource,
        /const manualSettingMaster = document\.getElementById\(`\$\{CONFIG\.UI_ID\}-manual-enable`\);[\s\S]*readManualEscortSettingOverride\(\{\s*includeDisabled:\s*true\s*\}\)/,
        '提交层未读取“主开关关闭”场景下的手动设置快照'
    );
    assert.match(
        coreSource,
        /if \(manualSetting && typeof manualSetting === 'object'\) \{[\s\S]*if \(manualSetting\.enabled\)[\s\S]*else \{[\s\S]*const manualDisabledOverride = buildManualDisabledOverride\([\s\S]*const manualDisabledSetting = applyManualSetting\(finalSetting,\s*manualDisabledOverride\);[\s\S]*sourceLabel = '手动设置参数（未勾选）';[\s\S]*fromManual = true;/,
        '主开关关闭时未按“全部未勾选”手动方案提交'
    );
});

test('手动覆盖仅执行面板中有配置的方案，未配置项默认关闭', () => {
    assert.match(
        coreSource,
        /const manualTargetKeySet = new Set\(\);[\s\S]*manualTargetKeySet\.add\(targetKey\);[\s\S]*Object\.entries\(mergedSetting\.userSetting\)\.forEach\(\(\[key,\s*cfgRaw\]\) => \{[\s\S]*if \(!manualTargetKeySet\.has\(key\)\) \{[\s\S]*cfg\.enabled = false;/,
        '手动覆盖未把“面板未配置方案”默认关闭，仍可能误执行'
    );
});

test('出价调控与净投产比调控在方案名称与手动面板中并存可见', () => {
    assert.match(
        uiSource,
        /if \(key === 'bidConstraintValue'\)[\s\S]*return '出价调控';[\s\S]*if \(key === 'netBidConstraintValue'\)[\s\S]*return '净投产比调控';/,
        '出价调控与净投产比调控方案名称未正确并存'
    );
    assert.match(
        uiSource,
        /manual-bid-enabled[\s\S]*出价调控[\s\S]*manual-net-bid-enabled[\s\S]*净投产比调控/,
        '手动设置面板未同时展示“出价调控/净投产比调控”配置入口'
    );
});

test('openV3 执行状态仅标记实际启用方案，避免未启用项被误报执行', () => {
    assert.match(
        coreSource,
        /const operationList = Array\.isArray\(displaySetting\.operationList\)[\s\S]*if \(operationList\.length\) \{[\s\S]*if \(!operationList\.length && displaySetting\.userSetting && typeof displaySetting\.userSetting === 'object'\) \{[\s\S]*if \(cfg\.enabled === false\) return;[\s\S]*if \(!keySet\.size\) \{[\s\S]*return \{\};/,
        'executionState 仍会把未启用方案标记为已执行'
    );
});
