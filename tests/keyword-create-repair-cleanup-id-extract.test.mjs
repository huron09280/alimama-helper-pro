import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

const sliceSource = (startNeedle, endNeedle) => {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `缺少源码片段起点：${startNeedle}`);
  const end = source.indexOf(endNeedle, start);
  assert.notEqual(end, -1, `缺少源码片段终点：${endNeedle}`);
  return source.slice(start, end);
};

test('创建响应支持从 planId/id 回填 campaignId，错误明细不误当成功 ID', () => {
  assert.match(
    source,
    /const CREATE_RESPONSE_CAMPAIGN_ID_KEYS = \['campaignId', 'planId', 'id', 'bpCampaignId', 'targetCampaignId'\];/,
    '缺少创建响应主键回填映射'
  );
  assert.match(
    source,
    /const createdCampaignId = pickCreateCampaignIdFromNode\(created\);[\s\S]*?const detailCampaignId = pickCreateCampaignIdFromNode\(isPlainObject\(detail\?\.result\) \? detail\.result : detail\);[\s\S]*?const rootCampaignId = entries\.length === 1 \? pickCreateCampaignIdFromNode\(res\?\.data \|\| \{\}\) : '';[\s\S]*?const campaignId = createdCampaignId[\s\S]*?\|\| \(!detailHasError \? \(detailCampaignId \|\| rootCampaignId\) : ''\);/,
    'parseAddListOutcome 未补齐 campaignId 回填链路'
  );
  assert.match(
    source,
    /const detailCode = String\(detail\?\.code \|\| ''\)\.trim\(\);[\s\S]*?const detailMsg = String\(detail\?\.msg \|\| detail\?\.message \|\| detail\?\.errorMsg \|\| ''\)\.trim\(\);[\s\S]*?if \(detailCode \|\| detailMsg\) return;/,
    '创建结果 ID 提取不应从带错误码/错误文案的 errorDetails 回填 campaignId'
  );
});

test('runCreateRepairByItem 用统一 ID 提取结果驱动清理记录', () => {
  assert.match(
    source,
    /const extractCreatedCampaignIdsFromCreateResult = \(result = \{\}\) => \{[\s\S]*?rawResponses\.forEach\(\(res\) => collectCreateCampaignIdsFromResponse\(res, out\)\);[\s\S]*?return uniqueBy\(out, id => id\);/,
    '缺少创建结果 ID 归并提取器'
  );
  assert.match(
    source,
    /const successCampaignIds = extractCreatedCampaignIdsFromCreateResult\(runResult\);[\s\S]*?successCampaignIds\.forEach\(campaignId => \{[\s\S]*?createdRecords\.push\(\{/,
    'runCreateRepairByItem 未用提取结果写入 createdRecords'
  );
});

test('风控提醒覆盖 pushState/replaceState 路由切换', () => {
  const stateBlock = sliceSource('const State = {', 'const RISK_CHALLENGE_URL_RE');
  const riskAlertBlock = sliceSource('const clearRiskChallengeAlertTimer = () => {', 'const notifyRiskChallengeIfNeeded');
  const notifyBlock = sliceSource(
    'const notifyRiskChallengeIfNeeded = (url = \'\') => {',
    '    // ==========================================\n    // 2. 日志系统'
  );

  assert.match(
    source,
    /hookHistoryMethod\('pushState'\);[\s\S]*hookHistoryMethod\('replaceState'\);/,
    '缺少 pushState/replaceState 风控提醒触发'
  );
  assert.ok(
    stateBlock.includes("riskAlertLastUrl: '',\n        riskAlertTimer: 0,"),
    '风控提醒应在 State 中登记 pending alert timer 句柄'
  );
  assert.ok(
    riskAlertBlock.includes('clearTimeout(State.riskAlertTimer);')
      && riskAlertBlock.includes('State.riskAlertTimer = 0;'),
    '风控提醒应提供可复用 timer 清理 helper'
  );
  assert.ok(
    riskAlertBlock.includes('clearRiskChallengeAlertTimer();')
      && riskAlertBlock.includes('State.riskAlertTimer = setTimeout(() => {')
      && riskAlertBlock.includes('State.riskAlertTimer = 0;')
      && riskAlertBlock.includes("const currentHref = String(window.location.href || '').trim();")
      && riskAlertBlock.includes('if (currentHref !== href) return;')
      && riskAlertBlock.includes('if (State.riskAlertLastUrl !== href) return;')
      && riskAlertBlock.includes('if (!isRiskChallengePage(currentHref)) return;')
      && riskAlertBlock.includes("alert('检测到阿里妈妈风控页，请先手动完成人机验证（滑块/短信/扫码）后再继续操作。');"),
    '风控提醒 alert 应通过可取消 helper 调度，触发前复核当前 URL'
  );
  assert.ok(
    notifyBlock.includes('if (!isRiskChallengePage(href)) {')
      && notifyBlock.includes("State.riskAlertLastUrl = '';")
      && notifyBlock.includes('clearRiskChallengeAlertTimer();')
      && notifyBlock.includes('return false;')
      && notifyBlock.includes("Logger.warn('⚠️ 检测到阿里妈妈风控页，请手动完成人机验证后继续');")
      && notifyBlock.includes('scheduleRiskChallengeAlert(href);'),
    '离开风控页时应释放 pending alert，进入风控页时应复用调度 helper'
  );
  assert.ok(
    riskAlertBlock.includes("alert('检测到阿里妈妈风控页，请先手动完成人机验证（滑块/短信/扫码）后再继续操作。');"),
    '缺少风控页弹窗提醒文案'
  );
  assert.equal(
    notifyBlock.includes('setTimeout(() => {'),
    false,
    '风控提醒不应继续在 notifyRiskChallengeIfNeeded 内排无句柄 alert timeout'
  );
});

test('关键词定制场景裁剪阶段补齐 materialName 兜底，避免空商品计划', () => {
  assert.match(
    source,
    /const fallbackMaterialName = `商品\$\{item\.itemId \|\| item\.materialId \|\| ''\}`;\s*const materialName = String\(item\.materialName \|\| ''\)\.trim\(\) \|\| fallbackMaterialName;/,
    'pruneKeywordAdgroupForCustomScene 缺少 materialName 兜底'
  );
  assert.match(
    source,
    /out\.material = pickMaterialFields\(mergeDeep\(input\.material \|\| \{\}, \{[\s\S]*?materialName,[\s\S]*?\}\)\);/,
    'pruneKeywordAdgroupForCustomScene 未使用兜底后的 materialName'
  );
});

test('人群/推荐素材列表统一补齐 materialName 兜底，避免空商品展示', () => {
  assert.match(
    source,
    /const resolvedMaterialName = String\(item\?\.materialName \|\| item\?\.name \|\| ''\)\.trim\(\) \|\| `商品\$\{materialId\}`;/,
    '素材列表归一化缺少 materialName 兜底'
  );
  assert.match(
    source,
    /\? \[\{ materialId: fallbackId, materialName: `商品\$\{fallbackId\}` \}\]/,
    '默认同步商品兜底仍可能产出空 materialName'
  );
});
