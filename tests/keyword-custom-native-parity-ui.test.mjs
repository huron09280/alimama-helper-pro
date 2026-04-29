import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getKeywordCustomSceneBlock() {
  const start = source.indexOf("if (activeKeywordGoal === '自定义推广') {");
  const end = source.indexOf("if (sceneName === '货品全站推广') {", start);
  assert.ok(start > -1 && end > start, '无法定位关键词自定义推广场景配置代码块');
  return source.slice(start, end);
}

function getResolveSceneSettingOverridesBlock() {
  const start = source.indexOf("const resolveSceneSettingOverrides = ({ sceneName = '', sceneSettings = {}, runtime = {} }) => {");
  const end = source.indexOf("const buildFallbackSolutionTemplate = (runtime, sceneName = '') => {", start);
  assert.ok(start > -1 && end > start, '无法定位 resolveSceneSettingOverrides 代码块');
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

function getKeywordCustomBidModeBranches() {
  const customBlock = getKeywordCustomSceneBlock();
  const manualMarker = "if (keywordBidMode === 'manual') {";
  const manualStart = customBlock.indexOf(manualMarker);
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

test('关键词自定义推广隐藏选品方式配置项', () => {
  const block = getKeywordCustomSceneBlock();
  assert.doesNotMatch(
    block,
    /label:\s*'选品方式'/,
    '自定义推广分支仍展示“选品方式”配置项'
  );
  assert.doesNotMatch(
    block,
    /options:\s*\[\s*'自定义选品'\s*,\s*'好货快投-大家电专享'\s*\]/,
    '自定义推广分支仍展示“选品方式”选项'
  );
});

test('关键词自定义推广隐藏无效创意设置分段按钮', () => {
  const block = getKeywordCustomSceneBlock();
  assert.doesNotMatch(
    block,
    /label:\s*'创意设置'/,
    '关键词自定义推广仍在展示“创意设置”按钮组'
  );
});

test('关键词自定义推广智能出价展示人群优化目标面板并保留 crowd 开关映射兼容', () => {
  const { smartBranch } = getKeywordCustomBidModeBranches();
  assert.match(
    smartBranch,
    /buildKeywordSmartCrowdTargetPanelRow\(/,
    '自定义推广智能出价分支缺少“人群优化目标”同构面板'
  );
  assert.match(
    smartBranch,
    /targetFieldKey:\s*keywordCrowdTargetFieldKey[\s\S]*campaignFieldKey:\s*crowdCampaignField/,
    '人群优化目标面板未绑定目标字段与 campaign.crowdList'
  );

  const mappingBlock = getResolveSceneSettingOverridesBlock();
  assert.match(
    mappingBlock,
    /const crowdTargetEntry = findSceneSettingEntry\(entries,\s*\[\/人群优化目标\/,\s*\/客户口径设置\/,\s*\/人群价值设置\//,
    '提交流程未识别“人群优化目标”'
  );
});

test('关键词自定义推广智能出价人群设置复刻原生 checkbox 结构', () => {
  const { smartBranch } = getKeywordCustomBidModeBranches();
  assert.match(
    smartBranch,
    /buildKeywordSmartCrowdPriorityRow\(/,
    '智能出价人群设置未切到原生 checkbox 行渲染'
  );
  assert.match(
    smartBranch,
    /helpText:\s*'智能出价方式下，可通过人群设置，提高特定客户的投放权重。特别的，价值设置用于调整算法的出价系数，并不等于最终的出价。'/,
    '智能出价人群设置缺少原生提示文案'
  );
  assert.match(
    smartBranch,
    /description:\s*'支持对特定客户设置更高权重，进行优先获取。'/,
    '智能出价人群设置缺少原生说明文案'
  );
  assert.match(
    smartBranch,
    /detailUrl:\s*'https:\/\/alidocs\.dingtalk\.com\/i\/nodes\/Y1OQX0akWmzdBowLFk0vRgKlVGlDd3mE'/,
    '智能出价人群设置缺少原生“了解详情”跳转'
  );
  assert.doesNotMatch(
    smartBranch,
    /options:\s*\[\s*'设置优先投放客户'\s*,\s*'关闭'\s*\]/,
    '智能出价人群设置仍在使用旧的分段按钮结构'
  );
});

test('关键词自定义推广增加点击量默认目标成本为0.5，且不覆盖手动清空', () => {
  const { smartBranch } = getKeywordCustomBidModeBranches();
  assert.match(
    smartBranch,
    /const keywordAvgClickCostTouched = !!\([\s\S]*touchedBucket\[keywordAvgClickCostFieldKey\][\s\S]*touchedBucket\[keywordAvgClickCostFieldLabel\][\s\S]*\);/,
    '增加点击量目标成本缺少手动编辑保护判断'
  );
  assert.match(
    smartBranch,
    /if \(!keywordAvgClickCostValue && !keywordAvgClickCostTouched\) \{[\s\S]*keywordAvgClickCostValue = '0\.5';[\s\S]*\}/,
    '增加点击量目标成本未默认回填 0.5'
  );
});

test('关键词自定义推广手动出价展示原生人群弹窗入口并隐藏人群优化目标', () => {
  const { manualBranch } = getKeywordCustomBidModeBranches();
  assert.match(
    manualBranch,
    /label:\s*'人群设置'[\s\S]*?trigger:\s*'crowd'/,
    '自定义推广手动出价缺少“人群设置”弹窗入口'
  );
  assert.match(
    manualBranch,
    /label:\s*'人群设置'[\s\S]*?title:\s*'添加精选人群'/,
    '手动出价“人群设置”弹窗标题未对齐原生“添加精选人群”'
  );
  assert.doesNotMatch(
    manualBranch,
    /label:\s*'人群优化目标'/,
    '手动出价仍展示无效“人群优化目标”配置'
  );
  assert.match(
    manualBranch,
    /label:\s*'投放资源位\/投放地域\/分时折扣'/,
    '手动出价缺少原生“投放资源位/投放地域/分时折扣”组合设置'
  );
});

test('关键词自定义推广出价目标过滤掉卡位目标，仅保留原生目标集合', () => {
  assert.match(
    source,
    /const keywordCustomBidTargetAllowedValues = \['conv', 'similar_item', 'market_penetration', 'fav_cart', 'click', 'roi'\];/,
    '自定义推广“出价目标”白名单常量缺失'
  );
  assert.match(
    source,
    /allowedValues:\s*activeKeywordGoal === '自定义推广'[\s\S]*\?\s*keywordCustomBidTargetAllowedValues[\s\S]*:\s*\(activeKeywordGoal === '趋势明星' \? keywordTrendBidTargetAllowedValues : \[\]\)/,
    '自定义推广“出价目标”未在编辑面板启用白名单过滤'
  );
  assert.doesNotMatch(
    source,
    /keywordCustomBidTargetAllowedValues[\s\S]*'search_rank'/,
    '自定义推广“出价目标”错误包含卡位目标 search_rank'
  );
});

test('关键词自定义推广编辑计划不依赖未定义 runtime 变量', () => {
  const customBlock = getKeywordCustomSceneBlock();
  assert.doesNotMatch(
    customBlock,
    /runtime\?\.storeData\?\.needTargetCrowd|runtime\?\.solutionTemplate\?\.campaign\?\.needTargetCrowd/,
    '自定义推广场景渲染仍依赖未定义 runtime，编辑计划会报错'
  );
  assert.match(
    customBlock,
    /isCrowdTargetEnabled\s*=\s*!\/\^\(0\|false\|off\|关闭\|否\)\$\/i\.test/,
    '人群优化目标开关对“关闭”值识别不完整'
  );
});
