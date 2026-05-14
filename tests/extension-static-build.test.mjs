import test from 'node:test';
import assert from 'node:assert/strict';
import { renderBuildOutputs } from '../scripts/build.mjs';

const outputs = renderBuildOutputs();
const manifest = JSON.parse(outputs.extensionFiles['manifest.json']);
const contentSource = outputs.extensionFiles['content.js'];
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
  assert.deepEqual(manifest.content_scripts[0].js, ['content.js']);
  assert.ok(manifest.content_scripts[0].matches.includes('*://*.alimama.com/*'), '缺少阿里妈妈子域匹配');
  assert.ok(manifest.web_accessible_resources[0].resources.includes('page.bundle.js'), '缺少 page bundle 暴露');
});

test('extension content script 负责注入 page bundle', () => {
  assert.match(contentSource, /chrome\.runtime\.getURL\('page\.bundle\.js'\)/, '未通过 runtime URL 注入 page bundle');
  assert.match(contentSource, /SCRIPT_ID = 'am-helper-pro-extension-page-bundle'/, '缺少固定注入节点 ID');
  assert.match(contentSource, /const renderInjectionError = \(message = ''\) => \{/, '缺少 extension 注入失败可见反馈');
  assert.match(contentSource, /script\.onerror = \(\) => \{[\s\S]*renderInjectionError\(\);[\s\S]*\};/, 'page bundle 注入失败未展示页面错误');
  assert.match(contentSource, /mountNode\.appendChild\(script\);[\s\S]*catch \{[\s\S]*renderInjectionError\(\);/, 'appendChild 失败未兜底展示页面错误');
});

test('extension page bundle 包含 GM 兼容层与核心桥接', () => {
  assert.match(pageBundle, /window\.GM_getValue = GM_getValue_impl/, '缺少 GM_getValue 兼容层');
  assert.match(pageBundle, /window\.__AM_PLATFORM_RUNTIME__ = \{/, '缺少 extension 运行时标记');
  assert.match(pageBundle, /window\.__ALIMAMA_OPTIMIZER_TOGGLE__ = \(\) => \{/, '缺少核心桥接入口');
});

test('extension page bundle 不默认暴露完整计划 API 到页面全局', () => {
  assert.match(pageBundle, /const isExtensionPageRuntime = \(\) => \{[\s\S]*__AM_PLATFORM_RUNTIME__\?\.mode === 'extension'/, '缺少 extension 运行态判定');
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
