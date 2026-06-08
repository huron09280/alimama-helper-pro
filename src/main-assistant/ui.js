    // ==========================================
    // 4. UI 界面 (View) - 参考算法护航脚本样式
    // ==========================================
    const UI = {
        runtime: {
            assistExpanded: false,
            scrollChainGuardBound: false,
            panelOutsideClickHandler: null,
            panelOutsideClickHandlerBound: false,
            panelAutoHideTimer: null,
            panelAutoHideVisibilityHandler: null,
            panelAutoHidePendingContext: null,
            panelIconRevealTimer: null,
            panelIconRevealVisibilityHandler: null,
            panelIconRevealPendingIcon: null,
            optimizerOpenRetryTimer: null,
            optimizerOpenRetryVisibilityHandler: null,
            optimizerOpenRetryPendingCallback: null,
            keywordPlanOpenRetryTimer: null,
            keywordPlanOpenRetryVisibilityHandler: null,
            keywordPlanOpenRetryPendingCallback: null
        },

        init() {
            State.config.logExpanded = false;
            this.injectStyles();
            this.createElements();
            this.bindEvents();
            this.updateState();
        },

        isPanelAutoHideDocumentHidden() {
            try {
                return document.visibilityState === 'hidden';
            } catch {
                return false;
            }
        },

        clearPanelAutoHideTimer() {
            if (this.runtime.panelAutoHideTimer) {
                clearTimeout(this.runtime.panelAutoHideTimer);
                this.runtime.panelAutoHideTimer = null;
            }
        },

        clearPanelAutoHideVisibilityHandler() {
            const handler = this.runtime.panelAutoHideVisibilityHandler;
            if (typeof handler === 'function') {
                document.removeEventListener('visibilitychange', handler);
            }
            this.runtime.panelAutoHideVisibilityHandler = null;
        },

        clearPanelAutoHideState() {
            this.clearPanelAutoHideTimer();
            this.clearPanelAutoHideVisibilityHandler();
            this.runtime.panelAutoHidePendingContext = null;
        },

        bindPanelAutoHideVisibilityHandler() {
            if (typeof this.runtime.panelAutoHideVisibilityHandler === 'function') return;
            this.runtime.panelAutoHideVisibilityHandler = () => {
                if (this.isPanelAutoHideDocumentHidden()) {
                    this.finishPanelAutoHide();
                }
            };
            document.addEventListener('visibilitychange', this.runtime.panelAutoHideVisibilityHandler);
        },

        finishPanelAutoHide() {
            const context = this.runtime.panelAutoHidePendingContext;
            this.clearPanelAutoHideState();
            const panel = context?.panel;
            const icon = context?.icon;
            const closePanel = context?.closePanel;
            if (!(panel instanceof HTMLElement) || !(icon instanceof HTMLElement) || typeof closePanel !== 'function') return;
            if (!State.config.panelOpen) return;
            if (!this.isPanelAutoHideDocumentHidden() && (panel.matches(':hover') || icon.matches(':hover'))) return;
            closePanel(false);
        },

        schedulePanelAutoHide(context = {}, delay = 180) {
            this.clearPanelAutoHideState();
            const panel = context?.panel;
            const icon = context?.icon;
            const closePanel = context?.closePanel;
            if (!(panel instanceof HTMLElement) || !(icon instanceof HTMLElement) || typeof closePanel !== 'function') return;
            this.runtime.panelAutoHidePendingContext = { panel, icon, closePanel };
            this.bindPanelAutoHideVisibilityHandler();
            if (this.isPanelAutoHideDocumentHidden()) {
                this.finishPanelAutoHide();
                return;
            }
            this.runtime.panelAutoHideTimer = setTimeout(() => {
                this.runtime.panelAutoHideTimer = null;
                this.finishPanelAutoHide();
            }, Math.max(0, Number(delay) || 0));
        },

        clearPanelIconRevealTimer() {
            if (this.runtime.panelIconRevealTimer) {
                clearTimeout(this.runtime.panelIconRevealTimer);
                this.runtime.panelIconRevealTimer = null;
            }
            this.clearPanelIconRevealVisibilityHandler();
            this.runtime.panelIconRevealPendingIcon = null;
        },

        isPanelIconRevealDocumentHidden() {
            try {
                return document.visibilityState === 'hidden';
            } catch {
                return false;
            }
        },

        clearPanelIconRevealVisibilityHandler() {
            const handler = this.runtime.panelIconRevealVisibilityHandler;
            if (typeof handler === 'function') {
                document.removeEventListener('visibilitychange', handler);
            }
            this.runtime.panelIconRevealVisibilityHandler = null;
        },

        bindPanelIconRevealVisibilityHandler() {
            if (typeof this.runtime.panelIconRevealVisibilityHandler === 'function') return;
            this.runtime.panelIconRevealVisibilityHandler = () => {
                if (this.isPanelIconRevealDocumentHidden()) {
                    if (this.runtime.panelIconRevealTimer) {
                        clearTimeout(this.runtime.panelIconRevealTimer);
                        this.runtime.panelIconRevealTimer = null;
                    }
                    return;
                }
                const pendingIcon = this.runtime.panelIconRevealPendingIcon;
                if (pendingIcon instanceof HTMLElement) {
                    this.schedulePanelIconReveal(pendingIcon);
                } else {
                    this.clearPanelIconRevealTimer();
                }
            };
            document.addEventListener('visibilitychange', this.runtime.panelIconRevealVisibilityHandler);
        },

        schedulePanelIconReveal(icon) {
            this.clearPanelIconRevealTimer();
            if (!(icon instanceof HTMLElement)) return;
            this.runtime.panelIconRevealPendingIcon = icon;
            this.bindPanelIconRevealVisibilityHandler();
            if (this.isPanelIconRevealDocumentHidden()) return;
            this.runtime.panelIconRevealTimer = setTimeout(() => {
                this.runtime.panelIconRevealTimer = null;
                if (this.isPanelIconRevealDocumentHidden()) return;
                const pendingIcon = this.runtime.panelIconRevealPendingIcon;
                this.clearPanelIconRevealVisibilityHandler();
                this.runtime.panelIconRevealPendingIcon = null;
                if (State.config.panelOpen) return;
                const revealIcon = pendingIcon instanceof HTMLElement ? pendingIcon : icon;
                if (!revealIcon.isConnected) return;
                revealIcon.style.display = 'flex';
            }, 300);
        },

        isToolOpenRetryDocumentHidden() {
            try {
                return document.visibilityState === 'hidden';
            } catch {
                return false;
            }
        },

        clearOptimizerOpenRetryVisibilityHandler() {
            const handler = this.runtime.optimizerOpenRetryVisibilityHandler;
            if (typeof handler === 'function') {
                document.removeEventListener('visibilitychange', handler);
            }
            this.runtime.optimizerOpenRetryVisibilityHandler = null;
            this.runtime.optimizerOpenRetryPendingCallback = null;
        },

        bindOptimizerOpenRetryVisibilityHandler() {
            if (typeof this.runtime.optimizerOpenRetryVisibilityHandler === 'function') return;
            this.runtime.optimizerOpenRetryVisibilityHandler = () => {
                if (this.isToolOpenRetryDocumentHidden()) {
                    if (this.runtime.optimizerOpenRetryTimer) {
                        clearTimeout(this.runtime.optimizerOpenRetryTimer);
                        this.runtime.optimizerOpenRetryTimer = null;
                    }
                    return;
                }
                const pendingCallback = this.runtime.optimizerOpenRetryPendingCallback;
                this.clearOptimizerOpenRetryVisibilityHandler();
                if (typeof pendingCallback === 'function') pendingCallback();
            };
            document.addEventListener('visibilitychange', this.runtime.optimizerOpenRetryVisibilityHandler);
        },

        clearOptimizerOpenRetryTimer() {
            if (this.runtime.optimizerOpenRetryTimer) {
                clearTimeout(this.runtime.optimizerOpenRetryTimer);
                this.runtime.optimizerOpenRetryTimer = null;
            }
            this.clearOptimizerOpenRetryVisibilityHandler();
        },

        scheduleOptimizerOpenRetry(callback) {
            this.clearOptimizerOpenRetryTimer();
            if (typeof callback !== 'function') return;
            this.runtime.optimizerOpenRetryPendingCallback = callback;
            this.bindOptimizerOpenRetryVisibilityHandler();
            if (this.isToolOpenRetryDocumentHidden()) {
                return;
            }
            this.runtime.optimizerOpenRetryTimer = setTimeout(() => {
                this.runtime.optimizerOpenRetryTimer = null;
                const pendingCallback = this.runtime.optimizerOpenRetryPendingCallback;
                this.clearOptimizerOpenRetryVisibilityHandler();
                if (typeof pendingCallback === 'function') pendingCallback();
            }, 1000);
        },

        clearKeywordPlanOpenRetryVisibilityHandler() {
            const handler = this.runtime.keywordPlanOpenRetryVisibilityHandler;
            if (typeof handler === 'function') {
                document.removeEventListener('visibilitychange', handler);
            }
            this.runtime.keywordPlanOpenRetryVisibilityHandler = null;
            this.runtime.keywordPlanOpenRetryPendingCallback = null;
        },

        bindKeywordPlanOpenRetryVisibilityHandler() {
            if (typeof this.runtime.keywordPlanOpenRetryVisibilityHandler === 'function') return;
            this.runtime.keywordPlanOpenRetryVisibilityHandler = () => {
                if (this.isToolOpenRetryDocumentHidden()) {
                    if (this.runtime.keywordPlanOpenRetryTimer) {
                        clearTimeout(this.runtime.keywordPlanOpenRetryTimer);
                        this.runtime.keywordPlanOpenRetryTimer = null;
                    }
                    return;
                }
                const pendingCallback = this.runtime.keywordPlanOpenRetryPendingCallback;
                this.clearKeywordPlanOpenRetryVisibilityHandler();
                if (typeof pendingCallback === 'function') pendingCallback();
            };
            document.addEventListener('visibilitychange', this.runtime.keywordPlanOpenRetryVisibilityHandler);
        },

        clearKeywordPlanOpenRetryTimer() {
            if (this.runtime.keywordPlanOpenRetryTimer) {
                clearTimeout(this.runtime.keywordPlanOpenRetryTimer);
                this.runtime.keywordPlanOpenRetryTimer = null;
            }
            this.clearKeywordPlanOpenRetryVisibilityHandler();
        },

        scheduleKeywordPlanOpenRetry(callback) {
            this.clearKeywordPlanOpenRetryTimer();
            if (typeof callback !== 'function') return;
            this.runtime.keywordPlanOpenRetryPendingCallback = callback;
            this.bindKeywordPlanOpenRetryVisibilityHandler();
            if (this.isToolOpenRetryDocumentHidden()) {
                return;
            }
            this.runtime.keywordPlanOpenRetryTimer = setTimeout(() => {
                this.runtime.keywordPlanOpenRetryTimer = null;
                const pendingCallback = this.runtime.keywordPlanOpenRetryPendingCallback;
                this.clearKeywordPlanOpenRetryVisibilityHandler();
                if (typeof pendingCallback === 'function') pendingCallback();
            }, 800);
        },

        bindPanelOutsideClickHandler(panel, icon, closePanel) {
            this.unbindPanelOutsideClickHandler();
            if (!(panel instanceof HTMLElement) || !(icon instanceof HTMLElement) || typeof closePanel !== 'function') return;
            this.runtime.panelOutsideClickHandler = (event) => {
                const target = event.target;
                if (!(target instanceof Node)) return;
                if (State.config.panelOpen && !panel.contains(target) && !icon.contains(target)) {
                    closePanel(false);
                }
            };
            document.addEventListener('click', this.runtime.panelOutsideClickHandler);
            this.runtime.panelOutsideClickHandlerBound = true;
        },

        unbindPanelOutsideClickHandler() {
            if (!this.runtime.panelOutsideClickHandlerBound) return;
            if (typeof this.runtime.panelOutsideClickHandler === 'function') {
                document.removeEventListener('click', this.runtime.panelOutsideClickHandler);
            }
            this.runtime.panelOutsideClickHandler = null;
            this.runtime.panelOutsideClickHandlerBound = false;
        },

        bindPluginScrollChainGuard() {
            if (this.runtime.scrollChainGuardBound) return;
            this.runtime.scrollChainGuardBound = true;
            document.addEventListener('wheel', (event) => {
                if (event.defaultPrevented || event.ctrlKey) return;
                const target = event.target;
                if (!(target instanceof Element)) return;
                const pluginRoot = target.closest('#am-helper-panel, #am-magic-report-popup, #alimama-escort-helper-ui, #am-campaign-concurrent-log-popup, #am-campaign-copy-overview-popup, #am-campaign-copy-success-popup, #am-campaign-batch-plus-menu, #am-campaign-batch-confirm-popup, #am-campaign-ai-max-batch-popup, #am-report-capture-panel');
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
                    --am26-focus: rgba(69, 84, 229, 0.32);
                    --am26-danger-soft: rgba(234, 79, 79, 0.12);
                    --am26-warning-soft: rgba(232, 163, 37, 0.14);
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
                    padding: 0;
                    background: var(--am26-surface-strong);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    box-shadow: var(--am26-shadow), var(--am26-glow);
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    color: var(--am26-primary);
                    font: inherit;
                    appearance: none;
                    -webkit-appearance: none;
                    transition: all 0.3s ease;
                }
                #am-helper-icon svg {
                    transform-origin: center;
                    animation: am-helper-icon-pulse 2.4s ease-in-out infinite;
                    will-change: transform;
                }
                #am-helper-icon:hover {
                    transform: translateY(-2px);
                    border-color: var(--am26-border-strong);
                    color: var(--am26-primary-strong);
                    background: var(--am26-surface-strong);
                    box-shadow: 0 10px 28px rgba(31, 38, 135, 0.18), var(--am26-glow);
                }
                #am-helper-icon:hover svg {
                    animation-duration: 1.2s;
                }
                #am-helper-icon:focus-visible {
                    outline: 2px solid rgba(69, 84, 229, 0.42);
                    outline-offset: 3px;
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
                    width: 304px; min-width: 280px; max-width: 520px;
                    opacity: 1; transform: scale(1); transform-origin: top right;
                    transition: opacity 0.3s ease, transform 0.3s ease, width 0.5s ease, box-shadow 0.24s ease;
                    overflow: hidden;
                }
                #am-helper-panel.hidden {
                    opacity: 0; transform: scale(0.8); pointer-events: none;
                }

                /* 头部 */
                .am-header {
                    padding: 12px 14px 12px 16px;
                    border-bottom: 1px solid var(--am26-border);
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.46), rgba(255, 255, 255, 0.22));
                    display: flex; justify-content: space-between; align-items: center; gap: 10px;
                }
                .am-title {
                    font-weight: 600; font-size: 15px; color: var(--am26-text);
                    display: flex; align-items: center; gap: 8px;
                    min-width: 0;
                    text-shadow: 0 1px 0 rgba(255,255,255,0.4);
                }
                .am-title .am-brand-icon {
                    flex: 0 0 16px;
                }
                .am-version {
                    font-size: 10px; color: var(--am26-text-soft); font-weight: normal;
                    background: rgba(255,255,255,0.48); padding: 1px 5px; border-radius: 999px;
                    border: 1px solid rgba(255, 255, 255, 0.48);
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
                    border: 0; padding: 0; background: transparent; font: inherit;
                    appearance: none; -webkit-appearance: none;
                }
                .am-close-btn:hover { background: rgba(234, 79, 79, 0.1); color: var(--am26-danger); }
                .am-close-btn:focus-visible {
                    outline: 2px solid rgba(234, 79, 79, 0.34);
                    outline-offset: 2px;
                }

                /* 内容区 */
                .am-body {
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }



                .am-tools-row {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    width: 100%;
                    gap: 8px;
                    padding: 8px;
                    margin-bottom: 0;
                    box-sizing: border-box;
                    border-radius: 14px;
                    border: 1px solid var(--am26-border);
                    background: var(--am26-surface);
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.56), 0 4px 14px rgba(31, 53, 109, 0.05);
                }
                .am-tool-btn {
                    position: relative;
                    border: 1px solid rgba(255, 255, 255, 0.46);
                    background: rgba(255, 255, 255, 0.56);
                    color: var(--am26-text-soft, #505a74);
                    border-radius: 12px;
                    padding: 0 11px;
                    min-height: 38px;
                    font-size: 12px;
                    font-family: inherit;
                    font-weight: 600;
                    line-height: 1;
                    cursor: pointer;
                    transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 6px;
                    white-space: nowrap;
                    min-width: 0;
                    overflow: hidden;
                    box-sizing: border-box;
                }
                .am-tool-btn svg {
                    width: 14px;
                    height: 14px;
                    flex: 0 0 14px;
                }
                .am-tool-label {
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .am-tool-btn:focus-visible {
                    outline: 2px solid rgba(37, 99, 235, 0.45);
                    outline-offset: 1px;
                }
                .am-tool-btn:hover,
                .am-tool-btn.active {
                    background: rgba(255, 255, 255, 0.88);
                    border-color: var(--am26-border-strong);
                    color: var(--am26-text, #1b2438);
                    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.7);
                    transform: translateY(-1px);
                    font-weight: 700;
                }

                #am-assist-switches {
                    max-height: 0;
                    opacity: 0;
                    transform: translateY(-6px);
                    overflow: hidden;
                    pointer-events: none;
                    margin-top: 0;
                    padding: 0;
                    border-radius: 14px;
                    border: 1px solid transparent;
                    background: transparent;
                    box-shadow: none;
                    transition: max-height 0.32s ease, opacity 0.24s ease, transform 0.32s ease, margin-top 0.32s ease, padding 0.32s ease, border-color 0.32s ease, background 0.32s ease, box-shadow 0.32s ease;
                }
                #am-assist-switches.open {
                    max-height: 240px;
                    opacity: 1;
                    transform: translateY(0);
                    pointer-events: auto;
                    margin-top: 0;
                    padding: 8px;
                    border-color: var(--am26-border);
                    background: var(--am26-surface);
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.52), 0 4px 14px rgba(31, 53, 109, 0.04);
                }

                .am-switches-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 8px;
                    background: transparent;
                    padding: 0;
                    border-radius: 0;
                    border: none;
                    box-shadow: none;
                }
                .am-switch-btn {
                    border: 1px solid rgba(255, 255, 255, 0.42);
                    background: rgba(255, 255, 255, 0.62);
                    color: var(--am26-text, #1b2438);
                    border-radius: 999px;
                    font-size: 11px;
                    font-family: inherit;
                    line-height: 1.2;
                    font-weight: 600;
                    cursor: pointer;
                    min-height: 28px;
                    padding: 6px 10px;
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
                    transform: translateY(-1px);
                    box-shadow: 0 6px 14px rgba(31, 53, 109, 0.12);
                    border-color: var(--am26-border-strong);
                    background: var(--am26-surface-strong);
                }
                .am-switch-btn:focus-visible {
                    outline: 2px solid rgba(69, 84, 229, 0.36);
                    outline-offset: 2px;
                }
                .am-switch-btn:not(.active) {
                    opacity: 0.78;
                    border-color: rgba(255, 255, 255, 0.24);
                    box-shadow: none;
                    background: rgba(255, 255, 255, 0.28);
                    transform: none;
                }
                .am-switch-btn.active {
                    border-color: rgba(69, 84, 229, 0.26);
                    background: rgba(69, 84, 229, 0.10);
                    color: var(--am26-primary-strong);
                }
                .am-switch-btn:not(.active)::before {
                    background: rgba(80, 90, 116, 0.28);
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
                    border: 1px solid transparent;
                    border-radius: 999px;
                    background: transparent;
                    color: var(--am26-text-soft);
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
                    color: var(--am26-primary);
                    border-color: var(--am26-border);
                    background: var(--am26-surface);
                }
                .am-campaign-search-btn:focus-visible {
                    outline: none;
                    box-shadow: 0 0 0 2px rgba(69, 84, 229, 0.24);
                    border-color: rgba(69, 84, 229, 0.28);
                    background: var(--am26-surface-strong);
                }
                .am-campaign-concurrent-start-btn:hover {
                    color: var(--am26-success);
                    border-color: rgba(14, 168, 111, 0.28);
                    background: rgba(14, 168, 111, 0.12);
                }
                .am-campaign-copy-btn {
                    position: relative;
                    width: auto;
                    min-width: 90px;
                    height: 24px;
                    min-height: 24px;
                    gap: 5px;
                    padding: 0 5px 0 8px;
                    overflow: hidden;
                    isolation: isolate;
                    border: 0;
                    border-radius: 500px;
                    background: rgb(255, 255, 255);
                    color: #333333;
                    box-shadow: rgba(0, 0, 0, 0.06) 0 4px 8px 0;
                    font-size: 12px;
                    font-weight: 400;
                    line-height: 1;
                    white-space: nowrap;
                }
                .am-campaign-copy-btn::before,
                .am-campaign-copy-btn::after {
                    content: '';
                    position: absolute;
                    z-index: 0;
                    width: 48px;
                    height: 28px;
                    bottom: -24px;
                    left: 0;
                    border-radius: 999px;
                    opacity: 0.2;
                    filter: blur(14px);
                    pointer-events: none;
                }
                .am-campaign-copy-btn::before {
                    background: rgb(51, 51, 255);
                    animation: am-campaign-copy-shadow-left 0.72s cubic-bezier(0.22, 1, 0.36, 1) both;
                }
                .am-campaign-copy-btn::after {
                    bottom: -16px;
                    left: 50%;
                    background: rgb(153, 51, 255);
                    animation: am-campaign-copy-shadow-right 0.72s cubic-bezier(0.22, 1, 0.36, 1) 80ms both;
                }
                @keyframes am-campaign-copy-shadow-left {
                    0% {
                        bottom: -24px;
                        left: 0;
                    }
                    50% {
                        bottom: -16px;
                        left: 50%;
                    }
                    100% {
                        bottom: -24px;
                        left: 0;
                    }
                }
                @keyframes am-campaign-copy-shadow-right {
                    0% {
                        bottom: -16px;
                        left: 50%;
                    }
                    50% {
                        bottom: -24px;
                        left: 0;
                    }
                    100% {
                        bottom: -16px;
                        left: 50%;
                    }
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
                    color: #333333;
                    background: rgb(255, 255, 255);
                    box-shadow: rgba(0, 0, 0, 0.08) 0 5px 10px 0;
                }
                .am-campaign-copy-btn:focus-visible {
                    color: #333333;
                    background: rgb(255, 255, 255);
                    box-shadow: 0 0 0 2px rgba(69, 84, 229, 0.18), rgba(0, 0, 0, 0.06) 0 4px 8px 0;
                }
                .am-campaign-copy-icon {
                    position: relative;
                    z-index: 1;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 14px;
                    height: 14px;
                    flex: 0 0 14px;
                    color: inherit;
                    background: transparent;
                    box-shadow: none;
                    pointer-events: none;
                }
                .am-campaign-copy-icon svg {
                    width: 13px;
                    height: 13px;
                    stroke-width: 2.1;
                }
                .am-campaign-copy-label {
                    position: relative;
                    z-index: 1;
                    line-height: 18px;
                    font-weight: 400;
                    letter-spacing: 0;
                    color: inherit;
                    pointer-events: none;
                }
                .am-campaign-copy-btn .am-wxt-copy-multi {
                    position: relative;
                    z-index: 1;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 2px;
                    margin-left: 0;
                    height: 18px;
                    min-width: 22px;
                    padding: 0 5px;
                    border-radius: 999px;
                    border: 1px solid rgba(218, 222, 235, 0.95);
                    background: rgba(255, 255, 255, 0.86);
                    color: #333333;
                    font-size: 12px;
                    font-weight: 400;
                    line-height: 16px;
                    box-sizing: border-box;
                    user-select: none;
                    pointer-events: auto;
                    box-shadow: none;
                }
                @media (prefers-reduced-motion: reduce) {
                    .am-campaign-copy-btn::before,
                    .am-campaign-copy-btn::after {
                        animation: none;
                    }
                }
                .am-campaign-copy-btn .am-wxt-copy-multi-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    color: inherit;
                    opacity: 1;
                    pointer-events: none;
                }
                .am-campaign-copy-btn .am-wxt-copy-multi-icon svg {
                    width: 12px;
                    height: 12px;
                }
                .am-campaign-copy-btn .am-wxt-copy-multi-num {
                    min-width: 7px;
                    text-align: center;
                    font-weight: 400;
                    pointer-events: none;
                }
                .am-campaign-batch-plus-wrap {
                    display: inline-block;
                    float: none;
                    margin-left: 0;
                    vertical-align: top;
                }
                .am-campaign-batch-plus-wrap.fl {
                    display: block;
                    float: left;
                }
                .am-campaign-batch-plus-native {
                    display: inline-block;
                    vertical-align: top;
                }
                .am-campaign-batch-plus-native.is-disabled {
                    cursor: not-allowed;
                }
                #am-campaign-batch-plus-menu {
                    position: absolute;
                    z-index: 2147483646;
                    width: max-content;
                    min-width: 120px;
                    padding: 6px;
                    border: 1px solid var(--am26-border, rgba(255, 255, 255, 0.4));
                    border-radius: 10px;
                    background: var(--am26-panel-strong, rgba(255, 255, 255, 0.88));
                    box-shadow: var(--am26-shadow, 0 8px 32px 0 rgba(31, 38, 135, 0.15));
                    box-sizing: border-box;
                    color: var(--am26-text, #1b2438);
                    font-family: var(--am26-font, "SF Pro Display", "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif);
                    backdrop-filter: blur(18px) saturate(160%);
                    -webkit-backdrop-filter: blur(18px) saturate(160%);
                }
                #am-campaign-batch-plus-menu .am-campaign-batch-plus-item {
                    width: 100%;
                    min-height: 32px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    border: 0;
                    border-radius: 8px;
                    padding: 0 10px;
                    background: transparent;
                    color: var(--am26-text-soft, #505a74);
                    font-size: 12px;
                    line-height: 18px;
                    text-align: left;
                    white-space: nowrap;
                    cursor: pointer;
                    box-sizing: border-box;
                    transition: background-color 0.16s ease, color 0.16s ease, transform 0.16s ease;
                }
                #am-campaign-batch-plus-menu .am-campaign-batch-plus-item-icon {
                    width: 14px;
                    height: 14px;
                    flex: 0 0 14px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    color: currentColor;
                }
                #am-campaign-batch-plus-menu .am-campaign-batch-plus-item-icon svg {
                    width: 14px;
                    height: 14px;
                    display: block;
                }
                #am-campaign-batch-plus-menu .am-campaign-batch-plus-item-label {
                    min-width: 0;
                }
                #am-campaign-batch-plus-menu .am-campaign-batch-plus-item:hover,
                #am-campaign-batch-plus-menu .am-campaign-batch-plus-item:focus-visible {
                    background: var(--am26-surface-strong, rgba(255, 255, 255, 0.52));
                    color: var(--am26-text, #1b2438);
                    outline: 2px solid var(--am26-focus, rgba(69, 84, 229, 0.32));
                    outline-offset: 2px;
                }
                #am-campaign-batch-plus-menu .am-campaign-batch-plus-item.is-danger {
                    color: var(--am26-danger, #ea4f4f);
                }
                #am-campaign-batch-plus-menu .am-campaign-batch-plus-item.is-danger:hover,
                #am-campaign-batch-plus-menu .am-campaign-batch-plus-item.is-danger:focus-visible {
                    background: var(--am26-danger-soft, rgba(234, 79, 79, 0.12));
                    color: var(--am26-danger, #ea4f4f);
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
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    margin-left: 6px;
                    gap: 5px;
                    height: 32px;
                    padding: 0 10px;
                    border: 1px solid var(--am26-border);
                    border-radius: 8px;
                    background: var(--am26-surface-strong);
                    color: var(--am26-text);
                    font-size: 12px;
                    font-weight: 600;
                    line-height: normal;
                    cursor: pointer;
                    transition: all 0.18s ease;
                    vertical-align: middle;
                    white-space: nowrap;
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.36);
                }
                .am-potential-plan-export-btn:hover,
                .am-potential-plan-export-btn:focus-visible {
                    border-color: rgba(69, 84, 229, 0.28);
                    background: var(--am26-panel-strong);
                    color: var(--am26-primary-strong);
                    box-shadow: 0 0 0 3px rgba(69, 84, 229, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.36);
                    outline: none;
                    transform: translateY(-1px);
                }
                .am-potential-plan-export-btn.is-running {
                    opacity: 0.72;
                    pointer-events: none;
                }
                .am-potential-plan-export-icon {
                    display: inline-flex;
                    width: 13px;
                    height: 13px;
                    align-items: center;
                    justify-content: center;
                    color: var(--am26-primary);
                    flex: 0 0 auto;
                }
                .am-potential-plan-export-icon svg {
                    width: 13px;
                    height: 13px;
                    display: block;
                    fill: none;
                    stroke: currentColor;
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
                    border: 1px solid var(--am26-border) !important;
                    border-radius: 4px;
                    background: rgba(255, 255, 255, 0.58) !important;
                    color: var(--am26-text) !important;
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
                .am-potential-plan-export-btn .am-potential-plan-export-days-input:focus-visible {
                    border-color: rgba(69, 84, 229, 0.42) !important;
                    box-shadow: 0 0 0 2px rgba(69, 84, 229, 0.12) !important;
                }
                .am-potential-plan-export-btn .am-potential-plan-export-days-input:disabled {
                    opacity: 1;
                    -webkit-text-fill-color: var(--am26-text);
                }
                .am-potential-plan-export-days-unit {
                    color: var(--am26-text-soft);
                    font-size: 12px;
                    line-height: normal;
                }
                .am-potential-plan-export-label {
                    margin-left: 4px;
                }
                .am-potential-plan-export-status {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                    white-space: nowrap;
                    border: 0;
                }
                @media (prefers-reduced-motion: reduce) {
                    .am-potential-plan-export-btn {
                        transition: none;
                    }
                    .am-potential-plan-export-btn:hover,
                    .am-potential-plan-export-btn:focus-visible {
                        transform: none;
                    }
                }
                #am-campaign-concurrent-log-popup {
                    position: fixed;
                    inset: 0;
                    padding: 24px;
                    background: rgba(255, 255, 255, 0.72);
                    -webkit-backdrop-filter: blur(8px) saturate(1.15);
                    backdrop-filter: blur(8px) saturate(1.15);
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
                    border-radius: 18px;
                    border: 1px solid var(--am26-border-strong);
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.88));
                    color: var(--am26-text);
                    box-shadow: var(--am26-shadow);
                    -webkit-backdrop-filter: blur(20px) saturate(1.4);
                    backdrop-filter: blur(20px) saturate(1.4);
                    overflow: hidden;
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    padding: 12px 14px;
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--am26-text);
                    border-bottom: 1px solid var(--am26-border);
                    background: var(--am26-surface-strong);
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-heading {
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-icon {
                    width: 28px;
                    height: 28px;
                    flex: 0 0 auto;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 10px;
                    background: rgba(69, 84, 229, 0.12);
                    color: var(--am26-primary);
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-title {
                    margin: 0;
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-size: 14px;
                    line-height: 20px;
                    font-weight: 700;
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-close {
                    flex: 0 0 auto;
                    border: 1px solid transparent;
                    background: var(--am26-surface);
                    color: var(--am26-text-soft);
                    line-height: 1;
                    cursor: pointer;
                    width: 32px;
                    height: 32px;
                    padding: 0;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    transition: color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-close:hover {
                    background: rgba(234, 79, 79, 0.1);
                    color: var(--am26-danger, #ea4f4f);
                    border-color: rgba(234, 79, 79, 0.24);
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-close:focus-visible {
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(69, 84, 229, 0.28);
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-status {
                    padding: 10px 14px;
                    border-bottom: 1px solid var(--am26-border);
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--am26-text-soft);
                    background: var(--am26-surface);
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-status.is-running {
                    color: var(--am26-primary-strong);
                    background: rgba(69, 84, 229, 0.12);
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-status.is-success {
                    color: var(--am26-success);
                    background: rgba(14, 168, 111, 0.12);
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-status.is-warning {
                    color: var(--am26-warning, #e8a325);
                    background: rgba(232, 163, 37, 0.14);
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-status.is-error {
                    color: var(--am26-danger);
                    background: rgba(234, 79, 79, 0.12);
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-body {
                    flex: 1;
                    min-height: 180px;
                    overflow: auto;
                    overscroll-behavior: contain;
                    background: linear-gradient(145deg, rgba(255, 255, 255, 0.52), rgba(246, 250, 255, 0.72));
                    padding: 10px 12px;
                    font-family: var(--am26-mono);
                    font-size: 12px;
                    line-height: 1.5;
                    color: var(--am26-text-soft);
                    outline: none;
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-body:focus-visible {
                    box-shadow: inset 0 0 0 2px rgba(69, 84, 229, 0.22);
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-line {
                    white-space: pre-wrap;
                    word-break: break-word;
                    margin-bottom: 6px;
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-line.is-error {
                    color: var(--am26-danger);
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-line.is-warn {
                    color: var(--am26-warning, #e8a325);
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-line.is-success {
                    color: var(--am26-success);
                }
                #am-campaign-concurrent-log-popup .am-concurrent-log-line:last-child {
                    margin-bottom: 0;
                }
                @media (prefers-reduced-motion: reduce) {
                    #am-campaign-concurrent-log-popup .am-concurrent-log-close {
                        transition: none !important;
                        transform: none !important;
                    }
                }

                #am-campaign-copy-overview-popup {
                    position: fixed;
                    inset: 0;
                    z-index: 2147483646;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    background: rgba(255, 255, 255, 0.72);
                    -webkit-backdrop-filter: blur(8px) saturate(1.15);
                    backdrop-filter: blur(8px) saturate(1.15);
                }
                #am-campaign-copy-overview-popup .am-copy-overview-card {
                    width: min(1080px, calc(100vw - 48px));
                    max-height: min(84vh, 680px);
                    display: flex;
                    flex-direction: column;
                    border: 1px solid var(--am26-border-strong);
                    border-radius: 18px;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.88));
                    color: var(--am26-text);
                    box-shadow: var(--am26-shadow);
                    -webkit-backdrop-filter: blur(20px) saturate(1.45);
                    backdrop-filter: blur(20px) saturate(1.45);
                    overflow: hidden;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 12px;
                    padding: 16px 24px 8px;
                    background: rgba(255, 255, 255, 0.28);
                }
                #am-campaign-copy-overview-popup .am-copy-overview-heading {
                    min-width: 0;
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-icon {
                    width: 16px;
                    height: 16px;
                    margin-top: 4px;
                    flex: 0 0 auto;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: rgba(69, 84, 229, 0.12);
                    color: var(--am26-primary);
                }
                #am-campaign-copy-overview-popup .am-copy-overview-title {
                    margin: 0;
                    font-size: 16px;
                    line-height: 24px;
                    font-weight: 700;
                    color: var(--am26-text);
                }
                #am-campaign-copy-overview-popup .am-copy-overview-title-row {
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-state,
                #am-campaign-copy-success-popup .am-copy-success-state {
                    flex: 0 0 auto;
                    display: inline-flex;
                    align-items: center;
                    height: 22px;
                    padding: 0 9px;
                    border: 1px solid var(--am26-border);
                    border-radius: 999px;
                    background: var(--am26-surface-strong);
                    color: var(--am26-primary);
                    font-size: 11px;
                    font-weight: 700;
                    line-height: 20px;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-subtitle {
                    margin: 4px 0 0;
                    font-size: 12px;
                    line-height: 18px;
                    color: var(--am26-text-soft);
                }
                #am-campaign-copy-overview-popup .am-copy-overview-close {
                    width: 28px;
                    height: 28px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid transparent;
                    border-radius: 8px;
                    background: transparent;
                    color: var(--am26-text-soft);
                    line-height: 1;
                    cursor: pointer;
                    transition: background-color 0.16s ease, color 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-close:hover,
                #am-campaign-copy-overview-popup .am-copy-overview-close:focus-visible {
                    background: rgba(255, 255, 255, 0.48);
                    border-color: rgba(69, 84, 229, 0.18);
                    color: var(--am26-primary);
                    outline: 2px solid rgba(69, 84, 229, 0.34);
                    outline-offset: 2px;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-bulkbar {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 8px 18px;
                    margin: 12px 24px 0;
                    padding: 0 0 10px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.42);
                }
                #am-campaign-copy-overview-popup .am-copy-overview-bulk-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    min-width: 0;
                    color: var(--am26-text-soft);
                    font-size: 12px;
                    line-height: 28px;
                    white-space: nowrap;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-renamebar {
                    align-items: flex-start;
                    gap: 10px 16px;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-renamebar .am-copy-overview-bulk-group {
                    flex-wrap: wrap;
                    row-gap: 6px;
                    white-space: normal;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-bulk-title {
                    color: var(--am26-text);
                    font-weight: 600;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-bulk-field {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    margin: 0;
                    color: var(--am26-text-soft);
                    font-weight: 400;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-bulk-input,
                #am-campaign-copy-overview-popup .am-copy-overview-bulk-select {
                    width: 72px;
                    height: 28px;
                    border: 0;
                    border-bottom: 1px solid rgba(80, 90, 116, 0.28);
                    border-radius: 0;
                    padding: 0 2px;
                    box-sizing: border-box;
                    background: transparent;
                    color: var(--am26-text);
                    font-size: 12px;
                    line-height: 28px;
                    outline: none;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-renamebar .am-copy-overview-bulk-input[type="text"] {
                    width: 112px;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-renamebar .am-copy-overview-bulk-input[type="number"] {
                    width: 64px;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-bulk-select {
                    width: 82px;
                    appearance: none;
                    padding-right: 16px;
                    background-image:
                        linear-gradient(45deg, transparent 50%, var(--am26-text-soft) 50%),
                        linear-gradient(135deg, var(--am26-text-soft) 50%, transparent 50%);
                    background-position:
                        calc(100% - 9px) 12px,
                        calc(100% - 5px) 12px;
                    background-size: 4px 4px, 4px 4px;
                    background-repeat: no-repeat;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-bulk-input:focus,
                #am-campaign-copy-overview-popup .am-copy-overview-bulk-select:focus {
                    border-bottom-color: var(--am26-primary);
                    background-color: rgba(69, 84, 229, 0.04);
                }
                #am-campaign-copy-overview-popup .am-copy-overview-bulk-step {
                    min-width: 52px;
                    color: var(--am26-text-soft);
                    font-variant-numeric: tabular-nums;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-bulk-btn {
                    height: 28px;
                    min-width: 72px;
                    border: 1px solid rgba(69, 84, 229, 0.26);
                    border-radius: 500px;
                    padding: 0 12px;
                    background: rgba(255, 255, 255, 0.38);
                    color: var(--am26-primary);
                    font-size: 12px;
                    line-height: 26px;
                    cursor: pointer;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-bulk-btn:hover,
                #am-campaign-copy-overview-popup .am-copy-overview-bulk-btn:focus-visible {
                    background: rgba(69, 84, 229, 0.1);
                    outline: 2px solid rgba(69, 84, 229, 0.32);
                    outline-offset: 2px;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-bulk-btn:disabled {
                    cursor: not-allowed;
                    opacity: 0.5;
                }
                #am-campaign-copy-overview-popup[data-am-copy-dialog-mode="rename"] [data-am-copy-mode-hidden="rename"] {
                    display: none !important;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-table-wrap {
                    flex: 1;
                    min-height: 180px;
                    margin: 14px 24px 0;
                    border: 1px solid rgba(255, 255, 255, 0.52);
                    border-radius: 8px;
                    overflow-x: hidden;
                    overflow-y: auto;
                    background: rgba(255, 255, 255, 0.36);
                }
                #am-campaign-copy-overview-popup .am-copy-overview-table {
                    width: 100%;
                    min-width: 0;
                    border-collapse: collapse;
                    table-layout: auto;
                    font-size: 12px;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-table th,
                #am-campaign-copy-overview-popup .am-copy-overview-table td {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.46);
                    padding: 9px 10px;
                    box-sizing: border-box;
                    text-align: left;
                    vertical-align: middle;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-table th {
                    position: sticky;
                    top: 0;
                    z-index: 1;
                    background: rgba(246, 250, 255, 0.72);
                    color: var(--am26-text-soft);
                    font-weight: 600;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-table th:nth-child(1),
                #am-campaign-copy-overview-popup .am-copy-overview-table td:nth-child(1) {
                    width: 42px;
                    text-align: center;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-table th:nth-child(2),
                #am-campaign-copy-overview-popup .am-copy-overview-table td:nth-child(2) {
                    width: auto;
                    min-width: 260px;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-table th:nth-child(3),
                #am-campaign-copy-overview-popup .am-copy-overview-table td:nth-child(3) {
                    width: 1%;
                    min-width: 146px;
                    white-space: nowrap;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-table th:nth-child(4),
                #am-campaign-copy-overview-popup .am-copy-overview-table td:nth-child(4) {
                    width: 1%;
                    min-width: 92px;
                    white-space: nowrap;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-table th:nth-child(5),
                #am-campaign-copy-overview-popup .am-copy-overview-table td:nth-child(5) {
                    width: 1%;
                    min-width: 172px;
                    white-space: nowrap;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-index {
                    color: var(--am26-text-soft);
                    font-variant-numeric: tabular-nums;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-input,
                #am-campaign-copy-overview-popup .am-copy-overview-select {
                    width: 100%;
                    height: 30px;
                    border: 0;
                    border-bottom: 1px solid rgba(80, 90, 116, 0.28);
                    border-radius: 0;
                    padding: 0 2px;
                    box-sizing: border-box;
                    background: transparent;
                    color: var(--am26-text);
                    font-size: 12px;
                    line-height: 30px;
                    outline: none;
                    transition: border-color 0.16s ease, background-color 0.16s ease;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-select {
                    appearance: none;
                    padding-right: 16px;
                    background-image:
                        linear-gradient(45deg, transparent 50%, var(--am26-text-soft) 50%),
                        linear-gradient(135deg, var(--am26-text-soft) 50%, transparent 50%);
                    background-position:
                        calc(100% - 9px) 13px,
                        calc(100% - 5px) 13px;
                    background-size: 4px 4px, 4px 4px;
                    background-repeat: no-repeat;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-input:focus,
                #am-campaign-copy-overview-popup .am-copy-overview-select:focus {
                    border-bottom-color: var(--am26-primary);
                    background-color: rgba(69, 84, 229, 0.04);
                }
                #am-campaign-copy-overview-popup .am-copy-overview-name {
                    min-width: 0;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-static {
                    display: block;
                    width: 100%;
                    min-height: 30px;
                    box-sizing: border-box;
                    padding: 6px 2px;
                    background: transparent;
                    color: var(--am26-text);
                    font-size: 12px;
                    line-height: 18px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-budget-cell {
                    display: grid;
                    grid-template-columns: 76px 82px;
                    gap: 8px;
                    align-items: center;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-status {
                    min-height: 34px;
                    padding: 10px 24px 6px;
                    color: var(--am26-text-soft);
                    background: rgba(255, 255, 255, 0.24);
                    font-size: 12px;
                    line-height: 18px;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-status.is-info {
                    color: var(--am26-text-soft);
                    background: var(--am26-surface);
                }
                #am-campaign-copy-overview-popup .am-copy-overview-status.is-running {
                    color: var(--am26-primary-strong);
                    background: rgba(69, 84, 229, 0.1);
                }
                #am-campaign-copy-overview-popup .am-copy-overview-status.is-success {
                    color: var(--am26-success);
                    background: rgba(14, 168, 111, 0.12);
                }
                #am-campaign-copy-overview-popup .am-copy-overview-status.is-error {
                    color: var(--am26-danger);
                    background: rgba(234, 79, 79, 0.12);
                }
                #am-campaign-copy-overview-popup .am-copy-overview-footer {
                    display: flex;
                    justify-content: flex-start;
                    gap: 8px;
                    padding: 0 24px 16px;
                    background: rgba(255, 255, 255, 0.24);
                }
                #am-campaign-copy-overview-popup .am-copy-overview-submit,
                #am-campaign-copy-overview-popup .am-copy-overview-cancel {
                    min-width: 76px;
                    height: 32px;
                    border: 0;
                    border-radius: 500px;
                    padding: 0 14px;
                    box-sizing: border-box;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.16s ease, color 0.16s ease, opacity 0.16s ease, box-shadow 0.16s ease;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-submit {
                    background: var(--am26-primary);
                    color: #ffffff;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-cancel {
                    background: rgba(69, 84, 229, 0.1);
                    color: var(--am26-primary);
                }
                #am-campaign-copy-overview-popup .am-copy-overview-submit:hover,
                #am-campaign-copy-overview-popup .am-copy-overview-submit:focus-visible {
                    background: var(--am26-primary-strong);
                    outline: 2px solid rgba(69, 84, 229, 0.34);
                    outline-offset: 2px;
                }
                #am-campaign-copy-overview-popup .am-copy-overview-cancel:hover,
                #am-campaign-copy-overview-popup .am-copy-overview-cancel:focus-visible {
                    background: rgba(69, 84, 229, 0.16);
                    outline: 2px solid rgba(69, 84, 229, 0.3);
                    outline-offset: 2px;
                }
                #am-campaign-copy-overview-popup button:disabled,
                #am-campaign-copy-overview-popup input:disabled,
                #am-campaign-copy-overview-popup select:disabled {
                    opacity: 0.68;
                    cursor: not-allowed;
                }

                #am-campaign-copy-success-popup {
                    position: fixed;
                    inset: 0;
                    z-index: 2147483646;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    background: rgba(255, 255, 255, 0.72);
                    -webkit-backdrop-filter: blur(8px) saturate(1.15);
                    backdrop-filter: blur(8px) saturate(1.15);
                }
                #am-campaign-copy-success-popup .am-copy-success-card {
                    width: min(420px, calc(100vw - 28px));
                    max-height: min(84vh, 680px);
                    display: flex;
                    flex-direction: column;
                    border: 1px solid var(--am26-border-strong);
                    border-radius: 18px;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.88));
                    color: var(--am26-text);
                    box-shadow: var(--am26-shadow);
                    -webkit-backdrop-filter: blur(20px) saturate(1.45);
                    backdrop-filter: blur(20px) saturate(1.45);
                    overflow: hidden;
                }
                #am-campaign-copy-success-popup .am-copy-success-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 16px 24px 8px;
                    background: rgba(255, 255, 255, 0.28);
                }
                #am-campaign-copy-success-popup .am-copy-success-icon {
                    width: 22px;
                    height: 22px;
                    flex: 0 0 auto;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: rgba(14, 168, 111, 0.14);
                    color: var(--am26-success);
                }
                #am-campaign-copy-success-popup .am-copy-success-title {
                    min-width: 0;
                    flex: 1 1 auto;
                    margin: 0;
                    font-size: 16px;
                    line-height: 24px;
                    font-weight: 700;
                    color: var(--am26-text);
                }
                #am-campaign-copy-success-popup .am-copy-success-state {
                    color: var(--am26-success);
                    background: rgba(14, 168, 111, 0.12);
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
                    color: var(--am26-text-soft);
                    background: rgba(255, 255, 255, 0.36);
                }
                #am-campaign-copy-success-popup .am-copy-success-footer {
                    display: flex;
                    justify-content: flex-start;
                    gap: 8px;
                    padding: 0 24px 16px;
                    background: rgba(255, 255, 255, 0.28);
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
                    background: var(--am26-primary);
                    color: #ffffff;
                    box-shadow: none;
                }
                #am-campaign-copy-success-popup .am-copy-success-cancel {
                    background: rgba(69, 84, 229, 0.1);
                    color: var(--am26-primary);
                }
                #am-campaign-copy-success-popup .am-copy-success-confirm:hover,
                #am-campaign-copy-success-popup .am-copy-success-confirm:focus-visible {
                    background: var(--am26-primary-strong);
                    outline: 2px solid rgba(69, 84, 229, 0.34);
                    outline-offset: 2px;
                }
                #am-campaign-copy-success-popup .am-copy-success-cancel:hover,
                #am-campaign-copy-success-popup .am-copy-success-cancel:focus-visible {
                    background: rgba(69, 84, 229, 0.16);
                    outline: 2px solid rgba(69, 84, 229, 0.3);
                    outline-offset: 2px;
                }
                @media (prefers-reduced-motion: reduce) {
                    #am-campaign-copy-overview-popup .am-copy-overview-close,
                    #am-campaign-copy-overview-popup .am-copy-overview-bulk-btn,
                    #am-campaign-copy-overview-popup .am-copy-overview-submit,
                    #am-campaign-copy-overview-popup .am-copy-overview-cancel,
                    #am-campaign-copy-success-popup .am-copy-success-confirm,
                    #am-campaign-copy-success-popup .am-copy-success-cancel {
                        transition: none;
                    }
                }

                #am-campaign-batch-confirm-popup {
                    position: fixed;
                    inset: 0;
                    z-index: 2147483646;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.48));
                    backdrop-filter: blur(8px) saturate(1.15);
                    -webkit-backdrop-filter: blur(8px) saturate(1.15);
                }
                #am-campaign-batch-confirm-popup .am-batch-confirm-card {
                    width: min(360px, calc(100vw - 28px));
                    display: flex;
                    flex-direction: column;
                    border: 1px solid var(--am26-border, rgba(255, 255, 255, 0.4));
                    border-radius: 18px;
                    background: var(--am26-panel-strong, rgba(255, 255, 255, 0.92));
                    color: var(--am26-text, #1b2438);
                    box-shadow: var(--am26-shadow, 0 8px 32px 0 rgba(31, 38, 135, 0.15));
                    overflow: hidden;
                    font-family: var(--am26-font, "SF Pro Display", "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif);
                    backdrop-filter: blur(18px) saturate(160%);
                    -webkit-backdrop-filter: blur(18px) saturate(160%);
                }
                #am-campaign-batch-confirm-popup .am-batch-confirm-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 16px 24px 8px;
                }
                #am-campaign-batch-confirm-popup .am-batch-confirm-icon {
                    width: 16px;
                    height: 16px;
                    flex: 0 0 auto;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: var(--am26-warning-soft, rgba(232, 163, 37, 0.14));
                    color: var(--am26-warning, #e8a325);
                }
                #am-campaign-batch-confirm-popup .am-batch-confirm-icon.is-danger {
                    background: var(--am26-danger-soft, rgba(234, 79, 79, 0.12));
                    color: var(--am26-danger, #ea4f4f);
                }
                #am-campaign-batch-confirm-popup .am-batch-confirm-icon svg {
                    width: 16px;
                    height: 16px;
                    display: block;
                }
                #am-campaign-batch-confirm-popup .am-batch-confirm-title {
                    margin: 0;
                    font-size: 16px;
                    line-height: 24px;
                    font-weight: 700;
                    color: var(--am26-text, #1b2438);
                }
                #am-campaign-batch-confirm-popup .am-batch-confirm-body {
                    margin: 0;
                    padding: 24px;
                    white-space: pre-wrap;
                    word-break: break-word;
                    font-family: inherit;
                    font-size: 12px;
                    line-height: 18px;
                    color: var(--am26-text-soft, #505a74);
                    background: var(--am26-surface, rgba(255, 255, 255, 0.25));
                }
                #am-campaign-batch-confirm-popup .am-batch-confirm-footer {
                    display: flex;
                    justify-content: flex-start;
                    gap: 8px;
                    padding: 0 24px 16px;
                    background: var(--am26-surface, rgba(255, 255, 255, 0.25));
                }
                #am-campaign-batch-confirm-popup .am-batch-confirm-submit,
                #am-campaign-batch-confirm-popup .am-batch-confirm-cancel {
                    min-width: 64px;
                    height: 32px;
                    border: 0;
                    border-radius: 10px;
                    padding: 0 12px;
                    box-sizing: border-box;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.16s ease, color 0.16s ease;
                }
                #am-campaign-batch-confirm-popup .am-batch-confirm-submit {
                    background: var(--am26-primary, #4554e5);
                    color: #ffffff;
                }
                #am-campaign-batch-confirm-popup .am-batch-confirm-submit.is-danger {
                    background: var(--am26-danger, #ea4f4f);
                }
                #am-campaign-batch-confirm-popup .am-batch-confirm-cancel {
                    background: var(--am26-primary-soft, rgba(42, 91, 255, 0.15));
                    color: var(--am26-primary, #4554e5);
                }
                #am-campaign-batch-confirm-popup .am-batch-confirm-submit:hover,
                #am-campaign-batch-confirm-popup .am-batch-confirm-submit:focus-visible {
                    background: var(--am26-primary-strong, #1d3fcf);
                    outline: 2px solid var(--am26-focus, rgba(69, 84, 229, 0.32));
                    outline-offset: 2px;
                }
                #am-campaign-batch-confirm-popup .am-batch-confirm-submit.is-danger:hover,
                #am-campaign-batch-confirm-popup .am-batch-confirm-submit.is-danger:focus-visible {
                    background: var(--am26-danger, #ea4f4f);
                    outline: 2px solid var(--am26-danger-soft, rgba(234, 79, 79, 0.12));
                    outline-offset: 2px;
                }
                #am-campaign-batch-confirm-popup .am-batch-confirm-cancel:hover,
                #am-campaign-batch-confirm-popup .am-batch-confirm-cancel:focus-visible {
                    background: var(--am26-primary-soft, rgba(42, 91, 255, 0.15));
                    outline: 2px solid var(--am26-focus, rgba(69, 84, 229, 0.32));
                    outline-offset: 2px;
                }
                #am-campaign-ai-max-batch-popup {
                    position: fixed;
                    inset: 0;
                    z-index: 2147483646;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 28px;
                    box-sizing: border-box;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.76), rgba(255, 255, 255, 0.46));
                    color: var(--am26-text, #1b2438);
                    font-family: var(--am26-font, "SF Pro Display", "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif);
                    backdrop-filter: blur(8px) saturate(1.15);
                    -webkit-backdrop-filter: blur(8px) saturate(1.15);
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-card {
                    width: min(980px, calc(100vw - 56px));
                    max-height: min(720px, calc(100vh - 56px));
                    display: flex;
                    flex-direction: column;
                    border: 1px solid var(--am26-border, rgba(255, 255, 255, 0.4));
                    border-radius: 18px;
                    background: var(--am26-panel-strong, rgba(255, 255, 255, 0.92));
                    box-shadow: var(--am26-shadow, 0 8px 32px 0 rgba(31, 38, 135, 0.15));
                    overflow: visible;
                    backdrop-filter: blur(18px) saturate(160%);
                    -webkit-backdrop-filter: blur(18px) saturate(160%);
                }
                #am-campaign-ai-max-batch-popup.is-native-open {
                    z-index: 2147482000;
                    background: rgba(255, 255, 255, 0.08);
                    pointer-events: none;
                }
                #am-campaign-ai-max-batch-popup.is-native-open .am-ai-max-card {
                    opacity: 0.58;
                    transform: translateX(-18px) scale(0.985);
                    box-shadow: 0 16px 44px rgba(39, 48, 83, 0.14);
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    padding: 14px 18px 12px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.45);
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-title-wrap {
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-icon {
                    width: 32px;
                    height: 32px;
                    flex: 0 0 32px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 10px;
                    background: var(--am26-primary-soft, rgba(42, 91, 255, 0.15));
                    color: var(--am26-primary, #4554e5);
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-title {
                    margin: 0;
                    font-size: 15px;
                    line-height: 20px;
                    font-weight: 700;
                    color: var(--am26-text, #1b2438);
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-subtitle {
                    margin: 2px 0 0;
                    font-size: 12px;
                    line-height: 16px;
                    color: var(--am26-text-soft, #505a74);
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-close {
                    width: 32px;
                    height: 32px;
                    border: 0;
                    border-radius: 8px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    color: var(--am26-text-soft, #505a74);
                    cursor: pointer;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-close:hover,
                #am-campaign-ai-max-batch-popup .am-ai-max-close:focus-visible {
                    background: var(--am26-surface-strong, rgba(255, 255, 255, 0.52));
                    outline: 2px solid var(--am26-focus, rgba(69, 84, 229, 0.32));
                    outline-offset: 2px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-toolbar {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 18px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.36);
                    background: var(--am26-surface, rgba(255, 255, 255, 0.25));
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-prompt-card {
                    position: relative;
                    min-width: 0;
                    display: grid;
                    gap: 10px;
                    margin: 10px 18px;
                    padding: 14px 16px 14px;
                    border: 2px solid rgba(112, 130, 255, 0.82);
                    border-radius: 18px;
                    background: rgba(255, 255, 255, 0.9);
                    box-shadow: inset 0 0 0 1px rgba(52, 199, 255, 0.32), 0 10px 24px rgba(47, 84, 235, 0.08);
                    box-sizing: border-box;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-prompt-input {
                    min-width: 0;
                    width: 100%;
                    min-height: 42px;
                    max-height: 92px;
                    resize: vertical;
                    border: 0;
                    border-radius: 10px;
                    padding: 0;
                    background: transparent;
                    color: var(--am26-text, #1b2438);
                    font: 700 14px/22px var(--am26-font, "SF Pro Display", "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif);
                    outline: none;
                    box-sizing: border-box;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-prompt-input:focus {
                    box-shadow: 0 0 0 2px var(--am26-focus, rgba(69, 84, 229, 0.32));
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-prompt-actions {
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-prompt-chip,
                #am-campaign-ai-max-batch-popup .am-ai-max-prompt-submit {
                    height: 30px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    border: 1px solid rgba(120, 173, 255, 0.42);
                    border-radius: 999px;
                    padding: 0 11px;
                    background: rgba(255, 255, 255, 0.72);
                    color: var(--am26-text-soft, #505a74);
                    font: 700 12px/18px var(--am26-font, "SF Pro Display", "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif);
                    white-space: nowrap;
                    cursor: pointer;
                    appearance: none;
                    box-sizing: border-box;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-prompt-chip svg {
                    flex: 0 0 auto;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-prompt-chip em {
                    font-style: normal;
                    font-variant-numeric: tabular-nums;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-prompt-chip.icon-only {
                    width: 32px;
                    padding: 0;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-prompt-submit {
                    margin-left: auto;
                    min-width: 96px;
                    border-color: rgba(126, 87, 255, 0.42);
                    background: linear-gradient(135deg, #6b5cff, #8c3dff);
                    color: #ffffff;
                    box-shadow: 0 8px 18px rgba(96, 64, 255, 0.28);
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-prompt-chip:hover,
                #am-campaign-ai-max-batch-popup .am-ai-max-prompt-chip:focus-visible,
                #am-campaign-ai-max-batch-popup .am-ai-max-prompt-submit:hover,
                #am-campaign-ai-max-batch-popup .am-ai-max-prompt-submit:focus-visible {
                    outline: 2px solid var(--am26-focus, rgba(69, 84, 229, 0.32));
                    outline-offset: 2px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-prompt-popover {
                    position: absolute;
                    left: 16px;
                    right: 16px;
                    top: calc(100% - 8px);
                    z-index: 2147483646;
                    display: grid;
                    gap: 8px;
                    padding: 10px;
                    border: 1px solid rgba(69, 84, 229, 0.16);
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.98);
                    box-shadow: 0 18px 40px rgba(39, 48, 83, 0.16);
                    box-sizing: border-box;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-prompt-popover[hidden] {
                    display: none;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-prompt-panel-title {
                    color: var(--am26-text, #1b2438);
                    font-size: 12px;
                    font-weight: 800;
                    line-height: 18px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-prompt-panel-help {
                    margin: 0;
                    color: var(--am26-text-soft, #505a74);
                    font-size: 11px;
                    line-height: 17px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-template-list {
                    min-width: 0;
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 8px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-template-item {
                    min-width: 0;
                    display: grid;
                    gap: 4px;
                    min-height: 74px;
                    border: 1px solid rgba(69, 84, 229, 0.14);
                    border-radius: 10px;
                    padding: 8px;
                    background: #f7f9ff;
                    color: var(--am26-text, #1b2438);
                    text-align: left;
                    cursor: pointer;
                    appearance: none;
                    box-sizing: border-box;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-template-item b,
                #am-campaign-ai-max-batch-popup .am-ai-max-template-item span {
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-template-item b {
                    white-space: nowrap;
                    font-size: 12px;
                    line-height: 16px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-template-item span {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    color: var(--am26-text-soft, #505a74);
                    font-size: 11px;
                    line-height: 16px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-template-item:hover,
                #am-campaign-ai-max-batch-popup .am-ai-max-template-item:focus-visible {
                    border-color: rgba(69, 84, 229, 0.32);
                    background: #eef3ff;
                    outline: 2px solid var(--am26-focus, rgba(69, 84, 229, 0.32));
                    outline-offset: 2px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-shield-grid {
                    min-width: 0;
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 8px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-shield-box {
                    min-width: 0;
                    display: grid;
                    gap: 7px;
                    border: 1px solid rgba(69, 84, 229, 0.12);
                    border-radius: 10px;
                    padding: 8px;
                    background: #f7f9ff;
                    box-sizing: border-box;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-shield-head,
                #am-campaign-ai-max-batch-popup .am-ai-max-shield-add {
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 6px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-shield-head b,
                #am-campaign-ai-max-batch-popup .am-ai-max-shield-head span {
                    color: var(--am26-text-soft, #505a74);
                    font-size: 11px;
                    font-weight: 700;
                    line-height: 16px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-shield-add input {
                    min-width: 0;
                    flex: 1 1 auto;
                    height: 28px;
                    border: 1px solid rgba(69, 84, 229, 0.16);
                    border-radius: 8px;
                    padding: 0 8px;
                    background: rgba(255, 255, 255, 0.86);
                    color: var(--am26-text, #1b2438);
                    font: 600 12px/18px var(--am26-font, "SF Pro Display", "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif);
                    outline: none;
                    box-sizing: border-box;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-shield-list {
                    min-width: 0;
                    display: flex;
                    align-items: flex-start;
                    gap: 5px;
                    flex-wrap: wrap;
                    min-height: 24px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-shield-empty,
                #am-campaign-ai-max-batch-popup .am-ai-max-shield-tag {
                    min-height: 22px;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    border-radius: 999px;
                    padding: 2px 7px;
                    background: rgba(255, 255, 255, 0.78);
                    color: var(--am26-text-soft, #505a74);
                    font-size: 11px;
                    font-weight: 700;
                    line-height: 16px;
                    box-sizing: border-box;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-shield-tag button {
                    width: 16px;
                    height: 16px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border: 0;
                    border-radius: 999px;
                    padding: 0;
                    background: rgba(27, 36, 56, 0.06);
                    color: var(--am26-text-soft, #505a74);
                    cursor: pointer;
                    appearance: none;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-toolbar-btn,
                #am-campaign-ai-max-batch-popup .am-ai-max-row-btn {
                    height: 30px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    border: 0;
                    border-radius: 9px;
                    padding: 0 10px;
                    background: var(--am26-primary-soft, rgba(42, 91, 255, 0.15));
                    color: var(--am26-primary, #4554e5);
                    font-size: 12px;
                    font-weight: 600;
                    white-space: nowrap;
                    cursor: pointer;
                    box-sizing: border-box;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-toolbar-btn.primary,
                #am-campaign-ai-max-batch-popup .am-ai-max-row-btn.primary {
                    background: var(--am26-primary, #4554e5);
                    color: #ffffff;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-toolbar-btn:hover,
                #am-campaign-ai-max-batch-popup .am-ai-max-toolbar-btn:focus-visible,
                #am-campaign-ai-max-batch-popup .am-ai-max-row-btn:hover,
                #am-campaign-ai-max-batch-popup .am-ai-max-row-btn:focus-visible {
                    outline: 2px solid var(--am26-focus, rgba(69, 84, 229, 0.32));
                    outline-offset: 2px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-row-btn:disabled {
                    opacity: 0.45;
                    cursor: not-allowed;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-note {
                    min-width: 0;
                    color: var(--am26-text-soft, #505a74);
                    font-size: 12px;
                    line-height: 18px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-body {
                    min-height: 220px;
                    max-height: 560px;
                    overflow: visible;
                    padding: 10px;
                    display: grid;
                    gap: 8px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-row {
                    display: grid;
                    grid-template-columns: 32px minmax(0, 1fr);
                    gap: 10px;
                    align-items: stretch;
                    min-height: 112px;
                    padding: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.42);
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.42);
                    box-sizing: border-box;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-row-index {
                    width: 24px;
                    height: 24px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 999px;
                    background: var(--am26-surface-strong, rgba(255, 255, 255, 0.52));
                    color: var(--am26-text-soft, #505a74);
                    font-size: 12px;
                    font-weight: 700;
                    font-variant-numeric: tabular-nums;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-row-main {
                    min-width: 0;
                    display: grid;
                    gap: 8px;
                    align-content: start;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-row-title {
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-plan-name {
                    min-width: 0;
                    max-width: 520px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    color: var(--am26-text, #1b2438);
                    font-size: 13px;
                    font-weight: 700;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-plan-id,
                #am-campaign-ai-max-batch-popup .am-ai-max-crowd-label,
                #am-campaign-ai-max-batch-popup .am-ai-max-row-meta {
                    flex: 0 0 auto;
                    color: var(--am26-text-soft, #505a74);
                    font-size: 11px;
                    font-weight: 600;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-row-crowds {
                    min-width: 0;
                    display: flex;
                    align-items: flex-start;
                    gap: 6px;
                    flex-wrap: wrap;
                    min-height: 26px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-row-crowds .am-ai-max-demand-popover {
                    flex: 0 1 188px;
                    max-width: 188px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-crowd-tag,
                #am-campaign-ai-max-batch-popup .am-ai-max-crowd-more,
                #am-campaign-ai-max-batch-popup .am-ai-max-crowd-empty {
                    max-width: 180px;
                    display: inline-flex;
                    align-items: center;
                    height: 22px;
                    border-radius: 999px;
                    padding: 0 8px;
                    background: var(--am26-surface-strong, rgba(255, 255, 255, 0.52));
                    color: var(--am26-text-soft, #505a74);
                    font-size: 11px;
                    font-weight: 600;
                    line-height: 22px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    box-sizing: border-box;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-crowd-more {
                    border: 1px solid rgba(69, 84, 229, 0.16);
                    appearance: none;
                    cursor: pointer;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-crowd-more:hover,
                #am-campaign-ai-max-batch-popup .am-ai-max-crowd-more:focus-visible {
                    background: rgba(69, 84, 229, 0.12);
                    color: var(--am26-primary, #4554e5);
                    outline: 2px solid var(--am26-focus, rgba(69, 84, 229, 0.32));
                    outline-offset: 2px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-demand-card.am-ai-max-crowd-tag {
                    max-width: 188px;
                    height: auto;
                    min-height: 38px;
                    padding: 6px 8px;
                    border-radius: 9px;
                    line-height: normal;
                    overflow: visible;
                    white-space: normal;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-crowd-empty {
                    color: #95a0b9;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-row-footer {
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    flex-wrap: wrap;
                    padding-top: 2px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-row-footer-info {
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-row-status {
                    width: auto;
                    max-width: min(420px, 100%);
                    min-height: 28px;
                    display: flex;
                    align-items: center;
                    border-radius: 8px;
                    padding: 5px 8px;
                    box-sizing: border-box;
                    font-size: 11px;
                    font-weight: 600;
                    line-height: 16px;
                    color: var(--am26-text-soft, #505a74);
                    background: var(--am26-surface, rgba(255, 255, 255, 0.25));
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-row-status.is-success {
                    color: var(--am26-success, #0ea86f);
                    background: rgba(14, 168, 111, 0.1);
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-row-status.is-warn {
                    color: var(--am26-warning, #e8a325);
                    background: var(--am26-warning-soft, rgba(232, 163, 37, 0.14));
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-row-status.is-error {
                    color: var(--am26-danger, #ea4f4f);
                    background: var(--am26-danger-soft, rgba(234, 79, 79, 0.12));
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-row-actions {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 6px;
                    flex-wrap: wrap;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-manage-panel {
                    display: grid;
                    gap: 8px;
                    margin-top: 2px;
                    padding: 10px;
                    border-radius: 10px;
                    border: 1px solid rgba(69, 84, 229, 0.14);
                    background: rgba(255, 255, 255, 0.5);
                    box-sizing: border-box;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-manage-row {
                    display: grid;
                    grid-template-columns: 64px minmax(0, 1fr);
                    gap: 8px;
                    align-items: start;
                    min-width: 0;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-manage-row p {
                    margin: 0;
                    min-width: 0;
                    color: var(--am26-text, #1b2438);
                    font-size: 12px;
                    line-height: 18px;
                    word-break: break-word;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-demand-grid {
                    min-width: 0;
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 6px;
                    align-items: start;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-demand-popover {
                    position: relative;
                    min-width: 0;
                    display: block;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-demand-card {
                    min-width: 0;
                    width: 100%;
                    display: grid;
                    grid-template-columns: 22px minmax(0, 1fr);
                    gap: 7px;
                    align-items: center;
                    min-height: 50px;
                    border: 1px solid rgba(69, 84, 229, 0.16);
                    border-radius: 10px;
                    padding: 8px 9px;
                    background: #f7f9ff;
                    color: var(--am26-text, #1b2438);
                    text-align: left;
                    box-sizing: border-box;
                    cursor: default;
                    appearance: none;
                    font: inherit;
                    transition: background 120ms ease, border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-demand-card:hover,
                #am-campaign-ai-max-batch-popup .am-ai-max-demand-card:focus-visible {
                    background: #eef3ff;
                    border-color: rgba(69, 84, 229, 0.34);
                    box-shadow: 0 8px 22px rgba(39, 48, 83, 0.12);
                    transform: translateY(-1px);
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-demand-card:focus-visible {
                    outline: 2px solid var(--am26-focus, rgba(69, 84, 229, 0.32));
                    outline-offset: 2px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-demand-mark {
                    width: 22px;
                    height: 22px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.82);
                    color: var(--am26-primary, #4554e5);
                    font-size: 11px;
                    font-weight: 800;
                    font-variant-numeric: tabular-nums;
                    box-shadow: inset 0 0 0 1px rgba(69, 84, 229, 0.12);
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-demand-copy {
                    min-width: 0;
                    display: grid;
                    gap: 2px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-demand-card b,
                #am-campaign-ai-max-batch-popup .am-ai-max-persona b {
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-size: 12px;
                    line-height: 16px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-demand-card em {
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-style: normal;
                    color: var(--am26-text-soft, #505a74);
                    font-size: 11px;
                    line-height: 15px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-demand-detail {
                    position: absolute;
                    left: 0;
                    top: calc(100% + 8px);
                    z-index: 2147483647;
                    width: min(520px, calc(100vw - 72px));
                    min-width: 0;
                    display: none;
                    gap: 6px;
                    margin: 0 0 2px;
                    padding: 8px 10px;
                    border-radius: 8px;
                    border: 1px solid rgba(69, 84, 229, 0.14);
                    background: rgba(255, 255, 255, 0.96);
                    box-shadow: 0 14px 34px rgba(39, 48, 83, 0.18);
                    box-sizing: border-box;
                    pointer-events: none;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-demand-popover:hover .am-ai-max-demand-detail,
                #am-campaign-ai-max-batch-popup .am-ai-max-demand-popover:focus-within .am-ai-max-demand-detail {
                    display: grid;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-demand-detail-head {
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-demand-detail-head b,
                #am-campaign-ai-max-batch-popup .am-ai-max-demand-detail-head em {
                    min-width: 0;
                    font-style: normal;
                    line-height: 16px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-demand-detail-head b {
                    color: var(--am26-text, #1b2438);
                    font-size: 12px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-demand-detail-head em {
                    color: var(--am26-primary, #4554e5);
                    font-size: 11px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-demand-detail p {
                    margin: 0;
                    min-width: 0;
                    color: var(--am26-text-soft, #505a74);
                    font-size: 12px;
                    line-height: 17px;
                    word-break: break-word;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-demand-keywords {
                    min-width: 0;
                    display: flex;
                    align-items: flex-start;
                    gap: 5px;
                    flex-wrap: wrap;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-inline-keyword {
                    max-width: 100%;
                    display: inline-flex;
                    align-items: center;
                    min-height: 20px;
                    padding: 2px 7px;
                    border-radius: 999px;
                    background: rgba(69, 84, 229, 0.08);
                    color: var(--am26-text, #1b2438);
                    font-size: 11px;
                    line-height: 16px;
                    white-space: normal;
                    overflow-wrap: anywhere;
                    word-break: break-word;
                    box-sizing: border-box;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-demand-personas {
                    min-width: 0;
                    display: grid;
                    grid-template-columns: 56px minmax(0, 1fr);
                    gap: 6px;
                    align-items: start;
                    padding-top: 2px;
                    color: var(--am26-text-soft, #505a74);
                    font-size: 11px;
                    line-height: 16px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-demand-personas > span {
                    color: var(--am26-text-muted, #778097);
                    white-space: nowrap;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-demand-personas > div {
                    min-width: 0;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-demand-personas em {
                    min-width: 0;
                    max-width: 100%;
                    padding: 2px 6px;
                    border-radius: 6px;
                    background: rgba(27, 36, 56, 0.04);
                    color: var(--am26-text-soft, #505a74);
                    font-style: normal;
                    overflow-wrap: anywhere;
                    word-break: break-word;
                    box-sizing: border-box;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-manage-split {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                    gap: 10px;
                    min-width: 0;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-manage-split > div {
                    min-width: 0;
                    display: grid;
                    gap: 6px;
                    align-content: start;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-persona-list {
                    min-width: 0;
                    display: grid;
                    gap: 5px;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-persona {
                    min-width: 0;
                    display: grid;
                    gap: 2px;
                    border-radius: 8px;
                    padding: 6px 8px;
                    background: rgba(255, 255, 255, 0.58);
                    box-sizing: border-box;
                }
                #am-campaign-ai-max-batch-popup .am-ai-max-persona span {
                    min-width: 0;
                    color: var(--am26-text-soft, #505a74);
                    font-size: 11px;
                    line-height: 15px;
                    word-break: break-word;
                }
                @media (prefers-reduced-motion: reduce) {
                    #am-campaign-batch-plus-menu .am-campaign-batch-plus-item,
                    #am-campaign-batch-confirm-popup .am-batch-confirm-submit,
                    #am-campaign-batch-confirm-popup .am-batch-confirm-cancel,
                    #am-campaign-ai-max-batch-popup .am-ai-max-toolbar-btn,
                    #am-campaign-ai-max-batch-popup .am-ai-max-row-btn {
                        transition: none;
                    }
                }

                /* 算法护航弹窗居中 */
                #alimama-escort-helper-ui {
                    top: 50% !important; left: 50% !important;
                    transform: translate(-50%, -50%) !important;
                    max-height: 90vh; overflow-y: auto;
                    overscroll-behavior: contain;
                }

                /* 日志区 */
                .am-log-section { margin-top: 0; }
                .am-log-header {
                    display: flex; justify-content: space-between; align-items: center;
                    gap: 8px;
                    font-size: 12px; color: var(--am26-text-soft); margin-bottom: 8px; padding: 6px 8px;
                    border: 1px solid var(--am26-border);
                    border-radius: 12px;
                    background: var(--am26-surface);
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.48), 0 2px 8px rgba(31, 53, 109, 0.04);
                }
                .am-log-title {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    min-width: 0;
                    font-weight: 700;
                    color: var(--am26-text);
                }
                .am-log-title svg {
                    width: 14px;
                    height: 14px;
                    flex: 0 0 14px;
                }
                .am-action-btn {
                    cursor: pointer; color: var(--am26-text-soft); margin-left: 6px;
                    min-height: 24px;
                    padding: 3px 9px; border-radius: 999px; transition: all 0.2s;
                    background: rgba(255,255,255,0.46);
                    border: 1px solid rgba(255, 255, 255, 0.38);
                    font: inherit;
                    font-weight: 600;
                    appearance: none;
                    -webkit-appearance: none;
                }
                .am-action-btn:hover {
                    background: rgba(255, 255, 255, 0.82);
                    color: var(--am26-primary-strong);
                    border-color: var(--am26-border-strong);
                }
                .am-action-btn:focus-visible {
                    background: rgba(255, 255, 255, 0.82);
                    color: var(--am26-primary-strong);
                    border-color: var(--am26-border-strong);
                    outline: 2px solid rgba(69, 84, 229, 0.32);
                    outline-offset: 2px;
                }
                #am-log-content {
                    height: 100px; overflow-y: auto;
                    overscroll-behavior: contain;
                    background: var(--am26-surface);
                    border: 1px solid var(--am26-border);
                    border-radius: 10px;
                    padding: 10px;
                    font-size: 11px;
                    color: var(--am26-text);
                    font-family: var(--am26-mono);
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.48), 0 2px 8px rgba(31, 53, 109, 0.04);
                    transition: all 0.3s ease;
                }
                #am-log-content.collapsed { height: 0; padding: 0; border: none; opacity: 0; }
                .am-log-line {
                    padding: 3px 0; line-height: 1.5;
                    border-bottom: 1px dashed rgba(80, 90, 116, 0.16);
                }
                .am-log-line:last-child { border-bottom: none; }
                .am-log-time { color: var(--am26-text-soft); opacity: 0.72; margin-right: 6px; }

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
                    width: min(340px, calc(100vw - 24px));
                    padding: 14px;
                    border-radius: 12px;
                    border: 1px solid var(--am26-border);
                    background: var(--am26-panel-strong);
                    backdrop-filter: blur(18px) saturate(1.35);
                    -webkit-backdrop-filter: blur(18px) saturate(1.35);
                    box-shadow: var(--am26-shadow), var(--am26-glow);
                    color: var(--am26-text);
                    z-index: 2147483647;
                    display: none;
                }
                #am-report-capture-panel:focus-visible {
                    outline: 2px solid var(--am26-focus);
                    outline-offset: 3px;
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
                    max-width: 118px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    padding: 3px 7px;
                    border-radius: 999px;
                    background: var(--am26-surface);
                    border: 1px solid var(--am26-border);
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
                    background: var(--am26-surface-strong);
                    border: 1px solid var(--am26-border);
                    border-radius: 8px;
                    margin-bottom: 12px;
                    padding: 8px;
                    word-break: break-all;
                    font-size: 11px;
                    color: var(--am26-text-soft);
                    max-height: 56px;
                    overflow: hidden;
                    font-family: var(--am26-mono);
                    line-height: 1.45;
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
                    background: var(--am26-surface-strong);
                    border-color: var(--am26-border);
                    color: var(--am26-text-soft);
                    font: inherit;
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
                    background: var(--am26-danger-soft);
                    color: var(--am26-danger, #ea4f4f);
                    border-color: rgba(234, 79, 79, 0.22);
                }
                #am-report-capture-panel .am-download-btn:hover,
                #am-report-capture-panel .am-download-link:hover {
                    transform: translateY(-1px);
                }
                #am-report-capture-panel .am-download-btn:focus-visible,
                #am-report-capture-panel .am-download-link:focus-visible {
                    outline: 2px solid var(--am26-focus);
                    outline-offset: 2px;
                    transform: translateY(-1px);
                }
                #am-report-capture-panel .am-download-close:focus-visible {
                    color: var(--am26-danger, #ea4f4f);
                    border-color: rgba(234, 79, 79, 0.22);
                }
                @media (prefers-reduced-motion: reduce) {
                    #am-report-capture-panel .am-download-btn,
                    #am-report-capture-panel .am-download-link {
                        transition: none;
                    }
                    #am-report-capture-panel .am-download-btn:hover,
                    #am-report-capture-panel .am-download-link:hover,
                    #am-report-capture-panel .am-download-btn:focus-visible,
                    #am-report-capture-panel .am-download-link:focus-visible {
                        transform: none;
                    }
                }
                #am-report-capture-panel .am-download-copy { flex: 1; }
                #am-report-capture-panel .am-download-copy-status {
                    margin-top: 9px;
                    padding: 6px 8px;
                    border-radius: 8px;
                    border: 1px solid rgba(14, 168, 111, 0.18);
                    background: rgba(14, 168, 111, 0.08);
                    color: var(--am26-success);
                    font-size: 10px;
                    font-weight: 600;
                    line-height: 1.4;
                }
                #am-report-capture-panel .am-download-hint {
                    margin-top: 8px;
                    font-size: 10px;
                    color: var(--am26-text-soft);
                    line-height: 1.45;
                }

                #am-magic-report-popup {
                    background: var(--am26-panel-strong) !important;
                }
                #am-magic-report-popup .am-magic-header {
                    background: var(--am26-surface-strong) !important;
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
                <button id="am-helper-icon" type="button" title="点击展开助手面板" aria-label="展开助手面板">
                    ${renderAmIcon('logo', { size: 22, strokeWidth: 2.2 })}
                </button>
                <div id="am-helper-panel">
            <div class="am-resizer-left"></div>
            <div class="am-header">
                <span class="am-title">
                    ${renderAmIcon('logo', { size: 16, className: 'am-brand-icon', strokeWidth: 2.2 })}
                    阿里助手 Pro
                    <span class="am-version">v${CURRENT_VERSION}</span>
                </span>
                <button type="button" class="am-close-btn" title="最小化" aria-label="最小化助手面板">
                    ${renderAmWindowIcon('close')}
                </button>
            </div>
            <div class="am-body">
                <!-- Section 1: Tools -->
                <div class="am-tools-row">
                    <button type="button" class="am-tool-btn" id="am-trigger-optimizer">
                        ${renderAmIcon('shield-check', { size: 16 })}
                        <span class="am-tool-label">算法护航</span>
                    </button>
                    <button type="button" class="am-tool-btn" id="am-trigger-keyword-plan-api">
                        ${renderAmIcon('plan', { size: 16 })}
                        <span class="am-tool-label">组建计划</span>
                    </button>
                    <button type="button" class="am-tool-btn" id="am-trigger-magic-report">
                        ${renderAmIcon('chart', { size: 16 })}
                        <span class="am-tool-label">万能查数</span>
                    </button>
                    <button type="button" class="am-tool-btn" id="am-toggle-assist-display" aria-expanded="false" aria-controls="am-assist-switches" aria-pressed="false">
                        ${renderAmIcon('eye', { size: 16 })}
                        <span class="am-tool-label">辅助显示</span>
                    </button>
                </div>

                <!-- Section 2: Settings -->
                <div id="am-assist-switches">
                    <div class="am-switches-grid">
                        <button type="button" class="am-switch-btn" data-key="showCost" aria-pressed="false">询单成本</button>
                        <button type="button" class="am-switch-btn" data-key="showCartCost" aria-pressed="false">加购成本</button>
                        <button type="button" class="am-switch-btn" data-key="showPercent" aria-pressed="false">潜客占比</button>
                        <button type="button" class="am-switch-btn" data-key="showCostRatio" aria-pressed="false">花费占比</button>
                        <button type="button" class="am-switch-btn" data-key="showBudget" aria-pressed="false">预算进度</button>
                        <button type="button" class="am-switch-btn" data-key="unlockBudgetFrontendLimit" aria-pressed="false">预算破限</button>
                        <button type="button" class="am-switch-btn" data-key="autoSortCharge" aria-pressed="false">花费排序</button>
                        <button type="button" class="am-switch-btn" data-key="showConcurrentStartButton" aria-pressed="false">计划并发</button>
                        <!-- <button type="button" class="am-switch-btn" data-key="autoClose" aria-pressed="false">弹窗速闭</button> -->
                    </div>
                </div>
                <div class="am-log-section">
                    <div class="am-log-header">
                        <span class="am-log-title">${renderAmIcon('list', { size: 14 })}<span>运行日志</span></span>
                        <div>
                            <button type="button" class="am-action-btn" id="am-log-clear">清空</button>
                            <button type="button" class="am-action-btn" id="am-log-toggle" aria-controls="am-log-content" aria-expanded="false">展开</button>
                        </div>
                    </div>
                    <div id="am-log-content" role="log" aria-live="polite" aria-label="运行日志"></div>
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

            // 展开/收起动画
            const openPanel = (force = false) => {
                this.clearPanelAutoHideState();
                this.clearPanelIconRevealTimer();
                if (!force && Date.now() < hoverOpenBlockedUntil) return;
                if (State.config.panelOpen) {
                    this.bindPanelOutsideClickHandler(panel, icon, closePanel);
                    return;
                }
                State.config.panelOpen = true;
                State.save();
                this.updateState();
                this.bindPanelOutsideClickHandler(panel, icon, closePanel);
            };
            const closePanel = (blockHoverOpen = false) => {
                this.clearPanelAutoHideState();
                this.unbindPanelOutsideClickHandler();
                if (blockHoverOpen) hoverOpenBlockedUntil = Date.now() + 800;
                if (!State.config.panelOpen) return;
                State.config.panelOpen = false;
                State.save();
                this.updateState();
            };
            const scheduleAutoHide = (delay = 180) => {
                this.schedulePanelAutoHide({ panel, icon, closePanel }, delay);
            };
            if (State.config.panelOpen) {
                this.bindPanelOutsideClickHandler(panel, icon, closePanel);
            }

            icon.onclick = () => openPanel(true);
            // 鼠标移入悬浮球时自动展开
            icon.onmouseenter = () => openPanel(false);
            panel.onmouseenter = () => this.clearPanelAutoHideState();
            panel.onmouseleave = () => scheduleAutoHide();
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                closePanel(true);
            };

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
                    this.clearOptimizerOpenRetryTimer();
                    // [ADD] 点击护航时自动最小化主面板
                    closePanel(false);

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
                        this.scheduleOptimizerOpenRetry(() => {
                            if (!toggleOptimizerPanel()) {
                                alert('算法护航模块无法加载，请刷新页面重试');
                            }
                        });
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
                    this.clearKeywordPlanOpenRetryTimer();
                    const api = resolveKeywordPlanApi();
                    if (openKeywordPlanWizard(api)) return;
                    if (openExistingKeywordOverlay()) return;

                    Logger.log('⚠️ 关键词建计划模块初始化中...', true);
                    this.scheduleKeywordPlanOpenRetry(() => {
                        const retryApi = resolveKeywordPlanApi();
                        if (openKeywordPlanWizard(retryApi)) {
                            return;
                        }
                        if (openExistingKeywordOverlay()) {
                            Logger.log('ℹ️ 已打开关键词计划弹窗（兜底）');
                        } else {
                            alert('组建计划模块不可用，请刷新页面重试');
                        }
                    });
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
            const handlePanelResizeMove = (e) => {
                if (!isResizing) return;
                const newWidth = Math.min(500, Math.max(250, startWidth + startX - e.clientX));
                panel.style.width = newWidth + 'px';
            };
            const handlePanelResizeEnd = () => {
                isResizing = false;
                document.body.style.userSelect = '';
                document.removeEventListener('mousemove', handlePanelResizeMove);
                document.removeEventListener('mouseup', handlePanelResizeEnd);
            };
            resizer.onmousedown = (e) => {
                isResizing = true;
                startX = e.clientX;
                startWidth = panel.offsetWidth;
                document.body.style.userSelect = 'none';
                document.addEventListener('mousemove', handlePanelResizeMove);
                document.addEventListener('mouseup', handlePanelResizeEnd);
                e.preventDefault();
            };

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
                this.clearPanelIconRevealTimer();
                panel.classList.remove('hidden');
                icon.style.display = 'none';
            } else {
                this.unbindPanelOutsideClickHandler();
                panel.classList.add('hidden');
                this.schedulePanelIconReveal(icon);
            }

            // 功能开关状态
            document.querySelectorAll('.am-switch-btn').forEach(btn => {
                const key = btn.dataset.key;
                const active = !!State.config[key];
                btn.classList.toggle('active', active);
                btn.setAttribute('aria-pressed', active ? 'true' : 'false');
            });

            if (assistPanel) {
                assistPanel.classList.toggle('open', this.runtime.assistExpanded);
                assistPanel.setAttribute('aria-hidden', this.runtime.assistExpanded ? 'false' : 'true');
            }
            if (assistToggleBtn) {
                assistToggleBtn.classList.toggle('active', this.runtime.assistExpanded);
                assistToggleBtn.setAttribute('aria-expanded', this.runtime.assistExpanded ? 'true' : 'false');
                assistToggleBtn.setAttribute('aria-pressed', this.runtime.assistExpanded ? 'true' : 'false');
            }
            CampaignIdQuickEntry.syncConcurrentButtonsVisibility();

            // 日志展开/折叠
            if (logExpanded) {
                logContent.classList.remove('collapsed');
                logToggle.textContent = '隐藏';
                logToggle.setAttribute('aria-expanded', 'true');
                logContent.setAttribute('aria-hidden', 'false');
            } else {
                logContent.classList.add('collapsed');
                logToggle.textContent = '展开';
                logToggle.setAttribute('aria-expanded', 'false');
                logContent.setAttribute('aria-hidden', 'true');
            }
        }
    };
