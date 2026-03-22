    // ==========================================
    // 4. UI 界面 (View) - 参考算法护航脚本样式
    // ==========================================
    const UI = {
        runtime: {
            assistExpanded: false,
            scrollChainGuardBound: false
        },

        init() {
            this.injectStyles();
            this.createElements();
            this.bindEvents();
            this.updateState();
        },

        bindPluginScrollChainGuard() {
            if (this.runtime.scrollChainGuardBound) return;
            this.runtime.scrollChainGuardBound = true;
            document.addEventListener('wheel', (event) => {
                if (event.defaultPrevented || event.ctrlKey) return;
                const target = event.target;
                if (!(target instanceof Element)) return;
                const pluginRoot = target.closest('#am-helper-panel, #am-magic-report-popup, #alimama-escort-helper-ui, #am-campaign-concurrent-log-popup, #am-report-capture-panel');
                if (!(pluginRoot instanceof HTMLElement)) return;
                if (!this.shouldBlockPluginWheel(pluginRoot, target, event.deltaY)) return;
                event.preventDefault();
                event.stopPropagation();
            }, { capture: true, passive: false });
        },

        shouldBlockPluginWheel(pluginRoot, startNode, deltaY) {
            if (!Number.isFinite(deltaY) || deltaY === 0) return false;
            let node = startNode;
            while (node instanceof HTMLElement) {
                const style = window.getComputedStyle(node);
                const overflowY = style.overflowY;
                const isScrollable = /(auto|scroll|overlay)/.test(overflowY) && node.scrollHeight > node.clientHeight + 1;
                if (isScrollable) {
                    const atTop = node.scrollTop <= 0;
                    const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
                    if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) return false;
                }
                if (node === pluginRoot) break;
                node = node.parentElement;
            }
            return true;
        },

        injectStyles() {
            // 强制更新样式：如果存在旧 ID 的样式标签，先移除
            const oldStyle = document.getElementById('am-helper-mac26-style');
            if (oldStyle) oldStyle.remove();

            if (document.getElementById('am-helper-pro-v26-style')) return;
            const css = `
                :root {
                    --am26-font: "SF Pro Display", "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif;
                    --am26-mono: "SF Mono", "JetBrains Mono", "Menlo", "Monaco", "Consolas", monospace;
                    --am26-text: #1b2438;
                    --am26-text-soft: #505a74;
                    --am26-border: rgba(255, 255, 255, 0.4);
                    --am26-border-strong: rgba(255, 255, 255, 0.6);
                    --am26-surface: rgba(255, 255, 255, 0.25);
                    --am26-surface-strong: rgba(255, 255, 255, 0.45);
                    --am26-panel: linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.1));
                    --am26-panel-strong: linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2));
                    --am26-primary: rgba(69, 84, 229, 1);
                    --am26-primary-strong: #1d3fcf;
                    --am26-primary-soft: rgba(42, 91, 255, 0.15);
                    --am26-success: #0ea86f;
                    --am26-warning: #e8a325;
                    --am26-danger: #ea4f4f;
                    --am26-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
                    --am26-glow: inset 0 0 0 1px rgba(255, 255, 255, 0.3);
                    --mx-number-report-brand-color: rgba(69,84,229,1);
                    --mx-number-report-brand-color50: rgba(69,84,229,0.5);
                    --mx-number-report-brand-color10: rgba(69,84,229,0.1);
                    --mx-number-report-brand-color1: rgba(69,84,229,0.01);
                }

                #am-helper-panel,
                #am-magic-report-popup,
                #alimama-escort-helper-ui,
                #am-report-capture-panel,
                #alimama-escort-helper-ui-result-overlay > div {
                    font-family: var(--am26-font) !important;
                    color: var(--am26-text) !important;
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    box-shadow: var(--am26-shadow) !important;
                    border: 1px solid var(--am26-border) !important;
                    overscroll-behavior: contain;
                }

                /* 悬浮球（最小化按钮） */
                #am-helper-icon {
                    position: fixed; top: 120px; right: 20px; z-index: 999999;
                    width: 40px; height: 40px; border-radius: 50%;
                    border: 1px solid var(--am26-border);
                    background: var(--am26-surface-strong);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    box-shadow: var(--am26-shadow), var(--am26-glow);
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    color: var(--am26-primary);
                    transition: all 0.3s ease;
                }
                #am-helper-icon:hover {
                    transform: translateY(-1px) scale(1.08);
                    border-color: var(--am26-border-strong);
                    color: var(--am26-primary-strong);
                    background: rgba(255,255,255,0.6);
                }

                /* 主面板 */
                #am-helper-panel {
                    position: fixed; top: 120px; right: 20px; z-index: 999999;
                    background: var(--am26-panel);
                    border-radius: 18px;
                    width: 280px; min-width: 250px; max-width: 500px;
                    opacity: 1; transform: scale(1); transform-origin: top right;
                    transition: opacity 0.3s ease, transform 0.3s ease, width 0.5s ease;
                    overflow: hidden;
                }
                #am-helper-panel.hidden {
                    opacity: 0; transform: scale(0.8); pointer-events: none;
                }

                /* 头部 */
                .am-header {
                    padding: 14px 18px;
                    border-bottom: 1px solid var(--am26-border);
                    background: rgba(255, 255, 255, 0.1);
                    display: flex; justify-content: space-between; align-items: center;
                }
                .am-title {
                    font-weight: 600; font-size: 15px; color: var(--am26-text);
                    display: flex; align-items: center; gap: 8px;
                    text-shadow: 0 1px 0 rgba(255,255,255,0.4);
                }
                .am-version {
                    font-size: 10px; color: var(--am26-text-soft); font-weight: normal;
                    background: rgba(255,255,255,0.3); padding: 1px 4px; border-radius: 6px;
                }
                .am-icon-btn {
                    cursor: pointer; color: var(--am26-text-soft); font-size: 16px; font-weight: bold;
                    width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
                    border-radius: 8px; transition: all 0.2s;
                }
                .am-icon-btn:hover { background: rgba(255, 255, 255, 0.3); color: var(--am26-text); }
                .am-icon-btn.danger:hover { background: rgba(234, 79, 79, 0.15); color: var(--am26-danger); }

                .am-close-btn {
                    cursor: pointer; color: var(--am26-text-soft); font-size: 16px; font-weight: bold;
                    width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
                    border-radius: 8px; transition: all 0.2s;
                }
                .am-close-btn:hover { background: rgba(255, 255, 255, 0.3); color: var(--am26-danger); }

                /* 内容区 */
                .am-body { padding: 18px; }



                .am-tools-row {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 8px;
                    margin-bottom: 0;
                }
                .am-tool-btn {
                    flex: 1; text-align: center; padding: 12px 0; border-radius: 10px;
                    background: var(--mx-number-report-brand-color1);
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    color: var(--am26-text-soft); font-size: 12px; font-weight: 500;
                    cursor: pointer; transition: all 0.3s;
                    display: flex; align-items: center; justify-content: center; gap: 4px;
                    white-space: nowrap;
                    word-break: keep-all;
                    flex-wrap: nowrap;
                    line-height: 1.2;
                }
                .am-tool-btn svg {
                    width: 14px;
                    height: 14px;
                    flex: 0 0 14px;
                }
                .am-tool-btn:hover {
                    background: var(--mx-number-report-brand-color10);
                    border-color: var(--mx-number-report-brand-color);
                    color: var(--mx-number-report-brand-color);
                    box-shadow: 0 0 10px var(--mx-number-report-brand-color50); /* 亮灯效果 */
                    transform: translateY(-1px);
                }
                .am-tool-btn.active {
                    background: linear-gradient(135deg, var(--mx-number-report-brand-color10), rgba(69, 84, 229, 0.2));
                    border-color: var(--mx-number-report-brand-color);
                    color: var(--mx-number-report-brand-color);
                    box-shadow: inset 0 0 0 1px var(--mx-number-report-brand-color10), 0 0 10px var(--mx-number-report-brand-color50);
                }

                #am-assist-switches {
                    max-height: 0;
                    opacity: 0;
                    transform: translateY(-6px);
                    overflow: hidden;
                    pointer-events: none;
                    margin-top: 0;
                    padding: 0 10px;
                    border-radius: 12px;
                    border: 1px solid transparent;
                    background: linear-gradient(135deg, rgba(69, 84, 229, 0.14), rgba(69, 84, 229, 0.04) 55%, rgba(255, 255, 255, 0.24));
                    transition: max-height 0.32s ease, opacity 0.24s ease, transform 0.32s ease, margin-top 0.32s ease, padding 0.32s ease, border-color 0.32s ease;
                }
                #am-assist-switches.open {
                    max-height: 220px;
                    opacity: 1;
                    transform: translateY(0);
                    pointer-events: auto;
                    margin-top: 10px;
                    padding: 12px 10px;
                    border-color: rgba(69, 84, 229, 0.22);
                }

                .am-switches-grid {
                    display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
                }
                .am-switch-btn {
                    height: 36px; /* 固定高度 */
                    text-align: center; font-size: 12px; border-radius: 10px;
                    border: 1px solid #e0e0e0; /* 默认浅灰色边框 */
                    background: rgba(255, 255, 255, 0.4);
                    color: var(--am26-text-soft); cursor: pointer; transition: all 0.3s;
                    display: flex; align-items: center; justify-content: center;
                }
                .am-switch-btn:hover {
                    background: rgba(255, 255, 255, 0.8);
                    border-color: var(--mx-number-report-brand-color);
                    box-shadow: 0 0 8px var(--mx-number-report-brand-color10); /* 亮灯效果 */
                }
                .am-switch-btn.active {
                    background: var(--mx-number-report-brand-color10);
                    border-color: var(--mx-number-report-brand-color);
                    color: var(--mx-number-report-brand-color); font-weight: 600;
                    box-shadow: inset 0 0 4px var(--mx-number-report-brand-color10);
                }

                .am-campaign-id-token {
                    display: inline;
                }
                .am-campaign-search-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    margin-left: 2px;
                    -webkit-appearance: none;
                    appearance: none;
                    border: 0;
                    background: transparent;
                    color: #a3adb8;
                    line-height: 1;
                    cursor: pointer;
                    user-select: none;
                    vertical-align: middle;
                    padding: 0;
                    transition: color 0.18s ease, opacity 0.18s ease;
                }
                .am-campaign-hover-host .am-campaign-search-btn {
                    opacity: 0;
                    visibility: hidden;
                    pointer-events: none;
                }
                .am-campaign-hover-host:hover .am-campaign-search-btn,
                .am-campaign-hover-host:focus-within .am-campaign-search-btn,
                .am-campaign-search-btn:focus-visible {
                    opacity: 1;
                    visibility: visible;
                    pointer-events: auto;
                }
                .am-campaign-search-btn:hover {
                    color: #6b7480;
                }
                .am-campaign-concurrent-start-btn:hover {
                    color: #157a43;
                }
                .am-campaign-search-btn.is-running {
                    color: #1677ff;
                    opacity: 0.72;
                    visibility: visible;
                    pointer-events: none;
                }
                .am-campaign-search-btn svg {
                    width: 11px;
                    height: 11px;
                    display: block;
                    fill: currentColor;
                    pointer-events: none;
                }
                .am-potential-plan-export-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    margin-left: 6px;
                    gap: 4px;
                    height: 32px;
                    padding: 0 12px;
                    border: 1px solid #e4e7f0;
                    border-radius: 8px;
                    background: #fff;
                    color: #333;
                    font-size: 12px;
                    font-weight: 400;
                    line-height: normal;
                    cursor: pointer;
                    transition: all 0.18s ease;
                    vertical-align: middle;
                    white-space: nowrap;
                }
                .am-potential-plan-export-btn:hover {
                    border-color: #d5dbe8;
                    background: #fff;
                    color: #111827;
                }
                .am-potential-plan-export-btn.is-running {
                    opacity: 0.72;
                    pointer-events: none;
                }
                .am-potential-plan-export-wrap {
                    display: inline-block;
                    margin-left: 8px;
                    vertical-align: middle;
                }
                .am-potential-plan-export-btn .am-potential-plan-export-days-input {
                    width: 44px !important;
                    min-width: 44px;
                    height: 20px !important;
                    border: 0 !important;
                    border-radius: 4px;
                    background: #f0f2f5 !important;
                    color: #334155 !important;
                    font-size: 12px;
                    line-height: 20px;
                    padding: 0 1px !important;
                    margin: 0;
                    box-sizing: border-box;
                    text-align: center;
                    box-shadow: none !important;
                    outline: none;
                    appearance: auto !important;
                    -webkit-appearance: auto !important;
                }
                .am-potential-plan-export-btn .am-potential-plan-export-days-input:disabled {
                    opacity: 1;
                    -webkit-text-fill-color: #334155;
                }
                .am-potential-plan-export-days-unit {
                    color: #64748b;
                    font-size: 12px;
                    line-height: normal;
                }
                .am-potential-plan-export-label {
                    margin-left: 4px;
                }
                #am-campaign-concurrent-log-popup {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.45);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 2147483646;
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-card {
                    width: min(760px, calc(100vw - 24px));
                    max-height: min(78vh, 720px);
                    display: flex;
                    flex-direction: column;
                    border-radius: 14px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    background: #ffffff;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
                    overflow: hidden;
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 14px;
                    font-size: 14px;
                    font-weight: 600;
                    color: #111827;
                    border-bottom: 1px solid #eef1f5;
                    background: linear-gradient(180deg, #f9fbff 0%, #f4f7fb 100%);
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-close {
                    border: 0;
                    background: transparent;
                    color: #6b7280;
                    font-size: 18px;
                    line-height: 1;
                    cursor: pointer;
                    padding: 0 2px;
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-status {
                    padding: 10px 14px;
                    border-bottom: 1px solid #eef1f5;
                    font-size: 12px;
                    color: #1f2937;
                    background: #f8fafc;
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-status.is-running {
                    color: #0f4fce;
                    background: #eff6ff;
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-status.is-success {
                    color: #0f6b3f;
                    background: #edf9f2;
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-status.is-error {
                    color: #a43131;
                    background: #fff1f1;
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-body {
                    flex: 1;
                    overflow: auto;
                    overscroll-behavior: contain;
                    background: #0f172a;
                    padding: 10px 12px;
                    font-family: var(--am26-mono);
                    font-size: 12px;
                    line-height: 1.5;
                    color: #dbe4ff;
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-line {
                    white-space: pre-wrap;
                    word-break: break-word;
                    margin-bottom: 6px;
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-line.is-error {
                    color: #ffb3b3;
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-line.is-warn {
                    color: #ffe08a;
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-line.is-success {
                    color: #99f6c6;
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-line:last-child {
                    margin-bottom: 0;
                }

                /* 算法护航弹窗居中 */
                #alimama-escort-helper-ui {
                    top: 50% !important; left: 50% !important;
                    transform: translate(-50%, -50%) !important;
                    max-height: 90vh; overflow-y: auto;
                    overscroll-behavior: contain;
                }

                /* 日志区 */
                .am-log-section { margin-top: 16px; }
                .am-log-header {
                    display: flex; justify-content: space-between; align-items: center;
                    font-size: 12px; color: var(--am26-text-soft); margin-bottom: 8px; padding: 0 4px;
                }
                .am-action-btn {
                    cursor: pointer; color: var(--am26-text-soft); margin-left: 10px;
                    padding: 2px 8px; border-radius: 4px; transition: all 0.2s;
                    background: rgba(255,255,255,0.2);
                }
                .am-action-btn:hover { background: rgba(255, 255, 255, 0.5); color: var(--am26-primary-strong); }
                #am-log-content {
                    height: 100px; overflow-y: auto;
                    overscroll-behavior: contain;
                    background: rgba(0, 0, 0, 0.03);
                    border: 1px solid inset rgba(0,0,0,0.05);
                    border-radius: 10px;
                    padding: 10px;
                    font-size: 11px;
                    color: var(--am26-text);
                    font-family: var(--am26-mono);
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);
                    transition: all 0.3s ease;
                }
                #am-log-content.collapsed { height: 0; padding: 0; border: none; opacity: 0; }
                .am-log-line {
                    padding: 3px 0; line-height: 1.5;
                    border-bottom: 1px dashed rgba(0, 0, 0, 0.1);
                }
                .am-log-line:last-child { border-bottom: none; }
                .am-log-time { color: rgba(0,0,0,0.4); margin-right: 6px; }

                /* 拖拽调整宽度 */
                .am-resizer-left {
                    position: absolute; left: 0; top: 0; bottom: 0; width: 6px;
                    cursor: ew-resize; z-index: 10; transition: background 0.2s;
                }
                .am-resizer-left:hover { background: rgba(42, 91, 255, 0.22); }

                /* 报表捕获弹窗 */
                #am-report-capture-panel {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 340px;
                    padding: 14px;
                    border-radius: 12px;
                    border: 1px solid var(--am26-border);
                    background: var(--am26-panel-strong);
                    color: var(--am26-text);
                    z-index: 2147483647;
                    display: none;
                }
                #am-report-capture-panel .am-download-header {
                    margin-bottom: 10px;
                    font-weight: 600;
                    color: var(--am26-primary-strong);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                #am-report-capture-panel .am-download-source {
                    color: var(--am26-text-soft);
                    font-size: 10px;
                }
                #am-report-capture-panel .am-download-url {
                    background: rgba(255, 255, 255, 0.60);
                    border: 1px solid var(--am26-border);
                    border-radius: 8px;
                    margin-bottom: 12px;
                    padding: 8px;
                    word-break: break-all;
                    font-size: 11px;
                    color: var(--am26-text-soft);
                    max-height: 56px;
                    overflow: hidden;
                }
                #am-report-capture-panel .am-download-actions {
                    display: flex;
                    gap: 10px;
                }
                #am-report-capture-panel .am-download-link,
                #am-report-capture-panel .am-download-btn {
                    border: 1px solid transparent;
                    border-radius: 8px;
                    padding: 8px 0;
                    text-align: center;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                #am-report-capture-panel .am-download-link {
                    flex: 2;
                    text-decoration: none;
                    background: linear-gradient(135deg, var(--am26-primary), var(--am26-primary-strong));
                    color: #fff;
                }
                #am-report-capture-panel .am-download-btn {
                    background: rgba(255, 255, 255, 0.72);
                    border-color: var(--am26-border);
                    color: var(--am26-text-soft);
                }
                #am-report-capture-panel .am-download-btn:hover,
                #am-report-capture-panel .am-download-link:hover {
                    transform: translateY(-1px);
                }
                #am-report-capture-panel .am-download-copy { flex: 1; }
                #am-report-capture-panel .am-download-close { flex: 0.5; }
                #am-report-capture-panel .am-download-hint {
                    margin-top: 8px;
                    font-size: 10px;
                    color: var(--am26-text-soft);
                }

                #am-magic-report-popup {
                    background: var(--am26-panel-strong) !important;
                }
                #am-magic-report-popup .am-magic-header {
                    background: rgba(255, 255, 255, 0.3) !important;
                }

                #alimama-escort-helper-ui [id$="-log-wrapper"] {
                    background: rgba(255, 255, 255, 0.4) !important;
                }
                #alimama-escort-helper-ui input {
                    background: rgba(255, 255, 255, 0.5) !important;
                }
                #alimama-escort-helper-ui .card-header {
                    background: rgba(255, 255, 255, 0.4) !important;
                }
                #alimama-escort-helper-ui .card-body {
                    background: rgba(255, 255, 255, 0.2) !important;
                }

                /* Mobile/Small screen adaptations */
                @media (max-width: 1080px) {
                    #am-magic-report-popup {
                        width: min(96vw, 900px) !important;
                        left: 50% !important;
                        transform: translateX(-50%) !important;
                    }
                    #am-helper-panel,
                    #alimama-escort-helper-ui {
                        max-width: calc(100vw - 24px) !important;
                    }
                }

                /* Native Style for Optimizer Trigger */
                #am-trigger-optimizer {
                    --line-height: 1.5;
                    --font-size: 12px;
                    --font-family: PingFangSC-Regular,PingFang SC,"Microsoft Yahei","SimHei",sans-serif;
                    --font-number: Tahoma;
                    --font-color: #333;
                    --font-color-hover: #333;
                    --font-color-active: var(--color-brand);
                    --font-color-secondary: #666;
                    --font-color-tip: #999;
                    --anchor-font-color: #333;
                    --app-nav-bg: #303a58;
                    --app-bg: #f9f9f9;
                    --app-min-width: 1418px;
                    --color-brand: #4554e5;
                    --color-brand-gradient: #4554e5;
                    --color-brand-hover: #3325d4;
                    --color-brand-hover-gradient: #3325d4;
                    --color-brand-vs: #f5714d;
                    --color-brand-light: rgba(69,84,229,.2);
                    --color-brand-opacity: rgba(69,84,229,.1);
                    --color-brand-text: #fff;
                    --color-brand-text-hover: #fff;
                    --color-brand-opacity5: rgba(69,84,229,.05);
                    --color-brand-opacity10: rgba(69,84,229,.1);
                    --color-brand-opacity20: rgba(69,84,229,.2);
                    --color-brand-opacity50: rgba(69,84,229,.5);
                    --color-bg: #f8f9fa;
                    --color-bg-hover: var(--color-brand-opacity);
                    --color-bg-active: var(--color-brand-opacity);
                    --input-v-gap: 8px;
                    --input-h-gap: 8px;
                    --input-min-width: 64px;
                    --input-height: 32px;
                    --input-font-size: var(--font-size);
                    --input-icon-size: 16px;
                    --input-icon-gap: 4px;
                    --border-radius: 8px;
                    --input-small-v-gap: 8px;
                    --input-small-h-gap: 8px;
                    --input-small-min-width: 48px;
                    --input-small-height: 24px;
                    --input-small-font-size: var(--font-size);
                    --input-small-icon-size: 12px;
                    --input-small-icon-gap: 4px;
                    --border-small-radius: 6px;
                    --input-large-v-gap: 8px;
                    --input-large-h-gap: 8px;
                    --input-large-min-width: 80px;
                    --input-large-height: 40px;
                    --input-large-font-size: calc(var(--font-size) + 2px);
                    --input-large-icon-size: 20px;
                    --input-large-icon-gap: 4px;
                    --border-large-radius: 10px;
                    --input-gap-border: #e4e7f0;
                    --bg-highlight: #f0f2f5;
                    --border-highlight: #f0f2f5;
                    --border-highlight-shadow: none;
                    --bg-highlight-hover: #e4e7f0;
                    --border-highlight-hover: #e4e7f0;
                    --border-highlight-shadow-hover: none;
                    --bg-highlight-active: #fff;
                    --border-highlight-active-opacity: 0.5;
                    --border-highlight-active: rgba(69,84,229,var(--border-highlight-active-opacity));
                    --border-highlight-shadow-active-h: 0px;
                    --border-highlight-shadow-active-v: 2px;
                    --border-highlight-shadow-active-blur: 4px;
                    --border-highlight-shadow-active-opacity: 0.2;
                    --border-highlight-shadow-active: var(--border-highlight-shadow-active-h) var(--border-highlight-shadow-active-v) var(--border-highlight-shadow-active-blur) 0 rgba(69,84,229,var(--border-highlight-shadow-active-opacity));
                    --output-bg: #fff;
                    --output-color: var(--font-color,#333);
                    --output-color-hover: var(--font-color-hover,#333);
                    --output-color-active: var(--font-color-active,var(--color-brand));
                    --output-small-v-gap: 8px;
                    --output-small-h-gap: 16px;
                    --output-small-border-radius: 8px;
                    --output-v-gap: 16px;
                    --output-h-gap: 24px;
                    --output-border-radius: 24px;
                    --output-large-v-gap: 24px;
                    --output-large-h-gap: 24px;
                    --output-large-border-radius: 16px;
                    --output-small-offset: 8px;
                    --output-small-item-max-height: 244px;
                    --output-small-item-height: var(--input-small-height);
                    --output-small-item-fontsize: 12px;
                    --output-offset: 8px;
                    --output-item-max-height: 312px;
                    --output-item-height: var(--input-height);
                    --output-item-fontsize: 12px;
                    --output-large-offset: 8px;
                    --output-large-item-max-height: 380px;
                    --output-large-item-height: var(--input-large-height);
                    --output-large-item-fontsize: 14px;
                    --btn-brand: var(--color-brand);
                    --btn-brand-gradient: var(--color-brand-gradient);
                    --btn-brand-shadow: none;
                    --btn-brand-text: var(--color-brand-text);
                    --btn-brand-hover: var(--color-brand-hover);
                    --btn-brand-gradient-hover: var(--color-brand-hover-gradient);
                    --btn-brand-shadow-hover-h: 0px;
                    --btn-brand-shadow-hover-v: 2px;
                    --btn-brand-shadow-hover-blur: 10px;
                    --btn-brand-shadow-hover-opacity: 0.4;
                    --btn-brand-shadow-hover: var(--btn-brand-shadow-hover-h,0px) var(--btn-brand-shadow-hover-v,2px) var(--btn-brand-shadow-hover-blur,10px) 0 rgba(69,84,229,var(--btn-brand-shadow-hover-opacity,0.4));
                    --btn-brand-text-hover: var(--color-brand-text-hover);
                    --btn-border: #e4e7f0;
                    --btn-bg: #fff;
                    --btn-text: #333;
                    --btn-border-hover: rgba(69,84,229,.5);
                    --btn-bg-hover: #fff;
                    --btn-text-hover: var(--color-brand);
                    --btn-h-gap: 12px;
                    --btn-min-width: var(--input-min-width);
                    --btn-font-size: var(--input-font-size);
                    --btn-border-radius: 500px;
                    --btn-small-h-gap: 12px;
                    --btn-small-min-width: var(--input-small-min-width);
                    --btn-small-font-size: var(--input-small-font-size);
                    --btn-small-border-radius: 500px;
                    --btn-large-h-gap: 12px;
                    --btn-large-min-width: var(--input-large-min-width);
                    --btn-large-font-size: var(--input-large-font-size);
                    --btn-large-border-radius: 500px;
                    --btn-font-weight: normal;
                    --btn-small-font-weight: normal;
                    --btn-large-font-weight: normal;
                    --color-border: #e4e7f0;
                    --color-warn: #ffa53d;
                    --color-red: #ff4d4d;
                    --color-green: #08bf81;
                    --color-blue: #6a76ea;
                    --duration: 0.2s;
                    --mx-text-placeholder: #999;
                    --mx-trigger-color: var(--font-color,#333);
                    --mx-trigger-color-hover: var(--font-color,#333);
                    --mx-trigger-color-active: var(--font-color,#333);
                    --mx-trigger-tag-bg: #fff;
                    --mx-trigger-tag-color: #333;
                    --mx-trigger-tag-arrow-color: #999;
                    --mx-trigger-tag-bg-hover: #fff;
                    --mx-trigger-tag-color-hover: #333;
                    --mx-trigger-tag-arrow-color-hover: #999;
                    --mx-trigger-tag-bg-active: var(--color-brand-opacity);
                    --mx-trigger-tag-color-active: #333;
                    --mx-trigger-tag-arrow-color-active: #999;
                    --mx-trigger-tag-height: calc(var(--input-height) - 8px);
                    --mx-trigger-arrow-size: 16px;
                    --mx-trigger-arrow-color: #999;
                    --mx-trigger-arrow-color-hover: #666;
                    --mx-trigger-arrow-color-active: #666;
                    --mx-trigger-prefix-icon: #666;
                    --mx-trigger-prefix-text: #666;
                    --mx-comp-disabled-opacity: 0.4;
                    --mx-comp-expand-amin-color: var(--color-brand);
                    --mx-comp-expand-amin-timer: 300ms;
                    --mx-comp-expand-amin-ease: ease-out;
                    --mx-grid-bg: #fff;
                    --mx-grid-body-v-top: var(--output-v-gap,16px);
                    --mx-grid-body-v-bottom: var(--output-v-gap,16px);
                    --mx-grid-border-radius: var(--output-border-radius,24px);
                    --mx-grid-h-gap: var(--output-h-gap,24px);
                    --mx-grid-title-bg: transparent;
                    --mx-grid-title-v-gap: 16px;
                    --mx-grid-title-font-size: 16px;
                    --mx-grid-title-font-weight: bold;
                    --mx-grid-title-color-border: var(--color-border);
                    --mx-grid-title-link-font-size: 12px;
                    --mx-grid-title-link-color: var(--color-brand);
                    --mx-grid-title-link-color-hover: var(--color-brand-hover);
                    --mx-grid-shadow: 0 4px 10px 0 hsla(16,7%,67%,.2);
                    --mx-grid-gap: 16px;
                    --mx-checkbox-size: 14px;
                    --mx-checkbox-border-radius: 4px;
                    --mx-checkbox-border: #dde1eb;
                    --mx-checkbox-bg: #fff;
                    --mx-checkbox-shadow: none;
                    --mx-checkbox-border-hover: #dde1eb;
                    --mx-checkbox-shadow-hover: 0 0 4px 0 rgba(0,0,0,.16);
                    --mx-checkbox-bg-hover: #fff;
                    --mx-table-font-size: var(--font-size);
                    --mx-table-ceil-h-gap: 8px;
                    --mx-table-ceil-v-gap: 12px;
                    --mx-table-ceil-small-h-gap: 4px;
                    --mx-table-ceil-small-v-gap: 4px;
                    --mx-table-ceil-large-h-gap: 24px;
                    --mx-table-ceil-large-v-gap: 24px;
                    --mx-table-ceil-text-align: left;
                    --mx-table-ceil-vertical-align: middle;
                    --mx-table-ceil-font-color: #333;
                    --mx-table-head-line-number: 2;
                    --mx-table-head-border: 1px solid var(--color-border);
                    --mx-table-head-height: 60px;
                    --mx-table-head-small-height: 40px;
                    --mx-table-head-large-height: 80px;
                    --mx-table-head-group-height: 80px;
                    --mx-table-head-bg: #fff;
                    --mx-table-head-font-size: 12px;
                    --mx-table-head-font-color: #333;
                    --mx-table-head-font-weight: bold;
                    --mx-table-hover-bg: #f8f9fa;
                    --mx-table-hover-oper-bg: #e4e7f0;
                    --mx-table-scrollbar-bg: #333;
                    --mx-effects-card-color-bg: #fff;
                    --mx-effects-card-title-font-size: 18px;
                    --mx-effects-card-sub-title-font-size: 14px;
                    --mx-effects-card-tip-font-size: 12px;
                    --mx-effects-card-color-border: var(--color-border);
                    --mx-effects-card-shadow: 0 1px 4px 0 hsla(0,0%,73%,.5);
                    --mx-effects-tag-mode: opacity;
                    --mx-effects-tag-height: 16px;
                    --mx-effects-tag-border-radius: calc(var(--mx-effects-tag-height, 16px)/2);
                    --mx-effects-tag-h-gap: 6px;
                    --mx-effects-tag-font-size: 20px;
                    --mx-effects-tag-font-scale: 0.5;
                    --mx-effects-large-tag-height: 18px;
                    --mx-effects-large-tag-border-radius: calc(var(--mx-effects-large-tag-height, 16px)/2);
                    --mx-effects-large-tag-h-gap: 8px;
                    --mx-effects-large-tag-font-size: 12px;
                    --mx-effects-large-tag-font-scale: 1;
                    --mx-effects-notice-border-radius: var(--border-radius);
                    --mx-effects-notice-v-gap: 8px;
                    --mx-effects-notice-h-gap: var(--output-h-gap,24px);
                    --mx-effects-notice-fontsize: 12px;
                    --mx-effects-notice-line-height: 20px;
                    --mx-effects-notice-round-height: 40px;
                    --mx-effects-progress-height: 6px;
                    --mx-effects-progress-num-height: 24px;
                    --mx-effects-progress-bg: #e4e7f0;
                    --mx-dialog-text-align: left;
                    --mx-dialog-color-bg: #e8ebf2;
                    --mx-dialog-shadow: 0 2px 10px 0 rgba(0,0,0,.16);
                    --mx-dialog-body-border-color: 0 none;
                    --mx-tabs-line-item-gap: 16px;
                    --mx-tabs-line-v-gap: var(--mx-grid-title-v-gap);
                    --mx-tabs-line-h-gap: 12px;
                    --mx-tabs-line-font-size: var(--mx-grid-title-font-size,16px);
                    --mx-tabs-line-font-weight: 500;
                    --mx-tabs-line-small-v-gap: calc(var(--mx-grid-title-v-gap)/2);
                    --mx-tabs-line-small-h-gap: 12px;
                    --mx-tabs-line-small-font-size: 12px;
                    --mx-tabs-line-small-font-weight: 500;
                    --mx-tabs-line-border-color: var(--color-border);
                    --mx-tabs-line-color: #333;
                    --mx-tabs-line-color-hover: var(--color-brand);
                    --mx-tabs-line-color-active: var(--color-brand);
                    --mx-tabs-line-bg-hover: var(--color-brand-opacity);
                    --mx-tabs-box-bg: var(--bg-highlight);
                    --mx-tabs-box-bg-hover: var(--bg-highlight-hover);
                    --mx-tabs-box-bg-active: var(--color-brand-opacity);
                    --mx-tabs-box-border: var(--border-highlight);
                    --mx-tabs-box-border-hover: var(--border-highlight-hover);
                    --mx-tabs-box-border-active: var(--border-highlight-active);
                    --mx-tabs-box-color: #666;
                    --mx-tabs-box-color-hover: #333;
                    --mx-tabs-box-color-active: var(--color-brand);
                    --mx-tabs-box-arrow: #999;
                    --mx-tabs-box-arrow-hover: #666;
                    --mx-tabs-box-arrow-active: var(--color-brand);
                    --mx-tabs-box-discrete-gap: 8px;
                    --mx-large-block-outer-gap: 16px;
                    --mx-large-block-v-gap: 12px;
                    --mx-large-block-h-gap: 12px;
                    --mx-large-block-line-height: 18px;
                    --mx-large-block-bg: transparent;
                    --mx-large-block-bg-hover: transparent;
                    --mx-large-block-bg-active: var(--color-brand-opacity5,var(--color-brand-opacity));
                    --mx-large-block-border: var(--color-border);
                    --mx-large-block-border-hover: var(--border-highlight-active);
                    --mx-large-block-border-active: var(--border-highlight-active);
                    --mx-tabs-menu-line-color: #c3c9d9;
                    --mx-tabs-menu-width: 160px;
                    --mx-tabs-menu-height: var(--input-height);
                    --mx-tabs-menu-padding-gap: 12px;
                    --mx-tabs-menu-margin-gap: 8px;
                    --mx-tabs-menu-icon-size: 16px;
                    --mx-tabs-menu-hover-color: var(--color-brand);
                    --mx-tabs-menu-hover-bg: var(--color-brand-opacity);
                    --mx-tabs-menu-hover-shadow: 0 none;
                    --mx-tabs-menu-selected-color: #fff;
                    --mx-tabs-menu-selected-bg: var(--color-brand);
                    --mx-tabs-menu-selected-shadow: var(--border-highlight-shadow-active);
                    --mx-popover-v-gap: var(--input-v-gap);
                    --mx-popover-h-gap: var(--input-h-gap);
                    --mx-popover-arrow-size: 8px;
                    --mx-popover-arrow-gap: 24px;
                    --mx-popover-bg: var(--output-bg,#fff);
                    --mx-popover-color: var(--output-color,var(--font-color,#333));
                    --mx-popover-color-border: var(--color-border);
                    --mx-popover-shaodow: 0 4px 8px 0 rgba(0,0,0,.06);
                    --mx-pagination-align: left;
                    --mx-switch-width: 36px;
                    --mx-switch-height: 20px;
                    --mx-switch-icon-size: 14px;
                    --mx-switch-border-radius: 10px;
                    --mx-header-other-height: 48px;
                    --mx-header-menu-height: 58px;
                    --mx-carousel-zindex: 3;
                    --mx-carousel-triggers-size: 24px;
                    --mx-carousel-triggers-fontsize: 16px;
                    --mx-carousel-trigger-color: #fff;
                    --mx-carousel-trigger-bg: #dde1eb;
                    --mx-carousel-trigger-gap: 8px;
                    --mx-carousel-line-size: 16px;
                    --mx-carousel-dot-size: 8px;
                    --mx-main-nav-v-gap: 16px;
                    --mx-main-nav-h-gap: 16px;
                    --mx-main-nav-footer-height: 80px;
                    --mx-main-nav-info-width: 240px;
                    --mx-grey-box-border: #e4e7f0;
                    --mx-grey-box-bg: #f8f9fa;
                    --mx-grey-box-border-hover: var(--color-brand-opacity50,var(--color-brand));
                    --mx-grey-box-bg-hover: #f0f2f5;
                    --mx-market-color: #f257a8;
                    --mx-market-color-gradient: #ff0036;
                    --mx-market-color-border: #fcd5e5;
                    --mx-market-color-bg: #fff5f8;
                    --mx-market-color-hover: #df2e8b;
                    --mx-market-color-hover-gradient: #e80c20;
                    --mx-market-color-hover-border: #fcd5e5;
                    --mx-market-color-hover-bg: #fee3eb;
                    --mx-market-color-bg5: linear-gradient(135deg,#fff2f5,#fef6fa);
                    --mx-market-color-bg10: linear-gradient(135deg,#ffe6eb,#fdeef6);
                    --mx-mask-black: rgba(0,0,0,.6);
                    --mx-mask-white: hsla(0,0%,100%,.6);
                    --mx-mask-backdrop-filter: blur(2px);
                    --mx-ai-color: #33f;
                    --mx-ai-color-gradient: #93f;
                    --mx-ai-color-anim: #3cf;
                    --mx-ai-color-hover: #0c0cff;
                    --mx-ai-color-hover-gradient: #850cff;
                    --mx-ai-color-hover-anim: #0cc2ff;
                    --mx-ai-color-line-width-number: 2;
                    --mx-ai-color100: #33f;
                    --mx-ai-color90: #4747ff;
                    --mx-ai-color80: #5b5bff;
                    --mx-ai-color70: #7070ff;
                    --mx-ai-color60: #8484ff;
                    --mx-ai-color50: #99f;
                    --mx-ai-color40: #adadff;
                    --mx-ai-color30: #c1c1ff;
                    --mx-ai-color20: #d6d6ff;
                    --mx-ai-color10: #eaeaff;
                    --mx-ai-color5: #f4f4ff;
                    --mx-ai-color-gradient100: #93f;
                    --mx-ai-color-gradient90: #a347ff;
                    --mx-ai-color-gradient80: #ad5bff;
                    --mx-ai-color-gradient70: #b770ff;
                    --mx-ai-color-gradient60: #c184ff;
                    --mx-ai-color-gradient50: #c9f;
                    --mx-ai-color-gradient40: #d6adff;
                    --mx-ai-color-gradient30: #e0c1ff;
                    --mx-ai-color-gradient20: #ead6ff;
                    --mx-ai-color-gradient10: #f4eaff;
                    --mx-ai-color-gradient5: #f9f4ff;
                    --mx-ai-color-anim100: #3cf;
                    --mx-ai-color-anim90: #47d1ff;
                    --mx-ai-color-anim80: #5bd6ff;
                    --mx-ai-color-anim70: #70dbff;
                    --mx-ai-color-anim60: #84e0ff;
                    --mx-ai-color-anim50: #99e5ff;
                    --mx-ai-color-anim40: #adeaff;
                    --mx-ai-color-anim30: #c1efff;
                    --mx-ai-color-anim20: #d6f4ff;
                    --mx-ai-color-anim10: #eaf9ff;
                    --mx-ai-color-anim5: #f4fcff;
                    --mx-ai-color-line: linear-gradient(135deg,#33f,#3cf,#93f);
                    --mx-ai-color-line100: linear-gradient(135deg,#33f,#3cf,#93f);
                    --mx-ai-color-line90: linear-gradient(135deg,#4747ff,#47d1ff,#a347ff);
                    --mx-ai-color-line80: linear-gradient(135deg,#5b5bff,#5bd6ff,#ad5bff);
                    --mx-ai-color-line70: linear-gradient(135deg,#7070ff,#70dbff,#b770ff);
                    --mx-ai-color-line60: linear-gradient(135deg,#8484ff,#84e0ff,#c184ff);
                    --mx-ai-color-line50: linear-gradient(135deg,#99f,#99e5ff,#c9f);
                    --mx-ai-color-line40: linear-gradient(135deg,#adadff,#adeaff,#d6adff);
                    --mx-ai-color-line30: linear-gradient(135deg,#c1c1ff,#c1efff,#e0c1ff);
                    --mx-ai-color-line20: linear-gradient(135deg,#d6d6ff,#d6f4ff,#ead6ff);
                    --mx-ai-color-line10: linear-gradient(135deg,#eaeaff,#eaf9ff,#f4eaff);
                    --mx-ai-color-line5: linear-gradient(135deg,#f4f4ff,#f4fcff,#f9f4ff);
                    --mx-ai-color-bg: linear-gradient(135deg,#33f,#3cf,#93f);
                    --mx-ai-color-bg100: linear-gradient(135deg,#33f,#3cf,#93f);
                    --mx-ai-color-bg90: linear-gradient(135deg,#4747ff,#47d1ff,#a347ff);
                    --mx-ai-color-bg80: linear-gradient(135deg,#5b5bff,#5bd6ff,#ad5bff);
                    --mx-ai-color-bg70: linear-gradient(135deg,#7070ff,#70dbff,#b770ff);
                    --mx-ai-color-bg60: linear-gradient(135deg,#8484ff,#84e0ff,#c184ff);
                    --mx-ai-color-bg50: linear-gradient(135deg,#99f,#99e5ff,#c9f);
                    --mx-ai-color-bg40: linear-gradient(135deg,#adadff,#adeaff,#d6adff);
                    --mx-ai-color-bg30: linear-gradient(135deg,#c1c1ff,#c1efff,#e0c1ff);
                    --mx-ai-color-bg20: linear-gradient(135deg,#d6d6ff,#d6f4ff,#ead6ff);
                    --mx-ai-color-bg10: linear-gradient(135deg,#eaeaff,#eaf9ff,#f4eaff);
                    --mx-ai-color-bg5: linear-gradient(135deg,#f4f4ff,#f4fcff,#f9f4ff);
                    --mx-ai-color-bg-primary: linear-gradient(135deg,#eaeaff,#eaf9ff,#f4eaff);
                    --mx-ai-color-bg-secondary: linear-gradient(135deg,#f4f4ff,#f4fcff,#f9f4ff);
                    --mx-ai-color-line-primary: linear-gradient(135deg,#33f,#3cf,#93f);
                    --mx-ai-color-line-secondary: linear-gradient(135deg,#d6d6ff,#d6f4ff,#ead6ff);
                    --mx-ai-color-line-width: 2px;
                    --app-brand: var(--color-brand);
                    --app-brand-gradient: var(--color-brand-gradient);
                    --mx-grid-shadow-hover: var(--mx-grid-shadow);
                    --mx-checkbox-color: var(--mx-checkbox-border);
                    --mx-checkbox-hover-color: var(--mx-checkbox-border-hover);
                    --mx-checkbox-hover-shadow: var(--mx-checkbox-shadow-hover);
                    --mx-tag-mode: var(--mx-effects-tag-mode);
                    --mx-tag-height: var(--mx-effects-tag-height);
                    --mx-tag-border-radius: var(--mx-effects-tag-border-radius);
                    --mx-tag-h-gap: var(--mx-effects-tag-h-gap);
                    --mx-tag-font-size: var(--mx-effects-tag-font-size);
                    --mx-tag-font-scale: var(--mx-effects-tag-font-scale);
                    --mx-input-gap-border: var(--input-gap-border);
                    --mx-effects-card-v-gap: var(--output-large-v-gap);
                    --mx-effects-card-h-gap: var(--output-large-h-gap);
                    --mx-effects-card-radius: var(--output-large-border-radius);
                    --mx-tab-box-gap-border: var(--input-gap-border);
                    --mx-tab-box-bg: var(--mx-tabs-box-bg);
                    --mx-tab-box-bg-active: var(--mx-tabs-box-bg-active);
                    --mx-tab-box-border: var(--mx-tabs-box-border);
                    --mx-tab-box-border-active: var(--mx-tabs-box-border-active);
                    --mx-tab-box-color: var(--mx-tabs-box-color);
                    --mx-tab-box-color-hover: var(--mx-tabs-box-color-hover);
                    --mx-tab-box-color-active: var(--mx-tabs-box-color-active);
                    --mx-tab-v-gap: var(--mx-tabs-line-v-gap);
                    --mx-tab-h-gap: var(--mx-tabs-line-h-gap);
                    --mx-tab-first-h-gap: var(--mx-grid-h-gap,24px);
                    --mx-tab-font-size: var(--mx-tabs-line-font-size);
                    --mx-tab-font-weight: var(--mx-tabs-line-font-weight);
                    --mx-tab-border-color: var(--mx-tabs-line-border-color);
                    --mx-tab-color: var(--mx-tabs-line-color);
                    --mx-tab-color-hover: var(--mx-tabs-line-color-hover);
                    --mx-tab-color-active: var(--mx-tabs-line-color-active);
                    --mx-tab-box-arrow-bg: var(--mx-tabs-box-arrow);
                    --mx-tab-box-arrow-bg-hover: var(--mx-tabs-box-arrow-hover);
                    --mx-tab-box-arrow-bg-active: var(--mx-tabs-box-arrow-active);
                    --mx-trigger-v-gap: var(--input-v-gap);
                    --mx-trigger-h-gap: var(--input-h-gap);
                    --mx-trigger-min-width: var(--input-min-width);
                    --mx-trigger-font-size: var(--input-font-size);
                    --mx-trigger-small-v-gap: var(--input-small-v-gap);
                    --mx-trigger-small-h-gap: var(--input-small-h-gap);
                    --mx-trigger-small-min-width: var(--input-small-min-width);
                    --mx-trigger-small-font-size: var(--input-small-font-size);
                    --mx-trigger-large-v-gap: var(--input-large-v-gap);
                    --mx-trigger-large-h-gap: var(--input-large-h-gap);
                    --mx-trigger-large-min-width: var(--input-large-min-width);
                    --mx-trigger-large-font-size: var(--input-large-font-size);
                    --mx-trigger-output-gap: var(--output-offset);
                    --mx-trigger-output-height: var(--output-item-height);
                    --mx-comp-v-gap: var(--output-v-gap);
                    --mx-comp-h-gap: var(--output-h-gap);
                    --mx-comp-shadow: var(--mx-dialog-shadow);
                    --mx-custom-layout-width: 80px;
                    --mx-custom-layout-h-gap: 16px;
                    --mx-custom-layout-v-gap: 16px;
                    --mx-custom-layout-icon-width: 32px;
                    --mx-custom-layout-icon-height: 32px;
                    --am26-font: "SF Pro Display", "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif;
                    --am26-mono: "SF Mono", "JetBrains Mono", "Menlo", "Monaco", "Consolas", monospace;
                    --am26-text: #1b2438;
                    --am26-text-soft: #505a74;
                    --am26-border: rgba(255, 255, 255, 0.4);
                    --am26-border-strong: rgba(255, 255, 255, 0.6);
                    --am26-surface: rgba(255, 255, 255, 0.25);
                    --am26-surface-strong: rgba(255, 255, 255, 0.45);
                    --am26-panel: linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.1));
                    --am26-panel-strong: linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2));
                    --am26-primary: rgba(69, 84, 229, 1);
                    --am26-primary-strong: #1d3fcf;
                    --am26-primary-soft: rgba(42, 91, 255, 0.15);
                    --am26-success: #0ea86f;
                    --am26-warning: #e8a325;
                    --am26-danger: #ea4f4f;
                    --am26-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
                    --am26-glow: inset 0 0 0 1px rgba(255, 255, 255, 0.3);
                    --mux-comp-disabled-opacity: 0.4;
                    --mux-comp-v-gap: 16px;
                    --mux-comp-h-gap: 24px;
                    --mux-comp-shadow: 0 2px 10px 0 rgba(0,0,0,0.16);
                    --mux-comp-shadow-border: 0 none;
                    --mux-comp-btn-gap: 8px;
                    --mux-trigger-tag-gap: 2px;
                    --mux-trigger-tag-height: calc(var(--input-height) - var(--mux-trigger-tag-gap)*4 - 2px);
                    --mux-trigger-tag-bg: #fff;
                    --mux-trigger-tag-bg-hover: #fff;
                    --mux-trigger-tag-bg-active: var(--color-brand-opacity);
                    --mux-trigger-tag-arrow-color: #999;
                    --mux-trigger-tag-arrow-color-hover: #666;
                    --mux-trigger-input-placeholder-color: #999;
                    --mux-trigger-prefix-icon: #666;
                    --mux-trigger-prefix-text: #666;
                    --mux-trigger-arrow-size: 16px;
                    --mux-trigger-arrow-color: #333;
                    --mux-trigger-arrow-color-hover: #333;
                    --mux-trigger-v-gap: 8px;
                    --mux-trigger-h-gap: 8px;
                    --mux-trigger-min-width: var(--btn-min-width);
                    --mux-trigger-font-size: var(--btn-font-size);
                    --mux-trigger-small-v-gap: 8px;
                    --mux-trigger-small-h-gap: 8px;
                    --mux-trigger-small-min-width: var(--btn-small-min-width);
                    --mux-trigger-small-font-size: var(--btn-small-font-size);
                    --mux-trigger-large-v-gap: 8px;
                    --mux-trigger-large-h-gap: 12px;
                    --mux-trigger-large-min-width: var(--btn-large-min-width);
                    --mux-trigger-large-font-size: var(--btn-large-font-size);
                    --mux-table-hover-color: #f5f6f8;
                    --mux-table-hover-expanded-row-bg: #eaecf1;
                    --mux-table-border-color: #dfdfdf;
                    --mux-table-size--large: 100px;
                    --mux-table-size--normal: 60px;
                    --mux-table-size--small: 40px;
                    --mux-table-expanded-row-height: 40px;
                    --mux-table-header-height--small: 50px;
                    --mux-table-header-background: #fff;
                    --mux-radio-color: #dadadb;
                    --mux-radio-shadow-color: rgba(0,0,0,0.16);
                    --mux-radio-gap: 8px;
                    --mux-checkbox-color: #9095a1;
                    --mux-checkbox-size: calc(var(--font-size) + 2px);
                    --mux-checkbox-border-radius: 4px;
                    --mux-tag-font-scale: 0.84;
                    --mux-nav-icon-gap: 12px;
                    --mux-nav-h-gap: 24px;
                    --mux-mask-bg: rgba(0,0,0,0.6);
                    --mux-mask-light-bg: hsla(0,0%,100%,0.6);
                    --mux-statistic-font-size-integer: 20px;
                    --mux-statistic-font-size-decimal: 14px;
                    --mux-field-color-error: var(--color-red);
                    --mux-field-color-warning: var(--color-warn);
                    --mux-field-color-success: var(--color-green);
                    --mux-field-color-highlight: var(--color-brand);
                    --mux-field-color-initial: transparent;
                    --mux-common-bg: transparent;
                    --mux-btn-h-gap: 12px;
                    --mux-process-color-success: var(--color-green);
                    --mux-process-color-suspend: var(--color-warn);
                    --mux-process-color-error: var(--color-red);
                    --color-brand-alpha-10: rgba(62,62,255,0.1);
                    --color-brand-alpha-50: rgba(62,62,255,0.5);
                    --color-brand-btn-shadow-hover: 0 2px 10px 0 rgba(62,62,255,0.4);
                    --border-huge-radius: 16px;
                    --border-highlight-active-error: rgba(237,0,0,0.5);
                    --border-highlight-shadow-active-error: 0 2px 4px 0 rgba(237,0,0,0.2);
                    --border-highlight-active-warning: rgba(255,136,0,0.5);
                    --border-highlight-shadow-active-warning: 0 2px 4px 0 rgba(255,136,0,0.2);
                    --border-highlight-active-success: rgba(0,175,116,0.5);
                    --border-highlight-shadow-active-success: 0 2px 4px 0 rgba(0,175,116,0.2);
                    --btn-error: #f44;
                    --btn-error-gradient: #f44;
                    --btn-error-text: #fff;
                    --btn-error-hover: #cc0909;
                    --btn-error-gradient-hover: #cc0909;
                    --btn-error-shadow-hover: 0 2px 10px 0 rgba(255,68,68,0.4);
                    --btn-error-text-hover: #fff;
                    --btn-error-border: #cf1c1c;
                    --btn-error-bg: #ffecec;
                    --btn-error-border-hover: #fd9b9b;
                    --btn-error-bg-hover: #fedadb;
                    --color-orange: #f50;
                    --color-gray: rgba(0,0,0,0.25);
                    --color-red-weaken: #c9817b;
                    --mux-ai-brand--color: #ae5cff;
                    --mux-ai-brand-gradient-color: #5c5cff;
                    --mux-ai-brand-gradient-tl-br: linear-gradient(135deg,#5c5cff,#ae5cff 95%);
                    --mux-ai-brand-gradient-tl-br-dark: linear-gradient(135deg,#3e3eff,#93f 95%);
                    --mux-ai-brand-gradient-tl-br-light: linear-gradient(135deg,#ebd7ff,#d7d7ff);
                    --mux-ai-brand-gradient-tl-br-slight: linear-gradient(117deg,#ececff,#e9fbff 48%,#f4eaff);
                    --mux-ai-brand-gradient-tl-br-lighter: linear-gradient(135deg,#f5f5ff,#f5fdff 50%,#faf5ff);
                    --mux-ai-brand-gradient-l-r-dark: linear-gradient(90deg,#3e3eff 5%,#93f 95%);
                    --mux-ai-brand-gradient-line: linear-gradient(135deg,#3e3eff,#1dd3ff,#8e28ff);
                    --mux-marketing-brand-color: #ff0036;
                    --mux-marketing-brand-gradient-color: #f257a8;
                    --mux-marketing-brand-gradient-t-b: linear-gradient(180deg,#f257a8 0,#ff0036);
                    --mux-marketing-brand-gradient-t-b-dark: linear-gradient(180deg,#df2e8b 0,#e80c20);
                    --mux-marketing-brand-gradient-t-b-light: linear-gradient(180deg,#fff,#ffccd7);
                    --mux-marketing-brand-gradient-t-b-lighter: linear-gradient(180deg,#fff,#ffe6eb);
                    --mux-marketing-brand-gradient-l-r: linear-gradient(90deg,#f257a8 0,#ff0036);
                    --mux-marketing-brand-gradient-l-r-dark: linear-gradient(90deg,#df2e8b 0,#e80c20);
                    --mux-marketing-brand-gradient-tl-br-light: linear-gradient(135deg,#ffe6eb,#fdeef6);
                    --mux-marketing-brand-gradient-tl-br-lighter: linear-gradient(135deg,#fff2f5,#fef6fa);
                    --mx-color-width: 224px;
                    --mx-color-slider-width: 18px;
                    --mx-color-picker-width: calc(var(--mx-color-width) - var(--mx-color-slider-width) - 10px);
                    -webkit-font-smoothing: antialiased;
                    color: var(--font-color,#333);
                    font-family: var(--font-family);
                    font-size: var(--font-size);
                    line-height: var(--line-height);
                    box-sizing: inherit;
                    -webkit-appearance: none;
                    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
                    outline: none;
                    bottom: 0;
                    position: relative;
                    width: 100%;
                }
            `;
            const style = document.createElement('style');
            style.id = 'am-helper-pro-v26-style';
            style.textContent = css;
            document.head.appendChild(style);
        },

        createElements() {
            // 容错：脚本被重复注入时先清理旧主面板，避免同 ID 节点并存导致按钮事件失效
            document.querySelectorAll('#am-helper-icon, #am-helper-panel').forEach((node) => {
                if (node instanceof HTMLElement) node.remove();
            });
            const root = document.createElement('div');
            root.innerHTML = `
                <div id="am-helper-icon" title="点击展开助手面板">
                    <svg viewBox="0 0 1024 1024" width="22" height="22" fill="currentColor"><path d="M852.1 432.8L542.4 69.2c-26.6-30.8-74.6-11.8-74.6 28.6v238H218c-36.2 0-60.6 37.8-44.4 69.4l270.2 522.4c18.6 36 71.8 23.4 71.8-17V681h249.6c36.2 0 60.8-38 44.6-69.6z"></path></svg>
                </div>
                <div id="am-helper-panel">
            <div class="am-resizer-left"></div>
            <div class="am-header">
                <span class="am-title">
                    <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor" style="margin-right:4px;"><path d="M852.1 432.8L542.4 69.2c-26.6-30.8-74.6-11.8-74.6 28.6v238H218c-36.2 0-60.6 37.8-44.4 69.4l270.2 522.4c18.6 36 71.8 23.4 71.8-17V681h249.6c36.2 0 60.8-38 44.6-69.6z"></path></svg>
                    阿里助手 Pro
                    <span class="am-version">v${CURRENT_VERSION}</span>
                </span>
                <div class="am-close-btn" title="最小化">
                    <svg viewBox="0 0 1024 1024" style="width:1.2em;height:1.2em;vertical-align:middle;fill:currentColor;overflow:hidden;"><path d="M551.424 512l195.072-195.072c9.728-9.728 9.728-25.6 0-36.864l-1.536-1.536c-9.728-9.728-25.6-9.728-35.328 0L514.56 475.136 319.488 280.064c-9.728-9.728-25.6-9.728-35.328 0l-1.536 1.536c-9.728 9.728-9.728 25.6 0 36.864L477.696 512 282.624 707.072c-9.728 9.728-9.728 25.6 0 36.864l1.536 1.536c9.728 9.728 25.6 9.728 35.328 0L514.56 548.864l195.072 195.072c9.728 9.728 25.6 9.728 35.328 0l1.536-1.536c9.728-9.728 9.728-25.6 0-36.864L551.424 512z"></path></svg>
                </div>
            </div>
            <div class="am-body">
                <!-- Section 1: Tools -->
                <div class="am-tools-row">
                    <div class="am-tool-btn" id="am-trigger-optimizer">
                        <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor"><path d="M907.8 770.1c-60-96.1-137.9-178.6-227.1-241.6 8.3-43.1 7.1-88.9-5-131-29.2-101.5-121.1-177.3-227.5-188.9-10.4-1.2-18.7 8.3-15.3 18.2 24.5 70.3 5.4 152.1-51.5 209-56.9 56.9-138.7 76-209 51.5-9.9-3.4-19.4 4.8-18.2 15.3 11.6 106.4 87.4 198.3 188.9 227.5 42.1 12.1 87.9 13.3 131 5 63.1 89.2 145.5 167.1 241.6 227.1 21.6 13.5 49.3-3.9 46.2-28.7l-12.7-106.3c10.3 3.6 21 6.1 31.9 7.4 35.7 4.2 71.3-7.5 99.2-35.4 27.9-27.9 39.6-63.5 35.4-99.2-1.3-10.9-3.8-21.6-7.4-31.9l106.3 12.7c24.9 3.1 42.3-24.6 28.7-46.2zM512 512c-23.7 0-46.3-5-67.4-14.1-18.4-7.9-19-33.3-1-42.3 22.1-11 47.9-16.1 74.5-13.2 59.8 6.5 106.9 53.6 113.4 113.4 2.9 26.6-2.2 52.4-13.2 74.5-9 18-34.4 17.4-42.3-1-9.1-21.1-14.1-43.7-14.1-67.4z"></path></svg>
                        算法护航
                    </div>
                    <div class="am-tool-btn" id="am-trigger-keyword-plan-api">
                        <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor"><path d="M128 176a48 48 0 0 1 48-48h672a48 48 0 0 1 48 48v80H128v-80zm0 192h768v480a48 48 0 0 1-48 48H176a48 48 0 0 1-48-48V368zm160 96v64h448v-64H288zm0 160v64h288v-64H288z"></path></svg>
                        关键词建计划
                    </div>
                    <div class="am-tool-btn" id="am-trigger-magic-report">
                        <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor"><path d="M128 128h768v768H128z m60.8 60.8V835.2h646.4V188.8H188.8z M256 384h128v320H256V384z m192-128h128v448H448V256z m192 192h128v256H640V448z"></path></svg>
                        万能查数
                    </div>
                    <div class="am-tool-btn" id="am-toggle-assist-display">
                        <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor"><path d="M512 208c219.8 0 401.4 124.4 472 302.2a23.7 23.7 0 0 1 0 17.6C913.4 705.6 731.8 830 512 830S110.6 705.6 40 527.8a23.7 23.7 0 0 1 0-17.6C110.6 332.4 292.2 208 512 208zm0 104c-110.6 0-200 89.4-200 200s89.4 200 200 200 200-89.4 200-200-89.4-200-200-200zm0 88a112 112 0 1 1 0 224 112 112 0 0 1 0-224z"></path></svg>
                        辅助显示
                    </div>
                </div>

                <!-- Section 2: Settings -->
                <div id="am-assist-switches">
                    <div class="am-switches-grid">
                        <div class="am-switch-btn" data-key="showCost">询单成本</div>
                        <div class="am-switch-btn" data-key="showCartCost">加购成本</div>
                        <div class="am-switch-btn" data-key="showPercent">潜客占比</div>
                        <div class="am-switch-btn" data-key="showCostRatio">花费占比</div>
                        <div class="am-switch-btn" data-key="showBudget">预算进度</div>
                        <div class="am-switch-btn" data-key="unlockBudgetFrontendLimit">预算破限</div>
                        <div class="am-switch-btn" data-key="autoSortCharge">花费排序</div>
                        <div class="am-switch-btn" data-key="showConcurrentStartButton">计划并发</div>
                        <!-- <div class="am-switch-btn" data-key="autoClose">弹窗速闭</div> -->
                    </div>
                </div>
                <div class="am-log-section">
                    <div class="am-log-header">
                        <span>📋 运行日志</span>
                        <div>
                            <span class="am-action-btn" id="am-log-clear">清空</span>
                            <span class="am-action-btn" id="am-log-toggle">展开</span>
                        </div>
                    </div>
                    <div id="am-log-content"></div>
                </div>
            </div>
        </div>
    `;
            document.body.appendChild(root);
            Logger.el = document.getElementById('am-log-content');
        },

        bindEvents() {
            this.bindPluginScrollChainGuard();
            const icon = document.getElementById('am-helper-icon');
            const panel = document.getElementById('am-helper-panel');
            const closeBtn = panel.querySelector('.am-close-btn');
            const resizer = panel.querySelector('.am-resizer-left');
            let hoverOpenBlockedUntil = 0;
            let autoHideTimer = null;

            const clearAutoHideTimer = () => {
                if (!autoHideTimer) return;
                clearTimeout(autoHideTimer);
                autoHideTimer = null;
            };

            // 展开/收起动画
            const openPanel = (force = false) => {
                clearAutoHideTimer();
                if (!force && Date.now() < hoverOpenBlockedUntil) return;
                if (State.config.panelOpen) return;
                State.config.panelOpen = true;
                State.save();
                this.updateState();
            };
            const closePanel = (blockHoverOpen = false) => {
                clearAutoHideTimer();
                if (blockHoverOpen) hoverOpenBlockedUntil = Date.now() + 800;
                if (!State.config.panelOpen) return;
                State.config.panelOpen = false;
                State.save();
                this.updateState();
            };
            const scheduleAutoHide = (delay = 180) => {
                clearAutoHideTimer();
                autoHideTimer = setTimeout(() => {
                    autoHideTimer = null;
                    if (!State.config.panelOpen) return;
                    if (panel.matches(':hover') || icon.matches(':hover')) return;
                    closePanel(false);
                }, delay);
            };

            icon.onclick = () => openPanel(true);
            // 鼠标移入悬浮球时自动展开
            icon.onmouseenter = () => openPanel(false);
            panel.onmouseenter = clearAutoHideTimer;
            panel.onmouseleave = () => scheduleAutoHide();
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                closePanel(true);
            };

            // 点击面板外部自动最小化
            document.addEventListener('click', (e) => {
                if (State.config.panelOpen && !panel.contains(e.target) && !icon.contains(e.target)) {
                    closePanel(false);
                }
            });

            // 功能按钮
            // 功能开关 (Settings)
            document.querySelectorAll('.am-switch-btn').forEach(btn => {
                btn.onclick = () => {
                    const key = btn.dataset.key;
                    State.config[key] = !State.config[key];
                    State.save();
                    this.updateState();
                    Logger.log(`${btn.textContent.trim()} ${State.config[key] ? '✅' : '❌'} `);
                    if (key === 'unlockBudgetFrontendLimit') BudgetFrontendLimitBypass.refresh();
                    if (key === 'showConcurrentStartButton') {
                        CampaignIdQuickEntry.syncConcurrentButtonsVisibility();
                        return;
                    }
                    if (key !== 'autoClose') Core.run();
                };
            });

            // 工具按钮 (Tools) - 万能查数
            const magicBtn = document.getElementById('am-trigger-magic-report');
            if (magicBtn) {
                magicBtn.onclick = () => {
                    MagicReport.toggle(true);
                };
            }

            const assistToggleBtn = document.getElementById('am-toggle-assist-display');
            if (assistToggleBtn) {
                assistToggleBtn.onclick = () => {
                    this.runtime.assistExpanded = !this.runtime.assistExpanded;
                    this.updateState();
                };
            }

            // 算法护航按钮
            const optBtn = document.getElementById('am-trigger-optimizer');
            if (optBtn) {
                optBtn.onclick = () => {
                    // [ADD] 点击护航时自动最小化主面板
                    State.config.panelOpen = false;
                    State.save();
                    this.updateState();

                    if (typeof window.__ALIMAMA_OPTIMIZER_TOGGLE__ === 'function') {
                        window.__ALIMAMA_OPTIMIZER_TOGGLE__();
                    } else {
                        Logger.log('⚠️ 算法护航模块初始化中...', true);
                        setTimeout(() => {
                            if (typeof window.__ALIMAMA_OPTIMIZER_TOGGLE__ === 'function') {
                                window.__ALIMAMA_OPTIMIZER_TOGGLE__();
                            } else {
                                alert('算法护航模块无法加载，请刷新页面重试');
                            }
                        }, 1000);
                    }
                };
            }

            const keywordPlanBtn = document.getElementById('am-trigger-keyword-plan-api');
            if (keywordPlanBtn) {
                const resolveKeywordPlanApi = () => resolveKeywordPlanApiAccessor();

                const openExistingKeywordOverlay = () => {
                    const overlay = document.getElementById('am-wxt-keyword-overlay');
                    if (!overlay) return false;
                    overlay.classList.add('open');
                    return true;
                };

                keywordPlanBtn.onclick = () => {
                    const api = resolveKeywordPlanApi();
                    if (api && typeof api.openWizard === 'function') {
                        api.openWizard();
                        return;
                    }
                    if (openExistingKeywordOverlay()) return;

                    Logger.log('⚠️ 关键词建计划模块初始化中...', true);
                    setTimeout(() => {
                        const retryApi = resolveKeywordPlanApi();
                        if (retryApi && typeof retryApi.openWizard === 'function') {
                            retryApi.openWizard();
                        } else if (openExistingKeywordOverlay()) {
                            Logger.log('ℹ️ 已打开关键词计划弹窗（兜底）');
                        } else {
                            alert('关键词建计划模块不可用，请刷新页面重试');
                        }
                    }, 800);
                };
            }

            // 日志操作
            document.getElementById('am-log-clear').onclick = () => { Logger.clear(); Logger.log('日志已清空'); };
            document.getElementById('am-log-toggle').onclick = () => {
                State.config.logExpanded = !State.config.logExpanded;
                State.save();
                this.updateState();
            };

            // 拖拽调整宽度
            let isResizing = false, startX = 0, startWidth = 0;
            resizer.onmousedown = (e) => {
                isResizing = true;
                startX = e.clientX;
                startWidth = panel.offsetWidth;
                document.body.style.userSelect = 'none';
                e.preventDefault();
            };
            document.addEventListener('mousemove', (e) => {
                if (isResizing) {
                    const newWidth = Math.min(500, Math.max(250, startWidth + startX - e.clientX));
                    panel.style.width = newWidth + 'px';
                }
            });
            document.addEventListener('mouseup', () => {
                isResizing = false;
                document.body.style.userSelect = '';
            });

            // 交互监听
            document.addEventListener('click', (e) => {
                // 弹窗自动关闭
                if (State.config.autoClose) {
                    const target = e.target;
                    if (typeof target.className === 'string' && (target.className.includes('mask') || parseInt(target.style.zIndex) > 900)) {
                        const closeBtn = target.querySelector('[mx-click*="close"], .mx-iconfont.close');
                        if (closeBtn) { closeBtn.click(); Logger.log('🛡️ 自动闭窗'); }
                    }
                }

                const tabTexts = ['关键词', '人群', '创意', '资源位', '地域', '时段'];
                const clickedText = e.target.textContent || '';
                const isTabClick = tabTexts.some(t => clickedText.includes(t)) &&
                    (e.target.closest('a[mx-click]') || e.target.closest('[class*="tab"]'));
                if (isTabClick) resetSortState('Tab 切换');

                // 触发更新
                const updateKeywords = ['查询', '搜索', '确定', '翻页', '分页'];
                const txt = e.target.textContent || '';
                if (updateKeywords.some(k => txt.includes(k))) {
                    Logger.log('🖱️ 触发更新');
                }
            }, true);
        },

        updateState() {
            const { panelOpen, logExpanded } = State.config;
            const icon = document.getElementById('am-helper-icon');
            const panel = document.getElementById('am-helper-panel');
            const logContent = document.getElementById('am-log-content');
            const logToggle = document.getElementById('am-log-toggle');
            const assistPanel = document.getElementById('am-assist-switches');
            const assistToggleBtn = document.getElementById('am-toggle-assist-display');

            // 面板显示/隐藏动画
            if (panelOpen) {
                panel.classList.remove('hidden');
                icon.style.display = 'none';
            } else {
                panel.classList.add('hidden');
                setTimeout(() => { icon.style.display = 'flex'; }, 300);
            }

            // 功能开关状态
            document.querySelectorAll('.am-switch-btn').forEach(btn => {
                const key = btn.dataset.key;
                if (State.config[key]) btn.classList.add('active');
                else btn.classList.remove('active');
            });

            if (assistPanel) {
                assistPanel.classList.toggle('open', this.runtime.assistExpanded);
            }
            if (assistToggleBtn) {
                assistToggleBtn.classList.toggle('active', this.runtime.assistExpanded);
            }
            CampaignIdQuickEntry.syncConcurrentButtonsVisibility();

            // 日志展开/折叠
            if (logExpanded) {
                logContent.classList.remove('collapsed');
                logToggle.textContent = '隐藏';
            } else {
                logContent.classList.add('collapsed');
                logToggle.textContent = '展开';
            }
        }
    };
