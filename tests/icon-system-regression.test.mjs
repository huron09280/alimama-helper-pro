import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('共享图标体系使用 24x24 线性 SVG 渲染入口', () => {
  const preamble = read('src/shared/script-preamble.js');
  assert.match(preamble, /const AM_ICON_DEFS = \{[\s\S]*'shield-check'[\s\S]*'chevron-down'/, '缺少共享图标定义');
  for (const iconName of ['plus', 'multiply', 'user', 'sparkles', 'external-link']) {
    assert.match(preamble, new RegExp(`${iconName}:|'${iconName}':`), `共享图标定义缺少 ${iconName}`);
  }
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
  const preamble = read('src/shared/script-preamble.js');
  assert.match(svg, /viewBox="0 0 128 128"/, '扩展 SVG 源稿应使用 128 画板');
  assert.match(preamble, /logo:\s*\{\s*body:\s*'<path d="M13 3L5 13h6l-1 8 9-12h-6l1-6z"><\/path>'/, '悬浮球 logo 源路径发生变化，请同步更新扩展图标断言');
  assert.match(svg, /<circle cx="64" cy="64" r="52" fill="#FFFFFF" fill-opacity="0\.9"\/>/, '扩展 SVG 缺少悬浮球圆形底板');
  assert.match(svg, /<path d="M69\.3333 16L26\.6667 69\.3333h32l-5\.3334 42\.6667 48-64h-32l5\.3334-32z" fill="none" stroke="#4554E5" stroke-width="10\.6667" stroke-linecap="round" stroke-linejoin="round"\/>/, '扩展 SVG 未按悬浮球 logo 路径等比换算');
  assert.doesNotMatch(svg, /<path d="M73 25L36 71h27l-5 32 36-48H68l5-30z"/, '扩展 SVG 保持旧闪电符号');
  assert.doesNotMatch(svg, /<rect x="12" y="12" width="104" height="104" rx="24"/, '扩展 SVG 不应继续使用旧版圆角方形底板');
});

test('关键词向导残留图标字符改为共享 SVG', () => {
  const files = [
    'src/optimizer/keyword-plan-api/wizard-mount-intro.js',
    'src/optimizer/keyword-plan-api/request-builder-preview.js',
    'src/optimizer/keyword-plan-api/wizard-style-and-state/matrix-generic-editors.js',
    'src/optimizer/keyword-plan-api/wizard-style-and-state/matrix-bid-package.js',
    'src/optimizer/keyword-plan-api/wizard-scene-config/strategy-state-and-draft.js',
    'src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-core.js',
    'src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-grid.js',
    'src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-advanced-popup.js',
    'src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-item-adzone-popup.js',
    'src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-crowd-popup.js'
  ];
  for (const file of files) {
    const source = read(file);
    assert.doesNotMatch(source, /|&times;|>\s*[×✕]\s*<|>\+<\/button>|textContent\s*=\s*'\+'/, `${file} 仍存在裸字符图标`);
    assert.doesNotMatch(source, /<span class="[^"]*(?:icon|help)[^"]*">[?P*⌄⌃^+]<\/span>/, `${file} 仍存在 span 文本图标`);
  }
  const style = read('src/optimizer/keyword-plan-api/wizard-style-and-state/style.js');
  assert.doesNotMatch(style, /content:\s*"\s*[⌄⌃^↗]\s*"/, '样式中不应再用文本箭头或外链符号做图标');
  assert.doesNotMatch(style, /am-wxt-scene-trend-check input:checked \+ \.am-wxt-scene-trend-check-icon::after/, '趋势主题勾选不应再用 CSS 边框手绘勾');
});

test('并发日志关闭按钮使用共享 SVG 图标', () => {
  const source = read('src/main-assistant/campaign-id-quick-entry.js');
  assert.match(source, /class="am-concurrent-log-close"[\s\S]*renderAmIcon\('close'/, '并发日志关闭按钮未使用共享 close 图标');
  assert.doesNotMatch(source, /class="am-concurrent-log-close"[^>]*>\s*×\s*<\/button>/, '并发日志关闭按钮不应使用裸 × 字符');
});
