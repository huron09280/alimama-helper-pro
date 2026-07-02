import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const uiSource = readFileSync(new URL('../src/main-assistant/ui.js', import.meta.url), 'utf8');
const mainSource = readFileSync(new URL('../src/main-assistant/main.js', import.meta.url), 'utf8');

const sliceSource = (source, start, end) => {
    const startIndex = source.indexOf(start);
    assert.notEqual(startIndex, -1, `未找到源码片段起点: ${start}`);
    const endIndex = source.indexOf(end, startIndex + start.length);
    assert.notEqual(endIndex, -1, `未找到源码片段终点: ${end}`);
    return source.slice(startIndex, endIndex);
};

test('插件弹窗背景滚动守卫覆盖主弹窗、二级弹窗和 body 子弹层', () => {
    const rootBlock = sliceSource(uiSource, 'getPluginModalRootSelector() {', 'getPluginModalInteractiveSurfaceSelector() {');
    [
        '#am-magic-report-popup',
        '#am-report-capture-panel',
        '#alimama-escort-helper-ui-result-overlay',
        '#am-campaign-concurrent-log-popup:not([aria-hidden="true"])',
        '#am-campaign-copy-overview-popup',
        '#am-campaign-copy-success-popup',
        '#am-campaign-batch-confirm-popup',
        '#am-campaign-ai-max-batch-popup',
        '#am-wxt-keyword-overlay.open',
        '#am-wxt-scene-popup-mask',
        '#am-wxt-keyword-item-picker-mask'
    ].forEach((selector) => {
        assert.ok(rootBlock.includes(selector), `弹窗根选择器缺少 ${selector}`);
    });

    const surfaceBlock = sliceSource(uiSource, 'getPluginModalInteractiveSurfaceSelector() {', 'getPluginWheelControlSelector() {');
    [
        '#am-wxt-keyword-modal',
        '#am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog',
        '#am-wxt-keyword-item-picker-mask .am-wxt-keyword-item-picker-dialog',
        '#am-wxt-keyword-run-mode-menu:not(.hidden)',
        '#am-campaign-batch-plus-menu',
        '.am-crowd-matrix-item-dropdown.is-open'
    ].forEach((selector) => {
        assert.ok(surfaceBlock.includes(selector), `弹窗内部/子弹层选择器缺少 ${selector}`);
    });

    const wheelControlBlock = sliceSource(uiSource, 'getPluginWheelControlSelector() {', 'resolveEventElement(target) {');
    [
        '[data-action="run-mode-count-badge"]',
        '[data-action="copy-count-badge"]',
        '[data-am-campaign-copy-count-badge]'
    ].forEach((selector) => {
        assert.ok(wheelControlBlock.includes(selector), `滚轮调数值控件缺少豁免 ${selector}`);
    });
});

test('弹窗背景守卫在捕获阶段阻断 wheel 和鼠标中键事件', () => {
    const bindBlock = sliceSource(uiSource, 'bindPluginScrollChainGuard() {', 'shouldBlockPluginWheel(pluginRoot, startNode, deltaY) {');

    assert.match(
        bindBlock,
        /document\.addEventListener\('wheel'[\s\S]*this\.blockPluginModalBackgroundEvent\(event,\s*target\)[\s\S]*target\.closest\(this\.getPluginScrollSurfaceSelector\(\)\)[\s\S]*\{ capture:\s*true,\s*passive:\s*false \}/,
        'wheel 捕获阶段应先阻断弹窗外背景滚动，再处理插件内部滚动链'
    );
    assert.match(
        bindBlock,
        /if \(target\.closest\(this\.getPluginWheelControlSelector\(\)\)\) return;[\s\S]*const pluginRoot = target\.closest\(this\.getPluginScrollSurfaceSelector\(\)\)/,
        '滚轮调数值控件应保留自身 wheel 处理器，不能被滚动链守卫抢先吞掉'
    );
    assert.match(
        bindBlock,
        /document\.addEventListener\('mousedown'[\s\S]*event\.button !== 1[\s\S]*this\.blockPluginModalBackgroundEvent\(event,\s*this\.resolveEventElement\(event\.target\)\)[\s\S]*\},\s*true\);/,
        'mousedown 应阻断弹窗外鼠标中键自动滚动'
    );
    assert.match(
        bindBlock,
        /document\.addEventListener\('auxclick'[\s\S]*event\.button !== 1[\s\S]*this\.blockPluginModalBackgroundEvent\(event,\s*this\.resolveEventElement\(event\.target\)\)[\s\S]*\},\s*true\);/,
        'auxclick 应继续阻断弹窗外鼠标中键默认行为'
    );
});

test('弹窗背景守卫只拦弹窗外事件，弹窗内部滚动仍交给滚动链判断', () => {
    const shouldBlock = sliceSource(uiSource, 'shouldBlockPluginModalBackgroundEvent(event, targetEl = null) {', 'blockPluginModalBackgroundEvent(event, targetEl = null) {');
    assert.match(
        shouldBlock,
        /const activeModal = this\.getActivePluginModalRoot\(\);[\s\S]*if \(!\(activeModal instanceof HTMLElement\)\) return false;/,
        '没有可见插件弹窗时不应拦截页面事件'
    );
    assert.match(
        shouldBlock,
        /target instanceof Element && target\.closest\(this\.getPluginModalInteractiveSurfaceSelector\(\)\)[\s\S]*return false;/,
        '弹窗内容区和 body 子弹层不应被背景守卫误拦'
    );
});

test('DMP 页面也安装插件弹窗滚动守卫', () => {
    const mainBlock = sliceSource(mainSource, 'function main() {', 'let lastUrl = window.location.href;');
    assert.match(
        mainBlock,
        /installAssistDisplayDiagnostics\(\);\s*UI\.bindPluginScrollChainGuard\(\);\s*if \(isDmpHostPage\(\)\)/,
        'DMP 分支 return 前必须安装弹窗滚动守卫'
    );
});
