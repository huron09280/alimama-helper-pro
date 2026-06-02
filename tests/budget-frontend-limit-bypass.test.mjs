import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getBudgetBlock() {
    const start = source.indexOf('const BudgetFrontendLimitBypass = {');
    const end = source.indexOf('const Interceptor = {', start);
    assert.ok(start > -1 && end > start, '无法定位 BudgetFrontendLimitBypass 代码块');
    return source.slice(start, end);
}

function getMainBlock() {
    const start = source.indexOf('const isSmartAssistantBudgetOnlyPage = () => {');
    const end = source.indexOf('let hasBootstrapped = false;', start);
    assert.ok(start > -1 && end > start, '无法定位 SmartAssistant 入口判断与 main 代码块');
    return source.slice(start, end);
}

function getUserscriptMetaBlock() {
    const start = source.indexOf('// ==UserScript==');
    const end = source.indexOf('// ==/UserScript==', start);
    assert.ok(start > -1 && end > start, '无法定位 userscript 元信息区块');
    return source.slice(start, end + '// ==/UserScript=='.length);
}

test('SmartAssistant 预算破限仅聚焦 dailyBudgetAmount 并带入阈值判断', () => {
    const block = getBudgetBlock();
    assert.match(block, /SMART_ASSISTANT_BUDGET_FIELD_NAME\s*=\s*'dailyBudgetAmount'/, '缺少 SmartAssistant budget field 配置：dailyBudgetAmount');
    assert.match(block, /SMART_ASSISTANT_BUDGET_MIN_VALUE\s*=\s*100/, '缺少 SmartAssistant 最小预算阈值 100');
    assert.match(block, /shouldBypassSmartAssistantBudgetValidationValue\s*=\s*\(/, '缺少 SmartAssistant 预算值判断 helper');
    assert.match(block, /createSmartAssistantBudgetValidationValues\s*=\s*\(/, '缺少 SmartAssistant 校验值构造 helper');
});

test('SmartAssistant 预算校验短路覆盖 setError/getErrors/getState/validate 生命周期', () => {
    const block = getBudgetBlock();
    assert.match(block, /if \(hasSetError\) \{[\s\S]*target\.setError = function \(\.\.\.args\) \{/ , '未对 setError 进行 SmartAssistant 级短路补丁');
    assert.match(block, /if \(hasGetErrors\) \{[\s\S]*target\.getErrors = function \(\.\.\.args\) \{/ , '未对 getErrors 进行 SmartAssistant 级短路补丁');
    assert.match(block, /if \(hasGetState\) \{[\s\S]*target\.getState = function \(\.\.\.args\) \{/ , '未对 getState 进行 SmartAssistant 级短路补丁');
    assert.match(block, /if \(hasValidate\) \{[\s\S]*target\.validate = function \(\.\.\.args\) \{/ , '未对 validate 进行 SmartAssistant 级短路补丁');
    assert.match(block, /isSmartAssistantBudgetWarning\(context, reason\)/, '缺少 SmartAssistant warning 识别短路条件');
});

test('通用预算破限保留原生 check 副作用，只放行预算下限结果', () => {
    const block = getBudgetBlock();
    assert.match(block, /PATCHER_VERSION\s*=\s*'2026-06-01-budget-submit-v7'/, '预算 patcher 需要版本化安装，避免旧运行态布尔哨兵阻止新补丁生效');
    assert.match(block, /__AM_BUDGET_FRONTEND_UNLOCK_PATCHER_VERSION__ === PATCHER_VERSION/, '预算 patcher 应按版本判断是否已安装');
    assert.match(block, /const originalCheck = hasCheck \? view\.check : null;/, 'patch 前应保存原生 check');
    assert.match(block, /const originalIsValid = hasIsValidFn \? view\.isValid : null;/, 'patch 前应保存原生 isValid');
    assert.match(block, /const originalValidate = hasValidate \? view\.validate : null;/, 'patch 前应保存原生 validate');
    assert.match(block, /view\.check = function \(\.\.\.args\) \{[\s\S]*const result = originalCheck\.apply\(this, args\)/, 'patch 后必须先调用原生 check，保留取值同步等副作用');
    assert.match(block, /view\.isValid = function \(\.\.\.args\) \{[\s\S]*const result = originalIsValid\.apply\(this, args\)/, '函数型 isValid 也必须先调用原生实现');
    assert.match(block, /view\.validate = function \(\.\.\.args\) \{[\s\S]*const result = originalValidate\.apply\(this, args\)/, 'validate 也必须先调用原生实现，保留父表单聚合副作用');
    assert.match(block, /normalizeBudgetCheckResult\(value\)/, '原生 check 结果应只做预算下限类归一化');
    assert.match(block, /const normalizeBudgetIsValidResult = \(value\) => \([\s\S]*isBudgetMinValidationResult\(value\) \? true : value[\s\S]*\);/, '函数型 isValid 的预算下限失败应保持布尔语义');
    assert.match(block, /view\.isValid = function \(\.\.\.args\) \{[\s\S]*normalizeBudgetIsValidResult\(value\)[\s\S]*normalizeBudgetIsValidResult\(result\)/, 'isValid 不应复用 check 的对象归一化结果');
    assert.match(block, /isBudgetMinValidationError\(err\)[\s\S]*return \{ ok: true, msg: '' \};/, '只有预算下限类异常可转为通过');
    assert.doesNotMatch(block, /view\.check = \(\) => Promise\.resolve\(\{ ok: true, msg: '' \}\);/, '不得再次把原生 check 直接短路为恒成功');
    assert.doesNotMatch(block, /view\.isValid = \(\) => true;/, '不得再次把原生 isValid 直接短路为恒成功');
});

test('通用预算破限覆盖 one.alimama 修改预算的大于阈值文案', () => {
    const block = getBudgetBlock();
    assert.match(block, /GENERAL_BUDGET_FIELD_RE\s*=\s*\/[\s\S]*每日预算[\s\S]*dailyBudget[\s\S]*budgetAmount[\s\S]*day_budget/, '通用预算字段识别未覆盖每日预算/dailyBudget/budgetAmount/day_budget');
    assert.match(block, /DAILY_BUDGET_FIELD_RE\s*=\s*\/[\s\S]*每日预算[\s\S]*日预算[\s\S]*dailyBudget[\s\S]*day_budget/, '通用预算破限应收窄到每日预算字段');
    assert.match(block, /BUDGET_MIN_HINT_RE\s*=\s*\/[\s\S]*低于[\s\S]*不少于[\s\S]*大于[\s\S]*以上[\s\S]*minimum/, '通用预算下限提示未覆盖“大于/以上/低于/minimum”');
    assert.match(block, /NUMERIC_THRESHOLD_RE\s*=\s*\/\(\?:\\\\d\[\\\\d,\]\*\(\?:\\\\\.\\\\d\+\)\?\|一百\|百\)/, '预算下限提示必须带明确数字阈值，避免误放行空值/格式错误');
    assert.match(block, /isDailyBudgetMinValidationText = \(text\) => \{[\s\S]*DAILY_BUDGET_FIELD_RE\.test\(value\)[\s\S]*BUDGET_MIN_HINT_RE\.test\(value\)[\s\S]*NUMERIC_THRESHOLD_RE\.test\(value\)/, '通用预算下限文案识别必须同时具备每日预算、下限语义和数字阈值');
    assert.match(block, /请检查\.\{0,12\}\(每日预算\|日预算\)[\s\S]*hasVisibleDailyBudgetMinHint\(\)/, '聚合错误只能在页面已有可见每日预算下限提示时放行');
    assert.doesNotMatch(block, /请检查\.\{0,12\}\(预算\|日预算\|每日预算\)[\s\S]*return true/, '不得把宽泛“请检查预算”直接放行');
});

test('通用预算破限会清理 one.alimama 弹窗预算错误状态', () => {
    const block = getBudgetBlock();
    assert.match(block, /clearGenericBudgetErrorState = \(\) => \{[\s\S]*next-form-item-error[\s\S]*aria-invalid[\s\S]*isBudgetMinValidationText\(node\.textContent \|\| ''\)/, '缺少通用预算错误状态清理');
    assert.match(block, /normalizeBudgetCheckResult\(value\)[\s\S]*clearGenericBudgetErrorState\(\)/, 'check 归一化预算下限错误后应清理 DOM 错误态');
    assert.match(block, /view\.validate = function \(\.\.\.args\) \{[\s\S]*normalizeBudgetCheckResult\(value\)[\s\S]*clearGenericBudgetErrorState\(\)/, 'validate 归一化预算下限错误后应清理 DOM 错误态');
    assert.match(block, /normalizeBudgetIsValidResult\(value\)[\s\S]*clearGenericBudgetErrorState\(\)/, 'isValid 归一化预算下限错误后应清理 DOM 错误态');
});

test('通用预算破限扩大候选组件并向上收集父级 VFrame', () => {
    const block = getBudgetBlock();
    assert.match(block, /'\[mx-view\*="budget"\]'[\s\S]*'\[mxc\*="budget"\]'[\s\S]*'\[name\*="budget"\]'[\s\S]*'\[data-name\*="budget"\]'/, '预算候选 selector 未覆盖通用 budget/name/data-name');
    assert.match(block, /const collectBudgetFieldNodes = \(\) => \{[\s\S]*document\.querySelectorAll\('input, textarea'\)[\s\S]*GENERAL_BUDGET_FIELD_RE\.test\(attrs \+ ' ' \+ scopeText\)/, '缺少按输入邻近文案识别预算字段的候选收集');
    assert.match(block, /while \(cursor && depth < 24\)/, '预算节点向上收集父级 VFrame 的深度不足以覆盖真实弹窗');
    assert.match(block, /collectBudgetFieldNodes\(\)\.forEach\(\(node\) => \{[\s\S]*collectCandidateIds\(node\)\.forEach\(\(id\) => ids\.add\(id\)\)/, '预算节点未继续向上收集父级 VFrame');
});

test('通用预算破限会在 batchUpdate 提交前同步可见每日预算值', () => {
    const block = getBudgetBlock();
    assert.ok(
        block.includes('installBudgetSubmitPayloadPatch = () => {') && block.includes('batchUpdate\\\\.json'),
        '缺少预算 batchUpdate 写请求边界补丁'
    );
    assert.match(block, /findVisibleBudgetDialog = \(\) => \{[\s\S]*修改预算[\s\S]*DAILY_BUDGET_FIELD_RE\.test\(text\)/, '提交前应先限定当前可见“修改预算”每日预算弹窗');
    assert.match(block, /getVisibleDailyBudgetInputValue = \(\) => \{[\s\S]*const dialog = findVisibleBudgetDialog\(\)[\s\S]*dialog\.querySelectorAll\('input, textarea'\)[\s\S]*\.mxform-line[\s\S]*parseBudgetValue\(node\.value\)/, '提交前只能从当前弹窗内可见每日预算输入读取用户值');
    assert.match(block, /const isDailyBudgetRequest = \(dmcType === '' \|\| dmcType === 'normal'\)[\s\S]*!hasNonDailyBudget[\s\S]*item\.dayBudget !== undefined/, '提交 payload 只能改写 normal/dayBudget 语义请求');
    assert.match(block, /item\.dayBudget = String\(visibleBudgetValue\)/, '目标每日预算请求应把 dayBudget 对齐到可见输入值');
    assert.doesNotMatch(block, /delete item\.dayAverageBudget/, '不得删除非日预算字段破坏其它预算类型请求');
    assert.doesNotMatch(block, /delete item\.totalBudget/, '不得删除总预算字段破坏其它预算类型请求');
    assert.match(block, /XMLHttpRequest[\s\S]*patchedSend = function \(body\)[\s\S]*normalizeBudgetSubmitBody\(body\)[\s\S]*xhrProto\.send = patchedSend/, 'XHR 提交链路未接入预算 payload 同步');
});

test('通用预算破限只在请求值低于服务端硬下限时重提最低值', () => {
    const block = getBudgetBlock();
    assert.match(block, /parseServerMinimumBudgetValue = \(text\) => \{[\s\S]*日预算不能低于/, '缺少服务端最低日预算文案解析');
    assert.match(block, /parseServerMinimumBudgetValue = \(text\) => \{[\s\S]*errorDetails/, '缺少服务端 JSON errorDetails 解析');
    assert.match(block, /const requestedBudget = getDailyBudgetSubmitValue\(payload\);[\s\S]*if \(requestedBudget >= serverMinimum\) \{[\s\S]*requested-not-lower-than-minimum[\s\S]*return;[\s\S]*\}/, '请求预算不低于服务端最低值时不得替换重提');
    assert.match(block, /item\.dayBudget = serverMinimum;/, '请求预算低于服务端最低值时才应重提服务端最低值');
    assert.match(block, /this\.addEventListener\('loadend'[\s\S]*retryBudgetSubmitWithServerMinimum\(budgetUrl, nextBody, this\.responseText\)/, 'XHR 响应后应解析服务端最低值并按条件重提');
    assert.match(block, /apply = async \(\) => \{[\s\S]*installBudgetSubmitPayloadPatch\(\)/, '周期扫描应恢复被页面后续脚本覆盖的预算提交 hook');
});

test('SmartAssistant 预算页面补丁支持恢复机制，避免误污染全局', () => {
    const block = getBudgetBlock();
    assert.match(block, /smartAssistantPatchedTargets\s*=\s*new Map\(\)/, 'SmartAssistant patch 快照需要可遍历 Map 支持恢复');
    assert.match(block, /restoreSmartAssistantPatches = \(\) => \{[\s\S]*smartAssistantPatchedTargets\.forEach\(\(snapshot, target\)/, '缺少 SmartAssistant patch 快照恢复实现');
    assert.match(block, /collectSmartAssistantReactTargets = \(\) => \{/, '缺少 SmartAssistant React 目标收集实现');
    assert.match(block, /scheduleSmartAssistantPatch = \(\) => \{[\s\S]*if \(window.__AM_BUDGET_FRONTEND_UNLOCK__ && isSmartAssistantBudgetPage\(\)\)/, '缺少 SmartAssistant patch 启停时序调度');
});

test('SmartAssistant 页面主入口只启动UI与预算补丁', () => {
    const block = getMainBlock();
    assert.match(
        block,
        /if \(isSmartAssistantBudgetOnlyPage\(\)\) \{[\s\S]*Logger\.log\('🔧 SmartAssistant 预算页：仅启动预算破限补丁'\);[\s\S]*notifyRiskChallengeIfNeeded\(window\.location\.href\);[\s\S]*return;[\s\S]*\}/,
        'SmartAssistant 页面未做独立初始化分支'
    );
    assert.match(block, /Interceptor\.init\(\);/, 'SmartAssistant 分支应在主循环初始化之前执行条件判定');
    assert.match(block, /BudgetFrontendLimitBypass\.init\(\);/, '缺少预算补丁初始化入口');
    assert.match(block, /UI\.init\(\);/, '缺少 UI 初始化入口');
});

test('userscript 匹配与授权网关包含 myseller.taobao.com', () => {
    const metaBlock = getUserscriptMetaBlock();
    assert.match(metaBlock, /@match\s+https:\/\/myseller\.taobao\.com\//, 'userscript 头部未包含 myseller.taobao.com 匹配');
    assert.match(metaBlock, /@connect\s+myseller\.taobao\.com/, 'userscript 头部未包含 myseller.taobao.com connect');
});
