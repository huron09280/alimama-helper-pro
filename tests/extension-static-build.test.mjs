import test from 'node:test';
import assert from 'node:assert/strict';
import { renderBuildOutputs } from '../scripts/build.mjs';

const outputs = renderBuildOutputs();
const manifest = JSON.parse(outputs.extensionFiles['manifest.json']);
const contentSource = outputs.extensionFiles['content.js'];
const pageBundle = outputs.extensionFiles['page.bundle.js'];

test('extension manifest 为 MV3 且指向阿里妈妈域名', () => {
  assert.equal(manifest.manifest_version, 3, 'manifest_version 必须为 3');
  assert.deepEqual(manifest.content_scripts[0].js, ['content.js']);
  assert.ok(manifest.content_scripts[0].matches.includes('*://*.alimama.com/*'), '缺少阿里妈妈子域匹配');
  assert.ok(manifest.web_accessible_resources[0].resources.includes('page.bundle.js'), '缺少 page bundle 暴露');
});

test('extension content script 负责注入 page bundle', () => {
  assert.match(contentSource, /chrome\.runtime\.getURL\('page\.bundle\.js'\)/, '未通过 runtime URL 注入 page bundle');
  assert.match(contentSource, /SCRIPT_ID = 'am-helper-pro-extension-page-bundle'/, '缺少固定注入节点 ID');
});

test('extension page bundle 包含 GM 兼容层与核心桥接', () => {
  assert.match(pageBundle, /window\.GM_getValue = GM_getValue_impl/, '缺少 GM_getValue 兼容层');
  assert.match(pageBundle, /window\.__AM_PLATFORM_RUNTIME__ = \{/, '缺少 extension 运行时标记');
  assert.match(pageBundle, /window\.__ALIMAMA_OPTIMIZER_TOGGLE__ = \(\) => \{/, '缺少核心桥接入口');
});
