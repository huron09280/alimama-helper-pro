import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const optimizerPublicApi = readFileSync(new URL('../src/optimizer/public-api.js', import.meta.url), 'utf8');
const optimizerUi = readFileSync(new URL('../src/optimizer/ui.js', import.meta.url), 'utf8');
const mainAssistantUi = readFileSync(new URL('../src/main-assistant/ui.js', import.meta.url), 'utf8');
const mainAssistantMain = readFileSync(new URL('../src/main-assistant/main.js', import.meta.url), 'utf8');

test('算法护航公开入口会收口面板切换异常', () => {
    assert.match(
        optimizerPublicApi,
        /const resolveOptimizerLicenseGuard = \(\) => \{[\s\S]*globalThis\.LicenseGuard[\s\S]*window\.LicenseGuard/,
        '算法护航公开入口缺少授权守卫解析'
    );
    assert.match(
        optimizerPublicApi,
        /const requireOptimizerLicense = \(source = 'optimizer_public_api'\) => \{[\s\S]*guard\.requireAuthorizedSync\(source\);[\s\S]*guard\.triggerOnDemandVerify\?\.\(source\);[\s\S]*return false;/,
        '算法护航公开入口未用同步授权门禁阻断未授权调用'
    );
    assert.match(
        optimizerPublicApi,
        /const revealOptimizerPanel = \(panel\) => \{[\s\S]*UI\.startTokenStatusMonitor\?\.\(\);[\s\S]*panel\.style\.pointerEvents = 'auto';/,
        '缺少可复用的算法护航面板展示函数'
    );
    assert.match(
        optimizerPublicApi,
        /window\.__ALIMAMA_OPTIMIZER_TOGGLE__ = \(\) => \{[\s\S]*try \{[\s\S]*if \(!requireOptimizerLicense\('optimizer_toggle'\)\) return false;[\s\S]*return true;[\s\S]*\} catch \(err\) \{[\s\S]*Logger\.error\('算法护航面板切换失败', err\);[\s\S]*return false;/,
        '算法护航公开切换入口未捕获异常并返回失败状态'
    );
});

test('万能查数调用算法护航时会覆盖全链路异常', () => {
    assert.match(
        optimizerPublicApi,
        /window\.__ALIMAMA_OPTIMIZER_RUN_CAMPAIGN__ = async \(campaignId, customPrompt\) => \{[\s\S]*try \{[\s\S]*if \(!requireOptimizerLicense\('optimizer_run_campaign'\)\) \{[\s\S]*return buildOptimizerLicenseDeniedResult\('optimizer_run_campaign'\);[\s\S]*TokenManager\.refresh\(\);[\s\S]*if \(!document\.getElementById\(CONFIG\.UI_ID\)\) UI\.create\(\);[\s\S]*const res = await Core\.processCampaign/,
        'MagicReport 调用算法护航入口的 try 范围过窄'
    );
    assert.match(
        optimizerPublicApi,
        /catch \(e\) \{[\s\S]*Logger\.error\('MagicReport 调用算法护航失败', e\);[\s\S]*return \{ success: false, msg: e\?\.message \|\| '算法护航执行失败' \};/,
        'MagicReport 调用算法护航失败时未返回结构化错误'
    );
});

test('算法护航运行按钮会捕获异步执行失败', () => {
    assert.match(
        optimizerUi,
        /Core\.run\(\)\.catch\(\(err\) => \{[\s\S]*Logger\.error\('算法护航执行失败', err\);[\s\S]*UI\.updateStatus\(`执行异常：\$\{err\?\.message \|\| '未知错误'\}`, 'red'\);[\s\S]*\}\);/,
        '算法护航运行按钮未捕获 Core.run 异步失败'
    );
});

test('主助手工具按钮和启动入口会给异常提供反馈', () => {
    assert.match(
        mainAssistantUi,
        /const result = MagicReport\.toggle\(true\);[\s\S]*result\.catch\(\(err\) => \{[\s\S]*万能查数打开失败/,
        '万能查数按钮未捕获同步或异步打开异常'
    );
    assert.match(
        mainAssistantUi,
        /const toggleOptimizerPanel = \(\) => \{[\s\S]*window\.__ALIMAMA_OPTIMIZER_TOGGLE__\(\) !== false;[\s\S]*算法护航打开失败/,
        '主助手算法护航按钮未处理公开入口失败状态'
    );
    assert.match(
        mainAssistantMain,
        /const reportBootstrapError = \(err\) => \{[\s\S]*主助手启动失败[\s\S]*main bootstrap failed/,
        '主助手启动缺少顶层异常反馈'
    );
    assert.match(
        mainAssistantMain,
        /hasBootstrapped = true;[\s\S]*try \{[\s\S]*main\(\);[\s\S]*\} catch \(err\) \{[\s\S]*reportBootstrapError\(err\);/,
        '主助手 bootstrap 未捕获 main 初始化异常'
    );
});

test('主助手启动兜底轮询成功或超时后会同时释放 interval 和 timeout', () => {
    assert.match(
        mainAssistantMain,
        /let bootstrapRetryIntervalId = 0;\s*\n\s*let bootstrapRetryTimeoutId = 0;/,
        '主助手启动兜底缺少 interval/timeout 双句柄'
    );
    assert.match(
        mainAssistantMain,
        /const clearBootstrapRetryTimers = \(\) => \{[\s\S]*if \(bootstrapRetryIntervalId\) \{[\s\S]*clearInterval\(bootstrapRetryIntervalId\);[\s\S]*bootstrapRetryIntervalId = 0;[\s\S]*if \(bootstrapRetryTimeoutId\) \{[\s\S]*clearTimeout\(bootstrapRetryTimeoutId\);[\s\S]*bootstrapRetryTimeoutId = 0;/,
        '启动兜底 timer 应通过同一 helper 同时清理 interval 和 timeout'
    );
    assert.match(
        mainAssistantMain,
        /hasBootstrapped = true;\s*\n\s*clearBootstrapRetryTimers\(\);\s*\n\s*try \{\s*\n\s*main\(\);/,
        'bootstrap 成功后应立即释放启动兜底 timer'
    );
    assert.match(
        mainAssistantMain,
        /bootstrapRetryIntervalId = setInterval\(\(\) => \{[\s\S]*bootstrapMain\(\);[\s\S]*\}, 16\);[\s\S]*bootstrapRetryTimeoutId = setTimeout\(\(\) => \{[\s\S]*clearBootstrapRetryTimers\(\);[\s\S]*\}, 10000\);/,
        '启动兜底 interval 和 timeout 应保存句柄，超时通过统一 helper 清理'
    );
    assert.doesNotMatch(
        mainAssistantMain,
        /const timer = setInterval\(\(\) => \{[\s\S]*setTimeout\(\(\) => clearInterval\(timer\), 10000\);/,
        '启动兜底不应保留成功后仍悬挂的无句柄 timeout'
    );
});
