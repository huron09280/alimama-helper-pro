import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeExtensionManifestVersion, renderBuildOutputs } from '../scripts/build.mjs';

const outputs = renderBuildOutputs();
const manifest = JSON.parse(outputs.extensionFiles['manifest.json']);
const contentSource = outputs.extensionFiles['content.js'];
const backgroundSource = outputs.extensionFiles['background.js'];
const pageBundle = outputs.extensionFiles['page.bundle.js'];

test('extension manifest 为 MV3 且指向阿里妈妈域名', () => {
  assert.equal(manifest.manifest_version, 3, 'manifest_version 必须为 3');
  assert.deepEqual(manifest.icons, {
    16: 'icon-16.png',
    32: 'icon-32.png',
    48: 'icon-48.png',
    128: 'icon-128.png'
  }, '扩展图标配置缺失或不正确');
  assert.deepEqual(manifest.action.default_icon, {
    16: 'icon-16.png',
    32: 'icon-32.png',
    48: 'icon-48.png'
  }, '工具栏图标配置缺失或不正确');
  assert.deepEqual(manifest.background, {
    service_worker: 'background.js'
  }, '缺少 background service worker 配置');
  assert.ok(Array.isArray(manifest.host_permissions), '缺少 host_permissions 配置');
  assert.ok(manifest.host_permissions.includes('https://am-licee-server-mpbzozflkj.cn-hangzhou.fcapp.run/*'), '缺少授权服务 host permission');
  assert.deepEqual(manifest.content_scripts[0].js, ['content.js']);
  assert.ok(manifest.content_scripts[0].matches.includes('*://*.alimama.com/*'), '缺少阿里妈妈子域匹配');
  assert.ok(manifest.content_scripts[0].matches.includes('https://myseller.taobao.com/*'), '缺少 myseller.taobao.com 匹配');
  assert.ok(manifest.web_accessible_resources[0].resources.includes('page.bundle.js'), '缺少 page bundle 暴露');
  assert.ok(!manifest.web_accessible_resources[0].resources.includes('keyword-plan-api.bundle.js'), '不应暴露点击时加载的 keyword-plan-api lazy bundle');
  assert.ok(manifest.web_accessible_resources[0].matches.includes('https://myseller.taobao.com/*'), '缺少 myseller.taobao.com web_accessible 匹配');
});

test('extension manifest 使用 Chrome 规范版本并保留展示版本', () => {
  assert.equal(normalizeExtensionManifestVersion('7.04'), '7.4');
  assert.equal(manifest.version, '7.4', 'manifest.version 不能包含带前导零的分段');
  assert.equal(manifest.version_name, outputs.version, 'manifest.version_name 应保留 userscript 展示版本');
});

