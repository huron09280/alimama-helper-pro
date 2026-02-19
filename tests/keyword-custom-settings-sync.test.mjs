import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getResolveSceneSettingOverridesBlock() {
  const start = source.indexOf('const resolveSceneSettingOverrides = ({ sceneName = \'\', sceneSettings = {}, runtime = {} }) => {');
  const end = source.indexOf('const buildFallbackSolutionTemplate = (runtime, sceneName = \'\') => {', start);
  assert.ok(start > -1 && end > start, '无法定位 resolveSceneSettingOverrides 代码块');
  return source.slice(start, end);
}

function getRenderSceneDynamicConfigBlock() {
  const start = source.indexOf('const renderSceneDynamicConfig = () => {');
  const end = source.indexOf('const collectManualKeywordRowsFromPanel = (panel) => (', start);
  assert.ok(start > -1 && end > start, '无法定位 renderSceneDynamicConfig 代码块');
  return source.slice(start, end);
}

function getManualFlowToggleBlock() {
  const start = source.indexOf('if (target.matches(\'button[data-manual-keyword-flow-toggle]\')) {');
  const end = source.indexOf('if (target.matches(\'button[data-manual-keyword-batch-bid]\')) {', start);
  assert.ok(start > -1 && end > start, '无法定位流量智选切换分支');
  return source.slice(start, end);
}

function getKeywordCustomCampaignAllowListBlock() {
  const start = source.indexOf('const KEYWORD_CUSTOM_CAMPAIGN_ALLOW_KEYS = new Set([');
  const end = source.indexOf(']);', start);
  assert.ok(start > -1 && end > start, '无法定位 KEYWORD_CUSTOM_CAMPAIGN_ALLOW_KEYS');
  return source.slice(start, end);
}

test('自定义推广静态设置与提交流程已接入选品方式/冷启加速', () => {
  const renderBlock = getRenderSceneDynamicConfigBlock();
  assert.match(
    renderBlock,
    /label:\s*'选品方式'/,
    '编辑计划缺少“选品方式”按钮行'
  );
  assert.match(
    renderBlock,
    /label:\s*'冷启加速'/,
    '编辑计划缺少“冷启加速”按钮行'
  );

  const mappingBlock = getResolveSceneSettingOverridesBlock();
  assert.match(
    mappingBlock,
    /campaignColdStartVO/,
    '提交流程未放行 campaignColdStartVO 字段'
  );
  assert.match(
    mappingBlock,
    /coldStartEntry[\s\S]*campaignColdStartVO\.coldStartStatus/,
    '冷启加速未映射到 campaignColdStartVO.coldStartStatus'
  );

  const allowListBlock = getKeywordCustomCampaignAllowListBlock();
  for (const key of ['campaignColdStartVO', 'needTargetCrowd', 'aiXiaowanCrowdListSwitch', 'creativeSetMode']) {
    assert.match(
      allowListBlock,
      new RegExp(`'${key}'`),
      `关键词自定义场景提交白名单缺少字段: ${key}`
    );
  }
});

test('流量智选开关会同步到策略 useWordPackage', () => {
  const flowBlock = getManualFlowToggleBlock();
  assert.match(
    flowBlock,
    /useWordPackage\s*=\s*nextOn/,
    '流量智选切换后未写回 useWordPackage'
  );
  assert.match(
    flowBlock,
    /data-manual-keyword-flow-hidden/,
    '流量智选切换后未同步隐藏字段'
  );
});

test('自定义推广的人群设置四个按钮与提交字段一一对应', () => {
  const renderBlock = getRenderSceneDynamicConfigBlock();
  assert.match(
    renderBlock,
    /label:\s*'人群设置'[\s\S]*options:\s*\[\s*'智能人群'\s*,\s*'添加种子人群'\s*,\s*'设置优先投放客户'\s*,\s*'关闭'\s*\]/,
    '编辑计划“人群设置”未覆盖四个按钮'
  );

  const mappingBlock = getResolveSceneSettingOverridesBlock();
  assert.match(
    mappingBlock,
    /设置优先投放客户[\s\S]*aiXiaowanCrowdListSwitch',\s*'1'/,
    '“设置优先投放客户”未映射到 aiXiaowanCrowdListSwitch=1'
  );
  assert.match(
    mappingBlock,
    /添加种子人群[\s\S]*aiXiaowanCrowdListSwitch',\s*'0'/,
    '“添加种子人群”未映射到 aiXiaowanCrowdListSwitch=0'
  );
  assert.match(
    mappingBlock,
    /crowdCloseHint[\s\S]*aiXiaowanCrowdListSwitch',\s*'0'/,
    '“关闭”未映射到 aiXiaowanCrowdListSwitch=0'
  );
});

test('场景配置中的计划名称位于营销目标下方', () => {
  const renderBlock = getRenderSceneDynamicConfigBlock();
  assert.match(
    renderBlock,
    /buildGoalSelectorRow\('营销目标'[\s\S]*?staticRows\.push\(buildProxyInputRow\('计划名称'/,
    '计划名称未紧随营销目标渲染'
  );
});
