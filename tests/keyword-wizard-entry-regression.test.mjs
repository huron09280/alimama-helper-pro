import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const gridSource = readFileSync(new URL('../src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-grid.js', import.meta.url), 'utf8');
const assistantBootstrapSource = readFileSync(new URL('../src/main-assistant/bootstrap.js', import.meta.url), 'utf8');
const assistantUiSource = readFileSync(new URL('../src/main-assistant/ui.js', import.meta.url), 'utf8');
const optimizerBridgeSource = readFileSync(new URL('../src/optimizer/bridge.js', import.meta.url), 'utf8');

test('场景动态渲染的时间解析 helper 可被前置货品全站配置安全调用', () => {
  assert.match(
    gridSource,
    /function parseTimeRangeToMinutes\(timeText = ''\) \{/,
    'parseTimeRangeToMinutes 必须使用函数声明，避免货品全站配置在声明前调用时触发 TDZ'
  );
  assert.doesNotMatch(
    gridSource,
    /const parseTimeRangeToMinutes\s*=/,
    'parseTimeRangeToMinutes 不能退回 const 表达式，否则 openWizard 会在货品全站配置中报 TDZ'
  );
  assert.match(
    gridSource,
    /function formatMinutesToClock\(minutes = 0\) \{/,
    'formatMinutesToClock 也应保持函数声明，供后续弹窗序列化稳定复用'
  );
});

test('组建计划入口捕获 openWizard 异常并打开已有弹窗兜底', () => {
  assert.match(
    assistantUiSource,
    /const reportKeywordPlanOpenFailure = \(err\) => \{[\s\S]*?openExistingKeywordOverlay\(\)[\s\S]*?alert\(`/,
    '组建计划入口异常时必须给当前页可见反馈，并优先打开已有弹窗'
  );
  assert.match(
    assistantUiSource,
    /const openKeywordPlanWizard = \(targetApi\) => \{[\s\S]*?const result = targetApi\.openWizard\(\);[\s\S]*?result\.catch\(reportKeywordPlanOpenFailure\);[\s\S]*?catch \(err\) \{[\s\S]*?reportKeywordPlanOpenFailure\(err\);/,
    '组建计划入口必须同时捕获同步异常和 Promise reject'
  );
});

test('组建计划入口在完整 API 不可见时回退到 openWizard 窄桥', () => {
  assert.match(
    assistantBootstrapSource,
    /const KEYWORD_PLAN_OPEN_BRIDGE_READY_KEY = '__AM_WXT_KEYWORD_OPEN_BRIDGE_READY__';/,
    '主助手缺少 openWizard 窄桥就绪标记'
  );
  assert.match(
    assistantBootstrapSource,
    /const createKeywordPlanOpenBridgeApi = \(\) => \(\{[\s\S]*?openWizard\(\) \{[\s\S]*?window\.dispatchEvent\(new CustomEvent\(KEYWORD_PLAN_OPEN_BRIDGE_REQ_EVENT/,
    '主助手未实现只打开向导的窄桥客户端'
  );
  assert.match(
    assistantBootstrapSource,
    /if \(window\[KEYWORD_PLAN_OPEN_BRIDGE_READY_KEY\] === '1'\) \{[\s\S]*?return createKeywordPlanOpenBridgeApi\(\);[\s\S]*?\}/,
    'resolveKeywordPlanApiAccessor 未在完整 API 不可见时回退到窄桥'
  );
});

test('optimizer 默认安装 openWizard 窄桥但不恢复完整 page API', () => {
  assert.match(
    optimizerBridgeSource,
    /const installKeywordPlanOpenBridgeHost = \(\) => \{[\s\S]*?KeywordPlanApi\.openWizard\(\)[\s\S]*?window\.addEventListener\(KEYWORD_PLAN_OPEN_BRIDGE_REQ_EVENT/,
    'optimizer 未安装默认 openWizard 窄桥 host'
  );
  assert.match(
    optimizerBridgeSource,
    /installKeywordPlanOpenBridgeHost\(\);\s*if \(shouldExposePageApiDebug\(\)\) \{/,
    'openWizard 窄桥应默认安装，完整 page API 仍必须受 debug 开关保护'
  );
  assert.doesNotMatch(
    optimizerBridgeSource,
    /window\.__AM_WXT_KEYWORD_API__\s*=\s*\{\s*openWizard/s,
    '不要用 page 全局对象暴露 openWizard 窄桥，避免和完整 API 暴露边界混淆'
  );
});
