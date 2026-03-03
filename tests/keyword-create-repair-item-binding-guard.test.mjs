import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

test('runCreateRepairByItem 在 requestOverrides 后强制回填商品，避免空商品计划', () => {
  assert.match(
    source,
    /const ensureRepairCaseItemBinding = \(request = \{\}, itemIdText = ''\) => \{/,
    '缺少修复回归用例的商品绑定兜底函数'
  );
  assert.match(
    source,
    /if \(isPlainObject\(options\.requestOverrides\)\) \{\s*mergeDeep\(request, options\.requestOverrides\);\s*\}\s*ensureRepairCaseItemBinding\(request, targetItemId\);/,
    'runCreateRepairByItem 未在合并 requestOverrides 后强制回填商品信息'
  );
  assert.match(
    source,
    /firstPlan\.itemId = normalizedItemId;[\s\S]*?firstPlan\.item = normalizeItem\(\{[\s\S]*?materialId: normalizedItemId,[\s\S]*?itemId: normalizedItemId,[\s\S]*?materialName: `商品\$\{normalizedItemId\}`/,
    'ensureRepairCaseItemBinding 未在缺失商品时补齐默认 item'
  );
});

test('normalizePlans 支持 request.itemId/materialId 兜底补 item', () => {
  assert.match(
    source,
    /const fallbackRequestItemId = String\(toIdValue\(request\?\.itemId \|\| request\?\.materialId \|\| ''\)\)\.trim\(\);/,
    'normalizePlans 缺少 request.itemId/materialId 兜底'
  );
  assert.match(
    source,
    /else if \(fallbackRequestItemId\) \{[\s\S]*?normalized\.itemId = fallbackRequestItemId;[\s\S]*?normalized\.item = normalizeItem\(\{[\s\S]*?materialId: fallbackRequestItemId,[\s\S]*?itemId: fallbackRequestItemId,/,
    'normalizePlans 未把 request 级 itemId 回填到 plan.item'
  );
});
