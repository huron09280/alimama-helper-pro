// ==UserScript==
// @name         阿里妈妈多合一助手 (Pro版)
// @namespace    http://tampermonkey.net/
// @version      5.23
// @description  交互优化版：增加加购成本计算、花费占比、预算分类占比、性能优化。包含状态记忆、胶囊按钮UI、日志折叠、报表直连下载拦截。集成算法护航功能。
// @author       Gemini & Liangchao
// @match        *://alimama.com/*
// @match        *://*.alimama.com/*
// @match        https://one.alimama.com/*
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @connect      alimama.com
// @connect      ai.alimama.com
// @connect      *.alimama.com
// @connect      one.alimama.com
// ==/UserScript==
/**
 * 更新日志
 * 
 * v5.23 (2026-02-08)
 * - 🐛 修复作用域引用错误导致的算法护航模块加载失败问题
 * - ✨ 实现全 UI 版本号自动化同步，所有界面均显示最新版本
 * - 🔧 整理并优化今日所有更新日志，保持界面整洁
 * - 🔧 修复日志日期合并逻辑，准确识别并按天分组
 * - ✨ 点击「算法护航」后主面板自动最小化，提升空间利用率
 * - 🔧 优化面板层级 (z-index)，解决层级遮挡问题
 * - 🔧 移除护航「最小化」图标，集成护航模块并支持一键调出
 * - ✨ 新增预算分类占比显示 (基础 + 多目标预算)
 * 
 * v5.15 (2026-02-05)
 * - ✨ 新增 Tab 切换监听（关键词、人群、创意等）
 * - ✨ 切换 Tab 时自动重新按花费降序排序
 * 
 * v5.12 (2026-01-31)
 * - ✨ 新增「花费排序」开关，自动按花费降序排列表格
 * - ✨ 切换页面/点击计划时自动重新排序
 * - ✨ 监听 URL 变化 (hashchange/popstate)
 * - 🐛 修复总花费日志重复输出问题
 * 
 * v4.11 (2026-01-31)
 * - ✨ UI 样式重新设计，灰色系主题
 * - ✨ 悬浮球恢复 40px SVG 图标
 * - ✨ 面板位置对齐悬浮球
 * - ✨ 点击面板外部自动最小化
 * - ✨ 左侧可拖拽调整宽度
 * - ✨ 缩放动画效果
 */

