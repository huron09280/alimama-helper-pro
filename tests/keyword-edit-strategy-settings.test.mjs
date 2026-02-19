import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getApplyStrategyBlock() {
  const start = source.indexOf('const applyStrategyToDetailForm = (strategy) => {');
  assert.ok(start > -1, '无法定位 applyStrategyToDetailForm');
  const end = source.indexOf('const pullDetailFormToStrategy = (strategy) => {', start);
  assert.ok(end > start, '无法定位 pullDetailFormToStrategy');
  return source.slice(start, end);
}

test('编辑计划切换策略时会覆盖 sceneSettingValues/sceneSettingTouched，避免残留上一个策略设置', () => {
  const block = getApplyStrategyBlock();
  assert.match(
    block,
    /wizardState\.draft\.sceneSettingValues\[strategyScene\]\s*=\s*mergeDeep\(\{\},\s*strategySceneSettingValues\);/,
    '缺少 sceneSettingValues 覆盖回填'
  );
  assert.match(
    block,
    /wizardState\.draft\.sceneSettingTouched\[strategyScene\]\s*=\s*mergeDeep\(\{\},\s*strategySceneSettingTouched\);/,
    '缺少 sceneSettingTouched 覆盖回填'
  );
  assert.doesNotMatch(
    block,
    /if\s*\(Object\.keys\(strategySceneSettingValues\)\.length\)\s*\{[\s\S]*wizardState\.draft\.sceneSettingValues\[strategyScene\]/,
    '仍存在按非空才回填 sceneSettingValues 的逻辑，可能导致编辑计划串值'
  );
  assert.doesNotMatch(
    block,
    /if\s*\(Object\.keys\(strategySceneSettingTouched\)\.length\)\s*\{[\s\S]*wizardState\.draft\.sceneSettingTouched\[strategyScene\]/,
    '仍存在按非空才回填 sceneSettingTouched 的逻辑，可能导致编辑计划串值'
  );
});
