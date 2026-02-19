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

test('货品全站推广按同步批量提交，不拆分为单计划异步任务', () => {
  const block = getBuildSceneRequestsFromWizardBlock();
  assert.match(
    block,
    /const isSiteScene = sceneName === '货品全站推广';/,
    '缺少货品全站推广场景判断'
  );
  assert.match(
    block,
    /if \(isSiteScene\) \{[\s\S]*sceneRequests\.push\(\{[\s\S]*plans:\s*plansForSync[\s\S]*\}\);[\s\S]*return;\s*\}/,
    '货品全站推广未走整批同步提交分支'
  );
  assert.match(
    block,
    /plans:\s*\[plan\]/,
    '非货品全站场景应保留单计划拆分逻辑'
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
    /conflictPolicy:\s*sceneReq\.sceneName\s*===\s*'货品全站推广'\s*\?\s*'none'\s*:\s*String\(API_ONLY_CREATE_OPTIONS\.conflictPolicy\s*\|\|\s*'auto_stop_retry'\)\.trim\(\)\s*\|\|\s*'auto_stop_retry'/,
    '货品全站推广未禁用冲突处理'
  );
});
