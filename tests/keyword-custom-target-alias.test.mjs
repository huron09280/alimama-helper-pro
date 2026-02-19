import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getBuildRequestBlock() {
  const start = source.indexOf('const buildRequestFromWizard = () => {');
  assert.ok(start > -1, '无法定位 buildRequestFromWizard');
  const end = source.indexOf('const buildSceneRequestsFromWizard = (request = {}) => {', start);
  assert.ok(end > start, '无法定位 buildSceneRequestsFromWizard');
  return source.slice(start, end);
}

test('关键词自定义推广智能出价会将市场渗透/收藏加购目标转换为平台可落库目标码', () => {
  const block = getBuildRequestBlock();
  assert.match(
    block,
    /const strategySubmitBidTargetV2 = resolveKeywordCustomBidTargetAlias\(strategyBidTargetV2,\s*strategyMarketingGoal\);/,
    '缺少关键词自定义推广目标码别名映射调用'
  );
  assert.match(
    block,
    /if \(strategyBidMode === 'smart'\) \{[\s\S]*campaignOverride\.bidTargetV2 = strategySubmitBidTargetV2;[\s\S]*campaignOverride\.optimizeTarget = strategySubmitBidTargetV2;/,
    '智能出价分支未使用映射后的目标码提交'
  );
});

test('关键词自定义推广目标码别名映射包含收藏加购与市场渗透', () => {
  assert.match(
    source,
    /const resolveKeywordCustomBidTargetAlias = \(bidTarget = '', marketingGoal = ''\) => \{[\s\S]*if \(value === 'fav_cart'\) return 'coll_cart';[\s\S]*if \(value === 'market_penetration'\) return 'word_penetration_rate';[\s\S]*\};/,
    '缺少 fav_cart/market_penetration 到 coll_cart/word_penetration_rate 的映射实现'
  );
});
