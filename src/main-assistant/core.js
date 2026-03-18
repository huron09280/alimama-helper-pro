    // ==========================================
    // 3. 核心计算 (Logic)
    // ==========================================
    const Core = {
        // 使用 XPath 高效查找顶部汇总指标，避免扫描整页节点
        getSummaryMetricTotal(labels = []) {
            try {
                const labelList = Array.isArray(labels)
                    ? labels.map(label => String(label || '').trim()).filter(Boolean)
                    : [String(labels || '').trim()].filter(Boolean);
                for (const label of labelList) {
                    const xpath = `//span[contains(normalize-space(.), '${label}') and not(ancestor::table) and not(ancestor::*[@id='am-helper-panel'])]`;
                    const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                    for (let i = 0; i < result.snapshotLength; i++) {
                        const span = result.snapshotItem(i);
                        const container = span?.closest?.('div');
                        if (!container) continue;
                        const rawText = (container.textContent || '').replace(span.textContent || '', '').replace(/,/g, '').trim();
                        const match = rawText.match(/(\d+(?:\.\d+)?)/);
                        if (match) {
                            return parseFloat(match[1]) || 0;
                        }
                    }
                }
                return 0;
            } catch (e) {
                return 0;
            }
        },

        getTotalCost() {
            return this.getSummaryMetricTotal(['花费(元)', '花费']);
        },

        getTotalImpression() {
            return this.getSummaryMetricTotal(['展现量', '展示量', '曝光量']);
        },

        getTotalClick() {
            return this.getSummaryMetricTotal(['点击量', '点击数', '点击次数']);
        },

        // 解析单元格数值
        parseValue(cell) {
            if (!cell) return 0;
            // 优化：只获取文本节点，避免获取到已插入的 tag 导致重复计算偏差
            let text = '';
            let child = cell.firstChild;
            while (child) {
                if (child.nodeType === 3) { // Text node
                    text += child.nodeValue;
                } else if (child.nodeType === 1 && !child.classList.contains('am-helper-tag')) { // Element node (non-tag)
                    if (typeof child.cloneNode === 'function') {
                        const cloned = child.cloneNode(true);
                        if (typeof cloned.querySelectorAll === 'function') {
                            cloned.querySelectorAll('.am-helper-tag').forEach((tag) => tag.remove());
                        }
                        text += cloned.textContent;
                    } else {
                        text += child.textContent;
                    }
                }
                child = child.nextSibling;
            }
            text = text.replace(/，/g, ',');
            const match = text.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
            return match ? parseFloat(match[0]) : 0;
        },

        renderTag(cell, type, text, extraStyle) {
            const fullStyle = CONSTANTS.TAG_BASE_STYLE + extraStyle;
            const existing = cell.querySelector(`.am-helper-tag.${type}`);
            if (existing) {
                if (existing.textContent === text) return false;
                existing.textContent = text;
                existing.style.cssText = fullStyle;
                return true;
            }

            const span = document.createElement('span');
            span.className = `am-helper-tag ${type}`;
            span.style.cssText = fullStyle;
            span.textContent = text;
            cell.appendChild(span);
            return true;
        },

        // 列索引映射缓存
        colMapCache: { signature: '', map: null },

        getColumnIndexMap(headers) {
            // 生成 Header 签名以决定是否更新 Map
            const signature = Array.from(headers).map(h => (h.textContent || '').replace(/\s+/g, '')).join('|');
            if (this.colMapCache.signature === signature && this.colMapCache.map) {
                return this.colMapCache.map;
            }

            const map = { cost: -1, wang: -1, carts: [], guide: -1, impression: -1, click: -1, budget: -1 };
            headers.forEach((th, i) => {
                const text = (th.textContent || '').replace(/\s+/g, ''); // 移除所有空格
                const idx = (th.cellIndex !== undefined) ? th.cellIndex : i;

                if (text.includes('花费') && !text.includes('平均') && !text.includes('千次')) map.cost = idx;
                else if (text.includes('旺旺咨询量')) map.wang = idx;
                else if ((text.includes('购物车') || text.includes('加购')) && !text.includes('率') && !text.includes('成本')) map.carts.push(idx);
                else if ((text.includes('引导访问') && text.includes('潜客')) || (text.includes('潜客数') && !text.includes('占比'))) map.guide = idx;
                else if (text.includes('展现量') || text.includes('展示量') || text.includes('曝光量')) map.impression = idx;
                else if (text.includes('点击量')) map.click = idx;
                else if (text.includes('预算') && !text.includes('建议')) map.budget = idx;
            });

            this.colMapCache = { signature, map };
            return map;
        },

        isElementVisible(el) {
            if (!el) return false;
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') return false;
            return el.getClientRects().length > 0;
        },

        resolveStickyHeaderWrapper(stickyBodyWrapper) {
            if (!stickyBodyWrapper) return null;
            const parent = stickyBodyWrapper.parentElement;
            if (!parent) return null;

            const directBodies = Array.from(parent.children).filter(el => el.matches('[mx-stickytable-wrapper="body"]'));
            const directHeads = Array.from(parent.children).filter(el => el.matches('[mx-stickytable-wrapper="head"]'));
            if (directBodies.length > 0 && directBodies.length === directHeads.length) {
                const idx = directBodies.indexOf(stickyBodyWrapper);
                if (idx > -1) return directHeads[idx];
            }

            const prev = stickyBodyWrapper.previousElementSibling;
            if (prev?.matches('[mx-stickytable-wrapper="head"]')) return prev;
            const next = stickyBodyWrapper.nextElementSibling;
            if (next?.matches('[mx-stickytable-wrapper="head"]')) return next;

            return parent.querySelector('[mx-stickytable-wrapper="head"]');
        },

        getTableHeaders(table) {
            if (!table) return null;

            const stickyBodyWrapper = table.closest('[mx-stickytable-wrapper="body"]');
            const stickyHeaderWrapper = this.resolveStickyHeaderWrapper(stickyBodyWrapper);
            if (stickyHeaderWrapper) {
                const stickyHeaders = stickyHeaderWrapper.querySelectorAll('th');
                if (stickyHeaders.length > 0) return stickyHeaders;
            }

            const headers = table.querySelectorAll('thead th');
            return headers.length > 0 ? headers : null;
        },

        getTableScore(colMap) {
            let score = 0;
            if (colMap.cost > -1) score += 8;
            if (colMap.wang > -1) score += 4;
            if (colMap.carts.length > 0) score += 2;
            if (colMap.impression > -1) score += 2;
            if (colMap.guide > -1 && colMap.click > -1) score += 2;
            if (colMap.budget > -1) score += 1;
            return score;
        },

        getTableMaxCells(table, maxScanRows = 30) {
            if (!table) return 0;

            const rows = table.rows;
            let maxCells = 0;
            let scanned = 0;
            for (let i = 0; i < rows.length && scanned < maxScanRows; i++) {
                const row = rows[i];
                if (!row || row.parentElement?.tagName === 'THEAD') continue;
                scanned++;
                if (row.cells && row.cells.length > maxCells) {
                    maxCells = row.cells.length;
                }
            }
            return maxCells;
        },

        getTableCapabilityScore(colMap, headerCount, maxCells) {
            if (!colMap || headerCount <= 0 || maxCells <= 0) return 0;

            const offset = Math.max(0, headerCount - maxCells);
            const toBodyIdx = (idx) => (idx > -1 ? idx - offset : -1);
            const hasCell = (idx) => idx > -1 && idx < maxCells;

            const costIdx = toBodyIdx(colMap.cost);
            const wangIdx = toBodyIdx(colMap.wang);
            const guideIdx = toBodyIdx(colMap.guide);
            const impressionIdx = toBodyIdx(colMap.impression);
            const clickIdx = toBodyIdx(colMap.click);
            const budgetIdx = toBodyIdx(colMap.budget);
            const cartIdxList = (colMap.carts || []).map(toBodyIdx);

            let score = 0;
            if (hasCell(costIdx)) score += 12;
            if (hasCell(wangIdx)) score += 6;
            if (cartIdxList.some(hasCell)) score += 4;
            if (hasCell(impressionIdx)) score += 3;
            if (hasCell(guideIdx) && hasCell(clickIdx)) score += 3;
            if (hasCell(budgetIdx)) score += 2;
            score += Math.min(5, Math.floor(maxCells / 5));

            return score;
        },

        resolveTableContext() {
            const tableList = document.querySelectorAll('div[mx-stickytable-wrapper="body"] table, table');
            if (!tableList || tableList.length === 0) return null;

            const contexts = [];
            const seen = new Set();

            tableList.forEach(table => {
                if (!table || seen.has(table)) return;
                seen.add(table);

                const headers = this.getTableHeaders(table);
                if (!headers || headers.length === 0) return;

                const colMap = this.getColumnIndexMap(headers);
                const stickyBodyWrapper = table.closest('[mx-stickytable-wrapper="body"]');
                const visible = this.isElementVisible(stickyBodyWrapper || table);
                const rowCount = table.tBodies?.[0]?.rows?.length || table.rows.length || 0;
                const maxCells = this.getTableMaxCells(table);
                const baseScore = this.getTableScore(colMap);
                const capabilityScore = this.getTableCapabilityScore(colMap, headers.length, maxCells);

                if (rowCount <= 0 || maxCells <= 0) return;
                if (capabilityScore <= 0 && baseScore <= 0) return;

                contexts.push({
                    table,
                    headers,
                    colMap,
                    score: baseScore,
                    capabilityScore,
                    visible,
                    rowCount,
                    maxCells
                });
            });

            if (contexts.length === 0) return null;

            contexts.sort((a, b) => {
                const visibleDelta = Number(b.visible) - Number(a.visible);
                if (visibleDelta !== 0) return visibleDelta;
                const capabilityDelta = b.capabilityScore - a.capabilityScore;
                if (capabilityDelta !== 0) return capabilityDelta;
                const scoreDelta = b.score - a.score;
                if (scoreDelta !== 0) return scoreDelta;
                const cellDelta = b.maxCells - a.maxCells;
                if (cellDelta !== 0) return cellDelta;
                return b.rowCount - a.rowCount;
            });

            return contexts[0];
        },

        resolveChargeHeader(table) {
            const stickyBodyWrapper = table?.closest?.('[mx-stickytable-wrapper="body"]');
            const stickyHeaderWrapper = this.resolveStickyHeaderWrapper(stickyBodyWrapper);
            const scopedHeader = stickyHeaderWrapper?.querySelector('[mx-stickytable-sort="charge"]');
            if (scopedHeader) return scopedHeader;
            const scope = stickyBodyWrapper?.parentElement || document;
            return scope.querySelector('[mx-stickytable-sort="charge"]') || document.querySelector('[mx-stickytable-sort="charge"]');
        },

        run() {
            const tableContext = this.resolveTableContext();
            if (!tableContext) return;
            const { table, headers, colMap } = tableContext;

            // 自动点击花费列降序排序（需要开启配置，且未排序时）
            if (State.config.autoSortCharge && !this._sortedByCharge) {
                const chargeHeader = this.resolveChargeHeader(table);
                if (chargeHeader) {
                    // 检查当前是否已经是降序
                    const currentOrder = chargeHeader.getAttribute('mx-stickytable-sort-order');
                    if (currentOrder !== 'desc') {
                        // 点击降序按钮
                        const descBtn = chargeHeader.querySelector('[mx-stickytable-sort-trigger="desc"]');
                        if (descBtn) {
                            descBtn.click();
                            Logger.log('📊 已自动按花费降序排序');
                            this._sortedByCharge = true;
                            return; // 等待排序完成后再渲染数据
                        }
                    } else {
                        this._sortedByCharge = true; // 已经是降序，标记
                    }
                }
            }
            const { showCost, showCartCost, showPercent, showCostRatio, showBudget } = State.config;

            // 检查是否需要执行
            const needCost = showCost && colMap.cost > -1 && colMap.wang > -1;
            const needCart = showCartCost && colMap.cost > -1 && colMap.carts.length > 0;
            const needPercent = showPercent && colMap.guide > -1 && colMap.click > -1;
            const needRatio = showCostRatio && (colMap.cost > -1 || colMap.impression > -1 || colMap.click > -1);
            const needBudget = showBudget && colMap.cost > -1 && colMap.budget > -1;

            if (!needCost && !needCart && !needPercent && !needRatio && !needBudget) return;

            // 获取顶部汇总指标 (只需一次，且去重日志)
            const totalCost = needRatio ? this.getTotalCost() : 0;
            const totalImpression = needRatio && colMap.impression > -1 ? this.getTotalImpression() : 0;
            const totalClick = needRatio && colMap.click > -1 ? this.getTotalClick() : 0;
            if (needRatio && totalCost > 0 && this._lastTotalCost !== totalCost) {
                this._lastTotalCost = totalCost;
                Logger.log(`💰 总花费更新: ${totalCost}`);
            }

            const rows = table.rows; // 使用原生 .rows 属性比 querySelectorAll 更快
            let updatedCount = 0;

            // 使用 for 循环遍历，性能略优于 forEach
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                // 跳过表头行
                if (row.parentElement.tagName === 'THEAD') continue;

                const cells = row.cells;
                if (!cells || cells.length === 0) continue;

                // 自动偏移修正 (处理合计行或分组标题行的 colspan)
                let curMap = colMap;
                const offset = headers.length - cells.length;

                if (offset > 0) {
                    curMap = { ...colMap }; // 浅拷贝
                    if (curMap.cost > -1) curMap.cost -= offset;
                    if (curMap.wang > -1) curMap.wang -= offset;
                    curMap.carts = curMap.carts.map(c => c - offset);
                    if (curMap.guide > -1) curMap.guide -= offset;
                    if (curMap.impression > -1) curMap.impression -= offset;
                    if (curMap.click > -1) curMap.click -= offset;
                    if (curMap.budget > -1) curMap.budget -= offset;
                }

                const getCell = (idx) => cells[idx];

                // 1. 询单成本
                if (needCost) {
                    const cCost = getCell(curMap.cost);
                    const cWang = getCell(curMap.wang);
                    if (cCost && cWang) {
                        const cost_val = this.parseValue(cCost);
                        const wang_val = this.parseValue(cWang);
                        if (wang_val > 0) {
                            if (this.renderTag(cWang, 'cost-tag', `询成: ${(cost_val / wang_val).toFixed(1)}`, CONSTANTS.STYLES.cost)) updatedCount++;
                        }
                    }
                }

                // 2. 加购成本
                if (needCart && curMap.cost > -1) {
                    const cCost = getCell(curMap.cost);
                    if (cCost) {
                        const cost_val = this.parseValue(cCost);
                        curMap.carts.forEach(cIdx => {
                            const cCart = getCell(cIdx);
                            if (cCart) {
                                const cart_val = this.parseValue(cCart);
                                if (cart_val > 0) {
                                    if (this.renderTag(cCart, 'cart-tag', `加成: ${(cost_val / cart_val).toFixed(1)}`, CONSTANTS.STYLES.cart)) updatedCount++;
                                }
                            }
                        });
                    }
                }

                // 3. 潜客占比
                if (needPercent) {
                    const cGuide = getCell(curMap.guide);
                    const cClick = getCell(curMap.click);
                    if (cGuide && cClick) {
                        const guide_val = this.parseValue(cGuide);
                        const click_val = this.parseValue(cClick);
                        if (click_val > 0) {
                            if (this.renderTag(cGuide, 'percent-tag', `潜客: ${((guide_val / click_val) * 100).toFixed(1)}%`, CONSTANTS.STYLES.percent)) updatedCount++;
                        }
                    }
                }

                // 4. 花费 / 展现 / 点击 占比
                if (needRatio) {
                    const ratioTargets = [
                        { idx: curMap.cost, total: totalCost },
                        { idx: curMap.impression, total: totalImpression },
                        { idx: curMap.click, total: totalClick }
                    ];
                    ratioTargets.forEach(({ idx, total }) => {
                        if (idx < 0 || total <= 0) return;
                        const cell = getCell(idx);
                        if (!cell) return;
                        const value = this.parseValue(cell);
                        if (value <= 0) return;
                        if (this.renderTag(cell, 'ratio-tag', `占比: ${((value / total) * 100).toFixed(1)}%`, CONSTANTS.STYLES.ratio)) updatedCount++;
                    });
                }

                if (needBudget) {
                    const cCost = getCell(curMap.cost);
                    const cBudget = getCell(curMap.budget);
                    if (cCost && cBudget) {
                        // 解析花费单元格：获取总花费和基础花费
                        const costText = cCost.textContent || '';
                        const baseCostMatch = costText.match(/基础([\d,.]+)/);
                        const totalCostVal = this.parseValue(cCost);
                        const baseCost = baseCostMatch ? parseFloat(baseCostMatch[1].replace(/,/g, '')) : 0;
                        const multiCost = totalCostVal - baseCost;

                        // 在预算单元格中查找包含"基础"和"多目标"的div
                        const budgetDivs = cBudget.querySelectorAll('div');
                        let baseDiv = null;
                        let multiDiv = null;

                        budgetDivs.forEach(div => {
                            const text = div.textContent || '';
                            if (text.includes('基础') && !div.classList.contains('am-helper-tag')) {
                                baseDiv = div;
                            } else if (text.includes('多目标') && !div.classList.contains('am-helper-tag')) {
                                multiDiv = div;
                            }
                        });

                        // 解析预算值
                        const budgetText = cBudget.textContent || '';
                        const baseBudgetMatch = budgetText.match(/基础[：:]\s*([\d,]+)/);
                        const multiBudgetMatch = budgetText.match(/多目标[：:]\s*([\d,]+)/);
                        const baseBudget = baseBudgetMatch ? parseFloat(baseBudgetMatch[1].replace(/,/g, '')) : 0;
                        const multiBudget = multiBudgetMatch ? parseFloat(multiBudgetMatch[1].replace(/,/g, '')) : 0;

                        // 在"基础"div后添加基础占比标签
                        if (baseDiv && baseBudget > 0) {
                            const basePercent = Math.min(100, (baseCost / baseBudget) * 100).toFixed(1);
                            const bgStyle = `background:linear-gradient(90deg,rgba(82,196,26,0.25) ${basePercent}%,rgba(82,196,26,0.05) ${basePercent}%);`;

                            // 检查是否已存在标签
                            let existingTag = baseDiv.parentElement.querySelector('.am-helper-tag.budget-base-tag');
                            if (!existingTag) {
                                const span = document.createElement('span');
                                span.className = 'am-helper-tag budget-base-tag';
                                span.style.cssText = CONSTANTS.TAG_BASE_STYLE + CONSTANTS.STYLES.budget + bgStyle;
                                span.textContent = `${basePercent}%`;
                                baseDiv.after(span);
                                updatedCount++;
                            } else if (existingTag.textContent !== `${basePercent}%`) {
                                existingTag.textContent = `${basePercent}%`;
                                existingTag.style.cssText = CONSTANTS.TAG_BASE_STYLE + CONSTANTS.STYLES.budget + bgStyle;
                                updatedCount++;
                            }
                        }

                        // 在"多目标"div后添加多目标占比标签
                        if (multiDiv && multiBudget > 0 && multiCost >= 0) {
                            const multiPercent = Math.min(100, (multiCost / multiBudget) * 100).toFixed(1);
                            const bgStyle = `background:linear-gradient(90deg,rgba(82,196,26,0.25) ${multiPercent}%,rgba(82,196,26,0.05) ${multiPercent}%);`;

                            // 检查是否已存在标签
                            let existingTag = multiDiv.parentElement.querySelector('.am-helper-tag.budget-multi-tag');
                            if (!existingTag) {
                                const span = document.createElement('span');
                                span.className = 'am-helper-tag budget-multi-tag';
                                span.style.cssText = CONSTANTS.TAG_BASE_STYLE + CONSTANTS.STYLES.budget + bgStyle;
                                span.textContent = `${multiPercent}%`;
                                multiDiv.after(span);
                                updatedCount++;
                            } else if (existingTag.textContent !== `${multiPercent}%`) {
                                existingTag.textContent = `${multiPercent}%`;
                                existingTag.style.cssText = CONSTANTS.TAG_BASE_STYLE + CONSTANTS.STYLES.budget + bgStyle;
                                updatedCount++;
                            }
                        }

                        // 如果没有找到分类div，使用原来的总体预算进度显示
                        if (!baseDiv && !multiDiv) {
                            const totalBudget = this.parseValue(cBudget);
                            if (totalBudget > 0) {
                                const percent = Math.min(100, (totalCostVal / totalBudget) * 100).toFixed(1);
                                const bgStyle = `background:linear-gradient(90deg,rgba(82,196,26,0.25) ${percent}%,rgba(82,196,26,0.05) ${percent}%);`;
                                if (this.renderTag(cBudget, 'budget-tag', `${percent}%`, CONSTANTS.STYLES.budget + bgStyle)) updatedCount++;
                            }
                        }
                    }
                }
            }

            if (updatedCount > 0) Logger.log(`✅ 更新 ${updatedCount} 项数据`);
        }
    };

    const resetSortState = (reason) => {
        Core._sortedByCharge = false;
        Core._lastTotalCost = null;
        Logger.log(`📍 ${reason}，重置排序`);
    };

    const isVisibleOverlayElement = (el) => {
        if (!(el instanceof HTMLElement)) return false;
        if (!el.isConnected) return false;
        const style = window.getComputedStyle(el);
        if (!style) return false;
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        if (parseFloat(style.opacity || '1') <= 0.01) return false;
        if (style.pointerEvents === 'none') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    };

    const shouldPauseInjectionForPopup = () => {
        const popupSelectors = [
            '#am-wxt-keyword-overlay.open',
            '#am-wxt-scene-popup-mask',
            '#am-wxt-keyword-item-picker-mask',
            '#am-campaign-concurrent-log-popup',
            '#am-magic-report-popup',
            '#am-report-capture-panel',
            '#alimama-escort-helper-ui-result-overlay'
        ];
        for (let i = 0; i < popupSelectors.length; i++) {
            const popup = document.querySelector(popupSelectors[i]);
            if (isVisibleOverlayElement(popup)) return true;
        }
        return false;
    };

