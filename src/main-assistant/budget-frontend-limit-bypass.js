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
                const PATCHER_VERSION = '2026-06-01-budget-submit-v7';
                if (window.__AM_BUDGET_FRONTEND_UNLOCK_PATCHER_VERSION__ === PATCHER_VERSION) return;
                window.__AM_BUDGET_FRONTEND_UNLOCK_PATCHER_VERSION__ = PATCHER_VERSION;
                window.__AM_BUDGET_FRONTEND_UNLOCK_PATCHER_INSTALLED__ = true;
                window.__AM_BUDGET_FRONTEND_UNLOCK__ = !!window.__AM_BUDGET_FRONTEND_UNLOCK__;
                const SMART_ASSISTANT_BUDGET_WARNING_RE = /(预算|dailyBudgetAmount|日预算|daily\\s*budget|不能|不能?低于|不少于|低于|至少).{0,20}(100|一百)/i;
                const SMART_ASSISTANT_BUDGET_FIELD_NAME = 'dailyBudgetAmount';
                const SMART_ASSISTANT_BUDGET_MIN_VALUE = 100;
                const GENERAL_BUDGET_FIELD_RE = /(预算|日预算|每日预算|day\\s*budget|daily\\s*budget|dayBudget|dailyBudget|dayAverageBudget|totalBudget|futureBudget|constraintValue|budgetAmount|day_budget|daily_budget)/i;
                const DAILY_BUDGET_FIELD_RE = /(每日预算|日预算|day\\s*budget|daily\\s*budget|dayBudget|dailyBudget|day_budget|daily_budget)/i;
                const BUDGET_MIN_HINT_RE = /(低于|不少于|至少|不能低于|不得低于|大于|以上|min|minimum)/i;
                const NUMERIC_THRESHOLD_RE = /(?:\\d[\\d,]*(?:\\.\\d+)?|一百|百)/i;

                const BUDGET_SELECTOR = [
                    '[mx-view*="dayBudget"]',
                    '[mx-view*="dailyBudget"]',
                    '[mx-view*="budgetAmount"]',
                    '[mx-view*="budget"]',
                    '[mx-view*="dayAverageBudget"]',
                    '[mx-view*="totalBudget"]',
                    '[mx-view*="futureBudget"]',
                    '[mx-view*="constraintValue"]',
                    '[mxc*="dayBudget"]',
                    '[mxc*="dailyBudget"]',
                    '[mxc*="budgetAmount"]',
                    '[mxc*="budget"]',
                    '[mxc*="dayAverageBudget"]',
                    '[mxc*="totalBudget"]',
                    '[mxc*="futureBudget"]',
                    '[mxc*="suggestInput"]',
                    '[name*="dayBudget"]',
                    '[name*="dailyBudget"]',
                    '[name*="budgetAmount"]',
                    '[name*="budget"]',
                    '[data-name*="dayBudget"]',
                    '[data-name*="dailyBudget"]',
                    '[data-name*="budgetAmount"]',
                    '[data-name*="budget"]'
                ].join(',');

                const patchedViews = new Set();
                const snapshots = new WeakMap();
                const smartAssistantPatchedTargets = new Map();
                let budgetRetryFetch = null;
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
                        || typeof view.validate === 'function'
                        || hasRulesMin
                        || hasOriginRulesMin;
                };

                const isDailyBudgetMinValidationText = (text) => {
                    const value = String(text || '').replace(/\\s+/g, ' ').trim();
                    if (!value) return false;
                    return DAILY_BUDGET_FIELD_RE.test(value)
                        && BUDGET_MIN_HINT_RE.test(value)
                        && NUMERIC_THRESHOLD_RE.test(value);
                };

                const hasVisibleDailyBudgetMinHint = () => {
                    try {
                        const nodes = document.querySelectorAll('.next-form-item-help, .next-form-item-explain, .mx-form-explain, .error-msg, .error-message, .msg-error, [class*="error"], [class*="Error"]');
                        return Array.from(nodes).some((node) => {
                            if (!(node instanceof Element)) return false;
                            const rect = node.getBoundingClientRect();
                            if (rect.width <= 0 || rect.height <= 0) return false;
                            return isDailyBudgetMinValidationText(node.textContent || '');
                        });
                    } catch {
                        return false;
                    }
                };

                const isBudgetMinValidationText = (text) => {
                    const value = String(text || '').replace(/\\s+/g, ' ').trim();
                    if (!value) return false;
                    if (isDailyBudgetMinValidationText(value)) return true;
                    return /请检查.{0,12}(每日预算|日预算)/i.test(value) && hasVisibleDailyBudgetMinHint();
                };

                const isBudgetMinValidationResult = (value) => {
                    if (!value || typeof value !== 'object') return false;
                    const ok = value.ok === false
                        || value.success === false
                        || value.valid === false
                        || value.result === false;
                    if (!ok) return false;
                    const text = [
                        value.msg,
                        value.message,
                        value.error,
                        value.reason,
                        value.tip,
                        value.title
                    ].filter(Boolean).join(' ');
                    return isBudgetMinValidationText(text);
                };

                const normalizeBudgetCheckResult = (value) => (
                    isBudgetMinValidationResult(value)
                        ? { ...value, ok: true, success: true, valid: true, result: true, msg: '', message: '' }
                        : value
                );

                const normalizeBudgetIsValidResult = (value) => (
                    isBudgetMinValidationResult(value) ? true : value
                );

                const isBudgetMinValidationError = (err) => {
                    const text = String(err?.message || err?.msg || err || '');
                    return isBudgetMinValidationText(text);
                };

                const collectBudgetFieldNodes = () => {
                    const nodes = new Set();
                    try {
                        document.querySelectorAll(BUDGET_SELECTOR).forEach((node) => nodes.add(node));
                    } catch { }
                    try {
                        document.querySelectorAll('input, textarea').forEach((node) => {
                            if (!(node instanceof Element)) return;
                            const attrs = [
                                node.getAttribute('name'),
                                node.getAttribute('id'),
                                node.getAttribute('data-name'),
                                node.getAttribute('placeholder'),
                                node.getAttribute('aria-label')
                            ].filter(Boolean).join(' ');
                            const scope = node.closest('.next-form-item, .mx-form-item, .form-item, .field, [class*="form"], [class*="budget"], [class*="Budget"]');
                            const scopeText = String(scope?.textContent || '').slice(0, 300);
                            if (GENERAL_BUDGET_FIELD_RE.test(attrs + ' ' + scopeText)) nodes.add(node);
                        });
                    } catch { }
                    return Array.from(nodes);
                };

                const collectBudgetValidationScopes = () => {
                    const scopes = new Set();
                    collectBudgetFieldNodes().forEach((node) => {
                        if (!(node instanceof Element)) return;
                        [
                            node,
                            node.closest('.next-form-item, .mx-form-item, .form-item, .field'),
                            node.closest('[class*="budget"], [class*="Budget"]')
                        ].forEach((scope) => {
                            if (scope instanceof Element) scopes.add(scope);
                        });
                    });
                    return Array.from(scopes);
                };

                const clearGenericBudgetErrorState = () => {
                    collectBudgetValidationScopes().forEach((scope) => {
                        if (!(scope instanceof Element)) return;
                        const scopeText = String(scope.textContent || '');
                        if (scope !== document.body && !GENERAL_BUDGET_FIELD_RE.test(scopeText)) return;
                        [
                            scope,
                            ...Array.from(scope.querySelectorAll('.has-error, .is-error, .mx-error, .am-error, .error, .next-form-item-error, [aria-invalid="true"]'))
                        ].forEach((node) => {
                            if (!(node instanceof Element)) return;
                            node.classList.remove('has-error');
                            node.classList.remove('is-error');
                            node.classList.remove('mx-error');
                            node.classList.remove('am-error');
                            node.classList.remove('error');
                            node.classList.remove('next-form-item-error');
                            if (node.getAttribute('aria-invalid') === 'true') node.setAttribute('aria-invalid', 'false');
                        });
                        Array.from(scope.querySelectorAll('.next-form-item-help, .next-form-item-explain, .mx-form-explain, .error-msg, .error-message, .msg-error, [class*="error"], [class*="Error"]')).forEach((node) => {
                            if (!(node instanceof Element)) return;
                            if (isBudgetMinValidationText(node.textContent || '')) {
                                node.textContent = '';
                                if (node instanceof HTMLElement) node.style.display = 'none';
                            }
                        });
                    });
                };

                const patchView = (view) => {
                    if (!canPatch(view)) return;
                    if (snapshots.has(view)) return;
                    const hasCheck = typeof view.check === 'function';
                    const originalCheck = hasCheck ? view.check : null;
                    const hasIsValidFn = typeof view.isValid === 'function';
                    const originalIsValid = hasIsValidFn ? view.isValid : null;
                    const hasValidate = typeof view.validate === 'function';
                    const originalValidate = hasValidate ? view.validate : null;
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
                        hasValidate,
                        validate: hasValidate ? view.validate : null,
                        hasIsValidBool,
                        isValidBool: hasIsValidBool ? view.isValid : null,
                        hasRulesMin,
                        rulesMin: hasRulesMin ? rules.min : undefined,
                        hasOriginRulesMin,
                        originRulesMin: hasOriginRulesMin ? originRules.min : undefined
                    });
                    patchedViews.add(view);

                    if (hasCheck) {
                        view.check = function (...args) {
                            try {
                                const result = originalCheck.apply(this, args);
                                if (result && typeof result.then === 'function') {
                                    return result.then(
                                        (value) => {
                                            const nextValue = normalizeBudgetCheckResult(value);
                                            if (nextValue !== value) clearGenericBudgetErrorState();
                                            return nextValue;
                                        },
                                        (err) => {
                                            if (isBudgetMinValidationError(err)) {
                                                clearGenericBudgetErrorState();
                                                return { ok: true, msg: '' };
                                            }
                                            throw err;
                                        }
                                    );
                                }
                                const nextResult = normalizeBudgetCheckResult(result);
                                if (nextResult !== result) clearGenericBudgetErrorState();
                                return nextResult;
                            } catch (err) {
                                if (isBudgetMinValidationError(err)) {
                                    clearGenericBudgetErrorState();
                                    return { ok: true, msg: '' };
                                }
                                throw err;
                            }
                        };
                    }
                    if (hasIsValidFn) {
                        view.isValid = function (...args) {
                            try {
                                const result = originalIsValid.apply(this, args);
                                if (result && typeof result.then === 'function') {
                                    return result.then(
                                        (value) => {
                                            const nextValue = normalizeBudgetIsValidResult(value);
                                            if (nextValue !== value) clearGenericBudgetErrorState();
                                            return nextValue;
                                        },
                                        (err) => {
                                            if (isBudgetMinValidationError(err)) {
                                                clearGenericBudgetErrorState();
                                                return true;
                                            }
                                            throw err;
                                        }
                                    );
                                }
                                const nextResult = normalizeBudgetIsValidResult(result);
                                if (nextResult !== result) clearGenericBudgetErrorState();
                                return nextResult;
                            } catch (err) {
                                if (isBudgetMinValidationError(err)) {
                                    clearGenericBudgetErrorState();
                                    return true;
                                }
                                throw err;
                            }
                        };
                    } else if (hasIsValidBool) {
                        view.isValid = true;
                    }
                    if (hasValidate) {
                        view.validate = function (...args) {
                            try {
                                const result = originalValidate.apply(this, args);
                                if (result && typeof result.then === 'function') {
                                    return result.then(
                                        (value) => {
                                            const nextValue = normalizeBudgetCheckResult(value);
                                            if (nextValue !== value) clearGenericBudgetErrorState();
                                            return nextValue;
                                        },
                                        (err) => {
                                            if (isBudgetMinValidationError(err)) {
                                                clearGenericBudgetErrorState();
                                                return { ok: true, msg: '' };
                                            }
                                            throw err;
                                        }
                                    );
                                }
                                const nextResult = normalizeBudgetCheckResult(result);
                                if (nextResult !== result) clearGenericBudgetErrorState();
                                return nextResult;
                            } catch (err) {
                                if (isBudgetMinValidationError(err)) {
                                    clearGenericBudgetErrorState();
                                    return { ok: true, msg: '' };
                                }
                                throw err;
                            }
                        };
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
                        if (snapshot.hasValidate) view.validate = snapshot.validate;
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
                    const normalized = String(rawValue || '').replace(/,/g, '').replace(/[^0-9.-]+/g, '').trim();
                    if (!normalized) return NaN;
                    const parsed = Number.parseFloat(normalized);
                    return Number.isFinite(parsed) ? parsed : NaN;
                };

                const parseServerMinimumBudgetValue = (text) => {
                    const rawText = String(text || '');
                    const parseFromText = (value) => {
                        const match = String(value || '').match(/日预算不能低于[^0-9]*([0-9,.]+)[^0-9]*元/i);
                        return match ? parseBudgetValue(match[1]) : NaN;
                    };
                    try {
                        const payload = JSON.parse(rawText);
                        const details = Array.isArray(payload?.data?.errorDetails) ? payload.data.errorDetails : [];
                        for (const detail of details) {
                            const parsed = parseFromText(detail?.msg);
                            if (Number.isFinite(parsed) && parsed > 0) return parsed;
                        }
                    } catch { }
                    return parseFromText(rawText);
                };

                const parseBudgetSubmitPayload = (body) => {
                    if (typeof body === 'string') {
                        try {
                            return JSON.parse(body);
                        } catch {
                            return null;
                        }
                    }
                    if (body instanceof URLSearchParams) {
                        try {
                            return JSON.parse(body.toString());
                        } catch {
                            return null;
                        }
                    }
                    if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob) && !(body instanceof ArrayBuffer)) {
                        return body;
                    }
                    return null;
                };

                const getDailyBudgetSubmitValue = (payload) => {
                    const item = payload?.budgetList?.find((entry) => {
                        if (!entry || typeof entry !== 'object') return false;
                        const dmcType = String(entry.dmcType || '').trim();
                        return dmcType === '' || dmcType === 'normal';
                    });
                    return item ? parseBudgetValue(item.dayBudget) : NaN;
                };

                const retryBudgetSubmitWithServerMinimum = (url, body, responseText) => {
                    window.__AM_BUDGET_SERVER_MINIMUM_RETRY_STATE__ = {
                        url,
                        attempted: false,
                        reason: '',
                        responseText: String(responseText || '').slice(0, 300)
                    };
                    if (!window.__AM_BUDGET_FRONTEND_UNLOCK__) {
                        window.__AM_BUDGET_SERVER_MINIMUM_RETRY_STATE__.reason = 'unlock-disabled';
                        return;
                    }
                    const serverMinimum = parseServerMinimumBudgetValue(responseText);
                    window.__AM_BUDGET_SERVER_MINIMUM_RETRY_STATE__.serverMinimum = serverMinimum;
                    if (!Number.isFinite(serverMinimum) || serverMinimum <= 0) {
                        window.__AM_BUDGET_SERVER_MINIMUM_RETRY_STATE__.reason = 'minimum-not-found';
                        return;
                    }
                    const payload = parseBudgetSubmitPayload(body);
                    const requestedBudget = getDailyBudgetSubmitValue(payload);
                    window.__AM_BUDGET_SERVER_MINIMUM_RETRY_STATE__.requestedBudget = requestedBudget;
                    if (!payload || !Number.isFinite(requestedBudget)) {
                        window.__AM_BUDGET_SERVER_MINIMUM_RETRY_STATE__.reason = 'requested-budget-not-found';
                        return;
                    }
                    if (requestedBudget >= serverMinimum) {
                        window.__AM_BUDGET_SERVER_MINIMUM_RETRY_STATE__.reason = 'requested-not-lower-than-minimum';
                        return;
                    }
                    const retryPayload = JSON.parse(JSON.stringify(payload));
                    let changed = false;
                    retryPayload.budgetList.forEach((item) => {
                        if (!item || typeof item !== 'object') return;
                        const dmcType = String(item.dmcType || '').trim();
                        if (dmcType !== '' && dmcType !== 'normal') return;
                        item.dmcType = dmcType || 'normal';
                        item.dayBudget = serverMinimum;
                        changed = true;
                    });
                    if (!changed || typeof budgetRetryFetch !== 'function') {
                        window.__AM_BUDGET_SERVER_MINIMUM_RETRY_STATE__.reason = 'retry-unavailable';
                        return;
                    }
                    window.__AM_BUDGET_SERVER_MINIMUM_RETRY_STATE__.attempted = true;
                    window.__AM_BUDGET_SERVER_MINIMUM_RETRY_STATE__.retryBudget = serverMinimum;
                    budgetRetryFetch.call(window, url, {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'content-type': 'application/json;charset=UTF-8' },
                        body: JSON.stringify(retryPayload)
                    }).then((response) => response.text().then((text) => {
                        window.__AM_BUDGET_SERVER_MINIMUM_RETRY_STATE__.status = response.status;
                        window.__AM_BUDGET_SERVER_MINIMUM_RETRY_STATE__.retryResponseText = text.slice(0, 300);
                    })).catch((err) => {
                        window.__AM_BUDGET_SERVER_MINIMUM_RETRY_STATE__.reason = 'retry-failed';
                        window.__AM_BUDGET_SERVER_MINIMUM_RETRY_STATE__.error = String(err?.message || err || '');
                    });
                };

                const findVisibleBudgetDialog = () => {
                    try {
                        const candidates = Array.from(document.querySelectorAll('[role="dialog"], [id^="cnt_dlg_"], [id*="_dlg_"], .next-dialog, .next-overlay-wrapper, .mx-dialog, .dialog, [class*="dialog"], [class*="Dialog"]'));
                        return candidates.reduce((best, node) => {
                            if (!(node instanceof Element)) return best;
                            const rect = node.getBoundingClientRect();
                            if (rect.width <= 0 || rect.height <= 0) return best;
                            const text = String(node.textContent || '').replace(/\\s+/g, ' ');
                            const hasVisibleInput = Array.from(node.querySelectorAll('input, textarea')).some((input) => {
                                if (!(input instanceof Element)) return false;
                                const inputRect = input.getBoundingClientRect();
                                return inputRect.width > 0 && inputRect.height > 0;
                            });
                            const hasBudgetDialogTitle = /修改预算/.test(text) && DAILY_BUDGET_FIELD_RE.test(text);
                            const hasBudgetDialogBody = hasVisibleInput
                                && DAILY_BUDGET_FIELD_RE.test(text)
                                && /(基础推广设置|预算类型|补贴力度|防停投)/.test(text);
                            if (!hasBudgetDialogTitle && !hasBudgetDialogBody) return best;
                            const area = rect.width * rect.height;
                            if (!best || area > best.area) return { node, area };
                            return best;
                        }, null)?.node || null;
                    } catch {
                        return null;
                    }
                };

                const getVisibleDailyBudgetInputValue = () => {
                    const dialog = findVisibleBudgetDialog();
                    if (!dialog) return NaN;
                    let best = null;
                    Array.from(dialog.querySelectorAll('input, textarea')).forEach((node) => {
                        if (!(node instanceof HTMLInputElement) && !(node instanceof HTMLTextAreaElement)) return;
                        const rect = node.getBoundingClientRect();
                        if (rect.width <= 0 || rect.height <= 0) return;
                        const scope = node.closest('.mxform-line, .next-form-item, .mx-form-item, .form-item, .field, [class*="budget"], [class*="Budget"]');
                        const scopeText = String(scope?.textContent || '').replace(/\\s+/g, ' ').slice(0, 500);
                        if (!DAILY_BUDGET_FIELD_RE.test(scopeText + ' ' + node.id + ' ' + node.name)) return;
                        const value = parseBudgetValue(node.value);
                        if (!Number.isFinite(value) || value <= 0) return;
                        const hasDailyLabel = DAILY_BUDGET_FIELD_RE.test(scopeText + ' ' + node.id + ' ' + node.name);
                        const score = (hasDailyLabel ? 100 : 0) + Math.max(0, Math.min(20, Math.round(rect.width / 20)));
                        if (!best || score > best.score) best = { value, score };
                    });
                    return best ? best.value : NaN;
                };

                const normalizeBudgetSubmitBody = (body) => {
                    if (!window.__AM_BUDGET_FRONTEND_UNLOCK__) return body;
                    const visibleBudgetValue = getVisibleDailyBudgetInputValue();
                    if (!Number.isFinite(visibleBudgetValue) || visibleBudgetValue <= 0) return body;
                    const applyBudgetList = (payload) => {
                        if (!payload || typeof payload !== 'object' || !Array.isArray(payload.budgetList)) return false;
                        let changed = false;
                        payload.budgetList.forEach((item) => {
                            if (!item || typeof item !== 'object') return;
                            const dmcType = String(item.dmcType || '').trim();
                            const hasNonDailyBudget = item.dayAverageBudget !== undefined
                                || item.totalBudget !== undefined
                                || item.futureBudget !== undefined;
                            const isDailyBudgetRequest = (dmcType === '' || dmcType === 'normal')
                                && !hasNonDailyBudget
                                && (item.dayBudget !== undefined || item.budgetType === undefined);
                            if (!isDailyBudgetRequest) return;
                            item.dmcType = dmcType || 'normal';
                            item.dayBudget = String(visibleBudgetValue);
                            changed = true;
                        });
                        return changed;
                    };
                    if (typeof body === 'string') {
                        try {
                            const payload = parseBudgetSubmitPayload(body);
                            return applyBudgetList(payload) ? JSON.stringify(payload) : body;
                        } catch {
                            return body;
                        }
                    }
                    if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob) && !(body instanceof ArrayBuffer)) {
                        try {
                            const payload = parseBudgetSubmitPayload(body);
                            if (applyBudgetList(payload)) {
                                return body instanceof URLSearchParams ? JSON.stringify(payload) : payload;
                            }
                        } catch { }
                    }
                    return body;
                };

                const installBudgetSubmitPayloadPatch = () => {
                    const isBudgetBatchUpdateUrl = (url) => {
                        try {
                            const path = new URL(String(url || ''), window.location.origin).pathname;
                            return /\\/campaign\\/budget\\/batchUpdate\\.json$/i.test(path);
                        } catch {
                            return /\\/campaign\\/budget\\/batchUpdate\\.json/i.test(String(url || ''));
                        }
                    };
                    const originalFetch = window.fetch;
                    if (typeof originalFetch === 'function' && originalFetch.__amBudgetSubmitPayloadPatchVersion !== PATCHER_VERSION) {
                        const baseFetch = originalFetch.__amBudgetSubmitOriginalFetch || originalFetch;
                        budgetRetryFetch = baseFetch;
                        const patchedFetch = function (...args) {
                            try {
                                const first = args[0];
                                const second = args[1] ? { ...args[1] } : undefined;
                                const url = typeof first === 'string' ? first : first?.url;
                                if (isBudgetBatchUpdateUrl(url) && second && Object.prototype.hasOwnProperty.call(second, 'body')) {
                                    second.body = normalizeBudgetSubmitBody(second.body);
                                    args[1] = second;
                                }
                            } catch { }
                            return baseFetch.apply(this, args);
                        };
                        patchedFetch.__amBudgetSubmitPayloadPatchVersion = PATCHER_VERSION;
                        patchedFetch.__amBudgetSubmitOriginalFetch = baseFetch;
                        window.fetch = patchedFetch;
                    } else if (typeof originalFetch === 'function' && originalFetch.__amBudgetSubmitOriginalFetch) {
                        budgetRetryFetch = originalFetch.__amBudgetSubmitOriginalFetch;
                    }
                    const xhrProto = window.XMLHttpRequest && window.XMLHttpRequest.prototype;
                    if (xhrProto && typeof xhrProto.open === 'function' && typeof xhrProto.send === 'function') {
                        const originalOpen = xhrProto.open;
                        const originalSend = xhrProto.send;
                        if (originalOpen.__amBudgetSubmitPayloadPatchVersion !== PATCHER_VERSION) {
                            const baseOpen = originalOpen.__amBudgetSubmitOriginalOpen || originalOpen;
                            const patchedOpen = function (...args) {
                                this.__amBudgetBatchUpdateUrl = args?.[1] || '';
                                return baseOpen.apply(this, args);
                            };
                            patchedOpen.__amBudgetSubmitPayloadPatchVersion = PATCHER_VERSION;
                            patchedOpen.__amBudgetSubmitOriginalOpen = baseOpen;
                            xhrProto.open = patchedOpen;
                        }
                        if (originalSend.__amBudgetSubmitPayloadPatchVersion !== PATCHER_VERSION) {
                            const baseSend = originalSend.__amBudgetSubmitOriginalSend || originalSend;
                            const patchedSend = function (body) {
                                const budgetUrl = this.__amBudgetBatchUpdateUrl;
                                const nextBody = isBudgetBatchUpdateUrl(budgetUrl)
                                    ? normalizeBudgetSubmitBody(body)
                                    : body;
                                if (isBudgetBatchUpdateUrl(budgetUrl) && !this.__amBudgetServerMinimumRetryBound) {
                                    this.__amBudgetServerMinimumRetryBound = true;
                                    this.addEventListener('loadend', () => {
                                        retryBudgetSubmitWithServerMinimum(budgetUrl, nextBody, this.responseText);
                                    });
                                }
                                return baseSend.call(this, nextBody);
                            };
                            patchedSend.__amBudgetSubmitPayloadPatchVersion = PATCHER_VERSION;
                            patchedSend.__amBudgetSubmitOriginalSend = baseSend;
                            xhrProto.send = patchedSend;
                        }
                    }
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
                    while (cursor && depth < 24) {
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
                    installBudgetSubmitPayloadPatch();
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
                    collectBudgetFieldNodes().forEach((node) => {
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
                installBudgetSubmitPayloadPatch();
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
