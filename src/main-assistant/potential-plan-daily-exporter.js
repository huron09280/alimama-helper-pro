    const PotentialPlanDailyExporter = {
        initialized: false,
        running: false,
        TARGET_DAYS: 30,
        MAX_EXPORT_DAYS: 365,
        EXPORT_DAYS_STORAGE_KEY: '__AM_POTENTIAL_EXPORT_DAYS__',
        WRAP_SELECTOR: '.am-potential-plan-export-wrap[data-am-potential-plan-export-wrap="1"]',
        BUTTON_SELECTOR: '.am-potential-plan-export-btn[data-am-potential-plan-export="1"]',
        DAYS_INPUT_SELECTOR: 'input.am-potential-plan-export-days-input[data-am-potential-plan-days="1"]',
        TABLE_QUERY_FIELDS: [
            'potentialIndex',
            'adPv',
            'click',
            'ctr',
            'ecpc',
            'charge',
            'itemColInshopNum',
            'cartInshopNum',
            'shopColDirNum',
            'colCartNum',
            'cvr',
            'roi'
        ],

        init() {
            if (window.top !== window.self) return;
            if (this.initialized) return;
            document.addEventListener('click', (e) => {
                const target = e.target;
                if (!(target instanceof Element)) return;
                if (target.closest(this.DAYS_INPUT_SELECTOR)) return;
                const btn = target.closest(this.BUTTON_SELECTOR);
                if (!(btn instanceof HTMLButtonElement)) return;
                e.preventDefault();
                e.stopPropagation();
                this.exportCsv(btn).catch((err) => {
                    Logger.log(`⚠️ 潜力词计划 CSV 导出失败：${err?.message || '未知错误'} `, true);
                });
            }, true);
            this.initialized = true;
        },

        isTargetPage() {
            const hash = String(window.location.hash || '');
            if (!/\/report\/bidword\/index/i.test(hash)) return false;
            const params = this.parseHashParams();
            return String(params.get('mainTab') || '').trim().toLowerCase() === 'potential';
        },

        parseHashParams() {
            const hash = String(window.location.hash || '');
            const queryIndex = hash.indexOf('?');
            if (queryIndex < 0) return new URLSearchParams();
            return new URLSearchParams(hash.slice(queryIndex + 1));
        },

        normalizePlanName(raw) {
            return String(raw || '')
                .replace(/[\uE000-\uF8FF]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        },

        normalizePlanNameLoose(raw) {
            return this.normalizePlanName(raw).toLowerCase().replace(/[\s\-_（）()【】[\]{}.,，。:：/\\]+/g, '');
        },

        normalizeCampaignId(raw) {
            return PlanIdentityUtils.normalizeCampaignId(raw);
        },

        normalizeItemId(raw) {
            return PlanIdentityUtils.normalizeItemId(raw);
        },

        normalizeBizCode(raw) {
            return PlanIdentityUtils.normalizeBizCode(raw);
        },

        sleep(ms) {
            return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
        },

        isVisible(el) {
            if (!(el instanceof HTMLElement)) return false;
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
        },

        findToggleTriggerPair() {
            const toggleCandidates = Array.from(document.querySelectorAll('[id^="toggle_mx_"]'))
                .filter((el) => el instanceof HTMLElement && this.isVisible(el))
                .filter((el) => (el.querySelectorAll(':scope > span').length || el.querySelectorAll('span').length));
            const triggerCandidates = Array.from(document.querySelectorAll('[id^="trigger_mx_"]'))
                .filter((el) => el instanceof HTMLElement && this.isVisible(el));
            const textOf = (el) => this.normalizePlanName(el?.textContent || '');
            const isPlanToggle = (toggle) => {
                const ownText = textOf(toggle);
                const scope = toggle.closest('div,section,article,tr,li') || toggle.parentElement;
                const scopeText = textOf(scope);
                const merged = `${ownText} ${scopeText}`;
                return /计划[:：]/.test(merged) || /\(\d{6,}\)/.test(merged);
            };
            const targetTrigger = triggerCandidates.find((trigger) => /过去\s*30\s*天|最近\s*30\s*天|近\s*30\s*天/.test(textOf(trigger)))
                || triggerCandidates.find((trigger) => /30\s*天/.test(textOf(trigger)))
                || triggerCandidates[0]
                || null;
            const planToggleCandidates = toggleCandidates.filter(isPlanToggle);

            if (targetTrigger && planToggleCandidates.length) {
                const gRect = targetTrigger.getBoundingClientRect();
                const bestToggle = planToggleCandidates.slice().sort((left, right) => {
                    const lRect = left.getBoundingClientRect();
                    const rRect = right.getBoundingClientRect();
                    const lScore = Math.abs(lRect.top - gRect.top) * 10 + Math.abs(lRect.left - gRect.left);
                    const rScore = Math.abs(rRect.top - gRect.top) * 10 + Math.abs(rRect.left - gRect.left);
                    return lScore - rScore;
                })[0];
                if (bestToggle) return { toggle: bestToggle, trigger: targetTrigger };
            }

            if (toggleCandidates.length && triggerCandidates.length) {
                let bestPair = null;
                let bestScore = Number.POSITIVE_INFINITY;
                toggleCandidates.forEach((toggle) => {
                    const tRect = toggle.getBoundingClientRect();
                    triggerCandidates.forEach((trigger) => {
                        const gRect = trigger.getBoundingClientRect();
                        const verticalGap = Math.abs(tRect.top - gRect.top);
                        const horizontalGap = Math.abs(Math.max(0, gRect.left - tRect.right));
                        const score = verticalGap * 20 + horizontalGap;
                        if (score < bestScore) {
                            bestScore = score;
                            bestPair = { toggle, trigger };
                        }
                    });
                });
                if (bestPair) return bestPair;
            }

            if (toggleCandidates.length) return { toggle: toggleCandidates[0], trigger: null };
            if (triggerCandidates.length) return { toggle: null, trigger: triggerCandidates[0] };
            return { toggle: null, trigger: null };
        },

        resolveCampaignIdFromNode(node) {
            if (!(node instanceof Element)) return '';
            const candidates = [
                node.getAttribute('data-campaign-id') || '',
                node.getAttribute('data-plan-id') || '',
                node.getAttribute('data-value') || '',
                node.getAttribute('value') || '',
                node.getAttribute('mx-click') || '',
                node.getAttribute('mx-change') || '',
                node.getAttribute('mx-href') || '',
                node.getAttribute('href') || '',
                node.dataset?.campaignId || '',
                node.dataset?.planId || '',
                node.id || '',
                node.textContent || ''
            ];
            for (let i = 0; i < candidates.length; i++) {
                const text = String(candidates[i] || '');
                const match = text.match(/(\d{6,})/);
                const id = this.normalizeCampaignId(match?.[1] || '');
                if (id) return id;
            }
            return '';
        },

        parsePlanFromText(rawText) {
            const text = this.normalizePlanName(rawText);
            if (!text) return null;
            if (/^(搜索关键词|全部计划|全部|计划|请选择计划|筛选计划|统计周期|过去\d+天|最近\d+天|近\d+天)$/i.test(text)) return null;
            const id = this.normalizeCampaignId((text.match(/\((\d{6,})\)\s*$/) || [])[1] || '');
            let name = text
                .replace(/^计划\s*[：:]\s*/i, '')
                .replace(/\(\d{6,}\)\s*$/, '')
                .trim();
            if (!name) return null;
            if (!id && !/计划\s*[：:]/.test(text)) return null;
            return {
                planId: id,
                planName: name
            };
        },

        pushPlan(out, dedupe, plan) {
            if (!plan || typeof plan !== 'object') return;
            const planId = this.normalizeCampaignId(plan.planId || '');
            const planName = this.normalizePlanName(plan.planName || '');
            if (!planName) return;
            const key = `${planId || '-'}|${planName}`;
            if (dedupe.has(key)) return;
            dedupe.add(key);
            out.push({ planId, planName });
        },

        collectPlansFromNodes(nodes, out, dedupe) {
            (Array.isArray(nodes) ? nodes : []).forEach((node) => {
                if (!(node instanceof Element)) return;
                const plan = this.parsePlanFromText(node.textContent || '');
                if (!plan) return;
                this.pushPlan(out, dedupe, plan);
            });
        },

        async collectPlansFromDropdown(toggleEl, out, dedupe) {
            if (!(toggleEl instanceof HTMLElement)) return;
            const collectFromOverlay = () => {
                const overlays = Array.from(document.querySelectorAll('[id^="popover_"], .mxgc-popover-content, .next-overlay-wrapper, .next-overlay-inner, body > div'))
                    .filter((node) => node instanceof HTMLElement && this.isVisible(node))
                    .filter((node) => /\(\d{6,}\)/.test(String(node.innerText || '')));
                let added = 0;
                overlays.forEach((panel) => {
                    const before = out.length;
                    const optionNodes = Array.from(panel.querySelectorAll(
                        'li, [role="option"], .next-menu-item, .next-select-menu-item, .mxgc-select-item, .mxgc-dropdown-item, span'
                    ));
                    this.collectPlansFromNodes(optionNodes, out, dedupe);
                    const lines = String(panel.innerText || '')
                        .split(/\n+/)
                        .map(line => this.normalizePlanName(line))
                        .filter(Boolean);
                    lines.forEach((line) => {
                        const plan = this.parsePlanFromText(line);
                        if (!plan) return;
                        this.pushPlan(out, dedupe, plan);
                    });
                    added += Math.max(0, out.length - before);
                });
                return added;
            };

            toggleEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            toggleEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            const baseline = out.length;
            for (let i = 0; i < 8; i++) {
                await this.sleep(120 + i * 40);
                const added = collectFromOverlay();
                if (added > 0 && out.length > baseline) break;
            }

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', bubbles: true }));
            await this.sleep(80);
        },

        async collectPlans(toggleEl) {
            const out = [];
            const dedupe = new Set();
            let spans = [];
            if (toggleEl instanceof Element) {
                spans = Array.from(toggleEl.querySelectorAll(':scope > span'));
                if (!spans.length) spans = Array.from(toggleEl.querySelectorAll('span'));
            }
            if (!spans.length) {
                spans = Array.from(document.querySelectorAll('[id^="toggle_mx_"] > span'));
            }
            this.collectPlansFromNodes(spans, out, dedupe);
            if (toggleEl instanceof Element) {
                const fromToggle = this.parsePlanFromText(toggleEl.textContent || '');
                this.pushPlan(out, dedupe, fromToggle);
            }

            if (!out.length && toggleEl instanceof Element) {
                const fallbackName = this.normalizePlanName(toggleEl.textContent || '');
                if (fallbackName && !/^(全部计划|全部|计划)$/i.test(fallbackName)) {
                    this.pushPlan(out, dedupe, {
                        planId: this.resolveCampaignIdFromNode(toggleEl),
                        planName: fallbackName
                    });
                }
            }

            if (toggleEl instanceof Element) {
                await this.collectPlansFromDropdown(toggleEl, out, dedupe);
            }

            return out;
        },

        mergePlans(...lists) {
            const out = [];
            const dedupe = new Set();
            lists.forEach((list) => {
                (Array.isArray(list) ? list : []).forEach((plan) => this.pushPlan(out, dedupe, plan));
            });
            return out;
        },

        resolveItemId(params, pair = {}) {
            const fromHash = this.normalizeItemId(params.get('itemId') || '');
            if (fromHash) return fromHash;
            const fromLocation = this.normalizeItemId(
                (String(window.location.href || '').match(/[?&]itemId=(\d{6,})/i) || [])[1]
            );
            if (fromLocation) return fromLocation;
            const fromToggle = this.normalizeItemId(
                pair?.toggle?.getAttribute?.('data-item-id')
                || pair?.toggle?.dataset?.itemId
                || ''
            );
            if (fromToggle) return fromToggle;
            const fromTrigger = this.normalizeItemId(
                pair?.trigger?.getAttribute?.('data-item-id')
                || pair?.trigger?.dataset?.itemId
                || ''
            );
            if (fromTrigger) return fromTrigger;
            return '';
        },

        resolveBizCode(params, pair = {}) {
            const fromHash = this.normalizeBizCode(params.get('bizCode') || '');
            if (fromHash) return fromHash;
            if (pair?.trigger instanceof Element) {
                const inferred = PlanIdentityUtils.inferBizCodeFromElement(pair.trigger);
                const normalized = this.normalizeBizCode(inferred);
                if (normalized) return normalized;
            }
            return PlanIdentityUtils.DEFAULT_BIZ_CODE;
        },

        setButtonState(btn, running, text = '') {
            if (!(btn instanceof HTMLButtonElement)) return;
            btn.disabled = !!running;
            btn.classList.toggle('is-running', !!running);
            const label = btn.querySelector('.am-potential-plan-export-label');
            const nextText = text || (running ? '导出中...' : '下载CSV');
            if (label instanceof HTMLElement) label.textContent = nextText;
            else btn.textContent = nextText;
            const input = btn.querySelector(this.DAYS_INPUT_SELECTOR);
            if (input instanceof HTMLInputElement) input.disabled = !!running;
        },

        removeButtons() {
            document.querySelectorAll(this.WRAP_SELECTOR).forEach((node) => node.remove());
            document.querySelectorAll(this.BUTTON_SELECTOR).forEach((node) => node.remove());
            document.querySelectorAll(this.DAYS_INPUT_SELECTOR).forEach((node) => node.remove());
        },

        resolveFilterAnchor() {
            const tables = Array.from(document.querySelectorAll('[id^="mx_"][id$="_table"]'))
                .filter((el) => el instanceof HTMLElement && this.isVisible(el));
            const tableScore = (el) => {
                const rect = el.getBoundingClientRect();
                const viewportMid = Math.max(0, window.innerHeight || document.documentElement.clientHeight || 0) * 0.5;
                return Math.abs(rect.top - viewportMid);
            };
            const sortedTables = tables.slice().sort((left, right) => tableScore(left) - tableScore(right));
            for (let i = 0; i < sortedTables.length; i++) {
                const table = sortedTables[i];
                const idText = String(table.id || '');
                const match = idText.match(/^mx_(\d+)_table$/);
                if (!match) continue;
                const filter = document.getElementById(`mx_${match[1]}_filter`);
                if (filter instanceof HTMLElement && this.isVisible(filter)) return filter;
            }
            const filters = Array.from(document.querySelectorAll('[id^="mx_"][id$="_filter"]'))
                .filter((el) => el instanceof HTMLElement && this.isVisible(el));
            if (!filters.length) return null;
            if (filters.length === 1) return filters[0];
            if (!tables.length) return filters[0];
            const firstTable = sortedTables[0];
            const tableRect = firstTable.getBoundingClientRect();
            return filters.slice().sort((left, right) => {
                const lRect = left.getBoundingClientRect();
                const rRect = right.getBoundingClientRect();
                const lScore = Math.abs(lRect.top - tableRect.top) * 10 + Math.abs(lRect.left - tableRect.left);
                const rScore = Math.abs(rRect.top - tableRect.top) * 10 + Math.abs(rRect.left - tableRect.left);
                return lScore - rScore;
            })[0];
        },

        buildButtonMount(pair = {}) {
            const filterAnchor = this.resolveFilterAnchor();
            if (filterAnchor instanceof HTMLElement) {
                const anchorId = String(filterAnchor.id || '').trim() || 'am-filter-dynamic';
                return {
                    anchor: filterAnchor,
                    mode: 'filter',
                    anchorId
                };
            }
            if (pair?.trigger instanceof HTMLElement) {
                const triggerId = String(pair.trigger.id || '').trim() || 'am-trigger-dynamic';
                const anchor = pair.trigger.parentElement instanceof HTMLElement
                    ? pair.trigger.parentElement
                    : pair.trigger;
                return {
                    anchor,
                    mode: 'trigger',
                    anchorId: triggerId
                };
            }
            return {
                anchor: null,
                mode: 'none',
                anchorId: ''
            };
        },

        normalizeExportDays(raw) {
            const text = String(raw ?? '').trim();
            if (!/^\d+$/.test(text)) return 0;
            const num = Number(text);
            if (!Number.isFinite(num)) return 0;
            const days = Math.floor(num);
            if (days < 1 || days > this.MAX_EXPORT_DAYS) return 0;
            return days;
        },

        getPreferredExportDays() {
            try {
                const saved = window.localStorage?.getItem?.(this.EXPORT_DAYS_STORAGE_KEY);
                const parsed = this.normalizeExportDays(saved);
                if (parsed) return parsed;
            } catch (_) { }
            return this.TARGET_DAYS;
        },

        savePreferredExportDays(days) {
            const normalized = this.normalizeExportDays(days);
            if (!normalized) return;
            try {
                window.localStorage?.setItem?.(this.EXPORT_DAYS_STORAGE_KEY, String(normalized));
            } catch (_) { }
        },

        resolveExportDaysFromButton(btn) {
            const wrap = btn instanceof Element ? btn.closest(this.WRAP_SELECTOR) : null;
            const input = wrap instanceof Element
                ? wrap.querySelector(this.DAYS_INPUT_SELECTOR)
                : null;
            const rawDays = input instanceof HTMLInputElement ? input.value : this.getPreferredExportDays();
            const days = this.normalizeExportDays(rawDays);
            if (!days) {
                throw new Error(`导出天数无效，请输入 1-${this.MAX_EXPORT_DAYS} 的整数`);
            }
            if (input instanceof HTMLInputElement) {
                input.value = String(days);
            }
            this.savePreferredExportDays(days);
            return days;
        },

        ensureMountWrap(mount) {
            if (!(mount?.anchor instanceof HTMLElement)) return null;
            let wrap = document.querySelector(`${this.WRAP_SELECTOR}[data-am-anchor-id="${mount.anchorId}"]`);
            if (!(wrap instanceof HTMLElement)) {
                wrap = document.createElement('span');
                wrap.className = 'am-potential-plan-export-wrap';
                wrap.setAttribute('data-am-potential-plan-export-wrap', '1');
                wrap.setAttribute('data-am-anchor-id', mount.anchorId);
                wrap.setAttribute('data-am-anchor-mode', mount.mode);
            } else {
                wrap.setAttribute('data-am-anchor-id', mount.anchorId);
                wrap.setAttribute('data-am-anchor-mode', mount.mode);
            }
            if (mount.mode === 'filter') {
                if (wrap.parentElement !== mount.anchor) {
                    mount.anchor.appendChild(wrap);
                }
            } else if (wrap.previousElementSibling !== mount.anchor) {
                mount.anchor.insertAdjacentElement('afterend', wrap);
            }
            return wrap;
        },

        ensureDaysInput(btn, mount) {
            if (!(btn instanceof HTMLButtonElement)) return null;
            let input = btn.querySelector(this.DAYS_INPUT_SELECTOR);
            if (!(input instanceof HTMLInputElement)) {
                input = document.createElement('input');
                input.type = 'number';
                input.min = '1';
                input.max = String(this.MAX_EXPORT_DAYS);
                input.step = '1';
                input.className = 'am-potential-plan-export-days-input';
                input.setAttribute('data-am-potential-plan-days', '1');
                btn.appendChild(input);
                const unit = document.createElement('span');
                unit.className = 'am-potential-plan-export-days-unit';
                unit.textContent = '天';
                btn.appendChild(unit);
                input.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
                input.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                });
                input.addEventListener('keydown', (e) => {
                    e.stopPropagation();
                });
            }
            input.setAttribute('data-am-anchor-id', mount.anchorId);
            input.setAttribute('data-am-anchor-mode', mount.mode);
            const current = this.normalizeExportDays(input.value);
            if (!current) {
                input.value = String(this.getPreferredExportDays());
            }
            const unit = btn.querySelector('.am-potential-plan-export-days-unit');
            const label = btn.querySelector('.am-potential-plan-export-label');
            if (unit instanceof HTMLElement && label instanceof HTMLElement) {
                if (input.nextSibling !== unit) btn.insertBefore(unit, input.nextSibling);
                if (unit.nextSibling !== label) btn.insertBefore(label, unit.nextSibling);
            }
            return input;
        },

        ensureButtonElement(wrap, mount) {
            if (!(wrap instanceof HTMLElement)) return null;
            let btn = wrap.querySelector(this.BUTTON_SELECTOR);
            if (!(btn instanceof HTMLButtonElement)) {
                btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'am-potential-plan-export-btn';
                btn.setAttribute('data-am-potential-plan-export', '1');
                wrap.appendChild(btn);
            }
            btn.setAttribute('data-am-anchor-id', mount.anchorId);
            btn.setAttribute('data-am-anchor-mode', mount.mode);
            Array.from(btn.childNodes).forEach((node) => {
                if (node.nodeType === 3 && String(node.textContent || '').trim()) node.remove();
            });
            let label = btn.querySelector('.am-potential-plan-export-label');
            if (!(label instanceof HTMLElement)) {
                label = document.createElement('span');
                label.className = 'am-potential-plan-export-label';
                label.textContent = '下载CSV';
                btn.appendChild(label);
            }
            return btn;
        },

        ensureButton() {
            const pair = this.findToggleTriggerPair();
            const mount = this.buildButtonMount(pair);
            if (!(mount.anchor instanceof HTMLElement)) {
                this.removeButtons();
                return;
            }
            const wrap = this.ensureMountWrap(mount);
            const btn = this.ensureButtonElement(wrap, mount);
            this.ensureDaysInput(btn, mount);
            if (!this.running) this.setButtonState(btn, false);
            document.querySelectorAll(this.WRAP_SELECTOR).forEach((node) => {
                if (!(node instanceof HTMLElement)) return;
                if (node === wrap) return;
                node.remove();
            });
            document.querySelectorAll(this.BUTTON_SELECTOR).forEach((node) => {
                if (!(node instanceof HTMLButtonElement)) return;
                if (node === btn) return;
                node.remove();
            });
        },

        run() {
            if (window.top !== window.self) return;
            if (!document.body) return;
            if (!this.isTargetPage()) {
                this.removeButtons();
                return;
            }
            this.ensureButton();
        },

        buildDateRange(days = this.TARGET_DAYS) {
            const total = Math.max(1, Number(days) || this.TARGET_DAYS);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const list = [];
            for (let i = total - 1; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                list.push(PlanIdentityUtils.formatDateYmd(d));
            }
            return list;
        },

        normalizeKey(raw) {
            return String(raw || '').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');
        },

        flattenPrimitives(source, options = {}) {
            const out = {};
            const maxDepth = Math.max(1, Math.min(8, Number(options.maxDepth) || 3));
            const seen = options.seen instanceof WeakSet ? options.seen : new WeakSet();
            const walk = (node, prefix, depth) => {
                if (node === undefined || node === null) return;
                if (depth > maxDepth) return;
                if (typeof node !== 'object') {
                    out[prefix || 'value'] = node;
                    return;
                }
                if (seen.has(node)) return;
                seen.add(node);
                if (Array.isArray(node)) {
                    if (!node.length) return;
                    if (depth >= maxDepth) return;
                    node.slice(0, 5).forEach((item, index) => {
                        walk(item, `${prefix}[${index}]`, depth + 1);
                    });
                    return;
                }
                const keys = Object.keys(node).slice(0, 80);
                if (!keys.length) return;
                keys.forEach((key) => {
                    const nextPrefix = prefix ? `${prefix}.${key}` : key;
                    walk(node[key], nextPrefix, depth + 1);
                });
            };
            walk(source, '', 0);
            return out;
        },

        getValueByAliases(flatMap, aliases = []) {
            if (!flatMap || typeof flatMap !== 'object') return '';
            const entries = Object.entries(flatMap);
            if (!entries.length) return '';
            const normalizedEntries = entries.map(([key, value]) => ({ key: this.normalizeKey(key), value }));
            for (let i = 0; i < aliases.length; i++) {
                const alias = this.normalizeKey(aliases[i]);
                if (!alias) continue;
                const exact = normalizedEntries.find((item) => item.key === alias);
                if (exact) return exact.value;
                const suffix = normalizedEntries.find((item) => item.key.endsWith(alias));
                if (suffix) return suffix.value;
            }
            return '';
        },

        normalizeDateValue(raw, fallback = '') {
            const text = String(raw || '').trim();
            if (!text) return fallback;
            const ymdMatch = text.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
            if (ymdMatch) {
                const y = ymdMatch[1];
                const m = String(ymdMatch[2]).padStart(2, '0');
                const d = String(ymdMatch[3]).padStart(2, '0');
                return `${y}-${m}-${d}`;
            }
            const plainMatch = text.match(/^(\d{4})(\d{2})(\d{2})$/);
            if (plainMatch) return `${plainMatch[1]}-${plainMatch[2]}-${plainMatch[3]}`;
            const maybeTs = Number(text);
            if (Number.isFinite(maybeTs) && maybeTs > 100000) {
                const d = new Date(maybeTs > 1000000000000 ? maybeTs : maybeTs * 1000);
                if (!Number.isNaN(d.getTime())) return PlanIdentityUtils.formatDateYmd(d);
            }
            const date = new Date(text);
            if (!Number.isNaN(date.getTime())) return PlanIdentityUtils.formatDateYmd(date);
            return fallback;
        },

        parseMetricRow(row, fallbackDate, bizCode) {
            const flat = this.flattenPrimitives(row, { maxDepth: 3 });
            const planId = this.normalizeCampaignId(this.getValueByAliases(flat, [
                'campaignId', 'campaign_id', 'planId', 'plan_id', 'id'
            ]));
            const planName = this.normalizePlanName(this.getValueByAliases(flat, [
                'campaignName', 'campaign_name', 'planName', 'plan_name', 'name', 'title'
            ]));
            const date = this.normalizeDateValue(this.getValueByAliases(flat, [
                'rptDate', 'reportDate', 'statDate', 'date', 'day', 'ds', 'dt'
            ]), fallbackDate);

            const pickMetric = (...aliases) => this.getValueByAliases(flat, aliases);
            return {
                date: date || fallbackDate,
                planId,
                planName,
                bizCode,
                charge: pickMetric('charge', 'cost', 'consume', 'spend'),
                click: pickMetric('click', 'clickNum', 'clickCnt'),
                imp: pickMetric('impression', 'imp', 'show', 'pv', 'display'),
                ctr: pickMetric('ctr', 'clickRate'),
                cpc: pickMetric('cpc'),
                cpm: pickMetric('cpm'),
                ecpc: pickMetric('ecpc'),
                roi: pickMetric('roi', 'roi3', 'roi7', 'payRoi'),
                cartNum: pickMetric('cartNum', 'collectCartNum', 'cartCount'),
                transactionNum: pickMetric('transactionNum', 'tradeNum', 'orderNum'),
                gmv: pickMetric('gmv', 'transactionAmount', 'tradeAmount')
            };
        },

        collectArrayCandidates(node, out, depth = 0, seen = new WeakSet()) {
            if (!node || typeof node !== 'object' || depth > 8) return;
            if (seen.has(node)) return;
            seen.add(node);

            if (Array.isArray(node)) {
                if (node.length && node.some(item => item && typeof item === 'object' && !Array.isArray(item))) {
                    out.push(node);
                }
                node.slice(0, 30).forEach((item) => this.collectArrayCandidates(item, out, depth + 1, seen));
                return;
            }
            Object.keys(node).slice(0, 80).forEach((key) => {
                this.collectArrayCandidates(node[key], out, depth + 1, seen);
            });
        },

        scoreRow(row) {
            if (!row || typeof row !== 'object') return 0;
            const flat = this.flattenPrimitives(row, { maxDepth: 2 });
            const keys = Object.keys(flat).map(key => this.normalizeKey(key));
            if (!keys.length) return 0;
            let score = 0;
            if (keys.some(key => key.endsWith('campaignid') || key.endsWith('planid'))) score += 8;
            if (keys.some(key => key.endsWith('campaignname') || key.endsWith('planname') || key.endsWith('title') || key === 'name')) score += 6;
            if (keys.some(key => key.endsWith('rptdate') || key.endsWith('reportdate') || key.endsWith('statdate') || key === 'date' || key === 'day')) score += 2;
            if (keys.some(key => key.endsWith('charge') || key.endsWith('cost') || key.endsWith('consume'))) score += 3;
            if (keys.some(key => key.endsWith('click'))) score += 2;
            if (keys.some(key => key.endsWith('roi'))) score += 2;
            if (keys.some(key => key.endsWith('ecpc'))) score += 1;
            return score;
        },

        extractCampaignMetricRows(payload, fallbackDate, bizCode) {
            const list = payload?.data?.list;
            if (!Array.isArray(list) || !list.length) return [];
            const out = [];
            const pick = (primary, secondary, fallback = '0') => {
                if (primary !== undefined && primary !== null && primary !== '') return primary;
                if (secondary !== undefined && secondary !== null && secondary !== '') return secondary;
                return fallback;
            };
            list.forEach((campaign) => {
                if (!campaign || typeof campaign !== 'object') return;
                const reportList = Array.isArray(campaign.reportInfoList) ? campaign.reportInfoList : [];
                const report = reportList.find((item) => item && typeof item === 'object') || {};
                const planId = this.normalizeCampaignId(
                    campaign.campaignId
                    || report.campaignId
                    || report.planId
                    || report.campaign_id
                    || report.plan_id
                    || ''
                );
                const planName = this.normalizePlanName(
                    campaign.campaignName
                    || report.campaignName
                    || report.planName
                    || report.campaign_name
                    || report.plan_name
                    || ''
                );
                if (!planId && !planName) return;
                out.push({
                    date: this.normalizeDateValue(
                        report.rptDate || report.reportDate || report.statDate || report.date || report.day || fallbackDate,
                        fallbackDate
                    ),
                    planId,
                    planName,
                    bizCode: this.normalizeBizCode(campaign.bizCode || report.bizCode || bizCode)
                        || PlanIdentityUtils.DEFAULT_BIZ_CODE,
                    charge: pick(report.charge, campaign.charge),
                    click: pick(report.click, campaign.click),
                    imp: pick(
                        report.imp ?? report.impression ?? report.show ?? report.pv,
                        campaign.imp ?? campaign.impression ?? campaign.show ?? campaign.pv
                    ),
                    ctr: pick(report.ctr ?? report.clickRate, campaign.ctr ?? campaign.clickRate),
                    cpc: pick(report.cpc, campaign.cpc),
                    cpm: pick(report.cpm, campaign.cpm),
                    ecpc: pick(report.ecpc, campaign.ecpc),
                    roi: pick(
                        report.roi ?? report.roi3 ?? report.roi7 ?? report.payRoi,
                        campaign.roi ?? campaign.roi3 ?? campaign.roi7 ?? campaign.payRoi
                    ),
                    cartNum: pick(report.cartNum ?? report.collectCartNum, campaign.cartNum ?? campaign.collectCartNum),
                    transactionNum: pick(
                        report.transactionNum ?? report.tradeNum ?? report.orderNum,
                        campaign.transactionNum ?? campaign.tradeNum ?? campaign.orderNum
                    ),
                    gmv: pick(
                        report.gmv ?? report.transactionAmount ?? report.tradeAmount,
                        campaign.gmv ?? campaign.transactionAmount ?? campaign.tradeAmount
                    )
                });
            });
            return out;
        },

        extractMetricRows(payload, fallbackDate, bizCode) {
            const campaignRows = this.extractCampaignMetricRows(payload, fallbackDate, bizCode);
            if (campaignRows.length) return campaignRows;
            const arrays = [];
            this.collectArrayCandidates(payload, arrays, 0, new WeakSet());
            if (!arrays.length) return [];
            let best = null;
            let bestScore = -1;
            arrays.forEach((arr) => {
                const sample = arr.slice(0, 20);
                if (!sample.length) return;
                const avgScore = sample.reduce((sum, row) => sum + this.scoreRow(row), 0) / sample.length;
                const totalScore = avgScore + Math.min(arr.length, 50) * 0.01;
                if (totalScore > bestScore) {
                    bestScore = totalScore;
                    best = arr;
                }
            });
            if (!best || bestScore < 2) return [];
            return best
                .map((row) => this.parseMetricRow(row, fallbackDate, bizCode))
                .filter((row) => row.planId || row.planName);
        },

        async postPotentialApi(action, bizCode, authContext, payload = {}) {
            const normalizedBizCode = this.normalizeBizCode(bizCode) || PlanIdentityUtils.DEFAULT_BIZ_CODE;
            const csrfId = String(authContext?.csrfId || '');
            const loginPointId = String(authContext?.loginPointId || '');
            const url = OneApiTransport.buildOneUrl(`/potential/bidword/${action}.json`, {
                csrfId,
                bizCode: normalizedBizCode
            });
            const body = {
                bizCode: normalizedBizCode,
                ...payload,
                csrfId,
                loginPointId
            };
            return OneApiTransport.postJson(url, body, {
                headers: {
                    Accept: 'application/json, text/javascript, */*; q=0.01',
                    'Content-Type': 'application/json'
                },
                actionName: `${action} 请求失败`,
                businessErrorMessage: `${action} 响应异常`
            });
        },

        async queryPotentialCampaignList(startDate, endDate, bizCode, authContext) {
            const json = await this.postPotentialApi('findCampaignList', bizCode, authContext, {
                startTime: startDate,
                endTime: endDate
            });
            const list = Array.isArray(json?.data?.list) ? json.data.list : [];
            return list.map((item) => ({
                planId: this.normalizeCampaignId(item?.campaignId || item?.planId || ''),
                planName: this.normalizePlanName(item?.campaignName || item?.planName || '')
            })).filter((item) => item.planId && item.planName);
        },

        async queryPotentialAdgroupList(planId, startDate, endDate, bizCode, authContext) {
            const normalizedPlanId = this.normalizeCampaignId(planId);
            if (!normalizedPlanId) return [];
            const json = await this.postPotentialApi('findAdgroupList', bizCode, authContext, {
                campaignId: Number(normalizedPlanId),
                startTime: startDate,
                endTime: endDate
            });
            const list = Array.isArray(json?.data?.list) ? json.data.list : [];
            return list.map((item) => ({
                adgroupId: this.normalizeCampaignId(item?.adgroupId || ''),
                adgroupName: this.normalizePlanName(item?.adgroupName || '')
            })).filter((item) => item.adgroupId || item.adgroupName);
        },

        async queryPotentialTableRows(planId, adgroupId, dateYmd, bizCode, authContext) {
            const normalizedPlanId = this.normalizeCampaignId(planId);
            const normalizedAdgroupId = this.normalizeCampaignId(adgroupId);
            if (!normalizedPlanId || !normalizedAdgroupId) return [];
            const json = await this.postPotentialApi('findList', bizCode, authContext, {
                startTime: dateYmd,
                endTime: dateYmd,
                campaignId: Number(normalizedPlanId),
                adgroupId: Number(normalizedAdgroupId),
                queryFieldIn: this.TABLE_QUERY_FIELDS.slice()
            });
            return Array.isArray(json?.data?.list) ? json.data.list : [];
        },

        parsePotentialKeywordRow(row, context = {}) {
            return {
                date: context.date || '',
                planId: this.normalizeCampaignId(context.planId || ''),
                planName: this.normalizePlanName(context.planName || ''),
                adgroupId: this.normalizeCampaignId(context.adgroupId || ''),
                adgroupName: this.normalizePlanName(context.adgroupName || ''),
                keyword: this.normalizePlanName(row?.originalWord || ''),
                potentialIndex: row?.potentialIndex ?? '',
                adPv: row?.adPv ?? '',
                click: row?.click ?? '',
                ctr: row?.ctr ?? '',
                ecpc: row?.ecpc ?? '',
                charge: row?.charge ?? '',
                itemColInshopNum: row?.itemColInshopNum ?? '',
                cartInshopNum: row?.cartInshopNum ?? '',
                shopColDirNum: row?.shopColDirNum ?? '',
                colCartNum: row?.colCartNum ?? '',
                cvr: row?.cvr ?? '',
                roi: row?.roi ?? ''
            };
        },

        buildEmptyPotentialKeywordRow(plan = {}, dateYmd = '', adgroup = {}) {
            return {
                date: dateYmd,
                planId: this.normalizeCampaignId(plan?.planId || ''),
                planName: this.normalizePlanName(plan?.planName || ''),
                adgroupId: this.normalizeCampaignId(adgroup?.adgroupId || ''),
                adgroupName: this.normalizePlanName(adgroup?.adgroupName || ''),
                keyword: '',
                potentialIndex: '0',
                adPv: '0',
                click: '0',
                ctr: '0',
                ecpc: '0',
                charge: '0',
                itemColInshopNum: '0',
                cartInshopNum: '0',
                shopColDirNum: '0',
                colCartNum: '0',
                cvr: '0',
                roi: '0'
            };
        },

        sortPotentialKeywordRows(rows = []) {
            return (Array.isArray(rows) ? rows.slice() : []).sort((left, right) => {
                const d1 = String(left?.date || '');
                const d2 = String(right?.date || '');
                if (d1 !== d2) return d1.localeCompare(d2);
                const p1 = this.normalizePlanName(left?.planName || '');
                const p2 = this.normalizePlanName(right?.planName || '');
                if (p1 !== p2) return p1.localeCompare(p2);
                const g1 = this.normalizePlanName(left?.adgroupName || '');
                const g2 = this.normalizePlanName(right?.adgroupName || '');
                if (g1 !== g2) return g1.localeCompare(g2);
                const k1 = this.normalizePlanName(left?.keyword || '');
                const k2 = this.normalizePlanName(right?.keyword || '');
                return k1.localeCompare(k2);
            });
        },

        toPotentialKeywordCsv(rows = []) {
            const columns = [
                { key: 'date', title: '日期' },
                { key: 'planId', title: '计划ID' },
                { key: 'planName', title: '计划名称' },
                { key: 'adgroupId', title: '单元ID' },
                { key: 'adgroupName', title: '单元名称' },
                { key: 'keyword', title: '关键词' },
                { key: 'potentialIndex', title: '潜力指数' },
                { key: 'adPv', title: '展现量' },
                { key: 'click', title: '点击量' },
                { key: 'ctr', title: '点击率' },
                { key: 'ecpc', title: '平均点击花费' },
                { key: 'charge', title: '花费' },
                { key: 'itemColInshopNum', title: '收藏宝贝数' },
                { key: 'cartInshopNum', title: '总购物车数' },
                { key: 'shopColDirNum', title: '店铺收藏数' },
                { key: 'colCartNum', title: '总收藏加购数' },
                { key: 'cvr', title: '点击转化率' },
                { key: 'roi', title: '投入产出比' }
            ];
            const lines = [columns.map((item) => this.escapeCsvCell(item.title)).join(',')];
            this.sortPotentialKeywordRows(rows).forEach((row) => {
                const line = columns.map((item) => this.escapeCsvCell(row?.[item.key] ?? '')).join(',');
                lines.push(line);
            });
            return lines.join('\n');
        },

        async queryDailyMetrics(itemId, bizCode, dateYmd, authContext) {
            const normalizedItemId = this.normalizeItemId(itemId);
            if (!normalizedItemId) throw new Error('itemId 无效，无法查询计划数据');
            const normalizedBizCode = this.normalizeBizCode(bizCode) || PlanIdentityUtils.DEFAULT_BIZ_CODE;
            const url = OneApiTransport.buildOneUrl('/campaign/horizontal/findPage.json', {
                csrfId: String(authContext?.csrfId || ''),
                bizCode: normalizedBizCode
            });
            const pageSize = 200;
            const maxRounds = 20;
            const merged = [];
            const pageFingerprints = new Set();
            for (let round = 0; round < maxRounds; round++) {
                const payload = {
                    mx_bizCode: normalizedBizCode,
                    bizCode: normalizedBizCode,
                    offset: round * pageSize,
                    pageSize,
                    orderField: '',
                    orderBy: '',
                    queryRuleAuto: '1',
                    adgroupRequired: true,
                    adzoneRequired: false,
                    itemId: Number(normalizedItemId),
                    rptQuery: {
                        fields: 'charge,click,ecpc,roi',
                        conditionList: [{
                            sourceList: ['scene', 'campaign_list'],
                            adzonePkgIdList: [],
                            effectEqual: '15',
                            unifyType: 'last_click_by_effect_time',
                            startTime: dateYmd,
                            endTime: dateYmd,
                            isRt: false
                        }]
                    },
                    csrfId: String(authContext?.csrfId || ''),
                    loginPointId: String(authContext?.loginPointId || '')
                };
                const json = await OneApiTransport.postJson(url, payload, {
                    actionName: `查询${dateYmd}计划数据失败`,
                    businessErrorMessage: `查询${dateYmd}计划数据失败`
                });
                const rows = this.extractMetricRows(json, dateYmd, normalizedBizCode);
                if (!rows.length) break;
                merged.push(...rows);
                const fingerprint = rows.slice(0, 6)
                    .map((row) => `${row.planId || '-'}:${this.normalizePlanNameLoose(row.planName || '-')}`)
                    .join('|');
                if (fingerprint && pageFingerprints.has(fingerprint)) break;
                if (fingerprint) pageFingerprints.add(fingerprint);
                if (rows.length < pageSize) break;
            }
            const uniqueMap = new Map();
            merged.forEach((row) => {
                const key = `${row.date || dateYmd}|${row.planId || '-'}|${this.normalizePlanNameLoose(row.planName || '-')}`;
                if (!uniqueMap.has(key)) uniqueMap.set(key, row);
            });
            const out = Array.from(uniqueMap.values());
            if (merged.length && !out.length) {
                return merged;
            }
            return out;
        },

        buildFileName(itemId, days) {
            const stamp = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            const ts = `${stamp.getFullYear()}${pad(stamp.getMonth() + 1)}${pad(stamp.getDate())}_${pad(stamp.getHours())}${pad(stamp.getMinutes())}${pad(stamp.getSeconds())}`;
            const dayPart = this.normalizeExportDays(days) || this.TARGET_DAYS;
            return `potential_plan_daily_${itemId || 'unknown'}_${dayPart}d_${ts}.csv`;
        },

        downloadCsv(content, filename) {
            const blob = new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
                URL.revokeObjectURL(link.href);
                link.remove();
            }, 0);
        },

        async exportCsv(btn) {
            if (this.running) {
                Logger.log('⏳ CSV 导出进行中，请稍候', true);
                return;
            }
            const exportDays = this.resolveExportDaysFromButton(btn);
            this.running = true;
            this.setButtonState(btn, true, '导出中...');
            try {
                const pair = this.findToggleTriggerPair();
                const params = this.parseHashParams();
                const itemId = this.resolveItemId(params, pair);
                if (!itemId) {
                    throw new Error('未识别到 itemId，请确认 URL 中存在 itemId 参数');
                }
                const bizCode = this.resolveBizCode(params, pair);
                const authContext = PlanIdentityUtils.resolveAuthContext(bizCode);
                const dateList = this.buildDateRange(exportDays);
                const rangeStart = dateList[0];
                const rangeEnd = dateList[dateList.length - 1];

                const domPlans = await this.collectPlans(pair.toggle);
                const apiPlans = await this.queryPotentialCampaignList(rangeStart, rangeEnd, bizCode, authContext);
                let plans = this.mergePlans(apiPlans, domPlans)
                    .filter((item) => this.normalizeCampaignId(item?.planId || ''));
                const planById = new Map();
                plans.forEach((item) => {
                    const id = this.normalizeCampaignId(item?.planId || '');
                    const name = this.normalizePlanName(item?.planName || '');
                    if (!id || !name) return;
                    if (!planById.has(id)) planById.set(id, { planId: id, planName: name });
                });
                plans = Array.from(planById.values());
                if (!plans.length) {
                    throw new Error('未获取到潜力词表格对应的计划列表');
                }

                const adgroupsByPlanId = new Map();
                for (let i = 0; i < plans.length; i++) {
                    const plan = plans[i];
                    this.setButtonState(btn, true, `准备计划(${i + 1}/${plans.length})`);
                    const adgroups = await this.queryPotentialAdgroupList(
                        plan.planId,
                        rangeStart,
                        rangeEnd,
                        bizCode,
                        authContext
                    );
                    adgroupsByPlanId.set(plan.planId, adgroups);
                }

                let rows = [];
                const totalSteps = Math.max(1, plans.length * dateList.length);
                for (let pIndex = 0; pIndex < plans.length; pIndex++) {
                    const plan = plans[pIndex];
                    const adgroups = adgroupsByPlanId.get(plan.planId) || [];
                    for (let dIndex = 0; dIndex < dateList.length; dIndex++) {
                        const dateYmd = dateList[dIndex];
                        const step = pIndex * dateList.length + dIndex + 1;
                        this.setButtonState(btn, true, `导出中(${step}/${totalSteps})`);
                        const dayRows = [];
                        for (let gIndex = 0; gIndex < adgroups.length; gIndex++) {
                            const adgroup = adgroups[gIndex];
                            const tableRows = await this.queryPotentialTableRows(
                                plan.planId,
                                adgroup.adgroupId,
                                dateYmd,
                                bizCode,
                                authContext
                            );
                            tableRows.forEach((row) => {
                                dayRows.push(this.parsePotentialKeywordRow(row, {
                                    date: dateYmd,
                                    planId: plan.planId,
                                    planName: plan.planName,
                                    adgroupId: adgroup.adgroupId,
                                    adgroupName: adgroup.adgroupName
                                }));
                            });
                        }
                        if (!dayRows.length) {
                            dayRows.push(this.buildEmptyPotentialKeywordRow(plan, dateYmd, adgroups[0] || {}));
                        }
                        rows = rows.concat(dayRows);
                    }
                }

                if (!rows.length) {
                    throw new Error(`近${exportDays}天未获取到可导出的表格日维度数据`);
                }

                const csv = this.toPotentialKeywordCsv(rows);
                const filename = this.buildFileName(itemId, exportDays);
                this.downloadCsv(csv, filename);
                Logger.log(`✅ 表格日维度 CSV 已生成：${filename}（${exportDays}天，${rows.length} 行）`);
            } finally {
                this.running = false;
                this.setButtonState(btn, false, '下载CSV');
            }
        }
    };

