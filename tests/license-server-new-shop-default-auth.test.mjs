import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../services/license-server/index.mjs', import.meta.url), 'utf8');

test('verify 支持新店铺默认授权 3 天', () => {
    assert.match(source, /const provisionDefaultAuthForNewShop = \(payload = \{\}\) => \{/, '缺少新店铺默认授权入口');
    assert.match(
        source,
        /if \(ALLOWED_SHOP_ID_SET\.has\(shopId\) \|\| MEMORY_SHOP_STORE\.has\(shopId\)\) \{\s*return \{ applied: false \};\s*\}/,
        '缺少已存在店铺跳过默认授权保护'
    );
    assert.match(source, /if \(isShopRevoked\(shopId\)\) return \{ applied: false \};/, '缺少吊销店铺跳过默认授权保护');
    assert.match(source, /const authExpiresAt = addDaysToNowIso\(DEFAULT_AUTH_VALID_DAYS\);/, '新店铺默认授权期限未按默认天数生成');
    assert.match(source, /MEMORY_SHOP_STORE\.set\(shopId,\s*\{\s*enabled: true,[\s\S]*?authExpiresAt,[\s\S]*?\}\);/, '新店铺默认授权未写入店铺状态');
});

test('verify 在授权判断前执行新店铺默认授权', () => {
    assert.match(
        source,
        /const autoProvision = provisionDefaultAuthForNewShop\(checked\);[\s\S]*if \(!isShopAllowed\(checked\.shopId\)\)/,
        'verify 链路未在授权判定前执行新店铺默认授权'
    );
    assert.match(
        source,
        /reason: `new_shop_default_\$\{DEFAULT_AUTH_VALID_DAYS\}d`/,
        '缺少新店铺默认授权审计日志'
    );
});
