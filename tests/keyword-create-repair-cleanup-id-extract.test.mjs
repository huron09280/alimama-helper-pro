import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

test('创建响应支持从 planId/id/errorDetails 回填 campaignId', () => {
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
  assert.match(
    source,
    /hookHistoryMethod\('pushState'\);[\s\S]*hookHistoryMethod\('replaceState'\);/,
    '缺少 pushState/replaceState 风控提醒触发'
  );
  assert.match(
    source,
    /alert\('检测到阿里妈妈风控页，请先手动完成人机验证（滑块\/短信\/扫码）后再继续操作。'\);/,
    '缺少风控页弹窗提醒文案'
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
