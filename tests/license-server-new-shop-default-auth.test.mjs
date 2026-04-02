import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../services/license-server/index.mjs', import.meta.url), 'utf8');

test('新店默认授权开关默认关闭且可配置开启', () => {
    assert.match(
        source,
        /const AUTO_PROVISION_NEW_SHOP_ENABLED = resolveBooleanEnv\(process\.env\.AM_LICENSE_AUTO_PROVISION_NEW_SHOP,\s*false\);/,
        '缺少新店自动授权开关，或默认值不是 false'
    );
    assert.match(source, /const provisionDefaultAuthForNewShop = \(payload = \{\}\) => \{/, '缺少新店铺默认授权入口');
    assert.match(source, /if \(!AUTO_PROVISION_NEW_SHOP_ENABLED\) return \{ applied: false, reason: 'disabled' \};/, '缺少新店自动授权开关保护');
    assert.match(
        source,
        /if \(ALLOWED_SHOP_ID_SET\.has\(shopId\) \|\| MEMORY_SHOP_STORE\.has\(shopId\)\) \{\s*return \{ applied: false \};\s*\}/,
        '缺少已存在店铺跳过默认授权保护'
    );
    assert.match(source, /if \(isShopRevoked\(shopId\)\) return \{ applied: false \};/, '缺少吊销店铺跳过默认授权保护');
    assert.match(source, /const authExpiresAt = addDaysToNowIso\(DEFAULT_AUTH_VALID_DAYS\);/, '新店铺默认授权期限未按默认天数生成');
    assert.match(source, /MEMORY_SHOP_STORE\.set\(shopId,\s*\{\s*enabled: true,[\s\S]*?authExpiresAt,[\s\S]*?\}\);/, '新店铺默认授权未写入店铺状态');
});

test('verify 链路仍保留自动授权入口并仅在命中时写审计', () => {
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
