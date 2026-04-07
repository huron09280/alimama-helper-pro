    const CampaignIdQuickEntry = {
        initialized: false,
        runningCampaignIds: new Set(),
        concurrentLogPopup: null,
        concurrentLogTitleEl: null,
        concurrentLogStatusEl: null,
        concurrentLogBodyEl: null,
        campaignItemIdCache: new Map(),
        IGNORE_SELECTOR: '#am-helper-panel, #am-magic-report-popup, #alimama-escort-helper-ui, #am-report-capture-panel, #am-campaign-concurrent-log-popup',
        TEXT_PATTERN: /计划\s*(?:ID|id)?\s*[：:]\s*(\d{6,})/g,
        DEFAULT_BIZ_CODE: 'onebpSearch',
        BIZ_CODE_LIST: ['onebpSearch', 'onebpSite', 'onebpAdStrategyLiuZi', 'onebpDisplay'],
        MAX_START_RETRIES: 6,
        RETRY_DELAY_MS: 450,
        MAX_SITE_CUSTOM_BREAKTHROUGH_ROUNDS: 3,
        SITE_CUSTOM_CONFLICT_RE: /(onebpsite-existed|horizontal-onebpsite-existed|diffbizcode-existed|存在在投计划|在投计划|持续推广计划|冲突|已存在.*计划|计划已存在|already.*exist|conflict)/i,
        ICON_SVG: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M770.99008 637.242027c14.86848 14.199467 31.3344 29.463893 47.26784 45.335893 57.869653 57.603413 115.602773 115.397973 173.267627 173.19936 41.53344 41.601707 43.39712 100.27008 4.601173 139.4688-39.130453 39.601493-98.399573 37.730987-140.663467-4.46464-69.864107-69.864107-139.933013-139.598507-209.46944-209.865387-8.669867-8.731307-14.199467-9.332053-25.197227-3.331413-248.66816 136.997547-548.870827 1.467733-611.068587-275.531093-50.333013-224.13312 99.997013-449.733973 329.40032-494.26432 236.264107-45.800107 464.800427 123.467093 490.134187 362.530133 9.530027 90.002773-8.198827 173.93664-52.736 252.463787-1.467733 2.60096-2.935467 5.133653-4.1984 7.80288C771.857067 631.637333 771.857067 632.838827 770.99008 637.242027zM415.39584 703.904427c161.000107-1.201493 289.532587-129.80224 288.802133-289.068373-0.730453-159.136427-131.66592-287.798613-291.403093-286.53568C254.859947 129.6384 127.720107 260.23936 128.587093 420.174507 129.39264 575.03744 260.85376 705.10592 415.39584 703.904427zM193.1264 415.17056c0.197973-132.068693 113.937067-226.269867 222.405973-221.463893 0.26624 5.065387 0.79872 10.267307 0.79872 15.40096 0.136533 15.264427 0.068267 30.53568 0.068267 45.602133-103.99744 8.997547-156.071253 79.598933-161.000107 160.467627C235.055787 415.17056 214.657707 415.17056 193.1264 415.17056z"></path>
            </svg>
        `,
        CONCURRENT_START_ICON_SVG: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M165.888 130.112A63.488 63.488 0 0 1 229.312 64H592.32a63.488 63.488 0 0 1 63.424 63.744l-.192 66.24h138.56a63.488 63.488 0 0 1 63.424 63.744v575.68a63.488 63.488 0 0 1-63.424 63.744H431.68a63.488 63.488 0 0 1-63.424-63.744v-66.24H229.312a63.488 63.488 0 0 1-63.424-63.744V130.112zm126.976 153.6l.064 356.16h75.328V257.728a63.488 63.488 0 0 1 63.424-63.744h96.896l.128-66.24-235.84.064zm151.744 486.4l286.08-.064-.128-448-286.08.064.128 448zm28.032-309.952c5.568-22.912 35.968-28.16 48.96-8.384l61.12 93.184h42.048c31.744 0 46.528 39.04 22.976 60.608l-98.624 90.24 23.68 135.552c5.44 31.04-27.328 54.592-55.36 39.808l-120.448-63.488-120.448 63.488c-28.096 14.784-60.8-8.768-55.424-39.808l23.744-135.552-98.624-90.24c-23.552-21.568-8.832-60.608 22.912-60.608h42.112l61.12-93.184c12.992-19.776 43.392-14.528 48.96 8.384l31.552 130.112h89.92l31.552-130.112z"></path>
            </svg>
        `,

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
                            <button type="button" class="am-concurrent-log-close" aria-label="关闭并发日志">×</button>
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
            const mode = options.mode === 'concurrent' ? 'concurrent' : 'quick';
            const bizCode = this.normalizeBizCode(options.bizCode || '');
            const itemId = this.normalizeItemId(options.itemId || '');

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = mode === 'concurrent'
                ? 'am-campaign-search-btn am-campaign-concurrent-start-btn'
                : 'am-campaign-search-btn';
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

        run() {
            if (window.top !== window.self) return;
            if (!document.body) return;
            this.enhanceTextNodes();
            this.enhanceLinkNodes();
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
                for (let i = 0; i < 6 && pointer; i++) {
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
                    }
                }
            });
        }
    };

