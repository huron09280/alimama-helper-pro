    const CampaignIdQuickEntry = {
        initialized: false,
        runningCampaignIds: new Set(),
        runningCopyKeys: new Set(),
        copyPlanNameCache: new Set(),
        copyPlanNameCacheLimit: 120,
        batchPlusMenuEl: null,
        batchPlusMenuCloseTimer: null,
        batchPlusMenuCloseVisibilityHandler: null,
        campaignListRefreshTimer: null,
        copyFocusRestoreTimer: null,
        concurrentLogPopup: null,
        concurrentLogTitleEl: null,
        concurrentLogStatusEl: null,
        concurrentLogBodyEl: null,
        concurrentLogFocusBackEl: null,
        concurrentLogKeydownHandler: null,
        campaignItemIdCache: new Map(),
        campaignItemCacheLimit: 240,
        IGNORE_SELECTOR: '#am-helper-panel, #am-magic-report-popup, #alimama-escort-helper-ui, #am-report-capture-panel, #am-campaign-concurrent-log-popup, #am-campaign-copy-overview-popup, #am-campaign-copy-success-popup, #am-campaign-batch-plus-menu, #am-campaign-batch-confirm-popup',
        TEXT_PATTERN: /计划\s*(?:ID|id)?\s*[：:]\s*(\d{6,})/g,
        DEFAULT_BIZ_CODE: 'onebpSearch',
        BIZ_CODE_LIST: ['onebpSearch', 'onebpSite', 'onebpAdStrategyLiuZi', 'onebpDisplay'],
        MAX_START_RETRIES: 6,
        RETRY_DELAY_MS: 450,
        MAX_SITE_CUSTOM_BREAKTHROUGH_ROUNDS: 3,
        SITE_CUSTOM_CONFLICT_RE: /(onebpsite-existed|horizontal-onebpsite-existed|diffbizcode-existed|存在在投计划|在投计划|持续推广计划|冲突|已存在.*计划|计划已存在|already.*exist|conflict)/i,
        ICON_SVG: renderAmIcon('campaign-query', { size: 14, strokeWidth: 2.1 }),
        CONCURRENT_START_ICON_SVG: renderAmIcon('campaign-concurrent-start', { size: 14, strokeWidth: 2.1 }),
        COPY_ICON_SVG: renderAmIcon('campaign-copy', { size: 14, strokeWidth: 2.1 }),

        init() {
            if (window.top !== window.self) return;
            if (this.initialized) return;
            document.addEventListener('click', (e) => {
                const target = e.target;
                if (!(target instanceof Element)) return;

                const batchPlusItem = target.closest('[data-am-campaign-batch-plus-action]');
                if (batchPlusItem) {
                    e.preventDefault();
                    e.stopPropagation();

                    const action = String(batchPlusItem.getAttribute('data-am-campaign-batch-plus-action') || '').trim();
                    const bizCode = this.normalizeBizCode(batchPlusItem.getAttribute('data-biz-code') || batchPlusItem.dataset?.bizCode || '');
                    const focusBackTarget = this.getOpenBatchPlusTrigger();
                    this.closeBatchPlusMenu();
                    this.runBatchPlusAction(action, bizCode, focusBackTarget || batchPlusItem).catch((err) => {
                        Logger.log(`⚠️ 批量+执行失败：${err?.message || '未知错误'} `, true);
                    });
                    return;
                }

                const batchPlusBtn = target.closest('[data-am-campaign-batch-plus="1"]');
                if (batchPlusBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.cancelBatchPlusMenuClose();
                    this.showBatchPlusMenu(batchPlusBtn);
                    return;
                }

                if (!target.closest('#am-campaign-batch-plus-menu')) {
                    this.closeBatchPlusMenu();
                }

                const quickBtn = target.closest('.am-campaign-search-btn[data-am-campaign-quick="1"]');
                if (quickBtn) {
                    e.preventDefault();
                    e.stopPropagation();

                    const id = this.normalizeCampaignId(quickBtn.getAttribute('data-campaign-id') || quickBtn.dataset.campaignId);
                    if (!id) {
                        Logger.log('⚠️ 计划ID无效，已忽略快捷查数', true);
                        return;
                    }

                    const guessedName = MagicReport.guessCampaignNameById(id, quickBtn);
                    if (guessedName) {
                        MagicReport.lastCampaignName = guessedName;
                    }

                    MagicReport.openWithCampaignId(id, { preferNative: false, promptType: 'click' }).catch((err) => {
                        Logger.log(`⚠️ 快捷查数失败：${err?.message || '未知错误'} `, true);
                    });
                    return;
                }

                const copyCountBadge = target.closest('[data-am-campaign-copy-count-badge]');
                if (copyCountBadge) {
                    const copyButton = copyCountBadge.closest('.am-campaign-search-btn[data-am-campaign-copy]');
                    if (copyButton instanceof HTMLButtonElement) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.adjustCopyBatchCount(copyButton, 1);
                    }
                    return;
                }

                const copyBtn = target.closest('.am-campaign-search-btn[data-am-campaign-copy]');
                if (copyBtn) {
                    e.preventDefault();
                    e.stopPropagation();

                    const id = this.normalizeCampaignId(copyBtn.getAttribute('data-campaign-id') || copyBtn.dataset.campaignId);
                    if (!id) {
                        Logger.log('⚠️ 计划ID无效，已忽略复制计划', true);
                        return;
                    }
                    const copyMode = this.normalizeCopyMode(copyBtn.getAttribute('data-am-campaign-copy') || copyBtn.dataset.amCampaignCopy);
                    const copyKey = id;
                    const label = this.getCopyModeLabel(copyMode);
                    const copyCount = this.readCopyBatchCount(copyBtn);
                    if (this.runningCopyKeys.has(copyKey)) {
                        Logger.log(`⏳ 复制计划进行中：${id} `);
                        return;
                    }
                    this.runningCopyKeys.add(copyKey);
                    this.setCopyButtonRunning(id, copyMode, true);
                    this.runCopyCurrentPlanFlow(id, copyBtn, copyMode, { copyCount }).then((result) => {
                        const copySource = result?.copySource || {};
                        const newPlanNames = this.normalizePlanNameList(copySource.newPlanNames || copySource.newPlanName || []);
                        const newPlanText = this.formatPlanNameListForLog(newPlanNames);
                        const statusText = copySource.targetStatus === 'pause' ? '暂停' : (copySource.targetOnlineStatus === 1 ? '开启' : '暂停');
                        const successCount = Number(result?.successCount || 0);
                        const failCount = Number(result?.failCount || 0);
                        this.rememberCopiedPlanNames(newPlanNames);
                        Logger.log(`✅ ${label}完成：已复制计划 ${newPlanNames.length || copyCount} 个（保留源计划），源计划${id}，新计划${newPlanText}，目标状态=${statusText}，成功=${successCount}，失败=${failCount}`);
                        this.showCopySuccessDialogAndRefresh(result, {
                            campaignId: id,
                            sourceCampaignId: id,
                            label,
                            mode: copyMode,
                            copyCount,
                            statusText,
                            triggerEl: copyBtn
                        });
                    }).catch((err) => {
                        if (err?.cancelled || err?.code === 'copy_preview_cancelled') {
                            Logger.log(`📋 ${label}已取消：源计划${id}`);
                            return;
                        }
                        Logger.log(`⚠️ ${label}失败：源计划${id}，原因：${err?.message || '未知错误'} `, true);
                    }).finally(() => {
                        this.runningCopyKeys.delete(copyKey);
                        this.setCopyButtonRunning(id, copyMode, false);
                    });
                    return;
                }

                const concurrentBtn = target.closest('.am-campaign-search-btn[data-am-campaign-concurrent-start="1"]');
                if (!concurrentBtn) return;

                e.preventDefault();
                e.stopPropagation();

                const id = this.normalizeCampaignId(concurrentBtn.getAttribute('data-campaign-id') || concurrentBtn.dataset.campaignId);
                if (!id) {
                    Logger.log('⚠️ 计划ID无效，已忽略并发开启', true);
                    return;
                }
                const itemId = this.inferItemIdFromElement(concurrentBtn, {
                    allowLocationFallback: false,
                    allowBodyFallback: false
                });
                this.openConcurrentLogPopup(id, itemId, concurrentBtn);
                this.appendConcurrentLog(`收到并发开启指令：计划${id}${itemId ? ` / 商品${itemId}` : ''}`);
                if (this.runningCampaignIds.has(id)) {
                    Logger.log(`⏳ 并发开启进行中：${id} `);
                    this.appendConcurrentLog(`并发开启已在执行中：计划${id}`, 'warn');
                    return;
                }
                this.runningCampaignIds.add(id);
                this.setConcurrentButtonRunning(id, true);
                this.runConcurrentStartFlow(id, concurrentBtn).then((result) => {
                    const restartTargets = Array.isArray(result?.targets) ? result.targets : [];
                    const allTargets = Array.isArray(result?.allTargets) ? result.allTargets : restartTargets;
                    const mandatorySiteTargets = Array.isArray(result?.mandatorySiteTargets) ? result.mandatorySiteTargets : [];
                    const pairText = restartTargets
                        .map(item => `${item.campaignId}@${item.bizCode}`)
                        .join(' + ');
                    const scopeText = `（同商品共${allTargets.length || restartTargets.length}个，货品全站必开${mandatorySiteTargets.length}个，实际重开${restartTargets.length}个）`;
                    const verifyText = result?.mode === 'request_only'
                        ? '（状态接口未返回明确结果，按接口成功处理）'
                        : (result?.mode === 'site_custom_breakthrough' ? '（已触发全站+自定义同开突破策略）' : '');
                    Logger.log(`✅ 并发开启完成(第${result?.attempt || 1}次)${scopeText}：${pairText}${verifyText}`);
                    this.appendConcurrentLog(`并发开启完成：${scopeText}，目标=${pairText || '-'}`, 'success');
                    this.setConcurrentLogStatus(`执行成功：第${result?.attempt || 1}次即完成`, 'success');
                }).catch((err) => {
                    Logger.log(`⚠️ 并发开启失败：${err?.message || '未知错误'} `, true);
                    this.appendConcurrentLog(`并发开启失败：${err?.message || '未知错误'}`, 'error');
                    this.setConcurrentLogStatus(`执行失败：${err?.message || '未知错误'}`, 'error');
                }).finally(() => {
                    this.runningCampaignIds.delete(id);
                    this.setConcurrentButtonRunning(id, false);
                });
            }, true);

            document.addEventListener('mouseover', (e) => {
                const target = e.target;
                if (!(target instanceof Element)) return;

                const trigger = target.closest('[data-am-campaign-batch-plus="1"]');
                if (trigger instanceof HTMLElement) {
                    if (e.relatedTarget instanceof Node && trigger.contains(e.relatedTarget)) return;
                    this.cancelBatchPlusMenuClose();
                    this.showBatchPlusMenu(trigger);
                    return;
                }

                if (target.closest('#am-campaign-batch-plus-menu')) {
                    this.cancelBatchPlusMenuClose();
                }
            }, true);

            document.addEventListener('mouseout', (e) => {
                const target = e.target;
                if (!(target instanceof Element)) return;
                if (!target.closest('[data-am-campaign-batch-plus="1"], #am-campaign-batch-plus-menu')) return;

                if (e.relatedTarget instanceof Node && this.isInsideOpenBatchPlusSurface(e.relatedTarget)) return;
                this.scheduleBatchPlusMenuClose();
            }, true);

            document.addEventListener('contextmenu', (e) => {
                const target = e.target;
                if (!(target instanceof Element)) return;
                const copyCountBadge = target.closest('[data-am-campaign-copy-count-badge]');
                if (!copyCountBadge) return;
                const copyButton = copyCountBadge.closest('.am-campaign-search-btn[data-am-campaign-copy]');
                if (!(copyButton instanceof HTMLButtonElement)) return;
                e.preventDefault();
                e.stopPropagation();
                this.adjustCopyBatchCount(copyButton, -1);
            }, true);

            document.addEventListener('wheel', (e) => {
                const target = e.target;
                if (!(target instanceof Element)) return;
                const copyCountBadge = target.closest('[data-am-campaign-copy-count-badge]');
                if (!copyCountBadge) return;
                const copyButton = copyCountBadge.closest('.am-campaign-search-btn[data-am-campaign-copy]');
                if (!(copyButton instanceof HTMLButtonElement)) return;
                e.preventDefault();
                e.stopPropagation();
                this.adjustCopyBatchCount(copyButton, e.deltaY > 0 ? -1 : 1);
            }, { capture: true, passive: false });

            this.initialized = true;
        },

        isElementVisible(el) {
            if (!(el instanceof Element)) return false;
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            return rect.width > 0
                && rect.height > 0
                && style.display !== 'none'
                && style.visibility !== 'hidden'
                && Number(style.opacity || 1) !== 0;
        },

        isSelectableControlVisible(el) {
            if (this.isElementVisible(el)) return true;
            const visibleHost = el instanceof Element
                ? el.closest('label, .next-checkbox, .ant-checkbox, .mx-checkbox, [role="checkbox"]')
                : null;
            return this.isElementVisible(visibleHost);
        },

        escapeHtml(value) {
            const str = value === null || value === undefined ? '' : String(value);
            return str.replace(/[&<>"']/g, (ch) => {
                const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
                return map[ch] || ch;
            });
        },

        getBatchPlusMenuItems(bizCode = '') {
            const sceneName = this.getSceneNameByBizCode(bizCode) || '当前场景';
            const normalizedBizCode = this.normalizeBizCode(bizCode);
            const isDisplayScene = normalizedBizCode === 'onebpDisplay';
            const isLeadScene = normalizedBizCode === 'onebpAdStrategyLiuZi';
            return [
                {
                    action: 'start',
                    icon: 'layers-play',
                    label: '批量开启',
                    title: `开启选中的${sceneName}计划`
                },
                {
                    action: 'pause',
                    icon: 'minus',
                    label: '批量暂停',
                    title: `暂停选中的${sceneName}计划`
                },
                {
                    action: 'delete',
                    icon: 'x-circle',
                    label: '批量删除',
                    danger: true,
                    title: `删除选中的${sceneName}计划`
                },
                {
                    action: 'rename',
                    icon: 'edit',
                    label: '批量修改计划名称',
                    title: `批量修改选中的${sceneName}计划名称`
                },
                {
                    action: 'shieldCrowd',
                    icon: 'shield-check',
                    label: '批量修改屏蔽人群',
                    title: isDisplayScene || isLeadScene ? '打开官方编辑过滤人群弹窗并批量同步屏蔽人群' : '打开选中计划的原生屏蔽/过滤人群设置入口'
                },
                {
                    action: 'crowdSetting',
                    icon: 'user',
                    label: '批量人群设置',
                    title: isDisplayScene ? '打开官方批量编辑人群抽屉' : '打开选中计划的原生人群设置入口'
                }
            ];
        },

        closeBatchPlusMenu() {
            this.clearBatchPlusMenuCloseState();
            const menu = this.getConnectedBatchPlusMenu();
            if (menu) menu.remove();
            this.batchPlusMenuEl = null;
            document.querySelectorAll('[data-am-campaign-batch-plus="1"].is-open').forEach((btn) => {
                if (!(btn instanceof HTMLElement)) return;
                btn.classList.remove('is-open');
                btn.setAttribute('aria-expanded', 'false');
                btn.removeAttribute('aria-controls');
            });
        },

        getConnectedBatchPlusMenu() {
            const storedMenu = this.batchPlusMenuEl;
            if (storedMenu instanceof HTMLElement && storedMenu.isConnected) {
                return storedMenu;
            }
            if (storedMenu) this.batchPlusMenuEl = null;

            const menu = document.getElementById('am-campaign-batch-plus-menu');
            if (menu instanceof HTMLElement && menu.isConnected) {
                this.batchPlusMenuEl = menu;
                return menu;
            }
            return null;
        },

        isBatchPlusMenuCloseDocumentHidden() {
            return document.visibilityState === 'hidden';
        },

        clearBatchPlusMenuCloseTimer() {
            if (!this.batchPlusMenuCloseTimer) return;
            window.clearTimeout(this.batchPlusMenuCloseTimer);
            this.batchPlusMenuCloseTimer = null;
        },

        clearBatchPlusMenuCloseVisibilityHandler() {
            if (!this.batchPlusMenuCloseVisibilityHandler) return;
            document.removeEventListener('visibilitychange', this.batchPlusMenuCloseVisibilityHandler);
            this.batchPlusMenuCloseVisibilityHandler = null;
        },

        clearBatchPlusMenuCloseState() {
            this.clearBatchPlusMenuCloseTimer();
            this.clearBatchPlusMenuCloseVisibilityHandler();
        },

        bindBatchPlusMenuCloseVisibilityHandler() {
            if (typeof this.batchPlusMenuCloseVisibilityHandler === 'function') return;
            this.batchPlusMenuCloseVisibilityHandler = () => {
                if (!this.isBatchPlusMenuCloseDocumentHidden()) return;
                this.closeBatchPlusMenu();
            };
            document.addEventListener('visibilitychange', this.batchPlusMenuCloseVisibilityHandler);
        },

        cancelBatchPlusMenuClose() {
            this.clearBatchPlusMenuCloseState();
        },

        scheduleBatchPlusMenuClose(delay = 160) {
            this.clearBatchPlusMenuCloseState();
            if (this.isBatchPlusMenuCloseDocumentHidden()) {
                this.closeBatchPlusMenu();
                return;
            }
            this.bindBatchPlusMenuCloseVisibilityHandler();
            this.batchPlusMenuCloseTimer = window.setTimeout(() => {
                this.batchPlusMenuCloseTimer = null;
                this.clearBatchPlusMenuCloseVisibilityHandler();
                if (this.isBatchPlusMenuCloseDocumentHidden()) {
                    this.closeBatchPlusMenu();
                    return;
                }
                this.closeBatchPlusMenu();
            }, delay);
        },

        clearCampaignListRefreshTimer() {
            if (!this.campaignListRefreshTimer) return;
            window.clearTimeout(this.campaignListRefreshTimer);
            this.campaignListRefreshTimer = null;
        },

        scheduleCampaignListRefresh(options = {}) {
            this.clearCampaignListRefreshTimer();
            const delay = Number.isFinite(Number(options?.delay)) ? Number(options.delay) : 600;
            this.campaignListRefreshTimer = window.setTimeout(() => {
                this.campaignListRefreshTimer = null;
                this.refreshCampaignListOnlyNow(options).catch((err) => {
                    Logger.log(`⚠️ ${options?.reason || '批量操作'}已完成，但自动刷新计划列表失败：${err?.message || err}`, true);
                });
            }, delay);
        },

        clearCopyFocusRestoreTimer() {
            if (!this.copyFocusRestoreTimer) return;
            window.clearTimeout(this.copyFocusRestoreTimer);
            this.copyFocusRestoreTimer = null;
        },

        scheduleCopyFocusRestore(target = null, attempt = 0, delay = 0) {
            this.clearCopyFocusRestoreTimer();
            this.copyFocusRestoreTimer = window.setTimeout(() => {
                this.copyFocusRestoreTimer = null;
                this.runCopyFocusRestore(target, attempt);
            }, delay);
        },

        findBatchPlusTriggerByAnchor(anchorId = '') {
            const anchor = String(anchorId || '').trim();
            if (!anchor) return null;
            return Array.from(document.querySelectorAll('[data-am-campaign-batch-plus="1"]'))
                .find(el => el instanceof HTMLElement && el.dataset.amBatchPlusAnchor === anchor) || null;
        },

        getOpenBatchPlusTrigger() {
            const menu = this.getConnectedBatchPlusMenu();
            const anchorId = menu instanceof HTMLElement ? menu.getAttribute('data-anchor-id') : '';
            return this.findBatchPlusTriggerByAnchor(anchorId || '')
                || document.querySelector('[data-am-campaign-batch-plus="1"].is-open');
        },

        isInsideOpenBatchPlusSurface(node) {
            if (!(node instanceof Node)) return false;
            const menu = this.getConnectedBatchPlusMenu();
            const trigger = this.getOpenBatchPlusTrigger();
            return !!((menu instanceof HTMLElement && menu.contains(node))
                || (trigger instanceof HTMLElement && trigger.contains(node)));
        },

        toggleBatchPlusMenu(triggerEl) {
            if (!(triggerEl instanceof HTMLElement)) return;
            const oldMenu = this.getConnectedBatchPlusMenu();
            if (oldMenu && oldMenu.getAttribute('data-anchor-id') === (triggerEl.dataset.amBatchPlusAnchor || '')) {
                this.closeBatchPlusMenu();
                return;
            }
            this.showBatchPlusMenu(triggerEl);
        },

        showBatchPlusMenu(triggerEl) {
            if (!(triggerEl instanceof HTMLElement)) return;
            const oldMenu = this.getConnectedBatchPlusMenu();
            if (oldMenu && oldMenu.getAttribute('data-anchor-id') === (triggerEl.dataset.amBatchPlusAnchor || '')) return;
            this.closeBatchPlusMenu();
            const bizCode = this.normalizeBizCode(triggerEl.getAttribute('data-biz-code') || triggerEl.dataset?.bizCode || this.getCurrentCampaignBizCode() || this.DEFAULT_BIZ_CODE) || this.DEFAULT_BIZ_CODE;
            const anchorId = `am-batch-plus-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            triggerEl.dataset.amBatchPlusAnchor = anchorId;
            triggerEl.classList.add('is-open');
            triggerEl.setAttribute('aria-expanded', 'true');
            triggerEl.setAttribute('aria-controls', 'am-campaign-batch-plus-menu');

            const menu = document.createElement('div');
            menu.id = 'am-campaign-batch-plus-menu';
            menu.className = 'mxgc-popmenu am-campaign-batch-plus-native-menu';
            menu.setAttribute('role', 'menu');
            menu.setAttribute('aria-label', '批量+菜单');
            menu.setAttribute('data-anchor-id', anchorId);
            menu.setAttribute('data-biz-code', bizCode);
            menu.innerHTML = this.getBatchPlusMenuItems(bizCode).map((item) => `
                <button
                    type="button"
                    class="am-campaign-batch-plus-item${item.danger ? ' is-danger' : ''}"
                    data-am-campaign-batch-plus-action="${this.escapeHtml(item.action)}"
                    data-biz-code="${this.escapeHtml(bizCode)}"
                    role="menuitem"
                    title="${this.escapeHtml(item.title || item.label)}"
                >
                    <span class="am-campaign-batch-plus-item-icon" aria-hidden="true">${renderAmIcon(item.icon || 'logo', { size: 14, strokeWidth: 2.1 })}</span>
                    <span class="am-campaign-batch-plus-item-label">${this.escapeHtml(item.label)}</span>
                </button>
            `).join('');
            menu.addEventListener('keydown', (event) => {
                const items = Array.from(menu.querySelectorAll('[data-am-campaign-batch-plus-action]'))
                    .filter(el => el instanceof HTMLElement && !el.matches(':disabled'));
                if (event.key === 'Escape') {
                    event.preventDefault();
                    this.closeBatchPlusMenu();
                    triggerEl.focus({ preventScroll: true });
                    return;
                }
                if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
                if (!items.length) return;
                event.preventDefault();
                const activeIndex = items.indexOf(document.activeElement);
                const direction = event.key === 'ArrowDown' ? 1 : -1;
                const nextIndex = activeIndex >= 0
                    ? (activeIndex + direction + items.length) % items.length
                    : (direction > 0 ? 0 : items.length - 1);
                items[nextIndex].focus({ preventScroll: true });
            });
            document.body.appendChild(menu);

            const rect = triggerEl.getBoundingClientRect();
            menu.style.minWidth = `${Math.max(120, Math.round(rect.width))}px`;
            const menuRect = menu.getBoundingClientRect();
            const left = Math.min(
                Math.max(8, rect.left),
                Math.max(8, window.innerWidth - menuRect.width - 8)
            );
            const top = Math.min(
                Math.max(8, rect.bottom + 4),
                Math.max(8, window.innerHeight - menuRect.height - 8)
            );
            menu.style.left = `${Math.round(left + window.scrollX)}px`;
            menu.style.top = `${Math.round(top + window.scrollY)}px`;
            this.batchPlusMenuEl = menu;
        },

        findSelectedCampaignContextFromCheckbox(checkbox) {
            if (!(checkbox instanceof Element)) return null;
            let pointer = checkbox;
            for (let i = 0; i < 10 && pointer && pointer !== document.body; i++, pointer = pointer.parentElement) {
                const rect = pointer.getBoundingClientRect();
                if (rect.height > 360 || pointer.id === 'app') continue;
                const context = this.resolveCampaignContextFromElement(pointer);
                if (context?.campaignId) {
                    return {
                        ...context,
                        rowEl: pointer
                    };
                }
            }
            return null;
        },

        collectSelectedCampaignContexts(preferredBizCode = '') {
            const selected = [];
            const seen = new Set();
            const routeBizCode = this.normalizeBizCode(preferredBizCode || this.getCurrentCampaignBizCode() || '');
            const pushContext = (context) => {
                const campaignId = this.normalizeCampaignId(context?.campaignId || '');
                if (!campaignId) return;
                const bizCode = this.normalizeBizCode(context?.bizCode || routeBizCode || preferredBizCode || '') || routeBizCode || this.DEFAULT_BIZ_CODE;
                if (routeBizCode && bizCode !== routeBizCode) return;
                const key = `${bizCode}@${campaignId}`;
                if (seen.has(key)) return;
                seen.add(key);
                selected.push({
                    ...context,
                    campaignId,
                    bizCode
                });
            };

            document.querySelectorAll('input[type="checkbox"]:checked, [role="checkbox"][aria-checked="true"]').forEach((checkbox) => {
                if (!(checkbox instanceof Element)) return;
                if (!this.isSelectableControlVisible(checkbox)) return;
                if (this.isInIgnoredArea(checkbox)) return;
                const context = this.findSelectedCampaignContextFromCheckbox(checkbox);
                pushContext(context);
            });

            return selected;
        },

        groupCampaignContextsByBizCode(contexts = [], fallbackBizCode = '') {
            const map = new Map();
            (Array.isArray(contexts) ? contexts : []).forEach((context) => {
                const campaignId = this.normalizeCampaignId(context?.campaignId || '');
                if (!campaignId) return;
                const bizCode = this.normalizeBizCode(context?.bizCode || fallbackBizCode || '') || this.DEFAULT_BIZ_CODE;
                const list = map.get(bizCode) || [];
                if (!list.some(item => item.campaignId === campaignId)) {
                    list.push({
                        ...context,
                        campaignId,
                        bizCode
                    });
                }
                map.set(bizCode, list);
            });
            return map;
        },

        async deleteCampaignsBatchByBiz(campaignIds = [], bizCode = '', authContext = {}) {
            const normalizedIds = Array.from(new Set(
                (Array.isArray(campaignIds) ? campaignIds : [])
                    .map(id => this.normalizeCampaignId(id))
                    .filter(Boolean)
            ));
            if (!normalizedIds.length) {
                return {
                    campaignIds: [],
                    bizCode: this.normalizeBizCode(bizCode) || authContext?.bizCode || this.DEFAULT_BIZ_CODE,
                    response: {}
                };
            }
            const targetBizCode = this.normalizeBizCode(bizCode) || authContext?.bizCode || this.DEFAULT_BIZ_CODE;
            const query = new URLSearchParams({
                csrfId: String(authContext?.csrfId || ''),
                bizCode: targetBizCode
            });
            const url = `https://one.alimama.com/campaign/delete.json?${query.toString()}`;
            const payload = {
                bizCode: targetBizCode,
                campaignIdList: normalizedIds.map(id => Number(id)),
                csrfId: String(authContext?.csrfId || ''),
                loginPointId: String(authContext?.loginPointId || '')
            };
            const json = await OneApiTransport.postJson(url, payload, {
                actionName: '批量删除计划失败',
                businessErrorMessage: '批量删除计划失败'
            });
            return {
                campaignIds: normalizedIds,
                bizCode: targetBizCode,
                response: json
            };
        },

        openBatchPlusConfirmDialog({ title = '确认操作', message = '', confirmLabel = '确定', cancelLabel = '取消', danger = false, focusBackTarget = null } = {}) {
            return new Promise((resolve) => {
                const oldPopup = document.getElementById('am-campaign-batch-confirm-popup');
                if (oldPopup) oldPopup.remove();

                const popup = document.createElement('div');
                popup.id = 'am-campaign-batch-confirm-popup';
                const titleId = `am-campaign-batch-confirm-title-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                const bodyId = `am-campaign-batch-confirm-body-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
                popup.setAttribute('role', 'dialog');
                popup.setAttribute('aria-modal', 'true');
                popup.setAttribute('aria-labelledby', titleId);
                popup.setAttribute('aria-describedby', bodyId);

                const card = document.createElement('section');
                card.className = 'am-batch-confirm-card';
                const header = document.createElement('div');
                header.className = 'am-batch-confirm-header';
                const icon = document.createElement('span');
                icon.className = `am-batch-confirm-icon${danger ? ' is-danger' : ''}`;
                icon.setAttribute('aria-hidden', 'true');
                icon.innerHTML = renderAmIcon(danger ? 'x-circle' : 'alert-triangle', { size: 16, strokeWidth: 2.2 });
                const titleEl = document.createElement('h3');
                titleEl.id = titleId;
                titleEl.className = 'am-batch-confirm-title';
                titleEl.textContent = title;
                const body = document.createElement('pre');
                body.id = bodyId;
                body.className = 'am-batch-confirm-body';
                body.textContent = String(message || '');
                const footer = document.createElement('div');
                footer.className = 'am-batch-confirm-footer';
                const confirmBtn = document.createElement('button');
                confirmBtn.type = 'button';
                confirmBtn.className = `am-batch-confirm-submit${danger ? ' is-danger' : ''}`;
                confirmBtn.textContent = confirmLabel;
                const cancelBtn = document.createElement('button');
                cancelBtn.type = 'button';
                cancelBtn.className = 'am-batch-confirm-cancel';
                cancelBtn.textContent = cancelLabel;

                let settled = false;
                const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
                const isFocusableElement = (el) => el instanceof HTMLElement
                    && !el.matches(':disabled')
                    && el.getClientRects().length > 0;
                const getFocusableElements = () => Array.from(popup.querySelectorAll(focusableSelector))
                    .filter(isFocusableElement);
                const resolveFocusTarget = (candidate) => {
                    if (!(candidate instanceof HTMLElement) || !candidate.isConnected) return null;
                    if (isFocusableElement(candidate)) return candidate;
                    const nested = candidate.querySelector(focusableSelector);
                    return isFocusableElement(nested) ? nested : null;
                };
                const close = (confirmed) => {
                    if (settled) return;
                    settled = true;
                    document.removeEventListener('keydown', onKeydown, true);
                    popup.remove();
                    const focusTarget = resolveFocusTarget(focusBackTarget) || resolveFocusTarget(previousActiveElement);
                    if (focusTarget?.isConnected) {
                        requestAnimationFrame(() => focusTarget.focus({ preventScroll: true }));
                    }
                    resolve(!!confirmed);
                };
                const onKeydown = (event) => {
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        close(false);
                        return;
                    }
                    if (event.key !== 'Tab') return;
                    const focusable = getFocusableElements();
                    if (!focusable.length) {
                        event.preventDefault();
                        return;
                    }
                    event.preventDefault();
                    const activeIndex = focusable.indexOf(document.activeElement);
                    const direction = event.shiftKey ? -1 : 1;
                    const nextIndex = activeIndex >= 0
                        ? (activeIndex + direction + focusable.length) % focusable.length
                        : (event.shiftKey ? focusable.length - 1 : 0);
                    focusable[nextIndex].focus({ preventScroll: true });
                };
                confirmBtn.addEventListener('click', () => close(true), { once: true });
                cancelBtn.addEventListener('click', () => close(false), { once: true });
                popup.addEventListener('click', (event) => {
                    if (event.target === popup) close(false);
                });
                document.addEventListener('keydown', onKeydown, true);

                header.appendChild(icon);
                header.appendChild(titleEl);
                footer.appendChild(confirmBtn);
                footer.appendChild(cancelBtn);
                card.appendChild(header);
                card.appendChild(body);
                card.appendChild(footer);
                popup.appendChild(card);
                document.body.appendChild(popup);
                requestAnimationFrame(() => cancelBtn.focus());
            });
        },

        getBatchStatusActionMeta(action = '') {
            const normalized = String(action || '').trim();
            if (normalized === 'start') {
                return {
                    onlineStatus: 1,
                    verb: '开启',
                    label: '批量开启'
                };
            }
            if (normalized === 'pause') {
                return {
                    onlineStatus: 0,
                    verb: '暂停',
                    label: '批量暂停'
                };
            }
            return null;
        },

        async runBatchUpdateCampaignStatus(action = '', contexts = [], fallbackBizCode = '', triggerEl = null) {
            const meta = this.getBatchStatusActionMeta(action);
            if (!meta) {
                Logger.log(`⚠️ 未识别的批量状态动作：${action || '-'}`, true);
                return;
            }
            const selected = Array.isArray(contexts) ? contexts : [];
            if (!selected.length) {
                Logger.log(`⚠️ 请先勾选需要${meta.label}的计划`, true);
                return;
            }
            const ids = selected.map(item => item.campaignId).filter(Boolean);
            if (!ids.length) {
                Logger.log(`⚠️ 未能识别需要${meta.label}的计划ID`, true);
                return;
            }
            const sceneName = this.getSceneNameByBizCode(fallbackBizCode || selected[0]?.bizCode || '') || '当前场景';
            const confirmed = await this.openBatchPlusConfirmDialog({
                title: `确认${meta.verb}计划`,
                message: `确认${meta.verb}选中的 ${ids.length} 个${sceneName}计划？\n该操作会调用原生${meta.label}接口，请确认这些计划都可以${meta.verb}。`,
                confirmLabel: `确认${meta.verb}`,
                cancelLabel: '取消',
                focusBackTarget: triggerEl
            });
            if (!confirmed) {
                Logger.log(`已取消${meta.label}`);
                return;
            }

            const grouped = this.groupCampaignContextsByBizCode(selected, fallbackBizCode);
            const authContext = this.resolveAuthContext(fallbackBizCode || selected[0]?.bizCode || this.DEFAULT_BIZ_CODE);
            const jobs = Array.from(grouped.entries()).map(([bizCode, list]) => (
                this.updateCampaignStatusBatchByBiz(list.map(item => item.campaignId), bizCode, meta.onlineStatus, authContext)
            ));
            const settled = await Promise.allSettled(jobs);
            const successCount = settled
                .filter(item => item.status === 'fulfilled')
                .reduce((sum, item) => sum + (item.value?.campaignIds?.length || 0), 0);
            const errors = settled
                .filter(item => item.status === 'rejected')
                .map(item => item.reason?.message || `${meta.label}失败`);
            if (errors.length) {
                Logger.log(`⚠️ ${meta.label}部分失败：成功 ${successCount} 个，失败 ${errors.length} 组，原因：${errors.join('；')} `, true);
                return;
            }
            Logger.log(`✅ ${meta.label}完成：${successCount} 个计划`);
            this.refreshCampaignListOnly({
                bizCode: fallbackBizCode || selected[0]?.bizCode || this.DEFAULT_BIZ_CODE,
                reason: meta.label
            });
        },

        normalizeBatchRenamePlanName(value = '') {
            return String(value || '').replace(/\s+/g, ' ').trim();
        },

        guessCampaignNameFromContext(context = {}) {
            const candidates = [
                context?.campaignName,
                context?.name,
                context?.planName,
                context?.campaign?.campaignName
            ];
            for (let i = 0; i < candidates.length; i++) {
                const name = this.normalizeBatchRenamePlanName(candidates[i]);
                if (name) return name;
            }
            if (context?.rowEl instanceof Element) {
                const guessed = this.normalizeBatchRenamePlanName(
                    MagicReport.guessCampaignNameById(context.campaignId, context.rowEl)
                );
                if (guessed) return guessed;
            }
            return '';
        },

        async resolveBatchRenamePlanName(context = {}, fallbackBizCode = '', authContext = {}) {
            const guessed = this.guessCampaignNameFromContext(context);
            if (guessed) return guessed;
            const campaignId = this.normalizeCampaignId(context?.campaignId || '');
            if (!campaignId) return '';
            const bizCode = this.normalizeBizCode(context?.bizCode || fallbackBizCode || '') || this.DEFAULT_BIZ_CODE;
            try {
                const row = await this.queryCampaignListById(campaignId, bizCode, authContext);
                const listName = this.normalizeBatchRenamePlanName(row?.campaignName || row?.name || '');
                if (listName) return listName;
            } catch (err) {
                Logger.log(`⚠️ 列表查询计划${campaignId}名称失败，继续尝试详情接口：${err?.message || '未知错误'} `, true);
            }
            try {
                const detail = await this.queryCampaignDetail(campaignId, bizCode, authContext);
                const campaign = this.extractCopyCampaignFromPayload(detail?.response || {}, campaignId);
                return this.normalizeBatchRenamePlanName(campaign?.campaignName || campaign?.name || '');
            } catch (err) {
                Logger.log(`⚠️ 查询计划${campaignId}详情失败，无法补齐计划名称：${err?.message || '未知错误'} `, true);
                return '';
            }
        },

        async buildBatchRenameRows(contexts = [], fallbackBizCode = '', authContext = {}) {
            const selected = Array.isArray(contexts) ? contexts : [];
            const rows = [];
            const seen = new Set();
            for (let i = 0; i < selected.length; i++) {
                const context = selected[i] || {};
                const campaignId = this.normalizeCampaignId(context.campaignId || '');
                if (!campaignId || seen.has(campaignId)) continue;
                seen.add(campaignId);
                const bizCode = this.normalizeBizCode(context.bizCode || fallbackBizCode || '') || this.DEFAULT_BIZ_CODE;
                const planName = await this.resolveBatchRenamePlanName(context, bizCode, authContext);
                rows.push({
                    index: rows.length,
                    campaignId,
                    bizCode,
                    originalPlanName: planName,
                    planName,
                    bidModeDisplay: '',
                    bidPrice: '',
                    bidPriceEditable: false,
                    budgetField: 'dayAverageBudget',
                    budgetValue: ''
                });
            }
            return rows;
        },

        async submitBatchRenameCampaignRows(context = {}, editedRows = []) {
            const rows = Array.isArray(editedRows) ? editedRows : [];
            const changedRows = rows
                .map((row) => ({
                    ...row,
                    campaignId: this.normalizeCampaignId(row?.campaignId || ''),
                    bizCode: this.normalizeBizCode(row?.bizCode || context.bizCode || '') || context.bizCode || this.DEFAULT_BIZ_CODE,
                    originalPlanName: this.normalizeBatchRenamePlanName(row?.originalPlanName || ''),
                    planName: this.normalizeBatchRenamePlanName(row?.planName || '')
                }))
                .filter(row => row.campaignId && row.planName && row.planName !== row.originalPlanName);
            if (!changedRows.length) throw new Error('没有需要修改的计划名称');

            const grouped = this.groupCampaignContextsByBizCode(changedRows, context.bizCode || this.DEFAULT_BIZ_CODE);
            const jobs = Array.from(grouped.entries()).map(([bizCode, list]) => (
                this.updateCampaignNamesBatchByBiz(
                    list,
                    bizCode,
                    this.resolveAuthContext(bizCode || context.bizCode || this.DEFAULT_BIZ_CODE)
                )
            ));
            const settled = await Promise.allSettled(jobs);
            const successCount = settled
                .filter(item => item.status === 'fulfilled')
                .reduce((sum, item) => sum + (item.value?.campaignIds?.length || 0), 0);
            const errors = settled
                .filter(item => item.status === 'rejected')
                .map(item => item.reason?.message || '批量修改计划名称失败');
            if (errors.length) {
                throw new Error(`批量修改计划名称部分失败：成功 ${successCount} 个，失败 ${errors.length} 组，原因：${errors.join('；')}`);
            }
            Logger.log(`✅ 批量修改计划名称完成：${successCount} 个计划`);
            this.refreshCampaignListOnly({
                bizCode: context.bizCode || changedRows[0]?.bizCode || this.DEFAULT_BIZ_CODE,
                reason: '批量修改计划名称'
            });
            return {
                ok: true,
                successCount,
                changedRows
            };
        },

        async runBatchRenameCampaigns(contexts = [], fallbackBizCode = '', triggerEl = null) {
            const selected = Array.isArray(contexts) ? contexts : [];
            if (!selected.length) {
                Logger.log('⚠️ 请先勾选需要批量修改计划名称的计划', true);
                return;
            }
            const ids = selected.map(item => this.normalizeCampaignId(item?.campaignId || '')).filter(Boolean);
            if (!ids.length) {
                Logger.log('⚠️ 未能识别需要批量修改计划名称的计划ID', true);
                return;
            }
            const targetBizCode = this.normalizeBizCode(fallbackBizCode || selected[0]?.bizCode || '') || this.DEFAULT_BIZ_CODE;
            const authContext = this.resolveAuthContext(targetBizCode);
            const sceneName = this.getSceneNameByBizCode(targetBizCode) || '当前场景';
            const quickRows = selected.map((context, index) => {
                const campaignId = this.normalizeCampaignId(context?.campaignId || '');
                const planName = this.guessCampaignNameFromContext(context);
                return {
                    index,
                    campaignId,
                    bizCode: this.normalizeBizCode(context?.bizCode || targetBizCode || '') || targetBizCode,
                    originalPlanName: planName,
                    planName,
                    bidModeDisplay: '',
                    bidPrice: '',
                    bidPriceEditable: false,
                    budgetField: 'dayAverageBudget',
                    budgetValue: ''
                };
            }).filter(row => row.campaignId);
            const quickContext = {
                mode: 'rename',
                label: '批量修改计划名称',
                bizCode: targetBizCode,
                sceneName,
                copyCount: quickRows.length,
                previewRows: quickRows,
                triggerEl,
                authContext,
                preparing: true
            };
            try {
                await this.openCopyPlanOverviewDialog(quickContext, (editedRows, preparedContext) => (
                    this.submitBatchRenameCampaignRows(preparedContext, editedRows)
                ), {
                    mode: 'rename',
                    prepareContext: async () => {
                        const previewRows = await this.buildBatchRenameRows(selected, targetBizCode, authContext);
                        const missing = previewRows.filter(row => !row.planName).map(row => row.campaignId);
                        if (missing.length) {
                            throw new Error(`未能读取以下计划名称：${missing.join('、')}`);
                        }
                        return {
                            ...quickContext,
                            previewRows,
                            preparing: false
                        };
                    }
                });
            } catch (err) {
                if (err?.cancelled || err?.code === 'rename_preview_cancelled') {
                    Logger.log('📋 批量修改计划名称已取消');
                    return;
                }
                Logger.log(`⚠️ 批量修改计划名称失败：${err?.message || '未知错误'} `, true);
            }
        },

        async runBatchDeleteCampaigns(contexts = [], fallbackBizCode = '', triggerEl = null) {
            const selected = Array.isArray(contexts) ? contexts : [];
            if (!selected.length) {
                Logger.log('⚠️ 请先勾选需要批量删除的计划', true);
                return;
            }
            const ids = selected.map(item => item.campaignId).filter(Boolean);
            const sceneName = this.getSceneNameByBizCode(fallbackBizCode || selected[0]?.bizCode || '') || '当前场景';
            const confirmed = await this.openBatchPlusConfirmDialog({
                title: '确认删除计划',
                message: `确认删除选中的 ${ids.length} 个${sceneName}计划？\n该操作会调用原生删除接口，请确认这些计划都可以删除。`,
                confirmLabel: '确认删除',
                cancelLabel: '取消',
                danger: true,
                focusBackTarget: triggerEl
            });
            if (!confirmed) {
                Logger.log('已取消批量删除');
                return;
            }

            const grouped = this.groupCampaignContextsByBizCode(selected, fallbackBizCode);
            const authContext = this.resolveAuthContext(fallbackBizCode || selected[0]?.bizCode || this.DEFAULT_BIZ_CODE);
            const jobs = Array.from(grouped.entries()).map(([bizCode, list]) => (
                this.deleteCampaignsBatchByBiz(list.map(item => item.campaignId), bizCode, authContext)
            ));
            const settled = await Promise.allSettled(jobs);
            const successCount = settled
                .filter(item => item.status === 'fulfilled')
                .reduce((sum, item) => sum + (item.value?.campaignIds?.length || 0), 0);
            const errors = settled
                .filter(item => item.status === 'rejected')
                .map(item => item.reason?.message || '删除失败');
            if (errors.length) {
                Logger.log(`⚠️ 批量删除部分失败：成功 ${successCount} 个，失败 ${errors.length} 组，原因：${errors.join('；')} `, true);
                return;
            }
            Logger.log(`✅ 批量删除完成：${successCount} 个计划`);
            this.refreshCampaignListOnly({
                bizCode: fallbackBizCode || selected[0]?.bizCode || this.DEFAULT_BIZ_CODE,
                reason: '批量删除'
            });
        },

        getDisplayCrowdDateRange() {
            const params = this.parseCurrentHashParams();
            const today = this.formatDateYmd(new Date());
            return {
                startTime: params.get('startTime') || today,
                endTime: params.get('endTime') || params.get('startTime') || today
            };
        },

        extractBlackCrowdRecordsFromResponse(json = {}) {
            const data = this.isPlainRecord(json?.data) ? json.data : json;
            const candidates = [
                data?.list,
                data?.records,
                data?.result,
                data?.result?.list,
                data?.page?.list,
                json?.list,
                json?.records,
                json?.result,
                json?.result?.list
            ];
            for (let i = 0; i < candidates.length; i++) {
                const item = candidates[i];
                if (Array.isArray(item)) return item;
                if (this.isPlainRecord(item) && Array.isArray(item.list)) return item.list;
            }
            return [];
        },

        extractBlackCrowdListFromResponse(json = {}, campaignId = '') {
            const targetCampaignId = this.normalizeCampaignId(campaignId);
            const records = this.extractBlackCrowdRecordsFromResponse(json);
            const record = records.find(item => this.normalizeCampaignId(item?.campaignId || '') === targetCampaignId)
                || records[0]
                || {};
            const candidates = [
                record?.crowdList,
                record?.blackCrowdList,
                record?.crowds,
                record?.list,
                record?.result
            ];
            for (let i = 0; i < candidates.length; i++) {
                if (Array.isArray(candidates[i])) return candidates[i].map(item => this.cloneCopyData(item));
            }
            return [];
        },

        formatBlackCrowdName(item = {}) {
            const crowd = this.isPlainRecord(item?.crowd) ? item.crowd : item;
            const labelName = String(crowd?.label?.labelName || item?.labelName || '').trim();
            const optionName = String(crowd?.option?.optionName || item?.optionName || '').trim();
            const candidates = [
                crowd?.crowdName,
                item?.crowdName,
                crowd?.name,
                item?.name,
                labelName && optionName ? `${labelName}：${optionName}` : '',
                crowd?.mx_crowdId,
                item?.mx_crowdId,
                crowd?.crowdId,
                item?.crowdId
            ];
            const name = candidates
                .map(value => String(value || '').replace(/\s+/g, ' ').trim())
                .find(Boolean);
            return name || '未命名过滤人群';
        },

        formatBlackCrowdNames(crowdList = [], limit = 8) {
            const list = Array.isArray(crowdList) ? crowdList : [];
            const names = list.map(item => this.formatBlackCrowdName(item)).filter(Boolean);
            if (!names.length) return '无（确认后会清空所选计划的过滤人群）';
            const visible = names.slice(0, Math.max(1, Number(limit) || 8));
            const suffix = names.length > visible.length ? `\n...等 ${names.length} 个` : '';
            return visible.map((name, index) => `${index + 1}. ${name}`).join('\n') + suffix;
        },

        async findDisplayBlackCrowdList(campaignId, authContext = {}) {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) throw new Error('计划ID无效');
            const query = new URLSearchParams({
                csrfId: String(authContext?.csrfId || ''),
                bizCode: 'onebpDisplay'
            });
            const url = `https://one.alimama.com/blackCrowd/findList.json?${query.toString()}`;
            const payload = {
                bizCode: 'onebpDisplay',
                crowdBindQueryList: [{
                    campaignId: String(id)
                }],
                csrfId: String(authContext?.csrfId || ''),
                loginPointId: String(authContext?.loginPointId || '')
            };
            const json = await OneApiTransport.postJson(url, payload, {
                actionName: '读取过滤人群失败',
                businessErrorMessage: '读取过滤人群失败'
            });
            return {
                campaignId: id,
                crowdList: this.extractBlackCrowdListFromResponse(json, id),
                response: json
            };
        },

        prepareBlackCrowdListForCampaign(crowdList = [], campaignId = '') {
            const id = this.normalizeCampaignId(campaignId);
            return (Array.isArray(crowdList) ? crowdList : []).map((item) => {
                const cloned = this.cloneCopyData(item);
                if (!this.isPlainRecord(cloned)) return cloned;
                cloned.campaignId = String(id);
                cloned.bizCode = 'onebpDisplay';
                if (this.isPlainRecord(cloned.campaign)) {
                    cloned.campaign.campaignId = Number(id);
                }
                return cloned;
            });
        },

        getBlackCrowdIdentity(item = {}) {
            const crowd = this.isPlainRecord(item?.crowd) ? item.crowd : item;
            const label = this.isPlainRecord(crowd?.label) ? crowd.label : {};
            const optionValues = Array.isArray(label?.optionList)
                ? label.optionList.map(option => option?.optionValue || option?.value || option?.optionName).filter(Boolean).join(',')
                : '';
            const subValues = Array.isArray(crowd?.subCrowdList)
                ? crowd.subCrowdList.map(option => option?.subcrowdValue || option?.subcrowdName).filter(Boolean).join(',')
                : '';
            const stableParts = [
                label?.labelId || label?.labelValue || label?.labelName,
                crowd?.targetType || label?.targetType,
                crowd?.crowdValue || optionValues || subValues
            ].map(value => this.normalizeBlackCrowdIdentityPart(value)).filter(Boolean);
            if (stableParts.length) return stableParts.join('::');
            const fallback = [
                item?.mx_crowdId,
                crowd?.mx_crowdId,
                item?.crowdId,
                crowd?.crowdId,
                this.formatBlackCrowdName(item)
            ].map(value => this.normalizeBlackCrowdIdentityPart(value)).find(Boolean);
            return fallback || '';
        },

        normalizeBlackCrowdIdentityPart(value = '') {
            return String(value || '')
                .replace(/\s+/g, '')
                .replace(/：/g, ':')
                .trim();
        },

        getBlackCrowdIdentitySet(crowdList = []) {
            return new Set((Array.isArray(crowdList) ? crowdList : [])
                .map(item => this.getBlackCrowdIdentity(item))
                .filter(Boolean));
        },

        isBlackCrowdListSynced(expectedCrowdList = [], actualCrowdList = []) {
            const expected = this.getBlackCrowdIdentitySet(expectedCrowdList);
            const actual = this.getBlackCrowdIdentitySet(actualCrowdList);
            if (expected.size !== actual.size) return false;
            for (const key of expected) {
                if (!actual.has(key)) return false;
            }
            return true;
        },

        formatBlackCrowdSyncDebug(crowdList = []) {
            const names = (Array.isArray(crowdList) ? crowdList : [])
                .map(item => this.formatBlackCrowdName(item))
                .filter(Boolean);
            return names.length ? names.join('、') : '无';
        },

        async verifyBlackCrowdListSynced(fetchCurrent, campaignId, expectedCrowdList = [], sceneName = '计划') {
            const id = this.normalizeCampaignId(campaignId);
            let lastCrowdList = [];
            let lastError = null;
            for (let i = 0; i < 3; i++) {
                if (i > 0) await this.sleep(350 * i);
                try {
                    const current = await fetchCurrent();
                    lastCrowdList = Array.isArray(current?.crowdList) ? current.crowdList : [];
                    if (this.isBlackCrowdListSynced(expectedCrowdList, lastCrowdList)) {
                        return current;
                    }
                } catch (err) {
                    lastError = err;
                }
            }
            if (lastError && !lastCrowdList.length) {
                throw new Error(`${sceneName}过滤人群回查失败：计划 ${id}，${lastError.message || lastError}`);
            }
            throw new Error(`${sceneName}过滤人群未确认落库：计划 ${id}，期望 ${this.formatBlackCrowdSyncDebug(expectedCrowdList)}，实际 ${this.formatBlackCrowdSyncDebug(lastCrowdList)}`);
        },

        async verifyDisplayBlackCrowdListSynced(campaignId, expectedCrowdList = [], authContext = {}) {
            const id = this.normalizeCampaignId(campaignId);
            return this.verifyBlackCrowdListSynced(
                () => this.findDisplayBlackCrowdList(id, authContext),
                id,
                expectedCrowdList,
                '人群推广'
            );
        },

        async verifyLeadBlackCrowdListSynced(campaignId, expectedCrowdList = [], authContext = {}) {
            const id = this.normalizeCampaignId(campaignId);
            return this.verifyBlackCrowdListSynced(
                () => this.findLeadBlackCrowdList(id, authContext),
                id,
                expectedCrowdList,
                '线索推广'
            );
        },

        getBlackCrowdDeleteList(oldCrowdList = [], newCrowdList = []) {
            const newMap = new Set((Array.isArray(newCrowdList) ? newCrowdList : [])
                .map(item => this.getBlackCrowdIdentity(item))
                .filter(Boolean));
            return (Array.isArray(oldCrowdList) ? oldCrowdList : []).filter((item) => {
                const key = this.getBlackCrowdIdentity(item);
                return key && !newMap.has(key);
            });
        },

        async modifyDisplayBlackCrowdList(campaignId, crowdList = [], authContext = {}) {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) throw new Error('计划ID无效');
            const { startTime, endTime } = this.getDisplayCrowdDateRange();
            const query = new URLSearchParams({
                csrfId: String(authContext?.csrfId || ''),
                bizCode: 'onebpDisplay'
            });
            const url = `https://one.alimama.com/blackCrowd/batchModify.json?${query.toString()}`;
            const payload = {
                mx_bizCode: 'onebpDisplay',
                bizCode: 'onebpDisplay',
                campaignId: String(id),
                tab: 'crowd',
                startTime,
                endTime,
                crowdList: this.prepareBlackCrowdListForCampaign(crowdList, id),
                csrfId: String(authContext?.csrfId || ''),
                loginPointId: String(authContext?.loginPointId || '')
            };
            const json = await OneApiTransport.postJson(url, payload, {
                actionName: '批量修改屏蔽人群失败',
                businessErrorMessage: '批量修改屏蔽人群失败'
            });
            return {
                campaignId: id,
                crowdCount: payload.crowdList.length,
                response: json
            };
        },

        async deleteDisplayBlackCrowdList(campaignId, crowdList = [], authContext = {}) {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) throw new Error('计划ID无效');
            const prepared = this.prepareBlackCrowdListForCampaign(crowdList, id);
            if (!prepared.length) {
                return {
                    campaignId: id,
                    crowdCount: 0,
                    skipped: true
                };
            }
            const { startTime, endTime } = this.getDisplayCrowdDateRange();
            const query = new URLSearchParams({
                csrfId: String(authContext?.csrfId || ''),
                bizCode: 'onebpDisplay'
            });
            const url = `https://one.alimama.com/blackCrowd/batchDelete.json?${query.toString()}`;
            const payload = {
                mx_bizCode: 'onebpDisplay',
                bizCode: 'onebpDisplay',
                campaignId: String(id),
                tab: 'crowd',
                startTime,
                endTime,
                crowdList: prepared,
                csrfId: String(authContext?.csrfId || ''),
                loginPointId: String(authContext?.loginPointId || '')
            };
            const json = await OneApiTransport.postJson(url, payload, {
                actionName: '批量删除屏蔽人群失败',
                businessErrorMessage: '批量删除屏蔽人群失败'
            });
            return {
                campaignId: id,
                crowdCount: payload.crowdList.length,
                response: json
            };
        },

        async syncDisplayBlackCrowdListForCampaign(campaignId, newCrowdList = [], oldCrowdList = [], authContext = {}) {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) throw new Error('计划ID无效');
            const preparedNew = this.prepareBlackCrowdListForCampaign(newCrowdList, id);
            const deleteList = this.getBlackCrowdDeleteList(oldCrowdList, newCrowdList);
            const results = [];
            if (preparedNew.length) {
                results.push(await this.modifyDisplayBlackCrowdList(id, preparedNew, authContext));
            }
            if (deleteList.length) {
                results.push(await this.deleteDisplayBlackCrowdList(id, deleteList, authContext));
            }
            const verification = await this.verifyDisplayBlackCrowdListSynced(id, newCrowdList, authContext);
            return {
                campaignId: id,
                modifyCount: preparedNew.length,
                deleteCount: deleteList.length,
                verifiedCount: verification.crowdList.length,
                results
            };
        },

        async findLeadCampaign(campaignId, authContext = {}) {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) throw new Error('计划ID无效');
            const query = new URLSearchParams({
                csrfId: String(authContext?.csrfId || ''),
                bizCode: 'onebpAdStrategyLiuZi'
            });
            const url = `https://one.alimama.com/campaign/get.json?${query.toString()}`;
            const payload = {
                bizCode: 'onebpAdStrategyLiuZi',
                campaignId: String(id),
                csrfId: String(authContext?.csrfId || ''),
                loginPointId: String(authContext?.loginPointId || '')
            };
            const json = await OneApiTransport.postJson(url, payload, {
                actionName: '读取线索推广计划失败',
                businessErrorMessage: '读取线索推广计划失败'
            });
            const campaign = this.isPlainRecord(json?.data?.campaign)
                ? json.data.campaign
                : (this.isPlainRecord(json?.campaign) ? json.campaign : null);
            if (!campaign) {
                throw new Error('读取线索推广计划失败：响应缺少 campaign');
            }
            return {
                campaignId: id,
                campaign: this.cloneCopyData(campaign),
                response: json
            };
        },

        async findLeadBlackCrowdList(campaignId, authContext = {}) {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) throw new Error('计划ID无效');
            const query = new URLSearchParams({
                csrfId: String(authContext?.csrfId || ''),
                bizCode: 'onebpAdStrategyLiuZi'
            });
            const url = `https://one.alimama.com/blackCrowd/findList.json?${query.toString()}`;
            const payload = {
                bizCode: 'onebpAdStrategyLiuZi',
                crowdBindQueryList: [{
                    campaignId: String(id)
                }],
                csrfId: String(authContext?.csrfId || ''),
                loginPointId: String(authContext?.loginPointId || '')
            };
            const json = await OneApiTransport.postJson(url, payload, {
                actionName: '读取线索推广过滤人群失败',
                businessErrorMessage: '读取线索推广过滤人群失败'
            });
            return {
                campaignId: id,
                crowdList: this.extractBlackCrowdListFromResponse(json, id),
                response: json
            };
        },

        prepareLeadBlackCrowdListForCampaign(crowdList = [], campaignId = '') {
            const id = this.normalizeCampaignId(campaignId);
            return (Array.isArray(crowdList) ? crowdList : []).map((item) => {
                const cloned = this.cloneCopyData(item);
                if (!this.isPlainRecord(cloned)) return cloned;
                cloned.campaignId = String(id);
                cloned.bizCode = 'onebpAdStrategyLiuZi';
                if (this.isPlainRecord(cloned.campaign)) {
                    cloned.campaign.campaignId = Number(id);
                    cloned.campaign.bizCode = 'onebpAdStrategyLiuZi';
                    cloned.campaign.campaignBizCode = 'onebpAdStrategyLiuZi';
                }
                return cloned;
            });
        },

        async modifyLeadBlackCrowdList(campaignId, crowdList = [], authContext = {}) {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) throw new Error('计划ID无效');
            const { startTime, endTime } = this.getDisplayCrowdDateRange();
            const query = new URLSearchParams({
                csrfId: String(authContext?.csrfId || ''),
                bizCode: 'onebpAdStrategyLiuZi'
            });
            const url = `https://one.alimama.com/blackCrowd/batchModify.json?${query.toString()}`;
            const payload = {
                mx_bizCode: 'onebpAdStrategyLiuZi',
                bizCode: 'onebpAdStrategyLiuZi',
                campaignId: String(id),
                tab: 'crowd',
                startTime,
                endTime,
                crowdList: this.prepareLeadBlackCrowdListForCampaign(crowdList, id),
                csrfId: String(authContext?.csrfId || ''),
                loginPointId: String(authContext?.loginPointId || '')
            };
            const json = await OneApiTransport.postJson(url, payload, {
                actionName: '批量修改线索推广屏蔽人群失败',
                businessErrorMessage: '批量修改线索推广屏蔽人群失败'
            });
            return {
                campaignId: id,
                crowdCount: payload.crowdList.length,
                response: json
            };
        },

        async deleteLeadBlackCrowdList(campaignId, crowdList = [], authContext = {}) {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) throw new Error('计划ID无效');
            const prepared = this.prepareLeadBlackCrowdListForCampaign(crowdList, id);
            if (!prepared.length) {
                return {
                    campaignId: id,
                    crowdCount: 0,
                    skipped: true
                };
            }
            const { startTime, endTime } = this.getDisplayCrowdDateRange();
            const query = new URLSearchParams({
                csrfId: String(authContext?.csrfId || ''),
                bizCode: 'onebpAdStrategyLiuZi'
            });
            const url = `https://one.alimama.com/blackCrowd/batchDelete.json?${query.toString()}`;
            const payload = {
                mx_bizCode: 'onebpAdStrategyLiuZi',
                bizCode: 'onebpAdStrategyLiuZi',
                campaignId: String(id),
                tab: 'crowd',
                startTime,
                endTime,
                crowdList: prepared,
                csrfId: String(authContext?.csrfId || ''),
                loginPointId: String(authContext?.loginPointId || '')
            };
            const json = await OneApiTransport.postJson(url, payload, {
                actionName: '批量删除线索推广屏蔽人群失败',
                businessErrorMessage: '批量删除线索推广屏蔽人群失败'
            });
            return {
                campaignId: id,
                crowdCount: payload.crowdList.length,
                response: json
            };
        },

        async syncLeadBlackCrowdListForCampaign(campaignId, newCrowdList = [], oldCrowdList = [], authContext = {}) {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) throw new Error('计划ID无效');
            const preparedNew = this.prepareLeadBlackCrowdListForCampaign(newCrowdList, id);
            const deleteList = this.getBlackCrowdDeleteList(oldCrowdList, newCrowdList);
            const results = [];
            if (preparedNew.length) {
                results.push(await this.modifyLeadBlackCrowdList(id, preparedNew, authContext));
            }
            if (deleteList.length) {
                results.push(await this.deleteLeadBlackCrowdList(id, deleteList, authContext));
            }
            const verification = await this.verifyLeadBlackCrowdListSynced(id, newCrowdList, authContext);
            return {
                campaignId: id,
                modifyCount: preparedNew.length,
                deleteCount: deleteList.length,
                verifiedCount: verification.crowdList.length,
                results
            };
        },

        extractDialogBlackCrowdList(payload = {}) {
            const candidates = [
                payload?.modifyData?.blackCrowdList,
                payload?.allData?.blackCrowdList,
                payload?.data?.modifyData?.blackCrowdList,
                payload?.data?.allData?.blackCrowdList,
                payload?.blackCrowdList,
                payload?.crowdList
            ];
            for (let i = 0; i < candidates.length; i++) {
                if (Array.isArray(candidates[i])) return candidates[i].map(item => this.cloneCopyData(item));
            }
            return [];
        },

        getPageMagix() {
            if (window.Magix?.Vframe?.all) return Promise.resolve(window.Magix);
            if (!window.seajs || typeof window.seajs.use !== 'function') return Promise.resolve(null);
            return new Promise((resolve) => {
                try {
                    window.seajs.use(['magix'], (magixRef) => resolve(magixRef || null));
                } catch (err) {
                    resolve(null);
                }
            });
        },

        findMagixModalVframe(magixRef = null) {
            const Vframe = magixRef?.Vframe;
            if (!Vframe || typeof Vframe.all !== 'function') return null;
            const all = Vframe.all() || {};
            const preferredIds = [
                'universalBP_common_layout_main_content_display_campaign_list',
                'universalBP_common_layout_main_content',
                'universalBP_common_layout',
                'app'
            ];
            const isUsable = (vf) => {
                if (!vf || typeof vf.invoke !== 'function') return false;
                const view = vf.$v;
                return !!(view && typeof view.mxModal === 'function');
            };
            for (let i = 0; i < preferredIds.length; i++) {
                const vf = typeof Vframe.get === 'function' ? Vframe.get(preferredIds[i]) : all[preferredIds[i]];
                if (isUsable(vf)) return vf;
            }
            return Object.keys(all).map(id => all[id]).find(isUsable) || null;
        },

        getMagixViewOptions(vf = null) {
            const view = vf?.$v;
            if (!view) return null;
            if (this.isPlainRecord(view.viewOptions)) return view.viewOptions;
            if (typeof view.updater?.get === 'function') {
                const options = view.updater.get('viewOptions');
                if (this.isPlainRecord(options)) return options;
            }
            if (this.isPlainRecord(view.updater?.$d?.viewOptions)) return view.updater.$d.viewOptions;
            return null;
        },

        findDisplayCampaignListVframe(magixRef = null) {
            const Vframe = magixRef?.Vframe;
            if (!Vframe || typeof Vframe.all !== 'function') return null;
            const all = Vframe.all() || {};
            const preferredId = 'universalBP_common_layout_main_content_display_campaign_list';
            const isUsable = (vf, id = '') => {
                if (!vf || typeof vf.invoke !== 'function') return false;
                const view = vf.$v;
                if (!(view && typeof view.mxModal === 'function')) return false;
                const options = this.getMagixViewOptions(vf);
                if (options?.biz?.code === 'onebpDisplay' && Array.isArray(options?.batchOperList)) {
                    return true;
                }
                const root = id ? document.getElementById(id) : null;
                return !!root?.getAttribute('mx-view')?.includes('onebp/views/pages/manage/display/campaign-list');
            };
            const preferred = typeof Vframe.get === 'function' ? Vframe.get(preferredId) : all[preferredId];
            if (isUsable(preferred, preferredId)) return preferred;
            const ids = Object.keys(all);
            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                if (isUsable(all[id], id)) return all[id];
            }
            return null;
        },

        getCampaignListPathByBizCode(bizCode = '') {
            const normalizedBizCode = this.normalizeBizCode(bizCode) || this.getCurrentCampaignBizCode() || this.DEFAULT_BIZ_CODE;
            if (normalizedBizCode === 'onebpDisplay') return 'display';
            if (normalizedBizCode === 'onebpSite') return 'onesite';
            if (normalizedBizCode === 'onebpAdStrategyLiuZi') return 'hky';
            return 'search';
        },

        findCampaignListVframe(magixRef = null, bizCode = '') {
            const Vframe = magixRef?.Vframe;
            if (!Vframe || typeof Vframe.all !== 'function') return null;
            const all = Vframe.all() || {};
            const listPath = this.getCampaignListPathByBizCode(bizCode);
            const preferredId = `universalBP_common_layout_main_content_${listPath}_campaign_list`;
            const expectedViewPath = `onebp/views/pages/manage/${listPath}/campaign-list`;
            const isUsable = (vf, id = '') => {
                if (!vf || typeof vf.invoke !== 'function') return false;
                const root = id ? document.getElementById(id) : null;
                const rootView = String(root?.getAttribute('mx-view') || '');
                const vfPath = String(vf.path || vf.$v?.path || vf.$v?.tmpl || '');
                return rootView.includes(expectedViewPath) || vfPath.includes(expectedViewPath);
            };
            const preferred = typeof Vframe.get === 'function' ? Vframe.get(preferredId) : all[preferredId];
            if (isUsable(preferred, preferredId)) return preferred;
            const ids = Object.keys(all);
            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                if (isUsable(all[id], id)) return all[id];
            }
            return null;
        },

        async refreshCampaignListVframe(bizCode = '') {
            const magixRef = await this.getPageMagix();
            const vf = this.findCampaignListVframe(magixRef, bizCode);
            if (!vf || typeof vf.invoke !== 'function') return false;
            const methods = ['render', 'asyncRenderData'];
            for (const method of methods) {
                try {
                    const result = vf.invoke(method, []);
                    if (result && typeof result.then === 'function') await result;
                    return true;
                } catch (err) {
                    // Try the next official list render method before reporting fallback.
                }
            }
            return false;
        },

        triggerCampaignListSearchRefresh() {
            const input = this.findCopySuccessPlanNameSearchInput();
            if (!(input instanceof HTMLInputElement) && !(input instanceof HTMLTextAreaElement)) return false;
            try {
                input.focus({ preventScroll: true });
            } catch (err) {
                input.focus();
            }
            this.dispatchCopySuccessSearchEnter(input);
            return true;
        },

        async refreshCampaignListOnlyNow({ bizCode = '', reason = '批量操作' } = {}) {
            const targetBizCode = this.normalizeBizCode(bizCode) || this.getCurrentCampaignBizCode() || this.DEFAULT_BIZ_CODE;
            const vframeTriggered = await this.refreshCampaignListVframe(targetBizCode);
            const searchTriggered = vframeTriggered ? false : this.triggerCampaignListSearchRefresh();
            if (searchTriggered || vframeTriggered) {
                Logger.log(`✅ ${reason}后已刷新计划列表`);
                return true;
            }
            Logger.log(`⚠️ ${reason}已完成，但未找到可复用的原生列表刷新入口，请手动刷新计划列表`, true);
            return false;
        },

        refreshCampaignListOnly(options = {}) {
            this.scheduleCampaignListRefresh(options);
        },

        openDisplayBlackCrowdEditorModal({ campaignId, campaignName = '', crowdList = [], targetIds = [], oldCrowdMap = {}, authContext = {} } = {}) {
            return this.getPageMagix().then((magixRef) => {
                const vf = this.findMagixModalVframe(magixRef);
                if (!vf) {
                    throw new Error('未找到官方弹窗宿主，请刷新页面后重试');
                }
                const sourceId = this.normalizeCampaignId(campaignId);
                const ids = (Array.isArray(targetIds) ? targetIds : [])
                    .map(id => this.normalizeCampaignId(id))
                    .filter(Boolean);
                const sourceCrowdList = Array.isArray(crowdList) ? crowdList.map(item => this.cloneCopyData(item)) : [];
                const campaign = {
                    bizCode: 'onebpDisplay',
                    campaignId: String(sourceId),
                    campaignName: campaignName || '',
                    blackCrowdList: sourceCrowdList
                };
                const adcConfigs = [{
                    code: 'b_onebp_main_step_one_campaign_budget',
                    filterCodes: ['campaignCrowdFilterList']
                }];
                const operation = {
                    code: 'changeCampaignCrowdFilterList'
                };
                const enterCallback = async (payload = {}) => {
                    const nextCrowdList = this.extractDialogBlackCrowdList(payload);
                    try {
                        const results = [];
                        const errors = [];
                        for (const id of ids) {
                            try {
                                const oldCrowdList = Array.isArray(oldCrowdMap[id])
                                    ? oldCrowdMap[id]
                                    : (await this.findDisplayBlackCrowdList(id, authContext)).crowdList;
                                results.push(await this.syncDisplayBlackCrowdListForCampaign(id, nextCrowdList, oldCrowdList, authContext));
                            } catch (err) {
                                errors.push(`计划 ${id}：${err?.message || '修改失败'}`);
                            }
                        }
                        const successCount = results.length;
                        if (errors.length) {
                            Logger.log(`⚠️ 批量修改屏蔽人群部分失败：成功 ${successCount} 个，失败 ${errors.length} 个，原因：${errors.join('；')}`, true);
                            return;
                        }
                        Logger.log(`✅ 批量修改屏蔽人群完成：已同步并回查确认 ${successCount} 个计划，过滤人群 ${nextCrowdList.length} 个`);
                        this.refreshCampaignListOnly({
                            bizCode: 'onebpDisplay',
                            reason: '批量修改屏蔽人群'
                        });
                    } catch (err) {
                        Logger.log(`⚠️ 批量修改屏蔽人群失败：${err?.message || err}`, true);
                    }
                };
                vf.invoke('mxModal', ['onebp/views/pages/manage/campaign/info', {
                    campaign,
                    adcConfigs,
                    operation,
                    enterCallback
                }, {
                    header: {
                        title: '编辑过滤人群'
                    },
                    ladder: {
                        width: 'xlarge'
                    }
                }]);
                return true;
            });
        },

        openLeadBlackCrowdEditorModal({ campaignId, campaignName = '', campaign = {}, crowdList = [], targetIds = [], oldCrowdMap = {}, authContext = {} } = {}) {
            return this.getPageMagix().then((magixRef) => {
                const vf = this.findMagixModalVframe(magixRef);
                if (!vf) {
                    throw new Error('未找到官方弹窗宿主，请刷新页面后重试');
                }
                const sourceId = this.normalizeCampaignId(campaignId);
                const ids = (Array.isArray(targetIds) ? targetIds : [])
                    .map(id => this.normalizeCampaignId(id))
                    .filter(Boolean);
                const sourceCrowdList = Array.isArray(crowdList) ? crowdList.map(item => this.cloneCopyData(item)) : [];
                const sourceCampaign = this.isPlainRecord(campaign) ? this.cloneCopyData(campaign) : {};
                sourceCampaign.bizCode = 'onebpAdStrategyLiuZi';
                sourceCampaign.campaignBizCode = 'onebpAdStrategyLiuZi';
                sourceCampaign.campaignId = String(sourceId);
                sourceCampaign.campaignName = sourceCampaign.campaignName || campaignName || '';
                sourceCampaign.blackCrowdList = sourceCrowdList;
                const adcConfigs = [{
                    code: 'b_onebp_main_step_one_campaign_budget',
                    filterCodes: ['campaignCrowdFilterList']
                }];
                const operation = {
                    code: 'changeCampaignCrowdFilterList'
                };
                const enterCallback = async (payload = {}) => {
                    const nextCrowdList = this.extractDialogBlackCrowdList(payload);
                    try {
                        const results = [];
                        const errors = [];
                        for (const id of ids) {
                            try {
                                const oldCrowdList = Array.isArray(oldCrowdMap[id])
                                    ? oldCrowdMap[id]
                                    : (await this.findLeadBlackCrowdList(id, authContext)).crowdList;
                                results.push(await this.syncLeadBlackCrowdListForCampaign(id, nextCrowdList, oldCrowdList, authContext));
                            } catch (err) {
                                errors.push(`计划 ${id}：${err?.message || '修改失败'}`);
                            }
                        }
                        const successCount = results.length;
                        if (errors.length) {
                            Logger.log(`⚠️ 线索推广批量修改屏蔽人群部分失败：成功 ${successCount} 个，失败 ${errors.length} 个，原因：${errors.join('；')}`, true);
                            return;
                        }
                        Logger.log(`✅ 线索推广批量修改屏蔽人群完成：已同步并回查确认 ${successCount} 个计划，过滤人群 ${nextCrowdList.length} 个`);
                        this.refreshCampaignListOnly({
                            bizCode: 'onebpAdStrategyLiuZi',
                            reason: '线索推广批量修改屏蔽人群'
                        });
                    } catch (err) {
                        Logger.log(`⚠️ 线索推广批量修改屏蔽人群失败：${err?.message || err}`, true);
                    }
                };
                vf.invoke('mxModal', ['onebp/views/pages/manage/campaign/info', {
                    campaign: sourceCampaign,
                    adcConfigs,
                    operation,
                    enterCallback
                }, {
                    header: {
                        title: '编辑过滤人群'
                    },
                    ladder: {
                        width: 'xlarge'
                    }
                }]);
                return true;
            });
        },

        getDisplayBatchCrowdCampaignIdList(contexts = []) {
            const seen = new Set();
            return (Array.isArray(contexts) ? contexts : [])
                .map(item => this.normalizeCampaignId(item?.campaignId || ''))
                .filter(Boolean)
                .filter((id) => {
                    if (seen.has(id)) return false;
                    seen.add(id);
                    return true;
                })
                .map((id) => {
                    const numericId = Number(id);
                    return Number.isSafeInteger(numericId) ? numericId : String(id);
                });
        },

        buildDisplayBatchCrowdModalParams(vf = null, campaignIdList = []) {
            const options = this.getMagixViewOptions(vf) || {};
            return {
                biz: options.biz,
                parentParams: options.parentParams,
                parentFilters: options.parentFilters,
                detailMap: options.detailMap,
                adcConfig: options.adcConfig,
                infoList: options.infoList,
                fieldList: options.fieldList,
                batchOperList: options.batchOperList,
                campaignIdList,
                tab: 'crowd',
                disabledTitle: '',
                disabledTip: ''
            };
        },

        getDisplayBatchCrowdModalOptions() {
            return {
                mask: true,
                contentScroll: true,
                closable: true,
                blankSpaceClosable: true,
                header: {
                    title: '批量编辑人群'
                },
                footer: {
                    enter: false,
                    cancel: false
                },
                ladder: {
                    width: 'xlarge'
                },
                full: true
            };
        },

        isDisplayBlackCrowdEditorDialogOpen() {
            return Array.from(document.querySelectorAll('[id^="wrapper_dlg_"], [id^="dlg_"], body *')).some((el) => {
                if (!(el instanceof HTMLElement) || !this.isElementVisible(el)) return false;
                const rect = el.getBoundingClientRect();
                if (rect.width < 300 || rect.height < 120) return false;
                const text = String(el.innerText || el.textContent || '').replace(/\s+/g, '');
                return text.includes('编辑过滤人群')
                    && text.includes('设置过滤人群')
                    && text.includes('确定')
                    && text.includes('取消');
            });
        },

        isDisplayNativeBatchCrowdDrawerOpen() {
            return Array.from(document.querySelectorAll('body *')).some((el) => {
                if (!(el instanceof HTMLElement) || !this.isElementVisible(el)) return false;
                const rect = el.getBoundingClientRect();
                if (rect.width < 240 || rect.height < 120) return false;
                const text = String(el.innerText || el.textContent || '').replace(/\s+/g, '');
                return text.includes('批量编辑人群')
                    && text.includes('添加人群')
                    && text.includes('批量修改状态');
            });
        },

        async openDisplayNativeBatchCrowdDrawer(contexts = []) {
            const selected = Array.isArray(contexts) ? contexts : [];
            if (!selected.length) {
                Logger.log('⚠️ 请先勾选需要批量处理的计划', true);
                return;
            }
            const campaignIdList = this.getDisplayBatchCrowdCampaignIdList(selected);
            if (!campaignIdList.length) {
                Logger.log('⚠️ 未能识别需要批量人群设置的计划ID', true);
                return;
            }
            let opened = false;
            try {
                await this.getPageMagix().then((magixRef) => {
                    const vf = this.findDisplayCampaignListVframe(magixRef);
                    if (!vf) {
                        throw new Error('未找到官方批量编辑人群抽屉宿主，请刷新页面后重试');
                    }
                    const params = this.buildDisplayBatchCrowdModalParams(vf, campaignIdList);
                    const missingKeys = ['biz', 'parentParams', 'adcConfig', 'batchOperList']
                        .filter(key => params[key] == null);
                    if (missingKeys.length) {
                        throw new Error(`官方批量编辑人群参数缺失：${missingKeys.join(', ')}`);
                    }
                    this.closeBatchPlusMenu();
                    vf.invoke('mxModal', [
                        'onebp/views/pages/manage/campaign/batch-show',
                        params,
                        this.getDisplayBatchCrowdModalOptions()
                    ]);
                    opened = true;
                });
            } catch (err) {
                Logger.log(`⚠️ 批量人群设置：${err?.message || err}`, true);
                return;
            }
            for (let i = 0; !this.isDisplayNativeBatchCrowdDrawerOpen() && i < 10; i++) {
                await this.sleep(120);
            }
            if (opened && !this.isDisplayNativeBatchCrowdDrawerOpen()) {
                Logger.log('⚠️ 批量人群设置：已调用官方批量编辑人群抽屉，但未检测到抽屉打开，请重试或刷新页面', true);
                return;
            }
            Logger.log(`✅ 批量人群设置：已打开官方批量编辑人群抽屉，本次共选中 ${campaignIdList.length} 个人群推广计划`);
        },

        async runDisplayBatchShieldCrowd(contexts = []) {
            const selected = Array.isArray(contexts) ? contexts : [];
            if (!selected.length) {
                Logger.log('⚠️ 请先勾选需要批量处理的计划', true);
                return;
            }
            const ids = selected.map(item => this.normalizeCampaignId(item?.campaignId || '')).filter(Boolean);
            if (!ids.length) {
                Logger.log('⚠️ 未能识别需要批量修改屏蔽人群的计划ID', true);
                return;
            }
            const sourceId = ids[0];
            const authContext = this.resolveAuthContext('onebpDisplay');
            const source = await this.findDisplayBlackCrowdList(sourceId, authContext);
            const crowdList = Array.isArray(source?.crowdList) ? source.crowdList : [];
            const sourceContext = selected.find(item => this.normalizeCampaignId(item?.campaignId || '') === sourceId) || selected[0] || {};
            await this.openDisplayBlackCrowdEditorModal({
                campaignId: sourceId,
                campaignName: sourceContext?.campaignName || sourceContext?.name || '',
                crowdList,
                targetIds: ids,
                oldCrowdMap: {
                    [sourceId]: crowdList
                },
                authContext
            });
            for (let i = 0; !this.isDisplayBlackCrowdEditorDialogOpen() && i < 16; i++) {
                await this.sleep(120);
            }
            if (!this.isDisplayBlackCrowdEditorDialogOpen()) {
                Logger.log('⚠️ 批量修改屏蔽人群：已调用官方编辑过滤人群弹窗，但未检测到弹窗打开，请刷新页面后重试', true);
                return;
            }
            Logger.log(`✅ 批量修改屏蔽人群：已打开官方编辑过滤人群弹窗，本次共选中 ${ids.length} 个人群推广计划`);
        },

        async runLeadBatchShieldCrowd(contexts = []) {
            const selected = Array.isArray(contexts) ? contexts : [];
            if (!selected.length) {
                Logger.log('⚠️ 请先勾选需要批量处理的计划', true);
                return;
            }
            const ids = selected.map(item => this.normalizeCampaignId(item?.campaignId || '')).filter(Boolean);
            if (!ids.length) {
                Logger.log('⚠️ 未能识别需要批量修改屏蔽人群的线索推广计划ID', true);
                return;
            }
            const sourceId = ids[0];
            const authContext = this.resolveAuthContext('onebpAdStrategyLiuZi');
            const [source, sourceCampaign] = await Promise.all([
                this.findLeadBlackCrowdList(sourceId, authContext),
                this.findLeadCampaign(sourceId, authContext)
            ]);
            const crowdList = Array.isArray(source?.crowdList) ? source.crowdList : [];
            const sourceContext = selected.find(item => this.normalizeCampaignId(item?.campaignId || '') === sourceId) || selected[0] || {};
            await this.openLeadBlackCrowdEditorModal({
                campaignId: sourceId,
                campaignName: sourceContext?.campaignName || sourceContext?.name || '',
                campaign: sourceCampaign?.campaign || {},
                crowdList,
                targetIds: ids,
                oldCrowdMap: {
                    [sourceId]: crowdList
                },
                authContext
            });
            for (let i = 0; !this.isDisplayBlackCrowdEditorDialogOpen() && i < 16; i++) {
                await this.sleep(120);
            }
            if (!this.isDisplayBlackCrowdEditorDialogOpen()) {
                Logger.log('⚠️ 线索推广批量修改屏蔽人群：已调用官方编辑过滤人群弹窗，但未检测到弹窗打开，请刷新页面后重试', true);
                return;
            }
            Logger.log(`✅ 线索推广批量修改屏蔽人群：已打开官方编辑过滤人群弹窗，本次共选中 ${ids.length} 个线索推广计划`);
        },

        async runDisplayBatchCrowdAction(action = '', contexts = []) {
            if (action === 'crowdSetting') {
                await this.openDisplayNativeBatchCrowdDrawer(contexts);
                return;
            }
            if (action === 'shieldCrowd') {
                await this.runDisplayBatchShieldCrowd(contexts);
                return;
            }
            Logger.log(`⚠️ 未识别的人群推广批量动作：${action || '-'}`, true);
        },

        getNativeBatchActionPatterns(action = '', bizCode = '') {
            const normalizedAction = String(action || '').trim();
            const normalizedBizCode = this.normalizeBizCode(bizCode);
            if (normalizedAction === 'crowdSetting') {
                if (normalizedBizCode === 'onebpAdStrategyLiuZi') {
                    return [/人群过滤/, /高级设置/, /更多/];
                }
                return [/人群设置/, /批量编辑人群/, /精细化人群/, /高级设置/];
            }
            if (normalizedAction === 'shieldCrowd') {
                if (normalizedBizCode === 'onebpAdStrategyLiuZi') {
                    return [/人群过滤/, /高级设置/, /更多/];
                }
                return [/屏蔽人群/, /屏蔽/, /AI点睛/, /高级设置/];
            }
            return [];
        },

        findNativeActionButtonForContext(context = {}, action = '') {
            const rowEl = context?.rowEl instanceof Element ? context.rowEl : null;
            const patterns = this.getNativeBatchActionPatterns(action, context?.bizCode || '');
            if (!rowEl || !patterns.length) return null;
            const scopes = [rowEl];
            let pointer = rowEl.nextElementSibling;
            for (let i = 0; i < 3 && pointer; i++, pointer = pointer.nextElementSibling) {
                scopes.push(pointer);
            }
            for (let i = 0; i < scopes.length; i++) {
                const buttons = Array.from(scopes[i].querySelectorAll('button, a, [role="button"]'));
                const matched = buttons.find((btn) => {
                    if (!(btn instanceof HTMLElement)) return false;
                    if (!this.isElementVisible(btn)) return false;
                    const text = String(btn.innerText || btn.textContent || btn.getAttribute('aria-label') || btn.title || '').replace(/\s+/g, '');
                    return patterns.some(pattern => pattern.test(text));
                });
                if (matched instanceof HTMLElement) return matched;
            }
            return null;
        },

        buildCampaignDetailUrl(context = {}, action = '') {
            const campaignId = this.normalizeCampaignId(context?.campaignId || '');
            if (!campaignId) return '';
            const bizCode = this.normalizeBizCode(context?.bizCode || '') || this.DEFAULT_BIZ_CODE;
            const detailPath = bizCode === 'onebpDisplay'
                ? 'display-detail'
                : (bizCode === 'onebpAdStrategyLiuZi' ? 'hky-detail' : 'search-detail');
            const params = new URLSearchParams({
                mx_bizCode: bizCode,
                bizCode,
                campaignId
            });
            if (action === 'crowdSetting' || action === 'shieldCrowd') {
                params.set('tab', 'crowd');
            }
            return `${window.location.origin}${window.location.pathname}#!/manage/${detailPath}?${params.toString()}`;
        },

        async runBatchOpenNativeAction(action = '', contexts = [], fallbackBizCode = '') {
            const selected = Array.isArray(contexts) ? contexts : [];
            if (!selected.length) {
                Logger.log('⚠️ 请先勾选需要批量处理的计划', true);
                return;
            }
            const target = selected[0];
            const button = this.findNativeActionButtonForContext(target, action);
            const actionLabel = action === 'shieldCrowd' ? '批量修改屏蔽人群' : '批量人群设置';
            if (button) {
                button.click();
                Logger.log(`✅ ${actionLabel}：已打开第 1 个选中计划 ${target.campaignId} 的原生设置入口；本次共选中 ${selected.length} 个，保存后可继续处理下一项`);
                return;
            }
            const url = this.buildCampaignDetailUrl(target, action);
            if (url) {
                window.open(url, '_blank', 'noopener');
                Logger.log(`✅ ${actionLabel}：未在当前行找到原生按钮，已打开计划 ${target.campaignId} 的详情页；本次共选中 ${selected.length} 个`);
                return;
            }
            Logger.log(`⚠️ ${actionLabel}：未能定位可打开的原生设置入口`, true);
        },

        async runBatchPlusAction(action = '', bizCode = '', triggerEl = null) {
            const normalizedBizCode = this.normalizeBizCode(bizCode || this.getCurrentCampaignBizCode() || this.DEFAULT_BIZ_CODE) || this.DEFAULT_BIZ_CODE;
            const contexts = this.collectSelectedCampaignContexts(normalizedBizCode);
            if (action === 'start' || action === 'pause') {
                await this.runBatchUpdateCampaignStatus(action, contexts, normalizedBizCode, triggerEl);
                return;
            }
            if (action === 'delete') {
                await this.runBatchDeleteCampaigns(contexts, normalizedBizCode, triggerEl);
                return;
            }
            if (action === 'rename') {
                await this.runBatchRenameCampaigns(contexts, normalizedBizCode, triggerEl);
                return;
            }
            if (action === 'shieldCrowd' || action === 'crowdSetting') {
                if (normalizedBizCode === 'onebpDisplay') {
                    await this.runDisplayBatchCrowdAction(action, contexts, normalizedBizCode);
                    return;
                }
                if (normalizedBizCode === 'onebpAdStrategyLiuZi' && action === 'shieldCrowd') {
                    await this.runLeadBatchShieldCrowd(contexts);
                    return;
                }
                await this.runBatchOpenNativeAction(action, contexts, normalizedBizCode, triggerEl);
                return;
            }
            Logger.log(`⚠️ 未识别的批量+动作：${action || '-'}`, true);
        },

        normalizeCampaignId(rawId) {
            return PlanIdentityUtils.normalizeCampaignId(rawId);
        },

        normalizeAdgroupId(rawId) {
            return PlanIdentityUtils.normalizeAdgroupId(rawId);
        },

        normalizeBizCode(rawBizCode) {
            return PlanIdentityUtils.normalizeBizCode(rawBizCode);
        },

        getOppositeBizCode(bizCode) {
            return PlanIdentityUtils.getOppositeBizCode(bizCode);
        },

        normalizeCopyMode(rawMode) {
            const text = String(rawMode || '').trim().toLowerCase();
            if (/^(start|enabled|online|1|开启|在投)$/.test(text)) return 'start';
            if (/^(pause|paused|stop|stopped|offline|0|暂停)$/.test(text)) return 'pause';
            return 'inherit';
        },

        getCopyModeLabel(copyMode) {
            return '复制';
        },

        normalizeCopyBatchCount(value) {
            return Math.min(99, Math.max(1, Number(value) || 1));
        },

        readCopyBatchCount(copyBtn) {
            if (!(copyBtn instanceof Element)) return 1;
            return this.normalizeCopyBatchCount(copyBtn.getAttribute('data-am-copy-batch-count') || copyBtn.dataset?.amCopyBatchCount || 1);
        },

        setCopyBatchCount(campaignId, copyMode, nextCount) {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) return;
            const mode = this.normalizeCopyMode(copyMode);
            const count = this.normalizeCopyBatchCount(nextCount);
            const selector = `.am-campaign-search-btn[data-am-campaign-copy="${mode}"][data-campaign-id="${id}"]`;
            document.querySelectorAll(selector).forEach((btn) => {
                if (!(btn instanceof HTMLElement)) return;
                btn.setAttribute('data-am-copy-batch-count', String(count));
                btn.dataset.amCopyBatchCount = String(count);
                const countBadge = btn.querySelector('[data-am-campaign-copy-count-badge]');
                if (countBadge) countBadge.setAttribute('data-am-campaign-copy-count-badge', String(count));
                const countNum = btn.querySelector('.am-wxt-copy-multi-num');
                if (countNum) countNum.textContent = String(count);
            });
        },

        adjustCopyBatchCount(copyBtn, delta = 1) {
            if (!(copyBtn instanceof Element)) return 1;
            const id = this.normalizeCampaignId(copyBtn.getAttribute('data-campaign-id') || copyBtn.dataset?.campaignId || '');
            const mode = this.normalizeCopyMode(copyBtn.getAttribute('data-am-campaign-copy') || copyBtn.dataset?.amCampaignCopy || '');
            const nextCount = this.normalizeCopyBatchCount(this.readCopyBatchCount(copyBtn) + Number(delta || 0));
            this.setCopyBatchCount(id, mode, nextCount);
            return nextCount;
        },

        normalizePlanNameList(value) {
            const rawList = Array.isArray(value) ? value : [value];
            return rawList
                .map(item => String(item || '').trim())
                .filter(Boolean);
        },

        formatPlanNameListForLog(planNames = []) {
            const names = this.normalizePlanNameList(planNames);
            if (!names.length) return '「-」';
            if (names.length <= 2) return names.map(name => `「${name}」`).join('、');
            return `${names.slice(0, 2).map(name => `「${name}」`).join('、')} 等 ${names.length} 个`;
        },

        rememberCopiedPlanNames(planNames = []) {
            this.normalizePlanNameList(planNames).forEach((name) => {
                if (this.copyPlanNameCache.has(name)) this.copyPlanNameCache.delete(name);
                this.copyPlanNameCache.add(name);
            });
            this.trimCopiedPlanNameCache();
        },

        trimCopiedPlanNameCache() {
            const limit = Math.max(20, Number(this.copyPlanNameCacheLimit) || 120);
            if (!(this.copyPlanNameCache instanceof Set)) return;
            while (this.copyPlanNameCache.size > limit) {
                const oldestName = this.copyPlanNameCache.values().next().value;
                if (!oldestName) break;
                this.copyPlanNameCache.delete(oldestName);
            }
        },

        normalizeCampaignIdList(value) {
            const rawList = Array.isArray(value) ? value : [value];
            return rawList
                .map(item => this.normalizeCampaignId(item))
                .filter(Boolean);
        },

        resolveCopiedCampaignIds(result = {}) {
            const copySource = result?.copySource || {};
            return this.normalizeCampaignIdList(
                copySource.createdCampaignIds
                || result?.postCreateStatus?.campaignIds
                || result?.createdCampaignIds
                || []
            );
        },

        resolvePlanNameCommonPart(planNames = []) {
            const names = this.normalizePlanNameList(planNames);
            if (!names.length) return '';
            let common = names[0];
            for (let i = 1; i < names.length && common; i++) {
                const name = names[i];
                const maxLength = Math.min(common.length, name.length);
                let offset = 0;
                while (offset < maxLength && common[offset] === name[offset]) offset++;
                common = common.slice(0, offset);
            }
            return String(common || '').replace(/[\s_-]+$/g, '').trim();
        },

        resolveCopySuccessSearchKeyword(result = {}, context = {}) {
            const copySource = result?.copySource || {};
            const sourceCampaignName = String(context.sourceCampaignName || copySource.sourceCampaignName || '').trim();
            const newPlanNames = this.normalizePlanNameList(copySource.newPlanNames || copySource.newPlanName || []);
            const normalizedNewPlanNames = newPlanNames
                .map(name => this.normalizeCopyPlanSearchSeed(name))
                .filter(Boolean);
            const newPlanCommonName = this.resolvePlanNameCommonPart(normalizedNewPlanNames);
            if (newPlanCommonName) return newPlanCommonName;
            if (normalizedNewPlanNames[0]) return normalizedNewPlanNames[0];
            const commonName = this.resolvePlanNameCommonPart([sourceCampaignName, ...normalizedNewPlanNames]);
            return commonName || sourceCampaignName || newPlanNames[0] || '';
        },

        resolveManageHashPathByBizCode(bizCode = '') {
            const normalizedBizCode = this.normalizeBizCode(bizCode) || this.DEFAULT_BIZ_CODE;
            if (normalizedBizCode === 'onebpDisplay') return '#!/manage/display';
            if (normalizedBizCode === 'onebpSite') return '#!/manage/onesite';
            if (normalizedBizCode === 'onebpAdStrategyLiuZi') return '#!/manage/hky';
            return '#!/manage/search';
        },

        parseCurrentHashParams() {
            const hash = String(window.location.hash || '');
            const queryIndex = hash.indexOf('?');
            return new URLSearchParams(queryIndex >= 0 ? hash.slice(queryIndex + 1) : '');
        },

        buildCopySuccessSearchUrl(result = {}, context = {}) {
            const searchValue = this.resolveCopySuccessSearchKeyword(result, context);
            if (!searchValue) return '';
            const copySource = result?.copySource || {};
            const currentParams = this.parseCurrentHashParams();
            const bizCode = this.normalizeBizCode(
                context.bizCode
                || copySource.bizCode
                || currentParams.get('bizCode')
                || this.DEFAULT_BIZ_CODE
            ) || this.DEFAULT_BIZ_CODE;
            const nextParams = new URLSearchParams();
            nextParams.set('bizCode', bizCode);
            nextParams.set('offset', '0');
            nextParams.set('searchKey', 'campaignNameLike');
            nextParams.set('searchValue', searchValue);
            nextParams.set('orderField', currentParams.get('orderField') || 'charge');
            nextParams.set('orderBy', currentParams.get('orderBy') || 'desc');
            return `${window.location.origin}${window.location.pathname}${this.resolveManageHashPathByBizCode(bizCode)}?${nextParams.toString()}`;
        },

        updateCopySuccessSearchHash(searchValue = '', result = {}, context = {}) {
            const normalizedSearchValue = String(searchValue || '').trim();
            if (!normalizedSearchValue) return '';
            const copySource = result?.copySource || {};
            const currentParams = this.parseCurrentHashParams();
            const bizCode = this.normalizeBizCode(
                context.bizCode
                || copySource.bizCode
                || currentParams.get('bizCode')
                || this.DEFAULT_BIZ_CODE
            ) || this.DEFAULT_BIZ_CODE;
            const nextParams = new URLSearchParams();
            nextParams.set('bizCode', bizCode);
            nextParams.set('offset', '0');
            nextParams.set('searchKey', 'campaignNameLike');
            nextParams.set('searchValue', normalizedSearchValue);
            nextParams.set('orderField', currentParams.get('orderField') || 'charge');
            nextParams.set('orderBy', currentParams.get('orderBy') || 'desc');
            const nextUrl = `${window.location.origin}${window.location.pathname}${this.resolveManageHashPathByBizCode(bizCode)}?${nextParams.toString()}`;
            try {
                window.history.replaceState(window.history.state, document.title, nextUrl);
            } catch (err) {
                Logger.log(`⚠️ 复制成功后同步搜索地址失败：${err?.message || '未知错误'} `, true);
            }
            return nextUrl;
        },

        isVisibleFormInput(el) {
            if (!(el instanceof HTMLElement)) return false;
            const rect = el.getBoundingClientRect?.();
            if (!rect || rect.width <= 0 || rect.height <= 0) return false;
            const style = window.getComputedStyle?.(el);
            if (!style) return true;
            return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0;
        },

        findCopySuccessPlanNameSearchInput() {
            const inputs = Array.from(document.querySelectorAll('input, textarea'))
                .filter(input => this.isVisibleFormInput(input));
            const describeInput = input => String([
                input.getAttribute('placeholder') || '',
                input.getAttribute('aria-label') || '',
                input.closest('label')?.textContent || '',
                input.parentElement?.textContent || '',
                input.parentElement?.parentElement?.textContent || ''
            ].join(' ')).replace(/\s+/g, ' ').trim();
            const candidates = inputs.map(input => ({ input, text: describeInput(input) }));
            return (
                candidates.find(item => /计划名称/.test(item.text) && /回车搜索/.test(item.text))?.input
                || candidates.find(item => /回车搜索/.test(item.text))?.input
                || candidates.find(item => /计划名称/.test(item.text))?.input
                || null
            );
        },

        setNativeInputValue(input, value = '') {
            if (!(input instanceof HTMLInputElement) && !(input instanceof HTMLTextAreaElement)) return;
            const proto = Object.getPrototypeOf(input);
            const descriptor = proto ? Object.getOwnPropertyDescriptor(proto, 'value') : null;
            if (descriptor?.set) {
                descriptor.set.call(input, value);
            } else {
                input.value = value;
            }
        },

        dispatchCopySuccessSearchEnter(input) {
            if (!(input instanceof HTMLElement)) return;
            const options = {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
            };
            input.dispatchEvent(new KeyboardEvent('keydown', options));
            input.dispatchEvent(new KeyboardEvent('keypress', options));
            input.dispatchEvent(new KeyboardEvent('keyup', options));
        },

        applyCopySuccessPlanNameSearch(searchValue = '', result = {}, context = {}) {
            const normalizedSearchValue = String(searchValue || '').trim();
            if (!normalizedSearchValue) return false;
            const input = this.findCopySuccessPlanNameSearchInput();
            this.updateCopySuccessSearchHash(normalizedSearchValue, result, context);
            if (!(input instanceof HTMLInputElement) && !(input instanceof HTMLTextAreaElement)) return false;
            input.focus();
            this.setNativeInputValue(input, normalizedSearchValue);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            this.dispatchCopySuccessSearchEnter(input);
            return true;
        },

        navigateToCopySuccessSearch(result = {}, context = {}) {
            const searchValue = this.resolveCopySuccessSearchKeyword(result, context);
            if (!searchValue) return;
            const applied = this.applyCopySuccessPlanNameSearch(searchValue, result, context);
            if (!applied) {
                Logger.log(`⚠️ 未找到计划名称搜索框，已仅同步地址搜索条件：${searchValue}`, true);
            }
        },

        buildCopySuccessDialogMessage(result = {}, context = {}) {
            const copySource = result?.copySource || {};
            const sourceCampaignId = this.normalizeCampaignId(context.sourceCampaignId || copySource.sourceCampaignId || '');
            const sourceCampaignName = String(copySource.sourceCampaignName || '').trim();
            const newPlanNames = this.normalizePlanNameList(copySource.newPlanNames || copySource.newPlanName || []);
            const createdCampaignIds = this.resolveCopiedCampaignIds(result);
            const reportedSuccessCount = Math.max(createdCampaignIds.length, Number(result?.successCount || 0));
            const successCount = reportedSuccessCount || newPlanNames.length || Number(context.copyCount || 0);
            const statusText = context.statusText || (copySource.targetOnlineStatus === 1 ? '开启' : '暂停');
            const sourceText = sourceCampaignName
                ? `${sourceCampaignName}${sourceCampaignId ? `（计划ID：${sourceCampaignId}）` : ''}`
                : (sourceCampaignId ? `计划ID：${sourceCampaignId}` : '-');
            const maxRows = Math.max(newPlanNames.length, createdCampaignIds.length, successCount);
            const detailRows = [];
            for (let i = 0; i < maxRows; i++) {
                const name = newPlanNames[i] || '未返回计划名';
                const id = createdCampaignIds[i] || '';
                detailRows.push(`${i + 1}. ${name}${id ? `（计划ID：${id}）` : ''}`);
            }
            const detailText = detailRows.length ? detailRows.join('\n') : '-';
            return [
                '复制计划已成功',
                `本次复制成功：${successCount} 个`,
                `源计划：${sourceText}`,
                `目标状态：${statusText}`,
                '新计划明细：',
                detailText,
                '',
                '点击“确定并搜索”后将在计划名称框搜索公共名称。'
            ].join('\n');
        },

        createCopyFocusTarget(context = {}, fallbackElement = null) {
            const triggerEl = context.triggerEl instanceof HTMLElement ? context.triggerEl : null;
            const fallbackEl = fallbackElement instanceof HTMLElement && fallbackElement !== document.body
                ? fallbackElement
                : null;
            const sourceEl = triggerEl || fallbackEl;
            const campaignId = this.normalizeCampaignId(
                context.campaignId
                || context.sourceCampaignId
                || sourceEl?.getAttribute?.('data-campaign-id')
                || sourceEl?.dataset?.campaignId
                || ''
            );
            const mode = this.normalizeCopyMode(
                context.mode
                || context.copyMode
                || sourceEl?.getAttribute?.('data-am-campaign-copy')
                || sourceEl?.dataset?.amCampaignCopy
                || ''
            );
            return {
                element: triggerEl,
                fallbackElement: fallbackEl,
                campaignId,
                mode
            };
        },

        resolveCopyFocusTargetElement(target = null, allowDisabled = true) {
            const candidates = [];
            if (target instanceof HTMLElement) {
                candidates.push(target);
            } else if (target?.element instanceof HTMLElement) {
                candidates.push(target.element);
            }

            const id = this.normalizeCampaignId(target?.campaignId || '');
            const mode = this.normalizeCopyMode(target?.mode || target?.copyMode || '');
            if (id) {
                const selectors = mode
                    ? [
                        `.am-campaign-search-btn[data-am-campaign-copy="${mode}"][data-campaign-id="${id}"]`,
                        `.am-campaign-search-btn[data-am-campaign-copy][data-campaign-id="${id}"]`
                    ]
                    : [`.am-campaign-search-btn[data-am-campaign-copy][data-campaign-id="${id}"]`];
                selectors.forEach((selector) => {
                    document.querySelectorAll(selector).forEach((node) => {
                        if (node instanceof HTMLElement && !candidates.includes(node)) {
                            candidates.push(node);
                        }
                    });
                });
            }
            if (!(target instanceof HTMLElement) && target?.fallbackElement instanceof HTMLElement && !candidates.includes(target.fallbackElement)) {
                candidates.push(target.fallbackElement);
            }

            return candidates.find((candidate) => {
                if (!(candidate instanceof HTMLElement)) return false;
                if (!candidate.isConnected || typeof candidate.focus !== 'function') return false;
                if (!this.isElementVisible(candidate)) return false;
                if (!allowDisabled && 'disabled' in candidate && candidate.disabled) return false;
                return true;
            }) || null;
        },

        runCopyFocusRestore(target = null, attempt = 0) {
            const element = this.resolveCopyFocusTargetElement(target, true);
            if (!element || ('disabled' in element && element.disabled)) {
                if (attempt < 6) this.scheduleCopyFocusRestore(target, attempt + 1, 50);
                return;
            }
            requestAnimationFrame(() => {
                const readyElement = this.resolveCopyFocusTargetElement(target, false)
                    || this.resolveCopyFocusTargetElement(target, true);
                if (!readyElement) return;
                if (!readyElement.isConnected || typeof readyElement.focus !== 'function') return;
                if ('disabled' in readyElement && readyElement.disabled) {
                    if (attempt < 6) this.scheduleCopyFocusRestore(target, attempt + 1, 50);
                    return;
                }
                readyElement.focus({ preventScroll: true });
            });
        },

        restoreFocusWhenReady(target = null, attempt = 0) {
            this.scheduleCopyFocusRestore(target, attempt, 0);
        },

        showCopySuccessDialogAndRefresh(result = {}, context = {}) {
            const message = this.buildCopySuccessDialogMessage(result, context);
            const oldPopup = document.getElementById('am-campaign-copy-success-popup');
            if (oldPopup) oldPopup.remove();
            const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            const focusBackTarget = this.createCopyFocusTarget(context, previousActiveElement);
            const titleId = 'am-copy-success-title';
            const bodyId = 'am-copy-success-body';

            const popup = document.createElement('div');
            popup.id = 'am-campaign-copy-success-popup';
            popup.setAttribute('role', 'dialog');
            popup.setAttribute('aria-modal', 'true');
            popup.setAttribute('aria-labelledby', titleId);
            popup.setAttribute('aria-describedby', bodyId);

            const card = document.createElement('section');
            card.className = 'am-copy-success-card';
            const header = document.createElement('div');
            header.className = 'am-copy-success-header';
            const icon = document.createElement('span');
            icon.className = 'am-copy-success-icon';
            icon.innerHTML = renderAmIcon('check-circle', { size: 18, strokeWidth: 2.2 });
            const title = document.createElement('h3');
            title.className = 'am-copy-success-title';
            title.id = titleId;
            title.textContent = '复制计划已成功';
            const state = document.createElement('span');
            state.className = 'am-copy-success-state';
            state.textContent = '已完成';
            const body = document.createElement('pre');
            body.id = bodyId;
            body.className = 'am-copy-success-body';
            body.textContent = message.replace(/^复制计划已成功\n?/, '');
            const footer = document.createElement('div');
            footer.className = 'am-copy-success-footer';
            const confirmBtn = document.createElement('button');
            confirmBtn.type = 'button';
            confirmBtn.className = 'am-copy-success-confirm';
            confirmBtn.textContent = '确定并搜索';
            const restoreFocus = () => {
                this.restoreFocusWhenReady(focusBackTarget);
            };
            const closePopup = () => {
                popup.remove();
                restoreFocus();
            };
            confirmBtn.addEventListener('click', () => {
                popup.remove();
                try {
                    this.navigateToCopySuccessSearch(result, context);
                } catch (err) {
                    Logger.log(`⚠️ 复制成功后跳转搜索结果失败：${err?.message || '未知错误'} `, true);
                }
            }, { once: true });
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'am-copy-success-cancel';
            cancelBtn.textContent = '取消';
            cancelBtn.addEventListener('click', () => {
                closePopup();
            }, { once: true });
            popup.addEventListener('keydown', (event) => {
                if (event.key !== 'Escape') return;
                event.preventDefault();
                closePopup();
            });

            header.appendChild(icon);
            header.appendChild(title);
            header.appendChild(state);
            footer.appendChild(confirmBtn);
            footer.appendChild(cancelBtn);
            card.appendChild(header);
            card.appendChild(body);
            card.appendChild(footer);
            popup.appendChild(card);
            document.body.appendChild(popup);
            requestAnimationFrame(() => confirmBtn.focus());
        },

        collectVisibleCampaignPlanNames(root = document) {
            const out = new Set();
            const pushName = (value = '') => {
                const name = String(value || '').replace(/\s+/g, ' ').trim();
                if (!name || /^\d+$/.test(name) || name.length > 120) return;
                out.add(name);
            };
            if (root?.querySelectorAll) {
                root.querySelectorAll('a[href*="campaignId="], a[href*="campaign_id="], [data-campaign-name], [campaignname], [class*="campaign-name"], [class*="campaignName"], [class*="plan-name"], [class*="planName"]').forEach((node) => {
                    pushName(node.getAttribute?.('data-campaign-name') || node.getAttribute?.('campaignname') || node.getAttribute?.('title') || node.textContent || '');
                });
            }
            this.copyPlanNameCache.forEach(name => pushName(name));
            return Array.from(out);
        },

        normalizeCopyPlanSearchSeed(planName = '') {
            let seed = String(planName || '').replace(/\s+/g, ' ').trim();
            if (!seed) return '';
            if (/(?:_\d{8}_\d{6}|_\d{8}|\d{14})$/.test(seed)) return seed;
            seed = seed.replace(/_\d+$/, '');
            return seed || String(planName || '').replace(/\s+/g, ' ').trim();
        },

        extractCampaignListFromPayload(payload = {}) {
            const data = payload?.data || payload || {};
            const candidates = [
                data?.list,
                data?.result,
                data?.records,
                data?.campaignList,
                payload?.list,
                payload?.result,
                payload?.records
            ];
            for (let i = 0; i < candidates.length; i++) {
                if (Array.isArray(candidates[i])) return candidates[i];
            }
            if (Array.isArray(data?.page?.list)) return data.page.list;
            return [];
        },

        findCampaignInListPayload(payload = {}, campaignId = '') {
            const targetId = this.normalizeCampaignId(campaignId);
            if (!targetId) return {};
            return this.extractCampaignListFromPayload(payload)
                .find(item => this.normalizeCampaignId(item?.campaignId || item?.id || '') === targetId) || {};
        },

        async collectRemoteCampaignPlanNames(bizCode, authContext, sourcePlanName = '') {
            const targetBizCode = this.normalizeBizCode(bizCode) || authContext?.bizCode || this.DEFAULT_BIZ_CODE;
            const query = new URLSearchParams({
                csrfId: String(authContext?.csrfId || ''),
                bizCode: targetBizCode
            });
            const url = `https://one.alimama.com/campaign/horizontal/findPage.json?${query.toString()}`;
            const basePayload = {
                mx_bizCode: targetBizCode,
                bizCode: targetBizCode,
                offset: 0,
                pageSize: 200,
                orderField: '',
                orderBy: '',
                queryRuleAuto: '1',
                adgroupRequired: false,
                adzoneRequired: false,
                csrfId: String(authContext?.csrfId || ''),
                loginPointId: String(authContext?.loginPointId || '')
            };
            const searchSeed = this.normalizeCopyPlanSearchSeed(sourcePlanName);
            if (searchSeed) {
                basePayload.searchKey = 'campaignNameLike';
                basePayload.searchValue = searchSeed;
            }
            try {
                const json = await OneApiTransport.postJson(url, basePayload, {
                    actionName: '查询计划名称失败',
                    businessErrorMessage: '查询计划名称失败',
                    allowBusinessError: true
                });
                return this.extractCampaignListFromPayload(json)
                    .map(item => String(item?.campaignName || item?.name || '').replace(/\s+/g, ' ').trim())
                    .filter(Boolean);
            } catch (err) {
                Logger.log(`⚠️ 查询已有计划名失败，继续使用页面可见名称：${err?.message || '未知错误'} `, true);
                return [];
            }
        },

        async queryCampaignListById(campaignId, bizCode, authContext) {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) return {};
            const targetBizCode = this.normalizeBizCode(bizCode) || authContext?.bizCode || this.DEFAULT_BIZ_CODE;
            const query = new URLSearchParams({
                csrfId: String(authContext?.csrfId || ''),
                bizCode: targetBizCode
            });
            const url = `https://one.alimama.com/campaign/horizontal/findPage.json?${query.toString()}`;
            const payload = {
                mx_bizCode: targetBizCode,
                bizCode: targetBizCode,
                offset: 0,
                pageSize: 20,
                orderField: '',
                orderBy: '',
                queryRuleAuto: '1',
                adgroupRequired: false,
                adzoneRequired: false,
                searchKey: 'campaignId',
                searchValue: id,
                campaignId: id,
                campaignIdList: [id],
                csrfId: String(authContext?.csrfId || ''),
                loginPointId: String(authContext?.loginPointId || '')
            };
            const json = await OneApiTransport.postJson(url, payload, {
                actionName: '查询计划名称失败',
                businessErrorMessage: '查询计划名称失败',
                allowBusinessError: true
            });
            return this.findCampaignInListPayload(json, id);
        },

        getSceneNameByBizCode(bizCode) {
            const biz = this.normalizeBizCode(bizCode);
            const map = {
                onebpSite: '货品全站推广',
                onebpSearch: '关键词推广',
                onebpDisplay: '人群推广',
                onebpAdStrategyLiuZi: '线索推广'
            };
            return map[biz] || '';
        },

        isPlainRecord(value) {
            return !!value && typeof value === 'object' && !Array.isArray(value);
        },

        cloneCopyData(value) {
            if (!value || typeof value !== 'object') return value;
            try {
                return JSON.parse(JSON.stringify(value));
            } catch {
                return value;
            }
        },

        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
        },

        formatTimeClock(date = new Date()) {
            const hh = String(date.getHours()).padStart(2, '0');
            const mm = String(date.getMinutes()).padStart(2, '0');
            const ss = String(date.getSeconds()).padStart(2, '0');
            return `${hh}:${mm}:${ss}`;
        },

        ensureConcurrentLogPopup() {
            if (this.concurrentLogPopup && this.concurrentLogPopup.isConnected) return this.concurrentLogPopup;
            let popup = document.getElementById('am-campaign-concurrent-log-popup');
            if (!(popup instanceof HTMLElement)) {
                popup = document.createElement('div');
                popup.id = 'am-campaign-concurrent-log-popup';
                document.body.appendChild(popup);
            }
            if (!popup.querySelector('.am-concurrent-log-card[aria-labelledby="am-concurrent-log-title"]')) {
                popup.setAttribute('aria-hidden', 'true');
                popup.innerHTML = `
                    <div class="am-concurrent-log-card" role="dialog" aria-modal="true" aria-labelledby="am-concurrent-log-title" aria-describedby="am-concurrent-log-status">
                        <div class="am-concurrent-log-header">
                            <div class="am-concurrent-log-heading">
                                <span class="am-concurrent-log-icon" aria-hidden="true">${renderAmIcon('campaign-concurrent-start', { size: 16, strokeWidth: 2.2 })}</span>
                                <h3 class="am-concurrent-log-title" id="am-concurrent-log-title">并发开启执行日志</h3>
                            </div>
                            <button type="button" class="am-concurrent-log-close" aria-label="关闭并发日志">${renderAmIcon('close', { size: 16, strokeWidth: 2.2 })}</button>
                        </div>
                        <div class="am-concurrent-log-status is-running" id="am-concurrent-log-status" role="status" aria-live="polite">执行中...</div>
                        <div class="am-concurrent-log-body" id="am-concurrent-log-body" role="log" aria-live="polite" aria-relevant="additions text" aria-label="并发开启日志明细" tabindex="0"></div>
                    </div>
                `;
            }
            this.concurrentLogPopup = popup;
            this.concurrentLogTitleEl = popup.querySelector('#am-concurrent-log-title');
            this.concurrentLogStatusEl = popup.querySelector('#am-concurrent-log-status');
            this.concurrentLogBodyEl = popup.querySelector('#am-concurrent-log-body');
            const closeBtn = popup.querySelector('.am-concurrent-log-close');
            if (closeBtn && !closeBtn.dataset.amBound) {
                closeBtn.dataset.amBound = '1';
                closeBtn.addEventListener('click', () => this.closeConcurrentLogPopup());
            }
            return popup;
        },

        closeConcurrentLogPopup({ restoreFocus = true } = {}) {
            const popup = this.concurrentLogPopup;
            if (popup instanceof HTMLElement) {
                popup.style.display = 'none';
                popup.setAttribute('aria-hidden', 'true');
            }
            if (this.concurrentLogKeydownHandler) {
                document.removeEventListener('keydown', this.concurrentLogKeydownHandler, true);
                this.concurrentLogKeydownHandler = null;
            }
            const focusBackEl = this.concurrentLogFocusBackEl;
            this.concurrentLogFocusBackEl = null;
            if (restoreFocus && focusBackEl instanceof HTMLElement && focusBackEl.isConnected && typeof focusBackEl.focus === 'function') {
                requestAnimationFrame(() => focusBackEl.focus({ preventScroll: true }));
            }
        },

        openConcurrentLogPopup(campaignId, itemId = '', triggerEl = null) {
            const popup = this.ensureConcurrentLogPopup();
            if (!(popup instanceof HTMLElement)) return;
            this.concurrentLogFocusBackEl = triggerEl instanceof HTMLElement
                ? triggerEl
                : (document.activeElement instanceof HTMLElement ? document.activeElement : null);
            popup.style.display = 'flex';
            popup.setAttribute('aria-hidden', 'false');
            if (this.concurrentLogTitleEl) {
                this.concurrentLogTitleEl.textContent = `并发开启执行日志 - 计划${campaignId}${itemId ? ` / 商品${itemId}` : ''}`;
            }
            if (this.concurrentLogBodyEl) {
                this.concurrentLogBodyEl.innerHTML = '';
            }
            this.setConcurrentLogStatus('执行中：正在识别商品计划并准备并发开启', 'running');
            if (!this.concurrentLogKeydownHandler) {
                this.concurrentLogKeydownHandler = (event) => {
                    if (event.key !== 'Escape') return;
                    if (!(this.concurrentLogPopup instanceof HTMLElement)) return;
                    if (this.concurrentLogPopup.style.display === 'none') return;
                    event.preventDefault();
                    this.closeConcurrentLogPopup();
                };
                document.addEventListener('keydown', this.concurrentLogKeydownHandler, true);
            }
            const closeBtn = popup.querySelector('.am-concurrent-log-close');
            if (closeBtn instanceof HTMLElement) {
                requestAnimationFrame(() => closeBtn.focus({ preventScroll: true }));
            }
        },

        setConcurrentLogStatus(text, level = 'running') {
            this.ensureConcurrentLogPopup();
            if (!(this.concurrentLogStatusEl instanceof HTMLElement)) return;
            const normalizedLevel = ['running', 'success', 'warning', 'error'].includes(level) ? level : 'running';
            this.concurrentLogStatusEl.className = `am-concurrent-log-status is-${normalizedLevel}`;
            this.concurrentLogStatusEl.textContent = String(text || '').trim() || '执行中...';
        },

        appendConcurrentLog(message, level = 'info') {
            this.ensureConcurrentLogPopup();
            if (!(this.concurrentLogBodyEl instanceof HTMLElement)) return;
            const line = document.createElement('div');
            const normalizedLevel = ['info', 'warn', 'error', 'success'].includes(level) ? level : 'info';
            line.className = `am-concurrent-log-line is-${normalizedLevel}`;
            line.textContent = `[${this.formatTimeClock()}] ${String(message || '').trim()}`;
            this.concurrentLogBodyEl.appendChild(line);
            this.concurrentLogBodyEl.scrollTop = this.concurrentLogBodyEl.scrollHeight;
        },

        isInIgnoredArea(el) {
            if (!(el instanceof Element)) return true;
            return !!el.closest(this.IGNORE_SELECTOR);
        },

        parseBizCodeFromRaw(raw) {
            return PlanIdentityUtils.parseBizCodeFromRaw(raw);
        },

        getCurrentCampaignBizCode() {
            const fromQuery = this.parseBizCodeFromRaw(window.location.href) || this.parseBizCodeFromRaw(window.location.hash);
            if (fromQuery) return fromQuery;
            const route = `${window.location.hash || ''} ${window.location.href || ''}`.toLowerCase();
            if (/#\!\/manage\/display(?:[\?#/]|$)|#\!\/manage\/display-detail(?:[\?#/]|$)/.test(route)) return 'onebpDisplay';
            if (/#\!\/manage\/hky(?:[\?#/]|$)|#\!\/manage\/hky-detail(?:[\?#/]|$)/.test(route)) return 'onebpAdStrategyLiuZi';
            if (/#\!\/manage\/onesite(?:[\?#/]|$)|#\!\/manage\/onesite-detail(?:[\?#/]|$)/.test(route)) return 'onebpSite';
            if (/#\!\/manage\/search(?:[\?#/]|$)|#\!\/manage\/search-detail(?:[\?#/]|$)/.test(route)) return 'onebpSearch';
            return '';
        },

        inferBizCodeFromElement(el) {
            return PlanIdentityUtils.inferBizCodeFromElement(el);
        },

        getCandidateBizCodes(el) {
            const list = [];
            const push = (value) => {
                const biz = this.normalizeBizCode(value);
                if (!biz) return;
                if (list.includes(biz)) return;
                list.push(biz);
            };
            if (el instanceof Element) {
                push(el.getAttribute('data-biz-code') || '');
                push(el.dataset?.bizCode || '');
            }
            push(this.inferBizCodeFromElement(el));
            push(this.parseBizCodeFromRaw(window.location.href));
            push(this.parseBizCodeFromRaw(window.location.hash));
            if (!list.length) push(this.DEFAULT_BIZ_CODE);
            const opposite = this.getOppositeBizCode(list[0] || '');
            if (opposite) push(opposite);
            this.BIZ_CODE_LIST.forEach(push);
            return list.length ? list : [this.DEFAULT_BIZ_CODE, this.getOppositeBizCode(this.DEFAULT_BIZ_CODE)].filter(Boolean);
        },

        normalizeItemId(rawItemId) {
            return PlanIdentityUtils.normalizeItemId(rawItemId);
        },

        rememberCampaignItemId(campaignId, itemId) {
            const normalizedCampaignId = this.normalizeCampaignId(campaignId);
            const normalizedItemId = this.normalizeItemId(itemId);
            if (!normalizedCampaignId || !normalizedItemId) return;
            this.rememberLocalCampaignItemId(normalizedCampaignId, normalizedItemId);
            PlanIdentityUtils.rememberCampaignItemId(normalizedCampaignId, normalizedItemId);
        },

        getCampaignItemId(campaignId) {
            const normalizedCampaignId = this.normalizeCampaignId(campaignId);
            if (!normalizedCampaignId) return '';
            const localCached = this.normalizeItemId(this.touchLocalCampaignItemId(normalizedCampaignId) || '');
            if (localCached) return localCached;
            const sharedCached = PlanIdentityUtils.getCampaignItemId(normalizedCampaignId);
            if (sharedCached) {
                this.rememberLocalCampaignItemId(normalizedCampaignId, sharedCached);
            }
            return sharedCached;
        },

        rememberLocalCampaignItemId(campaignId, itemId) {
            const normalizedCampaignId = this.normalizeCampaignId(campaignId);
            const normalizedItemId = this.normalizeItemId(itemId);
            if (!normalizedCampaignId || !normalizedItemId) return;
            if (this.campaignItemIdCache.has(normalizedCampaignId)) {
                this.campaignItemIdCache.delete(normalizedCampaignId);
            }
            this.campaignItemIdCache.set(normalizedCampaignId, normalizedItemId);
            this.trimLocalCampaignItemIdCache(normalizedCampaignId);
        },

        touchLocalCampaignItemId(campaignId) {
            const normalizedCampaignId = this.normalizeCampaignId(campaignId);
            if (!normalizedCampaignId || !this.campaignItemIdCache.has(normalizedCampaignId)) return '';
            const itemId = this.campaignItemIdCache.get(normalizedCampaignId);
            this.campaignItemIdCache.delete(normalizedCampaignId);
            this.campaignItemIdCache.set(normalizedCampaignId, itemId);
            this.trimLocalCampaignItemIdCache(normalizedCampaignId);
            return itemId;
        },

        trimLocalCampaignItemIdCache(protectedCampaignId = '') {
            const limit = Math.max(24, Number(this.campaignItemCacheLimit) || 240);
            const normalizedProtectedId = this.normalizeCampaignId(protectedCampaignId);
            if (!(this.campaignItemIdCache instanceof Map)) return;
            for (const key of this.campaignItemIdCache.keys()) {
                if (this.campaignItemIdCache.size <= limit) break;
                if (normalizedProtectedId && key === normalizedProtectedId) continue;
                this.campaignItemIdCache.delete(key);
            }
            for (const key of this.campaignItemIdCache.keys()) {
                if (this.campaignItemIdCache.size <= limit) break;
                this.campaignItemIdCache.delete(key);
            }
        },

        parseItemIdFromRaw(raw) {
            return PlanIdentityUtils.parseItemIdFromRaw(raw);
        },

        inferItemIdFromElement(el, options = {}) {
            return PlanIdentityUtils.inferItemIdFromElement(el, options);
        },

        resolveItemIdFromCandidates(candidates = []) {
            return PlanIdentityUtils.resolveItemIdFromCandidates(candidates);
        },

        extractAdgroupIdsFromCampaignPayload(payload = {}, expectedCampaignId = '') {
            const normalizedCampaignId = this.normalizeCampaignId(expectedCampaignId);
            const campaign = payload?.data?.campaign || payload?.campaign || payload?.data || {};
            const adgroupList = Array.isArray(campaign?.adgroupList) ? campaign.adgroupList : [];
            const dataAdgroupList = Array.isArray(payload?.data?.adgroupList) ? payload.data.adgroupList : [];
            const adgroupIdBuckets = [
                campaign?.adgroupIdList,
                campaign?.adgroupIds,
                payload?.data?.adgroupIdList,
                payload?.data?.adgroupIds,
                payload?.adgroupIdList,
                payload?.adgroupIds
            ];
            const candidates = [
                campaign,
                campaign?.lastAdgroup,
                ...adgroupList,
                ...dataAdgroupList,
                payload?.data?.adgroup
            ];
            const out = [];
            const pushId = (raw) => {
                const id = this.normalizeAdgroupId(raw);
                if (!id) return;
                if (out.includes(id)) return;
                out.push(id);
            };
            candidates.forEach((item) => {
                if (!item || typeof item !== 'object') return;
                const campaignId = this.normalizeCampaignId(item.campaignId || '');
                if (normalizedCampaignId && campaignId && campaignId !== normalizedCampaignId) return;
                pushId(item.adgroupId || item.groupId || item.id || '');
            });
            adgroupIdBuckets.forEach((bucket) => {
                if (Array.isArray(bucket)) {
                    bucket.forEach(pushId);
                    return;
                }
                pushId(bucket);
            });
            return out;
        },

        extractItemIdFromCampaignPayload(payload = {}, expectedCampaignId = '') {
            const normalizedCampaignId = this.normalizeCampaignId(expectedCampaignId);
            const refs = [];
            this.collectCampaignRefsFromNode(payload, refs, {
                depth: 0,
                seen: new WeakSet()
            });
            const normalizedRefs = this.normalizeCampaignRefs(refs);
            normalizedRefs.forEach((item) => {
                this.rememberCampaignItemId(item?.campaignId, item?.itemId || '');
            });
            if (normalizedCampaignId) {
                const selfRef = normalizedRefs.find(item => this.normalizeCampaignId(item?.campaignId) === normalizedCampaignId);
                const selfItemId = this.normalizeItemId(selfRef?.itemId || '');
                if (selfItemId) return selfItemId;
            }
            const campaign = payload?.data?.campaign || payload?.campaign || payload?.data || {};
            const adgroupList = Array.isArray(campaign?.adgroupList) ? campaign.adgroupList : [];
            const scopedAdgroupList = normalizedCampaignId
                ? adgroupList.filter((item) => {
                    const campaignId = this.normalizeCampaignId(item?.campaignId || '');
                    return !campaignId || campaignId === normalizedCampaignId;
                })
                : adgroupList;
            return this.resolveItemIdFromCandidates([
                campaign?.itemId,
                campaign?.materialId,
                campaign?.auctionId,
                campaign?.targetItemId,
                campaign?.targetMaterialId,
                campaign?.itemIdList,
                campaign?.materialIdList,
                campaign?.whiteBoxItemIds,
                campaign?.scopeItems,
                campaign?.material,
                campaign?.lastAdgroup,
                scopedAdgroupList,
                payload?.data?.adgroup,
                payload?.data?.adgroupList
            ]);
        },

        async queryCampaignDetail(campaignId, bizCode, authContext) {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) return { itemId: '', adgroupIds: [] };
            const targetBizCode = this.normalizeBizCode(bizCode) || authContext?.bizCode || this.DEFAULT_BIZ_CODE;
            const query = new URLSearchParams({
                csrfId: String(authContext?.csrfId || ''),
                bizCode: targetBizCode
            });
            const url = `https://one.alimama.com/campaign/get.json?${query.toString()}`;
            const payload = {
                bizCode: targetBizCode,
                campaignId: id,
                csrfId: String(authContext?.csrfId || ''),
                loginPointId: String(authContext?.loginPointId || '')
            };
            const json = await OneApiTransport.postJson(url, payload, {
                actionName: '查询计划详情失败',
                businessErrorMessage: '查询计划详情失败'
            });
            const itemId = this.extractItemIdFromCampaignPayload(json, id);
            const adgroupIds = this.extractAdgroupIdsFromCampaignPayload(json, id);
            if (itemId) this.rememberCampaignItemId(id, itemId);
            return { itemId, adgroupIds, response: json };
        },

        async queryAdgroupDetail(campaignId, adgroupId, bizCode, authContext) {
            const normalizedCampaignId = this.normalizeCampaignId(campaignId);
            const normalizedAdgroupId = this.normalizeAdgroupId(adgroupId);
            if (!normalizedCampaignId || !normalizedAdgroupId) return { itemId: '' };
            const targetBizCode = this.normalizeBizCode(bizCode) || authContext?.bizCode || this.DEFAULT_BIZ_CODE;
            const query = new URLSearchParams({
                csrfId: String(authContext?.csrfId || ''),
                bizCode: targetBizCode
            });
            const url = `https://one.alimama.com/adgroup/get.json?${query.toString()}`;
            const payload = {
                bizCode: targetBizCode,
                campaignId: normalizedCampaignId,
                adgroupId: normalizedAdgroupId,
                csrfId: String(authContext?.csrfId || ''),
                loginPointId: String(authContext?.loginPointId || '')
            };
            const json = await OneApiTransport.postJson(url, payload, {
                actionName: '查询单元详情失败',
                businessErrorMessage: '查询单元详情失败'
            });
            const itemId = this.extractItemIdFromCampaignPayload(json, normalizedCampaignId)
                || this.resolveItemIdFromCandidates([
                    json?.data?.adgroup,
                    json?.data?.adgroup?.material,
                    json?.data?.adgroup?.material?.linkUrl
                ]);
            if (itemId) this.rememberCampaignItemId(normalizedCampaignId, itemId);
            return { itemId, response: json };
        },

        extractCopyCrowdListFromPayload(payload = {}, expectedCampaignId = '', expectedAdgroupId = '') {
            const expectedId = this.normalizeCampaignId(expectedCampaignId);
            const expectedAid = this.normalizeAdgroupId(expectedAdgroupId);
            const data = payload?.data || {};
            const candidates = [
                data?.list,
                data?.result,
                data?.records,
                data?.crowdList,
                payload?.list,
                payload?.result,
                payload?.records,
                payload?.crowdList
            ];
            if (Array.isArray(data?.page?.list)) candidates.push(data.page.list);

            const rows = [];
            candidates.forEach((candidate) => {
                if (Array.isArray(candidate)) {
                    candidate.forEach(item => rows.push(item));
                } else if (this.isPlainRecord(candidate)) {
                    rows.push(candidate);
                }
            });

            const crowdList = [];
            rows.forEach((row) => {
                if (!this.isPlainRecord(row)) return;
                const rowCampaignId = this.normalizeCampaignId(row?.campaignId || row?.campaign?.campaignId || '');
                const rowAdgroupId = this.normalizeAdgroupId(row?.adgroupId || row?.adgroup?.adgroupId || '');
                if (expectedId && rowCampaignId && rowCampaignId !== expectedId) return;
                if (expectedAid && rowAdgroupId && rowAdgroupId !== expectedAid) return;
                if (Array.isArray(row.crowdList)) {
                    row.crowdList.forEach((item) => {
                        if (!this.isPlainRecord(item)) return;
                        const itemCampaignId = this.normalizeCampaignId(item?.campaignId || item?.campaign?.campaignId || '');
                        const itemAdgroupId = this.normalizeAdgroupId(item?.adgroupId || item?.adgroup?.adgroupId || '');
                        if (expectedId && itemCampaignId && itemCampaignId !== expectedId) return;
                        if (expectedAid && itemAdgroupId && itemAdgroupId !== expectedAid) return;
                        crowdList.push(item);
                    });
                    return;
                }
                if (this.isPlainRecord(row.crowd)) {
                    crowdList.push(row);
                    return;
                }
                const directCrowdKey = String(
                    row?.mx_crowdId
                    || row?.crowdId
                    || row?.labelId
                    || row?.crowdName
                    || row?.labelName
                    || row?.name
                    || ''
                ).trim();
                if (directCrowdKey) {
                    crowdList.push(row);
                }
            });
            return crowdList
                .filter(item => this.isPlainRecord(item))
                .map(item => this.cloneCopyData(item));
        },

        async queryCampaignCrowdList(campaignId, bizCode, authContext, adgroupId = '') {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) return { crowdList: [] };
            const normalizedAdgroupId = this.normalizeAdgroupId(adgroupId);
            const targetBizCode = this.normalizeBizCode(bizCode) || authContext?.bizCode || this.DEFAULT_BIZ_CODE;
            const query = new URLSearchParams({
                csrfId: String(authContext?.csrfId || ''),
                bizCode: targetBizCode
            });
            const url = `https://one.alimama.com/crowd/findList.json?${query.toString()}`;
            const payload = {
                bizCode: targetBizCode,
                crowdBindQueryList: [{
                    campaignId: Number(id),
                    ...(normalizedAdgroupId ? { adgroupId: Number(normalizedAdgroupId) } : {})
                }],
                csrfId: String(authContext?.csrfId || ''),
                loginPointId: String(authContext?.loginPointId || '')
            };
            const json = await OneApiTransport.postJson(url, payload, {
                actionName: '查询计划人群失败',
                businessErrorMessage: '查询计划人群失败'
            });
            return {
                crowdList: this.extractCopyCrowdListFromPayload(json, id, normalizedAdgroupId),
                response: json
            };
        },

        extractCopyBidwordListFromPayload(payload = {}, expectedCampaignId = '', expectedAdgroupId = '') {
            const expectedCid = this.normalizeCampaignId(expectedCampaignId);
            const expectedAid = this.normalizeAdgroupId(expectedAdgroupId);
            const data = payload?.data || {};
            const candidates = [
                data?.list,
                data?.result,
                data?.records,
                data?.wordList,
                data?.bidwordList,
                payload?.list,
                payload?.result,
                payload?.records,
                payload?.wordList,
                payload?.bidwordList
            ];
            if (Array.isArray(data?.page?.list)) candidates.push(data.page.list);
            const rows = [];
            candidates.forEach((candidate) => {
                if (Array.isArray(candidate)) {
                    candidate.forEach(item => rows.push(item));
                } else if (this.isPlainRecord(candidate)) {
                    rows.push(candidate);
                }
            });
            const out = [];
            const seen = new Set();
            rows.forEach((row) => {
                if (!this.isPlainRecord(row)) return;
                const rowCampaignId = this.normalizeCampaignId(row?.campaignId || row?.campaign?.campaignId || '');
                const rowAdgroupId = this.normalizeAdgroupId(row?.adgroupId || row?.adgroup?.adgroupId || '');
                if (expectedCid && rowCampaignId && rowCampaignId !== expectedCid) return;
                if (expectedAid && rowAdgroupId && rowAdgroupId !== expectedAid) return;
                const word = String(row.word || row.keyword || row.bidword || row.name || '').trim();
                if (!word || seen.has(word)) return;
                seen.add(word);
                const item = { word };
                [
                    'bidPrice',
                    'price',
                    'matchScope',
                    'status',
                    'onlineStatus',
                    'campaignBidType',
                    'bidStrategyInfo',
                    'bidUpgradeStrategyInfo'
                ].forEach((key) => {
                    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
                        item[key] = this.cloneCopyData(row[key]);
                    }
                });
                out.push(item);
            });
            return out.slice(0, 200);
        },

        async queryBidwordList(campaignId, adgroupId, bizCode, authContext) {
            const normalizedCampaignId = this.normalizeCampaignId(campaignId);
            const normalizedAdgroupId = this.normalizeAdgroupId(adgroupId);
            if (!normalizedCampaignId || !normalizedAdgroupId) return { wordList: [] };
            const targetBizCode = this.normalizeBizCode(bizCode) || authContext?.bizCode || this.DEFAULT_BIZ_CODE;
            const query = new URLSearchParams({
                csrfId: String(authContext?.csrfId || ''),
                bizCode: targetBizCode,
                mx_bizCode: targetBizCode
            });
            const url = `https://one.alimama.com/bidword/findList.json?${query.toString()}`;
            const payload = {
                mx_bizCode: targetBizCode,
                bizCode: targetBizCode,
                offset: 0,
                pageSize: 200,
                orderField: '',
                orderBy: '',
                queryType: '0',
                campaignIdList: [normalizedCampaignId],
                adgroupIdList: [normalizedAdgroupId],
                csrfId: String(authContext?.csrfId || ''),
                loginPointId: String(authContext?.loginPointId || '')
            };
            const json = await OneApiTransport.postJson(url, payload, {
                actionName: '查询关键词明细失败',
                businessErrorMessage: '查询关键词明细失败'
            });
            return {
                wordList: this.extractCopyBidwordListFromPayload(json, normalizedCampaignId, normalizedAdgroupId),
                response: json
            };
        },

        extractCopyWordPackageListFromPayload(payload = {}, expectedCampaignId = '', expectedAdgroupId = '') {
            const expectedCid = this.normalizeCampaignId(expectedCampaignId);
            const expectedAid = this.normalizeAdgroupId(expectedAdgroupId);
            const data = payload?.data || {};
            const candidates = [
                data?.list,
                data?.result,
                data?.records,
                data?.wordPackageList,
                payload?.list,
                payload?.result,
                payload?.records,
                payload?.wordPackageList
            ];
            if (Array.isArray(data?.page?.list)) candidates.push(data.page.list);
            const rows = [];
            candidates.forEach((candidate) => {
                if (Array.isArray(candidate)) {
                    candidate.forEach(item => rows.push(item));
                } else if (this.isPlainRecord(candidate)) {
                    rows.push(candidate);
                }
            });
            const out = [];
            const seen = new Set();
            rows.forEach((row) => {
                if (!this.isPlainRecord(row)) return;
                const rowCampaignId = this.normalizeCampaignId(row?.campaignId || '');
                const rowAdgroupId = this.normalizeAdgroupId(row?.adgroupId || '');
                if (expectedCid && rowCampaignId && rowCampaignId !== expectedCid) return;
                if (expectedAid && rowAdgroupId && rowAdgroupId !== expectedAid) return;
                const name = String(row.wordPackageName || row.packageName || row.name || '').trim();
                const packageId = String(row.wordPackageId ?? row.packageId ?? row.id ?? '').trim();
                if (!name && !packageId) return;
                const key = `${packageId || 'name'}:${name || packageId}`;
                if (seen.has(key)) return;
                seen.add(key);
                const item = {};
                [
                    'wordPackageId',
                    'packageId',
                    'id',
                    'wordPackageName',
                    'packageName',
                    'name',
                    'wordPackageType',
                    'onlineStatus',
                    'status',
                    'bidPrice',
                    'strategyList',
                    'tag'
                ].forEach((field) => {
                    if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
                        item[field] = this.cloneCopyData(row[field]);
                    }
                });
                out.push(item);
            });
            return out.slice(0, 100);
        },

        async queryWordPackageList(campaignId, adgroupId, bizCode, authContext) {
            const normalizedCampaignId = this.normalizeCampaignId(campaignId);
            const normalizedAdgroupId = this.normalizeAdgroupId(adgroupId);
            if (!normalizedCampaignId || !normalizedAdgroupId) return { wordPackageList: [] };
            const targetBizCode = this.normalizeBizCode(bizCode) || authContext?.bizCode || this.DEFAULT_BIZ_CODE;
            const query = new URLSearchParams({
                csrfId: String(authContext?.csrfId || ''),
                bizCode: targetBizCode,
                mx_bizCode: targetBizCode
            });
            const url = `https://one.alimama.com/wordpackage/findList.json?${query.toString()}`;
            const payload = {
                mx_bizCode: targetBizCode,
                bizCode: targetBizCode,
                offset: 0,
                pageSize: 200,
                campaignIdList: [normalizedCampaignId],
                adgroupIdList: [normalizedAdgroupId],
                csrfId: String(authContext?.csrfId || ''),
                loginPointId: String(authContext?.loginPointId || '')
            };
            const json = await OneApiTransport.postJson(url, payload, {
                actionName: '查询关键词词包失败',
                businessErrorMessage: '查询关键词词包失败'
            });
            return {
                wordPackageList: this.extractCopyWordPackageListFromPayload(json, normalizedCampaignId, normalizedAdgroupId),
                response: json
            };
        },

        extractCopyCampaignFromPayload(payload = {}, expectedCampaignId = '') {
            const expectedId = this.normalizeCampaignId(expectedCampaignId);
            const data = payload?.data || {};
            const candidates = [
                data?.campaign,
                payload?.campaign,
                Array.isArray(data?.campaignList) ? data.campaignList[0] : null,
                Array.isArray(payload?.campaignList) ? payload.campaignList[0] : null,
                data
            ];
            for (let i = 0; i < candidates.length; i++) {
                const item = candidates[i];
                if (!this.isPlainRecord(item)) continue;
                const campaignId = this.normalizeCampaignId(item.campaignId || '');
                if (expectedId && campaignId && campaignId !== expectedId) continue;
                if (!campaignId && !item.campaignName && !item.bizCode) continue;
                return this.cloneCopyData(item);
            }
            return {};
        },

        extractCopyAdgroupFromPayload(payload = {}, expectedCampaignId = '', expectedAdgroupId = '') {
            const expectedCid = this.normalizeCampaignId(expectedCampaignId);
            const expectedAid = this.normalizeAdgroupId(expectedAdgroupId);
            const data = payload?.data || {};
            const campaign = data?.campaign || payload?.campaign || {};
            const candidates = [
                Array.isArray(campaign?.adgroupList) ? campaign.adgroupList[0] : null,
                campaign?.lastAdgroup,
                data?.adgroup,
                Array.isArray(data?.adgroupList) ? data.adgroupList[0] : null,
                payload?.adgroup,
                Array.isArray(payload?.adgroupList) ? payload.adgroupList[0] : null
            ];
            for (let i = 0; i < candidates.length; i++) {
                const item = candidates[i];
                if (!this.isPlainRecord(item)) continue;
                const campaignId = this.normalizeCampaignId(item.campaignId || '');
                const adgroupId = this.normalizeAdgroupId(item.adgroupId || item.groupId || item.id || '');
                if (expectedCid && campaignId && campaignId !== expectedCid) continue;
                if (expectedAid && adgroupId && adgroupId !== expectedAid) continue;
                if (!adgroupId && !item.material && !item.adgroupName) continue;
                return this.cloneCopyData(item);
            }
            return {};
        },

        isKeywordAiMaxCampaignEnabled(campaign = {}) {
            if (!this.isPlainRecord(campaign)) return false;
            const aiMaxInfo = this.isPlainRecord(campaign.aiMaxInfo) ? campaign.aiMaxInfo : {};
            const switchValue = campaign.aiMaxSwitch ?? aiMaxInfo.aiMaxSwitch;
            if (switchValue === true || switchValue === 1) return true;
            return /^(1|true|on|开启|启用)$/i.test(String(switchValue ?? '').trim());
        },

        hasKeywordAiMaxDemandSignal(campaign = {}) {
            if (!this.isPlainRecord(campaign)) return false;
            const aiMaxInfo = this.isPlainRecord(campaign.aiMaxInfo) ? campaign.aiMaxInfo : {};
            return [
                aiMaxInfo.aiMaxGenReason,
                aiMaxInfo.aiMaxReason,
                aiMaxInfo.aiMaxDeliveryPlan
            ].some(value => String(value || '').trim());
        },

        extractCopyMaterial(campaign = {}, adgroup = {}) {
            const candidates = [
                adgroup?.material,
                campaign?.material,
                Array.isArray(campaign?.materialList) ? campaign.materialList[0] : null
            ];
            for (let i = 0; i < candidates.length; i++) {
                if (this.isPlainRecord(candidates[i])) return this.cloneCopyData(candidates[i]);
            }
            return {};
        },

        buildCopyItemFromSource(campaign = {}, adgroup = {}, material = {}, fallbackItemId = '') {
            const itemId = this.resolveItemIdFromCandidates([
                fallbackItemId,
                campaign?.itemId,
                campaign?.materialId,
                campaign?.itemIdList,
                campaign?.materialIdList,
                adgroup?.itemId,
                adgroup?.materialId,
                material?.itemId,
                material?.materialId,
                material?.linkUrl
            ]);
            if (!itemId) return null;
            return {
                itemId,
                materialId: this.normalizeItemId(material?.materialId || '') || itemId,
                materialName: String(material?.materialName || campaign?.materialName || `商品${itemId}`).trim(),
                fromTab: material?.fromTab || 'copy',
                linkUrl: material?.linkUrl || '',
                shopId: material?.shopId || '',
                shopName: material?.shopName || '',
                bidCount: material?.bidCount || 0,
                categoryLevel1: material?.categoryLevel1 || ''
            };
        },

        async resolveCopySourcePlan(campaignId, triggerEl, bizCandidates, authContext) {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) throw new Error('计划ID无效');
            const targetBizCode = this.normalizeBizCode(bizCandidates?.[0] || this.inferBizCodeFromElement(triggerEl) || this.DEFAULT_BIZ_CODE);
            const hintedItemId = this.inferItemIdFromElement(triggerEl, {
                allowLocationFallback: false,
                allowBodyFallback: false
            });
            const detail = await this.queryCampaignDetail(id, targetBizCode, authContext);
            let campaign = this.extractCopyCampaignFromPayload(detail?.response || {}, id);
            const guessedName = MagicReport.guessCampaignNameById(id, triggerEl);
            if (campaign && !campaign.campaignName && guessedName) {
                campaign.campaignName = guessedName;
            }
            const adgroupIds = Array.isArray(detail?.adgroupIds) ? detail.adgroupIds : [];
            let adgroup = this.extractCopyAdgroupFromPayload(detail?.response || {}, id);
            let itemId = this.normalizeItemId(detail?.itemId || hintedItemId || '');
            const resolvedAdgroupId = this.normalizeAdgroupId(adgroup?.adgroupId || adgroupIds[0] || '');
            if (resolvedAdgroupId && (targetBizCode === 'onebpSearch' || !this.isPlainRecord(adgroup) || !Object.keys(adgroup).length || !itemId)) {
                const adgroupDetail = await this.queryAdgroupDetail(id, resolvedAdgroupId, targetBizCode, authContext);
                const nextAdgroup = this.extractCopyAdgroupFromPayload(adgroupDetail?.response || {}, id, resolvedAdgroupId);
                if (this.isPlainRecord(nextAdgroup) && Object.keys(nextAdgroup).length) {
                    adgroup = {
                        ...(this.isPlainRecord(adgroup) ? adgroup : {}),
                        ...nextAdgroup
                    };
                }
                itemId = itemId || this.normalizeItemId(adgroupDetail?.itemId || '');
            }
            if (!this.isPlainRecord(campaign) || !Object.keys(campaign).length) {
                throw new Error('未能读取源计划详情');
            }
            if (targetBizCode === 'onebpSearch') {
                const aiMaxEnabled = this.isKeywordAiMaxCampaignEnabled(campaign);
                const currentAdgroupId = this.normalizeAdgroupId(adgroup?.adgroupId || resolvedAdgroupId || '');
                if (currentAdgroupId) {
                    try {
                        const bidwordDetail = await this.queryBidwordList(id, currentAdgroupId, targetBizCode, authContext);
                        const wordList = Array.isArray(bidwordDetail?.wordList) ? bidwordDetail.wordList : [];
                        if (wordList.length) {
                            adgroup.wordList = wordList;
                            Logger.log(`📋 已读取源计划${id}的关键词 ${wordList.length} 个`);
                        }
                    } catch (err) {
                        throw new Error(`查询关键词明细失败，已取消复制：${err?.message || '未知错误'}`);
                    }
                    try {
                        const wordPackageDetail = await this.queryWordPackageList(id, currentAdgroupId, targetBizCode, authContext);
                        const wordPackageList = Array.isArray(wordPackageDetail?.wordPackageList) ? wordPackageDetail.wordPackageList : [];
                        if (wordPackageList.length) {
                            adgroup.wordPackageList = wordPackageList;
                            Logger.log(`📋 已读取源计划${id}的关键词词包 ${wordPackageList.length} 个`);
                        }
                    } catch (err) {
                        throw new Error(`查询关键词词包失败，已取消复制：${err?.message || '未知错误'}`);
                    }
                }
                try {
                    const crowdDetail = await this.queryCampaignCrowdList(
                        id,
                        targetBizCode,
                        authContext,
                        aiMaxEnabled ? '' : currentAdgroupId
                    );
                    const campaignCrowdList = Array.isArray(crowdDetail?.crowdList) ? crowdDetail.crowdList : [];
                    if (campaignCrowdList.length) {
                        if (aiMaxEnabled) {
                            campaign.crowdList = campaignCrowdList;
                            Logger.log(`📋 已读取源计划${id}的 AI点睛需求人群 ${campaignCrowdList.length} 个`);
                        } else if (currentAdgroupId) {
                            adgroup.crowdList = campaignCrowdList;
                            Logger.log(`📋 已读取源计划${id}的关键词人群 ${campaignCrowdList.length} 个`);
                        } else {
                            campaign.crowdList = campaignCrowdList;
                            Logger.log(`📋 已读取源计划${id}的人群 ${campaignCrowdList.length} 个`);
                        }
                    } else if (aiMaxEnabled && this.hasKeywordAiMaxDemandSignal(campaign)) {
                        throw new Error('源计划 AI点睛已生成方案，但未返回需求人群');
                    }
                } catch (err) {
                    if (aiMaxEnabled) {
                        throw new Error(`查询AI点睛需求人群失败，已取消复制：${err?.message || '未知错误'}`);
                    }
                    throw new Error(`查询关键词人群失败，已取消复制：${err?.message || '未知错误'}`);
                }
            }
            const material = this.extractCopyMaterial(campaign, adgroup);
            const item = this.buildCopyItemFromSource(campaign, adgroup, material, itemId);
            if (!item) {
                throw new Error('未能识别源计划商品');
            }
            this.rememberCampaignItemId(id, item.itemId || item.materialId);
            return {
                campaignId: id,
                bizCode: targetBizCode,
                campaign: {
                    ...campaign,
                    campaignId: campaign.campaignId || id,
                    bizCode: campaign.bizCode || targetBizCode
                },
                adgroup,
                material,
                item,
                itemId: item.itemId || item.materialId,
                adgroupId: this.normalizeAdgroupId(adgroup?.adgroupId || adgroupIds[0] || '')
            };
        },

        async resolveItemIdByCampaignId(campaignId, bizCandidates, authContext, fallbackItemId = '', traceMessages = null) {
            const resolved = await PlanIdentityUtils.resolveItemIdByCampaignId(
                campaignId,
                bizCandidates,
                authContext,
                fallbackItemId,
                traceMessages
            );
            const normalizedCampaignId = this.normalizeCampaignId(campaignId);
            const normalizedItemId = this.normalizeItemId(resolved);
            if (normalizedCampaignId && normalizedItemId) {
                this.rememberCampaignItemId(normalizedCampaignId, normalizedItemId);
            }
            return normalizedItemId;
        },

        formatDateYmd(date = new Date()) {
            return PlanIdentityUtils.formatDateYmd(date);
        },

        parseAuthFromObject(source, depth = 0, visited = new WeakSet()) {
            return PlanIdentityUtils.parseAuthFromObject(source, depth, visited);
        },

        parseAuthFromBody(body) {
            return PlanIdentityUtils.parseAuthFromBody(body);
        },

        parseAuthFromUrl(rawUrl) {
            return PlanIdentityUtils.parseAuthFromUrl(rawUrl);
        },

        getCsrfScore(csrf) {
            return PlanIdentityUtils.getCsrfScore(csrf);
        },

        pickCsrf(current, next) {
            return PlanIdentityUtils.pickCsrf(current, next);
        },

        resolveAuthContext(preferredBizCode = '') {
            return PlanIdentityUtils.resolveAuthContext(preferredBizCode);
        },

        isResponseOk(res) {
            return PlanIdentityUtils.isResponseOk(res);
        },

        pickResponseMessage(res, fallbackMessage = '') {
            return PlanIdentityUtils.pickResponseMessage(res, fallbackMessage);
        },

        resolveCampaignActiveState(ref = {}) {
            if (!ref || typeof ref !== 'object') return null;
            const onlineNum = Number(ref.onlineStatus);
            if (Number.isFinite(onlineNum)) {
                if (onlineNum === 1) return true;
                if (onlineNum === 0) return false;
            }
            const statusNum = Number(ref.status);
            if (Number.isFinite(statusNum)) {
                if (statusNum === 1) return true;
                if (statusNum === 0) return false;
            }
            const text = [
                ref.displayStatus,
                ref.status,
                ref.onlineStatus,
                ref.planStatus,
                ref.campaignStatus
            ].map(item => String(item || '').trim().toLowerCase()).join('|');
            if (!text) return null;
            if (/(start|online|active|running|enable|在投|投放|开启|生效)/.test(text)) return true;
            if (/(pause|stop|offline|suspend|disable|暂停|关闭|下线|失效)/.test(text)) return false;
            return null;
        },

        collectCampaignRefsFromNode(node, out, meta = {}) {
            return PlanIdentityUtils.collectCampaignRefsFromNode(node, out, meta);
        },

        normalizeCampaignRefs(refs = []) {
            return PlanIdentityUtils.normalizeCampaignRefs(refs);
        },

        async queryCampaignsByItem(itemId, bizCode, authContext) {
            const normalizedItemId = this.normalizeItemId(itemId);
            if (!normalizedItemId) return [];
            const targetBizCode = this.normalizeBizCode(bizCode) || authContext?.bizCode || this.DEFAULT_BIZ_CODE;
            const query = new URLSearchParams({
                csrfId: String(authContext?.csrfId || ''),
                bizCode: targetBizCode
            });
            const url = `https://one.alimama.com/campaign/horizontal/findPage.json?${query.toString()}`;
            const today = this.formatDateYmd(new Date());
            const payload = {
                mx_bizCode: targetBizCode,
                bizCode: targetBizCode,
                offset: 0,
                pageSize: 200,
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
                        startTime: today,
                        endTime: today,
                        isRt: true
                    }]
                },
                csrfId: String(authContext?.csrfId || ''),
                loginPointId: String(authContext?.loginPointId || '')
            };
            const json = await OneApiTransport.postJson(url, payload, {
                actionName: '查询商品计划失败',
                businessErrorMessage: '查询商品计划失败'
            });
            const refs = [];
            this.collectCampaignRefsFromNode(json, refs, {
                depth: 0,
                seen: new WeakSet(),
                bizHint: targetBizCode,
                itemHint: normalizedItemId
            });
            return this.normalizeCampaignRefs(refs).map((item) => {
                const normalizedCampaignId = this.normalizeCampaignId(item?.campaignId);
                this.rememberCampaignItemId(normalizedCampaignId, item?.itemId || normalizedItemId);
                return {
                    ...item,
                    itemId: this.normalizeItemId(item?.itemId || normalizedItemId) || normalizedItemId,
                    bizCode: this.normalizeBizCode(item?.bizCode || '') || targetBizCode
                };
            });
        },

        async findConflictRefs(campaignId, bizCode, authContext, itemId = '') {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) return [];
            const targetBizCode = this.normalizeBizCode(bizCode) || authContext?.bizCode || this.DEFAULT_BIZ_CODE;
            const normalizedItemId = this.normalizeItemId(itemId);
            const numericCampaignId = Number(id);
            const query = new URLSearchParams({
                csrfId: String(authContext?.csrfId || ''),
                bizCode: targetBizCode
            });
            const url = `https://one.alimama.com/campaign/diff/findList.json?${query.toString()}`;
            const payload = {
                bizCode: targetBizCode,
                source: 'campaign',
                campaignIdList: [numericCampaignId],
                campaignList: [{
                    campaignId: numericCampaignId
                }],
                csrfId: String(authContext?.csrfId || ''),
                loginPointId: String(authContext?.loginPointId || '')
            };
            if (normalizedItemId) {
                payload.campaignList[0].itemSelectedMode = 'user_define';
                payload.campaignList[0].materialIdList = [Number(normalizedItemId)];
            }
            const json = await OneApiTransport.postJson(url, payload, {
                actionName: '查询冲突计划失败',
                businessErrorMessage: '查询冲突计划失败'
            });
            const refs = [];
            this.collectCampaignRefsFromNode(json, refs, {
                depth: 0,
                seen: new WeakSet(),
                bizHint: targetBizCode,
                itemHint: normalizedItemId || this.getCampaignItemId(id)
            });
            refs.push({
                campaignId: id,
                itemId: normalizedItemId || this.getCampaignItemId(id) || '',
                bizCode: targetBizCode,
                status: '',
                onlineStatus: '',
                displayStatus: '',
                source: 'seed'
            });
            const normalizedRefs = this.normalizeCampaignRefs(refs);
            normalizedRefs.forEach((item) => {
                this.rememberCampaignItemId(item?.campaignId, item?.itemId || '');
            });
            return normalizedRefs;
        },

        mergeCampaignActiveState(current, next) {
            const currentState = current === true ? true : (current === false ? false : null);
            const nextState = next === true ? true : (next === false ? false : null);
            if (nextState === true) return true;
            if (nextState === false) return currentState === true ? true : false;
            return currentState;
        },

        upsertConcurrentTarget(targetMap, ref = {}, fallbackBizCode = '') {
            if (!(targetMap instanceof Map)) return;
            const campaignId = this.normalizeCampaignId(ref?.campaignId);
            if (!campaignId) return;
            const resolvedBizCode = this.normalizeBizCode(ref?.bizCode || fallbackBizCode || '');
            const active = this.resolveCampaignActiveState(ref);
            const prev = targetMap.get(campaignId) || {
                campaignId,
                bizCode: '',
                active: null
            };
            if (!prev.bizCode && resolvedBizCode) prev.bizCode = resolvedBizCode;
            prev.active = this.mergeCampaignActiveState(prev.active, active);
            targetMap.set(campaignId, prev);
        },

        resolveResumeTargets(allTargets = []) {
            const normalizedTargets = (Array.isArray(allTargets) ? allTargets : []).map((item) => ({
                campaignId: this.normalizeCampaignId(item?.campaignId),
                bizCode: this.normalizeBizCode(item?.bizCode || '') || this.DEFAULT_BIZ_CODE,
                active: item?.active === true ? true : (item?.active === false ? false : null)
            })).filter(item => item.campaignId);
            const originalActiveTargets = normalizedTargets.filter(item => item.active === true);
            const mandatorySiteTargets = normalizedTargets.filter(item => item.bizCode === 'onebpSite');
            const resumeMap = new Map();
            const pushResume = (target) => {
                if (!target || !target.campaignId) return;
                const key = `${target.bizCode}@${target.campaignId}`;
                if (resumeMap.has(key)) return;
                resumeMap.set(key, target);
            };
            mandatorySiteTargets.forEach(pushResume);
            originalActiveTargets.forEach(pushResume);
            let resumeTargets = Array.from(resumeMap.values());
            if (!resumeTargets.length) {
                resumeTargets = mandatorySiteTargets.length ? mandatorySiteTargets : normalizedTargets;
            }
            return {
                allTargets: normalizedTargets,
                resumeTargets,
                originalActiveTargets,
                mandatorySiteTargets
            };
        },

        collectSiteCustomTargetBuckets(targets = []) {
            const targetMap = new Map();
            (Array.isArray(targets) ? targets : []).forEach((item) => {
                const campaignId = this.normalizeCampaignId(item?.campaignId);
                const bizCode = this.normalizeBizCode(item?.bizCode || '') || this.DEFAULT_BIZ_CODE;
                if (!campaignId) return;
                const key = `${bizCode}@${campaignId}`;
                if (targetMap.has(key)) return;
                targetMap.set(key, {
                    campaignId,
                    bizCode,
                    active: item?.active === true ? true : (item?.active === false ? false : null)
                });
            });
            const all = Array.from(targetMap.values());
            const siteTargets = all.filter(item => item.bizCode === 'onebpSite');
            const customTargets = all.filter(item => item.bizCode !== 'onebpSite');
            return {
                all,
                siteTargets,
                customTargets,
                enabled: siteTargets.length > 0 && customTargets.length > 0
            };
        },

        isSiteCustomConflictError(text = '') {
            const normalized = String(text || '').trim();
            if (!normalized) return false;
            return this.SITE_CUSTOM_CONFLICT_RE.test(normalized);
        },

        shouldRunSiteCustomBreakthrough(targets = [], startErrors = [], verifyResult = null) {
            const buckets = this.collectSiteCustomTargetBuckets(targets);
            if (!buckets.enabled) return false;
            const startText = (Array.isArray(startErrors) ? startErrors : []).join('；');
            const verifyText = String(verifyResult?.error || '').trim();
            if (this.isSiteCustomConflictError(startText) || this.isSiteCustomConflictError(verifyText)) {
                return true;
            }
            if (Array.isArray(startErrors) && startErrors.length) return true;
            return verifyResult && verifyResult.ok === false;
        },

        async resolveConcurrentTargetsByItem(itemId, bizCandidates, authContext) {
            const normalizedItemId = this.normalizeItemId(itemId);
            if (!normalizedItemId) {
                return {
                    itemId: '',
                    allTargets: [],
                    resumeTargets: [],
                    originalActiveTargets: [],
                    mandatorySiteTargets: [],
                    unresolvedErrors: []
                };
            }
            const normalizedBizCandidates = [];
            const pushBizCandidate = (value) => {
                const bizCode = this.normalizeBizCode(value);
                if (!bizCode) return;
                if (normalizedBizCandidates.includes(bizCode)) return;
                normalizedBizCandidates.push(bizCode);
            };
            (Array.isArray(bizCandidates) ? bizCandidates : []).forEach(pushBizCandidate);
            this.BIZ_CODE_LIST.forEach(pushBizCandidate);
            if (!normalizedBizCandidates.length) pushBizCandidate(this.DEFAULT_BIZ_CODE);

            const targetMap = new Map();
            const unresolvedErrors = [];
            for (let i = 0; i < normalizedBizCandidates.length; i++) {
                const bizCode = normalizedBizCandidates[i];
                try {
                    const refs = await this.queryCampaignsByItem(normalizedItemId, bizCode, authContext);
                    refs.forEach((ref) => {
                        const resolvedBizCode = this.normalizeBizCode(ref?.bizCode || bizCode) || bizCode;
                        this.upsertConcurrentTarget(targetMap, { ...ref, bizCode: resolvedBizCode }, resolvedBizCode);
                    });
                } catch (err) {
                    unresolvedErrors.push(`${normalizedItemId}@${bizCode}:${err?.message || '商品计划识别失败'}`);
                }
            }
            const allTargetsRaw = Array.from(targetMap.values()).map((item) => ({
                campaignId: this.normalizeCampaignId(item?.campaignId),
                bizCode: this.normalizeBizCode(item?.bizCode || '') || normalizedBizCandidates[0] || this.DEFAULT_BIZ_CODE,
                active: item?.active === true ? true : (item?.active === false ? false : null)
            })).filter(item => item.campaignId);
            const {
                allTargets,
                resumeTargets,
                originalActiveTargets,
                mandatorySiteTargets
            } = this.resolveResumeTargets(allTargetsRaw);
            return {
                itemId: normalizedItemId,
                allTargets,
                resumeTargets,
                originalActiveTargets,
                mandatorySiteTargets,
                unresolvedErrors
            };
        },

        async resolveConcurrentTargets(baseCampaignId, bizCandidates, authContext, options = {}) {
            const mainId = this.normalizeCampaignId(baseCampaignId);
            const normalizedItemId = this.normalizeItemId(options?.itemId || '');
            if (!mainId) {
                return {
                    itemId: normalizedItemId,
                    allTargets: [],
                    resumeTargets: [],
                    originalActiveTargets: [],
                    mandatorySiteTargets: [],
                    unresolvedErrors: []
                };
            }
            const normalizedBizCandidates = [];
            const pushBizCandidate = (value) => {
                const bizCode = this.normalizeBizCode(value);
                if (!bizCode) return;
                if (normalizedBizCandidates.includes(bizCode)) return;
                normalizedBizCandidates.push(bizCode);
            };
            (Array.isArray(bizCandidates) ? bizCandidates : []).forEach(pushBizCandidate);
            if (!normalizedBizCandidates.length) pushBizCandidate(this.DEFAULT_BIZ_CODE);

            const targetMap = new Map();
            const queue = [{ campaignId: mainId, bizCode: normalizedBizCandidates[0] || this.DEFAULT_BIZ_CODE }];
            const queuedCampaignIds = new Set([mainId]);
            const visitedCampaignIds = new Set();
            const unresolvedErrors = [];

            while (queue.length && visitedCampaignIds.size < 50) {
                const current = queue.shift() || {};
                const currentId = this.normalizeCampaignId(current.campaignId);
                if (!currentId || visitedCampaignIds.has(currentId)) continue;
                visitedCampaignIds.add(currentId);

                const queryBizCodes = [];
                const pushQueryBiz = (value) => {
                    const bizCode = this.normalizeBizCode(value);
                    if (!bizCode) return;
                    if (queryBizCodes.includes(bizCode)) return;
                    queryBizCodes.push(bizCode);
                };
                pushQueryBiz(current.bizCode);
                normalizedBizCandidates.forEach(pushQueryBiz);
                if (!queryBizCodes.length) pushQueryBiz(this.DEFAULT_BIZ_CODE);

                const refs = [];
                for (let i = 0; i < queryBizCodes.length; i++) {
                    const bizCode = queryBizCodes[i];
                    try {
                        const list = await this.findConflictRefs(currentId, bizCode, authContext, options?.itemId || '');
                        if (Array.isArray(list) && list.length) refs.push(...list);
                    } catch (err) {
                        unresolvedErrors.push(`${currentId}@${bizCode}:${err?.message || '冲突计划识别失败'}`);
                    }
                }

                if (!refs.length) {
                    this.upsertConcurrentTarget(targetMap, {
                        campaignId: currentId,
                        bizCode: current.bizCode || normalizedBizCandidates[0] || this.DEFAULT_BIZ_CODE
                    }, current.bizCode || normalizedBizCandidates[0] || this.DEFAULT_BIZ_CODE);
                    continue;
                }

                const normalizedRefs = this.normalizeCampaignRefs(refs);
                normalizedRefs.forEach((ref) => {
                    const campaignId = this.normalizeCampaignId(ref?.campaignId);
                    if (!campaignId) return;
                    const resolvedBizCode = this.normalizeBizCode(
                        ref?.bizCode
                        || current.bizCode
                        || normalizedBizCandidates[0]
                        || this.DEFAULT_BIZ_CODE
                    ) || this.DEFAULT_BIZ_CODE;
                    this.upsertConcurrentTarget(targetMap, { ...ref, campaignId, bizCode: resolvedBizCode }, resolvedBizCode);
                    if (queuedCampaignIds.has(campaignId)) return;
                    queuedCampaignIds.add(campaignId);
                    queue.push({ campaignId, bizCode: resolvedBizCode });
                });
            }

            if (!targetMap.size) {
                this.upsertConcurrentTarget(targetMap, {
                    campaignId: mainId,
                    bizCode: normalizedBizCandidates[0] || this.DEFAULT_BIZ_CODE
                }, normalizedBizCandidates[0] || this.DEFAULT_BIZ_CODE);
            }

            const allTargetsRaw = Array.from(targetMap.values()).map((item) => ({
                campaignId: this.normalizeCampaignId(item?.campaignId),
                bizCode: this.normalizeBizCode(item?.bizCode || '') || normalizedBizCandidates[0] || this.DEFAULT_BIZ_CODE,
                active: item?.active === true ? true : (item?.active === false ? false : null)
            })).filter(item => item.campaignId);
            const {
                allTargets,
                resumeTargets,
                originalActiveTargets,
                mandatorySiteTargets
            } = this.resolveResumeTargets(allTargetsRaw);
            return {
                itemId: normalizedItemId,
                allTargets,
                resumeTargets,
                originalActiveTargets,
                mandatorySiteTargets,
                unresolvedErrors
            };
        },

        async updateCampaignStatus(campaignId, bizCode, onlineStatus, authContext) {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) throw new Error('计划ID无效');
            const targetBizCode = this.normalizeBizCode(bizCode) || authContext?.bizCode || this.DEFAULT_BIZ_CODE;
            const status = Number(onlineStatus) === 1 ? 1 : 0;
            const numericCampaignId = Number(id);
            const query = new URLSearchParams({
                csrfId: String(authContext?.csrfId || ''),
                bizCode: targetBizCode
            });
            const url = `https://one.alimama.com/campaign/updatePart.json?${query.toString()}`;
            const payload = {
                bizCode: targetBizCode,
                campaignList: [{
                    campaignId: numericCampaignId,
                    displayStatus: status === 1 ? 'start' : 'pause'
                }],
                csrfId: String(authContext?.csrfId || ''),
                strategyRecoverys: [],
                loginPointId: String(authContext?.loginPointId || ''),
                lrsIdList: []
            };
            const json = await OneApiTransport.postJson(url, payload, {
                actionName: `${status === 1 ? '开启' : '暂停'}计划失败`,
                businessErrorMessage: `${status === 1 ? '开启' : '暂停'}计划失败`
            });
            const refs = [];
            this.collectCampaignRefsFromNode(json, refs, { depth: 0, seen: new WeakSet(), bizHint: targetBizCode });
            const normalizedRefs = this.normalizeCampaignRefs(refs);
            const current = normalizedRefs.find(item => item.campaignId === id) || null;
            return {
                campaignId: id,
                bizCode: targetBizCode,
                response: json,
                active: this.resolveCampaignActiveState(current),
                ref: current
            };
        },

        async updateCampaignStatusBatchByBiz(campaignIds = [], bizCode, onlineStatus, authContext) {
            const normalizedIds = Array.from(new Set(
                (Array.isArray(campaignIds) ? campaignIds : [])
                    .map(id => this.normalizeCampaignId(id))
                    .filter(Boolean)
            ));
            if (!normalizedIds.length) {
                return {
                    campaignIds: [],
                    bizCode: this.normalizeBizCode(bizCode) || authContext?.bizCode || this.DEFAULT_BIZ_CODE,
                    response: {},
                    states: []
                };
            }
            const targetBizCode = this.normalizeBizCode(bizCode) || authContext?.bizCode || this.DEFAULT_BIZ_CODE;
            const status = Number(onlineStatus) === 1 ? 1 : 0;
            const query = new URLSearchParams({
                csrfId: String(authContext?.csrfId || ''),
                bizCode: targetBizCode
            });
            const url = `https://one.alimama.com/campaign/updatePart.json?${query.toString()}`;
            const payload = {
                bizCode: targetBizCode,
                campaignList: normalizedIds.map((id) => ({
                    campaignId: Number(id),
                    displayStatus: status === 1 ? 'start' : 'pause'
                })),
                csrfId: String(authContext?.csrfId || ''),
                strategyRecoverys: [],
                loginPointId: String(authContext?.loginPointId || ''),
                lrsIdList: []
            };
            const json = await OneApiTransport.postJson(url, payload, {
                actionName: `${status === 1 ? '批量开启' : '批量暂停'}计划失败`,
                businessErrorMessage: `${status === 1 ? '批量开启' : '批量暂停'}计划失败`
            });
            const refs = [];
            this.collectCampaignRefsFromNode(json, refs, { depth: 0, seen: new WeakSet(), bizHint: targetBizCode });
            const normalizedRefs = this.normalizeCampaignRefs(refs);
            const refMap = new Map(normalizedRefs.map(item => [item.campaignId, item]));
            const states = normalizedIds.map((id) => {
                const ref = refMap.get(id) || null;
                return {
                    campaignId: id,
                    bizCode: targetBizCode,
                    active: this.resolveCampaignActiveState(ref),
                    ref
                };
            });
            return {
                campaignIds: normalizedIds,
                bizCode: targetBizCode,
                response: json,
                states
            };
        },

        async updateCampaignNamesBatchByBiz(rows = [], bizCode = '', authContext = {}) {
            const normalizedRows = (Array.isArray(rows) ? rows : [])
                .map((row) => ({
                    campaignId: this.normalizeCampaignId(row?.campaignId || ''),
                    campaignName: String(row?.planName || row?.campaignName || '').replace(/\s+/g, ' ').trim()
                }))
                .filter(row => row.campaignId && row.campaignName);
            if (!normalizedRows.length) {
                return {
                    campaignIds: [],
                    bizCode: this.normalizeBizCode(bizCode) || authContext?.bizCode || this.DEFAULT_BIZ_CODE,
                    response: {}
                };
            }
            const targetBizCode = this.normalizeBizCode(bizCode) || authContext?.bizCode || this.DEFAULT_BIZ_CODE;
            const query = new URLSearchParams({
                csrfId: String(authContext?.csrfId || ''),
                bizCode: targetBizCode
            });
            const url = `https://one.alimama.com/campaign/updatePart.json?${query.toString()}`;
            const payload = {
                bizCode: targetBizCode,
                campaignList: normalizedRows.map(row => ({
                    campaignId: Number(row.campaignId),
                    campaignName: row.campaignName
                })),
                csrfId: String(authContext?.csrfId || ''),
                strategyRecoverys: [],
                loginPointId: String(authContext?.loginPointId || ''),
                lrsIdList: []
            };
            const json = await OneApiTransport.postJson(url, payload, {
                actionName: '批量修改计划名称失败',
                businessErrorMessage: '批量修改计划名称失败'
            });
            return {
                campaignIds: normalizedRows.map(row => row.campaignId),
                bizCode: targetBizCode,
                response: json
            };
        },

        async runSiteCustomBreakthroughStrategy(options = {}) {
            const attempt = Number(options?.attempt || 0);
            const resumeTargets = Array.isArray(options?.resumeTargets) ? options.resumeTargets : [];
            const allTargets = Array.isArray(options?.allTargets) ? options.allTargets : [];
            const authContext = options?.authContext || {};
            const itemId = this.normalizeItemId(options?.itemId || '');
            const buckets = this.collectSiteCustomTargetBuckets(resumeTargets);
            if (!buckets.enabled) {
                return {
                    ok: false,
                    mode: 'site_custom_breakthrough',
                    round: 0,
                    error: '未命中全站+自定义同开场景'
                };
            }

            const siteTargets = buckets.siteTargets;
            const customTargets = buckets.customTargets;
            const customTargetsByBiz = new Map();
            customTargets.forEach((target) => {
                const bizCode = this.normalizeBizCode(target?.bizCode || '');
                const campaignId = this.normalizeCampaignId(target?.campaignId || '');
                if (!bizCode || !campaignId) return;
                const list = customTargetsByBiz.get(bizCode) || [];
                if (list.includes(campaignId)) return;
                list.push(campaignId);
                customTargetsByBiz.set(bizCode, list);
            });
            const customBizList = Array.from(customTargetsByBiz.keys());
            this.appendConcurrentLog(
                `触发突破策略：全站${siteTargets.length}个 + 自定义${customTargets.length}个，执行双轨批量并发抢开`,
                'warn'
            );

            let lastError = '';
            for (let round = 1; round <= this.MAX_SITE_CUSTOM_BREAKTHROUGH_ROUNDS; round++) {
                this.appendConcurrentLog(`突破策略第${round}轮（总第${attempt || 1}次重试）：按业务线批量并发开启`, 'info');
                const startJobs = [
                    {
                        bizCode: 'onebpSite',
                        campaignIds: siteTargets.map(item => item.campaignId)
                    },
                    ...customBizList.map((bizCode) => ({
                        bizCode,
                        campaignIds: customTargetsByBiz.get(bizCode) || []
                    }))
                ].filter(item => Array.isArray(item.campaignIds) && item.campaignIds.length);
                const startSettled = await Promise.allSettled(
                    startJobs.map(item => this.updateCampaignStatusBatchByBiz(item.campaignIds, item.bizCode, 1, authContext))
                );
                const startErrors = startSettled
                    .map((item, index) => {
                        if (item.status !== 'rejected') return '';
                        const bizCode = startJobs[index]?.bizCode || '-';
                        return `${bizCode}:${item.reason?.message || '突破策略批量开启失败'}`;
                    })
                    .filter(Boolean);
                if (startErrors.length) {
                    this.appendConcurrentLog(`突破策略第${round}轮接口失败：${startErrors.join('；')}`, 'warn');
                }

                const verify = await this.verifyTargetsStarted(resumeTargets, authContext, itemId);
                if (verify.ok) {
                    this.appendConcurrentLog(`突破策略第${round}轮校验通过：全站与自定义已同时开启`, 'success');
                    return {
                        ok: true,
                        mode: 'site_custom_breakthrough',
                        round,
                        error: ''
                    };
                }

                lastError = [startErrors.join('；'), verify.error].filter(Boolean).join('；')
                    || `突破策略第${round}轮仍未同时开启`;
                this.appendConcurrentLog(`突破策略第${round}轮未成功：${lastError}`, 'warn');
                if (round >= this.MAX_SITE_CUSTOM_BREAKTHROUGH_ROUNDS) break;

                await Promise.allSettled(
                    allTargets.map(target => this.updateCampaignStatus(target.campaignId, target.bizCode, 0, authContext))
                );
                await this.sleep(180 + round * 220);
            }

            this.appendConcurrentLog(`突破策略结束：${lastError || '多轮并发后仍未同时开启'}`, 'warn');
            return {
                ok: false,
                mode: 'site_custom_breakthrough',
                round: this.MAX_SITE_CUSTOM_BREAKTHROUGH_ROUNDS,
                error: lastError || '多轮并发后仍未同时开启'
            };
        },

        async verifyTargetsStartedByItem(targets, authContext, itemId) {
            const normalizedItemId = this.normalizeItemId(itemId);
            if (!normalizedItemId) {
                return {
                    ok: false,
                    soft: true,
                    states: [],
                    error: '商品ID缺失，状态查询降级'
                };
            }
            const targetList = Array.isArray(targets) ? targets : [];
            const bizCodes = [];
            const pushBizCode = (value) => {
                const bizCode = this.normalizeBizCode(value);
                if (!bizCode) return;
                if (bizCodes.includes(bizCode)) return;
                bizCodes.push(bizCode);
            };
            targetList.forEach(item => pushBizCode(item?.bizCode || ''));
            this.BIZ_CODE_LIST.forEach(pushBizCode);
            const stateByKey = new Map();
            const stateByCampaignId = new Map();
            const queryErrors = new Map();

            for (let i = 0; i < bizCodes.length; i++) {
                const bizCode = bizCodes[i];
                try {
                    const refs = await this.queryCampaignsByItem(normalizedItemId, bizCode, authContext);
                    refs.forEach((ref) => {
                        const campaignId = this.normalizeCampaignId(ref?.campaignId);
                        if (!campaignId) return;
                        const resolvedBizCode = this.normalizeBizCode(ref?.bizCode || bizCode) || bizCode;
                        const active = this.resolveCampaignActiveState(ref);
                        stateByKey.set(`${resolvedBizCode}@${campaignId}`, active);
                        stateByCampaignId.set(campaignId, this.mergeCampaignActiveState(stateByCampaignId.get(campaignId), active));
                    });
                } catch (err) {
                    queryErrors.set(bizCode, err?.message || '状态查询失败');
                }
            }

            const checks = targetList.map((target) => {
                const campaignId = this.normalizeCampaignId(target?.campaignId);
                const bizCode = this.normalizeBizCode(target?.bizCode || '') || this.DEFAULT_BIZ_CODE;
                const exactState = stateByKey.get(`${bizCode}@${campaignId}`);
                const fallbackState = stateByCampaignId.get(campaignId);
                const active = exactState === undefined ? (fallbackState === undefined ? null : fallbackState) : exactState;
                return {
                    campaignId,
                    bizCode,
                    active,
                    error: active === null ? (queryErrors.get(bizCode) || '未命中商品计划结果') : ''
                };
            });

            if (checks.length && checks.every(item => item.active === true)) {
                return { ok: true, soft: false, states: checks, error: '' };
            }
            if (checks.length && checks.every(item => item.active === null)) {
                return { ok: false, soft: true, states: checks, error: '状态查询未返回明确结果' };
            }
            const failedText = checks
                .map(item => {
                    if (item.active === true) return '';
                    if (item.active === false) return `${item.campaignId}@${item.bizCode}:未开启`;
                    return `${item.campaignId}@${item.bizCode}:未知(${item.error || '无返回'})`;
                })
                .filter(Boolean)
                .join('；');
            return {
                ok: false,
                soft: false,
                states: checks,
                error: failedText || '状态未同时开启'
            };
        },

        async verifyTargetsStarted(targets, authContext, itemId = '') {
            const normalizedItemId = this.normalizeItemId(itemId);
            if (normalizedItemId) {
                return this.verifyTargetsStartedByItem(targets, authContext, normalizedItemId);
            }
            const checks = await Promise.all((Array.isArray(targets) ? targets : []).map(async (target) => {
                try {
                    const refs = await this.findConflictRefs(target.campaignId, target.bizCode, authContext, normalizedItemId);
                    const current = refs.find(item => item.campaignId === target.campaignId) || null;
                    const active = this.resolveCampaignActiveState(current);
                    return {
                        campaignId: target.campaignId,
                        bizCode: target.bizCode,
                        active,
                        error: ''
                    };
                } catch (err) {
                    return {
                        campaignId: target.campaignId,
                        bizCode: target.bizCode,
                        active: null,
                        error: err?.message || '状态查询失败'
                    };
                }
            }));

            if (checks.length && checks.every(item => item.active === true)) {
                return { ok: true, soft: false, states: checks, error: '' };
            }
            if (checks.length && checks.every(item => item.active === null)) {
                return { ok: false, soft: true, states: checks, error: '状态查询未返回明确结果' };
            }
            const failedText = checks
                .map(item => {
                    if (item.active === true) return '';
                    if (item.active === false) return `${item.campaignId}@${item.bizCode}:未开启`;
                    return `${item.campaignId}@${item.bizCode}:未知(${item.error || '无返回'})`;
                })
                .filter(Boolean)
                .join('；');
            return {
                ok: false,
                soft: false,
                states: checks,
                error: failedText || '状态未同时开启'
            };
        },

        setCopyButtonRunning(campaignId, copyMode, running) {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) return;
            const selector = `.am-campaign-search-btn[data-am-campaign-copy][data-campaign-id="${id}"]`;
            document.querySelectorAll(selector).forEach((btn) => {
                if (!(btn instanceof HTMLButtonElement)) return;
                const btnMode = this.normalizeCopyMode(btn.getAttribute('data-am-campaign-copy') || copyMode);
                const label = this.getCopyModeLabel(btnMode);
                if (running) {
                    if (!btn.dataset.amTitleBak) btn.dataset.amTitleBak = btn.title || '';
                    btn.classList.add('is-running');
                    btn.disabled = true;
                    btn.title = `${label}执行中：${id}`;
                    return;
                }
                btn.classList.remove('is-running');
                btn.disabled = false;
                const titleBak = btn.dataset.amTitleBak;
                btn.title = titleBak || `${label}：${id}`;
                delete btn.dataset.amTitleBak;
            });
        },

        resolveCopyTargetOnlineStatus(source = {}) {
            const active = this.resolveCampaignActiveState(source?.campaign || source);
            if (active === true) return 1;
            if (active === false) return 0;
            throw new Error('未能识别源计划当前状态，已取消复制');
        },

        buildCopyPreviewPlanName(sourcePlanName = '', sceneName = '', copyIndex = 0, usedPlanNameSet = new Set()) {
            const raw = String(sourcePlanName || '').trim();
            const fallback = String(sceneName || '计划').trim() || '计划';
            const baseSeed = raw || fallback;
            const hasAutoTimeSuffix = /(?:_\d{8}|\d{14}|_\d{8}_\d{6})$/.test(baseSeed);
            const sourceSerial = !hasAutoTimeSuffix && /_(\d+)$/.test(baseSeed)
                ? Math.max(0, Number(baseSeed.match(/_(\d+)$/)?.[1]) || 0)
                : 0;
            let base = sourceSerial > 0 ? baseSeed.replace(/_\d+$/, '') : baseSeed;
            if (sourceSerial > 0) {
                const timestampTail = base.match(/^(.*(?:_\d{8}_\d{6}))(?:_\d+)+$/)
                    || (/_\d{8}_\d{6}$/.test(base) ? null : base.match(/^(.*(?:_\d{8}|\d{14}))(?:_\d+)+$/));
                if (timestampTail?.[1]) base = timestampTail[1];
            }
            const usedPlanNames = usedPlanNameSet instanceof Set ? usedPlanNameSet : new Set();
            const serialStart = sourceSerial > 0 ? sourceSerial : 0;
            let serialCursor = serialStart + Math.max(1, Number(copyIndex) || 1);
            let candidate = `${base}_${serialCursor}`;
            while (usedPlanNames.has(candidate) && serialCursor < 9999) {
                serialCursor += 1;
                candidate = `${base}_${serialCursor}`;
            }
            usedPlanNames.add(candidate);
            return candidate;
        },

        buildCopyPreviewPlanNames(sourcePlanName = '', sceneName = '', copyCount = 1, usedPlanNames = []) {
            const usedPlanNameSet = new Set(
                (Array.isArray(usedPlanNames) ? usedPlanNames : [])
                    .map(item => String(item || '').trim())
                    .filter(Boolean)
            );
            return Array.from({ length: this.normalizeCopyBatchCount(copyCount) }).map((_, idx) => (
                this.buildCopyPreviewPlanName(sourcePlanName, sceneName, idx + 1, usedPlanNameSet)
            ));
        },

        normalizeCopyEditableNumber(value) {
            const raw = String(value ?? '').replace(/,/g, '').trim();
            if (!raw) return '';
            const numeric = Number(raw);
            if (!Number.isFinite(numeric) || numeric <= 0) return '';
            return String(numeric);
        },

        formatCopyBulkNumber(value) {
            const numeric = Number(value);
            if (!Number.isFinite(numeric) || numeric <= 0) return '';
            return numeric.toFixed(2).replace(/\.?0+$/, '');
        },

        resolveCopyBudgetSeed(campaign = {}) {
            const fields = [
                { field: 'dayBudget', label: '每日预算' },
                { field: 'dayAverageBudget', label: '日均预算' },
                { field: 'totalBudget', label: '总预算' },
                { field: 'futureBudget', label: '冻结预算' },
                { field: 'orderAmount', label: '套餐预算' }
            ];
            for (let i = 0; i < fields.length; i++) {
                const item = fields[i];
                const value = this.normalizeCopyEditableNumber(campaign?.[item.field]);
                if (value) return { ...item, value };
            }
            return { field: 'dayAverageBudget', label: '日均预算', value: '' };
        },

        resolveCopyBidModeSeed(source = {}) {
            const campaign = this.isPlainRecord(source?.campaign) ? source.campaign : {};
            const adgroup = this.isPlainRecord(source?.adgroup) ? source.adgroup : {};
            return String(
                campaign.bidTypeV2
                || campaign.bidType
                || adgroup.campaignBidType
                || adgroup.bidTypeV2
                || adgroup.bidType
                || ''
            ).trim();
        },

        formatCopyBidModeDisplay(value = '') {
            const raw = String(value || '').replace(/\s+/g, ' ').trim();
            if (!raw) return '';
            if (/[智能手动最大控投产成本]/.test(raw)) return raw;
            const compact = raw.replace(/[\s_-]+/g, '').toLowerCase();
            if (compact === 'smart' || compact === 'smartbid') return '智能出价';
            if (compact === 'manual' || compact === 'manualbid') return '手动出价';
            if (compact === 'maxamount') return '最大化拿量';
            if (compact === 'roi' || compact === 'roicontrol') return '控投产比';
            return raw;
        },

        formatCopySmartBidDetailDisplay(value = '') {
            const raw = String(value || '').replace(/\s+/g, ' ').trim();
            if (!raw) return '';
            const compact = raw.replace(/[\s_()\[\]{}:：,，、/\\-]+/g, '').toLowerCase();
            if (!compact) return '';
            if (/^(smart|smartbid|smartbidtype|smartbidmode|智能出价)$/.test(compact)) return '';
            if (/促点击|增加点击|点击成本|平均点击|点击量/.test(raw) || /(^|display)click|clicktarget|clickcost/.test(compact)) return '促点击';
            if (/促收藏加购|收藏加购|收加|加购成本|加购量/.test(raw) || /collcart|favcart|displaycart|carttarget|cartcost/.test(compact)) return '促收藏加购';
            if (/促成交|获取成交|成交量|成交金额|净成交|总成交|成交成本|平均成交|直接成交|转化|购买/.test(raw)
                || /conv|dirconv|buy|retainedbuy|adstrategybuy|adstrategyretainedbuy|displaypay|paytarget/.test(compact)) {
                return '促成交';
            }
            if (/稳定投产比|目标投产比|投产比|ROI/i.test(raw) || /^roi$|roicontrol/.test(compact)) return '稳定投产比';
            if (/市场渗透|拉新渗透|新客/.test(raw) || /marketpenetration|wordpenetration|displayshentou/.test(compact)) return '提升市场渗透';
            if (/相似品跟投/.test(raw) || /similaritem/.test(compact)) return '相似品跟投';
            if (/搜索卡位|抢占搜索|卡位/.test(raw) || /searchrank/.test(compact)) return '抢占搜索卡位';
            return '';
        },

        extractCopySmartBidDetailFromText(text = '') {
            const normalized = String(text || '').replace(/\s+/g, ' ').trim();
            if (!normalized) return '';
            const smartIndex = normalized.indexOf('智能出价');
            const targetIndex = normalized.search(/(?:计划)?出价目标|优化目标|约束目标|目标成本|平均点击成本|平均成交成本|收藏加购成本|促点击|促成交|促收藏加购|增加点击量|增加收藏加购量|获取成交量/);
            if (smartIndex < 0 && targetIndex < 0) return '';
            const start = Math.max(0, Math.min(
                smartIndex >= 0 ? smartIndex : normalized.length,
                targetIndex >= 0 ? targetIndex : normalized.length
            ) - 12);
            const scoped = normalized.slice(start, start + 140);
            return this.formatCopySmartBidDetailDisplay(scoped);
        },

        resolveCopySmartBidDetailDisplayFromElement(triggerEl) {
            if (!(triggerEl instanceof Element)) return '';
            const campaignId = String(triggerEl.getAttribute('data-campaign-id') || triggerEl.closest('[data-campaign-id]')?.getAttribute('data-campaign-id') || '').trim();
            if (campaignId && triggerEl.ownerDocument) {
                const anchors = Array.from(triggerEl.ownerDocument.querySelectorAll(`a[href*="campaignId=${campaignId}"], a[href*="campaignId%3D${campaignId}"]`));
                for (const anchor of anchors) {
                    let rowScope = anchor;
                    for (let depth = 0; rowScope && depth < 8; depth += 1) {
                        const text = String(rowScope.textContent || '').replace(/\s+/g, ' ').trim();
                        if (text.length > 3200) break;
                        const campaignLinkCount = rowScope.querySelectorAll?.('a[href*="campaignId="], a[href*="campaignId%3D"]').length || 0;
                        if (campaignLinkCount > 3) {
                            rowScope = rowScope.parentElement;
                            continue;
                        }
                        const matched = this.extractCopySmartBidDetailFromText(text);
                        if (matched) return matched;
                        rowScope = rowScope.parentElement;
                    }
                }
            }
            let current = triggerEl;
            for (let depth = 0; current && depth < 10; depth += 1) {
                const text = String(current.textContent || '').replace(/\s+/g, ' ').trim();
                if (text.length > 2500) break;
                if (text.length > 1200) {
                    current = current.parentElement;
                    continue;
                }
                const matched = this.extractCopySmartBidDetailFromText(text);
                if (matched) return matched;
                current = current.parentElement;
            }
            return '';
        },

        resolveCopySmartBidDetailSeed(source = {}, triggerEl = null) {
            const campaign = this.isPlainRecord(source?.campaign) ? source.campaign : {};
            const adgroup = this.isPlainRecord(source?.adgroup) ? source.adgroup : {};
            const campaignSceneSettings = this.isPlainRecord(campaign.sceneSettings) ? campaign.sceneSettings : {};
            const adgroupSceneSettings = this.isPlainRecord(adgroup.sceneSettings) ? adgroup.sceneSettings : {};
            const sourceCandidates = [
                source.bidTargetDisplay,
                source.bidTargetLabel,
                source.bidTargetName,
                source.optimizeTargetDisplay,
                source.optimizeTargetLabel,
                source.optimizeTargetName,
                campaign.bidTargetDisplay,
                campaign.bidTargetLabel,
                campaign.bidTargetName,
                campaign.optimizeTargetDisplay,
                campaign.optimizeTargetLabel,
                campaign.optimizeTargetName,
                campaign.bidTargetText,
                campaign.optimizeTargetText,
                campaignSceneSettings.出价目标,
                campaignSceneSettings.优化目标,
                campaignSceneSettings['campaign.bidTargetV2'],
                campaignSceneSettings['campaign.optimizeTarget'],
                campaignSceneSettings['campaign.subOptimizeTarget'],
                adgroup.bidTargetDisplay,
                adgroup.bidTargetLabel,
                adgroup.bidTargetName,
                adgroup.optimizeTargetDisplay,
                adgroup.optimizeTargetLabel,
                adgroup.optimizeTargetName,
                adgroupSceneSettings.出价目标,
                adgroupSceneSettings.优化目标,
                adgroupSceneSettings['campaign.bidTargetV2'],
                adgroupSceneSettings['campaign.optimizeTarget'],
                adgroupSceneSettings['campaign.subOptimizeTarget'],
                campaign.constraintType,
                campaign.bidTargetV2,
                campaign.optimizeTarget,
                campaign.subOptimizeTarget,
                adgroup.constraintType,
                adgroup.bidTargetV2,
                adgroup.optimizeTarget,
                adgroup.subOptimizeTarget
            ];
            for (let i = 0; i < sourceCandidates.length; i += 1) {
                const value = this.formatCopySmartBidDetailDisplay(sourceCandidates[i]);
                if (value) return value;
            }
            return this.resolveCopySmartBidDetailDisplayFromElement(triggerEl);
        },

        formatCopyBidModeDisplayWithDetail(modeDisplay = '', smartDetail = '') {
            const base = this.formatCopyBidModeDisplay(modeDisplay);
            if (!base) return '';
            const detail = this.formatCopySmartBidDetailDisplay(smartDetail);
            if (!detail || !/智能出价/.test(base) || base.includes(detail)) return base;
            return `${base}（${detail}）`;
        },

        resolveCopyBidModeDisplayFromElement(triggerEl) {
            if (!(triggerEl instanceof Element)) return '';
            const labels = ['控投产比投放', '控投产比', '最大化拿量', '手动出价', '智能出价', '控成本'];
            const matchLabel = (text = '') => labels.find(label => String(text || '').includes(label)) || '';
            const campaignId = String(triggerEl.getAttribute('data-campaign-id') || triggerEl.closest('[data-campaign-id]')?.getAttribute('data-campaign-id') || '').trim();
            if (campaignId && triggerEl.ownerDocument) {
                const anchors = Array.from(triggerEl.ownerDocument.querySelectorAll(`a[href*="campaignId=${campaignId}"], a[href*="campaignId%3D${campaignId}"]`));
                for (const anchor of anchors) {
                    let rowScope = anchor;
                    for (let depth = 0; rowScope && depth < 8; depth += 1) {
                        const text = String(rowScope.textContent || '').replace(/\s+/g, ' ').trim();
                        if (text.length > 3200) break;
                        const campaignLinkCount = rowScope.querySelectorAll?.('a[href*="campaignId="], a[href*="campaignId%3D"]').length || 0;
                        if (campaignLinkCount > 3) {
                            rowScope = rowScope.parentElement;
                            continue;
                        }
                        const matched = matchLabel(text);
                        if (matched) return matched;
                        rowScope = rowScope.parentElement;
                    }
                }
            }
            let current = triggerEl;
            for (let depth = 0; current && depth < 10; depth += 1) {
                const text = String(current.textContent || '').replace(/\s+/g, ' ').trim();
                if (text.length > 2500) break;
                if (text.length > 1200) {
                    current = current.parentElement;
                    continue;
                }
                const matched = matchLabel(text);
                if (matched) return matched;
                current = current.parentElement;
            }
            return '';
        },

        resolveCopyBidModeDisplaySeed(source = {}, triggerEl = null) {
            const campaign = this.isPlainRecord(source?.campaign) ? source.campaign : {};
            const adgroup = this.isPlainRecord(source?.adgroup) ? source.adgroup : {};
            const campaignSceneSettings = this.isPlainRecord(campaign.sceneSettings) ? campaign.sceneSettings : {};
            const adgroupSceneSettings = this.isPlainRecord(adgroup.sceneSettings) ? adgroup.sceneSettings : {};
            const fromVisibleRow = this.resolveCopyBidModeDisplayFromElement(triggerEl);
            const smartBidDetail = this.resolveCopySmartBidDetailSeed(source, triggerEl);
            if (fromVisibleRow) return this.formatCopyBidModeDisplayWithDetail(fromVisibleRow, smartBidDetail);
            const displayCandidates = [
                source.bidModeDisplay,
                source.bidTypeDisplay,
                campaign.bidModeDisplay,
                campaign.bidTypeDisplay,
                campaign.bidModeName,
                campaign.bidModeLabel,
                campaign.bidTypeName,
                campaign.bidTypeLabel,
                campaign.bidTypeText,
                campaign.bidTypeDesc,
                campaign.campaignBidTypeName,
                campaignSceneSettings.出价方式,
                adgroup.bidModeDisplay,
                adgroup.bidTypeDisplay,
                adgroup.campaignBidTypeName,
                adgroup.bidTypeName,
                adgroup.bidTypeLabel,
                adgroup.bidTypeText,
                adgroup.bidTypeDesc,
                adgroupSceneSettings.出价方式
            ];
            for (let i = 0; i < displayCandidates.length; i += 1) {
                const value = this.formatCopyBidModeDisplay(displayCandidates[i]);
                if (value) return this.formatCopyBidModeDisplayWithDetail(value, smartBidDetail);
            }
            return this.formatCopyBidModeDisplayWithDetail(this.resolveCopyBidModeSeed(source), smartBidDetail)
                || '跟随源计划';
        },

        resolveCopyBidPriceSeed(source = {}) {
            const campaign = this.isPlainRecord(source?.campaign) ? source.campaign : {};
            const adgroup = this.isPlainRecord(source?.adgroup) ? source.adgroup : {};
            const candidates = [
                campaign.constraintValue,
                campaign.singleCostV2,
                campaign.bidPrice,
                campaign.defaultBidPrice,
                adgroup.bidPrice,
                adgroup.defaultBidPrice,
                adgroup.price,
                adgroup.maxPrice
            ];
            for (let i = 0; i < candidates.length; i++) {
                const value = this.normalizeCopyEditableNumber(candidates[i]);
                if (value) return value;
            }
            const wordList = Array.isArray(adgroup.wordList) ? adgroup.wordList : [];
            for (let i = 0; i < wordList.length; i++) {
                const value = this.normalizeCopyEditableNumber(wordList[i]?.bidPrice || wordList[i]?.price);
                if (value) return value;
            }
            return '';
        },

        buildCopyOverviewRows(context = {}) {
            const source = context.source || {};
            const campaign = this.isPlainRecord(source?.campaign) ? source.campaign : {};
            const sourcePlanName = String(campaign.campaignName || source?.campaignName || source?.name || '').trim();
            const planNames = this.buildCopyPreviewPlanNames(
                sourcePlanName,
                context.sceneName || '',
                context.copyCount || 1,
                context.usedPlanNames || []
            );
            const budgetSeed = this.resolveCopyBudgetSeed(campaign);
            const bidModeDisplay = context.bidModeDisplay || this.resolveCopyBidModeDisplaySeed(source, context.triggerEl);
            const bidPrice = this.resolveCopyBidPriceSeed(source);
            return planNames.map((planName, index) => ({
                index,
                campaignId: '',
                originalPlanName: '',
                planName,
                bidModeDisplay,
                bidPrice,
                bidPriceEditable: !!bidPrice,
                budgetField: budgetSeed.field,
                budgetValue: budgetSeed.value
            }));
        },

        buildQuickCopyCurrentPlanContext(campaignId, triggerEl, copyMode = 'inherit', options = {}) {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) throw new Error('计划ID无效');
            const mode = this.normalizeCopyMode(copyMode);
            const label = this.getCopyModeLabel(mode);
            const bizCandidates = this.getCandidateBizCodes(triggerEl);
            const primaryBizCode = this.resolveCopyContextBizCode({
                triggerEl,
                bizCandidates
            });
            const sceneName = this.getSceneNameByBizCode(primaryBizCode) || '当前场景';
            const copyCount = this.normalizeCopyBatchCount(options.copyCount || this.readCopyBatchCount(triggerEl));
            const usedPlanNames = Array.from(this.copyPlanNameCache || []);
            const source = {
                campaignId: id,
                campaignName: '',
                name: '',
                bizCode: primaryBizCode,
                campaign: {
                    campaignId: id,
                    campaignName: '',
                    bizCode: primaryBizCode
                }
            };
            const context = {
                campaignId: id,
                bizCode: primaryBizCode,
                mode,
                label,
                source,
                sceneName,
                copyCount,
                usedPlanNames,
                targetOnlineStatus: mode === 'start' ? 1 : (mode === 'pause' ? 0 : null),
                previewRows: [],
                triggerEl,
                options,
                preparing: true
            };
            context.previewRows = this.buildCopyOverviewRows(context);
            return context;
        },

        resolveCopyContextBizCode(context = {}) {
            const source = this.isPlainRecord(context?.source) ? context.source : {};
            const campaign = this.isPlainRecord(source?.campaign) ? source.campaign : {};
            const candidates = Array.isArray(context?.bizCandidates) ? context.bizCandidates : [];
            const triggerEl = context?.triggerEl instanceof Element ? context.triggerEl : null;
            return this.normalizeBizCode(
                context?.bizCode
                || source?.bizCode
                || campaign?.bizCode
                || candidates[0]
                || this.inferBizCodeFromElement(triggerEl)
                || this.getCurrentCampaignBizCode()
                || this.DEFAULT_BIZ_CODE
            ) || this.DEFAULT_BIZ_CODE;
        },

        preloadCopyPlanApi(options = {}) {
            return waitForKeywordPlanApiAccessor({
                requiredMethod: 'copyCurrentPlanByScene',
                timeoutMs: Math.max(1200, Number(options.apiReadyTimeoutMs || 6000) || 6000),
                intervalMs: 120
            }).catch((err) => {
                Logger.log(`⚠️ 计划复制 API 预热失败：${err?.message || '未知错误'} `, true);
                return null;
            });
        },

        buildCopyOverviewRowHtml(rows = [], options = {}) {
            const mode = String(options.mode || '').trim();
            const renameMode = mode === 'rename';
            return (Array.isArray(rows) ? rows : []).map((row, index) => `
                    <tr data-am-copy-overview-row="${index}">
                        <td class="am-copy-overview-index">${index + 1}</td>
                        <td>
                            <input
                                data-am-copy-field="planName"
                                class="am-copy-overview-input am-copy-overview-name"
                                value="${this.escapeHtml(row.planName || '')}"
                                ${renameMode ? `data-campaign-id="${this.escapeHtml(row.campaignId || '')}" data-original-plan-name="${this.escapeHtml(row.originalPlanName || row.planName || '')}"` : ''}
                            />
                        </td>
                        <td${renameMode ? ' data-am-copy-mode-hidden="rename"' : ''}>
                            <span data-am-copy-field="bidModeDisplay" class="am-copy-overview-static">${this.escapeHtml(row.bidModeDisplay || '跟随源计划')}</span>
                        </td>
                        <td${renameMode ? ' data-am-copy-mode-hidden="rename"' : ''}>
                            <input data-am-copy-field="bidPrice" class="am-copy-overview-input" type="number" min="0.01" step="0.01" value="${this.escapeHtml(row.bidPrice || '')}" ${row.bidPriceEditable === false ? 'disabled data-am-copy-readonly="1" placeholder="无出价"' : ''} />
                        </td>
                        <td${renameMode ? ' data-am-copy-mode-hidden="rename"' : ''}>
                            <div class="am-copy-overview-budget-cell">
                                <select data-am-copy-field="budgetField" class="am-copy-overview-select">${this.buildCopyBudgetFieldOptions(row.budgetField || 'dayAverageBudget')}</select>
                                <input data-am-copy-field="budgetValue" class="am-copy-overview-input" type="number" min="0.01" step="0.01" value="${this.escapeHtml(row.budgetValue || '')}" />
                            </div>
                        </td>
                    </tr>
                `).join('');
        },

        getCopyOverviewSubtitle(context = {}, rows = []) {
            if (context.mode === 'rename') {
                const sceneName = context.sceneName || this.getSceneNameByBizCode(context.bizCode || '') || '当前场景';
                return `${sceneName} · 已选 ${rows.length} 个计划`;
            }
            const sourceName = String(context.source?.campaign?.campaignName || context.source?.campaignName || '').trim();
            return `${sourceName || `源计划 ${context.campaignId || ''}`} · ${context.sceneName || ''} · 共 ${rows.length} 个`;
        },

        renderCopyOverviewRows(popup, context = {}) {
            if (!(popup instanceof HTMLElement)) return [];
            const mode = String(context.mode || '').trim();
            const rows = Array.isArray(context.previewRows) && context.previewRows.length
                ? context.previewRows
                : this.buildCopyOverviewRows(context);
            const tbody = popup.querySelector('[data-am-copy-overview-tbody]');
            if (tbody instanceof HTMLElement) {
                tbody.innerHTML = this.buildCopyOverviewRowHtml(rows, { mode });
            }
            const subtitleEl = popup.querySelector('[data-am-copy-overview-subtitle]');
            if (subtitleEl instanceof HTMLElement) {
                subtitleEl.textContent = this.getCopyOverviewSubtitle(context, rows);
            }
            const firstRow = rows[0] || {};
            const lastRow = rows[rows.length - 1] || firstRow;
            const hasEditableBidPrice = rows.some(row => row?.bidPriceEditable !== false && this.normalizeCopyEditableNumber(row?.bidPrice || ''));
            const bidStartInput = popup.querySelector('[data-am-copy-bulk="bidStart"]');
            const bidEndInput = popup.querySelector('[data-am-copy-bulk="bidEnd"]');
            const bidGradientBtn = popup.querySelector('[data-am-copy-bulk-action="bidGradient"]');
            const budgetFieldInput = popup.querySelector('[data-am-copy-bulk="budgetField"]');
            const budgetValueInput = popup.querySelector('[data-am-copy-bulk="budgetValue"]');
            if (bidStartInput instanceof HTMLInputElement) {
                bidStartInput.value = hasEditableBidPrice ? (firstRow.bidPrice || '') : '';
                bidStartInput.disabled = !hasEditableBidPrice;
                bidStartInput.dataset.amCopyReadonly = hasEditableBidPrice ? '' : '1';
                bidStartInput.placeholder = hasEditableBidPrice ? '' : '无出价';
            }
            if (bidEndInput instanceof HTMLInputElement) {
                bidEndInput.value = hasEditableBidPrice ? (lastRow.bidPrice || firstRow.bidPrice || '') : '';
                bidEndInput.disabled = !hasEditableBidPrice;
                bidEndInput.dataset.amCopyReadonly = hasEditableBidPrice ? '' : '1';
                bidEndInput.placeholder = hasEditableBidPrice ? '' : '无出价';
            }
            if (bidGradientBtn instanceof HTMLButtonElement) {
                bidGradientBtn.disabled = !hasEditableBidPrice;
                bidGradientBtn.dataset.amCopyReadonly = hasEditableBidPrice ? '' : '1';
            }
            if (budgetFieldInput instanceof HTMLSelectElement) {
                budgetFieldInput.value = firstRow.budgetField || 'dayAverageBudget';
            }
            if (budgetValueInput instanceof HTMLInputElement) {
                budgetValueInput.value = firstRow.budgetValue || '';
            }
            this.previewCopyBidGradientStep(popup);
            return rows;
        },

        getCopyBudgetFieldLabel(field = '') {
            const map = {
                dayBudget: '每日预算',
                dayAverageBudget: '日均预算',
                totalBudget: '总预算',
                futureBudget: '冻结预算',
                orderAmount: '套餐预算'
            };
            return map[field] || '预算';
        },

        buildCopyBudgetFieldOptions(selectedField = '') {
            return ['dayBudget', 'dayAverageBudget', 'totalBudget', 'futureBudget', 'orderAmount'].map((field) => {
                const selected = field === selectedField ? ' selected' : '';
                return `<option value="${field}"${selected}>${this.escapeHtml(this.getCopyBudgetFieldLabel(field))}</option>`;
            }).join('');
        },

        readCopyOverviewRowsFromPopup(popup) {
            if (!(popup instanceof HTMLElement)) return [];
            const rows = [];
            popup.querySelectorAll('[data-am-copy-overview-row]').forEach((rowEl, index) => {
                if (!(rowEl instanceof HTMLElement)) return;
                const planNameInput = rowEl.querySelector('[data-am-copy-field="planName"]');
                const bidModeDisplayEl = rowEl.querySelector('[data-am-copy-field="bidModeDisplay"]');
                const bidPriceInput = rowEl.querySelector('[data-am-copy-field="bidPrice"]');
                const budgetFieldInput = rowEl.querySelector('[data-am-copy-field="budgetField"]');
                const budgetValueInput = rowEl.querySelector('[data-am-copy-field="budgetValue"]');
                const bidPriceEditable = bidPriceInput instanceof HTMLInputElement && bidPriceInput.dataset.amCopyReadonly !== '1' && !bidPriceInput.disabled;
                rows.push({
                    index,
                    campaignId: String(planNameInput?.getAttribute?.('data-campaign-id') || rowEl.getAttribute('data-campaign-id') || '').trim(),
                    originalPlanName: String(planNameInput?.getAttribute?.('data-original-plan-name') || '').replace(/\s+/g, ' ').trim(),
                    planName: String(planNameInput?.value || '').replace(/\s+/g, ' ').trim(),
                    bidModeDisplay: String(bidModeDisplayEl?.textContent || '').replace(/\s+/g, ' ').trim(),
                    bidPrice: bidPriceEditable ? this.normalizeCopyEditableNumber(bidPriceInput?.value || '') : '',
                    bidPriceEditable,
                    budgetField: String(budgetFieldInput?.value || 'dayAverageBudget').trim() || 'dayAverageBudget',
                    budgetValue: this.normalizeCopyEditableNumber(budgetValueInput?.value || '')
                });
            });
            return rows;
        },

        validateCopyOverviewRows(rows = [], options = {}) {
            const renameMode = String(options.mode || '').trim() === 'rename';
            if (!Array.isArray(rows) || !rows.length) return renameMode ? '没有可提交的计划名称' : '没有可提交的复制计划';
            const names = new Set();
            let changedCount = 0;
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i] || {};
                const lineNo = i + 1;
                if (!String(row.planName || '').trim()) return `第 ${lineNo} 行计划名称不能为空`;
                if (names.has(row.planName)) return `计划名称重复：${row.planName}`;
                names.add(row.planName);
                if (renameMode) {
                    if (!this.normalizeCampaignId(row.campaignId || '')) return `第 ${lineNo} 行计划ID无效`;
                    if (String(row.planName || '').trim() !== String(row.originalPlanName || '').trim()) changedCount += 1;
                    continue;
                }
                if (row.bidPrice === '' && String(row.rawBidPrice || '').trim()) return `第 ${lineNo} 行出价价格必须大于 0`;
                if (row.budgetValue === '' && String(row.rawBudgetValue || '').trim()) return `第 ${lineNo} 行预算必须大于 0`;
            }
            if (renameMode && changedCount <= 0) return '没有需要修改的计划名称';
            return '';
        },

        getCopyOverviewRowElements(popup) {
            if (!(popup instanceof HTMLElement)) return [];
            return Array.from(popup.querySelectorAll('[data-am-copy-overview-row]'))
                .filter(rowEl => rowEl instanceof HTMLElement);
        },

        getCopyEditableBidPriceInputs(popup) {
            if (!(popup instanceof HTMLElement)) return [];
            return Array.from(popup.querySelectorAll('[data-am-copy-field="bidPrice"]'))
                .filter(input => input instanceof HTMLInputElement && input.dataset.amCopyReadonly !== '1' && !input.disabled);
        },

        getCopyBulkNumberInputValue(popup, field) {
            const input = popup?.querySelector(`[data-am-copy-bulk="${field}"]`);
            return this.normalizeCopyEditableNumber(input?.value || '');
        },

        previewCopyBidGradientStep(popup) {
            const rowCount = this.getCopyEditableBidPriceInputs(popup).length;
            const startValue = this.getCopyBulkNumberInputValue(popup, 'bidStart');
            const endValue = this.getCopyBulkNumberInputValue(popup, 'bidEnd');
            const previewEl = popup?.querySelector('[data-am-copy-bulk="bidStepPreview"]');
            if (!(previewEl instanceof HTMLElement)) return;
            if (rowCount <= 0) {
                previewEl.textContent = '无可编辑出价';
                return;
            }
            if (!startValue || !endValue || rowCount <= 1) {
                previewEl.textContent = '间隔 -';
                return;
            }
            const step = (Number(endValue) - Number(startValue)) / (rowCount - 1);
            previewEl.textContent = `间隔 ${this.formatCopyBulkNumber(Math.abs(step)) || '0'}`;
        },

        applyCopyBidGradientToPopup(popup) {
            const inputs = this.getCopyEditableBidPriceInputs(popup);
            if (!inputs.length) return { ok: false, message: '源计划没有出价价格，无法批量编辑出价' };
            const startValue = this.getCopyBulkNumberInputValue(popup, 'bidStart');
            const endValue = this.getCopyBulkNumberInputValue(popup, 'bidEnd');
            if (!startValue || !endValue) return { ok: false, message: '请填写有效的首价和尾价' };
            const start = Number(startValue);
            const end = Number(endValue);
            const step = inputs.length > 1 ? (end - start) / (inputs.length - 1) : 0;
            inputs.forEach((input, index) => {
                input.value = this.formatCopyBulkNumber(start + (step * index));
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            });
            this.previewCopyBidGradientStep(popup);
            return { ok: true, message: `已应用出价梯度：${this.formatCopyBulkNumber(start)} 到 ${this.formatCopyBulkNumber(end)}` };
        },

        applyCopyBudgetBulkToPopup(popup) {
            const rowEls = this.getCopyOverviewRowElements(popup);
            if (!rowEls.length) return { ok: false, message: '没有可编辑的计划行' };
            const fieldInput = popup?.querySelector('[data-am-copy-bulk="budgetField"]');
            const valueInput = popup?.querySelector('[data-am-copy-bulk="budgetValue"]');
            const budgetField = String(fieldInput?.value || 'dayAverageBudget').trim() || 'dayAverageBudget';
            const budgetValue = this.normalizeCopyEditableNumber(valueInput?.value || '');
            if (!budgetValue) return { ok: false, message: '请填写有效的预算金额' };
            rowEls.forEach((rowEl) => {
                const select = rowEl.querySelector('[data-am-copy-field="budgetField"]');
                const input = rowEl.querySelector('[data-am-copy-field="budgetValue"]');
                if (select instanceof HTMLSelectElement) {
                    select.value = budgetField;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                }
                if (input instanceof HTMLInputElement) {
                    input.value = budgetValue;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
            return { ok: true, message: `已批量设置预算：${this.getCopyBudgetFieldLabel(budgetField)} ${budgetValue}` };
        },

        getRenamePlanNameInputs(popup) {
            if (!(popup instanceof HTMLElement)) return [];
            return Array.from(popup.querySelectorAll('[data-am-copy-field="planName"]'))
                .filter(input => input instanceof HTMLInputElement && !input.disabled);
        },

        setRenamePlanNameInputValue(input, value = '') {
            if (!(input instanceof HTMLInputElement)) return;
            input.value = this.normalizeBatchRenamePlanName(value);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        },

        applyRenamePrefixToPopup(popup) {
            const input = popup?.querySelector('[data-am-copy-rename="prefix"]');
            const prefix = String(input?.value || '');
            if (!prefix) return { ok: false, message: '请填写需要增加的前缀' };
            const inputs = this.getRenamePlanNameInputs(popup);
            if (!inputs.length) return { ok: false, message: '没有可编辑的计划名称' };
            inputs.forEach((nameInput) => {
                this.setRenamePlanNameInputValue(nameInput, `${prefix}${nameInput.value || ''}`);
            });
            return { ok: true, message: `已批量增加前缀：${prefix}` };
        },

        applyRenameSuffixToPopup(popup) {
            const input = popup?.querySelector('[data-am-copy-rename="suffix"]');
            const suffix = String(input?.value || '');
            if (!suffix) return { ok: false, message: '请填写需要增加的后缀' };
            const inputs = this.getRenamePlanNameInputs(popup);
            if (!inputs.length) return { ok: false, message: '没有可编辑的计划名称' };
            inputs.forEach((nameInput) => {
                this.setRenamePlanNameInputValue(nameInput, `${nameInput.value || ''}${suffix}`);
            });
            return { ok: true, message: `已批量增加后缀：${suffix}` };
        },

        applyRenameReplaceToPopup(popup) {
            const findInput = popup?.querySelector('[data-am-copy-rename="find"]');
            const replaceInput = popup?.querySelector('[data-am-copy-rename="replace"]');
            const findText = String(findInput?.value || '');
            const replaceText = String(replaceInput?.value || '');
            if (!findText) return { ok: false, message: '请填写需要查找的文本' };
            const inputs = this.getRenamePlanNameInputs(popup);
            if (!inputs.length) return { ok: false, message: '没有可编辑的计划名称' };
            let changedCount = 0;
            inputs.forEach((nameInput) => {
                const nextName = String(nameInput.value || '').split(findText).join(replaceText);
                if (nextName !== String(nameInput.value || '')) changedCount += 1;
                this.setRenamePlanNameInputValue(nameInput, nextName);
            });
            return changedCount
                ? { ok: true, message: `已替换 ${changedCount} 个计划名称` }
                : { ok: false, message: '没有匹配到需要替换的文本' };
        },

        applyRenameDeleteToPopup(popup) {
            const input = popup?.querySelector('[data-am-copy-rename="deleteText"]');
            const deleteText = String(input?.value || '');
            if (!deleteText) return { ok: false, message: '请填写需要删除的文本' };
            const findInput = popup?.querySelector('[data-am-copy-rename="find"]');
            const replaceInput = popup?.querySelector('[data-am-copy-rename="replace"]');
            if (findInput instanceof HTMLInputElement) findInput.value = deleteText;
            if (replaceInput instanceof HTMLInputElement) replaceInput.value = '';
            const result = this.applyRenameReplaceToPopup(popup);
            return result.ok ? { ok: true, message: `已删除包含“${deleteText}”的文本` } : result;
        },

        applyRenameSequenceToPopup(popup) {
            const baseInput = popup?.querySelector('[data-am-copy-rename="sequenceBase"]');
            const startInput = popup?.querySelector('[data-am-copy-rename="sequenceStart"]');
            const baseName = this.normalizeBatchRenamePlanName(baseInput?.value || '');
            const startRaw = String(startInput?.value || '1').trim() || '1';
            const startNumber = Number.parseInt(startRaw, 10);
            if (!baseName) return { ok: false, message: '请填写序号命名的基础名称' };
            if (!Number.isFinite(startNumber)) return { ok: false, message: '请填写有效的起始序号' };
            const inputs = this.getRenamePlanNameInputs(popup);
            if (!inputs.length) return { ok: false, message: '没有可编辑的计划名称' };
            const width = Math.max(startRaw.length, String(startNumber + inputs.length - 1).length);
            inputs.forEach((nameInput, index) => {
                const seq = String(startNumber + index).padStart(width, '0');
                this.setRenamePlanNameInputValue(nameInput, `${baseName}${seq}`);
            });
            return { ok: true, message: `已按序号批量改名：${baseName}${String(startNumber).padStart(width, '0')} 起` };
        },

        applyRenameCleanWhitespaceToPopup(popup) {
            const inputs = this.getRenamePlanNameInputs(popup);
            if (!inputs.length) return { ok: false, message: '没有可编辑的计划名称' };
            inputs.forEach((nameInput) => {
                this.setRenamePlanNameInputValue(nameInput, nameInput.value || '');
            });
            return { ok: true, message: '已清理计划名称空白' };
        },

        restoreRenameOriginalNamesToPopup(popup) {
            const inputs = this.getRenamePlanNameInputs(popup);
            if (!inputs.length) return { ok: false, message: '没有可编辑的计划名称' };
            inputs.forEach((nameInput) => {
                this.setRenamePlanNameInputValue(nameInput, nameInput.getAttribute('data-original-plan-name') || '');
            });
            return { ok: true, message: '已恢复原计划名称' };
        },

        applyRenameActionToPopup(popup, action = '') {
            const normalizedAction = String(action || '').trim();
            if (normalizedAction === 'prefix') return this.applyRenamePrefixToPopup(popup);
            if (normalizedAction === 'suffix') return this.applyRenameSuffixToPopup(popup);
            if (normalizedAction === 'replace') return this.applyRenameReplaceToPopup(popup);
            if (normalizedAction === 'deleteText') return this.applyRenameDeleteToPopup(popup);
            if (normalizedAction === 'sequence') return this.applyRenameSequenceToPopup(popup);
            if (normalizedAction === 'clean') return this.applyRenameCleanWhitespaceToPopup(popup);
            if (normalizedAction === 'restore') return this.restoreRenameOriginalNamesToPopup(popup);
            return { ok: false, message: '未识别的计划名称批量操作' };
        },

        openCopyPlanOverviewDialog(context = {}, submitCallback, options = {}) {
            return new Promise((resolve, reject) => {
                const oldPopup = document.getElementById('am-campaign-copy-overview-popup');
                if (oldPopup) oldPopup.remove();
                const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
                const focusBackTarget = this.createCopyFocusTarget(context, previousActiveElement);
                const titleId = 'am-copy-overview-title';
                const statusId = 'am-copy-overview-status';
                const dialogMode = String(options.mode || context.mode || '').trim();
                const renameMode = dialogMode === 'rename';
                const titleText = renameMode ? '批量修改计划名称' : '复制计划一览';
                const iconName = renameMode ? 'edit' : 'campaign-copy';
                const readyStatusText = renameMode ? '确认后才会提交计划名称修改请求。' : '确认后才会提交创建请求。';
                const preparingStatusText = renameMode ? '已打开预览，正在读取计划名称...' : '已打开预览，正在读取源计划详情...';
                const readyAfterPrepareText = renameMode ? '计划名称已读取完成，确认后才会提交修改请求。' : '源计划详情已读取完成，确认后才会提交创建请求。';
                const stillPreparingText = renameMode ? '计划名称仍在读取中，请稍候。' : '源计划详情仍在读取中，请稍候。';
                const runningText = renameMode ? '修改中：正在提交计划名称修改请求，请勿重复操作。' : '生成中：正在提交复制请求，请勿重复操作。';
                const runningButtonText = renameMode ? '修改中...' : '生成中...';
                const submitButtonText = renameMode ? '确认修改' : '确认生成';
                const successText = renameMode ? '修改成功，正在刷新计划列表。' : '生成成功，正在打开成功确认。';
                const cancelledMessage = renameMode ? '已取消批量修改计划名称' : '已取消复制';
                const cancelledCode = renameMode ? 'rename_preview_cancelled' : 'copy_preview_cancelled';
                const rows = Array.isArray(context.previewRows) && context.previewRows.length
                    ? context.previewRows
                    : this.buildCopyOverviewRows(context);
                let activeContext = context;
                let contextReady = context.preparing !== true;
                let prepareContextTimerId = 0;
                const popup = document.createElement('div');
                popup.id = 'am-campaign-copy-overview-popup';
                if (dialogMode) popup.setAttribute('data-am-copy-dialog-mode', dialogMode);
                popup.setAttribute('role', 'dialog');
                popup.setAttribute('aria-modal', 'true');
                popup.setAttribute('aria-labelledby', titleId);
                popup.setAttribute('aria-describedby', statusId);
                const subtitleText = this.getCopyOverviewSubtitle(context, rows);
                const firstRow = rows[0] || {};
                const lastRow = rows[rows.length - 1] || firstRow;
                const hasEditableBidPrice = rows.some(row => row?.bidPriceEditable !== false && this.normalizeCopyEditableNumber(row?.bidPrice || ''));
                const rowHtml = this.buildCopyOverviewRowHtml(rows, { mode: dialogMode });
                popup.innerHTML = `
                    <section class="am-copy-overview-card">
                        <header class="am-copy-overview-header">
                            <div class="am-copy-overview-heading">
                                <span class="am-copy-overview-icon">${renderAmIcon(iconName, { size: 18, strokeWidth: 2.1 })}</span>
                                <div>
                                    <div class="am-copy-overview-title-row">
                                        <h3 class="am-copy-overview-title" id="${titleId}">${this.escapeHtml(titleText)}</h3>
                                        <span class="am-copy-overview-state" data-am-copy-overview-state>${contextReady ? '待确认' : '读取中'}</span>
                                    </div>
                                    <p class="am-copy-overview-subtitle" data-am-copy-overview-subtitle>${this.escapeHtml(subtitleText)}</p>
                                </div>
                            </div>
                            <button type="button" class="am-copy-overview-close" aria-label="关闭">${renderAmIcon('close', { size: 14, strokeWidth: 2.4 })}</button>
                        </header>
                        <div class="am-copy-overview-bulkbar"${renameMode ? ' data-am-copy-mode-hidden="rename"' : ''}>
                            <div class="am-copy-overview-bulk-group">
                                <span class="am-copy-overview-bulk-title">批量出价</span>
                                <label class="am-copy-overview-bulk-field">
                                    <span>首价</span>
                                    <input data-am-copy-bulk="bidStart" class="am-copy-overview-bulk-input" type="number" min="0.01" step="0.01" value="${this.escapeHtml(hasEditableBidPrice ? (firstRow.bidPrice || '') : '')}" ${hasEditableBidPrice ? '' : 'disabled data-am-copy-readonly="1" placeholder="无出价"'} />
                                </label>
                                <label class="am-copy-overview-bulk-field">
                                    <span>尾价</span>
                                    <input data-am-copy-bulk="bidEnd" class="am-copy-overview-bulk-input" type="number" min="0.01" step="0.01" value="${this.escapeHtml(hasEditableBidPrice ? (lastRow.bidPrice || firstRow.bidPrice || '') : '')}" ${hasEditableBidPrice ? '' : 'disabled data-am-copy-readonly="1" placeholder="无出价"'} />
                                </label>
                                <span data-am-copy-bulk="bidStepPreview" class="am-copy-overview-bulk-step">间隔 -</span>
                                <button type="button" data-am-copy-bulk-action="bidGradient" class="am-copy-overview-bulk-btn" ${hasEditableBidPrice ? '' : 'disabled data-am-copy-readonly="1"'}>应用梯度</button>
                            </div>
                            <div class="am-copy-overview-bulk-group">
                                <span class="am-copy-overview-bulk-title">批量预算</span>
                                <label class="am-copy-overview-bulk-field">
                                    <span>类型</span>
                                    <select data-am-copy-bulk="budgetField" class="am-copy-overview-bulk-select">${this.buildCopyBudgetFieldOptions(firstRow.budgetField || 'dayAverageBudget')}</select>
                                </label>
                                <label class="am-copy-overview-bulk-field">
                                    <span>预算</span>
                                    <input data-am-copy-bulk="budgetValue" class="am-copy-overview-bulk-input" type="number" min="0.01" step="0.01" value="${this.escapeHtml(firstRow.budgetValue || '')}" />
                                </label>
                                <button type="button" data-am-copy-bulk-action="budgetAll" class="am-copy-overview-bulk-btn">应用预算</button>
                            </div>
                        </div>
                        ${renameMode ? `
                        <div class="am-copy-overview-bulkbar am-copy-overview-renamebar" data-am-copy-renamebar="1">
                            <div class="am-copy-overview-bulk-group">
                                <span class="am-copy-overview-bulk-title">前后缀</span>
                                <label class="am-copy-overview-bulk-field">
                                    <span>前缀</span>
                                    <input data-am-copy-rename="prefix" class="am-copy-overview-bulk-input" type="text" />
                                </label>
                                <button type="button" data-am-copy-rename-action="prefix" class="am-copy-overview-bulk-btn">加前缀</button>
                                <label class="am-copy-overview-bulk-field">
                                    <span>后缀</span>
                                    <input data-am-copy-rename="suffix" class="am-copy-overview-bulk-input" type="text" />
                                </label>
                                <button type="button" data-am-copy-rename-action="suffix" class="am-copy-overview-bulk-btn">加后缀</button>
                            </div>
                            <div class="am-copy-overview-bulk-group">
                                <span class="am-copy-overview-bulk-title">替换</span>
                                <label class="am-copy-overview-bulk-field">
                                    <span>查找</span>
                                    <input data-am-copy-rename="find" class="am-copy-overview-bulk-input" type="text" />
                                </label>
                                <label class="am-copy-overview-bulk-field">
                                    <span>替换为</span>
                                    <input data-am-copy-rename="replace" class="am-copy-overview-bulk-input" type="text" />
                                </label>
                                <button type="button" data-am-copy-rename-action="replace" class="am-copy-overview-bulk-btn">替换</button>
                                <label class="am-copy-overview-bulk-field">
                                    <span>删除</span>
                                    <input data-am-copy-rename="deleteText" class="am-copy-overview-bulk-input" type="text" />
                                </label>
                                <button type="button" data-am-copy-rename-action="deleteText" class="am-copy-overview-bulk-btn">删除文本</button>
                            </div>
                            <div class="am-copy-overview-bulk-group">
                                <span class="am-copy-overview-bulk-title">序号</span>
                                <label class="am-copy-overview-bulk-field">
                                    <span>基础名</span>
                                    <input data-am-copy-rename="sequenceBase" class="am-copy-overview-bulk-input" type="text" />
                                </label>
                                <label class="am-copy-overview-bulk-field">
                                    <span>起始</span>
                                    <input data-am-copy-rename="sequenceStart" class="am-copy-overview-bulk-input" type="number" min="0" step="1" value="1" />
                                </label>
                                <button type="button" data-am-copy-rename-action="sequence" class="am-copy-overview-bulk-btn">按序号改名</button>
                                <button type="button" data-am-copy-rename-action="clean" class="am-copy-overview-bulk-btn">清理名称</button>
                                <button type="button" data-am-copy-rename-action="restore" class="am-copy-overview-bulk-btn">恢复原名</button>
                            </div>
                        </div>` : ''}
                        <div class="am-copy-overview-table-wrap">
                            <table class="am-copy-overview-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>计划名称</th>
                                        <th${renameMode ? ' data-am-copy-mode-hidden="rename"' : ''}>计划出价方式</th>
                                        <th${renameMode ? ' data-am-copy-mode-hidden="rename"' : ''}>出价价格</th>
                                        <th${renameMode ? ' data-am-copy-mode-hidden="rename"' : ''}>预算</th>
                                    </tr>
                                </thead>
                                <tbody data-am-copy-overview-tbody>${rowHtml}</tbody>
                            </table>
                        </div>
                        <div class="am-copy-overview-status ${contextReady ? 'is-info' : 'is-running'}" id="${statusId}" data-am-copy-overview-status role="status" aria-live="polite">${contextReady ? this.escapeHtml(readyStatusText) : this.escapeHtml(preparingStatusText)}</div>
                        <footer class="am-copy-overview-footer">
                            <button type="button" class="am-copy-overview-submit">${this.escapeHtml(submitButtonText)}</button>
                            <button type="button" class="am-copy-overview-cancel">取消</button>
                        </footer>
                    </section>
                `;
                document.body.appendChild(popup);
                const statusEl = popup.querySelector('[data-am-copy-overview-status]');
                const submitBtn = popup.querySelector('.am-copy-overview-submit');
                const cancelBtn = popup.querySelector('.am-copy-overview-cancel');
                const closeBtn = popup.querySelector('.am-copy-overview-close');
                const bidStartInput = popup.querySelector('[data-am-copy-bulk="bidStart"]');
                const bidEndInput = popup.querySelector('[data-am-copy-bulk="bidEnd"]');
                const bidGradientBtn = popup.querySelector('[data-am-copy-bulk-action="bidGradient"]');
                const budgetBulkBtn = popup.querySelector('[data-am-copy-bulk-action="budgetAll"]');
                const renameActionButtons = Array.from(popup.querySelectorAll('[data-am-copy-rename-action]'))
                    .filter(el => el instanceof HTMLButtonElement);
                const restoreFocus = () => {
                    this.restoreFocusWhenReady(focusBackTarget);
                };
                const clearPrepareContextTimer = () => {
                    if (!prepareContextTimerId) return;
                    clearTimeout(prepareContextTimerId);
                    prepareContextTimerId = 0;
                };
                const removePopup = () => {
                    clearPrepareContextTimer();
                    popup.remove();
                    restoreFocus();
                };
                const rejectCancelled = () => {
                    const err = new Error(cancelledMessage);
                    err.cancelled = true;
                    err.code = cancelledCode;
                    reject(err);
                };
                const setStatus = (message, level = 'info') => {
                    if (!(statusEl instanceof HTMLElement)) return;
                    statusEl.textContent = message;
                    statusEl.className = `am-copy-overview-status is-${level}`;
                };
                const setReadyState = (ready, message = '') => {
                    contextReady = !!ready;
                    popup.classList.toggle('is-preparing', !contextReady);
                    const stateEl = popup.querySelector('[data-am-copy-overview-state]');
                    if (stateEl instanceof HTMLElement) {
                        stateEl.textContent = contextReady ? '待确认' : '读取中';
                    }
                    if (submitBtn instanceof HTMLButtonElement) {
                        submitBtn.disabled = !contextReady;
                    }
                    popup.querySelectorAll('[data-am-copy-bulk-action], [data-am-copy-rename-action]').forEach((el) => {
                        if ('disabled' in el) el.disabled = !contextReady || el.dataset.amCopyReadonly === '1';
                    });
                    popup.querySelectorAll('input, select').forEach((el) => {
                        if ('disabled' in el) el.disabled = !contextReady || el.dataset.amCopyReadonly === '1';
                    });
                    if (message) setStatus(message, contextReady ? 'info' : 'running');
                };
                const setRunning = (running) => {
                    popup.classList.toggle('is-running', !!running);
                    popup.querySelectorAll('input, select').forEach((el) => {
                        if ('disabled' in el) el.disabled = !!running || el.dataset.amCopyReadonly === '1';
                    });
                    if (submitBtn instanceof HTMLButtonElement) {
                        submitBtn.disabled = !!running;
                        submitBtn.textContent = running ? runningButtonText : submitButtonText;
                    }
                    popup.querySelectorAll('[data-am-copy-bulk-action], [data-am-copy-rename-action]').forEach((el) => {
                        if ('disabled' in el) el.disabled = !!running || el.dataset.amCopyReadonly === '1';
                    });
                    if (cancelBtn instanceof HTMLButtonElement) cancelBtn.disabled = !!running;
                    if (closeBtn instanceof HTMLButtonElement) closeBtn.disabled = !!running;
                };
                const cancel = () => {
                    if (popup.classList.contains('is-running')) return;
                    removePopup();
                    rejectCancelled();
                };
                cancelBtn?.addEventListener('click', cancel);
                closeBtn?.addEventListener('click', cancel);
                popup.addEventListener('keydown', (event) => {
                    if (event.key !== 'Escape') return;
                    event.preventDefault();
                    cancel();
                });
                bidStartInput?.addEventListener('input', () => this.previewCopyBidGradientStep(popup));
                bidEndInput?.addEventListener('input', () => this.previewCopyBidGradientStep(popup));
                bidGradientBtn?.addEventListener('click', () => {
                    const result = this.applyCopyBidGradientToPopup(popup);
                    setStatus(result.message, result.ok ? 'info' : 'error');
                });
                budgetBulkBtn?.addEventListener('click', () => {
                    const result = this.applyCopyBudgetBulkToPopup(popup);
                    setStatus(result.message, result.ok ? 'info' : 'error');
                });
                renameActionButtons.forEach((button) => {
                    button.addEventListener('click', () => {
                        const result = this.applyRenameActionToPopup(popup, button.dataset.amCopyRenameAction || '');
                        setStatus(result.message, result.ok ? 'info' : 'error');
                    });
                });
                this.previewCopyBidGradientStep(popup);
                if (!contextReady) {
                    setReadyState(false);
                }
                submitBtn?.addEventListener('click', async () => {
                    if (!contextReady) {
                        setStatus(stillPreparingText, 'running');
                        return;
                    }
                    const editedRows = this.readCopyOverviewRowsFromPopup(popup).map((row) => ({
                        ...row,
                        rawBidPrice: popup.querySelector(`[data-am-copy-overview-row="${row.index}"] [data-am-copy-field="bidPrice"]`)?.value || '',
                        rawBudgetValue: popup.querySelector(`[data-am-copy-overview-row="${row.index}"] [data-am-copy-field="budgetValue"]`)?.value || ''
                    }));
                    const error = this.validateCopyOverviewRows(editedRows, { mode: dialogMode });
                    if (error) {
                        setStatus(error, 'error');
                        return;
                    }
                    try {
                        setRunning(true);
                        setStatus(runningText, 'running');
                        clearPrepareContextTimer();
                        const result = await submitCallback(editedRows, activeContext);
                        setStatus(successText, 'success');
                        if (renameMode) {
                            removePopup();
                        } else {
                            popup.remove();
                        }
                        resolve(result);
                    } catch (err) {
                        setRunning(false);
                        setStatus(err?.message || '生成失败，请检查日志后重试。', 'error');
                    }
                });
                const startPrepareContext = () => {
                    Promise.resolve(typeof options.prepareContext === 'function' ? options.prepareContext() : activeContext)
                        .then((preparedContext) => {
                        if (!preparedContext || popup.isConnected === false) return;
                        activeContext = preparedContext;
                        activeContext.preparing = false;
                        this.renderCopyOverviewRows(popup, activeContext);
                        setReadyState(true, readyAfterPrepareText);
                        })
                        .catch((err) => {
                        contextReady = false;
                        setStatus(err?.message || '读取源计划详情失败，请关闭后重试。', 'error');
                        const stateEl = popup.querySelector('[data-am-copy-overview-state]');
                        if (stateEl instanceof HTMLElement) stateEl.textContent = '读取失败';
                        });
                };
                const schedulePrepareContext = () => {
                    if (typeof setTimeout === 'function') {
                        clearPrepareContextTimer();
                        prepareContextTimerId = setTimeout(() => {
                            prepareContextTimerId = 0;
                            startPrepareContext();
                        }, 0);
                        return;
                    }
                    startPrepareContext();
                };
                requestAnimationFrame(() => {
                    const firstInput = popup.querySelector('[data-am-copy-field="planName"]');
                    if (firstInput && typeof firstInput.focus === 'function') firstInput.focus();
                    schedulePrepareContext();
                });
            });
        },

        async prepareCopyCurrentPlanContext(campaignId, triggerEl, copyMode = 'inherit', options = {}) {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) throw new Error('计划ID无效');
            const mode = this.normalizeCopyMode(copyMode);
            const label = this.getCopyModeLabel(mode);
            const bizCandidates = this.getCandidateBizCodes(triggerEl);
            const authContext = this.resolveAuthContext(bizCandidates[0] || this.DEFAULT_BIZ_CODE);
            const apiPromise = options.preloadedApiPromise || this.preloadCopyPlanApi(options);
            const source = await this.resolveCopySourcePlan(id, triggerEl, bizCandidates, authContext);
            const sceneName = this.getSceneNameByBizCode(source.bizCode || bizCandidates[0] || '');
            if (!sceneName) {
                throw new Error(`暂不支持复制该业务线：${source.bizCode || bizCandidates[0] || '-'}`);
            }
            const api = await apiPromise;
            if (!api || typeof api.copyCurrentPlanByScene !== 'function') {
                throw new Error('计划复制 API 未就绪，请刷新页面后重试');
            }
            const targetOnlineStatus = mode === 'start'
                ? 1
                : (mode === 'pause' ? 0 : this.resolveCopyTargetOnlineStatus(source));
            const copyCount = this.normalizeCopyBatchCount(options.copyCount || this.readCopyBatchCount(triggerEl));
            const remotePlanNames = await this.collectRemoteCampaignPlanNames(
                source.bizCode || bizCandidates[0] || '',
                authContext,
                source?.campaign?.campaignName || source?.campaignName || ''
            );
            const usedPlanNames = Array.from(new Set([
                ...this.collectVisibleCampaignPlanNames(document),
                ...remotePlanNames
            ]));
            source.usedPlanNames = usedPlanNames;
            const previewRows = this.buildCopyOverviewRows({
                campaignId: id,
                source,
                sceneName,
                copyCount,
                usedPlanNames,
                triggerEl
            });
            return {
                campaignId: id,
                bizCode: source.bizCode || bizCandidates[0] || this.getCurrentCampaignBizCode() || this.DEFAULT_BIZ_CODE,
                mode,
                label,
                source,
                sceneName,
                api,
                copyCount,
                usedPlanNames,
                targetOnlineStatus,
                previewRows,
                triggerEl,
                options
            };
        },

        async submitPreparedCopyCurrentPlan(context = {}, editedRows = []) {
            const id = this.normalizeCampaignId(context.campaignId);
            const mode = this.normalizeCopyMode(context.mode);
            const label = context.label || this.getCopyModeLabel(mode);
            let api = context.api;
            if (!api || typeof api.copyCurrentPlanByScene !== 'function') {
                api = await waitForKeywordPlanApiAccessor({
                    requiredMethod: 'copyCurrentPlanByScene',
                    timeoutMs: 3000,
                    intervalMs: 120
                });
                context.api = api;
            }
            if (!id || !api || typeof api.copyCurrentPlanByScene !== 'function') {
                throw new Error('计划复制 API 未就绪，请刷新页面后重试');
            }
            const targetBizCode = this.resolveCopyContextBizCode(context);
            context.bizCode = targetBizCode;
            if (this.isPlainRecord(context.source)) {
                context.source.bizCode = this.normalizeBizCode(context.source.bizCode || '') || targetBizCode;
                if (this.isPlainRecord(context.source.campaign)) {
                    context.source.campaign.bizCode = this.normalizeBizCode(context.source.campaign.bizCode || '') || targetBizCode;
                }
            }
            const copyPlanRows = Array.isArray(editedRows) && editedRows.length ? editedRows : (context.previewRows || []);
            const submitOptions = this.isPlainRecord(context.options) ? { ...context.options } : {};
            delete submitOptions.preloadedApiPromise;
            const result = await api.copyCurrentPlanByScene(context.sceneName, context.source, {
                ...submitOptions,
                bizCode: targetBizCode,
                copyMode: mode,
                copyCount: copyPlanRows.length || context.copyCount,
                usedPlanNames: context.usedPlanNames,
                targetOnlineStatus: context.targetOnlineStatus,
                copyPlanRows,
                pauseIfStartedAfterCreate: context.targetOnlineStatus === 0,
                conflictPolicy: 'none'
            });
            const copySource = result?.copySource || {};
            const newPlanText = this.formatPlanNameListForLog(copySource.newPlanNames || copySource.newPlanName || []);
            Logger.log(`📋 ${label}结果：源计划${id}，新计划${newPlanText}，跟随源状态=${context.targetOnlineStatus === 1 ? '开启' : '暂停'}，创建结果=${result?.ok ? '成功' : '失败'}`);
            if (!result?.ok) {
                const firstError = Array.isArray(result?.failures) && result.failures.length
                    ? (result.failures[0]?.error || result.failures[0]?.message || '')
                    : '';
                throw new Error(firstError || '创建接口返回失败');
            }
            const createdCampaignIds = this.resolveCopiedCampaignIds(result);
            const successCount = Number(result?.successCount || 0);
            if (!createdCampaignIds.length && successCount <= 0) {
                const firstError = Array.isArray(result?.failures) && result.failures.length
                    ? (result.failures[0]?.error || result.failures[0]?.message || '')
                    : '';
                throw new Error(firstError || '创建接口未返回成功的新计划');
            }
            return result;
        },

        async runCopyCurrentPlanFlow(campaignId, triggerEl, copyMode = 'inherit', options = {}) {
            const quickContext = this.buildQuickCopyCurrentPlanContext(campaignId, triggerEl, copyMode, options);
            if (options.skipCopyOverview === true) {
                const context = await this.prepareCopyCurrentPlanContext(campaignId, triggerEl, copyMode, options);
                Logger.log(`📋 ${context.label}准备：源计划${context.campaignId}，场景=${context.sceneName}，商品=${context.source.itemId || '-'}，复制数量=${context.copyCount}，跟随源状态=${context.targetOnlineStatus === 1 ? '开启' : '暂停'}`);
                return this.submitPreparedCopyCurrentPlan(context, context.previewRows);
            }
            return this.openCopyPlanOverviewDialog(quickContext, (editedRows, preparedContext) => (
                this.submitPreparedCopyCurrentPlan(preparedContext, editedRows)
            ), {
                prepareContext: async () => {
                    const preloadedApiPromise = this.preloadCopyPlanApi(options);
                    const contextOptions = {
                        ...(this.isPlainRecord(options) ? options : {}),
                        preloadedApiPromise
                    };
                    const context = await this.prepareCopyCurrentPlanContext(campaignId, triggerEl, copyMode, contextOptions);
                    Logger.log(`📋 ${context.label}准备：源计划${context.campaignId}，场景=${context.sceneName}，商品=${context.source.itemId || '-'}，复制数量=${context.copyCount}，跟随源状态=${context.targetOnlineStatus === 1 ? '开启' : '暂停'}`);
                    return context;
                }
            });
        },

        setConcurrentButtonRunning(campaignId, running) {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) return;
            const selector = `.am-campaign-search-btn[data-am-campaign-concurrent-start="1"][data-campaign-id="${id}"]`;
            document.querySelectorAll(selector).forEach((btn) => {
                if (!(btn instanceof HTMLButtonElement)) return;
                if (running) {
                    if (!btn.dataset.amTitleBak) btn.dataset.amTitleBak = btn.title || '';
                    btn.classList.add('is-running');
                    btn.disabled = true;
                    btn.title = `并发开启执行中：${id}`;
                    return;
                }
                btn.classList.remove('is-running');
                btn.disabled = false;
                const titleBak = btn.dataset.amTitleBak;
                btn.title = titleBak || `并发开启关联计划：${id}`;
                delete btn.dataset.amTitleBak;
                if (!this.isConcurrentStartEnabled()) {
                    btn.remove();
                }
            });
        },

        async runConcurrentStartFlow(campaignId, triggerEl) {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) throw new Error('计划ID无效');

            const bizCandidates = this.getCandidateBizCodes(triggerEl);
            const authContext = this.resolveAuthContext(bizCandidates[0] || this.DEFAULT_BIZ_CODE);
            const hintedItemId = this.inferItemIdFromElement(triggerEl, {
                allowLocationFallback: false,
                allowBodyFallback: false
            });
            const locationItemId = this.inferItemIdFromElement(triggerEl, {
                allowLocationFallback: true,
                allowBodyFallback: false
            });
            const itemIdTrace = [];
            if (hintedItemId) {
                itemIdTrace.push(`商品ID识别：按钮上下文候选 ${hintedItemId}`);
            } else if (locationItemId) {
                itemIdTrace.push(`商品ID识别：地址栏候选 ${locationItemId}（仅候选，不直接采用）`);
            }
            const inferredItemId = await this.resolveItemIdByCampaignId(
                id,
                bizCandidates,
                authContext,
                hintedItemId,
                itemIdTrace
            );
            if (!inferredItemId && !hintedItemId && locationItemId) {
                itemIdTrace.push(`商品ID识别：接口未命中，未使用地址栏候选 ${locationItemId}，避免串商品`);
            }
            itemIdTrace.slice(0, 8).forEach((text) => this.appendConcurrentLog(text, 'info'));
            let resolvedTargets = await this.resolveConcurrentTargetsByItem(inferredItemId, bizCandidates, authContext);
            if (!Array.isArray(resolvedTargets?.allTargets) || !resolvedTargets.allTargets.length) {
                resolvedTargets = await this.resolveConcurrentTargets(id, bizCandidates, authContext, { itemId: inferredItemId });
            }
            const resolvedItemId = this.normalizeItemId(resolvedTargets?.itemId || inferredItemId);
            if (this.concurrentLogTitleEl) {
                this.concurrentLogTitleEl.textContent = `并发开启执行日志 - 计划${id}${resolvedItemId ? ` / 商品${resolvedItemId}` : ''}`;
            }
            const allTargets = Array.isArray(resolvedTargets?.allTargets) ? resolvedTargets.allTargets : [];
            const resumeTargets = Array.isArray(resolvedTargets?.resumeTargets) ? resolvedTargets.resumeTargets : [];
            const mandatorySiteTargets = Array.isArray(resolvedTargets?.mandatorySiteTargets) ? resolvedTargets.mandatorySiteTargets : [];
            const unresolvedErrors = Array.isArray(resolvedTargets?.unresolvedErrors) ? resolvedTargets.unresolvedErrors : [];
            const siteCount = allTargets.filter(item => this.normalizeBizCode(item?.bizCode || '') === 'onebpSite').length;
            const searchCount = allTargets.filter(item => this.normalizeBizCode(item?.bizCode || '') === 'onebpSearch').length;
            const leadCount = allTargets.filter(item => this.normalizeBizCode(item?.bizCode || '') === 'onebpAdStrategyLiuZi').length;
            const crowdCount = allTargets.filter(item => this.normalizeBizCode(item?.bizCode || '') === 'onebpDisplay').length;
            const knownCount = siteCount + searchCount + leadCount + crowdCount;
            const otherCount = Math.max(0, allTargets.length - knownCount);
            if (!allTargets.length) {
                this.appendConcurrentLog('未识别到该商品下可操作计划', 'error');
                throw new Error('未识别到同商品计划，请先手动切换一次计划开关后重试');
            }
            if (!resumeTargets.length) {
                this.appendConcurrentLog('未识别到可重开计划，无法执行并发开启', 'error');
                throw new Error('未识别到可重开计划，请检查当前商品计划状态后重试');
            }
            if (unresolvedErrors.length) {
                const text = unresolvedErrors.slice(0, 3).join('；');
                const extra = unresolvedErrors.length > 3 ? `（另有${unresolvedErrors.length - 3}条）` : '';
                Logger.log(`⚠️ 部分计划识别失败：${text}${extra} `, true);
                this.appendConcurrentLog(`部分计划识别失败：${text}${extra}`, 'warn');
            }
            Logger.log(
                `🚦 并发开启准备：商品${resolvedItemId || '-'}共${allTargets.length}个计划，原在投${resumeTargets.length}个；全量暂停后重开：${resumeTargets.map(item => `${item.campaignId}@${item.bizCode}`).join(' + ')} `
            );
            this.appendConcurrentLog(
                `计划识别完成：商品${resolvedItemId || '-'}共${allTargets.length}个计划，货品全站必开${mandatorySiteTargets.length}个，执行重开${resumeTargets.length}个`,
                'info'
            );
            this.appendConcurrentLog(
                `同商品分类统计：货品全站${siteCount}，关键词${searchCount}，线索${leadCount}，人群${crowdCount}${otherCount ? `，其它${otherCount}` : ''}`,
                'info'
            );
            this.appendConcurrentLog(
                `同商品全部计划：${allTargets.map((item) => {
                    const tag = item?.active === true ? '原在投' : (item?.active === false ? '原暂停' : '状态待确认');
                    return `${item.campaignId}@${item.bizCode}(${tag})`;
                }).join(' + ') || '-'}`,
                'info'
            );
            if (mandatorySiteTargets.length) {
                this.appendConcurrentLog(
                    `货品全站必开计划：${mandatorySiteTargets.map(item => `${item.campaignId}@${item.bizCode}`).join(' + ')}`,
                    'info'
                );
            }

            const pauseSettled = await Promise.allSettled(
                allTargets.map(target => this.updateCampaignStatus(target.campaignId, target.bizCode, 0, authContext))
            );
            const pauseErrors = pauseSettled
                .filter(item => item.status === 'rejected')
                .map(item => item.reason?.message || '暂停失败');
            const pauseSuccessCount = pauseSettled.length - pauseErrors.length;
            this.appendConcurrentLog(`全量暂停完成：成功${pauseSuccessCount}，失败${pauseErrors.length}`, pauseErrors.length ? 'warn' : 'success');
            if (pauseErrors.length) {
                Logger.log(`⚠️ 全量暂停存在失败：${pauseErrors.join('；')} `, true);
                this.appendConcurrentLog(`全量暂停错误：${pauseErrors.join('；')}`, 'warn');
                if (pauseErrors.length >= allTargets.length) {
                    this.appendConcurrentLog('全量暂停全部失败，流程终止', 'error');
                    throw new Error(`同商品计划全量暂停失败：${pauseErrors.join('；')}`);
                }
            }
            await this.sleep(180);

            let lastError = '';
            for (let attempt = 1; attempt <= this.MAX_START_RETRIES; attempt++) {
                this.appendConcurrentLog(`开始第${attempt}次并发开启，目标${resumeTargets.length}个`, 'info');
                const startSettled = await Promise.allSettled(
                    resumeTargets.map(target => this.updateCampaignStatus(target.campaignId, target.bizCode, 1, authContext))
                );
                const startErrors = startSettled
                    .filter(item => item.status === 'rejected')
                    .map(item => item.reason?.message || '开启失败');
                const startResults = startSettled
                    .filter(item => item.status === 'fulfilled')
                    .map(item => item.value);
                const allByResponse = startResults.length === resumeTargets.length
                    && startResults.every(item => item.active === true);
                this.appendConcurrentLog(
                    `第${attempt}次开启请求完成：成功${startResults.length}，失败${startErrors.length}`,
                    startErrors.length ? 'warn' : 'success'
                );
                if (allByResponse) {
                    this.appendConcurrentLog(`第${attempt}次响应即确认全部开启`, 'success');
                    return {
                        attempt,
                        mode: 'response',
                        itemId: resolvedItemId,
                        targets: resumeTargets,
                        allTargets,
                        mandatorySiteTargets
                    };
                }

                const verify = await this.verifyTargetsStarted(resumeTargets, authContext, resolvedItemId);
                if (verify.ok) {
                    this.appendConcurrentLog(`第${attempt}次状态校验通过，全部目标已开启`, 'success');
                    return {
                        attempt,
                        mode: 'verify',
                        itemId: resolvedItemId,
                        targets: resumeTargets,
                        allTargets,
                        mandatorySiteTargets
                    };
                }
                if (!startErrors.length && verify.soft) {
                    this.appendConcurrentLog(`第${attempt}次状态接口无明确返回，按请求成功处理`, 'warn');
                    return {
                        attempt,
                        mode: 'request_only',
                        itemId: resolvedItemId,
                        targets: resumeTargets,
                        allTargets,
                        mandatorySiteTargets
                    };
                }

                let breakthroughResult = null;
                if (this.shouldRunSiteCustomBreakthrough(resumeTargets, startErrors, verify)) {
                    breakthroughResult = await this.runSiteCustomBreakthroughStrategy({
                        attempt,
                        resumeTargets,
                        allTargets,
                        authContext,
                        itemId: resolvedItemId
                    });
                    if (breakthroughResult?.ok) {
                        return {
                            attempt,
                            mode: breakthroughResult.mode || 'site_custom_breakthrough',
                            itemId: resolvedItemId,
                            targets: resumeTargets,
                            allTargets,
                            mandatorySiteTargets
                        };
                    }
                }

                lastError = [startErrors.join('；'), verify.error, breakthroughResult?.error || ''].filter(Boolean).join('；')
                    || `第${attempt}次并发开启失败`;
                this.appendConcurrentLog(`第${attempt}次未成功：${lastError}`, 'warn');
                if (attempt >= this.MAX_START_RETRIES) break;

                Logger.log(`⚠️ 并发开启第${attempt}次未成功：${lastError}，准备重试`, true);
                await Promise.allSettled(
                    allTargets.map(target => this.updateCampaignStatus(target.campaignId, target.bizCode, 0, authContext))
                );
                await this.sleep(Math.min(2400, this.RETRY_DELAY_MS * attempt));
            }
            this.appendConcurrentLog(`重试结束仍失败：${lastError || `重试${this.MAX_START_RETRIES}次后仍未同时开启`}`, 'error');
            throw new Error(lastError || `重试${this.MAX_START_RETRIES}次后仍未同时开启`);
        },

        createButton(campaignId, options = {}) {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) return null;
            const rawMode = String(options.mode || '').trim();
            const mode = ['concurrent', 'copy'].includes(rawMode) ? rawMode : 'quick';
            const bizCode = this.normalizeBizCode(options.bizCode || '');
            const itemId = this.normalizeItemId(options.itemId || '');

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = mode === 'concurrent'
                ? 'am-campaign-search-btn am-campaign-concurrent-start-btn'
                : (mode === 'copy'
                    ? 'am-campaign-search-btn am-campaign-copy-btn'
                    : 'am-campaign-search-btn');
            btn.setAttribute('data-campaign-id', id);
            btn.dataset.campaignId = id;
            if (bizCode) {
                btn.setAttribute('data-biz-code', bizCode);
                btn.dataset.bizCode = bizCode;
            }
            if (itemId) {
                btn.setAttribute('data-item-id', itemId);
                btn.dataset.itemId = itemId;
            }
            if (mode === 'concurrent') {
                btn.setAttribute('data-am-campaign-concurrent-start', '1');
                btn.title = `并发开启关联计划：${id}`;
                btn.setAttribute('aria-label', `并发开启关联计划：${id}`);
                btn.innerHTML = this.CONCURRENT_START_ICON_SVG.trim();
            } else if (mode === 'copy') {
                const copyMode = 'inherit';
                const label = this.getCopyModeLabel(copyMode);
                const copyBatchCount = this.normalizeCopyBatchCount(options.copyCount || 1);
                btn.setAttribute('data-am-campaign-copy', copyMode);
                btn.setAttribute('data-am-copy-batch-count', String(copyBatchCount));
                btn.dataset.amCopyBatchCount = String(copyBatchCount);
                btn.title = `${label}：${id}`;
                btn.setAttribute('aria-label', `${label}：${id}`);
                btn.innerHTML = `<span class="am-campaign-copy-icon">${this.COPY_ICON_SVG.trim()}</span><span class="am-campaign-copy-label">${label}</span><span class="am-wxt-copy-multi" data-am-campaign-copy-count-badge="${copyBatchCount}" title="点击增加，右键减少，滚轮可调节"><span class="am-wxt-copy-multi-icon">${renderAmIcon('plus', { size: 12, strokeWidth: 2.6 })}</span><span class="am-wxt-copy-multi-num">${copyBatchCount}</span></span>`;
            } else {
                btn.setAttribute('data-am-campaign-quick', '1');
                btn.title = `查数计划ID：${id}`;
                btn.setAttribute('aria-label', `查数计划ID：${id}`);
                btn.innerHTML = this.ICON_SVG.trim();
            }
            return btn;
        },

        attachHoverHost(anchorEl) {
            if (!(anchorEl instanceof Element)) return null;
            const rowHost = anchorEl.closest('tr, [role="row"], .mx-table-row, li');
            const compactHost = anchorEl.closest('.asiYysqLgo, .asiYysqLgr, .ellipsis');
            const host = rowHost
                || compactHost
                || anchorEl.parentElement
                || anchorEl;
            if (!(host instanceof HTMLElement)) return null;
            if (host === document.body || host === document.documentElement) return null;
            if (!host.classList.contains('am-campaign-hover-host')) {
                registerExpectedMainAssistantClassMutation(host, 'am-campaign-hover-host');
                host.classList.add('am-campaign-hover-host');
            }
            if (rowHost instanceof HTMLElement && compactHost instanceof HTMLElement && compactHost !== rowHost) {
                if (!compactHost.classList.contains('am-campaign-hover-host')) {
                    registerExpectedMainAssistantClassMutation(compactHost, 'am-campaign-hover-host');
                    compactHost.classList.add('am-campaign-hover-host');
                }
            }
            return host;
        },

        isConcurrentStartEnabled() {
            return !!State.config.showConcurrentStartButton;
        },

        syncConcurrentButtonsVisibility() {
            const enabled = this.isConcurrentStartEnabled();
            if (!enabled) {
                document.querySelectorAll('.am-campaign-search-btn[data-am-campaign-concurrent-start="1"]').forEach((btn) => {
                    if (!(btn instanceof HTMLElement)) return;
                    if (btn.classList.contains('is-running') || btn.disabled) return;
                    btn.remove();
                });
                return;
            }
            this.ensureConcurrentButtonsForQuickEntries();
            document.querySelectorAll('.am-campaign-search-btn[data-am-campaign-concurrent-start="1"]').forEach((btn) => {
                if (!(btn instanceof HTMLElement)) return;
                btn.style.display = '';
            });
        },

        ensureConcurrentButtonsForQuickEntries() {
            if (!this.isConcurrentStartEnabled()) return;
            document.querySelectorAll('.am-campaign-search-btn[data-am-campaign-quick="1"]').forEach((quickBtn) => {
                if (!(quickBtn instanceof HTMLElement) || !quickBtn.isConnected) return;
                const campaignId = this.normalizeCampaignId(quickBtn.getAttribute('data-campaign-id') || quickBtn.dataset?.campaignId || '');
                if (!campaignId) return;
                let pointer = quickBtn.nextElementSibling;
                let anchor = quickBtn;
                for (let i = 0; i < 10 && pointer; i++) {
                    if (!pointer.matches?.('.am-campaign-search-btn')) break;
                    if (
                        pointer.matches?.('.am-campaign-search-btn[data-am-campaign-concurrent-start="1"]')
                        && pointer.getAttribute('data-campaign-id') === campaignId
                    ) {
                        return;
                    }
                    pointer = pointer.nextElementSibling;
                }
                const concurrentBtn = this.createButton(campaignId, {
                    mode: 'concurrent',
                    bizCode: quickBtn.getAttribute('data-biz-code') || quickBtn.dataset?.bizCode || '',
                    itemId: quickBtn.getAttribute('data-item-id') || quickBtn.dataset?.itemId || ''
                });
                if (concurrentBtn) anchor.insertAdjacentElement('afterend', concurrentBtn);
            });
        },

        isCampaignOperationGroup(el) {
            if (!(el instanceof Element)) return false;
            if (el.matches('[data-am-campaign-operation-copy-host="1"]')) return true;
            const text = String(el.textContent || '').replace(/\s+/g, '');
            const hasDetail = text.includes('详情');
            const hasMore = text.includes('更多');
            const hasCoreAction = text.includes('高级设置')
                || text.includes('报表')
                || text.includes('推广解读')
                || text.includes('复制');
            const hasSceneAction = text.includes('AI点睛')
                || text.includes('人群设置')
                || text.includes('置顶')
                || text.includes('一键起量')
                || text.includes('相似品跟投')
                || text.includes('修改趋势')
                || text.includes('创意起量')
                || text.includes('加速测图')
                || text.includes('冷启加速');
            return hasDetail
                && hasMore
                && hasCoreAction
                && (hasSceneAction || text.includes('报表') || text.includes('推广解读'))
                && el.querySelectorAll('button, [role="button"], a').length >= 3;
        },

        getCampaignOperationGroups() {
            const groups = new Set();
            document.querySelectorAll('.wO_WXptarh.clearfix, .wO_WXbzarh.clearfix, [data-am-campaign-operation-copy-host="1"]').forEach((el) => {
                if (this.isCampaignOperationGroup(el)) groups.add(el);
            });
            if (!groups.size) {
                document.querySelectorAll('td > div > div, [role="row"] div').forEach((el) => {
                    if (this.isCampaignOperationGroup(el)) groups.add(el);
                });
            }
            return Array.from(groups);
        },

        isBatchPlanSettingHost(el) {
            if (!(el instanceof Element)) return false;
            if (el.closest('#am-campaign-batch-plus-menu')) return false;
            const text = String(el.textContent || '').replace(/\s+/g, '');
            if (!text.includes('批量计划设置')) return false;
            const rect = el.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0 || rect.height > 80) return false;
            return !!el.querySelector('button, [role="button"]') || el.matches('button, [role="button"], .mxgc-popmenu, .wO_WXbzf');
        },

        getBatchPlanSettingHosts() {
            const hosts = new Set();
            document.querySelectorAll('.mxgc-popmenu, .wO_WXbzf, button, [role="button"]').forEach((el) => {
                if (!this.isBatchPlanSettingHost(el)) return;
                const host = el.closest('.wO_WXbzf, .mxgc-popmenu') || el;
                if (host instanceof HTMLElement && this.isBatchPlanSettingHost(host)) {
                    hosts.add(host);
                }
            });
            return Array.from(hosts);
        },

        ensureBatchPlanHostAnchor(host) {
            if (!(host instanceof HTMLElement)) return '';
            let anchor = String(host.getAttribute('data-am-batch-plan-anchor') || '').trim();
            if (!anchor) {
                anchor = `am-native-batch-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
                host.setAttribute('data-am-batch-plan-anchor', anchor);
            }
            return anchor;
        },

        stripBatchPlusNativeAttrs(root) {
            if (!(root instanceof Element)) return;
            const nodes = [root, ...Array.from(root.querySelectorAll('*'))];
            nodes.forEach((node) => {
                Array.from(node.attributes || []).forEach((attr) => {
                    const name = attr.name;
                    if (
                        name === 'id'
                        || name === 'data-spm'
                        || name === 'data-spm-click'
                        || name === 'data-spm-anchor-id'
                        || name === 'data-aplus-ae'
                        || name === 'data-spm-exp-on'
                        || name === 'aria-describedby'
                        || name === 'aria-controls'
                        || name.startsWith('mx-')
                        || name === 'mxv'
                        || name === 'mxa'
                        || name === 'mxs'
                        || name === 'mxo'
                        || name === 'mxe'
                        || name === 'mxc'
                    ) {
                        node.removeAttribute(name);
                    }
                });
            });
        },

        renderBatchPlusChevronIcon() {
            return `<span class="asiYysjJaJ am-campaign-batch-plus-chevron" data-am-batch-plus-fallback-chevron="1" aria-hidden="true">${renderAmIcon('chevron-down', { size: 12, strokeWidth: 2.2 })}</span>`;
        },

        buildBatchPlusNativeFallback() {
            const host = document.createElement('span');
            host.className = 'wO_WXbzf mxgc-popmenu';
            host.innerHTML = `
                <span class="minw100percent">
                    <button type="button" class="asiYysjJaL asiYysjJaS-normal asiYysjJaS-custom">
                        <span class="asiYysjJaM">
                            批量+
                            ${this.renderBatchPlusChevronIcon()}
                        </span>
                    </button>
                </span>
            `;
            return host;
        },

        setBatchPlusNativeContent(root) {
            if (!(root instanceof HTMLElement)) return;
            const button = root.querySelector('button');
            const contentEl = button?.querySelector('.asiYysjJaM')
                || button?.querySelector('span')
                || button;
            if (contentEl instanceof HTMLElement) {
                const arrowHost = contentEl.querySelector('.asiYysjJaJ')?.outerHTML
                    || this.renderBatchPlusChevronIcon();
                contentEl.innerHTML = `批量+${arrowHost}`;
            }
            root.querySelectorAll('[title], [aria-label]').forEach((el) => {
                if (!(el instanceof HTMLElement)) return;
                const title = String(el.getAttribute('title') || '');
                const label = String(el.getAttribute('aria-label') || '');
                if (title.includes('批量计划设置')) el.setAttribute('title', title.replace(/批量计划设置/g, '批量+'));
                if (label.includes('批量计划设置')) el.setAttribute('aria-label', label.replace(/批量计划设置/g, '批量+'));
            });
        },

        pruneBatchPlusNativeButtonOnly(root) {
            if (!(root instanceof HTMLElement)) return;
            const button = root.querySelector('button');
            if (!(button instanceof HTMLElement)) return;
            let keep = button;
            while (keep && keep !== root) {
                const parent = keep.parentElement;
                if (!(parent instanceof HTMLElement)) break;
                Array.from(parent.children).forEach((child) => {
                    if (child !== keep) child.remove();
                });
                keep = parent;
            }
        },

        isBatchPlanSettingDisabled(host) {
            if (!(host instanceof Element)) return false;
            const view = String(host.getAttribute('mx-view') || '').toLowerCase();
            if (/(?:[?&])disabled=(?:true|1)(?:&|$)/.test(view)) return true;
            if (host.getAttribute('disabled') === 'true' || host.getAttribute('aria-disabled') === 'true') return true;
            const button = host.querySelector('button');
            if (button instanceof HTMLButtonElement) return button.disabled;
            if (button instanceof HTMLElement) {
                return button.getAttribute('disabled') === 'true'
                    || button.getAttribute('aria-disabled') === 'true';
            }
            return false;
        },

        copyBatchPlusNativeButtonStyle(batchPlusHost, nativeHost = null) {
            if (!(batchPlusHost instanceof HTMLElement) || !(nativeHost instanceof Element)) return;
            const sourceButton = nativeHost.querySelector('button');
            const targetButton = batchPlusHost.querySelector('button');
            if (!(sourceButton instanceof HTMLElement) || !(targetButton instanceof HTMLElement)) return;
            const sourceStyle = window.getComputedStyle(sourceButton);
            const sourceRect = sourceButton.getBoundingClientRect();
            const buttonStyleKeys = [
                'display',
                'alignItems',
                'justifyContent',
                'gap',
                'height',
                'minHeight',
                'padding',
                'border',
                'borderRadius',
                'background',
                'backgroundColor',
                'color',
                'font',
                'fontSize',
                'fontWeight',
                'lineHeight',
                'boxSizing',
                'cursor',
                'verticalAlign',
                'whiteSpace',
                'textAlign',
                'transition'
            ];
            buttonStyleKeys.forEach((key) => {
                targetButton.style[key] = sourceStyle[key];
            });
            batchPlusHost.style.width = 'max-content';
            batchPlusHost.style.minWidth = '0';
            targetButton.style.width = 'auto';
            targetButton.style.minWidth = '0';
            if (sourceRect.height > 0) {
                const height = `${Math.round(sourceRect.height)}px`;
                batchPlusHost.style.height = height;
                targetButton.style.height = height;
            }
            const innerWrap = targetButton.parentElement;
            if (innerWrap instanceof HTMLElement) {
                innerWrap.style.display = 'inline-block';
                innerWrap.style.width = 'auto';
                innerWrap.style.minWidth = '0';
                innerWrap.style.height = '100%';
            }
        },

        syncBatchPlusNativeState(batchPlusHost, nativeHost = null, bizCode = '') {
            if (!(batchPlusHost instanceof HTMLElement)) return;
            const targetBizCode = this.normalizeBizCode(bizCode || this.getCurrentCampaignBizCode() || this.DEFAULT_BIZ_CODE) || this.DEFAULT_BIZ_CODE;
            const nativeDisabled = nativeHost instanceof Element ? this.isBatchPlanSettingDisabled(nativeHost) : false;
            const open = batchPlusHost.classList.contains('is-open');
            if (nativeHost instanceof HTMLElement) {
                batchPlusHost.className = nativeHost.className;
            }
            batchPlusHost.classList.add('am-campaign-batch-plus-native');
            batchPlusHost.classList.toggle('is-open', open);
            batchPlusHost.removeAttribute('disabled');
            batchPlusHost.setAttribute('data-am-campaign-batch-plus', '1');
            batchPlusHost.setAttribute('data-biz-code', targetBizCode);
            batchPlusHost.setAttribute('data-am-native-disabled', nativeDisabled ? '1' : '0');
            batchPlusHost.dataset.bizCode = targetBizCode;
            batchPlusHost.setAttribute('aria-haspopup', 'menu');
            batchPlusHost.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (open) {
                batchPlusHost.setAttribute('aria-controls', 'am-campaign-batch-plus-menu');
            } else {
                batchPlusHost.removeAttribute('aria-controls');
            }
            batchPlusHost.setAttribute('aria-disabled', 'false');
            batchPlusHost.classList.remove('is-disabled');
            batchPlusHost.title = '批量+';
            this.pruneBatchPlusNativeButtonOnly(batchPlusHost);
            this.setBatchPlusNativeContent(batchPlusHost);
            this.copyBatchPlusNativeButtonStyle(batchPlusHost, nativeHost);

            const button = batchPlusHost.querySelector('button');
            if (button instanceof HTMLButtonElement) {
                const nativeButton = nativeHost instanceof Element ? nativeHost.querySelector('button') : null;
                if (nativeButton instanceof HTMLElement) {
                    button.className = nativeButton.className;
                }
                button.type = 'button';
                button.disabled = false;
                button.title = '批量+';
                button.setAttribute('aria-label', '批量+');
                button.removeAttribute('disabled');
                button.setAttribute('aria-disabled', 'false');
            }
            batchPlusHost.querySelectorAll('.mxgc-popover').forEach((popover) => {
                if (popover instanceof HTMLElement) popover.style.display = 'none';
            });
        },

        createBatchPlusButton(bizCode = '', nativeHost = null) {
            const source = nativeHost instanceof HTMLElement ? nativeHost : null;
            const host = source ? source.cloneNode(true) : this.buildBatchPlusNativeFallback();
            if (!(host instanceof HTMLElement)) return this.buildBatchPlusNativeFallback();
            this.stripBatchPlusNativeAttrs(host);
            this.syncBatchPlusNativeState(host, source, bizCode);
            return host;
        },

        syncBatchPlusWrapLayout(wrap, nativeHost = null) {
            if (!(wrap instanceof HTMLElement)) return;
            const source = nativeHost instanceof HTMLElement ? nativeHost : null;
            const sourceStyle = source ? window.getComputedStyle(source) : null;
            const shouldFloatLeft = sourceStyle?.float === 'left' || /\bfl\b/.test(source?.className || '');
            wrap.classList.toggle('fl', shouldFloatLeft);
            wrap.style.display = shouldFloatLeft ? 'block' : 'inline-block';
            wrap.style.float = shouldFloatLeft ? 'left' : 'none';
        },

        enhanceBatchPlusNodes() {
            const bizCode = this.normalizeBizCode(this.getCurrentCampaignBizCode() || this.DEFAULT_BIZ_CODE) || this.DEFAULT_BIZ_CODE;
            const hosts = this.getBatchPlanSettingHosts();
            hosts.forEach((host) => {
                if (!(host instanceof HTMLElement)) return;
                const anchor = this.ensureBatchPlanHostAnchor(host);
                const existing = host.parentElement?.querySelector(`.am-campaign-batch-plus-wrap[data-am-native-batch-anchor="${anchor}"]`);
                if (existing instanceof HTMLElement) {
                    const batchPlusHost = existing.querySelector('[data-am-campaign-batch-plus="1"]');
                    if (batchPlusHost instanceof HTMLElement) this.syncBatchPlusNativeState(batchPlusHost, host, bizCode);
                    this.syncBatchPlusWrapLayout(existing, host);
                    existing.setAttribute('data-biz-code', bizCode);
                    return;
                }
                const wrap = document.createElement('span');
                wrap.className = 'am-campaign-batch-plus-wrap';
                this.syncBatchPlusWrapLayout(wrap, host);
                wrap.setAttribute('data-biz-code', bizCode);
                wrap.setAttribute('data-am-native-batch-anchor', anchor);
                wrap.appendChild(this.createBatchPlusButton(bizCode, host));
                host.insertAdjacentElement('afterend', wrap);
            });
            document.querySelectorAll('.am-campaign-batch-plus-wrap').forEach((wrap) => {
                if (!(wrap instanceof HTMLElement)) return;
                const previous = wrap.previousElementSibling;
                if (previous && this.isBatchPlanSettingHost(previous)) {
                    const batchPlusHost = wrap.querySelector('[data-am-campaign-batch-plus="1"]');
                    if (batchPlusHost instanceof HTMLElement) this.syncBatchPlusNativeState(batchPlusHost, previous, wrap.getAttribute('data-biz-code') || bizCode);
                    this.syncBatchPlusWrapLayout(wrap, previous);
                    return;
                }
                wrap.remove();
            });
        },

        resolveCampaignContextFromElement(root) {
            if (!(root instanceof Element)) return null;
            const existingBtn = root.querySelector('.am-campaign-search-btn[data-campaign-id]');
            const linkWithCampaign = Array.from(root.querySelectorAll('a[href*="campaignId="], a[href*="campaign_id="], [mx-href*="campaignId="], [mx-href*="campaign_id="]'))
                .find((el) => {
                    const raw = el.getAttribute('href') || el.getAttribute('mx-href') || '';
                    return !!this.normalizeCampaignId(MagicReport.extractCampaignId(raw));
                });
            const rawLink = linkWithCampaign
                ? (linkWithCampaign.getAttribute('href') || linkWithCampaign.getAttribute('mx-href') || '')
                : '';
            let campaignId = this.normalizeCampaignId(existingBtn?.getAttribute('data-campaign-id') || existingBtn?.dataset?.campaignId);
            if (!campaignId && rawLink) {
                campaignId = this.normalizeCampaignId(MagicReport.extractCampaignId(rawLink));
            }
            if (!campaignId) {
                const textMatch = String(root.textContent || '').match(/计划\s*(?:ID|id)?\s*[：:]\s*(\d{6,})/);
                campaignId = this.normalizeCampaignId(textMatch?.[1]);
            }
            if (!campaignId) return null;

            const bizCode = this.normalizeBizCode(
                existingBtn?.getAttribute('data-biz-code')
                || existingBtn?.dataset?.bizCode
                || this.parseBizCodeFromRaw(rawLink)
                || this.inferBizCodeFromElement(root)
            );
            const itemId = this.normalizeItemId(
                existingBtn?.getAttribute('data-item-id')
                || existingBtn?.dataset?.itemId
                || this.inferItemIdFromElement(root, {
                    allowLocationFallback: false,
                    allowBodyFallback: false
                })
            );
            return { campaignId, bizCode, itemId };
        },

        resolveOperationGroupCopyContext(group) {
            if (!(group instanceof Element)) return null;
            const directContext = this.resolveCampaignContextFromElement(group);
            if (directContext) return directContext;
            const operationRow = group.closest('tr, [role="row"]');
            let pointer = operationRow?.previousElementSibling || null;
            for (let i = 0; i < 4 && pointer; i++, pointer = pointer.previousElementSibling) {
                const context = this.resolveCampaignContextFromElement(pointer);
                if (context) return context;
            }
            return null;
        },

        cleanupInlineCopyButtons() {
            document.querySelectorAll('.am-campaign-search-btn[data-am-campaign-copy]').forEach((btn) => {
                if (!(btn instanceof HTMLElement)) return;
                const host = btn.closest('[data-am-campaign-operation-copy-host="1"]');
                if (host && this.isCampaignOperationGroup(host) && btn.getAttribute('data-am-campaign-copy') === 'inherit') return;
                btn.remove();
            });
        },

        enhanceOperationNodes() {
            this.cleanupInlineCopyButtons();
            this.getCampaignOperationGroups().forEach((group) => {
                if (!(group instanceof HTMLElement)) return;
                const context = this.resolveOperationGroupCopyContext(group);
                if (!context?.campaignId) return;
                group.setAttribute('data-am-campaign-operation-copy-host', '1');

                const ensureCopyButton = () => {
                    const existing = group.querySelector(`.am-campaign-search-btn[data-am-campaign-copy="inherit"][data-campaign-id="${context.campaignId}"]`);
                    const btn = existing instanceof HTMLButtonElement
                        ? existing
                        : this.createButton(context.campaignId, {
                            mode: 'copy',
                            bizCode: context.bizCode,
                            itemId: context.itemId
                        });
                    if (!(btn instanceof HTMLButtonElement)) return null;
                    btn.classList.add('am-campaign-operation-copy-btn');
                    if (context.bizCode) {
                        btn.setAttribute('data-biz-code', context.bizCode);
                        btn.dataset.bizCode = context.bizCode;
                    }
                    if (context.itemId) {
                        btn.setAttribute('data-item-id', context.itemId);
                        btn.dataset.itemId = context.itemId;
                    }
                    if (!existing) group.appendChild(btn);
                    return btn;
                };

                ensureCopyButton();
            });
        },

        run() {
            if (window.top !== window.self) return;
            if (!document.body) return;
            this.enhanceTextNodes();
            this.enhanceLinkNodes();
            this.enhanceOperationNodes();
            this.enhanceBatchPlusNodes();
            this.syncConcurrentButtonsVisibility();
        },

        enhanceTextNodes() {
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        const parent = node.parentElement;
                        if (!parent) return NodeFilter.FILTER_REJECT;
                        if (this.isInIgnoredArea(parent)) return NodeFilter.FILTER_REJECT;
                        if (parent.closest('.am-campaign-id-token, .am-campaign-search-btn')) return NodeFilter.FILTER_REJECT;
                        if (parent.closest('a, button, [role="button"], [mx-click]')) return NodeFilter.FILTER_REJECT;
                        const tag = parent.tagName;
                        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT'].includes(tag)) return NodeFilter.FILTER_REJECT;
                        const text = node.nodeValue || '';
                        if (!text || !text.includes('计划')) return NodeFilter.FILTER_REJECT;
                        if (!/计划\s*(?:ID|id)?\s*[：:]\s*\d{6,}/.test(text)) return NodeFilter.FILTER_REJECT;
                        return NodeFilter.FILTER_ACCEPT;
                    }
                }
            );

            const textNodes = [];
            let node = walker.nextNode();
            while (node) {
                textNodes.push(node);
                node = walker.nextNode();
            }

            textNodes.forEach((textNode) => {
                const parentEl = textNode.parentElement;
                this.attachHoverHost(parentEl);
                const rawText = textNode.nodeValue || '';
                const regex = new RegExp(this.TEXT_PATTERN.source, 'g');
                const contextBizCode = this.inferBizCodeFromElement(parentEl);
                const contextItemId = this.inferItemIdFromElement(parentEl, {
                    allowLocationFallback: false,
                    allowBodyFallback: false
                });
                let match;
                let cursor = 0;
                let hasMatch = false;
                const frag = document.createDocumentFragment();

                while ((match = regex.exec(rawText))) {
                    const fullText = match[0];
                    const campaignId = this.normalizeCampaignId(match[1]);
                    const start = match.index;

                    if (start > cursor) {
                        frag.appendChild(document.createTextNode(rawText.slice(cursor, start)));
                    }

                    if (campaignId) {
                        const token = document.createElement('span');
                        token.className = 'am-campaign-id-token';
                        token.textContent = fullText;
                        frag.appendChild(token);

                        const quickBtn = this.createButton(campaignId, {
                            mode: 'quick',
                            bizCode: contextBizCode,
                            itemId: contextItemId
                        });
                        if (quickBtn) frag.appendChild(quickBtn);
                        if (this.isConcurrentStartEnabled()) {
                            const concurrentBtn = this.createButton(campaignId, {
                                mode: 'concurrent',
                                bizCode: contextBizCode,
                                itemId: contextItemId
                            });
                            if (concurrentBtn) frag.appendChild(concurrentBtn);
                        }
                        hasMatch = true;
                    } else {
                        frag.appendChild(document.createTextNode(fullText));
                    }

                    cursor = start + fullText.length;
                }

                if (!hasMatch) return;
                if (cursor < rawText.length) {
                    frag.appendChild(document.createTextNode(rawText.slice(cursor)));
                }
                textNode.parentNode?.replaceChild(frag, textNode);
            });
        },

        enhanceLinkNodes() {
            const selector = [
                'a[href*="campaignId="]',
                'a[href*="campaign_id="]',
                '[mx-href*="campaignId="]',
                '[mx-href*="campaign_id="]'
            ].join(',');

            document.querySelectorAll(selector).forEach((el) => {
                if (!(el instanceof Element) || this.isInIgnoredArea(el)) return;
                if (el.closest('.am-campaign-id-token')) return;

                const raw = el.getAttribute('href') || el.getAttribute('mx-href') || '';
                const id = this.normalizeCampaignId(MagicReport.extractCampaignId(raw));
                if (!id) return;
                const bizCode = this.parseBizCodeFromRaw(raw) || this.inferBizCodeFromElement(el);
                const itemId = this.inferItemIdFromElement(el, {
                    allowLocationFallback: false,
                    allowBodyFallback: false
                });
                this.attachHoverHost(el);

                const siblingButtons = [];
                let pointer = el.nextElementSibling;
                for (let i = 0; i < 10 && pointer; i++) {
                    if (pointer.matches?.('.am-campaign-search-btn')) {
                        siblingButtons.push(pointer);
                        pointer = pointer.nextElementSibling;
                        continue;
                    }
                    break;
                }
                const quickBtn = siblingButtons.find(btn =>
                    btn.matches?.('.am-campaign-search-btn[data-am-campaign-quick="1"]')
                    && btn.getAttribute('data-campaign-id') === id
                );
                const concurrentBtn = siblingButtons.find(btn =>
                    btn.matches?.('.am-campaign-search-btn[data-am-campaign-concurrent-start="1"]')
                    && btn.getAttribute('data-campaign-id') === id
                );
                if (itemId) {
                    [quickBtn, concurrentBtn].forEach((btn) => {
                        if (!(btn instanceof HTMLButtonElement)) return;
                        btn.setAttribute('data-item-id', itemId);
                        btn.dataset.itemId = itemId;
                    });
                }

                let anchor = quickBtn || el;
                if (concurrentBtn) anchor = concurrentBtn;
                if (!quickBtn) {
                    const createdQuick = this.createButton(id, { mode: 'quick', bizCode, itemId });
                    if (createdQuick) {
                        el.insertAdjacentElement('afterend', createdQuick);
                        anchor = createdQuick;
                    }
                }
                if (this.isConcurrentStartEnabled() && !concurrentBtn) {
                    const createdConcurrent = this.createButton(id, { mode: 'concurrent', bizCode, itemId });
                    if (createdConcurrent) {
                        anchor.insertAdjacentElement('afterend', createdConcurrent);
                        anchor = createdConcurrent;
                    }
                }
            });
        }
    };
