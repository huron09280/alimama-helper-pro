import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

test('生命周期忽略名单覆盖预算建议/动态模块接口，避免污染 delete/pause 合同', () => {
  assert.ok(source.includes('algo\\/getBudgetSuggestion'), 'LIFECYCLE_IGNORE_PATH_RE 未覆盖 algo/getBudgetSuggestion');
  assert.ok(source.includes('cube\\/triggerDynamicModule'), 'LIFECYCLE_IGNORE_PATH_RE 未覆盖 cube/triggerDynamicModule');
  assert.match(
    source,
    /const isLifecycleContractUsable = \(action = '', contract = \{\}\) => \{[\s\S]*?if \(LIFECYCLE_IGNORE_PATH_RE\.test\(path\)\) return false;/,
    'isLifecycleContractUsable 未优先过滤忽略接口'
  );
});

test('生命周期 action 推断必须通过 isLifecycleContractUsable 安全校验', () => {
  const start = source.indexOf('const inferLifecycleActionFromContract = (contract = {}, options = {}) => {');
  const end = source.indexOf('const scoreLifecycleContractCandidate = (action = \'\', contract = {}) => {', start);
  assert.ok(start > -1 && end > start, '无法定位 inferLifecycleActionFromContract');
  const block = source.slice(start, end);

  assert.match(block, /if \(forceAction && isLifecycleContractUsable\(forceAction, contract\)\) return forceAction;/, 'forceAction 未做安全校验');
  assert.match(block, /if \(isLifecycleContractUsable\('delete', contract\)\) return 'delete';/, 'delete 推断未走安全校验');
  assert.match(block, /if \(isLifecycleContractUsable\('pause', contract\)\) return 'pause';/, 'pause 推断未走安全校验');
  assert.match(block, /if \(isLifecycleContractUsable\('list_conflict', contract\)\) return 'list_conflict';/, 'list_conflict 推断未走安全校验');
});

test('生命周期评分与缓存读取都拒绝不安全合同', () => {
  assert.match(
    source,
    /const scoreLifecycleContractCandidate = \(action = '', contract = \{\}\) => \{[\s\S]*?if \(!isLifecycleContractUsable\(normalizedAction, contract\)\) return -1;/,
    'scoreLifecycleContractCandidate 未拒绝不安全合同'
  );
  assert.match(
    source,
    /if \(!isLifecycleContractUsable\(normalizedAction, entry\.data\)\) \{[\s\S]*?delete sceneLifecycleContractCache\.map\[key\];[\s\S]*?persistSceneLifecycleContractCache\(\);[\s\S]*?return null;/,
    'getCachedSceneLifecycleContract 未清理不安全缓存合同'
  );
  assert.match(
    source,
    /if \(!isLifecycleContractUsable\(normalizedAction, contract\)\) return;/,
    'setCachedSceneLifecycleContract 未阻止写入不安全合同'
  );
});

test('pause 生命周期提供 updatePart 内置兜底合同', () => {
  assert.match(
    source,
    /const getFallbackLifecycleContract = \(sceneName = '', action = ''\) => \{[\s\S]*?normalizedAction === 'pause'[\s\S]*?endpoint:\s*'\/campaign\/updatePart\.json'/,
    '缺少 pause 内置兜底合同'
  );
  assert.match(
    source,
    /const fallbackContract = getFallbackLifecycleContract\(targetScene, normalizedAction\);[\s\S]*?fallbackUsed:\s*true/s,
    'getLifecycleContract 未接入 fallbackContract'
  );
});
