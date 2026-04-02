import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../services/license-server/index.mjs', import.meta.url), 'utf8');

test('verify 启用时间窗与 nonce 防重放', () => {
    assert.match(
        source,
        /const VERIFY_TIMESTAMP_DRIFT_MS = resolvePositiveInt\(process\.env\.AM_LICENSE_VERIFY_TIMESTAMP_DRIFT_MS,\s*60 \* 1000\);/,
        '缺少 timestamp 漂移窗口配置'
    );
    assert.match(
        source,
        /const NONCE_WINDOW_MS = resolvePositiveInt\(process\.env\.AM_LICENSE_NONCE_WINDOW_MS,\s*5 \* 60 \* 1000\);/,
        '缺少 nonce 窗口配置'
    );
    assert.match(source, /const VERIFY_NONCE_CACHE = new Map\(\);/, '缺少 nonce 防重放缓存');
    assert.match(source, /const checkVerifyReplayGuard = \(\{ shopId, nonce, timestamp \}\) => \{/, '缺少防重放校验函数');
    assert.match(source, /code: 'timestamp_out_of_window'/, '缺少 timestamp 超窗错误码');
    assert.match(source, /code: 'nonce_replayed'/, '缺少 nonce 重放错误码');
    assert.match(source, /const replayChecked = checkVerifyReplayGuard\(\{ shopId, nonce, timestamp \}\);/, 'verify payload 未接入防重放校验');
});

test('管理接口要求显式配置管理员 token', () => {
    assert.match(
        source,
        /if \(!ADMIN_TOKEN\) \{\s*return \{[\s\S]*code: 'admin_token_not_configured'/,
        'ADMIN_TOKEN 未配置时未拒绝管理接口'
    );
    assert.match(source, /statusCode: 503/, 'ADMIN_TOKEN 未配置缺少 503 状态码');
});

test('verify 返回服务端签发 policy token', () => {
    assert.match(
        source,
        /const POLICY_SIGN_KEY = createPolicySignKey\(\{\s*rawPem: process\.env\.AM_LICENSE_POLICY_PRIVATE_KEY_PEM \|\| '',\s*rawPemBase64: process\.env\.AM_LICENSE_POLICY_PRIVATE_KEY_BASE64 \|\| ''\s*\}\);/,
        '缺少 policy 私钥加载'
    );
    assert.match(source, /const createPolicyToken = \(\{ shopId, leaseToken, expiresAt, buildId, buildChannel \}\) => \{/, '缺少 policy token 签发函数');
    assert.match(source, /const policyToken = createPolicyToken\(\{[\s\S]*shopId: checked\.shopId,[\s\S]*buildChannel: checked\.buildChannel[\s\S]*\}\);/, 'verify 未生成 policy token');
    assert.match(source, /token:\s*policyToken/, 'verify 响应 policy 缺少 token 字段');
    assert.match(source, /dsaEncoding:\s*'ieee-p1363'/, 'policy token 签名未使用 P-256 原始签名编码');
});
