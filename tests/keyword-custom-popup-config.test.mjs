import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getRenderSceneDynamicConfigBlock() {
  const start = source.indexOf('const renderSceneDynamicConfig = () => {');
  const end = source.indexOf('const collectManualKeywordRowsFromPanel = (panel) => (', start);
  assert.ok(start > -1 && end > start, '无法定位 renderSceneDynamicConfig 代码块');
  return source.slice(start, end);
}

function getResolveSceneSettingOverridesBlock() {
  const start = source.indexOf('const resolveSceneSettingOverrides = ({ sceneName = \'\', sceneSettings = {}, runtime = {} }) => {');
  const end = source.indexOf('const buildFallbackSolutionTemplate = (runtime, sceneName = \'\') => {', start);
  assert.ok(start > -1 && end > start, '无法定位 resolveSceneSettingOverrides 代码块');
  return source.slice(start, end);
}

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('自定义推广已提供弹窗配置入口并绑定到 API 字段', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /data-scene-popup-trigger=/,
    '缺少弹窗触发器渲染逻辑'
  );

  for (const trigger of ['crowd', 'adzone', 'launchPeriod', 'launchArea']) {
    assert.match(
      block,
      new RegExp(`trigger:\\s*'${escapeRegExp(trigger)}'`),
      `缺少弹窗触发器配置: ${trigger}`
    );
  }

  for (const fieldKey of ['campaign.crowdList', 'adgroup.rightList', 'campaign.adzoneList', 'campaign.launchPeriodList', 'campaign.launchAreaStrList']) {
    assert.match(
      block,
      new RegExp(`const\\s+\\w+\\s*=\\s*'${escapeRegExp(fieldKey)}'`),
      `缺少弹窗字段常量声明: ${fieldKey}`
    );
  }
});

test('弹窗保存会回写隐藏字段并触发场景配置联动刷新', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /const scenePopupButtons = wizardState\.els\.sceneDynamic\.querySelectorAll\('\[data-scene-popup-trigger\]'\);/,
    '缺少弹窗按钮事件绑定'
  );
  assert.match(
    block,
    /data-scene-popup-save/,
    '缺少弹窗保存按钮'
  );
  assert.match(
    block,
    /dispatchEvent\(new Event\('input', \{ bubbles: true \}\)\)/,
    '弹窗保存后未触发 input 事件'
  );
  assert.match(
    block,
    /dispatchEvent\(new Event\('change', \{ bubbles: true \}\)\)/,
    '弹窗保存后未触发 change 事件'
  );
});

test('自定义推广允许通过 direct API 字段提交弹窗配置', () => {
  const mappingBlock = getResolveSceneSettingOverridesBlock();
  assert.match(
    mappingBlock,
    /\^campaign\\\./,
    '提交流程未覆盖 campaign.* direct 字段'
  );
  assert.match(
    mappingBlock,
    /\^adgroup\\\./,
    '提交流程未覆盖 adgroup.* direct 字段'
  );

  for (const directKey of ['adzoneList', 'launchPeriodList', 'launchAreaStrList', 'crowdList', 'rightList']) {
    assert.match(
      mappingBlock,
      new RegExp(escapeRegExp(directKey)),
      `提交流程未覆盖 direct 字段线索: ${directKey}`
    );
  }
});
