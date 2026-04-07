import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function extractNormalizePlans() {
  const start = source.indexOf('const normalizePlans = (request, preferredItems, options = {}) => {');
  const end = source.indexOf('const applyOverrides =', start);
  assert.ok(start > -1 && end > start, '无法定位 normalizePlans 代码块');
  const fnSource = source
    .slice(start, end)
    .trim()
    .replace(/^const normalizePlans = /, '')
    .replace(/;\s*$/, '');
  const normalizeBidMode = (value, fallback) => String(value || fallback || '').trim() || 'smart';
  const toIdValue = (value) => value === undefined || value === null ? '' : String(value).trim();
  const toNumber = (value, fallback) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  };
  const resolvePlanNamePrefix = (request = {}) => String(request.planNamePrefix || request.sceneName || '计划').trim() || '计划';
  const normalizeItem = (item = {}) => {
    const materialId = String(item.materialId || item.itemId || '').trim();
    return {
      materialId,
      itemId: materialId,
      materialName: String(item.materialName || item.itemName || '').trim()
    };
  };
  const isPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
  const deepClone = (value) => value === undefined ? value : JSON.parse(JSON.stringify(value));
  return Function(
    'normalizeBidMode',
    'toIdValue',
    'toNumber',
    'resolvePlanNamePrefix',
    'normalizeItem',
    'isPlainObject',
    'deepClone',
    `return (${fnSource});`
  )(normalizeBidMode, toIdValue, toNumber, resolvePlanNamePrefix, normalizeItem, isPlainObject, deepClone);
}

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
    /const allowRequestItemFallback = !!fallbackRequestItemId && plans\.length <= 1;/,
    'normalizePlans 未限制 request.itemId 仅用于单计划兜底'
  );
  assert.match(
    source,
    /else if \(allowRequestItemFallback\) \{[\s\S]*?normalized\.itemId = fallbackRequestItemId;[\s\S]*?normalized\.item = normalizeItem\(\{[\s\S]*?materialId: fallbackRequestItemId,[\s\S]*?itemId: fallbackRequestItemId,/,
    'normalizePlans 未在单计划场景回填 request 级 itemId'
  );
});

test('normalizePlans 不会在多计划场景用同一个 request.itemId 批量回填商品', () => {
  const normalizePlans = extractNormalizePlans();
  const droppedPlans = [];
  const plans = normalizePlans({
    planNamePrefix: '批量建计划',
    itemId: '70001',
    plans: [
      { planName: '计划_A' },
      { planName: '计划_B' }
    ]
  }, [], {
    requiresItem: true,
    onDroppedPlan: (plan) => droppedPlans.push(plan)
  });

  assert.equal(plans.length, 0, '多计划不应由 request.itemId 批量补齐为同一商品');
  assert.equal(droppedPlans.length, 2, '多计划缺商品应全部进入 dropped 上报');
});

test('normalizePlans 支持 plan.materialId 直接补齐 item', () => {
  const normalizePlans = extractNormalizePlans();
  const plans = normalizePlans({
    planNamePrefix: '批量建计划',
    plans: [
      {
        planName: '计划_A',
        materialId: '60001',
        itemName: '测试商品'
      }
    ]
  }, [], { requiresItem: true });

  assert.equal(plans.length, 1, 'plan.materialId 不应被静默过滤');
  assert.equal(plans[0].itemId, '60001');
  assert.deepEqual(plans[0].item, {
    materialId: '60001',
    itemId: '60001',
    materialName: '测试商品'
  });
});

test('normalizePlans 在缺商品且无法补齐时通过 onDroppedPlan 上报，避免静默吞计划', () => {
  const normalizePlans = extractNormalizePlans();
  const droppedPlans = [];
  const plans = normalizePlans({
    planNamePrefix: '批量建计划',
    plans: [{ planName: '计划_A' }]
  }, [], {
    requiresItem: true,
    onDroppedPlan: (plan) => droppedPlans.push(plan)
  });

  assert.equal(plans.length, 0, '缺商品计划应继续被过滤');
  assert.equal(droppedPlans.length, 1, '被过滤计划应被上报');
  assert.equal(droppedPlans[0].planName, '计划_A');
  assert.match(String(droppedPlans[0].error || ''), /缺少商品参数/);
});

test('normalizePlans 在自动建计划场景下将 planCount 作为 preferredItems 的上限', () => {
  const normalizePlans = extractNormalizePlans();
  const preferredItems = [
    { materialId: '101', materialName: '商品A' },
    { materialId: '102', materialName: '商品B' },
    { materialId: '103', materialName: '商品C' }
  ];
  const plans = normalizePlans({
    planNamePrefix: '批量建计划',
    planCount: 2
  }, preferredItems, { requiresItem: true });

  assert.equal(plans.length, 2);
  assert.equal(plans[0].item?.materialId, '101');
  assert.equal(plans[1].item?.materialId, '102');
});

test('normalizePlans 未显式提供 planCount 时保持 preferredItems 全量映射', () => {
  const normalizePlans = extractNormalizePlans();
  const preferredItems = [
    { materialId: '201', materialName: '商品A' },
    { materialId: '202', materialName: '商品B' },
    { materialId: '203', materialName: '商品C' }
  ];
  const plans = normalizePlans({
    planNamePrefix: '批量建计划'
  }, preferredItems, { requiresItem: true });

  assert.equal(plans.length, 3);
});

test('normalizePlans 在自动建计划且 planCount 非法时按兼容规则钳制为 1', () => {
  const normalizePlans = extractNormalizePlans();
  const preferredItems = [
    { materialId: '301', materialName: '商品A' },
    { materialId: '302', materialName: '商品B' }
  ];
  const plans = normalizePlans({
    planNamePrefix: '批量建计划',
    planCount: 0
  }, preferredItems, { requiresItem: true });

  assert.equal(plans.length, 1);
  assert.equal(plans[0].item?.materialId, '301');
});
