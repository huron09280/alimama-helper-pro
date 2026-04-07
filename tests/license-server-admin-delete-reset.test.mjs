import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../services/license-server/index.mjs', import.meta.url), 'utf8');

test('admin_delete 删除重置态会进入状态快照并可恢复', () => {
    assert.match(source, /const MEMORY_DELETED_SHOP_STORE = new Set\(\);/, '缺少删除重置内存集合');
    assert.match(
        source,
        /deletedShops:\s*Array\.from\(MEMORY_DELETED_SHOP_STORE\.values\(\)\)[\s\S]*\.sort\(\),/,
        '状态快照缺少 deletedShops 字段'
    );
    assert.match(
        source,
        /const deletedShops = Array\.isArray\(stores\.deletedShops\) \? stores\.deletedShops : \[\];/,
        '状态恢复缺少 deletedShops 读取'
    );
    assert.match(
        source,
        /MEMORY_DELETED_SHOP_STORE\.clear\(\);[\s\S]*nextDeletedShopIds\.forEach\(\(shopId\) => \{[\s\S]*MEMORY_DELETED_SHOP_STORE\.add\(shopId\);/,
        '状态恢复未回填删除重置集合'
    );
});

test('删除重置态会覆盖历史授权并按新店铺语义处理', () => {
    assert.match(
        source,
        /const isShopAllowed = \(shopId = ''\) => \{[\s\S]*if \(MEMORY_DELETED_SHOP_STORE\.has\(normalizedShopId\)\) return false;[\s\S]*if \(MEMORY_SHOP_STORE\.has\(normalizedShopId\)\) \{/,
        'isShopAllowed 未优先处理删除重置态'
    );
    assert.match(
        source,
        /const isShopRevoked = \(shopId = ''\) => \{[\s\S]*if \(MEMORY_DELETED_SHOP_STORE\.has\(normalizedShopId\)\) return false;/,
        'isShopRevoked 未忽略删除重置店铺'
    );
    assert.match(source, /const wasDeleted = MEMORY_DELETED_SHOP_STORE\.has\(shopId\);/, '新店默认授权缺少删除重置识别');
    assert.match(
        source,
        /if \(\(ALLOWED_SHOP_ID_SET\.has\(shopId\) && !wasDeleted\) \|\| MEMORY_SHOP_STORE\.has\(shopId\)\) \{\s*return \{ applied: false \};\s*\}/,
        '删除重置店铺仍被环境白名单短路'
    );
    assert.match(
        source,
        /if \(wasDeleted\) \{\s*MEMORY_DELETED_SHOP_STORE\.delete\(shopId\);\s*\}/,
        '删除重置店铺命中默认授权后未解除重置态'
    );
});

test('admin_delete 与后续管理动作会维护删除重置态', () => {
    assert.match(source, /const clearNonceReplayCacheByShopId = \(shopId = ''\) => \{/, '缺少按店铺清理 nonce 缓存函数');
    assert.match(
        source,
        /MEMORY_DELETED_SHOP_STORE\.delete\(shopId\);[\s\S]*writeAuditLog\(\{ shopId, action: 'admin_allow'/,
        'admin_allow 未解除删除重置态'
    );
    assert.match(
        source,
        /MEMORY_DELETED_SHOP_STORE\.add\(shopId\);[\s\S]*const removed = \{[\s\S]*deleted: true,[\s\S]*nonceReplay: clearNonceReplayCacheByShopId\(shopId\)/,
        'admin_delete 未写入删除重置态或清理 nonce'
    );
    assert.match(source, /deleted:\s*\{\s*memory:\s*deletedMemory\s*\}/, 'admin/state 缺少 deleted.memory 输出');
});
