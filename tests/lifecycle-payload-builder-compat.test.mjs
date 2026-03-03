import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

test('delete 生命周期提供内置兜底合同', () => {
  assert.match(
    source,
    /normalizedAction === 'delete'[\s\S]*?endpoint:\s*'\/campaign\/delete\.json'[\s\S]*?requestKeys:\s*\['campaignIdList'\]/,
    '缺少 delete 生命周期兜底合同'
  );
});

test('生命周期 payload 跳过路径键并兼容 campaignList/entityList 嵌套字段', () => {
  assert.ok(
    source.includes('if (/[.\\[\\]]/.test(key)) return;'),
    'setSimplePayloadKey 未过滤路径键，可能把 campaignList[].campaignId 直接写成非法字段'
  );
  assert.match(
    source,
    /if \(\/campaignlist\/\.test\(lower\)\) \{[\s\S]*?const row = ensureCampaignList\(\);[\s\S]*?row\.campaignId = normalizedCampaignId;/,
    '缺少 campaignList[].campaignId 的结构化兼容'
  );
  assert.match(
    source,
    /if \(\/entitylist\/\.test\(lower\)\) \{[\s\S]*?const row = ensureEntityList\(\);[\s\S]*?row\.campaignId = normalizedCampaignId;/,
    '缺少 entityList[].campaignId 的结构化兼容'
  );
});

test('delete/pause action 回填关键字段避免参数错误', () => {
  assert.match(
    source,
    /if \(normalizedAction === 'pause'\) \{[\s\S]*?payload\.onlineStatus = context\.desiredStatus;[\s\S]*?payload\.campaignId = normalizedCampaignId;/,
    'pause action 未兜底 campaignId/onlineStatus'
  );
  assert.match(
    source,
    /if \(normalizedAction === 'delete'\) \{[\s\S]*?payload\.campaignIdList = normalizedCampaignIdList\.slice\(0, 50\);/,
    'delete action 未兜底 campaignIdList'
  );
});

test('执行生命周期动作时将 action 透传给 payload 组装器', () => {
  assert.match(
    source,
    /const payload = buildLifecyclePayloadByContract\(contract,\s*\{[\s\S]*?action:\s*normalizedAction[\s\S]*?\}\);/,
    'executeLifecycleActionByContract 未透传 action，导致 action 级兜底失效'
  );
});
