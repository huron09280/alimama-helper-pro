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

function getManualCollapseToggleBlock() {
  const start = source.indexOf('if (target.matches(\'button[data-manual-keyword-collapse-toggle]\')) {');
  const end = source.indexOf('if (target.matches(\'button[data-manual-keyword-flow-toggle]\')) {', start);
  assert.ok(start > -1 && end > start, '无法定位手动关键词展开/收起分支');
  return source.slice(start, end);
}

function getKeywordCustomCampaignAllowListBlock() {
  const start = source.indexOf('const KEYWORD_CUSTOM_CAMPAIGN_ALLOW_KEYS = new Set([');
  const end = source.indexOf(']);', start);
  assert.ok(start > -1 && end > start, '无法定位 KEYWORD_CUSTOM_CAMPAIGN_ALLOW_KEYS');
  return source.slice(start, end);
}

function extractBraceBlock(text, anchorIndex, label = '代码块') {
  const openIndex = text.indexOf('{', anchorIndex);
  assert.ok(openIndex > -1, `无法定位${label}起始大括号`);
  let depth = 0;
  for (let idx = openIndex; idx < text.length; idx += 1) {
    const ch = text[idx];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return {
          start: openIndex,
          end: idx,
          body: text.slice(openIndex + 1, idx)
        };
      }
    }
  }
  assert.fail(`无法定位${label}结束位置`);
}

function getKeywordCustomBidModeBranchesFromRenderBlock() {
  const renderBlock = getRenderSceneDynamicConfigBlock();
  const customStart = renderBlock.indexOf("if (activeKeywordGoal === '自定义推广') {");
  assert.ok(customStart > -1, '无法定位自定义推广场景渲染分支');
  const customBlock = extractBraceBlock(renderBlock, customStart, '自定义推广分支').body;
  const manualStart = customBlock.indexOf("if (keywordBidMode === 'manual') {");
  assert.ok(manualStart > -1, '自定义推广缺少手动出价分支');
  const manualBlock = extractBraceBlock(customBlock, manualStart, '手动分支');
  const elseStart = customBlock.indexOf('else {', manualBlock.end);
  assert.ok(elseStart > -1, '自定义推广缺少智能出价分支');
  const smartBlock = extractBraceBlock(customBlock, elseStart, '智能分支');
  return {
    manualBranch: manualBlock.body,
    smartBranch: smartBlock.body
  };
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

test('手动关键词面板默认收起，并支持展开状态同步', () => {
  const renderBlock = getRenderSceneDynamicConfigBlock();
  assert.match(
    renderBlock,
    /const manualKeywordPanelCollapsed = wizardState\.manualKeywordPanelCollapsed !== false;/,
    '手动关键词面板默认收起状态未定义'
  );
  assert.match(
    renderBlock,
    /data-manual-keyword-collapse-toggle="1"/,
    '手动关键词面板缺少展开\/收起按钮'
  );
  assert.match(
    renderBlock,
    /manualKeywordPanelCollapsed \? '展开' : '收起'/,
    '手动关键词面板未根据状态显示展开\/收起文案'
  );

  const collapseBlock = getManualCollapseToggleBlock();
  assert.match(
    collapseBlock,
    /wizardState\.manualKeywordPanelCollapsed = nextCollapsed;/,
    '手动关键词展开\/收起后未同步到草稿状态'
  );
  assert.match(
    collapseBlock,
    /panel\.classList\.toggle\('is-collapsed', nextCollapsed\);/,
    '手动关键词展开\/收起后未更新面板折叠样式'
  );
});

test('自定义推广手动出价启用人群弹窗并保留提交流程映射', () => {
  const { manualBranch } = getKeywordCustomBidModeBranchesFromRenderBlock();
  assert.match(
    manualBranch,
    /label:\s*'人群设置'[\s\S]*trigger:\s*'crowd'/,
    '编辑计划手动出价未启用“人群设置”弹窗'
  );
  assert.match(
    manualBranch,
    /label:\s*'人群设置'[\s\S]*title:\s*'添加精选人群'/,
    '编辑计划手动出价“人群设置”弹窗标题未对齐原生'
  );
  assert.doesNotMatch(
    manualBranch,
    /label:\s*'人群优化目标'/,
    '编辑计划手动出价仍展示“人群优化目标”'
  );

  const mappingBlock = getResolveSceneSettingOverridesBlock();
  assert.match(
    mappingBlock,
    /设置优先投放客户[\s\S]*aiXiaowanCrowdListSwitch',\s*'1'/,
    '“设置优先投放客户”未映射到 aiXiaowanCrowdListSwitch=1'
  );
  assert.match(
    mappingBlock,
    /crowdCloseHint[\s\S]*aiXiaowanCrowdListSwitch',\s*'0'/,
    '“关闭”未映射到 aiXiaowanCrowdListSwitch=0'
  );
  assert.match(
    mappingBlock,
    /const crowdTargetEntry = findSceneSettingEntry\(entries,\s*\[\/人群优化目标\/,\s*\/客户口径设置\/,\s*\/人群价值设置\//,
    '缺少人群优化目标独立映射入口'
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

test('场景配置隐藏关键词模式、默认关键词出价与推荐词目标数', () => {
  const renderBlock = getRenderSceneDynamicConfigBlock();
  assert.doesNotMatch(
    renderBlock,
    /staticRows\.push\(buildProxySelectRow\('关键词模式'/,
    '场景配置仍在展示“关键词模式”'
  );
  assert.doesNotMatch(
    renderBlock,
    /staticRows\.push\(buildProxyInputRow\('默认关键词出价'/,
    '场景配置仍在展示“默认关键词出价”'
  );
  assert.doesNotMatch(
    renderBlock,
    /staticRows\.push\(buildProxyInputRow\('推荐词目标数'/,
    '场景配置仍在展示“推荐词目标数”'
  );
});
