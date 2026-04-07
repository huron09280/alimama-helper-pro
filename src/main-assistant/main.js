    // ==========================================
    // 7. 启动程序
    // ==========================================
    function main() {
        UI.init();
        BudgetFrontendLimitBypass.init();
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
        const runCore = () => {
            if (shouldPauseInjectionForPopup()) return false;
            Core.run();
            CampaignIdQuickEntry.run();
            PotentialPlanDailyExporter.run();
            return true;
        };
        const scheduleRunCore = (delay = CORE_RUN_DEBOUNCE_MS) => {
            if (timer) return;
            timer = setTimeout(() => {
                timer = null;
                if (!runCore()) {
                    scheduleRunCore(CORE_PAUSE_RECHECK_MS);
                }
            }, Math.max(0, Number(delay) || 0));
        };
        const observer = new MutationObserver(() => {
            scheduleRunCore(CORE_RUN_DEBOUNCE_MS);
        });

        observer.observe(document.body, { childList: true, subtree: true });

        scheduleRunCore(CORE_RUN_DEBOUNCE_MS);
    }

    main();

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

