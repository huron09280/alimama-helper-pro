import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/entries/extension-license-guard.js', import.meta.url), 'utf8');

test('授权守卫引入 policy token 验签能力', () => {
    assert.match(source, /const POLICY_TOKEN_PUBLIC_KEY_PEM = \[/, '缺少 policy token 公钥常量');
    assert.match(source, /const importPolicyPublicKey = async \(\) => \{/, '缺少 policy token 公钥导入逻辑');
    assert.match(source, /const verifyPolicyToken = async \(shopId = '', normalizedResult = \{\}\) => \{/, '缺少 policy token 验签逻辑');
    assert.match(source, /policy_token_signature_invalid/, '缺少 policy token 验签失败错误码');
    assert.match(source, /policy_token_build_mismatch/, '缺少 policy token 构建信息绑定校验');
});

test('本地缓存命中时必须先通过 policy token 验签', () => {
    assert.match(source, /const cachePolicyToken = String\(cache\?\.policyToken \|\| cache\?\.policy\?\.token \|\| ''\)\.trim\(\);/, '缓存未读取 policy token');
    assert.match(source, /await verifyPolicyToken\(shopInfo\.shopId,\s*\{\s*leaseToken:\s*cacheLeaseToken,[\s\S]*policyToken:\s*cachePolicyToken[\s\S]*\}\);/, '缓存命中未执行 policy token 验签');
    assert.match(source, /writeCache\(null\);/, '缓存验签失败后未清空缓存');
    assert.match(source, /policyToken:\s*normalized\.policyToken \|\| ''/, '授权成功后未持久化 policy token');
});

test('extension 模式改为按需校验，不在空闲时后台轮询', () => {
    assert.match(source, /if \(resolveRuntimeMode\(\) === 'extension'\) return;/, 'extension 仍在后台调度续租/过期检查');
    assert.match(source, /const installOnDemandVerifyHooks = \(\) => \{/, '缺少按需校验安装逻辑');
    assert.match(source, /triggerOnDemandVerify\('on_demand_pointerdown'\);/, '点击插件 UI 未触发按需校验');
    assert.match(source, /if \(resolveRuntimeMode\(\) === 'extension'\) \{\s*installOnDemandVerifyHooks\(\);/s, 'extension 启动未切换到按需校验模式');
});
