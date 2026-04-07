import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

test('显式 itemIdList 在能力误判场景下不被强制删除', () => {
    assert.match(
        source,
        /if \(!sceneCapabilities\.hasItemIdList && hasOwn\(merged\.campaign, 'itemIdList'\)\) \{[\s\S]*?if \(!hasExplicitCampaignField\('itemIdList'\)\) \{[\s\S]*?delete merged\.campaign\.itemIdList;/,
        'itemIdList 删除分支缺少显式字段保护'
    );
});

test('显式 bidTargetV2\/optimizeTarget 在兜底裁剪分支不被误删', () => {
    assert.match(
        source,
        /const explicitBidTargetV2 = hasExplicitCampaignField\('bidTargetV2'\);/,
        '缺少显式 bidTargetV2 检测'
    );
    assert.match(
        source,
        /if \(!supportsBidTargetFields \|\| !bidTarget\) \{[\s\S]*?if \(!explicitBidTargetV2\) \{[\s\S]*?delete merged\.campaign\.bidTargetV2;[\s\S]*?\}[\s\S]*?if \(!keepOptimizeTarget && !explicitOptimizeTarget\) \{[\s\S]*?delete merged\.campaign\.optimizeTarget;/,
        'bidTargetV2/optimizeTarget 删除分支缺少显式字段保护'
    );
});
