    // ==========================================
    // 7. 启动程序
    // ==========================================
    const installAssistDisplayDiagnostics = () => {
        try {
            Object.defineProperty(window, '__AM_ASSIST_DISPLAY_DIAGNOSTICS__', {
                value: () => Core.getAssistDisplayDiagnostics(),
                configurable: true
            });
        } catch { }
    };

    const isSmartAssistantBudgetOnlyPage = () => {
        return isAmSmartAssistantBudgetPage();
    };

    const isDmpItemInsightCrowdPage = () => {
        try {
            const url = new URL(window.location.href);
            if (String(url.hostname || '').toLowerCase() !== 'dmp.taobao.com') return false;
            const hash = String(url.hash || '');
            if (!/\/items\/item-insight/i.test(hash)) return false;
            const queryText = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
            const params = new URLSearchParams(queryText);
            const analysisTab = String(params.get('analysisTab') || '').trim();
            return analysisTab === 'crowd-insight';
        } catch {
            return false;
        }
    };

    const AM_PLUGIN_MUTATION_SELECTOR = [
        '#am-helper-icon',
        '#am-helper-panel',
        '#am-magic-report-popup',
        '#am-report-capture-panel',
        '#am-campaign-concurrent-log-popup',
        '#am-campaign-copy-overview-popup',
        '#am-campaign-copy-success-popup',
        '#am-campaign-batch-plus-menu',
        '#am-campaign-batch-confirm-popup',
        '#am-wxt-keyword-overlay',
        '#am-wxt-scene-popup-mask',
        '#am-wxt-keyword-item-picker-mask',
        '#alimama-escort-helper-ui',
        '#alimama-escort-helper-ui-result-overlay',
        '.am-helper-tag',
        '.am-campaign-id-token',
        '.am-campaign-search-btn',
        '.am-campaign-batch-plus-wrap',
        '.am-campaign-batch-plus-native'
    ].join(',');

    const getElementFromMutationNode = (node) => {
        if (node instanceof Element) return node;
        return node?.parentElement instanceof Element ? node.parentElement : null;
    };

    const isInsidePluginMutationSurface = (node) => {
        const el = getElementFromMutationNode(node);
        return !!(el && el.closest(AM_PLUGIN_MUTATION_SELECTOR));
    };

    const isIgnorableMutationNode = (node) => {
        if (node instanceof Element) return isInsidePluginMutationSurface(node);
        return isInsidePluginMutationSurface(node?.parentElement);
    };

    const AM_EXPECTED_PLUGIN_CLASS_MUTATIONS = new WeakMap();

    function registerExpectedMainAssistantClassMutation(target, className = '') {
        const el = getElementFromMutationNode(target);
        const normalizedClass = String(className || '').trim();
        if (!el || isInsidePluginMutationSurface(el) || !/^am-/.test(normalizedClass)) return;
        let classCounts = AM_EXPECTED_PLUGIN_CLASS_MUTATIONS.get(el);
        if (!classCounts) {
            classCounts = new Map();
            AM_EXPECTED_PLUGIN_CLASS_MUTATIONS.set(el, classCounts);
        }
        classCounts.set(normalizedClass, (classCounts.get(normalizedClass) || 0) + 1);
    }

    const consumeExpectedMainAssistantClassMutation = (record) => {
        if (record?.attributeName !== 'class') return false;
        const target = getElementFromMutationNode(record?.target);
        if (!target || isInsidePluginMutationSurface(target)) return false;
        const classCounts = AM_EXPECTED_PLUGIN_CLASS_MUTATIONS.get(target);
        if (!classCounts || classCounts.size === 0) return false;
        for (const [className, count] of classCounts.entries()) {
            if (!target.classList?.contains?.(className)) continue;
            if (count > 1) {
                classCounts.set(className, count - 1);
            } else {
                classCounts.delete(className);
            }
            if (classCounts.size === 0) AM_EXPECTED_PLUGIN_CLASS_MUTATIONS.delete(target);
            return true;
        }
        return false;
    };

    const isIgnorableChildListMutation = (record) => {
        if (isInsidePluginMutationSurface(record?.target)) return true;
        const changedNodes = [
            ...Array.from(record?.addedNodes || []),
            ...Array.from(record?.removedNodes || [])
        ];
        return changedNodes.length > 0 && changedNodes.every((node) => isIgnorableMutationNode(node));
    };

    const isIgnorableMainAssistantMutation = (record) => {
        if (!record || !record.type) return false;
        if (record.type === 'childList') return isIgnorableChildListMutation(record);
        if (record.type === 'characterData') return isInsidePluginMutationSurface(record.target);
        if (record.type !== 'attributes') return false;
        if (consumeExpectedMainAssistantClassMutation(record)) return true;
        return isInsidePluginMutationSurface(record.target);
    };

    const shouldIgnoreMainAssistantMutations = (records = []) => {
        return Array.isArray(records)
            && records.length > 0
            && records.every(isIgnorableMainAssistantMutation);
    };

    function main() {
        installAssistDisplayDiagnostics();
        if (isDmpItemInsightCrowdPage()) {
            MagicReport.initDmpCrowdMatrixEntry();
            Logger.log(`🚀 阿里助手 Pro v${CURRENT_VERSION} 已启动：DMP 单品人群看板入口`);
            return;
        }
        UI.init();
        BudgetFrontendLimitBypass.init();
        if (isSmartAssistantBudgetOnlyPage()) {
            Logger.log('🔧 SmartAssistant 预算页：仅启动预算破限补丁');
            notifyRiskChallengeIfNeeded(window.location.href);
            return;
        }
        Interceptor.init();
        CampaignIdQuickEntry.init();
        PotentialPlanDailyExporter.init();
        // NOTE: MagicReport 采用 iframe 方案，无需 init，按需创建

        Logger.log(`🚀 阿里助手 Pro v${CURRENT_VERSION} 已启动`);
        notifyRiskChallengeIfNeeded(window.location.href);

        let lastUrl = window.location.href;
        let lastUrlResetAt = 0;
        const checkUrlChange = () => {
            if (window.location.href !== lastUrl) {
                lastUrl = window.location.href;
                const now = Date.now();
                if (now - lastUrlResetAt < 300) return;
                lastUrlResetAt = now;
                resetSortState('页面切换');
                notifyRiskChallengeIfNeeded(lastUrl);
            }
        };
        const hookHistoryMethod = (methodName = '') => {
            try {
                const historyRef = window.history;
                const original = historyRef?.[methodName];
                if (typeof original !== 'function') return;
                if (original.__amRiskHooked === true) return;
                const wrapped = function (...args) {
                    const ret = original.apply(this, args);
                    checkUrlChange();
                    return ret;
                };
                Object.defineProperty(wrapped, '__amRiskHooked', {
                    value: true,
                    configurable: false,
                    enumerable: false,
                    writable: false
                });
                historyRef[methodName] = wrapped;
            } catch { }
        };
        hookHistoryMethod('pushState');
        hookHistoryMethod('replaceState');
        window.addEventListener('hashchange', checkUrlChange);
        window.addEventListener('popstate', checkUrlChange);

        const CORE_RUN_DEBOUNCE_MS = 1000;
        const CORE_PAUSE_RECHECK_MS = 350;
        let timer;
        let pendingHiddenCoreRun = false;
        const isDocumentHidden = () => document.visibilityState === 'hidden';
        const clearScheduledCoreRun = () => {
            if (!timer) return;
            clearTimeout(timer);
            timer = null;
        };
        const markHiddenCoreRunPending = () => {
            pendingHiddenCoreRun = true;
            clearScheduledCoreRun();
        };
        const runCore = () => {
            if (shouldPauseInjectionForPopup()) return false;
            Core.run();
            CampaignIdQuickEntry.run();
            PotentialPlanDailyExporter.run();
            return true;
        };
        const scheduleRunCore = (delay = CORE_RUN_DEBOUNCE_MS) => {
            if (isDocumentHidden()) {
                markHiddenCoreRunPending();
                return;
            }
            if (timer) return;
            timer = setTimeout(() => {
                timer = null;
                if (isDocumentHidden()) {
                    markHiddenCoreRunPending();
                    return;
                }
                if (!runCore()) {
                    scheduleRunCore(CORE_PAUSE_RECHECK_MS);
                }
            }, Math.max(0, Number(delay) || 0));
        };
        const handleVisibilityChange = () => {
            if (isDocumentHidden()) {
                markHiddenCoreRunPending();
                return;
            }
            if (!pendingHiddenCoreRun) return;
            pendingHiddenCoreRun = false;
            scheduleRunCore(0);
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        const observer = new MutationObserver((records) => {
            if (shouldIgnoreMainAssistantMutations(records)) return;
            if (isDocumentHidden()) {
                markHiddenCoreRunPending();
                return;
            }
            scheduleRunCore(CORE_RUN_DEBOUNCE_MS);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'aria-hidden', 'aria-disabled', 'aria-checked', 'disabled', 'mx-view'],
            characterData: true
        });

        scheduleRunCore(CORE_RUN_DEBOUNCE_MS);
    }

    let hasBootstrapped = false;
    const BOOTSTRAP_RETRY_INITIAL_DELAY_MS = 16;
    const BOOTSTRAP_RETRY_MAX_DELAY_MS = 250;
    const BOOTSTRAP_RETRY_TIMEOUT_MS = 10000;
    let bootstrapRetryTimerId = 0;
    let bootstrapRetryDeadlineAt = 0;
    let bootstrapRetryDelayMs = BOOTSTRAP_RETRY_INITIAL_DELAY_MS;
    const clearBootstrapRetryTimer = () => {
        if (bootstrapRetryTimerId) {
            clearTimeout(bootstrapRetryTimerId);
            bootstrapRetryTimerId = 0;
        }
        bootstrapRetryDeadlineAt = 0;
        bootstrapRetryDelayMs = BOOTSTRAP_RETRY_INITIAL_DELAY_MS;
    };
    const reportBootstrapError = (err) => {
        try {
            Logger.log(`⚠️ 主助手启动失败：${err?.message || '未知错误'}`, true);
        } catch { }
        try {
            console.error('[AM Helper] main bootstrap failed', err);
        } catch { }
    };
    const bootstrapMain = () => {
        if (hasBootstrapped) return true;
        if (!document.body) return false;
        hasBootstrapped = true;
        clearBootstrapRetryTimer();
        try {
            main();
        } catch (err) {
            reportBootstrapError(err);
        }
        return true;
    };
    const scheduleBootstrapRetry = () => {
        if (hasBootstrapped || bootstrapRetryTimerId) return;
        const now = Date.now();
        if (!bootstrapRetryDeadlineAt) {
            bootstrapRetryDeadlineAt = now + BOOTSTRAP_RETRY_TIMEOUT_MS;
            bootstrapRetryDelayMs = BOOTSTRAP_RETRY_INITIAL_DELAY_MS;
        }
        if (now >= bootstrapRetryDeadlineAt) {
            clearBootstrapRetryTimer();
            return;
        }
        const retryDelay = Math.min(
            bootstrapRetryDelayMs,
            Math.max(0, bootstrapRetryDeadlineAt - now)
        );
        bootstrapRetryTimerId = setTimeout(() => {
            bootstrapRetryTimerId = 0;
            bootstrapMain();
            if (hasBootstrapped) return;
            bootstrapRetryDelayMs = Math.min(
                BOOTSTRAP_RETRY_MAX_DELAY_MS,
                Math.max(BOOTSTRAP_RETRY_INITIAL_DELAY_MS, bootstrapRetryDelayMs * 2)
            );
            scheduleBootstrapRetry();
        }, retryDelay);
    };

    bootstrapMain();

    if (!hasBootstrapped) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                if (!bootstrapMain()) scheduleBootstrapRetry();
            }, { once: true });
        } else {
            scheduleBootstrapRetry();
        }
    }

})();
// ==========================================
// 7. 算法护航模块 (Merged from alimama-auto-optimizer.user.js)
// ==========================================

