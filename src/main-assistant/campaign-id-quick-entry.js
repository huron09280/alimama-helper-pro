    const CampaignIdQuickEntry = {
        initialized: false,
        runningCampaignIds: new Set(),
        runningCopyKeys: new Set(),
        copyPlanNameCache: new Set(),
        concurrentLogPopup: null,
        concurrentLogTitleEl: null,
        concurrentLogStatusEl: null,
        concurrentLogBodyEl: null,
        campaignItemIdCache: new Map(),
        IGNORE_SELECTOR: '#am-helper-panel, #am-magic-report-popup, #alimama-escort-helper-ui, #am-report-capture-panel, #am-campaign-concurrent-log-popup, #am-campaign-copy-success-popup',
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
                            sourceCampaignId: id,
                            label,
                            copyCount,
                            statusText
                        });
                    }).catch((err) => {
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
                this.openConcurrentLogPopup(id, itemId);
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
                this.copyPlanNameCache.add(name);
            });
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
            const commonName = this.resolvePlanNameCommonPart([sourceCampaignName, ...newPlanNames]);
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

        navigateToCopySuccessSearch(result = {}, context = {}) {
            const targetUrl = this.buildCopySuccessSearchUrl(result, context);
            if (!targetUrl) {
                window.location.reload();
                return;
            }
            const currentUrl = `${window.location.origin}${window.location.pathname}${window.location.hash}`;
            if (targetUrl === window.location.href || targetUrl === currentUrl) {
                window.location.reload();
                return;
            }
            window.location.assign(targetUrl);
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
                '点击“确定并刷新”后将搜索计划名称公共部分。'
            ].join('\n');
        },

        showCopySuccessDialogAndRefresh(result = {}, context = {}) {
            const message = this.buildCopySuccessDialogMessage(result, context);
            const oldPopup = document.getElementById('am-campaign-copy-success-popup');
            if (oldPopup) oldPopup.remove();

            const popup = document.createElement('div');
            popup.id = 'am-campaign-copy-success-popup';
            popup.setAttribute('role', 'dialog');
            popup.setAttribute('aria-modal', 'true');
            popup.setAttribute('aria-label', '复制计划成功');

            const card = document.createElement('section');
            card.className = 'am-copy-success-card';
            const header = document.createElement('div');
            header.className = 'am-copy-success-header';
            const icon = document.createElement('span');
            icon.className = 'am-copy-success-icon';
            icon.textContent = '!';
            const title = document.createElement('h3');
            title.className = 'am-copy-success-title';
            title.textContent = '复制计划已成功';
            const body = document.createElement('pre');
            body.className = 'am-copy-success-body';
            body.textContent = message.replace(/^复制计划已成功\n?/, '');
            const footer = document.createElement('div');
            footer.className = 'am-copy-success-footer';
            const confirmBtn = document.createElement('button');
            confirmBtn.type = 'button';
            confirmBtn.className = 'am-copy-success-confirm';
            confirmBtn.textContent = '确定并刷新';
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
                popup.remove();
            }, { once: true });

            header.appendChild(icon);
            header.appendChild(title);
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
                popup.innerHTML = `
                    <div class="am-concurrent-log-card" role="dialog" aria-modal="true" aria-label="并发开启执行日志">
                        <div class="am-concurrent-log-header">
                            <span id="am-concurrent-log-title">并发开启执行日志</span>
                            <button type="button" class="am-concurrent-log-close" aria-label="关闭并发日志">${renderAmIcon('close', { size: 16, strokeWidth: 2.2 })}</button>
                        </div>
                        <div class="am-concurrent-log-status is-running" id="am-concurrent-log-status">执行中...</div>
                        <div class="am-concurrent-log-body" id="am-concurrent-log-body"></div>
                    </div>
                `;
                document.body.appendChild(popup);
            }
            this.concurrentLogPopup = popup;
            this.concurrentLogTitleEl = popup.querySelector('#am-concurrent-log-title');
            this.concurrentLogStatusEl = popup.querySelector('#am-concurrent-log-status');
            this.concurrentLogBodyEl = popup.querySelector('#am-concurrent-log-body');
            const closeBtn = popup.querySelector('.am-concurrent-log-close');
            if (closeBtn && !closeBtn.dataset.amBound) {
                closeBtn.dataset.amBound = '1';
                closeBtn.addEventListener('click', () => {
                    if (popup) popup.style.display = 'none';
                });
            }
            return popup;
        },

        openConcurrentLogPopup(campaignId, itemId = '') {
            const popup = this.ensureConcurrentLogPopup();
            if (!(popup instanceof HTMLElement)) return;
            popup.style.display = 'flex';
            if (this.concurrentLogTitleEl) {
                this.concurrentLogTitleEl.textContent = `并发开启执行日志 - 计划${campaignId}${itemId ? ` / 商品${itemId}` : ''}`;
            }
            if (this.concurrentLogBodyEl) {
                this.concurrentLogBodyEl.innerHTML = '';
            }
            this.setConcurrentLogStatus('执行中：正在识别商品计划并准备并发开启', 'running');
        },

        setConcurrentLogStatus(text, level = 'running') {
            this.ensureConcurrentLogPopup();
            if (!(this.concurrentLogStatusEl instanceof HTMLElement)) return;
            const normalizedLevel = ['running', 'success', 'error'].includes(level) ? level : 'running';
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
            this.campaignItemIdCache.set(normalizedCampaignId, normalizedItemId);
            PlanIdentityUtils.rememberCampaignItemId(normalizedCampaignId, normalizedItemId);
        },

        getCampaignItemId(campaignId) {
            const normalizedCampaignId = this.normalizeCampaignId(campaignId);
            if (!normalizedCampaignId) return '';
            const localCached = this.normalizeItemId(this.campaignItemIdCache.get(normalizedCampaignId) || '');
            if (localCached) return localCached;
            const sharedCached = PlanIdentityUtils.getCampaignItemId(normalizedCampaignId);
            if (sharedCached) {
                this.campaignItemIdCache.set(normalizedCampaignId, sharedCached);
            }
            return sharedCached;
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

        extractCopyCrowdListFromPayload(payload = {}, expectedCampaignId = '') {
            const expectedId = this.normalizeCampaignId(expectedCampaignId);
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
                if (expectedId && rowCampaignId && rowCampaignId !== expectedId) return;
                if (Array.isArray(row.crowdList)) {
                    row.crowdList.forEach(item => crowdList.push(item));
                    return;
                }
                if (this.isPlainRecord(row.crowd)) {
                    crowdList.push(row);
                }
            });
            return crowdList
                .filter(item => this.isPlainRecord(item))
                .map(item => this.cloneCopyData(item));
        },

        async queryCampaignCrowdList(campaignId, bizCode, authContext) {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) return { crowdList: [] };
            const targetBizCode = this.normalizeBizCode(bizCode) || authContext?.bizCode || this.DEFAULT_BIZ_CODE;
            const query = new URLSearchParams({
                csrfId: String(authContext?.csrfId || ''),
                bizCode: targetBizCode
            });
            const url = `https://one.alimama.com/crowd/findList.json?${query.toString()}`;
            const payload = {
                bizCode: targetBizCode,
                crowdBindQueryList: [{
                    campaignId: Number(id)
                }],
                csrfId: String(authContext?.csrfId || ''),
                loginPointId: String(authContext?.loginPointId || '')
            };
            const json = await OneApiTransport.postJson(url, payload, {
                actionName: '查询计划人群失败',
                businessErrorMessage: '查询计划人群失败'
            });
            return {
                crowdList: this.extractCopyCrowdListFromPayload(json, id),
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
            if ((!this.isPlainRecord(adgroup) || !Object.keys(adgroup).length || !itemId) && adgroupIds.length) {
                const adgroupDetail = await this.queryAdgroupDetail(id, adgroupIds[0], targetBizCode, authContext);
                const nextAdgroup = this.extractCopyAdgroupFromPayload(adgroupDetail?.response || {}, id, adgroupIds[0]);
                if (this.isPlainRecord(nextAdgroup) && Object.keys(nextAdgroup).length) {
                    adgroup = nextAdgroup;
                }
                itemId = itemId || this.normalizeItemId(adgroupDetail?.itemId || '');
            }
            if (!this.isPlainRecord(campaign) || !Object.keys(campaign).length) {
                throw new Error('未能读取源计划详情');
            }
            if (targetBizCode === 'onebpSearch') {
                const aiMaxEnabled = this.isKeywordAiMaxCampaignEnabled(campaign);
                try {
                    const crowdDetail = await this.queryCampaignCrowdList(id, targetBizCode, authContext);
                    const campaignCrowdList = Array.isArray(crowdDetail?.crowdList) ? crowdDetail.crowdList : [];
                    if (campaignCrowdList.length) {
                        campaign.crowdList = campaignCrowdList;
                        Logger.log(`📋 已读取源计划${id}的 AI点睛需求人群 ${campaignCrowdList.length} 个`);
                    } else if (aiMaxEnabled && this.hasKeywordAiMaxDemandSignal(campaign)) {
                        throw new Error('源计划 AI点睛已生成方案，但未返回需求人群');
                    }
                } catch (err) {
                    if (aiMaxEnabled) {
                        throw new Error(`查询AI点睛需求人群失败，已取消复制：${err?.message || '未知错误'}`);
                    }
                    Logger.log(`⚠️ 查询计划人群失败，继续复制基础设置：${err?.message || '未知错误'} `, true);
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

        async runCopyCurrentPlanFlow(campaignId, triggerEl, copyMode = 'inherit', options = {}) {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) throw new Error('计划ID无效');
            const mode = this.normalizeCopyMode(copyMode);
            const label = this.getCopyModeLabel(mode);
            const bizCandidates = this.getCandidateBizCodes(triggerEl);
            const authContext = this.resolveAuthContext(bizCandidates[0] || this.DEFAULT_BIZ_CODE);
            const source = await this.resolveCopySourcePlan(id, triggerEl, bizCandidates, authContext);
            const sceneName = this.getSceneNameByBizCode(source.bizCode || bizCandidates[0] || '');
            if (!sceneName) {
                throw new Error(`暂不支持复制该业务线：${source.bizCode || bizCandidates[0] || '-'}`);
            }
            const api = resolveKeywordPlanApiAccessor();
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
            Logger.log(`📋 ${label}准备：源计划${id}，场景=${sceneName}，商品=${source.itemId || '-'}，复制数量=${copyCount}，跟随源状态=${targetOnlineStatus === 1 ? '开启' : '暂停'}`);
            const result = await api.copyCurrentPlanByScene(sceneName, source, {
                copyMode: mode,
                copyCount,
                usedPlanNames,
                targetOnlineStatus,
                pauseIfStartedAfterCreate: true,
                conflictPolicy: 'none'
            });
            const copySource = result?.copySource || {};
            const newPlanText = this.formatPlanNameListForLog(copySource.newPlanNames || copySource.newPlanName || []);
            Logger.log(`📋 ${label}结果：源计划${id}，新计划${newPlanText}，跟随源状态=${targetOnlineStatus === 1 ? '开启' : '暂停'}，创建结果=${result?.ok ? '成功' : '失败'}`);
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
                btn.innerHTML = `${this.COPY_ICON_SVG.trim()}<span class="am-campaign-copy-label">${label}</span><span class="am-wxt-copy-multi" data-am-campaign-copy-count-badge="${copyBatchCount}" title="点击增加，右键减少，滚轮可调节"><span class="am-wxt-copy-multi-icon">${renderAmIcon('multiply', { size: 10, strokeWidth: 2.4 })}</span><span class="am-wxt-copy-multi-num">${copyBatchCount}</span></span>`;
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
            host.classList.add('am-campaign-hover-host');
            if (rowHost instanceof HTMLElement && compactHost instanceof HTMLElement && compactHost !== rowHost) {
                compactHost.classList.add('am-campaign-hover-host');
            }
            return host;
        },

        isConcurrentStartEnabled() {
            return !!State.config.showConcurrentStartButton;
        },

        syncConcurrentButtonsVisibility() {
            const enabled = this.isConcurrentStartEnabled();
            document.querySelectorAll('.am-campaign-search-btn[data-am-campaign-concurrent-start="1"]').forEach((btn) => {
                if (!(btn instanceof HTMLElement)) return;
                btn.style.display = enabled ? '' : 'none';
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
                        const concurrentBtn = this.createButton(campaignId, {
                            mode: 'concurrent',
                            bizCode: contextBizCode,
                            itemId: contextItemId
                        });
                        if (concurrentBtn) frag.appendChild(concurrentBtn);
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
                if (!concurrentBtn) {
                    const createdConcurrent = this.createButton(id, { mode: 'concurrent', bizCode, itemId });
                    if (createdConcurrent) {
                        anchor.insertAdjacentElement('afterend', createdConcurrent);
                        anchor = createdConcurrent;
                    }
                }
            });
        }
    };
