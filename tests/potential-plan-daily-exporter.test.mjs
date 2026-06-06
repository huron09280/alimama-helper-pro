import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

function getPotentialSource() {
    return read('src/main-assistant/potential-plan-daily-exporter.js');
}

function getPotentialStyleBlock() {
    const source = read('src/main-assistant/ui.js');
    const start = source.indexOf('.am-potential-plan-export-btn {');
    const end = source.indexOf('#am-campaign-concurrent-log-popup', start);
    assert.ok(start > -1 && end > start, '无法定位潜力词导出入口样式块');
    return source.slice(start, end);
}

test('潜力词导出入口使用共享下载图标和可访问状态', () => {
    const preamble = read('src/shared/script-preamble.js');
    const source = getPotentialSource();

    assert.match(preamble, /download:\s*\{[\s\S]*body:\s*'<path d="M12 4v10"><\/path><path d="M8 10l4 4 4-4"><\/path><path d="M5 19h14"><\/path>'/, '共享图标缺少 download 线性图标');
    assert.match(source, /icon\.className = 'am-potential-plan-export-icon';[\s\S]*icon\.innerHTML = renderAmIcon\('download', \{ size: 13, strokeWidth: 2\.2 \}\);/, '潜力词导出入口应使用共享 download 图标');
    assert.match(source, /status\.className = 'am-potential-plan-export-status';[\s\S]*status\.setAttribute\('aria-live', 'polite'\);/, '潜力词导出入口缺少 live 状态节点');
    assert.match(source, /btn\.setAttribute\('aria-busy', running \? 'true' : 'false'\);[\s\S]*btn\.setAttribute\('aria-label', `潜力词日维度导出，\$\{statusText\}`\);[\s\S]*btn\.title = `潜力词日维度导出，\$\{statusText\}`;/, '潜力词导出按钮缺少 aria-busy、aria-label 或 title 状态同步');
    assert.match(source, /statusText = running \? nextText : `可导出最近 \$\{days\} 天潜力词日维度 CSV`/, '潜力词导出入口缺少静息状态说明');
});

test('潜力词导出天数输入具备稳定边界和可访问名称', () => {
    const source = getPotentialSource();

    assert.match(source, /input\.type = 'number';[\s\S]*input\.min = '1';[\s\S]*input\.max = String\(this\.MAX_EXPORT_DAYS\);[\s\S]*input\.step = '1';/, '导出天数输入缺少数字边界');
    assert.match(source, /input\.setAttribute\('aria-label', '导出天数'\);[\s\S]*input\.title = `导出天数，1-\$\{this\.MAX_EXPORT_DAYS\}`;/, '导出天数输入缺少 aria-label 或 title');
    assert.match(source, /input\.addEventListener\('click'[\s\S]*e\.stopPropagation\(\);[\s\S]*input\.addEventListener\('mousedown'[\s\S]*e\.stopPropagation\(\);[\s\S]*input\.addEventListener\('keydown'[\s\S]*e\.stopPropagation\(\);/, '导出天数输入应阻止事件冒泡，避免误触真实导出');
    assert.match(source, /normalizeExportDays\(raw\)[\s\S]*if \(days < 1 \|\| days > this\.MAX_EXPORT_DAYS\) return 0;/, '导出天数归一化应限制 1-MAX_EXPORT_DAYS');
});

test('潜力词导出 click 委托只在目标页绑定，离开目标页释放', () => {
    const source = getPotentialSource();

    assert.match(source, /initialized:\s*false,[\s\S]*running:\s*false,[\s\S]*exportClickHandler:\s*null,[\s\S]*exportClickHandlerBound:\s*false,/, '潜力词导出缺少 click 委托生命周期状态');
    assert.match(source, /init\(\)\s*\{[\s\S]*this\.exportClickHandler = \(e\) => \{[\s\S]*const btn = target\.closest\(this\.BUTTON_SELECTOR\);[\s\S]*this\.exportCsv\(btn\)\.catch[\s\S]*\};[\s\S]*this\.initialized = true;/, 'init 应只创建命名 click handler，不应直接常驻绑定 document click');
    assert.doesNotMatch(source.match(/init\(\)\s*\{[\s\S]*?\n\s*\},\n\s*\n\s*bindExportClickHandler\(/)?.[0] || '', /document\.addEventListener\('click'/, 'init 不应注册 document click 监听');
    assert.match(source, /bindExportClickHandler\(\)\s*\{[\s\S]*if \(this\.exportClickHandlerBound\) return;[\s\S]*document\.addEventListener\('click', this\.exportClickHandler, true\);[\s\S]*this\.exportClickHandlerBound = true;[\s\S]*\}/, '目标页应按需绑定导出 click 委托');
    assert.match(source, /unbindExportClickHandler\(\)\s*\{[\s\S]*if \(!this\.exportClickHandlerBound\) return;[\s\S]*document\.removeEventListener\('click', this\.exportClickHandler, true\);[\s\S]*this\.exportClickHandlerBound = false;[\s\S]*\}/, '离开目标页应释放导出 click 委托');
    assert.match(source, /run\(\)\s*\{[\s\S]*if \(!this\.isTargetPage\(\)\) \{[\s\S]*this\.removeButtons\(\);[\s\S]*this\.unbindExportClickHandler\(\);[\s\S]*return;[\s\S]*\}[\s\S]*this\.bindExportClickHandler\(\);[\s\S]*this\.ensureButton\(\);/, 'run 应在目标页绑定 click 委托，在非目标页解绑并移除按钮');
});

test('潜力词 CSV 下载链接清理 timer 可取消并释放对象 URL', () => {
    const source = getPotentialSource();
    const downloadBlock = source.match(/downloadCsv\(content, filename\)\s*\{[\s\S]*?\n\s*\},\n\s*\n\s*cleanupDownloadLink\(/)?.[0] || '';

    assert.match(source, /initialized:\s*false,[\s\S]*running:\s*false,[\s\S]*downloadCleanupTimer:\s*null,[\s\S]*downloadCleanupLink:\s*null,/, '潜力词导出缺少下载清理 timer 生命周期状态');
    assert.match(source, /cleanupDownloadLink\(link\)\s*\{[\s\S]*if \(!\(link instanceof HTMLAnchorElement\)\) return;[\s\S]*const href = String\(link\.href \|\| ''\);[\s\S]*if \(href\) URL\.revokeObjectURL\(href\);[\s\S]*link\.remove\(\);[\s\S]*\}/, '下载清理应统一 revoke object URL 并移除链接');
    assert.match(source, /clearDownloadCleanupTimer\(\)\s*\{[\s\S]*if \(this\.downloadCleanupTimer\) \{[\s\S]*clearTimeout\(this\.downloadCleanupTimer\);[\s\S]*this\.downloadCleanupTimer = null;[\s\S]*const pendingLink = this\.downloadCleanupLink;[\s\S]*this\.downloadCleanupLink = null;[\s\S]*this\.cleanupDownloadLink\(pendingLink\);[\s\S]*\}/, '下载清理 timer 应可取消并释放 pending 链接');
    assert.match(source, /scheduleDownloadCleanup\(link\)\s*\{[\s\S]*this\.clearDownloadCleanupTimer\(\);[\s\S]*if \(!\(link instanceof HTMLAnchorElement\)\) return;[\s\S]*this\.downloadCleanupLink = link;[\s\S]*this\.downloadCleanupTimer = setTimeout\(\(\) => \{[\s\S]*this\.downloadCleanupTimer = null;[\s\S]*const pendingLink = this\.downloadCleanupLink;[\s\S]*this\.downloadCleanupLink = null;[\s\S]*this\.cleanupDownloadLink\(pendingLink\);[\s\S]*\}, 0\);[\s\S]*\}/, '下载清理应通过可取消 helper 调度并在触发后归零');
    assert.match(source, /removeButtons\(\)\s*\{[\s\S]*this\.clearDownloadCleanupTimer\(\);[\s\S]*document\.querySelectorAll\(this\.WRAP_SELECTOR\)/, '离开潜力词目标页时应释放 pending 下载清理');
    assert.match(downloadBlock, /this\.scheduleDownloadCleanup\(link\);/, 'downloadCsv 应委托下载清理调度 helper');
    assert.doesNotMatch(downloadBlock, /setTimeout\(\(\) => \{[\s\S]*URL\.revokeObjectURL\(link\.href\);[\s\S]*link\.remove\(\);[\s\S]*\}, 0\);/, 'downloadCsv 不应继续排无句柄 object URL 清理 timeout');
});

test('潜力词导出入口样式收敛到统一浅玻璃 token', () => {
    const block = getPotentialStyleBlock();

    assert.match(block, /\.am-potential-plan-export-btn \{[\s\S]*position:\s*relative;[\s\S]*height:\s*32px;[\s\S]*border:\s*1px solid var\(--am26-border\);[\s\S]*background:\s*var\(--am26-surface-strong\);[\s\S]*color:\s*var\(--am26-text\);/, '导出按钮缺少统一 token 基础样式');
    assert.match(block, /\.am-potential-plan-export-btn:hover,[\s\S]*\.am-potential-plan-export-btn:focus-visible \{[\s\S]*background:\s*var\(--am26-panel-strong\);[\s\S]*color:\s*var\(--am26-primary-strong\);[\s\S]*outline:\s*none;[\s\S]*transform:\s*translateY\(-1px\);/, '导出按钮 hover/focus 未收敛到统一反馈');
    assert.match(block, /\.am-potential-plan-export-icon svg \{[\s\S]*width:\s*13px;[\s\S]*stroke:\s*currentColor;/, '导出按钮图标应继承 currentColor');
    assert.match(block, /\.am-potential-plan-export-btn \.am-potential-plan-export-days-input \{[\s\S]*border:\s*1px solid var\(--am26-border\) !important;[\s\S]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.58\) !important;[\s\S]*color:\s*var\(--am26-text\) !important;/, '导出天数输入缺少 token 化样式');
    assert.match(block, /\.am-potential-plan-export-btn \.am-potential-plan-export-days-input:focus-visible \{[\s\S]*border-color:\s*rgba\(69,\s*84,\s*229,\s*0\.42\) !important;[\s\S]*box-shadow:\s*0 0 0 2px rgba\(69,\s*84,\s*229,\s*0\.12\) !important;/, '导出天数输入缺少可见 focus 态');
    assert.match(block, /\.am-potential-plan-export-status \{[\s\S]*clip:\s*rect\(0,\s*0,\s*0,\s*0\);/, '导出状态节点应视觉隐藏但可被读屏读取');
    assert.match(block, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.am-potential-plan-export-btn \{[\s\S]*transition:\s*none;[\s\S]*\.am-potential-plan-export-btn:hover,[\s\S]*transform:\s*none;/, '潜力词导出入口缺少减少动画适配');

    assert.doesNotMatch(block, /border:\s*1px solid #e4e7f0|background:\s*#fff|color:\s*#333|background:\s*#f0f2f5|color:\s*#334155|color:\s*#64748b/, '潜力词导出入口不应保留旧硬编码白按钮色值');
});
