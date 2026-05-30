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
    assert.match(
        source,
        /const normalized = verifyLeasePayloadShape\(json, payload\);[\s\S]*await verifySignature\(payload, normalized\);[\s\S]*await verifyPolicyToken\(payload\.shopId, normalized\);[\s\S]*return normalized;/,
        '远端授权响应未强制执行 policy token 验签'
    );
    assert.doesNotMatch(
        source,
        /if \(normalized\.policyToken\) \{\s*await verifyPolicyToken\(payload\.shopId, normalized\);/s,
        '远端授权响应仍允许缺失 policy token 时跳过验签'
    );
});

test('extension 运行态授权请求通过 background 桥转发', () => {
    assert.match(source, /const EXTENSION_VERIFY_BRIDGE_CHANNEL = 'am-helper-pro:license-verify';/, '缺少 extension 授权桥 channel 常量');
    assert.match(source, /const EXTENSION_VERIFY_BRIDGE_TIMEOUT_MS = 12 \* 1000;/, '缺少 extension 授权桥超时配置');
    assert.match(source, /const requestVerifyViaExtensionBridge = async \(payload\) => \{/, '缺少 extension 授权桥请求函数');
    assert.match(source, /window\.postMessage\(\{\s*channel: EXTENSION_VERIFY_BRIDGE_CHANNEL,\s*type: EXTENSION_VERIFY_BRIDGE_REQUEST_TYPE,\s*requestId,\s*payload\s*\}, window\.location\?\.origin \|\| '\*'\);/, 'extension 授权桥未通过 postMessage 发起请求');
    assert.match(source, /finishReject\(createError\('request_failed', '授权请求失败: extension_bridge_timeout'\)\);/, 'extension 授权桥超时未归类为 request_failed');
    assert.match(
        source,
        /if \(resolveRuntimeMode\(\) === 'extension'\) \{\s*const bridgeResult = await requestVerifyViaExtensionBridge\(payload\);[\s\S]*const normalized = verifyLeasePayloadShape\(bridgeResult, payload\);[\s\S]*await verifySignature\(payload, normalized\);[\s\S]*await verifyPolicyToken\(payload\.shopId, normalized\);[\s\S]*return normalized;\s*\}/,
        'extension 运行态未优先走 background 桥，或未保留签名与 policy token 验签'
    );
});

test('本地缓存命中时必须先通过 policy token 验签', () => {
    assert.match(source, /const cachePolicyToken = String\(cache\?\.policyToken \|\| cache\?\.policy\?\.token \|\| ''\)\.trim\(\);/, '缓存未读取 policy token');
    assert.match(source, /await verifyPolicyToken\(shopInfo\.shopId,\s*\{\s*leaseToken:\s*cacheLeaseToken,[\s\S]*policyToken:\s*cachePolicyToken[\s\S]*\}\);/, '缓存命中未执行 policy token 验签');
    assert.match(source, /writeCache\(null\);/, '缓存验签失败后未清空缓存');
    assert.match(source, /policyToken:\s*normalized\.policyToken \|\| ''/, '授权成功后未持久化 policy token');
});

test('extension 模式从有效缓存恢复授权并静默续租', () => {
    assert.match(source, /const resolveValidCachedLeaseSnapshot = \(cache = null\) => \{[\s\S]*parsePolicyToken\(policyToken\)[\s\S]*tokenShopId !== shopId[\s\S]*tokenLeaseToken !== leaseToken[\s\S]*tokenExpiresAt !== expiresAt[\s\S]*tokenBuildId !== String\(BUILD_ID \|\| ''\)/, '缺少本地有效租约缓存形状校验');
    assert.match(source, /const hydrateCurrentLeaseFromCache = \(source = 'license_cache_hydrate'\) => \{[\s\S]*resolveValidCachedLeaseSnapshot\(readCache\(\)\)[\s\S]*unlock\(\{[\s\S]*source,[\s\S]*shopId: cached\.shopId,[\s\S]*expiresAt: cached\.expiresAt,[\s\S]*leaseToken: cached\.leaseToken/s, 'extension 启动未从有效缓存恢复内存授权态');
    assert.match(source, /const isExtensionRuntime = resolveRuntimeMode\(\) === 'extension';[\s\S]*if \(remainingMs > 0\) \{[\s\S]*source: 'lease_renew'[\s\S]*if \(isExtensionRuntime\) return;[\s\S]*lock\('lease_expired'/, 'extension 应静默续租但不使用空闲过期计时器锁定页面');
    assert.match(source, /source: 'lease_renew',[\s\S]*silentTransientFailure: isExtensionRuntime[\s\S]*source: 'lease_renew_retry',[\s\S]*silentTransientFailure: isExtensionRuntime/, 'extension 续租遇到瞬时失败不应锁定页面');
    assert.match(source, /const installOnDemandVerifyHooks = \(\) => \{/, '缺少按需校验安装逻辑');
    assert.match(source, /triggerOnDemandVerify\('on_demand_pointerdown'\);/, '点击插件 UI 未触发按需校验');
    assert.match(source, /const PENDING_AUTHORIZATION_REASONS = new Set\(\[[\s\S]*'license_unverified'[\s\S]*'license_checking'[\s\S]*'license_refresh_deferred'[\s\S]*\]\);/, '缺少首装等待态原因集合');
    assert.match(source, /const isRecoverableExtensionAuthorizationReason = \(reason = ''\) => \{[\s\S]*isPendingAuthorizationReason\(normalizedReason\) \|\| isTransientVerifyErrorCode\(normalizedReason\);[\s\S]*\};/, 'extension 同步门禁未把瞬时失败纳入可恢复态');
    assert.match(source, /const updatePendingAuthorizationState = \(source = 'on_demand_interaction'\) => \{[\s\S]*reason: 'license_checking'[\s\S]*message: '授权校验中，请稍后重试'[\s\S]*\};/, '缺少不弹遮罩的等待态状态更新');
    assert.match(source, /const updatePendingAuthorizationState = \(source = 'on_demand_interaction'\) => \{[\s\S]*removeOverlay\(\);[\s\S]*\};/, '进入等待态时应移除历史误锁遮罩');
    assert.doesNotMatch(source, /const updatePendingAuthorizationState = \(source = 'on_demand_interaction'\) => \{[\s\S]*renderOverlay\(\);[\s\S]*\};/, '首装等待态不应渲染全屏授权遮罩');
    assert.match(source, /const blockUnauthorizedInteraction = \(event, source = 'on_demand_interaction'\) => \{[\s\S]*event\?\.preventDefault\?\.\(\);[\s\S]*event\?\.stopImmediatePropagation\?\.\(\);[\s\S]*triggerOnDemandVerify\(source\);[\s\S]*\};/, '未授权点击未同步阻断业务事件');
    assert.match(source, /const blockUnauthorizedInteraction = \(event, source = 'on_demand_interaction'\) => \{[\s\S]*updatePendingAuthorizationState\(source\);[\s\S]*triggerOnDemandVerify\(source\);[\s\S]*\};/, '首装点击应进入等待态并触发按需校验');
    assert.match(source, /if \(!isCurrentLeaseValid\(\)\) \{[\s\S]*blockUnauthorizedInteraction\(event, 'on_demand_pointerdown'\);[\s\S]*return;[\s\S]*\}/, 'pointerdown 未在授权成功前阻断插件入口');
    assert.match(source, /if \(!isCurrentLeaseValid\(\)\) \{[\s\S]*blockUnauthorizedInteraction\(event, 'on_demand_keydown'\);[\s\S]*return;[\s\S]*\}/, 'keydown 未在授权成功前阻断插件入口');
    assert.match(source, /const requireAuthorizedSync = \(source = 'sync_gate'\) => \{[\s\S]*const isExtensionRuntime = resolveRuntimeMode\(\) === 'extension';[\s\S]*const cacheRecoverSource = `\$\{source\}\+cache_recover`;[\s\S]*if \(hydrateCurrentLeaseFromCache\(cacheRecoverSource\)\) \{[\s\S]*triggerOnDemandVerify\(cacheRecoverSource\);[\s\S]*return true;[\s\S]*\}/, '同步门禁未先从有效缓存恢复授权');
    assert.match(source, /if \(isRecoverableExtensionAuthorizationReason\(state\.reason\)\) \{[\s\S]*updatePendingAuthorizationState\(source\);[\s\S]*triggerOnDemandVerify\(source\);[\s\S]*throw createError\('license_checking', '授权校验中，请稍后重试'\);[\s\S]*\}[\s\S]*lock\('lease_expired'/, '同步门禁在可恢复态不应立即按过期锁定');
    assert.match(source, /if \(resolveRuntimeMode\(\) === 'extension'\) \{[\s\S]*installOnDemandVerifyHooks\(\);/s, 'extension 启动未切换到按需校验模式');
    assert.doesNotMatch(source, /if \(onDemandVerifyInFlight \|\| isCurrentLeaseValid\(\)\) return;/, '按需校验仍在租约有效时直接跳过，活跃时间无法刷新');
    assert.match(source, /const ON_DEMAND_VERIFY_REFRESH_WINDOW_MS = 60 \* 1000;/, '缺少按需校验刷新窗口配置');
    assert.match(source, /if \(onDemandVerifyInFlight\) return;/, '按需校验并发保护缺失');
    assert.match(source, /force:\s*leaseValid,/, '租约有效时未强制远端校验，活跃时间不会刷新');
    assert.match(source, /const triggerOnDemandVerify = \(source = 'on_demand_interaction'\) => \{[\s\S]*assertAuthorized\(\{[\s\S]*silentTransientFailure: true[\s\S]*\}\)/, '按需校验遇到授权服务瞬时失败不应直接弹锁定遮罩');
    assert.match(source, /const shouldPreserveCurrentLease = !!\([\s\S]*force[\s\S]*currentLeaseMatchesResolvedShop[\s\S]*isTransientVerifyErrorCode\(code\)[\s\S]*\);/, '有效租约刷新遇到瞬时错误时未保留当前授权');
    assert.match(source, /const hydratedFromCache = hydrateCurrentLeaseFromCache\('extension_cache_bootstrap'\);[\s\S]*if \(hydratedFromCache\) \{[\s\S]*triggerOnDemandVerify\('extension_cache_bootstrap'\);[\s\S]*\} else \{[\s\S]*LicenseGuard\.assertAuthorized\(\{[\s\S]*source: 'bootstrap_preflight'[\s\S]*silentTransientFailure: true/s, 'extension 启动未先恢复缓存并做静默校验');
    assert.match(source, /if \(options\?\.silentTransientFailure && isTransientVerifyErrorCode\(code\)\) \{[\s\S]*reason: 'license_refresh_deferred'[\s\S]*throw createError\(code, msg, err\?\.detail \|\| null\);[\s\S]*\}\s*lock\(code, msg, source\);/s, '启动静默校验遇到瞬时失败不应直接弹锁定遮罩');
});

test('授权锁定遮罩使用统一 UI 语义并避免 HTML 拼接展示状态', () => {
    assert.match(source, /root\.setAttribute\('role', 'dialog'\);/, '授权遮罩缺少 dialog 语义');
    assert.match(source, /root\.setAttribute\('aria-modal', 'true'\);/, '授权遮罩缺少 aria-modal');
    assert.match(source, /root\.setAttribute\('aria-labelledby', 'am-license-lock-title'\);/, '授权遮罩缺少标题关联');
    assert.match(source, /root\.setAttribute\('aria-describedby', 'am-license-lock-message'\);/, '授权遮罩缺少描述关联');
    assert.match(source, /<h2 class="am-license-lock-title" id="am-license-lock-title">/, '授权遮罩标题缺少稳定 id');
    assert.match(source, /<p class="am-license-lock-desc" id="am-license-lock-message" data-license-message="1">/, '授权遮罩正文缺少稳定 id');
    assert.match(source, /__AM_RENDER_ICON__\('alert-triangle', \{ size: 20, strokeWidth: 2\.2 \}\)/, '授权遮罩缺少共享告警图标');
    assert.match(source, /messageNode\.textContent = reason;/, '授权遮罩正文必须通过 textContent 展示');
    assert.match(source, /metaNode\.replaceChildren\(\);[\s\S]*document\.createElement\('span'\)[\s\S]*badge\.textContent = `\$\{label\}: \$\{value\}`;[\s\S]*metaNode\.appendChild\(badge\);/, '授权遮罩 meta 必须通过 DOM/textContent 渲染');
    assert.doesNotMatch(source, /metaNode\.innerHTML\s*=/, '授权遮罩 meta 不得用 innerHTML 拼接 state 字符串');
    assert.doesNotMatch(source, /<span class="am-license-lock-badge">/, '授权遮罩 meta 不得通过模板 HTML 生成 badge');

    const overlayBlock = source.slice(
        source.indexOf('const renderOverlay = () => {'),
        source.indexOf('const lock = (reasonCode =')
    );
    assert.doesNotMatch(overlayBlock, /leaseToken|policyToken|deviceHash|nonce/, '授权遮罩不应展示敏感授权字段');
});

test('授权锁定遮罩视觉收敛到浅玻璃 token', () => {
    assert.match(source, /background: linear-gradient\(135deg, rgba\(255, 255, 255, 0\.72\), rgba\(255, 255, 255, 0\.48\)\);/, '授权遮罩 overlay 未使用白色玻璃遮罩');
    assert.match(source, /backdrop-filter: blur\(12px\) saturate\(1\.18\);/, '授权遮罩 overlay 未使用统一玻璃模糊');
    assert.match(source, /color: var\(--am26-text, #1b2438\);/, '授权遮罩未使用统一文本 token');
    assert.match(source, /font-family: var\(--am26-font,/, '授权遮罩未使用统一字体 token');
    assert.match(source, /border-radius: 18px;/, '授权遮罩卡片未使用 18px 规范圆角');
    assert.match(source, /background: var\(--am26-panel-strong,/, '授权遮罩卡片未使用统一 panel token');
    assert.match(source, /box-shadow: var\(--am26-shadow,/, '授权遮罩卡片未使用统一阴影 token');
    assert.match(source, /color: var\(--am26-danger, #ea4f4f\);/, '授权遮罩状态图标未使用危险语义色');
    assert.match(source, /@media \(prefers-reduced-motion: reduce\)/, '授权遮罩缺少 reduced-motion 覆盖');
    assert.doesNotMatch(source, /background: rgba\(27, 36, 56, 0\.28\);/, '授权遮罩仍保留旧灰蓝遮罩');
    assert.doesNotMatch(source, /background: rgba\(6, 9, 19, 0\.82\);/, '授权遮罩仍保留旧深色遮罩');
    assert.doesNotMatch(source, /rgba\(17, 24, 39, 0\.94\)/, '授权遮罩仍保留旧深色卡片背景');
    assert.doesNotMatch(source, /box-shadow: 0 20px 40px rgba\(0, 0, 0, 0\.4\);/, '授权遮罩仍保留旧重黑阴影');
});
