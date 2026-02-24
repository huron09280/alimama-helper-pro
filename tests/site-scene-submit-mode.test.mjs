import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getBuildSceneRequestsFromWizardBlock() {
  const start = source.indexOf('const buildSceneRequestsFromWizard = (request = {}) => {');
  const end = source.indexOf('const normalizePlanNameForCompare =', start);
  assert.ok(start > -1 && end > start, '无法定位 buildSceneRequestsFromWizard 代码块');
  return source.slice(start, end);
}

test('场景请求按单计划拆分并透传场景并发提交次数', () => {
  const block = getBuildSceneRequestsFromWizardBlock();
  assert.match(
    block,
    /const isSiteScene = sceneName === '货品全站推广';/,
    '缺少货品全站推广场景判断'
  );
  assert.match(
    block,
    /const configuredParallelSubmitTimes = normalizeParallelSubmitTimes\([\s\S]*request\?\.parallelSubmitTimes[\s\S]*wizardState\?\.draft\?\.parallelSubmitTimes[\s\S]*\);/,
    '场景并发提交次数未读取可配置并发数'
  );
  assert.match(
    block,
    /const sceneParallelSubmitTimes = isSiteScene\s*\?\s*SITE_SCENE_PARALLEL_SUBMIT_TIMES\s*:\s*configuredParallelSubmitTimes;/,
    '场景并发提交次数未按全站\/其他场景分流'
  );
  assert.match(
    block,
    /parallelSubmitTimes:\s*sceneParallelSubmitTimes,/,
    '场景请求未透传并发提交次数'
  );
  assert.match(
    block,
    /plans:\s*\[plan\],/,
    '场景请求未按单计划拆分提交'
  );
});

function getHandleRunBlock() {
  const start = source.indexOf('const handleRun = async () => {');
  const end = source.indexOf('wizardState.els.runBtn.onclick = handleRun;', start);
  assert.ok(start > -1 && end > start, '无法定位 handleRun 代码块');
  return source.slice(start, end);
}

test('货品全站推广创建时禁用冲突处理', () => {
  const block = getHandleRunBlock();
  assert.match(
    block,
    /conflictPolicy:\s*'none'/,
    '未全局禁用冲突处理'
  );
  assert.match(
    block,
    /batchRetry:\s*0,/,
    '未禁用批次重试'
  );
  assert.match(
    block,
    /disableFallbackSingleRetry:\s*true,/,
    '未禁用单计划兜底重试'
  );
  assert.match(
    block,
    /const submitTimes = submitMode === 'serial'\s*\?\s*1\s*:\s*Math\.max\(1,\s*toNumber\(sceneReq\?\.parallelSubmitTimes,\s*1\)\);[\s\S]*parallelSubmitTimes:\s*submitTimes,/,
    '未透传场景并发提交次数'
  );
});

test('场景分组通过 Promise.all 并发提交，支持关键词与全站同时提交', () => {
  const block = getHandleRunBlock();
  assert.match(
    block,
    /const sceneTasks = sceneRequests\.map\(/,
    '缺少场景任务映射逻辑'
  );
  assert.match(
    block,
    /sceneTaskResults = await Promise\.all\(sceneTasks\);/,
    '场景任务未并发执行'
  );
});

test('单条模式会按计划顺序提交并在计划间隔后继续', () => {
  const block = getHandleRunBlock();
  assert.match(
    block,
    /const submitMode = normalizeSubmitMode\(wizardState\?\.draft\?\.submitMode \|\| 'parallel'\);/,
    '未读取提交模式草稿'
  );
  assert.match(
    block,
    /if \(submitMode === 'serial'\) \{[\s\S]*for \(let sceneIdx = 0; sceneIdx < sceneRequests\.length; sceneIdx\+\+\) \{/,
    '单条模式未按顺序逐计划提交'
  );
  assert.match(
    block,
    /await sleep\(serialIntervalMs\);/,
    '单条模式缺少计划间隔等待'
  );
  assert.match(
    block,
    /const submitTimes = submitMode === 'serial'\s*\?\s*1\s*:\s*Math\.max\(1,\s*toNumber\(sceneReq\?\.parallelSubmitTimes,\s*1\)\);/,
    '单条模式未强制单次提交'
  );
});

test('立即投放操作区包含提交方式下拉菜单（并发/单条）', () => {
  assert.match(
    source,
    /id="am-wxt-keyword-run-mode-toggle"/,
    '缺少立即投放提交方式下拉按钮'
  );
  assert.match(
    source,
    /id="am-wxt-keyword-run-mode-menu"/,
    '缺少提交方式菜单容器'
  );
  assert.match(
    source,
    /data-submit-mode="parallel"[\s\S]*并发数/,
    '菜单缺少并发数选项'
  );
  assert.match(
    source,
    /data-submit-mode-count="parallel"/,
    '并发数选项缺少次数徽标'
  );
  assert.match(
    source,
    /data-action="run-mode-count-badge"/,
    '并发数选项缺少可调节次数徽标交互锚点'
  );
  assert.match(
    source,
    /data-submit-mode="serial"[\s\S]*单条/,
    '菜单缺少单条选项'
  );
});

test('向导草稿包含 submitMode 默认值并在同步时归一化', () => {
  assert.match(
    source,
    /submitMode:\s*'parallel',/,
    '草稿默认值缺少 submitMode'
  );
  assert.match(
    source,
    /parallelSubmitTimes:\s*normalizeParallelSubmitTimes\(/,
    '草稿默认值缺少并发次数'
  );
  assert.match(
    source,
    /wizardState\.draft\.submitMode = normalizeSubmitMode\(wizardState\.draft\.submitMode \|\| 'parallel'\);/,
    '草稿同步未归一化 submitMode'
  );
  assert.match(
    source,
    /wizardState\.draft\.parallelSubmitTimes = normalizeParallelSubmitTimes\(/,
    '草稿同步未归一化并发次数'
  );
});

function getCreatePlansBatchBlock() {
  const start = source.indexOf('const createPlansBatch = async (request = {}, options = {}) => {');
  const end = source.indexOf('const appendKeywords = async (request = {}, options = {}) => {', start);
  assert.ok(start > -1 && end > start, '无法定位 createPlansBatch 代码块');
  return source.slice(start, end);
}

test('非全站场景单计划支持同计划并发 3 次提交', () => {
  const block = getCreatePlansBatchBlock();
  assert.match(
    block,
    /const useParallelSingleSubmit = remainingEntries\.length === 1 && parallelSubmitTimes > 1;/,
    '缺少并发重复提交分支'
  );
  assert.match(
    block,
    /emitProgress\(options,\s*'submit_batch_parallel_start'/,
    '并发重复提交未透出进度事件'
  );
  assert.match(
    block,
    /submitSinglePlanInParallel\(\s*parallelEntry,\s*batchEndpoint,\s*parallelSubmitTimes\s*\)/,
    '未按并发次数执行同计划并发提交'
  );
});

test('禁用兜底重试时，失败计划不会再次单条提交', () => {
  const block = getCreatePlansBatchBlock();
  assert.match(
    block,
    /if \(disableFallbackSingleRetry\) \{[\s\S]*failures\.push\(buildFailureFromEntry\(entry,\s*batchError\?\.message \|\| 'submit_failed'\)\);[\s\S]*continue;\s*\}/,
    '禁用兜底重试分支缺失'
  );
});
