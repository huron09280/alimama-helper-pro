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

test('仅在新链路设置表存在时才应用手动参数设置，旧版链路不强行带参数', () => {
    assert.match(
        coreSource,
        /const hasEscortSettingTable = !!finalSetting;[\s\S]*if \(manualSetting\?\.enabled && hasEscortSettingTable\)/,
        '手动参数设置未按新旧链路区分，旧版链路可能被错误带入参数'
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
        /buildExecutionStateMap[\s\S]*UI\.renderEscortSettingTableToCard\(card,\s*resolvedOpenV3Setting\.displaySetting,\s*\{\s*executionState\s*\}\)/,
        'openV3 提交后未将 executionState 回传给方案渲染'
    );
    assert.match(
        uiSource,
        /resolveExecutionIcon[\s\S]*executionState[\s\S]*'✅'[\s\S]*'❌'[\s\S]*actionText:\s*`\$\{resolveExecutionIcon\(rawKey,\s*key\)\}/,
        '方案名称未根据 executionState 显示 ✅/❌'
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
        /manualEscortSetting:\s*\{[\s\S]*enabled:\s*false[\s\S]*bidConstraintValue:\s*\{\s*enabled:\s*false[\s\S]*budget:\s*\{\s*enabled:\s*false[\s\S]*dailyReset:\s*false[\s\S]*addKeyword:\s*\{\s*enabled:\s*false[\s\S]*switchKeywordMatchType:\s*\{\s*enabled:\s*false[\s\S]*shieldKeyword:\s*\{\s*enabled:\s*false/,
        '默认配置仍存在开启项，未满足“默认全部关闭”'
    );
    assert.match(
        uiSource,
        /setCheckboxValue\(`\$\{CONFIG\.UI_ID\}-manual-enable`,\s*setting\.enabled,\s*false\);[\s\S]*setCheckboxValue\(`\$\{CONFIG\.UI_ID\}-manual-budget-enabled`,\s*budget\.enabled,\s*false\);[\s\S]*setCheckboxValue\(`\$\{CONFIG\.UI_ID\}-manual-budget-reset`,\s*budget\.dailyReset,\s*false\);[\s\S]*setCheckboxValue\(`\$\{CONFIG\.UI_ID\}-manual-addkeyword-enabled`,\s*addKeyword\.enabled,\s*false\);[\s\S]*setCheckboxValue\(`\$\{CONFIG\.UI_ID\}-manual-switchmatch-enabled`,\s*switchKeywordMatchType\.enabled,\s*false\);[\s\S]*setCheckboxValue\(`\$\{CONFIG\.UI_ID\}-manual-shield-enabled`,\s*shieldKeyword\.enabled,\s*false\);/,
        'UI 表单 fallback 未统一改为默认关闭'
    );
});

test('手动设置外层与内层勾选状态保持同步', () => {
    assert.match(
        uiSource,
        /getManualEscortCheckboxNodes:\s*\(\)\s*=>\s*\{[\s\S]*manual-bid-enabled[\s\S]*manual-bid-reset[\s\S]*manual-budget-enabled[\s\S]*manual-budget-reset[\s\S]*manual-addkeyword-enabled[\s\S]*manual-switchmatch-enabled[\s\S]*manual-shield-enabled/,
        '未收敛内层 checkbox 节点列表，无法实现同步'
    );
    assert.match(
        uiSource,
        /bindManualEscortCheckboxSync:\s*\(\)\s*=>\s*\{[\s\S]*master\.addEventListener\('change'[\s\S]*node\.checked = nextChecked;[\s\S]*children\.forEach\(node => \{[\s\S]*node\.addEventListener\('change'[\s\S]*UI\.syncManualEscortMasterCheckbox\(\);/,
        '外层->内层或内层->外层同步逻辑缺失'
    );
    assert.match(
        uiSource,
        /syncManualEscortMasterCheckbox:\s*\(\)\s*=>\s*\{[\s\S]*master\.indeterminate = true;/,
        '内层部分勾选时未回写外层半选状态'
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
        /findLineByLabel\('平均点击成本'\)[\s\S]*findLineByLabel\('每日预算调控区间'\)/,
        '弹窗出价/预算字段未按官方标签精确定位，容易出现参数串位'
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
        /if \(manualCfg\.upperLimit === '不限'\) \{[\s\S]*if \(targetKey === 'budget'\) baseCfg\.upperType = 0;[\s\S]*if \(targetKey === 'bidConstraintValue'\) delete baseCfg\.upperType;[\s\S]*\} else \{[\s\S]*if \(targetKey === 'budget'\) baseCfg\.upperType = 1;[\s\S]*if \(targetKey === 'bidConstraintValue'\) delete baseCfg\.upperType;/,
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
