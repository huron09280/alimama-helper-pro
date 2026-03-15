import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getBuildRequestFromWizardBlock() {
  const start = source.indexOf('const buildRequestFromWizard = () => {');
  assert.ok(start > -1, '无法定位 buildRequestFromWizard');
  const end = source.indexOf('const buildSceneRequestsFromWizard = (request = {}) => {', start);
  assert.ok(end > start, '无法定位 buildSceneRequestsFromWizard');
  return source.slice(start, end);
}

test('编辑计划场景下，关键词策略会用 sceneSettingValues 回填 sceneSettings 兜底', () => {
  const block = getBuildRequestFromWizardBlock();
  assert.match(
    block,
    /let strategySceneSettings = normalizeSceneSettingsObject\(strategy\?\.sceneSettings \|\| \{\}\);[\s\S]*?if \(!Object\.keys\(strategySceneSettings\)\.length && isPlainObject\(strategy\?\.sceneSettingValues\)\) \{[\s\S]*?normalizeSceneSettingBucketValues\(strategy\.sceneSettingValues \|\| \{\}\)[\s\S]*?\}[\s\S]*?if \(!Object\.keys\(strategySceneSettings\)\.length\) \{[\s\S]*?getSceneSettingsForRequest\(strategySceneName\)/,
    '缺少 sceneSettingValues -> sceneSettings 的兜底回填，可能导致编辑策略设置丢失'
  );
});

test('关键词策略提交前会强制同步营销目标到 sceneSettings，避免编辑与提交不一致', () => {
  const block = getBuildRequestFromWizardBlock();
  assert.match(
    block,
    /if \(isKeywordScene && strategyMarketingGoal\) \{[\s\S]*?营销目标: strategyMarketingGoal[\s\S]*?strategySceneSettings\.选择卡位方案 = strategyMarketingGoal;[\s\S]*?\}/,
    '缺少关键词营销目标向 sceneSettings 的强制同步，编辑计划与提交目标可能不一致'
  );
});
