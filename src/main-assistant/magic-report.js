    // ==========================================
    // 6. 万能查数 (Magic Report) - iframe 嵌入方案
    // ==========================================
    const MagicReport = {
        popup: null,
        header: null,
        iframe: null,
        quickPromptsEl: null,
        viewTabsEl: null,
        queryPanelEl: null,
        matrixPanelEl: null,
        matrixStateEl: null,
        matrixGridEl: null,
        matrixRetryBtn: null,
        matrixLegendEl: null,
        matrixCampaignEl: null,
        matrixCampaignNameEl: null,
        matrixCampaignIdEl: null,
        matrixCampaignItemSelectEl: null,
        matrixHoverTipEl: null,
        matrixHoverActiveBar: null,
        matrixHoverActiveBars: [],
        matrixHoverMetricIndex: null,
        crowdMetricVisibility: { click: false, cart: true, deal: false, itemdeal: false },
        crowdPeriodVisibility: { 3: true, 7: true, 30: true, 90: true },
        crowdRatioVisibility: true,
        crowdInsightsVisibility: false,
        popupMatrixMaximized: false,
        popupLayoutBeforeMatrix: null,
        popupResizeHandler: null,
        lastCampaignId: '',
        lastCampaignName: '',
        activeView: 'matrix',
        crowdMatrixRunId: 0,
        crowdMatrixLoading: false,
        crowdMatrixProgress: 0,
        crowdMatrixStateHideTimer: null,
        crowdMatrixLoadedCampaignId: '',
        crowdMatrixDataset: null,
        crowdMatrixResultMap: null,
        crowdMatrixPendingMetricReload: null,
        crowdMatrixTaskProgressHandler: null,
        crowdCampaignItemIdMap: new Map(),
        crowdCampaignItemOptionsMap: new Map(),
        crowdCampaignSelectedItemIdMap: new Map(),
        crowdCampaignManualItemSelectionMap: new Map(),
        crowdInsightRunContext: null,
        crowdRequestSlotPromise: null,
        crowdRequestLastAt: 0,
        BASE_URL: 'https://one.alimama.com/index.html#!/report/ai-report',
        CROWD_API_HOST: 'https://ai.alimama.com',
        CROWD_PERIODS: [3, 7, 30, 90],
        CROWD_GROUP_ORDER: ['消费能力等级', '月均消费金额', '用户年龄', '用户性别', '城市等级', '店铺潜新老客', '省份', '城市'],
        CROWD_EXTRA_DIMENSION_GROUPS: ['省份', '城市'],
        CROWD_METRICS: ['click', 'cart', 'deal', 'itemdeal'],
        CROWD_REQUEST_CONCURRENCY: 2,
        CROWD_REQUEST_THROTTLE_MS: 340,
        CROWD_REQUEST_JITTER_MS: 180,
        CROWD_REQUEST_MAX_ATTEMPTS: 3,
        CROWD_REQUEST_RETRY_BASE_MS: 700,
        CROWD_REQUEST_RETRY_MAX_MS: 3200,
        QUICK_PROMPTS: [
            { label: '📛 计划名：{campaignName}', value: '计划名：{campaignName}', type: 'action', autoSubmit: false, requireCampaignName: true },
            { label: '🖱️ 点击分析', value: '计划ID：{campaignId} 点击人群分析', type: 'query', autoSubmit: true, requireCampaignId: true },
            { label: '🛒 加购分析', value: '计划ID：{campaignId} 加购人群分析', type: 'query', autoSubmit: true, requireCampaignId: true },
            { label: '💰 成交分析', value: '计划ID：{campaignId} 成交人群分析', type: 'query', autoSubmit: true, requireCampaignId: true },
            { label: '🏙️ 省份占比', value: '计划ID：{campaignId}，在各个省份的花费，再使用占比工具进行占比分析', type: 'query', autoSubmit: true, requireCampaignId: true },
            { label: '🌆 城市占比', value: '计划ID：{campaignId}，在各个城市的花费，再使用占比工具进行占比分析', type: 'query', autoSubmit: true, requireCampaignId: true },
            { label: '✨商品ID成交', value: '商品ID：{商品ID}，成交人群在各个省份或城市的花费，再使用占比工具进行占比分析', type: 'query', autoSubmit: true, requireCampaignId: true }
        ],

        // NOTE: iframe 加载后通过 JS 清理页面，只保留万能查数核心内容区
        CLEANUP_CSS: `
            body { overflow: auto!important; margin: 0!important; padding: 0!important; }
            #universalBP_common_layout_main_content {
                margin: 0!important;
                padding: 16px!important;
                width: 100%!important;
                max-width: 100%!important;
            }
            div#app { min-width: 0!important; }
            /* 隐藏瀑布流推荐区域和 Magix 弹出层 */
            [id^="mx_"] > div.waterfall-masonry,
            [id^="mx_"] > div.mb16,
            .waterfall-masonry,
            [id^="popover_mx_"] { display: none!important; }
            /* 查询结果容器不限制高度 */
            [id$="_query_result_container"] { max-height: none!important; }
            /* 搜索栏和查询弹层宽度统一 100% */
            #ai-input-magic-report,
            .query-pop { width: 100%!important; }
            [id^="mx_"] > div.ivthphqCKy.search-bar-selected.mb8 > div.query-pop { top: 128px!important; }
            .bXMILLeECt,
            .bXMILLeECu { top: -135px!important; }
            #universalBP_common_layout > div.bXMILLeECt > div.bXMILLeECs { top: -150px!important; }
    `,

        normalizeMagicView(view) {
            const normalized = String(view || '').trim().toLowerCase();
            if (normalized === 'matrix') return 'matrix';
            if (normalized === 'query') return 'query';
            return '';
        },

        getMagicDefaultView() {
            const fromConfig = this.normalizeMagicView(State?.config?.magicReportDefaultView);
            return fromConfig || 'matrix';
        },

        setMagicDefaultView(view) {
            const normalized = this.normalizeMagicView(view);
            if (!normalized) return '';
            if (State && State.config && State.config.magicReportDefaultView !== normalized) {
                State.config.magicReportDefaultView = normalized;
                State.save();
            }
            this.refreshMagicViewTabDefaultState();
            return normalized;
        },

        refreshMagicViewTabDefaultState() {
            if (!(this.viewTabsEl instanceof HTMLElement)) return;
            const defaultView = this.getMagicDefaultView();
            this.viewTabsEl.querySelectorAll('[data-view]').forEach((node) => {
                if (!(node instanceof HTMLElement)) return;
                const view = this.normalizeMagicView(node.dataset.view || '');
                if (!view) return;
                const isDefault = view === defaultView;
                node.classList.toggle('is-default-view', isDefault);
                node.setAttribute('data-default-view-active', isDefault ? '1' : '0');
                const icon = node.querySelector('.am-magic-view-default-icon');
                if (!(icon instanceof HTMLElement)) return;
                const label = view === 'matrix' ? '人群对比看板' : '万能查数';
                icon.textContent = isDefault ? '★' : '☆';
                icon.title = isDefault ? `默认打开：${label}` : `设为默认打开：${label}`;
                icon.setAttribute('aria-label', icon.title);
            });
        },

        getIframeDoc() {
            if (!this.iframe) return null;
            try {
                return this.iframe.contentDocument || this.iframe.contentWindow?.document || null;
            } catch {
                return null;
            }
        },

        buildIframeUrl(forceReload = false) {
            const rawUrl = this.iframe?.getAttribute('src') || this.BASE_URL;
            const url = new URL(rawUrl, window.location.href);
            if (forceReload) {
                url.searchParams.set('_am_refresh_ts', String(Date.now()));
            }
            return url.toString();
        },

        extractCampaignId(rawText) {
            const text = String(rawText || '').trim();
            if (!text) return '';

            const normalized = [];
            normalized.push(text);
            try {
                normalized.push(decodeURIComponent(text));
            } catch { }

            const patterns = [
                /(?:^|[?&#])campaignId=(\d{6,})/i,
                /(?:^|[?&#])campaign_id=(\d{6,})/i,
                /campaignId[：:\s=]+(\d{6,})/i,
                /campaign_id[：:\s=]+(\d{6,})/i,
                /计划(?:ID|id)?[：:\s]+(\d{6,})/i
            ];

            for (const source of normalized) {
                const compact = String(source || '').trim();
                if (/^\d{6,}$/.test(compact)) return compact;
                for (const reg of patterns) {
                    const match = source.match(reg);
                    if (match?.[1]) return match[1];
                }
            }
            return '';
        },

        sanitizeCampaignName(rawName) {
            const normalized = String(rawName || '')
                .replace(/\s+/g, ' ')
                .replace(/^[`"'“”‘’]+|[`"'“”‘’]+$/g, '')
                .trim();
            if (!normalized) return '';

            const stripped = normalized
                .replace(/^计划(?:名|名称)\s*[：:]\s*/i, '')
                .trim();
            if (!stripped) return '';
            if (/^\d{6,}$/.test(stripped)) return '';
            return stripped;
        },

        escapeRegExp(rawText) {
            return String(rawText || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        },

        isLikelyCampaignName(rawName) {
            const name = this.sanitizeCampaignName(rawName);
            if (!name) return false;
            if (name.length < 2 || name.length > 120) return false;
            if (/^\d+$/.test(name)) return false;
            if (/(?:查数计划ID|计划\s*(?:ID|id)|当前计划ID|campaign[_\s-]*id)/i.test(name)) return false;
            if (!/[\u4e00-\u9fa5A-Za-z]/.test(name)) return false;
            if (/^(?:计划|计划id|计划名称|计划名|状态|预算|日限额|操作|查数|获取计划名|阿里妈妈|万象查数|万能查数)$/i.test(name)) return false;
            if (/^(?:平台推荐|护航已结束|直接成交|计划组|投放调优.*)$/i.test(name)) return false;
            return true;
        },

        extractCampaignNameFromCompositeText(rawText, campaignId = '') {
            let text = String(rawText || '').replace(/\s+/g, ' ').trim();
            if (!text) return '';

            const directMatch = text.match(/计划(?:名|名称)\s*[：:]\s*([^\n\r|,，;；]+)/i);
            if (directMatch?.[1]) {
                const directName = this.sanitizeCampaignName(directMatch[1]);
                if (this.isLikelyCampaignName(directName)) return directName;
            }

            if (campaignId) {
                const idPattern = this.escapeRegExp(campaignId);
                text = text
                    .replace(new RegExp(`计划\\s*(?:ID|id)?\\s*[：:]?\\s*${idPattern}`, 'ig'), ' ')
                    .replace(new RegExp(idPattern, 'g'), ' ');
            }

            text = text
                .replace(/查数计划ID|计划ID|获取计划名|点击分析|加购分析|成交分析|查数|计划名|计划名称/gi, ' ')
                .replace(/[()[\]{}<>【】]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            if (!text) return '';

            const segments = text.split(/[|｜/，,；;>»→]/).map(s => s.trim()).filter(Boolean);
            const candidates = segments.length ? segments : [text];
            const valid = candidates
                .map(s => this.sanitizeCampaignName(s))
                .filter(name => this.isLikelyCampaignName(name))
                .sort((a, b) => b.length - a.length);
            return valid[0] || '';
        },

        guessCampaignNameById(campaignId, seedElement = null) {
            const id = String(campaignId || '').trim();
            const idPattern = id ? this.escapeRegExp(id) : '';
            const textCandidates = [];

            const pushText = (raw) => {
                const text = String(raw || '').replace(/\s+/g, ' ').trim();
                if (!text) return;
                if (text.length > 600) return;
                const compact = text.replace(/\s+/g, '');
                const hasPlanHint = /计划[:：]|计划名|计划名称|campaign[_\s-]*name|campaign[_\s-]*id/i.test(compact);
                if (!hasPlanHint && compact.length > 36) return;
                if (!hasPlanHint && /(?:宝贝ID|计划组[:：]|投放调优|护航已结束|平台推荐)/i.test(compact)) return;
                textCandidates.push(text);
            };

            const pickNameByPlanPrefix = (root) => {
                if (!(root instanceof Element)) return '';
                const strictAnchors = Array.from(root.querySelectorAll('span + a[title]'));
                for (const anchor of strictAnchors) {
                    if (!(anchor instanceof HTMLAnchorElement)) continue;
                    const prevRaw = (anchor.previousElementSibling?.textContent || '').replace(/\s+/g, '');
                    if (!/^计划[:：]?$/.test(prevRaw)) continue;
                    const strictName = this.sanitizeCampaignName(anchor.getAttribute('title'));
                    if (this.isLikelyCampaignName(strictName)) return strictName;
                }

                const anchors = Array.from(root.querySelectorAll('a[title]'));
                for (const anchor of anchors) {
                    const titleName = this.sanitizeCampaignName(anchor.getAttribute('title'));
                    if (!this.isLikelyCampaignName(titleName)) continue;

                    const prevRaw = (anchor.previousElementSibling?.textContent || '').replace(/\s+/g, '');
                    const parentRaw = (anchor.parentElement?.textContent || '').replace(/\s+/g, '');
                    const nearRaw = (anchor.closest('.asiYysqLgo, .asiYysqLgr, .ellipsis, div, span, td, li')?.textContent || '').replace(/\s+/g, '');
                    const planWithName = `计划：${titleName}`;
                    const planWithNameAlt = `计划:${titleName}`;
                    if (
                        /^计划[:：]?$/.test(prevRaw) ||
                        parentRaw.includes(planWithName) ||
                        parentRaw.includes(planWithNameAlt) ||
                        nearRaw.includes(planWithName) ||
                        nearRaw.includes(planWithNameAlt)
                    ) {
                        return titleName;
                    }
                }
                return '';
            };

            const scoreAnchor = (anchor) => {
                if (!(anchor instanceof HTMLAnchorElement)) return { name: '', score: -999 };
                const titleName = this.sanitizeCampaignName(anchor.getAttribute('title'));
                if (!this.isLikelyCampaignName(titleName)) return { name: '', score: -999 };

                const href = (anchor.getAttribute('href') || anchor.getAttribute('mx-href') || '').trim();
                const text = (anchor.textContent || '').trim();
                const cls = (anchor.className || '').toString();
                const prevText = (anchor.previousElementSibling?.textContent || '').replace(/\s+/g, '');
                const parentText = (anchor.parentElement?.textContent || '').replace(/\s+/g, '');
                const nearText = (anchor.closest('div,span,td,li')?.textContent || '').replace(/\s+/g, '');
                const exactPlanPattern = new RegExp(`计划[:：]${this.escapeRegExp(titleName)}`);

                let score = 0;
                if (text && text === titleName) score += 15;
                if (id && idPattern && new RegExp(`(?:campaignId|campaign_id)=${idPattern}`).test(href)) score += 100;
                if (href.startsWith('javascript:')) score += 8;
                if (/^计划[:：]?$/.test(prevText)) score += 140;
                if (exactPlanPattern.test(parentText)) score += 120;
                if (exactPlanPattern.test(nearText)) score += 100;
                if (/计划[:：]/.test(parentText) || /计划[:：]/.test(nearText)) score += 30;
                if (/wO_WXndakU/.test(cls)) score += 60;
                if (/wO_WXndw/.test(cls)) score -= 220;
                if (/平台推荐|护航已结束|投放调优|直接成交|计划组|宝贝ID/i.test(parentText + nearText)) score -= 60;

                return { name: titleName, score };
            };

            const pickBestNameFromRoot = (root, minScore = 110) => {
                if (!(root instanceof Element)) return '';
                const anchors = Array.from(root.querySelectorAll('a[title]'));
                let best = { name: '', score: -999 };
                anchors.forEach((anchor) => {
                    const current = scoreAnchor(anchor);
                    if (current.score > best.score) best = current;
                });
                return best.score >= minScore ? best.name : '';
            };

            const pickNameNearElement = (el) => {
                if (!(el instanceof Element)) return '';
                let cursor = el;
                for (let depth = 0; cursor && depth < 10; depth++) {
                    const strictName = pickNameByPlanPrefix(cursor);
                    if (strictName) return strictName;
                    const name = pickBestNameFromRoot(cursor, 120);
                    if (name) return name;
                    cursor = cursor.parentElement;
                }
                return '';
            };

            if (seedElement instanceof Element) {
                const nearName = pickNameNearElement(seedElement);
                if (nearName) return nearName;
            }

            const collectFromElement = (el) => {
                if (!(el instanceof Element)) return;
                pushText(el.getAttribute('data-campaign-name'));
                pushText(el.getAttribute('campaignname'));
                pushText(el.getAttribute('title'));
                pushText(el.getAttribute('aria-label'));
                const text = String(el.textContent || '').trim();
                if (/计划[:：]|计划名|计划名称|campaign[_\s-]*name|campaign[_\s-]*id/i.test(text)) {
                    pushText(text);
                }
            };

            const collectAround = (el) => {
                if (!(el instanceof Element)) return;
                collectFromElement(el);
                collectFromElement(el.previousElementSibling);
                collectFromElement(el.nextElementSibling);
                collectFromElement(el.parentElement);
                const row = el.closest('tr, [role="row"], li, [class*="row"], [class*="item"]');
                if (row) {
                    collectFromElement(row);
                    row.querySelectorAll('[data-campaign-name], [campaignname], [title]').forEach(node => collectFromElement(node));
                }
            };

            if (seedElement) collectAround(seedElement);

            if (id) {
                const strictByButton = Array.from(document.querySelectorAll(`.am-campaign-search-btn[data-campaign-id="${id}"]`))
                    .map(btn => btn.closest('div[mxa*="wO_WXndqs:l"], .flex-1.min-width-0, [class*="wO_WXnd"]'))
                    .filter(Boolean);
                for (const root of strictByButton) {
                    if (!(root instanceof Element)) continue;
                    const exactNode = root.querySelector('span.wO_WXndakU + a[title].wO_WXndakU, span[class*="wO_WXndakU"] + a[title][href="javascript:;"], .asiYysqLgo .ellipsis a[title][href="javascript:;"]');
                    if (exactNode instanceof HTMLAnchorElement) {
                        const exactName = this.sanitizeCampaignName(exactNode.getAttribute('title'));
                        if (this.isLikelyCampaignName(exactName)) return exactName;
                    }
                }

                const selectors = [
                    `.am-campaign-search-btn[data-campaign-id="${id}"]`,
                    `[data-campaign-id="${id}"]`,
                    `[campaignid="${id}"]`,
                    `a[href*="campaignId=${id}"]`,
                    `a[href*="campaign_id=${id}"]`,
                    `input[type="checkbox"][value="${id}"]`
                ];
                selectors.forEach((selector) => {
                    document.querySelectorAll(selector).forEach(node => {
                        const rowRoot = node.closest('tr, [role="row"], li, [class*="row"], [class*="item"], [mxa*="wO_WXndqs"]') || node.parentElement;
                        const strictName = pickNameByPlanPrefix(rowRoot);
                        if (strictName) {
                            textCandidates.push(`计划名：${strictName}`);
                            return;
                        }

                        const nearName = pickNameNearElement(node) || pickBestNameFromRoot(rowRoot, 100);
                        if (nearName) {
                            textCandidates.push(`计划名：${nearName}`);
                            return;
                        }
                        collectAround(node);
                    });
                });

                const allTitleAnchors = Array.from(document.querySelectorAll(`a[href*="campaignId=${id}"][title], a[href*="campaign_id=${id}"][title], a[mx-href*="campaignId=${id}"][title], a[mx-href*="campaign_id=${id}"][title]`));
                if (allTitleAnchors.length) {
                    const best = allTitleAnchors
                        .map(anchor => scoreAnchor(anchor))
                        .sort((a, b) => b.score - a.score)[0];
                    if (best && best.score >= 80 && this.isLikelyCampaignName(best.name)) {
                        return best.name;
                    }
                }
            }

            for (const candidateText of textCandidates) {
                const fromPattern = this.extractCampaignName(candidateText);
                if (this.isLikelyCampaignName(fromPattern)) return fromPattern;

                const fromComposite = this.extractCampaignNameFromCompositeText(candidateText, id);
                if (this.isLikelyCampaignName(fromComposite)) return fromComposite;
            }

            const titleName = this.extractCampaignNameFromCompositeText(document.title, id);
            if (this.isLikelyCampaignName(titleName)) return titleName;

            return '';
        },

        extractCampaignName(rawText) {
            const text = String(rawText || '').trim();
            if (!text) return '';

            const sources = [text];
            try {
                sources.push(decodeURIComponent(text));
            } catch { }

            const patterns = [
                /(?:^|[?&#])campaignName=([^&#]+)/i,
                /(?:^|[?&#])campaign_name=([^&#]+)/i,
                /计划[：:]\s*([^\n\r|,，;；]+)/i,
                /计划(?:名|名称)[：:\s]+([^\n\r;；|]+)/i
            ];

            for (const source of sources) {
                for (const reg of patterns) {
                    const match = source.match(reg);
                    if (!match?.[1]) continue;
                    const raw = String(match[1] || '').trim();
                    if (!raw) continue;
                    let decoded = raw;
                    try {
                        decoded = decodeURIComponent(raw);
                    } catch { }
                    const name = this.sanitizeCampaignName(decoded);
                    if (name) return name;
                }
            }

            return '';
        },

        extractCampaignIdFromElement(el) {
            if (!(el instanceof Element)) return '';

            const candidates = [
                el.getAttribute('data-campaign-id'),
                el.getAttribute('campaignid'),
                el.getAttribute('data-id'),
                el.getAttribute('href'),
                el.getAttribute('mx-href'),
                el.id
            ];
            if (el instanceof HTMLInputElement) candidates.push(el.value);

            for (const item of candidates) {
                const id = this.extractCampaignId(item);
                if (id) return id;
            }

            const nearestLink = el.closest('a[href*="campaignId="], a[href*="campaign_id="]') || el.querySelector?.('a[href*="campaignId="], a[href*="campaign_id="]');
            if (nearestLink) {
                const id = this.extractCampaignId(nearestLink.getAttribute('href') || nearestLink.href);
                if (id) return id;
            }

            return '';
        },

        extractCampaignNameFromElement(el) {
            if (!(el instanceof Element)) return '';
            const classText = (el.className || '').toString();
            if (/wO_WXndw/.test(classText)) return '';

            const candidates = [
                el.getAttribute('data-campaign-name'),
                el.getAttribute('campaignname'),
                el.getAttribute('data-name'),
                el.getAttribute('title'),
                el.getAttribute('aria-label'),
                el.getAttribute('placeholder')
            ];
            if (el instanceof HTMLInputElement) candidates.push(el.value);

            for (const item of candidates) {
                const name = this.extractCampaignName(item);
                if (this.isLikelyCampaignName(name)) return name;
                const plainName = this.sanitizeCampaignName(item);
                if (this.isLikelyCampaignName(plainName)) return plainName;
            }

            const ownText = this.sanitizeCampaignName(el.textContent);
            const hasPlanContext = /计划[:：]|计划名|计划名称/.test(String(el.textContent || ''))
                || /wO_WXndakU|campaign-name|campaignName|plan-name|planName/.test(classText);
            if (ownText && this.isLikelyCampaignName(ownText) && ownText.length <= 80 && hasPlanContext) {
                return ownText;
            }

            return '';
        },

        getCurrentCampaignId() {
            const sourceCandidates = [
                window.location.href,
                window.location.hash,
                window.location.search
            ];
            for (const source of sourceCandidates) {
                const id = this.extractCampaignId(source);
                if (id) {
                    this.lastCampaignId = id;
                    return id;
                }
            }

            const checkedBoxes = document.querySelectorAll('input[type="checkbox"][value]:checked');
            for (const checkedBox of checkedBoxes) {
                const id = this.extractCampaignIdFromElement(checkedBox);
                if (!id) continue;
                this.lastCampaignId = id;
                return id;
            }

            const selectedSelectors = [
                'tr[class*="selected"]',
                'tr[class*="active"]',
                'tr[class*="current"]',
                '[class*="selected"][role="row"]',
                '[class*="active"][role="row"]',
                '[aria-current="true"]'
            ];
            for (const selector of selectedSelectors) {
                const selectedEl = document.querySelector(selector);
                if (!selectedEl) continue;
                const id = this.extractCampaignIdFromElement(selectedEl);
                if (id) {
                    this.lastCampaignId = id;
                    return id;
                }
            }

            const allCampaignIds = new Set();
            document.querySelectorAll('a[href*="campaignId="], a[href*="campaign_id="], input[type="checkbox"][value]').forEach(el => {
                const id = this.extractCampaignIdFromElement(el);
                if (id) allCampaignIds.add(id);
            });
            if (allCampaignIds.size === 1) {
                const [id] = Array.from(allCampaignIds);
                this.lastCampaignId = id;
                return id;
            }

            return this.lastCampaignId || '';
        },

        getCurrentCampaignName() {
            const sourceCandidates = [
                window.location.href,
                window.location.hash,
                window.location.search
            ];
            for (const source of sourceCandidates) {
                const name = this.extractCampaignName(source);
                if (name) {
                    this.lastCampaignName = name;
                    return name;
                }
            }

            const currentCampaignId = this.getCurrentCampaignId();
            if (currentCampaignId) {
                const guessedFirst = this.guessCampaignNameById(currentCampaignId);
                if (guessedFirst) {
                    this.lastCampaignName = guessedFirst;
                    return guessedFirst;
                }
            }

            const checkedBoxes = document.querySelectorAll('input[type="checkbox"][value]:checked');
            for (const checkedBox of checkedBoxes) {
                const row = checkedBox.closest('tr, [role="row"], li, [class*="row"], [class*="item"]');
                if (!row) continue;

                const strictNameNode = row.querySelector('span.wO_WXndakU + a[title].wO_WXndakU, span[class*="wO_WXndakU"] + a[title][href="javascript:;"], .asiYysqLgo .ellipsis a[title][href="javascript:;"]');
                if (strictNameNode) {
                    const strictName = this.extractCampaignNameFromElement(strictNameNode);
                    if (strictName) {
                        this.lastCampaignName = strictName;
                        return strictName;
                    }
                }

                const nameNode = row.querySelector('[data-campaign-name], [campaignname], [class*="campaign-name"], [class*="campaignName"], [class*="plan-name"], [class*="planName"], a[title][href="javascript:;"], span[title], div[title]');
                if (nameNode) {
                    const name = this.extractCampaignNameFromElement(nameNode);
                    if (name) {
                        this.lastCampaignName = name;
                        return name;
                    }
                }
            }

            const selectedSelectors = [
                'tr[class*="selected"]',
                'tr[class*="active"]',
                'tr[class*="current"]',
                '[class*="selected"][role="row"]',
                '[class*="active"][role="row"]',
                '[aria-current="true"]',
                '[data-campaign-name]',
                '[campaignname]'
            ];
            for (const selector of selectedSelectors) {
                const selectedEl = document.querySelector(selector);
                if (!selectedEl) continue;
                const name = this.extractCampaignNameFromElement(selectedEl);
                if (name) {
                    this.lastCampaignName = name;
                    return name;
                }
            }

            if (currentCampaignId) {
                const byIdSelectors = [
                    `[data-campaign-id="${currentCampaignId}"]`,
                    `[campaignid="${currentCampaignId}"]`,
                    `a[href*="campaignId=${currentCampaignId}"]`,
                    `a[href*="campaign_id=${currentCampaignId}"]`,
                    `input[type="checkbox"][value="${currentCampaignId}"]`
                ];
                for (const selector of byIdSelectors) {
                    const node = document.querySelector(selector);
                    if (!node) continue;

                    const directName = this.extractCampaignNameFromElement(node);
                    if (directName && directName !== currentCampaignId) {
                        this.lastCampaignName = directName;
                        return directName;
                    }

                    const row = node.closest('tr, [role="row"], li, [class*="row"], [class*="item"]');
                    if (row) {
                        const candidates = row.querySelectorAll('[data-campaign-name], [campaignname], [class*="campaign-name"], [class*="campaignName"], [class*="plan-name"], [class*="planName"], a, span, div');
                        for (const candidate of candidates) {
                            const name = this.extractCampaignNameFromElement(candidate);
                            if (!name) continue;
                            if (name === currentCampaignId) continue;
                            if (name.includes('计划ID') || name.includes('查数')) continue;
                            this.lastCampaignName = name;
                            return name;
                        }
                    }
                }
            }

            if (currentCampaignId) {
                const guessed = this.guessCampaignNameById(currentCampaignId);
                if (guessed) {
                    this.lastCampaignName = guessed;
                    return guessed;
                }
            }

            const titleGuess = this.guessCampaignNameById('', null);
            if (titleGuess) {
                this.lastCampaignName = titleGuess;
                return titleGuess;
            }

            return this.lastCampaignName || '';
        },

        resolvePromptLabel(promptItem) {
            const template = String(promptItem?.label || '').trim();
            if (!template) return '';

            let resolved = template;
            if (resolved.includes('{campaignName}')) {
                const campaignName = this.getCurrentCampaignName() || this.lastCampaignName;
                resolved = resolved.replace(/\{campaignName\}/g, campaignName || '未识别');
            }
            if (resolved.includes('{campaignId}')) {
                const campaignId = this.getCurrentCampaignId() || this.lastCampaignId;
                resolved = resolved.replace(/\{campaignId\}/g, campaignId || '--');
            }
            return resolved;
        },

        refreshQuickPromptLabels() {
            if (!this.popup) return;
            const quickPrompts = this.popup.querySelector('#am-magic-quick-prompts');
            if (!quickPrompts) return;

            quickPrompts.querySelectorAll('.am-quick-prompt').forEach((btn) => {
                if (!(btn instanceof HTMLElement)) return;
                const idx = Number(btn.dataset.index);
                const item = this.QUICK_PROMPTS[idx];
                if (!item) return;
                btn.textContent = this.resolvePromptLabel(item);
            });
        },

        renderCrowdCampaignItemSelect(campaignId = '') {
            if (!(this.matrixCampaignItemSelectEl instanceof HTMLSelectElement)) return;
            const id = PlanIdentityUtils.normalizeCampaignId(campaignId);
            const selectedItemId = this.getCrowdCampaignSelectedItemId(id);
            const options = this.getCrowdCampaignItemOptions(id);
            this.matrixCampaignItemSelectEl.innerHTML = '';

            if (!id) {
                const optionEl = document.createElement('option');
                optionEl.value = '';
                optionEl.textContent = '--';
                this.matrixCampaignItemSelectEl.appendChild(optionEl);
                this.matrixCampaignItemSelectEl.disabled = true;
                return;
            }

            const normalizedOptions = options.filter(item => /^\d{6,}$/.test(String(item?.itemId || '').trim()));

            if (!normalizedOptions.length) {
                const emptyOption = document.createElement('option');
                emptyOption.value = '';
                emptyOption.textContent = '--';
                this.matrixCampaignItemSelectEl.appendChild(emptyOption);
                this.matrixCampaignItemSelectEl.disabled = true;
                return;
            }

            normalizedOptions.forEach((item) => {
                const optionEl = document.createElement('option');
                optionEl.value = item.itemId;
                const spend = this.toNumericValue(item?.spend || 0);
                const itemTitle = this.normalizeCrowdItemTitle(item?.itemTitle || '') || `商品${item.itemId}`;
                optionEl.textContent = spend > 0
                    ? `${itemTitle}（${item.itemId}，花费${this.formatCrowdSpendAmount(spend)}）`
                    : `${itemTitle}（${item.itemId}）`;
                this.matrixCampaignItemSelectEl.appendChild(optionEl);
            });

            const pickedItemId = selectedItemId && normalizedOptions.some(item => item.itemId === selectedItemId)
                ? selectedItemId
                : normalizedOptions[0].itemId;
            if (pickedItemId !== selectedItemId) {
                this.setCrowdCampaignSelectedItemId(id, pickedItemId, { manual: false });
            }
            this.matrixCampaignItemSelectEl.value = pickedItemId;
            this.matrixCampaignItemSelectEl.disabled = false;
        },

        refreshCrowdMatrixCampaignMeta(campaignId = '') {
            if (!(this.matrixCampaignEl instanceof HTMLElement)) return;
            const id = String(campaignId || this.getCurrentCampaignId() || this.lastCampaignId || '').trim();
            const name = this.getCurrentCampaignName() || this.lastCampaignName || '';
            if (this.matrixCampaignNameEl instanceof HTMLElement) {
                this.matrixCampaignNameEl.textContent = `计划名：${name || '未识别'}`;
            }
            if (this.matrixCampaignIdEl instanceof HTMLElement) {
                this.matrixCampaignIdEl.textContent = `计划ID：${id || '--'}`;
            }
            this.renderCrowdCampaignItemSelect(id);
        },

        async resolvePromptText(promptItem) {
            const template = String(promptItem?.value || '').trim();
            if (!template) return '';

            let resolved = template;

            if (resolved.includes('{campaignId}')) {
                const campaignId = this.getCurrentCampaignId();
                if (!campaignId) {
                    Logger.log('⚠️ 未识别到当前计划ID，请先进入计划详情页或勾选计划后重试', true);
                    return '';
                }
                resolved = resolved.replace(/\{campaignId\}/g, campaignId);
            }

            if (resolved.includes('{campaignName}')) {
                const campaignName = this.getCurrentCampaignName();
                if (!campaignName) {
                    Logger.log('⚠️ 未识别到当前计划名称，请先进入计划详情页或勾选计划后重试', true);
                    return '';
                }
                resolved = resolved.replace(/\{campaignName\}/g, campaignName);
            }

            if (resolved.includes('{商品ID}') || resolved.includes('{itemId}')) {
                const campaignId = this.getCurrentCampaignId();
                if (!campaignId) {
                    Logger.log('⚠️ 未识别到当前计划ID，无法解析商品ID，请先进入计划详情页或勾选计划后重试', true);
                    return '';
                }
                let itemId = this.getCrowdCampaignSelectedItemId(campaignId) || this.getCrowdCampaignItemId(campaignId);
                if (!/^\d{6,}$/.test(itemId)) {
                    await this.refreshCrowdCampaignItemOptions(campaignId);
                    itemId = this.getCrowdCampaignSelectedItemId(campaignId) || this.getCrowdCampaignItemId(campaignId);
                }
                if (!/^\d{6,}$/.test(itemId)) {
                    itemId = await this.resolveCrowdItemIdByCampaign(campaignId);
                }
                if (!/^\d{6,}$/.test(itemId)) {
                    Logger.log(`⚠️ 未识别到计划 ${campaignId} 对应商品ID，请稍后重试`, true);
                    return '';
                }
                resolved = resolved
                    .replace(/\{商品ID\}/g, itemId)
                    .replace(/\{itemId\}/g, itemId);
            }

            return resolved;
        },

        isEditablePromptElement(el) {
            return MagicPromptDriver.isEditablePromptElement(el);
        },

        isVisibleElement(el) {
            return MagicPromptDriver.isVisibleElement(el);
        },

        findPromptInput(iframeDoc) {
            return MagicPromptDriver.findPromptInput(iframeDoc);
        },

        setPromptInputValue(inputEl, promptText) {
            return MagicPromptDriver.setPromptInputValue(inputEl, promptText);
        },

        triggerClick(el) {
            MagicPromptDriver.triggerClick(el);
        },

        findQueryTrigger(iframeDoc, inputEl) {
            return MagicPromptDriver.findQueryTrigger(iframeDoc, inputEl);
        },

        trySubmitPrompt(promptText) {
            const iframeDoc = this.getIframeDoc();
            if (!iframeDoc) return { ok: false, reason: 'iframe-not-ready' };
            return MagicPromptDriver.trySubmitPromptInDocument(iframeDoc, promptText);
        },

        async tryFallbackSubmitPrompt(promptText) {
            const fallbackCampaignId = this.extractCampaignId(promptText)
                || this.getCurrentCampaignId()
                || this.lastCampaignId;
            if (!/^\d{6,}$/.test(String(fallbackCampaignId || '').trim())) {
                return false;
            }
            try {
                return await this.openNativeAndSubmit(fallbackCampaignId, promptText);
            } catch {
                return false;
            }
        },

        runQuickPrompt(promptText) {
            const maxRetries = 16;
            const tryRun = (retriesLeft) => {
                const result = this.trySubmitPrompt(promptText);
                if (result.ok) {
                    if (result.uncertain) {
                        Logger.log(`🔮 已回车尝试提交：${promptText} `);
                    } else {
                        Logger.log(`🔮 快捷查询已执行：${promptText} `);
                    }
                    return;
                }
                if (retriesLeft <= 0) {
                    this.tryFallbackSubmitPrompt(promptText).then((fallbackOk) => {
                        if (fallbackOk) return;
                        if (result.reason === 'input-not-found' || result.reason === 'iframe-not-ready') {
                            Logger.log('⚠️ 万能查数尚未加载完成，请稍后重试', true);
                        } else {
                            Logger.log('⚠️ 未识别到可用查询按钮，请手动点一次查询后重试', true);
                        }
                    });
                    return;
                }
                setTimeout(() => tryRun(retriesLeft - 1), 500);
            };
            tryRun(maxRetries);
        },

        buildPromptByCampaignId(campaignId, promptType = 'click') {
            const id = String(campaignId || '').trim();
            if (!/^\d{6,}$/.test(id)) return '';

            const prompts = {
                'click': `计划ID：${id} 点击人群分析`,
                'conversion': `计划ID：${id} 转化人群分析`,
                'diagnose': `计划ID：${id} 深度诊断`
            };

            return prompts[promptType] || prompts['click'];
        },

        trySubmitPromptInDocument(doc, promptText) {
            return MagicPromptDriver.trySubmitPromptInDocument(doc, promptText);
        },

        async openNativeAndSubmit(campaignId, promptText) {
            const nativeOk = await MagicPromptDriver.openNativeAndSubmit(campaignId, promptText);
            if (nativeOk) {
                Logger.log(`🔍 原生查数已执行：${promptText}`);
            }
            return nativeOk;
        },

        async openWithCampaignId(campaignId, options = {}) {
            const id = String(campaignId || '').trim();
            if (!/^\d{6,}$/.test(id)) {
                Logger.log(`⚠️ 计划ID无效，已忽略快捷查数：${id || '-'} `, true);
                return false;
            }

            this.lastCampaignId = id;
            const promptText = this.buildPromptByCampaignId(id, options.promptType || 'click');
            if (!promptText) {
                Logger.log(`⚠️ 计划ID无效，已忽略快捷查数：${id} `, true);
                return false;
            }

            const preferNative = options.preferNative !== false;
            if (preferNative) {
                try {
                    const nativeOk = await this.openNativeAndSubmit(id, promptText);
                    if (nativeOk) return true;
                } catch {
                    // ignore and fallback
                }
                Logger.log('⚠️ 原生万象查数不可用，已回退万能查数', true);
            }

            this.toggle(true);
            this.runQuickPrompt(promptText);
            return true;
        },

        normalizeCrowdMetricType(metricType) {
            const normalized = String(metricType || '').trim().toLowerCase();
            return this.CROWD_METRICS.includes(normalized) ? normalized : '';
        },

        getCrowdMetricMeta(metricType) {
            const metric = this.normalizeCrowdMetricType(metricType);
            const map = {
                click: {
                    promptKeyword: '点击人群分析',
                    seriesLabel: '点击人群',
                    shortLabel: '点',
                    color: '#2f54eb'
                },
                cart: {
                    promptKeyword: '加购人群分析',
                    seriesLabel: '加购人群',
                    shortLabel: '购',
                    color: '#13c2c2'
                },
                deal: {
                    promptKeyword: '成交人群分析',
                    seriesLabel: '成交人群',
                    shortLabel: '成',
                    color: '#fa8c16'
                },
                itemdeal: {
                    promptKeyword: '成交人群分析',
                    seriesLabel: '商品成交人群',
                    shortLabel: '商成',
                    color: '#52c41a'
                }
            };
            return map[metric] || map.click;
        },

        cacheCrowdCampaignItemId(campaignId, itemId) {
            const id = PlanIdentityUtils.normalizeCampaignId(campaignId);
            const normalizedItemId = PlanIdentityUtils.normalizeItemId(itemId);
            if (!id || !normalizedItemId) return '';
            if (!(this.crowdCampaignItemIdMap instanceof Map)) {
                this.crowdCampaignItemIdMap = new Map();
            }
            this.crowdCampaignItemIdMap.set(id, normalizedItemId);
            PlanIdentityUtils.rememberCampaignItemId(id, normalizedItemId);
            return normalizedItemId;
        },

        getCrowdCampaignItemId(campaignId) {
            const id = PlanIdentityUtils.normalizeCampaignId(campaignId);
            if (!id) return '';
            if (this.crowdCampaignItemIdMap instanceof Map) {
                const localCached = PlanIdentityUtils.normalizeItemId(this.crowdCampaignItemIdMap.get(id) || '');
                if (localCached) return localCached;
            }
            try {
                const sharedCached = PlanIdentityUtils.getCampaignItemId(id);
                if (!sharedCached) return '';
                this.cacheCrowdCampaignItemId(id, sharedCached);
                return sharedCached;
            } catch {
                return '';
            }
        },

        getCrowdCampaignItemOptions(campaignId) {
            const id = PlanIdentityUtils.normalizeCampaignId(campaignId);
            if (!id) return [];
            if (!(this.crowdCampaignItemOptionsMap instanceof Map)) {
                this.crowdCampaignItemOptionsMap = new Map();
            }
            const list = this.crowdCampaignItemOptionsMap.get(id);
            return Array.isArray(list) ? list.slice() : [];
        },

        getCrowdCampaignSelectedItemId(campaignId) {
            const id = PlanIdentityUtils.normalizeCampaignId(campaignId);
            if (!id) return '';
            if (this.crowdCampaignSelectedItemIdMap instanceof Map) {
                const selected = PlanIdentityUtils.normalizeItemId(this.crowdCampaignSelectedItemIdMap.get(id) || '');
                if (selected) return selected;
            }
            return '';
        },

        isCrowdCampaignItemManuallySelected(campaignId) {
            const id = PlanIdentityUtils.normalizeCampaignId(campaignId);
            if (!id) return false;
            if (!(this.crowdCampaignManualItemSelectionMap instanceof Map)) return false;
            return this.crowdCampaignManualItemSelectionMap.get(id) === true;
        },

        setCrowdCampaignSelectedItemId(campaignId, itemId, options = {}) {
            const id = PlanIdentityUtils.normalizeCampaignId(campaignId);
            const normalizedItemId = PlanIdentityUtils.normalizeItemId(itemId);
            if (!id) return '';
            if (!(this.crowdCampaignSelectedItemIdMap instanceof Map)) {
                this.crowdCampaignSelectedItemIdMap = new Map();
            }
            if (!(this.crowdCampaignManualItemSelectionMap instanceof Map)) {
                this.crowdCampaignManualItemSelectionMap = new Map();
            }
            if (normalizedItemId) {
                this.crowdCampaignSelectedItemIdMap.set(id, normalizedItemId);
                this.crowdCampaignManualItemSelectionMap.set(id, options?.manual === true);
                this.cacheCrowdCampaignItemId(id, normalizedItemId);
                return normalizedItemId;
            }
            this.crowdCampaignSelectedItemIdMap.delete(id);
            this.crowdCampaignManualItemSelectionMap.delete(id);
            return '';
        },

        formatCrowdSpendAmount(rawValue) {
            const value = this.toNumericValue(rawValue);
            if (value <= 0) return '0';
            if (value >= 10000) return value.toFixed(0);
            if (value >= 1000) return value.toFixed(1).replace(/\.0$/, '');
            return value.toFixed(2).replace(/\.?0+$/, '');
        },

        normalizeCrowdItemTitle(rawTitle = '') {
            const title = String(rawTitle || '')
                .replace(/\s+/g, ' ')
                .trim();
            if (!title) return '';
            if (/^(?:--|-|null|undefined)$/i.test(title)) return '';
            if (/^\d{6,}$/.test(title)) return '';
            return title;
        },

        resolveCrowdItemActiveState(meta = {}) {
            if (!meta || typeof meta !== 'object') return null;
            const onlineNum = Number(meta.onlineStatus ?? meta.isOnline ?? meta.online ?? '');
            if (Number.isFinite(onlineNum)) {
                if (onlineNum === 1) return true;
                if (onlineNum === 0) return false;
            }
            const text = [
                meta.displayStatus,
                meta.status,
                meta.onlineStatus,
                meta.itemStatus,
                meta.adgroupStatus,
                meta.planStatus,
                meta.campaignStatus,
                meta.statusDesc,
                meta.state
            ].map(item => String(item || '').trim().toLowerCase()).join('|');
            if (!text) return null;
            if (/(start|online|active|running|enable|在投|投放|推广中|开启|生效)/.test(text)) return true;
            if (/(pause|stop|offline|suspend|disable|暂停|关闭|下线|失效|停投)/.test(text)) return false;
            return null;
        },

        mergeCrowdItemActiveState(current, next) {
            const currentState = current === true ? true : (current === false ? false : null);
            const nextState = next === true ? true : (next === false ? false : null);
            if (nextState === true) return true;
            if (nextState === false) return currentState === true ? true : false;
            return currentState;
        },

        collectCrowdItemMetaFromNode(node = {}, campaignId = '') {
            if (!node || typeof node !== 'object') return [];
            const normalizedCampaignId = PlanIdentityUtils.normalizeCampaignId(campaignId);
            const itemIds = this.collectCrowdDirectItemIdCandidates(node);
            if (!itemIds.length) return [];
            const titleCandidates = [
                node.materialName,
                node.itemName,
                node.itemTitle,
                node.title,
                node.name,
                node.goodsTitle,
                node.auctionTitle,
                node?.material?.materialName,
                node?.material?.itemName,
                node?.material?.itemTitle,
                node?.material?.title,
                node?.item?.materialName,
                node?.item?.itemName,
                node?.item?.itemTitle,
                node?.item?.title
            ];
            let itemTitle = '';
            for (let i = 0; i < titleCandidates.length; i++) {
                const normalizedTitle = this.normalizeCrowdItemTitle(titleCandidates[i]);
                if (!normalizedTitle) continue;
                itemTitle = normalizedTitle;
                break;
            }
            let active = this.resolveCrowdItemActiveState(node);
            if (active === null && node.material && typeof node.material === 'object') {
                active = this.resolveCrowdItemActiveState(node.material);
            }
            if (active === null && node.adgroup && typeof node.adgroup === 'object') {
                active = this.resolveCrowdItemActiveState(node.adgroup);
            }
            if (active === null && node.campaign && typeof node.campaign === 'object') {
                active = this.resolveCrowdItemActiveState(node.campaign);
            }
            return itemIds.map((itemId) => ({
                campaignId: normalizedCampaignId,
                itemId,
                itemTitle,
                active
            }));
        },

        collectCrowdItemMetaFromPayload(payload = {}, campaignId = '') {
            const data = payload && typeof payload === 'object' && payload.data && typeof payload.data === 'object'
                ? payload.data
                : {};
            const rows = this.collectCrowdSpendRowsFromPayload(payload);
            const nodes = rows.slice();
            if (data.campaign && typeof data.campaign === 'object') nodes.push(data.campaign);
            if (payload?.campaign && typeof payload.campaign === 'object') nodes.push(payload.campaign);
            if (data.adgroup && typeof data.adgroup === 'object') nodes.push(data.adgroup);
            if (payload?.adgroup && typeof payload.adgroup === 'object') nodes.push(payload.adgroup);
            if (Array.isArray(data.adgroupList)) nodes.push(...data.adgroupList);
            if (Array.isArray(payload?.adgroupList)) nodes.push(...payload.adgroupList);
            const metaMap = new Map();
            nodes.forEach((node) => {
                this.collectCrowdItemMetaFromNode(node, campaignId).forEach((itemMeta) => {
                    const itemId = PlanIdentityUtils.normalizeItemId(itemMeta?.itemId || '');
                    if (!itemId) return;
                    const prev = metaMap.get(itemId) || {
                        campaignId: PlanIdentityUtils.normalizeCampaignId(campaignId),
                        itemId,
                        itemTitle: '',
                        active: null
                    };
                    const title = this.normalizeCrowdItemTitle(itemMeta?.itemTitle || '');
                    const prevTitle = this.normalizeCrowdItemTitle(prev.itemTitle || '');
                    if (!prevTitle && title) {
                        prev.itemTitle = title;
                    } else if (title && /^商品\d{6,}$/.test(prevTitle) && !/^商品\d{6,}$/.test(title)) {
                        prev.itemTitle = title;
                    }
                    prev.active = this.mergeCrowdItemActiveState(prev.active, itemMeta?.active);
                    metaMap.set(itemId, prev);
                });
            });
            return Array.from(metaMap.values());
        },

        collectCrowdDirectItemIdCandidates(node) {
            if (!node || typeof node !== 'object') return [];
            return PlanIdentityUtils.collectItemIdCandidatesFromSources([
                node.itemId,
                node.materialId,
                node.auctionId,
                node.targetItemId,
                node.targetMaterialId,
                node.item_id,
                node.material_id,
                node.itemid,
                node.materialid,
                node.item,
                node.material,
                node.itemUrl,
                node.materialUrl,
                node.linkUrl,
                node.url
            ], 12);
        },

        extractCrowdSpendFromReportNode(node) {
            if (!node || typeof node !== 'object') return 0;
            const values = [
                node.charge,
                node.cost,
                node.consume,
                node.spend,
                node.payAmount,
                node.amount
            ].map(item => this.toNumericValue(item)).filter(num => num > 0);
            if (!values.length) return 0;
            return Math.max(...values);
        },

        extractCrowdSpendFromNode(node) {
            if (!node || typeof node !== 'object') return 0;
            const reportList = Array.isArray(node.reportInfoList) ? node.reportInfoList : [];
            if (reportList.length) {
                const reportTotal = reportList.reduce((sum, reportItem) => {
                    return sum + this.extractCrowdSpendFromReportNode(reportItem);
                }, 0);
                if (reportTotal > 0) return reportTotal;
            }
            const direct = this.extractCrowdSpendFromReportNode(node);
            if (direct > 0) return direct;
            if (node.reportInfo && typeof node.reportInfo === 'object') {
                return this.extractCrowdSpendFromReportNode(node.reportInfo);
            }
            return 0;
        },

        collectCrowdSpendRowsFromPayload(payload = {}) {
            const rows = [];
            const pushRows = (list) => {
                if (!Array.isArray(list) || !list.length) return;
                list.forEach((item) => {
                    if (!item || typeof item !== 'object') return;
                    rows.push(item);
                });
            };
            const data = payload && typeof payload === 'object' && payload.data && typeof payload.data === 'object'
                ? payload.data
                : {};
            pushRows(data.list);
            pushRows(payload?.list);
            pushRows(data.rows);
            pushRows(payload?.rows);
            pushRows(data.adgroupList);
            pushRows(payload?.adgroupList);

            const campaignRows = Array.isArray(data.list) ? data.list : [];
            campaignRows.forEach((campaignRow) => {
                if (!campaignRow || typeof campaignRow !== 'object') return;
                pushRows(campaignRow.adgroupList);
                pushRows(campaignRow.groupList);
                if (campaignRow.adgroup && typeof campaignRow.adgroup === 'object') {
                    rows.push(campaignRow.adgroup);
                }
            });
            return rows;
        },

        collectCrowdItemSpendSummaryFromRow(row = {}, campaignId = '') {
            if (!row || typeof row !== 'object') return [];
            const normalizedCampaignId = PlanIdentityUtils.normalizeCampaignId(campaignId);
            const itemIds = this.collectCrowdDirectItemIdCandidates(row);
            if (!itemIds.length) return [];
            const reportList = Array.isArray(row.reportInfoList) ? row.reportInfoList : [];
            const reportSpend = reportList.reduce((maxValue, reportItem) => {
                return Math.max(maxValue, this.extractCrowdSpendFromReportNode(reportItem));
            }, 0);
            const spend = Math.max(
                reportSpend,
                this.extractCrowdSpendFromReportNode(row?.reportInfo || {}),
                this.extractCrowdSpendFromReportNode(row)
            );
            if (spend <= 0) return [];
            return itemIds.map((itemId) => ({
                campaignId: normalizedCampaignId,
                itemId,
                spend
            }));
        },

        collectCrowdItemSpendSummaryFromPayload(payload = {}, campaignId = '') {
            const summaryMap = new Map();
            const rows = this.collectCrowdSpendRowsFromPayload(payload);
            rows.forEach((row) => {
                this.collectCrowdItemSpendSummaryFromRow(row, campaignId).forEach((item) => {
                    const itemId = PlanIdentityUtils.normalizeItemId(item?.itemId || '');
                    const spend = this.toNumericValue(item?.spend || 0);
                    if (!itemId || spend <= 0) return;
                    const prev = summaryMap.get(itemId) || 0;
                    summaryMap.set(itemId, prev + spend);
                });
            });
            const normalizedCampaignId = PlanIdentityUtils.normalizeCampaignId(campaignId);
            const out = Array.from(summaryMap.entries())
                .map(([itemId, spend]) => ({
                    campaignId: normalizedCampaignId,
                    itemId: PlanIdentityUtils.normalizeItemId(itemId),
                    spend: this.toNumericValue(spend)
                }))
                .filter(item => item.itemId && item.spend > 0);
            out.sort((left, right) => {
                if (right.spend !== left.spend) return right.spend - left.spend;
                return String(left.itemId || '').localeCompare(String(right.itemId || ''));
            });
            return out;
        },

        async queryCrowdCampaignSpendPayload(campaignId, bizCode, authContext) {
            const id = PlanIdentityUtils.normalizeCampaignId(campaignId);
            const normalizedBizCode = PlanIdentityUtils.normalizeBizCode(bizCode)
                || authContext?.bizCode
                || PlanIdentityUtils.DEFAULT_BIZ_CODE;
            if (!id || !normalizedBizCode) return null;
            const url = OneApiTransport.buildOneUrl('/campaign/horizontal/findPage.json', {
                csrfId: String(authContext?.csrfId || ''),
                bizCode: normalizedBizCode
            });
            const endDate = PlanIdentityUtils.formatDateYmd(new Date());
            const startDateObj = new Date();
            startDateObj.setDate(startDateObj.getDate() - 29);
            const startDate = PlanIdentityUtils.formatDateYmd(startDateObj);
            return OneApiTransport.postJson(url, {
                mx_bizCode: normalizedBizCode,
                bizCode: normalizedBizCode,
                offset: 0,
                pageSize: 200,
                orderField: '',
                orderBy: '',
                queryRuleAuto: '1',
                adgroupRequired: true,
                adzoneRequired: false,
                campaignId: Number(id),
                campaignIdList: [Number(id)],
                rptQuery: {
                    fields: 'charge,click,ecpc,roi',
                    conditionList: [{
                        sourceList: ['scene', 'campaign_list'],
                        adzonePkgIdList: [],
                        effectEqual: '15',
                        unifyType: 'last_click_by_effect_time',
                        startTime: startDate,
                        endTime: endDate,
                        isRt: false
                    }]
                },
                csrfId: String(authContext?.csrfId || ''),
                loginPointId: String(authContext?.loginPointId || '')
            }, {
                actionName: '查询计划商品花费失败',
                businessErrorMessage: '查询计划商品花费失败'
            });
        },

        async collectCrowdCampaignItemIdsByDetail(campaignId, bizCode, authContext) {
            const id = PlanIdentityUtils.normalizeCampaignId(campaignId);
            const normalizedBizCode = PlanIdentityUtils.normalizeBizCode(bizCode);
            if (!id || !normalizedBizCode) {
                return {
                    itemIds: [],
                    spendSummary: [],
                    itemMetaList: []
                };
            }

            const itemIdSet = new Set();
            const pushItemId = (rawItemId) => {
                const normalizedItemId = PlanIdentityUtils.normalizeItemId(rawItemId);
                if (!normalizedItemId || itemIdSet.has(normalizedItemId)) return;
                itemIdSet.add(normalizedItemId);
            };
            const spendSummary = [];
            const itemMetaMap = new Map();
            const upsertItemMeta = (rawItemId, meta = {}) => {
                const itemId = PlanIdentityUtils.normalizeItemId(rawItemId);
                if (!itemId) return;
                const prev = itemMetaMap.get(itemId) || {
                    campaignId: id,
                    itemId,
                    itemTitle: '',
                    active: null
                };
                const nextTitle = this.normalizeCrowdItemTitle(meta?.itemTitle || '');
                const prevTitle = this.normalizeCrowdItemTitle(prev.itemTitle || '');
                if (!prevTitle && nextTitle) {
                    prev.itemTitle = nextTitle;
                } else if (nextTitle && /^商品\d{6,}$/.test(prevTitle) && !/^商品\d{6,}$/.test(nextTitle)) {
                    prev.itemTitle = nextTitle;
                }
                prev.active = this.mergeCrowdItemActiveState(prev.active, meta?.active);
                itemMetaMap.set(itemId, prev);
            };
            const mergeSpendSummary = (summaryList = []) => {
                (Array.isArray(summaryList) ? summaryList : []).forEach((item) => {
                    const itemId = PlanIdentityUtils.normalizeItemId(item?.itemId || '');
                    const spend = this.toNumericValue(item?.spend || 0);
                    if (!itemId || spend <= 0) return;
                    spendSummary.push({
                        campaignId: id,
                        itemId,
                        spend
                    });
                });
            };
            const mergeItemMetaList = (list = []) => {
                (Array.isArray(list) ? list : []).forEach((item) => {
                    const itemId = PlanIdentityUtils.normalizeItemId(item?.itemId || '');
                    if (!itemId) return;
                    pushItemId(itemId);
                    upsertItemMeta(itemId, item);
                });
            };

            const detail = await PlanIdentityUtils.queryCampaignDetail(id, normalizedBizCode, authContext);
            (Array.isArray(detail?.itemIdCandidates) ? detail.itemIdCandidates : []).forEach(pushItemId);
            mergeSpendSummary(this.collectCrowdItemSpendSummaryFromPayload(detail?.response || {}, id));
            mergeItemMetaList(this.collectCrowdItemMetaFromPayload(detail?.response || {}, id));
            const adgroupIds = Array.isArray(detail?.adgroupIds) ? detail.adgroupIds : [];
            if (adgroupIds.length) {
                const tasks = adgroupIds.map((adgroupId) => async () => {
                    try {
                        return await PlanIdentityUtils.queryAdgroupDetail(id, adgroupId, normalizedBizCode, authContext);
                    } catch {
                        return null;
                    }
                });
                const settled = await this.runTasksWithConcurrency(tasks, 4);
                settled.forEach((item) => {
                    if (item.status !== 'fulfilled' || !item.value) return;
                    const adgroupDetail = item.value;
                    pushItemId(adgroupDetail?.itemId || '');
                    (Array.isArray(adgroupDetail?.itemIdCandidates) ? adgroupDetail.itemIdCandidates : []).forEach(pushItemId);
                    mergeSpendSummary(this.collectCrowdItemSpendSummaryFromPayload(adgroupDetail?.response || {}, id));
                    mergeItemMetaList(this.collectCrowdItemMetaFromPayload(adgroupDetail?.response || {}, id));
                });
            }

            return {
                itemIds: Array.from(itemIdSet),
                spendSummary,
                itemMetaList: Array.from(itemMetaMap.values())
            };
        },

        async refreshCrowdCampaignItemOptions(campaignId, options = {}) {
            const id = PlanIdentityUtils.normalizeCampaignId(campaignId);
            if (!id) return [];
            const forceRefresh = options?.forceRefresh === true;
            if (!(this.crowdCampaignItemOptionsMap instanceof Map)) {
                this.crowdCampaignItemOptionsMap = new Map();
            }
            if (!forceRefresh) {
                const cachedOptions = this.getCrowdCampaignItemOptions(id);
                if (cachedOptions.length) return cachedOptions;
            }
            const spendMap = new Map();
            const itemIdSet = new Set();
            const itemMetaMap = new Map();
            const pushItemId = (rawItemId) => {
                const itemId = PlanIdentityUtils.normalizeItemId(rawItemId);
                if (!itemId || itemIdSet.has(itemId)) return;
                itemIdSet.add(itemId);
                this.cacheCrowdCampaignItemId(id, itemId);
            };
            const upsertItemMeta = (rawItemId, meta = {}) => {
                const itemId = PlanIdentityUtils.normalizeItemId(rawItemId);
                if (!itemId) return;
                const prev = itemMetaMap.get(itemId) || {
                    campaignId: id,
                    itemId,
                    itemTitle: '',
                    active: null
                };
                const nextTitle = this.normalizeCrowdItemTitle(meta?.itemTitle || '');
                const prevTitle = this.normalizeCrowdItemTitle(prev.itemTitle || '');
                if (!prevTitle && nextTitle) {
                    prev.itemTitle = nextTitle;
                } else if (nextTitle && /^商品\d{6,}$/.test(prevTitle) && !/^商品\d{6,}$/.test(nextTitle)) {
                    prev.itemTitle = nextTitle;
                }
                prev.active = this.mergeCrowdItemActiveState(prev.active, meta?.active);
                itemMetaMap.set(itemId, prev);
            };
            const mergeSummary = (list = []) => {
                (Array.isArray(list) ? list : []).forEach((item) => {
                    const itemId = PlanIdentityUtils.normalizeItemId(item?.itemId || '');
                    const spend = this.toNumericValue(item?.spend || 0);
                    if (!itemId) return;
                    pushItemId(itemId);
                    if (spend <= 0) return;
                    const prev = spendMap.get(itemId) || 0;
                    spendMap.set(itemId, prev + spend);
                });
            };
            const mergeItemMetaList = (list = []) => {
                (Array.isArray(list) ? list : []).forEach((item) => {
                    const itemId = PlanIdentityUtils.normalizeItemId(item?.itemId || '');
                    if (!itemId) return;
                    pushItemId(itemId);
                    upsertItemMeta(itemId, item);
                });
            };

            try {
                const authContext = PlanIdentityUtils.resolveAuthContext(PlanIdentityUtils.DEFAULT_BIZ_CODE);
                const bizList = [];
                const pushBiz = (value) => {
                    const normalized = PlanIdentityUtils.normalizeBizCode(value);
                    if (!normalized) return;
                    if (bizList.includes(normalized)) return;
                    bizList.push(normalized);
                };
                PlanIdentityUtils.BIZ_CODE_LIST.forEach(pushBiz);
                pushBiz(authContext?.bizCode || '');
                if (!bizList.length) pushBiz(PlanIdentityUtils.DEFAULT_BIZ_CODE);

                for (let i = 0; i < bizList.length; i++) {
                    const bizCode = bizList[i];
                    try {
                        const payload = await this.queryCrowdCampaignSpendPayload(id, bizCode, authContext);
                        mergeSummary(this.collectCrowdItemSpendSummaryFromPayload(payload, id));
                        mergeItemMetaList(this.collectCrowdItemMetaFromPayload(payload, id));
                    } catch {
                        // ignore and keep trying other biz
                    }
                }

                for (let i = 0; i < bizList.length; i++) {
                    const bizCode = bizList[i];
                    try {
                        const detailResult = await this.collectCrowdCampaignItemIdsByDetail(id, bizCode, authContext);
                        (Array.isArray(detailResult?.itemIds) ? detailResult.itemIds : []).forEach(pushItemId);
                        mergeSummary(detailResult?.spendSummary || []);
                        mergeItemMetaList(detailResult?.itemMetaList || []);
                        if (itemIdSet.size) {
                            PlanIdentityUtils.rememberCampaignItemIdCandidates(id, Array.from(itemIdSet), {
                                prepend: true,
                                maxCount: 120
                            });
                            break;
                        }
                    } catch {
                        // ignore and keep trying other biz
                    }
                }
            } catch (err) {
                Logger.warn(`🔮 商品花费列表识别失败：${err?.message || '未知错误'}`);
            }

            this.getCrowdCampaignItemCandidates(id).forEach(pushItemId);
            const spendItemIds = Array.from(spendMap.keys());
            spendItemIds.forEach(pushItemId);

            let itemOptions = Array.from(itemIdSet.values())
                .map((itemId) => ({
                    itemId,
                    spend: this.toNumericValue(spendMap.get(itemId) || 0),
                    itemTitle: this.normalizeCrowdItemTitle(itemMetaMap.get(itemId)?.itemTitle || ''),
                    active: itemMetaMap.get(itemId)?.active === true
                        ? true
                        : (itemMetaMap.get(itemId)?.active === false ? false : null)
                }))
                .sort((left, right) => {
                    if (right.spend !== left.spend) return right.spend - left.spend;
                    return String(left.itemId || '').localeCompare(String(right.itemId || ''));
                });

            itemOptions = itemOptions
                .filter(item => item.active !== false)
                .sort((left, right) => {
                    const leftRank = left?.active === true ? 0 : 1;
                    const rightRank = right?.active === true ? 0 : 1;
                    if (leftRank !== rightRank) return leftRank - rightRank;
                    if (right.spend !== left.spend) return right.spend - left.spend;
                    return String(left.itemId || '').localeCompare(String(right.itemId || ''));
                });

            if (!itemOptions.length) {
                const fallbackCandidates = this.getCrowdCampaignItemCandidates(id);
                itemOptions = fallbackCandidates.map((itemId) => ({
                    itemId,
                    spend: 0,
                    itemTitle: '',
                    active: null
                }));
            }

            this.crowdCampaignItemOptionsMap.set(id, itemOptions);
            const selectedItemId = this.getCrowdCampaignSelectedItemId(id);
            const isManualSelected = this.isCrowdCampaignItemManuallySelected(id);
            const selectedExists = itemOptions.some(item => item.itemId === selectedItemId);
            if (!selectedItemId || !selectedExists) {
                const nextSelectedItemId = itemOptions[0]?.itemId || this.getCrowdCampaignItemId(id);
                this.setCrowdCampaignSelectedItemId(id, nextSelectedItemId, { manual: false });
            } else if (!isManualSelected) {
                this.setCrowdCampaignSelectedItemId(id, selectedItemId, { manual: false });
            }

            return this.getCrowdCampaignItemOptions(id);
        },

        getCrowdCampaignItemCandidates(campaignId, preferredItemId = '') {
            const id = PlanIdentityUtils.normalizeCampaignId(campaignId);
            if (!id) return [];
            const out = [];
            const seen = new Set();
            const pushItem = (raw) => {
                const normalized = PlanIdentityUtils.normalizeItemId(raw);
                if (!normalized || seen.has(normalized)) return;
                seen.add(normalized);
                out.push(normalized);
            };
            if (typeof PlanIdentityUtils.getCampaignItemIdCandidates === 'function') {
                const sharedCandidates = PlanIdentityUtils.getCampaignItemIdCandidates(id);
                (Array.isArray(sharedCandidates) ? sharedCandidates : []).forEach(pushItem);
            }
            pushItem(preferredItemId);
            pushItem(this.getCrowdCampaignSelectedItemId(id));
            pushItem(this.getCrowdCampaignItemId(id));
            return out;
        },

        async resolveCrowdItemIdByCampaign(campaignId, options = {}) {
            const id = PlanIdentityUtils.normalizeCampaignId(campaignId);
            if (!id) return '';
            const preferCache = options?.preferCache !== false;
            const allowCacheFallback = options?.allowCacheFallback !== false;
            const syncSelectedItemIfNeeded = (itemId) => {
                const normalizedItemId = PlanIdentityUtils.normalizeItemId(itemId);
                if (!normalizedItemId) return '';
                if (this.getCrowdCampaignSelectedItemId(id)) return normalizedItemId;
                this.setCrowdCampaignSelectedItemId(id, normalizedItemId, { manual: false });
                return normalizedItemId;
            };
            const fromCache = PlanIdentityUtils.getCampaignItemId(id);
            if (fromCache && preferCache) {
                this.cacheCrowdCampaignItemId(id, fromCache);
                syncSelectedItemIfNeeded(fromCache);
                this.refreshCrowdMatrixCampaignMeta(id);
                return fromCache;
            }
            if (!preferCache) {
                if (this.crowdCampaignItemIdMap instanceof Map) {
                    this.crowdCampaignItemIdMap.delete(id);
                }
                if (PlanIdentityUtils.campaignItemIdCache instanceof Map) {
                    PlanIdentityUtils.campaignItemIdCache.delete(id);
                }
                if (PlanIdentityUtils.campaignItemCandidatesCache instanceof Map) {
                    PlanIdentityUtils.campaignItemCandidatesCache.delete(id);
                }
            }
            try {
                const authContext = PlanIdentityUtils.resolveAuthContext(PlanIdentityUtils.DEFAULT_BIZ_CODE);
                const resolved = await PlanIdentityUtils.resolveItemIdByCampaignId(
                    id,
                    PlanIdentityUtils.BIZ_CODE_LIST.slice(),
                    authContext,
                    allowCacheFallback ? (fromCache || '') : '',
                    [],
                    { preferCache }
                );
                const normalized = PlanIdentityUtils.normalizeItemId(resolved);
                if (!normalized) {
                    if (fromCache && allowCacheFallback) {
                        this.cacheCrowdCampaignItemId(id, fromCache);
                        syncSelectedItemIfNeeded(fromCache);
                        this.refreshCrowdMatrixCampaignMeta(id);
                        return fromCache;
                    }
                    return '';
                }
                this.cacheCrowdCampaignItemId(id, normalized);
                syncSelectedItemIfNeeded(normalized);
                this.refreshCrowdMatrixCampaignMeta(id);
                return normalized;
            } catch (err) {
                if (fromCache && allowCacheFallback) {
                    this.cacheCrowdCampaignItemId(id, fromCache);
                    syncSelectedItemIfNeeded(fromCache);
                    this.refreshCrowdMatrixCampaignMeta(id);
                    Logger.warn(`🔮 商品ID识别失败，使用缓存兜底：${err?.message || '未知错误'}`);
                    return fromCache;
                }
                Logger.warn(`🔮 商品ID识别失败：${err?.message || '未知错误'}`);
                return '';
            }
        },

        buildMetricPrompt({ campaignId, metricType, itemId = '' }) {
            const id = String(campaignId || '').trim();
            const item = String(itemId || '').trim();
            const metric = this.normalizeCrowdMetricType(metricType);
            if (!/^\d{6,}$/.test(id) || !metric) return '';
            if (metric === 'itemdeal') {
                if (!/^\d{6,}$/.test(item)) return '';
                return `商品ID：${item} 成交人群分析`;
            }
            return `计划ID：${id} ${this.getCrowdMetricMeta(metric).promptKeyword}`;
        },

        normalizeCrowdGroupName(groupName = '') {
            const name = String(groupName || '').trim();
            if (!name) return '';
            if (/城市等级/.test(name)) return '城市等级';
            if (/省份/.test(name)) return '省份';
            if (/^省$/.test(name)) return '省份';
            if (/城市/.test(name)) return '城市';
            if (/^市$/.test(name)) return '城市';
            if (/消费能力/.test(name)) return '消费能力等级';
            if (/月均消费/.test(name)) return '月均消费金额';
            if (/年龄/.test(name)) return '用户年龄';
            if (/性别/.test(name)) return '用户性别';
            if (/潜新老客|新老客/.test(name)) return '店铺潜新老客';
            return name;
        },

        mergeCrowdGroupMaps(...groupMaps) {
            const merged = {};
            groupMaps.forEach((groupMap) => {
                if (!groupMap || typeof groupMap !== 'object') return;
                Object.keys(groupMap).forEach((groupName) => {
                    const normalizedGroup = this.normalizeCrowdGroupName(groupName);
                    if (!normalizedGroup) return;
                    const detail = groupMap[groupName];
                    if (!detail || typeof detail !== 'object') return;
                    const currentDetail = merged[normalizedGroup] && typeof merged[normalizedGroup] === 'object'
                        ? merged[normalizedGroup]
                        : {};
                    const nextDetail = { ...currentDetail };
                    Object.keys(detail).forEach((label) => {
                        const normalizedLabel = String(label || '').trim();
                        if (!normalizedLabel) return;
                        nextDetail[normalizedLabel] = detail[label];
                    });
                    merged[normalizedGroup] = nextDetail;
                });
            });
            return merged;
        },

        buildCrowdDimensionPrompt({ campaignId, metricType, groupName, itemId = '' }) {
            const id = String(campaignId || '').trim();
            const item = String(itemId || '').trim();
            const metric = this.normalizeCrowdMetricType(metricType);
            const normalizedGroup = this.normalizeCrowdGroupName(groupName);
            const isExtraGroup = Array.isArray(this.CROWD_EXTRA_DIMENSION_GROUPS)
                && this.CROWD_EXTRA_DIMENSION_GROUPS.includes(normalizedGroup);
            if (!isExtraGroup) {
                return this.buildMetricPrompt({ campaignId: id, metricType: metric, itemId: item });
            }
            if (!/^\d{6,}$/.test(id) || !metric) return '';
            const crowdLabelMap = {
                click: '点击人群',
                cart: '加购人群',
                deal: '成交人群',
                itemdeal: '成交人群'
            };
            const crowdLabel = crowdLabelMap[metric] || '人群';
            if (metric === 'itemdeal') {
                if (!/^\d{6,}$/.test(item)) return '';
                return `商品ID：${item}，${crowdLabel}在各个${normalizedGroup}的花费，再使用占比工具进行占比分析`;
            }
            return `计划ID：${id}，${crowdLabel}在各个${normalizedGroup}的花费，再使用占比工具进行占比分析`;
        },

        buildCrowdPeriodPrompt(promptText = '', periodDays = 7) {
            const prompt = String(promptText || '').replace(/过去\s*\d+\s*天/g, '').trim();
            const days = Number(periodDays);
            if (!prompt || !Number.isFinite(days) || days <= 0) return prompt;
            return `${prompt} 过去${days}天`;
        },

        buildCrowdPanelTimeMode(timeModeValue = '', periodDays = 7) {
            const days = Number(periodDays);
            const periodText = Number.isFinite(days) && days > 0 ? `过去${days}天` : '过去7天';
            const fallback = JSON.stringify({
                timeInfo: periodText,
                timeMode: 'slidedTime'
            });

            const syncNodeTimeInfo = (node) => {
                if (!node || typeof node !== 'object') return;
                if (Object.prototype.hasOwnProperty.call(node, 'timeInfo')) {
                    node.timeInfo = periodText;
                }
                if (Array.isArray(node.period)) {
                    node.period = node.period.map((item) => {
                        if (item && typeof item === 'object') {
                            return {
                                ...item,
                                timeInfo: periodText
                            };
                        }
                        return { timeInfo: periodText };
                    });
                }
                Object.keys(node).forEach((key) => {
                    const value = node[key];
                    if (!value || typeof value !== 'object') return;
                    syncNodeTimeInfo(value);
                });
            };

            let normalized = timeModeValue;
            if (normalized && typeof normalized === 'object') {
                try {
                    normalized = JSON.stringify(normalized);
                } catch {
                    normalized = '';
                }
            }
            const text = String(normalized || '').trim();
            if (!text) return fallback;

            try {
                const parsed = JSON.parse(text);
                if (parsed && typeof parsed === 'object') {
                    const cloned = JSON.parse(JSON.stringify(parsed));
                    syncNodeTimeInfo(cloned);
                    const rootMode = String(cloned.timeMode || '').trim();
                    if (!rootMode || rootMode === 'noTimeMode') {
                        cloned.timeMode = 'slidedTime';
                    }
                    if (!String(cloned.timeInfo || '').trim()) {
                        cloned.timeInfo = periodText;
                    }
                    if (!Array.isArray(cloned.period) || !cloned.period.length) {
                        cloned.period = [{ timeInfo: periodText }];
                    }
                    return JSON.stringify(cloned);
                }
            } catch { }

            const replaced = text.replace(/过去\s*\d+\s*天/g, periodText);
            if (replaced !== text) return replaced;
            return fallback;
        },

        parseCrowdPlanDate(value = '') {
            const match = String(value || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!match) return null;
            const year = Number(match[1]);
            const month = Number(match[2]);
            const day = Number(match[3]);
            if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
            const date = new Date(Date.UTC(year, month - 1, day));
            if (
                date.getUTCFullYear() !== year
                || date.getUTCMonth() + 1 !== month
                || date.getUTCDate() !== day
            ) {
                return null;
            }
            return date;
        },

        formatCrowdPlanDate(date) {
            if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },

        buildCrowdPanelQueryExecutePlan(queryExecutePlanValue = '', periodDays = 7) {
            const source = String(queryExecutePlanValue || '').trim();
            const days = Number(periodDays);
            if (!source) return '';
            if (!Number.isFinite(days) || days <= 0) return source;
            const normalizedDays = Math.max(1, Math.floor(days));
            const periodText = `过去${normalizedDays}天`;
            const MAX_PLAN_STRING_DEPTH = 3;

            const rewriteDateWindow = (startTime = '', endTime = '') => {
                const endDate = this.parseCrowdPlanDate(endTime);
                if (!endDate) {
                    return {
                        startTime: String(startTime || ''),
                        endTime: String(endTime || ''),
                        changed: false
                    };
                }
                const nextStartDate = new Date(endDate.getTime());
                nextStartDate.setUTCDate(nextStartDate.getUTCDate() - (normalizedDays - 1));
                const nextStart = this.formatCrowdPlanDate(nextStartDate);
                const nextEnd = this.formatCrowdPlanDate(endDate);
                const prevStart = String(startTime || '').trim();
                const prevEnd = String(endTime || '').trim();
                const changed = prevStart !== nextStart || prevEnd !== nextEnd;
                return {
                    startTime: nextStart,
                    endTime: nextEnd,
                    changed
                };
            };

            const decodeBase64Text = (text = '') => {
                const sourceText = String(text || '');
                if (!sourceText) return '';
                try {
                    const binary = atob(sourceText);
                    if (typeof TextDecoder === 'function') {
                        const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
                        return new TextDecoder('utf-8').decode(bytes);
                    }
                    return binary;
                } catch {
                    return '';
                }
            };

            const encodeBase64Text = (text = '') => {
                const sourceText = String(text || '');
                try {
                    if (typeof TextEncoder === 'function') {
                        const bytes = new TextEncoder().encode(sourceText);
                        let binary = '';
                        bytes.forEach((byte) => {
                            binary += String.fromCharCode(byte);
                        });
                        return btoa(binary);
                    }
                } catch { }
                try {
                    return btoa(unescape(encodeURIComponent(sourceText)));
                } catch {
                    return '';
                }
            };

            const rewritePlanObject = (planObject, depth = 0) => {
                let changed = false;
                const rewritePlanString = (value = '', depth = 0) => {
                    const text = String(value || '');
                    if (!text || depth >= MAX_PLAN_STRING_DEPTH) {
                        return {
                            value: text,
                            changed: false
                        };
                    }
                    const directParsed = tryParseJson(text);
                    if (directParsed && typeof directParsed === 'object') {
                        const copied = JSON.parse(JSON.stringify(directParsed));
                        if (!rewritePlanObject(copied, depth + 1)) {
                            return {
                                value: text,
                                changed: false
                            };
                        }
                        try {
                            return {
                                value: JSON.stringify(copied),
                                changed: true
                            };
                        } catch {
                            return {
                                value: text,
                                changed: false
                            };
                        }
                    }
                    const base64Result = tryParseBase64Json(text);
                    if (base64Result) {
                        const copied = JSON.parse(JSON.stringify(base64Result.parsed));
                        if (!rewritePlanObject(copied, depth + 1)) {
                            return {
                                value: text,
                                changed: false
                            };
                        }
                        try {
                            const encoded = encodeBase64Text(JSON.stringify(copied));
                            if (!encoded) {
                                return {
                                    value: text,
                                    changed: false
                                };
                            }
                            return {
                                value: encoded,
                                changed: true
                            };
                        } catch {
                            return {
                                value: text,
                                changed: false
                            };
                        }
                    }
                    return {
                        value: text,
                        changed: false
                    };
                };

                const visit = (node, currentDepth = depth) => {
                    if (!node || typeof node !== 'object') return;
                    if (!Array.isArray(node)) {
                        if (typeof node.query === 'string') {
                            const nextQuery = this.buildCrowdPeriodPrompt(node.query, normalizedDays);
                            if (nextQuery && nextQuery !== node.query) {
                                node.query = nextQuery;
                                changed = true;
                            }
                        }
                        if (typeof node.timeInfo === 'string' && node.timeInfo !== periodText) {
                            node.timeInfo = periodText;
                            changed = true;
                        }
                        const hasStartTime = Object.prototype.hasOwnProperty.call(node, 'startTime');
                        const hasEndTime = Object.prototype.hasOwnProperty.call(node, 'endTime');
                        if (hasStartTime && hasEndTime) {
                            const rewritten = rewriteDateWindow(node.startTime, node.endTime);
                            if (rewritten.changed) {
                                node.startTime = rewritten.startTime;
                                node.endTime = rewritten.endTime;
                                changed = true;
                            }
                        }
                    }
                    Object.keys(node).forEach((key) => {
                        const value = node[key];
                        if (!value) return;
                        if (typeof value === 'object') {
                            visit(value, currentDepth);
                            return;
                        }
                        if (typeof value !== 'string') return;
                        const rewritten = rewritePlanString(value, currentDepth);
                        if (!rewritten.changed) return;
                        node[key] = rewritten.value;
                        changed = true;
                    });
                };
                visit(planObject, depth);
                return changed;
            };

            const tryParseJson = (text) => {
                try {
                    return JSON.parse(text);
                } catch {
                    return null;
                }
            };

            const tryParseBase64Json = (text) => {
                const decoded = decodeBase64Text(text);
                if (!decoded) return null;
                const parsed = tryParseJson(decoded);
                if (!parsed || typeof parsed !== 'object') return null;
                return { decoded, parsed };
            };

            const directParsed = tryParseJson(source);
            if (directParsed && typeof directParsed === 'object') {
                const copied = JSON.parse(JSON.stringify(directParsed));
                if (!rewritePlanObject(copied)) return source;
                try {
                    return JSON.stringify(copied);
                } catch {
                    return source;
                }
            }

            const base64Result = tryParseBase64Json(source);
            if (base64Result) {
                const copied = JSON.parse(JSON.stringify(base64Result.parsed));
                if (!rewritePlanObject(copied)) return source;
                try {
                    const encoded = encodeBase64Text(JSON.stringify(copied));
                    if (!encoded) return source;
                    return encoded;
                } catch {
                    return source;
                }
            }
            return source;
        },

        parseSseEvents(rawText) {
            const text = String(rawText || '');
            if (!text) return [];
            const chunks = [];
            text.split(/\r?\n/).forEach((line) => {
                const trimmed = String(line || '').trim();
                if (!trimmed.startsWith('data:')) return;
                const payload = trimmed.slice(5).trim();
                if (!payload) return;
                try {
                    chunks.push(JSON.parse(payload));
                } catch { }
            });
            return chunks;
        },

        parseCrowdRequestBody(rawBody) {
            if (rawBody === null || rawBody === undefined) return null;
            if (typeof rawBody === 'object') return rawBody;
            const text = String(rawBody || '').trim();
            if (!text) return null;
            try {
                return JSON.parse(text);
            } catch { }
            try {
                const params = new URLSearchParams(text);
                const out = {};
                for (const [key, value] of params.entries()) {
                    out[key] = value;
                }
                return Object.keys(out).length ? out : null;
            } catch {
                return null;
            }
        },

        resolveCrowdAuthParams() {
            const out = {
                bizCode: 'universalBP',
                dynamicToken: '',
                csrfID: '',
                loginPointId: ''
            };
            const manager = window.__AM_HOOK_MANAGER__;
            if (manager && typeof manager.getRequestHistory === 'function') {
                let list = [];
                try {
                    list = manager.getRequestHistory({
                        includePattern: /\/ai\/report\//i,
                        limit: 400
                    });
                } catch {
                    list = [];
                }
                for (let i = list.length - 1; i >= 0; i--) {
                    const item = list[i] || {};
                    const body = this.parseCrowdRequestBody(item.body);
                    if (body && typeof body === 'object') {
                        if (!out.dynamicToken && body.dynamicToken) out.dynamicToken = String(body.dynamicToken || '').trim();
                        if (!out.csrfID && (body.csrfID || body.csrfId)) out.csrfID = String(body.csrfID || body.csrfId || '').trim();
                        if (!out.loginPointId && body.loginPointId) out.loginPointId = String(body.loginPointId || '').trim();
                        if (body.bizCode) out.bizCode = String(body.bizCode || '').trim() || out.bizCode;
                    }
                    const rawUrl = String(item.url || '').trim();
                    if (!rawUrl) continue;
                    try {
                        const parsed = new URL(rawUrl, window.location.origin);
                        if (!out.dynamicToken) out.dynamicToken = String(parsed.searchParams.get('dynamicToken') || '').trim();
                        if (!out.csrfID) out.csrfID = String(parsed.searchParams.get('csrfID') || parsed.searchParams.get('csrfId') || '').trim();
                        if (!out.loginPointId) out.loginPointId = String(parsed.searchParams.get('loginPointId') || '').trim();
                        const bizCode = String(parsed.searchParams.get('bizCode') || '').trim();
                        if (bizCode) out.bizCode = bizCode;
                    } catch { }
                    if (out.dynamicToken && out.csrfID && out.loginPointId) break;
                }
            }
            return out;
        },

        buildCrowdApiUrl(path = '') {
            const normalizedPath = String(path || '').trim();
            if (!normalizedPath) return '';
            if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
            const nextPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
            return `${this.CROWD_API_HOST}${nextPath}`;
        },

        sleep(ms = 0) {
            const delay = Math.max(0, Number(ms) || 0);
            if (!delay) return Promise.resolve();
            return new Promise(resolve => setTimeout(resolve, delay));
        },

        async acquireCrowdRequestSlot() {
            const baseGap = Math.max(0, Number(this.CROWD_REQUEST_THROTTLE_MS) || 0);
            const jitterMax = Math.max(0, Number(this.CROWD_REQUEST_JITTER_MS) || 0);
            if (baseGap <= 0 && jitterMax <= 0) return;

            if (!this.crowdRequestSlotPromise) this.crowdRequestSlotPromise = Promise.resolve();
            const slotTask = this.crowdRequestSlotPromise.then(async () => {
                const now = Date.now();
                const waitByGap = Math.max(0, (this.crowdRequestLastAt || 0) + baseGap - now);
                const jitter = jitterMax > 0 ? Math.floor(Math.random() * (jitterMax + 1)) : 0;
                const waitMs = waitByGap + jitter;
                if (waitMs > 0) await this.sleep(waitMs);
                this.crowdRequestLastAt = Date.now();
            });
            this.crowdRequestSlotPromise = slotTask.catch(() => { });
            await slotTask;
        },

        extractCrowdApiErrorMessage(payload) {
            if (!payload || typeof payload !== 'object') return '';
            const status = payload.status;
            const code = payload.code;
            const success = payload.success;
            const msg = String(
                payload.msg
                || payload.message
                || payload.errorMsg
                || payload.errorMessage
                || ''
            ).trim();
            const normalizedCode = String(code ?? '').trim().toUpperCase();
            const hasStatusError = status !== undefined && Number(status) === 0;
            const hasCodeError = normalizedCode && !['0', '200', 'OK', 'SUCCESS'].includes(normalizedCode);
            const hasSuccessError = success === false;
            if (hasStatusError || hasCodeError || hasSuccessError) {
                if (msg) return msg;
                return `系统异常，请稍后重试。status=${status ?? code ?? 'unknown'}`;
            }
            return '';
        },

        shouldRetryCrowdApiError(error) {
            const message = String(error?.message || error || '').toLowerCase();
            if (!message) return true;
            if (/abort|canceled|cancelled/.test(message)) return false;
            return /(status\s*=\s*0|系统异常|稍后重试|too\s*many|rate\s*limit|请求失败\(429\)|请求失败\(5\d{2}\)|network|failed to fetch|fetch failed|timeout|gateway|频繁)/i.test(message);
        },

        getCrowdRetryDelay(attempt = 1) {
            const safeAttempt = Math.max(1, Number(attempt) || 1);
            const base = Math.max(100, Number(this.CROWD_REQUEST_RETRY_BASE_MS) || 700);
            const max = Math.max(base, Number(this.CROWD_REQUEST_RETRY_MAX_MS) || 3200);
            const expDelay = Math.min(max, base * (2 ** (safeAttempt - 1)));
            const jitter = Math.floor(Math.random() * 220);
            return expDelay + jitter;
        },

        async requestCrowdApi(path, payload = {}, options = {}) {
            const url = this.buildCrowdApiUrl(path);
            if (!url) throw new Error('请求地址为空');
            const maxAttempts = Math.max(1, Number(options.maxAttempts || this.CROWD_REQUEST_MAX_ATTEMPTS) || 1);
            let lastError = null;

            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    await this.acquireCrowdRequestSlot();
                    const auth = this.resolveCrowdAuthParams();
                    const body = {
                        bizCode: auth.bizCode || 'universalBP',
                        timeStr: Date.now(),
                        ...payload
                    };
                    if (auth.dynamicToken && !body.dynamicToken) body.dynamicToken = auth.dynamicToken;
                    if (!Object.prototype.hasOwnProperty.call(body, 'csrfID')) body.csrfID = auth.csrfID || '';
                    if (auth.loginPointId && !body.loginPointId) body.loginPointId = auth.loginPointId;

                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json, text/event-stream, */*'
                        },
                        credentials: 'include',
                        body: JSON.stringify(body),
                        signal: options.signal
                    });
                    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
                    const rawText = await response.text();
                    if (!response.ok) {
                        throw new Error(`请求失败(${response.status}): ${rawText.slice(0, 160)}`);
                    }

                    if (contentType.includes('text/event-stream')) {
                        const chunks = this.parseSseEvents(rawText);
                        if (!chunks.length) throw new Error('SSE 响应为空');
                        const eventPayload = chunks[chunks.length - 1];
                        const bizError = this.extractCrowdApiErrorMessage(eventPayload);
                        if (bizError) throw new Error(bizError);
                        return {
                            payload: eventPayload,
                            isStream: true,
                            chunks,
                            rawText,
                            requestPath: path
                        };
                    }

                    try {
                        const jsonPayload = JSON.parse(rawText);
                        const bizError = this.extractCrowdApiErrorMessage(jsonPayload);
                        if (bizError) throw new Error(bizError);
                        return {
                            payload: jsonPayload,
                            isStream: false,
                            chunks: [],
                            rawText,
                            requestPath: path
                        };
                    } catch (jsonErr) {
                        if (!/Unexpected token|JSON/i.test(String(jsonErr?.message || ''))) throw jsonErr;
                        const chunks = this.parseSseEvents(rawText);
                        if (!chunks.length) throw new Error(`解析响应失败: ${rawText.slice(0, 120)}`);
                        const eventPayload = chunks[chunks.length - 1];
                        const bizError = this.extractCrowdApiErrorMessage(eventPayload);
                        if (bizError) throw new Error(bizError);
                        return {
                            payload: eventPayload,
                            isStream: true,
                            chunks,
                            rawText,
                            requestPath: path
                        };
                    }
                } catch (error) {
                    lastError = error;
                    const canRetry = attempt < maxAttempts && this.shouldRetryCrowdApiError(error);
                    if (!canRetry) throw error;
                    const delayMs = this.getCrowdRetryDelay(attempt);
                    Logger.warn(`🔮 人群看板请求重试(${attempt}/${maxAttempts - 1})：${String(error?.message || error || '未知错误').slice(0, 120)}`);
                    await this.sleep(delayMs);
                }
            }

            throw lastError || new Error('人群看板请求失败');
        },

        toNumericValue(rawValue) {
            const text = String(rawValue ?? '').trim();
            if (!text) return 0;
            const match = text.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
            if (!match) return 0;
            const num = Number(match[0]);
            return Number.isFinite(num) ? num : 0;
        },

        extractPanelQueryConfFromDataQuery(componentList) {
            const list = Array.isArray(componentList) ? componentList.slice() : [];
            let title = '';
            let queryExecutePlan = '';
            let timeMode = '';
            const visited = new WeakSet();
            const readText = (value) => String(value || '').trim();
            while (list.length) {
                const component = list.shift();
                if (!component || typeof component !== 'object') continue;
                if (visited.has(component)) continue;
                visited.add(component);

                const type = String(component?.componentType || component?.type || '').trim();
                const properties = component?.properties && typeof component.properties === 'object'
                    ? component.properties
                    : {};
                if (type === 'QUERY_TITLE' && !title) {
                    title = String(
                        component?.subComponentList?.[0]?.properties?.title
                        || properties?.title
                        || component?.title
                        || ''
                    ).trim();
                }
                if (!queryExecutePlan && (type === 'ADDITION' || properties?.queryExecutePlan || component?.queryExecutePlan || component?.queryConf?.queryExecutePlan)) {
                    queryExecutePlan = readText(
                        properties?.queryExecutePlan
                        || component?.queryExecutePlan
                        || component?.queryConf?.queryExecutePlan
                        || ''
                    );
                }
                if (!timeMode && (type === 'ADDITION' || properties?.timeMode || component?.timeMode || component?.queryConf?.timeMode)) {
                    const rawTimeMode = properties?.timeMode
                        ?? component?.timeMode
                        ?? component?.queryConf?.timeMode
                        ?? '';
                    if (rawTimeMode && typeof rawTimeMode === 'object') {
                        try {
                            timeMode = JSON.stringify(rawTimeMode);
                        } catch {
                            timeMode = '';
                        }
                    } else {
                        timeMode = readText(rawTimeMode);
                    }
                }

                const childBuckets = [
                    component?.subComponentList,
                    component?.componentList,
                    component?.children,
                    properties?.subComponentList,
                    properties?.componentList
                ];
                childBuckets.forEach((bucket) => {
                    if (!Array.isArray(bucket) || !bucket.length) return;
                    list.push(...bucket);
                });
            }
            if (!queryExecutePlan) {
                throw new Error('未获取到周期切换所需 queryExecutePlan');
            }
            return {
                title,
                queryExecutePlan,
                timeMode
            };
        },

        extractCrowdUnsupportedReason(componentList) {
            let serialized = '';
            try {
                serialized = JSON.stringify(Array.isArray(componentList) ? componentList : []);
            } catch {
                serialized = '';
            }
            if (!serialized) return '';
            if (/商品所属店铺与当前店铺不一致|不支持查询其[它他]店铺商品的人群画像/.test(serialized)) {
                return '商品成交人群暂不可用（跨店商品）';
            }
            return '';
        },

        extractGroupList(componentList, fallbackGroupName = '') {
            const list = Array.isArray(componentList) ? componentList : [];
            const chartGroup = list.find((item) => String(item?.componentType || item?.type || '').trim() === 'CHART_GROUP');
            const normalizedFallbackGroup = this.normalizeCrowdGroupName(fallbackGroupName);
            if (!chartGroup) {
                const queue = list.slice();
                const visited = new Set();
                const fallbackGroups = [];
                const normalizeLabel = (value) => String(value || '').trim();
                while (queue.length) {
                    const current = queue.shift();
                    if (!current || typeof current !== 'object') continue;
                    if (visited.has(current)) continue;
                    visited.add(current);
                    const chartData = Array.isArray(current?.chartData) && current.chartData.length
                        ? current.chartData
                        : (Array.isArray(current?.properties?.chartData) && current.properties.chartData.length
                            ? current.properties.chartData
                            : []);
                    if (chartData.length) {
                        let groupName = normalizedFallbackGroup;
                        if (!groupName) {
                            groupName = this.normalizeCrowdGroupName(
                                current?.groupName
                                || current?.properties?.groupName
                                || current?.properties?.title
                                || current?.title
                                || current?.properties?.subTitle
                                || current?.subTitle
                                || ''
                            );
                        }
                        if (!groupName) {
                            const labels = chartData
                                .map(item => normalizeLabel(item?.x))
                                .filter(Boolean);
                            if (labels.length) {
                                const provinceLike = labels.filter(label => /省|自治区|特别行政区|香港|澳门/.test(label)).length;
                                const cityLike = labels.filter(label => /(市|州|盟)$/.test(label)).length;
                                if (provinceLike > 0 && provinceLike >= cityLike) {
                                    groupName = '省份';
                                } else if (cityLike > 0) {
                                    groupName = '城市';
                                }
                            }
                        }
                        if (groupName) {
                            fallbackGroups.push({
                                groupName,
                                componentList: [{ chartData }]
                            });
                        }
                    }
                    const childBuckets = [
                        current?.subComponentList,
                        current?.componentList,
                        current?.children,
                        current?.properties?.subComponentList,
                        current?.properties?.componentList
                    ];
                    childBuckets.forEach((bucket) => {
                        if (!Array.isArray(bucket) || !bucket.length) return;
                        bucket.forEach((item) => queue.push(item));
                    });
                }
                return fallbackGroups;
            }
            const queue = [chartGroup];
            const visited = new Set();
            while (queue.length) {
                const current = queue.shift();
                if (!current || typeof current !== 'object') continue;
                if (visited.has(current)) continue;
                visited.add(current);
                if (Array.isArray(current.groupList) && current.groupList.length) return current.groupList;
                if (Array.isArray(current?.properties?.groupList) && current.properties.groupList.length) return current.properties.groupList;
                if (Array.isArray(current.subComponentList) && current.subComponentList.length) {
                    current.subComponentList.forEach((item) => queue.push(item));
                }
            }
            return [];
        },

        buildGroupMapFromGroupList(groupList, fallbackGroupName = '') {
            const map = {};
            const normalizedFallbackGroup = this.normalizeCrowdGroupName(fallbackGroupName);
            (Array.isArray(groupList) ? groupList : []).forEach((group) => {
                const chartData = Array.isArray(group?.componentList?.[0]?.chartData)
                    ? group.componentList[0].chartData
                    : [];
                let groupName = this.normalizeCrowdGroupName(group?.groupName || '');
                if (!groupName) {
                    groupName = normalizedFallbackGroup;
                }
                if (!groupName && chartData.length) {
                    const labels = chartData
                        .map(item => String(item?.x || '').trim())
                        .filter(Boolean);
                    const provinceLike = labels.filter(label => /省|自治区|特别行政区|香港|澳门/.test(label)).length;
                    const cityLike = labels.filter(label => /(市|州|盟)$/.test(label)).length;
                    if (provinceLike > 0 && provinceLike >= cityLike) {
                        groupName = '省份';
                    } else if (cityLike > 0) {
                        groupName = '城市';
                    }
                }
                if (!groupName) return;
                const valueMap = {};
                chartData.forEach((item) => {
                    const label = String(item?.x || '').trim();
                    if (!label) return;
                    const rawValue = item?.y;
                    valueMap[label] = {
                        value: this.toNumericValue(rawValue),
                        raw: String(rawValue ?? '')
                    };
                });
                const currentGroupMap = map[groupName] && typeof map[groupName] === 'object'
                    ? map[groupName]
                    : {};
                map[groupName] = {
                    ...currentGroupMap,
                    ...valueMap
                };
            });
            return map;
        },

        async queryPanelPeriod({ title, queryExecutePlan, timeMode, periodDays, fallbackGroupName = '' }) {
            const days = Number(periodDays);
            if (!this.CROWD_PERIODS.includes(days)) {
                throw new Error(`不支持的周期: ${periodDays}`);
            }
            const periodText = `过去${days}天`;
            const normalizedTitle = this.buildCrowdPeriodPrompt(String(title || '').trim(), days);
            const normalizedTimeMode = this.buildCrowdPanelTimeMode(timeMode, days);
            const normalizedQueryExecutePlan = this.buildCrowdPanelQueryExecutePlan(queryExecutePlan, days);
            const payload = {
                title: normalizedTitle,
                needTitle: false,
                queryConf: {
                    period: [{ timeInfo: periodText }],
                    queryExecutePlan: String(normalizedQueryExecutePlan || '').trim(),
                    timeMode: normalizedTimeMode,
                    timeInfo: periodText
                }
            };
            const response = await this.requestCrowdApi('/ai/report/panelDataQuery.json', payload);
            const componentList = Array.isArray(response?.payload?.data?.componentList)
                ? response.payload.data.componentList
                : [];
            return {
                componentList,
                groupList: this.extractGroupList(componentList, fallbackGroupName),
                rawPayload: response.payload,
                requestPath: response.requestPath
            };
        },

        ensureCrowdInsightContext(campaignId) {
            const id = String(campaignId || '').trim();
            if (!this.crowdInsightRunContext || this.crowdInsightRunContext.campaignId !== id) {
                this.crowdInsightRunContext = {
                    campaignId: id,
                    basePromiseMap: new Map()
                };
            }
            return this.crowdInsightRunContext;
        },

        async queryCrowdInsight({ campaignId, metricType, periodDays }) {
            const id = String(campaignId || '').trim();
            const metric = this.normalizeCrowdMetricType(metricType);
            const days = Number(periodDays);
            if (!/^\d{6,}$/.test(id)) throw new Error('计划ID无效');
            if (!metric) throw new Error(`不支持的指标: ${metricType}`);
            if (!this.CROWD_PERIODS.includes(days)) throw new Error(`不支持的周期: ${periodDays}`);

            const context = this.ensureCrowdInsightContext(id);
            if (!context.basePromiseMap.has(metric)) {
                context.basePromiseMap.set(metric, (async () => {
                    const queryBaseByPrompt = async (promptText = '') => {
                        const response = await this.requestCrowdApi('/ai/report/dataQuery.json', {
                            bizCode: 'universalBP',
                            contentParams: { bizCode: 'universalBP' },
                            prompt: {
                                promptType: 'text',
                                wordList: [{
                                    word: promptText,
                                    wordType: 'text',
                                    subjectId: null,
                                    subjectType: null,
                                    isTemplate: false,
                                    placeholder: ''
                                }]
                            }
                        });
                        const componentList = Array.isArray(response?.payload?.data?.componentList)
                            ? response.payload.data.componentList
                            : [];
                        const unsupportedReason = metric === 'itemdeal'
                            ? this.extractCrowdUnsupportedReason(componentList)
                            : '';
                        if (unsupportedReason) {
                            return {
                                componentList,
                                groupMap: {},
                                panelQueryConf: null,
                                requestPath: response.requestPath,
                                unsupportedReason
                            };
                        }
                        const groupList = this.extractGroupList(componentList);
                        return {
                            componentList,
                            groupMap: this.buildGroupMapFromGroupList(groupList),
                            panelQueryConf: this.extractPanelQueryConfFromDataQuery(componentList),
                            requestPath: response.requestPath,
                            unsupportedReason: ''
                        };
                    };
                    const queryItemDealByCandidate = async (seedItemId = '', options = {}) => {
                        const lockedItemId = PlanIdentityUtils.normalizeItemId(options?.lockedItemId || '');
                        const candidates = lockedItemId
                            ? [lockedItemId]
                            : this.getCrowdCampaignItemCandidates(id, seedItemId);
                        if (!candidates.length) return null;
                        const unsupportedResults = [];
                        let lastQueryExecutePlanError = null;
                        const maxTryCount = Math.min(12, candidates.length);
                        for (let i = 0; i < maxTryCount; i++) {
                            const candidateItemId = PlanIdentityUtils.normalizeItemId(candidates[i] || '');
                            if (!candidateItemId) continue;
                            const candidatePrompt = this.buildMetricPrompt({
                                campaignId: id,
                                metricType: metric,
                                itemId: candidateItemId
                            });
                            if (!candidatePrompt) continue;
                            try {
                                const candidateResult = await queryBaseByPrompt(candidatePrompt);
                                if (candidateResult?.unsupportedReason) {
                                    unsupportedResults.push({
                                        itemId: candidateItemId,
                                        prompt: candidatePrompt,
                                        baseQueryResult: candidateResult
                                    });
                                    continue;
                                }
                                this.cacheCrowdCampaignItemId(id, candidateItemId);
                                if (options?.allowAutoPick === true) {
                                    this.setCrowdCampaignSelectedItemId(id, candidateItemId, { manual: false });
                                }
                                return {
                                    itemId: candidateItemId,
                                    prompt: candidatePrompt,
                                    baseQueryResult: candidateResult
                                };
                            } catch (err) {
                                const message = String(err?.message || '');
                                if (/queryExecutePlan/.test(message)) {
                                    lastQueryExecutePlanError = err;
                                    continue;
                                }
                                throw err;
                            }
                        }
                        if (unsupportedResults.length) {
                            return unsupportedResults[0];
                        }
                        if (lastQueryExecutePlanError) {
                            throw lastQueryExecutePlanError;
                        }
                        return null;
                    };

                    let itemId = '';
                    const selectedItemId = this.getCrowdCampaignSelectedItemId(id);
                    const lockToSelectedItem = metric === 'itemdeal'
                        && this.isCrowdCampaignItemManuallySelected(id)
                        && /^\d{6,}$/.test(selectedItemId);
                    if (metric === 'itemdeal') {
                        itemId = /^\d{6,}$/.test(selectedItemId)
                            ? selectedItemId
                            : await this.resolveCrowdItemIdByCampaign(id);
                        if (!/^\d{6,}$/.test(itemId)) {
                            throw new Error(`未识别到计划 ${id} 对应商品ID`);
                        }
                    }

                    let prompt = this.buildMetricPrompt({ campaignId: id, metricType: metric, itemId });
                    if (!prompt) throw new Error('构造人群查询话术失败');

                    let baseQueryResult = null;
                    try {
                        if (metric === 'itemdeal') {
                            const resolvedByCandidates = await queryItemDealByCandidate(itemId, {
                                lockedItemId: lockToSelectedItem ? selectedItemId : '',
                                allowAutoPick: !lockToSelectedItem
                            });
                            if (resolvedByCandidates) {
                                itemId = resolvedByCandidates.itemId;
                                prompt = resolvedByCandidates.prompt;
                                baseQueryResult = resolvedByCandidates.baseQueryResult;
                            } else {
                                throw new Error(`未识别到计划 ${id} 对应可用商品ID`);
                            }
                        } else {
                            baseQueryResult = await queryBaseByPrompt(prompt);
                        }
                    } catch (err) {
                        const message = String(err?.message || '');
                        const shouldRetryByRefreshingItem = metric === 'itemdeal' && !lockToSelectedItem && /queryExecutePlan/.test(message);
                        if (!shouldRetryByRefreshingItem) throw err;

                        const refreshedItemId = await this.resolveCrowdItemIdByCampaign(id, {
                            preferCache: false,
                            allowCacheFallback: false
                        });
                        if (!/^\d{6,}$/.test(refreshedItemId) || refreshedItemId === itemId) {
                            throw err;
                        }

                        const refreshedPrompt = this.buildMetricPrompt({
                            campaignId: id,
                            metricType: metric,
                            itemId: refreshedItemId
                        });
                        if (!refreshedPrompt) throw err;

                        itemId = refreshedItemId;
                        prompt = refreshedPrompt;
                        if (metric === 'itemdeal') {
                            const refreshedByCandidates = await queryItemDealByCandidate(itemId, {
                                lockedItemId: '',
                                allowAutoPick: true
                            });
                            if (!refreshedByCandidates) throw err;
                            itemId = refreshedByCandidates.itemId;
                            prompt = refreshedByCandidates.prompt;
                            baseQueryResult = refreshedByCandidates.baseQueryResult;
                        } else {
                            baseQueryResult = await queryBaseByPrompt(prompt);
                        }
                    }

                    return {
                        prompt,
                        itemId,
                        componentList: baseQueryResult.componentList,
                        groupMap: baseQueryResult.groupMap,
                        scopeResultMap: {
                            base: {
                                prompt,
                                groupMap: baseQueryResult.groupMap,
                                panelQueryConf: baseQueryResult.panelQueryConf,
                                requestPath: baseQueryResult.requestPath,
                                resolved: true
                            }
                        },
                        panelQueryConf: baseQueryResult.panelQueryConf,
                        requestPath: baseQueryResult.requestPath,
                        unsupportedReason: String(baseQueryResult.unsupportedReason || '').trim()
                    };
                })());
            }

            const baseResult = await context.basePromiseMap.get(metric);
            if (!baseResult.unsupportedReason) {
                const scopeResultMap = baseResult.scopeResultMap && typeof baseResult.scopeResultMap === 'object'
                    ? baseResult.scopeResultMap
                    : {};
                const itemId = String(baseResult.itemId || '').trim();
                this.CROWD_EXTRA_DIMENSION_GROUPS.forEach((groupName) => {
                    const normalizedGroup = this.normalizeCrowdGroupName(groupName);
                    if (!normalizedGroup || scopeResultMap[normalizedGroup]) return;
                    const scopePrompt = this.buildCrowdDimensionPrompt({ campaignId: id, metricType: metric, groupName, itemId });
                    if (!scopePrompt || scopePrompt === baseResult.prompt) return;
                    scopeResultMap[normalizedGroup] = {
                        prompt: scopePrompt,
                        groupMap: {},
                        panelQueryConf: null,
                        requestPath: '',
                        resolved: false
                    };
                });
                const extraScopeKeys = Object.keys(scopeResultMap).filter(key => key !== 'base');
                await Promise.all(extraScopeKeys.map(async (scopeKey) => {
                    const scopeMeta = scopeResultMap[scopeKey];
                    if (scopeMeta?.resolved === true) return;
                    const scopePrompt = String(scopeMeta?.prompt || '').trim();
                    if (!scopePrompt) return;
                    try {
                        const scopeResult = await (async () => {
                            const response = await this.requestCrowdApi('/ai/report/dataQuery.json', {
                                bizCode: 'universalBP',
                                contentParams: { bizCode: 'universalBP' },
                                prompt: {
                                    promptType: 'text',
                                    wordList: [{
                                        word: scopePrompt,
                                        wordType: 'text',
                                        subjectId: null,
                                        subjectType: null,
                                        isTemplate: false,
                                        placeholder: ''
                                    }]
                                }
                            });
                            const componentList = Array.isArray(response?.payload?.data?.componentList)
                                ? response.payload.data.componentList
                                : [];
                            const groupList = this.extractGroupList(componentList, scopeKey);
                            let panelQueryConf = null;
                            try {
                                panelQueryConf = this.extractPanelQueryConfFromDataQuery(componentList);
                            } catch { }
                            return {
                                groupMap: this.buildGroupMapFromGroupList(groupList, scopeKey),
                                panelQueryConf,
                                requestPath: response.requestPath
                            };
                        })();
                        scopeResultMap[scopeKey] = {
                            ...scopeMeta,
                            groupMap: scopeResult.groupMap,
                            panelQueryConf: scopeResult.panelQueryConf,
                            requestPath: scopeResult.requestPath,
                            resolved: true
                        };
                    } catch (err) {
                        scopeResultMap[scopeKey] = {
                            ...scopeMeta,
                            resolved: true
                        };
                        Logger.warn(`🔮 ${scopeKey}维度查数失败：${err?.message || '未知错误'}`);
                    }
                }));
                const mergedGroupMap = this.mergeCrowdGroupMaps(
                    ...Object.values(scopeResultMap).map(item => item?.groupMap)
                );
                baseResult.scopeResultMap = scopeResultMap;
                baseResult.groupMap = mergedGroupMap;
            }
            if (days === 7) {
                return {
                    periodDays: days,
                    metricType: metric,
                    groupMap: baseResult.groupMap,
                    rawMeta: {
                        prompt: baseResult.prompt,
                        itemId: baseResult.itemId || '',
                        requestPath: baseResult.requestPath,
                        title: baseResult.panelQueryConf?.title || '',
                        queryExecutePlan: baseResult.panelQueryConf?.queryExecutePlan || '',
                        timeMode: baseResult.panelQueryConf?.timeMode || '',
                        unsupportedReason: baseResult.unsupportedReason || ''
                    }
                };
            }

            if (baseResult.unsupportedReason) {
                return {
                    periodDays: days,
                    metricType: metric,
                    groupMap: {},
                    rawMeta: {
                        prompt: baseResult.prompt,
                        itemId: baseResult.itemId || '',
                        requestPath: baseResult.requestPath,
                        title: '',
                        queryExecutePlan: '',
                        timeMode: '',
                        unsupportedReason: baseResult.unsupportedReason
                    }
                };
            }

            const scopeResultMap = baseResult.scopeResultMap && typeof baseResult.scopeResultMap === 'object'
                ? baseResult.scopeResultMap
                : {
                    base: {
                        prompt: baseResult.prompt,
                        groupMap: baseResult.groupMap,
                        panelQueryConf: baseResult.panelQueryConf,
                        requestPath: baseResult.requestPath
                    }
                };
            const scopeEntries = Object.entries(scopeResultMap);
            let panelRequestPath = '';
            let mergedPeriodGroupMap = {};
            const queryScopePeriod = async (scopeKey, scopeMeta) => {
                let localRequestPath = '';
                let mergedPeriodGroupMap = {};
                const panelQueryConf = scopeMeta?.panelQueryConf;
                if (!panelQueryConf || typeof panelQueryConf !== 'object') {
                    if (scopeKey === 'base') {
                        return {
                            scopeKey,
                            requestPath: '',
                            groupMap: {},
                            error: new Error('未获取到周期切换所需 queryExecutePlan')
                        };
                    }
                    const scopePrompt = this.buildCrowdPeriodPrompt(scopeMeta?.prompt || '', days);
                    if (!scopePrompt) {
                        return {
                            scopeKey,
                            requestPath: '',
                            groupMap: {},
                            error: null
                        };
                    }
                    try {
                        const scopeResponse = await this.requestCrowdApi('/ai/report/dataQuery.json', {
                            bizCode: 'universalBP',
                            contentParams: { bizCode: 'universalBP' },
                            prompt: {
                                promptType: 'text',
                                wordList: [{
                                    word: scopePrompt,
                                    wordType: 'text',
                                    subjectId: null,
                                    subjectType: null,
                                    isTemplate: false,
                                    placeholder: ''
                                }]
                            }
                        });
                        const scopeComponentList = Array.isArray(scopeResponse?.payload?.data?.componentList)
                            ? scopeResponse.payload.data.componentList
                            : [];
                        const scopeGroupList = this.extractGroupList(scopeComponentList, scopeKey);
                        const scopeGroupMap = this.buildGroupMapFromGroupList(scopeGroupList, scopeKey);
                        mergedPeriodGroupMap = this.mergeCrowdGroupMaps(mergedPeriodGroupMap, scopeGroupMap);
                        localRequestPath = String(scopeResponse.requestPath || '');
                        return {
                            scopeKey,
                            requestPath: localRequestPath,
                            groupMap: mergedPeriodGroupMap,
                            error: null
                        };
                    } catch (err) {
                        return {
                            scopeKey,
                            requestPath: '',
                            groupMap: {},
                            error: err
                        };
                    }
                }
                try {
                    const panelResult = await this.queryPanelPeriod({
                        title: panelQueryConf?.title || scopeMeta?.prompt || baseResult.prompt,
                        queryExecutePlan: panelQueryConf?.queryExecutePlan || '',
                        timeMode: panelQueryConf?.timeMode || '',
                        periodDays: days,
                        fallbackGroupName: scopeKey === 'base' ? '' : scopeKey
                    });
                    const panelGroupMap = this.buildGroupMapFromGroupList(panelResult.groupList, scopeKey === 'base' ? '' : scopeKey);
                    mergedPeriodGroupMap = this.mergeCrowdGroupMaps(mergedPeriodGroupMap, panelGroupMap);
                    localRequestPath = String(panelResult.requestPath || '');
                    return {
                        scopeKey,
                        requestPath: localRequestPath,
                        groupMap: mergedPeriodGroupMap,
                        error: null
                    };
                } catch (err) {
                    return {
                        scopeKey,
                        requestPath: '',
                        groupMap: {},
                        error: err
                    };
                }
            };
            const baseScopeMeta = scopeResultMap.base;
            if (!baseScopeMeta || typeof baseScopeMeta !== 'object') {
                throw new Error('未获取到周期切换所需 queryExecutePlan');
            }
            const baseScopeResult = await queryScopePeriod('base', baseScopeMeta);
            if (baseScopeResult?.error) {
                throw baseScopeResult.error;
            }
            mergedPeriodGroupMap = this.mergeCrowdGroupMaps(mergedPeriodGroupMap, baseScopeResult?.groupMap || {});
            if (!panelRequestPath && baseScopeResult?.requestPath) {
                panelRequestPath = String(baseScopeResult.requestPath || '');
            }
            const extraScopeEntries = scopeEntries.filter(([scopeKey]) => scopeKey !== 'base');
            const scopePeriodResults = await Promise.all(extraScopeEntries.map(([scopeKey, scopeMeta]) => {
                return queryScopePeriod(scopeKey, scopeMeta);
            }));
            scopePeriodResults.forEach((item) => {
                if (!item || typeof item !== 'object') return;
                const scopeKey = String(item.scopeKey || '').trim();
                if (!scopeKey) return;
                if (item.error) {
                    Logger.warn(`🔮 ${scopeKey}维度周期查数失败（过去${days}天）：${item.error?.message || '未知错误'}`);
                    return;
                }
                mergedPeriodGroupMap = this.mergeCrowdGroupMaps(mergedPeriodGroupMap, item.groupMap || {});
                if (!panelRequestPath && item.requestPath) {
                    panelRequestPath = String(item.requestPath || '');
                }
            });
            return {
                periodDays: days,
                metricType: metric,
                groupMap: mergedPeriodGroupMap,
                rawMeta: {
                    prompt: baseResult.prompt,
                    itemId: baseResult.itemId || '',
                    requestPath: panelRequestPath || baseResult.requestPath,
                    title: baseResult.panelQueryConf?.title || '',
                    queryExecutePlan: baseResult.panelQueryConf?.queryExecutePlan || '',
                    timeMode: baseResult.panelQueryConf?.timeMode || '',
                    unsupportedReason: ''
                }
            };
        },

        async runTasksWithConcurrency(taskFns = [], limit = 3) {
            const tasks = Array.isArray(taskFns) ? taskFns.filter(fn => typeof fn === 'function') : [];
            const normalizedLimit = Math.max(1, Number.isFinite(Number(limit)) ? Number(limit) : 1);
            const onProgress = typeof this.crowdMatrixTaskProgressHandler === 'function'
                ? this.crowdMatrixTaskProgressHandler
                : null;
            let doneCount = 0;
            const results = [];
            const executing = new Set();
            for (let i = 0; i < tasks.length; i++) {
                const taskFn = tasks[i];
                const taskLabel = String(taskFn?.__amCrowdTaskLabel || '').trim();
                const promise = Promise.resolve()
                    .then(() => taskFn())
                    .then((value) => {
                        doneCount += 1;
                        if (onProgress) {
                            try {
                                onProgress({
                                    done: doneCount,
                                    total: tasks.length,
                                    status: 'fulfilled',
                                    index: i,
                                    label: taskLabel,
                                    value
                                });
                            } catch { }
                        }
                        return value;
                    })
                    .catch((error) => {
                        doneCount += 1;
                        if (onProgress) {
                            try {
                                onProgress({
                                    done: doneCount,
                                    total: tasks.length,
                                    status: 'rejected',
                                    index: i,
                                    label: taskLabel,
                                    error
                                });
                            } catch { }
                        }
                        throw error;
                    });
                results.push(promise);
                executing.add(promise);
                const clean = () => executing.delete(promise);
                promise.then(clean, clean);
                if (executing.size >= normalizedLimit) {
                    await Promise.race(Array.from(executing).map(task => task.catch(() => null)));
                }
            }
            return Promise.allSettled(results);
        },

        buildMatrixDataset(results) {
            const periods = this.CROWD_PERIODS.slice();
            const groups = this.CROWD_GROUP_ORDER.slice();
            const metricOrder = this.CROWD_METRICS.slice();
            const cellData = {};

            periods.forEach((period) => {
                cellData[period] = {};
                groups.forEach((groupName) => {
                    const cell = {
                        labels: [],
                        noData: {}
                    };
                    metricOrder.forEach((metric) => {
                        cell[metric] = [];
                        cell[`${metric}Raw`] = [];
                        cell.noData[metric] = true;
                    });
                    cellData[period][groupName] = cell;
                });
            });

            const insightMap = new Map();
            (Array.isArray(results) ? results : []).forEach((item) => {
                if (!item || typeof item !== 'object') return;
                const period = Number(item.periodDays);
                const metric = this.normalizeCrowdMetricType(item.metricType);
                if (!periods.includes(period) || !metric) return;
                const groupMap = item.groupMap && typeof item.groupMap === 'object' ? item.groupMap : {};
                groups.forEach((groupName) => {
                    const groupDetail = groupMap[groupName];
                    if (!groupDetail || typeof groupDetail !== 'object') return;
                    insightMap.set(`${period}|${groupName}|${metric}`, groupDetail);
                });
            });

            groups.forEach((groupName) => {
                periods.forEach((period) => {
                    const labelList = [];
                    const labelSet = new Set();
                    metricOrder.forEach((metric) => {
                        const detail = insightMap.get(`${period}|${groupName}|${metric}`);
                        if (!detail || typeof detail !== 'object') return;
                        Object.keys(detail).forEach((label) => {
                            const normalized = String(label || '').trim();
                            if (!normalized || labelSet.has(normalized)) return;
                            labelSet.add(normalized);
                            labelList.push(normalized);
                        });
                    });

                    const nextCell = cellData[period][groupName];
                    nextCell.labels = labelList;

                    metricOrder.forEach((metric) => {
                        const detail = insightMap.get(`${period}|${groupName}|${metric}`);
                        const rawValues = labelList.map((label) => {
                            const current = detail && detail[label] ? detail[label] : null;
                            return this.toNumericValue(current?.value ?? current?.raw ?? 0);
                        });
                        const rawList = labelList.map((label) => {
                            const current = detail && detail[label] ? detail[label] : null;
                            return current?.raw ?? '';
                        });
                        const sum = rawValues.reduce((acc, value) => acc + this.toNumericValue(value), 0);
                        const ratioValues = rawValues.map((value) => {
                            if (sum <= 0) return 0;
                            return (this.toNumericValue(value) / sum) * 100;
                        });

                        nextCell[metric] = ratioValues;
                        nextCell[`${metric}Raw`] = rawList.length ? rawList : rawValues;
                        nextCell.noData[metric] = !labelList.length || sum <= 0;
                    });
                });
            });

            return {
                periods,
                groups,
                cellData
            };
        },

        formatCrowdPercent(value) {
            const num = this.toNumericValue(value);
            if (num <= 0) return '0%';
            const fixed = num.toFixed(2).replace(/\.?0+$/, '');
            return `${fixed}%`;
        },

        formatCrowdHoverPercent(value) {
            const num = this.toNumericValue(value);
            return `${num.toFixed(2)}%`;
        },

        formatCrowdPtDiff(value) {
            const num = this.toNumericValue(value);
            const sign = num >= 0 ? '+' : '-';
            return `${sign}${Math.abs(num).toFixed(2)}pt`;
        },

        formatCrowdRawValue(rawValue, fallbackValue) {
            const rawText = String(rawValue ?? '').trim();
            if (rawText) return rawText;
            const num = this.toNumericValue(fallbackValue);
            return Number.isInteger(num) ? String(num) : num.toFixed(2).replace(/\.?0+$/, '');
        },

        setCrowdMatrixStatus(text, level = 'info', options = {}) {
            if (!(this.matrixStateEl instanceof HTMLElement)) return;
            if (this.crowdMatrixStateHideTimer) {
                clearTimeout(this.crowdMatrixStateHideTimer);
                this.crowdMatrixStateHideTimer = null;
            }
            const normalizedLevel = ['info', 'success', 'warn', 'error', 'loading'].includes(level) ? level : 'info';
            this.matrixStateEl.className = `am-crowd-matrix-state is-${normalizedLevel}`;
            this.matrixStateEl.classList.remove('is-hidden');
            const rawText = String(text || '');
            const latestLine = rawText
                .split(/\r?\n/)
                .map(line => String(line || '').trim())
                .filter(Boolean)
                .pop() || rawText.trim();
            const hasProgress = Number.isFinite(Number(options.progress));
            const nextProgress = hasProgress ? Math.max(0, Math.min(100, Number(options.progress))) : 0;
            this.crowdMatrixProgress = nextProgress;
            this.matrixStateEl.style.setProperty('--am-crowd-progress', `${nextProgress}%`);
            const textNode = document.createElement('span');
            textNode.className = 'am-crowd-matrix-state-text';
            textNode.textContent = latestLine || ' ';
            this.matrixStateEl.replaceChildren(textNode);
            if (this.matrixRetryBtn instanceof HTMLElement) {
                this.matrixRetryBtn.style.display = options.showRetry ? 'inline-flex' : 'none';
            }
            if (options.autoHide === true) {
                const delay = Math.max(0, Number(options.hideDelayMs) || 1200);
                this.crowdMatrixStateHideTimer = setTimeout(() => {
                    if (!(this.matrixStateEl instanceof HTMLElement)) return;
                    this.matrixStateEl.classList.add('is-hidden');
                    this.crowdMatrixStateHideTimer = null;
                }, delay);
            }
        },

        ensureCrowdMatrixHoverTip() {
            if (this.matrixHoverTipEl instanceof HTMLElement && this.matrixHoverTipEl.isConnected) {
                return this.matrixHoverTipEl;
            }
            if (!(this.popup instanceof HTMLElement)) return null;
            const tip = document.createElement('div');
            tip.className = 'am-crowd-matrix-hover-tip';
            tip.style.display = 'none';
            this.popup.appendChild(tip);
            this.matrixHoverTipEl = tip;
            return tip;
        },

        showCrowdMatrixHoverTip(text, clientX, clientY) {
            const content = String(text || '').trim();
            if (!content) return;
            if (!(this.popup instanceof HTMLElement)) return;
            const tip = this.ensureCrowdMatrixHoverTip();
            if (!(tip instanceof HTMLElement)) return;

            const tipHtml = this.formatCrowdMatrixHoverTipHtml(content);
            if (tipHtml) {
                tip.innerHTML = tipHtml;
            } else {
                tip.textContent = content;
            }
            tip.style.display = 'block';

            const popupRect = this.popup.getBoundingClientRect();
            const tipRect = tip.getBoundingClientRect();
            const safeGap = 12;
            const offsetX = 10;
            const offsetY = 14;
            let left = clientX - popupRect.left + offsetX;
            let top = clientY - popupRect.top + offsetY;

            const maxLeft = Math.max(safeGap, popupRect.width - tipRect.width - safeGap);
            const maxTop = Math.max(safeGap, popupRect.height - tipRect.height - safeGap);

            if (left > maxLeft) {
                left = clientX - popupRect.left - tipRect.width - 10;
            }
            left = Math.max(safeGap, Math.min(left, maxLeft));
            top = Math.max(safeGap, Math.min(top, maxTop));

            tip.style.left = `${left}px`;
            tip.style.top = `${top}px`;
        },

        clearCrowdMatrixHoverBars() {
            const activeBars = Array.isArray(this.matrixHoverActiveBars) ? this.matrixHoverActiveBars : [];
            activeBars.forEach((bar) => {
                if (bar instanceof HTMLElement) bar.classList.remove('is-hover');
            });
            this.matrixHoverActiveBars = [];
            this.matrixHoverActiveBar = null;
        },

        getCrowdMatrixLinkedBars(anchorBar) {
            if (!(anchorBar instanceof HTMLElement)) return [];
            if (!(this.matrixGridEl instanceof HTMLElement)) return [anchorBar];
            const metric = String(anchorBar.dataset.metric || '').trim();
            const labelIndex = String(anchorBar.dataset.labelIndex || '').trim();
            const crowdGroup = String(anchorBar.dataset.crowdGroup || '').trim();
            if (!metric || !labelIndex || !crowdGroup) return [anchorBar];
            const linkedBars = [];
            this.matrixGridEl.querySelectorAll('.am-crowd-matrix-bar').forEach((node) => {
                if (!(node instanceof HTMLElement)) return;
                if (node.offsetParent === null) return;
                if (String(node.dataset.metric || '').trim() !== metric) return;
                if (String(node.dataset.labelIndex || '').trim() !== labelIndex) return;
                if (String(node.dataset.crowdGroup || '').trim() !== crowdGroup) return;
                linkedBars.push(node);
            });
            return linkedBars.length ? linkedBars : [anchorBar];
        },

        buildCrowdMatrixHoverMetricIndex() {
            this.matrixHoverMetricIndex = new Map();
            if (!(this.matrixGridEl instanceof HTMLElement)) return;
            this.matrixGridEl.querySelectorAll('.am-crowd-matrix-bar').forEach((node) => {
                if (!(node instanceof HTMLElement)) return;
                const labelIndex = String(node.dataset.labelIndex || '').trim();
                const crowdGroup = String(node.dataset.crowdGroup || '').trim();
                const metric = this.normalizeCrowdMetricType(node.dataset.metric || '');
                const period = this.normalizeCrowdPeriod(node.dataset.period || '');
                const periodKey = period || String(node.dataset.period || '').trim();
                const periodMapKey = String(periodKey || '');
                if (!labelIndex || !crowdGroup || !metric || !periodMapKey) return;
                const scopeKey = `${crowdGroup}::${labelIndex}`;
                let scopeMap = this.matrixHoverMetricIndex.get(scopeKey);
                if (!(scopeMap instanceof Map)) {
                    scopeMap = new Map();
                    this.matrixHoverMetricIndex.set(scopeKey, scopeMap);
                }
                let metricMap = scopeMap.get(metric);
                if (!(metricMap instanceof Map)) {
                    metricMap = new Map();
                    scopeMap.set(metric, metricMap);
                }
                if (metricMap.has(periodMapKey)) return;
                const ratio = this.toNumericValue(node.dataset.ratio || 0);
                const countDisplay = String(node.dataset.countDisplay || '').trim() || '0';
                const noData = String(node.dataset.noData || '').trim() === '1';
                metricMap.set(periodMapKey, { ratio, countDisplay, noData });
            });
        },

        getCrowdMatrixHoverMetricScopeMap(labelIndex, crowdGroup) {
            const normalizedLabelIndex = String(labelIndex || '').trim();
            const normalizedCrowdGroup = String(crowdGroup || '').trim();
            if (!normalizedLabelIndex || !normalizedCrowdGroup) return new Map();
            if (!(this.matrixHoverMetricIndex instanceof Map)) {
                this.buildCrowdMatrixHoverMetricIndex();
            }
            const scopeKey = `${normalizedCrowdGroup}::${normalizedLabelIndex}`;
            const scopeMap = this.matrixHoverMetricIndex instanceof Map
                ? this.matrixHoverMetricIndex.get(scopeKey)
                : null;
            return scopeMap instanceof Map ? scopeMap : new Map();
        },

        buildCrowdMatrixHoverTipText(anchorBar, linkedBars = []) {
            if (!(anchorBar instanceof HTMLElement)) return '';
            const bars = Array.isArray(linkedBars) && linkedBars.length ? linkedBars : [anchorBar];
            const metricLabel = String(anchorBar.dataset.metricLabel || '').trim();
            const labelName = String(anchorBar.dataset.labelName || '').trim();
            const crowdGroup = this.normalizeCrowdGroupName(anchorBar.dataset.crowdGroup || '');
            const shouldAppendYuan = crowdGroup === '省份' || crowdGroup === '城市';
            const anchorMetric = this.normalizeCrowdMetricType(anchorBar.dataset.metric || '');
            const anchorLabelIndex = String(anchorBar.dataset.labelIndex || '').trim();
            const anchorCrowdGroup = String(anchorBar.dataset.crowdGroup || '').trim();
            const visibleMetrics = this.CROWD_METRICS.filter(metric => this.getCrowdMetricVisible(metric));
            const orderedMetrics = anchorMetric
                ? [anchorMetric, ...visibleMetrics.filter(metric => metric !== anchorMetric)]
                : visibleMetrics.slice();
            const orderedMetricLabels = orderedMetrics.map((metric) => {
                return String(this.getCrowdMetricMeta(metric).seriesLabel || '').trim() || metric;
            });
            const items = [];
            const seenPeriods = new Set();
            bars.forEach((bar) => {
                if (!(bar instanceof HTMLElement)) return;
                const period = this.normalizeCrowdPeriod(bar.dataset.period || '');
                const periodKey = period || String(bar.dataset.period || '').trim() || `p-${items.length}`;
                if (seenPeriods.has(periodKey)) return;
                seenPeriods.add(periodKey);
                const ratio = this.toNumericValue(bar.dataset.ratio || 0);
                const rawCountDisplay = String(bar.dataset.countDisplay || '').trim() || '0';
                const countDisplay = shouldAppendYuan && !/元$/.test(rawCountDisplay) ? `${rawCountDisplay}元` : rawCountDisplay;
                const noData = String(bar.dataset.noData || '').trim() === '1';
                items.push({
                    period,
                    periodKey,
                    periodMapKey: String(periodKey || ''),
                    ratio,
                    countDisplay,
                    noData
                });
            });
            if (!items.length) {
                return String(anchorBar.dataset.tooltip || '').trim();
            }
            const periodOrder = this.CROWD_PERIODS.slice();
            items.sort((a, b) => {
                const aIdx = periodOrder.indexOf(a.period);
                const bIdx = periodOrder.indexOf(b.period);
                const aRank = aIdx > -1 ? aIdx : periodOrder.length + 1;
                const bRank = bIdx > -1 ? bIdx : periodOrder.length + 1;
                if (aRank !== bRank) return aRank - bRank;
                return String(a.periodKey).localeCompare(String(b.periodKey), 'zh-Hans-CN', { numeric: true });
            });
            const periodLabelMax = items.reduce((maxLen, item) => {
                const periodLabel = item.period ? `过去${item.period}天` : (String(item.periodKey).trim() || '当前周期');
                return Math.max(maxLen, periodLabel.length);
            }, 0);
            const ratioLabelMax = items.reduce((maxLen, item) => {
                return Math.max(maxLen, this.formatCrowdHoverPercent(item.ratio).length);
            }, 0);
            const countLabelMax = items.reduce((maxLen, item) => {
                return Math.max(maxLen, String(item.countDisplay || '').trim().length);
            }, 0);
            const compareMetricLabels = orderedMetricLabels.slice(1);
            const header = [metricLabel, labelName, compareMetricLabels.length ? `对比人群：${compareMetricLabels.join('、')}` : ''].filter(Boolean).join(' · ');
            const periodCompareMap = {
                3: 7,
                7: 30,
                30: 90
            };
            const periodItemMap = new Map();
            items.forEach((item) => {
                if (item.period) periodItemMap.set(item.period, item);
            });
            const scopeMetricMap = this.getCrowdMatrixHoverMetricScopeMap(anchorLabelIndex, anchorCrowdGroup);
            const metricItemMap = new Map();
            orderedMetrics.forEach((metric) => {
                metricItemMap.set(metric, new Map());
            });
            orderedMetrics.forEach((metric) => {
                const metricMap = metricItemMap.get(metric);
                const scopeMap = scopeMetricMap.get(metric);
                if (!(metricMap instanceof Map) || !(scopeMap instanceof Map)) return;
                scopeMap.forEach((metricItem, periodMapKey) => {
                    if (!periodMapKey || metricMap.has(periodMapKey)) return;
                    const ratio = this.toNumericValue(metricItem?.ratio || 0);
                    const rawCountDisplay = String(metricItem?.countDisplay || '').trim() || '0';
                    const countDisplay = shouldAppendYuan && !/元$/.test(rawCountDisplay) ? `${rawCountDisplay}元` : rawCountDisplay;
                    const noData = metricItem?.noData === true;
                    metricMap.set(periodMapKey, {
                        ratio,
                        countDisplay,
                        noData
                    });
                });
            });
            const anchorMetricMap = metricItemMap.get(anchorMetric);
            if (anchorMetricMap instanceof Map) {
                items.forEach((item) => {
                    if (!item.periodMapKey) return;
                    if (anchorMetricMap.has(item.periodMapKey)) return;
                    anchorMetricMap.set(item.periodMapKey, {
                        ratio: item.ratio,
                        countDisplay: item.countDisplay,
                        noData: item.noData
                    });
                });
            }
            const extraMetrics = orderedMetrics.slice(1);
            const rows = items.map((item) => {
                const periodLabel = item.period ? `过去${item.period}天` : (String(item.periodKey).trim() || '当前周期');
                const ratioLabel = this.formatCrowdHoverPercent(item.ratio).padStart(ratioLabelMax, ' ');
                let diffLabel = '';
                const comparePeriod = periodCompareMap[item.period];
                if (comparePeriod) {
                    const compareItem = periodItemMap.get(comparePeriod);
                    if (compareItem) {
                        const diffPt = item.ratio - compareItem.ratio;
                        diffLabel = `（${this.formatCrowdPtDiff(diffPt)}）`;
                    }
                }
                const countLabel = item.countDisplay.padStart(countLabelMax, ' ');
                const extraCells = extraMetrics.map((metric) => {
                    const metricMap = metricItemMap.get(metric);
                    const metricItem = metricMap instanceof Map
                        ? metricMap.get(item.periodMapKey)
                        : null;
                    return {
                        ratioLabel: metricItem ? this.formatCrowdHoverPercent(metricItem.ratio) : '',
                        countLabel: metricItem ? String(metricItem.countDisplay || '') : ''
                    };
                });
                return { periodLabel, ratioLabel, diffLabel, countLabel, extraCells, noData: item.noData };
            });
            const diffLabelMax = rows.reduce((maxLen, row) => Math.max(maxLen, row.diffLabel.length), 0);
            const extraRatioLabelMaxList = extraMetrics.map((_, idx) => {
                return rows.reduce((maxLen, row) => {
                    const ratioLabel = String(row.extraCells?.[idx]?.ratioLabel || '');
                    return Math.max(maxLen, ratioLabel.length);
                }, 0);
            });
            const extraCountLabelMaxList = extraMetrics.map((_, idx) => {
                return rows.reduce((maxLen, row) => {
                    const countLabel = String(row.extraCells?.[idx]?.countLabel || '');
                    return Math.max(maxLen, countLabel.length);
                }, 0);
            });
            const lines = rows.map((row) => {
                const diffColumn = row.diffLabel.padEnd(diffLabelMax, ' ');
                const extraColumns = row.extraCells.map((cell, idx) => {
                    const ratioWidth = extraRatioLabelMaxList[idx];
                    const countWidth = extraCountLabelMaxList[idx];
                    const ratioCell = String(cell.ratioLabel || '').padStart(ratioWidth, ' ');
                    const countCell = String(cell.countLabel || '').padStart(countWidth, ' ');
                    return `${ratioCell}  ${countCell}`.trimEnd();
                });
                return `${row.periodLabel.padEnd(periodLabelMax, ' ')}  ${row.ratioLabel}${diffColumn}  ${row.countLabel}${row.noData ? ' 无数据' : ''}${extraColumns.length ? ` | ${extraColumns.join(' | ')}` : ''}`;
            });
            const metricHeaderLine = orderedMetricLabels.length ? `__METRICS__|${orderedMetricLabels.join('|')}` : '';
            const contentLines = metricHeaderLine ? [metricHeaderLine, ...lines] : lines;
            return header ? `${header}\n${contentLines.join('\n')}` : contentLines.join('\n');
        },

        formatCrowdMatrixHoverTipHtml(text) {
            const content = String(text || '').trim();
            if (!content) return '';
            const escapeHtml = (value) => {
                const input = String(value ?? '');
                if (typeof Utils === 'object' && Utils && typeof Utils.escapeHtml === 'function') {
                    return Utils.escapeHtml(input);
                }
                return input
                    .replaceAll('&', '&amp;')
                    .replaceAll('<', '&lt;')
                    .replaceAll('>', '&gt;')
                    .replaceAll('"', '&quot;')
                    .replaceAll("'", '&#39;');
            };
            const lines = content.split(/\r?\n/).filter(Boolean);
            if (!lines.length) return '';
            const headerHtml = `<div class="am-crowd-matrix-hover-tip-header">${escapeHtml(lines[0])}</div>`;
            const bodyLines = lines.slice(1);
            let metricLabels = [];
            if (bodyLines.length && bodyLines[0].startsWith('__METRICS__|')) {
                metricLabels = bodyLines.shift().split('|').slice(1).map(item => String(item || '').trim()).filter(Boolean);
            }
            const compareMetricLabels = metricLabels.slice(1);
            const rowDataList = bodyLines.map((line) => {
                const safeLine = String(line || '');
                const [mainLine = '', ...compareParts] = safeLine.split(' | ');
                const hasNoData = /\s无数据\s*$/.test(mainLine);
                const normalizedLine = hasNoData ? mainLine.replace(/\s无数据\s*$/, '') : mainLine;
                const rowMatch = normalizedLine.match(/^(\S+)\s+([0-9]+(?:\.[0-9]+)?%)\s*(（[+-]\d+(?:\.\d+)?pt）)?\s+(\S+)$/);
                if (!rowMatch) {
                    return { fallbackHtml: `<div class="am-crowd-matrix-hover-tip-line">${escapeHtml(safeLine)}</div>` };
                }
                const periodLabel = rowMatch[1] || '';
                const ratioLabel = rowMatch[2] || '';
                const diffLabel = rowMatch[3] || '';
                const countLabel = rowMatch[4] || '';
                const compareCells = compareParts.map((part) => {
                    const comparePart = String(part || '').trim();
                    if (!comparePart) return { ratioLabel: '', countLabel: '' };
                    const compareMatch = comparePart.match(/^(\S+)(?:\s+(\S+))?$/);
                    if (!compareMatch) return { ratioLabel: comparePart, countLabel: '' };
                    return {
                        ratioLabel: String(compareMatch[1] || '').trim(),
                        countLabel: String(compareMatch[2] || '').trim()
                    };
                });
                while (compareCells.length < compareMetricLabels.length) {
                    compareCells.push({ ratioLabel: '', countLabel: '' });
                }
                if (compareCells.length > compareMetricLabels.length) {
                    compareCells.length = compareMetricLabels.length;
                }
                const diffValue = diffLabel.replaceAll('（', '').replaceAll('）', '');
                const diffClass = diffValue.startsWith('+')
                    ? 'is-pos'
                    : (diffValue.startsWith('-') ? 'is-neg' : 'is-neutral');
                return {
                    periodLabel,
                    ratioLabel,
                    diffLabel,
                    countLabel,
                    compareCells,
                    hasNoData,
                    diffClass
                };
            });
            if (!rowDataList.length) return headerHtml;
            const normalRows = rowDataList.filter(row => !row.fallbackHtml);
            const periodCh = normalRows.reduce((maxLen, row) => Math.max(maxLen, row.periodLabel.length), 0);
            const ratioCh = normalRows.reduce((maxLen, row) => Math.max(maxLen, row.ratioLabel.length), 0);
            const diffCh = normalRows.reduce((maxLen, row) => Math.max(maxLen, row.diffLabel.length), 0);
            const countCh = normalRows.reduce((maxLen, row) => Math.max(maxLen, row.countLabel.length), 0);
            const compareRatioChList = compareMetricLabels.map((_, idx) => {
                return normalRows.reduce((maxLen, row) => {
                    const ratioLabel = String(row.compareCells?.[idx]?.ratioLabel || '');
                    return Math.max(maxLen, ratioLabel.length);
                }, 0);
            });
            const compareCountChList = compareMetricLabels.map((_, idx) => {
                return normalRows.reduce((maxLen, row) => {
                    const countLabel = String(row.compareCells?.[idx]?.countLabel || '');
                    return Math.max(maxLen, countLabel.length);
                }, 0);
            });
            const gridTemplateParts = [
                `${Math.max(6, periodCh)}ch`,
                `${Math.max(7, ratioCh)}ch`,
                `${Math.max(1, diffCh)}ch`,
                `${Math.max(3, countCh)}ch`
            ];
            compareMetricLabels.forEach((_, idx) => {
                gridTemplateParts.push(`${Math.max(5, compareRatioChList[idx])}ch`);
                gridTemplateParts.push(`${Math.max(6, compareCountChList[idx])}ch`);
            });
            gridTemplateParts.push('max-content');
            const tableStyle = `--am-crowd-hover-grid-template:${gridTemplateParts.join(' ')};`;
            const metricHeaderHtml = metricLabels.length
                ? `
                    <div class="am-crowd-matrix-hover-tip-row am-crowd-matrix-hover-tip-row-metrics">
                        <span class="am-crowd-matrix-hover-tip-col am-crowd-matrix-hover-tip-col-period">周期</span>
                        <span class="am-crowd-matrix-hover-tip-col am-crowd-matrix-hover-tip-col-metric-label" style="grid-column: span 3">${escapeHtml(metricLabels[0])}</span>
                        ${compareMetricLabels.map(label => `<span class="am-crowd-matrix-hover-tip-col am-crowd-matrix-hover-tip-col-metric-label" style="grid-column: span 2">${escapeHtml(label)}</span>`).join('')}
                        <span class="am-crowd-matrix-hover-tip-col am-crowd-matrix-hover-tip-col-flag"></span>
                    </div>
                `
                : '';
            const rowsHtml = rowDataList.map((row) => {
                if (row.fallbackHtml) return row.fallbackHtml;
                const compareCellsHtml = compareMetricLabels.map((_, idx) => {
                    const cell = row.compareCells?.[idx] || { ratioLabel: '', countLabel: '' };
                    return `
                        <span class="am-crowd-matrix-hover-tip-col am-crowd-matrix-hover-tip-col-compare-ratio">${cell.ratioLabel ? escapeHtml(cell.ratioLabel) : '&nbsp;'}</span>
                        <span class="am-crowd-matrix-hover-tip-col am-crowd-matrix-hover-tip-col-compare-count">${cell.countLabel ? escapeHtml(cell.countLabel) : '&nbsp;'}</span>
                    `;
                }).join('');
                return `
                    <div class="am-crowd-matrix-hover-tip-row">
                        <span class="am-crowd-matrix-hover-tip-col am-crowd-matrix-hover-tip-col-period">${escapeHtml(row.periodLabel)}</span>
                        <span class="am-crowd-matrix-hover-tip-col am-crowd-matrix-hover-tip-col-ratio">${escapeHtml(row.ratioLabel)}</span>
                        <span class="am-crowd-matrix-hover-tip-col am-crowd-matrix-hover-tip-col-diff am-crowd-matrix-hover-tip-diff ${row.diffLabel ? row.diffClass : 'is-empty'}">${row.diffLabel ? escapeHtml(row.diffLabel) : '&nbsp;'}</span>
                        <span class="am-crowd-matrix-hover-tip-col am-crowd-matrix-hover-tip-col-count">${escapeHtml(row.countLabel)}</span>
                        ${compareCellsHtml}
                        <span class="am-crowd-matrix-hover-tip-col am-crowd-matrix-hover-tip-col-flag">${row.hasNoData ? '无数据' : ''}</span>
                    </div>
                `;
            }).join('');
            return `${headerHtml}<div class="am-crowd-matrix-hover-tip-table" style="${tableStyle}">${metricHeaderHtml}${rowsHtml}</div>`;
        },

        activateCrowdMatrixHoverBars(anchorBar) {
            if (!(anchorBar instanceof HTMLElement)) {
                this.clearCrowdMatrixHoverBars();
                return [];
            }
            if (this.matrixHoverActiveBar === anchorBar && Array.isArray(this.matrixHoverActiveBars) && this.matrixHoverActiveBars.length) {
                return this.matrixHoverActiveBars;
            }
            this.clearCrowdMatrixHoverBars();
            const linkedBars = this.getCrowdMatrixLinkedBars(anchorBar);
            linkedBars.forEach((bar) => {
                if (bar instanceof HTMLElement) bar.classList.add('is-hover');
            });
            this.matrixHoverActiveBar = anchorBar;
            this.matrixHoverActiveBars = linkedBars;
            return linkedBars;
        },

        hideCrowdMatrixHoverTip() {
            if (this.matrixHoverTipEl instanceof HTMLElement) {
                this.matrixHoverTipEl.style.display = 'none';
            }
            this.clearCrowdMatrixHoverBars();
        },

        bindCrowdMatrixHoverTipEvents() {
            if (!(this.matrixGridEl instanceof HTMLElement)) return;
            if (this.matrixGridEl.dataset.crowdHoverBound === '1') return;
            this.matrixGridEl.dataset.crowdHoverBound = '1';

            this.matrixGridEl.addEventListener('mousemove', (event) => {
                const target = event.target;
                if (!(target instanceof Element)) {
                    this.hideCrowdMatrixHoverTip();
                    return;
                }
                const bar = target.closest('.am-crowd-matrix-bar');
                if (!(bar instanceof HTMLElement) || !this.matrixGridEl.contains(bar)) {
                    this.hideCrowdMatrixHoverTip();
                    return;
                }
                if (bar.offsetParent === null) {
                    this.hideCrowdMatrixHoverTip();
                    return;
                }

                const linkedBars = this.activateCrowdMatrixHoverBars(bar);
                const tipText = this.buildCrowdMatrixHoverTipText(bar, linkedBars);
                if (!tipText) {
                    this.hideCrowdMatrixHoverTip();
                    return;
                }
                this.showCrowdMatrixHoverTip(tipText, event.clientX, event.clientY);
            });

            this.matrixGridEl.addEventListener('mouseleave', () => {
                this.hideCrowdMatrixHoverTip();
            });
            this.matrixGridEl.addEventListener('scroll', () => {
                this.hideCrowdMatrixHoverTip();
            }, { passive: true });
        },

        getCrowdMetricVisible(metricType) {
            const metric = this.normalizeCrowdMetricType(metricType);
            if (!metric) return true;
            const visibility = this.crowdMetricVisibility && typeof this.crowdMetricVisibility === 'object'
                ? this.crowdMetricVisibility
                : {};
            return visibility[metric] !== false;
        },

        normalizeCrowdPeriod(periodDays) {
            const days = Number(periodDays);
            return this.CROWD_PERIODS.includes(days) ? days : 0;
        },

        getCrowdPeriodVisible(periodDays) {
            const period = this.normalizeCrowdPeriod(periodDays);
            if (!period) return true;
            const visibility = this.crowdPeriodVisibility && typeof this.crowdPeriodVisibility === 'object'
                ? this.crowdPeriodVisibility
                : {};
            return visibility[period] !== false;
        },

        getVisibleCrowdPeriods(periods = []) {
            const list = Array.isArray(periods) && periods.length ? periods : this.CROWD_PERIODS;
            return list
                .map(period => this.normalizeCrowdPeriod(period))
                .filter(period => !!period)
                .filter(period => this.getCrowdPeriodVisible(period));
        },

        getCrowdRatioVisible() {
            return this.crowdRatioVisibility === true;
        },

        getCrowdInsightsVisible() {
            return this.crowdInsightsVisibility !== false;
        },

        syncCrowdAuxiliaryVisibilityByMetricCount(visibilityMap = null) {
            const visibility = visibilityMap && typeof visibilityMap === 'object'
                ? visibilityMap
                : (this.crowdMetricVisibility && typeof this.crowdMetricVisibility === 'object' ? this.crowdMetricVisibility : {});
            const visibleCount = this.CROWD_METRICS.reduce((count, metric) => {
                return count + (visibility[metric] === false ? 0 : 1);
            }, 0);
            if (visibleCount <= 1) {
                this.crowdRatioVisibility = true;
                this.crowdInsightsVisibility = false;
            } else {
                this.crowdRatioVisibility = false;
                this.crowdInsightsVisibility = true;
            }
            return visibleCount;
        },

        applyCrowdMetricVisibility() {
            if (this.matrixGridEl instanceof HTMLElement) {
                this.CROWD_METRICS.forEach((metric) => {
                    this.matrixGridEl.classList.toggle(`am-hide-metric-${metric}`, !this.getCrowdMetricVisible(metric));
                });
                this.matrixGridEl.classList.toggle('am-show-ratio-values', this.getCrowdRatioVisible());
                this.matrixGridEl.classList.toggle('am-hide-insights', !this.getCrowdInsightsVisible());
            }
            if (this.matrixLegendEl instanceof HTMLElement) {
                this.matrixLegendEl.querySelectorAll('[data-crowd-metric]').forEach((node) => {
                    if (!(node instanceof HTMLElement)) return;
                    const metric = this.normalizeCrowdMetricType(node.dataset.crowdMetric || '');
                    if (!metric) return;
                    const visible = this.getCrowdMetricVisible(metric);
                    node.classList.toggle('is-off', !visible);
                    node.setAttribute('aria-pressed', visible ? 'true' : 'false');
                    node.title = `${this.getCrowdMetricMeta(metric).seriesLabel}${visible ? '（点击隐藏）' : '（点击显示）'}`;
                });
                this.matrixLegendEl.querySelectorAll('[data-crowd-period]').forEach((node) => {
                    if (!(node instanceof HTMLElement)) return;
                    const period = this.normalizeCrowdPeriod(node.dataset.crowdPeriod || '');
                    if (!period) return;
                    const visible = this.getCrowdPeriodVisible(period);
                    node.classList.toggle('is-off', !visible);
                    node.setAttribute('aria-pressed', visible ? 'true' : 'false');
                    node.title = `过去${period}天${visible ? '（点击隐藏）' : '（点击显示）'}`;
                });
                this.matrixLegendEl.querySelectorAll('[data-crowd-ratio-toggle]').forEach((node) => {
                    if (!(node instanceof HTMLElement)) return;
                    const visible = this.getCrowdRatioVisible();
                    node.classList.toggle('is-off', !visible);
                    node.setAttribute('aria-pressed', visible ? 'true' : 'false');
                    node.title = `显示占比${visible ? '（点击隐藏）' : '（点击显示）'}`;
                });
                this.matrixLegendEl.querySelectorAll('[data-crowd-insight-toggle]').forEach((node) => {
                    if (!(node instanceof HTMLElement)) return;
                    const visible = this.getCrowdInsightsVisible();
                    node.classList.toggle('is-off', !visible);
                    node.setAttribute('aria-pressed', visible ? 'true' : 'false');
                    node.title = `显示提示${visible ? '（点击隐藏）' : '（点击显示）'}`;
                });
            }
        },

        enableCrowdMatrixHorizontalDrag(scrollerEl) {
            if (!(scrollerEl instanceof HTMLElement) || scrollerEl.__amCrowdDragBound) return;
            scrollerEl.__amCrowdDragBound = true;
            let dragging = false;
            let activePointerId = null;
            let startClientX = 0;
            let startScrollLeft = 0;
            let hasMoved = false;
            const stopDrag = () => {
                if (!dragging) return;
                dragging = false;
                activePointerId = null;
                hasMoved = false;
                scrollerEl.classList.remove('is-dragging');
            };
            scrollerEl.addEventListener('pointerdown', (event) => {
                if (!event.isPrimary) return;
                if (event.pointerType === 'mouse' && event.button !== 0) return;
                if (scrollerEl.scrollWidth <= (scrollerEl.clientWidth + 1)) return;
                dragging = true;
                activePointerId = event.pointerId;
                startClientX = event.clientX;
                startScrollLeft = scrollerEl.scrollLeft;
                hasMoved = false;
                scrollerEl.classList.add('is-dragging');
                try {
                    scrollerEl.setPointerCapture(event.pointerId);
                } catch { }
            });
            scrollerEl.addEventListener('pointermove', (event) => {
                if (!dragging || event.pointerId !== activePointerId) return;
                const deltaX = event.clientX - startClientX;
                if (!hasMoved && Math.abs(deltaX) >= 3) {
                    hasMoved = true;
                }
                if (!hasMoved) return;
                scrollerEl.scrollLeft = startScrollLeft - deltaX;
                event.preventDefault();
            });
            scrollerEl.addEventListener('pointerup', (event) => {
                if (event.pointerId !== activePointerId) return;
                stopDrag();
            });
            scrollerEl.addEventListener('pointercancel', stopDrag);
            scrollerEl.addEventListener('lostpointercapture', stopDrag);
            scrollerEl.addEventListener('dragstart', (event) => event.preventDefault());
        },

        renderCrowdGlobalLegend() {
            if (!(this.matrixLegendEl instanceof HTMLElement)) return;
            this.matrixLegendEl.innerHTML = '';
            const metricGroup = document.createElement('div');
            metricGroup.className = 'am-crowd-matrix-legend-group am-crowd-matrix-legend-group-metric';
            this.CROWD_METRICS.forEach((metric) => {
                const meta = this.getCrowdMetricMeta(metric);
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'am-crowd-matrix-legend-toggle';
                btn.dataset.crowdMetric = metric;
                btn.style.setProperty('--am-crowd-legend-color', meta.color);
                const dot = document.createElement('i');
                const text = document.createElement('span');
                text.textContent = meta.seriesLabel;
                btn.appendChild(dot);
                btn.appendChild(text);
                metricGroup.appendChild(btn);
            });
            this.matrixLegendEl.appendChild(metricGroup);

            const divider = document.createElement('span');
            divider.className = 'am-crowd-matrix-legend-divider';
            divider.textContent = '｜';
            divider.setAttribute('aria-hidden', 'true');
            this.matrixLegendEl.appendChild(divider);

            const periodGroup = document.createElement('div');
            periodGroup.className = 'am-crowd-matrix-legend-group am-crowd-matrix-legend-group-period';
            this.CROWD_PERIODS.forEach((period) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'am-crowd-matrix-legend-toggle';
                btn.dataset.crowdPeriod = String(period);
                btn.style.setProperty('--am-crowd-legend-color', '#7f8ca9');
                const dot = document.createElement('i');
                const text = document.createElement('span');
                text.textContent = `过去${period}天`;
                btn.appendChild(dot);
                btn.appendChild(text);
                periodGroup.appendChild(btn);
            });
            this.matrixLegendEl.appendChild(periodGroup);

            const ratioDivider = document.createElement('span');
            ratioDivider.className = 'am-crowd-matrix-legend-divider';
            ratioDivider.textContent = '｜';
            ratioDivider.setAttribute('aria-hidden', 'true');
            this.matrixLegendEl.appendChild(ratioDivider);

            const ratioGroup = document.createElement('div');
            ratioGroup.className = 'am-crowd-matrix-legend-group am-crowd-matrix-legend-group-ratio';
            const ratioBtn = document.createElement('button');
            ratioBtn.type = 'button';
            ratioBtn.className = 'am-crowd-matrix-legend-toggle';
            ratioBtn.dataset.crowdRatioToggle = '1';
            ratioBtn.style.setProperty('--am-crowd-legend-color', '#2f54eb');
            const ratioDot = document.createElement('i');
            const ratioText = document.createElement('span');
            ratioText.textContent = '显示占比';
            ratioBtn.appendChild(ratioDot);
            ratioBtn.appendChild(ratioText);
            ratioGroup.appendChild(ratioBtn);

            const insightBtn = document.createElement('button');
            insightBtn.type = 'button';
            insightBtn.className = 'am-crowd-matrix-legend-toggle';
            insightBtn.dataset.crowdInsightToggle = '1';
            insightBtn.style.setProperty('--am-crowd-legend-color', '#7f8ca9');
            const insightDot = document.createElement('i');
            const insightText = document.createElement('span');
            insightText.textContent = '显示提示';
            insightBtn.appendChild(insightDot);
            insightBtn.appendChild(insightText);
            ratioGroup.appendChild(insightBtn);

            this.matrixLegendEl.appendChild(ratioGroup);
            this.applyCrowdMetricVisibility();
        },

        toggleCrowdMetricVisibility(metricType) {
            const metric = this.normalizeCrowdMetricType(metricType);
            if (!metric) return;
            const nextVisible = !this.getCrowdMetricVisible(metric);
            if (!nextVisible) {
                const visibleCount = this.CROWD_METRICS.filter(key => this.getCrowdMetricVisible(key)).length;
                if (visibleCount <= 1) return;
            }
            const nextMap = {};
            this.CROWD_METRICS.forEach((metricKey) => {
                nextMap[metricKey] = this.getCrowdMetricVisible(metricKey);
            });
            nextMap[metric] = nextVisible;
            this.crowdMetricVisibility = nextMap;
            this.syncCrowdAuxiliaryVisibilityByMetricCount(nextMap);
            if (this.crowdMatrixDataset) {
                this.renderCrowdMatrixCharts(this.crowdMatrixDataset, { animate: true });
                return;
            }
            this.applyCrowdMetricVisibility();
        },

        toggleCrowdPeriodVisibility(periodDays) {
            const period = this.normalizeCrowdPeriod(periodDays);
            if (!period) return;
            const nextVisible = !this.getCrowdPeriodVisible(period);
            if (!nextVisible) {
                const visibleCount = this.CROWD_PERIODS.filter(days => this.getCrowdPeriodVisible(days)).length;
                if (visibleCount <= 1) return;
            }
            this.crowdPeriodVisibility = {
                3: this.getCrowdPeriodVisible(3),
                7: this.getCrowdPeriodVisible(7),
                30: this.getCrowdPeriodVisible(30),
                90: this.getCrowdPeriodVisible(90),
                [period]: nextVisible
            };
            if (this.crowdMatrixDataset) {
                this.renderCrowdMatrixCharts(this.crowdMatrixDataset, { animate: true });
                return;
            }
            this.applyCrowdMetricVisibility();
        },

        toggleCrowdRatioVisibility() {
            this.crowdRatioVisibility = !this.getCrowdRatioVisible();
            this.applyCrowdMetricVisibility();
        },

        toggleCrowdInsightsVisibility() {
            this.crowdInsightsVisibility = !this.getCrowdInsightsVisible();
            this.applyCrowdMetricVisibility();
        },

        createCrowdMatrixCell(period, groupName, cell, options = {}) {
            const wrap = document.createElement('div');
            wrap.className = 'am-crowd-matrix-cell am-crowd-matrix-cell-chart';
            const animateBars = options?.animate === true;
            const normalizedGroupName = this.normalizeCrowdGroupName(groupName);
            const enableHorizontalScroll = normalizedGroupName === '省份' || normalizedGroupName === '城市';

            const labels = Array.isArray(cell?.labels) ? cell.labels : [];
            if (!labels.length) {
                const empty = document.createElement('div');
                empty.className = 'am-crowd-matrix-empty';
                empty.textContent = '暂无数据';
                wrap.appendChild(empty);
                return wrap;
            }

            const metrics = this.CROWD_METRICS.slice();
            const visibleMetrics = metrics.filter(metric => this.getCrowdMetricVisible(metric));
            const visibleMetricCount = Math.max(1, visibleMetrics.length);
            const scaleMetrics = visibleMetrics.length ? visibleMetrics : metrics;
            const cellMaxRatio = scaleMetrics.reduce((maxValue, metric) => {
                const list = Array.isArray(cell?.[metric]) ? cell[metric] : [];
                const currentMax = list.reduce((innerMax, value) => Math.max(innerMax, this.toNumericValue(value)), 0);
                return Math.max(maxValue, currentMax);
            }, 0);
            const normalizedMax = cellMaxRatio > 0 ? cellMaxRatio : 1;
            const chart = document.createElement('div');
            chart.className = 'am-crowd-matrix-chart';
            const labelCount = Math.max(1, labels.length);
            chart.style.setProperty('--am-crowd-label-count', String(labelCount));
            chart.style.setProperty('--am-crowd-metric-visible-count', String(visibleMetricCount));
            if (enableHorizontalScroll) {
                const labelMinWidth = labelCount >= 120 ? 50 : (labelCount >= 70 ? 54 : 58);
                wrap.classList.add('is-horizontal-scroll');
                chart.style.setProperty('--am-crowd-label-min-width', `${labelMinWidth}px`);
            }
            if (labelCount >= 7) chart.classList.add('is-dense');
            if (labelCount >= 10) chart.classList.add('is-ultra-dense');

            labels.forEach((label, labelIdx) => {
                const group = document.createElement('div');
                group.className = 'am-crowd-matrix-bar-group';

                const columns = document.createElement('div');
                columns.className = 'am-crowd-matrix-bar-columns';

                metrics.forEach((metric) => {
                    const metricMeta = this.getCrowdMetricMeta(metric);
                    const ratio = this.toNumericValue(cell?.[metric]?.[labelIdx] ?? 0);
                    const rawValue = cell?.[`${metric}Raw`]?.[labelIdx];
                    const countDisplay = this.formatCrowdRawValue(rawValue, ratio);
                    const tooltipCountDisplay = (normalizedGroupName === '省份' || normalizedGroupName === '城市') && !/元$/.test(String(countDisplay || ''))
                        ? `${countDisplay || '0'}元`
                        : String(countDisplay || '0');
                    const bar = document.createElement('div');
                    bar.className = 'am-crowd-matrix-bar';
                    bar.dataset.metric = metric;
                    bar.dataset.labelIndex = String(labelIdx);
                    bar.dataset.crowdGroup = String(groupName || '');
                    bar.dataset.period = String(period || '');
                    bar.dataset.metricLabel = String(metricMeta.seriesLabel || '');
                    bar.dataset.labelName = String(label || '');
                    bar.dataset.ratio = String(ratio);
                    bar.dataset.countDisplay = String(countDisplay || '0');
                    bar.dataset.noData = cell?.noData?.[metric] ? '1' : '0';
                    if (cell?.noData?.[metric]) bar.classList.add('is-nodata');
                    bar.style.setProperty('--am-crowd-bar-color', metricMeta.color);
                    const tooltipText = `${metricMeta.seriesLabel}: ${this.formatCrowdPercent(ratio)}（${tooltipCountDisplay}）${cell?.noData?.[metric] ? ' 无数据' : ''}`;
                    bar.dataset.tooltip = tooltipText;
                    bar.setAttribute('aria-label', tooltipText);

                    const fill = document.createElement('span');
                    fill.className = 'am-crowd-matrix-bar-fill';
                    const barHeight = `${Math.max(0, Math.min(100, (ratio / normalizedMax) * 100))}%`;
                    bar.style.setProperty('--am-crowd-bar-height', barHeight);
                    if (animateBars) {
                        fill.style.height = '0%';
                        fill.style.opacity = '0.38';
                        const applyHeight = () => {
                            fill.style.height = barHeight;
                            fill.style.opacity = '1';
                        };
                        if (typeof requestAnimationFrame === 'function') {
                            requestAnimationFrame(applyHeight);
                        } else {
                            setTimeout(applyHeight, 16);
                        }
                    } else {
                        fill.style.height = barHeight;
                    }
                    const ratioLabel = document.createElement('span');
                    ratioLabel.className = 'am-crowd-matrix-bar-ratio';
                    ratioLabel.textContent = this.formatCrowdPercent(ratio);
                    fill.appendChild(ratioLabel);
                    bar.appendChild(fill);
                    columns.appendChild(bar);
                });

                const xLabel = document.createElement('div');
                xLabel.className = 'am-crowd-matrix-xlabel';
                xLabel.textContent = label;

                group.appendChild(columns);
                group.appendChild(xLabel);
                chart.appendChild(group);
            });
            wrap.appendChild(chart);
            if (enableHorizontalScroll) {
                this.enableCrowdMatrixHorizontalDrag(wrap);
            }

            const insights = document.createElement('div');
            insights.className = 'am-crowd-matrix-insights';
            insights.style.setProperty('--am-crowd-metric-count', String(metrics.length));
            metrics.forEach((metric) => {
                const metricMeta = this.getCrowdMetricMeta(metric);
                const values = Array.isArray(cell?.[metric]) ? cell[metric] : [];
                let topIdx = -1;
                let topValue = -1;
                values.forEach((value, idx) => {
                    const num = this.toNumericValue(value);
                    if (num > topValue) {
                        topValue = num;
                        topIdx = idx;
                    }
                });
                const insightItem = document.createElement('div');
                insightItem.className = 'am-crowd-matrix-insight-item';
                insightItem.dataset.metric = metric;
                insightItem.style.setProperty('--am-crowd-insight-color', metricMeta.color);
                if (topIdx > -1 && topValue > 0 && labels[topIdx]) {
                    insightItem.textContent = `${metricMeta.shortLabel}: ${labels[topIdx]} ${this.formatCrowdPercent(topValue)}`;
                } else {
                    insightItem.textContent = `${metricMeta.shortLabel}: 无数据`;
                }
                insights.appendChild(insightItem);
            });
            wrap.appendChild(insights);

            return wrap;
        },

        renderCrowdMatrixCharts(dataset, options = {}) {
            if (!(this.matrixGridEl instanceof HTMLElement)) return;
            this.hideCrowdMatrixHoverTip();
            this.matrixGridEl.innerHTML = '';
            this.matrixHoverMetricIndex = null;
            if (!dataset || typeof dataset !== 'object') return;
            const animateBars = options?.animate === true;

            const periods = this.getVisibleCrowdPeriods(Array.isArray(dataset.periods) ? dataset.periods : []);
            const groups = Array.isArray(dataset.groups) ? dataset.groups : [];
            if (!periods.length || !groups.length) return;

            const table = document.createElement('div');
            table.className = 'am-crowd-matrix-table';
            table.style.setProperty('--am-crowd-matrix-data-cols', String(Math.max(1, periods.length)));

            const corner = document.createElement('div');
            corner.className = 'am-crowd-matrix-cell am-crowd-matrix-header am-crowd-matrix-corner';
            corner.textContent = '人群维度 / 周期';
            table.appendChild(corner);

            periods.forEach((period) => {
                const header = document.createElement('div');
                header.className = 'am-crowd-matrix-cell am-crowd-matrix-header';
                header.dataset.period = String(period);
                header.textContent = `过去${period}天`;
                table.appendChild(header);
            });

            groups.forEach((groupName) => {
                const rowHeader = document.createElement('div');
                rowHeader.className = 'am-crowd-matrix-cell am-crowd-matrix-row-header';
                rowHeader.textContent = groupName;
                table.appendChild(rowHeader);

                periods.forEach((period) => {
                    const cell = dataset?.cellData?.[period]?.[groupName] || null;
                    const cellNode = this.createCrowdMatrixCell(period, groupName, cell, { animate: animateBars });
                    cellNode.dataset.period = String(period);
                    table.appendChild(cellNode);
                });
            });

            this.matrixGridEl.appendChild(table);
            this.buildCrowdMatrixHoverMetricIndex();
            this.applyCrowdMetricVisibility();
        },

        snapshotPopupLayout() {
            if (!(this.popup instanceof HTMLElement)) return null;
            return {
                top: this.popup.style.top || '',
                left: this.popup.style.left || '',
                transform: this.popup.style.transform || '',
                width: this.popup.style.width || '',
                height: this.popup.style.height || '',
                maxWidth: this.popup.style.maxWidth || '',
                maxHeight: this.popup.style.maxHeight || '',
                borderRadius: this.popup.style.borderRadius || ''
            };
        },

        applyPopupLayout(layout) {
            if (!(this.popup instanceof HTMLElement) || !layout || typeof layout !== 'object') return;
            this.popup.style.top = String(layout.top || '');
            this.popup.style.left = String(layout.left || '');
            this.popup.style.transform = String(layout.transform || '');
            this.popup.style.width = String(layout.width || '');
            this.popup.style.height = String(layout.height || '');
            this.popup.style.maxWidth = String(layout.maxWidth || '');
            this.popup.style.maxHeight = String(layout.maxHeight || '');
            this.popup.style.borderRadius = String(layout.borderRadius || '');
        },

        maximizePopupForMatrix() {
            if (!(this.popup instanceof HTMLElement)) return;
            if (!this.popupMatrixMaximized) {
                this.popupLayoutBeforeMatrix = this.snapshotPopupLayout();
            }
            const viewportWidth = Math.max(320, document.documentElement?.clientWidth || window.innerWidth || 0);
            const viewportHeight = Math.max(320, document.documentElement?.clientHeight || window.innerHeight || 0);
            this.popup.style.top = '0px';
            this.popup.style.left = '0px';
            this.popup.style.transform = 'none';
            this.popup.style.width = `${viewportWidth}px`;
            this.popup.style.height = `${viewportHeight}px`;
            this.popup.style.maxWidth = '100vw';
            this.popup.style.maxHeight = '100vh';
            this.popup.style.borderRadius = '0px';
            this.popupMatrixMaximized = true;
        },

        restorePopupFromMatrix() {
            if (!(this.popup instanceof HTMLElement) || !this.popupMatrixMaximized) return;
            const fallbackLayout = {
                top: '30px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '900px',
                height: '85vh',
                maxWidth: '',
                maxHeight: '',
                borderRadius: '18px'
            };
            this.applyPopupLayout(this.popupLayoutBeforeMatrix || fallbackLayout);
            this.popupLayoutBeforeMatrix = null;
            this.popupMatrixMaximized = false;
        },

        switchMagicView(view, options = {}) {
            const next = view === 'matrix' ? 'matrix' : 'query';
            this.activeView = next;
            this.refreshCrowdMatrixCampaignMeta();
            if (next !== 'matrix') this.hideCrowdMatrixHoverTip();
            if (next === 'matrix') this.maximizePopupForMatrix();
            else this.restorePopupFromMatrix();
            if (this.viewTabsEl instanceof HTMLElement) {
                this.viewTabsEl.querySelectorAll('[data-view]').forEach((node) => {
                    if (!(node instanceof HTMLElement)) return;
                    node.classList.toggle('active', node.dataset.view === next);
                });
            }
            this.refreshMagicViewTabDefaultState();
            if (this.queryPanelEl instanceof HTMLElement) {
                this.queryPanelEl.style.display = next === 'query' ? 'block' : 'none';
            }
            if (this.matrixPanelEl instanceof HTMLElement) {
                this.matrixPanelEl.style.display = next === 'matrix' ? 'flex' : 'none';
            }
            if (this.quickPromptsEl instanceof HTMLElement) {
                this.quickPromptsEl.style.display = next === 'query' ? 'flex' : 'none';
            }
            if (this.matrixCampaignEl instanceof HTMLElement) {
                this.matrixCampaignEl.style.display = next === 'matrix' ? '' : 'none';
            }
            if (next === 'matrix' && options.skipLoad !== true) {
                this.ensureCrowdMatrixLoaded(false);
            }
        },

        buildCrowdMatrixResultKey(metricType, periodDays) {
            const metric = this.normalizeCrowdMetricType(metricType);
            const period = this.normalizeCrowdPeriod(periodDays);
            if (!metric || !period) return '';
            return `${metric}|${period}`;
        },

        collectCrowdMatrixResultList() {
            if (!(this.crowdMatrixResultMap instanceof Map)) return [];
            return Array.from(this.crowdMatrixResultMap.values()).filter(Boolean);
        },

        upsertCrowdMatrixResults(results = [], options = {}) {
            if (options?.replace === true || !(this.crowdMatrixResultMap instanceof Map)) {
                this.crowdMatrixResultMap = new Map();
            }
            (Array.isArray(results) ? results : []).forEach((item) => {
                const key = this.buildCrowdMatrixResultKey(item?.metricType, item?.periodDays);
                if (!key || !item) return;
                this.crowdMatrixResultMap.set(key, item);
            });
            return this.collectCrowdMatrixResultList();
        },

        replaceCrowdMatrixMetricResults(metricType, results = []) {
            const metric = this.normalizeCrowdMetricType(metricType);
            if (!(this.crowdMatrixResultMap instanceof Map)) {
                this.crowdMatrixResultMap = new Map();
            }
            if (!metric) return this.collectCrowdMatrixResultList();
            const metricPrefix = `${metric}|`;
            Array.from(this.crowdMatrixResultMap.keys()).forEach((key) => {
                if (String(key || '').startsWith(metricPrefix)) {
                    this.crowdMatrixResultMap.delete(key);
                }
            });
            (Array.isArray(results) ? results : []).forEach((item) => {
                const key = this.buildCrowdMatrixResultKey(item?.metricType, item?.periodDays);
                if (!key || !item) return;
                this.crowdMatrixResultMap.set(key, item);
            });
            return this.collectCrowdMatrixResultList();
        },

        scheduleCrowdMatrixMetricReload(campaignId, metricType) {
            const id = PlanIdentityUtils.normalizeCampaignId(campaignId);
            const metric = this.normalizeCrowdMetricType(metricType);
            if (!id || !metric) return;
            this.crowdMatrixPendingMetricReload = {
                campaignId: id,
                metricType: metric
            };
        },

        flushPendingCrowdMatrixMetricReload() {
            if (this.crowdMatrixLoading) return;
            const pending = this.crowdMatrixPendingMetricReload;
            if (!pending || typeof pending !== 'object') return;
            this.crowdMatrixPendingMetricReload = null;
            this.reloadCrowdMatrixMetric({
                campaignId: pending.campaignId,
                metricType: pending.metricType
            });
        },

        async runCrowdMatrixLoad({ campaignId, forceRefreshItems = false }) {
            const id = String(campaignId || '').trim();
            this.refreshCrowdMatrixCampaignMeta(id);
            this.crowdMatrixTaskProgressHandler = null;
            if (!/^\d{6,}$/.test(id)) {
                this.setCrowdMatrixStatus('未识别到有效计划ID，请先选择单计划后再试', 'error', { showRetry: false, progress: 0 });
                return;
            }
            const runId = ++this.crowdMatrixRunId;
            this.crowdMatrixLoading = true;
            this.crowdMatrixProgress = 0;
            this.crowdMatrixLoadedCampaignId = '';
            this.crowdMatrixDataset = null;
            this.crowdMatrixResultMap = null;
            this.crowdMatrixPendingMetricReload = null;
            this.crowdInsightRunContext = null;
            this.crowdRequestSlotPromise = Promise.resolve();
            this.crowdRequestLastAt = 0;
            this.setCrowdMatrixStatus(`正在加载计划 ${id} 的人群对比看板...`, 'loading', { showRetry: false, progress: 0 });
            if (this.matrixGridEl instanceof HTMLElement) this.matrixGridEl.innerHTML = '';

            try {
                await this.refreshCrowdCampaignItemOptions(id, { forceRefresh: forceRefreshItems });
                this.refreshCrowdMatrixCampaignMeta(id);
                const taskFns = [];
                this.CROWD_METRICS.forEach((metricType) => {
                    this.CROWD_PERIODS.forEach((periodDays) => {
                        const task = async () => this.queryCrowdInsight({ campaignId: id, metricType, periodDays });
                        const metricMeta = this.getCrowdMetricMeta(metricType);
                        task.__amCrowdTaskLabel = `${metricMeta.seriesLabel} · 过去${periodDays}天`;
                        taskFns.push(task);
                    });
                });
                const totalTaskCount = taskFns.length;
                this.crowdMatrixTaskProgressHandler = (progressInfo) => {
                    if (runId !== this.crowdMatrixRunId) return;
                    const done = Math.max(0, Math.min(totalTaskCount, Number(progressInfo?.done) || 0));
                    const status = String(progressInfo?.status || '').trim();
                    const taskLabel = String(progressInfo?.label || '').trim();
                    const stepText = status === 'fulfilled' ? '完成' : '失败';
                    const detailText = taskLabel ? `${stepText} ${taskLabel}` : `${stepText}一项请求`;
                    const ratio = totalTaskCount > 0 ? (done / totalTaskCount) * 100 : 0;
                    const scopeProgressText = totalTaskCount > 0
                        ? ` ｜ 省份 ${done}/${totalTaskCount} · 城市 ${done}/${totalTaskCount}`
                        : '';
                    this.setCrowdMatrixStatus(`加载中 ${done}/${totalTaskCount} · ${detailText}${scopeProgressText}`, 'loading', { showRetry: false, progress: ratio });
                };
                const settled = await this.runTasksWithConcurrency(taskFns, this.CROWD_REQUEST_CONCURRENCY);
                if (runId !== this.crowdMatrixRunId) return;

                const successResults = [];
                let failCount = 0;
                const unsupportedReasonSet = new Set();
                settled.forEach((item) => {
                    if (item.status === 'fulfilled' && item.value) {
                        successResults.push(item.value);
                        const reason = String(item.value?.rawMeta?.unsupportedReason || '').trim();
                        if (reason) unsupportedReasonSet.add(reason);
                    } else {
                        failCount += 1;
                    }
                });

                if (!successResults.length) {
                    this.setCrowdMatrixStatus('人群看板加载失败，请稍后重试', 'error', { showRetry: true, progress: 100 });
                    return;
                }

                const mergedResults = this.upsertCrowdMatrixResults(successResults, { replace: true });
                const dataset = this.buildMatrixDataset(mergedResults);
                this.crowdMatrixDataset = dataset;
                this.crowdMatrixLoadedCampaignId = id;
                this.renderCrowdMatrixCharts(dataset);
                const unsupportedNotice = Array.from(unsupportedReasonSet).filter(Boolean).join('；');
                const unsupportedSuffix = unsupportedNotice ? `；${unsupportedNotice}` : '';
                if (failCount > 0) {
                    this.setCrowdMatrixStatus(`部分数据加载失败，已展示可用结果（失败 ${failCount}/${totalTaskCount}）${unsupportedSuffix}`, 'warn', { showRetry: true, progress: 100, autoHide: true });
                } else if (unsupportedNotice) {
                    this.setCrowdMatrixStatus(`人群对比看板已加载完成；${unsupportedNotice}`, 'warn', { showRetry: false, progress: 100, autoHide: true });
                } else {
                    this.setCrowdMatrixStatus('人群对比看板已加载完成（4列周期 × 8行维度）', 'success', { showRetry: false, progress: 100, autoHide: true });
                }
            } catch (err) {
                if (runId !== this.crowdMatrixRunId) return;
                this.setCrowdMatrixStatus(`人群看板加载失败：${err?.message || '未知错误'}`, 'error', { showRetry: true, progress: this.crowdMatrixProgress || 0 });
            } finally {
                if (runId === this.crowdMatrixRunId) {
                    this.crowdMatrixLoading = false;
                    this.crowdMatrixTaskProgressHandler = null;
                    this.crowdInsightRunContext = null;
                }
                this.flushPendingCrowdMatrixMetricReload();
            }
        },

        async reloadCrowdMatrixMetric({ campaignId, metricType }) {
            const id = PlanIdentityUtils.normalizeCampaignId(campaignId);
            const metric = this.normalizeCrowdMetricType(metricType);
            if (!id || !metric) return;
            if (this.crowdMatrixLoading) {
                this.scheduleCrowdMatrixMetricReload(id, metric);
                return;
            }
            const hasExistingDataset = this.crowdMatrixDataset
                && this.crowdMatrixLoadedCampaignId === id
                && this.crowdMatrixResultMap instanceof Map
                && this.crowdMatrixResultMap.size > 0;
            if (!hasExistingDataset) {
                this.runCrowdMatrixLoad({ campaignId: id, forceRefreshItems: false });
                return;
            }

            const runId = ++this.crowdMatrixRunId;
            this.crowdMatrixLoading = true;
            this.crowdMatrixPendingMetricReload = null;
            this.crowdMatrixProgress = 0;
            this.crowdInsightRunContext = null;
            this.crowdRequestSlotPromise = Promise.resolve();
            this.crowdRequestLastAt = 0;
            const metricMeta = this.getCrowdMetricMeta(metric);
            this.setCrowdMatrixStatus(`正在刷新${metricMeta.seriesLabel}...`, 'loading', { showRetry: false, progress: 0 });
            try {
                const taskFns = this.CROWD_PERIODS.map((periodDays) => {
                    const task = async () => this.queryCrowdInsight({ campaignId: id, metricType: metric, periodDays });
                    task.__amCrowdTaskLabel = `${metricMeta.seriesLabel} · 过去${periodDays}天`;
                    return task;
                });
                const totalTaskCount = taskFns.length;
                this.crowdMatrixTaskProgressHandler = (progressInfo) => {
                    if (runId !== this.crowdMatrixRunId) return;
                    const done = Math.max(0, Math.min(totalTaskCount, Number(progressInfo?.done) || 0));
                    const status = String(progressInfo?.status || '').trim();
                    const taskLabel = String(progressInfo?.label || '').trim();
                    const stepText = status === 'fulfilled' ? '完成' : '失败';
                    const detailText = taskLabel ? `${stepText} ${taskLabel}` : `${stepText}一项请求`;
                    const ratio = totalTaskCount > 0 ? (done / totalTaskCount) * 100 : 0;
                    this.setCrowdMatrixStatus(`刷新中 ${done}/${totalTaskCount} · ${detailText}`, 'loading', { showRetry: false, progress: ratio });
                };
                const settled = await this.runTasksWithConcurrency(taskFns, this.CROWD_REQUEST_CONCURRENCY);
                if (runId !== this.crowdMatrixRunId) return;

                const successResults = [];
                let failCount = 0;
                const unsupportedReasonSet = new Set();
                settled.forEach((item) => {
                    if (item.status === 'fulfilled' && item.value) {
                        successResults.push(item.value);
                        const reason = String(item.value?.rawMeta?.unsupportedReason || '').trim();
                        if (reason) unsupportedReasonSet.add(reason);
                    } else {
                        failCount += 1;
                    }
                });
                const mergedResults = this.replaceCrowdMatrixMetricResults(metric, successResults);
                const dataset = this.buildMatrixDataset(mergedResults);
                this.crowdMatrixDataset = dataset;
                this.crowdMatrixLoadedCampaignId = id;
                this.renderCrowdMatrixCharts(dataset);
                if (!successResults.length) {
                    this.setCrowdMatrixStatus(`刷新${metricMeta.seriesLabel}失败，请稍后重试`, 'error', { showRetry: true, progress: 100 });
                    return;
                }
                const unsupportedNotice = Array.from(unsupportedReasonSet).filter(Boolean).join('；');
                if (failCount > 0) {
                    this.setCrowdMatrixStatus(`${metricMeta.seriesLabel}已刷新（失败 ${failCount}/${totalTaskCount}）${unsupportedNotice ? `；${unsupportedNotice}` : ''}`, 'warn', {
                        showRetry: true,
                        progress: 100,
                        autoHide: true
                    });
                } else if (unsupportedNotice) {
                    this.setCrowdMatrixStatus(`${metricMeta.seriesLabel}已刷新；${unsupportedNotice}`, 'warn', {
                        showRetry: false,
                        progress: 100,
                        autoHide: true
                    });
                } else {
                    this.setCrowdMatrixStatus(`${metricMeta.seriesLabel}已刷新`, 'success', {
                        showRetry: false,
                        progress: 100,
                        autoHide: true
                    });
                }
            } catch (err) {
                if (runId !== this.crowdMatrixRunId) return;
                this.setCrowdMatrixStatus(`刷新${metricMeta.seriesLabel}失败：${err?.message || '未知错误'}`, 'error', { showRetry: true, progress: this.crowdMatrixProgress || 0 });
            } finally {
                if (runId === this.crowdMatrixRunId) {
                    this.crowdMatrixLoading = false;
                    this.crowdMatrixTaskProgressHandler = null;
                    this.crowdInsightRunContext = null;
                }
                this.flushPendingCrowdMatrixMetricReload();
            }
        },

        ensureCrowdMatrixLoaded(forceReload = false) {
            if (this.crowdMatrixLoading) return;
            const campaignId = this.getCurrentCampaignId();
            this.refreshCrowdMatrixCampaignMeta(campaignId || this.lastCampaignId);
            if (!campaignId) {
                this.setCrowdMatrixStatus('未识别到当前计划ID，请先进入计划详情页或勾选计划', 'error', { showRetry: false, progress: 0 });
                return;
            }
            if (!forceReload && this.crowdMatrixDataset && this.crowdMatrixLoadedCampaignId === campaignId) {
                this.renderCrowdMatrixCharts(this.crowdMatrixDataset);
                this.setCrowdMatrixStatus('已展示最近一次加载结果', 'success', { showRetry: false, progress: 100, autoHide: true, hideDelayMs: 800 });
                return;
            }
            this.runCrowdMatrixLoad({ campaignId, forceRefreshItems: forceReload });
        },

        /**
         * 在 iframe 中清理非核心元素
         * 策略：找到目标元素，沿父级链向上，隐藏每一层的兄弟节点
         */
        cleanupIframe(iframeDoc) {
            const target = iframeDoc.getElementById('universalBP_common_layout_main_content');
            if (!target) {
                Logger.warn('🔮 未找到 #universalBP_common_layout_main_content，跳过清理');
                return;
            }

            // 沿父级链向上，隐藏每一级的兄弟节点
            let current = target;
            while (current && current !== iframeDoc.body) {
                const parent = current.parentElement;
                if (parent) {
                    Array.from(parent.children).forEach(child => {
                        if (child !== current && child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE' && child.tagName !== 'LINK') {
                            child.style.setProperty('display', 'none', 'important');
                        }
                    });
                }
                current = parent;
            }

            // 注入基础 CSS
            const style = iframeDoc.createElement('style');
            style.id = 'am-cleanup-css';
            style.textContent = MagicReport.CLEANUP_CSS;
            iframeDoc.head.appendChild(style);

            Logger.info('🔮 万能查数 iframe 清理完成');
        },

        createPopup() {
            if (this.popup instanceof HTMLElement && this.popup.isConnected) return;
            this.popup = null;

            const stalePopup = document.getElementById('am-magic-report-popup');
            if (stalePopup instanceof HTMLElement) stalePopup.remove();
            const staleStyle = document.getElementById('am-magic-report-popup-style');
            if (staleStyle instanceof HTMLElement) staleStyle.remove();

            const div = document.createElement('div');
            div.id = 'am-magic-report-popup';
            div.style.cssText = `
                position: fixed; top: 30px; left: 50%; transform: translateX(-50%);
                z-index: 1000001; border-radius: 18px;
                width: 900px; height: 85vh;
                display: none; overflow: hidden;
                flex-direction: column;
                font-family: var(--am26-font);
            `;

            const style = document.createElement('style');
            style.textContent = `
                #am-magic-report-popup .am-magic-header {
                    padding: 10px 20px 10px;
                    display: flex; flex-direction: column; gap: 8px;
                    cursor: move; border-bottom: 1px solid var(--am26-border);
                    flex-shrink: 0;
                }
                #am-magic-report-popup .am-magic-header .am-magic-header-main {
                    display: flex; justify-content: space-between; align-items: center;
                    width: 100%;
                }
                #am-magic-report-popup .am-magic-header .am-title-area {
                    display: flex; align-items: center;
                }
                #am-magic-report-popup .am-magic-header .am-title-area .asiYysqLCh {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    max-width: 560px;
                }
                #am-magic-report-popup .am-magic-header .am-title-area .asiYysqLCt {
                    width: 18px;
                    height: 18px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 0;
                    flex-shrink: 0;
                }
                #am-magic-report-popup .am-magic-header .am-title-area .asiYysqLCt img {
                    position: relative;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    display: block;
                    object-fit: contain;
                }
                #am-magic-report-popup .am-magic-header .am-title-area .asiYysqLCj {
                    color: #333;
                    font-size: 13px;
                    font-weight: 600;
                    line-height: 1.45;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                #am-magic-report-popup .am-magic-header .am-btn-group {
                    display: flex; align-items: center; gap: 4px; border-left: 1px solid rgba(0,0,0,0.06); padding-left: 12px;
                }
                #am-magic-report-popup .am-magic-header .am-btn-group span {
                    width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center;
                    border-radius: 8px; color: #666; font-size: 18px; transition: all 0.2s;
                }
                #am-magic-report-popup .am-magic-header .am-btn-group #am-magic-refresh {
                    font-size: 20px; font-weight: bold;
                }
                #am-magic-report-popup .am-magic-header .am-btn-group span:hover {
                    background: rgba(0,0,0,0.05); color: var(--am26-primary);
                }
                #am-magic-report-popup .am-magic-header .am-btn-group #am-magic-close:hover {
                    background: rgba(234, 79, 79, 0.1); color: var(--am26-danger);
                }
                #am-magic-report-popup .am-magic-header .am-quick-prompts {
                    display: flex; flex-wrap: wrap; gap: 6px; cursor: default;
                }
                #am-magic-report-popup .am-magic-header .am-quick-prompt {
                    border: 1px solid var(--am26-border); background: var(--am26-surface); color: var(--am26-text-soft);
                    border-radius: 999px; padding: 4px 12px; font-size: 11px; font-weight: 500;
                    line-height: 1.4; cursor: pointer; transition: all 0.2s;
                    max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                    display: flex; align-items: center; gap: 4px;
                }
                #am-magic-report-popup .am-magic-header .am-quick-prompt:hover {
                    background: rgba(42, 91, 255, 0.12); border-color: rgba(42, 91, 255, 0.34); color: var(--am26-primary);
                    transform: translateY(-1px);
                }
                #am-magic-report-popup .am-magic-header .am-quick-prompt.type-action {
                    background: rgba(255, 159, 24, 0.1); border-color: rgba(255, 159, 24, 0.3); color: #d48806;
                }
                #am-magic-report-popup .am-magic-header .am-quick-prompt.type-action:hover {
                    background: rgba(255, 159, 24, 0.2); border-color: rgba(255, 159, 24, 0.5); color: #ad6800;
                }
                #am-magic-report-popup .am-magic-header .am-quick-prompt.active {
                    background: rgba(42, 91, 255, 0.16); border-color: rgba(42, 91, 255, 0.44); color: var(--am26-primary-strong);
                }
                #am-magic-report-popup .am-magic-header .am-magic-view-meta {
                    display: flex;
                    align-items: flex-end;
                    gap: 10px;
                    min-width: 0;
                }
                #am-magic-report-popup .am-magic-header .am-magic-view-tabs {
                    display: inline-flex;
                    align-items: center;
                    align-self: auto;
                    flex-shrink: 0;
                    gap: 4px;
                    padding: 4px;
                    border-radius: 20px;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(245, 250, 255, 0.85));
                    border: 1px solid rgba(255, 255, 255, 0.68);
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.56), 0 4px 12px rgba(15, 23, 42, 0.06);
                    backdrop-filter: blur(8px);
                    cursor: default;
                }
                #am-magic-report-popup .am-magic-header .am-magic-view-tab {
                    position: relative;
                    border: none;
                    background: transparent;
                    color: #6b7280;
                    border-radius: 16px;
                    padding: 7px 22px 7px 16px;
                    min-height: 34px;
                    font-size: 13px;
                    font-weight: 600;
                    line-height: 1;
                    cursor: pointer;
                    transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                #am-magic-report-popup .am-magic-header .am-magic-view-tab .am-magic-view-tab-label {
                    white-space: nowrap;
                }
                #am-magic-report-popup .am-magic-header .am-magic-view-tab .am-magic-view-default-icon {
                    position: absolute;
                    right: 5px;
                    top: 3px;
                    width: 14px;
                    height: 14px;
                    border-radius: 999px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    line-height: 1;
                    color: #7f8798;
                    background: rgba(31, 41, 55, 0.08);
                    opacity: 0;
                    transition: opacity 0.2s ease, color 0.2s ease, background 0.2s ease;
                }
                #am-magic-report-popup .am-magic-header .am-magic-view-tab:focus-visible {
                    outline: 2px solid rgba(37, 99, 235, 0.45);
                    outline-offset: 1px;
                }
                #am-magic-report-popup .am-magic-header .am-magic-view-tab:hover {
                    color: #404756;
                    background: rgba(255, 255, 255, 0.42);
                }
                #am-magic-report-popup .am-magic-header .am-magic-view-tab.active {
                    background: rgba(255, 255, 255, 0.88);
                    color: #111827;
                    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.7);
                    font-weight: 700;
                }
                #am-magic-report-popup .am-magic-header .am-magic-view-tab.is-default-view .am-magic-view-default-icon {
                    color: #2563eb;
                    background: rgba(37, 99, 235, 0.16);
                }
                #am-magic-report-popup .am-magic-header .am-magic-view-tab:hover .am-magic-view-default-icon,
                #am-magic-report-popup .am-magic-header .am-magic-view-tab:focus-visible .am-magic-view-default-icon,
                #am-magic-report-popup .am-magic-header .am-magic-view-tab.is-default-view .am-magic-view-default-icon {
                    opacity: 1;
                }
                #am-magic-report-popup .am-magic-content {
                    position: relative; flex: 1; min-height: 0;
                    background: rgba(255, 255, 255, 0.4);
                    backdrop-filter: blur(10px);
                }
                #am-magic-report-popup .am-magic-content-matrix {
                    display: none;
                    flex-direction: column;
                    gap: 10px;
                    padding: 10px 12px 12px;
                    overflow: hidden;
                }
                #am-magic-report-popup .am-iframe-loading {
                    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    display: flex; flex-direction: column; align-items: center; gap: 12px;
                    color: var(--am26-primary); font-size: 14px;
                }
                #am-magic-report-popup .am-iframe-loading .am-spinner {
                    width: 32px; height: 32px; border: 3px solid rgba(42, 91, 255, 0.18);
                    border-top-color: var(--am26-primary); border-radius: 50%;
                    animation: am-spin 0.8s linear infinite;
                }
                #am-magic-report-popup .am-crowd-matrix-state {
                    --am-crowd-progress: 0%;
                    font-size: 12px;
                    font-weight: 600;
                    line-height: 1.45;
                    color: #4a5674;
                    background: rgba(255, 255, 255, 0.6);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(42, 91, 255, 0.16);
                    border-radius: 12px;
                    padding: 8px 12px;
                    position: relative;
                    overflow: hidden;
                    isolation: isolate;
                    box-shadow: 0 2px 10px rgba(42, 91, 255, 0.04);
                }
                #am-magic-report-popup .am-crowd-matrix-state.is-hidden {
                    display: none;
                }
                #am-magic-report-popup .am-crowd-matrix-state::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: var(--am-crowd-progress, 0%);
                    background: linear-gradient(90deg, rgba(42, 91, 255, 0.15), rgba(42, 91, 255, 0.25));
                    transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 0.3s ease;
                    pointer-events: none;
                }
                #am-magic-report-popup .am-crowd-matrix-state .am-crowd-matrix-state-text {
                    position: relative;
                    z-index: 1;
                    display: block;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                #am-magic-report-popup .am-crowd-matrix-campaign {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    min-width: 0;
                    max-width: 100%;
                    font-size: 11px;
                    line-height: 1.2;
                    font-weight: 600;
                    color: #1a2a47;
                    background: rgba(255, 255, 255, 0.9);
                    border: 1px solid transparent;
                    border-radius: 999px;
                    padding: 5px 12px;
                    box-shadow: 0 2px 6px rgba(31, 53, 109, 0.06);
                    white-space: nowrap;
                    overflow: hidden;
                }
                #am-magic-report-popup .am-crowd-matrix-campaign-part {
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                #am-magic-report-popup .am-crowd-matrix-campaign-sep {
                    color: #7f8ca9;
                    flex: 0 0 auto;
                }
                #am-magic-report-popup .am-crowd-matrix-item-select-wrap {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    min-width: 0;
                }
                #am-magic-report-popup .am-crowd-matrix-item-label {
                    color: #3f4e6f;
                    flex: 0 0 auto;
                }
                #am-magic-report-popup .am-crowd-matrix-item-select {
                    min-width: 116px;
                    max-width: min(320px, 42vw);
                    height: 22px;
                    border-radius: 8px;
                    border: 1px solid rgba(42, 91, 255, 0.24);
                    background: rgba(255, 255, 255, 0.98);
                    color: #1a2a47;
                    font-size: 11px;
                    line-height: 1.2;
                    font-weight: 600;
                    padding: 0 6px;
                    outline: none;
                    box-shadow: inset 0 1px 2px rgba(42, 91, 255, 0.08);
                }
                #am-magic-report-popup .am-crowd-matrix-item-select:disabled {
                    cursor: not-allowed;
                    opacity: 0.62;
                }
                #am-magic-report-popup .am-crowd-matrix-state.is-loading {
                    color: #2a5bff;
                    border-color: rgba(42, 91, 255, 0.3);
                }
                #am-magic-report-popup .am-crowd-matrix-state.is-success {
                    color: #237804;
                    border-color: rgba(82, 196, 26, 0.34);
                    background: rgba(246, 255, 237, 0.6);
                }
                #am-magic-report-popup .am-crowd-matrix-state.is-success::before {
                    background: linear-gradient(90deg, rgba(82, 196, 26, 0.15), rgba(82, 196, 26, 0.25));
                }
                #am-magic-report-popup .am-crowd-matrix-state.is-warn {
                    color: #ad6800;
                    border-color: rgba(250, 140, 22, 0.34);
                    background: rgba(255, 251, 230, 0.6);
                }
                #am-magic-report-popup .am-crowd-matrix-state.is-warn::before {
                    background: linear-gradient(90deg, rgba(250, 140, 22, 0.15), rgba(250, 140, 22, 0.25));
                }
                #am-magic-report-popup .am-crowd-matrix-state.is-error {
                    color: #cf1322;
                    border-color: rgba(234, 79, 79, 0.34);
                    background: rgba(255, 241, 240, 0.6);
                }
                #am-magic-report-popup .am-crowd-matrix-state.is-error::before {
                    background: linear-gradient(90deg, rgba(234, 79, 79, 0.15), rgba(234, 79, 79, 0.25));
                }
                #am-magic-report-popup .am-crowd-matrix-toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                    padding: 4px 8px 12px;
                }
                #am-magic-report-popup .am-crowd-matrix-legend-global {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    align-items: center;
                }
                #am-magic-report-popup .am-crowd-matrix-legend-group {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    align-items: center;
                    background: rgba(255, 255, 255, 0.6);
                    padding: 4px 10px;
                    border-radius: 999px;
                    box-shadow: inset 0 1px 3px rgba(31, 53, 109, 0.05);
                }
                #am-magic-report-popup .am-crowd-matrix-legend-divider {
                    color: #b2b8c9;
                    font-size: 12px;
                    line-height: 1;
                    font-weight: 700;
                    user-select: none;
                    margin: 0 2px;
                }
                #am-magic-report-popup .am-crowd-matrix-legend-toggle {
                    border: 1px solid transparent;
                    background: rgba(255, 255, 255, 0.9);
                    color: #1a2a47;
                    border-radius: 999px;
                    font-size: 11px;
                    line-height: 1.2;
                    font-weight: 600;
                    cursor: pointer;
                    padding: 5px 12px;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    box-shadow: 0 2px 6px rgba(31, 53, 109, 0.06);
                    transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
                }
                #am-magic-report-popup .am-crowd-matrix-legend-toggle i {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    display: inline-block;
                    background: var(--am-crowd-legend-color, #2f54eb);
                    box-shadow: 0 0 6px var(--am-crowd-legend-color);
                }
                #am-magic-report-popup .am-crowd-matrix-legend-toggle:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 14px rgba(31, 53, 109, 0.12);
                    border-color: color-mix(in srgb, var(--am-crowd-legend-color) 40%, transparent);
                }
                #am-magic-report-popup .am-crowd-matrix-legend-toggle.is-off {
                    opacity: 0.5;
                    border-color: transparent;
                    box-shadow: none;
                    background: transparent;
                }
                #am-magic-report-popup .am-crowd-matrix-actions {
                    display: flex;
                    justify-content: flex-end;
                }
                #am-magic-report-popup .am-crowd-matrix-retry {
                    display: none;
                    border: none;
                    background: linear-gradient(135deg, rgba(42, 91, 255, 0.1), rgba(42, 91, 255, 0.05));
                    color: var(--am26-primary);
                    font-weight: 600;
                    border-radius: 8px;
                    font-size: 12px;
                    line-height: 1.2;
                    cursor: pointer;
                    padding: 6px 16px;
                    transition: all 0.2s ease;
                }
                #am-magic-report-popup .am-crowd-matrix-retry:hover {
                    background: rgba(42, 91, 255, 0.15);
                    transform: scale(1.02);
                }
                #am-magic-report-popup .am-crowd-matrix-grid {
                    flex: 1;
                    min-height: 120px;
                    overflow: auto;
                    border: 1px solid rgba(255, 255, 255, 0.4);
                    border-radius: 16px;
                    background: linear-gradient(145deg, rgba(246, 250, 255, 0.75) 0%, rgba(235, 243, 255, 0.5) 100%);
                    backdrop-filter: blur(12px);
                    box-shadow: 0 8px 32px rgba(31, 53, 109, 0.06), inset 0 2px 4px rgba(255, 255, 255, 0.6);
                }
                #am-magic-report-popup .am-crowd-matrix-table {
                    display: grid;
                    grid-template-columns: max-content repeat(var(--am-crowd-matrix-data-cols, 4), minmax(0, 1fr));
                    gap: 12px;
                    padding: 12px;
                    width: 100%;
                    min-width: 0;
                }
                #am-magic-report-popup .am-crowd-matrix-cell {
                    border: 1px solid rgba(255, 255, 255, 0.8);
                    border-radius: 14px;
                    background: rgba(255, 255, 255, 0.65);
                    backdrop-filter: blur(8px);
                    box-shadow: 0 4px 12px rgba(31, 53, 109, 0.03);
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                }
                #am-magic-report-popup .am-crowd-matrix-cell:hover {
                    background: rgba(255, 255, 255, 0.85);
                    box-shadow: 0 8px 20px rgba(31, 53, 109, 0.06);
                }
                #am-magic-report-popup .am-crowd-matrix-header {
                    font-size: 13px;
                    font-weight: 700;
                    color: #1a2a47;
                    padding: 12px 14px;
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    position: sticky;
                    top: 0;
                    z-index: 4;
                    box-shadow: 0 2px 6px rgba(42, 91, 255, 0.05);
                }
                #am-magic-report-popup .am-crowd-matrix-corner {
                    justify-content: center;
                    z-index: 6;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(245, 250, 255, 0.85));
                    border-bottom-right-radius: 0;
                }
                #am-magic-report-popup .am-crowd-matrix-row-header {
                    font-size: 13px;
                    color: #1a2a47;
                    padding: 14px 12px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(8px);
                    position: sticky;
                    left: 0;
                    z-index: 3;
                    box-shadow: 2px 0 6px rgba(31, 53, 109, 0.04);
                }
                #am-magic-report-popup .am-crowd-matrix-cell-chart {
                    padding: 14px;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    min-height: clamp(228px, 26vh, 340px);
                }
                #am-magic-report-popup .am-crowd-matrix-cell-chart.is-horizontal-scroll {
                    overflow-x: auto;
                    overflow-y: hidden;
                    scrollbar-gutter: stable both-edges;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(96, 119, 161, 0.45) transparent;
                    cursor: grab;
                }
                #am-magic-report-popup .am-crowd-matrix-cell-chart.is-horizontal-scroll.is-dragging {
                    cursor: grabbing;
                    user-select: none;
                }
                #am-magic-report-popup .am-crowd-matrix-cell-chart.is-horizontal-scroll::-webkit-scrollbar {
                    height: 8px;
                }
                #am-magic-report-popup .am-crowd-matrix-cell-chart.is-horizontal-scroll::-webkit-scrollbar-thumb {
                    background: rgba(96, 119, 161, 0.45);
                    border-radius: 999px;
                }
                #am-magic-report-popup .am-crowd-matrix-cell-chart.is-horizontal-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                #am-magic-report-popup .am-crowd-matrix-empty {
                    margin: auto 0;
                    font-size: 12px;
                    color: #95a0b9;
                    text-align: center;
                    padding: 16px 0;
                    font-weight: 600;
                }
                #am-magic-report-popup .am-crowd-matrix-chart {
                    display: grid;
                    grid-template-columns: repeat(var(--am-crowd-label-count, 1), minmax(0, 1fr));
                    align-items: end;
                    gap: 8px;
                    min-height: clamp(150px, 18vh, 230px);
                    overflow: visible;
                    padding: 12px 6px 6px;
                    border-radius: 10px;
                    background-image:
                        linear-gradient(to top, rgba(120, 144, 193, 0.08) 1px, transparent 1px),
                        linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, rgba(235, 244, 255, 0.3) 100%);
                    background-size: 100% 25%, 100% 100%;
                    box-shadow: inset 0 2px 8px rgba(31, 53, 109, 0.02);
                }
                #am-magic-report-popup .am-crowd-matrix-cell-chart.is-horizontal-scroll .am-crowd-matrix-chart {
                    min-width: calc(var(--am-crowd-label-count, 1) * var(--am-crowd-label-min-width, 58px));
                }
                #am-magic-report-popup .am-crowd-matrix-bar-group {
                    min-width: 0;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 5px;
                    position: relative;
                }
                #am-magic-report-popup .am-crowd-matrix-bar-group + .am-crowd-matrix-bar-group::before {
                    content: '';
                    position: absolute;
                    left: -5px;
                    top: 8px;
                    bottom: 22px;
                    width: 1px;
                    border-radius: 999px;
                    pointer-events: none;
                    background: linear-gradient(180deg, rgba(127, 140, 169, 0), rgba(127, 140, 169, 0.16), rgba(127, 140, 169, 0));
                }
                #am-magic-report-popup .am-crowd-matrix-bar-columns {
                    --am-crowd-visible-metrics: var(--am-crowd-metric-visible-count, 4);
                    --am-crowd-bar-gap: 5px;
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                    gap: var(--am-crowd-bar-gap);
                    width: 100%;
                    height: clamp(120px, 16vh, 200px);
                }
                #am-magic-report-popup .am-crowd-matrix-bar {
                    width: clamp(
                        8px,
                        calc((100% - (var(--am-crowd-visible-metrics) - 1) * var(--am-crowd-bar-gap)) / var(--am-crowd-visible-metrics)),
                        36px
                    );
                    height: 100%;
                    border-radius: 0;
                    background: none;
                    position: relative;
                    overflow: visible;
                    border: none;
                    box-shadow: none;
                    transition: width 0.25s ease;
                }
                #am-magic-report-popup .am-crowd-matrix-bar.is-hover .am-crowd-matrix-bar-fill {
                    filter: brightness(1.15) saturate(1.1);
                    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8), 0 6px 16px var(--am-crowd-bar-color);
                    transform: scaleY(1.02);
                }
                #am-magic-report-popup .am-crowd-matrix-bar.is-nodata {
                    opacity: 0.55;
                }
                #am-magic-report-popup .am-crowd-matrix-bar-fill {
                    position: absolute;
                    left: 0;
                    bottom: 0;
                    transform-origin: bottom center;
                    width: 100%;
                    min-height: 0;
                    border-top-left-radius: 6px;
                    border-top-right-radius: 6px;
                    border-bottom-left-radius: 2px;
                    border-bottom-right-radius: 2px;
                    background: linear-gradient(180deg, var(--am-crowd-bar-color), color-mix(in srgb, var(--am-crowd-bar-color) 70%, transparent));
                    box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.4), 0 2px 8px rgba(31, 53, 109, 0.08);
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                }
                #am-magic-report-popup .am-crowd-matrix-bar-ratio {
                    position: absolute;
                    left: 50%;
                    top: -18px;
                    transform: translateX(-50%) translateY(4px);
                    font-size: 10px;
                    line-height: 1;
                    font-weight: 700;
                    color: #30406a;
                    white-space: nowrap;
                    opacity: 0;
                    visibility: hidden;
                    pointer-events: none;
                    transition: opacity 0.2s ease, transform 0.2s ease;
                }
                #am-magic-report-popup .am-crowd-matrix-grid.am-show-ratio-values .am-crowd-matrix-bar-ratio {
                    opacity: 1;
                    visibility: visible;
                    transform: translateX(-50%) translateY(0);
                }
                #am-magic-report-popup .am-crowd-matrix-grid.am-hide-insights .am-crowd-matrix-insights {
                    display: none !important;
                }
                #am-magic-report-popup .am-crowd-matrix-grid.am-hide-insights .am-crowd-matrix-cell-chart {
                    min-height: clamp(186px, 22vh, 276px);
                    gap: 10px;
                }
                #am-magic-report-popup .am-crowd-matrix-grid.am-hide-insights .am-crowd-matrix-chart {
                    min-height: clamp(136px, 17vh, 208px);
                }
                #am-magic-report-popup .am-crowd-matrix-xlabel {
                    max-width: 100%;
                    text-align: center;
                    font-size: 11px;
                    font-weight: 600;
                    color: #4a5674;
                    line-height: 1.2;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                #am-magic-report-popup .am-crowd-matrix-chart.is-dense {
                    gap: 6px;
                }
                #am-magic-report-popup .am-crowd-matrix-chart.is-dense .am-crowd-matrix-bar-columns {
                    --am-crowd-bar-gap: 3px;
                }
                #am-magic-report-popup .am-crowd-matrix-chart.is-dense .am-crowd-matrix-bar {
                    width: clamp(
                        6px,
                        calc((100% - (var(--am-crowd-visible-metrics) - 1) * var(--am-crowd-bar-gap)) / var(--am-crowd-visible-metrics)),
                        28px
                    );
                }
                #am-magic-report-popup .am-crowd-matrix-chart.is-dense .am-crowd-matrix-xlabel {
                    font-size: 10px;
                }
                #am-magic-report-popup .am-crowd-matrix-chart.is-dense .am-crowd-matrix-bar-ratio {
                    font-size: 9px;
                    top: -16px;
                }
                #am-magic-report-popup .am-crowd-matrix-chart.is-ultra-dense .am-crowd-matrix-bar {
                    width: clamp(
                        5px,
                        calc((100% - (var(--am-crowd-visible-metrics) - 1) * var(--am-crowd-bar-gap)) / var(--am-crowd-visible-metrics)),
                        22px
                    );
                }
                #am-magic-report-popup .am-crowd-matrix-chart.is-ultra-dense .am-crowd-matrix-bar-ratio {
                    font-size: 8px;
                    top: -14px;
                }
                #am-magic-report-popup .am-crowd-matrix-chart.is-ultra-dense .am-crowd-matrix-xlabel {
                    font-size: 9px;
                }
                #am-magic-report-popup .am-crowd-matrix-insights {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr);
                    gap: 6px;
                }
                #am-magic-report-popup .am-crowd-matrix-insight-item {
                    min-height: 28px;
                    border-radius: 10px;
                    border: 1px solid color-mix(in srgb, var(--am-crowd-insight-color) 30%, transparent);
                    background: color-mix(in srgb, var(--am-crowd-insight-color) 8%, transparent);
                    color: color-mix(in srgb, var(--am-crowd-insight-color) 90%, #000);
                    font-size: 11px;
                    font-weight: 600;
                    line-height: 1.25;
                    padding: 5px 8px;
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    text-align: left;
                    box-shadow: 0 2px 6px color-mix(in srgb, var(--am-crowd-insight-color) 12%, transparent);
                    transition: all 0.2s ease;
                }
                #am-magic-report-popup .am-crowd-matrix-insight-item:hover {
                    background: color-mix(in srgb, var(--am-crowd-insight-color) 15%, transparent);
                    box-shadow: 0 4px 12px color-mix(in srgb, var(--am-crowd-insight-color) 25%, transparent);
                    transform: translateY(-2px);
                }
                #am-magic-report-popup .am-crowd-matrix-note {
                    margin-top: auto;
                    font-size: 10px;
                    line-height: 1.3;
                    font-weight: 600;
                    color: #a88231;
                    background: rgba(250, 173, 20, 0.1);
                    border: 1px solid rgba(250, 173, 20, 0.25);
                    border-radius: 8px;
                    padding: 6px 10px;
                    box-shadow: 0 2px 4px rgba(250, 173, 20, 0.05);
                }
                #am-magic-report-popup .am-crowd-matrix-hover-tip {
                    position: absolute;
                    left: 0;
                    top: 0;
                    z-index: 40;
                    pointer-events: none;
                    max-width: min(560px, calc(100vw - 48px));
                    border-radius: 12px;
                    background: linear-gradient(145deg, rgba(248, 252, 255, 0.95) 0%, rgba(238, 246, 255, 0.92) 100%);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.82);
                    color: #56647d;
                    font-size: 12px;
                    line-height: 1.45;
                    font-weight: 600;
                    padding: 8px 12px;
                    box-shadow: 0 8px 24px rgba(31, 53, 109, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.62);
                    white-space: pre-wrap;
                    font-family: var(--am26-font, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif);
                    font-variant-numeric: tabular-nums;
                    font-feature-settings: "tnum" 1;
                }
                #am-magic-report-popup .am-crowd-matrix-hover-tip-header {
                    margin-bottom: 4px;
                    white-space: pre-wrap;
                }
                #am-magic-report-popup .am-crowd-matrix-hover-tip-table {
                    display: grid;
                    row-gap: 2px;
                }
                #am-magic-report-popup .am-crowd-matrix-hover-tip-row {
                    display: grid;
                    grid-template-columns: var(--am-crowd-hover-grid-template, 6ch 7ch 1ch 3ch 5ch 6ch max-content);
                    column-gap: 8px;
                    align-items: baseline;
                }
                #am-magic-report-popup .am-crowd-matrix-hover-tip-row-metrics {
                    margin-bottom: 4px;
                    padding-bottom: 2px;
                    border-bottom: 1px dashed rgba(31, 53, 109, 0.12);
                    color: #6c7890;
                }
                #am-magic-report-popup .am-crowd-matrix-hover-tip-col {
                    white-space: nowrap;
                }
                #am-magic-report-popup .am-crowd-matrix-hover-tip-col-metric-label {
                    justify-self: center;
                    text-align: center;
                    font-weight: 700;
                }
                #am-magic-report-popup .am-crowd-matrix-hover-tip-col-ratio,
                #am-magic-report-popup .am-crowd-matrix-hover-tip-col-diff,
                #am-magic-report-popup .am-crowd-matrix-hover-tip-col-count,
                #am-magic-report-popup .am-crowd-matrix-hover-tip-col-compare-ratio,
                #am-magic-report-popup .am-crowd-matrix-hover-tip-col-compare-count {
                    justify-self: end;
                    text-align: right;
                }
                #am-magic-report-popup .am-crowd-matrix-hover-tip-col-compare-ratio,
                #am-magic-report-popup .am-crowd-matrix-hover-tip-col-compare-count {
                    color: #56647d;
                }
                #am-magic-report-popup .am-crowd-matrix-hover-tip-col-flag {
                    color: #7f8aa0;
                }
                #am-magic-report-popup .am-crowd-matrix-hover-tip-line {
                    white-space: pre;
                }
                #am-magic-report-popup .am-crowd-matrix-hover-tip-diff {
                    font-weight: 700;
                }
                #am-magic-report-popup .am-crowd-matrix-hover-tip-diff.is-empty {
                    color: transparent;
                }
                #am-magic-report-popup .am-crowd-matrix-hover-tip-diff.is-pos {
                    color: #0f766e;
                }
                #am-magic-report-popup .am-crowd-matrix-hover-tip-diff.is-neg {
                    color: #b42318;
                }
                #am-magic-report-popup .am-crowd-matrix-hover-tip-diff.is-neutral {
                    color: #a16207;
                }
                #am-magic-report-popup .am-crowd-matrix-grid.am-hide-metric-click .am-crowd-matrix-bar[data-metric="click"],
                #am-magic-report-popup .am-crowd-matrix-grid.am-hide-metric-click .am-crowd-matrix-insight-item[data-metric="click"],
                #am-magic-report-popup .am-crowd-matrix-grid.am-hide-metric-cart .am-crowd-matrix-bar[data-metric="cart"],
                #am-magic-report-popup .am-crowd-matrix-grid.am-hide-metric-cart .am-crowd-matrix-insight-item[data-metric="cart"],
                #am-magic-report-popup .am-crowd-matrix-grid.am-hide-metric-deal .am-crowd-matrix-bar[data-metric="deal"],
                #am-magic-report-popup .am-crowd-matrix-grid.am-hide-metric-deal .am-crowd-matrix-insight-item[data-metric="deal"],
                #am-magic-report-popup .am-crowd-matrix-grid.am-hide-metric-itemdeal .am-crowd-matrix-bar[data-metric="itemdeal"],
                #am-magic-report-popup .am-crowd-matrix-grid.am-hide-metric-itemdeal .am-crowd-matrix-insight-item[data-metric="itemdeal"] {
                    display: none !important;
                }
                @keyframes am-spin { to { transform: rotate(360deg); } }
            `;
            style.id = 'am-magic-report-popup-style';
            document.head.appendChild(style);

            const quickPromptHtml = this.QUICK_PROMPTS
                .map((item, idx) => {
                    const typeClass = item.type === 'action' ? 'type-action' : 'type-query';
                    return `<button type="button" class="am-quick-prompt ${typeClass}" data-index="${idx}" title="${item.value}">${this.resolvePromptLabel(item)}</button>`;
                })
                .join('');

            div.innerHTML = `
                <div class="am-magic-header">
                    <div class="am-magic-header-main">
                        <div class="am-title-area">
                            <div mxv="" class="asiYysqLCh mxgc-highlight-texts" style="--mx-title-shadow-color: var(--mx-ai-color); --mx-title-shadow-color-gradient: var(--mx-ai-color-gradient);">
                                <span mxs="asiYysqLa:_" class="asiYysqLCt">
                                    <img src="https://img.alicdn.com/imgextra/i4/O1CN015N7XhL24rrnhJGD58_!!6000000007445-2-tps-1040-1040.png" alt="万能查数">
                                </span>
                                <span class="asiYysqLCj asiYysqLCl font-special asiYysqLCm">万能查数输入您想要了解的数据，小万帮您收集</span>
                            </div>
                        </div>
                        <div class="am-btn-group">
                            <span id="am-magic-refresh" title="刷新">
                                <svg viewBox="0 0 1024 1024" style="width:0.65em;height:0.65em;vertical-align:middle;fill:currentColor;overflow:hidden;"><path d="M959.667298 800.651143l-33.843806-157.556409c-0.064468-0.224104 0-0.388856-0.029676-0.587378l-2.611477-10.637268c-1.434675-5.9055-5.15644-10.539031-9.918907-13.248745-4.767584-2.804882-10.638291-3.686972-16.416901-1.956561l-10.538007 3.067872c-0.164752 0.029676-0.328481 0.163729-0.557702 0.25992L729.110271 669.726278c-11.618619 3.362584-18.664082 15.634072-15.829524 27.412326l2.64627 8.879228c2.838651 11.743462 17.358343 15.370059 28.976962 12.006452l100.167351-32.18912c-2.316765 4.496407-4.728698 8.943696-7.227612 13.325493-50.845015 89.318258-137.646963 153.181775-238.125399 175.209464-94.868671 20.790512-225.597061 3.428076-307.410392-48.981574-81.779561-52.344159-137.517003-136.410809-158.308539-231.274364-3.551896-16.152888-19.510356-26.4013-35.668361-22.844288-16.152888 3.527336-26.400277 19.515473-22.809495 35.669384 24.178679 110.532419 89.252767 207.876468 184.510294 268.90031 95.257527 60.993143 242.041592 81.256652 352.540242 57.046251 116.955712-25.683962 218.022549-100.089579 277.32212-204.126051 0.652869-1.154289 1.288343-2.320858 1.932002-3.479241l18.071587 85.813434c2.870374 11.782348 14.618952 18.568914 26.237571 15.140839l8.384971-0.876973C956.17373 821.927725 962.502879 812.369022 959.667298 800.651143zM96.961844 395.962194l2.610454 10.654664c1.439792 5.90857 5.15644 10.525728 9.924024 13.252839 4.76349 2.787486 10.637268 3.669576 16.412808 1.957585l10.507308-3.086291c0.199545-0.029676 0.358157-0.177032 0.557702-0.2415l156.64055-49.751101c11.618619-3.393283 18.697851-15.634072 15.859199-27.41335l-2.871397-7.978718c-2.870374-11.747555-17.134239-16.300244-28.717042-12.906961l-100.582813 32.301683c5.130857-11.68411 10.870582-23.094998 17.173125-34.111912 50.90539-89.366354 136.895857-150.277632 237.309824-172.304298 94.863555-20.790512 225.595015-3.41068 307.374576 48.997947 81.814354 52.361555 138.299833 133.48927 159.121044 228.386594 3.558036 16.153912 19.48068 26.350135 35.668361 22.810518 11.294231-2.482541 19.709901-11.048637 22.485107-21.50478 1.206478-4.473895 1.404999-9.30083 0.323365-14.164604-24.213471-110.51093-90.030479-204.973348-185.288007-265.961374-95.291297-61.011562-242.045685-81.261769-352.543312-57.029878-116.891244 25.618471-217.210044 97.05036-276.470729 201.085808-4.179183 7.325849-8.151657 14.809287-11.908214 22.416546l-17.690918-84.010369c-2.905166-11.765975-13.900591-21.262256-25.51921-17.868973l-8.385994 0.916882c-11.618619 3.429099-18.697851 15.69547-15.859199 27.412326l33.805944 157.552316C96.996636 395.58664 96.896352 395.767765 96.961844 395.962194z"></path></svg>
                            </span>
                            <span id="am-magic-close" title="关闭">
                                <svg viewBox="0 0 1024 1024" style="width:1.2em;height:1.2em;vertical-align:middle;fill:currentColor;overflow:hidden;"><path d="M551.424 512l195.072-195.072c9.728-9.728 9.728-25.6 0-36.864l-1.536-1.536c-9.728-9.728-25.6-9.728-35.328 0L514.56 475.136 319.488 280.064c-9.728-9.728-25.6-9.728-35.328 0l-1.536 1.536c-9.728 9.728-9.728 25.6 0 36.864L477.696 512 282.624 707.072c-9.728 9.728-9.728 25.6 0 36.864l1.536 1.536c9.728 9.728 25.6 9.728 35.328 0L514.56 548.864l195.072 195.072c9.728 9.728 25.6 9.728 35.328 0l1.536-1.536c9.728-9.728 9.728-25.6 0-36.864L551.424 512z"></path></svg>
                            </span>
                        </div>
                    </div>
                    <div class="am-magic-view-meta">
                        <div class="am-magic-view-tabs" id="am-magic-view-tabs">
                            <button type="button" class="am-magic-view-tab" data-view="query">
                                <span class="am-magic-view-tab-label">万能查数</span>
                                <span class="am-magic-view-default-icon" data-default-view="query" aria-label="设为默认打开：万能查数" title="设为默认打开：万能查数">☆</span>
                            </button>
                            <button type="button" class="am-magic-view-tab active" data-view="matrix">
                                <span class="am-magic-view-tab-label">人群对比看板</span>
                                <span class="am-magic-view-default-icon" data-default-view="matrix" aria-label="设为默认打开：人群对比看板" title="设为默认打开：人群对比看板">☆</span>
                            </button>
                        </div>
                        <div class="am-crowd-matrix-campaign" id="am-crowd-matrix-campaign">
                            <span class="am-crowd-matrix-campaign-part" data-crowd-campaign-name>计划名：未识别</span>
                            <span class="am-crowd-matrix-campaign-sep" aria-hidden="true">｜</span>
                            <span class="am-crowd-matrix-campaign-part" data-crowd-campaign-id>计划ID：--</span>
                            <span class="am-crowd-matrix-campaign-sep" aria-hidden="true">｜</span>
                            <label class="am-crowd-matrix-item-select-wrap">
                                <span class="am-crowd-matrix-item-label">商品ID：</span>
                                <select class="am-crowd-matrix-item-select" id="am-crowd-matrix-item-select">
                                    <option value="">--</option>
                                </select>
                            </label>
                        </div>
                    </div>
                    <div class="am-quick-prompts" id="am-magic-quick-prompts">
                        ${quickPromptHtml}
                    </div>
                </div>
                <div class="am-magic-content am-magic-content-query" data-view-panel="query">
                    <div class="am-iframe-loading" id="am-magic-loading">
                        <div class="am-spinner"></div>
                        <span>正在加载万能查数...</span>
                    </div>
                    <iframe id="am-magic-iframe"
                        src="${this.buildIframeUrl(false)}"
                        style="width: 100%; height: 100%; border: none; opacity: 0; transition: opacity 0.3s;"
                        allow="clipboard-write"
                    ></iframe>
                </div>
                <div class="am-magic-content am-magic-content-matrix" data-view-panel="matrix">
                    <div class="am-crowd-matrix-state is-info" id="am-crowd-matrix-state"><span class="am-crowd-matrix-state-text">点击“人群对比看板”开始加载</span></div>
                    <div class="am-crowd-matrix-toolbar">
                        <div class="am-crowd-matrix-legend-global" id="am-crowd-matrix-global-legend"></div>
                        <div class="am-crowd-matrix-actions">
                            <button type="button" class="am-crowd-matrix-retry" id="am-crowd-matrix-retry">重试</button>
                        </div>
                    </div>
                    <div class="am-crowd-matrix-grid" id="am-crowd-matrix-grid"></div>
                </div>
            `;

            document.body.appendChild(div);
            this.popup = div;
            this.header = div.querySelector('.am-magic-header');
            this.iframe = div.querySelector('#am-magic-iframe');
            this.quickPromptsEl = div.querySelector('#am-magic-quick-prompts');
            this.viewTabsEl = div.querySelector('#am-magic-view-tabs');
            this.queryPanelEl = div.querySelector('.am-magic-content-query');
            this.matrixPanelEl = div.querySelector('.am-magic-content-matrix');
            this.matrixStateEl = div.querySelector('#am-crowd-matrix-state');
            this.matrixGridEl = div.querySelector('#am-crowd-matrix-grid');
            this.matrixRetryBtn = div.querySelector('#am-crowd-matrix-retry');
            this.matrixLegendEl = div.querySelector('#am-crowd-matrix-global-legend');
            this.matrixCampaignEl = div.querySelector('#am-crowd-matrix-campaign');
            this.matrixCampaignNameEl = div.querySelector('[data-crowd-campaign-name]');
            this.matrixCampaignIdEl = div.querySelector('[data-crowd-campaign-id]');
            this.matrixCampaignItemSelectEl = div.querySelector('#am-crowd-matrix-item-select');
            this.bindCrowdMatrixHoverTipEvents();
            this.refreshQuickPromptLabels();
            this.refreshCrowdMatrixCampaignMeta();
            this.renderCrowdGlobalLegend();
            this.activeView = this.getMagicDefaultView();
            this.switchMagicView(this.activeView || 'matrix', { skipLoad: true });
            if (!this.popupResizeHandler) {
                this.popupResizeHandler = () => {
                    if (!(this.popup instanceof HTMLElement)) return;
                    if (this.popup.style.display === 'none') return;
                    if (this.activeView === 'matrix') {
                        this.maximizePopupForMatrix();
                    }
                };
                window.addEventListener('resize', this.popupResizeHandler);
            }

            // iframe 加载完成后先清理，再显示，避免首屏闪现整页内容
            this.iframe.onload = () => {
                const loading = div.querySelector('#am-magic-loading');
                this.iframe.style.opacity = '0';

                const revealIframe = () => {
                    if (loading) loading.style.display = 'none';
                    this.iframe.style.opacity = '1';
                };

                // 尝试清理（同源才能成功，失败也不影响使用）
                try {
                    const iframeDoc = this.iframe.contentDocument || this.iframe.contentWindow.document;
                    const rootEl = iframeDoc.documentElement || iframeDoc.body;
                    if (rootEl) rootEl.style.setProperty('visibility', 'hidden', 'important');

                    // SPA 延迟加载：缩短轮询间隔，最大约 2.4 秒，避免卡住
                    const maxRetries = 20;
                    const retryInterval = 120;
                    const tryCleanup = (retries = 0) => {
                        try {
                            const target = iframeDoc.getElementById('universalBP_common_layout_main_content');
                            if (target) {
                                this.cleanupIframe(iframeDoc);
                                if (rootEl) rootEl.style.removeProperty('visibility');
                                revealIframe();
                                return;
                            }
                        } catch {
                            if (rootEl) rootEl.style.removeProperty('visibility');
                            revealIframe();
                            return;
                        }

                        if (retries >= maxRetries) {
                            if (rootEl) rootEl.style.removeProperty('visibility');
                            revealIframe();
                            return;
                        }

                        setTimeout(() => tryCleanup(retries + 1), retryInterval);
                    };

                    tryCleanup();
                } catch (e) {
                    // 跨域无法清理，不影响核心功能
                    revealIframe();
                }
            };
            this.iframe.onerror = () => {
                const loading = div.querySelector('#am-magic-loading');
                if (loading) loading.style.display = 'none';
                this.iframe.style.opacity = '1';
                Logger.warn('⚠️ 万能查数刷新失败，请检查登录状态或网络后重试');
            };

            // 关闭按钮
            div.querySelector('#am-magic-close').onclick = () => this.toggle(false);

            // 刷新按钮
            div.querySelector('#am-magic-refresh').onclick = () => {
                if (this.activeView === 'matrix') {
                    this.ensureCrowdMatrixLoaded(true);
                    return;
                }
                const loading = div.querySelector('#am-magic-loading');
                if (loading) loading.style.display = 'flex';
                this.iframe.style.opacity = '0';
                this.iframe.src = this.buildIframeUrl(true);
            };

            if (this.viewTabsEl instanceof HTMLElement) {
                this.viewTabsEl.addEventListener('click', (e) => {
                    const target = e.target;
                    if (!(target instanceof Element)) return;
                    const defaultIcon = target.closest('[data-default-view]');
                    if (defaultIcon instanceof HTMLElement) {
                        e.preventDefault();
                        e.stopPropagation();
                        const defaultView = this.normalizeMagicView(defaultIcon.dataset.defaultView || '');
                        if (!defaultView) return;
                        this.setMagicDefaultView(defaultView);
                        this.switchMagicView(defaultView);
                        return;
                    }
                    const btn = target.closest('[data-view]');
                    if (!(btn instanceof HTMLElement)) return;
                    const nextView = String(btn.dataset.view || '').trim();
                    if (!nextView) return;
                    this.switchMagicView(nextView);
                });
            }
            if (this.matrixRetryBtn instanceof HTMLElement) {
                this.matrixRetryBtn.addEventListener('click', () => {
                    this.ensureCrowdMatrixLoaded(true);
                });
            }
            if (this.matrixLegendEl instanceof HTMLElement) {
                this.matrixLegendEl.addEventListener('click', (e) => {
                    const target = e.target;
                    if (!(target instanceof Element)) return;
                    const ratioBtn = target.closest('[data-crowd-ratio-toggle]');
                    if (ratioBtn instanceof HTMLElement) {
                        this.toggleCrowdRatioVisibility();
                        return;
                    }
                    const insightBtn = target.closest('[data-crowd-insight-toggle]');
                    if (insightBtn instanceof HTMLElement) {
                        this.toggleCrowdInsightsVisibility();
                        return;
                    }
                    const btn = target.closest('[data-crowd-metric]');
                    if (btn instanceof HTMLElement) {
                        const metric = String(btn.dataset.crowdMetric || '').trim();
                        if (!metric) return;
                        this.toggleCrowdMetricVisibility(metric);
                        return;
                    }
                    const periodBtn = target.closest('[data-crowd-period]');
                    if (!(periodBtn instanceof HTMLElement)) return;
                    const period = this.normalizeCrowdPeriod(periodBtn.dataset.crowdPeriod || '');
                    if (!period) return;
                    this.toggleCrowdPeriodVisibility(period);
                });
            }
            if (this.matrixCampaignItemSelectEl instanceof HTMLSelectElement) {
                this.matrixCampaignItemSelectEl.addEventListener('change', () => {
                    const campaignId = this.getCurrentCampaignId() || this.lastCampaignId;
                    const id = PlanIdentityUtils.normalizeCampaignId(campaignId);
                    if (!id) return;
                    const selectedItemId = PlanIdentityUtils.normalizeItemId(this.matrixCampaignItemSelectEl.value || '');
                    if (!selectedItemId) return;
                    const prevItemId = this.getCrowdCampaignSelectedItemId(id);
                    this.setCrowdCampaignSelectedItemId(id, selectedItemId, { manual: true });
                    this.refreshCrowdMatrixCampaignMeta(id);
                    if (this.activeView !== 'matrix') return;
                    if (prevItemId === selectedItemId) return;
                    this.setCrowdMatrixStatus(`已切换商品ID ${selectedItemId}，正在刷新商品成交人群...`, 'loading', {
                        showRetry: false,
                        progress: 0
                    });
                    this.reloadCrowdMatrixMetric({ campaignId: id, metricType: 'itemdeal' });
                });
            }

            // 头部快捷话术
            const quickPrompts = div.querySelector('#am-magic-quick-prompts');
            if (quickPrompts) {
                quickPrompts.addEventListener('click', async (e) => {
                    const target = e.target;
                    if (!(target instanceof Element)) return;
                    const btn = target.closest('.am-quick-prompt');
                    if (!btn) return;
                    e.stopPropagation();

                    const promptItem = this.QUICK_PROMPTS[Number(btn.dataset.index)];
                    if (!promptItem) return;

                    this.refreshQuickPromptLabels();

                    quickPrompts.querySelectorAll('.am-quick-prompt').forEach(node => node.classList.remove('active'));
                    btn.classList.add('active');
                    setTimeout(() => btn.classList.remove('active'), 1200);

                    const promptText = await this.resolvePromptText(promptItem);
                    if (!promptText) return;

                    if (promptItem.autoSubmit) {
                        this.runQuickPrompt(promptText);
                    } else {
                        // 只填充不提交
                        const iframeDoc = this.getIframeDoc();
                        if (iframeDoc) {
                            const inputEl = this.findPromptInput(iframeDoc);
                            if (inputEl) {
                                this.setPromptInputValue(inputEl, promptText);
                                inputEl.focus();
                                if (promptItem.requireCampaignId) {
                                    const id = this.extractCampaignId(promptText);
                                    if (id) Logger.log(`🆔 当前计划ID: ${id} `);
                                }
                                if (promptItem.requireCampaignName) {
                                    const name = this.extractCampaignName(promptText);
                                    if (name) Logger.log(`📛 当前计划名: ${name} `);
                                }
                            }
                        }
                    }
                });
            }

            // 拖拽逻辑
            let isDragging = false;
            let startX, startY, initialLeft, initialTop;

            this.header.onmousedown = (e) => {
                const target = e.target;
                if (!(target instanceof Element)) return;
                if (target.closest('.am-btn-group') || target.closest('.am-quick-prompts') || target.closest('.am-magic-view-meta')) return;
                if (this.activeView === 'matrix' || this.popupMatrixMaximized) return;
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                // 首次拖拽时移除 transform 定位，切换为 left/top
                if (div.style.transform) {
                    const rect = div.getBoundingClientRect();
                    div.style.left = `${rect.left}px`;
                    div.style.top = `${rect.top}px`;
                    div.style.transform = 'none';
                }
                initialLeft = div.offsetLeft;
                initialTop = div.offsetTop;
                div.style.transition = 'none';
                document.body.style.userSelect = 'none';
            };

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                div.style.left = `${initialLeft + e.clientX - startX}px`;
                div.style.top = `${initialTop + e.clientY - startY}px`;
            });

            document.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    div.style.transition = '';
                    document.body.style.userSelect = '';
                }
            });
        },

        toggle(show) {
            if (!(this.popup instanceof HTMLElement) || !this.popup.isConnected) {
                this.popup = null;
            }
            if (this.popup) {
                this.popup.style.display = show ? 'flex' : 'none';
            } else if (show) {
                this.createPopup();
                this.popup.style.display = 'flex';
            }

            if (!show) this.hideCrowdMatrixHoverTip();

            if (show) {
                this.refreshQuickPromptLabels();
                this.refreshCrowdMatrixCampaignMeta();
                const defaultView = this.getMagicDefaultView();
                this.activeView = defaultView;
                this.switchMagicView(defaultView || 'matrix');
            }

            State.config.magicReportOpen = show;
            State.save();
            UI.updateState();
        }
    };