(function () {
    'use strict';

    // 全局版本管理
    const CURRENT_VERSION = typeof GM_info !== 'undefined' ? GM_info.script.version : '5.23';

    // ==========================================
    // 1. 配置与状态管理
    // ==========================================
    const CONSTANTS = {
        STORAGE_KEY: 'AM_HELPER_CONFIG_V5_15',
        TAG_BASE_STYLE: 'align-items:center;border:0 none;border-radius:var(--mx-effects-tag-border-radius,8px);display:inline-flex;font-size:9px;font-weight:800;height:var(--mx-effects-tag-height,16px);justify-content:center;padding:0 var(--mx-effects-tag-h-gap,1px);position:relative;transition:background-color var(--duration),color var(--duration),border var(--duration),opacity var(--duration);-webkit-user-select:none;-moz-user-select:none;user-select:none;width:100%;margin-top:2px;',
        STYLES: {
            cost: 'background-color:rgba(255,0,106,0.1);color:#ff006a;',
            cart: 'background-color:rgba(114,46,209,0.1);color:#722ed1;',
            percent: 'background-color:rgba(24,144,255,0.1);color:#1890ff;',
            ratio: 'background-color:rgba(250,140,22,0.1);color:#fa8c16;',
            budget: 'color:#52c41a;transition:all 0.3s;'
        },
        KEYWORDS: ['查询', '搜索', '确定', '今天', '昨天', '过去', '本月', '上月', '计划', '单元', '创意', '推广'],
        DL_KEYWORDS: ["oss-accelerate", "aliyuncs.com", "download"]
    };

    const DEFAULT_CONFIG = {
        panelOpen: false,
        showCost: true,
        showCartCost: true,
        showPercent: true,
        showCostRatio: true,
        showBudget: true,
        autoClose: true,
        autoSortCharge: true,  // 花费降序排序
        logExpanded: true
    };

    const loadConfig = () => {
        try {
            const saved = JSON.parse(localStorage.getItem(CONSTANTS.STORAGE_KEY)) ||
                JSON.parse(localStorage.getItem('AM_HELPER_CONFIG_V5_14')) ||
                JSON.parse(localStorage.getItem('AM_HELPER_CONFIG_V5_13'));
            // 强制 panelOpen 默认为 false，确保 UI 每次加载时都是缩小状态
            return { ...DEFAULT_CONFIG, ...saved, panelOpen: false };
        } catch {
            return DEFAULT_CONFIG;
        }
    };

    const State = {
        config: loadConfig(),
        save() {
            localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(this.config));
        }
    };

    // ==========================================
    // 2. 日志系统 (DOM 缓存优化)
    // ==========================================
    const Logger = {
        el: null,
        buffer: [],
        timer: null,

        log(msg, isError = false) {
            const now = new Date();
            const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

            // Console output
            const logStyle = isError ? 'color: #ff4d4f' : 'color: #1890ff';
            console.log(`%c[AM] ${msg}`, logStyle);

            // Buffer for UI update
            this.buffer.push({ time, msg, isError });
            this.scheduleFlush();
        },

        scheduleFlush() {
            if (this.timer) return;
            this.timer = requestAnimationFrame(() => this.flush());
        },

        flush() {
            if (!this.el || this.buffer.length === 0) return;

            const fragment = document.createDocumentFragment();
            const today = new Date().toLocaleDateString('zh-CN');

            // 准确检查是否需要插入日期标题 (查找容器内最后一个日期标题)
            const dateHeaders = this.el.getElementsByClassName('am-log-date-header');
            const lastDateText = dateHeaders.length > 0 ? dateHeaders[dateHeaders.length - 1].dataset.date : '';

            this.buffer.forEach(({ time, msg, isError }) => {
                if (today !== this.lastFlushedDate && today !== lastDateText) {
                    const dateDiv = document.createElement('div');
                    dateDiv.className = 'am-log-date-header';
                    dateDiv.dataset.date = today;
                    dateDiv.style.cssText = 'color:#888;font-size:10px;text-align:center;margin:8px 0;border-bottom:1px solid #eee;position:relative;';
                    dateDiv.innerHTML = `<span style="background:#fff;padding:0 8px;position:relative;top:8px;">${today}</span>`;
                    fragment.appendChild(dateDiv);
                    this.lastFlushedDate = today;
                }

                const div = document.createElement('div');
                div.className = 'am-log-line';
                div.innerHTML = `<span class="am-log-time">[${time}]</span>${msg}`;
                if (isError) div.style.color = '#ff4d4f';
                fragment.appendChild(div);
            });

            this.el.appendChild(fragment);

            // 清理旧日志 (保持约100条)
            while (this.el.childElementCount > 100) {
                this.el.firstChild.remove();
            }

            // 滚动到底部
            if (State.config.logExpanded && (this.el.scrollHeight - this.el.scrollTop - this.el.clientHeight < 50)) {
                this.el.scrollTop = this.el.scrollHeight;
            }

            this.buffer = [];
            this.timer = null;
        },

        clear() {
            if (this.el) this.el.innerHTML = '';
        }
    };

    // ==========================================
    // 3. 核心计算 (Logic)
    // ==========================================
    const Core = {
        // 使用 XPath 高效查找包含 "花费(元)" 的元素，避免遍历所有 span
        getTotalCost() {
            try {
                // XPath 定位：查找包含文本 "花费(元)" 的 span
                // 限制查找范围在常见的顶部统计区域 (class 包含 summary 或 overview 的 div)，如果找不到则全文查找
                const xpath = "//span[contains(text(), '花费(元)')]";
                const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                let span = result.singleNodeValue;

                if (span) {
                    const container = span.closest('div');
                    if (container) {
                        const rawText = container.textContent.replace('花费(元)', '').replace(/,/g, '').trim();
                        // 提取第一个浮点数
                        const match = rawText.match(/(\d+(\.\d+)?)/);
                        if (match) {
                            return parseFloat(match[0]) || 0;
                        }
                    }
                }
                return 0;
            } catch (e) {
                return 0;
            }
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
                    text += child.textContent;
                }
                child = child.nextSibling;
            }
            const match = text.replace(/,/g, '').trim().match(/^(\d+(\.\d+)?)/);
            return match ? parseFloat(match[1]) : 0;
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
            const signature = Array.from(headers).map(h => h.textContent.substring(0, 5)).join('');
            if (this.colMapCache.signature === signature && this.colMapCache.map) {
                return this.colMapCache.map;
            }

            const map = { cost: -1, wang: -1, carts: [], guide: -1, click: -1, budget: -1 };
            headers.forEach((th, i) => {
                const text = (th.textContent || '').replace(/\s+/g, ''); // 移除所有空格
                const idx = (th.cellIndex !== undefined) ? th.cellIndex : i;

                if (text.includes('花费') && !text.includes('平均') && !text.includes('千次')) map.cost = idx;
                else if (text.includes('旺旺咨询量')) map.wang = idx;
                else if ((text.includes('购物车') || text.includes('加购')) && !text.includes('率') && !text.includes('成本')) map.carts.push(idx);
                else if ((text.includes('引导访问') && text.includes('潜客')) || (text.includes('潜客数') && !text.includes('占比'))) map.guide = idx;
                else if (text.includes('点击量')) map.click = idx;
                else if (text.includes('预算') && !text.includes('建议')) map.budget = idx;
            });

            this.colMapCache = { signature, map };
            return map;
        },

        run() {
            // 自动点击花费列降序排序（需要开启配置，且未排序时）
            if (State.config.autoSortCharge && !this._sortedByCharge) {
                const chargeHeader = document.querySelector('[mx-stickytable-sort="charge"]');
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

            const table = document.querySelector('div[mx-stickytable-wrapper="body"] table') || document.querySelector('table');
            if (!table) return;

            // 获取表头 (处理 Sticky Table 结构)
            let headers;
            const stickyHeaderWrapper = table.closest('[mx-stickytable-wrapper="body"]')?.parentElement?.querySelector('[mx-stickytable-wrapper="head"]');
            if (stickyHeaderWrapper) {
                headers = stickyHeaderWrapper.querySelectorAll('th');
            } else {
                headers = table.querySelectorAll('thead th');
            }
            if (!headers || headers.length === 0) return;

            const colMap = this.getColumnIndexMap(headers);
            const { showCost, showCartCost, showPercent, showCostRatio, showBudget } = State.config;

            // 检查是否需要执行
            const needCost = showCost && colMap.cost > -1 && colMap.wang > -1;
            const needCart = showCartCost && colMap.cost > -1 && colMap.carts.length > 0;
            const needPercent = showPercent && colMap.guide > -1 && colMap.click > -1;
            const needRatio = showCostRatio && colMap.cost > -1;
            const needBudget = showBudget && colMap.cost > -1 && colMap.budget > -1;

            if (!needCost && !needCart && !needPercent && !needRatio && !needBudget) return;

            // 获取总花费 (只需一次，且去重日志)
            const totalCost = needRatio ? this.getTotalCost() : 0;
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

                // 4. 花费占比
                if (needRatio && totalCost > 0) {
                    const cCost = getCell(curMap.cost);
                    if (cCost) {
                        const cost_val = this.parseValue(cCost);
                        if (cost_val > 0) {
                            if (this.renderTag(cCost, 'ratio-tag', `占比: ${((cost_val / totalCost) * 100).toFixed(1)}%`, CONSTANTS.STYLES.ratio)) updatedCount++;
                        }
                    }
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

    // ==========================================
    // 4. UI 界面 (View) - 参考算法护航脚本样式
    // ==========================================
    const UI = {
        init() {
            this.injectStyles();
            this.createElements();
            this.bindEvents();
            this.updateState();
        },

        injectStyles() {
            const css = `
                /* 悬浮球（最小化按钮） - 40px SVG图标 灰色系 */
                #am-helper-icon {
                    position: fixed; top: 120px; right: 20px; z-index: 999999;
                    width: 40px; height: 40px; background: #fff; border-radius: 50%;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12); cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    color: #555; border: 1px solid #d9d9d9;
                    transition: all 0.3s ease;
                }
                #am-helper-icon:hover { 
                    transform: scale(1.1); 
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
                    color: #333;
                }

                /* 主面板 - 位置对齐悬浮球 灰色系 */
                #am-helper-panel {
                    position: fixed; top: 120px; right: 20px; z-index: 999999;
                    background: #fff; border-radius: 8px; width: 280px; min-width: 250px; max-width: 500px;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
                    font-family: -apple-system, system-ui, sans-serif; 
                    border: 1px solid #d9d9d9;
                    opacity: 1; transform: scale(1); transform-origin: top right;
                    transition: opacity 0.3s ease, transform 0.3s ease, width 0.5s ease;
                    overflow: hidden;
                }
                #am-helper-panel.hidden {
                    opacity: 0; transform: scale(0.8); pointer-events: none;
                }

                /* 头部 灰色系 */
                .am-header { 
                    padding: 12px 15px; 
                    border-bottom: 1px solid #e8e8e8; 
                    background: linear-gradient(135deg, #fafafa, #f5f5f5);
                    display: flex; justify-content: space-between; align-items: center; 
                }
                .am-title { 
                    font-weight: 600; font-size: 14px; color: #333;
                    display: flex; align-items: center; gap: 6px;
                }
                .am-version {
                    font-size: 10px; color: #999; font-weight: normal;
                }
                .am-close-btn { 
                    cursor: pointer; color: #999; font-size: 14px; font-weight: bold;
                    width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
                    border-radius: 4px; transition: all 0.2s;
                }
                .am-close-btn:hover { color: #ff4d4f; background: rgba(255,77,79,0.1); }

                /* 内容区 灰色系 */
                .am-body { padding: 15px; }
                .am-btn-group { 
                    display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px; 
                }
                .am-toggle-btn {
                    text-align: center; font-size: 11px; padding: 8px 4px; border-radius: 6px; cursor: pointer;
                    border: 1px solid #d9d9d9; background: #fff; color: #666; 
                    transition: all 0.2s; font-weight: 500;
                }
                .am-toggle-btn:hover { border-color: #888; color: #333; }
                .am-toggle-btn.active { 
                    background: linear-gradient(135deg, #f0f0f0, #e8e8e8); 
                    border-color: #666; color: #333; font-weight: 600; 
                }

                /* 日志区 灰色系 */
                .am-log-section { margin-top: 12px; }
                .am-log-header { 
                    display: flex; justify-content: space-between; align-items: center;
                    font-size: 11px; color: #666; margin-bottom: 6px; padding: 0 2px;
                }
                .am-action-btn { 
                    cursor: pointer; color: #666; margin-left: 10px; 
                    padding: 2px 6px; border-radius: 4px; transition: all 0.2s;
                }
                .am-action-btn:hover { background: #f0f0f0; color: #333; }
                #am-log-content {
                    height: 100px; overflow-y: auto; 
                    background: #fafafa; border: 1px solid #e8e8e8;
                    border-radius: 6px; padding: 8px; font-size: 10px; color: #555;
                    font-family: 'Monaco', 'Consolas', monospace;
                    transition: all 0.3s ease;
                }
                #am-log-content.collapsed { height: 0; padding: 0; border: none; opacity: 0; }
                .am-log-line { 
                    padding: 2px 0; line-height: 1.5; 
                    border-bottom: 1px dashed #e8e8e8;
                }
                .am-log-line:last-child { border-bottom: none; }
                .am-log-time { color: #999; margin-right: 6px; }

                /* 拖拽调整宽度 灰色系 */
                .am-resizer-left {
                    position: absolute; left: 0; top: 0; bottom: 0; width: 6px;
                    cursor: ew-resize; z-index: 10; transition: background 0.2s;
                }
                .am-resizer-left:hover { background: rgba(0, 0, 0, 0.1); }
            `;
            const style = document.createElement('style');
            style.textContent = css;
            document.head.appendChild(style);
        },

        createElements() {
            const root = document.createElement('div');
            root.innerHTML = `
                <div id="am-helper-icon" title="点击展开助手面板">
                    <svg viewBox="0 0 1024 1024" width="22" height="22" fill="currentColor"><path d="M852.1 432.8L542.4 69.2c-26.6-30.8-74.6-11.8-74.6 28.6v238H218c-36.2 0-60.6 37.8-44.4 69.4l270.2 522.4c18.6 36 71.8 23.4 71.8-17V681h249.6c36.2 0 60.8-38 44.6-69.6z"></path></svg>
                </div>
                <div id="am-helper-panel">
                    <div class="am-resizer-left"></div>
                    <div class="am-header">
                        <span class="am-title">
                            <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor" style="margin-right:4px;"><path d="M852.1 432.8L542.4 69.2c-26.6-30.8-74.6-11.8-74.6 28.6v238H218c-36.2 0-60.6 37.8-44.4 69.4l270.2 522.4c18.6 36 71.8 23.4 71.8-17V681h249.6c36.2 0 60.8-38 44.6-69.6z"></path></svg>
                            阿里助手 Pro
                            <span class="am-version">v${CURRENT_VERSION}</span>
                        </span>
                        <div class="am-close-btn" title="最小化">−</div>
                    </div>
                    <div class="am-body">
                        <div class="am-btn-group">
                            <div class="am-toggle-btn" data-key="showCost">询单成本</div>
                            <div class="am-toggle-btn" data-key="showCartCost">加购成本</div>
                            <div class="am-toggle-btn" data-key="showPercent">潜客占比</div>
                            <div class="am-toggle-btn" data-key="showCostRatio">花费占比</div>
                            <div class="am-toggle-btn" data-key="showBudget">预算进度</div>
                            <div class="am-toggle-btn" data-key="autoSortCharge">花费排序</div>
                            <div class="am-toggle-btn" data-key="autoClose">弹窗速闭</div>
                            <div class="am-toggle-btn" id="am-trigger-optimizer" style="background:#f0f5ff;color:#2f54eb;border:1px solid #adc6ff;">算法护航</div>
                        </div>
                        <div class="am-log-section">
                            <div class="am-log-header">
                                <span>📋 运行日志</span>
                                <div>
                                    <span class="am-action-btn" id="am-log-clear">清空</span>
                                    <span class="am-action-btn" id="am-log-toggle">隐藏</span>
                                </div>
                            </div>
                            <div id="am-log-content"></div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(root);
            Logger.el = document.getElementById('am-log-content');
        },

        bindEvents() {
            const icon = document.getElementById('am-helper-icon');
            const panel = document.getElementById('am-helper-panel');
            const closeBtn = panel.querySelector('.am-close-btn');
            const resizer = panel.querySelector('.am-resizer-left');

            // 展开/收起动画
            icon.onclick = () => {
                State.config.panelOpen = true;
                State.save();
                this.updateState();
            };
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                State.config.panelOpen = false;
                State.save();
                this.updateState();
            };

            // 点击面板外部自动最小化
            document.addEventListener('click', (e) => {
                if (State.config.panelOpen && !panel.contains(e.target) && !icon.contains(e.target)) {
                    State.config.panelOpen = false;
                    State.save();
                    this.updateState();
                }
            });

            // 功能按钮
            document.querySelectorAll('.am-toggle-btn').forEach(btn => {
                if (btn.id === 'am-trigger-optimizer') return;
                btn.onclick = () => {
                    const key = btn.dataset.key;
                    State.config[key] = !State.config[key];
                    State.save();
                    this.updateState();
                    Logger.log(`${btn.textContent} ${State.config[key] ? '✅' : '❌'}`);
                    if (key !== 'autoClose') Core.run();
                };
            });

            // 算法护航按钮
            const optBtn = document.getElementById('am-trigger-optimizer');
            if (optBtn) {
                optBtn.onclick = () => {
                    // [ADD] 点击护航时自动最小化主面板
                    State.config.panelOpen = false;
                    State.save();
                    this.updateState();

                    if (typeof window.__ALIMAMA_OPTIMIZER_TOGGLE__ === 'function') {
                        window.__ALIMAMA_OPTIMIZER_TOGGLE__();
                    } else {
                        Logger.log('⚠️ 算法护航模块初始化中...', true);
                        setTimeout(() => {
                            if (typeof window.__ALIMAMA_OPTIMIZER_TOGGLE__ === 'function') {
                                window.__ALIMAMA_OPTIMIZER_TOGGLE__();
                            } else {
                                alert('算法护航模块无法加载，请刷新页面重试');
                            }
                        }, 1000);
                    }
                };
            }

            // 日志操作
            document.getElementById('am-log-clear').onclick = () => { Logger.clear(); Logger.log('日志已清空'); };
            document.getElementById('am-log-toggle').onclick = () => {
                State.config.logExpanded = !State.config.logExpanded;
                State.save();
                this.updateState();
            };

            // 拖拽调整宽度
            let isResizing = false, startX = 0, startWidth = 0;
            resizer.onmousedown = (e) => {
                isResizing = true;
                startX = e.clientX;
                startWidth = panel.offsetWidth;
                document.body.style.userSelect = 'none';
                e.preventDefault();
            };
            document.addEventListener('mousemove', (e) => {
                if (isResizing) {
                    const newWidth = Math.min(500, Math.max(250, startWidth + startX - e.clientX));
                    panel.style.width = newWidth + 'px';
                }
            });
            document.addEventListener('mouseup', () => {
                isResizing = false;
                document.body.style.userSelect = '';
            });

            // 交互监听
            document.addEventListener('click', (e) => {
                // 弹窗自动关闭
                if (State.config.autoClose) {
                    const target = e.target;
                    if (typeof target.className === 'string' && (target.className.includes('mask') || parseInt(target.style.zIndex) > 900)) {
                        const closeBtn = target.querySelector('[mx-click*="close"], .mx-iconfont.close');
                        if (closeBtn) { closeBtn.click(); Logger.log('🛡️ 自动闭窗'); }
                    }
                }

                const tabTexts = ['关键词', '人群', '创意', '资源位', '地域', '时段'];
                const clickedText = e.target.textContent || '';
                const isTabClick = tabTexts.some(t => clickedText.includes(t)) &&
                    (e.target.closest('a[mx-click]') || e.target.closest('[class*="tab"]'));
                if (isTabClick) resetSortState('Tab 切换');

                // 触发更新
                const updateKeywords = ['查询', '搜索', '确定', '翻页', '分页'];
                const txt = e.target.textContent || '';
                if (updateKeywords.some(k => txt.includes(k))) {
                    Logger.log('🖱️ 触发更新');
                }
            }, true);
        },

        updateState() {
            const { panelOpen, logExpanded } = State.config;
            const icon = document.getElementById('am-helper-icon');
            const panel = document.getElementById('am-helper-panel');
            const logContent = document.getElementById('am-log-content');
            const logToggle = document.getElementById('am-log-toggle');

            // 面板显示/隐藏动画
            if (panelOpen) {
                panel.classList.remove('hidden');
                icon.style.display = 'none';
            } else {
                panel.classList.add('hidden');
                setTimeout(() => { icon.style.display = 'flex'; }, 300);
            }

            // 功能按钮状态
            document.querySelectorAll('.am-toggle-btn').forEach(btn => {
                const key = btn.dataset.key;
                if (State.config[key]) btn.classList.add('active');
                else btn.classList.remove('active');
            });

            // 日志展开/折叠
            if (logExpanded) {
                logContent.classList.remove('collapsed');
                logToggle.textContent = '隐藏';
            } else {
                logContent.classList.add('collapsed');
                logToggle.textContent = '展开';
            }
        }
    };

    // ==========================================
    // 5. 网络拦截与报表抓取 (Interceptor)
    // ==========================================
    const Interceptor = {
        panel: null,
        keywords: CONSTANTS.DL_KEYWORDS,

        init() {
            this.createPanel();
            this.hookFetch();
            this.hookXHR();
        },

        createPanel() {
            const div = document.createElement('div');
            div.style.cssText = "position:fixed; bottom:20px; right:20px; background:rgba(0,0,0,0.9); color:#fff; padding:15px; z-index:2147483647; border-radius:8px; font-size:13px; display:none; width:340px; box-shadow:0 4px 20px rgba(0,0,0,0.6); border:1px solid #444;";
            document.body.appendChild(div);
            this.panel = div;
        },

        show(url, source) {
            if (this.panel.dataset.lastUrl === url && this.panel.style.display === 'block') return;
            this.panel.dataset.lastUrl = url;

            Logger.log(`📂 捕获报表: ${source}`, true);

            this.panel.innerHTML = `
                <div style="margin-bottom:10px; font-weight:bold; color:#00ff9d; display:flex; justify-content:space-between;">
                    <span>✅ 捕获报表</span><span style="color:#888;font-size:10px">${source}</span>
                </div>
                <div style="background:#222; padding:8px; border-radius:4px; margin-bottom:12px; word-break:break-all; font-size:11px; color:#aaa; max-height:50px; overflow:hidden;">${url}</div>
                <div style="display:flex; gap:10px;">
                    <a href="${url}" target="_blank" style="background:#28a745; color:white; text-decoration:none; padding:8px 0; text-align:center; border-radius:4px; flex:2;">⚡ 直连下载</a>
                    <button id="am-cp-btn" style="background:#17a2b8; color:white; border:none; border-radius:4px; flex:1; cursor:pointer;">复制</button>
                    <button id="am-cl-btn" style="background:#555; color:white; border:none; border-radius:4px; flex:0.5; cursor:pointer;">X</button>
                </div>
                <div style="margin-top:8px; font-size:10px; color:#aaa;">提示：如果下载的文件名无后缀，请手动添加 .xlsx</div>
            `;
            this.panel.style.display = 'block';

            document.getElementById('am-cp-btn').onclick = function () {
                GM_setClipboard(url);
                this.innerText = '已复制';
                setTimeout(() => this.innerText = '复制', 1500);
            };
            document.getElementById('am-cl-btn').onclick = () => this.panel.style.display = 'none';
        },

        // --- 递归解析 JSON (Restored Original Logic) ---
        findUrlInObject(obj, source) {
            if (!obj) return;
            if (typeof obj === 'string') {
                if (obj.startsWith('http') && this.keywords.some(k => obj.includes(k))) {
                    if (!obj.match(/\.(jpg|png|gif|jpeg)$/i)) {
                        this.show(obj, source); // Modified to call this.show
                    }
                }
                return;
            }
            if (typeof obj === 'object') {
                for (let key in obj) {
                    this.findUrlInObject(obj[key], source);
                }
            }
        },

        handleResponse(text, source) {
            try {
                const json = JSON.parse(text);
                this.findUrlInObject(json, `JSON:${source}`);
            } catch (e) {
                // Fallback Regex from original code
                if (text && this.keywords.some(k => text.includes(k))) {
                    const regex = /https?:\/\/[^"'\s\\]+(?:xlsx|csv|MAIN)[^"'\s\\]*/g;
                    const matches = text.match(regex);
                    if (matches) matches.forEach(m => this.show(m, `Regex:${source}`));
                }
            }
        },

        hookFetch() {
            const originalFetch = window.fetch;
            const self = this;
            window.fetch = async (...args) => {
                const response = await originalFetch(...args);
                const clone = response.clone();
                clone.text().then(text => self.handleResponse(text, 'Fetch')).catch(() => { });
                return response;
            };
        },

        hookXHR() {
            const originalSend = XMLHttpRequest.prototype.send;
            const self = this;
            XMLHttpRequest.prototype.send = function () {
                this.addEventListener('load', function () {
                    self.handleResponse(this.responseText, 'XHR');
                });
                return originalSend.apply(this, arguments);
            };
        }
    };

    // ==========================================
    // 6. 启动程序
    // ==========================================
    function main() {
        UI.init();
        Interceptor.init();

        Logger.log(`🚀 阿里助手 Pro v${CURRENT_VERSION} 已启动`);

        let lastUrl = window.location.href;
        const checkUrlChange = () => {
            if (window.location.href !== lastUrl) {
                lastUrl = window.location.href;
                resetSortState('页面切换');
            }
        };
        window.addEventListener('hashchange', checkUrlChange);
        window.addEventListener('popstate', checkUrlChange);

        let timer;
        const observer = new MutationObserver((mutations) => {
            if (timer) return;
            timer = setTimeout(() => {
                Core.run();
                timer = null;
            }, 1000);
        });

        observer.observe(document.body, { childList: true, subtree: true });

        setTimeout(() => Core.run(), 1000);
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

(function () {
    'use strict';

    // 局部版本管理 (确保该模块也能读取到正确版本号)
    const CURRENT_VERSION = typeof GM_info !== 'undefined' ? GM_info.script.version : '5.23';

    // ==================== 配置模块 ====================
    const CONFIG = {
        UI_ID: 'alimama-escort-helper-ui',
        VERSION: CURRENT_VERSION || '5.23',
        DEFAULT: {
            bizCode: 'universalBP',
            customPrompt: '帮我进行深度诊断',
            concurrency: 3
        }
    };

    let userConfig = { ...CONFIG.DEFAULT, ...GM_getValue('config', {}) };

    // ==================== 日志模块 ====================
    const Logger = {
        prefix: '[EscortAPI]',
        debug: (msg, ...args) => console.log(`${Logger.prefix} 🔍 ${msg}`, ...args),
        info: (msg, ...args) => console.log(`${Logger.prefix} ${msg}`, ...args),
        warn: (msg, ...args) => console.warn(`${Logger.prefix} ${msg}`, ...args),
        error: (msg, ...args) => console.error(`${Logger.prefix} ${msg}`, ...args),
    };

    // ==================== 状态管理 ====================
    const State = {
        tokens: { dynamicToken: '', loginPointId: '', csrfID: '' },
        currentRunId: 0,
        runAbortController: null
    };

    // ==================== 工具函数模块 ====================
    const Utils = {
        delay: (ms) => new Promise(r => setTimeout(r, ms)),
        escapeHtml: (value) => {
            const str = value === null || value === undefined ? '' : String(value);
            return str.replace(/[&<>"']/g, ch => {
                const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
                return map[ch] || ch;
            });
        },
        toLocalYMD: (date = new Date()) => {
            const pad = (n) => String(n).padStart(2, '0');
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
        },

        // 并发限制执行器
        concurrentLimit: async (tasks, limit = 3) => {
            const results = [];
            const executing = new Set();

            for (const task of tasks) {
                const p = Promise.resolve().then(() => task());
                results.push(p);
                executing.add(p);

                const clean = () => executing.delete(p);
                p.then(clean, clean);

                if (executing.size >= limit) {
                    await Promise.race(executing);
                }
            }

            return Promise.allSettled(results);
        },

        // 生成 UUID
        uuid: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        }),

        // 自动获取 campaignGroupId
        getCampaignGroupId: () => {
            // 从 URL/hash 获取
            const urlMatch = window.location.href.match(/campaignGroupId=(\d+)/i);
            if (urlMatch) return urlMatch[1];

            const hashMatch = window.location.hash.match(/campaignGroupId[=:](\d+)/i);
            if (hashMatch) return hashMatch[1];

            // 从全局变量获取
            for (const src of [window.g_config, window.PageConfig, window.__magix_data__]) {
                if (src?.campaignGroupId) return src.campaignGroupId;
                if (src?.data?.campaignGroupId) return src.data.campaignGroupId;
            }

            // 从页面元素获取
            const input = document.querySelector('input[name="campaignGroupId"]');
            if (input?.value) return input.value;

            return '';
        },

        // 从 actionInfo 提取详情
        extractDetail: (item) => {
            if (item.redirectUrl) return '跳转链接';
            if (!item.actionInfo) return '-';

            try {
                const info = typeof item.actionInfo === 'string'
                    ? JSON.parse(item.actionInfo) : item.actionInfo;

                // 提取 rawPrompt 中"的"后面的内容
                if (info.rawPrompt) {
                    const match = info.rawPrompt.match(/计划[：:]\d+的(.+)/);
                    if (match?.[1]) return match[1].trim();

                    const simpleMatch = info.rawPrompt.match(/的([^的]+)$/);
                    if (simpleMatch?.[1]) return simpleMatch[1].trim();
                }

                // layerText（算法护航提示）
                if (info.layerText) {
                    return info.layerText.substring(0, 25).replace(/[【】]/g, '') +
                        (info.layerText.length > 25 ? '...' : '');
                }

                if (info.target) return info.target;
                return '-';
            } catch {
                return '-';
            }
        },

        // 获取方案名称
        getActionName: (action) => {
            if (action.actionName) return action.actionName;

            if (action.adjustInfo) {
                try {
                    const info = typeof action.adjustInfo === 'string'
                        ? JSON.parse(action.adjustInfo) : action.adjustInfo;
                    const typeMap = {
                        'putRoiTarget': '投产比目标调整',
                        'dayBudget': '日预算调整',
                        'timeBudget': '分时预算调整',
                        'price': '出价调整',
                        'crowd': '人群定向调整'
                    };
                    if (info.adjustType) return typeMap[info.adjustType] || info.adjustType;
                } catch { }
            }

            return action.actionTitle || action.title || action.actionText || '未知方案';
        },

        // 判断是否为有效方案（非未知）
        isValidAction: (name) => name && name !== '未知方案' && name !== '未知'
    };

    // ==================== Token 管理模块 ====================
    const TokenManager = {
        // Hook XHR 捕获 Token
        hookXHR: () => {
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;

            XMLHttpRequest.prototype.open = function (method, url) {
                this._url = url;
                return originalOpen.apply(this, arguments);
            };

            XMLHttpRequest.prototype.send = function (data) {
                try {
                    const url = this._url;
                    if (url?.includes('dynamicToken') || url?.includes('loginPointId')) {
                        const urlObj = new URL(url, window.location.origin);
                        State.tokens.dynamicToken = urlObj.searchParams.get('dynamicToken') || State.tokens.dynamicToken;
                        State.tokens.loginPointId = urlObj.searchParams.get('loginPointId') || State.tokens.loginPointId;
                    }

                    if (data && typeof data === 'string') {
                        try {
                            const json = JSON.parse(data);
                            State.tokens.dynamicToken = json.dynamicToken || State.tokens.dynamicToken;
                            State.tokens.loginPointId = json.loginPointId || State.tokens.loginPointId;
                        } catch {
                            const params = new URLSearchParams(data);
                            State.tokens.dynamicToken = params.get('dynamicToken') || State.tokens.dynamicToken;
                            State.tokens.loginPointId = params.get('loginPointId') || State.tokens.loginPointId;
                        }
                    }
                } catch { }
                return originalSend.apply(this, arguments);
            };

            Logger.info('XHR Hook 已注入');
        },

        // 深度搜索全局变量
        deepSearch: () => {
            if (State.tokens.dynamicToken && State.tokens.loginPointId) return;

            const findInObj = (obj, depth = 0) => {
                if (!obj || depth > 3) return;
                try {
                    for (const key in obj) {
                        if (key === 'dynamicToken') State.tokens.dynamicToken = obj[key];
                        if (key === 'loginPointId') State.tokens.loginPointId = obj[key];
                        if (key === 'user' && obj[key]?.accessInfo) {
                            State.tokens.dynamicToken = obj[key].accessInfo.dynamicToken || State.tokens.dynamicToken;
                            State.tokens.loginPointId = obj[key].accessInfo.loginPointId || State.tokens.loginPointId;
                        }
                        if (typeof obj[key] === 'object') findInObj(obj[key], depth + 1);
                    }
                } catch { }
            };

            [window.g_config, window.PageConfig, window.mm, window.FEED_CONFIG, window.__magix_data__]
                .forEach(c => findInObj(c));
        },

        // 刷新 Token
        refresh: () => {
            TokenManager.deepSearch();

            // 从 cookie 获取 CSRF
            const csrfMatch = document.cookie.match(/_tb_token_=([^;]+)/);
            if (csrfMatch) State.tokens.csrfID = csrfMatch[1];

            // 从 Magix Vframe 获取
            if (window.Magix?.Vframe) {
                try {
                    const vframes = window.Magix.Vframe.all();
                    for (const id in vframes) {
                        const info = vframes[id]?.view?.user?.accessInfo ||
                            vframes[id]?.$v?.$d?.$d?.user?.accessInfo;
                        if (info) {
                            State.tokens.dynamicToken = info.dynamicToken || State.tokens.dynamicToken;
                            State.tokens.loginPointId = info.loginPointId || State.tokens.loginPointId;
                            State.tokens.csrfID = info.csrfId || State.tokens.csrfID;
                        }
                    }
                } catch { }
            }
        }
    };

    // ==================== API 请求模块 ====================
    const API = {
        /**
         * 单次请求（使用原生 fetch API）
         * NOTE: 由于 GM_xmlhttpRequest 在某些油猴管理器中存在跨域问题，
         * 这里改用页面原生的 fetch API。阿里妈妈网站本身应该已配置 CORS 允许子域请求。
         */
        _singleRequest: async (url, data, timeout = 30000, signal) => {
            const startTime = Date.now();
            const reqId = Math.random().toString(36).substring(2, 8);

            Logger.debug(`[${reqId}] 发起请求:`, { url, timeout: `${timeout}ms` });
            Logger.debug(`[${reqId}] 请求数据:`, data);

            // 创建 AbortController 用于超时控制
            const controller = new AbortController();
            let timedOut = false;
            const timeoutId = setTimeout(() => {
                timedOut = true;
                controller.abort();
            }, timeout);
            if (signal) {
                if (signal.aborted) controller.abort();
                else signal.addEventListener('abort', () => controller.abort(), { once: true });
            }

            try {
                Logger.debug(`[${reqId}] 使用原生 fetch 发送请求...`);

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json, text/event-stream, */*'
                    },
                    body: JSON.stringify(data),
                    credentials: 'include',  // 自动携带 Cookie
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                const elapsed = Date.now() - startTime;

                Logger.debug(`[${reqId}] 响应状态:`, {
                    status: response.status,
                    statusText: response.statusText,
                    elapsed: `${elapsed}ms`
                });

                if (!response.ok) {
                    const errorText = await response.text().catch(() => '');
                    throw new Error(`HTTP ${response.status}: ${response.statusText}${errorText ? ` - ${errorText.substring(0, 200)}` : ''}`);
                }

                const contentType = (response.headers.get('content-type') || '').toLowerCase();
                if (contentType.includes('text/event-stream') && response.body?.getReader) {
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let buffer = '';
                    const chunks = [];

                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;
                        buffer += decoder.decode(value, { stream: true });

                        const lines = buffer.split(/\r?\n/);
                        buffer = lines.pop() || '';
                        lines.forEach(line => {
                            const trimmed = line.trim();
                            if (!trimmed.startsWith('data:')) return;
                            const payload = trimmed.substring(5).trim();
                            if (!payload) return;
                            try { chunks.push(JSON.parse(payload)); } catch { }
                        });
                    }

                    if (buffer.trim().startsWith('data:')) {
                        const payload = buffer.trim().substring(5).trim();
                        if (payload) {
                            try { chunks.push(JSON.parse(payload)); } catch { }
                        }
                    }

                    if (chunks.length) {
                        Logger.debug(`[${reqId}] SSE 流解析: ${chunks.length} 条数据 (${Date.now() - startTime}ms)`);
                        return { isStream: true, chunks };
                    }
                    throw new Error('SSE 响应为空');
                }

                const responseText = await response.text();
                Logger.debug(`[${reqId}] 响应内容 (${responseText.length}字符):`, responseText.substring(0, 500));

                // 尝试解析 JSON
                try {
                    const result = JSON.parse(responseText);
                    Logger.debug(`[${reqId}] 请求成功 (${elapsed}ms)`);
                    return result;
                } catch {
                    // 尝试解析 SSE 流格式
                    if (responseText.includes('data:')) {
                        const chunks = responseText.split('\n')
                            .filter(line => line.trim().startsWith('data:'))
                            .map(line => {
                                try { return JSON.parse(line.substring(5).trim()); }
                                catch { return null; }
                            })
                            .filter(Boolean);

                        if (chunks.length) {
                            Logger.debug(`[${reqId}] SSE 流解析: ${chunks.length} 条数据 (${elapsed}ms)`);
                            return { isStream: true, chunks };
                        }
                    }
                    throw new Error(`解析响应失败: ${responseText.substring(0, 100)}`);
                }

            } catch (err) {
                clearTimeout(timeoutId);
                const elapsed = Date.now() - startTime;

                if (err.name === 'AbortError') {
                    if (timedOut) {
                        Logger.error(`[${reqId}] 请求超时 (${elapsed}ms, 配置${timeout}ms)`);
                        throw new Error(`请求超时 (>${timeout}ms)`);
                    }
                    const abortErr = new Error('请求已取消');
                    abortErr.name = 'AbortError';
                    throw abortErr;
                }

                Logger.error(`[${reqId}] 请求失败 (${elapsed}ms):`, {
                    error: err.message,
                    name: err.name,
                    stack: err.stack?.split('\n').slice(0, 3).join('\n')
                });
                throw err;
            }
        },

        // 带重试的请求
        request: async (url, data, options = {}) => {
            const { maxRetries = 3, timeout = 30000, retryDelay = 2000, signal } = options;
            let lastError = null;

            Logger.info(`📡 API请求: ${url.split('/').pop()}`, { maxRetries, timeout });

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const result = await API._singleRequest(url, data, timeout, signal);
                    Logger.info(`✓ 请求成功 (第${attempt}次)`);
                    return result;
                } catch (err) {
                    lastError = err;
                    if (err.name === 'AbortError') throw err;
                    Logger.warn(`✗ 请求失败 (第${attempt}/${maxRetries}次): ${err.message}`);

                    if (attempt < maxRetries) {
                        Logger.info(`⏳ ${retryDelay / 1000}秒后重试...`);
                        await Utils.delay(retryDelay);
                    }
                }
            }

            Logger.error(`❌ 请求最终失败: ${lastError.message}`, { url, attempts: maxRetries });
            throw lastError;
        }
    };

    // ==================== UI 渲染模块 ====================
    const UI = {
        // 公共样式
        styles: {
            table: `width:100%;border-collapse:collapse;font-size:10px;margin:4px 0 8px;border-radius:4px;overflow:hidden;`,
            th: `padding:5px 6px;text-align:left;font-weight:600;border-bottom:1px solid;`,
            td: `padding:4px 6px;border-bottom:1px solid #f0f0f0;color:#555;`
        },

        // 全局状态日志（用于非计划相关的消息）
        updateStatus: (text, color = '#aaa') => {
            const container = document.getElementById(`${CONFIG.UI_ID}-log`);
            if (!container) return;

            const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
            const line = document.createElement('div');
            const timeSpan = document.createElement('span');
            timeSpan.style.cssText = 'color:#666;margin-right:4px;';
            timeSpan.textContent = `[${time}]`;
            const textSpan = document.createElement('span');
            textSpan.style.color = color;
            textSpan.textContent = text;
            line.appendChild(timeSpan);
            line.appendChild(textSpan);
            container.appendChild(line);

            while (container.children.length > 50) container.removeChild(container.firstChild);
            container.parentElement.scrollTop = container.parentElement.scrollHeight;
        },

        // 创建计划卡片（每个计划独立的日志区域）
        createCampaignCard: (campaignId, campaignName, index, total) => {
            const container = document.getElementById(`${CONFIG.UI_ID}-log`);
            if (!container) return null;

            const cardId = `${CONFIG.UI_ID}-card-${campaignId}`;
            const safeCampaignName = Utils.escapeHtml(campaignName);
            const safeCampaignId = Utils.escapeHtml(campaignId);
            const card = document.createElement('div');
            card.id = cardId;
            card.style.cssText = `
                background:#fff;border:1px solid #e8e8e8;border-radius:6px;margin-bottom:8px;
                overflow:hidden;transition:all 0.3s ease;
            `;
            card.innerHTML = `
                <div class="card-header" style="
                    padding:8px 12px;background:#fafafa;border-bottom:1px solid #e8e8e8;
                    display:flex;justify-content:space-between;align-items:center;cursor:pointer;
                ">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="
                            display:inline-block;min-width:24px;height:18px;line-height:18px;
                            background:#1890ff;color:#fff;border-radius:9px;text-align:center;font-size:10px;
                        ">${index}/${total}</span>
                        <span style="font-weight:500;color:#333;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
                              title="${safeCampaignName}">${safeCampaignName}</span>
                        <span style="color:#999;font-size:10px;">(${safeCampaignId})</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="status-badge" style="
                            padding:2px 8px;border-radius:10px;font-size:10px;
                            background:#e6f7ff;color:#1890ff;
                        ">处理中</span>
                        <span class="arrow" style="
                            display:inline-block;transition:transform 0.2s;
                            font-size:10px;color:#999;
                        ">▼</span>
                    </div>
                </div>
                <div class="card-body" style="padding:8px 12px;font-size:11px;max-height:150px;overflow-y:auto;">
                    <div class="log-content" style="display:flex;flex-direction:column;gap:2px;"></div>
                </div>
                <style>
                    #${cardId} .card-body.collapsed { display:none; }
                    #${cardId} .arrow.rotated { transform:rotate(-90deg); }
                </style>
            `;
            container.appendChild(card);
            container.parentElement.scrollTop = container.parentElement.scrollHeight;

            const header = card.querySelector('.card-header');
            const body = card.querySelector('.card-body');
            const arrow = card.querySelector('.arrow');
            if (header && body && arrow) {
                header.addEventListener('click', () => {
                    body.classList.toggle('collapsed');
                    arrow.classList.toggle('rotated');
                });
            }

            // 返回卡片操作对象
            return {
                log: (text, color = '#555', options = {}) => {
                    const logContent = card.querySelector('.log-content');
                    if (!logContent) return;
                    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
                    const line = document.createElement('div');
                    const timeSpan = document.createElement('span');
                    timeSpan.style.cssText = 'color:#aaa;margin-right:4px;font-size:10px;';
                    timeSpan.textContent = time;
                    line.appendChild(timeSpan);
                    if (options.html) {
                        const htmlWrap = document.createElement('div');
                        htmlWrap.style.color = color;
                        htmlWrap.innerHTML = text;
                        line.appendChild(htmlWrap);
                    } else {
                        const textSpan = document.createElement('span');
                        textSpan.style.color = color;
                        textSpan.textContent = text;
                        line.appendChild(textSpan);
                    }
                    logContent.appendChild(line);
                    card.querySelector('.card-body').scrollTop = card.querySelector('.card-body').scrollHeight;
                },
                setStatus: (status, type = 'info') => {
                    const badge = card.querySelector('.status-badge');
                    if (!badge) return;
                    const styles = {
                        info: 'background:#e6f7ff;color:#1890ff;',
                        success: 'background:#f6ffed;color:#52c41a;',
                        warning: 'background:#fffbe6;color:#faad14;',
                        error: 'background:#fff1f0;color:#ff4d4f;'
                    };
                    badge.style.cssText = `padding:2px 8px;border-radius:10px;font-size:10px;${styles[type] || styles.info}`;
                    badge.textContent = status;

                    // 同时更新卡片边框颜色
                    const borderColors = { info: '#e8e8e8', success: '#b7eb8f', warning: '#ffe58f', error: '#ffa39e' };
                    card.style.borderColor = borderColors[type] || borderColors.info;
                },
                collapse: () => {
                    card.querySelector('.card-body')?.classList.add('collapsed');
                    card.querySelector('.arrow')?.classList.add('rotated');
                }
            };
        },

        // 渲染表格到指定卡片（通用）
        renderTableToCard: (cardLogger, data, columns, options = {}) => {
            if (!data.length) return;

            const { headerBg = '#fafafa', headerColor = '#333', highlight } = options;
            const { table, th, td } = UI.styles;

            let html = `<table style="${table}border:1px solid #e8e8e8;background:#fff;margin-top:4px;">
                <thead><tr>${columns.map(c =>
                `<th style="${th}background:${headerBg};color:${headerColor};border-color:#e0e0e0;${c.width ? `width:${c.width};` : ''}">${c.title}</th>`
            ).join('')}</tr></thead><tbody>`;

            data.forEach((row, idx) => {
                const isHighlight = highlight?.(row);
                const rowStyle = isHighlight ? 'background:#e6f7ff;' : '';
                const nameStyle = isHighlight ? 'color:#1890ff;font-weight:600;' : '';

                html += `<tr style="${rowStyle}">${columns.map((c, i) => {
                    const val = typeof c.render === 'function' ? c.render(row, idx) : row[c.key];
                    const safeVal = Utils.escapeHtml(val ?? '-');
                    return `<td style="${td}${i === 1 ? nameStyle : ''}">${safeVal}</td>`;
                }).join('')}</tr>`;
            });

            html += '</tbody></table>';
            cardLogger.log(html, '#555', { html: true });
        },

        // 渲染所有原始方案表格（到卡片）
        renderAllActionsToCard: (cardLogger, allActionLists) => {
            const data = [];
            allActionLists.forEach(list => {
                list.forEach(item => {
                    const actionText = item.actionText || '';
                    if (!actionText || actionText === '未知' || actionText === '未知方案') return;
                    data.push(item);
                });
            });

            if (!data.length) return;

            UI.renderTableToCard(cardLogger, data, [
                { title: '#', width: '24px', render: (_, i) => i + 1 },
                { title: '方案名称', render: row => row.actionText },
                { title: '详情', render: row => Utils.extractDetail(row) }
            ], {
                highlight: row => row.actionText?.includes('算法护航')
            });
        },

        // 渲染护航方案表格（到卡片）
        renderEscortActionsToCard: (cardLogger, actionList) => {
            const data = actionList.filter(a => Utils.isValidAction(Utils.getActionName(a)));
            if (!data.length) return;

            UI.renderTableToCard(cardLogger, data, [
                { title: '#', width: '24px', render: (_, i) => i + 1 },
                { title: '方案名称', render: row => Utils.getActionName(row) },
                {
                    title: '详情', render: row => {
                        if (!row.adjustInfo) return '-';
                        try {
                            const info = typeof row.adjustInfo === 'string' ? JSON.parse(row.adjustInfo) : row.adjustInfo;
                            if (info.adjustValue) return `调整值: ${info.adjustValue}`;
                            return info.adjustType || '-';
                        } catch { return '-'; }
                    }
                }
            ], { headerBg: '#e6f7ff', headerColor: '#1890ff' });
        },

        // 渲染执行结果（全屏模态弹窗）
        renderResults: (successList, failList) => {
            const data = [
                ...successList.map(item => ({ ...item, success: true })),
                ...failList.map(item => ({ ...item, success: false }))
            ];
            if (!data.length) return;

            // 移除旧结果弹窗
            const prevOverlay = document.getElementById(`${CONFIG.UI_ID}-result-overlay`);
            if (prevOverlay) prevOverlay.remove();

            // 创建模态遮罩层
            const overlay = document.createElement('div');
            overlay.id = `${CONFIG.UI_ID}-result-overlay`;
            overlay.style.cssText = `
                position:fixed;top:0;left:0;right:0;bottom:0;
                background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);
                z-index:1000002;display:flex;align-items:center;justify-content:center;
                animation:fadeIn 0.3s ease;
            `;

            // 创建结果卡片
            const successCount = successList.length;
            const failCount = failList.length;
            const totalCount = successCount + failCount;
            const isAllSuccess = failCount === 0;

            const rowsHtml = data.map((row, i) => {
                const safeName = Utils.escapeHtml(row.name ?? '-');
                return `
                                    <tr style="${row.success ? '' : 'background:#fff1f0;'}">
                                        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#666;">${i + 1}</td>
                                        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;${row.success ? '' : 'color:#ff4d4f;'}">${safeName}</td>
                                        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">
                                            ${row.success
                        ? '<span style="color:#52c41a;font-weight:600;">✓ 成功</span>'
                        : '<span style="color:#ff4d4f;font-weight:600;">✗ 失败</span>'}
                                        </td>
                                    </tr>
                `;
            }).join('');

            overlay.innerHTML = `
                <style>
                    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
                    @keyframes slideUp { from { transform:translateY(20px);opacity:0; } to { transform:translateY(0);opacity:1; } }
                </style>
                <div style="
                    background:#fff;border-radius:12px;padding:24px 32px;min-width:400px;max-width:600px;
                    box-shadow:0 20px 60px rgba(0,0,0,0.3);animation:slideUp 0.4s ease;
                    font-family:-apple-system,system-ui,sans-serif;
                ">
                    <div style="text-align:center;margin-bottom:20px;">
                        <div style="font-size:48px;margin-bottom:12px;">${isAllSuccess ? '🎉' : '⚠️'}</div>
                        <div style="font-size:20px;font-weight:600;color:#333;">执行完成</div>
                        <div style="font-size:14px;color:#666;margin-top:8px;">
                            共 ${totalCount} 个计划，
                            <span style="color:#52c41a;font-weight:600;">${successCount} 成功</span>
                            ${failCount > 0 ? `，<span style="color:#ff4d4f;font-weight:600;">${failCount} 失败</span>` : ''}
                        </div>
                    </div>
                    <div style="max-height:300px;overflow-y:auto;border:1px solid #e8e8e8;border-radius:8px;">
                        <table style="width:100%;border-collapse:collapse;font-size:13px;">
                            <thead>
                                <tr style="background:#fafafa;">
                                    <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #e8e8e8;width:40px;">#</th>
                                    <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #e8e8e8;">计划名称</th>
                                    <th style="padding:10px 12px;text-align:center;border-bottom:1px solid #e8e8e8;width:80px;">状态</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rowsHtml}
                            </tbody>
                        </table>
                    </div>
                    <div style="text-align:center;margin-top:20px;">
                        <button id="${CONFIG.UI_ID}-result-close" style="
                            padding:10px 32px;background:linear-gradient(135deg,#1890ff,#0050b3);color:#fff;
                            border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:500;
                            transition:transform 0.2s,box-shadow 0.2s;
                        ">关闭</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // 绑定关闭事件
            const closeBtn = document.getElementById(`${CONFIG.UI_ID}-result-close`);
            if (closeBtn) {
                closeBtn.addEventListener('mouseenter', () => {
                    closeBtn.style.transform = 'scale(1.05)';
                    closeBtn.style.boxShadow = '0 4px 12px rgba(24,144,255,0.4)';
                });
                closeBtn.addEventListener('mouseleave', () => {
                    closeBtn.style.transform = 'scale(1)';
                    closeBtn.style.boxShadow = 'none';
                });
            }
            if (closeBtn) closeBtn.onclick = () => {
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.3s ease';
                setTimeout(() => overlay.remove(), 300);
            };

            // 点击遮罩层也可关闭
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    overlay.style.opacity = '0';
                    overlay.style.transition = 'opacity 0.3s ease';
                    setTimeout(() => overlay.remove(), 300);
                }
            };
        },

        // 创建主界面
        create: () => {
            if (document.getElementById(CONFIG.UI_ID)) return;

            // 主面板（默认隐藏，用户点击最小化按钮后显示）
            const panel = document.createElement('div');
            panel.id = CONFIG.UI_ID;
            panel.style.cssText = `
                position:fixed;top:20px;right:20px;width:250px;min-width:250px;max-width:600px;
                padding:15px;background:#fff;color:#333;border-radius:8px;z-index:1000001;
                font-size:13px;box-shadow:0 4px 16px rgba(0,0,0,0.15);border:1px solid #e0e0e0;
                font-family:-apple-system,system-ui,sans-serif;
                opacity:0;transform:scale(0.8);transform-origin:top right;pointer-events:none;
                transition:opacity 0.3s ease, transform 0.3s ease, width 0.8s cubic-bezier(0.4,0,0.2,1);
                overflow:hidden;
            `;


            panel.innerHTML = `
                <div style="font-weight:bold;margin-bottom:12px;border-bottom:1px solid #eee;padding-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                    <span style="color:#1890ff;">🛡️ 算法护航 v${CONFIG.VERSION}</span>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:10px;color:#999;margin-right:4px;">API版</span>
                        <span id="${CONFIG.UI_ID}-center" style="cursor:pointer;color:#999;font-size:14px;transition:color 0.2s;" title="居中">⊙</span>
                        <span id="${CONFIG.UI_ID}-maximize" style="cursor:pointer;color:#999;font-size:14px;transition:color 0.2s;" title="最大化">□</span>
                        <span id="${CONFIG.UI_ID}-close" style="cursor:pointer;color:#999;font-size:18px;font-weight:bold;transition:color 0.2s;" title="关闭">×</span>
                    </div>
                </div>
                <div id="${CONFIG.UI_ID}-log-wrapper" style="background:#f5f7fa;padding:0;border-radius:6px;font-size:11px;height:0;max-height:500px;overflow:hidden;margin-bottom:0;border:1px solid #e8e8e8;font-family:Monaco,Consolas,monospace;opacity:0;transform:scaleY(0.8);transform-origin:top;transition:all 0.6s ease-out;">
                    <div id="${CONFIG.UI_ID}-log" style="color:#555;display:flex;flex-direction:column;gap:3px;line-height:1.5;padding:10px;"></div>
                </div>
                <button id="${CONFIG.UI_ID}-run" style="width:100%;padding:8px;background:linear-gradient(135deg,#1890ff,#0050b3);color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:500;margin-bottom:8px;">立即扫描并优化</button>
                <div style="margin-bottom:8px;display:flex;gap:5px;align-items:center;">
                    <label style="color:#666;font-size:10px;white-space:nowrap;">诊断话术:</label>
                    <input id="${CONFIG.UI_ID}-prompt" type="text" style="flex:1;padding:4px;border:1px solid #ddd;border-radius:4px;font-size:10px;" placeholder="例: 帮我进行深度诊断" />
                </div>
                <div style="margin-bottom:8px;display:flex;gap:5px;align-items:center;">
                    <label style="color:#666;font-size:10px;white-space:nowrap;">同时执行:</label>
                    <input id="${CONFIG.UI_ID}-concurrency" type="number" min="1" max="10" style="width:50px;padding:4px;border:1px solid #ddd;border-radius:4px;font-size:10px;text-align:center;" />
                    <span style="color:#999;font-size:10px;">个计划 (1-10)</span>
                </div>
                <div style="margin-top:10px;font-size:10px;color:#666;display:flex;justify-content:space-between;">
                    <span id="${CONFIG.UI_ID}-user" style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></span>
                    <span id="${CONFIG.UI_ID}-token" style="cursor:help;" title="Token状态">● Token</span>
                </div>
            `;

            document.body.appendChild(panel);

            const promptInput = document.getElementById(`${CONFIG.UI_ID}-prompt`);
            if (promptInput) promptInput.value = userConfig.customPrompt || CONFIG.DEFAULT.customPrompt;
            const concurrencyInput = document.getElementById(`${CONFIG.UI_ID}-concurrency`);
            if (concurrencyInput) concurrencyInput.value = userConfig.concurrency || 3;

            // 事件绑定
            document.getElementById(`${CONFIG.UI_ID}-close`).onclick = () => {
                panel.style.opacity = '0';
                panel.style.transform = 'scale(0.8)';
                panel.style.pointerEvents = 'none';
            };

            // 居中按钮事件（切换模式）
            document.getElementById(`${CONFIG.UI_ID}-center`).onclick = () => {
                const isCentered = panel.dataset.centered === 'true';

                if (isCentered) {
                    // 恢复原位置（右上角）
                    panel.style.left = 'auto';
                    panel.style.right = '20px';
                    panel.style.top = '20px';
                    panel.dataset.centered = 'false';
                } else {
                    // 居中显示
                    const panelWidth = panel.offsetWidth;
                    const panelHeight = panel.offsetHeight;
                    const screenWidth = window.innerWidth;
                    const screenHeight = window.innerHeight;
                    panel.style.left = `${(screenWidth - panelWidth) / 2}px`;
                    panel.style.top = `${(screenHeight - panelHeight) / 2}px`;
                    panel.style.right = 'auto';
                    panel.dataset.centered = 'true';
                }
            };

            // 最大化按钮事件
            document.getElementById(`${CONFIG.UI_ID}-maximize`).onclick = () => {
                const wrapper = document.getElementById(`${CONFIG.UI_ID}-log-wrapper`);
                const isMaximized = panel.dataset.maximized === 'true';

                if (isMaximized) {
                    // 恢复默认尺寸
                    panel.style.top = '20px';
                    panel.style.height = 'auto';
                    if (wrapper) {
                        wrapper.style.height = '200px';
                        wrapper.style.maxHeight = '500px';
                    }
                    panel.dataset.maximized = 'false';
                } else {
                    // 最大化：高度占满屏幕，宽度保持不变
                    const screenHeight = window.innerHeight;
                    panel.style.top = '20px';
                    panel.style.height = `${screenHeight - 40}px`;  // 上下各留 20px 边距
                    if (wrapper) {
                        wrapper.dataset.expanded = 'true';
                        // 计算日志区域可用高度：面板高度 - 其他元素高度（约 200px）
                        const availableHeight = screenHeight - 40 - 200;
                        wrapper.style.height = `${Math.max(200, availableHeight)}px`;
                        wrapper.style.maxHeight = 'none';
                        wrapper.style.opacity = '1';
                        wrapper.style.marginBottom = '12px';
                        wrapper.style.transform = 'scaleY(1)';
                        setTimeout(() => wrapper.style.overflow = 'auto', 300);
                    }
                    panel.dataset.maximized = 'true';
                }
            };

            document.getElementById(`${CONFIG.UI_ID}-run`).onclick = () => {
                // 展开日志区域（使用最大化效果）
                const wrapper = document.getElementById(`${CONFIG.UI_ID}-log-wrapper`);
                if (!wrapper.dataset.expanded || panel.dataset.maximized !== 'true') {
                    const screenHeight = window.innerHeight;
                    panel.style.top = '20px';
                    panel.style.height = `${screenHeight - 40}px`;
                    panel.style.width = '600px';
                    wrapper.dataset.expanded = 'true';
                    const availableHeight = screenHeight - 40 - 200;
                    wrapper.style.height = `${Math.max(200, availableHeight)}px`;
                    wrapper.style.maxHeight = 'none';
                    wrapper.style.opacity = '1';
                    wrapper.style.marginBottom = '12px';
                    wrapper.style.transform = 'scaleY(1)';
                    setTimeout(() => wrapper.style.overflow = 'auto', 300);
                    panel.dataset.maximized = 'true';
                }

                // 保存配置
                const prompt = document.getElementById(`${CONFIG.UI_ID}-prompt`).value.trim();
                const concurrency = parseInt(document.getElementById(`${CONFIG.UI_ID}-concurrency`).value) || 3;
                userConfig.customPrompt = prompt || CONFIG.DEFAULT.customPrompt;
                userConfig.concurrency = Math.min(10, Math.max(1, concurrency));
                GM_setValue('config', userConfig);

                Core.run();
            };

            // ==================== 拖拽调整尺寸 ====================
            let resizeState = { active: null, startX: 0, startY: 0, startW: 0, startH: 0 };

            // 左侧拖拽条（调整宽度）
            const resizerLeft = document.createElement('div');
            resizerLeft.style.cssText = 'position:absolute;left:0;top:0;bottom:0;width:6px;cursor:ew-resize;z-index:10;';
            resizerLeft.onmouseenter = () => resizerLeft.style.background = 'rgba(24,144,255,0.3)';
            resizerLeft.onmouseleave = () => resizerLeft.style.background = 'transparent';
            panel.appendChild(resizerLeft);

            // 底部拖拽条（调整高度）
            const resizerBottom = document.createElement('div');
            resizerBottom.style.cssText = 'position:absolute;left:0;right:0;bottom:0;height:6px;cursor:ns-resize;z-index:10;';
            resizerBottom.onmouseenter = () => resizerBottom.style.background = 'rgba(24,144,255,0.3)';
            resizerBottom.onmouseleave = () => resizerBottom.style.background = 'transparent';
            panel.appendChild(resizerBottom);

            // 左下角（同时调整宽高）
            const resizerCorner = document.createElement('div');
            resizerCorner.style.cssText = 'position:absolute;left:0;bottom:0;width:12px;height:12px;cursor:nesw-resize;z-index:11;';
            resizerCorner.onmouseenter = () => resizerCorner.style.background = 'rgba(24,144,255,0.5)';
            resizerCorner.onmouseleave = () => resizerCorner.style.background = 'transparent';
            panel.appendChild(resizerCorner);

            const startResize = (type, e) => {
                resizeState = {
                    active: type,
                    startX: e.clientX,
                    startY: e.clientY,
                    startW: panel.offsetWidth,
                    startH: document.getElementById(`${CONFIG.UI_ID}-log-wrapper`)?.offsetHeight || 200
                };
                e.preventDefault();
                document.body.style.userSelect = 'none';
            };

            const onResizeMove = e => {
                const wrapper = document.getElementById(`${CONFIG.UI_ID}-log-wrapper`);
                if (resizeState.active === 'width' || resizeState.active === 'both') {
                    panel.style.width = Math.min(800, Math.max(200, resizeState.startW + resizeState.startX - e.clientX)) + 'px';
                }
                if ((resizeState.active === 'height' || resizeState.active === 'both') && wrapper) {
                    wrapper.style.height = Math.min(500, Math.max(100, resizeState.startH + e.clientY - resizeState.startY)) + 'px';
                }
            };

            const onResizeEnd = () => {
                resizeState.active = null;
                document.body.style.userSelect = '';
                document.removeEventListener('mousemove', onResizeMove);
                document.removeEventListener('mouseup', onResizeEnd);
            };

            const bindResize = (type, e) => {
                startResize(type, e);
                document.addEventListener('mousemove', onResizeMove);
                document.addEventListener('mouseup', onResizeEnd);
            };

            resizerLeft.onmousedown = e => bindResize('width', e);
            resizerBottom.onmousedown = e => bindResize('height', e);
            resizerCorner.onmousedown = e => bindResize('both', e);

            // Token 状态检测
            setInterval(() => {
                const tokenDot = document.getElementById(`${CONFIG.UI_ID}-token`);
                if (tokenDot) {
                    tokenDot.style.color = (State.tokens.dynamicToken && State.tokens.loginPointId) ? '#52c41a' : '#ff4d4f';
                }
            }, 1000);
        }
    };

    // ==================== 核心业务逻辑 ====================
    const Core = {
        // 处理单个计划（使用独立卡片日志）
        processCampaign: async (campaignId, campaignName, index, total) => {
            // 创建该计划的独立卡片
            const card = UI.createCampaignCard(campaignId, campaignName, index, total);
            if (!card) {
                Logger.error(`无法创建卡片: ${campaignId}`);
                return { success: false, msg: '创建卡片失败' };
            }

            Logger.info(`[${index}/${total}] ${campaignName}(${campaignId}) 开始处理...`);
            card.log('开始处理...', '#1890ff');
            card.setStatus('诊断中', 'info');

            try {
                const today = Utils.toLocalYMD();
                // 构造请求数据
                const talkData = {
                    fromPage: '/manage/search-detail',
                    entrance: 'huhang-pop_escort@onebpSearch@horizontal',
                    business: 'escort@onebpSearch@horizontal',
                    contextParam: {
                        mx_bizCode: 'onebpSearch',
                        bizCode: 'onebpSearch',
                        startTime: today,
                        endTime: today,
                        campaignGroupId: Utils.getCampaignGroupId(),
                        newUi: true,
                        bizQueryReference: 'escort',
                        campaignId: parseInt(campaignId)
                    },
                    bizCode: 'universalBP',
                    requestType: 'NlAnalysis',
                    client: 'pc_uni_bp',
                    product: 'escort',
                    sessionId: Utils.uuid(),
                    campaignId: parseInt(campaignId),
                    prompt: {
                        promptType: 'text',
                        valided: true,
                        isEmpty: false,
                        params: { questionSource: 'input' },
                        wordList: [{
                            word: `针对计划：${campaignId}，${userConfig.customPrompt}`,
                            wordType: 'text'
                        }]
                    },
                    promptType: 'text',
                    timeStr: Date.now(),
                    ...State.tokens
                };

                card.log('请求诊断接口...', 'orange');
                const talkRes = await API.request('https://ai.alimama.com/ai/chat/talk.json', talkData, {
                    signal: State.runAbortController?.signal
                });

                // 收集所有 actionList
                const allActionLists = [];
                const seenKeys = new Set();

                const collect = (obj, depth = 0) => {
                    if (!obj || depth > 20) return;
                    if (Array.isArray(obj)) {
                        obj.forEach(item => collect(item, depth + 1));
                        return;
                    }
                    if (Array.isArray(obj.actionList) && obj.actionList.length) {
                        const key = obj.actionList.map(i => {
                            const infoStr = typeof i.actionInfo === 'string'
                                ? i.actionInfo
                                : JSON.stringify(i.actionInfo ?? '');
                            return `${i.actionText}::${(infoStr || '').substring(0, 100)}`;
                        }).join('|||');
                        if (!seenKeys.has(key)) {
                            seenKeys.add(key);
                            allActionLists.push(obj.actionList);
                        }
                    }
                    if (typeof obj === 'object') {
                        for (const k in obj) collect(obj[k], depth + 1);
                    }
                };

                if (talkRes.isStream) {
                    talkRes.chunks.forEach(c => collect(c));
                } else {
                    collect(talkRes);
                }

                // 显示所有方案
                if (allActionLists.length) {
                    Logger.debug('方案列表:', allActionLists.flat().map((a, i) => ({
                        序号: i + 1,
                        actionText: a.actionText || '-',
                        actionType: a.actionType || '-',
                        hasInfo: a.actionInfo ? '✓' : '-'
                    })));

                    card.log(`收到 ${allActionLists.length} 组方案`, '#1890ff');
                    UI.renderAllActionsToCard(card, allActionLists);
                }

                // 寻找算法护航
                let actionList = null, targetInfo = null;
                for (const list of allActionLists) {
                    const escort = list.find(i => i.actionText?.includes('算法护航'));
                    if (escort?.actionInfo) {
                        try {
                            const info = JSON.parse(escort.actionInfo);
                            if (info.actionList) {
                                actionList = info.actionList;
                                targetInfo = info;
                                break;
                            }
                        } catch { }
                    }
                }

                if (!actionList?.length) {
                    card.log('⚠️ 未发现"算法护航"方案', 'orange');
                    card.setStatus('无方案', 'warning');
                    card.collapse();
                    return { success: false, msg: '无护航方案' };
                }

                // 显示护航方案
                card.log(`获取到 ${actionList.length} 个护航方案`, '#1890ff');
                UI.renderEscortActionsToCard(card, actionList);

                // 提交护航
                card.log('提交护航请求...', 'orange');
                card.setStatus('提交中', 'info');

                const openRes = await API.request('https://ai.alimama.com/ai/escort/open.json', {
                    actionList,
                    campaignId: campaignId.toString(),
                    continueDays: 3650,
                    target: targetInfo?.target || '深度诊断拿量',
                    timeStr: Date.now(),
                    bizCode: userConfig.bizCode,
                    ...State.tokens
                }, {
                    signal: State.runAbortController?.signal
                });

                const success = openRes?.success || openRes?.ok || openRes?.info?.ok;
                const msg = openRes?.info?.message || (success ? '成功' : '未知错误');

                card.log(`${success ? '✓' : '✗'} ${msg}`, success ? 'green' : 'red');
                card.setStatus(success ? '成功' : '失败', success ? 'success' : 'error');
                card.collapse();
                return { success, msg };

            } catch (e) {
                if (e?.name === 'AbortError') {
                    card.log('已取消', '#999');
                    card.setStatus('已取消', 'warning');
                    card.collapse();
                    return { success: false, msg: '已取消' };
                }
                card.log(`异常: ${e.message}`, 'red');
                card.setStatus('异常', 'error');
                card.collapse();
                return { success: false, msg: e.message };
            }
        },

        // 扫描页面计划（单次 DOM 遍历）
        scanCampaigns: () => {
            const tasks = new Map();
            const campaignIdRegex = /campaignId=(\d{6,})/;

            document.querySelectorAll('a[href*="campaignId="], input[type="checkbox"][value]').forEach(el => {
                if (el.tagName === 'A') {
                    const m = el.href.match(campaignIdRegex);
                    if (m && !tasks.has(m[1])) {
                        tasks.set(m[1], el.innerText.trim() || '未知计划');
                    }
                } else if (/^\d{6,}$/.test(el.value) && !el.closest('div[mx-view*="user-pop"]')) {
                    if (!tasks.has(el.value)) {
                        const row = el.closest('tr');
                        const name = row?.querySelector('a[title]')?.getAttribute('title') || '未知计划';
                        tasks.set(el.value, name);
                    }
                }
            });

            return Array.from(tasks.entries());
        },

        // 主运行函数 - 并发执行版本
        run: async () => {
            State.currentRunId++;
            const runId = State.currentRunId;
            if (State.runAbortController) State.runAbortController.abort();
            State.runAbortController = new AbortController();

            // 清空日志
            const log = document.getElementById(`${CONFIG.UI_ID}-log`);
            if (log) log.textContent = '';

            UI.updateStatus('正在解析页面...', 'blue');

            TokenManager.refresh();

            if (!State.tokens.loginPointId || !State.tokens.dynamicToken) {
                UI.updateStatus('Token 未就绪，请点击页面任意处', 'red');
                return;
            }

            const campaigns = Core.scanCampaigns();
            if (!campaigns.length) {
                UI.updateStatus('未找到计划ID', '#ff4d4f');
                return;
            }

            const total = campaigns.length;
            const concurrency = userConfig.concurrency || 3;
            UI.updateStatus(`识别到 ${total} 个计划，开始并发处理 (并发数: ${concurrency})...`, '#1890ff');

            // 创建任务函数数组
            const taskFns = campaigns.map(([id, name], i) => async () => {
                if (State.currentRunId !== runId) return { success: false, id, name, msg: '已取消' };
                const res = await Core.processCampaign(id, name, i + 1, total);
                return { ...res, id, name };
            });

            // 并发执行（使用用户设置的并发数）
            const results = await Utils.concurrentLimit(taskFns, concurrency);

            // 统计结果
            const successList = [], failList = [];
            results.forEach(r => {
                if (r.status === 'fulfilled') {
                    const { success, id, name, msg } = r.value;
                    (success ? successList : failList).push({ id, name, msg });
                } else {
                    failList.push({ id: '-', name: '未知', msg: r.reason?.message || '执行异常' });
                }
            });

            // 显示结果
            UI.updateStatus('--------------------------------', '#999');
            UI.updateStatus(`执行完成。成功: ${successList.length}, 失败: ${failList.length}`,
                successList.length ? 'green' : 'red');
            UI.renderResults(successList, failList);
        }
    };

    // ==================== 初始化 ====================
    TokenManager.hookXHR();

    // [INTEGRATED] Expose toggle function
    window.__ALIMAMA_OPTIMIZER_TOGGLE__ = () => {
        const panel = document.getElementById(CONFIG.UI_ID);
        if (!panel) {
            UI.create();
            setTimeout(() => {
                const p = document.getElementById(CONFIG.UI_ID);
                if (p) {
                    p.style.opacity = '1';
                    p.style.transform = 'scale(1)';
                    p.style.pointerEvents = 'auto';
                }
            }, 100);
        } else {
            if (panel.style.opacity === '0' || panel.style.opacity === '') {
                panel.style.opacity = '1';
                panel.style.transform = 'scale(1)';
                panel.style.pointerEvents = 'auto';
            } else {
                panel.style.boxShadow = '0 0 20px rgba(24,144,255,0.8)';
                setTimeout(() => panel.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)', 500);
            }
        }
    };
})();
