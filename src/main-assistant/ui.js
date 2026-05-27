    // ==========================================
    // 4. UI 界面 (View) - 参考算法护航脚本样式
    // ==========================================
    const UI = {
        runtime: {
            assistExpanded: false,
            scrollChainGuardBound: false
        },

        init() {
            State.config.logExpanded = false;
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
                const pluginRoot = target.closest('#am-helper-panel, #am-magic-report-popup, #alimama-escort-helper-ui, #am-campaign-concurrent-log-popup, #am-campaign-copy-success-popup, #am-report-capture-panel');
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
                    background: var(--am26-panel-strong) !important;
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
                #am-helper-icon svg {
                    transform-origin: center;
                    animation: am-helper-icon-pulse 2.4s ease-in-out infinite;
                    will-change: transform;
                }
                #am-helper-icon:hover {
                    transform: translateY(-1px) scale(1.08);
                    border-color: var(--am26-border-strong);
                    color: var(--am26-primary-strong);
                    background: rgba(255,255,255,0.6);
                }
                #am-helper-icon:hover svg {
                    animation-duration: 1.2s;
                }
                @keyframes am-helper-icon-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                @media (prefers-reduced-motion: reduce) {
                    #am-helper-icon svg {
                        animation: none !important;
                    }
                }

                /* 主面板 */
                #am-helper-panel {
                    position: fixed; top: 120px; right: 20px; z-index: 999999;
                    background: var(--am26-panel-strong);
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
                    background: rgba(255, 255, 255, 0.3);
                    display: flex; justify-content: space-between; align-items: center;
                }
                .am-title {
                    font-weight: 600; font-size: 15px; color: var(--am26-text);
                    display: flex; align-items: center; gap: 8px;
                    text-shadow: 0 1px 0 rgba(255,255,255,0.4);
                }
                .am-title .am-brand-icon {
                    flex: 0 0 16px;
                }
                .am-version {
                    font-size: 10px; color: var(--am26-text-soft); font-weight: normal;
                    background: rgba(255,255,255,0.3); padding: 1px 4px; border-radius: 6px;
                }
                .am-icon-btn {
                    cursor: pointer; color: var(--am26-text-soft); font-size: 16px; font-weight: bold;
                    width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
                    border-radius: 8px; transition: all 0.2s;
                }
                .am-icon-btn:hover { background: rgba(0, 0, 0, 0.05); color: var(--am26-primary); }
                .am-icon-btn.danger:hover { background: rgba(234, 79, 79, 0.15); color: var(--am26-danger); }

                .am-close-btn {
                    cursor: pointer; color: var(--am26-text-soft); font-size: 16px; font-weight: bold;
                    width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
                    border-radius: 8px; transition: all 0.2s;
                }
                .am-close-btn:hover { background: rgba(234, 79, 79, 0.1); color: var(--am26-danger); }

                /* 内容区 */
                .am-body { padding: 18px; }



                .am-tools-row {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    width: 100%;
                    gap: 8px;
                    padding: 0 4px;
                    margin-bottom: 0;
                    box-sizing: border-box;
                }
                .am-tool-btn {
                    position: relative;
                    border: none;
                    background: transparent;
                    color: #6b7280;
                    border-radius: 12px;
                    padding: 8px 12px;
                    min-height: 34px;
                    font-size: 13px;
                    font-weight: 600;
                    line-height: 1;
                    cursor: pointer;
                    transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 6px;
                    white-space: nowrap;
                    box-sizing: border-box;
                }
                .am-tool-btn svg {
                    width: 14px;
                    height: 14px;
                    flex: 0 0 14px;
                }
                .am-tool-btn:focus-visible {
                    outline: 2px solid rgba(37, 99, 235, 0.45);
                    outline-offset: 1px;
                }
                .am-tool-btn:hover,
                .am-tool-btn.active {
                    background: rgba(255, 255, 255, 0.88);
                    color: #111827;
                    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.7);
                    font-weight: 700;
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
                    background: transparent;
                    transition: max-height 0.32s ease, opacity 0.24s ease, transform 0.32s ease, margin-top 0.32s ease, padding 0.32s ease, border-color 0.32s ease;
                }
                #am-assist-switches.open {
                    max-height: 220px;
                    opacity: 1;
                    transform: translateY(0);
                    pointer-events: auto;
                    margin-top: 8px;
                    padding: 4px 0;
                    border-color: transparent;
                }

                .am-switches-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 8px;
                    background: transparent;
                    padding: 8px 4px;
                    border-radius: 0;
                    border: none;
                    box-shadow: none;
                }
                .am-switch-btn {
                    border: 1px solid transparent;
                    background: rgba(255, 255, 255, 0.9);
                    color: #1a2a47;
                    border-radius: 999px;
                    font-size: 11px;
                    line-height: 1.2;
                    font-weight: 600;
                    cursor: pointer;
                    padding: 5px 12px;
                    display: inline-flex;
                    width: 100%;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 6px;
                    box-shadow: 0 2px 6px rgba(31, 53, 109, 0.06);
                    transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
                }
                .am-switch-btn::before {
                    content: '';
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    display: inline-block;
                    background: var(--am26-primary, #2f54eb);
                    box-shadow: 0 0 6px var(--am26-primary, #2f54eb);
                    transition: all 0.2s;
                }
                .am-switch-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 14px rgba(31, 53, 109, 0.12);
                    border-color: rgba(47, 84, 235, 0.4);
                }
                .am-switch-btn:not(.active) {
                    opacity: 0.5;
                    border-color: transparent;
                    box-shadow: none;
                    background: transparent;
                    transform: none;
                }
                .am-switch-btn:not(.active)::before {
                    background: #cbd5e1;
                    box-shadow: none;
                }

                .am-campaign-id-token {
                    display: inline;
                }
                .am-campaign-search-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 20px;
                    height: 20px;
                    margin-left: 3px;
                    -webkit-appearance: none;
                    appearance: none;
                    border: 0;
                    border-radius: 5px;
                    background: transparent;
                    color: #8f9aa7;
                    line-height: 1;
                    cursor: pointer;
                    user-select: none;
                    vertical-align: middle;
                    padding: 2px;
                    box-sizing: border-box;
                    transition: color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
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
                    color: #1677ff;
                    background: rgba(22, 119, 255, 0.08);
                }
                .am-campaign-search-btn:focus-visible {
                    outline: none;
                    box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.24);
                    background: rgba(22, 119, 255, 0.08);
                }
                .am-campaign-concurrent-start-btn:hover {
                    color: #157a43;
                    background: rgba(21, 122, 67, 0.1);
                }
                .am-campaign-copy-btn {
                    width: auto;
                    min-width: 88px;
                    height: 22px;
                    gap: 3px;
                    padding: 2px 4px 2px 6px;
                    border-radius: 4px;
                    font-size: 12px;
                    line-height: 1;
                    white-space: nowrap;
                }
                .am-campaign-operation-copy-btn {
                    float: left;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 8px 0 0;
                    opacity: 1;
                    visibility: visible;
                    pointer-events: auto;
                }
                .am-campaign-copy-btn:hover {
                    color: #7c3aed;
                    background: rgba(124, 58, 237, 0.1);
                }
                .am-campaign-copy-label {
                    pointer-events: none;
                }
                .am-campaign-copy-btn .am-wxt-copy-multi {
                    display: inline-flex;
                    align-items: center;
                    gap: 2px;
                    margin-left: 2px;
                    padding: 2px 5px;
                    border-radius: 10px;
                    border: 1px solid rgba(99, 102, 241, 0.32);
                    background: rgba(255, 255, 255, 0.88);
                    color: #3344c8;
                    font-size: 11px;
                    line-height: 1;
                    user-select: none;
                    pointer-events: auto;
                }
                .am-campaign-copy-btn .am-wxt-copy-multi-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0.9;
                    pointer-events: none;
                }
                .am-campaign-copy-btn .am-wxt-copy-multi-num {
                    min-width: 12px;
                    text-align: center;
                    font-weight: 600;
                    pointer-events: none;
                }
                .am-campaign-search-btn.is-running {
                    color: #1677ff;
                    background: rgba(22, 119, 255, 0.08);
                    opacity: 0.72;
                    visibility: visible;
                    pointer-events: none;
                }
                .am-campaign-search-btn svg {
                    width: 14px;
                    height: 14px;
                    display: block;
                    fill: none;
                    stroke: currentColor;
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
                    line-height: 1;
                    cursor: pointer;
                    width: 32px;
                    height: 32px;
                    padding: 0;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-close:hover {
                    background: rgba(234, 79, 79, 0.1);
                    color: var(--am26-danger, #ea4f4f);
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

                #am-campaign-copy-success-popup {
                    position: fixed;
                    inset: 0;
                    z-index: 2147483646;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    background: rgba(15, 23, 42, 0.36);
                }
                #am-campaign-copy-success-popup .am-copy-success-card {
                    width: min(320px, calc(100vw - 28px));
                    max-height: min(84vh, 680px);
                    display: flex;
                    flex-direction: column;
                    border-radius: 24px;
                    background: #ffffff;
                    color: #333333;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.16);
                    overflow: hidden;
                }
                #am-campaign-copy-success-popup .am-copy-success-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 16px 24px 8px;
                }
                #am-campaign-copy-success-popup .am-copy-success-icon {
                    width: 16px;
                    height: 16px;
                    flex: 0 0 auto;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: #ffa33b;
                    color: #ffffff;
                    font-size: 12px;
                    line-height: 1;
                    font-weight: 700;
                    font-family: Arial, Helvetica, sans-serif;
                }
                #am-campaign-copy-success-popup .am-copy-success-title {
                    margin: 0;
                    font-size: 16px;
                    line-height: 24px;
                    font-weight: 700;
                    color: #333333;
                }
                #am-campaign-copy-success-popup .am-copy-success-body {
                    margin: 0;
                    padding: 24px;
                    overflow: auto;
                    white-space: pre-wrap;
                    word-break: break-word;
                    font-family: inherit;
                    font-size: 12px;
                    line-height: 18px;
                    color: #333333;
                    background: #ffffff;
                }
                #am-campaign-copy-success-popup .am-copy-success-footer {
                    display: flex;
                    justify-content: flex-start;
                    gap: 8px;
                    padding: 0 24px 16px;
                    background: #ffffff;
                }
                #am-campaign-copy-success-popup .am-copy-success-confirm,
                #am-campaign-copy-success-popup .am-copy-success-cancel {
                    min-width: 64px;
                    height: 32px;
                    border: 0;
                    border-radius: 500px;
                    padding: 0 12px;
                    box-sizing: border-box;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
                }
                #am-campaign-copy-success-popup .am-copy-success-confirm {
                    background: #4554e5;
                    color: #ffffff;
                    box-shadow: none;
                }
                #am-campaign-copy-success-popup .am-copy-success-cancel {
                    background: rgba(69, 84, 229, 0.1);
                    color: #4554e5;
                }
                #am-campaign-copy-success-popup .am-copy-success-confirm:hover,
                #am-campaign-copy-success-popup .am-copy-success-confirm:focus-visible {
                    background: #3546df;
                    outline: none;
                }
                #am-campaign-copy-success-popup .am-copy-success-cancel:hover,
                #am-campaign-copy-success-popup .am-copy-success-cancel:focus-visible {
                    background: rgba(69, 84, 229, 0.16);
                    outline: none;
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
                .am-log-title {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }
                .am-log-title svg {
                    width: 14px;
                    height: 14px;
                    flex: 0 0 14px;
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
                #am-report-capture-panel .am-download-title,
                #am-report-capture-panel .am-download-link {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                }
                #am-report-capture-panel .am-download-title svg,
                #am-report-capture-panel .am-download-link svg {
                    width: 14px;
                    height: 14px;
                    flex: 0 0 14px;
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
                #am-report-capture-panel .am-download-close {
                    width: 32px;
                    min-width: 32px;
                    height: 32px;
                    padding: 0;
                    flex: 0 0 auto;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                #am-report-capture-panel .am-download-close svg {
                    width: 16px;
                    height: 16px;
                }
                #am-report-capture-panel .am-download-close:hover {
                    background: rgba(234, 79, 79, 0.1);
                    color: var(--am26-danger, #ea4f4f);
                    border-color: rgba(234, 79, 79, 0.22);
                }
                #am-report-capture-panel .am-download-btn:hover,
                #am-report-capture-panel .am-download-link:hover {
                    transform: translateY(-1px);
                }
                #am-report-capture-panel .am-download-copy { flex: 1; }
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
                    ${renderAmIcon('logo', { size: 22, strokeWidth: 2.2 })}
                </div>
                <div id="am-helper-panel">
            <div class="am-resizer-left"></div>
            <div class="am-header">
                <span class="am-title">
                    ${renderAmIcon('logo', { size: 16, className: 'am-brand-icon', strokeWidth: 2.2 })}
                    阿里助手 Pro
                    <span class="am-version">v${CURRENT_VERSION}</span>
                </span>
                <div class="am-close-btn" title="最小化">
                    ${renderAmWindowIcon('close')}
                </div>
            </div>
            <div class="am-body">
                <!-- Section 1: Tools -->
                <div class="am-tools-row">
                    <div class="am-tool-btn" id="am-trigger-optimizer">
                        ${renderAmIcon('shield-check', { size: 16 })}
                        算法护航
                    </div>
                    <div class="am-tool-btn" id="am-trigger-keyword-plan-api">
                        ${renderAmIcon('plan', { size: 16 })}
                        组建计划
                    </div>
                    <div class="am-tool-btn" id="am-trigger-magic-report">
                        ${renderAmIcon('chart', { size: 16 })}
                        万能查数
                    </div>
                    <div class="am-tool-btn" id="am-toggle-assist-display">
                        ${renderAmIcon('eye', { size: 16 })}
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
                        <span class="am-log-title">${renderAmIcon('list', { size: 14 })}<span>运行日志</span></span>
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
                    try {
                        const result = MagicReport.toggle(true);
                        if (result && typeof result.catch === 'function') {
                            result.catch((err) => {
                                Logger.log(`⚠️ 万能查数打开失败：${err?.message || '未知错误'}`, true);
                            });
                        }
                    } catch (err) {
                        Logger.log(`⚠️ 万能查数打开失败：${err?.message || '未知错误'}`, true);
                    }
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

                    const toggleOptimizerPanel = () => {
                        try {
                            if (typeof window.__ALIMAMA_OPTIMIZER_TOGGLE__ !== 'function') return false;
                            return window.__ALIMAMA_OPTIMIZER_TOGGLE__() !== false;
                        } catch (err) {
                            Logger.log(`⚠️ 算法护航打开失败：${err?.message || '未知错误'}`, true);
                            return false;
                        }
                    };

                    if (typeof window.__ALIMAMA_OPTIMIZER_TOGGLE__ === 'function') {
                        toggleOptimizerPanel();
                    } else {
                        Logger.log('⚠️ 算法护航模块初始化中...', true);
                        setTimeout(() => {
                            if (!toggleOptimizerPanel()) {
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
                const reportKeywordPlanOpenFailure = (err) => {
                    const message = err?.message || String(err || '未知错误');
                    Logger.log(`⚠️ 组建计划打开失败：${message}`, true);
                    if (openExistingKeywordOverlay()) {
                        Logger.log('ℹ️ 已打开已有关键词计划弹窗（兜底）');
                        return;
                    }
                    alert(`组建计划模块打开失败：${message}，请刷新页面重试`);
                };
                const openKeywordPlanWizard = (targetApi) => {
                    if (!targetApi || typeof targetApi.openWizard !== 'function') return false;
                    try {
                        const result = targetApi.openWizard();
                        if (result && typeof result.catch === 'function') {
                            result.catch(reportKeywordPlanOpenFailure);
                        }
                        return true;
                    } catch (err) {
                        reportKeywordPlanOpenFailure(err);
                        return true;
                    }
                };

                keywordPlanBtn.onclick = () => {
                    const api = resolveKeywordPlanApi();
                    if (openKeywordPlanWizard(api)) return;
                    if (openExistingKeywordOverlay()) return;

                    Logger.log('⚠️ 关键词建计划模块初始化中...', true);
                    setTimeout(() => {
                        const retryApi = resolveKeywordPlanApi();
                        if (openKeywordPlanWizard(retryApi)) {
                            return;
                        }
                        if (openExistingKeywordOverlay()) {
                            Logger.log('ℹ️ 已打开关键词计划弹窗（兜底）');
                        } else {
                            alert('组建计划模块不可用，请刷新页面重试');
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
