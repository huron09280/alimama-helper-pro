import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getKeywordApiReturnBlock() {
  const startAnchor = source.indexOf("const createLeadPlansBatch = (request = {}, options = {}) => createPlansByScene('线索推广', request, options);");
  assert.ok(startAnchor > -1, '无法定位 createLeadPlansBatch');
  const returnStart = source.indexOf('return {', startAnchor);
  const returnEnd = source.indexOf('\n        };\n    })();', returnStart);
  assert.ok(returnStart > -1 && returnEnd > returnStart, '无法定位 KeywordPlanApi return 块');
  return source.slice(returnStart, returnEnd);
}

function getApiBridgeMethodsBlock() {
  const start = source.indexOf('const API_BRIDGE_METHODS = [');
  assert.ok(start > -1, '无法定位 API_BRIDGE_METHODS');
  const end = source.indexOf('];', start);
  assert.ok(end > start, 'API_BRIDGE_METHODS 结构不完整');
  return source.slice(start, end + 2);
}

const keptMethods = [
  'openWizard',
  'getRuntimeDefaults',
  'searchItems',
  'createPlansBatch',
  'createPlansByScene',
  'createSitePlansBatch',
  'createKeywordPlansBatch',
  'createCrowdPlansBatch',
  'createShopDirectPlansBatch',
  'createContentPlansBatch',
  'createLeadPlansBatch',
  'appendKeywords',
  'suggestKeywords',
  'suggestCrowds',
  'validate',
  'getSessionDraft',
  'clearSessionDraft'
];

const removedMethods = [
  'scanCurrentSceneSettings',
  'scanAllSceneSettings',
  'scanSceneSpec',
  'scanAllSceneSpecs',
  'startNetworkCapture',
  'getNetworkCapture',
  'stopNetworkCapture',
  'extractSceneGoalSpecs',
  'getNewPlanComponentConfig',
  'runSceneSmokeTests',
  'captureSceneCreateInterfaces',
  'getSceneSpec',
  'getSceneCreateContract',
  'extractLifecycleContracts',
  'getLifecycleContract',
  'resolveCreateConflicts',
  'runCreateRepairByItem',
  'validateSceneRequest'
];

test('KeywordPlanApi v2-slim 仅暴露保留方法', () => {
  const returnBlock = getKeywordApiReturnBlock();
  for (const method of keptMethods) {
    assert.match(returnBlock, new RegExp(`\\b${method}\\b`), `缺少保留方法: ${method}`);
  }
  for (const method of removedMethods) {
    assert.doesNotMatch(returnBlock, new RegExp(`\\b${method}\\b`), `不应继续暴露已删除方法: ${method}`);
  }
});

test('API_BRIDGE_METHODS 与 KeywordPlanApi 暴露保持一致（v2-slim）', () => {
  const bridgeBlock = getApiBridgeMethodsBlock();
  for (const method of keptMethods) {
    assert.match(bridgeBlock, new RegExp(`['\"]${method}['\"]`), `桥接缺少保留方法: ${method}`);
  }
  for (const method of removedMethods) {
    assert.doesNotMatch(bridgeBlock, new RegExp(`['\"]${method}['\"]`), `桥接不应包含已删除方法: ${method}`);
  }
});

test('向导已移除 scan/repair UI 控件与 component/findList 依赖', () => {
  assert.doesNotMatch(source, /am-wxt-keyword-scan-scenes/, '不应保留抓取场景按钮 ID');
  assert.doesNotMatch(source, /抓取全部场景参数/, '不应保留抓取场景按钮文案');
  assert.doesNotMatch(source, /runCreateRepairFromWizard/, '不应保留全场景修复入口');
  assert.doesNotMatch(source, /component\/findList\.json/, '不应保留 component/findList 依赖');
});

test('向导运行回退会将页面已添加商品注入 itemSearch（避免空计划误提交）', () => {
  const runStart = source.indexOf('const handleRun = async () => {');
  assert.ok(runStart > -1, '无法定位 handleRun');
  const runEnd = source.indexOf('wizardState.els.runBtn.onclick = handleRun;', runStart);
  assert.ok(runEnd > runStart, 'handleRun 结构不完整');
  const runBlock = source.slice(runStart, runEnd);

  assert.match(runBlock, /req\.itemSearch\s*=\s*{/, '应在 run 回退分支注入 itemSearch');
  assert.match(runBlock, /itemIdList:\s*mergedItemIdList/, '应将页面商品 ID 合并写入 itemSearch.itemIdList');
  assert.match(runBlock, /const fallbackItemCount = Array\.isArray\(req\.itemSearch\?\.itemIdList\)/, '应基于 itemSearch.itemIdList 计算回退数量');
  assert.match(runBlock, /if \(!req\.plans\.length && !fallbackItemCount\)/, '应在 plans 和回退商品都为空时阻断提交');
});