/**
 * v2.4.1 (2026-02-06)
 * - 🐛 修复 actionInfo 兼容性崩溃
 * - ✨ 支持请求取消与重复运行保护
 * - ✨ SSE 流式解析更稳健
 * - ✨ UI 输出统一转义，防 XSS
 * - ✨ 去除内联事件，提升 CSP 兼容
 * - 🔧 本地日期提交，避免 UTC 跨日偏移
 * - 🔧 放宽 campaignId 识别范围
 *
 * v2.4 (2026-02-06)
 * - ✨ 并发执行：支持同时处理多个计划，并发数可配置
 * - ✨ 日志分组：每个计划独立卡片显示，支持折叠
 * - ✨ 状态徽章：实时显示处理状态（诊断中/成功/失败）
 *
 * v2.3 (2026-02-05)
 * - ✨ UI 改进：默认最小化，点击展开；结果弹窗全屏模态
 * - 🔧 请求模块重写：使用原生 fetch API，解决跨域拦截问题
 *
 * v1.8 (2026-02-03)
 * - 🔧 增强 API 日志：请求ID/状态码/响应长度/耗时
 * - 🐛 优化超时处理、DOM 扫描、错误重试
 *
 * v1.6 (2026-01-31)
 * - ✨ API 请求超时处理（默认 30 秒）
 * - ✨ 请求失败自动重试（最多 3 次）
 */
