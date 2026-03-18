    // ==========================================
    // 5. 前端预算限制绕过（仅前端校验）
    // ==========================================
    const BudgetFrontendLimitBypass = {
        initialized: false,
        observer: null,
        scanTimer: null,

        init() {
            if (this.initialized) return;
            this.initialized = true;
            this.installPagePatcher();
            const scheduleRefresh = () => {
                if (this.scanTimer) return;
                this.scanTimer = setTimeout(() => {
                    this.scanTimer = null;
                    this.refresh();
                }, 180);
            };
            this.observer = new MutationObserver(() => scheduleRefresh());
            if (document.body) {
                this.observer.observe(document.body, { childList: true, subtree: true });
            }
            window.addEventListener('hashchange', scheduleRefresh, true);
            this.refresh();
        },

        refresh() {
            const enabled = !!State.config.unlockBudgetFrontendLimit;
            this.syncToggle(enabled);
        },

        syncToggle(enabled) {
            const flag = enabled ? 'true' : 'false';
            this.runInPage(`;(() => {
                window.__AM_BUDGET_FRONTEND_UNLOCK__ = ${flag};
                if (typeof window.__AM_BUDGET_FRONTEND_UNLOCK_REFRESH__ === 'function') {
                    window.__AM_BUDGET_FRONTEND_UNLOCK_REFRESH__();
                }
            })();`);
        },

        installPagePatcher() {
            this.runInPage(`;(() => {
                if (window.__AM_BUDGET_FRONTEND_UNLOCK_PATCHER_INSTALLED__) return;
                window.__AM_BUDGET_FRONTEND_UNLOCK_PATCHER_INSTALLED__ = true;
                window.__AM_BUDGET_FRONTEND_UNLOCK__ = !!window.__AM_BUDGET_FRONTEND_UNLOCK__;

                const BUDGET_SELECTOR = [
                    '[mx-view*="dayBudget"]',
                    '[mx-view*="dayAverageBudget"]',
                    '[mx-view*="totalBudget"]',
                    '[mx-view*="futureBudget"]',
                    '[mx-view*="constraintValue"]',
                    '[mxc*="dayBudget"]',
                    '[mxc*="dayAverageBudget"]',
                    '[mxc*="totalBudget"]',
                    '[mxc*="futureBudget"]',
                    '[mxc*="suggestInput"]'
                ].join(',');

                const patchedViews = new Set();
                const snapshots = new WeakMap();
                let magixCache = null;
                let magixPending = null;
                let scanTimer = null;

                const canPatch = (view) => {
                    if (!view || typeof view !== 'object') return false;
                    const rules = view && view.updater ? view.updater.rules : null;
                    const originRules = view && view.updater ? view.updater.originRules : null;
                    const hasRulesMin = !!(rules && typeof rules === 'object' && Object.prototype.hasOwnProperty.call(rules, 'min'));
                    const hasOriginRulesMin = !!(originRules && typeof originRules === 'object' && Object.prototype.hasOwnProperty.call(originRules, 'min'));
                    return typeof view.check === 'function'
                        || typeof view.isValid === 'function'
                        || typeof view.isValid === 'boolean'
                        || hasRulesMin
                        || hasOriginRulesMin;
                };

                const patchView = (view) => {
                    if (!canPatch(view)) return;
                    if (snapshots.has(view)) return;
                    const hasCheck = typeof view.check === 'function';
                    const hasIsValidFn = typeof view.isValid === 'function';
                    const hasIsValidBool = typeof view.isValid === 'boolean';
                    const rules = view && view.updater ? view.updater.rules : null;
                    const originRules = view && view.updater ? view.updater.originRules : null;
                    const hasRulesMin = !!(rules && typeof rules === 'object' && Object.prototype.hasOwnProperty.call(rules, 'min'));
                    const hasOriginRulesMin = !!(originRules && typeof originRules === 'object' && Object.prototype.hasOwnProperty.call(originRules, 'min'));

                    snapshots.set(view, {
                        hasCheck,
                        check: view.check,
                        hasIsValidFn,
                        isValidFn: hasIsValidFn ? view.isValid : null,
                        hasIsValidBool,
                        isValidBool: hasIsValidBool ? view.isValid : null,
                        hasRulesMin,
                        rulesMin: hasRulesMin ? rules.min : undefined,
                        hasOriginRulesMin,
                        originRulesMin: hasOriginRulesMin ? originRules.min : undefined
                    });
                    patchedViews.add(view);

                    if (hasCheck) {
                        view.check = () => Promise.resolve({ ok: true, msg: '' });
                    }
                    if (hasIsValidFn) {
                        view.isValid = () => true;
                    } else if (hasIsValidBool) {
                        view.isValid = true;
                    }
                    if (hasRulesMin) rules.min = 0;
                    if (hasOriginRulesMin) originRules.min = 0;
                };

                const restoreAll = () => {
                    if (!patchedViews.size) return;
                    patchedViews.forEach((view) => {
                        const snapshot = snapshots.get(view);
                        if (!snapshot || !view || typeof view !== 'object') return;
                        if (snapshot.hasCheck) view.check = snapshot.check;
                        if (snapshot.hasIsValidFn) view.isValid = snapshot.isValidFn;
                        else if (snapshot.hasIsValidBool) view.isValid = snapshot.isValidBool;
                        const rules = view && view.updater ? view.updater.rules : null;
                        const originRules = view && view.updater ? view.updater.originRules : null;
                        if (snapshot.hasRulesMin && rules && typeof rules === 'object') rules.min = snapshot.rulesMin;
                        if (snapshot.hasOriginRulesMin && originRules && typeof originRules === 'object') originRules.min = snapshot.originRulesMin;
                        snapshots.delete(view);
                    });
                    patchedViews.clear();
                };

                const collectCandidateIds = (node) => {
                    const ids = new Set();
                    let cursor = node;
                    let depth = 0;
                    while (cursor && depth < 10) {
                        if (cursor.id) ids.add(cursor.id);
                        cursor = cursor.parentElement;
                        depth += 1;
                    }
                    return Array.from(ids);
                };

                const getMagix = async () => {
                    if (window.Magix && window.Magix.Vframe && window.Magix.Vframe.all) return window.Magix;
                    if (magixCache && magixCache.Vframe && magixCache.Vframe.all) return magixCache;
                    if (!window.seajs || typeof window.seajs.use !== 'function') return null;
                    if (magixPending) return magixPending;
                    magixPending = new Promise((resolve) => {
                        try {
                            window.seajs.use(['magix'], (ref) => resolve(ref || null));
                        } catch {
                            resolve(null);
                        }
                    }).then((ref) => {
                        magixPending = null;
                        if (ref && ref.Vframe && ref.Vframe.all) magixCache = ref;
                        return ref;
                    }).catch(() => {
                        magixPending = null;
                        return null;
                    });
                    return magixPending;
                };

                const apply = async () => {
                    if (!window.__AM_BUDGET_FRONTEND_UNLOCK__) {
                        restoreAll();
                        return;
                    }
                    const magixRef = await getMagix();
                    if (!window.__AM_BUDGET_FRONTEND_UNLOCK__) {
                        restoreAll();
                        return;
                    }
                    if (!magixRef || !magixRef.Vframe || typeof magixRef.Vframe.all !== 'function') return;
                    let allVframes = {};
                    try {
                        allVframes = magixRef.Vframe.all() || {};
                    } catch {
                        return;
                    }

                    const ids = new Set();
                    document.querySelectorAll(BUDGET_SELECTOR).forEach((node) => {
                        collectCandidateIds(node).forEach((id) => ids.add(id));
                    });
                    ids.forEach((id) => {
                        const vf = allVframes[id];
                        const view = vf && (vf.$v || vf.view);
                        patchView(view);
                    });
                };

                const scheduleApply = () => {
                    if (scanTimer) return;
                    scanTimer = setTimeout(() => {
                        scanTimer = null;
                        apply();
                    }, 120);
                };

                const startObserver = () => {
                    if (!document.body) {
                        setTimeout(startObserver, 150);
                        return;
                    }
                    const mo = new MutationObserver(() => scheduleApply());
                    mo.observe(document.body, { childList: true, subtree: true });
                };

                window.__AM_BUDGET_FRONTEND_UNLOCK_REFRESH__ = scheduleApply;
                window.addEventListener('hashchange', scheduleApply, true);
                startObserver();
                setInterval(() => {
                    if (window.__AM_BUDGET_FRONTEND_UNLOCK__) scheduleApply();
                }, 600);
                scheduleApply();
            })();`);
        },

        runInPage(code) {
            try {
                const script = document.createElement('script');
                script.type = 'text/javascript';
                script.textContent = String(code || '');
                (document.head || document.documentElement).appendChild(script);
                script.remove();
            } catch { }
        }
    };

