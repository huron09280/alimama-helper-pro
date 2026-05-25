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

test('SmartAssistant 预算页面补丁支持恢复机制，避免误污染全局', () => {
    const block = getBudgetBlock();
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
