import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { listGeneratedTextOutputs, renderBuildOutputs } from '../scripts/build.mjs';

const rootSource = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');
const outputs = renderBuildOutputs();
const userscriptMetaSource = readFileSync(new URL('../src/entries/userscript-meta.js', import.meta.url), 'utf8');
const currentVersion = (() => {
  const match = userscriptMetaSource.match(/^\/\/ @version\s+([0-9]+(?:\.[0-9]+)*)/m);
  assert.ok(match, '无法从 src/entries/userscript-meta.js 解析当前版本号');
  return match[1];
})();
const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const currentVersionPattern = escapeRegExp(currentVersion);
const readProjectFile = (relativePath) => readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('构建输出与根文件保持同步', () => {
  assert.equal(outputs.userscriptSource, rootSource, '根文件未与 src/ 生成结果保持同步');
});

test('所有文本构建产物与 src 生成结果保持同步', () => {
  listGeneratedTextOutputs(outputs).forEach(({ relativePath, content }) => {
    const current = readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
    assert.equal(current, content, `${relativePath} 未与 src/ 生成结果保持同步`);
  });
});

test('userscript 继续内联组建计划样式并保持自包含', () => {
  assert.match(outputs.userscriptSource, /style\.textContent = `\s*#am-wxt-keyword-overlay \{/, 'userscript 应继续内联组建计划样式');
  assert.match(outputs.userscriptSource, /#am-wxt-keyword-modal \.am-wxt-home-summary \{/, 'userscript 内联样式缺少组建计划首页摘要');
  assert.doesNotMatch(outputs.userscriptSource, /new URL\('wizard-style\.css'/, 'userscript 不应依赖 extension 外置 CSS');
  assert.doesNotMatch(outputs.userscriptSource, /__AM_EXTENSION_RESOURCE_BASE_URL__/, 'userscript 不应依赖 extension 资源 base URL');
});

test('userscript meta 产物包含自动更新地址', () => {
  assert.match(outputs.metaSource, /@updateURL\s+https:\/\/github\.com\/huron09280\/alimama-helper-pro\/releases\/latest\/download\/alimama-helper-pro\.meta\.js/);
  assert.match(outputs.metaSource, /@downloadURL\s+https:\/\/github\.com\/huron09280\/alimama-helper-pro\/releases\/latest\/download\/alimama-helper-pro\.user\.js/);
});

test('当前展示版本示例与 userscript 版本保持同步', () => {
  const expectations = [
    ['README.md', new RegExp(`^### v${currentVersionPattern} \\(`, 'm')],
    ['CLAUDE.md', new RegExp(`^- \\*\\*当前版本\\*\\*: \`v${currentVersionPattern}\``, 'm')],
    ['docs/授权管理页.md', new RegExp(`"scriptVersion":"${currentVersionPattern}"`)],
    ['docs/新人使用教程.md', new RegExp(`阿里助手 Pro\\s+v${currentVersionPattern}`)]
  ];

  expectations.forEach(([relativePath, pattern]) => {
    assert.match(readProjectFile(relativePath), pattern, `${relativePath} 当前展示版本未同步到 ${currentVersion}`);
  });

  [
    'docs/images/mockups/floating-ball.html',
    'docs/images/mockups/main-panel.html',
    'docs/images/mockups/assist-switches.html',
    'docs/images/mockups/download-capture.html',
    'docs/images/mockups/campaign-quick-entry.html',
    'docs/images/mockups/tampermonkey-install.html'
  ].forEach((relativePath) => {
    const source = readProjectFile(relativePath);
    const matches = [
      ...source.matchAll(/阿里助手 Pro v([0-9]+(?:\.[0-9]+)*)/g),
      ...source.matchAll(/tm-version">v([0-9]+(?:\.[0-9]+)*)/g)
    ];
    assert.ok(matches.length > 0, `${relativePath} 未找到当前展示版本示例`);
    matches.forEach((match) => {
      assert.equal(match[1], currentVersion, `${relativePath} 当前展示版本未同步`);
    });
  });
});
