// ==UserScript==
// @name         阿里妈妈多合一助手 (Pro版)
// @namespace    http://tampermonkey.net/
// @version      5.28
// @description  交互优化版：增加加购成本计算、花费占比、预算分类占比、性能优化。包含状态记忆、胶囊按钮UI、日志折叠、报表直连下载拦截。集成算法护航功能。
// @author       Gemini & Liangchao
// @match        *://alimama.com/*
// @match        *://*.alimama.com/*
// @match        https://one.alimama.com/*
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      alimama.com
// @connect      ai.alimama.com
// @connect      *.alimama.com
// @connect      one.alimama.com
// ==/UserScript==
/**
 * 更新日志
 * 
 * v5.28 (2026-02-15)
 * - ✨ 万能查数弹窗头部全量重构：替换为新版品牌头图与文案，统一布局与视觉层级
 * - ✨ 弹窗首屏体验优化：iframe 先隐藏后清理再展示，减少前 1 秒整页闪现
 * - 🔧 样式规则改为动态选择器：兼容动态 `mx_*` 节点，补齐 `mb16` 隐藏与 `top` 定位
 * - 🔧 快捷查数文案升级：由“获取计划ID”改为“计划名：{对应计划名}”
 * - 🐛 计划名识别修复：优先匹配计划区块 `a[title]`，规避误取商品标题/平台推荐等噪音
 * - ✨ 新增开发加载器脚本：`dev/dev-loader.user.js` 支持本地脚本自动加载与执行，便于快速联调
 * - 🔧 版本号同步机制增强：统一动态读取 `GM_info/GM.info`，双 IIFE 版本展示保持一致
 * - 🐛 日志系统稳定性修复：`Logger.flush` 早退分支重置 timer，避免日志刷新锁死
 * - 🔧 自动化质量加固：补充 Logger API 回归测试，CI/Release 工作流适配 userscript 仓库
 * 
 * v5.27 (2026-02-14)
 * - ✨ 版本号改为动态解析：统一从 GM_info / GM.info 读取，移除硬编码版本 fallback
 * - ✨ 双 IIFE 共用同一版本解析器，主面板、护航面板与启动日志版本保持一致
 * - 📝 文档同步：README 徽章改为 GitHub Release 动态版本显示
 * 
 * v5.26 (2026-02-13)
 * - ✨ 新增「计划ID识别」模块：自动扫描并为页面 ID 注入「万能查数」快捷入口
 * - ✨ UI 视觉标准升级：统一 iPhone 级圆角规范（18px/12px/10px），视觉更感性
 * - ✨ 深度精装修：全面引入 Glassmorphism 磨砂玻璃质感，优化表格配色与层级感
 * - ✨ 图标体系标准化：全量使用高质量 SVG 替换 Unicode，视觉比重、大小及颜色表现对齐
 * - ✨ 算法护航体验增强：支持面板居中、最大化展示，优化长日志自动高度计算
 * - 🔧 界面微调：精简算法护航标题栏结构，优化数据表格背景配色与各级图标显示比例
 * - 🔧 细节修复：调优刷新图标展示效果，修复日志输出空格格式，提升极致稳定性
 * - 🔧 性能优化：优化 MutationObserver 监听频率，减少扫描开销
 * 
 * v5.25 (2026-02-13)
 * - ✨ 修复样式注入缓存机制，通过动态 ID 强制刷新样式
 * - ✨ 优化触发器 UI 样式，提升原生视觉融合度
 * - 🔧 修复日志系统在特定场景下的引用错误
 * - 🔧 增强数据抓取稳定性，优化 API 注入逻辑
 * - ✨ 关键词推广页面新增「全能数据查」快捷入口
 * 
 * v5.24 (2026-02-12)
 * - ✨ 新增多表格上下文识别与能力评分，优先处理当前可见且列结构匹配的数据表
 * - ✨ 兼容 Sticky Table 双表头定位，提升表头映射稳定性
 * - 🔧 花费排序改为作用域定位，减少跨模块误触发排序的问题
 * - 🔧 路由变化重置增加节流保护，避免短时间重复重置
 * - 🔧 首次执行增加去重保护，降低 MutationObserver 高频更新下的重复计算
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

const resolveScriptVersion = () => {
    const fromGMInfo = typeof GM_info !== 'undefined'
        && GM_info
        && GM_info.script
        && GM_info.script.version;
    if (typeof fromGMInfo === 'string' && fromGMInfo.trim()) {
        return fromGMInfo.trim();
    }

    const fromGM = typeof GM !== 'undefined'
        && GM
        && GM.info
        && GM.info.script
        && GM.info.script.version;
    if (typeof fromGM === 'string' && fromGM.trim()) {
        return fromGM.trim();
    }

    return 'dev';
};

if (typeof globalThis !== 'undefined' && typeof globalThis.__AM_GET_SCRIPT_VERSION__ !== 'function') {
    globalThis.__AM_GET_SCRIPT_VERSION__ = resolveScriptVersion;
}

(function () {
    'use strict';

    // 全局版本管理
    const CURRENT_VERSION = typeof globalThis !== 'undefined' && typeof globalThis.__AM_GET_SCRIPT_VERSION__ === 'function'
        ? globalThis.__AM_GET_SCRIPT_VERSION__()
        : resolveScriptVersion();

    // ==========================================
    // 1. 配置与状态管理
    // ==========================================
    const CONSTANTS = {
        STORAGE_KEY: 'AM_HELPER_CONFIG',
        LEGACY_STORAGE_KEYS: ['AM_HELPER_CONFIG_V5_15', 'AM_HELPER_CONFIG_V5_14', 'AM_HELPER_CONFIG_V5_13'],
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
        logExpanded: true,
        magicReportOpen: false
    };

    const createHookManager = () => {
        if (window.__AM_HOOK_MANAGER__) return window.__AM_HOOK_MANAGER__;

        const manager = {
            installed: false,
            fetchHandlers: [],
            xhrOpenHandlers: [],
            xhrSendHandlers: [],
            xhrLoadHandlers: [],

            registerFetch(handler) {
                if (typeof handler === 'function') this.fetchHandlers.push(handler);
            },

            registerXHROpen(handler) {
                if (typeof handler === 'function') this.xhrOpenHandlers.push(handler);
            },

            registerXHRSend(handler) {
                if (typeof handler === 'function') this.xhrSendHandlers.push(handler);
            },

            registerXHRLoad(handler) {
                if (typeof handler === 'function') this.xhrLoadHandlers.push(handler);
            },

            install() {
                if (this.installed || window.__AM_HOOKS_INSTALLED__) return;

                const originalFetch = window.fetch;
                if (typeof originalFetch === 'function') {
                    window.fetch = async function (...args) {
                        const response = await originalFetch.apply(this, args);
                        manager.fetchHandlers.forEach(handler => {
                            try {
                                handler({ args, response });
                            } catch { }
                        });
                        return response;
                    };
                }

                const originalOpen = XMLHttpRequest.prototype.open;
                const originalSend = XMLHttpRequest.prototype.send;

                XMLHttpRequest.prototype.open = function (...args) {
                    const [method, url] = args;
                    this.__amHookMethod = method;
                    this.__amHookUrl = url;

                    manager.xhrOpenHandlers.forEach(handler => {
                        try {
                            handler({ xhr: this, method, url, args });
                        } catch { }
                    });

                    return originalOpen.apply(this, args);
                };

                XMLHttpRequest.prototype.send = function (...args) {
                    const [data] = args;
                    const xhr = this;

                    manager.xhrSendHandlers.forEach(handler => {
                        try {
                            handler({
                                xhr,
                                data,
                                method: xhr.__amHookMethod,
                                url: xhr.__amHookUrl,
                                args
                            });
                        } catch { }
                    });

                    xhr.addEventListener('load', function () {
                        manager.xhrLoadHandlers.forEach(handler => {
                            try {
                                handler({
                                    xhr: this,
                                    method: this.__amHookMethod,
                                    url: this.__amHookUrl
                                });
                            } catch { }
                        });
                    });

                    return originalSend.apply(xhr, args);
                };

                this.installed = true;
                window.__AM_HOOKS_INSTALLED__ = true;
            }
        };

        window.__AM_HOOK_MANAGER__ = manager;
        return manager;
    };

    const safeParseJSON = (raw) => {
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    };

    const loadConfig = () => {
        const current = safeParseJSON(localStorage.getItem(CONSTANTS.STORAGE_KEY));
        if (current && typeof current === 'object') {
            return { ...DEFAULT_CONFIG, ...current, panelOpen: false };
        }

        for (const legacyKey of CONSTANTS.LEGACY_STORAGE_KEYS) {
            const legacy = safeParseJSON(localStorage.getItem(legacyKey));
            if (legacy && typeof legacy === 'object') {
                localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(legacy));
                return { ...DEFAULT_CONFIG, ...legacy, panelOpen: false };
            }
        }

        return DEFAULT_CONFIG;
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

        info(msg, ...args) {
            this.log(msg, false, ...args);
        },

        warn(msg, ...args) {
            this.log(msg, true, ...args);
        },

        error(msg, ...args) {
            this.log(msg, true, ...args);
        },

        log(msg, isError = false, ...args) {
            const now = new Date();
            const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

            const toText = (value) => {
                if (typeof value === 'string') return value;
                if (value === null || value === undefined) return String(value ?? '');
                try {
                    return JSON.stringify(value);
                } catch {
                    return String(value);
                }
            };
            const fullMsg = [msg, ...args].map(toText).filter(Boolean).join(' ');

            // Console output
            const logStyle = isError ? 'color: #ff4d4f' : 'color: #1890ff';
            console.log(`%c[AM] ${fullMsg}`, logStyle);

            // Buffer for UI update
            this.buffer.push({ time, msg: fullMsg, isError });
            this.scheduleFlush();
        },

        scheduleFlush() {
            if (this.timer) return;
            this.timer = requestAnimationFrame(() => this.flush());
        },

        flush() {
            if (!this.el || this.buffer.length === 0) {
                this.timer = null;
                return;
            }

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
                    const dateText = document.createElement('span');
                    dateText.style.cssText = 'background:#fff;padding:0 8px;position:relative;top:8px;';
                    dateText.textContent = today;
                    dateDiv.appendChild(dateText);
                    fragment.appendChild(dateDiv);
                    this.lastFlushedDate = today;
                }

                const div = document.createElement('div');
                div.className = 'am-log-line';
                const timeNode = document.createElement('span');
                timeNode.className = 'am-log-time';
                timeNode.textContent = `[${time}]`;
                div.appendChild(timeNode);
                div.appendChild(document.createTextNode(msg));
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
            const signature = Array.from(headers).map(h => (h.textContent || '').replace(/\s+/g, '')).join('|');
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
            const clickIdx = toBodyIdx(colMap.click);
            const budgetIdx = toBodyIdx(colMap.budget);
            const cartIdxList = (colMap.carts || []).map(toBodyIdx);

            let score = 0;
            if (hasCell(costIdx)) score += 12;
            if (hasCell(wangIdx)) score += 6;
            if (cartIdxList.some(hasCell)) score += 4;
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
            // 强制更新样式：如果存在旧 ID 的样式标签，先移除
            const oldStyle = document.getElementById('am-helper-mac26-style');
            if (oldStyle) oldStyle.remove();

            if (document.getElementById('am-helper-pro-v26-style')) return;
            const css = `
                :root {
                    --am26-font: "SF Pro Display", "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif;
                    --am26-mono: "SF Mono", "JetBrains Mono", "Menlo", "Monaco", "Consolas", monospace;
                    --am26-text: #1b2438;
                    --am26-text-soft: #505a74;
                    --am26-border: rgba(255, 255, 255, 0.4); 
                    --am26-border-strong: rgba(255, 255, 255, 0.6);
                    --am26-surface: rgba(255, 255, 255, 0.25);
                    --am26-surface-strong: rgba(255, 255, 255, 0.45);
                    --am26-panel: linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.1));
                    --am26-panel-strong: linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2));
                    --am26-primary: rgba(69, 84, 229, 1);
                    --am26-primary-strong: #1d3fcf;
                    --am26-primary-soft: rgba(42, 91, 255, 0.15);
                    --am26-success: #0ea86f;
                    --am26-warning: #e8a325;
                    --am26-danger: #ea4f4f;
                    --am26-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
                    --am26-glow: inset 0 0 0 1px rgba(255, 255, 255, 0.3);
                    --mx-number-report-brand-color: rgba(69,84,229,1);
                    --mx-number-report-brand-color50: rgba(69,84,229,0.5);
                    --mx-number-report-brand-color10: rgba(69,84,229,0.1);
                    --mx-number-report-brand-color1: rgba(69,84,229,0.01);
                }

                #am-helper-panel,
                #am-magic-report-popup,
                #alimama-escort-helper-ui,
                #am-report-capture-panel,
                #alimama-escort-helper-ui-result-overlay > div {
                    font-family: var(--am26-font) !important;
                    color: var(--am26-text) !important;
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    box-shadow: var(--am26-shadow) !important;
                    border: 1px solid var(--am26-border) !important;
                }

                /* 悬浮球（最小化按钮） */
                #am-helper-icon {
                    position: fixed; top: 120px; right: 20px; z-index: 999999;
                    width: 40px; height: 40px; border-radius: 50%;
                    border: 1px solid var(--am26-border);
                    background: var(--am26-surface-strong);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    box-shadow: var(--am26-shadow), var(--am26-glow);
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    color: var(--am26-primary);
                    transition: all 0.3s ease;
                }
                #am-helper-icon:hover { 
                    transform: translateY(-1px) scale(1.08);
                    border-color: var(--am26-border-strong);
                    color: var(--am26-primary-strong);
                    background: rgba(255,255,255,0.6);
                }

                /* 主面板 */
                #am-helper-panel {
                    position: fixed; top: 120px; right: 20px; z-index: 999999;
                    background: var(--am26-panel);
                    border-radius: 18px;
                    width: 280px; min-width: 250px; max-width: 500px;
                    opacity: 1; transform: scale(1); transform-origin: top right;
                    transition: opacity 0.3s ease, transform 0.3s ease, width 0.5s ease;
                    overflow: hidden;
                }
                #am-helper-panel.hidden {
                    opacity: 0; transform: scale(0.8); pointer-events: none;
                }

                /* 头部 */
                .am-header { 
                    padding: 14px 18px; 
                    border-bottom: 1px solid var(--am26-border); 
                    background: rgba(255, 255, 255, 0.1);
                    display: flex; justify-content: space-between; align-items: center; 
                }
                .am-title { 
                    font-weight: 600; font-size: 15px; color: var(--am26-text);
                    display: flex; align-items: center; gap: 8px;
                    text-shadow: 0 1px 0 rgba(255,255,255,0.4);
                }
                .am-version {
                    font-size: 10px; color: var(--am26-text-soft); font-weight: normal;
                    background: rgba(255,255,255,0.3); padding: 1px 4px; border-radius: 6px;
                }
                .am-icon-btn { 
                    cursor: pointer; color: var(--am26-text-soft); font-size: 16px; font-weight: bold;
                    width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
                    border-radius: 8px; transition: all 0.2s;
                }
                .am-icon-btn:hover { background: rgba(255, 255, 255, 0.3); color: var(--am26-text); }
                .am-icon-btn.danger:hover { background: rgba(234, 79, 79, 0.15); color: var(--am26-danger); }
                
                .am-close-btn { 
                    cursor: pointer; color: var(--am26-text-soft); font-size: 16px; font-weight: bold;
                    width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
                    border-radius: 8px; transition: all 0.2s;
                }
                .am-close-btn:hover { background: rgba(255, 255, 255, 0.3); color: var(--am26-danger); }

                /* 内容区 */
                .am-body { padding: 18px; }



                .am-tools-row { display: flex; gap: 8px; margin-bottom: 8px; }
                .am-tool-btn {
                    flex: 1; text-align: center; padding: 12px 0; border-radius: 10px;
                    background: var(--mx-number-report-brand-color1); 
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    color: var(--am26-text-soft); font-size: 13px; font-weight: 500;
                    cursor: pointer; transition: all 0.3s;
                    display: flex; align-items: center; justify-content: center; gap: 6px;
                }
                .am-tool-btn:hover {
                    background: var(--mx-number-report-brand-color10); 
                    border-color: var(--mx-number-report-brand-color);
                    color: var(--mx-number-report-brand-color);
                    box-shadow: 0 0 10px var(--mx-number-report-brand-color50); /* 亮灯效果 */
                    transform: translateY(-1px);
                }

                .am-switches-grid {
                    display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
                }
                .am-switch-btn {
                    height: 36px; /* 固定高度 */
                    text-align: center; font-size: 12px; border-radius: 10px;
                    border: 1px solid #e0e0e0; /* 默认浅灰色边框 */
                    background: rgba(255, 255, 255, 0.4);
                    color: var(--am26-text-soft); cursor: pointer; transition: all 0.3s;
                    display: flex; align-items: center; justify-content: center;
                }
                .am-switch-btn:hover {
                    background: rgba(255, 255, 255, 0.8); 
                    border-color: var(--mx-number-report-brand-color);
                    box-shadow: 0 0 8px var(--mx-number-report-brand-color10); /* 亮灯效果 */
                }
                .am-switch-btn.active {
                    background: var(--mx-number-report-brand-color10); 
                    border-color: var(--mx-number-report-brand-color);
                    color: var(--mx-number-report-brand-color); font-weight: 600;
                    box-shadow: inset 0 0 4px var(--mx-number-report-brand-color10);
                }

                .am-campaign-id-token {
                    display: inline;
                }
                .am-campaign-search-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    margin-left: 2px;
                    -webkit-appearance: none;
                    appearance: none;
                    border: 0;
                    background: transparent;
                    color: #a3adb8;
                    line-height: 1;
                    cursor: pointer;
                    user-select: none;
                    vertical-align: middle;
                    padding: 0;
                }
                .am-campaign-search-btn svg {
                    width: 11px;
                    height: 11px;
                    display: block;
                    fill: currentColor;
                    pointer-events: none;
                }
                
                /* 算法护航弹窗居中 */
                #alimama-escort-helper-ui {
                    top: 50% !important; left: 50% !important;
                    transform: translate(-50%, -50%) !important;
                    max-height: 90vh; overflow-y: auto;
                }

                /* 日志区 */
                .am-log-section { margin-top: 16px; }
                .am-log-header { 
                    display: flex; justify-content: space-between; align-items: center;
                    font-size: 12px; color: var(--am26-text-soft); margin-bottom: 8px; padding: 0 4px;
                }
                .am-action-btn { 
                    cursor: pointer; color: var(--am26-text-soft); margin-left: 10px; 
                    padding: 2px 8px; border-radius: 4px; transition: all 0.2s;
                    background: rgba(255,255,255,0.2);
                }
                .am-action-btn:hover { background: rgba(255, 255, 255, 0.5); color: var(--am26-primary-strong); }
                #am-log-content {
                    height: 100px; overflow-y: auto; 
                    background: rgba(0, 0, 0, 0.03);
                    border: 1px solid inset rgba(0,0,0,0.05);
                    border-radius: 10px;
                    padding: 10px;
                    font-size: 11px;
                    color: var(--am26-text);
                    font-family: var(--am26-mono);
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);
                    transition: all 0.3s ease;
                }
                #am-log-content.collapsed { height: 0; padding: 0; border: none; opacity: 0; }
                .am-log-line { 
                    padding: 3px 0; line-height: 1.5; 
                    border-bottom: 1px dashed rgba(0, 0, 0, 0.1);
                }
                .am-log-line:last-child { border-bottom: none; }
                .am-log-time { color: rgba(0,0,0,0.4); margin-right: 6px; }

                /* 拖拽调整宽度 */
                .am-resizer-left {
                    position: absolute; left: 0; top: 0; bottom: 0; width: 6px;
                    cursor: ew-resize; z-index: 10; transition: background 0.2s;
                }
                .am-resizer-left:hover { background: rgba(42, 91, 255, 0.22); }

                /* 报表捕获弹窗 */
                #am-report-capture-panel {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 340px;
                    padding: 14px;
                    border-radius: 12px;
                    border: 1px solid var(--am26-border);
                    background: var(--am26-panel-strong);
                    color: var(--am26-text);
                    z-index: 2147483647;
                    display: none;
                }
                #am-report-capture-panel .am-download-header {
                    margin-bottom: 10px;
                    font-weight: 600;
                    color: var(--am26-primary-strong);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                #am-report-capture-panel .am-download-source {
                    color: var(--am26-text-soft);
                    font-size: 10px;
                }
                #am-report-capture-panel .am-download-url {
                    background: rgba(255, 255, 255, 0.60);
                    border: 1px solid var(--am26-border);
                    border-radius: 8px;
                    margin-bottom: 12px;
                    padding: 8px;
                    word-break: break-all;
                    font-size: 11px;
                    color: var(--am26-text-soft);
                    max-height: 56px;
                    overflow: hidden;
                }
                #am-report-capture-panel .am-download-actions {
                    display: flex;
                    gap: 10px;
                }
                #am-report-capture-panel .am-download-link,
                #am-report-capture-panel .am-download-btn {
                    border: 1px solid transparent;
                    border-radius: 8px;
                    padding: 8px 0;
                    text-align: center;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                #am-report-capture-panel .am-download-link {
                    flex: 2;
                    text-decoration: none;
                    background: linear-gradient(135deg, var(--am26-primary), var(--am26-primary-strong));
                    color: #fff;
                }
                #am-report-capture-panel .am-download-btn {
                    background: rgba(255, 255, 255, 0.72);
                    border-color: var(--am26-border);
                    color: var(--am26-text-soft);
                }
                #am-report-capture-panel .am-download-btn:hover,
                #am-report-capture-panel .am-download-link:hover {
                    transform: translateY(-1px);
                }
                #am-report-capture-panel .am-download-copy { flex: 1; }
                #am-report-capture-panel .am-download-close { flex: 0.5; }
                #am-report-capture-panel .am-download-hint {
                    margin-top: 8px;
                    font-size: 10px;
                    color: var(--am26-text-soft);
                }

                #am-magic-report-popup {
                    background: var(--am26-panel-strong) !important;
                }
                #am-magic-report-popup .am-magic-header {
                    background: rgba(255, 255, 255, 0.3) !important;
                }

                #alimama-escort-helper-ui [id$="-log-wrapper"] {
                    background: rgba(255, 255, 255, 0.4) !important;
                }
                #alimama-escort-helper-ui input {
                    background: rgba(255, 255, 255, 0.5) !important;
                }
                #alimama-escort-helper-ui .card-header {
                    background: rgba(255, 255, 255, 0.4) !important;
                }
                #alimama-escort-helper-ui .card-body {
                    background: rgba(255, 255, 255, 0.2) !important;
                }

                /* Mobile/Small screen adaptations */
                @media (max-width: 1080px) {
                    #am-magic-report-popup {
                        width: min(96vw, 900px) !important;
                        left: 50% !important;
                        transform: translateX(-50%) !important;
                    }
                    #am-helper-panel,
                    #alimama-escort-helper-ui {
                        max-width: calc(100vw - 24px) !important;
                    }
                }

                /* Native Style for Optimizer Trigger */
                #am-trigger-optimizer {
                    --line-height: 1.5;
                    --font-size: 12px;
                    --font-family: PingFangSC-Regular,PingFang SC,"Microsoft Yahei","SimHei",sans-serif;
                    --font-number: Tahoma;
                    --font-color: #333;
                    --font-color-hover: #333;
                    --font-color-active: var(--color-brand);
                    --font-color-secondary: #666;
                    --font-color-tip: #999;
                    --anchor-font-color: #333;
                    --app-nav-bg: #303a58;
                    --app-bg: #f9f9f9;
                    --app-min-width: 1418px;
                    --color-brand: #4554e5;
                    --color-brand-gradient: #4554e5;
                    --color-brand-hover: #3325d4;
                    --color-brand-hover-gradient: #3325d4;
                    --color-brand-vs: #f5714d;
                    --color-brand-light: rgba(69,84,229,.2);
                    --color-brand-opacity: rgba(69,84,229,.1);
                    --color-brand-text: #fff;
                    --color-brand-text-hover: #fff;
                    --color-brand-opacity5: rgba(69,84,229,.05);
                    --color-brand-opacity10: rgba(69,84,229,.1);
                    --color-brand-opacity20: rgba(69,84,229,.2);
                    --color-brand-opacity50: rgba(69,84,229,.5);
                    --color-bg: #f8f9fa;
                    --color-bg-hover: var(--color-brand-opacity);
                    --color-bg-active: var(--color-brand-opacity);
                    --input-v-gap: 8px;
                    --input-h-gap: 8px;
                    --input-min-width: 64px;
                    --input-height: 32px;
                    --input-font-size: var(--font-size);
                    --input-icon-size: 16px;
                    --input-icon-gap: 4px;
                    --border-radius: 8px;
                    --input-small-v-gap: 8px;
                    --input-small-h-gap: 8px;
                    --input-small-min-width: 48px;
                    --input-small-height: 24px;
                    --input-small-font-size: var(--font-size);
                    --input-small-icon-size: 12px;
                    --input-small-icon-gap: 4px;
                    --border-small-radius: 6px;
                    --input-large-v-gap: 8px;
                    --input-large-h-gap: 8px;
                    --input-large-min-width: 80px;
                    --input-large-height: 40px;
                    --input-large-font-size: calc(var(--font-size) + 2px);
                    --input-large-icon-size: 20px;
                    --input-large-icon-gap: 4px;
                    --border-large-radius: 10px;
                    --input-gap-border: #e4e7f0;
                    --bg-highlight: #f0f2f5;
                    --border-highlight: #f0f2f5;
                    --border-highlight-shadow: none;
                    --bg-highlight-hover: #e4e7f0;
                    --border-highlight-hover: #e4e7f0;
                    --border-highlight-shadow-hover: none;
                    --bg-highlight-active: #fff;
                    --border-highlight-active-opacity: 0.5;
                    --border-highlight-active: rgba(69,84,229,var(--border-highlight-active-opacity));
                    --border-highlight-shadow-active-h: 0px;
                    --border-highlight-shadow-active-v: 2px;
                    --border-highlight-shadow-active-blur: 4px;
                    --border-highlight-shadow-active-opacity: 0.2;
                    --border-highlight-shadow-active: var(--border-highlight-shadow-active-h) var(--border-highlight-shadow-active-v) var(--border-highlight-shadow-active-blur) 0 rgba(69,84,229,var(--border-highlight-shadow-active-opacity));
                    --output-bg: #fff;
                    --output-color: var(--font-color,#333);
                    --output-color-hover: var(--font-color-hover,#333);
                    --output-color-active: var(--font-color-active,var(--color-brand));
                    --output-small-v-gap: 8px;
                    --output-small-h-gap: 16px;
                    --output-small-border-radius: 8px;
                    --output-v-gap: 16px;
                    --output-h-gap: 24px;
                    --output-border-radius: 24px;
                    --output-large-v-gap: 24px;
                    --output-large-h-gap: 24px;
                    --output-large-border-radius: 16px;
                    --output-small-offset: 8px;
                    --output-small-item-max-height: 244px;
                    --output-small-item-height: var(--input-small-height);
                    --output-small-item-fontsize: 12px;
                    --output-offset: 8px;
                    --output-item-max-height: 312px;
                    --output-item-height: var(--input-height);
                    --output-item-fontsize: 12px;
                    --output-large-offset: 8px;
                    --output-large-item-max-height: 380px;
                    --output-large-item-height: var(--input-large-height);
                    --output-large-item-fontsize: 14px;
                    --btn-brand: var(--color-brand);
                    --btn-brand-gradient: var(--color-brand-gradient);
                    --btn-brand-shadow: none;
                    --btn-brand-text: var(--color-brand-text);
                    --btn-brand-hover: var(--color-brand-hover);
                    --btn-brand-gradient-hover: var(--color-brand-hover-gradient);
                    --btn-brand-shadow-hover-h: 0px;
                    --btn-brand-shadow-hover-v: 2px;
                    --btn-brand-shadow-hover-blur: 10px;
                    --btn-brand-shadow-hover-opacity: 0.4;
                    --btn-brand-shadow-hover: var(--btn-brand-shadow-hover-h,0px) var(--btn-brand-shadow-hover-v,2px) var(--btn-brand-shadow-hover-blur,10px) 0 rgba(69,84,229,var(--btn-brand-shadow-hover-opacity,0.4));
                    --btn-brand-text-hover: var(--color-brand-text-hover);
                    --btn-border: #e4e7f0;
                    --btn-bg: #fff;
                    --btn-text: #333;
                    --btn-border-hover: rgba(69,84,229,.5);
                    --btn-bg-hover: #fff;
                    --btn-text-hover: var(--color-brand);
                    --btn-h-gap: 12px;
                    --btn-min-width: var(--input-min-width);
                    --btn-font-size: var(--input-font-size);
                    --btn-border-radius: 500px;
                    --btn-small-h-gap: 12px;
                    --btn-small-min-width: var(--input-small-min-width);
                    --btn-small-font-size: var(--input-small-font-size);
                    --btn-small-border-radius: 500px;
                    --btn-large-h-gap: 12px;
                    --btn-large-min-width: var(--input-large-min-width);
                    --btn-large-font-size: var(--input-large-font-size);
                    --btn-large-border-radius: 500px;
                    --btn-font-weight: normal;
                    --btn-small-font-weight: normal;
                    --btn-large-font-weight: normal;
                    --color-border: #e4e7f0;
                    --color-warn: #ffa53d;
                    --color-red: #ff4d4d;
                    --color-green: #08bf81;
                    --color-blue: #6a76ea;
                    --duration: 0.2s;
                    --mx-text-placeholder: #999;
                    --mx-trigger-color: var(--font-color,#333);
                    --mx-trigger-color-hover: var(--font-color,#333);
                    --mx-trigger-color-active: var(--font-color,#333);
                    --mx-trigger-tag-bg: #fff;
                    --mx-trigger-tag-color: #333;
                    --mx-trigger-tag-arrow-color: #999;
                    --mx-trigger-tag-bg-hover: #fff;
                    --mx-trigger-tag-color-hover: #333;
                    --mx-trigger-tag-arrow-color-hover: #999;
                    --mx-trigger-tag-bg-active: var(--color-brand-opacity);
                    --mx-trigger-tag-color-active: #333;
                    --mx-trigger-tag-arrow-color-active: #999;
                    --mx-trigger-tag-height: calc(var(--input-height) - 8px);
                    --mx-trigger-arrow-size: 16px;
                    --mx-trigger-arrow-color: #999;
                    --mx-trigger-arrow-color-hover: #666;
                    --mx-trigger-arrow-color-active: #666;
                    --mx-trigger-prefix-icon: #666;
                    --mx-trigger-prefix-text: #666;
                    --mx-comp-disabled-opacity: 0.4;
                    --mx-comp-expand-amin-color: var(--color-brand);
                    --mx-comp-expand-amin-timer: 300ms;
                    --mx-comp-expand-amin-ease: ease-out;
                    --mx-grid-bg: #fff;
                    --mx-grid-body-v-top: var(--output-v-gap,16px);
                    --mx-grid-body-v-bottom: var(--output-v-gap,16px);
                    --mx-grid-border-radius: var(--output-border-radius,24px);
                    --mx-grid-h-gap: var(--output-h-gap,24px);
                    --mx-grid-title-bg: transparent;
                    --mx-grid-title-v-gap: 16px;
                    --mx-grid-title-font-size: 16px;
                    --mx-grid-title-font-weight: bold;
                    --mx-grid-title-color-border: var(--color-border);
                    --mx-grid-title-link-font-size: 12px;
                    --mx-grid-title-link-color: var(--color-brand);
                    --mx-grid-title-link-color-hover: var(--color-brand-hover);
                    --mx-grid-shadow: 0 4px 10px 0 hsla(16,7%,67%,.2);
                    --mx-grid-gap: 16px;
                    --mx-checkbox-size: 14px;
                    --mx-checkbox-border-radius: 4px;
                    --mx-checkbox-border: #dde1eb;
                    --mx-checkbox-bg: #fff;
                    --mx-checkbox-shadow: none;
                    --mx-checkbox-border-hover: #dde1eb;
                    --mx-checkbox-shadow-hover: 0 0 4px 0 rgba(0,0,0,.16);
                    --mx-checkbox-bg-hover: #fff;
                    --mx-table-font-size: var(--font-size);
                    --mx-table-ceil-h-gap: 8px;
                    --mx-table-ceil-v-gap: 12px;
                    --mx-table-ceil-small-h-gap: 4px;
                    --mx-table-ceil-small-v-gap: 4px;
                    --mx-table-ceil-large-h-gap: 24px;
                    --mx-table-ceil-large-v-gap: 24px;
                    --mx-table-ceil-text-align: left;
                    --mx-table-ceil-vertical-align: middle;
                    --mx-table-ceil-font-color: #333;
                    --mx-table-head-line-number: 2;
                    --mx-table-head-border: 1px solid var(--color-border);
                    --mx-table-head-height: 60px;
                    --mx-table-head-small-height: 40px;
                    --mx-table-head-large-height: 80px;
                    --mx-table-head-group-height: 80px;
                    --mx-table-head-bg: #fff;
                    --mx-table-head-font-size: 12px;
                    --mx-table-head-font-color: #333;
                    --mx-table-head-font-weight: bold;
                    --mx-table-hover-bg: #f8f9fa;
                    --mx-table-hover-oper-bg: #e4e7f0;
                    --mx-table-scrollbar-bg: #333;
                    --mx-effects-card-color-bg: #fff;
                    --mx-effects-card-title-font-size: 18px;
                    --mx-effects-card-sub-title-font-size: 14px;
                    --mx-effects-card-tip-font-size: 12px;
                    --mx-effects-card-color-border: var(--color-border);
                    --mx-effects-card-shadow: 0 1px 4px 0 hsla(0,0%,73%,.5);
                    --mx-effects-tag-mode: opacity;
                    --mx-effects-tag-height: 16px;
                    --mx-effects-tag-border-radius: calc(var(--mx-effects-tag-height, 16px)/2);
                    --mx-effects-tag-h-gap: 6px;
                    --mx-effects-tag-font-size: 20px;
                    --mx-effects-tag-font-scale: 0.5;
                    --mx-effects-large-tag-height: 18px;
                    --mx-effects-large-tag-border-radius: calc(var(--mx-effects-large-tag-height, 16px)/2);
                    --mx-effects-large-tag-h-gap: 8px;
                    --mx-effects-large-tag-font-size: 12px;
                    --mx-effects-large-tag-font-scale: 1;
                    --mx-effects-notice-border-radius: var(--border-radius);
                    --mx-effects-notice-v-gap: 8px;
                    --mx-effects-notice-h-gap: var(--output-h-gap,24px);
                    --mx-effects-notice-fontsize: 12px;
                    --mx-effects-notice-line-height: 20px;
                    --mx-effects-notice-round-height: 40px;
                    --mx-effects-progress-height: 6px;
                    --mx-effects-progress-num-height: 24px;
                    --mx-effects-progress-bg: #e4e7f0;
                    --mx-dialog-text-align: left;
                    --mx-dialog-color-bg: #e8ebf2;
                    --mx-dialog-shadow: 0 2px 10px 0 rgba(0,0,0,.16);
                    --mx-dialog-body-border-color: 0 none;
                    --mx-tabs-line-item-gap: 16px;
                    --mx-tabs-line-v-gap: var(--mx-grid-title-v-gap);
                    --mx-tabs-line-h-gap: 12px;
                    --mx-tabs-line-font-size: var(--mx-grid-title-font-size,16px);
                    --mx-tabs-line-font-weight: 500;
                    --mx-tabs-line-small-v-gap: calc(var(--mx-grid-title-v-gap)/2);
                    --mx-tabs-line-small-h-gap: 12px;
                    --mx-tabs-line-small-font-size: 12px;
                    --mx-tabs-line-small-font-weight: 500;
                    --mx-tabs-line-border-color: var(--color-border);
                    --mx-tabs-line-color: #333;
                    --mx-tabs-line-color-hover: var(--color-brand);
                    --mx-tabs-line-color-active: var(--color-brand);
                    --mx-tabs-line-bg-hover: var(--color-brand-opacity);
                    --mx-tabs-box-bg: var(--bg-highlight);
                    --mx-tabs-box-bg-hover: var(--bg-highlight-hover);
                    --mx-tabs-box-bg-active: var(--color-brand-opacity);
                    --mx-tabs-box-border: var(--border-highlight);
                    --mx-tabs-box-border-hover: var(--border-highlight-hover);
                    --mx-tabs-box-border-active: var(--border-highlight-active);
                    --mx-tabs-box-color: #666;
                    --mx-tabs-box-color-hover: #333;
                    --mx-tabs-box-color-active: var(--color-brand);
                    --mx-tabs-box-arrow: #999;
                    --mx-tabs-box-arrow-hover: #666;
                    --mx-tabs-box-arrow-active: var(--color-brand);
                    --mx-tabs-box-discrete-gap: 8px;
                    --mx-large-block-outer-gap: 16px;
                    --mx-large-block-v-gap: 12px;
                    --mx-large-block-h-gap: 12px;
                    --mx-large-block-line-height: 18px;
                    --mx-large-block-bg: transparent;
                    --mx-large-block-bg-hover: transparent;
                    --mx-large-block-bg-active: var(--color-brand-opacity5,var(--color-brand-opacity));
                    --mx-large-block-border: var(--color-border);
                    --mx-large-block-border-hover: var(--border-highlight-active);
                    --mx-large-block-border-active: var(--border-highlight-active);
                    --mx-tabs-menu-line-color: #c3c9d9;
                    --mx-tabs-menu-width: 160px;
                    --mx-tabs-menu-height: var(--input-height);
                    --mx-tabs-menu-padding-gap: 12px;
                    --mx-tabs-menu-margin-gap: 8px;
                    --mx-tabs-menu-icon-size: 16px;
                    --mx-tabs-menu-hover-color: var(--color-brand);
                    --mx-tabs-menu-hover-bg: var(--color-brand-opacity);
                    --mx-tabs-menu-hover-shadow: 0 none;
                    --mx-tabs-menu-selected-color: #fff;
                    --mx-tabs-menu-selected-bg: var(--color-brand);
                    --mx-tabs-menu-selected-shadow: var(--border-highlight-shadow-active);
                    --mx-popover-v-gap: var(--input-v-gap);
                    --mx-popover-h-gap: var(--input-h-gap);
                    --mx-popover-arrow-size: 8px;
                    --mx-popover-arrow-gap: 24px;
                    --mx-popover-bg: var(--output-bg,#fff);
                    --mx-popover-color: var(--output-color,var(--font-color,#333));
                    --mx-popover-color-border: var(--color-border);
                    --mx-popover-shaodow: 0 4px 8px 0 rgba(0,0,0,.06);
                    --mx-pagination-align: left;
                    --mx-switch-width: 36px;
                    --mx-switch-height: 20px;
                    --mx-switch-icon-size: 14px;
                    --mx-switch-border-radius: 10px;
                    --mx-header-other-height: 48px;
                    --mx-header-menu-height: 58px;
                    --mx-carousel-zindex: 3;
                    --mx-carousel-triggers-size: 24px;
                    --mx-carousel-triggers-fontsize: 16px;
                    --mx-carousel-trigger-color: #fff;
                    --mx-carousel-trigger-bg: #dde1eb;
                    --mx-carousel-trigger-gap: 8px;
                    --mx-carousel-line-size: 16px;
                    --mx-carousel-dot-size: 8px;
                    --mx-main-nav-v-gap: 16px;
                    --mx-main-nav-h-gap: 16px;
                    --mx-main-nav-footer-height: 80px;
                    --mx-main-nav-info-width: 240px;
                    --mx-grey-box-border: #e4e7f0;
                    --mx-grey-box-bg: #f8f9fa;
                    --mx-grey-box-border-hover: var(--color-brand-opacity50,var(--color-brand));
                    --mx-grey-box-bg-hover: #f0f2f5;
                    --mx-market-color: #f257a8;
                    --mx-market-color-gradient: #ff0036;
                    --mx-market-color-border: #fcd5e5;
                    --mx-market-color-bg: #fff5f8;
                    --mx-market-color-hover: #df2e8b;
                    --mx-market-color-hover-gradient: #e80c20;
                    --mx-market-color-hover-border: #fcd5e5;
                    --mx-market-color-hover-bg: #fee3eb;
                    --mx-market-color-bg5: linear-gradient(135deg,#fff2f5,#fef6fa);
                    --mx-market-color-bg10: linear-gradient(135deg,#ffe6eb,#fdeef6);
                    --mx-mask-black: rgba(0,0,0,.6);
                    --mx-mask-white: hsla(0,0%,100%,.6);
                    --mx-mask-backdrop-filter: blur(2px);
                    --mx-ai-color: #33f;
                    --mx-ai-color-gradient: #93f;
                    --mx-ai-color-anim: #3cf;
                    --mx-ai-color-hover: #0c0cff;
                    --mx-ai-color-hover-gradient: #850cff;
                    --mx-ai-color-hover-anim: #0cc2ff;
                    --mx-ai-color-line-width-number: 2;
                    --mx-ai-color100: #33f;
                    --mx-ai-color90: #4747ff;
                    --mx-ai-color80: #5b5bff;
                    --mx-ai-color70: #7070ff;
                    --mx-ai-color60: #8484ff;
                    --mx-ai-color50: #99f;
                    --mx-ai-color40: #adadff;
                    --mx-ai-color30: #c1c1ff;
                    --mx-ai-color20: #d6d6ff;
                    --mx-ai-color10: #eaeaff;
                    --mx-ai-color5: #f4f4ff;
                    --mx-ai-color-gradient100: #93f;
                    --mx-ai-color-gradient90: #a347ff;
                    --mx-ai-color-gradient80: #ad5bff;
                    --mx-ai-color-gradient70: #b770ff;
                    --mx-ai-color-gradient60: #c184ff;
                    --mx-ai-color-gradient50: #c9f;
                    --mx-ai-color-gradient40: #d6adff;
                    --mx-ai-color-gradient30: #e0c1ff;
                    --mx-ai-color-gradient20: #ead6ff;
                    --mx-ai-color-gradient10: #f4eaff;
                    --mx-ai-color-gradient5: #f9f4ff;
                    --mx-ai-color-anim100: #3cf;
                    --mx-ai-color-anim90: #47d1ff;
                    --mx-ai-color-anim80: #5bd6ff;
                    --mx-ai-color-anim70: #70dbff;
                    --mx-ai-color-anim60: #84e0ff;
                    --mx-ai-color-anim50: #99e5ff;
                    --mx-ai-color-anim40: #adeaff;
                    --mx-ai-color-anim30: #c1efff;
                    --mx-ai-color-anim20: #d6f4ff;
                    --mx-ai-color-anim10: #eaf9ff;
                    --mx-ai-color-anim5: #f4fcff;
                    --mx-ai-color-line: linear-gradient(135deg,#33f,#3cf,#93f);
                    --mx-ai-color-line100: linear-gradient(135deg,#33f,#3cf,#93f);
                    --mx-ai-color-line90: linear-gradient(135deg,#4747ff,#47d1ff,#a347ff);
                    --mx-ai-color-line80: linear-gradient(135deg,#5b5bff,#5bd6ff,#ad5bff);
                    --mx-ai-color-line70: linear-gradient(135deg,#7070ff,#70dbff,#b770ff);
                    --mx-ai-color-line60: linear-gradient(135deg,#8484ff,#84e0ff,#c184ff);
                    --mx-ai-color-line50: linear-gradient(135deg,#99f,#99e5ff,#c9f);
                    --mx-ai-color-line40: linear-gradient(135deg,#adadff,#adeaff,#d6adff);
                    --mx-ai-color-line30: linear-gradient(135deg,#c1c1ff,#c1efff,#e0c1ff);
                    --mx-ai-color-line20: linear-gradient(135deg,#d6d6ff,#d6f4ff,#ead6ff);
                    --mx-ai-color-line10: linear-gradient(135deg,#eaeaff,#eaf9ff,#f4eaff);
                    --mx-ai-color-line5: linear-gradient(135deg,#f4f4ff,#f4fcff,#f9f4ff);
                    --mx-ai-color-bg: linear-gradient(135deg,#33f,#3cf,#93f);
                    --mx-ai-color-bg100: linear-gradient(135deg,#33f,#3cf,#93f);
                    --mx-ai-color-bg90: linear-gradient(135deg,#4747ff,#47d1ff,#a347ff);
                    --mx-ai-color-bg80: linear-gradient(135deg,#5b5bff,#5bd6ff,#ad5bff);
                    --mx-ai-color-bg70: linear-gradient(135deg,#7070ff,#70dbff,#b770ff);
                    --mx-ai-color-bg60: linear-gradient(135deg,#8484ff,#84e0ff,#c184ff);
                    --mx-ai-color-bg50: linear-gradient(135deg,#99f,#99e5ff,#c9f);
                    --mx-ai-color-bg40: linear-gradient(135deg,#adadff,#adeaff,#d6adff);
                    --mx-ai-color-bg30: linear-gradient(135deg,#c1c1ff,#c1efff,#e0c1ff);
                    --mx-ai-color-bg20: linear-gradient(135deg,#d6d6ff,#d6f4ff,#ead6ff);
                    --mx-ai-color-bg10: linear-gradient(135deg,#eaeaff,#eaf9ff,#f4eaff);
                    --mx-ai-color-bg5: linear-gradient(135deg,#f4f4ff,#f4fcff,#f9f4ff);
                    --mx-ai-color-bg-primary: linear-gradient(135deg,#eaeaff,#eaf9ff,#f4eaff);
                    --mx-ai-color-bg-secondary: linear-gradient(135deg,#f4f4ff,#f4fcff,#f9f4ff);
                    --mx-ai-color-line-primary: linear-gradient(135deg,#33f,#3cf,#93f);
                    --mx-ai-color-line-secondary: linear-gradient(135deg,#d6d6ff,#d6f4ff,#ead6ff);
                    --mx-ai-color-line-width: 2px;
                    --app-brand: var(--color-brand);
                    --app-brand-gradient: var(--color-brand-gradient);
                    --mx-grid-shadow-hover: var(--mx-grid-shadow);
                    --mx-checkbox-color: var(--mx-checkbox-border);
                    --mx-checkbox-hover-color: var(--mx-checkbox-border-hover);
                    --mx-checkbox-hover-shadow: var(--mx-checkbox-shadow-hover);
                    --mx-tag-mode: var(--mx-effects-tag-mode);
                    --mx-tag-height: var(--mx-effects-tag-height);
                    --mx-tag-border-radius: var(--mx-effects-tag-border-radius);
                    --mx-tag-h-gap: var(--mx-effects-tag-h-gap);
                    --mx-tag-font-size: var(--mx-effects-tag-font-size);
                    --mx-tag-font-scale: var(--mx-effects-tag-font-scale);
                    --mx-input-gap-border: var(--input-gap-border);
                    --mx-effects-card-v-gap: var(--output-large-v-gap);
                    --mx-effects-card-h-gap: var(--output-large-h-gap);
                    --mx-effects-card-radius: var(--output-large-border-radius);
                    --mx-tab-box-gap-border: var(--input-gap-border);
                    --mx-tab-box-bg: var(--mx-tabs-box-bg);
                    --mx-tab-box-bg-active: var(--mx-tabs-box-bg-active);
                    --mx-tab-box-border: var(--mx-tabs-box-border);
                    --mx-tab-box-border-active: var(--mx-tabs-box-border-active);
                    --mx-tab-box-color: var(--mx-tabs-box-color);
                    --mx-tab-box-color-hover: var(--mx-tabs-box-color-hover);
                    --mx-tab-box-color-active: var(--mx-tabs-box-color-active);
                    --mx-tab-v-gap: var(--mx-tabs-line-v-gap);
                    --mx-tab-h-gap: var(--mx-tabs-line-h-gap);
                    --mx-tab-first-h-gap: var(--mx-grid-h-gap,24px);
                    --mx-tab-font-size: var(--mx-tabs-line-font-size);
                    --mx-tab-font-weight: var(--mx-tabs-line-font-weight);
                    --mx-tab-border-color: var(--mx-tabs-line-border-color);
                    --mx-tab-color: var(--mx-tabs-line-color);
                    --mx-tab-color-hover: var(--mx-tabs-line-color-hover);
                    --mx-tab-color-active: var(--mx-tabs-line-color-active);
                    --mx-tab-box-arrow-bg: var(--mx-tabs-box-arrow);
                    --mx-tab-box-arrow-bg-hover: var(--mx-tabs-box-arrow-hover);
                    --mx-tab-box-arrow-bg-active: var(--mx-tabs-box-arrow-active);
                    --mx-trigger-v-gap: var(--input-v-gap);
                    --mx-trigger-h-gap: var(--input-h-gap);
                    --mx-trigger-min-width: var(--input-min-width);
                    --mx-trigger-font-size: var(--input-font-size);
                    --mx-trigger-small-v-gap: var(--input-small-v-gap);
                    --mx-trigger-small-h-gap: var(--input-small-h-gap);
                    --mx-trigger-small-min-width: var(--input-small-min-width);
                    --mx-trigger-small-font-size: var(--input-small-font-size);
                    --mx-trigger-large-v-gap: var(--input-large-v-gap);
                    --mx-trigger-large-h-gap: var(--input-large-h-gap);
                    --mx-trigger-large-min-width: var(--input-large-min-width);
                    --mx-trigger-large-font-size: var(--input-large-font-size);
                    --mx-trigger-output-gap: var(--output-offset);
                    --mx-trigger-output-height: var(--output-item-height);
                    --mx-comp-v-gap: var(--output-v-gap);
                    --mx-comp-h-gap: var(--output-h-gap);
                    --mx-comp-shadow: var(--mx-dialog-shadow);
                    --mx-custom-layout-width: 80px;
                    --mx-custom-layout-h-gap: 16px;
                    --mx-custom-layout-v-gap: 16px;
                    --mx-custom-layout-icon-width: 32px;
                    --mx-custom-layout-icon-height: 32px;
                    --am26-font: "SF Pro Display", "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif;
                    --am26-mono: "SF Mono", "JetBrains Mono", "Menlo", "Monaco", "Consolas", monospace;
                    --am26-text: #1b2438;
                    --am26-text-soft: #505a74;
                    --am26-border: rgba(255, 255, 255, 0.4);
                    --am26-border-strong: rgba(255, 255, 255, 0.6);
                    --am26-surface: rgba(255, 255, 255, 0.25);
                    --am26-surface-strong: rgba(255, 255, 255, 0.45);
                    --am26-panel: linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.1));
                    --am26-panel-strong: linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2));
                    --am26-primary: #2a5bff;
                    --am26-primary-strong: #1d3fcf;
                    --am26-primary-soft: rgba(42, 91, 255, 0.15);
                    --am26-success: #0ea86f;
                    --am26-warning: #e8a325;
                    --am26-danger: #ea4f4f;
                    --am26-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
                    --am26-glow: inset 0 0 0 1px rgba(255, 255, 255, 0.3);
                    --mux-comp-disabled-opacity: 0.4;
                    --mux-comp-v-gap: 16px;
                    --mux-comp-h-gap: 24px;
                    --mux-comp-shadow: 0 2px 10px 0 rgba(0,0,0,0.16);
                    --mux-comp-shadow-border: 0 none;
                    --mux-comp-btn-gap: 8px;
                    --mux-trigger-tag-gap: 2px;
                    --mux-trigger-tag-height: calc(var(--input-height) - var(--mux-trigger-tag-gap)*4 - 2px);
                    --mux-trigger-tag-bg: #fff;
                    --mux-trigger-tag-bg-hover: #fff;
                    --mux-trigger-tag-bg-active: var(--color-brand-opacity);
                    --mux-trigger-tag-arrow-color: #999;
                    --mux-trigger-tag-arrow-color-hover: #666;
                    --mux-trigger-input-placeholder-color: #999;
                    --mux-trigger-prefix-icon: #666;
                    --mux-trigger-prefix-text: #666;
                    --mux-trigger-arrow-size: 16px;
                    --mux-trigger-arrow-color: #333;
                    --mux-trigger-arrow-color-hover: #333;
                    --mux-trigger-v-gap: 8px;
                    --mux-trigger-h-gap: 8px;
                    --mux-trigger-min-width: var(--btn-min-width);
                    --mux-trigger-font-size: var(--btn-font-size);
                    --mux-trigger-small-v-gap: 8px;
                    --mux-trigger-small-h-gap: 8px;
                    --mux-trigger-small-min-width: var(--btn-small-min-width);
                    --mux-trigger-small-font-size: var(--btn-small-font-size);
                    --mux-trigger-large-v-gap: 8px;
                    --mux-trigger-large-h-gap: 12px;
                    --mux-trigger-large-min-width: var(--btn-large-min-width);
                    --mux-trigger-large-font-size: var(--btn-large-font-size);
                    --mux-table-hover-color: #f5f6f8;
                    --mux-table-hover-expanded-row-bg: #eaecf1;
                    --mux-table-border-color: #dfdfdf;
                    --mux-table-size--large: 100px;
                    --mux-table-size--normal: 60px;
                    --mux-table-size--small: 40px;
                    --mux-table-expanded-row-height: 40px;
                    --mux-table-header-height--small: 50px;
                    --mux-table-header-background: #fff;
                    --mux-radio-color: #dadadb;
                    --mux-radio-shadow-color: rgba(0,0,0,0.16);
                    --mux-radio-gap: 8px;
                    --mux-checkbox-color: #9095a1;
                    --mux-checkbox-size: calc(var(--font-size) + 2px);
                    --mux-checkbox-border-radius: 4px;
                    --mux-tag-font-scale: 0.84;
                    --mux-nav-icon-gap: 12px;
                    --mux-nav-h-gap: 24px;
                    --mux-mask-bg: rgba(0,0,0,0.6);
                    --mux-mask-light-bg: hsla(0,0%,100%,0.6);
                    --mux-statistic-font-size-integer: 20px;
                    --mux-statistic-font-size-decimal: 14px;
                    --mux-field-color-error: var(--color-red);
                    --mux-field-color-warning: var(--color-warn);
                    --mux-field-color-success: var(--color-green);
                    --mux-field-color-highlight: var(--color-brand);
                    --mux-field-color-initial: transparent;
                    --mux-common-bg: transparent;
                    --mux-btn-h-gap: 12px;
                    --mux-process-color-success: var(--color-green);
                    --mux-process-color-suspend: var(--color-warn);
                    --mux-process-color-error: var(--color-red);
                    --color-brand-alpha-10: rgba(62,62,255,0.1);
                    --color-brand-alpha-50: rgba(62,62,255,0.5);
                    --color-brand-btn-shadow-hover: 0 2px 10px 0 rgba(62,62,255,0.4);
                    --border-huge-radius: 16px;
                    --border-highlight-active-error: rgba(237,0,0,0.5);
                    --border-highlight-shadow-active-error: 0 2px 4px 0 rgba(237,0,0,0.2);
                    --border-highlight-active-warning: rgba(255,136,0,0.5);
                    --border-highlight-shadow-active-warning: 0 2px 4px 0 rgba(255,136,0,0.2);
                    --border-highlight-active-success: rgba(0,175,116,0.5);
                    --border-highlight-shadow-active-success: 0 2px 4px 0 rgba(0,175,116,0.2);
                    --btn-error: #f44;
                    --btn-error-gradient: #f44;
                    --btn-error-text: #fff;
                    --btn-error-hover: #cc0909;
                    --btn-error-gradient-hover: #cc0909;
                    --btn-error-shadow-hover: 0 2px 10px 0 rgba(255,68,68,0.4);
                    --btn-error-text-hover: #fff;
                    --btn-error-border: #cf1c1c;
                    --btn-error-bg: #ffecec;
                    --btn-error-border-hover: #fd9b9b;
                    --btn-error-bg-hover: #fedadb;
                    --color-orange: #f50;
                    --color-gray: rgba(0,0,0,0.25);
                    --color-red-weaken: #c9817b;
                    --mux-ai-brand--color: #ae5cff;
                    --mux-ai-brand-gradient-color: #5c5cff;
                    --mux-ai-brand-gradient-tl-br: linear-gradient(135deg,#5c5cff,#ae5cff 95%);
                    --mux-ai-brand-gradient-tl-br-dark: linear-gradient(135deg,#3e3eff,#93f 95%);
                    --mux-ai-brand-gradient-tl-br-light: linear-gradient(135deg,#ebd7ff,#d7d7ff);
                    --mux-ai-brand-gradient-tl-br-slight: linear-gradient(117deg,#ececff,#e9fbff 48%,#f4eaff);
                    --mux-ai-brand-gradient-tl-br-lighter: linear-gradient(135deg,#f5f5ff,#f5fdff 50%,#faf5ff);
                    --mux-ai-brand-gradient-l-r-dark: linear-gradient(90deg,#3e3eff 5%,#93f 95%);
                    --mux-ai-brand-gradient-line: linear-gradient(135deg,#3e3eff,#1dd3ff,#8e28ff);
                    --mux-marketing-brand-color: #ff0036;
                    --mux-marketing-brand-gradient-color: #f257a8;
                    --mux-marketing-brand-gradient-t-b: linear-gradient(180deg,#f257a8 0,#ff0036);
                    --mux-marketing-brand-gradient-t-b-dark: linear-gradient(180deg,#df2e8b 0,#e80c20);
                    --mux-marketing-brand-gradient-t-b-light: linear-gradient(180deg,#fff,#ffccd7);
                    --mux-marketing-brand-gradient-t-b-lighter: linear-gradient(180deg,#fff,#ffe6eb);
                    --mux-marketing-brand-gradient-l-r: linear-gradient(90deg,#f257a8 0,#ff0036);
                    --mux-marketing-brand-gradient-l-r-dark: linear-gradient(90deg,#df2e8b 0,#e80c20);
                    --mux-marketing-brand-gradient-tl-br-light: linear-gradient(135deg,#ffe6eb,#fdeef6);
                    --mux-marketing-brand-gradient-tl-br-lighter: linear-gradient(135deg,#fff2f5,#fef6fa);
                    --mx-color-width: 224px;
                    --mx-color-slider-width: 18px;
                    --mx-color-picker-width: calc(var(--mx-color-width) - var(--mx-color-slider-width) - 10px);
                    -webkit-font-smoothing: antialiased;
                    color: var(--font-color,#333);
                    font-family: var(--font-family);
                    font-size: var(--font-size);
                    line-height: var(--line-height);
                    box-sizing: inherit;
                    -webkit-appearance: none;
                    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
                    outline: none;
                    bottom: 0;
                    position: relative;
                    width: 100%;
                }
            `;
            const style = document.createElement('style');
            style.id = 'am-helper-pro-v26-style';
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
                <div class="am-close-btn" title="最小化">
                    <svg viewBox="0 0 1024 1024" style="width:1.2em;height:1.2em;vertical-align:middle;fill:currentColor;overflow:hidden;"><path d="M551.424 512l195.072-195.072c9.728-9.728 9.728-25.6 0-36.864l-1.536-1.536c-9.728-9.728-25.6-9.728-35.328 0L514.56 475.136 319.488 280.064c-9.728-9.728-25.6-9.728-35.328 0l-1.536 1.536c-9.728 9.728-9.728 25.6 0 36.864L477.696 512 282.624 707.072c-9.728 9.728-9.728 25.6 0 36.864l1.536 1.536c9.728 9.728 25.6 9.728 35.328 0L514.56 548.864l195.072 195.072c9.728 9.728 25.6 9.728 35.328 0l1.536-1.536c9.728-9.728 9.728-25.6 0-36.864L551.424 512z"></path></svg>
                </div>
            </div>
            <div class="am-body">
                <!-- Section 1: Tools -->
                <div class="am-tools-row">
                    <div class="am-tool-btn" id="am-trigger-optimizer">
                        <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor"><path d="M907.8 770.1c-60-96.1-137.9-178.6-227.1-241.6 8.3-43.1 7.1-88.9-5-131-29.2-101.5-121.1-177.3-227.5-188.9-10.4-1.2-18.7 8.3-15.3 18.2 24.5 70.3 5.4 152.1-51.5 209-56.9 56.9-138.7 76-209 51.5-9.9-3.4-19.4 4.8-18.2 15.3 11.6 106.4 87.4 198.3 188.9 227.5 42.1 12.1 87.9 13.3 131 5 63.1 89.2 145.5 167.1 241.6 227.1 21.6 13.5 49.3-3.9 46.2-28.7l-12.7-106.3c10.3 3.6 21 6.1 31.9 7.4 35.7 4.2 71.3-7.5 99.2-35.4 27.9-27.9 39.6-63.5 35.4-99.2-1.3-10.9-3.8-21.6-7.4-31.9l106.3 12.7c24.9 3.1 42.3-24.6 28.7-46.2zM512 512c-23.7 0-46.3-5-67.4-14.1-18.4-7.9-19-33.3-1-42.3 22.1-11 47.9-16.1 74.5-13.2 59.8 6.5 106.9 53.6 113.4 113.4 2.9 26.6-2.2 52.4-13.2 74.5-9 18-34.4 17.4-42.3-1-9.1-21.1-14.1-43.7-14.1-67.4z"></path></svg>
                        算法护航
                    </div>
                    <div class="am-tool-btn" data-key="magicReportOpen">
                        <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor"><path d="M128 128h768v768H128z m60.8 60.8V835.2h646.4V188.8H188.8z M256 384h128v320H256V384z m192-128h128v448H448V256z m192 192h128v256H640V448z"></path></svg>
                        万能查数
                    </div>
                </div>

                <!-- Section 2: Settings -->
                <div class="am-switches-grid">
                    <div class="am-switch-btn" data-key="showCost">询单成本</div>
                    <div class="am-switch-btn" data-key="showCartCost">加购成本</div>
                    <div class="am-switch-btn" data-key="showPercent">潜客占比</div>
                    <div class="am-switch-btn" data-key="showCostRatio">花费占比</div>
                    <div class="am-switch-btn" data-key="showBudget">预算进度</div>
                    <div class="am-switch-btn" data-key="autoSortCharge">花费排序</div>
                    <!-- <div class="am-switch-btn" data-key="autoClose">弹窗速闭</div> -->
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
            let hoverOpenBlockedUntil = 0;
            let autoHideTimer = null;

            const clearAutoHideTimer = () => {
                if (!autoHideTimer) return;
                clearTimeout(autoHideTimer);
                autoHideTimer = null;
            };

            // 展开/收起动画
            const openPanel = (force = false) => {
                clearAutoHideTimer();
                if (!force && Date.now() < hoverOpenBlockedUntil) return;
                if (State.config.panelOpen) return;
                State.config.panelOpen = true;
                State.save();
                this.updateState();
            };
            const closePanel = (blockHoverOpen = false) => {
                clearAutoHideTimer();
                if (blockHoverOpen) hoverOpenBlockedUntil = Date.now() + 800;
                if (!State.config.panelOpen) return;
                State.config.panelOpen = false;
                State.save();
                this.updateState();
            };
            const scheduleAutoHide = (delay = 180) => {
                clearAutoHideTimer();
                autoHideTimer = setTimeout(() => {
                    autoHideTimer = null;
                    if (!State.config.panelOpen) return;
                    if (panel.matches(':hover') || icon.matches(':hover')) return;
                    closePanel(false);
                }, delay);
            };

            icon.onclick = () => openPanel(true);
            // 鼠标移入悬浮球时自动展开
            icon.onmouseenter = () => openPanel(false);
            panel.onmouseenter = clearAutoHideTimer;
            panel.onmouseleave = () => scheduleAutoHide();
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                closePanel(true);
            };

            // 点击面板外部自动最小化
            document.addEventListener('click', (e) => {
                if (State.config.panelOpen && !panel.contains(e.target) && !icon.contains(e.target)) {
                    closePanel(false);
                }
            });

            // 功能按钮
            // 功能开关 (Settings)
            document.querySelectorAll('.am-switch-btn').forEach(btn => {
                btn.onclick = () => {
                    const key = btn.dataset.key;
                    State.config[key] = !State.config[key];
                    State.save();
                    this.updateState();
                    Logger.log(`${btn.textContent.trim()} ${State.config[key] ? '✅' : '❌'} `);
                    if (key !== 'autoClose') Core.run();
                };
            });

            // 工具按钮 (Tools) - 万能查数
            const magicBtn = document.querySelector('.am-tool-btn[data-key="magicReportOpen"]');
            if (magicBtn) {
                magicBtn.onclick = () => {
                    MagicReport.toggle(true);
                };
            }

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

            // 功能开关状态
            document.querySelectorAll('.am-switch-btn').forEach(btn => {
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
        excludePatterns: [
            /videocloud\.cn-hangzhou\.log\.aliyuncs\.com\/logstores\/newplayer\/track(?:[/?#]|$)/i,
            /\/logstores\/[^/?#]+\/track(?:[/?#]|$)/i
        ],
        hooksRegistered: false,
        maxParseBytes: 1024 * 1024,
        parsableTypeHints: ['json', 'text', 'javascript', 'xml', 'html', 'csv', 'plain', 'event-stream'],
        debugHints: new Set(),

        init() {
            this.createPanel();
            this.registerHooks();
        },

        createPanel() {
            const div = document.createElement('div');
            div.id = 'am-report-capture-panel';
            // Inline fallback: even if style injection fails, ensure popup is visible and clickable.
            div.style.cssText = 'font-size:13px;position:fixed;right:20px;bottom:20px;z-index:2147483647;display:none;';
            document.body.appendChild(div);
            this.panel = div;
        },

        debugOnce(key, msg) {
            if (this.debugHints.has(key)) return;
            this.debugHints.add(key);
            console.debug(`[AM][Interceptor] ${msg} `);
        },

        sanitizeUrl(url) {
            if (typeof url !== 'string') return '';
            try {
                const parsed = new URL(url, window.location.origin);
                if (!/^https?:$/.test(parsed.protocol)) return '';
                return parsed.href;
            } catch {
                return '';
            }
        },

        isImageUrl(url) {
            if (typeof url !== 'string') return false;
            const clean = url.split('#')[0].split('?')[0].toLowerCase();
            return /\.(jpg|png|gif|jpeg|webp|svg|bmp)$/i.test(clean);
        },

        isExcludedUrl(url) {
            if (typeof url !== 'string') return false;
            return this.excludePatterns.some(pattern => pattern.test(url));
        },

        isDownloadUrl(url) {
            const safeUrl = this.sanitizeUrl(url);
            if (!safeUrl) return false;
            const lowerUrl = safeUrl.toLowerCase();
            if (this.isExcludedUrl(lowerUrl)) {
                this.debugOnce('exclude-non-download-url', `过滤非下载地址: ${safeUrl} `);
                return false;
            }
            const hasKeyword = this.keywords.some(k => lowerUrl.includes(String(k).toLowerCase()));
            const hasFileExt = /\.(xlsx|xls|csv|zip|txt)(?:$|[?#])/i.test(lowerUrl);
            return (hasKeyword || hasFileExt) && !this.isImageUrl(lowerUrl);
        },

        inspectUrl(url, source) {
            if (!this.isDownloadUrl(url)) return;
            this.show(url, source);
        },

        shouldParseResponse(meta = {}) {
            const source = meta.source || 'Unknown';
            const responseType = String(meta.responseType || '');
            if (responseType && responseType !== 'text') {
                this.debugOnce(`${source}: responseType:${responseType} `, `${source} 跳过解析: responseType = ${responseType} `);
                return false;
            }

            const contentType = String(meta.contentType || '').toLowerCase();
            if (!contentType) {
                this.debugOnce(`${source}: contentType: empty`, `${source} 跳过解析: content - type 为空`);
                return false;
            }
            if (!this.parsableTypeHints.some(type => contentType.includes(type))) {
                this.debugOnce(`${source}: contentType:${contentType} `, `${source} 跳过解析: content - type=${contentType} `);
                return false;
            }

            const contentLength = Number.parseInt(String(meta.contentLength || ''), 10);
            if (Number.isFinite(contentLength) && contentLength > this.maxParseBytes) {
                this.debugOnce(`${source}: contentLength`, `${source} 跳过解析: content - length=${contentLength} 超过限制 ${this.maxParseBytes} `);
                return false;
            }

            if (typeof meta.textLength === 'number' && meta.textLength > this.maxParseBytes) {
                this.debugOnce(`${source}: textLength`, `${source} 跳过解析: 响应文本长度 ${meta.textLength} 超过限制 ${this.maxParseBytes} `);
                return false;
            }

            return true;
        },

        show(url, source) {
            const safeUrl = this.sanitizeUrl(url);
            if (!safeUrl) {
                this.debugOnce('invalid-url', '检测到非法协议 URL，已忽略下载弹窗渲染');
                return;
            }

            if (this.panel.dataset.lastUrl === safeUrl && this.panel.style.display === 'block') return;
            this.panel.dataset.lastUrl = safeUrl;

            Logger.log(`📂 捕获报表: ${source} `, true);

            this.panel.textContent = '';

            const header = document.createElement('div');
            header.className = 'am-download-header';
            const headerTitle = document.createElement('span');
            headerTitle.textContent = '✅ 捕获报表';
            const headerSource = document.createElement('span');
            headerSource.className = 'am-download-source';
            headerSource.textContent = source;
            header.appendChild(headerTitle);
            header.appendChild(headerSource);

            const urlBox = document.createElement('div');
            urlBox.className = 'am-download-url';
            urlBox.textContent = safeUrl;

            const actions = document.createElement('div');
            actions.className = 'am-download-actions';

            const dlLink = document.createElement('a');
            dlLink.href = safeUrl;
            dlLink.target = '_blank';
            dlLink.rel = 'noopener noreferrer';
            dlLink.className = 'am-download-link';
            dlLink.textContent = '⚡ 直连下载';

            const copyBtn = document.createElement('button');
            copyBtn.className = 'am-download-btn am-download-copy';
            copyBtn.textContent = '复制';

            const closeBtn = document.createElement('button');
            closeBtn.className = 'am-download-btn am-download-close';
            closeBtn.textContent = 'X';

            actions.appendChild(dlLink);
            actions.appendChild(copyBtn);
            actions.appendChild(closeBtn);

            const hint = document.createElement('div');
            hint.className = 'am-download-hint';
            hint.textContent = '提示：如果下载的文件名无后缀，请手动添加 .xlsx';

            this.panel.appendChild(header);
            this.panel.appendChild(urlBox);
            this.panel.appendChild(actions);
            this.panel.appendChild(hint);
            this.panel.style.display = 'block';

            copyBtn.onclick = function () {
                GM_setClipboard(safeUrl);
                this.innerText = '已复制';
                setTimeout(() => this.innerText = '复制', 1500);
            };
            closeBtn.onclick = () => this.panel.style.display = 'none';
        },

        // --- 递归解析 JSON (Restored Original Logic) ---
        findUrlInObject(obj, source) {
            if (!obj) return;
            if (typeof obj === 'string') {
                if (obj.startsWith('http') && this.isDownloadUrl(obj)) {
                    this.show(obj, source);
                }
                return;
            }
            if (typeof obj === 'object') {
                for (let key in obj) {
                    this.findUrlInObject(obj[key], source);
                }
            }
        },

        handleResponse(text, source, meta = {}) {
            if (typeof text !== 'string' || !text) return;
            if (!this.shouldParseResponse({ ...meta, source, textLength: text.length })) return;

            try {
                const json = JSON.parse(text);
                this.findUrlInObject(json, `JSON:${source} `);
            } catch (e) {
                // Fallback Regex from original code
                if (text && this.keywords.some(k => text.includes(k))) {
                    const regex = /https?:\/\/[^"'\s\\]+(?:xlsx|csv|MAIN)[^"'\s\\]*/g;
                    const matches = text.match(regex);
                    if (matches) matches.forEach(m => {
                        if (this.isDownloadUrl(m)) this.show(m, `Regex:${source} `);
                    });
                }
            }
        },

        registerHooks() {
            if (this.hooksRegistered) return;
            const hooks = createHookManager();

            hooks.registerFetch(({ args, response }) => {
                const requestUrl = typeof args?.[0] === 'string' ? args[0] : args?.[0]?.url;
                const responseUrl = response?.url || '';
                this.inspectUrl(requestUrl, 'Fetch:RequestURL');
                this.inspectUrl(responseUrl, 'Fetch:ResponseURL');

                const contentType = response?.headers?.get('content-type') || '';
                const contentLength = response?.headers?.get('content-length') || '';
                if (!this.shouldParseResponse({ source: 'Fetch', contentType, contentLength })) return;

                const clone = response.clone();
                clone.text()
                    .then(text => this.handleResponse(text, 'Fetch', { contentType, contentLength }))
                    .catch(() => { });
            });

            hooks.registerXHROpen(({ url }) => {
                this.inspectUrl(url, 'XHR:OpenURL');
            });

            hooks.registerXHRLoad(({ xhr }) => {
                this.inspectUrl(xhr.responseURL || xhr.__amHookUrl, 'XHR:ResponseURL');

                const contentType = xhr.getResponseHeader?.('content-type') || '';
                const contentLength = xhr.getResponseHeader?.('content-length') || '';
                const responseType = xhr.responseType || '';
                const text = typeof xhr.responseText === 'string' ? xhr.responseText : '';

                if (responseType === 'json' && xhr.response && typeof xhr.response === 'object') {
                    this.findUrlInObject(xhr.response, 'JSON:XHR(response)');
                }

                this.handleResponse(text, 'XHR', { contentType, contentLength, responseType });
            });

            document.addEventListener('click', (e) => {
                const target = e.target;
                if (!(target instanceof Element)) return;

                const isExitModeBtn = !!target.closest('#mx_2517 > button');
                const textBtn = target.closest('button');
                const text = (textBtn?.textContent || '').trim();
                const isExitModeText = text.includes('退出模式');

                if (isExitModeBtn || isExitModeText) {
                    if (this.panel) this.panel.style.display = 'none';
                }
            }, true);

            hooks.install();
            this.hooksRegistered = true;
        }
    };

    // ==========================================
    // 6. 万能查数 (Magic Report) - iframe 嵌入方案
    // ==========================================
    const MagicReport = {
        popup: null,
        header: null,
        iframe: null,
        lastCampaignId: '',
        lastCampaignName: '',
        BASE_URL: 'https://one.alimama.com/index.html#!/report/ai-report',
        QUICK_PROMPTS: [
            { label: '📛 计划名：{campaignName}', value: '计划名：{campaignName}', type: 'action', autoSubmit: false, requireCampaignName: true },
            { label: '🖱️ 点击分析', value: '计划ID：{campaignId} 点击人群分析', type: 'query', autoSubmit: true, requireCampaignId: true },
            { label: '🛒 加购分析', value: '计划ID：{campaignId} 加购人群分析', type: 'query', autoSubmit: true, requireCampaignId: true },
            { label: '💰 成交分析', value: '计划ID：{campaignId} 成交人群分析', type: 'query', autoSubmit: true, requireCampaignId: true }
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

            const checkedBox = document.querySelector('input[type="checkbox"][value]:checked');
            if (checkedBox) {
                const id = this.extractCampaignIdFromElement(checkedBox);
                if (id) {
                    this.lastCampaignId = id;
                    return id;
                }
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

            const checkedBox = document.querySelector('input[type="checkbox"][value]:checked');
            if (checkedBox) {
                const row = checkedBox.closest('tr, [role="row"], li, [class*="row"], [class*="item"]');
                if (row) {
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

        resolvePromptText(promptItem) {
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

            return resolved;
        },

        isEditablePromptElement(el) {
            if (!el) return false;
            if (el instanceof HTMLTextAreaElement) return true;
            if (el instanceof HTMLInputElement) {
                const t = (el.type || 'text').toLowerCase();
                return t === 'text' || t === 'search';
            }
            return !!el.isContentEditable;
        },

        isVisibleElement(el) {
            if (!(el instanceof Element)) return false;
            const style = el.ownerDocument?.defaultView?.getComputedStyle(el);
            if (!style) return true;
            if (style.display === 'none' || style.visibility === 'hidden') return false;
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
        },

        findPromptInput(iframeDoc) {
            const selectors = [
                '#ai-input-magic-report textarea',
                '#ai-input-magic-report input[type="text"]',
                '#ai-input-magic-report input[type="search"]',
                '#ai-input-magic-report [contenteditable="true"]',
                'textarea#ai-input-magic-report',
                'input#ai-input-magic-report[type="text"]',
                'input#ai-input-magic-report[type="search"]',
                '[id="ai-input-magic-report"][contenteditable="true"]'
            ];

            for (const selector of selectors) {
                const el = iframeDoc.querySelector(selector);
                if (this.isEditablePromptElement(el)) return el;
            }

            const fallback = Array.from(iframeDoc.querySelectorAll('textarea, input[type="text"], input[type="search"], [contenteditable="true"]'))
                .find(el => {
                    const id = (el.id || '').toLowerCase();
                    const cls = (el.className || '').toLowerCase();
                    const placeholder = (el.getAttribute('placeholder') || '').toLowerCase();
                    const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
                    return (id.includes('magic') || cls.includes('magic') || placeholder.includes('提问') || placeholder.includes('输入') || ariaLabel.includes('输入'))
                        && this.isEditablePromptElement(el)
                        && this.isVisibleElement(el);
                });

            if (fallback) return fallback;

            return Array.from(iframeDoc.querySelectorAll('textarea, input[type="text"], input[type="search"], [contenteditable="true"]'))
                .find(el => this.isEditablePromptElement(el) && this.isVisibleElement(el)) || null;
        },

        setPromptInputValue(inputEl, promptText) {
            if (!this.isEditablePromptElement(inputEl)) return false;

            inputEl.focus();
            if (inputEl.isContentEditable) {
                inputEl.textContent = '';
                inputEl.textContent = promptText;
                inputEl.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: promptText }));
                inputEl.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }

            const proto = inputEl instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
            const valueSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
            if (valueSetter) {
                valueSetter.call(inputEl, promptText);
            } else {
                inputEl.value = promptText;
            }

            inputEl.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: promptText }));
            inputEl.dispatchEvent(new Event('change', { bubbles: true }));
            return (inputEl.value || '').trim() === promptText.trim();
        },

        triggerClick(el) {
            if (!(el instanceof Element)) return;
            const mouseOpts = { bubbles: true, cancelable: true, view: window };
            ['mousedown', 'mouseup', 'click'].forEach(type => {
                el.dispatchEvent(new MouseEvent(type, mouseOpts));
            });
            if (typeof el.click === 'function') el.click();
        },

        findQueryTrigger(iframeDoc, inputEl) {
            const roots = [];
            const nearest = inputEl?.closest('[id*="magic"], [class*="magic"], [class*="query"], form');
            if (nearest) roots.push(nearest);
            roots.push(iframeDoc);

            const triggerSelectors = [
                'button[type="submit"]',
                'button[mx-click*="query"]',
                'button[mx-click*="search"]',
                'button[mx-click*="send"]',
                '[role="button"][mx-click*="query"]',
                '[role="button"][mx-click*="search"]',
                '[role="button"][mx-click*="send"]',
                '[mx-click*="query"]',
                '[mx-click*="search"]',
                '[mx-click*="send"]',
                'button[class*="query"]',
                'button[class*="search"]',
                'button[class*="send"]',
                '.next-btn-primary',
                '.next-btn'
            ];

            const seen = new Set();
            const candidates = [];
            roots.forEach(root => {
                triggerSelectors.forEach(selector => {
                    root.querySelectorAll(selector).forEach(el => {
                        if (seen.has(el) || !this.isVisibleElement(el)) return;
                        if (el.hasAttribute('disabled')) return;
                        if (el.getAttribute('aria-disabled') === 'true') return;
                        seen.add(el);
                        candidates.push(el);
                    });
                });
            });
            if (!candidates.length) return null;

            const scoreOf = (el) => {
                const text = (el.textContent || '').trim();
                const title = (el.getAttribute('title') || '').trim();
                const aria = (el.getAttribute('aria-label') || '').trim();
                const mx = (el.getAttribute('mx-click') || '').trim();
                const cls = (el.className || '').toString();
                const id = (el.id || '').trim();
                const merged = `${text} ${title} ${aria} ${mx} ${cls} ${id} `;
                let score = 0;

                if (text === '查询' || text === '发送' || text === '提问' || text === '立即查询') score += 100;
                if (text.includes('查询')) score += 90;
                if (text.includes('发送') || text.includes('提问')) score += 80;
                if (/query|search|send|submit/i.test(merged)) score += 40;
                if (/next-btn-primary/.test(cls)) score += 15;
                if (inputEl?.form && el.closest('form') === inputEl.form) score += 20;
                return score;
            };

            return candidates
                .map(el => ({ el, score: scoreOf(el) }))
                .sort((a, b) => b.score - a.score)[0]?.el || null;
        },

        trySubmitPrompt(promptText) {
            const iframeDoc = this.getIframeDoc();
            if (!iframeDoc) return { ok: false, reason: 'iframe-not-ready' };

            const inputEl = this.findPromptInput(iframeDoc);
            if (!inputEl) return { ok: false, reason: 'input-not-found' };

            if (!this.setPromptInputValue(inputEl, promptText)) {
                return { ok: false, reason: 'input-set-failed' };
            }

            const trigger = this.findQueryTrigger(iframeDoc, inputEl);
            if (trigger && typeof trigger.click === 'function') {
                this.triggerClick(trigger);
                return { ok: true, method: 'button' };
            }

            if (inputEl.form && typeof inputEl.form.requestSubmit === 'function') {
                inputEl.form.requestSubmit();
                return { ok: true, method: 'form-submit' };
            }

            const keyOptions = { key: 'Enter', code: 'Enter', which: 13, keyCode: 13, bubbles: true, cancelable: true };
            inputEl.dispatchEvent(new KeyboardEvent('keydown', keyOptions));
            inputEl.dispatchEvent(new KeyboardEvent('keypress', keyOptions));
            inputEl.dispatchEvent(new KeyboardEvent('keyup', keyOptions));
            return { ok: true, method: 'enter-fallback', uncertain: true };
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
                    if (result.reason === 'input-not-found' || result.reason === 'iframe-not-ready') {
                        Logger.log('⚠️ 万能查数尚未加载完成，请稍后重试', true);
                    } else {
                        Logger.log('⚠️ 未识别到可用查询按钮，请手动点一次查询后重试', true);
                    }
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
            if (!doc || typeof doc.querySelector !== 'function') {
                return { ok: false, reason: 'doc-not-ready' };
            }

            const inputEl = this.findPromptInput(doc);
            if (!inputEl) return { ok: false, reason: 'input-not-found' };

            if (!this.setPromptInputValue(inputEl, promptText)) {
                return { ok: false, reason: 'input-set-failed' };
            }

            const trigger = this.findQueryTrigger(doc, inputEl);
            if (trigger && typeof trigger.click === 'function') {
                this.triggerClick(trigger);
                return { ok: true, method: 'button' };
            }

            if (inputEl.form && typeof inputEl.form.requestSubmit === 'function') {
                inputEl.form.requestSubmit();
                return { ok: true, method: 'form-submit' };
            }

            const eventView = doc.defaultView || window;
            const keyOptions = { key: 'Enter', code: 'Enter', which: 13, keyCode: 13, bubbles: true, cancelable: true, view: eventView };
            inputEl.dispatchEvent(new KeyboardEvent('keydown', keyOptions));
            inputEl.dispatchEvent(new KeyboardEvent('keypress', keyOptions));
            inputEl.dispatchEvent(new KeyboardEvent('keyup', keyOptions));
            return { ok: true, method: 'enter-fallback', uncertain: true };
        },

        async openNativeAndSubmit(campaignId, promptText) {
            const id = String(campaignId || '').trim();
            if (!/^\d{6,}$/.test(id)) return false;

            const pickNativeEntry = () => {
                const selectors = ['button', 'a', '[role="button"]', '[mx-click]'];
                const nodes = document.querySelectorAll(selectors.join(','));
                const candidates = [];
                const seen = new Set();

                nodes.forEach(el => {
                    if (!(el instanceof Element) || seen.has(el)) return;
                    if (el.closest('#am-helper-panel, #am-magic-report-popup, #alimama-escort-helper-ui, #am-report-capture-panel')) return;
                    if (!this.isVisibleElement(el)) return;
                    if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return;

                    const text = (el.textContent || '').trim();
                    const title = (el.getAttribute('title') || '').trim();
                    const aria = (el.getAttribute('aria-label') || '').trim();
                    const mx = (el.getAttribute('mx-click') || '').trim();
                    const cls = (el.className || '').toString();
                    const idText = (el.id || '').trim();
                    const merged = `${text} ${title} ${aria} ${mx} ${cls} ${idText}`.toLowerCase();

                    let score = 0;
                    if (merged.includes('万象查数')) score += 400;
                    else if (merged.includes('万能查数')) score += 300;
                    else if (merged.includes('全能数据查')) score += 200;
                    else if (merged.includes('查数')) score += 120;
                    else return;

                    if (merged.includes('万象')) score += 40;
                    if (merged.includes('report')) score += 10;
                    if (el.tagName === 'BUTTON') score += 6;
                    if (merged.includes('ai')) score += 4;

                    seen.add(el);
                    candidates.push({ el, score });
                });

                return candidates.sort((a, b) => b.score - a.score)[0]?.el || null;
            };

            const entry = pickNativeEntry();
            if (!entry) return false;

            this.triggerClick(entry);

            for (let i = 0; i < 12; i++) {
                const result = this.trySubmitPromptInDocument(document, promptText);
                if (result.ok) {
                    Logger.log(`🔍 原生查数已执行：${promptText}`);
                    return true;
                }
                await new Promise(resolve => setTimeout(resolve, 350));
            }

            return false;
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
            if (this.popup) return;

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
                    padding: 10px 20px 8px;
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
                #am-magic-report-popup .am-magic-content {
                    position: relative; flex: 1; min-height: 0;
                    background: rgba(255, 255, 255, 0.4);
                    backdrop-filter: blur(10px);
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
                @keyframes am-spin { to { transform: rotate(360deg); } }
            `;
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
                    <div class="am-quick-prompts" id="am-magic-quick-prompts">
                        ${quickPromptHtml}
                    </div>
                </div>
                <div class="am-magic-content">
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
            `;

            document.body.appendChild(div);
            this.popup = div;
            this.header = div.querySelector('.am-magic-header');
            this.iframe = div.querySelector('#am-magic-iframe');
            this.refreshQuickPromptLabels();

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
                const loading = div.querySelector('#am-magic-loading');
                if (loading) loading.style.display = 'flex';
                this.iframe.style.opacity = '0';
                this.iframe.src = this.buildIframeUrl(true);
            };

            // 头部快捷话术
            const quickPrompts = div.querySelector('#am-magic-quick-prompts');
            if (quickPrompts) {
                quickPrompts.addEventListener('click', (e) => {
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

                    const promptText = this.resolvePromptText(promptItem);
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
                if (target.closest('.am-btn-group') || target.closest('.am-quick-prompts')) return;
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
            if (this.popup) {
                this.popup.style.display = show ? 'flex' : 'none';
            } else if (show) {
                this.createPopup();
                this.popup.style.display = 'flex';
            }

            if (show) {
                this.refreshQuickPromptLabels();
            }

            State.config.magicReportOpen = show;
            State.save();
            UI.updateState();
        }
    };

    const CampaignIdQuickEntry = {
        initialized: false,
        IGNORE_SELECTOR: '#am-helper-panel, #am-magic-report-popup, #alimama-escort-helper-ui, #am-report-capture-panel',
        TEXT_PATTERN: /计划\s*(?:ID|id)?\s*[：:]\s*(\d{6,})/g,
        ICON_SVG: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M770.99008 637.242027c14.86848 14.199467 31.3344 29.463893 47.26784 45.335893 57.869653 57.603413 115.602773 115.397973 173.267627 173.19936 41.53344 41.601707 43.39712 100.27008 4.601173 139.4688-39.130453 39.601493-98.399573 37.730987-140.663467-4.46464-69.864107-69.864107-139.933013-139.598507-209.46944-209.865387-8.669867-8.731307-14.199467-9.332053-25.197227-3.331413-248.66816 136.997547-548.870827 1.467733-611.068587-275.531093-50.333013-224.13312 99.997013-449.733973 329.40032-494.26432 236.264107-45.800107 464.800427 123.467093 490.134187 362.530133 9.530027 90.002773-8.198827 173.93664-52.736 252.463787-1.467733 2.60096-2.935467 5.133653-4.1984 7.80288C771.857067 631.637333 771.857067 632.838827 770.99008 637.242027zM415.39584 703.904427c161.000107-1.201493 289.532587-129.80224 288.802133-289.068373-0.730453-159.136427-131.66592-287.798613-291.403093-286.53568C254.859947 129.6384 127.720107 260.23936 128.587093 420.174507 129.39264 575.03744 260.85376 705.10592 415.39584 703.904427zM193.1264 415.17056c0.197973-132.068693 113.937067-226.269867 222.405973-221.463893 0.26624 5.065387 0.79872 10.267307 0.79872 15.40096 0.136533 15.264427 0.068267 30.53568 0.068267 45.602133-103.99744 8.997547-156.071253 79.598933-161.000107 160.467627C235.055787 415.17056 214.657707 415.17056 193.1264 415.17056z"></path>
            </svg>
        `,

        init() {
            if (window.top !== window.self) return;
            if (this.initialized) return;
            document.addEventListener('click', (e) => {
                const target = e.target;
                if (!(target instanceof Element)) return;

                const btn = target.closest('.am-campaign-search-btn[data-am-campaign-quick="1"]');
                if (!btn) return;

                e.preventDefault();
                e.stopPropagation();

                const id = this.normalizeCampaignId(btn.getAttribute('data-campaign-id') || btn.dataset.campaignId);
                if (!id) {
                    Logger.log('⚠️ 计划ID无效，已忽略快捷查数', true);
                    return;
                }

                const guessedName = MagicReport.guessCampaignNameById(id, btn);
                if (guessedName) {
                    MagicReport.lastCampaignName = guessedName;
                }

                MagicReport.openWithCampaignId(id, { preferNative: true, promptType: 'click' }).catch((err) => {
                    Logger.log(`⚠️ 快捷查数失败：${err?.message || '未知错误'} `, true);
                });
            }, true);

            this.initialized = true;
        },

        normalizeCampaignId(rawId) {
            const id = String(rawId || '').trim();
            return /^\d{6,}$/.test(id) ? id : '';
        },

        isInIgnoredArea(el) {
            if (!(el instanceof Element)) return true;
            return !!el.closest(this.IGNORE_SELECTOR);
        },

        createButton(campaignId) {
            const id = this.normalizeCampaignId(campaignId);
            if (!id) return null;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'am-campaign-search-btn';
            btn.setAttribute('data-am-campaign-quick', '1');
            btn.setAttribute('data-campaign-id', id);
            btn.dataset.campaignId = id;
            btn.title = `查数计划ID：${id}`;
            btn.setAttribute('aria-label', `查数计划ID：${id}`);
            btn.innerHTML = this.ICON_SVG.trim();
            return btn;
        },

        run() {
            if (window.top !== window.self) return;
            if (!document.body) return;
            this.enhanceTextNodes();
            this.enhanceLinkNodes();
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
                const rawText = textNode.nodeValue || '';
                const regex = new RegExp(this.TEXT_PATTERN.source, 'g');
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

                        const btn = this.createButton(campaignId);
                        if (btn) frag.appendChild(btn);
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

                const next = el.nextElementSibling;
                if (next?.matches?.('.am-campaign-search-btn[data-am-campaign-quick="1"]') &&
                    next.getAttribute('data-campaign-id') === id) {
                    return;
                }

                const btn = this.createButton(id);
                if (!btn) return;
                el.insertAdjacentElement('afterend', btn);
            });
        }
    };

    // ==========================================
    // 7. 启动程序
    // ==========================================
    function main() {
        UI.init();
        Interceptor.init();
        CampaignIdQuickEntry.init();
        // NOTE: MagicReport 采用 iframe 方案，无需 init，按需创建

        Logger.log(`🚀 阿里助手 Pro v${CURRENT_VERSION} 已启动`);

        let lastUrl = window.location.href;
        let lastUrlResetAt = 0;
        const checkUrlChange = () => {
            if (window.location.href !== lastUrl) {
                lastUrl = window.location.href;
                const now = Date.now();
                if (now - lastUrlResetAt < 300) return;
                lastUrlResetAt = now;
                resetSortState('页面切换');
            }
        };
        window.addEventListener('hashchange', checkUrlChange);
        window.addEventListener('popstate', checkUrlChange);

        let timer;
        let hasExecuted = false;
        const runCore = () => {
            Core.run();
            CampaignIdQuickEntry.run();
            hasExecuted = true;
        };
        const observer = new MutationObserver((mutations) => {
            if (timer) return;
            timer = setTimeout(() => {
                runCore();
                timer = null;
            }, 1000);
        });

        observer.observe(document.body, { childList: true, subtree: true });

        setTimeout(() => {
            if (hasExecuted || timer) return;
            runCore();
        }, 1000);
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
    const CURRENT_VERSION = typeof globalThis !== 'undefined' && typeof globalThis.__AM_GET_SCRIPT_VERSION__ === 'function'
        ? globalThis.__AM_GET_SCRIPT_VERSION__()
        : resolveScriptVersion();

    // ==================== 配置模块 ====================
    const CONFIG = {
        UI_ID: 'alimama-escort-helper-ui',
        VERSION: CURRENT_VERSION,
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
        hookReady: false,

        // Hook XHR 捕获 Token
        hookXHR: () => {
            if (TokenManager.hookReady) return;
            const hooks = window.__AM_HOOK_MANAGER__;
            if (!hooks) {
                Logger.warn('统一 Hook 管理器不可用，已跳过 Token Hook 注入');
                return;
            }

            const syncFromUrl = (rawUrl) => {
                try {
                    if (!rawUrl || (!rawUrl.includes('dynamicToken') && !rawUrl.includes('loginPointId'))) return;
                    const urlObj = new URL(rawUrl, window.location.origin);
                    State.tokens.dynamicToken = urlObj.searchParams.get('dynamicToken') || State.tokens.dynamicToken;
                    State.tokens.loginPointId = urlObj.searchParams.get('loginPointId') || State.tokens.loginPointId;
                } catch { }
            };

            const syncFromBody = (body) => {
                if (!body || typeof body !== 'string') return;
                try {
                    const json = JSON.parse(body);
                    State.tokens.dynamicToken = json.dynamicToken || State.tokens.dynamicToken;
                    State.tokens.loginPointId = json.loginPointId || State.tokens.loginPointId;
                } catch {
                    const params = new URLSearchParams(body);
                    State.tokens.dynamicToken = params.get('dynamicToken') || State.tokens.dynamicToken;
                    State.tokens.loginPointId = params.get('loginPointId') || State.tokens.loginPointId;
                }
            };

            hooks.registerXHROpen(({ xhr, url }) => {
                xhr._url = url;
                syncFromUrl(url);
            });

            hooks.registerXHRSend(({ data, url }) => {
                syncFromUrl(url);
                syncFromBody(data);
            });

            TokenManager.hookReady = true;
            Logger.info('XHR Hook 已接入统一管理器');
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
            table: `width:100%;border-collapse:collapse;font-size:10px;margin:4px 0 8px;border-radius:12px;overflow:hidden;border:1px solid var(--am26-border,rgba(255,255,255,.4));background:rgb(227 227 227 / 20%);`,
            th: `padding:5px 6px;text-align:left;font-weight:600;border-bottom:1px solid var(--am26-border,rgba(255,255,255,.4));background:rgba(255,255,255,.14);color:var(--am26-text,#1b2438);`,
            td: `padding:4px 6px;border-bottom:1px solid var(--am26-border,rgba(255,255,255,.28));color:var(--am26-text-soft,#505a74);`
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
                background:var(--am26-surface,rgba(255,255,255,.25));
                border:1px solid var(--am26-border,rgba(255,255,255,.4));
                border-radius:12px;margin-bottom:8px;overflow:hidden;transition:all 0.3s ease;
                backdrop-filter:blur(6px);
            `;
            card.innerHTML = `
                <div class="card-header" style="
                    padding:8px 12px;background:rgba(255,255,255,.22);border-bottom:1px solid var(--am26-border,rgba(255,255,255,.4));
                    display:flex;justify-content:space-between;align-items:center;cursor:pointer;
                ">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="
                            display:inline-block;min-width:24px;height:18px;line-height:18px;
                            background:var(--am26-primary,#2a5bff);color:#fff;border-radius:9px;text-align:center;font-size:10px;
                        ">${index}/${total}</span>
                        <span style="font-weight:500;color:var(--am26-text,#1b2438);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
                              title="${safeCampaignName}">${safeCampaignName}</span>
                        <span style="color:var(--am26-text-soft,#505a74);font-size:10px;">(${safeCampaignId})</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="status-badge" style="
                            padding:2px 8px;border-radius:10px;font-size:10px;
                            background:rgba(42,91,255,.12);color:var(--am26-primary,#2a5bff);border:1px solid rgba(42,91,255,.28);
                        ">处理中</span>
                        <span class="arrow" style="
                            display:inline-block;transition:transform 0.2s;
                            font-size:10px;color:var(--am26-text-soft,#505a74);
                        ">▼</span>
                    </div>
                </div>
                <div class="card-body" style="padding:8px 12px;font-size:11px;max-height:150px;overflow-y:auto;background:rgba(255,255,255,.12);">
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
            if (header) {
                header.style.setProperty('border', '0', 'important');
                header.style.setProperty('border-bottom', '0', 'important');
            }
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
                        info: 'background:rgba(42,91,255,.12);color:var(--am26-primary,#2a5bff);border:1px solid rgba(42,91,255,.28);',
                        success: 'background:rgba(14,168,111,.12);color:var(--am26-success,#0ea86f);border:1px solid rgba(14,168,111,.28);',
                        warning: 'background:rgba(232,163,37,.12);color:var(--am26-warning,#e8a325);border:1px solid rgba(232,163,37,.28);',
                        error: 'background:rgba(234,79,79,.12);color:var(--am26-danger,#ea4f4f);border:1px solid rgba(234,79,79,.28);'
                    };
                    badge.style.cssText = `padding:2px 8px;border-radius:10px;font-size:10px;${styles[type] || styles.info}`;
                    badge.textContent = status;

                    // 同时更新卡片边框颜色
                    const borderColors = {
                        info: 'rgba(42,91,255,.32)',
                        success: 'rgba(14,168,111,.35)',
                        warning: 'rgba(232,163,37,.35)',
                        error: 'rgba(234,79,79,.35)'
                    };
                    const borderColor = borderColors[type] || borderColors.info;
                    card.style.borderColor = borderColor;
                    const headerEl = card.querySelector('.card-header');
                    if (headerEl) {
                        headerEl.style.setProperty('border', '0', 'important');
                        headerEl.style.setProperty('border-bottom', '0', 'important');
                    }
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

            const { headerBg = 'rgba(255,255,255,.14)', headerColor = 'var(--am26-text,#1b2438)', highlight } = options;
            const { table, th, td } = UI.styles;

            let html = `<table style="${table}margin-top:4px;">
                <thead><tr>${columns.map(c =>
                `<th style="${th}background:${headerBg};color:${headerColor};${c.width ? `width:${c.width};` : ''}">${c.title}</th>`
            ).join('')}</tr></thead><tbody>`;

            data.forEach((row, idx) => {
                const isHighlight = !!highlight?.(row);
                const rowStyle = isHighlight ? 'background:rgba(42,91,255,.08);' : '';
                const nameStyle = isHighlight ? 'color:var(--am26-primary,#2a5bff);font-weight:600;' : '';

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
            ], { headerBg: 'rgba(42,91,255,.12)', headerColor: 'var(--am26-primary,#2a5bff)' });
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
                background:rgba(15,23,42,0.42);backdrop-filter:blur(6px);
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
                                    <tr style="${row.success ? '' : 'background:rgba(234,79,79,.08);'}">
                                        <td style="padding:8px 12px;border-bottom:1px solid var(--am26-border,rgba(255,255,255,.35));color:var(--am26-text-soft,#505a74);">${i + 1}</td>
                                        <td style="padding:8px 12px;border-bottom:1px solid var(--am26-border,rgba(255,255,255,.35));${row.success ? 'color:var(--am26-text,#1b2438);' : 'color:var(--am26-danger,#ea4f4f);'}">${safeName}</td>
                                        <td style="padding:8px 12px;border-bottom:1px solid var(--am26-border,rgba(255,255,255,.35));text-align:center;">
                                            ${row.success
                        ? '<span style="color:var(--am26-success,#0ea86f);font-weight:600;">✓ 成功</span>'
                        : '<span style="color:var(--am26-danger,#ea4f4f);font-weight:600;">✗ 失败</span>'}
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
                    background:var(--am26-panel-strong,rgba(255,255,255,.45));
                    border:1px solid var(--am26-border,rgba(255,255,255,.4));
                    border-radius:18px;padding:24px 32px;min-width:400px;max-width:600px;
                    box-shadow:0 20px 60px rgba(17,24,39,0.28);animation:slideUp 0.4s ease;
                    color:var(--am26-text,#1b2438);font-family:var(--am26-font,-apple-system,system-ui,sans-serif);
                    backdrop-filter:blur(16px);
                ">
                    <div style="text-align:center;margin-bottom:20px;">
                        <div style="font-size:48px;margin-bottom:12px;">${isAllSuccess ? '🎉' : '⚠️'}</div>
                        <div style="font-size:20px;font-weight:600;color:var(--am26-text,#1b2438);">执行完成</div>
                        <div style="font-size:14px;color:var(--am26-text-soft,#505a74);margin-top:8px;">
                            共 ${totalCount} 个计划，
                            <span style="color:var(--am26-success,#0ea86f);font-weight:600;">${successCount} 成功</span>
                            ${failCount > 0 ? `，<span style="color:var(--am26-danger,#ea4f4f);font-weight:600;">${failCount} 失败</span>` : ''}
                        </div>
                    </div>
                    <div style="max-height:300px;overflow-y:auto;border:1px solid var(--am26-border,rgba(255,255,255,.4));border-radius:12px;">
                        <table style="width:100%;border-collapse:collapse;font-size:13px;">
                            <thead>
                                <tr style="background:rgba(255,255,255,.16);">
                                    <th style="padding:10px 12px;text-align:left;border-bottom:1px solid var(--am26-border,rgba(255,255,255,.35));width:40px;">#</th>
                                    <th style="padding:10px 12px;text-align:left;border-bottom:1px solid var(--am26-border,rgba(255,255,255,.35));">计划名称</th>
                                    <th style="padding:10px 12px;text-align:center;border-bottom:1px solid var(--am26-border,rgba(255,255,255,.35));width:80px;">状态</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rowsHtml}
                            </tbody>
                        </table>
                    </div>
                    <div style="text-align:center;margin-top:20px;">
                        <button id="${CONFIG.UI_ID}-result-close" style="
                            padding:10px 32px;background:linear-gradient(135deg,var(--am26-primary,#2a5bff),var(--am26-primary-strong,#1d3fcf));color:#fff;
                            border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:500;
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
                    closeBtn.style.boxShadow = '0 4px 12px rgba(42,91,255,0.35)';
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
                padding:15px;background:var(--am26-panel-strong,rgba(255,255,255,.45));
                color:var(--am26-text,#1b2438);border-radius:18px;z-index:1000001;
                font-size:13px;box-shadow:var(--am26-shadow,0 8px 32px rgba(31,38,135,.15));border:1px solid var(--am26-border,rgba(255,255,255,.4));
                font-family:var(--am26-font,-apple-system,system-ui,sans-serif);
                opacity:0;transform:scale(0.8);transform-origin:top right;pointer-events:none;
                transition:opacity 0.3s ease, transform 0.3s ease, width 0.8s cubic-bezier(0.4,0,0.2,1);
                overflow:hidden;
            `;


            panel.innerHTML = `
                <div style="font-weight:bold;margin-bottom:12px;border-bottom:0;padding-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                    <span style="color:var(--am26-primary,#2a5bff);">🛡️ 算法护航 v${CONFIG.VERSION}</span>
                    <div style="display:flex;align-items:center;gap:2px;">
                        <span style="font-size:10px;color:var(--am26-text-soft,#505a74);margin-right:6px;opacity:0.6;">API版</span>
                        <span id="${CONFIG.UI_ID}-center" class="am-icon-btn" title="居中">
                            <svg viewBox="0 0 1024 1024" style="width:0.8em;height:0.8em;vertical-align:middle;fill:currentColor;overflow:hidden;"><path d="M838 314H197c-19.9 0-36-16.1-36-36s16.1-36 36-36h641c19.9 0 36 16.1 36 36s-16.1 36-36 36zM745 468H290c-19.9 0-36-16.1-36-36s16.1-36 36-36h455c19.9 0 36 16.1 36 36s-16.1 36-36 36zM838 621H197c-19.9 0-36-16.1-36-36s16.1-36 36-36h641c19.9 0 36 16.1 36 36s-16.1 36-36 36zM745 775H290c-19.9 0-36-16.1-36-36s16.1-36 36-36h455c19.9 0 36 16.1 36 36s-16.1 36-36 36z"></path></svg>
                        </span>
                        <span id="${CONFIG.UI_ID}-maximize" class="am-icon-btn" title="最大化">
                            <svg viewBox="0 0 1024 1024" style="width:0.8em;height:1.0em;vertical-align:middle;fill:currentColor;overflow:hidden;"><path d="M444.3 539.9L202 782.2 199.8 563c0-16.5-13.5-30-30-30s-30 13.5-30 30l2.2 285.1c0 8.8 3.8 16.7 9.8 22.2 5.5 6 13.4 9.8 22.2 9.8h295.6c16.5 0 30-13.5 30-30s-13.5-30-30-30H248.9l237.8-237.8c11.7-11.7 11.7-30.8 0-42.4-11.6-11.6-30.7-11.6-42.4 0zM578.1 488l242.3-242.3 2.2 219.2c0 16.5 13.5 30 30 30s30-13.5 30-30l-2.2-285.1c0-8.8-3.8-16.7-9.8-22.2-5.5-6-13.4-9.8-22.2-9.8H552.8c-16.5 0-30 13.5-30 30s13.5 30 30 30h220.7L535.7 445.6c-11.7 11.7-11.7 30.8 0 42.4 11.7 11.7 30.8 11.7 42.4 0z"></path></svg>
                        </span>
                        <span id="${CONFIG.UI_ID}-close" class="am-icon-btn danger" title="关闭">
                            <svg viewBox="0 0 1024 1024" style="width:1.2em;height:1.2em;vertical-align:middle;fill:currentColor;overflow:hidden;"><path d="M551.424 512l195.072-195.072c9.728-9.728 9.728-25.6 0-36.864l-1.536-1.536c-9.728-9.728-25.6-9.728-35.328 0L514.56 475.136 319.488 280.064c-9.728-9.728-25.6-9.728-35.328 0l-1.536 1.536c-9.728 9.728-9.728 25.6 0 36.864L477.696 512 282.624 707.072c-9.728 9.728-9.728 25.6 0 36.864l1.536 1.536c9.728 9.728 25.6 9.728 35.328 0L514.56 548.864l195.072 195.072c9.728 9.728 25.6 9.728 35.328 0l1.536-1.536c9.728-9.728 9.728-25.6 0-36.864L551.424 512z"></path></svg>
                        </span>
                    </div>
                </div>
                <div id="${CONFIG.UI_ID}-log-wrapper" style="background:rgba(255,255,255,.22);padding:0;border-radius:12px;font-size:11px;height:0;max-height:500px;overflow:hidden;margin-bottom:0;border:1px solid var(--am26-border,rgba(255,255,255,.35));font-family:Monaco,Consolas,monospace;opacity:0;transform:scaleY(0.8);transform-origin:top;transition:all 0.6s ease-out;">
                    <div id="${CONFIG.UI_ID}-log" style="color:var(--am26-text-soft,#505a74);display:flex;flex-direction:column;gap:3px;line-height:1.5;padding:10px;"></div>
                </div>
                <button id="${CONFIG.UI_ID}-run" style="width:100%;padding:8px;background:linear-gradient(135deg,var(--am26-primary,#2a5bff),var(--am26-primary-strong,#1d3fcf));color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:500;margin-bottom:8px;">立即扫描并优化</button>
                <div style="margin-bottom:8px;display:flex;gap:5px;align-items:center;">
                    <label style="color:var(--am26-text-soft,#505a74);font-size:10px;white-space:nowrap;">诊断话术:</label>
                    <input id="${CONFIG.UI_ID}-prompt" type="text" style="flex:1;padding:4px;border:1px solid var(--am26-border,rgba(255,255,255,.45));border-radius:10px;font-size:10px;background:rgba(255,255,255,.72);color:var(--am26-text,#1b2438);" placeholder="例: 帮我进行深度诊断" />
                </div>
                <div style="margin-bottom:8px;display:flex;gap:5px;align-items:center;">
                    <label style="color:var(--am26-text-soft,#505a74);font-size:10px;white-space:nowrap;">同时执行:</label>
                    <input id="${CONFIG.UI_ID}-concurrency" type="number" min="1" max="10" style="width:50px;padding:4px;border:1px solid var(--am26-border,rgba(255,255,255,.45));border-radius:10px;font-size:10px;text-align:center;background:rgba(255,255,255,.72);color:var(--am26-text,#1b2438);" />
                    <span style="color:var(--am26-text-soft,#505a74);font-size:10px;">个计划 (1-10)</span>
                </div>
                <div style="margin-top:10px;font-size:10px;color:var(--am26-text-soft,#505a74);display:flex;justify-content:space-between;">
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
            ['center', 'maximize', 'close'].forEach(key => {
                const el = document.getElementById(`${CONFIG.UI_ID}-${key}`);
                if (!el) return;
                el.addEventListener('mouseenter', () => { el.style.color = 'var(--am26-primary,#2a5bff)'; });
                el.addEventListener('mouseleave', () => { el.style.color = 'var(--am26-text-soft,#505a74)'; });
            });

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
                        // 计算日志区域可用高度：额外预留 100px 给下方配置区，避免遮挡
                        const availableHeight = screenHeight - 40 - 300;
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
                    const availableHeight = screenHeight - 40 - 300;
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
            resizerLeft.onmouseenter = () => resizerLeft.style.background = 'rgba(42,91,255,0.28)';
            resizerLeft.onmouseleave = () => resizerLeft.style.background = 'transparent';
            panel.appendChild(resizerLeft);

            // 底部拖拽条（调整高度）
            const resizerBottom = document.createElement('div');
            resizerBottom.style.cssText = 'position:absolute;left:0;right:0;bottom:0;height:6px;cursor:ns-resize;z-index:10;';
            resizerBottom.onmouseenter = () => resizerBottom.style.background = 'rgba(42,91,255,0.28)';
            resizerBottom.onmouseleave = () => resizerBottom.style.background = 'transparent';
            panel.appendChild(resizerBottom);

            // 左下角（同时调整宽高）
            const resizerCorner = document.createElement('div');
            resizerCorner.style.cssText = 'position:absolute;left:0;bottom:0;width:12px;height:12px;cursor:nesw-resize;z-index:11;';
            resizerCorner.onmouseenter = () => resizerCorner.style.background = 'rgba(42,91,255,0.42)';
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
            // 如果没有 ID，使用通用 ID "GLOBAL"
            const realId = campaignId || '0';
            const realName = campaignId ? campaignName : '通用问答';

            const card = UI.createCampaignCard(realId, realName, index, total);
            if (!card) {
                Logger.error(`无法创建卡片: ${realId}`);
                return { success: false, msg: '创建卡片失败' };
            }

            Logger.info(`[${index}/${total}] ${realName}(${realId}) 开始处理...`);
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
        }
    };

    // ==================== 初始化 ====================
    TokenManager.hookXHR();

    // NOTE: 将 Token 引用暴露到全局，供万能查数弹窗等模块跨作用域读取
    window.__AM_TOKENS__ = State.tokens;

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

    // [INTEGRATED] Expose run campaign function for MagicReport
    window.__ALIMAMA_OPTIMIZER_RUN_CAMPAIGN__ = async (campaignId, customPrompt) => {
        // 覆盖配置
        userConfig.customPrompt = customPrompt || userConfig.customPrompt;

        // 确保 Token 就绪
        TokenManager.refresh();
        if (!State.tokens.loginPointId || !State.tokens.dynamicToken) {
            return { success: false, msg: 'Token 未就绪，请先在页面点击任意处' };
        }

        // 调用处理逻辑
        // 我们利用 ProcessCampaign，但把 UI 部分剥离或复用？
        // processCampaign 依赖 UI.createCampaignCard。
        // 为了 Magic Report，我们希望它仅仅返回结果，或者我们可以让 Logic 自己处理 UI。
        // 这里简单地调用 processCampaign，它会把日志输出到 Escort 面板。
        // 如果我们想要 Magic Report 独立显示，我们需要修改 Core.processCampaign 
        // 但为了最小化修改，我们暂时让它在后台跑，并返回结果。

        // 确保 ESCORT UI 存在（因为 ProcessCampaign 依赖 UI 创建卡片）
        if (!document.getElementById(CONFIG.UI_ID)) UI.create();

        // 强制展开 Escort 面板 (可选)
        // window.__ALIMAMA_OPTIMIZER_TOGGLE__();

        try {
            const res = await Core.processCampaign(campaignId, '万能查数任务', 1, 1);
            return res;
        } catch (e) {
            return { success: false, msg: e.message };
        }
    };
})();
