import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('共享图标体系使用 24x24 线性 SVG 渲染入口', () => {
  const preamble = read('src/shared/script-preamble.js');
  assert.match(preamble, /const AM_ICON_DEFS = \{[\s\S]*'shield-check'[\s\S]*'chevron-down'/, '缺少共享图标定义');
  assert.match(preamble, /const renderAmIcon = \(name, options = \{\}\) => \{[\s\S]*viewBox="\$\{icon\.viewBox \|\| '0 0 24 24'\}"/, '图标渲染器未默认使用 24x24 画板');
  assert.match(preamble, /stroke-linecap="round" stroke-linejoin="round"/, '图标渲染器缺少统一线端与拐角');
});

test('主入口和快捷入口不再使用 1024 iconfont 大路径', () => {
  for (const file of [
    'src/main-assistant/ui.js',
    'src/main-assistant/campaign-id-quick-entry.js',
    'src/main-assistant/magic-report.js',
    'src/main-assistant/interceptor.js',
    'src/optimizer/ui.js'
  ]) {
    const source = read(file);
    assert.doesNotMatch(source, /viewBox="0 0 1024 1024"/, `${file} 仍存在旧 1024 iconfont SVG`);
  }
});

test('万能查数快捷话术使用图标字段与文字标签分离', () => {
  const source = read('src/main-assistant/magic-report.js');
  assert.match(source, /QUICK_PROMPTS:\s*\[[\s\S]*\{ icon: 'tag', label: '计划名：\{campaignName\}'/, '计划名快捷话术缺少独立图标字段');
  assert.match(source, /renderQuickPromptContent\(promptItem\)[\s\S]*renderAmIcon\(iconName[\s\S]*am-quick-prompt-label/, '快捷话术未通过共享图标渲染');
  assert.doesNotMatch(source, /label:\s*'[📛🖱️🛒💰🏙️🌆✨]/, '快捷话术标签不应再混入 emoji 图标');
});

test('扩展图标源稿是当前重绘后的应用图标', () => {
  const svg = read('src/entries/extension-icons/icon.svg');
  assert.match(svg, /viewBox="0 0 128 128"/, '扩展 SVG 源稿应使用 128 画板');
  assert.match(svg, /<rect x="12" y="12" width="104" height="104" rx="24" fill="#4554E5"\/>/, '扩展 SVG 缺少圆角应用图标底板');
  assert.match(svg, /<path d="M73 25L36 71h27l-5 32 36-48H68l5-30z" fill="#fff"\/>/, '扩展 SVG 缺少新闪电符号');
});
