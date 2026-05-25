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
                const SMART_ASSISTANT_BUDGET_WARNING_RE = /(预算|dailyBudgetAmount|日预算|daily\\s*budget|不能|不能?低于|不少于|低于|至少).{0,20}(100|一百)/i;
                const SMART_ASSISTANT_BUDGET_FIELD_NAME = 'dailyBudgetAmount';
                const SMART_ASSISTANT_BUDGET_MIN_VALUE = 100;

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
                const smartAssistantPatchedTargets = new WeakMap();
                let magixCache = null;
                let magixPending = null;
                let scanTimer = null;
                let smartAssistantScanTimer = null;

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

                const parseBudgetValue = (rawValue) => {
                    if (typeof rawValue === 'number') return Number.isFinite(rawValue) ? rawValue : NaN;
                    const normalized = String(rawValue || '').replace(/,/g, '').replace(/[^\d.-]+/g, '').trim();
                    if (!normalized) return NaN;
                    const parsed = Number.parseFloat(normalized);
                    return Number.isFinite(parsed) ? parsed : NaN;
                };

                const shouldBypassSmartAssistantBudgetValidationValue = (value) => {
                    const budgetValue = parseBudgetValue(value);
                    return Number.isFinite(budgetValue) && budgetValue < SMART_ASSISTANT_BUDGET_MIN_VALUE;
                };

                const createSmartAssistantBudgetValidationValues = (value, nextReason = null) => ({
                    budgetField: SMART_ASSISTANT_BUDGET_FIELD_NAME,
                    budgetValue: parseBudgetValue(value),
                    reason: nextReason
                });

                const collectBudgetValidationContext = (args = []) => {
                    const context = {
                        field: '',
                        value: '',
                        reason: null
                    };
                    const visit = (candidate) => {
                        if (candidate == null) return;
                        if (typeof candidate === 'string' || typeof candidate === 'number') {
                            const value = String(candidate || '').trim();
                            if (!context.field && /^dailybudgetamount$/i.test(value.replace(/\\s+/g, ''))) {
                                context.field = SMART_ASSISTANT_BUDGET_FIELD_NAME;
                                return;
                            }
                            if (!context.value && Number.isFinite(parseBudgetValue(candidate))) {
                                context.value = candidate;
                            }
                            if (!context.reason && value.length) {
                                context.reason = candidate;
                            }
                            return;
                        }

                        if (!candidate || typeof candidate !== 'object') return;
                        const fieldName = candidate.name || candidate.field || candidate.fieldName || candidate.key;
                        if (typeof fieldName === 'string' && !context.field
                            && fieldName.replace(/\\s+/g, '').toLowerCase() === SMART_ASSISTANT_BUDGET_FIELD_NAME.toLowerCase()) {
                            context.field = SMART_ASSISTANT_BUDGET_FIELD_NAME;
                        }

                        if (Object.prototype.hasOwnProperty.call(candidate, SMART_ASSISTANT_BUDGET_FIELD_NAME)
                            && Number.isFinite(parseBudgetValue(candidate[SMART_ASSISTANT_BUDGET_FIELD_NAME])) && !context.value) {
                            context.value = candidate[SMART_ASSISTANT_BUDGET_FIELD_NAME];
                        }

                        if (Object.prototype.hasOwnProperty.call(candidate, 'value')
                            && Number.isFinite(parseBudgetValue(candidate.value)) && !context.value) {
                            context.value = candidate.value;
                        }

                        if (Object.prototype.hasOwnProperty.call(candidate, 'message')
                            && typeof candidate.message === 'string') {
                            context.reason = candidate.message;
                        }
                        if (Object.prototype.hasOwnProperty.call(candidate, 'msg')
                            && typeof candidate.msg === 'string' && !context.reason) {
                            context.reason = candidate.msg;
                        }
                        if (Object.prototype.hasOwnProperty.call(candidate, 'reason')
                            && (typeof candidate.reason === 'string' || typeof candidate.reason === 'number') && !context.reason) {
                            context.reason = candidate.reason;
                        }
                    };

                    (Array.isArray(args) ? args : []).forEach((arg) => visit(arg));
                    return context;
                };

                const isSmartAssistantBudgetWarning = (context, reason = null) => {
                    if (!context || context.field !== SMART_ASSISTANT_BUDGET_FIELD_NAME) return false;
                    if (!shouldBypassSmartAssistantBudgetValidationValue(context.value)) return false;
                    const reasonText = String(reason || context.reason || '').toLowerCase();
                    if (!reasonText) return true;
                    return SMART_ASSISTANT_BUDGET_WARNING_RE.test(reasonText);
                };

                const clearSmartAssistantBudgetErrorState = () => {
                    const selectors = [
                        '[name="' + SMART_ASSISTANT_BUDGET_FIELD_NAME + '"]',
                        '[id="' + SMART_ASSISTANT_BUDGET_FIELD_NAME + '"]',
                        '[data-name="' + SMART_ASSISTANT_BUDGET_FIELD_NAME + '"]',
                        '[data-am-smart-assistant-budget]'
                    ];
                    const nodes = new Set();
                    selectors.forEach((selector) => {
                        try {
                            document.querySelectorAll(selector).forEach((node) => nodes.add(node));
                        } catch { }
                    });
                    nodes.forEach((node) => {
                        if (!(node instanceof Element)) return;
                        node.classList.remove('has-error');
                        node.classList.remove('is-error');
                        const wrapper = node.closest('.has-error, .mx-error, .error, .am-error');
                        if (wrapper instanceof Element) {
                            wrapper.classList.remove('has-error');
                            wrapper.classList.remove('is-error');
                            wrapper.classList.remove('mx-error');
                            wrapper.classList.remove('error');
                            wrapper.classList.remove('am-error');
                        }
                    });
                };

                const shouldPatchSmartAssistantValidationTarget = (target) => {
                    if (!target || typeof target !== 'object') return false;
                    const hasValidator = [target.setError, target.getErrors, target.getState, target.validate].some((fn) => typeof fn === 'function');
                    if (!hasValidator) return false;

                    const inspect = (value) => (
                        value
                            && typeof value === 'object'
                            && Object.prototype.hasOwnProperty.call(value, SMART_ASSISTANT_BUDGET_FIELD_NAME)
                    );
                    return inspect(target)
                        || inspect(target.formState)
                        || inspect(target.state)
                        || inspect(target.props)
                        || inspect(target.data)
                        || inspect(target.valueMap)
                        || inspect(target.values);
                };

                const filterBudgetErrors = (errors) => {
                    const clearSingle = (item) => {
                        if (!item || typeof item !== 'object') return null;
                        if (!Object.prototype.hasOwnProperty.call(item, SMART_ASSISTANT_BUDGET_FIELD_NAME)) return item;
                        const maybeValue = parseBudgetValue(item[SMART_ASSISTANT_BUDGET_FIELD_NAME]);
                        if (!Number.isFinite(maybeValue) || maybeValue >= SMART_ASSISTANT_BUDGET_MIN_VALUE) return item;
                        return null;
                    };
                    if (Array.isArray(errors)) {
                        return errors
                            .map(clearSingle)
                            .filter((item) => item && item !== null);
                    }
                    if (errors && typeof errors === 'object') {
                        const value = clearSingle(errors);
                        return value || {};
                    }
                    return errors;
                };

                const patchSmartAssistantValidationTarget = (target) => {
                    if (!shouldPatchSmartAssistantValidationTarget(target)) return;
                    if (smartAssistantPatchedTargets.has(target)) return;

                    const hasSetError = typeof target.setError === 'function';
                    const hasGetErrors = typeof target.getErrors === 'function';
                    const hasGetState = typeof target.getState === 'function';
                    const hasValidate = typeof target.validate === 'function';

                    smartAssistantPatchedTargets.set(target, {
                        hasSetError,
                        setError: target.setError,
                        hasGetErrors,
                        getErrors: target.getErrors,
                        hasGetState,
                        getState: target.getState,
                        hasValidate,
                        validate: target.validate
                    });

                    if (hasSetError) {
                        target.setError = function (...args) {
                            const context = collectBudgetValidationContext(args);
                            context.field = context.field || SMART_ASSISTANT_BUDGET_FIELD_NAME;
                            const reason = String(context.reason || args?.[0] || '').toLowerCase();
                            if (isSmartAssistantBudgetWarning(context, reason)) {
                                clearSmartAssistantBudgetErrorState();
                                const values = createSmartAssistantBudgetValidationValues(context.value, reason);
                                if (window.__AM_BUDGET_FRONTEND_UNLOCK_DEBUG__) {
                                    window.__AM_BUDGET_FRONTEND_UNLOCK_DEBUG__(values);
                                }
                                return;
                            }
                            return target.setError.apply(this, args);
                        };
                    }

                    if (hasGetErrors) {
                        target.getErrors = function (...args) {
                            const context = collectBudgetValidationContext(args);
                            const reason = String(context.reason || '').toLowerCase();
                            if (isSmartAssistantBudgetWarning(context, reason)) {
                                return filterBudgetErrors(target.getErrors.call(this, ...args));
                            }
                            return filterBudgetErrors(target.getErrors.call(this, ...args));
                        };
                    }

                    if (hasGetState) {
                        target.getState = function (...args) {
                            const state = target.getState.apply(this, args);
                            if (!state || typeof state !== 'object') return state;
                            if (Object.prototype.hasOwnProperty.call(state, SMART_ASSISTANT_BUDGET_FIELD_NAME)) {
                                const budgetValue = parseBudgetValue(state[SMART_ASSISTANT_BUDGET_FIELD_NAME]);
                                if (Number.isFinite(budgetValue) && budgetValue < SMART_ASSISTANT_BUDGET_MIN_VALUE) {
                                    delete state[SMART_ASSISTANT_BUDGET_FIELD_NAME].error;
                                    delete state[SMART_ASSISTANT_BUDGET_FIELD_NAME].message;
                                    delete state[SMART_ASSISTANT_BUDGET_FIELD_NAME].code;
                                }
                            }
                            if (Array.isArray(state.errors)) {
                                state.errors = filterBudgetErrors(state.errors);
                            } else if (state.errors && typeof state.errors === 'object') {
                                const nextErrors = { ...state.errors };
                                if (Object.prototype.hasOwnProperty.call(nextErrors, SMART_ASSISTANT_BUDGET_FIELD_NAME)
                                    && shouldBypassSmartAssistantBudgetValidationValue(nextErrors[SMART_ASSISTANT_BUDGET_FIELD_NAME])) {
                                    delete nextErrors[SMART_ASSISTANT_BUDGET_FIELD_NAME];
                                }
                                state.errors = nextErrors;
                            }
                            clearSmartAssistantBudgetErrorState();
                            return state;
                        };
                    }

                    if (hasValidate) {
                        target.validate = function (...args) {
                            const context = collectBudgetValidationContext(args);
                            context.field = context.field || SMART_ASSISTANT_BUDGET_FIELD_NAME;
                            const reasonText = String(context.reason || '').toLowerCase();
                            if (isSmartAssistantBudgetWarning(context, reasonText)) {
                                clearSmartAssistantBudgetErrorState();
                                return Promise.resolve(true);
                            }

                            try {
                                const result = target.validate.apply(this, args);
                                if (result && typeof result.then === 'function') {
                                    return result.then(
                                        (value) => value,
                                        (err) => {
                                            const errContext = collectBudgetValidationContext([err]);
                                            errContext.field = errContext.field || context.field;
                                            errContext.value = errContext.value || context.value;
                                            if (isSmartAssistantBudgetWarning(errContext, String(err))) {
                                                clearSmartAssistantBudgetErrorState();
                                                return true;
                                            }
                                            throw err;
                                        }
                                    );
                                }
                                return result;
                            } catch (err) {
                                const errContext = collectBudgetValidationContext([err]);
                                errContext.field = errContext.field || context.field;
                                errContext.value = errContext.value || context.value;
                                if (isSmartAssistantBudgetWarning(errContext, String(err))) {
                                    clearSmartAssistantBudgetErrorState();
                                    return true;
                                }
                                throw err;
                            }
                        };
                    }
                };

                const restoreSmartAssistantPatches = () => {
                    smartAssistantPatchedTargets.forEach((snapshot, target) => {
                        if (snapshot.hasSetError) target.setError = snapshot.setError;
                        if (snapshot.hasGetErrors) target.getErrors = snapshot.getErrors;
                        if (snapshot.hasGetState) target.getState = snapshot.getState;
                        if (snapshot.hasValidate) target.validate = snapshot.validate;
                    });
                    smartAssistantPatchedTargets.clear();
                };

                const collectSmartAssistantReactTargets = () => {
                    const targets = new Set();
                    const nodes = Array.from(document.querySelectorAll('input, textarea, select, [id], [name]'));
                    nodes.forEach((node) => {
                        const fiberKeys = Object.keys(node).filter((key) => /^__reactFiber\\$/.test(key));
                        fiberKeys.forEach((key) => {
                            let cursor = node[key];
                            let depth = 0;
                            while (cursor && depth < 14) {
                                const stateNode = cursor.stateNode;
                                if (stateNode) targets.add(stateNode);
                                cursor = cursor.return || cursor._debugOwner;
                                depth += 1;
                            }
                        });
                    });
                    nodes.forEach((node) => {
                        const datasetValue = String(node.getAttribute?.('data-name') || '').toLowerCase();
                        if (datasetValue === SMART_ASSISTANT_BUDGET_FIELD_NAME || node.getAttribute?.('name') === SMART_ASSISTANT_BUDGET_FIELD_NAME) {
                            const value = node.value;
                            if (!shouldBypassSmartAssistantBudgetValidationValue(value)) return;
                            const parent = node.closest ? node.closest('.am-budgets, .budget, .form-item, .field') : null;
                            if (parent && parent.__reactInternalInstance$) {
                                const raw = Object.values(parent).find((item) => item && typeof item === 'object' && item.stateNode);
                                if (raw && raw.stateNode) targets.add(raw.stateNode);
                            }
                        }
                    });
                    return Array.from(targets);
                };

                const patchSmartAssistantBudgetValidation = () => {
                    collectSmartAssistantReactTargets().forEach(patchSmartAssistantValidationTarget);
                };

                const isSmartAssistantBudgetPage = () => {
                    try {
                        const href = String(window.location.href || '').toLowerCase();
                        return href.includes('myseller.taobao.com')
                            && href.includes('crm-workbench')
                            && href.includes('smartassistant');
                    } catch {
                        return false;
                    }
                };

                const scheduleSmartAssistantPatch = () => {
                    if (smartAssistantScanTimer) return;
                    smartAssistantScanTimer = setTimeout(() => {
                        smartAssistantScanTimer = null;
                        if (window.__AM_BUDGET_FRONTEND_UNLOCK__ && isSmartAssistantBudgetPage()) {
                            patchSmartAssistantBudgetValidation();
                        } else if (!window.__AM_BUDGET_FRONTEND_UNLOCK__) {
                            restoreSmartAssistantPatches();
                        }
                    }, 120);
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
                        restoreSmartAssistantPatches();
                        return;
                    }
                    const magixRef = await getMagix();
                    if (!window.__AM_BUDGET_FRONTEND_UNLOCK__) {
                        restoreAll();
                        restoreSmartAssistantPatches();
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

                    if (isSmartAssistantBudgetPage()) {
                        scheduleSmartAssistantPatch();
                    } else {
                        restoreSmartAssistantPatches();
                    }
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
                window.__AM_BUDGET_SMART_ASSISTANT_DEBUG__ = {
                    isSmartAssistantBudgetPage,
                    shouldBypassSmartAssistantBudgetValidationValue,
                    createSmartAssistantBudgetValidationValues,
                    collectSmartAssistantReactTargets,
                    clearSmartAssistantBudgetErrorState
                };
                window.addEventListener('hashchange', scheduleApply, true);
                startObserver();
                setInterval(() => {
                    if (window.__AM_BUDGET_FRONTEND_UNLOCK__) scheduleApply();
                }, 600);
                if (window.__AM_BUDGET_FRONTEND_UNLOCK__) {
                    scheduleSmartAssistantPatch();
                }
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