test('extension content script 负责注入 page bundle', () => {
  assert.match(contentSource, /chrome\.runtime\.getURL\('page\.bundle\.js'\)/, '未通过 runtime URL 注入 page bundle');
  assert.doesNotMatch(contentSource, /keyword-plan-api\.bundle\.js/, 'content script 不应把 keyword-plan-api 大包延后到点击路径');
  assert.match(contentSource, /SCRIPT_ID = 'am-helper-pro-extension-page-bundle'/, '缺少固定注入节点 ID');
  assert.match(contentSource, /const renderInjectionError = \(message = ''\) => \{/, '缺少 extension 注入失败可见反馈');
  assert.match(contentSource, /script\.onerror = \(\) => \{[\s\S]*renderInjectionError\(\);[\s\S]*\};/, 'page bundle 注入失败未展示页面错误');
  assert.match(contentSource, /mountNode\.appendChild\(script\);[\s\S]*catch \{[\s\S]*renderInjectionError\(\);/, 'appendChild 失败未兜底展示页面错误');
  assert.match(contentSource, /const LICENSE_VERIFY_BRIDGE_CHANNEL = 'am-helper-pro:license-verify';/, '缺少授权桥 channel 常量');
  assert.match(contentSource, /if \(data\.channel !== LICENSE_VERIFY_BRIDGE_CHANNEL\) return;/, 'content script 未限制授权桥 channel');
  assert.match(contentSource, /if \(data\.type !== LICENSE_VERIFY_REQUEST_TYPE\) return;/, 'content script 未限制授权桥消息类型');
  assert.match(contentSource, /try \{[\s\S]*chrome\.runtime\.sendMessage\(\{\s*type: LICENSE_VERIFY_MESSAGE_TYPE,\s*payload\s*\},\s*\(response\) => \{/, 'content script 未保护式转发授权请求给 background');
  assert.match(contentSource, /catch \(err\) \{[\s\S]*markLicenseBridgeRuntimeUnavailable\(err\);[\s\S]*postLicenseBridgeRuntimeUnavailable\(requestId\);[\s\S]*\}/, 'content script 未捕获扩展上下文失效错误');
  assert.match(contentSource, /type: LICENSE_VERIFY_RESPONSE_TYPE,/, 'content script 未回传授权桥响应');
});

test('extension build output 包含授权 background 桥', () => {
  assert.equal(typeof backgroundSource, 'string', 'build output 缺少 background.js');
  assert.match(backgroundSource, /const VERIFY_ENDPOINT = 'https:\/\/am-licee-server-mpbzozflkj\.cn-hangzhou\.fcapp\.run\/v1\/license\/verify';/, 'background 未固定授权 verify endpoint');
  assert.match(backgroundSource, /const VERIFY_REQUEST_TYPE = 'AM_LICENSE_VERIFY_REQUEST';/, 'background 缺少授权消息类型');
  assert.match(backgroundSource, /if \(message\?\.type !== VERIFY_REQUEST_TYPE\) return false;/, 'background 未限制消息类型');
  assert.match(backgroundSource, /if \(!isAllowedSenderUrl\(sender\?\.url \|\| ''\)\) \{/, 'background 未校验 sender.url');
  assert.match(
    backgroundSource,
    /return hostname === 'alimama\.com'[\s\S]*hostname === 'myseller\.taobao\.com'[\s\S]*hostname\.endsWith\('\.myseller\.taobao\.com'\)[\s\S]*hostname\.endsWith\('\.alimama\.com'\);/,
    'background 未限制阿里妈妈来源'
  );
  assert.match(backgroundSource, /response = await fetch\(VERIFY_ENDPOINT, \{/, 'background 未请求固定授权地址');
  assert.doesNotMatch(backgroundSource, /payload\.(?:url|endpoint)/, 'background 不应接受页面传入任意 URL');
});

test('extension page bundle 包含 GM 兼容层与核心桥接', () => {
  assert.match(pageBundle, /window\.GM_getValue = GM_getValue_impl/, '缺少 GM_getValue 兼容层');
  assert.match(pageBundle, /window\.__AM_PLATFORM_RUNTIME__ = \{/, '缺少 extension 运行时标记');
  assert.doesNotMatch(pageBundle, /keywordPlanApiBundle/, 'extension 运行态不应记录点击时加载的 keyword-plan-api lazy bundle');
  assert.match(pageBundle, /window\.__ALIMAMA_OPTIMIZER_TOGGLE__ = \(\) => \{/, '缺少核心桥接入口');
});

test('extension page bundle 包含完整计划 API 且不默认暴露到页面全局', () => {
  assert.match(pageBundle, /const isExtensionPageRuntime = \(\) => \{[\s\S]*__AM_PLATFORM_RUNTIME__\?\.mode === 'extension'/, '缺少 extension 运行态判定');
  assert.match(pageBundle, /const KeywordPlanApi = \(\(\) => \{/, 'extension page bundle 应包含完整 KeywordPlanApi 主体，避免点击时首次解析大包');
  assert.match(pageBundle, /\bKeywordPlanRuntime\b/, 'extension page bundle 应在启动期初始化关键词运行时');
  assert.match(
    pageBundle,
    /if \(typeof globalThis !== 'undefined' && !isExtensionPageRuntime\(\)\) \{[\s\S]*globalThis\.__AM_WXT_KEYWORD_API__ = KeywordPlanApi;[\s\S]*globalThis\.__AM_WXT_PLAN_API__ = KeywordPlanApi;/,
    'sandbox 全局计划 API 未被 extension 运行态隔离'
  );
  assert.doesNotMatch(
    pageBundle,
    /if \(typeof globalThis !== 'undefined'\) \{\s*globalThis\.__AM_TOKENS__ = State\.tokens;[\s\S]*globalThis\.__AM_WXT_PLAN_API__ = KeywordPlanApi;/,
    'extension page bundle 仍会无条件向 window/globalThis 暴露完整计划 API'
  );
});

test('extension page bundle 默认保留组建计划打开窄桥', () => {
  assert.match(pageBundle, /const KEYWORD_PLAN_OPEN_BRIDGE_READY_KEY = '__AM_WXT_KEYWORD_OPEN_BRIDGE_READY__';/, '缺少组建计划打开窄桥常量');
  assert.doesNotMatch(pageBundle, /loadKeywordPlanApiForExtension\(\)/, '组建计划点击路径不应再懒加载 keyword-plan-api 大包');
  assert.doesNotMatch(pageBundle, /am-helper-pro-extension-keyword-plan-bundle/, '不应保留点击时注入 keyword-plan-api 大包的 script 标识');
  assert.match(pageBundle, /installKeywordPlanOpenBridgeHost\(\);\s*if \(isExtensionPageRuntime\(\) \|\| shouldExposePageApiDebug\(\)\) \{[\s\S]*?installPageApiBridgeHost\(\);[\s\S]*?\}\s*if \(shouldExposePageApiDebug\(\)\) \{/s, 'extension 应默认安装内部完整桥 host，完整 page API 客户端仍受 debug 开关保护');
  assert.match(pageBundle, /if \(window\[KEYWORD_PLAN_OPEN_BRIDGE_READY_KEY\] === '1'\) \{[\s\S]*?return createKeywordPlanOpenBridgeApi\(\);[\s\S]*?\}/s, '主助手未回退到组建计划打开窄桥');
});

test('extension page bundle 不把 API 控制流失败写入 Chrome 扩展错误页', () => {
  assert.match(pageBundle, /Logger\.info\(`\[\$\{reqId\}\] 请求失败 \(\$\{elapsed\}ms\):`, \{/, '单次请求失败应保留日志但不使用 console.error');
  assert.match(pageBundle, /Logger\.info\(`✗ 请求失败 \(第\$\{attempt\}\/\$\{totalAttempts\}次\): \$\{err\.message\}`\);/, '重试失败应保留日志但不使用 console.warn');
  assert.match(pageBundle, /Logger\.info\(`❌ 请求最终失败: \$\{finalError\.message\}`, \{ url, attempts: totalAttempts \}\);/, '最终失败应保留日志但不使用 console.error');
  assert.doesNotMatch(pageBundle, /Logger\.error\(`\[\$\{reqId\}\] 请求失败 \(\$\{elapsed\}ms\):`/, '单次请求失败不应进入 Chrome error collection');
  assert.doesNotMatch(pageBundle, /Logger\.warn\(`✗ 请求失败 \(第\$\{attempt\}\/\$\{totalAttempts\}次\): \$\{err\.message\}`\);/, '重试失败不应进入 Chrome warning collection');
  assert.doesNotMatch(pageBundle, /Logger\.error\(`❌ 请求最终失败: \$\{finalError\.message\}`/, '最终失败不应进入 Chrome error collection');
});
